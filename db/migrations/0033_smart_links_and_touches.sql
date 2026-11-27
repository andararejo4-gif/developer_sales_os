-- Migration 0033: Smart Links (/c/:code) & Touch Attribution Events (ARM-DSOS-CLK-TPTH-2026-02)
CREATE SCHEMA IF NOT EXISTS sales_os;

CREATE TABLE IF NOT EXISTS sales_os.smart_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  partner_role TEXT NOT NULL DEFAULT 'CREATOR',
  creator_code TEXT NOT NULL,
  content_code TEXT,
  persona_code TEXT,
  target_url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smart_links_tenant_project
  ON sales_os.smart_links (tenant_id, project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sales_os.link_touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  short_code TEXT NOT NULL,
  creator_code TEXT NOT NULL,
  content_code TEXT,
  touch_type TEXT NOT NULL DEFAULT 'CLICK',
  referrer TEXT,
  user_agent_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_touches_code
  ON sales_os.link_touches (short_code, created_at DESC);
