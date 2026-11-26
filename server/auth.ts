import crypto from 'node:crypto';
import type http from 'node:http';
import { sql } from './db';
import { USERS_BY_ROLE, type RoleKey } from '../src/data';
import { isExternalPartnerRole, type ExternalPartnerRole } from './partner-access';
import {
  buildOtpAuthUri,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpToken,
} from './totp';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  role: RoleKey;
  tenantId: string;
  projectId: string;
  totpEnabled?: boolean;
  phone?: string | null;
}

interface MfaPending {
  challengeId: string;
  userId: string;
  email: string;
  name: string;
  role: RoleKey;
  tenantId: string;
  projectId: string;
  mfaType: 'TOTP';
  expiresAt: number;
}

const pendingMfa = new Map<string, MfaPending>();

// Batas tebakan kode 2FA dihitung per akun, bukan per challenge, agar login ulang tidak mereset hitungan.
const MAX_2FA_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const twoFactorFailures = new Map<string, { count: number; resetAt: number }>();
const ERROR_2FA_ALREADY_ON = '2FA sudah aktif. Nonaktifkan terlebih dahulu untuk mengganti authenticator.';
const ERROR_2FA_LOCKED = 'Terlalu banyak percobaan kode 2FA. Coba lagi dalam 15 menit.';

function consume2faAttempt(userId: string): boolean {
  const now = Date.now();
  const entry = twoFactorFailures.get(userId);
  if (!entry || entry.resetAt <= now) {
    twoFactorFailures.set(userId, { count: 1, resetAt: now + FAILURE_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_2FA_FAILURES) return false;
  entry.count += 1;
  return true;
}

function clear2faFailures(userId: string): void {
  twoFactorFailures.delete(userId);
}

/** Catat step TOTP secara atomik: dua request paralel dengan kode sama hanya satu yang lolos. */
async function claimTotpStep(userId: string, step: number): Promise<boolean> {
  const rows = await sql`
    UPDATE sales_os.app_users
    SET totp_last_used_step = ${step}, updated_at = NOW()
    WHERE id = ${userId}::uuid
      AND totp_enabled = TRUE
      AND (totp_last_used_step IS NULL OR totp_last_used_step < ${step})
    RETURNING id
  `;
  return rows.length > 0;
}

async function claimRecoveryCode(userId: string, code: string): Promise<boolean> {
  const codeHash = hashRecoveryCode(code);
  const rows = await sql`
    UPDATE sales_os.app_users
    SET recovery_codes_hash = recovery_codes_hash - ${codeHash}::text, updated_at = NOW()
    WHERE id = ${userId}::uuid
      AND totp_enabled = TRUE
      AND jsonb_exists(recovery_codes_hash, ${codeHash}::text)
    RETURNING id
  `;
  return rows.length > 0;
}
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = 'devos_session';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 8) return clean || '+628****0000';
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`;
}

const ROLE_DEFAULT_PASSWORDS: Record<Exclude<RoleKey, ExternalPartnerRole>, string> = {
  SE: process.env.DEVOS_SEED_PASSWORD || 'AndaraSE#2026',
  TL: process.env.DEVOS_SEED_PASSWORD || 'AndaraTL#2026',
  SM: process.env.DEVOS_SEED_PASSWORD || 'AndaraSM#2026',
  DIREKSI: process.env.DEVOS_SEED_PASSWORD || 'AndaraDireksi#2026',
  ADMIN: process.env.DEVOS_SEED_PASSWORD || 'AndaraAdmin#2026',
  IT: process.env.DEVOS_SEED_PASSWORD || 'AndaraIT#2026',
  DIGITAL_MARKETING: process.env.DEVOS_SEED_PASSWORD || 'AndaraMkt#2026',
  SUPERADMIN: process.env.DEVOS_SEED_PASSWORD || 'DevosOwner#2026',
  SUPERADMIN_IT: process.env.DEVOS_SEED_PASSWORD || 'DevosIT#2026',
};

export async function ensureAuthTablesAndSeeds(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.app_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
      project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
      phone TEXT,
      password_hash TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      totp_secret TEXT,
      totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      totp_verified_at TIMESTAMPTZ,
      totp_last_used_step BIGINT,
      recovery_codes_hash JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE sales_os.app_users
      ADD COLUMN IF NOT EXISTS totp_secret TEXT,
      ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS totp_last_used_step BIGINT,
      ADD COLUMN IF NOT EXISTS recovery_codes_hash JSONB NOT NULL DEFAULT '[]'::jsonb
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES sales_os.app_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      user_agent TEXT,
      ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const roles = Object.keys(USERS_BY_ROLE) as RoleKey[];
  for (const roleKey of roles) {
    const profile = USERS_BY_ROLE[roleKey];
    const email = profile.email.trim().toLowerCase();
    // Akun mitra eksternal tidak pernah dibuat dengan password yang tertulis di kode.
    const defaultPass = isExternalPartnerRole(roleKey)
      ? process.env.DEVOS_PARTNER_SEED_PASSWORD
      : ROLE_DEFAULT_PASSWORDS[roleKey];
    if (!defaultPass) continue;
    const existing = await sql`
      SELECT id FROM sales_os.app_users WHERE email = ${email} LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO sales_os.app_users (
          email, name, role, tenant_id, project_id, phone, password_hash, is_active
        ) VALUES (
          ${email}, ${profile.name}, ${roleKey},
          'andara_rejo_makmur', 'the-park-sukoharjo',
          ${profile.noWa || null}, ${hashPassword(defaultPass)}, TRUE
        )
        ON CONFLICT (email) DO NOTHING
      `;
    }
  }
}

async function issueSessionForUser(
  user: AuthenticatedUser,
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<{ token: string; expiresAt: string; user: AuthenticatedUser }> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await sql`
    INSERT INTO sales_os.user_sessions (
      user_id, token_hash, expires_at, user_agent, ip_address
    ) VALUES (
      ${user.userId}::uuid, ${tokenHash}, ${expiresAt.toISOString()}::timestamptz,
      ${meta?.userAgent || null}, ${meta?.ipAddress || null}
    )
  `;

  return { token: rawToken, expiresAt: expiresAt.toISOString(), user };
}

export async function startLogin(
  emailRaw: string,
  password: string,
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<
  | {
      ok: true;
      requiresMfa: false;
      token: string;
      expiresAt: string;
      user: AuthenticatedUser;
    }
  | {
      ok: true;
      requiresMfa: true;
      mfaType: 'TOTP';
      challengeId: string;
      email: string;
      role: RoleKey;
      name: string;
    }
  | { ok: false; error: string }
> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) {
    return { ok: false, error: 'Email dan kata sandi wajib diisi.' };
  }

  const rows = await sql`
    SELECT id, email, name, role, tenant_id, project_id, phone, password_hash, is_active, totp_enabled
    FROM sales_os.app_users
    WHERE email = ${email}
    LIMIT 1
  `;

  const user = rows[0];
  if (!user || !user.is_active || !verifyPassword(password, String(user.password_hash))) {
    return { ok: false, error: 'Email atau kata sandi salah, atau akun dinonaktifkan.' };
  }

  const authedUser: AuthenticatedUser = {
    userId: String(user.id),
    email: String(user.email),
    name: String(user.name),
    role: String(user.role) as RoleKey,
    tenantId: String(user.tenant_id || 'andara_rejo_makmur'),
    projectId: String(user.project_id || 'the-park-sukoharjo'),
    totpEnabled: Boolean(user.totp_enabled),
    phone: user.phone ? String(user.phone) : null,
  };

  // Jika TOTP belum diaktifkan (default mati), langsung terbitkan sesi tanpa verify WA
  if (!user.totp_enabled) {
    const issued = await issueSessionForUser(authedUser, meta);
    return { ok: true, requiresMfa: false, ...issued };
  }

  for (const [id, pending] of pendingMfa) {
    if (pending.expiresAt <= Date.now()) pendingMfa.delete(id);
  }

  const challengeId = `totp_${crypto.randomBytes(12).toString('hex')}`;
  pendingMfa.set(challengeId, {
    challengeId,
    userId: authedUser.userId,
    email: authedUser.email,
    name: authedUser.name,
    role: authedUser.role,
    tenantId: authedUser.tenantId,
    projectId: authedUser.projectId,
    mfaType: 'TOTP',
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return {
    ok: true,
    requiresMfa: true,
    mfaType: 'TOTP',
    challengeId,
    email: authedUser.email,
    role: authedUser.role,
    name: authedUser.name,
  };
}

export async function registerUserAccount(
  params: {
    name: string;
    email: string;
    phone: string;
    password: string;
    companyName?: string;
  },
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<
  | { ok: true; requiresMfa: false; token: string; expiresAt: string; user: AuthenticatedUser }
  | { ok: false; error: string }
> {
  const email = params.email.trim().toLowerCase();
  if (!email || !params.password || params.password.length < 6) {
    return { ok: false, error: 'Email wajib diisi dan kata sandi minimal 6 karakter.' };
  }

  const existing = await sql`SELECT id FROM sales_os.app_users WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) {
    return { ok: false, error: 'Email sudah terdaftar. Silakan masuk.' };
  }

  const tenantSlug = (params.companyName || 'developer_baru')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'developer_baru';

  const inserted = await sql`
    INSERT INTO sales_os.app_users (
      email, name, role, tenant_id, project_id, phone, password_hash, is_active, totp_enabled
    ) VALUES (
      ${email}, ${params.name.trim() || 'Direksi'}, 'DIREKSI',
      ${tenantSlug}, 'the-park-sukoharjo', ${params.phone.trim() || null},
      ${hashPassword(params.password)}, TRUE, FALSE
    )
    RETURNING id, email, name, role, tenant_id, project_id, phone, totp_enabled
  `;

  const user = inserted[0];
  const issued = await issueSessionForUser(
    {
      userId: String(user.id),
      email: String(user.email),
      name: String(user.name),
      role: 'DIREKSI',
      tenantId: String(user.tenant_id),
      projectId: String(user.project_id),
      totpEnabled: false,
      phone: user.phone ? String(user.phone) : null,
    },
    meta
  );

  return { ok: true, requiresMfa: false, ...issued };
}

export async function verifyMfaAndCreateSession(
  challengeId: string,
  inputCode: string,
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<
  | { ok: true; token: string; user: AuthenticatedUser; expiresAt: string }
  | { ok: false; error: string }
> {
  const challenge = pendingMfa.get(challengeId);
  if (!challenge) {
    return { ok: false, error: 'Sesi verifikasi 2FA telah kedaluwarsa. Silakan login kembali.' };
  }
  if (Date.now() > challenge.expiresAt) {
    pendingMfa.delete(challengeId);
    return { ok: false, error: 'Sesi verifikasi 2FA telah kedaluwarsa.' };
  }

  if (!consume2faAttempt(challenge.userId)) {
    pendingMfa.delete(challengeId);
    return { ok: false, error: ERROR_2FA_LOCKED };
  }

  const rows = await sql`
    SELECT totp_secret, totp_enabled, totp_last_used_step, phone
    FROM sales_os.app_users
    WHERE id = ${challenge.userId}::uuid
      AND is_active = TRUE
    LIMIT 1
  `;
  const dbUser = rows[0];
  if (!dbUser || !dbUser.totp_enabled || !dbUser.totp_secret) {
    return { ok: false, error: 'Konfigurasi TOTP tidak ditemukan.' };
  }

  const cleanCode = inputCode.trim();
  const totpCheck = verifyTotpToken(
    String(dbUser.totp_secret),
    cleanCode,
    dbUser.totp_last_used_step ? Number(dbUser.totp_last_used_step) : null
  );

  const accepted =
    totpCheck.valid && totpCheck.matchedStep !== undefined
      ? await claimTotpStep(challenge.userId, totpCheck.matchedStep)
      : await claimRecoveryCode(challenge.userId, cleanCode);
  if (!accepted) {
    return { ok: false, error: 'Kode Authenticator 6-digit (atau recovery code) salah atau sudah terpakai.' };
  }

  clear2faFailures(challenge.userId);
  pendingMfa.delete(challengeId);
  const issued = await issueSessionForUser(
    {
      userId: challenge.userId,
      email: challenge.email,
      name: challenge.name,
      role: challenge.role,
      tenantId: challenge.tenantId,
      projectId: challenge.projectId,
      totpEnabled: true,
      phone: dbUser.phone ? String(dbUser.phone) : null,
    },
    meta
  );

  return { ok: true, ...issued };
}

export function extractSessionToken(req: http.IncomingMessage): string | null {
  const authHeader = String(req.headers['authorization'] || '').trim();
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = String(req.headers['cookie'] || '');
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      if (k === SESSION_COOKIE_NAME && v) {
        return decodeURIComponent(v);
      }
    }
  }
  return null;
}

export async function authenticateRequest(req: http.IncomingMessage): Promise<AuthenticatedUser | null> {
  const token = extractSessionToken(req);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const rows = await sql`
    SELECT u.id AS user_id, u.email, u.name, u.role, u.tenant_id, u.project_id, u.totp_enabled, u.phone
    FROM sales_os.user_sessions s
    JOIN sales_os.app_users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
      AND u.is_active = TRUE
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    userId: String(row.user_id),
    email: String(row.email),
    name: String(row.name),
    role: String(row.role) as RoleKey,
    tenantId: String(row.tenant_id || 'andara_rejo_makmur'),
    projectId: String(row.project_id || 'the-park-sukoharjo'),
    totpEnabled: Boolean(row.totp_enabled),
    phone: row.phone ? String(row.phone) : null,
  };
}

export async function getUserProfile(userId: string) {
  const rows = await sql`
    SELECT id, email, name, role, tenant_id, project_id, phone, totp_enabled, totp_verified_at
    FROM sales_os.app_users
    WHERE id = ${userId}::uuid
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: String(row.role),
    tenantId: String(row.tenant_id),
    projectId: String(row.project_id),
    phone: row.phone ? String(row.phone) : '',
    totpEnabled: Boolean(row.totp_enabled),
    totpVerifiedAt: row.totp_verified_at || null,
  };
}

export async function updateUserProfile(userId: string, params: { name?: string; phone?: string }) {
  const rows = await sql`
    UPDATE sales_os.app_users
    SET name = COALESCE(${params.name?.trim() || null}, name),
        phone = COALESCE(${params.phone?.trim() ?? null}, phone),
        updated_at = NOW()
    WHERE id = ${userId}::uuid
    RETURNING id, email, name, role, tenant_id, project_id, phone, totp_enabled, totp_verified_at
  `;
  return rows[0] || null;
}

export async function setupUserTotp(userId: string) {
  const rows = await sql`
    SELECT email, totp_enabled FROM sales_os.app_users WHERE id = ${userId}::uuid LIMIT 1
  `;
  if (rows.length === 0) return { ok: false as const, error: 'Akun tidak ditemukan.' };
  const secret = generateTotpSecret();
  // Secret aktif tidak boleh ditimpa dari sesi yang sedang login; pengguna harus menonaktifkan 2FA dulu.
  const updated = await sql`
    UPDATE sales_os.app_users
    SET totp_secret = ${secret}, updated_at = NOW()
    WHERE id = ${userId}::uuid AND totp_enabled = FALSE
    RETURNING id
  `;
  if (updated.length === 0) {
    return { ok: false as const, error: ERROR_2FA_ALREADY_ON };
  }
  const otpauthUri = buildOtpAuthUri({
    email: String(rows[0].email),
    secret,
  });
  return { ok: true as const, secret, otpauthUri };
}

export async function enableUserTotp(userId: string, code: string) {
  const rows = await sql`
    SELECT totp_secret, totp_enabled FROM sales_os.app_users WHERE id = ${userId}::uuid LIMIT 1
  `;
  if (rows[0]?.totp_enabled) {
    return { ok: false as const, error: ERROR_2FA_ALREADY_ON };
  }
  const secret = rows[0]?.totp_secret ? String(rows[0].totp_secret) : '';
  if (!secret) {
    return { ok: false as const, error: 'Silakan generate QR TOTP terlebih dahulu.' };
  }
  if (!consume2faAttempt(userId)) {
    return { ok: false as const, error: ERROR_2FA_LOCKED };
  }
  const check = verifyTotpToken(secret, code);
  if (!check.valid) {
    return { ok: false as const, error: 'Kode 6-digit dari Google Authenticator salah.' };
  }
  const recovery = generateRecoveryCodes(6);
  const enabled = await sql`
    UPDATE sales_os.app_users
    SET totp_enabled = TRUE,
        totp_verified_at = NOW(),
        totp_last_used_step = ${check.matchedStep ?? null},
        recovery_codes_hash = ${sql.json(recovery.hashes)},
        updated_at = NOW()
    WHERE id = ${userId}::uuid AND totp_enabled = FALSE AND totp_secret = ${secret}
    RETURNING id
  `;
  if (enabled.length === 0) {
    return { ok: false as const, error: 'Pengaturan 2FA berubah. Muat ulang halaman lalu coba lagi.' };
  }
  clear2faFailures(userId);
  return { ok: true as const, recoveryCodes: recovery.plain };
}

export async function disableUserTotp(userId: string, codeOrPassword: string) {
  const rows = await sql`
    SELECT totp_secret, totp_enabled, totp_last_used_step, password_hash
    FROM sales_os.app_users
    WHERE id = ${userId}::uuid
    LIMIT 1
  `;
  const user = rows[0];
  if (!user || !user.totp_enabled) {
    return { ok: false as const, error: 'TOTP belum aktif pada akun ini.' };
  }
  if (!consume2faAttempt(userId)) {
    return { ok: false as const, error: ERROR_2FA_LOCKED };
  }
  const totpOk =
    user.totp_secret &&
    verifyTotpToken(
      String(user.totp_secret),
      codeOrPassword,
      user.totp_last_used_step ? Number(user.totp_last_used_step) : null
    ).valid;
  const passOk = verifyPassword(codeOrPassword, String(user.password_hash));
  if (!totpOk && !passOk) {
    return { ok: false as const, error: 'Masukkan kode 6-digit Authenticator atau kata sandi akun yang benar.' };
  }
  await sql`
    UPDATE sales_os.app_users
    SET totp_enabled = FALSE,
        totp_secret = NULL,
        totp_verified_at = NULL,
        totp_last_used_step = NULL,
        recovery_codes_hash = '[]'::jsonb,
        updated_at = NOW()
    WHERE id = ${userId}::uuid
  `;
  clear2faFailures(userId);
  return { ok: true as const };
}

export async function revokeSession(req: http.IncomingMessage): Promise<void> {
  const token = extractSessionToken(req);
  if (!token) return;
  await sql`
    UPDATE sales_os.user_sessions
    SET revoked_at = NOW()
    WHERE token_hash = ${hashToken(token)}
      AND revoked_at IS NULL
  `;
}

export function buildSessionCookieHeader(token: string, maxAgeSeconds = 7 * 24 * 3600): string {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secureFlag}`;
}

export function buildClearSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export const BASIC_ORG_ROLES = [
  'IT',
  'SM',
  'SE',
  'DIREKSI',
  'ADMIN',
  'TL',
] as const;

export type BasicOrgRole = (typeof BASIC_ORG_ROLES)[number];

export async function listTenantUsers(tenantId: string) {
  const rows = await sql`
    SELECT id, email, name, role, tenant_id, project_id, phone, is_active, totp_enabled, created_at
    FROM sales_os.app_users
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
  `;
  return rows.map((r: any) => ({
    id: String(r.id),
    email: String(r.email),
    name: String(r.name),
    role: String(r.role),
    tenantId: String(r.tenant_id),
    projectId: String(r.project_id),
    phone: r.phone ? String(r.phone) : null,
    isActive: Boolean(r.is_active),
    totpEnabled: Boolean(r.totp_enabled),
    createdAt: r.created_at,
  }));
}

export async function createTenantUser(
  actor: AuthenticatedUser,
  params: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    password: string;
    projectId?: string;
  }
) {
  if (!['ADMIN', 'SM', 'DIREKSI', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(actor.role)) {
    return { ok: false as const, error: 'Hanya role Admin dan Sales Manager yang berhak menambahkan user baru.' };
  }
  const role = String(params.role || '').trim().toUpperCase();
  if (!BASIC_ORG_ROLES.includes(role as BasicOrgRole)) {
    return {
      ok: false as const,
      error: `Role harus salah satu dari 6 role dasar: ${BASIC_ORG_ROLES.join(', ')}.`,
    };
  }
  const name = String(params.name || '').trim();
  const email = String(params.email || '').trim().toLowerCase();
  const password = String(params.password || '');
  if (!name || !email || !email.includes('@')) {
    return { ok: false as const, error: 'Nama lengkap dan email valid wajib diisi.' };
  }
  if (password.length < 8) {
    return { ok: false as const, error: 'Kata sandi awal minimal 8 karakter.' };
  }

  const existing = await sql`SELECT id FROM sales_os.app_users WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) {
    return { ok: false as const, error: 'Email tersebut sudah terdaftar di platform.' };
  }

  const passwordHash = hashPassword(password);
  const projectId = String(params.projectId || actor.projectId || 'the-park-sukoharjo').trim();
  const inserted = await sql`
    INSERT INTO sales_os.app_users (
      email, name, role, tenant_id, project_id, phone, password_hash, is_active
    ) VALUES (
      ${email}, ${name}, ${role}, ${actor.tenantId}, ${projectId},
      ${params.phone?.trim() || null}, ${passwordHash}, TRUE
    )
    RETURNING id, email, name, role, tenant_id, project_id, phone, is_active, totp_enabled, created_at
  `;
  const row = inserted[0];
  return {
    ok: true as const,
    user: {
      id: String(row.id),
      email: String(row.email),
      name: String(row.name),
      role: String(row.role),
      tenantId: String(row.tenant_id),
      projectId: String(row.project_id),
      phone: row.phone ? String(row.phone) : null,
      isActive: Boolean(row.is_active),
      totpEnabled: Boolean(row.totp_enabled),
      createdAt: row.created_at,
    },
  };
}

export async function updateTenantUserStatus(
  actor: AuthenticatedUser,
  targetUserId: string,
  isActive: boolean
) {
  return updateTenantUser(actor, targetUserId, { isActive });
}

export async function updateTenantUser(
  actor: AuthenticatedUser,
  targetUserId: string,
  params: {
    name?: string;
    email?: string;
    phone?: string | null;
    role?: string;
    projectId?: string;
    isActive?: boolean;
    password?: string;
  }
) {
  if (!['ADMIN', 'SM', 'DIREKSI', 'IT', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(actor.role)) {
    return { ok: false as const, error: 'Tidak memiliki akses mengubah data user.' };
  }
  if (actor.userId && actor.userId === targetUserId && params.isActive === false) {
    return { ok: false as const, error: 'Tidak dapat menonaktifkan akun Anda sendiri.' };
  }

  const existingRows = await sql`
    SELECT id, email, role
    FROM sales_os.app_users
    WHERE id = ${targetUserId}::uuid AND tenant_id = ${actor.tenantId}
    LIMIT 1
  `;
  if (existingRows.length === 0) {
    return { ok: false as const, error: 'User tidak ditemukan pada organisasi Anda.' };
  }
  const targetRoleExisting = String(existingRows[0].role || '');
  if (['SUPERADMIN', 'SUPERADMIN_IT'].includes(targetRoleExisting) && !['SUPERADMIN', 'SUPERADMIN_IT'].includes(actor.role)) {
    return { ok: false as const, error: 'Akun Superadmin platform tidak dapat diubah oleh role ini.' };
  }

  let nextRole: string | null = null;
  if (params.role !== undefined && params.role.trim() !== '') {
    const candidateRole = params.role.trim().toUpperCase();
    if (!BASIC_ORG_ROLES.includes(candidateRole as BasicOrgRole)) {
      return {
        ok: false as const,
        error: `Role harus salah satu dari 6 role dasar: ${BASIC_ORG_ROLES.join(', ')}.`,
      };
    }
    nextRole = candidateRole;
  }

  let nextEmail: string | null = null;
  if (params.email !== undefined && params.email.trim() !== '') {
    const candidateEmail = params.email.trim().toLowerCase();
    if (!candidateEmail.includes('@')) {
      return { ok: false as const, error: 'Format email tidak valid.' };
    }
    if (candidateEmail !== String(existingRows[0].email).toLowerCase()) {
      const dup = await sql`SELECT id FROM sales_os.app_users WHERE email = ${candidateEmail} AND id <> ${targetUserId}::uuid LIMIT 1`;
      if (dup.length > 0) {
        return { ok: false as const, error: 'Email tersebut sudah digunakan akun lain.' };
      }
    }
    nextEmail = candidateEmail;
  }

  let nextPasswordHash: string | null = null;
  if (params.password !== undefined && params.password !== '') {
    if (params.password.length < 8) {
      return { ok: false as const, error: 'Kata sandi baru minimal 8 karakter.' };
    }
    nextPasswordHash = hashPassword(params.password);
  }

  const nextName = params.name !== undefined && params.name.trim() !== '' ? params.name.trim() : null;
  const nextPhone = params.phone !== undefined ? (params.phone?.trim() || null) : undefined;
  const nextProjectId = params.projectId !== undefined && params.projectId.trim() !== '' ? params.projectId.trim() : null;
  const nextIsActive = params.isActive !== undefined ? Boolean(params.isActive) : null;

  const updated = await sql`
    UPDATE sales_os.app_users
    SET
      name = COALESCE(${nextName}, name),
      email = COALESCE(${nextEmail}, email),
      phone = ${nextPhone === undefined ? sql`phone` : nextPhone},
      role = COALESCE(${nextRole}, role),
      project_id = COALESCE(${nextProjectId}, project_id),
      is_active = COALESCE(${nextIsActive}, is_active),
      password_hash = COALESCE(${nextPasswordHash}, password_hash),
      updated_at = NOW()
    WHERE id = ${targetUserId}::uuid
      AND tenant_id = ${actor.tenantId}
    RETURNING id, email, name, role, tenant_id, project_id, phone, is_active, totp_enabled, created_at
  `;

  if (updated.length === 0) {
    return { ok: false as const, error: 'User tidak ditemukan pada organisasi Anda.' };
  }
  const row = updated[0];
  return {
    ok: true as const,
    id: String(row.id),
    isActive: Boolean(row.is_active),
    user: {
      id: String(row.id),
      email: String(row.email),
      name: String(row.name),
      role: String(row.role),
      tenantId: String(row.tenant_id),
      projectId: String(row.project_id),
      phone: row.phone ? String(row.phone) : null,
      isActive: Boolean(row.is_active),
      totpEnabled: Boolean(row.totp_enabled),
      createdAt: row.created_at,
    },
  };
}

export async function deleteTenantUser(actor: AuthenticatedUser, targetUserId: string) {
  if (!['ADMIN', 'SM', 'DIREKSI', 'IT', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(actor.role)) {
    return { ok: false as const, error: 'Tidak memiliki akses menghapus user.' };
  }
  if (actor.userId && actor.userId === targetUserId) {
    return { ok: false as const, error: 'Tidak dapat menghapus akun Anda sendiri.' };
  }
  const existingRows = await sql`
    SELECT id, role FROM sales_os.app_users
    WHERE id = ${targetUserId}::uuid AND tenant_id = ${actor.tenantId}
    LIMIT 1
  `;
  if (existingRows.length === 0) {
    return { ok: false as const, error: 'User tidak ditemukan pada organisasi Anda.' };
  }
  if (['SUPERADMIN', 'SUPERADMIN_IT'].includes(String(existingRows[0].role || ''))) {
    return { ok: false as const, error: 'Akun Superadmin platform tidak dapat dihapus.' };
  }
  await sql`
    DELETE FROM sales_os.app_users
    WHERE id = ${targetUserId}::uuid AND tenant_id = ${actor.tenantId}
  `;
  return { ok: true as const, id: targetUserId };
}
