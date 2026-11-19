// ============================================================================
// PROJECT WEBSITE GENERATOR TYPES - DEVELOPER SALES OS
// ============================================================================

export interface WebsiteUnitType {
  cluster: string;
  name: string;
  typeCode: string;
  buildingAreaM2: number;
  landAreaM2: number;
  bedrooms: number;
  bathrooms: number;
  carports: number;
  startingPriceIdr: number;
  keyFeatures: string[];
}

export interface InstallmentSimulationInput {
  propertyPriceIdr: number;
  dpPercent: number;
  interestRateAnnualPercent: number;
  tenorYears: number;
}

export interface InstallmentSimulationResult {
  propertyPriceIdr: number;
  dpAmountIdr: number;
  loanPrincipalIdr: number;
  monthlyInstallmentIdr: number;
  tenorYears: number;
}

export interface WebsiteFaqItem {
  question: string;
  answer: string;
  category?: string;
}

export interface ProjectWebsiteConfig {
  projectId: string;
  projectName: string;
  subdomain: string;
  customDomain?: string;
  siteTitle: string;
  heroHeadline: string;
  heroSubheadline: string;
  units: WebsiteUnitType[];
  simulationDefaults: {
    defaultDpPercent: number;
    interestRatePercent: number;
    availableTenors: number[];
    disclaimer: string;
  };
  faqs: WebsiteFaqItem[];
  whatsappNumber: string;
  whatsappMessage: string;
  publishedUrl: string;
}
