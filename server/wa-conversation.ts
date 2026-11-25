// Riwayat percakapan WA per kontak: terenkripsi, maksimal 10 giliran terakhir, umur maksimal 30 hari.
import { sql } from './db';
import { decryptText, encryptText } from './crypto-util';
import { similarity, type ChatTurn } from './wa-turn-engine';

export const MAX_TURNS = 10;
const DUPLICATE_WINDOW_MS = 2 * 60_000;

export async function saveTurn(p: {
  seEmail: string;
  phone: string;
  from: ChatTurn['from'];
  text: string;
  at: Date;
  /** Draf AI terakhir, untuk mengukur seberapa banyak SE mengubahnya. */
  aiDraft?: string;
}): Promise<void> {
  const text = p.text.trim();
  if (!text) return;
  const last = (await getTurns(p.seEmail, p.phone)).pop();
  // Balasan dari tombol sistem juga muncul lagi sebagai event WA; jangan tercatat dua kali.
  if (last && last.from === p.from && last.text === text && Math.abs(p.at.getTime() - new Date(last.at).getTime()) < DUPLICATE_WINDOW_MS) return;
  await sql`
    INSERT INTO sales_os.wa_conversation_turns (se_email, contact_phone, direction, encrypted_text, draft_similarity, sent_at)
    VALUES (${p.seEmail}, ${p.phone}, ${p.from}, ${encryptText(text)}, ${p.from === 'sales' && p.aiDraft ? similarity(p.aiDraft, text) : null}, ${p.at.toISOString()})
  `;
  await sql`
    DELETE FROM sales_os.wa_conversation_turns
    WHERE expires_at < NOW()
       OR (se_email = ${p.seEmail} AND contact_phone = ${p.phone} AND id NOT IN (
            SELECT id FROM sales_os.wa_conversation_turns
            WHERE se_email = ${p.seEmail} AND contact_phone = ${p.phone}
            ORDER BY sent_at DESC, id DESC LIMIT ${MAX_TURNS}
          ))
  `;
}

function decode(rows: any[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const r of rows) {
    try {
      out.push({ from: r.direction === 'sales' ? 'sales' : 'customer', text: decryptText(String(r.encrypted_text)), at: new Date(r.sent_at).toISOString() });
    } catch {
      /* baris yang tidak bisa didekripsi dilewati */
    }
  }
  return out;
}

/** Urut lama -> baru. */
export async function getTurns(seEmail: string, phone: string): Promise<ChatTurn[]> {
  const rows = await sql`
    SELECT direction, encrypted_text, sent_at FROM sales_os.wa_conversation_turns
    WHERE se_email = ${seEmail} AND contact_phone = ${phone} AND expires_at >= NOW()
    ORDER BY sent_at DESC, id DESC LIMIT ${MAX_TURNS}
  `;
  return decode(rows.reverse());
}

/** Riwayat untuk banyak lead sekaligus (daftar pipeline). Kunci: "email|nomor". */
export async function getTurnsForLeads(leads: Array<{ owner_se_email?: unknown; phone_wa?: unknown }>): Promise<Map<string, ChatTurn[]>> {
  const emails = [...new Set(leads.map((l) => String(l.owner_se_email || '').toLowerCase()).filter(Boolean))];
  const phones = [...new Set(leads.map((l) => String(l.phone_wa || '')).filter(Boolean))];
  const map = new Map<string, ChatTurn[]>();
  if (emails.length === 0 || phones.length === 0) return map;
  const rows = await sql`
    SELECT se_email, contact_phone, direction, encrypted_text, sent_at FROM sales_os.wa_conversation_turns
    WHERE se_email IN ${sql(emails)} AND contact_phone IN ${sql(phones)} AND expires_at >= NOW()
    ORDER BY sent_at ASC, id ASC
  `;
  for (const r of rows) {
    const key = `${r.se_email}|${r.contact_phone}`;
    map.set(key, [...(map.get(key) || []), ...decode([r])]);
  }
  return map;
}
