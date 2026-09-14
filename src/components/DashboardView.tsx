import React from 'react';
import { ActiveTab, ExamConfig, ExamRoom, ExamScheduleItem, Student } from '../types';
import { 
  Users, 
  DoorOpen, 
  IdCard, 
  Shuffle, 
  Layers, 
  ExternalLink, 
  Printer, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DEFAULT_MAJOR_1, DEFAULT_MAJOR_2 } from '../utils/distribution';

interface DashboardViewProps {
  config: ExamConfig;
  students: Student[];
  rooms: ExamRoom[];
  schedules?: ExamScheduleItem[];
  setActiveTab: (tab: ActiveTab) => void;
  onDistributeCross: () => void;
  onDistributeSequential: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  students,
  rooms,
  schedules = [],
  setActiveTab,
  onDistributeCross,
  onDistributeSequential,
}) => {
  const totalStudents = students.length;
  const assignedStudents = students.filter((s) => s.roomId && s.seatNumber);
  const unassignedStudents = totalStudents - assignedStudents.length;
  const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const plottingPercentage = totalStudents > 0 ? Math.round((assignedStudents.length / totalStudents) * 100) : 0;

  // Group by class
  const classBreakdown = students.reduce((acc, s) => {
    acc[s.className] = (acc[s.className] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const major1Title = config.major1Name || DEFAULT_MAJOR_1;
  const major2Title = config.major2Name || DEFAULT_MAJOR_2;

  const handleOpenNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  const handlePrint = () => {
    setActiveTab('cards');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER SECTION - Variation 2 Exact Specification */}
      <header className="border-b-2 border-white pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="label-mono text-[#45a29e] font-bold flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#45a29e] animate-pulse"></span>
              ● ONLINE
            </span>
            <span className="label-mono">
              {config.examType} {config.semester ? `SEM. ${config.semester.toUpperCase()}` : ''} {config.academicYear}
            </span>
          </div>

          <h2 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[0.95] text-white uppercase">
            {config.examTitle || 'SUMATIF TENGAH SEMESTER (STS)'}
          </h2>

          <p className="text-white/60 text-sm max-w-2xl font-normal leading-relaxed">
            {config.schoolName || 'SMK YAK 1'} — Platform terintegrasi manajemen ujian, pembagian ruang sistem silang otomatis, penugasan pengawas, denah bangku, serta pencetakan kartu ujian A4 &amp; dokumen presensi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 no-print">
          <button
            onClick={handleOpenNewTab}
            className="btn-secondary-v2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>TAB BARU</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary-v2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>CETAK</span>
          </button>
        </div>
      </header>

      {/* Program Studi Room Partition Rule Banner */}
      <div className="bg-[#1f2833]/80 border border-white/10 p-4 rounded-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xs bg-[#45a29e] text-[#0b0c10] flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span className="font-syne tracking-wide uppercase">Aturan Penempatan Ruang Berdasarkan Program Studi</span>
              <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#45a29e]/20 text-[#45a29e] font-space-mono font-bold">AKTIF</span>
            </div>
            <div className="text-[11px] text-white/60 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-space-mono">
              <span>🔵 Ruang 01 – 05: <strong className="text-white">{major1Title}</strong></span>
              <span className="text-white/20">•</span>
              <span>🟢 Ruang 06 – Seterusnya: <strong className="text-white">{major2Title}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('rooms')}
          className="btn-secondary-v2 text-[11px] py-1.5 px-3"
        >
          <span>LIHAT DETAIL RUANG &rarr;</span>
        </button>
      </div>

      {/* GRID DASHBOARD - Variation 2 4-Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Total Peserta */}
        <div className="card-v2">
          <div className="flex items-center justify-between">
            <p className="label-mono">Total Peserta</p>
            <Users className="w-4 h-4 text-white/30" />
          </div>
          <div className="my-3">
            <div className="stat-val-v2">{totalStudents}</div>
            <p className="label-mono text-[0.6rem]">{Object.keys(classBreakdown).length} Rombongan Belajar</p>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/40 text-[11px]">Siswa Terdaftar</span>
            <button
              onClick={() => setActiveTab('students')}
              className="text-[#45a29e] hover:text-[#66fcf1] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
            >
              Kelola <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Ruang Ujian */}
        <div className="card-v2">
          <div className="flex items-center justify-between">
            <p className="label-mono">Ruang Ujian</p>
            <DoorOpen className="w-4 h-4 text-white/30" />
          </div>
          <div className="my-3">
            <div className="stat-val-v2">{rooms.length}</div>
            <p className="label-mono text-[0.6rem]">Kapasitas {totalCapacity} Bangku</p>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/40 text-[11px]">Ruang Aktif</span>
            <button
              onClick={() => setActiveTab('rooms')}
              className="text-[#45a29e] hover:text-[#66fcf1] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
            >
              Atur <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Status Plotting */}
        <div className="card-v2">
          <div className="flex items-center justify-between">
            <p className="label-mono">Status Plotting</p>
            {unassignedStudents === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-[#45a29e]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="my-3">
            <div className="stat-val-v2">{plottingPercentage}%</div>
            <p className="label-mono text-[0.6rem]">
              {assignedStudents.length} / {totalStudents} Terplotting
            </p>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/40 text-[11px]">
              {unassignedStudents === 0 ? 'Semua terdistribusi' : `${unassignedStudents} belum dapat`}
            </span>
            <button
              onClick={() => setActiveTab('seating')}
              className="text-[#45a29e] hover:text-[#66fcf1] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
            >
              Denah <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Kartu Ujian */}
        <div className="card-v2">
          <div className="flex items-center justify-between">
            <p className="label-mono">Kartu Ujian</p>
            <IdCard className="w-4 h-4 text-white/30" />
          </div>
          <div className="my-3">
            <div className="stat-val-v2">{assignedStudents.length}</div>
            <p className="label-mono text-[0.6rem]">Siap Cetak A4</p>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/40 text-[11px]">Format 4 Kartu/Lbr</span>
            <button
              onClick={() => setActiveTab('cards')}
              className="text-[#45a29e] hover:text-[#66fcf1] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
            >
              Buka <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Distribution Block (3 cols) + Workflow Block (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Distribution Block - 3 Columns */}
        <div className="lg:col-span-3 bg-white/[0.03] border border-dashed border-white/20 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="font-syne text-xl sm:text-2xl font-bold text-white tracking-tight uppercase">
                  ALOKASI PESERTA
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  Keterisian setiap ruangan ujian berdasarkan nomor urut dan pembagian program studi resmi.
                </p>
              </div>
              <p className="label-mono text-white/80">{rooms.length} RUANG AKTIF</p>
            </div>

            {/* Room Grid Cells */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {rooms.map((room) => {
                const count = students.filter((s) => s.roomId === room.id).length;
                const cap = room.capacity || 40;
                const isFull = count >= cap;
                return (
                  <div
                    key={room.id}
                    className={`p-2.5 text-center text-xs font-space-mono transition-all rounded-xs ${
                      isFull
                        ? 'bg-[#45a29e] text-[#0b0c10] font-bold border-none shadow-md'
                        : count > 0
                        ? 'bg-[#1f2833] text-white border border-white/20'
                        : 'bg-transparent text-white/40 border border-white/10'
                    }`}
                  >
                    <div className="font-bold tracking-wider">{room.name}</div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      [{count}/{cap}]
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution Button Group */}
          <div className="flex flex-wrap items-center gap-3.5 mt-8 pt-6 border-t border-white/10 no-print">
            <button
              onClick={onDistributeCross}
              className="btn-primary-v2"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>JALANKAN SISTEM SILANG</span>
            </button>
            <button
              onClick={onDistributeSequential}
              className="btn-secondary-v2"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>JALANKAN BERURUTAN</span>
            </button>
            <button
              onClick={() => setActiveTab('seating')}
              className="btn-secondary-v2"
            >
              <span>LIHAT DENAH MEJA</span>
            </button>
          </div>
        </div>

        {/* Workflow Block - 1 Column */}
        <div className="lg:col-span-1 border border-white/30 bg-[#1f2833]/70 p-6 flex flex-col justify-between">
          <div>
            <p className="label-mono mb-6 text-white font-bold border-b border-white/10 pb-2">
              ALUR KERJA PANITIA
            </p>

            <div className="space-y-4">
              <div 
                onClick={() => setActiveTab('config')}
                className="step-v2 cursor-pointer group"
              >
                <p className="label-mono group-hover:text-[#45a29e] transition-colors">01 Identitas</p>
                <p className="text-xs text-white/80 font-medium">Atur kop &amp; kepsek</p>
              </div>

              <div 
                onClick={() => setActiveTab('students')}
                className="step-v2 cursor-pointer group"
              >
                <p className="label-mono group-hover:text-[#45a29e] transition-colors">02 Peserta</p>
                <p className="text-xs text-white/80 font-medium">Generate nomor ujian</p>
              </div>

              <div 
                onClick={() => setActiveTab('rooms')}
                className="step-v2 cursor-pointer group"
              >
                <p className="label-mono group-hover:text-[#45a29e] transition-colors">03 Plotting</p>
                <p className="text-xs text-white/80 font-medium">Distribusi silang</p>
              </div>

              <div 
                onClick={() => setActiveTab('cards')}
                className="step-v2 cursor-pointer group"
              >
                <p className="label-mono group-hover:text-[#45a29e] transition-colors">04 Cetak</p>
                <p className="text-xs text-white/80 font-medium">Kartu &amp; Berita Acara</p>
              </div>

              <div 
                onClick={() => setActiveTab('schedules')}
                className="step-v2 cursor-pointer group"
              >
                <p className="label-mono group-hover:text-[#45a29e] transition-colors">05 Jadwal</p>
                <p className="text-xs text-white/80 font-medium">
                  {schedules.length > 0 ? `${schedules.length} Sesi Terdaftar` : 'Atur sesi mata pelajaran'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10">
            <button
              onClick={() => setActiveTab('cards')}
              className="btn-primary-v2 w-full text-center text-xs py-2.5"
            >
              <span>BUKA KARTU UJIAN</span>
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER - Variation 2 Exact Specification */}
      <footer className="border-t border-white/10 pt-6 mt-12 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left no-print">
        <p className="label-mono">
          {config.schoolName || 'SMK YAK 1'} — SISTEM INFORMASI MANAJEMEN UJIAN SEKOLAH
        </p>
        <p className="label-mono opacity-40">
          © 2026 EXAM-SYNC CORE
        </p>
      </footer>
    </div>
  );
};
