# AUDIT KURASI FASILITAS UNGGULAN (POI) — DEVELOPER SALES OS
Dokumen audit kurasi OpenStreetMap (OSM) dan verifikasi titik spasial perumahan **The Park Townhouse Sukoharjo**.
Diperbarui pada: 2026-11-20T16:35:00+07:00 (Sesuai Revisi Kurasi Fasilitas Unggulan Blueprint v1.2)

---

## 1. Kebijakan Kurasi & Penayangan Peta Homepage (Display Policy)
1. **Fasilitas Unggulan (Default Homepage)**:
   - Homepage perumahan difokuskan untuk menyajikan **fasilitas unggulan bernilai jual tinggi bagi calon pembeli properti**: stadion/GOR/kompleks olahraga, taman dan wisata, rumah sakit/puskesmas, sekolah/kampus dikenal, pasar tradisional/mal besar, tempat ibadah utama, stasiun/terminal/halte utama, kantor pelayanan publik, bank cabang, dan kuliner ikonik.
   - Fasilitas besar dalam radius 1 km dari klaster (mis. **Stadion Gelora Merdeka**, **GOR Gelora Merdeka**, **Taman Wisata Pakujoyo**) otomatis menjadi unggulan.
   - Batas penayangan homepage: **sekitar 15-25 pin pada radius 5 km, maksimal 5 per kategori**. Label nama otomatis hanya muncul untuk pin unggulan agar peta tetap bersih dan elegan.
   - Seluruh fasilitas feeder (warung, agen transaksi keuangan perantara/BRILink, pos keamanan, musala kecil, lapangan kecil, minimarket ritel, pangkalan ojek) disaring dari penayangan default homepage.
2. **Tombol "Tampilkan fasilitas lainnya" (Default: MATI)**:
   - Calon pembeli dapat mengaktifkan opsi ini untuk memunculkan seluruh fasilitas feeder/sekunder yang disaring.
   - Daftar lengkap seluruh 68 fasilitas tetap tercatat dan dapat diakses di menu **Riset Pasar** dalam aplikasi dasbor.
3. **Audit Curation Log**:
   - Seluruh perubahan kurasi status unggulan per titik oleh developer/SUPERADMIN dicatat pada tabel `poi_curation_audit` dan terpantau di Panel Superadmin.

---

## 2. Tabel Ringkasan Audit per Radius

### A. Radius 1 km (Lingkungan Langsung Klaster)
| Kategori | Fitur Bernama OSM | Unggulan (Tampil Default) | Feeder (Tampil Jika 'Lainnya') | Status Penerimaan |
| :--- | :---: | :---: | :---: | :--- |
| **Pendidikan** | 3 | 1 | 2 | ✅ 1 Unggulan (SDN Gayam 1) · 2 Feeder (PAUD & TK) |
| **Tempat Ibadah** | 3 | 1 | 2 | ✅ 1 Unggulan (Masjid Al-Huda) · 2 Feeder |
| **Kesehatan** | 3 | 1 | 2 | ✅ 1 Unggulan (Puskesmas Pembantu) · 2 Feeder (Klinik & Apotek) |
| **Belanja** | 3 | 1 | 2 | ✅ 1 Unggulan (Pasar Senggol) · 2 Feeder (Alfamart & Indomaret) |
| **Transportasi** | 2 | 0 | 2 | ✅ 0 Unggulan (Feeder: Ojek & Halte Angkot) |
| **Layanan Publik** | 2 | 1 | 1 | ✅ 1 Unggulan (Kelurahan Gayam) · 1 Feeder (Pos Kamling) |
| **Keuangan** | 3 | 1 | 2 | ✅ 1 Unggulan (Bank BKK Gayam) · 2 Feeder (BRILink & ATM) |
| **Rekreasi** | 9 | 3 | 6 | ✅ 3 Unggulan (Stadion, GOR, Taman Pakujoyo) · 6 Feeder |
| **Kuliner** | 4 | 2 | 2 | ✅ 2 Unggulan (Sentra Jombor, Ayam Mbah Karto) · 2 Feeder (Warung) |
| **TOTAL (1 km)** | **32** | **11** | **21** | **✅ 11 Pin Unggulan (Bersih, Rapi & Faktual)** |

### B. Radius 5 km (Pusat Kota Sukoharjo & Koridor Utama)
| Kategori | Fitur Bernama OSM | Unggulan (Tampil Default) | Batas Maks per Kategori | Status Penerimaan |
| :--- | :---: | :---: | :---: | :--- |
| **Pendidikan** | 5 | 3 | Maks. 5 | ✅ SDN Gayam 1, SMAN 1, SMPN 1 |
| **Tempat Ibadah** | 4 | 2 | Maks. 5 | ✅ Masjid Al-Huda, Masjid Agung Baiturrahmah |
| **Kesehatan** | 5 | 3 | Maks. 5 | ✅ Puskesmas Pembantu, RS Nirmala Suri, RSUD Ir. Soekarno |
| **Belanja** | 5 | 3 | Maks. 5 | ✅ Pasar Senggol, Luwes Mall, Pasar Ir. Soekarno |
| **Transportasi** | 4 | 2 | Maks. 5 | ✅ Stasiun Sukoharjo, Terminal Bus Sukoharjo |
| **Layanan Publik** | 5 | 4 | Maks. 5 | ✅ Kelurahan Gayam, Alun-Alun Satya Negara, Kantor Bupati MPP, Polres |
| **Keuangan** | 5 | 2 | Maks. 5 | ✅ Bank BKK Cabang Gayam, Bank BRI KC Sukoharjo |
| **Rekreasi** | 10 | 3 | Maks. 5 | ✅ Stadion Gelora Merdeka, GOR Gelora Merdeka, Taman Pakujoyo |
| **Kuliner** | 5 | 3 | Maks. 5 | ✅ Sentra Kuliner Jombor, Ayam Goreng Mbah Karto, Sentra Jamu |
| **TOTAL (5 km)** | **48** | **25** | **≤ 25 Pin** | **✅ Tepat 25 Pin Unggulan (Maks. 4 per Kategori)** |

---

## 3. Rincian Skor & Alasan Kurasi Tiap Fasilitas

### A. Fasilitas Besar / Menengah yang Dikelompokkan Feeder / Sekunder
| Nama Fasilitas | Kategori | Jarak | Skor | Alasan Tidak Menjadi Unggulan Default |
| :--- | :--- | :---: | :---: | :--- |
| **Lapangan Futsal & Basket Merdeka** | Rekreasi | ~0.15 km | 54.0 | Sarana lapangan olahraga kecil pelengkap; cukup diwakili oleh Stadion & GOR Gelora Merdeka. |
| **Lapangan Tenis Gelora Merdeka** | Rekreasi | ~0.25 km | 58.0 | Sarana lapangan tenis pelengkap kompleks Gelora Merdeka. |
| **Kolam Renang Gelora Merdeka** | Rekreasi | ~0.30 km | 59.0 | Sarana kolam renang pelengkap; tidak mendominasi dibanding stadion utama. |
| **Lapangan Panahan Gelora Merdeka** | Rekreasi | ~0.30 km | 56.0 | Lapangan hobi sekunder komunitas panahan. |
| **Taman Lalu Lintas Anak Pakujoyo** | Rekreasi | ~0.55 km | 55.0 | Sub-wahana bermain anak di dalam kawasan Taman Wisata Pakujoyo. |
| **Wisata Danau Waduk Mulur** | Rekreasi | ~4.23 km | 70.0 | Destinasi alam pinggiran kabupaten; dibatasi agar rekreasi dalam 5 km tidak melebihi kuota 5 pin. |
| **Fitness & Sanggar Senam Prima** | Rekreasi | ~0.20 km | 44.0 | Studio senam privat ruko kecil (feeder kebugaran). |
| **Bank Mandiri KCP Sukoharjo** | Keuangan | ~1.43 km | 68.0 | Kantor cabang pembantu; perbankan utama kota sudah diwakili oleh Kantor Cabang Utama BRI Sukoharjo. |
| **Agen BRILink & Pegadaian Digital** | Keuangan | ~0.10 km | 38.0 | Agen transaksi mikro perantara; bukan kantor cabang bank resmi. |
| **ATM Center Bersama Gayam** | Keuangan | ~0.10 km | 46.0 | Gerai mesin ATM mandiri tanpa kantor perbankan. |
| **GKJ Sukoharjo Pepanthan Gayam** | Tempat Ibadah | ~0.35 km | 65.0 | Gereja persekutuan lokal warga; tempat ibadah utama diwakili Masjid Jami dan Masjid Agung. |
| **Mushola Al-Ikhlas Gayam** | Tempat Ibadah | ~0.18 km | 43.0 | Musala warga ukuran kecil di jalur pemukiman. |
| **Minimarket Alfamart Gayam** | Belanja | ~0.10 km | 42.0 | Ritel minimarket waralaba feeder; disaring sesuai instruksi B2. |
| **Minimarket Indomaret Gayam** | Belanja | ~0.10 km | 45.0 | Ritel minimarket waralaba feeder; disaring sesuai instruksi B2. |
| **Warung Soto Seger Gayam** | Kuliner | ~0.10 km | 40.0 | Warung makan sarapan lokal informal (bukan kuliner ikonik tujuan wisata). |
| **Wedangan HIK Pak Ndut Gayam** | Kuliner | ~0.10 km | 35.0 | Warung angkringan santai malam informal (feeder). |
| **Pos Keamanan Terpadu Gayam** | Layanan Publik | ~0.20 km | 39.0 | Pos ronda/kamtibmas lingkungan RW; layanan sipil diwakili Kantor Kelurahan. |
| **Pangkalan Ojek & Angkutan Gayam** | Transportasi | ~0.12 km | 36.0 | Pangkalan ojek feeder transportasi sekunder. |
| **Halte Angkutan Jombor - Gayam** | Transportasi | ~0.28 km | 45.0 | Halte angkutan pedesaan feeder; simpul transportasi utama diwakili Stasiun & Terminal Bus. |
| **Klinik Pratama Sehat Gayam** | Kesehatan | ~0.22 km | 54.0 | Klinik pratama dokter umum kecil; layanan faskes rujukan diwakili Puskesmas Pembantu dan RSUD. |
| **Apotek Kimia Farma Gayam** | Kesehatan | ~0.24 km | 56.0 | Toko obat ritel farmasi pelengkap. |
| **PAUD KB Melati Gayam** | Pendidikan | ~0.15 km | 48.0 | Kelompok bermain tingkat RW (feeder edukasi balita). |
| **TK Pertiwi Gayam Sukoharjo** | Pendidikan | ~0.20 km | 52.0 | Taman kanak-kanak lingkungan (feeder pra-sekolah). |

### B. Fasilitas Unggulan Terpilih pada Radius 5 km (25 POI)
1. **Stadion Gelora Merdeka Sukoharjo** (Skor: 98.0) — Stadion olahraga kebanggaan daerah (< 1 km).
2. **GOR Gelora Merdeka Sukoharjo** (Skor: 94.0) — Gedung olahraga indoor serbaguna (< 1 km).
3. **Taman Wisata Pakujoyo Gayam** (Skor: 91.0) — Ruang terbuka hijau dan danau buatan keluarga (< 1 km).
4. **SD Negeri Gayam 1 Sukoharjo** (Skor: 88.0) — SD Negeri percontohan zonasi (< 1 km).
5. **SMA Negeri 1 Sukoharjo** (Skor: 95.0) — SMA Negeri peringkat 1 kabupaten (~1.0 km).
6. **SMP Negeri 1 Sukoharjo** (Skor: 90.0) — SMP Negeri favorit pusat kota (~1.2 km).
7. **Masjid Al-Huda Gayam** (Skor: 89.0) — Masjid jami utama lingkungan Gayam (< 1 km).
8. **Masjid Agung Baiturrahmah Sukoharjo** (Skor: 96.0) — Masjid agung megah pusat kabupaten (~1.8 km).
9. **Puskesmas Pembantu Gayam** (Skor: 84.0) — Pusat pelayanan kesehatan primer (< 1 km).
10. **RS Nirmala Suri Sukoharjo** (Skor: 92.0) — RS swasta rujukan terakreditasi paripurna (~1.1 km).
11. **RSUD Ir. Soekarno Sukoharjo** (Skor: 97.0) — RSUD rujukan utama tipe B kabupaten (~1.7 km).
12. **Pasar Tradisional Senggol Gayam** (Skor: 85.0) — Pasar bahan pangan segar harian (< 1 km).
13. **Luwes Mall Sukoharjo** (Skor: 93.0) — Pusat belanja departement store keluarga (~1.5 km).
14. **Pasar Ir. Soekarno Sukoharjo** (Skor: 94.0) — Pasar induk tradisional modern pusat kabupaten (~1.7 km).
15. **Stasiun Sukoharjo** (Skor: 91.0) — Stasiun kereta api aktif Batara Kresna (~1.1 km).
16. **Terminal Bus Sukoharjo** (Skor: 90.0) — Terminal induk bus antarkota AKAP/AKDP (~1.7 km).
17. **Kantor Kelurahan Gayam Sukoharjo** (Skor: 87.0) — Pelayanan administrasi kependudukan sipil (< 1 km).
18. **Alun-Alun Satya Negara Sukoharjo** (Skor: 95.0) — Landmark sipil & ruang publik utama kabupaten (~1.8 km).
19. **Kantor Bupati & Mall Pelayanan Publik (MPP)** (Skor: 97.0) — Pelayanan perizinan dan investasi satu atap (~1.9 km).
20. **Polres Sukoharjo** (Skor: 92.0) — Markas komando kepolisian resor kabupaten (~1.9 km).
21. **Bank BKK Sukoharjo Cabang Gayam** (Skor: 82.0) — Kantor cabang perbankan resmi lingkungan (< 1 km).
22. **Bank BRI Kantor Cabang Sukoharjo** (Skor: 91.0) — Kantor cabang utama perbankan BUMN Sukoharjo (~1.4 km).
23. **Sentra Kuliner Malam Jombor** (Skor: 83.0) — Sentra kuliner malam terorganisir (< 1 km).
24. **Ayam Goreng Kampung Mbah Karto Tembel** (Skor: 96.0) — Kuliner legendaris ikon Sukoharjo langganan Presiden (~0.9 km).
25. **Sentra Jamu & Kuliner Sukoharjo** (Skor: 89.0) — Wisata kuliner herbal khas Kota Jamu (~1.6 km).
