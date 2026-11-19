// ============================================================================
// SALES TARGET TYPES - DEVELOPER SALES OS
// ============================================================================

export type ScenarioType = 'konservatif' | 'realistis' | 'optimis';

export interface ScenarioDetail {
  type: ScenarioType;
  label: string;
  velocityUnitsPerMonth: number;
  monthsToSoldOut: number;
  description: string;
}

export interface ReverseFunnelRequirements {
  targetClosingUnits: number;
  requiredBookings: number;
  requiredSiteVisits: number;
  requiredHotProspects: number;
  requiredContacts: number;
  requiredLeads: number;
}

export interface MonthlyScheduleRow {
  monthIndex: number;
  monthLabel: string;
  targetUnits: number;
  cumulativeSoldUnits: number;
  remainingUnits: number;
  monthlyRevenueIdr: number;
  cumulativeRevenueIdr: number;
  percentSoldOut: number;
  reverseFunnel: ReverseFunnelRequirements;
}

export interface SeTargetAllocation {
  seIndex: number;
  seName: string;
  monthlyUnitTarget: number;
  monthlyRevenueTargetIdr: number;
  weeklySiteVisitTarget: number;
  dailyContactTarget: number;
}

export interface SalesTargetCalculationInput {
  projectId: string;
  projectName: string;
  totalUnits: number;
  avgPriceIdr: number;
  seHeadcount: number;
  customVelocities?: {
    konservatif?: number;
    realistis?: number;
    optimis?: number;
  };
}

export interface SalesTargetPlan {
  id: string;
  projectId: string;
  projectName: string;
  version: number;
  totalUnits: number;
  avgPriceIdr: number;
  totalProjectRevenueIdr: number;
  seHeadcount: number;
  scenarios: Record<ScenarioType, ScenarioDetail>;
  activeScenario: ScenarioType;
  monthlySchedules: MonthlyScheduleRow[];
  seAllocations: SeTargetAllocation[];
  generatedAt: string;
  tokensUsed?: number; // Only for admin/internal tracking, never rendered in client exports
}
