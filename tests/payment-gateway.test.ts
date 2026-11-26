import { describe, expect, it } from 'bun:test';
import { paymentGateway, SandboxDummyPaymentAdapter } from '../server/payment-gateway';
import { sql } from '../server/db';

describe('Dummy Payment Gateway Adapter (INT-I12, F65, F67)', () => {
  it('memvalidasi HMAC webhook signature secara deterministik dan menolak signature palsu', () => {
    const adapter = new SandboxDummyPaymentAdapter();
    const sig = adapter.signWebhookPayload('INV-SIM-TEST1', 'PAID');
    expect(adapter.verifyWebhookSignature('INV-SIM-TEST1', 'PAID', sig)).toBe(true);
    expect(adapter.verifyWebhookSignature('INV-SIM-TEST1', 'PAID', 'invalid-sig')).toBe(false);
    expect(adapter.verifyWebhookSignature('INV-SIM-TEST1', 'EXPIRED', sig)).toBe(false);
  });

  it('membuat invoice AIC Top-up dummy dan melakukan settlement idempoten ke PostgreSQL', async () => {
    const tenantId = 'test_pg_tenant';
    const inv = await paymentGateway.createInvoice({
      tenantId,
      projectId: 'the-park-sukoharjo',
      invoiceType: 'AIC_TOPUP',
      referenceCode: 'AIC-1000',
      description: 'Top-up Simulasi 1000 AIC',
      amountIdr: 250000,
      aicAmount: 1000,
      createdBy: 'it@andararejomakmur.co.id',
    });

    expect(inv.status).toBe('PENDING');
    expect(inv.provider).toBe('SANDBOX_DUMMY_PG');

    const first = await paymentGateway.settleInvoice({
      tenantId,
      invoiceNo: String(inv.invoice_no),
      targetStatus: 'PAID',
      actorEmail: 'it@andararejomakmur.co.id',
    });
    expect(first.ok).toBe(true);
    expect(first.alreadySettled).toBe(false);
    expect(first.invoice?.status).toBe('PAID');

    const second = await paymentGateway.settleInvoice({
      tenantId,
      invoiceNo: String(inv.invoice_no),
      targetStatus: 'PAID',
      actorEmail: 'it@andararejomakmur.co.id',
    });
    expect(second.ok).toBe(true);
    expect(second.alreadySettled).toBe(true);

    // Cleanup test rows
    await sql`DELETE FROM sales_os.payment_invoices WHERE tenant_id = ${tenantId}`;
    await sql`DELETE FROM sales_os.aic_ledger_entries WHERE tenant_id = ${tenantId}`;
    await sql`DELETE FROM sales_os.aic_topup_lots WHERE tenant_id = ${tenantId}`;
    await sql`DELETE FROM sales_os.tenant_aic_wallets WHERE tenant_id = ${tenantId}`;
  });
});
