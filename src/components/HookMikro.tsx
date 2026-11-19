import React, { useEffect, useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';

export interface HookMikroProps {
  id: string;
  message: string;
  ctaText: string;
  onCtaClick: () => void;
  isFormPage?: boolean;
  userRole?: string;
  cooldownDays?: number;
}

const STORAGE_COOLDOWN_PREFIX = 'devos_hook_cooldown_';
const SESSION_SHOWN_COUNT_KEY = 'devos_hook_session_count';

export const HookMikro: React.FC<HookMikroProps> = ({
  id,
  message,
  ctaText,
  onCtaClick,
  isFormPage = false,
  userRole = 'DEVELOPER_OWNER',
  cooldownDays = 14
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Dilarang tampil pada halaman formulir / kuesioner / wizard
    if (isFormPage) return;

    // 2. Cek Cooldown 14 hari
    const cooldownTimestamp = localStorage.getItem(`${STORAGE_COOLDOWN_PREFIX}${id}`);
    if (cooldownTimestamp) {
      const cooldownEnd = parseInt(cooldownTimestamp, 10);
      if (Date.now() < cooldownEnd) return;
    }

    // 3. Batasi maksimal 2 hook per sesi
    const sessionCount = parseInt(sessionStorage.getItem(SESSION_SHOWN_COUNT_KEY) || '0', 10);
    if (sessionCount >= 2) return;

    // 4. Muncul hanya setelah pengguna terlibat (>= 20 detik)
    const timer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem(SESSION_SHOWN_COUNT_KEY, (sessionCount + 1).toString());
    }, 20000); // 20 detik

    return () => clearTimeout(timer);
  }, [id, isFormPage]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Simpan cooldown 14 hari bila memilih "Nanti saja"
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    localStorage.setItem(`${STORAGE_COOLDOWN_PREFIX}${id}`, (Date.now() + cooldownMs).toString());
  };

  if (!isVisible) return null;

  // Role tidak berwenang membeli (SE/TL) mendapat teks saran ke owner
  const isBuyerRole = userRole === 'DEVELOPER_OWNER' || userRole === 'DIREKSI' || userRole === 'SALES_MANAGER';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-40 max-w-[320px] w-full bg-white border border-warmborder rounded-2xl p-4 shadow-xl text-xs font-sans animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-terracotta font-bold text-[11px]">
          <Sparkles className="size-3.5 text-amber-400" />
          <span>Info Nilai Proyek</span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-warmmuted hover:text-espresso p-0.5 rounded cursor-pointer"
          title="Tutup (Esc)"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <p className="text-espresso font-medium leading-relaxed mb-3 text-[11px]">
        {message}
      </p>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-warmborder/60">
        <button
          onClick={handleDismiss}
          className="text-[11px] font-semibold text-warmmuted hover:text-espresso cursor-pointer"
        >
          Nanti saja
        </button>

        {isBuyerRole ? (
          <button
            onClick={() => {
              setIsVisible(false);
              onCtaClick();
            }}
            className="px-3 py-1.5 rounded-xl bg-terracotta text-white font-bold text-[11px] hover:bg-terracotta/90 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <span>{ctaText}</span>
            <ArrowRight className="size-3" />
          </button>
        ) : (
          <span className="text-[10px] text-warmmuted italic">
            Sarankan ke Owner
          </span>
        )}
      </div>
    </div>
  );
};
