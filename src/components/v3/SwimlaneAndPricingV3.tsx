import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, Minus, Sliders } from 'lucide-react';
import { PLANS_CONFIG, getPlanDisplayPrice } from '../../lib/plans/plans-config';
import { PlanCheckoutModal } from '../PlanCheckoutModal';

gsap.registerPlugin(ScrollTrigger);

interface SwimlaneAndPricingV3Props {
  onOpenWizard: (planCode?: 'gold' | 'platinum' | 'diamond') => void;
}

const TIME_SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

const SWIMLANES = [
  {
    key: 'se',
    role: 'Sales Executive (SE)',
    mode: 'Manusia Dibantu AI',
    availability: 'Gold · Platinum · Diamond',
    blocks: [
      { startPct: 2, widthPct: 26, time: '08:30–10:30', label: 'Canvassing & Rute Harian', triggerAt: 0.1 },
      { startPct: 33, widthPct: 28, time: '11:00–13:30', label: 'WA Personal & Telepon (99 Poin)', triggerAt: 0.4 },
      { startPct: 65, widthPct: 32, time: '14:00–17:45', label: 'Pendampingan Survei & Laporan Voice', triggerAt: 0.72 },
    ],
  },
  {
    key: 'tl',
    role: 'Team Leader (TL)',
    mode: 'TL Full AI · Otonom 24/7',
    availability: 'Platinum · Diamond',
    blocks: [
      { startPct: 4, widthPct: 30, time: '08:00–11:00', label: 'Audit SLA Respon ≤5 Menit', triggerAt: 0.12 },
      { startPct: 38, widthPct: 26, time: '11:30–14:30', label: 'Kualifikasi BANT & Distribusi Lead', triggerAt: 0.45 },
      { startPct: 68, widthPct: 29, time: '15:00–18:00', label: 'Penegakan Aturan 72 Jam & Scorecard', triggerAt: 0.75 },
    ],
  },
  {
    key: 'sm',
    role: 'Sales Manager (SM)',
    mode: 'SM Semi-AI · Persetujuan Manusia',
    availability: 'Diamond',
    blocks: [
      { startPct: 12, widthPct: 26, time: '09:30–11:30', label: 'Review Serapan Unit Klaster', triggerAt: 0.22 },
      { startPct: 46, widthPct: 24, time: '12:30–15:00', label: 'Setujui Draf Promo (Harga Terkunci)', triggerAt: 0.54 },
      { startPct: 75, widthPct: 22, time: '16:00–18:00', label: 'Audit Log Persetujuan Harian', triggerAt: 0.82 },
    ],
  },
];

const MATRIX_ROWS = [
  { name: 'Masa langganan: 3 bulan', gold: '3 bulan', platinum: '3 bulan', diamond: '3 bulan' },
  { name: 'Surat Cinta 99 Keunggulan', gold: 'Gratis Semua', platinum: 'Gratis Semua', diamond: 'Gratis Semua' },
  { name: 'Riset Pasar Radius 500m - 25km', gold: 'Tingkat Dasar', platinum: 'Lengkap', diamond: 'Lengkap + Berkala' },
  { name: 'Target Penjualan s.d. Sold Out', gold: true, platinum: true, diamond: true },
  { name: 'Website Landing Page Per Proyek', gold: 'Template Standar', platinum: 'Kustom Section', diamond: 'Kustom Penuh + Domain' },
  { name: 'Kalender Konten Akun Official', gold: '1 Bulan', platinum: '1 Bulan + Hashtag', diamond: 'Jadwal + Pengingat' },
  { name: 'Kalender Konten Sales In-House', gold: false, platinum: 'Add-on', diamond: 'Termasuk' },
  { name: 'Playbook Sales Executive & Rute', gold: true, platinum: true, diamond: true },
  { name: 'Peran AI: Team Leader (TL)', gold: 'Dokumen Manual', platinum: 'TL Full AI', diamond: 'TL Full AI' },
  { name: 'Peran AI: Sales Manager (SM)', gold: 'Dokumen Manual', platinum: 'Dokumen Manual', diamond: 'SM Semi-AI (Manusia Setuju)' },
  { name: 'CRM & Pipeline Penjualan', gold: 'Dasar', platinum: 'Penuh + KPI Harian', diamond: 'Penuh + Dasbor Eksekutif' },
  { name: 'Batas Proyek Aktif', gold: '1 Proyek', platinum: '3 Proyek', diamond: 'Tak Terbatas' },
  { name: 'Batas Akun Sales In-House', gold: '5 User', platinum: '20 User', diamond: 'Tak Terbatas' },
  { name: 'Tingkat Layanan Dukungan', gold: 'Email', platinum: 'Prioritas', diamond: 'Pendamping Khusus' },
];

export const SwimlaneAndPricingV3: React.FC<SwimlaneAndPricingV3Props> = ({ onOpenWizard }) => {
  const swimlaneRef = useRef<HTMLElement>(null);
  const [sweepProgress, setSweepProgress] = useState<number>(0.15);
  const [mobileRole, setMobileRole] = useState<string>('tl');
  const [checkoutPlan, setCheckoutPlan] = useState<'gold' | 'platinum' | 'diamond' | null>(null);

  // Plan Configurator inputs
  const [projectCount, setProjectCount] = useState<number>(2);
  const [salesCount, setSalesCount] = useState<number>(12);

  const recommendedCode = useMemo<'gold' | 'platinum' | 'diamond'>(() => {
    if (projectCount > 3 || salesCount > 20) return 'diamond';
    if (projectCount > 1 || salesCount > 5) return 'platinum';
    return 'gold';
  }, [projectCount, salesCount]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !swimlaneRef.current) {
      setSweepProgress(1);
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: swimlaneRef.current,
        start: 'top 65%',
        end: 'bottom 45%',
        scrub: 0.6,
        onUpdate: (self) => {
          setSweepProgress(self.progress);
        },
      });
    }, swimlaneRef);

    return () => ctx.revert();
  }, []);

  const renderCell = (val: string | boolean) => {
    if (val === true) return <Check className="size-4 text-[#2F9E5B] mx-auto" />;
    if (val === false) return <Minus className="size-4 text-[#9FB8A8] mx-auto" />;
    return <span className="text-xs font-semibold text-[#0B3D2E]">{val}</span>;
  };

  return (
    <>
      {/* ========================================================= */}
      {/* BAB 05: SWIMLANE PERAN AI (08:00 - 18:00)                 */}
      {/* ========================================================= */}
      <section
        id="peran-ai"
        ref={swimlaneRef}
        className="bg-white border-b border-[#CFE1D5] py-14 sm:py-20 lg:py-24"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-mono uppercase tracking-widest text-[#2F9E5B] font-bold">
              Bab 05 · Swimlane Operasional Harian
            </p>
            <h2 className="font-display-v3 text-v3-chapter font-extrabold text-[#0B3D2E] mt-2">
              Kapan manusia bernegosiasi, kapan AI mengawasi.
            </h2>
            <p className="text-sm sm:text-base text-[#3B5E50] mt-3 leading-relaxed">
              Garis waktu 08:00 hingga 18:00 menunjukkan pembagian peran tegas antara SE, TL Full AI, dan SM Semi-AI.
            </p>
          </div>

          {/* DESKTOP HORIZONTAL SWIMLANE WITH SCROLL PLAYHEAD (lg:block) */}
          <div className="hidden lg:block rounded-2xl border border-[#CFE1D5] bg-[#F6FAF7] p-6 relative overflow-hidden">
            {/* Time Axis Header */}
            <div className="grid grid-cols-12 items-center pb-4 border-b border-[#CFE1D5]">
              <div className="col-span-3 text-xs font-mono font-bold uppercase text-[#3B5E50]">
                Peran &amp; Mode
              </div>
              <div className="col-span-9 grid grid-cols-6 text-xs font-mono font-bold text-[#3B5E50]">
                {TIME_SLOTS.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>

            {/* Swimlanes Container */}
            <div className="relative divide-y divide-[#CFE1D5]">
              {/* Vertical Scroll-Scrubbed Playhead over the 9-col timeline area */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 bottom-0 left-[25%] right-0 z-20"
              >
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-[#2F9E5B] transition-none"
                  style={{ left: `${Math.min(98, Math.max(1, sweepProgress * 100))}%` }}
                >
                  <span className="absolute -top-2 -left-1.5 size-3.5 rounded-full bg-[#C6F432] border-2 border-[#0B3D2E]" />
                </div>
              </div>

              {SWIMLANES.map((lane) => (
                <div key={lane.key} className="grid grid-cols-12 items-center py-6 gap-4">
                  <div className="col-span-3 pr-3">
                    <h3 className="font-display-v3 font-extrabold text-base text-[#0B3D2E]">
                      {lane.role}
                    </h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#EAF4D3] text-[#0B3D2E] text-[11px] font-mono font-bold">
                      {lane.mode}
                    </span>
                    <p className="text-[11px] font-mono text-[#3B5E50] mt-1.5">
                      {lane.availability}
                    </p>
                  </div>

                  <div className="col-span-9 relative h-20">
                    {/* Faint hour grid lines */}
                    <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
                      {TIME_SLOTS.map((t) => (
                        <div key={t} className="border-l border-dashed border-[#CFE1D5]" />
                      ))}
                    </div>

                    {lane.blocks.map((blk, i) => {
                      const isLit = sweepProgress >= blk.triggerAt;
                      return (
                        <div
                          key={i}
                          style={{
                            left: `${blk.startPct}%`,
                            width: `${blk.widthPct}%`,
                          }}
                          className={`absolute top-2 bottom-2 rounded-xl px-3.5 py-2 flex flex-col justify-center border transition-all duration-300 ${
                            isLit
                              ? lane.key === 'tl'
                                ? 'bg-[#C6F432] border-[#0B3D2E] text-[#0B3D2E] shadow-[0_10px_24px_-12px_rgba(11,61,46,0.3)]'
                                : 'bg-white border-[#2F9E5B] text-[#0B3D2E] shadow-[0_10px_24px_-14px_rgba(11,61,46,0.2)]'
                              : 'bg-white/60 border-[#CFE1D5] text-[#3B5E50]'
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold opacity-80">
                            {blk.time}
                          </span>
                          <span className="text-xs font-bold leading-snug line-clamp-2 mt-0.5">
                            {blk.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MOBILE & TABLET ROLE TABS (<1024px) */}
          <div className="lg:hidden space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SWIMLANES.map((lane) => (
                <button
                  key={lane.key}
                  onClick={() => setMobileRole(lane.key)}
                  className={`min-h-[44px] px-4 rounded-full text-xs font-bold shrink-0 cursor-pointer border transition-colors ${
                    mobileRole === lane.key
                      ? 'bg-[#0B3D2E] text-[#C6F432] border-[#0B3D2E]'
                      : 'bg-[#F6FAF7] text-[#0B3D2E] border-[#CFE1D5]'
                  }`}
                >
                  {lane.role}
                </button>
              ))}
            </div>

            {SWIMLANES.filter((l) => l.key === mobileRole).map((lane) => (
              <div key={lane.key} className="rounded-2xl border border-[#CFE1D5] bg-[#F6FAF7] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#C6F432] text-[#0B3D2E] text-xs font-mono font-bold">
                    {lane.mode}
                  </span>
                  <span className="text-xs font-mono text-[#3B5E50]">{lane.availability}</span>
                </div>
                <div className="space-y-2.5 pt-2">
                  {lane.blocks.map((blk, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white border border-[#CFE1D5]">
                      <span className="text-xs font-mono font-bold text-[#2F9E5B]">{blk.time}</span>
                      <p className="font-bold text-sm text-[#0B3D2E] mt-0.5">{blk.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* BAB 06: KONFIGURATOR PAKET & MATRIKS DINAMIS              */}
      {/* ========================================================= */}
      <section
        id="paket-harga"
        className="bg-[#EAF4D3]/55 border-b border-[#CFE1D5] py-14 sm:py-20 lg:py-24"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <p className="text-xs font-mono uppercase tracking-widest text-[#2F9E5B] font-bold">
              Bab 06 · Konfigurator Skala Developer
            </p>
            <h2 className="font-display-v3 text-v3-chapter font-extrabold text-[#0B3D2E] mt-2">
              Geser kebutuhan tim, sistem merekomendasikan paketnya.
            </h2>
            <p className="text-sm sm:text-base text-[#3B5E50] mt-2.5 leading-relaxed">
              Seluruh paket tetap membuka Surat Cinta 99 Keunggulan gratis di awal.
            </p>
          </div>

          {/* Interactive Sliders Bar */}
          <div className="rounded-2xl bg-white border border-[#CFE1D5] p-5 sm:p-7 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="v3-proj-slider" className="text-sm font-bold text-[#0B3D2E] flex items-center gap-2">
                  <Sliders className="size-4 text-[#2F9E5B]" />
                  <span>Jumlah Proyek Aktif</span>
                </label>
                <span className="font-display-v3 text-2xl font-extrabold text-[#0B3D2E] tabular-nums">
                  {projectCount >= 6 ? '6+ Proyek' : `${projectCount} Proyek`}
                </span>
              </div>
              <input
                id="v3-proj-slider"
                type="range"
                min={1}
                max={6}
                value={projectCount}
                onChange={(e) => setProjectCount(Number(e.target.value))}
                className="v3-slider w-full"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#3B5E50] mt-2">
                <span>1 (Gold)</span>
                <span>2–3 (Platinum)</span>
                <span>4+ (Diamond)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="v3-sales-slider" className="text-sm font-bold text-[#0B3D2E]">
                  Jumlah Akun Sales In-House
                </label>
                <span className="font-display-v3 text-2xl font-extrabold text-[#0B3D2E] tabular-nums">
                  {salesCount >= 30 ? '30+ User' : `${salesCount} User`}
                </span>
              </div>
              <input
                id="v3-sales-slider"
                type="range"
                min={1}
                max={30}
                value={salesCount}
                onChange={(e) => setSalesCount(Number(e.target.value))}
                className="v3-slider w-full"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#3B5E50] mt-2">
                <span>1–5 (Gold)</span>
                <span>6–20 (Platinum)</span>
                <span>21+ (Diamond)</span>
              </div>
            </div>
          </div>

          {/* Dynamic Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-10">
            {PLANS_CONFIG.map((plan) => {
              const isRec = plan.code === recommendedCode;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border ${
                    isRec
                      ? 'bg-white border-[#0B3D2E] border-2 shadow-[0_24px_56px_-22px_rgba(11,61,46,0.26)] md:-translate-y-1.5'
                      : 'bg-white/80 border-[#CFE1D5]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 min-h-[28px]">
                      <h3 className="font-display-v3 text-2xl font-extrabold text-[#0B3D2E]">
                        {plan.name}
                      </h3>
                      {isRec && (
                        <span className="px-3 py-1 rounded-full bg-[#C6F432] text-[#0B3D2E] text-[11px] font-mono font-bold uppercase">
                          Cocok untuk Anda
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[#3B5E50] mt-2 leading-relaxed min-h-[42px]">
                      {plan.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#E4F1E8]">
                      <span className="font-display-v3 text-2xl sm:text-3xl font-extrabold text-[#0B3D2E] tabular-nums">
                        {getPlanDisplayPrice(plan)}
                      </span>
                    </div>

                    <ul className="mt-5 space-y-2.5 text-sm text-[#0B3D2E]">
                      <li className="flex items-start gap-2.5 font-semibold">
                        <Check className="size-4 text-[#2F9E5B] shrink-0 mt-0.5" />
                        <span>
                          Maks. {plan.max_active_projects >= 999 ? 'Tak Terbatas' : `${plan.max_active_projects} Proyek Aktif`}
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5 font-semibold">
                        <Check className="size-4 text-[#2F9E5B] shrink-0 mt-0.5" />
                        <span>
                          Maks. {plan.max_sales_users >= 999 ? 'Tak Terbatas' : `${plan.max_sales_users} User Sales`}
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="size-4 text-[#2F9E5B] shrink-0 mt-0.5" />
                        <span>{plan.code === 'gold' ? 'Playbook Manual' : 'Playbook + TL Full AI'}</span>
                      </li>
                      {plan.code === 'diamond' && (
                        <li className="flex items-start gap-2.5 font-bold text-[#0B3D2E]">
                          <Check className="size-4 text-[#2F9E5B] shrink-0 mt-0.5" />
                          <span>SM Semi-AI (Persetujuan Manusia)</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-6 flex flex-col items-center">
                    <button
                      onClick={() => onOpenWizard(plan.code)}
                      className={`w-full min-h-[48px] rounded-full font-bold text-sm transition-colors cursor-pointer ${
                        isRec
                          ? 'bg-[#0B3D2E] text-[#C6F432] hover:bg-[#135440]'
                          : 'bg-[#E4F1E8] text-[#0B3D2E] hover:bg-[#CFE1D5]'
                      }`}
                    >
                      Mulai dengan {plan.name}
                    </button>
                    <a
                      href="#row-masa-langganan-v3"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('row-masa-langganan-v3') || document.getElementById('row-masa-langganan-v3-mobile');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="text-xs text-[#2F9E5B] hover:text-[#0B3D2E] underline font-medium text-center block mt-2.5 transition-colors cursor-pointer"
                    >
                      Lihat rincian paket &darr;
                    </a>
                    <button
                      type="button"
                      onClick={() => setCheckoutPlan(plan.code)}
                      className="text-[11px] font-mono text-[#3B5E50] hover:text-[#0B3D2E] underline mt-1.5 cursor-pointer block text-center"
                    >
                      Lihat Invoice &amp; Checkout &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Complete Comparison Matrix — Zero Horizontal Scroll on Mobile (<640px), Full 4-Col Table on sm+ */}
          <div className="rounded-2xl bg-white border border-[#CFE1D5] overflow-clip">
            <div className="px-4 sm:px-5 py-4 bg-[#F6FAF7] border-b border-[#CFE1D5] flex items-center justify-between gap-2">
              <span className="font-display-v3 font-bold text-sm sm:text-base text-[#0B3D2E]">
                Matriks Fitur Lengkap
              </span>
              <span className="text-xs font-mono text-[#2F9E5B] font-bold uppercase">
                Sorotan: {recommendedCode}
              </span>
            </div>

            {/* MOBILE 2-ROW ZERO-SCROLL MATRIX (<640px): Sticky 3-Col Header + Full-Width Feature Title + 3 Aligned Cells */}
            <div className="sm:hidden">
              <div className="sticky top-14 z-20 grid grid-cols-3 border-b border-[#CFE1D5] bg-white text-[11px] font-mono font-extrabold uppercase text-center shadow-[0_2px_8px_rgba(11,61,46,0.06)]">
                <div className={`py-2.5 px-1 border-r border-[#E4F1E8] ${recommendedCode === 'gold' ? 'bg-[#EAF4D3] text-[#0B3D2E]' : 'text-[#3B5E50]'}`}>
                  Gold
                </div>
                <div className={`py-2.5 px-1 border-r border-[#E4F1E8] ${recommendedCode === 'platinum' ? 'bg-[#EAF4D3] text-[#0B3D2E]' : 'text-[#3B5E50]'}`}>
                  Platinum
                </div>
                <div className={`py-2.5 px-1 ${recommendedCode === 'diamond' ? 'bg-[#EAF4D3] text-[#0B3D2E]' : 'text-[#3B5E50]'}`}>
                  Diamond
                </div>
              </div>

              <div className="divide-y divide-[#CFE1D5]">
                {MATRIX_ROWS.map((row, idx) => (
                  <div
                    key={idx}
                    id={idx === 0 ? 'row-masa-langganan-v3-mobile' : undefined}
                    className={`bg-white ${idx === 0 ? 'border-l-4 border-l-[#2F9E5B]' : ''}`}
                  >
                    <div className="px-3.5 pt-3 pb-1.5 text-xs font-bold text-[#0B3D2E] bg-[#F6FAF7]/70 flex items-center justify-between">
                      <span>{row.name}</span>
                      {idx === 0 && (
                        <span className="text-[10px] font-mono text-[#2F9E5B] uppercase font-bold">
                          Lisensi Pokok
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-[#E4F1E8] text-center">
                      <div className={`py-2.5 px-1.5 flex items-center justify-center leading-tight text-[11px] ${recommendedCode === 'gold' ? 'bg-[#EAF4D3]/55' : ''}`}>
                        {renderCell(row.gold)}
                      </div>
                      <div className={`py-2.5 px-1.5 flex items-center justify-center leading-tight text-[11px] ${recommendedCode === 'platinum' ? 'bg-[#EAF4D3]/55' : ''}`}>
                        {renderCell(row.platinum)}
                      </div>
                      <div className={`py-2.5 px-1.5 flex items-center justify-center leading-tight text-[11px] ${recommendedCode === 'diamond' ? 'bg-[#EAF4D3]/55' : ''}`}>
                        {renderCell(row.diamond)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP & TABLET 4-COLUMN TABLE (sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CFE1D5] text-xs font-mono uppercase text-[#3B5E50]">
                    <th className="p-4 font-bold text-[#0B3D2E]">Fitur &amp; Kapasitas</th>
                    <th className={`p-4 text-center font-bold ${recommendedCode === 'gold' ? 'bg-[#EAF4D3] text-[#0B3D2E]' : ''}`}>
                      Gold
                    </th>
                    <th className={`p-4 text-center font-bold ${recommendedCode === 'platinum' ? 'bg-[#EAF4D3] text-[#0B3D2E]' : ''}`}>
                      Platinum
                    </th>
                    <th className={`p-4 text-center font-bold ${recommendedCode === 'diamond' ? 'bg-[#EAF4D3] text-[#0B3D2E]' : ''}`}>
                      Diamond
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4F1E8] text-sm">
                  {MATRIX_ROWS.map((row, idx) => (
                    <tr
                      key={idx}
                      id={idx === 0 ? 'row-masa-langganan-v3' : undefined}
                      className={idx === 0 ? 'bg-[#F6FAF7]/80 font-semibold' : undefined}
                    >
                      <td className="p-4 font-medium text-[#0B3D2E] flex items-center gap-2">
                        <span>{row.name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-mono text-[#2F9E5B] bg-[#EAF4D3] px-2 py-0.5 rounded font-bold uppercase">
                            Lisensi Pokok
                          </span>
                        )}
                      </td>
                      <td className={`p-4 text-center transition-colors ${recommendedCode === 'gold' ? 'bg-[#EAF4D3]/55' : ''}`}>
                        {renderCell(row.gold)}
                      </td>
                      <td className={`p-4 text-center transition-colors ${recommendedCode === 'platinum' ? 'bg-[#EAF4D3]/55' : ''}`}>
                        {renderCell(row.platinum)}
                      </td>
                      <td className={`p-4 text-center transition-colors ${recommendedCode === 'diamond' ? 'bg-[#EAF4D3]/55' : ''}`}>
                        {renderCell(row.diamond)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <PlanCheckoutModal
        isOpen={!!checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        initialPlanCode={checkoutPlan || 'platinum'}
      />
    </>
  );
};
