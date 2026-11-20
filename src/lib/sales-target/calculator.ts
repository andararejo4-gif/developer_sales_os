// ============================================================================
// SALES TARGET CALCULATOR - DEVELOPER SALES OS (Blueprint v1.2 Bab 02 & Bab 05)
// Kendala Stok: Umur stok = unit tersedia / laju jual
// Dua Funnel Terpisah: Skenario A (U02) & Skenario B (U03) tanpa mencampur denominator
// ============================================================================

import type {
  SalesTargetCalculationInput,
  SalesTargetPlan,
  ScenarioType,
  ScenarioDetail,
  MonthlyScheduleRow,
  ReverseFunnelRequirements,
  SeTargetAllocation,
  InventoryConstraint,
  FunnelHypotheses,
} from './types';

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
 * Calculates a complete sales target plan leading to 100% sold out with stock constraints.
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
  }

  // Headcount distribution
  const seAllocations: SeTargetAllocation[] = [];
  const monthlyTarget = active.velocityUnitsPerMonth;
  const basePerSe = Math.floor(monthlyTarget / seHeadcount);
  const remainder = monthlyTarget % seHeadcount;

  for (let i = 0; i < seHeadcount; i++) {
    const units = i < remainder ? basePerSe + 1 : basePerSe;
    seAllocations.push({
      seIndex: i + 1,
      seName: `Sales Executive ${i + 1}`,
      monthlyUnitTarget: units,
      monthlyRevenueTargetIdr: units * avgPriceIdr,
      weeklySiteVisitTarget: Math.round(units * 1.5),
      dailyContactTarget: Math.max(3, Math.round((units * 10) / 26)),
    });
  }

  // Blueprint v1.2: Kendala Stok (Inventory Constraint)
  const stockLifespanMonths = Number((totalUnits / active.velocityUnitsPerMonth).toFixed(1));
  const annualRunRateUnits = active.velocityUnitsPerMonth * 12;
  const isAnnualTargetExceedingStock = annualRunRateUnits > totalUnits;

  const inventoryConstraint: InventoryConstraint = {
    availableStockUnits: totalUnits,
    monthlyVelocityUnits: active.velocityUnitsPerMonth,
    stockLifespanMonths,
    annualRunRateUnits,
    isAnnualTargetExceedingStock,
    stockWarning: isAnnualTargetExceedingStock
      ? `Stok tersedia (${totalUnits} unit) pada laju ${active.velocityUnitsPerMonth} unit/bulan akan habis dalam ±${stockLifespanMonths} bulan. Target tahunan run-rate (${annualRunRateUnits} unit) membutuhkan pembukaan fase/klaster baru.`
      : undefined
  };

  // Blueprint v1.2: Dua Funnel Hipotesis Terpisah (U02 vs U03)
  const funnelHypotheses: FunnelHypotheses = {
    scenarioA: {
      source: 'Dokumen U02 (Rasio Efisiensi Tinggi)',
      name: 'Funnel Efisiensi Kualifikasi',
      qualified: 100,
      visits: 25,
      netSales: 5,
      description: 'Hipotesis 100 prospek terkualifikasi menghasilkan 25 kunjungan lokasi dan 5 unit penjualan (rasio visit-to-sale 20%).'
    },
    scenarioB: {
      source: 'Dokumen U03 (Rasio Corong Lengkap)',
      name: 'Funnel Volume Standar',
      leads: 600,
      qualified: 150,
      appointments: 75,
      visits: 45,
      hot: 21,
      bookings: 7,
      netSales: 5,
      description: 'Hipotesis 600 leads umum -> 150 qualified -> 75 janji -> 45 survei -> 21 hot -> 7 booking -> 5 net sales.'
    },
    theoreticalCapacity: {
      dailyLeadsPerSe: 8,
      headcountSe: seHeadcount,
      workingDays: 26,
      calculatedMonthlyCapacity: 8 * seHeadcount * 26,
      note: `Kapasitas teoritis penanganan (${8 * seHeadcount * 26} lead/bulan) adalah batas beban kerja, bukan kepastian realisasi target.`
    }
  };

  const plan: SalesTargetPlan = {
    id: `target_plan_${Date.now()}`,
    projectId,
    projectName,
    version,
    totalUnits,
    avgPriceIdr,
    totalProjectRevenueIdr,
    seHeadcount,
    scenarios,
    activeScenario: chosenScenario,
    monthlySchedules,
    seAllocations,
    inventoryConstraint,
    funnelHypotheses,
    generatedAt: new Date().toISOString(),
  };

  saveSalesTargetPlan(plan);
  return plan;
}

export function saveSalesTargetPlan(plan: SalesTargetPlan): void {
  if (!targetsStore.has(plan.projectId)) {
    targetsStore.set(plan.projectId, new Map());
  }
  targetsStore.get(plan.projectId)!.set(plan.version, plan);
}

export function getSalesTargetPlan(projectId: string, version?: number): SalesTargetPlan | undefined {
  const projectPlans = targetsStore.get(projectId);
  if (!projectPlans || projectPlans.size === 0) return undefined;

  if (version !== undefined) {
    return projectPlans.get(version);
  }

  const versions = Array.from(projectPlans.keys()).sort((a, b) => b - a);
  return projectPlans.get(versions[0]);
}

export function getAllSalesTargetPlanVersions(projectId: string): number[] {
  const projectPlans = targetsStore.get(projectId);
  if (!projectPlans) return [];
  return Array.from(projectPlans.keys()).sort((a, b) => b - a);
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
