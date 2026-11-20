import React, { useEffect, useState } from 'react';
import { Compass, Layers, Map, Menu, Search, Sliders, X } from 'lucide-react';

export interface ChapterItem {
  num: string;
  id: string;
  label: string;
  shortLabel: string;
}

export const V3_CHAPTERS: ChapterItem[] = [
  { num: '01', id: 'bab-pembuka', label: 'Pembuka & Arsitektur', shortLabel: 'Mulai' },
  { num: '02', id: 'studi-kasus', label: 'Studi Kasus 30 Unit', shortLabel: 'Kasus' },
  { num: '03', id: 'alur-6-langkah', label: 'Rel 6 Langkah', shortLabel: 'Alur' },
  { num: '04', id: 'peta-demo', label: 'Peta Radius 25 km', shortLabel: 'Peta' },
  { num: '05', id: 'peran-ai', label: 'Swimlane Peran AI', shortLabel: 'Peran' },
  { num: '06', id: 'paket-harga', label: 'Konfigurator Paket', shortLabel: 'Paket' },
  { num: '07', id: 'dokumentasi-faq', label: 'Indeks FAQ', shortLabel: 'FAQ' },
];

interface RailNavV3Props {
  onOpenCommandPalette: () => void;
  onOpenWizard: () => void;
  onOpenLogin: () => void;
  onScrollTo: (sectionId: string) => void;
}

export const RailNavV3: React.FC<RailNavV3Props> = ({
  onOpenCommandPalette,
  onOpenWizard,
  onOpenLogin,
  onScrollTo,
}) => {
  const [activeId, setActiveId] = useState<string>('bab-pembuka');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)) : 0;
      setScrollProgress(pct);

      const triggerY = window.scrollY + window.innerHeight * 0.32;
      let current = V3_CHAPTERS[0].id;
      for (const ch of V3_CHAPTERS) {
        const el = document.getElementById(ch.id);
        if (el && el.offsetTop <= triggerY) {
          current = ch.id;
        }
      }
      setActiveId(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const jumpTo = (id: string) => {
    setDrawerOpen(false);
    onScrollTo(id);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP & TABLET STICKY TOP CHAPTER NAVBAR (sm:block)     */}
      {/* ========================================================= */}
      <header className="hidden sm:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#CFE1D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <a href="/" className="flex items-center gap-2.5 min-h-[44px] shrink-0">
            <div className="size-8 rounded-lg bg-[#0B3D2E] text-[#C6F432] grid place-items-center font-display-v3 font-extrabold text-xs tracking-tight shrink-0">
              GP
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-v3 font-extrabold text-sm lg:text-base text-[#0B3D2E] tracking-tight whitespace-nowrap">
                Developer Sales OS
              </span>
              <span className="hidden xl:inline-block text-[11px] font-mono text-[#3B5E50]">
                / giivepro
              </span>
            </div>
          </a>

          {/* Center Chapter Scroll-Spy Index */}
          <nav
            aria-label="Navigasi bab utama"
            className="flex items-center gap-1 overflow-x-auto py-1"
          >
            {V3_CHAPTERS.map((ch) => {
              const isActive = activeId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => jumpTo(ch.id)}
                  className={`min-h-[38px] px-2.5 xl:px-3 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#EAF4D3] text-[#0B3D2E] font-bold'
                      : 'text-[#3B5E50] hover:bg-[#F6FAF7] hover:text-[#0B3D2E]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-[#C6F432] text-[#0B3D2E]' : 'text-[#3B5E50]/75'
                    }`}
                  >
                    {ch.num}
                  </span>
                  <span>{ch.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCommandPalette}
              className="min-h-[44px] px-3 rounded-full bg-[#F6FAF7] border border-[#CFE1D5] text-xs font-medium text-[#3B5E50] hover:border-[#2F9E5B] hover:text-[#0B3D2E] transition-colors cursor-pointer flex items-center gap-1.5"
              title="Cari fitur atau studi kasus (Ctrl+K)"
              aria-label="Cari cepat"
            >
              <Search className="size-3.5 text-[#2F9E5B]" />
              <kbd className="hidden lg:inline font-mono text-[10px] text-[#0B3D2E]">⌘K</kbd>
            </button>

            <button
              onClick={onOpenLogin}
              className="hidden md:inline-flex min-h-[44px] px-4 rounded-full border border-[#CFE1D5] bg-white text-[#0B3D2E] text-xs font-bold hover:bg-[#F6FAF7] transition-colors cursor-pointer items-center justify-center"
            >
              Masuk
            </button>

            <button
              onClick={onOpenWizard}
              className="min-h-[44px] px-4 rounded-full bg-[#0B3D2E] text-white text-xs font-bold hover:bg-[#135440] transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>Buat Surat Cinta</span>
              <span className="size-2 rounded-full bg-[#C6F432]" />
            </button>
          </div>
        </div>

        {/* Continuous Horizontal Reading Progress Bar */}
        <div className="h-[2.5px] w-full bg-[#E4F1E8] overflow-hidden">
          <div
            className="h-full bg-[#2F9E5B] transition-[width] duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE TOP MINI HEADER (<640px)                           */}
      {/* ========================================================= */}
      <header className="flex sm:hidden sticky top-0 z-40 bg-white border-b border-[#CFE1D5] px-4 h-14 items-center justify-between gap-2">
        <a href="/" className="flex items-center gap-2 min-h-[44px] min-w-0">
          <div className="size-8 rounded-lg bg-[#0B3D2E] text-[#C6F432] grid place-items-center font-display-v3 font-extrabold text-xs shrink-0">
            GP
          </div>
          <span className="font-display-v3 font-extrabold text-sm text-[#0B3D2E] truncate">
            Developer Sales OS
          </span>
        </a>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCommandPalette}
            className="min-h-[44px] min-w-[44px] rounded-lg border border-[#CFE1D5] bg-[#F6FAF7] text-[#0B3D2E] grid place-items-center cursor-pointer"
            aria-label="Cari cepat"
          >
            <Search className="size-4" />
          </button>
          <button
            onClick={onOpenLogin}
            className="min-h-[44px] px-3 rounded-lg border border-[#CFE1D5] bg-white text-xs font-bold text-[#0B3D2E] cursor-pointer"
          >
            Masuk
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE FIXED BOTTOM NAVIGATION BAR (<640px)               */}
      {/* ========================================================= */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#CFE1D5] pb-safe"
      >
        <div className="grid grid-cols-5 h-16 px-1">
          {[
            { id: 'bab-pembuka', label: 'Mulai', icon: Compass },
            { id: 'alur-6-langkah', label: 'Alur', icon: Layers },
            { id: 'peta-demo', label: 'Peta', icon: Map },
            { id: 'paket-harga', label: 'Paket', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => jumpTo(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
                  isActive ? 'text-[#0B3D2E]' : 'text-[#3B5E50]'
                }`}
              >
                <span
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-[#C6F432] text-[#0B3D2E]' : ''
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setDrawerOpen(true)}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-[#0B3D2E] cursor-pointer"
            aria-label="Buka menu lengkap"
          >
            <span className="px-2.5 py-1 rounded-full bg-[#E4F1E8]">
              <Menu className="size-4" />
            </span>
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Full Chapter Drawer */}
      {drawerOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-[#0B3D2E]/40 flex items-end">
          <div className="w-full bg-white rounded-t-2xl border-t border-[#CFE1D5] p-5 pb-8 space-y-4 max-h-[82dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-display-v3 font-extrabold text-base text-[#0B3D2E]">
                Indeks Perjalanan Proyek
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-lg bg-[#F6FAF7] border border-[#CFE1D5] text-[#0B3D2E] grid place-items-center cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {V3_CHAPTERS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => jumpTo(ch.id)}
                  className={`w-full min-h-[48px] px-3.5 rounded-xl flex items-center gap-3 text-left cursor-pointer ${
                    activeId === ch.id
                      ? 'bg-[#EAF4D3] text-[#0B3D2E] font-bold'
                      : 'bg-[#F6FAF7] text-[#3B5E50]'
                  }`}
                >
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#CFE1D5] text-[#0B3D2E]">
                    {ch.num}
                  </span>
                  <span className="text-sm">{ch.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E4F1E8] grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenLogin();
                }}
                className="min-h-[48px] rounded-xl border border-[#CFE1D5] bg-white text-sm font-bold text-[#0B3D2E] cursor-pointer"
              >
                Masuk Dashboard
              </button>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenWizard();
                }}
                className="min-h-[48px] rounded-xl bg-[#0B3D2E] text-white text-sm font-bold cursor-pointer"
              >
                Buat Surat Cinta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
