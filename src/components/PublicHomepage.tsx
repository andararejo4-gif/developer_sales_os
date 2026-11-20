import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { CommandPalette } from './CommandPalette';
import { Hero } from './Hero';
import { SocialProof } from './SocialProof';
import { SixStepsWorkflow } from './SixStepsWorkflow';
import { InteractiveMap } from './InteractiveMap';
import { PricingTable } from './PricingTable';
import { AiRolesExplanation } from './AiRolesExplanation';
import { FaqAndCta } from './FaqAndCta';
import { Footer } from './Footer';
import { OnboardingWizardModal } from './OnboardingWizardModal';
import { LoveLetterViewerModal } from './LoveLetterViewerModal';
import { LoginModal } from './LoginModal';
import { MarketResearchViewer } from './MarketResearchViewer';
import { SalesTargetViewer } from './SalesTargetViewer';
import { JalurProyek } from './JalurProyek';
import { ContentCalendarViewer } from './ContentCalendarViewer';
import { PlaybookViewer } from './PlaybookViewer';
import { DailyRouteViewer } from './DailyRouteViewer';
import { ProjectWebsitePreview } from './ProjectWebsitePreview';
import { CrmPipelineView } from './CrmPipelineView';
import { SuperadminPanel } from './SuperadminPanel';
import { LabyrinthPages } from './LabyrinthPages';
import type { LabyrinthRouteId } from '../lib/labyrinth/labyrinth-routes';
import { ArrowRight, Compass, MapPin, Sparkles, Users } from 'lucide-react';

interface PublicHomepageProps {
  onEnterDashboard: (role?: string) => void;
}

export const PublicHomepage: React.FC<PublicHomepageProps> = ({ onEnterDashboard }) => {
  const [activeRoute, setActiveRoute] = useState<LabyrinthRouteId>('l0-beranda');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLoveLetterOpen, setIsLoveLetterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMarketResearchOpen, setIsMarketResearchOpen] = useState(false);
  const [isSalesTargetOpen, setIsSalesTargetOpen] = useState(false);
  const [isJalurProyekOpen, setIsJalurProyekOpen] = useState(false);
  const [isContentCalendarOpen, setIsContentCalendarOpen] = useState(false);
  const [isPlaybookOpen, setIsPlaybookOpen] = useState(false);
  const [isDailyRouteOpen, setIsDailyRouteOpen] = useState(false);
  const [isWebsitePreviewOpen, setIsWebsitePreviewOpen] = useState(false);
  const [isCrmPipelineOpen, setIsCrmPipelineOpen] = useState(false);
  const [isSuperadminOpen, setIsSuperadminOpen] = useState(false);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K to toggle Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-sandstone text-espresso font-sans selection:bg-terracotta/20 selection:text-terracotta">
      {/* 1. Navbar dengan Rute Kedalaman L0 -> L1 */}
      <Navbar
        activeRoute={activeRoute}
        onNavigateRoute={setActiveRoute}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onScrollTo={scrollToSection}
      />

      {activeRoute !== 'l0-beranda' ? (
        <main>
          <LabyrinthPages
            activeRoute={activeRoute}
            onNavigate={setActiveRoute}
            onOpenWizard={() => setIsWizardOpen(true)}
            onOpenLoveLetterModal={() => setIsLoveLetterOpen(true)}
            onOpenDashboardDemo={onEnterDashboard}
          />
        </main>
      ) : (
        <main>
          {/* 2. Hero Section */}
          <Hero
            onOpenWizard={() => setIsWizardOpen(true)}
            onScrollToCaseStudy={() => setActiveRoute('l1-studi-kasus')}
          />

          {/* 3. Strip Bukti Sosial (The Park Townhouse Sukoharjo) */}
          <SocialProof
            onOpenLoveLetter={() => setIsLoveLetterOpen(true)}
            onScrollToMap={() => setActiveRoute('l2-case-radar')}
          />

          {/* 3B. GERBANG LABIRIN KEDALAMAN WEBSITE (L0 -> L1 -> L2 -> L3) */}
          <section id="fitur-utama" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-warmborder shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-50 text-terracotta border border-amber-200">
                    Eksplorasi Kedalaman Ekosistem (L1 &rarr; L2)
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-espresso mt-2">
                    Telusuri Bagaimana Setiap Bagian Proyek Anda Saling Terhubung
                  </h2>
                  <p className="text-xs text-warmmuted mt-1 max-w-2xl">
                    Pilih pintu eksplorasi di bawah ini untuk melihat studi kasus nyata, mencoba sandbox AI, dan menghitung kebutuhan tim Anda secara gratis.
                  </p>
                </div>
                <button
                  onClick={() => setActiveRoute('l1-ekosistem')}
                  className="text-xs font-extrabold text-terracotta hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  Lihat Semua Pintu Ekosistem (L1) <ArrowRight className="size-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    route: 'l2-field-ops' as LabyrinthRouteId,
                    icon: MapPin,
                    tag: 'L2 · Baru + AI Coach',
                    title: 'Absen, GPS Tracking, Call Log & AI Guide',
                    desc: 'Kendali penuh aktivitas SE lapangan + panduan AI tiap aktivitas (Platinum & Diamond).',
                  },
                  {
                    route: 'l2-market-target' as LabyrinthRouteId,
                    icon: Compass,
                    tag: 'L2 · Sandbox Target',
                    title: 'Riset 25km & Simulasi Sold Out',
                    desc: 'Hitung mundur kebutuhan survei & panggilan harian tiap SE untuk proyek Anda.',
                  },
                  {
                    route: 'l2-case-99' as LabyrinthRouteId,
                    icon: Sparkles,
                    tag: 'L2 · The Park Case',
                    title: 'Bedah 99 Keunggulan Nyata',
                    desc: 'Eksplorasi bagaimana brosur proyek diubah jadi 99 alasan beli yang faktual.',
                  },
                  {
                    route: 'l2-plan-advisor' as LabyrinthRouteId,
                    icon: Users,
                    tag: 'L2 · Penasihat Paket',
                    title: 'Cocokkan Paket Gold / Platinum / Diamond',
                    desc: 'Tentukan kapasitas paling efisien sesuai jumlah proyek dan SE Anda.',
                  },
                ].map((door) => {
                  const Icon = door.icon;
                  return (
                    <button
                      key={door.route}
                      onClick={() => {
                        setActiveRoute(door.route);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-4 rounded-2xl bg-sandstone/60 hover:bg-amber-50/70 border border-warmborder hover:border-terracotta text-left transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Icon className="size-4 text-terracotta" />
                          <span className="text-[10px] font-bold text-warmmuted">{door.tag}</span>
                        </div>
                        <h3 className="text-xs font-extrabold text-espresso group-hover:text-terracotta leading-snug">
                          {door.title}
                        </h3>
                        <p className="text-[11px] text-warmmuted leading-relaxed">{door.desc}</p>
                      </div>
                      <span className="mt-3 pt-2 border-t border-warmborder text-[11px] font-extrabold text-terracotta inline-flex items-center gap-1">
                        Masuk &amp; Coba Sandbox <ArrowRight className="size-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. Alur 6 Langkah Interaktif */}
          <section id="alur-6-langkah" className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SixStepsWorkflow
              onOpenLoveLetter={() => setIsLoveLetterOpen(true)}
              onOpenMarketResearch={() => setIsMarketResearchOpen(true)}
              onOpenSalesTarget={() => setIsSalesTargetOpen(true)}
              onOpenContentCalendar={() => setIsContentCalendarOpen(true)}
              onOpenPlaybook={() => setIsPlaybookOpen(true)}
              onOpenDailyRoute={() => setIsDailyRouteOpen(true)}
            />
          </section>

          {/* 5. Demo Peta Radius Leaflet Spasial */}
          <section id="peta-demo" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <InteractiveMap />
          </section>

          {/* 6. Paket & Feature Flag Dinamis */}
          <PricingTable
            onOpenWizard={() => setIsWizardOpen(true)}
          />

          {/* 7. Peran AI (SE, TL Full AI, SM Semi-AI) */}
          <AiRolesExplanation />

          {/* 8. FAQ & Closing CTA Box */}
          <FaqAndCta
            onOpenWizard={() => setIsWizardOpen(true)}
          />
        </main>
      )}

      {/* 9. Footer */}
      <Footer />

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenLoveLetter={() => setIsLoveLetterOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenMarketResearch={() => setIsMarketResearchOpen(true)}
        onOpenSalesTarget={() => setIsSalesTargetOpen(true)}
        onOpenJalurProyek={() => setIsJalurProyekOpen(true)}
        onOpenContentCalendar={() => setIsContentCalendarOpen(true)}
        onOpenPlaybook={() => setIsPlaybookOpen(true)}
        onOpenDailyRoute={() => setIsDailyRouteOpen(true)}
        onOpenProjectWebsite={() => setIsWebsitePreviewOpen(true)}
        onOpenCrmPipeline={() => setIsCrmPipelineOpen(true)}
        onOpenSuperadmin={() => setIsSuperadminOpen(true)}
        onScrollTo={scrollToSection}
      />

      <OnboardingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onOpenFullViewer={() => setIsLoveLetterOpen(true)}
      />

      <LoveLetterViewerModal
        isOpen={isLoveLetterOpen}
        onClose={() => setIsLoveLetterOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccessLogin={(role) => onEnterDashboard(role)}
      />

      {isMarketResearchOpen && (
        <MarketResearchViewer
          projectName="The Park Townhouse Sukoharjo"
          userRole="DIREKSI"
          onClose={() => setIsMarketResearchOpen(false)}
        />
      )}

      {isSalesTargetOpen && (
        <SalesTargetViewer
          projectName="The Park Townhouse Sukoharjo"
          totalUnits={30}
          avgPriceIdr={900000000}
          seHeadcount={3}
          onClose={() => setIsSalesTargetOpen(false)}
        />
      )}

      {isJalurProyekOpen && (
        <JalurProyek
          projectName="The Park Townhouse Sukoharjo"
          userRole="DIREKSI"
          onOpenStage={(stageKey) => {
            setIsJalurProyekOpen(false);
            if (stageKey === 'surat_cinta_99') setIsLoveLetterOpen(true);
            else if (stageKey === 'riset_pasar') setIsMarketResearchOpen(true);
            else if (stageKey === 'target_penjualan') setIsSalesTargetOpen(true);
            else if (stageKey === 'kalender_konten') setIsContentCalendarOpen(true);
            else if (stageKey === 'playbook') setIsPlaybookOpen(true);
            else if (stageKey === 'rute_harian') setIsDailyRouteOpen(true);
            else if (stageKey === 'website_landing') setIsWebsitePreviewOpen(true);
          }}
          onClose={() => setIsJalurProyekOpen(false)}
        />
      )}

      {isContentCalendarOpen && (
        <ContentCalendarViewer
          projectName="The Park Townhouse Sukoharjo"
          onClose={() => setIsContentCalendarOpen(false)}
        />
      )}

      {isPlaybookOpen && (
        <PlaybookViewer
          projectName="The Park Townhouse Sukoharjo"
          initialRole="SE"
          onClose={() => setIsPlaybookOpen(false)}
        />
      )}

      {isDailyRouteOpen && (
        <DailyRouteViewer
          projectName="The Park Townhouse Sukoharjo"
          onClose={() => setIsDailyRouteOpen(false)}
        />
      )}

      {isWebsitePreviewOpen && (
        <ProjectWebsitePreview
          onClose={() => setIsWebsitePreviewOpen(false)}
        />
      )}

      {isCrmPipelineOpen && (
        <CrmPipelineView
          projectName="The Park Townhouse Sukoharjo"
          onClose={() => setIsCrmPipelineOpen(false)}
        />
      )}

      {isSuperadminOpen && (
        <SuperadminPanel
          onClose={() => setIsSuperadminOpen(false)}
        />
      )}
    </div>
  );
};
