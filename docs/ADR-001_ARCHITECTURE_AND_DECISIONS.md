# ADR-001: Arsitektur, Keputusan Tertunda (D01–D15), & Gerbang Kesiapan (GATE-00–05)

**Status:** Draft Siap Pengesahan Direksi / CTO / CFO / Legal / HR  
**Tanggal:** 2026-11-26  
**Cakupan Checklist:** `ARC-01..06`, `GOV-01..08`, `D01..D15`, `GATE-00..05`

---

## 1. Keputusan Default Teknis (D01–D15 — Menunggu Sign-Off Final)

| ID | Topik | Usulan Default Teknis | Pemilik Keputusan | Status |
|---|---|---|---|---|
| **D01** | Harga paket & unit AIC (`BIL-01`) | Gold Rp4,9jt / Platinum Rp12,9jt / Diamond Rp39,9jt per 3 bln kalender, setup Rp0 | Direksi & CFO | Menunggu Sign-Off |
| **D02** | Strategi Mobile SE (`MOB-01..09`) | PWA + Foreground/Session GPS dulu di R1; Native Android/iOS background di R2 setelah izin store | CTO & Product | Menunggu Sign-Off |
| **D03** | Domain & Subdomain Publik (`F31`) | Default `*.giivepro.id` (subdomain); custom domain CNAME tersedia di Diamond | CTO & Infra | Menunggu Sign-Off |
| **D04** | WhatsApp Provider (`INT-I04`) | Meta Cloud API / BSP resmi untuk blast & bot; sesi lokal hanya untuk dev/pilot | CTO & Legal | Menunggu Sign-Off |
| **D05** | Grace Period & Export (`BIL-12`) | 7 hari *grace period* penuh + 30 hari *read-only export* sebelum arsip | CFO & Legal | Menunggu Sign-Off |
| **D06** | Retensi Log Audit & GPS (`DAT-11`) | Audit ledger 5 tahun; koordinat GPS mentah 180 hari (agregat harian permanen) | Legal & HR | Menunggu Sign-Off |
| **D07** | Dual Approval Rekening (`SEC-13`) | Whitelist rekening bank developer wajib 2 approval (Finance + Direksi/Admin) | CFO & Direksi | Menunggu Sign-Off |
| **D08** | Kebijakan Refund Booking (`G3`) | Mengikuti klausul SPR masing-masing proyek; sistem hanya mencatat status & bukti | Legal & Finance | Menunggu Sign-Off |
| **D09** | Telemetry COGS AI (`BIL-13`) | Catat token in/out & estimasi biaya USD/IDR per tenant per job di tabel ledger | CFO & CTO | Menunggu Sign-Off |
| **D10** | Skema Pembayaran Unit (`F69-70`) | CK, CT12, CT24, KPR menggunakan aritmatika integer Rupiah deterministik (`deterministic-pricing.ts`) | Finance | Menunggu Sign-Off |
| **D11** | Batas AI Guide F100 (`BIL-03`) | Aktif hanya di Platinum & Diamond (5 AIC/aktivitas), diblokir di Gold server-side | Product & CFO | Menunggu Sign-Off |
| **D12** | Privasi Absensi & GPS (`SEC-09`) | GPS hanya aktif saat sesi kerja SE berjalan + consent tertulis | HR & Legal | Menunggu Sign-Off |
| **D13** | Human-in-the-Loop Konten (`AI-06`) | Publikasi iklan berbayar (G2) & transaksi/rekening (G3) wajib approval manusia | Marketing & Legal | Menunggu Sign-Off |
| **D14** | Disaster Recovery (`INF-12`) | RPO <= 1 jam, RTO <= 4 jam via PostgreSQL PITR & backup harian terenkripsi | CTO & Infra | Menunggu Sign-Off |
| **D15** | Pentest Independen (`SEC-14`) | Wajib sebelum Go-Live produksi publik penuh (GATE-05) | CTO & Security | Menunggu Sign-Off |

---

## 2. Kontrak Arsitektur (`ARC-01..06`)

### 2.1 Trust Boundary (`ARC-02`)
1. **Zona Publik (Untrusted):** Landing page proyek, form lead publik, webhook WhatsApp/PSP. Semua input wajib sanitasi, validasi schema, rate-limit, dan verifikasi HMAC/nonce (`src/lib/security/guardrails.ts`).
2. **Zona Aplikasi (Authenticated Tenant):** RBAC 6 peran (`SE`, `TL`, `SM`, `ADMIN`, `IT_DEVELOPER`, `DIREKSI`) + isolasi `tenant_id` & `project_id` pada setiap query.
3. **Zona Eksekusi Eksternal (Gated G0–G3):** Aksi keluar (publish web, iklan, WA blast, transaksi/rekening) wajib melewati `assertActionAllowedByGate` (`src/lib/gates/readiness-gates.ts`).
4. **Zona Ledger & Audit (Immutable):** Mutasi AIC (`FefoAicLedger`) dan audit trail bersifat *append-only* dengan `idempotencyKey`.

### 2.2 State Machine Utama (`ARC-05`)
- **Lead Pipeline:** `BARU -> DIHUBUNGI -> KUALIFIKASI -> SURVEY -> BOOKING_HOLD -> SPR_SIGNED -> AKAD_LUNAS` (atau `BATAL/COLD`).
- **Unit Hold (`F67`):** `AVAILABLE -> HELD (TTL Lock) -> BOOKED -> SOLD` (otomatis kembali `AVAILABLE` jika TTL habis).
- **AIC Reservation (`BIL-04/14`):** `RESERVED -> SETTLED | REFUNDED` (idempoten via `idempotencyKey`).
- **Subscription (`BIL-12`):** `ACTIVE -> GRACE_7D -> READ_ONLY_EXPORT_30D -> ARCHIVED`.

### 2.3 Kontrak Fallback Vendor (`ARC-06`)
- Jika LLM/AI provider gagal atau saldo AIC = 0: job generatif antre/refund reservasi otomatis; fitur non-generatif (`F43–F48`, `F91–F93`, `F97–F99`) tetap berjalan 100%.

---

## 3. Matriks Gerbang Rilis (`GATE-00..05`)

| Gate | Fokus | Status Lokal Saat Ini | Syarat Penutup |
|---|---|---|---|
| **GATE-00** | Governance, D01–D15, Baseline | Draft `ADR-001` siap | Sign-off Direksi/CTO/CFO/Legal |
| **GATE-01** | R0 Fondasi (Billing, Security, Guardrails, 48 Agent) | Modul inti & unit test lokal tersedia | Provisioning cloud KMS/PITR (`INF-01..14`) |
| **GATE-02** | R1 MVP (24 Fitur Inti) | Implementasi web & API lokal aktif | Uji E2E staging + `UT-01..10` sign-off |
| **GATE-03** | R2 Growth & Field Ops | Creator Desk & Live Radar GPS aktif | App Review Meta/Sosmed & matrix device fisik |
| **GATE-04** | R3 Enterprise & Finance | Kalkulator deterministik & lock siap | Whitelist bank dual-approval & integrasi ERP/PSP |
| **GATE-05** | R4 Go-Live Produksi | Guardrails & telemetry siap | Pentest independen (`SEC-14`) & DR drill (`INF-12`) |
