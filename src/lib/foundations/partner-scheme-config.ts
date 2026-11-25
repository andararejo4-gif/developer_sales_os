/**
 * Kontrak Konfigurasi Kustomisasi Skema Mitra (Referral & Sales Partner)
 * Berdasarkan Master Blueprint Sistem Manajemen Mitra & Rekanan Nasional v1.0
 * PT Andara Rejo Makmur - Developer Sales OS
 */

export interface ReferralTierConfig {
  feeType: 'FIXED' | 'PERCENTAGE';
  defaultAmount: number; // e.g. Rp 5.000.000 atau persen
  minFee: number;
  maxFee: number;
  description: string;
  autoApprovePayoutThreshold: number; // e.g. nominal di bawah ini bisa diautomasikan bila audit lolos
}

export interface SalesPartnerTierConfig {
  commissionPercent: number; // default 2.0%
  inhouseOverridePercent: number; // default 0.5% (override insentif inhouse)
  slaFirstResponseMinutes: number; // SLA respon lead (default 15 menit)
  claimWindowDays: number; // Masa klaim atribusi (default 30 hari)
  milestones: {
    m1BookingPercent: number; // e.g. 30%
    m2AkadPercent: number;    // e.g. 50%
    m3BastPercent: number;    // e.g. 20%
  };
  gamificationTiers: {
    name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    minDeals: number;
    bonusMultiplierPercent: number; // 0%, 10%, 20%, 30%
  }[];
}

export interface PartnerSchemeCustomConfig {
  projectId: string;
  projectName: string;
  updatedAt: string;
  referralPartner: ReferralTierConfig;
  salesPartner: SalesPartnerTierConfig;
  antiConflictGuard: {
    inhouseProtectionWindowDays: number; // Prospek inhouse terlindungi dari klaim mitra selama X hari
    autoTakeoverOnSlaBreach: boolean;
    requireConsentProof: boolean; // Kepatuhan UU PDP
  };
}

export const DEFAULT_PARTNER_CONFIG: PartnerSchemeCustomConfig = {
  projectId: 'the-park-sukoharjo',
  projectName: 'The Park Townhouse Sukoharjo',
  updatedAt: new Date().toISOString(),
  referralPartner: {
    feeType: 'FIXED',
    defaultAmount: 5000000,
    minFee: 2500000,
    maxFee: 5000000,
    description: 'Ringan, hanya share link/QR/form consent, tanpa urusan teknis KPR/closing.',
    autoApprovePayoutThreshold: 5000000,
  },
  salesPartner: {
    commissionPercent: 2.0,
    inhouseOverridePercent: 0.5,
    slaFirstResponseMinutes: 15,
    claimWindowDays: 30,
    milestones: {
      m1BookingPercent: 30,
      m2AkadPercent: 50,
      m3BastPercent: 20,
    },
    gamificationTiers: [
      { name: 'Bronze', minDeals: 0, bonusMultiplierPercent: 0 },
      { name: 'Silver', minDeals: 3, bonusMultiplierPercent: 10 },
      { name: 'Gold', minDeals: 6, bonusMultiplierPercent: 20 },
      { name: 'Platinum', minDeals: 10, bonusMultiplierPercent: 30 },
    ],
  },
  antiConflictGuard: {
    inhouseProtectionWindowDays: 30,
    autoTakeoverOnSlaBreach: true,
    requireConsentProof: true,
  },
};
