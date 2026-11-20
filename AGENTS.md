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
