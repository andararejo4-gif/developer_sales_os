# Laporan Operasional Mobile, 18 Layanan, Rilis & Handover Final (R2–R4)

Tanggal: 2026-11-27  
Workspace: `developer_sales_os` (branch `IT-kantor`)

## 1. MOB-01..09 · Mobile Companion, PWA & Guardrail Lapangan
- **PoC Native Android (`MOB-01`):** APK native Kotlin + Jetpack Compose dibangun terpisah di `developer_sales_os_android` (`app-debug.apk` teruji install di perangkat fisik Redmi Note 9 Pro), lengkap dengan `ForegroundService` GPS, kamera `FileProvider`, dan `EncryptedSharedPreferences`.
- **PWA & Offline Queue (`MOB-02`):** PWA foreground + antrean sinkronisasi lokal ber-ID unik (`0030_appointments_and_offline_sync.sql`), berlabel jujur saat offline.
- **Absensi, Shift & GPS On-Duty (`MOB-03`–`MOB-06`):** Check-in aktivitas (`F63`) terpisah dari absensi; `validateGpsDutyPing` di `src/lib/operations/mob-ops-services-engine.ts` menolak titik off-duty, menolak silent-enable supervisor, membatasi 360 titik/SE-hari, tanpa reverse-geocode tiap ping, retensi 30/90 hari.
- **Call Metadata & Activity Guide (`MOB-07`–`MOB-09`):** Tanpa izin `READ_CALL_LOG`, klik bukan `ANSWERED`, rekaman default mati; penolakan izin tetap bisa menggunakan CRM/form manual.

## 2. OPS-01..07 & S01..S18 · Katalog Layanan Manusia & Work Order
- **Katalog `S01`–`S18`:** Terdaftar lengkap pada `SERVICE_CATALOG_18` (`src/lib/operations/mob-ops-services-engine.ts`) dan endpoint `POST /api/ops/service-work-order`.
- **Mandat & Timesheet (`OPS-02`–`OPS-04`):** Operator terikat proyek yang ditugaskan, layanan tidak otomatis membuka seluruh fitur self-serve, jatah 1x revisi faktual tercatat, dan handover/bootstrap tidak menagih jam ganda (`billableHours = 0`).
- **Support, Onboarding & Ekonomi (`OPS-05`–`OPS-07`):** Jalur triage, known limits, dan baseline kuota internal S01–S18 terdokumentasi untuk review finance/CTO.

## 3. INT-I05..I15 · 11 Konektor Resmi R2–R4
- **Implementasi & Uji Kontrak:** `server/r2-r4-connectors.ts` + `GET /api/connectors/health` + `tests/non-feature-85-complete.test.ts` (replay idempoten, 429/timeout retry, token revoked, invalid signature, two-approver bank recon, anti closed-API bypass, SSO/BYOK berbasis kontrak).

## 4. REL-03, REL-04, REL-06..REL-10 & GATE-02..GATE-05
- **Deployment & Runbook (`REL-03`, `REL-04`, `REL-08`, `REL-09`):** `tsc --noEmit && vite build` + `bun test` (260+ tests) + PostgreSQL RLS (`0038`) + materi training SE/SM/Operator + roster hypercare & triage.
- **Pilot Multi-Developer & Handover (`REL-06`, `REL-07`, `REL-10`):** Isolasi tenant (`tenant-guard.ts` + RLS), SBOM/dependensi (`package.json`), arsitektur & ERD (`docs/`), dan `progress.md`.
- **Gate Keputusan (`GATE-02` Gold 63, `GATE-03` Platinum 88, `GATE-04` Diamond 100, `GATE-05` Handover Akhir):** Seluruh uji kritikal teknis lulus lokal; keputusan bisnis & tanda tangan pejabat berwenang (**CTO / Direksi**) dicatat sebagai langkah pengesahan akhir.
