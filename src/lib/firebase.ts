import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ExamConfig,
  ExamRoom,
  Student,
  Proctor,
  ExamScheduleItem,
  ProctorAttendanceRecord,
  MasterExamState,
} from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with custom databaseId and ignoreUndefinedProperties
export const db = initializeFirestore(
  app,
  { ignoreUndefinedProperties: true },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

/**
 * Strips all undefined values recursively to ensure flawless Firestore writes
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// Error Handling Enum and Interface
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const QUOTA_EXHAUSTED_KEY = 'SIM_CLOUD_QUOTA_EXHAUSTED_TIME';

let isCloudQuotaExhausted = false;

export function getIsCloudQuotaExhausted(): boolean {
  if (isCloudQuotaExhausted) return true;
  if (typeof window !== 'undefined') {
    const recordedStr = localStorage.getItem(QUOTA_EXHAUSTED_KEY);
    if (recordedStr) {
      const recordedTime = parseInt(recordedStr, 10);
      // Firebase daily write limit resets periodically (within 24 hours)
      // Check if within 4 hours
      if (Date.now() - recordedTime < 4 * 60 * 60 * 1000) {
        isCloudQuotaExhausted = true;
        return true;
      } else {
        localStorage.removeItem(QUOTA_EXHAUSTED_KEY);
      }
    }
  }
  return false;
}

export function setIsCloudQuotaExhausted(value: boolean): void {
  isCloudQuotaExhausted = value;
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem(QUOTA_EXHAUSTED_KEY, Date.now().toString());
    } else {
      localStorage.removeItem(QUOTA_EXHAUSTED_KEY);
    }
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('Quota exceeded')
  ) {
    setIsCloudQuotaExhausted(true);
    console.warn('Firestore daily write quota reached for free tier. Switching safely to local storage mode.');
    return;
  }
  if (errMsg.includes('unavailable') || errMsg.includes('the client is offline')) {
    console.warn('Firestore backend currently offline/unavailable. Operating safely with local storage.');
    return;
  }

  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn(`Firestore [${operationType}] note on ${path}:`, errInfo.error);
}


// Connection Validation on Boot
export async function testConnection(): Promise<boolean> {
  if (getIsCloudQuotaExhausted()) return false;
  try {
    await getDocFromServer(doc(db, 'exam_config', 'current'));
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (
      errMsg.includes('resource-exhausted') ||
      errMsg.includes('Quota limit exceeded') ||
      errMsg.includes('Quota exceeded')
    ) {
      setIsCloudQuotaExhausted(true);
      return false;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    } else {
      console.info('Firebase connection tested:', errMsg);
    }
    return false;
  }
}

// Auto-run connection check
testConnection().catch(() => {});

// --- REAL-TIME LISTENERS & CRUD METHODS ---

// 1. Exam Configuration
export function subscribeToExamConfig(
  onUpdate: (config: ExamConfig | null) => void,
  onError?: (err: unknown) => void
) {
  const docRef = doc(db, 'exam_config', 'current');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as ExamConfig);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'exam_config/current');
    }
  );
}

export async function saveExamConfigToCloud(config: ExamConfig): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = 'exam_config/current';
  try {
    const docRef = doc(db, 'exam_config', 'current');
    // Ensure clean serializable object with no undefined fields
    const cleanConfig = cleanForFirestore({
      ...config,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleanConfig);
    console.info('Cloud exam_config saved successfully.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    if (!getIsCloudQuotaExhausted()) throw error;
  }
}

// 2. Exam Rooms
export function subscribeToRooms(
  onUpdate: (rooms: ExamRoom[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, 'rooms');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ExamRoom[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<ExamRoom, 'id'>) });
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'rooms');
    }
  );
}

export async function saveRoomToCloud(room: ExamRoom): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = `rooms/${room.id}`;
  try {
    const cleanData = cleanForFirestore({
      ...room,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'rooms', room.id), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    if (!getIsCloudQuotaExhausted()) throw error;
  }
}

export async function deleteRoomFromCloud(roomId: string): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = `rooms/${roomId}`;
  try {
    await deleteDoc(doc(db, 'rooms', roomId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncRoomsToCloud(rooms: ExamRoom[]): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  try {
    // Write in batches of up to 400
    const batchSize = 400;
    for (let i = 0; i < rooms.length; i += batchSize) {
      const chunk = rooms.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((r) => {
        const ref = doc(db, 'rooms', r.id);
        batch.set(ref, {
          ...r,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'rooms');
  }
}

// 3. Students
export function subscribeToStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, 'students');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Student[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Student, 'id'>) });
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'students');
    }
  );
}

export async function saveStudentToCloud(student: Student): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = `students/${student.id}`;
  try {
    const cleanData = cleanForFirestore({
      ...student,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'students', student.id), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = `students/${studentId}`;
  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteStudentsBatchFromCloud(studentIds: string[]): Promise<void> {
  if (!db || studentIds.length === 0 || getIsCloudQuotaExhausted()) return;
  try {
    const batchSize = 400;
    for (let i = 0; i < studentIds.length; i += batchSize) {
      const chunk = studentIds.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        batch.delete(doc(db, 'students', id));
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'students');
  }
}

export async function clearAllStudentsFromCloud(): Promise<void> {
  if (!db || getIsCloudQuotaExhausted()) return;
  try {
    const snap = await getDocs(collection(db, 'students'));
    const batchSize = 400;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
      const chunk = docs.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'students');
  }
}


export async function syncStudentsToCloud(students: Student[]): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  try {
    const batchSize = 400;
    for (let i = 0; i < students.length; i += batchSize) {
      const chunk = students.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((s) => {
        const ref = doc(db, 'students', s.id);
        const cleanData = cleanForFirestore({
          ...s,
          updatedAt: new Date().toISOString(),
        });
        batch.set(ref, cleanData);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'students');
  }
}

// 4. Proctors
export function subscribeToProctors(
  onUpdate: (proctors: Proctor[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, 'proctors');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Proctor[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Proctor, 'id'>) });
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'proctors');
    }
  );
}

export async function saveProctorToCloud(proctor: Proctor): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = `proctors/${proctor.id}`;
  try {
    const cleanData = cleanForFirestore({
      ...proctor,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'proctors', proctor.id), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    if (!getIsCloudQuotaExhausted()) throw error;
  }
}

export async function deleteProctorFromCloud(proctorId: string): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = `proctors/${proctorId}`;
  try {
    await deleteDoc(doc(db, 'proctors', proctorId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncProctorsToCloud(proctors: Proctor[]): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  try {
    const batchSize = 400;
    for (let i = 0; i < proctors.length; i += batchSize) {
      const chunk = proctors.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((p) => {
        const ref = doc(db, 'proctors', p.id);
        batch.set(ref, {
          ...p,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'proctors');
  }
}

// 5. Schedules
export function subscribeToSchedules(
  onUpdate: (schedules: ExamScheduleItem[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, 'schedules');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: (ExamScheduleItem & { orderIndex?: number })[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<ExamScheduleItem, 'id'>) });
      });
      // Sort by orderIndex to keep exact sequence as arranged or imported
      items.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'schedules');
    }
  );
}

export async function clearAllSchedulesFromCloud(): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  try {
    const snap = await getDocs(collection(db, 'schedules'));
    const batchSize = 400;
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += batchSize) {
      const chunk = docs.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'schedules');
  }
}

export async function syncSchedulesToCloud(schedules: ExamScheduleItem[]): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  try {
    const snap = await getDocs(collection(db, 'schedules'));
    const newIds = new Set(schedules.map((s) => s.id));
    const staleDocs = snap.docs.filter((d) => !newIds.has(d.id));

    const batchSize = 400;
    // 1. Delete all stale/removed docs so old schedules don't persist or reappear
    for (let i = 0; i < staleDocs.length; i += batchSize) {
      const chunk = staleDocs.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 2. Set/update active schedules with orderIndex
    for (let i = 0; i < schedules.length; i += batchSize) {
      const chunk = schedules.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((s, idx) => {
        const ref = doc(db, 'schedules', s.id);
        batch.set(ref, {
          ...s,
          orderIndex: i + idx,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'schedules');
  }
}

// 6. Attendance Records (Real-Time Digital Proctor Presensi)
export function subscribeToAttendanceRecords(
  onUpdate: (records: ProctorAttendanceRecord[]) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, 'attendance_records');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ProctorAttendanceRecord[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<ProctorAttendanceRecord, 'id'>) });
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'attendance_records');
    }
  );
}

export async function saveAttendanceRecordToCloud(
  record: ProctorAttendanceRecord
): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = `attendance_records/${record.id}`;
  try {
    const cleanData = cleanForFirestore({
      ...record,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'attendance_records', record.id), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    if (!getIsCloudQuotaExhausted()) throw error;
  }
}

export async function deleteAttendanceRecordFromCloud(recordId: string): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = `attendance_records/${recordId}`;
  try {
    await deleteDoc(doc(db, 'attendance_records', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 7. Proctor Schedule Matrix
export function subscribeToProctorMatrix(
  onUpdate: (matrix: Record<string, { proctorId?: string; proctorName: string; nip?: string }> | null) => void,
  onError?: (err: unknown) => void
) {
  const docRef = doc(db, 'proctor_matrix', 'current');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate(data.allocations || null);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'proctor_matrix/current');
    }
  );
}

export async function saveProctorMatrixToCloud(
  allocations: Record<string, { proctorId?: string; proctorName: string; nip?: string }>
): Promise<void> {
  if (getIsCloudQuotaExhausted()) return;
  const path = 'proctor_matrix/current';
  try {
    const cleanData = cleanForFirestore({
      id: 'current',
      allocations,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'proctor_matrix', 'current'), cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    if (!getIsCloudQuotaExhausted()) throw error;
  }
}

// Master check if Cloud Database is empty
export async function isCloudDatabaseInitialized(): Promise<boolean> {
  if (getIsCloudQuotaExhausted()) return true;
  try {
    const configSnap = await getDocFromServer(doc(db, 'exam_config', 'current'));
    if (configSnap.exists()) {
      return true;
    }
    const masterSnap = await getDocFromServer(doc(db, 'exam_state', 'master'));
    if (masterSnap.exists()) {
      return true;
    }
    const roomsSnap = await getDocs(collection(db, 'rooms'));
    return !roomsSnap.empty;
  } catch (err) {
    // If check fails (offline or transient error), do NOT assume uninitialized to avoid overwriting cloud
    console.warn('isCloudDatabaseInitialized check note:', err);
    return true;
  }
}

// Device Identification for loop-prevention and audit
export function getLocalDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('SIM_EXAM_DEVICE_ID');
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('SIM_EXAM_DEVICE_ID', id);
  }
  return id;
}

// 8. Master Exam State Bundle (Single Atomic Document for Instant Real-Time Cross-Device Sync)
// Saves quota by 99.5% (1 write vs 200+ writes) and guarantees atomic sync across phones & laptops
export function subscribeToMasterState(
  onUpdate: (state: MasterExamState) => void,
  onError?: (err: unknown) => void
) {
  const docRef = doc(db, 'exam_state', 'master');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as MasterExamState;
        onUpdate(data);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'exam_state/master');
    }
  );
}

export async function saveMasterStateToCloud(
  state: Omit<MasterExamState, 'id' | 'updatedAt' | 'deviceId'>
): Promise<void> {
  if (getIsCloudQuotaExhausted()) {
    console.warn('Skipping cloud master write because daily write quota is reached.');
    return;
  }
  const path = 'exam_state/master';
  try {
    const cleanData = cleanForFirestore({
      id: 'master',
      config: state.config,
      students: state.students,
      rooms: state.rooms,
      proctors: state.proctors,
      schedules: state.schedules,
      attendanceRecords: state.attendanceRecords || [],
      deviceId: getLocalDeviceId(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'exam_state', 'master'), cleanData);
    setIsCloudQuotaExhausted(false); // Successfully wrote, reset flag
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    if (!getIsCloudQuotaExhausted()) throw error;
  }
}

export async function getMasterStateFromCloud(): Promise<MasterExamState | null> {
  if (getIsCloudQuotaExhausted()) {
    return null;
  }
  try {
    const snap = await getDocFromServer(doc(db, 'exam_state', 'master'));
    if (snap.exists()) {
      return snap.data() as MasterExamState;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'exam_state/master');
    return null;
  }
}
