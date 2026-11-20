import React, { useState } from 'react';
import { Search, Menu, X, Sparkles } from 'lucide-react';
import { LABYRINTH_ROUTES, type LabyrinthRouteId } from '../lib/labyrinth/labyrinth-routes';

interface NavbarProps {
  activeRoute: LabyrinthRouteId;
  onNavigateRoute: (routeId: LabyrinthRouteId) => void;
  onOpenCommandPalette: () => void;
  onOpenWizard: () => void;
  onOpenLogin: () => void;
  onScrollTo: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoute,
  onNavigateRoute,
  onOpenCommandPalette,
  onOpenWizard,
  onOpenLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { label: string; routeId: LabyrinthRouteId }[] = [
    { label: 'Beranda', routeId: 'l0-beranda' },
    { label: 'Ekosistem Produk', routeId: 'l1-ekosistem' },
    { label: 'Studi Kasus', routeId: 'l1-studi-kasus' },
    { label: 'Solusi Peran', routeId: 'l1-peran' },
    { label: 'Paket & Harga', routeId: 'l1-paket' },
  ];

  const currentMeta = LABYRINTH_ROUTES[activeRoute];
  const isRouteBranchActive = (routeId: LabyrinthRouteId) => {
    return activeRoute === routeId || currentMeta?.parentId === routeId;
  };

  const handleLinkClick = (routeId: LabyrinthRouteId) => {
    setMobileMenuOpen(false);
    onNavigateRoute(routeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-sandstone/90 backdrop-blur-md border-b border-warmborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleLinkClick('l0-beranda')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <div className="size-9 rounded-xl bg-terracotta text-white grid place-items-center font-extrabold text-sm shadow-xs group-hover:scale-105 transition-transform">
              GP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-espresso leading-none">Developer Sales OS</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-terracotta border border-amber-200">
                  giivepro
                </span>
              </div>
              <p className="text-[10px] text-warmmuted">Mesin Penjualan Properti Multi-Tenant</p>
            </div>
          </button>
        </div>

        {/* Search / Command Palette Trigger (Desktop) */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white border border-warmborder text-xs text-warmmuted hover:border-terracotta/60 hover:text-espresso transition-all shadow-2xs cursor-pointer w-60 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="size-3.5 text-warmmuted" />
            <span>Cari fitur, studi kasus...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-sandstone border border-warmborder text-[10px] font-mono text-warmmuted">
            ⌘K
          </kbd>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-5">
          {navLinks.map((link) => {
            const active = isRouteBranchActive(link.routeId);
            return (
              <button
                key={link.routeId}
                onClick={() => handleLinkClick(link.routeId)}
                className={`text-xs font-bold transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg ${
                  active
                    ? 'text-terracotta bg-amber-50 border border-amber-200'
                    : 'text-espresso hover:text-terracotta'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            onClick={onOpenLogin}
            className="h-10 px-4 rounded-xl text-xs font-bold text-espresso hover:bg-white transition-colors cursor-pointer"
          >
            Masuk
          </button>
          <button
            onClick={onOpenWizard}
            className="h-10 px-4 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5 text-amber-300" />
            <span>Daftar / Gratis 99 Poin</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onOpenCommandPalette}
            className="p-2 rounded-xl bg-white border border-warmborder text-warmmuted"
            title="Cari (⌘K)"
          >
            <Search className="size-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white border border-warmborder text-espresso cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-warmborder bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.routeId}
                onClick={() => handleLinkClick(link.routeId)}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold ${
                  isRouteBranchActive(link.routeId)
                    ? 'bg-amber-50 text-terracotta'
                    : 'text-espresso hover:bg-sandstone'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-warmborder flex flex-col gap-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
              className="w-full py-2.5 text-center text-xs font-bold rounded-xl border border-warmborder text-espresso"
            >
              Masuk ke Platform
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenWizard(); }}
              className="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-terracotta text-white shadow-xs"
            >
              Dapatkan Surat Cinta Gratis
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
