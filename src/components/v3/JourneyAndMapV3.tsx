import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { MapChapterV3 } from './MapChapterV3';

gsap.registerPlugin(ScrollTrigger);

interface JourneyAndMapV3Props {
  onOpenLoveLetter: () => void;
  onOpenMarketResearch: () => void;
  onOpenSalesTarget: () => void;
}

export const JourneyAndMapV3: React.FC<JourneyAndMapV3Props> = ({
  onOpenLoveLetter,
  onOpenMarketResearch,
  onOpenSalesTarget,
}) => {
  const railSectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeStation, setActiveStation] = useState<number>(1);

  const stations = [
    {
      num: '01',
      title: 'Surat Cinta 99 Keunggulan',
      badge: 'GRATIS',
      summary:
        'Pintu masuk utama setiap developer. Brosur, pricelist, dan titik koordinat diekstraksi menjadi 99 poin nilai proyek faktual bebas overpromise.',
      highlights: [
        '#01 Lokasi & Akses: Koridor Utama Sukoharjo & Solo Baru',
        '#19 Desain Spasial: Bukaan Kaca Floor-to-Ceiling',
        '#51 Keamanan: One Gate System & Kabel Bawah Tanah',
      ],
      ctaLabel: 'Buka Dokumen 99 Poin',
      onCta: onOpenLoveLetter,
    },
    {
      num: '02',
      title: 'Riset Pasar Radius 25 km',
      badge: '500m – 25km',
      summary:
        'Memetakan 5 persona pembeli, fasilitas publik terverifikasi, dan peta kompetitor perumahan sekitar.',
      highlights: [
        'Persona 1: Eksekutif Medis & Bisnis (Tipe Diamond 75/90)',
        'RSUD Ir. Soekarno (~2.1 km · 6 menit)',
        'Alun-Alun Satya Negara (~3.2 km) & Stasiun (~3.8 km)',
      ],
      ctaLabel: 'Buka Riset Pasar & 5 Persona',
      onCta: onOpenMarketResearch,
    },
    {
      num: '03',
      title: 'Target Penjualan Sold Out',
      badge: '3 Skenario',
      summary:
        'Menghitung mundur target penyerapan 30 unit menjadi kebutuhan prospek BANT ≥7, survei, dan aktivitas harian SE.',
      highlights: [
        'Konservatif: 2 unit/bln (Sold out 15 bulan)',
        'Realistis: 3 unit/bln (Sold out 10 bulan)',
        'Optimis: 4 unit/bln (Sold out 8 bulan)',
      ],
      ctaLabel: 'Buka Kalkulator Target',
      onCta: onOpenSalesTarget,
    },
    {
      num: '04',
      title: 'Kalender Konten 30 Hari',
      badge: 'Official & Sales',
      summary:
        'Jadwal posting 3 slot per hari (IG, TikTok, FB, WA) terbagi rata untuk TOFU, MOFU, dan BOFU berbasis 99 Keunggulan.',
      highlights: [
        'TOFU 09:00 · High Ceiling 3.8m & Sirkulasi Udara',
        'MOFU 13:00 · Room Tour Tipe Diamond Inner Courtyard',
        'BOFU 19:30 · Cash Bertahap 24 Bulan & SHM Pecah',
      ],
      ctaLabel: 'Lihat Sumber 99 Poin',
      onCta: onOpenLoveLetter,
    },
    {
      num: '05',
      title: 'Playbook Penjualan Tim',
      badge: 'SE + TL + SM',
      summary:
        'Panduan taktis harian di lapangan lengkap dengan KPI terukur dan penegakan SOP 72 jam oleh Team Leader AI.',
      highlights: [
        'Rutinitas SE: 30 dial, 50 chat WA, 2 BANT ≥7, 1 survei',
        'Respon lead masuk diaudit ≤5 menit secara otonom',
        'Lead mangkrak >72 jam otomatis dialihkan ke SE lain',
      ],
      ctaLabel: 'Buka Reverse Funnel',
      onCta: onOpenSalesTarget,
    },
    {
      num: '06',
      title: 'Rute Harian SE di Peta',
      badge: 'Canvassing',
      summary:
        'Rute kunjungan canvassing dan Open Table Talk (OTT) tersusun jam demi jam secara geografis dari titik proyek.',
      highlights: [
        '08:30–10:00 · Zona A: Kompleks Pemkab Sukoharjo',
        '10:30–12:00 · Zona B: Sentra Perbankan & RS Ir. Soekarno',
        '14:00–16:30 · Standby Show Unit Nagoya & Osaka',
      ],
      ctaLabel: 'Eksplorasi Peta Radius',
      onCta: () => document.getElementById('peta-demo')?.scrollIntoView({ behavior: 'smooth' }),
    },
  ];

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const mm = gsap.matchMedia();

    // DESKTOP (lg+): Pinned Horizontal Scrub for 6 Stations
    mm.add('(min-width: 1024px)', () => {
      if (!railSectionRef.current || !trackRef.current) return;

      const getScrollDist = () => {
        if (!trackRef.current || !railSectionRef.current) return 0;
        return Math.max(0, trackRef.current.scrollWidth - railSectionRef.current.clientWidth + 64);
      };

      gsap.to(trackRef.current, {
        x: () => -getScrollDist(),
        ease: 'none',
        scrollTrigger: {
          trigger: railSectionRef.current,
          start: 'top top',
          end: () => `+=${Math.max(1200, getScrollDist() * 1.15)}`,
          pin: true,
          scrub: 0.85,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(6, Math.max(1, Math.round(self.progress * 5) + 1));
            setActiveStation(idx);
          },
        },
      });
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <>
      {/* ========================================================= */}
      {/* BAB 03: REL 6 LANGKAH — PINNED HORIZONTAL SCRUB (DESKTOP) */}
      {/* ========================================================= */}
      <section
        id="alur-6-langkah"
        ref={railSectionRef}
        className="bg-[#E4F1E8] border-b border-[#CFE1D5] py-14 sm:py-16 lg:py-12 lg:min-h-[100dvh] flex flex-col justify-center overflow-hidden"
      >
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 lg:px-12 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-mono uppercase tracking-widest text-[#2F9E5B] font-bold">
                Bab 03 · Rel 6 Stasiun Penjualan
              </p>
              <h2 className="font-display-v3 text-v3-chapter font-extrabold text-[#0B3D2E] mt-1.5">
                Satu input proyek, enam stasiun output.
              </h2>
            </div>

            {/* Station Progress Pill (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#CFE1D5]">
              <span className="text-xs font-mono font-bold text-[#3B5E50]">STASIUN</span>
              <span className="font-display-v3 font-extrabold text-lg text-[#0B3D2E] tabular-nums">
                0{activeStation}
              </span>
              <span className="text-xs font-mono text-[#3B5E50]">/ 06</span>
              <span className="ml-2 text-xs text-[#2F9E5B] font-semibold">
                Scroll untuk meluncur →
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Horizontal Pinned Track (lg:flex) */}
        <div className="hidden lg:block w-full overflow-visible">
          <div
            ref={trackRef}
            className="flex items-stretch gap-6 pl-12 pr-24 will-change-transform"
            style={{ width: 'max-content' }}
          >
            {stations.map((st, idx) => {
              const isCurrent = activeStation === idx + 1;
              return (
                <article
                  key={st.num}
                  className={`w-[440px] xl:w-[480px] shrink-0 rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 border ${
                    isCurrent
                      ? 'bg-white border-[#0B3D2E] shadow-[0_24px_54px_-22px_rgba(11,61,46,0.25)] scale-[1.01]'
                      : 'bg-white/85 border-[#CFE1D5] opacity-90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E4F1E8]">
                      <span className="font-display-v3 text-4xl font-extrabold text-[#0B3D2E] tabular-nums">
                        {st.num}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                          isCurrent
                            ? 'bg-[#C6F432] text-[#0B3D2E]'
                            : 'bg-[#E4F1E8] text-[#0B3D2E]'
                        }`}
                      >
                        {st.badge}
                      </span>
                    </div>

                    <h3 className="font-display-v3 text-2xl font-extrabold text-[#0B3D2E] mt-5">
                      {st.title}
                    </h3>
                    <p className="text-sm text-[#3B5E50] mt-2 leading-relaxed">
                      {st.summary}
                    </p>

                    <ul className="mt-5 space-y-2.5">
                      {st.highlights.map((hl, i) => (
                        <li
                          key={i}
                          className="p-3 rounded-xl bg-[#F6FAF7] border border-[#E4F1E8] text-xs font-medium text-[#0B3D2E] flex items-start gap-2.5"
                        >
                          <ArrowRight className="size-3.5 text-[#2F9E5B] shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E4F1E8]">
                    <button
                      onClick={st.onCta}
                      className="min-h-[44px] px-4 rounded-full bg-[#0B3D2E] text-white text-xs font-bold hover:bg-[#135440] transition-colors cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>{st.ctaLabel}</span>
                      <ExternalLink className="size-3.5 text-[#C6F432]" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Mobile & Tablet Vertical Station Timeline (<1024px) */}
        <div className="lg:hidden max-w-6xl w-full mx-auto px-4 sm:px-8 space-y-4">
          {stations.map((st) => (
            <article
              key={st.num}
              className="rounded-2xl bg-white border border-[#CFE1D5] p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-display-v3 text-2xl font-extrabold text-[#2F9E5B]">
                    {st.num}
                  </span>
                  <h3 className="font-display-v3 text-lg sm:text-xl font-extrabold text-[#0B3D2E]">
                    {st.title}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EAF4D3] text-[#0B3D2E] text-[11px] font-mono font-bold shrink-0">
                  {st.badge}
                </span>
              </div>

              <p className="text-sm text-[#3B5E50] leading-relaxed">{st.summary}</p>

              <ul className="space-y-2">
                {st.highlights.map((hl, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-lg bg-[#F6FAF7] border border-[#E4F1E8] text-xs text-[#0B3D2E] flex items-start gap-2"
                  >
                    <ArrowRight className="size-3.5 text-[#2F9E5B] shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={st.onCta}
                className="min-h-[44px] px-4 rounded-full bg-[#0B3D2E] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{st.ctaLabel}</span>
                <ExternalLink className="size-3.5 text-[#C6F432]" />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* BAB 04: MAP-FIRST "ARRIVAL" CHAPTER (#peta-demo)          */}
      {/* ========================================================= */}
      <MapChapterV3 />
    </>
  );
};
