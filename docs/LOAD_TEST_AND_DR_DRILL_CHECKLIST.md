# Checklist Eksekusi Load Test & DR Drill (QA-05 · INF-12 · REL-02)

Dokumen ini menjadi panduan eksekusi dan pencatatan bukti nyata untuk menutup item checklist yang masih berstatus `Siap review` di [CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx](CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx).

---

## 1. Load Test (`QA-05`)

### Prasyarat
1. Server target aktif (staging atau produksi non-jam-sibuk), misalnya `http://127.0.0.1:3040` atau URL staging.
2. Siapkan akun uji bila ingin menguji endpoint terautentikasi (`LOAD_TEST_EMAIL`, `LOAD_TEST_PASSWORD`).

### Perintah Eksekusi
- **Mode publik + staging:**
  ```powershell
  bun run scripts/load-test.ts --base-url=http://127.0.0.1:3040 --concurrency=25 --duration=20
  ```
- **Mode lengkap dengan endpoint terautentikasi:**
  ```powershell
  $env:LOAD_TEST_EMAIL="admin.sales@andararejomakmur.co.id"
  $env:LOAD_TEST_PASSWORD="<password-uji>"
  bun run scripts/load-test.ts --base-url=http://127.0.0.1:3040 --concurrency=50 --duration=30 --max-error-pct=1 --max-p95-ms=1000
  ```

### Kriteria Lulus (NFR)
- [ ] Error rate `<= 1%`
- [ ] Latency `p95 <= 1000 ms`
- [ ] Tidak ada crash server / connection pool exhaustion di PostgreSQL
- [ ] Log output dilampirkan ke bukti `QA-05`

### Catatan Hasil Eksekusi
| Tanggal | Lingkungan | Concurrency | Durasi | RPS | p95 (ms) | Error (%) | Status | PIC |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

---

## 2. Disaster Recovery (DR) Drill (`INF-12` & `REL-02`)

### Prasyarat
1. `DATABASE_URL` mengarah ke database target (disarankan jalankan di staging terlebih dahulu sebelum produksi).
2. `pg_dump` dan `psql` terpasang di PATH server/mesin eksekusi.

### Perintah Eksekusi
```powershell
bun run scripts/dr-drill.ts
```

### Langkah yang Dijalankan Skrip (Non-Destruktif)
1. Menghitung snapshot jumlah baris 8 tabel inti `sales_os` (`tenants`, `app_users`, `projects_registry`, `project_units`, `pipeline_leads`, `payment_invoices`, `aic_ledger_entries`, `business_audit_log`).
2. Menjalankan `pg_dump --schema=sales_os` ke folder `backups/dr-drill-<timestamp>.sql`.
3. Membuat schema uji sementara `dr_drill_verify`, merestore dump ke schema tersebut, memverifikasi row count, lalu membersihkan schema `dr_drill_verify`.

### Kriteria Lulus (DR)
- [ ] File dump SQL terbentuk & tidak kosong (`> 0 bytes`)
- [ ] Restore ke schema sementara `dr_drill_verify` berhasil tanpa error SQL
- [ ] Waktu backup + restore (RTO) tercatat dan memenuhi target operasional (`<= 15 menit`)
- [ ] Bukti output & nama file backup dicatat di `INF-12` dan `REL-02`

### Catatan Hasil Eksekusi
| Tanggal | Target DB | Ukuran Dump | Waktu Backup (s) | Waktu Restore (s) | Status | PIC |
|---|---|---|---|---|---|---|
| | | | | | | |
