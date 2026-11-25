import { afterEach, describe, expect, it } from 'bun:test';
import { DUMMY_ACCOUNTS, loginWithServer, verifyMfaWithServer } from '../src/lib/auth/dummy-accounts';
import * as authClient from '../src/lib/auth/dummy-accounts';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mockFetch(status: number, body: unknown) {
  globalThis.fetch = (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

describe('Klien autentikasi (server-only + TOTP 2FA)', () => {
  it('memiliki 9 akun internal unik tanpa kata sandi di bundle frontend', () => {
    expect(DUMMY_ACCOUNTS.length).toBe(9);
    expect(new Set(DUMMY_ACCOUNTS.map((a) => a.role)).size).toBe(9);
    expect(new Set(DUMMY_ACCOUNTS.map((a) => a.email.toLowerCase())).size).toBe(9);
    for (const acc of DUMMY_ACCOUNTS) expect('password' in acc).toBe(false);
  });

  it('tidak menyediakan jalur login/OTP offline di sisi klien', () => {
    for (const name of ['authenticateDummyUser', 'createMfaChallenge', 'verifyMfaChallenge', 'registerDeveloperAccount']) {
      expect(name in authClient).toBe(false);
    }
  });

  it('langsung masuk bila akun belum mengaktifkan TOTP', async () => {
    mockFetch(200, { ok: true, requiresMfa: false, session: { role: 'SE', email: 'a@b.c', name: 'A', token: 't' } });
    const res = await loginWithServer('a@b.c', 'x');
    expect(res.ok && !res.requiresMfa && res.session.token).toBe('t');
  });

  it('meminta kode dan tidak menerbitkan sesi bila TOTP aktif', async () => {
    mockFetch(200, { ok: true, requiresMfa: true, challengeId: 'totp_1', email: 'a@b.c', role: 'SE', name: 'A' });
    const res = await loginWithServer('a@b.c', 'x');
    expect(res.ok && res.requiresMfa && res.challenge.challengeId).toBe('totp_1');
    expect('session' in res).toBe(false);
  });

  it('gagal tertutup saat server tidak terjangkau atau kode ditolak', async () => {
    globalThis.fetch = (async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect((await loginWithServer('a@b.c', 'x')).ok).toBe(false);
    expect((await verifyMfaWithServer('totp_1', '829104')).ok).toBe(false);

    mockFetch(401, { ok: false, error: 'salah' });
    expect((await verifyMfaWithServer('totp_1', '123456')).ok).toBe(false);
  });
});
