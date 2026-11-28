# Spesifikasi Teknis Fitur Core R0 & R1 (`-SP` Evidence)

**Tanggal:** 26 November 2026  
**Cakupan:** Subtask `-SP` (Spesifikasi Teknis & Kontrak API/UI) untuk fitur core R0/R1 yang telah diimplementasikan pada kode sumber aktual `developer_sales_os`.

---

## 1. Auth, Session, 2FA TOTP & Role Guard (`F01`, `F02`, `F03`)
- **Backend:** `server/auth.ts`, `server/permissions.ts`, `server/totp.ts`, `server/index.ts`.
- **Kontrak:**
  - `POST /api/auth/login`: memverifikasi email & password pada `sales_os.app_users`, mengembalikan sesi cookie (`HttpOnly`) atau challenge 2FA bila TOTP aktif.
  - `POST /api/auth/2fa/setup`, `/api/auth/2fa/verify-setup`, `/api/auth/2fa/disable`: mengelola secret TOTP per akun.
  - Guard role & permission (`server/permissions.ts`): memblokir request tanpa sesi (`401`) atau role tidak berwenang (`403`).

## 2. Isolasi Multi-Tenant & Visibilitas Tim Internal (`F04`, `F05`)
- **Backend:** `server/auth.ts` (`listTenantUsers`), `server/index.ts`.
- **Kontrak:**
  - Setiap query data tenant wajib memfilter `tenant_id` sesuai konteks user.
  - Akses lintas-tenant oleh user tenant (`SM`, `SE`, `TL`, `ADMIN`, `DIREKSI`, `IT`) ditolak (`403`).
  - `listTenantUsers` (`server/auth.ts`) menyembunyikan role sistem internal (`SUPERADMIN`, `SUPERADMIN_IT`) dan domain `@developersalesos.com` dari daftar user tenant agar tim internal Developer Sales OS tidak terlihat oleh tenant mana pun.

## 3. Manajemen Proyek, Unit & Skema Pembayaran (`F06`, `F07`)
- **Backend & DB:** `server/index.ts`, `server/units-quotes.ts`, `db/migrations/0001..0031`.
- **Kontrak:**
  - Endpoint proyek & unit mendukung status (`AVAILABLE`, `BOOKING`, `SOLD`, `RESERVED`) dan skema pembayaran (`CASH`, `INHOUSE_6/12/24`, `KPR`).

## 4. Pipeline Lead, WA AI, Absensi, GPS & Log Telepon (`F08`, `F09`, `F10`)
- **Backend:** `server/index.ts`, `server/wa-consent.ts`, `server/wa-conversation.ts`.
- **Kontrak:**
  - Lead, absensi check-in/out GPS, dan log telepon tercatat di PostgreSQL `sales_os` dengan relasi `tenant_id` dan `user_id`.

## 5. Laporan Harian Terpadu SM + Seluruh SE Binaan & Export PDF/Excel (`F11`, `F12`)
- **Backend:** `server/index.ts` (endpoint laporan harian SM & SE).
- **Frontend:** `src/components/SmDailyReportPanel.tsx`, `src/utils/exportDailyReportPdf.ts`, `src/utils/exportSmDailyReportPdf.ts`.
- **Kontrak:**
  - Mendukung filter tanggal tunggal maupun rentang periode (`startDate`, `endDate`) bergaya *range picker*.
  - Menggabungkan aktivitas SM + seluruh SE bawahan (absen, GPS, call, canvassing, konten, lead) dalam satu tampilan dan ekspor PDF/Excel.
  - Tombol aksi menggunakan layout responsif (`flex-wrap`, non-floating) agar rapi di layar sempit/mobile.

## 6. KPR Vault, Rekening Resmi & Error Boundary (`F13`, `F14`, `F15`)
- **Backend & Frontend:** `server/index.ts`, `server/security-ops.ts`, `src/components/AppErrorBoundary.tsx`.
- **Kontrak:**
  - Dokumen KPR dan rekening resmi perusahaan terisolasi per `tenant_id` dan memiliki audit trail status approval.
  - `AppErrorBoundary` menangkap runtime render error agar aplikasi tidak mengalami *white screen* tanpa pesan pemulihan.
