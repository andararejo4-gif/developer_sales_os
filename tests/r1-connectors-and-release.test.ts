import { beforeEach, describe, expect, test } from 'bun:test';
import crypto from 'node:crypto';
import {
  clearConnectorCacheForTests,
  getR1ConnectorsHealth,
  invokeDomainHostingAdapter,
  invokeLlmOcrAdapter,
  invokeMapsRoutesAdapter,
  invokeWaBusinessAdapter,
  invokeWebResearchAdapter,
} from '../server/r1-connectors';

describe('R1 Official Connectors Contract & Failure Tests (INT-I01..I04, I16)', () => {
  beforeEach(() => {
    clearConnectorCacheForTests();
  });

  test('Healthcheck 5 konektor R1 tersedia dengan guardrail lengkap', () => {
    const health = getR1ConnectorsHealth();
    expect(health.map((h) => h.id)).toEqual(['I01', 'I02', 'I03', 'I04', 'I16']);
  });

  test('INT-I01 (LLM & OCR): allowlist model, unknown tetap unknown, replay idempoten, 429 & token revoked', () => {
    const blockedModel = invokeLlmOcrAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i01-1' },
      { model: 'unauthorized-free-llm', maxCostAic: 10, promptOrDocText: 'brosur' }
    );
    expect(blockedModel.ok).toBe(false);
    expect(blockedModel.errorCode).toBe('UNAPPROVED_MODEL_NO_BYPASS');

    const ok = invokeLlmOcrAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i01-2' },
      {
        model: 'gemini-2.5-flash',
        maxCostAic: 25,
        promptOrDocText: 'brosur',
        extractedFields: { hargaCash: '890000000', luasKolam: '' },
      }
    );
    expect(ok.ok).toBe(true);
    expect(ok.data?.output.luasKolam).toBe('UNKNOWN');

    const replay = invokeLlmOcrAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i01-2' },
      { model: 'gemini-2.5-flash', maxCostAic: 25, promptOrDocText: 'brosur' }
    );
    expect(replay.idempotentReplay).toBe(true);

    const rate429 = invokeLlmOcrAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i01-3', simulateFailure: 'RATE_LIMIT_429' },
      { model: 'gemini-2.5-flash', maxCostAic: 10, promptOrDocText: 'test' }
    );
    expect(rate429.status).toBe('QUEUED_RETRY');

    const revoked = invokeLlmOcrAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i01-4', tokenRevoked: true },
      { model: 'gemini-2.5-flash', maxCostAic: 10, promptOrDocText: 'test' }
    );
    expect(revoked.errorCode).toBe('AUTH_TOKEN_REVOKED');
  });

  test('INT-I02 (Web Research): 401/404 tidak dikarang, paywall/ToS diblokir, timeout antre', () => {
    const paywall = invokeWebResearchAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i02-1' },
      { url: 'https://paywall.example/data', paywalled: true, tosAllowed: true }
    );
    expect(paywall.errorCode).toBe('PAYWALL_OR_TOS_BLOCKED');

    const notFound = invokeWebResearchAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i02-2', simulateFailure: 'HTTP_404' },
      { url: 'https://publik.example/404', tosAllowed: true }
    );
    expect(notFound.status).toBe('FALLBACK_HONEST');
    expect(notFound.fallbackLabel).toBe('UNVERIFIED_SOURCE_NOT_FABRICATED');

    const timeout = invokeWebResearchAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i02-3', simulateFailure: 'TIMEOUT' },
      { url: 'https://publik.example/ok', tosAllowed: true }
    );
    expect(timeout.status).toBe('QUEUED_RETRY');
  });

  test('INT-I03 (Maps & Routes): tidak mengaku ETA jalan saat API down, label manual plan', () => {
    const apiDown = invokeMapsRoutesAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i03-1' },
      { originLat: -7.59, originLng: 110.81, destLat: -7.60, destLng: 110.82, apiAvailable: false }
    );
    expect(apiDown.status).toBe('FALLBACK_HONEST');
    expect(apiDown.data?.etaMinutes).toBeNull();
    expect(apiDown.data?.etaSource).toBe('MANUAL_PIN_PLAN_NO_ETA');

    const ok = invokeMapsRoutesAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i03-2' },
      { originLat: -7.59, originLng: 110.81, destLat: -7.60, destLng: 110.82, apiAvailable: true }
    );
    expect(ok.status).toBe('OK');
    expect(ok.data?.etaSource).toBe('API');
  });

  test('INT-I04 (WhatsApp BSP): blokir blast/tanpa consent, verifikasi HMAC signature, fallback human inbox', () => {
    const blast = invokeWaBusinessAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i04-1' },
      { officialAccountId: 'wa-1', recipientPhone: '628111', hasConsent: true, within24hWindow: true, isPublicBlast: true }
    );
    expect(blast.errorCode).toBe('PUBLIC_BLAST_FORBIDDEN');

    const badSig = invokeWaBusinessAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i04-2' },
      {
        officialAccountId: 'wa-1',
        recipientPhone: '628111',
        hasConsent: true,
        within24hWindow: true,
        webhookPayload: '{"event":"status"}',
        webhookSignature: '0000',
        webhookSecret: 'secret-123',
      }
    );
    expect(badSig.errorCode).toBe('INVALID_WEBHOOK_SIGNATURE');

    const payload = '{"event":"status"}';
    const validSig = crypto.createHmac('sha256', 'secret-123').update(payload).digest('hex');
    const outOfWindow = invokeWaBusinessAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i04-3' },
      {
        officialAccountId: 'wa-1',
        recipientPhone: '628111',
        hasConsent: true,
        within24hWindow: false,
        templateApproved: false,
        webhookPayload: payload,
        webhookSignature: validSig,
        webhookSecret: 'secret-123',
      }
    );
    expect(outOfWindow.status).toBe('FALLBACK_HONEST');
    expect(outOfWindow.data?.channel).toBe('HUMAN_INBOX_FALLBACK');
  });

  test('INT-I16 (Domain/DNS/Hosting): tolak tanpa mandat domain, staging berlabel belum publik', () => {
    const noMandate = invokeDomainHostingAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i16-1' },
      { domain: 'andara.example.id', hasDomainMandate: false, tlsActive: true, deployTarget: 'PRODUCTION' }
    );
    expect(noMandate.errorCode).toBe('DOMAIN_MANDATE_MISSING');

    const staging = invokeDomainHostingAdapter(
      { tenantId: 't-andara', idempotencyKey: 'i16-2' },
      { domain: 'staging.andara.example.id', hasDomainMandate: true, tlsActive: true, deployTarget: 'STAGING' }
    );
    expect(staging.status).toBe('FALLBACK_HONEST');
    expect(staging.data?.publicLive).toBe(false);
    expect(staging.data?.label).toBe('BELUM_PUBLIK_STAGING');
  });
});
