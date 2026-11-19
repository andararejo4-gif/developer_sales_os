// ============================================================================
// MARKET RESEARCH ENGINE - DEVELOPER SALES OS
// ============================================================================

import {
  DEFAULT_THE_PARK_RESEARCH_REPORT,
  THE_PARK_5_PERSONAS,
  THE_PARK_PUBLIC_FACILITIES,
  THE_PARK_COMPETITORS,
  THE_PARK_MARKET_SHARE,
} from './the-park-market-research';
import type { MarketResearchReport, TargetPersona, PublicFacility, CompetitorProperty } from './types';

// In-memory versioned store per project
const researchStore = new Map<string, Map<number, MarketResearchReport>>();

// Seed default for The Park Townhouse
const theParkMap = new Map<number, MarketResearchReport>();
theParkMap.set(1, structuredClone(DEFAULT_THE_PARK_RESEARCH_REPORT));
researchStore.set('proj-the-park-01', theParkMap);

export interface GetMarketResearchOptions {
  projectId: string;
  version?: number;
  isDemoMode?: boolean; // When true, apply 25% server-side teaser truncation
}

export function getMarketResearchReport(options: GetMarketResearchOptions): MarketResearchReport {
  const { projectId, version, isDemoMode = false } = options;
  const projectVersions = researchStore.get(projectId);

  let report: MarketResearchReport;
  if (!projectVersions || projectVersions.size === 0) {
    // Fallback/Demo clone
    report = structuredClone(DEFAULT_THE_PARK_RESEARCH_REPORT);
  } else if (version && projectVersions.has(version)) {
    report = structuredClone(projectVersions.get(version)!);
  } else {
    // Return latest version
    const maxVer = Math.max(...Array.from(projectVersions.keys()));
    report = structuredClone(projectVersions.get(maxVer)!);
  }

  if (isDemoMode) {
    return applyMarketResearchTeaser(report);
  }

  return report;
}

/**
 * Regenerates market research for a project, creating a new version.
 * Requires SM, Direksi, or Developer Owner role.
 */
export function regenerateMarketResearch(
  projectId: string,
  projectName: string,
  userRole: string
): MarketResearchReport {
  const allowedRoles = ['DEVELOPER_OWNER', 'DIREKSI', 'SALES_MANAGER', 'SM'];
  if (!allowedRoles.includes(userRole)) {
    throw new Error('Hanya Direksi atau Sales Manager yang memiliki hak akses untuk memperbarui riset pasar.');
  }

  let projectVersions = researchStore.get(projectId);
  if (!projectVersions) {
    projectVersions = new Map<number, MarketResearchReport>();
    researchStore.set(projectId, projectVersions);
  }

  const nextVersion = projectVersions.size + 1;
  const newReport: MarketResearchReport = {
    id: `mr-${projectId}-v${nextVersion}`,
    projectId,
    projectName,
    version: nextVersion,
    projectCoordinates: DEFAULT_THE_PARK_RESEARCH_REPORT.projectCoordinates,
    personas: structuredClone(THE_PARK_5_PERSONAS),
    facilities: structuredClone(THE_PARK_PUBLIC_FACILITIES),
    competitors: structuredClone(THE_PARK_COMPETITORS),
    marketShare: structuredClone(THE_PARK_MARKET_SHARE),
    generatedAt: new Date().toISOString(),
    tokensUsed: 1450 + nextVersion * 20, // Internal metric only
  };

  projectVersions.set(nextVersion, newReport);
  return newReport;
}

/**
 * In Demo mode, truncate data to 25% server-side.
 * The remaining 75% is never delivered to the client response.
 */
export function applyMarketResearchTeaser(report: MarketResearchReport): MarketResearchReport {
  const teaserPersonas: TargetPersona[] = report.personas.slice(0, 1).map((p) => ({
    ...p,
    needsAndPains: p.needsAndPains.slice(0, 2),
    commonObjections: p.commonObjections.slice(0, 1),
    preferredChannels: p.preferredChannels.slice(0, 2),
  }));

  const teaserFacilities: PublicFacility[] = report.facilities.slice(0, 3);
  const teaserCompetitors: CompetitorProperty[] = report.competitors.slice(0, 1);

  return {
    ...report,
    personas: teaserPersonas,
    facilities: teaserFacilities,
    competitors: teaserCompetitors,
    marketShare: {
      ...report.marketShare,
      slices: report.marketShare.slices.slice(0, 2),
      priceBenchmarks: report.marketShare.priceBenchmarks.slice(0, 2),
      competitiveEdgeSummary: report.marketShare.competitiveEdgeSummary.slice(0, 100) + '... [Cuplikan Demo 25%]',
    },
  };
}

/**
 * Generates an accessible, data-driven SVG Donut Chart markup for Market Share.
 */
export function generateMarketShareSvg(report: MarketResearchReport): string {
  const slices = report.marketShare.slices;
  const radius = 80;
  const strokeWidth = 32;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const circles = slices.map((slice) => {
    const strokeDasharray = `${(slice.sharePercent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += slice.sharePercent;

    return `<circle 
      cx="110" cy="110" r="${radius}" 
      fill="transparent" 
      stroke="${slice.colorHex}" 
      stroke-width="${strokeWidth}" 
      stroke-dasharray="${strokeDasharray}" 
      stroke-dashoffset="${strokeDashoffset}"
      class="transition-all duration-300 hover:opacity-85"
    ><title>${slice.name}: ${slice.sharePercent}%</title></circle>`;
  });

  return `
    <svg viewBox="0 0 220 220" class="w-48 h-48 mx-auto -rotate-90">
      ${circles.join('')}
    </svg>
  `;
}
