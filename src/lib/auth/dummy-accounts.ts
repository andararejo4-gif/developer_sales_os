import { USERS_BY_ROLE, type RoleKey, type UserProfile } from '../../data';

export interface DummyAccount {
  role: RoleKey;
  email: string;
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
/**
 * Daftar akun per role (tanpa kata sandi; autentikasi hanya lewat server).
 * Email diselaraskan dengan USERS_BY_ROLE di src/data.ts.
 */
export const DUMMY_ACCOUNTS: DummyAccount[] = [
  { role: 'SE', email: USERS_BY_ROLE.SE.email, label: 'Sales Executive (SE)', profile: USERS_BY_ROLE.SE },
  { role: 'TL', email: USERS_BY_ROLE.TL.email, label: 'Team Leader (TL)', profile: USERS_BY_ROLE.TL },
  { role: 'SM', email: USERS_BY_ROLE.SM.email, label: 'Sales Manager (SM)', profile: USERS_BY_ROLE.SM },
  { role: 'DIREKSI', email: USERS_BY_ROLE.DIREKSI.email, label: 'Direksi Developer Properti', profile: USERS_BY_ROLE.DIREKSI },
  { role: 'ADMIN', email: USERS_BY_ROLE.ADMIN.email, label: 'Admin Sales Developer', profile: USERS_BY_ROLE.ADMIN },
  { role: 'IT', email: USERS_BY_ROLE.IT.email, label: 'IT & System Developer', profile: USERS_BY_ROLE.IT },
  { role: 'DIGITAL_MARKETING', email: USERS_BY_ROLE.DIGITAL_MARKETING.email, label: 'Digital Marketer', profile: USERS_BY_ROLE.DIGITAL_MARKETING },
  { role: 'SUPERADMIN', email: USERS_BY_ROLE.SUPERADMIN.email, label: 'Direksi Pemilik Developer Sales OS', profile: USERS_BY_ROLE.SUPERADMIN },
  { role: 'SUPERADMIN_IT', email: USERS_BY_ROLE.SUPERADMIN_IT.email, label: 'Tim IT Internal Developer Sales OS', profile: USERS_BY_ROLE.SUPERADMIN_IT },
];

export async function loginWithServer(
  email: string,
  password: string
): Promise<
  | { ok: true; requiresMfa: false; session: AuthSession }
  | { ok: true; requiresMfa: true; challenge: MfaChallenge }
  | { ok: false; error: string; remainingAttempts?: number; maxAttempts?: number; isLastAttempt?: boolean; retryAfterSeconds?: number }
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
      return {
        ok: false,
        error: data.error || 'Gagal masuk. Periksa email dan kata sandi.',
        remainingAttempts: typeof data.remainingAttempts === 'number' ? data.remainingAttempts : undefined,
        maxAttempts: typeof data.maxAttempts === 'number' ? data.maxAttempts : undefined,
        isLastAttempt: Boolean(data.isLastAttempt),
        retryAfterSeconds: typeof data.retryAfterSeconds === 'number' ? data.retryAfterSeconds : undefined,
      };
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
    return { ok: false, error: 'Tidak dapat terhubung ke server autentikasi.' };
  }
}

export async function registerWithServer(data: {
  companyName: string;
  name: string;
  email: string;
  phone: string;
  password: string;
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
    return { ok: false, error: 'Tidak dapat terhubung ke server autentikasi.' };
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
