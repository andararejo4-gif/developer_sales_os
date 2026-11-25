-- Migration 0018: Unit Inventory State Machine, DB Lock & Quote Engine (F67, F68, F69)
CREATE TABLE IF NOT EXISTS sales_os.project_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
  project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
  unit_code TEXT NOT NULL,
  cluster TEXT NOT NULL DEFAULT 'The Park Townhouse',
  unit_type TEXT NOT NULL DEFAULT '2 Lantai',
  lt_sqm NUMERIC(10, 2) NOT NULL DEFAULT 0,
  lb_sqm NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_cash BIGINT NOT NULL,
  price_kpr BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  hold_by_se TEXT,
  hold_lead_id TEXT,
  hold_expires_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, project_id, unit_code)
);

CREATE INDEX IF NOT EXISTS idx_project_units_tenant_status
  ON sales_os.project_units (tenant_id, project_id, status);

CREATE TABLE IF NOT EXISTS sales_os.unit_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES sales_os.project_units(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  reason TEXT,
  lead_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.unit_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_no TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
  project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
  unit_id UUID NOT NULL REFERENCES sales_os.project_units(id) ON DELETE CASCADE,
  lead_id TEXT,
  scheme TEXT NOT NULL,
  unit_price BIGINT NOT NULL,
  dp_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  dp_amount BIGINT NOT NULL DEFAULT 0,
  principal_amount BIGINT NOT NULL DEFAULT 0,
  tenor_months INTEGER NOT NULL DEFAULT 0,
  interest_rate_annual NUMERIC(5, 2) NOT NULL DEFAULT 0,
  monthly_installment BIGINT NOT NULL DEFAULT 0,
  unknown_components JSONB NOT NULL DEFAULT '[]'::jsonb,
  breakdown_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
