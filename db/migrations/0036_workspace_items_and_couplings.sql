-- Migration 0036: Tenant Workspace Items (CRUD) & Round-Robin Cursors (F08-F10, F16, F22/F24, F46, F58, F65, F71, F73, F76, F81-F83)
CREATE SCHEMA IF NOT EXISTS sales_os;

CREATE TABLE IF NOT EXISTS sales_os.tenant_workspace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
  module_key TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  ref_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_items_tenant_mod
  ON sales_os.tenant_workspace_items (tenant_id, project_id, module_key, created_at DESC);

CREATE TABLE IF NOT EXISTS sales_os.round_robin_cursors (
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  last_se_email TEXT NOT NULL,
  cursor_index INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, project_id)
);
