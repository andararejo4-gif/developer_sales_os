# Architecture & Design Decisions (Developer Sales OS)

Dokumen ini mencatat keputusan arsitektural dan teknis yang diambil selama pembangunan platform multi-tenant **Developer Sales OS** (`developerproperti.giivepro.com`).

---

## 1. Multi-Tenant Architecture & Data Isolation
- **Pola**: Single Database, Shared Schema dengan Discriminator Column `tenant_id` di setiap tabel data bisnis.
- **Prinsip Per Proyek**: Data (KB, 99 Keunggulan, Riset, Target, Kalender, Playbook, Rute, Pipeline CRM, dan KPI) melekat pada **satu proyek**, bukan pada developer.
- **Cakupan Akses Per Proyek**:
  - Tabel `project_members` (tenant_id, project_id, user_id, role_di_proyek, atasan_id, aktif).
  - Penugasan default: 1 proyek.
  - Penugasan tambahan: wajib disetujui pemegang wewenang penugasan (SM atau Owner) dan dicatat di audit log.
  - Role tingkat developer: `DEVELOPER_OWNER` dan `DIREKSI` otomatis melihat seluruh proyek tenant.
  - Role tingkat proyek (`SALES_MANAGER`, `TEAM_LEADER`, `SALES_EXECUTIVE`, `DEVELOPER_ADMIN`, dll.) hanya melihat proyek yang ditugaskan.
  - Pengalih proyek (`ProjectSwitcher`) di navbar bekerja dalam konteks satu proyek terpilih.

## 2. Mode Demo 30 Hari & Pemotongan Cuplikan (Server-Side Teaser)
- Status akun tenant: `DEMO` -> `AKTIF` atau `DEMO_BERAKHIR`.
- Selama `DEMO`:
  - Surat Cinta 99 Keunggulan: **Gratis dan Penuh (100%)**.
  - Fitur berbayar lainnya: **Mode Cuplikan (25%)**.
  - **Aturan Keras**: Sisa data (75%) yang diburamkan **TIDAK BOLEH dikirim ke browser**. Pemotongan dilakukan di data layer/server agar tidak bisa ditembus lewat Network Inspect atau API.
  - **Tanpa Hitung Mundur & Tanpa Desakan**: Dilarang menampilkan hitung mundur sisa hari, kuota palsu, atau kata-kata mendesak. Bahasa sistem bernada hangat dan mengundang.

## 3. Hook Ajakan Mikro (Bagian 4B)
- Komponen `HookMikro`: kartu non-blocking (lebar max 320px di desktop, chip 64px di mobile) di pojok kanan bawah.
- Aturan tampil:
  - Muncul setelah pengguna terlibat (>= 20 detik atau menyentuh bagian terkunci).
  - Maksimal 1 per halaman, maksimal 2 per sesi.
  - Cooldown 14 hari bila memilih "Nanti saja" (`hook_cooldown_hari`).
  - Dilarang tampil pada formulir, kuesioner, wizard, login, dan settings.
  - Role non-pembeli (SE/TL) melihat tautan sunyi *"Sarankan ke Owner"*.

## 4. Product Knowledge Base (Fase 1A - Sumber Kebenaran Tunggal)
- Mengorganisir fakta produk dalam kategori terstruktur dengan `fact_id` dan `source_citation`.
- Setiap klaim yang keluar wajib menyertakan `fact_id`.
- Pertanyaan di luar data dijawab: *"Datanya belum ada di brosur/pricelist, perlu dikonfirmasi developer."* (Tidak boleh ditebak).
- Menghasilkan **Kartu Produk 1 Halaman Siap Cetak** dan **Kuis Pengetahuan Produk 10 Soal SE Baru** (kelulusan 80%).

## 5. Kuesioner Onboarding Developer & Adaptasi Sistem (Fase 1B)
- Pendaftaran akun menyatu dengan kuesioner profil & struktur tim.
- Mesin terpusat `effective_features(tenant, project)` mengatur:
  - Sembunyikan rute SE, KPI SE, kalender in-house bila sales in-house tidak ada.
  - Hierarki supervisi adaptif: SE -> TL -> SM, atau SE -> SM, atau SE -> Owner.
  - Mode TL Virtual Full AI aktif bila paket Platinum/Diamond.
  - Target per SE dihitung secara dinamis dari headcount (N).

## 6. Dasbor Direksi Lintas Proyek (Revenue Governance)
- **Aktual Pendapatan** murni dihitung dari unit berstatus **Akad / Closing** (`terjual`).
- Status **Booking** ditampilkan terpisah sebagai pipeline berjalan dan **tidak dihitung pendapatan**.
- Menampilkan target omset, realisasi aktual, dan % capaian per proyek dan gabungan.
