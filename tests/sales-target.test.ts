// ============================================================================
// SALES TARGET TEST SUITE - DEVELOPER SALES OS (FASE 2)
// ============================================================================

import { describe, expect, test } from 'bun:test';
import {
  calculateSalesTargetPlan,
  formatRupiah,
  applySalesTargetTeaser,
  FUNNEL_MULTIPLIERS,
} from '../src/lib/sales-target/calculator';

describe('Fase 2: Sales Target & Sold Out Velocity Engine', () => {
  test('Menghitung 3 skenario penjualan (konservatif, realistis, optimis) sampai sold out 100%', () => {
    const totalUnits = 30;
    const avgPrice = 900000000;

    const plan = calculateSalesTargetPlan({
      projectId: 'proj-the-park-01',
      projectName: 'The Park Townhouse Sukoharjo',
      totalUnits,
      avgPriceIdr: avgPrice,
      seHeadcount: 3,
      customVelocities: {
        konservatif: 2,
        realistis: 3,
        optimis: 5,
      },
    });

    // 1. Skenario Konservatif: 2 unit / bln -> 30 / 2 = 15 bulan
    expect(plan.scenarios.konservatif.velocityUnitsPerMonth).toBe(2);
    expect(plan.scenarios.konservatif.monthsToSoldOut).toBe(15);

    // 2. Skenario Realistis: 3 unit / bln -> 30 / 3 = 10 bulan
    expect(plan.scenarios.realistis.velocityUnitsPerMonth).toBe(3);
    expect(plan.scenarios.realistis.monthsToSoldOut).toBe(10);

    // 3. Skenario Optimis: 5 unit / bln -> 30 / 5 = 6 bulan
    expect(plan.scenarios.optimis.velocityUnitsPerMonth).toBe(5);
    expect(plan.scenarios.optimis.monthsToSoldOut).toBe(6);

    // Total pendapatan proyek
    expect(plan.totalProjectRevenueIdr).toBe(totalUnits * avgPrice);
  });

  test('Jadwal bulanan tepat mencapai sisa unit 0 (Sold Out 100%)', () => {
    const plan = calculateSalesTargetPlan(
      {
        projectId: 'proj-the-park-01',
        projectName: 'The Park Townhouse Sukoharjo',
        totalUnits: 30,
        avgPriceIdr: 900000000,
        seHeadcount: 3,
      },
      'realistis'
    );

    const lastMonth = plan.monthlySchedules[plan.monthlySchedules.length - 1];
    expect(lastMonth.remainingUnits).toBe(0);
    expect(lastMonth.cumulativeSoldUnits).toBe(30);
    expect(lastMonth.percentSoldOut).toBe(100);
    expect(lastMonth.cumulativeRevenueIdr).toBe(30 * 900000000);
  });

  test('Menghitung reverse funnel aktivitas tim sales per bulan', () => {
    const plan = calculateSalesTargetPlan(
      {
        projectId: 'proj-the-park-01',
        projectName: 'The Park Townhouse Sukoharjo',
        totalUnits: 30,
        avgPriceIdr: 900000000,
        seHeadcount: 3,
      },
      'realistis'
    );

    const firstMonth = plan.monthlySchedules[0];
    const targetUnits = firstMonth.targetUnits; // 3 units

    expect(firstMonth.reverseFunnel.targetClosingUnits).toBe(targetUnits);
    expect(firstMonth.reverseFunnel.requiredBookings).toBe(Math.round(targetUnits * FUNNEL_MULTIPLIERS.bookingPerClosing));
    expect(firstMonth.reverseFunnel.requiredSiteVisits).toBe(Math.round(targetUnits * FUNNEL_MULTIPLIERS.visitPerClosing));
    expect(firstMonth.reverseFunnel.requiredHotProspects).toBe(Math.round(targetUnits * FUNNEL_MULTIPLIERS.prospectPerClosing));
    expect(firstMonth.reverseFunnel.requiredContacts).toBe(Math.round(targetUnits * FUNNEL_MULTIPLIERS.contactPerClosing));
    expect(firstMonth.reverseFunnel.requiredLeads).toBe(Math.round(targetUnits * FUNNEL_MULTIPLIERS.leadPerClosing));
  });

  test('Membagi target unit dan omset secara dinamis per Sales Executive (SE)', () => {
    const headcount = 3;
    const velocity = 3; // units per month
    const avgPrice = 900000000;

    const plan = calculateSalesTargetPlan(
      {
        projectId: 'proj-the-park-01',
        projectName: 'The Park Townhouse Sukoharjo',
        totalUnits: 30,
        avgPriceIdr: avgPrice,
        seHeadcount: headcount,
      },
      'realistis'
    );

    expect(plan.seAllocations.length).toBe(headcount);
    plan.seAllocations.forEach((alloc) => {
      expect(alloc.monthlyUnitTarget).toBe(1); // 3 / 3 = 1 unit
      expect(alloc.monthlyRevenueTargetIdr).toBe(avgPrice);
      expect(alloc.weeklySiteVisitTarget).toBeGreaterThan(0);
      expect(alloc.dailyContactTarget).toBeGreaterThan(0);
    });
  });

  test('Mode Demo memotong jadwal target penjualan ke 25% pertama', () => {
    const plan = calculateSalesTargetPlan(
      {
        projectId: 'proj-the-park-01',
        projectName: 'The Park Townhouse Sukoharjo',
        totalUnits: 30,
        avgPriceIdr: 900000000,
        seHeadcount: 3,
      },
      'realistis'
    );

    const teaser = applySalesTargetTeaser(plan);
    expect(teaser.monthlySchedules.length).toBeLessThanOrEqual(Math.round(plan.monthlySchedules.length * 0.25) + 1);
    expect(teaser.seAllocations.length).toBe(1); // hanya 1 SE di cuplikan
  });
});
