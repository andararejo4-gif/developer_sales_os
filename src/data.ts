// Data Store & Types untuk Developer Sales OS (PT Andara Rejo Makmur)
// Sesuai 19 Modul Playbook v1.2 & Migrasi Schema devos

export type RoleKey =
  | 'SE'
  | 'TL'
  | 'SM'
  | 'DIREKSI'
  | 'ADMIN'
  | 'IT'
  | 'DIGITAL_MARKETING'
  | 'SUPERADMIN'
  | 'SUPERADMIN_IT';

export interface UserProfile {
  name: string;
  role: RoleKey;
  roleLabel: string;
  email: string;
  noWa: string;
  avatarText: string;
  badge: string;
  proyek?: string;
}

export const USERS_BY_ROLE: Record<RoleKey, UserProfile> = {
  SE: {
    name: 'Raka Pratama',
    role: 'SE',
    roleLabel: 'Sales Executive',
    email: 'raka@andararejomakmur.co.id',
    noWa: '+6281122334411',
    avatarText: 'RP',
    badge: 'Sales Executive · Multi-Proyek',
    proyek: 'PT Andara Rejo Makmur',
  },
  TL: {
    name: 'AI Team Leader (Autonomous)',
    role: 'TL',
    roleLabel: 'Team Leader (AI Engine)',
    email: 'ai.tl@andararejomakmur.co.id',
    noWa: '+6281122334403',
    avatarText: 'TL',
    badge: 'AI Autonomous · Supervisor: Rizal',
    proyek: 'PT Andara Rejo Makmur',
  },
  SM: {
    name: 'Ferry Kurniawan',
    role: 'SM',
    roleLabel: 'Sales Manager (Semi-AI)',
    email: 'sm@andararejomakmur.co.id',
    noWa: '+6281122334402',
    avatarText: 'FK',
    badge: 'Sales Manager · Portofolio Proyek',
    proyek: 'PT Andara Rejo Makmur',
  },
  DIREKSI: {
    name: 'Bambang Soedirjo',
    role: 'DIREKSI',
    roleLabel: 'Direksi / Owner Developer Properti',
    email: 'direksi@andararejomakmur.co.id',
    noWa: '+6281122334401',
    avatarText: 'BS',
    badge: 'Direksi Developer · Portofolio Proyek',
    proyek: 'Portofolio Semua Proyek',
  },
  ADMIN: {
    name: 'Siti Rahma',
    role: 'ADMIN',
    roleLabel: 'Admin Sales & Transaksi',
    email: 'admin.sales@andararejomakmur.co.id',
    noWa: '+6281122334421',
    avatarText: 'SR',
    badge: 'Admin Sales · Verifikasi & Legal',
    proyek: 'PT Andara Rejo Makmur',
  },
  IT: {
    name: 'Dodi Hartono',
    role: 'IT',
    roleLabel: 'IT & System Developer Properti',
    email: 'it@andararejomakmur.co.id',
    noWa: '+6281122334431',
    avatarText: 'DH',
    badge: 'IT Developer · Integrasi Lokal & WA',
    proyek: 'Platform Integrasi Properti',
  },
  DIGITAL_MARKETING: {
    name: 'Agus Prasetyo',
    role: 'DIGITAL_MARKETING',
    roleLabel: 'Digital Marketer',
    email: 'marketer@andararejomakmur.co.id',
    noWa: '+6281122334441',
    avatarText: 'AP',
    badge: 'Digital Ads & CPL Multi-Proyek',
    proyek: 'PT Andara Rejo Makmur',
  },
  SUPERADMIN: {
    name: 'Bpk. Hendrawan (Founder)',
    role: 'SUPERADMIN',
    roleLabel: 'Direksi Pemilik Developer Sales OS',
    email: 'direksi@developersalesos.com',
    noWa: '+6281299988001',
    avatarText: 'OS',
    badge: 'Direksi Platform · Owner Developer Sales OS',
    proyek: 'Developer Sales OS (Core Multi-Tenant)',
  },
  SUPERADMIN_IT: {
    name: 'Arya Wicaksana (Lead DevOps)',
    role: 'SUPERADMIN_IT',
    roleLabel: 'Tim IT Internal Developer Sales OS',
    email: 'it.internal@developersalesos.com',
    noWa: '+6288980961427',
    avatarText: 'IT',
    badge: 'IT Core Platform · Multi-Tenant & AI Engine',
    proyek: 'Developer Sales OS (Core Multi-Tenant)',
  },
};

// ======================== SE DATA ========================
export type Category = 'prospek' | 'outreach' | 'closing';

export interface ReportItem {
  id: number;
  cat: Category;
  item: string;
  target: string;
  targetNum: number | null;
  realisasi: string;
  catatan: string;
}

export interface ScoreRow {
  komponen: string;
  bobot: string;
  target: string;
  capaian: string;
  poin: string;
  note: string;
}

export const SCORECARD_DATA: ScoreRow[] = [
  { komponen: 'Booking', bobot: '35%', target: '2 unit', capaian: '3 unit (150%)', poin: '52.5', note: 'Maks. 150%' },
  { komponen: 'Net sales', bobot: '20%', target: '1 unit', capaian: '1 unit (100%)', poin: '20.0', note: 'Sesuai target' },
  { komponen: 'Kunjungan', bobot: '15%', target: '15', capaian: '12 (80%)', poin: '12.0', note: '3 jadwal minggu ini' },
  { komponen: 'Prospek terkualifikasi', bobot: '10%', target: '50', capaian: '45 (90%)', poin: '9.0', note: 'BANT ≥ 7' },
  { komponen: 'Kepatuhan aktivitas (call, chat, canvassing, OTT, posting)', bobot: '10%', target: '≥ 90% hari patuh', capaian: '92% patuh', poin: '10.0', note: 'Hari patuh / hari kerja' },
  { komponen: 'Kualitas CRM & waktu respons', bobot: '5%', target: '100% & ≤ 5 menit', capaian: '95% (4.2 mnt)', poin: '4.8', note: 'Audit acak SM 2x/mgg' },
  { komponen: 'Referral & kepuasan pelanggan', bobot: '5%', target: '12 nama, 0 komplain', capaian: '10 nama, 0 komplain', poin: '4.2', note: 'CRM + survei pembeli' },
];

export type PeriodKey = 'harian' | 'minggu' | 'bulan';

export const PERIODS: Record<PeriodKey, { label: string; score: number; tier: string; meta: string; dash: number }> = {
  harian: { label: 'Harian', score: 88, tier: 'Tier 3 · Solid', meta: '6/8 lead · 4/9 posting', dash: 74 },
  minggu: { label: 'Minggu', score: 96, tier: 'Tier 3 · Konsisten', meta: '34/40 lead · 28/45 posting', dash: 52 },
  bulan: { label: 'Bulan', score: 104, tier: 'Tier 4 · Top Executive', meta: '142/160 lead · 98/120 posting', dash: 30 },
};

export const DEFAULT_ITEMS: ReportItem[] = [
  { id: 1, cat: 'prospek', item: 'Lead baru (sumber + kode)', target: '8', targetNum: 8, realisasi: '6', catatan: 'IG Ads #AR02 (4), Walk-in (2)' },
  { id: 2, cat: 'outreach', item: 'Dial / percakapan telepon', target: '30 / 12', targetNum: 30, realisasi: '26 / 11', catatan: '11 tersambung, 4 minta brosur' },
  { id: 3, cat: 'outreach', item: 'Chat WA personal / follow-up', target: '50 / 20', targetNum: 50, realisasi: '52 / 22', catatan: 'Follow-up batch harga baru' },
  { id: 4, cat: 'outreach', item: 'Canvassing: kontak / brosur / lead', target: '30 / 50 / 5', targetNum: 30, realisasi: '24 / 45 / 4', catatan: 'Area Ruko Sentra & Perkantoran' },
  { id: 5, cat: 'outreach', item: 'Posting: Reel / WA Status / Story', target: '1 / 5 / 3', targetNum: 1, realisasi: '1 / 4 / 3', catatan: 'Video progres tipe 60/90' },
  { id: 6, cat: 'prospek', item: 'Prospek baru (BANT ≥ 7)', target: '2', targetNum: 2, realisasi: '2', catatan: 'Bp. Hendra & Ibu Sari' },
  { id: 7, cat: 'prospek', item: 'Appointment dibuat (tanggal)', target: '1', targetNum: 1, realisasi: '1', catatan: 'Sabtu, 21 Nov 2026 · 10:00 WIB' },
  { id: 8, cat: 'closing', item: 'Kunjungan hari ini', target: '0–1', targetNum: 1, realisasi: '1', catatan: 'Survei Blok C-12 (Ibu Melisa)' },
  { id: 9, cat: 'closing', item: 'Penawaran tertulis terkirim', target: '2', targetNum: 2, realisasi: '2', catatan: 'Simulasi KPR BTN & Mandiri' },
  { id: 10, cat: 'closing', item: 'Hot prospek & langkah berikut', target: '—', targetNum: null, realisasi: '4 Hot', catatan: 'Bp. Andi (konfirmasi DP Jumat)' },
  { id: 11, cat: 'closing', item: 'Booking / dokumen KPR', target: '—', targetNum: null, realisasi: '1 Unit', catatan: 'Blok B-04 berkas SLIK lengkap' },
  { id: 12, cat: 'prospek', item: 'Referral diperoleh', target: '1', targetNum: 1, realisasi: '1', catatan: 'Rekomendasi user Blok A-09' },
  { id: 13, cat: 'closing', item: 'Hambatan & bantuan yang dibutuhkan', target: '—', targetNum: null, realisasi: 'Aman', catatan: 'Butuh pricelist promo akhir bulan' },
];

export type Status = 'hit' | 'near' | 'note' | 'low' | 'empty';

export function evalStatus(r: ReportItem): Status {
  if (r.targetNum === null) return r.realisasi.trim() ? 'note' : 'empty';
  const v = parseFloat(String(r.realisasi).split('/')[0]);
  if (isNaN(v)) return 'empty';
  if (v >= r.targetNum) return 'hit';
  if (v >= r.targetNum * 0.7) return 'near';
  return 'low';
}

// ======================== SM DATA: CRUD UNIT & MONITORING SE ========================
export interface UnitProperty {
  id: string;
  cluster: string;
  namaUnit: string;
  tipeUnit: string;
  luasTanah: number;     // LT
  luasBangunan: number;  // LB
  hargaCashKeras: number;
  hargaCash6: number;    // Cash 6 bulan
  hargaCash12: number;   // Cash 12 bulan
  hargaCash24: number;   // Cash 24 bulan
  keterangan: string;
  status: 'tersedia' | 'hold' | 'booking' | 'terjual';
}

export const INITIAL_UNITS: UnitProperty[] = [
  { id: '1', cluster: 'Nagoya', namaUnit: 'A.01', tipeUnit: 'Diamond', luasTanah: 90, luasBangunan: 75, hargaCashKeras: 850000000, hargaCash6: 875000000, hargaCash12: 900000000, hargaCash24: 950000000, keterangan: 'Hook depan gerbang utama, 3 KT, 2 KM, Carport 2 mobil', status: 'terjual' },
  { id: '2', cluster: 'Nagoya', namaUnit: 'A.02', tipeUnit: 'Diamond', luasTanah: 90, luasBangunan: 75, hargaCashKeras: 830000000, hargaCash6: 855000000, hargaCash12: 880000000, hargaCash24: 930000000, keterangan: 'Dekat clubhouse, 3 KT, 2 KM, Carport 2 mobil', status: 'booking' },
  { id: '3', cluster: 'Nagoya', namaUnit: 'A.03', tipeUnit: 'Diamond', luasTanah: 90, luasBangunan: 75, hargaCashKeras: 830000000, hargaCash6: 855000000, hargaCash12: 880000000, hargaCash24: 930000000, keterangan: 'View taman tengah, 3 KT, 2 KM, Carport 2 mobil', status: 'tersedia' },
  { id: '4', cluster: 'Nagoya', namaUnit: 'A.04', tipeUnit: 'Diamond', luasTanah: 90, luasBangunan: 75, hargaCashKeras: 830000000, hargaCash6: 855000000, hargaCash12: 880000000, hargaCash24: 930000000, keterangan: 'Standard, 3 KT, 2 KM, Carport 2 mobil', status: 'hold' },
  { id: '5', cluster: 'Nagoya', namaUnit: 'A.05', tipeUnit: 'Diamond', luasTanah: 90, luasBangunan: 75, hargaCashKeras: 830000000, hargaCash6: 855000000, hargaCash12: 880000000, hargaCash24: 930000000, keterangan: 'Standard, 3 KT, 2 KM, Carport 2 mobil', status: 'tersedia' },
  { id: '6', cluster: 'Osaka', namaUnit: 'B.01', tipeUnit: 'Gold', luasTanah: 72, luasBangunan: 60, hargaCashKeras: 680000000, hargaCash6: 700000000, hargaCash12: 720000000, hargaCash24: 760000000, keterangan: 'Blok depan Osaka, 2 KT, 2 KM, Carport 1 mobil', status: 'tersedia' },
  { id: '7', cluster: 'Osaka', namaUnit: 'B.04', tipeUnit: 'Gold', luasTanah: 72, luasBangunan: 60, hargaCashKeras: 670000000, hargaCash6: 690000000, hargaCash12: 710000000, hargaCash24: 750000000, keterangan: 'Standard, 2 KT, 2 KM, proses SLIK', status: 'booking' },
  { id: '8', cluster: 'Tokyo', namaUnit: 'C.01', tipeUnit: 'Emerald', luasTanah: 60, luasBangunan: 50, hargaCashKeras: 580000000, hargaCash6: 600000000, hargaCash12: 620000000, hargaCash24: 650000000, keterangan: 'Compact modern, 2 KT, 1 KM, Carport 1 mobil', status: 'tersedia' },
  { id: '9', cluster: 'Tokyo', namaUnit: 'C.02', tipeUnit: 'Emerald', luasTanah: 60, luasBangunan: 50, hargaCashKeras: 580000000, hargaCash6: 600000000, hargaCash12: 620000000, hargaCash24: 650000000, keterangan: 'Compact modern, 2 KT, 1 KM', status: 'tersedia' },
  { id: '10', cluster: 'Tokyo', namaUnit: 'C.07', tipeUnit: 'Emerald', luasTanah: 78, luasBangunan: 50, hargaCashKeras: 630000000, hargaCash6: 650000000, hargaCash12: 670000000, hargaCash24: 710000000, keterangan: 'Corner lot Tokyo dengan sisa tanah samping', status: 'tersedia' },
];

export interface SePerformance {
  seId: string;
  nama: string;
  noWa: string;
  leadBulanIni: number;
  prospekBulanIni: number;
  kunjunganBulanIni: number;
  bookingBulanIni: number;
  netSalesBulanIni: number;
  targetNetSales: number;
  rataResponsMenit: number;
  leadTerancam72Jam: number;
  laporanHariIni: 'tepat_waktu' | 'terlambat' | 'belum_kirim';
  scorecardPoin: number;
  scorecardKategori: 'Bintang' | 'Tercapai' | 'Mendekati' | 'Di Bawah Target' | 'Kritis';
  zonaHariIni: string;
}

export const SE_TEAM_DATA: SePerformance[] = [
  { seId: 'se-1', nama: 'Raka Pratama', noWa: '+6281122334411', leadBulanIni: 184, prospekBulanIni: 48, kunjunganBulanIni: 14, bookingBulanIni: 3, netSalesBulanIni: 2, targetNetSales: 2, rataResponsMenit: 3.8, leadTerancam72Jam: 0, laporanHariIni: 'tepat_waktu', scorecardPoin: 112.5, scorecardKategori: 'Tercapai', zonaHariIni: 'Zona A (Perkantoran)' },
  { seId: 'se-2', nama: 'Dian Lestari', noWa: '+6281122334412', leadBulanIni: 165, prospekBulanIni: 42, kunjunganBulanIni: 11, bookingBulanIni: 2, netSalesBulanIni: 1, targetNetSales: 2, rataResponsMenit: 4.5, leadTerancam72Jam: 1, laporanHariIni: 'tepat_waktu', scorecardPoin: 94.0, scorecardKategori: 'Mendekati', zonaHariIni: 'Zona C (Ruko Sentra)' },
  { seId: 'se-3', nama: 'Budi Santoso', noWa: '+6281122334413', leadBulanIni: 142, prospekBulanIni: 35, kunjunganBulanIni: 9, bookingBulanIni: 1, netSalesBulanIni: 1, targetNetSales: 1, rataResponsMenit: 7.2, leadTerancam72Jam: 2, laporanHariIni: 'belum_kirim', scorecardPoin: 82.5, scorecardKategori: 'Mendekati', zonaHariIni: 'Zona D (Pendidikan/Bank)' },
];

// ======================== DIREKSI DATA: PORTOFOLIO TARGET VS AKTUAL ========================
export type TipeProyek = 'mewah' | 'menengah' | 'subsidi' | 'villa_resort' | 'komersial';

export interface DireksiProyekPortfolio {
  kode: string;
  nama: string;
  tipe: TipeProyek;
  tipeLabel: string;
  lokasi: string;
  totalUnit: number;
  unitTersedia: number;
  unitHold: number;
  unitBooking: number;
  unitTerjual: number;
  targetLead: number;
  aktualLead: number;
  targetBooking: number;
  aktualBooking: number;
  targetNetSales: number;
  aktualNetSales: number;
  targetOmzet: number;
  aktualOmzet: number;
}

export const DIREKSI_PROJECTS: DireksiProyekPortfolio[] = [
  {
    kode: 'TP-SKH',
    nama: 'The Park Townhouse Sukoharjo',
    tipe: 'mewah',
    tipeLabel: 'Perumahan Mewah (Townhouse Premium)',
    lokasi: 'Jl. Ir. Soekarno, Madegondo, Grogol, Sukoharjo',
    totalUnit: 30,
    unitTersedia: 24,
    unitHold: 2,
    unitBooking: 3,
    unitTerjual: 1,
    targetLead: 600,
    aktualLead: 491,
    targetBooking: 7,
    aktualBooking: 6,
    targetNetSales: 5,
    aktualNetSales: 4,
    targetOmzet: 4150000000,
    aktualOmzet: 3340000000,
  },
  {
    kode: 'GAA-SKH',
    nama: 'Griya Andara Asri Sukoharjo',
    tipe: 'subsidi',
    tipeLabel: 'Rumah Subsidi (FLPP Pemerintah)',
    lokasi: 'Polokarto, Sukoharjo',
    totalUnit: 120,
    unitTersedia: 35,
    unitHold: 10,
    unitBooking: 25,
    unitTerjual: 50,
    targetLead: 500,
    aktualLead: 530,
    targetBooking: 15,
    aktualBooking: 16,
    targetNetSales: 12,
    aktualNetSales: 13,
    targetOmzet: 2106000000,
    aktualOmzet: 2281500000,
  },
  {
    kode: 'AV-BYL',
    nama: 'Andara Village Boyolali',
    tipe: 'menengah',
    tipeLabel: 'Perumahan Komersil Menengah',
    lokasi: 'Mojosongo, Boyolali',
    totalUnit: 45,
    unitTersedia: 12,
    unitHold: 3,
    unitBooking: 8,
    unitTerjual: 22,
    targetLead: 400,
    aktualLead: 378,
    targetBooking: 6,
    aktualBooking: 5,
    targetNetSales: 4,
    aktualNetSales: 4,
    targetOmzet: 2400000000,
    aktualOmzet: 2450000000,
  },
];

export interface EscalationItem {
  id: string;
  seName: string;
  proyek: string;
  unit: string;
  pembeli: string;
  jenis: 'Diskon Khusus' | 'Refund Booking' | 'Komplain Berat';
  nilai: string;
  rekomendasiAi: string;
  status: 'Menunggu Review' | 'Disetujui' | 'Ditolak';
  waktu: string;
}

export const ESCALATION_DATA: EscalationItem[] = [
  { id: 'ESC-01', seName: 'Raka Pratama', proyek: 'The Park Townhouse', unit: 'A.06 (Nagoya)', pembeli: 'Bp. Hendra Kusuma', jenis: 'Diskon Khusus', nilai: 'Diskon Tambahan Rp 15.000.000 (di luar program launch)', rekomendasiAi: 'Persetujuan disarankan: Margin proyek masih 28.4%, pembeli cash keras 1 bulan', status: 'Menunggu Review', waktu: 'Hari ini, 09:30' },
  { id: 'ESC-02', seName: 'Dian Lestari', proyek: 'The Park Townhouse', unit: 'B.04 (Osaka)', pembeli: 'Ibu Ratna Dewi', jenis: 'Refund Booking', nilai: 'Refund Rp 5.000.000 (SLIK Bank Ditolak 2x)', rekomendasiAi: 'Sesuai SOP §7.10: Penolakan KPR murni faktor BI Checking bank rekanan, refund 100% diproses', status: 'Menunggu Review', waktu: 'Kemarin, 16:45' },
];

// ======================== TL DATA: AI BRIEFING & 5-MIN SLA ========================
export interface SlaAlert {
  id: string;
  namaLead: string;
  sumber: string;
  noWa: string;
  assignedSe: string;
  menitBerjalan: number;
  status: 'Aman' | 'Peringatan 5 Mnt' | 'Dialihkan Otomatis';
}

export const LIVE_SLA_LEADS: SlaAlert[] = [
  { id: 'LD-881', namaLead: 'dr. Satrio Wibowo', sumber: 'Meta Ads CTWA', noWa: '+6281299881122', assignedSe: 'Raka Pratama', menitBerjalan: 2.1, status: 'Aman' },
  { id: 'LD-882', namaLead: 'Ibu Maya Anggraini', sumber: 'TikTok Lead Gen', noWa: '+6281355447788', assignedSe: 'Dian Lestari', menitBerjalan: 4.8, status: 'Peringatan 5 Mnt' },
  { id: 'LD-883', namaLead: 'Bp. Edwin Nugroho', sumber: 'Google Search Ads', noWa: '+6281700112233', assignedSe: 'Budi Santoso', menitBerjalan: 6.2, status: 'Dialihkan Otomatis' },
];

// ======================== ADMIN DATA ========================
export interface BookingTransaction {
  id: string;
  pembeli: string;
  unit: string;
  skema: string;
  seName: string;
  tanggalBooking: string;
  rekResmiValid: boolean;
  statusAdminH1: 'Terkonfirmasi' | 'Menunggu Verifikasi';
  statusKprH7: 'Lengkap' | 'Kurang 2 Berkas (SLIK & SPT)';
  statusBankH10: 'Diajukan ke 2 Bank (BTN & Mandiri)' | 'Proses Analis' | 'SP3K Terbit';
  jatuhTempoDp: string;
}

export const BOOKING_TRANSACTIONS: BookingTransaction[] = [
  { id: 'BK-101', pembeli: 'Bp. Hendra Kusuma', unit: 'A.01 (Nagoya)', skema: 'Cash Keras', seName: 'Raka Pratama', tanggalBooking: '15 Nov 2026', rekResmiValid: true, statusAdminH1: 'Terkonfirmasi', statusKprH7: 'Lengkap', statusBankH10: 'SP3K Terbit', jatuhTempoDp: 'Pelunasan 30 Nov 2026' },
  { id: 'BK-102', pembeli: 'Ibu Melisa Putri', unit: 'A.02 (Nagoya)', skema: 'KPR BTN 15 Thn', seName: 'Raka Pratama', tanggalBooking: '17 Nov 2026', rekResmiValid: true, statusAdminH1: 'Terkonfirmasi', statusKprH7: 'Lengkap', statusBankH10: 'Diajukan ke 2 Bank (BTN & Mandiri)', jatuhTempoDp: 'DP 10% H+14' },
  { id: 'BK-103', pembeli: 'Bp. Kevin Sanjaya', unit: 'B.04 (Osaka)', skema: 'Cash Tempo 12 Bln', seName: 'Dian Lestari', tanggalBooking: '18 Nov 2026', rekResmiValid: true, statusAdminH1: 'Menunggu Verifikasi', statusKprH7: 'Kurang 2 Berkas (SLIK & SPT)', statusBankH10: 'Proses Analis', jatuhTempoDp: 'Termin 1 H+7' },
];

// ======================== IT DATA ========================
export interface AuditItem {
  id: number;
  tabel: string;
  recordId: string;
  aksi: string;
  dataPerubahan: string;
  oleh: string;
  waktu: string;
}

export const IT_AUDIT_LOGS: AuditItem[] = [
  { id: 1054, tabel: 'unit', recordId: 'A.01', aksi: 'UPDATE', dataPerubahan: 'status: booking -> terjual', oleh: 'system (booking_sinkron trigger)', waktu: '18 Nov 2026, 11:02' },
  { id: 1053, tabel: 'lead', recordId: 'LD-880', aksi: 'UPDATE', dataPerubahan: 'bant_total: 6 -> 8, tahap: contacted -> qualified', oleh: 'raka@andararejomakmur.co.id', waktu: '18 Nov 2026, 10:45' },
  { id: 1052, tabel: 'persetujuan', recordId: 'ESC-01', aksi: 'INSERT', dataPerubahan: 'jenis: diskon_khusus, diputuskan_ai: true (rekomendasi)', oleh: 'ai.tl@andararejomakmur.co.id', waktu: '18 Nov 2026, 09:30' },
  { id: 1051, tabel: 'laporan_harian', recordId: 'LH-SE1', aksi: 'UPDATE', dataPerubahan: 'terkunci: true (cut-off 18.00 scheduler)', oleh: 'system cron', waktu: '17 Nov 2026, 18:00' },
];

// ======================== DIGITAL MARKETING DATA (Modul O, S18) ========================
export interface AdCampaign {
  id: string;
  kode: string;
  nama: string;
  kanal: 'Meta Ads' | 'TikTok Ads' | 'Google Search';
  budgetBulanan: number;
  spendBulanIni: number;
  leads: number;
  leadsValid: number;
  persenValid: number;
  cpl: number;            // Cost Per Lead (Target <= 60.000)
  kunjungan: number;
  biayaPerKunjungan: number; // Target <= 600.000
  booking: number;
  biayaPerBooking: number;   // Target <= 4.000.000
  ctr: number;
  statusAi: 'Optimal' | 'CPL Tinggi' | 'Perlu Re-budget';
}

export const AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'CMP-01',
    kode: 'ADS-META-CTWA-01',
    nama: 'Launching Promo WhatsApp Direct',
    kanal: 'Meta Ads',
    budgetBulanan: 12000000,
    spendBulanIni: 8400000,
    leads: 210,
    leadsValid: 168,
    persenValid: 80.0,
    cpl: 40000,
    kunjungan: 24,
    biayaPerKunjungan: 350000,
    booking: 4,
    biayaPerBooking: 2100000,
    ctr: 2.4,
    statusAi: 'Optimal',
  },
  {
    id: 'CMP-02',
    kode: 'ADS-META-LEAD-02',
    nama: 'Meta Instant Form Type Diamond',
    kanal: 'Meta Ads',
    budgetBulanan: 8000000,
    spendBulanIni: 5200000,
    leads: 104,
    leadsValid: 65,
    persenValid: 62.5,
    cpl: 50000,
    kunjungan: 10,
    biayaPerKunjungan: 520000,
    booking: 1,
    biayaPerBooking: 5200000,
    ctr: 1.1,
    statusAi: 'CPL Tinggi',
  },
  {
    id: 'CMP-03',
    kode: 'ADS-TIKTOK-01',
    nama: 'Video Tour Nagoya 90/75 Hook',
    kanal: 'TikTok Ads',
    budgetBulanan: 6000000,
    spendBulanIni: 3600000,
    leads: 95,
    leadsValid: 68,
    persenValid: 71.6,
    cpl: 37895,
    kunjungan: 8,
    biayaPerKunjungan: 450000,
    booking: 1,
    biayaPerBooking: 3600000,
    ctr: 1.8,
    statusAi: 'Optimal',
  },
  {
    id: 'CMP-04',
    kode: 'ADS-GSEARCH-01',
    nama: 'Google Search Rumah Mewah Solo Baru',
    kanal: 'Google Search',
    budgetBulanan: 6000000,
    spendBulanIni: 4800000,
    leads: 82,
    leadsValid: 58,
    persenValid: 70.7,
    cpl: 58536,
    kunjungan: 12,
    biayaPerKunjungan: 400000,
    booking: 2,
    biayaPerBooking: 2400000,
    ctr: 3.8,
    statusAi: 'Optimal',
  },
];

export interface SeLeadFeedback {
  id: string;
  seName: string;
  leadName: string;
  kodeKonten: string;
  label: 'Valid' | 'Tidak Valid';
  alasan: string;
  waktu: string;
}

export const SE_LEAD_FEEDBACKS: SeLeadFeedback[] = [
  { id: 'FB-1', seName: 'Raka Pratama', leadName: 'dr. Satrio Wibowo', kodeKonten: 'ADS-META-CTWA-01', label: 'Valid', alasan: 'BANT A, dokter di RS Indriati Solo Baru, siap survei Sabtu', waktu: 'Hari ini 10:15' },
  { id: 'FB-2', seName: 'Dian Lestari', leadName: 'Bp. Bambang Heru', kodeKonten: 'ADS-META-LEAD-02', label: 'Tidak Valid', alasan: 'Nomor salah sambung / luar pulau (Kalimantan)', waktu: 'Hari ini 09:40' },
  { id: 'FB-3', seName: 'Budi Santoso', leadName: 'Ibu Ratna Dewi', kodeKonten: 'ADS-TIKTOK-01', label: 'Valid', alasan: 'Minta simulasi KPR CT24 Osaka B.04', waktu: 'Kemarin 16:30' },
  { id: 'FB-4', seName: 'Raka Pratama', leadName: 'Sdr. Dimas', kodeKonten: 'ADS-META-LEAD-02', label: 'Tidak Valid', alasan: 'Hanya mencari info sewa rumah / bukan pembeli', waktu: 'Kemarin 14:20' },
];

export interface AiAdRecommendation {
  id: string;
  tipe: string;
  pesan: string;
  rekomendasi: string;
  dampak: string;
}

export const AI_AD_INSIGHTS: AiAdRecommendation[] = [
  {
    id: 'AI-AD-1',
    tipe: 'Optimalisasi Anggaran',
    pesan: 'Kampanye ADS-META-CTWA-01 menghasilkan Biaya per Booking terendah (Rp 2,1 Juta vs Target Rp 4 Juta).',
    rekomendasi: 'Geser Rp 2.000.000 dari budget ADS-META-LEAD-02 ke ADS-META-CTWA-01 untuk memaksimalkan booking akhir bulan.',
    dampak: 'Potensi penambahan 1-2 booking valid dalam 14 hari ke depan.',
  },
  {
    id: 'AI-AD-2',
    tipe: 'Evaluasi Materi Kreatif',
    pesan: 'Materi video TikTok (ADS-TIKTOK-01) menghasilkan CPL sangat efisien Rp 37.895 (Target ≤ Rp 60.000).',
    rekomendasi: 'Adaptasi format video hook Nagoya ke cluster Osaka dan perbanyak jam tayang pada pukul 19.30 - 21.00.',
    dampak: 'Peningkatan CTR diproyeksikan naik dari 1.8% ke 2.5%.',
  },
];
