-- Migration 0023: Feature Permissions (Per-User & Global Role), Escalations, Referrals, Complaints, Ad Campaigns, Module Configs
CREATE TABLE IF NOT EXISTS sales_os.feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('USER', 'ROLE')),
  target_user_id UUID REFERENCES sales_os.app_users(id) ON DELETE CASCADE,
  target_role TEXT,
  feature_key TEXT NOT NULL,
  can_create BOOLEAN NOT NULL DEFAULT TRUE,
  can_read BOOLEAN NOT NULL DEFAULT TRUE,
  can_update BOOLEAN NOT NULL DEFAULT TRUE,
  can_delete BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_permissions_unique
  ON sales_os.feature_permissions (
    tenant_id,
    scope_type,
    COALESCE(target_user_id::text, ''),
    COALESCE(target_role, ''),
    feature_key
  );

CREATE TABLE IF NOT EXISTS sales_os.escalation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  lead_id UUID REFERENCES sales_os.pipeline_leads(id) ON DELETE SET NULL,
  jenis TEXT NOT NULL,
  pembeli TEXT NOT NULL,
  unit TEXT NOT NULL,
  proyek TEXT NOT NULL,
  nilai TEXT NOT NULL,
  rekomendasi_ai TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Menunggu Review',
  requested_by TEXT NOT NULL,
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.referral_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  lead_id UUID REFERENCES sales_os.pipeline_leads(id) ON DELETE SET NULL,
  advocate_name TEXT NOT NULL,
  advocate_phone TEXT NOT NULL DEFAULT '',
  advocate_type TEXT NOT NULL DEFAULT 'KONSUMEN_PEMILIK',
  referred_friend_name TEXT NOT NULL,
  referred_friend_phone TEXT NOT NULL DEFAULT '',
  unit_interest TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'TERDAFTAR',
  reward_amount BIGINT NOT NULL DEFAULT 5000000,
  reward_status TEXT NOT NULL DEFAULT 'PENDING_AKAD',
  partner_role TEXT NOT NULL DEFAULT 'REFERRAL_PARTNER',
  lead_response_minutes INTEGER,
  sla_breach BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.partner_scheme_configs (
  project_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  config_json JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.complaint_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  ticket_no TEXT NOT NULL,
  unit_block TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  resident_phone TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dlp_expiry_date TEXT NOT NULL DEFAULT '',
  sla_target_hours INTEGER NOT NULL DEFAULT 24,
  status TEXT NOT NULL DEFAULT 'TIKET_BARU',
  technician_assigned TEXT,
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  spend_idr BIGINT NOT NULL DEFAULT 0,
  leads_count INTEGER NOT NULL DEFAULT 0,
  qualified_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AKTIF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.project_module_configs (
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  module_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, project_id, module_key)
);
