-- ============================================================================
-- MIGRATION 0007: SALES_OS PHASE 4 - PLAYBOOK & RUTE HARIAN SE
-- Developer Sales OS (developerproperti.giivepro.com)
-- Playbooks (SE, TL, SM) & GPS-guided Daily Canvassing Routes
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE playbook_role_type AS ENUM ('SE', 'TL', 'SM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Tabel Playbook Proyek
CREATE TABLE IF NOT EXISTS project_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  role playbook_role_type NOT NULL DEFAULT 'SE',
  title VARCHAR(255) NOT NULL,
  
  -- Target turunan dari Target Penjualan Proyek (Reverse Funnel Math)
  monthly_unit_target NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  reverse_funnel_targets JSONB NOT NULL DEFAULT '{
    "leads": 120,
    "prospek": 40,
    "hot_prospek": 15,
    "survei": 6,
    "booking": 2,
    "closing": 1
  }'::jsonb,
  
  -- Standar Kualifikasi BANT (Budget, Authority, Need, Timeline >= 7)
  bant_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- SOP Rutin Harian, Mingguan, Bulanan
  daily_sop JSONB NOT NULL DEFAULT '[]'::jsonb,
  weekly_sop JSONB NOT NULL DEFAULT '[]'::jsonb,
  monthly_sop JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Saluran Aktivitas: canvassing, call, chat/DM, posting, OTT, iklan
  activity_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Matriks KPI & Skor Penilaian
  kpi_metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Mode Operasi: human_only, semi_ai, full_ai
  ai_mode VARCHAR(50) NOT NULL DEFAULT 'human_only',
  
  status status_dokumen_proyek NOT NULL DEFAULT 'COMPLETED',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_project_playbook_role_version UNIQUE (project_id, role, version)
);

CREATE INDEX IF NOT EXISTS idx_playbooks_project_role ON project_playbooks(project_id, role, version DESC);

-- 2. Tabel Rute Harian SE (daily_routes)
CREATE TABLE IF NOT EXISTS daily_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  se_id UUID REFERENCES users(id) ON DELETE SET NULL,
  day_of_week VARCHAR(20) NOT NULL, -- 'Senin', 'Selasa', 'Rabu', dll.
  route_name VARCHAR(255) NOT NULL,
  start_coordinates JSONB NOT NULL, -- Titik awal gerbang klaster
  target_cluster_area VARCHAR(100) NOT NULL,
  
  -- Daftar Titik Kunjungan / Waypoints terurut
  waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Jadwal per jam (08:00 - 17:00)
  hourly_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  total_distance_km NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  estimated_duration_hours NUMERIC(4,1) NOT NULL DEFAULT 8.0,
  target_leads_to_acquire INTEGER NOT NULL DEFAULT 10,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_routes_project_se ON daily_routes(project_id, se_id);

-- 3. Update status pipeline Jalur Proyek
UPDATE project_pipeline_stages
SET status = 'COMPLETED', updated_at = NOW()
WHERE stage_key IN ('playbook', 'rute_harian') AND project_id IN (
  SELECT id FROM projects WHERE nama_proyek = 'The Park Townhouse Sukoharjo'
);
