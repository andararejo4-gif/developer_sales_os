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
import { saveOnboardingProfile } from "../lib/auth/se-management";
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

  // Signup form state (Pendaftar Karyawan Developer & Kuisioner Tim)
  const [applicantRole, setApplicantRole] = useState<'SM' | 'ADMIN' | 'IT' | 'DIREKSI'>('SM');
  const [directorName, setDirectorName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [picName, setPicName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Kuesioner struktur developer
  const [hasInternalSales, setHasInternalSales] = useState(true);
  const [seCountEstimate, setSeCountEstimate] = useState(5);
  const [useExternalBrokers, setUseExternalBrokers] = useState(true);
  const [activeProjectsCount, setActiveProjectsCount] = useState(1);

  // MFA form state
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attemptInfo, setAttemptInfo] = useState<{
    remainingAttempts?: number;
    maxAttempts?: number;
    isLastAttempt?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAttemptInfo(null);
    const result = await loginWithServer(email, password);
    if (!result.ok) {
      setErrorMsg(result.error);
      if (typeof result.remainingAttempts === 'number') {
        setAttemptInfo({
          remainingAttempts: result.remainingAttempts,
          maxAttempts: result.maxAttempts ?? 5,
          isLastAttempt: result.isLastAttempt,
        });
      }
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

    // Simpan profil kuesioner developer
    saveOnboardingProfile({
      companyName,
      applicantName: picName,
      applicantRole,
      directorName: directorName.trim() || 'Direktur Utama',
      email: signupEmail,
      phone: signupPhone,
      hasInternalSales,
      seCountEstimate,
      hasMarketingTeam: true,
      useExternalBrokers,
      activeProjectsCount,
      selectedPlan: 'GROWTH',
      registeredAt: new Date().toISOString(),
    });

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
      <div className={`w-full ${mode === "signup" ? "max-w-xl" : "max-w-md"} bg-white border border-warmborder rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col`}>
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
                  ? "Pendaftaran mandiri oleh staf/manajer operasional & kuesioner tim"
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
            <div
              className={`flex items-start gap-2 p-3 mb-4 rounded-xl border text-xs font-semibold ${
                attemptInfo?.isLastAttempt
                  ? 'bg-amber-50 border-amber-400 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{errorMsg}</span>
                {typeof attemptInfo?.remainingAttempts === 'number' && (
                  <div className="text-[11px] font-bold">
                    {attemptInfo.isLastAttempt
                      ? 'Kesempatan terakhir! 1 percobaan tersisa sebelum akun dikunci sementara 5 menit.'
                      : attemptInfo.remainingAttempts === 0
                        ? 'Akun dikunci sementara selama 5 menit.'
                        : `Sisa percobaan login: ${attemptInfo.remainingAttempts} dari ${attemptInfo.maxAttempts ?? 5}.`}
                  </div>
                )}
              </div>
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
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Box Info: PIC Pendaftar Karyawan */}
              <div className="p-3 rounded-2xl bg-sandstone/60 border border-warmborder space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta block">
                  1. Identitas PIC Pendaftar &amp; Akun Login Anda
                </span>
                <p className="text-[11px] text-warmmuted leading-snug">
                  Direksi tidak perlu mengoperasikan aplikasi sehari-hari. Pilihlah jabatan Anda agar sistem membuka dashboard operasional yang sesuai.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-espresso mb-1.5">
                    Jabatan Anda di Perusahaan *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                    {[
                      { key: 'SM' as const, label: 'Sales Manager (SM)', sub: 'Rekomendasi' },
                      { key: 'ADMIN' as const, label: 'Admin Sales', sub: 'Pemberkasan KPR' },
                      { key: 'IT' as const, label: 'Tim IT / Sistem', sub: 'Setup & Integrasi' },
                      { key: 'DIREKSI' as const, label: 'Owner / Direksi', sub: 'Laporan Eksekutif' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setApplicantRole(item.key)}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          applicantRole === item.key
                            ? 'bg-espresso text-white border-espresso shadow-xs'
                            : 'bg-white text-espresso border-warmborder hover:bg-sandstone'
                        }`}
                      >
                        <span className="font-bold block text-[11px]">{item.label}</span>
                        <span className={`text-[9px] block ${applicantRole === item.key ? 'text-amber-300' : 'text-warmmuted'}`}>
                          {item.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    Nama Direktur Utama / Pemilik PT
                  </label>
                  <div className="relative">
                    <User className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      placeholder="Contoh: Bpk. Bambang Soedirjo"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">
                    Nama Lengkap Anda (PIC Pendaftar) *
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
                      placeholder="Contoh: Ferry Kurniawan"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">
                    Email Bisnis Login Anda *
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
                      placeholder="ferry.sm@developer.com"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none bg-sandstone/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">
                    No. WhatsApp Anda (untuk OTP MFA) *
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
              </div>

              {/* Box Kuesioner Struktur Tim & Kebutuhan Developer */}
              <div className="p-3.5 rounded-2xl bg-sandstone/50 border border-warmborder space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-olive block">
                  2. Kuesioner Struktur Tim &amp; Kebutuhan Operasional
                </span>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block font-semibold text-espresso mb-1">
                      Apakah developer memiliki tim Sales Executive (SE) In-house sendiri?
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHasInternalSales(true)}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium cursor-pointer ${
                          hasInternalSales
                            ? 'bg-olive text-white border-olive font-bold'
                            : 'bg-white text-espresso border-warmborder hover:bg-sandstone'
                        }`}
                      >
                        ✓ Ya, Punya Tim In-House
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasInternalSales(false)}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium cursor-pointer ${
                          !hasInternalSales
                            ? 'bg-olive text-white border-olive font-bold'
                            : 'bg-white text-espresso border-warmborder hover:bg-sandstone'
                        }`}
                      >
                        Hanya Agen Eksternal
                      </button>
                    </div>
                  </div>

                  {hasInternalSales && (
                    <div>
                      <label className="block font-semibold text-espresso mb-1">
                        Perkiraan jumlah Sales Executive (SE) in-house saat ini:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { count: 3, label: '1 - 5 Orang SE' },
                          { count: 10, label: '6 - 15 Orang SE' },
                          { count: 20, label: '> 15 Orang SE' },
                        ].map((tier) => (
                          <button
                            key={tier.count}
                            type="button"
                            onClick={() => setSeCountEstimate(tier.count)}
                            className={`py-1.5 px-2 rounded-lg border text-center text-[11px] cursor-pointer ${
                              seCountEstimate === tier.count
                                ? 'bg-terracotta text-white border-terracotta font-bold'
                                : 'bg-white text-espresso border-warmborder hover:bg-sandstone'
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block font-semibold text-espresso mb-1">
                        Bermitra dengan Agen / Broker Properti Luar?
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseExternalBrokers(!useExternalBrokers)}
                        className={`w-full py-1.5 px-3 rounded-lg border text-left text-[11px] cursor-pointer flex items-center justify-between ${
                          useExternalBrokers
                            ? 'bg-amber-50 border-amber-300 text-espresso font-semibold'
                            : 'bg-white border-warmborder text-warmmuted'
                        }`}
                      >
                        <span>{useExternalBrokers ? '✓ Ya, Aktifkan Portal Agen' : '✗ Tidak, Hanya In-house'}</span>
                      </button>
                    </div>

                    <div>
                      <label className="block font-semibold text-espresso mb-1">
                        Jumlah Proyek Aktif yang Dipasarkan:
                      </label>
                      <select
                        value={activeProjectsCount}
                        onChange={(e) => setActiveProjectsCount(Number(e.target.value))}
                        className="w-full h-8 px-2 rounded-lg border border-warmborder bg-white text-xs font-semibold text-espresso focus:border-terracotta focus:outline-none"
                      >
                        <option value={1}>1 Proyek Utama</option>
                        <option value={3}>2 - 4 Proyek</option>
                        <option value={6}>&gt; 5 Proyek Portofolio</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-terracotta text-white font-bold text-xs hover:bg-terracotta/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-3"
              >
                <UserPlus className="size-4" />
                <span>
                  Daftarkan Developer &amp; Masuk Dashboard {applicantRole === 'SM' ? 'Sales Manager' : applicantRole === 'ADMIN' ? 'Admin' : applicantRole}
                </span>
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
