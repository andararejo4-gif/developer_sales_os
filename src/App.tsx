import { useEffect, useMemo, useState } from 'react';
import { PublicHomepage } from './components/PublicHomepage';
import { MarketResearchViewer } from './components/MarketResearchViewer';
import { SalesTargetViewer } from './components/SalesTargetViewer';
import { JalurProyek } from './components/JalurProyek';
import { KnowledgeBaseViewer } from './components/KnowledgeBaseViewer';
import { LoveLetterViewerModal } from './components/LoveLetterViewerModal';
import {
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Edit3,
  FileCheck,
  FileText,
  HeartHandshake,
  Home,
  Layers,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  AD_CAMPAIGNS,
  BOOKING_TRANSACTIONS,
  DEFAULT_ITEMS,
  DIREKSI_PROJECTS,
  ESCALATION_DATA,
  INITIAL_UNITS,
  IT_AUDIT_LOGS,
  LIVE_SLA_LEADS,
  PERIODS,
  SCORECARD_DATA,
  SE_LEAD_FEEDBACKS,
  SE_TEAM_DATA,
  AI_AD_INSIGHTS,
  USERS_BY_ROLE,
  evalStatus,
  type Category,
  type PeriodKey,
  type ReportItem,
  type RoleKey,
  type Status,
  type UnitProperty,
} from './data';

const STORAGE_KEY = 'devos_se_report_terracotta_v2';
const UNITS_STORAGE_KEY = 'devos_units_master_v2';

const today = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

const todayShort = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date());

function loadItems(): ReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ReportItem[];
  } catch {
    /* ignore fallback */
  }
  return structuredClone(DEFAULT_ITEMS);
}

function loadUnits(): UnitProperty[] {
  try {
    const raw = localStorage.getItem(UNITS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UnitProperty[];
  } catch {
    /* ignore fallback */
  }
  return structuredClone(INITIAL_UNITS);
}

const BADGES: Record<Status, { cls: string; text: string }> = {
  hit: { cls: 'bg-lime-100 text-olive', text: 'HIT' },
  near: { cls: 'bg-amber-50 text-terracotta', text: 'PROSES' },
  note: { cls: 'bg-sandstone text-espresso', text: 'TERISI' },
  low: { cls: 'bg-rose-50 text-rose-700', text: 'KURANG' },
  empty: { cls: 'bg-rose-50 text-rose-700', text: 'KURANG' },
};

function StatusBadge({ status }: { status: Status }) {
  const b = BADGES[status];
  return <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${b.cls}`}>{b.text}</span>;
}

export default function App() {
  const [viewMode, setViewMode] = useState<'homepage' | 'dashboard'>('homepage');
  const [role, setRole] = useState<RoleKey>('SE');
  const user = USERS_BY_ROLE[role];

  // SE States
  const [items, setItems] = useState<ReportItem[]>(loadItems);
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [period, setPeriod] = useState<PeriodKey>('harian');

  // SM States (CRUD Units & SE monitoring)
  const [units, setUnits] = useState<UnitProperty[]>(loadUnits);
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUnitModal, setShowUnitModal] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<UnitProperty | null>(null);

  // Direksi States
  const [escalations, setEscalations] = useState(ESCALATION_DATA);
  const [tipeFilter, setTipeFilter] = useState<string>('all');

  // Proyek & Fase 2 Intelligence States
  const [showJalurProyekModal, setShowJalurProyekModal] = useState<boolean>(false);
  const [showMarketResearchModal, setShowMarketResearchModal] = useState<boolean>(false);
  const [showSalesTargetModal, setShowSalesTargetModal] = useState<boolean>(false);
  const [showKbModal, setShowKbModal] = useState<boolean>(false);
  const [showLoveLetterModal, setShowLoveLetterModal] = useState<boolean>(false);

  // Common UI states
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const p = PERIODS[period];
  const list = useMemo(() => (filter === 'all' ? items : items.filter((r) => r.cat === filter)), [items, filter]);
  const hits = items.filter((r) => r.targetNum !== null && evalStatus(r) === 'hit').length;

  const updateItem = (id: number, field: 'realisasi' | 'catatan', val: string) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const copyWa = async () => {
    const lines = [
      `*LAPORAN HARIAN SE — DEVELOPER SALES OS*`,
      `PT Andara Rejo Makmur · The Park Townhouse Sukoharjo`,
      `${todayShort} | ${user.name} | Scorecard: 112.5 Poin`,
      '',
    ];
    items.forEach((r, i) =>
      lines.push(`${i + 1}. *${r.item}*: ${r.realisasi} (Target: ${r.target})${r.catatan ? ' — ' + r.catatan : ''}`)
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setToast('Laporan WA disalin!');
    } catch {
      setToast('Gagal menyalin');
    }
  };

  // Unit CRUD Handlers for SM
  const handleSaveUnit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updated: UnitProperty = {
      id: editingUnit ? editingUnit.id : String(Date.now()),
      cluster: fd.get('cluster') as string,
      namaUnit: fd.get('namaUnit') as string,
      tipeUnit: fd.get('tipeUnit') as string,
      luasTanah: Number(fd.get('luasTanah')),
      luasBangunan: Number(fd.get('luasBangunan')),
      hargaCashKeras: Number(fd.get('hargaCashKeras')),
      hargaCash6: Number(fd.get('hargaCash6')),
      hargaCash12: Number(fd.get('hargaCash12')),
      hargaCash24: Number(fd.get('hargaCash24')),
      keterangan: fd.get('keterangan') as string,
      status: fd.get('status') as 'tersedia' | 'hold' | 'booking' | 'terjual',
    };

    if (editingUnit) {
      setUnits((prev) => prev.map((u) => (u.id === editingUnit.id ? updated : u)));
      setToast(`Unit ${updated.namaUnit} berhasil diperbarui`);
    } else {
      setUnits((prev) => [updated, ...prev]);
      setToast(`Unit ${updated.namaUnit} berhasil ditambahkan`);
    }
    setShowUnitModal(false);
    setEditingUnit(null);
  };

  const handleEscalationDecision = (id: string, decision: 'Disetujui' | 'Ditolak') => {
    setEscalations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
    );
    setToast(`Pengajuan ${id} ${decision}`);
  };

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (clusterFilter !== 'all' && u.cluster !== clusterFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [units, clusterFilter, statusFilter]);

  const filteredProjects = useMemo(() => {
    if (tipeFilter === 'all') return DIREKSI_PROJECTS;
    return DIREKSI_PROJECTS.filter((p) => p.tipe === tipeFilter);
  }, [tipeFilter]);

  const rupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  if (viewMode === 'homepage') {
    return (
      <PublicHomepage
        onEnterDashboard={(chosenRole) => {
          if (chosenRole) {
            if (chosenRole === 'DEVELOPER_OWNER') setRole('DIREKSI');
            else if (chosenRole === 'SALES_MANAGER') setRole('SM');
            else if (chosenRole === 'TEAM_LEADER') setRole('TL');
            else if (chosenRole === 'SALES_EXECUTIVE') setRole('SE');
            else if (chosenRole === 'DIGITAL_MARKETING') setRole('DIGITAL_MARKETING');
            else if (chosenRole === 'SUPERADMIN') setRole('IT');
            else setRole(chosenRole as RoleKey);
          }
          setViewMode('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen md:flex bg-sandstone text-espresso font-sans antialiased">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:sticky md:top-0 md:h-screen bg-white border-r border-warmborder px-5 py-6 justify-between z-30">
        <div>
          {/* Back to Public Homepage */}
          <button
            onClick={() => setViewMode('homepage')}
            className="w-full mb-4 py-2 px-3 rounded-xl bg-sandstone hover:bg-warmborder text-[11px] font-bold text-espresso flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-warmborder"
          >
            <span>&larr; Beranda Publik</span>
          </button>

          {/* Logo & OS Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-warmborder">
            <div className="size-10 rounded-xl bg-terracotta text-white grid place-items-center font-extrabold text-base shadow-sm">
              OS
            </div>
            <div>
              <p className="font-extrabold text-sm tracking-tight text-espresso">Developer Sales OS</p>
              <p className="text-[11px] text-warmmuted">PT Andara Rejo Makmur</p>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="mt-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-warmmuted mb-2">
              Pilih Role Dashboard
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-sandstone rounded-xl border border-warmborder text-center">
              {(['SE', 'TL', 'SM', 'DIREKSI', 'ADMIN', 'IT', 'DIGITAL_MARKETING'] as RoleKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setToast(`Beralih ke Dashboard ${r === 'DIGITAL_MARKETING' ? 'Digital Marketing' : r}`);
                  }}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    role === r
                      ? 'bg-espresso text-white shadow-sm'
                      : 'text-warmmuted hover:text-espresso hover:bg-white/60'
                  }`}
                >
                  {r === 'DIGITAL_MARKETING' ? 'MKT' : r === 'DIREKSI' ? 'DIR' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Button */}
          {role === 'SE' && (
            <button
              onClick={() => setToast('Form Lead Baru dibuka')}
              className="mt-4 w-full h-11 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-espresso/90 cursor-pointer shadow-sm"
            >
              <Plus className="size-4 text-amber-400" />
              <span>Input Lead Baru (SOP ≤5m)</span>
            </button>
          )}

          {role === 'DIGITAL_MARKETING' && (
            <button
              onClick={() => setToast('Form Input Biaya Iklan Harian dibuka')}
              className="mt-4 w-full h-11 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-espresso/90 cursor-pointer shadow-sm"
            >
              <Plus className="size-4 text-amber-400" />
              <span>Input Biaya Iklan (CPL)</span>
            </button>
          )}

          {role === 'SM' && (
            <button
              onClick={() => {
                setEditingUnit(null);
                setShowUnitModal(true);
              }}
              className="mt-4 w-full h-11 rounded-xl bg-terracotta text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-terracotta/90 cursor-pointer shadow-sm"
            >
              <Plus className="size-4 text-white" />
              <span>Tambah Unit Proyek</span>
            </button>
          )}

          {role === 'DIREKSI' && (
            <button
              onClick={() => setToast('Laporan Konsolidasi Portofolio di-refresh')}
              className="mt-4 w-full h-11 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-espresso/90 cursor-pointer"
            >
              <TrendingUp className="size-4 text-amber-400" />
              <span>Proyeksi Akhir Bulan</span>
            </button>
          )}

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            <a
              href="#dashboard-main"
              className="flex items-center gap-3 h-10 px-3.5 rounded-xl bg-amber-50 text-terracotta text-xs font-bold"
            >
              <LayoutDashboard className="size-4" />
              <span>Dashboard {role}</span>
            </a>

            {role === 'SE' && (
              <>
                <a
                  href="#scorecard-bulanan"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <Award className="size-4" />
                  <span>Scorecard Bulanan</span>
                </a>
                <a
                  href="#laporan-harian"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <FileCheck className="size-4" />
                  <span>Laporan Harian (13 Item)</span>
                </a>
              </>
            )}

            {role === 'SM' && (
              <>
                <a
                  href="#master-unit"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <Home className="size-4" />
                  <span>30 Unit The Park</span>
                </a>
                <a
                  href="#tim-se"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <Users className="size-4" />
                  <span>Pantau Kinerja 3 SE</span>
                </a>
              </>
            )}

            {role === 'DIREKSI' && (
              <>
                <a
                  href="#portofolio-proyek"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <Building2 className="size-4" />
                  <span>Portofolio Proyek</span>
                </a>
                <a
                  href="#eskalasi-persetujuan"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <ShieldAlert className="size-4" />
                  <span>Eskalasi Diskon & Refund</span>
                </a>
              </>
            )}

            {role === 'TL' && (
              <>
                <a
                  href="#live-sla"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <Clock className="size-4" />
                  <span>Radar SLA ≤5 Menit</span>
                </a>
                <a
                  href="#aturan-72jam"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <RefreshCw className="size-4" />
                  <span>Aturan Pool 72 Jam</span>
                </a>
              </>
            )}

            {role === 'ADMIN' && (
              <>
                <a
                  href="#booking-pipeline"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Verifikasi Booking H+1</span>
                </a>
                <a
                  href="#dokumen-kpr"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <FileText className="size-4" />
                  <span>Checklist KPR & Multi-Bank</span>
                </a>
              </>
            )}

            {role === 'IT' && (
              <>
                <a
                  href="#db-schema"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <Database className="size-4" />
                  <span>Migrasi Schema devos</span>
                </a>
                <a
                  href="#audit-log"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <ShieldCheck className="size-4" />
                  <span>Audit Trail Log 100%</span>
                </a>
              </>
            )}

            {role === 'DIGITAL_MARKETING' && (
              <>
                <a
                  href="#ad-campaigns"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <Megaphone className="size-4" />
                  <span>Kampanye &amp; CPL Iklan</span>
                </a>
                <a
                  href="#se-feedback"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <MessageSquare className="size-4" />
                  <span>Umpan Balik Kualitas Lead</span>
                </a>
                <a
                  href="#ai-ad-optimizer"
                  className="flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso"
                >
                  <Sparkles className="size-4" />
                  <span>AI Ad Optimizer (§S18)</span>
                </a>
              </>
            )}

            {/* Project Workflow & Market Intelligence (Fase 1, 1A, 2) */}
            <div className="pt-4 mt-3 border-t border-warmborder">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-warmmuted mb-1.5">
                Pemasaran Proyek
              </p>

              <button
                onClick={() => setShowJalurProyekModal(true)}
                className="w-full flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-semibold text-espresso hover:bg-sandstone text-left transition-colors cursor-pointer"
              >
                <Layers className="size-4 text-terracotta" />
                <span>Jalur Proyek (8 Tahap)</span>
              </button>

              <button
                onClick={() => setShowMarketResearchModal(true)}
                className="w-full flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-semibold text-espresso hover:bg-sandstone text-left transition-colors cursor-pointer"
              >
                <Compass className="size-4 text-terracotta" />
                <span>Riset Pasar (Radius 25km)</span>
              </button>

              <button
                onClick={() => setShowSalesTargetModal(true)}
                className="w-full flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-semibold text-espresso hover:bg-sandstone text-left transition-colors cursor-pointer"
              >
                <TrendingUp className="size-4 text-terracotta" />
                <span>Target Penjualan 100%</span>
              </button>

              <button
                onClick={() => setShowKbModal(true)}
                className="w-full flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-semibold text-espresso hover:bg-sandstone text-left transition-colors cursor-pointer"
              >
                <Database className="size-4 text-olive" />
                <span>Knowledge Base Produk</span>
              </button>

              <button
                onClick={() => setShowLoveLetterModal(true)}
                className="w-full flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-semibold text-espresso hover:bg-sandstone text-left transition-colors cursor-pointer"
              >
                <HeartHandshake className="size-4 text-terracotta" />
                <span>Surat Cinta 99 Keunggulan</span>
              </button>
            </div>
          </nav>
        </div>

        {/* User Badge Footer */}
        <div className="rounded-2xl bg-sandstone p-3.5 border border-warmborder">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-espresso text-white grid place-items-center text-xs font-bold">
              {user.avatarText}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-espresso truncate">{user.name}</p>
              <p className="text-[10px] text-warmmuted truncate">{user.roleLabel}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-warmborder flex items-center justify-between text-[10px] text-warmmuted">
            <span className="font-semibold text-terracotta">{user.role}</span>
            <span className="truncate max-w-[120px]">{user.proyek || 'Andara Rejo Makmur'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pb-28 md:pb-12">
        {/* Header Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white border-b border-warmborder sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-espresso tracking-tight">Developer Sales OS</h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-terracotta border border-amber-200">
                Dashboard {role} · {user.roleLabel}
              </span>
            </div>
            <p className="text-xs text-warmmuted mt-0.5">
              {today} · PT Andara Rejo Makmur · The Park Townhouse Sukoharjo
            </p>
          </div>

          <div className="flex items-center gap-3">
            {role === 'SE' && (
              <button
                onClick={copyWa}
                className="h-10 px-4 rounded-xl bg-terracotta text-white text-xs font-semibold flex items-center gap-2 hover:bg-terracotta/90 cursor-pointer shadow-sm"
              >
                <Share2 className="size-3.5" /> Salin Laporan WA
              </button>
            )}
            <div className="flex items-center gap-2 bg-sandstone px-3 py-1.5 rounded-xl border border-warmborder text-xs">
              <span className="size-2 rounded-full bg-olive animate-pulse"></span>
              <span className="font-semibold text-espresso">Online</span>
              <span className="text-warmmuted text-[11px]">({user.name})</span>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-white border-b border-warmborder space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta">
                Developer Sales OS
              </p>
              <h1 className="text-lg font-extrabold text-espresso">Dashboard {role}</h1>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-sandstone text-espresso border border-warmborder">
              {user.name.split(' ')[0]}
            </span>
          </div>

          {/* Mobile Role Switcher */}
          <div className="grid grid-cols-7 gap-1 p-1 bg-sandstone rounded-xl border border-warmborder text-center">
            {(['SE', 'TL', 'SM', 'DIREKSI', 'ADMIN', 'IT', 'DIGITAL_MARKETING'] as RoleKey[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setToast(`Beralih ke ${r === 'DIGITAL_MARKETING' ? 'MKT' : r}`);
                }}
                className={`py-1 text-[10px] font-bold rounded-lg ${
                  role === r ? 'bg-espresso text-white' : 'text-warmmuted'
                }`}
              >
                {r === 'DIGITAL_MARKETING' ? 'MKT' : r === 'DIREKSI' ? 'Dir' : r}
              </button>
            ))}
          </div>
        </div>

        <div id="dashboard-main" className="max-w-6xl mx-auto px-4 pt-5 md:px-8 md:pt-8 space-y-6">
          {/* ========================================================================= */}
          {/* ROLE 1: SALES EXECUTIVE (SE) DASHBOARD */}
          {/* ========================================================================= */}
          {role === 'SE' && (
            <>
              {/* Top Split KPI Card & Monthly Revenue */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-4 bg-espresso text-white rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Skor KPI Harian
                    </span>
                    <div className="inline-flex rounded-lg bg-white/10 p-0.5">
                      {(['harian', 'minggu', 'bulan'] as PeriodKey[]).map((pr) => (
                        <button
                          key={pr}
                          onClick={() => setPeriod(pr)}
                          className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                            period === pr
                              ? 'bg-terracotta text-white font-semibold shadow-sm'
                              : 'text-white/70 font-medium hover:text-white'
                          }`}
                        >
                          {pr.charAt(0).toUpperCase() + pr.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="my-5 flex items-center gap-5">
                    <div className="relative size-28 shrink-0 grid place-items-center">
                      <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#D97706"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray="314.16"
                          strokeDashoffset={p.dash}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-2xl font-extrabold tabular-nums leading-none">{p.score}</p>
                        <p className="text-[11px] text-white/60 mt-1">/ 115</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">{p.tier}</p>
                      <p className="text-xs text-white/70 mt-1 tabular-nums">{p.meta}</p>
                      <span className="inline-block mt-2 text-[10px] bg-white/15 px-2 py-0.5 rounded text-amber-300">
                        Aturan Balas ≤ 5 Menit
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-white/60 pt-3 border-t border-white/10">
                    Scorecard Bulanan resmi saat ini: <strong className="text-white">112.5 Poin (Grade A)</strong>
                  </p>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-warmborder rounded-2xl p-4 shadow-sm">
                      <p className="text-xs text-warmmuted">Lead Masuk Hari Ini</p>
                      <p className="text-2xl font-extrabold tabular-nums text-espresso mt-1">
                        6 <span className="text-xs font-normal text-warmmuted">/ 8 Target</span>
                      </p>
                    </div>
                    <div className="bg-white border border-warmborder rounded-2xl p-4 shadow-sm">
                      <p className="text-xs text-warmmuted">Hot Prospek Aktif</p>
                      <p className="text-2xl font-extrabold tabular-nums text-terracotta mt-1">4 Prospek</p>
                    </div>
                    <div className="bg-white border border-warmborder rounded-2xl p-4 shadow-sm">
                      <p className="text-xs text-warmmuted">Aktivitas Posting</p>
                      <p className="text-2xl font-extrabold tabular-nums text-espresso mt-1">
                        4 <span className="text-xs font-normal text-warmmuted">/ 9 Konten</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-warmborder rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-warmmuted">
                          Closing Terverifikasi (Net Sales Bulan Ini)
                        </p>
                        <p className="text-2xl font-extrabold tabular-nums text-espresso mt-1">
                          Rp 1.850.000.000
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-lime-100 text-olive">
                        74% Target Omzet
                      </span>
                    </div>
                    <div className="mt-4 h-2.5 rounded-full bg-sandstone overflow-hidden">
                      <div className="h-full bg-terracotta rounded-full" style={{ width: '74%' }}></div>
                    </div>
                    <p className="mt-4 pt-3 border-t border-warmborder text-xs text-warmmuted">
                      2 unit Net Sales (Unit A.01 Nagoya &amp; B.04 Osaka) · Target Rp 2,5 Miliar · 24 Pintu Canvassing
                    </p>
                  </div>
                </div>
              </section>

              {/* Scorecard Bulanan */}
              <section id="scorecard-bulanan" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold text-espresso">Scorecard Bulanan Berbobot (SOP Playbook §6.4)</h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-terracotta tabular-nums">
                        112.5 Poin
                      </span>
                    </div>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Kalkulasi bobot resmi 7 komponen: Booking 35%, Net Sales 20%, Kunjungan 15%, Prospek 10%, Kepatuhan 10%, CRM 5%, Referral 5%.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-olive bg-lime-100 px-3 py-1 rounded-lg">
                    Kategori: Tercapai (Bintang ≥ 120)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        <th className="py-3 px-5">Komponen KPI</th>
                        <th className="py-3 px-4">Bobot</th>
                        <th className="py-3 px-4">Target</th>
                        <th className="py-3 px-4">Realisasi SE</th>
                        <th className="py-3 px-5 text-right">Poin Capaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder text-sm">
                      {SCORECARD_DATA.map((s) => (
                        <tr key={s.komponen} className="hover:bg-sandstone/40">
                          <td className="py-3 px-5 font-semibold text-espresso">
                            {s.komponen}
                            <span className="block text-[11px] font-normal text-warmmuted">{s.note}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-terracotta tabular-nums">{s.bobot}</td>
                          <td className="py-3 px-4 text-xs text-warmmuted">{s.target}</td>
                          <td className="py-3 px-4 text-xs font-medium text-espresso">{s.capaian}</td>
                          <td className="py-3 px-5 text-right font-extrabold text-espresso tabular-nums">{s.poin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Laporan Harian 13 Item */}
              <section id="laporan-harian" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold text-espresso">Laporan Harian SE (13 Item Playbook §13.1)</h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-terracotta">
                        {hits}/10 Target Hit
                      </span>
                    </div>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Kirim sebelum pukul 18.00 WIB. Pukul 18.15 AI SM/TL melakukan audit otomatis &amp; feedback.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto">
                    {[
                      { key: 'all', label: `Semua (${items.length})` },
                      { key: 'prospek', label: 'Prospek' },
                      { key: 'outreach', label: 'Outreach' },
                      { key: 'closing', label: 'Closing & KPR' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key as 'all' | Category)}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                          filter === f.key ? 'bg-espresso text-white' : 'bg-sandstone text-warmmuted hover:text-espresso'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        <th className="py-3 px-5 w-[32%]">Item Laporan</th>
                        <th className="py-3 px-4 w-[12%]">Target</th>
                        <th className="py-3 px-4 w-[22%]">Realisasi Hari Ini</th>
                        <th className="py-3 px-4 w-[24%]">Catatan / Progres</th>
                        <th className="py-3 px-4 w-[10%] text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder text-sm">
                      {list.map((r) => (
                        <tr key={r.id} className="hover:bg-sandstone/40">
                          <td className="py-3 px-5 font-medium text-espresso">{r.item}</td>
                          <td className="py-3 px-4 text-xs font-semibold text-warmmuted tabular-nums">{r.target}</td>
                          <td className="py-3 px-4">
                            <input
                              value={r.realisasi}
                              onChange={(e) => updateItem(r.id, 'realisasi', e.target.value)}
                              className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone/40 focus:bg-white focus:border-terracotta focus:outline-none text-sm font-semibold tabular-nums"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              value={r.catatan}
                              onChange={(e) => updateItem(r.id, 'catatan', e.target.value)}
                              className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white focus:border-terracotta focus:outline-none text-xs"
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <StatusBadge status={evalStatus(r)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-sandstone/60 border-t border-warmborder flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setItems(structuredClone(DEFAULT_ITEMS));
                      setToast('Laporan harian direset');
                    }}
                    className="text-xs font-medium text-warmmuted hover:text-espresso cursor-pointer"
                  >
                    Reset Default
                  </button>
                  <button
                    onClick={copyWa}
                    className="min-h-[40px] px-5 rounded-xl bg-terracotta text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm hover:bg-terracotta/90"
                  >
                    <Send className="size-3.5" /> Simpan &amp; Salin Laporan WA
                  </button>
                </div>
              </section>
            </>
          )}

          {/* ========================================================================= */}
          {/* ROLE 2: TEAM LEADER (TL) DASHBOARD (AI SM/TL & HUMAN SUPERVISOR) */}
          {/* ========================================================================= */}
          {role === 'TL' && (
            <div className="space-y-6">
              {/* AI Morning Huddle Banner */}
              <div className="bg-espresso text-white rounded-2xl p-6 border border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      AI Morning Huddle 07.25 (§7.1, §12.1)
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-white">Briefing Otomatis ke Tim 3 SE Hari Ini</h2>
                  <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
                    AI TL telah mengirim pesan briefing pukul 07.25: Target hari ini 2 Prospek BANT ≥7 per SE,
                    prioritas follow-up 4 Hot Prospek, dan monitoring 30 unit (Nagoya A.01 terjual, B.04 hold).
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setToast('Broadcast Briefing AI dikirim ulang ke WA SE')}
                    className="px-4 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer flex items-center gap-2"
                  >
                    <MessageSquare className="size-4" /> Broadcast Ulang WA
                  </button>
                </div>
              </div>

              {/* Radar Speed to Lead ≤ 5 Menit */}
              <section id="live-sla" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-terracotta" />
                      <h2 className="text-base font-bold text-espresso">Live Radar Speed-to-Lead (SOP ≤ 5 Menit)</h2>
                    </div>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Lead yang tidak direspons dalam 5 menit otomatis ditegur AI &amp; dialihkan ke SE piket lain.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-terracotta rounded-lg">
                    Target: ≤ 5 Menit
                  </span>
                </div>

                <div className="divide-y divide-warmborder">
                  {LIVE_SLA_LEADS.map((l) => (
                    <div key={l.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-espresso">{l.namaLead}</span>
                          <span className="text-[11px] text-warmmuted">({l.sumber})</span>
                          <span className="text-[11px] font-mono text-terracotta">{l.noWa}</span>
                        </div>
                        <p className="text-xs text-warmmuted mt-1">
                          Ditugaskan ke: <strong className="text-espresso">{l.assignedSe}</strong> · Berjalan:{' '}
                          <span className="font-bold tabular-nums text-espresso">{l.menitBerjalan} menit</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            l.status === 'Aman'
                              ? 'bg-lime-100 text-olive'
                              : l.status === 'Peringatan 5 Mnt'
                              ? 'bg-amber-100 text-terracotta'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {l.status}
                        </span>

                        {l.status !== 'Aman' && (
                          <button
                            onClick={() => setToast(`Lead ${l.namaLead} dialihkan ke SE lain`)}
                            className="px-3 py-1.5 rounded-lg bg-espresso text-white text-xs font-semibold cursor-pointer hover:bg-espresso/90"
                          >
                            Alihkan Lead Sekarang
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Aturan Kepemilikan 72 Jam */}
              <section id="aturan-72jam" className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Aturan Pool Lead 72 Jam (Playbook §6.5)</h3>
                    <p className="text-xs text-warmmuted mt-1">
                      Lead yang tidak dihubungi dalam 72 jam otomatis lepas dari SE dan masuk ke Pool Umum untuk dibagikan kembali.
                    </p>
                  </div>
                  <button
                    onClick={() => setToast('Fungsi kembalikan_lead_72jam() dieksekusi')}
                    className="px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-espresso flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" /> Jalankan Audit 72 Jam
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-sandstone/60 border border-warmborder">
                    <p className="text-xs text-warmmuted">Lead Terancam 72 Jam</p>
                    <p className="text-2xl font-extrabold text-terracotta mt-1">3 Lead</p>
                    <p className="text-[11px] text-warmmuted mt-1">Budi Santoso (2), Dian Lestari (1)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-sandstone/60 border border-warmborder">
                    <p className="text-xs text-warmmuted">Lead Dikembalikan ke Pool Bulan Ini</p>
                    <p className="text-2xl font-extrabold text-espresso mt-1">5 Lead</p>
                    <p className="text-[11px] text-warmmuted mt-1">Otomatis didistribusikan ulang</p>
                  </div>
                  <div className="p-4 rounded-xl bg-sandstone/60 border border-warmborder">
                    <p className="text-xs text-warmmuted">Kepatuhan Lead Response</p>
                    <p className="text-2xl font-extrabold text-olive mt-1">94.2%</p>
                    <p className="text-[11px] text-warmmuted mt-1">Sesuai standar KPI tim</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ROLE 3: SALES MANAGER (SM) DASHBOARD (SEMI-AI: CRUD PROYEK & MONITOR SE) */}
          {/* ========================================================================= */}
          {role === 'SM' && (
            <div className="space-y-6">
              {/* Info Banner SM */}
              <div className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-terracotta text-white">
                      SM Semi-AI
                    </span>
                    <h2 className="text-lg font-bold text-espresso">Manajemen Proyek &amp; Supervisi SE</h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-terracotta border border-amber-200">
                      Tipe: Perumahan Mewah
                    </span>
                  </div>
                  <p className="text-xs text-warmmuted mt-1">
                    Kelola data 30 unit (Nagoya, Osaka, Tokyo), tipe proyek (Mewah, Subsidi, Menengah), LT, LB, skema cash keras &amp; tempo 6/12/24 bulan.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingUnit(null);
                    setShowUnitModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center gap-2 hover:bg-espresso/90 cursor-pointer shrink-0"
                >
                  <Plus className="size-4 text-amber-400" /> Tambah Unit Properti
                </button>
              </div>

              {/* Master Inventori 30 Unit CRUD */}
              <section id="master-unit" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Inventori 30 Unit — The Park Townhouse Sukoharjo</h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Termasuk LT, LB, harga cash keras, cash tempo 6, 12, 24 bulan, status unit &amp; keterangan.
                    </p>
                  </div>

                  {/* Filter Cluster & Status */}
                  <div className="flex items-center gap-2">
                    <select
                      value={clusterFilter}
                      onChange={(e) => setClusterFilter(e.target.value)}
                      className="h-9 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-semibold text-espresso focus:outline-none"
                    >
                      <option value="all">Semua Cluster (30)</option>
                      <option value="Nagoya">Nagoya (14 Unit)</option>
                      <option value="Osaka">Osaka (9 Unit)</option>
                      <option value="Tokyo">Tokyo (7 Unit)</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-9 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-semibold text-espresso focus:outline-none"
                    >
                      <option value="all">Semua Status</option>
                      <option value="tersedia">Tersedia</option>
                      <option value="hold">Hold</option>
                      <option value="booking">Booking</option>
                      <option value="terjual">Terjual</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        <th className="py-3 px-4">Cluster / Unit</th>
                        <th className="py-3 px-3">Tipe</th>
                        <th className="py-3 px-3">LT / LB</th>
                        <th className="py-3 px-3">Cash Keras</th>
                        <th className="py-3 px-3">Cash 6 Bln</th>
                        <th className="py-3 px-3">Cash 12 Bln</th>
                        <th className="py-3 px-3">Cash 24 Bln</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder text-xs">
                      {filteredUnits.map((u) => (
                        <tr key={u.id} className="hover:bg-sandstone/40">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-espresso">{u.namaUnit}</span>
                            <span className="block text-[11px] text-warmmuted">{u.cluster}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-warmmuted">{u.tipeUnit}</td>
                          <td className="py-3 px-3 tabular-nums">
                            {u.luasTanah} / {u.luasBangunan} m²
                          </td>
                          <td className="py-3 px-3 font-bold text-espresso tabular-nums">{rupiah(u.hargaCashKeras)}</td>
                          <td className="py-3 px-3 text-warmmuted tabular-nums">{rupiah(u.hargaCash6)}</td>
                          <td className="py-3 px-3 text-warmmuted tabular-nums">{rupiah(u.hargaCash12)}</td>
                          <td className="py-3 px-3 text-warmmuted tabular-nums">{rupiah(u.hargaCash24)}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                u.status === 'tersedia'
                                  ? 'bg-lime-100 text-olive'
                                  : u.status === 'hold'
                                  ? 'bg-amber-100 text-terracotta'
                                  : u.status === 'booking'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-espresso text-white'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setEditingUnit(u);
                                setShowUnitModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-sandstone hover:bg-warmborder text-espresso font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Edit3 className="size-3" /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* SM Pantau Tim SE Dibawahnya */}
              <section id="tim-se" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Pemantauan Kinerja Tim SE Binaan SM</h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Data real-time SE: Waktu respons, lead terancam 72 jam, status laporan cut-off 18.00, dan scorecard.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sandstone text-espresso">
                    Tim 3 SE Aktif
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        <th className="py-3 px-5">Nama SE</th>
                        <th className="py-3 px-4">Lead / Prospek</th>
                        <th className="py-3 px-4">Kunjungan</th>
                        <th className="py-3 px-4">Booking / Net</th>
                        <th className="py-3 px-4">Avg Respons</th>
                        <th className="py-3 px-4">Laporan 18.00</th>
                        <th className="py-3 px-5 text-right">Scorecard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder text-sm">
                      {SE_TEAM_DATA.map((se) => (
                        <tr key={se.seId} className="hover:bg-sandstone/40">
                          <td className="py-3 px-5">
                            <span className="font-bold text-espresso">{se.nama}</span>
                            <span className="block text-xs text-warmmuted">{se.zonaHariIni}</span>
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold tabular-nums">
                            {se.leadBulanIni} lead / {se.prospekBulanIni} prospek
                          </td>
                          <td className="py-3 px-4 text-xs tabular-nums">{se.kunjunganBulanIni} kunjungan</td>
                          <td className="py-3 px-4 text-xs tabular-nums">
                            <span className="font-bold text-terracotta">{se.bookingBulanIni}</span> booking /{' '}
                            <strong className="text-olive">{se.netSalesBulanIni} net</strong>
                          </td>
                          <td className="py-3 px-4 text-xs tabular-nums">
                            <span
                              className={`font-semibold ${
                                se.rataResponsMenit <= 5 ? 'text-olive' : 'text-rose-600 font-bold'
                              }`}
                            >
                              {se.rataResponsMenit} menit
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                se.laporanHariIni === 'tepat_waktu'
                                  ? 'bg-lime-100 text-olive'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {se.laporanHariIni === 'tepat_waktu' ? 'Terkirim 17:45' : 'Belum Kirim'}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right font-extrabold text-espresso tabular-nums">
                            {se.scorecardPoin}{' '}
                            <span className="text-[11px] font-normal text-warmmuted">({se.scorecardKategori})</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ROLE 4: DIREKSI DASHBOARD (PORTOFOLIO PROYEK, TARGET VS AKTUAL) */}
          {/* ========================================================================= */}
          {role === 'DIREKSI' && (
            <div className="space-y-6">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Portofolio Aktif</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">2 Proyek Perumahan</p>
                  <p className="text-[11px] text-warmmuted mt-1">The Park Sukoharjo &amp; Andara Village</p>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Target Net Sales</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">
                    8 <span className="text-sm font-normal text-warmmuted">/ 9 Unit (88.8%)</span>
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-sandstone overflow-hidden">
                    <div className="h-full bg-olive rounded-full" style={{ width: '88.8%' }}></div>
                  </div>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Total Omzet Bulan Ini</p>
                  <p className="text-2xl font-extrabold text-terracotta mt-1">Rp 5.790.000.000</p>
                  <p className="text-[11px] text-olive font-semibold mt-1">88.4% dari Target Rp 6.55 M</p>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Eskalasi Menunggu</p>
                  <p className="text-2xl font-extrabold text-rose-600 mt-1">
                    {escalations.filter((x) => x.status === 'Menunggu Review').length} Kasus
                  </p>
                  <p className="text-[11px] text-warmmuted mt-1">Diskon di luar program &amp; refund</p>
                </div>
              </div>

              {/* Portofolio Target vs Aktual per Proyek */}
              <section id="portofolio-proyek" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-espresso">
                      Target &amp; Aktual Hasil Per Proyek (Portofolio Direksi)
                    </h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Dikelompokkan berdasarkan Tipe Proyek: Mewah, Subsidi, dan Menengah.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {[
                      { key: 'all', label: 'Semua Tipe' },
                      { key: 'mewah', label: 'Mewah' },
                      { key: 'subsidi', label: 'Subsidi (FLPP)' },
                      { key: 'menengah', label: 'Menengah' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTipeFilter(t.key)}
                        className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          tipeFilter === t.key
                            ? 'bg-espresso text-white'
                            : 'bg-sandstone text-warmmuted hover:text-espresso'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-warmborder">
                  {filteredProjects.map((proj) => (
                    <div key={proj.kode} className="p-6 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold px-2 py-0.5 bg-espresso text-white rounded">
                              {proj.kode}
                            </span>
                            <h4 className="text-base font-extrabold text-espresso">{proj.nama}</h4>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                proj.tipe === 'mewah'
                                  ? 'bg-amber-100 text-terracotta border border-amber-200'
                                  : proj.tipe === 'subsidi'
                                  ? 'bg-lime-100 text-olive border border-lime-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              Tipe: {proj.tipe === 'mewah' ? 'Perumahan Mewah' : proj.tipe === 'subsidi' ? 'Rumah Subsidi FLPP' : 'Komersil Menengah'}
                            </span>
                          </div>
                          <p className="text-xs text-warmmuted mt-1">{proj.lokasi}</p>
                        </div>

                        {/* Stok Unit Mini-Bar */}
                        <div className="text-xs text-right">
                          <span className="font-bold text-espresso">
                            {proj.unitTerjual + proj.unitBooking} / {proj.totalUnit} Unit Terserap
                          </span>
                          <p className="text-[11px] text-warmmuted">
                            Tersedia: {proj.unitTersedia} · Hold: {proj.unitHold} · Booking: {proj.unitBooking} · Terjual: {proj.unitTerjual}
                          </p>
                        </div>
                      </div>

                      {/* Metrik Target vs Aktual */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-sandstone/60 border border-warmborder">
                        <div>
                          <p className="text-[11px] text-warmmuted">Leads Masuk</p>
                          <p className="text-lg font-extrabold text-espresso mt-0.5">
                            {proj.aktualLead} <span className="text-xs font-normal text-warmmuted">/ {proj.targetLead}</span>
                          </p>
                          <p className="text-[11px] text-olive font-semibold">
                            {Math.round((proj.aktualLead / proj.targetLead) * 100)}% Capaian
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-warmmuted">Booking Masuk</p>
                          <p className="text-lg font-extrabold text-espresso mt-0.5">
                            {proj.aktualBooking} <span className="text-xs font-normal text-warmmuted">/ {proj.targetBooking}</span>
                          </p>
                          <p className="text-[11px] text-olive font-semibold">
                            {Math.round((proj.aktualBooking / proj.targetBooking) * 100)}% Capaian
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-warmmuted">Net Sales Bersih</p>
                          <p className="text-lg font-extrabold text-espresso mt-0.5">
                            {proj.aktualNetSales} <span className="text-xs font-normal text-warmmuted">/ {proj.targetNetSales}</span>
                          </p>
                          <p className="text-[11px] text-terracotta font-semibold">
                            {Math.round((proj.aktualNetSales / proj.targetNetSales) * 100)}% Capaian
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] text-warmmuted">Realisasi Omzet</p>
                          <p className="text-lg font-extrabold text-terracotta mt-0.5">{rupiah(proj.aktualOmzet)}</p>
                          <p className="text-[11px] text-warmmuted">Target: {rupiah(proj.targetOmzet)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Eskalasi Persetujuan Khusus Direksi (Modul Q1, S9, S21) */}
              <section id="eskalasi-persetujuan" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-espresso">
                      Meja Eskalasi Persetujuan Direksi (Modul Q1 &amp; S21)
                    </h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Pengajuan diskon di luar program resmi, permohonan refund pembatalan, dan komplain pelanggan.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-warmmuted">SLA Keputusan: 24 Jam</span>
                </div>

                <div className="divide-y divide-warmborder">
                  {escalations.map((item) => (
                    <div key={item.id} className="p-5 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-terracotta">
                              {item.jenis}
                            </span>
                            <h4 className="text-sm font-bold text-espresso">
                              {item.pembeli} · Unit {item.unit}
                            </h4>
                            <span className="text-xs text-warmmuted">({item.proyek})</span>
                          </div>
                          <p className="text-xs font-semibold text-espresso mt-1">{item.nilai}</p>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            item.status === 'Disetujui'
                              ? 'bg-lime-100 text-olive'
                              : item.status === 'Ditolak'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-50 text-terracotta border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Rekomendasi AI */}
                      <div className="p-3 bg-sandstone/70 rounded-xl border border-warmborder text-xs text-espresso">
                        <strong className="text-terracotta font-semibold">Rekomendasi AI SM/TL: </strong>
                        {item.rekomendasiAi}
                      </div>

                      {item.status === 'Menunggu Review' && (
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => handleEscalationDecision(item.id, 'Ditolak')}
                            className="px-4 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-rose-700 cursor-pointer"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleEscalationDecision(item.id, 'Disetujui')}
                            className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-xs font-bold text-white cursor-pointer"
                          >
                            Setujui Pengajuan
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ROLE 5: ADMIN SALES DASHBOARD (DISTRIBUSI LEAD & BOOKING TRANSAKSI) */}
          {/* ========================================================================= */}
          {role === 'ADMIN' && (
            <div className="space-y-6">
              {/* Summary Cards Admin */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Konfirmasi Booking H+1</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">3 Transaksi</p>
                  <p className="text-[11px] text-olive font-semibold mt-1">Wajib Rekening PT Andara Rejo Makmur</p>
                </div>
                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Pemberkasan KPR H+7</p>
                  <p className="text-2xl font-extrabold text-terracotta mt-1">2 Berkas Menunggu</p>
                  <p className="text-[11px] text-warmmuted mt-1">Checklist KTP, NPWP, Rekening Koran</p>
                </div>
                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Pengajuan Multi-Bank H+10</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">2 Bank Paralel</p>
                  <p className="text-[11px] text-warmmuted mt-1">Bank BTN &amp; Bank Mandiri</p>
                </div>
              </div>

              {/* Tabel Booking Pipeline */}
              <section id="booking-pipeline" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Transaksi Booking Masuk &amp; Deadline Transaksi (Modul K)</h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Verifikasi transfer Rp 5.000.000 ke rekening resmi, penguncian hold unit, dan jadwal cash tempo.
                    </p>
                  </div>
                  <button
                    onClick={() => setToast('Sinkronisasi Transaksi Bank')}
                    className="px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-espresso flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" /> Refresh
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        <th className="py-3 px-4">ID / Pembeli</th>
                        <th className="py-3 px-4">Unit</th>
                        <th className="py-3 px-4">Skema Bayar</th>
                        <th className="py-3 px-4">Rekening Valid</th>
                        <th className="py-3 px-4">Admin H+1</th>
                        <th className="py-3 px-4">Dokumen H+7</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder text-xs">
                      {BOOKING_TRANSACTIONS.map((b) => (
                        <tr key={b.id} className="hover:bg-sandstone/40">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-espresso">{b.pembeli}</span>
                            <span className="block text-[11px] text-warmmuted">SE: {b.seName}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-terracotta">{b.unit}</td>
                          <td className="py-3 px-4">{b.skema}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-olive font-bold">
                              <CheckCircle2 className="size-3.5" /> PT Andara
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                b.statusAdminH1 === 'Terkonfirmasi'
                                  ? 'bg-lime-100 text-olive'
                                  : 'bg-amber-100 text-terracotta'
                              }`}
                            >
                              {b.statusAdminH1}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-warmmuted">{b.statusKprH7}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setToast(`Berkas booking ${b.id} dibuka`)}
                              className="px-3 py-1.5 rounded-lg bg-espresso text-white font-semibold cursor-pointer"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ROLE 6: IT DASHBOARD (MIGRATIONS DEVOS & AUDIT TRAIL LOG 100%) */}
          {/* ========================================================================= */}
          {role === 'IT' && (
            <div className="space-y-6">
              {/* Migration Status Cards */}
              <section id="db-schema" className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-warmborder">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Status PostgreSQL Schema `devos`</h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      6 Berkas Migrasi Aktif · Terverifikasi Terkini
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-lime-100 text-olive rounded-lg">
                    Database Ready
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                  {[
                    { v: '0001', name: 'Schema & Tipe' },
                    { v: '0002', name: 'User, Proyek, Unit' },
                    { v: '0003', name: 'Lead, Pipeline, BANT' },
                    { v: '0004', name: 'Booking & KPR' },
                    { v: '0005', name: 'KPI, AI, Audit' },
                    { v: '0006', name: 'SM/Direksi Views' },
                  ].map((m) => (
                    <div key={m.v} className="p-3 bg-sandstone/60 rounded-xl border border-warmborder text-center">
                      <p className="font-extrabold text-terracotta">{m.v}</p>
                      <p className="text-[11px] font-medium text-espresso mt-0.5 truncate">{m.name}</p>
                      <span className="inline-block mt-1 text-[10px] text-olive font-bold">DITERAPKAN</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Audit Log 100% */}
              <section id="audit-log" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Audit Log 100% (Append-Only Trigger Q5)</h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Merekam seluruh modifikasi data pengguna, status unit, harga, lead, dan booking.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-warmmuted">Keamanan &amp; Kepatuhan</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-3">Tabel</th>
                        <th className="py-3 px-3">Aksi</th>
                        <th className="py-3 px-4">Rincian Perubahan Data</th>
                        <th className="py-3 px-4">Diubah Oleh</th>
                        <th className="py-3 px-4 text-right">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder text-xs">
                      {IT_AUDIT_LOGS.map((a) => (
                        <tr key={a.id} className="hover:bg-sandstone/40">
                          <td className="py-3 px-4 font-mono font-bold text-warmmuted">{a.id}</td>
                          <td className="py-3 px-3 font-bold text-espresso font-mono">{a.tabel}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                a.aksi === 'INSERT'
                                  ? 'bg-lime-100 text-olive'
                                  : a.aksi === 'UPDATE'
                                  ? 'bg-amber-100 text-terracotta'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {a.aksi}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-espresso">{a.dataPerubahan}</td>
                          <td className="py-3 px-4 text-warmmuted">{a.oleh}</td>
                          <td className="py-3 px-4 text-right text-warmmuted tabular-nums">{a.waktu}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ROLE 7: DIGITAL MARKETING DASHBOARD (MODUL O, BIAYA IKLAN, CPL, S18) */}
          {/* ========================================================================= */}
          {role === 'DIGITAL_MARKETING' && (
            <div className="space-y-6">
              {/* Summary Cards Digital Marketing */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Total Belanja Iklan</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">Rp 22.000.000</p>
                  <p className="text-[11px] text-warmmuted mt-1">Alokasi Budget: Rp 32 Juta (68.7%)</p>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Total Leads Digital</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">
                    491 <span className="text-sm font-normal text-warmmuted">/ 600 Leads</span>
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-sandstone overflow-hidden">
                    <div className="h-full bg-olive rounded-full" style={{ width: '81.8%' }}></div>
                  </div>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Rata-Rata CPL</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-lime-100 text-olive">Optimal</span>
                  </div>
                  <p className="text-2xl font-extrabold text-olive mt-1">Rp 44.806</p>
                  <p className="text-[11px] text-warmmuted mt-1">SOP Target: ≤ Rp 60.000 / lead</p>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Biaya Per Booking</p>
                  <p className="text-2xl font-extrabold text-terracotta mt-1">Rp 2.750.000</p>
                  <p className="text-[11px] text-olive font-semibold mt-1">Efisien (Target ≤ Rp 4 Jt)</p>
                </div>
              </div>

              {/* Tabel Kampanye & Kinerja Iklan */}
              <section id="ad-campaigns" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-espresso">
                      Kinerja Kampanye Iklan &amp; CPL per Kanal (Modul O2 &amp; O3)
                    </h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Target: CPL ≤ Rp 60 rb · Lead Valid ≥ 60% · Biaya/Kunjungan ≤ Rp 600 rb · Biaya/Booking ≤ Rp 4 jt.
                    </p>
                  </div>
                  <button
                    onClick={() => setToast('Sinkronisasi Meta, TikTok & Google Ads API')}
                    className="px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-espresso flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="size-3.5" /> Sync Ads API
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        <th className="py-3 px-4">Kanal / Kode</th>
                        <th className="py-3 px-3">Belanja</th>
                        <th className="py-3 px-3">Leads</th>
                        <th className="py-3 px-3">% Valid</th>
                        <th className="py-3 px-3">CPL</th>
                        <th className="py-3 px-3">Cost/Visit</th>
                        <th className="py-3 px-3">Cost/Booking</th>
                        <th className="py-3 px-4 text-right">Status AI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder text-xs">
                      {AD_CAMPAIGNS.map((c) => (
                        <tr key={c.id} className="hover:bg-sandstone/40">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-espresso">{c.nama}</span>
                            <span className="block font-mono text-[11px] text-terracotta">
                              {c.kode} · {c.kanal}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold tabular-nums text-espresso">
                            {rupiah(c.spendBulanIni)}
                          </td>
                          <td className="py-3 px-3 tabular-nums font-bold text-espresso">
                            {c.leads} <span className="text-[11px] font-normal text-warmmuted">({c.leadsValid} valid)</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-bold tabular-nums ${
                                c.persenValid >= 60 ? 'text-olive' : 'text-rose-600'
                              }`}
                            >
                              {c.persenValid}%
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold tabular-nums text-espresso">
                            {rupiah(c.cpl)}
                          </td>
                          <td className="py-3 px-3 tabular-nums text-warmmuted">
                            {rupiah(c.biayaPerKunjungan)}
                          </td>
                          <td className="py-3 px-3 tabular-nums font-bold text-terracotta">
                            {rupiah(c.biayaPerBooking)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                c.statusAi === 'Optimal'
                                  ? 'bg-lime-100 text-olive'
                                  : 'bg-amber-100 text-terracotta'
                              }`}
                            >
                              {c.statusAi}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* AI Ad Optimizer Assistant (§S18) */}
              <section id="ai-ad-optimizer" className="bg-espresso text-white rounded-2xl p-6 shadow-sm border border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">AI Ad Optimizer (§S18 Playbook)</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                    Audit Otomatis 3 Harian
                  </span>
                </div>
                <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
                  AI mendeteksi materi iklan dengan performa tinggi &amp; rendah, serta menyarankan pergeseran anggaran untuk memaksimalkan jumlah booking.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {AI_AD_INSIGHTS.map((ai) => (
                    <div key={ai.id} className="p-4 rounded-xl bg-white/10 border border-white/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">{ai.tipe}</span>
                        <span className="text-[10px] text-white/50">{ai.id}</span>
                      </div>
                      <p className="text-xs text-white/90">{ai.pesan}</p>
                      <div className="p-2.5 rounded-lg bg-black/30 border border-white/10 text-[11px] text-white/80">
                        <strong className="text-amber-300 font-semibold">Rekomendasi Aksi: </strong>
                        {ai.rekomendasi}
                      </div>
                      <p className="text-[10px] text-lime-300 font-medium">✓ {ai.dampak}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Feedback Kualitas Lead dari SE (Modul O4) & Dayparting (Modul O8) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <section id="se-feedback" className="md:col-span-7 bg-white border border-warmborder rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-warmborder">
                    <div>
                      <h4 className="text-sm font-bold text-espresso">Umpan Balik Kualitas Lead dari SE (Modul O4)</h4>
                      <p className="text-[11px] text-warmmuted">Label valid/tidak valid dari SE dibaca digital marketer setiap hari.</p>
                    </div>
                    <span className="text-xs font-bold text-terracotta">Feed Real-time</span>
                  </div>

                  <div className="divide-y divide-warmborder">
                    {SE_LEAD_FEEDBACKS.map((fb) => (
                      <div key={fb.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-espresso">{fb.leadName}</span>
                            <span className="font-mono text-[10px] text-warmmuted">({fb.kodeKonten})</span>
                          </div>
                          <p className="text-warmmuted mt-0.5">{fb.alasan}</p>
                          <span className="text-[10px] text-warmmuted font-semibold mt-1 inline-block">
                            Oleh: {fb.seName} · {fb.waktu}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            fb.label === 'Valid' ? 'bg-lime-100 text-olive' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {fb.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="md:col-span-5 bg-white border border-warmborder rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="pb-2 border-b border-warmborder">
                    <h4 className="text-sm font-bold text-espresso">Pola Jam Lead Masuk / Dayparting (§O8)</h4>
                    <p className="text-[11px] text-warmmuted">Untuk sinkronisasi alokasi budget &amp; jadwal piket SE.</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-warmmuted mb-1">
                        <span>Pukul 08.00 - 12.00 (Pagi)</span>
                        <span className="text-espresso">22% Leads</span>
                      </div>
                      <div className="h-2 rounded-full bg-sandstone overflow-hidden">
                        <div className="h-full bg-terracotta rounded-full" style={{ width: '22%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-warmmuted mb-1">
                        <span>Pukul 12.00 - 14.00 (Istirahat Siang)</span>
                        <span className="text-espresso">28% Leads (Tinggi)</span>
                      </div>
                      <div className="h-2 rounded-full bg-sandstone overflow-hidden">
                        <div className="h-full bg-olive rounded-full" style={{ width: '28%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-warmmuted mb-1">
                        <span>Pukul 14.00 - 18.00 (Sore)</span>
                        <span className="text-espresso">15% Leads</span>
                      </div>
                      <div className="h-2 rounded-full bg-sandstone overflow-hidden">
                        <div className="h-full bg-terracotta rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-warmmuted mb-1">
                        <span>Pukul 18.00 - 21.00 (Malam / Piket SE)</span>
                        <span className="text-espresso">35% Leads (Puncak)</span>
                      </div>
                      <div className="h-2 rounded-full bg-sandstone overflow-hidden">
                        <div className="h-full bg-terracotta rounded-full" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-terracotta leading-relaxed mt-2">
                    💡 <strong>Insight AI:</strong> Porsi terbesar (35%) lead masuk pada jam 19.30 - 21.00 WIB. Sinkron dengan <strong>Piket Malam SE</strong> (Modul B2).
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL EDIT / TAMBAH UNIT UNTUK SM */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-warmborder">
            <div className="flex items-center justify-between pb-3 border-b border-warmborder">
              <h3 className="text-base font-bold text-espresso">
                {editingUnit ? `Edit Unit ${editingUnit.namaUnit}` : 'Tambah Unit Baru — The Park'}
              </h3>
              <button
                onClick={() => setShowUnitModal(false)}
                className="text-warmmuted hover:text-espresso cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-warmmuted mb-1">Cluster</label>
                  <select
                    name="cluster"
                    defaultValue={editingUnit?.cluster || 'Nagoya'}
                    className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone"
                  >
                    <option value="Nagoya">Nagoya (Diamond)</option>
                    <option value="Osaka">Osaka (Gold)</option>
                    <option value="Tokyo">Tokyo (Emerald)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-warmmuted mb-1">Nama Unit</label>
                  <input
                    name="namaUnit"
                    defaultValue={editingUnit?.namaUnit || ''}
                    placeholder="Contoh: A.15"
                    required
                    className="w-full h-9 px-2.5 rounded-lg border border-warmborder"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-warmmuted mb-1">Tipe Unit</label>
                  <input
                    name="tipeUnit"
                    defaultValue={editingUnit?.tipeUnit || 'Diamond'}
                    required
                    className="w-full h-9 px-2.5 rounded-lg border border-warmborder"
                  />
                </div>
                <div>
                  <label className="block font-bold text-warmmuted mb-1">Luas Tanah (LT)</label>
                  <input
                    name="luasTanah"
                    type="number"
                    defaultValue={editingUnit?.luasTanah || 90}
                    required
                    className="w-full h-9 px-2.5 rounded-lg border border-warmborder"
                  />
                </div>
                <div>
                  <label className="block font-bold text-warmmuted mb-1">Luas Bangunan (LB)</label>
                  <input
                    name="luasBangunan"
                    type="number"
                    defaultValue={editingUnit?.luasBangunan || 75}
                    required
                    className="w-full h-9 px-2.5 rounded-lg border border-warmborder"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-warmmuted mb-1">Harga Cash Keras (Rp)</label>
                <input
                  name="hargaCashKeras"
                  type="number"
                  defaultValue={editingUnit?.hargaCashKeras || 830000000}
                  required
                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-warmmuted mb-1">Cash 6 Bulan</label>
                  <input
                    name="hargaCash6"
                    type="number"
                    defaultValue={editingUnit?.hargaCash6 || 855000000}
                    className="w-full h-9 px-2.5 rounded-lg border border-warmborder"
                  />
                </div>
                <div>
                  <label className="block font-bold text-warmmuted mb-1">Cash 12 Bulan</label>
                  <input
                    name="hargaCash12"
                    type="number"
                    defaultValue={editingUnit?.hargaCash12 || 880000000}
                    className="w-full h-9 px-2.5 rounded-lg border border-warmborder"
                  />
                </div>
                <div>
                  <label className="block font-bold text-warmmuted mb-1">Cash 24 Bulan</label>
                  <input
                    name="hargaCash24"
                    type="number"
                    defaultValue={editingUnit?.hargaCash24 || 930000000}
                    className="w-full h-9 px-2.5 rounded-lg border border-warmborder"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-warmmuted mb-1">Status Ketersediaan</label>
                <select
                  name="status"
                  defaultValue={editingUnit?.status || 'tersedia'}
                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone font-bold"
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="hold">Hold (Kunci Sementara)</option>
                  <option value="booking">Booking</option>
                  <option value="terjual">Terjual</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-warmmuted mb-1">Keterangan / Keunggulan</label>
                <textarea
                  name="keterangan"
                  defaultValue={editingUnit?.keterangan || ''}
                  rows={2}
                  placeholder="Deskripsi hook, hadap taman, jumlah KT/KM, carport..."
                  className="w-full p-2.5 rounded-lg border border-warmborder"
                />
              </div>

              <div className="pt-3 border-t border-warmborder flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-4 py-2 rounded-xl bg-sandstone font-semibold text-warmmuted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-terracotta text-white font-bold cursor-pointer hover:bg-terracotta/90"
                >
                  Simpan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proyek Intelligence Modals (Fase 1, 1A, 2) */}
      {showJalurProyekModal && (
        <JalurProyek
          projectName="The Park Townhouse Sukoharjo"
          userRole={role}
          onOpenStage={(stageKey) => {
            setShowJalurProyekModal(false);
            if (stageKey === 'surat_cinta_99') setShowLoveLetterModal(true);
            else if (stageKey === 'riset_pasar') setShowMarketResearchModal(true);
            else if (stageKey === 'target_penjualan') setShowSalesTargetModal(true);
          }}
          onClose={() => setShowJalurProyekModal(false)}
        />
      )}

      {showMarketResearchModal && (
        <MarketResearchViewer
          projectName="The Park Townhouse Sukoharjo"
          userRole={role}
          onClose={() => setShowMarketResearchModal(false)}
        />
      )}

      {showSalesTargetModal && (
        <SalesTargetViewer
          projectName="The Park Townhouse Sukoharjo"
          totalUnits={30}
          avgPriceIdr={900000000}
          seHeadcount={3}
          onClose={() => setShowSalesTargetModal(false)}
        />
      )}

      {showKbModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-sandstone border-b border-warmborder flex items-center justify-between">
              <span className="font-extrabold text-espresso">Product Knowledge Base (The Park Townhouse)</span>
              <button onClick={() => setShowKbModal(false)} className="text-warmmuted hover:text-espresso text-sm font-bold">
                Tutup ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <KnowledgeBaseViewer />
            </div>
          </div>
        </div>
      )}

      {showLoveLetterModal && (
        <LoveLetterViewerModal
          isOpen={showLoveLetterModal}
          onClose={() => setShowLoveLetterModal(false)}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-espresso text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-white/10 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
