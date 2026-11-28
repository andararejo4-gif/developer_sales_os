// ============================================================================
// R2 GELOMBANG 2 ENGINE: CRM, AKUISISI & LAPANGAN
// F37, F44, F45, F46, F63, F65, F71
// ============================================================================

// --- F37: Acquisition Plan & Budget Simulator (200 AIC, A12/A25/A46) ---
export interface AcquisitionChannelPlan {
  channel: string;
  spendIdr: number;
  capacityLeads: number;
  cplEstimateIdr: number;
}

export function buildAcquisitionPlan(params: {
  projectId: string;
  availableStock: number;
  channels: AcquisitionChannelPlan[];
}) {
  const validChannels = (params.channels || []).filter((c) => Number(c.spendIdr) > 0 && Number(c.cplEstimateIdr) > 0);
  const totalSpendIdr = validChannels.reduce((acc, c) => acc + Number(c.spendIdr), 0);
  const totalCapacity = validChannels.reduce((acc, c) => acc + Number(c.capacityLeads || 0), 0);
  const projectedLeads = validChannels.length === 0
    ? 0 // Tanpa sumber akuisisi tidak menghasilkan lead fiktif
    : validChannels.reduce((acc, c) => acc + Math.min(Number(c.capacityLeads || 0), Math.floor(c.spendIdr / c.cplEstimateIdr)), 0);

  return {
    featureId: 'F37' as const,
    specialists: ['A12', 'A25', 'A46'],
    projectId: params.projectId,
    periodDays: 30,
    availableStock: Math.max(0, Number(params.availableStock) || 0),
    totalSpendIdr,
    totalCapacity,
    projectedLeads,
    channels: validChannels,
    zeroAdditionalSalesScenario: {
      additionalSales: 0,
      cashBurnIdr: totalSpendIdr,
      note: 'Skenario nol tambahan penjualan: biaya tetap keluar, runway & stok harus aman.',
    },
    noFictitiousLeadsWhenEmpty: validChannels.length === 0 ? projectedLeads === 0 : true,
  };
}

// --- F44: Deduplication & Identity Merge (40 AIC, A28/A30) ---
export function normalizeIndoPhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export interface ContactRecordInput {
  id: string;
  name: string;
  phone: string;
  email?: string;
  opportunityId: string;
}

export function deduplicateAndMergeContacts(records: ContactRecordInput[]) {
  const byPhone = new Map<string, ContactRecordInput[]>();
  for (const r of records) {
    const norm = normalizeIndoPhone(r.phone);
    if (!norm) continue;
    if (!byPhone.has(norm)) byPhone.set(norm, []);
    byPhone.get(norm)!.push(r);
  }

  const mergedGroups = Array.from(byPhone.entries()).map(([normalizedPhone, group]) => {
    const distinctNames = new Set(group.map((g) => g.name.trim().toLowerCase()));
    const distinctEmails = new Set(group.map((g) => (g.email || '').trim().toLowerCase()).filter(Boolean));
    const hasConflict = distinctNames.size > 1 || distinctEmails.size > 1;
    const opportunityIds = Array.from(new Set(group.map((g) => g.opportunityId).filter(Boolean)));
    return {
      normalizedPhone,
      primaryContactId: group[0].id,
      mergedContactIds: group.map((g) => g.id),
      opportunityIds, // Contact sama tetap bisa punya opportunity terpisah
      requiresReview: hasConflict,
      reversibleSnapshot: group,
      reversible: true,
    };
  });

  return {
    featureId: 'F44' as const,
    specialists: ['A28', 'A30'],
    totalInputRecords: records.length,
    mergedGroups,
    conflictCount: mergedGroups.filter((g) => g.requiresReview).length,
  };
}

// --- F45: BANT & Fit Qualification (2 AIC, A14/A29) ---
export interface BantDimension {
  answer?: string | null;
  evidence?: string | null;
}

export function evaluateBantFit(params: {
  leadId: string;
  budget: BantDimension;
  authority: BantDimension;
  need: BantDimension;
  timeline: BantDimension;
  manualOverrideScore?: number;
  usedSensitiveAttribute?: boolean;
}) {
  if (params.usedSensitiveAttribute) {
    return {
      ok: false as const,
      error: 'Dilarang menilai atau menolak lead berdasarkan atribut sensitif / asumsi pendapatan (F45).',
    };
  }
  const dims = [params.budget, params.authority, params.need, params.timeline];
  const scoredDims = dims.map((d) => ({
    answer: d.answer?.trim() || 'UNKNOWN',
    evidence: d.evidence?.trim() || 'UNKNOWN',
    verified: Boolean(d.answer?.trim() && d.evidence?.trim()),
  }));
  const computedScore = scoredDims.filter((d) => d.verified).length * 25;
  const finalScore = typeof params.manualOverrideScore === 'number'
    ? Math.min(100, Math.max(0, params.manualOverrideScore))
    : computedScore;

  return {
    ok: true as const,
    data: {
      featureId: 'F45' as const,
      specialists: ['A14', 'A29'],
      leadId: params.leadId,
      dimensions: {
        budget: scoredDims[0],
        authority: scoredDims[1],
        need: scoredDims[2],
        timeline: scoredDims[3],
      },
      computedScore,
      finalScore,
      manualCorrected: typeof params.manualOverrideScore === 'number',
      sensitiveAttributeUsed: false,
    },
  };
}

// --- F46: Ownership, Round-Robin & SLA (20 AIC, A28/A30) ---
export interface SeCandidate {
  email: string;
  onShift: boolean;
  onLeave: boolean;
  activeLeads: number;
  maxCapacity: number;
}

export function assignLeadRoundRobinSla(params: {
  leadId: string;
  previousOwners: string[];
  candidates: SeCandidate[];
  slaTimeoutMinutes: number;
}) {
  const eligible = params.candidates.filter(
    (c) => c.onShift && !c.onLeave && c.activeLeads < c.maxCapacity && !params.previousOwners.includes(c.email)
  );
  const fallbackEligible = eligible.length > 0
    ? eligible
    : params.candidates.filter((c) => c.onShift && !c.onLeave && c.activeLeads < c.maxCapacity);

  if (fallbackEligible.length === 0) {
    return { ok: false as const, error: 'Tidak ada SE yang on-shift & punya kapasitas tersedia (F46).' };
  }
  const chosen = [...fallbackEligible].sort((a, b) => a.activeLeads - b.activeLeads)[0];
  const ownerHistory = [...params.previousOwners, chosen.email]; // Histori pemilik tidak pernah dihapus

  return {
    ok: true as const,
    data: {
      featureId: 'F46' as const,
      specialists: ['A28', 'A30'],
      leadId: params.leadId,
      assignedTo: chosen.email,
      ownerHistory,
      slaTimeoutMinutes: Math.max(5, Number(params.slaTimeoutMinutes) || 30),
    },
  };
}

// --- F63: Check-in & Field Evidence (40 AIC / 20 check-in diringkas, A28/A36/A37) ---
export interface FieldCheckinEvent {
  offlineEventId: string;
  seEmail: string;
  locationLabel: string;
  hasEvidence: boolean;
  recordKind: 'FIELD_ACTIVITY' | 'ATTENDANCE';
}

export function summarizeFieldCheckins(events: FieldCheckinEvent[]) {
  const seenIds = new Set<string>();
  const accepted: FieldCheckinEvent[] = [];
  const rejected: Array<{ offlineEventId: string; reason: string }> = [];

  for (const ev of events) {
    if (ev.recordKind === 'ATTENDANCE') {
      rejected.push({ offlineEventId: ev.offlineEventId, reason: 'ABSENSI_TERPISAH_DARI_CHECKIN_AKTIVITAS' });
      continue;
    }
    if (!ev.offlineEventId?.trim() || seenIds.has(ev.offlineEventId)) {
      rejected.push({ offlineEventId: ev.offlineEventId || '', reason: 'DUPLICATE_OR_MISSING_OFFLINE_ID' });
      continue;
    }
    if (!ev.hasEvidence) {
      rejected.push({ offlineEventId: ev.offlineEventId, reason: 'MINIMAL_EVIDENCE_REQUIRED' });
      continue;
    }
    seenIds.add(ev.offlineEventId);
    accepted.push(ev);
  }

  return {
    featureId: 'F63' as const,
    specialists: ['A28', 'A36', 'A37'],
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    rejected,
    billedOn: 'SUMMARY_ONLY' as const, // Meter AI hanya pada ringkasan, bukan event mentah
    summaryUnits: Math.max(1, Math.ceil(accepted.length / 20)),
  };
}

// --- F65: Role-play & Product Certification (50 AIC, A32/A37/A38) ---
export function evaluateRoleplayCertification(params: {
  seEmail: string;
  durationMinutes: number;
  factAccuracyScore: number;
  ethicsCompliance: boolean;
  newPriceVersionDetected: boolean;
}) {
  if (params.durationMinutes > 10) {
    return { ok: false as const, error: 'Durasi role-play teks maksimal 10 menit (F65).' };
  }
  const passed = params.factAccuracyScore >= 80 && params.ethicsCompliance;
  return {
    ok: true as const,
    data: {
      featureId: 'F65' as const,
      specialists: ['A32', 'A37', 'A38'],
      seEmail: params.seEmail,
      durationMinutes: params.durationMinutes,
      factAccuracyScore: params.factAccuracyScore,
      ethicsCompliance: params.ethicsCompliance,
      certified: passed,
      retrainingTriggered: params.newPriceVersionDetected,
      hrDecisionByHuman: true, // Keputusan HR tetap manusia
    },
  };
}

// --- F71: Booking Hold & Confirmation (30 AIC, A40/A42/A43) ---
export function validateBookingHoldConfirmation(params: {
  unitCode: string;
  holdFormSigned: boolean;
  termsAccepted: boolean;
  paymentVerifiedByGateway: boolean;
  screenshotOnly: boolean;
  webhookEventId: string;
}) {
  if (params.screenshotOnly || !params.paymentVerifiedByGateway) {
    return {
      ok: false as const,
      error: 'Pembayaran tervalidasi gateway wajib ada — screenshot saja bukan bukti dana sah (F71).',
    };
  }
  if (!params.holdFormSigned || !params.termsAccepted || !params.webhookEventId?.trim()) {
    return {
      ok: false as const,
      error: 'Form hold, persetujuan terms, dan webhookEventId wajib lengkap (F71).',
    };
  }
  return {
    ok: true as const,
    data: {
      featureId: 'F71' as const,
      specialists: ['A40', 'A42', 'A43'],
      unitCode: params.unitCode.trim(),
      status: 'CONFIRMED_HOLD' as const,
      webhookEventId: params.webhookEventId.trim(),
      screenshotOnlyAccepted: false,
    },
  };
}
