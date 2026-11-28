# Laporan Rilis R1, Latihan Rollback & Paket Gate-01

Tanggal verifikasi: 2026-11-27  
Workspace: `developer_sales_os` (branch `IT-kantor`)

## 1. REL-01 · Manifest Release Candidate R1
- **Build & Typecheck:** `tsc --noEmit && vite build` (exit 0)
- **Test Suite:** `bun test` — 226+ tests across 45+ files (0 fail)
- **Migrasi Database:** `db/migrations/0001_*.sql` s.d. `0038_enable_tenant_rls.sql` (12 tabel inti `sales_os` aktif RLS)
- **Konektor Resmi R1:** `server/r1-connectors.ts` (`I01` LLM/OCR, `I02` Web Research, `I03` Maps/Routes, `I04` WhatsApp BSP, `I16` Domain/DNS)
- **Known Limits:**
  - Konektor eksternal berjalan dalam mode kontrak sandbox/guardrail sampai API key produksi vendor diisi di Vault/env.
  - Uji beban p95 skala penuh dan pengisian tanda tangan pejabat dilakukan pada tahap cutover produksi.

## 2. REL-02 · Latihan Rollback & Recovery (Staging Drill)
- **Prosedur Rollback Aplikasi:** `git revert <commit>` atau deploy tag stabil sebelumnya + `bun run build`.
- **Prosedur Restore Database:** Restore snapshot `pg_dump` sebelum migrasi terbaru (`db/backups/`) ke container `devsales-pg`, verifikasi idempotensi AIC ledger (`billable_event_id` unik) & outbox replay.
- **Kill Switch:** Nonaktifkan worker outbox / endpoint generatif dengan env flag sambil mempertahankan CRM, presensi, GPS, dan web tetap berjalan.
- **Target Drill:** RPO <= 24 jam, RTO <= 8 jam (snapshot lokal teruji via `pg_dump` / `devsales-pg`).

## 3. REL-05 · Closed Pilot The Park Sukoharjo (24 Fitur MVP)
- **Lingkup Data:** Unit & skema resmi The Park Sukoharjo (`U01`–`U04`), laporan harian SE/SM, riset pasar M01–M02 (`F07`–`F10`), materi sales, CRM pipeline, & WA consent gate.
- **Guardrail Pilot:** Tidak ada outreach/blast otomatis ke nomor publik tanpa persetujuan & gate manusia (`GATE-01`). Pilot internal bukan penjualan paket komersial final.

## 4. GATE-01 · Paket Bukti Go / No-Go
- **Tenant & Isolasi Data:** PostgreSQL RLS (`0038`) + `tenant-guard.ts` + pentest `11/11 PASS` (`P-130`).
- **Akurasi Harga/Rekening/Booking:** `truth-engine.ts` & `aic-ledger.ts` atomik (0 double-debit, 0 salah rekening kritis pada critical test suite).
- **Kepatuhan Opt-Out & Keamanan:** `wa-consent.ts`, `I04` signature & consent gate, malformed JSON 400, login rate-limit 429 & peringatan kesempatan terakhir (`P-129`).
- **Keputusan Akhir:** Siap ditinjau & diputuskan oleh pejabat berwenang (**CTO & Direksi**).
