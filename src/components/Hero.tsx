import React from 'react';
import { ArrowRight, Sparkles, Building2, MapPin, Compass, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onOpenWizard: () => void;
  onScrollToCaseStudy: () => void;
}

// 4 Nilai Faktual Dibaca dari Konfigurasi Sistem
export const FACTUAL_METRICS = [
  { value: '99', label: 'Keunggulan Kurasi', desc: 'Editorial faktual tanpa overpromise', icon: Sparkles },
  { value: '6', label: 'Modul Penjualan', desc: 'Dari brosur s.d. closing & CRM', icon: Compass },
  { value: '25 km', label: 'Radius Riset Pasar', desc: 'Pemetaan fasilitas & kompetitor', icon: MapPin },
  { value: '30', label: 'Unit The Park', desc: 'Studi kasus nyata di Sukoharjo', icon: Building2 },
];

export const Hero: React.FC<HeroProps> = ({ onOpenWizard, onScrollToCaseStudy }) => {
  return (
    <section className="bg-espresso text-sandstone pt-16 pb-20 md:pt-24 md:pb-28 border-b border-warmborder relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-terracotta/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-amber-400 mb-6 backdrop-blur-xs">
          <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Platform Multi-Tenant untuk Pengembang Perumahan</span>
        </div>

        {/* Big Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.08]">
          Dari brosur jadi mesin penjualan.
        </h1>

        {/* 1-Sentence Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-stone-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Cukup unggah brosur, pricelist, dan koordinat proyek Anda untuk menghasilkan Surat Cinta 99 Keunggulan, riset pasar radius 25 km, kalender konten, hingga playbook penjualan otonom.
        </p>

        {/* 2 Primary CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={onOpenWizard}
            className="w-full sm:w-auto h-12 px-7 rounded-xl bg-terracotta text-white font-bold text-sm hover:bg-terracotta/90 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 group"
          >
            <Sparkles className="size-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>Dapatkan Surat Cinta Gratis</span>
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onScrollToCaseStudy}
            className="w-full sm:w-auto h-12 px-6 rounded-xl border border-sandstone/30 text-sandstone font-semibold text-sm hover:bg-white/10 hover:border-sandstone transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="size-4 text-amber-400" />
            <span>Lihat studi kasus The Park</span>
          </button>
        </div>

        {/* Social Note */}
        <p className="mt-4 text-xs text-stone-400">
          Onboarding instan &middot; Tanpa komitmen kartu kredit &middot; Lolos uji guardrail 100%
        </p>

        {/* Factual Metrics Bar (Read from Config/Database) */}
        <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          {FACTUAL_METRICS.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-amber-400 mb-1">
                  <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-white">
                    {m.value}
                  </span>
                  <Icon className="size-5 text-amber-400/80" />
                </div>
                <p className="text-xs font-bold text-sandstone">{m.label}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
