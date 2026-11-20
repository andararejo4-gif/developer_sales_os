# Aturan Repositori & Sinkronisasi Git (Developer Sales OS)

Dokumen ini merupakan aturan wajib bagi seluruh AI Agent, developer, dan otomasi dalam repositori ini.

---

## 1. Pemeriksaan Remote Terlebih Dahulu (Git Pre-Check & Fetch)
Sebelum melakukan modifikasi file besar, staging (`git add`), pembuatan commit, atau push:
1. Jalankan `git fetch origin main` (atau remote branch aktif terkait).
2. Periksa status tracking dengan `git status -uno` dan `git status`.
3. Bandingkan commit lokal dan remote:
   - `git log HEAD..origin/main --oneline` (melihat commit baru di remote).
   - `git diff --name-status HEAD...origin/main` (melihat file yang berubah/bertambah di remote).

---

## 2. Proteksi File Remote (Anti-Overwriting & Anti-Deletion)
Apabila terjadi kondisi konkurensi di mana:
- Terdapat perubahan lokal di laptop, **DAN**
- Terdapat perubahan atau commit baru di repositori remote (`origin`),
- **KHUSUSNYA bila ada file yang ADA di repositori remote tetapi BELUM ADA di laptop**:

### **ATURAN MUTLAK**:
1. **DILARANG KERAS** menghapus, menimpa (*overwrite*), atau membuang file yang ada di remote tersebut.
2. **JANGAN SENTUH / HAPUS** file remote yang belum ada di lokal. File tersebut harus dipertahankan secara utuh.
3. **DILARANG KERAS** menggunakan `git push --force`, `git reset --hard origin`, atau perintah destruktif lainnya yang berpotensi melenyapkan pekerjaan di remote.

---

## 3. Kewajiban Pemberitahuan & Transparansi (Notify User)
Bila terdeteksi perbedaan antara remote dan laptop:
1. Laporkan secara transparan ke pengguna:
   - Daftar file baru atau file yang diubah di remote.
   - Status branch (`ahead`, `behind`, atau `diverged`).
   - Penjelasan ringkas mengenai perbedaan yang ditemukan.
2. Mintalah arahan atau jelaskan langkah rekonsiliasi aman yang akan diambil sebelum melanjutkan modifikasi file yang bersangkutan.

---

## 4. Prosedur Penyesuaian & Rekonsiliasi Aman (Safe Reconciliation)
1. **Amankan Pekerjaan Lokal**: Jika ada perubahan lokal yang belum di-commit, gunakan `git stash` atau commit terisolasi.
2. **Tarik File Remote**: Ambil file baru/perubahan dari remote ke lokal (misalnya melalui `git merge origin/main` atau `git checkout origin/main -- <path-file>` untuk file spesifik).
3. **Sesuaikan Perbedaan**: Gabungkan isi file dengan cermat tanpa menghilangkan baris, fungsionalitas, atau aset yang ada di remote maupun di lokal.
4. **Verifikasi Integritas**: Jalankan seluruh pengujian (`bun test`) dan build sistem (`npm run build`) setelah penyesuaian untuk memastikan kode 100% stabil sebelum di-commit dan di-push.

---

## 5. Baca Realtime & Edit Minimal (Pola Khusus Repo Ini)
Aturan umumnya ada di plugin global `workspace-continuity`. Bagian ini berisi pola konkret repo yang wajib diikuti.

### 5.1 Sebelum Edit
- Baca ulang file target dari disk sesaat sebelum mengedit. Jangan mengandalkan ringkasan percakapan.
- Cek `git status`, `git diff`, dan `git log -5 --oneline`. Perubahan yang belum di-commit adalah milik pengguna dan tidak boleh disentuh tanpa izin.
- Rujukan keputusan: `DECISIONS.md`, `ERD.md`, `README.md`, `docs/AUDIT_*.md`, dan `db/migrations/`.

### 5.2 Pola yang Diikuti
| Aspek | Pola repo |
|---|---|
| Stack | React 19 + TypeScript, Vite 8, Tailwind 4, `bun test`, Leaflet, `lucide-react`, `postgres`. Jangan menambah library baru tanpa izin. |
| Komponen | `src/components/NamaPascalCase.tsx`. Bagian homepage publik ada di `src/components/v3/*V3.tsx`. |
| Data | `src/data.ts`, `src/data/*.json`, dan `src/lib/**`. POI hanya diimpor lewat `scripts/import_osm_poi.ts`, bukan daftar manual. |
| Test | `tests/nama-kebab.test.ts` (bun test). |
| Migrasi DB | File baru `db/migrations/NNNN_nama_snake.sql` dengan nomor berikutnya. Migrasi lama tidak diedit. |
| Backup DB | Wajib sebelum mengubah tabel: `db/backups/backup_pre_<topik>_<NNNN>.sql`. |
| Bahasa | Teks UI, komentar, dan dokumen dalam Bahasa Indonesia. |
| Visual dasbor | Token `espresso`, `terracotta`, `sandstone`, `warmborder`, `warmmuted`, `olive`. |
| Visual homepage | `#0B3D2E`, `#2F9E5B`, `#C6F432`, `#F6FAF7`. **Palet dan gaya visual tidak boleh diubah.** |
| Line ending | Ikuti file asli. Contoh: `src/App.tsx` memakai CRLF, sebagian komponen memakai LF. |

### 5.3 Saat Edit
- Gunakan edit tertarget per blok. Jangan menimpa seluruh file besar seperti `src/App.tsx`, `MapChapterV3.tsx`, atau `InteractiveMap.tsx`.
- Jangan memformat ulang, mengganti nama, atau memindah kode yang tidak terkait dengan tugas.
- Jika perubahan lebih dari ~150 baris pada satu file atau mengubah struktur besar, jelaskan rencananya dan minta persetujuan dulu.

### 5.4 Sesudah Edit
- `git diff --stat` harus hanya memuat file yang dimaksud.
- `bun test` dan `npm run build` wajib lulus sebelum commit, lalu ikuti Bagian 1–4 sebelum push.
