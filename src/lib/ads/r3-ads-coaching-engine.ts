// ============================================================================
// GELOMBANG 3 ENGINE: IKLAN RESMI & COACHING QA (F38, F39, F40, F41, F53)
// ============================================================================

// --- F38: Official Ad Campaign Launcher (200 AIC, A24/A25/A26) ---
export function launchOfficialCampaign(params: {
  projectId: string;
  campaignName: string;
  officialAccountVerified: boolean;
  budgetApproved: boolean;
  dailySpendIdr: number;
  serverCapDailyIdr: number;
  tokenActive: boolean;
  adSetsCount: number;
}) {
  if (!params.officialAccountVerified || !params.budgetApproved) {
    return { ok: false as const, error: 'Peluncuran hanya untuk akun resmi berizin dan budget approved (F38).' };
  }
  if (!params.tokenActive) {
    return { ok: false as const, error: 'AUTH_TOKEN_REVOKED: Token akun iklan dicabut; peluncuran gagal nyata.' };
  }
  if (Number(params.dailySpendIdr) > Number(params.serverCapDailyIdr)) {
    return { ok: false as const, error: 'Daily spend melebihi server-side cap (F38).' };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F38' as const,
      specialists: ['A25', 'A26', 'A24'],
      projectId: params.projectId,
      campaignName: params.campaignName.trim(),
      adSetsCount: Math.min(Math.max(1, Number(params.adSetsCount) || 1), 3),
      dailySpendIdr: Number(params.dailySpendIdr),
      serverCapDailyIdr: Number(params.serverCapDailyIdr),
      status: 'LAUNCHED_OFFICIAL' as const,
    },
  };
}

// --- F39: Bid, Creative & Pacing Optimizer (30 AIC, A24/A25/A26) ---
export function evaluateBidPacingOptimizer(params: {
  accountId: string;
  cpqlIdr: number;
  siteVisitCount: number;
  seCapacityRemaining: number;
  proposedDeltaPct: number;
  maxCorridorPct?: number;
}) {
  const maxCorridor = params.maxCorridorPct ?? 20;
  const outOfCorridor = Math.abs(Number(params.proposedDeltaPct)) > maxCorridor;
  const capacityTight = params.seCapacityRemaining <= 0;

  const action = outOfCorridor || capacityTight ? 'HOLD_FOR_APPROVAL' : 'APPLY_IN_CORRIDOR';
  return {
    featureId: 'F39' as const,
    specialists: ['A24', 'A25', 'A26'],
    accountId: params.accountId,
    evaluatedBy: 'CPQL_VISIT_AND_CAPACITY', // Bukan CPL saja
    cpqlIdr: Number(params.cpqlIdr),
    siteVisitCount: Number(params.siteVisitCount),
    seCapacityRemaining: Number(params.seCapacityRemaining),
    proposedDeltaPct: Number(params.proposedDeltaPct),
    maxCorridorPct: maxCorridor,
    action,
    requiresHumanApproval: action === 'HOLD_FOR_APPROVAL',
  };
}

// --- F40: Search Demand & Intent Capture (150 AIC, A25/A26/A27) ---
export function validateSearchDemandCluster(params: {
  projectId: string;
  clusterName: string;
  keywords: string[];
  negativeKeywords: string[];
  landingPageUrl: string;
  trackingPixelId: string;
  housingPolicyCompliant: boolean;
}) {
  if (!params.housingPolicyCompliant) {
    return { ok: false as const, error: 'Klaim housing/targeting wajib memenuhi kebijakan platform (F40).' };
  }
  if (!params.keywords?.length || !params.negativeKeywords?.length || !params.landingPageUrl?.trim() || !params.trackingPixelId?.trim()) {
    return { ok: false as const, error: 'Keyword, negative keyword, landing page, dan tracking ID wajib sinkron (F40).' };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F40' as const,
      specialists: ['A25', 'A26', 'A27'],
      projectId: params.projectId,
      clusterName: params.clusterName.trim(),
      keywordsCount: params.keywords.length,
      negativeKeywordsCount: params.negativeKeywords.length,
      landingPageUrl: params.landingPageUrl.trim(),
      trackingPixelId: params.trackingPixelId.trim(),
      housingPolicyCompliant: true,
    },
  };
}

// --- F41: Retargeting & Suppression (80 AIC, A25/A26/A34) ---
export interface RetargetingLeadInput {
  leadId: string;
  optedOut: boolean;
  isClosedWon: boolean;
  hasMarketingConsent: boolean;
}

export function buildRetargetingSuppressionList(params: {
  projectId: string;
  audienceName: string;
  authorizedAudienceOnly: boolean;
  leads: RetargetingLeadInput[];
}) {
  if (!params.authorizedAudienceOnly) {
    return { ok: false as const, error: 'Dilarang mengunggah seluruh CRM tanpa dasar otorisasi audience (F41).' };
  }
  const suppressedIds: string[] = [];
  const eligibleIds: string[] = [];
  for (const l of params.leads) {
    if (l.optedOut || l.isClosedWon || !l.hasMarketingConsent) {
      suppressedIds.push(l.leadId);
    } else {
      eligibleIds.push(l.leadId);
    }
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F41' as const,
      specialists: ['A25', 'A26', 'A34'],
      projectId: params.projectId,
      audienceName: params.audienceName.trim(),
      eligibleIds,
      suppressedIds,
      suppressionAppliedBeforeRefresh: true,
    },
  };
}

// --- F53: Quality Scoring & Coaching (100 AIC, A31/A32/A38) ---
export function maskPiiText(text: string): string {
  return String(text || '')
    .replace(/(\+?62|0)8\d{7,11}/g, '[PHONE_MASKED]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[EMAIL_MASKED]');
}

export function auditConversationQuality(params: {
  seEmail: string;
  sampleTranscripts: string[];
  aiScore: number;
  humanAdjudicatedBy: string;
  coachingNotes: string;
}) {
  if (!params.humanAdjudicatedBy?.trim()) {
    return { ok: false as const, error: 'Adjudikasi manusia wajib diisi; nilai AI bukan dasar sanksi tunggal (F53).' };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F53' as const,
      specialists: ['A31', 'A32', 'A38'],
      seEmail: params.seEmail,
      maskedSamples: params.sampleTranscripts.map(maskPiiText),
      aiScore: Number(params.aiScore),
      humanAdjudicatedBy: params.humanAdjudicatedBy.trim(),
      coachingNotes: params.coachingNotes.trim(),
      aiScoreIsSoleHrBasis: false,
    },
  };
}
