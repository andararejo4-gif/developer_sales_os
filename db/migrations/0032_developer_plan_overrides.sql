CREATE TABLE IF NOT EXISTS sales_os.developer_plan_overrides (
  developer_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
  company_name TEXT NOT NULL DEFAULT '',
  original_plan TEXT NOT NULL DEFAULT 'Platinum',
  overridden_plan TEXT NOT NULL CHECK (overridden_plan IN ('Gold', 'Platinum', 'Diamond')),
  overridden_by TEXT NOT NULL DEFAULT 'Tim IT Internal (SUPERADMIN_IT)',
  reason TEXT NOT NULL DEFAULT '',
  valid_until TEXT NOT NULL DEFAULT '30 Hari',
  overridden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_developer_plan_overrides_tenant
  ON sales_os.developer_plan_overrides (tenant_id);
