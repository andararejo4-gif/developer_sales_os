# Dokumentasi Database Migration — Developer Sales OS (`devos`)
PT Andara Rejo Makmur · The Park Townhouse Sukoharjo

Dokumen ini mendokumentasikan skema database PostgreSQL `devos` yang dirancang berdasarkan **Sales Playbook, SOP & KPI Sales Executive The Park Townhouse v1.2** (19 Modul A–S) dengan implementasi peran AI Sales Manager & Team Leader.

---

## 1. Arsitektur Role & Hak Akses

Sistem mendukung 6 role pengguna melalui enum `devos.role_pengguna ('SE', 'TL', 'ADMIN', 'SM', 'IT', 'DIREKSI')`:

| Role | Karakteristik Akun | Fitur & Batasan Utama |
|---|---|---|
| **SE** (Sales Executive) | `jenis_akun = 'manusia'` | Mengelola lead pribadi, kualifikasi BANT, agenda kunjungan, penawaran, booking, log aktivitas, dan laporan harian (sebelum pukul 18.00). |
| **TL** (Team Leader) | **Full AI** (`jenis_akun = 'ai'`), manusia tetap bisa login (`jenis_akun = 'manusia'`) | Melakukan briefing pagi personal (07.25), monitoring SLA respons 5 menit, pengalihan lead 72 jam, asistensi lapangan geotag/foto, dan penegakan SOP. |
| **SM** (Sales Manager) | **Semi AI** (Manusia + AI) | **Manusia**: Melakukan CRUD master proyek & inventori unit, memantau seluruh SE di bawah binaannya, mengevaluasi laporan & pipeline review.<br>**AI**: Rekomendasi coaching, analisis titik bocor funnel, dan simulasi penutup gap target. |
| **DIREKSI** | `jenis_akun = 'manusia'` | Memantau pencapaian **Target vs Aktual** (Lead, Booking, Net Sales, Omzet) per proyek yang masuk ke dalam portofolio direksi, serta ringkasan portofolio akumulatif. Pengambil keputusan eskalasi (diskon khusus, refund, sanksi HR). |
| **ADMIN** | `jenis_akun = 'manusia'` | Distribusi lead round-robin manual, konfirmasi booking H+1, penguncian hold unit, administrasi dokumen KPR/legalitas. |
| **IT** | `jenis_akun = 'manusia'` | Manajemen teknis sistem, parameter konfigurasi `devos.parameter_sistem`, audit log 100%, dan integrasi API. |

---

## 2. Struktur Proyek & Unit (CRUD SM)

Sesuai kebutuhan, manusia dengan role SM dapat mengelola proyek dan 30 unit properti:

### Tabel `devos.proyek`
- `id` (UUID, Primary Key)
- `kode` (Contoh: `TP-SKH`)
- `nama` (Nama proyek perumahan: `The Park Townhouse Sukoharjo`)
- `tipe` (`devos.tipe_proyek`: `'mewah'`, `'menengah'`, `'subsidi'`, `'villa_resort'`, `'komersial'`)
- `lokasi` (Alamat lengkap)
- `keterangan`
- `aktif` (Boolean)

### Tabel `devos.unit`
- `id` (UUID, Primary Key)
- `proyek_id` (Relasi ke `devos.proyek`)
- `cluster` (`Nagoya`, `Osaka`, `Tokyo`)
- `nama_unit` (Contoh: `A.01`, `B.04`, `C.02`)
- `tipe_unit` (`Diamond`, `Gold`, `Emerald`)
- `luas_tanah` (**LT** dalam m²)
- `luas_bangunan` (**LB** dalam m²)
- `harga_cash_keras` (Harga tunai keras)
- `harga_cash_6` (**Cash tempo 6 bulan**)
- `harga_cash_12` (**Cash tempo 12 bulan**)
- `harga_cash_24` (**Cash tempo 24 bulan**)
- `keterangan` (Deskripsi keunggulan unit: hook, hadap taman, jumlah KT/KM, carport)
- `status` (`tersedia`, `hold`, `booking`, `terjual`)

> **Fitur Otomatis Riwayat Harga**: Setiap update pada harga di tabel `devos.unit`, trigger `devos.simpan_riwayat_harga()` otomatis mencatat riwayat perubahan ke tabel `devos.unit_harga_riwayat`.

---

## 3. Fitur SM: Memantau SE di Bawahnya

Tabel `devos.pengguna` menghubungkan SE ke atasan melalui kolom `atasan_id` (dengan validasi trigger `devos.cek_atasan()` hanya boleh ke SM atau TL).

SM disediakan serangkaian **Views siap pakai** untuk monitoring real-time:

1. **`devos.v_sm_tim_se`**:
   - Menampilkan seluruh SE binaan SM tersebut.
   - Status login terakhir, proyek yang ditugaskan, jumlah lead aktif, jumlah hot prospek, dan tugas yang terlambat.
2. **`devos.v_sm_pantau_se_kinerja`**:
   - Membandingkan target vs aktual bulanan per SE (Lead, Prospek, Kunjungan, Booking, Net Sales).
   - Indikator kecepatan respons rata-rata (menit).
   - Jumlah lead terancam aturan 72 jam.
   - Status laporan harian hari ini (`tepat_waktu`, `terlambat`, atau `belum_kirim`).
   - Skor scorecard bulanan terakhir beserta kategorinya (`Bintang`, `Tercapai`, `Mendekati`, `Di Bawah Target`, `Kritis`).
3. **`devos.v_sm_lead_peringatan_72jam`**:
   - Daftar lead milik SE yang belum dihubungi dan mendekati batas 72 jam sebelum otomatis dikembalikan ke pool.
4. **`devos.v_sm_pipeline_review`**:
   - Daftar hot prospek dari tim SE, skor BANT, persona P1–P6, skema bayar yang diminati, serta status next step (terlambat/hari ini/akan datang).
5. **`devos.v_sm_aktivitas_harian_tim`**:
   - Agregasi log harian per SE: panggilan telepon, chat WA baru vs follow-up, canvassing, OTT, sosmed, dan referral.

---

## 4. Fitur Direksi: Portofolio Proyek & Target vs Aktual

Direksi dihubungkan ke proyek melalui tabel relasi `devos.portofolio_direksi (direksi_id, proyek_id)` (divalidasi oleh trigger `devos.cek_direksi()`).

Direksi dapat memantau portofolio secara komprehensif melalui views:

1. **`devos.v_direksi_portofolio`**:
   - Daftar proyek perumahan yang dipegang oleh masing-masing direksi.
   - Rekap ketersediaan inventori: Total Unit, Unit Tersedia, Hold, Booking, dan Terjual.
2. **`devos.v_direksi_target_vs_aktual`**:
   - **Target**: Lead, Booking, Net Sales, dan Omzet Rupiah yang ditetapkan manajemen.
   - **Aktual**: Realisasi lead, prospek kualifikasi, kunjungan lokasi terealisasi, booking masuk, net sales terverifikasi, dan total omzet rupiah yang diperoleh.
   - **Persentase Capaian (%)**: `% lead`, `% booking`, `% net sales`, `% omzet`.
   - **Gap Analysis**: Selisih kekurangan unit net sales dan omzet rupiah ke target.
3. **`devos.v_direksi_ringkasan_akumulasi`**:
   - Agregasi seluruh proyek dalam portofolio direksi dalam satu baris ringkas per periode bulan.

---

## 5. Implementasi 19 Modul Playbook (A–S)

1. **Modul A (Manajemen Lead & Validasi)**: Validasi nomor WA unik, opt-in consent (`izin_dihubungi` & timestamp), fungsi `cek_nomor_ganda()`, kelas lead (Premium/Baik/Lemah/Tidak Valid).
2. **Modul B (Distribusi Lead & Kepemilikan)**: Aturan 72 jam via stored procedure `devos.kembalikan_lead_72jam()`, jadwal piket & shift di `devos.jadwal_piket`.
3. **Modul C (Speed-to-Lead & Respons)**: Kolom `respons_pertama_pada`, perhitungan rata-rata kecepatan respons per SE.
4. **Modul D (Kualifikasi BANT & Persona)**: Form skor BANT 0–3 per huruf dengan kolom kalkulasi otomatis `bant_total` (0–12) dan `bant_grade` (A/B/C/D), persona P1–P6, segmen ring geografis (Ring 1, 2, 3, Investor).
5. **Modul E (Pipeline Penjualan)**: 10 tahapan pipeline terstandarisasi dengan validasi **Stage Gate** (Lead hanya bisa naik ke Prospek jika BANT ≥ 7, Hot jika BANT ≥ 10 dan sudah visit). Timeline riwayat otomatis via tabel `devos.lead_timeline`.
6. **Modul F (Inventori Unit & Daftar Harga)**: Status unit real-time (`tersedia`, `hold`, `booking`, `terjual`), multi skema harga periode (cash keras, cash 6, 12, 24 bulan).
7. **Modul G (Penawaran & Simulasi)**: Tabel `devos.penawaran` menyimpan snapshot unit, skema, harga, dan file simulasi.
8. **Modul H (Appointment & Kunjungan)**: Tabel `devos.appointment` dengan status `hadir` / `tidak_hadir` (show/no-show ratio) dan form kunjungan digital JSONB.
9. **Modul I (Follow-up Cadence & Tugas)**: Tabel `devos.tugas` dengan status dan jatuh tempo terstruktur.
10. **Modul J (Log Aktivitas Harian)**: Tabel `devos.aktivitas_harian` untuk mencatat dial, chat WA, canvassing dengan geotag (lat/lng), OTT, konten sosmed, dan minta referral.
11. **Modul K (Booking → DP → KPR → Net Sales)**: Tabel `devos.booking` dengan default nominal booking Rp5.000.000, validasi rekening resmi PT Andara Rejo Makmur (`rekening_resmi_valid`), checklist dokumen KPR (`devos.booking_dokumen`), pengajuan multi-bank paralel (`devos.booking_pengajuan_bank`), dan termin cash tempo (`devos.booking_pembayaran`).
12. **Modul L (Referral & Co-broke)**: Tabel `devos.referral` ("Sahabat The Park") dan `devos.agen_cobroke`.
13. **Modul M (KPI & Scorecard Otomatis)**: Target per SE di `devos.target_se` dan stored function `devos.hitung_scorecard_se()` untuk menghitung bobot: Booking 35%, Net sales 20%, Kunjungan 15%, Prospek 10%, Kepatuhan 10%, Waktu respons 5%, Referral 5%.
14. **Modul N (Laporan Harian & Ritme Rapat)**: Tabel `devos.laporan_harian` dengan sistem penguncian otomatis paska 18.00.
15. **Modul O (Analitik Funnel & Iklan)**: Tabel `devos.kampanye_iklan` dan `devos.biaya_iklan` untuk mengukur CPL dan efektivitas biaya per booking.
16. **Modul P (Sales Library & Enablement)**: Tabel `devos.sales_library` berisi materi sales, skrip closing, 99 keunggulan bertag persona, dan bank objection handling.
17. **Modul Q (Kepatuhan, Approval & Audit Log)**: Tabel `devos.audit_log` dengan trigger append-only pada seluruh tabel utama, tabel `devos.persetujuan` dan `devos.matriks_kewenangan`.
18. **Modul S (AI SM/TL Engine)**: Tabel `devos.ai_keputusan` dan `devos.ai_banding` untuk mencatat transparansi seluruh keputusan, briefing, dan audit AI beserta jalur banding ke manajemen manusia.

---

## 6. Daftar File Migrasi & Cara Menjalankan

Direktori `db/migrations/` berisi file migrasi berurutan:

1. `0001_schema_dan_tipe.sql` — Schema `devos`, tipe enum, fungsi umum.
2. `0002_pengguna_proyek_unit.sql` — Pengguna, Proyek, Unit, Target Proyek, Portofolio Direksi.
3. `0003_lead_pipeline.sql` — Master sumber lead, lead, BANT, timeline, appointment, penawaran, tugas.
4. `0004_booking_transaksi.sql` — Booking, checklist dokumen KPR, multi-bank, cash tempo termin.
5. `0005_kpi_ai_audit.sql` — Target SE, log aktivitas, laporan harian, scorecard, program resmi, audit log.
6. `0006_sm_direksi_views_dan_fitur_lengkap.sql` — Views Direksi, Views SM, jadwal piket, referral, co-broke, sales library, dan fungsi scorecard.

### Opsi A: Eksekusi Sekaligus (All-in-One)
Gunakan file gabungan `db/devos_all_in_one.sql`:
```bash
psql -U postgres -d nama_database -f db/devos_all_in_one.sql
```

### Opsi B: Eksekusi Bertahap (Step-by-Step)
```bash
psql -U postgres -d nama_database -f db/migrations/0001_schema_dan_tipe.sql
psql -U postgres -d nama_database -f db/migrations/0002_pengguna_proyek_unit.sql
psql -U postgres -d nama_database -f db/migrations/0003_lead_pipeline.sql
psql -U postgres -d nama_database -f db/migrations/0004_booking_transaksi.sql
psql -U postgres -d nama_database -f db/migrations/0005_kpi_ai_audit.sql
psql -U postgres -d nama_database -f db/migrations/0006_sm_direksi_views_dan_fitur_lengkap.sql
```

### Mengisi Seed Data Demo
Untuk mengisi data awal demo The Park Townhouse Sukoharjo (30 unit, user 6 role, target proyek):
```bash
psql -U postgres -d nama_database -f db/seeds/0001_seed_the_park_sukoharjo.sql
```
