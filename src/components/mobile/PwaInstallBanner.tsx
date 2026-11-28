import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'dsos_pwa_install_dismissed_until';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as any).standalone);
    if (isStandalone) return;

    const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() < until) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = isIos && /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);

    if (isSafari) {
      setShowIosTip(true);
      setDismissed(false);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (dismissed || (!deferredPrompt && !showIosTip)) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setDismissed(true);
  };

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-20 md:bottom-5 inset-x-3 md:left-auto md:right-5 md:max-w-sm z-40">
      <div className="bg-espresso text-white rounded-2xl shadow-xl border border-white/15 px-4 py-3 flex items-center gap-3">
        <div className="size-9 rounded-xl bg-terracotta flex items-center justify-center shrink-0">
          {showIosTip ? <Share className="size-4" /> : <Download className="size-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold">Pasang DevSalesOS di HP</div>
          <p className="text-[11px] text-white/75 leading-snug mt-0.5">
            {showIosTip
              ? 'Di Safari, tekan tombol Share lalu pilih "Add to Home Screen" untuk akses layar penuh.'
              : 'Akses lebih cepat & hemat kuota langsung dari layar utama Android.'}
          </p>
        </div>
        {!showIosTip && (
          <button
            type="button"
            onClick={handleInstallAndroid}
            className="px-3 py-1.5 rounded-lg bg-terracotta text-white text-[11px] font-bold shrink-0 cursor-pointer"
          >
            Pasang
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup banner instalasi"
          className="p-1 text-white/60 hover:text-white cursor-pointer shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};
