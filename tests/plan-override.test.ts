import { describe, expect, it } from 'bun:test';
import {
  getDeveloperPlan,
  setDeveloperPlanOverride,
  removeDeveloperPlanOverride,
  PLAN_TIER_DETAILS,
  loadDeveloperPlanOverrides,
  type DeveloperPlanOverride,
} from '../src/lib/plans/plan-override';

describe('Developer Plan Override Engine (IT Internal)', () => {
  it('memiliki konfigurasi kuota dan fitur akurat untuk Gold, Platinum, dan Diamond', () => {
    expect(PLAN_TIER_DETAILS.Gold.featureCount).toBe(63);
    expect(PLAN_TIER_DETAILS.Platinum.featureCount).toBe(88);
    expect(PLAN_TIER_DETAILS.Diamond.featureCount).toBe(100);

    expect(PLAN_TIER_DETAILS.Gold.maxProjects).toBe(1);
    expect(PLAN_TIER_DETAILS.Platinum.maxProjects).toBe(3);
    expect(PLAN_TIER_DETAILS.Diamond.maxProjects).toBe(10);
  });

  it('mengembalikan paket bawaan jika belum ada override', () => {
    const plan = getDeveloperPlan('dev-test-clean', 'Gold');
    expect(plan).toBe('Gold');
  });

  it('berhasil melakukan override paket per developer (misal: upgrade Gold ke Diamond)', () => {
    const overridePayload: DeveloperPlanOverride = {
      developerId: 'dev-002',
      companyName: 'PT Graha Mandiri Propertindo',
      originalPlan: 'Gold',
      overriddenPlan: 'Diamond',
      overriddenAt: new Date().toISOString(),
      overriddenBy: 'Tim IT Internal (SUPERADMIN_IT)',
      reason: 'Uji coba Enterprise & akses penuh AI Guide',
      validUntil: '30 Hari',
    };

    setDeveloperPlanOverride(overridePayload);

    const activePlan = getDeveloperPlan('dev-002', 'Gold');
    expect(activePlan).toBe('Diamond');

    const overrides = loadDeveloperPlanOverrides();
    expect(overrides['dev-002']).toBeDefined();
    expect(overrides['dev-002'].overriddenPlan).toBe('Diamond');
    expect(overrides['dev-002'].reason).toContain('Uji coba Enterprise');
  });

  it('berhasil menghapus override dan mengembalikan ke paket kontrak asli', () => {
    removeDeveloperPlanOverride('dev-002');
    const restoredPlan = getDeveloperPlan('dev-002', 'Gold');
    expect(restoredPlan).toBe('Gold');
  });
});
