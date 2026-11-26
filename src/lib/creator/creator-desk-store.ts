/**
 * Store & Kalkulator Paket 1 + Paket 2 Program Kreator (Clipper, Live, KOL)
 * Mengikuti Adendum Master Blueprint ARM-DSOS-CLK-TPTH-2026-02.
 */

export type CreatorRoleType = 'AFILIATOR_CLIPPER' | 'AFILIATOR_LIVE' | 'AFILIATOR_KOL';
export type CreatorTier = 'KANDIDAT' | 'AKTIF' | 'TERSERTIFIKASI' | 'PREFERRED' | 'MENTOR';
export type ContentSubmissionType = 'KLIP' | 'LIVE' | 'KOL';
export type AuditStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
export type LedgerStatus = 'ESTIMATE' | 'PENDING' | 'ACCRUED' | 'ON_HOLD' | 'APPROVED' | 'PAID' | 'REVERSED';

export interface CreatorProfile {
  id: string;
  creatorCode: string;
  fullName: string;
  roleType: CreatorRoleType;
  platform: string;
  socialHandle: string;
  phoneWa: string;
  kycStatus: 'PENDING' | 'TERVERIFIKASI' | 'DITOLAK';
  tier: CreatorTier;
  integrityScore: number;
  monthlyCapIdr: number;
  status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED';
  createdAt: string;
}

export interface CreatorContentMetric {
  id: string;
  creatorCode: string;
  contentCode: string;
  contentType: ContentSubmissionType;
  platform: string;
  contentUrl: string;
  rawViews: number;
  verifiedViews: number;
  sessionMinutes: number;
  flatFeeIdr: number;
  auditStatus: AuditStatus;
  auditNotes: string;
  grossAmountIdr: number;
  cappedAmountIdr: number;
  lockAt: string;
  verifiedBy?: string;
  createdAt: string;
}

export interface CreatorLedgerEntry {
  id: string;
  creatorCode: string;
  pocket: 'A' | 'B';
  entryType: 'CPM' | 'LIVE_FEE' | 'KOL_FLAT' | 'QL_BONUS' | 'VISIT_BONUS' | 'SOURCE_FEE' | 'ASSIST_FEE';
  referenceId: string;
  description: string;
  grossAmountIdr: number;
  taxPphIdr: number;
  netAmountIdr: number;
  status: LedgerStatus;
  approvedBy?: string;
  createdAt: string;
}

export const CREATOR_TARIFF_DEFAULTS = {
  clipperCpmIdr: 3000,
  clipperMinViews: 1000,
  clipperMaxPerClipIdr: 300000,
  liveRatePerHourIdr: 100000,
  liveMinMinutes: 60,
  liveMaxMinutesPerSession: 120,
  pph21EffectiveRate: 0.025, // 5% x 50% bruto (usulan PMK 168/2023; wajib konfirmasi pajak)
};

/**
 * Hitung imbalan Kantong A (berpagu) untuk satu karya Clipper, Live, atau KOL.
 */
export function calculateKantongAAmount(params: {
  contentType: ContentSubmissionType;
  verifiedViews: number;
  sessionMinutes: number;
  flatFeeIdr?: number;
}): { grossIdr: number; cappedIdr: number; entryType: 'CPM' | 'LIVE_FEE' | 'KOL_FLAT'; note: string } {
  if (params.contentType === 'KLIP') {
    const views = Math.max(0, Math.floor(params.verifiedViews));
    if (views < CREATOR_TARIFF_DEFAULTS.clipperMinViews) {
      return {
        grossIdr: 0,
        cappedIdr: 0,
        entryType: 'CPM',
        note: `Di bawah minimum ${CREATOR_TARIFF_DEFAULTS.clipperMinViews.toLocaleString('id-ID')} view sah`,
      };
    }
    const grossIdr = Math.round((views / 1000) * CREATOR_TARIFF_DEFAULTS.clipperCpmIdr);
    const cappedIdr = Math.min(grossIdr, CREATOR_TARIFF_DEFAULTS.clipperMaxPerClipIdr);
    return {
      grossIdr,
      cappedIdr,
      entryType: 'CPM',
      note: grossIdr > cappedIdr ? 'Terkena pagu maksimal Rp300.000/klip' : 'Sesuai tarif Rp3.000/1.000 view sah',
    };
  }

  if (params.contentType === 'LIVE') {
    const mins = Math.max(0, Math.floor(params.sessionMinutes));
    if (mins < CREATOR_TARIFF_DEFAULTS.liveMinMinutes) {
      return {
        grossIdr: 0,
        cappedIdr: 0,
        entryType: 'LIVE_FEE',
        note: `Durasi < ${CREATOR_TARIFF_DEFAULTS.liveMinMinutes} menit (tidak sah dibayar)`,
      };
    }
    const billableMins = Math.min(mins, CREATOR_TARIFF_DEFAULTS.liveMaxMinutesPerSession);
    const grossIdr = Math.round((mins / 60) * CREATOR_TARIFF_DEFAULTS.liveRatePerHourIdr);
    const cappedIdr = Math.round((billableMins / 60) * CREATOR_TARIFF_DEFAULTS.liveRatePerHourIdr);
    return {
      grossIdr,
      cappedIdr,
      entryType: 'LIVE_FEE',
      note: mins > billableMins ? 'Dibatasi maksimal 120 menit per sesi' : 'Sesi live sah',
    };
  }

  const flat = Math.max(0, Math.round(params.flatFeeIdr || 0));
  return {
    grossIdr: flat,
    cappedIdr: flat,
    entryType: 'KOL_FLAT',
    note: 'Flat fee kontrak KOL',
  };
}

export function calculatePph21Estimate(grossIdr: number): { taxIdr: number; netIdr: number } {
  const taxIdr = Math.round(Math.max(0, grossIdr) * CREATOR_TARIFF_DEFAULTS.pph21EffectiveRate);
  return { taxIdr, netIdr: Math.max(0, grossIdr - taxIdr) };
}

export function buildCreatorSmartLink(params: {
  origin: string;
  slug: string;
  creatorCode: string;
  contentCode?: string;
  persona?: string;
}): string {
  const base = `${params.origin}/site/${encodeURIComponent(params.slug)}`;
  const qs = new URLSearchParams();
  if (params.persona) qs.set('p', params.persona);
  if (params.creatorCode) qs.set('k', params.creatorCode.trim().toUpperCase());
  if (params.contentCode) qs.set('c', params.contentCode.trim());
  const query = qs.toString();
  return query ? `${base}?${query}` : base;
}

export const INITIAL_DEMO_CREATORS: CreatorProfile[] = [
  {
    id: 'cr-1',
    creatorCode: 'AC-RN27',
    fullName: 'Rina Kusuma',
    roleType: 'AFILIATOR_CLIPPER',
    platform: 'TikTok',
    socialHandle: '@rinakusuma.home',
    phoneWa: '+6281234560011',
    kycStatus: 'TERVERIFIKASI',
    tier: 'AKTIF',
    integrityScore: 94,
    monthlyCapIdr: 3000000,
    status: 'ACTIVE',
    createdAt: '2026-11-26',
  },
  {
    id: 'cr-2',
    creatorCode: 'AL-DM04',
    fullName: 'Dimas Pratama',
    roleType: 'AFILIATOR_LIVE',
    platform: 'TikTok Live',
    socialHandle: '@dimas.propertisolo',
    phoneWa: '+6281234560022',
    kycStatus: 'TERVERIFIKASI',
    tier: 'TERSERTIFIKASI',
    integrityScore: 96,
    monthlyCapIdr: 5000000,
    status: 'ACTIVE',
    createdAt: '2026-11-26',
  },
  {
    id: 'cr-3',
    creatorCode: 'AK-SR11',
    fullName: 'Sari Wulandari',
    roleType: 'AFILIATOR_KOL',
    platform: 'Instagram',
    socialHandle: '@sari.keluargasolo',
    phoneWa: '+6281234560033',
    kycStatus: 'TERVERIFIKASI',
    tier: 'AKTIF',
    integrityScore: 92,
    monthlyCapIdr: 5000000,
    status: 'ACTIVE',
    createdAt: '2026-11-26',
  },
];
