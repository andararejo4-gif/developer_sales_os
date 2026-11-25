-- Migration 0024: Master Knowledge AI Terpusat (Divisi IT + OCR Lokal)
CREATE TABLE IF NOT EXISTS sales_os.ai_central_knowledge (
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Master Knowledge AI Terpusat',
  master_markdown TEXT NOT NULL DEFAULT '',
  source_doc_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, project_id)
);
