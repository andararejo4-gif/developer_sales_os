import { describe, expect, it } from 'bun:test';
import {
  DUMMY_ACCOUNTS,
  authenticateDummyUser,
} from '../src/lib/auth/dummy-accounts';

describe('Dummy Auth Per Role', () => {
  it('memiliki 7 akun dummy unik untuk seluruh role', () => {
    expect(DUMMY_ACCOUNTS.length).toBe(7);
    const roles = new Set(DUMMY_ACCOUNTS.map((a) => a.role));
    const emails = new Set(DUMMY_ACCOUNTS.map((a) => a.email.toLowerCase()));
    expect(roles.size).toBe(7);
    expect(emails.size).toBe(7);
  });

  it('berhasil login untuk setiap akun dummy dengan kredensial valid', () => {
    for (const acc of DUMMY_ACCOUNTS) {
      const res = authenticateDummyUser(acc.email, acc.password);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.session.role).toBe(acc.role);
        expect(res.session.email).toBe(acc.email);
      }
    }
  });

  it('mendukung email dengan spasi atau huruf kapital campuran', () => {
    const se = DUMMY_ACCOUNTS.find((a) => a.role === 'SE')!;
    const res = authenticateDummyUser(`  ${se.email.toUpperCase()}  `, se.password);
    expect(res.ok).toBe(true);
  });

  it('menolak login jika kata sandi salah atau email tidak terdaftar', () => {
    const se = DUMMY_ACCOUNTS.find((a) => a.role === 'SE')!;
    const wrongPass = authenticateDummyUser(se.email, 'salah123');
    expect(wrongPass.ok).toBe(false);

    const unknownEmail = authenticateDummyUser('tidakada@example.com', se.password);
    expect(unknownEmail.ok).toBe(false);
  });
});
