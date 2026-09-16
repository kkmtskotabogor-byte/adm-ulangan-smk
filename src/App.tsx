import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab, AuthUser, ExamConfig, ExamRoom, ExamScheduleItem, Proctor, Student } from './types';
import { initialConfig, initialProctors, initialRooms, initialSchedule, initialStudents } from './data/initialData';
import { 
  distributeCrossClass, 
  distributeSequential, 
  generateExamNumbers, 
  distributeCrossLevelDoubleDesk,
  applySmkYak1RoomRule,
  extractTingkat,
  DEFAULT_MAJOR_1,
  DEFAULT_MAJOR_2
} from './utils/distribution';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ConfigView } from './components/ConfigView';
import { StudentsView } from './components/StudentsView';
import { RoomsView } from './components/RoomsView';
import { ProctorsView } from './components/ProctorsView';
import { SeatingChartView } from './components/SeatingChartView';
import { ExamCardsView } from './components/ExamCardsView';
import { ExamDocumentsView } from './components/ExamDocumentsView';
import { ScheduleManagementView } from './components/ScheduleManagementView';
import { LoginPortal } from './components/LoginPortal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { StudentTransferModal } from './components/StudentTransferModal';
import {
  subscribeToExamConfig,
  saveExamConfigToCloud,
  subscribeToRooms,
  saveRoomToCloud,
  deleteRoomFromCloud,
  syncRoomsToCloud,
  subscribeToStudents,
  saveStudentToCloud,
  deleteStudentFromCloud,
  deleteStudentsBatchFromCloud,
  clearAllStudentsFromCloud,
  syncStudentsToCloud,
  subscribeToProctors,
  saveProctorToCloud,
  deleteProctorFromCloud,
  syncProctorsToCloud,
  subscribeToSchedules,
  syncSchedulesToCloud,
  clearAllSchedulesFromCloud,
  subscribeToAttendanceRecords,
  isCloudDatabaseInitialized,
  subscribeToMasterState,
  saveMasterStateToCloud,
  getMasterStateFromCloud,
  getLocalDeviceId,
  getIsCloudQuotaExhausted,
  setIsCloudQuotaExhausted,
  testConnection,
} from './lib/firebase';
import { ProctorAttendanceRecord } from './types';

const STORAGE_KEYS = {
  CONFIG: 'sim_ujian_config_mts_v3',
  STUDENTS: 'sim_ujian_students_mts_v2',
  ROOMS: 'sim_ujian_rooms_mts_v2',
  PROCTORS: 'sim_ujian_proctors_mts_v2',
  SCHEDULES: 'sim_ujian_schedules_smk_yak_v4',
  AUTH_USER: 'sim_ujian_auth_user_v2',
};

export default function App() {
  // Load auth state from localStorage
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Check URL parameters for direct print bypass or tab
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoPrint') === 'true' || params.get('print') === 'true') {
        return {
          id: 'user-admin-print',
          username: 'admin',
          name: 'Administrator Panitia Ujian',
          role: 'admin',
          roleLabel: 'Panitia Ujian (Admin)',
          loginTime: '08:00',
        };
      }
    }
    return null;
  });

  // Load from localStorage or initial defaults
  const [config, setConfig] = useState<ExamConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : initialConfig;
  });

  const [rooms, setRooms] = useState<ExamRoom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const [proctors, setProctors] = useState<Proctor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROCTORS);
    return saved ? JSON.parse(saved) : initialProctors;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      try {
        const parsed: Student[] = JSON.parse(saved);
        // Verify if all rooms have all grade levels (semua tingkat) and follow the multiples-of-5 rule.
        // If existing saved data has single-tingkat rooms or non-multiple-of-5 allocations in regular rooms,
        // auto-redistribute so the user gets the optimal multiples-of-5 composition with sisa in last room immediately!
        const tingkatsInSchool = new Set(parsed.map((s) => extractTingkat(s.className)));
        if (tingkatsInSchool.size > 1) {
          const roomTingkatMap = new Map<string, Map<string, number>>();
          parsed.forEach((s) => {
            if (s.roomId) {
              if (!roomTingkatMap.has(s.roomId)) roomTingkatMap.set(s.roomId, new Map());
              const t = extractTingkat(s.className);
              const tMap = roomTingkatMap.get(s.roomId)!;
              tMap.set(t, (tMap.get(t) || 0) + 1);
            }
          });

          // Check if room-1 (regular room) has non-multiple-of-5 counts
          const room1Map = roomTingkatMap.get('room-1') || roomTingkatMap.get(initialRooms[0]?.id);
          const hasNonMultipleOfFive = room1Map
            ? Array.from(room1Map.values()).some((c) => c % 5 !== 0)
            : false;

          const hasSingleTingkatRoom = Array.from(roomTingkatMap.values()).some(
            (tMap) => tMap.size === 1
          );

          if (hasSingleTingkatRoom || hasNonMultipleOfFive) {
            const { updatedStudents } = distributeCrossClass(parsed, initialRooms);
            return updatedStudents;
          }
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing stored students:', e);
      }
    }
    // Pre-distribute initial students using Cross-Class so user gets an instant ready-to-test preview with all tingkats in every room
    const { updatedStudents } = distributeCrossClass(initialStudents, initialRooms);
    return updatedStudents;
  });

  const [schedules, setSchedules] = useState<ExamScheduleItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    return saved ? JSON.parse(saved) : initialSchedule;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as ActiveTab;
      if (tab && ['dashboard', 'config', 'students', 'rooms', 'proctors', 'schedules', 'seating', 'cards', 'documents'].includes(tab)) {
        return tab;
      }
    }
    return 'dashboard';
  });
  const [selectedRoomForSeating, setSelectedRoomForSeating] = useState<string>(rooms[0]?.id || '');
  const [notification, setNotification] = useState<string | null>(null);

  // Cloud Firestore Real-time Synchronization States
  const [attendanceRecords, setAttendanceRecords] = useState<ProctorAttendanceRecord[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState<boolean>(false);

  // Cross-Room Student Transfer & Desk Editing Modal States
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferInitialStudentId, setTransferInitialStudentId] = useState<string | undefined>(undefined);
  const [transferInitialRoomId, setTransferInitialRoomId] = useState<string | undefined>(undefined);
  const [transferInitialSeatNumber, setTransferInitialSeatNumber] = useState<number | undefined>(undefined);

  const handleOpenTransferModal = (studentId?: string, roomId?: string, seatNumber?: number) => {
    setTransferInitialStudentId(studentId);
    setTransferInitialRoomId(roomId || selectedRoomForSeating || rooms[0]?.id);
    setTransferInitialSeatNumber(seatNumber);
    setShowTransferModal(true);
  };

  // Check URL query parameters for autoPrint when opened in a new tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoPrint') === 'true' || params.get('print') === 'true') {
        const timer = setTimeout(() => {
          try {
            window.print();
          } catch (err) {
            console.warn('Auto print error:', err);
          }
        }, 900);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // 1. Initialize Cloud Firestore Database & Subscribe to Real-Time Updates (Atomic Master State Bundle)
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Check Cloud Master State first to synchronize any existing remote data to this device immediately
    getMasterStateFromCloud()
      .then((masterState) => {
        if (masterState) {
          const myDevId = getLocalDeviceId();
          // If master state exists in cloud and was saved, load it so this device matches other devices
          if (masterState.config) setConfig(masterState.config);
          if (masterState.rooms && masterState.rooms.length > 0) setRooms(masterState.rooms);
          if (masterState.students && masterState.students.length > 0) setStudents(masterState.students);
          if (masterState.proctors && masterState.proctors.length > 0) setProctors(masterState.proctors);
          if (masterState.schedules && masterState.schedules.length > 0) setSchedules(masterState.schedules);
          if (masterState.attendanceRecords) setAttendanceRecords(masterState.attendanceRecords);
          setIsCloudConnected(true);
        } else {
          // Cloud database empty: only write master state if quota is not reached
          if (!getIsCloudQuotaExhausted()) {
            isCloudDatabaseInitialized().then((isInitialized) => {
              if (!isInitialized) {
                saveMasterStateToCloud({
                  config,
                  students,
                  rooms,
                  proctors,
                  schedules,
                  attendanceRecords,
                }).catch(() => {});
              }
            }).catch(() => {});
          }
        }
      })
      .catch((err) => {
        console.warn('Master state cloud check note:', err);
      });

    try {
      // Real-time listener for Atomic Master State (Cross-Device instant sync)
      unsubs.push(
        subscribeToMasterState(
          (masterState) => {
            if (masterState) {
              const myDevId = getLocalDeviceId();
              // Only apply if the update was pushed by another device
              if (masterState.deviceId !== myDevId) {
                if (masterState.config) setConfig(masterState.config);
                if (masterState.rooms && masterState.rooms.length > 0) setRooms(masterState.rooms);
                if (masterState.students && masterState.students.length > 0) setStudents(masterState.students);
                if (masterState.proctors && masterState.proctors.length > 0) setProctors(masterState.proctors);
                if (masterState.schedules && masterState.schedules.length > 0) setSchedules(masterState.schedules);
                if (masterState.attendanceRecords) setAttendanceRecords(masterState.attendanceRecords);
                setIsCloudConnected(true);
                showToast(
                  `Data diperbarui dari perangkat lain (${new Date(masterState.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                );
              }
            }
          },
          () => setIsCloudConnected(false)
        )
      );

      // Real-time listener for Exam Identity Config
      unsubs.push(
        subscribeToExamConfig(
          (cloudConfig) => {
            if (cloudConfig) {
              setConfig(cloudConfig);
              setIsCloudConnected(true);
            }
          },
          () => setIsCloudConnected(false)
        )
      );

      // Real-time listener for Exam Rooms
      unsubs.push(
        subscribeToRooms(
          (cloudRooms) => {
            if (cloudRooms && cloudRooms.length > 0) {
              setRooms(cloudRooms);
              setIsCloudConnected(true);
            }
          },
          () => setIsCloudConnected(false)
        )
      );

      // Real-time listener for Students
      unsubs.push(
        subscribeToStudents(
          (cloudStudents) => {
            if (cloudStudents && cloudStudents.length > 0) {
              setStudents(cloudStudents);
              setIsCloudConnected(true);
            }
          },
          () => setIsCloudConnected(false)
        )
      );

      // Real-time listener for Proctors
      unsubs.push(
        subscribeToProctors(
          (cloudProctors) => {
            if (cloudProctors && cloudProctors.length > 0) {
              setProctors(cloudProctors);
              setIsCloudConnected(true);
            }
          },
          () => setIsCloudConnected(false)
        )
      );

      // Real-time listener for Exam Schedules
      unsubs.push(
        subscribeToSchedules(
          (cloudSchedules) => {
            if (cloudSchedules) {
              const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
              // Accept cloud schedules if not empty, or if user explicitly stored empty schedule
              if (cloudSchedules.length > 0 || saved === '[]') {
                setSchedules(cloudSchedules);
              }
              setIsCloudConnected(true);
            }
          },
          () => setIsCloudConnected(false)
        )
      );

      // Real-time listener for Proctor Attendance & Digital Signatures
      unsubs.push(
        subscribeToAttendanceRecords(
          (records) => {
            if (records) {
              setAttendanceRecords(records);
            }
          },
          () => {}
        )
      );
    } catch (err) {
      console.warn('Firebase subscriptions setup note:', err);
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Ensure the official SMK YAK 1 STS schedule is active
  useEffect(() => {
    const isYak1Schedule = schedules.some((s) =>
      s.subject.toLowerCase().includes('koding') ||
      s.subject.toLowerCase().includes('manajemen logistik') ||
      (s.sessionTime === '13.00-14.00' && s.dayName === 'Senin')
    );
    if (!isYak1Schedule || schedules.length === 0) {
      setSchedules(initialSchedule);
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(initialSchedule));
      syncSchedulesToCloud(initialSchedule).catch((e) => console.warn('Cloud sync note:', e));
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROCTORS, JSON.stringify(proctors));
  }, [proctors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

  // Auto-heal any same-tingkat desks from previous cached sessions
  useEffect(() => {
    if (rooms.length > 0 && (rooms[0].capacity || 0) >= 40) {
      let hasConflict = false;
      for (const r of rooms) {
        const roomS = students.filter((s) => s.roomId === r.id);
        const half = Math.floor((r.capacity || 40) / 2);
        for (let i = 1; i <= half; i++) {
          const sLeft = roomS.find((s) => s.seatNumber === i);
          const sRight = roomS.find((s) => s.seatNumber === half + i);
          if (sLeft && sRight) {
            const tL = sLeft.className.replace(/\s*[A-Z0-9].*$/i, '').trim() || sLeft.className;
            const tR = sRight.className.replace(/\s*[A-Z0-9].*$/i, '').trim() || sRight.className;
            if (tL === tR) {
              hasConflict = true;
              break;
            }
          }
        }
        if (hasConflict) break;
      }
      if (hasConflict) {
        const { updatedStudents } = distributeCrossLevelDoubleDesk(students, rooms, 'photo_order');
        setStudents(updatedStudents);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const masterSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Unified Atomic Master State Sync Helper (Single Doc Write = Ultra-fast + Quota-safe)
  const pushMasterStateToCloud = (partial?: {
    config?: ExamConfig;
    students?: Student[];
    rooms?: ExamRoom[];
    proctors?: Proctor[];
    schedules?: ExamScheduleItem[];
    attendanceRecords?: ProctorAttendanceRecord[];
  }) => {
    if (getIsCloudQuotaExhausted()) return;
    if (masterSyncTimerRef.current) {
      clearTimeout(masterSyncTimerRef.current);
    }
    masterSyncTimerRef.current = setTimeout(() => {
      if (getIsCloudQuotaExhausted()) return;
      saveMasterStateToCloud({
        config: partial?.config ?? config,
        students: partial?.students ?? students,
        rooms: partial?.rooms ?? rooms,
        proctors: partial?.proctors ?? proctors,
        schedules: partial?.schedules ?? schedules,
        attendanceRecords: partial?.attendanceRecords ?? attendanceRecords,
      }).catch((err) => {
        console.warn('Auto master cloud sync note:', err);
      });
    }, 600);
  };

  // --- Cloud Synchronization Actions ---
  const handleForceSyncAllToCloud = async () => {
    setIsSyncing(true);
    try {
      if (getIsCloudQuotaExhausted()) {
        showToast('Batas kuota harian Cloud (Firebase Free Tier) sedang tercapai. Data tersimpan aman di perangkat.');
        return;
      }
      // 1. Atomic Master State Bundle (Guaranteed atomic cross-device sync in 1 single write)
      await saveMasterStateToCloud({
        config,
        students,
        rooms,
        proctors,
        schedules,
        attendanceRecords,
      });

      setIsCloudConnected(true);
      showToast('Seluruh data berhasil disinkronkan ke Cloud! Perangkat lain kini dapat melihat perubahan Anda.');
    } catch (err) {
      console.error('Failed to sync to cloud:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('resource-exhausted') || msg.includes('Quota limit exceeded') || msg.includes('Quota exceeded')) {
        showToast('Batas kuota Cloud harian tercapai. Silakan gunakan tombol Unduh Cadangan (.json) untuk transfer instan.');
      } else {
        showToast('Gagal sinkronisasi: ' + msg);
      }
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullLatestFromCloud = async () => {
    setIsSyncing(true);
    try {
      const masterState = await getMasterStateFromCloud();
      if (masterState) {
        if (masterState.config) setConfig(masterState.config);
        if (masterState.rooms && masterState.rooms.length > 0) setRooms(masterState.rooms);
        if (masterState.students && masterState.students.length > 0) setStudents(masterState.students);
        if (masterState.proctors && masterState.proctors.length > 0) setProctors(masterState.proctors);
        if (masterState.schedules && masterState.schedules.length > 0) setSchedules(masterState.schedules);
        if (masterState.attendanceRecords) setAttendanceRecords(masterState.attendanceRecords);
        setIsCloudConnected(true);
        showToast('Berhasil menarik data terbaru dari Cloud!');
      } else {
        showToast('Belum ada data master tersimpan di Cloud.');
      }
    } catch (err) {
      showToast('Gagal menarik data cloud: ' + (err instanceof Error ? err.message : String(err)));
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFullState = (importedData: any) => {
    if (!importedData || typeof importedData !== 'object') {
      showToast('Format file cadangan tidak valid.');
      return;
    }
    const nextConfig = importedData.config || config;
    const nextRooms = Array.isArray(importedData.rooms) && importedData.rooms.length > 0 ? importedData.rooms : rooms;
    const nextStudents = Array.isArray(importedData.students) && importedData.students.length > 0 ? importedData.students : students;
    const nextProctors = Array.isArray(importedData.proctors) && importedData.proctors.length > 0 ? importedData.proctors : proctors;
    const nextSchedules = Array.isArray(importedData.schedules) && importedData.schedules.length > 0 ? importedData.schedules : schedules;
    const nextAttendance = Array.isArray(importedData.attendanceRecords) ? importedData.attendanceRecords : attendanceRecords;

    setConfig(nextConfig);
    setRooms(nextRooms);
    setStudents(nextStudents);
    setProctors(nextProctors);
    setSchedules(nextSchedules);
    setAttendanceRecords(nextAttendance);

    pushMasterStateToCloud({
      config: nextConfig,
      students: nextStudents,
      rooms: nextRooms,
      proctors: nextProctors,
      schedules: nextSchedules,
      attendanceRecords: nextAttendance,
    });

    showToast(`Berhasil mengimpor data: ${nextStudents.length} peserta & ${nextRooms.length} ruangan diterapkan!`);
  };

  // --- Handlers ---
  const handleSaveConfig = async (updated: ExamConfig) => {
    setConfig(updated);
    try {
      await saveExamConfigToCloud(updated);
      showToast('Konfigurasi identitas ujian & media tersinkron ke semua perangkat.');
    } catch (err: any) {
      console.warn('Cloud config save note:', err);
      showToast('Tersimpan di perangkat ini. Menunggu koneksi cloud: ' + (err?.message || 'Offline'));
    }
  };

  const handleAddStudent = (newStudent: Omit<Student, 'id'>) => {
    const student: Student = {
      ...newStudent,
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setStudents((prev) => [...prev, student]);
    saveStudentToCloud(student).catch((err) => console.warn('Cloud student save note:', err));
    showToast(`Siswa "${student.name}" berhasil ditambahkan.`);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    saveStudentToCloud(updatedStudent).catch((err) => console.warn('Cloud student update note:', err));
    showToast(`Data siswa "${updatedStudent.name}" diperbarui.`);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    deleteStudentFromCloud(id).catch((err) => console.warn('Cloud student delete note:', err));
    showToast('Siswa berhasil dihapus.');
  };

  const handleBulkDeleteStudents = (ids: string[]) => {
    if (ids.length === 0) return;
    const idsSet = new Set(ids);
    const updated = students.filter((s) => !idsSet.has(s.id));
    setStudents(updated);
    deleteStudentsBatchFromCloud(ids).catch((err) => console.warn('Cloud batch delete note:', err));
    showToast(`Berhasil menghapus ${ids.length} data peserta secara kolektif.`);
  };

  const handleClearAllStudents = () => {
    setStudents([]);
    clearAllStudentsFromCloud().catch((err) => console.warn('Cloud clear students note:', err));
    showToast('Seluruh data peserta ujian berhasil dikosongkan.');
  };

  const handleBulkImport = (newStudents: Omit<Student, 'id'>[]) => {
    const created: Student[] = newStudents.map((s, idx) => ({
      ...s,
      id: `std-import-${Date.now()}-${idx}`,
    }));
    const nextStudents = [...students, ...created];
    setStudents(nextStudents);
    syncStudentsToCloud(nextStudents).catch((err) => console.warn('Cloud bulk import note:', err));
    showToast(`Berhasil menambahkan ${created.length} siswa baru dari Excel.`);
  };

  const handleRegenerateNumbers = () => {
    const updated = generateExamNumbers(students, config.codePrefix || '25-04');
    setStudents(updated);
    syncStudentsToCloud(updated).catch((err) => console.warn('Cloud regenerate note:', err));
    showToast('Nomor peserta berhasil di-generate otomatis per kelas/rombel.');
  };

  const handleAddRoom = (newRoom: Omit<ExamRoom, 'id'>) => {
    const room: ExamRoom = {
      ...newRoom,
      id: `room-${Date.now()}`,
    };
    setRooms((prev) => [...prev, room]);
    saveRoomToCloud(room).catch((err) => console.warn('Cloud room save note:', err));
    showToast(`Ruang "${room.name}" berhasil ditambahkan.`);
  };

  const handleUpdateRoom = (updatedRoom: ExamRoom) => {
    setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    saveRoomToCloud(updatedRoom).catch((err) => console.warn('Cloud room update note:', err));
    showToast(`Data ${updatedRoom.name} diperbarui.`);
  };

  const handleDeleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    deleteRoomFromCloud(id).catch((err) => console.warn('Cloud room delete note:', err));
    // Clear assignments for students in deleted room
    setStudents((prev) => {
      const updated = prev.map((s) => (s.roomId === id ? { ...s, roomId: undefined, roomName: undefined, seatNumber: undefined } : s));
      syncStudentsToCloud(updated).catch(() => {});
      return updated;
    });
    showToast('Ruang berhasil dihapus dan peserta di dalamnya dikosongkan.');
  };

  // --- Proctor Handlers ---
  const handleSyncRoomsWithProctors = (updatedProctors: Proctor[]) => {
    setProctors(updatedProctors);
    syncProctorsToCloud(updatedProctors).catch((err) => console.warn('Cloud proctors sync note:', err));
    // Automatically update proctor in rooms
    setRooms((prevRooms) => {
      const nextRooms = prevRooms.map((room) => {
        const p1 = updatedProctors.find((p) => p.assignedRoomId === room.id);
        return {
          ...room,
          proctor1: p1 ? p1.name : room.proctor1,
          proctor2: undefined,
        };
      });
      syncRoomsToCloud(nextRooms).catch((err) => console.warn('Cloud rooms sync note:', err));
      return nextRooms;
    });
  };

  const handleAddProctor = (newProctor: Omit<Proctor, 'id'>) => {
    const proctor: Proctor = {
      ...newProctor,
      id: `prc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [...proctors, proctor];
    handleSyncRoomsWithProctors(updated);
    showToast(`Pengawas "${proctor.name}" berhasil ditambahkan.`);
  };

  const handleUpdateProctor = (updatedProctor: Proctor) => {
    const updated = proctors.map((p) => (p.id === updatedProctor.id ? updatedProctor : p));
    handleSyncRoomsWithProctors(updated);
    showToast(`Data pengawas "${updatedProctor.name}" diperbarui.`);
  };

  const handleDeleteProctor = (id: string) => {
    const updated = proctors.filter((p) => p.id !== id);
    deleteProctorFromCloud(id).catch((err) => console.warn('Cloud proctor delete note:', err));
    handleSyncRoomsWithProctors(updated);
    showToast('Pengawas berhasil dihapus.');
  };

  const handleBulkAddProctors = (newProctors: Omit<Proctor, 'id'>[], replaceExisting: boolean = false) => {
    const created: Proctor[] = newProctors.map((p, idx) => ({
      ...p,
      id: `prc-import-${Date.now()}-${idx}`,
    }));
    const updated = replaceExisting ? created : [...proctors, ...created];
    handleSyncRoomsWithProctors(updated);
    showToast(
      replaceExisting
        ? `Berhasil mengganti data dengan ${created.length} pengawas baru dari Excel.`
        : `Berhasil menambahkan ${created.length} pengawas baru dari Excel.`
    );
  };

  const handleResetProctors = () => {
    handleSyncRoomsWithProctors(initialProctors);
    showToast('Data pengawas berhasil di-reset ke data pengawas standar.');
  };

  // Distribution triggers with strict Program Studi partitioning (Ruang 1-5 = Prodi 1, Ruang 6+ = Prodi 2)
  const handleDistributeCross = () => {
    const m1 = config.major1Name || DEFAULT_MAJOR_1;
    const m2 = config.major2Name || DEFAULT_MAJOR_2;
    const { updatedStudents, unassignedStudents } = distributeCrossClass(students, rooms, m1, m2);
    setStudents(updatedStudents);
    pushMasterStateToCloud({ students: updatedStudents });
    if (unassignedStudents.length > 0) {
      showToast(`Sistem Silang Kelipatan 5 selesai! Catatan: ${unassignedStudents.length} siswa belum dapat ruang.`);
    } else {
      showToast(`Sistem Silang berhasil! Komposisi per tingkat kelipatan 5 di setiap ruang, dan siswa sisa dialokasikan di ruangan terakhir prodi.`);
    }
  };

  const handleDistributeSequential = () => {
    const m1 = config.major1Name || DEFAULT_MAJOR_1;
    const m2 = config.major2Name || DEFAULT_MAJOR_2;
    const { updatedStudents, unassignedStudents } = distributeSequential(students, rooms, m1, m2);
    setStudents(updatedStudents);
    pushMasterStateToCloud({ students: updatedStudents });
    if (unassignedStudents.length > 0) {
      showToast(`Pembagian Berurutan selesai! Catatan: ${unassignedStudents.length} siswa belum dapat ruang.`);
    } else {
      showToast(`Pembagian berurutan per rombel berhasil dialokasikan per Program Studi (R.01-05 & R.06+).`);
    }
  };

  const handleDistributeCrossLevel = (pattern: 'photo_order' | 'sequential_desk' = 'photo_order') => {
    const m1 = config.major1Name || DEFAULT_MAJOR_1;
    const m2 = config.major2Name || DEFAULT_MAJOR_2;

    // If rooms currently have capacity 20, bump them up to 40 so that 40 students fit per room
    let currentRooms = rooms;
    if (rooms.length > 0 && (rooms[0].capacity || 0) < 40) {
      currentRooms = rooms.slice(0, 12).map((r, idx) => {
        const match = (r.roomCode || r.name || '').match(/\d+/);
        const roomNum = match ? parseInt(match[0], 10) : idx + 1;
        const major = r.major || (roomNum <= 5 ? m1 : m2);
        return {
          ...r,
          roomCode: `R.${String(idx + 1).padStart(2, '0')}`,
          name: `Ruang ${String(idx + 1).padStart(2, '0')}`,
          capacity: 40,
          major,
        };
      });
      setRooms(currentRooms);
    }

    const { updatedStudents, unassignedStudents } = distributeCrossLevelDoubleDesk(
      students, 
      currentRooms, 
      pattern,
      m1,
      m2
    );
    setStudents(updatedStudents);
    pushMasterStateToCloud({ students: updatedStudents, rooms: currentRooms });
    if (unassignedStudents.length > 0) {
      showToast(`Plotting Silang Antar-Tingkat selesai! Catatan: ${unassignedStudents.length} siswa belum dapat ruang.`);
    } else {
      showToast(`Plotting Silang Antar-Tingkat (40 Siswa) berhasil dipisah: Ruang 01-05 (${m1}) & Ruang 06+ (${m2})!`);
    }
  };

  const handleApplySmkYak1Rule = () => {
    const m1 = config.major1Name || DEFAULT_MAJOR_1;
    const m2 = config.major2Name || DEFAULT_MAJOR_2;
    const updatedRooms = applySmkYak1RoomRule(rooms, m1, m2);
    setRooms(updatedRooms);

    const isDouble = updatedRooms.length > 0 && (updatedRooms[0].capacity || 0) >= 40;
    const { updatedStudents, unassignedStudents } = isDouble
      ? distributeCrossLevelDoubleDesk(students, updatedRooms, 'photo_order', m1, m2)
      : distributeCrossClass(students, updatedRooms, m1, m2);

    setStudents(updatedStudents);
    pushMasterStateToCloud({ students: updatedStudents, rooms: updatedRooms });
    if (unassignedStudents.length > 0) {
      showToast(`Aturan Program Studi diterapkan: Ruang 01-05 (${m1}) & Ruang 06+ (${m2}). ${unassignedStudents.length} siswa perlu kapasitas ruang tambahan.`);
    } else {
      showToast(`Aturan Program Studi berhasil diterapkan! Ruang 01-05 untuk ${m1}, Ruang 06+ untuk ${m2}.`);
    }
  };

  const handleSetRoomsPreset = (presetCapacity: 20 | 40) => {
    const m1 = config.major1Name || DEFAULT_MAJOR_1;
    const m2 = config.major2Name || DEFAULT_MAJOR_2;
    if (presetCapacity === 40) {
      const updatedRooms: ExamRoom[] = rooms.slice(0, 12).map((r, idx) => {
        const match = (r.roomCode || r.name || '').match(/\d+/);
        const roomNum = match ? parseInt(match[0], 10) : idx + 1;
        return {
          ...r,
          roomCode: `R.${String(idx + 1).padStart(2, '0')}`,
          name: `Ruang ${String(idx + 1).padStart(2, '0')}`,
          capacity: 40,
          major: r.major || (roomNum <= 5 ? m1 : m2),
        };
      });
      setRooms(updatedRooms);
      const { updatedStudents } = distributeCrossLevelDoubleDesk(students, updatedRooms, 'photo_order', m1, m2);
      setStudents(updatedStudents);
      pushMasterStateToCloud({ students: updatedStudents, rooms: updatedRooms });
      showToast(`Kapasitas diset 40 siswa (12 Ruang) dengan Pemisahan: Ruang 01-05 (${m1}) & Ruang 06+ (${m2})!`);
    } else {
      const updatedRooms: ExamRoom[] = Array.from({ length: 24 }, (_, idx) => {
        const existing = rooms[idx];
        const roomNum = idx + 1;
        return {
          id: existing?.id || `room-${idx + 1}`,
          roomCode: `R.${String(roomNum).padStart(2, '0')}`,
          name: `Ruang ${String(roomNum).padStart(2, '0')}`,
          location: existing?.location || `Gedung A - R.${String(roomNum).padStart(2, '0')}`,
          capacity: 20,
          major: existing?.major || (roomNum <= 5 ? m1 : m2),
          proctor1: existing?.proctor1 || 'Guru Pengawas',
        };
      });
      setRooms(updatedRooms);
      const { updatedStudents } = distributeCrossClass(students, updatedRooms, m1, m2);
      setStudents(updatedStudents);
      pushMasterStateToCloud({ students: updatedStudents, rooms: updatedRooms });
      showToast(`Kapasitas diset 20 siswa (24 Ruang) dengan Pemisahan: Ruang 01-05 (${m1}) & Ruang 06+ (${m2})!`);
    }
  };

  const handleClearDistribution = () => {
    const cleared = students.map((s) => ({
      ...s,
      roomId: undefined,
      roomName: undefined,
      seatNumber: undefined,
    }));
    setStudents(cleared);
    pushMasterStateToCloud({ students: cleared });
    showToast('Seluruh penempatan ruang dan nomor meja telah dikosongkan.');
  };

  // Swap Seats between two students
  const handleSwapSeats = (studentId1: string, studentId2: string) => {
    setStudents((prev) => {
      const s1 = prev.find((s) => s.id === studentId1);
      const s2 = prev.find((s) => s.id === studentId2);
      if (!s1 || !s2) return prev;

      const swapped = prev.map((s) => {
        if (s.id === studentId1) {
          return {
            ...s,
            roomId: s2.roomId,
            roomName: s2.roomName,
            seatNumber: s2.seatNumber,
          };
        }
        if (s.id === studentId2) {
          return {
            ...s,
            roomId: s1.roomId,
            roomName: s1.roomName,
            seatNumber: s1.seatNumber,
          };
        }
        return s;
      });
      pushMasterStateToCloud({ students: swapped });
      return swapped;
    });

    showToast('Posisi tempat duduk kedua siswa berhasil ditukar.');
  };

  // Move a single student to a specific room & seat with conflict handling
  const handleMoveStudentToRoom = (
    studentId: string,
    targetRoomId: string,
    targetSeatNumber?: number,
    conflictMode: 'swap' | 'shift' | 'unassign' = 'swap'
  ) => {
    setStudents((prev) => {
      const studentToMove = prev.find((s) => s.id === studentId);
      const targetRoom = rooms.find((r) => r.id === targetRoomId);
      if (!studentToMove || !targetRoom) return prev;

      const oldRoomId = studentToMove.roomId;
      const oldRoomName = studentToMove.roomName;
      const oldSeatNumber = studentToMove.seatNumber;

      // Determine final target seat number
      let finalSeatNumber = targetSeatNumber;
      if (!finalSeatNumber || finalSeatNumber <= 0) {
        // Find first empty seat in target room
        const occupied = new Set(
          prev
            .filter((s) => s.roomId === targetRoomId && s.id !== studentId && s.seatNumber)
            .map((s) => s.seatNumber as number)
        );
        for (let i = 1; i <= (targetRoom.capacity || 20); i++) {
          if (!occupied.has(i)) {
            finalSeatNumber = i;
            break;
          }
        }
        if (!finalSeatNumber) finalSeatNumber = targetRoom.capacity || 20;
      }

      // Check if target seat is occupied by another student
      const conflictingStudent = prev.find(
        (s) => s.roomId === targetRoomId && s.seatNumber === finalSeatNumber && s.id !== studentId
      );

      let nextStudents: Student[] = [];

      if (conflictingStudent) {
        if (conflictMode === 'swap') {
          // Swap positions
          nextStudents = prev.map((s) => {
            if (s.id === studentId) {
              return {
                ...s,
                roomId: targetRoom.id,
                roomName: targetRoom.name,
                seatNumber: finalSeatNumber,
              };
            }
            if (s.id === conflictingStudent.id) {
              return {
                ...s,
                roomId: oldRoomId,
                roomName: oldRoomName,
                seatNumber: oldSeatNumber,
              };
            }
            return s;
          });
        } else if (conflictMode === 'shift') {
          // Shift conflicting student to next empty seat
          const occupied = new Set(
            prev
              .filter((s) => s.roomId === targetRoomId && s.id !== studentId && s.id !== conflictingStudent.id && s.seatNumber)
              .map((s) => s.seatNumber as number)
          );
          occupied.add(finalSeatNumber);
          let nextEmptySeat = 1;
          while (occupied.has(nextEmptySeat)) {
            nextEmptySeat++;
          }

          nextStudents = prev.map((s) => {
            if (s.id === studentId) {
              return {
                ...s,
                roomId: targetRoom.id,
                roomName: targetRoom.name,
                seatNumber: finalSeatNumber,
              };
            }
            if (s.id === conflictingStudent.id) {
              return {
                ...s,
                roomId: targetRoom.id,
                roomName: targetRoom.name,
                seatNumber: nextEmptySeat,
              };
            }
            return s;
          });
        } else {
          // Unassign conflicting student
          nextStudents = prev.map((s) => {
            if (s.id === studentId) {
              return {
                ...s,
                roomId: targetRoom.id,
                roomName: targetRoom.name,
                seatNumber: finalSeatNumber,
              };
            }
            if (s.id === conflictingStudent.id) {
              return {
                ...s,
                roomId: undefined,
                roomName: undefined,
                seatNumber: undefined,
              };
            }
            return s;
          });
        }
      } else {
        // No conflict
        nextStudents = prev.map((s) => {
          if (s.id === studentId) {
            return {
              ...s,
              roomId: targetRoom.id,
              roomName: targetRoom.name,
              seatNumber: finalSeatNumber,
            };
          }
          return s;
        });
      }

      pushMasterStateToCloud({ students: nextStudents });
      return nextStudents;
    });

    const student = students.find((s) => s.id === studentId);
    const room = rooms.find((r) => r.id === targetRoomId);
    showToast(`Peserta "${student?.name || 'Siswa'}" berhasil dipindahkan ke ${room?.name || 'ruang tujuan'}.`);
  };

  // Unassign student from room
  const handleUnassignStudent = (studentId: string) => {
    setStudents((prev) => {
      const next = prev.map((s) =>
        s.id === studentId ? { ...s, roomId: undefined, roomName: undefined, seatNumber: undefined } : s
      );
      pushMasterStateToCloud({ students: next });
      return next;
    });
    showToast('Peserta berhasil dikeluarkan dari ruang ujian.');
  };

  // Reorder seats sequentially in a room (1..N)
  const handleReorderRoomSeats = (roomId: string) => {
    setStudents((prev) => {
      const roomStudents = prev
        .filter((s) => s.roomId === roomId)
        .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999));

      const updatedMap = new Map<string, number>();
      roomStudents.forEach((s, idx) => {
        updatedMap.set(s.id, idx + 1);
      });

      const next = prev.map((s) => {
        if (s.roomId === roomId && updatedMap.has(s.id)) {
          return {
            ...s,
            seatNumber: updatedMap.get(s.id),
          };
        }
        return s;
      });

      pushMasterStateToCloud({ students: next });
      return next;
    });
    showToast('Nomor meja siswa di ruang ini berhasil dirapikan berurutan (1..N).');
  };

  // Reset to initial full realistic dataset
  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin memulihkan data SIM Ujian SMK YAK 1 (200 siswa, 10 ruang, jadwal resmi STS 20 sesi)?')) {
      const { updatedStudents } = distributeCrossClass(initialStudents, initialRooms);
      setConfig(initialConfig);
      setRooms(initialRooms);
      setProctors(initialProctors);
      setStudents(updatedStudents);
      setSchedules(initialSchedule);
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(STORAGE_KEYS.ROOMS);
      localStorage.removeItem(STORAGE_KEYS.PROCTORS);
      localStorage.removeItem(STORAGE_KEYS.SCHEDULES);

      // Force push to cloud
      saveExamConfigToCloud(initialConfig).catch(() => {});
      syncRoomsToCloud(initialRooms).catch(() => {});
      syncStudentsToCloud(updatedStudents).catch(() => {});
      syncProctorsToCloud(initialProctors).catch(() => {});
      syncSchedulesToCloud(initialSchedule).catch(() => {});

      showToast('Data aplikasi berhasil dikembalikan ke data awal lengkap dan disinkronkan ke cloud.');
    }
  };

  const handleQuickPrint = () => {
    setActiveTab('cards');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    setNotification(`Selamat datang, ${user.name}! Anda masuk sebagai ${user.roleLabel}.`);
    if (user.role === 'proctor') {
      setActiveTab('proctors');
    } else if (user.role === 'student') {
      setActiveTab('cards');
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    setNotification('Anda telah berhasil keluar dari sesi.');
  };

  // If user is not logged in, render Portal Utama Login
  if (!authUser) {
    return (
      <>
        <LoginPortal
          config={config}
          proctors={proctors}
          students={students}
          onLogin={handleLogin}
          isCloudConnected={isCloudConnected}
        />
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 no-print">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{notification}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfc] text-[#1a1a18] flex flex-col antialiased">
      {/* Navigation Header (Variation 3) */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        onQuickPrint={handleQuickPrint}
        authUser={authUser}
        onLogout={handleLogout}
        isCloudSynced={isCloudConnected}
        isSyncing={isSyncing}
        onOpenCloudSyncModal={() => setShowCloudSyncModal(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1a1a18] text-white px-4 py-3 shadow-[4px_4px_0px_#2e4cff] text-xs font-medium font-roboto-mono flex items-center gap-2 border border-[#1a1a18] animate-in fade-in slide-in-from-bottom-3 no-print">
          <span className="w-2 h-2 rounded-full bg-[#2e4cff]"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            config={config}
            students={students}
            rooms={rooms}
            schedules={schedules}
            setActiveTab={setActiveTab}
            onDistributeCross={handleDistributeCross}
            onDistributeSequential={handleDistributeSequential}
          />
        )}

        {activeTab === 'config' && (
          <ConfigView
            config={config}
            onSaveConfig={handleSaveConfig}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            config={config}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onBulkDeleteStudents={handleBulkDeleteStudents}
            onBulkImport={handleBulkImport}
            onRegenerateNumbers={handleRegenerateNumbers}
            onClearAll={handleClearAllStudents}
            onOpenTransferModal={handleOpenTransferModal}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomsView
            rooms={rooms}
            students={students}
            config={config}
            onAddRoom={handleAddRoom}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onDistributeCross={handleDistributeCross}
            onDistributeCrossLevel={handleDistributeCrossLevel}
            onDistributeSequential={handleDistributeSequential}
            onClearDistribution={handleClearDistribution}
            onSetRoomsPreset={handleSetRoomsPreset}
            onApplySmkYak1Rule={handleApplySmkYak1Rule}
            setActiveTab={setActiveTab}
            onSelectRoomForSeating={setSelectedRoomForSeating}
            onOpenTransferModal={handleOpenTransferModal}
          />
        )}

        {activeTab === 'proctors' && (
          <ProctorsView
            config={config}
            proctors={proctors}
            rooms={rooms}
            schedules={schedules}
            onAddProctor={handleAddProctor}
            onUpdateProctor={handleUpdateProctor}
            onDeleteProctor={handleDeleteProctor}
            onBulkAddProctors={handleBulkAddProctors}
            onResetProctors={handleResetProctors}
            onSyncRoomsWithProctors={handleSyncRoomsWithProctors}
          />
        )}

        {activeTab === 'schedules' && (
          <ScheduleManagementView
            config={config}
            schedules={schedules}
            students={students}
            onUpdateSchedules={(updatedSchedules) => {
              setSchedules(updatedSchedules);
              if (updatedSchedules.length === 0) {
                clearAllSchedulesFromCloud().catch((err) => {
                  console.warn('Failed to clear schedules from cloud:', err);
                });
                showToast('Jadwal ujian berhasil dikosongkan.');
              } else {
                syncSchedulesToCloud(updatedSchedules).catch((err) => {
                  console.warn('Failed to sync schedules to cloud:', err);
                });
                showToast(`Jadwal ujian berhasil diperbarui (${updatedSchedules.length} sesi)!`);
              }
            }}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'seating' && (
          <SeatingChartView
            config={config}
            rooms={rooms}
            students={students}
            selectedRoomId={selectedRoomForSeating || rooms[0]?.id || ''}
            onSelectRoom={setSelectedRoomForSeating}
            onSwapSeats={handleSwapSeats}
            onDistributeCrossLevel={handleDistributeCrossLevel}
            onNavigateTab={setActiveTab}
            onOpenTransferModal={handleOpenTransferModal}
            onMoveStudent={handleMoveStudentToRoom}
            onUnassignStudent={handleUnassignStudent}
            onReorderRoomSeats={handleReorderRoomSeats}
          />
        )}

        {activeTab === 'cards' && (
          <ExamCardsView
            config={config}
            students={students}
            rooms={rooms}
            schedules={schedules}
            onUpdateSchedules={(updatedSchedules) => {
              setSchedules(updatedSchedules);
              syncSchedulesToCloud(updatedSchedules).catch(() => {});
            }}
            onUpdateConfig={handleSaveConfig}
          />
        )}

        {activeTab === 'documents' && (
          <ExamDocumentsView
            config={config}
            students={students}
            rooms={rooms}
            schedules={schedules}
          />
        )}
      </main>

      {/* Cross-Room Student Transfer & Seating Arrangement Modal */}
      {showTransferModal && (
        <StudentTransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          students={students}
          rooms={rooms}
          config={config}
          initialStudentId={transferInitialStudentId}
          initialRoomId={transferInitialRoomId}
          initialSeatNumber={transferInitialSeatNumber}
          onMoveStudent={handleMoveStudentToRoom}
          onSwapStudents={handleSwapSeats}
          onUnassignStudent={handleUnassignStudent}
          onReorderRoomSeats={handleReorderRoomSeats}
        />
      )}

      {/* Cloud Firestore Multi-Device Sync Modal */}
      <CloudSyncModal
        isOpen={showCloudSyncModal}
        onClose={() => setShowCloudSyncModal(false)}
        config={config}
        students={students}
        rooms={rooms}
        proctors={proctors}
        schedules={schedules}
        attendanceRecords={attendanceRecords}
        isConnected={isCloudConnected}
        isSyncing={isSyncing}
        isQuotaExhausted={getIsCloudQuotaExhausted()}
        onResetQuotaCheck={() => {
          setIsCloudQuotaExhausted(false);
          testConnection().then((connected) => {
            setIsCloudConnected(connected);
            if (connected) {
              showToast('Koneksi Cloud Firestore berhasil terhubung kembali!');
            } else {
              showToast('Kuota Cloud masih penuh atau koneksi belum tersedia.');
            }
          });
        }}
        onForceSyncAllToCloud={handleForceSyncAllToCloud}
        onPullLatestFromCloud={handlePullLatestFromCloud}
        onImportFullState={handleImportFullState}
      />

      {/* Variation 3 App Footer */}
      <footer className="border-t-[1.5px] border-[#1a1a18] bg-[#fdfdfc] py-4 text-center text-xs font-roboto-mono text-[#1a1a18]/70 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Sistem Informasi Manajemen Ujian {config.schoolName || 'SMK YAK 1'}
          </span>
          <span>
            Mendukung Kurikulum Nasional • v2.0.26
          </span>
        </div>
      </footer>
    </div>
  );
}
