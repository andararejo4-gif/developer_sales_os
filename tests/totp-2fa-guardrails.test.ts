import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeTotpCode, generateRecoveryCodes, hashRecoveryCode, verifyTotpToken } from '../server/totp';
import { isPartnerRequestAllowed } from '../server/partner-access';

const read = (path: string) => readFileSync(join(import.meta.dir, '..', path), 'utf8');

describe('TOTP RFC 6238', () => {
  // Secret uji RFC 6238 ("12345678901234567890"); RFC memakai 8 digit, aplikasi memakai 6 digit terakhir.
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  it('cocok dengan vektor uji resmi', () => {
    expect(computeTotpCode(secret, Math.floor(59 / 30))).toBe('287082');
    expect(computeTotpCode(secret, Math.floor(1111111109 / 30))).toBe('081804');
    expect(computeTotpCode(secret, Math.floor(2000000000 / 30))).toBe('279037');
  });

  it('menolak kode yang sudah dipakai dan format selain 6 digit', () => {
    const step = Math.floor(Date.now() / 1000 / 30);
    const code = computeTotpCode(secret, step);
    expect(verifyTotpToken(secret, code).valid).toBe(true);
    expect(verifyTotpToken(secret, code, step + 1).valid).toBe(false);
    expect(verifyTotpToken(secret, '12345').valid).toBe(false);
  });

  it('recovery code unik dan hash-nya tidak peka huruf besar/kecil', () => {
    const { plain, hashes } = generateRecoveryCodes(6);
    expect(new Set(plain).size).toBe(6);
    expect(hashRecoveryCode(plain[0].toLowerCase())).toBe(hashes[0]);
  });
});

describe('Pembatasan akun mitra eksternal', () => {
  it('menutup data internal dan endpoint baru secara default', () => {
    for (const role of ['REFERRAL_PARTNER', 'SALES_PARTNER'] as const) {
      for (const path of ['/api/se/field-logs', '/api/company/audit-logs', '/api/wa/status', '/api/endpoint-baru']) {
        expect(isPartnerRequestAllowed(role, path, 'GET')).toBe(false);
      }
      expect(isPartnerRequestAllowed(role, '/api/pipeline/leads/claim', 'POST')).toBe(false);
      expect(isPartnerRequestAllowed(role, '/api/units/transition', 'POST')).toBe(false);
      expect(isPartnerRequestAllowed(role, '/api/profile/totp/setup', 'POST')).toBe(true);
    }
  });

  it('hanya SALES_PARTNER yang dapat membuka pipeline; role internal tidak terpengaruh', () => {
    expect(isPartnerRequestAllowed('SALES_PARTNER', '/api/pipeline/leads', 'GET')).toBe(true);
    expect(isPartnerRequestAllowed('REFERRAL_PARTNER', '/api/pipeline/leads', 'GET')).toBe(false);
    expect(isPartnerRequestAllowed('SE', '/api/se/field-logs', 'GET')).toBe(true);
  });
});

describe('Penjaga agar 2FA tidak tertimpa saat merge', () => {
  it('tidak ada kode OTP statis atau token offline pada jalur login', () => {
    for (const path of ['server/auth.ts', 'src/lib/auth/dummy-accounts.ts', 'src/components/LoginModal.tsx']) {
      expect(read(path)).not.toMatch(/829104|['"]123456['"]|mock-offline-token|DEVOS_DEV_OTP/);
    }
  });

  it('halaman login tidak mengisi kata sandi otomatis', () => {
    expect(read('src/components/LoginModal.tsx')).not.toMatch(/setPassword\(\s*["'][^"']+["']\s*\)/);
  });

  it('rute profil, lonceng keamanan, dan API TOTP tetap terpasang', () => {
    expect(read('src/lib/navigation/router.ts')).toContain("profile: '/profil'");
    const app = read('src/App.tsx');
    expect(app).toContain('<ProfilePage');
    expect(app).toContain('<RoleNotificationBell');
    expect(app).toContain('totpEnabled={Boolean(authSession?.totpEnabled)}');
    const api = read('server/index.ts');
    for (const step of ['setup', 'enable', 'disable']) expect(api).toContain(`/api/profile/totp/${step}`);
  });
});
