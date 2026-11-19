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
