import React, { useState, useRef } from 'react';
import {
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  Laptop,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  X,
  Database,
  Radio,
  Share2,
  FileDown,
  FileUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ExamConfig, ExamRoom, Student, Proctor, ExamScheduleItem, ProctorAttendanceRecord } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
  students: Student[];
  rooms: ExamRoom[];
  proctors: Proctor[];
  schedules: ExamScheduleItem[];
  attendanceRecords: ProctorAttendanceRecord[];
  isConnected: boolean;
  isSyncing: boolean;
  onForceSyncAllToCloud: () => Promise<void>;
  onPullLatestFromCloud?: () => Promise<void>;
  onImportFullState?: (data: any) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  students,
  rooms,
  proctors,
  schedules,
  attendanceRecords,
  isConnected,
  isSyncing,
  onForceSyncAllToCloud,
  onPullLatestFromCloud,
  onImportFullState,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=1e293b`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleUploadAll = async () => {
    try {
      setUploadStatus('Mengupload data ke Cloud Database...');
      await onForceSyncAllToCloud();
      setUploadStatus('Data berhasil diupload dan disinkronkan ke Cloud!');
      setTimeout(() => setUploadStatus(null), 4000);
    } catch (err) {
      setUploadStatus('Gagal upload: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handlePullAll = async () => {
    if (!onPullLatestFromCloud) return;
    try {
      setPullStatus('Menarik data terbaru dari Cloud...');
      await onPullLatestFromCloud();
      setPullStatus('Data terbaru berhasil ditarik dan diterapkan ke perangkat ini!');
      setTimeout(() => setPullStatus(null), 4000);
    } catch (err) {
      setPullStatus('Gagal menarik data: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Generate complete export JSON object
  const getFullBackupObject = () => ({
    app: 'SIM-UJIAN-SEKOLAH',
    exportDate: new Date().toISOString(),
    version: '2.0.26',
    config,
    students,
    rooms,
    proctors,
    schedules,
    attendanceRecords,
  });

  const handleDownloadBackup = () => {
    const data = getFullBackupObject();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadangan-sim-ujian-${(config.schoolName || 'sekolah').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyBackupCode = () => {
    const data = getFullBackupObject();
    const jsonStr = JSON.stringify(data);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleApplyImportText = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Silakan tempel teks kode data terlebih dahulu.');
      return;
    }
    try {
      const parsed = JSON.parse(importText);
      if (onImportFullState) {
        onImportFullState(parsed);
        setImportText('');
        setShowImportArea(false);
        setUploadStatus('Data dari teks berhasil diimpor ke perangkat ini!');
        setTimeout(() => setUploadStatus(null), 4000);
      }
    } catch (err) {
      setImportError('Format JSON tidak valid. Pastikan menyalin seluruh teks dengan lengkap.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (onImportFullState) {
          onImportFullState(parsed);
          setShowImportArea(false);
          setUploadStatus(`File cadangan "${file.name}" berhasil diimpor!`);
          setTimeout(() => setUploadStatus(null), 4000);
        }
      } catch (err) {
        setImportError('Gagal membaca file: Format file bukan JSON yang valid.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Sinkronisasi Multi-Device &amp; Cadangan Data</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                  {isConnected ? 'Cloud Aktif' : 'Menghubungkan...'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Google Cloud Firestore &amp; Transfer Data Antar-Perangkat (Laptop/HP)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Diagnostic & Solution Guide Box */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-600 text-white shrink-0 mt-0.5">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold mb-1">
                Mengapa di Device 1 Berubah, tapi di Device Lain Belum Berubah?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                <li>
                  <strong>Di Device 1:</strong> Tekan tombol <span className="font-bold underline">"Kirim Data Ini ke Cloud"</span> di bawah agar perubahan yang Anda buat diunggah ke server cloud.
                </li>
                <li>
                  <strong>Di Device Lain:</strong> Buka menu ini di device tersebut lalu tekan <span className="font-bold underline">"Tarik Data Terbaru dari Cloud"</span>.
                </li>
                <li>
                  <strong>Alternatif 100% Cepat:</strong> Anda juga bisa menekan <span className="font-bold underline">"Unduh Cadangan (.json)"</span> di Device 1, lalu buka di Device 2 dan pilih <span className="font-bold underline">"Impor File"</span>.
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Metrics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Status Data Saat Ini di Perangkat Ini
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Peserta</span>
                <span className="text-lg font-black text-slate-900">{students.length}</span>
                <span className="text-[10px] text-slate-500 block">Siswa</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ruangan</span>
                <span className="text-lg font-black text-slate-900">{rooms.length}</span>
                <span className="text-[10px] text-slate-500 block">Ruang Ujian</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Pengawas</span>
                <span className="text-lg font-black text-slate-900">{proctors.length}</span>
                <span className="text-[10px] text-slate-500 block">Guru</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Jadwal Sesi</span>
                <span className="text-lg font-black text-indigo-600">{schedules.length}</span>
                <span className="text-[10px] text-slate-500 block">Mata Pelajaran</span>
              </div>
            </div>
          </div>

          {/* Two-Way Cloud Actions: Push & Pull */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Action 1: Push from this device to cloud */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  1. Kirim Data ke Cloud (Dari Device Ini)
                </span>
                <p className="text-[11px] text-slate-600">
                  Gunakan tombol ini di <strong>Device 1</strong> setelah Anda selesai mengatur ruang/siswa agar tersimpan ke cloud.
                </p>
                {uploadStatus && (
                  <p className="text-xs font-bold text-emerald-700 pt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {uploadStatus}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleUploadAll}
                className="w-full px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>{isSyncing ? 'Mengupload...' : 'Kirim Data Ini ke Cloud'}</span>
              </button>
            </div>

            {/* Action 2: Pull latest from cloud to this device */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <DownloadCloud className="w-4 h-4 text-emerald-600" />
                  2. Tarik Data dari Cloud (Ke Device Ini)
                </span>
                <p className="text-[11px] text-slate-600">
                  Gunakan tombol ini di <strong>Device Lain</strong> untuk mengambil data terbaru yang telah diatur di Device 1.
                </p>
                {pullStatus && (
                  <p className="text-xs font-bold text-emerald-700 pt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {pullStatus}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={isSyncing || !onPullLatestFromCloud}
                onClick={handlePullAll}
                className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Mengambil...' : 'Tarik Data Terbaru dari Cloud'}</span>
              </button>
            </div>
          </div>

          {/* Backup & Direct Transfer: Export & Import JSON */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Transfer Instan / Cadangan File (.JSON)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                100% Offline &amp; Tanpa Kuota
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              Cara paling aman dan terjamin untuk memindahkan seluruh data (200 peserta, 10 ruang, jadwal STS, dll.) antar-laptop/HP operator:
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-indigo-600" />
                <span>Unduh File Cadangan (.json)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyBackupCode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                <span>{copiedCode ? 'Kode Tersalin!' : 'Salin Teks Data'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportArea(!showImportArea)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer ml-auto"
              >
                <FileUp className="w-4 h-4 text-indigo-300" />
                <span>{showImportArea ? 'Tutup Form Impor' : 'Impor Data ke Device Ini'}</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            {/* Import Area Drawer */}
            {showImportArea && (
              <div className="mt-3 p-4 rounded-xl bg-white border border-indigo-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Pilih Cara Impor Data ke Device Ini:
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-300 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Pilih File .JSON dari Komputer</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Atau tempel teks kode data JSON di sini:
                  </label>
                  <textarea
                    rows={3}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder='Tempel teks data JSON yang telah disalin dari device 1 di sini...'
                    className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-slate-50"
                  />
                </div>

                {importError && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {importError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportArea(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyImportText}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Terapkan Data Sekarang
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Device Sharing & QR Code */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Buka di Smartphone, Tablet, atau Laptop Lain
                </h4>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Live URL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <img
                  src={qrUrl}
                  alt="QR Code Akses Aplikasi"
                  className="w-28 h-28 rounded-lg shadow-xs object-contain bg-white p-1 border border-slate-200"
                />
                <span className="text-[10px] text-slate-500 font-semibold mt-1.5 flex items-center gap-1">
                  <QrCode className="w-3 h-3" />
                  Scan untuk Buka di HP
                </span>
              </div>

              {/* Instructions and URL Link */}
              <div className="sm:col-span-2 space-y-2.5">
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Untuk Pengawas Ruang / Guru:</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Scan QR code ini untuk presensi digital dan tanda tangan online pengawas.
                  </p>
                  <div className="flex items-center gap-2 font-semibold text-slate-800 pt-1">
                    <Laptop className="w-3.5 h-3.5 text-slate-500" />
                    <span>Untuk Panitia / Operator Lain:</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Buka URL di bawah di browser laptop lain.
                  </p>
                </div>

                {/* Copyable link input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-mono focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

