/**
 * Kontrak Fondasi Arsitektur R3 (Platinum) & R4 (Diamond)
 * Developer Sales OS · PT Andara Rejo Makmur
 * 
 * Fondasi siap pakai untuk integrasi API pihak ketiga & sinkronisasi database masa depan:
 * - F75: Bank submission & SP3K tracking workflow
 * - F70: Discount & payment approval matrix (SE -> SM -> Direksi)
 * - F77: Payment reconciliation & reminder schedule
 * - F83: Open house & cluster event management
 * - F88: Sell-through & revenue cashflow forecast
 * - F90: Executive portfolio control tower (Multi-project overview)
 * - F94: Official ERP / Webhook adapter contract
 */

export type BankSubmissionStatus =
  | 'DOKUMEN_LENGKAP'
  | 'SUBMITTED_TO_BANK'
  | 'SLIK_BI_CHECKING'
  | 'APPRAISAL_JAMINAN'
  | 'ANALISA_KOMITE'
  | 'SP3K_TERBIT'
  | 'AKAD_KREDIT'
  | 'DITOLAK_BANK';

export interface BankApplicationRecord {
  id: string;
  applicantName: string;
  applicantPhone: string;
  unitCode: string;
  cluster: string;
  targetBank: 'Bank BSI' | 'Bank BTN' | 'Bank Mandiri' | 'Bank BRI';
  plafondAmount: number;
  submissionDate: string;
  status: BankSubmissionStatus;
  statusNotes: string;
  assignedAnalyst?: string;
  sp3kExpiryDate?: string;
}

export interface DiscountApprovalRequest {
  id: string;
  unitCode: string;
  consumerName: string;
  requestedBySe: string;
  standardPrice: number;
  discountRequested: number;
  proposedPrice: number;
  reason: string;
  status: 'PENDING_SM' | 'PENDING_DIREKSI' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
}

export interface OpenHouseEventRecord {
  id: string;
  eventName: string;
  date: string;
  location: string;
  targetAttendees: number;
  registeredAttendees: number;
  actualVisited: number;
  onTheSpotBooking: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
}

export interface PortfolioForecastItem {
  projectId: string;
  projectName: string;
  totalUnits: number;
  soldUnits: number;
  targetClosingMonth: number;
  projectedRevenueMonth: number;
  cancellationRiskPercent: number;
  clusterHealth: 'EXCELLENT' | 'STABLE' | 'NEEDS_ATTENTION';
}

/**
 * Adapter Interface untuk Integrasi API Perbankan & ERP Masa Depan (F94 / F75)
 * Saat API bank/database pihak ketiga siap, adapter ini tinggal disambungkan.
 */
export interface ExternalBankingAdapter {
  submitMortgageApplication(payload: Omit<BankApplicationRecord, 'id' | 'status'>): Promise<{ applicationId: string; status: BankSubmissionStatus }>;
  checkSlikCreditScore(nik: string): Promise<{ score: number; status: 'CLEAR' | 'ATTENTION' | 'DEFAULT' }>;
  fetchSp3kDocument(applicationId: string): Promise<{ sp3kUrl: string; validUntil: string }>;
}

export interface ErpWebhookSyncAdapter {
  syncBookingToErp(bookingId: string): Promise<{ erpSyncId: string; syncedAt: string }>;
  fetchPaymentMutations(accountNo: string): Promise<Array<{ trxId: string; amount: number; date: string; ref: string }>>;
}
