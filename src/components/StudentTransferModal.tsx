import React, { useState, useMemo, useEffect } from 'react';
import { ExamConfig, ExamRoom, Student } from '../types';
import { 
  ArrowLeftRight, 
  DoorOpen, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  UserCheck, 
  UserPlus, 
  UserMinus, 
  Sliders, 
  ArrowRight, 
  Sparkles,
  Grid3X3,
  RefreshCw,
  Info,
  Layers,
  Check
} from 'lucide-react';

interface StudentTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  rooms: ExamRoom[];
  config?: ExamConfig;
  initialStudentId?: string;
  initialRoomId?: string;
  initialSeatNumber?: number;
  onMoveStudent: (
    studentId: string,
    targetRoomId: string,
    targetSeatNumber?: number,
    conflictMode?: 'swap' | 'shift' | 'unassign'
  ) => void;
  onSwapStudents: (studentId1: string, studentId2: string) => void;
  onBulkUpdateSeats?: (updatedStudents: Student[]) => void;
  onUnassignStudent?: (studentId: string) => void;
  onReorderRoomSeats?: (roomId: string) => void;
}

export const StudentTransferModal: React.FC<StudentTransferModalProps> = ({
  isOpen,
  onClose,
  students,
  rooms,
  config,
  initialStudentId,
  initialRoomId,
  initialSeatNumber,
  onMoveStudent,
  onSwapStudents,
  onBulkUpdateSeats,
  onUnassignStudent,
  onReorderRoomSeats,
}) => {
  // Navigation tabs in modal: 'single_move' | 'room_matrix' | 'unassigned_queue'
  const [activeTab, setActiveTab] = useState<'single_move' | 'room_matrix' | 'unassigned_queue'>('single_move');

  // --- STATE: Single Move ---
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [targetRoomId, setTargetRoomId] = useState<string>(initialRoomId || (rooms[0]?.id || ''));
  const [targetSeatNumber, setTargetSeatNumber] = useState<number | 'auto'>('auto');
  const [conflictMode, setConflictMode] = useState<'swap' | 'shift' | 'unassign'>('swap');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // --- STATE: Room Matrix / Denah Meja Manual ---
  const [matrixRoomId, setMatrixRoomId] = useState<string>(initialRoomId || (rooms[0]?.id || ''));
  const [selectedSeatForSwap, setSelectedSeatForSwap] = useState<{ studentId: string; seatNumber: number } | null>(null);
  const [showAssignEmptyModal, setShowAssignEmptyModal] = useState<{ seatNumber: number } | null>(null);
  const [assignStudentSearch, setAssignStudentSearch] = useState('');

  // Synchronize initial selection when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      if (initialStudentId) {
        setSelectedStudentId(initialStudentId);
        setActiveTab('single_move');
      }
      if (initialRoomId) {
        setTargetRoomId(initialRoomId);
        setMatrixRoomId(initialRoomId);
      }
      if (initialSeatNumber) {
        setTargetSeatNumber(initialSeatNumber);
      } else {
        setTargetSeatNumber('auto');
      }
      setSelectedSeatForSwap(null);
      setShowAssignEmptyModal(null);
    }
  }, [isOpen, initialStudentId, initialRoomId, initialSeatNumber]);

  if (!isOpen) return null;

  // Currently selected student for single transfer
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Target Room details
  const targetRoom = rooms.find((r) => r.id === targetRoomId) || rooms[0];

  // Students currently in target room
  const targetRoomStudents = students.filter((s) => s.roomId === targetRoom?.id);
  const targetRoomOccupiedSeats = new Map<number, Student>();
  targetRoomStudents.forEach((s) => {
    if (s.seatNumber) targetRoomOccupiedSeats.set(s.seatNumber, s);
  });

  // Calculate target seat occupant (if specific seat is chosen)
  const targetSeatOccupant =
    typeof targetSeatNumber === 'number' && targetSeatNumber > 0
      ? targetRoomOccupiedSeats.get(targetSeatNumber)
      : null;

  // Does target seat conflict with another student (not the selected one)?
  const isSeatConflicted = !!targetSeatOccupant && targetSeatOccupant.id !== selectedStudentId;

  // Find first empty seat in target room
  const firstEmptySeat = (() => {
    if (!targetRoom) return 1;
    const cap = targetRoom.capacity || 20;
    for (let i = 1; i <= cap; i++) {
      if (!targetRoomOccupiedSeats.has(i)) return i;
    }
    return cap + 1; // Room is full
  })();

  // Filtered students for search in Tab 1
  const filteredStudentsForSelect = useMemo(() => {
    if (!studentSearchQuery.trim()) {
      return students.slice(0, 30);
    }
    const q = studentSearchQuery.toLowerCase();
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.examNumber.toLowerCase().includes(q) ||
          s.className.toLowerCase().includes(q) ||
          (s.roomName && s.roomName.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [students, studentSearchQuery]);

  // Students in Matrix Room
  const matrixRoom = rooms.find((r) => r.id === matrixRoomId) || rooms[0];
  const matrixStudents = students.filter((s) => s.roomId === matrixRoom?.id);
  const matrixSeatMap = new Map<number, Student>();
  matrixStudents.forEach((s) => {
    if (s.seatNumber) matrixSeatMap.set(s.seatNumber, s);
  });

  // Check for duplicate seat numbers in Matrix Room
  const seatCounts = new Map<number, number>();
  matrixStudents.forEach((s) => {
    if (s.seatNumber) {
      seatCounts.set(s.seatNumber, (seatCounts.get(s.seatNumber) || 0) + 1);
    }
  });
  const duplicateSeats = Array.from(seatCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([seat]) => seat);

  // Unassigned students queue
  const unassignedStudents = students.filter((s) => !s.roomId || !s.seatNumber);

  // Handle single move submission
  const handleExecuteSingleMove = () => {
    if (!selectedStudent || !targetRoom) return;

    let finalSeat: number | undefined;
    if (targetSeatNumber === 'auto') {
      finalSeat = firstEmptySeat <= (targetRoom.capacity || 20) ? firstEmptySeat : (targetRoom.capacity || 20);
    } else {
      finalSeat = targetSeatNumber;
    }

    onMoveStudent(selectedStudent.id, targetRoom.id, finalSeat, conflictMode);
    onClose();
  };

  // Handle Quick Seat Change in Matrix
  const handleMatrixChangeSeat = (studentId: string, newSeatNumber: number) => {
    if (!matrixRoom) return;
    const existingStudentAtNewSeat = matrixSeatMap.get(newSeatNumber);
    if (existingStudentAtNewSeat && existingStudentAtNewSeat.id !== studentId) {
      // Swap seats within this room
      onSwapStudents(studentId, existingStudentAtNewSeat.id);
    } else {
      // Move to new seat
      onMoveStudent(studentId, matrixRoom.id, newSeatNumber, 'shift');
    }
  };

  // Handle Seat Click in Matrix Mode
  const handleMatrixSeatClick = (seatNum: number, occupant?: Student) => {
    if (selectedSeatForSwap) {
      if (occupant) {
        if (selectedSeatForSwap.studentId === occupant.id) {
          // Deselect
          setSelectedSeatForSwap(null);
        } else {
          // Swap both students
          onSwapStudents(selectedSeatForSwap.studentId, occupant.id);
          setSelectedSeatForSwap(null);
        }
      } else {
        // Move selected student to this empty seat
        onMoveStudent(selectedSeatForSwap.studentId, matrixRoom.id, seatNum, 'shift');
        setSelectedSeatForSwap(null);
      }
    } else {
      if (occupant) {
        setSelectedSeatForSwap({ studentId: occupant.id, seatNumber: seatNum });
      } else {
        // Open assign modal for empty seat
        setShowAssignEmptyModal({ seatNumber: seatNum });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Pengaturan &amp; Pemindahan Meja Peserta Ujian</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pindahkan peserta antar ruang, tukar posisi meja, atau tata nomor meja secara manual dan instan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('single_move')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'single_move'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span>Pindah Peserta Cepat</span>
          </button>

          <button
            onClick={() => setActiveTab('room_matrix')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'room_matrix'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Penataan Meja Manual per Ruang</span>
            {duplicateSeats.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('unassigned_queue')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'unassigned_queue'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserMinus className="w-4 h-4" />
            <span>Belum Dapat Ruang</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              unassignedStudents.length > 0
                ? 'bg-amber-100 text-amber-800 font-black'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {unassignedStudents.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* =========================================================================
              TAB 1: PINDAH PESERTA CEPAT
              ========================================================================= */}
          {activeTab === 'single_move' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Step 1: Pilih Peserta */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black flex items-center justify-center">1</span>
                    Pilih Peserta yang Ingin Dipindahkan
                  </span>
                  {selectedStudent && (
                    <span className="text-[11px] font-normal text-slate-500">
                      ID: {selectedStudent.id}
                    </span>
                  )}
                </label>

                {/* Search Bar for Student */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Ketik nama, no peserta, atau kelas siswa..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {studentSearchQuery && (
                    <button
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown / Select List */}
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Siswa ({students.length} terdaftar) --</option>
                  {filteredStudentsForSelect.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} • {s.className} • {s.roomName ? `${s.roomName} (Meja ${s.seatNumber || '-'})` : '[BELUM ADA RUANG]'}
                    </option>
                  ))}
                </select>

                {/* Current Student Preview Card */}
                {selectedStudent ? (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-sm">{selectedStudent.name}</div>
                      <div className="text-slate-600 font-medium flex flex-wrap items-center gap-2">
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                          {selectedStudent.examNumber}
                        </span>
                        <span className="font-bold text-indigo-700">{selectedStudent.className}</span>
                        {selectedStudent.major && (
                          <span className="text-slate-500">({selectedStudent.major})</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right sm:text-right shrink-0">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Posisi Saat Ini</div>
                      {selectedStudent.roomId ? (
                        <div className="font-bold text-slate-900">
                          <span className="text-indigo-700 font-extrabold">{selectedStudent.roomName || 'Ruang ?'}</span>
                          <span className="mx-1">•</span>
                          <span className="bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-indigo-900 font-mono">
                            Meja #{String(selectedStudent.seatNumber || 1).padStart(2, '0')}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
                          Belum Dapat Ruang
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 italic text-center">
                    Silakan pilih siswa yang ingin dipindahkan di atas.
                  </div>
                )}
              </div>

              {/* Step 2: Tentukan Ruang Tujuan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black flex items-center justify-center">2</span>
                    Pilih Ruang Ujian Tujuan
                  </span>
                  {targetRoom && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Kapasitas: {targetRoomStudents.length} / {targetRoom.capacity || 20} Peserta
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {rooms.map((room) => {
                    const count = students.filter((s) => s.roomId === room.id).length;
                    const cap = room.capacity || 20;
                    const isSelected = room.id === targetRoomId;
                    const isFull = count >= cap;
                    const isCurrent = selectedStudent?.roomId === room.id;

                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          setTargetRoomId(room.id);
                          setTargetSeatNumber('auto');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{room.name}</span>
                          <span className="text-[10px] font-mono font-semibold text-slate-500">
                            {room.roomCode}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className={`font-mono font-bold ${isFull ? 'text-rose-600' : 'text-slate-600'}`}>
                            {count}/{cap} kursi
                          </span>
                          {isCurrent ? (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold text-[9px]">
                              Asal
                            </span>
                          ) : isFull ? (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[9px]">
                              Penuh
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold text-[9px]">
                              Tersedia
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Nomor Meja di Ruang Tujuan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black flex items-center justify-center">3</span>
                  Tentukan Nomor Meja di {targetRoom?.name || 'Ruang Tujuan'}
                </label>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="seatOption"
                        checked={targetSeatNumber === 'auto'}
                        onChange={() => setTargetSeatNumber('auto')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-800">
                        ⚡ Otomatis di Meja Kosong Pertama
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        (Meja #{String(firstEmptySeat <= (targetRoom?.capacity || 20) ? firstEmptySeat : (targetRoom?.capacity || 20)).padStart(2, '0')})
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="seatOption"
                        checked={targetSeatNumber !== 'auto'}
                        onChange={() => setTargetSeatNumber(firstEmptySeat <= (targetRoom?.capacity || 20) ? firstEmptySeat : 1)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-800">
                        🎯 Pilih Nomor Meja Spesifik
                      </span>
                    </label>
                  </div>

                  {/* Specific Seat Selector */}
                  {targetSeatNumber !== 'auto' && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Pilih nomor meja (1 s/d {targetRoom?.capacity || 20}):</span>
                        <span>Klik nomor di bawah:</span>
                      </div>

                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {Array.from({ length: targetRoom?.capacity || 20 }, (_, i) => i + 1).map((seat) => {
                          const occupant = targetRoomOccupiedSeats.get(seat);
                          const isOccupiedByAnother = occupant && occupant.id !== selectedStudentId;
                          const isOccupiedByCurrent = occupant && occupant.id === selectedStudentId;
                          const isSelected = targetSeatNumber === seat;

                          return (
                            <button
                              key={seat}
                              type="button"
                              onClick={() => setTargetSeatNumber(seat)}
                              title={
                                occupant
                                  ? `Meja ${seat}: ${occupant.name} (${occupant.className})`
                                  : `Meja ${seat}: Kosong`
                              }
                              className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-600 text-white font-black shadow-xs ring-2 ring-indigo-300'
                                  : isOccupiedByCurrent
                                  ? 'border-indigo-300 bg-indigo-50 text-indigo-900 font-bold'
                                  : isOccupiedByAnother
                                  ? 'border-amber-200 bg-amber-50/70 text-amber-900 hover:border-amber-400'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                              }`}
                            >
                              <span className="font-mono font-bold text-xs">{String(seat).padStart(2, '0')}</span>
                              <span className="text-[8.5px] leading-tight truncate max-w-full">
                                {isOccupiedByAnother ? 'Terisi' : isOccupiedByCurrent ? 'Ini' : 'Kosong'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Conflict Notification */}
                      {isSeatConflicted && targetSeatOccupant && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Perhatian: Meja #{targetSeatNumber} sudah terisi!</span>
                              <div className="text-[11px] text-amber-800 mt-0.5">
                                Penghuni saat ini: <strong>{targetSeatOccupant.name}</strong> ({targetSeatOccupant.className}).
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-amber-200 space-y-1.5 text-xs">
                            <div className="font-bold text-amber-950 text-[11px]">
                              Pilih tindakan untuk {targetSeatOccupant.name}:
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                              <input
                                type="radio"
                                name="conflictOption"
                                checked={conflictMode === 'swap'}
                                onChange={() => setConflictMode('swap')}
                                className="text-amber-600 focus:ring-amber-500"
                              />
                              <span>
                                <strong>Tukar Posisi (Swap):</strong> {targetSeatOccupant.name} otomatis pindah ke posisi lama {selectedStudent?.name} ({selectedStudent?.roomName || 'Ruang Asal'} Meja #{selectedStudent?.seatNumber || '-'}).
                              </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                              <input
                                type="radio"
                                name="conflictOption"
                                checked={conflictMode === 'shift'}
                                onChange={() => setConflictMode('shift')}
                                className="text-amber-600 focus:ring-amber-500"
                              />
                              <span>
                                <strong>Geser:</strong> {targetSeatOccupant.name} dipindahkan ke meja kosong berikutnya di {targetRoom.name}.
                              </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                              <input
                                type="radio"
                                name="conflictOption"
                                checked={conflictMode === 'unassign'}
                                onChange={() => setConflictMode('unassign')}
                                className="text-amber-600 focus:ring-amber-500"
                              />
                              <span>
                                <strong>Keluarkan:</strong> {targetSeatOccupant.name} dikeluarkan dari ruang ini (menjadi Belum Dapat Ruang).
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!selectedStudent || !targetRoom}
                  onClick={handleExecuteSingleMove}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Terapkan Pemindahan Peserta</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: PENATAAN MEJA MANUAL PER RUANG (MATRIX EDITOR)
              ========================================================================= */}
          {activeTab === 'room_matrix' && (
            <div className="space-y-4">
              {/* Room Selector Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Pilih Ruang Ujian:</span>
                  <select
                    value={matrixRoomId}
                    onChange={(e) => {
                      setMatrixRoomId(e.target.value);
                      setSelectedSeatForSwap(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {rooms.map((r) => {
                      const count = students.filter((s) => s.roomId === r.id).length;
                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.roomCode}) • {count}/{r.capacity || 20} Siswa
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {onReorderRoomSeats && (
                    <button
                      type="button"
                      onClick={() => onReorderRoomSeats(matrixRoomId)}
                      title="Urutkan kembali nomor meja siswa di ruang ini dari 1 s/d N tanpa celah kosong"
                      className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Rapikan Nomor Meja (1..N)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Duplicate Seat Alert */}
              {duplicateSeats.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>Peringatan Nomor Meja Kembar:</strong> Ditemukan bentrok pada Meja #{duplicateSeats.join(', #')}! Harap periksa dan ganti nomor meja siswa yang bersangkutan.
                    </span>
                  </div>
                  {onReorderRoomSeats && (
                    <button
                      onClick={() => onReorderRoomSeats(matrixRoomId)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-md transition-colors cursor-pointer shrink-0"
                    >
                      Perbaiki Otomatis
                    </button>
                  )}
                </div>
              )}

              {/* Active Swap Notice */}
              {selectedSeatForSwap && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                    <span>
                      Mode Tukar Meja: Meja #{selectedSeatForSwap.seatNumber} terpilih. Klik meja lain untuk menukar posisi siswa atau memindahkan ke meja kosong.
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedSeatForSwap(null)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-bold ml-2 cursor-pointer"
                  >
                    Batal ✕
                  </button>
                </div>
              )}

              {/* Interactive Desks Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Daftar Meja di {matrixRoom?.name}:</span>
                  <span className="italic">Tips: Klik meja untuk menukar kursi atau mengeluarkan siswa.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {Array.from({ length: matrixRoom?.capacity || 20 }, (_, i) => i + 1).map((seatNum) => {
                    const student = matrixSeatMap.get(seatNum);
                    const isSelectedForSwap = selectedSeatForSwap?.seatNumber === seatNum;
                    const isDuplicate = duplicateSeats.includes(seatNum);

                    return (
                      <div
                        key={seatNum}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[110px] ${
                          isSelectedForSwap
                            ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/40 shadow-sm'
                            : isDuplicate
                            ? 'border-rose-400 bg-rose-50/50'
                            : student
                            ? 'border-slate-200 bg-white hover:border-indigo-300 shadow-2xs'
                            : 'border-dashed border-slate-200 bg-slate-50/50 text-slate-400'
                        }`}
                      >
                        {/* Top: Seat Number Badge */}
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded border ${
                            student
                              ? 'bg-slate-100 text-slate-800 border-slate-200'
                              : 'bg-transparent text-slate-400 border-dashed border-slate-300'
                          }`}>
                            MEJA {String(seatNum).padStart(2, '0')}
                          </span>

                          {student && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMatrixSeatClick(seatNum, student)}
                                title="Tukar kursi ini dengan meja lain"
                                className={`p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer ${
                                  isSelectedForSwap ? 'text-amber-600 bg-amber-100' : ''
                                }`}
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>

                              {onUnassignStudent && (
                                <button
                                  type="button"
                                  onClick={() => onUnassignStudent(student.id)}
                                  title="Keluarkan dari ruang ini"
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Center: Student Info or Empty */}
                        <div className="my-1.5">
                          {student ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-xs text-slate-900 line-clamp-1" title={student.name}>
                                {student.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
                                <span className="font-bold text-indigo-700">{student.className}</span>
                                <span className="font-mono text-[9px]">{student.examNumber.split('-').slice(2).join('-')}</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMatrixSeatClick(seatNum)}
                              className="w-full py-2 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/60 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Isi Meja #{seatNum}</span>
                            </button>
                          )}
                        </div>

                        {/* Bottom: Quick Room Transfer Trigger */}
                        {student && (
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentId(student.id);
                                setActiveTab('single_move');
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Pindah Ruang...</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>

                            {/* Seat Selector dropdown to quickly change seat in this room */}
                            <select
                              value={student.seatNumber || seatNum}
                              onChange={(e) => handleMatrixChangeSeat(student.id, parseInt(e.target.value, 10))}
                              className="text-[10px] font-mono font-bold bg-slate-50 border border-slate-200 rounded px-1 py-0.5 cursor-pointer text-slate-700"
                              title="Ganti nomor meja siswa ini"
                            >
                              {Array.from({ length: matrixRoom?.capacity || 20 }, (_, idx) => idx + 1).map((s) => (
                                <option key={s} value={s}>
                                  #{s}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: PESERTA BELUM DAPAT RUANG
              ========================================================================= */}
          {activeTab === 'unassigned_queue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Peserta Belum Mendapatkan Ruang / Nomor Meja ({unassignedStudents.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Siswa di bawah ini belum teralokasi ke dalam ruang ujian manapun. Anda dapat menempatkannya ke ruang yang masih memiliki kursi kosong.
                  </p>
                </div>
              </div>

              {unassignedStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="font-bold text-slate-800 text-sm">Semua Peserta Sudah Memiliki Ruang!</div>
                  <div className="text-xs text-slate-500 max-w-md mx-auto">
                    Seluruh {students.length} peserta telah berhasil ditempatkan di ruang ujian dan memiliki nomor meja masing-masing.
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100">
                    {unassignedStudents.map((student, idx) => (
                      <div
                        key={student.id}
                        className="p-3 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400 font-bold text-xs w-6">
                            {idx + 1}.
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {student.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                                {student.examNumber}
                              </span>
                              <span className="font-bold text-indigo-700">{student.className}</span>
                              {student.major && <span>• {student.major}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setActiveTab('single_move');
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-200"
                          >
                            <DoorOpen className="w-3.5 h-3.5" />
                            <span>Tempatkan ke Ruang...</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Setiap pemindahan atau penataan meja langsung tersinkronkan ke kartu ujian, lembar denah, dan Cloud Firestore.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Sub-modal: Tempatkan Peserta ke Meja Kosong Tertentu */}
      {showAssignEmptyModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3 animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Isi Meja #{showAssignEmptyModal.seatNumber} ({matrixRoom?.name})</span>
              </h4>
              <button
                onClick={() => setShowAssignEmptyModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700">Cari &amp; Pilih Siswa:</label>
              <input
                type="text"
                value={assignStudentSearch}
                onChange={(e) => setAssignStudentSearch(e.target.value)}
                placeholder="Ketik nama atau kelas..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              />

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {students
                  .filter((s) => {
                    if (!assignStudentSearch) return !s.roomId; // default show unassigned first
                    const q = assignStudentSearch.toLowerCase();
                    return s.name.toLowerCase().includes(q) || s.className.toLowerCase().includes(q);
                  })
                  .slice(0, 30)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onMoveStudent(s.id, matrixRoom.id, showAssignEmptyModal.seatNumber, 'shift');
                        setShowAssignEmptyModal(null);
                      }}
                      className="w-full p-2.5 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {s.className} • {s.roomName ? `${s.roomName} (Meja ${s.seatNumber || '-'})` : 'Belum Ada Ruang'}
                        </div>
                      </div>
                      <span className="text-indigo-600 font-bold text-xs shrink-0">
                        Pilih +
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAssignEmptyModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
