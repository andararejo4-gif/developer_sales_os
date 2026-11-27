import { describe, expect, test } from 'bun:test';
import {
  auditConversationQuality,
  buildRetargetingSuppressionList,
  evaluateBidPacingOptimizer,
  launchOfficialCampaign,
  maskPiiText,
  validateSearchDemandCluster,
} from '../src/lib/ads/r3-ads-coaching-engine';
import { STANDARD_AIC_RATES } from '../src/lib/aic/meter-engine';

describe('Gelombang 3: Iklan Resmi & Coaching QA (F38, F39, F40, F41, F53)', () => {
  test('Tarif AIC Gelombang 3 sesuai katalog', () => {
    expect(STANDARD_AIC_RATES.F38).toBe(200);
    expect(STANDARD_AIC_RATES.F39).toBe(30);
    expect(STANDARD_AIC_RATES.F40).toBe(150);
    expect(STANDARD_AIC_RATES.F41).toBe(80);
    expect(STANDARD_AIC_RATES.F53).toBe(100);
  });

  test('F38 Ad Launcher: gagal nyata saat token revoked atau melebihi server cap', () => {
    const revoked = launchOfficialCampaign({
      projectId: 'the-park-sukoharjo',
      campaignName: 'Promo Q4',
      officialAccountVerified: true,
      budgetApproved: true,
      dailySpendIdr: 200000,
      serverCapDailyIdr: 500000,
      tokenActive: false,
      adSetsCount: 2,
    });
    expect(revoked.ok).toBe(false);

    const overCap = launchOfficialCampaign({
      projectId: 'the-park-sukoharjo',
      campaignName: 'Promo Q4',
      officialAccountVerified: true,
      budgetApproved: true,
      dailySpendIdr: 800000,
      serverCapDailyIdr: 500000,
      tokenActive: true,
      adSetsCount: 2,
    });
    expect(overCap.ok).toBe(false);
  });

  test('F39 Bid/Pacing Optimizer: evaluasi CPQL/visit/kapasitas & hold di luar koridor', () => {
    const hold = evaluateBidPacingOptimizer({
      accountId: 'ACC-1',
      cpqlIdr: 120000,
      siteVisitCount: 8,
      seCapacityRemaining: 4,
      proposedDeltaPct: 35,
    });
    expect(hold.evaluatedBy).toBe('CPQL_VISIT_AND_CAPACITY');
    expect(hold.action).toBe('HOLD_FOR_APPROVAL');
    expect(hold.requiresHumanApproval).toBe(true);
  });

  test('F40 Search Demand: tolak jika housing policy belum compliant atau tracking tidak sinkron', () => {
    const bad = validateSearchDemandCluster({
      projectId: 'the-park-sukoharjo',
      clusterName: 'Rumah Solo',
      keywords: ['rumah solo baru'],
      negativeKeywords: ['kost'],
      landingPageUrl: 'https://andara.id/the-park',
      trackingPixelId: 'PX-123',
      housingPolicyCompliant: false,
    });
    expect(bad.ok).toBe(false);
  });

  test('F41 Retargeting & Suppression: opt-out dan closing masuk suppression sebelum refresh', () => {
    const crmDumpBlocked = buildRetargetingSuppressionList({
      projectId: 'the-park-sukoharjo',
      audienceName: 'All CRM',
      authorizedAudienceOnly: false,
      leads: [],
    });
    expect(crmDumpBlocked.ok).toBe(false);

    const ok = buildRetargetingSuppressionList({
      projectId: 'the-park-sukoharjo',
      audienceName: 'Retargeting Warm',
      authorizedAudienceOnly: true,
      leads: [
        { leadId: 'L1', optedOut: false, isClosedWon: false, hasMarketingConsent: true },
        { leadId: 'L2', optedOut: true, isClosedWon: false, hasMarketingConsent: true },
        { leadId: 'L3', optedOut: false, isClosedWon: true, hasMarketingConsent: true },
      ],
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.data.eligibleIds).toEqual(['L1']);
      expect(ok.data.suppressedIds).toEqual(['L2', 'L3']);
    }
  });

  test('F53 QA Coaching: masking PII, adjudikasi manusia wajib, AI bukan dasar sanksi tunggal', () => {
    expect(maskPiiText('Hubungi 081234567890 atau budi@mail.com')).toBe('Hubungi [PHONE_MASKED] atau [EMAIL_MASKED]');
    const qa = auditConversationQuality({
      seEmail: 'raka@andara.id',
      sampleTranscripts: ['WA ke 081234567890 untuk survey'],
      aiScore: 84,
      humanAdjudicatedBy: 'sm@andara.id',
      coachingNotes: 'Perjelas simulasi cicilan.',
    });
    expect(qa.ok).toBe(true);
    if (qa.ok) {
      expect(qa.data.maskedSamples[0]).toContain('[PHONE_MASKED]');
      expect(qa.data.aiScoreIsSoleHrBasis).toBe(false);
    }
  });
});
