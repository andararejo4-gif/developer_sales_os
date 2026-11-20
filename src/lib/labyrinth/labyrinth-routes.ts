// ============================================================================
// LABYRINTH INFORMATION ARCHITECTURE - DEVELOPER SALES OS
// Kedalaman L0 (Homepage) -> L1 (Rute Navbar) -> L2 (Deep-Dive) -> L3 (Sandbox) -> Konversi
// ============================================================================

export type LabyrinthRouteId =
  // L0: Homepage
  | 'l0-beranda'
  // L1: Rute Utama Navbar
  | 'l1-ekosistem'
  | 'l1-studi-kasus'
  | 'l1-peran'
  | 'l1-paket'
  // L2: Deep-Dive dari L1 Ekosistem
  | 'l2-field-ops'
  | 'l2-love-letter'
  | 'l2-market-target'
  | 'l2-content-web'
  | 'l2-crm-komisi'
  // L2: Deep-Dive dari L1 Studi Kasus
  | 'l2-case-99'
  | 'l2-case-radar'
  // L2: Deep-Dive dari L1 Peran
  | 'l2-role-se'
  | 'l2-role-direksi'
  // L2: Deep-Dive dari L1 Paket
  | 'l2-plan-advisor';

export interface RouteMeta {
  id: LabyrinthRouteId;
  level: 'L0' | 'L1' | 'L2';
  parentId?: LabyrinthRouteId;
  title: string;
  breadcrumbLabel: string;
  subtitle: string;
}

export const LABYRINTH_ROUTES: Record<LabyrinthRouteId, RouteMeta> = {
  'l0-beranda': {
    id: 'l0-beranda',
    level: 'L0',
    title: 'Developer Sales OS — Mesin Penjualan Properti Multi-Tenant',
    breadcrumbLabel: 'L0 Beranda',
    subtitle: 'Ringkasan ekosistem dan pintu masuk eksplorasi.',
  },
  'l1-ekosistem': {
    id: 'l1-ekosistem',
    level: 'L1',
    parentId: 'l0-beranda',
    title: 'Ekosistem Fitur & Operasional Lapangan',
    breadcrumbLabel: 'L1 Ekosistem Produk',
    subtitle: 'Seluruh instrumen pemasaran, penjualan, absensi, GPS tracking, log panggilan, hingga AI Coach.',
  },
  'l1-studi-kasus': {
    id: 'l1-studi-kasus',
    level: 'L1',
    parentId: 'l0-beranda',
    title: 'Studi Kasus Nyata: The Park Townhouse Sukoharjo',
    breadcrumbLabel: 'L1 Studi Kasus The Park',
    subtitle: 'Bagaimana proyek 30 unit di Sukoharjo dipetakan secara presisi dari nol.',
  },
  'l1-peran': {
    id: 'l1-peran',
    level: 'L1',
    parentId: 'l0-beranda',
    title: 'Solusi Terpadu Per Peran Tim Developer',
    breadcrumbLabel: 'L1 Solusi Peran',
    subtitle: 'Dari Direksi/Owner, Sales Manager, Team Leader, hingga Sales Executive di lapangan.',
  },
  'l1-paket': {
    id: 'l1-paket',
    level: 'L1',
    parentId: 'l0-beranda',
    title: 'Paket Lisensi Gold, Platinum & Diamond',
    breadcrumbLabel: 'L1 Paket & Lisensi',
    subtitle: 'Pilih kapasitas yang tepat untuk skala tim dan jumlah proyek Anda.',
  },
  'l2-field-ops': {
    id: 'l2-field-ops',
    level: 'L2',
    parentId: 'l1-ekosistem',
    title: 'Absensi, GPS Tracking SE, Log Panggilan & AI Activity Guide',
    breadcrumbLabel: 'L2 Operasional Lapangan & AI Guide',
    subtitle: 'Kendali penuh aktivitas SE di lapangan — dari absensi berkoordinat hingga panduan AI tiap aktivitas.',
  },
  'l2-love-letter': {
    id: 'l2-love-letter',
    level: 'L2',
    parentId: 'l1-ekosistem',
    title: 'Surat Cinta 99 Keunggulan & Product Knowledge Base',
    breadcrumbLabel: 'L2 Surat Cinta 99 & KB',
    subtitle: 'Ubah brosur dan pricelist menjadi 99 alasan emosional yang 100% faktual.',
  },
  'l2-market-target': {
    id: 'l2-market-target',
    level: 'L2',
    parentId: 'l1-ekosistem',
    title: 'Riset Pasar Radius 25km & Target Sold Out 100%',
    breadcrumbLabel: 'L2 Riset Pasar & Target',
    subtitle: 'Matematika reverse-funnel dari target unit terjual ke beban kerja harian SE.',
  },
  'l2-content-web': {
    id: 'l2-content-web',
    level: 'L2',
    parentId: 'l1-ekosistem',
    title: 'Kalender Konten 90 Slot & Website Landing Page Subdomain',
    breadcrumbLabel: 'L2 Konten & Website Proyek',
    subtitle: '30 hari x 3 slot/hari + landing page proyek ber-UTM dan simulator KPR.',
  },
  'l2-crm-komisi': {
    id: 'l2-crm-komisi',
    level: 'L2',
    parentId: 'l1-ekosistem',
    title: 'CRM Pipeline 7-Tahap, SLA 5 Menit & Aturan Komisi',
    breadcrumbLabel: 'L2 CRM & Aturan Komisi',
    subtitle: 'Anti-lead terbengkalai dengan penandaan bawahan dan checklist berbasis tanggal.',
  },
  'l2-case-99': {
    id: 'l2-case-99',
    level: 'L2',
    parentId: 'l1-studi-kasus',
    title: 'Bedah 99 Keunggulan The Park Townhouse Sukoharjo',
    breadcrumbLabel: 'L2 Bedah 99 Poin The Park',
    subtitle: 'Eksplorasi 6 bab keunggulan nyata tanpa klaim palsu atau overpromise.',
  },
  'l2-case-radar': {
    id: 'l2-case-radar',
    level: 'L2',
    parentId: 'l1-studi-kasus',
    title: 'Peta Radar Kompetitor & Fasilitas 500m - 25km Sukoharjo',
    breadcrumbLabel: 'L2 Peta Radar Sukoharjo',
    subtitle: 'Analisis spasial Haversine dari titik koordinat gerbang proyek The Park.',
  },
  'l2-role-se': {
    id: 'l2-role-se',
    level: 'L2',
    parentId: 'l1-peran',
    title: 'Ritme Kerja Harian Sales Executive (08:00 - 17:30 WIB)',
    breadcrumbLabel: 'L2 Ritme Kerja SE',
    subtitle: 'Bagaimana SE dibantu GPS Route, Call Log, & AI Coach dari pagi hingga closing.',
  },
  'l2-role-direksi': {
    id: 'l2-role-direksi',
    level: 'L2',
    parentId: 'l1-peran',
    title: 'Panel Kendali Direksi / Owner & Transparansi Omset',
    breadcrumbLabel: 'L2 Kendali Direksi',
    subtitle: 'Memisahkan realisasi omset Akad/Closing dari pipeline Booking di seluruh proyek.',
  },
  'l2-plan-advisor': {
    id: 'l2-plan-advisor',
    level: 'L2',
    parentId: 'l1-paket',
    title: 'Asisten Pemilihan Paket Ideal Untuk Proyek Anda',
    breadcrumbLabel: 'L2 Penasihat Paket',
    subtitle: 'Hitung kebutuhan tim & proyek Anda untuk melihat paket paling efisien.',
  },
};

export function getBreadcrumbs(routeId: LabyrinthRouteId): RouteMeta[] {
  const trail: RouteMeta[] = [];
  let current: RouteMeta | undefined = LABYRINTH_ROUTES[routeId];
  while (current) {
    trail.unshift(current);
    current = current.parentId ? LABYRINTH_ROUTES[current.parentId] : undefined;
  }
  return trail;
}
