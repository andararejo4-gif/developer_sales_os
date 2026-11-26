-- 0029_security_outbox_approvals_stale.sql
-- Implementasi SEC-04 (Server-side Approval), SEC-13 (Dual Approval Rekening),
-- SEC-10 (Webhook Replay Defense), INF-10 (Durable Outbox & DLQ), DAT-04 / F06-BE (Change Propagation & Stale)

CREATE TABLE IF NOT EXISTS sales_os.server_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  approval_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  requires_dual BOOLEAN NOT NULL DEFAULT TRUE,
  requested_by TEXT NOT NULL,
  approver_1 TEXT,
  approved_1_at TIMESTAMPTZ,
  approver_2 TEXT,
  approved_2_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED_1', 'APPROVED', 'REJECTED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_approvals_tenant_status
  ON sales_os.server_approvals (tenant_id, status, expires_at);

CREATE TABLE IF NOT EXISTS sales_os.webhook_replay_nonces (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  tenant_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, event_id)
);

CREATE TABLE IF NOT EXISTS sales_os.durable_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  job_type TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'DLQ')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_durable_outbox_due
  ON sales_os.durable_outbox (status, next_retry_at)
  WHERE status = 'PENDING';

CREATE TABLE IF NOT EXISTS sales_os.asset_staleness_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  trigger_source TEXT NOT NULL,
  affected_asset_type TEXT NOT NULL,
  affected_asset_id TEXT NOT NULL,
  is_stale BOOLEAN NOT NULL DEFAULT TRUE,
  reason TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (tenant_id, project_id, affected_asset_type, affected_asset_id)
);
