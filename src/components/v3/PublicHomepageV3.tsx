import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RailNavV3 } from './RailNavV3';
import { ChapterIntroAndCaseV3 } from './ChapterIntroAndCaseV3';
import { JourneyAndMapV3 } from './JourneyAndMapV3';
import { SwimlaneAndPricingV3 } from './SwimlaneAndPricingV3';
import { FaqAndFooterV3 } from './FaqAndFooterV3';
import { CommandPalette } from '../CommandPalette';
import { OnboardingWizardModal } from '../OnboardingWizardModal';
import { LoveLetterViewerModal } from '../LoveLetterViewerModal';
import { LoginModal } from '../LoginModal';
import { MarketResearchViewer } from '../MarketResearchViewer';
import { SalesTargetViewer } from '../SalesTargetViewer';
import { JalurProyek } from '../JalurProyek';

gsap.registerPlugin(ScrollTrigger);

interface PublicHomepageV3Props {
  onEnterDashboard: (role?: string) => void;
}

export const PublicHomepageV3: React.FC<PublicHomepageV3Props> = ({ onEnterDashboard }) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedWizardPlan, setSelectedWizardPlan] = useState<'gold' | 'platinum' | 'diamond'>('platinum');
  const [isLoveLetterOpen, setIsLoveLetterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMarketResearchOpen, setIsMarketResearchOpen] = useState(false);
  const [isSalesTargetOpen, setIsSalesTargetOpen] = useState(false);
  const [isJalurProyekOpen, setIsJalurProyekOpen] = useState(false);

  // Smooth scroll with Lenis synced to GSAP ScrollTrigger (respects prefers-reduced-motion)
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
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

  const openRegistrationPage = (planCode?: 'gold' | 'platinum' | 'diamond') => {
    const plan = planCode || selectedWizardPlan || 'platinum';
    window.location.href = `/daftar/${plan}`;
  };

  return (
    <div className="theme-journey-v3 min-h-screen bg-[#F6FAF7] text-[#0B3D2E] font-sans selection:bg-[#C6F432] selection:text-[#0B3D2E]">
      <RailNavV3
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenWizard={() => openRegistrationPage('platinum')}
        onOpenLogin={() => setIsLoginOpen(true)}
        onScrollTo={scrollToSection}
      />

      {/* Full-width Main Content under Sticky Top Navbar */}
      <main className="min-w-0">
        <ChapterIntroAndCaseV3
          onOpenWizard={() => openRegistrationPage('platinum')}
          onOpenLoveLetter={() => setIsLoveLetterOpen(true)}
          onScrollToCaseStudy={() => scrollToSection('studi-kasus')}
          onScrollToMap={() => scrollToSection('peta-demo')}
        />

        <JourneyAndMapV3
          onOpenLoveLetter={() => setIsLoveLetterOpen(true)}
          onOpenMarketResearch={() => setIsMarketResearchOpen(true)}
          onOpenSalesTarget={() => setIsSalesTargetOpen(true)}
        />

        <SwimlaneAndPricingV3
          onOpenWizard={(planCode) => {
            if (planCode) setSelectedWizardPlan(planCode);
            openRegistrationPage(planCode);
          }}
        />

        <FaqAndFooterV3
          onOpenWizard={() => openRegistrationPage('platinum')}
        />
      </main>

      {/* Shared 7 Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenLoveLetter={() => setIsLoveLetterOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenMarketResearch={() => setIsMarketResearchOpen(true)}
        onOpenSalesTarget={() => setIsSalesTargetOpen(true)}
        onOpenJalurProyek={() => setIsJalurProyekOpen(true)}
        onScrollTo={scrollToSection}
      />

      <OnboardingWizardModal
        isOpen={isWizardOpen}
        selectedPlan={selectedWizardPlan}
        onClose={() => setIsWizardOpen(false)}
        onOpenFullViewer={() => setIsLoveLetterOpen(true)}
        onEnterDashboard={onEnterDashboard}
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
          }}
          onClose={() => setIsJalurProyekOpen(false)}
        />
      )}
    </div>
  );
};
