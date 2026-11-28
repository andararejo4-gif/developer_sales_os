# Developer Sales OS

> Platform SaaS Multi-Tenant untuk Pengembang Perumahan: Mengubah Dokumen Mentah (Brosur, Pricelist, Koordinat GPS) Menjadi Mesin Penjualan Otonom lintas Web, PWA (Android & iOS), dan APK Android Native.

- **Domain Produksi**: `https://developerproperti.giivepro.com`
- **Unduh APK Android**: `https://developerproperti.giivepro.com/download/DeveloperSalesOS.apk` (~5,32 MB)
- **Tenant Percontohan**: PT Andara Rejo Makmur · The Park Townhouse Sukoharjo
- **Stack**: React 19 + TypeScript + Vite 8 (Rolldown) + Tailwind CSS + PWA Workbox · Backend Bun/Node + PostgreSQL (RLS) · Midtrans Snap API · Capacitor Android

---

## 1. Menjalankan Secara Lokal

Prasyarat: **Bun v1.4+** (atau Node.js v20+) dan **PostgreSQL** (`sales_os`).

```bash
# 1. Instal dependensi
npm install

# 2. Salin konfigurasi environment & isi kredensial lokal (JANGAN commit .env)
cp .env.example .env

# 3. Jalankan backend API (:3040) dan frontend Vite (:5173)
bun run server/index.ts
npm run dev
```

### Variabel `.env` Utama (Template Tanpa Secret)
```env
APP_URL=http://localhost:5173
PUBLIC_APP_URL=https://developerproperti.giivepro.com
API_PORT=3040
DATABASE_URL=postgres://postgres:password@127.0.0.1:5435/sales_os

# AI Router (Server-Only)
AI_ROUTER_URL=https://9router.giivepro.com/v1
AI_ROUTER_API_KEY=<isi-api-key>
AI_ROUTER_MODEL=andararejomakmurjosjis

# Payment Gateway Midtrans (Sandbox / Production)
PAYMENT_PROVIDER=midtrans
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=<merchant-id>
MIDTRANS_SERVER_KEY=<SB-Mid-server-...>
MIDTRANS_CLIENT_KEY=<SB-Mid-client-...>
```

---

## 2. Pengujian Otomatis & Build Produksi

```bash
# Jalankan seluruh 269 unit & integration test (53 file)
bun test

# Build frontend (code-splitting + PWA Workbox)
npm run build

# Build bundle server produksi
bun build server/index.ts --outfile dist-server.mjs --target node
```

---

## 3. Alur Pendaftaran, Pembayaran Midtrans & Penguncian Akses

1. **Halaman Pendaftaran Terpisah (`/daftar/gold`, `/daftar/platinum`, `/daftar/diamond`)**:
   - Komponen `src/components/OnboardingRegistrationPage.tsx` (mobile-first, 2-kolom editorial di desktop, kartu unit tanpa horizontal scroll di HP).
   - Draft otomatis tersimpan di `localStorage` (`dsos_onboarding_draft_v1`) sehingga aman bila halaman ter-refresh di langkah mana pun.
2. **Payment-Gated Unlock (Kunci Surat Cinta & Login Sebelum Lunas)**:
   - Sebelum pembayaran berstatus `PAID`, `POST /api/onboarding/create-checkout` hanya menyimpan `pending_owner_payload` di `sales_os.onboarding_sessions` (migrasi `0039`) tanpa membuat akun di `sales_os.app_users`.
   - Dokumen Surat Cinta 99 Keunggulan (`.docx` & PDF) dan akses login baru terbuka otomatis oleh `finalizeOnboardingAfterPayment()` setelah invoice berstatus `PAID`.
3. **Halaman Checkout Khusus 2-Kolom (`/checkout/:invoiceNo`)**:
   - Komponen `src/components/PaymentCheckoutPage.tsx` digunakan seragam untuk Onboarding Paket, Top-up AIC, dan Booking Fee.
   - Mendukung webhook otomatis `POST /api/payments/midtrans/webhook` (verifikasi **SHA-512** `order_id + status_code + gross_amount + server_key` + cek nominal) dan sinkronisasi manual `POST /api/payments/checkout/:invoiceNo/sync` ke Midtrans Core API.
   - Set **Payment Notification URL** di Dashboard Midtrans ke:
     `https://developerproperti.giivepro.com/api/payments/midtrans/webhook`

---

## 4. Konsep & Panduan Build APK Android (Capacitor Live-Sync)

### 4.1 Konsep Arsitektur (Kenapa 1 Codebase & Ukuran APK Hanya ~5,3 MB)
- **Single Codebase Web + Mobile**: Aplikasi tidak ditulis ulang dari nol dengan Kotlin/Flutter. Seluruh UI React + Vite + PWA dibungkus shell native Android menggunakan **Capacitor** (`capacitor.config.ts`, package ID `com.andararejomakmur.devsalesos`).
- **Live-Sync ke Produksi (`server.url`)**: `capacitor.config.ts` mengarahkan WebView native ke `https://developerproperti.giivepro.com` (dengan whitelist navigasi Midtrans & WhatsApp). Dampaknya:
  - Setiap kali ada perbaikan bug atau fitur baru yang di-deploy ke web produksi, **isi APK Android otomatis ikut terupdate** tanpa mengharuskan tim lapangan mengunduh ulang file `.apk`.
  - Ukuran APK tetap super ringan (**~5,32 MB**) karena aset media uji/server tidak ikut dimasukkan ke dalam paket APK.
- **Izin Native & Banner Pintar**:
  - `android/app/src/main/AndroidManifest.xml` mendeklarasikan izin `INTERNET`, `CAMERA`, `ACCESS_FINE_LOCATION`, dan `ACCESS_COARSE_LOCATION`.
  - `PwaInstallBanner.tsx` otomatis menampilkan tombol **Unduh APK** (`/download/DeveloperSalesOS.apk`) pada browser Android, panduan **Share → Add to Home Screen** pada Safari iOS (karena Apple tidak mengizinkan instalasi `.ipa` bebas dari web tanpa App Store/TestFlight), dan otomatis tersembunyi saat dibuka dari dalam APK native.

### 4.2 Prasyarat Toolchain Lokal (Windows)
- **Eclipse Temurin JDK 21 LTS** (misal `%LOCALAPPDATA%\Android\jdk-21\jdk-21.x`)
- **Android SDK Commandline Tools** (`%LOCALAPPDATA%\Android\Sdk`) dengan paket `platform-tools`, `platforms;android-36`, dan `build-tools;36.0.0`
- File lokal `android/local.properties` (otomatis di-gitignore):
  ```properties
  sdk.dir=C:\\Users\\<user>\\AppData\\Local\\Android\\Sdk
  ```

### 4.3 Langkah Build APK Lokal (PowerShell)
```powershell
# 1. Build web terbaru & sinkronisasi ke proyek Android
npm run build
npx cap sync android

# 2. Hapus folder media uji dari aset APK agar ukuran tetap ~5 MB
Remove-Item -Recurse -Force `
  "android\app\src\main\assets\public\generated-media", `
  "android\app\src\main\assets\public\card-samples", `
  "android\app\src\main\assets\public\brand" -ErrorAction SilentlyContinue

# 3. Set JAVA_HOME & ANDROID_HOME lalu kompilasi APK bersih
$env:JAVA_HOME = "$env:LOCALAPPDATA\Android\jdk-21\jdk-21.0.13.1+2"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Push-Location android
.\gradlew.bat clean assembleDebug
Pop-Location

# 4. Output APK siap distribusi:
# android\app\build\outputs\apk\debug\app-debug.apk (~5,32 MB)

# 5. Upload APK ke server produksi (hades)
ssh hades "mkdir -p /var/www/developer-sales-os/download"
scp android\app\build\outputs\apk\debug\app-debug.apk hades:/var/www/developer-sales-os/download/DeveloperSalesOS.apk
```

---

## 5. Optimasi Performa & Keamanan Produksi

- **Code-Splitting (-89% Bundle Awal)**: 32 halaman/modal berat memakai `React.lazy` + 6 `manualChunks` (`vendor-react`, `vendor-lucide`, `vendor-docx`, `vendor-leaflet`, `vendor-motion`, `vendor-qrcode`), menurunkan entry JS dari `615 KB` → `68,6 KB gzip`.
- **PWA Workbox Aktif**: Service Worker caching untuk JS/CSS/font + runtime `CacheFirst` gambar (14 hari) & `NetworkOnly` untuk `/api/`.
- **Absensi & GPS Cepat**: `GET /api/se/field-logs` tidak lagi menyertakan blob foto base64; foto dilayani terpisah melalui `GET /api/se/field-logs/:id/photo` (`Cache-Control: private, max-age=86400`), didukung cache `sessionStorage` dan 6 skeleton card (`animate-pulse`).
- **Isolasi Multi-Tenant**: PostgreSQL Row-Level Security (`0038_enable_tenant_rls.sql`) aktif pada 12 tabel inti + 2FA TOTP RFC 6238.

---

## 6. Deploy ke Server Produksi (`hades`)

```bash
# 1. Backup DB sebelum migrasi
ssh hades 'set -a && . ~/developer-sales-os-api/.env && set +a && pg_dump "$DATABASE_URL" -Fc -f ~/db-backup/sales_os-$(date +%Y%m%d).dump'

# 2. Upload frontend, backend, dan migrasi baru
scp -r dist/index.html dist/sw.js dist/manifest.webmanifest dist/assets/ hades:/var/www/developer-sales-os/
scp dist-server.mjs hades:~/developer-sales-os-api/dist-server.mjs
scp db/migrations/003*.sql hades:~/developer-sales-os-api/db/migrations/

# 3. Terapkan migrasi (bila ada) & restart PM2
ssh hades 'cd ~/developer-sales-os-api && set -a && . ./.env && set +a && pm2 restart developer-sales-os-api --update-env && curl -sS https://developerproperti.giivepro.com/api/health'
```
