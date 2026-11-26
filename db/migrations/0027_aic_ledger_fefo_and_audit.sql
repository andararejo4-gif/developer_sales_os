-- 0027_aic_ledger_fefo_and_audit.sql
-- Implementasi BIL-04 (Atomic & Immutable AIC Ledger), BIL-07 (FEFO Top-Up Lots),
-- BIL-14 (Idempotent Reserve/Settle/Refund), dan DAT-09 (Immutable Business Audit Log)

CREATE TABLE IF NOT EXISTS sales_os.aic_topup_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  lot_code TEXT NOT NULL,
  initial_aic INTEGER NOT NULL CHECK (initial_aic > 0),
  remaining_aic INTEGER NOT NULL CHECK (remaining_aic >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aic_topup_lots_fefo
  ON sales_os.aic_topup_lots (tenant_id, expires_at ASC, created_at ASC)
  WHERE remaining_aic > 0;

CREATE TABLE IF NOT EXISTS sales_os.aic_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  billable_event_id TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('RESERVE', 'SETTLE', 'REFUND', 'TOPUP', 'GRANT')),
  feature_id TEXT NOT NULL,
  amount_aic INTEGER NOT NULL CHECK (amount_aic >= 0),
  lot_id UUID REFERENCES sales_os.aic_topup_lots(id),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reserved_after INTEGER NOT NULL CHECK (reserved_after >= 0),
  actor_email TEXT,
  reason TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, billable_event_id, entry_type)
);

CREATE INDEX IF NOT EXISTS idx_aic_ledger_tenant_created
  ON sales_os.aic_ledger_entries (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sales_os.business_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  reason TEXT,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_audit_tenant_created
  ON sales_os.business_audit_log (tenant_id, created_at DESC);
