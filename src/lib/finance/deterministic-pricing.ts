// ============================================================================
// DEVELOPER SALES OS - DETERMINISTIC FINANCE & PRICING ENGINE
// Covers Checklist: F02, F68, F69, F70, DAT-03
// Zero floating-point drift on Rupiah amounts; strict unknown-field rejection.
// ============================================================================

export type PaymentScheme = 'CK' | 'CT12' | 'CT24' | 'KPR';

export interface QuoteCalculationInput {
  unitCode: string;
  basePriceIdr: number;
  discountIdr?: number;
  bookingFeeIdr: number;
  scheme: PaymentScheme;
  dpPercent?: number; // Default 10 for KPR, 20 for CT
  kprTenorMonths?: number; // e.g., 120, 180, 240
  kprAnnualRatePercent?: number; // e.g., 6.5
  includePpnPercent?: number; // e.g., 11 or 0
  validUntilIso: string;
  nowIso?: string;
}

export interface QuoteCalculationResult {
  unitCode: string;
  scheme: PaymentScheme;
  basePriceIdr: number;
  discountIdr: number;
  netPriceIdr: number;
  ppnIdr: number;
  totalContractIdr: number;
  bookingFeeIdr: number;
  dpTotalIdr: number;
  dpRemainingAfterBookingIdr: number;
  financedPrincipalIdr: number;
  installmentCount: number;
  monthlyInstallmentIdr: number;
  validUntilIso: string;
}

const ALLOWED_INPUT_KEYS = new Set([
  'unitCode',
  'basePriceIdr',
  'discountIdr',
  'bookingFeeIdr',
  'scheme',
  'dpPercent',
  'kprTenorMonths',
  'kprAnnualRatePercent',
  'includePpnPercent',
  'validUntilIso',
  'nowIso',
]);

function assertSafePositiveInt(val: number, field: string, allowZero = false): number {
  if (!Number.isFinite(val) || !Number.isInteger(val)) {
    throw new Error(`INVALID_FINANCE_INT: ${field} harus bilangan bulat Rupiah.`);
  }
  if (allowZero ? val < 0 : val <= 0) {
    throw new Error(`INVALID_FINANCE_RANGE: ${field} tidak valid (${val}).`);
  }
  return val;
}

/**
 * F68: Validasi ketat input kalkulasi harga (tolak field tak dikenal & quote kedaluwarsa)
 */
export function validateQuoteInput(raw: Record<string, unknown>): QuoteCalculationInput {
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_INPUT_KEYS.has(key)) {
      throw new Error(`UNKNOWN_FIELD_REJECTED: Field '${key}' tidak diizinkan pada kalkulasi harga.`);
    }
  }
  const input = raw as unknown as QuoteCalculationInput;
  if (!input.unitCode || typeof input.unitCode !== 'string') {
    throw new Error('INVALID_UNIT_CODE');
  }
  assertSafePositiveInt(input.basePriceIdr, 'basePriceIdr', false);
  assertSafePositiveInt(input.discountIdr ?? 0, 'discountIdr', true);
  assertSafePositiveInt(input.bookingFeeIdr, 'bookingFeeIdr', true);

  if (!['CK', 'CT12', 'CT24', 'KPR'].includes(input.scheme)) {
    throw new Error(`INVALID_SCHEME: ${String(input.scheme)}`);
  }

  const nowMs = Date.parse(input.nowIso || new Date().toISOString());
  const validMs = Date.parse(input.validUntilIso);
  if (!Number.isFinite(validMs) || validMs < nowMs) {
    throw new Error('QUOTE_EXPIRED: Masa berlaku penawaran harga sudah habis.');
  }

  return input;
}

/**
 * DAT-03 / F69 / F70: Kalkulasi deterministik CK / CT12 / CT24 / KPR
 */
export function calculateDeterministicQuote(rawInput: Record<string, unknown>): QuoteCalculationResult {
  const input = validateQuoteInput(rawInput);
  const discountIdr = input.discountIdr ?? 0;
  if (discountIdr >= input.basePriceIdr) {
    throw new Error('INVALID_DISCOUNT: Diskon tidak boleh >= harga dasar.');
  }

  const netPriceIdr = input.basePriceIdr - discountIdr;
  const ppnPercent = input.includePpnPercent ?? 0;
  const ppnIdr = Math.round((netPriceIdr * ppnPercent) / 100);
  const totalContractIdr = netPriceIdr + ppnIdr;

  if (input.bookingFeeIdr > totalContractIdr) {
    throw new Error('INVALID_BOOKING_FEE: Booking fee melebihi total harga.');
  }

  if (input.scheme === 'CK') {
    return {
      unitCode: input.unitCode,
      scheme: 'CK',
      basePriceIdr: input.basePriceIdr,
      discountIdr,
      netPriceIdr,
      ppnIdr,
      totalContractIdr,
      bookingFeeIdr: input.bookingFeeIdr,
      dpTotalIdr: totalContractIdr,
      dpRemainingAfterBookingIdr: totalContractIdr - input.bookingFeeIdr,
      financedPrincipalIdr: 0,
      installmentCount: 1,
      monthlyInstallmentIdr: totalContractIdr - input.bookingFeeIdr,
      validUntilIso: input.validUntilIso,
    };
  }

  if (input.scheme === 'CT12' || input.scheme === 'CT24') {
    const months = input.scheme === 'CT12' ? 12 : 24;
    const dpPercent = input.dpPercent ?? 20;
    const dpTotalIdr = Math.round((totalContractIdr * dpPercent) / 100);
    const dpRemainingAfterBookingIdr = Math.max(0, dpTotalIdr - input.bookingFeeIdr);
    const financedPrincipalIdr = totalContractIdr - Math.max(dpTotalIdr, input.bookingFeeIdr);
    const monthlyInstallmentIdr = Math.ceil(financedPrincipalIdr / months);

    return {
      unitCode: input.unitCode,
      scheme: input.scheme,
      basePriceIdr: input.basePriceIdr,
      discountIdr,
      netPriceIdr,
      ppnIdr,
      totalContractIdr,
      bookingFeeIdr: input.bookingFeeIdr,
      dpTotalIdr,
      dpRemainingAfterBookingIdr,
      financedPrincipalIdr,
      installmentCount: months,
      monthlyInstallmentIdr,
      validUntilIso: input.validUntilIso,
    };
  }

  // KPR Anuitas Deterministik
  const tenorMonths = input.kprTenorMonths ?? 180;
  const annualRate = input.kprAnnualRatePercent ?? 6.5;
  const dpPercent = input.dpPercent ?? 10;
  if (tenorMonths <= 0 || !Number.isInteger(tenorMonths)) {
    throw new Error('INVALID_KPR_TENOR');
  }

  const dpTotalIdr = Math.round((totalContractIdr * dpPercent) / 100);
  const dpRemainingAfterBookingIdr = Math.max(0, dpTotalIdr - input.bookingFeeIdr);
  const financedPrincipalIdr = totalContractIdr - Math.max(dpTotalIdr, input.bookingFeeIdr);

  const monthlyRate = annualRate / 100 / 12;
  let monthlyInstallmentIdr = 0;
  if (monthlyRate === 0) {
    monthlyInstallmentIdr = Math.ceil(financedPrincipalIdr / tenorMonths);
  } else {
    const factor = Math.pow(1 + monthlyRate, tenorMonths);
    monthlyInstallmentIdr = Math.round((financedPrincipalIdr * (monthlyRate * factor)) / (factor - 1));
  }

  return {
    unitCode: input.unitCode,
    scheme: 'KPR',
    basePriceIdr: input.basePriceIdr,
    discountIdr,
    netPriceIdr,
    ppnIdr,
    totalContractIdr,
    bookingFeeIdr: input.bookingFeeIdr,
    dpTotalIdr,
    dpRemainingAfterBookingIdr,
    financedPrincipalIdr,
    installmentCount: tenorMonths,
    monthlyInstallmentIdr,
    validUntilIso: input.validUntilIso,
  };
}
