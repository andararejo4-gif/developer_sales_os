# Developer Sales OS

> Platform Web Multi-Tenant untuk Pengembang Perumahan: Mengubah Dokumen Mentah (Brosur, Pricelist, Koordinat) Menjadi Mesin Penjualan Otonom.

- **Domain Target**: `developerproperti.giivepro.com`
- **Tenant Percontohan**: PT Andara Rejo Makmur · The Park Townhouse Sukoharjo (30 Unit, 3 Cluster)
- **Desain Sistem**: *Warm Terracotta & Sandstone* (terinspirasi estetika openrouter.ai)
- **Font**: *Plus Jakarta Sans*

---

## 1. Panduan Menjalankan Lokal

Pastikan [Bun](https://bun.sh) (v1.4+) atau Node.js (v20+) terinstal.

```bash
# 1. Masuk ke direktori
cd "developer_sales_os"

# 2. Salin environment
cp .env.example .env

# 3. Jalankan server pengembangan
bun dev
# atau: npm run dev
```

Buka peramban di `http://localhost:5173` atau `http://localhost:3000`.

---

## 2. Menjalankan Pengujian Otomatis

Seluruh pengujian unit, guardrail validator, dan isolasi tenant dijalankan melalui runner bawaan Bun:

```bash
bun test
```

Rangkaian uji mencakup:
- `tests/love-letter-validator.test.ts`: Uji kepatuhan 99 poin, larangan overpromise, dan format estimasi jarak.
- `tests/tenant-isolation.test.ts`: Pembuktian bahwa pengguna Tenant A tidak dapat mengakses data Tenant B.
- `tests/plans-config.test.ts`: Validasi paket (Gold, Platinum, Diamond) berbasis flag dinamis dengan harga `null` ("Hubungi kami").
- `tests/smoke-phase1.test.ts`: Pengujian alur onboarding, penghitungan angka faktual, dan generator DOCX/HTML.

---

## 3. Menjalankan Kompilasi Build

```bash
npm run build
# atau: bun run build
```

Hasil kompilasi siap produksi akan tersimpan di direktori `/dist`.

---

## 4. Panduan Deploy ke VPS Ubuntu (PM2)

Untuk mendistribusikan ke server VPS Ubuntu dengan port terpisah dari aplikasi lain:

```bash
# 1. Masuk ke server & clone repository
cd /var/www/developer_sales_os

# 2. Instalasi dependensi
bun install --frozen-lockfile

# 3. Build artefak
bun run build

# 4. Jalankan aplikasi via PM2 (port terpisah, misal 3040)
pm2 start "bun preview --port 3040 --host" --name "developer-sales-os"

# 5. Konfigurasi Nginx Reverse Proxy
# Proxy pass ke http://127.0.0.1:3040 untuk domain developerproperti.giivepro.com
```

---

## 5. Struktur Database & Migrasi SQL

Skema database PostgreSQL murni: `sales_os`.
File migrasi berurutan di `/db/migrations`:
- `0001_sales_os_core_schema.sql`: Skema multi-tenant, tabel `tenants`, `plans`, `plan_features`, `users`, `projects`, `clusters`, `units`, `project_files`, `love_letters`, `jobs`, `ai_usage`, `approvals`, dan `audit_logs`.
- `0002_sales_os_seed_plans_and_the_park.sql`: Data awal paket Gold, Platinum, Diamond, Superadmin Giivepro, Tenant PT Andara Rejo Makmur, 3 Cluster (Nagoya, Osaka, Tokyo), dan 30 Unit The Park Townhouse Sukoharjo.

Dokumentasi detail diagram relasi entitas dapat dibaca di [`ERD.md`](./ERD.md) dan keputusan arsitektur di [`DECISIONS.md`](./DECISIONS.md).
