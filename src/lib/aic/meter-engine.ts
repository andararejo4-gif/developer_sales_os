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
  F12: 500, // Riset pasar paket lengkap
  F13: 400, // Generator 99 keunggulan
  F14: 100, // Surat cinta & pitch generator
  F19: 450, // Kalender konten 30 hari (1 run)
  F25: 75,  // Poster & visual marketing generator
  F31: 300, // Generator website proyek
  F49: 1,   // AI Sales Concierge per chat
  F61: 30,  // Rute harian SE (per SE per hari <= 5 titik)
  F64: 400, // Playbook generator
  F68: 10,  // Kalkulasi & quote generator
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
