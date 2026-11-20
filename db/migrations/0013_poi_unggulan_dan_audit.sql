-- ============================================================================
-- DEVELOPER SALES OS (sales_os)
-- Migration 0013: Kolom poi.unggulan, Skor Kurasi, dan Tabel Audit Kurasi POI
-- Sesuai Instruksi Kurasi Fasilitas Unggulan Homepage (15-25 pin pada 5 km)
-- ============================================================================

-- 1. Tambah Kolom poi.unggulan, skor_kurasi, dan alasan_kurasi
ALTER TABLE poi ADD COLUMN IF NOT EXISTS unggulan BOOLEAN DEFAULT FALSE;
ALTER TABLE poi ADD COLUMN IF NOT EXISTS skor_kurasi NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE poi ADD COLUMN IF NOT EXISTS alasan_kurasi TEXT;

CREATE INDEX IF NOT EXISTS idx_poi_unggulan ON poi(unggulan);

-- 2. Buat Tabel Audit Log Kurasi POI (poi_curation_audit)
CREATE TABLE IF NOT EXISTS poi_curation_audit (
    id VARCHAR(50) PRIMARY KEY,
    poi_id VARCHAR(50) NOT NULL REFERENCES poi(id) ON DELETE CASCADE,
    poi_name VARCHAR(255) NOT NULL,
    previous_unggulan BOOLEAN NOT NULL,
    new_unggulan BOOLEAN NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poi_curation_audit_poi_id ON poi_curation_audit(poi_id);
CREATE INDEX IF NOT EXISTS idx_poi_curation_audit_time ON poi_curation_audit(changed_at DESC);

-- 3. Update Status Unggulan dan Skor untuk Seluruh POI
UPDATE poi SET unggulan = TRUE, skor_kurasi = 98.0, alasan_kurasi = 'Stadion kabupaten kebanggaan daerah, fasilitas olahraga utama radius 1 km otomatis unggulan' WHERE name = 'Stadion Gelora Merdeka Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 94.0, alasan_kurasi = 'Gelanggang Olahraga indoor serbaguna tingkat kabupaten dalam radius 1 km' WHERE name = 'GOR Gelora Merdeka Sukoharjo';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 58.0, alasan_kurasi = 'Sarana lapangan tenis pelengkap kompleks Gelora Merdeka' WHERE name = 'Lapangan Tenis Gelora Merdeka';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 59.0, alasan_kurasi = 'Sarana kolam renang pelengkap kompleks Gelora Merdeka' WHERE name = 'Kolam Renang Gelora Merdeka';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 56.0, alasan_kurasi = 'Sarana lapangan panahan pelengkap kompleks Gelora Merdeka' WHERE name = 'Lapangan Panahan Gelora Merdeka';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 54.0, alasan_kurasi = 'Lapangan olahraga kecil pelengkap kompleks' WHERE name = 'Lapangan Futsal & Basket Merdeka';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 91.0, alasan_kurasi = 'Taman rekreasi dan ruang terbuka hijau keluarga utama dalam radius 1 km' WHERE name = 'Taman Wisata Pakujoyo Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 55.0, alasan_kurasi = 'Wahana bermain anak pelengkap Taman Pakujoyo' WHERE name = 'Taman Lalu Lintas & Playground Anak Pakujoyo';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 44.0, alasan_kurasi = 'Studio senam privat ukuran ruko' WHERE name = 'Fitness & Sanggar Senam Prima Gayam';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 88.0, alasan_kurasi = 'Sekolah dasar negeri percontohan terdekat dalam radius 1 km' WHERE name = 'SD Negeri Gayam 1 Sukoharjo';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 52.0, alasan_kurasi = 'Taman kanak-kanak lingkungan' WHERE name = 'TK Pertiwi Gayam Sukoharjo';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 48.0, alasan_kurasi = 'Pendidikan anak usia dini tingkat RT/RW' WHERE name = 'PAUD KB Melati Gayam';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 89.0, alasan_kurasi = 'Masjid jami utama lingkungan Gayam dalam radius 1 km' WHERE name = 'Masjid Al-Huda Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 43.0, alasan_kurasi = 'Musala warga ukuran kecil' WHERE name = 'Mushola Al-Ikhlas Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 65.0, alasan_kurasi = 'Gereja persekutuan lingkungan sekunder, daftar lengkap di Riset Pasar' WHERE name = 'GKJ Sukoharjo Pepanthan Gayam';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 84.0, alasan_kurasi = 'Pusat pelayanan kesehatan masyarakat terdekat dalam radius 1 km' WHERE name = 'Puskesmas Pembantu Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 56.0, alasan_kurasi = 'Gerai apotek retail obat' WHERE name = 'Apotek Kimia Farma Gayam Sukoharjo';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 54.0, alasan_kurasi = 'Klinik pratama faskes 1 kecil non-spesialis' WHERE name = 'Klinik Pratama Sehat Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 45.0, alasan_kurasi = 'Minimarket retail feeder lokal' WHERE name = 'Minimarket Indomaret Gayam Sukoharjo';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 42.0, alasan_kurasi = 'Minimarket retail feeder lokal' WHERE name = 'Minimarket Alfamart Gayam';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 85.0, alasan_kurasi = 'Pasar tradisional segar utama kebutuhan dapur harian dalam radius 1 km' WHERE name = 'Pasar Tradisional Senggol Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 36.0, alasan_kurasi = 'Pangkalan ojek feeder transportasi sekunder' WHERE name = 'Pangkalan Ojek & Angkutan Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 45.0, alasan_kurasi = 'Halte angkutan pedesaan/feeder' WHERE name = 'Halte Angkutan Jombor - Gayam';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 87.0, alasan_kurasi = 'Pusat administrasi kependudukan sipil resmi terdekat dalam radius 1 km' WHERE name = 'Kantor Kelurahan Gayam Sukoharjo';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 39.0, alasan_kurasi = 'Pos penjagaan/pos ronda tingkat RW' WHERE name = 'Pos Keamanan Terpadu Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 46.0, alasan_kurasi = 'Gerai mesin ATM tanpa layanan teller/cabang' WHERE name = 'ATM Center Bersama Gayam';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 82.0, alasan_kurasi = 'Kantor bank cabang resmi terdekat dalam radius 1 km' WHERE name = 'Bank BKK Sukoharjo Cabang Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 38.0, alasan_kurasi = 'Agen transaksi keuangan mikro perantara' WHERE name = 'Agen BRILink & Pegadaian Digital Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 40.0, alasan_kurasi = 'Warung soto sarapan lokal informal' WHERE name = 'Warung Soto Seger Gayam';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 35.0, alasan_kurasi = 'Warung angkringan/HIK santai malam informal' WHERE name = 'Wedangan HIK Pak Ndut Gayam';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 83.0, alasan_kurasi = 'Sentra kuliner malam terorganisir terdekat dalam radius 1 km' WHERE name = 'Sentra Kuliner Malam Jombor';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 95.0, alasan_kurasi = 'SMA Negeri peringkat 1 favorit se-kabupaten Sukoharjo' WHERE name = 'SMA Negeri 1 Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 90.0, alasan_kurasi = 'SMP Negeri favorit zonasi pusat kota Sukoharjo' WHERE name = 'SMP Negeri 1 Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 96.0, alasan_kurasi = 'Masjid agung megah pusat Kabupaten Sukoharjo' WHERE name = 'Masjid Agung Baiturrahmah Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 97.0, alasan_kurasi = 'Rumah sakit rujukan utama tipe B milik pemerintah kabupaten' WHERE name = 'RSUD Ir. Soekarno Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 92.0, alasan_kurasi = 'Rumah sakit swasta rujukan terakreditasi paripurna di jalur utama' WHERE name = 'RS Nirmala Suri Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 93.0, alasan_kurasi = 'Departement store dan supermarket pusat belanja keluarga terlengkap di Sukoharjo' WHERE name = 'Luwes Mall Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 94.0, alasan_kurasi = 'Pasar induk tradisional modern pusat Kabupaten Sukoharjo' WHERE name = 'Pasar Ir. Soekarno Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 91.0, alasan_kurasi = 'Stasiun kereta api penumpang aktif rute Purwosari-Wonogiri' WHERE name = 'Stasiun Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 90.0, alasan_kurasi = 'Terminal induk bus AKAP/AKDP kabupaten rute nasional' WHERE name = 'Terminal Bus Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 97.0, alasan_kurasi = 'Pusat pemerintahan kabupaten dan pelayanan publik satu atap' WHERE name = 'Kantor Bupati & Mall Pelayanan Publik (MPP)';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 95.0, alasan_kurasi = 'Landmark sipil & ruang publik terbuka hijau utama kota' WHERE name = 'Alun-Alun Satya Negara Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 92.0, alasan_kurasi = 'Markas komando kepolisian resor kabupaten 24 jam' WHERE name = 'Polres Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 91.0, alasan_kurasi = 'Kantor cabang utama perbankan BUMN Sukoharjo' WHERE name = 'Bank BRI Kantor Cabang Sukoharjo';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 68.0, alasan_kurasi = 'Kantor cabang pembantu sekunder di samping kantor cabang utama BRI' WHERE name = 'Bank Mandiri KCP Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 96.0, alasan_kurasi = 'Kuliner legendaris ikonik Sukoharjo langganan Presiden Joko Widodo' WHERE name = 'Ayam Goreng Kampung Mbah Karto Tembel';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 89.0, alasan_kurasi = 'Destinasi wisata kuliner herbal & khas Kota Jamu Sukoharjo' WHERE name = 'Sentra Jamu & Kuliner Sukoharjo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 99.0, alasan_kurasi = 'Mall gaya hidup termegah Solo Raya di koridor Solo Baru' WHERE name = 'The Park Mall Solo Baru';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 98.0, alasan_kurasi = 'Pusat belanja modern superblok terpadu Solo Baru' WHERE name = 'Pakuwon Mall Solo Baru';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 97.0, alasan_kurasi = 'Rumah sakit swasta tipe A terlengkap Solo Baru dengan helipad & pusat onkologi' WHERE name = 'RS Indriati Solo Baru';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 93.0, alasan_kurasi = 'Rumah sakit swasta terpercaya puluhan tahun di koridor Solo Baru' WHERE name = 'RS Dr. Oen Solo Baru';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 94.0, alasan_kurasi = 'Taman rekreasi air tematik pewayangan bertaraf nasional' WHERE name = 'Pandawa Water World Solo Baru';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 70.0, alasan_kurasi = 'Destinasi wisata alam sekunder perbatasan timur Sukoharjo (~4.2 km)' WHERE name = 'Wisata Danau Waduk Mulur';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 88.0, alasan_kurasi = 'Halte transit bus raya modern ber-AC koridor Solo Baru' WHERE name = 'Halte BST Solo Baru (Batik Solo Trans)';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 95.0, alasan_kurasi = 'Kantor cabang utama Bank BCA dengan layanan Prioritas/Solitaire' WHERE name = 'Bank BCA Kantor Cabang Solo Baru';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 95.0, alasan_kurasi = 'Pelopor bebek goreng legendaris ikon kuliner nasional asal Sukoharjo' WHERE name = 'Bebek Goreng H. Slamet Solo Baru';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 87.0, alasan_kurasi = 'Restoran kuliner kekinian viral di sentra komersial Solo Baru' WHERE name = 'Mie Gacoan Solo Baru';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 88.0, alasan_kurasi = 'Lembaga pendidikan Islam modern terpadu rujukan regional' WHERE name = 'Pondok Pesantren Al-Mukmin Ngruki';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 96.0, alasan_kurasi = 'Universitas swasta terkemuka Solo Raya akreditasi Unggul' WHERE name = 'Universitas Muhammadiyah Surakarta (UMS)';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 98.0, alasan_kurasi = 'Universitas negeri PTN-BH terkemuka bertaraf internasional' WHERE name = 'Universitas Sebelas Maret (UNS)';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 99.0, alasan_kurasi = 'Hub stasiun utama KA eksekutif antarkota & KRL Commuter Line Solo-Yogya' WHERE name = 'Stasiun Solobalapan';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 99.0, alasan_kurasi = 'Bandara penerbangan udara domestik dan internasional' WHERE name = 'Bandara Internasional Adi Soemarmo';
UPDATE poi SET unggulan = TRUE, skor_kurasi = 98.0, alasan_kurasi = 'Rumah sakit umum daerah rujukan provinsi Jawa Tengah' WHERE name = 'RSUD Dr. Moewardi Surakarta';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 50.0, alasan_kurasi = 'Fasilitas sekunder' WHERE name = 'Minimarket Indomaret Tanjung Anom';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 50.0, alasan_kurasi = 'Fasilitas sekunder' WHERE name = 'Puskesmas Grogol Sukoharjo';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 50.0, alasan_kurasi = 'Fasilitas sekunder' WHERE name = 'Kantor Pos Pembantu Solo Baru';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 50.0, alasan_kurasi = 'Fasilitas sekunder' WHERE name = 'ATM BNI KC Solo Baru';
UPDATE poi SET unggulan = FALSE, skor_kurasi = 50.0, alasan_kurasi = 'Fasilitas sekunder' WHERE name = 'Pesanggrahan Langenharjo Sukoharjo';
