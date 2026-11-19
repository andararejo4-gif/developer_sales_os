-- ============================================================================
-- MIGRATION 0008: SALES_OS PHASE 5 - PROJECT WEBSITES
-- Developer Sales OS (developerproperti.giivepro.com)
-- Interactive Project Landing Page Generator with Installment Simulator & UTM Capture
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  subdomain VARCHAR(100) NOT NULL, -- e.g. "thepark" -> thepark.developerproperti.giivepro.com
  custom_domain VARCHAR(255),
  site_title VARCHAR(255) NOT NULL DEFAULT 'The Park Townhouse Sukoharjo — Hunian 2 Lantai Mewah',
  hero_headline VARCHAR(255) NOT NULL DEFAULT 'Ketenangan Hidup Modern di Koridor Emas Solo Baru',
  hero_subheadline TEXT NOT NULL DEFAULT 'Townhouse butik 2 lantai berprivasi tinggi dengan sertifikat SHM sudah pecah per kavling, hanya 7 menit ke RS Indriati.',
  
  -- Konfigurasi Galeri Foto
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Konfigurasi Parameter Simulasi Cicilan KPR (Non-binding simulation)
  simulation_config JSONB NOT NULL DEFAULT '{
    "default_dp_percent": 10,
    "annual_interest_rate_percent": 4.75,
    "available_tenors_years": [5, 10, 15, 20],
    "disclaimer": "Simulasi ini adalah perkiraan matematis dan bukan merupakan penawaran kredit mengikat dari bank."
  }'::jsonb,
  
  -- Daftar FAQ Kurasi
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Kontak Lead & WhatsApp Pengarah
  whatsapp_number VARCHAR(50) NOT NULL DEFAULT '6281234567890',
  whatsapp_prefilled_text TEXT NOT NULL DEFAULT 'Halo, saya tertarik dengan unit The Park Townhouse Sukoharjo. Boleh minta info simulasi cicilan dan jadwal survei lokasi?',
  
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_project_subdomain UNIQUE (subdomain),
  CONSTRAINT uq_project_website UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_websites_subdomain ON project_websites(subdomain);

-- Update Jalur Proyek
UPDATE project_pipeline_stages
SET status = 'COMPLETED', updated_at = NOW()
WHERE stage_key = 'website_landing' AND project_id IN (
  SELECT id FROM projects WHERE nama_proyek = 'The Park Townhouse Sukoharjo'
);
