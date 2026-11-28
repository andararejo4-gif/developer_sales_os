import crypto from 'node:crypto';
import { sql } from './db';
import { appendAuditLog, grantTopupLotAtomic } from './aic-ledger';

export type PaymentInvoiceType = 'AIC_TOPUP' | 'BOOKING_FEE' | 'PLAN_SUBSCRIPTION';
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
      if (inv.invoice_type === 'PLAN_SUBSCRIPTION') {
        const ref = String(inv.reference_code || '').toUpperCase();
        const planCode = ref.includes('DIAMOND') ? 'diamond' : ref.includes('GOLD') ? 'gold' : 'platinum';
        await sql`
          UPDATE sales_os.tenants
          SET plan_code = ${planCode},
              status = 'ACTIVE',
              updated_at = NOW()
          WHERE tenant_id = ${params.tenantId}
        `;
        if (Number(inv.aic_amount || 0) > 0) {
          const exp = new Date();
          exp.setMonth(exp.getMonth() + 3);
          await grantTopupLotAtomic({
            tenantId: params.tenantId,
            billableEventId: `pg_plan_${inv.invoice_no}`,
            lotCode: `PLAN-${planCode.toUpperCase()}-${inv.invoice_no}`,
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
        }
      } else if (inv.invoice_type === 'AIC_TOPUP' && Number(inv.aic_amount || 0) > 0) {
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
