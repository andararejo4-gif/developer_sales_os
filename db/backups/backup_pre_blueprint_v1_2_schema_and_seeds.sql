-- BACKUP DUMP DATABASE SALES_OS
-- Generated: 2026-11-20T10:22:25.163546
-- Baseline: Migrations 0001 to 0010

-- ==========================================
-- FILE: db/migrations\0001_sales_os_core_schema.sql
-- ==========================================
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


-- ==========================================
-- FILE: db/migrations\0001_schema_dan_tipe.sql
-- ==========================================
-- 0001 · Schema devos, tipe enum, fungsi umum
begin;

create schema if not exists devos;

create table if not exists devos.schema_migrations (
  versi      text primary key,
  diterapkan timestamptz not null default now()
);

-- ===== Enum =====
create type devos.role_pengguna as enum ('SE', 'TL', 'ADMIN', 'SM', 'IT', 'DIREKSI', 'DIGITAL_MARKETING');
create type devos.jenis_akun    as enum ('manusia', 'ai');
create type devos.tipe_proyek   as enum ('mewah', 'menengah', 'subsidi', 'villa_resort', 'komersial');
create type devos.status_unit   as enum ('tersedia', 'hold', 'booking', 'terjual');
create type devos.skema_bayar   as enum ('cash_keras', 'cash_6', 'cash_12', 'cash_24', 'kpr');
create type devos.tahap_pipeline as enum (
  'new', 'contacted', 'qualified', 'appointment', 'visited',
  'hot', 'booking', 'proses_dp_kpr', 'net_sales', 'closed_lost'
);
create type devos.alasan_lost as enum (
  'harga_anggaran', 'kpr_ditolak', 'proyek_lain', 'lokasi',
  'ukuran_denah', 'menunda', 'tidak_bisa_dihubungi', 'cari_info_agen'
);
create type devos.persona      as enum ('P1', 'P2', 'P3', 'P4', 'P5', 'P6');
create type devos.ring_geo     as enum ('ring_1', 'ring_2', 'ring_3', 'investor');
create type devos.kelas_lead   as enum ('premium', 'baik', 'lemah', 'tidak_valid');
create type devos.jenis_appointment as enum ('marketing_gallery', 'lokasi', 'presentasi', 'video_call');
create type devos.status_appointment as enum ('dijadwalkan', 'hadir', 'tidak_hadir', 'dibatalkan');
create type devos.status_tugas as enum ('terbuka', 'selesai', 'dilewati');
create type devos.status_booking as enum ('aktif', 'net_sales', 'batal');
create type devos.status_dokumen as enum ('kurang', 'lengkap');
create type devos.status_bank as enum ('diajukan', 'verifikasi', 'sp3k', 'ditolak');
create type devos.jenis_aktivitas as enum (
  'dial', 'percakapan_telepon', 'chat_baru', 'chat_followup', 'dm',
  'canvassing', 'ott', 'presentasi_korporat', 'posting_reel', 'posting_status',
  'posting_story', 'konten_resmi', 'listing_portal', 'live', 'minta_referral'
);
create type devos.status_persetujuan as enum ('menunggu', 'disetujui_ai', 'eskalasi', 'disetujui', 'ditolak');
create type devos.kategori_scorecard as enum ('bintang', 'tercapai', 'mendekati', 'di_bawah_target', 'kritis');

-- ===== Fungsi umum =====
create function devos.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

insert into devos.schema_migrations (versi) values ('0001_schema_dan_tipe');
commit;



-- ==========================================
-- FILE: db/migrations\0002_pengguna_proyek_unit.sql
-- ==========================================
-- 0002 · Pengguna, proyek, unit, target proyek, portofolio direksi
begin;

-- ===== Pengguna =====
-- Akun mandiri untuk devos (tidak bergantung ke auth.users).
-- Role TL dijalankan AI (jenis_akun='ai'), tetapi manusia tetap boleh punya akun TL.
create table devos.pengguna (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  nama          text not null,
  no_wa         text,
  password_hash text,
  role          devos.role_pengguna not null,
  jenis_akun    devos.jenis_akun not null default 'manusia',
  atasan_id     uuid references devos.pengguna(id) on delete set null,
  aktif         boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint pengguna_bukan_atasan_sendiri check (atasan_id is distinct from id),
  constraint pengguna_manusia_wajib_password check (jenis_akun = 'ai' or password_hash is not null)
);
create unique index pengguna_email_uk on devos.pengguna (lower(email));
create index pengguna_role_idx on devos.pengguna (role) where aktif;
create index pengguna_atasan_idx on devos.pengguna (atasan_id);

-- SE hanya boleh punya atasan berperan SM (atau TL).
create function devos.cek_atasan() returns trigger
language plpgsql as $$
declare v_role devos.role_pengguna;
begin
  if new.role = 'SE' and new.atasan_id is not null then
    select role into v_role from devos.pengguna where id = new.atasan_id;
    if v_role not in ('SM', 'TL') then
      raise exception 'Atasan SE harus berperan SM atau TL (ditemukan: %)', v_role;
    end if;
  end if;
  return new;
end $$;
create trigger pengguna_cek_atasan before insert or update of atasan_id, role
  on devos.pengguna for each row execute function devos.cek_atasan();

-- ===== Proyek =====
create table devos.proyek (
  id         uuid primary key default gen_random_uuid(),
  kode       text not null,
  nama       text not null,                 -- nama proyek perumahan
  tipe       devos.tipe_proyek not null default 'mewah', -- tipe proyek: mewah, menengah, subsidi, villa_resort, komersial
  lokasi     text,
  keterangan text,
  aktif      boolean not null default true,
  dibuat_oleh uuid references devos.pengguna(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index proyek_kode_uk on devos.proyek (lower(kode));

-- ===== Unit =====
create table devos.unit (
  id                uuid primary key default gen_random_uuid(),
  proyek_id         uuid not null references devos.proyek(id) on delete restrict,
  cluster           text,
  nama_unit         text not null,
  tipe_unit         text not null,
  luas_tanah        numeric(10,2) not null check (luas_tanah > 0),      -- LT (m2)
  luas_bangunan     numeric(10,2) not null check (luas_bangunan > 0),   -- LB (m2)
  harga_cash_keras  numeric(16,2) not null check (harga_cash_keras >= 0),
  harga_cash_6      numeric(16,2) check (harga_cash_6 >= 0),
  harga_cash_12     numeric(16,2) check (harga_cash_12 >= 0),
  harga_cash_24     numeric(16,2) check (harga_cash_24 >= 0),
  keterangan        text,
  status            devos.status_unit not null default 'tersedia',
  dibuat_oleh       uuid references devos.pengguna(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (proyek_id, nama_unit)
);
create index unit_proyek_status_idx on devos.unit (proyek_id, status);

-- Riwayat harga: tersimpan otomatis setiap harga berubah.
create table devos.unit_harga_riwayat (
  id                bigint generated always as identity primary key,
  unit_id           uuid not null references devos.unit(id) on delete cascade,
  harga_cash_keras  numeric(16,2) not null,
  harga_cash_6      numeric(16,2),
  harga_cash_12     numeric(16,2),
  harga_cash_24     numeric(16,2),
  berlaku_sampai    timestamptz not null default now(),
  diubah_oleh       uuid
);
create index unit_harga_riwayat_unit_idx on devos.unit_harga_riwayat (unit_id, berlaku_sampai desc);

-- ===== Penugasan SE ke proyek & portofolio direksi =====
create table devos.penugasan_proyek (
  pengguna_id uuid not null references devos.pengguna(id) on delete cascade,
  proyek_id   uuid not null references devos.proyek(id) on delete cascade,
  primary key (pengguna_id, proyek_id)
);

create table devos.portofolio_direksi (
  direksi_id uuid not null references devos.pengguna(id) on delete cascade,
  proyek_id  uuid not null references devos.proyek(id) on delete cascade,
  primary key (direksi_id, proyek_id)
);

create function devos.cek_direksi() returns trigger
language plpgsql as $$
declare v_role devos.role_pengguna;
begin
  select role into v_role from devos.pengguna where id = new.direksi_id;
  if v_role is distinct from 'DIREKSI' then
    raise exception 'Portofolio hanya bisa dimiliki pengguna berperan DIREKSI';
  end if;
  return new;
end $$;
create trigger portofolio_cek_direksi before insert or update
  on devos.portofolio_direksi for each row execute function devos.cek_direksi();

-- ===== Target per proyek per bulan =====
create table devos.target_proyek (
  id                uuid primary key default gen_random_uuid(),
  proyek_id         uuid not null references devos.proyek(id) on delete cascade,
  periode           date not null check (periode = date_trunc('month', periode)::date),
  target_lead       integer check (target_lead >= 0),
  target_booking    integer not null default 0 check (target_booking >= 0),
  target_net_sales  integer not null default 0 check (target_net_sales >= 0),
  target_omzet      numeric(18,2) not null default 0 check (target_omzet >= 0),
  catatan           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (proyek_id, periode)
);

-- ===== Trigger: riwayat harga & updated_at =====
create function devos.simpan_riwayat_harga() returns trigger
language plpgsql security definer set search_path = devos, pg_temp as $$
begin
  if (old.harga_cash_keras, old.harga_cash_6, old.harga_cash_12, old.harga_cash_24)
     is distinct from
     (new.harga_cash_keras, new.harga_cash_6, new.harga_cash_12, new.harga_cash_24) then
    insert into devos.unit_harga_riwayat
      (unit_id, harga_cash_keras, harga_cash_6, harga_cash_12, harga_cash_24, diubah_oleh)
    values
      (old.id, old.harga_cash_keras, old.harga_cash_6, old.harga_cash_12, old.harga_cash_24,
       nullif(current_setting('devos.user_id', true), '')::uuid);
  end if;
  return new;
end $$;
create trigger unit_riwayat_harga after update on devos.unit
  for each row execute function devos.simpan_riwayat_harga();

create trigger pengguna_updated  before update on devos.pengguna      for each row execute function devos.set_updated_at();
create trigger proyek_updated    before update on devos.proyek        for each row execute function devos.set_updated_at();
create trigger unit_updated      before update on devos.unit          for each row execute function devos.set_updated_at();
create trigger target_proyek_upd before update on devos.target_proyek for each row execute function devos.set_updated_at();

insert into devos.schema_migrations (versi) values ('0002_pengguna_proyek_unit');
commit;



-- ==========================================
-- FILE: db/migrations\0002_sales_os_seed_plans_and_the_park.sql
-- ==========================================
-- ============================================================================
-- DEVELOPER SALES OS (sales_os)
-- Migration 0002: Seed Plans, Plan Features, Superadmin, Tenant The Park, 30 Units, & Surat Cinta 99 Keunggulan
-- ============================================================================

-- 1. SEED PLANS (Harga NULL = "Hubungi kami")
INSERT INTO plans (id, code, name, price, billing_period, description, max_active_projects, max_sales_users, display_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'gold', 'Gold', NULL, 'bulanan', 'Paket fondasi pemasaran properti untuk developer berkembang.', 1, 5, 1),
  ('22222222-2222-2222-2222-222222222222', 'platinum', 'Platinum', NULL, 'bulanan', 'Solusi lengkap mesin penjualan dengan TL Full AI untuk 3 proyek aktif.', 3, 20, 2),
  ('33333333-3333-3333-3333-333333333333', 'diamond', 'Diamond', NULL, 'tahunan', 'Ekosistem enterprise unlimited dengan TL Full AI, SM Semi-AI, dan dedicated pendamping.', 999, 999, 3)
ON CONFLICT (code) DO NOTHING;

-- 2. SEED PLAN FEATURES (Config-driven feature flags sesuai matriks Prompt Bagian 4)
INSERT INTO plan_features (plan_id, feature_key, feature_name, feature_value, is_enabled)
VALUES
  -- GOLD
  ('11111111-1111-1111-1111-111111111111', 'love_letter_99', 'Surat Cinta 99 Keunggulan', '"gratis_semua"'::jsonb, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'market_research', 'Riset Pasar & Fasilitas Publik', '"dasar"'::jsonb, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'sales_target', 'Target Penjualan s.d. Sold Out', 'true'::jsonb, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'landing_page', 'Website Landing Page Proyek', '"template_standar"'::jsonb, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'content_calendar_official', 'Kalender Konten Akun Official', '"1_bulan"'::jsonb, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'content_calendar_inhouse', 'Kalender Konten Sales In-House', 'false'::jsonb, FALSE),
  ('11111111-1111-1111-1111-111111111111', 'playbook_se', 'Playbook SE + Rute Harian', 'true'::jsonb, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'playbook_tl', 'Playbook Team Leader', '"dokumen_manual"'::jsonb, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'playbook_sm', 'Playbook Sales Manager', '"dokumen_manual"'::jsonb, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'crm_pipeline', 'CRM & Pipeline Penjualan', '"dasar"'::jsonb, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'support_level', 'Tingkat Layanan Dukungan', '"email"'::jsonb, TRUE),

  -- PLATINUM
  ('22222222-2222-2222-2222-222222222222', 'love_letter_99', 'Surat Cinta 99 Keunggulan', '"gratis_semua"'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'market_research', 'Riset Pasar & Fasilitas Publik', '"lengkap"'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'sales_target', 'Target Penjualan s.d. Sold Out', 'true'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'landing_page', 'Website Landing Page Proyek', '"template_kustom_section"'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'content_calendar_official', 'Kalender Konten Akun Official', '"1_bulan_caption_hashtag"'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'content_calendar_inhouse', 'Kalender Konten Sales In-House', '"add_on"'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'playbook_se', 'Playbook SE + Rute Harian', 'true'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'playbook_tl', 'Playbook Team Leader', '"full_ai"'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'playbook_sm', 'Playbook Sales Manager', '"dokumen_manual"'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'crm_pipeline', 'CRM & Pipeline Penjualan', '"penuh_kpi_harian"'::jsonb, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'support_level', 'Tingkat Layanan Dukungan', '"prioritas"'::jsonb, TRUE),

  -- DIAMOND
  ('33333333-3333-3333-3333-333333333333', 'love_letter_99', 'Surat Cinta 99 Keunggulan', '"gratis_semua"'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'market_research', 'Riset Pasar & Fasilitas Publik', '"lengkap_pembaruan_berkala"'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'sales_target', 'Target Penjualan s.d. Sold Out', 'true'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'landing_page', 'Website Landing Page Proyek', '"kustom_penuh_domain_sendiri"'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'content_calendar_official', 'Kalender Konten Akun Official', '"penjadwalan_dan_pengingat"'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'content_calendar_inhouse', 'Kalender Konten Sales In-House', '"termasuk"'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'playbook_se', 'Playbook SE + Rute Harian', 'true'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'playbook_tl', 'Playbook Team Leader', '"full_ai"'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'playbook_sm', 'Playbook Sales Manager', '"semi_ai_persetujuan_manusia"'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'crm_pipeline', 'CRM & Pipeline Penjualan', '"penuh_dasbor_eksekutif"'::jsonb, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'support_level', 'Tingkat Layanan Dukungan', '"pendamping_khusus"'::jsonb, TRUE)
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- 3. SEED SUPERADMIN GIIVEPRO
INSERT INTO users (id, tenant_id, email, password_hash, name, phone, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'admin@giivepro.com',
  '$2a$10$demoHashForPlatformSuperadminGiivepro9988',
  'Giivepro Superadmin',
  '081122334455',
  'SUPERADMIN',
  TRUE
) ON CONFLICT DO NOTHING;

-- 4. SEED TENANT PT ANDARA REJO MAKMUR
INSERT INTO tenants (id, slug, name, legal_name, contact_email, contact_phone, is_active)
VALUES (
  'aaaa1111-1111-1111-1111-111111111111',
  'pt-andara-rejo-makmur',
  'PT Andara Rejo Makmur',
  'PT Andara Rejo Makmur Sukoharjo',
  'direksi@andararejomakmur.co.id',
  '081234567890',
  TRUE
) ON CONFLICT (slug) DO NOTHING;

-- Tenant Subscription (Diamond Plan)
INSERT INTO tenant_subscriptions (tenant_id, plan_id, status)
VALUES (
  'aaaa1111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'active'
) ON CONFLICT DO NOTHING;

-- 5. SEED PROYEK: THE PARK TOWNHOUSE SUKOHARJO (Studi Kasus Publik)
INSERT INTO projects (
  id, tenant_id, slug, name, project_type, headline, description,
  address, city, province, latitude, longitude, total_units, is_active, is_public_case_study
)
VALUES (
  'bbbb2222-2222-2222-2222-222222222222',
  'aaaa1111-1111-1111-1111-111111111111',
  'the-park-townhouse-sukoharjo',
  'The Park Townhouse Sukoharjo',
  'mewah',
  'Hunian Modern Eksklusif Bernuansa Jepang di Jantung Sukoharjo & Akses Solo Baru',
  'Townhouse eksklusif 30 unit dengan 3 cluster bertema arsitektur modern tropis Jepang: Nagoya, Osaka, dan Tokyo. Dilengkapi sistem keamanan one-gate system, underground utilities, dan akses prima ke pusat bisnis Sukoharjo dan Solo Baru.',
  'Jl. Wandyo Pranoto, Mandan, Sukoharjo',
  'Sukoharjo',
  'Jawa Tengah',
  -7.67150,
  110.84150,
  30,
  TRUE,
  TRUE
) ON CONFLICT DO NOTHING;

-- 6. SEED CLUSTERS DENGAN KOORDINAT ASLI (Prompt Bagian 7)
INSERT INTO clusters (id, tenant_id, project_id, name, latitude, longitude, description)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'bbbb2222-2222-2222-2222-222222222222', 'Nagoya', -7.6738726546957565, 110.84397833605674, 'Cluster Luxury Tipe Diamond (75/90), 10 unit eksklusif dengan view taman privat.'),
  ('c2222222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'bbbb2222-2222-2222-2222-222222222222', 'Osaka', -7.670296745443235, 110.83933117795694, 'Cluster Premium Tipe Gold (60/72), 10 unit dengan layout efisien dan pencahayaan alami.'),
  ('c3333333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111', 'bbbb2222-2222-2222-2222-222222222222', 'Tokyo', -7.670599344181913, 110.83923919943206, 'Cluster Modern Tipe Emerald (50/60), 10 unit ideal untuk keluarga muda dan profesional.')
ON CONFLICT DO NOTHING;

-- 7. SEED USERS DI PT ANDARA REJO MAKMUR (Hierarki & Role)
INSERT INTO users (id, tenant_id, email, password_hash, name, phone, role, is_active)
VALUES 
  ('u1111111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'direksi@andararejomakmur.co.id', '$2a$10$demoHashOwnerBambang9988', 'Bambang Soedirjo', '081223344556', 'DEVELOPER_OWNER', TRUE),
  ('u2222222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'ferry.sm@andararejomakmur.co.id', '$2a$10$demoHashSMFerry9988', 'Ferry Kurniawan', '081334455667', 'SALES_MANAGER', TRUE),
  ('u3333333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111', 'tl.ai@andararejomakmur.co.id', '$2a$10$demoHashTLAI9988', 'AI Team Leader', '081445566778', 'TEAM_LEADER', TRUE),
  ('u4444444-4444-4444-4444-444444444444', 'aaaa1111-1111-1111-1111-111111111111', 'raka.se@andararejomakmur.co.id', '$2a$10$demoHashSERaka9988', 'Raka Pratama', '081556677889', 'SALES_EXECUTIVE', TRUE),
  ('u5555555-5555-5555-5555-555555555555', 'aaaa1111-1111-1111-1111-111111111111', 'agus.mkt@andararejomakmur.co.id', '$2a$10$demoHashMktAgus9988', 'Agus Prasetyo', '081667788990', 'DIGITAL_MARKETING', TRUE)
ON CONFLICT DO NOTHING;

-- Set Manager Hierarchy (SE -> TL -> SM)
UPDATE users SET manager_id = 'u2222222-2222-2222-2222-222222222222' WHERE id = 'u3333333-3333-3333-3333-333333333333';
UPDATE users SET manager_id = 'u3333333-3333-3333-3333-333333333333' WHERE id = 'u4444444-4444-4444-4444-444444444444';


-- ==========================================
-- FILE: db/migrations\0003_lead_pipeline.sql
-- ==========================================
-- 0003 · Lead, kualifikasi BANT, pipeline, appointment, penawaran, tugas
begin;

-- Master sumber / kode konten (modul A4)
create table devos.sumber_lead (
  id     uuid primary key default gen_random_uuid(),
  kode   text not null,
  nama   text not null,
  kanal  text,
  aktif  boolean not null default true
);
create unique index sumber_lead_kode_uk on devos.sumber_lead (lower(kode));

create table devos.lead (
  id               uuid primary key default gen_random_uuid(),
  proyek_id        uuid not null references devos.proyek(id) on delete restrict,
  tanggal_masuk    timestamptz not null default now(),
  nama             text not null,
  no_wa            text not null check (no_wa ~ '^\+?[0-9]{8,15}$'),
  domisili         text not null,
  ring             devos.ring_geo,
  sumber_id        uuid not null references devos.sumber_lead(id),
  kode_konten      text,
  izin_dihubungi   boolean not null,                  -- opt-in (A2/A7)
  izin_dicatat_pada timestamptz,
  izin_lokasi      text,
  -- pemilik; NULL = kembali ke pool (aturan 72 jam)
  se_id            uuid references devos.pengguna(id) on delete restrict,
  pemilik_sejak    timestamptz not null default now(),
  respons_pertama_pada timestamptz,
  terakhir_dihubungi   timestamptz,
  tahap            devos.tahap_pipeline not null default 'new',
  persona          devos.persona,
  kelas_lead       devos.kelas_lead,
  tandai_agen_pesaing boolean not null default false,
  -- BANT 0-3 per huruf
  bant_b           smallint check (bant_b between 0 and 3),
  bant_a           smallint check (bant_a between 0 and 3),
  bant_n           smallint check (bant_n between 0 and 3),
  bant_t           smallint check (bant_t between 0 and 3),
  bant_total       smallint generated always as (
    case when bant_b is not null and bant_a is not null
           and bant_n is not null and bant_t is not null
         then bant_b + bant_a + bant_n + bant_t end
  ) stored,
  bant_grade       text generated always as (
    case when bant_b is null or bant_a is null or bant_n is null or bant_t is null then null
         when bant_b + bant_a + bant_n + bant_t >= 10 then 'A'
         when bant_b + bant_a + bant_n + bant_t >= 7  then 'B'
         when bant_b + bant_a + bant_n + bant_t >= 4  then 'C'
         else 'D' end
  ) stored,
  anggaran_min     numeric(16,2) check (anggaran_min >= 0),
  anggaran_maks    numeric(16,2) check (anggaran_maks >= 0),
  skema_bayar      devos.skema_bayar,
  kebutuhan_kamar  smallint check (kebutuhan_kamar >= 0),
  jumlah_kendaraan smallint check (jumlah_kendaraan >= 0),
  lt_dicari        numeric(10,2),
  lb_dicari        numeric(10,2),
  langkah_berikut      text,
  langkah_berikut_tgl  date,
  alasan_lost      devos.alasan_lost,
  pesaing          text,
  created_by       uuid references devos.pengguna(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint lead_wajib_izin_tercatat check (not izin_dihubungi or izin_dicatat_pada is not null),
  constraint lead_anggaran_valid check (anggaran_maks is null or anggaran_min is null or anggaran_maks >= anggaran_min),
  -- D8: naik ke Prospek (qualified) minimal BANT 7; E2: Hot minimal BANT 10
  constraint lead_stage_gate_bant check (
    tahap in ('new', 'contacted', 'closed_lost') or bant_total >= 7
  ),
  constraint lead_stage_gate_hot check (tahap <> 'hot' or bant_total >= 10),
  -- E5: Closed-Lost wajib alasan; memilih proyek lain wajib sebut nama
  constraint lead_lost_wajib_alasan check (tahap <> 'closed_lost' or alasan_lost is not null),
  constraint lead_proyek_lain_wajib_nama check (alasan_lost is distinct from 'proyek_lain' or pesaing is not null)
);
create index lead_no_wa_idx    on devos.lead (no_wa);
create index lead_se_tahap_idx on devos.lead (se_id, tahap);
create index lead_proyek_idx   on devos.lead (proyek_id, tanggal_masuk desc);
create index lead_next_step_idx on devos.lead (langkah_berikut_tgl) where tahap not in ('net_sales', 'closed_lost');

-- Unit yang diminati (multi)
create table devos.lead_unit_minat (
  lead_id uuid not null references devos.lead(id) on delete cascade,
  unit_id uuid not null references devos.unit(id) on delete cascade,
  primary key (lead_id, unit_id)
);

-- Timeline riwayat kontak (E6): perubahan tahap, pemilik, skor, chat, telepon, dll.
create table devos.lead_timeline (
  id        bigint generated always as identity primary key,
  lead_id   uuid not null references devos.lead(id) on delete cascade,
  jenis     text not null,
  ringkasan text,
  data      jsonb not null default '{}'::jsonb,
  oleh      uuid,
  waktu     timestamptz not null default now()
);
create index lead_timeline_lead_idx on devos.lead_timeline (lead_id, waktu desc);

create function devos.catat_perubahan_lead() returns trigger
language plpgsql security definer set search_path = devos, pg_temp as $$
declare v_oleh uuid := nullif(current_setting('devos.user_id', true), '')::uuid;
begin
  if tg_op = 'INSERT' then
    insert into devos.lead_timeline (lead_id, jenis, ringkasan, oleh)
    values (new.id, 'lead_masuk', 'Lead dibuat', v_oleh);
    return new;
  end if;
  if new.tahap is distinct from old.tahap then
    insert into devos.lead_timeline (lead_id, jenis, ringkasan, data, oleh)
    values (new.id, 'tahap', old.tahap || ' -> ' || new.tahap,
            jsonb_build_object('dari', old.tahap, 'ke', new.tahap), v_oleh);
  end if;
  if new.se_id is distinct from old.se_id then
    insert into devos.lead_timeline (lead_id, jenis, ringkasan, data, oleh)
    values (new.id, 'pemilik', 'Pemilik lead berubah',
            jsonb_build_object('dari', old.se_id, 'ke', new.se_id), v_oleh);
  end if;
  if new.bant_total is distinct from old.bant_total then
    insert into devos.lead_timeline (lead_id, jenis, ringkasan, data, oleh)
    values (new.id, 'bant', 'Skor BANT ' || coalesce(old.bant_total::text, '-') || ' -> ' || coalesce(new.bant_total::text, '-'),
            jsonb_build_object('dari', old.bant_total, 'ke', new.bant_total), v_oleh);
  end if;
  return new;
end $$;
create trigger lead_timeline_trg after insert or update on devos.lead
  for each row execute function devos.catat_perubahan_lead();

-- Appointment & kunjungan (modul H)
create table devos.appointment (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references devos.lead(id) on delete cascade,
  se_id         uuid not null references devos.pengguna(id) on delete restrict,
  waktu         timestamptz not null,
  jenis         devos.jenis_appointment not null default 'marketing_gallery',
  status        devos.status_appointment not null default 'dijadwalkan',
  konfirmasi_h1_pada timestamptz,
  form_kunjungan jsonb not null default '{}'::jsonb,   -- checklist, pengambil keputusan, trial close
  catatan_hasil text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index appointment_se_waktu_idx on devos.appointment (se_id, waktu);
create index appointment_lead_idx on devos.appointment (lead_id);

-- Penawaran tertulis (modul G); harga di-snapshot saat dibuat
create table devos.penawaran (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references devos.lead(id) on delete cascade,
  se_id          uuid not null references devos.pengguna(id) on delete restrict,
  unit_id        uuid not null references devos.unit(id) on delete restrict,
  skema          devos.skema_bayar not null,
  harga          numeric(16,2) not null check (harga >= 0),
  berlaku_hingga date,
  simulasi       jsonb not null default '{}'::jsonb,
  file_url       text,
  dikirim_pada   timestamptz,
  created_at     timestamptz not null default now()
);
create index penawaran_lead_idx on devos.penawaran (lead_id);

-- Tugas follow-up (modul I)
create table devos.tugas (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid references devos.lead(id) on delete cascade,
  se_id        uuid not null references devos.pengguna(id) on delete cascade,
  jenis        text not null,
  judul        text not null,
  jatuh_tempo  timestamptz not null,
  status       devos.status_tugas not null default 'terbuka',
  selesai_pada timestamptz,
  dibuat_ai    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index tugas_se_due_idx on devos.tugas (se_id, jatuh_tempo) where status = 'terbuka';

-- Cek nomor ganda (A3): boleh melihat pemilik walau lead milik SE lain.
create function devos.cek_nomor_ganda(p_no_wa text)
returns table (lead_id uuid, proyek_id uuid, nama_se text, tahap devos.tahap_pipeline, tanggal_masuk timestamptz)
language sql stable security definer set search_path = devos, pg_temp as $$
  select l.id, l.proyek_id, p.nama, l.tahap, l.tanggal_masuk
    from devos.lead l left join devos.pengguna p on p.id = l.se_id
   where l.no_wa = p_no_wa
   order by l.tanggal_masuk desc
$$;

-- Aturan 72 jam (B4): lead belum dihubungi kembali ke pool. Dipanggil terjadwal (cron/AI).
create function devos.kembalikan_lead_72jam() returns integer
language plpgsql security definer set search_path = devos, pg_temp as $$
declare v_jumlah integer;
begin
  with kembali as (
    update devos.lead
       set se_id = null, pemilik_sejak = now()
     where se_id is not null
       and terakhir_dihubungi is null
       and tahap in ('new', 'contacted')
       and pemilik_sejak < now() - interval '72 hours'
    returning id
  )
  select count(*) into v_jumlah from kembali;
  return v_jumlah;
end $$;

create trigger lead_updated        before update on devos.lead        for each row execute function devos.set_updated_at();
create trigger appointment_updated before update on devos.appointment for each row execute function devos.set_updated_at();
create trigger tugas_updated       before update on devos.tugas       for each row execute function devos.set_updated_at();

insert into devos.schema_migrations (versi) values ('0003_lead_pipeline');
commit;



-- ==========================================
-- FILE: db/migrations\0003_sales_os_phase1a_knowledge_base.sql
-- ==========================================
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


-- ==========================================
-- FILE: db/migrations\0004_booking_transaksi.sql
-- ==========================================
-- 0004 · Booking -> DP -> KPR -> PPJB/Akad (modul K)
begin;

create table devos.booking (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references devos.lead(id) on delete restrict,
  proyek_id        uuid not null references devos.proyek(id) on delete restrict,
  unit_id          uuid not null references devos.unit(id) on delete restrict,
  se_id            uuid not null references devos.pengguna(id) on delete restrict,
  nama_pembeli     text not null,
  harga_final      numeric(16,2) not null check (harga_final > 0),
  skema            devos.skema_bayar not null,
  tanggal_booking  date not null default current_date,
  nominal_booking  numeric(16,2) not null default 5000000 check (nominal_booking >= 0),
  bukti_transfer_url text,
  rekening_resmi_valid boolean not null default false,   -- Q7: rekening PT Andara Rejo Makmur
  status           devos.status_booking not null default 'aktif',
  konfirmasi_admin_pada timestamptz,                      -- H+1
  dokumen_kpr_deadline  date,                             -- H+7
  pengajuan_bank_deadline date,                           -- H+10
  net_sales_pada   timestamptz,
  batal_pada       timestamptz,
  alasan_batal     text,
  refund_nominal   numeric(16,2) check (refund_nominal >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint booking_batal_wajib_alasan check (status <> 'batal' or alasan_batal is not null)
);
-- Satu unit hanya boleh punya satu booking yang masih berjalan / terjual
create unique index booking_unit_aktif_uk on devos.booking (unit_id) where status <> 'batal';
create index booking_se_idx     on devos.booking (se_id, tanggal_booking desc);
create index booking_proyek_idx on devos.booking (proyek_id, tanggal_booking desc);

-- Isi tenggat otomatis, stempel waktu status, dan sinkron status unit.
create function devos.booking_sinkron() returns trigger
language plpgsql security definer set search_path = devos, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    new.dokumen_kpr_deadline   := coalesce(new.dokumen_kpr_deadline, new.tanggal_booking + 7);
    new.pengajuan_bank_deadline := coalesce(new.pengajuan_bank_deadline, new.tanggal_booking + 10);
  end if;

  if new.status = 'net_sales' and new.net_sales_pada is null then
    new.net_sales_pada := now();
  elsif new.status = 'batal' and new.batal_pada is null then
    new.batal_pada := now();
  end if;

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    update devos.unit
       set status = case new.status
                      when 'aktif'     then 'booking'::devos.status_unit
                      when 'net_sales' then 'terjual'::devos.status_unit
                      else 'tersedia'::devos.status_unit end
     where id = new.unit_id;
  end if;
  return new;
end $$;
create trigger booking_sinkron_trg before insert or update on devos.booking
  for each row execute function devos.booking_sinkron();

-- Checklist dokumen KPR (K3)
create table devos.booking_dokumen (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references devos.booking(id) on delete cascade,
  jenis      text not null,              -- ktp, kk, npwp, slip_gaji, rekening_koran, dst
  status     devos.status_dokumen not null default 'kurang',
  file_url   text,
  diperbarui_pada timestamptz not null default now(),
  unique (booking_id, jenis)
);

-- Pengajuan multi-bank paralel (K4)
create table devos.booking_pengajuan_bank (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references devos.booking(id) on delete cascade,
  bank          text not null,
  status        devos.status_bank not null default 'diajukan',
  diajukan_pada date not null default current_date,
  keputusan_pada date,
  catatan       text,
  unique (booking_id, bank)
);

-- Jadwal pembayaran cash tempo (K7)
create table devos.booking_pembayaran (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references devos.booking(id) on delete cascade,
  urutan       smallint not null check (urutan > 0),
  jatuh_tempo  date not null,
  nominal      numeric(16,2) not null check (nominal > 0),
  dibayar_pada date,
  unique (booking_id, urutan)
);

create trigger booking_updated before update on devos.booking for each row execute function devos.set_updated_at();

insert into devos.schema_migrations (versi) values ('0004_booking_transaksi');
commit;



-- ==========================================
-- FILE: db/migrations\0004_sales_os_phase1b_org_and_members.sql
-- ==========================================
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


-- ==========================================
-- FILE: db/migrations\0005_kpi_ai_audit.sql
-- ==========================================
-- 0005 · KPI, aktivitas harian, laporan, scorecard, iklan, approval, AI, audit
begin;

-- Parameter sistem: semua angka target/bobot dapat diubah (catatan akhir playbook)
create table devos.parameter_sistem (
  kunci      text primary key,
  nilai      jsonb not null,
  keterangan text,
  diubah_oleh uuid,
  updated_at timestamptz not null default now()
);

-- Target per SE per bulan (M1)
create table devos.target_se (
  id               uuid primary key default gen_random_uuid(),
  se_id            uuid not null references devos.pengguna(id) on delete cascade,
  periode          date not null check (periode = date_trunc('month', periode)::date),
  target_lead      integer not null default 0 check (target_lead >= 0),
  target_prospek   integer not null default 0 check (target_prospek >= 0),
  target_kunjungan integer not null default 0 check (target_kunjungan >= 0),
  target_booking   integer not null default 0 check (target_booking >= 0),
  target_net_sales integer not null default 0 check (target_net_sales >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (se_id, periode)
);

-- Log aktivitas harian (modul J)
create table devos.aktivitas_harian (
  id          uuid primary key default gen_random_uuid(),
  se_id       uuid not null references devos.pengguna(id) on delete cascade,
  tanggal     date not null default current_date,
  jenis       devos.jenis_aktivitas not null,
  jumlah      integer not null default 1 check (jumlah > 0),
  durasi_menit integer check (durasi_menit >= 0),
  lead_id     uuid references devos.lead(id) on delete set null,
  bukti_url   text,
  lat         numeric(9,6) check (lat between -90 and 90),
  lng         numeric(9,6) check (lng between -180 and 180),
  catatan     text,
  created_at  timestamptz not null default now()
);
create index aktivitas_se_tgl_idx on devos.aktivitas_harian (se_id, tanggal, jenis);

-- Laporan harian SE (N1); terkunci setelah 18.00
create table devos.laporan_harian (
  id          uuid primary key default gen_random_uuid(),
  se_id       uuid not null references devos.pengguna(id) on delete cascade,
  tanggal     date not null,
  isi         jsonb not null default '[]'::jsonb,
  hambatan    text,
  dikirim_pada timestamptz,
  terkunci    boolean not null default false,
  umpan_balik_ai text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (se_id, tanggal)
);

-- Scorecard bulanan berbobot (M5/M6)
create table devos.scorecard_bulanan (
  id          uuid primary key default gen_random_uuid(),
  se_id       uuid not null references devos.pengguna(id) on delete cascade,
  periode     date not null check (periode = date_trunc('month', periode)::date),
  komponen    jsonb not null default '[]'::jsonb,
  total_poin  numeric(6,2) not null default 0,
  kategori    devos.kategori_scorecard,
  narasi_ai   text,
  dihitung_pada timestamptz not null default now(),
  unique (se_id, periode)
);

-- Kampanye & biaya iklan (modul O)
create table devos.kampanye_iklan (
  id         uuid primary key default gen_random_uuid(),
  proyek_id  uuid not null references devos.proyek(id) on delete cascade,
  kode       text not null,
  kanal      text not null,
  nama       text,
  aktif      boolean not null default true,
  unique (proyek_id, kode)
);
create table devos.biaya_iklan (
  id          uuid primary key default gen_random_uuid(),
  kampanye_id uuid not null references devos.kampanye_iklan(id) on delete cascade,
  tanggal     date not null,
  biaya       numeric(16,2) not null check (biaya >= 0),
  unique (kampanye_id, tanggal)
);

-- Program resmi & matriks kewenangan AI (Q2, S21)
create table devos.program_resmi (
  id          uuid primary key default gen_random_uuid(),
  proyek_id   uuid references devos.proyek(id) on delete cascade,
  nama        text not null,
  jenis       text not null,
  nilai_maks  numeric(16,2),
  berlaku_dari date not null,
  berlaku_sampai date,
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (berlaku_sampai is null or berlaku_sampai >= berlaku_dari)
);
create table devos.matriks_kewenangan (
  jenis_permintaan text primary key,
  batas_otomatis   numeric(16,2) not null default 0,   -- di bawah/sama = AI boleh setujui
  wajib_eskalasi   boolean not null default false,
  sla_jam          integer not null default 24,
  keterangan       text
);

-- Approval permintaan khusus / diskon (Q1, S9)
create table devos.persetujuan (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references devos.lead(id) on delete set null,
  booking_id    uuid references devos.booking(id) on delete set null,
  diajukan_oleh uuid not null references devos.pengguna(id) on delete restrict,
  jenis_permintaan text not null references devos.matriks_kewenangan(jenis_permintaan),
  program_id    uuid references devos.program_resmi(id),
  nilai_diminta numeric(16,2),
  alasan_pengajuan text,
  status        devos.status_persetujuan not null default 'menunggu',
  diputuskan_ai boolean not null default false,
  diputuskan_oleh uuid references devos.pengguna(id),
  alasan_keputusan text,
  rekomendasi_ai text,
  sla_sampai    timestamptz,
  diputuskan_pada timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index persetujuan_status_idx on devos.persetujuan (status, created_at);

-- Log keputusan AI & banding SE (S22)
create table devos.ai_keputusan (
  id          uuid primary key default gen_random_uuid(),
  agen        text not null,          -- briefing_pagi, evening_check, audit_crm, distribusi_lead, ...
  target_id   uuid references devos.pengguna(id) on delete set null,
  jenis       text not null,
  ringkasan   text not null,
  alasan      text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index ai_keputusan_target_idx on devos.ai_keputusan (target_id, created_at desc);

create table devos.ai_banding (
  id              uuid primary key default gen_random_uuid(),
  keputusan_id    uuid not null references devos.ai_keputusan(id) on delete cascade,
  diajukan_oleh   uuid not null references devos.pengguna(id) on delete cascade,
  alasan          text not null,
  status          text not null default 'menunggu' check (status in ('menunggu', 'diterima', 'ditolak')),
  putusan_oleh    uuid references devos.pengguna(id),
  putusan_catatan text,
  created_at      timestamptz not null default now(),
  diputuskan_pada timestamptz
);

-- Notifikasi
create table devos.notifikasi (
  id          uuid primary key default gen_random_uuid(),
  pengguna_id uuid not null references devos.pengguna(id) on delete cascade,
  judul       text not null,
  isi         text,
  tautan      text,
  dibaca_pada timestamptz,
  created_at  timestamptz not null default now()
);
create index notifikasi_pengguna_idx on devos.notifikasi (pengguna_id, created_at desc) where dibaca_pada is null;

-- ===== Audit log (Q5): tambah-saja, diisi trigger =====
create table devos.audit_log (
  id         bigint generated always as identity primary key,
  tabel      text not null,
  record_id  text,
  aksi       text not null,
  data_lama  jsonb,
  data_baru  jsonb,
  oleh       uuid,
  waktu      timestamptz not null default now()
);
create index audit_log_tabel_idx on devos.audit_log (tabel, record_id, waktu desc);

create function devos.audit() returns trigger
language plpgsql security definer set search_path = devos, pg_temp as $$
declare v_old jsonb; v_new jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new); end if;
  if tg_table_name = 'pengguna' then          -- jangan simpan hash password
    v_old := v_old - 'password_hash';
    v_new := v_new - 'password_hash';
  end if;
  if tg_op = 'UPDATE' and v_old = v_new then return new; end if;
  insert into devos.audit_log (tabel, record_id, aksi, data_lama, data_baru, oleh)
  values (tg_table_name, coalesce(v_new->>'id', v_old->>'id'), tg_op, v_old, v_new,
          nullif(current_setting('devos.user_id', true), '')::uuid);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['pengguna', 'proyek', 'unit', 'target_proyek', 'portofolio_direksi',
                           'lead', 'booking', 'persetujuan', 'program_resmi', 'matriks_kewenangan']
  loop
    execute format('create trigger %I after insert or update or delete on devos.%I
                    for each row execute function devos.audit()', t || '_audit', t);
  end loop;
end $$;

create trigger target_se_updated  before update on devos.target_se      for each row execute function devos.set_updated_at();
create trigger laporan_updated    before update on devos.laporan_harian for each row execute function devos.set_updated_at();
create trigger program_updated    before update on devos.program_resmi  for each row execute function devos.set_updated_at();
create trigger persetujuan_updated before update on devos.persetujuan   for each row execute function devos.set_updated_at();

insert into devos.schema_migrations (versi) values ('0005_kpi_ai_audit');
commit;



-- ==========================================
-- FILE: db/migrations\0005_sales_os_phase2_market_research_and_targets.sql
-- ==========================================
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


-- ==========================================
-- FILE: db/migrations\0006_sales_os_phase3_content_calendar.sql
-- ==========================================
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


-- ==========================================
-- FILE: db/migrations\0006_sm_direksi_views_dan_fitur_lengkap.sql
-- ==========================================
-- 0006 · SM, Direksi views, jadwal piket, referral, co-broke, sales library, dan fungsi analitik
begin;

-- ===== 1. Tipe Tambahan =====
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'jenis_shift' and n.nspname = 'devos') then
    create type devos.jenis_shift as enum ('pagi_siang', 'malam', 'weekend_full', 'libur');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'kategori_pemberi_referral' and n.nspname = 'devos') then
    create type devos.kategori_pemberi_referral as enum ('pembeli', 'warga', 'karyawan', 'lainnya');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'kategori_materi_sales' and n.nspname = 'devos') then
    create type devos.kategori_materi_sales as enum (
      'e_brosur', 'pricelist', 'denah', 'video', 'skrip_penjualan', 'objection_handling', 'keunggulan_99', 'lainnya'
    );
  end if;
end $$;

-- ===== 2. Modul B2 & S15: Jadwal Piket & Shift SE =====
create table if not exists devos.jadwal_piket (
  id              uuid primary key default gen_random_uuid(),
  se_id           uuid not null references devos.pengguna(id) on delete cascade,
  tanggal         date not null,
  shift           devos.jenis_shift not null default 'pagi_siang',
  jam_mulai       time not null default '08:00',
  jam_selesai     time not null default '21:00',
  zona_canvassing text check (zona_canvassing in ('A', 'B', 'C', 'D', 'E')),
  pasangan_se_id  uuid references devos.pengguna(id) on delete set null,
  hadir           boolean,
  catatan         text,
  dibuat_ai       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (se_id, tanggal)
);
create index if not exists jadwal_piket_tgl_idx on devos.jadwal_piket (tanggal, shift);

-- ===== 3. Modul L5: Manajemen Agen Co-broke =====
create table if not exists devos.agen_cobroke (
  id             uuid primary key default gen_random_uuid(),
  nama_kantor    text not null,
  nama_agen      text not null,
  no_wa          text not null check (no_wa ~ '^\+?[0-9]{8,15}$'),
  email          text,
  komisi_persen  numeric(5,2) not null default 2.50 check (komisi_persen >= 0),
  aktif          boolean not null default true,
  catatan        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists agen_cobroke_wa_idx on devos.agen_cobroke (no_wa);

-- Hubungkan lead & booking ke agen co-broke jika bersumber dari agen (A6, L5)
alter table devos.lead add column if not exists agen_cobroke_id uuid references devos.agen_cobroke(id) on delete set null;
alter table devos.booking add column if not exists agen_cobroke_id uuid references devos.agen_cobroke(id) on delete set null;

-- ===== 4. Modul L4: Program Referral "Sahabat The Park" =====
create table if not exists devos.referral (
  id               uuid primary key default gen_random_uuid(),
  proyek_id        uuid not null references devos.proyek(id) on delete restrict,
  nama_pemberi     text not null,
  no_wa_pemberi    text not null check (no_wa_pemberi ~ '^\+?[0-9]{8,15}$'),
  kategori_pemberi devos.kategori_pemberi_referral not null default 'pembeli',
  lead_id          uuid references devos.lead(id) on delete set null,
  booking_id       uuid references devos.booking(id) on delete set null,
  se_id            uuid references devos.pengguna(id) on delete set null,
  nominal_imbalan  numeric(16,2) not null default 0 check (nominal_imbalan >= 0),
  status           text not null default 'terdaftar' check (status in ('terdaftar', 'prospek', 'booking', 'net_sales', 'batal')),
  dibayar_pada     timestamptz,
  catatan          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists referral_proyek_idx on devos.referral (proyek_id, status);

-- ===== 5. Modul P: Sales Library & Enablement (P1, P3, P4, P5) =====
create table if not exists devos.sales_library (
  id               uuid primary key default gen_random_uuid(),
  proyek_id        uuid references devos.proyek(id) on delete cascade,
  kategori         devos.kategori_materi_sales not null,
  judul            text not null,
  konten_teks      text,
  file_url         text,
  tag_persona      devos.persona[],
  nomor_keunggulan smallint check (nomor_keunggulan between 1 and 99),
  berlaku_sampai   date,
  aktif            boolean not null default true,
  dibuat_oleh      uuid references devos.pengguna(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists sales_lib_kategori_idx on devos.sales_library (kategori, aktif);

-- Triggers updated_at
create trigger jadwal_piket_updated  before update on devos.jadwal_piket for each row execute function devos.set_updated_at();
create trigger agen_cobroke_updated  before update on devos.agen_cobroke for each row execute function devos.set_updated_at();
create trigger referral_updated      before update on devos.referral     for each row execute function devos.set_updated_at();
create trigger sales_library_updated before update on devos.sales_library for each row execute function devos.set_updated_at();

-- ===== 6. Helper Security & Session Context (RBAC Q4) =====
create or replace function devos.current_user_id() returns uuid
language sql stable as $$
  select nullif(current_setting('devos.user_id', true), '')::uuid;
$$;

create or replace function devos.current_user_role() returns devos.role_pengguna
language sql stable as $$
  select role from devos.pengguna where id = devos.current_user_id();
$$;

-- ===== 7. VIEWS UNTUK DIREKSI (Portofolio Proyek, Target & Aktual) =====

-- View 7.1: Portofolio Proyek per Direksi
create or replace view devos.v_direksi_portofolio as
select
  d.id as direksi_id,
  d.nama as direksi_nama,
  d.email as direksi_email,
  p.id as proyek_id,
  p.kode as kode_proyek,
  p.nama as nama_proyek,
  p.tipe as tipe_proyek,
  p.lokasi as lokasi_proyek,
  p.aktif as proyek_aktif,
  count(distinct u.id) as total_unit,
  count(distinct u.id) filter (where u.status = 'tersedia') as unit_tersedia,
  count(distinct u.id) filter (where u.status = 'hold') as unit_hold,
  count(distinct u.id) filter (where u.status = 'booking') as unit_booking,
  count(distinct u.id) filter (where u.status = 'terjual') as unit_terjual
from devos.pengguna d
join devos.portofolio_direksi pd on pd.direksi_id = d.id
join devos.proyek p on p.id = pd.proyek_id
left join devos.unit u on u.proyek_id = p.id
where d.role = 'DIREKSI' and d.aktif
group by d.id, d.nama, d.email, p.id, p.kode, p.nama, p.tipe, p.lokasi, p.aktif;

-- View 7.2: Target vs Aktual Kinerja per Proyek dalam Portofolio Direksi
create or replace view devos.v_direksi_target_vs_aktual as
select
  d.id as direksi_id,
  d.nama as direksi_nama,
  p.id as proyek_id,
  p.kode as kode_proyek,
  p.nama as nama_proyek,
  p.tipe as tipe_proyek,
  tp.periode,

  -- Target Manajemen
  coalesce(tp.target_lead, 0) as target_lead,
  coalesce(tp.target_booking, 0) as target_booking,
  coalesce(tp.target_net_sales, 0) as target_net_sales,
  coalesce(tp.target_omzet, 0) as target_omzet,

  -- Hasil Aktual Periode Tersebut
  coalesce(act.aktual_lead, 0) as aktual_lead,
  coalesce(act.aktual_prospek, 0) as aktual_prospek,
  coalesce(act.aktual_kunjungan, 0) as aktual_kunjungan,
  coalesce(act.aktual_booking, 0) as aktual_booking,
  coalesce(act.aktual_net_sales, 0) as aktual_net_sales,
  coalesce(act.aktual_omzet, 0) as aktual_omzet,

  -- Persentase Capaian (%)
  case when coalesce(tp.target_lead, 0) > 0
       then round((coalesce(act.aktual_lead, 0)::numeric / tp.target_lead * 100), 1)
       else 0 end as persen_lead,

  case when coalesce(tp.target_booking, 0) > 0
       then round((coalesce(act.aktual_booking, 0)::numeric / tp.target_booking * 100), 1)
       else 0 end as persen_booking,

  case when coalesce(tp.target_net_sales, 0) > 0
       then round((coalesce(act.aktual_net_sales, 0)::numeric / tp.target_net_sales * 100), 1)
       else 0 end as persen_net_sales,

  case when coalesce(tp.target_omzet, 0) > 0
       then round((coalesce(act.aktual_omzet, 0)::numeric / tp.target_omzet * 100), 1)
       else 0 end as persen_omzet,

  -- Gap ke target
  (coalesce(act.aktual_net_sales, 0) - coalesce(tp.target_net_sales, 0)) as gap_net_sales,
  (coalesce(act.aktual_omzet, 0) - coalesce(tp.target_omzet, 0)) as gap_omzet

from devos.pengguna d
join devos.portofolio_direksi pd on pd.direksi_id = d.id
join devos.proyek p on p.id = pd.proyek_id
join devos.target_proyek tp on tp.proyek_id = p.id
left join lateral (
  select
    count(l.id) as aktual_lead,
    count(l.id) filter (where l.bant_total >= 7 or l.tahap in ('qualified', 'appointment', 'visited', 'hot', 'booking', 'proses_dp_kpr', 'net_sales')) as aktual_prospek,
    (
      select count(a.id)
      from devos.appointment a
      join devos.lead l2 on l2.id = a.lead_id
      where l2.proyek_id = p.id
        and a.status = 'hadir'
        and date_trunc('month', a.waktu)::date = tp.periode
    ) as aktual_kunjungan,
    (
      select count(b.id)
      from devos.booking b
      where b.proyek_id = p.id
        and b.status in ('aktif', 'net_sales')
        and date_trunc('month', b.tanggal_booking)::date = tp.periode
    ) as aktual_booking,
    (
      select count(b.id)
      from devos.booking b
      where b.proyek_id = p.id
        and b.status = 'net_sales'
        and date_trunc('month', coalesce(b.net_sales_pada, b.tanggal_booking))::date = tp.periode
    ) as aktual_net_sales,
    (
      select coalesce(sum(b.harga_final), 0)
      from devos.booking b
      where b.proyek_id = p.id
        and b.status = 'net_sales'
        and date_trunc('month', coalesce(b.net_sales_pada, b.tanggal_booking))::date = tp.periode
    ) as aktual_omzet
  from devos.lead l
  where l.proyek_id = p.id
    and date_trunc('month', l.tanggal_masuk)::date = tp.periode
) act on true
where d.role = 'DIREKSI' and d.aktif;

-- View 7.3: Ringkasan Total Portofolio Seluruh Proyek Direksi
create or replace view devos.v_direksi_ringkasan_akumulasi as
select
  direksi_id,
  direksi_nama,
  periode,
  count(distinct proyek_id) as total_proyek_dikelola,
  sum(target_booking) as total_target_booking,
  sum(aktual_booking) as total_aktual_booking,
  sum(target_net_sales) as total_target_net_sales,
  sum(aktual_net_sales) as total_aktual_net_sales,
  sum(target_omzet) as total_target_omzet,
  sum(aktual_omzet) as total_aktual_omzet,
  case when sum(target_omzet) > 0
       then round((sum(aktual_omzet) / sum(target_omzet) * 100), 1)
       else 0 end as persen_omzet_akumulatif
from devos.v_direksi_target_vs_aktual
group by direksi_id, direksi_nama, periode;

-- ===== 8. VIEWS UNTUK SALES MANAGER (SM) UNTUK MEMANTAU SE DIBAWAHNYA =====

-- View 8.1: Daftar SE di bawah binaan SM beserta status dan beban kerja
create or replace view devos.v_sm_tim_se as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  sm.jenis_akun as sm_jenis_akun,
  se.id as se_id,
  se.nama as se_nama,
  se.email as se_email,
  se.no_wa as se_no_wa,
  se.aktif as se_aktif,
  se.last_login_at as se_terakhir_aktif,
  string_agg(distinct p.nama, ', ') as proyek_ditugaskan,
  count(distinct l.id) filter (where l.tahap not in ('net_sales', 'closed_lost')) as total_lead_aktif,
  count(distinct l.id) filter (where l.tahap = 'hot') as total_hot_prospek,
  count(distinct t.id) filter (where t.status = 'terbuka' and t.jatuh_tempo < now()) as tugas_lewat_tempo
from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id and se.role = 'SE'
left join devos.penugasan_proyek pp on pp.pengguna_id = se.id
left join devos.proyek p on p.id = pp.proyek_id
left join devos.lead l on l.se_id = se.id
left join devos.tugas t on t.se_id = se.id
where sm.role in ('SM', 'TL') and sm.aktif
group by sm.id, sm.nama, sm.jenis_akun, se.id, se.nama, se.email, se.no_wa, se.aktif, se.last_login_at;

-- View 8.2: SM Pantau Kinerja & KPI Harian/Bulanan SE Dibawahnya
create or replace view devos.v_sm_pantau_se_kinerja as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  se.id as se_id,
  se.nama as se_nama,
  date_trunc('month', current_date)::date as periode,

  -- Target SE Bulan Ini
  coalesce(tse.target_lead, 0) as target_lead,
  coalesce(tse.target_prospek, 0) as target_prospek,
  coalesce(tse.target_kunjungan, 0) as target_kunjungan,
  coalesce(tse.target_booking, 0) as target_booking,
  coalesce(tse.target_net_sales, 0) as target_net_sales,

  -- Aktual SE Bulan Ini
  coalesce(act.lead_bulan_ini, 0) as aktual_lead,
  coalesce(act.prospek_bulan_ini, 0) as aktual_prospek,
  coalesce(act.kunjungan_bulan_ini, 0) as aktual_kunjungan,
  coalesce(act.booking_bulan_ini, 0) as aktual_booking,
  coalesce(act.net_sales_bulan_ini, 0) as aktual_net_sales,

  -- Metrik Kecepatan & Kepatuhan SOP
  coalesce(act.lead_tanpa_sentuh_72jam, 0) as lead_terancam_72jam,
  coalesce(act.rata_respons_menit, 0) as rata_respons_menit,

  -- Status Laporan Harian Hari Ini (SOP kirim sebelum 18.00)
  lh.terkunci as laporan_hari_ini_terkunci,
  lh.dikirim_pada as laporan_hari_ini_dikirim_pada,
  case
    when lh.id is null then 'belum_kirim'
    when lh.dikirim_pada::time > '18:00:00' then 'terlambat'
    else 'tepat_waktu'
  end as status_laporan_hari_ini,

  -- Scorecard Terakhir
  sc.total_poin as skor_scorecard_terakhir,
  sc.kategori as kategori_scorecard_terakhir

from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id and se.role = 'SE'
left join devos.target_se tse on tse.se_id = se.id and tse.periode = date_trunc('month', current_date)::date
left join devos.laporan_harian lh on lh.se_id = se.id and lh.tanggal = current_date
left join devos.scorecard_bulanan sc on sc.se_id = se.id and sc.periode = date_trunc('month', current_date)::date
left join lateral (
  select
    count(l.id) as lead_bulan_ini,
    count(l.id) filter (where l.bant_total >= 7) as prospek_bulan_ini,
    count(l.id) filter (
      where l.terakhir_dihubungi is null
        and l.tahap in ('new', 'contacted')
        and l.pemilik_sejak < now() - interval '48 hours'
    ) as lead_tanpa_sentuh_72jam,
    round(avg(
      extract(epoch from (l.respons_pertama_pada - l.tanggal_masuk)) / 60
    ) filter (where l.respons_pertama_pada is not null)::numeric, 1) as rata_respons_menit,
    (
      select count(a.id)
      from devos.appointment a
      where a.se_id = se.id
        and a.status = 'hadir'
        and date_trunc('month', a.waktu)::date = date_trunc('month', current_date)::date
    ) as kunjungan_bulan_ini,
    (
      select count(b.id)
      from devos.booking b
      where b.se_id = se.id
        and b.status in ('aktif', 'net_sales')
        and date_trunc('month', b.tanggal_booking)::date = date_trunc('month', current_date)::date
    ) as booking_bulan_ini,
    (
      select count(b.id)
      from devos.booking b
      where b.se_id = se.id
        and b.status = 'net_sales'
        and date_trunc('month', coalesce(b.net_sales_pada, b.tanggal_booking))::date = date_trunc('month', current_date)::date
    ) as net_sales_bulan_ini
  from devos.lead l
  where l.se_id = se.id
    and date_trunc('month', l.tanggal_masuk)::date = date_trunc('month', current_date)::date
) act on true
where sm.role in ('SM', 'TL') and sm.aktif and se.aktif;

-- View 8.3: SM Monitoring Peringatan Lead 72 Jam (B4, S4)
create or replace view devos.v_sm_lead_peringatan_72jam as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  se.id as se_id,
  se.nama as se_nama,
  l.id as lead_id,
  l.nama as nama_lead,
  l.no_wa,
  l.tahap,
  l.tanggal_masuk,
  l.pemilik_sejak,
  round((extract(epoch from (now() - l.pemilik_sejak)) / 3600)::numeric, 1) as jam_berjalan,
  (72 - round((extract(epoch from (now() - l.pemilik_sejak)) / 3600)::numeric, 1)) as sisa_jam_sebelum_kembali_ke_pool
from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id
join devos.lead l on l.se_id = se.id
where l.terakhir_dihubungi is null
  and l.tahap in ('new', 'contacted')
  and l.pemilik_sejak >= now() - interval '72 hours'
order by l.pemilik_sejak asc;

-- View 8.4: SM Pipeline Review & Hot Prospek Tim (Modul N4, S6)
create or replace view devos.v_sm_pipeline_review as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  se.id as se_id,
  se.nama as se_nama,
  l.id as lead_id,
  l.nama as nama_prospek,
  l.no_wa,
  l.domisili,
  l.persona,
  l.bant_total,
  l.bant_grade,
  l.skema_bayar,
  l.tahap,
  l.langkah_berikut,
  l.langkah_berikut_tgl,
  p.nama as nama_proyek,
  case
    when l.langkah_berikut_tgl < current_date then 'terlambat'
    when l.langkah_berikut_tgl = current_date then 'hari_ini'
    else 'akan_datang'
  end as status_next_step
from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id
join devos.lead l on l.se_id = se.id
join devos.proyek p on p.id = l.proyek_id
where l.tahap in ('qualified', 'appointment', 'visited', 'hot')
order by
  case l.tahap when 'hot' then 1 when 'visited' then 2 when 'appointment' then 3 else 4 end,
  l.langkah_berikut_tgl asc nulls last;

-- View 8.5: SM Log Aktivitas Harian Tim SE (Modul J)
create or replace view devos.v_sm_aktivitas_harian_tim as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  se.id as se_id,
  se.nama as se_nama,
  ah.tanggal,
  ah.jenis,
  sum(ah.jumlah) as total_aktivitas,
  sum(coalesce(ah.durasi_menit, 0)) as total_durasi_menit,
  count(distinct ah.lead_id) as total_lead_terinteraksi
from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id
join devos.aktivitas_harian ah on ah.se_id = se.id
group by sm.id, sm.nama, se.id, se.nama, ah.tanggal, ah.jenis
order by ah.tanggal desc, se.nama, ah.jenis;

-- ===== 8.6 VIEW DIGITAL MARKETER: ANALITIK KAMPANYE & BIAYA IKLAN (Modul O) =====
create or replace view devos.v_digital_marketer_kinerja_iklan as
select
  k.id as kampanye_id,
  k.proyek_id,
  p.nama as nama_proyek,
  k.kode as kode_kampanye,
  k.kanal,
  k.nama as nama_kampanye,
  coalesce(sum(bi.biaya), 0) as total_biaya_iklan,
  count(distinct l.id) as total_leads,
  count(distinct l.id) filter (where l.kelas_lead <> 'tidak_valid') as total_leads_valid,
  case when count(distinct l.id) > 0
       then round((count(distinct l.id) filter (where l.kelas_lead <> 'tidak_valid')::numeric / count(distinct l.id) * 100), 1)
       else 0 end as persen_valid,
  case when count(distinct l.id) > 0
       then round((coalesce(sum(bi.biaya), 0) / count(distinct l.id)), 0)
       else 0 end as cpl_rupiah,
  count(distinct l.id) filter (where l.bant_total >= 7) as total_prospek,
  count(distinct a.id) filter (where a.status = 'hadir') as total_kunjungan,
  count(distinct b.id) filter (where b.status in ('aktif', 'net_sales')) as total_booking,
  case when count(distinct b.id) filter (where b.status in ('aktif', 'net_sales')) > 0
       then round((coalesce(sum(bi.biaya), 0) / count(distinct b.id) filter (where b.status in ('aktif', 'net_sales'))), 0)
       else 0 end as biaya_per_booking
from devos.kampanye_iklan k
join devos.proyek p on p.id = k.proyek_id
left join devos.biaya_iklan bi on bi.kampanye_id = k.id
left join devos.lead l on l.proyek_id = k.proyek_id and l.kode_konten = k.kode
left join devos.appointment a on a.lead_id = l.id
left join devos.booking b on b.lead_id = l.id
group by k.id, k.proyek_id, p.nama, k.kode, k.kanal, k.nama;

-- ===== 9. FUNGSI HITUNG SCORECARD BERBOBOT OTOMATIS (Modul M5) =====
-- Booking 35%, Net sales 20%, Kunjungan 15%, Prospek 10%, Kepatuhan 10%, Waktu Respons 5%, Referral 5%
-- Capaian per komponen maks 150%.
create or replace function devos.hitung_scorecard_se(
  p_se_id   uuid,
  p_periode date default date_trunc('month', current_date)::date
) returns jsonb
language plpgsql security definer set search_path = devos, pg_temp as $$
declare
  v_target record;
  v_realisasi record;
  v_hari_kerja integer := 26;
  v_hari_patuh integer := 0;
  v_skor_booking numeric;
  v_skor_net numeric;
  v_skor_kunjungan numeric;
  v_skor_prospek numeric;
  v_skor_kepatuhan numeric;
  v_skor_respons numeric;
  v_skor_referral numeric;
  v_total_poin numeric;
  v_kategori devos.kategori_scorecard;
  v_komponen jsonb;
begin
  select * into v_target from devos.target_se where se_id = p_se_id and periode = p_periode;
  if not found then
    return jsonb_build_object('error', 'Target SE belum diatur untuk periode ini');
  end if;

  select
    count(l.id) filter (where l.bant_total >= 7) as aktual_prospek,
    coalesce(avg(extract(epoch from (l.respons_pertama_pada - l.tanggal_masuk)) / 60) filter (where l.respons_pertama_pada is not null), 10) as avg_respons_menit,
    (
      select count(a.id) from devos.appointment a
       where a.se_id = p_se_id and a.status = 'hadir'
         and date_trunc('month', a.waktu)::date = p_periode
    ) as aktual_kunjungan,
    (
      select count(b.id) from devos.booking b
       where b.se_id = p_se_id and b.status in ('aktif', 'net_sales')
         and date_trunc('month', b.tanggal_booking)::date = p_periode
    ) as aktual_booking,
    (
      select count(b.id) from devos.booking b
       where b.se_id = p_se_id and b.status = 'net_sales'
         and date_trunc('month', coalesce(b.net_sales_pada, b.tanggal_booking))::date = p_periode
    ) as aktual_net_sales,
    (
      select count(r.id) from devos.referral r
       where r.se_id = p_se_id
         and date_trunc('month', r.created_at)::date = p_periode
    ) as aktual_referral
  into v_realisasi
  from devos.lead l
  where l.se_id = p_se_id and date_trunc('month', l.tanggal_masuk)::date = p_periode;

  -- Hari patuh
  select count(distinct tanggal) into v_hari_patuh
  from devos.aktivitas_harian
  where se_id = p_se_id and date_trunc('month', tanggal)::date = p_periode;

  -- Komponen 1: Booking (Bobot 35%)
  v_skor_booking := least(150, case when v_target.target_booking > 0 then (v_realisasi.aktual_booking::numeric / v_target.target_booking * 100) else 100 end) * 0.35;
  -- Komponen 2: Net Sales (Bobot 20%)
  v_skor_net := least(150, case when v_target.target_net_sales > 0 then (v_realisasi.aktual_net_sales::numeric / v_target.target_net_sales * 100) else 100 end) * 0.20;
  -- Komponen 3: Kunjungan (Bobot 15%)
  v_skor_kunjungan := least(150, case when v_target.target_kunjungan > 0 then (v_realisasi.aktual_kunjungan::numeric / v_target.target_kunjungan * 100) else 100 end) * 0.15;
  -- Komponen 4: Prospek (Bobot 10%)
  v_skor_prospek := least(150, case when v_target.target_prospek > 0 then (v_realisasi.aktual_prospek::numeric / v_target.target_prospek * 100) else 100 end) * 0.10;
  -- Komponen 5: Kepatuhan Aktivitas (Bobot 10%)
  v_skor_kepatuhan := least(150, (v_hari_patuh::numeric / nullif(v_hari_kerja, 0) * 100)) * 0.10;
  -- Komponen 6: Respons CRM (Bobot 5%)
  v_skor_respons := case when v_realisasi.avg_respons_menit <= 5 then 100 when v_realisasi.avg_respons_menit <= 15 then 70 else 40 end * 0.05;
  -- Komponen 7: Referral (Bobot 5%)
  v_skor_referral := least(150, (v_realisasi.aktual_referral::numeric / 12 * 100)) * 0.05;

  v_total_poin := round((v_skor_booking + v_skor_net + v_skor_kunjungan + v_skor_prospek + v_skor_kepatuhan + v_skor_respons + v_skor_referral), 2);

  v_kategori := case
    when v_total_poin >= 120 then 'bintang'::devos.kategori_scorecard
    when v_total_poin >= 100 then 'tercapai'::devos.kategori_scorecard
    when v_total_poin >= 80  then 'mendekati'::devos.kategori_scorecard
    when v_total_poin >= 60  then 'di_bawah_target'::devos.kategori_scorecard
    else 'kritis'::devos.kategori_scorecard
  end;

  v_komponen := jsonb_build_array(
    jsonb_build_object('komponen', 'Booking', 'bobot', 35, 'poin', round(v_skor_booking, 2)),
    jsonb_build_object('komponen', 'Net Sales', 'bobot', 20, 'poin', round(v_skor_net, 2)),
    jsonb_build_object('komponen', 'Kunjungan', 'bobot', 15, 'poin', round(v_skor_kunjungan, 2)),
    jsonb_build_object('komponen', 'Prospek Kualifikasi', 'bobot', 10, 'poin', round(v_skor_prospek, 2)),
    jsonb_build_object('komponen', 'Kepatuhan Aktivitas', 'bobot', 10, 'poin', round(v_skor_kepatuhan, 2)),
    jsonb_build_object('komponen', 'Kecepatan Respons', 'bobot', 5, 'poin', round(v_skor_respons, 2)),
    jsonb_build_object('komponen', 'Referral & Kepuasan', 'bobot', 5, 'poin', round(v_skor_referral, 2))
  );

  insert into devos.scorecard_bulanan (se_id, periode, komponen, total_poin, kategori, narasi_ai, dihitung_pada)
  values (p_se_id, p_periode, v_komponen, v_total_poin, v_kategori,
          'Dihitung otomatis oleh sistem AI SM/TL. Poin total: ' || v_total_poin::text || ' (' || v_kategori::text || ')', now())
  on conflict (se_id, periode) do update
  set komponen = excluded.komponen,
      total_poin = excluded.total_poin,
      kategori = excluded.kategori,
      dihitung_pada = now();

  return jsonb_build_object(
    'se_id', p_se_id,
    'periode', p_periode,
    'total_poin', v_total_poin,
    'kategori', v_kategori,
    'komponen', v_komponen
  );
end $$;

-- Register migration
insert into devos.schema_migrations (versi) values ('0006_sm_direksi_views_dan_fitur_lengkap')
on conflict (versi) do nothing;

commit;


-- ==========================================
-- FILE: db/migrations\0007_sales_os_phase4_playbook_and_routes.sql
-- ==========================================
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


-- ==========================================
-- FILE: db/migrations\0008_sales_os_phase5_project_websites.sql
-- ==========================================
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


-- ==========================================
-- FILE: db/migrations\0009_sales_os_phase6_crm_pipeline_and_superadmin.sql
-- ==========================================
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


-- ==========================================
-- FILE: db/migrations\0010_sales_os_se_field_tracking_and_ai_guide.sql
-- ==========================================
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


