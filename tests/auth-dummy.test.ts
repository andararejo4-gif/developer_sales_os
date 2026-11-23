import { describe, expect, it } from 'bun:test';
import {
  DUMMY_ACCOUNTS,
  authenticateDummyUser,
  registerDeveloperAccount,
} from '../src/lib/auth/dummy-accounts';

describe('Dummy Auth Per Role', () => {
  it('memiliki 9 akun dummy unik untuk seluruh role (7 developer + 2 platform superadmin)', () => {
    expect(DUMMY_ACCOUNTS.length).toBe(9);
    const roles = new Set(DUMMY_ACCOUNTS.map((a) => a.role));
    const emails = new Set(DUMMY_ACCOUNTS.map((a) => a.email.toLowerCase()));
    expect(roles.size).toBe(9);
    expect(emails.size).toBe(9);
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

  it('mendukung pendaftaran developer baru dan login kembali dengan kredensial tersebut', () => {
    const signupData = {
      companyName: 'PT Grand Pesona Mandiri',
      name: 'Bpk. Irfan Hakim',
      email: 'irfan@grandpesona.com',
      password: 'PesonaIndah#2026',
      phone: '081298765432',
    };

    const regRes = registerDeveloperAccount(signupData);
    expect(regRes.ok).toBe(true);
    if (regRes.ok) {
      expect(regRes.session.role).toBe('DIREKSI');
      expect(regRes.session.email).toBe('irfan@grandpesona.com');
      expect(regRes.session.name).toBe('Bpk. Irfan Hakim');
    }

    // Login kembali dengan email & password yang baru didaftarkan
    const loginRes = authenticateDummyUser('irfan@grandpesona.com', 'PesonaIndah#2026');
    expect(loginRes.ok).toBe(true);
    if (loginRes.ok) {
      expect(loginRes.session.role).toBe('DIREKSI');
    }
  });
});
