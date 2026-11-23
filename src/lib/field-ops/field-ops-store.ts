// ============================================================================
// FIELD OPS STORE & AI ACTIVITY GUIDE ENGINE - DEVELOPER SALES OS
// ============================================================================

import { hasPlanFeature } from '../plans/plans-config';
import type {
  SeAttendanceRecord,
  SeGpsTrackPoint,
  SeCallLog,
  SeActivityCategory,
  AiActivityGuide,
  GpsActivityType,
  CallOutcome,
} from './types';

export const PROJECT_BASE_COORDS = {
  lat: -7.6738726546957565,
  lng: 110.84397833605674,
  label: 'Kantor Pemasaran The Park Townhouse Sukoharjo',
};

export function parseCoordinates(coordStr?: string): { lat: number; lng: number } {
  if (!coordStr) return { lat: PROJECT_BASE_COORDS.lat, lng: PROJECT_BASE_COORDS.lng };
  const parts = coordStr.split(',').map((p) => parseFloat(p.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return { lat: PROJECT_BASE_COORDS.lat, lng: PROJECT_BASE_COORDS.lng };
}

export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

const todayStr = new Date().toISOString().split('T')[0];

const INITIAL_ATTENDANCE: SeAttendanceRecord[] = [
  {
    id: 'att-01',
    projectId: 'proj-the-park-01',
    seName: 'SE 001 Budi Santoso',
    date: todayStr,
    checkInAt: '08:02 WIB',
    checkInLat: -7.67387,
    checkInLng: 110.84398,
    checkOutAt: null,
    status: 'HADIR',
    notes: 'Siap kanvasing koridor Solo Baru',
  },
  {
    id: 'att-02',
    projectId: 'proj-the-park-01',
    seName: 'SE 002 Andi Wijaya',
    date: todayStr,
    checkInAt: '08:05 WIB',
    checkInLat: -7.67391,
    checkInLng: 110.84395,
    checkOutAt: null,
    status: 'HADIR',
    notes: 'Standby unit show & follow-up leads IG',
  },
  {
    id: 'att-03',
    projectId: 'proj-the-park-01',
    seName: 'SE 003 Maya Kusuma',
    date: todayStr,
    checkInAt: '08:21 WIB',
    checkInLat: -7.67385,
    checkInLng: 110.84401,
    checkOutAt: null,
    status: 'TERLAMBAT',
    notes: 'Macet Jl. Slamet Riyadi',
  },
];

const INITIAL_GPS_LOGS: SeGpsTrackPoint[] = [
  {
    id: 'gps-01',
    projectId: 'proj-the-park-01',
    seName: 'SE 001 Budi Santoso',
    recordedAt: '08:02 WIB',
    lat: -7.67387,
    lng: 110.84398,
    activityType: 'CHECK_IN',
    locationLabel: 'Kantor Pemasaran The Park Townhouse',
    distanceFromProjectKm: 0,
  },
  {
    id: 'gps-02',
    projectId: 'proj-the-park-01',
    seName: 'SE 001 Budi Santoso',
    recordedAt: '09:15 WIB',
    lat: -7.625,
    lng: 110.812,
    activityType: 'CANVASSING',
    locationLabel: 'Kawasan Medis RS Indriati Solo Baru',
    distanceFromProjectKm: calculateDistanceKm(PROJECT_BASE_COORDS.lat, PROJECT_BASE_COORDS.lng, -7.625, 110.812),
  },
  {
    id: 'gps-03',
    projectId: 'proj-the-park-01',
    seName: 'SE 001 Budi Santoso',
    recordedAt: '13:20 WIB',
    lat: -7.608,
    lng: 110.815,
    activityType: 'MEETING_KLIEN',
    locationLabel: 'BSI & Sentra Perbankan Solo Baru',
    distanceFromProjectKm: calculateDistanceKm(PROJECT_BASE_COORDS.lat, PROJECT_BASE_COORDS.lng, -7.608, 110.815),
  },
];

const INITIAL_CALL_LOGS: SeCallLog[] = [
  {
    id: 'call-01',
    projectId: 'proj-the-park-01',
    seName: 'SE 001 Budi Santoso',
    leadName: 'dr. Hendra Kusuma, Sp.A',
    phoneNumber: '081234567891',
    direction: 'OUTBOUND',
    durationSeconds: 312,
    outcome: 'JANJI_SURVEI',
    summaryNotes: 'Konfirmasi jadwal survei show unit cluster Nagoya hari Sabtu jam 15.00 WIB.',
    calledAt: '08:45 WIB',
  },
  {
    id: 'call-02',
    projectId: 'proj-the-park-01',
    seName: 'SE 002 Andi Wijaya',
    leadName: 'Ibu Ratna Paramitha',
    phoneNumber: '081299887766',
    direction: 'OUTBOUND',
    durationSeconds: 185,
    outcome: 'TERJAWAB_TERTARIK',
    summaryNotes: 'Menanyakan skema Cash Bertahap 24 bulan tanpa bunga; sudah dikirim pricelist PDF.',
    calledAt: '09:30 WIB',
  },
  {
    id: 'call-03',
    projectId: 'proj-the-park-01',
    seName: 'SE 003 Maya Kusuma',
    leadName: 'Bpk. Wahyu Hidayat',
    phoneNumber: '081355667788',
    direction: 'OUTBOUND',
    durationSeconds: 22,
    outcome: 'TIDAK_ANGKAT',
    summaryNotes: 'Nada sambung aktif tapi belum diangkat; dilanjutkan pesan WhatsApp sapaan.',
    calledAt: '10:15 WIB',
  },
];

const AI_ACTIVITY_GUIDES: Record<SeActivityCategory, AiActivityGuide> = {
  COLD_CALL_SLA_5_MENIT: {
    activityType: 'COLD_CALL_SLA_5_MENIT',
    title: 'Panduan AI: Telepon Pertama Lead Baru (SLA ≤ 5 Menit)',
    planRequired: 'platinum',
    goal: 'Membangun keakraban dalam 20 detik pertama & menggali skor BANT awal tanpa terdengar memaksa.',
    openingScript:
      '"Selamat pagi/siang Bapak/Ibu [Nama], saya [Nama SE] dari tim resmi The Park Townhouse Sukoharjo. Saya lihat Bapak/Ibu baru saja mengunduh info hunian 2 lantai kami. Apakah saat ini sedang mencari hunian untuk ditempati keluarga atau investasi jangka panjang?"',
    executionSteps: [
      'Sebut nama prospek dan nama proyek di 10 detik pertama agar kredibel.',
      'Ajukan pertanyaan terbuka: preferensi 3 kamar tidur (Nagoya/Osaka) atau 4 kamar tidur (Tokyo).',
      'Konfirmasi kedekatan lokasi kerja/aktivitas di sekitar Solo Baru atau Sukoharjo.',
      'Tutup telepon dengan menawarkan jadwal preview show unit atau pengiriman rincian SHM pecah.',
    ],
    objectionHandlers: [
      {
        objection: '"Saya cuma lihat-lihat harga dulu, belum berencana beli sekarang."',
        aiResponse:
          '"Sangat wajar Pak/Bu, memilih hunian memang perlu pertimbangan matang. Saya kirimkan kartu perbandingan 3 tipe unit dan simulasi KPR/Cash Bertahap-nya via WhatsApp ya, supaya Bapak/Ibu punya pembanding angka yang jelas."',
      },
      {
        objection: '"Harganya di atas Rp 800 juta ya? Kayaknya kemahalan."',
        aiResponse:
          '"Betul Pak/Bu, unit kami di kisaran Rp 830–1.150 jt karena seluruh unit 2 lantai murni bata merah dengan SHM sudah pecah per kavling—tanpa risiko sertifikat induk. Bila dibandingkan dengan luas bangunan 75–100 m² di koridor Solo Baru, nilainya sangat kompetitif."',
      },
    ],
    closingChecklist: 'Catat hasil telepon di Log Panggilan & isi skor BANT di CRM.',
  },
  KANVASING_B2B_RS_BANK: {
    activityType: 'KANVASING_B2B_RS_BANK',
    title: 'Panduan AI: Kanvasing B2B (RS Indriati & Perbankan Solo Baru)',
    planRequired: 'platinum',
    goal: 'Mendapatkan kontak dokter/staf senior atau menjalin kerja sama referral dengan RM KPR bank.',
    openingScript:
      '"Permisi Dokter/Bapak/Ibu, saya [Nama SE] dari The Park Townhouse (hanya sekitar 7 menit dari RS Indriati). Kami sedang menyiapkan program kepemilikan hunian eksklusif 30 unit dengan SHM sudah pecah khusus bagi tenaga medis/profesional di koridor Solo Baru."',
    executionSteps: [
      'Pastikan sudah Check-In GPS di titik lokasi kanvasing agar terekam di dasbor TL & SM.',
      'Bawa brosur cetak tebal + QR code langsung ke Landing Page & Kalkulator KPR.',
      'Fokus menanyakan kebutuhan tempat tinggal dekat tempat praktik tanpa macet.',
      'Minta izin menyimpan nomor WhatsApp untuk mengirimkan video room tour singkat.',
    ],
    objectionHandlers: [
      {
        objection: '"Saya sibuk praktik/kerja, titip brosur saja di resepsionis."',
        aiResponse:
          '"Baik Dok/Pak/Bu, tidak mengganggu waktu praktik. Boleh saya minta 15 detik untuk scan QR brosur digital ini agar Dokter bisa lihat denah dan jarak 7 menitnya langsung di HP saat istirahat nanti?"',
      },
    ],
    closingChecklist: 'Input minimal 2 kontak baru dari tiap titik GPS ke CRM.',
  },
  PENDAMPINGAN_SURVEI_LOKASI: {
    activityType: 'PENDAMPINGAN_SURVEI_LOKASI',
    title: 'Panduan AI: Pendampingan Survei Show Unit & Pembuktian Fisik',
    planRequired: 'platinum',
    goal: 'Mengubah kunjungan fisik menjadi komitmen pemilihan kavling / Booking Fee.',
    openingScript:
      '"Selamat datang di The Park Townhouse, Bapak/Ibu. Sebelum masuk ke show unit, mari saya tunjukkan kontur jalan komplek 7 meter dan one-gate system kita yang aman untuk anak-anak."',
    executionSteps: [
      'Arahkan perhatian pada tinggi plafon 3.8 meter yang sejuk dan sirkulasi udara silang.',
      'Tunjukkan sampel dinding bata merah & bukti fotokopi SHM/PBG yang sudah pecah per kavling.',
      'Ajak duduk di marketing gallery untuk menghitung simulasi DP & angsuran sesuai profil keuangan mereka.',
      'Ajukan pertanyaan penguncian lembut: "Dari kavling Blok A dan B yang tadi kita lihat, mana yang paling sesuai dengan orientasi arah rumah pilihan Ibu?"',
    ],
    objectionHandlers: [
      {
        objection: '"Saya masih mau diskusi dulu dengan pasangan/orang tua di rumah."',
        aiResponse:
          '"Tentu Pak/Bu, keputusan keluarga sangat penting. Agar kavling pilihan Bapak/Ibu tadi tidak terambil tamu survei besok, kami ada fitur Hold Kavling sementara sambil kami siapkan simulasi tertulis untuk didiskusikan bersama keluarga malam ini."',
      },
    ],
    closingChecklist: 'Catat lokasi GPS Survey & update stage CRM ke HOT_PROSPEK atau BOOKING.',
  },
  FOLLOW_UP_PROSPEK_DINGIN: {
    activityType: 'FOLLOW_UP_PROSPEK_DINGIN',
    title: 'Panduan AI: Reaktivasi Prospek Dingin (> 7 Hari Tanpa Respon)',
    planRequired: 'platinum',
    goal: 'Membuka kembali percakapan secara elegan menggunakan informasi bernilai, bukan pesan "Gimana kabarnya?".',
    openingScript:
      '"Selamat pagi Pak/Bu [Nama], izin mengabarkan update progres lapangan di The Park Townhouse minggu ini: jaringan drainase tertutup dan beberapa unit Cluster Nagoya sudah naik atap. Saya lampirkan foto progres terbarunya."',
    executionSteps: [
      'Hindari mengirim pesan teks generik seperti "Jadi beli nggak Pak?".',
      'Kirimkan nilai baru: update foto progres proyek, poin unik dari Surat Cinta 99, atau info suku bunga KPR bank terbaru.',
      'Berikan pilihan jelas: "Apakah masih mencari hunian di area Solo Baru bulan ini, atau sementara fokus ke kebutuhan lain?"',
    ],
    objectionHandlers: [
      {
        objection: '"Maaf belum sempat, dana saya masih terikat deposito/proyek lain."',
        aiResponse:
          '"Terima kasih kabarnya Pak/Bu. Bila dananya cair dalam 2–3 bulan ke depan, skema Cash Bertahap 24 bulan kami cukup fleksibel tanpa harus mencairkan seluruh dana di awal. Saya catat untuk follow-up lagi bulan depan ya."',
      },
    ],
    closingChecklist: 'Atur ulang Next Follow-Up Date di CRM agar muncul otomatis di checklist tanggal tersebut.',
  },
  NEGOSIASI_CASH_KPR: {
    activityType: 'NEGOSIASI_CASH_KPR',
    title: 'Panduan AI: Negosiasi Skema Pembayaran (Cash Keras vs Bertahap vs KPR)',
    planRequired: 'diamond',
    goal: 'Menutup transaksi tanpa mengorbankan margin developer di luar batas wewenang diskon.',
    openingScript:
      '"Untuk mempermudah perencanaan cashflow Bapak/Ibu, mari kita bandingkan 3 skema pembayaran resmi kami: Cash Keras (harga paling hemat), Cash Bertahap 24 bulan tanpa bunga, atau KPR Bank Rekanan."',
    executionSteps: [
      'Gunakan kalkulator simulator resmi agar angka angsuran transparan.',
      'Jika prospek meminta diskon khusus, tanyakan komitmen waktu pelunasan (misal: "Jika diskon disetujui SM, apakah bisa pelunasan DP minggu ini?").',
      'Jangan menjanjikan persetujuan KPR 100% dari bank; sampaikan sebagai estimasi dan bantu proses pemberkasan SLIK bersama Admin KPR.',
    ],
    objectionHandlers: [
      {
        objection: '"Bisa minta potongan harga Rp 50 juta lagi untuk Cash Keras?"',
        aiResponse:
          '"Saya bantu ajukan permohonan eskalasi resmi ke Sales Manager/Direksi ya Pak/Bu, dengan catatan kami lampirkan komitmen rencana pelunasan dalam 7 hari kerja agar permohonan Bapak/Ibu diprioritaskan."',
      },
    ],
    closingChecklist: 'Catat permohonan diskon ke sistem approval dan siapkan Form Booking Fee.',
  },
};

let attendanceDb = [...INITIAL_ATTENDANCE];
let gpsLogsDb = [...INITIAL_GPS_LOGS];
let callLogsDb = [...INITIAL_CALL_LOGS];

export function resetFieldOpsStore(): void {
  attendanceDb = structuredClone(INITIAL_ATTENDANCE);
  gpsLogsDb = structuredClone(INITIAL_GPS_LOGS);
  callLogsDb = structuredClone(INITIAL_CALL_LOGS);
}

export function getAttendanceRecords(
  projectId: string = 'proj-the-park-01',
  baseCoords?: { lat: number; lng: number },
  projectName?: string
): SeAttendanceRecord[] {
  const existing = attendanceDb.filter((a) => a.projectId === projectId);
  if (existing.length > 0) return existing;

  const lat = baseCoords?.lat ?? PROJECT_BASE_COORDS.lat;
  const lng = baseCoords?.lng ?? PROJECT_BASE_COORDS.lng;
  const name = projectName ?? 'The Park Townhouse Sukoharjo';

  const defaultRecords: SeAttendanceRecord[] = [
    {
      id: `att-${projectId}-01`,
      projectId,
      seName: 'SE 001 Budi Santoso',
      date: todayStr,
      checkInAt: '08:02 WIB',
      checkInLat: lat,
      checkInLng: lng,
      checkOutAt: null,
      status: 'HADIR',
      notes: `Siap kanvasing terintegrasi ${name}`,
    },
    {
      id: `att-${projectId}-02`,
      projectId,
      seName: 'SE 002 Andi Wijaya',
      date: todayStr,
      checkInAt: '08:06 WIB',
      checkInLat: lat + 0.00004,
      checkInLng: lng - 0.00003,
      checkOutAt: null,
      status: 'HADIR',
      notes: `Standby show unit & follow-up leads ${name}`,
    },
    {
      id: `att-${projectId}-03`,
      projectId,
      seName: 'SE 003 Maya Kusuma',
      date: todayStr,
      checkInAt: '08:20 WIB',
      checkInLat: lat - 0.00002,
      checkInLng: lng + 0.00003,
      checkOutAt: null,
      status: 'HADIR',
      notes: `Koordinasi berkas KPR pemohon unit ${name}`,
    },
  ];

  attendanceDb.push(...defaultRecords);
  return defaultRecords;
}

export function checkInAttendance(input: {
  projectId: string;
  seName: string;
  lat: number;
  lng: number;
  notes?: string;
}): SeAttendanceRecord {
  const nowTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date()) + ' WIB';

  const existing = attendanceDb.find(
    (a) => a.projectId === input.projectId && a.seName === input.seName && a.date === todayStr
  );

  if (existing) {
    existing.checkInAt = existing.checkInAt || nowTime;
    existing.checkInLat = input.lat;
    existing.checkInLng = input.lng;
    if (input.notes) existing.notes = input.notes;
    return { ...existing };
  }

  const record: SeAttendanceRecord = {
    id: `att-${Date.now()}`,
    projectId: input.projectId,
    seName: input.seName,
    date: todayStr,
    checkInAt: nowTime,
    checkInLat: input.lat,
    checkInLng: input.lng,
    checkOutAt: null,
    status: 'HADIR',
    notes: input.notes || 'Check-in lapangan via GPS',
  };
  attendanceDb.unshift(record);
  return record;
}

export function checkOutAttendance(projectId: string, seName: string, lat: number, lng: number): SeAttendanceRecord | null {
  const target = attendanceDb.find((a) => a.projectId === projectId && a.seName === seName && a.date === todayStr);
  if (!target) return null;
  target.checkOutAt =
    new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' WIB';
  target.checkOutLat = lat;
  target.checkOutLng = lng;
  return { ...target };
}

export function getGpsTrackLogs(
  projectId: string = 'proj-the-park-01',
  baseCoords?: { lat: number; lng: number },
  projectName?: string
): SeGpsTrackPoint[] {
  const existing = gpsLogsDb.filter((g) => g.projectId === projectId);
  if (existing.length > 0) return existing;

  const lat = baseCoords?.lat ?? PROJECT_BASE_COORDS.lat;
  const lng = baseCoords?.lng ?? PROJECT_BASE_COORDS.lng;
  const name = projectName ?? 'The Park Townhouse';

  const defaultLogs: SeGpsTrackPoint[] = [
    {
      id: `gps-${projectId}-01`,
      projectId,
      seName: 'SE 001 Budi Santoso',
      recordedAt: '08:02 WIB',
      lat,
      lng,
      activityType: 'CHECK_IN',
      locationLabel: `Kantor Pemasaran ${name}`,
      distanceFromProjectKm: 0,
    },
    {
      id: `gps-${projectId}-02`,
      projectId,
      seName: 'SE 001 Budi Santoso',
      recordedAt: '09:15 WIB',
      lat: lat + 0.04887,
      lng: lng - 0.03198,
      activityType: 'CANVASSING',
      locationLabel: `Kawasan Bisnis & Sentra Layanan (${name})`,
      distanceFromProjectKm: calculateDistanceKm(lat, lng, lat + 0.04887, lng - 0.03198),
    },
    {
      id: `gps-${projectId}-03`,
      projectId,
      seName: 'SE 001 Budi Santoso',
      recordedAt: '13:20 WIB',
      lat: lat + 0.06587,
      lng: lng - 0.02898,
      activityType: 'MEETING_KLIEN',
      locationLabel: `Sentra Perbankan & Edukasi Rekanan (${name})`,
      distanceFromProjectKm: calculateDistanceKm(lat, lng, lat + 0.06587, lng - 0.02898),
    },
  ];

  gpsLogsDb.push(...defaultLogs);
  return defaultLogs;
}

export function recordGpsPoint(input: {
  projectId: string;
  seName: string;
  lat: number;
  lng: number;
  activityType: GpsActivityType;
  locationLabel: string;
  baseCoords?: { lat: number; lng: number };
}): SeGpsTrackPoint {
  const originLat = input.baseCoords?.lat ?? PROJECT_BASE_COORDS.lat;
  const originLng = input.baseCoords?.lng ?? PROJECT_BASE_COORDS.lng;
  const dist = calculateDistanceKm(originLat, originLng, input.lat, input.lng);
  const point: SeGpsTrackPoint = {
    id: `gps-${Date.now()}`,
    projectId: input.projectId,
    seName: input.seName,
    recordedAt:
      new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' WIB',
    lat: input.lat,
    lng: input.lng,
    activityType: input.activityType,
    locationLabel: input.locationLabel,
    distanceFromProjectKm: dist,
  };
  gpsLogsDb.unshift(point);
  return point;
}

export function getCallLogs(projectId: string = 'proj-the-park-01', projectName?: string): SeCallLog[] {
  const existing = callLogsDb.filter((c) => c.projectId === projectId);
  if (existing.length > 0) return existing;

  const name = projectName ?? 'The Park Townhouse';
  const defaultLogs: SeCallLog[] = [
    {
      id: `call-${projectId}-01`,
      projectId,
      seName: 'SE 001 Budi Santoso',
      leadName: 'dr. Hendra Kusuma, Sp.A',
      phoneNumber: '081234567891',
      direction: 'OUTBOUND',
      durationSeconds: 312,
      outcome: 'JANJI_SURVEI',
      summaryNotes: `Konfirmasi jadwal survei show unit proyek ${name} hari Sabtu jam 15.00 WIB.`,
      calledAt: '08:45 WIB',
    },
    {
      id: `call-${projectId}-02`,
      projectId,
      seName: 'SE 002 Andi Wijaya',
      leadName: 'Ibu Ratna Paramitha',
      phoneNumber: '081299887766',
      direction: 'OUTBOUND',
      durationSeconds: 185,
      outcome: 'TERJAWAB_TERTARIK',
      summaryNotes: `Menanyakan skema Cash Bertahap unit ${name}; sudah dikirim pricelist PDF.`,
      calledAt: '09:30 WIB',
    },
    {
      id: `call-${projectId}-03`,
      projectId,
      seName: 'SE 003 Maya Kusuma',
      leadName: 'Bpk. Wahyu Hidayat',
      phoneNumber: '081355667788',
      direction: 'OUTBOUND',
      durationSeconds: 22,
      outcome: 'TIDAK_ANGKAT',
      summaryNotes: `Nada sambung aktif peminat ${name} belum diangkat; dilanjutkan WhatsApp.`,
      calledAt: '10:15 WIB',
    },
  ];

  callLogsDb.push(...defaultLogs);
  return defaultLogs;
}

export function addCallLog(input: {
  projectId: string;
  seName: string;
  leadName: string;
  phoneNumber: string;
  direction: 'OUTBOUND' | 'INBOUND';
  durationSeconds: number;
  outcome: CallOutcome;
  summaryNotes: string;
}): SeCallLog {
  const log: SeCallLog = {
    id: `call-${Date.now()}`,
    ...input,
    calledAt:
      new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' WIB',
  };
  callLogsDb.unshift(log);
  return log;
}

export function getAiActivityGuide(
  activityType: SeActivityCategory,
  planCode: 'gold' | 'platinum' | 'diamond',
  projectName?: string
): {
  isUnlocked: boolean;
  guide: AiActivityGuide;
  upgradeMessage?: string;
} {
  const baseGuide = AI_ACTIVITY_GUIDES[activityType];
  const name = projectName || 'The Park Townhouse Sukoharjo';

  const guide: AiActivityGuide = {
    ...baseGuide,
    title: baseGuide.title.replace(/The Park Townhouse Sukoharjo|The Park Townhouse/g, name),
    openingScript: baseGuide.openingScript.replace(/The Park Townhouse Sukoharjo|The Park Townhouse/g, name),
    executionSteps: baseGuide.executionSteps.map((step) =>
      step.replace(/The Park Townhouse Sukoharjo|The Park Townhouse/g, name)
    ),
    closingChecklist: baseGuide.closingChecklist.replace(/The Park Townhouse Sukoharjo|The Park Townhouse/g, name),
  };

  const isUnlocked = hasPlanFeature(planCode, 'se_ai_activity_guide');

  if (!isUnlocked) {
    return {
      isUnlocked: false,
      guide: {
        ...guide,
        executionSteps: guide.executionSteps.slice(0, 1),
        objectionHandlers: [],
      },
      upgradeMessage:
        'Panduan / Guide per Aktivitas SE dengan AI tersedia khusus untuk paket Platinum dan Diamond.',
    };
  }

  return {
    isUnlocked: true,
    guide,
  };
}

export const ALL_SE_ACTIVITY_CATEGORIES: { key: SeActivityCategory; label: string }[] = [
  { key: 'COLD_CALL_SLA_5_MENIT', label: 'Telepon Lead Baru (SLA ≤ 5m)' },
  { key: 'KANVASING_B2B_RS_BANK', label: 'Kanvasing B2B (RS / Bank)' },
  { key: 'PENDAMPINGAN_SURVEI_LOKASI', label: 'Pendampingan Survei Lokasi' },
  { key: 'FOLLOW_UP_PROSPEK_DINGIN', label: 'Follow-Up Prospek Dingin' },
  { key: 'NEGOSIASI_CASH_KPR', label: 'Negosiasi Cash / KPR' },
];
