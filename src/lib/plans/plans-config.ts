// Konfigurasi Paket & Feature Flag (Config-Driven, Bukan Hardcode)
// Blueprint v1.2 Bab 12 & Bab 13 (Status: Usulan)
// Dapat diubah langsung dari database / panel Superadmin tanpa redeploy

export interface PlanFeature {
  feature_key: string;
  feature_name: string;
  feature_value: any;
  is_enabled: boolean;
}

export interface PlanDefinition {
  id: string;
  code: 'gold' | 'platinum' | 'diamond';
  name: string;
  price: number; // Angka usulan dalam Rupiah
  price_status: 'usulan' | 'tetap';
  billing_period: '3_bulan_kalender';
  description: string;
  max_active_projects: number;
  max_sales_users: number;
  aic_total_quota: number;
  human_ops_hours: number;
  max_contacts: number;
  max_storage_gb: number;
  max_pageviews_monthly: number;
  max_wa_numbers: number;
  max_field_personnel: number;
  ai_activity_guide_enabled: boolean;
  ai_activity_guide_rate_aic: number;
  feature_count: number;
  badge?: string;
  features: PlanFeature[];
}

export interface TopupPackage {
  id: string;
  category: 'ai' | 'human_service' | 'capacity_pass' | 'channel_wallet';
  name: string;
  price: number;
  price_status: 'usulan' | 'tetap';
  quota_type: string;
  quota_amount: number;
  validity_days: number;
  description: string;
}

export const TOPUP_PACKAGES_CONFIG: TopupPackage[] = [
  {
    id: 'topup_ai_booster',
    category: 'ai',
    name: 'AI Booster (5.000 AIC)',
    price: 990000,
    price_status: 'usulan',
    quota_type: 'aic',
    quota_amount: 5000,
    validity_days: 90,
    description: 'Wallet 90 hari untuk job generatif tambahan (FEFO pemotongan)'
  },
  {
    id: 'topup_ai_turbo',
    category: 'ai',
    name: 'AI Turbo (25.000 AIC)',
    price: 3990000,
    price_status: 'usulan',
    quota_type: 'aic',
    quota_amount: 25000,
    validity_days: 90,
    description: 'Wallet 90 hari untuk job generatif skala besar & optimasi konten'
  },
  {
    id: 'topup_service_booster',
    category: 'human_service',
    name: 'Service Booster (2 Jam Ops)',
    price: 790000,
    price_status: 'usulan',
    quota_type: 'human_hours',
    quota_amount: 2,
    validity_days: 90,
    description: 'Bantuan 2 jam operasional manusia pendamping untuk penyiapan data'
  },
  {
    id: 'topup_service_turbo',
    category: 'human_service',
    name: 'Service Turbo (8 Jam Ops)',
    price: 2790000,
    price_status: 'usulan',
    quota_type: 'human_hours',
    quota_amount: 8,
    validity_days: 90,
    description: 'Bantuan 8 jam operasional manusia pendamping teknis & integrasi'
  },
  {
    id: 'pass_user_5',
    category: 'capacity_pass',
    name: 'Capacity Pass +5 Pengguna',
    price: 490000,
    price_status: 'usulan',
    quota_type: 'users',
    quota_amount: 5,
    validity_days: 30,
    description: 'Buka kapasitas 5 user manusia tambahan selama 30 hari'
  },
  {
    id: 'pass_project_1',
    category: 'capacity_pass',
    name: 'Capacity Pass +1 Proyek',
    price: 1490000,
    price_status: 'usulan',
    quota_type: 'projects',
    quota_amount: 1,
    validity_days: 30,
    description: 'Buka kapasitas 1 proyek aktif tambahan selama 30 hari'
  },
  {
    id: 'pass_contact_10k',
    category: 'capacity_pass',
    name: 'Capacity Pass +10.000 Kontak',
    price: 199000,
    price_status: 'usulan',
    quota_type: 'contacts',
    quota_amount: 10000,
    validity_days: 30,
    description: 'Kapasitas simpan tambahan 10.000 kontak lead selama 30 hari'
  },
  {
    id: 'pass_wa_1',
    category: 'capacity_pass',
    name: 'Capacity Pass +1 Nomor WhatsApp',
    price: 299000,
    price_status: 'usulan',
    quota_type: 'wa_number',
    quota_amount: 1,
    validity_days: 30,
    description: 'Koneksi 1 nomor WhatsApp resmi tambahan selama 30 hari'
  }
];

export const PLANS_CONFIG: PlanDefinition[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'gold',
    name: 'Gold',
    price: 4900000,
    price_status: 'usulan',
    billing_period: '3_bulan_kalender',
    description: 'Fondasi pemasaran dan digitalisasi proyek untuk pengembang yang sedang bertumbuh (cukup untuk pilot 1 proyek).',
    max_active_projects: 1,
    max_sales_users: 5,
    aic_total_quota: 20000,
    human_ops_hours: 2,
    max_contacts: 10000,
    max_storage_gb: 10,
    max_pageviews_monthly: 20000,
    max_wa_numbers: 1,
    max_field_personnel: 5,
    ai_activity_guide_enabled: false,
    ai_activity_guide_rate_aic: 5,
    feature_count: 63,
    features: [
      { feature_key: 'love_letter_99', feature_name: 'Surat Cinta Hingga 99 Keunggulan', feature_value: 'gratis', is_enabled: true },
      { feature_key: 'market_research', feature_name: 'Riset Pasar (Radius 500m - 25km)', feature_value: 'dasar', is_enabled: true },
      { feature_key: 'sales_target', feature_name: 'Target Penjualan Berbasis Stok', feature_value: true, is_enabled: true },
      { feature_key: 'landing_page', feature_name: 'Website Landing Page Proyek', feature_value: 'template_standar', is_enabled: true },
      { feature_key: 'content_calendar_official', feature_name: 'Kalender Konten Akun Official', feature_value: '1_bulan', is_enabled: true },
      { feature_key: 'playbook_se', feature_name: 'Playbook SE + Rute Harian', feature_value: true, is_enabled: true },
      { feature_key: 'crm_pipeline', feature_name: 'CRM & Pipeline Penjualan', feature_value: 'dasar', is_enabled: true },
      { feature_key: 'se_attendance', feature_name: 'Absensi Harian Shift SE (F97)', feature_value: true, is_enabled: true },
      { feature_key: 'se_gps_tracking', feature_name: 'GPS Tugas Sesi Aktif SE (F98)', feature_value: true, is_enabled: true },
      { feature_key: 'se_call_log', feature_name: 'Log Panggilan Bisnis SE (F99)', feature_value: true, is_enabled: true },
      { feature_key: 'se_ai_activity_guide', feature_name: 'AI Guide per Aktivitas SE (F100)', feature_value: false, is_enabled: false },
      { feature_key: 'support_level', feature_name: 'Dukungan Layanan (Triage <= 8 jam)', feature_value: 'Senin - Jumat 09:00 - 17:00 WIB', is_enabled: true },
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'platinum',
    name: 'Platinum',
    price: 12900000,
    price_status: 'usulan',
    billing_period: '3_bulan_kalender',
    badge: 'Paling Populer',
    description: 'Akselerasi penjualan dengan supervisi otonom TL Full AI, AI Guide SE, dan ekspansi 3 proyek aktif.',
    max_active_projects: 3,
    max_sales_users: 20,
    aic_total_quota: 70000,
    human_ops_hours: 6,
    max_contacts: 50000,
    max_storage_gb: 50,
    max_pageviews_monthly: 100000,
    max_wa_numbers: 3,
    max_field_personnel: 20,
    ai_activity_guide_enabled: true,
    ai_activity_guide_rate_aic: 5,
    feature_count: 88,
    features: [
      { feature_key: 'love_letter_99', feature_name: 'Surat Cinta Hingga 99 Keunggulan', feature_value: 'gratis', is_enabled: true },
      { feature_key: 'market_research', feature_name: 'Riset Pasar (Radius 500m - 25km)', feature_value: 'lengkap', is_enabled: true },
      { feature_key: 'sales_target', feature_name: 'Target Penjualan Berbasis Stok', feature_value: true, is_enabled: true },
      { feature_key: 'landing_page', feature_name: 'Website Landing Page Proyek', feature_value: 'template_kustom_section', is_enabled: true },
      { feature_key: 'content_calendar_official', feature_name: 'Kalender Konten Akun Official', feature_value: '1_bulan_caption_hashtag', is_enabled: true },
      { feature_key: 'content_calendar_inhouse', feature_name: 'Kalender Konten Sales In-House', feature_value: 'termasuk', is_enabled: true },
      { feature_key: 'playbook_se', feature_name: 'Playbook SE + Rute Harian', feature_value: true, is_enabled: true },
      { feature_key: 'playbook_tl', feature_name: 'Playbook Team Leader Full AI', feature_value: 'full_ai', is_enabled: true },
      { feature_key: 'crm_pipeline', feature_name: 'CRM & Pipeline Penjualan Penuh', feature_value: 'penuh_kpi_harian', is_enabled: true },
      { feature_key: 'se_attendance', feature_name: 'Absensi Harian Shift SE (F97)', feature_value: true, is_enabled: true },
      { feature_key: 'se_gps_tracking', feature_name: 'GPS Tugas Sesi Aktif SE (F98)', feature_value: true, is_enabled: true },
      { feature_key: 'se_call_log', feature_name: 'Log Panggilan Bisnis SE (F99)', feature_value: true, is_enabled: true },
      { feature_key: 'se_ai_activity_guide', feature_name: 'AI Guide per Aktivitas SE (F100 - 5 AIC)', feature_value: true, is_enabled: true },
      { feature_key: 'support_level', feature_name: 'Dukungan Prioritas (Triage <= 4 jam)', feature_value: 'Senin - Jumat 09:00 - 17:00 WIB', is_enabled: true },
    ]
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    code: 'diamond',
    name: 'Diamond',
    price: 39900000,
    price_status: 'usulan',
    billing_period: '3_bulan_kalender',
    badge: 'Enterprise',
    description: 'Ekosistem lengkap enterprise: 100 fitur, TL Full AI, SM Semi-AI, 10 proyek, dan 75 pengguna tim.',
    max_active_projects: 10,
    max_sales_users: 75,
    aic_total_quota: 240000,
    human_ops_hours: 16,
    max_contacts: 200000,
    max_storage_gb: 200,
    max_pageviews_monthly: 500000,
    max_wa_numbers: 10,
    max_field_personnel: 75,
    ai_activity_guide_enabled: true,
    ai_activity_guide_rate_aic: 5,
    feature_count: 100,
    features: [
      { feature_key: 'love_letter_99', feature_name: 'Surat Cinta Hingga 99 Keunggulan', feature_value: 'gratis', is_enabled: true },
      { feature_key: 'market_research', feature_name: 'Riset Pasar (Radius 500m - 25km)', feature_value: 'lengkap_pembaruan_berkala', is_enabled: true },
      { feature_key: 'sales_target', feature_name: 'Target Penjualan Berbasis Stok', feature_value: true, is_enabled: true },
      { feature_key: 'landing_page', feature_name: 'Website Landing Page Proyek', feature_value: 'kustom_penuh_domain_sendiri', is_enabled: true },
      { feature_key: 'content_calendar_official', feature_name: 'Kalender Konten Akun Official', feature_value: 'penjadwalan_dan_pengingat', is_enabled: true },
      { feature_key: 'content_calendar_inhouse', feature_name: 'Kalender Konten Sales In-House', feature_value: 'termasuk', is_enabled: true },
      { feature_key: 'playbook_se', feature_name: 'Playbook SE + Rute Harian', feature_value: true, is_enabled: true },
      { feature_key: 'playbook_tl', feature_name: 'Playbook Team Leader Full AI', feature_value: 'full_ai', is_enabled: true },
      { feature_key: 'playbook_sm', feature_name: 'Playbook Sales Manager Semi-AI', feature_value: 'semi_ai', is_enabled: true },
      { feature_key: 'crm_pipeline', feature_name: 'CRM & Pipeline Eksekutif Lintas Proyek', feature_value: 'penuh_dasbor_eksekutif', is_enabled: true },
      { feature_key: 'se_attendance', feature_name: 'Absensi Harian Shift SE (F97)', feature_value: true, is_enabled: true },
      { feature_key: 'se_gps_tracking', feature_name: 'GPS Tugas Sesi Aktif SE (F98)', feature_value: true, is_enabled: true },
      { feature_key: 'se_call_log', feature_name: 'Log Panggilan Bisnis SE (F99)', feature_value: true, is_enabled: true },
      { feature_key: 'se_ai_activity_guide', feature_name: 'AI Guide per Aktivitas SE (F100 - 5 AIC)', feature_value: true, is_enabled: true },
      { feature_key: 'support_level', feature_name: 'Dukungan Dedicated (Triage <= 1 jam)', feature_value: 'Senin - Jumat 09:00 - 17:00 WIB + PIC Portfolio', is_enabled: true },
    ]
  }
];

export const PACKAGE_EXCLUSIONS_NOTICE = [
  'Anggaran belanja iklan Meta Ads / Google Ads',
  'Tarif percakapan WhatsApp Business Platform / Meta Cloud API (dibayar langsung ke BSP/Meta)',
  'Biaya langganan domain kustom & sertifikat SSL khusus di luar subdomain giivepro',
  'Biaya meteran tanda tangan elektronik berbayar (e-sign berbayar)',
  'Biaya lisensi data pihak ketiga premium & API maps komersial skala enterprise',
  'Biaya produksi shooting fisik / fotografer lapangan',
  'Biaya notaris, pajak BPHTB/PPh, dan appraisal perbankan KPR'
];


export function getPlanDisplayPrice(plan: PlanDefinition): string {
  if (!plan.price) return 'Hubungi Kami';
  return `Rp ${plan.price.toLocaleString('id-ID')}`;
}


export function hasPlanFeature(planCode: 'gold' | 'platinum' | 'diamond', featureKey: string): boolean {
  const plan = PLANS_CONFIG.find(p => p.code === planCode);
  if (!plan) return false;
  const feat = plan.features.find(f => f.feature_key === featureKey);
  if (!feat) return false;
  return feat.is_enabled;
}

export function getPlanFeatureValue(planCode: 'gold' | 'platinum' | 'diamond', featureKey: string): any {
  const plan = PLANS_CONFIG.find(p => p.code === planCode);
  if (!plan) return null;
  const feat = plan.features.find(f => f.feature_key === featureKey);
  return feat ? feat.feature_value : null;
}
