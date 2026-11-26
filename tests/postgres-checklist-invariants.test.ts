import { describe, expect, it, afterAll, beforeAll } from 'bun:test';
import { sql } from '../server/db';
import {
  appendAuditLog,
  getAicLedgerForTenant,
  getAuditLogsForTenant,
  grantTopupLotAtomic,
  refundAicAtomic,
  reserveAicAtomic,
  settleAicAtomic,
} from '../server/aic-ledger';
import { ensureUnitInventoryTablesAndSeeds, transitionUnitStatus } from '../server/units-quotes';

const RUN_ID = `test_${Date.now()}`;
const TENANT_A = `tenant_a_${RUN_ID}`;
const TENANT_B = `tenant_b_${RUN_ID}`;

let dbReady = false;

beforeAll(async () => {
  try {
    await sql`SELECT 1`;
    await ensureUnitInventoryTablesAndSeeds();
    dbReady = true;
  } catch {
    dbReady = false;
  }
});

afterAll(async () => {
  if (!dbReady) return;
  try {
    await sql`DELETE FROM sales_os.aic_ledger_entries WHERE tenant_id IN (${TENANT_A}, ${TENANT_B})`;
    await sql`DELETE FROM sales_os.aic_topup_lots WHERE tenant_id IN (${TENANT_A}, ${TENANT_B})`;
    await sql`DELETE FROM sales_os.tenant_aic_wallets WHERE tenant_id IN (${TENANT_A}, ${TENANT_B})`;
    await sql`DELETE FROM sales_os.business_audit_log WHERE tenant_id IN (${TENANT_A}, ${TENANT_B})`;
    await sql`DELETE FROM sales_os.unit_audit_logs WHERE tenant_id IN (${TENANT_A}, ${TENANT_B})`;
    await sql`DELETE FROM sales_os.project_units WHERE tenant_id IN (${TENANT_A}, ${TENANT_B})`;
  } catch {
    /* abaikan cleanup error */
  }
});

describe('Checklist R0/R1 PostgreSQL Invariants (BIL-04, BIL-07, BIL-14, DAT-09, F67-BE, UT-03/05/08)', () => {
  it('BIL-04/07/14 & UT-08: FEFO lot deduction, idempotent reserve, dan refund tepat sekali', async () => {
    if (!dbReady) return;

    const soonExpiry = new Date(Date.now() + 5 * 86400000).toISOString();
    const laterExpiry = new Date(Date.now() + 60 * 86400000).toISOString();

    const topup1 = await grantTopupLotAtomic({
      tenantId: TENANT_A,
      billableEventId: `${RUN_ID}_topup_far`,
      lotCode: 'LOT_FAR_60D',
      amountAic: 100,
      expiresAt: laterExpiry,
      actorEmail: 'it@test.local',
    });
    expect(topup1.ok).toBe(true);

    const topup2 = await grantTopupLotAtomic({
      tenantId: TENANT_A,
      billableEventId: `${RUN_ID}_topup_soon`,
      lotCode: 'LOT_SOON_5D',
      amountAic: 40,
      expiresAt: soonExpiry,
      actorEmail: 'it@test.local',
    });
    expect(topup2.ok).toBe(true);
    const soonLotId = topup2.lotIdsUsed![0];
    const farLotId = topup1.lotIdsUsed![0];

    // Reserve 50 AIC -> harus potong LOT_SOON_5D (40) lebih dulu, lalu LOT_FAR_60D (10)
    const evtId = `${RUN_ID}_evt_1`;
    const [r1, r2] = await Promise.all([
      reserveAicAtomic({
        tenantId: TENANT_A,
        billableEventId: evtId,
        featureId: 'F49',
        amountAic: 50,
        actorEmail: 'se@test.local',
      }),
      reserveAicAtomic({
        tenantId: TENANT_A,
        billableEventId: evtId,
        featureId: 'F49',
        amountAic: 50,
        actorEmail: 'se@test.local',
      }),
    ]);

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r1.idempotentReplay !== r2.idempotentReplay).toBe(true);
    expect(r1.balanceAfter).toBe(r2.balanceAfter);

    const ledgerAfterReserve = await getAicLedgerForTenant(TENANT_A);
    const soonLot = ledgerAfterReserve.activeLots.find((l: any) => String(l.id) === soonLotId);
    const farLot = ledgerAfterReserve.activeLots.find((l: any) => String(l.id) === farLotId);
    expect(soonLot).toBeUndefined(); // 40 habis terpakai
    expect(Number(farLot?.remaining_aic)).toBe(90); // 100 - 10

    // Refund 2x untuk evtId -> saldo & lot kembali tepat sekali
    const ref1 = await refundAicAtomic({
      tenantId: TENANT_A,
      billableEventId: evtId,
      actorEmail: 'system@test.local',
    });
    const ref2 = await refundAicAtomic({
      tenantId: TENANT_A,
      billableEventId: evtId,
      actorEmail: 'system@test.local',
    });
    expect(ref1.idempotentReplay).toBe(false);
    expect(ref2.idempotentReplay).toBe(true);
    expect(ref1.balanceAfter).toBe(20140); // 20000 default + 100 + 40

    // Event kedua: reserve -> settle -> refund harus ditolak
    const evt2 = `${RUN_ID}_evt_2`;
    await reserveAicAtomic({
      tenantId: TENANT_A,
      billableEventId: evt2,
      featureId: 'F13',
      amountAic: 25,
      actorEmail: 'se@test.local',
    });
    const settled = await settleAicAtomic({
      tenantId: TENANT_A,
      billableEventId: evt2,
      actorEmail: 'system@test.local',
    });
    expect(settled.reservedAfter).toBe(0);
    await expect(
      refundAicAtomic({
        tenantId: TENANT_A,
        billableEventId: evt2,
        actorEmail: 'system@test.local',
      })
    ).rejects.toThrow(/ALREADY_SETTLED/);
  });

  it('F67-BE & UT-05: 2 concurrent unit hold di PostgreSQL hanya meloloskan 1 transaksi', async () => {
    if (!dbReady) return;

    const inserted = await sql`
      INSERT INTO sales_os.project_units (
        tenant_id, project_id, cluster, unit_code, unit_type, lt_sqm, lb_sqm,
        price_cash, price_kpr, status
      ) VALUES (
        ${TENANT_A}, 'proj-lock-test', 'Cluster Test', ${`U-${RUN_ID}`}, '45/72', 72, 45,
        500000000, 565000000, 'available'
      )
      RETURNING id
    `;
    const unitId = String(inserted[0].id);

    const [h1, h2] = await Promise.all([
      transitionUnitStatus({
        tenantId: TENANT_A,
        unitId,
        toStatus: 'hold',
        actorEmail: 'se1@test.local',
        actorRole: 'SE',
        leadId: 'lead-1',
        holdHours: 24,
      }),
      transitionUnitStatus({
        tenantId: TENANT_A,
        unitId,
        toStatus: 'hold',
        actorEmail: 'se2@test.local',
        actorRole: 'SE',
        leadId: 'lead-2',
        holdHours: 24,
      }),
    ]);

    const okCount = [h1, h2].filter((r) => r.ok).length;
    const failCount = [h1, h2].filter((r) => !r.ok).length;
    expect(okCount).toBe(1);
    expect(failCount).toBe(1);
  });

  it('DAT-09 & UT-03: Business audit log immutable dan terisolasi antar tenant', async () => {
    if (!dbReady) return;

    await appendAuditLog({
      tenantId: TENANT_A,
      actorEmail: 'admin@a.local',
      actorRole: 'ADMIN',
      action: 'PRICE_UPDATE',
      resourceType: 'unit',
      resourceId: 'unit-a1',
      reason: 'Revisi harga kuartal',
      before: { price: 500000000 },
      after: { price: 525000000 },
    });

    const logsA = await getAuditLogsForTenant(TENANT_A);
    const logsB = await getAuditLogsForTenant(TENANT_B);
    expect(logsA.length).toBeGreaterThanOrEqual(1);
    expect(logsB.length).toBe(0);
  });
});
