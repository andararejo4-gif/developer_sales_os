# Developer Sales OS — Project Handover & Local State (`PROJECT.md`)

> **Terakhir diperbarui:** 23 November 2026 (Local Workspace — belum di-push ke GitHub sesuai instruksi operator).

---

## 1. Lingkungan Lokal & Server Aktif

### Local (Windows)
- **Frontend (Vite + React 19 + Tailwind 4):** `http://localhost:5173` (`npm run dev`)
- **Backend API (Bun):** `http://127.0.0.1:3040` (`bun --env-file=.env server/index.ts`)
- **PostgreSQL Lokal (Laragon):** `127.0.0.1:5435`, database `sales_os` (migrasi `db/migrations/0014_production_pipeline_wa_ai.sql` + tabel SE Ops otomatis dari `ensureSeOpsTables()` di `server/index.ts`).
- **FFmpeg Lokal:** `C:\Users\user\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe`

### Server Hermes & Produksi (`hades` / `andara-server`)
- **Hermes VNC Flow API:** `https://hermes.giivepro.com` (`GET /health`, `POST /v1/generate`, `GET /v1/jobs/{job_id}`, `GET /v1/media/{filename}`, auth header `X-API-Key`).
- **Service di `hades`:** `/opt/flow-service/flow_engine.py` (backup aman tersimpan di `/opt/flow-service/flow_engine.py.bak.20261123`).
  - **Patch 1 (Foto):** Pengambilan langsung URL resolusi penuh `=s0` via CDP `fetch()` dari tile galeri Google Flow.
  - **Patch 2 (Video):** Menunggu tombol `Download media` lalu klik `<flow-menu-item>` `720p` dengan pointer event untuk mengunduh MP4.

---

## 2. Fitur SE yang Sudah Dibangun & Diperbaiki

### A. Navigasi & Isolasi Data Per Akun SE (`se_email`)
- **Menu SE Dirapikan:** [App.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/App.tsx), [MobileBottomNav.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/mobile/MobileBottomNav.tsx), [MobileMoreSheet.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/mobile/MobileMoreSheet.tsx) — hanya menampilkan *Dashboard*, *Pipeline*, *Kalender Konten*, *Playbook*, *Rute Harian Canvassing*, *Absen, GPS, Call*, *Knowledge Base Produk*, dan *Surat Cinta 99 Keunggulan*.
- **Isolasi Ketat:**
  - `se_field_logs`, `se_custom_routes`, `se_daily_notes`, dan `se_content_slots` seluruhnya terisolasi per `se_email`.
  - [FieldOpsModal.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/FieldOpsModal.tsx) tidak lagi memuat data dummy SE lain untuk role `SE`, dan `localStorage` di-scope per `userEmail`.

### B. Dashboard KPI Harian / Mingguan / Bulanan Real
- Di [server/index.ts](file:///C:/Users/user/myproject/andaraos/developer_sales_os/server/index.ts), `periods.harian` (berbasis capaian Laporan Harian 13 Item), `periods.minggu` (berbasis capaian 7 hari), dan `periods.bulan` (`totalScorecardPoints` SOP Playbook §6.4) kini dihitung terpisah dan dinamis.

### C. Absensi Masuk/Keluar & GPS Live Radar (ala ShopeeFood)
- [GpsLiveRadarMap.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/field/GpsLiveRadarMap.tsx): Peta **Leaflet** dengan `navigator.geolocation.watchPosition`, animasi radar pulse, reverse geocoding nama jalan OpenStreetMap Nominatim (throttled ≥ 60m), perhitungan jarak *Haversine* ke POI terdekat (`src/data/osm_poi.json`) + proyek, serta pin **Rute Harian Canvassing**.
- [FieldOpsModal.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/FieldOpsModal.tsx): Ringkasan **Jam Masuk / Jam Keluar / Status Kehadiran** harian per akun, unggah bukti foto (`capture="environment"`), sinkronisasi otomatis ke `se_daily_notes` (Item 2 & 4) dan status `visited` di `/api/se/routes`.

### D. Rute Harian, Playbook, & Knowledge Base
- [DailyRouteViewer.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/DailyRouteViewer.tsx): Tambah/edit/hapus/tandai titik kunjungan manual tersimpan ke PostgreSQL `/api/se/routes`.
- [PlaybookViewer.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/PlaybookViewer.tsx): Tab **Skrip, Keberatan & Eskalasi** (WA/Telepon, Objection Handling, Eskalasi TL/SM).
- [KnowledgeBaseViewer.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/KnowledgeBaseViewer.tsx): Tab **Siteplan & Simulasi KPR** dengan kalkulator cicilan interaktif.

### E. Kalender Konten AI (Papan Kertas Berpin + Studio Media Hermes)
- **Visual Papan Kerja ([ContentCalendarViewer.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/ContentCalendarViewer.tsx) & [index.css](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/index.css)):**
  - Default tampilan **Harian** (`day`, 3 kertas: Pagi `TOFU`, Siang `MOFU`, Malam `BOFU`) dengan pin di atas tengah, animasi ayunan halus `.pinned-paper-sway`, warna kertas variatif, tombol **Sudah Upload ✓**, dan **Tempel Link**.
  - **Mingguan:** Grid `md:grid-cols-8` (4 kertas di atas, 3 kertas terpusat di bawah).
  - **Bulanan:** **1 Kertas = 1 Hari** (30 kertas).
- **Halaman Khusus Overview Konten ([ContentSlotOverviewPage.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/content/ContentSlotOverviewPage.tsx)):**
  - Mobile-first (`?slot=...`), polling progres real-time (`3/5 Slide Selesai`), preview slider Carousel & Video Player MP4.
- **Grounding Playbook v1.2 Penuh, 9router Live AI, Anti-Halusinasi & Flow-Native Poster/Carousel ([content-media-worker.ts](file:///C:/Users/user/myproject/andaraos/developer_sales_os/server/content-media-worker.ts), [server/index.ts](file:///C:/Users/user/myproject/andaraos/developer_sales_os/server/index.ts), [ContentCalendarViewer.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/ContentCalendarViewer.tsx), [ContentSlotOverviewPage.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/content/ContentSlotOverviewPage.tsx)):**
  - **9router AI Aktif:** Worker membaca `AI_ROUTER_URL` (`https://9router.giivepro.com/v1`), `AI_ROUTER_API_KEY`, dan `AI_ROUTER_MODEL` (`andararejomakmurjosjis`) secara konsisten dengan `server/ai-engine.ts` (sebelumnya keliru membaca `OPENAI_*` sehingga selalu jatuh ke fallback).
  - **Sinkronisasi Format/Platform DB → Frontend:** `ContentCalendarViewer.tsx` menyinkronkan `format` dan `platform` dari PostgreSQL (`se_content_slots`) sehingga tidak terjadi mismatch antara slot Reels vs Carousel/Single Poster.
  - Seluruh `PLAYBOOK_AI_KNOWLEDGE_CONTEXT` dikirim utuh (tanpa terpotong) dengan mapping akurat `PLAYBOOK_BUYER_PERSONAS` (`P1–P6`, memakai `archetype` segmen alami tanpa menyebut nama fiktif persona atau kode `#12/#16` di caption publik), `PLAYBOOK_UNIT_CATALOG` (18 unit, harga resmi mulai **Rp650 juta cash / Rp683 juta KPR**), dan rotasi 6 pilar konten.
  - Guardrail kepatuhan Bab 7.11 (`enforcePlaybookCompliance()`): memblokir klaim terlarang (*pasti untung, pasti naik, bebas banjir, pasti disetujui KPR*) dan mencegah harga palsu di bawah Rp650 juta.
  - Deduplikasi judul otomatis: menarik hingga 30 judul terakhir milik `se_email` dari PostgreSQL agar setiap konten harian & carousel selalu unik.
  - Sanitasi visual (`sanitizeVisualPrompt()`): larangan keras memunculkan nama SE atau nama orang di atas fasad rumah (tulisan `"The Park Townhouse"` hanya boleh di gerbang masuk utama cluster).
  - **Flow-Native Poster & Carousel 5 Slide Nyambung (`buildFlowNativePosterPrompt()`):** Poster tunggal (`Single Image + Visual Quote`) dan Carousel 5 slide (`TOFU` Edukasi, `MOFU` Bedah Unit/Bukti, `BOFU` Penawaran/Booking Rp5 Juta) digenerate langsung utuh oleh Google Flow bergaya *golden-hour* megah (referensi `tester_flow_poster_megah.jpg`), tanpa bar footer bawah dan tanpa overlay teks ganda di `ContentSlotOverviewPage.tsx` (download langsung file asli). Termasuk fallback alur 5-slide TOFU/MOFU/BOFU yang tidak pernah mengulang poster kembar.
  - Default fokus 7 hari pertama; Minggu ke-2+ tersedia tombol **Generate Minggu X Sekarang** (`POST /api/se/content-slots/generate-week`).
- **Branding 2 Logo Transparan & Video 25 Detik ([BrandedPosterSlide.tsx](file:///C:/Users/user/myproject/andaraos/developer_sales_os/src/components/content/BrandedPosterSlide.tsx) & [video-composer.ts](file:///C:/Users/user/myproject/andaraos/developer_sales_os/server/video-composer.ts)):**
  - Bar informasi bawah pada `BrandedPosterSlide.tsx` sudah dihapus.
  - Kedua logo transparan tersimpan di `public/brand/logo-the-park.png` dan `public/brand/logo-andara-rejo-makmur.png`, tampil pada outro video (`25 detik` dengan voiceover & subtitle Indonesia selaras Playbook v1.2 mulai Rp650 jutaan).
- **File Tester Terverifikasi di Local:**
  - Foto lama: `public/generated-media/tester_photo_1.jpg`
  - Poster Flow-Native Referensi Megah: `public/generated-media/tester_flow_poster_megah.jpg`
  - Video 25s: `public/generated-media/tester_video_25s.mp4`

---

## 3. Catatan & Pekerjaan Lanjutan (Jika Diperlukan)
1. **Auto-trigger Rolling Minggu ke-2 di Hari ke-6:** Jadwal & tombol manual `POST /api/se/content-slots/generate-week` sudah aktif; jika ingin otomatis penuh di background saat tepat memasuki Hari ke-6, tambahkan pengecekan selisih `report_date` di `startContentMediaScheduler()`.
2. **Sinkronisasi Git & Deploy:** Seluruh perubahan saat ini masih berada di **local** (belum di-push ke GitHub). Sebelum `git push` atau deploy ke server, wajib menjalankan prosedur `git fetch` & rekonsiliasi di `AGENTS.md`.
