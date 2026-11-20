-- ============================================================================
-- DEVELOPER SALES OS (sales_os)
-- Migration 0004: Fase 1B - Org Questionnaire, Project Members & Hooks
-- ============================================================================

-- Tambah Kolom Status Demo 30 Hari & Cuplikan di Tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'DEMO', -- 'DEMO', 'AKTIF', 'DEMO_BERAKHIR'
ADD COLUMN IF NOT EXISTS demo_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS demo_max_projects INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS teaser_visible_percent INT DEFAULT 25;

-- 1. Project Members (Cakupan Akses Penugasan Per Proyek)
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_di_proyek role_pengguna NOT NULL,
    atasan_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Hierarki per proyek (SE -> TL -> SM)
    bisa_menyetujui_penugasan BOOLEAN NOT NULL DEFAULT FALSE, -- Wewenang approval penugasan (SM, Head of Sales, Owner)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id UUID REFERENCES users(id),
    CONSTRAINT uq_project_user UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members ON project_members(tenant_id, project_id, user_id, is_active);

-- 2. Project Assignment Requests (Alur Pengajuan & Persetujuan Penugasan Proyek Tambahan)
CREATE TABLE IF NOT EXISTS project_assignment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_role role_pengguna NOT NULL,
    requested_by_user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'revoked'
    approved_by_user_id UUID REFERENCES users(id),
    decision_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_assignment_requests ON project_assignment_requests(tenant_id, status);

-- 3. Org Profile (Profil Hasil Kuesioner Pendaftaran Pengembang)
CREATE TABLE IF NOT EXISTS org_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    headquarters_city VARCHAR(100),
    employee_count_range VARCHAR(50) NOT NULL, -- '1-5', '6-15', '16-50', '51-100', '>100'
    active_projects_count INT DEFAULT 1,
    social_channels JSONB DEFAULT '["instagram", "tiktok", "facebook"]'::jsonb,
    has_official_social BOOLEAN DEFAULT TRUE,
    has_website BOOLEAN DEFAULT FALSE,
    lead_tool VARCHAR(50) DEFAULT 'excel', -- 'excel', 'crm_lain', 'belum_ada'
    monthly_sales_target_range VARCHAR(80),
    monthly_ad_budget_range VARCHAR(80),
    alternative_sales_channel VARCHAR(100), -- jika sales in-house tidak ada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Org Roles (Struktur Tim & Mode AI per Role)
CREATE TABLE IF NOT EXISTS org_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_key VARCHAR(80) NOT NULL, -- 'SALES_EXECUTIVE', 'SALES_MANAGER', 'TEAM_LEADER', 'ADMIN', 'DIGITAL_MARKETING', 'FREELANCE_AGENT', 'AFFILIATOR', 'CUSTOM'
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    headcount INT NOT NULL DEFAULT 1,
    ai_mode VARCHAR(50) NOT NULL DEFAULT 'human_only', -- 'human_only', 'semi_ai', 'full_ai'
    custom_label VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_role_key UNIQUE(tenant_id, role_key)
);

CREATE INDEX IF NOT EXISTS idx_org_roles ON org_roles(tenant_id, is_enabled);

-- 5. Hook Events (Pencatatan Etis Hook Mikro Bagian 4B)
CREATE TABLE IF NOT EXISTS hook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hook_id VARCHAR(100) NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    page_url TEXT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'displayed', 'closed', 'later_clicked', 'cta_clicked', 'converted'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hook_events ON hook_events(hook_id, event_type, created_at);
