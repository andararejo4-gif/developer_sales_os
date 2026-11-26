import { useEffect, useMemo, useRef, useState } from 'react';
import { PublicHomepageV3 } from './components/v3/PublicHomepageV3';
import { MarketResearchViewer } from './components/MarketResearchViewer';
import { SalesTargetViewer } from './components/SalesTargetViewer';
import { JalurProyek } from './components/JalurProyek';
import { ContentCalendarViewer } from './components/ContentCalendarViewer';
import { KnowledgeBaseViewer } from './components/KnowledgeBaseViewer';
import { LoveLetterViewerModal } from './components/LoveLetterViewerModal';
import { PlaybookViewer } from './components/PlaybookViewer';
import { DailyRouteViewer } from './components/DailyRouteViewer';
import { ProjectWebsitePreview } from './components/ProjectWebsitePreview';
import { PublicProjectSitePage } from './components/PublicProjectSitePage';
import { ProfilePage } from './components/ProfilePage';
import {
  RoleNotificationBell,
  buildRoleGreetingAndNotifications,
  type RoleNotifAction,
} from './components/RoleNotificationCenter';
import { CrmPipelineView } from './components/CrmPipelineView';
import { CommissionSettingsModal } from './components/CommissionSettingsModal';
import { SuperadminPanel } from './components/SuperadminPanel';
import { PlatformExecutiveDashboard } from './components/superadmin/PlatformExecutiveDashboard';
import {
  ItCommandCenterDashboard,
  type ItAdminSection,
} from './components/superadmin/ItCommandCenterDashboard';
import { FieldOpsModal } from './components/FieldOpsModal';
import { PipelinePage } from './components/PipelinePage';
import { CompanyBankAccountsModal } from './components/company/CompanyBankAccountsModal';
import { CompanyAuditLogsModal } from './components/company/CompanyAuditLogsModal';
import { MobileBottomNav, type MobileNavTab } from './components/mobile/MobileBottomNav';
import { MobileMoreSheet } from './components/mobile/MobileMoreSheet';
import { calculateSalesTargetPlan } from './lib/sales-target/calculator';
import type { ScenarioType } from './lib/sales-target/types';
import {
  SeMobileActionCard,
  SeMobileScorecardList,
  SeMobileDailyReportList,
} from './components/mobile/SeMobileViews';
import {
  SeGuidedTourModal,
} from './components/se/SeGuidedTour';
import {
  SeNotificationBell,
  buildSeRealtimeNotifications,
  type SeNotificationItem,
  type SeNotifTarget,
} from './components/se/SeNotificationCenter';
import {
  exportDailyReportExcel,
  exportDailyReportPdf,
} from './lib/exporters/daily-report-exporter';
import {
  loadAuthSession,
  logoutFromServer,
  saveAuthSession,
  saveImpersonatorBackup,
  loadImpersonatorBackup,
  clearImpersonatorBackup,
  isImpersonating,
  type AuthSession,
} from './lib/auth/dummy-accounts';
import {
  type DashboardView,
  getViewFromPathname,
  navigateToView,
  loadPersistedState,
  savePersistedState,
} from './lib/navigation/router';
import {
  getProjectById,
  loadSavedProjectId,
  saveSelectedProjectId,
  loadUnitsForProject,
  saveUnitsForProject,
  loadAllProjects,
  saveNewProject,
  type CompanyProject,
} from './lib/projects/projects-data';
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Database,
  Edit3,
  FileCheck,
  Globe,
  HeartHandshake,
  History,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquare,
  Percent,
  PhoneCall,
  Plus,
  RefreshCw,
  Download,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Lock,
  Share2,
  Wrench,
} from 'lucide-react';
import { SecureDocumentVaultPage } from './components/SecureDocumentVaultPage';
import { ReferralProgramPage } from './components/ReferralProgramPage';
import { CustomerComplaintsPage } from './components/CustomerComplaintsPage';
import { BankSubmissionWorkflowPage } from './components/BankSubmissionWorkflowPage';
import { OrgUserManagementModal } from './components/OrgUserManagementModal';
import { OrgUserManagementPage } from './components/OrgUserManagementPage';
import { fetchPlanOverridesFromDb, getDeveloperPlan } from './lib/plans/plan-override';
import { ItKnowledgeAiPanel } from './components/it/ItKnowledgeAiPanel';
import { ExecutiveControlTowerPage } from './components/ExecutiveControlTowerPage';
import {
  AD_CAMPAIGNS,
  BOOKING_TRANSACTIONS,
  DEFAULT_ITEMS,
  DIREKSI_PROJECTS,
  ESCALATION_DATA,
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

const EMPTY_SE_ITEMS: ReportItem[] = DEFAULT_ITEMS.map((item) => ({
  ...item,
  realisasi: item.targetNum === null ? '-' : item.id === 2 ? '0 / 0' : item.id === 3 ? '0 / 0' : item.id === 4 || item.id === 5 ? '0 / 0 / 0' : '0',
  catatan: 'Memuat data real dari database...',
}));

function loadItems(): ReportItem[] {
  return structuredClone(EMPTY_SE_ITEMS);
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
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());
  const [viewMode, setViewMode] = useState<'homepage' | 'dashboard'>(() =>
    loadAuthSession() ? 'dashboard' : 'homepage'
  );
  const [role, setRole] = useState<RoleKey>(() => loadAuthSession()?.role ?? 'SE');
  const user = USERS_BY_ROLE[role];
  const [effectivePlanCode, setEffectivePlanCode] = useState<'gold' | 'platinum' | 'diamond'>(
    () => getDeveloperPlan('dev-001', 'Platinum').toLowerCase() as 'gold' | 'platinum' | 'diamond'
  );

  useEffect(() => {
    if (!authSession) return;
    fetchPlanOverridesFromDb().then((map) => {
      const nextPlan = (map['dev-001']?.overriddenPlan || 'Platinum').toLowerCase() as
        | 'gold'
        | 'platinum'
        | 'diamond';
      setEffectivePlanCode(nextPlan);
    });
  }, [authSession, role]);

  const isPlatformSuperadmin = role === 'SUPERADMIN' || role === 'SUPERADMIN_IT';

  // Multi-Project State (Universal untuk seluruh role: SE, TL, SM, DM, ADMIN, DIREKSI, IT)
  const [projects, setProjects] = useState<CompanyProject[]>(() => loadAllProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => loadSavedProjectId());
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const activeProject = getProjectById(activeProjectId);

  // Active Sales Target Scenario per Project (Dikendalikan oleh SM)
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(() =>
    loadPersistedState<ScenarioType>(`devos_target_scenario_${loadSavedProjectId()}`, 'realistis')
  );

  useEffect(() => {
    setActiveScenario(
      loadPersistedState<ScenarioType>(`devos_target_scenario_${activeProjectId}`, 'realistis')
    );
  }, [activeProjectId]);

  // Target reverse-funnel dinamis yang dihitung dari skenario SM
  const currentTargetPlan = useMemo(() => {
    const avgPrice =
      activeProject.id === 'andara-village'
        ? 550000000
        : activeProject.id === 'griya-andara-asri'
        ? 185000000
        : 900000000;
    return calculateSalesTargetPlan(
      {
        projectId: activeProject.id,
        projectName: activeProject.nama,
        totalUnits: activeProject.totalUnit,
        avgPriceIdr: avgPrice,
        seHeadcount: 3,
      },
      activeScenario
    );
  }, [activeProject, activeScenario]);

  // Kuota ritme harian/mingguan/bulanan per SE sesuai skenario SM
  const seTargetAllocation = currentTargetPlan.seAllocations[0] || {
    monthlyUnitTarget: 2,
    weeklySiteVisitTarget: 3,
    dailyContactTarget: 8,
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    saveSelectedProjectId(projectId);
    const newProject = getProjectById(projectId);
    setUnits(loadUnitsForProject(projectId));
    setClusterFilter('all');
    setStatusFilter('all');
    setToast(`Proyek aktif: ${newProject.nama}`);
  };

  const handleCreateNewProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nama = (fd.get('namaProyek') as string)?.trim();
    if (!nama) return;

    const kode = (fd.get('kodeProyek') as string)?.trim();
    const tipe = (fd.get('tipeProyek') as 'Mewah' | 'Menengah' | 'Subsidi') || 'Menengah';
    const lokasi = (fd.get('lokasiProyek') as string)?.trim() || 'Sukoharjo';
    const koordinatGps = (fd.get('koordinatGps') as string)?.trim() || '-7.673872, 110.843978';
    const cluster1Nama = (fd.get('cluster1Nama') as string)?.trim() || 'Gerbang Utama & Cluster 1';
    const cluster2Nama = (fd.get('cluster2Nama') as string)?.trim();
    const cluster2Gps = (fd.get('cluster2Gps') as string)?.trim();
    const cluster3Nama = (fd.get('cluster3Nama') as string)?.trim();
    const cluster3Gps = (fd.get('cluster3Gps') as string)?.trim();

    const titikKoordinatList: import('./lib/projects/projects-data').ProjectGpsLocation[] = [
      {
        id: 'coord-1',
        namaCluster: cluster1Nama,
        koordinat: koordinatGps,
        isPrimary: true,
      },
    ];
    if (cluster2Nama && cluster2Gps) {
      titikKoordinatList.push({
        id: 'coord-2',
        namaCluster: cluster2Nama,
        koordinat: cluster2Gps,
      });
    }
    if (cluster3Nama && cluster3Gps) {
      titikKoordinatList.push({
        id: 'coord-3',
        namaCluster: cluster3Nama,
        koordinat: cluster3Gps,
      });
    }
    const radiusKm = Number(fd.get('radiusKm')) || 25;
    const totalUnit = Number(fd.get('totalUnit')) || 30;
    const kisaranHarga = (fd.get('kisaranHarga') as string)?.trim() || 'Rp 500 Jt - Rp 800 Jt';
    const deskripsi = (fd.get('deskripsi') as string)?.trim();
    const katalogFileObj = fd.get('katalogFile') as File | null;
    const pricelistFileObj = fd.get('pricelistFile') as File | null;

    const created = saveNewProject({
      nama,
      kode,
      tipe,
      lokasi,
      koordinatGps,
      titikKoordinatList,
      radiusKm,
      totalUnit,
      kisaranHarga,
      deskripsi,
      katalogFile: katalogFileObj && katalogFileObj.name ? katalogFileObj.name : 'e-katalog_resmi.pdf',
      pricelistFile: pricelistFileObj && pricelistFileObj.name ? pricelistFileObj.name : 'pricelist_skema_bertahap.xlsx',
      generatedOutputs: {
        suratCinta: true,
        risetPasar: true,
        targetPenjualan: true,
        kalenderKonten: true,
        playbook: true,
        ruteHarian: true,
      },
    });

    const updatedProjects = loadAllProjects();
    setProjects(updatedProjects);
    handleSelectProject(created.id);
    setShowNewProjectModal(false);
    openView('jalur');
    setToast(`Proyek "${created.nama}" berhasil dibuat! 6 Mesin Output (Surat Cinta, Riset 25km, Target, Kalender, Playbook 5 Role, Rute) langsung aktif.`);
  };

  // SE States (tersimpan di localStorage agar tidak hilang saat reload)
  const [items, setItems] = useState<ReportItem[]>(loadItems);
  const [filter, setFilter] = useState<'all' | Category>(() =>
    loadPersistedState<'all' | Category>('devos_se_filter', 'all')
  );
  const [period, setPeriod] = useState<PeriodKey>(() =>
    loadPersistedState<PeriodKey>('devos_se_period', 'harian')
  );

  // SM States (CRUD Units & SE monitoring)
  const [units, setUnits] = useState<UnitProperty[]>(() =>
    loadUnitsForProject(loadSavedProjectId())
  );
  const projectClusters = useMemo(() => Array.from(new Set(units.map((u) => u.cluster))), [units]);
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUnitModal, setShowUnitModal] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<UnitProperty | null>(null);

  // Direksi States
  const [escalations, setEscalations] = useState(ESCALATION_DATA);
  const [tipeFilter, setTipeFilter] = useState<string>('all');

  // Active Page View (URL-synced, menggantikan modal agar semua fitur jadi halaman penuh)
  const [activeView, setActiveView] = useState<DashboardView>(() =>
    typeof window !== 'undefined' ? getViewFromPathname(window.location.pathname) : 'dashboard'
  );
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return window.location.hash.replace(/^#/, '') || 'top';
    }
    return 'top';
  });
  const [showSuperadminModal, setShowSuperadminModal] = useState<boolean>(false);

  // Common UI states
  const [toast, setToast] = useState<string | null>(null);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);
  const [seRealData, setSeRealData] = useState<any | null>(null);
  const [userPermissions, setUserPermissions] = useState<
    Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>
  >({});
  const [realSummary, setRealSummary] = useState<any | null>(null);

  const canReadFeature = (featureKey: string) => {
    const p = userPermissions[featureKey];
    return p ? p.read !== false : true;
  };

  const scrollToSectionElement = (sectionId: string) => {
    const attemptScroll = (triesLeft: number) => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (triesLeft > 0) {
        setTimeout(() => attemptScroll(triesLeft - 1), 60);
      }
    };
    requestAnimationFrame(() => attemptScroll(6));
  };

  const openDashboardSection = (sectionId = 'top') => {
    setActiveView('dashboard');
    setActiveSection(sectionId);
    setIsMobileMoreOpen(false);
    navigateToView('dashboard');
    if (typeof window !== 'undefined') {
      const hashPart = sectionId && sectionId !== 'top' ? `#${sectionId}` : '';
      window.history.replaceState(
        window.history.state,
        '',
        `/dashboard${hashPart}`
      );
    }

    if (!sectionId || sectionId === 'top') {
      requestAnimationFrame(() => {
        const mainEl = document.getElementById('dashboard-scroll-container');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      scrollToSectionElement(sectionId);
    }
  };

  const fetchSeRealDashboard = async () => {
    try {
      const res = await fetch(`/api/se/dashboard?projectId=${encodeURIComponent(activeProjectId)}`, {
        headers: {
          'X-User-Email': user.email,
          'X-User-Role': role,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          setSeRealData(json.data);
          if (Array.isArray(json.data.dailyReportItems)) {
            setItems(json.data.dailyReportItems);
          }
        }
      }
    } catch {
      /* fallback bila server sedang restart */
    }
  };

  const fetchRealPermissionsAndSummary = async () => {
    try {
      const token = authSession?.token || loadAuthSession()?.token;
      const headers: HeadersInit = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-User-Email': user.email,
        'X-User-Role': role,
      };
      const [permRes, sumRes] = await Promise.all([
        fetch('/api/permissions/me', { credentials: 'include', headers }),
        fetch(`/api/dashboard/summary?projectId=${encodeURIComponent(activeProjectId)}`, {
          credentials: 'include',
          headers,
        }),
      ]);
      if (permRes.ok) {
        const pJson = await permRes.json();
        if (pJson.ok && pJson.permissions) setUserPermissions(pJson.permissions);
      }
      if (sumRes.ok) {
        const sJson = await sumRes.json();
        if (sJson.ok) {
          setRealSummary(sJson);
          if (Array.isArray(sJson.escalations) && sJson.escalations.length > 0) {
            setEscalations(
              sJson.escalations.map((e: any) => ({
                id: String(e.id),
                jenis: String(e.jenis),
                pembeli: String(e.pembeli),
                unit: String(e.unit),
                proyek: String(e.proyek),
                nilai: String(e.nilai),
                rekomendasiAi: String(e.rekomendasi_ai || ''),
                status: String(e.status || 'Menunggu Review') as any,
              }))
            );
          }
        }
      }
    } catch {
      /* abaikan error jaringan sementara */
    }
  };

  useEffect(() => {
    if (authSession) {
      fetchSeRealDashboard();
      fetchRealPermissionsAndSummary();
    }
  }, [authSession, user.email, role, activeView, activeProjectId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashId = window.location.hash.replace(/^#/, '');
      if (hashId) {
        setActiveView('dashboard');
        setActiveSection(hashId);
        scrollToSectionElement(hashId);
      }
    }
  }, []);

  useEffect(() => {
    savePersistedState('devos_se_filter', filter);
    savePersistedState('devos_se_period', period);
  }, [filter, period]);

  useEffect(() => {
    const onPopState = () => {
      setActiveView(getViewFromPathname(window.location.pathname));
      const hashId = window.location.hash.replace(/^#/, '');
      setActiveSection(hashId || 'top');
      if (hashId) {
        scrollToSectionElement(hashId);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    saveUnitsForProject(activeProjectId, units);
  }, [units, activeProjectId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const realScorecardTotal = Number(seRealData?.scorecard?.totalPoints ?? 0);
  const realScorecardRows = seRealData?.scorecard?.rows ?? [];
  const realScorecardCategory =
    seRealData?.scorecard?.category ?? 'Belum Ada Aktivitas Tercatat (0.0 Poin)';

  const activePeriodData = seRealData?.periods?.[period] ?? {
    title: PERIODS[period].label,
    leadCardTitle:
      period === 'harian'
        ? 'Lead Aktif & Baru Hari Ini'
        : period === 'minggu'
        ? 'Lead Valid Minggu Ini'
        : 'Lead Valid Bulan Ini',
    leadsCount:
      period === 'harian'
        ? seRealData?.metrics?.leadsTodayValidCount ?? 0
        : period === 'minggu'
        ? seRealData?.metrics?.leadsWeekValidCount ?? seRealData?.metrics?.totalValidLeadsCount ?? 0
        : seRealData?.metrics?.leadsMonthValidCount ?? seRealData?.metrics?.totalValidLeadsCount ?? 0,
    leadsTarget:
      period === 'harian'
        ? seTargetAllocation.dailyContactTarget
        : period === 'minggu'
        ? seTargetAllocation.dailyContactTarget * 6
        : seTargetAllocation.dailyContactTarget * 26,
    leadsSubtext: `Total Pipeline Aktif: ${seRealData?.metrics?.totalValidLeadsCount ?? 0} Lead Valid`,
    qualifiedCount: seRealData?.metrics?.qualifiedProspectsCount ?? 0,
    hotCount: seRealData?.metrics?.hotProspectsCount ?? 0,
    warmCount: seRealData?.metrics?.warmProspectsCount ?? 0,
    bookingsCount: seRealData?.metrics?.bookingsCount ?? 0,
    score: realScorecardTotal,
    maxScore: 100,
    tier: realScorecardCategory,
    meta: `${seRealData?.metrics?.totalValidLeadsCount ?? 0} Lead Valid · ${seRealData?.metrics?.qualifiedProspectsCount ?? 0} Prospek BANT ≥ 7 · ${seRealData?.metrics?.bookingsCount ?? 0} Booking`,
  };

  const realDashOffset = Math.max(
    0,
    Math.min(314.16, 314.16 - (Math.min(100, Number(activePeriodData.score || 0)) / 100) * 314.16)
  );

  const p = {
    label: activePeriodData.title,
    score: activePeriodData.score,
    maxScore: activePeriodData.maxScore || 100,
    tier: activePeriodData.tier,
    meta: activePeriodData.meta,
    dash: realDashOffset,
  };
  const list = useMemo(() => {
    // Sesuaikan targetNum item laporan harian SE berdasarkan target skenario yang dipilih SM
    const mapped = items.map((r) => {
      if (r.id === 1) {
        // Lead baru harian
        return { ...r, target: `${seTargetAllocation.dailyContactTarget}`, targetNum: seTargetAllocation.dailyContactTarget };
      }
      if (r.id === 2) {
        // Dial / percakapan telepon
        const dialTarget = Math.max(15, seTargetAllocation.dailyContactTarget * 3);
        const talkTarget = Math.max(6, Math.round(dialTarget * 0.4));
        return { ...r, target: `${dialTarget} / ${talkTarget}`, targetNum: dialTarget };
      }
      if (r.id === 3) {
        // Chat WA personal
        const chatTarget = Math.max(25, seTargetAllocation.dailyContactTarget * 4);
        const respTarget = Math.max(10, Math.round(chatTarget * 0.4));
        return { ...r, target: `${chatTarget} / ${respTarget}`, targetNum: chatTarget };
      }
      if (r.id === 4) {
        // Canvassing
        const canTarget = Math.max(15, seTargetAllocation.dailyContactTarget * 2);
        return { ...r, target: `${canTarget} / ${canTarget * 2} / ${Math.max(2, Math.round(canTarget * 0.15))}`, targetNum: canTarget };
      }
      if (r.id === 8) {
        // Kunjungan / survei harian
        const visitTarget = Math.max(1, Math.round(seTargetAllocation.weeklySiteVisitTarget / 6));
        return { ...r, target: `${visitTarget}`, targetNum: visitTarget };
      }
      return r;
    });
    return filter === 'all' ? mapped : mapped.filter((r) => r.cat === filter);
  }, [items, filter, seTargetAllocation]);
  const hits = items.filter((r) => r.targetNum !== null && evalStatus(r) === 'hit').length;

  const adjustDailyCounters = async (updates: Record<string, number>) => {
    try {
      const res = await fetch('/api/se/daily-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.email,
          'X-User-Role': role,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          setSeRealData(json.data);
          if (Array.isArray(json.data.dailyReportItems)) {
            setItems(json.data.dailyReportItems);
          }
          setToast('Realisasi aktivitas harian tersimpan ke database!');
        }
      }
    } catch {
      setToast('Gagal menyimpan aktivitas harian');
    }
  };

  const renderActivityCounterControls = (item: ReportItem) => {
    const counters = seRealData?.dailyActivityCounters || {
      dialCount: 0,
      connectedCallCount: 0,
      canvassingContacts: 0,
      canvassingBrochures: 0,
      canvassingLeads: 0,
      postedReels: 0,
      postedWaStatus: 0,
      postedStories: 0,
    };

    const makeStepper = (label: string, field: string, currentVal: number, step = 1) => (
      <div
        key={field}
        className="inline-flex items-center gap-1.5 bg-white border border-warmborder rounded-xl px-2 py-1 text-[11px]"
      >
        <span className="text-warmmuted font-bold">{label}:</span>
        <button
          type="button"
          onClick={() => adjustDailyCounters({ [field]: Math.max(0, currentVal - step) })}
          className="size-7 sm:size-5 rounded-lg bg-sandstone hover:bg-warmborder active:scale-95 text-espresso font-extrabold grid place-items-center cursor-pointer"
          title={`Kurangi ${label}`}
        >
          -
        </button>
        <span className="font-extrabold text-espresso tabular-nums min-w-[18px] text-center">
          {currentVal}
        </span>
        <button
          type="button"
          onClick={() => adjustDailyCounters({ [field]: currentVal + step })}
          className="size-7 sm:size-5 rounded-lg bg-amber-50 hover:bg-terracotta hover:text-white active:scale-95 text-terracotta font-extrabold grid place-items-center cursor-pointer transition-colors"
          title={`Tambah ${label}`}
        >
          +
        </button>
      </div>
    );

    if (item.id === 2) {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {makeStepper('Dial', 'dialCount', Number(counters.dialCount || 0), 1)}
          {makeStepper('Tersambung', 'connectedCallCount', Number(counters.connectedCallCount || 0), 1)}
        </div>
      );
    }
    if (item.id === 4) {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {makeStepper('Kontak', 'canvassingContacts', Number(counters.canvassingContacts || 0), 1)}
          {makeStepper('Brosur', 'canvassingBrochures', Number(counters.canvassingBrochures || 0), 5)}
          {makeStepper('Lead', 'canvassingLeads', Number(counters.canvassingLeads || 0), 1)}
        </div>
      );
    }
    if (item.id === 5) {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {makeStepper('Reel', 'postedReels', Number(counters.postedReels || 0), 1)}
          {makeStepper('WA', 'postedWaStatus', Number(counters.postedWaStatus || 0), 1)}
          {makeStepper('Story', 'postedStories', Number(counters.postedStories || 0), 1)}
        </div>
      );
    }
    return null;
  };

  const noteSaveTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const updateItem = (id: number, field: 'realisasi' | 'catatan', val: string) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
    if (field === 'catatan') {
      if (noteSaveTimersRef.current[id]) {
        clearTimeout(noteSaveTimersRef.current[id]);
      }
      noteSaveTimersRef.current[id] = setTimeout(() => {
        fetch('/api/se/daily-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': user.email,
            'X-User-Role': role,
          },
          body: JSON.stringify({
            itemNotes: { [String(id)]: val },
            ...(id === 13 ? { hambatanBantuan: val } : {}),
          }),
        })
          .then((r) => {
            if (!r.ok) setToast('Gagal menyimpan catatan ke database');
          })
          .catch(() => setToast('Koneksi terputus saat menyimpan catatan'));
      }, 500);
    }
  };

  const [isExportReportModalOpen, setIsExportReportModalOpen] = useState(false);
  const [isBankAccountsModalOpen, setIsBankAccountsModalOpen] = useState(false);
  const [isUserMgmtModalOpen, setIsUserMgmtModalOpen] = useState(false);
  const [isAuditLogsModalOpen, setIsAuditLogsModalOpen] = useState(false);
  const [isDireksiGlossaryOpen, setIsDireksiGlossaryOpen] = useState(false);
  const [pipelineTargetFilter, setPipelineTargetFilter] = useState<string | undefined>(undefined);
  const [activeH5Reminder, setActiveH5Reminder] = useState<SeNotificationItem | null>(null);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [showAssistantGreeting, setShowAssistantGreeting] = useState<boolean>(() => {
    const sess = loadAuthSession();
    if (!sess) return false;
    return !sessionStorage.getItem(`devos_assistant_greeted_${sess.loggedInAt}`);
  });
  const [tourSnoozedUntilMs, setTourSnoozedUntilMs] = useState<number>(() =>
    loadPersistedState<number>(`devos_se_tour_snooze_${user.email}`, 0)
  );

  const handleSnoozeTour = () => {
    const until = Date.now() + 30 * 60 * 1000;
    setTourSnoozedUntilMs(until);
    savePersistedState(`devos_se_tour_snooze_${user.email}`, until);
  };

  const handleOpenUrgentPipeline = () => {
    setPipelineTargetFilter('PERLU_DITANGANI');
    openView('pipeline');
  };

  const handleRoleNotifNavigate = (action: RoleNotifAction) => {
    if (action.type === 'profile') {
      openView('profile');
      return;
    }
    if (action.type === 'view') {
      openView(action.target as Parameters<typeof openView>[0]);
      return;
    }
    openDashboardSection(action.target);
  };

  const handleSeNotifNavigate = (target: SeNotifTarget) => {
    setActiveH5Reminder(null);
    if (target === 'export') {
      setIsExportReportModalOpen(true);
      return;
    }
    if (target === 'pipeline') {
      handleOpenUrgentPipeline();
      return;
    }
    openView(target);
  };

  const handleExportDailyReport = async (format: 'pdf' | 'excel') => {
    const itemNotesPayload: Record<string, string> = {};
    items.forEach((r) => {
      if (r.catatan) itemNotesPayload[String(r.id)] = r.catatan;
    });
    const hambatanItem = items.find((r) => r.id === 13);

    try {
      const res = await fetch('/api/se/daily-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.email,
          'X-User-Role': role,
        },
        body: JSON.stringify({
          itemNotes: itemNotesPayload,
          hambatanBantuan: hambatanItem?.catatan || '',
          submittedReport: true,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) {
          setSeRealData(json.data);
        }
      }
    } catch {
      /* tetap lanjut ekspor agar SE tidak terblokir */
    }

    const exportParams = {
      projectName: activeProject.nama,
      seName: user.name,
      seEmail: user.email,
      dateLabel: todayShort,
      scorecardTotal: realScorecardTotal,
      scorecardCategory: realScorecardCategory,
      items: items.map((r) => {
        const st = evalStatus(r);
        return {
          id: r.id,
          cat: r.cat,
          item: r.item,
          target: r.target,
          realisasi: r.realisasi,
          catatan: r.catatan,
          statusLabel:
            st === 'hit'
              ? 'Tercapai'
              : st === 'near'
              ? 'Mendekati'
              : st === 'low'
              ? 'Berjalan'
              : st === 'note'
              ? 'Catatan'
              : 'Belum',
        };
      }),
    };

    if (format === 'excel') {
      exportDailyReportExcel(exportParams);
      setToast('Laporan Harian disimpan ke DB & diekspor ke Excel!');
    } else {
      exportDailyReportPdf(exportParams);
      setToast('Laporan Harian disimpan ke DB & siap cetak/simpan PDF!');
    }
    setIsExportReportModalOpen(false);
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

  const handleEscalationDecision = async (id: string, decision: 'Disetujui' | 'Ditolak') => {
    setEscalations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
    );
    try {
      const token = authSession?.token || loadAuthSession()?.token;
      await fetch('/api/escalations', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, status: decision }),
      });
    } catch {
      /* fallback state lokal */
    }
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

  const direksiSummary = useMemo(() => {
    const list = filteredProjects;
    const totalProjects = list.length;
    const totalTargetNetSales = list.reduce((acc, p) => acc + p.targetNetSales, 0);
    const totalAktualNetSales = list.reduce((acc, p) => acc + p.aktualNetSales, 0);
    const netSalesPct = totalTargetNetSales > 0 ? ((totalAktualNetSales / totalTargetNetSales) * 100).toFixed(1) : '0';

    const totalTargetOmzet = list.reduce((acc, p) => acc + p.targetOmzet, 0);
    const totalAktualOmzet = list.reduce((acc, p) => acc + p.aktualOmzet, 0);
    const omzetPct = totalTargetOmzet > 0 ? ((totalAktualOmzet / totalTargetOmzet) * 100).toFixed(1) : '0';

    const projectNames = list.map((p) => p.nama).join(' · ');

    return {
      totalProjects,
      totalTargetNetSales,
      totalAktualNetSales,
      netSalesPct,
      totalTargetOmzet,
      totalAktualOmzet,
      omzetPct,
      projectNames,
    };
  }, [filteredProjects]);

  const rupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const openView = (view: DashboardView, tab?: string) => {
    setActiveView(view);
    if (view === 'dashboard') {
      setActiveSection('top');
    }
    navigateToView(view, tab);
    setIsMobileMoreOpen(false);
    const mainEl = document.getElementById('dashboard-scroll-container');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitImpersonation = () => {
    const backupSession = loadImpersonatorBackup();
    clearImpersonatorBackup();
    if (backupSession) {
      saveAuthSession(backupSession);
      setAuthSession(backupSession);
      setRole(backupSession.role);
    } else {
      const defaultItSession: AuthSession = {
        role: 'SUPERADMIN_IT',
        email: USERS_BY_ROLE.SUPERADMIN_IT.email,
        name: USERS_BY_ROLE.SUPERADMIN_IT.name,
        loggedInAt: new Date().toISOString(),
      };
      saveAuthSession(defaultItSession);
      setAuthSession(defaultItSession);
      setRole('SUPERADMIN_IT');
    }
    setActiveView('dashboard');
    navigateToView('dashboard');
    setViewMode('dashboard');
    setToast('Kembali ke Dashboard IT Superadmin');
  };

  const handleLogout = () => {
    if (isImpersonating()) {
      handleExitImpersonation();
      return;
    }
    void logoutFromServer();
    clearImpersonatorBackup();
    setAuthSession(null);
    setIsMobileMoreOpen(false);
    setIsNotifPanelOpen(false);
    setShowAssistantGreeting(false);
    setActiveView('dashboard');
    navigateToView('dashboard');
    setViewMode('homepage');
    setToast('Berhasil keluar dari sesi akun');
  };

  const handleMobileTabSelect = (tab: MobileNavTab) => {
    if (tab === 'lainnya') {
      setIsMobileMoreOpen((prev) => !prev);
      return;
    }
    setIsMobileMoreOpen(false);
    if (tab === 'dashboard') openView('dashboard');
    else if (tab === 'jalur') openView('jalur');
    else if (tab === 'riset') openView('riset');
    else if (tab === 'pipeline') openView('pipeline');
    else if (tab === 'rute') openView('rute');
    else if (tab === 'lapangan') openView('lapangan');
  };

  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/p/')) {
    const slug = decodeURIComponent(window.location.pathname.replace(/^\/p\//, '').split('/')[0] || 'the-park-sukoharjo');
    return <PublicProjectSitePage slug={slug} />;
  }

  if (viewMode === 'homepage' || !authSession) {
    const handleEnterDashboard = (chosenRole?: string) => {
      const session = loadAuthSession();
      if (!session) return;
      setAuthSession(session);
      if (chosenRole && chosenRole in USERS_BY_ROLE) {
        setRole(chosenRole as RoleKey);
      } else {
        setRole(session.role);
      }
      setViewMode('dashboard');
      setShowAssistantGreeting(true);
    };

    return <PublicHomepageV3 onEnterDashboard={handleEnterDashboard} />;
  }

  const renderSidebarNav = (onItemClick?: () => void) => {
    const handleItemClick = (action?: () => void) => {
      if (action) action();
      if (onItemClick) onItemClick();
    };

    return (
      <nav className="space-y-1">
        <button
          type="button"
          onClick={() => handleItemClick(() => openDashboardSection('top'))}
          className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
            activeView === 'dashboard' && activeSection === 'top'
              ? 'bg-amber-50 text-terracotta font-bold'
              : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
          }`}
        >
          <LayoutDashboard className="size-4 shrink-0" />
          <span>
            {role === 'REFERRAL_PARTNER'
              ? 'Dashboard Referral'
              : role === 'SALES_PARTNER'
              ? 'Dashboard Sales Mitra'
              : `Dashboard ${role}`}
          </span>
        </button>

        {/* Tampilan Sidebar Khusus Mitra Eksternal (Referral Partner & Sales Partner) */}
        {(role === 'REFERRAL_PARTNER' || role === 'SALES_PARTNER') && (
          <div className="pt-3 border-t border-warmborder space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-warmmuted mb-1.5">
              Portal Mitra Eksternal
            </p>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('kb'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'kb'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Database className="size-4 shrink-0" />
              <span>Brosur &amp; Materi Promo</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('surat_cinta'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'surat_cinta'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <HeartHandshake className="size-4 shrink-0" />
              <span>99 Keunggulan Unit</span>
            </button>
          </div>
        )}

        {!isPlatformSuperadmin && role !== 'DIREKSI' && role !== 'REFERRAL_PARTNER' && (
          <button
            type="button"
            onClick={() => handleItemClick(() => openView('pipeline'))}
            className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
              activeView === 'pipeline'
                ? 'bg-amber-50 text-terracotta font-bold'
                : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
            }`}
          >
            <Users className="size-4 shrink-0" />
            <span>{role === 'SE' ? 'Pipeline' : 'Pipeline & WA AI'}</span>
          </button>
        )}

        {role === 'SE' && (
          <>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('scorecard-bulanan'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'dashboard' && activeSection === 'scorecard-bulanan'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Award className="size-4 shrink-0" />
              <span>Scorecard Bulanan</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('laporan-harian'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'dashboard' && activeSection === 'laporan-harian'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <FileCheck className="size-4 shrink-0" />
              <span>Laporan Harian (13 Item)</span>
            </button>
          </>
        )}

        {role === 'SM' && (
          <>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('unit_park'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'unit_park'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Home className="size-4 shrink-0" />
              <span>{activeProject.totalUnit} Unit {activeProject.nama.split(' ')[0]} {activeProject.nama.split(' ')[1] || ''}</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('kinerja_se'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'kinerja_se'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Users className="size-4 shrink-0" />
              <span>Pantau Kinerja 3 SE</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('vault'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'vault'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Lock className="size-4 shrink-0" />
              <span>Approve Dokumen Vault KPR</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('kpr_bank'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'kpr_bank'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Building2 className="size-4 shrink-0" />
              <span>Monitoring KPR Bank</span>
            </button>
          </>
        )}

        {role === 'DIREKSI' && (
          <>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('portofolio-proyek'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <Building2 className="size-4 shrink-0" />
              <span>Portofolio Proyek</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('eskalasi-persetujuan'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <ShieldAlert className="size-4 shrink-0" />
              <span>Eskalasi Diskon &amp; Refund</span>
            </button>
          </>
        )}

        {role === 'TL' && (
          <>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('live-sla'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <Clock className="size-4 shrink-0" />
              <span>Radar SLA ≤5 Menit</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('aturan-72jam'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <RefreshCw className="size-4 shrink-0" />
              <span>Aturan Pool 72 Jam</span>
            </button>
          </>
        )}

        {role === 'ADMIN' && (
          <>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('booking-pipeline'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Verifikasi Booking H+1</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('vault'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'vault'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Lock className="size-4 shrink-0" />
              <span>Verifikasi Dokumen Vault KPR</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('kpr_bank'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'kpr_bank'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Building2 className="size-4 shrink-0" />
              <span>Pengajuan KPR Multi-Bank</span>
            </button>
          </>
        )}

        {role === 'IT' && (
          <>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('db-schema'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <Database className="size-4 shrink-0" />
              <span>Migrasi Schema devos</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('audit-log'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <ShieldCheck className="size-4 shrink-0" />
              <span>Audit Trail Log 100%</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('knowledge-ai'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <Sparkles className="size-4 shrink-0 text-terracotta" />
              <span>Knowledge AI Terpusat (OCR)</span>
            </button>
          </>
        )}

        {role === 'DIGITAL_MARKETING' && (
          <>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('ad-campaigns'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <Megaphone className="size-4 shrink-0" />
              <span>Kampanye &amp; CPL Iklan</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('se-feedback'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <MessageSquare className="size-4 shrink-0" />
              <span>Umpan Balik Kualitas Lead</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openDashboardSection('ai-ad-optimizer'))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <TrendingUp className="size-4 shrink-0" />
              <span>Optimasi Iklan Otomatis</span>
            </button>
          </>
        )}

        {/* Fitur Manajemen Rekening & Audit Log (SM, Admin, Direksi, IT) */}
        {['SM', 'ADMIN', 'DIREKSI', 'IT'].includes(role) && (
          <div className="pt-3 mt-2 border-t border-warmborder space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-warmmuted mb-1">
              Manajemen Perusahaan
            </p>
            <button
              type="button"
              onClick={() => handleItemClick(() => setIsBankAccountsModalOpen(true))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <Building2 className="size-4 shrink-0 text-terracotta" />
              <span>Rekening Resmi Perusahaan</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => setIsAuditLogsModalOpen(true))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-warmmuted hover:bg-sandstone hover:text-espresso text-left cursor-pointer"
            >
              <History className="size-4 shrink-0 text-espresso" />
              <span>Riwayat Aktivitas Tim</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('org_users'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs font-medium text-left cursor-pointer ${
                activeView === 'org_users'
                  ? 'bg-espresso text-white font-semibold shadow-sm'
                  : 'text-warmmuted hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Users className="size-4 shrink-0 text-terracotta" />
              <span>Kelola User (6 Role)</span>
            </button>
          </div>
        )}

        {/* Alat Kerja Khusus Role SE (Ringkas & Terfokus) */}
        {role === 'SE' && (
          <div className="pt-4 mt-3 border-t border-warmborder">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-warmmuted mb-1.5">
              Alat Kerja Sales
            </p>
            {canReadFeature('content_calendar') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('kalender'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'kalender'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <Calendar className="size-4 shrink-0" />
                <span>Kalender Konten</span>
              </button>
            )}
            {canReadFeature('playbook') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('playbook'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'playbook'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <BookOpen className="size-4 shrink-0" />
                <span>Playbook</span>
              </button>
            )}
            {canReadFeature('daily_route') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('rute'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'rute'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <MapPin className="size-4 shrink-0" />
                <span>Rute Harian Canvassing</span>
              </button>
            )}
            {canReadFeature('field_ops') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('lapangan'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'lapangan'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <PhoneCall className="size-4 shrink-0" />
                <span>Absen, GPS, Call</span>
              </button>
            )}
            {canReadFeature('kb') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('kb'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'kb'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <Database className="size-4 shrink-0" />
                <span>Knowledge Base Produk</span>
              </button>
            )}
            {canReadFeature('surat_cinta') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('surat_cinta'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'surat_cinta'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <HeartHandshake className="size-4 shrink-0" />
                <span>Surat Cinta 99 Keunggulan</span>
              </button>
            )}
            {canReadFeature('vault') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('vault'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'vault'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <Lock className="size-4 shrink-0 text-olive" />
                <span>Dokumen Vault KPR (F74)</span>
              </button>
            )}
            {canReadFeature('referral') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('referral'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'referral'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <Share2 className="size-4 shrink-0 text-terracotta" />
                <span>Program Referral (F79)</span>
              </button>
            )}
            {canReadFeature('garansi') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('garansi'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'garansi'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <Wrench className="size-4 shrink-0 text-warmmuted" />
                <span>Keluhan &amp; Garansi DLP (F86)</span>
              </button>
            )}
            {canReadFeature('kpr_bank') && (
              <button
                type="button"
                onClick={() => handleItemClick(() => openView('kpr_bank'))}
                className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                  activeView === 'kpr_bank'
                    ? 'bg-amber-50 text-terracotta font-bold'
                    : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                }`}
              >
                <Building2 className="size-4 shrink-0 text-olive" />
                <span>Alur KPR Bank (F75)</span>
              </button>
            )}
          </div>
        )}

        {/* Unified Project & Workflow Navigation Items (Role Non-SE, Disembunyikan untuk Direksi, Mitra & Platform Superadmin) */}
        {role !== 'SE' && !isPlatformSuperadmin && role !== 'DIREKSI' && role !== 'REFERRAL_PARTNER' && role !== 'SALES_PARTNER' && (
          <>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('jalur'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'jalur'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Layers className="size-4 shrink-0" />
              <span>Jalur Proyek (8 Tahap)</span>
            </button>

            <button
              type="button"
              onClick={() => handleItemClick(() => openView('riset'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'riset'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Compass className="size-4 shrink-0" />
              <span>Riset Pasar (Radius 25km)</span>
            </button>

            <button
              type="button"
              onClick={() => handleItemClick(() => openView('target'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'target'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <TrendingUp className="size-4 shrink-0" />
              <span>Target Penjualan 100%</span>
            </button>

            <button
              type="button"
              onClick={() => handleItemClick(() => openView('kalender'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'kalender'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Calendar className="size-4 shrink-0" />
              <span>Kalender Konten (30 Hari)</span>
            </button>

            <button
              type="button"
              onClick={() => handleItemClick(() => openView('playbook'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'playbook'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <BookOpen className="size-4 shrink-0" />
              <span>Playbook Sales (SE/TL/SM)</span>
            </button>

            <button
              type="button"
              onClick={() => handleItemClick(() => openView('lapangan'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'lapangan'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <PhoneCall className="size-4 shrink-0" />
              <span>Absen, GPS, Call &amp; AI Guide</span>
            </button>

            <button
              type="button"
              onClick={() => handleItemClick(() => openView('website'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'website'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Globe className="size-4 shrink-0" />
              <span>Website Landing Page</span>
            </button>

            <button
              type="button"
              onClick={() => handleItemClick(() => openView('komisi'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'komisi'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Percent className="size-4 shrink-0" />
              <span>Aturan Komisi Penjualan</span>
            </button>

            <button
              type="button"
              onClick={() => handleItemClick(() => openView('kb'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'kb'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Database className="size-4 shrink-0" />
              <span>Knowledge Base Produk</span>
            </button>

            <button
              type="button"
              onClick={() => handleItemClick(() => openView('surat_cinta'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'surat_cinta'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <HeartHandshake className="size-4 shrink-0" />
              <span>Surat Cinta 99 Keunggulan</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('vault'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'vault'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Lock className="size-4 shrink-0 text-olive" />
              <span>Dokumen Vault KPR (F74)</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('referral'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'referral'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Share2 className="size-4 shrink-0 text-terracotta" />
              <span>Program Referral (F79)</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('garansi'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'garansi'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Wrench className="size-4 shrink-0 text-warmmuted" />
              <span>Keluhan &amp; Garansi DLP (F86)</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('kpr_bank'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'kpr_bank'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <Building2 className="size-4 shrink-0 text-olive" />
              <span>Alur KPR Bank (F75)</span>
            </button>
            <button
              type="button"
              onClick={() => handleItemClick(() => openView('control_tower'))}
              className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                activeView === 'control_tower'
                  ? 'bg-amber-50 text-terracotta font-bold'
                  : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
              }`}
            >
              <TrendingUp className="size-4 shrink-0 text-terracotta" />
              <span>Control Tower Portofolio (F90)</span>
            </button>
          </>
        )}

        {isPlatformSuperadmin && (
          <div className="pt-2 border-t border-warmborder space-y-1">
            {role === 'SUPERADMIN_IT' && (
              <>
                <span className="block px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-warmmuted">
                  Modul Admin Panel IT
                </span>
                <button
                  type="button"
                  onClick={() => handleItemClick(() => openDashboardSection('it-permissions'))}
                  className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    activeView === 'dashboard' && activeSection === 'it-permissions'
                      ? 'bg-amber-50 text-terracotta font-bold'
                      : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                  }`}
                >
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>Permission Fitur</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleItemClick(() => openDashboardSection('it-knowledge'))}
                  className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    activeView === 'dashboard' &&
                    (activeSection === 'it-knowledge' || activeSection === 'knowledge-ai')
                      ? 'bg-amber-50 text-terracotta font-bold'
                      : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                  }`}
                >
                  <Sparkles className="size-4 shrink-0" />
                  <span>Knowledge AI Terpusat</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleItemClick(() => openDashboardSection('it-hierarchy'))}
                  className={`w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    activeView === 'dashboard' && activeSection === 'it-hierarchy'
                      ? 'bg-amber-50 text-terracotta font-bold'
                      : 'text-warmmuted font-medium hover:bg-sandstone hover:text-espresso'
                  }`}
                >
                  <Database className="size-4 shrink-0" />
                  <span>Hierarki Tenant &amp; Support</span>
                </button>
              </>
            )}
            <span className="block px-3.5 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-terracotta">
              Platform Internal Developer Sales OS
            </span>
            <button
              type="button"
              onClick={() => handleItemClick(() => setShowSuperadminModal(true))}
              className="w-full flex items-center gap-3 h-10 px-3.5 rounded-xl text-xs text-left transition-colors cursor-pointer bg-amber-500/10 text-terracotta font-extrabold border border-amber-300/60"
            >
              <ShieldCheck className="size-4 shrink-0 text-terracotta" />
              <span>Panel Superadmin Multi-Tenant</span>
            </button>
          </div>
        )}
      </nav>
    );
  };

  return (
    <div className="min-h-screen md:h-[100dvh] md:overflow-hidden md:flex bg-sandstone text-espresso font-sans antialiased min-h-0">
      {/* Sidebar Desktop (Fixed 100dvh, Top/Bottom pinned, Nav scrollable) */}
      <aside
        aria-label="Sidebar Navigasi Dasbor"
        className="hidden md:flex md:w-64 md:shrink-0 md:flex-col h-[100dvh] bg-white border-r border-warmborder z-30 min-h-0"
      >
        {/* Top Fixed Section */}
        <div className="shrink-0 px-5 pt-5 pb-3 border-b border-warmborder/60 min-h-0">
          {/* Back to Public Homepage */}
          <button
            onClick={() => setViewMode('homepage')}
            className="w-full mb-3 py-1.5 px-3 rounded-xl bg-sandstone hover:bg-warmborder text-[11px] font-bold text-espresso flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-warmborder"
          >
            <span>&larr; Beranda Publik</span>
          </button>

          {/* Logo & OS Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-warmborder">
            <div className="size-9 rounded-xl bg-terracotta text-white grid place-items-center font-extrabold text-sm shadow-sm shrink-0">
              OS
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm tracking-tight text-espresso truncate">Developer Sales OS</p>
              <p className="text-[10px] text-warmmuted truncate">Multi-Tenant Ecosystem</p>
            </div>
          </div>

          {/* Universal Project Switcher untuk Akun Developer Klien vs Badge Platform untuk Superadmin */}
          <div className="mt-3">
            {!isPlatformSuperadmin ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-warmmuted">
                    Proyek Aktif
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(true)}
                    className="text-[10px] font-bold text-terracotta hover:underline flex items-center gap-0.5 cursor-pointer"
                    title="Tambah Proyek Baru"
                  >
                    <Plus className="size-3" /> Tambah
                  </button>
                </div>
                <div className="relative">
                  <select
                    aria-label="Pilih Proyek Aktif di Sidebar"
                    value={activeProjectId}
                    onChange={(e) => handleSelectProject(e.target.value)}
                    className="w-full h-9 pl-8 pr-7 rounded-xl border border-warmborder bg-sandstone hover:bg-sandstone/80 text-xs font-bold text-espresso appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-terracotta transition-colors"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.nama} ({proj.tipe})
                      </option>
                    ))}
                  </select>
                  <Building2 className="size-3.5 text-terracotta absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <ChevronDown className="size-3.5 text-warmmuted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-terracotta">
                    Cakupan Akses
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-terracotta text-white">
                    Global Core
                  </span>
                </div>
                <p className="text-[11px] font-bold text-espresso flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">Lintas Semua Developer</span>
                </p>
              </div>
            )}
          </div>

          {/* Quick Action Button */}
          {role === 'SE' && (
            <button
              onClick={() => openView('pipeline')}
              className="mt-3 w-full h-9 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-espresso/90 cursor-pointer shadow-sm"
            >
              <Plus className="size-3.5 text-amber-400" />
              <span>Input Lead &amp; Pipeline</span>
            </button>
          )}

          {role === 'DIGITAL_MARKETING' && (
            <button
              onClick={() => setToast('Form Input Biaya Iklan Harian dibuka')}
              className="mt-3 w-full h-9 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-espresso/90 cursor-pointer shadow-sm"
            >
              <Plus className="size-3.5 text-amber-400" />
              <span>Input Biaya Iklan (CPL)</span>
            </button>
          )}

          {role === 'SM' && (
            <button
              onClick={() => {
                setEditingUnit(null);
                setShowUnitModal(true);
              }}
              className="mt-3 w-full h-9 rounded-xl bg-terracotta text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-terracotta/90 cursor-pointer shadow-sm"
            >
              <Plus className="size-3.5 text-white" />
              <span>Tambah Unit Proyek</span>
            </button>
          )}

          {role === 'DIREKSI' && (
            <button
              onClick={() => setToast('Laporan Konsolidasi Portofolio di-refresh')}
              className="mt-3 w-full h-9 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-espresso/90 cursor-pointer"
            >
              <TrendingUp className="size-3.5 text-amber-400" />
              <span>Proyeksi Akhir Bulan</span>
            </button>
          )}

          {isPlatformSuperadmin && (
            <button
              onClick={() => setShowSuperadminModal(true)}
              className="mt-3 w-full h-9 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-terracotta/90 cursor-pointer shadow-sm"
            >
              <Sparkles className="size-3.5 text-white" />
              <span>Superadmin Multi-Tenant</span>
            </button>
          )}
        </div>

        {/* Scrollable Navigation List (scrollbar disembunyikan agar rapi) */}
        <div
          data-lenis-prevent
          tabIndex={0}
          className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3 space-y-1 focus:outline-none overscroll-contain"
        >
          {renderSidebarNav()}
        </div>

        {/* User Badge Footer (Fixed shrink-0) */}
        <div className="shrink-0 p-4 border-t border-warmborder bg-white min-h-0">
          <div className="rounded-2xl bg-sandstone p-3 border border-warmborder">
            <button
              type="button"
              onClick={() => openView('profile')}
              className="w-full text-left flex items-center gap-2.5 rounded-xl p-1 -m-1 hover:bg-white/70 transition-colors cursor-pointer"
              title="Buka Pengaturan Profil & 2FA TOTP"
            >
              <div className="size-8 rounded-lg bg-espresso text-white grid place-items-center text-xs font-bold shrink-0">
                {user.avatarText}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-espresso truncate">{user.name}</p>
                <p className="text-[10px] text-warmmuted truncate">{user.roleLabel} · Profil &amp; 2FA</p>
              </div>
            </button>
            <div className="mt-2 pt-2 border-t border-warmborder flex items-center justify-between text-[10px] text-warmmuted">
              <span className="font-semibold text-terracotta">{user.role}</span>
              <span className="truncate max-w-[120px] font-semibold text-espresso">
                {isPlatformSuperadmin ? 'Developer Sales OS' : activeProject.nama}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={`mt-2.5 w-full h-8 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                isImpersonating()
                  ? 'bg-amber-400 hover:bg-amber-300 text-espresso border-amber-500 font-black shadow-xs'
                  : 'bg-white hover:bg-rose-50 text-espresso hover:text-rose-700 border-warmborder hover:border-rose-200'
              }`}
            >
              {isImpersonating() ? (
                <>
                  <ArrowRight className="size-3.5 rotate-180" />
                  <span>Kembali ke IT Superadmin</span>
                </>
              ) : (
                <>
                  <LogOut className="size-3.5" />
                  <span>Keluar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Separately scrollable in desktop) */}
      <main
        id="dashboard-scroll-container"
        className="flex-1 min-w-0 md:h-[100dvh] md:overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12 min-h-0 focus:outline-none"
      >
        {/* Sticky Impersonation Banner untuk Bantuan IT */}
        {isImpersonating() && (
          <div className="bg-espresso text-white px-4 py-2.5 border-b-2 border-amber-400 flex items-center justify-between z-30 sticky top-0 shadow-md">
            <div className="flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full bg-amber-400 shrink-0" />
              <strong className="text-amber-300 font-semibold tracking-wide">Mode Bantuan IT Aktif:</strong>
              <span className="text-stone-300 hidden sm:inline">
                Mengakses dashboard sebagai <strong>{user.name}</strong> ({user.roleLabel}) &middot; Proyek: {activeProject.nama}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExitImpersonation}
              className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-espresso font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <ArrowRight className="size-3.5 rotate-180" />
              <span>Kembali ke IT Superadmin</span>
            </button>
          </div>
        )}

        {/* Header Desktop */}
        <header className="hidden md:flex items-center justify-between gap-3 px-4 lg:px-8 py-3.5 lg:py-5 bg-white border-b border-warmborder sticky top-0 z-20">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg lg:text-xl font-extrabold text-espresso tracking-tight truncate">Developer Sales OS</h1>
              <span className="text-[11px] lg:text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-terracotta border border-amber-200 shrink-0">
                {role === 'REFERRAL_PARTNER'
                  ? 'Portal Referral Partner'
                  : role === 'SALES_PARTNER'
                  ? 'Portal Sales Partner'
                  : `Dashboard ${role}`} · {user.roleLabel}
              </span>
            </div>
            <p className="text-xs text-warmmuted mt-0.5 truncate">
              {today} ·{' '}
              {isPlatformSuperadmin ? (
                <span className="font-semibold text-terracotta">
                  Cakupan Seluruh Developer &amp; Proyek Platform
                </span>
              ) : (
                <>
                  <span className="font-semibold text-espresso">{activeProject.nama}</span> ({activeProject.tipe})
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Universal Project Pill Dropdown & Tambah Proyek Button persis di sebelahnya (Klien Developer) vs Panel Superadmin (Superadmin) */}
            {!isPlatformSuperadmin ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="relative">
                  <select
                    aria-label="Pilih Proyek Aktif"
                    value={activeProjectId}
                    onChange={(e) => handleSelectProject(e.target.value)}
                    className="h-10 pl-8 pr-7 sm:pr-8 rounded-xl border border-warmborder bg-sandstone hover:bg-sandstone/80 text-xs font-bold text-espresso appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-terracotta transition-colors shadow-sm max-w-[130px] sm:max-w-[170px] lg:max-w-[220px] truncate"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.nama} ({proj.tipe})
                      </option>
                    ))}
                  </select>
                  <Building2 className="size-4 text-terracotta absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <ChevronDown className="size-4 text-warmmuted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(true)}
                  className="h-10 px-2.5 sm:px-3.5 rounded-xl bg-terracotta text-white hover:bg-terracotta/90 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer shrink-0"
                  title="Tambah Proyek Baru"
                >
                  <Plus className="size-4 shrink-0" />
                  <span className="hidden xl:inline">Tambah Proyek</span>
                  <span className="hidden sm:inline xl:hidden">Proyek</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSuperadminModal(true)}
                className="h-10 px-3.5 rounded-xl bg-amber-500/10 border border-amber-300/80 hover:bg-amber-500/20 text-terracotta text-xs font-extrabold flex items-center gap-2 transition-colors shadow-xs cursor-pointer shrink-0"
                title="Buka Panel Superadmin Multi-Tenant"
              >
                <ShieldCheck className="size-4 text-terracotta shrink-0" />
                <span className="hidden sm:inline">Panel Multi-Tenant Core</span>
              </button>
            )}
            {role === 'SE' ? (
              <div className="shrink-0">
                <SeNotificationBell
                  quickStatus={seRealData?.quickStatus}
                  extra={{
                    leadsTodayValidCount: seRealData?.metrics?.leadsTodayValidCount,
                    needsCompletionLeadsCount: seRealData?.metrics?.needsCompletionLeadsCount,
                    waConnectionStatus: seRealData?.metrics?.waConnectionStatus,
                    totpEnabled: Boolean(authSession?.totpEnabled),
                  }}
                  externalOpen={isNotifPanelOpen}
                  onExternalOpenChange={setIsNotifPanelOpen}
                  onNavigateTarget={handleSeNotifNavigate}
                  onH5ReminderTriggered={(item) => setActiveH5Reminder(item)}
                />
              </div>
            ) : (
              <RoleNotificationBell
                role={role}
                summary={realSummary}
                escalations={escalations}
                totpEnabled={Boolean(authSession?.totpEnabled)}
                externalOpen={isNotifPanelOpen}
                onExternalOpenChange={setIsNotifPanelOpen}
                onNavigateAction={handleRoleNotifNavigate}
              />
            )}
            <div className="hidden lg:flex items-center gap-2 bg-sandstone px-3 py-1.5 rounded-xl border border-warmborder text-xs shrink-0">
              <span className="size-2 rounded-full bg-olive shrink-0"></span>
              <span className="font-semibold text-espresso">Online</span>
              <span className="text-warmmuted text-[11px] hidden xl:inline">({user.name})</span>
            </div>
          </div>
        </header>

        {/* Mobile Header (Ringkas, navigasi utama di Bottom Bar) */}
        <header className="md:hidden px-4 py-3 bg-white border-b border-warmborder sticky top-0 z-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-xl bg-terracotta text-white grid place-items-center font-extrabold text-xs shrink-0">
              OS
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta leading-none truncate">
                {isPlatformSuperadmin ? 'Developer Sales OS Platform' : activeProject.nama}
              </p>
              <h1 className="text-sm font-extrabold text-espresso leading-tight truncate">
                Dashboard {role}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {role === 'SE' ? (
              <SeNotificationBell
                quickStatus={seRealData?.quickStatus}
                extra={{
                  leadsTodayValidCount: seRealData?.metrics?.leadsTodayValidCount,
                  needsCompletionLeadsCount: seRealData?.metrics?.needsCompletionLeadsCount,
                  waConnectionStatus: seRealData?.metrics?.waConnectionStatus,
                  totpEnabled: Boolean(authSession?.totpEnabled),
                }}
                onNavigateTarget={handleSeNotifNavigate}
              />
            ) : (
              <RoleNotificationBell
                role={role}
                summary={realSummary}
                escalations={escalations}
                totpEnabled={Boolean(authSession?.totpEnabled)}
                externalOpen={isNotifPanelOpen}
                onExternalOpenChange={setIsNotifPanelOpen}
                onNavigateAction={handleRoleNotifNavigate}
              />
            )}
            <button
              type="button"
              onClick={() => openView('profile')}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-sandstone text-espresso border border-warmborder shrink-0 cursor-pointer"
            >
              {user.name.split(' ')[0]}
            </button>
          </div>
        </header>

        <div id="dashboard-main" className="max-w-6xl mx-auto px-4 pt-4 md:px-8 md:pt-8 space-y-6">
          {/* HALAMAN PENUH UNTUK SETIAP MODUL (Bukan Modal/Popup) */}
          {activeView === 'profile' && (
            <ProfilePage
              onTotpStatusChanged={(enabled) =>
                setAuthSession((prev) => (prev ? { ...prev, totpEnabled: enabled } : prev))
              }
            />
          )}
          {activeView === 'pipeline' && (
            <PipelinePage
              user={user}
              role={role}
              initialFilter={pipelineTargetFilter}
              onDataChanged={fetchSeRealDashboard}
            />
          )}

          {activeView === 'jalur' && (
            <JalurProyek
              variant="page"
              projectName={activeProject.nama}
              project={activeProject}
              userRole={role}
              onOpenStage={(stageKey) => {
                if (stageKey === 'surat_cinta_99') openView('surat_cinta');
                else if (stageKey === 'riset_pasar') openView('riset');
                else if (stageKey === 'target_penjualan') openView('target');
                else if (stageKey === 'kalender_konten') openView('kalender');
                else if (stageKey === 'playbook') openView('playbook');
                else if (stageKey === 'rute_harian') openView('rute');
                else if (stageKey === 'website_landing') openView('website');
                else if (stageKey === 'crm_pipeline') openView('crm');
              }}
            />
          )}

          {activeView === 'riset' && (
            <MarketResearchViewer
              variant="page"
              projectId={activeProject.id}
              projectName={activeProject.nama}
              userRole={role}
            />
          )}

          {activeView === 'target' && (
            <SalesTargetViewer
              variant="page"
              projectId={activeProject.id}
              projectName={activeProject.nama}
              totalUnits={activeProject.totalUnit}
              avgPriceIdr={
                activeProject.id === 'andara-village'
                  ? 550000000
                  : activeProject.id === 'griya-andara-asri'
                  ? 185000000
                  : 900000000
              }
              seHeadcount={3}
              userRole={role}
              onScenarioChange={(newScenario) => {
                setActiveScenario(newScenario);
                setToast(`Skenario target proyek diperbarui ke "${newScenario.toUpperCase()}". Ritme kerja SE telah disesuaikan.`);
              }}
            />
          )}

          {activeView === 'kalender' && (
            <ContentCalendarViewer
              variant="page"
              projectId={activeProject.id}
              projectName={activeProject.nama}
              userEmail={user.email}
              userRole={role}
              onDataChanged={fetchSeRealDashboard}
            />
          )}

          {activeView === 'playbook' && (
            <PlaybookViewer
              variant="page"
              projectId={activeProject.id}
              projectName={activeProject.nama}
              userRole={role}
            />
          )}

          {activeView === 'rute' && (
            <DailyRouteViewer
              variant="page"
              projectId={activeProject.id}
              projectName={activeProject.nama}
              userEmail={user.email}
              userRole={role}
            />
          )}

          {activeView === 'lapangan' && (
            <FieldOpsModal
              variant="page"
              projectId={activeProject.id}
              project={activeProject}
              projectName={activeProject.nama}
              currentSeName={user.name}
              userEmail={user.email}
              userRole={role}
              userProfile={user}
              hideAiGuide={role === 'SE'}
              planCode={effectivePlanCode}
              onDataChanged={fetchSeRealDashboard}
              onUpgradeRequest={() => {
                setViewMode('homepage');
                setToast('Beralih ke halaman paket untuk konsultasi upgrade Platinum / Diamond');
              }}
            />
          )}

          {activeView === 'website' && (
            <ProjectWebsitePreview
              variant="page"
              projectId={activeProject.id}
              projectName={activeProject.nama}
              project={activeProject}
              onLeadCaptured={() => {
                setToast('Lead baru berhasil tersimpan ke CRM Proyek!');
              }}
            />
          )}

          {activeView === 'crm' && (
            <CrmPipelineView
              variant="page"
              projectId={activeProject.id}
              projectName={activeProject.nama}
              userRole={role}
            />
          )}

          {activeView === 'komisi' && (
            <CommissionSettingsModal
              variant="page"
              onSaved={() => setToast('Aturan komisi berhasil diperbarui')}
            />
          )}

          {activeView === 'kb' && (
            <KnowledgeBaseViewer
              projectId={activeProject.id}
              projectName={activeProject.nama}
            />
          )}

          {activeView === 'surat_cinta' && (
            <LoveLetterViewerModal
              variant="page"
              isOpen={true}
              projectId={activeProject.id}
              projectName={activeProject.nama}
              onClose={() => openView('dashboard')}
            />
          )}

          {activeView === 'vault' && (
            <SecureDocumentVaultPage
              projectName={activeProject.nama}
              projectId={activeProject.id}
              userRole={role}
            />
          )}

          {activeView === 'referral' && (
            <ReferralProgramPage
              projectName={activeProject.nama}
              projectId={activeProject.id}
              userRole={role}
            />
          )}

          {activeView === 'garansi' && (
            <CustomerComplaintsPage
              projectName={activeProject.nama}
              projectId={activeProject.id}
              userRole={role}
            />
          )}

          {activeView === 'kpr_bank' && (
            <BankSubmissionWorkflowPage
              projectName={activeProject.nama}
              projectId={activeProject.id}
              userRole={role}
            />
          )}

          {activeView === 'control_tower' && (
            <ExecutiveControlTowerPage
              userRole={role}
            />
          )}

          {activeView === 'org_users' && (
            <OrgUserManagementPage
              projectId={activeProject.id}
              projectName={activeProject.nama}
            />
          )}

          {/* ========================================================================= */}
          {/* ROLE: REFERRAL PARTNER & SALES PARTNER DASHBOARD VIEW */}
          {/* ========================================================================= */}
          {activeView === 'dashboard' && (role === 'REFERRAL_PARTNER' || role === 'SALES_PARTNER') && (
            <ReferralProgramPage
              projectName={activeProject.nama}
              projectId={activeProject.id}
              userRole={role}
            />
          )}

          {/* ========================================================================= */}
          {/* ROLE 1: SALES EXECUTIVE (SE) DASHBOARD */}
          {/* ========================================================================= */}
          {activeView === 'dashboard' && role === 'SE' && (
            <>
              {/* Tindakan Hari Ini (Mobile Priority Card) */}
              <SeMobileActionCard
                hits={hits}
                totalItems={items.filter((r) => r.targetNum !== null).length}
                onJumpToReport={() => {
                  openDashboardSection('laporan-harian');
                }}
                onExportReport={() => setIsExportReportModalOpen(true)}
              />

              {/* Top Split KPI Card & Monthly Revenue */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
                <div className="lg:col-span-4 bg-espresso text-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      {p.label}
                    </span>
                    <div className="inline-flex rounded-lg bg-white/10 p-0.5">
                      {(['harian', 'minggu', 'bulan'] as PeriodKey[]).map((pr) => (
                        <button
                          key={pr}
                          onClick={() => setPeriod(pr)}
                          className={`min-h-[36px] md:min-h-0 px-3 py-1.5 md:px-2.5 md:py-1 text-xs rounded-md transition-all cursor-pointer ${
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

                  <div className="my-4 sm:my-5 flex items-center gap-4 sm:gap-5">
                    <div className="relative size-22 sm:size-28 shrink-0 grid place-items-center">
                      <svg viewBox="0 0 120 120" className="size-22 sm:size-28 -rotate-90">
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
                        <p className="text-[11px] text-white/60 mt-1">/ {p.maxScore}</p>
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
                    Scorecard Bulanan Real: <strong className="text-white">{realScorecardTotal} Poin ({realScorecardCategory})</strong>
                  </p>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-4 md:gap-5">
                  {/* 3 Kartu Ringkasan Sebaris di Mobile & Desktop (grid-cols-3) */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => openView('pipeline')}
                      className="bg-white border border-warmborder hover:border-terracotta rounded-2xl p-2.5 sm:p-4 shadow-sm flex flex-col justify-between text-left cursor-pointer transition-colors min-w-0"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold text-warmmuted truncate">
                          <span className="sm:hidden">Lead Baru</span>
                          <span className="hidden sm:inline">{activePeriodData.leadCardTitle}</span>
                        </p>
                        <p className="text-base sm:text-2xl font-extrabold tabular-nums text-espresso mt-1 truncate">
                          {activePeriodData.leadsCount}
                          <span className="text-[10px] sm:text-xs font-normal text-warmmuted">
                            /{activePeriodData.leadsTarget}
                          </span>
                        </p>
                      </div>
                      <p className="text-[9px] sm:text-[11px] font-semibold text-olive mt-2 pt-1.5 border-t border-warmborder/60 truncate">
                        {activePeriodData.leadsSubtext}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => openView('pipeline')}
                      className="bg-white border border-warmborder hover:border-terracotta rounded-2xl p-2.5 sm:p-4 shadow-sm flex flex-col justify-between text-left cursor-pointer transition-colors min-w-0"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold text-warmmuted truncate">
                          <span className="sm:hidden">BANT ≥ 7</span>
                          <span className="hidden sm:inline">Prospek BANT ≥ 7 &amp; Hot</span>
                        </p>
                        <p className="text-base sm:text-2xl font-extrabold tabular-nums text-terracotta mt-1 truncate">
                          {seRealData?.metrics?.qualifiedProspectsCount ?? 0}
                          <span className="hidden sm:inline text-sm font-bold"> Prospek</span>
                        </p>
                      </div>
                      <p className="text-[9px] sm:text-[11px] font-semibold text-warmmuted mt-2 pt-1.5 border-t border-warmborder/60 truncate">
                        {seRealData?.metrics?.hotProspectsCount ?? 0} Hot · {seRealData?.metrics?.warmProspectsCount ?? 0} Warm
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => openView('pipeline')}
                      className="bg-white border border-warmborder hover:border-terracotta rounded-2xl p-2.5 sm:p-4 shadow-sm flex flex-col justify-between text-left cursor-pointer transition-colors min-w-0"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold text-warmmuted truncate">
                          <span className="sm:hidden">WA &amp; SLA</span>
                          <span className="hidden sm:inline">Interaksi WA &amp; SLA ≤ 5m</span>
                        </p>
                        <p className="text-base sm:text-2xl font-extrabold tabular-nums text-espresso mt-1 truncate">
                          {seRealData?.metrics?.totalWaInteractions ?? 0}
                          <span className="text-[10px] sm:text-xs font-semibold text-olive">
                            {' '}· {seRealData?.metrics?.waSlaCompliancePercent ?? 100}%
                          </span>
                        </p>
                      </div>
                      <p className="text-[9px] sm:text-[11px] font-semibold text-warmmuted mt-2 pt-1.5 border-t border-warmborder/60 flex items-center justify-between gap-1 min-w-0">
                        <span className="hidden sm:inline truncate">
                          {seRealData?.metrics?.waInboundMessages ?? 0} Masuk · {seRealData?.metrics?.waOutboundMessages ?? 0} Balas
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold truncate ${
                            seRealData?.metrics?.waConnectionStatus === 'CONNECTED'
                              ? 'bg-lime-100 text-olive'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {seRealData?.metrics?.waConnectionStatus === 'CONNECTED'
                            ? 'WA Aktif'
                            : 'WA Putus'}
                        </span>
                      </p>
                    </button>
                  </div>

                  <div className="bg-white border border-warmborder rounded-2xl p-5 flex-1 flex flex-col justify-between shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-warmmuted">
                          Closing Terverifikasi (Net Sales Real dari Pipeline)
                        </p>
                        <p className="text-2xl font-extrabold tabular-nums text-espresso mt-1">
                          {rupiah(seRealData?.metrics?.netSalesRevenueIdr ?? 0)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-terracotta border border-amber-200">
                          Potensi Pipeline Aktif: {rupiah(seRealData?.metrics?.activePipelineValueIdr ?? 0)} (
                          {seRealData?.metrics?.totalValidLeadsCount ?? 0} Lead)
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-lime-100 text-olive">
                          {Math.min(
                            100,
                            Math.round(
                              ((seRealData?.metrics?.netSalesRevenueIdr ?? 0) /
                                (seRealData?.metrics?.monthlyTargetRevenueIdr || 1700000000)) *
                                100
                            )
                          )}
                          % Target Omzet
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 h-2.5 rounded-full bg-sandstone overflow-hidden">
                      <div
                        className="h-full bg-terracotta rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((seRealData?.metrics?.netSalesRevenueIdr ?? 0) /
                                (seRealData?.metrics?.monthlyTargetRevenueIdr || 1700000000)) *
                                100
                            )
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-warmborder flex flex-wrap items-center justify-between gap-2 text-xs text-warmmuted">
                      <span>
                        <strong className="text-espresso">{seRealData?.metrics?.totalValidLeadsCount ?? 0}</strong> Lead Valid ·{' '}
                        <strong className="text-espresso">{seRealData?.metrics?.qualifiedProspectsCount ?? 0}</strong> Terkualifikasi (BANT ≥ 7) ·{' '}
                        <strong className="text-espresso">{seRealData?.metrics?.visitsCount ?? 0}</strong> Kunjungan ·{' '}
                        <strong className="text-espresso">{seRealData?.metrics?.bookingsCount ?? 0}</strong> Booking ·{' '}
                        <strong className="text-espresso">{seRealData?.metrics?.netSalesCount ?? 0}</strong> Net Sales
                        {(seRealData?.metrics?.needsCompletionLeadsCount ?? 0) > 0 && (
                          <span className="text-terracotta font-semibold">
                            {' '}· {seRealData?.metrics?.needsCompletionLeadsCount} Perlu Dilengkapi
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => openView('pipeline')}
                        className="font-bold text-terracotta hover:underline cursor-pointer"
                      >
                        Buka Pipeline &amp; WA AI &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Scorecard Bulanan */}
              <section
                id="scorecard-bulanan"
                className="scroll-mt-24 bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-5 border-b border-warmborder flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-bold text-espresso">Scorecard Bulanan Berbobot (SOP Playbook §6.4)</h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-terracotta tabular-nums">
                        {realScorecardTotal} Poin
                      </span>
                    </div>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Dihitung otomatis dari data real database: Booking 35%, Net Sales 20%, Kunjungan 15%, Prospek 10%, Kepatuhan 10%, CRM &amp; SLA 5%, Referral 5%.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-olive bg-lime-100 px-3 py-1 rounded-lg">
                    Kategori: {realScorecardCategory}
                  </span>
                </div>

                {/* Mobile Card List (< md) */}
                <SeMobileScorecardList rows={realScorecardRows} />

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        <th className="py-3 px-5">Komponen KPI</th>
                        <th className="py-3 px-4">Bobot</th>
                        <th className="py-3 px-4">Target</th>
                        <th className="py-3 px-4">Realisasi SE (Otomatis)</th>
                        <th className="py-3 px-5 text-right">Poin Capaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder text-sm">
                      {realScorecardRows.map((s: any) => (
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
              <section
                id="laporan-harian"
                className="scroll-mt-24 bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-4 sm:p-5 border-b border-warmborder flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-extrabold text-espresso">
                        Laporan Harian SE
                      </h2>
                      <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-terracotta">
                        {hits}/{items.filter((r) => r.targetNum !== null).length} Target Hit
                      </span>
                    </div>
                    <p className="hidden sm:block text-xs text-warmmuted mt-0.5">
                      Tersinkron otomatis dari Pipeline &amp; aktivitas SE di database PostgreSQL sales_os. Kirim sebelum pukul 18.00 WIB.
                    </p>
                  </div>

                  <div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2">
                    {[
                      { key: 'all', label: 'Semua' },
                      { key: 'outreach', label: 'Outreach' },
                      { key: 'prospek', label: 'Prospek' },
                      { key: 'closing', label: 'Closing' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key as 'all' | Category)}
                        className={`min-h-[38px] md:min-h-[36px] px-2 md:px-3 rounded-xl md:rounded-lg text-[11px] sm:text-xs font-bold shrink-0 cursor-pointer transition-all whitespace-nowrap ${
                          filter === f.key ? 'bg-espresso text-white' : 'bg-sandstone text-warmmuted hover:text-espresso'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Card List (< md) */}
                <SeMobileDailyReportList
                  items={list}
                  evalStatus={evalStatus}
                  renderBadge={(status) => <StatusBadge status={status} />}
                  onUpdateItem={updateItem}
                  renderCustomRealisasi={renderActivityCounterControls}
                />

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        <th className="py-3 px-5 w-[30%]">Item Laporan</th>
                        <th className="py-3 px-4 w-[10%]">Target</th>
                        <th className="py-3 px-4 w-[26%]">Realisasi (Database Real)</th>
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
                            {[2, 4, 5].includes(r.id) ? (
                              <div className="p-2 rounded-lg border border-warmborder bg-sandstone/60 space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-extrabold text-espresso tabular-nums">
                                  <span>{r.realisasi}</span>
                                  <span className="text-[10px] font-semibold text-terracotta uppercase">Input DB</span>
                                </div>
                                {renderActivityCounterControls(r)}
                              </div>
                            ) : (
                              <div className="min-h-9 px-3 py-1.5 rounded-lg border border-warmborder bg-sandstone/60 flex items-center justify-between gap-2 text-xs font-extrabold text-espresso tabular-nums">
                                <span>{r.realisasi}</span>
                                <span className="text-[10px] font-semibold text-warmmuted uppercase shrink-0">Auto DB</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              value={r.catatan}
                              placeholder="Catatan / hambatan..."
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

                <div className="p-3.5 sm:p-4 bg-sandstone/60 border-t border-warmborder grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await fetchSeRealDashboard();
                      setToast('Data Laporan Harian & Scorecard disinkronkan dari database!');
                    }}
                    className="min-h-[44px] sm:min-h-0 px-3 sm:px-0 rounded-xl sm:rounded-none bg-white sm:bg-transparent border sm:border-0 border-warmborder text-xs font-bold text-terracotta hover:text-espresso flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="size-3.5 shrink-0" />
                    <span className="sm:hidden">Sinkronkan DB</span>
                    <span className="hidden sm:inline">Sinkronkan Data Real Database</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExportReportModalOpen(true)}
                    className="min-h-[44px] sm:min-h-[40px] px-4 sm:px-5 rounded-xl bg-terracotta text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:bg-terracotta/90"
                  >
                    <Download className="size-3.5 shrink-0" />
                    <span>Export Laporan</span>
                  </button>
                </div>
              </section>
            </>
          )}

          {/* ========================================================================= */}
          {/* ROLE 2: TEAM LEADER (TL) DASHBOARD (AI SM/TL & HUMAN SUPERVISOR) */}
          {/* ========================================================================= */}
          {activeView === 'dashboard' && role === 'TL' && (
            <div className="space-y-6">
              {/* AI Morning Huddle Banner */}
              <div className="bg-espresso text-white rounded-2xl p-6 border border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      AI Morning Huddle 07.25
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
                <div className="p-5 border-b border-warmborder flex flex-wrap items-center justify-between gap-3">
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
                  {(realSummary?.liveSlaLeads?.length ? realSummary.liveSlaLeads.map((l: any) => ({
                    id: l.id,
                    namaLead: l.namaLead,
                    sumber: l.tahap,
                    noWa: '-',
                    assignedSe: l.seNama,
                    menitBerjalan: l.durasiMenit,
                    status: l.statusSla === 'aman' ? 'Aman' : l.statusSla === 'warning_sla' ? 'Peringatan 5 Mnt' : 'Dialihkan Pool',
                  })) : LIVE_SLA_LEADS).map((l: any) => (
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Aturan Pool Lead 72 Jam (Playbook §6.5)</h3>
                    <p className="text-xs text-warmmuted mt-1">
                      Lead yang tidak dihubungi dalam 72 jam otomatis lepas dari SE dan masuk ke Pool Umum untuk dibagikan kembali.
                    </p>
                  </div>
                  <button
                    onClick={() => setToast('Fungsi kembalikan_lead_72jam() dieksekusi')}
                    className="px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-espresso flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
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
          {/* ROLE 3: SALES MANAGER (SM) DASHBOARD (EXECUTIVE OVERVIEW) */}
          {/* ========================================================================= */}
          {activeView === 'dashboard' && role === 'SM' && (
            <div className="space-y-6">
              {/* Info Banner SM */}
              <div className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-terracotta text-white">
                      SM Semi-AI
                    </span>
                    <h2 className="text-lg font-bold text-espresso">Dashboard Sales Manager</h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-terracotta border border-amber-200">
                      {isPlatformSuperadmin ? 'Developer Sales OS Platform' : activeProject.nama} Sukoharjo
                    </span>
                  </div>
                  <p className="text-xs text-warmmuted mt-1">
                    Ringkasan eksekutif penjualan 30 unit (Nagoya, Osaka, Tokyo), supervisi kinerja tim SE binaan, dan monitoring pipeline WhatsApp AI.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openView('org_users')}
                    className="px-3.5 py-2.5 rounded-xl bg-terracotta text-white hover:bg-terracotta/90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Users className="size-4" /> Kelola User (6 Role)
                  </button>
                  <button
                    onClick={() => setIsBankAccountsModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-terracotta border border-amber-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Building2 className="size-4" /> Rekening Resmi
                  </button>
                  <button
                    onClick={() => setIsAuditLogsModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                  >
                    <History className="size-4" /> Riwayat Aktivitas Tim
                  </button>
                  <button
                    onClick={() => openView('unit_park')}
                    className="px-4 py-2.5 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center gap-2 hover:bg-espresso/90 cursor-pointer shrink-0 shadow-sm"
                  >
                    <Home className="size-4 text-amber-400" /> Buka 30 Unit Proyek
                  </button>
                  <button
                    onClick={() => openView('kinerja_se')}
                    className="px-4 py-2.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Users className="size-4 text-terracotta" /> Pantau 3 SE
                  </button>
                </div>
              </div>

              {/* KPI Cards Ringkasan Eksekutif SM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Total Inventori</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">30 Unit</p>
                  <p className="text-[11px] text-warmmuted mt-1">
                    {units.filter((u) => u.status === 'tersedia').length} Tersedia · {units.filter((u) => u.status === 'booking').length} Booking · {units.filter((u) => u.status === 'terjual').length} Terjual
                  </p>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Tim SE Binaan</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">3 Orang Aktif</p>
                  <p className="text-[11px] text-olive font-semibold mt-1">Zona A, C, dan D</p>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Rata Respon Pesan</p>
                  <p className="text-2xl font-extrabold text-olive mt-1">5.2 Menit</p>
                  <p className="text-[11px] text-warmmuted mt-1">Target SLA Playbook &le; 5 Menit</p>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Pencapaian Net Sales</p>
                  <p className="text-2xl font-extrabold text-terracotta mt-1">5 Unit</p>
                  <p className="text-[11px] text-warmmuted mt-1">Dari target 9 unit bulan ini</p>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-terracotta">
                        Halaman Khusus
                      </span>
                      <Home className="size-5 text-terracotta" />
                    </div>
                    <h3 className="text-base font-bold text-espresso mt-3">
                      {activeProject.totalUnit} Unit {activeProject.nama} (Inventori &amp; Skema)
                    </h3>
                    <p className="text-xs text-warmmuted mt-1">
                      Manajemen inventori lengkap: cluster {projectClusters.join(', ')}, skema cash keras dan tempo bertahap 6, 12, hingga 24 bulan, status unit, serta penambahan unit baru.
                    </p>
                  </div>
                  <button
                    onClick={() => openView('unit_park')}
                    className="mt-5 w-full py-2.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Buka Halaman {activeProject.totalUnit} Unit {activeProject.nama.split(' ')[0]}</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-lime-50 text-olive">
                        Halaman Khusus
                      </span>
                      <Users className="size-5 text-olive" />
                    </div>
                    <h3 className="text-base font-bold text-espresso mt-3">Pantau Kinerja 3 SE Binaan</h3>
                    <p className="text-xs text-warmmuted mt-1">
                      Supervisi real-time personil SE: kepatuhan SLA respons pesan, jumlah lead &amp; prospek, jadwal kunjungan, rekap laporan harian 18.00, serta total poin scorecard.
                    </p>
                  </div>
                  <button
                    onClick={() => openView('kinerja_se')}
                    className="mt-5 w-full py-2.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Buka Halaman Pantau Kinerja 3 SE</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* HALAMAN MANDIRI: INVENTORI UNIT PROYEK AKTIF */}
          {/* ========================================================================= */}
          {activeView === 'unit_park' && (
            <div className="space-y-6">
              {/* Header Halaman */}
              <div className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-terracotta text-white">
                      Inventori Proyek
                    </span>
                    <h2 className="text-lg font-bold text-espresso">{activeProject.totalUnit} Unit {activeProject.nama}</h2>
                  </div>
                  <p className="text-xs text-warmmuted mt-1">
                    Master inventori unit: cluster {projectClusters.join(', ')}, luas tanah, luas bangunan, skema pembayaran tunai &amp; tempo 6/12/24 bulan, status ketersediaan, serta pengeditan data unit.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingUnit(null);
                    setShowUnitModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center gap-2 hover:bg-espresso/90 cursor-pointer shrink-0 shadow-sm"
                >
                  <Plus className="size-4 text-amber-400" /> Tambah Unit Properti
                </button>
              </div>

              {/* Master Inventori Unit CRUD */}
              <section id="master-unit" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Daftar Inventori {activeProject.totalUnit} Unit</h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Pilih filter cluster atau status untuk menyortir ketersediaan unit properti {activeProject.nama}.
                    </p>
                  </div>

                  {/* Filter Cluster & Status */}
                  <div className="flex items-center gap-2">
                    <select
                      value={clusterFilter}
                      onChange={(e) => setClusterFilter(e.target.value)}
                      className="h-9 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-semibold text-espresso focus:outline-none"
                    >
                      <option value="all">Semua Cluster ({units.length})</option>
                      {projectClusters.map((cl) => {
                        const count = units.filter((u) => u.cluster === cl).length;
                        return (
                          <option key={cl} value={cl}>
                            {cl} ({count} Unit)
                          </option>
                        );
                      })}
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

                {/* Mobile Card List (< md) */}
                <SeMobileScorecardList rows={SCORECARD_DATA} />

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* HALAMAN MANDIRI: PANTAU KINERJA 3 SE */}
          {/* ========================================================================= */}
          {activeView === 'kinerja_se' && (
            <div className="space-y-6">
              {/* Header Halaman */}
              <div className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-olive text-white">
                      Supervisi Tim
                    </span>
                    <h2 className="text-lg font-bold text-espresso">Pemantauan Kinerja Tim SE Binaan SM</h2>
                  </div>
                  <p className="text-xs text-warmmuted mt-1">
                    Supervisi real-time 3 Sales Executive: SLA respons pesan (≤5 menit), pipeline lead, kunjungan lapangan, closing booking, dan rekap scorecard Playbook §6.4.
                  </p>
                </div>
                <button
                  onClick={() => openView('pipeline')}
                  className="px-4 py-2.5 rounded-xl bg-espresso text-white text-xs font-semibold flex items-center gap-2 hover:bg-espresso/90 cursor-pointer shrink-0 shadow-sm"
                >
                  <Users className="size-4 text-amber-400" /> Buka Pipeline &amp; WA AI
                </button>
              </div>

              {/* SM Pantau Tim SE Table Section */}
              <section id="tim-se" className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-warmborder flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Performa Real-Time &amp; Kepatuhan SLA</h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Data real-time SE: Waktu respons, lead terancam 72 jam, status laporan cut-off 18.00, dan scorecard.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sandstone text-espresso">
                    Tim 3 SE Aktif
                  </span>
                </div>

                {/* Mobile Card List (< md) */}
                <SeMobileScorecardList rows={SCORECARD_DATA} />

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                      {(realSummary?.seTeamPerformance?.length ? realSummary.seTeamPerformance : SE_TEAM_DATA).map((se: any) => (
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
          {activeView === 'dashboard' && role === 'DIREKSI' && (
            <div className="space-y-6">
              {/* Executive Summary Cards with Single Source of Truth Metrics (Menutup Temuan T1) */}
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 text-emerald-950 font-semibold">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>
                    Status Data: <strong>Terkonsolidasi Realtime · Terverifikasi Keuangan</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDireksiGlossaryOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-100/50 transition-colors cursor-pointer text-[11px] self-start md:self-auto shadow-2xs"
                >
                  <BookOpen className="size-3.5" />
                  Glosarium Metrik Tunggal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Portofolio Aktif</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">{direksiSummary.totalProjects} Proyek Perumahan</p>
                  <p className="text-[11px] text-warmmuted mt-1 truncate" title={direksiSummary.projectNames}>
                    {direksiSummary.projectNames}
                  </p>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Capaian Net Sales</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Sah SPR</span>
                  </div>
                  <p className="text-2xl font-extrabold text-espresso mt-1">
                    {direksiSummary.totalAktualNetSales}{' '}
                    <span className="text-sm font-normal text-warmmuted">
                      / {direksiSummary.totalTargetNetSales} Unit ({direksiSummary.netSalesPct}%)
                    </span>
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-sandstone overflow-hidden">
                    <div
                      className="h-full bg-olive rounded-full transition-all"
                      style={{ width: `${Math.min(100, Number(direksiSummary.netSalesPct))}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Total Realisasi Omzet</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Valid</span>
                  </div>
                  <p className="text-2xl font-extrabold text-terracotta mt-1">{rupiah(direksiSummary.totalAktualOmzet)}</p>
                  <p className="text-[11px] text-olive font-semibold mt-1">
                    {direksiSummary.omzetPct}% dari Target {rupiah(direksiSummary.totalTargetOmzet)}
                  </p>
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
                <div className="p-5 border-b border-warmborder flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-espresso">
                      Meja Persetujuan Khusus &amp; Eskalasi Direksi
                    </h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Pengajuan diskon khusus di luar ketentuan, permohonan pembatalan/refund, dan penanganan kebutuhan khusus pembeli.
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
          {activeView === 'dashboard' && role === 'ADMIN' && (
            <div className="space-y-6">
              {/* Summary Cards Admin */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Konfirmasi Booking H+1</p>
                  <p className="text-2xl font-extrabold text-espresso mt-1">3 Transaksi</p>
                  <p className="text-[11px] text-olive font-semibold mt-1">Wajib Rekening Resmi Developer</p>
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
                <div className="p-5 border-b border-warmborder flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Transaksi Booking Masuk &amp; Batas Waktu Pembayaran</h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Verifikasi transfer Rp 5.000.000 ke rekening resmi, penguncian hold unit, dan jadwal cash tempo.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openView('org_users')}
                      className="px-3.5 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Users className="size-3.5" /> Kelola User (6 Role)
                    </button>
                    <button
                      onClick={() => setIsBankAccountsModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-terracotta border border-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Building2 className="size-3.5" /> Rekening Resmi
                    </button>
                    <button
                      onClick={() => setIsAuditLogsModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-espresso flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <History className="size-3.5" /> Riwayat Aktivitas Tim
                    </button>
                    <button
                      onClick={() => setToast('Sinkronisasi Transaksi Bank')}
                      className="px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-espresso flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="size-3.5" /> Refresh
                    </button>
                  </div>
                </div>

                {/* Mobile Card List (< md) */}
                <SeMobileScorecardList rows={SCORECARD_DATA} />

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                      {(realSummary?.bookingTransactions?.length ? realSummary.bookingTransactions : BOOKING_TRANSACTIONS).map((b: any) => (
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
          {activeView === 'dashboard' && role === 'IT' && (
            <div className="space-y-6">
              {/* Knowledge AI Terpusat + OCR Lokal */}
              <ItKnowledgeAiPanel
                projectId={activeProjectId}
                projectName={activeProject.nama}
              />

              {/* Migration Status Cards */}
              <section id="db-schema" className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-warmborder">
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
                <div className="p-5 border-b border-warmborder flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-espresso">Audit Log 100% (Pencatatan Riwayat Data)</h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Merekam seluruh modifikasi data pengguna, status unit, harga, lead, dan booking.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-warmmuted">Keamanan &amp; Kepatuhan</span>
                </div>

                {/* Mobile Card List (< md) */}
                <SeMobileScorecardList rows={SCORECARD_DATA} />

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                      {(realSummary?.auditLogs?.length ? realSummary.auditLogs.map((a: any) => ({
                        id: String(a.id).slice(0, 6).toUpperCase(),
                        tabel: 'sales_os',
                        aksi: String(a.action_type || 'UPDATE').slice(0, 10),
                        dataPerubahan: String(a.summary || ''),
                        oleh: `${a.actor_name || 'System'} (${a.actor_role || ''})`,
                        waktu: a.created_at ? new Date(a.created_at).toLocaleTimeString('id-ID') : '-',
                      })) : IT_AUDIT_LOGS).map((a: any) => (
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
          {activeView === 'dashboard' && role === 'DIGITAL_MARKETING' && (
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
                <div className="p-5 border-b border-warmborder flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-espresso">
                      Kinerja Kampanye Iklan &amp; Biaya per Lead (CPL) per Kanal
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

                {/* Mobile Card List (< md) */}
                <SeMobileScorecardList rows={SCORECARD_DATA} />

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                      <h4 className="text-sm font-bold text-espresso">Umpan Balik Kualitas Lead dari Tim Sales (SE)</h4>
                      <p className="text-[11px] text-warmmuted">Label valid/tidak valid dari SE dibaca digital marketer setiap hari.</p>
                    </div>
                    <span className="text-xs font-bold text-terracotta">Feed Real-time</span>
                  </div>

                  <div className="divide-y divide-warmborder">
                    {(realSummary?.leadFeedbacks?.length ? realSummary.leadFeedbacks.map((fb: any) => ({
                      id: fb.id,
                      leadName: fb.leadName,
                      kodeKonten: fb.quality,
                      alasan: fb.reason,
                      seName: fb.seName,
                      waktu: 'Terbaru',
                      label: fb.quality === 'SPAM' || fb.quality === 'INVALID' ? 'Tidak Valid' : 'Valid',
                    })) : SE_LEAD_FEEDBACKS).map((fb: any) => (
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
                    💡 <strong>Insight AI:</strong> Porsi terbesar (35%) lead masuk pada jam 19.30 - 21.00 WIB. Sangat efektif dialokasikan ke <strong>Piket Malam Tim Sales</strong>.
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ROLE 7: PLATFORM INTERNAL SUPERADMIN (DIREKSI & IT DEVELOPER SALES OS) */}
          {/* ========================================================================= */}
          {activeView === 'dashboard' && role === 'SUPERADMIN' && (
            <PlatformExecutiveDashboard
              onOpenSuperadminModal={() => setShowSuperadminModal(true)}
            />
          )}

          {activeView === 'dashboard' && role === 'SUPERADMIN_IT' && (
            <ItCommandCenterDashboard
              activeSection={
                activeSection === 'it-permissions'
                  ? 'permissions'
                  : activeSection === 'it-knowledge' || activeSection === 'knowledge-ai'
                  ? 'knowledge'
                  : activeSection === 'it-hierarchy'
                  ? 'hierarchy'
                  : 'dashboard'
              }
              onChangeSection={(sec: ItAdminSection) => {
                if (sec === 'permissions') openDashboardSection('it-permissions');
                else if (sec === 'knowledge') openDashboardSection('it-knowledge');
                else if (sec === 'hierarchy') openDashboardSection('it-hierarchy');
                else openDashboardSection('top');
              }}
              realSummary={realSummary}
              onOpenSuperadminModal={() => setShowSuperadminModal(true)}
              onImpersonateUser={(u, pId) => {
                if (authSession) saveImpersonatorBackup(authSession);
                const supportSession: AuthSession = {
                  role: u.role,
                  email: u.email,
                  name: `${u.name} (Bantuan IT)`,
                  loggedInAt: new Date().toISOString(),
                };
                saveAuthSession(supportSession);
                setAuthSession(supportSession);
                setRole(u.role);
                if (pId) {
                  saveSelectedProjectId(pId);
                  setActiveProjectId(pId);
                }
                setToast(`Mode Bantuan Aktif: Masuk sebagai ${u.name} (${u.roleLabel})`);
              }}
            />
          )}
        </div>
      </main>

      {/* MODAL EDIT / TAMBAH UNIT UNTUK SM */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-xl border border-warmborder">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-warmborder">
              <h3 className="text-base font-bold text-espresso">
                {editingUnit ? `Edit Unit ${editingUnit.namaUnit}` : `Tambah Unit Baru — ${activeProject.nama}`}
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

      {showSuperadminModal && (
        <SuperadminPanel
          onClose={() => setShowSuperadminModal(false)}
        />
      )}

      {/* Modal Pilihan Export Laporan Harian SE (PDF / Excel) */}
      {isExportReportModalOpen && (
        <div className="fixed inset-0 z-60 bg-espresso/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-warmborder w-full sm:max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="px-5 py-4 bg-sandstone border-b border-warmborder flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-espresso">Export Laporan Harian</h3>
                <p className="text-xs text-warmmuted mt-0.5">
                  Catatan laporan disimpan otomatis ke database sebelum file dibuat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExportReportModalOpen(false)}
                className="size-8 rounded-xl bg-white border border-warmborder text-espresso grid place-items-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void handleExportDailyReport('pdf')}
                className="min-h-[56px] p-4 rounded-2xl bg-espresso hover:bg-espresso/90 text-white text-left flex flex-col justify-between gap-1 cursor-pointer shadow-sm"
              >
                <span className="text-xs font-extrabold">Export PDF</span>
                <span className="text-[11px] text-white/75">Dokumen siap cetak / simpan PDF</span>
              </button>
              <button
                type="button"
                onClick={() => void handleExportDailyReport('excel')}
                className="min-h-[56px] p-4 rounded-2xl bg-terracotta hover:bg-terracotta/90 text-white text-left flex flex-col justify-between gap-1 cursor-pointer shadow-sm"
              >
                <span className="text-xs font-extrabold">Export Excel (.xls)</span>
                <span className="text-[11px] text-white/85">Spreadsheet Microsoft Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Assistant Welcome & Notification Onboarding (Clean Light Surface, Tanpa Warna Coklat) */}
      {showAssistantGreeting && authSession && (
        <div
          className="fixed inset-0 z-[88] bg-slate-900/45 backdrop-blur-[3px] flex items-center justify-center p-4"
          onClick={() => {
            sessionStorage.setItem(`devos_assistant_greeted_${authSession.loggedInAt}`, '1');
            setShowAssistantGreeting(false);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Clean Emerald-Tinted Surface Header (Tanpa Garis Tepi Atas) */}
            <div className="p-5 bg-emerald-50/75 border-b border-emerald-200/70 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-11 rounded-2xl bg-emerald-600 text-white grid place-items-center shrink-0 shadow-2xs">
                  <Sparkles className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                    <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Developer Assistant AI
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 truncate">
                    {(() => {
                      const h = new Date(Date.now() + 7 * 60 * 60 * 1000).getUTCHours();
                      const sapa = h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';
                      return `${sapa}, ${user.name.split(' ')[0]}!`;
                    })()}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(`devos_assistant_greeted_${authSession.loggedInAt}`, '1');
                  setShowAssistantGreeting(false);
                }}
                className="size-9 rounded-xl bg-white/80 hover:bg-white border border-emerald-200/80 text-slate-600 grid place-items-center shrink-0 cursor-pointer transition-colors"
                aria-label="Tutup sapaan asisten"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {(() => {
                if (role === 'SE') {
                  const seNotifCount =
                    buildSeRealtimeNotifications(seRealData?.quickStatus, Date.now(), {
                      leadsTodayValidCount: seRealData?.metrics?.leadsTodayValidCount,
                      needsCompletionLeadsCount: seRealData?.metrics?.needsCompletionLeadsCount,
                      waConnectionStatus: seRealData?.metrics?.waConnectionStatus,
                      totpEnabled: Boolean(authSession?.totpEnabled),
                    }).length || 0;
                  return (
                    <>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                        Halo, saya <strong className="text-slate-900">Developer Assistant</strong> Anda. Seluruh persiapan lapangan, jadwal konten, dan prospek prioritas hari ini sudah saya susun di menu <strong className="text-slate-900">Notifikasi</strong>.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                          <span className="text-[10px] font-bold text-slate-500 block">Agenda Aktif</span>
                          <strong className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                            {seNotifCount}
                          </strong>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                          <span className="text-[10px] font-bold text-slate-500 block">Konten Hari Ini</span>
                          <strong className="text-base font-extrabold text-emerald-600 tabular-nums mt-0.5 block">
                            {seRealData?.quickStatus?.slotsUploadedToday ?? 0}/{seRealData?.quickStatus?.slotsTotalToday ?? 3}
                          </strong>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                          <span className="text-[10px] font-bold text-slate-500 block">Target Lead</span>
                          <strong className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5 block">
                            {seRealData?.metrics?.leadsTodayValidCount ?? 0}/8
                          </strong>
                        </div>
                      </div>
                    </>
                  );
                }

                const roleSummary = buildRoleGreetingAndNotifications(
                  role,
                  realSummary,
                  escalations,
                  Boolean(authSession?.totpEnabled)
                );
                return (
                  <>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                      Halo, saya <strong className="text-slate-900">Developer Assistant</strong> Anda ({role}). {roleSummary.subtitle}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {roleSummary.metrics.map((m) => (
                        <div key={m.label} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                          <span className="text-[10px] font-bold text-slate-500 block truncate">{m.label}</span>
                          <strong
                            className={`text-base font-extrabold tabular-nums mt-0.5 block ${
                              m.highlight ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {m.value}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem(`devos_assistant_greeted_${authSession.loggedInAt}`, '1');
                    setShowAssistantGreeting(false);
                    setIsNotifPanelOpen(true);
                  }}
                  className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <span>Cek Notifikasi Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem(`devos_assistant_greeted_${authSession.loggedInAt}`, '1');
                    setShowAssistantGreeting(false);
                  }}
                  className="min-h-[46px] px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Nanti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guided Tour & Pengingat Prioritas Wajib SE (Desktop & Mobile) */}
      {role === 'SE' && !showAssistantGreeting && (
        <SeGuidedTourModal
          activeView={activeView}
          quickStatus={seRealData?.quickStatus}
          snoozedUntilMs={tourSnoozedUntilMs}
          h5Reminder={activeH5Reminder}
          onDismissH5={() => setActiveH5Reminder(null)}
          onNavigateH5={handleSeNotifNavigate}
          onSnooze={handleSnoozeTour}
          onGoToFieldOps={() => openView('lapangan')}
          onGoToUrgentPipeline={handleOpenUrgentPipeline}
        />
      )}

      {/* Mobile Bottom Navigation & Popup Sheet "Lainnya" */}
      <MobileBottomNav
        role={role}
        activeTab={
          role === 'SE'
            ? activeView === 'dashboard' ||
              activeView === 'pipeline' ||
              activeView === 'rute' ||
              activeView === 'lapangan'
              ? activeView
              : 'lainnya'
            : activeView === 'dashboard' ||
              activeView === 'jalur' ||
              activeView === 'riset' ||
              activeView === 'pipeline'
            ? activeView
            : 'lainnya'
        }
        isMoreOpen={isMobileMoreOpen}
        isOtherViewActive={
          role === 'SE'
            ? activeView !== 'dashboard' &&
              activeView !== 'pipeline' &&
              activeView !== 'rute' &&
              activeView !== 'lapangan'
            : activeView !== 'dashboard' &&
              activeView !== 'jalur' &&
              activeView !== 'riset' &&
              activeView !== 'pipeline'
        }
        onSelectTab={handleMobileTabSelect}
      />

      <MobileMoreSheet
        isOpen={isMobileMoreOpen}
        onClose={() => setIsMobileMoreOpen(false)}
        role={role}
        user={user}
        activeProjectId={activeProjectId}
        projects={projects}
        onSelectProject={handleSelectProject}
        actions={{
          onOpenTarget: () => openView('target'),
          onOpenCalendar: () => openView('kalender'),
          onOpenPlaybook: () => openView('playbook'),
          onOpenDailyRoute: () => openView('rute'),
          onOpenFieldOps: () => openView('lapangan', 'absen'),
          onOpenWebsite: () => openView('website'),
          onOpenCrm: () => openView('pipeline'),
          onOpenCommission: () => openView('komisi'),
          onOpenKb: () => openView('kb'),
          onOpenLoveLetter: () => openView('surat_cinta'),
          onOpenVault: () => openView('vault'),
          onOpenReferral: () => openView('referral'),
          onOpenGaransi: () => openView('garansi'),
          onOpenKprBank: () => openView('kpr_bank'),
          onOpenControlTower: () => openView('control_tower'),
          onOpenUnitPark: () => openView('unit_park'),
          onOpenKinerjaSe: () => openView('kinerja_se'),
          onOpenSuperadmin: () => setShowSuperadminModal(true),
          onGoHomepage: () => setViewMode('homepage'),
          onLogout: handleLogout,
          onNavigateDashboardSection: (secId) => openDashboardSection(secId),
        }}
      />

      {/* MODAL TAMBAH PROYEK BARU DENGAN 6 OUTPUT GENERATOR */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-60 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-warmborder max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 my-auto max-h-[94vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warmborder pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-terracotta/10 text-terracotta">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-espresso">Tambah Proyek Baru &amp; Jalankan 6 Output</h3>
                  <p className="text-[11px] text-warmmuted">
                    Input koordinat GPS, katalog, &amp; pricelist untuk menghasilkan riset 25km, surat cinta, target, kalender, playbook 5 role, dan rute harian.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="text-warmmuted hover:text-espresso p-1.5 rounded-xl hover:bg-sandstone cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProject} className="space-y-4 text-xs">
              {/* Bagian 1: Identitas & Tipe Proyek */}
              <div className="space-y-3">
                <p className="font-extrabold text-espresso uppercase tracking-wider text-[10px] text-terracotta">
                  1. Identitas &amp; Klasifikasi Proyek
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="font-bold text-espresso block mb-1">Nama Proyek Perumahan *</label>
                    <input
                      required
                      name="namaProyek"
                      placeholder="Contoh: Griya Melati Asri Sukoharjo"
                      className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="font-bold text-espresso block mb-1">Kode Proyek</label>
                    <input
                      name="kodeProyek"
                      placeholder="Contoh: GMA"
                      maxLength={5}
                      className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-espresso block mb-1">Tipe Proyek *</label>
                    <select
                      name="tipeProyek"
                      defaultValue="Menengah"
                      className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta bg-white"
                    >
                      <option value="Mewah">Mewah (Townhouse)</option>
                      <option value="Menengah">Menengah (Komersil)</option>
                      <option value="Subsidi">Subsidi (FLPP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-espresso block mb-1">Total Unit *</label>
                    <input
                      required
                      type="number"
                      name="totalUnit"
                      defaultValue={35}
                      min={1}
                      max={500}
                      className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-espresso block mb-1">Kisaran Harga</label>
                    <input
                      name="kisaranHarga"
                      placeholder="Rp 450 Jt - Rp 750 Jt"
                      defaultValue="Rp 450 Jt - Rp 750 Jt"
                      className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Titik Koordinat GPS & Dokumen Acuan */}
              <div className="space-y-3 pt-3 border-t border-warmborder">
                <p className="font-extrabold text-espresso uppercase tracking-wider text-[10px] text-terracotta">
                  2. Parameter Acuan (Koordinat GPS, Radius 25km, Katalog, Pricelist)
                </p>
                <div className="space-y-2.5 p-3 rounded-xl border border-warmborder bg-sandstone/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-espresso text-xs flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-terracotta" />
                      <span>Titik Koordinat GPS Multi-Cluster (Bisa &gt; 1 Titik)</span>
                    </span>
                    <span className="text-[10px] text-terracotta font-semibold">Mendukung Multi-Cluster</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-bold text-espresso block mb-0.5">Nama Titik / Cluster 1 (Utama) *</label>
                      <input
                        name="cluster1Nama"
                        defaultValue="Gerbang Utama & Cluster 1"
                        placeholder="Contoh: Gerbang & Cluster A"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-warmborder bg-white text-espresso text-xs"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <label className="text-[10px] font-bold text-espresso block mb-0.5">Koordinat GPS Titik 1 (Lat, Lng) *</label>
                      <input
                        required
                        name="koordinatGps"
                        defaultValue="-7.673872, 110.843978"
                        placeholder="-7.673872, 110.843978"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-warmborder bg-white text-espresso font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-medium text-warmmuted block mb-0.5">Nama Cluster 2 (Opsional)</label>
                      <input
                        name="cluster2Nama"
                        placeholder="Contoh: Cluster Osaka (Tahap 2)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-warmborder bg-white text-espresso text-xs"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <label className="text-[10px] font-medium text-warmmuted block mb-0.5">Koordinat GPS Cluster 2 (Opsional)</label>
                      <input
                        name="cluster2Gps"
                        placeholder="-7.674510, 110.844230"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-warmborder bg-white text-espresso font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-medium text-warmmuted block mb-0.5">Nama Cluster 3 (Opsional)</label>
                      <input
                        name="cluster3Nama"
                        placeholder="Contoh: Cluster Tokyo (Tahap 3)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-warmborder bg-white text-espresso text-xs"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <label className="text-[10px] font-medium text-warmmuted block mb-0.5">Koordinat GPS Cluster 3 (Opsional)</label>
                      <input
                        name="cluster3Gps"
                        placeholder="-7.675200, 110.845100"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-warmborder bg-white text-espresso font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                    <div className="sm:col-span-5">
                      <label className="text-[10px] font-bold text-espresso block mb-0.5">Radius Riset Pasar (km)</label>
                      <input
                        name="radiusKm"
                        type="number"
                        defaultValue={25}
                        readOnly
                        className="w-full px-2.5 py-1.5 rounded-lg border border-warmborder bg-sandstone/70 text-espresso font-semibold text-xs"
                      />
                    </div>
                    <div className="sm:col-span-7 flex items-end pb-1.5">
                      <span className="text-[10px] text-warmmuted">Standar cincin radius 25km dari koordinat titik acuan proyek</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-espresso block mb-1">Unggah Brosur / Katalog (PDF/Gambar)</label>
                    <input
                      type="file"
                      name="katalogFile"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="w-full px-3 py-1.5 rounded-xl border border-warmborder text-warmmuted file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-sandstone file:text-espresso"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-espresso block mb-1">Unggah Pricelist &amp; Skema Bertahap (Excel/PDF)</label>
                    <input
                      type="file"
                      name="pricelistFile"
                      accept=".xlsx,.xls,.pdf,.csv"
                      className="w-full px-3 py-1.5 rounded-xl border border-warmborder text-warmmuted file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-sandstone file:text-espresso"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">Lokasi Wilayah &amp; Akses</label>
                  <input
                    required
                    name="lokasiProyek"
                    placeholder="Contoh: Sukoharjo (Koridor Solo Baru)"
                    defaultValue="Mandan, Sukoharjo"
                    className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              {/* Bagian 3: Ringkasan 6 Mesin Output yang Langsung Aktif */}
              <div className="p-3.5 bg-sandstone/60 border border-warmborder rounded-2xl space-y-2">
                <p className="font-extrabold text-espresso text-[11px] flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-terracotta" />
                  <span>Otomatisasi 6 Output yang Langsung Dihasilkan:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-espresso">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-warmborder/80">
                    <CheckCircle2 className="size-4 text-olive shrink-0" />
                    <span><strong>Surat Cinta 99 Keunggulan</strong> (narasi kurasi)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-warmborder/80">
                    <CheckCircle2 className="size-4 text-olive shrink-0" />
                    <span><strong>Riset Pasar Radius 25km</strong> (titik GPS)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-warmborder/80">
                    <CheckCircle2 className="size-4 text-olive shrink-0" />
                    <span><strong>Target Penjualan 100%</strong> (reverse funnel)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-warmborder/80">
                    <CheckCircle2 className="size-4 text-olive shrink-0" />
                    <span><strong>Kalender Konten 30 Hari</strong> (Akun Official &amp; SE)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-warmborder/80">
                    <CheckCircle2 className="size-4 text-olive shrink-0" />
                    <span><strong>Playbook Sales (5 Role)</strong> (SE, TL, SM, DM, Admin)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-warmborder/80">
                    <CheckCircle2 className="size-4 text-olive shrink-0" />
                    <span><strong>Rute Harian Kanvasing SE</strong> (GPS gerbang)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-warmborder">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-warmborder text-warmmuted hover:bg-sandstone font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white font-extrabold flex items-center gap-2 cursor-pointer shadow-md shadow-terracotta/20"
                >
                  <Plus className="size-4" />
                  <span>Buat Proyek &amp; Jalankan 6 Output</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Manajemen User Tim (SM & Admin · 6 Role Dasar) */}
      <OrgUserManagementModal
        isOpen={isUserMgmtModalOpen}
        onClose={() => setIsUserMgmtModalOpen(false)}
        projectId={activeProjectId}
        projectName={activeProject.nama}
      />

      {/* Modal Manajemen Rekening Resmi Perusahaan (SM & Admin) */}
      <CompanyBankAccountsModal
        isOpen={isBankAccountsModalOpen}
        onClose={() => setIsBankAccountsModalOpen(false)}
        user={user}
        role={role}
        projectId={activeProjectId}
        projectName={activeProject.nama}
      />

      {/* Modal Audit Log CRUD Perusahaan */}
      <CompanyAuditLogsModal
        isOpen={isAuditLogsModalOpen}
        onClose={() => setIsAuditLogsModalOpen(false)}
        user={user}
        role={role}
      />

      {/* Modal Glosarium Metrik Tunggal Direksi (Menutup Temuan T1) */}
      {isDireksiGlossaryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-warmborder shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-warmborder flex flex-wrap items-center justify-between gap-3 bg-sandstone/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-espresso text-base">Glosarium Metrik Tunggal</h3>
                  <p className="text-[11px] text-warmmuted">Standar Acuan Definisi Angka Eksekutif (Single Source of Truth)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDireksiGlossaryOpen(false)}
                className="size-8 rounded-full hover:bg-sandstone grid place-items-center text-warmmuted cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs text-espresso">
              <div className="p-3.5 rounded-2xl bg-sandstone/50 border border-warmborder space-y-1">
                <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider">1. Net Sales Bersih (Sah SPR)</span>
                <p className="text-warmmuted leading-relaxed">
                  Jumlah unit transaksi closing definitif di mana calon pembeli telah melunasi <strong>Booking Fee / Uang Muka (DP)</strong> dan menandatangani <strong>Surat Pemesanan Rumah (SPR)</strong>. Unit yang masih di tahap prospek, visit, atau hold sementara tidak dihitung sebagai Net Sales.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-sandstone/50 border border-warmborder space-y-1">
                <span className="font-bold text-terracotta uppercase text-[10px] tracking-wider">2. Realisasi Omzet (Tervalidasi Keuangan)</span>
                <p className="text-warmmuted leading-relaxed">
                  Akumulasi nilai transaksi bruto dari unit-unit Net Sales yang pembayarannya telah masuk ke rekening resmi perusahaan dan telah divalidasi oleh Divisi Keuangan. Bukan proyeksi atau taksiran sepihak sales.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-sandstone/50 border border-warmborder space-y-1">
                <span className="font-bold text-blue-800 uppercase text-[10px] tracking-wider">3. Leads Terkualifikasi (Bebas Spam)</span>
                <p className="text-warmmuted leading-relaxed">
                  Kontak masuk yang telah melewati filter penyaring anti-spam (bebas nomor fiktif, pola bot, kata kunci judi/pinjol, atau teks tidak jelas).
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-sandstone/50 border border-warmborder space-y-1">
                <span className="font-bold text-amber-800 uppercase text-[10px] tracking-wider">4. Booking Masuk</span>
                <p className="text-warmmuted leading-relaxed">
                  Konsumen yang telah memilih kavling unit spesifik dan mentransfer tanda jadi awal yang terverifikasi di mutasi rekening resmi perusahaan.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-warmborder bg-sandstone/20 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDireksiGlossaryOpen(false)}
                className="px-4 py-2 bg-espresso text-white rounded-xl text-xs font-bold hover:bg-espresso/90 cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
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
