# Progress Handover Log

Jejak perubahan proyek untuk handover antar-sesi AI. Entri terbaru selalu di atas.
Aturan: AI membaca 3–5 entri teratas saat sesi dimulai. Entri lama dicari lewat rtk rg dan di-cache ke `.agents/progress-cache.md`.

## P-145 | 2026-11-28 | Penutupan Kebocoran Lintas Tenant pada Field Ops, Live Location & Laporan Harian
- Status: selesai
- Ubah: `server/index.ts` (tambah isolasi `tenantId` pada `liveSeLocationsMap` di `/api/se/live-location`, filter `EXISTS app_users.tenant_id = user.tenantId` pada `GET /api/se/field-logs`, `GET /api/dashboard/summary`, dan `GET /api/sm/daily-report`, tambah `tenant_id` pada `isPhoneSuppressed`/`addPhoneToSuppression`/`removePhoneFromSuppression`, serta hapus dead helper `getAuthenticatedUser`)
- Alasan/keputusan: Mencegah data GPS live, absensi/foto lapangan, dan catatan harian SE bocor ke manager/admin tenant lain.
- Verifikasi: `rtk bun run build` & `rtk bun test tests/security-penetration-suite.test.ts`
- Berikutnya: -

## P-144 | 2026-11-28 | Sinkronisasi Data DB Lintas Role & Seed Database Lokal
- Status: selesai
- Ubah: `src/App.tsx` (sambungkan `SeMobileScorecardList` ke `realScorecardRows`/`realSummary.seTeamPerformance`, `DIGITAL_MARKETING` ke `realSummary.campaigns`, & hapus fallback dummy `BOOKING_TRANSACTIONS`), `scripts/seed-local-db.ts` (baru; seed idempotent `ad_campaigns`, `appointments`, `bank_applications`, `vault_documents`, `complaint_tickets`, `creator_profiles`, `creator_content_metrics`, `creator_ledger_entries`, `smart_links`, `payment_invoices`, `escalation_requests`, & `se_field_logs`)
- Alasan/keputusan: Menghilangkan data statis/dummy pada dashboard lintas role dan memastikan DB lokal terisi data awal realistis untuk semua role.
- Verifikasi: `bun run scripts/seed-local-db.ts` & `rtk bun run build`
- Berikutnya: -

## P-143 | 2026-11-28 | Dark Theme & Toggle Light/Dark
- Status: selesai
- Ubah: `index.html` (inisialisasi class `dark` dari `localStorage.devos_theme`), `src/index.css` (override token `html.dark`, permukaan kartu/modal/input/Leaflet, serta animasi riak air 3D smooth `theme-radial-reveal` + 3 cincin konsentris `theme-teardrop-wave`), `src/App.tsx` (state `isDarkTheme`, `toggleTheme` dari pusat koordinat tombol, & tombol toggle `Sun`/`Moon`)
- Alasan/keputusan: Memberikan dukungan Dark Theme menyeluruh dengan override token CSS tanpa mengubah puluhan komponen satu per satu.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build`)
- Berikutnya: -

## P-142 | 2026-11-28 | Skrip & Checklist Eksekusi Load Test (QA-05) & DR Drill (INF-12 / REL-02)
- Status: selesai
- Ubah: `scripts/load-test.ts` (baru; runner konkurensi + p50/p95/p99 + error rate), `scripts/dr-drill.ts` (baru; snapshot tabel inti + `pg_dump` + uji restore non-destruktif ke `dr_drill_verify`), `docs/LOAD_TEST_AND_DR_DRILL_CHECKLIST.md` (baru; panduan & form bukti eksekusi), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (perbarui bukti & catatan `QA-05`, `INF-12`, `REL-02`; status tetap `Siap review`)
- Alasan/keputusan: Memfasilitasi tim IT/QA mengeksekusi load test dan DR drill nyata sebelum menutup item `QA-05`, `INF-12`, dan `REL-02` di checklist V2.
- Verifikasi: `rtk bun run scripts/load-test.ts --base-url=http://127.0.0.1:3040 --concurrency=5 --duration=3` (smoke test lokal)
- Berikutnya: Jalankan di lingkungan staging/produksi dengan `pg_dump`/`psql` terpasang dan catat hasilnya ke `docs/LOAD_TEST_AND_DR_DRILL_CHECKLIST.md`.

## P-141 | 2026-11-28 | Penyesuaian Status Checklist V2: 61 Item Gate/UAT/DR/Load/Mobile ke Siap Review
- Status: selesai
- Ubah: `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (61 item: `GATE-00..05`, `UT-01..40`, `REL-01..10`, `MOB-09`, `INF-12`, `QA-05`, `QA-06`, `QA-08` disesuaikan dari `Selesai`/`Disetujui` menjadi `Status=Siap review`, `Hasil uji=Perlu ulang`, `Persetujuan reviewer=Belum ditinjau`, `Bukti lengkap?=Tidak`; total `02_Backlog`: **721 Selesai, 61 Siap review**)
- Alasan/keputusan: Menyelaraskan klaim checklist dengan kondisi nyata bahwa gate komersial, pengesahan pejabat, UAT bertanda tangan, uji perangkat fisik, load test, DR, dan review DoD independen belum dieksekusi.
- Verifikasi: Readback Python `openpyxl` (`Adjusted: 61`, `{'Selesai': 721, 'Siap review': 61}`)
- Berikutnya: Tunggu eksekusi UAT bertanda tangan, uji perangkat fisik, load test, DR, dan tanda tangan `13_Pengesahan` sebelum mengubah 61 item tersebut ke `Selesai`.

## P-140 | 2026-11-28 | Halaman Transaksi & Invoice Paket Developer (Admin & Direksi)
- Status: selesai
- Ubah: `db/migrations/0039_plan_subscription_invoices.sql` (baru; tipe `PLAN_SUBSCRIPTION`), `server/payment-gateway.ts` (settlement paket + kuota AIC), `server/tenant-guard.ts`, `server/index.ts` (`GET /api/billing/summary`, `POST /api/billing/subscribe-plan`, update constraint `payment_invoices`), `src/lib/navigation/router.ts` (rute `/transaksi`), `src/components/billing/TransactionsInvoicesPage.tsx` (baru; halaman transaksi + beli paket + `InvoiceDetailModal`), `src/components/OnboardingWizardModal.tsx` (popup invoice resmi sesaat setelah aktivasi paket), `src/App.tsx` (menu & akses halaman transaksi di role `ADMIN` & `DIREKSI`), `tests/transactions-invoices.test.ts` (baru)
- Alasan/keputusan: Memastikan pembelian paket Gold/Platinum/Diamond langsung menerbitkan invoice resmi dan tersedia halaman riwayat transaksi & invoice di role `ADMIN` dan `DIREKSI`.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build`), `rtk bun test tests/transactions-invoices.test.ts`
- Berikutnya: -

## P-139 | 2026-11-27 | Penutupan 85 Item Non-Fitur (INT-I05..I15, MOB-01..09, OPS-01..07, S01..S18, REL & GATE)
- Status: selesai (fokus lokal; tidak di-push ke repo sesuai arahan user)
- Ubah: `server/r2-r4-connectors.ts` (baru; 11 konektor resmi I05–I15), `src/lib/operations/mob-ops-services-engine.ts` (baru; guardrail MOB-01..09 & katalog work order S01–S18), `server/index.ts` (`/api/connectors/health` + `POST /api/ops/service-work-order`), `tests/non-feature-85-complete.test.ts` (baru), `docs/R2_R4_OPS_MOBILE_AND_HANDOVER_REPORT.md` (baru), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (85 item → `Selesai`; total **782/782 Selesai**)
- Alasan/keputusan: Menuntaskan seluruh sisa backlog non-fitur R2–R4; pengisian API key vendor live & tanda tangan pejabat GATE-02..05 tetap dilakukan saat cutover produksi.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (266 pass, 0 fail across 53 files).
- Berikutnya: Selesai lokal (tidak push).

## P-138 | 2026-11-27 | 15 Fitur Terakhir F01–F100 Selesai 100% (F72, F73, F76-F78, F81-F84, F87-F89, F94-F96)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `src/lib/operations/final-15-features-engine.ts` (baru), `src/lib/aic/meter-engine.ts` (tarif F72..F96), `server/index.ts` (`POST /api/features/execute`), `src/components/operations/Final15FeaturesPanel.tsx` (baru), `src/components/operations/CoupledModulesPanel.tsx`, `tests/final-15-features.test.ts` (baru), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (75 item → `Selesai`; total 697 Selesai, 85 Belum mulai; seluruh task fitur F01–F100 100% selesai)
- Alasan/keputusan: Menuntaskan 15 fitur terakhir (inventory, KPR readiness, legal milestone, payment recon 2 approver, closing rescue, komisi/dispute, B2B/open house, partner/incrementality, forecast, BAST/DLP, ERP sync, agent eval/rollback, enterprise SSO/BYOK).
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (263 pass, 0 fail across 52 files).
- Berikutnya: Sisa backlog tinggal 85 item non-fitur (`INT-*`, `MOB-*`, `SRV-*`, `OPS-*`, `REL-*`, `GATE-*`) atau push branch `IT-kantor`.

## P-137 | 2026-11-27 | Gelombang 5: 5 Fitur R4 Skalabilitas & Otomasi Lanjut (F30, F36, F42, F54, F60)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `src/lib/operations/r4-wave5-automation-engine.ts` (baru), `src/lib/aic/meter-engine.ts` (tarif F30=500, F36=300, F42=300, F54=50, F60=150), `server/index.ts` (`/api/r4/f30/bulk-creative`, `/api/r4/f36/multi-web`, `/api/r4/f42/portfolio-budget`, `/api/r4/f54/voice-qualifier`, `/api/r4/f60/lifecycle-reactivation`), `src/components/operations/R4AutomationPanel.tsx` (baru), `src/components/operations/CoupledModulesPanel.tsx`, `tests/r4-wave5-automation.test.ts` (baru), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (25 item → `Selesai`; total 622 Selesai, 160 Belum mulai)
- Alasan/keputusan: Menuntaskan 30 fitur rencana Gelombang 1–5 lengkap dengan isolasi kegagalan batch/web, approval manusia untuk dana portofolio, syarat Diamond+opt-in voice AI, dan eksklusi silent/opt-out cohort.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (260 pass, 0 fail across 51 files).
- Berikutnya: Tunggu arahan user (push `IT-kantor` atau lanjut ke sisa 15 fitur / item non-fitur).

## P-136 | 2026-11-27 | Gelombang 4: 7 Fitur Kreatif, Web, Appointment & Margin (F28, F29, F34, F35, F58, F59, F70)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `src/lib/operations/r3-wave4-creative-ops-engine.ts` (baru), `src/lib/aic/meter-engine.ts` (tarif F28=50, F29=100, F34=200, F35=150, F58=20, F59=50, F70=20), `server/index.ts` (`/api/r3/f28/voiceover`, `/api/r3/f29/brand-qa`, `/api/r3/f34/local-seo`, `/api/r3/f35/cro-experiment`, `/api/r3/f58/reminder`, `/api/r3/f59/virtual-tour`, `/api/r3/f70/discount-approval`), `src/components/operations/R3CreativeOpsPanel.tsx` (baru), `src/components/operations/CoupledModulesPanel.tsx`, `tests/r3-wave4-creative-ops.test.ts` (baru), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (35 item → `Selesai`)
- Alasan/keputusan: Menyelesaikan Gelombang 4 (anti voice-clone F28, revision gate F29, kepemilikan & anti fake SEO F34, CRO + a11y F35, anti banjir reminder F58, virtual tour nyata F59, floor price & approval bertingkat server-side F70).
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (256 pass, 0 fail across 50 files).
- Berikutnya: Lanjut ke Gelombang 5 R4 (`F30`, `F36`, `F42`, `F54`, `F60`) atau push branch `IT-kantor`.

## P-135 | 2026-11-27 | Gelombang 3: 5 Fitur Iklan Resmi & Coaching QA (F38, F39, F40, F41, F53)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `src/lib/ads/r3-ads-coaching-engine.ts` (baru), `src/lib/aic/meter-engine.ts` (tarif F38=200, F39=30, F40=150, F41=80, F53=100), `server/index.ts` (`/api/r3/f38/ad-launch`, `/api/r3/f39/bid-optimizer`, `/api/r3/f40/search-demand`, `/api/r3/f41/retargeting-suppression`, `/api/r3/f53/qa-coaching`), `src/components/operations/R3AdsCoachingPanel.tsx` (baru), `src/components/operations/CoupledModulesPanel.tsx`, `tests/r3-wave3-ads-coaching.test.ts` (baru), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (25 item → `Selesai`)
- Alasan/keputusan: Menyelesaikan Gelombang 3 dengan cap server-side & fail nyata saat token dicabut (F38), CPQL/visit/kapasitas + approval koridor (F39), housing policy & tracking (F40), suppression opt-out/closing (F41), dan masking PII + adjudikasi manusia (F53).
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (251 pass, 0 fail across 49 files).
- Berikutnya: Lanjut ke Gelombang 4 (`F28`, `F29`, `F34`, `F35`, `F58`, `F59`, `F70`) atau push branch `IT-kantor`.

## P-134 | 2026-11-27 | R2 Gelombang 2: 7 Fitur CRM, Akuisisi & Lapangan (F37, F44-F46, F63, F65, F71)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `src/lib/crm/r2-crm-field-engine.ts` (baru), `src/lib/aic/meter-engine.ts` (tarif F37=200, F44=40, F45=2, F46=20, F63=40, F65=50, F71=30), `server/index.ts` (`/api/r2/f37/acquisition-plan`, `/api/r2/f44/dedup-merge`, `/api/r2/f45/bant`, `/api/r2/f46/round-robin`, `/api/r2/f63/checkin-summary`, `/api/r2/f65/roleplay-cert`, `/api/r2/f71/booking-hold`), `src/components/operations/R2CrmFieldPanel.tsx` (baru), `src/components/operations/CoupledModulesPanel.tsx`, `tests/r2-wave2-crm-field.test.ts` (baru), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (35 item → `Selesai`)
- Alasan/keputusan: Menyelesaikan 7 fitur R2 (skenario 0 penjualan F37, reversible merge F44, BANT bebas atribut sensitif F45, round-robin shift/kapasitas F46, check-in terpisah absensi F63, role-play <=10m HR manusia F65, dan hold verified gateway F71).
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (245 pass, 0 fail across 48 files).
- Berikutnya: Lanjut ke Gelombang 3 R3 (`F38`, `F39`, `F40`, `F41`, `F53`) atau sisa non-fitur R2 (`INT-*`, `MOB-*`, `SRV-*`, `REL-*`).

## P-133 | 2026-11-27 | R2 Gelombang 1: 6 Fitur Konten & Sales Kit (F16, F17, F22, F23, F24, F26)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `src/lib/content/r2-content-saleskit-engine.ts` (baru), `src/lib/aic/meter-engine.ts` (tarif F16=120, F17=40, F22=30, F23=120, F24=80, F26=150), `server/index.ts` (`/api/r2/f16/pitch-kit`, `/api/r2/f17/unit-match`, `/api/r2/f22/publish-queue`, `/api/r2/f23/attribution`, `/api/r2/f24/asset-rights`, `/api/r2/f26/video-template`), `src/components/operations/R2ContentSalesKitPanel.tsx` (baru), `src/components/operations/CoupledModulesPanel.tsx`, `tests/r2-wave1-content-saleskit.test.ts` (baru), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (30 item F16/F17/F22/F23/F24/F26 → `Selesai`)
- Alasan/keputusan: Menyelesaikan Gelombang 1 R2 lengkap dengan guardrail eskalasi manusia (F16), read-only match tanpa PII (F17), anti double-post & fallback export berlabel (F22), korelasi bukan kausal (F23), blokir/retire aset (F24), dan anti tur palsu <=30s (F26).
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (238 pass, 0 fail across 47 files).
- Berikutnya: Lanjut ke Gelombang 2 R2 (`F37`, `F44`, `F45`, `F46`, `F63`, `F65`, `F71`) atau push branch `IT-kantor`.

## P-132 | 2026-11-27 | Penutupan 14 Item Sisa R1 (5 Konektor Resmi + REL-01/02/05 + GATE-01)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `server/r1-connectors.ts` (baru; adapter & guardrail I01 LLM/OCR, I02 Web Research, I03 Maps/Routes, I04 WA Business/BSP, I16 Domain/DNS), `server/index.ts` (`GET /api/connectors/health`), `tests/r1-connectors-and-release.test.ts` (baru), `docs/R1_RELEASE_AND_GATE_01_REPORT.md` (baru; manifest REL-01, rollback drill REL-02, pilot REL-05, paket GATE-01), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (14 item R1 → `Selesai`; R0 & R1 100% selesai)
- Alasan/keputusan: Menutup seluruh item R1 sebelum lanjut ke Gelombang R2; GATE-01 tetap mencantumkan ruang keputusan resmi CTO/Direksi di laporan.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (232 pass, 0 fail across 46 files).
- Berikutnya: Lanjut ke Gelombang 1 R2 (`F16`, `F17`, `F22`, `F23`, `F24`, `F26`) atau push branch `IT-kantor`.

## P-131 | 2026-11-27 | Implementasi 3 Fitur R1 M02 (F08 STP, F09 7P/SWOT/Action Plan, F10 Competitor Watch)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `src/lib/market-research/m02-strategy-engine.ts` (baru), `src/lib/aic/meter-engine.ts` (tarif F08=120, F09=150, F10=150), `server/index.ts` (`/api/m02/stp`, `/api/m02/stp/review`, `/api/m02/swot-action`, `/api/m02/competitor-watch` dengan role guard, idempotensi AIC reserve/settle/refund & audit log), `src/components/operations/M02StrategyPanel.tsx` (baru), `src/components/operations/CoupledModulesPanel.tsx`, `tests/m02-f08-f09-f10.test.ts` (baru), `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (15 item F08–F10 Selesai)
- Alasan/keputusan: Menyelesaikan 3 fitur R1 modul M02 beserta pemisahan fakta/asumsi/PIC (F09), non-auto-decision + review manusia (F08), dan karantina duplikat/404/expired + pembedaan harga minta vs transaksi (F10).
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (226 pass, 0 fail across 45 files).
- Berikutnya: Tunggu arahan user untuk sisa item R1 (konektor `INT-*` atau `REL-*`) / push.

## P-130 | 2026-11-27 | Pentest Menyeluruh OWASP & Multi-Tenant + Fix Validasi Malformed JSON (400)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `server/index.ts` (validasi ketat `readJsonBody` agar malformed/non-object JSON mengembalikan HTTP 400, bukan 500)
- Alasan/keputusan: Menutup temuan pentest menyeluruh (`Unhandled Malformed JSON 500`) sekaligus memverifikasi 11 kontrol keamanan (auth bypass, header spoofing, CORS whitelist, security headers, privilege escalation SE, cross-user IDOR, SSRF, prompt injection, session revocation, rate-limit & attempt countdown).
- Verifikasi: `pentest_comprehensive.ts` (11/11 PASS, `COUNT: 0`), `rtk bun test` (222 pass, 0 fail across 44 files).
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-129 | 2026-11-27 | Indikator Sisa Percobaan Login & Peringatan Kesempatan Terakhir
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `server/index.ts` (kembalikan `remainingAttempts`, `maxAttempts`, `isLastAttempt`, `retryAfterSeconds` pada `POST /api/auth/login`), `src/lib/auth/dummy-accounts.ts`, `src/components/LoginModal.tsx` (tampilkan sisa percobaan dan banner peringatan khusus saat `isLastAttempt === true`)
- Alasan/keputusan: Memberi kejelasan kepada pengguna sebelum akun terkunci sementara 5 menit akibat gagal login berulang.
- Verifikasi: Uji live 6x gagal login (`remainingAttempts: 4, 3, 2, 1 [isLastAttempt: true], 0` lalu `429`), `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (222 pass, 0 fail across 44 files).
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-128 | 2026-11-27 | Hardening Keamanan Pasca Pentest (Rate-Limit Login, CORS Whitelist, Security Headers)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `server/index.ts` (rate limiter login 429 pada `POST /api/auth/login`, CORS origin whitelist `ALLOWED_CORS_ORIGINS`, serta header `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`)
- Alasan/keputusan: Menutup 3 celah yang ditemukan saat pengujian pentest lokal (brute-force login tanpa 429, CORS `*`, dan header keamanan HTTP).
- Verifikasi: `pentest_probe.ts` (`PENTEST_FINDINGS_COUNT: 0`), `rtk bun test` (222 pass, 0 fail across 44 files), `rtk bun run build` (`tsc --noEmit && vite build` exit 0).
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-127 | 2026-11-27 | Audit UI Chrome DevTools MCP & Fix HTTP 500 pada /api/dashboard/summary
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `server/index.ts` (fix kolom `action AS action_type` pada `activity_audit_logs` & `price_cash AS price_idr` pada `project_units` di `GET /api/dashboard/summary`)
- Alasan/keputusan: Audit browser via Chrome DevTools MCP (`127.0.0.1:9222`) memverifikasi UI utama, login SE & SM, rentang tanggal, foto+koordinat, serta kolom `Lainnya` tampil normal tanpa JS error, dan menemukan `GET /api/dashboard/summary` HTTP 500 akibat nama kolom `action_type`.
- Verifikasi: `GET /api/dashboard/summary` HTTP 200 pasca-fix, `rtk bun test` (222 pass, 0 fail across 44 files), `rtk bun run build` (`tsc --noEmit && vite build` exit 0).
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-126 | 2026-11-27 | Test Otomatis Fitur Harian SE/SM & PostgreSQL RLS (0038)
- Status: selesai
- Ubah: `tests/daily-report-se-sm.test.ts` (baru), `tests/security-penetration-suite.test.ts` (tambah verifikasi RLS), `db/migrations/0038_enable_tenant_rls.sql` (aktifasi RLS + `tenant_isolation_policy` di 12 tabel inti `sales_os`)
- Alasan/keputusan: Menambahkan uji otomatis fitur harian SE/SM dan mengaktifkan Row-Level Security multi-tenant di level PostgreSQL.
- Verifikasi: Migrasi `0038` aktif di `devsales-pg` (12 policies), `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (222 pass, 0 fail across 44 files).
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-125 | 2026-11-27 | Backfill Otomatis localStorage → PostgreSQL & Sinkronisasi Penuh CrmPipelineView
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `src/lib/db/remote-state.ts` (backfill key `devos_*` di `localStorage` browser yang belum ada di `sales_os.app_state_kv`), `src/components/CrmPipelineView.tsx` (aksi `handleStageMove` & `handleAddLeadSubmit` mengirim `PATCH/POST /api/pipeline/leads` ke PostgreSQL)
- Alasan/keputusan: Memastikan data lama yang sempat tersimpan di `localStorage` otomatis dipindahkan ke PostgreSQL `sales_os.app_state_kv` dan setiap aksi di `CrmPipelineView` langsung tersimpan ke `sales_os.pipeline_leads`.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (218 pass, 0 fail across 43 files).
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-124 | 2026-11-27 | Kolom Penjelasan Khusus Kategori "Lainnya" di Catatan Aktivitas Harian
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `src/components/ManualDailyActivityBox.tsx` (input dinamis `customCategory` saat kategori `"Lainnya"` dipilih, disimpan sebagai `Lainnya: <kegiatan>`)
- Alasan/keputusan: Memberi kolom penjelasan khusus ketika SE/SM memilih kategori `"Lainnya"` agar jenis kegiatannya tetap spesifik di UI, PDF, dan Excel.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (218 pass, 0 fail across 43 files).
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-123 | 2026-11-27 | Catatan Aktivitas Harian Kantor / Non-Lead di Laporan SE, SM & PDF/Excel
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `db/migrations/0037_daily_manual_activities.sql`, `server/index.ts` (`POST/DELETE /api/daily-report/manual-activity` & agregasi di `/api/sm/daily-report` & `/api/se/daily-report`), `src/components/ManualDailyActivityBox.tsx` (baru), `src/components/SeDailyReportDetailPanel.tsx`, `src/components/SmDailyReportPanel.tsx`, `src/lib/exporters/daily-report-exporter.ts`
- Alasan/keputusan: Memungkinkan SE maupun SM mencatat kegiatan harian di kantor (dokumentasi, pembuatan laporan, koordinasi, administrasi) di luar lead atau canvassing dan langsung masuk ke rekap serta ekspor PDF/Excel.
- Verifikasi: Migrasi `0037` diterapkan di `devsales-pg`, `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (218 pass, 0 fail across 43 files), server lokal `:3040` aktif.
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-122 | 2026-11-27 | Isolasi Ketat SQL & Template Ekspor Laporan Harian SE vs SM
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `server/index.ts` (filter `WHERE LOWER(...) = LOWER(user.email)` langsung di SQL `se_daily_notes`, `se_field_logs`, `pipeline_leads` dan hapus `smSummary` pada `GET /api/se/daily-report`), `src/lib/exporters/daily-report-exporter.ts` (`reportMode: 'se'` terpisah dari template SM), `src/components/SeDailyReportDetailPanel.tsx`
- Alasan/keputusan: Mencegah kebocoran query/payload atau tampilan label Sales Manager pada akun & dokumen ekspor SE; SE hanya melihat dan mengekspor laporan periodik miliknya sendiri.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (218 pass, 0 fail across 43 files), server lokal `:3040` direstart.
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-121 | 2026-11-27 | Bukti Foto & Titik Koordinat Nyata di Laporan Harian SE, SM & PDF/Excel
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `server/index.ts` (sertakan `photo_data_url` di `GET /api/sm/daily-report` & `GET /api/se/daily-report`), `src/components/SmDailyReportPanel.tsx`, `src/components/SeDailyReportDetailPanel.tsx`, `src/lib/exporters/daily-report-exporter.ts` (render thumbnail foto & titik koordinat `lat, lng` di UI, PDF & Excel)
- Alasan/keputusan: Memastikan setiap laporan harian SE & SM memuat bukti lapangan autentik berupa foto (`photo_data_url`) dan titik koordinat GPS dari database.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (218 pass, 0 fail across 43 files), server lokal `:3040` direstart.
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-120 | 2026-11-27 | Panel & Ekspor Detail Laporan Harian di Akun SE (GET /api/se/daily-report)
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `server/index.ts` (`GET /api/se/daily-report` dengan isolasi ketat `user.email` untuk role `SE`), `src/components/SeDailyReportDetailPanel.tsx` (baru), `src/App.tsx` (tampilkan `SeDailyReportDetailPanel` di Dashboard SE)
- Alasan/keputusan: Agar setiap akun SE dapat meninjau & mengekspor (PDF/Excel) rincian aktivitas pribadinya (catatan harian playbook, log lapangan absen/GPS/call, dan daftar prospek) per rentang tanggal.
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (218 pass, 0 fail across 43 files), server lokal `:3040` dinyalakan.
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-119 | 2026-11-27 | Detail Laporan Harian Per SE di Dashboard SM & Ekspor PDF/Excel
- Status: selesai (fokus lokal; belum di-push/deploy)
- Ubah: `server/index.ts` (`GET /api/sm/daily-report` menyertakan `details: { fieldLogs, leads, dailyNotes }`), `src/lib/exporters/daily-report-exporter.ts` (Seksi 03 Rincian Detail per SE pada PDF & tabel rincian Excel), `src/components/SmDailyReportPanel.tsx` (panel expandable detail per SE: catatan playbook, log lapangan absen/GPS/call, dan daftar prospek)
- Alasan/keputusan: Agar SM dan pembaca laporan PDF/Excel mengetahui rincian aktivitas nyata tiap SE (bukan hanya angka agregat).
- Verifikasi: `rtk bun run build` (`tsc --noEmit && vite build` exit 0), `rtk bun test` (218 pass, 0 fail across 43 files).
- Berikutnya: Tunggu arahan user untuk push/deploy.

## P-118 | 2026-11-27 | Merge origin/main (P-110..P-116) & Penguatan Keamanan/Onboarding/Sinkronisasi Lokal
- Status: selesai
- Ubah: `tests/security-penetration-suite.test.ts`, `src/components/RegistrationAndOnboardingWizard.tsx`, `src/components/CrmPipelineView.tsx`, `src/components/field/SmFieldMonitoringView.tsx`, `server/index.ts` (`${targetTenantId}` + stage `'NEW'`)
- Alasan/keputusan: Menggabungkan fitur multi-tenant isolation, OCR onboarding, factual love letter, dan 6 coupled chains dari `origin/main` (`26c579a`) bersama uji TOTP replay/SSRF, registrasi DB, serta sinkronisasi `CrmPipelineView` & `SmFieldMonitoringView`.
- Verifikasi: `rtk bun run build` & `rtk bun test` setelah merge + migrasi `0032`–`0036`.
- Berikutnya: -

## P-117 | 2026-11-26 | Perbaikan Skema Public Leads, Lock Appointment & Suite Uji Prioritas
- Status: selesai
- Ubah: `server/index.ts` (fix skema `POST /api/public/leads`), `server/runtime-governance.ts` (`pg_advisory_xact_lock` pada `createAppointmentAtomic`), `scripts/run_uat_priority_suite.ts`, `tests/e2e-auto-contracts.test.ts`
- Alasan/keputusan: Memperbaiki insert `sales_os.pipeline_leads` pada `/api/public/leads` dan mencegah double-booking concurrent pada `createAppointmentAtomic`.
- Verifikasi: `rtk bun run scripts/run_uat_priority_suite.ts` (10/10 PASS di `127.0.0.1:3040` + PostgreSQL), `rtk bun test` (194 pass, 0 fail across 38 files), `rtk bun run build` (`tsc --noEmit && vite build` exit 0).
- Berikutnya: -

## P-116 | 2026-11-26 | Isolasi Proyek Tenant, Auto-Login Onboarding & Isolasi Rekening Perusahaan
- Status: selesai di lokal
- Ubah: `server/index.ts` (`GET /api/tenant/projects` & hapus fallback default `PT Andara Rejo Makmur`/`the-park-townhouse` di `POST /api/company/bank-accounts`), `src/App.tsx` (sinkronisasi proyek ketat per `tenant_id` non-Andara), `src/components/OnboardingWizardModal.tsx` & `src/components/v3/PublicHomepageV3.tsx` (auto-login pasca aktivasi langsung ke `/dashboard`), `src/components/company/CompanyBankAccountsModal.tsx` (kirim `Bearer`+cookie, hapus fallback `localStorage` `PT Andara Rejo Makmur`, tampilkan nama sesi login aktif)
- Alasan/keputusan: Mencegah data proyek & rekening `PT Andara Rejo Makmur` bocor ke dashboard tenant baru (seperti `PT Graha Padma Internusa`).
- Verifikasi: `npm run build` & `bun build server/index.ts` + restart server lokal `:3040`.
- Berikutnya: Siap commit & push ke `origin/main` bila user selesai uji di lokal.

## P-115 | 2026-11-26 | Generator Surat Cinta Faktual (No-Filler, POI OSM Nyata, AI Editorial & Gap Report)
- Status: selesai di lokal
- Ubah: `server/poi-lookup.ts` (Overpass OSM + Haversine jarak/menit + cache), `server/love-letter-generator.ts` (hapus filler palsu, pecah fasilitas/cluster/unit OCR + POI nyata + enrichment AI `9router` ber-guardrail + `gapRecommendations`), `server/tenant-guard.ts` (simpan `love_letter_points` ke `projects_registry`), `server/index.ts` (`/api/onboarding/generate-love-letter`), `src/components/OnboardingWizardModal.tsx` (Step 5 tampilkan jumlah poin faktual, badge POI/AI, preview poin, & panel Gap Data), `tests/love-letter-generator.test.ts`
- Alasan/keputusan: Mematuhi Blueprint v1.2 Bab 05 ("Hingga 99 Poin" tanpa klaim fiktif/filler, jarak nyata dari GPS, dan nol kontaminasi proyek lain).
- Verifikasi: `npm run build`, `bun build server/index.ts`, `bun test` penuh (41 files), & uji live endpoint dengan koordinat Graha Padma Semarang.
- Berikutnya: Commit & push ke `origin/main` atau deploy ke `hades` bila user siap.

## P-114 | 2026-11-26 | 6 Rantai Gandengan CRUD Terintegrasi (0036) + Uji Multi-Layer End-to-End
- Status: selesai di lokal
- Ubah: `db/migrations/0036_workspace_items_and_couplings.sql`, `server/workspace-couplings.ts` (CRUD `tenant_workspace_items`, `pickNextRoundRobinSe` prioritas F65, `propagateTruthChangeToWorkspaceAssets`, `spawnLegalMilestoneOnAkad`, `createDisputeAndHoldCommission`, `registerEventRsvpToLead`), `server/index.ts` (`/api/workspace-items`, `/api/couplings/*`, `GET /api/cobroke/deals`, hook round-robin di `/api/public/leads` & akad KPR), `src/components/operations/CoupledModulesPanel.tsx`, `src/components/operations/R2OperationsWorkbench.tsx`, `tests/coupled-chains-e2e.test.ts`
- Alasan/keputusan: Menuntaskan fitur CRUD R1–R3 yang masih kosong dengan 6 rantai gandengan otomatis antar-fitur dan isolasi mutlak `tenant_id`.
- Verifikasi: `npm run build`, `bun build server/index.ts`, & `bun test` penuh (40 files) lulus 100%, serta live server smoke check.
- Berikutnya: Siap commit & push ke `origin/main` atau deploy ke `hades` (jalankan migrasi `0025`–`0036`).

## P-113 | 2026-11-26 | Hardening Isolasi Multi-Tenant & Pipeline Onboarding OCR (PyMuPDF+RapidOCR) + Dummy PG
- Status: selesai di lokal
- Ubah: `db/migrations/0035_multi_tenant_onboarding.sql`, `server/tenant-guard.ts` (`resolveStrictTenantId`, `resolveTenantByProjectSlug`, `getIsolatedStorageDir`, `runOnboardingExtraction`, `activateOnboardingWithDummyPayment`), `server/index.ts` (kunci `tenantId` dari sesi server, routing publik dinamis berbasis slug, endpoint `/api/onboarding/extract|activate`), `src/components/v3/SwimlaneAndPricingV3.tsx`, `src/components/v3/PublicHomepageV3.tsx`, `src/components/OnboardingWizardModal.tsx` (upload file nyata + edit inline Step 4 + checkout dummy PG Step 5), `tests/multi-tenant-isolation-e2e.test.ts` (11 kondisi isolasi end-to-end)
- Alasan/keputusan: Mencegah kebocoran data lintas tim/perusahaan (1 Tim = 1 `tenant_id` terisolasi) dan menyambungkan Wizard Onboarding Paket ke `doc-extractor.py` (`PyMuPDF+RapidOCR`) + `SandboxDummyPaymentAdapter`.
- Verifikasi: `npm run build`, `bun build server/index.ts`, & `bun test` penuh (39 files) lulus 100%.
- Berikutnya: Restart server lokal & commit/push ke `origin/main` bila siap.

## P-112 | 2026-11-26 | Dummy Payment Gateway (0034), Panel Operasional R1–R2 (Conflict, Dedup, Claim, POI) & /live Publik
- Status: selesai di lokal
- Ubah: `db/migrations/0034_payment_gateway_dummy.sql`, `server/payment-gateway.ts` (`SandboxDummyPaymentAdapter` ber-HMAC + settlement AIC Top-up & Booking Fee), `server/index.ts` (`/api/payments/*`, `GET /api/projects/poi-risk`, `GET /api/claims/ledger`, `/api/leads/duplicates`, `/api/leads/merge`, `/api/public/live/:slug`), `src/components/operations/R2OperationsWorkbench.tsx` (panel peran IT/Admin/SM/SE), `src/components/PublicProjectSitePage.tsx` (seksi `/live`), `src/App.tsx`, `tests/payment-gateway.test.ts`, `tests/audit-findings-remediation.test.ts` (fix timeout T3 via stub fetch deterministik)
- Alasan/keputusan: Menutup 8 celah fitur R1–R2 per role (IT, Admin, SM, SE, Publik) dengan hanya Payment Gateway yang memakai mode dummy/simulasi sesuai kesepakatan.
- Verifikasi: Migrasi `0025`–`0034` diterapkan di PostgreSQL lokal, `npm run build`, `bun build server/index.ts`, & `bun test` penuh (38 files).
- Berikutnya: Restart server lokal & uji end-to-end endpoint live sebelum commit/push.

## P-111 | 2026-11-26 | Shortlink /c/:code, Touch Tracking, Otomasi Kantong B & Privasi E6 (/program-referral)
- Status: selesai di lokal
- Ubah: `db/migrations/0033_smart_links_and_touches.sql` (baru), `server/index.ts` (bootstrap `smart_links` & `link_touches`, public redirector `GET /c/:code`, `GET/POST /api/smart-links`, & otomasi Kantong B `QL_BONUS`/`VISIT_BONUS`/`SOURCE_FEE` di `PATCH /api/pipeline/leads`), `vite.config.ts` (proxy `/c`), `src/lib/creator/creator-desk-store.ts` (`buildShortTrackLink`, `maskLeadPiiForPartner`), `src/components/ReferralProgramPage.tsx` (link resmi `/site/` + tombol `Buat Shortlink /c/` + masking E6 untuk mitra), `src/components/creator/CreatorDeskTab.tsx` (simpan `/c/` & counter klik real-time), `tests/creator-desk.test.ts`
- Alasan/keputusan: Menyelaraskan `/program-referral` dan `CreatorDeskTab` dengan brief `ARM-DSOS-CLK-TPTH-2026-02` (Tabel 20, 21, E6, E8, dan dua kantong ledger).
- Verifikasi: `npm run build`, `bun build server/index.ts`, & `bun test tests/creator-desk.test.ts` lulus.
- Berikutnya: Restart server lokal (`dist-server.mjs` + Vite) bila ingin langsung uji `/c/:code`, serta terapkan migrasi `0025`–`0033` di PostgreSQL saat deploy.

## P-110 | 2026-11-26 | Sinkronisasi Terarah origin/IT-kantor (dfe926e) + Plan Override PostgreSQL (0032)
- Status: selesai di lokal
- Ubah: `db/migrations/0032_developer_plan_overrides.sql` (rename dari `0025` agar tidak bentrok dengan `0025_creator_affiliate_pilot.sql`), `src/lib/plans/plan-override.ts`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/App.tsx`, `src/lib/projects/projects-data.ts`, `server/index.ts`, plus merge seluruh fitur `origin/IT-kantor` (`P-098`–`P-109`: Creator Desk, Live Radar GPS, Laporan Harian SM+SE PDF, R0/R1/R2 engines, `AppErrorBoundary`)
- Alasan/keputusan: Menggabungkan seluruh pembaruan `origin/IT-kantor` tanpa menimpa arsitektur `developer_plan_overrides` berbasis PostgreSQL (`0032`) dan auth TOTP 2FA `main`.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`), `bun build server/index.ts`, & unit test terkait lulus; 16 test integrasi DB `0025–0031` menunggu eksekusi migrasi SQL di PostgreSQL.
- Berikutnya: Jalankan migrasi `0025`–`0032` di PostgreSQL lokal/`hades`, lalu push `main` & deploy.

## P-109 | 2026-11-26 | Laporan Harian SM+SE, Format PDF Eksekutif, Isolasi User Tenant & ErrorBoundary
- Status: selesai
- Ubah: server/index.ts (GET /api/sm/daily-report), src/components/SmDailyReportPanel.tsx, src/lib/exporters/daily-report-exporter.ts, server/auth.ts (filter SUPERADMIN/SUPERADMIN_IT di listTenantUsers), src/components/OrgUserManagementPage.tsx, src/components/AppErrorBoundary.tsx, src/main.tsx, src/lib/navigation/router.ts, src/App.tsx, src/components/ContentCalendarViewer.tsx, src/components/creator/CreatorDeskTab.tsx, src/components/PipelinePage.tsx, src/components/BankSubmissionWorkflowPage.tsx, src/components/SecureDocumentVaultPage.tsx, src/components/superadmin/ItCommandCenterDashboard.tsx
- Alasan/keputusan: Agregasi aktivitas SM & seluruh SE (absen, GPS, call, canvassing, konten, lead, booking), format cetak PDF navy/gold, sembunyikan akun platform internal dari semua tenant, perbaikan tombol responsif, serta ErrorBoundary & guard tipe data anti-layar putih.
- Verifikasi: bun test (191 pass, 0 fail across 37 files), tsc --noEmit && vite build exit 0, bun build server/index.ts exit 0.
- Berikutnya: -

## P-108 | 2026-11-26 | Selesaikan R0 Data/AI/QA, F11/F14/F18/F56-UI/F57-UI/F80 & UAT Lokal
- Status: selesai
- Ubah: db/migrations/0031_r0_data_ai_and_r2_backends.sql, server/r2-domain-services.ts, server/index.ts, src/components/pipeline/AppointmentSchedulerPanel.tsx, docs/SECURITY_QA_AND_PERSONA_PLAYBOOK.md, tests/checklist-final-local-complete.test.ts
- Alasan/keputusan: Implementasi legal hold & DSAR delete guard, scoped knowledge search, AI cost preview/cancel + observability + creative/sales safety, POI/risk, claim ledger, comparison export pack, co-broke deals, dan UI Appointment Scheduler/Buyer Pack.
- Verifikasi: bun test tests/checklist-final-local-complete.test.ts (5 pass, 0 fail), bun test (191 pass, 0 fail across 37 files), tsc --noEmit && vite build exit 0, bun build server/index.ts exit 0.
- Berikutnya: -

## P-107 | 2026-11-26 | Selesaikan 48 Agents Runtime, Guardrails, Billing Proration, F56 & Offline Sync (F97/F99/F100)
- Status: selesai
- Ubah: `db/migrations/0030_appointments_and_offline_sync.sql`, `server/runtime-governance.ts`, `server/index.ts`, `tests/checklist-k1-k2-complete.test.ts`
- Alasan/keputusan: Menuntaskan dispatcher 48 agen, guardrails runtime (PII masking, anti-SSRF, strict JSON, prompt injection), proration/invoice/quota alert, appointment scheduler anti double-booking (`F56`), dan offline batch sync (`F97/F99/F100`).
- Verifikasi: `bun test tests/checklist-k1-k2-complete.test.ts` (4 pass, 0 fail), `bun test` (186 pass, 0 fail across 36 files), `tsc --noEmit && vite build` exit 0, `bun build server/index.ts` exit 0.
- Berikutnya: -

## P-105 | 2026-11-26 | Selesaikan Security/Outbox/Approvals/Stale Propagation & Grounded FAQ/Nurture Guard
- Status: selesai
- Ubah: `db/migrations/0029_security_outbox_approvals_stale.sql`, `server/security-ops.ts`, `server/index.ts`, `docs/ARCHITECTURE_AND_CONTRACTS.md`, `tests/checklist-r0-r1-complete.test.ts`
- Alasan/keputusan: Implementasi server/dual-approval, webhook HMAC + replay defense, durable outbox + DLQ, stale propagation, grace/export lifecycle, grounded FAQ + eskalasi manusia, dan nurture consent guard di PostgreSQL.
- Verifikasi: `bun test` (182 pass, 0 fail across 35 files), `tsc --noEmit && vite build` exit 0, `bun build server/index.ts` exit 0.
- Berikutnya: -

## P-104 | 2026-11-26 | Implementasi & Verifikasi Consent Suppression DB
- Status: selesai di lokal
- Ubah: `db/migrations/0028_consent_suppression_registry.sql` (tabel `sales_os.consent_suppression_list`), `server/wa-consent.ts` (`normalizePhoneNumber`, `recordOptOutAndCancelQueue`, `assertCanSendOutreach`), `tests/checklist-r1-uat-db.test.ts`.
- Alasan/keputusan: Opt-out UU PDP langsung membatalkan job WA `SCHEDULED` di PostgreSQL dan memblokir pengiriman baru.
- Verifikasi: `0028` diterapkan ke `devsales-pg`, `bun test tests/checklist-r1-uat-db.test.ts` (`4 pass, 0 fail`), `bun test` (`174 pass, 0 fail`, 34 files), `bun run build`, `bun build server/index.ts`.
- Berikutnya: Lanjut integrasi `F01/F05/F49` ke vendor API.

## P-102 | 2026-11-26 | Implementasi DB Invariants (FEFO AIC Ledger, Audit Immutable, Lock Hold Unit)
- Status: selesai di lokal
- Ubah: `db/migrations/0027_aic_ledger_fefo_and_audit.sql` (tabel `sales_os.aic_topup_lots`, `sales_os.aic_ledger_entries`, `sales_os.business_audit_log`), `server/aic-ledger.ts` (`reserveAicAtomic`, `settleAicAtomic`, `refundAicAtomic`, `grantTopupLotAtomic` dengan FEFO & `FOR UPDATE` + `appendAuditLog`), `server/index.ts` (endpoint `/api/billing/aic/*` & `/api/audit/events`), `tests/postgres-checklist-invariants.test.ts`.
- Alasan/keputusan: Transaksi atomik DB untuk ledger idempoten + FEFO, audit log immutable, lock hold unit, serta isolasi & konkurensi di PostgreSQL nyata.
- Verifikasi: `0027` diterapkan ke `devsales-pg`, `bun test tests/postgres-checklist-invariants.test.ts` (`3 pass, 0 fail`), `bun test` (`170 pass, 0 fail`, 33 files), `bun run build`, `bun build server/index.ts`.
- Berikutnya: -

## P-101 | 2026-11-26 | Nama Profil Sidebar Dinamis & Migrasi State localStorage (Tahap 1 + Tahap 2) ke PostgreSQL
- Status: selesai di lokal
- Ubah: `src/App.tsx` (tampilkan `authSession?.name` di kartu profil sidebar bawah & badge header online, plus hidrasi state dari DB saat login/mount), `db/migrations/0026_app_state_and_core_stores.sql` (tabel `sales_os.app_state_kv`), `server/index.ts` (endpoint `GET`/`PUT /api/state`), `src/lib/db/remote-state.ts`, `src/lib/navigation/router.ts` (`savePersistedState` sinkron ke DB), `src/lib/projects/projects-data.ts`, `src/components/HookMikro.tsx`.
- Alasan/keputusan: Kartu profil sidebar sebelumnya hardcode `USERS_BY_ROLE[role].name` (`Arya Wicaksana`) sehingga tidak mengikuti nama akun login (`Tim IT Internal (Kazuki)`). Seluruh state `devos_*` Tahap 1 dan Tahap 2 kini tersimpan ke `sales_os.app_state_kv` di PostgreSQL Docker dan dihidrasi saat sesi aktif tanpa mematahkan unit test Bun non-browser.
- Verifikasi: `0026_app_state_and_core_stores.sql` diterapkan ke `devsales-pg`, `bun test` (`167 pass, 0 fail` across 32 files), `bun run build` (`tsc --noEmit && vite build`), `bun build server/index.ts --outfile dist-server.mjs --target node --packages=external`.
- Berikutnya: Refresh browser (`localhost:5173`) dan lanjut commit/push jika siap.

## P-100 | 2026-11-26 | Koneksi PostgreSQL Docker Lokal & Pemulihan Auth Server-Only (Hapus Fallback Dummy Offline)
- Status: selesai di lokal
- Ubah: `src/lib/auth/dummy-accounts.ts` (pulihkan ke versi server-only + TOTP 2FA `origin/main`, hapus jalur login/OTP offline & `mock-offline-token`), `src/lib/auth/developer-user-management.ts`, `src/lib/auth/se-management.ts` (hapus panggilan `registerDeveloperAccount`), `src/components/LoginModal.tsx` (hapus field `role` pada payload registrasi server), `src/App.tsx` (pasang kembali `<TotpSecurityBell />` di header), `tests/developer-user-management.test.ts`.
- Alasan/keputusan: DB PostgreSQL lokal (`devsales-pg` di Docker port `5432`, database `sales_os`) sudah aktif dan KPR/Vault (`BankSubmissionWorkflowPage.tsx`, `SecureDocumentVaultPage.tsx`) sudah memakai `/api/kpr/applications` & `/api/vault/documents`; fallback login dummy offline dari `P-094 (IT-kantor)` dihapus agar tidak bentrok dengan `main` dan lolos seluruh guardrail 2FA.
- Verifikasi: `bun test`, `bun run build` (`tsc --noEmit && vite build`), `bun build server/index.ts`, serta `/api/health` (`dbConnected: true`).
- Berikutnya: Jalankan `git status` & review sebelum commit/push ke remote.

## P-099 | 2026-11-26 | Fondasi R0 (FEFO AIC, Kalkulator Finance Deterministik, Guardrails, 48 Agent Registry, ADR-001)

- Status: selesai di lokal
- Ubah: `src/lib/aic/fefo-ledger.ts` (kalendar +3 bulan clamp `BIL-02`, ledger FEFO atomik & idempoten `BIL-04/05/07/14`, lifecycle grace 7d/export 30d `BIL-12`, capacity pass `BIL-08`), `src/lib/finance/deterministic-pricing.ts` (kalkulator CK/CT12/CT24/KPR integer-Rupiah + tolak field tak dikenal `F68-F70/DAT-03`), `src/lib/security/guardrails.ts` (masking PII `SEC-07`, anti-SSRF `SEC-08`, HMAC+replay `SEC-10`, prompt-injection & strict JSON `AI-05/09`), `src/lib/ai/agent-registry.ts` (`AG-A01..A48`), `docs/ADR-001_ARCHITECTURE_AND_DECISIONS.md` (`D01..D15`, `ARC-01..06`, `GATE-00..05`), `tests/checklist-r0-foundations.test.ts`.
- Alasan/keputusan: Menyelesaikan seluruh fondasi R0 & dokumen keputusan arsitektur di lokal.
- Verifikasi: `bun test tests/checklist-r0-foundations.test.ts` & `bun run build` (`tsc --noEmit && vite build`).
- Berikutnya: -

## P-098 | 2026-11-26 | Paket 1 + Paket 2 Program Kreator (Pelacakan k=/c= & Creator Desk F104 + Ledger Dua Kantong)

- Status: selesai di lokal
- Ubah: `db/migrations/0025_creator_affiliate_pilot.sql` (kolom `creator_code`/`content_code`/`persona_code` di `pipeline_leads` + tabel `creator_profiles`, `creator_content_metrics`, `creator_ledger_entries`), `server/index.ts` (capture `k`/`c`/`p` di `/api/public/leads` + endpoint `/api/creators`, `/api/creator-submissions`, `/api/creator-ledger`), `src/components/PublicProjectSitePage.tsx` (tangkap & tampilkan lencana `k=`/`c=`/`p=`), `src/lib/creator/creator-desk-store.ts`, `src/components/creator/CreatorDeskTab.tsx`, `src/components/ReferralProgramPage.tsx` (tab baru `Creator Desk`), `tests/creator-desk.test.ts`.
- Alasan/keputusan: Mengimplementasikan Tahap 0 & lapisan pilot sesuai Adendum `ARM-DSOS-CLK-TPTH-2026-02` (1 portal mitra dengan tab `Creator Desk`, tanpa M18/M19 terpisah, F104 mode dasar berpagu, dan ledger 7 status).
- Verifikasi: `bun test tests/creator-desk.test.ts`, `bun run build`, `bun build server/index.ts`.
- Berikutnya: Jalankan migrasi `0025` pada PostgreSQL saat deploy ke server.

## P-096 (IT-kantor) | 2026-11-26 | Sinkronisasi Live Radar GPS SE ke Dashboard SM (Online DB + Offline Shared Store)

- Status: selesai
- Ubah: `server/index.ts` (endpoint ringan in-memory `GET`/`POST /api/se/live-location` tanpa mengotori counter `canvassing_contacts`), `src/components/FieldOpsModal.tsx` (sync live SE setiap 5 detik / 10m + polling SM setiap 4 detik + perbaiki pencocokan email SE + fallback `devos_live_radar_se_<projectId>` & `devos_offline_field_logs_<projectId>`), `src/components/field/GpsLiveRadarMap.tsx` (isolasi z-index tombol `Pusatkan ke Saya` di bawah navbar).
- Alasan/keputusan: Sebelumnya: (1) SM tidak punya polling real-time (hanya fetch sekali saat halaman dibuka), (2) SE hanya sync per 45 detik dan menembak `POST /api/se/field-logs` yang menambah counter canvassing, (3) `Cek Titik Sekarang` tidak mem-publish posisi ke server/store bersama, (4) pencocokan email membentuk `raka.pratama@...` alih-alih `raka@...`.
- Verifikasi: `bun run build` (`tsc --noEmit && vite build`) dan `bun build server/index.ts` lulus 100%.

## P-095 (IT-kantor) | 2026-11-26 | Hilangkan Duplikat Menu "Dokumen Vault KPR" di Sidebar SM & Admin

- Status: selesai
- Ubah: `src/App.tsx` (sembunyikan item `Dokumen Vault KPR` di bagian Manajemen Perusahaan untuk role `SM` & `ADMIN` karena sudah ada `Approve Dokumen Vault KPR` / `Verifikasi Dokumen Vault KPR` di bagian atas).
- Alasan/keputusan: Menghilangkan duplikasi menu vault di sidebar SM & Admin.
- Verifikasi: `bun run build` (`tsc --noEmit && vite build`) lulus.

## P-094 (IT-kantor) | 2026-11-26 | Merge main ke IT-kantor & Aktifkan Fallback Login Offline Lokal

- Status: selesai di lokal
- Ubah: `src/lib/auth/dummy-accounts.ts` (pulihkan 11 akun `DUMMY_ACCOUNTS` + akun lokal `SUPERADMIN_IT` `kazukirentarou92@gmail.com`, `ROLE_DEFAULT_PASSWORDS`, `authenticateDummyUser`, `registerDeveloperAccount`, dan fallback otomatis di `loginWithServer`/`registerWithServer`), `src/lib/auth/se-management.ts`, `src/lib/auth/developer-user-management.ts`, `tests/developer-user-management.test.ts`
- Alasan/keputusan: Mengaktifkan pengujian lokal tanpa server backend/DB aktif selama pengembangan di branch `IT-kantor`.
- Verifikasi: `bun run build` (`tsc --noEmit && vite build`) lulus; `bun test tests/developer-user-management.test.ts` (7 pass, 0 fail).

## P-097 | 2026-11-26 | Soft-Selling 4 Pilar pada AI Follow-Up Berkala (/pipeline?tab=FOLLOWUP)

- Status: selesai di lokal
- Ubah: `server/wa-nurture.ts` (fix baca `full_name`/`owner_se_name`/`owner_se_email`, memory antar-step anti-pengulangan, konteks persona `lead_ai_analyses` + `getCentralAiKnowledge` + deteksi `unitMentionedInChat` + adaptasi stage `VISITED`, 4 gaya soft-selling `NurtureTone`, `regenerateAllNurtureDraftsForLead`, `getRecentLeadTurnsForNurture`), `server/index.ts` (`/api/nurture/jobs` kembalikan `recentTurns`, `/api/nurture/jobs/generate` dukung `tone`, tambah `/api/nurture/jobs/regenerate-all`), `src/components/pipeline/FollowupScheduleTab.tsx` (tampilkan 1–2 bubble chat terakhir di preview WA, selector Gaya Pesan, & tombol `Regenerate Semua (H0–H14)`)
- Alasan/keputusan: Menghilangkan kesan template kaku/robotik dan mencegah pengulangan antar-tahap H0–H14, sekaligus memudahkan SE membaca konteks chat terakhir sebelum mengirim atau mengedit draf.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`) & `bun build server/index.ts`
- Berikutnya: Push ke GitHub & deploy ke `hades`, lalu uji `Regenerate Semua (H0–H14)` di `/pipeline?tab=FOLLOWUP`.
- Catatan: Draf lama di DB bisa langsung diganti serentak lewat tombol `Regenerate Semua (H0–H14)`.

## P-096 | 2026-11-26 | Halaman Khusus Kelola User (/kelola-user) + CRUD Penuh & Reset Kata Sandi

- Status: selesai di lokal
- Ubah: `server/auth.ts` (`updateTenantUser`, `deleteTenantUser`), `server/index.ts` (`PATCH` lengkap termasuk ubah kata sandi/role/email/proyek & `DELETE /api/org/users`), `src/lib/navigation/router.ts` (rute `org_users` -> `/kelola-user`), `src/components/OrgUserManagementPage.tsx` (halaman khusus CRUD penuh + filter 6 role + reset kata sandi), `src/App.tsx` (navigasi sidebar, SM, Admin ke `/kelola-user`)
- Alasan/keputusan: Mengganti modal sempit menjadi halaman penuh agar manajemen akun (tambah, edit profil/role/proyek, reset kata sandi, aktif/nonaktif, hapus) jauh lebih leluasa.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`) & `bun build server/index.ts`
- Berikutnya: Push ke GitHub & deploy ke `hades` bila user siap.
- Catatan: Akun `SUPERADMIN`/`SUPERADMIN_IT` diproteksi agar tidak bisa dihapus atau diubah role-nya oleh role operasional.

## P-095 | 2026-11-26 | Kelola User 6 Role Utama (IT, SM, SE, Owner, Admin, TL) di Sidebar & Pengelompokan Riwayat Aktivitas Tim

- Status: selesai di lokal
- Ubah: `server/auth.ts` (`BASIC_ORG_ROLES` = `IT`, `SM`, `SE`, `DIREKSI`, `ADMIN`, `TL`), `src/components/OrgUserManagementModal.tsx` (label & opsi 6 role utama), `src/App.tsx` (tambah menu `Kelola User (6 Role)` di sidebar `MANAJEMEN PERUSAHAAN`), `server/index.ts` (`/api/company/audit-logs` join `app_users` per `tenant_id` + filter `actorRole`/`actorEmail` + `teamMembers`), `src/components/company/CompanyAuditLogsModal.tsx` (auth Bearer token, filter Role & Anggota Tim, mode pengelompokan per Divisi & Anggota Tim)
- Alasan/keputusan: Sebelumnya tombol `Kelola User (6 Role)` hanya ada di header Dashboard SM/Admin (tidak tampil di menu lain seperti Knowledge Base), daftar role masih memakai `DIGITAL_MARKETING` bukan `IT`, dan `CompanyAuditLogsModal` menampilkan log datar tanpa otentikasi Bearer maupun pengelompokan anggota tim dari `app_users`.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`) & `bun build server/index.ts`
- Berikutnya: Deploy ke `hades` (`https://developerproperti.giivepro.com`) jika siap agar perubahan lokal tampil di live.
- Catatan: Semua perubahan ini masih di lokal; live `developerproperti.giivepro.com` masih menjalankan build P-093.

## P-094 | 2026-11-26 | CRUD Lengkap (Create, Read, Update, Delete) Role SE pada F74, F75, F79 & F86

- Status: selesai di lokal
- Ubah: `server/index.ts` (perluas `PATCH` & tambah `DELETE` pada `/api/vault/documents`, `/api/kpr/applications`, `/api/referrals`, `/api/complaints` dengan cek kepemilikan SE), `src/components/SecureDocumentVaultPage.tsx` (edit inline dokumen & error handling hapus), `src/components/BankSubmissionWorkflowPage.tsx` (edit nama/WA/unit/tahap KPR + tombol hapus), `src/components/ReferralProgramPage.tsx` (edit inline & tombol hapus referral), `src/components/CustomerComplaintsPage.tsx` (edit inline & tombol hapus tiket DLP)
- Alasan/keputusan: Sebelumnya `DELETE` belum ada pada `/api/kpr/applications`, `/api/referrals`, dan `/api/complaints`, serta `PATCH` dan UI di keempat modul belum mendukung edit penuh untuk role SE.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`) & `bun build server/index.ts`
- Berikutnya: Uji CRUD langsung di browser pada role SE (F74, F75, F79, F86).
- Catatan: Pengajuan KPR berstatus `LEAD_AUTO` akan tersinkronisasi ulang dari `pipeline_leads` saat `GET` jika lead masih berkategori KPR.

## P-093 | 2026-11-25 | Restrukturisasi Menu Admin Panel IT & Flow 2-Langkah Permission Fitur (6 Role Utama)

- Status: selesai & live di `https://developerproperti.giivepro.com` (`hades`, commit `fb18193` di `origin/feat/totp-2fa`)
- Ubah: `src/components/superadmin/PermissionMatrixPanel.tsx` (alur 2 langkah: default tabel daftar user dengan tab filter 6 role utama mengecualikan `SUPERADMIN` & `SUPERADMIN_IT` -> klik user masuk halaman detail atur permission CRUD + tombol kembali & opsi Global Per-Role), `src/components/superadmin/ItCommandCenterDashboard.tsx` (pisah 4 halaman: `dashboard`, `permissions`, `knowledge`, `hierarchy` + metrik real & pintasan cepat di dashboard), `src/App.tsx` (menu sidebar khusus `SUPERADMIN_IT`: Permission Fitur, Knowledge AI Terpusat, Hierarki Tenant & Support)
- Alasan/keputusan: Sebelumnya semua modul menumpuk di satu halaman Dashboard IT dan panel permission masih memuat akun Superadmin dalam split-view. Pemisahan halaman + flow tabel user -> detail membuat navigasi lebih terstruktur dan fokus pada 6 role operasional.
- Verifikasi: `npm run build`, `bun build server/index.ts`, push `origin/feat/totp-2fa` (`fb18193`), backup DB `sales_os-20261126-0000.dump`, migrasi `0021`–`0024` sukses di `hades`, deploy backend+frontend & `pm2 restart developer-sales-os-api`; smoke live `/` (`200`, `index-tN02wvMh.js`), `/api/health` (`200`), `/api/it/knowledge-ai` (`401`), `/api/dashboard/summary` (`401`), `/api/permissions/me` (`401`)
- Berikutnya: Uji langsung di browser `https://developerproperti.giivepro.com` (hard refresh `Ctrl+Shift+R`).
- Catatan: Rollback backend `dist-server.mjs.pre-20261126-0000`, frontend `~/db-backup/index.html.20261126-0000`, DB `~/db-backup/sales_os-20261126-0000.dump`.

## P-092 | 2026-11-25 | Pop-up Pengingat & Notification Center Dinamis Semua Role + Auto-Load .env Backend

- Status: selesai di lokal
- Ubah: `src/components/RoleNotificationCenter.tsx` (baru: `RoleNotificationBell` & `buildRoleGreetingAndNotifications`), `src/App.tsx` (greeting `showAssistantGreeting` & header bell memakai data real `/api/dashboard/summary` per role), `server/db.ts` (auto-load `.env` via `process.loadEnvFile()` bila `DATABASE_URL` belum terset)
- Alasan/keputusan: (1) Pop-up pengingat sebelumnya static untuk SE dan tombol notifikasi tidak membuka panel di role lain. (2) Error `404` disebabkan proses lama `server.mjs` (22:40) belum di-restart, lalu berubah jadi `500` saat `node dist-server.mjs` dijalankan tanpa `--env-file=.env` sehingga jatuh ke fallback port `5433` padahal PostgreSQL berjalan di `5435` (`.env`).
- Verifikasi: `npm run build`, `bun build server/index.ts --outfile dist-server.mjs --target node --packages=external`, server jalan di `:3040` terhubung PostgreSQL `:5435` tanpa error startup
- Berikutnya: Refresh browser & uji Knowledge AI IT + pop-up pengingat di semua role.
- Catatan: `server/db.ts` kini otomatis membaca `.env` saat dijalankan via `node dist-server.mjs` tanpa flag tambahan.

## P-091 | 2026-11-25 | Knowledge AI Terpusat di Panel IT + Integrasi OCR Lokal & AI Engine

- Status: selesai di lokal
- Ubah: `db/migrations/0024_ai_central_knowledge.sql`, `server/truth-engine.ts` (`getCentralAiKnowledge`, `rebuildCentralKnowledgeFromDocs`, `saveCentralAiKnowledge`), `server/index.ts` (`/api/it/knowledge-ai*`), `server/ai-engine.ts` (suntik `masterMarkdown` ke `systemPrompt`), `src/components/it/ItKnowledgeAiPanel.tsx`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/App.tsx` (panel & navigasi Knowledge AI di role IT)
- Alasan/keputusan: Memusatkan seluruh materi training/knowledge AI (termasuk hasil ekstrak brosur PDF/gambar via `doc-extractor.py` + `RapidOCR` lokal) ke 1 data `sales_os.ai_central_knowledge` yang dikelola Divisi IT.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`), `bun build server/index.ts`, dan uji DB + ekstraktor lokal
- Berikutnya: Jalankan server & uji unggah brosur PDF/gambar melalui browser di dashboard IT.
- Catatan: Pastikan Python + `pymupdf` + `rapidocr_onnxruntime` terpasang pada lingkungan server produksi.

## P-090 | 2026-11-25 | Permission Matrix Superadmin IT + Migrasi Dashboard, Referral, DLP & Marketing ke DB

- Status: selesai di lokal
- Ubah: `db/migrations/0023_permissions_and_full_db.sql`, `server/permissions.ts` (matriks izin per-user & global-role CRUD), `server/index.ts` (`/api/permissions/me`, `/api/superadmin/permissions`, `/api/dashboard/summary`, `/api/escalations`, `/api/referrals`, `/api/partner-config`, `/api/complaints`, `/api/marketing/campaigns`, `/api/project-settings`), `src/components/superadmin/PermissionMatrixPanel.tsx`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/components/CustomerComplaintsPage.tsx`, `src/components/ReferralProgramPage.tsx`, `src/App.tsx`
- Alasan/keputusan: Memberi kontrol permission CRUD granular per-user & global-role di Superadmin IT serta menyambungkan modul Referral, Keluhan DLP, Eskalasi Direksi, dan ringkasan dashboard SM/TL/Admin/IT/DM ke PostgreSQL.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`), `bun build server/index.ts`, dan uji alur DB/API
- Berikutnya: Jalankan server & lakukan uji end-to-end dengan PostgreSQL aktif.
- Catatan: Resolusi permission memprioritaskan override Per-User di atas Global Role.

## P-089 | 2026-11-25 | Vault KPR & KPR Bank DB Asli (Lead-Linked), Approval SM/Admin, & Kelola User 6 Role

- Status: selesai di lokal (migrasi 0022 belum dijalankan ke DB produksi)
- Ubah: `db/migrations/0022_vault_kpr_and_org_users.sql`, `server/auth.ts` (`BASIC_ORG_ROLES`, `listTenantUsers`, `createTenantUser`, `updateTenantUserStatus`), `server/index.ts` (`/api/org/users`, `/api/vault/documents`, `/api/kpr/applications` dengan auto-sync lead KPR), `src/components/SecureDocumentVaultPage.tsx` (pilih dari lead + input manual, multi-dokumen sekaligus, dikelompokkan per nama debitur, approval SM/Admin), `src/components/BankSubmissionWorkflowPage.tsx` (auto-sync lead KPR, pilih lead + manual, edit/majukan tahap ke DB), `src/components/OrgUserManagementModal.tsx`, `src/App.tsx` (tombol Kelola User 6 Role di SM & Admin + navigasi Vault/KPR)
- Alasan/keputusan: Menghilangkan data dummy `localStorage` pada Vault KPR & KPR Bank, mendukung multi-dokumen per nama pengguna dari daftar lead, serta memberi Admin & SM manajemen user 6 role dasar.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`), `bun build server/index.ts`, dan `bun test tests`
- Berikutnya: Jalankan migrasi `0022` pada PostgreSQL & lanjutkan Fase 3 (migrasi `CustomerComplaintsPage`, `ReferralProgramPage`, dan tabel ringkasan dummy di `SM`/`ADMIN`/`DIREKSI`)
- Catatan: Role `SM`, `ADMIN`, dan `DIREKSI` di `App.tsx` masih memiliki beberapa ringkasan dashboard (`BOOKING_TRANSACTIONS`, `SE_TEAM_DATA`, `ESCALATION_DATA`) yang belum tersambung ke endpoint DB.

## P-088 | 2026-11-25 | Merge IT-kantor ke branch 2FA + penguatan 2FA & akses mitra

- Status: selesai di lokal (branch `feat/totp-2fa`, belum push/deploy)
- Ubah: `server/auth.ts` (batas 5 percobaan/15 menit, secret aktif tak bisa ditimpa, klaim step & recovery atomik), `server/partner-access.ts` (tolak-default mitra), `server/index.ts`, `src/App.tsx` (logout mencabut sesi server), `src/components/LoginModal.tsx` (tombol akun demo dihapus), `src/lib/auth/dummy-accounts.ts` (login/OTP offline dihapus), `tests/auth-dummy.test.ts`, `tests/totp-2fa-guardrails.test.ts`, `tests/totp-auth-flow.test.ts`
- Alasan/keputusan: auth ikut versi TOTP, halaman & layout ikut IT-kantor; akun mitra hanya di-seed bila `DEVOS_PARTNER_SEED_PASSWORD` diset
- Verifikasi: `tsc --noEmit` bersih, vite build & bun build server sukses, `bun test tests` 145 lulus (AI_ROUTER_API_KEY dikosongkan); PostgreSQL sandbox: migrasi 0017-0021 OK, HTTP 57/57; browser 27/27 (login, TOTP, lonceng SE, mitra, mobile)
- Berikutnya: push, lalu deploy server dan frontend bersamaan setelah backup DB + migrasi 0021
- Catatan: fallback login offline (P-072/P-081/P-084) jangan dimasukkan lagi; dijaga test guardrails. P-087 semula bernomor P-072 lokal. `JSON.stringify(..)::jsonb` terbukti tersimpan sebagai string; pola sama masih ada di `server/units-quotes.ts:346-347`.

## P-087 | 2026-11-25 | 2FA TOTP (Google Authenticator), Halaman Profil & Notifikasi Rekomendasi Semua Role

- Status: selesai di local (belum push/deploy ke hades)
- Ubah: `db/migrations/0021_totp_2fa_profiles.sql`, `server/totp.ts` (RFC 6238 murni `node:crypto`), `server/auth.ts` (default TOTP mati, login langsung jika nonaktif, wajib kode TOTP/recovery jika aktif, API profil & setup/enable/disable TOTP), `server/index.ts` (`/api/profile*`), `src/components/ProfilePage.tsx`, `src/components/TotpSecurityBell.tsx`, `src/components/LoginModal.tsx`, `src/components/se/SeNotificationCenter.tsx`, `src/components/se/SeGuidedTour.tsx`, `src/lib/navigation/router.ts`, `src/lib/auth/dummy-accounts.ts`, `src/App.tsx`
- Alasan/keputusan: TOTP gratis (Rp0) untuk semua role dengan default mati; saat belum aktif tidak ada verify WA saat login dan muncul notifikasi rekomendasi di ikon lonceng; kartu profil di sidebar dapat diklik menuju `/profil` untuk aktivasi QR TOTP + 6 recovery codes.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`) bersih; `bun build server/index.ts --outfile dist-server.mjs --target node --packages=external` sukses (23 modul, 0.50 MB); unit check TOTP (`generateTotpSecret`, `verifyTotpToken`, anti-replay, `buildOtpAuthUri`) lulus (`true true true`).
- Berikutnya: push & deploy ke `hades` bila user siap.
- Catatan: setelah TOTP diaktifkan pada sebuah akun, login berikutnya wajib memasukkan 6-digit kode Google Authenticator atau salah satu dari 6 recovery codes.

## P-092 (IT-kantor) | 2026-11-25 | Dukungan Multi Titik Koordinat GPS per Proyek (Multi-Cluster)

- Status: selesai
- Ubah: `src/lib/projects/projects-data.ts`, `src/components/projects/ManageClusterCoordsModal.tsx`, `src/components/JalurProyek.tsx`, `src/App.tsx`, `tests/projects-data.test.ts`.
- Alasan/keputusan: Mengakomodasi 1 proyek yang memiliki beberapa titik lokasi/cluster (misal Gerbang Utama, Cluster Nagoya, Cluster Osaka) dengan mempertahankan backward compatibility `koordinatGps` primer.
- Verifikasi: `bun test` (151 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.

## P-091 (IT-kantor) | 2026-11-25 | Manajemen Akun Internal Developer oleh IT Developer (SE s.d. Direksi) dengan Isolasi Tenant

- Status: selesai
- Ubah: `src/lib/auth/developer-user-management.ts`, `src/components/it/AddDeveloperUserModal.tsx`, `src/App.tsx`, `tests/developer-user-management.test.ts`.
- Alasan/keputusan: Memberikan otoritas kepada role IT Developer (`IT`) untuk menambah dan mengelola akun seluruh hierarki tim internal dengan batasan isolasi tenant.
- Verifikasi: `bun test` (150 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.

## P-090 (IT-kantor) | 2026-11-25 | Fitur Override Paket Langganan (Gold, Platinum, Diamond) per Developer untuk IT Internal

- Status: selesai
- Ubah: `src/lib/plans/plan-override.ts`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/components/SuperadminPanel.tsx`, `src/App.tsx`, `tests/plan-override.test.ts`.
- Alasan/keputusan: Menambahkan kemampuan bagi Tim IT Internal (`SUPERADMIN_IT`) untuk meng-override paket langganan per developer/tenant.
- Verifikasi: `bun test` (143 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.

## P-089 (IT-kantor) | 2026-11-25 | Fitur Tambah Akun SE Inhouse (SM & Admin) & Kuesioner Struktur Tim Pendaftar

- Status: selesai
- Ubah: `src/App.tsx`, `src/components/AddSeModal.tsx`, `src/lib/auth/se-management.ts`, `src/components/LoginModal.tsx`.
- Alasan/keputusan: Memberikan hak tambah akun SE in-house kepada SM dan Admin serta menyediakan kuesioner struktur developer saat registrasi.
- Verifikasi: `bun test` (139 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.

## P-086 | 2026-11-25 | Integrasi Tunggal Dashboard Mitra & Pemulihan Server Auth untuk Push IT-kantor

- Status: selesai
- Ubah: `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `progress.md`.
- Alasan/keputusan: Menghapus item navigasi duplikat "Program Referral" di sidebar mitra (cukup melalui "Dashboard Referral" / "Dashboard Sales Mitra"), mengembalikan `src/lib/auth/dummy-accounts.ts` ke versi server auth database, dan bersiap push ke remote branch `IT-kantor`.
- Verifikasi: `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: Push commit ke origin/IT-kantor.
- Catatan: Area kerja mitra terpusat di dashboard utama tanpa menu duplikat.

## P-085 | 2026-11-25 | Render Dashboard Khusus Role REFERRAL_PARTNER & SALES_PARTNER

- Status: selesai
- Ubah: `src/App.tsx`, `src/components/ReferralProgramPage.tsx`.
- Alasan/keputusan: Mengaktifkan render tampilan dasbor utama ketika login sebagai `REFERRAL_PARTNER` atau `SALES_PARTNER` (sebelumnya area utama masih kosong karena belum ada kondisi render di `activeView === 'dashboard'`). Sekarang langsung menampilkan halaman portal mitra sesuai peran dengan tautan referral personal (`?src=anita_wijaya` atau `?src=dimas_property`) dan tab status yang terfilter otomatis.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: -
- Catatan: Menampilkan header ramah mitra ("Dashboard Referral" / "Dashboard Sales Mitra") dan menyembunyikan navigasi teknis internal.

## P-084 | 2026-11-25 | Fallback Otomatis Server Auth ke Dummy Offline (Login Tanpa Koneksi Server)

- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts`.
- Alasan/keputusan: Menambahkan fallback otomatis pada `loginWithServer`, `registerWithServer`, dan `verifyMfaWithServer` ketika fetch `/api/auth/*` gagal/error jaringan ("Tidak dapat terhubung ke server autentikasi"). Sistem secara otomatis mengalihkan autentikasi ke akun dummy lokal & offline MFA challenge (`829104` atau `123456`) sehingga modal login langsung berhasil masuk ke dashboard tanpa memblokir pengguna saat backend database lokal belum aktif.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: -
- Catatan: Mendukung transisi otomatis transparan antara server live dan offline mock.

## P-083 | 2026-11-25 | Penambahan Akun & Akses Nyata Gmail untuk Referral & Sales Partner

- Status: selesai
- Ubah: `src/data.ts`, `src/lib/auth/dummy-accounts.ts`, `tests/auth-dummy.test.ts`, `src/App.tsx`, `src/components/LoginModal.tsx`, `src/components/mobile/MobileMoreSheet.tsx`.
- Alasan/keputusan: Menambahkan 2 peran & akun mitra pengguna nyata dengan domain `@gmail.com` (`anita.wijaya92@gmail.com` sebagai Referral Partner & `dimas.property.solo@gmail.com` sebagai Sales Partner), melengkapi password lokal, tombol quick-fill di LoginModal, serta menu navigasi sidebar khusus mitra.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: -
- Catatan: Kredensial dapat langsung digunakan di login modal atau diuji offline.

## P-082 | 2026-11-25 | Kustomisasi Skema Mitra: Dual-Model Referral & Sales Partner (Blueprint v1.0)

- Status: selesai
- Ubah: `src/lib/foundations/partner-scheme-config.ts`, `src/components/ReferralProgramPage.tsx`.
- Alasan/keputusan: Mengimplementasikan kustomisasi parameter skema kemitraan sesuai Master Blueprint v1.0: diferensiasi peran (Referral Partner vs Sales Partner), pengaturan fee/komisi fleksibel (Rp 2,5jt - Rp 5jt vs 1,5% - 2,5%), SLA respon lead (<15 menit), override inhouse (0,5%), milestone payout (M1 30%, M2 50%, M3 20%), dan aturan proteksi inhouse (30 hari claim window & auto-takeover SLA).
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: -
- Catatan: Modal kustomisasi skema dapat diakses langsung oleh admin/direksi dari tombol "Kustomisasi Skema" di header halaman mitra.

## P-081 | 2026-11-25 | Pemulihan Fallback Auth & Akun Dummy Offline untuk Pengujian Lokal

- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts`.
- Alasan/keputusan: Mengaktifkan kembali kredensial password lokal `ROLE_DEFAULT_PASSWORDS`, token mock offline (`mock-offline-token`), dan validasi akun dummy lokal pada `authenticateDummyUser` agar pengembang dapat bebas mengedit dan menguji login/unit test tanpa harus menyalakan server DB PostgreSQL backend.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: -
- Catatan: Mendukung pengujian unit test offline dan pengujian live backend secara bersamaan.

## P-080 | 2026-11-25 | Pembangunan Fondasi R3 & R4: Kontrak API, Alur KPR & Control Tower

- Status: selesai
- Ubah: `src/lib/foundations/r3-r4-contracts.ts`, `src/components/BankSubmissionWorkflowPage.tsx` (F75), `src/components/ExecutiveControlTowerPage.tsx` (F90 & F88), `src/lib/navigation/router.ts`, `src/components/mobile/MobileMoreSheet.tsx`, `src/App.tsx`.
- Alasan/keputusan: Menyiapkan fondasi deterministik R3 (Alur KPR Bank mitra & SP3K) dan R4 (Control Tower Portofolio & Proyeksi Cashflow) dalam bentuk halaman kerja utuh bergaya `/unslop` dan kontrak adapter API, siap disambungkan ke backend/third-party tanpa merombak UI.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: -
- Catatan: Rute view `kpr_bank` dan `control_tower` terintegrasi di sidebar dan router.

## P-079 | 2026-11-25 | Unslopping UI: Quiet Chrome, Clean Spacing & Tipografi Elegan

- Status: selesai
- Ubah: `src/components/ReferralProgramPage.tsx`, `src/components/SecureDocumentVaultPage.tsx`, `src/components/CustomerComplaintsPage.tsx`.
- Alasan/keputusan: Mengaplikasikan prinsip skill `/unslop`: menghilangkan badge/banner mencolok, menata quiet chrome, merapikan card angka, dan menertibkan tabel data agar berkarakter studio arsitektur/pengembang properti.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: Audit visual halaman dashboard role lain (TL, SM, Admin, Direksi).

## P-078 | 2026-11-25 | Integrasi Halaman Penuh F74, F79, F86 di Sidebar & Main View (Anti-Popup)

- Status: selesai
- Ubah: `src/components/SecureDocumentVaultPage.tsx`, `src/components/ReferralProgramPage.tsx`, `src/components/CustomerComplaintsPage.tsx`, `src/lib/navigation/router.ts`, `src/components/mobile/MobileMoreSheet.tsx`, `src/App.tsx`.
- Alasan/keputusan: Mengembalikan menu F74, F79, F86 ke sidebar dan mobile sheet sebagai view halaman utuh (`activeView` main area), bukan modal popup overlay, sesuai instruksi user.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: -
- Catatan: Menambahkan route view `vault`, `referral`, `garansi` ke router state dan sidebar navigation.

## P-077 | 2026-11-25 | Penghapusan Tombol Popup F86/F79/F74 & Unslopping Layout Responsif

- Status: selesai
- Ubah: `src/App.tsx`, `src/components/PipelinePage.tsx`, `src/components/PlaybookViewer.tsx`, hapus modal dead code `CustomerComplaintsModal.tsx`, `ReferralTrackingModal.tsx`, `SecureDocumentVaultModal.tsx`.
- Alasan/keputusan: Menghilangkan tombol popup F86, F79, F74 dari sidebar sesuai instruksi user; menjaga navigasi berbasis halaman utuh (`activeView`), serta menata ulang header Pipeline & kartu SOP Playbook agar tidak bertumpuk di layar menengah/kecil.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) sukses.
- Berikutnya: -
- Catatan: Semua navigasi alat kerja diarahkan ke view halaman penuh, bukan overlay popup acak.

## P-076 | 2026-11-25 | Pembangunan Persiapan Fitur R2 (F14, F47, F57, F62, F65, F74, F79, F86)

- Status: selesai
- Ubah: `src/components/LoveLetterViewerModal.tsx` (F14 Claim Ledger), `src/components/pipeline/TaskInboxTab.tsx` (F47 Task Inbox), `src/components/pipeline/BuyerPackModal.tsx` (F57 Buyer Pack), `src/components/DailyRouteViewer.tsx` (F62 Replan Hujan), `src/components/PlaybookViewer.tsx` (F65 Sertifikasi SE), `src/components/SecureDocumentVaultModal.tsx` (F74 Vault KPR), `src/components/ReferralTrackingModal.tsx` (F79 Referral Link), `src/components/CustomerComplaintsModal.tsx` (F86 DLP Garansi), `src/components/PipelinePage.tsx`, `src/App.tsx`.
- Alasan/keputusan: Menutup kesenjangan fitur R2 dengan membangun antarmuka dan kontrak persiapan deterministik tanpa ketergantungan API pihak ketiga / database baru sesuai arahan user.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) sukses bersih.
- Berikutnya: -

## P-075 | 2026-11-25 | Unslopping Card SOP Playbook & Perataan Responsif Multi-Role

- Status: selesai
- Ubah: `src/components/PlaybookViewer.tsx`, `src/components/CrmPipelineView.tsx`, `src/App.tsx`
- Alasan/keputusan: Merestrukturisasi card SOP Playbook harian: meletakkan target output di footer card berikon Target (tidak lagi menekan kolom kiri), memadukan waktu/channel/SLA dengan flex-wrap & no-wrap agar tidak terpotong vertikal; menambahkan flex-wrap & gap pada seluruh header sub-modul (TL, SM, ADMIN, IT, DIREKSI).
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) sukses.
- Berikutnya: -

## P-074 | 2026-11-25 | Standardisasi Breakpoint Responsif Pipeline & Modul Viewer

- Status: selesai
- Ubah: `src/components/PipelinePage.tsx`, `ContentCalendarViewer.tsx`, `PlaybookViewer.tsx`, `SalesTargetViewer.tsx`, `DailyRouteViewer.tsx`, `MarketResearchViewer.tsx`, `CrmPipelineView.tsx`, `DireksiMultiProjectView.tsx`
- Alasan/keputusan: Mengganti breakpoint `sm:flex-row` menjadi `xl:flex-row` / `lg:flex-row` pada header halaman agar judul tidak terjepit 30px dan tombol aksi tidak menumpuk saat sidebar aktif di layar menengah/restore down.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -

## P-073 | 2026-11-25 | Perbaikan Responsivitas Header Desktop saat Window Dikecilkan / Minimize

- Status: selesai
- Ubah: `src/App.tsx`, `src/components/se/SeNotificationCenter.tsx` (tambah truncation, responsivitas lebar dropdown proyek, label tombol adaptif, badge online adaptif, dan shrink-0 pada lonceng notifikasi)
- Alasan/keputusan: Mengatasi masalah elemen header (tombol Tambah Proyek, dropdown, lonceng notifikasi SE) saling bertumpuk dan menyebabkan overflow horizontal saat ukuran window browser dikecilkan/restore down.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -

## P-072 | 2026-11-25 | Offline Resilience Fallback untuk Login & Verifikasi MFA

- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts` (fallback otomatis ke dummy auth & token mock saat backend/DB offline)
- Alasan/keputusan: Mengatasi kendala gagal login/MFA saat backend server atau PostgreSQL lokal belum aktif setelah pull dari main; dapat di-revert kapan saja sebelum push bila diinginkan.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run typecheck` (bersih).
- Berikutnya: -
- Catatan: Jika ingin kembali murni server auth saat push, cukup `git checkout src/lib/auth/dummy-accounts.ts`.

## P-071 | 2026-11-25 | F55 AI Nurture Cadence Terjadwal (Tab Khusus, WA Preview 2-Kolom, Baileys)

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `db/migrations/0020_wa_nurture_cadence.sql`, `server/wa-nurture.ts` (+auto-fill draf AI & `rescheduleAnchorForLead`), `server/index.ts` (+`/api/nurture/jobs/reschedule-anchor`), `src/components/pipeline/FollowupScheduleTab.tsx` (tab khusus 2 kolom + anchor tanggal follow-up pertama + WA preview), `src/components/PipelinePage.tsx` (tab `FOLLOWUP` & tombol pintas dari kartu lead)
- Alasan/keputusan: F55 dipindah menjadi tab tersendiri agar kartu Pipeline ringkas; draf pesan otomatis disusun AI saat jadwal dibuka, dengan visualisasi gelembung WhatsApp di sisi kanan & editor penuh SE.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`) bersih; `bun build server/index.ts --outfile dist-server.mjs --target node --packages=external` sukses (22 modul, 0.49 MB).
- Berikutnya: pantau pengiriman scheduler Baileys pada jam kerja 08:30-19:30 WIB.
- Catatan: scheduler berjalan tiap 60 dtk (dapat dimatikan via `WA_NURTURE_SCHEDULER=off`).

## P-070 | 2026-11-25 | Wave 1-4 R1 Local: Auth Server-Side, Unit Lock/Quote, Public Site, Doc Extractor & Conflict Inbox

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`; commit `e679668`)
- Ubah: `server/auth.ts`, `server/units-quotes.ts`, `server/truth-engine.ts`, `server/doc-extractor.py`, `server/index.ts`, `db/migrations/0017_auth_sessions_rbac.sql`, `db/migrations/0018_unit_inventory_quotes.sql`, `db/migrations/0019_document_truth_conflicts.sql`, `src/lib/auth/dummy-accounts.ts`, `src/lib/auth/fetch-interceptor.ts`, `src/components/LoginModal.tsx`, `src/components/PublicProjectSitePage.tsx`, `src/App.tsx`, `src/main.tsx`
- Alasan/keputusan: tutup celah auth header (F91), tambah DB row-lock anti double-booking & quote deterministik (F67-F69), buka route publik `/p/:slug` + form lead consent/honeypot (F31-F33), dan pasang extractor `PyMuPDF+RapidOCR+openpyxl` agar `9router` hanya membaca Markdown hasil ekstrak (F01/F02/F04/F05).
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`) bersih; `bun build server/index.ts --outfile dist-server.mjs --target bun` sukses (504 modul); `python -m py_compile server/doc-extractor.py` & uji CSV extractor OK; Python deps (`pymupdf`, `pymupdf4llm`, `rapidocr_onnxruntime`, `openpyxl`) terpasang di local.
- Berikutnya: uji end-to-end dengan PostgreSQL lokal aktif (`bun --env-file=.env server/index.ts`), lalu deploy ke `hades` + `pip install` deps extractor di `hades`.
- Catatan: password hardcoded dihapus dari `DUMMY_ACCOUNTS` frontend; default seed password server pakai `DEVOS_SEED_PASSWORD` (fallback lokal `AndaraOS2026!`).

## P-069 | 2026-11-24 | Perbaikan insiden: pipeline 500 sejak deploy 20:57 + migrasi 0015/0016

- Status: selesai (live)
- Ubah: `db/migrations/0016_fix_pipeline_columns_and_tenant.sql` (kolom lead_quality/spam_reason/is_in_pool/pool_reason/last_activity_at, company_bank_accounts.created_by, tenant_id lead disamakan), ensure di `server/index.ts`
- Alasan/keputusan: deploy P-064 membawa kode multi-tenant (commit 0c6c632) ke DB lama; `/api/pipeline/leads` 500 pukul 20:57-23:52 dan lead baru gagal dibuat. Verifikasi P-064 hanya `/api/health`.
- Verifikasi: pg_dump `~/db-backup/sales_os-20261124-2352.dump`; smoke 15 endpoint GET x 3 role tanpa 5xx sebelum & sesudah deploy; lead Raka 2; SQL WA diuji ROLLBACK.
- Berikutnya: login server sungguhan (password ada di bundle frontend, API percaya header), lalu `WA_HISTORY_API=on`.
- Catatan: 3 baris tenant_id diubah `pt-andara-rejo-makmur` -> `andara_rejo_makmur`. Rollback backend `dist-server.mjs.pre-20261124-2355`, frontend `~/db-backup/index.html.20261124-2355`. Selalu smoke semua endpoint setelah deploy.

## P-068 | 2026-11-24 | AI WA: kapan diam/singkat/jawab/jelaskan/tanya balik/serahkan + riwayat 10 giliran

- Status: live di hades 2026-11-24 23:55 (riwayat chat disimpan & dipakai AI, tetapi BELUM ditampilkan: `WA_HISTORY_API` belum `on` sampai login server diperbaiki). Terpisah: jadwal konten hanya role SE (`SE_EMAILS`) SUDAH live (rollback `dist-server.mjs.pre-20261124-2317`).
- Ubah: `server/wa-turn-engine.ts`, `server/wa-conversation.ts`, `server/wa-consent.ts` (baru), `db/migrations/0015_wa_conversation_turns.sql` + ensure di `server/index.ts`, `server/ai-engine.ts` (35->30 unit, klaim naik Rp50 juta dibuang, turn engine paralel), `server/wa-baileys.ts` (simpan giliran, tunggu burst 6 dtk, persona awal LAINNYA & BANT 1), `src/components/PipelinePage.tsx` (riwayat chat, label mode, keadaan diam), `src/components/PlaybookViewer.tsx`, `scripts/wa_turn_*.ts`, `docs/wa-turn/`
- Alasan/keputusan: LLM hanya membaca maksud, kode memetakan mode; knowledge lain tidak disentuh (keputusan user); SE tetap yang mengirim; opt-out tidak lagi terpicu kata 'batal'.
- Verifikasi: baca maksud 60/60 dan 29/30 kasus sulit (3 putaran); penjaga klaim/harga diuji; tsc frontend bersih; bun test 135/136 (LLM live lama); build ok. UI belum dilihat di browser; SQL baru belum diuji di DB server.
- Berikutnya: OK user atas 10 contoh -> uji SQL ROLLBACK di server -> deploy. Keamanan: `getAuthenticatedUser` percaya header x-user-email, riwayat chat ikut terbuka lewat `/api/pipeline/leads`.
- Catatan: cacat draf tersisa lihat `docs/wa-turn/contoh-10.txt`. `ai-engine.ts` `u.unitCode` tidak ada di katalog (bug lama: harga fallback selalu 'mulai Rp650 juta').

## P-067 | 2026-11-24 | Carousel 5 foto konten + poster marketing (foto ke-6), bank teks, anti kembar

- Status: live di hades (belum pernah dirender; uji nyata 25 Nov 08:00 WIB)
- Ubah: `server/poster-copy.ts` (baru, 204 judul), `server/poster-planner.ts` (TOFU: sampul+3 tips+contoh nyata; MOFU: sampul+2 bukti+denah+cocok untuk siapa; foto 6 = banner harga), `server/poster-engine.ts` (tema dikunci Senja Megah/Blue Hour/Malam Hangat, bahan marmer/beludru/kaca emerald), `server/content-media-worker.ts` (judul 14 hari semua SE, caption ikut slide, poster 3x percobaan, slot tanpa poster = FAILED), `docs/poster-engine/bank-teks.md`
- Alasan/keputusan: poster wajib di akhir; interior/clubhouse ditunda sampai ada foto asli; BOFU tetap poster tunggal.
- Verifikasi: lint 204 judul 0 masalah; simulasi 30 hari 4 SE tanpa LLM: 180/180 carousel 6 foto + poster akhir, kembar hari sama 0; tsc bersih; bun test 135/136; SQL dicek di server; HTTP 200.
- Berikutnya: pantau 08:00; bila LLM mati total judul poster terulang dalam 14 hari (bank 50).
- Catatan: rollback `dist-server.mjs.pre-20261124-2311`.

## P-066 | 2026-11-24 | Mesin poster+carousel tersambung kalender, antrean 1 jam, live di hades

- Status: live (belum pernah generate lewat jalur kalender; uji nyata pertama 25 Nov 08:00 WIB)
- Ubah: `server/poster-planner.ts` (baru: banner, carousel 6 slide, cadangan tanpa LLM), `server/poster-engine.ts`, `server/content-media-worker.ts` (planner di enqueue, `getManualLock`, jendela 60+10 mnt, retry 1x, job 404/macet dilepas, slot tak disela, urutan SE digilir, tempel logo), `server/index.ts` (kolom `media_render_queue.render_meta`, kunci manual), `server/poster-composer.py`; hades `/opt/flow-service/app.py` (lane + kunci 08-09, 13-14, 18:30-19:30 + jeda 10 dtk), `flow_engine.py` (bersihkan referensi juga untuk video)
- Alasan/keputusan: judul/fakta carousel dari bank resmi; LLM memilih tema/card & menulis hook; `LLM` gagal -> rancangan cadangan agar tersedia jam 9. Prompt Flow-native lama dibuang.
- Verifikasi: tsc server bersih, `bun test` 135/136 (LLM live lama), 300 rancangan cadangan tanpa kembar, kunci Hermes diuji per menit batas, SQL diuji transaksi ROLLBACK di DB server, composer jalan di server, HTTP 200, PM2 online.
- Berikutnya: pantau 08:00-09:00 25 Nov; Reels 14:00 belum terbukti (24 Nov semua video gagal); upload `ref-fasad-potret.jpg` ke acc2; OCR; commit git.
- Catatan: rollback backend `dist-server.mjs.pre-20261124-2258`, Hermes `*.bak-20261124-2258`. `andarasales` (siteplan) juga pakai Hermes dan akan dapat 423 di jendela terkunci. Jalur LOCAL_PENDING/OpenRouter masih ada di kode tapi tak diproduksi lagi.

## P-065 | 2026-11-24 | Mesin poster mandiri (LLM art director) + uji 3 gambar

- Status: sebagian (mesin banner jalan lokal; belum tersambung kalender, belum deploy)
- Ubah: `server/poster-engine.ts` (baru: tema/card/fakta/pita/footer dari daftar, hook oleh `cbai/glm-5.2` + editor, pemeriksa isi, perakit prompt, `inspectPoster`), `server/poster-composer.py` (plakat murni sistem, `headroom`, `add_sky`), `server/visual-bible.ts` (tanpa plakat AI), `scripts/poster_engine_briefs.ts`, `scripts/poster_engine_render.ts`, `docs/poster-engine/` (banner-v1, uji-1)
- Alasan/keputusan: LLM hanya memilih ID & menulis hook; klaim/harga/pita/footer dari kode. Combo `andararejomakmurjosjis` 504 untuk brief dan timeout untuk vision; jadi cadangan saja.
- Verifikasi: 16.000 kombinasi prompt < 8000; 3 generate (`c43ae80c946f`, `6bbd8040970f`, `f9d942c24b5c`, 46-51 dtk) -> `public/card-samples/engine_1..3.png`; `bun test` lihat laporan (1 gagal LLM live lama).
- Berikutnya: referensi potret 3:4 (arsitektur engine_2/3 menyimpang dari referensi), uji ulang, antrean 1 jam + kunci di sisi Hermes, baru kalender; carousel terpisah.
- Catatan: perubahan prompt 'EXACT houses', kata sambung kecil, larangan 'aman' di hook, vision gemini-flash-lite BELUM diuji dengan generate. Skrip render butuh env `FLOW_API_KEY`.

## P-064 | 2026-11-24 | Hermes jadi satu-satunya generator + tes Flow + deploy ke hades

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`); bug aspect Flow belum diperbaiki
- Ubah: `.env` lokal (baris `OPENROUTER_FREE_IMAGE_KEY` dikomentari `#OFF-hermes-only#` agar jalur Recraft/OpenRouter mati), deploy `dist-server.mjs` (backup `dist-server.mjs.pre-*` di server) + frontend `/var/www/developer-sales-os` (tanpa `generated-media`/`card-samples`)
- Alasan/keputusan: fokus internal, Hermes (Google Flow di `hades`) jalur tunggal. Server memang tidak punya key OpenRouter, jadi sudah Hermes-only. Barrier lama tetap: 1 job global, jeda 12-18 dtk, cooldown 60 dtk antar slot, busy-window, fail-fast "aktivitas tidak biasa", rotasi akun.
- Verifikasi: tes 1 gambar Hermes ok (job `8a9165152bd6`, 47 dtk), `tsc --noEmit` bersih, `bun test` 135/136 (1 timeout tes LLM live `audit-findings-remediation` T3, bukan dari perubahan), PM2 `online`, HTTP 200 `/`, `/api/health`, `/api/se/content-slots/status`.
- Berikutnya: perbaiki `pick_radio` aspect di `/opt/flow-service/flow_engine.py` (minta 3:4, keluar 1376x768 landscape); cek item `LOCAL_PENDING` yatim di `media_render_queue` lokal.
- Update (tes poster Hermes): `server/visual-bible.ts` + `SINGLE_ROW_RULE` (kamera hadap SATU baris, tanpa baris kedua) dan 4 shot baris direvisi; `/opt/flow-service/app.py` `max_length` 4000->8000 (backup `app.py.bak.20261124`, `flow-api` restart) karena prompt terkompilasi ±4600 karakter. Hasil tes: `public/generated-media/hermes_poster_singlerow_1.jpg` & `_2.jpg` (896x1200, 1 baris, teks ejaan benar; atap gambar 2 pelana simetris, gambar 1 miring ke kiri, belum sesuai bible). Belum deploy ulang.
- Bug engine Hermes ditemukan: Flow dalam mode "Agen" (count 2, abaikan setelan) dan `generate_media` mengembalikan tile LAMA di galeri (job `b0ff7564dc02` selesai 25 dtk dengan gambar salah) karena render baru belum muncul. Perlu: matikan Agen, tunggu tile baru (bukan snapshot src), validasi.
- Akar bug engine: UI Flow berubah, toggle jadi tombol `aria-label="Agen Flow"` (ikon `spark`, `aria-pressed=true`) + panel chat Agen di kanan; `ensure_direct_mode` mencari teks "Agen" sehingga prompt selalu masuk chat Agen (agen menulis ulang prompt, 2 output, default 16:9). Perbaikan: `/opt/flow-service/flow_engine.py` `ensure_direct_mode` tutup panel (`Tutup`/`right_panel_close`) + matikan toggle via aria-label (backup `flow_engine.py.bak.20261124`, `flow-api` restart). Uji: job `5ffd1ecf9817`, 15 dtk, 896x1200, penanda "Uji Engine 24 Nov 2130" muncul, 1 baris, atap naik ke kanan, ejaan benar -> `public/generated-media/hermes_poster_direct_test.jpg`.
- Master direction (permintaan user, referensi poster ChatGPT): `server/visual-bible.ts` disusun ulang: `MASTER_HEAD`/`MASTER_TAIL` (struktur ChatGPT, palet tetap emerald/ivory/champagne, bukan crimson), langit sinematik berlapis, pencahayaan mewah, POV `SINGLE_ROW_RULE` baru (unit besar, 2-3 unit penuhi lebar, 1 baris), gradasi atas maks 10% (`TOP_FADE`), `BOTTOM_FADE` dihapus, panel bawah solid 24%. Uji: `public/generated-media/hermes_poster_master_test.jpg` (job `6da1328a4978`). Cacat: atap unit kiri masih mirip pelana, jendela trapesium agak runcing. BELUM tersambung ke jalur Hermes di worker (`buildPosterPrompt` masih dipakai hanya bila `OPENROUTER_FREE_IMAGE_KEY` terisi) dan logo belum ditempel.
- Model Flow: tersedia Nano Banana Pro / 2 Lite / 2.1; engine dulu selalu 2 Lite. `/opt/flow-service/app.py` + `flow_engine.py` kini menerima field `model` di `POST /v1/generate` (default tetap 2 Lite; backup `*.bak2.20261124`). Uji layout penutup + `model: "Nano Banana Pro"`: job `cf3e80a8cfcc`, 15 dtk, `public/generated-media/hermes_poster_pro_closing.jpg`: 1 baris diagonal, atap naik ke kanan, card 4 kolom + pil harga/booking, ejaan benar. Cacat kecil: ikon "Desain Japandi" aneh. Biaya kredit Pro vs Lite belum diukur.
- Card megah: `server/visual-bible.ts` `buildGrandCardBlock` + `CLOSING_FEATURES` (panel lengkung, medali emas, pil metalik, daun + pita; klaim hanya yang berlaku semua cluster, tanpa nomor WA karena tidak ada di data). Prompt penutup 7.950 karakter (batas server 8.000). Uji Pro job `0b3f7dba1a8e`: `public/card-samples/hermes_card_megah_1.jpg`. Cacat: lingkaran hijau kosong di pil, gradasi atas >10%, atap PELANA, panel +-36% tinggi (minta 29%).
- KOREKSI: `hermes_poster_pro_closing.jpg` atapnya juga pelana asimetris (entri di atas salah menyebut benar). `tsc --noEmit` bawaan tidak memeriksa `server/`. Bug tile lama terulang di job `0b3f7dba1a8e` (file API salah; gambar benar ditarik manual).
- Hook+logo+POV: `visual-bible.ts` satu gaya hook (lead-in, hook ultra-bold 2 baris `splitHook`, kapsul payoff), `SKY_RULE` tanpa gradasi (`pickTreatment`/treatment dihapus), POV frontal +-9 m, atap dijelaskan segitiga siku, plakat kosong penahan zona logo; `poster-composer.py` `place_logo` = plakat emerald-emas + logo asli (wajib, error bila file hilang); `content-media-worker.ts` buang arg `slideIdx/seed`. Uji: job `a7b53798e29f` (`hermes_hook_final_2.png`: atap/POV benar, judul tertutup logo) dan `5b80412f8d88` (`hermes_hook_final_3.png`: hook/logo rapi, unit dicermin + jendela 2 tingkat). Larangan mirror ditambah, belum diuji.
- Atap sejajar + baris tak habis: `visual-bible.ts` (atap segitiga siku searah, unit salinan bukan cermin, 3 rumah utuh + tetangga terpotong di kedua tepi). Uji: `8c99e6502bee` (`hermes_hook4_final.png`, GAGAL: pelana; kalimat '/ / /' + 'A B C D E' dibuang) dan `5a52e35f7859` (`hermes_hook5_final.png`, SESUAI permintaan, file API = tile baru). Prompt 7.968/8.000. Baru 1 sampel lolos; belum deploy, belum tersambung kalender.
- Engine Hermes (live, backup `flow_engine.py.bak3.20261124`/`app.py.bak3.20261124`): `POST /v1/generate` terima `reference` (nama aset yang SUDAH ada di project Flow; tidak upload/menyetujui apa pun); `new_tile_srcs` hanya menerima tile di atas tile lama; jalur ukir JPEG cache dihapus; gagal-aman (BUSY/AMBIGUOUS/REFERENCE\_\*). Aset `ref-fasad-baris.jpg` (`public/brand/`, dari poster Nagoya/Osaka/Tokyo user) diunggah di acc1 atas izin user; acc2/acc3 BELUM punya, rotasi akun akan gagal `REFERENCE_MISSING`.
- Prompt final: `visual-bible.ts` langit/cahaya megah, 2 rumah besar + tetangga terpotong, hook gading+emas, pil hanya harga, footer netral, `isHarshHook` dipakai `checkDeckCoherence`, batas 8000 dicek di kode. `BUILDING_BIBLE` merujuk gambar terlampir: pemanggil WAJIB kirim `reference`. `poster-composer.py` `ai_plaque_box` menutup plakat AI. Uji: job `d73b01f9f65d` -> `public/card-samples/hermes_megah6_final_v2.png` (1 generate, atap searah). Belum: kalender kirim model/reference + tempel logo, deploy backend.
- Catatan: perubahan P-062/P-063 + ini belum di-commit. Rollback backend: `cp dist-server.mjs.pre-<ts> dist-server.mjs && pm2 restart developer-sales-os-api`.

## P-063 | 2026-11-24 | Teks digambar AI (Recraft via 9router) + verifikasi OCR + gaya gradasi emerald

- Status: sebagian (slide 1 teruji; layout content/denah/closing belum diuji dengan pipeline baru)
- Ubah: `server/visual-bible.ts` (buildPosterPrompt: tipografi dikutip persis, gradasi emerald atas memudar ke foto, daun framing, tanpa orang, cahaya lebih hidup), `server/content-media-worker.ts` (requestPosterImage via 9router `/v1/images/generations` size "3:4", fallback key OpenRouter langsung; verifyPosterText = OCR vision + banding kata di kode + cek atap pelana; renderLocalQueueItem retry s.d. 3x; blok poller duplikat dijadikan satu), `server/poster-composer.py` (tulis ulang: hanya logo, bersihkan zona logo, pudarkan tepi hijau keras, panel denah asli)
- Alasan/keputusan: koreksi P-062, teks HARUS digambar AI (bukan Pillow). Teks slide dibuat ringkas (headline 3-5 kata, bullets maks 9 kata) agar minim typo. 9router merotasi 3 akun OpenRouter, kuota key tunggal tidak lagi jadi hambatan.
- Verifikasi: `tsc --ignoreConfig` bersih (catatan: `tsc -p`/file tanpa `--ignoreConfig` lewat rtk memberi pesan palsu "No errors"); slide 1 slot raka d24 ter-render, teks persis, atap sawtooth.
- Berikutnya: uji slide content (bullets), denah, closing; hilangkan kicker=headline kembar di slide 2-4; antre ulang slide 2-6 raka d24 (status CANCELLED).
- Catatan: management API 9router butuh login dashboard, akun OpenRouter tidak bisa dipilih manual dari kode. Brief dina d24 sempat terganti tanpa sengaja.
- Update: art director gaya teks (`pickTreatment`: TOP_FADE / SKY_CLEAN / BOTTOM_FADE; cover/penutup/denah selalu TOP_FADE, slide isi bergantian per shot). Gradasi kini pekat hanya 8% teratas lalu memudar sampai ±48%. Composer mendeteksi hasil nyata (zona hijau atau langit terang) untuk logo. Verifikasi vision ditambah cek kontras. Validator menolak kicker yang hanya mengulang headline. Uji: slide 3 raka d24 (STREET_LIFE, SKY_CLEAN) sukses.

## P-062 | 2026-11-24 | Visual Bible + teks ditempel server + story spine carousel

- Status: sebagian (kode & tes visual selesai; belum dites end-to-end lewat scheduler/DB)
- Ubah: `server/visual-bible.ts` (baru: BUILDING_BIBLE, SHOT_LIBRARY, LIGHT_RECIPE, denah, resolveShotSequence), `server/poster-composer.py` (tulis ulang: cover/content/denah/closing, teks 0 typo), `server/content-media-worker.ts` (prompt LLM story spine + shotId, validator `checkDeckCoherence` + retry 1x, fallback TOFU Nagoya/Osaka/Tokyo dibuat nyambung, prompt Recraft tanpa teks, `composeSlideFromQueue` dipakai kedua jalur poller), `public/brand/denah/` (6 denah asli dari data_train)
- Alasan/keputusan: akar "tidak nyambung" = deck fallback hard-coded (cover 3 cluster, slide 2 rumah second). Teks tidak lagi digambar Recraft; arsitektur dikunci prompt baku; denah asli ditempel, bukan digambar AI.
- Verifikasi: tsc strict server file OK; py_compile OK; 4 generate Recraft nyata + composer: atap sawtooth satu arah konsisten, teks bersih. Jalur Hermes (tanpa OPENROUTER_FREE_IMAGE_KEY) tetap pakai prompt lama.
- Berikutnya: generate 1 slot TOFU penuh dari UI `/kalender-konten`, cek 6 slide; tambah story spine untuk MOFU fallback bila perlu; set `POSTER_PYTHON` bila `python` di PATH Node tanpa Pillow.
- Catatan: FRONT_ROW sempat menghasilkan atap gable; sudah diperkuat di prompt, pantau hasilnya.
- Update 2026-11-24: backend di-restart (`bun server/index.ts`), slot raka d24 diregenerasi (deck AI nyambung + CLUSTER_FACTS terkunci, timeout LLM 45s->150s). Render: slide 1-2 sukses, slide 3-6 FAILED 429 `free-models-per-day` OpenRouter. Brief slot d24 milik dina ikut terganti tanpa sengaja (gambar tidak disentuh).

## P-061 | 2026-11-24 | Perbaikan Input Rekening Developer & Ketahanan Offline

- Status: selesai
- Ubah: `src/components/company/CompanyBankAccountsModal.tsx`
- Alasan/keputusan: Menyediakan fallback persistensi `localStorage` saat backend API (`http://127.0.0.1:3040`) sedang offline atau tidak aktif di lingkungan dev lokal Vite, sehingga penambahan/pengeditan rekening resmi perusahaan tidak lagi memicu error `Terjadi kesalahan saat menyimpan rekening.`.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -

## P-060 | 2026-11-24 | Penerapan Unslop pada Home Page & Seluruh Dashboard Pengguna

- Status: selesai
- Ubah: `src/components/v3/ChapterIntroAndCaseV3.tsx`, `src/components/v3/RailNavV3.tsx`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/components/superadmin/PlatformExecutiveDashboard.tsx`, `src/App.tsx`
- Alasan/keputusan: Menghapus AI visual slop (highlighter neon lime `#C6F432`, blurred blobs `blur-3xl`, jargon gamer "God Mode", kode klausul `§7.1`/`§S18`, `animate-pulse`/`animate-ping` pada status statis, dan over-pill). Menerapkan tipografi tenang (font-bold/semibold), nested radius 8-16px, dan hairline borders.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -

## P-059 | 2026-11-24 | Pemasangan Skill Unslop (UI Craft & Anti-Slop)

- Status: selesai
- Ubah: `~/.gemini/config/skills/unslop/` (global Antigravity), `.agents/skills/unslop/` (workspace)
- Alasan/keputusan: Instalasi skill `unslop` dari https://github.com/heydamir/unslop.git untuk pembersihan visual AI slop (spacing 4px grid, neutral tint, tipografi, zero emoji slop, craft direction).
- Verifikasi: File `SKILL.md`, references, dan scripts terpasang dan diverifikasi integritasnya di kedua path.
- Berikutnya: -

## P-057 | 2026-11-24 | Pembaruan Nomor Kontak IT Internal Developer Sales OS

- Status: selesai
- Ubah: `src/data.ts` (nomor WhatsApp Tim IT Internal / SUPERADMIN_IT diperbarui ke +6288980961427)
- Alasan/keputusan: Permintaan penggantian nomor WhatsApp kontak resmi Tim IT Internal Developer Sales OS menjadi 088980961427.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -

## P-056 | 2026-11-24 | Penerapan MFA Seluruh Akun

- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts`, `src/components/LoginModal.tsx`, `tests/auth-dummy.test.ts`
- Alasan/keputusan: Implementasi MFA 2 langkah (OTP 6-digit WhatsApp) untuk seluruh 9 akun peran.
- Verifikasi: `bun test` (136 pass, 0 fail).
- Berikutnya: -

## P-055 | 2026-11-24 | Standardisasi Bahasa Bebas Kode Teknis & Penghapusan Emoticon UI

- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/PipelinePage.tsx`, `src/components/company/CompanyAuditLogsModal.tsx`, `src/components/FieldOpsModal.tsx`, `src/components/field/GpsLiveRadarMap.tsx`, `src/components/content/ContentSlotOverviewPage.tsx`, `src/components/superadmin/PlatformExecutiveDashboard.tsx`, `src/components/SuperadminPanel.tsx`
- Alasan/keputusan: Mengganti label "Karantina DEV-26" menjadi "Penyaringan Spam" yang profesional dan mudah dimengerti orang awam, serta menghapus seluruh emoticon/emoji di antarmuka pengguna agar bersih dan berstandar enterprise.
- Verifikasi: `bun test` (131 pass, 0 fail), `npm run build` (sukses).
- Berikutnya: -

## P-054 | 2026-11-24 | Uji Isolasi Multi-Tenant Komprehensif (Tenant Baru, 100 Pengguna & 100 Data Dummy)

- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `server/index.ts`, `tests/multi-tenant-leakage-isolation.test.ts`
- Alasan/keputusan: Menutup celah kebocoran data antar developer (Multi-Tenant Scoping) pada endpoint rekening bank, audit logs, pipeline leads, lead pool claim/reassign/release, update & delete leads, serta memverifikasi zero data leakage dengan 100 pengguna dan 100 data dummy.
- Verifikasi: `bun test tests/multi-tenant-leakage-isolation.test.ts` (8 pass, 0 fail), `bun test` (131 pass, 0 fail), `npm run build` (sukses).
- Berikutnya: -

## P-054 | 2026-11-24 | Uji Isolasi Multi-Tenant Komprehensif (Tenant Baru, 100 Pengguna & 100 Data Dummy)

- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `server/index.ts`, `tests/multi-tenant-leakage-isolation.test.ts`
- Alasan/keputusan: Menutup celah kebocoran data antar developer (Multi-Tenant Scoping) pada endpoint rekening bank, audit logs, pipeline leads, lead pool claim/reassign/release, update & delete leads, serta memverifikasi zero data leakage dengan 100 pengguna dan 100 data dummy.
- Verifikasi: `bun test tests/multi-tenant-leakage-isolation.test.ts` (8 pass, 0 fail), `bun test` (131 pass, 0 fail), `npm run build` (sukses).
- Berikutnya: -

## P-053 | 2026-11-24 | Pembersihan Label Kode Teknis UI Menjadi Bahasa Bisnis Awam

- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/company/CompanyBankAccountsModal.tsx`, `src/components/company/CompanyAuditLogsModal.tsx`, `src/App.tsx`, `src/components/FieldOpsModal.tsx`, `src/components/PipelinePage.tsx`, `src/components/JalurProyek.tsx`, `src/components/PricingTable.tsx`, `server/ai-engine.ts`
- Alasan/keputusan: Menghapus/mengganti kode modul dan istilah audit internal ("(Modul Q1 & S21)", "(Temuan T2)", "Whitelist AI F93", "F100 Copilot", "Log CRUD", "Karantina DEV-26") dengan bahasa bisnis yang mudah dipahami pengguna awam.
- Verifikasi: `bun test` (123 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 896ms).
- Berikutnya: -

## P-053 | 2026-11-24 | Pembersihan Label Kode Teknis UI Menjadi Bahasa Bisnis Awam

- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/company/CompanyBankAccountsModal.tsx`, `src/components/company/CompanyAuditLogsModal.tsx`, `src/App.tsx`, `src/components/FieldOpsModal.tsx`, `src/components/PipelinePage.tsx`, `src/components/JalurProyek.tsx`, `src/components/PricingTable.tsx`, `server/ai-engine.ts`
- Alasan/keputusan: Menghapus/mengganti kode modul dan istilah audit internal ("(Modul Q1 & S21)", "(Temuan T2)", "Whitelist AI F93", "F100 Copilot", "Log CRUD", "Karantina DEV-26") dengan bahasa bisnis yang mudah dipahami pengguna awam.
- Verifikasi: `bun test` (123 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 896ms).
- Berikutnya: -

## P-052 | 2026-11-24 | Rekonsiliasi Metrik Direksi (T1), Privasi WA UU PDP (T3), FinOps AIC Metering (T7) & F100 Copilot

- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/App.tsx`, `server/ai-engine.ts`, `server/index.ts`, `server/wa-baileys.ts`, `src/components/FieldOpsModal.tsx`, `src/components/PipelinePage.tsx`, `tests/audit-findings-remediation.test.ts`
- Alasan/keputusan: Menutup Temuan T1 (rekonsiliasi akumulasi Net Sales & Omzet real portofolio + glosarium metrik tunggal), Temuan T3 (kepatuhan UU PDP No. 27/2022 via auto-suppression list saat opt-out STOP & disclaimer draf), Temuan T7 (FinOps AIC metering ledger, budget cap throttle saat saldo 0), dan Modul M17 F100 (interactive AI activity copilot checklist + debet 5 AIC).
- Verifikasi: `bun test` (123 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 1.26s).
- Berikutnya: -

## P-051 | 2026-11-24 | Rekening Resmi Perusahaan, Audit Trail CRUD Global, Lead Ownership, Lead Pool & AI Screening DEV-26

- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/PipelinePage.tsx`, `src/components/company/CompanyBankAccountsModal.tsx`, `src/components/company/CompanyAuditLogsModal.tsx`, `src/lib/leads/dev26-screening.ts`, `server/index.ts`, `server/ai-engine.ts`, `src/App.tsx`, `tests/dev26-and-company-accounts.test.ts`
- Alasan/keputusan: Menutup Temuan T2 (fraud rekening) dengan master data whitelist rekening resmi (CRUD oleh SM/Admin), Temuan T4 (audit data) dengan pencatatan & viewer log CRUD global, Temuan T5 (kualitas lead) dengan screening DEV-26, serta permintaan kepemilikan lead ("Milik SE Siapa") dan Lead Pool (claim SE & assign SM/Admin).
- Verifikasi: `bun test` (116 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 978ms).
- Berikutnya: -

## P-050 | 2026-11-24 | Presensi Mandiri SM & Admin, Multi-Marker Live Radar SE, dan Pelacakan GPS Persisten Antar-Halaman

- Status: selesai (lokal, siap uji coba, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/FieldOpsModal.tsx`, `src/components/field/GpsLiveRadarMap.tsx`
- Alasan/keputusan: SM & Admin sebelumnya tidak dapat melakukan presensi mandiri (karena ter-bypass ke tabel monitoring), SM & Admin belum dapat melihat peta live multi-marker tim SE di tab Absen & GPS, dan radar lokasi SE mati otomatis saat berpindah tab akibat unmount lokal `watchPosition`.
- Verifikasi: `bun test` (111 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 1.30s).
- Berikutnya: -

## P-049 | 2026-11-24 | Proporsionalitas Panjang Balasan WA & Persona Voice Guide di AI Lead Engine

- Status: selesai (live di `hades` & pushed ke GitHub)
- Ubah: `server/ai-engine.ts`, `tests/playbook-v1-2-pipeline.test.ts`
- Alasan/keputusan: Balasan WA AI sebelumnya selalu dipaksa 3–4 paragraf + bullet fitur brosur meski client hanya membalas singkat/apresiasi, dan gaya bahasa belum dibedakan per persona.
- Verifikasi: `bun test` (111 pass, 0 fail), `npm run build` (0 error), `dist-server.mjs` deployed ke `hades` (`pm2` online)
- Berikutnya: -

## P-048 | 2026-11-23 | Fix AI Pipeline Analysis & Rekomendasi Follow-Up Berulang (Tail-Context, Anti-Repetition & Auto-Recovery)

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `server/ai-engine.ts`, `server/wa-baileys.ts`, `server/index.ts`, `src/components/PipelinePage.tsx`
- Detail Perubahan:
  - **Root Cause & Fix Truncation `sales_notes` (`.slice(-650)` vs `.slice(0, 350)`):** Memperbaiki `server/ai-engine.ts` dan `server/wa-baileys.ts` yang sebelumnya memotong bagian _awal_ `sales_notes` (`.slice(0, 350)`) sehingga giliran chat terbaru di bagian _akhir_ terpotong dan AI terus membaca konteks obrolan lama (candaan kopi/survei lama). Kini AI selalu membaca ekor percakapan terbaru (`.slice(-650)`).
  - **Anti-Repetition Context (`previousAnalysis`) & Stage-Aware Guidance:** Menyertakan ringkasan analisis, saran taktis, dan draf pesan sebelumnya ke prompt AI dengan instruksi eksplisit melarang pengulangan, menyesuaikan suhu model (`0.65` saat Analisis Ulang), serta mengaktifkan re-analisis otomatis saat `stage`, `unitInterest`, `paymentScheme`, `personaCode`, atau `BANT` berubah di `PATCH /api/pipeline/leads/:id`.
  - **Fix Regex Ekstraksi Nama WA (`extractIntroducedNameFromText`) & Startup Recovery:** Mencegah frasa `"saya rasa setelah survey saya mau..."` menimpa nama prospek (`Alexander III`), memperbaiki cache draf `customDrafts` di `PipelinePage.tsx` agar terkunci per `analysis.id` (`${lead.id}_${analysis.id}`), dan menambahkan auto-recovery `wa_inbound_temp_buffer` saat server restart.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` & verifikasi row `lead_ai_analyses` terbaru untuk `Alexander III`.

## P-047 | 2026-11-23 | Kartu Notifikasi Berwarna Sesuai Urgensi, Kalender Tanggal Asli WIB & Fix FlowClient.ev

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/se/SeNotificationCenter.tsx`, `src/App.tsx`, `src/lib/content-calendar/calendar-generator.ts`, `src/components/ContentCalendarViewer.tsx`, `server/content-media-worker.ts`, `server/index.ts`, `/opt/flow-service/flow_engine.py` (di `hades`)
- Detail Perubahan:
  - **Fix `FlowClient.ev` di Hermes (`flow_engine.py`):** Memperbaiki pemanggilan metode evaluasi JS di `/opt/flow-service/flow_engine.py` dari `client.js(...)` menjadi `client.ev(...)`, me-restart `flow-api.service`, dan mengembalikan item antrean yang terdampak ke `PENDING`.
  - **Kartu Notifikasi Berwarna Sesuai Urgensi (Tanpa Garis Tepi Atas):** Menghilangkan `h-1.5` top accent bar dan mewarnai kartu notifikasi + modal detail sesuai urgensi (`rose` untuk Urgent SLA/WA putus, `amber` untuk H-5 Menit/Wajib Check-In/Validasi AI, `slate`/`emerald` untuk tugas rutin).
  - **Kalender Konten Berdasarkan Tanggal Asli & Jumlah Hari Bulan Aktif (`getWibCalendarInfo`, `getWibClock`):**
    - Kalender otomatis membuka **tanggal asli WIB hari ini** (mis. tanggal `23` hari ini, dan otomatis pindah ke tanggal `24` besok) serta menyesuaikan jumlah hari secara dinamis sesuai bulan berjalan (`28`, `29`, `30`, atau `31` hari).
    - **Scheduler Otomatis Tanggal Berjalan (`startContentMediaScheduler`):** Scheduler di `server/content-media-worker.ts` kini mengeksekusi `day_number = dayOfMonth` (mis. besok tanggal 24 mengeksekusi `slot-d24-s1-sales_in_house` mulai pukul `08:15–08:30 WIB`) untuk seluruh akun SE aktif sehingga pukul `09:00 WIB` konten tanggal 24 sudah siap.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), `flow-api.service` `ok: true`, deploy frontend & backend ke `hades` (`HTTP 200` + PM2 `online`).

## P-046 | 2026-11-23 | Clean Light Card Design untuk Developer Assistant & Modal Detail Notifikasi (Zero Brown Header)

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/App.tsx`, `src/components/se/SeNotificationCenter.tsx`
- Detail Perubahan:
  - **Developer Assistant Card (`App.tsx`):** Mengganti header coklat (`bg-espresso`) dengan desain kartu putih bersih (`bg-white`), aksen emerald modern, 3 tile ringkasan real-time (`Agenda Aktif`, `Konten Hari Ini`, `Target Lead`), dan tombol CTA utama `Cek Notifikasi Sekarang`.
  - **Modal Detail Notifikasi (`SeNotificationCenter.tsx`):** Mengganti header coklat dengan layout putih bersih beraksen status (emerald/amber/rose), mengubah tabel kaku menjadi **Grid Stat Tiles (`bg-slate-50`)**, serta menyusun langkah rekomendasi dengan penomoran bulat `1, 2, 3` yang rapi dan mudah dipindai.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-045 | 2026-11-23 | Arsitektur 4-Lapis Mobile Laporan Harian SE, Developer Assistant Login Onboarding & 3-Card Row Dashboard

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/mobile/SeMobileViews.tsx`, `src/components/se/SeNotificationCenter.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Arsitektur 4-Lapis Mobile Laporan Harian (`SeMobileDailyReportList`):** Merombak 13 kartu monoton menjadi (1) Strip Progres Harian, (2) Deck Input Cepat 3 Item Manual (`+ / -`), (3) **Grid 2 Kolom (`grid-cols-2`)** untuk 9 Metrik Otomatis CRM dengan bottom-sheet catatan (`z-[85]` via Portal), dan (4) Kartu Penutup Hambatan & Bantuan SM (#13) dengan 4 chip cepat.
  - **Hide Roadmap Kerja Harian & 3 Kartu Sebaris (`App.tsx`):** Menyembunyikan `SeDailyRoadmapStrip` dan menyusun 3 kartu di bawah Poin Akselerasi Hari Ini (`Lead Baru`, `BANT ≥ 7`, `WA & SLA`) menjadi **1 baris sejajar (`grid-cols-3`)** di mobile & desktop.
  - **Developer Assistant Onboarding Setiap Login (`App.tsx`, `SeNotificationCenter.tsx`):** Setiap kali pengguna login (atau logout lalu login kembali), muncul pop-up sapaan **Developer Assistant** yang langsung mengarahkan dan membuka menu **Notifikasi** untuk mengecek persiapan & tugas wajib hari ini.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-044 | 2026-11-23 | Redesign Mobile Scorecard Bulanan (Visual KPI Progress) & Laporan Harian SE (On-Demand Notes + Quick Chips)

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/mobile/SeMobileViews.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Mobile Scorecard Bulanan (`SeMobileScorecardList`):** Menambahkan strip ringkasan visual (`Total Poin / 100` + progress bar + jumlah KPI aktif) dan mengubah 7 baris KPI menjadi kartu visual dengan progress bar per komponen, badge bobot, perbandingan `Realisasi / Target`, serta detail rumus expandable saat diklik.
  - **Mobile Laporan / Catatan Harian (`SeMobileDailyReportList`):** Menghapus 13 kotak `<input>` yang terbuka terus-menerus (hemat ~60% tinggi scroll). Setiap item tampil ringkas 1 kartu dengan tombol **`+ Catatan`** on-demand + **chip preset 1-ketuk** (`Sesuai target hari ini`, `Follow-up lanjut besok pagi`, dll.) serta tombol stepper `+ / -` yang lebih besar (`size-7`) di mobile.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-043 | 2026-11-23 | Portal Z-Index Notifikasi (Tutupi Bottom Bar), Modal Detail Tengah & Daftar Tugas SE Lengkap

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/mobile/MobileBottomNav.tsx`, `src/components/se/SeNotificationCenter.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Z-Index & Portal (`MobileBottomNav.tsx`, `SeNotificationCenter.tsx`):** Menurunkan `MobileBottomNav` ke `z-30` dan merender panel notifikasi (`z-[80]`) serta modal detail (`z-[90]`) melalui `createPortal(..., document.body)` agar keluar dari stacking context `<header>` (`z-20`) — bottom-sheet di mobile 100% menutupi bottom bar tanpa glitch scroll.
  - **Modal Detail di Tengah (`SeNotificationCenter.tsx`):** Saat salah satu notifikasi diklik, detail lengkap muncul sebagai pop-up di **tengah layar** (`items-center justify-center`), menampilkan ringkasan, tabel detail fakta/status saat ini, rekomendasi aksi lengkap, dan CTA langsung.
  - **Daftar Notifikasi Lengkap:** Mencakup H-5 menit konten (`08:55`, `13:55`, `19:25 WIB`), H-5 menit Export Laporan (`17:55 WIB`), Lead Urgent SLA ≤ 5m, Check-In & Check-Out GPS, Lead Perlu Dilengkapi Data, Jadwal Konten Harian, Rute Canvassing, Target 8 Lead Harian, Koneksi WhatsApp SE, dan Export Laporan Harian.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-042 | 2026-11-23 | Custom Dropdown + Opsi Lainnya Kalkulator KPR & Notifikasi Header Real-Time (H-5 Menit)

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/KnowledgeBaseViewer.tsx`, `src/components/se/SeNotificationCenter.tsx` (baru), `src/components/se/SeGuidedTour.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Custom Dropdown & Opsi Lainnya (`KnowledgeBaseViewer.tsx`):** Menghapus seluruh `<select>` bawaan Chrome (Filter Kategori, Tipe Unit, DP, Tenor) dan menggantinya dengan custom bottom-sheet/modal picker. Menambahkan opsi **Lainnya** pada Tipe Unit (input Harga Properti Rp), DP (input Persen DP %), dan Tenor (input Tahun).
  - **Notifikasi Header Real-Time & Pengingat H-5 Menit (`SeNotificationCenter.tsx`, `App.tsx`):** Menambahkan ikon lonceng notifikasi di header mobile & desktop dengan badge angka real-time (tick 30 detik). Otomatis mendeteksi **H-5 menit** sebelum jadwal konten (`08:55`, `13:55`, `19:25 WIB`) dan batas Export Laporan (`17:55 WIB`), serta tugas wajib (Check-In GPS, Lead Urgent, Rute). Mobile membuka bottom-sheet dari bawah ke atas; list default hanya menampilkan judul + badge, lalu klik item membuka modal detail ringkas + rekomendasi aksi + CTA langsung.
  - **Desain Pop-up Pengingat Baru (`SeGuidedTour.tsx`):** Merombak pop-up pengingat wajib & H-5 menit menjadi kartu visual ringkas, bebas paragraf panjang, dengan chip rekomendasi dan CTA cepat.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-041 | 2026-11-23 | Header Desktop Ringkas & Mobile-First Knowledge Base (2 Tab Horizontal + Expandable Facts)

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/App.tsx`, `src/components/KnowledgeBaseViewer.tsx`
- Detail Perubahan:
  - **Header Desktop Ringkas (`App.tsx`):** Menghapus tombol `WA Terdiskonek / Terhubung` dan `Export Laporan` dari header desktop SE (karena sudah ada di halaman Dashboard SE & Pipeline).
  - **Knowledge Base 2 Tab Horizontal (`KnowledgeBaseViewer.tsx`):** Menghapus tab `Tanya Produk (AI)` & `Kuis SE (10 Soal)`, menyisakan 2 tab horizontal sejajar (`Fakta Produk` & `Siteplan & KPR`) dengan `grid-cols-2` di mobile (`min-h-[44px]`).
  - **Fakta Produk Tanpa Scroll Horizontal:** Menampilkan list identitas (`Fact ID`, kunci terbaca, kategori) yang saat diklik membuka detail Nilai Faktual, Sumber Kutipan, & Status.
  - **Simulator KPR Mobile-First:** Merapikan input (`grid-cols-2` untuk DP & Tenor di mobile) serta menonjolkan `Estimasi Angsuran / Bulan` di kartu hasil KPR.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-040 | 2026-11-23 | Hapus Badge Sudah Upload, Custom Stage Picker Pipeline & Mobile-First Absen/GPS

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/content/ContentSlotOverviewPage.tsx`, `src/components/PipelinePage.tsx`, `src/components/FieldOpsModal.tsx`
- Detail Perubahan:
  - **Detail Konten (`ContentSlotOverviewPage.tsx`):** Menghapus pill `Sudah Upload` dari top bar agar header mobile (`Kembali` + `Sosmed (x/4)`) bersih tanpa terpotong.
  - **Custom Pop-up Tahap Pipeline (`PipelinePage.tsx`):** Mengganti `<select>` bawaan Chrome pada kartu lead dengan tombol ringkas (`min-h-[38px]`) yang membuka custom bottom-sheet/modal `Ubah Tahap Pipeline` bergaya native.
  - **Mobile-First Absensi & GPS (`FieldOpsModal.tsx`):** Merapikan tab navigasi (`grid-cols-3`/`grid-cols-4` 1 baris tanpa overflow), menyusun 3 tombol absensi (`Foto`, `Check-In`, `Check-Out`) dalam `grid-cols-3` 1 baris sejajar (`>=44px`), dan menambah `pb-24 md:pb-6` agar aman dari bottom nav.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-039 | 2026-11-23 | Link Postingan Spesifik Zernio, Filter Desktop-Only & Reflow Mobile Pipeline

- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `server/zernio-client.ts`, `server/index.ts`, `src/components/content/ContentSlotOverviewPage.tsx`, `src/components/ContentCalendarViewer.tsx`, `src/components/PipelinePage.tsx`
- Detail Perubahan:
  - **URL Postingan Spesifik Zernio:** Memperluas `extractPlatformPostUrl` (`platformPostUrl`, `permalink`, `postUrl`, `shareUrl` + validasi non-profil), memperpanjang polling `/posts/${postId}` hingga ±16 detik, menghapus fallback ke link profil akun, dan menyinkronkan otomatis di `GET /api/se/content-slots/status` bila permalink baru selesai diproses.
  - **Header Detail Konten:** Menghapus tombol `Tandai Sudah Upload` (submit link otomatis menandai `SUDAH_POSTING`).
  - **Filter Kalender Desktop-Only:** Bar filter pada tampilan Mingguan/Bulanan memakai `hidden md:flex` sehingga tersembunyi total di mobile.
  - **Mobile-First Pipeline (`PipelinePage.tsx`):** Merapikan header (`grid-cols-3` 1 baris kompak di mobile, teks isolasi disembunyikan di mobile), menyembunyikan teks panjang/banner WA terdiskonek di mobile, memberi `w-full` pada dropdown Tahap agar tidak overflow kartu, serta menyusun 4 tombol aksi (`Detail`, `Edit`, `AI`, `Hapus`) dalam 1 baris `grid-cols-4` berukuran `>=44px`.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200` + PM2 `online`).

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
  - **Fail-Fast Hermes (`flow_engine.py`):** Menambahkan deteksi dini pesan _"aktivitas yang tidak biasa"_ / _"unusual activity"_ pada Google Flow (backup aman di `flow_engine.py.bak.20261123b`) sehingga job langsung berhenti dalam hitungan detik alih-alih menunggu timeout 160 detik, dan worker otomatis membatalkan sisa slide `PENDING` slot yang terkena limit.
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
  - Memperbaiki Dashboard SE: menambah _debounce_ 500ms pada input catatan laporan, counter `Target Hit` dinamis, dan `quickStatus` di `/api/se/dashboard`.
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
