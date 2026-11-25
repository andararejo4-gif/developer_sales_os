import React, { useCallback, useEffect, useState } from 'react';
import { Users, UserPlus, X, ShieldCheck, CheckCircle2, Ban } from 'lucide-react';
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

interface OrgUserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const BASIC_ROLE_LABELS: Record<string, string> = {
  SE: 'Sales Executive (SE)',
  TL: 'Team Leader (TL)',
  SM: 'Sales Manager (SM)',
  DIREKSI: 'Direksi / Owner',
  ADMIN: 'Admin Sales & Transaksi',
  DIGITAL_MARKETING: 'Digital Marketer',
};

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

export const OrgUserManagementModal: React.FC<OrgUserManagementModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const [users, setUsers] = useState<OrgUserRow[]>([]);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([
    'SE',
    'TL',
    'SM',
    'DIREKSI',
    'ADMIN',
    'DIGITAL_MARKETING',
  ]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('SE');
  const [password, setPassword] = useState('');

  const loadUsers = useCallback(async () => {
    if (!isOpen) return;
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
  }, [isOpen]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (!isOpen) return null;

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
          projectId,
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
      setSuccessMsg(`Akun ${json.user.name} (${json.user.role}) berhasil ditambahkan ke database.`);
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: OrgUserRow) => {
    setError(null);
    try {
      const res = await fetch('/api/org/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: u.id, isActive: !u.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal mengubah status user.');
        return;
      }
      setUsers((prev) =>
        prev.map((row) => (row.id === u.id ? { ...row, isActive: json.isActive } : row))
      );
    } catch {
      setError('Gagal menghubungi server.');
    }
  };

  const activeBasicRolesCount = new Set(
    users.filter((u) => u.isActive && allowedRoles.includes(u.role)).map((u) => u.role)
  ).size;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-warmborder shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-warmborder flex items-center justify-between bg-sandstone/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-terracotta/10 text-terracotta">
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-espresso">
                Manajemen User Tim (6 Role Dasar)
              </h2>
              <p className="text-xs text-warmmuted">
                {projectName} · Cakupan Role Dasar Aktif: {activeBasicRolesCount}/6 Role
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status 6 Role Dasar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {allowedRoles.map((r) => {
              const count = users.filter((u) => u.isActive && u.role === r).length;
              return (
                <div
                  key={r}
                  className={`p-2.5 rounded-xl border text-xs ${
                    count > 0
                      ? 'bg-olive/10 border-olive/30 text-espresso'
                      : 'bg-sandstone/50 border-warmborder text-warmmuted'
                  }`}
                >
                  <div className="font-extrabold">{r}</div>
                  <div className="text-[11px] mt-0.5">{count} user aktif</div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-olive/10 border border-olive/30 text-olive text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4" /> {successMsg}
            </div>
          )}

          {/* Form Tambah User Baru */}
          <form
            onSubmit={handleCreateUser}
            className="bg-sandstone/40 border border-warmborder rounded-2xl p-4 space-y-3"
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso flex items-center gap-1.5">
              <UserPlus className="size-4 text-terracotta" /> Tambah User Baru (Skala 6 Role Dasar)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="font-bold text-espresso block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full h-9 px-3 rounded-lg border border-warmborder bg-white text-espresso"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-espresso block mb-1">Email Login</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.co.id"
                  className="w-full h-9 px-3 rounded-lg border border-warmborder bg-white text-espresso"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-espresso block mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62812..."
                  className="w-full h-9 px-3 rounded-lg border border-warmborder bg-white text-espresso"
                />
              </div>
              <div>
                <label className="font-bold text-espresso block mb-1">Role Dasar</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso font-bold"
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {BASIC_ROLE_LABELS[r] || r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-espresso block mb-1">Kata Sandi Awal</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  minLength={8}
                  className="w-full h-9 px-3 rounded-lg border border-warmborder bg-white text-espresso"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                {submitting ? 'Menyimpan...' : 'Buat Akun User'}
              </button>
            </div>
          </form>

          {/* Daftar User Organisasi */}
          <div className="border border-warmborder rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-sandstone/60 border-b border-warmborder text-xs font-bold text-espresso">
              Daftar Akun Terdaftar di Organisasi ({users.length} User)
            </div>
            {loading ? (
              <div className="p-6 text-center text-xs text-warmmuted">Memuat daftar user...</div>
            ) : (
              <div className="divide-y divide-warmborder">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs hover:bg-sandstone/20"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-espresso">{u.name}</span>
                        <span className="px-2 py-0.5 rounded bg-espresso text-white text-[10px] font-bold">
                          {u.role}
                        </span>
                        {u.totpEnabled && (
                          <span className="px-2 py-0.5 rounded bg-olive/10 text-olive text-[10px] font-bold">
                            2FA Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-warmmuted mt-0.5">
                        {u.email} {u.phone ? `· ${u.phone}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(u)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                        u.isActive
                          ? 'bg-olive/10 text-olive hover:bg-rose-50 hover:text-rose-700'
                          : 'bg-rose-50 text-rose-700 hover:bg-olive/10 hover:text-olive'
                      }`}
                    >
                      {u.isActive ? (
                        <>
                          <CheckCircle2 className="size-3.5" /> Aktif
                        </>
                      ) : (
                        <>
                          <Ban className="size-3.5" /> Nonaktif
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
