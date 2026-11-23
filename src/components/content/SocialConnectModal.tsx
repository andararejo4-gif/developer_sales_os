import React, { useState } from 'react';
import { CheckCircle2, Loader2, LogIn, Trash2, X, ShieldCheck } from 'lucide-react';

export type SocialPlatformId =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'youtube'
  | 'twitter'
  | 'threads'
  | 'linkedin'
  | 'pinterest';

export interface ConnectedSocialAccount {
  platform: SocialPlatformId;
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
  id: SocialPlatformId;
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
  {
    id: 'twitter',
    name: 'X (Twitter)',
    subtitle: 'Postingan gambar, video & thread properti',
    badgeBg: 'bg-[#0F1419]',
    renderLogo: () => (
      <svg viewBox="0 0 24 24" className="size-5 text-white fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'threads',
    name: 'Threads',
    subtitle: 'Update singkat, foto & carousel Threads',
    badgeBg: 'bg-[#101010]',
    renderLogo: () => (
      <svg viewBox="0 0 24 24" className="size-5 text-white fill-none stroke-current" strokeWidth="2">
        <path d="M12 21a9 9 0 1 1 6.36-2.64M16 12c0-2.5-1.5-4-4-4s-4 1.5-4 4 1.5 4 4 4c1.8 0 3.2-.9 3.7-2.2" />
        <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    subtitle: 'Jaringan profesional, investor & eksekutif',
    badgeBg: 'bg-[#0A66C2]',
    renderLogo: () => (
      <svg viewBox="0 0 24 24" className="size-5 text-white fill-current">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    subtitle: 'Pin inspirasi desain rumah Japandi & properti',
    badgeBg: 'bg-[#E60023]',
    renderLogo: () => (
      <svg viewBox="0 0 24 24" className="size-5 text-white fill-current">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
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

  const handleConnect = async (platform: SocialPlatformId) => {
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
