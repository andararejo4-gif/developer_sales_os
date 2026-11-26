-- 0028_consent_suppression_registry.sql
-- Implementasi SEC-03, F92-BE, UT-06: Registry consent & suppression terpusat di PostgreSQL

CREATE TABLE IF NOT EXISTS sales_os.consent_suppression_list (
  tenant_id TEXT NOT NULL,
  normalized_phone TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL CHECK (status IN ('OPTED_IN', 'OPTED_OUT')),
  purpose TEXT NOT NULL DEFAULT 'marketing_followup',
  notice_version TEXT NOT NULL DEFAULT 'v1.5',
  source_message TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, normalized_phone, channel)
);

CREATE INDEX IF NOT EXISTS idx_consent_suppression_status
  ON sales_os.consent_suppression_list (tenant_id, status);
