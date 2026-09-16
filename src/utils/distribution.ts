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
 * Extracts school grade/level (Tingkat) from class name.
 * e.g. "X AP 1" -> "X", "Kelas XI BD 2" -> "XI", "XII AP 1" -> "XII", "10 AKL" -> "10", "7A" -> "7"
 */
export function extractTingkat(className: string): string {
  if (!className) return 'Lainnya';
  const trimmed = className.trim();
  const clean = trimmed.replace(/^(kelas|kls|tingkat|tk)\s+/i, '');
  const romanMatch = clean.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b/i);
  if (romanMatch) return romanMatch[1].toUpperCase();
  const numMatch = clean.match(/^(\d+)/);
  if (numMatch) return numMatch[1];
  return clean.split(/[\s_\-.]+/)[0] || clean;
}

/**
 * Returns a numerical sort rank for common grade levels (Tingkat).
 */
export function getTingkatSortRank(t: string): number {
  const norm = t.toUpperCase().trim();
  const map: Record<string, number> = {
    I: 1, '1': 1,
    II: 2, '2': 2,
    III: 3, '3': 3,
    IV: 4, '4': 4,
    V: 5, '5': 5,
    VI: 6, '6': 6,
    VII: 7, '7': 7,
    VIII: 8, '8': 8,
    IX: 9, '9': 9,
    X: 10, '10': 10,
    XI: 11, '11': 11,
    XII: 12, '12': 12,
  };
  return map[norm] ?? 99;
}

/**
 * Raw core: Distributes students across rooms using Cross-Class Alternating (Sistem Silang Semua Tingkat).
 * MANDATE: Setiap ruangan WAJIB memiliki siswa dari SEMUA tingkat kelas (X, XI, XII / 7, 8, 9)
 * secara proporsional dan posisi duduk bersilangan agar tidak ada siswa se-tingkat bersebelahan.
 */
function rawDistributeCrossClass(
  students: Student[],
  rooms: ExamRoom[]
): { updatedStudents: Student[]; unassignedStudents: Student[] } {
  if (rooms.length === 0 || students.length === 0) {
    return { updatedStudents: students, unassignedStudents: [] };
  }

  // 1. Group students by Tingkat
  const tingkatGroups = new Map<string, Student[]>();
  students.forEach((s) => {
    const t = extractTingkat(s.className);
    const list = tingkatGroups.get(t) || [];
    list.push({ ...s });
    tingkatGroups.set(t, list);
  });

  // Sort distinct tingkats logically (e.g. X, XI, XII or 7, 8, 9)
  const distinctTingkats = Array.from(tingkatGroups.keys()).sort((a, b) => {
    const rA = getTingkatSortRank(a);
    const rB = getTingkatSortRank(b);
    if (rA !== rB) return rA - rB;
    return a.localeCompare(b);
  });

  // 2. Inside each tingkat, interleave students across its various classes
  // e.g., in Tingkat X: interleave X AP 1 and X AP 2 so both classes are evenly spread
  const tingkatQueues = new Map<string, Student[]>();
  distinctTingkats.forEach((t) => {
    const list = tingkatGroups.get(t) || [];
    const classMap = new Map<string, Student[]>();
    list.forEach((s) => {
      const clsList = classMap.get(s.className) || [];
      clsList.push(s);
      classMap.set(s.className, clsList);
    });

    // Sort each class alphabetically by name
    classMap.forEach((clsStudents) => {
      clsStudents.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Interleave the classes within this tingkat
    const classNames = Array.from(classMap.keys()).sort();
    const interleaved: Student[] = [];
    let hasMore = true;
    let round = 0;
    while (hasMore) {
      hasMore = false;
      for (const cls of classNames) {
        const clsStudents = classMap.get(cls)!;
        if (round < clsStudents.length) {
          interleaved.push(clsStudents[round]);
          hasMore = true;
        }
      }
      round++;
    }
    tingkatQueues.set(t, interleaved);
  });

  // 3. Multiples of 5 per Tingkat in Regular Rooms, Leftover/Excess in the Last Room of the Program Study
  // MANDATE: Komposisi per ruang dibuat setiap tingkat kelipatan 5 (5, 10, 15, dst.).
  // Siswa yang lebih / sisa ditaruh di ruangan paling akhir setiap program studi.
  const numRooms = rooms.length;
  const regularRooms = numRooms > 1 ? rooms.slice(0, numRooms - 1) : rooms;
  const lastRoom = numRooms > 1 ? rooms[numRooms - 1] : null;

  // roomAllocations: roomId -> Map<tingkat, Student[]>
  const roomAllocations = new Map<string, Map<string, Student[]>>();
  rooms.forEach((r) => {
    const m = new Map<string, Student[]>();
    distinctTingkats.forEach((t) => m.set(t, []));
    roomAllocations.set(r.id, m);
  });

  // Track remaining students available in each tingkat queue to allocate
  const remainingCounts = new Map<string, number>();
  distinctTingkats.forEach((t) => {
    remainingCounts.set(t, (tingkatQueues.get(t) || []).length);
  });

  // If there are multiple rooms, allocate multiples of 5 to the regular rooms first
  if (numRooms > 1) {
    regularRooms.forEach((room, roomIdx) => {
      const cap = room.capacity || 20;
      const targetBlocks = Math.floor(cap / 5); // e.g. 20 / 5 = 4 blocks of 5
      let allocatedBlocks = 0;
      const targetRoomMap = roomAllocations.get(room.id)!;

      // Phase A: Give at least 1 block of 5 to each available tingkat if possible
      // to ensure all tingkats are represented in the room
      for (let i = 0; i < distinctTingkats.length; i++) {
        // Rotate start index across rooms for fair distribution of tie-breaks
        const t = distinctTingkats[(roomIdx + i) % distinctTingkats.length];
        const count = remainingCounts.get(t) || 0;
        if (allocatedBlocks < targetBlocks && count >= 5) {
          const q = tingkatQueues.get(t)!;
          const assignedList = targetRoomMap.get(t)!;
          for (let k = 0; k < 5; k++) {
            assignedList.push(q.shift()!);
          }
          remainingCounts.set(t, count - 5);
          allocatedBlocks++;
        }
      }

      // Phase B: Fill remaining blocks of 5 in this room using the tingkat with the most remaining students
      while (allocatedBlocks < targetBlocks) {
        // Find tingkat with highest remaining students that has at least 5 students
        let bestTingkat: string | null = null;
        let maxRem = -1;

        distinctTingkats.forEach((t) => {
          const rem = remainingCounts.get(t) || 0;
          if (rem >= 5 && rem > maxRem) {
            maxRem = rem;
            bestTingkat = t;
          }
        });

        if (!bestTingkat) {
          // No tingkat has at least 5 students left to form a block
          break;
        }

        const q = tingkatQueues.get(bestTingkat)!;
        const assignedList = targetRoomMap.get(bestTingkat)!;
        for (let k = 0; k < 5; k++) {
          assignedList.push(q.shift()!);
        }
        remainingCounts.set(bestTingkat, (remainingCounts.get(bestTingkat) || 0) - 5);
        allocatedBlocks++;
      }
    });

    // Phase C: Assign ALL remaining students (the leftovers / "yang lebih") into the LAST ROOM
    if (lastRoom) {
      const lastRoomMap = roomAllocations.get(lastRoom.id)!;
      distinctTingkats.forEach((t) => {
        const q = tingkatQueues.get(t) || [];
        const lastRoomList = lastRoomMap.get(t)!;
        while (q.length > 0) {
          lastRoomList.push(q.shift()!);
        }
        remainingCounts.set(t, 0);
      });
    }
  } else {
    // Single room case: assign all students to that room up to capacity
    const singleRoom = rooms[0];
    const targetRoomMap = roomAllocations.get(singleRoom.id)!;
    distinctTingkats.forEach((t) => {
      const q = tingkatQueues.get(t) || [];
      const assignedList = targetRoomMap.get(t)!;
      while (q.length > 0) {
        assignedList.push(q.shift()!);
      }
    });
  }

  // 4. Assign seats inside each room: Cross-Alternating (Sistem Silang) so adjacent seats have different tingkats
  const assignedStudents: Student[] = [];
  const unassignedStudents: Student[] = [];

  rooms.forEach((room) => {
    const cap = room.capacity || 20;
    const roomMap = roomAllocations.get(room.id)!;

    let currentSeat = 1;
    let lastTingkat: string | null = null;

    while (currentSeat <= cap) {
      // Find candidate tingkats with remaining students
      const candidates = distinctTingkats.filter((t) => (roomMap.get(t) || []).length > 0);
      if (candidates.length === 0) break;

      // Prefer a different tingkat than the previous seat to prevent adjacent same-tingkat seats
      const nonConsecutive = candidates.filter((t) => t !== lastTingkat);
      const pool = nonConsecutive.length > 0 ? nonConsecutive : candidates;

      // Pick the tingkat with the most remaining students
      pool.sort((a, b) => {
        const lenA = (roomMap.get(a) || []).length;
        const lenB = (roomMap.get(b) || []).length;
        if (lenA !== lenB) return lenB - lenA;
        return a.localeCompare(b);
      });

      const chosenTingkat = pool[0];
      const student = roomMap.get(chosenTingkat)!.shift()!;
      student.roomId = room.id;
      student.roomName = room.name;
      student.seatNumber = currentSeat;
      assignedStudents.push(student);
      lastTingkat = chosenTingkat;
      currentSeat++;
    }

    // Any overflow students that exceeded this room's capacity become unassigned
    distinctTingkats.forEach((t) => {
      const leftover = roomMap.get(t)!;
      while (leftover.length > 0) {
        const s = leftover.shift()!;
        unassignedStudents.push({ ...s, roomId: undefined, roomName: undefined, seatNumber: undefined });
      }
    });
  });

  const studentMap = new Map<string, Student>();
  assignedStudents.forEach((s) => studentMap.set(s.id, s));
  unassignedStudents.forEach((s) => studentMap.set(s.id, s));

  const finalStudents = students.map(
    (s) => studentMap.get(s.id) || { ...s, roomId: undefined, roomName: undefined, seatNumber: undefined }
  );

  return {
    updatedStudents: finalStudents,
    unassignedStudents,
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
 * Raw core: Cross-Grade Double-Desk Distribution (1 Meja 2 Siswa Beda Tingkat).
 * MANDATE: Setiap ruangan WAJIB memiliki siswa dari SEMUA tingkat kelas (X, XI, XII / 7, 8, 9)
 * dengan susunan 1 meja berisi 2 siswa berbeda tingkat.
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

  // Normalize order of students within each desk
  Array.from(pairGroups.keys()).forEach((pairKey) => {
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
  });

  const singleDesks = desks.filter((d) => !d.right);

  // 4. Distribute paired desks across rooms in round-robin fashion across all pair types
  // so that EVERY ROOM receives desks from each pair combination (all tingkats represented)
  const roomDeskAllocations = new Map<string, typeof desks>();
  rooms.forEach((r) => roomDeskAllocations.set(r.id, []));

  const sortedPairKeys = Array.from(pairGroups.keys()).sort();
  const pairQueues = sortedPairKeys.map((k) => [...pairGroups.get(k)!]);

  let anyPairRemaining = true;
  let roomIndex = 0;

  while (anyPairRemaining) {
    anyPairRemaining = false;
    for (let pIdx = 0; pIdx < pairQueues.length; pIdx++) {
      const q = pairQueues[pIdx];
      if (q.length > 0) {
        anyPairRemaining = true;
        // Find next room that still has desk capacity
        let attempts = 0;
        let assigned = false;
        while (attempts < rooms.length) {
          const room = rooms[(roomIndex + attempts) % rooms.length];
          const currentDesks = roomDeskAllocations.get(room.id)!;
          const maxDesks = Math.floor((room.capacity || 40) / 2);
          if (currentDesks.length < maxDesks) {
            currentDesks.push(q.shift()!);
            roomIndex = (roomIndex + attempts + 1) % rooms.length;
            assigned = true;
            break;
          }
          attempts++;
        }
        if (!assigned) {
          // All rooms are full of desks
          break;
        }
      }
    }
  }

  // Distribute any leftover single desks to rooms with remaining space
  let singleIdx = 0;
  for (const room of rooms) {
    const currentDesks = roomDeskAllocations.get(room.id)!;
    const maxDesks = Math.floor((room.capacity || 40) / 2);
    while (currentDesks.length < maxDesks && singleIdx < singleDesks.length) {
      currentDesks.push(singleDesks[singleIdx++]);
    }
  }

  // 5. Assign seat numbers within each room
  const assignedStudents: Student[] = [];
  const unassignedStudents: Student[] = [];

  for (const room of rooms) {
    const cap = room.capacity || 40;
    const half = Math.floor(cap / 2);
    const roomDesks = roomDeskAllocations.get(room.id) || [];

    roomDesks.forEach((desk, idx) => {
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

  // Gather unassigned students from remaining single desks or queues
  while (singleIdx < singleDesks.length) {
    const d = singleDesks[singleIdx++];
    unassignedStudents.push({ ...d.left, roomId: undefined, roomName: undefined, seatNumber: undefined });
  }
  pairQueues.forEach((q) => {
    while (q.length > 0) {
      const d = q.shift()!;
      unassignedStudents.push({ ...d.left, roomId: undefined, roomName: undefined, seatNumber: undefined });
      if (d.right) {
        unassignedStudents.push({ ...d.right, roomId: undefined, roomName: undefined, seatNumber: undefined });
      }
    }
  });

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
  unassignedStudents.forEach((s) => studentMap.set(s.id, s));

  const finalStudents = students.map((s) => studentMap.get(s.id) || { ...s, roomId: undefined, roomName: undefined, seatNumber: undefined });

  return {
    updatedStudents: finalStudents,
    unassignedStudents,
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
