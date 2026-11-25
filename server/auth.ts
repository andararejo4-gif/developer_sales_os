import crypto from 'node:crypto';
import type http from 'node:http';
import { sql } from './db';
import { USERS_BY_ROLE, type RoleKey } from '../src/data';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  role: RoleKey;
  tenantId: string;
  projectId: string;
}

interface MfaPending {
  challengeId: string;
  userId: string;
  email: string;
  name: string;
  role: RoleKey;
  tenantId: string;
  projectId: string;
  maskedPhone: string;
  code: string;
  expiresAt: number;
}

const pendingMfa = new Map<string, MfaPending>();
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

const ROLE_DEFAULT_PASSWORDS: Record<RoleKey, string> = {
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
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
    const defaultPass = ROLE_DEFAULT_PASSWORDS[roleKey] || 'AndaraOS2026!';
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

export async function startLogin(emailRaw: string, password: string): Promise<
  | { ok: true; challengeId: string; maskedPhone: string; email: string; role: RoleKey; name: string }
  | { ok: false; error: string }
> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) {
    return { ok: false, error: 'Email dan kata sandi wajib diisi.' };
  }

  const rows = await sql`
    SELECT id, email, name, role, tenant_id, project_id, phone, password_hash, is_active
    FROM sales_os.app_users
    WHERE email = ${email}
    LIMIT 1
  `;

  const user = rows[0];
  if (!user || !user.is_active || !verifyPassword(password, String(user.password_hash))) {
    return { ok: false, error: 'Email atau kata sandi salah, atau akun dinonaktifkan.' };
  }

  const challengeId = `mfa_${crypto.randomBytes(12).toString('hex')}`;
  const devOtp = process.env.DEVOS_DEV_OTP || '829104';
  const code = process.env.NODE_ENV === 'production'
    ? String(crypto.randomInt(100000, 999999))
    : devOtp;

  pendingMfa.set(challengeId, {
    challengeId,
    userId: String(user.id),
    email: String(user.email),
    name: String(user.name),
    role: String(user.role) as RoleKey,
    tenantId: String(user.tenant_id || 'andara_rejo_makmur'),
    projectId: String(user.project_id || 'the-park-sukoharjo'),
    maskedPhone: maskPhone(String(user.phone || '')),
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return {
    ok: true,
    challengeId,
    maskedPhone: maskPhone(String(user.phone || '')),
    email: String(user.email),
    role: String(user.role) as RoleKey,
    name: String(user.name),
  };
}

export async function registerUserAccount(params: {
  name: string;
  email: string;
  phone: string;
  password: string;
  companyName?: string;
}): Promise<
  | { ok: true; challengeId: string; maskedPhone: string; email: string; role: RoleKey; name: string }
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
      email, name, role, tenant_id, project_id, phone, password_hash, is_active
    ) VALUES (
      ${email}, ${params.name.trim() || 'Direksi'}, 'DIREKSI',
      ${tenantSlug}, 'the-park-sukoharjo', ${params.phone.trim() || null},
      ${hashPassword(params.password)}, TRUE
    )
    RETURNING id, email, name, role, tenant_id, project_id, phone
  `;

  const user = inserted[0];
  const challengeId = `mfa_${crypto.randomBytes(12).toString('hex')}`;
  const code = process.env.DEVOS_DEV_OTP || '829104';

  pendingMfa.set(challengeId, {
    challengeId,
    userId: String(user.id),
    email: String(user.email),
    name: String(user.name),
    role: 'DIREKSI',
    tenantId: String(user.tenant_id),
    projectId: String(user.project_id),
    maskedPhone: maskPhone(String(user.phone || '')),
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  return {
    ok: true,
    challengeId,
    maskedPhone: maskPhone(String(user.phone || '')),
    email: String(user.email),
    role: 'DIREKSI',
    name: String(user.name),
  };
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
    return { ok: false, error: 'Sesi verifikasi MFA telah kedaluwarsa. Silakan login kembali.' };
  }
  if (Date.now() > challenge.expiresAt) {
    pendingMfa.delete(challengeId);
    return { ok: false, error: 'Kode verifikasi telah kedaluwarsa.' };
  }

  const cleanCode = inputCode.trim();
  const allowDevBypass = process.env.NODE_ENV !== 'production' && cleanCode === '123456';
  if (cleanCode !== challenge.code && !allowDevBypass) {
    return { ok: false, error: 'Kode verifikasi 6-digit salah.' };
  }

  pendingMfa.delete(challengeId);
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await sql`
    INSERT INTO sales_os.user_sessions (
      user_id, token_hash, expires_at, user_agent, ip_address
    ) VALUES (
      ${challenge.userId}::uuid, ${tokenHash}, ${expiresAt.toISOString()}::timestamptz,
      ${meta?.userAgent || null}, ${meta?.ipAddress || null}
    )
  `;

  return {
    ok: true,
    token: rawToken,
    expiresAt: expiresAt.toISOString(),
    user: {
      userId: challenge.userId,
      email: challenge.email,
      name: challenge.name,
      role: challenge.role,
      tenantId: challenge.tenantId,
      projectId: challenge.projectId,
    },
  };
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
    SELECT u.id AS user_id, u.email, u.name, u.role, u.tenant_id, u.project_id
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
  };
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
