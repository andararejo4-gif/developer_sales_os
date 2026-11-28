import { describe, expect, test } from 'bun:test';
import {
  normalizeAndQuarantineListings,
  validateAndBuildStp,
  validateAndBuildSwotAction,
} from '../src/lib/market-research/m02-strategy-engine';
import { getCostPreview, STANDARD_AIC_RATES, type AicWallet } from '../src/lib/aic/meter-engine';

describe('M02 R1 Features: F08 (STP), F09 (7P/SWOT/Action), F10 (Competitor Watch)', () => {
  test('AIC metering rates F08=120, F09=150, F10=150 & preflight saldo nol/cukup', () => {
    expect(STANDARD_AIC_RATES.F08).toBe(120);
    expect(STANDARD_AIC_RATES.F09).toBe(150);
    expect(STANDARD_AIC_RATES.F10).toBe(150);

    const zeroWallet: AicWallet = {
      id: 'w-zero',
      tenant_id: 't1',
      plan_code: 'gold',
      total_aic_granted: 0,
      balance_aic: 0,
      reserved_aic: 0,
      valid_until: '2027-01-01',
    };
    expect(getCostPreview(zeroWallet, 'F08', 'STP').isAffordable).toBe(false);
    expect(getCostPreview(zeroWallet, 'F09', 'SWOT').isAffordable).toBe(false);
    expect(getCostPreview(zeroWallet, 'F10', 'Competitor').isAffordable).toBe(false);

    const okWallet: AicWallet = { ...zeroWallet, total_aic_granted: 500, balance_aic: 500 };
    const pF08 = getCostPreview(okWallet, 'F08', 'STP');
    expect(pF08.estimatedAic).toBe(120);
    expect(pF08.isAffordable).toBe(true);
  });

  test('F08 STP: wajib segmen, target, exclusion rationale, positioning & non-auto-decision', () => {
    const invalid = validateAndBuildStp({
      projectId: 'the-park-sukoharjo',
      title: 'STP Kosong',
      segments: [],
      priorityTargets: [],
      exclusionRationale: [],
      positioningStatement: '',
    });
    expect(invalid.ok).toBe(false);

    const valid = validateAndBuildStp({
      projectId: 'the-park-sukoharjo',
      title: 'STP Q4 The Park',
      segments: [{ name: 'Keluarga Muda', needProfile: '2 Lantai', geography: 'Solo Baru', serviceable: true }],
      priorityTargets: ['Profesional 28-40 th'],
      exclusionRationale: ['Investor flip jangka pendek di luar target'],
      positioningStatement: 'Townhouse modern 5 menit ke The Park',
    });
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.data.reviewStatus).toBe('DRAFT');
      expect(valid.data.isAutomatedDecision).toBe(false);
      expect(valid.data.specialists).toEqual(['A14', 'A15']);
    }
  });

  test('F09 7P/SWOT/Action Plan: pisahkan fakta, asumsi & wajib PIC/ukuran/periode', () => {
    const missingPic = validateAndBuildSwotAction({
      projectId: 'the-park-sukoharjo',
      title: 'Strategi Tanpa PIC',
      sevenP: { product: 'Townhouse', price: '890jt', place: 'Solo Baru', promotion: 'Open House', people: 'SE', process: 'Booking', physicalEvidence: 'Show Unit' },
      swot: { strengths: ['Lokasi'], weaknesses: ['Unit terbatas'], opportunities: ['Pasar muda'], threats: ['Kompetitor'] },
      tows: { so: ['Iklan lokal'], wo: ['Waiting list'], st: ['Legalitas'], wt: ['Audit'] },
      facts: ['Jarak 5 menit ke mall'],
      assumptions: ['Asumsi KPR 15 th'],
      actionPlan: [{ hypothesis: 'H1', action: 'Iklan WA', pic: '', metric: '20 lead', period: '30 hari', status: 'PLANNED' }],
    });
    expect(missingPic.ok).toBe(false);

    const ok = validateAndBuildSwotAction({
      projectId: 'the-park-sukoharjo',
      title: 'Strategi Q4',
      sevenP: { product: 'Townhouse', price: '890jt', place: 'Solo Baru', promotion: 'Open House', people: 'SE', process: 'Booking', physicalEvidence: 'Show Unit' },
      swot: { strengths: ['Lokasi'], weaknesses: ['Unit terbatas'], opportunities: ['Pasar muda'], threats: ['Kompetitor'] },
      tows: { so: ['Iklan lokal'], wo: ['Waiting list'], st: ['Legalitas'], wt: ['Audit'] },
      facts: ['Jarak 5 menit ke mall'],
      assumptions: ['Asumsi KPR 15 th'],
      actionPlan: [{ hypothesis: 'H1', action: 'Iklan WA', pic: 'SM & DM', metric: '20 survei', period: '30 hari', status: 'PLANNED' }],
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.data.separatedLayers.factsCount).toBe(1);
      expect(ok.data.separatedLayers.assumptionsCount).toBe(1);
      expect(ok.data.separatedLayers.recommendationsCount).toBe(1);
    }
  });

  test('F10 Competitor Watch: normalisasi LT/LB, bedakan harga minta vs transaksi, karantina duplikat/404/expired', () => {
    const now = new Date('2026-11-27T00:00:00Z');
    const res = normalizeAndQuarantineListings({
      projectId: 'the-park-sukoharjo',
      now,
      listings: [
        {
          title: 'Cluster A',
          sourceUrl: 'https://portal.id/cluster-a',
          ltM2: 100,
          lbM2: 80,
          priceIdr: 1000000000,
          priceType: 'ASKING',
          buildStage: 'Ready',
          listedAt: '2026-11-15',
          httpStatus: 200,
        },
        {
          title: 'Cluster A',
          sourceUrl: 'https://portal.id/cluster-a-copy',
          ltM2: 100,
          lbM2: 80,
          priceIdr: 1000000000,
          priceType: 'ASKING',
          buildStage: 'Ready',
          listedAt: '2026-11-15',
          httpStatus: 200,
        },
        {
          title: 'Cluster 404',
          sourceUrl: 'https://portal.id/dead',
          ltM2: 90,
          lbM2: 70,
          priceIdr: 900000000,
          priceType: 'TRANSACTION',
          buildStage: 'AJB',
          listedAt: '2026-11-10',
          httpStatus: 404,
        },
        {
          title: 'Cluster Lama',
          sourceUrl: 'https://portal.id/old',
          ltM2: 90,
          lbM2: 70,
          priceIdr: 850000000,
          priceType: 'ASKING',
          buildStage: 'Indent',
          listedAt: '2026-01-01',
          httpStatus: 200,
        },
      ],
    });

    expect(res.activeListings).toHaveLength(1);
    expect(res.activeListings[0].pricePerSqmLand).toBe(10000000);
    expect(res.activeListings[0].priceClaimLabel).toContain('Harga Minta');
    expect(res.askingCount).toBe(1);
    expect(res.transactionCount).toBe(0);
    expect(res.quarantinedListings.map((q) => q.quarantineReason)).toEqual([
      'DUPLICATE',
      'HTTP_404',
      'EXPIRED',
    ]);
  });
});
