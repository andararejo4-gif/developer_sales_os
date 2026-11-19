# Architecture & Design Decisions (Developer Sales OS)

Dokumen ini mencatat keputusan arsitektural dan teknis yang diambil selama pembangunan platform multi-tenant **Developer Sales OS** (`developerproperti.giivepro.com`).

---

## 1. Multi-Tenant Architecture & Data Isolation
- **Pola**: Single Database, Shared Schema dengan Discriminator Column `tenant_id` di setiap tabel data bisnis.
- **Isolasi Data**: Setiap query, mutasi, dan akses file wajib memvalidasi `tenant_id` dari session context. Dilengkapi automated unit test `tenant-isolation.test.ts` untuk membuktikan bahwa data Tenant A tidak dapat diakses oleh Tenant B.
- **Storage**: Pola direktori lokal `/storage/{tenant_id}/{project_id}/...` terlindungi dengan route handler berotorisasi sesi.

## 2. Database & Migrations
- **Engine**: PostgreSQL (`sales_os`), skema terpisah dari aplikasi lain.
- **Migration**: SQL murni berurutan di `/db/migrations/0001_...`, `/db/migrations/0002_...`.
- **Database Client**: `postgres` (porsgres.js / pglite kompatibel) dengan fallback in-memory datastore untuk test/development offline saat PostgreSQL lokal tidak aktif.

## 3. Plan & Feature Flag Engine
- Konfigurasi paket (`plans`) dan fitur (`plan_features`) sepenuhnya berbasis data database (bukan hardcoded).
- Paket awal: Gold, Platinum, Diamond.
- Harga: `null` (ditampilkan sebagai "Hubungi Kami" di UI publik).
- Feature flags mengontrol:
  - Ekstraksi AI & Surat Cinta 99 Keunggulan (semua paket)
  - Riset Pasar (dasar / lengkap / berkala)
  - Kalender Konten (official / in-house)
  - Otomasi AI: TL Full AI vs Manual, SM Semi-AI vs Manual (dengan tabel `approvals`)
  - Batas proyek dan sales seat

## 4. Guardrail & Validator Surat Cinta 99 Keunggulan
- Validator memeriksa:
  1. Jumlah tepat 99 poin.
  2. Bebas kata terlarang / overpromise: "pasti untung", "pasti naik", "terbaik se-indonesia", "nomor satu di dunia", "dijamin return", "bebas risiko".
  3. Menggunakan data faktual proyek yang terverifikasi.
  4. Penyebutan estimasi jarak menggunakan format "sekitar ...".
- Output berversi (`version`: v1, v2, ...), siap diekspor ke DOCX, PDF, dan standalone HTML.

## 5. UI/UX & Design Tokens (Warm Terracotta & Sandstone)
- Terinspirasi estetika openrouter.ai (hero besar dramatis, ⌘K command palette, data counters dari database, interactive roadmap & map) dipadukan dengan palet Warm Terracotta & Sandstone dari Sales OS.
- CSS Variables / Tailwind tokens:
  - `sandstone`: `#F5F2EB`
  - `espresso`: `#1C1917`
  - `warmmuted`: `#78716C`
  - `terracotta`: `#B45309`
  - `olive`: `#3F6212`
  - `warmborder`: `#E6E0D4`
  - `surface`: `#FFFFFF`
  - `amber-50`: `#FFFBEB`
  - `amber-400`: `#FBBF24`
- Tanpa dark-mode toggle; kontras memenuhi standar WCAG AA; font Plus Jakarta Sans self-hosted.
