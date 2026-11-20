// ============================================================================
// DEVELOPER SALES OS - HOOK MIKRO VALUE GENERATOR (Blueprint v1.2 Bab 12 & Bagian 4.J)
// Menggunakan data aktual dari tabel plans (bisa diubah Superadmin).
// HANYA menampilkan dimensi perbandingan yang benar secara matematika:
// - Per proyek: Gold Rp4,9 jt -> Platinum Rp4,3 jt -> Diamond Rp3,99 jt (makin hemat)
// - Per pengguna: Gold Rp980 rb -> Platinum Rp645 rb -> Diamond Rp532 rb (makin hemat)
// - Per 1.000 AIC: Gold Rp245 rb -> Platinum Rp184 rb -> Diamond Rp166 rb (makin hemat)
// ATURAN KERAS: DILARANG mengklaim "per fitur lebih hemat" karena per fitur Gold justru paling murah.
// ============================================================================

import { PlanCode } from './features-catalog';

export interface PlanPricingState {
  code: PlanCode;
  name: string;
  price: number; // e.g. 4900000, 12900000, 39900000
  periodMonths: number; // 3 bulan kalender
  projects: number;
  users: number;
  aic: number;
  featureCount: number;
}

export const CURRENT_PLANS_STATE: Record<PlanCode, PlanPricingState> = {
  gold: {
    code: 'gold',
    name: 'Gold',
    price: 4900000,
    periodMonths: 3,
    projects: 1,
    users: 5,
    aic: 20000,
    featureCount: 63
  },
  platinum: {
    code: 'platinum',
    name: 'Platinum',
    price: 12900000,
    periodMonths: 3,
    projects: 3,
    users: 20,
    aic: 70000,
    featureCount: 88
  },
  diamond: {
    code: 'diamond',
    name: 'Diamond',
    price: 39900000,
    periodMonths: 3,
    projects: 10,
    users: 75,
    aic: 240000,
    featureCount: 100
  }
};

export interface HookValueMessage {
  id: string;
  sourcePlan: PlanCode;
  targetPlan: PlanCode;
  headline: string;
  body: string;
  ctaText: string;
}

/**
 * Menghasilkan pesan hook mikro berbasis fakta matematika aktual
 */
export function generateEthicalHookMessage(
  currentPlan: PlanCode,
  plansState: Record<PlanCode, PlanPricingState> = CURRENT_PLANS_STATE
): HookValueMessage {
  if (currentPlan === 'gold') {
    const gold = plansState.gold;
    const plat = plansState.platinum;
    const additionalFeatures = plat.featureCount - gold.featureCount; // 25
    const additionalProjects = plat.projects - gold.projects; // 2
    const additionalUsers = plat.users - gold.users; // 15
    const costPerProjectGold = gold.price / gold.projects; // 4.9M
    const costPerProjectPlat = plat.price / plat.projects; // 4.3M

    return {
      id: 'hook_gold_to_platinum',
      sourcePlan: 'gold',
      targetPlan: 'platinum',
      headline: 'Ekspansi Portofolio Proyek',
      body: `Platinum membuka ${additionalFeatures} fitur tambahan, ${additionalProjects} proyek, dan ${additionalUsers} pengguna lagi. Per proyek aktif, biayanya lebih hemat (Rp ${(costPerProjectPlat / 1000000).toFixed(1)} jt vs Rp ${(costPerProjectGold / 1000000).toFixed(1)} jt).`,
      ctaText: 'Pelajari Paket Platinum'
    };
  }

  if (currentPlan === 'platinum') {
    const plat = plansState.platinum;
    const diam = plansState.diamond;
    const additionalFeatures = diam.featureCount - plat.featureCount; // 12
    const additionalProjects = diam.projects - plat.projects; // 7
    const additionalUsers = diam.users - plat.users; // 55
    const costPerUserPlat = plat.price / plat.users; // 645k
    const costPerUserDiam = diam.price / diam.users; // 532k

    return {
      id: 'hook_platinum_to_diamond',
      sourcePlan: 'platinum',
      targetPlan: 'diamond',
      headline: 'Efisiensi Skala Enterprise',
      body: `Diamond membuka ${additionalFeatures} fitur enterprise, ${additionalProjects} proyek, dan ${additionalUsers} pengguna tim. Per pengguna sales, investasinya lebih efisien (Rp ${Math.round(costPerUserDiam / 1000)} rb vs Rp ${Math.round(costPerUserPlat / 1000)} rb).`,
      ctaText: 'Pelajari Paket Diamond'
    };
  }

  // Diamond (sudah di paket tertinggi) -> Tawarkan AI booster bila perlu
  return {
    id: 'hook_diamond_capacity',
    sourcePlan: 'diamond',
    targetPlan: 'diamond',
    headline: 'Kapasitas Penuh Enterprise',
    body: 'Anda memiliki akses penuh ke 100 fitur Developer Sales OS. Butuh percepatan campaign? Top-up AI Booster tersedia tanpa mengubah masa aktif lisensi.',
    ctaText: 'Lihat Top-Up AI'
  };
}
