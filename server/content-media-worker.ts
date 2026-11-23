// ============================================================================
// HERMES AI CONTENT & MEDIA WORKER - DEVELOPER SALES OS
// Per-SE Unique AI Brief/Prompt + Non-Blocking Background Queue & Partial Pull
// ============================================================================

import fs from 'node:fs/promises';
import path from 'node:path';
import { sql } from './db';
import {
  PLAYBOOK_AI_KNOWLEDGE_CONTEXT,
  PLAYBOOK_BUYER_PERSONAS,
  PLAYBOOK_UNIT_CATALOG,
  type PersonaCode,
} from '../src/lib/kb/playbook-v1-2-knowledge';
import { composeBrandedReelsVideo, type SubtitleSegment } from './video-composer';

export const MEDIA_OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'generated-media');

const HERMES_API_URL = (process.env.HERMES_API_URL || 'https://hermes.giivepro.com').replace(/\/+$/, '');
const HERMES_API_KEY = process.env.FLOW_API_KEY || 'kzjsGMv5mYYaku8Teb5ATc9ZxyJAqWVVJZLA3iQI';

export interface HermesJobEntry {
  slideIndex: number;
  jobId: string;
  status: 'pending' | 'done' | 'failed';
  localUrl?: string;
  error?: string;
}

export interface HermesHealthInfo {
  ok: boolean;
  chrome_ready?: boolean;
  active_account?: string;
  account_status?: string;
  queue_size?: number;
}

export interface SlideDeckItem {
  slideNumber?: number;
  role?: string;
  kicker: string;
  headline: string;
  subheadline: string;
  visualPrompt: string;
  badgePrice?: string;
}

export interface GeneratedSlotSpec {
  slotOrder: 1 | 2 | 3;
  scheduledTime: string;
  funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
  platform: 'Instagram' | 'TikTok' | 'Facebook' | 'YouTube Shorts';
  format: 'Carousel Edukasi' | 'Single Image + Visual Quote' | 'Reels / Video Pendek';
  hook?: string;
  title: string;
  brief: string;
  visualPrompt: string;
  caption: string;
  hashtags: string[];
  cta: string;
  durationSeconds: number;
  personaCode?: string;
  slideDeck?: SlideDeckItem[];
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getWibClock(): { dateStr: string; minutesOfDay: number } {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const dateStr = wib.toISOString().slice(0, 10);
  const minutesOfDay = wib.getUTCHours() * 60 + wib.getUTCMinutes();
  return { dateStr, minutesOfDay };
}

export interface BusyWindowInfo {
  busy: boolean;
  slotOrder?: 1 | 2 | 3;
  windowLabel?: string;
  unlockTime?: string;
  reason?: string;
}

export function getBusyWindowInfo(minutesOfDay: number): BusyWindowInfo {
  if (minutesOfDay >= 8 * 60 + 30 && minutesOfDay <= 9 * 60) {
    return {
      busy: true,
      slotOrder: 1,
      windowLabel: '08:30–09:00 WIB',
      unlockTime: '09:01 WIB',
      reason:
        'Sedang waktu sibuk generate terjadwal Slot Pagi (TOFU 09:00 WIB) agar semua SE siap tepat waktu. Generate manual dibuka kembali pukul 09:01 WIB.',
    };
  }
  if (minutesOfDay >= 13 * 60 + 30 && minutesOfDay <= 14 * 60) {
    return {
      busy: true,
      slotOrder: 2,
      windowLabel: '13:30–14:00 WIB',
      unlockTime: '14:01 WIB',
      reason:
        'Sedang waktu sibuk generate terjadwal Slot Siang (MOFU 14:00 WIB) agar semua SE siap tepat waktu. Generate manual dibuka kembali pukul 14:01 WIB.',
    };
  }
  if (minutesOfDay >= 19 * 60 && minutesOfDay <= 19 * 60 + 30) {
    return {
      busy: true,
      slotOrder: 3,
      windowLabel: '19:00–19:30 WIB',
      unlockTime: '19:31 WIB',
      reason:
        'Sedang waktu sibuk generate terjadwal Slot Malam (BOFU 19:30 WIB) agar semua SE siap tepat waktu. Generate manual dibuka kembali pukul 19:31 WIB.',
    };
  }
  return { busy: false };
}

export function isSlotDueNowWib(slotOrder: number, minutesOfDay: number): boolean {
  if (slotOrder === 1) return minutesOfDay >= 8 * 60 + 30; // 08:30 WIB
  if (slotOrder === 2) return minutesOfDay >= 13 * 60 + 30; // 13:30 WIB
  if (slotOrder === 3) return minutesOfDay >= 19 * 60; // 19:00 WIB
  return false;
}

export async function getHermesHealth(): Promise<HermesHealthInfo> {
  try {
    const res = await fetch(`${HERMES_API_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false };
    return (await res.json()) as HermesHealthInfo;
  } catch {
    return { ok: false };
  }
}

/**
 * Generates 3 unique AI slots (TOFU, MOFU, BOFU) for a specific SE & day.
 */
const BRAND_VISUAL_DNA =
  'Consistent unified architectural identity for The Park Townhouse Sukoharjo: modern 2-story white minimalist tropical Japandi townhouses, clean dark sloping roofs, warm natural teak wood soffits and eaves, black-framed glass windows, neat grey cobblestone paving cluster street, lush sunlit emerald tropical leaves framing corners with soft bokeh, warm golden-hour sunset lighting with radiant sunbeams, clean blank minimalist white architectural facades free of any lettering on individual houses.';

function formatIdrShort(idr: number): string {
  if (idr >= 1_000_000_000) {
    const m = (idr / 1_000_000_000).toFixed(3).replace(/\.?0+$/, '').replace('.', ',');
    return `Rp${m} Miliar`;
  }
  return `Rp${Math.round(idr / 1_000_000)} Juta`;
}

function formatBadgePrice(idr: number): string {
  if (idr >= 1_000_000_000) {
    const m = (idr / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
    return `${m} MILIAR`;
  }
  return `${Math.round(idr / 1_000_000)} JUTAAN`;
}

/**
 * Enforces Playbook v1.2 Bab 7.11 compliance & anti-hallucination guardrails:
 * removes prohibited promises and prevents fabricated sub-650jt prices.
 */
function enforcePlaybookCompliance(text: string): string {
  return (text || '')
    .replace(/\bpasti\s+untung\b/gi, 'berpotensi bernilai investasi baik')
    .replace(/\bpasti\s+naik(\s+harga)?\b/gi, 'berpotensi tumbuh nilainya')
    .replace(/\bbebas\s+banjir\b/gi, 'dengan drainase cluster tertata rapi')
    .replace(/\bpasti\s+(disetujui|lolos)\s+kpr\b/gi, 'didampingi penuh dalam proses pengajuan KPR')
    .replace(/\b500\s*juta(an)?\b/gi, '650 jutaan')
    .replace(/Rp\s?500(\.000\.000)?\b/gi, 'Rp650 juta');
}

function sanitizeVisualPrompt(prompt: string, seName?: string): string {
  let cleaned = enforcePlaybookCompliance(prompt || '');
  if (seName) {
    const tokens = seName
      .trim()
      .split(/\s+/)
      .filter((t) => t.length >= 3);
    if (seName.trim().length >= 3) {
      cleaned = cleaned.replace(new RegExp(seName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
    }
    for (const token of tokens) {
      cleaned = cleaned.replace(new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), '');
    }
  }
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

const CONTENT_PILLARS = [
  {
    code: 'ARSITEKTUR_GARASI',
    label: 'Arsitektur Japandi Modern & Garasi Dalam',
    focus: 'Townhouse boutique 2 lantai Japandi Modern, garasi dalam (Gold 1 garasi + 1 carport; Diamond 2 garasi + 1 carport), tata ruang fungsional 3KT–4KT.',
  },
  {
    code: 'CLUBHOUSE_LIFESTYLE',
    label: 'Clubhouse Lengkap Tanpa Biaya Membership Terpisah',
    focus: 'Clubhouse di Cluster Nagoya: kolam renang, gym, cafe & resto, ruang meeting, lounge, mini golf 9 hole, game station (PS, Nintendo, TV 4K).',
  },
  {
    code: 'SMART_SECURITY',
    label: 'Keamanan Berlapis One-Gate RFID & Smart Living',
    focus: 'One-gate RFID, satpam 24 jam, CCTV 4K rekaman 30 hari, smart door lock (PIN/sidik jari/RFID/HP), aplikasi Andara Living, concierge 24/7, EV-charging-ready.',
  },
  {
    code: 'KOMPARASI_VALUE',
    label: 'Komparasi Cerdas: The Park vs Rumah Second & Bangun Sendiri',
    focus: 'Bangunan baru tanpa biaya renovasi dibanding rumah second Solo Baru/Grogol, tanpa repot tukang & izin dibanding bangun sendiri, lingkungan homogen.',
  },
  {
    code: 'LOKASI_KORIDOR',
    label: 'Lokasi Strategis Jombor, Bendosari & Koridor Sudirman',
    focus: 'Cluster Nagoya di Jl. Tentara Pelajar, Cluster Osaka & Tokyo di koridor Jl. Jenderal Sudirman Kp. Duabelasan Sukoharjo.',
  },
  {
    code: 'SKEMA_BAYAR_TIMING',
    label: 'Skema Bayar Fleksibel & Momentum Harga November',
    focus: 'Cash keras, Cash Tempo 12/24 bulan (CT12/CT24), KPR DP 10% paralel 2 bank, Booking Fee Rp5.000.000 ke rekening resmi PT Andara Rejo Makmur, daftar harga Desember naik ±7–8%.',
  },
];

function buildFlowNativePosterPrompt(params: {
  kicker: string;
  headline: string;
  subheadline: string;
  sceneVisual: string;
  slideIndex?: number;
  totalSlides?: number;
  badgePrice?: string;
}): string {
  const safeKicker = enforcePlaybookCompliance(params.kicker).replace(/["']/g, '').trim();
  const safeHeadline = enforcePlaybookCompliance(params.headline).replace(/["']/g, '').trim().toUpperCase();
  const safeSubheadline = enforcePlaybookCompliance(params.subheadline).replace(/["']/g, '').trim().toUpperCase();
  const isCover = !params.slideIndex || params.slideIndex === 1;
  const slideTag =
    params.totalSlides && params.totalSlides > 1 && params.slideIndex
      ? `Series visual consistency: Slide ${params.slideIndex} of ${params.totalSlides} in a cohesive luxury real estate carousel magazine.`
      : 'Standalone flagship luxury real estate campaign poster.';

  const headerBlock = isCover
    ? `- Top center: refined minimalist architectural crest icon above "THE PARK" (large bold serif), "TOWNHOUSE" (medium spaced), and "SUKOHARJO" (wide-tracked).
- Expressive flowing handwritten calligraphy script: "${safeKicker}" flanked by delicate dark-green leaf sprigs.
- Massive, commanding high-contrast display serif headline: "${safeHeadline}"
- Clean uppercase subtitle: "${safeSubheadline}" with a tiny leaf ornament below.`
    : `- Top center subtle brand mark: small clean serif text "THE PARK TOWNHOUSE · SUKOHARJO".
- Expressive flowing handwritten calligraphy script: "${safeKicker}" flanked by delicate dark-green leaf sprigs.
- Bold commanding high-contrast display serif headline: "${safeHeadline}"
- Clean uppercase subtitle: "${safeSubheadline}" with a tiny leaf ornament below.`;

  const badgeBlock = params.badgePrice
    ? `\nLOWER-LEFT MEDALLION BADGE:\nAn ornate cream parchment scalloped-seal badge glowing in warm sunlight, reading in bold deep green serif: "HARGA MULAI" / "${params.badgePrice.split(' ')[0]}" (huge) / "${params.badgePrice.split(' ').slice(1).join(' ') || 'JUTAAN'}".`
    : '';

  return `Cinematic, grand, warmly atmospheric luxury real estate marketing poster, vertical 3:4 portrait, shot like an award-winning lifestyle & architectural campaign, full-bleed edge-to-edge photography from top to bottom. ${slideTag}

ARCHITECTURAL SCENE & GOLDEN HOUR DRAMA:
${params.sceneVisual}
${BRAND_VISUAL_DNA}
Radiant warm golden-hour sunbeams and soft amber interior glow through tall glass windows. Full-bleed natural ground or interior flooring extending seamlessly all the way to the very bottom edge of the frame, framed softly at outer corners by sunlit emerald tropical foliage with natural depth-of-field bokeh.

RICH EDITORIAL TYPOGRAPHY IN THE LUMINOUS UPPER SKY/NEGATIVE SPACE (upper 42%, in deep emerald forest green #0B3D2E):
${headerBlock}${badgeBlock}

Warm, inviting, grand, deeply atmospheric, crisp typo-free Indonesian editorial typography, photorealistic, 8k.`;
}

export async function generateUniqueDaySlotsWithAi(
  seEmail: string,
  seName: string,
  dayNumber: number
): Promise<GeneratedSlotSpec[]> {
  const seed = hashStr(`${seEmail.toLowerCase()}:day-${dayNumber}`);
  const personaKeys: PersonaCode[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
  const personaCode = personaKeys[(seed + dayNumber) % personaKeys.length];
  const persona = PLAYBOOK_BUYER_PERSONAS[personaCode];
  const unitFocus = PLAYBOOK_UNIT_CATALOG[(seed + dayNumber * 3) % PLAYBOOK_UNIT_CATALOG.length];
  const pillar = CONTENT_PILLARS[(seed + dayNumber * 5) % CONTENT_PILLARS.length];
  const unitCashLabel = formatIdrShort(unitFocus.priceCashIdr);
  const unitKprLabel = formatIdrShort(unitFocus.priceKprIdr);
  const unitBadge = formatBadgePrice(unitFocus.priceCashIdr);
  const reelsDur1 = 15 + (seed % 3) * 5;
  const reelsDur2 = 20 + (seed % 3) * 5;

  // Variasi format lintas hari:
  // Slot 1 (TOFU): selalu Carousel Edukasi 5 slide
  // Slot 2 (MOFU): bergantian antara Carousel Edukasi (bedah unit/fasilitas) & Reels / Video Pendek
  // Slot 3 (BOFU): bergantian antara Single Image + Visual Quote (flagship poster) & Reels / Video Pendek
  const slot2Format: GeneratedSlotSpec['format'] =
    dayNumber % 2 === 0 ? 'Carousel Edukasi' : 'Reels / Video Pendek';
  const slot3Format: GeneratedSlotSpec['format'] =
    dayNumber % 2 === 1 ? 'Single Image + Visual Quote' : 'Reels / Video Pendek';

  // Ambil daftar judul yang sudah pernah dibuat untuk akun SE ini agar 100% unik
  let existingTitles: string[] = [];
  try {
    const prevRows = await sql`
      SELECT title FROM sales_os.se_content_slots
      WHERE se_email = ${seEmail} AND title IS NOT NULL AND title <> ''
      ORDER BY day_number DESC, slot_order DESC
      LIMIT 30
    `;
    existingTitles = prevRows.map((r) => String(r.title));
  } catch {
    existingTitles = [];
  }

  const baseUrl = (
    process.env.AI_ROUTER_URL ||
    process.env.OPENAI_BASE_URL ||
    'https://9router.giivepro.com/v1'
  ).replace(/\/+$/, '');
  const apiKey = process.env.AI_ROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
  const model =
    process.env.AI_ROUTER_MODEL || process.env.OPENAI_MODEL || 'andararejomakmurjosjis';

  if (baseUrl && apiKey) {
    try {
      const prompt = `Kamu adalah Creative Director Properti & Strategist Konten untuk Sales Executive "${seName}".
WAJIB 100% BERDASARKAN DATA RESMI PLAYBOOK V1.2 DI BAWAH INI — DILARANG KERAS MENGARANG HARGA, SPESIFIKASI, ATAU JANJI TERLARANG:

${PLAYBOOK_AI_KNOWLEDGE_CONTEXT}

TARGET HARI KE-${dayNumber} (KHUSUS AKUN ${seName}):
- Persona Utama: ${persona.code} — ${persona.name} (${persona.archetype})
  * Profil: ${persona.profil}
  * Kondisi Saat Ini: ${persona.kondisiSaatIni}
  * Motivasi: ${persona.motivasi}
  * Kekhawatiran: ${persona.kekhawatiran}
  * Keunggulan Pemicu: ${persona.keunggulanPemicu}
  * Opening Hook Playbook: ${persona.openingHook}
  * Pendekatan Closing: ${persona.pendekatanClosing}
- Unit Fokus Hari Ini: ${unitFocus.label} (Cluster ${unitFocus.cluster}, Cash ${unitCashLabel} / KPR ${unitKprLabel}, segmen ${unitFocus.group})
- Pilar Tema Hari Ini: ${pillar.label} — ${pillar.focus}

DAFTAR JUDUL YANG SUDAH TERPAKAI (WAJIB UNIK — DILARANG MENGULANG TOPIK/ANGLE YANG SAMA):
${existingTitles.length > 0 ? existingTitles.map((t, i) => `${i + 1}. ${t}`).join('\n') : '(Belum ada — ini batch pertama)'}

ATURAN WAJIB ANTI-HALUSINASI & KEPATUHAN (BAB 7.11):
1. Harga entry resmi Nov 2026 mulai Rp650 juta cash (Rp683 juta KPR) untuk Nagoya B.02/B.03/B.04. DILARANG menulis "500 jutaan" atau harga di bawah Rp650 juta.
2. DILARANG menjanjikan "pasti untung", "pasti naik", "bebas banjir", "pasti disetujui KPR", atau stok palsu.
3. Booking fee resmi Rp5.000.000 hanya ke rekening PT Andara Rejo Makmur.
4. DILARANG memasukkan nama Sales Executive ("${seName}") atau nama orang siapa pun ke dalam visualPrompt atau slideDeck[].visualPrompt. Fasad rumah harus bersih tanpa tulisan/nama (tulisan "The Park Townhouse" hanya boleh di gerbang masuk utama cluster).

BUAT 3 KONTEN HARIAN UNIK SESUAI RUMUS ASLI TOFU · MOFU · BOFU (WAJIB SERTAKAN FIELD "hook" YANG KUAT):
1. Slot 1 (09:00 WIB, TOFU — Awareness, Edukasi & Saveable, format "Carousel Edukasi", platform "Instagram"):
   - TUJUAN TOFU: Menarik audiens baru & memicu Save/Share TANPA hard-sell atau menyebut harga/booking fee.
   - "hook" (baris 1 caption, maks 12 kata): Gunakan *Curiosity / Aspirational Pain-Point Hook* yang langsung menyentuh keresahan ${persona.archetype} (contoh pola: "Banyak keluarga baru sadar hal ini setelah pindah rumah...").
   - WAJIB punya "slideDeck" tepat 5 slide yang NYAMBUNG dari Slide 1 s.d. Slide 5 seperti satu cerita majalah:
     * Slide 1 (Cover Hook): Pertanyaan/pernyataan scroll-stopper menyentuh aspirasi ${persona.archetype}, TANPA harga keras. Visual: perspektif diagonal jalan cluster megah golden hour.
     * Slide 2 (Problem -> Solusi 1): Menjawab kekhawatiran utama persona dengan fakta Playbook. Visual: ruang tamu 2 lantai terang & hangat.
     * Slide 3 (Solusi 2): Keunggulan spesifik pilar "${pillar.label}". Visual: sudut arsitektur/garasi dalam/smart door lock.
     * Slide 4 (Solusi 3): Bukti kualitas hidup (Clubhouse / One-gate RFID / lingkungan homogen). Visual: fasilitas clubhouse kolam renang / taman.
     * Slide 5 (Soft CTA): Ajak simpan (Save) & DM untuk konsultasi/denah. Visual: suasana keluarga hangat di gerbang utama bertuliskan "The Park Townhouse".
   - ATURAN TEKS SLIDE (agar Google Flow bebas typo): kicker 2–3 kata, headline 3–5 kata, subheadline 4–7 kata.
2. Slot 2 (14:00 WIB, MOFU — Consideration, Pertimbangan & Bukti Nyata, format "${slot2Format}", platform "${slot2Format === 'Carousel Edukasi' ? 'Instagram' : 'TikTok'}", durationSeconds=${slot2Format === 'Carousel Edukasi' ? 0 : reelsDur1}):
   - TUJUAN MOFU: Membantu audiens membandingkan & percaya pada kualitas ${unitFocus.label} (vs rumah second / bangun sendiri).
   - "hook" (baris 1 caption, maks 14 kata): Gunakan *Comparison / Myth-Busting / Proof Hook* (contoh pola: "Beli rumah second siap huni vs townhouse Japandi baru: mana yang lebih hemat biaya tak terduga?").
   - ${slot2Format === 'Carousel Edukasi' ? 'WAJIB sertakan "slideDeck" tepat 5 slide yang nyambung (Slide 1 Cover Bedah Unit -> Slide 2 Bukti Lokasi -> Slide 3 Bukti Tata Ruang & Garasi -> Slide 4 Bukti Clubhouse & Smart Living -> Slide 5 CTA Survei Privat), kicker 2-3 kata, headline 3-5 kata, subheadline 4-7 kata.' : `Sertakan "brief" skrip per detik yang KETAT (0-3d: Visual+Text Hook scroll-stopper | 4-11d: Tur & Bukti spesifikasi ${unitFocus.label} | 12-${reelsDur1}d: CTA Survei Privat) + visualPrompt sinematik vertikal 9:16.`}
3. Slot 3 (19:30 WIB, BOFU — Conversion, Penawaran & Closing, format "${slot3Format}", platform "Instagram", durationSeconds=${slot3Format === 'Single Image + Visual Quote' ? 0 : reelsDur2}):
   - TUJUAN BOFU: Mendorong aksi nyata (DM/WA/Survei/Booking) dengan penawaran spesifik unit ${unitFocus.label} (Cash ${unitCashLabel} / KPR ${unitKprLabel} / CT12 / CT24, Booking Fee Rp5 Juta, momentum penyesuaian harga Desember ±7–8%).
   - "hook" (baris 1 caption, maks 14 kata): Gunakan *Specific Offer / Price-Anchor Hook* (contoh pola: "Mulai ${unitKprLabel} (KPR) — 3 kamar tidur + garasi dalam + akses clubhouse seumur hidup, unit boutique terbatas."). Dilarang sapaan chat kaku seperti "Malam Bapak/Ibu".
   - ${slot3Format === 'Single Image + Visual Quote' ? `WAJIB sertakan "slideDeck" berisi tepat 1 objek poster flagship [{"kicker":"2-3 kata","headline":"3-5 kata","subheadline":"4-7 kata","visualPrompt":"sweeping diagonal cluster street at golden hour...","badgePrice":"${unitBadge}"}]` : `Sertakan "brief" skrip per detik yang KETAT (0-3d: Offer Hook dengan angka resmi | 4-11d: Skema bayar Cash/KPR/CT24 & keunggulan inti | 12-${reelsDur2}d: CTA WA & Booking Rp5 Juta) + visualPrompt sinematik vertikal 9:16.`}

Setiap objek dalam JSON array WAJIB memiliki field: "hook", "title", "brief", "visualPrompt", "caption", "hashtags", "cta", "platform", "durationSeconds", dan "slideDeck" (bila Carousel/Single Image).

ATURAN GAYA COPYWRITING CAPTION (WAJIB FUN, EXCITED & MANUSIAWI):
- Tulis dengan gaya kreator properti Instagram/TikTok yang hangat, antusias, mengalir, dan enak dibaca di layar HP (paragraf pendek 1–2 kalimat, pakai 2–4 emoji relevan secara natural).
- DILARANG KERAS menulis label segmen kaku di awal kalimat (seperti "Untuk Perantau / Pekerja Migran:" atau "Untuk Dokter:") dan DILARANG menulis tag internal seperti "(Gold/Diamond)", "[P4]", atau "(H-1)" di judul maupun caption!
- Ubah spesifikasi teknis menjadi cerita manfaat hidup sehari-hari yang bikin audiens membayangkan tinggal di sana.

Balas HANYA JSON array valid berisi 3 objek (tanpa markdown fence).`;

      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.8,
          messages: [
            {
              role: 'system',
              content:
                'Kamu adalah Creative Director & Social Media Copywriter properti yang jago bikin konten viral, fun, antusias, dan dekat dengan audiens (bukan bahasa brosur kaku), 100% patuh pada data resmi Playbook v1.2, anti-halusinasi, dan selalu membalas JSON array valid. DILARANG menulis nama fiktif persona, kode nomor #12/#16, atau tag internal (Gold/Diamond) di caption publik.',
            },
            { role: 'user', content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (resp.ok) {
        const json = (await resp.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = json.choices?.[0]?.message?.content || '';
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]) as GeneratedSlotSpec[];
          if (Array.isArray(parsed) && parsed.length === 3) {
            console.log(`[content-ai] 9router (${model}) generated 3 unique slots for ${seEmail} day ${dayNumber}`);
            return parsed.map((item, idx) => {
              const expectedFormat: GeneratedSlotSpec['format'] =
                idx === 0 ? 'Carousel Edukasi' : idx === 1 ? slot2Format : slot3Format;
              const isDeckFormat =
                expectedFormat === 'Carousel Edukasi' ||
                expectedFormat === 'Single Image + Visual Quote';
              const maxSlides = expectedFormat === 'Single Image + Visual Quote' ? 1 : 5;
              const cleanedDeck =
                isDeckFormat && Array.isArray(item.slideDeck) && item.slideDeck.length > 0
                  ? item.slideDeck.slice(0, maxSlides).map((sl, sIdx) => ({
                      slideNumber: sIdx + 1,
                      role: sl.role || (sIdx === 0 ? 'Cover Hook' : sIdx === maxSlides - 1 ? 'CTA Closing' : `Value ${sIdx}`),
                      kicker: enforcePlaybookCompliance(String(sl.kicker || pillar.label.split(' ')[0])),
                      headline: enforcePlaybookCompliance(String(sl.headline || item.title || 'HUNIAN JAPANDI MODERN')),
                      subheadline: enforcePlaybookCompliance(String(sl.subheadline || 'THE PARK TOWNHOUSE SUKOHARJO')),
                      visualPrompt: sanitizeVisualPrompt(String(sl.visualPrompt || item.visualPrompt || ''), seName),
                      badgePrice:
                        idx === 2 && (sIdx === 0 || sIdx === maxSlides - 1)
                          ? enforcePlaybookCompliance(String(sl.badgePrice || unitBadge))
                          : undefined,
                    }))
                  : undefined;

              const cleanHook = item.hook ? enforcePlaybookCompliance(String(item.hook).trim()) : '';
              const rawCaption = enforcePlaybookCompliance(String(item.caption || ''));
              const finalCaption =
                cleanHook && !rawCaption.toLowerCase().startsWith(cleanHook.slice(0, 20).toLowerCase())
                  ? `${cleanHook}\n\n${rawCaption}`
                  : rawCaption;

              return {
                slotOrder: (idx + 1) as 1 | 2 | 3,
                scheduledTime: idx === 0 ? '09:00 WIB' : idx === 1 ? '14:00 WIB' : '19:30 WIB',
                funnelStage: idx === 0 ? 'TOFU' : idx === 1 ? 'MOFU' : 'BOFU',
                platform:
                  item.platform ||
                  (idx === 1 && expectedFormat === 'Reels / Video Pendek' ? 'TikTok' : 'Instagram'),
                format: expectedFormat,
                hook: cleanHook || undefined,
                title: enforcePlaybookCompliance(String(item.title || `${pillar.label} — ${unitFocus.cluster}`)),
                brief: enforcePlaybookCompliance(String(item.brief || '')),
                visualPrompt: sanitizeVisualPrompt(String(item.visualPrompt || item.brief || ''), seName),
                caption: finalCaption,
                hashtags: Array.isArray(item.hashtags) ? item.hashtags : ['#TheParkTownhouse', '#Sukoharjo'],
                cta: enforcePlaybookCompliance(String(item.cta || 'Hubungi saya via WhatsApp untuk survei privat.')),
                durationSeconds:
                  expectedFormat === 'Reels / Video Pendek'
                    ? Number(item.durationSeconds) || (idx === 1 ? reelsDur1 : reelsDur2)
                    : 0,
                personaCode,
                slideDeck: cleanedDeck,
              };
            });
          }
        }
      }
    } catch {
      /* fallback grounded in Playbook v1.2 */
    }
  }

  const tofuDeck: SlideDeckItem[] = [
    {
      slideNumber: 1,
      role: 'Cover Hook',
      kicker: `Untuk ${persona.name.split(' ')[0]}`,
      headline: `HUNIAN JAPANDI ${unitFocus.cluster.toUpperCase()}`,
      subheadline: 'NYAMAN, AMAN & LENGKAP UNTUK KELUARGA',
      visualPrompt:
        'Sweeping diagonal wide-angle perspective down a neat grey cobblestone avenue lined with modern 2-story white tropical Japandi townhouses, warm golden-hour sunset glow, family strolling warmly.',
    },
    {
      slideNumber: 2,
      role: 'Solusi 1 · Arsitektur',
      kicker: 'Desain Fungsional',
      headline: 'TOWNHOUSE 2 LANTAI MODERN',
      subheadline: 'TATA RUANG LEGA & CAHAYA ALAMI MELIMPAH',
      visualPrompt:
        'Sunlit bright airy 2-story Japandi modern living room interior with warm natural teak wood accents, tall black-framed glass windows looking out to lush tropical greenery, golden afternoon sunlight.',
    },
    {
      slideNumber: 3,
      role: 'Solusi 2 · Garasi & Privasi',
      kicker: 'Privasi Terjaga',
      headline: 'GARASI DALAM & ONE-GATE RFID',
      subheadline: 'SATPAM 24 JAM & CCTV 4K TERPADU',
      visualPrompt:
        'Clean minimalist white 2-story tropical townhouse facade showcasing spacious covered indoor garage and carport with sleek white SUV, warm architectural wall sconces and lush green palms.',
    },
    {
      slideNumber: 4,
      role: 'Solusi 3 · Fasilitas',
      kicker: 'Gaya Hidup Sehat',
      headline: 'CLUBHOUSE LENGKAP DI NAGOYA',
      subheadline: 'KOLAM RENANG, GYM, CAFE & MINI GOLF',
      visualPrompt:
        'Serene luxury boutique residential clubhouse lounge and sparkling resort-style swimming pool surrounded by tropical palms and warm golden-hour sunset reflections.',
    },
    {
      slideNumber: 5,
      role: 'Soft CTA',
      kicker: 'Simpan & Konsultasi',
      headline: 'JADWALKAN SURVEI KELUARGA',
      subheadline: 'KUNJUNGI MARKETING GALLERY JOMBOR SUKOHARJO',
      visualPrompt:
        'Grand welcoming golden-hour view of a luxury boutique residential main entrance gate with subtle elegant lettering "The Park Townhouse", lush manicured tropical garden, happy family walking in.',
    },
  ];

  const mofuDeck: SlideDeckItem[] = [
    {
      slideNumber: 1,
      role: 'Cover Bedah Unit',
      kicker: `Bedah Cluster ${unitFocus.cluster}`,
      headline: `KENAL LEBIH DEKAT ${unitFocus.label.split('(')[0].trim().toUpperCase()}`,
      subheadline: `${unitFocus.group.toUpperCase()} · BOUTIQUE 2 LANTAI`,
      visualPrompt:
        'Sweeping dramatic diagonal architectural perspective of modern 2-story white tropical Japandi townhouses at golden hour with warm amber interior glow and blooming ornamental trees.',
    },
    {
      slideNumber: 2,
      role: 'Bukti Lokasi',
      kicker: 'Koridor Strategis',
      headline: 'AKSES CEPAT JOMBOR & SUDIRMAN',
      subheadline: 'DEKAT PUSAT AKTIVITAS SUKOHARJO & SOLO BARU',
      visualPrompt:
        'Grand upscale residential entrance boulevard with neat cobblestone street, lush green trees, warm golden sunlight, subtle elegant main cluster gate sign reading "The Park Townhouse".',
    },
    {
      slideNumber: 3,
      role: 'Bukti Ruang',
      kicker: 'Tanpa Biaya Renovasi',
      headline: 'SIAP HUNI & GARASI DALAM',
      subheadline: 'SMART DOOR LOCK & EV-CHARGING READY',
      visualPrompt:
        'Bright modern Japandi living and dining room interior with warm teak wood details, open glass doors to private backyard garden, glowing afternoon sunbeams.',
    },
    {
      slideNumber: 4,
      role: 'Bukti Fasilitas',
      kicker: 'Tanpa Biaya Member',
      headline: 'CLUBHOUSE & CONCIERGE 24/7',
      subheadline: 'KOLAM RENANG, GYM, LOUNGE & GAME STATION',
      visualPrompt:
        'Resort-inspired private residential clubhouse with glowing pool, glass-walled fitness lounge, outdoor cafe terrace bathed in golden sunset light.',
    },
    {
      slideNumber: 5,
      role: 'Mid CTA',
      kicker: 'Lihat Langsung',
      headline: 'SURVEI PRIVAT AKHIR PEKAN',
      subheadline: 'CEK POSISI KAVLING & SIMULASI KPR GRATIS',
      visualPrompt:
        'Warm inviting golden-hour cobblestone cluster street with happy young couple touring a modern white tropical townhouse facade surrounded by tropical greenery.',
    },
  ];

  const bofuPosterDeck: SlideDeckItem[] = [
    {
      slideNumber: 1,
      role: 'Flagship Offer Poster',
      kicker: `Penawaran ${unitFocus.cluster}`,
      headline: `MILIKI ${unitFocus.label.split('(')[0].trim().toUpperCase()}`,
      subheadline: 'CASH · CT12 · CT24 · KPR DP 10% · BOOKING RP5 JUTA',
      visualPrompt:
        'Sweeping dramatic diagonal wide-angle street perspective of modern 2-story white tropical Japandi townhouses receding toward glowing golden-hour sunset horizon, warm amber window lights, sleek white SUV in carport, happy young family strolling down cobblestone avenue.',
      badgePrice: unitBadge,
    },
  ];

  const cleanUnitName = unitFocus.label.split('(')[0].trim();

  return [
    {
      slotOrder: 1,
      scheduledTime: '09:00 WIB',
      funnelStage: 'TOFU',
      platform: 'Instagram',
      format: 'Carousel Edukasi',
      hook: `Serius, punya rumah 2 lantai ber-clubhouse itu ternyata bikin kualitas waktu bareng keluarga berubah total ✨`,
      title: `${pillar.label}: Checklist Hunian Ideal ${unitFocus.cluster}`,
      brief: `Carousel 5 slide edukasi TOFU (tanpa hard-sell): sentuh aspirasi punya hunian nyaman & privat, lalu kenalkan fasilitas gaya hidup di ${unitFocus.cluster}.`,
      visualPrompt: tofuDeck[0].visualPrompt,
      caption: `Serius, punya rumah 2 lantai ber-clubhouse itu ternyata bikin kualitas waktu bareng keluarga berubah total ✨\n\nBayangin weekend nggak perlu macet-macetan keluar kompleks—pagi bisa berenang santai, sore ngopi di lounge atau main mini golf bareng orang tersayang 🏡🌿\n\nDi The Park Townhouse Sukoharjo (${cleanUnitName}), konsep Japandi Modern-nya dibuat lega, terang, dan super privat. Geser sampai slide terakhir buat ceklist hunian ideal versi kamu! 👉`,
      hashtags: ['#TheParkTownhouse', '#TownhouseSukoharjo', '#JapandiModern', '#RumahIdamanSolo'],
      cta: 'Simpan postingan ini dulu biar nggak hilang, atau DM aku kalau mau intip denahnya! 💬',
      durationSeconds: 0,
      personaCode,
      slideDeck: tofuDeck,
    },
    {
      slotOrder: 2,
      scheduledTime: '14:00 WIB',
      funnelStage: 'MOFU',
      platform: slot2Format === 'Carousel Edukasi' ? 'Instagram' : 'TikTok',
      format: slot2Format,
      hook: `Beli rumah second lalu renovasi vs langsung masuk unit baru ${cleanUnitName} — mending mana? 🤔`,
      title: `Bedah ${cleanUnitName}: ${pillar.label}`,
      brief:
        slot2Format === 'Carousel Edukasi'
          ? `Carousel 5 slide MOFU membedah keunggulan nyata ${cleanUnitName} (${unitCashLabel} cash / ${unitKprLabel} KPR) dibanding renovasi rumah lama.`
          : `0–3d Hook: Perbandingan rumah second vs ${cleanUnitName} | 4–11d Tur: ${pillar.label} & tata ruang 2 lantai | 12–${reelsDur1}d CTA: Survei privat.`,
      visualPrompt:
        slot2Format === 'Carousel Edukasi'
          ? mofuDeck[0].visualPrompt
          : `Vertical 9:16 real estate Reels video (${reelsDur1}s) showcasing ${cleanUnitName} modern 2-story white tropical Japandi townhouse in Sukoharjo, warm golden daylight, photorealistic`,
      caption: `Beli rumah second lalu renovasi vs langsung masuk unit baru ${cleanUnitName} — mending mana? 🤔\n\nBanyak yang ngira beli rumah lama lebih hemat, padahal biaya renovasi + perapian sering membengkak di luar rencana! Di Cluster ${unitFocus.cluster}, kamu sudah dapat bangunan 2 lantai siap desain Japandi, garasi dalam tertutup, dan keamanan one-gate RFID 24 jam 🔒✨\n\nPenasaran lihat langsung feel ruangannya? Yuk jadwalkan tur privat minggu ini!`,
      hashtags: ['#TourRumahSukoharjo', '#TheParkTownhouse', `#Cluster${unitFocus.cluster}`, '#HunianModern'],
      cta: 'Ketik "SURVEI" di komentar atau DM sekarang, nanti aku kirimkan pin lokasi & jadwal kosongnya! 📍',
      durationSeconds: slot2Format === 'Carousel Edukasi' ? 0 : reelsDur1,
      personaCode,
      slideDeck: slot2Format === 'Carousel Edukasi' ? mofuDeck : undefined,
    },
    {
      slotOrder: 3,
      scheduledTime: '19:30 WIB',
      funnelStage: 'BOFU',
      platform: 'Instagram',
      format: slot3Format,
      hook: `Mulai ${unitKprLabel} (KPR) atau ${unitCashLabel} (Cash) — sudah dapat 3 KT, garasi dalam & clubhouse seumur hidup! 🔥`,
      title: `Penawaran ${cleanUnitName}: Cash ${unitCashLabel} · Booking Rp5 Juta`,
      brief:
        slot3Format === 'Single Image + Visual Quote'
          ? `Poster BOFU penawaran unit ${cleanUnitName}: skema Cash Keras (${unitCashLabel}), CT12, CT24, dan KPR DP 10% (${unitKprLabel}) + Booking Fee Rp5 Juta.`
          : `0–3d Offer Hook: Mulai ${unitKprLabel} KPR / ${unitCashLabel} Cash | 4–11d Skema bayar & keunggulan inti | 12–${reelsDur2}d CTA WA & Booking Rp5 Juta.`,
      visualPrompt:
        slot3Format === 'Single Image + Visual Quote'
          ? bofuPosterDeck[0].visualPrompt
          : `Vertical 9:16 evening luxury townhouse walkthrough (${reelsDur2}s) for ${cleanUnitName}, warm architectural lighting, inviting family atmosphere, photorealistic`,
      caption: `Mulai ${unitKprLabel} (KPR) atau ${unitCashLabel} (Cash) — sudah dapat 3 KT, garasi dalam & akses clubhouse seumur hidup tanpa iuran member! 🔥\n\nBuat kamu yang lagi cari hunian boutique di Solo Selatan, unit ${cleanUnitName} bisa diamankan dengan skema fleksibel (Cash Keras, Cash Tempo 12/24 bulan, atau KPR DP 10% dibantu pengajuan paralel 2 bank) 🏦✨\n\nCukup Booking Fee Rp5 juta (resmi ke rekening PT Andara Rejo Makmur) sebelum penyesuaian harga Desember!`,
      hashtags: ['#KPRSukoharjo', '#TheParkTownhouse', '#BookingFee5Juta', '#PropertiSolo'],
      cta: 'Klik link WA atau DM aku sekarang buat hitungan simulasi cicilan paling ringan & cek unit yang masih kosong! 📲',
      durationSeconds: slot3Format === 'Single Image + Visual Quote' ? 0 : reelsDur2,
      personaCode,
      slideDeck: slot3Format === 'Single Image + Visual Quote' ? bofuPosterDeck : undefined,
    },
  ];
}

/**
 * Generates a 7-day rolling batch (e.g., Week 1 = Days 1-7, Week 2 = Days 8-14)
 * for a specific SE account and saves to PostgreSQL.
 */
export async function generateWeekSlotsForSe(
  seEmail: string,
  seName: string,
  weekNumber: number
): Promise<number> {
  const startDay = (weekNumber - 1) * 7 + 1;
  const endDay = Math.min(30, weekNumber * 7);
  const { dateStr } = getWibClock();
  let savedCount = 0;

  for (let day = startDay; day <= endDay; day++) {
    const existing = await sql`
      SELECT slot_id FROM sales_os.se_content_slots
      WHERE se_email = ${seEmail} AND day_number = ${day} AND visual_prompt IS NOT NULL
    `;
    if (existing.length >= 3) continue;

    const aiSlots = await generateUniqueDaySlotsWithAi(seEmail, seName, day);
    for (const s of aiSlots) {
      const slotId = `slot-d${day}-s${s.slotOrder}-sales_in_house`;
      await sql`
        INSERT INTO sales_os.se_content_slots (
          se_email, slot_id, status, posted_url, day_number, slot_order,
          scheduled_time, funnel_stage, platform, format, title, brief,
          visual_prompt, caption, hashtags, cta, duration_seconds,
          persona_code, slide_deck, media_status, report_date, updated_at
        ) VALUES (
          ${seEmail}, ${slotId}, 'SIAP', '', ${day}, ${s.slotOrder},
          ${s.scheduledTime}, ${s.funnelStage}, ${s.platform}, ${s.format},
          ${s.title}, ${s.brief}, ${s.visualPrompt}, ${s.caption},
          ${sql.json(s.hashtags)}, ${s.cta}, ${s.durationSeconds},
          ${s.personaCode || 'P1'}, ${sql.json(s.slideDeck || [])}, 'SCHEDULED', ${dateStr}::date, NOW()
        )
        ON CONFLICT (se_email, slot_id) DO UPDATE SET
          day_number = EXCLUDED.day_number,
          slot_order = EXCLUDED.slot_order,
          scheduled_time = EXCLUDED.scheduled_time,
          funnel_stage = EXCLUDED.funnel_stage,
          platform = EXCLUDED.platform,
          format = EXCLUDED.format,
          title = EXCLUDED.title,
          brief = EXCLUDED.brief,
          visual_prompt = EXCLUDED.visual_prompt,
          caption = EXCLUDED.caption,
          hashtags = EXCLUDED.hashtags,
          cta = EXCLUDED.cta,
          duration_seconds = EXCLUDED.duration_seconds,
          persona_code = EXCLUDED.persona_code,
          slide_deck = EXCLUDED.slide_deck,
          updated_at = NOW()
      `;
      savedCount++;
    }
  }
  return savedCount;
}

/**
 * Enqueues per-slide/video jobs to Hermes VNC Flow API IMMEDIATELY (non-blocking).
 * Each Carousel slide gets its own job_id so completed slides (e.g. 3 of 5) can be
 * downloaded and displayed immediately without waiting for all 5 slides.
 */
export async function enqueueSlotMediaViaHermes(params: {
  seEmail: string;
  slotId: string;
  format: string;
  funnelStage?: string;
  title: string;
  brief: string;
  visualPrompt: string;
  durationSeconds: number;
  slideDeck?: SlideDeckItem[];
  priority?: number;
}): Promise<{
  ok: boolean;
  targetCount: number;
  jobs: HermesJobEntry[];
  error?: string;
}> {
  const fmtLower = params.format.toLowerCase();
  const isVideo = fmtLower.includes('reels') || fmtLower.includes('video');
  const isSinglePoster =
    !isVideo && (fmtLower.includes('single') || fmtLower.includes('poster') || fmtLower.includes('quote'));

  const deck = Array.isArray(params.slideDeck) ? params.slideDeck : [];
  // Video = 3 klip Omni @8 detik + outro 2 logo; Single Poster = 1 poster megah; Carousel = 5 slide nyambung
  const targetCount = isVideo ? 3 : isSinglePoster ? 1 : 5;
  const basePrompt = sanitizeVisualPrompt(params.visualPrompt || params.brief || params.title);

  const fallbackSlideScenes = [
    'Sweeping diagonal wide-angle perspective down a neat grey cobblestone avenue lined with modern 2-story white tropical Japandi townhouses receding into a glowing golden-hour sunset horizon, happy young family strolling warmly',
    'Sunlit bright airy 2-story modern Japandi living room interior with warm teak wood accents, large black-framed glass sliding doors opening to private green garden, glowing afternoon sunbeams',
    'Clean architectural facade of a modern white 2-story tropical townhouse showcasing spacious indoor garage and covered carport with sleek white SUV, warm ambient wall sconces and tropical palms',
    'Serene luxury boutique residential clubhouse lounge and sparkling resort-style swimming pool surrounded by matching white tropical architecture and manicured palms in golden afternoon light',
    'Grand welcoming golden-hour view of the boutique one-gate residential entrance featuring subtle elegant lettering "The Park Townhouse", blooming tropical garden pathway, inviting family atmosphere',
  ];

  const videoScenes = [
    {
      visual:
        'Scene 1 (0-8s): Smooth cinematic drone-to-eye-level walkthrough entering the grand one-gate entrance with subtle lettering "The Park Townhouse" and cobblestone street lined with matching white 2-story modern tropical Japandi townhouses in Sukoharjo Indonesia, warm golden hour sunlight, lush greenery',
      voiceover:
        'Selamat datang di The Park Townhouse Sukoharjo, hunian boutique dua lantai bergaya Japandi Modern.',
    },
    {
      visual:
        'Scene 2 (8-16s): Smooth continuous interior walkthrough inside the exact same white modern tropical townhouse, bright airy living room, warm teak wood accents, indoor garage, and smart living details',
      voiceover:
        'Dilengkapi garasi dalam, smart door lock, keamanan one-gate RFID dua puluh empat jam, dan clubhouse lengkap.',
    },
    {
      visual:
        'Scene 3 (16-24s): Warm golden-hour lifestyle walkthrough at the private residential clubhouse pool and serene garden pathway of the exact same townhouse cluster, inviting family atmosphere',
      voiceover:
        'Tersedia mulai enam ratus lima puluh jutaan dengan booking fee lima juta. Jadwalkan survei privat sekarang.',
    },
  ];

  // Batalkan antrean lama yang masih PENDING untuk slot ini agar tidak dobel
  await sql`
    UPDATE sales_os.media_render_queue
    SET status = 'CANCELLED', finished_at = NOW()
    WHERE se_email = ${params.seEmail} AND slot_id = ${params.slotId} AND status = 'PENDING'
  `.catch(() => {});

  const jobs: HermesJobEntry[] = [];
  const priority = params.priority ?? 20;

  for (let i = 0; i < targetCount; i++) {
    let slidePrompt: string;
    if (isVideo) {
      slidePrompt = `${videoScenes[i % videoScenes.length].visual}. Context: ${basePrompt}. ${BRAND_VISUAL_DNA} Natural warm Indonesian human voiceover speaking clearly in conversational Bahasa Indonesia: "${videoScenes[i % videoScenes.length].voiceover}". Vertical 9:16 real estate video.`;
    } else {
      const cleanTitle = enforcePlaybookCompliance(params.title).replace(/^\[[^\]]+\]\s*/, '').trim();
      const stage = (params.funnelStage || 'TOFU').toUpperCase();
      const defaultStorySlides: Array<{ kicker: string; headline: string; subheadline: string }> =
        stage === 'MOFU'
          ? [
              { kicker: 'Bedah Hunian', headline: cleanTitle.slice(0, 38) || 'KENAPA PILIH THE PARK?', subheadline: 'GESER UNTUK LIHAT BUKTI NYATA KLASTER' },
              { kicker: 'Bukti Lokasi', headline: 'KORIDOR EMAS JOMBOR & SUDIRMAN', subheadline: 'AKSES CEPAT KE PUSAT SUKOHARJO & SOLO BARU' },
              { kicker: 'Bukti Ruang', headline: 'GARASI DALAM & TATA RUANG LEGA', subheadline: 'DESAIN JAPANDI MODERN SIAP HUNI TANPA RENOVASI' },
              { kicker: 'Bukti Fasilitas', headline: 'CLUBHOUSE LENGKAP TANPA MEMBER', subheadline: 'KOLAM RENANG, GYM, CAFE & MINI GOLF 9 HOLE' },
              { kicker: 'Lihat Langsung', headline: 'JADWALKAN SURVEI PRIVAT', subheadline: 'CEK KAVLING & SIMULASI KPR GRATIS MINGGU INI' },
            ]
          : stage === 'BOFU'
          ? [
              { kicker: 'Penawaran Spesial', headline: cleanTitle.slice(0, 38) || 'AMANKAN UNIT PILIHAN ANDA', subheadline: 'HARGA NOVEMBER SEBELUM PENYESUAIAN DESEMBER' },
              { kicker: 'Skema Fleksibel', headline: 'CASH, CT12, CT24 & KPR DP 10%', subheadline: 'PENGAJUAN KPR PARALEL 2 BANK REKANAN' },
              { kicker: 'Langkah Mudah', headline: 'BOOKING FEE CUKUP RP 5 JUTA', subheadline: 'REKENING RESMI PT ANDARA REJO MAKMUR' },
              { kicker: 'Nilai Jangka Panjang', headline: 'HANYA 30 UNIT BOUTIQUE', subheadline: 'LINGKUNGAN HOMOGEN, ONE-GATE RFID & CCTV 4K' },
              { kicker: 'Amankan Hari Ini', headline: 'HUBUNGI SALES EXECUTIVE KAMI', subheadline: 'KIRIM PESAN "SURVEI" UNTUK KUNJUNGAN PRIVAT' },
            ]
          : [
              { kicker: 'Edukasi Hunian', headline: cleanTitle.slice(0, 38) || 'HUNIAN JAPANDI MODERN', subheadline: 'GESER UNTUK CHECKLIST RUMAH IDEAL KELUARGA' },
              { kicker: 'Arsitektur Sehat', headline: 'TOWNHOUSE 2 LANTAI LEGA', subheadline: 'PENCAHAYAAN ALAMI & SIRKULASI UDARA OPTIMAL' },
              { kicker: 'Keamanan Berlapis', headline: 'ONE-GATE RFID & SMART LOCK', subheadline: 'SATPAM 24 JAM, CCTV 4K & APLIKASI ANDARA LIVING' },
              { kicker: 'Gaya Hidup', headline: 'CLUBHOUSE LENGKAP DI KLASTER', subheadline: 'KOLAM RENANG, GYM, LOUNGE & GAME STATION' },
              { kicker: 'Simpan Postingan', headline: 'KONSULTASI DENAH GRATIS', subheadline: 'SIMPAN & DM UNTUK INFO LENGKAP THE PARK' },
            ];

      const slideItem = deck[i];
      const fallbackSlide = defaultStorySlides[i % defaultStorySlides.length];
      const kicker = slideItem?.kicker || fallbackSlide.kicker;
      const headline = slideItem?.headline || fallbackSlide.headline;
      const subheadline = slideItem?.subheadline || fallbackSlide.subheadline;
      const sceneVisual = sanitizeVisualPrompt(
        slideItem?.visualPrompt || fallbackSlideScenes[i % fallbackSlideScenes.length]
      );
      const badgePrice =
        slideItem?.badgePrice ||
        (stage === 'BOFU' && (i === 0 || i === targetCount - 1) ? '650 JUTAAN' : undefined);

      slidePrompt = buildFlowNativePosterPrompt({
        kicker,
        headline,
        subheadline,
        sceneVisual,
        slideIndex: i + 1,
        totalSlides: targetCount,
        badgePrice,
      });
    }

    await sql`
      INSERT INTO sales_os.media_render_queue (
        se_email, slot_id, slide_index, media_type, aspect_ratio, prompt, priority, status
      ) VALUES (
        ${params.seEmail},
        ${params.slotId},
        ${i + 1},
        ${isVideo ? 'video' : 'image'},
        ${isVideo ? '9:16' : '3:4'},
        ${slidePrompt},
        ${priority},
        'PENDING'
      )
    `;

    jobs.push({
      slideIndex: i + 1,
      jobId: '',
      status: 'pending',
    });
  }

  return { ok: true, targetCount, jobs };
}

let isQueueTickBusy = false;
let nextDispatchAllowedAtMs = 0;
let lastSlotFinishedAtMs = 0;
let lastFinishedSlotKey = '';
const MIN_INTER_SLOT_COOLDOWN_MS = 60_000; // Wajib jeda minimal 1 menit sebelum lanjut ke slot/user berikutnya

export interface QueuePositionInfo {
  activeOtherSlotForUser: {
    slotId: string;
    title: string;
    scheduledTime: string;
  } | null;
  itemsAhead: number;
  estimatedWaitMinutes: number;
  cooldownSecondsLeft: number;
}

export async function getQueuePositionInfo(
  seEmail: string,
  slotId: string
): Promise<QueuePositionInfo> {
  const now = Date.now();
  const cooldownSecondsLeft = Math.max(
    0,
    Math.ceil((Math.max(nextDispatchAllowedAtMs, lastSlotFinishedAtMs + MIN_INTER_SLOT_COOLDOWN_MS) - now) / 1000)
  );

  try {
    // 1. Cek apakah user ini punya slot LAIN yang sedang aktif (PENDING / PROCESSING)
    const otherRows = await sql`
      SELECT DISTINCT q.slot_id,
             COALESCE(s.title, q.slot_id) AS title,
             COALESCE(s.scheduled_time, '') AS scheduled_time
      FROM sales_os.media_render_queue q
      LEFT JOIN sales_os.se_content_slots s
        ON s.se_email = q.se_email AND s.slot_id = q.slot_id
      WHERE q.se_email = ${seEmail}
        AND q.slot_id <> ${slotId}
        AND q.status IN ('PENDING', 'PROCESSING')
      LIMIT 1
    `;
    const activeOtherSlotForUser = otherRows[0]
      ? {
          slotId: String(otherRows[0].slot_id),
          title: String(otherRows[0].title || otherRows[0].slot_id),
          scheduledTime: String(otherRows[0].scheduled_time || ''),
        }
      : null;

    // 2. Hitung item antrean global yang masuk lebih dulu di depan slot ini (FIFO)
    const myFirstRows = await sql`
      SELECT id, priority, created_at
      FROM sales_os.media_render_queue
      WHERE se_email = ${seEmail}
        AND slot_id = ${slotId}
        AND status IN ('PENDING', 'PROCESSING')
      ORDER BY id ASC
      LIMIT 1
    `;

    let itemsAhead = 0;
    if (myFirstRows.length > 0) {
      const me = myFirstRows[0];
      const aheadRows = await sql`
        SELECT COUNT(*)::int AS cnt
        FROM sales_os.media_render_queue
        WHERE status IN ('PENDING', 'PROCESSING')
          AND NOT (se_email = ${seEmail} AND slot_id = ${slotId})
          AND (
            status = 'PROCESSING'
            OR priority < ${me.priority}
            OR (priority = ${me.priority} AND id < ${me.id})
          )
      `;
      itemsAhead = Number(aheadRows[0]?.cnt || 0);
    } else {
      const activeGlobalRows = await sql`
        SELECT COUNT(*)::int AS cnt
        FROM sales_os.media_render_queue
        WHERE status IN ('PENDING', 'PROCESSING')
          AND NOT (se_email = ${seEmail} AND slot_id = ${slotId})
      `;
      itemsAhead = Number(activeGlobalRows[0]?.cnt || 0);
    }

    const estimatedWaitMinutes =
      itemsAhead > 0 ? Math.max(1, Math.ceil((itemsAhead * 45 + 60) / 60)) : 0;

    return {
      activeOtherSlotForUser,
      itemsAhead,
      estimatedWaitMinutes,
      cooldownSecondsLeft,
    };
  } catch {
    return {
      activeOtherSlotForUser: null,
      itemsAhead: 0,
      estimatedWaitMinutes: 0,
      cooldownSecondsLeft: 0,
    };
  }
}

async function syncSlotFromQueue(seEmail: string, slotId: string): Promise<void> {
  const qRows = await sql`
    SELECT slide_index, media_type, status, hermes_job_id, local_url, error
    FROM sales_os.media_render_queue
    WHERE se_email = ${seEmail} AND slot_id = ${slotId} AND status <> 'CANCELLED'
    ORDER BY slide_index ASC, id DESC
  `;
  if (qRows.length === 0) return;

  const bySlide = new Map<number, any>();
  for (const r of qRows) {
    const idx = Number(r.slide_index);
    if (!bySlide.has(idx)) bySlide.set(idx, r);
  }
  const latestRows = Array.from(bySlide.values()).sort(
    (a, b) => Number(a.slide_index) - Number(b.slide_index)
  );
  const isVideo = latestRows.some((r) => r.media_type === 'video');
  const seScope = seEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safeSlot = slotId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const jobs: HermesJobEntry[] = latestRows.map((r) => ({
    slideIndex: Number(r.slide_index),
    jobId: String(r.hermes_job_id || ''),
    status:
      r.status === 'DONE'
        ? 'done'
        : r.status === 'FAILED'
        ? 'failed'
        : 'pending',
    localUrl: r.local_url || undefined,
    error: r.error || undefined,
  }));

  let readyUrls = latestRows
    .filter((r) => r.status === 'DONE' && r.local_url)
    .map((r) => String(r.local_url));

  const anyActive = latestRows.some((r) => r.status === 'PENDING' || r.status === 'PROCESSING');

  if (!anyActive && isVideo && readyUrls.length > 0) {
    try {
      const clipPaths = readyUrls
        .filter((u) => u.startsWith('/api/se/media/'))
        .map((u) => path.join(MEDIA_OUTPUT_DIR, path.basename(u)));
      if (clipPaths.length > 0) {
        const finalName = `${seScope}_${safeSlot}_final_25s.mp4`;
        const finalPath = path.join(MEDIA_OUTPUT_DIR, finalName);
        const subtitles: SubtitleSegment[] = [
          {
            startSec: 0.4,
            endSec: 7.4,
            text: 'Selamat datang di The Park Townhouse Sukoharjo,\nhunian boutique 2 lantai Japandi Modern.',
          },
          {
            startSec: 7.8,
            endSec: 15.0,
            text: 'Garasi dalam, smart door lock, one-gate RFID 24 jam,\ndan clubhouse lengkap tanpa biaya member.',
          },
          {
            startSec: 15.4,
            endSec: 22.3,
            text: 'Mulai Rp650 jutaan · Booking Fee Rp5 Juta.\nJadwalkan survei privat sekarang!',
          },
        ];
        await composeBrandedReelsVideo({
          clipPaths,
          subtitles,
          outputMp4Path: finalPath,
          targetTotalSec: 25,
        });
        readyUrls = [`/api/se/media/${finalName}`];
      }
    } catch {
      /* fallback to raw clips */
    }
  }

  const nextStatus = anyActive
    ? 'GENERATING'
    : readyUrls.length > 0
    ? 'READY'
    : 'FAILED';
  const firstErr = latestRows.find((r) => r.status === 'FAILED')?.error || null;

  await sql`
    UPDATE sales_os.se_content_slots
    SET hermes_job_ids = ${sql.json(jobs)},
        media_urls = ${sql.json(readyUrls)},
        media_status = ${nextStatus},
        media_error = ${firstErr},
        generated_at = ${nextStatus === 'READY' ? sql`NOW()` : null},
        updated_at = NOW()
    WHERE se_email = ${seEmail} AND slot_id = ${slotId}
  `;
}

/**
 * STRICT 1-AT-A-TIME GLOBAL SEQUENTIAL DISPATCHER + COOLDOWN (12-18s)
 * Ensures only 1 job is ever active in Hermes VNC across all SEs & slots.
 */
export async function pollActiveHermesJobs(): Promise<void> {
  if (isQueueTickBusy) return;
  isQueueTickBusy = true;
  try {
    await fs.mkdir(MEDIA_OUTPUT_DIR, { recursive: true });

    const activeRows = await sql`
      SELECT * FROM sales_os.media_render_queue
      WHERE status = 'PROCESSING'
      ORDER BY id ASC
      LIMIT 1
    `;

    if (activeRows.length > 0) {
      const item = activeRows[0];
      const seEmail = String(item.se_email);
      const slotId = String(item.slot_id);
      const jobId = String(item.hermes_job_id || '');

      if (!jobId) {
        await sql`
          UPDATE sales_os.media_render_queue
          SET status = 'FAILED', error = 'Job ID Hermes kosong', finished_at = NOW()
          WHERE id = ${item.id}
        `;
        await syncSlotFromQueue(seEmail, slotId);
        return;
      }

      try {
        const statusRes = await fetch(`${HERMES_API_URL}/v1/jobs/${jobId}`, {
          headers: { 'X-API-Key': HERMES_API_KEY },
          signal: AbortSignal.timeout(8000),
        });
        if (!statusRes.ok) return;

        const job = (await statusRes.json()) as {
          status?: string;
          error?: string;
          files?: string[];
          media_urls?: string[];
        };

        if (job.status === 'done' && Array.isArray(job.files) && job.files.length > 0) {
          const isVideo = item.media_type === 'video';
          const seScope = seEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const safeSlot = slotId.replace(/[^a-zA-Z0-9_-]/g, '_');
          const remoteFile = path.basename(job.files[0]);
          const mediaSourceUrl =
            job.media_urls?.[0] || `${HERMES_API_URL}/v1/media/${encodeURIComponent(remoteFile)}`;
          const ext = path.extname(remoteFile) || (isVideo ? '.mp4' : '.jpg');
          const localFileName = `${seScope}_${safeSlot}_slide_${item.slide_index}${ext}`;
          const localFilePath = path.join(MEDIA_OUTPUT_DIR, localFileName);

          let localUrl = mediaSourceUrl;
          const dlRes = await fetch(mediaSourceUrl, {
            headers: { 'X-API-Key': HERMES_API_KEY },
            signal: AbortSignal.timeout(25000),
          });
          if (dlRes.ok) {
            const buf = Buffer.from(await dlRes.arrayBuffer());
            await fs.writeFile(localFilePath, buf);
            localUrl = `/api/se/media/${localFileName}`;
          }

          await sql`
            UPDATE sales_os.media_render_queue
            SET status = 'DONE', local_url = ${localUrl}, finished_at = NOW()
            WHERE id = ${item.id}
          `;
          const remainingSameSlot = await sql`
            SELECT COUNT(*)::int AS cnt
            FROM sales_os.media_render_queue
            WHERE se_email = ${seEmail} AND slot_id = ${slotId} AND status = 'PENDING'
          `;
          if (Number(remainingSameSlot[0]?.cnt || 0) === 0) {
            // Slot selesai tuntas: wajib jeda minimal 1 menit sebelum lanjut ke slot/user berikutnya
            lastSlotFinishedAtMs = Date.now();
            lastFinishedSlotKey = `${seEmail}::${slotId}`;
            nextDispatchAllowedAtMs = lastSlotFinishedAtMs + MIN_INTER_SLOT_COOLDOWN_MS;
          } else {
            // Slide berikutnya di slot yang sama: jeda aman 12-18 detik
            nextDispatchAllowedAtMs = Date.now() + 12000 + Math.floor(Math.random() * 6000);
          }
          await syncSlotFromQueue(seEmail, slotId);
        } else if (job.status === 'failed') {
          const errMsg = job.error || 'Render gagal di Hermes VNC';
          await sql`
            UPDATE sales_os.media_render_queue
            SET status = 'FAILED', error = ${errMsg}, finished_at = NOW()
            WHERE id = ${item.id}
          `;
          if (/tidak biasa|unusual|timeout|gagal/i.test(errMsg)) {
            await sql`
              UPDATE sales_os.media_render_queue
              SET status = 'CANCELLED', error = ${errMsg}, finished_at = NOW()
              WHERE se_email = ${seEmail} AND slot_id = ${slotId} AND status = 'PENDING'
            `;
          }
          lastSlotFinishedAtMs = Date.now();
          lastFinishedSlotKey = `${seEmail}::${slotId}`;
          nextDispatchAllowedAtMs = lastSlotFinishedAtMs + MIN_INTER_SLOT_COOLDOWN_MS;
          await syncSlotFromQueue(seEmail, slotId);
        }
      } catch {
        /* retry next tick */
      }
      return;
    }

    if (Date.now() < nextDispatchAllowedAtMs) return;

    const nextRows = await sql`
      SELECT * FROM sales_os.media_render_queue
      WHERE status = 'PENDING'
      ORDER BY priority ASC, created_at ASC, id ASC
      LIMIT 1
    `;
    if (nextRows.length === 0) return;

    const nextItem = nextRows[0];
    const nextSlotKey = `${String(nextItem.se_email)}::${String(nextItem.slot_id)}`;
    if (
      lastFinishedSlotKey &&
      lastFinishedSlotKey !== nextSlotKey &&
      Date.now() < lastSlotFinishedAtMs + MIN_INTER_SLOT_COOLDOWN_MS
    ) {
      return;
    }
    try {
      const enqueueRes = await fetch(`${HERMES_API_URL}/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': HERMES_API_KEY,
        },
        body: JSON.stringify({
          type: nextItem.media_type === 'video' ? 'video' : 'image',
          prompt: String(nextItem.prompt),
          aspect: String(nextItem.aspect_ratio || '3:4'),
          count: 1,
          duration: '8',
          resolution: '720p',
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!enqueueRes.ok) {
        const errText = await enqueueRes.text().catch(() => '');
        await sql`
          UPDATE sales_os.media_render_queue
          SET status = 'FAILED', error = ${`Hermes API (${enqueueRes.status}): ${errText || enqueueRes.statusText}`}, finished_at = NOW()
          WHERE id = ${nextItem.id}
        `;
        nextDispatchAllowedAtMs = Date.now() + 15000;
        await syncSlotFromQueue(String(nextItem.se_email), String(nextItem.slot_id));
        return;
      }

      const json = (await enqueueRes.json()) as { job_id?: string };
      if (!json.job_id) {
        await sql`
          UPDATE sales_os.media_render_queue
          SET status = 'FAILED', error = 'Hermes tidak mengembalikan job_id', finished_at = NOW()
          WHERE id = ${nextItem.id}
        `;
        await syncSlotFromQueue(String(nextItem.se_email), String(nextItem.slot_id));
        return;
      }

      await sql`
        UPDATE sales_os.media_render_queue
        SET status = 'PROCESSING', hermes_job_id = ${json.job_id}, started_at = NOW()
        WHERE id = ${nextItem.id}
      `;
      await syncSlotFromQueue(String(nextItem.se_email), String(nextItem.slot_id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi Hermes';
      await sql`
        UPDATE sales_os.media_render_queue
        SET status = 'FAILED', error = ${msg}, finished_at = NOW()
        WHERE id = ${nextItem.id}
      `;
      nextDispatchAllowedAtMs = Date.now() + 15000;
      await syncSlotFromQueue(String(nextItem.se_email), String(nextItem.slot_id));
    }
  } catch {
    /* keep background dispatcher resilient */
  } finally {
    isQueueTickBusy = false;
  }
}

let schedulerStarted = false;

/**
 * Starts background pollers:
 * 1) Every 4s: polls active Hermes jobs so completed slides appear immediately (3/5, etc.)
 * 2) Every 60s: enqueues today's scheduled slots when their WIB hour arrives
 */
export function startContentMediaScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  setInterval(() => {
    void pollActiveHermesJobs();
  }, 4000);

  setInterval(async () => {
    try {
      const { dateStr, minutesOfDay } = getWibClock();

      // Auto-init 3 slot hari ini untuk SE yang sudah pernah aktif agar di jam 09:00/14:00/19:30 WIB sudah READY
      const activeSeRows = await sql`
        SELECT DISTINCT se_email FROM sales_os.se_content_slots
        WHERE se_email IS NOT NULL AND se_email <> ''
      `;
      for (const seRow of activeSeRows) {
        const seEmail = String(seRow.se_email);
        const todayExisting = await sql`
          SELECT slot_id FROM sales_os.se_content_slots
          WHERE se_email = ${seEmail} AND report_date = ${dateStr}::date
          LIMIT 1
        `;
        if (todayExisting.length === 0 && minutesOfDay >= 8 * 60 + 20) {
          const seName = seEmail.split('@')[0];
          const aiSlots = await generateUniqueDaySlotsWithAi(seEmail, seName, 1);
          for (const s of aiSlots) {
            const slotId = `slot-d1-s${s.slotOrder}-sales_in_house`;
            await sql`
              INSERT INTO sales_os.se_content_slots (
                se_email, slot_id, status, posted_url, day_number, slot_order,
                scheduled_time, funnel_stage, platform, format, title, brief,
                visual_prompt, caption, hashtags, cta, duration_seconds,
                persona_code, slide_deck, media_status, report_date, updated_at
              ) VALUES (
                ${seEmail}, ${slotId}, 'SIAP_POSTING', '', 1, ${s.slotOrder},
                ${s.scheduledTime}, ${s.funnelStage}, ${s.platform}, ${s.format}, ${s.title}, ${s.brief},
                ${s.visualPrompt}, ${s.caption}, ${sql.json(s.hashtags)}, ${s.cta}, ${s.durationSeconds},
                ${s.personaCode || null}, ${sql.json(s.slideDeck || [])}, 'SCHEDULED', ${dateStr}::date, NOW()
              )
              ON CONFLICT (se_email, slot_id) DO NOTHING
            `;
          }
        }
      }

      const dueRows = await sql`
        SELECT se_email, slot_id, slot_order, funnel_stage, format, title, brief, visual_prompt, duration_seconds, slide_deck
        FROM sales_os.se_content_slots
        WHERE report_date = ${dateStr}::date
          AND media_status = 'SCHEDULED'
        ORDER BY slot_order ASC, se_email ASC
        LIMIT 10
      `;
      for (const row of dueRows) {
        if (!isSlotDueNowWib(Number(row.slot_order || 1), minutesOfDay)) continue;
        const enq = await enqueueSlotMediaViaHermes({
          seEmail: String(row.se_email),
          slotId: String(row.slot_id),
          format: String(row.format || 'Carousel Edukasi'),
          funnelStage: String(row.funnel_stage || 'TOFU'),
          title: String(row.title || ''),
          brief: String(row.brief || ''),
          visualPrompt: String(row.visual_prompt || ''),
          durationSeconds: Number(row.duration_seconds || 15),
          slideDeck: Array.isArray(row.slide_deck) ? (row.slide_deck as SlideDeckItem[]) : undefined,
          priority: 10,
        });
        await sql`
          UPDATE sales_os.se_content_slots
          SET media_status = ${enq.ok ? 'GENERATING' : 'FAILED'},
              target_media_count = ${enq.targetCount},
              hermes_job_ids = ${sql.json(enq.jobs)},
              media_error = ${enq.error || null},
              updated_at = NOW()
          WHERE se_email = ${row.se_email} AND slot_id = ${row.slot_id}
        `;
      }
    } catch {
      /* silent */
    }
  }, 60_000);
}
