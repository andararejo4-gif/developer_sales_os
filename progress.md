# Progress Handover Log

Jejak perubahan proyek untuk handover antar-sesi AI. Entri terbaru selalu di atas.
Aturan: AI membaca 3–5 entri teratas saat sesi dimulai. Entri lama dicari lewat rtk rg dan di-cache ke `.agents/progress-cache.md`.

## P-038 | 2026-11-23 | Auto-Fill Link Hasil Posting + Tombol Akses Link & Polish Mobile-First SE
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/content/ContentSlotOverviewPage.tsx`, `src/components/ContentCalendarViewer.tsx`, `src/components/mobile/MobileMoreSheet.tsx`
- Detail Perubahan:
  - **Auto-Fill & Tombol Akses Link Posting:** Menyinkronkan `urlInput` di `ContentSlotOverviewPage.tsx` secara otomatis saat `slot.postedUrl` atau `data.slot.posted_url` terisi dari auto-publish Zernio, lengkap dengan badge `Terisi Otomatis ✓` dan tombol **Akses Link Postingan** (`target="_blank"`) begitu link tersedia.
  - **Mobile-First Layout Detail Konten:** Merapikan header sticky menjadi hierarki native 2-3 baris (App Bar `Kembali` + `Sosmed`/`Sudah Upload`, blok judul 2 baris bebas potong, tombol aksi full-width >=44px), merapikan tombol `Download Poster`, menyembunyikan thumbnail strip 5 kolom untuk Single Poster, serta memberi bottom clearance `pb-28 md:pb-8`.
  - **Header Jadwal Konten SE:** Menyembunyikan Dual Track Switcher (`Akun Official Proyek` / `Akun Sales In-House (POV)`) untuk role `SE`, dan menyembunyikan Filter Bar (termasuk filter platform Facebook/IG/TikTok/X/YouTube) pada tampilan Harian (`viewMode === 'day'`).
  - **Mobile Bottom Bar → Menu Lainnya (`MobileMoreSheet.tsx`):** Menyembunyikan blok `Pilih Proyek Aktif` dan section `Bagian Dashboard SE` untuk role `SE` agar menu fokus ke alat kerja SE.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-037 | 2026-11-23 | Same-User Single-Slot Lock, Strict Cross-User FIFO & Cooldown Minimal 1 Menit Antar Slot
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `server/content-media-worker.ts`, `server/index.ts`, `src/components/content/ContentSlotOverviewPage.tsx`
- Detail Perubahan:
  - **Same-User Active Guard (HTTP 409):** Jika 1 SE sudah klik generate di satu slot kalender konten lalu mencoba klik generate di slot lain sebelum selesai, backend menolak (`USER_ALREADY_GENERATING`) dan UI menampilkan peringatan agar fokus menunggu slot yang sedang berjalan.
  - **Strict Cross-User FIFO Tanpa Interupsi:** Jika SE lain meminta generate saat ada proses berjalan, permintaannya tetap diterima di belakang antrean (`ORDER BY priority ASC, created_at ASC, id ASC`) tanpa menginterupsi proses yang masuk duluan, lengkap dengan info jumlah item di depan & estimasi waktu tunggu.
  - **Jeda Minimal 1 Menit (60 detik) Antar Slot/User:** Setelah 1 slot selesai (atau gagal), dispatcher wajib menunggu minimal `60.000 ms` (`MIN_INTER_SLOT_COOLDOWN_MS`) sebelum memulai slot/user berikutnya.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), live deploy `hades` + cek endpoint `/api/se/content-slots/status`.

## P-036 | 2026-11-23 | Global Sequential Render Queue (1-per-1 + Cooldown), Busy-Window Guard & Fail-Fast Hermes
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `server/content-media-worker.ts`, `server/index.ts`, `src/components/content/ContentSlotOverviewPage.tsx`, `/opt/flow-service/flow_engine.py` (di `hades`)
- Detail Perubahan:
  - **Global Sequential Queue (`sales_os.media_render_queue`):** Seluruh permintaan render foto/carousel/video dari semua SE dan scheduler kini masuk ke 1 antrean global PostgreSQL. Worker memproses **tepat 1 item (`PROCESSING`)** pada satu waktu, menunggu selesai, lalu memberi **jeda cooldown aman 12–18 detik** sebelum mengirim item berikutnya (menghilangkan burst 5 job sekaligus).
  - **Busy-Window Guard (30 Menit Sebelum Jadwal):** Mengunci generate manual pada **`08:30–09:00 WIB`** (buka `09:01`), **`13:30–14:00 WIB`** (buka `14:01`), dan **`19:00–19:30 WIB`** (buka `19:31`) agar scheduler terjadwal untuk semua SE selesai tepat waktu tanpa bentrok. UI otomatis menampilkan banner waktu sibuk & jumlah antrean global.
  - **Fail-Fast Hermes (`flow_engine.py`):** Menambahkan deteksi dini pesan *"aktivitas yang tidak biasa"* / *"unusual activity"* pada Google Flow (backup aman di `flow_engine.py.bak.20261123b`) sehingga job langsung berhenti dalam hitungan detik alih-alih menunggu timeout 160 detik, dan worker otomatis membatalkan sisa slide `PENDING` slot yang terkena limit.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), `flow-api.service` & PM2 `developer-sales-os-api` `online`.

## P-035 | 2026-11-23 | Playbook Khusus SE & Validasi Foto + GPS Rute Harian Canvassing
- Status: selesai (`e488e54`, live di `https://developerproperti.giivepro.com`)
- Ubah: `src/components/PlaybookViewer.tsx`, `src/components/DailyRouteViewer.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Playbook Independen SE:** Saat login sebagai `SE`, role switcher (`TL`, `SM`, `Digital Marketing`, `Admin & KPR`) disembunyikan dan Playbook dikunci eksklusif hanya menampilkan SOP & skrip milik `SE`.
  - **Rute Harian Canvassing:** Setiap titik rute wajib dilengkapi **Bukti Foto** (`capture="environment"` + preview thumbnail) dan memiliki 2 opsi validasi:
    1. **Tombol "Validasi Lokasi":** Melacak GPS live SE, menghitung jarak ke titik tujuan/area, mengecek kelengkapan foto. Jika lokasi sesuai radius & foto terlampir → status **`TERVALIDASI ✓`** + tercatat ke log GPS DB (`POST /api/se/field-logs`); jika lokasi di luar radius atau foto belum ada → tercatat **`PERLU DILENGKAPI`** beserta pesan kekurangannya.
    2. **Tombol "Tidak Input GPS":** Membuka field wajib **Alasan Tidak Input GPS** yang tersimpan ke PostgreSQL `/api/se/routes` dengan status **`TANPA_GPS`**.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), live `HTTP 200` (`last-modified: Mon, 23 Nov 2026 13:50:46 GMT`).

## P-034 | 2026-11-23 | Pembersihan Tampilan Brief Konten SE & Tombol Perbarui Brief AI
- Status: selesai (`5d452ab`, live)
- Ubah: `src/components/content/ContentSlotOverviewPage.tsx`, `server/index.ts`
- Detail Perubahan:
  - Mengubah **"Brief Eksekusi Konten"** menjadi **"Panduan Eksekusi Konten"** yang bersih & mudah dibaca SE (menghapus prefix internal `[P4]`, `(H-1)`, dan catatan internal persona seperti `"untuk Mas Bayu"`), menambahkan badge tujuan funnel (`Edukasi & Save` / `Bukti & Pertimbangan` / `Penawaran & Closing`), serta menampilkan **Alur Cerita 5 Slide** secara terstruktur.
  - Menyembunyikan **Prompt Visual AI (Hermes)** bahasa Inggris ke dalam toggle `<details>` opsional agar tidak membingungkan SE.
  - Menambahkan endpoint `POST /api/se/content-slots/regenerate-brief` & tombol **"Perbarui Brief AI"** di halaman detail slot untuk menyegarkan slot lama di DB dengan format brief & hook TOFU/MOFU/BOFU terbaru.
  - Audit antrean Carousel Hermes: memverifikasi `queue_size` turun bertahap (7 → 6) dengan kecepatan ±60–75 detik/gambar secara sekuensial.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), PM2 `developer-sales-os-api` `online`.

## P-033 | 2026-11-23 | Monitoring Absensi & GPS Tracking Sisi Sales Manager (SM)
- Status: selesai (`840828d`, live)
- Ubah: `src/components/field/SmFieldMonitoringView.tsx` (baru), `src/components/FieldOpsModal.tsx`, `server/index.ts`
- Detail Perubahan:
  - **Backend `GET /api/se/field-logs`:** Role manajer (`SM`, `TL`, `DIREKSI`, `ADMIN`) kini menerima seluruh log absensi, koordinat GPS, dan foto bukti dari semua SE di PostgreSQL `sales_os.se_field_logs` (role `SE` tetap terisolasi per `se_email`).
  - **Tab Absensi (Default untuk SM):** Menampilkan daftar seluruh SE (status hadir, jam Masuk `In`, jam Pulang `Out`, jumlah foto bukti), filter **Harian · Mingguan · Bulanan**, tombol **Export Excel (`.xls`)**, serta tampilan detail per SE saat diklik (riwayat In/Out, koordinat, catatan, & preview foto).
  - **Tab GPS (Sisi SM):** Default **tanpa radar** — hanya menampilkan **daftar SE terdaftar beserta posisi terakhir** (nama lokasi, jarak dari gerbang, jam terakhir, jumlah titik & foto). Klik salah satu SE membuka **halaman detail khusus SE** berisi pemilih tanggal, **Timeline Koordinat Harian Per Jam**, dan **Galeri Laporan Foto Lapangan** (bisa di-zoom).
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), live deploy sukses.

## P-032 | 2026-11-23 | Export Laporan (PDF/Excel), Pipeline Tab "Perlu Ditangani", & Guided Tour SE
- Status: selesai (`3df5b64`, live)
- Ubah: `src/lib/exporters/daily-report-exporter.ts` (baru), `src/components/se/SeGuidedTour.tsx` (baru), `src/components/PipelinePage.tsx`, `src/components/mobile/SeMobileViews.tsx`, `src/App.tsx`, `server/index.ts`
- Detail Perubahan:
  - **Export Laporan (PDF & Excel):** Mengganti seluruh tombol `Salin Laporan WA` (termasuk perbaikan `ReferenceError: copyWa is not defined`) menjadi **"Export Laporan"** dengan modal pilihan **Export PDF** (print-ready) atau **Export Excel (`.xls`)**, sekaligus menyimpan catatan laporan ke DB sebelum ekspor.
  - **Pipeline `Perlu Ditangani`:** Menambahkan tab baru **"Perlu Ditangani"** dengan badge indikator merah dinamis; lead yang belum dibalas / memiliki draf AI baru / lead `NEW` tanpa follow-up otomatis **berwarna merah** dan di-sort **paling atas** di semua tab.
  - **Roadmap & Guided Tour SE (Desktop & Mobile):** Menambahkan `SeDailyRoadmapStrip` (4 tahap: `① Absen & GPS` → `② Lead Perlu Ditangani` → `③ Konten & Rute` → `④ Export Laporan`) serta `SeGuidedTourModal` anti-ribet (1 pop-up aktif per prioritas, context-aware, tombol snooze 30 menit): memandu Check-In & GPS di pagi hari, dan memunculkan pop-up merah **"Follow Up Sekarang"** jika ada lead belum ditangani.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), live `/api/health` OK.

## P-031 | 2026-11-23 | Integrasi Zernio Social Media (4 Akun/SE, 8 Platform) & Pre-Generate Scheduler
- Status: selesai (`41a4bb6`, `b292b95`, live)
- Ubah: `server/zernio-client.ts` (baru), `src/components/content/SocialConnectModal.tsx` (baru), `server/index.ts`, `server/content-media-worker.ts`, `src/components/ContentCalendarViewer.tsx`, `src/components/content/ContentSlotOverviewPage.tsx`
- Detail Perubahan:
  - Mengonfigurasi pool **2 Zernio API Key** di `.env` lokal & server `hades` (`ZERNIO_API_KEY`, `ZERNIO_API_KEY_2`, `ZERNIO_BASE_URL`, `PUBLIC_APP_URL`) sehingga tiap SE dapat menghubungkan hingga **4 akun sosmed** (2 akun per key).
  - Menambahkan tabel `sales_os.se_social_accounts` dan endpoint `GET /api/se/social/accounts`, `GET /api/se/social/connect`, `GET /api/se/social/callback`, `DELETE /api/se/social/accounts`, serta `POST /api/se/content-slots/publish`.
  - Membangun `SocialConnectModal` dengan logo **8 platform** (**Instagram, TikTok, Facebook Page, YouTube Shorts, X/Twitter, Threads, LinkedIn, Pinterest**).
  - Default **tidak auto-posting**; tombol **"Posting ke Social Media Sekarang"** muncul setelah media `READY`, lalu otomatis mengisi `posted_url` & mengubah status menjadi `SUDAH_POSTING`.
  - Scheduler `startContentMediaScheduler()` otomatis menginisialisasi 3 slot harian mulai `08:20 WIB` dan merender media 30 menit sebelum jadwal (`08:30`, `13:30`, `19:00 WIB`).
- Verifikasi: `GET /api/se/social/connect?platform=instagram` live mengembalikan `HTTP 200` dengan `authUrl` resmi Instagram.

## P-030 | 2026-11-23 | Sinkronisasi Lokal SE + `origin/IT-kantor` ke `main`, Penguatan Hook TOFU/MOFU/BOFU & Dashboard SE
- Status: selesai (`ec338dd`, `ccc7a1a`, `c0187d8`, live)
- Ubah: `src/App.tsx`, `src/components/ContentCalendarViewer.tsx`, `src/components/FieldOpsModal.tsx`, `src/components/PlaybookViewer.tsx`, `src/components/KnowledgeBaseViewer.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `server/content-media-worker.ts`, `server/index.ts`
- Detail Perubahan:
  - Mengamankan seluruh pekerjaan lokal SE (`PROJECT.md`, Hermes Studio, GPS Radar, Rute Harian, KPR KB) di branch `feat/se-ops-local`, lalu menggabungkan `origin/IT-kantor` (multi-proyek, Superadmin/IT dashboards, impersonasi) ke `main` dengan tetap mempertahankan 100% isolasi & fitur `SE`.
  - Memperketat prompt AI TOFU/MOFU/BOFU di `content-media-worker.ts` dengan field `hook` eksplisit per stage dan skrip Reels 3-tahap (`0-3d Hook | 4-11d Bukti | 12-Nd CTA`).
  - Memperbaiki Dashboard SE: menambah *debounce* 500ms pada input catatan laporan, counter `Target Hit` dinamis, dan `quickStatus` di `/api/se/dashboard`.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy perdana ke `https://developerproperti.giivepro.com` (`HTTP 200`).

## P-029 | 2026-11-23 | Pembuatan & Push Branch Terisolasi IT-kantor ke Remote
- Status: selesai
- Ubah: Branch Git `IT-kantor`
- Alasan/keputusan: Menyimpan dan mengunggah seluruh pekerjaan (auth multi-tenant, dashboard superadmin eksekutif & IT, impersonasi sesi, dan pembersihan login) ke branch terisolasi `IT-kantor` di GitHub (`origin/IT-kantor`) tanpa menyentuh branch `main` milik tim.
- Verifikasi: `git push -u origin IT-kantor` (sukses membuat remote branch baru), `bun test` (111 pass)
- Berikutnya: Review PR di GitHub bila ingin digabungkan ke main
- Catatan: Branch main tim aman 100% dari overwrite

## P-028 | 2026-11-23 | Pemisahan Navbar Superadmin Platform vs Proyek Klien Developer

- Status: selesai
- Ubah: `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`
- Alasan/keputusan: Menghilangkan nama proyek spesifik ("The Park Townhouse Sukoharjo") dan dropdown pemilihan proyek pada navbar header desktop, subjudul header, sidebar kiri, footer user badge, mobile top header, dan mobile more sheet khusus saat role Superadmin Platform (`SUPERADMIN` dan `SUPERADMIN_IT`) aktif. Digantikan dengan indikator cakupan global core: "Cakupan Seluruh Developer & Proyek Platform" dan tombol "Panel Multi-Tenant Core", sementara role tim sales developer klien tetap memiliki selector proyek aktif masing-masing.
- Verifikasi: `bun test` (111 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-027 | 2026-11-23 | Retensi Sesi Impersonasi IT Superadmin & Pembersihan Modal Login

- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/App.tsx`, `src/components/LoginModal.tsx`
- Alasan/keputusan: Fitur impersonasi "Bantu Akun" oleh Superadmin IT kini menyimpan sesi asli IT (`saveImpersonatorBackup`). Saat mode bantuan aktif, tersedia Sticky Banner atas dan tombol sidebar kuning "Kembali ke IT Superadmin" sehingga IT tidak lagi terlempar ke beranda publik saat selesai membantu. Memastikan modal login/signup 100% bersih tanpa teks "PT Andara Rejo Makmur" dan tanpa tombol demo percontohan.
- Verifikasi: `bun test` (111 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-027 | 2026-11-23 | Retensi Sesi Impersonasi IT Superadmin & Pembersihan Modal Login

- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/App.tsx`, `src/components/LoginModal.tsx`
- Alasan/keputusan: Fitur impersonasi "Bantu Akun" oleh Superadmin IT kini menyimpan sesi asli IT (`saveImpersonatorBackup`). Saat mode bantuan aktif, tersedia Sticky Banner atas dan tombol sidebar kuning "Kembali ke IT Superadmin" sehingga IT tidak lagi terlempar ke beranda publik saat selesai membantu. Memastikan modal login/signup 100% bersih tanpa teks "PT Andara Rejo Makmur" dan tanpa tombol demo percontohan.
- Verifikasi: `bun test` (111 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-026 | 2026-11-23 | Spesialisasi Dashboard Direksi Superadmin (Bisnis SaaS) & IT Superadmin (God Mode CRUD & Support)

- Status: selesai
- Ubah: `src/components/superadmin/PlatformExecutiveDashboard.tsx`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/App.tsx`
- Alasan/keputusan: Memisahkan secara spesifik tampilan Direksi Superadmin (`SUPERADMIN`) dan IT Superadmin (`SUPERADMIN_IT`). Direksi Superadmin memantau portofolio bisnis SaaS (trafik 14k web visitor, 16 developer aktif, MRR Rp 215 Jt, ARR Rp 2,58 M, efisiensi AI margin 99.3%, tabel portofolio developer, GMV Rp 54 M). IT Superadmin memiliki kendali God-Mode menyeluruh (hierarki Developer -> Proyek -> User SE/SM/Direksi, tombol "Bantu Akun Ini / Impersonate" untuk troubleshooting, reset kata sandi, auto-fix WhatsApp Gateway, modal CRUD user tim sales, dan health monitor PostgreSQL devos).
- Verifikasi: `bun test` (111 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-025 | 2026-11-23 | Pembersihan Total Tombol Demo & Antarmuka Bersih Login/Signup

- Status: selesai
- Ubah: `src/components/LoginModal.tsx`, `src/lib/auth/dummy-accounts.ts`
- Alasan/keputusan: Menghapus seluruh tombol/teks demo role percontohan dari modal login agar tampilan bersih (_clean_) dan siap produksi bagi calon developer baru. Menyediakan tab toggle bersih: tab "Masuk" (Email & Kata Sandi) dan tab "Daftar Baru" (Nama PT Developer, PIC, Email Bisnis, No. WA, Kata Sandi). Pengguna yang mendaftar langsung disimpan ke storage lokal dan otomatis login sebagai Direksi ke dashboard proyek.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-024 | 2026-11-23 | Pemisahan Role Internal Platform Developer Sales OS & Role Per Developer

- Status: selesai
- Ubah: `src/data.ts`, `src/lib/auth/dummy-accounts.ts`, `tests/auth-dummy.test.ts`, `src/components/mobile/MobileMoreSheet.tsx`, `src/components/SuperadminPanel.tsx`, `src/App.tsx`, `src/components/LoginModal.tsx`, `src/components/SalesTargetViewer.tsx`
- Alasan/keputusan: Menghapus hak akses Panel Superadmin Multi-Tenant dari role `DIREKSI` dan `IT` (karena keduanya adalah role per-developer klien). Membuat 2 role internal platform Developer Sales OS: `SUPERADMIN` (Direksi / Pemilik Developer Sales OS: `direksi@developersalesos.com`) dan `SUPERADMIN_IT` (Tim IT Internal Developer Sales OS: `it.internal@developersalesos.com`). Keduanya memiliki dashboard eksekutif core platform, hak akses eksklusif ke Panel Superadmin Multi-Tenant, audit token AI, kurasi POI regional, dan concierge pre-seeding VIP.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-024 | 2026-11-23 | Pemisahan Role Internal Platform Developer Sales OS & Role Per Developer

- Status: selesai
- Ubah: `src/data.ts`, `src/lib/auth/dummy-accounts.ts`, `tests/auth-dummy.test.ts`, `src/components/mobile/MobileMoreSheet.tsx`, `src/components/SuperadminPanel.tsx`, `src/App.tsx`, `src/components/LoginModal.tsx`, `src/components/SalesTargetViewer.tsx`
- Alasan/keputusan: Menghapus hak akses Panel Superadmin Multi-Tenant dari role `DIREKSI` dan `IT` (karena keduanya adalah role per-developer klien). Membuat 2 role internal platform Developer Sales OS: `SUPERADMIN` (Direksi / Pemilik Developer Sales OS: `direksi@developersalesos.com`) dan `SUPERADMIN_IT` (Tim IT Internal Developer Sales OS: `it.internal@developersalesos.com`). Keduanya memiliki dashboard eksekutif core platform, hak akses eksklusif ke Panel Superadmin Multi-Tenant, audit token AI, kurasi POI regional, dan concierge pre-seeding VIP.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-023 | 2026-11-23 | Netralkan Otentikasi & Teks Multi-Tenant (Hapus Hardcoded PT Andara Rejo Makmur)

- Status: selesai
- Ubah: `src/components/LoginModal.tsx`, `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `src/components/JalurProyek.tsx`, `src/components/PlanCheckoutModal.tsx`
- Alasan/keputusan: Menghilangkan hardcoded "PT Andara Rejo Makmur" pada modal login (subjudul "Otentikasi sesi per role", placeholder email "nama@perusahaan.com"), header sidebar ("Multi-Tenant Ecosystem"), header dashboard harian, salinan WA laporan SE, drawer mobile, dan jalur proyek agar bersih dan siap digunakan developer lain secara white-label. Ditambahkan juga shortcut pemilih cepat demo role di modal login.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-023 | 2026-11-23 | Netralkan Otentikasi & Teks Multi-Tenant (Hapus Hardcoded PT Andara Rejo Makmur)

- Status: selesai
- Ubah: `src/components/LoginModal.tsx`, `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `src/components/JalurProyek.tsx`, `src/components/PlanCheckoutModal.tsx`
- Alasan/keputusan: Menghilangkan hardcoded "PT Andara Rejo Makmur" pada modal login (subjudul "Otentikasi sesi per role", placeholder email "nama@perusahaan.com"), header sidebar ("Multi-Tenant Ecosystem"), header dashboard harian, salinan WA laporan SE, drawer mobile, dan jalur proyek agar bersih dan siap digunakan developer lain secara white-label. Ditambahkan juga shortcut pemilih cepat demo role di modal login.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-022 | 2026-11-23 | Dashboard Khusus IT Internal: Pre-Seed VIP Developer Baru

- Status: selesai
- Ubah: `src/components/SuperadminPanel.tsx`
- Alasan/keputusan: Menyediakan fitur Done-For-You Pre-seeding di Panel Superadmin IT Internal. Tim IT dapat menginput brosur/pricelist calon developer untuk langsung membuatkan akun tenant, menginisialisasi 8 modul (Surat Cinta 99 Keunggulan dari GPS, Landing Page, Riset 25 km, Target Sold Out, Playbook), Magic Link preview Direksi, dan generator pesan WhatsApp siap kirim ke owner developer.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-022 | 2026-11-23 | Dashboard Khusus IT Internal: Pre-Seed VIP Developer Baru

- Status: selesai
- Ubah: `src/components/SuperadminPanel.tsx`
- Alasan/keputusan: Menyediakan fitur Done-For-You Pre-seeding di Panel Superadmin IT Internal. Tim IT dapat menginput brosur/pricelist calon developer untuk langsung membuatkan akun tenant, menginisialisasi 8 modul (Surat Cinta 99 Keunggulan dari GPS, Landing Page, Riset 25 km, Target Sold Out, Playbook), Magic Link preview Direksi, dan generator pesan WhatsApp siap kirim ke owner developer.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-021 | 2026-11-23 | Sembunyikan Menu Pipeline & WA AI dari Akun Direksi

- Status: selesai
- Ubah: `src/App.tsx`
- Alasan/keputusan: Menyembunyikan menu "Pipeline & WA AI" dari sidebar navigasi akun Direksi (Bambang Soedirjo) dengan guard `role !== 'DIREKSI'`. Akun Direksi kini hanya menampilkan menu tingkat eksekutif (Dashboard DIREKSI, Portofolio Proyek, Eskalasi Diskon/Refund, dan Panel Superadmin Multi-Tenant).
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-020 | 2026-11-23 | Sembunyikan 10 Menu Operasional dari Sidebar Akun Direksi

- Status: selesai
- Ubah: `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`
- Alasan/keputusan: Merapikan tampilan akun Direksi (Bambang Soedirjo) dengan menyembunyikan 10 menu operasional proyek (Jalur Proyek, Riset Pasar, Target Penjualan, Kalender Konten, Playbook Sales, Absen/GPS/Call, Website Landing Page, Aturan Komisi, Knowledge Base, Surat Cinta) dari sidebar desktop dan menu drawer mobile. Direksi fokus pada Portofolio Proyek, Eskalasi Diskon/Refund, Proyeksi Akhir Bulan, Pipeline & Superadmin
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-019 | 2026-11-23 | Isolasi Surat Cinta 99 Keunggulan & Website Landing Page Per Proyek

- Status: selesai
- Ubah: `src/lib/love-letter/love-letter-engine.ts`, `src/lib/website-generator/website-engine.ts`, `src/components/LoveLetterViewerModal.tsx`, `src/components/ProjectWebsitePreview.tsx`, `src/App.tsx`
- Alasan/keputusan: Menghilangkan kebocoran data The Park Townhouse pada Surat Cinta 99 Keunggulan dan Website Landing Page. Halaman kini berbasis dokumen proyek (koordinat GPS, katalog, pricelist); menampilkan empty state "Belum ada surat cinta 99 keunggulan" dan "Belum ada website landing page" jika belum digenerate, serta tombol inisialisasi yang menghasilkan konten khusus proyek aktif (headline, subdomain, unit, harga, narasi).
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-018 | 2026-11-23 | Isolasi Penuh & Empty State 5 Modul Per Proyek

- Status: selesai
- Ubah: `src/components/JalurProyek.tsx`, `src/components/MarketResearchViewer.tsx`, `src/components/PlaybookViewer.tsx`, `src/components/ContentCalendarViewer.tsx`, `src/components/KnowledgeBaseViewer.tsx`, `src/lib/projects/projects-data.ts`, `src/lib/market-research/market-research-engine.ts`, `src/lib/playbook/playbook-generator.ts`, `src/lib/content-calendar/calendar-generator.ts`
- Alasan/keputusan: Menghilangkan kebocoran data The Park Townhouse Sukoharjo pada proyek lain (Andara Village Sukoharjo, Griya Andara Asri, proyek baru). Jika proyek belum dibuat/diinisialisasi datanya, 5 modul menampilkan pesan eksplisit: "Belum ada jalur proyek", "Belum ada riset pasar", "Belum ada playbook", "Belum ada kalender konten", dan "Belum ada knowledge base" lengkap dengan tombol inisialisasi per proyek
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-017 | 2026-11-23 | Otoritas Skenario Target Penjualan Khusus SM & Sinkronisasi Beban Kerja SE

- Status: selesai
- Ubah: `src/components/SalesTargetViewer.tsx`, `src/App.tsx`
- Alasan/keputusan: Pembatasan hak akses pemilihan skenario & parameter target penjualan (hanya SM/Direksi yang dapat mengedit; SE hanya mode baca dengan indikator gembok terkunci). Pilihan skenario SM (Konservatif / Realistis / Optimis) otomatis mengubah target kontak harian, dial, chat WA, dan survei mingguan di dashboard & laporan aktivitas SE
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-016 | 2026-11-23 | Dukungan Akun SM/TL di Lapangan & Live Radar Tracking GPS SE

- Status: selesai
- Ubah: `src/components/FieldOpsModal.tsx`, `src/App.tsx`
- Alasan/keputusan: Akun SM (Ferry Kurniawan) tidak lagi menimpa/overwrite identitas SE; SM kini memiliki kartu check-in supervisi manajerial sendiri serta dashboard Live Radar GPS yang memantau lokasi real-time seluruh SE binaan (Raka Pratama, Dian Lestari, Budi Santoso) lengkap dengan filter per personel
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-016 | 2026-11-23 | Dukungan Akun SM/TL di Lapangan & Live Radar Tracking GPS SE

- Status: selesai
- Ubah: `src/components/FieldOpsModal.tsx`, `src/App.tsx`
- Alasan/keputusan: Akun SM (Ferry Kurniawan) tidak lagi menimpa/overwrite identitas SE; SM kini memiliki kartu check-in supervisi manajerial sendiri serta dashboard Live Radar GPS yang memantau lokasi real-time seluruh SE binaan (Raka Pratama, Dian Lestari, Budi Santoso) lengkap dengan filter per personel
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-015 | 2026-11-23 | Konfigurasi Operasional Lapangan (Absen, GPS, Call Log, AI Guide) Siap Pakai & Multi-Proyek

- Status: selesai
- Ubah: `src/lib/field-ops/field-ops-store.ts`, `src/components/FieldOpsModal.tsx`, `src/App.tsx`
- Alasan/keputusan: Menghubungkan seluruh fitur halaman Operasional Lapangan (`/lapangan`: Absensi GPS, Tracking Kanvasing, Log Panggilan, AI Guide) ke proyek aktif (`activeProject`), menghitung jarak km dari koordinat GPS proyek aktif, menyediakan isolated storage per proyek, dan menyesuaikan panduan AI per proyek
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-014 | 2026-11-23 | Hapus Tombol Tambah di Jalur Proyek, Modal Dokumen Proyek, & Isolasi Data Penuh (Anti-Bocor)

- Status: selesai
- Ubah: `src/components/JalurProyek.tsx`, `src/App.tsx`
- Alasan/keputusan: Menghapus tombol tambah proyek di Jalur Proyek (terpusat di Navbar), menyematkan modal melihat dokumen input per proyek (katalog, pricelist, koordinat GPS) di Tahap 1, dan mengalirkan `projectId` & `projectName` ke seluruh modul (Riset, Playbook, Rute, Kalender, CRM, Target, KB, Website, Surat Cinta) agar data 100% terisolasi per proyek tanpa kebocoran data
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-013 | 2026-11-23 | Mesin Tambah Proyek Berbasis Koordinat GPS, Katalog, Pricelist & 6 Output Otomatis

- Status: selesai
- Ubah: `src/lib/projects/projects-data.ts`, `src/App.tsx`, `src/components/JalurProyek.tsx`, `src/components/PlaybookViewer.tsx`, `src/lib/playbook/playbook-generator.ts`, `src/lib/playbook/types.ts`, `tests/projects-data.test.ts`
- Alasan/keputusan: Alur tambah proyek berbasis koordinat GPS, radius 25km, file katalog & pricelist bertahap yang otomatis mengaktifkan 6 output: Surat Cinta 99 Keunggulan, Riset Pasar Radius 25km, Target Penjualan 100%, Kalender Konten 30 Hari (Official & per SE), Playbook Sales (SE, TL, SM, Digital Marketing, Admin), dan Rute Harian Kanvasing SE
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-012 | 2026-11-23 | Tombol Tambah Proyek di Navbar & Modal Pembuatan Proyek Baru

- Status: selesai
- Ubah: `src/App.tsx`, `src/lib/projects/projects-data.ts`, `tests/projects-data.test.ts`
- Alasan/keputusan: Menambahkan tombol "Tambah Proyek" persis di sebelah dropdown memilih proyek di navbar desktop dan sidebar, lengkap dengan modal input data proyek baru (nama, kode, tipe, lokasi, total unit, kisaran harga, deskripsi) yang otomatis tersimpan dan aktif
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-011 | 2026-11-23 | Integrasi Multi-Proyek Penuh ke Seluruh Halaman & Inventori Unit

- Status: selesai
- Ubah: `src/lib/projects/projects-data.ts`, `src/App.tsx`, `src/components/KnowledgeBaseViewer.tsx`, `src/components/LoveLetterViewerModal.tsx`, `src/components/ProjectWebsitePreview.tsx`, `tests/projects-data.test.ts`
- Alasan/keputusan: Integrasikan activeProject ke seluruh modul (Jalur Proyek, Riset, Target, Kalender, Playbook, Rute, Lapangan, Website, CRM, KB, Surat Cinta, Inventori Unit, Sidebar SM & Card Dashboard), data unit dan cluster terisolasi dinamis per proyek aktif
- Verifikasi: `bun test` (109 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-011 | 2026-11-23 | Integrasi Multi-Proyek Penuh ke Seluruh Halaman & Inventori Unit

- Status: selesai
- Ubah: `src/lib/projects/projects-data.ts`, `src/App.tsx`, `src/components/KnowledgeBaseViewer.tsx`, `src/components/LoveLetterViewerModal.tsx`, `src/components/ProjectWebsitePreview.tsx`, `tests/projects-data.test.ts`
- Alasan/keputusan: Integrasikan activeProject ke seluruh modul (Jalur Proyek, Riset, Target, Kalender, Playbook, Rute, Lapangan, Website, CRM, KB, Surat Cinta, Inventori Unit, Sidebar SM & Card Dashboard), data unit dan cluster terisolasi dinamis per proyek aktif
- Verifikasi: `bun test` (109 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-010 | 2026-11-23 | Arsitektur Multi-Proyek & Project Switcher Universal Semua Role

- Status: selesai
- Ubah: `src/lib/projects/projects-data.ts`, `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `src/data.ts`, `tests/projects-data.test.ts`
- Alasan/keputusan: Akun masuk tingkat perusahaan (PT Andara Rejo Makmur); seluruh role (SE, TL, SM, DM, Admin, Direksi, IT) kini dapat beralih proyek aktif secara dinamis
- Verifikasi: `bun test` (107 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push) sesuai instruksi user

## P-009 | 2026-11-23 | Pemisahan 30 Unit dan Pantau Kinerja SE menjadi halaman mandiri

- Status: selesai
- Ubah: `src/lib/navigation/router.ts`, `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `tests/navigation-router.test.ts`
- Alasan/keputusan: Memisahkan tabel 30 unit (`/unit-park`) dan supervisi SE (`/kinerja-se`) dari dashboard agar SM memiliki Executive Overview ringkas dan halaman kerja mandiri
- Verifikasi: `bun test` (104 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap tersimpan lokal, belum di-push ke remote sesuai instruksi user

## P-008 | 2026-11-23 | Standarisasi & penyatuan sidebar navigasi role SM

- Status: selesai
- Ubah: `src/App.tsx` (penyatuan 10 menu proyek ke top navigation, standardisasi format h-10 px-3.5, active state #master-unit & #tim-se, pembersihan impor tak terpakai)
- Alasan/keputusan: Menghilangkan redundansi menu (CRM & Rute Kanvasing), menyamakan dimensi/gaya tombol & ikon di role SM
- Verifikasi: `bun run build` (lulus tanpa error TS/Vite), `bun test` (104 pass, 0 fail)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal, tidak di-push ke remote sesuai instruksi user

## P-007 | 2026-11-23 | Sinkronisasi remote origin/main (3 commit fitur WA Outbound & SE Dashboard)

- Status: selesai
- Ubah: `git merge origin/main` (10 files: server/wa-baileys, server/index, App.tsx, PipelinePage, SE dashboard)
- Alasan/keputusan: Fast-forward pembaruan fitur kirim pesan WA langsung, chat flow, dan sinkronisasi SE dashboard
- Verifikasi: `bun test` (104 pass, 0 fail)
- Berikutnya: -
- Catatan: Perubahan lokal AGENTS.md dan progress.md aman

## P-006 | 2026-11-23 | Sinkronisasi remote origin/main (3 commit fitur WA & Pipeline AI)

- Status: selesai
- Ubah: `git merge origin/main` (36 files: backend server wa/ai, PipelinePage, router mobile, tests)
- Alasan/keputusan: Fast-forward pembaruan remote tanpa menyentuh perubahan uncommitted lokal
- Verifikasi: `bun test` (104 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan lokal pada AGENTS.md dan progress.md tetap utuh

## P-005 | 2026-11-21 | Standarisasi aturan global 9 pasal & format progress

- Status: selesai
- Ubah: `AGENTS.md` (9 pasal lengkap), `progress.md` (format baku P-xxx)
- Alasan/keputusan: Menyelaraskan alur mulai sesi, format handover terstandar, dan mekanisme caching progress lama
- Verifikasi: `rtk git status` mendeteksi perubahan terisolasi
- Berikutnya: -
- Catatan: AI sesi berikutnya wajib membaca P-005 hingga P-001 di awal sesi

## P-004 | 2026-11-21 | Mekanisme caching pembacaan riwayat lama

- Status: selesai
- Ubah: `AGENTS.md`, `progress.md` (klausul 1x baca riwayat lama dijadikan cache)
- Alasan/keputusan: Mencegah pemborosan token pembacaan ulang file riwayat
- Verifikasi: Diff terverifikasi
- Berikutnya: -

## P-003 | 2026-11-21 | Adopsi aturan minimalis workspace

- Status: selesai
- Ubah: `AGENTS.md` (meringkas aturan repo menjadi panduan kerja terpadu)
- Alasan/keputusan: Memperjelas hierarki prioritas (benar > konteks utuh > token minimal)
- Verifikasi: Diff diperiksa bersih
- Berikutnya: -

## P-002 | 2026-11-21 | Audit & instalasi plugin anti-slop

- Status: selesai
- Ubah: `~/.gemini/config/plugins/antislop` (pemasangan v3.2.32, 6 skills, 2 rules)
- Alasan/keputusan: Mencegah output UI/copy/code klise AI
- Verifikasi: `skillspector` scan (APPROVE) & `agy plugin list` status enabled
- Berikutnya: -

## P-001 | 2026-11-21 | Konfigurasi RTK CLI proxy

- Status: selesai
- Ubah: Hook pre-tool `rtk hook antigravity` aktif untuk `run_command`
- Alasan/keputusan: Kompresi output terminal untuk menghemat token
- Verifikasi: `rtk gain`, `rtk deps`, `rtk git status`
- Berikutnya: -
