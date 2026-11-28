import { describe, expect, test } from 'bun:test';
import {
  buildCroExperiment,
  evaluateCreativeBrandQa,
  evaluateDiscountMarginProposal,
  processAppointmentReminder,
  scheduleVirtualTour,
  validateLocalSeoWorkflow,
  validateVoiceoverLocalization,
} from '../src/lib/operations/r3-wave4-creative-ops-engine';
import { STANDARD_AIC_RATES } from '../src/lib/aic/meter-engine';

describe('Gelombang 4: Kreatif, Web, Appointment & Margin (F28, F29, F34, F35, F58, F59, F70)', () => {
  test('Tarif AIC Gelombang 4 sesuai katalog', () => {
    expect(STANDARD_AIC_RATES.F28).toBe(50);
    expect(STANDARD_AIC_RATES.F29).toBe(100);
    expect(STANDARD_AIC_RATES.F34).toBe(200);
    expect(STANDARD_AIC_RATES.F35).toBe(150);
    expect(STANDARD_AIC_RATES.F58).toBe(20);
    expect(STANDARD_AIC_RATES.F59).toBe(50);
    expect(STANDARD_AIC_RATES.F70).toBe(20);
  });

  test('F28 Voiceover & F29 Brand QA: blokir voice clone ilegal & revision required tanpa auto-publish', () => {
    const clone = validateVoiceoverLocalization({
      projectId: 'the-park-sukoharjo',
      title: 'VO 1',
      language: 'id-ID',
      durationMinutes: 1,
      voiceConsentVerified: true,
      isUnauthorizedVoiceClone: true,
      priceTermsVerified: true,
    });
    expect(clone.ok).toBe(false);

    const qaFail = evaluateCreativeBrandQa({
      assetName: 'Banner A',
      reviewerName: 'SM',
      logoOk: true,
      colorContrastOk: false,
      safeAreaOk: true,
      spellingOk: true,
      priceMatchOk: true,
    });
    expect(qaFail.ok).toBe(true);
    if (qaFail.ok) {
      expect(qaFail.data.status).toBe('REVISION_REQUIRED');
      expect(qaFail.data.autoPublishAllowed).toBe(false);
    }
  });

  test('F34 Local SEO & F35 CRO: tolak lokasi palsu, label observasional bila tidak randomized', () => {
    const fakeSeo = validateLocalSeoWorkflow({
      projectId: 'the-park-sukoharjo',
      profileName: 'GBP',
      napConsistent: true,
      schemaValid: true,
      indexable: true,
      ownershipVerified: true,
      isFakeLocationOrReview: true,
    });
    expect(fakeSeo.ok).toBe(false);

    const obsCro = buildCroExperiment({
      projectId: 'the-park-sukoharjo',
      experimentName: 'Form Uji',
      variantA: 'A',
      variantB: 'B',
      primaryMetric: 'CVR',
      stopRule: '14 hari',
      randomized: false,
      keyboardAccessible: true,
      formErrorAccessible: true,
    });
    expect(obsCro.ok).toBe(true);
    if (obsCro.ok) {
      expect(obsCro.data.causalClaim).toBe('OBSERVASIONAL_BUKAN_KAUSAL');
    }
  });

  test('F58 Reminder & F59 Virtual Tour: throttle no-show & rekaman tidak diklaim live', () => {
    const throttled = processAppointmentReminder({
      appointmentId: 'APT-1',
      timezone: 'Asia/Jakarta',
      hasConsent: true,
      suppressed: false,
      noShowCount: 2,
    });
    expect(throttled.ok).toBe(true);
    if (throttled.ok) {
      expect(throttled.data.status).toBe('THROTTLED_NO_FLOOD');
      expect(throttled.data.sent).toBe(false);
    }

    const recorded = scheduleVirtualTour({
      projectId: 'the-park-sukoharjo',
      hostName: 'Raka',
      locationName: 'Show Unit',
      agenda: 'Tour',
      recordingConsent: true,
      isPreRecorded: true,
    });
    expect(recorded.ok).toBe(true);
    if (recorded.ok) {
      expect(recorded.data.liveClaimAllowed).toBe(false);
      expect(recorded.data.sessionLabel).toBe('REKAMAN_BERIZIN_BUKAN_LIVE');
    }
  });

  test('F70 Discount & Margin Approval: tolak di bawah floor price & tolak reuse approval lama', () => {
    const belowFloor = evaluateDiscountMarginProposal({
      quoteId: 'Q-1',
      listPriceIdr: 1000000000,
      floorPriceIdr: 950000000,
      proposedPriceIdr: 900000000,
    });
    expect(belowFloor.ok).toBe(false);

    const reused = evaluateDiscountMarginProposal({
      quoteId: 'Q-2',
      listPriceIdr: 1000000000,
      floorPriceIdr: 950000000,
      proposedPriceIdr: 960000000,
      usedPreviousApprovalForNewQuote: true,
    });
    expect(reused.ok).toBe(false);

    const dirLevel = evaluateDiscountMarginProposal({
      quoteId: 'Q-3',
      listPriceIdr: 1000000000,
      floorPriceIdr: 950000000,
      proposedPriceIdr: 950000000,
    });
    expect(dirLevel.ok).toBe(true);
    if (dirLevel.ok) {
      expect(dirLevel.data.requiredApproverRole).toBe('DIREKSI');
      expect(dirLevel.data.aiOrSeCanBypass).toBe(false);
    }
  });
});
