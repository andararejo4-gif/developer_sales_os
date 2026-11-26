// ============================================================================
// DEVELOPER SALES OS - FEFO AIC LEDGER & CALENDAR +3 MONTH ENGINE
// Covers Checklist: BIL-02, BIL-04, BIL-05, BIL-06, BIL-07, BIL-08, BIL-09, BIL-12, BIL-14
// ============================================================================

export type AicBucketSource = 'ONBOARDING_BOOTSTRAP' | 'PLAN_INCLUDED' | 'TOPUP_90D';

export interface AicBucket {
  id: string;
  source: AicBucketSource;
  grantedAic: number;
  remainingAic: number;
  reservedAic: number;
  createdAt: string;
  expiresAt: string; // ISO date YYYY-MM-DD or full ISO timestamp
}

export interface LedgerEntry {
  entryId: string;
  idempotencyKey: string;
  type: 'GRANT' | 'RESERVE' | 'SETTLE' | 'REFUND' | 'EXPIRE';
  bucketId: string;
  featureId: string;
  amountAic: number;
  createdAt: string;
  note?: string;
}

export interface FefoReservation {
  idempotencyKey: string;
  featureId: string;
  status: 'RESERVED' | 'SETTLED' | 'REFUNDED';
  allocations: Array<{ bucketId: string; amountAic: number }>;
  totalAic: number;
  createdAt: string;
}

/**
 * BIL-02: Hitung tanggal akhir siklus +N bulan kalender dengan clamp akhir bulan.
 * Contoh:
 * - 2026-11-20 + 3 bln -> 2027-02-20
 * - 2026-01-31 + 3 bln -> 2026-04-30
 * - 2025-11-30 + 3 bln -> 2026-02-28
 * - 2027-11-30 + 3 bln -> 2028-02-29 (kabisat)
 */
export function computeCalendarCycleEnd(startIsoDate: string, monthsToAdd = 3): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(startIsoDate.trim());
  if (!match) {
    throw new Error(`INVALID_DATE: Format tanggal harus YYYY-MM-DD, diterima: ${startIsoDate}`);
  }
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1; // 0-based
  const day = Number(match[3]);

  const totalMonths = monthIdx + monthsToAdd;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonthIdx = ((totalMonths % 12) + 12) % 12;

  // Hari terakhir di targetMonthIdx (day 0 of next month)
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonthIdx + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  const mm = String(targetMonthIdx + 1).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
}

/**
 * BIL-12: Evaluasi status langganan setelah cycleEnd (Grace 7 hari -> Read-Only Export 30 hari -> Archived)
 */
export type SubscriptionLifecycleState =
  | 'ACTIVE'
  | 'GRACE_7D'
  | 'READ_ONLY_EXPORT_30D'
  | 'ARCHIVED';

export function computeSubscriptionLifecycleState(
  cycleEndIsoDate: string,
  nowIsoDate: string
): { state: SubscriptionLifecycleState; daysPastEnd: number; canMutate: boolean; canExport: boolean } {
  const endMs = Date.parse(`${cycleEndIsoDate.slice(0, 10)}T23:59:59.999Z`);
  const nowMs = Date.parse(`${nowIsoDate.slice(0, 10)}T12:00:00.000Z`);
  const diffDays = Math.floor((nowMs - endMs) / 86_400_000);

  if (diffDays <= 0) {
    return { state: 'ACTIVE', daysPastEnd: 0, canMutate: true, canExport: true };
  }
  if (diffDays <= 7) {
    return { state: 'GRACE_7D', daysPastEnd: diffDays, canMutate: true, canExport: true };
  }
  if (diffDays <= 37) {
    return { state: 'READ_ONLY_EXPORT_30D', daysPastEnd: diffDays, canMutate: false, canExport: true };
  }
  return { state: 'ARCHIVED', daysPastEnd: diffDays, canMutate: false, canExport: false };
}

/**
 * BIL-04, BIL-05, BIL-07, BIL-14:
 * Ledger AIC FEFO atomik & idempoten.
 * - Bucket ONBOARDING_BOOTSTRAP terpisah dari PLAN_INCLUDED & TOPUP_90D.
 * - Pemotongan memakai bucket aktif yang paling cepat kedaluwarsa (FEFO).
 * - Operasi berulang dengan idempotencyKey sama tidak memotong dua kali.
 */
export class FefoAicLedger {
  private buckets: AicBucket[] = [];
  private entries: LedgerEntry[] = [];
  private reservations = new Map<string, FefoReservation>();

  constructor(initialBuckets: AicBucket[] = []) {
    this.buckets = initialBuckets.map((b) => ({ ...b }));
  }

  grantBucket(bucket: AicBucket, idempotencyKey: string): AicBucket {
    const existing = this.entries.find((e) => e.idempotencyKey === idempotencyKey && e.type === 'GRANT');
    if (existing) {
      return this.buckets.find((b) => b.id === existing.bucketId)!;
    }
    const copy = { ...bucket };
    this.buckets.push(copy);
    this.entries.push({
      entryId: `ent_${this.entries.length + 1}`,
      idempotencyKey,
      type: 'GRANT',
      bucketId: copy.id,
      featureId: 'SYSTEM_GRANT',
      amountAic: copy.grantedAic,
      createdAt: copy.createdAt,
    });
    return copy;
  }

  getAvailableAic(nowIso: string, options?: { excludeBootstrap?: boolean }): number {
    const nowMs = Date.parse(nowIso);
    return this.buckets
      .filter((b) => {
        if (options?.excludeBootstrap && b.source === 'ONBOARDING_BOOTSTRAP') return false;
        return Date.parse(b.expiresAt) >= nowMs;
      })
      .reduce((sum, b) => sum + Math.max(0, b.remainingAic - b.reservedAic), 0);
  }

  reserve(
    idempotencyKey: string,
    featureId: string,
    amountAic: number,
    nowIso: string,
    options?: { allowBootstrap?: boolean }
  ): FefoReservation {
    if (amountAic <= 0 || !Number.isInteger(amountAic)) {
      throw new Error('INVALID_AIC_AMOUNT: amountAic harus bilangan bulat positif.');
    }
    const existing = this.reservations.get(idempotencyKey);
    if (existing) {
      return existing;
    }

    const nowMs = Date.parse(nowIso);
    const eligible = this.buckets
      .filter((b) => {
        if (!options?.allowBootstrap && b.source === 'ONBOARDING_BOOTSTRAP') return false;
        return Date.parse(b.expiresAt) >= nowMs && b.remainingAic - b.reservedAic > 0;
      })
      .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));

    const totalAvail = eligible.reduce((s, b) => s + (b.remainingAic - b.reservedAic), 0);
    if (totalAvail < amountAic) {
      throw new Error(`INSUFFICIENT_AIC: Tersedia ${totalAvail} AIC, dibutuhkan ${amountAic} AIC.`);
    }

    let remainingNeed = amountAic;
    const allocations: Array<{ bucketId: string; amountAic: number }> = [];
    for (const bucket of eligible) {
      if (remainingNeed <= 0) break;
      const free = bucket.remainingAic - bucket.reservedAic;
      const take = Math.min(free, remainingNeed);
      bucket.reservedAic += take;
      remainingNeed -= take;
      allocations.push({ bucketId: bucket.id, amountAic: take });
      this.entries.push({
        entryId: `ent_${this.entries.length + 1}`,
        idempotencyKey: `${idempotencyKey}:${bucket.id}:RESERVE`,
        type: 'RESERVE',
        bucketId: bucket.id,
        featureId,
        amountAic: take,
        createdAt: nowIso,
      });
    }

    const reservation: FefoReservation = {
      idempotencyKey,
      featureId,
      status: 'RESERVED',
      allocations,
      totalAic: amountAic,
      createdAt: nowIso,
    };
    this.reservations.set(idempotencyKey, reservation);
    return reservation;
  }

  settle(idempotencyKey: string, settledAtIso: string): FefoReservation {
    const res = this.reservations.get(idempotencyKey);
    if (!res) throw new Error(`RESERVATION_NOT_FOUND: ${idempotencyKey}`);
    if (res.status === 'SETTLED') return res; // BIL-14 idempoten
    if (res.status === 'REFUNDED') throw new Error('CANNOT_SETTLE_REFUNDED_RESERVATION');

    for (const alloc of res.allocations) {
      const bucket = this.buckets.find((b) => b.id === alloc.bucketId);
      if (!bucket) continue;
      bucket.reservedAic = Math.max(0, bucket.reservedAic - alloc.amountAic);
      bucket.remainingAic = Math.max(0, bucket.remainingAic - alloc.amountAic);
      this.entries.push({
        entryId: `ent_${this.entries.length + 1}`,
        idempotencyKey: `${idempotencyKey}:${bucket.id}:SETTLE`,
        type: 'SETTLE',
        bucketId: bucket.id,
        featureId: res.featureId,
        amountAic: alloc.amountAic,
        createdAt: settledAtIso,
      });
    }
    res.status = 'SETTLED';
    return res;
  }

  refund(idempotencyKey: string, refundedAtIso: string, reason = 'JOB_FAILED'): FefoReservation {
    const res = this.reservations.get(idempotencyKey);
    if (!res) throw new Error(`RESERVATION_NOT_FOUND: ${idempotencyKey}`);
    if (res.status === 'REFUNDED') return res; // BIL-14 idempoten
    if (res.status === 'SETTLED') throw new Error('CANNOT_REFUND_SETTLED_RESERVATION');

    for (const alloc of res.allocations) {
      const bucket = this.buckets.find((b) => b.id === alloc.bucketId);
      if (!bucket) continue;
      bucket.reservedAic = Math.max(0, bucket.reservedAic - alloc.amountAic);
      this.entries.push({
        entryId: `ent_${this.entries.length + 1}`,
        idempotencyKey: `${idempotencyKey}:${bucket.id}:REFUND`,
        type: 'REFUND',
        bucketId: bucket.id,
        featureId: res.featureId,
        amountAic: alloc.amountAic,
        createdAt: refundedAtIso,
        note: reason,
      });
    }
    res.status = 'REFUNDED';
    return res;
  }

  getSnapshot(): { buckets: AicBucket[]; entries: LedgerEntry[] } {
    return {
      buckets: this.buckets.map((b) => ({ ...b })),
      entries: [...this.entries],
    };
  }
}

/**
 * BIL-06, BIL-08, BIL-09: Ops Hours Pool (2/6/16 jam) & Capacity Pass 30 hari
 */
export interface CapacityPassGrant {
  id: string;
  resourceType: 'users' | 'projects' | 'contacts';
  extraAmount: number;
  expiresAt: string;
}

export function getEffectiveLimitWithPasses(
  baseLimit: number,
  passes: CapacityPassGrant[],
  resourceType: CapacityPassGrant['resourceType'],
  nowIso: string
): number {
  const nowMs = Date.parse(nowIso);
  const activeBonus = passes
    .filter((p) => p.resourceType === resourceType && Date.parse(p.expiresAt) >= nowMs)
    .reduce((sum, p) => sum + p.extraAmount, 0);
  return baseLimit + activeBonus;
}
