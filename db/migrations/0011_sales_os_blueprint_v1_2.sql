-- ============================================================================
-- DEVELOPER SALES OS (sales_os)
-- Migration 0011: Blueprint v1.2 Alignment
-- Features Catalog (F01-F100), 48 Agent Registry (A01-A48), Truth Claims Ledger,
-- AIC FinOps Meter, 3-Month Plans & Top-ups, Readiness Gates G0-G3, Closing Config
-- ============================================================================

-- 1. TABEL FEATURES (Katalog 100 Fitur Blueprint Bab 07)
CREATE TABLE IF NOT EXISTS features (
    id VARCHAR(10) PRIMARY KEY,
    modul VARCHAR(10) NOT NULL,
    modul_name VARCHAR(150) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    masalah_id VARCHAR(10) NOT NULL,
    paket_minimum VARCHAR(5) NOT NULL, -- G, P, D
    level_otomasi VARCHAR(5) NOT NULL, -- L0, L1, L2
    satuan_aic VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed 100 Fitur (F01-F100)
INSERT INTO features (id, modul, modul_name, nama, masalah_id, paket_minimum, level_otomasi, satuan_aic)
VALUES
  ('F01', 'M01', 'Project Truth & Onboarding', 'OCR brosur', 'P001', 'G', 'L1', NULL),
  ('F02', 'M01', 'Project Truth & Onboarding', 'Parser', 'P002', 'G', 'L1', NULL),
  ('F03', 'M01', 'Project Truth & Onboarding', 'Geocode', 'P003', 'G', 'L1', NULL),
  ('F04', 'M01', 'Project Truth & Onboarding', 'Knowledge', 'P004', 'G', 'L2', NULL),
  ('F05', 'M01', 'Project Truth & Onboarding', 'Conflict &', 'P005', 'G', 'L1', NULL),
  ('F06', 'M01', 'Project Truth & Onboarding', 'Change', 'P006', 'G', 'L0', '0 AIC dalam kapasitas'),
  ('F07', 'M02', 'Market & Location Intelligence', 'Persona &', 'P007', 'G', 'L1', NULL),
  ('F08', 'M02', 'Market & Location Intelligence', 'STP &', 'P008', 'G', 'L1', NULL),
  ('F09', 'M02', 'Market & Location Intelligence', '7P, SWOT &', 'P009', 'G', 'L1', NULL),
  ('F10', 'M02', 'Market & Location Intelligence', 'Competitor', 'P010', 'G', 'L1', NULL),
  ('F11', 'M02', 'Market & Location Intelligence', 'POI, akses &', 'P011', 'G', 'L1', NULL),
  ('F12', 'M02', 'Market & Location Intelligence', 'Demand &', 'P012', 'G', 'L0', '500 AIC'),
  ('F13', 'M03', '99 Keunggulan & Sales Narrative', 'Generator 99', 'P013', 'G', 'L1', '400 AIC'),
  ('F14', 'M03', '99 Keunggulan & Sales Narrative', 'Claim ledger', 'P014', 'G', 'L1', '100 AIC'),
  ('F15', 'M03', '99 Keunggulan & Sales Narrative', 'Surat cinta', 'P015', 'G', 'L1', NULL),
  ('F16', 'M03', '99 Keunggulan & Sales Narrative', 'Elevator', 'P016', 'G', 'L2', NULL),
  ('F17', 'M03', '99 Keunggulan & Sales Narrative', 'Persona-to-', 'P017', 'G', 'L2', NULL),
  ('F18', 'M03', '99 Keunggulan & Sales Narrative', 'Deck,', 'P018', 'G', 'L0', '0 AIC dalam kapasitas'),
  ('F19', 'M04', 'Content Command Center', 'Kalender 30', 'P019', 'G', 'L1', '450 AIC'),
  ('F20', 'M04', 'Content Command Center', 'Caption,', 'P020', 'G', 'L1', NULL),
  ('F21', 'M04', 'Content Command Center', 'Personal', 'P021', 'G', 'L1', NULL),
  ('F22', 'M04', 'Content Command Center', 'Approval &', 'P022', 'G', 'L2', NULL),
  ('F23', 'M04', 'Content Command Center', 'Content', 'P023', 'G', 'L2', NULL),
  ('F24', 'M04', 'Content Command Center', 'Asset rights', 'P024', 'G', 'L0', '0 AIC dalam kapasitas'),
  ('F25', 'M05', 'Creative Production Studio', 'Poster &', 'P025', 'G', 'L1', '75 AIC'),
  ('F26', 'M05', 'Creative Production Studio', 'Video', 'P026', 'G', 'L1', NULL),
  ('F27', 'M05', 'Creative Production Studio', 'AI visual', 'P027', 'P', 'L1', NULL),
  ('F28', 'M05', 'Creative Production Studio', 'Voiceover &', 'P028', 'P', 'L1', NULL),
  ('F29', 'M05', 'Creative Production Studio', 'Brand kit &', 'P029', 'P', 'L2', NULL),
  ('F30', 'M05', 'Creative Production Studio', 'Bulk', 'P030', 'D', 'L0', '0 AIC dalam kapasitas'),
  ('F31', 'M06', 'Project Website & Conversion', 'Generator', 'P031', 'G', 'L1', '300 AIC'),
  ('F32', 'M06', 'Project Website & Conversion', 'Live product', 'P032', 'G', 'L2', NULL),
  ('F33', 'M06', 'Project Website & Conversion', 'Lead form,', 'P033', 'G', 'L2', NULL),
  ('F34', 'M06', 'Project Website & Conversion', 'Local SEO &', 'P034', 'P', 'L1', NULL),
  ('F35', 'M06', 'Project Website & Conversion', 'CRO,', 'P035', 'P', 'L1', NULL),
  ('F36', 'M06', 'Project Website & Conversion', 'Multi-project', 'P036', 'D', 'L0', '0 AIC dalam kapasitas'),
  ('F37', 'M07', 'Demand Generation & Media Buying', 'Acquisition', 'P037', 'G', 'L1', NULL),
  ('F38', 'M07', 'Demand Generation & Media Buying', 'Official ad', 'P038', 'P', 'L1', NULL),
  ('F39', 'M07', 'Demand Generation & Media Buying', 'Bid, creative', 'P039', 'P', 'L2', NULL),
  ('F40', 'M07', 'Demand Generation & Media Buying', 'Search', 'P040', 'P', 'L1', NULL),
  ('F41', 'M07', 'Demand Generation & Media Buying', 'Retargeting', 'P041', 'P', 'L2', NULL),
  ('F42', 'M07', 'Demand Generation & Media Buying', 'Portfolio', 'P042', 'D', 'L0', '0 AIC dalam kapasitas'),
  ('F43', 'M08', 'Lead CRM & Revenue Workspace', 'Omnichannel', 'P043', 'G', 'L2', NULL),
  ('F44', 'M08', 'Lead CRM & Revenue Workspace', 'Deduplication &', 'P044', 'G', 'L2', NULL),
  ('F45', 'M08', 'Lead CRM & Revenue Workspace', 'BANT & fit', 'P045', 'G', 'L2', NULL),
  ('F46', 'M08', 'Lead CRM & Revenue Workspace', 'Ownership,', 'P046', 'G', 'L2', NULL),
  ('F47', 'M08', 'Lead CRM & Revenue Workspace', 'Next-best-', 'P047', 'G', 'L2', NULL),
  ('F48', 'M08', 'Lead CRM & Revenue Workspace', 'Conversation', 'P048', 'G', 'L0', '0 AIC dalam kapasitas'),
  ('F49', 'M09', 'AI Sales Concierge', 'Chat FAQ', 'P049', 'G', 'L2', '1 AIC'),
  ('F50', 'M09', 'AI Sales Concierge', 'Conversational', 'P050', 'G', 'L2', NULL),
  ('F51', 'M09', 'AI Sales Concierge', 'Objection &', 'P051', 'G', 'L1', NULL),
  ('F52', 'M09', 'AI Sales Concierge', 'Human', 'P052', 'P', 'L2', NULL),
  ('F53', 'M09', 'AI Sales Concierge', 'Quality', 'P053', 'P', 'L1', NULL),
  ('F54', 'M09', 'AI Sales Concierge', 'Opt-in AI', 'P054', 'D', 'L0', '0 AIC dalam kapasitas'),
  ('F55', 'M10', 'Nurture, Appointment & Visit', 'Consent-', 'P055', 'G', 'L2', NULL),
  ('F56', 'M10', 'Nurture, Appointment & Visit', 'Appointment', 'P056', 'G', 'L2', NULL),
  ('F57', 'M10', 'Nurture, Appointment & Visit', 'Visit prep &', 'P057', 'G', 'L1', NULL),
  ('F58', 'M10', 'Nurture, Appointment & Visit', 'Reminder,', 'P058', 'P', 'L2', NULL),
  ('F59', 'M10', 'Nurture, Appointment & Visit', 'Virtual tour', 'P059', 'P', 'L1', NULL),
  ('F60', 'M10', 'Nurture, Appointment & Visit', 'Lifecycle', 'P060', 'D', 'L0', '0 AIC dalam kapasitas'),
  ('F61', 'M11', 'Field Sales, Playbook & Productivity', 'Territory &', 'P061', 'G', 'L1', '30 AIC per SE-hari'),
  ('F62', 'M11', 'Field Sales, Playbook & Productivity', 'Rain,', 'P062', 'G', 'L2', NULL),
  ('F63', 'M11', 'Field Sales, Playbook & Productivity', 'Check-in &', 'P063', 'G', 'L2', NULL),
  ('F64', 'M11', 'Field Sales, Playbook & Productivity', 'Playbook,', 'P064', 'G', 'L1', '400 AIC'),
  ('F65', 'M11', 'Field Sales, Playbook & Productivity', 'Role-play &', 'P065', 'G', 'L2', NULL),
  ('F66', 'M11', 'Field Sales, Playbook & Productivity', 'Daily', 'P066', 'G', 'L0', '0 AIC dalam kapasitas'),
  ('F67', 'M12', 'Inventory, Quotation & Booking', 'Unit', 'P067', 'G', 'L2', NULL),
  ('F68', 'M12', 'Inventory, Quotation & Booking', 'Quote &', 'P068', 'G', 'L1', '10 AIC'),
  ('F69', 'M12', 'Inventory, Quotation & Booking', 'Payment-', 'P069', 'G', 'L1', NULL),
  ('F70', 'M12', 'Inventory, Quotation & Booking', 'Discount &', 'P070', 'P', 'L1', NULL),
  ('F71', 'M12', 'Inventory, Quotation & Booking', 'Booking hold', 'P071', 'P', 'L1', NULL),
  ('F72', 'M12', 'Inventory, Quotation & Booking', 'Portfolio', 'P072', 'D', 'L0', '0 AIC dalam kapasitas'),
  ('F73', 'M13', 'KPR, Documents & Closing Operations', 'KPR', 'P073', 'G', 'L1', NULL),
  ('F74', 'M13', 'KPR, Documents & Closing Operations', 'Secure', 'P074', 'G', 'L1', NULL),
  ('F75', 'M13', 'KPR, Documents & Closing Operations', 'Bank', 'P075', 'P', 'L1', NULL),
  ('F76', 'M13', 'KPR, Documents & Closing Operations', 'Legal', 'P076', 'P', 'L1', NULL),
  ('F77', 'M13', 'KPR, Documents & Closing Operations', 'Payment', 'P077', 'P', 'L1', NULL),
  ('F78', 'M13', 'KPR, Documents & Closing Operations', 'Closing risk', 'P078', 'D', 'L0', '0 AIC dalam kapasitas'),
  ('F79', 'M14', 'Partners, Referral & Offline Growth', 'Referral', 'P079', 'G', 'L2', NULL),
  ('F80', 'M14', 'Partners, Referral & Offline Growth', 'Broker & co-', 'P080', 'G', 'L1', NULL),
  ('F81', 'M14', 'Partners, Referral & Offline Growth', 'Commission', 'P081', 'P', 'L1', NULL),
  ('F82', 'M14', 'Partners, Referral & Offline Growth', 'Corporate &', 'P082', 'P', 'L1', NULL),
  ('F83', 'M14', 'Partners, Referral & Offline Growth', 'Open house', 'P083', 'P', 'L1', NULL),
  ('F84', 'M14', 'Partners, Referral & Offline Growth', 'Channel', 'P084', 'D', 'L0', '0 AIC dalam kapasitas'),
  ('F85', 'M15', 'Revenue Intelligence & Customer Success', 'Funnel', 'P085', 'G', 'L2', NULL),
  ('F86', 'M15', 'Revenue Intelligence & Customer Success', 'Progress', 'P086', 'G', 'L2', NULL),
  ('F87', 'M15', 'Revenue Intelligence & Customer Success', 'Attribution &', 'P087', 'P', 'L1', NULL),
  ('F88', 'M15', 'Revenue Intelligence & Customer Success', 'Revenue,', 'P088', 'D', 'L1', NULL),
  ('F89', 'M15', 'Revenue Intelligence & Customer Success', 'BAST, DLP &', 'P089', 'D', 'L1', NULL),
  ('F90', 'M15', 'Revenue Intelligence & Customer Success', 'Executive', 'P090', 'D', 'L0', '0 AIC dalam kapasitas'),
  ('F91', 'M16', 'Trust, Integration & Enterprise Controls', 'Tenant, roles', 'P091', 'G', 'L2', NULL),
  ('F92', 'M16', 'Trust, Integration & Enterprise Controls', 'Privacy,', 'P092', 'G', 'L2', NULL),
  ('F93', 'M16', 'Trust, Integration & Enterprise Controls', 'Audit,', 'P093', 'G', 'L2', NULL),
  ('F94', 'M16', 'Trust, Integration & Enterprise Controls', 'Official API', 'P094', 'P', 'L1', NULL),
  ('F95', 'M16', 'Trust, Integration & Enterprise Controls', 'Agent', 'P095', 'P', 'L1', NULL),
  ('F96', 'M16', 'Trust, Integration & Enterprise Controls', 'Enterprise', 'P096', 'D', 'L0', NULL),
  ('F97', 'M17', 'SE Attendance, GPS, Calls & Activity Copilot', 'Absensi shift', 'P121', 'G', 'L2', NULL),
  ('F98', 'M17', 'SE Attendance, GPS, Calls & Activity Copilot', 'Tracking GPS', 'P122', 'G', 'L2', NULL),
  ('F99', 'M17', 'SE Attendance, GPS, Calls & Activity Copilot', 'Log', 'P123', 'G', 'L2', NULL),
  ('F100', 'M17', 'SE Attendance, GPS, Calls & Activity Copilot', 'AI guide', 'P124', 'P', 'L0', '5 AIC per kartu')
ON CONFLICT (id) DO UPDATE SET
  nama = EXCLUDED.nama, paket_minimum = EXCLUDED.paket_minimum, level_otomasi = EXCLUDED.level_otomasi, satuan_aic = EXCLUDED.satuan_aic;

-- 2. TABEL AGENT REGISTRY (48 AI Agent Blueprint Bab 09)
CREATE TABLE IF NOT EXISTS agent_registry (
    id VARCHAR(10) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    peran VARCHAR(255) NOT NULL,
    kategori VARCHAR(50) NOT NULL, -- Kontrol Bersama, Spesialis
    level_otomasi_default VARCHAR(5) NOT NULL,
    pekerjaan_utama TEXT,
    batas_kewenangan TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed 48 Agents (A01-A48)
INSERT INTO agent_registry (id, nama, peran, kategori, level_otomasi_default, pekerjaan_utama, batas_kewenangan)
VALUES
  ('A01', 'Orchestrator Menerjemahkan tujuan menjadi rencana,', 'A01 - Orchestrator Menerjemahkan tujuan menjadi rencana,', 'Kontrol Bersama', 'L1', 'dependensi, task dan state machine.', 'Tidak mengeksekusi tool di luar anggaran/otoritas.'),
  ('A02', 'Evidence Guardian Mengikat setiap fakta pada sumber,', 'A02 - Evidence Guardian Mengikat setiap fakta pada sumber,', 'Kontrol Bersama', 'L1', 'halaman, waktu dan versi.', 'Unknown tetap unknown; tidak menjadi sumber legalitas.'),
  ('A03', 'Policy & Consent Memeriksa tujuan pemrosesan,', 'A03 - Policy & Consent Memeriksa tujuan pemrosesan,', 'Kontrol Bersama', 'L1', 'persetujuan komunikasi dan suppression.', 'Tidak menyamakan nomor publik dengan izin pemasaran.'),
  ('A04', 'Safety & Claim QA Mengawasi halusinasi, prompt injection,', 'A04 - Safety & Claim QA Mengawasi halusinasi, prompt injection,', 'Kontrol Bersama', 'L1', 'klaim absolut dan kebijakan kanal.', 'Blok rilis bila harga, rekening atau legalitas tidak terverifikasi.'),
  ('A05', 'Identity & Tenant', 'A05 - Identity & Tenant', 'Kontrol Bersama', 'L1', 'Gate Memeriksa hak akses developer, proyek, peran dan dokumen.', 'Isolasi ditegakkan juga oleh database, bukan prompt saja.'),
  ('A06', 'FinOps & Meter Mencadangkan kredit, mengukur', 'A06 - FinOps & Meter Mencadangkan kredit, mengukur', 'Kontrol Bersama', 'L1', 'pemakaian dan membatasi biaya.', 'Tidak auto-top-up tanpa mandat; billable event idempoten.'),
  ('A07', 'Connector & Recovery Memantau integrasi, webhook, retry,', 'A07 - Connector & Recovery Memantau integrasi, webhook, retry,', 'Kontrol Bersama', 'L1', 'anomali dan pemulihan.', 'Tidak melewati otentikasi atau memakai bot akun pribadi.'),
  ('A08', 'Approval & Escalation Mengarahkan keputusan material ke', 'A08 - Approval & Escalation Mengarahkan keputusan material ke', 'Kontrol Bersama', 'L1', 'orang berwenang dengan ringkasan.', 'Timeout berarti tunggu/eskalasi, bukan persetujuan diam-diam.  A01–A08 adalah lapisan kontrol bersama;'),
  ('A09', 'Document', 'A09 - Document', 'Spesialis', 'L2', 'Intelligence OCR, klasifikasi dan ekstraksi brosur, pricelist serta berkas.', 'Tidak menyimpan PII ke knowledge base pemasaran umum.'),
  ('A10', 'Price & Inventory', 'A10 - Price & Inventory', 'Spesialis', 'L2', 'Data Normalisasi skema harga, unit, periode dan status stok.', 'Perhitungan uang memakai kode deterministik.'),
  ('A11', 'Geo & POI Analyst Peta cluster, fasilitas publik, geocode', 'A11 - Geo & POI Analyst Peta cluster, fasilitas publik, geocode', 'Spesialis', 'L2', 'dan rute berlisensi.', 'Tidak menyalin data peta melampaui lisensi penyedia.'),
  ('A12', 'Market Demand', 'A12 - Market Demand', 'Spesialis', 'L1', 'Analyst Konteks pasar nasional/lokal, musim dan demand hypothesis.', 'Membedakan statistik populasi dengan lead aktual.'),
  ('A13', 'Competitor Analyst Komparabel, normalisasi listing dan', 'A13 - Competitor Analyst Komparabel, normalisasi listing dan', 'Spesialis', 'L1', 'battlecard.', 'Harga listing bukan harga transaksi; no scraping terlarang.'),
  ('A14', 'Persona & STP', 'A14 - Persona & STP', 'Spesialis', 'L1', 'Strategist Kebutuhan pembeli, segmentasi dan value proposition.', 'Tidak menginferensikan atribut sensitif atau menolak secara diskriminatif.'),
  ('A15', '7P & SWOT Strategist Strategi, TOWS, positioning dan', 'A15 - 7P & SWOT Strategist Strategi, TOWS, positioning dan', 'Spesialis', 'L1', 'eksperimen 30 hari.', 'Analisis tidak menggantikan persetujuan produk/anggaran.'),
  ('A16', '99-Advantage', 'A16 - 99-Advantage', 'Spesialis', 'L1', 'Architect Menyusun klaim unik, manfaat, bukti dan caveat.', 'Tidak memaksa 99 klaim bila fakta belum cukup.'),
  ('A17', 'Brand & Sales', 'A17 - Brand & Sales', 'Spesialis', 'L1', 'Copywriter Surat cinta, pitch, FAQ, proposal dan narasi penawaran.', 'Tidak menciptakan testimoni, kelangkaan atau janji hasil.'),
  ('A18', 'Content Planner Kalender resmi, funnel, jadwal dan', 'A18 - Content Planner Kalender resmi, funnel, jadwal dan', 'Spesialis', 'L2', 'adaptasi platform.', 'Membedakan 90 brief dengan 90 aset final/publikasi.  Kontrak eksekusi setiap agent Wajib: tujuan sempit, input schema, sumber yang diizinkan, tool allowlist, project/tenant scope, batas biaya/waktu, output schema, state, approval rule, confidence/sou'),
  ('A19', 'Sales Advocacy', 'A19 - Sales Advocacy', 'Spesialis', 'L1', 'Assistant Kit personal SE, rujukan kode dan personal branding.', 'Memerlukan mandat proyek dan izin pemilik akun.'),
  ('A20', 'Visual Production Template poster, carousel, layout dan', 'A20 - Visual Production Template poster, carousel, layout dan', 'Spesialis', 'L1', 'visual ilustratif.', 'Ilustrasi berlabel; foto progres tidak direkayasa.'),
  ('A21', 'Video & Audio', 'A21 - Video & Audio', 'Spesialis', 'L1', 'Producer Template video, subtitle, cover dan voiceover sintetis.', 'Tidak mengkloning orang atau merekayasa tur nyata.'),
  ('A22', 'Localization &', 'A22 - Localization &', 'Spesialis', 'L1', 'Accessibility Bahasa, aksesibilitas, ejaan dan QA komunikasi.', 'Klaim/angka tidak berubah saat diterjemahkan.'),
  ('A23', 'Web & SEO Builder Draf situs, landing page, schema dan', 'A23 - Web & SEO Builder Draf situs, landing page, schema dan', 'Spesialis', 'L2', 'komponen produk.', 'Deploy hanya ke domain yang diotorisasi.'),
  ('A24', 'Conversion', 'A24 - Conversion', 'Spesialis', 'L1', 'Experimenter Form, CTA, A/B test dan analisis eksperimen.', 'Tidak mengklaim kausalitas dari metrik observasional.'),
  ('A25', 'Acquisition Planner Rencana kanal, keyword, audiens dan', 'A25 - Acquisition Planner Rencana kanal, keyword, audiens dan', 'Spesialis', 'L1', 'budget.', 'Tidak menjanjikan CPL/closing; kebijakan housing dicek per pasar.'),
  ('A26', 'Media Buyer', 'A26 - Media Buyer', 'Spesialis', 'L1', 'Optimizer Pacing, bid, creative rotation dan suppression resmi.', 'Belanja terbatas pada akun dan cap approved.'),
  ('A27', 'Local Discovery', 'A27 - Local Discovery', 'Spesialis', 'L1', 'Specialist Profil bisnis, konsistensi NAP dan organic discovery.', 'Tidak membuat ulasan palsu atau lokasi kantor fiktif.'),
  ('A28', 'Lead Intake & Identity Ingest sumber resmi, validasi kontak', 'A28 - Lead Intake & Identity Ingest sumber resmi, validasi kontak', 'Spesialis', 'L2', 'dan deduplication.', 'Tidak membeli/menambang nomor pribadi untuk blast.  Kontrak eksekusi setiap agent Wajib: tujuan sempit, input schema, sumber yang diizinkan, tool allowlist, project/tenant scope, batas biaya/waktu, output schema, state, approval rule, confidence/sour'),
  ('A29', 'Qualification &', 'A29 - Qualification &', 'Spesialis', 'L1', 'Matching BANT, kebutuhan, rekomendasi unit dan prioritas.', 'Skor dapat dijelaskan, dibantah dan dikoreksi manusia.'),
  ('A30', 'Lead Dispatch & SLA Round-robin, shift, kapasitas, timeout', 'A30 - Lead Dispatch & SLA Round-robin, shift, kapasitas, timeout', 'Spesialis', 'L2', 'dan handoff.', 'Tidak mengubah hak komisi tanpa aturan manajemen.'),
  ('A31', 'Sales Chat Concierge FAQ berlandas bukti dan discovery', 'A31 - Sales Chat Concierge FAQ berlandas bukti dan discovery', 'Spesialis', 'L2', 'percakapan awal.', 'Disclosure AI dan jalur manusia selalu tersedia.'),
  ('A32', 'Objection &', 'A32 - Objection &', 'Spesialis', 'L1', 'Negotiation Copilot Bantuan keberatan, alternatif dan ringkasan negosiasi.', 'Tidak menyetujui diskon, refund atau syarat kontrak.'),
  ('A33', 'Opt-in Voice Assistant Metadata panggilan bisnis serta', 'A33 - Opt-in Voice Assistant Metadata panggilan bisnis serta', 'Spesialis', 'L1', 'suara/transfer hanya saat fitur berhak dan berizin.', 'Persetujuan panggilan/rekaman, quiet hours, batas durasi.'),
  ('A34', 'Lifecycle Nurture Cadence, reminder relevan, reaktivasi', 'A34 - Lifecycle Nurture Cadence, reminder relevan, reaktivasi', 'Spesialis', 'L1', 'dan opt-out.', 'Stop saat penolakan; batas frekuensi lintas kanal.'),
  ('A35', 'Appointment & Visit', 'A35 - Appointment & Visit', 'Spesialis', 'L2', 'Coordinator Slot, reminder, host, persiapan dan reschedule.', 'Akses lokasi/host tetap dikonfirmasi, bukan diasumsikan.'),
  ('A36', 'Territory & Route', 'A36 - Territory & Route', 'Spesialis', 'L1', 'Planner Zona, urutan titik, cuaca, waktu buka dan rute harian.', 'Keselamatan, izin lokasi dan jam kerja mengalahkan target.'),
  ('A37', 'Field Sales Coach Kit lapangan, absensi, GPS tugas,', 'A37 - Field Sales Coach Kit lapangan, absensi, GPS tugas,', 'Spesialis', 'L1', 'disposisi dan AI guide per aktivitas.', 'Tidak memonitor pekerja di luar lingkup tugas.'),
  ('A38', 'Sales Training', 'A38 - Sales Training', 'Spesialis', 'L1', 'Evaluator Role-play, tes produk dan QA percakapan termasking.', 'Bukan satu-satunya dasar penilaian/sanksi tenaga kerja.  Kontrak eksekusi setiap agent Wajib: tujuan sempit, input schema, sumber yang diizinkan, tool allowlist, project/tenant scope, batas biaya/waktu, output schema, state, approval rule, confidence'),
  ('A39', 'Offer & Affordability', 'A39 - Offer & Affordability', 'Spesialis', 'L1', 'Analyst Total biaya, skema pembayaran dan floor margin.', 'Bunga/pajak validasi; formula bukan keluaran tebak model.'),
  ('A40', 'Reservation &', 'A40 - Reservation &', 'Spesialis', 'L1', 'Booking Controller Hold, status unit, checklist dan confirmation case.', 'Lock transaksional pada database, tidak hanya instruksi AI.'),
  ('A41', 'KPR Dossier', 'A41 - KPR Dossier', 'Spesialis', 'L1', 'Coordinator Checklist, secure intake dan pengiriman berizin per bank.', 'Bukan bank, tidak mengakses SLIK tanpa otoritas.'),
  ('A42', 'Legal Workflow', 'A42 - Legal Workflow', 'Spesialis', 'L1', 'Assistant Milestone, draf template, privasi dan review list.', 'Tidak menerbitkan opini legal, izin, akta atau sertifikat.'),
  ('A43', 'Payment &', 'A43 - Payment &', 'Spesialis', 'L2', 'Commission Reconciler Pencocokan kas, invoice, accrual dan pengingat.', 'Tidak memegang dana atau mengeksekusi refund sendiri.'),
  ('A44', 'Partner & Referral', 'A44 - Partner & Referral', 'Spesialis', 'L1', 'Manager Mandat agen, referral, tracking dan komisi bersyarat.', 'Tidak memverifikasi calon pembeli hanya dari klaim agen.'),
  ('A45', 'Corporate & Event', 'A45 - Corporate & Event', 'Spesialis', 'L1', 'Coordinator Proposal institusi, RSVP, event pack dan follow-up.', 'Izin booth/acara dan pelaksanaan fisik tetap manusia.'),
  ('A46', 'Revenue & Attribution', 'A46 - Revenue & Attribution', 'Spesialis', 'L1', 'Analyst Funnel, cohort, margin, forecast dan eksperimen.', 'Tidak menyamakan GMV rumah dengan pendapatan software.'),
  ('A47', 'Buyer Success', 'A47 - Buyer Success', 'Spesialis', 'L1', 'Coordinator Progres, komplain, BAST, DLP dan review sukarela.', 'Perbaikan fisik diselesaikan vendor dan dikonfirmasi pembeli.'),
  ('A48', 'Executive &', 'A48 - Executive &', 'Spesialis', 'L1', 'Governance Auditor Board pack, hak lintas-proyek, kontrol dan risiko.', 'Rekomendasi tidak menggantikan keputusan direksi/counsel.  Kontrak eksekusi setiap agent Wajib: tujuan sempit, input schema, sumber yang diizinkan, tool allowlist, project/tenant scope, batas biaya/waktu, output schema, state, approval rule, confiden')
ON CONFLICT (id) DO UPDATE SET
  nama = EXCLUDED.nama, pekerjaan_utama = EXCLUDED.pekerjaan_utama, batas_kewenangan = EXCLUDED.batas_kewenangan;

-- 3. TABEL CLAIMS (Truth Layer & Claim Ledger Blueprint Bab 05)
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    fact_id VARCHAR(50) NOT NULL,
    klaim_teks TEXT NOT NULL,
    sumber_dokumen VARCHAR(255),
    halaman VARCHAR(50),
    status VARCHAR(30) DEFAULT 'terverifikasi', -- terverifikasi, perlu_dicek, unknown
    kategori VARCHAR(30) DEFAULT 'aktual', -- aktual, rencana, ilustrasi
    versi INT DEFAULT 1,
    disclaimer_wajib TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. UPDATE SKEMA & SEED TABEL PLANS (Lisensi 3 Bulan & Angka Usulan Blueprint Bab 12)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_status VARCHAR(20) DEFAULT 'usulan';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS aic_total_quota INT DEFAULT 20000;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS human_ops_hours INT DEFAULT 2;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_contacts INT DEFAULT 10000;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_storage_gb INT DEFAULT 10;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_pageviews_monthly INT DEFAULT 20000;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_wa_numbers INT DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_field_personnel INT DEFAULT 5;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS ai_activity_guide_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS ai_activity_guide_rate_aic INT DEFAULT 5;

UPDATE plans SET
  billing_period = '3_bulan_kalender',
  price = 4900000,
  price_status = 'usulan',
  max_active_projects = 1,
  max_sales_users = 5,
  aic_total_quota = 20000,
  human_ops_hours = 2,
  max_contacts = 10000,
  max_storage_gb = 10,
  max_pageviews_monthly = 20000,
  max_wa_numbers = 1,
  max_field_personnel = 5,
  ai_activity_guide_enabled = FALSE
WHERE code = 'gold';

UPDATE plans SET
  billing_period = '3_bulan_kalender',
  price = 12900000,
  price_status = 'usulan',
  max_active_projects = 3,
  max_sales_users = 20,
  aic_total_quota = 70000,
  human_ops_hours = 6,
  max_contacts = 50000,
  max_storage_gb = 50,
  max_pageviews_monthly = 100000,
  max_wa_numbers = 3,
  max_field_personnel = 20,
  ai_activity_guide_enabled = TRUE
WHERE code = 'platinum';

UPDATE plans SET
  billing_period = '3_bulan_kalender',
  price = 39900000,
  price_status = 'usulan',
  max_active_projects = 10,
  max_sales_users = 75,
  aic_total_quota = 240000,
  human_ops_hours = 16,
  max_contacts = 200000,
  max_storage_gb = 200,
  max_pageviews_monthly = 500000,
  max_wa_numbers = 10,
  max_field_personnel = 75,
  ai_activity_guide_enabled = TRUE
WHERE code = 'diamond';

-- 5. TABEL TOPUP PACKAGES & CAPACITY PASSES (Blueprint Bab 13)
CREATE TABLE IF NOT EXISTS topup_packages (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(30) NOT NULL, -- ai, human_service, capacity_pass, channel_wallet
    name VARCHAR(100) NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    price_status VARCHAR(20) DEFAULT 'usulan',
    quota_type VARCHAR(50) NOT NULL,
    quota_amount INT NOT NULL,
    validity_days INT NOT NULL,
    description TEXT
);

INSERT INTO topup_packages (id, category, name, price, quota_type, quota_amount, validity_days, description)
VALUES
  ('topup_ai_booster', 'ai', 'AI Booster (5.000 AIC)', 990000, 'aic', 5000, 90, 'Tambahan 5.000 AIC kredit AI (wallet 90 hari)'),
  ('topup_ai_turbo', 'ai', 'AI Turbo (25.000 AIC)', 3990000, 'aic', 25000, 90, 'Tambahan 25.000 AIC kredit AI (wallet 90 hari)'),
  ('topup_service_booster', 'human_service', 'Service Booster (2 Jam Ops)', 790000, 'human_hours', 2, 90, 'Tambahan 2 jam operasional manusia pendamping'),
  ('topup_service_turbo', 'human_service', 'Service Turbo (8 Jam Ops)', 2790000, 'human_hours', 8, 90, 'Tambahan 8 jam operasional manusia pendamping'),
  ('pass_user_5', 'capacity_pass', 'Capacity Pass +5 Pengguna', 490000, 'users', 5, 30, 'Buka kapasitas 5 user tambahan selama 30 hari'),
  ('pass_project_1', 'capacity_pass', 'Capacity Pass +1 Proyek', 1490000, 'projects', 1, 30, 'Buka kapasitas 1 proyek tambahan selama 30 hari'),
  ('pass_contact_10k', 'capacity_pass', 'Capacity Pass +10.000 Kontak', 199000, 'contacts', 10000, 30, 'Buka kapasitas 10.000 kontak selama 30 hari'),
  ('pass_wa_1', 'capacity_pass', 'Capacity Pass +1 Nomor WhatsApp', 299000, 'wa_number', 1, 30, 'Koneksi 1 nomor WhatsApp resmi tambahan selama 30 hari')
ON CONFLICT (id) DO NOTHING;

-- 6. TABEL AIC WALLETS & TRANSACTIONS (FinOps Metering Blueprint Bab 12)
CREATE TABLE IF NOT EXISTS aic_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_code VARCHAR(20) NOT NULL,
    total_aic_granted INT NOT NULL DEFAULT 0,
    balance_aic INT NOT NULL DEFAULT 0,
    reserved_aic INT NOT NULL DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aic_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    feature_id VARCHAR(10) REFERENCES features(id),
    job_type VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL, -- PREVIEW, RESERVE, RECEIPT, REFUND, TOPUP
    amount_aic INT NOT NULL,
    status VARCHAR(20) NOT NULL, -- PENDING, RESERVED, SETTLED, REFUNDED
    tokens_used INT DEFAULT 0,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABEL READINESS GATES G0-G3 (Blueprint Bab 05)
CREATE TABLE IF NOT EXISTS project_readiness_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    gate_g0 BOOLEAN DEFAULT TRUE,  -- G0 Draft-ready
    gate_g1 BOOLEAN DEFAULT FALSE, -- G1 Publish-ready
    gate_g2 BOOLEAN DEFAULT FALSE, -- G2 Demand-ready
    gate_g3 BOOLEAN DEFAULT FALSE, -- G3 Transaction-ready
    notes JSONB DEFAULT '{"g0": "Enam keluaran draf aktif", "g1": "Menunggu PIC approval", "g2": "Menunggu konfigurasi akun iklan & WA resmi", "g3": "Menunggu whitelist rekening & approval legal"}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABEL CLOSING MILESTONE CONFIG (Owner Defined Blueprint Bab 02 & 08)
CREATE TABLE IF NOT EXISTS closing_milestone_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    active_closing_milestone VARCHAR(50) DEFAULT 'AKAD_CLOSING', -- BOOKED, SP3K, DP, KONTRAK_PPJB, AKAD_CLOSING, CASH_IN
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABEL CONSENT LEDGER (Data Governance & UU PDP Blueprint Bab 10)
CREATE TABLE IF NOT EXISTS consent_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    purpose TEXT NOT NULL,
    consent_given BOOLEAN DEFAULT TRUE,
    consent_source VARCHAR(100),
    ip_address VARCHAR(50),
    given_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);
