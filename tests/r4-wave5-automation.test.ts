import { describe, expect, test } from 'bun:test';
import {
  buildLifecycleReactivationCohort,
  deployMultiProjectWebBatch,
  runBulkCreativeBatch,
  simulatePortfolioBudgetAllocation,
  validateOptInAiVoiceQualifier,
} from '../src/lib/operations/r4-wave5-automation-engine';
import { STANDARD_AIC_RATES } from '../src/lib/aic/meter-engine';

describe('Gelombang 5: R4 Skalabilitas & Otomasi Lanjut (F30, F36, F42, F54, F60)', () => {
  test('Tarif AIC Gelombang 5 sesuai katalog', () => {
    expect(STANDARD_AIC_RATES.F30).toBe(500);
    expect(STANDARD_AIC_RATES.F36).toBe(300);
    expect(STANDARD_AIC_RATES.F42).toBe(300);
    expect(STANDARD_AIC_RATES.F54).toBe(50);
    expect(STANDARD_AIC_RATES.F60).toBe(150);
  });

  test('F30 Bulk Creative: tolak PII pembeli & lacak gagal parsial per item', () => {
    const res = runBulkCreativeBatch({
      projectId: 'the-park-sukoharjo',
      concurrencyLimit: 5,
      items: [
        { itemId: 'A1', templateCode: 'T1' },
        { itemId: 'A2', templateCode: 'T1', hasBuyerPii: true },
        { itemId: 'A3', templateCode: 'T1', simulateFail: true },
      ],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.succeededCount).toBe(1);
      expect(res.data.failedCount).toBe(2);
      expect(res.data.failed.map((f) => f.reason)).toEqual(['PII_PEMBELI_TERDETEKSI', 'RENDER_PARTIAL_ERROR']);
    }
  });

  test('F36 Multi-Web Deploy & F42 Portfolio Budget: isolasi kegagalan situs & tunggu approver dana', () => {
    const web = deployMultiProjectWebBatch({
      tenantId: 't-andara',
      sites: [
        { projectId: 'p1', domain: 'p1.andara.id', simulateFail: true },
        { projectId: 'p2', domain: 'p2.andara.id', simulateFail: false },
      ],
    });
    expect(web.ok).toBe(true);
    if (web.ok) {
      expect(web.data.results[0].status).toBe('ROLLED_BACK_ISOLATED');
      expect(web.data.results[1].status).toBe('STAGED_OR_DEPLOYED');
    }

    const port = simulatePortfolioBudgetAllocation({
      hasCrossProjectPermission: true,
      projects: [{ projectId: 'p1', availableStock: 10, marginPct: 24, currentBudgetIdr: 10000000, proposedBudgetIdr: 12000000 }],
    });
    expect(port.ok).toBe(true);
    if (port.ok) {
      expect(port.data.status).toBe('PENDING_APPROVER');
      expect(port.data.autoTransferExecuted).toBe(false);
    }
  });

  test('F54 AI Voice Qualifier & F60 Lifecycle Reactivation: khusus Diamond, opt-in & exclude silent/opt-out', () => {
    const nonDiamond = validateOptInAiVoiceQualifier({
      planCode: 'platinum',
      leadId: 'L1',
      voiceOptIn: true,
      aiIdentityDisclosed: true,
      withinQuietHoursAllowed: true,
      recordingConsent: true,
      durationMinutes: 1,
    });
    expect(nonDiamond.ok).toBe(false);

    const coh = buildLifecycleReactivationCohort({
      projectId: 'the-park-sukoharjo',
      cohortName: 'Q4 Reactivation',
      holdoutPct: 10,
      stopRule: 'Stop jika opt-out > 3%',
      leads: [
        { leadId: 'L1', hasConsent: true, optedOut: false, isSilentLongTerm: false, withinRetentionWindow: true },
        { leadId: 'L2', hasConsent: true, optedOut: true, isSilentLongTerm: false, withinRetentionWindow: true },
        { leadId: 'L3', hasConsent: true, optedOut: false, isSilentLongTerm: true, withinRetentionWindow: true },
      ],
    });
    expect(coh.ok).toBe(true);
    if (coh.ok) {
      expect(coh.data.eligibleIds).toEqual(['L1']);
      expect(coh.data.excludedIds).toEqual(['L2', 'L3']);
    }
  });
});
