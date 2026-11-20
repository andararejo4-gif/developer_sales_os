-- ============================================================================
-- MIGRATION 0009: SALES_OS PHASE 6 - CRM & PIPELINE, COMMISSIONS, & SUPERADMIN
-- Developer Sales OS (developerproperti.giivepro.com)
-- Project-Isolated CRM, BANT Matrix, Commission Rules, & Multi-Project Tray
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE lead_stage_type AS ENUM (
    'LEAD_BARU',
    'TERKUALIFIKASI',
    'PROSPEK',
    'HOT_PROSPEK',
    'BOOKING',
    'AKAD_CLOSING',
    'BATAL_HILANG'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Tabel Leads CRM Proyek (project_leads)
CREATE TABLE IF NOT EXISTS project_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  full_name VARCHAR(255) NOT NULL,
  phone_whatsapp VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  
  -- Sumber dan atribusi pemasaran
  lead_source VARCHAR(100) NOT NULL DEFAULT 'Website Landing Page',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  stage lead_stage_type NOT NULL DEFAULT 'LEAD_BARU',
  
  -- Matriks Kualifikasi BANT
  bant_budget INTEGER DEFAULT 5,
  bant_authority INTEGER DEFAULT 5,
  bant_need INTEGER DEFAULT 5,
  bant_timeline INTEGER DEFAULT 5,
  bant_total_score NUMERIC(4,1) GENERATED ALWAYS AS (
    (bant_budget * 0.3) + (bant_authority * 0.25) + (bant_need * 0.25) + (bant_timeline * 0.2)
  ) STORED,
  
  unit_of_interest VARCHAR(100),
  estimated_deal_value_idr NUMERIC(15,2) DEFAULT 900000000,
  
  -- Penugasan SE & TL dengan penamaan terstruktur
  assigned_se_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_se_name VARCHAR(100) DEFAULT 'SE 001 Budi Santoso',
  assigned_tl_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_tl_name VARCHAR(100) DEFAULT 'TL 001 Siti Rahmawati',
  
  -- Rencana Tindak Lanjut (Tanggal tindakan berikutnya)
  next_follow_up_date DATE NOT NULL DEFAULT CURRENT_DATE + 1,
  next_action_plan VARCHAR(255) DEFAULT 'Follow-up WhatsApp & Kirim E-Brochure',
  
  notes TEXT,
  activity_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_leads_project_stage ON project_leads(project_id, stage);
CREATE INDEX IF NOT EXISTS idx_project_leads_follow_up ON project_leads(project_id, next_follow_up_date);

-- 2. Tabel Aturan Komisi Penjualan Tenant (commission_rules)
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  company_share_percent NUMERIC(5,2) NOT NULL DEFAULT 60.0,
  sm_share_percent NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  tl_share_percent NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  se_share_percent NUMERIC(5,2) NOT NULL DEFAULT 15.0,
  affiliator_share_percent NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  
  notes TEXT DEFAULT 'Skema standar komisi closing unit perumahan',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Seed sample leads untuk The Park Townhouse Sukoharjo
INSERT INTO project_leads (
  tenant_id,
  project_id,
  full_name,
  phone_whatsapp,
  lead_source,
  stage,
  bant_budget,
  bant_authority,
  bant_need,
  bant_timeline,
  unit_of_interest,
  assigned_se_name,
  assigned_tl_name,
  next_follow_up_date,
  next_action_plan,
  notes
)
SELECT
  p.tenant_id,
  p.id,
  l.name,
  l.phone,
  l.source,
  l.stage::lead_stage_type,
  l.b, l.a, l.n, l.t,
  l.unit,
  l.se,
  l.tl,
  CURRENT_DATE + l.day_offset,
  l.action,
  l.note
FROM projects p
CROSS JOIN (
  VALUES
    ('dr. Hendra Kusuma, Sp.A', '081234567891', 'Website Landing Page', 'HOT_PROSPEK', 9, 9, 10, 8, 'Nagoya Deluxe 2 Lantai', 'SE 001 Budi Santoso', 'TL 001 Siti Rahmawati', 0, 'Jadwalkan Survei Lokasi Hari Ini', 'Dokter spesialis RS Indriati; mencari rumah 2 lantai dekat RS'),
    ('H. Sukamto (Toko Tekstil Klewer)', '081234567892', 'Kanvasing SE', 'BOOKING', 10, 9, 8, 9, 'Tokyo Executive Hook 2 Lantai', 'SE 002 Denny Pratama', 'TL 001 Siti Rahmawati', 1, 'Konfirmasi Pengikatan SPK Notaris', 'Memilih opsi Cash Bertahap 12 bulan; DP Rp 300 Juta siap transfer'),
    ('Rina Wulandari, S.E.', '081234567893', 'Instagram Reels Ad', 'TERKUALIFIKASI', 8, 7, 8, 7, 'Osaka Premiere 2 Lantai', 'SE 001 Budi Santoso', 'TL 001 Siti Rahmawati', 2, 'Kirim Simulasi KPR BTN Syariah', 'Keluarga muda; bekerja di Solo Baru'),
    ('Ir. Bambang Triyono', '081234567894', 'TikTok Walkthrough', 'LEAD_BARU', 7, 7, 7, 6, 'Nagoya Deluxe 2 Lantai', 'SE 003 Maya Anggraini', 'TL 001 Siti Rahmawati', 0, 'First Contact SLA ≤ 5 Menit via WA', 'Baru submit nomor telepon dari iklan website')
) AS l(name, phone, source, stage, b, a, n, t, unit, se, tl, day_offset, action, note)
WHERE p.nama_proyek = 'The Park Townhouse Sukoharjo'
ON CONFLICT DO NOTHING;
