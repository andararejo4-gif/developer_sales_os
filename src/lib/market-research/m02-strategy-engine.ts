// ============================================================================
// M02 STRATEGY & COMPETITOR ENGINE (F08, F09, F10)
// F08: STP & Positioning (120 AIC, A14/A15)
// F09: 7P, SWOT, TOWS & Action Plan 30 Hari (150 AIC, A12/A15)
// F10: Competitor & Listing Watch (150 AIC / 10 listing, A11/A13)
// ============================================================================

export type ReviewStatus = 'DRAFT' | 'REVIEWED' | 'APPROVED';

export interface StpSegment {
  name: string;
  needProfile: string;
  geography: string;
  serviceable: boolean;
}

export interface StpAnalysisInput {
  projectId: string;
  title: string;
  segments: StpSegment[];
  priorityTargets: string[];
  exclusionRationale: string[];
  positioningStatement: string;
  evidenceRefs?: string[];
}

export interface StpAnalysisRecord extends StpAnalysisInput {
  featureId: 'F08';
  specialists: ['A14', 'A15'];
  reviewStatus: ReviewStatus;
  isAutomatedDecision: false;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface SevenPStrategy {
  product: string;
  price: string;
  place: string;
  promotion: string;
  people: string;
  process: string;
  physicalEvidence: string;
}

export interface SwotMatrix {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface TowsMatrix {
  so: string[];
  wo: string[];
  st: string[];
  wt: string[];
}

export interface ActionPlanExperiment {
  hypothesis: string;
  action: string;
  pic: string;
  metric: string;
  period: string;
  status: 'PLANNED' | 'RUNNING' | 'DONE';
}

export interface SwotActionInput {
  projectId: string;
  title: string;
  sevenP: SevenPStrategy;
  swot: SwotMatrix;
  tows: TowsMatrix;
  facts: string[];
  assumptions: string[];
  actionPlan: ActionPlanExperiment[];
}

export interface SwotActionRecord extends SwotActionInput {
  featureId: 'F09';
  specialists: ['A12', 'A15'];
  separatedLayers: {
    factsCount: number;
    assumptionsCount: number;
    recommendationsCount: number;
  };
}

export type ListingPriceType = 'ASKING' | 'TRANSACTION';
export type QuarantineReason = 'DUPLICATE' | 'HTTP_404' | 'EXPIRED' | 'INVALID_SOURCE';

export interface CompetitorListingInput {
  title: string;
  sourceUrl: string;
  ltM2: number;
  lbM2: number;
  priceIdr: number;
  priceType: ListingPriceType;
  buildStage: string;
  feesNote?: string;
  listedAt: string;
  expiresAt?: string;
  httpStatus?: number;
}

export interface NormalizedCompetitorListing extends CompetitorListingInput {
  normalizedKey: string;
  pricePerSqmLand: number | null;
  pricePerSqmBuilding: number | null;
  priceClaimLabel: string;
  quarantined: boolean;
  quarantineReason: QuarantineReason | null;
}

export interface CompetitorWatchResult {
  featureId: 'F10';
  specialists: ['A11', 'A13'];
  projectId: string;
  refreshedAt: string;
  activeListings: NormalizedCompetitorListing[];
  quarantinedListings: NormalizedCompetitorListing[];
  askingCount: number;
  transactionCount: number;
  aicUnitsCharged: number;
}

export function validateAndBuildStp(input: StpAnalysisInput): { ok: true; data: StpAnalysisRecord } | { ok: false; error: string } {
  const projectId = String(input.projectId || '').trim();
  const title = String(input.title || '').trim();
  const positioning = String(input.positioningStatement || '').trim();
  if (!projectId || !title) return { ok: false, error: 'projectId dan title analisis STP wajib diisi.' };
  if (!Array.isArray(input.segments) || input.segments.length === 0) {
    return { ok: false, error: 'Minimal 1 segmen kebutuhan/geografi wajib diisi.' };
  }
  if (!Array.isArray(input.priorityTargets) || input.priorityTargets.length === 0) {
    return { ok: false, error: 'Minimal 1 target prioritas yang mampu dilayani wajib diisi.' };
  }
  if (!Array.isArray(input.exclusionRationale) || input.exclusionRationale.length === 0) {
    return { ok: false, error: 'Exclusion rationale (alasan segmen dikeluarkan) wajib diisi.' };
  }
  if (!positioning) {
    return { ok: false, error: 'Positioning statement wajib diisi.' };
  }

  return {
    ok: true,
    data: {
      projectId,
      title,
      segments: input.segments,
      priorityTargets: input.priorityTargets.map((s) => s.trim()).filter(Boolean),
      exclusionRationale: input.exclusionRationale.map((s) => s.trim()).filter(Boolean),
      positioningStatement: positioning,
      evidenceRefs: Array.isArray(input.evidenceRefs) ? input.evidenceRefs.map((s) => s.trim()).filter(Boolean) : [],
      featureId: 'F08',
      specialists: ['A14', 'A15'],
      reviewStatus: 'DRAFT',
      isAutomatedDecision: false,
    },
  };
}

export function validateAndBuildSwotAction(input: SwotActionInput): { ok: true; data: SwotActionRecord } | { ok: false; error: string } {
  const projectId = String(input.projectId || '').trim();
  const title = String(input.title || '').trim();
  if (!projectId || !title) return { ok: false, error: 'projectId dan title strategi wajib diisi.' };
  if (!Array.isArray(input.facts) || input.facts.length === 0) {
    return { ok: false, error: 'Daftar fakta terverifikasi wajib dipisahkan dan diisi (minimal 1).' };
  }
  if (!Array.isArray(input.assumptions) || input.assumptions.length === 0) {
    return { ok: false, error: 'Daftar asumsi/interpretasi wajib dipisahkan dan diisi (minimal 1).' };
  }
  if (!Array.isArray(input.actionPlan) || input.actionPlan.length === 0) {
    return { ok: false, error: 'Action plan eksperimen 30 hari wajib memiliki minimal 1 item.' };
  }
  for (const item of input.actionPlan) {
    if (!String(item.action || '').trim() || !String(item.pic || '').trim() || !String(item.metric || '').trim() || !String(item.period || '').trim()) {
      return { ok: false, error: 'Setiap item action plan wajib memiliki action, PIC, ukuran (metric), dan periode.' };
    }
  }

  return {
    ok: true,
    data: {
      ...input,
      projectId,
      title,
      featureId: 'F09',
      specialists: ['A12', 'A15'],
      separatedLayers: {
        factsCount: input.facts.length,
        assumptionsCount: input.assumptions.length,
        recommendationsCount: input.actionPlan.length,
      },
    },
  };
}

export function normalizeAndQuarantineListings(params: {
  projectId: string;
  listings: CompetitorListingInput[];
  now?: Date;
}): CompetitorWatchResult {
  const now = params.now || new Date();
  const seenUrls = new Set<string>();
  const seenFingerprints = new Set<string>();
  const activeListings: NormalizedCompetitorListing[] = [];
  const quarantinedListings: NormalizedCompetitorListing[] = [];

  for (const raw of params.listings) {
    const cleanUrl = String(raw.sourceUrl || '').trim();
    const cleanTitle = String(raw.title || '').trim();
    const ltM2 = Number(raw.ltM2) || 0;
    const lbM2 = Number(raw.lbM2) || 0;
    const priceIdr = Number(raw.priceIdr) || 0;
    const priceType: ListingPriceType = raw.priceType === 'TRANSACTION' ? 'TRANSACTION' : 'ASKING';
    const normalizedKey = `${cleanTitle.toLowerCase().replace(/\s+/g, ' ')}|${ltM2}|${lbM2}`;

    let quarantineReason: QuarantineReason | null = null;
    if (!/^https?:\/\//i.test(cleanUrl)) {
      quarantineReason = 'INVALID_SOURCE';
    } else if (raw.httpStatus === 404 || raw.httpStatus === 410) {
      quarantineReason = 'HTTP_404';
    } else if (seenUrls.has(cleanUrl.toLowerCase()) || seenFingerprints.has(normalizedKey)) {
      quarantineReason = 'DUPLICATE';
    } else {
      const listedDate = new Date(raw.listedAt);
      const expiredByDate = raw.expiresAt ? new Date(raw.expiresAt).getTime() < now.getTime() : false;
      const staleByAge = !Number.isNaN(listedDate.getTime())
        ? now.getTime() - listedDate.getTime() > 90 * 24 * 60 * 60 * 1000
        : true;
      if (expiredByDate || staleByAge) {
        quarantineReason = 'EXPIRED';
      }
    }

    if (cleanUrl) seenUrls.add(cleanUrl.toLowerCase());
    if (cleanTitle) seenFingerprints.add(normalizedKey);

    const item: NormalizedCompetitorListing = {
      ...raw,
      title: cleanTitle,
      sourceUrl: cleanUrl,
      ltM2,
      lbM2,
      priceIdr,
      priceType,
      buildStage: String(raw.buildStage || 'Ready / Tidak disebut').trim(),
      feesNote: raw.feesNote ? String(raw.feesNote).trim() : '',
      normalizedKey,
      pricePerSqmLand: ltM2 > 0 && priceIdr > 0 ? Math.round(priceIdr / ltM2) : null,
      pricePerSqmBuilding: lbM2 > 0 && priceIdr > 0 ? Math.round(priceIdr / lbM2) : null,
      priceClaimLabel:
        priceType === 'TRANSACTION'
          ? 'Harga Transaksi Terverifikasi'
          : 'Harga Minta / Penawaran (Bukan Transaksi)',
      quarantined: quarantineReason !== null,
      quarantineReason,
    };

    if (item.quarantined) {
      quarantinedListings.push(item);
    } else {
      activeListings.push(item);
    }
  }

  return {
    featureId: 'F10',
    specialists: ['A11', 'A13'],
    projectId: params.projectId,
    refreshedAt: now.toISOString(),
    activeListings,
    quarantinedListings,
    askingCount: activeListings.filter((l) => l.priceType === 'ASKING').length,
    transactionCount: activeListings.filter((l) => l.priceType === 'TRANSACTION').length,
    aicUnitsCharged: Math.max(1, Math.ceil(params.listings.length / 10)),
  };
}
