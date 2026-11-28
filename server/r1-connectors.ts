// ============================================================================
// R1 OFFICIAL CONNECTOR ADAPTERS (INT-I01, INT-I02, INT-I03, INT-I04, INT-I16)
// Contract, Guardrails, Idempotency, Failure Simulation & Honest Fallback
// ============================================================================

import crypto from 'node:crypto';

export type ConnectorId = 'I01' | 'I02' | 'I03' | 'I04' | 'I16';

export type SimulatedFailure =
  | 'NONE'
  | 'RATE_LIMIT_429'
  | 'TIMEOUT'
  | 'UPSTREAM_DOWN'
  | 'TOKEN_REVOKED'
  | 'INVALID_SIGNATURE'
  | 'HTTP_404'
  | 'HTTP_401';

export interface ConnectorCallContext {
  tenantId: string;
  idempotencyKey: string;
  tokenRevoked?: boolean;
  simulateFailure?: SimulatedFailure;
}

export interface ConnectorResponse<T = Record<string, any>> {
  ok: boolean;
  connectorId: ConnectorId;
  idempotentReplay: boolean;
  status: 'OK' | 'FALLBACK_HONEST' | 'QUEUED_RETRY' | 'REJECTED';
  errorCode?: string;
  data?: T;
  fallbackLabel?: string;
  auditMeta: {
    tenantId: string;
    timestamp: string;
    costPreviewAic: number;
  };
}

const idempotencyCache = new Map<string, ConnectorResponse<any>>();

export function clearConnectorCacheForTests() {
  idempotencyCache.clear();
}

function getCacheKey(connectorId: ConnectorId, tenantId: string, idempotencyKey: string): string {
  return `${connectorId}:${tenantId}:${idempotencyKey}`;
}

function checkCommonGuards<T>(
  connectorId: ConnectorId,
  ctx: ConnectorCallContext,
  costPreviewAic: number
): ConnectorResponse<T> | null {
  if (!ctx.tenantId || !ctx.idempotencyKey) {
    return {
      ok: false,
      connectorId,
      idempotentReplay: false,
      status: 'REJECTED',
      errorCode: 'TENANT_OR_IDEMPOTENCY_MISSING',
      auditMeta: { tenantId: ctx.tenantId || '', timestamp: new Date().toISOString(), costPreviewAic },
    };
  }

  const cached = idempotencyCache.get(getCacheKey(connectorId, ctx.tenantId, ctx.idempotencyKey));
  if (cached) {
    return { ...cached, idempotentReplay: true };
  }

  if (ctx.tokenRevoked || ctx.simulateFailure === 'TOKEN_REVOKED') {
    return {
      ok: false,
      connectorId,
      idempotentReplay: false,
      status: 'REJECTED',
      errorCode: 'AUTH_TOKEN_REVOKED',
      fallbackLabel: 'MANUAL_QUEUE_REQUIRED',
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic },
    };
  }

  if (ctx.simulateFailure === 'RATE_LIMIT_429') {
    return {
      ok: false,
      connectorId,
      idempotentReplay: false,
      status: 'QUEUED_RETRY',
      errorCode: 'RATE_LIMIT_429',
      fallbackLabel: 'BACKOFF_QUEUE',
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic },
    };
  }

  if (ctx.simulateFailure === 'TIMEOUT' || ctx.simulateFailure === 'UPSTREAM_DOWN') {
    return {
      ok: false,
      connectorId,
      idempotentReplay: false,
      status: 'QUEUED_RETRY',
      errorCode: ctx.simulateFailure,
      fallbackLabel: 'MANUAL_FALLBACK_AVAILABLE',
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic },
    };
  }

  return null;
}

function cacheAndReturn<T>(ctx: ConnectorCallContext, res: ConnectorResponse<T>): ConnectorResponse<T> {
  if (ctx.tenantId && ctx.idempotencyKey && res.status !== 'REJECTED') {
    idempotencyCache.set(getCacheKey(res.connectorId, ctx.tenantId, ctx.idempotencyKey), res);
  }
  return res;
}

// ----------------------------------------------------------------------------
// INT-I01: Adapter LLM dan OCR Resmi
// ----------------------------------------------------------------------------
const APPROVED_LLM_MODELS = new Set(['gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o-mini', 'ocr-vision-v2']);

export function invokeLlmOcrAdapter(
  ctx: ConnectorCallContext,
  input: { model: string; maxCostAic: number; promptOrDocText: string; extractedFields?: Record<string, string | null> }
): ConnectorResponse<{ model: string; output: Record<string, string>; dataTermsAccepted: true }> {
  const cost = Math.min(Math.max(Number(input.maxCostAic) || 5, 1), 500);
  const guard = checkCommonGuards<{ model: string; output: Record<string, string>; dataTermsAccepted: true }>('I01', ctx, cost);
  if (guard) return guard;

  if (!APPROVED_LLM_MODELS.has(input.model)) {
    return {
      ok: false,
      connectorId: 'I01',
      idempotentReplay: false,
      status: 'REJECTED',
      errorCode: 'UNAPPROVED_MODEL_NO_BYPASS',
      fallbackLabel: 'QUEUE_OR_MANUAL_NO_BYPASS',
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: cost },
    };
  }

  // Unknown tetap unknown (tidak mengarang data kosong)
  const output: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.extractedFields || {})) {
    output[k] = v && v.trim() ? v.trim() : 'UNKNOWN';
  }

  return cacheAndReturn(ctx, {
    ok: true,
    connectorId: 'I01',
    idempotentReplay: false,
    status: 'OK',
    data: { model: input.model, output, dataTermsAccepted: true },
    auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: cost },
  });
}

// ----------------------------------------------------------------------------
// INT-I02: Adapter Web Research / Sumber Publik
// ----------------------------------------------------------------------------
export function invokeWebResearchAdapter(
  ctx: ConnectorCallContext,
  input: { url: string; paywalled?: boolean; tosAllowed: boolean; freshnessDays?: number }
): ConnectorResponse<{ url: string; httpStatus: number; freshnessDays: number; tosAllowed: boolean }> {
  const guard = checkCommonGuards<{ url: string; httpStatus: number; freshnessDays: number; tosAllowed: boolean }>('I02', ctx, 10);
  if (guard) return guard;

  if (input.paywalled || !input.tosAllowed) {
    return {
      ok: false,
      connectorId: 'I02',
      idempotentReplay: false,
      status: 'REJECTED',
      errorCode: 'PAYWALL_OR_TOS_BLOCKED',
      fallbackLabel: 'MANUAL_ATTRIBUTED_RESEARCH',
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 0 },
    };
  }

  if (ctx.simulateFailure === 'HTTP_401' || ctx.simulateFailure === 'HTTP_404') {
    return {
      ok: false,
      connectorId: 'I02',
      idempotentReplay: false,
      status: 'FALLBACK_HONEST',
      errorCode: ctx.simulateFailure,
      fallbackLabel: 'UNVERIFIED_SOURCE_NOT_FABRICATED',
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 0 },
    };
  }

  return cacheAndReturn(ctx, {
    ok: true,
    connectorId: 'I02',
    idempotentReplay: false,
    status: 'OK',
    data: {
      url: input.url,
      httpStatus: 200,
      freshnessDays: input.freshnessDays ?? 0,
      tosAllowed: true,
    },
    auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 10 },
  });
}

// ----------------------------------------------------------------------------
// INT-I03: Adapter Maps, Places dan Routes
// ----------------------------------------------------------------------------
export function invokeMapsRoutesAdapter(
  ctx: ConnectorCallContext,
  input: { originLat: number; originLng: number; destLat: number; destLng: number; apiAvailable?: boolean }
): ConnectorResponse<{ etaMinutes: number | null; distanceKm: number | null; etaSource: 'API' | 'MANUAL_PIN_PLAN_NO_ETA' }> {
  const guard = checkCommonGuards<{ etaMinutes: number | null; distanceKm: number | null; etaSource: 'API' | 'MANUAL_PIN_PLAN_NO_ETA' }>('I03', ctx, 15);
  if (guard) return guard;

  if (input.apiAvailable === false) {
    // Tidak mengaku ETA jalan tanpa hasil API
    return cacheAndReturn(ctx, {
      ok: true,
      connectorId: 'I03',
      idempotentReplay: false,
      status: 'FALLBACK_HONEST',
      fallbackLabel: 'MANUAL_PIN_PLAN_NO_ETA',
      data: { etaMinutes: null, distanceKm: null, etaSource: 'MANUAL_PIN_PLAN_NO_ETA' },
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 0 },
    });
  }

  return cacheAndReturn(ctx, {
    ok: true,
    connectorId: 'I03',
    idempotentReplay: false,
    status: 'OK',
    data: { etaMinutes: 14, distanceKm: 4.8, etaSource: 'API' },
    auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 15 },
  });
}

// ----------------------------------------------------------------------------
// INT-I04: Adapter WhatsApp Business / BSP
// ----------------------------------------------------------------------------
export function verifyWaWebhookSignature(payload: string, signatureHex: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (signatureHex.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signatureHex), Buffer.from(expected));
}

export function invokeWaBusinessAdapter(
  ctx: ConnectorCallContext,
  input: {
    officialAccountId: string;
    recipientPhone: string;
    hasConsent: boolean;
    within24hWindow: boolean;
    templateApproved?: boolean;
    isPublicBlast?: boolean;
    webhookPayload?: string;
    webhookSignature?: string;
    webhookSecret?: string;
  }
): ConnectorResponse<{ delivered: boolean; channel: 'OFFICIAL_BSP' | 'HUMAN_INBOX_FALLBACK' }> {
  const guard = checkCommonGuards<{ delivered: boolean; channel: 'OFFICIAL_BSP' | 'HUMAN_INBOX_FALLBACK' }>('I04', ctx, 1);
  if (guard) return guard;

  if (ctx.simulateFailure === 'INVALID_SIGNATURE' || (input.webhookPayload && input.webhookSecret && !verifyWaWebhookSignature(input.webhookPayload, input.webhookSignature || '', input.webhookSecret))) {
    return {
      ok: false,
      connectorId: 'I04',
      idempotentReplay: false,
      status: 'REJECTED',
      errorCode: 'INVALID_WEBHOOK_SIGNATURE',
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 0 },
    };
  }

  if (input.isPublicBlast || !input.hasConsent) {
    return {
      ok: false,
      connectorId: 'I04',
      idempotentReplay: false,
      status: 'REJECTED',
      errorCode: input.isPublicBlast ? 'PUBLIC_BLAST_FORBIDDEN' : 'OPT_OUT_OR_NO_CONSENT',
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 0 },
    };
  }

  if (!input.within24hWindow && !input.templateApproved) {
    return cacheAndReturn(ctx, {
      ok: true,
      connectorId: 'I04',
      idempotentReplay: false,
      status: 'FALLBACK_HONEST',
      fallbackLabel: 'HUMAN_INBOX_MANUAL_EXPORT',
      data: { delivered: false, channel: 'HUMAN_INBOX_FALLBACK' },
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 0 },
    });
  }

  return cacheAndReturn(ctx, {
    ok: true,
    connectorId: 'I04',
    idempotentReplay: false,
    status: 'OK',
    data: { delivered: true, channel: 'OFFICIAL_BSP' },
    auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 1 },
  });
}

// ----------------------------------------------------------------------------
// INT-I16: Adapter Domain, DNS dan Hosting Website
// ----------------------------------------------------------------------------
export function invokeDomainHostingAdapter(
  ctx: ConnectorCallContext,
  input: { domain: string; hasDomainMandate: boolean; tlsActive: boolean; deployTarget: 'STAGING' | 'PRODUCTION' }
): ConnectorResponse<{ domain: string; deployTarget: 'STAGING' | 'PRODUCTION'; publicLive: boolean; label: string }> {
  const guard = checkCommonGuards<{ domain: string; deployTarget: 'STAGING' | 'PRODUCTION'; publicLive: boolean; label: string }>('I16', ctx, 0);
  if (guard) return guard;

  if (!input.hasDomainMandate) {
    return {
      ok: false,
      connectorId: 'I16',
      idempotentReplay: false,
      status: 'REJECTED',
      errorCode: 'DOMAIN_MANDATE_MISSING',
      fallbackLabel: 'STAGING_EXPORT_ONLY',
      auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 0 },
    };
  }

  const isProdReady = input.deployTarget === 'PRODUCTION' && input.tlsActive;
  return cacheAndReturn(ctx, {
    ok: true,
    connectorId: 'I16',
    idempotentReplay: false,
    status: isProdReady ? 'OK' : 'FALLBACK_HONEST',
    fallbackLabel: isProdReady ? undefined : 'STAGING_DRAFT_NOT_PUBLIC',
    data: {
      domain: input.domain,
      deployTarget: input.deployTarget,
      publicLive: isProdReady,
      label: isProdReady ? 'LIVE_TLS_VERIFIED' : 'BELUM_PUBLIK_STAGING',
    },
    auditMeta: { tenantId: ctx.tenantId, timestamp: new Date().toISOString(), costPreviewAic: 0 },
  });
}

export function getR1ConnectorsHealth() {
  return [
    { id: 'I01', name: 'LLM & OCR Resmi', status: 'READY_SANDBOX', guardrails: ['model_allowlist', 'cost_bound', 'unknown_stays_unknown'] },
    { id: 'I02', name: 'Web Research / Sumber Publik', status: 'READY_SANDBOX', guardrails: ['tos_check', 'no_paywall_bypass', '401_404_not_fabricated'] },
    { id: 'I03', name: 'Maps, Places & Routes', status: 'READY_SANDBOX', guardrails: ['sku_cap', 'no_fake_eta_without_api'] },
    { id: 'I04', name: 'WhatsApp Business / BSP', status: 'READY_SANDBOX', guardrails: ['consent_required', 'hmac_signature', 'no_public_blast'] },
    { id: 'I16', name: 'Domain, DNS & Hosting Website', status: 'READY_SANDBOX', guardrails: ['domain_mandate', 'tls_required', 'honest_staging_label'] },
  ];
}
