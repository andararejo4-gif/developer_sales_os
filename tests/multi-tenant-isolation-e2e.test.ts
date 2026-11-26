import { afterAll, describe, expect, it } from 'bun:test';
import { sql } from '../server/db';
import { listTenantUsers } from '../server/auth';
import { paymentGateway } from '../server/payment-gateway';
import {
  activateOnboardingWithDummyPayment,
  CrossTenantViolationError,
  getIsolatedStorageDir,
  parseUnitsFromExtractedText,
  resolveStrictTenantId,
  resolveTenantByProjectSlug,
  runOnboardingExtraction,
} from '../server/tenant-guard';

const createdTenants: string[] = [];
const createdSessionIds: string[] = [];
const createdEmails: string[] = [];

afterAll(async () => {
  for (const tid of createdTenants) {
    await sql`DELETE FROM sales_os.project_units WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.payment_invoices WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.aic_ledger_entries WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.aic_topup_lots WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.tenant_aic_wallets WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.projects_registry WHERE tenant_id = ${tid}`;
    await sql`DELETE FROM sales_os.tenants WHERE tenant_id = ${tid}`;
  }
  for (const email of createdEmails) {
    await sql`DELETE FROM sales_os.app_users WHERE email = ${email}`;
  }
  for (const sid of createdSessionIds) {
    await sql`DELETE FROM sales_os.onboarding_sessions WHERE id = ${sid}::uuid`;
  }
});

describe('Isolasi Multi-Tenant & Onboarding End-to-End (11 Kondisi)', () => {
  let tenantA = '';
  let slugA = '';
  let invoiceA = '';
  let sessionA = '';

  let tenantB = '';
  let slugB = '';

  it('Kondisi 1 & 11: Ekstraksi OCR/teks onboarding + aktivasi 2 tim terpisah (Platinum vs Gold) via Dummy PG', async () => {
    const samplePricelist = Buffer.from(
      'Unit A.01 Harga Cash 650000000 KPR 683000000\nUnit B.02 Cicilan 4500000/bln\n',
      'utf8'
    ).toString('base64');

    const exA = await runOnboardingExtraction({
      selectedPlan: 'platinum',
      companyName: 'PT Alpha Properti E2E',
      projectName: 'Alpha Residence E2E',
      city: 'Solo',
      province: 'Jawa Tengah',
      facilities: 'One gate, CCTV',
      files: [{ filename: 'pricelist_alpha.txt', contentBase64: samplePricelist }],
    });
    sessionA = String(exA.session.id);
    createdSessionIds.push(sessionA);

    expect(exA.extractedUnits.some((u) => u.unit === 'A.01' && u.keras === 650000000)).toBe(true);
    // Guardrail: cicilan 4.5jt tidak boleh dianggap harga rumah
    const b02 = exA.extractedUnits.find((u) => u.unit === 'B.02');
    expect(b02?.keras).toBeNull();
    expect(b02?.status).toBe('perlu dicek');

    const emailA = `it.alpha.${Date.now()}@alpha-e2e.co.id`;
    createdEmails.push(emailA);
    const actA = await activateOnboardingWithDummyPayment({
      sessionId: sessionA,
      ownerEmail: emailA,
      ownerName: 'IT Alpha',
      ownerPassword: 'PasswordAlpha123!',
      clusterCoords: [{ namaCluster: 'Gerbang Alpha', koordinat: '-7.55, 110.82' }],
      verifiedUnits: exA.extractedUnits,
    });
    expect(actA.ok).toBe(true);
    tenantA = String(actA.tenantId);
    slugA = String(actA.slug);
    invoiceA = String(actA.invoiceNo);
    createdTenants.push(tenantA);
    expect(actA.initialAic).toBe(5000);

    // Tim B (Gold)
    const exB = await runOnboardingExtraction({
      selectedPlan: 'gold',
      companyName: 'PT Beta Karya E2E',
      projectName: 'Beta Townhouse E2E',
      city: 'Semarang',
      province: 'Jawa Tengah',
      facilities: 'Taman bermain',
      files: [],
    });
    const sessionB = String(exB.session.id);
    createdSessionIds.push(sessionB);
    const emailB = `it.beta.${Date.now()}@beta-e2e.co.id`;
    createdEmails.push(emailB);
    const actB = await activateOnboardingWithDummyPayment({
      sessionId: sessionB,
      ownerEmail: emailB,
      ownerName: 'IT Beta',
      ownerPassword: 'PasswordBeta123!',
      clusterCoords: [{ namaCluster: 'Gerbang Beta', koordinat: '-6.99, 110.42' }],
      verifiedUnits: [{ unit: 'Z.99', tipe: 'Gold', lt: 60, lb: 45, keras: 500000000, tempo24: 550000000, kpr: 525000000, status: 'terverifikasi' }],
    });
    expect(actB.ok).toBe(true);
    tenantB = String(actB.tenantId);
    slugB = String(actB.slug);
    createdTenants.push(tenantB);
    expect(tenantA).not.toBe(tenantB);
    expect(actB.initialAic).toBe(2500);
  });

  it('Kondisi 2: Injeksi tenantId oleh role operasional (IT/SM/SE/ADMIN) wajib ditolak 403', () => {
    for (const role of ['IT', 'SM', 'SE', 'ADMIN', 'DIREKSI']) {
      expect(() =>
        resolveStrictTenantId({
          sessionTenantId: tenantB,
          actorRole: role,
          requestedTenantId: tenantA,
        })
      ).toThrow(CrossTenantViolationError);
    }
  });

  it('Kondisi 3: SUPERADMIN_IT / SUPERADMIN diizinkan inspeksi lintas tenant', () => {
    expect(
      resolveStrictTenantId({
        sessionTenantId: 'andara_rejo_makmur',
        actorRole: 'SUPERADMIN_IT',
        requestedTenantId: tenantA,
      })
    ).toBe(tenantA);
  });

  it('Kondisi 4: Percobaan path traversal (../) pada storage tenant wajib ditolak', () => {
    expect(() => getIsolatedStorageDir('../etc', 'passwd')).toThrow(CrossTenantViolationError);
    expect(() => getIsolatedStorageDir(tenantB, '../../secret')).toThrow(CrossTenantViolationError);
  });

  it('Kondisi 5: Direktori storage fisik Tim A dan Tim B terpisah mutlak', () => {
    const dirA = getIsolatedStorageDir(tenantA, slugA);
    const dirB = getIsolatedStorageDir(tenantB, slugB);
    expect(dirA).not.toBe(dirB);
    expect(dirA).toContain(tenantA);
    expect(dirB).toContain(tenantB);
  });

  it('Kondisi 6: Slug publik Tim A & Tim B memetakan ke tenant_id masing-masing (tidak nyasar)', async () => {
    const resA = await resolveTenantByProjectSlug(slugA);
    const resB = await resolveTenantByProjectSlug(slugB);
    expect(resA?.tenantId).toBe(tenantA);
    expect(resB?.tenantId).toBe(tenantB);
  });

  it('Kondisi 7: Slug publik yang tidak terdaftar mengembalikan null (tidak fallback ke tenant lain)', async () => {
    const missing = await resolveTenantByProjectSlug('proyek-tidak-ada-9999');
    expect(missing).toBeNull();
  });

  it('Kondisi 8: Daftar user Tim A hanya berisi user Tim A (tidak bocor user Tim B atau SUPERADMIN)', async () => {
    const usersA = await listTenantUsers(tenantA);
    const usersB = await listTenantUsers(tenantB);
    expect(usersA.length).toBeGreaterThan(0);
    expect(usersA.every((u) => u.tenantId === tenantA)).toBe(true);
    expect(usersA.some((u) => usersB.some((ub) => ub.email === u.email))).toBe(false);
    expect(usersA.some((u) => u.role === 'SUPERADMIN' || u.role === 'SUPERADMIN_IT')).toBe(false);
  });

  it('Kondisi 9: Tim B mencoba settle/bajak invoice milik Tim A wajib ditolak', async () => {
    const hijack = await paymentGateway.settleInvoice({
      tenantId: tenantB,
      invoiceNo: invoiceA,
      targetStatus: 'PAID',
      actorEmail: 'attacker@beta-e2e.co.id',
    });
    expect(hijack.ok).toBe(false);
  });

  it('Kondisi 10: Unit inventory terisolasi antar tenant & aktivasi ulang sesi onboarding bersifat idempoten', async () => {
    const unitsA = await sql`SELECT unit_code FROM sales_os.project_units WHERE tenant_id = ${tenantA}`;
    const unitsB = await sql`SELECT unit_code FROM sales_os.project_units WHERE tenant_id = ${tenantB}`;
    expect(unitsA.some((u) => u.unit_code === 'Z.99')).toBe(false);
    expect(unitsB.some((u) => u.unit_code === 'A.01')).toBe(false);

    const replay = await activateOnboardingWithDummyPayment({
      sessionId: sessionA,
      ownerEmail: 'replay@alpha-e2e.co.id',
      ownerName: 'Replay',
      ownerPassword: 'x',
      clusterCoords: [],
      verifiedUnits: [],
    });
    expect(replay.ok).toBe(true);
    expect(replay.alreadyActivated).toBe(true);
    expect(replay.tenantId).toBe(tenantA);
  });

  it('Kondisi 12: Parser OCR multi-baris membaca tabel pricelist Graha Padma (Salvia, Phyla, Maranta, dll)', () => {
    const sampleRapidOcr = `
      CLUSTER TAMAN LAVENDER
      No
      Tipe Rumah
      LB
      LT
      Harga Jual
      1
      Salvia
      60
      108
      1.363.400.000
      2
      Mentha
      126
      144
      2.183.200.000
      CLUSTER TAMAN RAFFLESIA
      1
      Phyla
      62
      126
      1.701.100.000
      CLUSTER TAMAN ADENIA
      1
      Maranta
      125
      298
      3.561.700.000
    `;
    const parsed = parseUnitsFromExtractedText(sampleRapidOcr);
    expect(parsed.length).toBe(4);
    expect(parsed[0]).toMatchObject({ unit: 'Salvia', tipe: 'CLUSTER TAMAN LAVENDER', lb: 60, lt: 108, keras: 1363400000 });
    expect(parsed[2]).toMatchObject({ unit: 'Phyla', tipe: 'CLUSTER TAMAN RAFFLESIA', lb: 62, lt: 126, keras: 1701100000 });
    expect(parsed[3]).toMatchObject({ unit: 'Maranta', tipe: 'CLUSTER TAMAN ADENIA', lb: 125, lt: 298, keras: 3561700000 });
  });
});
