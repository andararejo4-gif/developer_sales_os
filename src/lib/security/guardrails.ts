// ============================================================================
// DEVELOPER SALES OS - SECURITY & AI GUARDRAILS
// Covers Checklist: SEC-07, SEC-08, SEC-10, AI-05, AI-09
// ============================================================================
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * SEC-07: Masking PII & secret untuk log aplikasi
 */
export function maskPiiForLogs(input: string): string {
  return input
    // Email
    .replace(/([a-zA-Z0-9._%+-]{2})[a-zA-Z0-9._%+-]*(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1***$2')
    // Nomor HP Indonesia (+628xxx / 08xxx)
    .replace(/(\+?62|0)8\d{2,3}(\d{4,6})(\d{2,3})/g, '$18***$3')
    // NIK 16 digit
    .replace(/\b(\d{4})\d{8}(\d{4})\b/g, '$1********$2')
    // Bearer JWT / API keys
    .replace(/(Bearer\s+)[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi, '$1[REDACTED_JWT]');
}

/**
 * SEC-08: Validasi URL eksternal anti-SSRF
 */
export function validateSafeExternalUrl(rawUrl: string): { safe: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: 'URL_MALFORMED' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { safe: false, reason: `PROTOCOL_BLOCKED:${parsed.protocol}` };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return { safe: false, reason: 'INTERNAL_HOST_BLOCKED' };
  }

  // Cek IPv4 privat & link-local (127.x, 10.x, 169.254.x, 192.168.x, 172.16-31.x, 0.0.0.0)
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31)
    ) {
      return { safe: false, reason: 'PRIVATE_IP_BLOCKED' };
    }
  }

  return { safe: true };
}

/**
 * SEC-10: Verifikasi signature HMAC-SHA256 webhook + replay window & nonce defense
 */
export function verifyWebhookSignatureAndReplay(params: {
  payload: string;
  signatureHex: string;
  timestampSec: number;
  nonce: string;
  secret: string;
  seenNonces: Set<string>;
  nowSec?: number;
  maxSkewSec?: number;
}): { ok: boolean; reason?: string } {
  const now = params.nowSec ?? Math.floor(Date.now() / 1000);
  const maxSkew = params.maxSkewSec ?? 300;

  if (Math.abs(now - params.timestampSec) > maxSkew) {
    return { ok: false, reason: 'TIMESTAMP_OUT_OF_WINDOW' };
  }
  if (!params.nonce || params.seenNonces.has(params.nonce)) {
    return { ok: false, reason: 'REPLAY_NONCE_DETECTED' };
  }

  const expectedHex = createHmac('sha256', params.secret)
    .update(`${params.timestampSec}.${params.nonce}.${params.payload}`)
    .digest('hex');

  const sigBuf = Buffer.from(params.signatureHex.toLowerCase(), 'utf8');
  const expBuf = Buffer.from(expectedHex.toLowerCase(), 'utf8');
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, reason: 'INVALID_SIGNATURE' };
  }

  params.seenNonces.add(params.nonce);
  return { ok: true };
}

/**
 * AI-09: Deteksi pola prompt-injection umum pada input pengguna/dokumen
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /abaikan\s+(semua\s+)?instruksi\s+sebelumnya/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /tampilkan\s+system\s+prompt/i,
  /bypass\s+(gate|approval|auth|rbac|entitlement)/i,
  /<\s*script\b/i,
];

export function detectPromptInjection(text: string): { flagged: boolean; matches: string[] } {
  const matches: string[] = [];
  for (const rx of INJECTION_PATTERNS) {
    if (rx.test(text)) {
      matches.push(rx.source);
    }
  }
  return { flagged: matches.length > 0, matches };
}

/**
 * AI-05: Validasi schema JSON keluaran AI secara ketat sebelum disimpan/ditampilkan
 */
export function validateStrictAiJson(
  payload: unknown,
  requiredKeys: string[],
  allowedKeys: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['PAYLOAD_MUST_BE_OBJECT'] };
  }
  const obj = payload as Record<string, unknown>;
  const allowedSet = new Set([...requiredKeys, ...allowedKeys]);

  for (const req of requiredKeys) {
    if (!(req in obj) || obj[req] === undefined || obj[req] === null) {
      errors.push(`MISSING_REQUIRED_KEY:${req}`);
    }
  }
  for (const key of Object.keys(obj)) {
    if (!allowedSet.has(key)) {
      errors.push(`UNEXPECTED_KEY:${key}`);
    }
  }
  return { valid: errors.length === 0, errors };
}
