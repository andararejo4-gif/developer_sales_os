/**
 * Developer Plan Override Engine untuk IT Internal & Superadmin
 * Memungkinkan Tim IT memberikan override paket (Gold, Platinum, Diamond) per developer / tenant.
 */

import { loadPersistedState, savePersistedState } from '../navigation/router';

export type PlanTier = 'Gold' | 'Platinum' | 'Diamond';

export interface DeveloperPlanOverride {
  developerId: string;
  companyName: string;
  originalPlan: PlanTier;
  overriddenPlan: PlanTier;
  overriddenAt: string;
  overriddenBy: string;
  reason: string;
  validUntil: string;
}

export const PLAN_OVERRIDE_STORAGE_KEY = 'devos_developer_plan_overrides_v1';

export const PLAN_TIER_DETAILS: Record<
  PlanTier,
  {
    featureCount: number;
    maxProjects: number;
    maxUsers: number;
    code: 'gold' | 'platinum' | 'diamond';
    badgeLabel: string;
    description: string;
    color: string;
    border: string;
  }
> = {
  Gold: {
    featureCount: 63,
    maxProjects: 1,
    maxUsers: 5,
    code: 'gold',
    badgeLabel: 'Gold Tier (Standar)',
    description: '63 Fitur Esensial: CRM Pipeline, Dokumen KPR, SLA Timer, dan Laporan Harian Sales.',
    color: 'bg-amber-50 text-amber-900 border-amber-300',
    border: 'border-amber-400',
  },
  Platinum: {
    featureCount: 88,
    maxProjects: 3,
    maxUsers: 20,
    code: 'platinum',
    badgeLabel: 'Platinum Tier (Pro & AI)',
    description: '88 Fitur + AI Activity Guide: Absensi Lapangan SE, Log Panggilan, & Otomasi Virtual TL.',
    color: 'bg-blue-50 text-blue-900 border-blue-300',
    border: 'border-blue-400',
  },
  Diamond: {
    featureCount: 100,
    maxProjects: 10,
    maxUsers: 50,
    code: 'diamond',
    badgeLabel: 'Diamond Tier (Enterprise)',
    description: '100 Fitur Lengkap: Seluruh Modul M01-M17, Portofolio Multi-Proyek, & Kapasitas Penuh.',
    color: 'bg-purple-50 text-purple-900 border-purple-300',
    border: 'border-purple-400',
  },
};

let inMemoryOverrides: Record<string, DeveloperPlanOverride> = {};

export function loadDeveloperPlanOverrides(): Record<string, DeveloperPlanOverride> {
  const persisted = loadPersistedState<Record<string, DeveloperPlanOverride>>(
    PLAN_OVERRIDE_STORAGE_KEY,
    {}
  );
  return { ...inMemoryOverrides, ...persisted };
}

export function getDeveloperPlan(developerId: string, defaultPlan: PlanTier = 'Platinum'): PlanTier {
  const overrides = loadDeveloperPlanOverrides();
  const found = overrides[developerId];
  if (found && found.overriddenPlan) {
    return found.overriddenPlan;
  }
  return defaultPlan;
}

export function setDeveloperPlanOverride(override: DeveloperPlanOverride): void {
  inMemoryOverrides[override.developerId] = override;
  const current = loadDeveloperPlanOverrides();
  current[override.developerId] = override;
  savePersistedState(PLAN_OVERRIDE_STORAGE_KEY, current);
}

export function removeDeveloperPlanOverride(developerId: string): void {
  delete inMemoryOverrides[developerId];
  const current = loadDeveloperPlanOverrides();
  delete current[developerId];
  savePersistedState(PLAN_OVERRIDE_STORAGE_KEY, current);
}
