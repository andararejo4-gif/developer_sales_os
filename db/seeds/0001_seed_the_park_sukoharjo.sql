-- 0001_seed_the_park_sukoharjo.sql
-- Seed Data untuk Developer Sales OS: The Park Townhouse Sukoharjo (PT Andara Rejo Makmur)
begin;

-- 1. Pengguna (Role: DIREKSI, SM, TL, SE, ADMIN, IT)
-- Password hash dummy bcrypt untuk demo login
insert into devos.pengguna (id, email, nama, no_wa, password_hash, role, jenis_akun, atasan_id, aktif)
values
  -- Direksi
  ('10000000-0000-0000-0000-000000000001', 'direksi@andararejomakmur.co.id', 'Bambang Soedirjo (Direksi)', '+6281122334401', '$2a$10$demoHashBcryptDireksi1234567890abcdef', 'DIREKSI', 'manusia', null, true),
  
  -- SM (Sales Manager - Semi AI, manusia dapat login & kelola proyek/pantau SE)
  ('20000000-0000-0000-0000-000000000002', 'sm@andararejomakmur.co.id', 'Ferry Kurniawan (Sales Manager)', '+6281122334402', '$2a$10$demoHashBcryptSM1234567890abcdefghijkl', 'SM', 'manusia', null, true),
  
  -- TL (Full AI agent, dengan opsi akun manusia untuk supervisi/login)
  ('30000000-0000-0000-0000-000000000001', 'ai.tl@andararejomakmur.co.id', 'AI Team Leader (Autonomous)', '+6281122334403', null, 'TL', 'ai', '20000000-0000-0000-0000-000000000002', true),
  ('30000000-0000-0000-0000-000000000002', 'tl.human@andararejomakmur.co.id', 'Rizal Ramli (Supervisor TL)', '+6281122334404', '$2a$10$demoHashBcryptTLHuman1234567890abcdef', 'TL', 'manusia', '20000000-0000-0000-0000-000000000002', true),

  -- 3 Sales Executive (SE) di bawah binaan SM Ferry
  ('40000000-0000-0000-0000-000000000001', 'raka@andararejomakmur.co.id', 'Raka Pratama (SE 1)', '+6281122334411', '$2a$10$demoHashBcryptSE11234567890abcdefghijk', 'SE', 'manusia', '20000000-0000-0000-0000-000000000002', true),
  ('40000000-0000-0000-0000-000000000002', 'dian@andararejomakmur.co.id', 'Dian Lestari (SE 2)', '+6281122334412', '$2a$10$demoHashBcryptSE21234567890abcdefghijk', 'SE', 'manusia', '20000000-0000-0000-0000-000000000002', true),
  ('40000000-0000-0000-0000-000000000003', 'budi@andararejomakmur.co.id', 'Budi Santoso (SE 3)', '+6281122334413', '$2a$10$demoHashBcryptSE31234567890abcdefghijk', 'SE', 'manusia', '20000000-0000-0000-0000-000000000002', true),

  -- Admin Sales
  ('50000000-0000-0000-0000-000000000001', 'admin.sales@andararejomakmur.co.id', 'Siti Rahma (Admin Sales)', '+6281122334421', '$2a$10$demoHashBcryptAdmin1234567890abcdefghi', 'ADMIN', 'manusia', null, true),

  -- IT
  ('60000000-0000-0000-0000-000000000001', 'it@andararejomakmur.co.id', 'Dodi Hartono (IT Lead)', '+6281122334431', '$2a$10$demoHashBcryptIT1234567890abcdefghijk', 'IT', 'manusia', null, true)
on conflict (id) do nothing;

-- 2. Proyek Perumahan
insert into devos.proyek (id, kode, nama, tipe, lokasi, keterangan, aktif, dibuat_oleh)
values (
  'a0000000-0000-0000-0000-000000000001',
  'TP-SKH',
  'The Park Townhouse Sukoharjo',
  'mewah',
  'Jl. Ir. Soekarno, Madegondo, Grogol, Sukoharjo, Jawa Tengah',
  'Hunian modern premium 30 unit (Nagoya, Osaka, Tokyo) dekat Solo Baru dan The Park Mall',
  true,
  '20000000-0000-0000-0000-000000000002'
) on conflict (id) do nothing;

-- 3. Portofolio Direksi
insert into devos.portofolio_direksi (direksi_id, proyek_id)
values (
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001'
) on conflict (direksi_id, proyek_id) do nothing;

-- 4. Penugasan SE ke Proyek
insert into devos.penugasan_proyek (pengguna_id, proyek_id)
values
  ('40000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001')
on conflict (pengguna_id, proyek_id) do nothing;

-- 5. Master Data 30 Unit The Park Townhouse
-- Cluster Nagoya (14 unit), Osaka (9 unit), Tokyo (7 unit)
-- Lengkap dengan LT, LB, harga cash keras, cash 6 bulan, cash 12 bulan, cash 24 bulan, status, dan keterangan
insert into devos.unit (
  proyek_id, cluster, nama_unit, tipe_unit, luas_tanah, luas_bangunan,
  harga_cash_keras, harga_cash_6, harga_cash_12, harga_cash_24, keterangan, status
) values
  -- Cluster Nagoya (Tipe Diamond - LT 90 / LB 75)
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.01', 'Diamond', 90.00, 75.00, 850000000, 875000000, 900000000, 950000000, 'Hook depan gerbang utama, 3 KT, 2 KM, Carport 2 mobil', 'terjual'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.02', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Dekat clubhouse, 3 KT, 2 KM, Carport 2 mobil', 'booking'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.03', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'View taman tengah, 3 KT, 2 KM, Carport 2 mobil', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.04', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Standard, 3 KT, 2 KM, Carport 2 mobil', 'hold'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.05', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Standard, 3 KT, 2 KM, Carport 2 mobil', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.06', 'Diamond', 95.00, 75.00, 860000000, 885000000, 910000000, 960000000, 'Kelebihan tanah 5m, 3 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.07', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Standard, 3 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.08', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Standard, 3 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.09', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Dekat jogging track, 3 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.10', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Standard, 3 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.11', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Standard, 3 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.12', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Standard, 3 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.13', 'Diamond', 90.00, 75.00, 830000000, 855000000, 880000000, 930000000, 'Standard, 3 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Nagoya', 'A.14', 'Diamond', 105.00, 75.00, 910000000, 935000000, 960000000, 1010000000, 'Corner lot luas tanah 105m2', 'tersedia'),

  -- Cluster Osaka (Tipe Gold - LT 72 / LB 60)
  ('a0000000-0000-0000-0000-000000000001', 'Osaka', 'B.01', 'Gold', 72.00, 60.00, 680000000, 700000000, 720000000, 760000000, 'Blok depan Osaka, 2 KT, 2 KM, Carport 1 mobil', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Osaka', 'B.02', 'Gold', 72.00, 60.00, 670000000, 690000000, 710000000, 750000000, 'Standard, 2 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Osaka', 'B.03', 'Gold', 72.00, 60.00, 670000000, 690000000, 710000000, 750000000, 'Standard, 2 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Osaka', 'B.04', 'Gold', 72.00, 60.00, 670000000, 690000000, 710000000, 750000000, 'Standard, 2 KT, 2 KM', 'booking'),
  ('a0000000-0000-0000-0000-000000000001', 'Osaka', 'B.05', 'Gold', 72.00, 60.00, 670000000, 690000000, 710000000, 750000000, 'Standard, 2 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Osaka', 'B.06', 'Gold', 72.00, 60.00, 670000000, 690000000, 710000000, 750000000, 'Standard, 2 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Osaka', 'B.07', 'Gold', 72.00, 60.00, 670000000, 690000000, 710000000, 750000000, 'Standard, 2 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Osaka', 'B.08', 'Gold', 72.00, 60.00, 670000000, 690000000, 710000000, 750000000, 'Standard, 2 KT, 2 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Osaka', 'B.09', 'Gold', 85.00, 60.00, 730000000, 750000000, 775000000, 815000000, 'Hook Osaka samping taman bermain', 'tersedia'),

  -- Cluster Tokyo (Tipe Emerald - LT 60 / LB 50)
  ('a0000000-0000-0000-0000-000000000001', 'Tokyo', 'C.01', 'Emerald', 60.00, 50.00, 580000000, 600000000, 620000000, 650000000, 'Compact modern, 2 KT, 1 KM, Carport 1 mobil', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Tokyo', 'C.02', 'Emerald', 60.00, 50.00, 580000000, 600000000, 620000000, 650000000, 'Compact modern, 2 KT, 1 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Tokyo', 'C.03', 'Emerald', 60.00, 50.00, 580000000, 600000000, 620000000, 650000000, 'Compact modern, 2 KT, 1 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Tokyo', 'C.04', 'Emerald', 60.00, 50.00, 580000000, 600000000, 620000000, 650000000, 'Compact modern, 2 KT, 1 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Tokyo', 'C.05', 'Emerald', 60.00, 50.00, 580000000, 600000000, 620000000, 650000000, 'Compact modern, 2 KT, 1 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Tokyo', 'C.06', 'Emerald', 60.00, 50.00, 580000000, 600000000, 620000000, 650000000, 'Compact modern, 2 KT, 1 KM', 'tersedia'),
  ('a0000000-0000-0000-0000-000000000001', 'Tokyo', 'C.07', 'Emerald', 78.00, 50.00, 630000000, 650000000, 670000000, 710000000, 'Corner lot Tokyo dengan sisa tanah samping', 'tersedia')
on conflict (proyek_id, nama_unit) do nothing;

-- 6. Target Proyek (Bulan Berjalan)
-- Sesuai Bab 1: Target bulanan 5 net sales, 7 booking, 600 lead, 150 prospek, 45 visit
insert into devos.target_proyek (
  proyek_id, periode, target_lead, target_booking, target_net_sales, target_omzet, catatan
) values (
  'a0000000-0000-0000-0000-000000000001',
  date_trunc('month', current_date)::date,
  600,
  7,
  5,
  4150000000, -- asumsi omzet rata-rata 5 unit @ ~830jt
  'Target standar tim 3 SE + AI SM/TL (Funnel 600 -> 150 -> 45 -> 21 -> 7 -> 5)'
) on conflict (proyek_id, periode) do nothing;

-- 7. Target per SE (Bulan Berjalan)
insert into devos.target_se (se_id, periode, target_lead, target_prospek, target_kunjungan, target_booking, target_net_sales)
values
  ('40000000-0000-0000-0000-000000000001', date_trunc('month', current_date)::date, 200, 50, 15, 2, 2),
  ('40000000-0000-0000-0000-000000000002', date_trunc('month', current_date)::date, 200, 50, 15, 2, 2),
  ('40000000-0000-0000-0000-000000000003', date_trunc('month', current_date)::date, 200, 50, 15, 2, 1)
on conflict (se_id, periode) do nothing;

-- 8. Master Sumber Lead
insert into devos.sumber_lead (kode, nama, kanal, aktif)
values
  ('META-CTWA', 'Meta Click to WhatsApp Ads', 'digital', true),
  ('META-LEAD', 'Meta Lead Generation Form', 'digital', true),
  ('TIKTOK', 'TikTok Lead & Video Ads', 'digital', true),
  ('GOOGLE', 'Google Search & Maps', 'digital', true),
  ('PORTAL', 'Portal Properti (Rumah123, Lamudi)', 'digital', true),
  ('WALK-IN', 'Walk-in ke Marketing Gallery', 'offline', true),
  ('OTT', 'Open Table / Exhibition / Expo Mal', 'offline', true),
  ('CANVASSING', 'Canvassing Door-to-Door / Ruko / Perkantoran', 'offline', true),
  ('REFERRAL', 'Program Referral Sahabat The Park', 'referral', true),
  ('CO-BROKE', 'Kantor Agen Co-broke Rekanan', 'partner', true)
on conflict (kode) do nothing;

-- 9. Program Resmi Promo
insert into devos.program_resmi (proyek_id, nama, jenis, nilai_maks, berlaku_dari, berlaku_sampai, aktif)
values
  ('a0000000-0000-0000-0000-000000000001', 'Diskon Launching Akhir Tahun', 'diskon', 25000000, current_date - interval '30 days', current_date + interval '60 days', true),
  ('a0000000-0000-0000-0000-000000000001', 'Subsidi Biaya KPR s/d 15 Juta', 'subsidi_kpr', 15000000, current_date - interval '30 days', current_date + interval '60 days', true),
  ('a0000000-0000-0000-0000-000000000001', 'Free AC 2 Unit & Smart Door Lock', 'hadiah', 10000000, current_date - interval '30 days', current_date + interval '60 days', true)
on conflict do nothing;

-- 10. Matriks Kewenangan AI Approval (Q1, S9, S21)
insert into devos.matriks_kewenangan (jenis_permintaan, batas_otomatis, wajib_eskalasi, sla_jam, keterangan)
values
  ('diskon_program_resmi', 25000000, false, 2, 'Diskon yang tercantum dalam program resmi aktif dapat disetujui AI langsung'),
  ('diskon_khusus_non_program', 0, true, 24, 'Diskon di luar program wajib eskalasi ke Direksi / Owner'),
  ('subsidi_biaya_kpr', 15000000, false, 4, 'Subsidi biaya akad KPR sesuai plafon program resmi'),
  ('bonus_elektronik', 10000000, false, 2, 'Hadiah kanopi/AC/smartlock sesuai batas matriks'),
  ('perpanjangan_tempo_kpr', 14, false, 4, 'Perpanjangan dokumen KPR maksimal 14 hari disetujui AI'),
  ('refund_booking', 0, true, 24, 'Permohonan refund pembatalan wajib keputusan Owner & Legal')
on conflict (jenis_permintaan) do nothing;

commit;
