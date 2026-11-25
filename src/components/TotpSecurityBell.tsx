import { useState } from 'react';
import { Bell, ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react';

export function TotpSecurityBell({
  totpEnabled,
  onOpenProfile,
}: {
  totpEnabled?: boolean;
  onOpenProfile: () => void;
}) {
  const [open, setOpen] = useState(false);
  const needsSetup = totpEnabled !== true;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative h-10 w-10 rounded-xl border border-warmborder bg-white hover:bg-sandstone grid place-items-center text-espresso transition-colors cursor-pointer"
        title="Notifikasi Keamanan Akun"
      >
        <Bell className="size-4" />
        {needsSetup && (
          <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-amber-500 px-1 text-[10px] font-black text-white grid place-items-center">
            1
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-warmborder bg-white p-3.5 shadow-xl z-50 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-extrabold text-espresso">
            <span>Notifikasi Keamanan</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] text-warmmuted hover:text-espresso"
            >
              Tutup
            </button>
          </div>

          {needsSetup ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700" />
                <span>Rekomendasi: Aktifkan 2FA (TOTP)</span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                Lindungi akun Anda gratis dengan Google Authenticator. Klik untuk mengatur di halaman Profil.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenProfile();
                }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-espresso px-3 py-2 text-[11px] font-bold text-white hover:bg-espresso/90"
              >
                <span>Buka Profil &amp; Aktifkan TOTP</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
              <span>2FA (TOTP Authenticator) sudah aktif pada akun Anda.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
