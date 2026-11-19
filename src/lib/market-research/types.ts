// ============================================================================
// MARKET RESEARCH TYPES - DEVELOPER SALES OS
// ============================================================================

export interface PersonaDemographics {
  ageRange: string;
  profession: string[];
  monthlyIncome: string;
  householdType: string;
  currentResidence: string;
}

export interface TargetPersona {
  id: string;
  code: string; // e.g. 'P1_FIRST_HOME'
  name: string;
  subtitle: string;
  avatarIcon: string;
  demographics: PersonaDemographics;
  needsAndPains: string[];
  commonObjections: string[];
  preferredChannels: string[];
  buyingTriggers: string[];
  relevantFactIds: string[]; // references KB fact_id
}

export type RadiusDistanceMeters = 500 | 1000 | 2000 | 3000 | 5000 | 10000 | 15000 | 20000 | 25000;

export type FacilityCategory = 
  | 'Kesehatan' 
  | 'Pendidikan' 
  | 'Perbelanjaan & Lifestyle' 
  | 'Transportasi & Akses' 
  | 'Pusat Bisnis & Pemerintahan';

export interface PublicFacility {
  id: string;
  name: string;
  category: FacilityCategory;
  distanceMeters: number;
  distanceKmFormatted: string;
  driveTimeMinutes: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  radiusRing: RadiusDistanceMeters;
  citation?: string;
}

export interface CompetitorProperty {
  id: string;
  name: string;
  developer: string;
  distanceKm: number;
  radiusRing: RadiusDistanceMeters;
  priceRange: string;
  priceStartIdr: number;
  priceEndIdr: number;
  avgPricePerM2Idr: number;
  unitTypes: string[];
  strengths: string[];
  weaknesses: string[];
  theParkAdvantage: string;
  advantageFactId: string;
  isDemoVerified: boolean; // false if need verification / demo placeholder
}

export interface MarketShareSlice {
  name: string;
  sharePercent: number;
  unitsAvailable: number;
  colorHex: string;
  isOurProject?: boolean;
}

export interface PricePerM2Benchmark {
  propertyName: string;
  pricePerM2: number;
  isOurProject: boolean;
}

export interface MarketShareAnalysis {
  totalEstimatedMarketSupply: number;
  absorptionRateSukoharjoPerMonth: number;
  theParkAbsorptionForecastPerMonth: number;
  slices: MarketShareSlice[];
  priceBenchmarks: PricePerM2Benchmark[];
  competitiveEdgeSummary: string;
}

export interface MarketResearchReport {
  id: string;
  projectId: string;
  projectName: string;
  version: number;
  projectCoordinates: { lat: number; lng: number };
  personas: TargetPersona[];
  facilities: PublicFacility[];
  competitors: CompetitorProperty[];
  marketShare: MarketShareAnalysis;
  generatedAt: string;
  tokensUsed?: number; // Only for admin/internal tracking, never rendered in client exports
}
