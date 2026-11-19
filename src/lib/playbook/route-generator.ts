// ============================================================================
// DAILY ROUTE GENERATOR - DEVELOPER SALES OS
// GPS-Guided Waypoints from The Park Townhouse with Hourly Schedule
// ============================================================================

import type { DailyRoutePlan, DailyRouteWaypoint, DailyRouteScheduleItem } from './types';

export const THE_PARK_START_COORDINATES = {
  name: 'Gerbang The Park Townhouse Sukoharjo',
  lat: -7.6738726546957565,
  lng: 110.84397833605674,
};

export const DEFAULT_WAYPOINTS: DailyRouteWaypoint[] = [
  {
    order: 1,
    name: 'Kawasan Medis RS Indriati Solo Baru',
    category: 'Perkantoran & RS',
    coordinates: { lat: -7.6250, lng: 110.8120 },
    estimatedDriveMinutes: 8,
    canvassingDurationMinutes: 120,
    canvassingObjective: 'Edukasi ke dokter spesialis, staf manajemen medis, dan pengunjung prioritas RS.',
    flyersTarget: 15,
    leadTarget: 3,
  },
  {
    order: 2,
    name: 'Sentra Perbankan Bank Syariah Indonesia & BTN Solo Baru',
    category: 'Perbankan & Finansial',
    coordinates: { lat: -7.6080, lng: 110.8150 },
    estimatedDriveMinutes: 6,
    canvassingDurationMinutes: 90,
    canvassingObjective: 'Jalin relasi dengan marketing officer KPR dan pembagian flyer ke nasabah prioritas.',
    flyersTarget: 10,
    leadTarget: 2,
  },
  {
    order: 3,
    name: 'Koridor Bisnis & Komersial Jl. Ir. Soekarno Solo Baru',
    category: 'Pasar & Sentra Niaga',
    coordinates: { lat: -7.6015, lng: 110.8175 },
    estimatedDriveMinutes: 5,
    canvassingDurationMinutes: 90,
    canvassingObjective: 'Door-to-door ke ruko pengusaha tekstil, retail, dan pemilik usaha mapan.',
    flyersTarget: 15,
    leadTarget: 3,
  },
  {
    order: 4,
    name: 'Kawasan Hunian & Sentra Industri Rotan Trangsan / Sukoharjo Barat',
    category: 'Perumahan Sekitar',
    coordinates: { lat: -7.6450, lng: 110.7920 },
    estimatedDriveMinutes: 12,
    canvassingDurationMinutes: 60,
    canvassingObjective: 'Penyebaran brosur ke pemilik workshop industri ekspor rotan.',
    flyersTarget: 10,
    leadTarget: 2,
  },
];

export const DEFAULT_HOURLY_SCHEDULE: DailyRouteScheduleItem[] = [
  {
    timeRange: '08:00 - 08:30 WIB',
    activity: 'Morning Briefing & Persiapan Brosur',
    location: 'Kantor Pemasaran The Park',
    notes: 'Pastikan membawa minimal 50 lembar brosur fisik tebal dan formulir lead fisik.',
  },
  {
    timeRange: '08:30 - 09:00 WIB',
    activity: 'Perjalanan Menuju Titik 1 (RS Indriati)',
    location: 'Rute Koridor Sukoharjo - Solo Baru',
    notes: 'Waktu tempuh lancar ± 8 menit via Jl. Tentara Pelajar.',
  },
  {
    timeRange: '09:00 - 11:30 WIB',
    activity: 'Aktivitas Kanvasing Titik 1: RS Indriati',
    location: 'Area Publik RS Indriati Solo Baru',
    notes: 'Fokus pada dokter poli spesialis dan staf senior pergantian shift pagi.',
  },
  {
    timeRange: '11:30 - 13:00 WIB',
    activity: 'Ishoma & Respon Chat WhatsApp Cepat',
    location: 'Sentra Kuliner Solo Baru',
    notes: 'Balas pesan chat prospek yang masuk sebelum jam makan siang usai.',
  },
  {
    timeRange: '13:00 - 14:30 WIB',
    activity: 'Aktivitas Kanvasing Titik 2: Sentra Perbankan',
    location: 'Kawasan Bank BSI / BTN Solo Baru',
    notes: 'Temui Consumer Loan Officer untuk sinkronisasi promo suku bunga KPR.',
  },
  {
    timeRange: '14:30 - 16:30 WIB',
    activity: 'Aktivitas Kanvasing Titik 3: Koridor Ir. Soekarno',
    location: 'Ruko & Sentra Bisnis Solo Baru',
    notes: 'Temui pengusaha lokal; tawarkan opsi Cash Bertahap 24 bulan in-house.',
  },
  {
    timeRange: '16:30 - 17:30 WIB',
    activity: 'Kembali ke Kantor & Input CRM Lead',
    location: 'Kantor Pemasaran The Park',
    notes: 'Input seluruh kontak prospek baru hari ini ke sistem Developer Sales OS.',
  },
];

export function generateDailyRoutePlan(
  dayName: string = 'Senin',
  projectId: string = 'proj-the-park-01'
): DailyRoutePlan {
  return {
    id: `route-${projectId}-${dayName.toLowerCase()}`,
    projectId,
    projectName: 'The Park Townhouse Sukoharjo',
    dayName,
    routeName: `Rute Strategis ${dayName} — Koridor Medis & Bisnis Solo Baru`,
    startPoint: THE_PARK_START_COORDINATES,
    waypoints: DEFAULT_WAYPOINTS,
    totalDistanceKm: 28.5,
    estimatedHours: 8.5,
    totalLeadTarget: 10,
    hourlySchedule: DEFAULT_HOURLY_SCHEDULE,
  };
}
