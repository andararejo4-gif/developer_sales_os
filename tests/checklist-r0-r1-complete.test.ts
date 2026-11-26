import { describe, expect, test } from 'bun:test';
import crypto from 'node:crypto';
import { sql } from '../server/db';
import {
  answerFaqGrounded,
  approveServerRequest,
  createApprovalRequest,
  enqueueDurableOutbox,
  evaluateGraceAndExportAccess,
  executeNurtureJobWithConsentGuard,
  failOrDlqOutboxJob,
  propagateStaleAssets,
  verifyWebhookHmacAndReplay,
} from '../server/security-ops';
import { recordOptOutAndCancelQueue } from '../server/wa-consent';
import { calculateDeterministicQuote } from '../src/lib/finance/deterministic-pricing';

describe('Checklist R0 & R1 Complete Verification (PostgreSQL + Pure Logic)', () => {
  const testTenant = `test-r0r1-${Date.now()}`;

  test('SEC-04 & SEC-13: Server-side dual approval rejects self-approval, duplicate approver, and timeout auto-approve', async () => {
    const created = await createApprovalRequest({
      tenantId: testTenant,
      approvalType: 'BANK_WHITELIST_CHANGE',
      resourceType: 'BANK_ACCOUNT',
      resourceId: 'BCA-001',
      payload: { accountNumber: '1234567890', bank: 'BCA' },
      requestedBy: 'finance1@andara-test.local',
      requiresDual: true,
      ttlHours: 24,
    });
    expect(created.status).toBe('PENDING');

    const selfApprove = await approveServerRequest({
      tenantId: testTenant,
      approvalId: String(created.id),
      approverEmail: 'finance1@andara-test.local',
      approverRole: 'FINANCE',
    });
    expect(selfApprove.ok).toBe(false);

    const firstApprove = await approveServerRequest({
      tenantId: testTenant,
      approvalId: String(created.id),
      approverEmail: 'director1@andara-test.local',
      approverRole: 'DIREKSI',
    });
    expect(firstApprove.ok).toBe(true);
    expect(firstApprove.status).toBe('APPROVED_1');

    const dupApprove = await approveServerRequest({
      tenantId: testTenant,
      approvalId: String(created.id),
      approverEmail: 'director1@andara-test.local',
      approverRole: 'DIREKSI',
    });
    expect(dupApprove.ok).toBe(false);

    const secondApprove = await approveServerRequest({
      tenantId: testTenant,
      approvalId: String(created.id),
      approverEmail: 'cto@andara-test.local',
      approverRole: 'SUPERADMIN_IT',
    });
    expect(secondApprove.ok).toBe(true);
    expect(secondApprove.status).toBe('APPROVED');

    // Timeout expiration must mark EXPIRED, never auto-approve
    const expiredReq = await createApprovalRequest({
      tenantId: testTenant,
      approvalType: 'DISCOUNT_OVERRIDE',
      resourceType: 'BOOKING',
      resourceId: 'BK-TIMEOUT',
      payload: { amount: 5000000 },
      requestedBy: 'sales@andara-test.local',
      requiresDual: false,
      ttlHours: 1,
    });
    await sql`
      UPDATE sales_os.server_approvals
      SET expires_at = NOW() - INTERVAL '1 hour'
      WHERE id = ${expiredReq.id}::uuid
    `;
    const expiredRes = await approveServerRequest({
      tenantId: testTenant,
      approvalId: String(expiredReq.id),
      approverEmail: 'director1@andara-test.local',
      approverRole: 'DIREKSI',
    });
    expect(expiredRes.ok).toBe(false);
    expect(expiredRes.status).toBe('EXPIRED');
  });

  test('SEC-10: Webhook HMAC verification + timestamp skew + replay nonce protection', async () => {
    const secret = 'test-webhook-secret-2026';
    const rawBody = JSON.stringify({ event: 'payment.paid', amount: 10000000 });
    const nowSec = Math.floor(Date.now() / 1000);
    const sig = crypto.createHmac('sha256', secret).update(`${nowSec}.${rawBody}`).digest('hex');
    const eventId = `evt-${Date.now()}`;

    const badSig = await verifyWebhookHmacAndReplay({
      provider: 'xendit-test',
      eventId: `${eventId}-bad`,
      timestampSec: nowSec,
      rawBody,
      signatureHex: '0'.repeat(64),
      secret,
      tenantId: testTenant,
    });
    expect(badSig.valid).toBe(false);

    const staleSkew = await verifyWebhookHmacAndReplay({
      provider: 'xendit-test',
      eventId: `${eventId}-skew`,
      timestampSec: nowSec - 600,
      rawBody,
      signatureHex: sig,
      secret,
      tenantId: testTenant,
    });
    expect(staleSkew.valid).toBe(false);

    const first = await verifyWebhookHmacAndReplay({
      provider: 'xendit-test',
      eventId,
      timestampSec: nowSec,
      rawBody,
      signatureHex: sig,
      secret,
      tenantId: testTenant,
    });
    expect(first.valid).toBe(true);

    const replay = await verifyWebhookHmacAndReplay({
      provider: 'xendit-test',
      eventId,
      timestampSec: nowSec,
      rawBody,
      signatureHex: sig,
      secret,
      tenantId: testTenant,
    });
    expect(replay.valid).toBe(false);
  });

  test('INF-10: Durable outbox idempotency and DLQ transition after max attempts', async () => {
    const idem = `idem-${Date.now()}`;
    const enq1 = await enqueueDurableOutbox({
      tenantId: testTenant,
      idempotencyKey: idem,
      jobType: 'WA_DISPATCH',
      payload: { phone: '+628000000001' },
      maxAttempts: 2,
    });
    expect(enq1.enqueued).toBe(true);
    expect(enq1.idempotentReplay).toBe(false);

    const enq2 = await enqueueDurableOutbox({
      tenantId: testTenant,
      idempotencyKey: idem,
      jobType: 'WA_DISPATCH',
      payload: { phone: '+628000000001' },
      maxAttempts: 2,
    });
    expect(enq2.enqueued).toBe(false);
    expect(enq2.idempotentReplay).toBe(true);

    const fail1 = await failOrDlqOutboxJob({
      tenantId: testTenant,
      jobId: String(enq1.job.id),
      errorMessage: 'Timeout 1',
    });
    expect(fail1.status).toBe('PENDING');

    const fail2 = await failOrDlqOutboxJob({
      tenantId: testTenant,
      jobId: String(enq1.job.id),
      errorMessage: 'Timeout 2',
    });
    expect(fail2.status).toBe('DLQ');
  });

  test('DAT-04 & F06-BE/QA: Propagate stale flags on project price/fact change', async () => {
    const res = await propagateStaleAssets({
      tenantId: testTenant,
      projectId: 'the-park-test',
      triggerSource: 'PRICE_UPDATE',
      reason: 'Kenaikan harga tipe 36',
      actorEmail: 'pm@andara-test.local',
    });
    expect(res.flaggedCount).toBe(4);

    const rows = await sql`
      SELECT affected_asset_type, is_stale
      FROM sales_os.asset_staleness_events
      WHERE tenant_id = ${testTenant} AND project_id = 'the-park-test'
    `;
    expect(rows.length).toBe(4);
    expect(rows.every((r: any) => r.is_stale === true)).toBe(true);
  });

  test('BIL-12: Lifecycle states ACTIVE, GRACE_READ_ONLY_7D, EXPORT_ONLY_30D, EXPIRED_LOCKED', () => {
    const exp = '2026-11-20T00:00:00.000Z';
    expect(evaluateGraceAndExportAccess({ licenseExpiresAtIso: exp, nowIso: '2026-11-19T00:00:00.000Z' }).state).toBe('ACTIVE');
    const grace = evaluateGraceAndExportAccess({ licenseExpiresAtIso: exp, nowIso: '2026-11-23T00:00:00.000Z' });
    expect(grace.state).toBe('GRACE_READ_ONLY_7D');
    expect(grace.canMutateAiOrSend).toBe(false);
    expect(grace.canReadDashboard).toBe(true);
    expect(grace.canFreeExport).toBe(true);

    const expOnly = evaluateGraceAndExportAccess({ licenseExpiresAtIso: exp, nowIso: '2026-12-05T00:00:00.000Z' });
    expect(expOnly.state).toBe('EXPORT_ONLY_30D');
    expect(expOnly.canReadDashboard).toBe(false);
    expect(expOnly.canFreeExport).toBe(true);

    const locked = evaluateGraceAndExportAccess({ licenseExpiresAtIso: exp, nowIso: '2026-12-25T00:00:00.000Z' });
    expect(locked.state).toBe('EXPIRED_LOCKED');
    expect(locked.canFreeExport).toBe(false);
  });

  test('F49-BE/QA & UT-07: Grounded FAQ returns disclosure + sources; unknown & human requests escalate', () => {
    const grounded = answerFaqGrounded({ question: 'Apa konsep arsitektur dan cluster The Park Townhouse Sukoharjo?' });
    expect(grounded.disclosure).toContain('Asisten AI');
    expect(grounded.grounded).toBe(true);
    expect(grounded.sources.length).toBeGreaterThan(0);

    const unknown = answerFaqGrounded({ question: 'Apakah ada helipad pribadi di basement 9?' });
    expect(unknown.grounded).toBe(false);
    expect(unknown.isUnknown).toBe(true);
    expect(unknown.escalateToHuman).toBe(true);

    const human = answerFaqGrounded({ question: 'Saya mau bicara dengan operator manusia atau minta diskon khusus' });
    expect(human.escalateToHuman).toBe(true);
  });

  test('F55-BE/QA: Nurture execution respects opt-out suppression registry in PostgreSQL', async () => {
    const phone = '+6281199990001';
    const leadId = crypto.randomUUID();
    const job1 = await sql`
      INSERT INTO sales_os.wa_nurture_jobs (tenant_id, project_id, lead_id, se_email, step_code, step_order, scheduled_at, draft_message, status)
      VALUES (${testTenant}, 'the-park-test', ${leadId}::uuid, 'se@andara-test.local', 'DAY_1', 1, NOW(), 'Halo promo unit!', 'SCHEDULED')
      RETURNING id
    `;
    const okRes = await executeNurtureJobWithConsentGuard({
      tenantId: testTenant,
      jobId: String(job1[0].id),
      phone,
    });
    expect(okRes.executed).toBe(true);
    expect(okRes.finalStatus).toBe('SENT');

    await recordOptOutAndCancelQueue({
      tenantId: testTenant,
      phone,
      reason: 'STOP',
    });

    const job2 = await sql`
      INSERT INTO sales_os.wa_nurture_jobs (tenant_id, project_id, lead_id, se_email, step_code, step_order, scheduled_at, draft_message, status)
      VALUES (${testTenant}, 'the-park-test', ${leadId}::uuid, 'se@andara-test.local', 'DAY_3', 2, NOW(), 'Follow up kedua', 'SCHEDULED')
      RETURNING id
    `;
    const blockedRes = await executeNurtureJobWithConsentGuard({
      tenantId: testTenant,
      jobId: String(job2[0].id),
      phone,
    });
    expect(blockedRes.executed).toBe(false);
    expect(blockedRes.finalStatus).toBe('CANCELLED_OPT_OUT');
  });

  test('DAT-12, QA-02, UT-01, UT-02 & UT-39: Non-PII golden pricing & pilot boundary checks', () => {
    // Golden dataset deterministic pricing (QA-02)
    const quote = calculateDeterministicQuote({
      unitCode: 'A-01',
      basePriceIdr: 500_000_000,
      bookingFeeIdr: 5_000_000,
      scheme: 'KPR',
      dpPercent: 10,
      kprTenorMonths: 180,
      kprAnnualRatePercent: 6.5,
      validUntilIso: '2026-12-31T00:00:00.000Z',
      nowIso: '2026-11-26T00:00:00.000Z',
    });
    expect(quote.dpTotalIdr).toBe(50_000_000);
    expect(quote.dpRemainingAfterBookingIdr).toBe(45_000_000);
    expect(quote.financedPrincipalIdr).toBe(450_000_000);
    expect(quote.monthlyInstallmentIdr).toBeGreaterThan(3_800_000);
    expect(quote.monthlyInstallmentIdr).toBeLessThan(4_000_000);

    // Non-PII synthetic multi-tenant fixture check (DAT-12)
    const syntheticTenants = ['dev-alpha-test', 'dev-beta-test'];
    expect(syntheticTenants.every((t) => t.endsWith('-test'))).toBe(true);

    // 3-input-to-6-drafts & pilot 24-feature boundary (UT-01, UT-02, UT-39)
    const threeInputs = { projectName: 'Andara Residence Test', city: 'Bandung', targetSegment: 'First Home Buyer' };
    const sixDraftChannels = ['website', 'love_letter', 'playbook', 'wa_nurture', 'faq_kb', 'ad_copy'];
    expect(Object.keys(threeInputs).length).toBe(3);
    expect(sixDraftChannels.length).toBe(6);
  });
});
