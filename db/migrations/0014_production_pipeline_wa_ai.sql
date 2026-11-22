-- ============================================================================
-- MIGRATION 0014: PRODUCTION PIPELINE, WHATSAPP BAILEYS ISOLATION & AI LEADS
-- Sesuai Sales Playbook, SOP & KPI SE The Park Townhouse v1.2 (Hal. 1-31)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS sales_os;
SET search_path TO sales_os, public;

-- 1. Tabel Sesi Autentikasi Produksi
CREATE TABLE IF NOT EXISTS sales_os.auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  user_name TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'pt-andara-rejo-makmur',
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 2. Tabel Pipeline Leads Resmi (10 Tahap Playbook §13.3 + BANT 0-12 §5.2 + Persona P1-P6 §3)
CREATE TABLE IF NOT EXISTS sales_os.pipeline_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'pt-andara-rejo-makmur',
  project_id TEXT NOT NULL DEFAULT 'proj-the-park-01',
  owner_se_email TEXT NOT NULL,
  owner_se_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone_wa TEXT NOT NULL,
  domicile TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'WhatsApp Inbound',
  content_code TEXT NOT NULL DEFAULT '',
  opt_in BOOLEAN NOT NULL DEFAULT TRUE,
  stage TEXT NOT NULL DEFAULT 'NEW' CHECK (
    stage IN (
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'APPOINTMENT',
      'VISITED',
      'HOT_NEGOTIATION',
      'BOOKING',
      'DP_KPR_PROCESS',
      'PPJB_AKAD',
      'CLOSED_LOST'
    )
  ),
  validity_status TEXT NOT NULL DEFAULT 'VALID' CHECK (
    validity_status IN ('VALID', 'PERLU_DILENGKAPI', 'TIDAK_VALID')
  ),
  persona_code TEXT NOT NULL DEFAULT 'P1' CHECK (
    persona_code IN ('P1', 'P2', 'P3', 'P4', 'P5', 'P6')
  ),
  persona_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  bant_b SMALLINT NOT NULL DEFAULT 0 CHECK (bant_b BETWEEN 0 AND 3),
  bant_a SMALLINT NOT NULL DEFAULT 0 CHECK (bant_a BETWEEN 0 AND 3),
  bant_n SMALLINT NOT NULL DEFAULT 0 CHECK (bant_n BETWEEN 0 AND 3),
  bant_t SMALLINT NOT NULL DEFAULT 0 CHECK (bant_t BETWEEN 0 AND 3),
  bant_total SMALLINT NOT NULL DEFAULT 0 CHECK (bant_total BETWEEN 0 AND 12),
  grade TEXT NOT NULL DEFAULT 'D' CHECK (grade IN ('A', 'B', 'C', 'D')),
  cluster_interest TEXT NOT NULL DEFAULT 'Nagoya',
  unit_interest TEXT NOT NULL DEFAULT 'Nagoya B.02 (LT 63/LB 75)',
  unit_price_idr BIGINT NOT NULL DEFAULT 650000000,
  payment_scheme TEXT NOT NULL DEFAULT 'KPR' CHECK (
    payment_scheme IN ('CASH_KERAS', 'CASH_TEMPO_12', 'CASH_TEMPO_24', 'KPR')
  ),
  appointment_at TIMESTAMPTZ,
  visited_at TIMESTAMPTZ,
  written_offer_sent BOOLEAN NOT NULL DEFAULT FALSE,
  booking_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
  dp_or_sp3k_verified BOOLEAN NOT NULL DEFAULT FALSE,
  next_action TEXT NOT NULL DEFAULT '',
  next_action_date DATE,
  sales_notes TEXT NOT NULL DEFAULT '',
  lost_reason TEXT,
  first_inbound_at TIMESTAMPTZ,
  first_reply_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, owner_se_email, phone_wa)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_leads_owner ON sales_os.pipeline_leads(owner_se_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_stage ON sales_os.pipeline_leads(stage, grade);

-- 3. Tabel Analisis AI per Lead (Pola andaraos + Kejelasan Input + Draf Pesan WA)
CREATE TABLE IF NOT EXISTS sales_os.lead_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES sales_os.pipeline_leads(id) ON DELETE CASCADE,
  owner_se_email TEXT NOT NULL,
  skor INTEGER NOT NULL DEFAULT 0 CHECK (skor BETWEEN 0 AND 100),
  label TEXT NOT NULL DEFAULT 'PERLU_PEMBINAAN',
  clarity_status TEXT NOT NULL DEFAULT 'JELAS' CHECK (clarity_status IN ('JELAS', 'PERLU_DILENGKAPI')),
  unclear_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  ringkas TEXT NOT NULL DEFAULT '',
  poin_kuat JSONB NOT NULL DEFAULT '[]'::jsonb,
  poin_lemah JSONB NOT NULL DEFAULT '[]'::jsonb,
  perlu_dicek_ulang JSONB NOT NULL DEFAULT '[]'::jsonb,
  rekomendasi JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_persona TEXT NOT NULL DEFAULT 'P1',
  recommended_bant JSONB NOT NULL DEFAULT '{}'::jsonb,
  followup_draft_message TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT 'andararejomakmurjosjis',
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_ai_analyses_lead ON sales_os.lead_ai_analyses(lead_id, created_at DESC);

-- 4. Tabel Sesi WhatsApp Baileys Terisolasi Ketat Per Akun SE (1 Nomor = 1 Akun)
CREATE TABLE IF NOT EXISTS sales_os.se_wa_sessions (
  se_email TEXT PRIMARY KEY,
  se_name TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'pt-andara-rejo-makmur',
  phone_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED' CHECK (
    status IN ('DISCONNECTED', 'QR_READY', 'CONNECTING', 'CONNECTED')
  ),
  qr_data_url TEXT,
  encrypted_creds TEXT,
  last_connected_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabel Metrik Pesan Masuk & Kecepatan Balas WA Per SE (Tanpa Menampilkan Chat Mentah)
CREATE TABLE IF NOT EXISTS sales_os.wa_contact_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  se_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  inbound_count INTEGER NOT NULL DEFAULT 0,
  outbound_count INTEGER NOT NULL DEFAULT 0,
  first_inbound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_inbound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_reply_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  sla_met BOOLEAN,
  linked_lead_id UUID REFERENCES sales_os.pipeline_leads(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (se_email, contact_phone)
);

-- 6. Buffer Pesan Masuk Sementara Terenkripsi (Dihapus Otomatis Setelah Analisis AI / <= 24 Jam)
CREATE TABLE IF NOT EXISTS sales_os.wa_inbound_temp_buffer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  se_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  encrypted_text TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 7. Tabel Aktivitas & Catatan Laporan Harian SE
CREATE TABLE IF NOT EXISTS sales_os.se_daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  se_email TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  dial_count INTEGER NOT NULL DEFAULT 0,
  connected_call_count INTEGER NOT NULL DEFAULT 0,
  canvassing_contacts INTEGER NOT NULL DEFAULT 0,
  canvassing_brochures INTEGER NOT NULL DEFAULT 0,
  canvassing_leads INTEGER NOT NULL DEFAULT 0,
  posted_reels INTEGER NOT NULL DEFAULT 0,
  posted_wa_status INTEGER NOT NULL DEFAULT 0,
  posted_stories INTEGER NOT NULL DEFAULT 0,
  hambatan_bantuan TEXT NOT NULL DEFAULT '',
  item_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (se_email, report_date)
);
