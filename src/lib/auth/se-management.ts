/**
 * Data Store & State Management untuk Tim SE Inhouse & Kuesioner Developer
 * Sesuai kebutuhan operasional SM, Admin Sales, dan Onboarding Mandiri Karyawan
 */

import { loadPersistedState, savePersistedState } from '../navigation/router';
import { type SePerformance, SE_TEAM_DATA } from '../../data';
import { registerDeveloperAccount } from './dummy-accounts';

export interface DeveloperOnboardingProfile {
  companyName: string;
  applicantName: string;
  applicantRole: 'SM' | 'ADMIN' | 'IT' | 'DIREKSI';
  directorName: string;
  email: string;
  phone: string;
  // Kuesioner struktur organisasi developer:
  hasInternalSales: boolean;
  seCountEstimate: number;
  hasMarketingTeam: boolean;
  useExternalBrokers: boolean;
  activeProjectsCount: number;
  selectedPlan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  registeredAt: string;
}

export const ONBOARDING_PROFILE_KEY = 'devos_onboarding_profile_v1';
export const SE_INHOUSE_LIST_KEY = 'devos_se_inhouse_list_v1';

let inMemorySeLists: Record<string, SePerformance[]> = {};
let inMemoryOnboardingProfile: DeveloperOnboardingProfile | null = null;

export function loadOnboardingProfile(): DeveloperOnboardingProfile | null {
  if (inMemoryOnboardingProfile) return inMemoryOnboardingProfile;
  return loadPersistedState<DeveloperOnboardingProfile | null>(ONBOARDING_PROFILE_KEY, null);
}

export function saveOnboardingProfile(profile: DeveloperOnboardingProfile): void {
  inMemoryOnboardingProfile = profile;
  savePersistedState(ONBOARDING_PROFILE_KEY, profile);
}

export function loadSeTeamList(projectId = 'the-park-sukoharjo'): SePerformance[] {
  if (inMemorySeLists[projectId]) return inMemorySeLists[projectId];
  const persisted = loadPersistedState<SePerformance[] | null>(`${SE_INHOUSE_LIST_KEY}_${projectId}`, null);
  if (persisted && Array.isArray(persisted) && persisted.length > 0) {
    inMemorySeLists[projectId] = persisted;
    return persisted;
  }
  return SE_TEAM_DATA;
}

export function saveSeTeamList(list: SePerformance[], projectId = 'the-park-sukoharjo'): void {
  inMemorySeLists[projectId] = list;
  savePersistedState(`${SE_INHOUSE_LIST_KEY}_${projectId}`, list);
}

export interface AddSeParams {
  nama: string;
  email: string;
  noWa: string;
  password?: string;
  zonaHariIni: string;
  targetNetSales: number;
  projectId?: string;
}

export function addNewSeInhouse(params: AddSeParams): { ok: boolean; se: SePerformance; error?: string } {
  const normEmail = params.email.trim().toLowerCase();
  if (!params.nama.trim() || !normEmail) {
    return { ok: false, se: {} as SePerformance, error: 'Nama dan email SE wajib diisi.' };
  }

  const existingSe = loadSeTeamList(params.projectId);
  if (existingSe.some((s) => s.noWa === params.noWa.trim())) {
    return { ok: false, se: {} as SePerformance, error: 'Nomor WhatsApp SE ini sudah terdaftar.' };
  }

  const newSeId = `se-${Date.now()}`;
  const newSe: SePerformance = {
    seId: newSeId,
    nama: params.nama.trim(),
    noWa: params.noWa.trim() || '+6281200000000',
    leadBulanIni: 0,
    prospekBulanIni: 0,
    kunjunganBulanIni: 0,
    bookingBulanIni: 0,
    netSalesBulanIni: 0,
    targetNetSales: params.targetNetSales || 2,
    rataResponsMenit: 0,
    leadTerancam72Jam: 0,
    laporanHariIni: 'tepat_waktu',
    scorecardPoin: 100,
    scorecardKategori: 'Tercapai',
    zonaHariIni: params.zonaHariIni.trim() || 'Zona Binaan Baru',
  };

  const updatedList = [newSe, ...existingSe];
  saveSeTeamList(updatedList, params.projectId);

  // Daftarkan akun login pengguna SE
  registerDeveloperAccount({
    companyName: 'PT Developer Inhouse',
    name: params.nama.trim(),
    email: normEmail,
    password: params.password || 'AndaraSE#2026',
    phone: params.noWa.trim(),
    role: 'SE',
  });

  return { ok: true, se: newSe };
}
