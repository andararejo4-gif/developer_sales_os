// =====================================================================
// BANK TEKS RESMI CAROUSEL & POSTER - boleh disunting tanpa menyentuh logika.
// Aturan: netral & mengundang, tanpa angka/klaim, tiap baris maks 21 huruf.
// Tips TOFU = saran umum memilih rumah, BUKAN klaim produk.
// =====================================================================

export type Lines = [string, string];
/** [ikon, judul, keterangan] */
export type Point = [string, string, string];
export interface Tip {
  head: Lines;
  points: [Point, Point];
}
export interface Story {
  match: RegExp;
  covers: Lines[];
  tips: Tip[];
  /** ID fakta (poster-engine FACTS) untuk slide "contoh nyata"; yang di luar cluster dilewati. */
  facts: string[];
  ribbon: string;
}

export const TOFU_STORIES: Record<string, Story> = {
  KEAMANAN: {
    match: /keamanan|security|smart|one-gate|privasi/i,
    covers: [['Yang Membuat Rumah', 'Terasa Tenang'], ['Tenang Dimulai', 'dari Kebiasaan Kecil'], ['Istirahat Nyenyak', 'di Rumah Sendiri'], ['Rumah Tenang', 'untuk Si Kecil'], ['Pulang Larut', 'dengan Hati Tenang'], ['Cara Sederhana', 'Merasa Tenang']],
    tips: [
      { head: ['Tenang Dimulai', 'dari Gerbang'], points: [['gate barrier', 'Akses Masuk', 'Lewat Mana Saja'], ['clipboard', 'Tamu Datang', 'Tercatat atau Tidak']] },
      { head: ['Kenali Siapa', 'yang Berjaga'], points: [['clock', 'Jadwal Jaga', 'Siang dan Malam'], ['telephone', 'Nomor Kontak', 'Mudah Dihubungi']] },
      { head: ['Kunci yang', 'Memudahkan Keluarga'], points: [['key', 'Jenis Kunci', 'Fisik atau Pintar'], ['family', 'Akses Keluarga', 'Siapa Saja']] },
      { head: ['Terang Itu', 'Menenangkan'], points: [['street lamp', 'Lampu Jalan', 'Menyala Merata'], ['porch light', 'Teras Rumah', 'Tidak Gelap']] },
      { head: ['Kamera di Tempat', 'yang Tepat'], points: [['security camera', 'Titik Kamera', 'Gerbang dan Jalan'], ['calendar', 'Lama Rekaman', 'Berapa Hari']] },
      { head: ['Tetangga yang', 'Saling Mengenal'], points: [['handshake', 'Suasana Sore', 'Warga Menyapa'], ['chat bubble', 'Grup Warga', 'Aktif Berbagi Kabar']] },
    ],
    facts: ['ONEGATE', 'SATPAM', 'CCTV'],
    ribbon: 'KEAMANAN',
  },
  ARSITEKTUR: {
    match: /arsitektur|japandi|garasi|desain/i,
    covers: [['Rumah Rapi', 'Dimulai dari Denah'], ['Sederhana yang', 'Nyaman Dilihat'], ['Cahaya Alami', 'di Ruang Keluarga'], ['Rumah yang', 'Memudahkan Hari'], ['Ruang Kecil', 'yang Terasa Lega'], ['Detail Kecil', 'yang Terasa Besar']],
    tips: [
      { head: ['Cahaya Masuk', 'dari Mana'], points: [['window', 'Arah Jendela', 'Cek Siang Hari'], ['lamp', 'Lampu Siang', 'Perlu atau Tidak']] },
      { head: ['Udara yang', 'Mengalir Bebas'], points: [['wind', 'Dua Bukaan', 'Depan dan Belakang'], ['open window', 'Uji Sederhana', 'Buka Semua Jendela']] },
      { head: ['Jalur Gerak', 'yang Ringkas'], points: [['dining table', 'Dapur ke Meja', 'Dekat atau Jauh'], ['stairs', 'Tangga Rumah', 'Lebar dan Landai']] },
      { head: ['Tempat Simpan', 'Sejak Awal'], points: [['wardrobe', 'Posisi Lemari', 'Sudah Ada Ruangnya'], ['stairs', 'Bawah Tangga', 'Bisa Dipakai']] },
      { head: ['Material yang', 'Mudah Dirawat'], points: [['paint roller', 'Cat Dinding', 'Mudah Dibersihkan'], ['floor tiles', 'Pilihan Lantai', 'Tidak Licin']] },
      { head: ['Garasi Ikut', 'Diperhitungkan'], points: [['car', 'Ukuran Mobil', 'Pintu Bisa Dibuka'], ['bicycle', 'Motor dan Sepeda', 'Ada Tempatnya']] },
    ],
    facts: ['JAPANDI', 'GARASI', 'TAMAN'],
    ribbon: 'GARASI',
  },
  KELUARGA: {
    match: /clubhouse|fasilitas|lifestyle|keluarga/i,
    covers: [['Akhir Pekan', 'yang Tak Perlu Jauh'], ['Waktu Bersama', 'yang Lebih Panjang'], ['Anak Bermain', 'di Dekat Rumah'], ['Olahraga Jadi', 'Kebiasaan Keluarga'], ['Rumah Tempat', 'Semua Berkumpul'], ['Hari Libur', 'Dimulai dari Rumah']],
    tips: [
      { head: ['Dekat Itu', 'Menghemat Waktu'], points: [['footsteps', 'Jarak Fasilitas', 'Bisa Jalan Kaki'], ['clock', 'Jam Buka', 'Cocok dengan Jadwal']] },
      { head: ['Ruang Kumpul', 'yang Dipakai Semua'], points: [['sofa', 'Ruang Keluarga', 'Muat Semua'], ['dining table', 'Meja Makan', 'Jadi Pusatnya']] },
      { head: ['Anak Bergerak', 'Lebih Banyak'], points: [['playground', 'Area Bermain', 'Terlihat dari Rumah'], ['road', 'Jalan Cluster', 'Tidak Ramai Lewat']] },
      { head: ['Tamu Datang', 'Tetap Nyaman'], points: [['parking sign', 'Parkir Tamu', 'Ada Tempatnya'], ['armchair', 'Ruang Duduk', 'Cukup Lega']] },
      { head: ['Jeda Singkat', 'di Taman'], points: [['leafy tree', 'Taman Rumah', 'Cukup untuk Duduk'], ['sun shade', 'Bagian Teduh', 'Pohon atau Kanopi']] },
      { head: ['Tanyakan Iuran', 'Sejak Awal'], points: [['receipt', 'Iuran Bulanan', 'Minta Rinciannya'], ['checklist', 'Yang Didapat', 'Catat Semuanya']] },
    ],
    facts: ['CLUBHOUSE', 'KELUARGA', 'TAMAN', 'CONCIERGE'],
    ribbon: 'KELUARGA',
  },
  KOMPARASI: {
    match: /komparasi|second|bangun sendiri|banding/i,
    covers: [['Rumah Baru', 'atau Rumah Lama'], ['Sebelum Memilih', 'Kenali Bedanya'], ['Dua Pilihan', 'Satu Keputusan'], ['Renovasi atau', 'Langsung Tinggal'], ['Memilih Rumah', 'dengan Tenang'], ['Yang Perlu', 'Ditimbang Dulu']],
    tips: [
      { head: ['Hitung Biaya', 'Sampai Selesai'], points: [['price tag', 'Harga Beli', 'Baru Awalnya'], ['tools', 'Biaya Perbaikan', 'Catat Perkiraannya']] },
      { head: ['Waktu Juga', 'Perlu Dihitung'], points: [['calendar', 'Siap Tinggal', 'Kapan Bisa Masuk'], ['helmet', 'Urusan Tukang', 'Siapa Mengawasi']] },
      { head: ['Cek yang', 'Tidak Terlihat'], points: [['water pipe', 'Pipa dan Listrik', 'Usia dan Kondisi'], ['roof', 'Bagian Atap', 'Bekas Rembes']] },
      { head: ['Periksa Surat', 'Sejak Awal'], points: [['certificate', 'Sertifikat', 'Cek Namanya'], ['document', 'Izin Bangunan', 'Sesuai Kondisi']] },
      { head: ['Lingkungan Ikut', 'Dipilih'], points: [['road', 'Jalan Depan', 'Lebar dan Rapi'], ['houses', 'Sekitar Rumah', 'Rasakan Suasananya']] },
      { head: ['Bandingkan', 'Apa Adanya'], points: [['checklist', 'Buat Daftar', 'Kelebihan Tiap Rumah'], ['family', 'Ajak Keluarga', 'Putuskan Bersama']] },
    ],
    facts: ['JAPANDI', 'GARASI', 'ONEGATE'],
    ribbon: 'DUA_LANTAI',
  },
  LOKASI: {
    match: /lokasi|koridor|sudirman|jombor|alamat/i,
    covers: [['Dekat yang', 'Benar Terasa'], ['Alamat Baru', 'untuk Hari Teratur'], ['Perjalanan Pulang', 'yang Lebih Ringan'], ['Lokasi Bukan', 'Sekadar Peta'], ['Rumah di Tempat', 'yang Kita Kenal'], ['Memilih Alamat', 'untuk Keluarga']],
    tips: [
      { head: ['Coba Jalannya', 'di Jam Sibuk'], points: [['sunrise', 'Rute Berangkat', 'Coba Pagi Hari'], ['sunset', 'Rute Pulang', 'Coba Sore Hari']] },
      { head: ['Hitung Menit', 'Bukan Kilometer'], points: [['briefcase', 'Ke Tempat Kerja', 'Catat Waktunya'], ['school', 'Ke Sekolah Anak', 'Jam Antar Jemput']] },
      { head: ['Kebutuhan Harian', 'di Sekitar'], points: [['shopping basket', 'Pasar dan Toko', 'Seberapa Dekat'], ['medical cross', 'Layanan Kesehatan', 'Mudah Dicapai']] },
      { head: ['Lihat Jalan', 'Saat Hujan'], points: [['rain', 'Titik Genangan', 'Cek Jalan Rendah'], ['drain', 'Saluran Air', 'Lancar atau Tidak']] },
      { head: ['Sinyal Juga', 'Perlu Dicek'], points: [['mobile phone', 'Sinyal Telepon', 'Coba di Dalam Rumah'], ['wifi', 'Jaringan Internet', 'Tanyakan Pilihannya']] },
      { head: ['Rasakan Suasana', 'Malam Harinya'], points: [['street lamp', 'Penerangan', 'Jalan dan Gang'], ['ear', 'Suara Sekitar', 'Ramai atau Tenang']] },
    ],
    facts: ['LOK_NAGOYA', 'LOK_OSAKA', 'LOK_TOKYO', 'ONEGATE', 'JAPANDI', 'GARASI'],
    ribbon: 'JAPANDI_SKH',
  },
  RENCANA: {
    match: /skema|bayar|kpr|cash|harga|penawaran|momentum/i,
    covers: [['Rencana Rumah', 'yang Masuk Akal'], ['Menabung Rumah', 'dengan Tenang'], ['Langkah Kecil', 'ke Rumah Pertama'], ['Atur Dulu', 'Lalu Melangkah'], ['Rumah Impian', 'yang Direncanakan'], ['Menyiapkan Rumah', 'Bersama Pasangan']],
    tips: [
      { head: ['Catat Dulu', 'Arus Bulanan'], points: [['wallet', 'Pemasukan', 'Rata-Rata Tetap'], ['receipt', 'Pengeluaran', 'Rutin dan Tak Rutin']] },
      { head: ['Siapkan Dana', 'di Luar Harga'], points: [['document', 'Biaya Surat', 'Minta Rinciannya'], ['sofa', 'Isi Rumah', 'Bertahap Saja']] },
      { head: ['Pahami Skema', 'Sebelum Memilih'], points: [['calendar', 'Tunai Bertahap', 'Cek Jangka Waktu'], ['bank building', 'Skema KPR', 'Cek Syarat Bank']] },
      { head: ['Sisakan Ruang', 'untuk Darurat'], points: [['piggy bank', 'Dana Cadangan', 'Tetap Disimpan'], ['balance scale', 'Besar Cicilan', 'Tetap Nyaman']] },
      { head: ['Rapikan Berkas', 'Sejak Awal'], points: [['id card', 'Data Diri', 'Lengkap dan Sama'], ['folder', 'Slip Gaji', 'Simpan Berurutan']] },
      { head: ['Putuskan', 'Bersama Pasangan'], points: [['handshake', 'Batas Nyaman', 'Sepakati Angkanya'], ['checklist', 'Prioritas', 'Tulis Bersama']] },
    ],
    facts: ['KAMAR', 'GARASI', 'JAPANDI'],
    ribbon: 'KELUARGA',
  },
};

/** Slide 5 TOFU: menghubungkan tips ke contoh nyata di cluster. */
export const EXAMPLE_HEADS: Lines[] = [
  ['Seperti Apa', 'Wujud Nyatanya'], ['Begini Rasanya', 'di Dalam Cluster'], ['Yang Sudah', 'Disiapkan di Sini'], ['Dari Daftar', 'Menjadi Nyata'],
  ['Detail yang', 'Sudah Dipikirkan'], ['Bukan Sekadar', 'Rencana'], ['Contoh yang', 'Bisa Dilihat'], ['Semua Itu', 'Ada di Sini'],
  ['Saat Daftar', 'Jadi Kenyataan'], ['Terasa Berbeda', 'Saat Dilihat'], ['Disiapkan untuk', 'Hari Biasa'], ['Wujudnya', 'di Cluster Ini'],
];

export const MOFU_COVERS: Lines[] = [
  ['Lihat Lebih Dekat', 'Sebelum Memilih'], ['Satu per Satu', 'Kita Lihat'], ['Dari Denah', 'Sampai Gerbang'], ['Mengenal Rumah', 'dari Dalam'],
  ['Apa Saja', 'yang Didapat'], ['Detail yang', 'Jarang Dilihat'], ['Rumah Ini', 'Cocok untuk Siapa'], ['Ruang demi Ruang', 'Apa Adanya'],
  ['Kenali Rumahnya', 'Sebelum Berkunjung'], ['Yang Sering', 'Ditanyakan Keluarga'], ['Melihat Rumah', 'Lebih Teliti'], ['Dari Fasad', 'Sampai Kunci Pintu'],
];

export interface Proof {
  scope: 'ALL' | 'Nagoya' | 'Osaka' | 'Tokyo';
  match: RegExp;
  heads: Lines[];
  facts: string[];
  shot: 'ROW' | 'FACADE' | 'CARPORT' | 'ENTRANCE';
}

/** Slide bukti MOFU: satu pesan per slide, fakta dari bank resmi. */
export const PROOFS: Record<string, Proof> = {
  ARSITEKTUR: { scope: 'ALL', match: /arsitektur|japandi|komparasi|second/i, facts: ['JAPANDI', 'KELUARGA'], shot: 'FACADE', heads: [['Dua Lantai', 'Bergaya Japandi'], ['Garis Bersih', 'dan Kayu Hangat'], ['Fasad yang', 'Tenang Dilihat'], ['Japandi yang', 'Hangat Ditinggali'], ['Rupa Rumah', 'yang Bersahaja'], ['Desain Rapi', 'dari Luar ke Dalam']] },
  GARASI: { scope: 'ALL', match: /garasi|carport/i, facts: ['GARASI', 'EV'], shot: 'CARPORT', heads: [['Garasi Dalam', 'Plus Carport'], ['Mobil Teduh', 'di Garasi Dalam'], ['Pulang Langsung', 'ke Dalam Garasi'], ['Ruang Khusus', 'untuk Kendaraan'], ['Garasi yang', 'Menyatu dengan Rumah'], ['Parkir Rapi', 'di Rumah Sendiri']] },
  RUANG: { scope: 'ALL', match: /ruang|kamar|denah|skema|bayar|penawaran/i, facts: ['KAMAR', 'TAMAN'], shot: 'FACADE', heads: [['Pilihan Kamar', 'untuk Keluarga'], ['Kamar yang', 'Bisa Dipilih'], ['Ruang untuk', 'Setiap Anggota'], ['Dua Lantai', 'Penuh Pilihan'], ['Kamar dan Taman', 'dalam Satu Rumah'], ['Ruang Pribadi', 'untuk Semua']] },
  KEAMANAN: { scope: 'ALL', match: /keamanan|one-gate|security|privasi/i, facts: ['ONEGATE', 'SATPAM', 'CCTV'], shot: 'ROW', heads: [['Satu Gerbang', 'untuk Penghuni'], ['Akses Terjaga', 'Sepanjang Hari'], ['Tamu Masuk', 'Lewat Satu Gerbang'], ['Gerbang yang', 'Mengenal Penghuni'], ['Dijaga Bersama', 'Siang dan Malam'], ['Berlapis dari', 'Gerbang ke Rumah']] },
  SMART: { scope: 'ALL', match: /smart|living|lock/i, facts: ['DOORLOCK', 'CONCIERGE'], shot: 'ENTRANCE', heads: [['Pintu Pintar', 'untuk Setiap Hari'], ['Praktis Dipakai', 'Setiap Hari'], ['Masuk Rumah', 'Tanpa Cari Kunci'], ['Bantuan yang', 'Mudah Dihubungi'], ['Rumah Praktis', 'untuk Keluarga'], ['Cukup Sentuhan', 'untuk Masuk']] },
  CLUBHOUSE: { scope: 'Nagoya', match: /clubhouse|fasilitas|kolam/i, facts: ['CLUBHOUSE', 'CONCIERGE'], shot: 'ROW', heads: [['Akhir Pekan', 'di Clubhouse'], ['Clubhouse', 'di Cluster Nagoya'], ['Kolam dan Gym', 'di Cluster Nagoya'], ['Berenang Tanpa', 'Pergi Jauh'], ['Tempat Santai', 'Penghuni Nagoya'], ['Clubhouse untuk', 'Hari Libur']] },
  LOK_NAGOYA: { scope: 'Nagoya', match: /lokasi|koridor/i, facts: ['LOK_NAGOYA', 'ONEGATE'], shot: 'ROW', heads: [['Alamatnya di', 'Jl. Tentara Pelajar'], ['Cluster Nagoya', 'di Tentara Pelajar'], ['Kenali Alamat', 'Cluster Nagoya'], ['Nagoya Ada', 'di Sini']] },
  LOK_OSAKA: { scope: 'Osaka', match: /lokasi|koridor/i, facts: ['LOK_OSAKA', 'ONEGATE'], shot: 'ROW', heads: [['Cluster Osaka', 'di Koridor Sudirman'], ['Alamat Osaka', 'di Koridor Sudirman'], ['Kenali Alamat', 'Cluster Osaka'], ['Osaka Ada', 'di Sini']] },
  LOK_TOKYO: { scope: 'Tokyo', match: /lokasi|koridor/i, facts: ['LOK_TOKYO', 'ONEGATE'], shot: 'ROW', heads: [['Cluster Tokyo', 'di Koridor Sudirman'], ['Alamat Tokyo', 'di Koridor Sudirman'], ['Kenali Alamat', 'Cluster Tokyo'], ['Tokyo Ada', 'di Sini']] },
};

/** Slide 5 MOFU: cocok untuk siapa. */
export const FIT_HEADS: Lines[] = [
  ['Cocok untuk', 'Keluarga Bertumbuh'], ['Untuk Keluarga', 'yang Butuh Ruang'], ['Pas untuk', 'Keluarga Muda'], ['Ruang yang Pas', 'untuk Kalian'],
  ['Untuk Anak', 'yang Butuh Kamar'], ['Pilih Sesuai', 'Kebutuhan Keluarga'], ['Dari Keluarga Kecil', 'hingga Besar'], ['Untuk yang Suka', 'Rumah Rapi'],
  ['Cocok untuk', 'Penyuka Ketenangan'], ['Teman Tumbuh', 'untuk Keluarga'],
];

/** Judul poster marketing (slide 6 carousel & cadangan poster tunggal). */
export const POSTER_HOOKS: Lines[] = [
  ['Tempat Pulang', 'yang Selalu Dirindu'], ['Ruang Tenang', 'yang Kita Pulangi'], ['Ruang Hangat', 'yang Selalu Dirindu'], ['Lampu Menyala', 'saat Langkah Tiba'],
  ['Dapur Hangat', 'Tempat Cerita Tumbuh'], ['Ruang untuk Tawa', 'yang Tak Terburu'], ['Meja Makan', 'Tempat Kita Berkumpul'], ['Pulang Kerja', 'Lalu Duduk Bersama'],
  ['Halaman Kecil', 'Tempat Anak Bermain'], ['Rumah untuk Keluarga', 'yang Tumbuh Bersama'], ['Teras Teduh', 'untuk Obrolan Ringan'], ['Ruang Keluarga', 'Tempat Hari Berakhir'],
  ['Rumah Baru', 'untuk Cerita Baru'], ['Alamat Baru', 'untuk Keluarga Kita'], ['Pintu yang Dibuka', 'dengan Senyum'], ['Rumah yang Ditunggu', 'Seisi Keluarga'],
  ['Kunci Pertama', 'untuk Rumah Kita'], ['Bab Baru', 'di Rumah Baru'], ['Ruang Tumbuh', 'untuk Si Kecil'], ['Sudut Favorit', 'di Rumah Sendiri'],
  ['Hangat Dilihat', 'Nyaman Ditinggali'], ['Rumah Japandi', 'untuk Keluarga'], ['Tempat Istirahat', 'yang Layak Dinanti'], ['Rumah yang Membuat', 'Betah di Dalam'],
  ['Pulang ke Tempat', 'yang Tenang'], ['Satu Rumah', 'untuk Banyak Cerita'], ['Waktu Tenang', 'di Rumah Sendiri'], ['Tempat Berkumpul', 'Setelah Hari Panjang'],
  ['Rumah yang Siap', 'Menyambut Kita'], ['Waktunya Punya', 'Ruang Sendiri'], ['Langkah Pulang', 'yang Paling Ringan'], ['Cerita Keluarga', 'Dimulai di Sini'],
  ['Rumah untuk', 'Hari-Hari Tenang'], ['Di Rumah Ini', 'Semua Berkumpul'], ['Tenang di Luar', 'Hangat di Dalam'], ['Ruang Nyaman', 'untuk Pulang'],
  ['Tempat Tinggal', 'yang Terasa Dekat'], ['Rumah Dua Lantai', 'untuk Keluarga'], ['Saat Rumah', 'Jadi Tempat Kembali'], ['Setiap Pulang', 'Terasa Istimewa'],
  ['Bangun Kenangan', 'di Rumah Baru'], ['Ruang Lapang', 'untuk Bertumbuh'], ['Rumah Impian', 'untuk Ditinggali'], ['Kembali ke Rumah', 'Kembali Tenang'],
  ['Suara Tawa', 'dari Ruang Keluarga'], ['Obrolan Hangat', 'di Meja Makan'], ['Rumah Tempat', 'Semua Diterima'],
  ['Dari Pintu Ini', 'Cerita Dimulai'], ['Rumah yang Kita', 'Ceritakan Nanti'], ['Untuk Keluarga', 'yang Kita Jaga'],
];
