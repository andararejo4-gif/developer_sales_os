# Git Synchronization & Remote File Protection Rule

## Overview
Aturan proteksi dan sinkronisasi berkas Git untuk mencegah hilangnya data atau tertimpanya pekerjaan di remote repository (`origin`).

## Rule Directives
1. **Always Check Remote First**:
   - Selalu fetch dan periksa remote status sebelum commit atau push: `git fetch origin <branch>`.
2. **Never Touch/Delete Files Present on Remote but Absent Locally**:
   - Jika ada file yang telah dibuat atau diubah di remote tetapi belum ada di laptop, file tersebut TIDAK BOLEH dihapus, diabaikan, atau ditimpa paksa.
3. **Notify User of Discrepancies**:
   - Tampilkan informasi perbedaan file remote vs lokal secara rinci kepada pengguna.
4. **Safe Adjustment (Reconciliation)**:
   - Lakukan merge / checkout aman untuk mengunduh berkas remote ke laptop dan selaraskan perubahan lokal dengan perubahan remote secara harmonis tanpa menghapus pekerjaan siapapun.
   - Uji kode dengan `bun test` dan `npm run build` sebelum push.
