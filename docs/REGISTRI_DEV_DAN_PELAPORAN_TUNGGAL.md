# Registri DEV Tunggal & Standar Pelaporan Harian Divisi IT

**Nomor Dokumen:** `IT-STD-REG-001`  
**Tanggal Berlaku:** 26 November 2026  
**Disusun oleh:** Tim IT Internal (`IT-Kantor`)  
**Tujuan:** Menghilangkan duplikasi nomor laporan, bentrok ID `DEV-27..36`, ketidakjelasan pembagian kerja tim, dan perbedaan definisi progres 3 metrik (menjawab temuan kritis **T3** pada *Review Laporan Harian Divisi IT 26 November 2026*).

---

## 1. Standar Penomoran Laporan Harian (Unik per Penulis/Track)

Setiap laporan harian tidak boleh lagi menggunakan satu nomor generik `IT-LH-26-NOV-2026` secara bersamaan. Format wajib:

| Kode Dokumen | Cakupan Track | PIC / Penulis | Sumber Utama |
|---|---|---|---|
| `IT-LH-26-NOV-2026-A` | Track A — Server, Database, API Backend, Keamanan & Multi-Tenant | Backend / Lead DevOps (`IT-Kantor`) | `server/`, `db/migrations/`, `tests/` |
| `IT-LH-26-NOV-2026-B` | Track B — Frontend Web App, UX Role-Based, Export PDF/Excel, Mobile | Frontend / UI-UX (`IT-Kantor`) | `src/`, `components/` |
| `IT-LH-26-NOV-2026-C` | Track C — QA, UAT 40 Skenario, Release Gate & Dokumentasi | QA / CTO Reviewer (`IT-Kantor`) | `docs/uat-evidence/`, `08_UAT_40`, `09_Gate_Rilis` |
| `IT-LH-26-NOV-2026-CONSOLIDATED` | Gabungan Resmi Direksi (Ringkasan Eksekutif Harian) | CTO / Lead IT | Rekap terverifikasi A + B + C |

---

## 2. Registri DEV Conflict-Free (`DEV-01..44` vs `WEB-DEV-01..10`)

Sebelumnya terjadi tabrakan ID `DEV-27` s/d `DEV-36` antara daftar backlog inti aplikasi (`DEV-01..44`) dan daftar website/landing/CRM marketing (`WEB-DEV-01..10`). Mulai 26 November 2026:

1. **`DEV-01` s/d `DEV-44`**: Dikhususkan **hanya** untuk modul inti aplikasi SaaS (`Developer Sales OS` — Auth, Multi-Tenant, Dashboard Role, Pipeline, KPR, Absen/GPS/Call, Laporan Harian SM/SE, Export, Security).
2. **`WEB-DEV-01` s/d `WEB-DEV-10`**: Menggantikan ID `DEV-27..36` versi *Website & Marketing Funnel* (menggunakan prefix `WEB-DEV-` agar tidak pernah bertabrakan dengan `DEV-27..36` inti aplikasi).

| ID Lama (Bentrok) | ID Resmi Baru | Nama Item Pekerjaan | Track | Status Verifikasi |
|---|---|---|---|---|
| `DEV-27` (versi Web) | `WEB-DEV-01` | Landing Page Publik & Hero Section | B | Terpasang |
| `DEV-28` (versi Web) | `WEB-DEV-02` | Katalog Unit Publik & Simulasi KPR | B | Terpasang |
| `DEV-29` (versi Web) | `WEB-DEV-03` | Formulir Lead Publik ke CRM Tenant | A+B | Terpasang |
| `DEV-30` (versi Web) | `WEB-DEV-04` | Integrasi WhatsApp Click-to-Chat Publik | B | Terpasang |
| `DEV-31` (versi Web) | `WEB-DEV-05` | SEO Meta, OpenGraph & Sitemap | B | Terpasang |
| `DEV-32` (versi Web) | `WEB-DEV-06` | Halaman Profil Developer & Legalitas Proyek | B | Terpasang |
| `DEV-33` (versi Web) | `WEB-DEV-07` | Galeri Progress Pembangunan Lapangan | B | Terpasang |
| `DEV-34` (versi Web) | `WEB-DEV-08` | Testimoni & FAQ Pembeli Rumah | B | Terpasang |
| `DEV-35` (versi Web) | `WEB-DEV-09` | Tracking UTM & Sumber Lead | A+B | Terpasang |
| `DEV-36` (versi Web) | `WEB-DEV-10` | Performa & Optimasi Aset Landing Page | B | Terpasang |

> **Aturan Keras:** `DEV-27..36` pada aplikasi inti tetap merujuk pada item backend/app inti di `02_Backlog` dan tidak boleh dipakai ulang untuk item landing/web.

---

## 3. Matriks "Siapa Mengerjakan Apa" (Pembagian Kerja Terkunci)

| Area / Modul | Penanggung Jawab Utama (PIC) | Reviewer Teknis | Bukti Minimal Sebelum Klaim `Selesai` |
|---|---|---|---|
| Skema DB, Migrasi (`0001..0031`), Isolasi Tenant, Auth/2FA | Backend Lead (`IT-Kantor`) | CTO | File migrasi + HTTP/DB test pass |
| API Laporan Harian SM+SE, Absen, GPS, Call, Lead | Backend Lead (`IT-Kantor`) | CTO | Contract test + log eksekusi UAT |
| UI Dashboard Role, Date Range Picker, Responsive Action Bar | Frontend Lead (`IT-Kantor`) | CTO | `bun run build` clean + cek viewport |
| Export PDF/Excel Laporan Harian SM & SE | Frontend + Backend (`IT-Kantor`) | CTO | Output PDF/XLSX tervalidasi |
| Eksekusi UAT 40 Kasus & Berita Acara UAT | QA / Lead Dev (`IT-Kantor`) | CTO + Direksi | Log per-langkah (`docs/uat-evidence/*.log`) + BA UAT |
| Release Gate (`GATE-00` s/d `GATE-05`) | CTO | Direksi | Checklist `09_Gate_Rilis` + tanda tangan |

---

## 4. Glosarium 3 Metrik Progres (Wajib Konsisten di Semua Laporan)

Agar Direksi tidak melihat angka progres yang tampak bertentangan (mis. `37%` vs `100%` vs `0/100`), setiap laporan konsolidasi wajib mencantumkan ketiga metrik berikut secara eksplisit:

1. **Progres Backlog Excel (`Task-Level`):**  
   Rasio jumlah baris `Selesai` terhadap total baris pada `02_Backlog` (mis. `X / 782` task). Menunjukkan keluasan pekerjaan teknis + dokumentasi + gate across R0–R3.
2. **Kematangan Fitur Inti (`Feature-Maturity 5/5`):**  
   Sebuah fitur `Fxx` bernilai `5/5` hanya jika seluruh 5 sub-task pembentuknya (`-BE`, `-FE`, `-SP`, `-AUTO`, `-UAT`) berstatus `Selesai`.
3. **Kesiapan Gate Rilis (`Gate-Readiness 0..6`):**  
   Jumlah `GATE-00` s/d `GATE-05` yang memenuhi seluruh kriteria penerimaan dan disetujui Reviewer/Direksi. **Rilis produksi dilarang jika `GATE-00` dan `GATE-01` belum lulus.**
