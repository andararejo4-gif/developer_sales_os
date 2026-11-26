-- Migration 0025: Paket 1 + Paket 2 Program Kreator (Clipper, Live, KOL) & Pelacakan k=/c=
ALTER TABLE sales_os.pipeline_leads
  ADD COLUMN IF NOT EXISTS creator_code TEXT,
  ADD COLUMN IF NOT EXISTS content_code TEXT,
  ADD COLUMN IF NOT EXISTS persona_code TEXT,
  ADD COLUMN IF NOT EXISTS assist_creator_code TEXT;

CREATE INDEX IF NOT EXISTS idx_pipeline_leads_creator_code
  ON sales_os.pipeline_leads (tenant_id, creator_code)
  WHERE creator_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS sales_os.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  creator_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN ('AFILIATOR_CLIPPER', 'AFILIATOR_LIVE', 'AFILIATOR_KOL')),
  platform TEXT NOT NULL DEFAULT 'TikTok',
  social_handle TEXT NOT NULL DEFAULT '',
  phone_wa TEXT NOT NULL DEFAULT '',
  kyc_status TEXT NOT NULL DEFAULT 'TERVERIFIKASI' CHECK (kyc_status IN ('PENDING', 'TERVERIFIKASI', 'DITOLAK')),
  tier TEXT NOT NULL DEFAULT 'AKTIF' CHECK (tier IN ('KANDIDAT', 'AKTIF', 'TERSERTIFIKASI', 'PREFERRED', 'MENTOR')),
  integrity_score INTEGER NOT NULL DEFAULT 100,
  monthly_cap_idr BIGINT NOT NULL DEFAULT 3000000,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'SUSPENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_profiles_code_unique
  ON sales_os.creator_profiles (tenant_id, project_id, creator_code);

CREATE TABLE IF NOT EXISTS sales_os.creator_content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  creator_code TEXT NOT NULL,
  content_code TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('KLIP', 'LIVE', 'KOL')),
  platform TEXT NOT NULL DEFAULT 'TikTok',
  content_url TEXT NOT NULL,
  raw_views INTEGER NOT NULL DEFAULT 0,
  verified_views INTEGER NOT NULL DEFAULT 0,
  session_minutes INTEGER NOT NULL DEFAULT 0,
  flat_fee_idr BIGINT NOT NULL DEFAULT 0,
  audit_status TEXT NOT NULL DEFAULT 'UNDER_REVIEW' CHECK (audit_status IN ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
  audit_notes TEXT NOT NULL DEFAULT '',
  gross_amount_idr BIGINT NOT NULL DEFAULT 0,
  capped_amount_idr BIGINT NOT NULL DEFAULT 0,
  lock_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_content_metrics_project
  ON sales_os.creator_content_metrics (tenant_id, project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sales_os.creator_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  creator_code TEXT NOT NULL,
  pocket TEXT NOT NULL CHECK (pocket IN ('A', 'B')),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('CPM', 'LIVE_FEE', 'KOL_FLAT', 'QL_BONUS', 'VISIT_BONUS', 'SOURCE_FEE', 'ASSIST_FEE')),
  reference_id TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  gross_amount_idr BIGINT NOT NULL DEFAULT 0,
  tax_pph_idr BIGINT NOT NULL DEFAULT 0,
  net_amount_idr BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ESTIMATE' CHECK (status IN ('ESTIMATE', 'PENDING', 'ACCRUED', 'ON_HOLD', 'APPROVED', 'PAID', 'REVERSED')),
  approved_by TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_ledger_project
  ON sales_os.creator_ledger_entries (tenant_id, project_id, created_at DESC);
