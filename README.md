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

Rangkaian 67 uji otomatis melingkupi 15 file:
- `tests/love-letter-validator.test.ts`: Uji kepatuhan 99 poin, larangan overpromise, dan format estimasi jarak.
- `tests/tenant-isolation.test.ts`: Pembuktian bahwa pengguna Tenant A tidak dapat mengakses data Tenant B.
- `tests/plans-config.test.ts`: Validasi paket (Gold, Platinum, Diamond) berbasis flag dinamis dengan harga `null` ("Hubungi kami").
- `tests/knowledge-base.test.ts`: 20 Pertanyaan Uji Penerimaan Fase 1A (15 terjawab bersumber & 5 di luar data), Kartu Produk 1 halaman, dan kuis kelulusan 10 soal SE baru minimal 80%.
- `tests/effective-features.test.ts`: Adaptasi dinamis hierarki peran dan fitur berdasarkan kuesioner onboarding.
- `tests/demo-teaser.test.ts`: Verifikasi server-side teaser 25% untuk akun Demo 30 hari & larangan etis desakan palsu.
- `tests/market-research.test.ts`: 5 Persona terstruktur, fasilitas publik radius 500m-25km, matriks kompetitor, dan SVG market share.
- `tests/sales-targets.test.ts`: Skenario sold-out 100%, reverse funnel leads, dan pembagian kuota per SE.
- `tests/content-calendar.test.ts`: Kalender 30 hari x 3 slot (90 slot), dual-track official vs sales in-house, dan live URL paste.
- `tests/playbook-routes.test.ts`: Playbook role SE/TL/SM, reverse-funnel math, BANT >= 7 threshold, dan rute harian GPS.
- `tests/website-generator.test.ts`: Kalkulator simulasi angsuran anuitas KPR, disclaimer non-binding, dan ekspor standalone single-page HTML.
- `tests/crm-pipeline.test.ts`: Pipeline 7 tahap canonical, penandaan bawahan `Nama (SE - TL)`, checklist follow-up strictly date-driven, dan aturan bagi komisi 100%.
- `tests/export-token-exclusion.test.ts`: Pembuktian guardrail `assertNoTokenLeakage` bebas 100% dari kebocoran token AI pada DOCX/PDF/HTML ekspor.

---

## 3. Menjalankan Kompilasi Build

```bash
npm run build
# atau: bun run build
```

Hasil kompilasi siap produksi akan tersimpan di direktori `/dist`.

---

## 4. Panduan Deploy ke VPS Ubuntu (PM2 & Nginx Wildcard)

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
pm2 save
```

### Konfigurasi Nginx & Wildcard DNS Subdomain
Untuk melayani subdomain website proyek otomatis (seperti `thepark.developerproperti.giivepro.com`):
1. **DNS Wildcard**: Tambahkan A Record `*.developerproperti.giivepro.com` mengarah ke IP VPS.
2. **SSL Wildcard**: Terbitkan sertifikat Let's Encrypt wildcard via Certbot DNS Challenge:
   ```bash
   certbot certonly --manual --preferred-challenges dns -d "developerproperti.giivepro.com" -d "*.developerproperti.giivepro.com"
   ```
3. **Nginx Block**:
   ```nginx
   server {
       server_name developerproperti.giivepro.com *.developerproperti.giivepro.com;
       listen 443 ssl http2;
       ssl_certificate /etc/letsencrypt/live/developerproperti.giivepro.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/developerproperti.giivepro.com/privkey.pem;

       location / {
           proxy_pass http://127.0.0.1:3040;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

---

## 5. Struktur Database & Migrasi SQL

Skema database PostgreSQL murni: `sales_os`.
File migrasi berurutan di `/db/migrations`:
- `0001_sales_os_core_schema.sql`: Skema multi-tenant, tabel `tenants`, `plans`, `plan_features`, `users`, `projects`, `clusters`, `units`, `project_files`, `love_letters`, `jobs`, `ai_usage`, `approvals`, dan `audit_logs`.
- `0002_sales_os_seed_plans_and_the_park.sql`: Data awal paket Gold, Platinum, Diamond, Superadmin Giivepro, Tenant PT Andara Rejo Makmur, 3 Cluster (Nagoya, Osaka, Tokyo), dan 30 Unit The Park Townhouse Sukoharjo.
- `0003_sales_os_phase1a_knowledge_base.sql`: Tabel `product_sources`, `kb_facts`, `location_facts`, `kb_chunks`, `kb_changes`, `product_quiz_results`.
- `0004_sales_os_phase1b_org_and_members.sql`: Tabel `org_profile`, `org_roles`, `project_members`, `project_assignment_requests`, `hook_events`.
- `0005_sales_os_phase2_market_research_and_targets.sql`: Tabel `market_research`, `sales_targets`, dan `project_pipeline_stages`.
- `0006_sales_os_phase3_content_calendar.sql`: Tabel `content_calendars` dan `calendar_slots` (90 slot per bulan).
- `0007_sales_os_phase4_playbook_and_routes.sql`: Tabel `project_playbooks` dan `daily_routes`.
- `0008_sales_os_phase5_project_websites.sql`: Tabel `project_websites`.
- `0009_sales_os_phase6_crm_pipeline_and_superadmin.sql`: Tabel `project_leads` (7 stage), `commission_rules`, dan initial seed data.

Dokumentasi detail diagram relasi entitas dapat dibaca di [`ERD.md`](./ERD.md) dan keputusan arsitektur di [`DECISIONS.md`](./DECISIONS.md).
