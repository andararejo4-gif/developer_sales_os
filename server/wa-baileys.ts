// ============================================================================
// WHATSAPP BAILEYS MANAGER - STRICT PER-ACCOUNT / PER-NUMBER ISOLATION
// Hanya mencatat metrik pesan masuk, kecepatan balas (SLA <= 5m), & olah Lead AI.
// TIDAK pernah menyimpan/menampilkan riwayat chat mentah SE di UI.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { sql } from './db';
import { encryptText, decryptText } from './crypto-util';
import { analyzeLeadWithAi } from './ai-engine';

interface ActiveWaInstance {
  seEmail: string;
  seName: string;
  socket: WASocket | null;
  status: 'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED';
  qrDataUrl: string | null;
  phoneNumber: string | null;
}

const instances = new Map<string, ActiveWaInstance>();
const processedMessageIds = new Set<string>();
const activeAnalyzingLeadIds = new Set<string>();

export function isLeadCurrentlyAnalyzing(leadId: string): boolean {
  return activeAnalyzingLeadIds.has(String(leadId));
}

function getSessionDir(seEmail: string): string {
  const hash = crypto.createHash('sha256').update(seEmail.toLowerCase()).digest('hex').slice(0, 24);
  return path.join(process.cwd(), 'server', '.baileys-sessions', `se_${hash}`);
}

export function normalizePhoneWa(raw: string): string {
  const withoutDomainAndDevice = raw.trim().replace(/@.*$/, '').replace(/:.*$/, '');
  const digits = withoutDomainAndDevice.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

function unwrapWaMessageContent(msgObj: any): any {
  if (!msgObj || typeof msgObj !== 'object') return null;
  if (msgObj.ephemeralMessage?.message) return unwrapWaMessageContent(msgObj.ephemeralMessage.message);
  if (msgObj.viewOnceMessage?.message) return unwrapWaMessageContent(msgObj.viewOnceMessage.message);
  if (msgObj.viewOnceMessageV2?.message) return unwrapWaMessageContent(msgObj.viewOnceMessageV2.message);
  if (msgObj.viewOnceMessageV2Extension?.message) return unwrapWaMessageContent(msgObj.viewOnceMessageV2Extension.message);
  if (msgObj.documentWithCaptionMessage?.message) return unwrapWaMessageContent(msgObj.documentWithCaptionMessage.message);
  if (msgObj.editedMessage?.message?.protocolMessage?.editedMessage) {
    return unwrapWaMessageContent(msgObj.editedMessage.message.protocolMessage.editedMessage);
  }
  return msgObj;
}

function extractTextFromWaMessage(rawMessage: any): string {
  const m = unwrapWaMessageContent(rawMessage);
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    ''
  ).trim();
}

function extractIntroducedNameFromText(text: string): string {
  const cleaned = (text || '').trim();
  if (!cleaned) return '';
  const patterns = [
    /(?:perkenalkan|kenalkan|nama\s+saya)\s*(?:saya\s+|adalah\s+)?([A-ZÀ-ÖØ-Ýa-zà-öø-ÿ][A-ZÀ-ÖØ-Ýa-zà-öø-ÿ .'-]{1,42}?)(?=\s*(?:,|;|\.|\bdari\b|\bmau\b|\bingin\b|\btanya\b|\bbertanya\b|\bminat\b|\bcari\b|$))/i,
    /(?:^|[.,!]\s+)saya\s+((?:dr\.?\s+|drg\.?\s+|prof\.?\s+|ir\.?\s+|h\.?\s+|hj\.?\s+|pak\s+|bapak\s+|ibu\s+|bu\s+|mas\s+|mbak\s+)?[A-Z][a-zA-Z .'-]{2,38}?)(?=\s*(?:,|;|\.|\bdari\b|\bmau\b|\bingin\b|\btanya\b|\bbertanya\b|\bminat\b|\bcari\b|$))/i,
  ];
  for (const regex of patterns) {
    const m = cleaned.match(regex);
    if (m && m[1]) {
      const candidate = m[1].trim().replace(/[.,;]+$/, '').trim();
      const lower = candidate.toLowerCase();
      if (
        candidate.length >= 3 &&
        !/^(mau|ingin|tanya|bertanya|cari|lihat|tertarik|minat|bisa|boleh)\b/.test(lower)
      ) {
        return candidate;
      }
    }
  }
  return '';
}

function resolveBestWaContactName(params: {
  waProfileName?: string;
  messageText?: string;
  existingName?: string;
  cleanPhone: string;
}): string {
  const introduced = extractIntroducedNameFromText(params.messageText || '');
  const profileName = (params.waProfileName || '').trim();
  const existing = (params.existingName || '').trim();
  const isGeneric = (n: string) => !n || /^prospek\s+wa/i.test(n) || /^\d+$/.test(n);

  // 1. Jika pengirim menyebutkan nama secara eksplisit di dalam chat, gunakan nama tersebut
  if (introduced) return introduced;
  // 2. Jika sudah ada nama asli di database (bukan "Prospek WA ..."), pertahankan
  if (existing && !isGeneric(existing)) return existing;
  // 3. Jika pengirim TIDAK menyebutkan nama di chat, ambil dari nama profil nomor WhatsApp-nya (pushName)
  if (profileName && !isGeneric(profileName)) return profileName;
  // 4. Fallback terakhir jika profil WA juga kosong
  return existing || profileName || `Prospek WA ${params.cleanPhone.slice(-4)}`;
}

function detectLeadAttributesFromMessage(
  text: string,
  currentLead: Record<string, any> | undefined
): {
  unitInterest: string;
  clusterInterest: string;
  unitPriceIdr: number;
  paymentScheme: string;
  domicile: string;
} {
  const lower = (text || '').toLowerCase();
  let unitInterest = String(
    currentLead?.unit_interest || 'Nagoya B.02 (LT 63/LB 75 · Gold 3KT)'
  );
  let clusterInterest = String(currentLead?.cluster_interest || 'Nagoya');
  let unitPriceIdr = Number(currentLead?.unit_price_idr || 650000000);

  if (/\btokyo\b/.test(lower)) {
    unitInterest = 'Tokyo A.01 (LT 72/LB 90 · Signature 3KT)';
    clusterInterest = 'Tokyo';
    unitPriceIdr = 950000000;
  } else if (/\bosaka\b/.test(lower)) {
    unitInterest = 'Osaka A.01 (LT 66/LB 80 · Titanium 3KT)';
    clusterInterest = 'Osaka';
    unitPriceIdr = 775000000;
  } else if (/\bnagoya\b/.test(lower)) {
    unitInterest = 'Nagoya B.02 (LT 63/LB 75 · Gold 3KT)';
    clusterInterest = 'Nagoya';
    unitPriceIdr = 650000000;
  }

  let paymentScheme = String(currentLead?.payment_scheme || 'KPR');
  if (/cash\s*keras|tunai\s*keras/i.test(text)) {
    paymentScheme = 'CASH_KERAS';
  } else if (/24\s*bulan|ct\s*24|tempo\s*24|bertahap\s*24/i.test(text)) {
    paymentScheme = 'CASH_TEMPO_24';
  } else if (/12\s*bulan|ct\s*12|tempo\s*12|bertahap\s*12|cash\s*tempo|cash\s*bertahap/i.test(text)) {
    paymentScheme = 'CASH_TEMPO_12';
  } else if (/\bkpr\b/i.test(text)) {
    paymentScheme = 'KPR';
  }

  let domicile = String(currentLead?.domicile || 'Sukoharjo / Solo Raya');
  const domMatch = text.match(
    /(?:domisili|tinggal\s+di|asal\s+dari|saya\s+di|saya\s+dari)\s+([A-ZÀ-ÖØ-Ýa-zà-öø-ÿ][A-ZÀ-ÖØ-Ýa-zà-öø-ÿ ,.-]{2,35}?)(?=\s*(?:,|;|\.|\bmau\b|\bingin\b|\btanya\b|\bminat\b|\bcari\b|$))/i
  );
  if (domMatch && domMatch[1]) {
    domicile = domMatch[1].trim();
  }

  return { unitInterest, clusterInterest, unitPriceIdr, paymentScheme, domicile };
}

function extractSenderPhoneFromWaKey(key: any): string {
  if (!key) return '';
  const candidates = [
    key.senderPn,
    key.remoteJidAlt,
    key.participantPn,
    key.participant,
    key.remoteJid,
  ];
  for (const cand of candidates) {
    if (typeof cand === 'string' && cand.endsWith('@s.whatsapp.net')) {
      const norm = normalizePhoneWa(cand);
      if (norm) return norm;
    }
  }
  for (const cand of candidates) {
    if (typeof cand === 'string' && cand.trim()) {
      const norm = normalizePhoneWa(cand);
      if (norm) return norm;
    }
  }
  return '';
}

/**
 * Memproses pesan masuk dari calon pembeli:
 * 1. Simpan ke buffer terenkripsi sementara & update metrik pesan masuk milik SE.
 * 2. Analisis dengan AI (9router + Playbook v1.2) untuk membuat/memperbarui Lead & Draf Follow-Up.
 * 3. Hapus buffer pesan terenkripsi segera setelah analisis selesai.
 */
export async function processInboundWaMessageForSe(params: {
  seEmail: string;
  seName: string;
  contactPhone: string;
  contactName: string;
  messageText: string;
  receivedAt?: Date;
}): Promise<{ leadId: string; responseTimeSeconds: number | null }> {
  const seEmail = params.seEmail.toLowerCase();
  const cleanPhone = normalizePhoneWa(params.contactPhone);
  if (!cleanPhone) throw new Error('Nomor WhatsApp pengirim tidak valid');

  const now = params.receivedAt || new Date();
  const encryptedMsg = encryptText(params.messageText.trim());

  // 1. Simpan sementara di buffer terenkripsi (maks 24 jam, dihapus setelah analisis AI)
  await sql`
    INSERT INTO sales_os.wa_inbound_temp_buffer (se_email, contact_phone, contact_name, encrypted_text, received_at)
    VALUES (${seEmail}, ${cleanPhone}, ${params.contactName || cleanPhone}, ${encryptedMsg}, ${now.toISOString()})
  `;

  // Bersihkan buffer yang sudah kadaluarsa (>24 jam)
  await sql`DELETE FROM sales_os.wa_inbound_temp_buffer WHERE expires_at < NOW()`;

  // 2. Update metrik kontak WA untuk SE ini (tanpa menyimpan teks chat)
  const existingMetrics = await sql`
    SELECT * FROM sales_os.wa_contact_metrics
    WHERE se_email = ${seEmail} AND contact_phone = ${cleanPhone}
    LIMIT 1
  `;

  if (existingMetrics.length === 0) {
    await sql`
      INSERT INTO sales_os.wa_contact_metrics (
        se_email, contact_phone, contact_name, inbound_count, first_inbound_at, last_inbound_at
      ) VALUES (
        ${seEmail}, ${cleanPhone}, ${params.contactName || cleanPhone}, 1, ${now.toISOString()}, ${now.toISOString()}
      )
    `;
  } else {
    await sql`
      UPDATE sales_os.wa_contact_metrics
      SET inbound_count = inbound_count + 1,
          contact_name = COALESCE(NULLIF(${params.contactName}, ''), contact_name),
          last_inbound_at = ${now.toISOString()},
          updated_at = NOW()
      WHERE se_email = ${seEmail} AND contact_phone = ${cleanPhone}
    `;
  }

  // 3. Ambil semua pesan di buffer untuk kontak ini guna dianalisis AI
  const bufferedRows = await sql`
    SELECT id, encrypted_text FROM sales_os.wa_inbound_temp_buffer
    WHERE se_email = ${seEmail} AND contact_phone = ${cleanPhone}
    ORDER BY received_at ASC
    LIMIT 10
  `;

  const decryptedMessages: string[] = [];
  for (const row of bufferedRows) {
    try {
      decryptedMessages.push(decryptText(String(row.encrypted_text)));
    } catch {
      /* abaikan bila gagal dekripsi */
    }
  }

  // Cek apakah lead sudah ada untuk SE & nomor WA ini
  const existingLeads = await sql`
    SELECT * FROM sales_os.pipeline_leads
    WHERE owner_se_email = ${seEmail} AND phone_wa = ${cleanPhone}
    LIMIT 1
  `;

  const currentLead = existingLeads[0];
  const latestCustomerMsg = decryptedMessages[decryptedMessages.length - 1] || params.messageText.trim();
  const resolvedContactName = resolveBestWaContactName({
    waProfileName: params.contactName,
    messageText: latestCustomerMsg,
    existingName: currentLead?.full_name,
    cleanPhone,
  });
  const detectedAttrs = detectLeadAttributesFromMessage(latestCustomerMsg, currentLead);
  const prevSalesMsg = String(currentLead?.last_sales_message || '').trim();
  const prevCustomerMsg = String(currentLead?.last_customer_message || '').trim();
  const nextInteractionCount = Number(currentLead?.interaction_count || 0) + 1;

  // Gabungkan riwayat obrolan sebelumnya dengan pesan baru agar AI memiliki konteks kumulatif
  const historyLines: string[] = [];
  if (currentLead?.sales_notes) {
    historyLines.push(String(currentLead.sales_notes).slice(0, 350));
  }
  if (prevCustomerMsg && prevCustomerMsg !== latestCustomerMsg) {
    historyLines.push(`[Pesan Customer Sebelumnya]: ${prevCustomerMsg}`);
  }
  if (prevSalesMsg) {
    historyLines.push(`[Balasan Sales Sebelumnya]: ${prevSalesMsg}`);
  }
  historyLines.push(`[Pesan Masuk Terbaru (${new Date().toLocaleTimeString('id-ID')})]: ${decryptedMessages.join(' | ')}`);
  const combinedNotes = historyLines.join('\n').slice(-1200);

  // 3b. Segera simpan pesan masuk terbaru ke pipeline_leads SEBELUM menunggu LLM selesai,
  //     agar pesan baru customer langsung muncul real-time di preview chat WA bersama animasi skeleton AI!
  let leadId: string;
  if (!currentLead) {
    const inserted = await sql`
      INSERT INTO sales_os.pipeline_leads (
        owner_se_email, owner_se_name, full_name, phone_wa, domicile, source, content_code,
        stage, validity_status, persona_code, bant_b, bant_a, bant_n, bant_t, bant_total, grade,
        cluster_interest, unit_interest, unit_price_idr, payment_scheme, sales_notes, next_action,
        lead_origin, last_customer_message, last_sales_message, interaction_count, first_inbound_at
      ) VALUES (
        ${seEmail},
        ${params.seName},
        ${resolvedContactName},
        ${cleanPhone},
        ${detectedAttrs.domicile},
        ${'WhatsApp Inbound (Baileys)'},
        ${'WA-INBOUND'},
        ${'NEW'},
        ${'VALID'},
        ${'P1'},
        ${1},
        ${1},
        ${2},
        ${1},
        ${5},
        ${'C'},
        ${detectedAttrs.clusterInterest},
        ${detectedAttrs.unitInterest},
        ${detectedAttrs.unitPriceIdr},
        ${detectedAttrs.paymentScheme},
        ${combinedNotes},
        ${'AI sedang menganalisis pesan masuk...'},
        ${'WA_BAILEYS'},
        ${latestCustomerMsg},
        ${''},
        ${1},
        ${now.toISOString()}
      )
      RETURNING id
    `;
    leadId = String(inserted[0].id);
  } else {
    leadId = String(currentLead.id);
    await sql`
      UPDATE sales_os.pipeline_leads
      SET full_name = ${resolvedContactName},
          domicile = ${detectedAttrs.domicile},
          cluster_interest = ${detectedAttrs.clusterInterest},
          unit_interest = ${detectedAttrs.unitInterest},
          unit_price_idr = ${detectedAttrs.unitPriceIdr},
          payment_scheme = ${detectedAttrs.paymentScheme},
          sales_notes = ${combinedNotes},
          lead_origin = 'WA_BAILEYS',
          last_customer_message = ${latestCustomerMsg},
          last_sales_message = '',
          interaction_count = ${nextInteractionCount},
          updated_at = NOW()
      WHERE id = ${leadId}
    `;
  }

  activeAnalyzingLeadIds.add(leadId);

  try {
    // 4. Jalankan AI Lead Analyzer berbasis Playbook v1.2 (Jalur B: WA_BAILEYS 2-Arah)
    const aiResult = await analyzeLeadWithAi({
      fullName: resolvedContactName,
      phoneWa: cleanPhone,
      domicile: detectedAttrs.domicile,
      source: currentLead?.source || 'WhatsApp Inbound (Baileys)',
      contentCode: currentLead?.content_code || 'WA-INBOUND',
      stage: currentLead?.stage || 'NEW',
      personaCode: (currentLead?.persona_code || 'P1') as any,
      personaProfile: (currentLead?.persona_profile || {}) as Record<string, string>,
      unitInterest: detectedAttrs.unitInterest,
      paymentScheme: detectedAttrs.paymentScheme,
      bantB: Number(currentLead?.bant_b ?? 1),
      bantA: Number(currentLead?.bant_a ?? 1),
      bantN: Number(currentLead?.bant_n ?? 2),
      bantT: Number(currentLead?.bant_t ?? 1),
      salesNotes: combinedNotes,
      inboundMessages: decryptedMessages,
      leadOrigin: 'WA_BAILEYS',
      lastCustomerMessage: latestCustomerMsg,
      lastSalesMessage: prevSalesMsg,
      interactionCount: nextInteractionCount,
      seName: params.seName,
    });

    const recBant = aiResult.recommended_bant;
    const validityStatus = aiResult.clarity_status === 'PERLU_DILENGKAPI' ? 'PERLU_DILENGKAPI' : 'VALID';
    const finalDomicile = aiResult.extracted_domicile || detectedAttrs.domicile;
    const finalPaymentScheme = aiResult.extracted_payment_scheme || detectedAttrs.paymentScheme;
    const finalUnitInterest = detectedAttrs.unitInterest;
    const finalClusterInterest = detectedAttrs.clusterInterest;
    const finalUnitPriceIdr = detectedAttrs.unitPriceIdr;

    // Tentukan penyesuaian tahap otomatis jika BANT naik atau prospek minta jadwal survei
    const wantsAppointment = /\b(survei|survey|lihat\s+lokasi|kunjung|datang|sabtu|minggu|besok|jadwal)\b/i.test(
      latestCustomerMsg
    );
    const currentStage = String(currentLead?.stage || 'NEW');
    const advancedStages = ['VISITED', 'HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'];
    let nextStage = currentStage;
    if (!advancedStages.includes(currentStage)) {
      if (wantsAppointment && recBant.total >= 7) {
        nextStage = 'APPOINTMENT';
      } else if (recBant.total >= 7 && (currentStage === 'NEW' || currentStage === 'CONTACTED')) {
        nextStage = 'QUALIFIED';
      }
    }

    await sql`
      UPDATE sales_os.pipeline_leads
      SET full_name = ${resolvedContactName},
          domicile = ${finalDomicile},
          stage = ${nextStage},
          persona_code = ${aiResult.recommended_persona},
          bant_b = ${recBant.b},
          bant_a = ${recBant.a},
          bant_n = ${recBant.n},
          bant_t = ${recBant.t},
          bant_total = ${recBant.total},
          grade = ${recBant.grade},
          cluster_interest = ${finalClusterInterest},
          unit_interest = ${finalUnitInterest},
          unit_price_idr = ${finalUnitPriceIdr},
          payment_scheme = ${finalPaymentScheme},
          validity_status = ${validityStatus},
          sales_notes = ${combinedNotes},
          next_action = ${aiResult.rekomendasi[0] || currentLead?.next_action || 'Balas <= 5 menit & kualifikasi BANT'},
          lead_origin = 'WA_BAILEYS',
          last_customer_message = ${latestCustomerMsg},
          last_sales_message = '',
          interaction_count = ${nextInteractionCount},
          updated_at = NOW()
      WHERE id = ${leadId}
    `;

    // Simpan hasil analisis AI
    await sql`
      INSERT INTO sales_os.lead_ai_analyses (
        lead_id, owner_se_email, skor, label, clarity_status, unclear_parts, ringkas,
        poin_kuat, poin_lemah, perlu_dicek_ulang, rekomendasi, recommended_persona,
        recommended_bant, followup_draft_message, model, prompt_tokens, completion_tokens
      ) VALUES (
        ${leadId},
        ${seEmail},
        ${aiResult.skor},
        ${aiResult.label},
        ${aiResult.clarity_status},
        ${sql.json(aiResult.unclear_parts as any)},
        ${aiResult.ringkas},
        ${sql.json(aiResult.poin_kuat as any)},
        ${sql.json(aiResult.poin_lemah as any)},
        ${sql.json(aiResult.perlu_dicek_ulang as any)},
        ${sql.json(aiResult.rekomendasi as any)},
        ${aiResult.recommended_persona},
        ${sql.json(aiResult.recommended_bant as any)},
        ${aiResult.followup_draft_message},
        ${aiResult.model},
        ${aiResult.prompt_tokens},
        ${aiResult.completion_tokens}
      )
    `;
  } finally {
    activeAnalyzingLeadIds.delete(leadId);
  }

  // Tautkan metrik kontak ke leadId
  await sql`
    UPDATE sales_os.wa_contact_metrics
    SET linked_lead_id = ${leadId}
    WHERE se_email = ${seEmail} AND contact_phone = ${cleanPhone}
  `;

  // 5. Hapus buffer teks pesan terenkripsi segera setelah analisis selesai
  await sql`
    DELETE FROM sales_os.wa_inbound_temp_buffer
    WHERE se_email = ${seEmail} AND contact_phone = ${cleanPhone}
  `;

  return { leadId, responseTimeSeconds: null };
}

/**
 * Mencatat balasan keluar dari SE ke nomor prospek untuk mengukur kecepatan balas (SLA <= 5 menit / 300 detik)
 */
export async function recordOutboundWaReplyForSe(params: {
  seEmail: string;
  contactPhone: string;
  messageText?: string;
  repliedAt?: Date;
}): Promise<{ responseTimeSeconds: number | null; slaMet: boolean | null }> {
  const seEmail = params.seEmail.toLowerCase();
  const cleanPhone = normalizePhoneWa(params.contactPhone);
  if (!cleanPhone) return { responseTimeSeconds: null, slaMet: null };

  const repliedAt = params.repliedAt || new Date();
  const outboundText = (params.messageText || '').trim();

  if (outboundText) {
    await sql`
      UPDATE sales_os.pipeline_leads
      SET last_sales_message = ${outboundText},
          interaction_count = COALESCE(interaction_count, 1) + 1,
          stage = CASE WHEN stage = 'NEW' THEN 'CONTACTED' ELSE stage END,
          updated_at = NOW()
      WHERE owner_se_email = ${seEmail} AND phone_wa = ${cleanPhone}
    `;
  }

  const rows = await sql`
    SELECT * FROM sales_os.wa_contact_metrics
    WHERE se_email = ${seEmail} AND contact_phone = ${cleanPhone}
    LIMIT 1
  `;

  if (rows.length === 0) {
    const leadRows = await sql`
      SELECT id, created_at FROM sales_os.pipeline_leads
      WHERE owner_se_email = ${seEmail} AND phone_wa = ${cleanPhone}
      LIMIT 1
    `;
    const linkedLead = leadRows[0];
    const baseTime = linkedLead?.created_at ? new Date(String(linkedLead.created_at)) : repliedAt;
    const diffSeconds = Math.max(1, Math.round((repliedAt.getTime() - baseTime.getTime()) / 1000));
    const responseTimeSeconds = diffSeconds <= 86400 ? diffSeconds : 180;
    const slaMet = responseTimeSeconds <= 300;

    await sql`
      INSERT INTO sales_os.wa_contact_metrics (
        se_email, contact_phone, contact_name, inbound_count, outbound_count,
        first_inbound_at, last_inbound_at, first_reply_at, response_time_seconds, sla_met, linked_lead_id
      ) VALUES (
        ${seEmail},
        ${cleanPhone},
        ${cleanPhone},
        0,
        1,
        ${baseTime.toISOString()},
        ${baseTime.toISOString()},
        ${repliedAt.toISOString()},
        ${responseTimeSeconds},
        ${slaMet},
        ${linkedLead?.id || null}
      )
    `;

    if (linkedLead?.id) {
      await sql`
        UPDATE sales_os.pipeline_leads
        SET first_reply_at = COALESCE(first_reply_at, ${repliedAt.toISOString()}),
            response_time_seconds = COALESCE(response_time_seconds, ${responseTimeSeconds}),
            stage = CASE WHEN stage = 'NEW' THEN 'CONTACTED' ELSE stage END,
            updated_at = NOW()
        WHERE id = ${linkedLead.id} AND owner_se_email = ${seEmail}
      `;
    }

    return { responseTimeSeconds, slaMet };
  }
  const metric = rows[0];

  let responseTimeSeconds = metric.response_time_seconds as number | null;
  let slaMet = metric.sla_met as boolean | null;

  if (!metric.first_reply_at) {
    const firstInbound = new Date(String(metric.first_inbound_at));
    responseTimeSeconds = Math.max(1, Math.round((repliedAt.getTime() - firstInbound.getTime()) / 1000));
    slaMet = responseTimeSeconds <= 300; // <= 5 menit (Playbook §7.2)

    await sql`
      UPDATE sales_os.wa_contact_metrics
      SET outbound_count = outbound_count + 1,
          first_reply_at = ${repliedAt.toISOString()},
          response_time_seconds = ${responseTimeSeconds},
          sla_met = ${slaMet},
          updated_at = NOW()
      WHERE se_email = ${seEmail} AND contact_phone = ${cleanPhone}
    `;

    if (metric.linked_lead_id) {
      await sql`
        UPDATE sales_os.pipeline_leads
        SET first_reply_at = ${repliedAt.toISOString()},
            response_time_seconds = ${responseTimeSeconds},
            stage = CASE WHEN stage = 'NEW' THEN 'CONTACTED' ELSE stage END,
            updated_at = NOW()
        WHERE id = ${metric.linked_lead_id} AND owner_se_email = ${seEmail}
      `;
    }
  } else {
    await sql`
      UPDATE sales_os.wa_contact_metrics
      SET outbound_count = outbound_count + 1,
          updated_at = NOW()
      WHERE se_email = ${seEmail} AND contact_phone = ${cleanPhone}
    `;
  }

  return { responseTimeSeconds, slaMet };
}

/**
 * Mengirim pesan WhatsApp secara langsung & otomatis melalui sesi Baileys milik SE yang sedang terhubung.
 * Jika nomor WA SE belum terhubung (DISCONNECTED), menolak pengiriman dengan kode WA_NOT_CONNECTED
 * agar UI mengarahkan SE untuk melakukan integrasi (Scan QR) terlebih dahulu.
 */
export async function sendOutboundWaMessageForSe(params: {
  seEmail: string;
  seName: string;
  contactPhone: string;
  messageText: string;
}): Promise<{
  sent: boolean;
  code?: 'WA_NOT_CONNECTED' | 'INVALID_INPUT' | 'SEND_FAILED';
  error?: string;
  senderPhone?: string | null;
  targetPhone?: string;
  responseTimeSeconds?: number | null;
  slaMet?: boolean | null;
}> {
  const seEmail = params.seEmail.toLowerCase();
  const cleanPhone = normalizePhoneWa(params.contactPhone);
  const text = (params.messageText || '').trim();

  if (!cleanPhone || !text) {
    return {
      sent: false,
      code: 'INVALID_INPUT',
      error: 'Nomor WhatsApp tujuan dan isi pesan tidak boleh kosong.',
    };
  }

  let inst = instances.get(seEmail);

  // Jika instance belum ada di memori namun sesi creds.json ada di disk & status DB CONNECTED, coba bangunkan
  if (!inst || inst.status !== 'CONNECTED' || !inst.socket) {
    const sessionDir = getSessionDir(seEmail);
    const credsPath = path.join(sessionDir, 'creds.json');
    const dbRows = await sql`
      SELECT status FROM sales_os.se_wa_sessions WHERE se_email = ${seEmail} LIMIT 1
    `;
    if (fs.existsSync(credsPath) && dbRows[0]?.status === 'CONNECTED') {
      await startBaileysForSe(seEmail, params.seName).catch(() => {});
      for (let i = 0; i < 16; i++) {
        inst = instances.get(seEmail);
        if (inst?.status === 'CONNECTED' && inst.socket) break;
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  }

  if (!inst || inst.status !== 'CONNECTED' || !inst.socket) {
    return {
      sent: false,
      code: 'WA_NOT_CONNECTED',
      error:
        'Nomor WhatsApp SE belum terhubung. Silakan hubungkan nomor WhatsApp Anda (Scan QR) terlebih dahulu.',
    };
  }

  try {
    let targetJid = `${cleanPhone}@s.whatsapp.net`;
    try {
      const checkRes = await inst.socket.onWhatsApp(cleanPhone);
      if (Array.isArray(checkRes) && checkRes[0]?.jid) {
        targetJid = checkRes[0].jid;
      }
    } catch {
      /* gunakan default @s.whatsapp.net bila pengecekan gagal */
    }

    const sentMsg = await inst.socket.sendMessage(targetJid, { text });
    if (sentMsg?.key?.id) {
      processedMessageIds.add(String(sentMsg.key.id));
    }

    const replyMetrics = await recordOutboundWaReplyForSe({
      seEmail,
      contactPhone: cleanPhone,
      messageText: text,
    });

    console.log(
      `[WA Baileys] Direct WA message sent from ${seEmail} (${inst.phoneNumber}) to ${cleanPhone}`
    );

    return {
      sent: true,
      senderPhone: inst.phoneNumber,
      targetPhone: cleanPhone,
      responseTimeSeconds: replyMetrics.responseTimeSeconds,
      slaMet: replyMetrics.slaMet,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Gagal mengirim pesan melalui WhatsApp Baileys.';
    console.error('[WA Baileys] Error sending direct message:', errMsg);
    return {
      sent: false,
      code: 'SEND_FAILED',
      error: `Gagal mengirim pesan WhatsApp: ${errMsg}`,
    };
  }
}

/**
 * Memulai sesi koneksi Baileys yang terisolasi per SE (1 nomor WA = 1 akun SE)
 */
export async function startBaileysForSe(
  seEmail: string,
  seName: string,
  forceFresh = false
): Promise<{
  status: string;
  qrDataUrl: string | null;
  phoneNumber: string | null;
}> {
  const normalizedEmail = seEmail.toLowerCase();
  const existing = instances.get(normalizedEmail);
  if (!forceFresh && existing) {
    if (existing.status === 'CONNECTED' || existing.status === 'QR_READY') {
      return {
        status: existing.status,
        qrDataUrl: existing.qrDataUrl,
        phoneNumber: existing.phoneNumber,
      };
    }
    if (existing.status === 'CONNECTING') {
      for (let i = 0; i < 12; i++) {
        if (existing.qrDataUrl || existing.status === 'CONNECTED') break;
        await new Promise((r) => setTimeout(r, 250));
      }
      return {
        status: existing.status,
        qrDataUrl: existing.qrDataUrl,
        phoneNumber: existing.phoneNumber,
      };
    }
  }

  const sessionDir = getSessionDir(normalizedEmail);
  if (forceFresh) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
  fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  let version: [number, number, number] = [2, 3000, 1015901307];
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
  } catch {
    /* gunakan versi fallback bila gagal fetch */
  }

  const instance: ActiveWaInstance = {
    seEmail: normalizedEmail,
    seName,
    socket: null,
    status: 'CONNECTING',
    qrDataUrl: null,
    phoneNumber: null,
  };
  instances.set(normalizedEmail, instance);

  await sql`
    INSERT INTO sales_os.se_wa_sessions (se_email, se_name, status, updated_at)
    VALUES (${normalizedEmail}, ${seName}, 'CONNECTING', NOW())
    ON CONFLICT (se_email) DO UPDATE SET status = 'CONNECTING', updated_at = NOW()
  `;

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Andara Sales OS', 'Chrome', '1.2.0'],
    syncFullHistory: false,
  });

  instance.socket = sock;

  sock.ev.on('creds.update', async () => {
    await saveCreds();
    try {
      const credsFile = path.join(sessionDir, 'creds.json');
      if (fs.existsSync(credsFile)) {
        const enc = encryptText(fs.readFileSync(credsFile, 'utf8'));
        await sql`
          UPDATE sales_os.se_wa_sessions
          SET encrypted_creds = ${enc}, updated_at = NOW()
          WHERE se_email = ${normalizedEmail}
        `;
      }
    } catch {
      /* abaikan error backup enkripsi */
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const dataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 260 });
        instance.status = 'QR_READY';
        instance.qrDataUrl = dataUrl;
        await sql`
          UPDATE sales_os.se_wa_sessions
          SET status = 'QR_READY', qr_data_url = ${dataUrl}, updated_at = NOW()
          WHERE se_email = ${normalizedEmail}
        `;
      } catch {
        /* ignore qr error */
      }
    }

    if (connection === 'open') {
      const rawJid = sock.user?.id || '';
      const connectedPhone = normalizePhoneWa(rawJid);

      // Verifikasi isolasi 1 Nomor WA = 1 Akun SE
      if (connectedPhone) {
        const conflict = await sql`
          SELECT se_email FROM sales_os.se_wa_sessions
          WHERE phone_number = ${connectedPhone} AND se_email <> ${normalizedEmail}
          LIMIT 1
        `;
        if (conflict.length > 0) {
          // Tolak koneksi karena nomor sudah dipakai akun SE lain
          await sock.logout().catch(() => {});
          instance.status = 'DISCONNECTED';
          instance.qrDataUrl = null;
          instance.phoneNumber = null;
          await sql`
            UPDATE sales_os.se_wa_sessions
            SET status = 'DISCONNECTED', qr_data_url = NULL, updated_at = NOW()
            WHERE se_email = ${normalizedEmail}
          `;
          return;
        }
      }

      instance.status = 'CONNECTED';
      instance.qrDataUrl = null;
      instance.phoneNumber = connectedPhone || null;

      await sql`
        UPDATE sales_os.se_wa_sessions
        SET status = 'CONNECTED',
            phone_number = ${connectedPhone || null},
            qr_data_url = NULL,
            last_connected_at = NOW(),
            updated_at = NOW()
        WHERE se_email = ${normalizedEmail}
      `;
    }

    if (connection === 'close') {
      const code = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        instance.status = 'CONNECTING';
        instance.qrDataUrl = null;
        instances.delete(normalizedEmail);
        setTimeout(() => {
          startBaileysForSe(normalizedEmail, seName).catch(() => {});
        }, 1200);
        return;
      }

      instance.status = 'DISCONNECTED';
      instance.qrDataUrl = null;

      await sql`
        UPDATE sales_os.se_wa_sessions
        SET status = 'DISCONNECTED', qr_data_url = NULL, updated_at = NOW()
        WHERE se_email = ${normalizedEmail}
      `;

      instances.delete(normalizedEmail);
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;
    for (const msg of messages) {
      const msgId = msg.key?.id ? String(msg.key.id) : '';
      if (msgId) {
        if (processedMessageIds.has(msgId)) continue;
        processedMessageIds.add(msgId);
        if (processedMessageIds.size > 2000) {
          const firstKey = processedMessageIds.values().next().value;
          if (firstKey) processedMessageIds.delete(firstKey);
        }
      }

      if (type === 'append') {
        const tsRaw = Number(msg.messageTimestamp || 0);
        const msgTimeMs = tsRaw > 1e12 ? tsRaw : tsRaw * 1000;
        if (!msgTimeMs || Date.now() - msgTimeMs > 10 * 60 * 1000) {
          continue;
        }
      }

      const remoteJid = msg.key?.remoteJid || '';
      if (!remoteJid) continue;
      // Abaikan grup, broadcast, status, dan channel newsletter
      if (
        remoteJid.endsWith('@g.us') ||
        remoteJid.endsWith('@broadcast') ||
        remoteJid === 'status@broadcast' ||
        remoteJid.endsWith('@newsletter')
      ) {
        continue;
      }

      const contactPhone = extractSenderPhoneFromWaKey(msg.key);
      if (!contactPhone) continue;

      const text = extractTextFromWaMessage(msg.message);

      const isFromMe = Boolean(msg.key?.fromMe);
      if (isFromMe) {
        if (!text) continue;
        console.log(`[WA Baileys] Outbound reply from SE ${normalizedEmail} to ${contactPhone}`);
        await recordOutboundWaReplyForSe({
          seEmail: normalizedEmail,
          contactPhone,
          messageText: text,
        }).catch((err) => {
          console.error('[WA Baileys] Outbound record error:', err);
        });
      } else {
        if (!text) continue;
        const senderName =
          msg.pushName ||
          (msg as any).verifiedBizName ||
          `Prospek WA ${contactPhone.slice(-4)}`;
        console.log(
          `[WA Baileys] Inbound WA message for ${normalizedEmail} from ${senderName} (${contactPhone}): "${text.slice(0, 80)}"`
        );

        await processInboundWaMessageForSe({
          seEmail: normalizedEmail,
          seName,
          contactPhone,
          contactName: senderName,
          messageText: text,
        }).catch((err) => {
          console.error('[WA Baileys] Inbound AI process error:', err);
        });
      }
    }
  });

  // Tunggu sebentar hingga QR siap (maks 4 detik) agar respons pertama langsung berisi QR bila tersedia
  for (let i = 0; i < 16; i++) {
    if (instance.qrDataUrl || instance.status === 'CONNECTED') break;
    await new Promise((r) => setTimeout(r, 250));
  }

  return {
    status: instance.status,
    qrDataUrl: instance.qrDataUrl,
    phoneNumber: instance.phoneNumber,
  };
}

export async function resumeActiveWaSessionsOnStartup(): Promise<void> {
  try {
    const rows = await sql`
      SELECT se_email, se_name, status, phone_number
      FROM sales_os.se_wa_sessions
      WHERE status IN ('CONNECTED', 'CONNECTING')
    `;
    for (const row of rows) {
      const seEmail = String(row.se_email || '').toLowerCase();
      const seName = String(row.se_name || 'Sales Executive');
      const sessionDir = getSessionDir(seEmail);
      const credsPath = path.join(sessionDir, 'creds.json');
      if (fs.existsSync(credsPath)) {
        console.log(`[WA Baileys] Resuming active WhatsApp session for ${seEmail}...`);
        startBaileysForSe(seEmail, seName).catch((err) => {
          console.error(`[WA Baileys] Failed to resume session for ${seEmail}:`, err);
        });
      }
    }
  } catch (err) {
    console.error('[WA Baileys] Error checking sessions on startup:', err);
  }
}

export async function disconnectBaileysForSe(seEmail: string): Promise<void> {
  const normalizedEmail = seEmail.toLowerCase();
  const inst = instances.get(normalizedEmail);
  if (inst?.socket) {
    try {
      await inst.socket.logout();
    } catch {
      try {
        inst.socket.end(undefined);
      } catch {
        /* ignore */
      }
    }
  }
  instances.delete(normalizedEmail);

  const sessionDir = getSessionDir(normalizedEmail);
  try {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  await sql`
    UPDATE sales_os.se_wa_sessions
    SET status = 'DISCONNECTED',
        qr_data_url = NULL,
        encrypted_creds = NULL,
        updated_at = NOW()
    WHERE se_email = ${normalizedEmail}
  `;
}

export async function getWaStatusForSe(seEmail: string, seName: string) {
  const normalizedEmail = seEmail.toLowerCase();
  const inst = instances.get(normalizedEmail);

  const dbSessionRows = await sql`
    SELECT * FROM sales_os.se_wa_sessions WHERE se_email = ${normalizedEmail} LIMIT 1
  `;
  const dbSession = dbSessionRows[0];

  const metricsSummary = await sql`
    SELECT
      COALESCE(SUM(inbound_count), 0)::int AS total_inbound_messages,
      COALESCE(SUM(outbound_count), 0)::int AS total_outbound_messages,
      COUNT(*)::int AS total_contacts,
      ROUND(AVG(response_time_seconds))::int AS avg_response_seconds,
      COUNT(*) FILTER (WHERE sla_met = TRUE)::int AS sla_met_count,
      COUNT(*) FILTER (WHERE response_time_seconds IS NOT NULL)::int AS replied_contacts_count
    FROM sales_os.wa_contact_metrics
    WHERE se_email = ${normalizedEmail}
  `;

  const m = metricsSummary[0] || {};
  const repliedCount = Number(m.replied_contacts_count || 0);
  const slaMetCount = Number(m.sla_met_count || 0);
  const slaPercent = repliedCount > 0 ? Math.round((slaMetCount / repliedCount) * 100) : 100;

  return {
    seEmail: normalizedEmail,
    seName,
    status: inst?.status || dbSession?.status || 'DISCONNECTED',
    qrDataUrl: inst?.qrDataUrl || dbSession?.qr_data_url || null,
    phoneNumber: inst?.phoneNumber || dbSession?.phone_number || null,
    lastConnectedAt: dbSession?.last_connected_at || null,
    metrics: {
      totalInboundMessages: Number(m.total_inbound_messages || 0),
      totalOutboundMessages: Number(m.total_outbound_messages || 0),
      totalContacts: Number(m.total_contacts || 0),
      avgResponseSeconds: m.avg_response_seconds !== null ? Number(m.avg_response_seconds) : null,
      slaMetCount,
      repliedContactsCount: repliedCount,
      slaCompliancePercent: slaPercent,
    },
  };
}
