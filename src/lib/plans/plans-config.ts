// Konfigurasi Paket & Feature Flag (Config-Driven, Bukan Hardcode)
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
  price: number | null; // NULL = "Hubungi kami"
  billing_period: string;
  description: string;
  max_active_projects: number;
  max_sales_users: number;
  badge?: string;
  features: PlanFeature[];
}

export const PLANS_CONFIG: PlanDefinition[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'gold',
    name: 'Gold',
    price: null,
    billing_period: 'bulanan',
    description: 'Fondasi pemasaran dan digitalisasi proyek untuk pengembang yang sedang bertumbuh.',
    max_active_projects: 1,
    max_sales_users: 5,
    features: [
      { feature_key: 'love_letter_99', feature_name: 'Surat Cinta 99 Keunggulan', feature_value: 'gratis', is_enabled: true },
      { feature_key: 'market_research', feature_name: 'Riset Pasar (Radius 500m - 25km)', feature_value: 'dasar', is_enabled: true },
      { feature_key: 'sales_target', feature_name: 'Target Penjualan s.d. Sold Out', feature_value: true, is_enabled: true },
      { feature_key: 'landing_page', feature_name: 'Website Landing Page Proyek', feature_value: 'template_standar', is_enabled: true },
      { feature_key: 'content_calendar_official', feature_name: 'Kalender Konten Akun Official', feature_value: '1_bulan', is_enabled: true },
      { feature_key: 'content_calendar_inhouse', feature_name: 'Kalender Konten Sales In-House', feature_value: false, is_enabled: false },
      { feature_key: 'playbook_se', feature_name: 'Playbook SE + Rute Harian', feature_value: true, is_enabled: true },
      { feature_key: 'playbook_tl', feature_name: 'Playbook Team Leader', feature_value: 'dokumen_manual', is_enabled: false }, // not AI
      { feature_key: 'playbook_sm', feature_name: 'Playbook Sales Manager', feature_value: 'dokumen_manual', is_enabled: false }, // not AI
      { feature_key: 'crm_pipeline', feature_name: 'CRM & Pipeline Penjualan', feature_value: 'dasar', is_enabled: true },
      { feature_key: 'support_level', feature_name: 'Dukungan Layanan', feature_value: 'Email', is_enabled: true },
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'platinum',
    name: 'Platinum',
    price: null,
    billing_period: 'bulanan',
    badge: 'Paling Populer',
    description: 'Akselerasi penjualan properti dengan supervisi otonom TL Full AI hingga 3 proyek.',
    max_active_projects: 3,
    max_sales_users: 20,
    features: [
      { feature_key: 'love_letter_99', feature_name: 'Surat Cinta 99 Keunggulan', feature_value: 'gratis', is_enabled: true },
      { feature_key: 'market_research', feature_name: 'Riset Pasar (Radius 500m - 25km)', feature_value: 'lengkap', is_enabled: true },
      { feature_key: 'sales_target', feature_name: 'Target Penjualan s.d. Sold Out', feature_value: true, is_enabled: true },
      { feature_key: 'landing_page', feature_name: 'Website Landing Page Proyek', feature_value: 'template_kustom_section', is_enabled: true },
      { feature_key: 'content_calendar_official', feature_name: 'Kalender Konten Akun Official', feature_value: '1_bulan_caption_hashtag', is_enabled: true },
      { feature_key: 'content_calendar_inhouse', feature_name: 'Kalender Konten Sales In-House', feature_value: 'add_on', is_enabled: true },
      { feature_key: 'playbook_se', feature_name: 'Playbook SE + Rute Harian', feature_value: true, is_enabled: true },
      { feature_key: 'playbook_tl', feature_name: 'Playbook Team Leader', feature_value: 'full_ai', is_enabled: true }, // TL Full AI
      { feature_key: 'playbook_sm', feature_name: 'Playbook Sales Manager', feature_value: 'dokumen_manual', is_enabled: false },
      { feature_key: 'crm_pipeline', feature_name: 'CRM & Pipeline Penjualan', feature_value: 'penuh_kpi_harian', is_enabled: true },
      { feature_key: 'support_level', feature_name: 'Dukungan Layanan', feature_value: 'Prioritas', is_enabled: true },
    ]
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    code: 'diamond',
    name: 'Diamond',
    price: null,
    billing_period: 'tahunan',
    badge: 'Enterprise',
    description: 'Ekosistem lengkap tak terbatas dengan TL Full AI, SM Semi-AI, dan pendamping khusus.',
    max_active_projects: 999,
    max_sales_users: 999,
    features: [
      { feature_key: 'love_letter_99', feature_name: 'Surat Cinta 99 Keunggulan', feature_value: 'gratis', is_enabled: true },
      { feature_key: 'market_research', feature_name: 'Riset Pasar (Radius 500m - 25km)', feature_value: 'lengkap_pembaruan_berkala', is_enabled: true },
      { feature_key: 'sales_target', feature_name: 'Target Penjualan s.d. Sold Out', feature_value: true, is_enabled: true },
      { feature_key: 'landing_page', feature_name: 'Website Landing Page Proyek', feature_value: 'kustom_penuh_domain_sendiri', is_enabled: true },
      { feature_key: 'content_calendar_official', feature_name: 'Kalender Konten Akun Official', feature_value: 'penjadwalan_dan_pengingat', is_enabled: true },
      { feature_key: 'content_calendar_inhouse', feature_name: 'Kalender Konten Sales In-House', feature_value: 'termasuk', is_enabled: true },
      { feature_key: 'playbook_se', feature_name: 'Playbook SE + Rute Harian', feature_value: true, is_enabled: true },
      { feature_key: 'playbook_tl', feature_name: 'Playbook Team Leader', feature_value: 'full_ai', is_enabled: true }, // TL Full AI
      { feature_key: 'playbook_sm', feature_name: 'Playbook Sales Manager', feature_value: 'semi_ai', is_enabled: true }, // SM Semi-AI
      { feature_key: 'crm_pipeline', feature_name: 'CRM & Pipeline Penjualan', feature_value: 'penuh_dasbor_eksekutif', is_enabled: true },
      { feature_key: 'support_level', feature_name: 'Dukungan Layanan', feature_value: 'Pendamping Khusus', is_enabled: true },
    ]
  }
];

export function getPlanDisplayPrice(plan: PlanDefinition): string {
  if (plan.price === null || plan.price === undefined) {
    return 'Hubungi kami';
  }
  return `Rp ${new Intl.NumberFormat('id-ID').format(plan.price)} / ${plan.billing_period}`;
}

export function hasPlanFeature(planCode: 'gold' | 'platinum' | 'diamond', featureKey: string): boolean {
  const plan = PLANS_CONFIG.find(p => p.code === planCode);
  if (!plan) return false;
  const feat = plan.features.find(f => f.feature_key === featureKey);
  if (!feat) return false;
  if (featureKey === 'playbook_tl') {
    return feat.feature_value === 'full_ai';
  }
  if (featureKey === 'playbook_sm') {
    return feat.feature_value === 'semi_ai';
  }
  return feat.is_enabled;
}
