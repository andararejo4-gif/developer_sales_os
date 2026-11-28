// ============================================================================
// DEVELOPER SALES OS - MESIN FINOPS AIC METERING (Blueprint v1.2 Bab 12 & Bagian 4.C)
// Siklus Transaksi: Cost Preview -> Reserve -> Receipt (Settle) -> Refund bila gagal
// First-Expired First-Out (FEFO) pemotongan saldo.
// Saldo habis = hanya job generatif yang antre; CRM, presensi, GPS, web tetap jalan.
// ============================================================================

export interface AicWallet {
  id: string;
  tenant_id: string;
  plan_code: 'gold' | 'platinum' | 'diamond';
  total_aic_granted: number;
  balance_aic: number; // Saldo yang dapat dipakai
  reserved_aic: number; // Saldo yang sedang ditahan untuk job berjalan
  valid_until: string; // ISO Date (3 bulan kalender)
}

export interface AicCostPreview {
  featureId: string;
  featureName: string;
  estimatedAic: number;
  currentBalance: number;
  isAffordable: boolean;
  limiterNotice?: string;
}

export interface AicReservation {
  reservationId: string;
  tenantId: string;
  featureId: string;
  jobType: string;
  amountAic: number;
  status: 'RESERVED' | 'SETTLED' | 'REFUNDED';
  createdAt: string;
}

export interface AicReceipt {
  receiptId: string;
  reservationId: string;
  tenantId: string;
  featureId: string;
  debitedAic: number;
  tokensUsed: number;
  remainingBalance: number;
  settledAt: string;
}

// Biaya baku satuan AIC dari Blueprint v1.2 Bab 07 & Bab 12
export const STANDARD_AIC_RATES: Record<string, number> = {
  F08: 120, // Analisis STP & positioning (1 analisis STP)
  F09: 150, // Strategi 7P, SWOT, TOWS & action plan 30 hari
  F10: 150, // Competitor & listing watch (per 10 listing/refresh)
  F12: 500, // Riset pasar paket lengkap
  F13: 400, // Generator 99 keunggulan
  F14: 100, // Surat cinta & pitch generator
  F16: 120, // Elevator pitch & objection kit (1 kit / 20 keberatan)
  F17: 40,  // Persona-to-unit value matching (20 rekomendasi)
  F19: 450, // Kalender konten 30 hari (1 run)
  F22: 30,  // Approval & publishing queue (30 publish jobs)
  F23: 120, // Content attribution & learning (1 laporan 30 hari)
  F24: 80,  // Asset rights & content retirement (100 aset)
  F25: 75,  // Poster & visual marketing generator
  F26: 150, // Video template & subtitle (<=30 detik)
  F28: 50,  // Voiceover & localization (1 menit)
  F29: 100, // Brand kit & creative QA (20 aset)
  F30: 500, // Bulk personalized creative API (100 aset template)
  F31: 300, // Generator website proyek
  F34: 200, // Local SEO & profile workflow (bulanan)
  F35: 150, // CRO, accessibility & experiments (2 varian)
  F36: 300, // Multi-project template & web API (10 situs)
  F37: 200, // Acquisition plan & budget simulator (1 rencana 30 hari)
  F38: 200, // Official ad campaign launcher (1 kampanye/3 ad sets)
  F39: 30,  // Bid, creative & pacing optimizer (1 akun/hari)
  F40: 150, // Search demand & intent capture (100 keyword/cluster)
  F41: 80,  // Retargeting & suppression (1 audience/refresh)
  F42: 300, // Portfolio budget allocation (10 proyek/simulasi)
  F44: 40,  // Deduplication & identity merge (100 record)
  F45: 2,   // BANT & fit qualification (1 lead/4 dimensi)
  F46: 20,  // Ownership, round-robin & SLA (100 assignment)
  F49: 1,   // AI Sales Concierge per chat
  F53: 100, // Quality scoring & coaching (20 percakapan diaudit)
  F54: 50,  // Opt-in AI voice qualifier (1 menit AI; telko terpisah)
  F58: 20,  // Reminder, no-show & reschedule (20 reminder)
  F59: 50,  // Virtual tour session coordinator (1 sesi/pack)
  F60: 150, // Lifecycle reactivation experiment (100 lead/cohort)
  F61: 30,  // Rute harian SE (per SE per hari <= 5 titik)
  F63: 40,  // Check-in & field evidence (20 check-in diringkas)
  F64: 400, // Playbook generator
  F65: 50,  // Role-play & product certification (<=10 menit teks)
  F68: 10,  // Kalkulasi & quote generator
  F70: 20,  // Discount & margin approval (1 proposal diskon)
  F71: 30,  // Booking hold & confirmation (1 booking case)
  F72: 200, // Portfolio inventory optimization
  F73: 20,  // KPR readiness checklist
  F76: 100, // Legal milestone & contract assembly
  F77: 80,  // Payment reconciliation & reminders
  F78: 100, // Closing risk & cancellation rescue
  F81: 50,  // Commission accrual & dispute log
  F82: 150, // Corporate & institution outreach
  F83: 200, // Open house & event operations
  F84: 120, // Channel partner performance
  F87: 200, // Attribution & incrementality analyst
  F88: 300, // Revenue, cash & sell-through forecast
  F89: 100, // BAST, DLP & referral lifecycle
  F94: 150, // Official API connectors & ERP sync
  F95: 300, // Agent evaluation & workflow builder
  F96: 300, // Enterprise SSO, BYOK & data boundary
  F100: 5,  // AI Guide per aktivitas SE (Platinum & Diamond)
  DEFAULT_JOB: 50
};

/**
 * 1. COST PREVIEW: Tampilkan perkiraan biaya sebelum job dijalankan
 */
export function getCostPreview(
  wallet: AicWallet,
  featureId: string,
  featureName: string,
  customUnits: number = 1
): AicCostPreview {
  const baseRate = STANDARD_AIC_RATES[featureId] || STANDARD_AIC_RATES.DEFAULT_JOB;
  const estimatedAic = baseRate * customUnits;
  const availableBalance = wallet.balance_aic - wallet.reserved_aic;
  const isAffordable = availableBalance >= estimatedAic;

  return {
    featureId,
    featureName,
    estimatedAic,
    currentBalance: availableBalance,
    isAffordable,
    limiterNotice: !isAffordable 
      ? `Saldo AIC tidak mencukupi (${availableBalance} AIC tersedia, dibutuhkan ${estimatedAic} AIC). Silakan top-up AI Booster atau AI Turbo.`
      : undefined
  };
}

/**
 * 2. RESERVE: Cadangkan kredit AIC saat job dimulai
 */
export function reserveAic(
  wallet: AicWallet,
  featureId: string,
  jobType: string,
  amountAic: number
): { wallet: AicWallet; reservation: AicReservation } {
  const available = wallet.balance_aic - wallet.reserved_aic;
  if (available < amountAic) {
    throw new Error(
      `INSUFFICIENT_AIC: Saldo tidak mencukupi untuk mencadangkan ${amountAic} AIC. Tersedia: ${available} AIC.`
    );
  }

  const updatedWallet: AicWallet = {
    ...wallet,
    reserved_aic: wallet.reserved_aic + amountAic
  };

  const reservation: AicReservation = {
    reservationId: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: wallet.tenant_id,
    featureId,
    jobType,
    amountAic,
    status: 'RESERVED',
    createdAt: new Date().toISOString()
  };

  return { wallet: updatedWallet, reservation };
}

/**
 * 3. RECEIPT (SETTLE): Potong saldo definitif setelah keluaran tervalidasi
 */
export function settleAicReservation(
  wallet: AicWallet,
  reservation: AicReservation,
  tokensUsed: number = 0
): { wallet: AicWallet; receipt: AicReceipt } {
  if (reservation.status !== 'RESERVED') {
    throw new Error(`Reservation status is already ${reservation.status}, cannot settle.`);
  }

  const updatedWallet: AicWallet = {
    ...wallet,
    balance_aic: Math.max(0, wallet.balance_aic - reservation.amountAic),
    reserved_aic: Math.max(0, wallet.reserved_aic - reservation.amountAic)
  };

  const receipt: AicReceipt = {
    receiptId: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    reservationId: reservation.reservationId,
    tenantId: wallet.tenant_id,
    featureId: reservation.featureId,
    debitedAic: reservation.amountAic,
    tokensUsed,
    remainingBalance: updatedWallet.balance_aic,
    settledAt: new Date().toISOString()
  };

  return { wallet: updatedWallet, receipt };
}

/**
 * 4. REFUND: Rilis reservasi saldo jika job gagal
 */
export function refundAicReservation(
  wallet: AicWallet,
  reservation: AicReservation,
  _failureReason?: string
): { wallet: AicWallet; reservation: AicReservation } {
  if (reservation.status !== 'RESERVED') {
    return { wallet, reservation };
  }

  const updatedWallet: AicWallet = {
    ...wallet,
    reserved_aic: Math.max(0, wallet.reserved_aic - reservation.amountAic)
  };

  const updatedReservation: AicReservation = {
    ...reservation,
    status: 'REFUNDED'
  };

  return { wallet: updatedWallet, reservation: updatedReservation };
}

/**
 * Aturan Keras Blueprint v1.2:
 * Saat AIC habis, hanya job generatif yang antre.
 * Fitur non-generatif (Presensi F97, GPS F98, Call Log F99, Inbound CRM capture, consent, web view)
 * TETAP AKTIF 100% dan tidak boleh diblokir.
 */
export function isOperationAllowedWithZeroAic(featureId: string): boolean {
  const nonGenerativeAllowed = ['F43', 'F44', 'F45', 'F46', 'F47', 'F48', 'F91', 'F92', 'F93', 'F97', 'F98', 'F99'];
  return nonGenerativeAllowed.includes(featureId);
}
