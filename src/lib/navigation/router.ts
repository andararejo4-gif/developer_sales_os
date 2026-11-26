export type DashboardView =
  | 'dashboard'
  | 'pipeline'
  | 'jalur'
  | 'riset'
  | 'target'
  | 'kalender'
  | 'playbook'
  | 'rute'
  | 'lapangan'
  | 'website'
  | 'crm'
  | 'komisi'
  | 'kb'
  | 'surat_cinta'
  | 'unit_park'
  | 'kinerja_se'
  | 'profile'
  | 'vault'
  | 'referral'
  | 'garansi'
  | 'kpr_bank'
  | 'control_tower'
  | 'org_users';

export const VIEW_PATHS: Record<DashboardView, string> = {
  dashboard: '/dashboard',
  pipeline: '/pipeline',
  jalur: '/jalur-proyek',
  riset: '/riset-pasar',
  target: '/target-penjualan',
  kalender: '/kalender-konten',
  playbook: '/playbook',
  rute: '/rute-harian',
  lapangan: '/lapangan',
  website: '/website-proyek',
  crm: '/crm',
  komisi: '/komisi',
  kb: '/knowledge-base',
  surat_cinta: '/surat-cinta',
  unit_park: '/unit-park',
  kinerja_se: '/kinerja-se',
  profile: '/profil',
  vault: '/dokumen-vault',
  referral: '/program-referral',
  garansi: '/keluhan-garansi',
  kpr_bank: '/alur-kpr-bank',
  control_tower: '/control-tower',
  org_users: '/kelola-user',
};

const PATH_TO_VIEW: Record<string, DashboardView> = Object.entries(VIEW_PATHS).reduce(
  (acc, [view, path]) => {
    acc[path] = view as DashboardView;
    return acc;
  },
  {} as Record<string, DashboardView>
);

export function getViewFromPathname(pathname: string): DashboardView {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/') return 'dashboard';
  return PATH_TO_VIEW[normalized] ?? 'dashboard';
}

export function getPathnameForView(view: DashboardView): string {
  return VIEW_PATHS[view] ?? '/dashboard';
}

export function navigateToView(view: DashboardView, tab?: string): void {
  if (typeof window === 'undefined') return;
  const targetPath = getPathnameForView(view);
  const url = new URL(window.location.href);
  url.pathname = targetPath;
  if (tab) {
    url.searchParams.set('tab', tab);
  } else {
    url.searchParams.delete('tab');
  }
  window.history.pushState({ view, tab: tab ?? null }, '', url.toString());
}

export function getQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export function setQueryParam(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(window.history.state, '', url.toString());
}

export function loadPersistedState<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function savePersistedState<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* abaikan jika storage penuh atau tidak tersedia */
  }
}
