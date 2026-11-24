import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ArrowUpRight, Check, MapPin } from 'lucide-react';
import { HeroExplodedSvg } from './HeroExplodedSvg';

gsap.registerPlugin(ScrollTrigger);

interface ChapterIntroAndCaseV3Props {
  onOpenWizard: () => void;
  onOpenLoveLetter: () => void;
  onScrollToCaseStudy: () => void;
  onScrollToMap: () => void;
}

const TICKER_ITEMS = [
  {
    tag: 'LEAD MASUK',
    title: 'Prospek Meta Ads',
    desc: 'Otomatis masuk & tercatat ke antrean tim.',
  },
  {
    tag: 'AUDIT TL AI',
    title: 'Respon 3 Menit (≤5 mnt)',
    desc: 'SLA kecepatan balas dipantau 24/7.',
  },
  {
    tag: 'BANT 8/10',
    title: 'Tipe Diamond 75/90',
    desc: 'Kesiapan dana & kebutuhan tervalidasi.',
  },
  {
    tag: 'SURVEI UNIT',
    title: 'Show Unit Nagoya',
    desc: 'Jadwal kunjungan terhubung ke rute SE.',
  },
  {
    tag: 'SKEMA BAYAR',
    title: 'Cash Tempo 24 Bulan',
    desc: 'Simulasi cicilan & KPR diverifikasi manusia.',
  },
  {
    tag: 'LEGALITAS',
    title: 'SHM Pecah & PBG',
    desc: 'Dokumen siap per unit The Park Sukoharjo.',
  },
];

const TIMELINE_MILESTONES = [
  { step: '01', label: 'Brosur & Pricelist', sub: 'Ekstrak data resmi' },
  { step: '02', label: '99 Keunggulan', sub: 'Kurasi editorial faktual' },
  { step: '03', label: 'Riset 25 km', sub: '5 persona & kompetitor' },
  { step: '04', label: 'Skema 24 Bln', sub: 'Cash tempo & KPR' },
  { step: '05', label: 'Target Sold Out', sub: 'Audit lead & closing' },
];

export const ChapterIntroAndCaseV3: React.FC<ChapterIntroAndCaseV3Props> = ({
  onOpenWizard,
  onOpenLoveLetter,
  onScrollToCaseStudy,
  onScrollToMap,
}) => {
  const heroRef = useRef<HTMLElement>(null);
  const caseRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // 1. Hero headline mask-up line reveal
      gsap.from('.v3-hero-line', {
        yPercent: 110,
        opacity: 0,
        duration: 0.95,
        stagger: 0.11,
        ease: 'power4.out',
        clearProps: 'transform',
      });

      gsap.from('.v3-hero-fade', {
        y: 22,
        opacity: 0,
        duration: 0.8,
        delay: 0.32,
        stagger: 0.1,
        ease: 'power3.out',
      });

      // 2. Parallax drift on hero mesh backdrop
      if (heroRef.current) {
        gsap.to('.v3-hero-mesh', {
          yPercent: 16,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      // 3. Case Study giant numbers count-up
      if (caseRef.current) {
        const counters = caseRef.current.querySelectorAll<HTMLElement>('.v3-count-up');
        counters.forEach((el) => {
          const target = Number(el.dataset.target || '0');
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.4,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: caseRef.current,
              start: 'top 76%',
              once: true,
            },
            onUpdate: () => {
              el.textContent = String(Math.round(obj.val));
            },
          });
        });

        // 4. Scroll-scrubbed SVG stroke-draw timeline line
        gsap.fromTo(
          '.v3-case-timeline-path',
          { strokeDashoffset: 1000 },
          {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: '.v3-case-timeline-wrap',
              start: 'top 82%',
              end: 'bottom 55%',
              scrub: 0.7,
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ========================================================= */}
      {/* BAB 01: PEMBUKA — GRAND FULL-BLEED TYPOGRAPHY + EXPLODED  */}
      {/* ========================================================= */}
      <section
        id="bab-pembuka"
        ref={heroRef}
        className="relative overflow-hidden border-b border-[#CFE1D5] bg-[#F6FAF7]"
      >
        {/* Sole purposeful atmospheric gradient mesh */}
        <div
          aria-hidden="true"
          className="v3-hero-mesh pointer-events-none absolute -inset-12 z-0"
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-10 pb-12 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-20">
          {/* Eyebrow */}
          <div className="v3-hero-fade inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-[#CFE1D5] text-xs font-mono font-medium text-[#0B3D2E] mb-6 shadow-2xs">
            <span className="size-1.5 rounded-full bg-[#2F9E5B]" />
            <span>Bab 01 · Platform Multi-Tenant Pengembang Perumahan</span>
          </div>

          {/* Monumental Masked Display Headline */}
          <h1 className="font-display-v3 text-v3-mega font-extrabold text-[#0B3D2E] max-w-5xl">
            <span className="block overflow-hidden pb-1">
              <span className="v3-hero-line block">Dari brosur proyek</span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="v3-hero-line block">
                menjadi{' '}
                <span className="inline-block px-3 py-0.5 rounded-lg bg-[#EAF4D3] text-[#0B3D2E] border border-[#CFE1D5]">
                  mesin penjualan
                </span>
              </span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="v3-hero-line block">yang bergerak otomatis.</span>
            </span>
          </h1>

          {/* Subheadline & Dual Action */}
          <div className="v3-hero-fade mt-6 sm:mt-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <p className="text-base sm:text-lg text-[#3B5E50] max-w-2xl leading-relaxed">
              Unggah brosur, pricelist, dan koordinat proyek Anda. Sistem menyusun Surat Cinta 99 Keunggulan, riset pasar radius 25 km, kalender konten, hingga playbook penjualan tim.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={onOpenWizard}
                className="min-h-[50px] px-6 rounded-xl bg-[#0B3D2E] text-white font-semibold text-sm sm:text-base hover:bg-[#135440] transition-colors cursor-pointer inline-flex items-center justify-center gap-2.5 shadow-sm"
              >
                <span>Dapatkan Surat Cinta Gratis</span>
                <ArrowRight className="size-4 text-white/80" />
              </button>

              <button
                onClick={onScrollToCaseStudy}
                className="min-h-[50px] px-6 rounded-xl border border-[#CFE1D5] bg-white text-[#0B3D2E] font-semibold text-sm sm:text-base hover:bg-[#F6FAF7] transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
              >
                Lihat Studi Kasus
              </button>
            </div>
          </div>

          {/* Operational Live Card Marquee (compact cards, slow scroll, pauses on hover) */}
          <div className="v3-hero-fade mt-8 sm:mt-10 overflow-hidden py-1">
            <div className="v3-ticker-track">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                <div
                  key={idx}
                  className="w-[215px] sm:w-[248px] shrink-0 rounded-xl bg-white border border-[#CFE1D5] px-3 py-2.5 sm:px-3.5 sm:py-3 shadow-[0_6px_18px_-12px_rgba(11,61,46,0.18)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-[#2F9E5B] shrink-0" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2F9E5B]">
                      {item.tag}
                    </span>
                  </div>
                  <p className="font-display-v3 font-bold text-xs sm:text-sm text-[#0B3D2E] mt-1 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#3B5E50] mt-0.5 leading-snug line-clamp-1">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Centerpiece Animated 3-Layer Exploded Isometric SVG */}
          <div className="mt-10 sm:mt-12">
            <HeroExplodedSvg />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* BAB 02: STUDI KASUS — MONUMENTAL STATEMENT + STROKE DRAW  */}
      {/* ========================================================= */}
      <section
        id="studi-kasus"
        ref={caseRef}
        className="bg-white border-b border-[#CFE1D5] py-14 sm:py-20 lg:py-24"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14">
            <div className="max-w-3xl">
              <p className="text-xs font-mono uppercase tracking-widest text-[#2F9E5B] font-bold">
                Bab 02 · Studi Kasus Terverifikasi
              </p>
              <h2 className="font-display-v3 text-v3-chapter font-extrabold text-[#0B3D2E] mt-2">
                Terbukti di The Park Townhouse Sukoharjo.
              </h2>
              <p className="text-sm sm:text-base text-[#3B5E50] mt-3 leading-relaxed flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B3D2E]">
                  <MapPin className="size-4 text-[#2F9E5B]" />
                  Mandan, Sukoharjo, Jawa Tengah
                </span>
                <span>·</span>
                <span>PT Andara Rejo Makmur · Klaster Nagoya, Osaka &amp; Tokyo</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={onOpenLoveLetter}
                className="min-h-[48px] px-5 rounded-full bg-[#0B3D2E] text-white text-sm font-bold hover:bg-[#135440] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>Baca 99 Keunggulan</span>
                <ArrowUpRight className="size-4 text-[#C6F432]" />
              </button>
              <button
                onClick={onScrollToMap}
                className="min-h-[48px] px-5 rounded-full border border-[#CFE1D5] bg-[#F6FAF7] text-[#0B3D2E] text-sm font-bold hover:border-[#2F9E5B] transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Buka Peta Radius 25 km
              </button>
            </div>
          </div>

          {/* Monumental Scale-Contrast Stats (No Card Clutter) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 py-8 sm:py-10 border-y border-[#CFE1D5]">
            <div>
              <div className="font-display-v3 text-v3-stat font-extrabold text-[#0B3D2E] tabular-nums flex items-baseline gap-2">
                <span className="v3-count-up" data-target="30">30</span>
                <span className="text-lg sm:text-xl font-bold text-[#2F9E5B]">Unit</span>
              </div>
              <p className="text-sm text-[#3B5E50] mt-2">
                Townhouse bernuansa Jepang dikelola penuh dari brosur hingga serapan unit.
              </p>
            </div>

            <div className="sm:border-l sm:border-[#CFE1D5] sm:pl-8">
              <div className="font-display-v3 text-v3-stat font-extrabold text-[#0B3D2E] tabular-nums flex items-baseline gap-2">
                <span className="v3-count-up" data-target="3">3</span>
                <span className="text-lg sm:text-xl font-bold text-[#2F9E5B]">Klaster</span>
              </div>
              <p className="text-sm text-[#3B5E50] mt-2">
                Nagoya, Osaka, dan Tokyo dengan legalitas SHM pecah &amp; PBG lengkap.
              </p>
            </div>

            <div className="sm:border-l sm:border-[#CFE1D5] sm:pl-8">
              <div className="font-display-v3 text-v3-stat font-extrabold text-[#0B3D2E] tabular-nums flex items-baseline gap-2">
                <span className="v3-count-up" data-target="24">24</span>
                <span className="text-lg sm:text-xl font-bold text-[#2F9E5B]">Bulan</span>
              </div>
              <p className="text-sm text-[#3B5E50] mt-2">
                Skema cash bertahap 24 bulan &amp; simulasi KPR terverifikasi manusia.
              </p>
            </div>
          </div>

          {/* Scroll-Scrubbed Stroke-Draw Project Journey Line */}
          <div className="v3-case-timeline-wrap mt-10 sm:mt-12">
            <div className="hidden md:block mb-4">
              <svg viewBox="0 0 1000 32" className="w-full h-8 overflow-visible" aria-hidden="true">
                <line x1="20" y1="16" x2="980" y2="16" stroke="#E4F1E8" strokeWidth="4" strokeLinecap="round" />
                <line
                  className="v3-case-timeline-path"
                  x1="20"
                  y1="16"
                  x2="980"
                  y2="16"
                  stroke="#2F9E5B"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="1000"
                />
                {[20, 260, 500, 740, 980].map((cx, i) => (
                  <circle
                    key={i}
                    cx={cx}
                    cy="16"
                    r="8"
                    fill={i === 4 ? '#C6F432' : '#FFFFFF'}
                    stroke="#0B3D2E"
                    strokeWidth="2.5"
                  />
                ))}
              </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {TIMELINE_MILESTONES.map((m) => (
                <div
                  key={m.step}
                  className="p-4 rounded-xl bg-[#F6FAF7] border border-[#CFE1D5]"
                >
                  <span className="font-mono text-xs font-bold text-[#2F9E5B]">{m.step}</span>
                  <p className="font-display-v3 font-bold text-sm sm:text-base text-[#0B3D2E] mt-1">
                    {m.label}
                  </p>
                  <p className="text-xs text-[#3B5E50] mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#0B3D2E]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E4F1E8] font-semibold">
                <Check className="size-4 text-[#2F9E5B]" />
                SHM Pecah &amp; PBG Lengkap
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E4F1E8] font-semibold">
                <Check className="size-4 text-[#2F9E5B]" />
                99 Poin Bebas Klaim Berlebihan
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF4D3] font-semibold">
                <Check className="size-4 text-[#0B3D2E]" />
                Status Proyek: Aktif
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
