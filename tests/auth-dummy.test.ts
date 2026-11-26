import { describe, expect, it } from 'bun:test';
import {
  DUMMY_ACCOUNTS,
  authenticateDummyUser,
  registerDeveloperAccount,
  createMfaChallenge,
  verifyMfaChallenge,
} from '../src/lib/auth/dummy-accounts';
import {
  addNewSeInhouse,
  loadSeTeamList,
  saveOnboardingProfile,
  loadOnboardingProfile,
} from '../src/lib/auth/se-management';

describe('Dummy Auth Per Role', () => {
  it('memiliki 11 akun dummy unik untuk seluruh role (7 developer + 2 platform superadmin + 2 mitra eksternal)', () => {
    expect(DUMMY_ACCOUNTS.length).toBe(11);
    const roles = new Set(DUMMY_ACCOUNTS.map((a) => a.role));
    const emails = new Set(DUMMY_ACCOUNTS.map((a) => a.email.toLowerCase()));
    expect(roles.size).toBe(11);
    expect(emails.size).toBe(11);
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

  it('mendukung pendaftaran oleh staf/karyawan (SM/Admin) dan otomatis assign role yang dipilih', () => {
    const smSignup = {
      companyName: 'PT Cipta Graha Mandiri',
      name: 'Fajar SM Operasional',
      email: 'fajar.sm@ciptagraha.com',
      password: 'CiptaGraha#2026',
      phone: '081211112222',
      role: 'SM' as const,
    };

    const res = registerDeveloperAccount(smSignup);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.session.role).toBe('SM');
      expect(res.session.name).toBe('Fajar SM Operasional');
    }

    const loginRes = authenticateDummyUser('fajar.sm@ciptagraha.com', 'CiptaGraha#2026');
    expect(loginRes.ok).toBe(true);
    if (loginRes.ok) {
      expect(loginRes.session.role).toBe('SM');
    }
  });

  describe('Manajemen SE Inhouse oleh SM/Admin & Kuesioner Developer', () => {
    it('berhasil menambahkan SE inhouse baru dan mendaftarkan kredensial login akun SE', () => {
      const addRes = addNewSeInhouse({
        nama: 'Rian Firmansyah',
        email: 'rian.firmansyah@andara.co.id',
        noWa: '081299998888',
        password: 'RianPassword#2026',
        zonaHariIni: 'Zona C Perbankan',
        targetNetSales: 3,
        projectId: 'the-park-sukoharjo',
      });

      expect(addRes.ok).toBe(true);
      expect(addRes.se.nama).toBe('Rian Firmansyah');
      expect(addRes.se.targetNetSales).toBe(3);

      const seList = loadSeTeamList('the-park-sukoharjo');
      expect(seList.some((s) => s.nama === 'Rian Firmansyah')).toBe(true);

      const loginSe = authenticateDummyUser('rian.firmansyah@andara.co.id', 'RianPassword#2026');
      expect(loginSe.ok).toBe(true);
      if (loginSe.ok) {
        expect(loginSe.session.role).toBe('SE');
        expect(loginSe.session.name).toBe('Rian Firmansyah');
      }
    });

    it('berhasil menyimpan profil kuesioner onboarding developer', () => {
      saveOnboardingProfile({
        companyName: 'PT Mitra Megah Perkasa',
        applicantName: 'Deni Sales Manager',
        applicantRole: 'SM',
        directorName: 'Bpk. Hartono',
        email: 'deni@mitramegah.com',
        phone: '081300001111',
        hasInternalSales: true,
        seCountEstimate: 5,
        hasMarketingTeam: true,
        useExternalBrokers: true,
        activeProjectsCount: 2,
        selectedPlan: 'GROWTH',
        registeredAt: new Date().toISOString(),
      });

      const profile = loadOnboardingProfile();
      expect(profile).not.toBeNull();
      expect(profile?.applicantRole).toBe('SM');
      expect(profile?.directorName).toBe('Bpk. Hartono');
      expect(profile?.seCountEstimate).toBe(5);
    });
  });

  describe('Multi-Factor Authentication (MFA) untuk Seluruh Akun', () => {
    it('menghasilkan MFA Challenge dengan nomor telepon tersamarkan untuk seluruh 9 akun role', () => {
      for (const acc of DUMMY_ACCOUNTS) {
        const challenge = createMfaChallenge(acc.email);
        expect(challenge).not.toBeNull();
        if (challenge) {
          expect(challenge.email).toBe(acc.email.toLowerCase());
          expect(challenge.code).toBe('829104');
          expect(challenge.maskedPhone).toContain('****');
          expect(challenge.expiresAt).toBeGreaterThan(Date.now());
          expect(challenge.role).toBe(acc.role);
        }
      }
    });

    it('berhasil memverifikasi OTP resmi (829104) dan menerbitkan sesi dengan mfaVerified: true', () => {
      const direksi = DUMMY_ACCOUNTS.find((a) => a.role === 'DIREKSI')!;
      const challenge = createMfaChallenge(direksi.email)!;
      expect(challenge).not.toBeNull();

      const verifyRes = verifyMfaChallenge(challenge.challengeId, '829104');
      expect(verifyRes.ok).toBe(true);
      if (verifyRes.ok) {
        expect(verifyRes.session.mfaVerified).toBe(true);
        expect(verifyRes.session.mfaMethod).toBe('WHATSAPP_OTP');
        expect(verifyRes.session.role).toBe('DIREKSI');
        expect(verifyRes.session.email).toBe(direksi.email);
      }
    });

    it('berhasil memverifikasi menggunakan master developer OTP bypass (123456)', () => {
      const se = DUMMY_ACCOUNTS.find((a) => a.role === 'SE')!;
      const challenge = createMfaChallenge(se.email)!;
      expect(challenge).not.toBeNull();

      const verifyRes = verifyMfaChallenge(challenge.challengeId, '123456');
      expect(verifyRes.ok).toBe(true);
      if (verifyRes.ok) {
        expect(verifyRes.session.mfaVerified).toBe(true);
        expect(verifyRes.session.role).toBe('SE');
      }
    });

    it('menolak verifikasi jika kode OTP salah', () => {
      const sm = DUMMY_ACCOUNTS.find((a) => a.role === 'SM')!;
      const challenge = createMfaChallenge(sm.email)!;

      const wrongRes = verifyMfaChallenge(challenge.challengeId, '000000');
      expect(wrongRes.ok).toBe(false);
      if (!wrongRes.ok) {
        expect(wrongRes.error).toContain('Kode verifikasi 6-digit salah');
      }
    });

    it('menolak verifikasi jika challenge ID tidak valid atau sudah dipakai', () => {
      const fakeRes = verifyMfaChallenge('invalid_challenge_id', '829104');
      expect(fakeRes.ok).toBe(false);
    });
  });
});
