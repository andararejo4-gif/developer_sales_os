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

interface PublicHomepageProps {
  onEnterDashboard: (role?: string) => void;
}

export const PublicHomepage: React.FC<PublicHomepageProps> = ({ onEnterDashboard }) => {
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
      {/* 1. Navbar */}
      <Navbar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onScrollTo={scrollToSection}
      />

      <main>
        {/* 2. Hero Section */}
        <Hero
          onOpenWizard={() => setIsWizardOpen(true)}
          onScrollToCaseStudy={() => scrollToSection('studi-kasus')}
        />

        {/* 3. Strip Bukti Sosial (The Park Townhouse Sukoharjo) */}
        <SocialProof
          onOpenLoveLetter={() => setIsLoveLetterOpen(true)}
          onScrollToMap={() => scrollToSection('peta-demo')}
        />

        {/* 4. Alur 6 Langkah Interaktif */}
        <section id="alur-6-langkah" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
