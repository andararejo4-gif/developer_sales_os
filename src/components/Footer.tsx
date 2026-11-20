import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-espresso text-sandstone/80 py-10 sm:py-12 border-t border-white/10 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-md bg-terracotta text-white grid place-items-center font-extrabold text-xs">
                GP
              </div>
              <span className="font-extrabold text-base text-white">Developer Sales OS</span>
            </div>
            <p className="text-sandstone/70 text-xs sm:text-sm leading-relaxed">
              Platform mesin penjualan dan digitalisasi perumahan multi-tenant oleh <strong className="text-white">giivepro</strong>.
            </p>
            <p className="text-xs text-sandstone/60 font-mono">
              developerproperti.giivepro.com
            </p>
          </div>

          {/* Navigasi Produk */}
          <div>
            <h4 className="font-mono font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Produk &amp; Modul
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-sandstone/70">
              <li><a href="#alur-6-langkah" className="hover:text-white transition-colors inline-block py-0.5">Surat Cinta 99 Keunggulan</a></li>
              <li><a href="#peta-demo" className="hover:text-white transition-colors inline-block py-0.5">Riset Pasar Radius 25 km</a></li>
              <li><a href="#alur-6-langkah" className="hover:text-white transition-colors inline-block py-0.5">Target Penjualan Sold Out</a></li>
              <li><a href="#peran-ai" className="hover:text-white transition-colors inline-block py-0.5">Playbook SE, TL AI &amp; SM</a></li>
            </ul>
          </div>

          {/* Kebijakan & Legal */}
          <div>
            <h4 className="font-mono font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Kebijakan &amp; Keamanan
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-sandstone/70">
              <li><a href="#dokumentasi-faq" className="hover:text-white transition-colors inline-block py-0.5">Privasi Data Tenant</a></li>
              <li><a href="#dokumentasi-faq" className="hover:text-white transition-colors inline-block py-0.5">Standar Isolasi Multi-Tenant</a></li>
              <li><a href="#dokumentasi-faq" className="hover:text-white transition-colors inline-block py-0.5">Guardrail Etika AI</a></li>
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="font-mono font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Kontak
            </h4>
            <div className="space-y-2 text-xs sm:text-sm text-sandstone/70">
              <p>
                Email: <a href="mailto:support@giivepro.com" className="text-white hover:underline">support@giivepro.com</a>
              </p>
              <p>
                Konsultasi: <a href="mailto:halo@giivepro.com" className="text-white hover:underline">halo@giivepro.com</a>
              </p>
              <p className="text-xs text-sandstone/60 pt-1">
                Studi Kasus: The Park Townhouse Sukoharjo (PT Andara Rejo Makmur).
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-sandstone/60">
          <p>&copy; 2026 Developer Sales OS · giivepro. Seluruh hak cipta dilindungi.</p>
          <p className="font-mono">Multi-Tenant Architecture</p>
        </div>
      </div>
    </footer>
  );
};
