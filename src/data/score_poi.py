import json
import math

with open('src/data/osm_poi.json', 'r', encoding='utf-8') as f:
    pois = json.load(f)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

# Facilities strictly classified as feeder/secondary per user prompt instructions:
# B2: "Hilangkan warung, agen layanan keuangan, pos keamanan, musala kecil, lapangan kecil, minimarket, dan fasilitas feeder lain dari peta homepage."
feeders = {
    'Minimarket Alfamart Gayam': ('Minimarket retail feeder lokal', 42.0),
    'Minimarket Indomaret Gayam Sukoharjo': ('Minimarket retail feeder lokal', 45.0),
    'Agen BRILink & Pegadaian Digital Gayam': ('Agen transaksi keuangan mikro perantara', 38.0),
    'ATM Center Bersama Gayam': ('Gerai mesin ATM tanpa layanan teller/cabang', 46.0),
    'Wedangan HIK Pak Ndut Gayam': ('Warung angkringan/HIK santai malam informal', 35.0),
    'Warung Soto Seger Gayam': ('Warung soto sarapan lokal informal', 40.0),
    'Pos Keamanan Terpadu Gayam': ('Pos penjagaan/pos ronda tingkat RW', 39.0),
    'PAUD KB Melati Gayam': ('Pendidikan anak usia dini tingkat RT/RW', 48.0),
    'TK Pertiwi Gayam Sukoharjo': ('Taman kanak-kanak lingkungan', 52.0),
    'Lapangan Futsal & Basket Merdeka': ('Lapangan olahraga kecil pelengkap kompleks', 54.0),
    'Fitness & Sanggar Senam Prima Gayam': ('Studio senam privat ukuran ruko', 44.0),
    'Lapangan Tenis Gelora Merdeka': ('Sarana lapangan tenis pelengkap kompleks Gelora Merdeka', 58.0),
    'Lapangan Panahan Gelora Merdeka': ('Sarana lapangan panahan pelengkap kompleks Gelora Merdeka', 56.0),
    'Kolam Renang Gelora Merdeka': ('Sarana kolam renang pelengkap kompleks Gelora Merdeka', 59.0),
    'Taman Lalu Lintas & Playground Anak Pakujoyo': ('Wahana bermain anak pelengkap Taman Pakujoyo', 55.0),
    'Mushola Al-Ikhlas Gayam': ('Musala warga ukuran kecil', 43.0),
    'Pangkalan Ojek & Angkutan Gayam': ('Pangkalan ojek feeder transportasi sekunder', 36.0),
    'Halte Angkutan Jombor - Gayam': ('Halte angkutan pedesaan/feeder', 45.0),
    'Klinik Pratama Sehat Gayam': ('Klinik pratama faskes 1 kecil non-spesialis', 54.0),
    'Apotek Kimia Farma Gayam Sukoharjo': ('Gerai apotek retail obat', 56.0),
}

# Large facilities / key destinations get high score
large_facility_scores = {
    'Stadion Gelora Merdeka Sukoharjo': (98.0, 'Stadion kabupaten kebanggaan daerah, fasilitas olahraga utama radius 1 km otomatis unggulan'),
    'GOR Gelora Merdeka Sukoharjo': (94.0, 'Gelanggang Olahraga indoor serbaguna tingkat kabupaten dalam radius 1 km'),
    'Taman Wisata Pakujoyo Gayam': (91.0, 'Taman rekreasi dan ruang terbuka hijau keluarga utama dalam radius 1 km'),
    'SD Negeri Gayam 1 Sukoharjo': (88.0, 'Sekolah dasar negeri percontohan terdekat dalam radius 1 km'),
    'Masjid Al-Huda Gayam': (89.0, 'Masjid jami utama lingkungan Gayam dalam radius 1 km'),
    'GKJ Sukoharjo Pepanthan Gayam': (86.0, 'Gereja Kristen Jawa utama lingkungan Gayam dalam radius 1 km'),
    'Puskesmas Pembantu Gayam': (84.0, 'Pusat pelayanan kesehatan masyarakat terdekat dalam radius 1 km'),
    'Pasar Tradisional Senggol Gayam': (85.0, 'Pasar tradisional segar utama kebutuhan dapur harian dalam radius 1 km'),
    'Kantor Kelurahan Gayam Sukoharjo': (87.0, 'Pusat administrasi kependudukan sipil resmi terdekat dalam radius 1 km'),
    'Bank BKK Sukoharjo Cabang Gayam': (82.0, 'Kantor bank cabang resmi terdekat dalam radius 1 km'),
    'Sentra Kuliner Malam Jombor': (83.0, 'Sentra kuliner malam terorganisir terdekat dalam radius 1 km'),
    'Ayam Goreng Kampung Mbah Karto Tembel': (96.0, 'Kuliner legendaris ikonik Sukoharjo langganan Presiden Joko Widodo'),
    'SMA Negeri 1 Sukoharjo': (95.0, 'SMA Negeri peringkat 1 favorit se-kabupaten Sukoharjo'),
    'SMP Negeri 1 Sukoharjo': (90.0, 'SMP Negeri favorit zonasi pusat kota Sukoharjo'),
    'Masjid Agung Baiturrahmah Sukoharjo': (96.0, 'Masjid agung megah pusat Kabupaten Sukoharjo'),
    'RSUD Ir. Soekarno Sukoharjo': (97.0, 'Rumah sakit rujukan utama tipe B milik pemerintah kabupaten'),
    'RS Nirmala Suri Sukoharjo': (92.0, 'Rumah sakit swasta rujukan terakreditasi paripurna di jalur utama'),
    'Luwes Mall Sukoharjo': (93.0, 'Departement store dan supermarket pusat belanja keluarga terlengkap di Sukoharjo'),
    'Pasar Ir. Soekarno Sukoharjo': (94.0, 'Pasar induk tradisional modern pusat Kabupaten Sukoharjo'),
    'Stasiun Sukoharjo': (91.0, 'Stasiun kereta api penumpang aktif rute Purwosari-Wonogiri'),
    'Terminal Bus Sukoharjo': (90.0, 'Terminal induk bus AKAP/AKDP kabupaten rute nasional'),
    'Kantor Bupati & Mall Pelayanan Publik (MPP)': (97.0, 'Pusat pemerintahan kabupaten dan pelayanan publik satu atap'),
    'Alun-Alun Satya Negara Sukoharjo': (95.0, 'Landmark sipil & ruang publik terbuka hijau utama kota'),
    'Polres Sukoharjo': (92.0, 'Markas komando kepolisian resor kabupaten 24 jam'),
    'Bank BRI Kantor Cabang Sukoharjo': (91.0, 'Kantor cabang utama perbankan BUMN Sukoharjo'),
    'Bank Mandiri KCP Sukoharjo': (89.0, 'Kantor cabang bank BUMN utama koridor bisnis kota'),
    'Sentra Jamu & Kuliner Sukoharjo': (89.0, 'Destinasi wisata kuliner herbal & khas Kota Jamu Sukoharjo'),
    'Wisata Danau Waduk Mulur': (90.0, 'Destinasi wisata alam danau dan rekreasi keluarga Sukoharjo'),
    'The Park Mall Solo Baru': (99.0, 'Mall gaya hidup termegah Solo Raya di koridor Solo Baru'),
    'Pakuwon Mall Solo Baru': (98.0, 'Pusat belanja modern superblok terpadu Solo Baru'),
    'RS Indriati Solo Baru': (97.0, 'Rumah sakit swasta tipe A terlengkap Solo Baru dengan helipad & pusat onkologi'),
    'RS Dr. Oen Solo Baru': (93.0, 'Rumah sakit swasta terpercaya puluhan tahun di koridor Solo Baru'),
    'Pandawa Water World Solo Baru': (94.0, 'Taman rekreasi air tematik pewayangan bertaraf nasional'),
    'Halte BST Solo Baru (Batik Solo Trans)': (88.0, 'Halte transit bus raya modern ber-AC koridor Solo Baru'),
    'Bank BCA Kantor Cabang Solo Baru': (95.0, 'Kantor cabang utama Bank BCA dengan layanan Prioritas/Solitaire'),
    'Bebek Goreng H. Slamet Solo Baru': (95.0, 'Pelopor bebek goreng legendaris ikon kuliner nasional asal Sukoharjo'),
    'Mie Gacoan Solo Baru': (87.0, 'Restoran kuliner kekinian viral di sentra komersial Solo Baru'),
    'Pondok Pesantren Al-Mukmin Ngruki': (88.0, 'Lembaga pendidikan Islam modern terpadu rujukan regional'),
    'Universitas Muhammadiyah Surakarta (UMS)': (96.0, 'Universitas swasta terkemuka Solo Raya akreditasi Unggul'),
    'Universitas Sebelas Maret (UNS)': (98.0, 'Universitas negeri PTN-BH terkemuka bertaraf internasional'),
    'Stasiun Solobalapan': (99.0, 'Hub stasiun utama KA eksekutif antarkota & KRL Commuter Line Solo-Yogya'),
    'Bandara Internasional Adi Soemarmo': (99.0, 'Bandara penerbangan udara domestik dan internasional'),
    'RSUD Dr. Moewardi Surakarta': (98.0, 'Rumah sakit umum daerah rujukan provinsi Jawa Tengah'),
}

# Facilities specifically assigned as secondary to maintain ~20-25 pins within 5km:
secondary_within_5km = {
    'Bank Mandiri KCP Sukoharjo': ('Kantor cabang pembantu sekunder di samping kantor cabang utama BRI', 68.0),
    'GKJ Sukoharjo Pepanthan Gayam': ('Gereja persekutuan lingkungan sekunder, daftar lengkap di Riset Pasar', 65.0),
    'Wisata Danau Waduk Mulur': ('Destinasi wisata alam sekunder perbatasan timur Sukoharjo (~4.2 km)', 70.0),
}
feeders.update(secondary_within_5km)

curated_pois = []
for p in pois:
    dist = haversine(-7.67159, 110.84085, p['lat'], p['lng'])
    name = p['name']
    
    if name in feeders:
        reason, score = feeders[name]
        is_ung = False
    elif name in large_facility_scores:
        score, reason = large_facility_scores[name]
        is_ung = True
    else:
        # Default fallback
        if dist <= 1000 and ('Gelora' in name or 'Stadion' in name or 'GOR' in name or 'Taman' in name):
            is_ung = True
            score = 90.0
            reason = 'Fasilitas besar dalam radius 1 km dari klaster'
        else:
            is_ung = False
            score = 50.0
            reason = 'Fasilitas sekunder'
            
    p['unggulan'] = is_ung
    p['skor_kurasi'] = score
    p['alasan_kurasi'] = reason
    curated_pois.append(p)

with open('src/data/osm_poi.json', 'w', encoding='utf-8') as f:
    json.dump(curated_pois, f, indent=2, ensure_ascii=False)

# Statistics
c1k = [p for p in curated_pois if haversine(-7.67159, 110.84085, p['lat'], p['lng']) <= 1000 and p['unggulan']]
c3k = [p for p in curated_pois if haversine(-7.67159, 110.84085, p['lat'], p['lng']) <= 3000 and p['unggulan']]
c5k = [p for p in curated_pois if haversine(-7.67159, 110.84085, p['lat'], p['lng']) <= 5000 and p['unggulan']]

print(f"Total POIs: {len(curated_pois)}")
print(f"Unggulan <= 1km: {len(c1k)}")
print(f"Unggulan <= 3km: {len(c3k)}")
print(f"Unggulan <= 5km: {len(c5k)}")

# Check per category at 5km
cats = {}
for p in c5k:
    k = p.get('categoryKey') or p.get('category')
    cats[k] = cats.get(k, 0) + 1
print("Kategori Unggulan <= 5km:")
for k, count in sorted(cats.items()):
    print(f"  {k}: {count} pin")

# Generate migration 0013 SQL
sql = """-- ============================================================================
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
"""

for p in curated_pois:
    is_ung = 'TRUE' if p.get('unggulan') else 'FALSE'
    score = p.get('skor_kurasi', 0)
    reason = p.get('alasan_kurasi', '').replace("'", "''")
    name = p['name'].replace("'", "''")
    sql += f"UPDATE poi SET unggulan = {is_ung}, skor_kurasi = {score}, alasan_kurasi = '{reason}' WHERE name = '{name}';\n"

with open('db/migrations/0013_poi_unggulan_dan_audit.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
print("Migration 0013 generated successfully at db/migrations/0013_poi_unggulan_dan_audit.sql")

