import { describe, expect, test } from 'bun:test';
import {
  buildContentAttributionReport,
  evaluateAssetRights,
  matchPersonaToUnits,
  processPublishQueueJob,
  validateAndBuildPitchKit,
  validateVideoTemplate,
} from '../src/lib/content/r2-content-saleskit-engine';
import { STANDARD_AIC_RATES } from '../src/lib/aic/meter-engine';

describe('R2 Gelombang 1: Konten & Sales Kit (F16, F17, F22, F23, F24, F26)', () => {
  test('Tarif AIC R2 Gelombang 1 sesuai katalog', () => {
    expect(STANDARD_AIC_RATES.F16).toBe(120);
    expect(STANDARD_AIC_RATES.F17).toBe(40);
    expect(STANDARD_AIC_RATES.F22).toBe(30);
    expect(STANDARD_AIC_RATES.F23).toBe(120);
    expect(STANDARD_AIC_RATES.F24).toBe(80);
    expect(STANDARD_AIC_RATES.F26).toBe(150);
  });

  test('F16 Pitch & Objection Kit: eskalasi otomatis bila tanpa bukti atau topik diskon/legalitas', () => {
    const res = validateAndBuildPitchKit({
      projectId: 'the-park-sukoharjo',
      title: 'Kit Q4',
      pitch30s: 'Pitch 30',
      pitch60s: 'Pitch 60',
      pitch180s: 'Pitch 180',
      objections: [
        { question: 'Lokasi?', answer: '5 menit ke mall', sourceRef: 'Brosur v2', topic: 'GENERAL' },
        { question: 'Minta diskon 15%?', answer: 'Boleh', sourceRef: 'Brosur v2', topic: 'DISKON_KHUSUS' },
        { question: 'Klaim tanpa sumber?', answer: 'Entah', topic: 'GENERAL' },
      ],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.aiCanApproveDiscountOrLegal).toBe(false);
      expect(res.data.escalatedCount).toBe(2);
      expect(res.data.objections[0].escalateToHuman).toBe(false);
      expect(res.data.objections[1].escalateToHuman).toBe(true);
      expect(res.data.objections[2].escalateToHuman).toBe(true);
    }
  });

  test('F17 Persona-to-Unit Match: maksimal 2 unit aktif, read-only, tanpa PII pembeli', () => {
    const match = matchPersonaToUnits({
      projectId: 'the-park-sukoharjo',
      statedNeed: '3 kamar',
      budgetMaxIdr: 1200000000,
      minBedrooms: 3,
      units: [
        { unitCode: 'A-01', clusterName: 'Cluster A', status: 'AVAILABLE', priceCashIdr: 950000000, bedrooms: 3, buyerName: 'RAHASIA', buyerPhone: '0811' },
        { unitCode: 'A-02', clusterName: 'Cluster A', status: 'BOOKED', priceCashIdr: 900000000, bedrooms: 3 },
        { unitCode: 'A-03', clusterName: 'Cluster A', status: 'READY', priceCashIdr: 1050000000, bedrooms: 3 },
        { unitCode: 'A-04', clusterName: 'Cluster A', status: 'AVAILABLE', priceCashIdr: 1150000000, bedrooms: 3 },
      ],
    });
    expect(match.recommendations).toHaveLength(2);
    expect(match.recommendations.map((r) => r.unitCode)).toEqual(['A-01', 'A-03']);
    expect((match.recommendations[0] as any).buyerName).toBeUndefined();
    expect(match.recommendations[0].unitStatusMutated).toBe(false);
  });

  test('F22 Approval & Publish Queue: tolak belum approved, fallback export berlabel saat API mati', () => {
    const unapproved = processPublishQueueJob({
      projectId: 'the-park-sukoharjo',
      title: 'Post 1',
      channel: 'IG',
      scheduledAt: '2026-11-28T09:00:00Z',
      approvedByHuman: false,
      apiAvailable: true,
      idempotencyKey: 'job-1',
    });
    expect(unapproved.ok).toBe(false);

    const fallback = processPublishQueueJob({
      projectId: 'the-park-sukoharjo',
      title: 'Post 2',
      channel: 'TikTok',
      scheduledAt: '2026-11-28T09:00:00Z',
      approvedByHuman: true,
      apiAvailable: false,
      idempotencyKey: 'job-2',
    });
    expect(fallback.ok).toBe(true);
    if (fallback.ok) {
      expect(fallback.data.status).toBe('EXPORT_REQUIRED');
      expect(fallback.data.deliveryMode).toBe('EXPORT_REMINDER_LABELED_NO_PERSONAL_BOT');
    }
  });

  test('F23 Content Attribution: hitung lead unik, opportunity & label korelasi bukan kausal', () => {
    const rep = buildContentAttributionReport({
      projectId: 'the-park-sukoharjo',
      periodDays: 30,
      touches: [
        { codeOrUtm: 'IG_01', leadId: 'L1', hasOpportunity: true },
        { codeOrUtm: 'IG_01', leadId: 'L1', hasOpportunity: true }, // duplikat lead sama
        { codeOrUtm: 'IG_01', leadId: 'L2', hasOpportunity: false },
      ],
    });
    expect(rep.correlationNote).toBe('KORELASI_BUKAN_KAUSAL_CLOSING');
    expect(rep.rows[0].uniqueLeads).toBe(2);
    expect(rep.rows[0].opportunities).toBe(1);
  });

  test('F24 Asset Rights & F26 Video Template: blokir tanpa lisensi, retire saat dicabut, tolak tur palsu & >30s', () => {
    const blocked = evaluateAssetRights({ assetName: 'Foto 1', hasLicense: false, hasModelConsent: true, hasBrandLabel: true });
    expect(blocked.status).toBe('BLOCKED');
    expect(blocked.distributionAllowed).toBe(false);

    const retired = evaluateAssetRights({ assetName: 'Foto 2', hasLicense: true, hasModelConsent: true, hasBrandLabel: true, revoked: true });
    expect(retired.status).toBe('RETIRED');
    expect(retired.distributionAllowed).toBe(false);

    const fakeTour = validateVideoTemplate({
      projectId: 'the-park-sukoharjo',
      title: 'Tur Palsu',
      durationSeconds: 20,
      licensedFootage: true,
      subtitlesVerified: true,
      isFakeRealTour: true,
    });
    expect(fakeTour.ok).toBe(false);

    const tooLong = validateVideoTemplate({
      projectId: 'the-park-sukoharjo',
      title: 'Video 45s',
      durationSeconds: 45,
      licensedFootage: true,
      subtitlesVerified: true,
      isFakeRealTour: false,
    });
    expect(tooLong.ok).toBe(false);
  });
});
