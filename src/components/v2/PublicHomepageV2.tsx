import React, { useEffect, useState } from 'react';
import { NavbarV2 } from './NavbarV2';
import { HeroAndProofV2 } from './HeroAndProofV2';
import { WorkflowAndMapV2 } from './WorkflowAndMapV2';
import { PricingRolesFaqV2 } from './PricingRolesFaqV2';
import { CommandPalette } from '../CommandPalette';
import { OnboardingWizardModal } from '../OnboardingWizardModal';
import { LoveLetterViewerModal } from '../LoveLetterViewerModal';
import { LoginModal } from '../LoginModal';
import { MarketResearchViewer } from '../MarketResearchViewer';
import { SalesTargetViewer } from '../SalesTargetViewer';
import { JalurProyek } from '../JalurProyek';

interface PublicHomepageV2Props {
  onEnterDashboard: (role?: string) => void;
}

export const PublicHomepageV2: React.FC<PublicHomepageV2Props> = ({ onEnterDashboard }) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLoveLetterOpen, setIsLoveLetterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMarketResearchOpen, setIsMarketResearchOpen] = useState(false);
  const [isSalesTargetOpen, setIsSalesTargetOpen] = useState(false);
  const [isJalurProyekOpen, setIsJalurProyekOpen] = useState(false);

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

  return (
    <div className="theme-blue-v2 min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600/15 selection:text-blue-700">
      <NavbarV2
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onScrollTo={scrollToSection}
      />

      <main>
        <HeroAndProofV2
          onOpenWizard={() => setIsWizardOpen(true)}
          onOpenLoveLetter={() => setIsLoveLetterOpen(true)}
          onScrollToCaseStudy={() => scrollToSection('studi-kasus')}
          onScrollToMap={() => scrollToSection('peta-demo')}
        />

        <WorkflowAndMapV2
          onOpenLoveLetter={() => setIsLoveLetterOpen(true)}
          onOpenMarketResearch={() => setIsMarketResearchOpen(true)}
          onOpenSalesTarget={() => setIsSalesTargetOpen(true)}
        />

        <PricingRolesFaqV2
          onOpenWizard={() => setIsWizardOpen(true)}
        />
      </main>

      {/* Global Modals (Shared 100% with Demo 1) */}
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
          }}
          onClose={() => setIsJalurProyekOpen(false)}
        />
      )}
    </div>
  );
};
