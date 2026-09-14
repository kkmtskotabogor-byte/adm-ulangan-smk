import React, { useState } from 'react';
import { ActiveTab, AuthUser, ExamConfig } from '../types';
import { 
  Printer, 
  RotateCcw, 
  ExternalLink, 
  LogOut, 
  Cloud,
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

  // Short editorial labels matching Variation 3: Dash, Config, Users, Sched, Rooms, Proctors, Seats, ID-Cards, Docs
  const navItems: { id: ActiveTab; shortLabel: string; fullLabel: string }[] = [
    { id: 'dashboard', shortLabel: 'Dash', fullLabel: 'Dashboard' },
    { id: 'config', shortLabel: 'Config', fullLabel: 'Identitas & Ujian' },
    { id: 'students', shortLabel: 'Users', fullLabel: 'Data Peserta' },
    { id: 'schedules', shortLabel: 'Sched', fullLabel: 'Jadwal Ujian' },
    { id: 'rooms', shortLabel: 'Rooms', fullLabel: 'Ruang & Plotting' },
    { id: 'proctors', shortLabel: 'Proctors', fullLabel: 'Pengawas & Absen' },
    { id: 'seating', shortLabel: 'Seats', fullLabel: 'Denah Meja' },
    { id: 'cards', shortLabel: 'ID-Cards', fullLabel: 'Cetak Kartu' },
    { id: 'documents', shortLabel: 'Docs', fullLabel: 'Dokumen Ujian' },
  ];

  return (
    <header className="bg-[#fdfdfc] border-b-[1.5px] border-[#1a1a18] px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left cursor-pointer group"
          >
            <span className="font-cormorant text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a18] group-hover:text-[#2e4cff] transition-colors leading-none">
              {config.schoolName || 'SMK YAK 1'}
            </span>
          </button>
          <span className="hidden sm:inline-block font-roboto-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border border-[#1a1a18] text-[#1a1a18] rounded-full">
            {config.examType || 'STS'}
          </span>
        </div>

        {/* Center Pill Navigation Bar - Variation 3 Exact Specification */}
        <nav className="hidden xl:flex items-center gap-4 lg:gap-5 border border-[#1a1a18] px-5 py-2 rounded-full bg-white shadow-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`font-roboto-mono text-[0.72rem] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#2e4cff] font-bold'
                    : 'text-[#1a1a18] hover:text-[#2e4cff]'
                }`}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </nav>

        {/* Right Section: User & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Admin Identity Label in Roboto Mono */}
          <div className="hidden md:block text-right">
            <span className="font-roboto-mono text-[0.65rem] text-[#1a1a18]/70 block leading-none">
              {authUser?.role === 'admin' ? 'Admin:' : authUser?.role === 'proctor' ? 'Pengawas:' : 'Siswa:'}
            </span>
            <span className="font-roboto-mono text-xs font-semibold text-[#1a1a18] truncate max-w-[140px] block mt-0.5">
              {authUser?.name || 'A. Fauzan'}
            </span>
          </div>

          {/* Cloud Sync Status */}
          {onOpenCloudSyncModal && (
            <button
              onClick={onOpenCloudSyncModal}
              title="Cloud Database Multi-Device"
              className="p-2 border border-[#1a1a18] rounded-full text-[#1a1a18] hover:bg-[#f4f4f0] transition-colors cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-[#2e4cff]" />
            </button>
          )}

          {/* Quick Print */}
          <button
            onClick={onQuickPrint}
            title="Cetak Cepat Dokumen"
            className="btn-black hidden sm:inline-flex py-1.5 px-3 text-[11px]"
          >
            <Printer className="w-3 h-3" />
            <span>Cetak</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={onResetData}
            title="Kembalikan data default"
            className="p-2 border border-[#1a1a18] rounded-full text-[#1a1a18] hover:bg-[#f4f4f0] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Open in New Tab if inside iframe */}
          {typeof window !== 'undefined' && window.self !== window.top && (
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka di tab baru"
              className="p-2 border border-[#1a1a18] rounded-full text-[#1a1a18] hover:bg-[#f4f4f0] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Keluar"
              className="p-2 border border-[#1a1a18] rounded-full text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 border border-[#1a1a18] rounded-full text-[#1a1a18] hover:bg-[#f4f4f0]"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Horizontal scrolling sub-tabs on tablet/medium screen */}
      <div className="xl:hidden flex items-center gap-2 overflow-x-auto pt-2.5 mt-2 border-t border-[#1a1a18]/15 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`font-roboto-mono text-[0.7rem] px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap transition-colors border ${
                isActive
                  ? 'border-[#2e4cff] bg-[#2e4cff] text-white font-bold'
                  : 'border-[#1a1a18] text-[#1a1a18] bg-white'
              }`}
            >
              {item.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-[65px] z-50 bg-[#fdfdfc]/98 backdrop-blur-md p-6 overflow-y-auto border-t-[1.5px] border-[#1a1a18] flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#1a1a18] pb-3">
            <span className="font-cormorant text-2xl font-bold">{config.schoolName || 'SMK YAK 1'}</span>
            <span className="font-roboto-mono text-xs">{authUser?.name || 'A. Fauzan'}</span>
          </div>

          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left p-3 border border-[#1a1a18] rounded-xs font-roboto-mono text-xs uppercase tracking-wider flex items-center justify-between ${
                    isActive
                      ? 'bg-[#2e4cff] text-white font-bold'
                      : 'bg-white text-[#1a1a18]'
                  }`}
                >
                  <span>{item.fullLabel}</span>
                  <span className="text-[10px] opacity-75">[{item.shortLabel}]</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-[#1a1a18] flex items-center justify-between">
            <button
              onClick={onQuickPrint}
              className="btn-black"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Dokumen</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="btn-outline-black text-rose-600 border-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
