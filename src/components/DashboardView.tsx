import React from 'react';
import { ActiveTab, ExamConfig, ExamRoom, ExamScheduleItem, Student } from '../types';
import { 
  Printer, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
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
  const plottingPercentage = totalStudents > 0 ? Math.round((assignedStudents.length / totalStudents) * 100) : 0;

  const major1Title = config.major1Name || DEFAULT_MAJOR_1;
  const major2Title = config.major2Name || DEFAULT_MAJOR_2;

  const handleOpenCards = () => {
    setActiveTab('cards');
  };

  const handlePrintCards = () => {
    setActiveTab('cards');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="space-y-0 border border-[#1a1a18] bg-white shadow-sm animate-in fade-in duration-300">
      {/* HERO SECTION - Variation 3 Exact Specification */}
      <section className="p-6 sm:p-10 lg:p-12 border-b-[1.5px] border-[#1a1a18] flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-[#fdfdfc]">
        <div className="space-y-3 max-w-2xl">
          <div className="metadata">
            {config.examTitle || 'Sumatif Tengah Semester'} • {config.semester ? `Semester ${config.semester.toUpperCase()}` : ''} {config.academicYear}
          </div>
          <h1 className="font-cormorant text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1a1a18] leading-[0.95] m-0">
            SIM Ujian Terintegrasi
          </h1>
          <p className="font-normal text-sm sm:text-base text-[#1a1a18]/70 leading-relaxed max-w-xl pt-1">
            Platform otomasi pembagian sistem silang antar rombel, visualisasi denah bangku, serta pencetakan kartu ujian resmi untuk {config.schoolName || 'SMK YAK 1'}.
          </p>

          {/* Program Studi Partition Notice */}
          <div className="pt-2 flex flex-wrap items-center gap-2 font-roboto-mono text-[11px] text-[#1a1a18]">
            <span className="px-2 py-0.5 border border-[#1a1a18] bg-[#f4f4f0] font-semibold">
              ATURAN JURUSAN:
            </span>
            <span className="text-[#2e4cff] font-bold">R.01 – 05: {major1Title}</span>
            <span className="text-[#1a1a18]/30">|</span>
            <span className="text-emerald-700 font-bold">R.06+: {major2Title}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 no-print">
          <button
            onClick={handlePrintCards}
            className="btn-black-accent w-full sm:w-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Siswa</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rooms')}
              className="btn-outline-black text-[11px] py-1.5 px-3"
            >
              <span>Detail Ruangan</span>
            </button>
            {typeof window !== 'undefined' && window.self !== window.top && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-black text-[11px] py-1.5 px-3 inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Tab Baru</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* BODY CONTENT: STATS COLUMN (1 col) + ACTION COLUMN (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* STATS COLUMN - Left */}
        <section className="p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r-[1.5px] border-[#1a1a18] flex flex-col justify-between gap-8 bg-[#fdfdfc]">
          <div className="space-y-8">
            <div className="stat-item">
              <h3 className="font-cormorant text-5xl sm:text-6xl font-normal text-[#1a1a18] leading-none m-0">
                {totalStudents}
              </h3>
              <span className="font-roboto-mono text-xs uppercase tracking-wider text-[#1a1a18]/60 mt-1.5 block">
                Total Peserta Terdaftar
              </span>
            </div>

            <div className="stat-item">
              <h3 className="font-cormorant text-5xl sm:text-6xl font-normal text-[#1a1a18] leading-none m-0">
                {rooms.length}
              </h3>
              <span className="font-roboto-mono text-xs uppercase tracking-wider text-[#1a1a18]/60 mt-1.5 block">
                Ruang Ujian Tersedia
              </span>
            </div>

            <div className="stat-item">
              <div className="flex items-baseline gap-2">
                <h3 className="font-cormorant text-5xl sm:text-6xl font-normal text-[#1a1a18] leading-none m-0">
                  {plottingPercentage}%
                </h3>
                {unassignedStudents === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-[#2e4cff]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <span className="font-roboto-mono text-xs uppercase tracking-wider text-[#1a1a18]/60 mt-1.5 block">
                Plotting Status ({assignedStudents.length}/{totalStudents} Siswa)
              </span>
            </div>
          </div>

          {/* System Workflow section */}
          <div className="pt-6 border-t border-[#1a1a18]/20 mt-4">
            <div className="metadata mb-2.5">System Workflow</div>
            <div className="font-roboto-mono text-[11px] leading-relaxed text-[#1a1a18]/75 space-y-1">
              <div 
                onClick={() => setActiveTab('config')}
                className="hover:text-[#2e4cff] cursor-pointer transition-colors"
              >
                01. Identitas &amp; Kop Surat
              </div>
              <div 
                onClick={() => setActiveTab('students')}
                className="hover:text-[#2e4cff] cursor-pointer transition-colors"
              >
                02. Import Peserta Excel / Generate No.
              </div>
              <div 
                onClick={() => setActiveTab('rooms')}
                className="hover:text-[#2e4cff] cursor-pointer transition-colors"
              >
                03. Run Shuffle Protocol (Silang)
              </div>
              <div 
                onClick={() => setActiveTab('seating')}
                className="hover:text-[#2e4cff] cursor-pointer transition-colors"
              >
                04. Verify Seating Plan (Denah Bangku)
              </div>
              <div 
                onClick={() => setActiveTab('cards')}
                className="hover:text-[#2e4cff] cursor-pointer transition-colors"
              >
                05. Final Document Print (Kartu &amp; Presensi)
              </div>
            </div>
          </div>
        </section>

        {/* ACTION COLUMN - Right (spans 2 cols) */}
        <section className="lg:col-span-2 p-6 sm:p-8 lg:p-10 bg-[#f4f4f0] overflow-y-auto flex flex-col justify-between">
          <div>
            {/* 2 NEO-BRUTALIST PROTOCOL CARDS with 6px SOLID BLACK SHADOW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Sistem Silang */}
              <div className="block-card">
                <div className="metadata text-[#1a1a18]">Protocol Selection</div>
                <h4 className="font-cormorant text-2xl font-bold text-[#1a1a18] leading-tight m-0">
                  Sistem Silang Antar Kelas
                </h4>
                <p className="text-xs text-[#1a1a18]/75 leading-relaxed m-0">
                  Menyilangkan peserta antar tingkatan di setiap ruangan dengan partisi program studi resmi. Menjamin integritas dan ketertiban ruang ujian.
                </p>
                <div className="pt-2 mt-auto">
                  <button
                    onClick={onDistributeCross}
                    className="btn-black w-full"
                  >
                    <span>Jalankan Sistem Silang</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Sistem Berurutan */}
              <div className="block-card">
                <div className="metadata text-[#1a1a18]">Protocol Selection</div>
                <h4 className="font-cormorant text-2xl font-bold text-[#1a1a18] leading-tight m-0">
                  Sistem Berurutan per Rombel
                </h4>
                <p className="text-xs text-[#1a1a18]/75 leading-relaxed m-0">
                  Mengisi ruangan berurutan berdasarkan rombongan belajar dan nomor urut siswa dari Ruang 01 sampai selesai.
                </p>
                <div className="pt-2 mt-auto">
                  <button
                    onClick={onDistributeSequential}
                    className="btn-outline-black w-full"
                  >
                    <span>Jalankan Berurutan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ROOM GRID - Variation 3 Exact 8-Column Grid */}
            <div className="mt-8 pt-6 border-t border-[#1a1a18]/15">
              <div className="flex items-center justify-between mb-4">
                <div className="font-roboto-mono text-xs uppercase tracking-wider font-semibold text-[#1a1a18]">
                  Alokasi Ruang Ujian ({rooms.length} Ruang Aktif)
                </div>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className="font-roboto-mono text-[11px] text-[#2e4cff] hover:underline uppercase inline-flex items-center gap-1 cursor-pointer font-bold"
                >
                  Detail Ruang <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {rooms.map((room) => {
                  const count = students.filter((s) => s.roomId === room.id).length;
                  const isAssigned = count > 0;
                  const shortName = room.name.replace('Ruang ', 'R');
                  return (
                    <div
                      key={room.id}
                      onClick={() => setActiveTab('seating')}
                      title={`${room.name}: ${count}/${room.capacity} Siswa`}
                      className={`room-tag cursor-pointer ${isAssigned ? 'active' : ''}`}
                    >
                      {shortName} ({count})
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Nav shortcut banner */}
          <div className="mt-8 pt-4 border-t border-[#1a1a18]/15 flex flex-wrap items-center justify-between gap-3 text-xs font-roboto-mono">
            <span className="text-[#1a1a18]/60">
              Format Cetak Resmi A4: 4 Kartu/Lembar • Stiker Meja • Berita Acara
            </span>
            <button
              onClick={handleOpenCards}
              className="font-bold text-[#2e4cff] hover:underline uppercase inline-flex items-center gap-1 cursor-pointer"
            >
              Lihat Preview Kartu Ujian &rarr;
            </button>
          </div>
        </section>
      </div>

      {/* FOOTER - Variation 3 Exact Specification */}
      <footer className="p-4 sm:p-6 border-t-[1.5px] border-[#1a1a18] flex flex-col sm:flex-row justify-between items-center gap-2 font-roboto-mono text-xs text-[#1a1a18]/70 bg-[#fdfdfc] no-print">
        <div>Sistem Informasi Manajemen Ujian {config.schoolName || 'SMK YAK 1'}</div>
        <div>Mendukung Kurikulum Nasional • v2.0.26</div>
      </footer>
    </div>
  );
};
