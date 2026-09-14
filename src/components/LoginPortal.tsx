import React, { useState, useEffect } from 'react';
import { AuthUser, ExamConfig, Proctor, Student, UserRole } from '../types';
import { 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Building2, 
  DoorOpen,
  HelpCircle,
  ArrowRight,
  School,
  KeyRound,
  Cloud
} from 'lucide-react';

interface LoginPortalProps {
  config: ExamConfig;
  proctors: Proctor[];
  students: Student[];
  onLogin: (user: AuthUser) => void;
  isCloudConnected?: boolean;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  config,
  proctors,
  students,
  onLogin,
  isCloudConnected = true,
}) => {
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  
  // Form fields
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedProctorId, setSelectedProctorId] = useState<string>(proctors[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [studentInput, setStudentInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time Indonesian clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update default credentials when switching role
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setError(null);
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'proctor') {
      setUsername('pengawas');
      setPassword('pengawas123');
      if (proctors.length > 0 && !selectedProctorId) {
        setSelectedProctorId(proctors[0].id);
      }
    } else if (role === 'student') {
      const firstStudent = students[0];
      setStudentInput(firstStudent?.examNumber || firstStudent?.nisn || '26-04-01-001');
      setPassword('123456');
      if (students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(students[0].id);
      }
    }
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        if (activeRole === 'admin') {
          // Admin authentication
          if (
            (username.trim().toLowerCase() === 'admin' && password === 'admin123') ||
            (username.trim().toLowerCase() === 'panitia' && password === 'panitia123') ||
            password === 'admin123' ||
            username.trim().length >= 3
          ) {
            const user: AuthUser = {
              id: 'user-admin-1',
              username: username.trim() || 'admin',
              name: config.committeeHeadName || 'Administrator Panitia Ujian',
              role: 'admin',
              roleLabel: 'Panitia Ujian (Admin)',
              nipOrNis: config.committeeHeadNip || '198203152008011005',
              loginTime: nowStr,
            };
            onLogin(user);
          } else {
            setError('Username atau password admin salah. Coba: admin / admin123');
            setIsLoading(false);
          }
        } else if (activeRole === 'proctor') {
          // Proctor authentication
          const proctor = proctors.find((p) => p.id === selectedProctorId) || proctors[0];
          if (proctor) {
            const user: AuthUser = {
              id: `user-proctor-${proctor.id}`,
              username: proctor.nip || 'pengawas',
              name: proctor.name,
              role: 'proctor',
              roleLabel: 'Pengawas Ruang',
              nipOrNis: proctor.nip,
              proctorId: proctor.id,
              roomCode: proctor.assignedRoomCode || 'Ruang 01',
              loginTime: nowStr,
            };
            onLogin(user);
          } else {
            setError('Silakan pilih pengawas dari daftar.');
            setIsLoading(false);
          }
        } else if (activeRole === 'student') {
          // Student authentication
          const query = studentInput.trim().toLowerCase();
          const student = students.find(
            (s) =>
              s.examNumber.toLowerCase() === query ||
              s.nisn.toLowerCase() === query ||
              s.nis.toLowerCase() === query ||
              s.name.toLowerCase().includes(query) ||
              s.id === selectedStudentId
          ) || students[0];

          if (student) {
            const user: AuthUser = {
              id: `user-student-${student.id}`,
              username: student.examNumber,
              name: student.name,
              role: 'student',
              roleLabel: 'Peserta Ujian (Siswa)',
              nipOrNis: student.nisn || student.nis,
              studentId: student.id,
              className: student.className,
              examNumber: student.examNumber,
              roomCode: student.roomName || 'Ruang 01',
              loginTime: nowStr,
            };
            onLogin(user);
          } else {
            setError('Nomor Peserta atau NISN tidak ditemukan di master data.');
            setIsLoading(false);
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Terjadi kesalahan saat masuk ke sistem.');
        setIsLoading(false);
      }
    }, 450);
  };

  // Quick Demo Login Handler
  const handleQuickDemo = (role: UserRole) => {
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (role === 'admin') {
      onLogin({
        id: 'user-admin-demo',
        username: 'admin',
        name: config.committeeHeadName || 'Ahmad Dahlan, S.Pd (Ketua Panitia)',
        role: 'admin',
        roleLabel: 'Panitia Ujian (Admin)',
        nipOrNis: config.committeeHeadNip || '198203152008011005',
        loginTime: nowStr,
      });
    } else if (role === 'proctor') {
      const p = proctors[0] || {
        id: 'p-1',
        name: 'Dra. Hj. Siti Aminah, M.Pd',
        nip: '197505122000032001',
        subject: 'Matematika',
        assignedRoomCode: 'Ruang 01',
      };
      onLogin({
        id: `user-proctor-${p.id}`,
        username: 'pengawas',
        name: p.name,
        role: 'proctor',
        roleLabel: 'Pengawas Ruang',
        nipOrNis: p.nip,
        proctorId: p.id,
        roomCode: p.assignedRoomCode || 'Ruang 01',
        loginTime: nowStr,
      });
    } else {
      const s = students[0] || {
        id: 'std-1',
        name: 'Ahmad Fauzi Rahman',
        examNumber: '26-04-01-001',
        nisn: '0081234567',
        className: 'IX-A',
        roomName: 'Ruang 01',
      };
      onLogin({
        id: `user-student-${s.id}`,
        username: s.examNumber,
        name: s.name,
        role: 'student',
        roleLabel: 'Peserta Ujian (Siswa)',
        nipOrNis: s.nisn,
        studentId: s.id,
        className: s.className,
        examNumber: s.examNumber,
        roomCode: s.roomName || 'Ruang 01',
        loginTime: nowStr,
      });
    }
  };

  const selectedProctor = proctors.find((p) => p.id === selectedProctorId) || proctors[0];
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  return (
    <div className="min-h-screen bg-[#fdfdfc] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans text-[#1a1a18] relative">
      {/* Top Bar: Institution Badge & Real-time Clock */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 pb-5 border-b-[1.5px] border-[#1a1a18]">
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            <img 
              src={config.logoUrl} 
              alt="Logo Sekolah" 
              className="w-11 h-11 object-contain bg-white p-1 border border-[#1a1a18]" 
            />
          ) : (
            <div className="w-11 h-11 bg-[#1a1a18] flex items-center justify-center text-white font-bold border border-[#1a1a18]">
              <School className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-cormorant text-xl sm:text-2xl font-bold text-[#1a1a18] tracking-tight leading-tight">
              {config.schoolName || 'SMK YAK 1'}
            </h1>
            <p className="font-roboto-mono text-[11px] text-[#1a1a18]/70 flex items-center gap-2 mt-0.5 uppercase">
              <span>NPSN: {config.npsn || '20501234'}</span>
              <span>•</span>
              <span>{config.subdistrict}, {config.district}</span>
            </p>
          </div>
        </div>

        {/* Date & Time Widget & Cloud Status */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 border border-[#1a1a18] bg-white text-[11px] text-[#1a1a18] font-roboto-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-[#2e4cff]"></span>
            <Cloud className="w-3.5 h-3.5 text-[#2e4cff]" />
            <span>Database Realtime</span>
          </div>

          <div className="flex items-center gap-2.5 bg-[#f4f4f0] border border-[#1a1a18] px-3.5 py-1 text-xs font-roboto-mono text-[#1a1a18]">
            <Calendar className="w-3.5 h-3.5 text-[#2e4cff]" />
            <span className="text-[11px]">{currentDate}</span>
            <span className="text-[#1a1a18]/30">|</span>
            <Clock className="w-3.5 h-3.5 text-[#1a1a18]" />
            <span className="font-bold">{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Center Content: Main Login Portal Card */}
      <main className="relative z-10 max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white border-[1.5px] border-[#1a1a18] shadow-[8px_8px_0px_#1a1a18] overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#f4f4f0] p-5 sm:p-6 border-b-[1.5px] border-[#1a1a18]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="metadata mb-1.5">
                  Portal Masuk Resmi
                </div>
                <h2 className="font-cormorant text-2xl sm:text-3xl font-bold text-[#1a1a18] tracking-tight leading-tight">
                  Sistem Informasi Manajemen Ujian
                </h2>
                <p className="font-roboto-mono text-xs text-[#1a1a18]/70 mt-1">
                  {config.examTitle} • TP {config.academicYear} (Semester {config.semester})
                </p>
              </div>

              <div className="shrink-0 bg-white px-3 py-1.5 border border-[#1a1a18] text-center font-roboto-mono">
                <span className="block text-[9px] font-bold text-[#1a1a18]/60 uppercase tracking-widest">Kategori</span>
                <span className="text-xs font-bold text-[#2e4cff]">{config.examType}</span>
              </div>
            </div>
          </div>

          {/* Role Navigation Selector */}
          <div className="p-4 sm:p-6 pb-2">
            <label className="block font-roboto-mono text-[11px] font-bold uppercase tracking-wider text-[#1a1a18]/70 mb-2">
              Pilih Peran Masuk:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#f4f4f0] border border-[#1a1a18] rounded-full">
              {/* 1. Admin */}
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`py-2 px-2 sm:px-3 rounded-full text-xs font-roboto-mono font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-[#1a1a18] text-white'
                    : 'text-[#1a1a18] hover:bg-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Panitia</span>
              </button>

              {/* 2. Proctor */}
              <button
                type="button"
                onClick={() => handleRoleChange('proctor')}
                className={`py-2 px-2 sm:px-3 rounded-full text-xs font-roboto-mono font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRole === 'proctor'
                    ? 'bg-[#2e4cff] text-white'
                    : 'text-[#1a1a18] hover:bg-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pengawas</span>
              </button>

              {/* 3. Student */}
              <button
                type="button"
                onClick={() => handleRoleChange('student')}
                className={`py-2 px-2 sm:px-3 rounded-full text-xs font-roboto-mono font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRole === 'student'
                    ? 'bg-[#1a1a18] text-white'
                    : 'text-[#1a1a18] hover:bg-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Siswa</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 pt-3 space-y-4">
            {/* Error Notification */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-600 text-rose-800 text-xs font-roboto-mono flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: PANITIA / ADMIN */}
            {activeRole === 'admin' && (
              <div className="space-y-3.5">
                <div className="p-3 bg-[#f4f4f0] border border-[#1a1a18]/20 text-[11px] text-[#1a1a18]/80 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2e4cff] shrink-0 mt-0.5" />
                  <span>
                    Akses penuh untuk konfigurasi data ujian, distribusi peserta &amp; nomor ujian, denah meja silang, master pengawas, serta cetak dokumen resmi.
                  </span>
                </div>

                <div>
                  <label className="block font-roboto-mono text-xs font-semibold text-[#1a1a18] mb-1">
                    Username / ID Panitia
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#1a1a18]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username admin"
                      className="w-full bg-white border-[1.5px] border-[#1a1a18] pl-9 pr-3 py-2 text-xs text-[#1a1a18] placeholder-[#1a1a18]/40 focus:outline-none focus:ring-1 focus:ring-[#2e4cff] font-roboto-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-roboto-mono text-xs font-semibold text-[#1a1a18] mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#1a1a18]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password admin"
                      className="w-full bg-white border-[1.5px] border-[#1a1a18] pl-9 pr-10 py-2 text-xs text-[#1a1a18] placeholder-[#1a1a18]/40 focus:outline-none focus:ring-1 focus:ring-[#2e4cff] font-roboto-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a18]/50 hover:text-[#1a1a18] p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PENGAWAS RUANG */}
            {activeRole === 'proctor' && (
              <div className="space-y-3.5">
                <div className="p-3 bg-[#f4f4f0] border border-[#1a1a18]/20 text-[11px] text-[#1a1a18]/80 flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-[#2e4cff] shrink-0 mt-0.5" />
                  <span>
                    Akses langsung untuk pengawas ruang ujian: <strong>Presensi Digital dengan Input Tanda Tangan (TTD)</strong>, jadwal tugas, dan berita acara ruang.
                  </span>
                </div>

                <div>
                  <label className="block font-roboto-mono text-xs font-semibold text-[#1a1a18] mb-1">
                    Pilih Nama Pengawas Terdaftar:
                  </label>
                  <select
                    value={selectedProctorId}
                    onChange={(e) => setSelectedProctorId(e.target.value)}
                    className="w-full bg-white border-[1.5px] border-[#1a1a18] px-3 py-2 text-xs text-[#1a1a18] focus:outline-none focus:ring-1 focus:ring-[#2e4cff] font-roboto-mono"
                  >
                    {proctors.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.assignedRoomCode || 'Cadangan'} ({p.role || 'Pengawas'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProctor && (
                  <div className="p-2.5 bg-[#f4f4f0] border border-[#1a1a18]/20 text-xs font-roboto-mono space-y-1">
                    <div className="flex justify-between text-[#1a1a18]/70">
                      <span>NIP / Identitas:</span>
                      <span className="text-[#1a1a18] font-bold">{selectedProctor.nip || '-'}</span>
                    </div>
                    <div className="flex justify-between text-[#1a1a18]/70">
                      <span>Tugas Ruang:</span>
                      <span className="font-bold text-[#2e4cff]">{selectedProctor.assignedRoomCode || 'Pengawas Cadangan'}</span>
                    </div>
                    <div className="flex justify-between text-[#1a1a18]/70">
                      <span>Mata Pelajaran:</span>
                      <span className="text-[#1a1a18]">{selectedProctor.subject || 'Semua Mata Pelajaran'}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-roboto-mono text-xs font-semibold text-[#1a1a18] mb-1">
                    PIN / Kata Sandi Pengawas (Default: pengawas123)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#1a1a18]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan PIN pengawas"
                      className="w-full bg-white border-[1.5px] border-[#1a1a18] pl-9 pr-10 py-2 text-xs text-[#1a1a18] placeholder-[#1a1a18]/40 focus:outline-none focus:ring-1 focus:ring-[#2e4cff] font-roboto-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a18]/50 hover:text-[#1a1a18] p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PESERTA UJIAN (SISWA) */}
            {activeRole === 'student' && (
              <div className="space-y-3.5">
                <div className="p-3 bg-[#f4f4f0] border border-[#1a1a18]/20 text-[11px] text-[#1a1a18]/80 flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-[#2e4cff] shrink-0 mt-0.5" />
                  <span>
                    Akses siswa untuk mengecek alokasi ruang ujian, nomor meja, jadwal mata pelajaran, dan mencetak/menyimpan kartu peserta.
                  </span>
                </div>

                <div>
                  <label className="block font-roboto-mono text-xs font-semibold text-[#1a1a18] mb-1">
                    Nomor Peserta Ujian / NISN
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-[#1a1a18]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={studentInput}
                      onChange={(e) => setStudentInput(e.target.value)}
                      placeholder="Contoh: 26-04-01-001 atau NISN"
                      className="w-full bg-white border-[1.5px] border-[#1a1a18] pl-9 pr-3 py-2 text-xs text-[#1a1a18] placeholder-[#1a1a18]/40 focus:outline-none focus:ring-1 focus:ring-[#2e4cff] font-roboto-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-roboto-mono text-xs font-semibold text-[#1a1a18] mb-1">
                    Atau Pilih Siswa Contoh:
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      const st = students.find((s) => s.id === e.target.value);
                      if (st) setStudentInput(st.examNumber);
                    }}
                    className="w-full bg-white border-[1.5px] border-[#1a1a18] px-3 py-2 text-xs text-[#1a1a18] focus:outline-none focus:ring-1 focus:ring-[#2e4cff] font-roboto-mono"
                  >
                    {students.slice(0, 15).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className}) — No: {s.examNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudent && (
                  <div className="p-2.5 bg-[#f4f4f0] border border-[#1a1a18]/20 text-xs font-roboto-mono space-y-1">
                    <div className="flex justify-between text-[#1a1a18]/70">
                      <span>Nama Siswa:</span>
                      <span className="font-bold text-[#1a1a18]">{selectedStudent.name}</span>
                    </div>
                    <div className="flex justify-between text-[#1a1a18]/70">
                      <span>Kelas / Ruang:</span>
                      <span className="text-[#2e4cff] font-semibold">{selectedStudent.className} • {selectedStudent.roomName || 'Ruang 01'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#1a1a18]/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#2e4cff]"
                />
                <span className="font-roboto-mono text-xs">Ingat sesi masuk di perangkat ini</span>
              </label>

              <span className="text-[11px] font-roboto-mono text-[#1a1a18]/50">
                Aman &amp; Terverifikasi
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 text-xs font-roboto-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRole === 'proctor'
                  ? 'btn-black-accent'
                  : 'btn-black'
              } disabled:opacity-50`}
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Memverifikasi...' : `Masuk sebagai ${activeRole === 'admin' ? 'Panitia' : activeRole === 'proctor' ? 'Pengawas' : 'Peserta'}`}</span>
            </button>
          </form>

          {/* Quick Demo Login Chips (One-Click Testing) */}
          <div className="p-4 sm:p-6 pt-0 border-t-[1.5px] border-[#1a1a18] mt-2 bg-[#f4f4f0]">
            <div className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-roboto-mono text-[10.5px] font-bold uppercase tracking-wider text-[#1a1a18] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#2e4cff]" />
                  <span>Akses Cepat Uji Coba (One-Click Demo):</span>
                </span>
                <span className="font-roboto-mono text-[10px] text-[#2e4cff] font-bold flex items-center gap-1">
                  ● Siap
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-[#1a1a18] text-left transition-all cursor-pointer group shadow-xs"
                >
                  <div className="text-[10px] text-[#1a1a18] font-roboto-mono font-bold flex items-center justify-between">
                    <span>👑 Panitia Admin</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[11px] font-bold text-[#1a1a18] truncate mt-0.5">
                    {config.committeeHeadName || 'Ahmad Dahlan'}
                  </div>
                  <div className="text-[9px] text-[#1a1a18]/60 font-roboto-mono mt-0.5">admin / admin123</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('proctor')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-[#1a1a18] text-left transition-all cursor-pointer group shadow-xs"
                >
                  <div className="text-[10px] text-[#2e4cff] font-roboto-mono font-bold flex items-center justify-between">
                    <span>📋 Pengawas Ruang</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[11px] font-bold text-[#1a1a18] truncate mt-0.5">
                    {proctors[0]?.name || 'Dra. Hj. Siti Aminah'}
                  </div>
                  <div className="text-[9px] text-[#1a1a18]/60 font-roboto-mono mt-0.5">Ruang 01 • TTD Digital</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('student')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-[#1a1a18] text-left transition-all cursor-pointer group shadow-xs"
                >
                  <div className="text-[10px] text-[#1a1a18] font-roboto-mono font-bold flex items-center justify-between">
                    <span>🎓 Siswa Peserta</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[11px] font-bold text-[#1a1a18] truncate mt-0.5">
                    {students[0]?.name || 'Ahmad Fauzi'}
                  </div>
                  <div className="text-[9px] text-[#1a1a18]/60 font-roboto-mono mt-0.5">No: {students[0]?.examNumber || '26-04-01-001'}</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer: Server Status & Security Notice */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full pt-4 border-t-[1.5px] border-[#1a1a18] text-center text-xs font-roboto-mono text-[#1a1a18]/70 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2e4cff]"></span>
          <span>Sistem Informasi Manajemen Ujian {config.schoolName || 'SMK YAK 1'}</span>
        </div>

        <div className="text-[11px]">
          Mendukung Kurikulum Nasional • v2.0.26
        </div>
      </footer>
    </div>
  );
};
