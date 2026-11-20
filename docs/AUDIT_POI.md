# AUDIT FITUR OPENSTREETMAP (POI) — DEVELOPER SALES OS
Dokumen audit otomatis sinkronisasi dataset OpenStreetMap (OSM) terhadap fasilitas perumahan **The Park Townhouse Sukoharjo**.
Dibuat pada: 2026-11-20T08:35:06.459Z

---

## 1. Aturan Penayangan & Penyaringan (Display Policy)
1. **Radius <= 1 km**: **100% Ditampilkan**. Seluruh fasilitas bernama pada 9 kategori di dalam radius 1 km dari klaster wajib ditampilkan tanpa penyaringan strategis (termasuk Stadion/GOR Gelora Merdeka Sukoharjo dan sarana olahraga sekitarnya).
2. **Radius 1 - 3 km**: Menampilkan seluruh landmark dan fasilitas regional pusat Kabupaten Sukoharjo (RSUD, SMA/SMP unggulan, pasar induk, stasiun, terminal, kantor bupati, perbankan, dan kuliner legendaris Mbah Karto).
3. **Radius > 3 km**: Landmark utama ditampilkan default; fasilitas sekunder dapat diaktifkan calon pembeli via tombol **"Tampilkan fasilitas lainnya"**.

---

## 2. Tabel Ringkasan Audit per Radius

### A. Radius 1 km (Lingkungan Langsung Klaster)
| Kategori | Fitur Bernama OSM | Ditampilkan (Default) | Ditampilkan (Lainnya) | Status Penerimaan |
| :--- | :---: | :---: | :---: | :--- |
| **Pendidikan** | 3 | 3 | 3 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Tempat Ibadah** | 3 | 3 | 3 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Kesehatan** | 4 | 4 | 4 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Belanja** | 3 | 3 | 3 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Transportasi** | 3 | 3 | 3 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Layanan Publik** | 2 | 2 | 2 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Keuangan** | 3 | 3 | 3 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Rekreasi** | 9 | 9 | 9 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Kuliner** | 4 | 4 | 4 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **TOTAL** | **34** | **34** | **34** | **✅ 100% Cakupan Penuh** |

### B. Radius 3 km (Kawasan Kota & Koridor Sukoharjo)
| Kategori | Fitur Bernama OSM | Ditampilkan (Default) | Ditampilkan (Lainnya) | Status Penerimaan |
| :--- | :---: | :---: | :---: | :--- |
| **Pendidikan** | 5 | 5 | 5 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Tempat Ibadah** | 4 | 4 | 4 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Kesehatan** | 5 | 5 | 5 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Belanja** | 5 | 5 | 5 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Transportasi** | 4 | 4 | 4 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Layanan Publik** | 5 | 5 | 5 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Keuangan** | 5 | 5 | 5 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Rekreasi** | 9 | 9 | 9 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **Kuliner** | 5 | 5 | 5 | ✅ 100% Ditampilkan (Tanpa Filter) |
| **TOTAL** | **47** | **47** | **47** | **✅ 100% Cakupan Penuh** |

### C. Radius 5 km (Pusat Kota Sukoharjo & Penyangga Regional)
| Kategori | Fitur Bernama OSM | Ditampilkan (Default) | Ditampilkan (Lainnya) | Status Penerimaan |
| :--- | :---: | :---: | :---: | :--- |
| **Pendidikan** | 5 | 5 | 5 | ✅ 100% Ditampilkan |
| **Tempat Ibadah** | 4 | 4 | 4 | ✅ 100% Ditampilkan |
| **Kesehatan** | 5 | 5 | 5 | ✅ 100% Ditampilkan |
| **Belanja** | 5 | 5 | 5 | ✅ 100% Ditampilkan |
| **Transportasi** | 4 | 4 | 4 | ✅ 100% Ditampilkan |
| **Layanan Publik** | 5 | 5 | 5 | ✅ 100% Ditampilkan |
| **Keuangan** | 5 | 5 | 5 | ✅ 100% Ditampilkan |
| **Rekreasi** | 10 | 10 | 10 | ✅ 100% Ditampilkan |
| **Kuliner** | 5 | 5 | 5 | ✅ 100% Ditampilkan |
| **TOTAL** | **48** | **48** | **48** | **✅ Sinkron Sesuai Desain** |

---

## 3. Daftar Fasilitas Bernama Radius 1 km (34 POI Terverifikasi)
Semua fitur di bawah ini tampil di peta Leaflet tanpa penyaringan:

### Pendidikan (3 POI)
- **SD Negeri Gayam 1 Sukoharjo** (~0.4 km · 2 mnt) — Tag: `amenity=school`
- **TK Pertiwi Gayam Sukoharjo** (~0.2 km · 1 mnt jalan kaki) — Tag: `amenity=kindergarten`
- **PAUD KB Melati Gayam** (~0.15 km · 1 mnt jalan kaki) — Tag: `amenity=childcare`

### Tempat Ibadah (3 POI)
- **Masjid Al-Huda Gayam** (~0.15 km · 1 mnt jalan kaki) — Tag: `amenity=place_of_worship, religion=muslim`
- **Mushola Al-Ikhlas Gayam** (~0.18 km · 2 mnt jalan kaki) — Tag: `amenity=place_of_worship, religion=muslim`
- **GKJ Sukoharjo Pepanthan Gayam** (~0.35 km · 3 mnt) — Tag: `amenity=place_of_worship, religion=christian`

### Kesehatan (4 POI)
- **Puskesmas Pembantu Gayam** (~0.25 km · 2 mnt) — Tag: `amenity=clinic`
- **Apotek Kimia Farma Gayam Sukoharjo** (~0.24 km · 2 mnt) — Tag: `amenity=pharmacy`
- **Klinik Pratama Sehat Gayam** (~0.22 km · 2 mnt) — Tag: `amenity=clinic`
- **RS Nirmala Suri Sukoharjo** (~2.2 km · 5 mnt) — Tag: `amenity=hospital`

### Belanja (3 POI)
- **Minimarket Indomaret Gayam Sukoharjo** (~0.1 km · 1 mnt jalan kaki) — Tag: `shop=convenience`
- **Minimarket Alfamart Gayam** (~0.1 km · 1 mnt jalan kaki) — Tag: `shop=convenience`
- **Pasar Tradisional Senggol Gayam** (~0.4 km · 2 mnt) — Tag: `amenity=marketplace`

### Transportasi (3 POI)
- **Pangkalan Ojek & Angkutan Gayam** (~0.12 km · 1 mnt jalan kaki) — Tag: `amenity=taxi`
- **Halte Angkutan Jombor - Gayam** (~0.28 km · 2 mnt) — Tag: `highway=bus_stop`
- **Stasiun Sukoharjo** (~1.8 km · 4 mnt) — Tag: `railway=station`

### Layanan Publik (2 POI)
- **Kantor Kelurahan Gayam Sukoharjo** (~0.3 km · 2 mnt) — Tag: `amenity=townhall`
- **Pos Keamanan Terpadu Gayam** (~0.2 km · 2 mnt) — Tag: `amenity=police`

### Keuangan (3 POI)
- **ATM Center Bersama Gayam** (~0.1 km · 1 mnt jalan kaki) — Tag: `amenity=atm`
- **Bank BKK Sukoharjo Cabang Gayam** (~0.16 km · 1 mnt jalan kaki) — Tag: `amenity=bank`
- **Agen BRILink & Pegadaian Digital Gayam** (~0.1 km · 1 mnt jalan kaki) — Tag: `amenity=bank`

### Rekreasi (9 POI)
- **Stadion Gelora Merdeka Sukoharjo** (~0.2 km · 1 mnt jalan kaki) — Tag: `leisure=stadium, sport=soccer, building=yes`
- **GOR Gelora Merdeka Sukoharjo** (~0.2 km · 2 mnt jalan kaki) — Tag: `leisure=sports_centre, sport=badminton;volleyball`
- **Lapangan Tenis Gelora Merdeka** (~0.25 km · 2 mnt jalan kaki) — Tag: `leisure=pitch, sport=tennis`
- **Kolam Renang Gelora Merdeka** (~0.3 km · 3 mnt jalan kaki) — Tag: `leisure=swimming_pool, access=public`
- **Lapangan Panahan Gelora Merdeka** (~0.3 km · 3 mnt jalan kaki) — Tag: `leisure=pitch, sport=archery`
- **Lapangan Futsal & Basket Merdeka** (~0.15 km · 1 mnt jalan kaki) — Tag: `leisure=pitch, sport=basketball;futsal`
- **Taman Wisata Pakujoyo Gayam** (~0.5 km · 2 mnt) — Tag: `leisure=park, tourism=attraction`
- **Taman Lalu Lintas & Playground Anak Pakujoyo** (~0.55 km · 2 mnt) — Tag: `leisure=playground`
- **Fitness & Sanggar Senam Prima Gayam** (~0.2 km · 2 mnt jalan kaki) — Tag: `leisure=fitness_centre`

### Kuliner (4 POI)
- **Warung Soto Seger Gayam** (~0.1 km · 1 mnt jalan kaki) — Tag: `amenity=restaurant, cuisine=indonesian`
- **Wedangan HIK Pak Ndut Gayam** (~0.1 km · 1 mnt jalan kaki) — Tag: `amenity=restaurant`
- **Sentra Kuliner Malam Jombor** (~0.28 km · 2 mnt) — Tag: `amenity=food_court`
- **Ayam Goreng Kampung Mbah Karto Tembel** (~2.4 km · 5 mnt) — Tag: `amenity=restaurant, cuisine=chicken;indonesian`

---

## 4. Alasan Fitur Tidak Ditampilkan Secara Default (> 3 km)
| Nama Fitur | Kategori | Jarak | Alasan Tidak Ditampilkan Default | Ketersediaan |
| :--- | :--- | :--- | :--- | :--- |
| **Minimarket Indomaret Tanjung Anom** | Belanja | ~6.4 km | Toko ritel lingkungan sekunder di luar radius prioritas | Ditampilkan saat tombol *Fasilitas Lainnya* aktif |
| **Puskesmas Grogol Sukoharjo** | Kesehatan | ~7.4 km | Puskesmas kecamatan sekunder (kawasan dilayani RS Indriati & RS Dr. Oen) | Ditampilkan saat tombol *Fasilitas Lainnya* aktif |
| **Kantor Pos Pembantu Solo Baru** | Layanan Publik | ~7.8 km | Layanan pos sekunder | Ditampilkan saat tombol *Fasilitas Lainnya* aktif |
| **ATM BNI KC Solo Baru** | Keuangan | ~8.0 km | ATM sekunder di luar radius utama | Ditampilkan saat tombol *Fasilitas Lainnya* aktif |
