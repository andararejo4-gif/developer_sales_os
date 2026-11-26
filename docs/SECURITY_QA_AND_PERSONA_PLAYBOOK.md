# Security, QA & Persona Playbook (`UX-01`, `SEC-06/09/11/12/14`, `QA-01/06/07/08`)

Dokumen acuan standar keamanan aplikasi, tata kelola data, strategi QA, serta pemetaan perjalanan (*journey*) tiap persona pada **Developer Sales OS**.

---

## 1. Pemetaan Journey & Hak Persona (`UX-01`)

| Persona / Role | Tujuan Utama Harian | Batas Akses & Guardrail |
|---|---|---|
| `SE` (Sales Executive) | Absen GPS, rute canvassing, follow-up WA/CRM, ajukan Vault KPR & KPR Bank, ekspor laporan harian. | Hanya melihat/mengubah lead & pengajuan miliknya (`owner_se_email`); tidak bisa mengubah skenario target atau approve berkas. |
| `TL` (Team Leader) | Pantau SLA respon lead <= 5 menit, coaching harian, bantu eskalasi & jadwal survei tim. | Scope tim & proyek aktif; tidak bisa hapus user atau ubah whitelist bank. |
| `SM` (Sales Manager) | Monitor absensi & timeline GPS SE, atur skenario target (Konservatif/Realistis/Optimis), approve Vault KPR, kelola user 6 role. | Terisolasi per `tenant_id`; tidak bisa mengakses data tenant lain atau panel Superadmin Platform. |
| `ADMIN` | Verifikasi booking, Vault KPR, alur KPR Bank, garansi DLP, & kelola akun tim. | Perubahan sensitif tunduk pada `server_approvals` (`SEC-04` / `SEC-13`). |
| `DIREKSI` | Portofolio proyek, proyeksi cashflow, approval eskalasi diskon/refund, Control Tower. | Fokus eksekutif; menu operasional harian SE disembunyikan. |
| `IT` / `SUPERADMIN_IT` | Knowledge AI Terpusat (OCR), Permission Matrix CRUD 2-langkah, Audit Trail, Pre-Seed VIP & health DB. | Impersonasi wajib mencatat jejak audit dan memiliki tombol kembali ke sesi IT asli. |
| `REFERRAL_PARTNER` / `SALES_PARTNER` | Input referral, pantau status komisi & Creator Desk. | Tolak-default pada endpoint internal; hanya akses data miliknya. |

---

## 2. AppSec, Kebijakan Pekerja, DSAR/DPA & Incident Response (`SEC-06`, `SEC-09`, `SEC-11`, `SEC-12`, `SEC-14`)

- **AppSec Review & Perbaikan (`SEC-06`):**
  1. Autentikasi wajib server-side (`HttpOnly` cookie / Bearer token DB + TOTP 2FA `node:crypto`). Password dan akun demo dihapus dari bundle frontend.
  2. Seluruh transaksi stok unit, FEFO AIC ledger, dan appointment scheduler memakai `SELECT ... FOR UPDATE` di PostgreSQL.
  3. Webhook eksternal wajib lolos HMAC-SHA256 + anti-replay nonce (`SEC-10`).
  4. Outbound URL divalidasi anti-SSRF (`SEC-08`); log aplikasi dimasking dari PII/JWT (`SEC-07`).
- **Kebijakan Pekerja, Lokasi & Telepon (`SEC-09`):**
  - Pengambilan GPS & foto absensi hanya aktif saat jam kerja / aksi eksplisit SE dengan opsi fallback alasan bila GPS tidak tersedia.
  - Sesi WhatsApp Gateway Baileys terisolasi 1 nomor = 1 akun SE; pesan opt-out (`STOP`) langsung membatalkan antrean nurture (`F92-BE`).
- **DSAR, DPA & Vendor Data Terms (`SEC-11`):**
  - Permintaan penghapusan/ekspor data subjek (DSAR) wajib mengecek `sales_os.legal_holds` (`DAT-11`). Bila tidak ada legal hold aktif, data PII di-anonymize/dihapus dan dicatat di `business_audit_log`.
- **Incident Response & Drill (`SEC-12`):**
  - Prosedur: (1) Isolasi sesi/token terdampak, (2) Backup `pg_dump` sebelum mitigasi, (3) Aktifkan `legal_hold` jika insiden kepatuhan, (4) Restore dari `dist-server.mjs` + dump terakhir, (5) Post-mortem dalam 24 jam.
- **Scope Review / Pentest Independen (`SEC-14`):**
  - Fokus uji: IDOR lintas `tenant_id`, bypass `server_approvals`, race condition double-booking unit/appointment, replay webhook, dan prompt injection pada AI endpoint.

---

## 3. Strategi QA, Perangkat Mobile, A11y & Regresi (`QA-01`, `QA-06`, `QA-07`, `QA-08`)

- **Test Strategy & Definition of Done (`QA-01`):**
  - Setiap fitur wajib lolos: (a) `tsc --noEmit && vite build`, (b) `bun build server/index.ts`, (c) `bun test` (unit + integration PostgreSQL nyata tanpa mock DB untuk transaksi kritikal).
- **Fixture Perangkat Mobile (`QA-06`):**
  - Viewport acuan: 360×800 (Android entry-level), 390×844 (iOS/Android mid), dan 1280×800 (Desktop SM/Direksi).
  - Mode low-bandwidth & offline queue diuji melalui `offline_sync_queue` (`F97`, `F99`, `F100`).
- **Checklist A11y, UX & Export (`QA-07`):**
  - Kontras teks >= 4.5:1 (`espresso` di atas `sandstone`/putih), target sentuh mobile >= 44px, tabel panjang ramah mobile tanpa horizontal overflow, dan ekspor PDF/XLS/Comparison Pack menyimpan state sebelum unduh.
- **Paket Bukti & Laporan Regresi (`QA-08`):**
  - Seluruh suite `tests/*.test.ts` dijalankan setelah setiap perubahan backend/skema DB dan dicatat hasil pass/fail-nya.
