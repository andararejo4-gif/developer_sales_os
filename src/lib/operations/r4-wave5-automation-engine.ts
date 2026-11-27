// ============================================================================
// GELOMBANG 5 ENGINE: R4 SKALABILITAS & OTOMASI LANJUT
// F30, F36, F42, F54, F60
// ============================================================================

// --- F30: Bulk Personalized Creative API (500 AIC, A19/A20/A21) ---
export interface BulkCreativeItem {
  itemId: string;
  templateCode: string;
  hasBuyerPii?: boolean;
  simulateFail?: boolean;
}

export function runBulkCreativeBatch(params: {
  projectId: string;
  concurrencyLimit: number;
  items: BulkCreativeItem[];
}) {
  if (!params.items || params.items.length === 0 || params.items.length > 100) {
    return { ok: false as const, error: 'Batch kreatif wajib 1–100 aset per eksekusi (F30).' };
  }
  const succeeded: string[] = [];
  const failed: Array<{ itemId: string; reason: string }> = [];

  for (const it of params.items) {
    if (it.hasBuyerPii) {
      failed.push({ itemId: it.itemId, reason: 'PII_PEMBELI_TERDETEKSI' });
    } else if (it.simulateFail) {
      failed.push({ itemId: it.itemId, reason: 'RENDER_PARTIAL_ERROR' });
    } else {
      succeeded.push(it.itemId);
    }
  }

  return {
    ok: true as const,
    data: {
      featureId: 'F30' as const,
      specialists: ['A19', 'A20', 'A21'],
      projectId: params.projectId,
      concurrencyLimit: Math.min(Math.max(1, Number(params.concurrencyLimit) || 5), 10),
      succeededCount: succeeded.length,
      failedCount: failed.length,
      failed,
    },
  };
}

// --- F36: Multi-Project Template & Web API (300 AIC, A23/A24/A48) ---
export interface MultiSiteDeployTarget {
  projectId: string;
  domain: string;
  simulateFail?: boolean;
}

export function deployMultiProjectWebBatch(params: {
  tenantId: string;
  sites: MultiSiteDeployTarget[];
}) {
  if (!params.sites || params.sites.length === 0 || params.sites.length > 10) {
    return { ok: false as const, error: 'Batch deployment web wajib 1–10 situs (F36).' };
  }
  const results = params.sites.map((s) => ({
    tenantId: params.tenantId,
    projectId: s.projectId,
    domain: s.domain,
    status: s.simulateFail ? ('ROLLED_BACK_ISOLATED' as const) : ('STAGED_OR_DEPLOYED' as const),
    otherSitesAffected: false,
  }));

  return {
    ok: true as const,
    data: {
      featureId: 'F36' as const,
      specialists: ['A23', 'A24', 'A48'],
      results,
      isolatedPerProjectAndTenant: true,
    },
  };
}

// --- F42: Portfolio Budget Allocation (300 AIC, A25/A26/A46/A48) ---
export interface PortfolioProjectInput {
  projectId: string;
  availableStock: number;
  marginPct: number;
  currentBudgetIdr: number;
  proposedBudgetIdr: number;
}

export function simulatePortfolioBudgetAllocation(params: {
  hasCrossProjectPermission: boolean;
  projects: PortfolioProjectInput[];
}) {
  if (!params.hasCrossProjectPermission) {
    return { ok: false as const, error: 'Izin lintas proyek diperlukan untuk simulasi portofolio (F42).' };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F42' as const,
      specialists: ['A25', 'A26', 'A46', 'A48'],
      projects: params.projects.slice(0, 10),
      status: 'PENDING_APPROVER' as const,
      autoTransferExecuted: false, // Perpindahan dana menunggu approver manusia
    },
  };
}

// --- F54: Opt-in AI Voice Qualifier (50 AIC/mnt; telko terpisah, A29/A31/A33) ---
export function validateOptInAiVoiceQualifier(params: {
  planCode: 'gold' | 'platinum' | 'diamond';
  leadId: string;
  voiceOptIn: boolean;
  aiIdentityDisclosed: boolean;
  withinQuietHoursAllowed: boolean;
  recordingConsent: boolean;
  durationMinutes: number;
}) {
  if (params.planCode !== 'diamond') {
    return { ok: false as const, error: 'AI Voice Qualifier hanya tersedia pada paket Diamond (F54).' };
  }
  if (!params.voiceOptIn || !params.aiIdentityDisclosed || !params.withinQuietHoursAllowed || !params.recordingConsent) {
    return { ok: false as const, error: 'Opt-in suara spesifik, identitas AI, quiet hours, dan izin rekaman wajib terpenuhi (F54).' };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F54' as const,
      specialists: ['A29', 'A31', 'A33'],
      leadId: params.leadId,
      durationMinutes: Math.max(1, Number(params.durationMinutes) || 1),
      telcoCostBilledSeparately: true,
      stopCommandSupported: true,
    },
  };
}

// --- F60: Lifecycle Reactivation Experiment (150 AIC, A24/A34/A46) ---
export interface ReactivationLeadInput {
  leadId: string;
  hasConsent: boolean;
  optedOut: boolean;
  isSilentLongTerm: boolean;
  withinRetentionWindow: boolean;
}

export function buildLifecycleReactivationCohort(params: {
  projectId: string;
  cohortName: string;
  holdoutPct: number;
  stopRule: string;
  leads: ReactivationLeadInput[];
}) {
  if (params.holdoutPct <= 0 || !params.stopRule?.trim()) {
    return { ok: false as const, error: 'Holdout (>0%) dan stop rule wajib diisi untuk eksperimen reaktivasi (F60).' };
  }
  const eligible: string[] = [];
  const excluded: string[] = [];
  for (const l of params.leads) {
    if (l.hasConsent && !l.optedOut && !l.isSilentLongTerm && l.withinRetentionWindow) {
      eligible.push(l.leadId);
    } else {
      excluded.push(l.leadId);
    }
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F60' as const,
      specialists: ['A24', 'A34', 'A46'],
      projectId: params.projectId,
      cohortName: params.cohortName.trim(),
      holdoutPct: params.holdoutPct,
      stopRule: params.stopRule.trim(),
      eligibleIds: eligible,
      excludedIds: excluded,
      silentAndOptOutExcluded: true,
    },
  };
}
