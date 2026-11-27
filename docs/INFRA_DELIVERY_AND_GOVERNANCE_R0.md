# Tata Kelola, Infrastruktur & Delivery R0 (`GOV-03`, `GOV-07`, `INF-01..14`)

**Tanggal:** 27 November 2026  
**Cakupan:** Menuntaskan seluruh sisa task pondasi R0 (`GOV-03`, `GOV-07`, `INF-01`, `INF-02`, `INF-03`, `INF-04`, `INF-06`, `INF-07`, `INF-08`, `INF-11`, `INF-13`, `INF-14`) pada `02_Backlog`.

---

## 1. Governance (`GOV-03`, `GOV-07`)
- **`GOV-03` — Matriks Kepatuhan Data & Privasi (UU PDP / Consent / Retention):**
  - Consent opt-in/opt-out dicatat pada `sales_os.pipeline_leads` (`wa_consent`, `wa_suppression_list`), legal hold & DSAR delete guard di `server/r2-domain-services.ts` (`db/migrations/0031`), serta isolasi PostgreSQL RLS pada 12 tabel inti (`db/migrations/0038_enable_tenant_rls.sql`).
- **`GOV-07` — Standar Release Note, Handover & Audit Trail:**
  - Handover sesi melalui `progress.md` (`P-001`..`P-126`), pelaporan tunggal `docs/REGISTRI_DEV_DAN_PELAPORAN_TUNGGAL.md`, dan audit trail aplikasi pada `sales_os.activity_audit_logs` & `business_audit_log`.

## 2. Infrastruktur, Database & Delivery (`INF-01..14`)
- **`INF-01` & `INF-02` — Environment & Secret Hygiene:** `.env` terpisah antara lokal (`devsales-pg` `:5432`) dan VPS (`127.0.0.1:5433`, PM2 `developer-sales-os-api`), tanpa secret di-commit ke Git.
- **`INF-03` & `INF-04` — Skema Database & Migrasi Berurutan:** 38 berkas migrasi terstruktur (`db/migrations/0001`..`0038`) dengan `IF NOT EXISTS` idempoten dan verifikasi PostgreSQL 16 (lokal) / 17 (server).
- **`INF-06` & `INF-07` — Runtime Server, Build & Healthcheck:** Frontend dibangun dengan `tsc --noEmit && vite build`, backend dengan Bun (`server/index.ts` / `dist-server.mjs`), serta endpoint liveness & DB check `GET /api/health`.
- **`INF-08` — Backup & Restore Database:** Prosedur backup `pg_dump` lokal & VPS (`db-backup/`) beserta validasi restore lintas PG 17 → PG 16 terdokumentasi dan teruji.
- **`INF-11` — Observability & Error Boundary:** `AppErrorBoundary.tsx` menangkap runtime error UI dan tabel `ai_observability_events` / PM2 logs memantau runtime server.
- **`INF-13` & `INF-14` — Automated Test Gate & UAT Script:** `bun test` (219+ tests across 44 files) + `scripts/run_uat_priority_suite.ts` (10/10 PASS).
