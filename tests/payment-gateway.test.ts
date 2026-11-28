import { describe, expect, it } from 'bun:test';
import crypto from 'node:crypto';
import {
  paymentGateway,
  SandboxDummyPaymentAdapter,
  verifyMidtransSignature,
  mapMidtransStatus,
  getMidtransPublicConfig,
} from '../server/payment-gateway';
import { sql } from '../server/db';

describe('Midtrans Payment Gateway Adapter & Webhook Security', () => {
  it('memvalidasi signature SHA-512 Midtrans secara deterministik dan menolak payload palsu', () => {
    const serverKey = 'SB-Mid-server-TestKey123';
    const orderId = 'INV-MID-TEST-01';
    const statusCode = '200';
    const grossAmount = '250000.00';
    const validSig = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    expect(
      verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey: validSig, serverKey })
    ).toBe(true);
    expect(
      verifyMidtransSignature({ orderId, statusCode, grossAmount: '1000.00', signatureKey: validSig, serverKey })
    ).toBe(false);
    expect(
      verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey: 'bad-sig', serverKey })
    ).toBe(false);
  });

  it('memetakan status transaksi Midtrans (settlement/capture/expire/refund) dengan benar', () => {
    expect(mapMidtransStatus('settlement')).toBe('PAID');
    expect(mapMidtransStatus('capture', 'accept')).toBe('PAID');
    expect(mapMidtransStatus('capture', 'challenge')).toBe('PENDING');
    expect(mapMidtransStatus('pending')).toBe('PENDING');
    expect(mapMidtransStatus('expire')).toBe('EXPIRED');
    expect(mapMidtransStatus('cancel')).toBe('EXPIRED');
    expect(mapMidtransStatus('refund')).toBe('REFUNDED');
  });

  it('membaca konfigurasi Midtrans Sandbox dari environment tanpa membocorkan serverKey', () => {
    const pub = getMidtransPublicConfig();
    expect(['MIDTRANS_SANDBOX', 'MIDTRANS_PRODUCTION', 'SANDBOX_DUMMY_PG']).toContain(pub.provider);
    expect((pub as any).serverKey).toBeUndefined();
  });
});

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
