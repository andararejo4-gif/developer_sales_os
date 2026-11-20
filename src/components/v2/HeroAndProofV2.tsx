import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, MapPin } from 'lucide-react';
import { FACTUAL_METRICS } from '../Hero';
import { HeroTriDomainSvg, type HeroDomain } from './HeroTriDomainSvg';

interface HeroAndProofV2Props {
  onOpenWizard: () => void;
  onOpenLoveLetter: () => void;
  onScrollToCaseStudy: () => void;
  onScrollToMap: () => void;
}

const DOMAIN_TABS: { key: HeroDomain; label: string; summary: string }[] = [
  {
    key: 'all',
    label: 'Semua Ranah',
    summary: 'Satu sistem menyatukan data arsitektur proyek, narasi marketing, dan eksekusi tim sales.',
  },
  {
    key: 'architect',
    label: 'Architect',
    summary: 'Siteplan, spesifikasi unit 75/90, SHM/PBG, dan radius fasilitas 25 km terstruktur rapi.',
  },
  {
    key: 'marketing',
    label: 'Marketing',
    summary: 'Brosur mentah diolah menjadi 99 poin keunggulan faktual dan kalender konten 30 hari.',
  },
  {
    key: 'teamlead',
    label: 'Team Lead',
    summary: 'Audit SLA respon ≤5 menit, kualifikasi BANT, aturan 72 jam, dan target hingga sold out.',
  },
];

export const HeroAndProofV2: React.FC<HeroAndProofV2Props> = ({
  onOpenWizard,
  onOpenLoveLetter,
  onScrollToCaseStudy,
  onScrollToMap,
}) => {
  const [activeDomain, setActiveDomain] = useState<HeroDomain>('all');
  const activeDomainInfo = DOMAIN_TABS.find((d) => d.key === activeDomain) ?? DOMAIN_TABS[0];

  return (
    <>
      {/* 1. SPLIT HERO: 80% White Canvas, 20% Cobalt Blue Focus */}
      <section className="bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#1D4ED8] text-xs font-mono font-semibold uppercase tracking-wider mb-4">
                Platform Multi-Tenant Pengembang Perumahan
              </div>

              <h1 className="text-hero-display font-extrabold text-slate-900">
                Dari brosur proyek menjadi mesin penjualan terstruktur.
              </h1>

              <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Unggah brosur, pricelist, dan titik koordinat proyek Anda. Sistem menyusun Surat Cinta 99 Keunggulan, riset pasar radius 25 km, jadwal konten, hingga playbook penjualan tim.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={onOpenWizard}
                  className="min-h-[48px] px-6 rounded-lg bg-[#2563EB] text-white font-semibold text-sm sm:text-base hover:bg-[#1D4ED8] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Dapatkan Surat Cinta Gratis</span>
                  <ArrowRight className="size-4" />
                </button>

                <button
                  onClick={onScrollToCaseStudy}
                  className="min-h-[48px] px-6 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold text-sm sm:text-base hover:border-slate-900 transition-colors cursor-pointer inline-flex items-center justify-center"
                >
                  Lihat Studi Kasus The Park
                </button>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-slate-500">
                Onboarding langsung · Tanpa kartu kredit · Angka harga diverifikasi manusia
              </p>
            </div>

            {/* Right Interactive Tri-Domain Architectural + Marketing + Team Lead Frame */}
            <div className="lg:col-span-6 min-w-0">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                {/* Domain Switcher Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pb-3">
                  {DOMAIN_TABS.map((tab) => {
                    const isActive = activeDomain === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveDomain(tab.key)}
                        className={`min-h-[36px] px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tri-Domain SVG */}
                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <HeroTriDomainSvg
                    activeDomain={activeDomain}
                    onSelectDomain={setActiveDomain}
                  />
                </div>

                {/* Active Domain Caption */}
                <div className="mt-3 px-3 py-2.5 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-3">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong className="text-[#1D4ED8] font-semibold mr-1.5">
                      {activeDomainInfo.label}:
                    </strong>
                    {activeDomainInfo.summary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Factual Metrics Ledger Strip */}
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200 border-x border-slate-200 bg-white">
              {FACTUAL_METRICS.map((m, idx) => (
                <div key={idx} className="p-4 sm:p-6 min-w-0">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] tabular-nums tracking-tight">
                    {m.value}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {m.label}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. ASYMMETRIC BENTO CASE STUDY (#studi-kasus) */}
      <section id="studi-kasus" className="py-12 sm:py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Context */}
            <div className="lg:col-span-5 min-w-0">
              <p className="text-xs font-mono uppercase tracking-widest text-[#2563EB] font-semibold">
                Studi Kasus Terverifikasi
              </p>
              <h2 className="text-section-display font-extrabold text-slate-900 mt-2">
                Terbukti di The Park Townhouse Sukoharjo
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
                Diterapkan langsung oleh PT Andara Rejo Makmur untuk mengelola 30 unit townhouse bernuansa Jepang di tiga klaster: Nagoya, Osaka, dan Tokyo.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                <button
                  onClick={onOpenLoveLetter}
                  className="min-h-[44px] px-5 rounded-lg bg-[#0F172A] text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Baca 99 Keunggulan The Park</span>
                  <ArrowUpRight className="size-4" />
                </button>
                <button
                  onClick={onScrollToMap}
                  className="min-h-[44px] px-5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:border-[#2563EB] hover:text-[#2563EB] transition-colors cursor-pointer inline-flex items-center justify-center"
                >
                  Lihat Peta Radius 25 km
                </button>
              </div>
            </div>

            {/* Right Asymmetric Bento Grid */}
            <div className="lg:col-span-7 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Primary Project Header Card (spans 3 cols on sm+) */}
              <div className="sm:col-span-3 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    The Park Townhouse
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-[#2563EB] shrink-0" />
                    <span>Mandan, Sukoharjo, Jawa Tengah</span>
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 text-[#1D4ED8] border border-blue-200">
                  Status: Aktif
                </span>
              </div>

              {/* 3 Micro Metric Bento Cards */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <span className="text-[11px] font-mono uppercase text-slate-500 block">Total Unit</span>
                <strong className="text-xl font-extrabold text-[#2563EB] tabular-nums mt-1 block">
                  30 Unit
                </strong>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <span className="text-[11px] font-mono uppercase text-slate-500 block">Klaster</span>
                <strong className="text-xl font-extrabold text-slate-900 mt-1 block">
                  3 Tema
                </strong>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <span className="text-[11px] font-mono uppercase text-slate-500 block">Skema</span>
                <strong className="text-xl font-extrabold text-slate-900 mt-1 block">
                  Tempo 24 Bln
                </strong>
              </div>

              {/* Summary & Verified Checklist Card (spans 3 cols) */}
              <div className="sm:col-span-3 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Dari katalog brosur mentah dan daftar harga resmi, sistem memetakan 99 keunggulan faktual, menyusun simulasi cash tempo 24 bulan dan KPR, serta menjalankan pengawasan lead harian.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                    <Check className="size-4 text-[#2563EB] shrink-0" />
                    <span className="font-medium text-slate-800">SHM Pecah &amp; PBG Lengkap</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                    <Check className="size-4 text-[#2563EB] shrink-0" />
                    <span className="font-medium text-slate-800">Riset Fasilitas Radius 25 km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
