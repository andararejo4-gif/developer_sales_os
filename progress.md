# Progress Handover Log

Jejak perubahan proyek untuk handover antar-sesi AI. Entri terbaru selalu di atas.
Aturan: AI membaca 3–5 entri teratas saat sesi dimulai. Entri lama dicari lewat rtk rg dan di-cache ke `.agents/progress-cache.md`.

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
