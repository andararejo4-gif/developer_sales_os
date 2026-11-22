import { USERS_BY_ROLE, type RoleKey, type UserProfile } from '../../data';

export interface DummyAccount {
  role: RoleKey;
  email: string;
  password: string;
  label: string;
  profile: UserProfile;
}

export interface AuthSession {
  role: RoleKey;
  email: string;
  name: string;
  loggedInAt: string;
}

export const AUTH_STORAGE_KEY = 'devos_auth_session_v1';

/**
 * Kredensial akun dummy per role untuk simulasi login Developer Sales OS.
 * Email diselaraskan dengan USERS_BY_ROLE di src/data.ts.
 */
export const DUMMY_ACCOUNTS: DummyAccount[] = [
  {
    role: 'SE',
    email: USERS_BY_ROLE.SE.email,
    password: 'AndaraSE#2026',
    label: 'Sales Executive (SE)',
    profile: USERS_BY_ROLE.SE,
  },
  {
    role: 'TL',
    email: USERS_BY_ROLE.TL.email,
    password: 'AndaraTL#2026',
    label: 'Team Leader (TL)',
    profile: USERS_BY_ROLE.TL,
  },
  {
    role: 'SM',
    email: USERS_BY_ROLE.SM.email,
    password: 'AndaraSM#2026',
    label: 'Sales Manager (SM)',
    profile: USERS_BY_ROLE.SM,
  },
  {
    role: 'DIREKSI',
    email: USERS_BY_ROLE.DIREKSI.email,
    password: 'AndaraDireksi#2026',
    label: 'Direksi / Owner',
    profile: USERS_BY_ROLE.DIREKSI,
  },
  {
    role: 'ADMIN',
    email: USERS_BY_ROLE.ADMIN.email,
    password: 'AndaraAdmin#2026',
    label: 'Admin Sales',
    profile: USERS_BY_ROLE.ADMIN,
  },
  {
    role: 'IT',
    email: USERS_BY_ROLE.IT.email,
    password: 'AndaraIT#2026',
    label: 'IT & System Lead',
    profile: USERS_BY_ROLE.IT,
  },
  {
    role: 'DIGITAL_MARKETING',
    email: USERS_BY_ROLE.DIGITAL_MARKETING.email,
    password: 'AndaraMkt#2026',
    label: 'Digital Marketer',
    profile: USERS_BY_ROLE.DIGITAL_MARKETING,
  },
];

/**
 * Memvalidasi email & kata sandi terhadap daftar akun dummy per role.
 */
export function authenticateDummyUser(
  email: string,
  password: string
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { ok: false, error: 'Email dan kata sandi wajib diisi.' };
  }

  const account = DUMMY_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === normalizedEmail
  );

  if (!account || account.password !== password) {
    return { ok: false, error: 'Email atau kata sandi tidak sesuai.' };
  }

  return {
    ok: true,
    session: {
      role: account.role,
      email: account.email,
      name: account.profile.name,
      loggedInAt: new Date().toISOString(),
    },
  };
}

export function loadAuthSession(): AuthSession | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.role || !(parsed.role in USERS_BY_ROLE)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* abaikan jika storage tidak tersedia */
  }
}

export function clearAuthSession(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* abaikan jika storage tidak tersedia */
  }
}
