// ============================================================================
// SALES TARGET CALCULATOR - DEVELOPER SALES OS
// ============================================================================

import type {
  SalesTargetCalculationInput,
  SalesTargetPlan,
  ScenarioType,
  ScenarioDetail,
  MonthlyScheduleRow,
  ReverseFunnelRequirements,
  SeTargetAllocation,
} from './types';

// Default reverse funnel conversion ratios:
// 1 Closing requires ~1.5 Bookings, 6 Site Visits, 15 Hot Prospects, 40 Contacts, 120 Leads
export const FUNNEL_MULTIPLIERS = {
  bookingPerClosing: 1.5,
  visitPerClosing: 6.0,
  prospectPerClosing: 15.0,
  contactPerClosing: 40.0,
  leadPerClosing: 120.0,
};

// Store for versioned sales target plans
const targetsStore = new Map<string, Map<number, SalesTargetPlan>>();

/**
 * Calculates a complete sales target plan leading to 100% sold out.
 */
export function calculateSalesTargetPlan(
  input: SalesTargetCalculationInput,
  chosenScenario: ScenarioType = 'realistis',
  version: number = 1
): SalesTargetPlan {
  const {
    projectId,
    projectName,
    totalUnits,
    avgPriceIdr,
    seHeadcount = 3,
    customVelocities,
  } = input;

  const totalProjectRevenueIdr = totalUnits * avgPriceIdr;

  // Determine velocities
  const vKonservatif = customVelocities?.konservatif ?? Math.max(1, Math.round(totalUnits * 0.06)); // ~6% / mo
  const vRealistis = customVelocities?.realistis ?? Math.max(2, Math.round(totalUnits * 0.10));   // ~10% / mo
  const vOptimis = customVelocities?.optimis ?? Math.max(3, Math.round(totalUnits * 0.18));      // ~18% / mo

  const scenarios: Record<ScenarioType, ScenarioDetail> = {
    konservatif: {
      type: 'konservatif',
      label: 'Skenario Konservatif (Low Market)',
      velocityUnitsPerMonth: vKonservatif,
      monthsToSoldOut: Math.ceil(totalUnits / vKonservatif),
      description: 'Laju penjualan santai dengan fokus margin harga maksimal dan seleksi pembeli.',
    },
    realistis: {
      type: 'realistis',
      label: 'Skenario Realistis (Baseline Target)',
      velocityUnitsPerMonth: vRealistis,
      monthsToSoldOut: Math.ceil(totalUnits / vRealistis),
      description: 'Laju penjualan seimbang dengan kombinasi iklan digital dan kanvasing aktif SE.',
    },
    optimis: {
      type: 'optimis',
      label: 'Skenario Optimis (Fast Absorption)',
      velocityUnitsPerMonth: vOptimis,
      monthsToSoldOut: Math.ceil(totalUnits / vOptimis),
      description: 'Laju akselerasi agresif memanfaatkan peluncuran klaster baru dan promo spesial.',
    },
  };

  const active = scenarios[chosenScenario];
  const monthlySchedules: MonthlyScheduleRow[] = [];

  let cumulativeSold = 0;
  let currentMonth = 1;

  while (cumulativeSold < totalUnits && currentMonth <= active.monthsToSoldOut + 5) {
    const remainingBefore = totalUnits - cumulativeSold;
    const targetThisMonth = Math.min(active.velocityUnitsPerMonth, remainingBefore);
    cumulativeSold += targetThisMonth;
    const remainingAfter = totalUnits - cumulativeSold;

    const monthlyRevenue = targetThisMonth * avgPriceIdr;
    const cumulativeRevenue = cumulativeSold * avgPriceIdr;
    const percentSoldOut = Number(((cumulativeSold / totalUnits) * 100).toFixed(1));

    const reverseFunnel: ReverseFunnelRequirements = {
      targetClosingUnits: targetThisMonth,
      requiredBookings: Math.round(targetThisMonth * FUNNEL_MULTIPLIERS.bookingPerClosing),
      requiredSiteVisits: Math.round(targetThisMonth * FUNNEL_MULTIPLIERS.visitPerClosing),
      requiredHotProspects: Math.round(targetThisMonth * FUNNEL_MULTIPLIERS.prospectPerClosing),
      requiredContacts: Math.round(targetThisMonth * FUNNEL_MULTIPLIERS.contactPerClosing),
      requiredLeads: Math.round(targetThisMonth * FUNNEL_MULTIPLIERS.leadPerClosing),
    };

    monthlySchedules.push({
      monthIndex: currentMonth,
      monthLabel: `Bulan ke-${currentMonth}`,
      targetUnits: targetThisMonth,
      cumulativeSoldUnits: cumulativeSold,
      remainingUnits: remainingAfter,
      monthlyRevenueIdr: monthlyRevenue,
      cumulativeRevenueIdr: cumulativeRevenue,
      percentSoldOut,
      reverseFunnel,
    });

    currentMonth++;
    if (remainingAfter === 0) break;
  }

  // Calculate allocation per SE
  const safeHeadcount = Math.max(1, seHeadcount);
  const unitsPerSe = Number((active.velocityUnitsPerMonth / safeHeadcount).toFixed(2));
  const revPerSe = Math.round(unitsPerSe * avgPriceIdr);

  const seAllocations: SeTargetAllocation[] = Array.from({ length: safeHeadcount }).map((_, idx) => ({
    seIndex: idx + 1,
    seName: `Sales Executive ${idx + 1}`,
    monthlyUnitTarget: unitsPerSe,
    monthlyRevenueTargetIdr: revPerSe,
    weeklySiteVisitTarget: Math.round((unitsPerSe * FUNNEL_MULTIPLIERS.visitPerClosing) / 4),
    dailyContactTarget: Math.round((unitsPerSe * FUNNEL_MULTIPLIERS.contactPerClosing) / 25),
  }));

  const plan: SalesTargetPlan = {
    id: `target-${projectId}-v${version}`,
    projectId,
    projectName,
    version,
    totalUnits,
    avgPriceIdr,
    totalProjectRevenueIdr,
    seHeadcount: safeHeadcount,
    scenarios,
    activeScenario: chosenScenario,
    monthlySchedules,
    seAllocations,
    generatedAt: new Date().toISOString(),
    tokensUsed: 890,
  };

  // Cache in store
  let projMap = targetsStore.get(projectId);
  if (!projMap) {
    projMap = new Map();
    targetsStore.set(projectId, projMap);
  }
  projMap.set(version, plan);

  return plan;
}

/**
 * Default ground truth for The Park Townhouse Sukoharjo (30 units, avg Rp 900.000.000)
 */
export const THE_PARK_DEFAULT_TARGET_PLAN = calculateSalesTargetPlan({
  projectId: 'proj-the-park-01',
  projectName: 'The Park Townhouse Sukoharjo',
  totalUnits: 30,
  avgPriceIdr: 900000000,
  seHeadcount: 3,
  customVelocities: {
    konservatif: 2,
    realistis: 3,
    optimis: 5,
  },
});

export function getSalesTargetPlan(
  projectId: string,
  chosenScenario: ScenarioType = 'realistis',
  isDemoMode: boolean = false
): SalesTargetPlan {
  const projMap = targetsStore.get(projectId);
  let plan: SalesTargetPlan;

  if (!projMap || projMap.size === 0) {
    plan = calculateSalesTargetPlan(
      {
        projectId,
        projectName: 'The Park Townhouse Sukoharjo',
        totalUnits: 30,
        avgPriceIdr: 900000000,
        seHeadcount: 3,
      },
      chosenScenario
    );
  } else {
    const maxVer = Math.max(...Array.from(projMap.keys()));
    plan = projMap.get(maxVer)!;
    if (plan.activeScenario !== chosenScenario) {
      plan = calculateSalesTargetPlan(
        {
          projectId: plan.projectId,
          projectName: plan.projectName,
          totalUnits: plan.totalUnits,
          avgPriceIdr: plan.avgPriceIdr,
          seHeadcount: plan.seHeadcount,
        },
        chosenScenario,
        plan.version
      );
    }
  }

  if (isDemoMode) {
    return applySalesTargetTeaser(plan);
  }

  return plan;
}

/**
 * Truncate Sales Target Plan to 25% server-side for demo accounts.
 */
export function applySalesTargetTeaser(plan: SalesTargetPlan): SalesTargetPlan {
  const totalMonths = plan.monthlySchedules.length;
  const teaserMonthCount = Math.max(1, Math.round(totalMonths * 0.25));

  return {
    ...plan,
    monthlySchedules: plan.monthlySchedules.slice(0, teaserMonthCount),
    seAllocations: plan.seAllocations.slice(0, 1),
  };
}

/**
 * Formats Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
