import React, { useState } from 'react';
import { ExamConfig, ExamRoom, ExamScheduleItem, Student } from '../types';
import { BarcodeSVG, QRCodeSVG } from '../utils/barcode';
import { 
  FileText, 
  Scissors, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Printer, 
  Search, 
  Calendar, 
  ShieldCheck,
  Building,
  User,
  DoorOpen,
  LogOut,
  LogIn
} from 'lucide-react';

export type PermitType = 'all_in_one' | 'entry' | 'exit' | 'dispensation';
export type PermitLayout = 'slips_3' | 'slips_2' | 'full_page';
export type PermitFillMode = 'blank' | 'student';

interface DispensationPermitSheetProps {
  config: ExamConfig;
  rooms: ExamRoom[];
  students: Student[];
  schedules: ExamScheduleItem[];
  selectedSubject?: string;
  includeStampAndSignature?: boolean;
}

export const DispensationPermitSheet: React.FC<DispensationPermitSheetProps> = ({
  config,
  rooms,
  students,
  schedules,
  selectedSubject = '',
  includeStampAndSignature = true,
}) => {
  // Permit Configuration States
  const [permitType, setPermitType] = useState<PermitType>('all_in_one');
  const [permitLayout, setPermitLayout] = useState<PermitLayout>('slips_3');
  const [fillMode, setFillMode] = useState<PermitFillMode>('blank');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [studentSearch, setStudentSearch] = useState<string>('');
  
  // Custom Fields for Student Mode
  const [customReason, setCustomReason] = useState<string>('Terlambat hadir karena kendala teknis / transportasi');
  const [customTime, setCustomTime] = useState<string>('07.45 WIB');
  const [customReturnTime, setCustomReturnTime] = useState<string>('08.00 WIB');
  const [customPicketOfficer, setCustomPicketOfficer] = useState<string>(config.committeeHeadName || 'Petugas Piket Ujian');
  const [sheetCount, setSheetCount] = useState<number>(2); // Number of sheets in blank mode
  const [timeAllowance, setTimeAllowance] = useState<'none' | '10min' | '15min' | 'full'>('none');

  // Filtered student list for quick search
  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.examNumber.toLowerCase().includes(q) ||
      (s.className && s.className.toLowerCase().includes(q)) ||
      (s.roomName && s.roomName.toLowerCase().includes(q))
    );
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Presets for quick reasons
  const reasonPresets: Record<PermitType, string[]> = {
    all_in_one: [
      'Terlambat hadir karena kendala transportasi di perjalanan',
      'Kartu Tanda Peserta Ujian tertinggal / hilang',
      'Pemeriksaan kesehatan sementara ke Ruang UKS',
      'Izin mendesak ke kamar kecil / toilet',
      'Dispensasi panitia untuk mengikuti ujian reguler / susulan',
      'Penyelesaian administrasi kepesertaan ujian di sekretariat',
    ],
    entry: [
      'Terlambat hadir (macet / kendala transportasi di perjalanan)',
      'Kartu peserta ujian tertinggal di rumah / sedang dicetak ulang',
      'Selesai mendapatkan perawatan di Ruang UKS',
      'Menyelesaikan administrasi kartu di sekretariat panitia',
      'Mengikuti ujian susulan sesuai jadwal panitia',
    ],
    exit: [
      'Sakit / pusing / mual perlu perawatan sementara di Ruang UKS',
      'Izin mendesak ke toilet / kamar kecil',
      'Mengambil perlengkapan ujian yang tertinggal di sekretariat',
      'Dipanggil panitia untuk klarifikasi berkas administrasi',
    ],
    dispensation: [
      'Dispensasi keterlambatan dengan waktu pengerjaan normal',
      'Dispensasi mengikuti ujian tanpa kartu fisik (kartu darurat)',
      'Dispensasi penyelesaian administrasi kepesertaan ujian',
      'Dispensasi mengikuti ujian susulan resmi sekolah',
      'Dispensasi peserta tugas perwakilan lomba / kegiatan sekolah',
    ],
  };

  const getDocTitle = (type: PermitType) => {
    switch (type) {
      case 'entry':
        return 'SURAT IZIN MASUK RUANGAN UJIAN';
      case 'exit':
        return 'SURAT IZIN KELUAR RUANGAN UJIAN';
      case 'dispensation':
        return 'SURAT DISPENSASI PESERTA UJIAN';
      case 'all_in_one':
      default:
        return 'SURAT IZIN / DISPENSASI PESERTA UJIAN';
    }
  };

  // Generate cards to render
  const itemsPerSheet = permitLayout === 'slips_3' ? 3 : permitLayout === 'slips_2' ? 2 : 1;
  const totalItemsToRender = fillMode === 'blank' ? sheetCount * itemsPerSheet : 1;
  const items = Array.from({ length: totalItemsToRender }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Controls & Configuration Bar (Hidden in Print) */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 no-print space-y-4 text-xs font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Pengaturan Surat Izin Masuk/Keluar &amp; Dispensasi Peserta</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Digunakan oleh Petugas Piket, Panitia, dan Pengawas Ruang untuk mencatat keterlambatan, izin sementara, atau dispensasi resmi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600">Mode Pengisian:</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => setFillMode('blank')}
                className={`px-3 py-1 text-xs rounded-md font-bold transition-all cursor-pointer ${
                  fillMode === 'blank'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                📝 Blanko Kosong (Tulis Tangan)
              </button>
              <button
                type="button"
                onClick={() => setFillMode('student')}
                className={`px-3 py-1 text-xs rounded-md font-bold transition-all cursor-pointer ${
                  fillMode === 'student'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                👤 Siswa Tertentu (Otomatis)
              </button>
            </div>
          </div>
        </div>

        {/* Primary Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* 1. Jenis Surat */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Jenis Surat / Izin:
            </label>
            <select
              value={permitType}
              onChange={(e) => setPermitType(e.target.value as PermitType)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all_in_one">📋 Formulir Serbaguna (3-in-1 Checkbox)</option>
              <option value="entry">🚪 Surat Izin Masuk Ruangan (Terlambat)</option>
              <option value="exit">🚶 Surat Izin Keluar Ruangan (Sementara)</option>
              <option value="dispensation">📜 Surat Dispensasi Mengikuti Ujian</option>
            </select>
          </div>

          {/* 2. Format Layout Kertas */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Format Kertas (Ukuran Lembar):
            </label>
            <select
              value={permitLayout}
              onChange={(e) => setPermitLayout(e.target.value as PermitLayout)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="slips_3">✂ 3 Kupon / Lembar A4 (Format Hemat Piket)</option>
              <option value="slips_2">📄 2 Formulir / Lembar A4 (Format Sedang A5)</option>
              <option value="full_page">📜 1 Surat Penuh / Lembar A4 (Format Formal)</option>
            </select>
          </div>

          {/* 3. Conditional: Sheet Count (in blank mode) or Student Selector (in student mode) */}
          {fillMode === 'blank' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jumlah Lembar Blanko:
              </label>
              <select
                value={sheetCount}
                onChange={(e) => setSheetCount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={1}>1 Lembar ({itemsPerSheet} Formulir)</option>
                <option value={2}>2 Lembar ({itemsPerSheet * 2} Formulir)</option>
                <option value={3}>3 Lembar ({itemsPerSheet * 3} Formulir)</option>
                <option value={5}>5 Lembar ({itemsPerSheet * 5} Formulir)</option>
                <option value={10}>10 Lembar ({itemsPerSheet * 10} Formulir)</option>
              </select>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Peserta Ujian:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari nama / nomor / kelas..."
                  className="w-1/3 px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                />
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium truncate"
                >
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className || '-'}) • {s.roomName || 'Tanpa Ruang'} • No: {s.examNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 4. Picket Officer Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Petugas Piket / Panitia:
            </label>
            <input
              type="text"
              value={customPicketOfficer}
              onChange={(e) => setCustomPicketOfficer(e.target.value)}
              placeholder="Nama Petugas Piket"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
            />
          </div>
        </div>

        {/* Extended Settings for Student Mode */}
        {fillMode === 'student' && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Alasan Izin / Dispensasi:
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Ketikkan alasan izin..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
                />
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-slate-500 font-semibold py-0.5">Pilihan Cepat:</span>
                  {(reasonPresets[permitType] || reasonPresets.all_in_one).slice(0, 3).map((r, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomReason(r)}
                      className="text-[10px] bg-white hover:bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-slate-700 transition-colors cursor-pointer truncate max-w-xs"
                      title={r}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Waktu &amp; Tambahan Waktu:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Jam Izin:</span>
                  <input
                    type="text"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-[11px]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Tambahan:</span>
                  <select
                    value={timeAllowance}
                    onChange={(e) => setTimeAllowance(e.target.value as any)}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-[11px]"
                  >
                    <option value="none">Tidak Ditambah</option>
                    <option value="10min">+10 Menit</option>
                    <option value="15min">+15 Menit</option>
                    <option value="full">Sesuai Durasi Penuh</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tip Box */}
        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between gap-3 text-indigo-900 text-[11px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Rekomendasi Panitia:</strong> Cetak 3–5 lembar format <strong>3 Kupon / Lembar A4 (Blanko Kosong)</strong> sebelum ujian dimulai dan simpan di meja piket panitia.
            </span>
          </div>
          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200 shrink-0">
            Total Dokumen: {totalItemsToRender} Kupon ({Math.ceil(totalItemsToRender / itemsPerSheet)} Lembar A4)
          </span>
        </div>
      </div>

      {/* Printable Sheet View Canvas */}
      <div className="print:m-0 space-y-6 print:space-y-0">
        {/* Render sheets */}
        {Array.from({ length: Math.ceil(totalItemsToRender / itemsPerSheet) }).map((_, sheetIndex) => {
          const sheetItems = items.slice(sheetIndex * itemsPerSheet, (sheetIndex + 1) * itemsPerSheet);

          return (
            <div
              key={sheetIndex}
              className={`bg-white border-2 border-slate-800 rounded-lg p-4 md:p-6 print:p-4 print:border-none print:shadow-none shadow-sm ${
                sheetIndex > 0 ? 'print:break-before-page' : ''
              }`}
              style={{ minHeight: permitLayout === 'full_page' ? '297mm' : 'auto' }}
            >
              <div
                className={`flex flex-col justify-between ${
                  permitLayout === 'slips_3'
                    ? 'space-y-4'
                    : permitLayout === 'slips_2'
                    ? 'space-y-6'
                    : 'space-y-4'
                }`}
              >
                {sheetItems.map((_, itemIndexOnSheet) => {
                  const absoluteIndex = sheetIndex * itemsPerSheet + itemIndexOnSheet;
                  const isLastOnSheet = itemIndexOnSheet === sheetItems.length - 1;

                  return (
                    <React.Fragment key={itemIndexOnSheet}>
                      <PermitSlipItem
                        config={config}
                        type={permitType}
                        layout={permitLayout}
                        fillMode={fillMode}
                        student={selectedStudent}
                        reason={customReason}
                        time={customTime}
                        returnTime={customReturnTime}
                        officerName={customPicketOfficer}
                        timeAllowance={timeAllowance}
                        selectedSubject={selectedSubject}
                        includeStampAndSignature={includeStampAndSignature}
                        slipNumber={`REG-${String(absoluteIndex + 1).padStart(3, '0')}`}
                      />

                      {/* Cut guide if not last on sheet */}
                      {!isLastOnSheet && (
                        <div className="relative py-1 flex items-center justify-center my-1 select-none">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-dashed border-slate-400"></div>
                          </div>
                          <div className="relative bg-white px-3 flex items-center gap-1.5 text-[9.5px] font-mono text-slate-500 uppercase tracking-widest font-semibold border border-slate-300 rounded-full shadow-2xs">
                            <Scissors className="w-3 h-3 rotate-90 text-slate-600" />
                            <span>Potong di Sini (Garis Gunting)</span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --- SINGLE PERMIT SLIP ITEM COMPONENT --- */
interface PermitSlipItemProps {
  config: ExamConfig;
  type: PermitType;
  layout: PermitLayout;
  fillMode: PermitFillMode;
  student: Student;
  reason: string;
  time: string;
  returnTime: string;
  officerName: string;
  timeAllowance: 'none' | '10min' | '15min' | 'full';
  selectedSubject: string;
  includeStampAndSignature: boolean;
  slipNumber: string;
}

const PermitSlipItem: React.FC<PermitSlipItemProps> = ({
  config,
  type,
  layout,
  fillMode,
  student,
  reason,
  time,
  returnTime,
  officerName,
  timeAllowance,
  selectedSubject,
  includeStampAndSignature,
  slipNumber,
}) => {
  const isCompact = layout === 'slips_3';
  const isFullPage = layout === 'full_page';

  const docTitle =
    type === 'entry'
      ? 'SURAT IZIN MASUK RUANGAN UJIAN'
      : type === 'exit'
      ? 'SURAT IZIN KELUAR RUANGAN UJIAN'
      : type === 'dispensation'
      ? 'SURAT DISPENSASI PESERTA UJIAN'
      : 'SURAT IZIN / DISPENSASI UJIAN';

  const dateStr = config.issueDate || new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={`border-2 border-slate-900 rounded-md p-3 md:p-4 bg-white font-sans text-slate-900 flex flex-col justify-between ${
        isFullPage ? 'min-h-[250mm] p-8' : isCompact ? 'text-[10px]' : 'text-[11px]'
      }`}
    >
      {/* 1. Header & Kop Surat */}
      <div>
        <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-2">
          {config.logoUrl && (
            <div
              className={`${
                isCompact ? 'w-10 h-10' : isFullPage ? 'w-16 h-16' : 'w-12 h-12'
              } shrink-0 flex items-center justify-center`}
            >
              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex-1 text-center font-serif leading-tight">
            <div
              className={`${
                isCompact ? 'text-[8px]' : 'text-[9.5px]'
              } uppercase font-bold text-slate-700 tracking-wider`}
            >
              PANITIA PELAKSANA {config.examTitle.toUpperCase()}
            </div>
            <div
              className={`${
                isCompact ? 'text-xs' : isFullPage ? 'text-lg' : 'text-sm'
              } font-black uppercase text-slate-950`}
            >
              {config.schoolName}
            </div>
            <div
              className={`${
                isCompact ? 'text-[7.5px]' : 'text-[8.5px]'
              } font-sans text-slate-600 mt-0.5`}
            >
              {config.address} • Telp: {config.phone}
            </div>
          </div>
          <div className="shrink-0 text-right font-mono text-[8px] text-slate-500 hidden sm:block">
            <div>No. Seri: {slipNumber}</div>
            <div className="font-bold text-slate-800">TA {config.academicYear}</div>
          </div>
        </div>

        {/* 2. Document Title & Registration Number */}
        <div className="text-center py-2">
          <div
            className={`font-black uppercase tracking-wide underline inline-block ${
              isCompact ? 'text-xs' : isFullPage ? 'text-base' : 'text-sm'
            }`}
          >
            {docTitle}
          </div>
          <div
            className={`font-mono text-slate-600 ${
              isCompact ? 'text-[8px]' : 'text-[9.5px]'
            }`}
          >
            Nomor: 421.5 / {fillMode === 'student' ? slipNumber : '.......'} / PAN-
            {config.examTitle.replace(/[^A-Z0-9]/gi, '').slice(0, 4) || 'UJN'} /{' '}
            {new Date().getFullYear()}
          </div>
        </div>

        {/* 3. Checkboxes for 3-in-1 Serbaguna Mode */}
        {type === 'all_in_one' && (
          <div className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 mb-2 flex flex-wrap items-center justify-around gap-2 text-[9px] font-bold">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 border border-slate-700 bg-white rounded-xs text-center font-bold leading-3">
                {fillMode === 'student' && reason.toLowerCase().includes('masuk') ? '✓' : ''}
              </span>
              <span>IZIN MASUK (TERLAMBAT)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 border border-slate-700 bg-white rounded-xs text-center font-bold leading-3">
                {fillMode === 'student' && reason.toLowerCase().includes('keluar') ? '✓' : ''}
              </span>
              <span>IZIN KELUAR SEMENTARA (UKS / TOILET)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 border border-slate-700 bg-white rounded-xs text-center font-bold leading-3">
                {fillMode === 'student' && reason.toLowerCase().includes('dispensasi') ? '✓' : ''}
              </span>
              <span>DISPENSASI UJIAN / SUSULAN</span>
            </span>
          </div>
        )}

        {/* 4. Student Identity Form Grid */}
        <div className="space-y-1 text-slate-900 leading-snug">
          <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} italic text-slate-600 mb-1`}>
            Yang bertanda tangan di bawah ini, Panitia / Petugas Piket memberikan izin kepada:
          </p>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 bg-slate-50/70 p-2 rounded border border-slate-300 ${
              isCompact ? 'text-[9.5px]' : 'text-[11px]'
            }`}
          >
            <div className="flex">
              <span className="w-28 font-semibold text-slate-700">Nama Peserta</span>
              <span className="w-2">:</span>
              <span className="font-bold flex-1 uppercase">
                {fillMode === 'student' ? student?.name : '..........................................................'}
              </span>
            </div>

            <div className="flex">
              <span className="w-28 font-semibold text-slate-700">No. Peserta Ujian</span>
              <span className="w-2">:</span>
              <span className="font-mono font-bold flex-1">
                {fillMode === 'student' ? student?.examNumber : '..........................................................'}
              </span>
            </div>

            <div className="flex">
              <span className="w-28 font-semibold text-slate-700">Kelas / Rombel</span>
              <span className="w-2">:</span>
              <span className="font-bold flex-1">
                {fillMode === 'student' ? student?.className : '..........................................................'}
              </span>
            </div>

            <div className="flex">
              <span className="w-28 font-semibold text-slate-700">NISN / NIS</span>
              <span className="w-2">:</span>
              <span className="font-mono flex-1">
                {fillMode === 'student' ? student?.nisn || '-' : '..........................................................'}
              </span>
            </div>

            <div className="flex">
              <span className="w-28 font-semibold text-slate-700">Ruang / Meja</span>
              <span className="w-2">:</span>
              <span className="font-bold text-indigo-950 flex-1">
                {fillMode === 'student'
                  ? `${student?.roomName || student?.roomId || '-'} (Meja ${student?.seatNumber ? String(student.seatNumber).padStart(2, '0') : '-'})`
                  : 'Ruang: ............. / Meja: .............'}
              </span>
            </div>

            <div className="flex">
              <span className="w-28 font-semibold text-slate-700">Mata Pelajaran</span>
              <span className="w-2">:</span>
              <span className="font-semibold flex-1">
                {selectedSubject || '..........................................................'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Permission Clauses & Reasons */}
        <div className="mt-2 space-y-1.5">
          <div
            className={`border border-slate-300 rounded p-2 bg-white ${
              isCompact ? 'text-[9.5px]' : 'text-[10.5px]'
            }`}
          >
            <div className="flex items-start gap-1">
              <span className="font-bold text-slate-800 w-28 shrink-0">Alasan / Keperluan:</span>
              <span className="w-2">:</span>
              <span className="flex-1 font-medium">
                {fillMode === 'student' ? (
                  <strong className="text-slate-950">{reason}</strong>
                ) : (
                  <span className="text-slate-400 font-mono">
                    ...................................................................................................................................
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-dashed border-slate-200">
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700 w-28 shrink-0">Waktu Diberikan:</span>
                <span className="w-2">:</span>
                <span className="font-mono font-semibold">
                  {fillMode === 'student' ? time : 'Pukul: ...... : ...... WIB'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700 w-28 shrink-0">Batas Kembali / Tambahan:</span>
                <span className="w-2">:</span>
                <span className="font-mono font-semibold">
                  {fillMode === 'student'
                    ? timeAllowance !== 'none'
                      ? `Ada Tambahan (${timeAllowance === '10min' ? '10 Menit' : timeAllowance === '15min' ? '15 Menit' : 'Waktu Penuh'})`
                      : 'Tanpa Tambahan Waktu'
                    : 'Pukul: ...... : ...... WIB / [ ] Tambah [ ] Tidak'}
                </span>
              </div>
            </div>
          </div>

          <p className={`${isCompact ? 'text-[8px]' : 'text-[9px]'} text-slate-600 leading-tight`}>
            * Surat izin ini wajib diserahkan kepada <strong>Pengawas Ruang Ujian</strong> saat memasuki ruangan, dan dicatat pada Berita Acara Pelaksanaan Ujian.
          </p>
        </div>
      </div>

      {/* 6. Official Signatures Footer */}
      <div
        className={`pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center font-sans ${
          isCompact ? 'text-[8.5px]' : isFullPage ? 'text-xs pt-8' : 'text-[9.5px]'
        }`}
      >
        <div>
          <div className="text-slate-600">Peserta Ujian,</div>
          <div className={`${isCompact ? 'h-8' : isFullPage ? 'h-16' : 'h-10'}`}></div>
          <div className="font-bold underline uppercase truncate">
            {fillMode === 'student' ? student?.name : '( .............................. )'}
          </div>
          <div className="text-[7.5px] text-slate-500">Tanda Tangan Peserta</div>
        </div>

        <div>
          <div className="text-slate-600">Pengawas Ruang Ujian,</div>
          <div className={`${isCompact ? 'h-8' : isFullPage ? 'h-16' : 'h-10'}`}></div>
          <div className="font-bold underline truncate">
            ( .............................. )
          </div>
          <div className="text-[7.5px] text-slate-500">Paraf &amp; Jam Masuk Ruang</div>
        </div>

        <div>
          <div className="text-slate-600 truncate">
            {config.district || 'Kota'}, {dateStr}
          </div>
          <div className="font-semibold text-slate-800">Petugas Piket / Panitia,</div>
          <div className={`${isCompact ? 'h-8' : isFullPage ? 'h-16' : 'h-10'} flex items-center justify-center`}>
            {includeStampAndSignature && config.stampUrl && (
              <img src={config.stampUrl} alt="Stempel" className="max-h-full object-contain opacity-75" />
            )}
          </div>
          <div className="font-bold underline truncate">
            {officerName || '( .............................. )'}
          </div>
          <div className="text-[7.5px] text-slate-500">NIP. ..................................</div>
        </div>
      </div>
    </div>
  );
};
