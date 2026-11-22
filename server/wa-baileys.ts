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

function getSessionDir(seEmail: string): string {
  const hash = crypto.createHash('sha256').update(seEmail.toLowerCase()).digest('hex').slice(0, 24);
  return path.join(process.cwd(), 'server', '.baileys-sessions', `se_${hash}`);
}

export function normalizePhoneWa(raw: string): string {
  const digits = raw.replace(/@.*$/, '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
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
  const combinedNotes = currentLead
    ? `${currentLead.sales_notes || ''}\n[Ringkasan Pesan Masuk WA]: ${decryptedMessages.join(' | ')}`.trim()
    : `Pesan Masuk WhatsApp: ${decryptedMessages.join(' | ')}`;

  // 4. Jalankan AI Lead Analyzer berbasis Playbook v1.2
  const aiResult = await analyzeLeadWithAi({
    fullName: currentLead?.full_name || params.contactName || `Prospek WA ${cleanPhone.slice(-4)}`,
    phoneWa: cleanPhone,
    domicile: currentLead?.domicile || 'Sukoharjo / Solo Raya',
    source: currentLead?.source || 'WhatsApp Inbound (Baileys)',
    contentCode: currentLead?.content_code || 'WA-INBOUND',
    stage: currentLead?.stage || 'NEW',
    personaCode: (currentLead?.persona_code || 'P1') as any,
    personaProfile: (currentLead?.persona_profile || {}) as Record<string, string>,
    unitInterest: currentLead?.unit_interest || 'Nagoya B.02 (LT 63/LB 75 · Gold 3KT)',
    paymentScheme: currentLead?.payment_scheme || 'KPR',
    bantB: Number(currentLead?.bant_b ?? 1),
    bantA: Number(currentLead?.bant_a ?? 1),
    bantN: Number(currentLead?.bant_n ?? 2),
    bantT: Number(currentLead?.bant_t ?? 1),
    salesNotes: combinedNotes,
    inboundMessages: decryptedMessages,
    seName: params.seName,
  });

  const recBant = aiResult.recommended_bant;
  const validityStatus = aiResult.clarity_status === 'PERLU_DILENGKAPI' ? 'PERLU_DILENGKAPI' : 'VALID';

  let leadId: string;
  if (!currentLead) {
    const inserted = await sql`
      INSERT INTO sales_os.pipeline_leads (
        owner_se_email, owner_se_name, full_name, phone_wa, domicile, source, content_code,
        stage, validity_status, persona_code, bant_b, bant_a, bant_n, bant_t, bant_total, grade,
        unit_interest, payment_scheme, sales_notes, next_action, first_inbound_at
      ) VALUES (
        ${seEmail},
        ${params.seName},
        ${params.contactName || `Prospek WA ${cleanPhone.slice(-4)}`},
        ${cleanPhone},
        ${'Sukoharjo / Solo Raya'},
        ${'WhatsApp Inbound (Baileys)'},
        ${'WA-INBOUND'},
        ${recBant.total >= 7 ? 'QUALIFIED' : 'NEW'},
        ${validityStatus},
        ${aiResult.recommended_persona},
        ${recBant.b},
        ${recBant.a},
        ${recBant.n},
        ${recBant.t},
        ${recBant.total},
        ${recBant.grade},
        ${'Nagoya B.02 (LT 63/LB 75 · Gold 3KT)'},
        ${'KPR'},
        ${aiResult.ringkas},
        ${aiResult.rekomendasi[0] || 'Balas <= 5 menit & kualifikasi BANT'},
        ${now.toISOString()}
      )
      RETURNING id
    `;
    leadId = String(inserted[0].id);
  } else {
    leadId = String(currentLead.id);
    await sql`
      UPDATE sales_os.pipeline_leads
      SET persona_code = ${aiResult.recommended_persona},
          bant_b = ${recBant.b},
          bant_a = ${recBant.a},
          bant_n = ${recBant.n},
          bant_t = ${recBant.t},
          bant_total = ${recBant.total},
          grade = ${recBant.grade},
          validity_status = ${validityStatus},
          next_action = ${aiResult.rekomendasi[0] || currentLead.next_action},
          updated_at = NOW()
      WHERE id = ${leadId}
    `;
  }

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
  repliedAt?: Date;
}): Promise<{ responseTimeSeconds: number | null; slaMet: boolean | null }> {
  const seEmail = params.seEmail.toLowerCase();
  const cleanPhone = normalizePhoneWa(params.contactPhone);
  if (!cleanPhone) return { responseTimeSeconds: null, slaMet: null };

  const repliedAt = params.repliedAt || new Date();
  const rows = await sql`
    SELECT * FROM sales_os.wa_contact_metrics
    WHERE se_email = ${seEmail} AND contact_phone = ${cleanPhone}
    LIMIT 1
  `;

  if (rows.length === 0) return { responseTimeSeconds: null, slaMet: null };
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
 * Memulai sesi koneksi Baileys yang terisolasi per SE (1 nomor WA = 1 akun SE)
 */
export async function startBaileysForSe(seEmail: string, seName: string): Promise<{
  status: string;
  qrDataUrl: string | null;
  phoneNumber: string | null;
}> {
  const normalizedEmail = seEmail.toLowerCase();
  const existing = instances.get(normalizedEmail);
  if (existing && (existing.status === 'CONNECTED' || existing.status === 'QR_READY')) {
    return {
      status: existing.status,
      qrDataUrl: existing.qrDataUrl,
      phoneNumber: existing.phoneNumber,
    };
  }

  const sessionDir = getSessionDir(normalizedEmail);
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
      instance.status = 'DISCONNECTED';
      instance.qrDataUrl = null;

      await sql`
        UPDATE sales_os.se_wa_sessions
        SET status = 'DISCONNECTED', qr_data_url = NULL, updated_at = NOW()
        WHERE se_email = ${normalizedEmail}
      `;

      if (!shouldReconnect) {
        instances.delete(normalizedEmail);
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      const remoteJid = msg.key?.remoteJid || '';
      // Abaikan grup, broadcast, dan status
      if (!remoteJid.endsWith('@s.whatsapp.net')) continue;

      const contactPhone = normalizePhoneWa(remoteJid);
      if (!contactPhone) continue;

      const isFromMe = Boolean(msg.key?.fromMe);
      if (isFromMe) {
        await recordOutboundWaReplyForSe({
          seEmail: normalizedEmail,
          contactPhone,
        }).catch(() => {});
      } else {
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          '';
        if (!text.trim()) continue;

        await processInboundWaMessageForSe({
          seEmail: normalizedEmail,
          seName,
          contactPhone,
          contactName: msg.pushName || `Prospek WA ${contactPhone.slice(-4)}`,
          messageText: text,
        }).catch(() => {});
      }
    }
  });

  // Tunggu sebentar hingga QR siap (maks 2.5 detik) agar respons pertama langsung berisi QR bila tersedia
  for (let i = 0; i < 10; i++) {
    if (instance.qrDataUrl || instance.status === 'CONNECTED') break;
    await new Promise((r) => setTimeout(r, 250));
  }

  return {
    status: instance.status,
    qrDataUrl: instance.qrDataUrl,
    phoneNumber: instance.phoneNumber,
  };
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
