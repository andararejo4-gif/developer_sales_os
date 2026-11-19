-- ============================================================================
-- DEVELOPER SALES OS (sales_os)
-- Migration 0003: Fase 1A - Product Knowledge Base (Single Source of Truth)
-- ============================================================================

-- 1. Product Sources (Berkas Masukan: Brosur, Pricelist, Denah, Koordinat)
CREATE TABLE IF NOT EXISTS product_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL, -- 'brochure', 'pricelist', 'masterplan', 'services', 'coordinate_spec'
    title VARCHAR(200) NOT NULL,
    file_path TEXT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_sources ON product_sources(tenant_id, project_id, is_active);

-- 2. KB Facts (Fakta Terstruktur Produk & Garansi Akurasi)
-- Setiap klaim di Surat Cinta, Kalender, Playbook, Website, dan Chatbot WAJIB merujuk fact_id di sini
CREATE TABLE IF NOT EXISTS kb_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_id UUID REFERENCES product_sources(id) ON DELETE SET NULL,
    category VARCHAR(80) NOT NULL, -- 'identitas', 'lokasi_akses', 'spesifikasi_bangunan', 'tipe_harga', 'skema_pembayaran_promo', 'fasilitas_kawasan', 'fasilitas_unit', 'legalitas', 'kontak', 'syarat_ketentuan'
    fact_key VARCHAR(120) NOT NULL,
    fact_value TEXT NOT NULL,
    fact_unit VARCHAR(50),
    source_location VARCHAR(150), -- mis: 'Brosur Hal. 2', 'Pricelist Kolom B'
    status VARCHAR(50) NOT NULL DEFAULT 'terverifikasi', -- 'terverifikasi', 'perlu_dicek', 'dikoreksi_manual'
    confidence NUMERIC(4, 3) DEFAULT 1.000,
    version INT NOT NULL DEFAULT 1,
    boleh_publik BOOLEAN NOT NULL DEFAULT TRUE, -- Flag untuk chatbot/website pengunjung
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_kb_fact_key UNIQUE(project_id, category, fact_key, version)
);

CREATE INDEX IF NOT EXISTS idx_kb_facts_lookup ON kb_facts(tenant_id, project_id, category, boleh_publik);

-- 3. Location Facts (Perhitungan Haversine Riil dari Koordinat per Cluster)
CREATE TABLE IF NOT EXISTS location_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
    place_name VARCHAR(150) NOT NULL,
    place_category VARCHAR(80) NOT NULL, -- 'rumah_sakit', 'pusat_belanja', 'sekolah', 'stasiun', 'pemerintahan', 'jalan_tol'
    straight_distance_km NUMERIC(6, 2) NOT NULL, -- Jarak Haversine
    travel_time_minutes INT, -- Estimasi waktu tempuh berkendara
    travel_mode VARCHAR(50) DEFAULT 'mobil',
    source_attribution VARCHAR(100) DEFAULT 'OpenStreetMap Data (Terverifikasi)',
    data_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_location_facts ON location_facts(tenant_id, project_id, cluster_id);

-- 4. KB Chunks & Semantik (Potongan Dokumen + Pencarian Semantik)
CREATE TABLE IF NOT EXISTS kb_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_id UUID REFERENCES product_sources(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_chunks ON kb_chunks(tenant_id, project_id);

-- 5. KB Changes (Audit Perubahan Fakta Produk)
CREATE TABLE IF NOT EXISTS kb_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    fact_id UUID REFERENCES kb_facts(id) ON DELETE CASCADE,
    changed_by_user_id UUID REFERENCES users(id),
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_changes ON kb_changes(tenant_id, project_id);

-- 6. Product Quiz Results (Hasil Kuis Pengetahuan Produk 10 Soal SE Baru)
CREATE TABLE IF NOT EXISTS product_quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    total_questions INT NOT NULL DEFAULT 10,
    correct_answers INT NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    answers_detail JSONB NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_quiz ON product_quiz_results(tenant_id, project_id, user_id);
