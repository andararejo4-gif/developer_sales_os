import crypto from 'node:crypto';
import { sql } from './db';
import { PLAYBOOK_UNIT_CATALOG } from '../src/lib/kb/playbook-v1-2-knowledge';
import type { RoleKey } from '../src/data';

export type UnitStatus = 'available' | 'hold' | 'booked' | 'contract' | 'sold' | 'cancelled';
export type PaymentScheme = 'CK' | 'CT12' | 'CT24' | 'KPR';

const ALLOWED_TRANSITIONS: Record<UnitStatus, UnitStatus[]> = {
  available: ['hold', 'booked'],
  hold: ['available', 'booked', 'cancelled'],
  booked: ['contract', 'cancelled', 'available'],
  contract: ['sold', 'cancelled'],
  sold: [],
  cancelled: ['available'],
};

const ADMIN_APPROVER_ROLES: RoleKey[] = ['ADMIN', 'SM', 'DIREKSI', 'SUPERADMIN'];

export async function ensureUnitInventoryTablesAndSeeds(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.project_units (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
      project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
      unit_code TEXT NOT NULL,
      cluster TEXT NOT NULL DEFAULT 'The Park Townhouse',
      unit_type TEXT NOT NULL DEFAULT '2 Lantai',
      lt_sqm NUMERIC(10, 2) NOT NULL DEFAULT 0,
      lb_sqm NUMERIC(10, 2) NOT NULL DEFAULT 0,
      price_cash BIGINT NOT NULL,
      price_kpr BIGINT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      hold_by_se TEXT,
      hold_lead_id TEXT,
      hold_expires_at TIMESTAMPTZ,
      version INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tenant_id, project_id, unit_code)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.unit_status_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id UUID NOT NULL REFERENCES sales_os.project_units(id) ON DELETE CASCADE,
      tenant_id TEXT NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      reason TEXT,
      lead_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.unit_quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quote_no TEXT NOT NULL UNIQUE,
      tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
      project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
      unit_id UUID NOT NULL REFERENCES sales_os.project_units(id) ON DELETE CASCADE,
      lead_id TEXT,
      scheme TEXT NOT NULL,
      unit_price BIGINT NOT NULL,
      dp_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
      dp_amount BIGINT NOT NULL DEFAULT 0,
      principal_amount BIGINT NOT NULL DEFAULT 0,
      tenor_months INTEGER NOT NULL DEFAULT 0,
      interest_rate_annual NUMERIC(5, 2) NOT NULL DEFAULT 0,
      monthly_installment BIGINT NOT NULL DEFAULT 0,
      unknown_components JSONB NOT NULL DEFAULT '[]'::jsonb,
      breakdown_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      expires_at TIMESTAMPTZ NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  for (const u of PLAYBOOK_UNIT_CATALOG) {
    const unitCode = u.label.split('(')[0].trim();
    const ltMatch = u.label.match(/LT\s*(\d+)/i);
    const lbMatch = u.label.match(/LB\s*(\d+)/i);
    const ltSqm = ltMatch ? Number(ltMatch[1]) : 0;
    const lbSqm = lbMatch ? Number(lbMatch[1]) : 0;
    await sql`
      INSERT INTO sales_os.project_units (
        tenant_id, project_id, unit_code, cluster, unit_type,
        lt_sqm, lb_sqm, price_cash, price_kpr, status
      ) VALUES (
        'andara_rejo_makmur', 'the-park-sukoharjo', ${unitCode}, ${u.cluster}, ${u.group || '2 Lantai'},
        ${ltSqm}, ${lbSqm}, ${u.priceCashIdr}, ${u.priceKprIdr}, 'available'
      )
      ON CONFLICT (tenant_id, project_id, unit_code) DO NOTHING
    `;
  }
}

export async function expireStaleUnitHolds(): Promise<void> {
  await sql.begin(async (tx) => {
    const expired = await tx`
      SELECT id, tenant_id, status
      FROM sales_os.project_units
      WHERE status = 'hold' AND hold_expires_at IS NOT NULL AND hold_expires_at < NOW()
      FOR UPDATE SKIP LOCKED
    `;
    for (const row of expired) {
      await tx`
        UPDATE sales_os.project_units
        SET status = 'available',
            hold_by_se = NULL,
            hold_lead_id = NULL,
            hold_expires_at = NULL,
            version = version + 1,
            updated_by = 'system_ttl',
            updated_at = NOW()
        WHERE id = ${row.id}::uuid
      `;
      await tx`
        INSERT INTO sales_os.unit_status_logs (
          unit_id, tenant_id, from_status, to_status, actor_email, actor_role, reason
        ) VALUES (
          ${row.id}::uuid, ${row.tenant_id}, 'hold', 'available', 'system@andararejomakmur.co.id', 'SYSTEM', 'TTL Hold kedaluwarsa otomatis'
        )
      `;
    }
  });
}

export async function listUnits(tenantId: string, projectId?: string) {
  await expireStaleUnitHolds();
  if (projectId) {
    return sql`
      SELECT * FROM sales_os.project_units
      WHERE tenant_id = ${tenantId} AND project_id = ${projectId}
      ORDER BY cluster ASC, unit_code ASC
    `;
  }
  return sql`
    SELECT * FROM sales_os.project_units
    WHERE tenant_id = ${tenantId}
    ORDER BY cluster ASC, unit_code ASC
  `;
}

export async function transitionUnitStatus(params: {
  unitId: string;
  tenantId: string;
  toStatus: UnitStatus;
  actorEmail: string;
  actorRole: RoleKey;
  leadId?: string;
  reason?: string;
  holdHours?: number;
}): Promise<{ ok: true; unit: Record<string, any> } | { ok: false; statusCode: number; error: string }> {
  if ((params.toStatus === 'booked' || params.toStatus === 'contract' || params.toStatus === 'sold') &&
      !ADMIN_APPROVER_ROLES.includes(params.actorRole)) {
    return {
      ok: false,
      statusCode: 403,
      error: `Role ${params.actorRole} hanya dapat mengajukan hold. Status ${params.toStatus} memerlukan otorisasi Admin/SM/Direksi.`,
    };
  }

  return sql.begin(async (tx) => {
    const rows = await tx`
      SELECT * FROM sales_os.project_units
      WHERE id = ${params.unitId}::uuid AND tenant_id = ${params.tenantId}
      FOR UPDATE
    `;

    if (rows.length === 0) {
      return { ok: false as const, statusCode: 404, error: 'Unit tidak ditemukan pada tenant Anda.' };
    }

    const current = rows[0];
    const fromStatus = String(current.status) as UnitStatus;

    // Jika sedang hold tapi sudah expired, anggap available
    const effectiveFrom: UnitStatus =
      fromStatus === 'hold' && current.hold_expires_at && new Date(current.hold_expires_at).getTime() < Date.now()
        ? 'available'
        : fromStatus;

    if (!ALLOWED_TRANSITIONS[effectiveFrom]?.includes(params.toStatus)) {
      return {
        ok: false as const,
        statusCode: 409,
        error: `Transisi status tidak sah dari '${effectiveFrom}' ke '${params.toStatus}'.`,
      };
    }

    const holdTtlHours = Math.min(Math.max(Number(params.holdHours || 24), 1), 72);
    const holdExpiresAt = params.toStatus === 'hold'
      ? new Date(Date.now() + holdTtlHours * 3600 * 1000).toISOString()
      : null;

    const updated = await tx`
      UPDATE sales_os.project_units
      SET status = ${params.toStatus},
          hold_by_se = ${params.toStatus === 'hold' ? params.actorEmail : params.toStatus === 'available' || params.toStatus === 'cancelled' ? null : current.hold_by_se},
          hold_lead_id = ${params.leadId || (params.toStatus === 'available' || params.toStatus === 'cancelled' ? null : current.hold_lead_id)},
          hold_expires_at = ${holdExpiresAt}::timestamptz,
          version = version + 1,
          updated_by = ${params.actorEmail},
          updated_at = NOW()
      WHERE id = ${params.unitId}::uuid
      RETURNING *
    `;

    await tx`
      INSERT INTO sales_os.unit_status_logs (
        unit_id, tenant_id, from_status, to_status, actor_email, actor_role, reason, lead_id
      ) VALUES (
        ${params.unitId}::uuid, ${params.tenantId}, ${effectiveFrom}, ${params.toStatus},
        ${params.actorEmail}, ${params.actorRole}, ${params.reason || null}, ${params.leadId || null}
      )
    `;

    return { ok: true as const, unit: updated[0] };
  });
}

export function calculateDeterministicQuote(params: {
  priceCash: number;
  priceKpr: number;
  scheme: PaymentScheme;
  dpPercent?: number;
  tenorYears?: number;
  interestRateAnnual?: number;
}) {
  const unknownComponents = [
    'Biaya BPHTB & AJB/Notaris (mengikuti ketentuan pajak & PPAT aktual)',
    'Biaya administrasi & provisi KPR bank (mengikuti SP3K bank penyalur)',
  ];

  if (params.scheme === 'CK') {
    return {
      unitPrice: params.priceCash,
      dpPercent: 100,
      dpAmount: params.priceCash,
      principalAmount: 0,
      tenorMonths: 0,
      interestRateAnnual: 0,
      monthlyInstallment: 0,
      unknownComponents,
    };
  }

  if (params.scheme === 'CT12' || params.scheme === 'CT24') {
    const months = params.scheme === 'CT12' ? 12 : 24;
    const dpPct = params.dpPercent ?? 20;
    const dpAmount = Math.round((params.priceCash * dpPct) / 100);
    const principal = Math.max(0, params.priceCash - dpAmount);
    const monthly = Math.round(principal / months);
    return {
      unitPrice: params.priceCash,
      dpPercent: dpPct,
      dpAmount,
      principalAmount: principal,
      tenorMonths: months,
      interestRateAnnual: 0,
      monthlyInstallment: monthly,
      unknownComponents,
    };
  }

  // KPR
  const dpPct = params.dpPercent ?? 10;
  const tenorYears = Math.min(Math.max(params.tenorYears ?? 15, 5), 25);
  const tenorMonths = tenorYears * 12;
  const annualRate = params.interestRateAnnual ?? 6.5;
  const dpAmount = Math.round((params.priceKpr * dpPct) / 100);
  const principal = Math.max(0, params.priceKpr - dpAmount);
  const monthlyRate = annualRate / 100 / 12;
  const monthly = monthlyRate > 0
    ? Math.round((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -tenorMonths)))
    : Math.round(principal / tenorMonths);

  return {
    unitPrice: params.priceKpr,
    dpPercent: dpPct,
    dpAmount,
    principalAmount: principal,
    tenorMonths,
    interestRateAnnual: annualRate,
    monthlyInstallment: monthly,
    unknownComponents: [
      ...unknownComponents,
      'Suku bunga floating setelah masa promo fixed bank berakhir',
    ],
  };
}

export async function createUnitQuote(params: {
  tenantId: string;
  unitId: string;
  leadId?: string;
  scheme: PaymentScheme;
  dpPercent?: number;
  tenorYears?: number;
  interestRateAnnual?: number;
  createdBy: string;
}) {
  const units = await sql`
    SELECT * FROM sales_os.project_units
    WHERE id = ${params.unitId}::uuid AND tenant_id = ${params.tenantId}
    LIMIT 1
  `;
  if (units.length === 0) {
    return { ok: false as const, error: 'Unit tidak ditemukan.' };
  }
  const unit = units[0];
  if (unit.status === 'sold') {
    return { ok: false as const, error: 'Unit sudah berstatus SOLD dan tidak dapat dibuatkan quote baru.' };
  }

  const calc = calculateDeterministicQuote({
    priceCash: Number(unit.price_cash),
    priceKpr: Number(unit.price_kpr),
    scheme: params.scheme,
    dpPercent: params.dpPercent,
    tenorYears: params.tenorYears,
    interestRateAnnual: params.interestRateAnnual,
  });

  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  const quoteNo = `QT-${datePart}-${randPart}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  const inserted = await sql`
    INSERT INTO sales_os.unit_quotes (
      quote_no, tenant_id, project_id, unit_id, lead_id, scheme,
      unit_price, dp_percent, dp_amount, principal_amount,
      tenor_months, interest_rate_annual, monthly_installment,
      unknown_components, breakdown_json, expires_at, created_by
    ) VALUES (
      ${quoteNo}, ${params.tenantId}, ${unit.project_id}, ${unit.id}::uuid, ${params.leadId || null}, ${params.scheme},
      ${calc.unitPrice}, ${calc.dpPercent}, ${calc.dpAmount}, ${calc.principalAmount},
      ${calc.tenorMonths}, ${calc.interestRateAnnual}, ${calc.monthlyInstallment},
      ${JSON.stringify(calc.unknownComponents)}::jsonb,
      ${JSON.stringify({ unitCode: unit.unit_code, cluster: unit.cluster, ...calc })}::jsonb,
      ${expiresAt}::timestamptz, ${params.createdBy}
    )
    RETURNING *
  `;

  return { ok: true as const, quote: inserted[0], unit };
}
