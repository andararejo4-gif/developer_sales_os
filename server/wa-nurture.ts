import { sql } from './db';
import { getTurns } from './wa-conversation';
import { sendOutboundWaMessageForSe, normalizePhoneWa } from './wa-baileys';
import { getCentralAiKnowledge } from './truth-engine';

export type NurtureTone = 'santai' | 'value' | 'finansial' | 'singkat';

const TONE_GUIDES: Record<NurtureTone, string> = {
  santai: 'Gaya: Hangat, akrab, santai seperti chat teman/kenalan baik. Ringan, empatik, nol tekanan.',
  value: 'Gaya: Storytelling ringan & edukatif. Angkat 1 keunggulan nyata (lokasi belakang Alun-alun Sukoharjo, privat 30 unit, atau tata ruang nyaman) tanpa seperti brosur.',
  finansial: 'Gaya: Konsultatif & menenangkan soal pembayaran. Tawarkan simulasi santai (Cash mulai Rp650 jt / Cash Tempo / KPR mulai Rp683 jt) sesuai kenyamanan budget mereka.',
  singkat: 'Gaya: Super ringkas (1–2 kalimat saja, maks 35 kata). Langsung ke inti yang hangat dan 1 pertanyaan pendek yang mudah dijawab.',
};

const DEFAULT_CADENCE_STEPS = [
  {
    stepCode: 'H0',
    stepOrder: 1,
    stepLabel: 'H0 · Sapaan Hangat & Discovery',
    delayHours: 0.15,
    stepGoal: 'Bangun kedekatan awal yang hangat, sebut nama panggilan, bantu arahkan sesuai minat unitnya, dan tutup dengan 1 pertanyaan ringan yang nyaman dibalas.',
  },
  {
    stepCode: 'H1',
    stepOrder: 2,
    stepLabel: 'H+1 · Keunggulan Lokasi & Unit Pas',
    delayHours: 24,
    stepGoal: 'Ceritakan nilai hidup nyaman di belakang Alun-alun Sukoharjo (hanya 30 unit eksklusif + clubhouse) dan rekomendasikan 1-2 unit yang paling cocok tanpa memaksa.',
  },
  {
    stepCode: 'H3',
    stepOrder: 3,
    stepLabel: 'H+3 · Solusi Skema Bayar Fleksibel',
    delayHours: 72,
    stepGoal: 'Bantu prospek merasa tenang soal pembayaran dengan opsi Cash Keras mulai Rp650 jt, Cash Tempo, atau KPR mulai Rp683 jt, lalu tawarkan hitung-hitungan santai.',
  },
  {
    stepCode: 'H7',
    stepOrder: 4,
    stepLabel: 'H+7 · Ajakan Santai Cek Lokasi / Video Tour',
    delayHours: 168,
    stepGoal: 'Ajak merasakan langsung suasana unit lewat private viewing atau video tour singkat dengan 2 opsi waktu santai tanpa tekanan.',
  },
  {
    stepCode: 'H14',
    stepOrder: 5,
    stepLabel: 'H+14 · Check-in Elegan & Berkelas',
    delayHours: 336,
    stepGoal: 'Sapa kembali dengan elegan tanpa memaksa, beri update ketersediaan singkat, dan beri ruang nyaman jika saat ini belum menjadi prioritas.',
  },
];

const STEP_SOFT_SELLING_ANGLES: Record<string, string> = {
  H0: 'Fokus: Bangun rasa nyaman dulu, JANGAN langsung jualan keras. Tawarkan bantuan ringan sesuai unit yang diminati dan tanya 1 hal personal yang mudah dijawab (mis. rencana untuk hunian keluarga atau investasi).',
  H1: 'Fokus: Story & lifestyle value. Bayangkan tinggal selangkah dari Alun-alun Sukoharjo dalam klaster privat 30 unit saja (tidak padat, ada clubhouse). Sebutkan 1-2 unit paling relevan secara santai, bukan daftar harga kaku.',
  H3: 'Fokus: Hilangkan beban/kekhawatiran finansial. Beri gambaran ringan bahwa skema bisa disesuaikan (Cash mulai Rp650 jt, Cash Tempo, atau KPR mulai Rp683 jt), lalu tawarkan dibuatkan simulasi santai sesuai budget nyaman mereka.',
  H7: 'Fokus: Experience over pitch. Ajak mampir sebentar lihat feel lingkungannya (atau video call 5 menit kalau sibuk/di luar kota). Berikan 2 opsi waktu ringan (mis. Sabtu pagi atau sore) agar gampang dibalas.',
  H14: 'Fokus: Elegan & zero-pressure break-up. Sampaikan kalau masih mempertimbangkan hunian di pusat Sukoharjo, kabari saja jika butuh update unit terbaru; kalau sudah dapat atau lagi jeda dulu juga tidak apa-apa.',
};

const FORBIDDEN_CLAIMS_RE = /\b(pasti\s+untung|pasti\s+naik|bebas\s+banjir|pasti\s+disetujui|pasti\s+acc|garansi\s+kpr|dijamin\s+lolos|passive\s+income|capital\s+gain)\b/gi;

export function sanitizeNurtureText(text: string): string {
  return text
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .replace(/\bKak\s+Bapak\/Ibu\b/gi, 'Bapak/Ibu')
    .replace(FORBIDDEN_CLAIMS_RE, 'sesuai ketentuan yang berlaku')
    .trim();
}

export async function getRecentLeadTurnsForNurture(leadId: string, limit = 3) {
  try {
    const turns = await getTurns(leadId, limit);
    return turns.map((t: any) => ({
      direction: String(t.direction || 'IN'),
      body: String(t.body || ''),
      createdAt: t.created_at || t.createdAt || null,
    }));
  } catch {
    return [];
  }
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
  tone?: NurtureTone;
  previousDrafts?: Array<{ stepCode: string; draft: string }>;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.AI_ROUTER_API_KEY;
  const apiUrl = (process.env.AI_ROUTER_URL || 'https://9router.giivepro.com/v1').replace(/\/$/, '');
  const model = process.env.AI_ROUTER_MODEL || 'andararejomakmurjosjis';
  const tone: NurtureTone = params.tone && params.tone in TONE_GUIDES ? params.tone : 'santai';

  const rawName = String(params.lead.full_name || params.lead.buyer_name || '').trim();
  const honorificMatch = rawName.match(/^(bapak|ibu|pak|bu|mas|mbak|kak)\s+(.+)/i);
  const honorific = honorificMatch ? honorificMatch[1] : 'Kak';
  const cleanFirst = (honorificMatch ? honorificMatch[2] : rawName).split(' ')[0] || '';
  const greetingName = cleanFirst ? `${honorific} ${cleanFirst}` : 'Kak';
  const unitInterest = String(params.lead.unit_interest || 'The Park Townhouse Sukoharjo');
  const clusterInterest = String(params.lead.cluster_interest || '');
  const paymentScheme = String(params.lead.payment_scheme || 'Fleksibel (Cash / KPR)');
  const domicile = String(params.lead.domicile || '');
  const stage = String(params.lead.stage || 'LEAD_MASUK').toUpperCase();
  const isVisited = ['VISITED', 'SURVEY_DONE', 'HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS'].includes(stage);
  const notes = String(params.lead.notes || '');
  const seName = String(params.lead.owner_se_name || 'Tim The Park').split(' ')[0];
  const tenantId = String(params.lead.tenant_id || 'andara_rejo_makmur');
  const projectId = String(params.lead.project_id || 'the-park-sukoharjo');

  const [units, analysisRows, centralKb] = await Promise.all([
    sql`
      SELECT unit_code, cluster, price_cash, price_kpr, status
      FROM sales_os.project_units
      WHERE tenant_id = ${tenantId} AND status = 'available'
      ORDER BY price_cash ASC
      LIMIT 4
    `,
    sql`
      SELECT recommended_persona, ringkas, poin_lemah
      FROM sales_os.lead_ai_analyses
      WHERE lead_id = ${params.lead.id}::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `.catch(() => []),
    getCentralAiKnowledge(tenantId, projectId).catch(() => null),
  ]);

  const unitsText = units
    .map((u: any) => `- ${u.unit_code} (${u.cluster}): Cash Rp${Math.round(Number(u.price_cash) / 1e6)} jt / KPR Rp${Math.round(Number(u.price_kpr) / 1e6)} jt`)
    .join('\n');

  const latestAnalysis = analysisRows[0] as any;
  const personaText = latestAnalysis?.recommended_persona ? String(latestAnalysis.recommended_persona) : 'Umum';
  const analysisSummary = latestAnalysis?.ringkas ? String(latestAnalysis.ringkas) : '-';
  const kbExcerpt = centralKb?.masterMarkdown
    ? String(centralKb.masterMarkdown).slice(0, 700)
    : '';

  let historyText = 'Belum ada riwayat chat.';
  let unitMentionedInChat = false;
  try {
    const turns = await getTurns(String(params.lead.id), 6);
    if (turns.length > 0) {
      historyText = turns
        .map((t: any) => `${t.direction === 'IN' ? 'Pembeli' : 'SE'}: ${t.body}`)
        .join('\n');
      const allChat = turns.map((t: any) => String(t.body || '')).join(' ').toLowerCase();
      unitMentionedInChat = Boolean(
        unitInterest && allChat.includes(unitInterest.toLowerCase().split(' ')[0])
      );
    }
  } catch {
    /* abaikan jika tabel turns belum ada */
  }

  const prevDraftsText =
    params.previousDrafts && params.previousDrafts.length > 0
      ? params.previousDrafts
          .filter((p) => p.draft && p.draft.trim())
          .map((p) => `[${p.stepCode}]: ${p.draft.trim()}`)
          .join('\n')
      : 'Belum ada draf tahap sebelumnya.';

  const fallbackByStep: Record<string, string> = {
    H0: `Halo ${greetingName}, salam kenal saya ${seName} dari The Park Townhouse Sukoharjo. Kalau boleh tahu, rencana cari rumah di area Sukoharjo lebih untuk ditinggali keluarga atau buat investasi nih? Biar saya bisa bantu pilihkan info yang paling pas.`,
    H1: `Halo ${greetingName}, sekadar berbagi info santai—di The Park Townhouse (tepat di belakang Alun-alun Sukoharjo) unitnya memang dibuat terbatas 30 unit supaya tetap tenang dan privat. ${greetingName} biasanya lebih nyaman model 1 lantai atau 2 lantai ya?`,
    H3: `Selamat siang ${greetingName}, biar lebih kebayang tanpa pusing, di sini skema bayarnya cukup fleksibel—bisa Cash mulai Rp650 jt, Cash Tempo, atau KPR mulai Rp683 jt. Mau saya bantu buatkan simulasi ringan sesuai budget nyaman ${greetingName}?`,
    H7: `Halo ${greetingName}, kalau akhir pekan ini lagi santai di sekitar Sukoharjo, mampir yuk lihat langsung feel lingkungannya di The Park Townhouse—atau kalau lagi sibuk bisa video tour 5 menit aja. Lebih pas Sabtu pagi atau Minggu sore ya?`,
    H14: `Halo ${greetingName}, semoga sehat selalu ya. Sekadar menyapa aja, kalau dalam waktu dekat masih cari hunian nyaman dekat Alun-alun Sukoharjo kabari saya ya. Kalau saat ini belum prioritas juga santai kok, tidak usah sungkan.`,
  };
  const fallbackMsg = fallbackByStep[params.stepCode] || fallbackByStep.H0;

  if (!apiKey) {
    return { text: fallbackMsg, model: 'fallback-no-key' };
  }

  const softAngle = isVisited
    ? 'Lead SUDAH PERNAH SURVEI/LANJUT: jangan ulang perkenalan dasar. Fokus tanyakan kesan pasangan/keluarga, bantu jawab hal yang masih mengganjal, atau tawarkan rincian tertulis secara ringan.'
    : STEP_SOFT_SELLING_ANGLES[params.stepCode] || STEP_SOFT_SELLING_ANGLES.H0;

  const prompt = `Kamu adalah ${seName}, Sales Executive senior yang hangat, tulus, dan jago soft-selling properti premium "The Park Townhouse Sukoharjo" (tepat di belakang Alun-alun Sukoharjo, eksklusif 30 unit dengan clubhouse).
Tugasmu: tulis 1 pesan WhatsApp follow-up yang TERASA SEPERTI MANUSIA ASLI mengetik ke kenalan baik—hangat, persuasif halus (soft selling), membangkitkan minat, dan ENAK DIBACA DARI KEDUA BELAH PIHAK.

Data Prospek:
- Sapaan personal: ${greetingName}
- Status unit: ${unitMentionedInChat ? `Sudah membahas ${unitInterest}` : `Minat CRM: ${unitInterest}${clusterInterest ? ` (${clusterInterest})` : ''} (BELUM tentu dibahas di chat—jangan mengklaim pembeli sudah memilih unit ini, cukup jadikan referensi rekomendasi santai)`}
- Rencana bayar: ${paymentScheme}
- Domisili: ${domicile || '-'}
- Tahap pipeline: ${stage} (${isVisited ? 'Sudah survei/lanjut' : 'Belum survei'})
- Persona AI: ${personaText} · Ringkasan: ${analysisSummary}
- Catatan khusus: ${notes || '-'}

Riwayat Chat Terakhir:
${historyText}

Draf Tahap Sebelumnya (JANGAN ULANG pembuka, poin, atau pertanyaan yang sama!):
${prevDraftsText}

Unit Tersedia Saat Ini (Data Resmi Live):
${unitsText || '- Mulai Rp650 juta (Cash) / Rp683 juta (KPR)'}
${kbExcerpt ? `\nFakta Resmi Knowledge Base:\n${kbExcerpt}\n` : ''}
Tahap Follow-Up: ${params.stepLabel}
Tujuan Tahap: ${params.stepGoal}
Strategi Tahap Ini: ${softAngle}
${TONE_GUIDES[tone]}

Formula 3 Bagian WA Soft-Selling (WAJIB):
1. Hook personal 1 kalimat (nyambung dengan konteks, nol basa-basi korporat).
2. 1 Micro-Value spesifik yang relevan dengan kebutuhan pembeli (jangan tumpahkan semua spesifikasi seperti brosur).
3. Akhiri dengan 1 pertanyaan ringan atau pilihan sederhana (A/B) yang gampang dijawab 1 baris di WA (maksimal SATU tanda tanya).

Aturan Keras:
- DILARANG frasa klise/robot: "izin menindaklanjuti", "tim konsultan", "PT Andara Rejo Makmur", "apakah masih berminat", "jangan ragu menghubungi", "terima kasih telah menghubungi", atau "Kak Bapak/Ibu".
- Panjang ideal: ${tone === 'singkat' ? '1–2 kalimat (25–38 kata)' : '2–3 paragraf pendek (45–65 kata)'}, tanpa bullet list kaku, maksimal 1 emoji natural (boleh tanpa emoji).
- DILARANG klaim: bebas banjir, pasti untung, pasti naik, pasti ACC/disetujui KPR. Harga wajib mengacu data resmi di atas (tidak di bawah Rp650 jt).
- Balas HANYA teks pesan WhatsApp siap kirim (tanpa tanda kutip atau penjelasan).`;

  try {
    const resp = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.75,
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

  const baseTime = lead.last_activity_at
    ? new Date(lead.last_activity_at)
    : lead.created_at
    ? new Date(lead.created_at)
    : new Date();
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

    const seEmail = String(lead.owner_se_email || lead.se_email || lead.owner_email || lead.assigned_se_email || 'raka@andararejomakmur.co.id');
    const projectId = String(tpl.project_id || 'the-park-sukoharjo');

    await sql`
      INSERT INTO sales_os.wa_nurture_jobs (
        tenant_id, project_id, lead_id, se_email, step_code, step_order,
        scheduled_at, draft_message, ai_model, status
      ) VALUES (
        ${params.tenantId}, ${projectId}, ${lead.id}::uuid, ${seEmail},
        ${tpl.step_code}, ${tpl.step_order}, ${scheduledAt.toISOString()}::timestamptz,
        ${draftText}, ${aiModel || null}, ${tpl.auto_send ? 'SCHEDULED' : 'PAUSED'}
      )
      ON CONFLICT (lead_id, step_code) DO NOTHING
    `;
  }

  return getNurtureJobsForLead(params.leadId, params.tenantId);
}

export async function getNurtureJobsForLead(leadId: string, tenantId: string, autoFillDrafts = true) {
  const jobs = await sql`
    SELECT j.*, t.step_label, t.step_goal, t.delay_hours
    FROM sales_os.wa_nurture_jobs j
    LEFT JOIN sales_os.wa_cadence_templates t
      ON t.tenant_id = j.tenant_id AND t.step_code = j.step_code
    WHERE j.lead_id = ${leadId}::uuid AND j.tenant_id = ${tenantId}
    ORDER BY j.step_order ASC, j.scheduled_at ASC
  `;

  if (autoFillDrafts && jobs.length > 0) {
    const missing = jobs.filter((j: any) => !j.draft_message && !j.is_edited_by_se && j.status !== 'SENT');
    if (missing.length > 0) {
      const leadRows = await sql`
        SELECT * FROM sales_os.pipeline_leads WHERE id = ${leadId}::uuid LIMIT 1
      `;
      if (leadRows.length > 0) {
        const lead = leadRows[0];
        const prevDrafts: Array<{ stepCode: string; draft: string }> = jobs
          .filter((j: any) => j.draft_message)
          .map((j: any) => ({ stepCode: String(j.step_code), draft: String(j.draft_message) }));
        for (const m of missing) {
          const gen = await generateNurtureDraftWithAi({
            lead,
            stepCode: String(m.step_code),
            stepLabel: String(m.step_label || m.step_code),
            stepGoal: String(m.step_goal || 'Follow up prospek'),
            previousDrafts: prevDrafts,
          });
          await sql`
            UPDATE sales_os.wa_nurture_jobs
            SET draft_message = ${gen.text}, ai_model = ${gen.model}, updated_at = NOW()
            WHERE id = ${m.id}::uuid
          `;
          m.draft_message = gen.text;
          m.ai_model = gen.model;
          prevDrafts.push({ stepCode: String(m.step_code), draft: gen.text });
        }
      }
    }
  }

  return jobs;
}

export async function rescheduleAnchorForLead(params: {
  leadId: string;
  tenantId: string;
  anchorAt: string;
}) {
  const anchorDate = new Date(params.anchorAt);
  if (Number.isNaN(anchorDate.getTime())) {
    return { ok: false as const, error: 'Format tanggal follow-up pertama tidak valid.' };
  }

  const jobs = await getNurtureJobsForLead(params.leadId, params.tenantId, false);
  for (const job of jobs) {
    if (job.status === 'SENT') continue;
    const delayHours = Number(job.delay_hours ?? 0);
    // H0 (delay_hours < 1) langsung memakai waktu anchor yang dipilih user
    const rawTarget = delayHours < 1
      ? anchorDate
      : new Date(anchorDate.getTime() + delayHours * 3600 * 1000);
    const finalTarget = delayHours < 1 ? rawTarget : clampToWibQuietHours(rawTarget);
    await sql`
      UPDATE sales_os.wa_nurture_jobs
      SET scheduled_at = ${finalTarget.toISOString()}::timestamptz, updated_at = NOW()
      WHERE id = ${job.id}::uuid
    `;
  }

  const updatedJobs = await getNurtureJobsForLead(params.leadId, params.tenantId, true);
  return { ok: true as const, data: updatedJobs };
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

export async function regenerateNurtureJobDraft(
  jobId: string,
  tenantId: string,
  force = false,
  tone?: NurtureTone
) {
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

  const [leadRows, siblingRows] = await Promise.all([
    sql`SELECT * FROM sales_os.pipeline_leads WHERE id = ${job.lead_id}::uuid LIMIT 1`,
    sql`
      SELECT step_code, draft_message
      FROM sales_os.wa_nurture_jobs
      WHERE lead_id = ${job.lead_id}::uuid AND tenant_id = ${tenantId} AND step_order < ${job.step_order}
      ORDER BY step_order ASC
    `,
  ]);
  if (leadRows.length === 0) return { ok: false as const, error: 'Lead tidak ditemukan.' };

  const previousDrafts = siblingRows
    .filter((r: any) => r.draft_message)
    .map((r: any) => ({ stepCode: String(r.step_code), draft: String(r.draft_message) }));

  const gen = await generateNurtureDraftWithAi({
    lead: leadRows[0],
    stepCode: String(job.step_code),
    stepLabel: String(job.step_label || job.step_code),
    stepGoal: String(job.step_goal || 'Follow up prospek secara ramah'),
    tone,
    previousDrafts,
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

export async function regenerateAllNurtureDraftsForLead(
  leadId: string,
  tenantId: string,
  tone?: NurtureTone
) {
  const leadRows = await sql`
    SELECT * FROM sales_os.pipeline_leads
    WHERE id = ${leadId}::uuid AND tenant_id = ${tenantId}
    LIMIT 1
  `;
  if (leadRows.length === 0) return { ok: false as const, error: 'Lead tidak ditemukan.' };
  const lead = leadRows[0];

  const jobs = await getNurtureJobsForLead(leadId, tenantId, false);
  const previousDrafts: Array<{ stepCode: string; draft: string }> = [];

  for (const job of jobs) {
    if (job.status === 'SENT') {
      if (job.draft_message) {
        previousDrafts.push({ stepCode: String(job.step_code), draft: String(job.draft_message) });
      }
      continue;
    }
    const gen = await generateNurtureDraftWithAi({
      lead,
      stepCode: String(job.step_code),
      stepLabel: String(job.step_label || job.step_code),
      stepGoal: String(job.step_goal || 'Follow up prospek secara ramah'),
      tone,
      previousDrafts,
    });
    await sql`
      UPDATE sales_os.wa_nurture_jobs
      SET draft_message = ${gen.text},
          ai_model = ${gen.model},
          is_edited_by_se = FALSE,
          updated_at = NOW()
      WHERE id = ${job.id}::uuid
    `;
    job.draft_message = gen.text;
    job.ai_model = gen.model;
    job.is_edited_by_se = false;
    previousDrafts.push({ stepCode: String(job.step_code), draft: gen.text });
  }

  return { ok: true as const, data: jobs };
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
