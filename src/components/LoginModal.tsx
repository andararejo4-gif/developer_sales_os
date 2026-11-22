import React, { useState } from 'react';
import { X, LogIn, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import {
  authenticateDummyUser,
  saveAuthSession,
} from '../lib/auth/dummy-accounts';
import type { RoleKey } from '../data';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (role: RoleKey) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccessLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = authenticateDummyUser(email, password);
    if (!result.ok) {
      setErrorMsg(result.error);
      return;
    }

    setErrorMsg(null);
    saveAuthSession(result.session);
    if (onSuccessLogin) {
      onSuccessLogin(result.session.role);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-warmborder rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-warmborder bg-sandstone/40 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold text-espresso">Masuk ke Developer Sales OS</h2>
            <p className="text-[11px] text-warmmuted">Otentikasi sesi per role (PT Andara Rejo Makmur)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-warmmuted hover:text-espresso hover:bg-white cursor-pointer"
            aria-label="Tutup modal login"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-espresso mb-1">Email Pengguna</label>
            <div className="relative">
              <Mail className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="nama@andararejomakmur.co.id"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Masukkan kata sandi"
                className="w-full h-10 pl-9 pr-9 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warmmuted hover:text-espresso p-1 cursor-pointer"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
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

        <div className="p-3 bg-sandstone/40 border-t border-warmborder text-center text-[11px] text-warmmuted shrink-0">
          Login diverifikasi sesuai role akun &middot; Sesi tersimpan di browser
        </div>
      </div>
    </div>
  );
};
