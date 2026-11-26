import React, { useState } from 'react';
import { UserPlus, X, Mail, Phone, Lock, Building2, ShieldCheck } from 'lucide-react';
import type { RoleKey } from '../../data';
import {
  IT_MANAGEABLE_ROLES,
  addDeveloperUser,
  type DeveloperTeamUser,
} from '../../lib/auth/developer-user-management';

interface AddDeveloperUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: DeveloperTeamUser) => void;
  developerCompany: string;
  projectOptions?: { id: string; nama: string }[];
  itUserName?: string;
}

export const AddDeveloperUserModal: React.FC<AddDeveloperUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  developerCompany,
  projectOptions = [],
  itUserName = 'Dodi Hartono (IT)',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<RoleKey>('SE');
  const [assignedProject, setAssignedProject] = useState(
    projectOptions[0]?.nama || 'Semua Proyek Portofolio'
  );
  const [password, setPassword] = useState('AndaraSE#2026');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: RoleKey) => {
    setRole(newRole);
    setPassword(`Andara${newRole}#2026`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = addDeveloperUser({
      name,
      email,
      phone,
      role,
      developerCompany,
      assignedProjectName: assignedProject,
      password,
      createdBy: itUserName,
    });

    if (!result.ok) {
      setErrorMsg(result.error || 'Gagal menambahkan akun.');
      return;
    }

    onSuccess(result.user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-warmborder rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-5 border-b border-warmborder bg-sandstone/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-sandstone flex items-center justify-center border border-warmborder text-espresso">
              <UserPlus className="size-4.5 text-terracotta" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-espresso">
                Tambah Akun Personel Developer (SE s.d. Direksi)
              </h2>
              <p className="text-[11px] text-warmmuted">
                Otoritas IT Developer &middot; Terisolasi untuk <strong>{developerCompany}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Scope Isolation Banner */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-amber-600 shrink-0" />
            <div className="text-[11px] leading-tight">
              <strong>Isolasi Tenant Terjaga:</strong> Anda sedang menambahkan personel khusus untuk{' '}
              <strong className="underline">{developerCompany}</strong>. Pengguna ini tidak akan memiliki akses ke developer lain.
            </div>
          </div>

          {/* Role Selector Cards */}
          <div>
            <label className="block font-bold text-espresso mb-1.5">
              Pilih Role Jabatan Akun Baru *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {IT_MANAGEABLE_ROLES.map((r) => {
                const isSelected = role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleRoleChange(r.role)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-espresso text-white border-espresso shadow-xs'
                        : 'bg-sandstone/30 border-warmborder text-espresso hover:bg-sandstone'
                    }`}
                  >
                    <span className="font-extrabold text-xs block">{r.role}</span>
                    <span
                      className={`text-[10px] block truncate font-medium ${
                        isSelected ? 'text-amber-300' : 'text-warmmuted'
                      }`}
                    >
                      {r.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-espresso block mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Rian Gunawan"
                className="w-full h-9 px-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-medium focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-espresso block mb-1">Nomor WhatsApp Aktif *</label>
              <div className="relative">
                <Phone className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-medium focus:border-terracotta focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-espresso block mb-1">Email Bisnis (Login ID) *</label>
              <div className="relative">
                <Mail className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rian@andararejomakmur.co.id"
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-medium focus:border-terracotta focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-espresso block mb-1">Penugasan Proyek *</label>
              <div className="relative">
                <Building2 className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={assignedProject}
                  onChange={(e) => setAssignedProject(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-medium focus:border-terracotta focus:outline-none cursor-pointer"
                >
                  <option value="Semua Proyek Portofolio">Semua Proyek Portofolio</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.nama}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-espresso block mb-1">Kata Sandi Akun Awal *</label>
            <div className="relative">
              <Lock className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-mono font-medium focus:border-terracotta focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-warmmuted mt-1">
              Pengguna dapat mengubah kata sandi mandiri setelah login pertama &amp; verifikasi WhatsApp OTP.
            </p>
          </div>

          <div className="pt-3 border-t border-warmborder flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-warmborder text-xs font-bold text-warmmuted hover:bg-sandstone cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="size-3.5" />
              <span>Terbitkan Akun {role}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
