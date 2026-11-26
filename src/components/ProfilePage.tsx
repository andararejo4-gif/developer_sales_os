import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import { loadAuthSession, saveAuthSession } from '../lib/auth/dummy-accounts';

interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  projectId: string;
  phone: string;
  totpEnabled: boolean;
  totpVerifiedAt?: string | null;
}

export function ProfilePage({
  onTotpStatusChanged,
}: {
  onTotpStatusChanged?: (enabled: boolean) => void;
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // State Setup TOTP
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disableInput, setDisableInput] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile');
      const json = await res.json();
      if (json.ok && json.data) {
        setProfile(json.data);
        setNameInput(json.data.name || '');
        setPhoneInput(json.data.phone || '');
        const sess = loadAuthSession();
        if (sess && sess.totpEnabled !== json.data.totpEnabled) {
          saveAuthSession({ ...sess, totpEnabled: Boolean(json.data.totpEnabled) });
        }
        onTotpStatusChanged?.(Boolean(json.data.totpEnabled));
      }
    } catch {
      setNotice({ ok: false, text: 'Gagal memuat profil dari server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput, phone: phoneInput }),
      });
      const json = await res.json();
      if (json.ok) {
        setNotice({ ok: true, text: 'Informasi profil berhasil diperbarui.' });
        await fetchProfile();
      } else {
        setNotice({ ok: false, text: json.error || 'Gagal memperbarui profil.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleStartTotpSetup = async () => {
    setBusy(true);
    setNotice(null);
    setRecoveryCodes([]);
    try {
      const res = await fetch('/api/profile/totp/setup', { method: 'POST' });
      const json = await res.json();
      if (json.ok && json.otpauthUri) {
        setSetupSecret(json.secret);
        const dataUrl = await QRCode.toDataURL(json.otpauthUri, { width: 220, margin: 1 });
        setQrDataUrl(dataUrl);
      } else {
        setNotice({ ok: false, text: json.error || 'Gagal menyiapkan QR TOTP.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEnableTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/profile/totp/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      });
      const json = await res.json();
      if (json.ok) {
        setSetupSecret(null);
        setQrDataUrl(null);
        setVerifyCode('');
        setRecoveryCodes(Array.isArray(json.recoveryCodes) ? json.recoveryCodes : []);
        setNotice({
          ok: true,
          text: 'Autentikasi 2 Faktor (TOTP) berhasil diaktifkan! Simpan recovery codes di bawah.',
        });
        await fetchProfile();
      } else {
        setNotice({ ok: false, text: json.error || 'Kode verifikasi salah.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDisableTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/profile/totp/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeOrPassword: disableInput }),
      });
      const json = await res.json();
      if (json.ok) {
        setDisableInput('');
        setRecoveryCodes([]);
        setNotice({ ok: true, text: 'Autentikasi 2 Faktor (TOTP) telah dinonaktifkan.' });
        await fetchProfile();
      } else {
        setNotice({ ok: false, text: json.error || 'Gagal menonaktifkan TOTP.' });
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-warmborder bg-white p-8 text-center text-sm text-warmmuted">
        Memuat pengaturan profil &amp; keamanan akun...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-warmborder bg-white p-6 shadow-xs">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-espresso">
          <User className="h-5 w-5 text-terracotta" />
          Profil &amp; Pengaturan Akun
        </h2>
        <p className="mt-1 text-xs text-warmmuted">
          Kelola identitas akun serta aktivasi keamanan Autentikasi 2 Faktor (Google Authenticator / Authy).
        </p>

        {notice && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold ${
              notice.ok
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice.text}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* KIRI: Informasi Dasar */}
        <form
          onSubmit={handleSaveInfo}
          className="rounded-2xl border border-warmborder bg-white p-6 shadow-xs space-y-4"
        >
          <h3 className="text-sm font-extrabold text-espresso">Informasi Akun</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-warmmuted">Email (Identitas Login)</label>
              <input
                type="text"
                disabled
                value={profile?.email || ''}
                className="mt-1 w-full rounded-xl border border-warmborder bg-sandstone/40 px-3 py-2 font-semibold text-espresso"
              />
            </div>
            <div className={profile?.role === 'SUPERADMIN' || profile?.role === 'SUPERADMIN_IT' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-2 gap-3'}>
              <div>
                <label className="block font-bold text-warmmuted">Role Akses</label>
                <input
                  type="text"
                  disabled
                  value={profile?.role || ''}
                  className="mt-1 w-full rounded-xl border border-warmborder bg-sandstone/40 px-3 py-2 font-semibold text-espresso"
                />
              </div>
              {profile?.role !== 'SUPERADMIN' && profile?.role !== 'SUPERADMIN_IT' && (
                <div>
                  <label className="block font-bold text-warmmuted">Tenant</label>
                  <input
                    type="text"
                    disabled
                    value={profile?.tenantId || ''}
                    className="mt-1 w-full rounded-xl border border-warmborder bg-sandstone/40 px-3 py-2 font-semibold text-espresso"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block font-bold text-espresso">Nama Lengkap</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-warmborder px-3 py-2 font-semibold text-espresso"
              />
            </div>
            <div>
              <label className="block font-bold text-espresso">Nomor WhatsApp</label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+62812..."
                className="mt-1 w-full rounded-xl border border-warmborder px-3 py-2 font-semibold text-espresso"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-espresso px-4 py-2.5 text-xs font-bold text-white hover:bg-espresso/90 disabled:opacity-50"
          >
            Simpan Informasi Profil
          </button>
        </form>

        {/* KANAN: Konfigurasi 2FA TOTP */}
        <div className="rounded-2xl border border-warmborder bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-espresso">
              <KeyRound className="h-4 w-4 text-terracotta" />
              Keamanan 2 Faktor (TOTP Authenticator)
            </h3>
            {profile?.totpEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" /> AKTIF
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-900">
                <ShieldAlert className="h-3.5 w-3.5" /> NONAKTIF
              </span>
            )}
          </div>

          {!profile?.totpEnabled ? (
            !qrDataUrl ? (
              <div className="space-y-3 text-xs text-warmmuted">
                <p className="leading-relaxed">
                  Aktifkan 2FA gratis menggunakan aplikasi <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, atau <strong>Authy</strong> di HP Anda. Setelah aktif, setiap login akan meminta kode 6-digit dari aplikasi tersebut.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleStartTotpSetup}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Aktifkan 2FA (TOTP) Sekarang
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnableTotp} className="space-y-4 text-xs">
                <div className="rounded-xl border border-warmborder bg-sandstone/30 p-4 text-center space-y-3">
                  <p className="font-bold text-espresso">
                    1. Scan QR Code ini di aplikasi Google Authenticator
                  </p>
                  <img
                    src={qrDataUrl}
                    alt="QR Code TOTP"
                    className="mx-auto rounded-lg border border-warmborder bg-white p-2"
                  />
                  {setupSecret && (
                    <div className="flex items-center justify-center gap-2 text-[11px]">
                      <span className="text-warmmuted">Kode Manual:</span>
                      <code className="rounded bg-white px-2 py-1 font-mono font-bold text-espresso border border-warmborder">
                        {setupSecret}
                      </code>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(setupSecret)}
                        className="rounded border border-warmborder bg-white p-1 text-espresso hover:bg-sandstone"
                        title="Salin kode manual"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-espresso">
                    2. Masukkan 6-Digit Kode dari Aplikasi Authenticator
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="mt-1 w-full rounded-xl border border-warmborder px-3 py-2.5 text-center font-mono text-lg font-extrabold tracking-[0.4em] text-espresso"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={busy || verifyCode.length !== 6}
                    className="rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
                  >
                    Verifikasi &amp; Aktifkan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQrDataUrl(null);
                      setSetupSecret(null);
                      setVerifyCode('');
                    }}
                    className="rounded-xl border border-warmborder bg-white px-4 py-2.5 text-xs font-bold text-warmmuted"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="space-y-4 text-xs">
              <p className="text-emerald-900 font-medium">
                Akun Anda sudah terlindungi 2FA TOTP. Setiap kali login, sistem akan meminta kode 6-digit dari Google Authenticator.
              </p>

              {recoveryCodes.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 space-y-2">
                  <p className="font-extrabold text-amber-900">
                    Simpan 6 Recovery Codes Cadangan Ini (Hanya Ditampilkan Sekali):
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-xs font-bold text-espresso">
                    {recoveryCodes.map((c) => (
                      <div key={c} className="rounded bg-white px-2.5 py-1 border border-amber-200 text-center">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleDisableTotp} className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 space-y-2.5">
                <label className="flex items-center gap-1.5 font-bold text-rose-900">
                  <Lock className="h-3.5 w-3.5" />
                  Nonaktifkan 2FA (Masukkan Kode Authenticator atau Kata Sandi)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    required
                    value={disableInput}
                    onChange={(e) => setDisableInput(e.target.value)}
                    placeholder="Kode 6-digit atau kata sandi"
                    className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-rose-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50"
                  >
                    Matikan 2FA
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
