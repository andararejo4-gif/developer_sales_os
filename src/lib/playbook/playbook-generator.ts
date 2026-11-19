// ============================================================================
// PLAYBOOK GENERATOR - DEVELOPER SALES OS
// Reverse-Funnel Math, BANT >= 7 Scoring, SOP, & Dual/Triple Role Hierarchy
// ============================================================================

import type { PlaybookPlan, PlaybookRole, BantDimension, SopStep, KpiItem } from './types';

export const THE_PARK_BANT_CRITERIA: BantDimension[] = [
  {
    dimension: 'Budget',
    weightPercent: 30,
    minScoreToPass: 7,
    indicatorPassing: 'Penghasilan gabungan keluarga minimal Rp 20 Juta/bulan atau likuiditas dana cash keras > Rp 700 Juta siap transaksi.',
    qualificationQuestions: [
      'Berapa alokasi budget investasi properti yang Anda siapkan saat ini?',
      'Apakah Anda lebih menyukai skema tunai bertahap langsung developer atau cicilan KPR bank?',
      'Berapa estimasi kemampuan DP dan cicilan bulanan yang paling nyaman untuk keuangan keluarga Anda?',
    ],
  },
  {
    dimension: 'Authority',
    weightPercent: 25,
    minScoreToPass: 7,
    indicatorPassing: 'Calon pembeli adalah pengambil keputusan utama bersama suami/istri tanpa intervensi penolakan pihak ketiga.',
    qualificationQuestions: [
      'Siapa yang akan mendampingi Anda saat survei lokasi unit The Park akhir pekan ini?',
      'Apakah keputusan pembelian rumah ini diambil berdua bersama pasangan?',
      'Atas nama siapa Sertifikat Hak Milik (SHM) akan dibaliknamakan nantinya?',
    ],
  },
  {
    dimension: 'Need',
    weightPercent: 25,
    minScoreToPass: 7,
    indicatorPassing: 'Membutuhkan rumah 2 lantai mandiri, keamanan one-gate system, dan mobilitas cepat <15 menit ke Solo Baru/RS Indriati.',
    qualificationQuestions: [
      'Berapa jumlah kamar tidur dan kendaraan yang Anda perlukan untuk keluarga?',
      'Seberapa penting faktor legalitas sertifikat sudah pecah per kavling bagi rasa aman Anda?',
      'Apa alasan utama Anda mempertimbangkan untuk berpindah ke kawasan Solo Baru selatan ini?',
    ],
  },
  {
    dimension: 'Timeline',
    weightPercent: 20,
    minScoreToPass: 7,
    indicatorPassing: 'Rencana realisasi booking dan akad dalam waktu 30 hari ke depan.',
    qualificationQuestions: [
      'Kapan target Anda dan keluarga untuk serah terima kunci dan mulai menempati rumah baru?',
      'Jika unit dan skema harganya sesuai ekspektasi, apakah Anda siap mengunci kavling minggu ini?',
    ],
  },
];

export function evaluateBantScore(
  budget: number,
  authority: number,
  need: number,
  timeline: number
): { totalScore: number; isQualified: boolean; recommendation: string } {
  const totalScore = Number((budget * 0.3 + authority * 0.25 + need * 0.25 + timeline * 0.2).toFixed(1));
  const isQualified = totalScore >= 7.0;
  return {
    totalScore,
    isQualified,
    recommendation: isQualified ? 'HOT_PROSPEK' : 'NURTURING',
  };
}

export interface ReverseFunnelActivityResult {
  monthlyTargetUnits: number;
  bookingRequired: number;
  surveyVisitRequired: number;
  hotProspectsRequired: number;
  leadsRequired: number;
  dailyCallsRequired: number;
  dailyWalkInCanvassingRequired: number;
}

export function calculateReverseFunnelActivity(monthlyTargetUnits: number = 1): ReverseFunnelActivityResult {
  const bookingRequired = Math.ceil(monthlyTargetUnits * 1.5);
  const surveyVisitRequired = bookingRequired * 3;
  const hotProspectsRequired = Math.ceil(surveyVisitRequired * 1.8);
  const leadsRequired = hotProspectsRequired * 5;
  const workingDays = 25;
  const dailyCallsRequired = Math.ceil(leadsRequired / workingDays);
  const dailyWalkInCanvassingRequired = Math.ceil((hotProspectsRequired * 2) / workingDays);

  return {
    monthlyTargetUnits,
    bookingRequired,
    surveyVisitRequired,
    hotProspectsRequired,
    leadsRequired,
    dailyCallsRequired,
    dailyWalkInCanvassingRequired,
  };
}

export const SE_DAILY_SOP: SopStep[] = [
  {
    timeOrFrequency: '08:00 - 08:30 WIB',
    channel: 'Supervisi',
    activityName: 'Morning Briefing & Evaluasi Pipeline Harian',
    instruction: 'Cek daftar lead baru yang masuk dari website/iklan. Tinjau jadwal janji temu survei lokasi hari ini.',
    targetOutput: 'Daftar prioritas kontak harian siap eksekusi.',
  },
  {
    timeOrFrequency: '08:30 - 10:00 WIB',
    channel: 'WhatsApp / DM',
    activityName: 'SLA Respon Cepat Lead Baru (SOP ≤ 5 Menit)',
    instruction: 'Hubungi lead baru yang masuk dalam 5 menit pertama dengan sapaan hangat personal dan kualifikasi awal BANT.',
    targetOutput: 'Minimal 10 kontak terhubung dan diklasifikasikan statusnya.',
    slaMinutes: 5,
  },
  {
    timeOrFrequency: '10:00 - 12:30 WIB',
    channel: 'Canvassing',
    activityName: 'Eksekusi Rute Harian Kanvasing B2B',
    instruction: 'Kunjungi titik target harian (RS Indriati, bank rekanan, sentra niaga Solo Baru) dengan materi brosur resmi.',
    targetOutput: 'Minimal 15 brosur terdistribusi dan 3 kontak prospek baru didapatkan.',
  },
  {
    timeOrFrequency: '13:30 - 15:30 WIB',
    channel: 'Telepon / Calling',
    activityName: 'Follow-Up Prospek Hangat & Konfirmasi Janji Temu',
    instruction: 'Telepon prospek yang sudah menerima e-katalog untuk mengundang private preview akhir pekan.',
    targetOutput: 'Minimal 2 janji temu survei lokasi terkonfirmasi.',
  },
  {
    timeOrFrequency: '15:30 - 17:00 WIB',
    channel: 'Posting Medsos',
    activityName: 'Eksekusi Slot Posting Medsos Sales (POV)',
    instruction: 'Posting konten slot 2 (MOFU) di akun medsos sales (TikTok/IG Reels) dan tempelkan link live ke sistem.',
    targetOutput: '1 video / postingan live dengan tautan terverifikasi.',
  },
  {
    timeOrFrequency: '17:00 - 17:30 WIB',
    channel: 'Supervisi',
    activityName: 'Pengisian Laporan Harian SE (13 Item)',
    instruction: 'Input capaian realisasi harian pada dasbor Developer Sales OS dan sinkronisasi ke grup WhatsApp tim.',
    targetOutput: 'Scorecard harian terbarui 100%.',
  },
];

export const SE_KPI_METRICS: KpiItem[] = [
  {
    metric: 'Closing Unit Terjual (Akad / Pelunasan)',
    targetPeriod: 'Bulanan',
    targetValue: '1 Unit / Bulan',
    scoringWeightPercent: 40,
    minimumAcceptableValue: '1 Unit tiap 45 hari',
  },
  {
    metric: 'Kunjungan Survei Lokasi Fisik',
    targetPeriod: 'Mingguan',
    targetValue: '2 Survei / Minggu',
    scoringWeightPercent: 20,
    minimumAcceptableValue: '1 Survei / Minggu',
  },
  {
    metric: 'Prospek Terkualifikasi (BANT ≥ 7)',
    targetPeriod: 'Mingguan',
    targetValue: '5 Prospek / Minggu',
    scoringWeightPercent: 15,
    minimumAcceptableValue: '3 Prospek / Minggu',
  },
  {
    metric: 'SLA Respon Kontak Lead Baru',
    targetPeriod: 'Harian',
    targetValue: '≤ 5 Menit',
    scoringWeightPercent: 15,
    minimumAcceptableValue: '≤ 15 Menit',
  },
  {
    metric: 'Disiplin Input Laporan Harian & Posting',
    targetPeriod: 'Harian',
    targetValue: '100% Tepat Waktu',
    scoringWeightPercent: 10,
    minimumAcceptableValue: '90%',
  },
];

export function generatePlaybookPlan(
  projectId: string = 'proj-the-park-01',
  role: PlaybookRole = 'SE',
  aiMode: 'human_only' | 'semi_ai' | 'full_ai' = 'human_only',
  version: number = 1
): PlaybookPlan {
  const titles: Record<PlaybookRole, string> = {
    SE: 'Playbook Standar Operasional & Target Aktivitas Sales Executive',
    TL: 'Playbook Supervisi Tim, Eskalasi, & SLA Team Leader',
    SM: 'Playbook Manajemen Master Proyek, Portofolio, & Tata Kelola Sales Manager',
  };

  const sops = role === 'SE' ? SE_DAILY_SOP : [
    {
      timeOrFrequency: '08:30 WIB',
      channel: 'Supervisi' as const,
      activityName: 'Audit Radar SLA 5 Menit Tim SE',
      instruction: 'Pastikan seluruh lead baru telah dihubungi dalam 5 menit. Tarik lead yang mangkir >72 jam ke lead pool bersama.',
      targetOutput: '0 lead terabaikan melebihi batas waktu SLA.',
    },
    {
      timeOrFrequency: '11:00 WIB',
      channel: 'Supervisi' as const,
      activityName: 'Pendampingan Negosiasi Unit & Approval Diskon',
      instruction: 'Dampingi SE pada prospek Hot yang mengajukan diskon cash keras atau skema cicilan khusus developer.',
      targetOutput: 'Keputusan negosiasi selesai dalam batas wewenang.',
    },
  ];

  return {
    id: `playbook-${projectId}-${role.toLowerCase()}-v${version}`,
    projectId,
    projectName: 'The Park Townhouse Sukoharjo',
    role,
    version,
    title: titles[role],
    aiMode,
    monthlyUnitTarget: 1.0,
    reverseFunnelTargets: {
      leads: 120,
      prospek: 40,
      hot_prospek: 15,
      survei: 6,
      booking: 2,
      closing: 1,
    },
    bantCriteria: THE_PARK_BANT_CRITERIA,
    dailySop: sops,
    weeklySop: [
      {
        timeOrFrequency: 'Senin 09:00 WIB',
        channel: 'Supervisi',
        activityName: 'Weekly Pipeline Meeting & Redistribution',
        instruction: 'Evaluasi konversi BANT, realisasi survei lokasi, dan redistribusi lead dingin.',
        targetOutput: 'Rencana kerja mingguan terpadu.',
      },
    ],
    monthlySop: [
      {
        timeOrFrequency: 'Akhir Bulan',
        channel: 'Supervisi',
        activityName: 'Evaluasi Pencapaian Target Omset & Komisi',
        instruction: 'Rekapitulasi akad kredit, verifikasi berkas legalitas notaris, dan kalkulasi komisi penjualan.',
        targetOutput: 'Laporan bulanan pengesahan Direksi.',
      },
    ],
    kpiMetrics: SE_KPI_METRICS,
    generatedAt: new Date().toISOString(),
    tokensUsed: 1240,
  };
}

const playbookStore = new Map<string, Map<string, PlaybookPlan>>();

export function getPlaybook(
  projectId: string,
  role: PlaybookRole = 'SE',
  isDemoMode: boolean = false
): PlaybookPlan {
  let projMap = playbookStore.get(projectId);
  if (!projMap) {
    projMap = new Map();
    playbookStore.set(projectId, projMap);
    projMap.set('SE', generatePlaybookPlan(projectId, 'SE'));
    projMap.set('TL', generatePlaybookPlan(projectId, 'TL'));
    projMap.set('SM', generatePlaybookPlan(projectId, 'SM'));
  }

  let plan = projMap.get(role);
  if (!plan) {
    plan = generatePlaybookPlan(projectId, role);
    projMap.set(role, plan);
  }

  if (isDemoMode) {
    return {
      ...plan,
      dailySop: plan.dailySop.slice(0, 2),
      bantCriteria: plan.bantCriteria.slice(0, 2),
      kpiMetrics: plan.kpiMetrics.slice(0, 2),
    };
  }

  return plan;
}
