// ============================================================================
// KNOWLEDGE BASE & PLAYBOOK RESMI V1.2 - THE PARK TOWNHOUSE SUKOHARJO
// Sumber: Sales_Playbook_SOP_KPI_SE_The_Park_Townhousev.1.2.pdf (Hal. 1-31)
// ============================================================================

export type PersonaCode = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'LAINNYA';

export interface BuyerPersonaProfile {
  code: PersonaCode;
  name: string;
  archetype: string;
  profil: string;
  kondisiSaatIni: string;
  motivasi: string;
  kekhawatiran: string;
  unitDanSkema: string;
  kanal: string;
  keunggulanPemicu: string;
  pendekatanClosing: string;
  openingHook: string;
}

export type PipelineStageCode =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'APPOINTMENT'
  | 'VISITED'
  | 'HOT_NEGOTIATION'
  | 'BOOKING'
  | 'DP_KPR_PROCESS'
  | 'PPJB_AKAD'
  | 'CLOSED_LOST';

export interface PipelineStageDefinition {
  code: PipelineStageCode;
  label: string;
  shortLabel: string;
  operationalDefinition: string;
  crmEvidence: string;
  colorClass: string;
}

export type BantGrade = 'A' | 'B' | 'C' | 'D';

export interface BantEvaluationResult {
  b: number; // 0..3
  a: number; // 0..3
  n: number; // 0..3
  t: number; // 0..3
  total: number; // 0..12
  grade: BantGrade;
  statusLabel: 'Hot' | 'Warm (Prospek)' | 'Cold' | 'Tidak layak / Arsip';
  isQualifiedProspect: boolean; // >= 7/12
  isHotGrade: boolean; // >= 10/12
  seAction: string;
  contactFrequency: string;
}

/**
 * 10 Tahapan Pipeline Resmi sesuai Bab 4.1 & Bab 13.3 Playbook v1.2 (Hal. 12 & 30)
 */
export const PLAYBOOK_PIPELINE_STAGES: PipelineStageDefinition[] = [
  {
    code: 'NEW',
    label: '1. Lead Baru (New)',
    shortLabel: 'Lead Baru',
    operationalDefinition: 'Kontak baru dengan nama + nomor WA/telepon aktif + sumber/kode konten, dan memberi izin dihubungi.',
    crmEvidence: 'Nama, nomor, sumber, kode, tanggal',
    colorClass: 'bg-sandstone text-espresso border-warmborder',
  },
  {
    code: 'CONTACTED',
    label: '2. Dihubungi (Contacted)',
    shortLabel: 'Dihubungi',
    operationalDefinition: 'Sudah dibalas <= 5 menit dengan template pembuka WA atau telepon awal, sedang penggalian BANT.',
    crmEvidence: 'Waktu balasan pertama & log kontak',
    colorClass: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    code: 'QUALIFIED',
    label: '3. Prospek (Qualified BANT >= 7)',
    shortLabel: 'Prospek',
    operationalDefinition: 'Lead yang sudah diajak bicara 2 arah dan skor BANT >= 7/12 (minimal Need + Budget terkonfirmasi).',
    crmEvidence: 'Skor BANT >= 7, persona P1-P6, unit minat',
    colorClass: 'bg-blue-50 text-blue-900 border-blue-200',
  },
  {
    code: 'APPOINTMENT',
    label: '4. Janji Kunjungan (Appointment)',
    shortLabel: 'Appointment',
    operationalDefinition: 'Janji kunjungan/presentasi dengan tanggal & jam pasti.',
    crmEvidence: 'Tanggal, jam kunjungan, SE host',
    colorClass: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  },
  {
    code: 'VISITED',
    label: '5. Sudah Berkunjung (Visited)',
    shortLabel: 'Visited',
    operationalDefinition: 'Prospek hadir di Marketing Gallery/lokasi atau ikut video-call tour terstruktur (khusus perantau).',
    crmEvidence: 'Form kunjungan / catatan survei lokasi',
    colorClass: 'bg-teal-50 text-teal-900 border-teal-200',
  },
  {
    code: 'HOT_NEGOTIATION',
    label: '6. Hot Prospek / Negosiasi',
    shortLabel: 'Hot Prospek',
    operationalDefinition: 'Sudah berkunjung + skor BANT >= 10/12 + timeline <= 30 hari + meminta penawaran/simulasi tertulis nomor unit.',
    crmEvidence: 'Penawaran tertulis terkirim & BANT >= 10',
    colorClass: 'bg-orange-50 text-terracotta border-orange-300',
  },
  {
    code: 'BOOKING',
    label: '7. Booking (Closing Awal)',
    shortLabel: 'Booking',
    operationalDefinition: 'Booking fee Rp5.000.000 masuk rekening PT Andara Rejo Makmur + formulir pemesanan ditandatangani.',
    crmEvidence: 'Bukti transfer Rp5 jt + formulir pemesanan',
    colorClass: 'bg-purple-50 text-purple-900 border-purple-200',
  },
  {
    code: 'DP_KPR_PROCESS',
    label: '8. Proses DP / KPR Bank',
    shortLabel: 'Proses DP/KPR',
    operationalDefinition: 'Pengumpulan dokumen KPR <= H+7 dan pengajuan ke 2 bank partner paralel <= H+10.',
    crmEvidence: 'Checklist dokumen KPR / jadwal pembayaran DP',
    colorClass: 'bg-cyan-50 text-cyan-900 border-cyan-200',
  },
  {
    code: 'PPJB_AKAD',
    label: '9. Net Sales (PPJB / Akad Lunas)',
    shortLabel: 'Net Sales',
    operationalDefinition: 'DP pertama lunas sesuai jadwal (cash/CT) atau SP3K/akad KPR terbit di notaris/PPAT.',
    crmEvidence: 'Bukti DP lunas / SP3K / PPJB notaris',
    colorClass: 'bg-lime-100 text-olive border-lime-300',
  },
  {
    code: 'CLOSED_LOST',
    label: '10. Batal / Hilang (Closed-Lost)',
    shortLabel: 'Closed-Lost',
    operationalDefinition: 'Prospek batal membeli atau tidak memenuhi syarat; wajib mencatat alasan kalah standar.',
    crmEvidence: 'Alasan kalah standar wajib tercatat',
    colorClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
];

/**
 * 8 Alasan Kalah Standar sesuai Bab 13.4 Playbook v1.2 (Hal. 30)
 */
export const STANDARD_LOST_REASONS: string[] = [
  'Harga/anggaran tidak cukup',
  'KPR ditolak',
  'Memilih proyek lain',
  'Lokasi tidak cocok',
  'Ukuran/denah tidak cocok',
  'Menunda keputusan',
  'Tidak bisa dihubungi',
  'Hanya mencari info/agen',
];

/**
 * 6 User Persona Pembeli Resmi sesuai Bab 3 Playbook v1.2 (Hal. 9-11)
 */
export const PLAYBOOK_BUYER_PERSONAS: Record<PersonaCode, BuyerPersonaProfile> = {
  P1: {
    code: 'P1',
    name: 'Mas Dimas & Mbak Rina',
    archetype: 'Keluarga Muda Profesional (KPR)',
    profil: 'Usia 28–38 th, menikah, 1–2 anak balita/SD. ASN, pegawai BUMN/bank, guru bersertifikasi, karyawan swasta. Penghasilan gabungan Rp15–25 jt/bln.',
    kondisiSaatIni: 'Tinggal di rumah orang tua/mertua atau mengontrak; ingin rumah sendiri sebelum anak masuk SD/SMP.',
    motivasi: 'Kemandirian keluarga, rumah modern yang "Instagramable", aman untuk anak, dekat kantor & sekolah.',
    kekhawatiran: 'DP & biaya awal, besaran cicilan, takut KPR ditolak, LT 63 m² terasa kecil.',
    unitDanSkema: 'Nagoya B.02–B.04 (Rp650 jt), Tokyo B.03, Nagoya A.05/A.06; tipe Gold 3 KT; KPR 15–20 th.',
    kanal: 'Instagram Reels, TikTok, WA Status, iklan Meta, kantor/instansi, grup orang tua sekolah.',
    keunggulanPemicu: '#21–22 Gold 3KT/2KM, #28 garasi dalam, #38 kolam renang, #46 mini golf, #55–58 keamanan, #91–93 harga & booking.',
    pendekatanClosing: 'Simulasi cicilan vs biaya kontrak, ajak pasangan berkunjung bersama, pra-cek KPR dengan bank partner, ingatkan pergantian harga Nov -> Des.',
    openingHook: 'Cicilannya bisa dihitung mirip biaya kontrak, tapi jadi milik sendiri.',
  },
  P2: {
    code: 'P2',
    name: 'Pak Hendra',
    archetype: 'Pengusaha Lokal (Cash / Cash Tempo)',
    profil: 'Usia 38–55 th. Pemilik toko/grosir, konveksi/batik, distributor, kontraktor, dealer, rumah makan di Sukoharjo/Solo Raya. Omzet besar, penghasilan Rp30–100 jt/bln.',
    kondisiSaatIni: 'Memiliki rumah atau ruko usaha, mencari hunian prestisius di koridor utama dengan garasi memadai dan privasi.',
    motivasi: 'Status & kenyamanan, privasi, keamanan aset/keluarga, akses ke jalan utama untuk usaha, tempat menjamu relasi.',
    kekhawatiran: 'Kredibilitas developer, legalitas, kualitas bangunan, nilai uang (harga cash vs tempo).',
    unitDanSkema: 'Osaka A.06/A.08/A.09 (koridor Sudirman), Tokyo B.07 (LT 125), Nagoya B.06/B.07 (LB 110); Diamond 4 KT 2 garasi; cash keras atau CT12/CT24.',
    kanal: 'Canvassing ruko Jl. Jenderal Sudirman & pasar, referral, Facebook, WA, komunitas pengusaha/paguyuban, rekan bank prioritas.',
    keunggulanPemicu: '#12 Osaka koridor utama, #16–18 big lot/LB 110, #30 2 garasi, #41 ruang meeting, #73–81 spesifikasi, #95–96 legal & rekening perusahaan.',
    pendekatanClosing: 'Bicara angka: selisih cash keras vs tempo, spesifikasi teknis, dokumen legal. Ajak bertemu langsung manajemen/owner bila perlu.',
    openingHook: 'Koridor Jenderal Sudirman, 2 garasi dalam, big lot sampai 125 m².',
  },
  P3: {
    code: 'P3',
    name: 'dr. Sari / Pak Arif, M.Pd.',
    archetype: 'Tenaga Kesehatan & Akademisi',
    profil: 'Usia 30–50 th. Dokter, perawat senior, apoteker, bidan (RSUD Ir. Soekarno, klinik), dosen/karyawan kampus (Univet Bantara, UMS, UIN RM Said). Penghasilan Rp18–50 jt/bln.',
    kondisiSaatIni: 'Jadwal kerja padat/shift malam, membutuhkan hunian tenang dan aman dekat RS/kampus dengan ruang kerja di rumah.',
    motivasi: 'Dekat tempat kerja (jam shift), aman saat pulang malam, ruang kerja/belajar di rumah, lingkungan berpendidikan.',
    kekhawatiran: 'Waktu terbatas untuk survei, rasionalitas spesifikasi, kepastian serah terima.',
    unitDanSkema: 'Nagoya A-series 95 m², Osaka A.01–A.05, Tokyo B.01–B.05; Gold/Diamond (kamar ke-4 untuk ruang kerja); KPR atau CT24.',
    kanal: 'Presentasi di RS/kampus (izin), LinkedIn, Instagram, grup profesi, referral sejawat.',
    keunggulanPemicu: '#23 Diamond 4KT, #41–43 ruang meeting/kerja ringan, #57–61 keamanan & PJU, #64 smart lock, #70 concierge 24/7.',
    pendekatanClosing: 'Jadwal kunjungan fleksibel (malam/akhir pekan), kirim materi lengkap tertulis, data spesifikasi. Program korporat/instansi bila tersedia.',
    openingHook: 'Dekat tempat kerja, pulang malam tetap tenang dengan one-gate RFID.',
  },
  P4: {
    code: 'P4',
    name: 'Mas Bayu',
    archetype: 'Perantau / Pekerja Migran',
    profil: 'Usia 27–45 th, asal Sukoharjo/Wonogiri/Klaten/Solo. Bekerja di Jakarta, Batam, Kalimantan, atau di Jepang/Korea/Taiwan. Penghasilan Rp15–40 jt/bln, rutin mengirim uang.',
    kondisiSaatIni: 'Bekerja di luar kota/luar negeri, mencari rumah untuk orang tua sekarang atau hunian sendiri saat pulang kampung.',
    motivasi: 'Bukti keberhasilan, rumah untuk orang tua sekarang dan untuk diri sendiri saat pulang, aset di kampung halaman.',
    kekhawatiran: 'Tidak bisa melihat langsung, takut penipuan, pengawasan pembangunan, pengurusan dokumen jarak jauh.',
    unitDanSkema: 'Nagoya B.02–B.04, A.05/A.06, Tokyo B.03/B.06; CT12/CT24 atau KPR (bila memenuhi syarat bank).',
    kanal: 'Iklan Meta/TikTok target luar kota & luar negeri, YouTube tour, grup Facebook perantau, keluarga di kampung, kunjungan saat mudik.',
    keunggulanPemicu: '#34 Japandi (relevan untuk pekerja di Jepang), #55–60 keamanan untuk orang tua, #65–70 aplikasi & concierge, #95–96 legal & rekening resmi, #99 peninjauan progres.',
    pendekatanClosing: 'Video call tour langsung dari lokasi, kunjungan keluarga yang diberi kuasa, update progres pembangunan bertanggal, jadwalkan pertemuan saat mudik 19 Des–3 Jan.',
    openingHook: 'Bisa dilihat lewat video call hari ini, legal dan pembayaran ke rekening perusahaan.',
  },
  P5: {
    code: 'P5',
    name: 'Pak Bambang & Bu Yuni',
    archetype: 'Upgrader & Pra-Pensiun',
    profil: 'Usia 48–62 th. ASN/guru/pegawai senior, pengusaha mapan. Anak sudah kuliah/menikah. Memiliki rumah lama yang luas atau tabungan/pesangon.',
    kondisiSaatIni: 'Rumah lama terlalu besar dan merepotkan untuk dirawat berdua; ingin lingkungan rapi dengan fasilitas olahraga.',
    motivasi: 'Rumah yang lebih praktis dirawat, aman, ada fasilitas olahraga ringan (kolam, gym, jogging), dekat cucu, lingkungan yang bersih.',
    kekhawatiran: 'Tangga di rumah 2 lantai, penjualan rumah lama, kepastian biaya IPL.',
    unitDanSkema: 'Unit LT besar (Tokyo B.07, Osaka A.08), Nagoya dekat clubhouse; cash keras dari hasil jual rumah lama/tabungan.',
    kanal: 'Referral, komunitas pengajian/gereja/arisan, Facebook, CFD & Gelora Merdeka, kunjungan rumah lama (canvassing perumahan lama).',
    keunggulanPemicu: '#03–05 Gelora Merdeka, #37–39 clubhouse, #57–58 keamanan, #70–71 concierge & teknis on-call, #97 DLP.',
    pendekatanClosing: 'Tenang dan sabar, ajak anak ikut memutuskan, bantu bandingkan biaya merawat rumah lama vs townhouse, rujuk agen untuk membantu menjual rumah lama.',
    openingHook: 'Rumah yang lebih ringan dirawat, ada kolam dan gym di lingkungan sendiri.',
  },
  P6: {
    code: 'P6',
    name: 'Orang Tua untuk Anak / Investor Hunian',
    archetype: 'Orang Tua untuk Anak / Investor Hunian',
    profil: 'Usia 45–60 th, mapan, membelikan rumah untuk anak yang baru menikah atau sebagai rumah kedua/disewakan ke profesional.',
    kondisiSaatIni: 'Memiliki dana likuid untuk membelikan rumah pertama bagi anak atau diversifikasi aset keluarga di pusat kota.',
    motivasi: 'Hadiah untuk anak, aset yang mudah dirawat, lokasi kota yang diminati penyewa.',
    kekhawatiran: 'Nilai jangka panjang, permintaan sewa, legalitas atas nama siapa.',
    unitDanSkema: 'Nagoya B.02–B.04, Tokyo B.03/B.06; cash keras.',
    kanal: 'Referral, WA, Facebook, jaringan bank prioritas.',
    keunggulanPemicu: '#10 boutique, #45 clubhouse tanpa membership, #64–69 smart living, #91 harga entry, #98 harga per periode.',
    pendekatanClosing: 'Fokus pada fungsi dan kualitas lingkungan. Dilarang menjanjikan kenaikan harga atau imbal hasil sewa.',
    openingHook: 'Hadiah rumah pertama untuk putra-putri, dekat pusat kota.',
  },
  LAINNYA: {
    code: 'LAINNYA',
    name: 'Persona Lainnya (Kustom)',
    archetype: 'Lainnya (Isi Sendiri)',
    profil: '',
    kondisiSaatIni: '',
    motivasi: '',
    kekhawatiran: '',
    unitDanSkema: '',
    kanal: '',
    keunggulanPemicu: '',
    pendekatanClosing: '',
    openingHook: 'Saya siapkan pilihan unit dan simulasi terbaik sesuai kebutuhan Bapak/Ibu.',
  },
};

/**
 * Rubrik Skor BANT Resmi (0-3 per huruf, Total 0-12) sesuai Bab 5.2 Playbook v1.2 (Hal. 14)
 */
export function evaluatePlaybookBant(
  b: number,
  a: number,
  n: number,
  t: number
): BantEvaluationResult {
  const clamp = (v: number) => Math.max(0, Math.min(3, Math.round(Number(v) || 0)));
  const cb = clamp(b);
  const ca = clamp(a);
  const cn = clamp(n);
  const ct = clamp(t);
  const total = cb + ca + cn + ct;

  if (total >= 10) {
    return {
      b: cb,
      a: ca,
      n: cn,
      t: ct,
      total,
      grade: 'A',
      statusLabel: 'Hot',
      isQualifiedProspect: true,
      isHotGrade: true,
      seAction: 'Kirim penawaran tertulis per nomor unit, jadwalkan kunjungan ulang/negosiasi dengan SM, dorong booking.',
      contactFrequency: 'Setiap hari sampai keputusan',
    };
  }
  if (total >= 7) {
    return {
      b: cb,
      a: ca,
      n: cn,
      t: ct,
      total,
      grade: 'B',
      statusLabel: 'Warm (Prospek)',
      isQualifiedProspect: true,
      isHotGrade: false,
      seAction: 'Undang kunjungan dalam 7 hari, kirim simulasi KPR/cash tempo, ajak pasangan ikut hadir.',
      contactFrequency: '2–3 kali/minggu',
    };
  }
  if (total >= 4) {
    return {
      b: cb,
      a: ca,
      n: cn,
      t: ct,
      total,
      grade: 'C',
      statusLabel: 'Cold',
      isQualifiedProspect: false,
      isHotGrade: false,
      seAction: 'Nurturing: kirim konten edukasi, undangan open house, cek ulang setiap 2 minggu.',
      contactFrequency: '1 kali/minggu',
    };
  }
  return {
    b: cb,
    a: ca,
    n: cn,
    t: ct,
    total,
    grade: 'D',
    statusLabel: 'Tidak layak / Arsip',
    isQualifiedProspect: false,
    isHotGrade: false,
    seAction: 'Kirim brosur digital, tawarkan alternatif/rujukan bila ada, arsipkan sopan.',
    contactFrequency: 'Bulanan (bila izin)',
  };
}

/**
 * Daftar Unit & Kelompok Harga Resmi (Cash Keras Nov 2026) sesuai Bab 1.1 Playbook v1.2 (Hal. 4)
 */
export const PLAYBOOK_UNIT_CATALOG = [
  { label: 'Nagoya B.02 (LT 63/LB 75 · Gold 3KT)', cluster: 'Nagoya', priceCashIdr: 650000000, priceKprIdr: 683000000, group: '< Rp700 juta' },
  { label: 'Nagoya B.03 (LT 63/LB 75 · Gold 3KT)', cluster: 'Nagoya', priceCashIdr: 650000000, priceKprIdr: 683000000, group: '< Rp700 juta' },
  { label: 'Nagoya B.04 (LT 63/LB 75 · Gold 3KT)', cluster: 'Nagoya', priceCashIdr: 650000000, priceKprIdr: 683000000, group: '< Rp700 juta' },
  { label: 'Tokyo B.03 (Gold 3KT)', cluster: 'Tokyo', priceCashIdr: 775000000, priceKprIdr: 815000000, group: 'Rp700–899 juta' },
  { label: 'Nagoya A.05 (Gold/Diamond)', cluster: 'Nagoya', priceCashIdr: 800000000, priceKprIdr: 840000000, group: 'Rp700–899 juta' },
  { label: 'Nagoya A.06 (Gold/Diamond)', cluster: 'Nagoya', priceCashIdr: 800000000, priceKprIdr: 840000000, group: 'Rp700–899 juta' },
  { label: 'Osaka A.03 (Koridor Sudirman)', cluster: 'Osaka', priceCashIdr: 840000000, priceKprIdr: 882000000, group: 'Rp700–899 juta' },
  { label: 'Tokyo B.06 (Gold 3KT)', cluster: 'Tokyo', priceCashIdr: 850000000, priceKprIdr: 892000000, group: 'Rp700–899 juta' },
  { label: 'Nagoya A.04 (LT 88/LB 95)', cluster: 'Nagoya', priceCashIdr: 890000000, priceKprIdr: 935000000, group: 'Rp700–899 juta' },
  { label: 'Nagoya A.07 (LT 88/LB 95)', cluster: 'Nagoya', priceCashIdr: 890000000, priceKprIdr: 935000000, group: 'Rp700–899 juta' },
  { label: 'Osaka A.01 (Koridor Sudirman)', cluster: 'Osaka', priceCashIdr: 950000000, priceKprIdr: 998000000, group: 'Rp900–999 juta' },
  { label: 'Tokyo B.01 (Modern Japandi)', cluster: 'Tokyo', priceCashIdr: 940000000, priceKprIdr: 987000000, group: 'Rp900–999 juta' },
  { label: 'Osaka A.08 (Diamond 4KT · Big Lot)', cluster: 'Osaka', priceCashIdr: 1005000000, priceKprIdr: 1056000000, group: '>= Rp1 miliar' },
  { label: 'Osaka A.06 (Diamond 4KT · Big Lot)', cluster: 'Osaka', priceCashIdr: 1025000000, priceKprIdr: 1076000000, group: '>= Rp1 miliar' },
  { label: 'Nagoya B.06 (LB 110 · Diamond 4KT)', cluster: 'Nagoya', priceCashIdr: 1045000000, priceKprIdr: 1097000000, group: '>= Rp1 miliar' },
  { label: 'Tokyo B.07 (LT 125 · Diamond 4KT)', cluster: 'Tokyo', priceCashIdr: 1090000000, priceKprIdr: 1145000000, group: '>= Rp1 miliar' },
  { label: 'Nagoya B.07 (LB 110 · Diamond 4KT)', cluster: 'Nagoya', priceCashIdr: 1095000000, priceKprIdr: 1150000000, group: '>= Rp1 miliar' },
  { label: 'Osaka A.09 (Flagship Diamond 4KT)', cluster: 'Osaka', priceCashIdr: 1150000000, priceKprIdr: 1208000000, group: '>= Rp1 miliar' },
];

/**
 * Ringkasan Konteks Pengetahuan Resmi Playbook v1.2 untuk System Prompt AI (9router)
 */
export const PLAYBOOK_AI_KNOWLEDGE_CONTEXT = `
FAKTA RESMI THE PARK TOWNHOUSE SUKOHARJO (PLAYBOOK V1.2):
1. Lokasi: Jombor, Bendosari, Sukoharjo. Cluster Nagoya di Jl. Tentara Pelajar (lokasi clubhouse & kolam renang); Cluster Osaka & Tokyo di koridor Jl. Jenderal Sudirman, Kp. Duabelasan. Marketing Gallery: RT 1/RW 5, Kp. Duabelasan, Jombor, Bendosari.
2. Inventori 30 Unit: Nagoya 14 unit (A.01 sudah terjual), Osaka 9 unit, Tokyo 7 unit.
3. Konsep & Tipe: Townhouse boutique 2 lantai Japandi Modern, garasi dalam.
   - Tipe Gold: 3 KT, 2 KM, 1 garasi + 1 carport.
   - Tipe Diamond: 4 KT, 3 KM, 2 garasi + 1 carport.
   - Luas: LB 60/70/75/80/95/110 m², LT 63–125 m².
4. Fasilitas Clubhouse (di Nagoya, tanpa biaya membership terpisah): Kolam renang, gym, cafe & resto, ruang meeting, lounge, mini golf 9 hole, game station (PS, Nintendo, TV 4K).
5. Keamanan & Smart Living: One-gate RFID, satpam 24 jam, CCTV 4K (rekaman 30 hari), smart door lock (PIN/sidik jari/RFID/HP), aplikasi Andara Living, concierge 24/7, EV-charging-ready.
6. Harga & Skema Bayar (Nov 2026):
   - Entry <Rp700 jt (hanya 3 unit): Nagoya B.02, B.03, B.04 (LT 63/LB 75) = Rp650 jt cash keras (KPR Rp683 jt, cicilan ~Rp5,1-5,9 jt/bln, minimal penghasilan gabungan Rp15-18 jt/bln).
   - Rp700-899 jt (7 unit): Tokyo B.03 (775 jt), Nagoya A.05/A.06 (800 jt), Osaka A.03 (840 jt), Tokyo B.06 (850 jt), Nagoya A.04/A.07 (890 jt).
   - Rp900-999 jt (14 unit): Nagoya A.02/A.03/A.08/A.09/B.05, Osaka A.01/A.02/A.04/A.05/A.07, Tokyo B.01/B.02/B.04/B.05.
   - >=Rp1 miliar (6 unit): Osaka A.08 (1,005 M), Osaka A.06 (1,025 M), Nagoya B.06 (1,045 M), Tokyo B.07 (1,090 M), Nagoya B.07 (1,095 M), Osaka A.09 (1,150 M).
   - Daftar harga Desember naik ±7-8% dari November.
   - Skema: Cash keras, Cash Tempo 12 bulan (CT12), Cash Tempo 24 bulan (CT24), KPR (DP 10%, pengajuan paralel 2 bank).
   - Booking fee: Rp5.000.000 (mengurangi DP, hanya transfer ke rekening resmi PT Andara Rejo Makmur).
7. Positioning vs Kompetitor/Alternatif:
   - vs Rumah second Solo Baru/Grogol (Rp700 jt-1,1 M): The Park bangunan baru tanpa biaya renovasi, desain Japandi, garasi dalam, one-gate RFID, clubhouse lengkap.
   - vs Cluster kecil baru tanpa fasilitas (Rp450-850 jt): The Park LB lebih luas (s.d 110 m²), 2 lantai, clubhouse kolam/gym/mini golf, smart living.
   - vs Bangun sendiri: Tanpa repot tukang/izin/biaya membengkak, lingkungan homogen & aman.
8. Rubrik BANT (0-3 per huruf, Total 0-12):
   - Budget (B): 0 (<Rp500jt/tidak tahu), 1 (Rp500-649jt / gaji <Rp15jt), 2 (sesuai unit, sumber dana jelas, DP belum siap penuh), 3 (dana/DP siap, gaji memenuhi KPR atau cash siap).
   - Authority (A): 0 (tidak diketahui), 1 (pencari info/kerabat), 2 (pengambil keputusan utama, pasangan belum terlibat), 3 (suami-istri/orang tua terlibat & ikut berkunjung).
   - Need (N): 0 (belum jelas), 1 (lihat-lihat), 2 (kebutuhan kamar/mobil/lokasi jelas), 3 (spesifik & cocok dengan nomor unit tertentu).
   - Timeline (T): 0 (>12 bln/tidak tahu), 1 (6-12 bln), 2 (1-6 bln), 3 (<=30 hari / ada pemicu kontrak habis, mudik, harga Nov->Des).
   - Grade: A (10-12 Hot), B (7-9 Warm/Prospek Qualified), C (4-6 Cold), D (0-3 Arsip).
9. Kriteria Lead Valid (Bab 5.1):
   - Nama jelas (minimal nama panggilan + domisili kecamatan/kota).
   - Nomor WA aktif.
   - Sumber tercatat.
   - Catatan kebutuhan/minat awal jelas (bukan teks acak 1-2 kata seperti "tes", "asdf", "info" tanpa konteks).
10. Kepatuhan & Larangan Keras SE (Bab 7.11):
   - DILARANG menjanjikan "pasti naik harga", "pasti untung", "bebas banjir", "pasti disetujui KPR", atau angka stok palsu.
   - DILARANG menerima transfer ke rekening pribadi.
   - DILARANG memberi diskon/hadiah di luar program resmi tanpa persetujuan SM/Direksi.
`.trim();
