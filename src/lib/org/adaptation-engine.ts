// Mesin Penyesuaian Terpusat (Fase 1B): effective_features(tenant, project)
// Mengatur perilaku sistem, menu, hierarki, dan playbook berdasarkan hasil kuesioner onboarding developer

export interface OrgProfile {
  company_name: string;
  headquarters_city: string;
  employee_count_range: '1-5' | '6-15' | '16-50' | '51-100' | '>100';
  active_projects_count: number;
  social_channels: string[];
  has_official_social: boolean;
  has_website: boolean;
  lead_tool: 'excel' | 'crm_lain' | 'belum_ada';
  monthly_sales_target_range?: string;
  monthly_ad_budget_range?: string;
  alternative_sales_channel?: string;
}

export interface OrgRoleItem {
  role_key: string;
  enabled: boolean;
  headcount: number;
  ai_mode: 'human_only' | 'semi_ai' | 'full_ai';
  custom_label?: string;
}

export interface EffectiveFeatures {
  has_inhouse_sales: boolean;
  show_se_routes: boolean;
  show_se_kpi: boolean;
  show_inhouse_content: boolean;
  hierarchy_type: 'se_tl_sm' | 'se_sm' | 'se_owner' | 'freelance_admin';
  tl_mode: 'human' | 'virtual_full_ai' | 'none';
  sm_mode: 'human' | 'virtual_semi_ai' | 'owner_fallback';
  admin_automation_enabled: boolean;
  digital_marketing_automated: boolean;
  target_per_se: {
    monthly_units: number;
    daily_calls: number;
    daily_chats: number;
    monthly_leads: number;
  };
  ui_mode: 'compact' | 'standard' | 'enterprise_layered';
  active_social_channels: string[];
  recommended_plan: 'gold' | 'platinum' | 'diamond';
  plan_limit_warnings: string[];
}

export function computeEffectiveFeatures(
  planCode: 'gold' | 'platinum' | 'diamond',
  profile: OrgProfile,
  roles: OrgRoleItem[],
  totalProjectUnits = 30
): EffectiveFeatures {
  const seRole = roles.find(r => r.role_key === 'SALES_EXECUTIVE');
  const tlRole = roles.find(r => r.role_key === 'TEAM_LEADER');
  const smRole = roles.find(r => r.role_key === 'SALES_MANAGER');
  const adminRole = roles.find(r => r.role_key === 'ADMIN');
  const mktRole = roles.find(r => r.role_key === 'DIGITAL_MARKETING');

  const hasInhouseSales = seRole ? seRole.enabled && seRole.headcount > 0 : false;
  const hasTL = tlRole ? tlRole.enabled && tlRole.headcount > 0 : false;
  const hasSM = smRole ? smRole.enabled && smRole.headcount > 0 : false;
  const hasAdmin = adminRole ? adminRole.enabled && adminRole.headcount > 0 : false;
  const hasMkt = mktRole ? mktRole.enabled && mktRole.headcount > 0 : false;

  // 1. Tentukan Hierarki Tim
  let hierarchyType: 'se_tl_sm' | 'se_sm' | 'se_owner' | 'freelance_admin' = 'se_tl_sm';
  if (!hasInhouseSales) {
    hierarchyType = 'freelance_admin';
  } else if (!hasTL && hasSM) {
    hierarchyType = 'se_sm';
  } else if (!hasTL && !hasSM) {
    hierarchyType = 'se_owner';
  }

  // 2. Tentukan Mode TL
  let tlMode: 'human' | 'virtual_full_ai' | 'none' = 'none';
  if (hasTL) {
    tlMode = 'human';
  } else if (hasInhouseSales && (planCode === 'platinum' || planCode === 'diamond')) {
    // TL Virtual Full AI aktif bila paket mengizinkan
    tlMode = 'virtual_full_ai';
  }

  // 3. Tentukan Mode SM
  let smMode: 'human' | 'virtual_semi_ai' | 'owner_fallback' = 'owner_fallback';
  if (hasSM) {
    smMode = 'human';
  } else if (planCode === 'diamond') {
    smMode = 'virtual_semi_ai';
  }

  // 4. Pembagian Beban Target per SE (N)
  const seCount = hasInhouseSales ? Math.max(1, seRole?.headcount || 1) : 1;
  const monthlyProjectTargetUnits = Math.max(1, Math.round(totalProjectUnits / 10)); // Target sold out dalam 10 bulan
  const targetUnitsPerSe = Math.max(1, Math.round(monthlyProjectTargetUnits / seCount));
  const targetPerSe = {
    monthly_units: targetUnitsPerSe,
    daily_calls: Math.max(15, Math.round(30 / Math.sqrt(seCount))),
    daily_chats: Math.max(25, Math.round(50 / Math.sqrt(seCount))),
    monthly_leads: Math.round(60 / seCount)
  };

  // 5. UI Mode (Compact untuk <= 5 orang, Enterprise untuk > 50 orang)
  let uiMode: 'compact' | 'standard' | 'enterprise_layered' = 'standard';
  if (profile.employee_count_range === '1-5') {
    uiMode = 'compact';
  } else if (profile.employee_count_range === '>100' || profile.employee_count_range === '51-100') {
    uiMode = 'enterprise_layered';
  }

  // 6. Rekomendasi Paket Berdasarkan Headcount & Proyek
  let recommendedPlan: 'gold' | 'platinum' | 'diamond' = 'gold';
  const totalSalesUsers = (seRole?.headcount || 0) + (tlRole?.headcount || 0) + (smRole?.headcount || 0);

  if (profile.active_projects_count > 3 || totalSalesUsers > 20) {
    recommendedPlan = 'diamond';
  } else if (profile.active_projects_count > 1 || totalSalesUsers > 5) {
    recommendedPlan = 'platinum';
  }

  // 7. Peringatan Batas User Paket
  const planLimitWarnings: string[] = [];
  if (planCode === 'gold' && totalSalesUsers > 5) {
    planLimitWarnings.push(`Jumlah sales (${totalSalesUsers}) melebihi kuota 5 user di paket Gold. Disarankan upgrade ke Platinum.`);
  }
  if (planCode === 'platinum' && totalSalesUsers > 20) {
    planLimitWarnings.push(`Jumlah sales (${totalSalesUsers}) melebihi kuota 20 user di paket Platinum. Disarankan upgrade ke Diamond.`);
  }

  return {
    has_inhouse_sales: hasInhouseSales,
    show_se_routes: hasInhouseSales,
    show_se_kpi: hasInhouseSales,
    show_inhouse_content: hasInhouseSales,
    hierarchy_type: hierarchyType,
    tl_mode: tlMode,
    sm_mode: smMode,
    admin_automation_enabled: !hasAdmin,
    digital_marketing_automated: !hasMkt,
    target_per_se: targetPerSe,
    ui_mode: uiMode,
    active_social_channels: profile.social_channels.length > 0 ? profile.social_channels : ['instagram', 'tiktok'],
    recommended_plan: recommendedPlan,
    plan_limit_warnings: planLimitWarnings
  };
}
