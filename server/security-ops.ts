import crypto from 'node:crypto';
import { sql } from './db';
import { assertCanSendOutreach } from './wa-consent';
import { THE_PARK_KB_FACTS } from '../src/lib/kb/the-park-facts';

// 1. SEC-04 & SEC-13: Server-Side Approval & Dual Approval Out-of-Band
export async function createApprovalRequest(params: {
  tenantId: string;
  approvalType: 'BANK_WHITELIST' | 'DISCOUNT_OVERRIDE' | 'MATERIAL_CHANGE';
  resourceType: string;
  resourceId: string;
  payload: unknown;
  requestedBy: string;
  requiresDual?: boolean;
  ttlHours?: number;
}) {
  const requiresDual = params.requiresDual ?? params.approvalType === 'BANK_WHITELIST';
  const ttlHours = Math.min(Math.max(params.ttlHours || 24, 1), 168);
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

  const rows = await sql`
    INSERT INTO sales_os.server_approvals (
      tenant_id, approval_type, resource_type, resource_id, payload_json, requires_dual, requested_by, status, expires_at
    ) VALUES (
      ${params.tenantId}, ${params.approvalType}, ${params.resourceType}, ${params.resourceId},
      ${JSON.stringify(params.payload ?? {})}::jsonb, ${requiresDual}, ${params.requestedBy}, 'PENDING', ${expiresAt}::timestamptz
    )
    RETURNING *
  `;
  return rows[0];
}

export async function approveServerRequest(params: {
  tenantId: string;
  approvalId: string;
  approverEmail: string;
  approverRole: string;
}): Promise<{ ok: boolean; status: string; error?: string }> {
  const allowedRoles = new Set(['SUPERADMIN', 'SUPERADMIN_IT', 'DIREKSI', 'ADMIN', 'SALES_MANAGER', 'SM']);
  if (!allowedRoles.has(params.approverRole)) {
    return { ok: false, status: 'FORBIDDEN', error: 'Role tidak berhak menyetujui permintaan material.' };
  }

  return sql.begin(async (tx: any) => {
    const rows = await tx`
      SELECT * FROM sales_os.server_approvals
      WHERE id = ${params.approvalId}::uuid AND tenant_id = ${params.tenantId}
      FOR UPDATE
    `;
    if (rows.length === 0) {
      return { ok: false, status: 'NOT_FOUND', error: 'Permintaan approval tidak ditemukan.' };
    }
    const reqRow = rows[0];

    // Timeout tidak pernah berarti setuju (SEC-04)
    if (new Date(reqRow.expires_at).getTime() < Date.now()) {
      await tx`
        UPDATE sales_os.server_approvals SET status = 'EXPIRED', updated_at = NOW()
        WHERE id = ${params.approvalId}::uuid
      `;
      return { ok: false, status: 'EXPIRED', error: 'Approval kedaluwarsa; wajib ajukan ulang.' };
    }

    if (reqRow.status === 'APPROVED' || reqRow.status === 'REJECTED' || reqRow.status === 'EXPIRED') {
      return { ok: false, status: String(reqRow.status), error: `Approval sudah berstatus ${reqRow.status}.` };
    }

    if (String(reqRow.requested_by).toLowerCase() === params.approverEmail.toLowerCase()) {
      return { ok: false, status: String(reqRow.status), error: 'Pemohon tidak boleh menyetujui permintaannya sendiri.' };
    }

    if (!reqRow.approver_1) {
      const nextStatus = reqRow.requires_dual ? 'APPROVED_1' : 'APPROVED';
      await tx`
        UPDATE sales_os.server_approvals
        SET approver_1 = ${params.approverEmail},
            approved_1_at = NOW(),
            status = ${nextStatus},
            updated_at = NOW()
        WHERE id = ${params.approvalId}::uuid
      `;
      return { ok: true, status: nextStatus };
    }

    if (String(reqRow.approver_1).toLowerCase() === params.approverEmail.toLowerCase()) {
      return { ok: false, status: 'APPROVED_1', error: 'Dual approval memerlukan dua pejabat berbeda (SEC-13).' };
    }

    await tx`
      UPDATE sales_os.server_approvals
      SET approver_2 = ${params.approverEmail},
          approved_2_at = NOW(),
          status = 'APPROVED',
          updated_at = NOW()
      WHERE id = ${params.approvalId}::uuid
    `;
    return { ok: true, status: 'APPROVED' };
  });
}

// 2. SEC-10: Webhook HMAC Signature & Replay Defense
export async function verifyWebhookHmacAndReplay(params: {
  provider: string;
  eventId: string;
  timestampSec: number;
  rawBody: string;
  signatureHex: string;
  secret: string;
  tenantId?: string;
  maxSkewSec?: number;
}): Promise<{ valid: boolean; reason?: string }> {
  const maxSkew = params.maxSkewSec ?? 300;
  const nowSec = Math.floor(Date.now() / 1000);
  if (!params.eventId || !params.signatureHex || !params.secret) {
    return { valid: false, reason: 'MISSING_SIGNATURE_OR_EVENT_ID' };
  }
  if (Math.abs(nowSec - params.timestampSec) > maxSkew) {
    return { valid: false, reason: 'TIMESTAMP_OUT_OF_WINDOW' };
  }

  const expected = crypto
    .createHmac('sha256', params.secret)
    .update(`${params.timestampSec}.${params.rawBody}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(params.signatureHex.trim(), 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: 'INVALID_HMAC_SIGNATURE' };
  }

  const inserted = await sql`
    INSERT INTO sales_os.webhook_replay_nonces (provider, event_id, tenant_id)
    VALUES (${params.provider}, ${params.eventId}, ${params.tenantId || null})
    ON CONFLICT (provider, event_id) DO NOTHING
    RETURNING event_id
  `;
  if (inserted.length === 0) {
    return { valid: false, reason: 'REPLAY_DETECTED' };
  }
  return { valid: true };
}

// 3. INF-10: Durable Outbox & DLQ
export async function enqueueDurableOutbox(params: {
  tenantId: string;
  idempotencyKey: string;
  jobType: string;
  payload: unknown;
  maxAttempts?: number;
}) {
  const maxAttempts = Math.min(Math.max(params.maxAttempts || 3, 1), 10);
  const rows = await sql`
    INSERT INTO sales_os.durable_outbox (
      tenant_id, idempotency_key, job_type, payload_json, status, max_attempts
    ) VALUES (
      ${params.tenantId}, ${params.idempotencyKey}, ${params.jobType},
      ${JSON.stringify(params.payload ?? {})}::jsonb, 'PENDING', ${maxAttempts}
    )
    ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
    RETURNING *
  `;
  if (rows.length > 0) {
    return { enqueued: true, idempotentReplay: false, job: rows[0] };
  }
  const existing = await sql`
    SELECT * FROM sales_os.durable_outbox
    WHERE tenant_id = ${params.tenantId} AND idempotency_key = ${params.idempotencyKey}
    LIMIT 1
  `;
  return { enqueued: false, idempotentReplay: true, job: existing[0] };
}

export async function failOrDlqOutboxJob(params: {
  tenantId: string;
  jobId: string;
  errorMessage: string;
}) {
  return sql.begin(async (tx: any) => {
    const rows = await tx`
      SELECT * FROM sales_os.durable_outbox
      WHERE id = ${params.jobId}::uuid AND tenant_id = ${params.tenantId}
      FOR UPDATE
    `;
    if (rows.length === 0) return null;
    const job = rows[0];
    const nextAttempts = Number(job.attempts) + 1;
    const toDlq = nextAttempts >= Number(job.max_attempts);
    const updated = await tx`
      UPDATE sales_os.durable_outbox
      SET attempts = ${nextAttempts},
          status = ${toDlq ? 'DLQ' : 'PENDING'},
          last_error = ${params.errorMessage},
          next_retry_at = NOW() + INTERVAL '1 minute',
          updated_at = NOW()
      WHERE id = ${params.jobId}::uuid
      RETURNING *
    `;
    return updated[0];
  });
}

// 4. DAT-04 & F06-BE: Change Propagation & Expiry (Stale Flagging)
export async function propagateStaleAssets(params: {
  tenantId: string;
  projectId: string;
  triggerSource: string;
  reason: string;
  actorEmail: string;
  assetTypes?: string[];
}) {
  const targets = params.assetTypes || ['website_draft', 'love_letter', 'playbook', 'knowledge_summary'];
  const flagged: string[] = [];
  for (const assetType of targets) {
    await sql`
      INSERT INTO sales_os.asset_staleness_events (
        tenant_id, project_id, trigger_source, affected_asset_type, affected_asset_id, is_stale, reason, created_by
      ) VALUES (
        ${params.tenantId}, ${params.projectId}, ${params.triggerSource}, ${assetType}, ${`${params.projectId}:${assetType}`}, TRUE, ${params.reason}, ${params.actorEmail}
      )
      ON CONFLICT (tenant_id, project_id, affected_asset_type, affected_asset_id) DO UPDATE SET
        is_stale = TRUE,
        trigger_source = EXCLUDED.trigger_source,
        reason = EXCLUDED.reason,
        resolved_at = NULL,
        created_at = NOW()
    `;
    flagged.push(assetType);
  }
  return { flaggedCount: flagged.length, flagged };
}

// 5. BIL-12: Expiry, Grace 7 Hari Read-Only & Ekspor Gratis 30 Hari
export function evaluateGraceAndExportAccess(params: {
  licenseExpiresAtIso: string;
  nowIso?: string;
}): {
  state: 'ACTIVE' | 'GRACE_READ_ONLY_7D' | 'EXPORT_ONLY_30D' | 'EXPIRED_LOCKED';
  canMutateAiOrSend: boolean;
  canReadDashboard: boolean;
  canFreeExport: boolean;
} {
  const nowMs = params.nowIso ? new Date(params.nowIso).getTime() : Date.now();
  const expMs = new Date(params.licenseExpiresAtIso).getTime();
  const daysPastExpiry = (nowMs - expMs) / 86400000;

  if (daysPastExpiry <= 0) {
    return { state: 'ACTIVE', canMutateAiOrSend: true, canReadDashboard: true, canFreeExport: true };
  }
  if (daysPastExpiry <= 7) {
    return { state: 'GRACE_READ_ONLY_7D', canMutateAiOrSend: false, canReadDashboard: true, canFreeExport: true };
  }
  if (daysPastExpiry <= 30) {
    return { state: 'EXPORT_ONLY_30D', canMutateAiOrSend: false, canReadDashboard: false, canFreeExport: true };
  }
  return { state: 'EXPIRED_LOCKED', canMutateAiOrSend: false, canReadDashboard: false, canFreeExport: false };
}

// 6. F49-BE & UT-07: Grounded FAQ + Disclosure AI + Unknown/Human Escalation
export function answerFaqGrounded(params: {
  question: string;
  projectId?: string;
}): {
  disclosure: string;
  grounded: boolean;
  isUnknown: boolean;
  escalateToHuman: boolean;
  answer: string;
  sources: Array<{ id: string; title: string; source: string }>;
} {
  const disclosure = 'Asisten AI Developer Sales OS (berbasis Knowledge Base terverifikasi)';
  const q = String(params.question || '').toLowerCase().trim();

  if (!q || /\b(operator|manusia|sales|cs|agent asli|admin|keluhan|diskon khusus|slik|akad)\b/i.test(q)) {
    return {
      disclosure,
      grounded: false,
      isUnknown: false,
      escalateToHuman: true,
      answer: 'Pertanyaan Anda diteruskan ke Sales Executive / Admin manusia yang bertugas untuk konfirmasi resmi.',
      sources: [],
    };
  }

  const stopWords = new Set(['apakah', 'yang', 'dengan', 'untuk', 'atau', 'dari', 'pada', 'bisa', 'berapa', 'bagaimana']);
  const words = q
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w));
  const scored = THE_PARK_KB_FACTS.filter((f) => f.boleh_publik !== false && f.status === 'terverifikasi')
    .map((f) => {
      const hay = `${f.key} ${f.value} ${f.category}`.toLowerCase();
      const hits = words.filter((w) => hay.includes(w)).length;
      return { fact: f, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 2);

  if (scored.length === 0) {
    return {
      disclosure,
      grounded: false,
      isUnknown: true,
      escalateToHuman: true,
      answer: 'Informasi tersebut belum tersedia/terverifikasi di Knowledge Base proyek. Saya meneruskan ke tim manusia agar tidak menebak fakta.',
      sources: [],
    };
  }

  return {
    disclosure,
    grounded: true,
    isUnknown: false,
    escalateToHuman: false,
    answer: scored.map((s) => `${s.fact.key}: ${s.fact.value}`).join('\n'),
    sources: scored.map((s) => ({
      id: s.fact.fact_id,
      title: s.fact.key,
      source: s.fact.source_citation || 'KB Proyek',
    })),
  };
}

// 7. F55-BE: Eksekusi Nurture Job dengan Cek Suppression Sebelum Kirim
export async function executeNurtureJobWithConsentGuard(params: {
  tenantId: string;
  jobId: string;
  phone: string;
}): Promise<{ executed: boolean; finalStatus: string; reason?: string }> {
  const consent = await assertCanSendOutreach({
    tenantId: params.tenantId,
    phone: params.phone,
    channel: 'whatsapp',
  });
  if (!consent.allowed) {
    await sql`
      UPDATE sales_os.wa_nurture_jobs
      SET status = 'CANCELLED_OPT_OUT',
          error_message = ${consent.reason || 'OPTED_OUT_SUPPRESSED'},
          updated_at = NOW()
      WHERE id = ${params.jobId}::uuid AND tenant_id = ${params.tenantId}
    `;
    return { executed: false, finalStatus: 'CANCELLED_OPT_OUT', reason: consent.reason };
  }

  await sql`
    UPDATE sales_os.wa_nurture_jobs
    SET status = 'SENT',
        sent_at = NOW(),
        updated_at = NOW()
    WHERE id = ${params.jobId}::uuid AND tenant_id = ${params.tenantId}
  `;
  return { executed: true, finalStatus: 'SENT' };
}
