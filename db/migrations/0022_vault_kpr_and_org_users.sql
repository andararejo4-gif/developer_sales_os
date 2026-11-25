-- Migration 0022: Vault Dokumen KPR & Pengajuan Bank KPR (Data Nyata PostgreSQL)
CREATE TABLE IF NOT EXISTS sales_os.vault_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  lead_id UUID REFERENCES sales_os.pipeline_leads(id) ON DELETE SET NULL,
  owner_se_email TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  unit_interest TEXT NOT NULL DEFAULT '',
  doc_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT NOT NULL DEFAULT '1.0 MB',
  status TEXT NOT NULL DEFAULT 'PERLU_REVIEW',
  reviewed_by TEXT,
  review_notes TEXT,
  access_granted_banks JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_docs_tenant_project
  ON sales_os.vault_documents (tenant_id, project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vault_docs_lead
  ON sales_os.vault_documents (lead_id);

CREATE TABLE IF NOT EXISTS sales_os.bank_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  lead_id UUID REFERENCES sales_os.pipeline_leads(id) ON DELETE SET NULL,
  owner_se_email TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL DEFAULT '',
  unit_code TEXT NOT NULL,
  cluster TEXT NOT NULL DEFAULT '',
  target_bank TEXT NOT NULL DEFAULT 'Bank BSI',
  plafond_amount BIGINT NOT NULL DEFAULT 0,
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'SUBMITTED_TO_BANK',
  status_notes TEXT NOT NULL DEFAULT '',
  assigned_analyst TEXT,
  sp3k_expiry_date DATE,
  source_mode TEXT NOT NULL DEFAULT 'LEAD_SELECTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_apps_tenant_project
  ON sales_os.bank_applications (tenant_id, project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bank_apps_lead
  ON sales_os.bank_applications (lead_id);
