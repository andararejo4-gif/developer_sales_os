import { useState } from 'react';
import {
  ShieldAlert,
  Database,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  KeyRound,
  MessageSquare,
  Building2,
  Layers,
  CheckCircle2,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { RoleKey } from '../../data';
import {
  saveAuthSession,
  saveImpersonatorBackup,
  loadAuthSession,
  type AuthSession,
} from '../../lib/auth/dummy-accounts';
import { saveSelectedProjectId } from '../../lib/projects/projects-data';

interface UserAccountItem {
  id: string;
  name: string;
  role: RoleKey;
  roleLabel: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'LOCKED' | 'PENDING';
  lastActive: string;
}

interface ProjectHierarchyItem {
  id: string;
  name: string;
  location: string;
  totalUnits: number;
  type: string;
  users: UserAccountItem[];
}

interface DeveloperHierarchyItem {
  id: string;
  companyName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  plan: 'Diamond' | 'Platinum' | 'Gold';
  status: 'AKTIF' | 'DEMO' | 'SUSPENDED';
  waGatewayStatus: 'CONNECTED' | 'DISCONNECTED' | 'PAIRING_NEEDED';
  projects: ProjectHierarchyItem[];
}

const INITIAL_HIERARCHY_DATA: DeveloperHierarchyItem[] = [
  {
    id: 'dev-001',
    companyName: 'PT Andara Rejo Makmur',
    ownerName: 'Bpk. Bambang Soedirjo',
    ownerPhone: '081122334401',
    ownerEmail: 'direksi@andararejomakmur.co.id',
    plan: 'Diamond',
    status: 'AKTIF',
    waGatewayStatus: 'CONNECTED',
    projects: [
      {
        id: 'the-park-sukoharjo',
        name: 'The Park Townhouse Sukoharjo',
        location: 'Mandan, Sukoharjo',
        totalUnits: 30,
        type: 'Mewah',
        users: [
          {
            id: 'u-01',
            name: 'Bambang Soedirjo',
            role: 'DIREKSI',
            roleLabel: 'Direksi / Owner Developer',
            email: 'direksi@andararejomakmur.co.id',
            phone: '081122334401',
            status: 'ACTIVE',
            lastActive: '5 menit lalu',
          },
          {
            id: 'u-02',
            name: 'Ferry Kurniawan',
            role: 'SM',
            roleLabel: 'Sales Manager (Semi-AI)',
            email: 'sm@andararejomakmur.co.id',
            phone: '081122334402',
            status: 'ACTIVE',
            lastActive: '12 menit lalu',
          },
          {
            id: 'u-03',
            name: 'Raka Pratama',
            role: 'SE',
            roleLabel: 'Sales Executive Lapangan',
            email: 'raka@andararejomakmur.co.id',
            phone: '081122334411',
            status: 'ACTIVE',
            lastActive: '1 jam lalu',
          },
          {
            id: 'u-04',
            name: 'Siti Rahma',
            role: 'ADMIN',
            roleLabel: 'Admin Sales & Transaksi',
            email: 'admin.sales@andararejomakmur.co.id',
            phone: '081122334421',
            status: 'ACTIVE',
            lastActive: '2 jam lalu',
          },
          {
            id: 'u-05',
            name: 'Dodi Hartono',
            role: 'IT',
            roleLabel: 'IT & System Developer',
            email: 'it@andararejomakmur.co.id',
            phone: '081122334431',
            status: 'ACTIVE',
            lastActive: '1 hari lalu',
          },
        ],
      },
      {
        id: 'griya-andara-sukoharjo',
        name: 'Griya Andara Asri Sukoharjo',
        location: 'Polokarto, Sukoharjo',
        totalUnits: 120,
        type: 'Subsidi',
        users: [
          {
            id: 'u-06',
            name: 'Dian Lestari',
            role: 'SE',
            roleLabel: 'Sales Executive FLPP',
            email: 'dian@andararejomakmur.co.id',
            phone: '081122334412',
            status: 'ACTIVE',
            lastActive: '3 jam lalu',
          },
        ],
      },
      {
        id: 'andara-village-boyolali',
        name: 'Andara Village Boyolali',
        location: 'Mojosongo, Boyolali',
        totalUnits: 45,
        type: 'Menengah',
        users: [
          {
            id: 'u-07',
            name: 'Budi Santoso',
            role: 'SE',
            roleLabel: 'Sales Executive Menengah',
            email: 'budi@andararejomakmur.co.id',
            phone: '081122334413',
            status: 'ACTIVE',
            lastActive: '4 jam lalu',
          },
        ],
      },
    ],
  },
  {
    id: 'dev-002',
    companyName: 'PT Graha Mandiri Propertindo',
    ownerName: 'Bpk. Hendra Gunawan',
    ownerPhone: '081234567890',
    ownerEmail: 'owner@grahamandiri.com',
    plan: 'Diamond',
    status: 'AKTIF',
    waGatewayStatus: 'PAIRING_NEEDED',
    projects: [
      {
        id: 'grand-mandiri-asri',
        name: 'Grand Mandiri Asri Colomadu',
        location: 'Colomadu, Karanganyar',
        totalUnits: 45,
        type: 'Menengah',
        users: [
          {
            id: 'u-08',
            name: 'Hendra Gunawan',
            role: 'DIREKSI',
            roleLabel: 'Direksi / Owner Developer',
            email: 'owner@grahamandiri.com',
            phone: '081234567890',
            status: 'ACTIVE',
            lastActive: '10 menit lalu',
          },
          {
            id: 'u-09',
            name: 'Andi Saputra',
            role: 'SM',
            roleLabel: 'Sales Manager Proyek',
            email: 'sm@grahamandiri.com',
            phone: '081234567891',
            status: 'ACTIVE',
            lastActive: '1 hari lalu',
          },
        ],
      },
    ],
  },
  {
    id: 'dev-003',
    companyName: 'PT Solo Makmur Jaya',
    ownerName: 'Ibu Ratna Susilowati',
    ownerPhone: '081390112233',
    ownerEmail: 'ratna@solomakmur.com',
    plan: 'Platinum',
    status: 'AKTIF',
    waGatewayStatus: 'CONNECTED',
    projects: [
      {
        id: 'solo-baru-harmony',
        name: 'Solo Baru Harmony Residence',
        location: 'Solo Baru, Sukoharjo',
        totalUnits: 45,
        type: 'Mewah',
        users: [
          {
            id: 'u-10',
            name: 'Ratna Susilowati',
            role: 'DIREKSI',
            roleLabel: 'Direksi / Owner Developer',
            email: 'ratna@solomakmur.com',
            phone: '081390112233',
            status: 'ACTIVE',
            lastActive: '2 hari lalu',
          },
        ],
      },
    ],
  },
];

interface ItCommandCenterDashboardProps {
  onOpenSuperadminModal: () => void;
  onImpersonateUser?: (user: UserAccountItem, projectId?: string) => void;
}

export function ItCommandCenterDashboard({
  onOpenSuperadminModal,
  onImpersonateUser,
}: ItCommandCenterDashboardProps) {
  const [hierarchyData, setHierarchyData] = useState<DeveloperHierarchyItem[]>(INITIAL_HIERARCHY_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDevId, setExpandedDevId] = useState<string | null>('dev-001');
  const [expandedProjId, setExpandedProjId] = useState<string | null>('the-park-sukoharjo');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for Edit/Add User
  const [editingUser, setEditingUser] = useState<{
    user: UserAccountItem | null;
    devId: string;
    projId: string;
  } | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<RoleKey>('SE');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Impersonate / Login Sebagai Akun Ini untuk Membantu Masalah Teknis
  const handleImpersonate = (u: UserAccountItem, projectId?: string) => {
    const currentSession = loadAuthSession();
    if (currentSession && (currentSession.role === 'SUPERADMIN_IT' || currentSession.role === 'SUPERADMIN')) {
      saveImpersonatorBackup(currentSession);
    }

    const supportSession: AuthSession = {
      role: u.role,
      email: u.email,
      name: `${u.name} (Bantuan IT)`,
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(supportSession);
    if (projectId) {
      saveSelectedProjectId(projectId);
    }

    if (onImpersonateUser) {
      onImpersonateUser(u, projectId);
    } else {
      triggerToast(`Beralih sesi sebagai ${u.name} (${u.roleLabel}).`);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleResetPassword = (u: UserAccountItem) => {
    triggerToast(`Kata sandi akun ${u.name} (${u.email}) berhasil di-reset ke default: Andara${u.role}#2026`);
  };

  const handleFixWaGateway = (dev: DeveloperHierarchyItem) => {
    setHierarchyData((prev) =>
      prev.map((d) => (d.id === dev.id ? { ...d, waGatewayStatus: 'CONNECTED' } : d))
    );
    triggerToast(`WhatsApp Gateway ${dev.companyName} berhasil di-reconnect & webhook sinkron.`);
  };

  const openAddUserModal = (devId: string, projId: string) => {
    setEditingUser({ user: null, devId, projId });
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('SE');
  };

  const openEditUserModal = (u: UserAccountItem, devId: string, projId: string) => {
    setEditingUser({ user: u, devId, projId });
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPhone(u.phone);
    setFormRole(u.role);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const { user, devId, projId } = editingUser;

    setHierarchyData((prev) =>
      prev.map((dev) => {
        if (dev.id !== devId) return dev;
        return {
          ...dev,
          projects: dev.projects.map((proj) => {
            if (proj.id !== projId) return proj;
            if (user) {
              // Edit user
              return {
                ...proj,
                users: proj.users.map((u) =>
                  u.id === user.id
                    ? {
                        ...u,
                        name: formName,
                        email: formEmail,
                        phone: formPhone,
                        role: formRole,
                        roleLabel:
                          formRole === 'SE'
                            ? 'Sales Executive Lapangan'
                            : formRole === 'SM'
                            ? 'Sales Manager'
                            : formRole === 'ADMIN'
                            ? 'Admin Sales & Transaksi'
                            : formRole === 'DIREKSI'
                            ? 'Direksi / Owner Developer'
                            : formRole === 'IT'
                            ? 'IT & System Developer'
                            : 'Digital Marketer',
                      }
                    : u
                ),
              };
            } else {
              // Add new user
              const newUser: UserAccountItem = {
                id: `u-${Date.now()}`,
                name: formName,
                email: formEmail,
                phone: formPhone,
                role: formRole,
                roleLabel:
                  formRole === 'SE'
                    ? 'Sales Executive Lapangan'
                    : formRole === 'SM'
                    ? 'Sales Manager'
                    : formRole === 'ADMIN'
                    ? 'Admin Sales & Transaksi'
                    : formRole === 'DIREKSI'
                    ? 'Direksi / Owner Developer'
                    : formRole === 'IT'
                    ? 'IT & System Developer'
                    : 'Digital Marketer',
                status: 'ACTIVE',
                lastActive: 'Baru ditambahkan',
              };
              return { ...proj, users: [...proj.users, newUser] };
            }
          }),
        };
      })
    );

    triggerToast(user ? `Akun ${formName} berhasil diperbarui.` : `Akun baru ${formName} berhasil ditambahkan.`);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string, devId: string, projId: string) => {
    if (!confirm('Yakin ingin menghapus akun ini dari database proyek?')) return;
    setHierarchyData((prev) =>
      prev.map((dev) => {
        if (dev.id !== devId) return dev;
        return {
          ...dev,
          projects: dev.projects.map((proj) => {
            if (proj.id !== projId) return proj;
            return {
              ...proj,
              users: proj.users.filter((u) => u.id !== userId),
            };
          }),
        };
      })
    );
    triggerToast('Akun berhasil dihapus dari sistem.');
  };

  const filteredHierarchy = hierarchyData.filter((dev) => {
    const matchDev =
      dev.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchProj = dev.projects.some(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.users.some(
          (u) =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.phone.includes(searchQuery)
        )
    );
    return matchDev || matchProj;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-espresso text-white text-xs font-bold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Zap className="size-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* IT Command Center Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-espresso text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 size-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-xs">
                IT Command Center &middot; God Mode
              </span>
              <span className="text-xs text-stone-300">Akses &amp; Bantuan Teknis Menyeluruh</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">
              Pusat Kendali Sistem IT &amp; Bantuan Teknis Developer
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
              Memiliki otoritas penuh untuk menginspeksi, meng-CRUD seluruh hierarki dari developer hingga tim sales (SE), serta login instan (impersonate) untuk membantu developer yang membutuhkan pertolongan teknis.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenSuperadminModal}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-espresso font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="size-4 text-espresso" />
              <span>Buka Superadmin Panel</span>
            </button>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/15">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">
              PostgreSQL Schema `devos`
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-base font-bold text-white">6/6 Migrations Active</strong>
            </div>
            <span className="text-[11px] text-white/70 mt-0.5 block">Latency 4ms &middot; 0 Slow Queries</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">
              Engine LLM &amp; Token Dispatcher
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-base font-bold text-white">Gemini 2.5 Flash + GPT-4o</strong>
            </div>
            <span className="text-[11px] text-white/70 mt-0.5 block">Quota 98.4% Available</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">
              WhatsApp Queue Dispatcher
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-base font-bold text-white">Cloud API Ready</strong>
            </div>
            <span className="text-[11px] text-white/70 mt-0.5 block">Worker SLA &lt; 2s</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">
              Master POI Regional
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="size-2 rounded-full bg-amber-400" />
              <strong className="text-base font-bold text-white">63 Titik Terkurasi</strong>
            </div>
            <span className="text-[11px] text-white/70 mt-0.5 block">25 Unggulan Homepage</span>
          </div>
        </div>
      </div>

      {/* Hierarchical Tenant Inspector & CRUD Center */}
      <div className="bg-white rounded-3xl border border-warmborder p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-warmborder">
          <div>
            <h3 className="text-base font-black text-espresso flex items-center gap-2">
              <Database className="size-5 text-terracotta" />
              <span>Hierarki Seluruh Developer, Proyek, &amp; Tim Sales (CRUD &amp; Support Mode)</span>
            </h3>
            <p className="text-xs text-warmmuted mt-0.5">
              Klik developer untuk melihat proyeknya. Buka proyek untuk melihat seluruh personel tim sales. Gunakan tombol <strong className="text-espresso">"Bantu Akun Ini"</strong> untuk mereplikasi sesi klien.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari PT, nama SE, no WA, email..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-warmborder text-xs focus:outline-none focus:border-terracotta bg-sandstone/30"
            />
          </div>
        </div>

        {/* Tree List Hierarchy */}
        <div className="space-y-4">
          {filteredHierarchy.map((dev) => {
            const isDevExpanded = expandedDevId === dev.id;

            return (
              <div
                key={dev.id}
                className="rounded-2xl border border-warmborder bg-sandstone/20 overflow-hidden transition-all shadow-xs"
              >
                {/* Developer Level Header */}
                <div className="p-4 bg-white border-b border-warmborder flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedDevId(isDevExpanded ? null : dev.id)}
                      className="p-1 rounded-lg hover:bg-sandstone text-espresso cursor-pointer transition-colors"
                      aria-label="Expand Developer"
                    >
                      {isDevExpanded ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
                    </button>
                    <div className="size-9 rounded-xl bg-terracotta text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-black text-espresso">{dev.companyName}</strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
                          {dev.plan}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {dev.status}
                        </span>
                      </div>
                      <p className="text-xs text-warmmuted mt-0.5">
                        Owner: <strong className="text-espresso">{dev.ownerName}</strong> &middot; {dev.ownerEmail} &middot;{' '}
                        <a href={`https://wa.me/${dev.ownerPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                          {dev.ownerPhone}
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Quick IT Helper Actions on Developer */}
                  <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                    {dev.waGatewayStatus === 'PAIRING_NEEDED' ? (
                      <button
                        type="button"
                        onClick={() => handleFixWaGateway(dev)}
                        className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <MessageSquare className="size-3.5 text-amber-700" />
                        <span>Pairing Ulang WA Gateway</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        <span>WA Gateway Normal</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleImpersonate(
                          {
                            id: `owner-${dev.id}`,
                            name: dev.ownerName,
                            role: 'DIREKSI',
                            roleLabel: 'Direksi / Owner Developer',
                            email: dev.ownerEmail,
                            phone: dev.ownerPhone,
                            status: 'ACTIVE',
                            lastActive: 'Online',
                          },
                          dev.projects[0]?.id
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-espresso hover:bg-espresso/90 text-white font-extrabold text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      title="Masuk ke dashboard sebagai Owner Developer untuk troubleshooting"
                    >
                      <UserCheck className="size-3.5 text-amber-400" />
                      <span>Bantu Akun Owner</span>
                    </button>
                  </div>
                </div>

                {/* Projects under this Developer */}
                {isDevExpanded && (
                  <div className="p-4 space-y-4">
                    {dev.projects.map((proj) => {
                      const isProjExpanded = expandedProjId === proj.id;

                      return (
                        <div
                          key={proj.id}
                          className="rounded-xl border border-warmborder bg-white overflow-hidden shadow-xs"
                        >
                          {/* Project Level Header */}
                          <div className="p-3 bg-sandstone/50 border-b border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setExpandedProjId(isProjExpanded ? null : proj.id)}
                                className="p-1 rounded text-espresso hover:bg-sandstone cursor-pointer"
                              >
                                {isProjExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                              </button>
                              <Layers className="size-4 text-terracotta shrink-0" />
                              <div>
                                <span className="font-extrabold text-xs text-espresso">{proj.name}</span>
                                <span className="text-[11px] text-warmmuted ml-2">
                                  ({proj.location} &middot; {proj.totalUnits} Unit Kavling &middot; {proj.type})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-warmmuted font-semibold">
                                {proj.users.length} Personel Terdaftar
                              </span>
                              <button
                                type="button"
                                onClick={() => openAddUserModal(dev.id, proj.id)}
                                className="px-2.5 py-1 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Plus className="size-3" />
                                <span>Tambah Tim Sales</span>
                              </button>
                            </div>
                          </div>

                          {/* Users / Sales Team Table under this Project */}
                          {isProjExpanded && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-sandstone/30 border-b border-warmborder text-[10px] font-black uppercase tracking-wider text-warmmuted">
                                    <th className="py-2.5 px-4">Nama Personel &amp; Role</th>
                                    <th className="py-2.5 px-3">Email Akun</th>
                                    <th className="py-2.5 px-3">No. WhatsApp</th>
                                    <th className="py-2.5 px-3 text-center">Status Sesi</th>
                                    <th className="py-2.5 px-4 text-right">Aksi IT Support</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-warmborder">
                                  {proj.users.map((u) => (
                                    <tr key={u.id} className="hover:bg-sandstone/30 transition-colors">
                                      <td className="py-2.5 px-4">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                              u.role === 'DIREKSI'
                                                ? 'bg-purple-100 text-purple-900'
                                                : u.role === 'SM'
                                                ? 'bg-blue-100 text-blue-900'
                                                : u.role === 'SE'
                                                ? 'bg-emerald-100 text-emerald-900'
                                                : 'bg-sandstone text-espresso'
                                            }`}
                                          >
                                            {u.role}
                                          </span>
                                          <div>
                                            <strong className="text-espresso font-bold block">{u.name}</strong>
                                            <span className="text-[10px] text-warmmuted">{u.roleLabel}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-[11px] text-espresso">
                                        {u.email}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-700">
                                        <a href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:underline">
                                          {u.phone}
                                        </a>
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                          {u.lastActive}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          {/* Impersonate button */}
                                          <button
                                            type="button"
                                            onClick={() => handleImpersonate(u, proj.id)}
                                            className="px-2.5 py-1 rounded-lg bg-espresso hover:bg-espresso/90 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                                            title="Login sebagai akun ini untuk troubleshoot langsung"
                                          >
                                            <UserCheck className="size-3 text-amber-400" />
                                            <span>Bantu Akun</span>
                                          </button>

                                          {/* Reset password button */}
                                          <button
                                            type="button"
                                            onClick={() => handleResetPassword(u)}
                                            className="p-1 rounded-lg hover:bg-sandstone text-warmmuted hover:text-espresso border border-warmborder cursor-pointer transition-colors"
                                            title="Reset Kata Sandi"
                                          >
                                            <KeyRound className="size-3.5" />
                                          </button>

                                          {/* Edit user button */}
                                          <button
                                            type="button"
                                            onClick={() => openEditUserModal(u, dev.id, proj.id)}
                                            className="p-1 rounded-lg hover:bg-sandstone text-warmmuted hover:text-espresso border border-warmborder cursor-pointer transition-colors"
                                            title="Edit Data User"
                                          >
                                            <Edit className="size-3.5" />
                                          </button>

                                          {/* Delete user button */}
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUser(u.id, dev.id, proj.id)}
                                            className="p-1 rounded-lg hover:bg-rose-50 text-warmmuted hover:text-rose-700 border border-warmborder cursor-pointer transition-colors"
                                            title="Hapus User"
                                          >
                                            <Trash2 className="size-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL EDIT / TAMBAH USER TIM SALES DEVELOPER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-warmborder space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-warmborder">
              <h3 className="text-base font-black text-espresso">
                {editingUser.user ? `Edit Akun ${editingUser.user.name}` : 'Tambah Personel Tim Sales'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-warmmuted hover:text-espresso cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Raka Pratama"
                  className="w-full px-3 py-2 rounded-xl border border-warmborder text-xs focus:outline-none focus:border-terracotta bg-sandstone/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Role Jabatan *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as RoleKey)}
                  className="w-full px-3 py-2 rounded-xl border border-warmborder text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value="SE">Sales Executive (SE Lapangan)</option>
                  <option value="SM">Sales Manager (SM)</option>
                  <option value="ADMIN">Admin Sales &amp; Transaksi</option>
                  <option value="DIREKSI">Direksi / Owner Developer</option>
                  <option value="IT">IT Developer Properti</option>
                  <option value="DIGITAL_MARKETING">Digital Marketer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Email Pengguna *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="w-full px-3 py-2 rounded-xl border border-warmborder text-xs focus:outline-none focus:border-terracotta bg-sandstone/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Nomor WhatsApp Aktif *</label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="081122334411"
                  className="w-full px-3 py-2 rounded-xl border border-warmborder text-xs focus:outline-none focus:border-terracotta bg-sandstone/30"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-warmborder text-xs font-bold text-warmmuted hover:bg-sandstone cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
