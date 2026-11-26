# Architecture & Contracts (`ARC-01..06`)

Dokumen arsitektur, batas kepercayaan (*trust boundary*), skema data, kontrak API, *state machine*, dan strategi *fallback* vendor untuk **Developer Sales OS** (PT Andara Rejo Makmur).

---

## ARC-01: Stack & Architecture Decision Record (ADR)

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Runtime & Test | Bun (`bun test`, `bun build`) | Eksekusi TypeScript native, cepat untuk backend API & unit/integration test. |
| Frontend | React + Vite + TypeScript + Tailwind CSS | SPA responsif dengan *code-splitting* dan integrasi *remote state* ke backend. |
| Backend API | `server/index.ts` (HTTP Server Bun/Node) | Monolith modular yang mudah di-audit, *single deployment unit*, minim *latency* antar-modul. |
| Database | PostgreSQL (`schema: sales_os`) | ACID transaction, `SELECT ... FOR UPDATE` untuk FEFO ledger, outbox, dan idempotency. |
| Deterministic Math | `src/lib/finance/deterministic-pricing.ts` | Semua perhitungan harga, DP, angsuran, dan margin dikunci di fungsi deterministik (bukan LLM). |

---

## ARC-02: Context & Trust Boundary

1. **Public / Unauthenticated Boundary:**
   - Widget / publik hanya boleh mengakses endpoint publik terbatas (mis. `/api/faq/grounded` dengan *AI disclosure* dan *grounding* dokumen terverifikasi) atau webhook bertanda tangan HMAC.
2. **Webhook Boundary (`SEC-10`):**
   - Semua webhook eksternal (WhatsApp/Payment) wajib lolos verifikasi HMAC-SHA256 (`verifyWebhookHmacAndReplay`), toleransi *timestamp skew* (`maxSkewSec = 300`), dan *replay nonce* di `sales_os.webhook_replay_nonces`.
3. **Tenant & Role Boundary (`SEC-04`, `SEC-13`):**
   - Setiap mutasi sensitif (perubahan whitelist bank, approval pengeluaran/refund, propagasi stale) dipaksa melewati validasi `tenantId`, `actorRole`, dan `server_approvals` di sisi server.
   - *Dual approval* (`requires_dual = true`) menolak *self-approval* dan menolak approver yang sama menyetujui dua kali.
4. **AI / Truth Boundary (`F49-BE`, `UT-07`):**
   - AI dilarang mengarang harga, ketersediaan unit, atau janji legal. Jika fakta tidak ada di `evidence_facts` / pengetahuan terverifikasi atau user meminta agen manusia, sistem otomatis eskalasi (`escalateToHuman: true`).

---

## ARC-03: Entity Relationship & Migration Lineage (`0001` – `0029`)

Database menggunakan schema `sales_os` di PostgreSQL (`devsales-pg`):
- **Core & App State (`0026_app_state_and_core_stores.sql`):** Penyimpanan *remote state* multi-tenant (`app_state`), profil pengguna, dan konfigurasi partner.
- **AIC Ledger & Audit (`0027_aic_ledger_fefo_and_audit.sql`):**
  - `aic_lots`: Lot kredit dengan `expires_at` dan `remaining_amount` (konsumsi FEFO atomik).
  - `aic_transactions`: Mutasi `TOPUP`, `RESERVE`, `SETTLE`, `REFUND`.
  - `audit_logs`: Jejak audit *append-only* per tenant.
- **Consent & Suppression (`0028_consent_suppression_registry.sql`):**
  - `wa_consent_registry` / `wa_suppression_list`: Pencatatan opt-out (`STOP`, `UNSUBSCRIBE`, dll.) dan pembatalan antrean nurture otomatis.
- **Security, Outbox, Approvals & Staleness (`0029_security_outbox_approvals_stale.sql`):**
  - `server_approvals`: Persetujuan server-side & dual-approval bank whitelist (`PENDING` -> `APPROVED` / `REJECTED` / `EXPIRED`).
  - `webhook_replay_nonces`: Kunci anti-replay `(provider, event_id)` dengan `expires_at`.
  - `durable_outbox`: Antrean job idempoten `(tenant_id, idempotency_key)` dengan retry counter dan status `DLQ`.
  - `asset_staleness_events`: Pencatatan propagasi perubahan harga/fakta ke aset terdampak (`PENDING_REVIEW` / `REFRESHED`).
- **Truth Engine (`server/truth-engine.ts`):** `source_documents`, `evidence_facts`.

---

## ARC-04: API, Idempotency & Error Contracts

| Endpoint | Method | Idempotency / Guard | Response Contract |
|---|---|---|---|
| `/api/approvals` | `POST` | Server-side TTL & `requiresDual` | `{ ok, approval }` (`201`/`200`) |
| `/api/approvals/approve` | `POST` | Reject self-approval & duplicate approver | `{ ok, status, error? }` (`200`/`400`) |
| `/api/outbox/enqueue` | `POST` | Unique `(tenant_id, idempotency_key)` | `{ enqueued, idempotentReplay, job }` (`200`) |
| `/api/truth/propagate-stale` | `POST` | Tenant-scoped asset flagging | `{ flaggedCount, flagged }` (`200`) |
| `/api/faq/grounded` | `POST` | Grounded-only + AI disclosure | `{ disclosure, grounded, isUnknown, escalateToHuman, answer, sources }` (`200`) |
| `/api/billing/aic/*` | `POST` | Atomic FEFO reserve/settle/refund | `{ ok, balance, transaction }` |

Format error standar: `{ error: string, code?: string }` dengan HTTP status `400` (validasi), `401`/`403` (auth/boundary), `409` (konflik state/idempotency), atau `500` (internal).

---

## ARC-05: Core State Machines

1. **Server Approval (`SEC-04`, `SEC-13`):**
   - `PENDING` -> (1 approver jika single, atau 2 approver berbeda jika `requires_dual`) -> `APPROVED`
   - `PENDING` -> (melewati `expires_at`) -> `EXPIRED` (tidak pernah auto-approve)
2. **Durable Outbox (`INF-10`):**
   - `PENDING` -> `PROCESSING` -> `SUCCEEDED`
   - `PROCESSING` -> (gagal & `attempts < max_attempts`) -> `RETRY_SCHEDULED`
   - `PROCESSING` -> (gagal & `attempts >= max_attempts`) -> `DLQ`
3. **Grace & Export Lifecycle (`BIL-12`):**
   - `now <= expires_at` -> `ACTIVE` (`canMutateAiOrSend: true`, `canReadDashboard: true`, `canFreeExport: true`)
   - `0 < daysExpired <= 7` -> `GRACE_READ_ONLY_7D` (`canMutateAiOrSend: false`, `canReadDashboard: true`, `canFreeExport: true`)
   - `7 < daysExpired <= 30` -> `EXPORT_ONLY_30D` (`canMutateAiOrSend: false`, `canReadDashboard: false`, `canFreeExport: true`)
   - `daysExpired > 30` -> `EXPIRED_LOCKED` (`canMutateAiOrSend: false`, `canReadDashboard: false`, `canFreeExport: false`)
4. **Nurture Execution (`F55-BE`):**
   - Sebelum kirim WA, cek `assertCanSendOutreach(tenantId, phone)`. Jika suppressed -> job dibatalkan (`CANCELLED_SUPPRESSED`), pesan tidak dikirim.

---

## ARC-06: Vendor & External Fallback Matrix

| Integrasi | Mode Utama | Fallback Lokal / Degradasi Aman |
|---|---|---|
| WhatsApp Gateway (BSP) | Webhook + Outbound API | Simulasi/dry-run ter-audit di `durable_outbox`; tetap enforce `wa_suppression_list`. |
| LLM / AI Provider | Gemini / Cloud LLM | `answerFaqGrounded` mengembalikan fakta terverifikasi dari DB atau eskalasi ke manusia (`escalateToHuman: true`). |
| Payment / Xendit | Webhook HMAC-SHA256 | Verifikasi lokal `verifyWebhookHmacAndReplay` + *manual bank whitelist* dengan `SEC-13` dual-approval. |
| Object Storage / CDN | Cloud Storage | Penyimpanan artefak & state lokal terstruktur di PostgreSQL (`sales_os`). |
