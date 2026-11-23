# Aturan Global (semua workspace)

Prioritas: 1) benar, 2) konteks utuh, 3) token minimal. Konflik → urutan ini menang.
Bahasa balasan: Indonesia. Kode, perintah, nama file, pesan error: apa adanya.
Aturan di file ini berlaku SETIAP sesi, tanpa perlu diingatkan user.

## 1. Mulai sesi (wajib, urut)
1. Baca kondisi nyata: `rtk git status`, branch, file berubah. Jangan andalkan ingatan.
2. Baca `progress.md` di root workspace: **3–5 entri terbaru saja** (lihat bagian 2). Jika belum ada, buat sesuai format.
3. Baca `.agents/progress-cache.md` bila ada (cache pencarian lama, lihat bagian 3).
4. Baca `README`/`docs/` hanya jika relevan dengan tugas.
5. Pelajari pola yang ada (penamaan, struktur, gaya kode, urutan migrasi). Ikuti, jangan menciptakan pola baru.
6. Lanjutkan pekerjaan terakhir. Jangan mulai ulang atau menulis ulang yang sudah jalan.

## 2. progress.md (jejak perubahan & handover)
Tujuan: AI lain bisa melanjutkan hanya dengan membaca file ini.

**Kapan menulis:** setiap ada perubahan nyata (kode, skema/migrasi, konfigurasi, dependensi, keputusan desain). Tulis SEBELUM melapor selesai. Tanya-jawab murni tidak dicatat.
**Satu tugas = satu entri.** Edit berkali-kali pada tugas yang sama → perbarui entri itu, jangan buat baru.

**Letak & urutan:** `progress.md` di root workspace. Entri terbaru di ATAS (setelah judul), supaya membaca 3–5 terakhir cukup dengan membaca bagian awal file.

**Format entri (maks ±8 baris, poin pendek):**
```
## P-012 | 2026-11-21 | Judul singkat
- Status: selesai | sebagian | terblokir
- Ubah: `path/file1`, `path/file2` (apa yang diubah, 1 frasa)
- Alasan/keputusan: 1 baris
- Verifikasi: perintah/tes yang dijalankan + hasil
- Berikutnya: langkah lanjut atau "-"
- Catatan: jebakan, hal yang jangan disentuh (opsional)
```
- ID naik berurutan (P-001, P-002, ...). Tanggal format YYYY-MM-DD.
- Tulis fakta, bukan narasi. Tanpa kode panjang; cukup nama file dan inti perubahan.
- Jangan hapus entri lama. Jangan tulis secret/kunci.

## 3. Membaca progress lama (sekali saja, lalu cache)
Default: hanya 3–5 entri terbaru. Entri lain dibaca HANYA jika user bertanya tentang pekerjaan yang mungkin sudah dikerjakan sebelumnya.

Alurnya:
1. Cek `.agents/progress-cache.md` dan ringkasan di konteks sesi. Jika topik sudah ada → pakai itu, JANGAN baca ulang `progress.md`.
2. Jika belum ada: cari dengan `rtk rg -i "<kata kunci>" progress.md`, lalu baca hanya entri yang cocok. Jangan baca seluruh file.
3. Segera simpan hasilnya ke cache (1 kali per topik):
```
## <topik/kata kunci> | dicari 2026-11-21
- P-004: ringkasan 1 baris + status
- P-009: ringkasan 1 baris + status
```
4. Jawab user dari cache. Pertanyaan berikutnya tentang topik sama → langsung dari cache.
5. Jika entri sumber diperbarui kemudian (ID tercatat berubah) → perbarui baris cache terkait, bukan cari ulang semua.
6. Jika topik memang tidak ditemukan, catat juga di cache: "tidak ada di progress (dicari tanggal)". Supaya tidak dicari lagi.
- Cache maks ±40 baris. Jika melebihi, ringkas entri tertua.

## 4. Hemat token (rtk + headroom)
- Semua perintah shell lewat rtk: `rtk git status`, `rtk git diff`, `rtk rg <query>`, `rtk deps`. Cek hemat: `rtk gain`.
- Output besar (log, JSON, hasil tes, riwayat panjang) → kompres dengan headroom sebelum masuk konteks.
- Cari dulu, baca rentang baris yang perlu. Jangan baca file utuh tanpa alasan.
- Jangan baca ulang file yang sudah dibaca kecuali sudah berubah.
- Jangan tempel ulang kode yang sudah ada. Tampilkan hanya bagian berubah.

## 5. Gaya balasan (caveman)
- Padat: tanpa pembuka, basa-basi, penutup, atau mengulang pertanyaan.
- Kalimat pendek, langsung ke hasil. Kode dan error tidak dipadatkan.
- Jangan jelaskan yang tidak ditanya. Detail hanya jika diminta.
- Format selesai tugas (maks 5 baris): apa berubah (file) · cara verifikasi · risiko · entri progress (P-xxx).

## 6. Edit minimal (ponytail)
- Solusi paling sederhana yang benar-benar jalan. YAGNI.
- Pakai stdlib/fitur yang sudah ada dulu. Dependensi baru hanya dengan alasan 1 baris.
- Ubah hanya yang diminta. Tanpa refactor, rename, atau format ulang di luar tugas.
- Edit lewat diff kecil, bukan menulis ulang file.
- Migrasi/skema DB: jangan ubah file lama. Buat file baru bernomor berikutnya.

## 7. Swarm (agen paralel)
- Hanya untuk tugas besar yang bisa dipecah dan independen. Tugas kecil kerjakan sendiri.
- Beri sub-agen konteks minimal: tujuan, file terkait, batasan, dan 3 entri progress terakhir yang relevan.
- Hasil sub-agen: ringkasan maks 10 baris + daftar file berubah.
- Satu file hanya diedit satu agen. Pencatatan `progress.md` dilakukan agen utama saja, agar tidak bentrok.

## 8. Konteks hampir penuh
- Perbarui entri progress terakhir (Status, Berikutnya, Catatan) lebih dulu, lalu lanjut atau mulai sesi baru.
- Sesi baru cukup mengikuti bagian 1; tidak perlu ringkasan lain.

## 9. Keamanan & verifikasi
- Minta konfirmasi sebelum: hapus file/data, drop/reset DB, force push, ubah `.env` atau secret.
- Jangan mencetak atau meng-commit secret/kunci API.
- Jangan klaim selesai sebelum diverifikasi (tes/build/lint via rtk). Jika tidak bisa, katakan.
- Tidak yakin pada hal berisiko → tanya 1 pertanyaan spesifik, jangan menebak.
