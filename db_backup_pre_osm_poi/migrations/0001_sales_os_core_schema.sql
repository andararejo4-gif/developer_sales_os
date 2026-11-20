-- ============================================================================
-- DEVELOPER SALES OS (sales_os)
-- Migration 0001: Core Multi-Tenant Schema, Plans, Auth, Projects, & AI Jobs
-- Domain Target: developerproperti.giivepro.com
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE role_pengguna AS ENUM (
    'SUPERADMIN',
    'DEVELOPER_OWNER',
    'DEVELOPER_ADMIN',
    'SALES_MANAGER',
    'TEAM_LEADER',
    'SALES_EXECUTIVE',
    'DIGITAL_MARKETING',
    'FREELANCE_AGENT',
    'AFFILIATOR'
);

CREATE TYPE tier_paket AS ENUM (
    'gold',
    'platinum',
    'diamond'
);

CREATE TYPE status_job AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

CREATE TYPE status_approval AS ENUM (
    'pending',
    'approved',
    'rejected'
);

-- 1. Tenants (Developer / PT Properti)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(250),
    contact_email VARCHAR(150),
    contact_phone VARCHAR(50),
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- 2. Plans (Config-Driven, Bukan Hardcode)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE, -- 'gold', 'platinum', 'diamond'
    name VARCHAR(100) NOT NULL,
    price NUMERIC(15, 2) DEFAULT NULL, -- NULL = "Hubungi kami"
    billing_period VARCHAR(50) DEFAULT 'bulanan',
    description TEXT,
    max_active_projects INT DEFAULT 1,
    max_sales_users INT DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Plan Features (Granular Feature Flags per Plan)
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_name VARCHAR(200) NOT NULL,
    feature_value JSONB NOT NULL DEFAULT 'true'::jsonb,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_plan_feature UNIQUE(plan_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_key ON plan_features(plan_id, feature_key);

-- 4. Tenant Subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, trial, past_due, canceled
    custom_overrides JSONB DEFAULT '{}'::jsonb,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_subs ON tenant_subscriptions(tenant_id, status);

-- 5. Users (Auth, Sesi, Multi-tenant)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL untuk SUPERADMIN
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    role role_pengguna NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Hierarki: SE -> TL -> SM
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_email UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 6. Projects (Satu Developer bisa memiliki banyak proyek)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    slug VARCHAR(120) NOT NULL,
    name VARCHAR(200) NOT NULL,
    project_type VARCHAR(50) DEFAULT 'menengah', -- mewah, menengah, subsidi, komersial
    headline TEXT,
    description TEXT,
    address TEXT,
    city VARCHAR(100) DEFAULT 'Sukoharjo',
    province VARCHAR(100) DEFAULT 'Jawa Tengah',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    total_units INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public_case_study BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_project_slug UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);

-- 7. Clusters (Nagoya, Osaka, Tokyo, dll)
CREATE TABLE IF NOT EXISTS clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clusters_project ON clusters(tenant_id, project_id);

-- 8. Units
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,
    unit_code VARCHAR(50) NOT NULL,
    unit_type VARCHAR(100) NOT NULL, -- Diamond 75/90, Gold 60/72, Emerald 50/60
    land_area NUMERIC(8, 2), -- LT
    building_area NUMERIC(8, 2), -- LB
    price_cash_hard NUMERIC(15, 2),
    price_cash_6m NUMERIC(15, 2),
    price_cash_12m NUMERIC(15, 2),
    price_cash_24m NUMERIC(15, 2),
    price_kpr NUMERIC(15, 2),
    status VARCHAR(50) DEFAULT 'tersedia', -- tersedia, booking, terjual, hold
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_unit_code UNIQUE(project_id, unit_code)
);

CREATE INDEX IF NOT EXISTS idx_units_tenant_project ON units(tenant_id, project_id, status);

-- 9. Project Files (Penyimpanan Berkas Terstruktur)
-- Lokasi fisik: /storage/{tenant_id}/{project_id}/...
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_category VARCHAR(50) NOT NULL, -- 'brochure', 'pricelist', 'masterplan', 'services'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_files ON project_files(tenant_id, project_id, file_category);

-- 10. Surat Cinta 99 Keunggulan (Berversi v1, v2, ... + Guardrail Validator)
CREATE TABLE IF NOT EXISTS love_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    narration_preamble TEXT,
    points_json JSONB NOT NULL, -- Array of 99 items: [{ number: 1, category: '...', title: '...', narrative: '...' }]
    total_points INT NOT NULL,
    validator_passed BOOLEAN NOT NULL DEFAULT FALSE,
    validation_notes JSONB DEFAULT '[]'::jsonb,
    generated_by_ai BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_love_letter_version UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_love_letters_project ON love_letters(tenant_id, project_id, version);

-- 11. Async Jobs & Worker Queue
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_type VARCHAR(100) NOT NULL, -- 'extract_brochure', 'generate_love_letter', 'export_document'
    payload JSONB NOT NULL,
    status status_job NOT NULL DEFAULT 'pending',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON jobs(tenant_id, status);

-- 12. AI Usage & Token Accounting (Audit SUPERADMIN)
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    module_name VARCHAR(100) NOT NULL, -- 'surat_cinta_99', 'ekstraksi_katalog', 'riset_pasar'
    provider VARCHAR(50) DEFAULT 'google',
    model_name VARCHAR(100) NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON ai_usage(tenant_id, created_at);

-- 13. Approvals (Prinsip SM Semi-AI: AI menyusun rekomendasi, SM wajib menyetujui)
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL, -- 'target_penjualan', 'kalender_konten', 'playbook_sm'
    item_type VARCHAR(100) NOT NULL,
    item_id UUID,
    proposed_data JSONB NOT NULL,
    approver_id UUID REFERENCES users(id),
    status status_approval NOT NULL DEFAULT 'pending',
    notes TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approvals_tenant ON approvals(tenant_id, status);

-- 14. Audit Logs (100% Catatan Aksi Penting)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at);
