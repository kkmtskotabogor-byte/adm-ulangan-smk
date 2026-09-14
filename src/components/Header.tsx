import React, { useState } from 'react';
import { ActiveTab, AuthUser, ExamConfig } from '../types';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  DoorOpen, 
  Grid3X3, 
  IdCard, 
  FileText, 
  Printer, 
  RotateCcw, 
  ExternalLink, 
  UserCheck,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Cloud,
  Calendar,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  config: ExamConfig;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onResetData: () => void;
  onQuickPrint: () => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  isCloudSynced?: boolean;
  isSyncing?: boolean;
  onOpenCloudSyncModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  onResetData,
  onQuickPrint,
  authUser,
  onLogout,
  onOpenCloudSyncModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'DASHBOARD', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'config', label: 'IDENTITAS & UJIAN', icon: <Settings className="w-4 h-4" /> },
    { id: 'students', label: 'DATA PESERTA', icon: <Users className="w-4 h-4" /> },
    { id: 'schedules', label: 'JADWAL UJIAN', icon: <Calendar className="w-4 h-4" /> },
    { id: 'rooms', label: 'RUANG & PLOTTING', icon: <DoorOpen className="w-4 h-4" /> },
    { id: 'proctors', label: 'PENGAWAS & ABSEN', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'seating', label: 'DENAH MEJA', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'cards', label: 'CETAK KARTU', icon: <IdCard className="w-4 h-4" /> },
    { id: 'documents', label: 'DOKUMEN UJIAN', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR - Variation 2 Exact Specification */}
      <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-white/10 bg-[#0b0c10] p-8 flex-col gap-8 h-screen sticky top-0 overflow-y-auto no-print">
        {/* Brand */}
        <div className="space-y-1">
          <h1 className="font-syne text-2xl font-extrabold tracking-tight text-[#45a29e]">
            EXAM-SYNC
          </h1>
          <p className="label-mono">System V.2.1</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xs text-[0.82rem] font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/10 border-l-[3px] border-[#45a29e]'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
                }`}
              >
                <span className={isActive ? 'text-[#45a29e]' : 'text-white/40'}>{item.icon}</span>
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Panitia / User Footer */}
        <div className="mt-auto pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="label-mono">Panitia Ujian</p>
              <p className="text-xs font-bold text-white mt-0.5 truncate max-w-[150px]">
                {authUser?.name || 'Ust. Ahmad Fauzan'}
              </p>
              <p className="text-[10px] text-[#45a29e] font-space-mono uppercase mt-0.5">
                {authUser?.roleLabel || 'Administrator'}
              </p>
            </div>

            {onOpenCloudSyncModal && (
              <button
                onClick={onOpenCloudSyncModal}
                title="Database Realtime Cloud Firestore"
                className="p-1.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onResetData}
              title="Kembalikan data awal"
              className="p-2 border border-white/20 text-white/60 hover:text-white hover:bg-white/5 rounded-xs transition-colors cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="btn-secondary-v2 flex-1 text-[11px] py-2 tracking-wider"
              >
                <LogOut className="w-3 h-3" />
                <span>KELUAR</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR for Screens < lg */}
      <header className="lg:hidden bg-[#0b0c10] border-b border-white/10 sticky top-0 z-40 px-4 py-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white/80 hover:text-white border border-white/20 rounded-xs"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="font-syne text-lg font-bold text-[#45a29e] leading-none">
                EXAM-SYNC
              </h1>
              <p className="label-mono mt-0.5">V.2.1 • {config.examType}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onQuickPrint}
              className="btn-primary-v2 text-[10px] px-3 py-1.5"
            >
              <Printer className="w-3 h-3" />
              <span>CETAK</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-white/60 hover:text-white border border-white/20 rounded-xs"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Quick Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2.5 pb-1 scrollbar-none border-t border-white/5 mt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap rounded-xs transition-colors ${
                  isActive
                    ? 'bg-[#45a29e] text-[#0b0c10] font-bold'
                    : 'text-white/60 hover:text-white bg-white/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[96px] z-50 bg-[#0b0c10]/95 backdrop-blur-md p-6 overflow-y-auto border-t border-white/10 flex flex-col gap-6">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xs text-sm font-semibold flex items-center gap-3 ${
                      isActive
                        ? 'text-white bg-white/10 border-l-4 border-[#45a29e]'
                        : 'text-white/60 hover:text-white bg-white/5'
                    }`}
                  >
                    <span className={isActive ? 'text-[#45a29e]' : 'text-white/40'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="label-mono">Panitia Ujian</p>
                <p className="text-xs font-bold text-white">{authUser?.name || 'Ust. Ahmad Fauzan'}</p>
                <p className="text-[10px] text-[#45a29e] font-space-mono">{authUser?.roleLabel}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="btn-secondary-v2 text-xs py-2 px-4"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>KELUAR</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

