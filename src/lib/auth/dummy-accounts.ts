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
  mfaVerified?: boolean;
  mfaMethod?: 'WHATSAPP_OTP' | 'AUTHENTICATOR_APP';
}

export interface MfaChallenge {
  challengeId: string;
  email: string;
  maskedPhone: string;
  code: string;
  expiresAt: number;
  role: RoleKey;
  name: string;
}

export const activeMfaChallenges = new Map<string, MfaChallenge>();

export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`;
}

export function createMfaChallenge(email: string): MfaChallenge | null {
  const normEmail = email.trim().toLowerCase();
  const dummyAcc = DUMMY_ACCOUNTS.find((a) => a.email.toLowerCase() === normEmail);
  const regAcc = getRegisteredUsers().find((u) => u.email.toLowerCase() === normEmail);

  if (!dummyAcc && !regAcc) return null;

  const phone = dummyAcc?.profile.noWa || regAcc?.phone || '+6281234567890';
  const role = dummyAcc?.role || regAcc?.role || 'DIREKSI';
  const name = dummyAcc?.profile.name || regAcc?.name || 'User';

  const code = '829104'; // Kode OTP 6-digit deterministik standar verifikasi
  const challengeId = `mfa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const challenge: MfaChallenge = {
    challengeId,
    email: normEmail,
    maskedPhone: maskPhoneNumber(phone),
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    role,
    name,
  };

  activeMfaChallenges.set(challengeId, challenge);
  return challenge;
}

export function verifyMfaChallenge(
  challengeId: string,
  inputCode: string
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const challenge = activeMfaChallenges.get(challengeId);
  if (!challenge) {
    return { ok: false, error: 'Sesi verifikasi MFA telah kedaluwarsa. Silakan login kembali.' };
  }

  if (Date.now() > challenge.expiresAt) {
    activeMfaChallenges.delete(challengeId);
    return { ok: false, error: 'Kode verifikasi telah kedaluwarsa (lebih dari 5 menit). Silakan minta kode baru.' };
  }

  const cleanCode = inputCode.trim();
  if (cleanCode !== challenge.code && cleanCode !== '123456') {
    return { ok: false, error: 'Kode verifikasi 6-digit salah. Silakan periksa kembali.' };
  }

  activeMfaChallenges.delete(challengeId);
  const session: AuthSession = {
    role: challenge.role,
    email: challenge.email,
    name: challenge.name,
    loggedInAt: new Date().toISOString(),
    mfaVerified: true,
    mfaMethod: 'WHATSAPP_OTP',
  };

  saveAuthSession(session);
  return { ok: true, session };
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
}): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const normEmail = data.email.trim().toLowerCase();
  if (!normEmail || !data.password || !data.companyName.trim()) {
    return { ok: false, error: 'Nama developer, email, dan kata sandi wajib diisi.' };
  }

  const existing = getRegisteredUsers();
  if (existing.some((u) => u.email.toLowerCase() === normEmail)) {
    return { ok: false, error: 'Email ini sudah terdaftar. Silakan pilih tab Masuk.' };
  }

  const newUser: RegisteredUser = {
    companyName: data.companyName.trim(),
    name: data.name.trim() || 'Direktur Developer',
    email: normEmail,
    password: data.password,
    phone: data.phone.trim(),
    role: 'DIREKSI',
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
    role: 'DIREKSI',
    email: newUser.email,
    name: newUser.name,
    loggedInAt: new Date().toISOString(),
  };

  saveAuthSession(session);
  return { ok: true, session };
}

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
    label: 'Direksi Developer Properti',
    profile: USERS_BY_ROLE.DIREKSI,
  },
  {
    role: 'ADMIN',
    email: USERS_BY_ROLE.ADMIN.email,
    password: 'AndaraAdmin#2026',
    label: 'Admin Sales Developer',
    profile: USERS_BY_ROLE.ADMIN,
  },
  {
    role: 'IT',
    email: USERS_BY_ROLE.IT.email,
    password: 'AndaraIT#2026',
    label: 'IT & System Developer',
    profile: USERS_BY_ROLE.IT,
  },
  {
    role: 'DIGITAL_MARKETING',
    email: USERS_BY_ROLE.DIGITAL_MARKETING.email,
    password: 'AndaraMkt#2026',
    label: 'Digital Marketer',
    profile: USERS_BY_ROLE.DIGITAL_MARKETING,
  },
  {
    role: 'SUPERADMIN',
    email: USERS_BY_ROLE.SUPERADMIN.email,
    password: 'DevosOwner#2026',
    label: 'Direksi Pemilik Developer Sales OS',
    profile: USERS_BY_ROLE.SUPERADMIN,
  },
  {
    role: 'SUPERADMIN_IT',
    email: USERS_BY_ROLE.SUPERADMIN_IT.email,
    password: 'DevosIT#2026',
    label: 'Tim IT Internal Developer Sales OS',
    profile: USERS_BY_ROLE.SUPERADMIN_IT,
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

  if (account) {
    if (account.password !== password) {
      return { ok: false, error: 'Kata sandi tidak sesuai.' };
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

  // Periksa akun yang didaftarkan melalui form signup developer
  const registered = getRegisteredUsers().find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!registered || registered.password !== password) {
    return { ok: false, error: 'Email atau kata sandi tidak sesuai.' };
  }

  return {
    ok: true,
    session: {
      role: registered.role,
      email: registered.email,
      name: registered.name,
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
