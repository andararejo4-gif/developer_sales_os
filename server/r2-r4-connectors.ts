// ============================================================================
// R2-R4 OFFICIAL CONNECTOR ADAPTERS (INT-I05 .. INT-I15)
// Social, Ads, Calendar, PBX/VoIP, Email/Push, Billing PSP, Bank Recon,
// ERP/Finance, E-Sign, Enterprise SSO/SCIM/BYOK, AI Voice/Telco
// ============================================================================

export type ExtendedConnectorId =
  | 'I05' | 'I06' | 'I07' | 'I08' | 'I09' | 'I10'
  | 'I11' | 'I12' | 'I13' | 'I14' | 'I15';

export type ExtendedFailureMode =
  | 'NONE'
  | 'RATE_LIMIT_429'
  | 'TIMEOUT'
  | 'TOKEN_REVOKED'
  | 'INVALID_SIGNATURE';

export interface ExtConnectorCtx {
  tenantId: string;
  idempotencyKey: string;
  simulateFailure?: ExtendedFailureMode;
}

const extReplayCache = new Map<string, any>();

export function clearExtendedConnectorsCache() {
  extReplayCache.clear();
}

export function invokeExtendedConnector(
  connectorId: ExtendedConnectorId,
  ctx: ExtConnectorCtx,
  input: Record<string, any>
) {
  if (!ctx.tenantId || !ctx.idempotencyKey) {
    return { ok: false, connectorId, status: 'REJECTED', errorCode: 'TENANT_OR_IDEMPOTENCY_MISSING', idempotentReplay: false };
  }
  const cacheKey = `${connectorId}:${ctx.tenantId}:${ctx.idempotencyKey}`;
  if (extReplayCache.has(cacheKey)) {
    return { ...extReplayCache.get(cacheKey), idempotentReplay: true };
  }
  if (ctx.simulateFailure === 'TOKEN_REVOKED') {
    return { ok: false, connectorId, status: 'REJECTED', errorCode: 'AUTH_TOKEN_REVOKED', idempotentReplay: false };
  }
  if (ctx.simulateFailure === 'INVALID_SIGNATURE') {
    return { ok: false, connectorId, status: 'REJECTED', errorCode: 'INVALID_WEBHOOK_SIGNATURE', idempotentReplay: false };
  }
  if (ctx.simulateFailure === 'RATE_LIMIT_429' || ctx.simulateFailure === 'TIMEOUT') {
    return { ok: false, connectorId, status: 'QUEUED_RETRY', errorCode: ctx.simulateFailure, idempotentReplay: false };
  }

  let res: any = null;
  switch (connectorId) {
    case 'I05': // Social publishing resmi
      if (!input.officialProfessionalAccount) {
        res = { ok: true, connectorId, status: 'FALLBACK_HONEST', fallbackLabel: 'EXPORT_REMINDER_NO_PERSONAL_BOT', idempotentReplay: false };
      } else {
        res = { ok: true, connectorId, status: 'OK', data: { receiptId: `SOC-${ctx.idempotencyKey}`, timezone: input.timezone || 'Asia/Jakarta' }, idempotentReplay: false };
      }
      break;
    case 'I06': // Ads API resmi
      if (!input.housingPolicyChecked || !input.budgetApproved || Number(input.dailySpend || 0) > Number(input.serverCap || 0)) {
        return { ok: false, connectorId, status: 'REJECTED', errorCode: 'ADS_POLICY_OR_CAP_BLOCKED', idempotentReplay: false };
      }
      res = { ok: true, connectorId, status: 'OK', data: { campaignId: `AD-${ctx.idempotencyKey}` }, idempotentReplay: false };
      break;
    case 'I07': // Calendar & appointment
      if (input.slotBusy) {
        return { ok: false, connectorId, status: 'REJECTED', errorCode: 'DOUBLE_SLOT_PREVENTED', idempotentReplay: false };
      }
      res = { ok: true, connectorId, status: 'OK', data: { slotId: `CAL-${ctx.idempotencyKey}`, timezone: input.timezone || 'Asia/Jakarta' }, idempotentReplay: false };
      break;
    case 'I08': // PBX / VoIP metadata bisnis
      res = {
        ok: true,
        connectorId,
        status: input.pbxAvailable === false ? 'FALLBACK_HONEST' : 'OK',
        data: {
          callId: input.callId || `CALL-${ctx.idempotencyKey}`,
          answered: input.eventStatus === 'ANSWERED', // Klik saja bukan answered
          recordingEnabled: false, // Rekaman default mati
        },
        idempotentReplay: false,
      };
      break;
    case 'I09': // Email / push notifikasi
      if (input.suppressed || !input.hasConsent) {
        return { ok: false, connectorId, status: 'REJECTED', errorCode: 'SUPPRESSED_OR_NO_CONSENT', idempotentReplay: false };
      }
      res = { ok: true, connectorId, status: 'OK', data: { messageId: `MSG-${ctx.idempotencyKey}` }, idempotentReplay: false };
      break;
    case 'I10': // PSP billing lisensi software
    case 'I11': // Bank / PSP rekonsiliasi proyek
      if (connectorId === 'I11' && Number(input.whitelistedApprovers || 0) < 2) {
        return { ok: false, connectorId, status: 'REJECTED', errorCode: 'TWO_APPROVERS_REQUIRED', idempotentReplay: false };
      }
      res = { ok: true, connectorId, status: 'OK', data: { invoiceRef: `INV-${ctx.idempotencyKey}`, verified: true }, idempotentReplay: false };
      break;
    case 'I12': // ERP / inventory / finance
      if (input.bypassClosedApi) {
        return { ok: false, connectorId, status: 'REJECTED', errorCode: 'CLOSED_API_BYPASS_FORBIDDEN', idempotentReplay: false };
      }
      res = { ok: true, connectorId, status: 'OK', data: { syncId: `ERP-${ctx.idempotencyKey}` }, idempotentReplay: false };
      break;
    case 'I13': // E-sign / dokumen transaksi
      if (!input.counselTemplateApproved) {
        return { ok: false, connectorId, status: 'REJECTED', errorCode: 'TEMPLATE_NOT_COUNSEL_APPROVED', idempotentReplay: false };
      }
      res = { ok: true, connectorId, status: 'OK', data: { envelopeId: `ESIGN-${ctx.idempotencyKey}` }, idempotentReplay: false };
      break;
    case 'I14': // Enterprise IdP / SSO / SCIM / BYOK
      if (!input.contractSigned) {
        return { ok: false, connectorId, status: 'REJECTED', errorCode: 'CONTRACT_REQUIRED_FOR_SSO_BYOK', idempotentReplay: false };
      }
      res = { ok: true, connectorId, status: 'OK', data: { idpStatus: 'VERIFIED', keyRotationReady: true }, idempotentReplay: false };
      break;
    case 'I15': // AI voice / telco berizin
      if (!input.diamondPlan || !input.voiceOptIn || !input.withinQuietHours) {
        return { ok: false, connectorId, status: 'REJECTED', errorCode: 'DIAMOND_OPTIN_QUIETHOURS_REQUIRED', idempotentReplay: false };
      }
      res = { ok: true, connectorId, status: 'OK', data: { callSessionId: `VOI-${ctx.idempotencyKey}`, telcoSeparate: true }, idempotentReplay: false };
      break;
  }

  extReplayCache.set(cacheKey, res);
  return res;
}

export function getExtendedConnectorsHealth() {
  return [
    { id: 'I05', name: 'Social Publishing Resmi', status: 'READY_SANDBOX' },
    { id: 'I06', name: 'Ads API Resmi', status: 'READY_SANDBOX' },
    { id: 'I07', name: 'Calendar & Appointment', status: 'READY_SANDBOX' },
    { id: 'I08', name: 'PBX / VoIP Metadata', status: 'READY_SANDBOX' },
    { id: 'I09', name: 'Email / Push Notification', status: 'READY_SANDBOX' },
    { id: 'I10', name: 'PSP Billing Lisensi', status: 'READY_SANDBOX' },
    { id: 'I11', name: 'Bank / PSP Rekonsiliasi', status: 'READY_SANDBOX' },
    { id: 'I12', name: 'ERP / Inventory / Finance', status: 'READY_SANDBOX' },
    { id: 'I13', name: 'E-Sign / Dokumen Transaksi', status: 'READY_SANDBOX' },
    { id: 'I14', name: 'Enterprise IdP / SSO / BYOK', status: 'READY_SANDBOX' },
    { id: 'I15', name: 'AI Voice / Telco Berizin', status: 'READY_SANDBOX' },
  ];
}
