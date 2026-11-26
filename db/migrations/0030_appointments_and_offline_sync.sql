-- Migration 0030: Appointment Scheduler (F56) & Offline Sync Queue (F97, F99, F100)

CREATE TABLE IF NOT EXISTS sales_os.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  se_email TEXT NOT NULL,
  lead_id UUID NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX IF NOT EXISTS idx_appointments_se_window
  ON sales_os.appointments (tenant_id, se_email, scheduled_start, scheduled_end)
  WHERE status IN ('SCHEDULED', 'CONFIRMED');

CREATE TABLE IF NOT EXISTS sales_os.offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_updated_at TIMESTAMPTZ NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'SYNCED' CHECK (sync_status IN ('SYNCED', 'CONFLICT', 'REJECTED')),
  conflict_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key)
);
