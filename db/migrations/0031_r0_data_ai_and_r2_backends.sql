-- Migration 0031: Legal Hold (DAT-11), AI Observability (AI-10), POI/Risk (F11), Claim Ledger (F14), Co-Broke (F80)

CREATE TABLE IF NOT EXISTS sales_os.legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  placed_by TEXT NOT NULL,
  released_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_holds_active
  ON sales_os.legal_holds (tenant_id, resource_type, resource_id)
  WHERE released_at IS NULL;

CREATE TABLE IF NOT EXISTS sales_os.ai_observability_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1.0',
  model_name TEXT NOT NULL DEFAULT 'deterministic-local',
  estimated_aic INTEGER NOT NULL DEFAULT 0,
  actual_aic INTEGER NOT NULL DEFAULT 0,
  outcome_status TEXT NOT NULL CHECK (outcome_status IN ('VALID', 'ESCALATED', 'CANCELLED', 'BLOCKED')),
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.project_poi_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  distance_meters INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  source_citation TEXT NOT NULL DEFAULT 'Survey Lapangan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.claim_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  proof_grade TEXT NOT NULL CHECK (proof_grade IN ('A', 'B', 'C', 'D')),
  source_citation TEXT NOT NULL,
  is_public_safe BOOLEAN NOT NULL DEFAULT TRUE,
  verified_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.cobroke_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  unit_code TEXT NOT NULL,
  broker_name TEXT NOT NULL,
  broker_phone TEXT NOT NULL DEFAULT '',
  deal_value_idr BIGINT NOT NULL,
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 2.00,
  cobroke_split_percent NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  status TEXT NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'NEGOTIATION', 'BOOKING', 'PAID', 'CANCELLED')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
