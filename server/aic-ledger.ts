import { sql } from './db';

export interface LedgerMutationResult {
  ok: boolean;
  idempotentReplay: boolean;
  entryId: string;
  tenantId: string;
  billableEventId: string;
  entryType: 'RESERVE' | 'SETTLE' | 'REFUND' | 'TOPUP' | 'GRANT';
  amountAic: number;
  balanceAfter: number;
  reservedAfter: number;
  lotIdsUsed?: string[];
  error?: string;
}

export async function appendAuditLog(params: {
  tenantId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  await sql`
    INSERT INTO sales_os.business_audit_log (
      tenant_id, actor_email, actor_role, action, resource_type, resource_id, reason, before_json, after_json
    ) VALUES (
      ${params.tenantId},
      ${params.actorEmail},
      ${params.actorRole},
      ${params.action},
      ${params.resourceType},
      ${params.resourceId},
      ${params.reason || null},
      ${params.before !== undefined ? JSON.stringify(params.before) : null}::jsonb,
      ${params.after !== undefined ? JSON.stringify(params.after) : null}::jsonb
    )
  `;
}

export async function getAuditLogsForTenant(tenantId: string, limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return sql`
    SELECT id, tenant_id, actor_email, actor_role, action, resource_type, resource_id, reason, before_json, after_json, created_at
    FROM sales_os.business_audit_log
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
}

async function ensureWalletRow(tx: any, tenantId: string) {
  await tx`
    INSERT INTO sales_os.tenant_aic_wallets (tenant_id, plan_code, total_aic_granted, balance_aic, reserved_aic, valid_until)
    VALUES (${tenantId}, 'gold', 20000, 20000, 0, NOW() + INTERVAL '3 months')
    ON CONFLICT (tenant_id) DO NOTHING
  `;
  const rows = await tx`
    SELECT * FROM sales_os.tenant_aic_wallets
    WHERE tenant_id = ${tenantId}
    FOR UPDATE
  `;
  return rows[0];
}

export async function grantTopupLotAtomic(params: {
  tenantId: string;
  billableEventId: string;
  lotCode: string;
  amountAic: number;
  expiresAt: string;
  actorEmail: string;
  actorRole?: string;
}): Promise<LedgerMutationResult> {
  if (!params.billableEventId || params.amountAic <= 0) {
    throw new Error('INVALID_TOPUP_INPUT: billableEventId dan amountAic > 0 wajib diisi.');
  }

  return sql.begin(async (tx: any) => {
    const wallet = await ensureWalletRow(tx, params.tenantId);
    const existing = await tx`
      SELECT id, amount_aic, balance_after, reserved_after
      FROM sales_os.aic_ledger_entries
      WHERE tenant_id = ${params.tenantId}
        AND billable_event_id = ${params.billableEventId}
        AND entry_type = 'TOPUP'
      LIMIT 1
    `;
    if (existing.length > 0) {
      const row = existing[0];
      return {
        ok: true,
        idempotentReplay: true,
        entryId: String(row.id),
        tenantId: params.tenantId,
        billableEventId: params.billableEventId,
        entryType: 'TOPUP' as const,
        amountAic: Number(row.amount_aic),
        balanceAfter: Number(row.balance_after),
        reservedAfter: Number(row.reserved_after),
      };
    }

    if (wallet.valid_until && new Date(wallet.valid_until).getTime() < Date.now()) {
      throw new Error('LICENSE_EXPIRED: Lisensi tenant sudah kedaluwarsa, top-up ditolak (BIL-07).');
    }

    const lotRows = await tx`
      INSERT INTO sales_os.aic_topup_lots (
        tenant_id, lot_code, initial_aic, remaining_aic, expires_at, created_by
      ) VALUES (
        ${params.tenantId}, ${params.lotCode}, ${params.amountAic}, ${params.amountAic}, ${params.expiresAt}::timestamptz, ${params.actorEmail}
      )
      RETURNING id
    `;
    const lotId = String(lotRows[0].id);

    const newBalance = Number(wallet.balance_aic) + params.amountAic;
    const newTotal = Number(wallet.total_aic_granted) + params.amountAic;
    const reservedAfter = Number(wallet.reserved_aic || 0);

    await tx`
      UPDATE sales_os.tenant_aic_wallets
      SET balance_aic = ${newBalance},
          total_aic_granted = ${newTotal},
          is_throttled = false,
          updated_at = NOW()
      WHERE tenant_id = ${params.tenantId}
    `;

    const entryRows = await tx`
      INSERT INTO sales_os.aic_ledger_entries (
        tenant_id, billable_event_id, entry_type, feature_id, amount_aic, lot_id, balance_after, reserved_after, actor_email, reason
      ) VALUES (
        ${params.tenantId}, ${params.billableEventId}, 'TOPUP', 'TOPUP_LOT', ${params.amountAic}, ${lotId}::uuid, ${newBalance}, ${reservedAfter}, ${params.actorEmail}, ${params.lotCode}
      )
      RETURNING id
    `;

    await tx`
      INSERT INTO sales_os.business_audit_log (
        tenant_id, actor_email, actor_role, action, resource_type, resource_id, reason, before_json, after_json
      ) VALUES (
        ${params.tenantId}, ${params.actorEmail}, ${params.actorRole || 'SUPERADMIN_IT'}, 'AIC_TOPUP', 'aic_wallet', ${params.tenantId}, ${params.lotCode},
        ${JSON.stringify({ balanceAic: Number(wallet.balance_aic) })}::jsonb,
        ${JSON.stringify({ balanceAic: newBalance, lotId })}::jsonb
      )
    `;

    return {
      ok: true,
      idempotentReplay: false,
      entryId: String(entryRows[0].id),
      tenantId: params.tenantId,
      billableEventId: params.billableEventId,
      entryType: 'TOPUP' as const,
      amountAic: params.amountAic,
      balanceAfter: newBalance,
      reservedAfter,
      lotIdsUsed: [lotId],
    };
  });
}

export async function reserveAicAtomic(params: {
  tenantId: string;
  billableEventId: string;
  featureId: string;
  amountAic: number;
  actorEmail: string;
  actorRole?: string;
  reason?: string;
}): Promise<LedgerMutationResult> {
  if (!params.billableEventId || params.amountAic < 0) {
    throw new Error('INVALID_RESERVE_INPUT: billableEventId wajib diisi dan amountAic >= 0.');
  }

  return sql.begin(async (tx: any) => {
    const wallet = await ensureWalletRow(tx, params.tenantId);
    const existing = await tx`
      SELECT id, amount_aic, balance_after, reserved_after, metadata_json
      FROM sales_os.aic_ledger_entries
      WHERE tenant_id = ${params.tenantId}
        AND billable_event_id = ${params.billableEventId}
        AND entry_type = 'RESERVE'
      LIMIT 1
    `;
    if (existing.length > 0) {
      const row = existing[0];
      return {
        ok: true,
        idempotentReplay: true,
        entryId: String(row.id),
        tenantId: params.tenantId,
        billableEventId: params.billableEventId,
        entryType: 'RESERVE' as const,
        amountAic: Number(row.amount_aic),
        balanceAfter: Number(row.balance_after),
        reservedAfter: Number(row.reserved_after),
        lotIdsUsed: Array.isArray(row.metadata_json?.lotIdsUsed) ? row.metadata_json.lotIdsUsed : [],
      };
    }

    const currentBalance = Number(wallet.balance_aic);
    const currentReserved = Number(wallet.reserved_aic || 0);

    if (currentBalance < params.amountAic) {
      throw new Error(
        `INSUFFICIENT_AIC: Saldo (${currentBalance} AIC) tidak cukup untuk reserve ${params.amountAic} AIC.`
      );
    }

    // Potong lot top-up aktif sesuai urutan FEFO (expires_at terdekat lebih dulu)
    let remainingToDeduct = params.amountAic;
    const lotIdsUsed: string[] = [];
    const lotBreakdown: Array<{ lotId: string; deducted: number }> = [];

    if (remainingToDeduct > 0) {
      const lots = await tx`
        SELECT id, remaining_aic, expires_at
        FROM sales_os.aic_topup_lots
        WHERE tenant_id = ${params.tenantId}
          AND remaining_aic > 0
          AND expires_at > NOW()
        ORDER BY expires_at ASC, created_at ASC
        FOR UPDATE
      `;
      for (const lot of lots) {
        if (remainingToDeduct <= 0) break;
        const avail = Number(lot.remaining_aic);
        const take = Math.min(avail, remainingToDeduct);
        if (take > 0) {
          await tx`
            UPDATE sales_os.aic_topup_lots
            SET remaining_aic = remaining_aic - ${take}
            WHERE id = ${lot.id}::uuid
          `;
          lotIdsUsed.push(String(lot.id));
          lotBreakdown.push({ lotId: String(lot.id), deducted: take });
          remainingToDeduct -= take;
        }
      }
    }

    const balanceAfter = currentBalance - params.amountAic;
    const reservedAfter = currentReserved + params.amountAic;

    await tx`
      UPDATE sales_os.tenant_aic_wallets
      SET balance_aic = ${balanceAfter},
          reserved_aic = ${reservedAfter},
          is_throttled = ${balanceAfter <= 0},
          updated_at = NOW()
      WHERE tenant_id = ${params.tenantId}
    `;

    const entryRows = await tx`
      INSERT INTO sales_os.aic_ledger_entries (
        tenant_id, billable_event_id, entry_type, feature_id, amount_aic, lot_id, balance_after, reserved_after, actor_email, reason, metadata_json
      ) VALUES (
        ${params.tenantId}, ${params.billableEventId}, 'RESERVE', ${params.featureId}, ${params.amountAic},
        ${lotIdsUsed[0] ? lotIdsUsed[0] : null}::uuid,
        ${balanceAfter}, ${reservedAfter}, ${params.actorEmail}, ${params.reason || null},
        ${JSON.stringify({ lotIdsUsed, lotBreakdown })}::jsonb
      )
      RETURNING id
    `;

    return {
      ok: true,
      idempotentReplay: false,
      entryId: String(entryRows[0].id),
      tenantId: params.tenantId,
      billableEventId: params.billableEventId,
      entryType: 'RESERVE' as const,
      amountAic: params.amountAic,
      balanceAfter,
      reservedAfter,
      lotIdsUsed,
    };
  });
}

export async function settleAicAtomic(params: {
  tenantId: string;
  billableEventId: string;
  actorEmail: string;
}): Promise<LedgerMutationResult> {
  return sql.begin(async (tx: any) => {
    const wallet = await ensureWalletRow(tx, params.tenantId);
    const existing = await tx`
      SELECT id, amount_aic, balance_after, reserved_after
      FROM sales_os.aic_ledger_entries
      WHERE tenant_id = ${params.tenantId}
        AND billable_event_id = ${params.billableEventId}
        AND entry_type = 'SETTLE'
      LIMIT 1
    `;
    if (existing.length > 0) {
      const row = existing[0];
      return {
        ok: true,
        idempotentReplay: true,
        entryId: String(row.id),
        tenantId: params.tenantId,
        billableEventId: params.billableEventId,
        entryType: 'SETTLE' as const,
        amountAic: Number(row.amount_aic),
        balanceAfter: Number(row.balance_after),
        reservedAfter: Number(row.reserved_after),
      };
    }

    const reserveRows = await tx`
      SELECT feature_id, amount_aic
      FROM sales_os.aic_ledger_entries
      WHERE tenant_id = ${params.tenantId}
        AND billable_event_id = ${params.billableEventId}
        AND entry_type = 'RESERVE'
      LIMIT 1
    `;
    if (reserveRows.length === 0) {
      throw new Error('RESERVE_NOT_FOUND: Event belum pernah di-reserve.');
    }

    const amountAic = Number(reserveRows[0].amount_aic);
    const featureId = String(reserveRows[0].feature_id);
    const reservedAfter = Math.max(0, Number(wallet.reserved_aic || 0) - amountAic);
    const balanceAfter = Number(wallet.balance_aic);

    await tx`
      UPDATE sales_os.tenant_aic_wallets
      SET reserved_aic = ${reservedAfter},
          updated_at = NOW()
      WHERE tenant_id = ${params.tenantId}
    `;

    const entryRows = await tx`
      INSERT INTO sales_os.aic_ledger_entries (
        tenant_id, billable_event_id, entry_type, feature_id, amount_aic, balance_after, reserved_after, actor_email, reason
      ) VALUES (
        ${params.tenantId}, ${params.billableEventId}, 'SETTLE', ${featureId}, ${amountAic}, ${balanceAfter}, ${reservedAfter}, ${params.actorEmail}, 'Settled valid output'
      )
      RETURNING id
    `;

    return {
      ok: true,
      idempotentReplay: false,
      entryId: String(entryRows[0].id),
      tenantId: params.tenantId,
      billableEventId: params.billableEventId,
      entryType: 'SETTLE' as const,
      amountAic,
      balanceAfter,
      reservedAfter,
    };
  });
}

export async function refundAicAtomic(params: {
  tenantId: string;
  billableEventId: string;
  actorEmail: string;
  reason?: string;
}): Promise<LedgerMutationResult> {
  return sql.begin(async (tx: any) => {
    const wallet = await ensureWalletRow(tx, params.tenantId);
    const existing = await tx`
      SELECT id, amount_aic, balance_after, reserved_after
      FROM sales_os.aic_ledger_entries
      WHERE tenant_id = ${params.tenantId}
        AND billable_event_id = ${params.billableEventId}
        AND entry_type = 'REFUND'
      LIMIT 1
    `;
    if (existing.length > 0) {
      const row = existing[0];
      return {
        ok: true,
        idempotentReplay: true,
        entryId: String(row.id),
        tenantId: params.tenantId,
        billableEventId: params.billableEventId,
        entryType: 'REFUND' as const,
        amountAic: Number(row.amount_aic),
        balanceAfter: Number(row.balance_after),
        reservedAfter: Number(row.reserved_after),
      };
    }

    const reserveRows = await tx`
      SELECT feature_id, amount_aic, metadata_json
      FROM sales_os.aic_ledger_entries
      WHERE tenant_id = ${params.tenantId}
        AND billable_event_id = ${params.billableEventId}
        AND entry_type = 'RESERVE'
      LIMIT 1
    `;
    if (reserveRows.length === 0) {
      throw new Error('RESERVE_NOT_FOUND: Tidak dapat refund event yang belum di-reserve.');
    }

    const settled = await tx`
      SELECT id FROM sales_os.aic_ledger_entries
      WHERE tenant_id = ${params.tenantId}
        AND billable_event_id = ${params.billableEventId}
        AND entry_type = 'SETTLE'
      LIMIT 1
    `;
    if (settled.length > 0) {
      throw new Error('ALREADY_SETTLED: Event yang sudah settle output valid tidak dapat di-refund.');
    }

    const amountAic = Number(reserveRows[0].amount_aic);
    const featureId = String(reserveRows[0].feature_id);
    const breakdown = Array.isArray(reserveRows[0].metadata_json?.lotBreakdown)
      ? (reserveRows[0].metadata_json.lotBreakdown as Array<{ lotId: string; deducted: number }>)
      : [];

    for (const item of breakdown) {
      if (item.lotId && item.deducted > 0) {
        await tx`
          UPDATE sales_os.aic_topup_lots
          SET remaining_aic = remaining_aic + ${item.deducted}
          WHERE id = ${item.lotId}::uuid AND tenant_id = ${params.tenantId}
        `;
      }
    }

    const balanceAfter = Number(wallet.balance_aic) + amountAic;
    const reservedAfter = Math.max(0, Number(wallet.reserved_aic || 0) - amountAic);

    await tx`
      UPDATE sales_os.tenant_aic_wallets
      SET balance_aic = ${balanceAfter},
          reserved_aic = ${reservedAfter},
          is_throttled = ${balanceAfter <= 0},
          updated_at = NOW()
      WHERE tenant_id = ${params.tenantId}
    `;

    const entryRows = await tx`
      INSERT INTO sales_os.aic_ledger_entries (
        tenant_id, billable_event_id, entry_type, feature_id, amount_aic, balance_after, reserved_after, actor_email, reason
      ) VALUES (
        ${params.tenantId}, ${params.billableEventId}, 'REFUND', ${featureId}, ${amountAic}, ${balanceAfter}, ${reservedAfter}, ${params.actorEmail}, ${params.reason || 'Job failed without valid output'}
      )
      RETURNING id
    `;

    return {
      ok: true,
      idempotentReplay: false,
      entryId: String(entryRows[0].id),
      tenantId: params.tenantId,
      billableEventId: params.billableEventId,
      entryType: 'REFUND' as const,
      amountAic,
      balanceAfter,
      reservedAfter,
    };
  });
}

export async function getAicLedgerForTenant(tenantId: string, limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const entries = await sql`
    SELECT id, billable_event_id, entry_type, feature_id, amount_aic, lot_id, balance_after, reserved_after, actor_email, reason, created_at
    FROM sales_os.aic_ledger_entries
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
  const lots = await sql`
    SELECT id, lot_code, initial_aic, remaining_aic, expires_at, created_at
    FROM sales_os.aic_topup_lots
    WHERE tenant_id = ${tenantId} AND remaining_aic > 0 AND expires_at > NOW()
    ORDER BY expires_at ASC, created_at ASC
  `;
  return { entries, activeLots: lots };
}
