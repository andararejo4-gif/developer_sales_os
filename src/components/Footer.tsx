import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-espresso text-stone-300 py-12 border-t border-white/10 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-terracotta text-white grid place-items-center font-extrabold text-xs">
                GP
              </div>
              <span className="font-extrabold text-sm text-white">Developer Sales OS</span>
            </div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Platform mesin penjualan dan digitalisasi perumahan multi-tenant terpadu oleh <strong>giivepro</strong>.
            </p>
            <p className="text-[10px] text-stone-500 font-mono">
              developerproperti.giivepro.com
            </p>
          </div>

          {/* Navigasi Produk */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Produk &amp; Modul</h4>
            <ul className="space-y-2 text-[11px] text-stone-400">
              <li><a href="#fitur-utama" className="hover:text-white transition-colors">Surat Cinta 99 Keunggulan</a></li>
              <li><a href="#peta-demo" className="hover:text-white transition-colors">Riset Pasar Radius 25 km</a></li>
              <li><a href="#alur-6-langkah" className="hover:text-white transition-colors">Target Penjualan Sold Out</a></li>
              <li><a href="#alur-6-langkah" className="hover:text-white transition-colors">Kalender Konten Multi-Platform</a></li>
              <li><a href="#peran-ai" className="hover:text-white transition-colors">Playbook SE, TL AI, &amp; SM Semi-AI</a></li>
            </ul>
          </div>

          {/* Dukungan & Legal */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Kebijakan &amp; Legal</h4>
            <ul className="space-y-2 text-[11px] text-stone-400">
              <li><a href="#dokumentasi-faq" className="hover:text-white transition-colors">Kebijakan Privasi Data Tenant</a></li>
              <li><a href="#dokumentasi-faq" className="hover:text-white transition-colors">Standar Keamanan Multi-Tenant</a></li>
              <li><a href="#dokumentasi-faq" className="hover:text-white transition-colors">Guardrail Etika AI</a></li>
              <li><a href="#dokumentasi-faq" className="hover:text-white transition-colors">Syarat &amp; Ketentuan Layanan</a></li>
            </ul>
          </div>

          {/* Kontak & Dukungan */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Kontak &amp; Bantuan</h4>
            <div className="space-y-2 text-[11px] text-stone-400">
              <p>Email: <a href="mailto:support@giivepro.com" className="hover:text-amber-400">support@giivepro.com</a></p>
              <p>Konsultasi Developer: <a href="mailto:halo@giivepro.com" className="hover:text-amber-400">halo@giivepro.com</a></p>
              <p className="text-[10px] text-stone-500 mt-2">
                Studi Kasus Referensi: The Park Townhouse Sukoharjo (PT Andara Rejo Makmur).
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p>© 2026 Developer Sales OS · giivepro. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <span>Server: VPS Ubuntu (pm2 isolate)</span>
            <span>Database: PostgreSQL (sales_os)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
