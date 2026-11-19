import React from 'react';
import { MapPin, CheckCircle2, ExternalLink } from 'lucide-react';

interface SocialProofProps {
  onOpenLoveLetter: () => void;
  onScrollToMap: () => void;
}

export const SocialProof: React.FC<SocialProofProps> = ({ onOpenLoveLetter, onScrollToMap }) => {
  return (
    <section id="studi-kasus" className="py-12 bg-white border-b border-warmborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-warmmuted">
            Studi Kasus Nyata &amp; Best Practice
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-espresso mt-1">
            Terbukti di The Park Townhouse Sukoharjo
          </h2>
          <p className="text-xs text-warmmuted mt-1">
            Diterapkan langsung oleh PT Andara Rejo Makmur untuk mengelola 30 unit townhouse eksklusif bernuansa Jepang.
          </p>
        </div>

        {/* Featured Case Study Card */}
        <div className="bg-sandstone/40 border border-warmborder rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Visual Showcase Box */}
          <div className="md:col-span-5 rounded-xl bg-espresso text-white p-6 flex flex-col justify-between min-h-[220px] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta/20 rounded-full blur-2xl pointer-events-none" />
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                Studi Kasus Publik Terverifikasi
              </span>
              <h3 className="text-xl font-extrabold text-white mt-3">The Park Townhouse</h3>
              <p className="text-xs text-stone-300 mt-1 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-amber-400" />
                <span>Mandan, Sukoharjo, Jawa Tengah</span>
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-stone-400 block">Unit</span>
                <strong className="text-white font-bold text-sm">30 Unit</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">Cluster</span>
                <strong className="text-white font-bold text-sm">3 Tema</strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">Status</span>
                <strong className="text-lime-300 font-bold text-sm">Aktif</strong>
              </div>
            </div>
          </div>

          {/* Details & Live Proofs */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-terracotta text-[10px] font-bold">
                  PT Andara Rejo Makmur
                </span>
                <span className="text-xs text-warmmuted">· 3 Cluster: Nagoya, Osaka, Tokyo</span>
              </div>
              <p className="text-xs text-espresso/90 leading-relaxed">
                Dari katalog brosur mentah dan daftar harga, sistem Developer Sales OS otomatis memetakan 99 keunggulan faktual, menghasilkan simulasi cash tempo 24 bulan dan KPR, serta mengotomasi rutinitas Team Leader berbasis AI.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-warmborder">
                <CheckCircle2 className="size-4 text-olive shrink-0" />
                <span className="font-semibold text-espresso">SHM Pecah &amp; PBG Lengkap</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-warmborder">
                <CheckCircle2 className="size-4 text-olive shrink-0" />
                <span className="font-semibold text-espresso">Koordinat Riil Leaflet OSM</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onOpenLoveLetter}
                className="px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Baca 99 Keunggulan The Park</span>
                <ExternalLink className="size-3.5" />
              </button>
              <button
                onClick={onScrollToMap}
                className="px-4 py-2 rounded-xl bg-white border border-warmborder text-espresso text-xs font-semibold hover:bg-sandstone transition-all cursor-pointer"
              >
                Lihat di Peta Spasial
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
