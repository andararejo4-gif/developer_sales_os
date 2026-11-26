import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import * as realDb from '../server/db';
import { computeTotpCode, generateTotpSecret, hashRecoveryCode } from '../server/totp';

// DB tiruan: menguji keputusan auth.ts, bukan kebenaran sintaks SQL di PostgreSQL.
const originalDb = { ...realDb };
const state: { user: Record<string, any>; sessions: number } = { user: {}, sessions: 0 };

function fakeSql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
  const q = strings.join('?').replace(/\s+/g, ' ').trim();
  const u = state.user;
  const hit = (apply: () => void) => {
    apply();
    return [{ id: u.id }];
  };
  let rows: any[] = [];
  if (q.startsWith('INSERT INTO sales_os.user_sessions')) state.sessions += 1;
  else if (q.startsWith('SELECT')) rows = [{ ...u }];
  else if (q.includes('recovery_codes_hash = recovery_codes_hash -')) {
    if (u.totp_enabled && u.recovery_codes_hash.includes(values[0]))
      rows = hit(() => (u.recovery_codes_hash = u.recovery_codes_hash.filter((h: string) => h !== values[0])));
  } else if (q.includes('SET totp_last_used_step')) {
    if (u.totp_enabled && (u.totp_last_used_step === null || u.totp_last_used_step < values[0]))
      rows = hit(() => (u.totp_last_used_step = values[0]));
  } else if (q.includes('SET totp_secret = ?')) {
    if (!u.totp_enabled) rows = hit(() => (u.totp_secret = values[0]));
  } else if (q.includes('SET totp_enabled = TRUE')) {
    if (!u.totp_enabled && u.totp_secret === values[3])
      rows = hit(() => Object.assign(u, { totp_enabled: true, totp_last_used_step: values[0], recovery_codes_hash: values[1] }));
  } else if (q.includes('SET totp_enabled = FALSE'))
    Object.assign(u, { totp_enabled: false, totp_secret: null, totp_last_used_step: null, recovery_codes_hash: [] });
  else throw new Error(`Query belum dikenali: ${q}`);
  return Promise.resolve(rows);
}
mock.module('../server/db', () => ({ sql: Object.assign(fakeSql, { json: (v: unknown) => v }) }));
const auth = await import('../server/auth');
afterAll(() => {
  mock.module('../server/db', () => originalDb);
});

const PASSWORD = 'Rahasia#1';
const nowStep = () => Math.floor(Date.now() / 1000 / 30);
let seq = 0;

beforeEach(() => {
  seq += 1;
  state.sessions = 0;
  state.user = {
    id: `user-${seq}`, email: 'se@uji.id', name: 'SE Uji', role: 'SE', tenant_id: 't', project_id: 'p', phone: null,
    is_active: true, password_hash: auth.hashPassword(PASSWORD),
    totp_secret: null, totp_enabled: false, totp_last_used_step: null, recovery_codes_hash: [],
  };
});

async function enableTotp() {
  const setup = await auth.setupUserTotp(state.user.id);
  if (!setup.ok) throw new Error(setup.error);
  const enabled = await auth.enableUserTotp(state.user.id, computeTotpCode(setup.secret, nowStep()));
  if (!enabled.ok) throw new Error(enabled.error);
  return { secret: setup.secret, codes: enabled.recoveryCodes };
}

async function challenge() {
  const res = await auth.startLogin(state.user.email, PASSWORD);
  if (!res.ok || !res.requiresMfa) throw new Error('challenge TOTP tidak terbit');
  return res.challengeId;
}

describe('Alur login 2FA server', () => {
  it('tanpa TOTP langsung masuk; password salah ditolak', async () => {
    const res = await auth.startLogin(state.user.email, PASSWORD);
    expect(res.ok && !res.requiresMfa && res.token.length).toBe(64);
    expect((await auth.startLogin(state.user.email, 'salah')).ok).toBe(false);
    expect(state.sessions).toBe(1);
  });

  it('TOTP aktif: password saja tidak menerbitkan sesi, kode valid menerbitkan', async () => {
    const { secret } = await enableTotp();
    const id = await challenge();
    expect(state.sessions).toBe(0);
    state.user.totp_last_used_step = null;
    const code = computeTotpCode(secret, nowStep());
    expect((await auth.verifyMfaAndCreateSession(id, code)).ok).toBe(true);
    expect((await auth.verifyMfaAndCreateSession(await challenge(), code)).ok).toBe(false);
    expect(state.sessions).toBe(1);
  });

  it('kode bypass lama ditolak', async () => {
    await enableTotp();
    const id = await challenge();
    for (const code of ['829104', '123456']) expect((await auth.verifyMfaAndCreateSession(id, code)).ok).toBe(false);
    expect(state.sessions).toBe(0);
  });

  it('recovery code hanya berlaku sekali', async () => {
    const { codes } = await enableTotp();
    expect(state.user.recovery_codes_hash).toContain(hashRecoveryCode(codes[0]));
    expect((await auth.verifyMfaAndCreateSession(await challenge(), codes[0])).ok).toBe(true);
    expect((await auth.verifyMfaAndCreateSession(await challenge(), codes[0])).ok).toBe(false);
  });

  it('terkunci setelah 5 kegagalan walau membuat challenge baru', async () => {
    const { codes } = await enableTotp();
    for (let i = 0; i < 5; i++) await auth.verifyMfaAndCreateSession(await challenge(), 'XXXX-XXXX');
    const res = await auth.verifyMfaAndCreateSession(await challenge(), codes[0]);
    expect(!res.ok && res.error).toContain('Terlalu banyak percobaan');
    expect(state.sessions).toBe(0);
  });

  it('secret aktif tidak bisa ditimpa; nonaktif butuh password/kode benar', async () => {
    const { secret } = await enableTotp();
    expect((await auth.setupUserTotp(state.user.id)).ok).toBe(false);
    expect((await auth.enableUserTotp(state.user.id, computeTotpCode(generateTotpSecret(), nowStep()))).ok).toBe(false);
    expect(state.user.totp_secret).toBe(secret);
    expect((await auth.disableUserTotp(state.user.id, 'salah')).ok).toBe(false);
    expect((await auth.disableUserTotp(state.user.id, PASSWORD)).ok).toBe(true);
    expect(state.user.totp_enabled).toBe(false);
  });
});
