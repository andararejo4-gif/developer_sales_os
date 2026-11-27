-- Migration 0034: Dummy Payment Gateway Invoices (INT-I12, F65, F67, F77)
CREATE SCHEMA IF NOT EXISTS sales_os;

CREATE TABLE IF NOT EXISTS sales_os.payment_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
  invoice_no TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'SANDBOX_DUMMY_PG',
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('AIC_TOPUP', 'BOOKING_FEE')),
  reference_code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount_idr BIGINT NOT NULL CHECK (amount_idr > 0),
  aic_amount INTEGER NOT NULL DEFAULT 0,
  unit_code TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'EXPIRED', 'REFUNDED')),
  checkout_url TEXT NOT NULL,
  paid_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_invoices_tenant
  ON sales_os.payment_invoices (tenant_id, invoice_type, created_at DESC);
