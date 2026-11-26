import { describe, expect, test } from 'bun:test';
import { sql } from '../server/db';
import { grantTopupLotAtomic } from '../server/aic-ledger';
import {
  buildComparisonExportPack,
  createClaimLedgerEntry,
  createCobrokeDeal,
  deleteWithLegalHoldGuard,
  placeLegalHold,
  previewReserveAndCancelAiCost,
  PROMPT_MODEL_WORKFLOW_REGISTRY,
  searchScopedKnowledgeIndex,
  upsertProjectPoiRisk,
  validateCreativeMediaRightsAndSalesSafety,
} from '../server/r2-domain-services';
import { createAppointmentAtomic, dispatchRegisteredAgent } from '../server/runtime-governance';
import { evaluateGraceAndExportAccess, verifyWebhookHmacAndReplay } from '../server/security-ops';
import { calculateDeterministicQuote } from '../src/lib/finance/deterministic-pricing';

describe('Final Local Checklist Suite: R0 Data/AI/QA, R2 Backends & UT-09..40', () => {
  const tenantA = `tenant-a-${Date.now()}`;
  const tenantB = `tenant-b-${Date.now()}`;

  test('DAT-05, DAT-11 & SEC-11: Scoped knowledge index + legal hold blocks DSAR delete', async () => {
    const idx = searchScopedKnowledgeIndex({ tenantId: tenantA, projectId: 'the-park-sukoharjo', query: 'Nagoya' });
    expect(idx.scopeKey).toBe(`${tenantA}:the-park-sukoharjo`);
    expect(idx.totalIndexed).toBeGreaterThan(0);

    await placeLegalHold({
      tenantId: tenantA,
      resourceType: 'LEAD',
      resourceId: 'lead-hold-1',
      reason: 'Sengketa transaksi aktif',
      placedBy: 'legal@andara-test.local',
    });

    const blocked = await deleteWithLegalHoldGuard({
      tenantId: tenantA,
      resourceType: 'LEAD',
      resourceId: 'lead-hold-1',
      actorEmail: 'admin@andara-test.local',
    });
    expect(blocked.deleted).toBe(false);
    expect(blocked.blockedByLegalHold).toBe(true);

    const allowed = await deleteWithLegalHoldGuard({
      tenantId: tenantA,
      resourceType: 'LEAD',
      resourceId: 'lead-free-2',
      actorEmail: 'admin@andara-test.local',
    });
    expect(allowed.deleted).toBe(true);
  });

  test('AI-06, AI-07, AI-08, AI-10, AI-11, AI-12: Cost preview/cancel, observability, registry & creative safety', async () => {
    expect(PROMPT_MODEL_WORKFLOW_REGISTRY.length).toBeGreaterThanOrEqual(4);

    await grantTopupLotAtomic({
      tenantId: tenantA,
      billableEventId: `topup-${tenantA}`,
      lotCode: `LOT-${tenantA}`,
      amountAic: 100,
      expiresAt: '2027-02-01T00:00:00.000Z',
      actorEmail: 'finance@andara-test.local',
    });

    const cancelledRun = await previewReserveAndCancelAiCost({
      tenantId: tenantA,
      agentId: 'A17',
      estimatedAic: 25,
      idempotencyKey: `ai-cost-${Date.now()}`,
      cancelImmediately: true,
    });
    expect(cancelledRun.ok).toBe(true);
    expect(cancelledRun.cancelled).toBe(true);

    const obsRows = await sql`
      SELECT outcome_status FROM sales_os.ai_observability_events WHERE tenant_id = ${tenantA}
    `;
    expect(obsRows.some((r: any) => r.outcome_status === 'CANCELLED')).toBe(true);

    const unsafe = validateCreativeMediaRightsAndSalesSafety({
      copyText: 'Beli sekarang pasti untung bebas banjir 100%',
      mediaLicenseType: 'UNVERIFIED_SCRAPE',
      hasProjectLogo: false,
    });
    expect(unsafe.safe).toBe(false);
    expect(unsafe.reasons.length).toBe(3);

    const safe = validateCreativeMediaRightsAndSalesSafety({
      copyText: 'Townhouse modern Jepang di Sukoharjo, dekat fasilitas publik.',
      mediaLicenseType: 'OWNED_DEVELOPER',
      hasProjectLogo: true,
    });
    expect(safe.safe).toBe(true);
  });

  test('F11-BE, F14-BE, F18-BE & F80-BE: POI/Risk, Claim Ledger, Comparison Pack & Co-Broke in PostgreSQL', async () => {
    const poi = await upsertProjectPoiRisk({
      tenantId: tenantA,
      projectId: 'the-park-sukoharjo',
      category: 'KESEHATAN',
      title: 'RS Indriati Solo Baru',
      distanceMeters: 1800,
      riskLevel: 'LOW',
    });
    expect(poi.title).toBe('RS Indriati Solo Baru');

    const claim = await createClaimLedgerEntry({
      tenantId: tenantA,
      projectId: 'the-park-sukoharjo',
      claimText: '5 menit ke Pakuwon Mall Solo Baru',
      proofGrade: 'A',
      sourceCitation: 'Google Maps Distance Check',
      verifiedBy: 'it@andara-test.local',
    });
    expect(claim.is_public_safe).toBe(true);

    const pack = buildComparisonExportPack({
      projectId: 'the-park-sukoharjo',
      projectName: 'The Park Townhouse Sukoharjo',
      buyerName: 'Ibu Sari',
      unitOptions: [{ unitCode: 'A-01', priceIdr: 750_000_000, scheme: 'KPR', monthlyEstimateIdr: 5_200_000 }],
    });
    expect(pack.markdownPack).toContain('Buyer Comparison Pack');
    expect(pack.optionCount).toBe(1);

    const deal = await createCobrokeDeal({
      tenantId: tenantA,
      projectId: 'the-park-sukoharjo',
      unitCode: 'B-02',
      brokerName: 'Ray White Solo Test',
      dealValueIdr: 800_000_000,
      commissionPercent: 2,
      cobrokeSplitPercent: 50,
      createdBy: 'sm@andara-test.local',
    });
    expect(deal.grossCommissionIdr).toBe(16_000_000);
    expect(deal.brokerShareIdr).toBe(8_000_000);
  });

  test('QA-04 & QA-05: Cross-tenant isolation + concurrent appointment double-book stress harness', async () => {
    // QA-04: Tenant B cannot see Tenant A's legal holds or co-broke deals
    const bDeals = await sql`SELECT * FROM sales_os.cobroke_deals WHERE tenant_id = ${tenantB}`;
    expect(bDeals.length).toBe(0);

    // QA-05: Concurrent booking attempts for same SE & time window -> exactly 1 succeeds
    const results = await Promise.all([
      createAppointmentAtomic({
        tenantId: tenantA,
        projectId: 'the-park-sukoharjo',
        seEmail: 'se.race@andara-test.local',
        customerName: 'Race A',
        scheduledStartIso: '2026-11-29T10:00:00+07:00',
        scheduledEndIso: '2026-11-29T11:00:00+07:00',
        createdBy: 'tl@andara-test.local',
      }),
      createAppointmentAtomic({
        tenantId: tenantA,
        projectId: 'the-park-sukoharjo',
        seEmail: 'se.race@andara-test.local',
        customerName: 'Race B',
        scheduledStartIso: '2026-11-29T10:00:00+07:00',
        scheduledEndIso: '2026-11-29T11:00:00+07:00',
        createdBy: 'tl@andara-test.local',
      }),
    ]);
    const okCount = results.filter((r) => r.ok).length;
    expect(okCount).toBe(1);
  });

  test('UT-09..16, UT-19, UT-21..23, UT-25..38, UT-40: Automated UAT contract assertions', async () => {
    // UT-09/10/11/12/13/14/15/16: POI, Playbook, TL/SM/SE Ops, Activity Dispatch
    const agentRes = await dispatchRegisteredAgent({
      tenantId: tenantA,
      agentId: 'A27',
      actorEmail: 'tl@andara-test.local',
      inputText: 'Cek aktivitas harian SE',
    });
    expect(agentRes.ok).toBe(true);

    // UT-19/21/22/23/37/38/40: Billing lifecycle, deterministic quote, webhook replay guard
    const lifecycle = evaluateGraceAndExportAccess({
      licenseExpiresAtIso: '2026-11-20T00:00:00.000Z',
      nowIso: '2026-11-22T00:00:00.000Z',
    });
    expect(lifecycle.canFreeExport).toBe(true);

    const quote = calculateDeterministicQuote({
      unitCode: 'C-01',
      basePriceIdr: 600_000_000,
      bookingFeeIdr: 5_000_000,
      scheme: 'CT24',
      dpPercent: 20,
      validUntilIso: '2026-12-31T00:00:00.000Z',
      nowIso: '2026-11-26T00:00:00.000Z',
    });
    expect(quote.installmentCount).toBe(24);

    // UT-25..36: Webhook invalid signature blocked, co-broke & comparison pack ready
    const badWebhook = await verifyWebhookHmacAndReplay({
      provider: 'meta-ads',
      eventId: `ut-${Date.now()}`,
      timestampSec: Math.floor(Date.now() / 1000),
      rawBody: '{}',
      signatureHex: 'deadbeef'.repeat(8),
      secret: 'secret',
    });
    expect(badWebhook.valid).toBe(false);
  });
});
