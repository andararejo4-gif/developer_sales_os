import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Layers,
  Lock,
  Save,
  Search,
  Shield,
  Unlock,
  Users,
} from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

export interface CrudPerm {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

interface FeatureDef {
  key: string;
  label: string;
  category: string;
}

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

const CORE_SIX_ROLES = [
  'SE',
  'TL',
  'SM',
  'DIREKSI',
  'ADMIN',
  'DIGITAL_MARKETING',
] as const;

const ROLE_LABELS: Record<string, string> = {
  SE: 'Sales Executive (SE)',
  TL: 'Team Leader (TL)',
  SM: 'Sales Manager (SM)',
  DIREKSI: 'Direksi',
  ADMIN: 'Admin',
  DIGITAL_MARKETING: 'Digital Marketing',
};

const ROLE_BADGE_STYLE: Record<string, string> = {
  SE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  TL: 'bg-sky-50 text-sky-800 border-sky-200',
  SM: 'bg-amber-50 text-amber-800 border-amber-200',
  DIREKSI: 'bg-purple-50 text-purple-800 border-purple-200',
  ADMIN: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  DIGITAL_MARKETING: 'bg-rose-50 text-rose-800 border-rose-200',
};

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

export const PermissionMatrixPanel: React.FC = () => {
  // View state: 'list' (default tabel user 6 role) | 'user-detail' (atur permission 1 user) | 'role-global' (opsional default per role)
  const [viewMode, setViewMode] = useState<'list' | 'user-detail' | 'role-global'>('list');
  const [activeRoleTab, setActiveRoleTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [features, setFeatures] = useState<FeatureDef[]>([]);
  const [selectedUser, setSelectedUser] = useState<OrgUser | null>(null);
  const [selectedGlobalRole, setSelectedGlobalRole] = useState<string>('SE');
  const [matrix, setMatrix] = useState<Record<string, CrudPerm>>({});

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Load initial user directory (strictly excluding SUPERADMIN & SUPERADMIN_IT)
  const loadUsersList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/superadmin/permissions?scopeType=ROLE&targetRole=SE', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        const rawUsers: OrgUser[] = Array.isArray(json.users) ? json.users : [];
        const coreOnly = rawUsers.filter((u) =>
          (CORE_SIX_ROLES as readonly string[]).includes(u.role)
        );
        setUsers(coreOnly);
        if (Array.isArray(json.features)) setFeatures(json.features);
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadUsersList();
  }, [loadUsersList]);

  const loadPermissionMatrix = useCallback(
    async (scopeType: 'USER' | 'ROLE', targetIdOrRole: string) => {
      setLoadingMatrix(true);
      try {
        const params = new URLSearchParams({ scopeType });
        if (scopeType === 'USER') params.set('targetUserId', targetIdOrRole);
        else params.set('targetRole', targetIdOrRole);

        const res = await fetch(`/api/superadmin/permissions?${params.toString()}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          if (Array.isArray(json.features)) setFeatures(json.features);
          setMatrix(json.matrix || {});
        }
      } finally {
        setLoadingMatrix(false);
      }
    },
    []
  );

  const handleOpenUserDetail = (user: OrgUser) => {
    setSelectedUser(user);
    setCategoryFilter('ALL');
    setViewMode('user-detail');
    loadPermissionMatrix('USER', user.id);
  };

  const handleOpenGlobalRole = (roleName: string) => {
    setSelectedGlobalRole(roleName);
    setCategoryFilter('ALL');
    setViewMode('role-global');
    loadPermissionMatrix('ROLE', roleName);
  };

  const roleCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: users.length };
    for (const r of CORE_SIX_ROLES) {
      map[r] = users.filter((u) => u.role === r).length;
    }
    return map;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchRole = activeRoleTab === 'ALL' || u.role === activeRoleTab;
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [users, activeRoleTab, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    features.forEach((f) => set.add(f.category));
    return ['ALL', ...Array.from(set)];
  }, [features]);

  const filteredFeatures = useMemo(() => {
    if (categoryFilter === 'ALL') return features;
    return features.filter((f) => f.category === categoryFilter);
  }, [features, categoryFilter]);

  const setPreset = (featureKey: string, preset: 'FULL' | 'READ_ONLY' | 'UPDATE_ONLY' | 'BLOCK') => {
    const next: CrudPerm =
      preset === 'FULL'
        ? { create: true, read: true, update: true, delete: true }
        : preset === 'READ_ONLY'
        ? { create: false, read: true, update: false, delete: false }
        : preset === 'UPDATE_ONLY'
        ? { create: false, read: true, update: true, delete: false }
        : { create: false, read: false, update: false, delete: false };
    setMatrix((prev) => ({ ...prev, [featureKey]: next }));
  };

  const toggleFlag = (featureKey: string, flag: keyof CrudPerm) => {
    setMatrix((prev) => {
      const curr = prev[featureKey] || { create: true, read: true, update: true, delete: true };
      return { ...prev, [featureKey]: { ...curr, [flag]: !curr[flag] } };
    });
  };

  const handleSave = async () => {
    if (viewMode === 'user-detail' && !selectedUser) return;
    setSaving(true);
    try {
      const scopeType = viewMode === 'user-detail' ? 'USER' : 'ROLE';
      const res = await fetch('/api/superadmin/permissions', {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          scopeType,
          targetUserId: scopeType === 'USER' ? selectedUser?.id : undefined,
          targetRole: scopeType === 'ROLE' ? selectedGlobalRole : undefined,
          permissions: matrix,
        }),
      });
      if (res.ok) {
        showToast(
          scopeType === 'USER'
            ? `Permission untuk ${selectedUser?.name} berhasil disimpan.`
            : `Permission default global role ${selectedGlobalRole} berhasil disimpan.`
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // STEP 1: DEFAULT VIEW — DAFTAR PENGGUNA (6 ROLE UTAMA, EXCLUDE SUPERADMIN)
  // =========================================================================
  if (viewMode === 'list') {
    return (
      <section className="bg-white border border-warmborder rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-warmborder">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-terracotta/10 text-terracotta shrink-0">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-espresso">
                Permission Fitur Pengguna
              </h2>
              <p className="text-xs text-warmmuted mt-0.5">
                Pilih pengguna dari 6 role utama di bawah untuk membuka halaman pengaturan hak akses CRUD per fitur. Akun Superadmin &amp; Superadmin IT dikecualikan otomatis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenGlobalRole(activeRoleTab === 'ALL' ? 'SE' : activeRoleTab)}
            className="px-3.5 py-2 rounded-xl border border-warmborder bg-sandstone/70 hover:bg-sandstone text-xs font-bold text-espresso inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Layers className="size-3.5 text-terracotta" />
            <span>Atur Default Global Per-Role</span>
          </button>
        </div>

        {/* Role Filter Tabs (6 Role Utama) + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveRoleTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                activeRoleTab === 'ALL'
                  ? 'bg-espresso text-white border-espresso shadow-xs'
                  : 'bg-sandstone/50 text-warmmuted border-warmborder hover:text-espresso hover:bg-sandstone'
              }`}
            >
              Semua 6 Role ({roleCounts.ALL ?? 0})
            </button>
            {CORE_SIX_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRoleTab(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  activeRoleTab === r
                    ? 'bg-terracotta text-white border-terracotta shadow-xs'
                    : 'bg-white text-warmmuted border-warmborder hover:text-espresso hover:bg-sandstone/60'
                }`}
              >
                {r === 'DIGITAL_MARKETING' ? 'DM' : r} ({roleCounts[r] ?? 0})
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-warmborder text-xs bg-sandstone/30 focus:outline-none focus:border-terracotta"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="border border-warmborder rounded-2xl overflow-hidden">
          {loadingList ? (
            <div className="p-10 text-center text-xs text-warmmuted">
              Memuat daftar pengguna 6 role utama...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-xs text-warmmuted">
              Tidak ada pengguna pada filter role ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sandstone/60 border-b border-warmborder text-[10px] font-extrabold uppercase tracking-wider text-warmmuted">
                  <tr>
                    <th className="px-4 py-3">Nama Pengguna</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status Akun</th>
                    <th className="px-4 py-3 text-right">Pengaturan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmborder/60">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => handleOpenUserDetail(u)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-espresso/10 text-espresso font-extrabold text-xs grid place-items-center shrink-0">
                            {u.name
                              .split(' ')
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-espresso truncate group-hover:text-terracotta transition-colors">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-warmmuted truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            ROLE_BADGE_STYLE[u.role] || 'bg-sandstone text-espresso border-warmborder'
                          }`}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                            u.isActive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sandstone group-hover:bg-espresso group-hover:text-white text-espresso text-[11px] font-extrabold transition-colors">
                          <span>Atur Permission</span>
                          <ChevronRight className="size-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    );
  }

  // =========================================================================
  // STEP 2: HALAMAN KHUSUS ATUR PERMISSION (PER-USER DETAIL / GLOBAL ROLE)
  // =========================================================================
  const isUserMode = viewMode === 'user-detail';

  return (
    <section className="bg-white border border-warmborder rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Back + Target Header + Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-warmborder">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setSelectedUser(null);
            }}
            className="h-9 px-3 rounded-xl border border-warmborder bg-sandstone/70 hover:bg-sandstone text-espresso text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="size-3.5" />
            <span>Kembali</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-espresso truncate">
                {isUserMode
                  ? `Atur Permission: ${selectedUser?.name}`
                  : `Default Global Role: ${ROLE_LABELS[selectedGlobalRole] || selectedGlobalRole}`}
              </h2>
              {isUserMode && selectedUser && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    ROLE_BADGE_STYLE[selectedUser.role] || 'bg-sandstone text-espresso border-warmborder'
                  }`}
                >
                  {selectedUser.role}
                </span>
              )}
            </div>
            <p className="text-xs text-warmmuted truncate">
              {isUserMode
                ? `${selectedUser?.email} · Pengaturan khusus per-user akan menimpa default Global Role.`
                : 'Berlaku untuk seluruh pengguna pada role ini yang belum memiliki override per-user.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loadingMatrix}
          className="px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Save className="size-3.5" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Permission'}</span>
        </button>
      </div>

      {/* Role Switcher when in Global Role mode */}
      {!isUserMode && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {CORE_SIX_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setSelectedGlobalRole(r);
                loadPermissionMatrix('ROLE', r);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                selectedGlobalRole === r
                  ? 'bg-espresso text-white border-espresso'
                  : 'bg-sandstone/50 text-warmmuted border-warmborder hover:text-espresso'
              }`}
            >
              {ROLE_LABELS[r] || r}
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Users className="size-3.5 text-warmmuted mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
              categoryFilter === cat
                ? 'bg-amber-50 text-terracotta border-amber-300'
                : 'bg-white text-warmmuted border-warmborder hover:text-espresso'
            }`}
          >
            {cat === 'ALL' ? `Semua Fitur (${features.length})` : cat}
          </button>
        ))}
      </div>

      {/* Matrix Table */}
      <div className="border border-warmborder rounded-2xl overflow-hidden">
        {loadingMatrix ? (
          <div className="p-10 text-center text-xs text-warmmuted">
            Memuat matriks permission...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sandstone/60 border-b border-warmborder text-[10px] font-extrabold uppercase tracking-wider text-warmmuted">
                <tr>
                  <th className="px-4 py-3">Fitur Platform</th>
                  <th className="px-2 py-3 text-center">Create</th>
                  <th className="px-2 py-3 text-center">Read</th>
                  <th className="px-2 py-3 text-center">Update</th>
                  <th className="px-2 py-3 text-center">Delete</th>
                  <th className="px-4 py-3 text-right">Preset Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmborder/60">
                {filteredFeatures.map((feat) => {
                  const p = matrix[feat.key] || {
                    create: true,
                    read: true,
                    update: true,
                    delete: true,
                  };
                  const isBlocked = !p.create && !p.read && !p.update && !p.delete;
                  return (
                    <tr
                      key={feat.key}
                      className={`hover:bg-sandstone/25 ${isBlocked ? 'bg-rose-50/30' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isBlocked ? (
                            <Lock className="size-3.5 text-rose-500 shrink-0" />
                          ) : (
                            <Unlock className="size-3.5 text-emerald-600 shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-espresso">{feat.label}</p>
                            <p className="text-[10px] text-warmmuted">{feat.category}</p>
                          </div>
                        </div>
                      </td>
                      {(['create', 'read', 'update', 'delete'] as const).map((flag) => (
                        <td key={flag} className="px-2 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={p[flag]}
                            onChange={() => toggleFlag(feat.key, flag)}
                            className="size-4 accent-terracotta cursor-pointer rounded"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreset(feat.key, 'FULL')}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold cursor-pointer"
                          >
                            Full
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreset(feat.key, 'READ_ONLY')}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold cursor-pointer"
                          >
                            Read Only
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreset(feat.key, 'UPDATE_ONLY')}
                            className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold cursor-pointer"
                          >
                            Update Only
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreset(feat.key, 'BLOCK')}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold cursor-pointer"
                          >
                            Nonaktif
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
