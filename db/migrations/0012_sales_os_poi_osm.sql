-- ============================================================================
-- DEVELOPER SALES OS (sales_os)
-- Migration 0012: OpenStreetMap POI Table & 9-Category Facility Dataset
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
    osm_tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poi_category ON poi(category);
CREATE INDEX IF NOT EXISTS idx_poi_coords ON poi(lat, lng);
CREATE INDEX IF NOT EXISTS idx_poi_project ON poi(project_id);

-- Seed Initial 9-Category Curated OpenStreetMap Dataset for The Park Townhouse Sukoharjo
INSERT INTO poi (id, project_id, osm_id, name, category, category_label, sub_type, lat, lng, approx_distance, why_interesting, buyer_highlight)
VALUES
  -- 1. Pendidikan
  ('poi-osm-001', 'proj-the-park', 'osm-node-301', 'SD Negeri Gayam 1 Sukoharjo', 'pendidikan', 'Pendidikan', 'school', -7.6740, 110.8412, '~0.5 km · 2 mnt', 'Sekolah dasar negeri terdekat dengan lingkungan ramah anak, aman dijangkau jalan kaki atau sepeda.', 'Nilai jual: Anak sekolah tanpa repot antar-jemput jauh, hemat waktu harian keluarga.'),
  ('poi-osm-002', 'proj-the-park', 'osm-node-302', 'SMA Negeri 1 Sukoharjo', 'pendidikan', 'Pendidikan', 'school', -7.6790, 110.8350, '~2.5 km · 5 mnt', 'Sekolah menengah negeri unggulan di pusat kota Sukoharjo dengan akreditasi A dan akses jalan lancar.', 'Nilai jual: Menjamin masa depan anak di sekolah favorit nomor 1 tingkat kabupaten.'),
  ('poi-osm-003', 'proj-the-park', 'osm-node-303', 'SMP Negeri 1 Sukoharjo', 'pendidikan', 'Pendidikan', 'school', -7.6815, 110.8360, '~2.8 km · 6 mnt', 'Sekolah menengah pertama favorit pusat kota dengan fasilitas laboratorium dan ekstrakurikuler berprestasi.', 'Nilai jual: Jalur zonasi sekolah negeri favorit sangat menguntungkan penghuni klaster.'),
  ('poi-osm-004', 'proj-the-park', 'osm-node-304', 'Pondok Pesantren Al-Mukmin Ngruki', 'pendidikan', 'Pendidikan', 'college', -7.6025, 110.8280, '~8.1 km · 12 mnt', 'Lembaga pendidikan Islam modern terpadu dengan santri dari berbagai daerah di Indonesia.', 'Nilai jual: Pilihan pendidikan keagamaan berkualitas bagi keluarga muslim.'),
  ('poi-osm-005', 'proj-the-park', 'osm-node-305', 'Universitas Muhammadiyah Surakarta (UMS)', 'pendidikan', 'Pendidikan', 'university', -7.5580, 110.7720, '~15.2 km · 22 mnt', 'Kampus swasta terkemuka Solo Raya dengan 35.000+ mahasiswa dan fakultas kedokteran & teknik unggulan.', 'Nilai jual: Akses pendidikan tinggi terakreditasi Unggul & potensi capital gain sewa hunian.'),
  ('poi-osm-006', 'proj-the-park', 'osm-node-306', 'Universitas Sebelas Maret (UNS)', 'pendidikan', 'Pendidikan', 'university', -7.5585, 110.8550, '~13.1 km · 19 mnt', 'Universitas negeri PTN-BH ternama Indonesia dengan ranking tinggi dan fasilitas riset lengkap.', 'Nilai jual: Kedekatan akses ke perguruan tinggi negeri terbaik Solo Raya.'),

  -- 2. Tempat Ibadah
  ('poi-osm-007', 'proj-the-park', 'osm-node-307', 'Masjid Al-Ikhlas Gayam', 'tempat_ibadah', 'Tempat Ibadah', 'place_of_worship', -7.6725, 110.8418, '~0.3 km · 1 mnt', 'Masjid lingkungan terdekat dengan kegiatan sholat berjamaah 5 waktu dan kajian rutin warga.', 'Nilai jual: Suasana religius dan kemudahan ibadah berjamaah harian dalam langkah kaki.'),
  ('poi-osm-008', 'proj-the-park', 'osm-node-308', 'Masjid Agung Baiturrahmah Sukoharjo', 'tempat_ibadah', 'Tempat Ibadah', 'place_of_worship', -7.6828, 110.8315, '~3.1 km · 7 mnt', 'Masjid agung terbesar di pusat kota Sukoharjo yang menjadi ikon arsitektur Islam daerah.', 'Nilai jual: Pusat kegiatan keagamaan akbar dan sholat Jumat yang megah.'),
  ('poi-osm-009', 'proj-the-park', 'osm-node-309', 'Gereja Katolik Hati Kudus Yesus', 'tempat_ibadah', 'Tempat Ibadah', 'place_of_worship', -7.6805, 110.8335, '~2.7 km · 6 mnt', 'Paroki gereja Katolik pusat Sukoharjo dengan jadwal misa teratur dan komunitas inklusif.', 'Nilai jual: Akses peribadatan keluarga Katolik yang tenang dan strategis.'),
  ('poi-osm-010', 'proj-the-park', 'osm-node-310', 'Gereja Kristen Jawa (GKJ) Sukoharjo', 'tempat_ibadah', 'Tempat Ibadah', 'place_of_worship', -7.6810, 110.8345, '~2.8 km · 6 mnt', 'Gereja Protestan historis di jalan protokol Sukoharjo dengan pelayanan ibadah minggu lengkap.', 'Nilai jual: Akses ibadah kristiani yang dekat dan nyaman.'),
  ('poi-osm-011', 'proj-the-park', 'osm-node-311', 'Masjid Raya Al-Madinah Solo Baru', 'tempat_ibadah', 'Tempat Ibadah', 'place_of_worship', -7.6020, 110.8225, '~8.2 km · 12 mnt', 'Masjid raya bergaya Timur Tengah modern di Solo Baru dengan kubah megah dan area parkir luas.', 'Nilai jual: Tempat ibadah representatif saat beraktivitas di koridor bisnis Solo Baru.'),

  -- 3. Kesehatan
  ('poi-osm-012', 'proj-the-park', 'osm-node-312', 'Apotek Kimia Farma Sukoharjo', 'kesehatan', 'Kesehatan', 'pharmacy', -7.6710, 110.8380, '~0.4 km · 1 mnt', 'Apotek BUMN terlengkap dengan apoteker siaga dan layanan obat resmi terjamin.', 'Nilai jual: Kebutuhan obat dan vitamin harian keluarga terpenuhi seketika.'),
  ('poi-osm-013', 'proj-the-park', 'osm-node-313', 'RS Nirmala Suri Sukoharjo', 'kesehatan', 'Kesehatan', 'hospital', -7.6620, 110.8385, '~1.2 km · 3 mnt', 'Rumah sakit swasta terkemuka di jalur utama Solo-Sukoharjo dengan IGD 24 jam dan dokter spesialis lengkap.', 'Nilai jual: Penanganan medis darurat sangat cepat di bawah 5 menit dari rumah.'),
  ('poi-osm-014', 'proj-the-park', 'osm-node-314', 'RSUD Ir. Soekarno Sukoharjo', 'kesehatan', 'Kesehatan', 'hospital', -7.6765, 110.8340, '~2.1 km · 6 mnt', 'Rumah sakit rujukan utama Kabupaten Sukoharjo dengan layanan IGD 24 jam dan poli spesialis lengkap.', 'Nilai jual: Keamanan medis keluarga & potensi tinggi target sewa dokter/tenaga medis.'),
  ('poi-osm-015', 'proj-the-park', 'osm-node-315', 'Puskesmas Sukoharjo Kota', 'kesehatan', 'Kesehatan', 'clinic', -7.6812, 110.8302, '~3.0 km · 6 mnt', 'Fasilitas kesehatan tingkat pertama untuk imunisasi anak dan pemeriksaan kesehatan rutin.', 'Nilai jual: Biaya layanan kesehatan dasar terjangkau dengan kartu BPJS Kesehatan.'),
  ('poi-osm-016', 'proj-the-park', 'osm-node-316', 'RS Indriati Solo Baru', 'kesehatan', 'Kesehatan', 'hospital', -7.6105, 110.8240, '~7.2 km · 11 mnt', 'Rumah sakit swasta tipe B modern bertaraf internasional di koridor Solo Baru dengan penanganan komprehensif.', 'Nilai jual: Akses layanan spesialis rujukan tinggi tanpa harus ke luar kota.'),
  ('poi-osm-017', 'proj-the-park', 'osm-node-317', 'RS Dr. Oen Solo Baru', 'kesehatan', 'Kesehatan', 'hospital', -7.6050, 110.8195, '~7.8 km · 12 mnt', 'Rumah sakit swasta legendaris dengan pelayanan rawat inap prima dan poli spesialis anak terpadu.', 'Nilai jual: Kepercayaan medis puluhan tahun untuk kesehatan keluarga tercinta.'),

  -- 4. Belanja
  ('poi-osm-018', 'proj-the-park', 'osm-node-318', 'Minimarket Indomaret / Alfamart Gayam', 'belanja', 'Belanja', 'convenience', -7.6718, 110.8402, '~0.1 km · 1 mnt', 'Minimarket 24 jam di depan jalan lingkungan untuk kebutuhan sembako dan belanja cepat.', 'Nilai jual: Belanja darurat malam hari cukup melangkah 1 menit dari gerbang perumahan.'),
  ('poi-osm-019', 'proj-the-park', 'osm-node-319', 'Luwes Mall Sukoharjo', 'belanja', 'Belanja', 'department_store', -7.6835, 110.8345, '~3.2 km · 7 mnt', 'Department store dan supermarket keluarga terlengkap di jantung kota Sukoharjo.', 'Nilai jual: Belanja bulanan hemat dengan variasi produk pakaian dan rumah tangga lengkap.'),
  ('poi-osm-020', 'proj-the-park', 'osm-node-320', 'Pasar Ir. Soekarno Sukoharjo', 'belanja', 'Belanja', 'marketplace', -7.6845, 110.8320, '~3.4 km · 7 mnt', 'Pasar induk tradisional modern Sukoharjo untuk belanja harian segar, sayur mayur, dan sembako murah.', 'Nilai jual: Biaya hidup dapur keluarga hemat dan bahan pangan segar setiap subuh.'),
  ('poi-osm-021', 'proj-the-park', 'osm-node-321', 'The Park Mall Solo Baru', 'belanja', 'Belanja', 'mall', -7.5995, 110.8210, '~8.5 km · 12 mnt', 'Pusat belanja modern terbesar di Solo Baru dengan supermarket, bioskop XXI, dan tenant lifestyle nasional.', 'Nilai jual: Menunjang gaya hidup modern & mendongkrak daya tarik sewa hunian eksekutif.'),
  ('poi-osm-022', 'proj-the-park', 'osm-node-322', 'Pakuwon Mall Solo Baru', 'belanja', 'Belanja', 'mall', -7.5980, 110.8190, '~8.7 km · 13 mnt', 'Kawasan komersial terpadu di koridor utama Solo Baru terhubung langsung dengan sentra bisnis.', 'Nilai jual: Berada di koridor pertumbuhan nilai tanah tertinggi di sisi selatan Solo.'),

  -- 5. Transportasi
  ('poi-osm-023', 'proj-the-park', 'osm-node-323', 'Halte Angkutan Sukoharjo Kota', 'transportasi', 'Transportasi', 'bus_stop', -7.6720, 110.8390, '~0.2 km · 1 mnt', 'Akses moda transportasi mikrobus feeder penghubung antar kawasan Sukoharjo.', 'Nilai jual: Mobilitas asisten rumah tangga dan warga tanpa harus berkendara pribadi.'),
  ('poi-osm-024', 'proj-the-park', 'osm-node-324', 'Stasiun Sukoharjo', 'transportasi', 'Transportasi', 'station', -7.6850, 110.8380, '~3.8 km · 7 mnt', 'Akses kereta api komuter Batara Kresna yang menghubungkan langsung Sukoharjo – Solo Kota – Wonogiri.', 'Nilai jual: Mobilitas komuter bebas macet menuju pusat bisnis Kota Solo.'),
  ('poi-osm-025', 'proj-the-park', 'osm-node-325', 'Terminal Bus Sukoharjo', 'transportasi', 'Transportasi', 'bus_station', -7.6910, 110.8360, '~4.5 km · 9 mnt', 'Terminal bus terpadu Sukoharjo yang melayani rute AKAP lintas Jawa dan angkutan kota antarkecamatan.', 'Nilai jual: Kemudahan bepergian luar kota dengan armada bus antarprovinsi.'),
  ('poi-osm-026', 'proj-the-park', 'osm-node-326', 'Halte BST Solo Baru (Batik Solo Trans)', 'transportasi', 'Transportasi', 'bus_stop', -7.6010, 110.8215, '~8.3 km · 12 mnt', 'Halte BRT modern ber-AC menghubungkan langsung Solo Baru ke Bandara Adi Soemarmo & Stasiun Balapan.', 'Nilai jual: Angkutan umum massal modern berstandar kota metropolitan.'),
  ('poi-osm-027', 'proj-the-park', 'osm-node-327', 'Stasiun Solobalapan', 'transportasi', 'Transportasi', 'station', -7.5580, 110.8215, '~13.2 km · 20 mnt', 'Hub utama kereta api eksekutif antarkota & KRL Commuter Line Solo-Yogyakarta dengan jadwal per jam.', 'Nilai jual: Mobilitas kilat ke Yogyakarta (45 menit) & kereta antarkota ke Jakarta/Surabaya.'),

  -- 6. Layanan Publik
  ('poi-osm-028', 'proj-the-park', 'osm-node-328', 'Kantor Kelurahan Gayam Sukoharjo', 'layanan_publik', 'Layanan Publik', 'townhall', -7.6735, 110.8420, '~0.4 km · 1 mnt', 'Pusat layanan administrasi kependudukan tingkat kelurahan, surat domisili, dan pelayanan warga.', 'Nilai jual: Pengurusan KTP, KK, dan administrasi sipil instan tanpa buang waktu.'),
  ('poi-osm-029', 'proj-the-park', 'osm-node-329', 'Kantor Pos Sukoharjo', 'layanan_publik', 'Layanan Publik', 'post_office', -7.6815, 110.8318, '~3.0 km · 6 mnt', 'Layanan pengiriman paket logistik, kurir instan, pembayaran tagihan, dan bea cukai.', 'Nilai jual: Membantu operasional bisnis online & belanja e-commerce penghuni klaster.'),
  ('poi-osm-030', 'proj-the-park', 'osm-node-330', 'Alun-Alun Satya Negara', 'layanan_publik', 'Layanan Publik', 'park', -7.6830, 110.8290, '~3.2 km · 8 mnt', 'Pusat ruang terbuka publik, jogging track pagi, kuliner malam, sekaligus kompleks Pemkab Sukoharjo.', 'Nilai jual: Dekat pusat layanan sipil daerah & ruang rekreasi keluarga akhir pekan.'),
  ('poi-osm-031', 'proj-the-park', 'osm-node-331', 'Kantor Bupati & Mall Pelayanan Publik (MPP)', 'layanan_publik', 'Layanan Publik', 'townhall', -7.6820, 110.8275, '~3.3 km · 8 mnt', 'Gedung terpadu seluruh dinas perizinan, samsat, paspor imigrasi, dan pertanahan Sukoharjo.', 'Nilai jual: Semua izin usaha, sertifikat, dan perpanjangan dokumen selesai di satu gedung.'),
  ('poi-osm-032', 'proj-the-park', 'osm-node-332', 'Polres Sukoharjo', 'layanan_publik', 'Layanan Publik', 'police', -7.6860, 110.8310, '~3.5 km · 8 mnt', 'Markas kepolisian resor kabupaten yang menjamin keamanan wilayah 24 jam.', 'Nilai jual: Jaminan keamanan dan ketenangan lingkungan tempat tinggal yang kondusif.'),

  -- 7. Keuangan
  ('poi-osm-033', 'proj-the-park', 'osm-node-333', 'ATM Center Bersama BRI / Mandiri Gayam', 'keuangan', 'Keuangan', 'atm', -7.6712, 110.8395, '~0.2 km · 1 mnt', 'Anjungan tunai mandiri 24 jam tarik-setor tunai terdekat dari perumahan.', 'Nilai jual: Tarik tunai cepat tanpa harus antri ke kantor cabang bank.'),
  ('poi-osm-034', 'proj-the-park', 'osm-node-334', 'Bank BRI KC Sukoharjo', 'keuangan', 'Keuangan', 'bank', -7.6818, 110.8330, '~2.9 km · 6 mnt', 'Kantor cabang utama Bank BRI dengan layanan nasabah prioritas, KPR, dan transaksi perbankan lengkap.', 'Nilai jual: Kemudahan transaksi finansial bisnis dan perbankan formal.'),
  ('poi-osm-035', 'proj-the-park', 'osm-node-335', 'Bank Mandiri KCP Sukoharjo', 'keuangan', 'Keuangan', 'bank', -7.6822, 110.8335, '~2.9 km · 6 mnt', 'Kantor cabang pembantu Mandiri di pusat bisnis Sukoharjo.', 'Nilai jual: Akses layanan perbankan BUMN terpercaya untuk payroll dan bisnis.'),
  ('poi-osm-036', 'proj-the-park', 'osm-node-336', 'Bank BCA KCP Sukoharjo', 'keuangan', 'Keuangan', 'bank', -7.6825, 110.8325, '~3.0 km · 6 mnt', 'Kantor cabang BCA dengan layanan transfer valas, CS bisnis, dan setor tunai multiposko.', 'Nilai jual: Menjamin kelancaran likuiditas keuangan pengusaha dan profesional.'),
  ('poi-osm-037', 'proj-the-park', 'osm-node-337', 'Bank BCA Kantor Cabang Solo Baru', 'keuangan', 'Keuangan', 'bank', -7.6025, 110.8210, '~8.1 km · 11 mnt', 'Gedung megah BCA Solo Baru dengan layanan Solitaire & Prioritas untuk nasabah premium.', 'Nilai jual: Layanan wealth management eksklusif bagi keluarga mapan.'),

  -- 8. Rekreasi
  ('poi-osm-038', 'proj-the-park', 'osm-node-338', 'Taman Pakujoyo Gayam Sukoharjo', 'rekreasi', 'Rekreasi', 'park', -7.6750, 110.8435, '~0.6 km · 2 mnt', 'Taman wisata edukasi air dan kuliner keluarga dengan danau buatan dan wahana bermain anak.', 'Nilai jual: Wisata santai sore hari murah meriah tepat di sebelah kawasan cluster.'),
  ('poi-osm-039', 'proj-the-park', 'osm-node-339', 'Gelora Merdeka Sukoharjo (Stadion & GOR)', 'rekreasi', 'Rekreasi', 'sports_centre', -7.6870, 110.8280, '~3.6 km · 8 mnt', 'Kompleks olahraga sepak bola, lapangan tenis, basket, dan jogging track terbuka.', 'Nilai jual: Gaya hidup sehat dan kebugaran jasmani seluruh anggota keluarga.'),
  ('poi-osm-040', 'proj-the-park', 'osm-node-340', 'Pandawa Water World Solo Baru', 'rekreasi', 'Rekreasi', 'attraction', -7.6110, 110.8160, '~7.5 km · 11 mnt', 'Taman rekreasi air tematik pewayangan terbesar Solo Raya dengan seluncuran ombak spektakuler.', 'Nilai jual: Liburan akhir pekan anak-anak tanpa perlu bermacet-macetan ke luar kota.'),
  ('poi-osm-041', 'proj-the-park', 'osm-node-341', 'Wisata Danau Waduk Mulur', 'rekreasi', 'Rekreasi', 'attraction', -7.6890, 110.8750, '~4.8 km · 10 mnt', 'Danau alami asri untuk memancing, spot matahari terbenam (sunset), dan kuliner ikan bakar tepi danau.', 'Nilai jual: Rekreasi alam terbuka menyejukkan untuk melepas penat rutinitas kerja.'),

  -- 9. Kuliner
  ('poi-osm-042', 'proj-the-park', 'osm-node-342', 'Warung Makan Tradisional Solo-Gayam', 'kuliner', 'Kuliner', 'restaurant', -7.6715, 110.8415, '~0.1 km · 1 mnt', 'Warung masakan rumahan lezat, sayur lodeh, ayam kampung, dan aneka lauk khas Solo.', 'Nilai jual: Solusi santap siang praktis dan lezat di dekat pintu perumahan.'),
  ('poi-osm-043', 'proj-the-park', 'osm-node-343', 'Rumah Makan Soto Seger Mbok Giyem', 'kuliner', 'Kuliner', 'restaurant', -7.6770, 110.8360, '~1.8 km · 4 mnt', 'Kuliner legendaris Solo Raya dengan kuah bening gurih segar dan aneka sate puyuh/perkedel.', 'Nilai jual: Sarapan favorit keluarga di akhir pekan dengan cita rasa khas nusantara.'),
  ('poi-osm-044', 'proj-the-park', 'osm-node-344', 'Sentra Jamu & Kuliner Sukoharjo', 'kuliner', 'Kuliner', 'restaurant', -7.6820, 110.8310, '~3.0 km · 6 mnt', 'Pusat wisata kuliner malam Sukoharjo menyajikan olahan jamu tradisional herbal dan makanan khas daerah.', 'Nilai jual: Menjaga vitalitas dan kesehatan tubuh dengan minuman herbal alami khas Sukoharjo.'),
  ('poi-osm-045', 'proj-the-park', 'osm-node-345', 'Bebek Goreng H. Slamet Solo Baru', 'kuliner', 'Kuliner', 'restaurant', -7.6040, 110.8220, '~7.9 km · 11 mnt', 'Pusat bebek goreng empuk renyah sambal korek legendaris yang mendunia.', 'Nilai jual: Destinasi jamuan makan siang bersama tamu dan keluarga besar.'),
  ('poi-osm-046', 'proj-the-park', 'osm-node-346', 'Mie Gacoan Solo Baru', 'kuliner', 'Kuliner', 'restaurant', -7.6030, 110.8205, '~8.0 km · 11 mnt', 'Restoran mie pedas viral favorit generasi muda dan keluarga dengan harga sangat terjangkau.', 'Nilai jual: Hiburan kuliner kekinian favorit anak-anak dan remaja.')
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
  updated_at = NOW();
