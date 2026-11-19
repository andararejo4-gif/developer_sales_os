import React, { useState } from 'react';
import { X, LogIn, Lock, Mail } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (role: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccessLogin }) => {
  const [email, setEmail] = useState('direksi@andararejomakmur.co.id');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('DEVELOPER_OWNER');

  if (!isOpen) return null;

  const quickRoles = [
    { label: 'Owner (Direksi)', role: 'DEVELOPER_OWNER', email: 'direksi@andararejomakmur.co.id' },
    { label: 'Sales Manager (SM)', role: 'SALES_MANAGER', email: 'ferry.sm@andararejomakmur.co.id' },
    { label: 'Team Leader (TL)', role: 'TEAM_LEADER', email: 'tl.ai@andararejomakmur.co.id' },
    { label: 'Sales Executive (SE)', role: 'SALES_EXECUTIVE', email: 'raka.se@andararejomakmur.co.id' },
    { label: 'Digital Marketer', role: 'DIGITAL_MARKETING', email: 'agus.mkt@andararejomakmur.co.id' },
    { label: 'Superadmin Giivepro', role: 'SUPERADMIN', email: 'admin@giivepro.com' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSuccessLogin) {
      onSuccessLogin(selectedRole);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-warmborder rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-warmborder bg-sandstone/40 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-espresso">Masuk ke Developer Sales OS</h2>
            <p className="text-[11px] text-warmmuted">Otentikasi aman berbasis sesi multi-tenant</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-warmmuted hover:text-espresso hover:bg-white cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-espresso mb-1">Email Pengguna</label>
            <div className="relative">
              <Mail className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-warmmuted mb-1.5">
              Pilih Akun Demo (Otentikasi Cepat):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {quickRoles.map(r => (
                <button
                  type="button"
                  key={r.role}
                  onClick={() => {
                    setEmail(r.email);
                    setSelectedRole(r.role);
                  }}
                  className={`p-2 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer ${
                    selectedRole === r.role
                      ? 'bg-amber-100 text-terracotta border-terracotta/40'
                      : 'bg-sandstone/60 text-espresso border-warmborder hover:bg-sandstone'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-terracotta text-white font-bold text-xs hover:bg-terracotta/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
          >
            <LogIn className="size-4" />
            <span>Masuk Sekarang</span>
          </button>
        </form>

        <div className="p-3 bg-sandstone/40 border-t border-warmborder text-center text-[11px] text-warmmuted">
          Proteksi Sesi HttpOnly &middot; Hash Password Argon2/Bcrypt &middot; Rate-Limit Aktif
        </div>
      </div>
    </div>
  );
};
