-- ============================================================================
-- DEVELOPER SALES OS - MIGRATION 0010
-- SE Attendance, GPS Tracking, Call Logs, & AI Activity Guide (Platinum & Diamond)
-- ============================================================================

-- 1. Tabel Absensi Harian SE / Sales In-House
CREATE TABLE IF NOT EXISTS se_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_at TIMESTAMPTZ,
  check_in_lat NUMERIC(10, 7),
  check_in_lng NUMERIC(10, 7),
  check_out_at TIMESTAMPTZ,
  check_out_lat NUMERIC(10, 7),
  check_out_lng NUMERIC(10, 7),
  status VARCHAR(32) NOT NULL DEFAULT 'HADIR' CHECK (status IN ('HADIR', 'TERLAMBAT', 'IZIN', 'CUTI')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, project_id, user_id, attendance_date)
);

-- 2. Tabel Tracking GPS SE / Sales In-House
CREATE TABLE IF NOT EXISTS se_gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  activity_type VARCHAR(32) NOT NULL CHECK (activity_type IN ('CANVASSING', 'SURVEY_LOKASI', 'MEETING_KLIEN', 'KANTOR_PEMASARAN', 'CHECK_IN', 'CHECK_OUT')),
  location_label VARCHAR(255) NOT NULL,
  distance_from_project_km NUMERIC(8, 2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_se_gps_logs_project_user ON se_gps_logs(project_id, user_id, recorded_at DESC);

-- 3. Tabel Log Panggilan (Call Log) SE
CREATE TABLE IF NOT EXISTS se_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES project_leads(id) ON DELETE SET NULL,
  lead_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL DEFAULT 'OUTBOUND' CHECK (direction IN ('OUTBOUND', 'INBOUND')),
  duration_seconds INT NOT NULL DEFAULT 0,
  outcome VARCHAR(40) NOT NULL CHECK (outcome IN ('TERJAWAB_TERTARIK', 'JANJI_SURVEI', 'FOLLOW_UP_LAGI', 'TIDAK_ANGKAT', 'NOMOR_TIDAK_AKTIF')),
  summary_notes TEXT,
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_se_call_logs_project ON se_call_logs(project_id, called_at DESC);

-- 4. Tabel Panduan Aktivitas SE Berbasis AI (Khusus Platinum & Diamond)
CREATE TABLE IF NOT EXISTS se_ai_activity_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activity_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  ai_opening_script TEXT NOT NULL,
  ai_execution_steps JSONB NOT NULL DEFAULT '[]',
  ai_objection_handlers JSONB NOT NULL DEFAULT '[]',
  plan_required VARCHAR(32) NOT NULL DEFAULT 'platinum',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Update Feature Flags di Tabel plan_features (Gold, Platinum, Diamond)
INSERT INTO plan_features (plan_id, feature_key, feature_name, feature_value, is_enabled)
VALUES
  -- Gold: Absen, GPS Tracking, Log Panggilan AKTIF; AI Activity Guide NONAKTIF
  ('11111111-1111-1111-1111-111111111111', 'se_attendance', 'Absensi Harian SE', '"tersedia"'::jsonb, true),
  ('11111111-1111-1111-1111-111111111111', 'se_gps_tracking', 'Tracking GPS SE / Sales In-House', '"tersedia"'::jsonb, true),
  ('11111111-1111-1111-1111-111111111111', 'se_call_log', 'Log Panggilan Telepon SE', '"tersedia"'::jsonb, true),
  ('11111111-1111-1111-1111-111111111111', 'se_ai_activity_guide', 'Panduan / Guide per Aktivitas SE dengan AI', 'false'::jsonb, false),

  -- Platinum: Semua AKTIF termasuk AI Activity Guide
  ('22222222-2222-2222-2222-222222222222', 'se_attendance', 'Absensi Harian SE', '"tersedia"'::jsonb, true),
  ('22222222-2222-2222-2222-222222222222', 'se_gps_tracking', 'Tracking GPS SE / Sales In-House', '"tersedia"'::jsonb, true),
  ('22222222-2222-2222-2222-222222222222', 'se_call_log', 'Log Panggilan Telepon SE', '"tersedia"'::jsonb, true),
  ('22222222-2222-2222-2222-222222222222', 'se_ai_activity_guide', 'Panduan / Guide per Aktivitas SE dengan AI', '"aktif_platinum"'::jsonb, true),

  -- Diamond: Semua AKTIF termasuk AI Activity Guide Lanjutan
  ('33333333-3333-3333-3333-333333333333', 'se_attendance', 'Absensi Harian SE', '"tersedia"'::jsonb, true),
  ('33333333-3333-3333-3333-333333333333', 'se_gps_tracking', 'Tracking GPS SE / Sales In-House', '"tersedia"'::jsonb, true),
  ('33333333-3333-3333-3333-333333333333', 'se_call_log', 'Log Panggilan Telepon SE', '"tersedia"'::jsonb, true),
  ('33333333-3333-3333-3333-333333333333', 'se_ai_activity_guide', 'Panduan / Guide per Aktivitas SE dengan AI', '"aktif_diamond"'::jsonb, true)
ON CONFLICT DO NOTHING;
