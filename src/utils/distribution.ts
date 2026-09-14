import { ExamRoom, Student } from '../types';

export const DEFAULT_MAJOR_1 = 'Administrasi Perkantoran (AP)';
export const DEFAULT_MAJOR_2 = 'Bisnis Digital & Pemasaran (BD)';

/**
 * Infers student's Program Studi from student.major or className.
 */
export function inferStudentMajor(
  studentOrClass: string | { major?: string; className: string },
  major1: string = DEFAULT_MAJOR_1,
  major2: string = DEFAULT_MAJOR_2
): string {
  if (typeof studentOrClass === 'object' && studentOrClass !== null) {
    if (studentOrClass.major && studentOrClass.major.trim()) {
      return studentOrClass.major.trim();
    }
  }
  const cls = (typeof studentOrClass === 'string' ? studentOrClass : studentOrClass?.className || '').toUpperCase();
  
  // Check Major 1 patterns (AP, OTKP, MPLB, ADM, PERKANTORAN)
  if (
    /\b(AP|OTKP|MPLB|ADM|PERKANTORAN)\b/i.test(cls) ||
    cls.includes('AP') ||
    cls.includes('OTKP') ||
    cls.includes('MPLB') ||
    cls.includes('ADM')
  ) {
    return major1;
  }
  
  // Check Major 2 patterns (BD, BDP, PM, BISNIS, PEMASARAN, DIGITAL)
  if (
    /\b(BD|BDP|PM|BISNIS|PEMASARAN|DIGITAL)\b/i.test(cls) ||
    cls.includes('BD') ||
    cls.includes('BDP') ||
    cls.includes('PM') ||
    cls.includes('BISNIS') ||
    cls.includes('PEMASARAN')
  ) {
    return major2;
  }

  // Substring / keyword check
  const m1Keywords = major1.replace(/[^a-zA-Z0-9]/g, ' ').split(/\s+/).filter((w) => w.length >= 2);
  const m2Keywords = major2.replace(/[^a-zA-Z0-9]/g, ' ').split(/\s+/).filter((w) => w.length >= 2);
  for (const kw of m1Keywords) {
    if (cls.includes(kw.toUpperCase())) return major1;
  }
  for (const kw of m2Keywords) {
    if (cls.includes(kw.toUpperCase())) return major2;
  }

  return major1;
}

export type MajorCategory = 'MAJOR_1' | 'MAJOR_2' | 'OTHER';

/**
 * Normalizes student or major string to canonical MAJOR_1, MAJOR_2, or OTHER
 */
export function getMajorCategory(
  item: string | { major?: string; className?: string } | undefined | null,
  major1Name: string = DEFAULT_MAJOR_1,
  major2Name: string = DEFAULT_MAJOR_2
): MajorCategory {
  if (!item) return 'OTHER';
  let str = '';
  if (typeof item === 'object') {
    str = item.major?.trim() || item.className?.trim() || '';
  } else {
    str = item.trim();
  }
  if (!str || str.toLowerCase() === 'semua') return 'OTHER';

  const low = str.toLowerCase();
  const m1Low = major1Name.toLowerCase();
  const m2Low = major2Name.toLowerCase();

  // Direct equality
  if (low === m1Low) return 'MAJOR_1';
  if (low === m2Low) return 'MAJOR_2';

  // Major 1 standard patterns (Administrasi Perkantoran, AP, OTKP, MPLB, ADM)
  if (
    /\b(ap|otkp|mplb|adm|perkantoran)\b/i.test(str) ||
    low.includes('perkantoran') ||
    low.includes('otkp') ||
    low.includes('mplb') ||
    low.includes('administrasi')
  ) {
    return 'MAJOR_1';
  }

  // Major 2 standard patterns (Bisnis Digital & Pemasaran, BD, BDP, PM, Bisnis, Pemasaran, Digital)
  if (
    /\b(bd|bdp|pm|bisnis|pemasaran|digital)\b/i.test(str) ||
    low.includes('bisnis') ||
    low.includes('pemasaran') ||
    low.includes('digital') ||
    low.includes('marketing')
  ) {
    return 'MAJOR_2';
  }

  // Keyword token matching
  const m1Words = m1Low.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);
  const m2Words = m2Low.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);
  for (const kw of m1Words) {
    if (low.includes(kw)) return 'MAJOR_1';
  }
  for (const kw of m2Words) {
    if (low.includes(kw)) return 'MAJOR_2';
  }

  return 'OTHER';
}

/**
 * Determines room's assigned major category.
 * Rule:
 * - If room.major is explicitly configured, respects it.
 * - By default: Ruang 1 - 5: Program Studi 1 (MAJOR_1), Ruang 6+: Program Studi 2 (MAJOR_2).
 */
export function getRoomMajorCategory(
  room: ExamRoom,
  roomIndex: number,
  major1Name: string = DEFAULT_MAJOR_1,
  major2Name: string = DEFAULT_MAJOR_2
): 'MAJOR_1' | 'MAJOR_2' {
  if (room.major && room.major !== 'Semua') {
    const cat = getMajorCategory(room.major, major1Name, major2Name);
    if (cat === 'MAJOR_1' || cat === 'MAJOR_2') {
      return cat;
    }
  }

  // Adhere strictly to rule: Ruang 1-5 = MAJOR_1, Ruang 6+ = MAJOR_2
  const match = (room.roomCode || room.name || '').match(/\d+/);
  const roomNum = match ? parseInt(match[0], 10) : roomIndex + 1;
  return roomNum <= 5 ? 'MAJOR_1' : 'MAJOR_2';
}

/**
 * Applies SMK YAK 1 default room partitioning:
 * Ruang 01 - 05: Program Studi 1 (Administrasi Perkantoran)
 * Ruang 06+: Program Studi 2 (Bisnis Digital & Pemasaran)
 */
export function applySmkYak1RoomRule(
  rooms: ExamRoom[],
  major1: string = DEFAULT_MAJOR_1,
  major2: string = DEFAULT_MAJOR_2
): ExamRoom[] {
  return rooms.map((room, idx) => {
    const match = (room.roomCode || room.name || '').match(/\d+/);
    const roomNum = match ? parseInt(match[0], 10) : idx + 1;
    const assignedMajor = roomNum <= 5 ? major1 : major2;
    return {
      ...room,
      major: assignedMajor,
    };
  });
}

/**
 * Checks if rooms have program studi partition specified.
 */
export function hasMajorPartition(rooms: ExamRoom[]): boolean {
  return rooms.length > 0;
}

/**
 * Higher-order partition distributor:
 * Isolates students and rooms by Program Studi:
 * Program Studi 1: Ruang 1-5
 * Program Studi 2: Ruang 6-seterusnya
 */
function partitionDistribution(
  students: Student[],
  rooms: ExamRoom[],
  distributorFn: (subStudents: Student[], subRooms: ExamRoom[]) => { updatedStudents: Student[]; unassignedStudents: Student[] },
  major1: string = DEFAULT_MAJOR_1,
  major2: string = DEFAULT_MAJOR_2
): { updatedStudents: Student[]; unassignedStudents: Student[] } {
  // Group rooms into Major 1 (Ruang 1-5) and Major 2 (Ruang 6+)
  const major1Rooms: ExamRoom[] = [];
  const major2Rooms: ExamRoom[] = [];

  rooms.forEach((r, idx) => {
    const cat = getRoomMajorCategory(r, idx, major1, major2);
    if (cat === 'MAJOR_1') {
      major1Rooms.push(r);
    } else {
      major2Rooms.push(r);
    }
  });

  // Group students into Major 1 and Major 2
  const major1Students: Student[] = [];
  const major2Students: Student[] = [];

  students.forEach((s) => {
    const cat = getMajorCategory(s, major1, major2);
    if (cat === 'MAJOR_1') {
      major1Students.push({ ...s });
    } else if (cat === 'MAJOR_2') {
      major2Students.push({ ...s });
    } else {
      // If ambiguous, infer from class name or default to Major 1
      const inferred = inferStudentMajor(s, major1, major2);
      if (getMajorCategory(inferred, major1, major2) === 'MAJOR_2') {
        major2Students.push({ ...s });
      } else {
        major1Students.push({ ...s });
      }
    }
  });

  const allAssignedStudents: Student[] = [];
  const allUnassignedStudents: Student[] = [];

  // 1. Distribute Program Studi 1 into Ruang 1 - 5
  if (major1Rooms.length > 0) {
    const result1 = distributorFn(major1Students, major1Rooms);
    allAssignedStudents.push(...result1.updatedStudents.filter((s) => s.roomId));
    allUnassignedStudents.push(...result1.unassignedStudents);
  } else {
    major1Students.forEach((s) => {
      allUnassignedStudents.push({ ...s, roomId: undefined, roomName: undefined, seatNumber: undefined });
    });
  }

  // 2. Distribute Program Studi 2 into Ruang 6+
  if (major2Rooms.length > 0) {
    const result2 = distributorFn(major2Students, major2Rooms);
    allAssignedStudents.push(...result2.updatedStudents.filter((s) => s.roomId));
    allUnassignedStudents.push(...result2.unassignedStudents);
  } else {
    major2Students.forEach((s) => {
      allUnassignedStudents.push({ ...s, roomId: undefined, roomName: undefined, seatNumber: undefined });
    });
  }

  // Merge back all students in original order
  const studentMap = new Map<string, Student>();
  allAssignedStudents.forEach((s) => studentMap.set(s.id, s));
  allUnassignedStudents.forEach((s) => studentMap.set(s.id, s));

  const finalStudents = students.map((s) => studentMap.get(s.id) || { ...s, roomId: undefined, roomName: undefined, seatNumber: undefined });

  return {
    updatedStudents: finalStudents,
    unassignedStudents: allUnassignedStudents,
  };
}

/**
 * Raw core: Distributes students across rooms using Cross-Class Alternating (Sistem Silang).
 */
function rawDistributeCrossClass(
  students: Student[],
  rooms: ExamRoom[]
): { updatedStudents: Student[]; unassignedStudents: Student[] } {
  // Group students by className
  const classGroups = new Map<string, Student[]>();
  students.forEach((s) => {
    const list = classGroups.get(s.className) || [];
    list.push({ ...s });
    classGroups.set(s.className, list);
  });

  const classNames = Array.from(classGroups.keys());

  // Split classes into two streams
  const streamA: Student[] = [];
  const streamB: Student[] = [];

  classNames.forEach((cls, idx) => {
    const group = classGroups.get(cls) || [];
    if (idx % 2 === 0) {
      streamA.push(...group);
    } else {
      streamB.push(...group);
    }
  });

  let indexA = 0;
  let indexB = 0;

  const assignedStudents: Student[] = [];

  for (const room of rooms) {
    const cap = room.capacity || 20;

    for (let seat = 1; seat <= cap; seat++) {
      let selectedStudent: Student | null = null;

      // Odd seats take from streamA if available, otherwise fallback
      if (seat % 2 === 1) {
        if (indexA < streamA.length) {
          selectedStudent = streamA[indexA++];
        } else if (indexB < streamB.length) {
          selectedStudent = streamB[indexB++];
        }
      } else {
        // Even seats take from streamB if available, otherwise fallback
        if (indexB < streamB.length) {
          selectedStudent = streamB[indexB++];
        } else if (indexA < streamA.length) {
          selectedStudent = streamA[indexA++];
        }
      }

      if (selectedStudent) {
        selectedStudent.roomId = room.id;
        selectedStudent.roomName = room.name;
        selectedStudent.seatNumber = seat;
        assignedStudents.push(selectedStudent);
      }
    }
  }

  // Leftovers
  const unassigned: Student[] = [];
  while (indexA < streamA.length) {
    const s = { ...streamA[indexA++], roomId: undefined, roomName: undefined, seatNumber: undefined };
    unassigned.push(s);
  }
  while (indexB < streamB.length) {
    const s = { ...streamB[indexB++], roomId: undefined, roomName: undefined, seatNumber: undefined };
    unassigned.push(s);
  }

  const studentMap = new Map<string, Student>();
  assignedStudents.forEach((s) => studentMap.set(s.id, s));
  unassigned.forEach((s) => studentMap.set(s.id, s));

  const finalStudents = students.map((s) => studentMap.get(s.id) || s);

  return {
    updatedStudents: finalStudents,
    unassignedStudents: unassigned,
  };
}

/**
 * Distributes students across rooms using Cross-Class Alternating (Sistem Silang).
 * Separates by Program Studi: Ruang 1-5 untuk Program Studi 1, Ruang 6+ untuk Program Studi 2.
 */
export function distributeCrossClass(
  students: Student[],
  rooms: ExamRoom[],
  major1: string = DEFAULT_MAJOR_1,
  major2: string = DEFAULT_MAJOR_2
): { updatedStudents: Student[]; unassignedStudents: Student[] } {
  return partitionDistribution(
    students,
    rooms,
    (subStudents, subRooms) => rawDistributeCrossClass(subStudents, subRooms),
    major1,
    major2
  );
}

/**
 * Raw core: Distributes students sequentially by class and name.
 */
function rawDistributeSequential(
  students: Student[],
  rooms: ExamRoom[]
): { updatedStudents: Student[]; unassignedStudents: Student[] } {
  const sorted = [...students].sort((a, b) => {
    if (a.className !== b.className) {
      return a.className.localeCompare(b.className);
    }
    return a.name.localeCompare(b.name);
  });

  let studentIdx = 0;
  const assignedStudents: Student[] = [];

  for (const room of rooms) {
    const cap = room.capacity || 20;

    for (let seat = 1; seat <= cap; seat++) {
      if (studentIdx < sorted.length) {
        const student = {
          ...sorted[studentIdx++],
          roomId: room.id,
          roomName: room.name,
          seatNumber: seat,
        };
        assignedStudents.push(student);
      }
    }
  }

  const unassigned: Student[] = [];
  while (studentIdx < sorted.length) {
    const s = { ...sorted[studentIdx++], roomId: undefined, roomName: undefined, seatNumber: undefined };
    unassigned.push(s);
  }

  const studentMap = new Map<string, Student>();
  assignedStudents.forEach((s) => studentMap.set(s.id, s));
  unassigned.forEach((s) => studentMap.set(s.id, s));

  const finalStudents = students.map((s) => studentMap.get(s.id) || s);

  return {
    updatedStudents: finalStudents,
    unassignedStudents: unassigned,
  };
}

/**
 * Distributes students sequentially by class and name.
 * Separates by Program Studi: Ruang 1-5 untuk Program Studi 1, Ruang 6+ untuk Program Studi 2.
 */
export function distributeSequential(
  students: Student[],
  rooms: ExamRoom[],
  major1: string = DEFAULT_MAJOR_1,
  major2: string = DEFAULT_MAJOR_2
): { updatedStudents: Student[]; unassignedStudents: Student[] } {
  return partitionDistribution(
    students,
    rooms,
    (subStudents, subRooms) => rawDistributeSequential(subStudents, subRooms),
    major1,
    major2
  );
}

/**
 * Extracts school grade/level (Tingkat) from class name.
 */
export function extractTingkat(className: string): string {
  if (!className) return 'Lainnya';
  const trimmed = className.trim();
  const romanMatch = trimmed.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b/i);
  if (romanMatch) return romanMatch[1].toUpperCase();
  const numMatch = trimmed.match(/^(\d+)/);
  if (numMatch) return numMatch[1];
  return trimmed.split(/[\s_\-.]+/)[0] || trimmed;
}

/**
 * Raw core: Cross-Grade Double-Desk Distribution (1 Meja 2 Siswa Beda Tingkat).
 */
function rawDistributeCrossLevelDoubleDesk(
  students: Student[],
  rooms: ExamRoom[],
  numberingPattern: 'photo_order' | 'sequential_desk' = 'photo_order'
): { updatedStudents: Student[]; unassignedStudents: Student[] } {
  // 1. Group students by tingkat (e.g. X, XI, XII)
  const tingkatMap = new Map<string, Student[]>();
  students.forEach((s) => {
    const t = extractTingkat(s.className);
    if (!tingkatMap.has(t)) {
      tingkatMap.set(t, []);
    }
    tingkatMap.get(t)!.push({ ...s });
  });

  // Sort each tingkat queue by className, then name
  tingkatMap.forEach((list) => {
    list.sort((a, b) => {
      if (a.className !== b.className) {
        return a.className.localeCompare(b.className);
      }
      return a.name.localeCompare(b.name);
    });
  });

  // 2. Global largest-first greedy pairing
  const pools = Array.from(tingkatMap.entries()).map(([tingkat, list]) => ({ tingkat, list }));
  const desks: Array<{ left: Student; right?: Student }> = [];

  while (true) {
    pools.sort((a, b) => b.list.length - a.list.length);
    const active = pools.filter((p) => p.list.length > 0);
    if (active.length === 0) break;
    if (active.length === 1) {
      while (active[0].list.length > 0) {
        desks.push({ left: active[0].list.shift()! });
      }
      break;
    }
    const s1 = active[0].list.shift()!;
    const s2 = active[1].list.shift()!;
    desks.push({ left: s1, right: s2 });
  }

  // 3. Organize desks by (tingkatLeft, tingkatRight) pair
  const pairGroups = new Map<string, typeof desks>();
  desks.forEach((d) => {
    if (d.right) {
      const tL = extractTingkat(d.left.className);
      const tR = extractTingkat(d.right.className);
      const pairKey = [tL, tR].sort().join('-');
      if (!pairGroups.has(pairKey)) pairGroups.set(pairKey, []);
      pairGroups.get(pairKey)!.push(d);
    }
  });

  const orderedDesks: typeof desks = [];
  const singleDesks = desks.filter((d) => !d.right);

  Array.from(pairGroups.keys())
    .sort()
    .forEach((pairKey) => {
      const group = pairGroups.get(pairKey)!;
      const [t1] = pairKey.split('-');
      group.forEach((d) => {
        if (d.right && extractTingkat(d.left.className) !== t1) {
          const tmp = d.left;
          d.left = d.right;
          d.right = tmp;
        }
      });
      group.sort((a, b) => {
        const cmpLeft = a.left.className.localeCompare(b.left.className) || a.left.name.localeCompare(b.left.name);
        if (cmpLeft !== 0) return cmpLeft;
        if (a.right && b.right) {
          return a.right.className.localeCompare(b.right.className) || a.right.name.localeCompare(b.right.name);
        }
        return 0;
      });
      orderedDesks.push(...group);
    });

  orderedDesks.push(...singleDesks);

  // 4. Assign desks to rooms
  let deskPointer = 0;
  const assignedStudents: Student[] = [];

  for (const room of rooms) {
    const cap = room.capacity || 40;
    const half = Math.floor(cap / 2);
    const roomSlice = orderedDesks.slice(deskPointer, deskPointer + half);
    deskPointer += half;

    roomSlice.forEach((desk, idx) => {
      let leftSeat: number;
      let rightSeat: number;

      if (numberingPattern === 'sequential_desk') {
        leftSeat = idx * 2 + 1;
        rightSeat = idx * 2 + 2;
      } else {
        leftSeat = idx + 1;
        rightSeat = half + idx + 1;
      }

      assignedStudents.push({
        ...desk.left,
        roomId: room.id,
        roomName: room.name,
        seatNumber: leftSeat,
      });

      if (desk.right) {
        assignedStudents.push({
          ...desk.right,
          roomId: room.id,
          roomName: room.name,
          seatNumber: rightSeat,
        });
      }
    });
  }

  // 5. Remaining unassigned students
  const unassigned: Student[] = [];
  if (deskPointer < orderedDesks.length) {
    const remainingDesks = orderedDesks.slice(deskPointer);
    remainingDesks.forEach((d) => {
      unassigned.push({ ...d.left, roomId: undefined, roomName: undefined, seatNumber: undefined });
      if (d.right) {
        unassigned.push({ ...d.right, roomId: undefined, roomName: undefined, seatNumber: undefined });
      }
    });
  }

  // 6. Safety check: resolve any same-tingkat desk conflict
  for (const room of rooms) {
    const roomStudents = assignedStudents.filter((s) => s.roomId === room.id);
    const cap = room.capacity || 40;
    const half = Math.floor(cap / 2);

    for (let d = 0; d < half; d++) {
      const leftSeat = numberingPattern === 'sequential_desk' ? d * 2 + 1 : d + 1;
      const rightSeat = numberingPattern === 'sequential_desk' ? d * 2 + 2 : half + d + 1;

      const leftS = roomStudents.find((s) => s.seatNumber === leftSeat);
      const rightS = roomStudents.find((s) => s.seatNumber === rightSeat);

      if (leftS && rightS) {
        const tL = extractTingkat(leftS.className);
        const tR = extractTingkat(rightS.className);
        if (tL === tR) {
          for (const other of assignedStudents) {
            if (other.id !== leftS.id && other.id !== rightS.id) {
              const otherT = extractTingkat(other.className);
              if (otherT !== tL) {
                const tmpRoom = rightS.roomId;
                const tmpRoomName = rightS.roomName;
                const tmpSeat = rightS.seatNumber;

                rightS.roomId = other.roomId;
                rightS.roomName = other.roomName;
                rightS.seatNumber = other.seatNumber;

                other.roomId = tmpRoom;
                other.roomName = tmpRoomName;
                other.seatNumber = tmpSeat;
                break;
              }
            }
          }
        }
      }
    }
  }

  const studentMap = new Map<string, Student>();
  assignedStudents.forEach((s) => studentMap.set(s.id, s));
  unassigned.forEach((s) => studentMap.set(s.id, s));

  const finalStudents = students.map((s) => studentMap.get(s.id) || s);

  return {
    updatedStudents: finalStudents,
    unassignedStudents: unassigned,
  };
}

/**
 * Cross-Grade Double-Desk Distribution (1 Meja 2 Siswa Beda Tingkat).
 * Separates by Program Studi: Ruang 1-5 untuk Program Studi 1, Ruang 6+ untuk Program Studi 2.
 */
export function distributeCrossLevelDoubleDesk(
  students: Student[],
  rooms: ExamRoom[],
  numberingPattern: 'photo_order' | 'sequential_desk' = 'photo_order',
  major1: string = DEFAULT_MAJOR_1,
  major2: string = DEFAULT_MAJOR_2
): { updatedStudents: Student[]; unassignedStudents: Student[] } {
  return partitionDistribution(
    students,
    rooms,
    (subStudents, subRooms) => rawDistributeCrossLevelDoubleDesk(subStudents, subRooms, numberingPattern),
    major1,
    major2
  );
}

/**
 * Regenerates official Indonesian Exam Participant Numbers:
 * Pattern: [prefix]-[classCode]-[index3Digits]
 * Example: 25-04-01-001
 */
export function generateExamNumbers(students: Student[], prefix: string = '25-04'): Student[] {
  const classes = Array.from(new Set(students.map((s) => s.className))).sort();
  const classCodeMap = new Map<string, string>();
  classes.forEach((cls, idx) => {
    const code = String(idx + 1).padStart(2, '0');
    classCodeMap.set(cls, code);
  });

  const classCounter = new Map<string, number>();

  return students.map((s) => {
    const classCode = classCodeMap.get(s.className) || '01';
    const currentCount = (classCounter.get(s.className) || 0) + 1;
    classCounter.set(s.className, currentCount);

    const numStr = String(currentCount).padStart(3, '0');
    return {
      ...s,
      examNumber: `${prefix}-${classCode}-${numStr}`,
    };
  });
}
