-- 0026_app_state_and_core_stores.sql
-- Penyimpanan state aplikasi terpusat di PostgreSQL untuk menggantikan localStorage murni (Tahap 1 & Tahap 2)

CREATE TABLE IF NOT EXISTS sales_os.app_state_kv (
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT '__global__',
  state_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, project_id, state_key)
);

CREATE INDEX IF NOT EXISTS idx_app_state_kv_tenant_project
  ON sales_os.app_state_kv (tenant_id, project_id);

CREATE INDEX IF NOT EXISTS idx_app_state_kv_updated_at
  ON sales_os.app_state_kv (updated_at DESC);
