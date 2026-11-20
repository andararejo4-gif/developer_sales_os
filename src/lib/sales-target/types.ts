// ============================================================================
// SALES TARGET TYPES - DEVELOPER SALES OS (Blueprint v1.2 Bab 02 & 05)
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

export interface InventoryConstraint {
  availableStockUnits: number;
  monthlyVelocityUnits: number;
  stockLifespanMonths: number;
  annualRunRateUnits: number;
  isAnnualTargetExceedingStock: boolean;
  stockWarning?: string;
}

export interface FunnelHypotheses {
  scenarioA: {
    source: string;
    name: string;
    qualified: number;
    visits: number;
    netSales: number;
    description: string;
  };
  scenarioB: {
    source: string;
    name: string;
    leads: number;
    qualified: number;
    appointments: number;
    visits: number;
    hot: number;
    bookings: number;
    netSales: number;
    description: string;
  };
  theoreticalCapacity: {
    dailyLeadsPerSe: number;
    headcountSe: number;
    workingDays: number;
    calculatedMonthlyCapacity: number;
    note: string;
  };
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
  inventoryConstraint: InventoryConstraint;
  funnelHypotheses: FunnelHypotheses;
  generatedAt: string;
  tokensUsed?: number;
}
