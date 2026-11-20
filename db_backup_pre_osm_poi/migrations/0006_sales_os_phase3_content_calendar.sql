-- ============================================================================
-- MIGRATION 0006: SALES_OS PHASE 3 - CONTENT CALENDAR (30 DAYS, 3 SLOTS/DAY)
-- Developer Sales OS (developerproperti.giivepro.com)
-- Multi-Platform (IG, TikTok, FB, X, YT Shorts) & Dual Tracks (Official & Sales)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE funnel_stage_type AS ENUM ('TOFU', 'MOFU', 'BOFU');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE track_konten_type AS ENUM ('OFFICIAL', 'SALES_IN_HOUSE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE status_posting_type AS ENUM ('DRAFT', 'SIAP', 'SUDAH_POSTING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Tabel Kalender Konten (content_calendars)
-- Satu kalender konten bulanan per proyek per versi
CREATE TABLE IF NOT EXISTS content_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL DEFAULT 'Kalender Konten Media Sosial 30 Hari',
  month_period VARCHAR(50) NOT NULL DEFAULT 'Bulan 1 Peluncuran',
  
  -- Konfigurasi platform yang aktif (JSON array)
  active_platforms JSONB NOT NULL DEFAULT '["Instagram", "TikTok", "Facebook", "X", "YouTube Shorts"]'::jsonb,
  
  -- Status ketersediaan jalur sales in-house berdasarkan paket/kuesioner
  has_sales_track BOOLEAN NOT NULL DEFAULT true,
  
  total_slots INTEGER NOT NULL DEFAULT 90,
  completed_slots INTEGER NOT NULL DEFAULT 0,
  
  status status_dokumen_proyek NOT NULL DEFAULT 'COMPLETED',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_project_calendar_version UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_content_calendars_tenant_project ON content_calendars(tenant_id, project_id);

-- 2. Tabel Slot Konten (calendar_slots)
-- 30 hari x 3 slot = 90 slot per jalur
CREATE TABLE IF NOT EXISTS calendar_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES content_calendars(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 31),
  slot_order INTEGER NOT NULL CHECK (slot_order BETWEEN 1 AND 3), -- 1: TOFU (Pagi), 2: MOFU (Siang/Sore), 3: BOFU (Malam)
  scheduled_time VARCHAR(20) NOT NULL, -- e.g. "09:00 WIB"
  
  funnel_stage funnel_stage_type NOT NULL,
  track track_konten_type NOT NULL DEFAULT 'OFFICIAL',
  platform VARCHAR(50) NOT NULL,
  content_format VARCHAR(100) NOT NULL, -- "Reels / Video Pendek", "Carousel Edukasi", dll.
  
  title VARCHAR(255) NOT NULL,
  brief TEXT NOT NULL,
  caption TEXT NOT NULL,
  hashtags JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta TEXT NOT NULL,
  
  -- Sitasi sumber kebenaran produk
  source_fact_id VARCHAR(100),
  source_love_letter_point INTEGER,
  
  status status_posting_type NOT NULL DEFAULT 'SIAP',
  posted_url TEXT,
  posted_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_slots_calendar ON calendar_slots(calendar_id, day_number ASC, slot_order ASC);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_track_funnel ON calendar_slots(calendar_id, track, funnel_stage);

-- 3. Perbarui status tahap pada Jalur Proyek
UPDATE project_pipeline_stages
SET status = 'COMPLETED', updated_at = NOW()
WHERE stage_key = 'kalender_konten' AND project_id IN (
  SELECT id FROM projects WHERE nama_proyek = 'The Park Townhouse Sukoharjo'
);
