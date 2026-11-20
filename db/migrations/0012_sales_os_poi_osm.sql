-- ============================================================================
-- DEVELOPER SALES OS (sales_os)
-- Migration 0012: OpenStreetMap Strategic POI Table (9 Categories)
-- Fasilitas Lokasi Wilayah Strategis (Landmark Regional, RS Rujukan, Mall, Kuliner Legendaris)
-- ============================================================================

CREATE TABLE IF NOT EXISTS poi (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL DEFAULT 'proj-the-park',
    osm_id VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- pendidikan, tempat_ibadah, kesehatan, belanja, transportasi, layanan_publik, keuangan, rekreasi, kuliner
    category_label VARCHAR(100) NOT NULL,
    sub_type VARCHAR(100),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address TEXT,
    approx_distance VARCHAR(100),
    why_interesting TEXT,
    buyer_highlight TEXT,
    is_strategic BOOLEAN DEFAULT TRUE,
    strategic_type VARCHAR(50),
    strategic_tier VARCHAR(50),
    osm_tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poi_category ON poi(category);
CREATE INDEX IF NOT EXISTS idx_poi_coords ON poi(lat, lng);
CREATE INDEX IF NOT EXISTS idx_poi_project ON poi(project_id);
CREATE INDEX IF NOT EXISTS idx_poi_strategic ON poi(is_strategic);

-- Seed Fasilitas Lokasi Wilayah Strategis The Park Townhouse Sukoharjo (OSM)
INSERT INTO poi (id, project_id, osm_id, name, category, category_label, sub_type, lat, lng, approx_distance, why_interesting, buyer_highlight, is_strategic, strategic_type, strategic_tier)
VALUES
  -- 1. Pendidikan (Sekolah Unggulan & Kampus)
  ('poi-osm-001', 'proj-the-park', 'osm-node-301', 'SD Negeri Gayam 1 Sukoharjo', 'pendidikan', 'Pendidikan', 'school', -7.6740, 110.8412, '~0.5 km · 2 mnt', 'Sekolah dasar negeri percontohan terdekat dengan lingkungan ramah anak, aman dijangkau jalan kaki atau sepeda.', 'Nilai jual: Zonasi sekolah dasar negeri percontohan tepat di depan klaster hunian.', TRUE, 'sekolah_unggulan', 'koridor_utama'),
  ('poi-osm-002', 'proj-the-park', 'osm-node-302', 'SMA Negeri 1 Sukoharjo', 'pendidikan', 'Pendidikan', 'school', -7.6790, 110.8350, '~2.5 km · 5 mnt', 'Sekolah menengah atas negeri peringkat 1 di Sukoharjo dengan prestasi akademik dan tingkat kelulusan PTN tertinggi.', 'Nilai jual: Menjamin masa depan anak di sekolah favorit nomor 1 tingkat kabupaten.', TRUE, 'sekolah_unggulan', 'landmark_utama'),
  ('poi-osm-003', 'proj-the-park', 'osm-node-303', 'SMP Negeri 1 Sukoharjo', 'pendidikan', 'Pendidikan', 'school', -7.6815, 110.8360, '~2.8 km · 6 mnt', 'Sekolah menengah pertama favorit pusat kota jalur zonasi paling diminati keluarga Sukoharjo.', 'Nilai jual: Jalur zonasi sekolah negeri favorit sangat menguntungkan penghuni klaster.', TRUE, 'sekolah_unggulan', 'pusat_regional'),
  ('poi-osm-004', 'proj-the-park', 'osm-node-304', 'Pondok Pesantren Al-Mukmin Ngruki', 'pendidikan', 'Pendidikan', 'college', -7.6025, 110.8280, '~8.1 km · 12 mnt', 'Lembaga pendidikan Islam modern terpadu berskala nasional dengan ribuan santri dari seluruh penjuru nusantara.', 'Nilai jual: Pilihan lembaga pendidikan keagamaan terkemuka bagi keluarga muslim.', TRUE, 'pesantren_nasional', 'landmark_utama'),
  ('poi-osm-005', 'proj-the-park', 'osm-node-305', 'Universitas Muhammadiyah Surakarta (UMS)', 'pendidikan', 'Pendidikan', 'university', -7.5580, 110.7720, '~15.2 km · 22 mnt', 'Kampus swasta terkemuka akreditasi Unggul dengan 35.000+ mahasiswa serta fakultas kedokteran & teknik favorit.', 'Nilai jual: Akses pendidikan tinggi bergengsi & potensi capital gain sewa hunian.', TRUE, 'kampus_unggulan', 'landmark_utama'),
  ('poi-osm-006', 'proj-the-park', 'osm-node-306', 'Universitas Sebelas Maret (UNS)', 'pendidikan', 'Pendidikan', 'university', -7.5585, 110.8550, '~13.1 km · 19 mnt', 'Perguruan tinggi negeri PTN-BH terkemuka di Indonesia dengan fasilitas riset dan rumah sakit pendidikan terpadu.', 'Nilai jual: Kedekatan akses ke universitas negeri terbaik di Solo Raya.', TRUE, 'kampus_unggulan', 'landmark_utama'),

  -- 2. Tempat Ibadah (Ikonik & Bersejarah)
  ('poi-osm-007', 'proj-the-park', 'osm-node-307', 'Masjid Agung Baiturrahmah Sukoharjo', 'tempat_ibadah', 'Tempat Ibadah', 'place_of_worship', -7.6828, 110.8315, '~3.1 km · 7 mnt', 'Masjid agung kabupaten termegah yang menjadi pusat syiar Islam, kajian akbar, dan sholat Jumat utama Sukoharjo.', 'Nilai jual: Pusat kegiatan keagamaan akbar dan sholat Jumat yang megah di pusat kota.', TRUE, 'tempat_ibadah_ikonik', 'landmark_utama'),
  ('poi-osm-008', 'proj-the-park', 'osm-node-308', 'Masjid Raya Al-Madinah Solo Baru', 'tempat_ibadah', 'Tempat Ibadah', 'place_of_worship', -7.6020, 110.8225, '~8.2 km · 12 mnt', 'Masjid raya megah berarsitektur Timur Tengah di kawasan sentra bisnis Solo Baru dengan kubah ikonik.', 'Nilai jual: Landmark peribadatan terkemuka di kawasan elit Solo Baru.', TRUE, 'tempat_ibadah_ikonik', 'landmark_utama'),
  ('poi-osm-009', 'proj-the-park', 'osm-node-309', 'Gereja Katolik Hati Kudus Yesus', 'tempat_ibadah', 'Tempat Ibadah', 'place_of_worship', -7.6805, 110.8335, '~2.7 km · 6 mnt', 'Gereja paroki Katolik pusat Kabupaten Sukoharjo dengan arsitektur sakral dan jadwal peribadatan lengkap.', 'Nilai jual: Akses peribadatan keluarga Katolik yang tenang dan strategis.', TRUE, 'tempat_ibadah_ikonik', 'pusat_regional'),
  ('poi-osm-010', 'proj-the-park', 'osm-node-310', 'Gereja Kristen Jawa (GKJ) Sukoharjo', 'tempat_ibadah', 'Tempat Ibadah', 'place_of_worship', -7.6810, 110.8345, '~2.8 km · 6 mnt', 'Gereja Kristen Protestan historis tertua di jalur protokol utama Sukoharjo.', 'Nilai jual: Pusat peribadatan kristiani yang representatif dan mudah diakses.', TRUE, 'tempat_ibadah_ikonik', 'pusat_regional'),

  -- 3. Kesehatan (Rumah Sakit Rujukan)
  ('poi-osm-011', 'proj-the-park', 'osm-node-311', 'RSUD Ir. Soekarno Sukoharjo', 'kesehatan', 'Kesehatan', 'hospital', -7.6765, 110.8340, '~2.1 km · 6 mnt', 'Rumah sakit umum daerah tipe B rujukan utama Kabupaten Sukoharjo dengan IGD 24 jam & poli spesialis terlengkap.', 'Nilai jual: Keamanan medis keluarga & potensi tinggi target sewa tenaga kesehatan/dokter spesialis.', TRUE, 'medis_rujukan', 'landmark_utama'),
  ('poi-osm-012', 'proj-the-park', 'osm-node-312', 'RS Indriati Solo Baru', 'kesehatan', 'Kesehatan', 'hospital', -7.6105, 110.8240, '~7.2 km · 11 mnt', 'Rumah sakit swasta rujukan modern terbesar di koridor Solo Baru dengan penanganan kardiovaskular & onkologi terpadu.', 'Nilai jual: Akses layanan spesialis rujukan tinggi bertaraf internasional tanpa harus ke luar kota.', TRUE, 'medis_rujukan', 'landmark_utama'),
  ('poi-osm-013', 'proj-the-park', 'osm-node-313', 'RS Nirmala Suri Sukoharjo', 'kesehatan', 'Kesehatan', 'hospital', -7.6620, 110.8385, '~1.2 km · 3 mnt', 'Rumah sakit swasta terkemuka di jalur arteri Solo-Sukoharjo dengan instalasi gawat darurat siaga 24 jam.', 'Nilai jual: Penanganan medis darurat sangat cepat hanya 3 menit dari gerbang perumahan.', TRUE, 'medis_rujukan', 'pusat_regional'),
  ('poi-osm-014', 'proj-the-park', 'osm-node-314', 'RS Dr. Oen Solo Baru', 'kesehatan', 'Kesehatan', 'hospital', -7.6050, 110.8195, '~7.8 km · 12 mnt', 'Rumah sakit swasta terpercaya puluhan tahun di koridor Solo Baru dengan layanan rawat inap prima & dokter anak unggulan.', 'Nilai jual: Kepercayaan medis keluarga lintas generasi di koridor prestisius.', TRUE, 'medis_rujukan', 'pusat_regional'),

  -- 4. Belanja (Mall Regional & Pasar Induk)
  ('poi-osm-015', 'proj-the-park', 'osm-node-315', 'The Park Mall Solo Baru', 'belanja', 'Belanja', 'mall', -7.5995, 110.8210, '~8.5 km · 12 mnt', 'Pusat belanja modern terbesar dan terlengkap di Solo Baru dengan tenant lifestyle nasional, Cinema XXI, dan food gallery.', 'Nilai jual: Menunjang gaya hidup modern & mendongkrak daya tarik sewa hunian eksekutif.', TRUE, 'mall_regional', 'landmark_utama'),
  ('poi-osm-016', 'proj-the-park', 'osm-node-316', 'Pakuwon Mall Solo Baru', 'belanja', 'Belanja', 'mall', -7.5980, 110.8190, '~8.7 km · 13 mnt', 'Kawasan superblok komersial terpadu di koridor utama Solo Baru terhubung langsung dengan hotel berbintang dan sentra bisnis.', 'Nilai jual: Berada di koridor pertumbuhan nilai tanah tertinggi di sisi selatan Solo.', TRUE, 'mall_regional', 'landmark_utama'),
  ('poi-osm-017', 'proj-the-park', 'osm-node-317', 'Pasar Ir. Soekarno Sukoharjo', 'belanja', 'Belanja', 'marketplace', -7.6845, 110.8320, '~3.4 km · 7 mnt', 'Pasar induk tradisional modern terlengkap pusat Kabupaten Sukoharjo untuk komoditas pangan segar harian.', 'Nilai jual: Biaya hidup dapur keluarga hemat dan bahan pangan segar setiap hari.', TRUE, 'pasar_induk', 'pusat_regional'),
  ('poi-osm-018', 'proj-the-park', 'osm-node-318', 'Luwes Mall Sukoharjo', 'belanja', 'Belanja', 'department_store', -7.6835, 110.8345, '~3.2 km · 7 mnt', 'Department store dan pusat retail keluarga terbesar di jantung Kota Sukoharjo untuk kebutuhan rumah tangga lengkap.', 'Nilai jual: Solusi belanja perlengkapan rumah dan pakaian terdekat tanpa harus ke Solo Baru.', TRUE, 'mall_regional', 'pusat_regional'),

  -- 5. Transportasi (Stasiun, Terminal, BRT)
  ('poi-osm-019', 'proj-the-park', 'osm-node-319', 'Stasiun Sukoharjo', 'transportasi', 'Transportasi', 'station', -7.6850, 110.8380, '~3.8 km · 7 mnt', 'Stasiun kereta api aktif komuter Batara Kresna rute langsung Sukoharjo – Solo Kota – Wonogiri.', 'Nilai jual: Mobilitas komuter bebas macet menuju pusat bisnis Kota Solo.', TRUE, 'transportasi_utama', 'landmark_utama'),
  ('poi-osm-020', 'proj-the-park', 'osm-node-320', 'Terminal Bus Sukoharjo', 'transportasi', 'Transportasi', 'bus_station', -7.6910, 110.8360, '~4.5 km · 9 mnt', 'Terminal bus tipe A terpadu Sukoharjo melayani armada bus eksekutif antarkota antarprovinsi (AKAP) ke Jakarta, Surabaya, & Bali.', 'Nilai jual: Kemudahan bepergian luar kota dengan armada bus antarprovinsi.', TRUE, 'transportasi_utama', 'pusat_regional'),
  ('poi-osm-021', 'proj-the-park', 'osm-node-321', 'Halte BST Solo Baru (Batik Solo Trans)', 'transportasi', 'Transportasi', 'bus_stop', -7.6010, 110.8215, '~8.3 km · 12 mnt', 'Halte transit bus raya modern ber-AC menghubungkan langsung Solo Baru ke Bandara Adi Soemarmo & Stasiun Balapan.', 'Nilai jual: Angkutan umum massal modern berstandar kota metropolitan.', TRUE, 'transportasi_utama', 'koridor_utama'),
  ('poi-osm-022', 'proj-the-park', 'osm-node-322', 'Stasiun Solobalapan', 'transportasi', 'Transportasi', 'station', -7.5580, 110.8215, '~13.2 km · 20 mnt', 'Hub stasiun utama kereta api eksekutif antarkota lintas Jawa & KRL Commuter Line Solo-Yogyakarta per jam.', 'Nilai jual: Mobilitas kilat ke Yogyakarta (45 menit) & kereta antarkota ke Jakarta/Surabaya.', TRUE, 'transportasi_utama', 'landmark_utama'),

  -- 6. Layanan Publik (Pemerintahan & Sipil)
  ('poi-osm-023', 'proj-the-park', 'osm-node-323', 'Kantor Bupati & Mall Pelayanan Publik (MPP)', 'layanan_publik', 'Layanan Publik', 'townhall', -7.6820, 110.8275, '~3.3 km · 8 mnt', 'Gedung terpadu pelayanan satu atap seluruh perizinan, imigrasi paspor, samsat, dan pertanahan BPN Sukoharjo.', 'Nilai jual: Semua pengurusan izin usaha, legalitas tanah, dan paspor selesai di satu gedung modern.', TRUE, 'pusat_pemerintahan', 'landmark_utama'),
  ('poi-osm-024', 'proj-the-park', 'osm-node-324', 'Alun-Alun Satya Negara Sukoharjo', 'layanan_publik', 'Layanan Publik', 'park', -7.6830, 110.8290, '~3.2 km · 8 mnt', 'Pusat ruang terbuka publik utama kabupaten, arena olahraga pagi, perhelatan seni budaya daerah, dan ruang hijau.', 'Nilai jual: Landmark sipil utama daerah & ruang rekreasi keluarga di pusat kota.', TRUE, 'pusat_pemerintahan', 'landmark_utama'),
  ('poi-osm-025', 'proj-the-park', 'osm-node-325', 'Polres Sukoharjo', 'layanan_publik', 'Layanan Publik', 'police', -7.6860, 110.8310, '~3.5 km · 8 mnt', 'Markas komando kepolisian resor kabupaten yang menjamin keamanan dan ketertiban wilayah 24 jam.', 'Nilai jual: Jaminan keamanan dan stabilitas wilayah pemukiman yang sangat kondusif.', TRUE, 'keamanan_publik', 'pusat_regional'),

  -- 7. Keuangan (Perbankan Utama)
  ('poi-osm-026', 'proj-the-park', 'osm-node-326', 'Bank BCA Kantor Cabang Solo Baru', 'keuangan', 'Keuangan', 'bank', -7.6025, 110.8210, '~8.1 km · 11 mnt', 'Kantor cabang utama Bank BCA Solo Baru dengan lounge Solitaire & Prioritas serta layanan transaksi korporasi.', 'Nilai jual: Layanan wealth management eksklusif bagi keluarga mapan dan pengusaha.', TRUE, 'perbankan_utama', 'landmark_utama'),
  ('poi-osm-027', 'proj-the-park', 'osm-node-327', 'Bank BRI Kantor Cabang Sukoharjo', 'keuangan', 'Keuangan', 'bank', -7.6818, 110.8330, '~2.9 km · 6 mnt', 'Kantor cabang utama Bank BRI Kabupaten Sukoharjo dengan fasilitas priority banking dan KPR.', 'Nilai jual: Kemudahan transaksi perbankan dan percepatan pengajuan KPR.', TRUE, 'perbankan_utama', 'pusat_regional'),
  ('poi-osm-028', 'proj-the-park', 'osm-node-328', 'Bank Mandiri KCP Sukoharjo', 'keuangan', 'Keuangan', 'bank', -7.6822, 110.8335, '~2.9 km · 6 mnt', 'Kantor cabang Bank Mandiri di jalan protokol utama Sukoharjo untuk transaksi bisnis dan perorangan.', 'Nilai jual: Dukungan perbankan BUMN terpercaya untuk payroll dan transaksi bisnis.', TRUE, 'perbankan_utama', 'pusat_regional'),

  -- 8. Rekreasi (Wisata Regional & GOR)
  ('poi-osm-029', 'proj-the-park', 'osm-node-329', 'Pandawa Water World Solo Baru', 'rekreasi', 'Rekreasi', 'attraction', -7.6110, 110.8160, '~7.5 km · 11 mnt', 'Taman wisata air tematik megah pewayangan terbesar di Jawa Tengah dengan wahana ombak buatan dan seluncuran internasional.', 'Nilai jual: Destinasi rekreasi keluarga bertaraf nasional di koridor Solo Baru.', TRUE, 'destinasi_wisata', 'landmark_utama'),
  ('poi-osm-030', 'proj-the-park', 'osm-node-330', 'Taman Wisata Pakujoyo Gayam', 'rekreasi', 'Rekreasi', 'park', -7.6750, 110.8435, '~0.6 km · 2 mnt', 'Taman rekreasi air dan edukasi keluarga dengan danau buatan, perahu kayuh, dan jogging track asri tepat di samping klaster.', 'Nilai jual: Ruang hijau dan rekreasi santai sore hari keluarga tepat di sebelah perumahan.', TRUE, 'destinasi_wisata', 'koridor_utama'),
  ('poi-osm-031', 'proj-the-park', 'osm-node-331', 'Wisata Danau Waduk Mulur', 'rekreasi', 'Rekreasi', 'attraction', -7.6890, 110.8750, '~4.8 km · 10 mnt', 'Danau alami asri untuk memancing, spot matahari terbenam (sunset), dan sentra kuliner ikan bakar tepi danau.', 'Nilai jual: Destinasi alam terbuka menyejukkan untuk melepas penat rutinitas harian.', TRUE, 'destinasi_wisata', 'landmark_utama'),
  ('poi-osm-032', 'proj-the-park', 'osm-node-332', 'Gelora Merdeka Sukoharjo (Stadion & GOR)', 'rekreasi', 'Rekreasi', 'sports_centre', -7.6870, 110.8280, '~3.6 km · 8 mnt', 'Kompleks olahraga utama kabupaten dengan stadion sepak bola, lapangan tenis, basket, dan jogging track terbuka.', 'Nilai jual: Mendukung gaya hidup aktif dan kebugaran jasmani seluruh keluarga.', TRUE, 'kompleks_olahraga', 'pusat_regional'),

  -- 9. Kuliner (Kuliner Legendaris Sukoharjo)
  ('poi-osm-033', 'proj-the-park', 'osm-node-333', 'Ayam Goreng Kampung Mbah Karto Tembel', 'kuliner', 'Kuliner', 'kuliner_legendaris', -7.6778, 110.8355, '~2.4 km · 5 mnt', 'Kuliner ayam goreng kampung legendaris khas Sukoharjo sejak 1968, terkenal dengan bumbu ungkep bacem bawang dan sambal blondo/bawang langganan Presiden Joko Widodo dan tokoh nasional.', 'Nilai jual: Berada di koridor kuliner legendaris paling terkenal di Sukoharjo yang menjadi destinasi utama tamu dan wisatawan luar kota.', TRUE, 'kuliner_legendaris', 'landmark_utama'),
  ('poi-osm-034', 'proj-the-park', 'osm-node-334', 'Bebek Goreng H. Slamet Solo Baru', 'kuliner', 'Kuliner', 'kuliner_legendaris', -7.6040, 110.8220, '~7.9 km · 11 mnt', 'Pelopor bebek goreng empuk renyah sambal korek legendaris khas Sukoharjo yang mendunia dan menjadi ikon kuliner Solo Raya.', 'Nilai jual: Destinasi jamuan makan siang dan malam bersama mitra bisnis serta keluarga besar.', TRUE, 'kuliner_legendaris', 'landmark_utama'),
  ('poi-osm-035', 'proj-the-park', 'osm-node-335', 'Rumah Makan Soto Seger Mbok Giyem', 'kuliner', 'Kuliner', 'kuliner_legendaris', -7.6770, 110.8360, '~1.8 km · 4 mnt', 'Kuliner soto daging sapi bening legendaris Solo Raya dengan kuah rempah segar dan aneka sate puyuh/perkedel.', 'Nilai jual: Sarapan favorit keluarga di akhir pekan dengan cita rasa khas nusantara.', TRUE, 'kuliner_legendaris', 'pusat_regional'),
  ('poi-osm-036', 'proj-the-park', 'osm-node-336', 'Sentra Jamu & Kuliner Sukoharjo', 'kuliner', 'Kuliner', 'kuliner_legendaris', -7.6820, 110.8310, '~3.0 km · 6 mnt', 'Pusat wisata kuliner malam Sukoharjo menyajikan olahan jamu herbal tradisional dan aneka hidangan khas daerah.', 'Nilai jual: Menjaga kebugaran dan kesehatan keluarga dengan minuman herbal alami khas Kota Jamu Sukoharjo.', TRUE, 'kuliner_legendaris', 'landmark_utama'),
  ('poi-osm-037', 'proj-the-park', 'osm-node-337', 'Mie Gacoan Solo Baru', 'kuliner', 'Kuliner', 'restaurant', -7.6030, 110.8205, '~8.0 km · 11 mnt', 'Restoran mie pedas viral favorit generasi muda di sentra pertumbuhan lifestyle dan retail modern Solo Baru.', 'Nilai jual: Daya tarik hiburan kuliner kekinian favorit anak-anak dan generasi muda.', TRUE, 'kuliner_populer', 'pusat_regional')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  category_label = EXCLUDED.category_label,
  sub_type = EXCLUDED.sub_type,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  approx_distance = EXCLUDED.approx_distance,
  why_interesting = EXCLUDED.why_interesting,
  buyer_highlight = EXCLUDED.buyer_highlight,
  is_strategic = EXCLUDED.is_strategic,
  strategic_type = EXCLUDED.strategic_type,
  strategic_tier = EXCLUDED.strategic_tier,
  updated_at = NOW();
