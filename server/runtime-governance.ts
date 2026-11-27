import { sql } from './db';
import { appendAuditLog } from './aic-ledger';
import { AGENT_REGISTRY_48, type AgentContract } from '../src/lib/ai/agent-registry';
import {
  detectPromptInjection,
  maskPiiForLogs,
  validateSafeExternalUrl,
  validateStrictAiJson,
} from '../src/lib/security/guardrails';

// 1. AG-A01..A48 & AI-01..05, AI-09, SEC-07, SEC-08, DAT-07: Runtime Agent Dispatcher + Guardrails
export async function dispatchRegisteredAgent(params: {
  tenantId: string;
  agentId: string;
  actorEmail: string;
  inputText: string;
  externalUrl?: string;
  outputJson?: unknown;
  requiredJsonKeys?: string[];
  allowedJsonKeys?: string[];
}): Promise<{
  ok: boolean;
  agent?: AgentContract;
  maskedInput: string;
  aicEstimated: number;
  error?: string;
}> {
  const agent = AGENT_REGISTRY_48.find((a) => a.id === params.agentId);
  const maskedInput = maskPiiForLogs(String(params.inputText || ''));

  if (!agent) {
    return { ok: false, maskedInput, aicEstimated: 0, error: `AGENT_NOT_FOUND:${params.agentId}` };
  }

  const inj = detectPromptInjection(params.inputText || '');
  if (inj.flagged) {
    await appendAuditLog({
      tenantId: params.tenantId,
      actorEmail: params.actorEmail,
      actorRole: 'SYSTEM',
      action: 'AGENT_BLOCKED_PROMPT_INJECTION',
      resourceType: 'AI_AGENT',
      resourceId: agent.id,
      after: { matches: inj.matches, maskedInput },
    });
    return { ok: false, agent, maskedInput, aicEstimated: 0, error: 'PROMPT_INJECTION_BLOCKED' };
  }

  if (params.externalUrl) {
    const ssrf = validateSafeExternalUrl(params.externalUrl);
    if (!ssrf.safe) {
      return { ok: false, agent, maskedInput, aicEstimated: 0, error: ssrf.reason || 'SSRF_BLOCKED' };
    }
  }

  if (params.outputJson !== undefined && params.requiredJsonKeys && params.allowedJsonKeys) {
    const schemaRes = validateStrictAiJson(params.outputJson, params.requiredJsonKeys, params.allowedJsonKeys);
    if (!schemaRes.valid) {
      return {
        ok: false,
        agent,
        maskedInput,
        aicEstimated: 0,
        error: `STRICT_JSON_INVALID:${schemaRes.errors.join(',')}`,
      };
    }
  }

  await appendAuditLog({
    tenantId: params.tenantId,
    actorEmail: params.actorEmail,
    actorRole: 'SYSTEM',
    action: 'AGENT_DISPATCHED',
    resourceType: 'AI_AGENT',
    resourceId: agent.id,
    after: {
      agentName: agent.name,
      category: agent.category,
      requiredGate: agent.requiredGate,
      aicRate: agent.aicRate,
      requiresHumanApproval: agent.requiresHumanApproval,
      maskedInput,
    },
  });

  return { ok: true, agent, maskedInput, aicEstimated: agent.aicRate };
}

// 2. BIL-10, BIL-11, BIL-13: Proration, Invoice Summary & Quota Alert
export function calculatePlanProrationAndInvoice(params: {
  currentMonthlyIdr: number;
  targetMonthlyIdr: number;
  daysRemaining: number;
  totalCycleDays: number;
  remainingAic: number;
  monthlyAicQuota: number;
}): {
  proratedDeltaIdr: number;
  invoiceTotalIdr: number;
  isUpgrade: boolean;
  aicUsageRatio: number;
  quotaAlertLevel: 'NORMAL' | 'WARNING_80' | 'CRITICAL_95' | 'EXHAUSTED';
} {
  const safeDays = Math.max(0, Math.min(params.daysRemaining, params.totalCycleDays));
  const ratio = params.totalCycleDays > 0 ? safeDays / params.totalCycleDays : 0;
  const unusedCredit = Math.round(params.currentMonthlyIdr * ratio);
  const targetCharge = Math.round(params.targetMonthlyIdr * ratio);
  const proratedDeltaIdr = targetCharge - unusedCredit;
  const invoiceTotalIdr = Math.max(0, proratedDeltaIdr);

  const usedRatio =
    params.monthlyAicQuota > 0 ? (params.monthlyAicQuota - params.remainingAic) / params.monthlyAicQuota : 0;
  let quotaAlertLevel: 'NORMAL' | 'WARNING_80' | 'CRITICAL_95' | 'EXHAUSTED' = 'NORMAL';
  if (params.remainingAic <= 0) quotaAlertLevel = 'EXHAUSTED';
  else if (usedRatio >= 0.95) quotaAlertLevel = 'CRITICAL_95';
  else if (usedRatio >= 0.8) quotaAlertLevel = 'WARNING_80';

  return {
    proratedDeltaIdr,
    invoiceTotalIdr,
    isUpgrade: params.targetMonthlyIdr > params.currentMonthlyIdr,
    aicUsageRatio: Number(usedRatio.toFixed(4)),
    quotaAlertLevel,
  };
}

// 3. F56-BE: Appointment Scheduler Anti Double-Booking
export async function createAppointmentAtomic(params: {
  tenantId: string;
  projectId: string;
  seEmail: string;
  leadId?: string;
  customerName: string;
  customerPhone?: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  notes?: string;
  createdBy: string;
}): Promise<{ ok: boolean; appointment?: any; error?: string }> {
  const startMs = new Date(params.scheduledStartIso).getTime();
  const endMs = new Date(params.scheduledEndIso).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return { ok: false, error: 'INVALID_TIME_WINDOW' };
  }

  return sql.begin(async (tx: any) => {
    const lockKey = `${params.tenantId}:${params.seEmail.toLowerCase()}`;
    await tx`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const conflicts = await tx`
      SELECT id, scheduled_start, scheduled_end, customer_name
      FROM sales_os.appointments
      WHERE tenant_id = ${params.tenantId}
        AND LOWER(se_email) = LOWER(${params.seEmail})
        AND status IN ('SCHEDULED', 'CONFIRMED')
        AND scheduled_start < ${params.scheduledEndIso}::timestamptz
        AND scheduled_end > ${params.scheduledStartIso}::timestamptz
      FOR UPDATE
    `;

    if (conflicts.length > 0) {
      return { ok: false, error: 'DOUBLE_BOOKING_CONFLICT' };
    }

    const inserted = await tx`
      INSERT INTO sales_os.appointments (
        tenant_id, project_id, se_email, lead_id, customer_name, customer_phone,
        scheduled_start, scheduled_end, status, notes, created_by
      ) VALUES (
        ${params.tenantId},
        ${params.projectId},
        ${params.seEmail},
        ${params.leadId ? params.leadId : null}::uuid,
        ${params.customerName},
        ${params.customerPhone || ''},
        ${params.scheduledStartIso}::timestamptz,
        ${params.scheduledEndIso}::timestamptz,
        'SCHEDULED',
        ${params.notes || ''},
        ${params.createdBy}
      )
      RETURNING *
    `;

    return { ok: true, appointment: inserted[0] };
  });
}

// 4. F97-BE, F99-BE, F100-BE: Offline Queue & Low-Bandwidth Batch Sync
export async function processOfflineSyncBatch(params: {
  tenantId: string;
  deviceId: string;
  actorEmail: string;
  items: Array<{
    entityType: string;
    idempotencyKey: string;
    payload: Record<string, unknown>;
    clientUpdatedAtIso: string;
    serverUpdatedAtIso?: string;
  }>;
}): Promise<{
  syncedCount: number;
  conflictCount: number;
  idempotentReplayCount: number;
  results: Array<{ idempotencyKey: string; syncStatus: string; conflictReason?: string }>;
}> {
  let syncedCount = 0;
  let conflictCount = 0;
  let idempotentReplayCount = 0;
  const results: Array<{ idempotencyKey: string; syncStatus: string; conflictReason?: string }> = [];

  for (const item of params.items) {
    const existing = await sql`
      SELECT idempotency_key, sync_status, conflict_reason
      FROM sales_os.offline_sync_queue
      WHERE tenant_id = ${params.tenantId} AND idempotency_key = ${item.idempotencyKey}
      LIMIT 1
    `;
    if (existing.length > 0) {
      idempotentReplayCount += 1;
      results.push({
        idempotencyKey: item.idempotencyKey,
        syncStatus: String(existing[0].sync_status),
        conflictReason: existing[0].conflict_reason ? String(existing[0].conflict_reason) : undefined,
      });
      continue;
    }

    const clientMs = new Date(item.clientUpdatedAtIso).getTime();
    const serverMs = item.serverUpdatedAtIso ? new Date(item.serverUpdatedAtIso).getTime() : 0;
    const isConflict = serverMs > clientMs;
    const syncStatus = isConflict ? 'CONFLICT' : 'SYNCED';
    const conflictReason = isConflict ? 'STALE_CLIENT_TIMESTAMP' : null;

    await sql`
      INSERT INTO sales_os.offline_sync_queue (
        tenant_id, device_id, actor_email, entity_type, idempotency_key,
        payload_json, client_updated_at, sync_status, conflict_reason
      ) VALUES (
        ${params.tenantId}, ${params.deviceId}, ${params.actorEmail}, ${item.entityType},
        ${item.idempotencyKey}, ${JSON.stringify(item.payload)}::jsonb,
        ${item.clientUpdatedAtIso}::timestamptz, ${syncStatus}, ${conflictReason}
      )
    `;

    if (isConflict) conflictCount += 1;
    else syncedCount += 1;

    results.push({
      idempotencyKey: item.idempotencyKey,
      syncStatus,
      conflictReason: conflictReason || undefined,
    });
  }

  return { syncedCount, conflictCount, idempotentReplayCount, results };
}
