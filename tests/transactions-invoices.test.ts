import { describe, expect, it } from 'bun:test';
import { getViewFromPathname, VIEW_PATHS } from '../src/lib/navigation/router';
import { PLAN_CATALOG_CONFIG } from '../server/tenant-guard';
import { paymentGateway, type PaymentInvoiceType } from '../server/payment-gateway';
import { InvoiceDetailModal, TransactionsInvoicesPage } from '../src/components/billing/TransactionsInvoicesPage';

describe('Halaman Transaksi & Invoice Paket Developer', () => {
  it('mendaftarkan rute /transaksi pada router dashboard', () => {
    expect(VIEW_PATHS.transaksi).toBe('/transaksi');
    expect(getViewFromPathname('/transaksi')).toBe('transaksi');
  });

  it('mendukung tipe invoice PLAN_SUBSCRIPTION pada payment gateway & katalog paket', () => {
    const planType: PaymentInvoiceType = 'PLAN_SUBSCRIPTION';
    expect(planType).toBe('PLAN_SUBSCRIPTION');
    expect(PLAN_CATALOG_CONFIG.gold.priceIdr).toBe(4_900_000);
    expect(PLAN_CATALOG_CONFIG.platinum.priceIdr).toBe(9_900_000);
    expect(PLAN_CATALOG_CONFIG.diamond.priceIdr).toBe(19_900_000);

    const sig = paymentGateway.signWebhookPayload('INV-TEST-001', 'PAID');
    expect(paymentGateway.verifyWebhookSignature('INV-TEST-001', 'PAID', sig)).toBe(true);
  });

  it('mengekspor komponen TransactionsInvoicesPage dan InvoiceDetailModal', () => {
    expect(typeof TransactionsInvoicesPage).toBe('function');
    expect(typeof InvoiceDetailModal).toBe('function');
  });
});
