// ============================================================================
// R2 GELOMBANG 1 ENGINE: KONTEN & SALES KIT (F16, F17, F22, F23, F24, F26)
// ============================================================================

// --- F16: Elevator Pitch & Objection Kit (120 AIC, A17/A32/A38) ---
export interface ObjectionItem {
  question: string;
  answer: string;
  sourceRef?: string;
  topic?: 'GENERAL' | 'PRICE_FACT' | 'DISKON_KHUSUS' | 'LEGALITAS';
}

export interface PitchKitInput {
  projectId: string;
  title: string;
  pitch30s: string;
  pitch60s: string;
  pitch180s: string;
  objections: ObjectionItem[];
}

export function validateAndBuildPitchKit(input: PitchKitInput) {
  if (!input.projectId?.trim() || !input.title?.trim()) {
    return { ok: false as const, error: 'projectId dan title kit wajib diisi.' };
  }
  if (!input.pitch30s?.trim() || !input.pitch60s?.trim() || !input.pitch180s?.trim()) {
    return { ok: false as const, error: 'Pitch 30, 60, dan 180 detik wajib lengkap.' };
  }
  if (!Array.isArray(input.objections) || input.objections.length === 0) {
    return { ok: false as const, error: 'Minimal 1 item keberatan wajib diisi.' };
  }

  const processed = input.objections.map((o) => {
    const hasEvidence = Boolean(o.sourceRef && o.sourceRef.trim().length > 0);
    const sensitiveTopic = o.topic === 'DISKON_KHUSUS' || o.topic === 'LEGALITAS';
    const escalateToHuman = !hasEvidence || sensitiveTopic;
    return {
      question: o.question.trim(),
      answer: escalateToHuman && sensitiveTopic
        ? 'Eskalasi ke SM / Legal manusia — AI tidak mengesahkan diskon khusus atau klaim legalitas.'
        : o.answer.trim(),
      sourceRef: o.sourceRef?.trim() || null,
      topic: o.topic || 'GENERAL',
      hasEvidence,
      escalateToHuman,
    };
  });

  return {
    ok: true as const,
    data: {
      featureId: 'F16' as const,
      specialists: ['A17', 'A32', 'A38'],
      projectId: input.projectId.trim(),
      title: input.title.trim(),
      pitch30s: input.pitch30s.trim(),
      pitch60s: input.pitch60s.trim(),
      pitch180s: input.pitch180s.trim(),
      objections: processed,
      escalatedCount: processed.filter((p) => p.escalateToHuman).length,
      aiCanApproveDiscountOrLegal: false,
    },
  };
}

// --- F17: Persona-to-Unit Value Matching (40 AIC, A14/A29/A39) ---
export interface UnitCandidate {
  unitCode: string;
  clusterName: string;
  status: string;
  priceCashIdr: number;
  bedrooms: number;
  buyerName?: string; // PII yang wajib disanitasi keluar
  buyerPhone?: string;
}

export function matchPersonaToUnits(params: {
  projectId: string;
  statedNeed: string;
  budgetMaxIdr: number;
  minBedrooms?: number;
  units: UnitCandidate[];
}) {
  const activeUnits = params.units.filter(
    (u) => ['AVAILABLE', 'READY'].includes(String(u.status || '').toUpperCase())
      && Number(u.priceCashIdr) > 0
      && Number(u.priceCashIdr) <= params.budgetMaxIdr
      && (params.minBedrooms ? Number(u.bedrooms) >= params.minBedrooms : true)
  );

  const recommendations = activeUnits
    .sort((a, b) => a.priceCashIdr - b.priceCashIdr)
    .slice(0, 2) // Maksimal 2 rekomendasi unit, tanpa PII pembeli lain, tanpa mutasi status unit
    .map((u) => ({
      unitCode: u.unitCode,
      clusterName: u.clusterName,
      status: u.status,
      priceCashIdr: u.priceCashIdr,
      bedrooms: u.bedrooms,
      unitStatusMutated: false,
      buyerPiiExposed: false,
    }));

  return {
    featureId: 'F17' as const,
    specialists: ['A14', 'A29', 'A39'],
    projectId: params.projectId,
    statedNeed: params.statedNeed,
    budgetMaxIdr: params.budgetMaxIdr,
    recommendations,
    readOnlyMatch: true,
  };
}

// --- F22: Approval & Publishing Queue (30 AIC, A18/A19/A23) ---
export function processPublishQueueJob(params: {
  projectId: string;
  title: string;
  channel: string;
  scheduledAt: string;
  approvedByHuman: boolean;
  apiAvailable: boolean;
  idempotencyKey: string;
}) {
  if (!params.approvedByHuman) {
    return { ok: false as const, error: 'Konten wajib disetujui manusia sebelum masuk antrean publish (F22).' };
  }
  if (!params.idempotencyKey?.trim()) {
    return { ok: false as const, error: 'idempotencyKey wajib diisi agar retry tidak double-post.' };
  }
  const useExportFallback = !params.apiAvailable;
  return {
    ok: true as const,
    data: {
      featureId: 'F22' as const,
      specialists: ['A18', 'A19', 'A23'],
      projectId: params.projectId,
      title: params.title,
      channel: params.channel,
      scheduledAt: params.scheduledAt,
      idempotencyKey: params.idempotencyKey.trim(),
      status: useExportFallback ? ('EXPORT_REQUIRED' as const) : ('PUBLISHED' as const),
      deliveryMode: useExportFallback ? 'EXPORT_REMINDER_LABELED_NO_PERSONAL_BOT' : 'OFFICIAL_CHANNEL_API',
      publishReceiptId: useExportFallback ? null : `PUB-${params.idempotencyKey.slice(0, 12)}`,
    },
  };
}

// --- F23: Content Attribution & Learning (120 AIC, A18/A24/A46) ---
export interface AttributionTouch {
  codeOrUtm: string;
  leadId: string;
  hasOpportunity: boolean;
}

export function buildContentAttributionReport(params: {
  projectId: string;
  periodDays: number;
  touches: AttributionTouch[];
}) {
  const byCode = new Map<string, { leads: Set<string>; oppLeads: Set<string> }>();
  for (const t of params.touches) {
    const code = String(t.codeOrUtm || 'DIRECT').trim();
    if (!byCode.has(code)) byCode.set(code, { leads: new Set(), oppLeads: new Set() });
    const entry = byCode.get(code)!;
    entry.leads.add(t.leadId);
    if (t.hasOpportunity) entry.oppLeads.add(t.leadId);
  }

  const rows = Array.from(byCode.entries()).map(([code, v]) => ({
    codeOrUtm: code,
    uniqueLeads: v.leads.size,
    opportunities: v.oppLeads.size,
    opportunityRatePct: v.leads.size > 0 ? Math.round((v.oppLeads.size / v.leads.size) * 1000) / 10 : 0,
  }));

  return {
    featureId: 'F23' as const,
    specialists: ['A18', 'A24', 'A46'],
    projectId: params.projectId,
    periodDays: params.periodDays,
    denominatorLabel: `Lead unik dalam ${params.periodDays} hari`,
    correlationNote: 'KORELASI_BUKAN_KAUSAL_CLOSING',
    rows,
  };
}

// --- F24: Asset Rights & Content Retirement (80 AIC, A18/A20/A22) ---
export interface AssetRightsInput {
  assetName: string;
  hasLicense: boolean;
  hasModelConsent: boolean;
  hasBrandLabel: boolean;
  expiresAt?: string;
  revoked?: boolean;
}

export function evaluateAssetRights(input: AssetRightsInput, now = new Date()) {
  const missingRights = !input.hasLicense || !input.hasModelConsent || !input.hasBrandLabel;
  const expired = input.expiresAt ? new Date(input.expiresAt).getTime() < now.getTime() : false;
  const retired = Boolean(input.revoked) || expired;

  const status = missingRights ? 'BLOCKED' : retired ? 'RETIRED' : 'ACTIVE';
  const distributionAllowed = status === 'ACTIVE';
  const auditReason = missingRights
    ? 'LISENSI_IZIN_ATAU_LABEL_TIDAK_LENGKAP'
    : input.revoked
    ? 'DICABUT_PEMILIK_HAK'
    : expired
    ? 'MASA_BERLAKU_HABIS'
    : 'MEMENUHI_SYARAT_DISTRIBUSI';

  return {
    featureId: 'F24' as const,
    specialists: ['A18', 'A20', 'A22'],
    assetName: input.assetName.trim(),
    status,
    distributionAllowed,
    auditReason,
    evaluatedAt: now.toISOString(),
  };
}

// --- F26: Video Template & Subtitle (150 AIC, A20/A21) ---
export interface VideoTemplateInput {
  projectId: string;
  title: string;
  durationSeconds: number;
  licensedFootage: boolean;
  subtitlesVerified: boolean;
  isFakeRealTour: boolean;
  subtitlePriceLabel?: string;
}

export function validateVideoTemplate(input: VideoTemplateInput) {
  if (input.isFakeRealTour) {
    return { ok: false as const, error: 'Dilarang membuat tur nyata palsu (F26 guardrail).' };
  }
  if (!input.licensedFootage) {
    return { ok: false as const, error: 'Footage wajib berizin sebelum render video (F26).' };
  }
  if (Number(input.durationSeconds) <= 0 || Number(input.durationSeconds) > 30) {
    return { ok: false as const, error: 'Durasi video template wajib 1–30 detik (F26).' };
  }
  if (!input.subtitlesVerified) {
    return { ok: false as const, error: 'Subtitle dan angka pada video wajib terverifikasi.' };
  }

  return {
    ok: true as const,
    data: {
      featureId: 'F26' as const,
      specialists: ['A20', 'A21'],
      projectId: input.projectId.trim(),
      title: input.title.trim(),
      durationSeconds: Number(input.durationSeconds),
      licensedFootage: true,
      subtitlesVerified: true,
      isFakeRealTour: false,
      subtitlePriceLabel: input.subtitlePriceLabel?.trim() || null,
      renderStatus: 'READY_TEMPLATE',
    },
  };
}
