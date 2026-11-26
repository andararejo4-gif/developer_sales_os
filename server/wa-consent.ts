import { sql } from './db';

/**
 * Opt-out UU PDP. Harus permintaan yang jelas: kata "batal"/"berhenti" saja tidak cukup
 * ("besok batal, ganti Minggu" atau "kontrak berhenti Februari" bukan opt-out).
 */
const OPT_OUT =
  /^\s*(stop|berhenti|unsubscribe|unsub)\s*[.!]*\s*$|\b(jangan|tolong jangan|mohon jangan|tidak usah|ga usah|gak usah|nggak usah)\s+(lagi\s+)?(hubungi|menghubungi|chat|wa|whatsapp|kontak|telepon|telpon|kirim pesan)\b[^.?!]{0,25}(lagi|saya)|\bjangan hubungi\b|\b(tidak|gak|ga|nggak) berkenan (dihubungi|menerima)|\bhapus (nomor|no|kontak)\b|\b(berhenti|stop) (kirim|menghubungi|hubungi|chat|wa)\b|\bunsub(scribe)?\b/i;

export function isOptOutMessage(text: string): boolean {
  return OPT_OUT.test(text || '');
}

export function normalizePhoneNumber(phone: string): string {
  const digits = String(phone || '').replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export async function recordOptOutAndCancelQueue(params: {
  tenantId: string;
  phone: string;
  leadId?: string;
  channel?: string;
  sourceMessage?: string;
  actorEmail?: string;
}): Promise<{ normalizedPhone: string; cancelledJobs: number }> {
  const normalizedPhone = normalizePhoneNumber(params.phone);
  const channel = params.channel || 'whatsapp';
  if (!normalizedPhone) {
    throw new Error('INVALID_PHONE: Nomor telepon tidak valid untuk suppression.');
  }

  return sql.begin(async (tx: any) => {
    await tx`
      INSERT INTO sales_os.consent_suppression_list (
        tenant_id, normalized_phone, channel, status, source_message, updated_by, updated_at
      ) VALUES (
        ${params.tenantId}, ${normalizedPhone}, ${channel}, 'OPTED_OUT',
        ${params.sourceMessage || null}, ${params.actorEmail || 'system@andararejomakmur.co.id'}, NOW()
      )
      ON CONFLICT (tenant_id, normalized_phone, channel) DO UPDATE SET
        status = 'OPTED_OUT',
        source_message = EXCLUDED.source_message,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    `;

    let cancelledJobs = 0;
    if (params.leadId) {
      const cancelled = await tx`
        UPDATE sales_os.wa_nurture_jobs
        SET status = 'CANCELLED_OPT_OUT',
            error_message = 'Dihentikan otomatis oleh opt-out UU PDP (SEC-03/UT-06)',
            updated_at = NOW()
        WHERE tenant_id = ${params.tenantId}
          AND lead_id = ${params.leadId}::uuid
          AND status = 'SCHEDULED'
        RETURNING id
      `;
      cancelledJobs = cancelled.length;
    }

    await tx`
      INSERT INTO sales_os.business_audit_log (
        tenant_id, actor_email, actor_role, action, resource_type, resource_id, reason, after_json
      ) VALUES (
        ${params.tenantId},
        ${params.actorEmail || 'system@andararejomakmur.co.id'},
        'SYSTEM',
        'CONSENT_OPT_OUT',
        'consent_suppression',
        ${normalizedPhone},
        ${params.sourceMessage || 'Opt-out diterima'},
        ${JSON.stringify({ channel, cancelledJobs })}::jsonb
      )
    `;

    return { normalizedPhone, cancelledJobs };
  });
}

export async function assertCanSendOutreach(params: {
  tenantId: string;
  phone: string;
  channel?: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  const normalizedPhone = normalizePhoneNumber(params.phone);
  const channel = params.channel || 'whatsapp';
  if (!normalizedPhone) {
    return { allowed: false, reason: 'INVALID_PHONE' };
  }
  const rows = await sql`
    SELECT status FROM sales_os.consent_suppression_list
    WHERE tenant_id = ${params.tenantId}
      AND normalized_phone = ${normalizedPhone}
      AND channel = ${channel}
    LIMIT 1
  `;
  if (rows.length > 0 && rows[0].status === 'OPTED_OUT') {
    return { allowed: false, reason: 'OPTED_OUT_SUPPRESSED' };
  }
  return { allowed: true };
}
