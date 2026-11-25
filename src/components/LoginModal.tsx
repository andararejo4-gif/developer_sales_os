import React, { useState } from "react";
import {
  X,
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  User,
  Phone,
  UserPlus,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import {
  loginWithServer,
  registerWithServer,
  verifyMfaWithServer,
  type MfaChallenge,
} from "../lib/auth/dummy-accounts";
import type { RoleKey } from "../data";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (role: RoleKey) => void;
  defaultMode?: "login" | "signup";
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  defaultMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "signup" | "mfa">(defaultMode);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Signup form state
  const [companyName, setCompanyName] = useState("");
  const [picName, setPicName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // MFA form state
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const result = await loginWithServer(email, password);
    if (!result.ok) {
      setErrorMsg(result.error);
      return;
    }

    if (!result.requiresMfa) {
      if (onSuccessLogin) onSuccessLogin(result.session.role);
      onClose();
      return;
    }

    setMfaChallenge(result.challenge);
    setMode("mfa");
    setOtpCode("");
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const result = await registerWithServer({
      companyName,
      name: picName,
      email: signupEmail,
      phone: signupPhone,
      password: signupPassword,
    });

    if (!result.ok) {
      setErrorMsg(result.error);
      return;
    }

    if (!result.requiresMfa) {
      if (onSuccessLogin) onSuccessLogin(result.session.role);
      onClose();
      return;
    }

    setMfaChallenge(result.challenge);
    setMode("mfa");
    setOtpCode("");
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge) return;

    const res = await verifyMfaWithServer(mfaChallenge.challengeId, otpCode);
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setErrorMsg(null);
    if (onSuccessLogin) {
      onSuccessLogin(res.session.role);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-warmborder rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header Clean dengan Tab Switcher */}
        <div className="p-5 border-b border-warmborder bg-sandstone/40 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold text-espresso tracking-tight">
                {mode === "login"
                  ? "Masuk ke Developer Sales OS"
                  : mode === "signup"
                  ? "Daftar Akun Developer Baru"
                  : "Verifikasi 2 Langkah (MFA)"}
              </h2>
              <p className="text-[11px] text-warmmuted">
                {mode === "login"
                  ? "Akses dashboard penjualan & operasional proyek"
                  : mode === "signup"
                  ? "Registrasi mandiri untuk memulai demo sistem"
                  : "Perlindungan tambahan yang Anda aktifkan di Profil"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-warmmuted hover:text-espresso hover:bg-white transition-colors cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs (hanya tampil jika bukan di layar MFA) */}
          {mode !== "mfa" ? (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-white border border-warmborder text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                }}
                className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "login"
                    ? "bg-terracotta text-white shadow-xs"
                    : "text-warmmuted hover:text-espresso"
                }`}
              >
                <LogIn className="size-3.5" />
                <span>Masuk</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg(null);
                }}
                className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "signup"
                    ? "bg-terracotta text-white shadow-xs"
                    : "text-warmmuted hover:text-espresso"
                }`}
              >
                <UserPlus className="size-3.5" />
                <span>Daftar Baru</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
              <span>2FA aktif pada akun ini</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === "mfa" && mfaChallenge ? (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder text-center space-y-2">
                <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <KeyRound className="size-5" />
                </div>
                <h3 className="text-xs font-extrabold text-espresso">
                  Verifikasi 2 Faktor (Google Authenticator / TOTP)
                </h3>
                <p className="text-[11px] text-warmmuted">
                  Akun Anda telah mengaktifkan TOTP. Masukkan 6-digit kode dari aplikasi Authenticator (atau recovery code) untuk akun:
                </p>
                <p className="text-xs font-mono font-bold text-espresso bg-white px-3 py-1 rounded-lg border border-warmborder inline-block">
                  {mfaChallenge.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1 text-center">
                  Kode Authenticator 6-Digit / Recovery Code *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={12}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.toUpperCase());
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="000000"
                  className="w-full h-12 rounded-xl border border-warmborder text-center text-xl font-mono font-bold tracking-widest focus:border-terracotta focus:outline-none bg-sandstone/30"
                />
              </div>

              <div className="flex items-center justify-end text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                  }}
                  className="text-warmmuted hover:text-espresso font-semibold cursor-pointer"
                >
                  Kembali ke Login
                </button>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-terracotta text-white font-bold text-xs hover:bg-terracotta/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-3"
              >
                <ShieldCheck className="size-4" />
                <span>Verifikasi &amp; Masuk Dashboard</span>
              </button>
            </form>
          ) : mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1">
                  Email Terdaftar
                </label>
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
                    placeholder="nama@perusahaan.com"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Masukkan kata sandi"
                    className="w-full h-10 pl-9 pr-9 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warmmuted hover:text-espresso p-1 cursor-pointer"
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Lihat kata sandi"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg(null);
                  }}
                  className="text-xs text-warmmuted hover:text-terracotta font-medium transition-colors cursor-pointer"
                >
                  Belum punya akun?{" "}
                  <strong className="text-terracotta underline">
                    Daftar Developer Baru
                  </strong>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1">
                  Nama Perusahaan / PT Developer *
                </label>
                <div className="relative">
                  <Building2 className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Contoh: PT Graha Sentosa Mandiri"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">
                  Nama Pemilik / Direktur *
                </label>
                <div className="relative">
                  <User className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={picName}
                    onChange={(e) => {
                      setPicName(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Contoh: Bpk. Bambang Soedirjo"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">
                    Email Bisnis *
                  </label>
                  <div className="relative">
                    <Mail className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="owner@developer.com"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">
                    No. WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={signupPhone}
                      onChange={(e) => {
                        setSignupPhone(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="08123456789"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">
                  Kata Sandi Baru *
                </label>
                <div className="relative">
                  <Lock className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Minimal 6 karakter"
                    className="w-full h-10 pl-9 pr-9 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warmmuted hover:text-espresso p-1 cursor-pointer"
                    aria-label={
                      showSignupPassword
                        ? "Sembunyikan kata sandi"
                        : "Lihat kata sandi"
                    }
                  >
                    {showSignupPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-terracotta text-white font-bold text-xs hover:bg-terracotta/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-3"
              >
                <UserPlus className="size-4" />
                <span>Daftar &amp; Masuk Dashboard</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                  }}
                  className="text-xs text-warmmuted hover:text-terracotta font-medium transition-colors cursor-pointer"
                >
                  Sudah punya akun?{" "}
                  <strong className="text-terracotta underline">
                    Masuk di sini
                  </strong>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Clean */}
        <div className="p-3 bg-sandstone/40 border-t border-warmborder text-center text-[11px] text-warmmuted shrink-0 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>Developer Sales OS &middot; Mendukung Verifikasi Dua Langkah (2FA)</span>
        </div>
      </div>
    </div>
  );
};
