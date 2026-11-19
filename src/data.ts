export type Category = 'prospek' | 'outreach' | 'closing'

export interface ReportItem {
  id: number
  cat: Category
  item: string
  target: string
  targetNum: number | null
  realisasi: string
  catatan: string
}

export interface ScoreRow {
  komponen: string
  bobot: string
  target: string
  capaian: string
  poin: string
  note: string
}

export const SCORECARD_DATA: ScoreRow[] = [
  { komponen: 'Booking', bobot: '35%', target: '2 unit', capaian: '3 unit (150%)', poin: '52.5', note: 'Maks. 150%' },
  { komponen: 'Net sales', bobot: '20%', target: '1 unit', capaian: '1 unit (100%)', poin: '20.0', note: 'Sesuai target' },
  { komponen: 'Kunjungan', bobot: '15%', target: '15', capaian: '12 (80%)', poin: '12.0', note: '3 jadwal minggu ini' },
  { komponen: 'Prospek terkualifikasi', bobot: '10%', target: '50', capaian: '45 (90%)', poin: '9.0', note: 'BANT >= 7' },
  { komponen: 'Kepatuhan aktivitas (call, chat, canvassing, OTT, posting)', bobot: '10%', target: '≥ 90% hari patuh', capaian: '92% patuh', poin: '10.0', note: 'Hari patuh / hari kerja' },
  { komponen: 'Kualitas CRM & waktu respons', bobot: '5%', target: '100% & ≤ 5 menit', capaian: '95% (4.2 mnt)', poin: '4.8', note: 'Audit acak SM 2x/mgg' },
  { komponen: 'Referral & kepuasan pelanggan', bobot: '5%', target: '12 nama, 0 komplain', capaian: '10 nama, 0 komplain', poin: '4.2', note: 'CRM + survei pembeli' },
]

export type PeriodKey = 'harian' | 'minggu' | 'bulan'

export const PERIODS: Record<PeriodKey, { label: string; score: number; tier: string; meta: string; dash: number }> = {
  harian: { label: 'Harian', score: 88, tier: 'Tier 3 · Solid', meta: '6/8 lead · 4/9 posting', dash: 74 },
  minggu: { label: 'Minggu', score: 96, tier: 'Tier 3 · Konsisten', meta: '34/40 lead · 28/45 posting', dash: 52 },
  bulan: { label: 'Bulan', score: 104, tier: 'Tier 4 · Top Executive', meta: '142/160 lead · 98/120 posting', dash: 30 },
}

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
]

export type Status = 'hit' | 'near' | 'note' | 'low' | 'empty'

export function evalStatus(r: ReportItem): Status {
  if (r.targetNum === null) return r.realisasi.trim() ? 'note' : 'empty'
  const v = parseFloat(String(r.realisasi).split('/')[0])
  if (isNaN(v)) return 'empty'
  if (v >= r.targetNum) return 'hit'
  if (v >= r.targetNum * 0.7) return 'near'
  return 'low'
}
