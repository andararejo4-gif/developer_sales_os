import { sql } from './db';
import { getTurns } from './wa-conversation';
import { sendOutboundWaMessageForSe, normalizePhoneWa } from './wa-baileys';

const DEFAULT_CADENCE_STEPS = [
  {
    stepCode: 'H0',
    stepOrder: 1,
    stepLabel: 'H0 · Sapaan Awal',
    delayHours: 0.15,
    stepGoal: 'Sapa ramah dengan nama panggilan, konfirmasi minat tipe unit/rencana bayar (Cash/KPR), dan tawarkan bantuan info brosur/pricelist.',
  },
  {
    stepCode: 'H1',
    stepOrder: 2,
    stepLabel: 'H+1 · Keunggulan & Opsi Unit',
    delayHours: 24,
    stepGoal: 'Bagikan 2-3 keunggulan utama lokasi The Park Townhouse Sukoharjo (belakang Alun-alun) dan rekomendasikan 2 unit tersedia sesuai kebutuhan.',
  },
  {
    stepCode: 'H3',
    stepOrder: 3,
    stepLabel: 'H+3 · Simulasi & Skema Bayar',
    delayHours: 72,
    stepGoal: 'Jelaskan opsi skema bayar (Cash Keras mulai Rp650 jt, Cash Tempo, atau KPR mulai Rp683 jt dengan estimasi cicilan wajar tanpa menjanjikan ACC bank).',
  },
  {
    stepCode: 'H7',
    stepOrder: 4,
    stepLabel: 'H+7 · Undangan Survei Lokasi',
    delayHours: 168,
    stepGoal: 'Ajak santai jadwalkan survei lokasi privat atau video-call tur unit di akhir pekan/hari kerja sesuai waktu luang pembeli.',
  },
  {
    stepCode: 'H14',
    stepOrder: 5,
    stepLabel: 'H+14 · Check-in Terakhir',
    delayHours: 336,
    stepGoal: 'Tanyakan dengan sopan apakah masih mempertimbangkan hunian di Sukoharjo dan beri tahu bisa membalas jika ingin berhenti dikirimi info.',
  },
];

const FORBIDDEN_CLAIMS_RE = /\b(pasti\s+untung|pasti\s+naik|bebas\s+banjir|pasti\s+disetujui|pasti\s+acc|garansi\s+kpr)\b/gi;

export function sanitizeNurtureText(text: string): string {
  return text
    .replace(FORBIDDEN_CLAIMS_RE, 'sesuai ketentuan yang berlaku')
    .trim();
}

/**
 * Menggeser waktu kirim agar selalu berada di jendela 08:30 - 19:30 WIB (UTC+7).
 */
export function clampToWibQuietHours(target: Date): Date {
  const wibOffsetMs = 7 * 3600 * 1000;
  const wibTime = new Date(target.getTime() + wibOffsetMs);
  const hour = wibTime.getUTCHours();
  const minute = wibTime.getUTCMinutes();
  const totalMins = hour * 60 + minute;

  if (totalMins < 8 * 60 + 30) {
    wibTime.setUTCHours(8, 30, 0, 0);
    return new Date(wibTime.getTime() - wibOffsetMs);
  }
  if (totalMins >= 19 * 60 + 30) {
    wibTime.setUTCDate(wibTime.getUTCDate() + 1);
    wibTime.setUTCHours(8, 30, 0, 0);
    return new Date(wibTime.getTime() - wibOffsetMs);
  }
  return target;
}

export async function ensureNurtureTablesAndSeeds(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.wa_cadence_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
      project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
      step_code TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      step_label TEXT NOT NULL,
      delay_hours NUMERIC(8, 2) NOT NULL DEFAULT 24,
      step_goal TEXT NOT NULL,
      auto_send BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      updated_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tenant_id, project_id, step_code)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.wa_nurture_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
      project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
      lead_id UUID NOT NULL,
      se_email TEXT NOT NULL,
      step_code TEXT NOT NULL,
      step_order INTEGER NOT NULL DEFAULT 1,
      scheduled_at TIMESTAMPTZ NOT NULL,
      draft_message TEXT NOT NULL DEFAULT '',
      is_edited_by_se BOOLEAN NOT NULL DEFAULT FALSE,
      ai_model TEXT,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      sent_at TIMESTAMPTZ,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (lead_id, step_code)
    )
  `;

  for (const s of DEFAULT_CADENCE_STEPS) {
    await sql`
      INSERT INTO sales_os.wa_cadence_templates (
        tenant_id, project_id, step_code, step_order, step_label, delay_hours, step_goal, auto_send, is_active
      ) VALUES (
        'andara_rejo_makmur', 'the-park-sukoharjo', ${s.stepCode}, ${s.stepOrder}, ${s.stepLabel},
        ${s.delayHours}, ${s.stepGoal}, TRUE, TRUE
      )
      ON CONFLICT (tenant_id, project_id, step_code) DO NOTHING
    `;
  }
}

export async function listCadenceTemplates(tenantId: string, projectId = 'the-park-sukoharjo') {
  return sql`
    SELECT * FROM sales_os.wa_cadence_templates
    WHERE tenant_id = ${tenantId} AND project_id = ${projectId}
    ORDER BY step_order ASC
  `;
}

export async function updateCadenceTemplate(params: {
  tenantId: string;
  projectId?: string;
  stepCode: string;
  delayHours?: number;
  stepLabel?: string;
  stepGoal?: string;
  autoSend?: boolean;
  isActive?: boolean;
  updatedBy: string;
}) {
  const projectId = params.projectId || 'the-park-sukoharjo';
  const rows = await sql`
    UPDATE sales_os.wa_cadence_templates
    SET delay_hours = COALESCE(${params.delayHours ?? null}, delay_hours),
        step_label = COALESCE(${params.stepLabel ?? null}, step_label),
        step_goal = COALESCE(${params.stepGoal ?? null}, step_goal),
        auto_send = COALESCE(${params.autoSend ?? null}, auto_send),
        is_active = COALESCE(${params.isActive ?? null}, is_active),
        updated_by = ${params.updatedBy},
        updated_at = NOW()
    WHERE tenant_id = ${params.tenantId} AND project_id = ${projectId} AND step_code = ${params.stepCode}
    RETURNING *
  `;
  return rows[0] || null;
}

export async function generateNurtureDraftWithAi(params: {
  lead: Record<string, any>;
  stepCode: string;
  stepLabel: string;
  stepGoal: string;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.AI_ROUTER_API_KEY;
  const apiUrl = (process.env.AI_ROUTER_URL || 'https://9router.giivepro.com/v1').replace(/\/$/, '');
  const model = process.env.AI_ROUTER_MODEL || 'andararejomakmurjosjis';

  const buyerName = String(params.lead.buyer_name || 'Bapak/Ibu').split(' ')[0];
  const unitInterest = String(params.lead.unit_interest || 'The Park Townhouse Sukoharjo');
  const stage = String(params.lead.stage || 'LEAD_MASUK');
  const notes = String(params.lead.notes || '');

  const units = await sql`
    SELECT unit_code, cluster, price_cash, price_kpr, status
    FROM sales_os.project_units
    WHERE tenant_id = ${params.lead.tenant_id || 'andara_rejo_makmur'} AND status = 'available'
    ORDER BY price_cash ASC
    LIMIT 4
  `;
  const unitsText = units
    .map((u: any) => `- ${u.unit_code} (${u.cluster}): Cash Rp${Math.round(Number(u.price_cash) / 1e6)} jt / KPR Rp${Math.round(Number(u.price_kpr) / 1e6)} jt`)
    .join('\n');

  let historyText = 'Belum ada riwayat chat.';
  try {
    const turns = await getTurns(String(params.lead.id), 6);
    if (turns.length > 0) {
      historyText = turns
        .map((t: any) => `${t.direction === 'IN' ? 'Pembeli' : 'SE'}: ${t.body}`)
        .join('\n');
    }
  } catch {
    /* abaikan jika tabel turns belum ada */
  }

  const fallbackMsg = `Halo Kak ${buyerName}, saya dari tim konsultan The Park Townhouse Sukoharjo (PT Andara Rejo Makmur). Izin menindaklanjuti minat Kakak terkait ${unitInterest}. Jika berkenan, saya bisa kirimkan estimasi skema bayar terbaru atau bantu aturkan jadwal survei lokasi. Kabari saja ya Kak, terima kasih.`;

  if (!apiKey) {
    return { text: fallbackMsg, model: 'fallback-no-key' };
  }

  const prompt = `Kamu adalah asisten penulis pesan follow-up WhatsApp untuk Sales Executive (SE) properti "The Park Townhouse Sukoharjo" (PT Andara Rejo Makmur).
Buatkan 1 pesan WhatsApp follow-up yang hangat, sopan, natural (seperti manusia mengetik WA, BUKAN template kaku), maksimal 3 paragraf pendek (maks 75 kata).

Data Prospek:
- Nama panggilan: ${buyerName}
- Minat unit: ${unitInterest}
- Tahap pipeline: ${stage}
- Catatan: ${notes || '-'}

Riwayat Chat Terakhir:
${historyText}

Unit Tersedia Saat Ini (Data Resmi Live):
${unitsText || '- Mulai Rp650 juta (Cash) / Rp683 juta (KPR)'}

Tahap Follow-Up: ${params.stepLabel}
Tujuan Pesan Ini: ${params.stepGoal}

Aturan Keras:
1. DILARANG menulis klaim: bebas banjir, pasti untung, pasti naik, pasti ACC/disetujui KPR.
2. Harga wajib mengacu data resmi di atas (tidak boleh di bawah Rp650 juta).
3. Jangan beri salam pembuka bertele-tele jika di riwayat chat sudah pernah mengobrol.
4. Balas HANYA teks pesan WhatsApp siap kirim (tanpa tanda kutip atau penjelasan tambahan).`;

  try {
    const resp = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!resp.ok) {
      return { text: fallbackMsg, model: 'fallback-http' };
    }
    const json = (await resp.json()) as any;
    const raw = String(json?.choices?.[0]?.message?.content || '').trim();
    if (!raw) return { text: fallbackMsg, model: 'fallback-empty' };
    return { text: sanitizeNurtureText(raw), model };
  } catch {
    return { text: fallbackMsg, model: 'fallback-error' };
  }
}

export async function scheduleNurtureForLead(params: {
  leadId: string;
  tenantId: string;
  generateInitialDrafts?: boolean;
}) {
  const leadRows = await sql`
    SELECT * FROM sales_os.pipeline_leads
    WHERE id = ${params.leadId}::uuid AND tenant_id = ${params.tenantId}
    LIMIT 1
  `;
  if (leadRows.length === 0) return [];
  const lead = leadRows[0];

  const templates = await sql`
    SELECT * FROM sales_os.wa_cadence_templates
    WHERE tenant_id = ${params.tenantId} AND is_active = TRUE
    ORDER BY step_order ASC
  `;

  const baseTime = lead.created_at ? new Date(lead.created_at) : new Date();
  for (const tpl of templates) {
    const rawTarget = new Date(baseTime.getTime() + Number(tpl.delay_hours) * 3600 * 1000);
    const scheduledAt = clampToWibQuietHours(rawTarget);
    const existing = await sql`
      SELECT id FROM sales_os.wa_nurture_jobs
      WHERE lead_id = ${lead.id}::uuid AND step_code = ${tpl.step_code}
      LIMIT 1
    `;
    if (existing.length > 0) continue;

    let draftText = '';
    let aiModel = '';
    if (params.generateInitialDrafts) {
      const gen = await generateNurtureDraftWithAi({
        lead,
        stepCode: String(tpl.step_code),
        stepLabel: String(tpl.step_label),
        stepGoal: String(tpl.step_goal),
      });
      draftText = gen.text;
      aiModel = gen.model;
    }

    await sql`
      INSERT INTO sales_os.wa_nurture_jobs (
        tenant_id, project_id, lead_id, se_email, step_code, step_order,
        scheduled_at, draft_message, ai_model, status
      ) VALUES (
        ${params.tenantId}, ${tpl.project_id}, ${lead.id}::uuid, ${lead.se_email},
        ${tpl.step_code}, ${tpl.step_order}, ${scheduledAt.toISOString()}::timestamptz,
        ${draftText}, ${aiModel || null}, ${tpl.auto_send ? 'SCHEDULED' : 'PAUSED'}
      )
      ON CONFLICT (lead_id, step_code) DO NOTHING
    `;
  }

  return getNurtureJobsForLead(params.leadId, params.tenantId);
}

export async function getNurtureJobsForLead(leadId: string, tenantId: string) {
  return sql`
    SELECT j.*, t.step_label, t.step_goal, t.delay_hours
    FROM sales_os.wa_nurture_jobs j
    LEFT JOIN sales_os.wa_cadence_templates t
      ON t.tenant_id = j.tenant_id AND t.step_code = j.step_code
    WHERE j.lead_id = ${leadId}::uuid AND j.tenant_id = ${tenantId}
    ORDER BY j.step_order ASC, j.scheduled_at ASC
  `;
}

export async function updateNurtureJob(params: {
  jobId: string;
  tenantId: string;
  draftMessage?: string;
  scheduledAt?: string;
  status?: 'SCHEDULED' | 'PAUSED' | 'SKIPPED';
}) {
  const existing = await sql`
    SELECT * FROM sales_os.wa_nurture_jobs
    WHERE id = ${params.jobId}::uuid AND tenant_id = ${params.tenantId}
    LIMIT 1
  `;
  if (existing.length === 0) return { ok: false as const, error: 'Job nurture tidak ditemukan.' };
  const job = existing[0];
  if (job.status === 'SENT') {
    return { ok: false as const, error: 'Pesan sudah terkirim dan tidak dapat diubah lagi.' };
  }

  const nextDraft = params.draftMessage !== undefined
    ? sanitizeNurtureText(params.draftMessage)
    : job.draft_message;
  const nextEdited = params.draftMessage !== undefined ? true : job.is_edited_by_se;
  const nextSched = params.scheduledAt
    ? new Date(params.scheduledAt).toISOString()
    : job.scheduled_at;
  const nextStatus = params.status || job.status;

  const updated = await sql`
    UPDATE sales_os.wa_nurture_jobs
    SET draft_message = ${nextDraft},
        is_edited_by_se = ${nextEdited},
        scheduled_at = ${nextSched}::timestamptz,
        status = ${nextStatus},
        updated_at = NOW()
    WHERE id = ${params.jobId}::uuid
    RETURNING *
  `;
  return { ok: true as const, job: updated[0] };
}

export async function regenerateNurtureJobDraft(jobId: string, tenantId: string, force = false) {
  const rows = await sql`
    SELECT j.*, t.step_label, t.step_goal
    FROM sales_os.wa_nurture_jobs j
    LEFT JOIN sales_os.wa_cadence_templates t
      ON t.tenant_id = j.tenant_id AND t.step_code = j.step_code
    WHERE j.id = ${jobId}::uuid AND j.tenant_id = ${tenantId}
    LIMIT 1
  `;
  if (rows.length === 0) return { ok: false as const, error: 'Job nurture tidak ditemukan.' };
  const job = rows[0];
  if (job.is_edited_by_se && !force) {
    return { ok: false as const, error: 'Draf sudah diedit oleh SE. Gunakan Regenerate manual untuk menimpa.' };
  }

  const leadRows = await sql`
    SELECT * FROM sales_os.pipeline_leads WHERE id = ${job.lead_id}::uuid LIMIT 1
  `;
  if (leadRows.length === 0) return { ok: false as const, error: 'Lead tidak ditemukan.' };

  const gen = await generateNurtureDraftWithAi({
    lead: leadRows[0],
    stepCode: String(job.step_code),
    stepLabel: String(job.step_label || job.step_code),
    stepGoal: String(job.step_goal || 'Follow up prospek secara ramah'),
  });

  const updated = await sql`
    UPDATE sales_os.wa_nurture_jobs
    SET draft_message = ${gen.text},
        ai_model = ${gen.model},
        is_edited_by_se = FALSE,
        updated_at = NOW()
    WHERE id = ${jobId}::uuid
    RETURNING *
  `;
  return { ok: true as const, job: updated[0] };
}

export async function executeNurtureJobSend(jobId: string, tenantId: string, seName = 'Sales Executive') {
  const rows = await sql`
    SELECT j.*, t.step_label, t.step_goal
    FROM sales_os.wa_nurture_jobs j
    LEFT JOIN sales_os.wa_cadence_templates t
      ON t.tenant_id = j.tenant_id AND t.step_code = j.step_code
    WHERE j.id = ${jobId}::uuid AND j.tenant_id = ${tenantId}
    LIMIT 1
  `;
  if (rows.length === 0) return { ok: false as const, error: 'Job nurture tidak ditemukan.' };
  const job = rows[0];
  if (job.status === 'SENT') return { ok: false as const, error: 'Pesan sudah terkirim sebelumnya.' };

  const leadRows = await sql`
    SELECT * FROM sales_os.pipeline_leads WHERE id = ${job.lead_id}::uuid LIMIT 1
  `;
  if (leadRows.length === 0) return { ok: false as const, error: 'Lead tidak ditemukan.' };
  const lead = leadRows[0];

  // Safety Gate 1: Cek opt-out & suppression list sebelum kirim (UT-06)
  const phoneWa = normalizePhoneWa(String(lead.phone_wa || ''));
  const sup = await sql`
    SELECT id FROM sales_os.wa_suppression_list
    WHERE tenant_id = ${tenantId} AND phone_wa = ${phoneWa}
    LIMIT 1
  `;
  if (lead.wa_consent === 'OPT_OUT' || sup.length > 0) {
    await sql`
      UPDATE sales_os.wa_nurture_jobs
      SET status = 'CANCELLED_OPT_OUT', updated_at = NOW()
      WHERE lead_id = ${lead.id}::uuid AND status IN ('SCHEDULED', 'PAUSED')
    `;
    return { ok: false as const, error: 'Lead berstatus OPT_OUT / Suppression. Antrean dibatalkan.' };
  }

  // Generate draf jika masih kosong & belum diedit SE
  let messageText = String(job.draft_message || '').trim();
  if (!messageText) {
    const gen = await generateNurtureDraftWithAi({
      lead,
      stepCode: String(job.step_code),
      stepLabel: String(job.step_label || job.step_code),
      stepGoal: String(job.step_goal || 'Follow up prospek'),
    });
    messageText = gen.text;
    await sql`
      UPDATE sales_os.wa_nurture_jobs
      SET draft_message = ${messageText}, ai_model = ${gen.model}, updated_at = NOW()
      WHERE id = ${jobId}::uuid
    `;
  }

  const sendRes = await sendOutboundWaMessageForSe({
    seEmail: String(job.se_email),
    seName,
    contactPhone: phoneWa,
    messageText,
  });

  if (!sendRes.sent) {
    await sql`
      UPDATE sales_os.wa_nurture_jobs
      SET error_message = ${sendRes.error || 'Gagal kirim Baileys'}, updated_at = NOW()
      WHERE id = ${jobId}::uuid
    `;
    return { ok: false as const, error: sendRes.error || 'Gagal kirim via WhatsApp Baileys.' };
  }

  await sql`
    UPDATE sales_os.wa_nurture_jobs
    SET status = 'SENT', sent_at = NOW(), error_message = NULL, updated_at = NOW()
    WHERE id = ${jobId}::uuid
  `;
  return { ok: true as const, messageText, sentAt: new Date().toISOString() };
}

let nurtureTimer: ReturnType<typeof setInterval> | null = null;
let nurtureRunning = false;

export function startNurtureScheduler(): void {
  if (nurtureTimer || process.env.WA_NURTURE_SCHEDULER === 'off') return;

  nurtureTimer = setInterval(async () => {
    if (nurtureRunning) return;
    nurtureRunning = true;
    try {
      const now = new Date();
      const wibTime = new Date(now.getTime() + 7 * 3600 * 1000);
      const mins = wibTime.getUTCHours() * 60 + wibTime.getUTCMinutes();
      // Hanya kirim di jam kerja 08:30 - 19:30 WIB
      if (mins < 8 * 60 + 30 || mins >= 19 * 60 + 30) return;

      const dueJobs = await sql`
        SELECT j.id, j.tenant_id, j.se_email, j.lead_id
        FROM sales_os.wa_nurture_jobs j
        WHERE j.status = 'SCHEDULED' AND j.scheduled_at <= NOW()
        ORDER BY j.scheduled_at ASC
        LIMIT 5
      `;

      for (const job of dueJobs) {
        // Batas aman 35 pesan nurture/hari per nomor WA SE
        const sentToday = await sql`
          SELECT COUNT(*)::int AS cnt
          FROM sales_os.wa_nurture_jobs
          WHERE se_email = ${job.se_email}
            AND status = 'SENT'
            AND sent_at >= NOW() - INTERVAL '24 hours'
        `;
        if (Number(sentToday[0]?.cnt || 0) >= 35) continue;

        // Cek apakah ada chat aktif dalam 12 jam terakhir agar tidak tabrakan
        const recentChat = await sql`
          SELECT id FROM sales_os.wa_conversation_turns
          WHERE lead_id = ${job.lead_id}::uuid
            AND created_at >= NOW() - INTERVAL '12 hours'
          LIMIT 1
        `.catch(() => []);
        if (recentChat.length > 0) {
          await sql`
            UPDATE sales_os.wa_nurture_jobs
            SET status = 'SKIPPED_ACTIVE_CHAT', updated_at = NOW()
            WHERE id = ${job.id}::uuid
          `;
          continue;
        }

        await executeNurtureJobSend(String(job.id), String(job.tenant_id));
        // Jitter aman antar pesan Baileys (20 detik)
        await new Promise((r) => setTimeout(r, 20_000));
      }
    } catch {
      /* hindari crash scheduler */
    } finally {
      nurtureRunning = false;
    }
  }, 60_000);
}
