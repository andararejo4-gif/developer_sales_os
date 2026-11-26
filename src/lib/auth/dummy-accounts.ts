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
  tenantId?: string;
  projectId?: string;
  totpEnabled?: boolean;
  token?: string;
  loggedInAt: string;
  mfaVerified?: boolean;
  mfaMethod?: 'WHATSAPP_OTP' | 'AUTHENTICATOR_APP';
}

export interface MfaChallenge {
  challengeId: string;
  email: string;
  expiresAt: number;
  role: RoleKey;
  name: string;
}

export const AUTH_STORAGE_KEY = 'devos_auth_session_v1';
export const REGISTERED_USERS_KEY = 'devos_registered_users_v1';

export interface RegisteredUser {
  companyName: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: RoleKey;
  registeredAt: string;
}

let inMemoryRegisteredUsers: RegisteredUser[] = [];

export function getRegisteredUsers(): RegisteredUser[] {
  try {
    if (typeof localStorage === 'undefined') return inMemoryRegisteredUsers;
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? (JSON.parse(raw) as RegisteredUser[]) : inMemoryRegisteredUsers;
  } catch {
    return inMemoryRegisteredUsers;
  }
}

export function registerDeveloperAccount(data: {
  companyName: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: RoleKey;
}): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const normEmail = data.email.trim().toLowerCase();
  if (!normEmail || !data.password || !data.companyName.trim()) {
    return { ok: false, error: 'Nama developer, email, dan kata sandi wajib diisi.' };
  }

  const existing = getRegisteredUsers();
  if (existing.some((u) => u.email.toLowerCase() === normEmail)) {
    return { ok: false, error: 'Email ini sudah terdaftar. Silakan pilih tab Masuk.' };
  }

  const assignedRole: RoleKey = data.role || 'DIREKSI';

  const newUser: RegisteredUser = {
    companyName: data.companyName.trim(),
    name: data.name.trim() || 'Direktur Developer',
    email: normEmail,
    password: data.password,
    phone: data.phone.trim(),
    role: assignedRole,
    registeredAt: new Date().toISOString(),
  };

  inMemoryRegisteredUsers = [...existing, newUser];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(inMemoryRegisteredUsers));
    }
  } catch {
    /* abaikan storage error */
  }

  const session: AuthSession = {
    role: assignedRole,
    email: newUser.email,
    name: newUser.name,
    token: 'mock-offline-token',
    loggedInAt: new Date().toISOString(),
  };

  saveAuthSession(session);
  return { ok: true, session };
}

/**
 * Kata sandi default akun dummy untuk pengujian lokal offline.
 */
export const ROLE_DEFAULT_PASSWORDS: Record<RoleKey, string> = {
  SE: 'AndaraSE#2026',
  TL: 'AndaraTL#2026',
  SM: 'AndaraSM#2026',
  DIREKSI: 'AndaraDireksi#2026',
  ADMIN: 'AndaraAdmin#2026',
  IT: 'AndaraIT#2026',
  DIGITAL_MARKETING: 'AndaraMkt#2026',
  SUPERADMIN: 'DevosOwner#2026',
  SUPERADMIN_IT: 'DevosIT#2026',
  REFERRAL_PARTNER: 'MitraReferral#2026',
  SALES_PARTNER: 'MitraSales#2026',
};

/**
 * Kredensial akun dummy per role untuk simulasi login lokal Developer Sales OS.
 * Email diselaraskan dengan USERS_BY_ROLE di src/data.ts.
 */
export const DUMMY_ACCOUNTS: DummyAccount[] = [
  { role: 'SE', email: USERS_BY_ROLE.SE.email, password: ROLE_DEFAULT_PASSWORDS.SE, label: 'Sales Executive (SE)', profile: USERS_BY_ROLE.SE },
  { role: 'TL', email: USERS_BY_ROLE.TL.email, password: ROLE_DEFAULT_PASSWORDS.TL, label: 'Team Leader (TL)', profile: USERS_BY_ROLE.TL },
  { role: 'SM', email: USERS_BY_ROLE.SM.email, password: ROLE_DEFAULT_PASSWORDS.SM, label: 'Sales Manager (SM)', profile: USERS_BY_ROLE.SM },
  { role: 'DIREKSI', email: USERS_BY_ROLE.DIREKSI.email, password: ROLE_DEFAULT_PASSWORDS.DIREKSI, label: 'Direksi Developer Properti', profile: USERS_BY_ROLE.DIREKSI },
  { role: 'ADMIN', email: USERS_BY_ROLE.ADMIN.email, password: ROLE_DEFAULT_PASSWORDS.ADMIN, label: 'Admin Sales Developer', profile: USERS_BY_ROLE.ADMIN },
  { role: 'IT', email: USERS_BY_ROLE.IT.email, password: ROLE_DEFAULT_PASSWORDS.IT, label: 'IT & System Developer', profile: USERS_BY_ROLE.IT },
  { role: 'DIGITAL_MARKETING', email: USERS_BY_ROLE.DIGITAL_MARKETING.email, password: ROLE_DEFAULT_PASSWORDS.DIGITAL_MARKETING, label: 'Digital Marketer', profile: USERS_BY_ROLE.DIGITAL_MARKETING },
  { role: 'SUPERADMIN', email: USERS_BY_ROLE.SUPERADMIN.email, password: ROLE_DEFAULT_PASSWORDS.SUPERADMIN, label: 'Direksi Pemilik Developer Sales OS', profile: USERS_BY_ROLE.SUPERADMIN },
  { role: 'SUPERADMIN_IT', email: USERS_BY_ROLE.SUPERADMIN_IT.email, password: ROLE_DEFAULT_PASSWORDS.SUPERADMIN_IT, label: 'Tim IT Internal Developer Sales OS', profile: USERS_BY_ROLE.SUPERADMIN_IT },
  {
    role: 'SUPERADMIN_IT',
    email: 'kazukirentarou92@gmail.com',
    password: 'Hades9470!',
    label: 'Tim IT Internal Developer Sales OS',
    profile: {
      ...USERS_BY_ROLE.SUPERADMIN_IT,
      name: 'Kazuki Rentarou (IT Internal)',
      email: 'kazukirentarou92@gmail.com',
      avatarText: 'KR',
    },
  },
  { role: 'REFERRAL_PARTNER', email: USERS_BY_ROLE.REFERRAL_PARTNER.email, password: ROLE_DEFAULT_PASSWORDS.REFERRAL_PARTNER, label: 'Referral Partner (Mitra)', profile: USERS_BY_ROLE.REFERRAL_PARTNER },
  { role: 'SALES_PARTNER', email: USERS_BY_ROLE.SALES_PARTNER.email, password: ROLE_DEFAULT_PASSWORDS.SALES_PARTNER, label: 'Sales Partner / Agen', profile: USERS_BY_ROLE.SALES_PARTNER },
];

export function authenticateDummyUser(
  email: string,
  password: string
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const normalizedEmail = email.trim().toLowerCase();

  const dummyMatch = DUMMY_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === normalizedEmail && acc.password === password
  );

  if (dummyMatch) {
    const session: AuthSession = {
      role: dummyMatch.role,
      email: dummyMatch.email,
      name: dummyMatch.profile.name,
      token: 'mock-offline-token',
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(session);
    return { ok: true, session };
  }

  const registeredMatch = getRegisteredUsers().find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (registeredMatch) {
    const session: AuthSession = {
      role: registeredMatch.role,
      email: registeredMatch.email,
      name: registeredMatch.name,
      token: 'mock-offline-token',
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(session);
    return { ok: true, session };
  }

  return {
    ok: false,
    error: 'Email atau kata sandi tidak sesuai. Periksa kembali kredensial Anda.',
  };
}

export async function loginWithServer(
  email: string,
  password: string
): Promise<
  | { ok: true; requiresMfa: false; session: AuthSession }
  | { ok: true; requiresMfa: true; challenge: MfaChallenge }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Gagal masuk. Periksa email dan kata sandi.' };
    }
    if (!data.requiresMfa && data.session) {
      saveAuthSession(data.session as AuthSession);
      return { ok: true, requiresMfa: false, session: data.session as AuthSession };
    }
    return {
      ok: true,
      requiresMfa: true,
      challenge: {
        challengeId: data.challengeId,
        email: data.email,
        expiresAt: Date.now() + 5 * 60 * 1000,
        role: data.role,
        name: data.name,
      },
    };
  } catch {
    // Fallback otomatis ke login lokal offline jika server backend belum berjalan
    const localAuth = authenticateDummyUser(email, password);
    if (!localAuth.ok) {
      return { ok: false, error: localAuth.error };
    }
    return { ok: true, requiresMfa: false, session: localAuth.session };
  }
}

export async function registerWithServer(data: {
  companyName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: RoleKey;
}): Promise<
  | { ok: true; requiresMfa: false; session: AuthSession }
  | { ok: true; requiresMfa: true; challenge: MfaChallenge }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) {
      return { ok: false, error: body.error || 'Pendaftaran gagal.' };
    }
    if (!body.requiresMfa && body.session) {
      saveAuthSession(body.session as AuthSession);
      return { ok: true, requiresMfa: false, session: body.session as AuthSession };
    }
    return {
      ok: true,
      requiresMfa: true,
      challenge: {
        challengeId: body.challengeId,
        email: body.email,
        expiresAt: Date.now() + 5 * 60 * 1000,
        role: body.role,
        name: body.name,
      },
    };
  } catch {
    // Fallback otomatis ke registrasi lokal offline jika server backend belum berjalan
    const localReg = registerDeveloperAccount(data);
    if (!localReg.ok) {
      return { ok: false, error: localReg.error };
    }
    return { ok: true, requiresMfa: false, session: localReg.session };
  }
}

export async function verifyMfaWithServer(
  challengeId: string,
  code: string
): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/auth/verify-mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ challengeId, code }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok || !data.session) {
      return { ok: false, error: data.error || 'Kode verifikasi salah.' };
    }
    saveAuthSession(data.session as AuthSession);
    return { ok: true, session: data.session as AuthSession };
  } catch {
    return { ok: false, error: 'Tidak dapat memverifikasi OTP ke server.' };
  }
}

export async function logoutFromServer(): Promise<void> {
  // Token dibaca interceptor saat fetch dipanggil, jadi sesi lokal boleh langsung dihapus tanpa menunggu server.
  const request = fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  clearAuthSession();
  try {
    await request;
  } catch {
    /* sesi lokal tetap dihapus walau server tidak terjangkau */
  }
}

export function loadAuthSession(): AuthSession | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.role || !(parsed.role in USERS_BY_ROLE) || !parsed?.token) return null;
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

export const IMPERSONATOR_BACKUP_KEY = 'devos_impersonator_backup_v1';
let inMemoryImpersonatorBackup: AuthSession | null = null;

export function saveImpersonatorBackup(session: AuthSession): void {
  inMemoryImpersonatorBackup = session;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(IMPERSONATOR_BACKUP_KEY, JSON.stringify(session));
    }
  } catch {
    /* abaikan */
  }
}

export function loadImpersonatorBackup(): AuthSession | null {
  try {
    if (typeof localStorage === 'undefined') return inMemoryImpersonatorBackup;
    const raw = localStorage.getItem(IMPERSONATOR_BACKUP_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : inMemoryImpersonatorBackup;
  } catch {
    return inMemoryImpersonatorBackup;
  }
}

export function clearImpersonatorBackup(): void {
  inMemoryImpersonatorBackup = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(IMPERSONATOR_BACKUP_KEY);
    }
  } catch {
    /* abaikan */
  }
}

export function isImpersonating(): boolean {
  return loadImpersonatorBackup() !== null;
}
