-- Migration 0020: AI Nurture Cadence Templates & Jobs (F55)
CREATE TABLE IF NOT EXISTS sales_os.wa_cadence_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
  project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
  step_code TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  step_label TEXT NOT NULL,
  delay_hours NUMERIC(8, 2) NOT NULL DEFAULT 24,
  step_goal TEXT NOT NULL,
  auto_send BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, project_id, step_code)
);

CREATE TABLE IF NOT EXISTS sales_os.wa_nurture_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
  project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
  lead_id UUID NOT NULL,
  se_email TEXT NOT NULL,
  step_code TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 1,
  scheduled_at TIMESTAMPTZ NOT NULL,
  draft_message TEXT NOT NULL DEFAULT '',
  is_edited_by_se BOOLEAN NOT NULL DEFAULT FALSE,
  ai_model TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_id, step_code)
);

CREATE INDEX IF NOT EXISTS idx_wa_nurture_jobs_due
  ON sales_os.wa_nurture_jobs (status, scheduled_at)
  WHERE status = 'SCHEDULED';
