import { sql } from './db';
import { appendAuditLog } from './aic-ledger';

export type WorkspaceModuleKey =
  | 'F08_STP_POSITIONING'
  | 'F09_SWOT_ACTION'
  | 'F10_COMPETITOR_WATCH'
  | 'F16_OBJECTION_KIT'
  | 'F22_CONTENT_APPROVAL'
  | 'F24_ASSET_RIGHTS'
  | 'F46_ROUND_ROBIN_RULE'
  | 'F58_REMINDER_RESCHEDULE'
  | 'F65_SE_CERTIFICATION'
  | 'F71_BOOKING_HOLD'
  | 'F73_KPR_CHECKLIST'
  | 'F76_LEGAL_MILESTONE'
  | 'F81_COMMISSION_DISPUTE'
  | 'F82_B2B_INSTITUTION'
  | 'F83_OPEN_HOUSE_EVENT';

export async function listWorkspaceItems(params: {
  tenantId: string;
  projectId: string;
  moduleKey: string;
}) {
  return sql`
    SELECT * FROM sales_os.tenant_workspace_items
    WHERE tenant_id = ${params.tenantId}
      AND project_id = ${params.projectId}
      AND module_key = ${params.moduleKey}
    ORDER BY created_at DESC
    LIMIT 200
  `;
}

export async function createWorkspaceItem(params: {
  tenantId: string;
  projectId: string;
  moduleKey: string;
  title: string;
  status?: string;
  refId?: string | null;
  payload?: Record<string, any>;
  createdBy: string;
}) {
  const rows = await sql`
    INSERT INTO sales_os.tenant_workspace_items (
      tenant_id, project_id, module_key, title, status, ref_id, payload, created_by
    ) VALUES (
      ${params.tenantId}, ${params.projectId}, ${params.moduleKey}, ${params.title},
      ${params.status || 'ACTIVE'}, ${params.refId || null}, ${JSON.stringify(params.payload || {})}::jsonb,
      ${params.createdBy}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function updateWorkspaceItem(params: {
  tenantId: string;
  id: string;
  title?: string;
  status?: string;
  payload?: Record<string, any>;
}) {
  const existing = await sql`
    SELECT * FROM sales_os.tenant_workspace_items
    WHERE id = ${params.id}::uuid AND tenant_id = ${params.tenantId}
    LIMIT 1
  `;
  if (existing.length === 0) return null;
  const prev = existing[0];
  const rows = await sql`
    UPDATE sales_os.tenant_workspace_items
    SET title = ${params.title ?? prev.title},
        status = ${params.status ?? prev.status},
        payload = ${JSON.stringify(params.payload ?? prev.payload ?? {})}::jsonb,
        updated_at = NOW()
    WHERE id = ${params.id}::uuid AND tenant_id = ${params.tenantId}
    RETURNING *
  `;
  return rows[0];
}

export async function deleteWorkspaceItem(params: { tenantId: string; id: string }) {
  const rows = await sql`
    DELETE FROM sales_os.tenant_workspace_items
    WHERE id = ${params.id}::uuid AND tenant_id = ${params.tenantId}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * RANTAI 1 (F06 -> F16 & F24): Saat harga/fakta berubah, tandai materi promo & skrip sanggahan
 * yang masih ACTIVE menjadi NEEDS_REVIEW agar SE tidak memakai harga/promo kadaluarsa.
 */
export async function propagateTruthChangeToWorkspaceAssets(params: {
  tenantId: string;
  projectId: string;
  reason: string;
  actorEmail: string;
}) {
  const updated = await sql`
    UPDATE sales_os.tenant_workspace_items
    SET status = 'NEEDS_REVIEW',
        payload = payload || ${JSON.stringify({ staleReason: params.reason, flaggedAt: new Date().toISOString() })}::jsonb,
        updated_at = NOW()
    WHERE tenant_id = ${params.tenantId}
      AND project_id = ${params.projectId}
      AND module_key IN ('F16_OBJECTION_KIT', 'F22_CONTENT_APPROVAL', 'F24_ASSET_RIGHTS')
      AND status IN ('ACTIVE', 'APPROVED')
    RETURNING id, module_key, title
  `;
  await appendAuditLog({
    tenantId: params.tenantId,
    actorEmail: params.actorEmail,
    actorRole: 'ADMIN',
    action: 'PROPAGATE_STALE_ASSETS',
    resourceType: 'project_truth',
    resourceId: params.projectId,
    payload: { affectedCount: updated.length, reason: params.reason },
  });
  return updated;
}

/**
 * RANTAI 2 & 6 (F46 <-> F65): Round-Robin Lead Assignment terisolasi tenant.
 * Memprioritaskan SE yang lulus sertifikasi produk (F65_SE_CERTIFICATION = CERTIFIED) bila ada.
 */
export async function pickNextRoundRobinSe(params: {
  tenantId: string;
  projectId: string;
  fallbackEmails?: string[];
}): Promise<string> {
  const seUsers = await sql`
    SELECT email FROM sales_os.app_users
    WHERE tenant_id = ${params.tenantId} AND role = 'SE' AND is_active = true
    ORDER BY created_at ASC, email ASC
  `;
  let pool = seUsers.map((r) => String(r.email).toLowerCase());
  if (pool.length === 0) {
    pool = (params.fallbackEmails && params.fallbackEmails.length > 0)
      ? params.fallbackEmails
      : ['raka@andararejomakmur.co.id'];
  }

  // Cek apakah ada SE tersertifikasi F65
  const certs = await sql`
    SELECT ref_id FROM sales_os.tenant_workspace_items
    WHERE tenant_id = ${params.tenantId}
      AND project_id = ${params.projectId}
      AND module_key = 'F65_SE_CERTIFICATION'
      AND status = 'CERTIFIED'
      AND COALESCE(ref_id, '') <> ''
  `;
  const certifiedSet = new Set(certs.map((c) => String(c.ref_id).toLowerCase()));
  const certifiedPool = pool.filter((e) => certifiedSet.has(e));
  const activePool = certifiedPool.length > 0 ? certifiedPool : pool;

  const cursorRows = await sql`
    SELECT cursor_index FROM sales_os.round_robin_cursors
    WHERE tenant_id = ${params.tenantId} AND project_id = ${params.projectId}
    LIMIT 1
  `;
  const prevIdx = cursorRows.length > 0 ? Number(cursorRows[0].cursor_index) : -1;
  const nextIdx = (prevIdx + 1) % activePool.length;
  const chosen = activePool[nextIdx];

  await sql`
    INSERT INTO sales_os.round_robin_cursors (tenant_id, project_id, last_se_email, cursor_index, updated_at)
    VALUES (${params.tenantId}, ${params.projectId}, ${chosen}, ${nextIdx}, NOW())
    ON CONFLICT (tenant_id, project_id) DO UPDATE SET
      last_se_email = EXCLUDED.last_se_email,
      cursor_index = EXCLUDED.cursor_index,
      updated_at = NOW()
  `;
  return chosen;
}

/**
 * RANTAI 3 (F75 -> F76): Saat aplikasi KPR mencapai AKAD_KREDIT, otomatis buat milestone legal F76.
 */
export async function spawnLegalMilestoneOnAkad(params: {
  tenantId: string;
  projectId: string;
  kprAppId: string;
  applicantName: string;
  unitCode: string;
  actorEmail: string;
}) {
  const existing = await sql`
    SELECT id FROM sales_os.tenant_workspace_items
    WHERE tenant_id = ${params.tenantId}
      AND module_key = 'F76_LEGAL_MILESTONE'
      AND ref_id = ${params.kprAppId}
    LIMIT 1
  `;
  if (existing.length > 0) return existing[0];
  return createWorkspaceItem({
    tenantId: params.tenantId,
    projectId: params.projectId,
    moduleKey: 'F76_LEGAL_MILESTONE',
    title: `Akad & Legalitas ${params.unitCode} · ${params.applicantName}`,
    status: 'PPJB_PENDING',
    refId: params.kprAppId,
    payload: {
      unitCode: params.unitCode,
      applicantName: params.applicantName,
      ppjbDone: false,
      ajbDone: false,
      shmSplitDone: false,
      bastDone: false,
    },
    createdBy: params.actorEmail,
  });
}

/**
 * RANTAI 4 (F81 <-> Ledger): Catat sengketa komisi & otomatis tahan (ON_HOLD) ledger terkait.
 */
export async function createDisputeAndHoldCommission(params: {
  tenantId: string;
  projectId: string;
  creatorOrBrokerCode: string;
  reason: string;
  actorEmail: string;
}) {
  const dispute = await createWorkspaceItem({
    tenantId: params.tenantId,
    projectId: params.projectId,
    moduleKey: 'F81_COMMISSION_DISPUTE',
    title: `Sengketa Komisi ${params.creatorOrBrokerCode}`,
    status: 'OPEN',
    refId: params.creatorOrBrokerCode,
    payload: { reason: params.reason },
    createdBy: params.actorEmail,
  });

  const held = await sql`
    UPDATE sales_os.creator_ledger_entries
    SET status = 'ON_HOLD', updated_at = NOW()
    WHERE tenant_id = ${params.tenantId}
      AND creator_code = ${params.creatorOrBrokerCode}
      AND status IN ('PENDING', 'ACCRUED', 'APPROVED')
    RETURNING id
  `;

  return { dispute, heldLedgerCount: held.length };
}

/**
 * RANTAI 5 (F83 <-> pipeline_leads): RSVP Open House / Event masuk ke appointment & pipeline_leads.
 */
export async function registerEventRsvpToLead(params: {
  tenantId: string;
  projectId: string;
  eventId: string;
  eventTitle: string;
  guestName: string;
  guestPhone: string;
  assignedSe: string;
}) {
  const normPhone = params.guestPhone.replace(/\D/g, '').replace(/^0/, '62');
  const existing = await sql`
    SELECT id FROM sales_os.pipeline_leads
    WHERE tenant_id = ${params.tenantId} AND phone_wa = ${normPhone}
    LIMIT 1
  `;
  let leadId: string;
  if (existing.length > 0) {
    leadId = String(existing[0].id);
  } else {
    const ins = await sql`
      INSERT INTO sales_os.pipeline_leads (
        tenant_id, owner_se_email, owner_se_name, full_name, phone_wa, source, stage,
        unit_interest, sales_notes, wa_consent, wa_consent_updated_at, lead_quality, last_activity_at
      ) VALUES (
        ${params.tenantId}, ${params.assignedSe}, ${params.assignedSe.split('@')[0]}, ${params.guestName}, ${normPhone},
        ${`Open House: ${params.eventTitle}`}, 'APPOINTMENT', 'Unit Proyek',
        ${`RSVP Event ${params.eventId}`}, 'OPT_IN', NOW(), 'WARM', NOW()
      )
      RETURNING id
    `;
    leadId = String(ins[0].id);
  }

  const rsvpItem = await createWorkspaceItem({
    tenantId: params.tenantId,
    projectId: params.projectId,
    moduleKey: 'F58_REMINDER_RESCHEDULE',
    title: `RSVP ${params.guestName} · ${params.eventTitle}`,
    status: 'CONFIRMED',
    refId: leadId,
    payload: { eventId: params.eventId, guestPhone: normPhone },
    createdBy: params.assignedSe,
  });

  return { leadId, rsvpItem };
}
