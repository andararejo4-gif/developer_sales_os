-- Migration 0019: Document Truth, Evidence Registry & Conflict Inbox (F01, F02, F04, F05, F06)
CREATE TABLE IF NOT EXISTS sales_os.source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
  project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
  doc_type TEXT NOT NULL DEFAULT 'pricelist',
  filename TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  extracted_markdown TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_documents_tenant_project
  ON sales_os.source_documents (tenant_id, project_id, status);

CREATE TABLE IF NOT EXISTS sales_os.evidence_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES sales_os.source_documents(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  unit_code TEXT,
  fact_key TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
  extraction_method TEXT NOT NULL DEFAULT 'text',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.truth_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  document_id UUID REFERENCES sales_os.source_documents(id) ON DELETE SET NULL,
  unit_code TEXT,
  fact_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  question_for_pic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_by TEXT,
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
