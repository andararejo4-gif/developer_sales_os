/**
 * Developer Plan Override Engine untuk IT Internal & Superadmin
 * Memungkinkan Tim IT memberikan override paket (Gold, Platinum, Diamond) per developer / tenant.
 */

import { loadPersistedState, savePersistedState } from '../navigation/router';
import { loadAuthSession } from '../auth/dummy-accounts';

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

function getPlanAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

function mapApiOverride(row: any): DeveloperPlanOverride {
  return {
    developerId: String(row.developer_id || row.developerId),
    companyName: String(row.company_name || row.companyName || ''),
    originalPlan: (row.original_plan || row.originalPlan || 'Platinum') as PlanTier,
    overriddenPlan: (row.overridden_plan || row.overriddenPlan || 'Platinum') as PlanTier,
    overriddenAt: String(row.overridden_at || row.overriddenAt || new Date().toISOString()),
    overriddenBy: String(row.overridden_by || row.overriddenBy || 'Tim IT Internal (SUPERADMIN_IT)'),
    reason: String(row.reason || ''),
    validUntil: String(row.valid_until || row.validUntil || '30 Hari'),
  };
}

export async function fetchPlanOverridesFromDb(): Promise<Record<string, DeveloperPlanOverride>> {
  try {
    const res = await fetch('/api/it/plan-overrides', {
      credentials: 'include',
      headers: getPlanAuthHeaders(),
    });
    if (!res.ok) return loadDeveloperPlanOverrides();
    const json = await res.json();
    if (!json.ok || !Array.isArray(json.overrides)) return loadDeveloperPlanOverrides();
    const map: Record<string, DeveloperPlanOverride> = {};
    for (const row of json.overrides) {
      const item = mapApiOverride(row);
      map[item.developerId] = item;
    }
    inMemoryOverrides = { ...map };
    savePersistedState(PLAN_OVERRIDE_STORAGE_KEY, map);
    return map;
  } catch {
    return loadDeveloperPlanOverrides();
  }
}

export async function savePlanOverrideToDb(
  override: DeveloperPlanOverride
): Promise<{ ok: boolean; error?: string; override?: DeveloperPlanOverride }> {
  try {
    const res = await fetch('/api/it/plan-overrides', {
      method: 'PUT',
      credentials: 'include',
      headers: getPlanAuthHeaders(),
      body: JSON.stringify(override),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error || 'Gagal menyimpan override paket ke database.' };
    }
    const saved = json.override ? mapApiOverride(json.override) : override;
    setDeveloperPlanOverride(saved);
    return { ok: true, override: saved };
  } catch {
    return { ok: false, error: 'Gagal terhubung ke server.' };
  }
}

export async function deletePlanOverrideFromDb(
  developerId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `/api/it/plan-overrides?developerId=${encodeURIComponent(developerId)}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: getPlanAuthHeaders(),
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.error || 'Gagal mereset override paket di database.' };
    }
    removeDeveloperPlanOverride(developerId);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Gagal terhubung ke server.' };
  }
}
