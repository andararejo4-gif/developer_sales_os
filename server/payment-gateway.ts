import crypto from 'node:crypto';
import { sql } from './db';
import { appendAuditLog, grantTopupLotAtomic } from './aic-ledger';

export type PaymentInvoiceType = 'AIC_TOPUP' | 'BOOKING_FEE';
export type PaymentInvoiceStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED';

export interface CreateInvoiceInput {
  tenantId: string;
  projectId: string;
  invoiceType: PaymentInvoiceType;
  referenceCode: string;
  description: string;
  amountIdr: number;
  aicAmount?: number;
  unitCode?: string;
  customerName?: string;
  customerPhone?: string;
  finishUrl?: string;
  createdBy: string;
}

export interface PaymentGatewayAdapter {
  readonly providerName: string;
  createInvoice(input: CreateInvoiceInput): Promise<Record<string, any>>;
  signWebhookPayload(invoiceNo: string, status: PaymentInvoiceStatus, secret: string): string;
  verifyWebhookSignature(invoiceNo: string, status: PaymentInvoiceStatus, signature: string, secret: string): boolean;
  settleInvoice(params: {
    tenantId: string;
    invoiceNo: string;
    targetStatus: 'PAID' | 'EXPIRED' | 'REFUNDED';
    actorEmail: string;
  }): Promise<{ ok: boolean; invoice?: Record<string, any>; alreadySettled?: boolean; error?: string }>;
}

const DEFAULT_SANDBOX_SECRET = process.env.DUMMY_PG_WEBHOOK_SECRET || 'devos-sandbox-pg-hmac-2026';

export class SandboxDummyPaymentAdapter implements PaymentGatewayAdapter {
  readonly providerName = 'SANDBOX_DUMMY_PG';

  async createInvoice(input: CreateInvoiceInput): Promise<Record<string, any>> {
    const cleanAmount = Math.max(1000, Math.round(input.amountIdr));
    const invoiceNo = `INV-SIM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const checkoutUrl = `/api/payments/sandbox-checkout/${encodeURIComponent(invoiceNo)}`;
    const rows = await sql`
      INSERT INTO sales_os.payment_invoices (
        tenant_id, project_id, invoice_no, provider, invoice_type, reference_code,
        description, amount_idr, aic_amount, unit_code, customer_name, customer_phone,
        status, checkout_url, created_by
      ) VALUES (
        ${input.tenantId}, ${input.projectId}, ${invoiceNo}, ${this.providerName}, ${input.invoiceType},
        ${input.referenceCode}, ${input.description}, ${cleanAmount}, ${Math.max(0, Math.round(input.aicAmount || 0))},
        ${input.unitCode || null}, ${input.customerName || null}, ${input.customerPhone || null},
        'PENDING', ${checkoutUrl}, ${input.createdBy}
      )
      RETURNING *
    `;
    return rows[0];
  }

  signWebhookPayload(invoiceNo: string, status: PaymentInvoiceStatus, secret = DEFAULT_SANDBOX_SECRET): string {
    return crypto.createHmac('sha256', secret).update(`${invoiceNo}:${status}`).digest('hex');
  }

  verifyWebhookSignature(
    invoiceNo: string,
    status: PaymentInvoiceStatus,
    signature: string,
    secret = DEFAULT_SANDBOX_SECRET
  ): boolean {
    const expected = this.signWebhookPayload(invoiceNo, status, secret);
    if (signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  async settleInvoice(params: {
    tenantId: string;
    invoiceNo: string;
    targetStatus: 'PAID' | 'EXPIRED' | 'REFUNDED';
    actorEmail: string;
  }): Promise<{ ok: boolean; invoice?: Record<string, any>; alreadySettled?: boolean; error?: string }> {
    const existing = await sql`
      SELECT * FROM sales_os.payment_invoices
      WHERE tenant_id = ${params.tenantId} AND invoice_no = ${params.invoiceNo}
      LIMIT 1
    `;
    if (existing.length === 0) {
      return { ok: false, error: 'Invoice tidak ditemukan.' };
    }
    const inv = existing[0];
    if (inv.status === params.targetStatus) {
      return { ok: true, invoice: inv, alreadySettled: true };
    }
    if (inv.status === 'PAID' && params.targetStatus === 'EXPIRED') {
      return { ok: false, error: 'Invoice yang sudah lunas tidak dapat di-expire.' };
    }

    // Verifikasi HMAC internal agar jalur sandbox mematuhi kontrak SEC-10
    const sig = this.signWebhookPayload(params.invoiceNo, params.targetStatus);
    if (!this.verifyWebhookSignature(params.invoiceNo, params.targetStatus, sig)) {
      return { ok: false, error: 'Signature webhook tidak valid.' };
    }

    const updated = await sql`
      UPDATE sales_os.payment_invoices
      SET status = ${params.targetStatus},
          paid_at = ${params.targetStatus === 'PAID' ? sql`NOW()` : sql`paid_at`},
          updated_at = NOW()
      WHERE id = ${inv.id}
      RETURNING *
    `;
    const nextInv = updated[0];

    if (params.targetStatus === 'PAID') {
      if (inv.invoice_type === 'AIC_TOPUP' && Number(inv.aic_amount || 0) > 0) {
        const exp = new Date();
        exp.setMonth(exp.getMonth() + 3);
        await grantTopupLotAtomic({
          tenantId: params.tenantId,
          billableEventId: `pg_topup_${inv.invoice_no}`,
          lotCode: `PG-${inv.invoice_no}`,
          amountAic: Number(inv.aic_amount),
          expiresAt: exp.toISOString(),
          actorEmail: params.actorEmail,
          actorRole: 'SYSTEM',
        });
        await sql`
          INSERT INTO sales_os.tenant_aic_wallets (tenant_id, balance_aic, total_aic_granted)
          VALUES (${params.tenantId}, ${Number(inv.aic_amount)}, ${Number(inv.aic_amount)})
          ON CONFLICT (tenant_id) DO UPDATE SET
            balance_aic = sales_os.tenant_aic_wallets.balance_aic + ${Number(inv.aic_amount)},
            total_aic_granted = sales_os.tenant_aic_wallets.total_aic_granted + ${Number(inv.aic_amount)},
            updated_at = NOW()
        `;
      } else if (inv.invoice_type === 'BOOKING_FEE' && inv.unit_code) {
        await sql`
          UPDATE sales_os.project_units
          SET status = 'booked', updated_at = NOW()
          WHERE tenant_id = ${params.tenantId}
            AND project_id = ${String(inv.project_id || 'the-park-sukoharjo')}
            AND unit_code = ${String(inv.unit_code)}
        `;
      }
    }

    await appendAuditLog({
      tenantId: params.tenantId,
      actorEmail: params.actorEmail,
      actorRole: 'SYSTEM',
      action: `PAYMENT_${params.targetStatus}`,
      resourceType: 'payment_invoice',
      resourceId: String(inv.invoice_no),
      payload: {
        provider: this.providerName,
        invoiceType: inv.invoice_type,
        amountIdr: Number(inv.amount_idr),
        unitCode: inv.unit_code || null,
        aicAmount: Number(inv.aic_amount || 0),
      },
    });

    return { ok: true, invoice: nextInv, alreadySettled: false };
  }
}

export const paymentGateway: PaymentGatewayAdapter = new SandboxDummyPaymentAdapter();

export interface MidtransConfig {
  isProduction: boolean;
  merchantId: string;
  serverKey: string;
  clientKey: string;
  snapUrl: string;
  coreApiUrl: string;
}

export function getMidtransConfig(): MidtransConfig {
  const isProduction = String(process.env.MIDTRANS_IS_PRODUCTION || 'false').toLowerCase() === 'true';
  return {
    isProduction,
    merchantId: String(process.env.MIDTRANS_MERCHANT_ID || '').trim(),
    serverKey: String(process.env.MIDTRANS_SERVER_KEY || '').trim(),
    clientKey: String(process.env.MIDTRANS_CLIENT_KEY || '').trim(),
    snapUrl: isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
    coreApiUrl: isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2',
  };
}

export function getMidtransPublicConfig() {
  const cfg = getMidtransConfig();
  const provider =
    String(process.env.PAYMENT_PROVIDER || '').toLowerCase() === 'midtrans' && cfg.serverKey
      ? cfg.isProduction
        ? 'MIDTRANS_PRODUCTION'
        : 'MIDTRANS_SANDBOX'
      : 'SANDBOX_DUMMY_PG';
  return {
    provider,
    isProduction: cfg.isProduction,
    merchantId: cfg.merchantId,
    clientKey: cfg.clientKey,
    configured: Boolean(cfg.serverKey && cfg.clientKey),
  };
}

export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  serverKey?: string;
}): boolean {
  const key = params.serverKey ?? getMidtransConfig().serverKey;
  if (!key || !params.signatureKey) return false;
  const expected = crypto
    .createHash('sha512')
    .update(`${params.orderId}${params.statusCode}${params.grossAmount}${key}`)
    .digest('hex');
  if (params.signatureKey.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(params.signatureKey), Buffer.from(expected));
}

export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): PaymentInvoiceStatus {
  const st = String(transactionStatus || '').toLowerCase();
  const fraud = String(fraudStatus || '').toLowerCase();
  if (st === 'settlement') return 'PAID';
  if (st === 'capture') return fraud === 'challenge' || fraud === 'deny' ? 'PENDING' : 'PAID';
  if (st === 'refund' || st === 'partial_refund') return 'REFUNDED';
  if (st === 'expire' || st === 'cancel' || st === 'deny') return 'EXPIRED';
  return 'PENDING';
}

/** Adapter pembayaran Midtrans Snap API (Sandbox / Production). */
export class MidtransPaymentAdapter extends SandboxDummyPaymentAdapter {
  readonly providerName: string;

  constructor() {
    super();
    this.providerName = getMidtransConfig().isProduction ? 'MIDTRANS_PRODUCTION' : 'MIDTRANS_SANDBOX';
  }

  override async createInvoice(input: CreateInvoiceInput): Promise<Record<string, any>> {
    const cfg = getMidtransConfig();
    if (!cfg.serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi di .env');
    }

    const cleanAmount = Math.max(1000, Math.round(input.amountIdr));
    const invoiceNo = `INV-MID-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const authHeader = `Basic ${Buffer.from(`${cfg.serverKey}:`).toString('base64')}`;
    const baseAppUrl = String(process.env.PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const finishUrl = input.finishUrl || `${baseAppUrl}/checkout/${encodeURIComponent(invoiceNo)}`;

    const snapPayload = {
      transaction_details: {
        order_id: invoiceNo,
        gross_amount: cleanAmount,
      },
      item_details: [
        {
          id: input.referenceCode.slice(0, 50),
          price: cleanAmount,
          quantity: 1,
          name: input.description.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: (input.customerName || 'Developer Partner').slice(0, 50),
        email: input.createdBy.includes('@') ? input.createdBy : 'billing@andararejomakmur.co.id',
        phone: input.customerPhone || '081100000000',
      },
      callbacks: {
        finish: finishUrl,
      },
      custom_field1: input.tenantId,
      custom_field2: input.invoiceType,
    };

    const snapRes = await fetch(cfg.snapUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(snapPayload),
    });

    const snapJson = (await snapRes.json().catch(() => ({}))) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!snapRes.ok || !snapJson.redirect_url) {
      const msg = snapJson.error_messages?.join(', ') || `HTTP ${snapRes.status}`;
      throw new Error(`Midtrans Snap gagal membuat transaksi: ${msg}`);
    }

    const rows = await sql`
      INSERT INTO sales_os.payment_invoices (
        tenant_id, project_id, invoice_no, provider, invoice_type, reference_code,
        description, amount_idr, aic_amount, unit_code, customer_name, customer_phone,
        status, checkout_url, created_by
      ) VALUES (
        ${input.tenantId}, ${input.projectId}, ${invoiceNo}, ${this.providerName}, ${input.invoiceType},
        ${input.referenceCode}, ${input.description}, ${cleanAmount}, ${Math.max(0, Math.round(input.aicAmount || 0))},
        ${input.unitCode || null}, ${input.customerName || null}, ${input.customerPhone || null},
        'PENDING', ${snapJson.redirect_url}, ${input.createdBy}
      )
      RETURNING *
    `;
    return rows[0];
  }
}

export function getActivePaymentGateway(): PaymentGatewayAdapter {
  const pub = getMidtransPublicConfig();
  if (pub.provider !== 'SANDBOX_DUMMY_PG') {
    return new MidtransPaymentAdapter();
  }
  return paymentGateway;
}

export async function handleMidtransWebhook(payload: Record<string, any>) {
  const orderId = String(payload.order_id || '').trim();
  const statusCode = String(payload.status_code || '').trim();
  const grossAmount = String(payload.gross_amount || '').trim();
  const signatureKey = String(payload.signature_key || '').trim();
  const transactionStatus = String(payload.transaction_status || '').trim();
  const fraudStatus = payload.fraud_status ? String(payload.fraud_status) : undefined;

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    return { ok: false, status: 400, error: 'Payload webhook Midtrans tidak lengkap.' };
  }

  if (!verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey })) {
    return { ok: false, status: 403, error: 'Signature Midtrans tidak valid.' };
  }

  const rows = await sql`
    SELECT * FROM sales_os.payment_invoices
    WHERE invoice_no = ${orderId}
    LIMIT 1
  `;
  if (rows.length === 0) {
    return { ok: false, status: 404, error: 'Invoice tidak ditemukan.' };
  }
  const inv = rows[0];
  if (Math.round(Number(inv.amount_idr)) !== Math.round(Number(grossAmount))) {
    return { ok: false, status: 400, error: 'Nominal gross_amount tidak sesuai dengan invoice.' };
  }

  const targetStatus = mapMidtransStatus(transactionStatus, fraudStatus);
  if (targetStatus === 'PENDING') {
    return { ok: true, status: 200, invoice: inv, pending: true };
  }

  const settled = await getActivePaymentGateway().settleInvoice({
    tenantId: String(inv.tenant_id),
    invoiceNo: String(inv.invoice_no),
    targetStatus,
    actorEmail: 'midtrans-webhook@system',
  });
  return { ok: settled.ok, status: settled.ok ? 200 : 400, ...settled };
}

export async function checkMidtransTransactionStatus(tenantId: string, invoiceNo: string) {
  const cfg = getMidtransConfig();
  if (!cfg.serverKey) {
    return { ok: false, error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi.' };
  }
  const rows = await sql`
    SELECT * FROM sales_os.payment_invoices
    WHERE tenant_id = ${tenantId} AND invoice_no = ${invoiceNo}
    LIMIT 1
  `;
  if (rows.length === 0) {
    return { ok: false, error: 'Invoice tidak ditemukan.' };
  }

  const authHeader = `Basic ${Buffer.from(`${cfg.serverKey}:`).toString('base64')}`;
  const res = await fetch(`${cfg.coreApiUrl}/${encodeURIComponent(invoiceNo)}/status`, {
    headers: { Accept: 'application/json', Authorization: authHeader },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok) {
    return { ok: false, error: data.status_message || `Midtrans status HTTP ${res.status}` };
  }

  const targetStatus = mapMidtransStatus(String(data.transaction_status || ''), data.fraud_status);
  if (targetStatus === 'PENDING') {
    return { ok: true, invoice: rows[0], midtransStatus: data.transaction_status, pending: true };
  }

  const settled = await getActivePaymentGateway().settleInvoice({
    tenantId,
    invoiceNo,
    targetStatus,
    actorEmail: 'midtrans-status-sync@system',
  });
  return { ...settled, midtransStatus: data.transaction_status };
}
