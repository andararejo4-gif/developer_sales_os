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

## 7. Riset Pasar & 5 Persona Target (Fase 2)
- **Cincin Radius Komprehensif**: Pemetaan fasilitas publik dan kompetitor perumahan mencakup 9 cincin radius (500 m, 1 km, 2 km, 3 km, 5 km, 10 km, 15 km, 20 km, 25 km) dari koordinat GPS klaster The Park Townhouse Sukoharjo.
- **5 Persona Target**: Memetakan demografi, kebutuhan riil (pains/needs), keberatan umum, kanal penjualan favorit, dan pemicu beli. Setiap klaim keunggulan wajib ditautkan ke `fact_id` Knowledge Base.
- **Data-Driven Infographics**: Diagram pangsa pasar (Market Share) dan perbandingan harga per m² dihasilkan secara murni dari data terstruktur (SVG Donut Chart dan Bar Chart), bukan gambar rekaan/bitmap statis.
- **Wewenang**: Aksi *Regenerate* riset pasar hanya dapat dijalankan oleh role `DEVELOPER_OWNER`, `DIREKSI`, dan `SALES_MANAGER` (SM). Akses role `SE` dan `TL` berstatus read-only.

## 8. Target Penjualan Menuju Sold Out 100% (Fase 2)
- **3 Skenario Penjualan Fleksibel**:
  - *Konservatif* (kecepatan santai ~6% total unit/bulan).
  - *Realistis* (target seimbang ~10% total unit/bulan).
  - *Optimis* (akselerasi cepat ~18% total unit/bulan).
- **Kalkulator Sold Out**: Menghitung mundur durasi bulan sampai seluruh unit tersisa menjadi 0 (sold out 100%).
- **Reverse Funnel Aktivitas Tim Sales**: Setiap 1 unit closing dihitung mundur ke kebutuhan aktivitas riil: ~1.5 booking, ~6 survei lokasi, ~15 prospek hangat, ~40 kontak pertama, ~120 leads digital/kanvasing.
- **Pembagian Target SE Adaptif**: Target bulanan dan aktivitas mingguan/harian otomatis dialokasikan merata berdasarkan headcount $N$ Sales Executive.

## 9. Kebijakan Anti-Bocor Token & Metadata AI pada Ekspor Dokumen
- Metadata pemakaian token (input/output tokens, perkiraan biaya, nama model) **HANYA** disimpan di log database internal (`ai_usage`) untuk monitoring SUPERADMIN.
- Dokumen ekspor (DOCX, PDF, dan cetak HTML) diverifikasi oleh guardrail `assertNoTokenLeakage` untuk memastikan **100% bersih dari angka token, biaya AI, atau prompt internal**.

## 10. Kalender Konten Media Sosial 30 Hari (Fase 3)
- **Struktur 30 Hari x 3 Slot/Hari (90 Slot)**:
  - *Slot 1 (Pagi 09:00 WIB)*: TOFU (Top of Funnel) &mdash; Edukasi arsitektur, kesadaran iklim Solo, jebakan sertifikat induk vs pecah per kavling.
  - *Slot 2 (Siang 14:00 WIB)*: MOFU (Middle of Funnel) &mdash; Room tour klaster Nagoya/Tokyo, bukti legalitas PBG/SHM, komparasi spesifikasi bata merah, akses mall & RS Indriati.
  - *Slot 3 (Malam 19:30 WIB)*: BOFU (Bottom of Funnel) &mdash; Urgensi unit tersisa, promo pelunasan cash keras, skema cash bertahap 24 bulan langsung developer, undangan survei akhir pekan via WhatsApp.
- **Dua Jalur Konten**:
  - *Jalur Akun Official Proyek*: Mengedepankan wibawa brand pengembang, arsitektur, dan legalitas.
  - *Jalur Akun Sales In-House*: Sudut pandang (POV) personal agen sales ramah untuk membangun kedekatan dan interaksi langsung prospek.
- **Validasi Sumber Faktual**: Setiap slot wajib memiliki referensi `sourceFactId` ke Knowledge Base dan nomor urut Surat Cinta 99 Keunggulan (`sourceLoveLetterPoint`).
- **Pelacakan Link Live (`postedUrl`)**: Tim marketing/sales dapat menempelkan URL postingan live (Instagram/TikTok/FB) langsung ke kartu slot untuk mengubah status menjadi `SUDAH_POSTING`.

## 11. Playbook Sales (SE, TL, SM) & Rute Harian GPS Kanvasing (Fase 4)
- **Hierarki & Matriks Peran**:
  - *Sales Executive (SE)*: Fokus pada eksekusi harian (SLA respon $\le 5$ menit, kanvasing B2B, penapisan BANT $\ge 7.0$, dan survei show unit).
  - *Team Leader (TL)*: Fokus pada supervisi kedisiplinan radar SLA 5 menit, coaching penanganan keberatan, dan penarikan lead mangkir $>72$ jam ke pool bersama.
  - *Sales Manager (SM)*: Fokus pada alokasi kuota unit, manajemen master pricelist, approval diskon eskalasi, dan konsolidasi target omset proyek.
- **Kualifikasi BANT Berbobot (Threshold $\ge 7.0$)**:
  - Menggunakan rumus berbobot: $\text{Skor} = (\text{Budget} \times 0.3) + (\text{Authority} \times 0.25) + (\text{Need} \times 0.25) + (\text{Timeline} \times 0.2)$.
  - Prospek dengan skor $\ge 7.0$ dikategorikan *HOT_PROSPEK* dan diprioritaskan untuk survei VIP dan penguncian booking.
- **Rute Harian GPS Kanvasing SE**:
  - Titik awal berangkat dan kembali dijangkar secara presisi pada koordinat gerbang proyek (`-7.6738726546957565, 110.84397833605674`).
  - Waypoints memetakan klaster strategis: RS Indriati (medis), perbankan BSI/BTN Solo Baru (finansial), dan sentra niaga Ir. Soekarno (B2B pengusaha) dengan rundown jam dan target flyer/leads.
  - Ekspor DOCX diverifikasi bebas 100% dari kebocoran token internal AI.

## 12. Project Website Generator & Simulator Cicilan (Fase 5)
- **Arsitektur Subdomain Multi-Tenant**: Setiap proyek diterbitkan di subdomain unik (contoh: `thepark.developerproperti.giivepro.com`). Memerlukan wildcard DNS (`*.developerproperti.giivepro.com`) dan wildcard SSL/TLS certificate.
- **Simulator Angsuran Anuitas KPR**: Menghitung estimasi angsuran anuitas bulanan secara akurat berdasarkan plafon pinjaman ($P - \text{DP}$), suku bunga efektif tahunan ($r$), dan tenor ($n$ tahun).
- **Klausul Kepatuhan Regulasi Finansial (Non-Binding Notice)**:
  - Wajib menyertakan disclaimer: *"Hasil simulasi merupakan estimasi indikatif dan bukan komitmen kredit final. Keputusan suku bunga dan persetujuan plafon pembiayaan sepenuhnya merupakan wewenang bank rekanan penyedia KPR."*
- **Ekspor Single-Page HTML Mandiri**: Menyediakan tombol unduh file HTML lengkap mandiri tanpa dependensi eksternal, siap di-upload ke CDN atau web server Apache/Nginx apa pun.
- **Pelacakan Inbound Lead Otomatis**: Formulir peminatan menangkap nama, WhatsApp, tipe unit pilihan, serta parameter UTM (`utm_source`, `utm_campaign`, `utm_medium`) dan langsung memasukkannya ke pipeline CRM proyek.

## 13. CRM Pipeline 7-Stage, Aturan Komisi, & Superadmin Multi-Tenant (Fase 6)
- **7 Tahap Canonical Pipeline Penjualan**:
  1. `LEAD_BARU`: Kontak baru masuk (SLA kontak pertama $\le 5$ menit).
  2. `TERKUALIFIKASI`: Lolos kontak awal dan mulai ditapis preferensi unit.
  3. `PROSPEK`: Telah menerima brosur lengkap dan simulasi skema pembayaran.
  4. `HOT_PROSPEK`: Lolos kualifikasi BANT dengan skor $\ge 7.0$.
  5. `BOOKING`: Telah memilih nomor unit kavling dan membayar tanda jadi.
  6. `AKAD_CLOSING`: Telah menandatangani AJB/Akad Kredit KPR di notaris/bank (*diakui sebagai omset aktual*).
  7. `BATAL_HILANG`: Dinyatakan batal dengan pencatatan alasan (SLIK rejected, tidak merespon, dll).
- **Format Label Bawahan (Subordinate Tagging)**:
  - Setiap kartu lead mencantumkan identitas SE dan TL penanggung jawab: `[Nama Calon Pembeli] (SE [Nama] - TL [Nama])`.
- **Daftar Tugas Follow-Up Berbasis Tanggal**:
  - Filter checklist follow-up beroperasi secara strictly date-driven berdasarkan `nextFollowUpDate` (bukan tanggal lead dibuat).
- **Modal Aturan Pembagian Komisi**:
  - Persentase komisi fleksibel dikonfigurasi oleh Owner/SM (% Pengembang/Kantor, % SM, % TL, % SE, % Affiliator) dengan validasi wajib tepat 100%.
- **Panel Superadmin Pusat**:
  - Pengawasan multi-tenant, toggle status langganan (*DEMO, AKTIF, DEMO_BERAKHIR*), override paket, dan audit konsumsi token AI per tenant (`ai_usage`).
- **Prinsip Pengakuan Pendapatan Direksi**:
  - Nilai *Aktual Realisasi* pada dasbor Direksi hanya dihitung dari unit berstatus Akad / Closing (`terjual`). Unit dalam tahap `booking` dicatat sebagai *Pipeline Berjalan*.

