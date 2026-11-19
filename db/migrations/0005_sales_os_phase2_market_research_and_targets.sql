-- ============================================================================
-- MIGRATION 0005: SALES_OS PHASE 2 - MARKET RESEARCH & SALES TARGETS
-- Developer Sales OS (developerproperti.giivepro.com)
-- Multi-Tenant Project-Isolated Market Intelligence & 100% Sold Out Velocity
-- ============================================================================

-- 1. Status Riset Pasar & Target
DO $$ BEGIN
  CREATE TYPE status_dokumen_proyek AS ENUM ('DRAFT', 'GENERATING', 'COMPLETED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE skenario_penjualan AS ENUM ('konservatif', 'realistis', 'optimis');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tabel Riset Pasar (market_research)
-- Menyimpan persona target (min 5), fasilitas publik & kompetitor per cincin radius (500m - 25km), serta analisis pangsa pasar
CREATE TABLE IF NOT EXISTS market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL DEFAULT 'Riset Pasar & Analisis Kompetisi',
  
  -- 5 Persona target terstruktur (demografi, kebutuhan, keberatan, kanal, pemicu beli, fact_id sitasi)
  personas JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Fasilitas publik per 9 cincin radius (500m, 1km, 2km, 3km, 5km, 10km, 15km, 20km, 25km)
  public_facilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Kompetitor per cincin radius dengan analisis keunggulan/kelemahan vs proyek
  competitors JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Analisis pangsa pasar (market share breakdown, price per m2, positioning SVG data)
  market_share_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  status status_dokumen_proyek NOT NULL DEFAULT 'COMPLETED',
  prompt_used TEXT,
  model_used VARCHAR(100) DEFAULT 'gemini-1.5-pro',
  tokens_used INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_project_market_research_version UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_market_research_tenant_project ON market_research(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_market_research_version ON market_research(project_id, version DESC);

-- 3. Tabel Target Penjualan (sales_targets)
-- Menyimpan rencana kecepatan penjualan per bulan hingga 100% terjual dengan 3 skenario
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL DEFAULT 'Target Penjualan & Rencana Menuju Sold Out 100%',
  
  total_units INTEGER NOT NULL,
  avg_price_idr NUMERIC(15, 2) NOT NULL,
  total_target_revenue NUMERIC(15, 2) NOT NULL,
  
  -- 3 Skenario: konservatif, realistis, optimis (kecepatan unit/bulan, durasi bulan sampai sold out)
  scenarios JSONB NOT NULL DEFAULT '{
    "konservatif": { "units_per_month": 2, "months_to_sold_out": 15 },
    "realistis": { "units_per_month": 3, "months_to_sold_out": 10 },
    "optimis": { "units_per_month": 5, "months_to_sold_out": 6 }
  }'::jsonb,
  
  selected_scenario skenario_penjualan NOT NULL DEFAULT 'realistis',
  
  -- Jadwal per bulan: bulan ke-1 s.d N (target_unit, kumulatif, sisa, omset, reverse_funnel)
  monthly_schedules JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Pembagian kuota target per Sales Executive berdasarkan headcount tim
  se_headcount INTEGER NOT NULL DEFAULT 3,
  se_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metrik reverse funnel rata-rata (leads -> kontak -> survey -> booking -> closing)
  funnel_conversion_rates JSONB NOT NULL DEFAULT '{
    "closing_to_booking_ratio": 1.5,
    "booking_to_survey_ratio": 4.0,
    "survey_to_prospect_ratio": 2.5,
    "prospect_to_contact_ratio": 2.0,
    "contact_to_lead_ratio": 3.0
  }'::jsonb,

  status status_dokumen_proyek NOT NULL DEFAULT 'COMPLETED',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_project_sales_targets_version UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_sales_targets_tenant_project ON sales_targets(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_sales_targets_version ON sales_targets(project_id, version DESC);

-- 4. Tabel Jalur Proyek (project_pipeline_stages)
-- Melacak status berurutan tiap tahap (Input -> Surat Cinta 99 -> Riset -> Target -> Kalender -> Playbook -> Rute -> Website)
CREATE TABLE IF NOT EXISTS project_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  stage_order INTEGER NOT NULL,
  stage_key VARCHAR(50) NOT NULL, -- 'input', 'surat_cinta_99', 'riset_pasar', 'target_penjualan', 'kalender_konten', 'playbook', 'rute_harian', 'website_landing'
  stage_name VARCHAR(100) NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'READY', -- 'LOCKED', 'READY', 'IN_PROGRESS', 'COMPLETED'
  active_version INTEGER NOT NULL DEFAULT 1,
  total_versions INTEGER NOT NULL DEFAULT 1,
  last_generated_at TIMESTAMPTZ,
  last_generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT uq_project_stage UNIQUE (project_id, stage_key)
);

CREATE INDEX IF NOT EXISTS idx_project_pipeline_stages ON project_pipeline_stages(project_id, stage_order ASC);

-- 5. Seed Tahap Jalur Proyek untuk The Park Townhouse Sukoharjo
INSERT INTO project_pipeline_stages (tenant_id, project_id, stage_order, stage_key, stage_name, is_free, status, active_version, total_versions, last_generated_at)
SELECT 
  p.tenant_id,
  p.id AS project_id,
  s.stage_order,
  s.stage_key,
  s.stage_name,
  s.is_free,
  s.status,
  1,
  1,
  NOW()
FROM projects p
CROSS JOIN (
  VALUES 
    (1, 'input', 'Input Brosur, Pricelist & Koordinat', true, 'COMPLETED'),
    (2, 'surat_cinta_99', 'Surat Cinta 99 Keunggulan', true, 'COMPLETED'),
    (3, 'riset_pasar', 'Riset Pasar & Analisis Kompetitor (500m - 25km)', false, 'COMPLETED'),
    (4, 'target_penjualan', 'Target Penjualan Menuju Sold Out 100%', false, 'COMPLETED'),
    (5, 'kalender_konten', 'Kalender Konten Media Sosial (30 Hari)', false, 'READY'),
    (6, 'playbook', 'Playbook Sales (SE, TL, SM)', false, 'READY'),
    (7, 'rute_harian', 'Rute Harian & Kanvasing SE', false, 'READY'),
    (8, 'website_landing', 'Website Landing Page Proyek', false, 'READY')
) AS s(stage_order, stage_key, stage_name, is_free, status)
WHERE p.nama_proyek = 'The Park Townhouse Sukoharjo'
ON CONFLICT (project_id, stage_key) DO NOTHING;
