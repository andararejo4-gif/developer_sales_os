import { KbFact } from './types';

export const THE_PARK_KB_FACTS: KbFact[] = [
  // 1. IDENTITAS PROYEK
  {
    fact_id: 'KB-ID-01',
    category: 'identitas',
    key: 'nama_proyek',
    value: 'The Park Townhouse Sukoharjo',
    source_citation: 'Brosur Resmi Hal. 1',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-ID-02',
    category: 'identitas',
    key: 'pengembang_legal',
    value: 'PT Andara Rejo Makmur',
    source_citation: 'Legalitas Akta Notaris & Brosur Hal. 1',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-ID-03',
    category: 'identitas',
    key: 'konsep_arsitektur',
    value: 'Modern Kontemporer Jepang Bernuansa Zen Tropis',
    source_citation: 'Brosur Resmi Hal. 2',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-ID-04',
    category: 'identitas',
    key: 'total_unit_dan_cluster',
    value: '30 Unit Townhouse dalam 3 Cluster (Nagoya, Osaka, Tokyo)',
    source_citation: 'Masterplan & Brosur Hal. 3',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },

  // 2. LOKASI & AKSES
  {
    fact_id: 'KB-LOK-01',
    category: 'lokasi_akses',
    key: 'alamat_proyek',
    value: 'Jl. Wandyo Pranoto, Mandan, Sukoharjo, Jawa Tengah',
    source_citation: 'Brosur Hal. 1 & PBG Resmi',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-LOK-02',
    category: 'lokasi_akses',
    key: 'koordinat_cluster_nagoya',
    value: '-7.6738726546957565, 110.84397833605674',
    source_citation: 'Spesifikasi GPS Lapangan',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-LOK-03',
    category: 'lokasi_akses',
    key: 'koordinat_cluster_osaka',
    value: '-7.670296745443235, 110.83933117795694',
    source_citation: 'Spesifikasi GPS Lapangan',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-LOK-04',
    category: 'lokasi_akses',
    key: 'koordinat_cluster_tokyo',
    value: '-7.670599344181913, 110.83923919943206',
    source_citation: 'Spesifikasi GPS Lapangan',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-LOK-05',
    category: 'lokasi_akses',
    key: 'jarak_rsud_ir_soekarno',
    value: 'sekitar 2.1 km (waktu tempuh sekitar 6 menit berkendara)',
    source_citation: 'Analisis OpenStreetMap & Brosur Hal. 4',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-LOK-06',
    category: 'lokasi_akses',
    key: 'jarak_alun_alun_sukoharjo',
    value: 'sekitar 3.2 km (waktu tempuh sekitar 8 menit berkendara)',
    source_citation: 'Analisis OpenStreetMap & Brosur Hal. 4',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-LOK-07',
    category: 'lokasi_akses',
    key: 'jarak_the_park_mall_solo_baru',
    value: 'sekitar 8.5 km (waktu tempuh sekitar 12 menit berkendara)',
    source_citation: 'Analisis OpenStreetMap & Brosur Hal. 4',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-LOK-08',
    category: 'lokasi_akses',
    key: 'jarak_stasiun_sukoharjo',
    value: 'sekitar 3.8 km (waktu tempuh sekitar 7 menit berkendara)',
    source_citation: 'Analisis OpenStreetMap & Brosur Hal. 4',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },

  // 3. TIPE UNIT & HARGA
  {
    fact_id: 'KB-TIPE-01',
    category: 'tipe_harga',
    key: 'cluster_nagoya_diamond',
    value: 'Tipe Diamond 75/90 (LB 75 m², LT 90 m²), 2 lantai, 3 Kamar Tidur, 2 Kamar Mandi, Carport, Inner Courtyard',
    source_citation: 'Pricelist Resmi Hal. 1 & Denah Arsitektur',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true,
    valid_until: '2026-12-31'
  },
  {
    fact_id: 'KB-TIPE-02',
    category: 'tipe_harga',
    key: 'harga_nagoya_diamond',
    value: 'Cash Keras Rp 830.000.000 s.d. Rp 850.000.000; Cash Tempo 24 Bulan Rp 930.000.000 s.d. Rp 950.000.000',
    source_citation: 'Pricelist Resmi Hal. 1 Kolom Cash & Tempo',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true,
    valid_until: '2026-12-31'
  },
  {
    fact_id: 'KB-TIPE-03',
    category: 'tipe_harga',
    key: 'cluster_osaka_gold',
    value: 'Tipe Gold 60/72 (LB 60 m², LT 72 m²), 2 Kamar Tidur, 1 Kamar Mandi, Carport',
    source_citation: 'Pricelist Resmi Hal. 1 & Denah Arsitektur',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true,
    valid_until: '2026-12-31'
  },
  {
    fact_id: 'KB-TIPE-04',
    category: 'tipe_harga',
    key: 'harga_osaka_gold',
    value: 'Cash Keras Rp 670.000.000 s.d. Rp 680.000.000; Cash Tempo 24 Bulan Rp 750.000.000 s.d. Rp 760.000.000',
    source_citation: 'Pricelist Resmi Hal. 1 Kolom Cash & Tempo',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true,
    valid_until: '2026-12-31'
  },
  {
    fact_id: 'KB-TIPE-05',
    category: 'tipe_harga',
    key: 'cluster_tokyo_emerald',
    value: 'Tipe Emerald 50/60 (LB 50 m², LT 60 m²), 2 Kamar Tidur, 1 Kamar Mandi, Carport',
    source_citation: 'Pricelist Resmi Hal. 1 & Denah Arsitektur',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true,
    valid_until: '2026-12-31'
  },
  {
    fact_id: 'KB-TIPE-06',
    category: 'tipe_harga',
    key: 'harga_tokyo_emerald',
    value: 'Cash Keras Rp 580.000.000; Cash Tempo 24 Bulan Rp 650.000.000',
    source_citation: 'Pricelist Resmi Hal. 1 Kolom Cash & Tempo',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true,
    valid_until: '2026-12-31'
  },

  // 4. SPESIFIKASI BANGUNAN
  {
    fact_id: 'KB-SPEK-01',
    category: 'spesifikasi_bangunan',
    key: 'pondasi_dan_struktur',
    value: 'Pondasi Batu Belah & Rangka Beton Bertulang Standar SNI',
    source_citation: 'Brosur Spesifikasi Teknis Hal. 5',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-SPEK-02',
    category: 'spesifikasi_bangunan',
    key: 'dinding_bangunan',
    value: 'Bata Merah Plester Aci Berkualitas Prima, Dinding Ganda Antarunit',
    source_citation: 'Brosur Spesifikasi Teknis Hal. 5',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-SPEK-03',
    category: 'spesifikasi_bangunan',
    key: 'lantai_utama',
    value: 'Homogeneous Tile 60x60 cm Motif Marmer Halus',
    source_citation: 'Brosur Spesifikasi Teknis Hal. 5',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-SPEK-04',
    category: 'spesifikasi_bangunan',
    key: 'ketinggian_plafon',
    value: 'High Ceiling 3,8 Meter pada Ruang Utama',
    source_citation: 'Brosur Arsitektur Hal. 3',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-SPEK-05',
    category: 'spesifikasi_bangunan',
    key: 'kelistrikan_dan_air',
    value: 'Listrik PLN 2.200 VA Saluran Bawah Tanah (Underground) & Sumur Bor Artesis Higienis',
    source_citation: 'Brosur Spesifikasi Teknis Hal. 5',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },

  // 5. SKEMA PEMBAYARAN & LEGALITAS
  {
    fact_id: 'KB-BAYAR-01',
    category: 'skema_pembayaran_promo',
    key: 'opsi_pembayaran',
    value: 'Cash Keras, Cash Bertahap (Cash Tempo) 6, 12, hingga 24 Bulan Langsung ke Developer Tanpa Bank, dan KPR Bank Nasional / KPR Syariah',
    source_citation: 'Pricelist Resmi Ketentuan Pembayaran',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true,
    valid_until: '2026-12-31'
  },
  {
    fact_id: 'KB-BAYAR-02',
    category: 'skema_pembayaran_promo',
    key: 'kemitraan_bank_kpr',
    value: 'Bank Tabungan Negara (BTN), Bank Mandiri, Bank Syariah Indonesia (BSI), Bank Central Asia (BCA)',
    source_citation: 'Pricelist Brosur Kemitraan Bank',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-LEG-01',
    category: 'legalitas',
    key: 'status_sertifikat',
    value: 'Sertifikat Hak Milik (SHM) Sudah Pecah per Kavling / Unit',
    source_citation: 'Dokumen Legalitas Pengembang No. SHM/Mdn/2025',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-LEG-02',
    category: 'legalitas',
    key: 'perizinan_bangunan',
    value: 'Persetujuan Bangunan Gedung (PBG) Lengkap Resmi Terbit',
    source_citation: 'Dokumen DPMPTSP Kab. Sukoharjo',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },

  // 6. FASILITAS KAWASAN
  {
    fact_id: 'KB-FAS-01',
    category: 'fasilitas_kawasan',
    key: 'keamanan_lingkungan',
    value: 'Sistem Gerbang Tunggal (One Gate System), Security Guard 24 Jam, dan CCTV Kawasan Terintegrasi',
    source_citation: 'Brosur Kawasan Hal. 6',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  },
  {
    fact_id: 'KB-FAS-02',
    category: 'fasilitas_kawasan',
    key: 'utilitas_dan_lingkungan',
    value: 'Underground Utilities (Kabel Listrik & Drainase Tertutup), Taman Zen Garden, Children Play Area',
    source_citation: 'Brosur Kawasan Hal. 6',
    status: 'terverifikasi',
    confidence: 1.0,
    boleh_publik: true
  }
];
