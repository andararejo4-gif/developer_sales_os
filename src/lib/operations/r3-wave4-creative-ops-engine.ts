// ============================================================================
// GELOMBANG 4 ENGINE: KREATIF, WEB, APPOINTMENT & MARGIN
// F28, F29, F34, F35, F58, F59, F70
// ============================================================================

// --- F28: Voiceover & Localization (50 AIC, A21/A22) ---
export function validateVoiceoverLocalization(params: {
  projectId: string;
  title: string;
  language: string;
  durationMinutes: number;
  voiceConsentVerified: boolean;
  isUnauthorizedVoiceClone: boolean;
  priceTermsVerified: boolean;
}) {
  if (params.isUnauthorizedVoiceClone || !params.voiceConsentVerified) {
    return { ok: false as const, error: 'Dilarang mengkloning suara tanpa persetujuan & otorisasi eksplisit (F28).' };
  }
  if (!params.priceTermsVerified) {
    return { ok: false as const, error: 'Harga dan istilah pada terjemahan/voiceover wajib terverifikasi (F28).' };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F28' as const,
      specialists: ['A21', 'A22'],
      projectId: params.projectId,
      title: params.title.trim(),
      language: params.language.trim(),
      durationMinutes: Math.max(1, Number(params.durationMinutes) || 1),
      voiceConsentVerified: true,
      priceTermsVerified: true,
    },
  };
}

// --- F29: Brand Kit & Creative QA (100 AIC, A20/A22) ---
export function evaluateCreativeBrandQa(params: {
  assetName: string;
  reviewerName: string;
  logoOk: boolean;
  colorContrastOk: boolean;
  safeAreaOk: boolean;
  spellingOk: boolean;
  priceMatchOk: boolean;
}) {
  if (!params.reviewerName?.trim()) {
    return { ok: false as const, error: 'Nama reviewer wajib diisi untuk QA kreatif (F29).' };
  }
  const allPassed = params.logoOk && params.colorContrastOk && params.safeAreaOk && params.spellingOk && params.priceMatchOk;
  return {
    ok: true as const,
    data: {
      featureId: 'F29' as const,
      specialists: ['A20', 'A22'],
      assetName: params.assetName.trim(),
      reviewerName: params.reviewerName.trim(),
      status: allPassed ? ('QA_PASSED' as const) : ('REVISION_REQUIRED' as const),
      autoPublishAllowed: allPassed,
    },
  };
}

// --- F34: Local SEO & Profile Workflow (200 AIC, A23/A27) ---
export function validateLocalSeoWorkflow(params: {
  projectId: string;
  profileName: string;
  napConsistent: boolean;
  schemaValid: boolean;
  indexable: boolean;
  ownershipVerified: boolean;
  isFakeLocationOrReview: boolean;
}) {
  if (params.isFakeLocationOrReview) {
    return { ok: false as const, error: 'Dilarang membuat lokasi atau ulasan palsu (F34).' };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F34' as const,
      specialists: ['A23', 'A27'],
      projectId: params.projectId,
      profileName: params.profileName.trim(),
      napConsistent: params.napConsistent,
      schemaValid: params.schemaValid,
      indexable: params.indexable,
      status: params.ownershipVerified ? ('PUBLISHED_VERIFIED' as const) : ('PENDING_OWNERSHIP_VERIFICATION' as const),
    },
  };
}

// --- F35: CRO, Accessibility & Experiments (150 AIC, A23/A24) ---
export function buildCroExperiment(params: {
  projectId: string;
  experimentName: string;
  variantA: string;
  variantB: string;
  primaryMetric: string;
  stopRule: string;
  randomized: boolean;
  keyboardAccessible: boolean;
  formErrorAccessible: boolean;
}) {
  if (!params.variantA?.trim() || !params.variantB?.trim() || !params.stopRule?.trim()) {
    return { ok: false as const, error: 'Dua varian dan stop rule wajib dicatat (F35).' };
  }
  if (!params.keyboardAccessible || !params.formErrorAccessible) {
    return { ok: false as const, error: 'Uji aksesibilitas keyboard & error form wajib lulus sebelum eksperimen (F35).' };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F35' as const,
      specialists: ['A23', 'A24'],
      projectId: params.projectId,
      experimentName: params.experimentName.trim(),
      variants: [params.variantA.trim(), params.variantB.trim()],
      primaryMetric: params.primaryMetric.trim(),
      stopRule: params.stopRule.trim(),
      randomized: params.randomized,
      causalClaim: params.randomized ? 'EKSPERIMEN_RANDOMIZED' : 'OBSERVASIONAL_BUKAN_KAUSAL',
    },
  };
}

// --- F58: Reminder, No-Show & Reschedule (20 AIC, A34/A35) ---
export function processAppointmentReminder(params: {
  appointmentId: string;
  timezone: string;
  hasConsent: boolean;
  suppressed: boolean;
  noShowCount: number;
  maxRemindersOnNoShow?: number;
}) {
  if (!params.hasConsent || params.suppressed) {
    return { ok: false as const, error: 'Reminder diblokir: tidak ada izin atau masuk daftar suppression (F58).' };
  }
  const cap = params.maxRemindersOnNoShow ?? 1;
  if (params.noShowCount > cap) {
    return {
      ok: true as const,
      data: {
        featureId: 'F58' as const,
        specialists: ['A34', 'A35'],
        appointmentId: params.appointmentId,
        timezone: params.timezone,
        status: 'THROTTLED_NO_FLOOD' as const,
        sent: false,
      },
    };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F58' as const,
      specialists: ['A34', 'A35'],
      appointmentId: params.appointmentId,
      timezone: params.timezone || 'Asia/Jakarta',
      status: 'REMINDER_SCHEDULED' as const,
      sent: true,
    },
  };
}

// --- F59: Virtual Tour Session Coordinator (50 AIC, A21/A35/A37) ---
export function scheduleVirtualTour(params: {
  projectId: string;
  hostName: string;
  locationName: string;
  agenda: string;
  recordingConsent: boolean;
  isPreRecorded: boolean;
}) {
  if (!params.hostName?.trim() || !params.locationName?.trim() || !params.agenda?.trim()) {
    return { ok: false as const, error: 'Host, lokasi nyata, dan agenda sesi wajib diisi (F59).' };
  }
  if (!params.recordingConsent) {
    return { ok: false as const, error: 'Persetujuan rekaman wajib ada (F59).' };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F59' as const,
      specialists: ['A21', 'A35', 'A37'],
      projectId: params.projectId,
      hostName: params.hostName.trim(),
      locationName: params.locationName.trim(),
      agenda: params.agenda.trim(),
      isPreRecorded: params.isPreRecorded,
      liveClaimAllowed: !params.isPreRecorded,
      sessionLabel: params.isPreRecorded ? 'REKAMAN_BERIZIN_BUKAN_LIVE' : 'SESI_LIVE_HOST_NYATA',
    },
  };
}

// --- F70: Discount & Margin Approval (20 AIC, A39/A40/A48) ---
export function evaluateDiscountMarginProposal(params: {
  quoteId: string;
  listPriceIdr: number;
  floorPriceIdr: number;
  proposedPriceIdr: number;
  usedPreviousApprovalForNewQuote?: boolean;
}) {
  if (params.usedPreviousApprovalForNewQuote) {
    return { ok: false as const, error: 'Dilarang memakai approval lama untuk quote baru (F70).' };
  }
  if (Number(params.proposedPriceIdr) < Number(params.floorPriceIdr)) {
    return { ok: false as const, error: 'Harga usulan di bawah floor price server-side — ditolak otomatis (F70).' };
  }
  const discountPct = params.listPriceIdr > 0
    ? Math.round(((params.listPriceIdr - params.proposedPriceIdr) / params.listPriceIdr) * 1000) / 10
    : 0;
  const requiredApproverRole = discountPct > 3 ? 'DIREKSI' : 'SM';

  return {
    ok: true as const,
    data: {
      featureId: 'F70' as const,
      specialists: ['A39', 'A40', 'A48'],
      quoteId: params.quoteId.trim(),
      listPriceIdr: Number(params.listPriceIdr),
      floorPriceIdr: Number(params.floorPriceIdr),
      proposedPriceIdr: Number(params.proposedPriceIdr),
      discountPct,
      requiredApproverRole,
      status: 'PENDING_SERVER_APPROVAL' as const,
      aiOrSeCanBypass: false,
    },
  };
}
