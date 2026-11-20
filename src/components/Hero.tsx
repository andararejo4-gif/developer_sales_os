import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HeroArchitecturalSvg } from './HeroArchitecturalSvg';

interface HeroProps {
  onOpenWizard: () => void;
  onScrollToCaseStudy: () => void;
}

export const FACTUAL_METRICS = [
  { value: '99', label: 'Poin Keunggulan', desc: 'Kurasi editorial bersumber dengan pelaporan gap fakta' },
  { value: '100', label: 'Fitur Software', desc: '17 modul operasional selaras Blueprint v1.2' },
  { value: '25 km', label: 'Radius Riset', desc: 'Pemetaan 9 cincin fasilitas & kompetitor' },
  { value: '30', label: 'Unit The Park', desc: 'Studi kasus aktif di Sukoharjo' },
];

export const Hero: React.FC<HeroProps> = ({ onOpenWizard, onScrollToCaseStudy }) => {
  return (
    <section className="bg-sandstone text-espresso border-b border-warmborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-16">
        {/* Asymmetric Mobile-First Split: Copy & CTA first on phone, 7:5 side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Editorial Headline & Primary Actions */}
          <div className="lg:col-span-7 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-terracotta font-semibold mb-3">
              Platform Multi-Tenant Pengembang Perumahan
            </p>

            <h1 className="text-hero-display font-extrabold text-espresso">
              Upload tiga bahan, dapatkan fondasi pemasaran. Hubungkan akun dan setujui mandat, biarkan pekerjaan rutin berjalan.
            </h1>

            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-warmmuted leading-relaxed max-w-2xl">
              Cukup masukkan brosur, pricelist, dan titik koordinat. Sistem menghasilkan draf Surat Cinta hingga 99 Keunggulan, riset pasar radius 25 km, kalender konten, hingga rute lapangan tim sales yang siap diverifikasi.
            </p>

            <div className="mt-3 p-3 rounded-md bg-sandstone/80 border border-warmborder text-xs text-warmmuted leading-relaxed max-w-2xl">
              <span className="font-semibold text-espresso">Batas Sistem yang Transparan:</span> Tiga bahan menghasilkan draf dan simulasi yang dapat diperiksa. Publikasi website, penayangan iklan berbayar, outreach WhatsApp, simulasi KPR resmi, dan transaksi booking memerlukan otorisasi mandat akun dan approval PIC Anda.
            </div>

            {/* Primary & Secondary Actions (48px mobile tap targets) */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onOpenWizard}
                className="min-h-[48px] px-6 rounded-md bg-terracotta text-white font-semibold text-sm sm:text-base hover:bg-terracotta/90 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>Dapatkan Surat Cinta Gratis</span>
                <ArrowRight className="size-4" />
              </button>

              <button
                onClick={onScrollToCaseStudy}
                className="min-h-[48px] px-6 rounded-md border border-espresso/25 bg-surface text-espresso font-semibold text-sm sm:text-base hover:border-espresso transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Lihat Studi Kasus The Park
              </button>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-warmmuted">
              Onboarding langsung · Tanpa kartu kredit · Angka harga diverifikasi manusia
            </p>
          </div>

          {/* Right Column: Transparent 2D CAD Architectural Vector */}
          <div className="lg:col-span-5 min-w-0">
            <div className="border border-warmborder rounded-lg bg-surface/50 p-3 sm:p-5">
              <HeroArchitecturalSvg />
            </div>
          </div>
        </div>
      </div>

      {/* Factual Metrics Strip: Crisp 1px Hairline Ledger */}
      <div className="border-t border-warmborder bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-warmborder border-x border-warmborder">
            {FACTUAL_METRICS.map((m, idx) => (
              <div key={idx} className="p-4 sm:p-6 min-w-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-espresso tabular-nums tracking-tight">
                  {m.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-espresso mt-1">
                  {m.label}
                </div>
                <p className="text-xs text-warmmuted mt-0.5 leading-snug">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
