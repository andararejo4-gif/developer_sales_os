// ============================================================================
// LABYRINTH PAGES (L1 -> L2 -> L3 SANDBOX -> SOFT CONVERSION)
// ============================================================================

import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Compass,
  FileText,
  Globe,
  MapPin,
  PhoneCall,
  Sparkles,
  Users,
  UserCheck,
  Lock,
} from 'lucide-react';
import {
  LABYRINTH_ROUTES,
  getBreadcrumbs,
  type LabyrinthRouteId,
} from '../lib/labyrinth/labyrinth-routes';
import {
  ALL_SE_ACTIVITY_CATEGORIES,
  getAiActivityGuide,
  calculateDistanceKm,
  PROJECT_BASE_COORDS,
} from '../lib/field-ops/field-ops-store';
import type { SeActivityCategory } from '../lib/field-ops/types';
import { calculateReverseFunnelActivity } from '../lib/playbook/playbook-generator';
import { LOVE_LETTER_POINTS } from '../lib/love-letter/points-data';
import { InteractiveMap } from './InteractiveMap';
import { PricingTable } from './PricingTable';

interface LabyrinthPagesProps {
  activeRoute: LabyrinthRouteId;
  onNavigate: (routeId: LabyrinthRouteId) => void;
  onOpenWizard: (preselectedPlan?: 'gold' | 'platinum' | 'diamond') => void;
  onOpenLoveLetterModal: () => void;
  onOpenDashboardDemo: (role?: string) => void;
}

export const LabyrinthPages: React.FC<LabyrinthPagesProps> = ({
  activeRoute,
  onNavigate,
  onOpenWizard,
  onOpenLoveLetterModal,
  onOpenDashboardDemo,
}) => {
  const meta = LABYRINTH_ROUTES[activeRoute];
  const breadcrumbs = getBreadcrumbs(activeRoute);

  // L3 Sandbox State 1: Field Ops & AI Guide Sandbox
  const [sandboxPlan, setSandboxPlan] = useState<'gold' | 'platinum' | 'diamond'>('platinum');
  const [sandboxActivity, setSandboxActivity] = useState<SeActivityCategory>('COLD_CALL_SLA_5_MENIT');
  const [simulatedCheckIn, setSimulatedCheckIn] = useState(false);

  // L3 Sandbox State 2: Reverse Funnel Simulator
  const [simUnits, setSimUnits] = useState(30);
  const [simMonths, setSimMonths] = useState(12);
  const [simSeCount, setSimSeCount] = useState(3);

  // L3 Sandbox State 3: 99 Points Search
  const [search99, setSearch99] = useState('');

  // L3 Sandbox State 4: Plan Advisor
  const [advisorProjects, setAdvisorProjects] = useState(1);
  const [advisorSeCount, setAdvisorSeCount] = useState(5);
  const [advisorNeedsAiGuide, setAdvisorNeedsAiGuide] = useState(true);

  const recommendedPlan: 'gold' | 'platinum' | 'diamond' =
    advisorProjects > 3 || advisorSeCount > 20
      ? 'diamond'
      : advisorNeedsAiGuide || advisorProjects > 1 || advisorSeCount > 5
      ? 'platinum'
      : 'gold';

  const unitsPerMonth = Math.max(1, Math.ceil(simUnits / simMonths));
  const funnelResult = calculateReverseFunnelActivity(unitsPerMonth);
  const perSeDailyCalls = Math.max(1, Math.ceil(funnelResult.dailyCallsRequired / simSeCount));

  const aiGuidePreview = getAiActivityGuide(sandboxActivity, sandboxPlan);

  const navigateTo = (id: LabyrinthRouteId) => {
    onNavigate(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumb Trail (Jejak Kedalaman Labirin) */}
      <nav className="flex flex-wrap items-center gap-2 text-xs bg-white px-4 py-2.5 rounded-2xl border border-warmborder shadow-2xs">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <ChevronRight className="size-3.5 text-warmmuted" />}
              <button
                onClick={() => navigateTo(crumb.id)}
                className={`font-bold transition-colors cursor-pointer ${
                  isLast ? 'text-terracotta' : 'text-warmmuted hover:text-espresso'
                }`}
              >
                {crumb.breadcrumbLabel}
              </button>
            </React.Fragment>
          );
        })}
        <span className="ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded bg-sandstone text-espresso border border-warmborder">
          Kedalaman: {meta.level}
        </span>
      </nav>

      {/* Page Title Hero Banner */}
      <div className="p-6 md:p-10 rounded-3xl bg-white border border-warmborder shadow-xs space-y-3">
        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-50 text-terracotta border border-amber-200">
          {meta.level} · Eksplorasi Mendalam
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-espresso tracking-tight leading-tight">
          {meta.title}
        </h1>
        <p className="text-sm text-warmmuted max-w-3xl leading-relaxed">{meta.subtitle}</p>
      </div>

      {/* =================================================================== */}
      {/* L1 HUB: EKOSISTEM PRODUK                                            */}
      {/* =================================================================== */}
      {activeRoute === 'l1-ekosistem' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              id: 'l2-field-ops' as LabyrinthRouteId,
              badge: 'BARU · Semua Paket + AI Platinum/Diamond',
              icon: NavigationIconPlaceholder,
              title: 'Absensi, GPS Tracking SE, Log Panggilan & AI Guide',
              desc: 'Validasi kehadiran dengan koordinat, rekam jejak kanvasing lapangan, audit panggilan telepon, plus asisten AI per aktivitas SE.',
            },
            {
              id: 'l2-love-letter' as LabyrinthRouteId,
              badge: 'Gratis Pintu Masuk',
              icon: FileText,
              title: 'Surat Cinta 99 Keunggulan & Knowledge Base',
              desc: 'Ubah brosur dan pricelist menjadi 99 alasan emosional yang 100% faktual + kuis kelulusan SE baru.',
            },
            {
              id: 'l2-market-target' as LabyrinthRouteId,
              badge: 'Intelijen Pasar',
              icon: Compass,
              title: 'Riset Pasar 25km & Target Sold Out 100%',
              desc: 'Pemetaan 5 persona pembeli, kompetitor radius 500m-25km, dan matematika reverse-funnel kuota SE.',
            },
            {
              id: 'l2-content-web' as LabyrinthRouteId,
              badge: 'Mesin Inbound',
              icon: Globe,
              title: 'Kalender Konten 90 Slot & Website Subdomain',
              desc: 'Jadwal posting 30 hari (TOFU/MOFU/BOFU) plus landing page proyek lengkap dengan simulator KPR.',
            },
            {
              id: 'l2-crm-komisi' as LabyrinthRouteId,
              badge: 'Konversi & Margin',
              icon: Users,
              title: 'CRM 7-Stage, Radar SLA 5m & Aturan Komisi',
              desc: 'Penandaan bawahan SE-TL, checklist follow-up berbasis tanggal, dan skema bagi komisi 100%.',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => navigateTo(card.id)}
                className="p-6 rounded-3xl bg-white border border-warmborder hover:border-terracotta transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-xl bg-amber-50 text-terracotta border border-amber-200 grid place-items-center">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sandstone text-espresso">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-espresso group-hover:text-terracotta transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-warmmuted leading-relaxed">{card.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-warmborder flex items-center justify-between text-xs font-extrabold text-terracotta">
                  <span>Buka Bedah Modul (L2)</span>
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* L1 HUB: STUDI KASUS THE PARK                                        */}
      {/* =================================================================== */}
      {activeRoute === 'l1-studi-kasus' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div
              onClick={() => navigateTo('l2-case-99')}
              className="p-6 rounded-3xl bg-white border border-warmborder hover:border-terracotta cursor-pointer group space-y-3 shadow-2xs"
            >
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-amber-50 text-terracotta">
                L2 · Eksplorasi Narasi Produk
              </span>
              <h3 className="text-lg font-extrabold text-espresso group-hover:text-terracotta">
                Bedah 99 Keunggulan Nyata The Park Townhouse Sukoharjo
              </h3>
              <p className="text-xs text-warmmuted leading-relaxed">
                Lihat bagaimana 30 unit townhouse 2 lantai di Mandan Sukoharjo dibedah menjadi 6 bab narasi tanpa klaim palsu.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-terracotta pt-2">
                Masuk ke L2 Bedah 99 Poin <ArrowRight className="size-4" />
              </span>
            </div>

            <div
              onClick={() => navigateTo('l2-case-radar')}
              className="p-6 rounded-3xl bg-white border border-warmborder hover:border-terracotta cursor-pointer group space-y-3 shadow-2xs"
            >
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-lime-100 text-olive">
                L2 · Eksplorasi Spasial GPS
              </span>
              <h3 className="text-lg font-extrabold text-espresso group-hover:text-terracotta">
                Peta Radar Fasilitas &amp; Kompetitor 500m – 25km
              </h3>
              <p className="text-xs text-warmmuted leading-relaxed">
                Ukur jarak riil ke RS Indriati, The Park Mall Solo Baru, dan kompetitor dari koordinat gerbang proyek.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-terracotta pt-2">
                Masuk ke L2 Peta Radar <ArrowRight className="size-4" />
              </span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-espresso text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-extrabold">Ingin Melihat Langsung Dasbor Proyek The Park?</h4>
              <p className="text-xs text-stone-300 mt-0.5">
                Coba masuk sebagai Direksi, Sales Manager, Team Leader, atau SE di lingkungan demo live.
              </p>
            </div>
            <button
              onClick={() => onOpenDashboardDemo('DIREKSI')}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer shrink-0"
            >
              Buka Live Dasbor The Park &rarr;
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* L1 HUB: SOLUSI PER PERAN                                            */}
      {/* =================================================================== */}
      {activeRoute === 'l1-peran' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            onClick={() => navigateTo('l2-role-se')}
            className="p-6 rounded-3xl bg-white border border-warmborder hover:border-terracotta cursor-pointer group space-y-3"
          >
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-amber-50 text-terracotta">
              L2 · Eksekusi Lapangan
            </span>
            <h3 className="text-lg font-extrabold text-espresso group-hover:text-terracotta">
              Ritme Kerja Sales Executive (Absen, GPS, Call Log &amp; AI Guide)
            </h3>
            <p className="text-xs text-warmmuted leading-relaxed">
              Pelajari bagaimana SE bekerja terstruktur dari pukul 08:00 hingga 17:30 tanpa bingung harus menghubungi siapa dan berkata apa.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-terracotta pt-2">
              Lihat Alur Harian SE (L2) <ArrowRight className="size-4" />
            </span>
          </div>

          <div
            onClick={() => navigateTo('l2-role-direksi')}
            className="p-6 rounded-3xl bg-white border border-warmborder hover:border-terracotta cursor-pointer group space-y-3"
          >
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-sandstone text-espresso">
              L2 · Kendali Pemilik Proyek
            </span>
            <h3 className="text-lg font-extrabold text-espresso group-hover:text-terracotta">
              Panel Kendali Direksi / Owner &amp; Transparansi Omset
            </h3>
            <p className="text-xs text-warmmuted leading-relaxed">
              Pantau beberapa proyek sekaligus dengan pemisahan ketat antara uang masuk riil (Akad) dan potensi (Booking).
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-terracotta pt-2">
              Lihat Panel Direksi (L2) <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* L1 HUB: PAKET & LISENSI                                             */}
      {/* =================================================================== */}
      {activeRoute === 'l1-paket' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-espresso">
                Bingung Memilih Paket Gold, Platinum, atau Diamond?
              </h3>
              <p className="text-xs text-warmmuted mt-0.5">
                Gunakan Penasihat Paket (L2) untuk mencocokkan jumlah proyek, jumlah SE, dan kebutuhan AI Activity Guide.
              </p>
            </div>
            <button
              onClick={() => navigateTo('l2-plan-advisor')}
              className="px-4 py-2 rounded-xl bg-espresso text-white text-xs font-bold cursor-pointer shrink-0 hover:bg-espresso/90"
            >
              Buka Penasihat Paket (L2) &rarr;
            </button>
          </div>
          <PricingTable onOpenWizard={() => onOpenWizard()} />
        </div>
      )}

      {/* =================================================================== */}
      {/* L2: FIELD OPS (ABSENSI, GPS TRACKING, CALL LOG, AI GUIDE) + L3      */}
      {/* =================================================================== */}
      {activeRoute === 'l2-field-ops' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: UserCheck,
                title: 'Absensi Berkoordinat',
                badge: 'Semua Paket',
                desc: 'Check-in & check-out harian mencatat jam dan koordinat GPS akurat.',
              },
              {
                icon: MapPin,
                title: 'Tracking GPS SE',
                badge: 'Semua Paket',
                desc: 'Rekam titik kanvasing RS, bank, dan survei beserta jarak km dari proyek.',
              },
              {
                icon: PhoneCall,
                title: 'Log Panggilan SE',
                badge: 'Semua Paket',
                desc: 'Audit durasi telepon & hasil kontak agar SLA 5 menit benar-benar terjadi.',
              },
              {
                icon: Sparkles,
                title: 'AI Activity Guide',
                badge: 'Platinum & Diamond',
                desc: 'Skrip pembuka, langkah eksekusi, & penanganan keberatan AI di tiap aktivitas.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl bg-white border border-warmborder space-y-2">
                  <div className="flex items-center justify-between">
                    <Icon className="size-5 text-terracotta" />
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sandstone text-espresso">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-espresso">{item.title}</h3>
                  <p className="text-xs text-warmmuted leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* L3 INTERACTIVE SANDBOX: COBA LANGSUNG AI ACTIVITY GUIDE & GPS CHECK-IN */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-terracotta/30 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warmborder pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta">
                  L3 Interactive Sandbox · Uji Coba Langsung
                </span>
                <h2 className="text-lg font-extrabold text-espresso">
                  Simulasi Operasional Lapangan &amp; AI Activity Guide
                </h2>
              </div>
              <div className="flex items-center gap-1.5 bg-sandstone p-1 rounded-xl border border-warmborder">
                {(['gold', 'platinum', 'diamond'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSandboxPlan(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all ${
                      sandboxPlan === p ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
                    }`}
                  >
                    Paket {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Sandbox Part A: GPS Check-in Sim */}
            <div className="p-4 rounded-2xl bg-sandstone/60 border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold text-espresso">
                  1. Simulasi Check-In GPS Kanvasing RS Indriati Solo Baru
                </p>
                <p className="text-[11px] text-warmmuted mt-0.5">
                  {simulatedCheckIn
                    ? `✓ Terekam pada -7.62500, 110.81200 · Jarak ${calculateDistanceKm(
                        PROJECT_BASE_COORDS.lat,
                        PROJECT_BASE_COORDS.lng,
                        -7.625,
                        110.812
                      )} km dari Gerbang The Park.`
                    : 'Klik tombol di kanan untuk mensimulasikan perekaman titik GPS SE lapangan.'}
                </p>
              </div>
              <button
                onClick={() => setSimulatedCheckIn(!simulatedCheckIn)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
                  simulatedCheckIn ? 'bg-olive text-white' : 'bg-terracotta text-white'
                }`}
              >
                {simulatedCheckIn ? '✓ Titik GPS Tercatat' : 'Simulasikan Check-In GPS'}
              </button>
            </div>

            {/* Sandbox Part B: AI Activity Guide Switcher */}
            <div className="space-y-4">
              <p className="text-xs font-extrabold text-espresso">
                2. Pilih Aktivitas SE untuk Melihat Panduan AI (Khusus Platinum &amp; Diamond):
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_SE_ACTIVITY_CATEGORIES.map((act) => (
                  <button
                    key={act.key}
                    onClick={() => setSandboxActivity(act.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      sandboxActivity === act.key
                        ? 'bg-terracotta text-white'
                        : 'bg-sandstone text-espresso hover:bg-warmborder/60'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              {!aiGuidePreview.isUnlocked ? (
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Lock className="size-5 text-terracotta shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold text-espresso">
                        Pada Paket Gold, AI Activity Guide Terkunci
                      </p>
                      <p className="text-xs text-warmmuted mt-0.5">
                        Paket Gold tetap mencakup Absensi, GPS Tracking, dan Log Panggilan. Beralih ke tab{' '}
                        <strong>Paket Platinum</strong> atau <strong>Diamond</strong> di atas untuk melihat skrip &amp; penanganan keberatan AI.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSandboxPlan('platinum')}
                    className="px-4 py-2 rounded-xl bg-espresso text-white text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Coba Mode Platinum
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-sandstone/40 border border-warmborder space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-olive flex items-center gap-1.5">
                      <Sparkles className="size-4 text-terracotta" /> {aiGuidePreview.guide.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lime-100 text-olive">
                      Aktif di {sandboxPlan.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-espresso italic bg-white p-3.5 rounded-xl border border-warmborder">
                    {aiGuidePreview.guide.openingScript}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3.5 rounded-xl border border-warmborder space-y-1.5">
                      <strong className="text-espresso">Langkah Eksekusi:</strong>
                      {aiGuidePreview.guide.executionSteps.slice(0, 3).map((s, i) => (
                        <p key={i} className="text-warmmuted">
                          {i + 1}. {s}
                        </p>
                      ))}
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-warmborder space-y-1.5">
                      <strong className="text-terracotta">Penanganan Keberatan:</strong>
                      {aiGuidePreview.guide.objectionHandlers.slice(0, 1).map((o, i) => (
                        <div key={i}>
                          <p className="font-bold text-espresso">{o.objection}</p>
                          <p className="text-warmmuted mt-1">{o.aiResponse}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* L2: MARKET TARGET & REVERSE FUNNEL SANDBOX (L3)                     */}
      {/* =================================================================== */}
      {(activeRoute === 'l2-market-target' || activeRoute === 'l2-role-se') && (
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-warmborder space-y-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta">
              L3 Interactive Sandbox · Matematika Target Penjualan
            </span>
            <h2 className="text-lg font-extrabold text-espresso mt-1">
              Hitung Beban Aktivitas Harian SE untuk Proyek Anda
            </h2>
            <p className="text-xs text-warmmuted mt-0.5">
              Geser slider sesuai data proyek Anda untuk melihat angka aktivitas nyata yang dibutuhkan hingga 100% sold out.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder">
              <div className="flex justify-between text-xs font-bold text-espresso mb-2">
                <span>Total Unit Proyek</span>
                <span className="text-terracotta">{simUnits} Unit</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={simUnits}
                onChange={(e) => setSimUnits(Number(e.target.value))}
                className="w-full accent-terracotta cursor-pointer"
              />
            </div>
            <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder">
              <div className="flex justify-between text-xs font-bold text-espresso mb-2">
                <span>Target Sold Out</span>
                <span className="text-terracotta">{simMonths} Bulan</span>
              </div>
              <input
                type="range"
                min="3"
                max="36"
                step="1"
                value={simMonths}
                onChange={(e) => setSimMonths(Number(e.target.value))}
                className="w-full accent-terracotta cursor-pointer"
              />
            </div>
            <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder">
              <div className="flex justify-between text-xs font-bold text-espresso mb-2">
                <span>Jumlah Sales Executive</span>
                <span className="text-terracotta">{simSeCount} Orang SE</span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={simSeCount}
                onChange={(e) => setSimSeCount(Number(e.target.value))}
                className="w-full accent-terracotta cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-espresso text-white">
              <span className="text-[10px] text-amber-300 font-bold uppercase">Target Tim / Bulan</span>
              <p className="text-2xl font-black mt-1">{unitsPerMonth} Unit</p>
            </div>
            <div className="p-4 rounded-2xl bg-sandstone border border-warmborder">
              <span className="text-[10px] text-warmmuted font-bold uppercase">Kebutuhan Survei / Bln</span>
              <p className="text-2xl font-black text-espresso mt-1">{funnelResult.surveyVisitRequired}</p>
            </div>
            <div className="p-4 rounded-2xl bg-sandstone border border-warmborder">
              <span className="text-[10px] text-warmmuted font-bold uppercase">Kebutuhan Leads / Bln</span>
              <p className="text-2xl font-black text-terracotta mt-1">{funnelResult.leadsRequired}</p>
            </div>
            <div className="p-4 rounded-2xl bg-lime-50 border border-lime-200">
              <span className="text-[10px] text-olive font-bold uppercase">Panggilan / SE / Hari</span>
              <p className="text-2xl font-black text-olive mt-1">{perSeDailyCalls} Call</p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* L2: BEDAH 99 KEUNGGULAN                                             */}
      {/* =================================================================== */}
      {(activeRoute === 'l2-case-99' || activeRoute === 'l2-love-letter') && (
        <div className="p-6 rounded-3xl bg-white border border-warmborder space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-espresso">
                Eksplorer Interaktif 99 Keunggulan Nyata
              </h2>
              <p className="text-xs text-warmmuted">
                Ketik kata kunci (misal: SHM, Indriati, Banjir, Bata Merah, Plafon) untuk melihat bukti faktualnya.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search99}
                onChange={(e) => setSearch99(e.target.value)}
                placeholder="Cari poin keunggulan..."
                className="h-9 px-3 rounded-xl border border-warmborder text-xs w-56"
              />
              <button
                onClick={onOpenLoveLetterModal}
                className="h-9 px-4 rounded-xl bg-terracotta text-white text-xs font-bold cursor-pointer shrink-0"
              >
                Baca Surat Lengkap (99)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LOVE_LETTER_POINTS.filter(
              (p) =>
                !search99 ||
                p.title.toLowerCase().includes(search99.toLowerCase()) ||
                p.narrative.toLowerCase().includes(search99.toLowerCase())
            )
              .slice(0, 9)
              .map((pt) => (
                <div key={pt.number} className="p-4 rounded-2xl bg-sandstone/40 border border-warmborder space-y-1.5">
                  <span className="text-[10px] font-extrabold text-terracotta">
                    Poin #{pt.number} · {pt.category}
                  </span>
                  <h4 className="text-xs font-extrabold text-espresso">{pt.title}</h4>
                  <p className="text-[11px] text-warmmuted leading-relaxed">{pt.narrative}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* L2: PETA RADAR SUKOHARJO                                            */}
      {/* =================================================================== */}
      {activeRoute === 'l2-case-radar' && (
        <div className="space-y-4">
          <InteractiveMap />
        </div>
      )}

      {/* =================================================================== */}
      {/* L2: CONTENT & WEB / CRM & KOMISI / DIREKSI                          */}
      {/* =================================================================== */}
      {(activeRoute === 'l2-content-web' ||
        activeRoute === 'l2-crm-komisi' ||
        activeRoute === 'l2-role-direksi') && (
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-warmborder space-y-5">
          <h2 className="text-lg font-extrabold text-espresso">
            Alur Operasional &amp; Bukti Nyata di Dasbor
          </h2>
          <p className="text-xs text-warmmuted leading-relaxed max-w-3xl">
            Modul ini terhubung langsung ke setiap proyek tanpa mencampur data antar proyek. Direksi melihat realisasi omset berdasarkan unit yang sudah Akad/Closing, sedangkan Sales Manager mengatur pembagian komisi 100% dan Team Leader mengawal SLA ≤ 5 menit.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenDashboardDemo(activeRoute === 'l2-role-direksi' ? 'DIREKSI' : 'SM')}
              className="px-5 py-2.5 rounded-xl bg-espresso text-white text-xs font-bold cursor-pointer hover:bg-espresso/90"
            >
              Buka Simulasi Dasbor Interaktif &rarr;
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* L2: PLAN ADVISOR (PENASIHAT PAKET HALUS)                            */}
      {/* =================================================================== */}
      {activeRoute === 'l2-plan-advisor' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white border-2 border-terracotta/30 space-y-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-terracotta">
              L3 Interactive Sandbox · Rekomendasi Kapasitas
            </span>
            <h2 className="text-lg font-extrabold text-espresso mt-1">
              Sesuaikan Skala Proyek Anda untuk Melihat Paket Paling Tepat
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-sandstone/60 border border-warmborder">
              <div className="flex justify-between text-xs font-bold text-espresso mb-2">
                <span>Jumlah Proyek Aktif</span>
                <span className="text-terracotta">{advisorProjects} Proyek</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={advisorProjects}
                onChange={(e) => setAdvisorProjects(Number(e.target.value))}
                className="w-full accent-terracotta cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-sandstone/60 border border-warmborder">
              <div className="flex justify-between text-xs font-bold text-espresso mb-2">
                <span>Jumlah Akun Sales In-House</span>
                <span className="text-terracotta">{advisorSeCount} User</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                value={advisorSeCount}
                onChange={(e) => setAdvisorSeCount(Number(e.target.value))}
                className="w-full accent-terracotta cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-sandstone/60 border border-warmborder flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-espresso">AI Activity Guide untuk SE?</p>
                <p className="text-[10px] text-warmmuted">Skrip &amp; objection handler AI tiap aktivitas</p>
              </div>
              <input
                type="checkbox"
                checked={advisorNeedsAiGuide}
                onChange={(e) => setAdvisorNeedsAiGuide(e.target.checked)}
                className="size-5 accent-terracotta cursor-pointer"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-espresso text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-amber-400">
                Rekomendasi Paling Sesuai Untuk Anda
              </span>
              <h3 className="text-xl font-black uppercase">Paket {recommendedPlan}</h3>
              <p className="text-xs text-stone-300">
                {recommendedPlan === 'diamond'
                  ? 'Proyek & akun tak terbatas, SM Semi-AI, TL Full AI, Absen, GPS Tracking, Log Panggilan & AI Activity Guide Pro.'
                  : recommendedPlan === 'platinum'
                  ? 'Hingga 3 proyek & 20 akun SE, TL Full AI, Absen, GPS Tracking, Log Panggilan & AI Activity Guide.'
                  : 'Fondasi solid untuk 1 proyek & 5 SE: Absen, GPS Tracking, Log Panggilan, Riset Pasar & CRM.'}
              </p>
            </div>
            <button
              onClick={() => onOpenWizard(recommendedPlan)}
              className="px-5 py-3 rounded-xl bg-terracotta text-white text-xs font-extrabold hover:bg-terracotta/90 cursor-pointer shrink-0 flex items-center gap-2"
            >
              <Sparkles className="size-4 text-amber-300" />
              <span>Daftar &amp; Mulai Demo Paket {recommendedPlan.toUpperCase()}</span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* JEMBATAN LABIRIN & KONVERSI HALUS (ADA DI SETIAP AKHIR HALAMAN)     */}
      {/* =================================================================== */}
      <div className="pt-4 border-t border-warmborder grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Jembatan Eksplorasi Lanjutan */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-warmborder space-y-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-warmmuted">
            Lanjutkan Eksplorasi Ekosistem (Lorong Terkait)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigateTo(activeRoute === 'l2-field-ops' ? 'l2-crm-komisi' : 'l2-field-ops')}
              className="p-3.5 rounded-2xl bg-sandstone/60 hover:bg-amber-50 border border-warmborder text-left transition-colors cursor-pointer group"
            >
              <p className="text-xs font-extrabold text-espresso group-hover:text-terracotta">
                {activeRoute === 'l2-field-ops'
                  ? 'Lihat CRM 7-Stage & Aturan Komisi →'
                  : 'Coba Sandbox Absen, GPS, Call & AI Guide →'}
              </p>
              <p className="text-[11px] text-warmmuted mt-0.5">
                {activeRoute === 'l2-field-ops'
                  ? 'Bagaimana log lapangan terhubung langsung ke pipeline penjualan.'
                  : 'Fitur monitoring lapangan SE & AI Coach Platinum/Diamond.'}
              </p>
            </button>
            <button
              onClick={() => navigateTo(activeRoute === 'l2-plan-advisor' ? 'l1-studi-kasus' : 'l2-plan-advisor')}
              className="p-3.5 rounded-2xl bg-sandstone/60 hover:bg-amber-50 border border-warmborder text-left transition-colors cursor-pointer group"
            >
              <p className="text-xs font-extrabold text-espresso group-hover:text-terracotta">
                {activeRoute === 'l2-plan-advisor'
                  ? 'Bedah Studi Kasus The Park Townhouse →'
                  : 'Hitung Paket Ideal (Gold / Platinum / Diamond) →'}
              </p>
              <p className="text-[11px] text-warmmuted mt-0.5">
                {activeRoute === 'l2-plan-advisor'
                  ? 'Lihat bukti implementasi 30 unit proyek percontohan.'
                  : 'Cocokkan jumlah proyek dan tim SE Anda.'}
              </p>
            </button>
          </div>
        </div>

        {/* Muara Halus: Daftar Akun Baru & Pilih Paket */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-espresso text-white flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
              Siap Mencoba Untuk Proyek Anda?
            </span>
            <h3 className="text-base font-extrabold mt-1">
              Buat Akun Baru &amp; Dapatkan Surat Cinta 99 Keunggulan Gratis
            </h3>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              Mulai demo 30 hari tanpa risiko atau konsultasikan aktivasi paket Gold, Platinum, dan Diamond untuk tim Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onOpenWizard()}
              className="px-4 py-2.5 rounded-xl bg-terracotta text-white text-xs font-extrabold hover:bg-terracotta/90 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5 text-amber-300" />
              <span>Daftar Akun Baru (Gratis)</span>
            </button>
            <button
              onClick={() => navigateTo('l1-paket')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
            >
              Bandingkan Paket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function NavigationIconPlaceholder({ className }: { className?: string }) {
  return <MapPin className={className} />;
}
