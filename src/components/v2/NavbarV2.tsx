import React, { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';

interface NavbarV2Props {
  onOpenCommandPalette: () => void;
  onOpenWizard: () => void;
  onOpenLogin: () => void;
  onScrollTo: (sectionId: string) => void;
}

const NAV_LINKS = [
  { label: 'Studi Kasus', sectionId: 'studi-kasus' },
  { label: 'Alur 6 Langkah', sectionId: 'alur-6-langkah' },
  { label: 'Peta Radius', sectionId: 'peta-demo' },
  { label: 'Paket', sectionId: 'paket-harga' },
  { label: 'FAQ', sectionId: 'dokumentasi-faq' },
];

export const NavbarV2: React.FC<NavbarV2Props> = ({
  onOpenCommandPalette,
  onOpenWizard,
  onOpenLogin,
  onScrollTo,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (sectionId: string) => {
    setMobileOpen(false);
    onScrollTo(sectionId);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2.5 min-h-[44px] min-w-0">
          <div className="size-8 rounded-lg bg-[#2563EB] text-white grid place-items-center font-extrabold text-xs tracking-tight shrink-0">
            GP
          </div>
          <div className="flex items-baseline gap-2 truncate">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight truncate">
              Developer Sales OS
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500">
              / giivepro
            </span>
          </div>
        </a>

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Navigasi utama">
          {NAV_LINKS.map((link) => (
            <button
              key={link.sectionId}
              onClick={() => handleNav(link.sectionId)}
              className="text-sm font-medium text-slate-600 hover:text-[#2563EB] transition-colors cursor-pointer py-2"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          <button
            onClick={onOpenCommandPalette}
            className="min-h-[44px] px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:border-[#2563EB]/40 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-2"
            title="Cari fitur atau studi kasus (Ctrl+K)"
            aria-label="Cari cepat"
          >
            <Search className="size-3.5 text-slate-500" />
            <span>Cari</span>
            <kbd className="font-mono text-[11px] text-slate-400">⌘K</kbd>
          </button>
          <button
            onClick={onOpenLogin}
            className="min-h-[44px] px-4 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Masuk
          </button>
          <button
            onClick={onOpenWizard}
            className="min-h-[44px] px-4 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors cursor-pointer"
          >
            Buat Surat Cinta
          </button>
        </div>

        {/* Mobile Controls (44x44 min touch targets, labeled Menu button) */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onOpenCommandPalette}
            className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
            aria-label="Cari cepat"
          >
            <Search className="size-4" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="min-h-[44px] px-3 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            <span>{mobileOpen ? 'Tutup' : 'Menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <div className="grid grid-cols-1 gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.sectionId}
                onClick={() => handleNav(link.sectionId)}
                className="min-h-[44px] px-3 rounded-lg text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#2563EB] cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenLogin();
              }}
              className="min-h-[44px] rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 cursor-pointer"
            >
              Masuk
            </button>
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenWizard();
              }}
              className="min-h-[44px] rounded-lg bg-[#2563EB] text-white text-sm font-semibold cursor-pointer"
            >
              Buat Surat Cinta
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
