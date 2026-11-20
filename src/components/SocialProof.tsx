import React from 'react';
import { MapPin, Check, ArrowUpRight } from 'lucide-react';

interface SocialProofProps {
  onOpenLoveLetter: () => void;
  onScrollToMap: () => void;
}

export const SocialProof: React.FC<SocialProofProps> = ({ onOpenLoveLetter, onScrollToMap }) => {
  return (
    <section id="studi-kasus" className="py-12 sm:py-16 lg:py-20 bg-surface border-b border-warmborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Asymmetric Editorial Split: Left Context + Right Spec Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Narrative */}
          <div className="lg:col-span-5 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-terracotta font-semibold">
              Studi Kasus Terverifikasi
            </p>
            <h2 className="text-section-display font-extrabold text-espresso mt-2">
              Terbukti di The Park Townhouse Sukoharjo
            </h2>
            <p className="text-sm sm:text-base text-warmmuted mt-3 leading-relaxed">
              Diterapkan langsung oleh PT Andara Rejo Makmur untuk mengelola 30 unit townhouse bernuansa Jepang di tiga klaster: Nagoya, Osaka, dan Tokyo.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
              <button
                onClick={onOpenLoveLetter}
                className="min-h-[44px] px-5 rounded-md bg-espresso text-sandstone text-sm font-semibold hover:bg-espresso/90 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>Baca 99 Keunggulan The Park</span>
                <ArrowUpRight className="size-4" />
              </button>
              <button
                onClick={onScrollToMap}
                className="min-h-[44px] px-5 rounded-md border border-warmborder bg-sandstone/40 text-espresso text-sm font-semibold hover:border-espresso/40 transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Lihat Peta Radius 25 km
              </button>
            </div>
          </div>

          {/* Right Architectural Spec Sheet Card */}
          <div className="lg:col-span-7 min-w-0 border border-warmborder rounded-lg bg-sandstone/40 overflow-hidden">
            {/* Top Project Header */}
            <div className="p-5 sm:p-7 border-b border-warmborder bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-espresso">
                  The Park Townhouse
                </h3>
                <p className="text-xs sm:text-sm text-warmmuted mt-0.5 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-terracotta shrink-0" />
                  <span>Mandan, Sukoharjo, Jawa Tengah</span>
                </p>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded text-xs font-semibold bg-olive/10 text-olive border border-olive/20">
                Status: Aktif
              </span>
            </div>

            {/* Data Row */}
            <div className="grid grid-cols-3 divide-x divide-warmborder border-b border-warmborder bg-surface/60">
              <div className="p-4 sm:p-5">
                <span className="text-[11px] font-mono uppercase text-warmmuted block">Total Unit</span>
                <strong className="text-base sm:text-lg font-extrabold text-espresso mt-0.5 block">30 Unit</strong>
              </div>
              <div className="p-4 sm:p-5">
                <span className="text-[11px] font-mono uppercase text-warmmuted block">Klaster</span>
                <strong className="text-base sm:text-lg font-extrabold text-espresso mt-0.5 block">3 Tema</strong>
              </div>
              <div className="p-4 sm:p-5">
                <span className="text-[11px] font-mono uppercase text-warmmuted block">Skema</span>
                <strong className="text-base sm:text-lg font-extrabold text-espresso mt-0.5 block">Tempo 24 Bln</strong>
              </div>
            </div>

            {/* Editorial Summary & Checklist */}
            <div className="p-5 sm:p-7 space-y-4">
              <p className="text-sm text-espresso/90 leading-relaxed">
                Dari katalog brosur mentah dan daftar harga resmi, sistem memetakan 99 keunggulan faktual, menyusun simulasi cash tempo 24 bulan dan KPR, serta menjalankan pengawasan lead harian.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2.5 p-3 rounded-md bg-surface border border-warmborder text-sm">
                  <Check className="size-4 text-olive shrink-0" />
                  <span className="font-medium text-espresso">SHM Pecah &amp; PBG Lengkap</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-md bg-surface border border-warmborder text-sm">
                  <Check className="size-4 text-olive shrink-0" />
                  <span className="font-medium text-espresso">Koordinat Riil OpenStreetMap</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
