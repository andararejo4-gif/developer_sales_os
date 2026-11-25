import React, { useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  BookOpen,
  MapPin,
  PhoneCall,
  Globe,
  Users,
  Percent,
  Database,
  HeartHandshake,
  ShieldCheck,
  Home,
  Building2,
  ShieldAlert,
  Clock,
  RefreshCw,
  CheckCircle2,
  FileText,
  Megaphone,
  MessageSquare,
  Sparkles,
  Cpu,
  Star,
  TrendingUp,
  LogOut,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Award,
  FileCheck,
  Lock,
  Share2,
  Wrench,
} from 'lucide-react';
import type { RoleKey, UserProfile } from '../../data';
import type { CompanyProject } from '../../lib/projects/projects-data';

export interface MobileMoreActions {
  onOpenTarget: () => void;
  onOpenCalendar: () => void;
  onOpenPlaybook: () => void;
  onOpenDailyRoute: () => void;
  onOpenFieldOps: () => void;
  onOpenWebsite: () => void;
  onOpenCrm: () => void;
  onOpenCommission: () => void;
  onOpenKb: () => void;
  onOpenLoveLetter: () => void;
  onOpenVault?: () => void;
  onOpenReferral?: () => void;
  onOpenGaransi?: () => void;
  onOpenKprBank?: () => void;
  onOpenControlTower?: () => void;
  onOpenSuperadmin: () => void;
  onOpenUnitPark?: () => void;
  onOpenKinerjaSe?: () => void;
  onGoHomepage: () => void;
  onLogout: () => void;
  onNavigateDashboardSection?: (sectionId: string) => void;
}

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleKey;
  user: UserProfile;
  actions: MobileMoreActions;
  activeProjectId?: string;
  projects?: CompanyProject[];
  onSelectProject?: (projectId: string) => void;
}

interface SheetActionItem {
  label: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'terracotta' | 'olive' | 'amber' | 'espresso';
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  role,
  user,
  actions,
  activeProjectId,
  projects,
  onSelectProject,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPlatformSuperadmin = role === 'SUPERADMIN' || role === 'SUPERADMIN_IT';

  const runAction = (fn?: () => void) => {
    onClose();
    if (fn) fn();
  };

  const roleSectionItems: Record<RoleKey, SheetActionItem[]> = {
    SE: [
      { label: 'Scorecard Bulanan', subtitle: '7 komponen berbobot Playbook §6.4', href: '#scorecard-bulanan', icon: Award },
      { label: 'Laporan Harian (13 Item)', subtitle: 'Realisasi harian SE Playbook §13.1', href: '#laporan-harian', icon: FileCheck },
    ],
    TL: [
      { label: 'Radar SLA <= 5 Menit', href: '#live-sla', icon: Clock },
      { label: 'Aturan Pool 72 Jam', href: '#aturan-72jam', icon: RefreshCw },
    ],
    SM: [
      { label: '30 Unit The Park', onClick: actions.onOpenUnitPark, href: '#master-unit', icon: Home },
      { label: 'Pantau Kinerja 3 SE', onClick: actions.onOpenKinerjaSe, href: '#tim-se', icon: Users },
    ],
    DIREKSI: [
      { label: 'Portofolio Proyek', href: '#portofolio-proyek', icon: Building2 },
      { label: 'Eskalasi Diskon & Refund', href: '#eskalasi-persetujuan', icon: ShieldAlert },
    ],
    ADMIN: [
      { label: 'Verifikasi Booking H+1', href: '#booking-pipeline', icon: CheckCircle2 },
      { label: 'Checklist KPR & Multi-Bank', href: '#dokumen-kpr', icon: FileText },
    ],
    IT: [
      { label: 'Migrasi Schema devos', href: '#db-schema', icon: Database },
      { label: 'Audit Trail Log 100%', href: '#audit-log', icon: ShieldCheck },
    ],
    DIGITAL_MARKETING: [
      { label: 'Kampanye & CPL Iklan', href: '#ad-campaigns', icon: Megaphone },
      { label: 'Umpan Balik Kualitas Lead', href: '#se-feedback', icon: MessageSquare },
      { label: 'AI Ad Optimizer', href: '#ai-ad-optimizer', icon: Sparkles },
    ],
    SUPERADMIN: [
      { label: 'Panel Superadmin Multi-Tenant', onClick: actions.onOpenSuperadmin, href: '#superadmin', icon: ShieldCheck },
      { label: 'Audit Konsumsi AI Platform', onClick: actions.onOpenSuperadmin, href: '#ai-audit', icon: Cpu },
    ],
    SUPERADMIN_IT: [
      { label: 'Pre-Seed Prospek VIP', onClick: actions.onOpenSuperadmin, href: '#preseed', icon: Sparkles },
      { label: 'Kurasi Fasilitas Regional (POI)', onClick: actions.onOpenSuperadmin, href: '#poi-curation', icon: Star },
    ],
    REFERRAL_PARTNER: [
      { label: 'Materi Storytelling Unit', onClick: actions.onOpenLoveLetter, href: '#surat-cinta', icon: HeartHandshake },
      { label: 'Brosur & Materi Promo', onClick: actions.onOpenKb, href: '#kb', icon: Database },
    ],
    SALES_PARTNER: [
      { label: 'Brosur & Spesifikasi Unit', onClick: actions.onOpenKb, href: '#kb', icon: Database },
      { label: '99 Keunggulan Unit', onClick: actions.onOpenLoveLetter, href: '#surat-cinta', icon: HeartHandshake },
    ],
  };

  const seMenuItems: SheetActionItem[] = [
    { label: 'Kalender Konten', subtitle: 'Jadwal posting & pengingat SE', icon: Calendar, onClick: actions.onOpenCalendar, tone: 'terracotta' },
    { label: 'Playbook', subtitle: 'SOP, skrip follow-up & objection handling', icon: BookOpen, onClick: actions.onOpenPlaybook, tone: 'terracotta' },
    { label: 'Rute Harian Canvassing', subtitle: 'Titik kunjungan & input rute mandiri', icon: MapPin, onClick: actions.onOpenDailyRoute, tone: 'terracotta' },
    { label: 'Absen, GPS, Call', subtitle: 'Presensi GPS, bukti foto & log panggilan', icon: PhoneCall, onClick: actions.onOpenFieldOps, tone: 'olive' },
    { label: 'Knowledge Base Produk', subtitle: 'Spesifikasi, siteplan, harga & simulasi KPR', icon: Database, onClick: actions.onOpenKb, tone: 'olive' },
    { label: 'Surat Cinta 99 Keunggulan', subtitle: 'Materi storytelling & 99 nilai jual proyek', icon: HeartHandshake, onClick: actions.onOpenLoveLetter, tone: 'terracotta' },
    { label: 'Dokumen Vault KPR (F74)', subtitle: 'Penyimpanan berkas KPR terenkripsi AES-256', icon: Lock, onClick: actions.onOpenVault, tone: 'olive' },
    { label: 'Program Referral (F79)', subtitle: 'Pelacakan link referral & reward Rp 5 Juta', icon: Share2, onClick: actions.onOpenReferral, tone: 'terracotta' },
    { label: 'Keluhan & Garansi DLP (F86)', subtitle: 'Klaim garansi 100 hari & tiket perbaikan', icon: Wrench, onClick: actions.onOpenGaransi, tone: 'amber' },
    { label: 'Alur KPR Bank (F75)', subtitle: 'Status SLIK, appraisal & SP3K bank mitra', icon: Building2, onClick: actions.onOpenKprBank, tone: 'olive' },
    { label: 'Control Tower Portofolio (F90)', subtitle: 'Cashflow multi-proyek level direksi', icon: TrendingUp, onClick: actions.onOpenControlTower, tone: 'terracotta' },
  ];

  const isPlatformInternal = role === 'SUPERADMIN' || role === 'SUPERADMIN_IT';
  const defaultProjectMenuItems: SheetActionItem[] = [
    { label: 'Target Penjualan 100%', subtitle: 'Skenario sold out & alokasi kuota SE', icon: TrendingUp, onClick: actions.onOpenTarget, tone: 'terracotta' },
    { label: 'Kalender Konten (30 Hari)', subtitle: 'Jadwal TOFU, MOFU, BOFU harian', icon: Calendar, onClick: actions.onOpenCalendar, tone: 'terracotta' },
    { label: 'Playbook Sales (SE/TL/SM)', subtitle: 'SOP eksekusi & BANT >= 7', icon: BookOpen, onClick: actions.onOpenPlaybook, tone: 'terracotta' },
    { label: 'Rute Harian Kanvasing', subtitle: 'Titik lokasi & target kunjungan', icon: MapPin, onClick: actions.onOpenDailyRoute, tone: 'terracotta' },
    { label: 'Absen, GPS, Call & AI Guide', subtitle: 'Operasional lapangan harian', icon: PhoneCall, onClick: actions.onOpenFieldOps, tone: 'olive' },
    { label: 'Website Landing Page', subtitle: 'Pratinjau & kalkulator KPR', icon: Globe, onClick: actions.onOpenWebsite, tone: 'terracotta' },
    { label: 'CRM & Pipeline (7 Stage)', subtitle: 'Prospek aktif & jadwal follow-up', icon: Users, onClick: actions.onOpenCrm, tone: 'terracotta' },
    { label: 'Aturan Komisi Penjualan', subtitle: 'Skema pembagian komisi 100%', icon: Percent, onClick: actions.onOpenCommission, tone: 'olive' },
    { label: 'Knowledge Base Produk', subtitle: 'Fakta terverifikasi & kuis produk', icon: Database, onClick: actions.onOpenKb, tone: 'olive' },
    { label: 'Surat Cinta 99 Keunggulan', subtitle: 'Dokumen keunggulan proyek', icon: HeartHandshake, onClick: actions.onOpenLoveLetter, tone: 'terracotta' },
    { label: 'Dokumen Vault KPR (F74)', subtitle: 'Penyimpanan berkas KPR terenkripsi AES-256', icon: Lock, onClick: actions.onOpenVault, tone: 'olive' },
    { label: 'Program Referral (F79)', subtitle: 'Pelacakan link referral & reward Rp 5 Juta', icon: Share2, onClick: actions.onOpenReferral, tone: 'terracotta' },
    { label: 'Keluhan & Garansi DLP (F86)', subtitle: 'Klaim garansi 100 hari & tiket perbaikan', icon: Wrench, onClick: actions.onOpenGaransi, tone: 'amber' },
    { label: 'Alur KPR Bank (F75)', subtitle: 'Status SLIK, appraisal & SP3K bank mitra', icon: Building2, onClick: actions.onOpenKprBank, tone: 'olive' },
    { label: 'Control Tower Portofolio (F90)', subtitle: 'Cashflow multi-proyek level direksi', icon: TrendingUp, onClick: actions.onOpenControlTower, tone: 'terracotta' },
  ];

  const projectMenuItems: SheetActionItem[] =
    role === 'SE'
      ? seMenuItems
      : role === 'DIREKSI' || isPlatformInternal
      ? []
      : defaultProjectMenuItems;

  if (isPlatformInternal) {
    projectMenuItems.push({
      label: 'Panel Superadmin Multi-Tenant',
      subtitle: 'Kelola tenant, AI token & kurasi',
      icon: ShieldCheck,
      onClick: actions.onOpenSuperadmin,
      tone: 'amber',
    });
  }

  const iconToneClass = (tone?: SheetActionItem['tone']) => {
    if (tone === 'olive') return 'bg-lime-100 text-olive';
    if (tone === 'amber') return 'bg-amber-100 text-amber-700';
    if (tone === 'espresso') return 'bg-sandstone text-espresso';
    return 'bg-amber-50 text-terracotta';
  };

  return (
    <div
      id="mobile-more-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Menu Lainnya"
      className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-espresso/60 transition-opacity"
      />

      {/* Bottom-to-Top Sheet (Hampir Penuh Layar) */}
      <div className="relative z-10 w-full h-[92dvh] bg-white rounded-t-3xl border-t border-warmborder flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Handle & Header */}
        <div className="shrink-0 pt-2.5 pb-3 px-4 border-b border-warmborder bg-white">
          <div className="w-10 h-1 rounded-full bg-warmborder mx-auto mb-2.5" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-espresso truncate">Menu Lainnya</h2>
              <p className="text-xs text-warmmuted truncate">
                {user.name} · {user.roleLabel}
              </p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Tutup menu lainnya"
              className="size-11 rounded-xl bg-sandstone hover:bg-warmborder text-espresso flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          {/* Universal Project Selector Mobile (Disembunyikan untuk SE & Superadmin Platform) */}
          {!isPlatformSuperadmin && role !== 'SE' && projects && projects.length > 0 && onSelectProject ? (
            <div className="p-3 rounded-2xl bg-sandstone border border-warmborder">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-warmmuted mb-1.5">
                Pilih Proyek Aktif
              </label>
              <div className="relative">
                <select
                  aria-label="Pilih Proyek Aktif Mobile"
                  value={activeProjectId}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="w-full h-10 pl-8 pr-8 rounded-xl border border-warmborder bg-white text-xs font-bold text-espresso appearance-none focus:outline-none focus:ring-1 focus:ring-terracotta"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.nama} ({proj.tipe})
                    </option>
                  ))}
                </select>
                <Building2 className="size-4 text-terracotta absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="size-4 text-warmmuted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          ) : isPlatformSuperadmin ? (
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-terracotta">
                  Cakupan Akses
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-terracotta text-white">
                  Global Core
                </span>
              </div>
              <p className="text-xs font-bold text-espresso flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Lintas Seluruh Developer &amp; Proyek</span>
              </p>
            </div>
          ) : null}

          {/* Bagian 1: Bagian Halaman Role (disembunyikan untuk SE di Menu Lainnya) */}
          {role !== 'SE' && roleSectionItems[role].length > 0 && (
            <section>
              <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-warmmuted mb-2">
                Bagian Dashboard {role}
              </p>
              <div className="space-y-2">
                {roleSectionItems[role].map((item) => {
                  const Icon = item.icon;
                  const sectionId = (item.href || '').replace(/^#/, '');
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        onClose();
                        if (actions.onNavigateDashboardSection && sectionId) {
                          actions.onNavigateDashboardSection(sectionId);
                        }
                      }}
                      className="w-full flex items-center gap-3 min-h-[52px] px-3.5 py-2.5 rounded-2xl bg-sandstone/60 border border-warmborder active:bg-sandstone text-left transition-colors cursor-pointer"
                    >
                      <div className="size-10 rounded-xl bg-white border border-warmborder flex items-center justify-center text-terracotta shrink-0">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-espresso truncate">{item.label}</p>
                        {item.subtitle && (
                          <p className="text-xs text-warmmuted truncate">{item.subtitle}</p>
                        )}
                      </div>
                      <ChevronRight className="size-4 text-warmmuted shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bagian 2: Menu Pemasaran & Operasional Proyek */}
          <section>
            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-warmmuted mb-2">
              Modul &amp; Operasional Proyek
            </p>
            <div className="space-y-2">
              {projectMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => runAction(item.onClick)}
                    className="w-full flex items-center gap-3 min-h-[54px] px-3.5 py-2.5 rounded-2xl bg-white border border-warmborder hover:bg-sandstone/50 active:bg-sandstone text-left transition-colors cursor-pointer"
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${iconToneClass(item.tone)}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-espresso truncate">{item.label}</p>
                      {item.subtitle && (
                        <p className="text-xs text-warmmuted truncate">{item.subtitle}</p>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-warmmuted shrink-0" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Bagian 3: Akun & Navigasi */}
          <section className="pt-2 border-t border-warmborder">
            <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-warmmuted mb-2">
              Akun &amp; Sesi
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => runAction(actions.onGoHomepage)}
                className="min-h-[48px] px-3 rounded-2xl bg-sandstone border border-warmborder text-xs font-bold text-espresso flex items-center justify-center gap-2 active:bg-warmborder cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                <span>Beranda Publik</span>
              </button>
              <button
                type="button"
                onClick={() => runAction(actions.onLogout)}
                className="min-h-[48px] px-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center justify-center gap-2 active:bg-rose-100 cursor-pointer"
              >
                <LogOut className="size-4" />
                <span>Keluar</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
