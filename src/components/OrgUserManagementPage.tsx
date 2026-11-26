import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Edit3,
  Trash2,
  Search,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { loadAuthSession } from '../lib/auth/dummy-accounts';

interface OrgUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  projectId: string;
  phone: string | null;
  isActive: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

interface OrgUserManagementPageProps {
  projectId: string;
  projectName: string;
}

const BASIC_ROLE_LABELS: Record<string, string> = {
  IT: 'IT & Sistem (IT)',
  SM: 'Sales Manager (SM)',
  SE: 'Sales Executive (SE)',
  DIREKSI: 'Owner / Direksi',
  ADMIN: 'Admin Sales & Transaksi',
  TL: 'Team Leader (TL)',
};

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

export const OrgUserManagementPage: React.FC<OrgUserManagementPageProps> = ({
  projectId,
  projectName,
}) => {
  const [users, setUsers] = useState<OrgUserRow[]>([]);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([
    'IT',
    'SM',
    'SE',
    'DIREKSI',
    'ADMIN',
    'TL',
  ]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form tambah user
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('SE');
  const [userProjectId, setUserProjectId] = useState(projectId);
  const [password, setPassword] = useState('');

  // State edit inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('SE');
  const [editProjectId, setEditProjectId] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/org/users', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal memuat daftar user.');
        return;
      }
      setUsers(Array.isArray(json.users) ? json.users : []);
      if (Array.isArray(json.allowedRoles) && json.allowedRoles.length > 0) {
        setAllowedRoles(json.allowedRoles);
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/org/users', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          password,
          projectId: userProjectId.trim() || projectId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal membuat user baru.');
        return;
      }
      setUsers((prev) => [json.user, ...prev]);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setShowAddForm(false);
      setSuccessMsg(`Akun ${json.user.name} (${json.user.role}) berhasil ditambahkan.`);
    } catch {
      setError('Gagal menghubungi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (u: OrgUserRow) => {
    setEditingId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPhone(u.phone || '');
    setEditRole(allowedRoles.includes(u.role) ? u.role : 'SE');
    setEditProjectId(u.projectId || projectId);
    setEditIsActive(u.isActive);
    setEditPassword('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleSaveEdit = async (u: OrgUserRow) => {
    if (!editName.trim() || !editEmail.trim()) {
      setError('Nama dan email wajib diisi.');
      return;
    }
    if (editPassword && editPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload: Record<string, any> = {
        userId: u.id,
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || null,
        projectId: editProjectId.trim() || u.projectId,
        isActive: editIsActive,
      };
      if (!['SUPERADMIN', 'SUPERADMIN_IT'].includes(u.role)) {
        payload.role = editRole;
      }
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }
      const res = await fetch('/api/org/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal memperbarui data user.');
        return;
      }
      if (json.user) {
        setUsers((prev) => prev.map((item) => (item.id === u.id ? json.user : item)));
      }
      setEditingId(null);
      setEditPassword('');
      setSuccessMsg(
        editPassword.trim()
          ? `Data & kata sandi ${editName.trim()} berhasil diperbarui.`
          : `Data ${editName.trim()} berhasil diperbarui.`
      );
    } catch {
      setError('Gagal menghubungi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u: OrgUserRow) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/org/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: u.id, isActive: !u.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal memperbarui status user.');
        return;
      }
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isActive: Boolean(json.isActive) } : item))
      );
      setSuccessMsg(`Status akun ${u.name} diubah menjadi ${json.isActive ? 'Aktif' : 'Nonaktif'}.`);
    } catch {
      setError('Gagal menghubungi server.');
    }
  };

  const handleDeleteUser = async (u: OrgUserRow) => {
    if (!window.confirm(`Hapus permanen user "${u.name}" (${u.email})?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/org/users?id=${encodeURIComponent(u.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal menghapus user.');
        return;
      }
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      setSuccessMsg(`Akun ${u.name} telah dihapus.`);
    } catch {
      setError('Gagal menghubungi server.');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = filterRole === 'ALL' || u.role.toUpperCase() === filterRole;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, filterRole, searchTerm]);

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-12 rounded-2xl bg-terracotta/10 border border-terracotta/20 flex items-center justify-center shrink-0">
              <Users className="size-6 text-terracotta" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-espresso">
                  Manajemen User Organisasi (6 Role Utama)
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-olive/10 text-olive text-[11px] font-bold border border-olive/20">
                  <ShieldCheck className="size-3" /> CRUD Lengkap · DB Asli
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-1">
                {projectName} · Kelola akun tim (IT, SM, SE, Owner/Direksi, Admin, TL), ubah role, reset kata sandi, dan status akses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadUsers}
              className="h-10 px-3 rounded-xl border border-warmborder bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="h-10 px-4 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
            >
              <UserPlus className="size-4" /> {showAddForm ? 'Tutup Form' : 'Tambah User Baru'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Akun Terdaftar</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {users.length} <span className="text-xs font-normal text-warmmuted">User</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Akun Aktif</span>
          <span className="text-xl font-bold text-olive mt-1 block tabular-nums">
            {activeCount} <span className="text-xs font-normal text-olive">Aktif</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Akun Dinonaktifkan</span>
          <span className="text-xl font-bold text-terracotta mt-1 block tabular-nums">
            {inactiveCount} <span className="text-xs font-normal text-terracotta">Nonaktif</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">6 Role Utama</span>
          <span className="text-xs font-bold text-espresso mt-2 block">
            IT · SM · SE · Owner · Admin · TL
          </span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="px-4 py-3 rounded-xl bg-olive/10 border border-olive/30 text-olive text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Tambah User */}
      {showAddForm && (
        <form
          onSubmit={handleCreateUser}
          className="bg-white border-2 border-terracotta/30 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2 pb-3 border-b border-warmborder">
            <UserPlus className="size-4 text-terracotta" /> Daftarkan User Baru
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="font-bold text-espresso block mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-espresso block mb-1">Email Login *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="budi@andararejomakmur.co.id"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-espresso block mb-1">Role (6 Role Utama) *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso font-bold"
              >
                {allowedRoles.map((r) => (
                  <option key={r} value={r}>
                    {BASIC_ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-espresso block mb-1">No. WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62812..."
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso"
              />
            </div>
            <div>
              <label className="font-bold text-espresso block mb-1">ID Proyek Default</label>
              <input
                type="text"
                value={userProjectId}
                onChange={(e) => setUserProjectId(e.target.value)}
                placeholder="the-park-sukoharjo"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso"
              />
            </div>
            <div>
              <label className="font-bold text-espresso block mb-1">Kata Sandi Awal (min. 8 karakter) *</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-warmborder">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-espresso cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Simpan User Baru'}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search */}
      <div className="bg-white border border-warmborder rounded-2xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 bg-sandstone/70 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setFilterRole('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
              filterRole === 'ALL' ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
            }`}
          >
            Semua ({users.length})
          </button>
          {allowedRoles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                filterRole === r ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              {r === 'DIREKSI' ? 'OWNER' : r} ({users.filter((u) => u.role.toUpperCase() === r).length})
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="size-4 text-warmmuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, email, atau WA..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-warmborder bg-sandstone text-xs font-medium text-espresso"
          />
        </div>
      </div>

      {/* Daftar User */}
      <div className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sandstone/70 border-b border-warmborder text-[11px] font-black uppercase tracking-wider text-warmmuted">
              <tr>
                <th className="py-3 px-4">Nama &amp; Email</th>
                <th className="py-3 px-4">Role &amp; Proyek</th>
                <th className="py-3 px-4">WhatsApp &amp; 2FA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi CRUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-warmmuted">
                    Memuat daftar user dari database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-warmmuted">
                    Tidak ada user yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSuper = ['SUPERADMIN', 'SUPERADMIN_IT'].includes(u.role);
                  const isEditing = editingId === u.id;
                  return (
                    <React.Fragment key={u.id}>
                      <tr className="hover:bg-sandstone/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-espresso">{u.name}</div>
                          <div className="text-[11px] text-warmmuted">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-espresso text-white text-[10px] font-bold">
                            {BASIC_ROLE_LABELS[u.role] || u.role}
                          </span>
                          <div className="text-[11px] text-warmmuted mt-1">{u.projectId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-espresso font-medium">{u.phone || '-'}</div>
                          <div className="text-[11px] text-warmmuted">
                            {u.totpEnabled ? '2FA TOTP Aktif' : '2FA Belum Aktif'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.isActive
                                ? 'bg-olive/10 text-olive border-olive/30'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {u.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => (isEditing ? setEditingId(null) : startEdit(u))}
                              className="h-8 px-2.5 rounded-lg bg-sandstone hover:bg-warmborder text-espresso font-bold flex items-center gap-1 cursor-pointer"
                              title="Edit Data & Kata Sandi"
                            >
                              <Edit3 className="size-3.5" /> {isEditing ? 'Tutup' : 'Edit'}
                            </button>
                            {!isSuper && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(u)}
                                  className={`h-8 px-2.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                                    u.isActive
                                      ? 'bg-amber-50 hover:bg-amber-100 text-terracotta'
                                      : 'bg-olive/10 hover:bg-olive/20 text-olive'
                                  }`}
                                  title={u.isActive ? 'Nonaktifkan User' : 'Aktifkan User'}
                                >
                                  {u.isActive ? (
                                    <Ban className="size-3.5" />
                                  ) : (
                                    <CheckCircle2 className="size-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="h-8 px-2.5 rounded-lg bg-sandstone hover:bg-rose-100 text-warmmuted hover:text-rose-700 cursor-pointer"
                                  title="Hapus User"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isEditing && (
                        <tr className="bg-sandstone/40">
                          <td colSpan={5} className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                              <div>
                                <label className="font-bold text-espresso block mb-1">Nama Lengkap</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso font-medium"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-espresso block mb-1">Email</label>
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-espresso block mb-1">No. WhatsApp</label>
                                <input
                                  type="text"
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-espresso block mb-1">Role</label>
                                <select
                                  value={editRole}
                                  disabled={isSuper}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso font-bold disabled:opacity-60"
                                >
                                  {allowedRoles.map((r) => (
                                    <option key={r} value={r}>
                                      {BASIC_ROLE_LABELS[r] || r}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="font-bold text-espresso block mb-1">ID Proyek</label>
                                <input
                                  type="text"
                                  value={editProjectId}
                                  onChange={(e) => setEditProjectId(e.target.value)}
                                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-espresso block mb-1">Status Akun</label>
                                <select
                                  value={editIsActive ? 'ACTIVE' : 'INACTIVE'}
                                  onChange={(e) => setEditIsActive(e.target.value === 'ACTIVE')}
                                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso font-bold"
                                >
                                  <option value="ACTIVE">Aktif</option>
                                  <option value="INACTIVE">Nonaktif</option>
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="font-bold text-espresso flex items-center gap-1 mb-1">
                                  <KeyRound className="size-3 text-terracotta" /> Ubah Kata Sandi Baru (opsional, min. 8 karakter)
                                </label>
                                <input
                                  type="password"
                                  value={editPassword}
                                  onChange={(e) => setEditPassword(e.target.value)}
                                  placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso"
                                />
                              </div>
                              <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="h-8 px-3 rounded-lg border border-warmborder bg-white text-espresso font-bold cursor-pointer"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => handleSaveEdit(u)}
                                  className="h-8 px-4 rounded-lg bg-olive text-white font-bold cursor-pointer disabled:opacity-50"
                                >
                                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
