import { describe, expect, it } from 'bun:test';
import { computeEffectiveFeatures, OrgProfile, OrgRoleItem } from '../src/lib/org/adaptation-engine';

describe('Fase 1B: effective_features Engine & Adaptation Questionnaire', () => {
  // Tenant A: Lengkap (In-House SE, TL, SM, Admin, Digital Marketing)
  const profileA: OrgProfile = {
    company_name: 'PT Andara Rejo Makmur',
    headquarters_city: 'Sukoharjo',
    employee_count_range: '16-50',
    active_projects_count: 1,
    social_channels: ['instagram', 'tiktok', 'facebook'],
    has_official_social: true,
    has_website: true,
    lead_tool: 'excel'
  };

  const rolesA: OrgRoleItem[] = [
    { role_key: 'SALES_EXECUTIVE', enabled: true, headcount: 3, ai_mode: 'semi_ai' },
    { role_key: 'TEAM_LEADER', enabled: true, headcount: 1, ai_mode: 'full_ai' },
    { role_key: 'SALES_MANAGER', enabled: true, headcount: 1, ai_mode: 'semi_ai' },
    { role_key: 'ADMIN', enabled: true, headcount: 1, ai_mode: 'human_only' },
    { role_key: 'DIGITAL_MARKETING', enabled: true, headcount: 1, ai_mode: 'semi_ai' }
  ];

  // Tenant B: Tanpa Sales In-House (Hanya Freelance Agent & Admin)
  const profileB: OrgProfile = {
    company_name: 'PT Solo Raya Property',
    headquarters_city: 'Surakarta',
    employee_count_range: '1-5',
    active_projects_count: 1,
    social_channels: ['instagram'],
    has_official_social: true,
    has_website: false,
    lead_tool: 'belum_ada'
  };

  const rolesB: OrgRoleItem[] = [
    { role_key: 'SALES_EXECUTIVE', enabled: false, headcount: 0, ai_mode: 'human_only' },
    { role_key: 'TEAM_LEADER', enabled: false, headcount: 0, ai_mode: 'human_only' },
    { role_key: 'SALES_MANAGER', enabled: false, headcount: 0, ai_mode: 'human_only' },
    { role_key: 'ADMIN', enabled: true, headcount: 1, ai_mode: 'human_only' },
    { role_key: 'FREELANCE_AGENT', enabled: true, headcount: 10, ai_mode: 'human_only' }
  ];

  it('Tenant A (lengkap) mengaktifkan Rute Harian SE, KPI SE, dan hierarki se_tl_sm', () => {
    const featA = computeEffectiveFeatures('diamond', profileA, rolesA);
    expect(featA.has_inhouse_sales).toBe(true);
    expect(featA.show_se_routes).toBe(true);
    expect(featA.show_se_kpi).toBe(true);
    expect(featA.hierarchy_type).toBe('se_tl_sm');
    expect(featA.target_per_se.monthly_units).toBe(1); // 3 unit / 3 SE = 1 unit per SE
  });

  it('Tenant B (tanpa sales in-house) otomatis menyembunyikan rute SE, KPI SE, dan mengubah hierarki', () => {
    const featB = computeEffectiveFeatures('gold', profileB, rolesB);
    expect(featB.has_inhouse_sales).toBe(false);
    expect(featB.show_se_routes).toBe(false);
    expect(featB.show_se_kpi).toBe(false);
    expect(featB.show_inhouse_content).toBe(false);
    expect(featB.hierarchy_type).toBe('freelance_admin');
    expect(featB.ui_mode).toBe('compact'); // <= 5 orang
  });

  it('Mengubah Tenant B menjadi memiliki 3 SE mengaktifkan fitur sales in-house secara dinamis', () => {
    const updatedRolesB = structuredClone(rolesB);
    const seIdx = updatedRolesB.findIndex(r => r.role_key === 'SALES_EXECUTIVE');
    updatedRolesB[seIdx].enabled = true;
    updatedRolesB[seIdx].headcount = 3;

    const featBUpdated = computeEffectiveFeatures('platinum', profileB, updatedRolesB);
    expect(featBUpdated.has_inhouse_sales).toBe(true);
    expect(featBUpdated.show_se_routes).toBe(true);
    expect(featBUpdated.show_se_kpi).toBe(true);
    // Tanpa TL, hierarki beralih ke SE -> Owner
    expect(featBUpdated.hierarchy_type).toBe('se_owner');
    // Di paket Platinum, TL Virtual Full AI otomatis diaktifkan untuk membantu pengawasan
    expect(featBUpdated.tl_mode).toBe('virtual_full_ai');
  });

  it('Mode TL Full AI tidak aktif di paket Gold', () => {
    // Di paket Gold tanpa TL manusia, tl_mode adalah 'none' (bukan virtual_full_ai)
    const goldFeat = computeEffectiveFeatures('gold', profileB, [
      { role_key: 'SALES_EXECUTIVE', enabled: true, headcount: 2, ai_mode: 'human_only' }
    ]);
    expect(goldFeat.tl_mode).toBe('none');
  });
});
