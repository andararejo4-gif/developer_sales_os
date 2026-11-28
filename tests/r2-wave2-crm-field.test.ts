import { describe, expect, test } from 'bun:test';
import {
  assignLeadRoundRobinSla,
  buildAcquisitionPlan,
  deduplicateAndMergeContacts,
  evaluateBantFit,
  evaluateRoleplayCertification,
  normalizeIndoPhone,
  summarizeFieldCheckins,
  validateBookingHoldConfirmation,
} from '../src/lib/crm/r2-crm-field-engine';
import { STANDARD_AIC_RATES } from '../src/lib/aic/meter-engine';

describe('R2 Gelombang 2: CRM, Akuisisi & Lapangan (F37, F44-F46, F63, F65, F71)', () => {
  test('Tarif AIC R2 Gelombang 2 sesuai katalog', () => {
    expect(STANDARD_AIC_RATES.F37).toBe(200);
    expect(STANDARD_AIC_RATES.F44).toBe(40);
    expect(STANDARD_AIC_RATES.F45).toBe(2);
    expect(STANDARD_AIC_RATES.F46).toBe(20);
    expect(STANDARD_AIC_RATES.F63).toBe(40);
    expect(STANDARD_AIC_RATES.F65).toBe(50);
    expect(STANDARD_AIC_RATES.F71).toBe(30);
  });

  test('F37 Acquisition Plan: skenario nol tambahan penjualan & 0 lead fiktif saat tanpa kanal', () => {
    const emptyPlan = buildAcquisitionPlan({ projectId: 'the-park-sukoharjo', availableStock: 10, channels: [] });
    expect(emptyPlan.projectedLeads).toBe(0);
    expect(emptyPlan.noFictitiousLeadsWhenEmpty).toBe(true);

    const activePlan = buildAcquisitionPlan({
      projectId: 'the-park-sukoharjo',
      availableStock: 10,
      channels: [{ channel: 'Meta Ads', spendIdr: 15000000, capacityLeads: 80, cplEstimateIdr: 150000 }],
    });
    expect(activePlan.projectedLeads).toBe(80);
    expect(activePlan.zeroAdditionalSalesScenario.additionalSales).toBe(0);
    expect(activePlan.zeroAdditionalSalesScenario.cashBurnIdr).toBe(15000000);
  });

  test('F44 Dedup & Merge: normalisasi nomor, opportunity terpisah, konflik butuh review & reversible', () => {
    expect(normalizeIndoPhone('0812-3456-789')).toBe('628123456789');
    const res = deduplicateAndMergeContacts([
      { id: 'C1', name: 'Budi', phone: '08123456789', opportunityId: 'OPP-1' },
      { id: 'C2', name: 'Budi Santoso', phone: '+62 812 3456 789', opportunityId: 'OPP-2' },
    ]);
    expect(res.mergedGroups).toHaveLength(1);
    expect(res.mergedGroups[0].opportunityIds).toEqual(['OPP-1', 'OPP-2']);
    expect(res.mergedGroups[0].requiresReview).toBe(true);
    expect(res.mergedGroups[0].reversible).toBe(true);
  });

  test('F45 BANT: blokir atribut sensitif, catat UNKNOWN & dukung koreksi skor', () => {
    const rejected = evaluateBantFit({
      leadId: 'L1',
      budget: {},
      authority: {},
      need: {},
      timeline: {},
      usedSensitiveAttribute: true,
    });
    expect(rejected.ok).toBe(false);

    const ok = evaluateBantFit({
      leadId: 'L1',
      budget: { answer: '1M', evidence: 'WA' },
      authority: { answer: '', evidence: '' },
      need: { answer: '3KT', evidence: 'Form' },
      timeline: { answer: 'Q4', evidence: 'Survey' },
      manualOverrideScore: 85,
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.data.dimensions.authority.answer).toBe('UNKNOWN');
      expect(ok.data.computedScore).toBe(75);
      expect(ok.data.finalScore).toBe(85);
      expect(ok.data.manualCorrected).toBe(true);
    }
  });

  test('F46 Round-Robin & SLA: hormati shift/libur/kapasitas & pertahankan histori pemilik', () => {
    const res = assignLeadRoundRobinSla({
      leadId: 'L10',
      previousOwners: ['se1@andara.id'],
      slaTimeoutMinutes: 30,
      candidates: [
        { email: 'se1@andara.id', onShift: true, onLeave: false, activeLeads: 2, maxCapacity: 10 },
        { email: 'se2@andara.id', onShift: false, onLeave: false, activeLeads: 0, maxCapacity: 10 },
        { email: 'se3@andara.id', onShift: true, onLeave: true, activeLeads: 0, maxCapacity: 10 },
        { email: 'se4@andara.id', onShift: true, onLeave: false, activeLeads: 4, maxCapacity: 10 },
      ],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.assignedTo).toBe('se4@andara.id');
      expect(res.data.ownerHistory).toEqual(['se1@andara.id', 'se4@andara.id']);
    }
  });

  test('F63 Check-in Field: tolak absensi & duplikat ID, meter hanya ringkasan', () => {
    const res = summarizeFieldCheckins([
      { offlineEventId: 'E1', seEmail: 'raka@andara.id', locationLabel: 'Site', hasEvidence: true, recordKind: 'FIELD_ACTIVITY' },
      { offlineEventId: 'E1', seEmail: 'raka@andara.id', locationLabel: 'Site', hasEvidence: true, recordKind: 'FIELD_ACTIVITY' },
      { offlineEventId: 'E2', seEmail: 'raka@andara.id', locationLabel: 'Kantor', hasEvidence: true, recordKind: 'ATTENDANCE' },
      { offlineEventId: 'E3', seEmail: 'raka@andara.id', locationLabel: 'Site', hasEvidence: false, recordKind: 'FIELD_ACTIVITY' },
    ]);
    expect(res.acceptedCount).toBe(1);
    expect(res.rejectedCount).toBe(3);
    expect(res.billedOn).toBe('SUMMARY_ONLY');
  });

  test('F65 Role-play & F71 Booking Hold: batas 10 menit, HR manusia, tolak screenshot-only', () => {
    const tooLong = evaluateRoleplayCertification({
      seEmail: 'raka@andara.id',
      durationMinutes: 12,
      factAccuracyScore: 95,
      ethicsCompliance: true,
      newPriceVersionDetected: false,
    });
    expect(tooLong.ok).toBe(false);

    const cert = evaluateRoleplayCertification({
      seEmail: 'raka@andara.id',
      durationMinutes: 8,
      factAccuracyScore: 88,
      ethicsCompliance: true,
      newPriceVersionDetected: true,
    });
    expect(cert.ok).toBe(true);
    if (cert.ok) {
      expect(cert.data.certified).toBe(true);
      expect(cert.data.retrainingTriggered).toBe(true);
      expect(cert.data.hrDecisionByHuman).toBe(true);
    }

    const screenshotOnly = validateBookingHoldConfirmation({
      unitCode: 'A-01',
      holdFormSigned: true,
      termsAccepted: true,
      paymentVerifiedByGateway: false,
      screenshotOnly: true,
      webhookEventId: 'wh-1',
    });
    expect(screenshotOnly.ok).toBe(false);
  });
});
