import React, { useState } from 'react';
import { CheckCircle2, Loader2, LogIn, Trash2, X, ShieldCheck } from 'lucide-react';

export interface ConnectedSocialAccount {
  platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube';
  zernio_key_index?: number;
  zernio_account_id: string;
  account_username?: string;
  status: string;
  connected_at?: string;
}

interface SocialConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ConnectedSocialAccount[];
  maxAccounts: number;
  userEmail: string;
  userRole: string;
  onAccountsChanged: () => Promise<void> | void;
}

const PLATFORM_CARDS: Array<{
  id: 'instagram' | 'tiktok' | 'facebook' | 'youtube';
  name: string;
  subtitle: string;
  badgeBg: string;
  renderLogo: () => React.ReactNode;
}> = [
  {
    id: 'instagram',
    name: 'Instagram',
    subtitle: 'Carousel Edukasi, Poster & Reels (Business/Creator)',
    badgeBg: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    renderLogo: () => (
      <svg viewBox="0 0 24 24" className="size-6 text-white fill-none stroke-current" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    subtitle: 'Reels / Video Vertikal 9:16 & Postingan Harian',
    badgeBg: 'bg-[#111111]',
    renderLogo: () => (
      <svg viewBox="0 0 24 24" className="size-6 text-white fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook Page',
    subtitle: 'Poster, Carousel & Video ke Halaman Facebook',
    badgeBg: 'bg-[#1877F2]',
    renderLogo: () => (
      <svg viewBox="0 0 24 24" className="size-6 text-white fill-current">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    subtitle: 'Video Pendek Vertikal & Channel YouTube',
    badgeBg: 'bg-[#FF0000]',
    renderLogo: () => (
      <svg viewBox="0 0 24 24" className="size-6 text-white fill-current">
        <path d="M23.5 6.2a3.01 3.01 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3.01 3.01 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3.01 3.01 0 0 0 2.12 2.13c1.88.57 9.38.57 9.38.57s7.5 0 9.38-.57a3.01 3.01 0 0 0 2.12-2.13A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z" />
      </svg>
    ),
  },
];

export const SocialConnectModal: React.FC<SocialConnectModalProps> = ({
  isOpen,
  onClose,
  accounts,
  maxAccounts,
  userEmail,
  userRole,
  onAccountsChanged,
}) => {
  const [busyPlatform, setBusyPlatform] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube') => {
    setBusyPlatform(platform);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/se/social/connect?platform=${encodeURIComponent(platform)}`, {
        headers: {
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.authUrl) {
        setErrorMsg(data.error || 'Gagal membuat tautan login sosial media.');
        setBusyPlatform(null);
        return;
      }
      const popup = window.open(data.authUrl, 'zernio_oauth', 'width=620,height=740');
      if (!popup) {
        window.location.href = data.authUrl;
        return;
      }
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setBusyPlatform(null);
          void onAccountsChanged();
        }
      }, 600);
    } catch {
      setErrorMsg('Koneksi ke server gagal saat menghubungkan akun.');
      setBusyPlatform(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    setBusyPlatform(platform);
    setErrorMsg(null);
    try {
      await fetch(`/api/se/social/accounts?platform=${encodeURIComponent(platform)}`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
        },
      });
      await onAccountsChanged();
    } catch {
      setErrorMsg('Gagal memutuskan akun.');
    } finally {
      setBusyPlatform(null);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-espresso/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-warmborder max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 bg-sandstone border-b border-warmborder flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-espresso">Akun Social Media Terhubung</h3>
              <span className="px-2 py-0.5 rounded-full bg-espresso text-white text-[11px] font-bold">
                {accounts.length} / {maxAccounts} Akun
              </span>
            </div>
            <p className="text-xs text-warmmuted mt-0.5">
              Login ke akun sosmed Anda untuk mengaktifkan tombol <strong>Posting ke Social Media Sekarang</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-xl bg-white border border-warmborder text-espresso hover:bg-warmborder/30 grid place-items-center cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          {PLATFORM_CARDS.map((p) => {
            const connected = accounts.find((a) => a.platform === p.id);
            const isBusy = busyPlatform === p.id;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  connected ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#FBF9F5] border-warmborder'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`size-11 rounded-2xl ${p.badgeBg} grid place-items-center shrink-0 shadow-xs`}>
                    {p.renderLogo()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-espresso">{p.name}</p>
                      {connected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                          <CheckCircle2 className="size-3" />
                          {connected.account_username ? `@${connected.account_username}` : 'Terhubung'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-warmmuted truncate">{p.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {connected ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDisconnect(p.id)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      <span>Putuskan</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy || accounts.length >= maxAccounts}
                      onClick={() => handleConnect(p.id)}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : <LogIn className="size-3.5" />}
                      <span>{isBusy ? 'Membuka...' : 'Login & Hubungkan'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldCheck className="size-4 text-terracotta shrink-0 mt-0.5" />
            <span>
              <strong>Aman &amp; Terisolasi Per Akun SE:</strong> Posting hanya berjalan saat Anda menekan tombol{' '}
              <strong>Posting ke Social Media Sekarang</strong> (tidak pernah memposting otomatis tanpa persetujuan Anda).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
