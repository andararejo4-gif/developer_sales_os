// ============================================================================
// HERMES AI CONTENT & MEDIA WORKER - DEVELOPER SALES OS
// Per-SE Unique AI Brief/Prompt + Non-Blocking Background Queue & Partial Pull
// ============================================================================

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sql } from './db';
import { USERS_BY_ROLE } from '../src/data';

const execFileAsync = promisify(execFile);
const BRAND_LOGO_PARK_PATH = path.resolve(process.cwd(), 'public', 'brand', 'logo-the-park.png');
const POSTER_COMPOSER_PY = path.resolve(process.cwd(), 'server', 'poster-composer.py');
const POSTER_PYTHON = (process.env.POSTER_PYTHON || (process.platform === 'win32' ? 'python' : 'python3')).trim();

/**
 * Semua teks, logo, kartu poin, denah asli, dan footer penawaran digambar oleh
 * server/poster-composer.py di atas background TANPA teks dari Recraft (0% typo, konsisten).
 */
async function composeBrandedPosterSlide(params: {
  imagePath: string;
  slideIndex: number;
  totalSlides: number;
  layout: PosterLayout;
  kicker: string;
  headline: string;
  subheadline: string;
  bullets?: string[];
  priceLabel?: string;
  bookingFee?: string;
  ctaLine?: string;
  denah?: { lt1: string; lt2: string; title: string; lt1Text: string; lt2Text: string };
}): Promise<void> {
  try {
    const payload = JSON.stringify({
      image_path: params.imagePath,
      logo_path: BRAND_LOGO_PARK_PATH,
      slide_index: params.slideIndex,
      total_slides: params.totalSlides,
      layout: params.layout,
      is_closing_poster: params.layout === 'closing',
      kicker: params.kicker,
      headline: params.headline,
      subheadline: params.subheadline,
      bullets: params.bullets || [],
      price_label: params.priceLabel || 'Rp650 Jutaan',
      booking_fee: params.bookingFee || 'Rp5.000.000',
      cta_line: params.ctaLine || 'Cash Keras · Cash Tempo 12/24 Bln · KPR DP 10% · Chat WA SE untuk Survei',
      denah_lt1: params.denah?.lt1,
      denah_lt2: params.denah?.lt2,
      denah_title: params.denah?.title,
      denah_lt1_text: params.denah?.lt1Text,
      denah_lt2_text: params.denah?.lt2Text,
    });
    await execFileAsync(POSTER_PYTHON, [POSTER_COMPOSER_PY, payload], { timeout: 25000 });
  } catch (err) {
    console.warn('[poster-composer] Gagal merender overlay poster:', err instanceof Error ? err.message : String(err));
  }
}
import {
  PLAYBOOK_AI_KNOWLEDGE_CONTEXT,
  PLAYBOOK_BUYER_PERSONAS,
  PLAYBOOK_UNIT_CATALOG,
  type PersonaCode,
} from '../src/lib/kb/playbook-v1-2-knowledge';
import { composeBrandedReelsVideo, type SubtitleSegment } from './video-composer';
import { inspectPoster, type CardSignature, type PosterConcept } from './poster-engine';
import { CAROUSEL_SLIDES, planBanner, planCarousel, writeCaption, type PlannedImage, type RenderMeta } from './poster-planner';
import {
  DENAH_FACTS,
  DENAH_SHOT_ID,
  SHOT_LIBRARY,
  denahPaths,
  isHarshHook,
  resolveShotSequence,
  resolveUnitType,
  type FunnelStage,
  type PosterLayout,
  type UnitType,
} from './visual-bible';

export const MEDIA_OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'generated-media');

const HERMES_API_URL = (process.env.HERMES_API_URL || 'https://hermes.giivepro.com').replace(/\/+$/, '');
const HERMES_API_KEY = process.env.FLOW_API_KEY || 'kzjsGMv5mYYaku8Teb5ATc9ZxyJAqWVVJZLA3iQI';
const HERMES_MEDIA_PAUSED = ['1', 'true', 'yes'].includes(
  String(process.env.HERMES_MEDIA_PAUSED || '').trim().toLowerCase()
);
const OPENROUTER_FREE_IMAGE_KEY = (process.env.OPENROUTER_FREE_IMAGE_KEY || '').trim();
const OPENROUTER_FREE_IMAGE_MODEL = (
  process.env.OPENROUTER_FREE_IMAGE_MODEL || 'recraft/recraft-v4.1-flash-v2:free'
).trim();

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

export interface FactCardData {
  tag: string;
  text: string;
  stats: Array<{ icon: string; value: string; label: string }>;
}

const CARD_ICONS = ['home', 'location', 'building', 'car', 'shield', 'wallet', 'key', 'clock', 'pool', 'tree', 'chart', 'check', 'star'];

function sanitizeFact(raw: unknown): FactCardData | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as { tag?: unknown; text?: unknown; stats?: unknown };
  const text = enforcePlaybookCompliance(String(r.text || '').replace(/\s+/g, ' ').trim());
  if (!text) return undefined;
  const stats = (Array.isArray(r.stats) ? r.stats : [])
    .slice(0, 3)
    .map((st: any) => ({
      icon: CARD_ICONS.includes(String(st?.icon || '').toLowerCase()) ? String(st.icon).toLowerCase() : 'star',
      value: enforcePlaybookCompliance(String(st?.value || '').trim()).slice(0, 14),
      label: enforcePlaybookCompliance(String(st?.label || '').trim()).slice(0, 40),
    }))
    .filter((st) => st.value);
  return { tag: String(r.tag || 'FUN FACT').trim().toUpperCase().slice(0, 22), text: text.slice(0, 220), stats };
}

export interface SlideDeckItem {
  slideNumber?: number;
  role?: string;
  kicker: string;
  headline: string;
  subheadline: string;
  bullets?: string[];
  isClosingPoster?: boolean;
  visualPrompt: string;
  /** ID dari SHOT_LIBRARY (atau "DENAH"). Arsitektur selalu dari visual-bible, bukan dari LLM. */
  shotId?: string;
  /** 75 | 95 | 110, dipakai slide DENAH & jumlah mobil di garasi. */
  unitType?: number;
  /** Data panel info (digambar sistem): tag, satu kalimat penjelasan, 0-3 statistik. */
  fact?: FactCardData;
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

export function getWibClock(): {
  dateStr: string;
  minutesOfDay: number;
  dayOfMonth: number;
  daysInMonth: number;
  monthNumber: number;
  year: number;
} {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const dateStr = wib.toISOString().slice(0, 10);
  const minutesOfDay = wib.getUTCHours() * 60 + wib.getUTCMinutes();
  const year = wib.getUTCFullYear();
  const monthIdx = wib.getUTCMonth();
  const dayOfMonth = wib.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  return {
    dateStr,
    minutesOfDay,
    dayOfMonth,
    daysInMonth,
    monthNumber: monthIdx + 1,
    year,
  };
}

export function formatWibDateForDay(dayNumber: number): string {
  const { year, monthNumber, daysInMonth } = getWibClock();
  const clampedDay = Math.max(1, Math.min(daysInMonth, dayNumber));
  return `${year}-${String(monthNumber).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

export interface BusyWindowInfo {
  busy: boolean;
  slotOrder?: 1 | 2 | 3;
  windowLabel?: string;
  unlockTime?: string;
  reason?: string;
}

/** Hanya akun ber-role SE di daftar akun yang punya kalender konten & jatah render. */
export const SE_EMAILS: string[] = Object.values(USERS_BY_ROLE)
  .filter((u) => u.role === 'SE')
  .map((u) => u.email.toLowerCase());

/** Jam tayang tiap putaran (menit WIB). Engine dipakai khusus terjadwal 60 menit sebelumnya. */
const SLOT_POST_MINUTES: Record<1 | 2 | 3, { at: number; label: string }> = {
  1: { at: 9 * 60, label: 'Pagi (TOFU 09:00 WIB)' },
  2: { at: 14 * 60, label: 'Siang (MOFU 14:00 WIB)' },
  3: { at: 19 * 60 + 30, label: 'Malam (BOFU 19:30 WIB)' },
};
const GENERATE_LEAD_MINUTES = 60;
/** Generate manual ditutup lebih awal agar tidak ada sisa pekerjaan saat putaran dimulai. */
const MANUAL_CLOSE_MINUTES = 10;
/** Masih boleh menyusul bila server sempat mati saat jendela berjalan. */
const CATCH_UP_MINUTES = 60;

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function getBusyWindowInfo(minutesOfDay: number): BusyWindowInfo {
  for (const order of [1, 2, 3] as const) {
    const { at, label } = SLOT_POST_MINUTES[order];
    const from = at - GENERATE_LEAD_MINUTES - MANUAL_CLOSE_MINUTES;
    if (minutesOfDay >= from && minutesOfDay <= at) {
      return {
        busy: true,
        slotOrder: order,
        windowLabel: `${hhmm(from)}–${hhmm(at)} WIB`,
        unlockTime: `${hhmm(at + 1)} WIB`,
        reason: `Engine sedang dipakai khusus untuk generate terjadwal Slot ${label} agar semua SE siap tepat waktu. Generate manual dibuka kembali pukul ${hhmm(at + 1)} WIB setelah antrean terjadwal selesai.`,
      };
    }
  }
  return { busy: false };
}

/** Status kunci manual: jendela terjadwal ATAU antrean terjadwal yang belum tuntas. */
export async function getManualLock(minutesOfDay: number): Promise<BusyWindowInfo> {
  const win = getBusyWindowInfo(minutesOfDay);
  if (win.busy) return win;
  const rows = await sql`
    SELECT COUNT(*)::int AS cnt FROM sales_os.media_render_queue
    WHERE priority = ${SCHEDULED_PRIORITY} AND status IN ('PENDING', 'PROCESSING')
  `.catch(() => [{ cnt: 0 }]);
  const left = Number(rows[0]?.cnt || 0);
  if (left === 0) return { busy: false };
  return {
    busy: true,
    windowLabel: 'Antrean terjadwal',
    unlockTime: 'antrean selesai',
    reason: `Masih ada ${left} gambar terjadwal yang sedang diselesaikan. Generate manual dibuka otomatis setelah antrean itu selesai.`,
  };
}

export function isSlotDueNowWib(slotOrder: number, minutesOfDay: number): boolean {
  const slot = SLOT_POST_MINUTES[slotOrder as 1 | 2 | 3];
  return Boolean(slot) && minutesOfDay >= slot.at - GENERATE_LEAD_MINUTES && minutesOfDay <= slot.at + CATCH_UP_MINUTES;
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
  'ULTRA-LUXURY ARCHITECTURAL PHOTOGRAPHY OF THE PARK TOWNHOUSE SUKOHARJO (ZERO HALLUCINATION): grand, majestic, magazine-cover tropical Japandi 2-story townhouses at peak golden-to-blue-hour twilight. SIGNATURE REPEATING ARCHITECTURE: (1) crisp matte warm-white architectural stucco 2nd-floor walls framed by subtle concrete edges (NEVER dark stone on 2nd floor), (2) dramatic deep-overhanging asymmetric single-pitch slanted dark charcoal roof rising sharply to the right peak with rich vertical warm teak-wood louver slats recessed under the eaves, (3) 2ND FLOOR WINDOWS: large slanted trapezoidal black-framed glass window on the left and tall narrow vertical glass window on the right, BOTH brightly illuminated from within showing cozy warm amber living-room interiors (soft sofas, sheer curtains, warm chandeliers, indoor plants), (4) 1ST FLOOR: dark textured stone & warm timber cladding, recessed ceiling downlights, warm lit wood-and-glass entrance door, recessed indoor wooden garage bay with luxury SUVs parked cleanly on sunlit stone paving, subtle warm wet-road golden reflections on the foreground street, (5) LUSH LUXURY ATMOSPHERE: manicured tropical palms & tall greenery behind the roofs, warm garden bollard uplights and pink-flowering shrubs between units, soft out-of-focus sunlit emerald tropical leaves delicately framing the outer upper-left and upper-right corners. Shot on medium-format architectural camera, ultra-sharp 8k, rich contrast, dramatic twilight sky.';

const UNIT_LAYOUT_TRAINING_CONTEXT = `
SPESIFIKASI VISUAL & DENAH ASLI THE PARK TOWNHOUSE SUKOHARJO (WAJIB AKURAT — ANTI-HALUSINASI):
- FASAD ASLI SEMUA CLUSTER: Rumah 2 lantai Japandi Modern dinding putih bersih + lantai dasar batu gelap charcoal, ATAP MIRING ASIMETRIS SATU ARAH (tinggi di sisi kanan, miring turun ke kiri) dengan plafon kayu jati hangat, jendela lantai 2 kiri berbentuk TRAPESIUM MIRING mengikuti atap, jendela lantai 2 kanan VERTIKAL TINGGI RAMPING + kisi-kisi kayu vertikal, garasi dalam di sisi kiri, carport grass-block hijau-putih, jalan paving abu-abu, pohon hias berbunga pink.
- DENAH ASLI TIPE 75 (Gold 3KT/2KM — Nagoya B.02–B.04):
  * LT 1: Carport 1 mobil (grass-block) di depan + GARASI DALAM 1 mobil di kiri + taman belakang kecil; kanan: pintu masuk, dapur kompak, 1 KM bawah tangga, tangga kayu, 1 KT belakang lantai 1.
  * LT 2: Ruang keluarga nyaman di sisi kiri + 2 KT di sisi kanan (depan & belakang) + 1 KM bersama.
- DENAH ASLI TIPE 95 (Gold/Diamond — Nagoya A.04/A.07, Osaka/Tokyo):
  * LT 1: Carport 1 mobil + GARASI DALAM 1 mobil PLUS ruang parkir 2 motor di sisi kanan garasi + taman belakang lebih luas; kanan: foyer/ruang tamu, 1 KM, dapur, tangga kayu, 1 KT belakang.
  * LT 2: Ruang keluarga LEBIH LEGA dengan sofa L-shape + 2 KT kanan + 1 KM.
- DENAH ASLI TIPE 110 (Diamond 4KT/3KM — Nagoya B.06/B.07, Osaka A.06/A.08/A.09, Tokyo B.07):
  * LT 1: Carport depan lebar + GARASI DALAM LUAS MUAT 2 MOBIL SUV BERDAMPINGAN (total 3 mobil aman!) + taman belakang memanjang; kanan: foyer, 2 KM lantai 1, dapur memanjang, tangga kayu, 1 KT lantai 1.
  * LT 2: Ruang keluarga sangat luas (3 sofa) + AREA LOUNGE/DECK KAYU (bisa untuk grand piano / ruang baca santai) menghadap jendela depan + 3 KT di sisi kanan (1 depan + 2 belakang berdampingan) + 1 KM.
`.trim();

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

const CLUSTER_NAMES = ['Nagoya', 'Osaka', 'Tokyo'];

/** Fakta cluster terkunci (dari Playbook). LLM dilarang menambah klaim di luar daftar ini. */
const CLUSTER_FACTS = `FAKTA CLUSTER TERKUNCI (satu-satunya klaim yang boleh dipakai untuk membahas cluster; DILARANG menambah luas lot, jarak/akses, jumlah mobil, atau fasilitas di luar daftar ini):
- NAGOYA: 14 unit; Jl. Tentara Pelajar; lokasi clubhouse (kolam renang, gym, cafe & resto, lounge, ruang meeting, mini golf 9 hole, game station); tipe 75 (Gold 3 KT, B.02-B.04), tipe 95 (A.04/A.07), tipe 110 (Diamond 4 KT, B.06/B.07); harga masuk Rp650 juta cash / Rp683 juta KPR.
- OSAKA: 9 unit; koridor Jl. Jenderal Sudirman, Kp. Duabelasan; seri A.01-A.09; A.03 Rp840 juta (termasuk termurah); Diamond 4 KT big lot A.06/A.08/A.09 (hingga Rp1,15 miliar flagship A.09); tipe 95 dan 110.
- TOKYO: 7 unit; koridor Jl. Jenderal Sudirman; B.03 Gold 3 KT Rp775 juta cash (harga masuk terendah di koridor); B.07 LT 125 Diamond 4 KT Rp1,09 miliar; tipe 95 dan 110.
- Semua cluster: One-Gate RFID, satpam 24 jam, CCTV 4K 30 hari, smart door lock. Clubhouse hanya disebut sebagai lokasi di Nagoya.`;

/**
 * Validasi benang merah carousel: jika cover menjanjikan perbandingan beberapa cluster,
 * slide 2..N+1 wajib membahas cluster itu satu per satu (headline/kicker menyebut namanya).
 */
function checkDeckCoherence(deck?: SlideDeckItem[]): string[] {
  if (!deck || deck.length < 3) return [];
  const textOf = (d: SlideDeckItem) => `${d.kicker} ${d.headline} ${d.subheadline}`.toLowerCase();
  const cover = textOf(deck[0]);
  const promised = CLUSTER_NAMES.filter((c) => cover.includes(c.toLowerCase())).sort(
    (a, b) => cover.indexOf(a.toLowerCase()) - cover.indexOf(b.toLowerCase())
  );
  const issues: string[] = [];
  if (promised.length >= 2) {
    promised.forEach((name, i) => {
      const slide = deck[i + 1];
      const head = slide ? `${slide.kicker} ${slide.headline}`.toLowerCase() : '';
      if (!head.includes(name.toLowerCase())) {
        issues.push(`Cover menjanjikan ${promised.join(' vs ')} tetapi slide ${i + 2} tidak membahas ${name} di kicker/headline`);
      }
    });
  }
  deck.forEach((d, i) => {
    const k = d.kicker.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
    const h = new Set(d.headline.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean));
    if (k.length > 0 && k.every((w) => h.has(w))) issues.push(`Kicker slide ${i + 1} hanya mengulang headline`);
  });
  deck.forEach((d, i) => {
    if (isHarshHook(textOf(d))) issues.push(`Teks slide ${i + 1} terlalu menekan/menyindir; ganti hook netral yang mengundang (rasa, suasana, pulang, keluarga)`);
  });
  const statSeen = new Set<string>();
  deck.forEach((d, i) => {
    for (const st of d.fact?.stats || []) {
      const key = `${st.value}`.toLowerCase();
      if (statSeen.has(key)) issues.push(`Statistik "${st.value}" dipakai lebih dari satu slide (slide ${i + 1})`);
      statSeen.add(key);
    }
  });
  const seen = new Set<string>();
  deck.forEach((d, i) => {
    const key = d.headline.trim().toLowerCase();
    if (seen.has(key)) issues.push(`Headline slide ${i + 1} duplikat`);
    seen.add(key);
  });
  return issues;
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
  const focusUnitType: UnitType = resolveUnitType(unitFocus.label);
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

  const shotMenu = Object.values(SHOT_LIBRARY)
    .map((sh) => `       - ${sh.id}: ${sh.label}`)
    .join('\n');

  if (baseUrl && apiKey) {
    try {
      const prompt = `Kamu adalah Creative Director Properti & Strategist Konten untuk Sales Executive "${seName}".
WAJIB 100% BERDASARKAN DATA RESMI PLAYBOOK V1.2 DI BAWAH INI — DILARANG KERAS MENGARANG HARGA, SPESIFIKASI, ATAU JANJI TERLARANG:

${PLAYBOOK_AI_KNOWLEDGE_CONTEXT}

${UNIT_LAYOUT_TRAINING_CONTEXT}

${CLUSTER_FACTS}

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
   - TUJUAN TOFU: Menarik audiens baru & memicu Save/Share dengan HOOK KUAT & FUN FACT informatif (Slide 1–5 TANPA hard-sell), lalu ditutup Slide 6 berupa POSTER MARKETING LENGKAP.
   - "hook" (baris 1 caption, maks 12 kata): Gunakan *Curiosity / Contrast / Dilemma Hook* yang bikin orang berhenti scroll (contoh: "Cluster Nagoya, Osaka, atau Tokyo — mana yang paling cocok untuk keluargamu?").
   - WAJIB punya "slideDeck" tepat 6 slide dengan SATU BENANG MERAH (story spine). Isi field "storySpine" (1 kalimat: janji cover + cara slide 2-6 memenuhinya). Sertakan "bullets" [2-3 poin] pada Slide 2-5:
     * Slide 1 (Cover = JANJI): scroll-stopper sesuai "hook". Jika cover menyebut daftar/perbandingan (mis. Nagoya vs Osaka vs Tokyo), itu adalah JANJI yang WAJIB dipenuhi slide berikutnya.
     * Slide 2-4 (PEMENUHAN JANJI): jika cover membandingkan N pilihan, tiap slide membahas TEPAT SATU pilihan sesuai urutan di cover, dan headline-nya WAJIB menyebut nama pilihan itu. Jika cover bukan perbandingan, tiap slide membuktikan satu klaim cover (masalah, bukti desain/denah, bukti fasilitas). Dilarang pindah topik ke hal yang tidak dijanjikan cover.
     * Slide 5 (RANGKUMAN + SOFT CTA): rangkum perbandingan/bukti (mis. "pilih Nagoya jika..., Osaka jika..., Tokyo jika...") lalu ajak Save/Share/komen/DM.
     * Slide 6 (POSTER MARKETING LENGKAP, isClosingPoster: true): headline penawaran, subheadline "The Park Townhouse Solusinya!".
   - Semua angka/lokasi/fasilitas di slide WAJIB dari data Playbook, denah, dan FAKTA CLUSTER TERKUNCI di atas. Dilarang mengarang. Slide 6 berisi penawaran umum The Park Townhouse (headline bukan nama satu unit).
   - VISUAL: JANGAN menulis deskripsi bangunan. Setiap slide wajib punya "shotId" dari daftar berikut (arsitektur rumah otomatis dikunci sistem; shotId tidak boleh sama di dua slide kecuali slide 6):
${shotMenu}
     Slide yang membahas tata ruang/garasi/denah BOLEH memakai shotId "DENAH" (maks 1 slide per carousel) dan WAJIB mengisi "unitType" (75, 95, atau 110) sesuai unit fokus; teks denah ditempel sistem dari denah asli.
     "visualPrompt" cukup 1 kalimat suasana (mis. "hangat, keluarga muda"), tanpa menyebut bentuk atap/jendela/rumah.
   - ATURAN TEKS SLIDE (teks digambar langsung oleh AI gambar, jadi HARUS SANGAT RINGKAS agar tidak typo): kicker 2-3 kata, headline 3-5 kata (kata sederhana, tanpa singkatan aneh), subheadline 4-7 kata, bullets 2-3 poin masing-masing MAKS 9 kata. Tanpa tanda kutip dan tanpa emoji di teks slide. KICKER WAJIB BERBEDA dari headline: kicker = label/pembuka pendek bergaya tulisan tangan (mis. "Pilihan pertama", "Fakta menarik", "Yang perlu kamu tahu"), headline = inti pesan. Dilarang mengulang kata yang sama di keduanya.
   - PANEL INFO per slide (digambar sistem; kamu hanya mengisi DATA): untuk Slide 1-5 isi "fact": {"tag":"2-3 kata kapital sesuai peran slide (mis. TAHUKAH KAMU, FUN FACT, FAKTA, REKAP)","text":"1 kalimat penjelasan maks 22 kata yang memperkuat headline slide itu","stats":[{"icon":"home|location|building|car|shield|wallet|key|clock|pool|tree|chart|check|star","value":"maks 10 karakter, mis. 14 Unit atau Rp650 Jt","label":"maks 5 kata"}]}. Isi 2-3 stats yang BERBEDA di tiap slide (angka tidak boleh berulang antar slide) dan HANYA dari FAKTA TERKUNCI/Playbook. Slide 6 (poster) tidak perlu "fact".
2. Slot 2 (14:00 WIB, MOFU — Consideration, Pertimbangan & Bukti Nyata, format "${slot2Format}", platform "${slot2Format === 'Carousel Edukasi' ? 'Instagram' : 'TikTok'}", durationSeconds=${slot2Format === 'Carousel Edukasi' ? 0 : reelsDur1}):
   - TUJUAN MOFU: Membantu audiens membandingkan & percaya pada kualitas ${unitFocus.label} (vs rumah second / bangun sendiri).
   - "hook" (baris 1 caption, maks 14 kata): Gunakan *Comparison / Myth-Busting / Proof Hook* (contoh pola: "Beli rumah second siap huni vs townhouse Japandi baru: mana yang lebih hemat biaya tak terduga?").
   - ${slot2Format === 'Carousel Edukasi' ? 'WAJIB sertakan "slideDeck" tepat 5 slide yang nyambung (Slide 1 Cover Bedah Unit -> Slide 2 Bukti Lokasi -> Slide 3 Bukti Tata Ruang & Garasi -> Slide 4 Bukti Clubhouse & Smart Living -> Slide 5 CTA Survei Privat), kicker 2-3 kata, headline 3-5 kata, subheadline 4-7 kata.' : `Sertakan "brief" skrip per detik yang KETAT (0-3d: Visual+Text Hook scroll-stopper | 4-11d: Tur & Bukti spesifikasi ${unitFocus.label} | 12-${reelsDur1}d: CTA Survei Privat) + visualPrompt sinematik vertikal 9:16.`}
3. Slot 3 (19:30 WIB, BOFU — Conversion, Penawaran & Closing, format "${slot3Format}", platform "Instagram", durationSeconds=${slot3Format === 'Single Image + Visual Quote' ? 0 : reelsDur2}):
   - TUJUAN BOFU: Mendorong aksi nyata (DM/WA/Survei/Booking) dengan penawaran spesifik unit ${unitFocus.label} (Cash ${unitCashLabel} / KPR ${unitKprLabel} / CT12 / CT24, Booking Fee Rp5 Juta, momentum penyesuaian harga Desember ±7–8%).
   - "hook" (baris 1 caption, maks 14 kata): Gunakan *Specific Offer / Price-Anchor Hook* (contoh pola: "Mulai ${unitKprLabel} (KPR) — 3 kamar tidur + garasi dalam + akses clubhouse seumur hidup, unit boutique terbatas."). Dilarang sapaan chat kaku seperti "Malam Bapak/Ibu".
   - ${slot3Format === 'Single Image + Visual Quote' ? `WAJIB sertakan "slideDeck" berisi tepat 1 objek poster flagship [{"kicker":"2-3 kata","headline":"3-5 kata","subheadline":"4-7 kata","visualPrompt":"sweeping diagonal cluster street at golden hour...","badgePrice":"${unitBadge}"}]` : `Sertakan "brief" skrip per detik yang KETAT (0-3d: Offer Hook dengan angka resmi | 4-11d: Skema bayar Cash/KPR/CT24 & keunggulan inti | 12-${reelsDur2}d: CTA WA & Booking Rp5 Juta) + visualPrompt sinematik vertikal 9:16.`}

Setiap objek dalam JSON array WAJIB memiliki field: "hook", "title", "brief", "visualPrompt", "caption", "hashtags", "cta", "platform", "durationSeconds", dan "slideDeck" (bila Carousel/Single Image), plus "storySpine" untuk Carousel. Tiap item slideDeck: "kicker", "headline", "subheadline", "bullets" (Slide 2-5), "shotId", "unitType" (hanya bila shotId "DENAH"), "visualPrompt", "isClosingPoster". Carousel MOFU juga memakai aturan benang merah & shotId yang sama (Slide 1 janji, slide 2-4 pemenuhan, slide 5 CTA).

ATURAN GAYA COPYWRITING CAPTION (WAJIB FUN, EXCITED & MANUSIAWI):
- Tulis dengan gaya kreator properti Instagram/TikTok yang hangat, antusias, mengalir, dan enak dibaca di layar HP (paragraf pendek 1–2 kalimat, pakai 2–4 emoji relevan secara natural).
- DILARANG KERAS menulis label segmen kaku di awal kalimat (seperti "Untuk Perantau / Pekerja Migran:" atau "Untuk Dokter:") dan DILARANG menulis tag internal seperti "(Gold/Diamond)", "[P4]", atau "(H-1)" di judul maupun caption!
- Ubah spesifikasi teknis menjadi cerita manfaat hidup sehari-hari yang bikin audiens membayangkan tinggal di sana.

Balas HANYA JSON array valid berisi 3 objek (tanpa markdown fence).`;

      let feedback = '';
      for (let attempt = 0; attempt < 2; attempt++) {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: attempt === 0 ? process.env.CONTENT_MODEL || 'cbai/glm-5.3-flash' : model,
          stream: false,
          tools: [],
          tool_choice: 'none',
          temperature: 0.8,
          messages: [
            {
              role: 'system',
              content:
                'Kamu adalah Creative Director & Social Media Copywriter properti yang jago bikin konten viral, fun, antusias, dan dekat dengan audiens (bukan bahasa brosur kaku), 100% patuh pada data resmi Playbook v1.2, anti-halusinasi, dan selalu membalas JSON array valid. DILARANG menulis nama fiktif persona, kode nomor #12/#16, atau tag internal (Gold/Diamond) di caption publik.',
            },
            { role: 'user', content: prompt + feedback },
          ],
        }),
        signal: AbortSignal.timeout(150000),
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
            const built: GeneratedSlotSpec[] = parsed.map((item, idx): GeneratedSlotSpec => {
              const expectedFormat: GeneratedSlotSpec['format'] =
                idx === 0 ? 'Carousel Edukasi' : idx === 1 ? slot2Format : slot3Format;
              const isDeckFormat =
                expectedFormat === 'Carousel Edukasi' ||
                expectedFormat === 'Single Image + Visual Quote';
              const maxSlides = expectedFormat === 'Single Image + Visual Quote' ? 1 : 6;
              const cleanedDeck =
                isDeckFormat && Array.isArray(item.slideDeck) && item.slideDeck.length > 0
                  ? item.slideDeck.slice(0, maxSlides).map((sl, sIdx) => ({
                      slideNumber: sIdx + 1,
                      role: sl.role || (sIdx === 0 ? 'Cover Hook' : sIdx === maxSlides - 1 ? 'Poster Marketing' : `Value ${sIdx}`),
                      kicker: enforcePlaybookCompliance(String(sl.kicker || pillar.label.split(' ')[0])),
                      headline: enforcePlaybookCompliance(String(sl.headline || item.title || 'HUNIAN JAPANDI MODERN')),
                      subheadline: enforcePlaybookCompliance(String(sl.subheadline || 'THE PARK TOWNHOUSE SUKOHARJO')),
                      bullets: Array.isArray(sl.bullets)
                        ? sl.bullets.slice(0, 3).map((b) => enforcePlaybookCompliance(String(b || '').trim())).filter(Boolean)
                        : undefined,
                      isClosingPoster: Boolean(sl.isClosingPoster) || (maxSlides === 6 && sIdx === 5),
                      visualPrompt: sanitizeVisualPrompt(String(sl.visualPrompt || item.visualPrompt || ''), seName),
                      shotId: String(sl.shotId || ''),
                      unitType: Number(sl.unitType) || undefined,
                      fact: sanitizeFact((sl as { fact?: unknown }).fact),
                      badgePrice:
                        idx === 2 && (sIdx === 0 || sIdx === maxSlides - 1)
                          ? enforcePlaybookCompliance(String(sl.badgePrice || unitBadge))
                          : undefined,
                    }))
                  : undefined;
              if (cleanedDeck) {
                const stageForShots = (idx === 0 ? 'TOFU' : idx === 1 ? 'MOFU' : 'BOFU') as FunnelStage;
                const seq = resolveShotSequence(cleanedDeck.map((d) => d.shotId), stageForShots, cleanedDeck.length);
                cleanedDeck.forEach((d, i) => {
                  d.shotId = seq[i];
                  const wanted = Number(d.unitType);
                  d.unitType =
                    d.shotId === DENAH_SHOT_ID && [75, 95, 110].includes(wanted) ? wanted : focusUnitType;
                });
              }

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
            const issues = checkDeckCoherence(built[0]?.slideDeck);
            if (issues.length === 0 || attempt === 1) {
              if (issues.length) console.warn('[content-ai] Deck TOFU belum nyambung setelah retry:', issues.join(' | '));
              return built;
            }
            console.warn(`[content-ai] Deck TOFU tidak nyambung, retry: ${issues.join(' | ')}`);
            feedback = `

REVISI WAJIB (jawaban sebelumnya gagal validasi): ${issues.join(' | ')}. Perbaiki slideDeck Slot 1 agar slide 2-4 memenuhi janji cover, lalu balas ulang JSON array lengkap 3 objek.`;
            continue;
          }
        }
        break;
      } else {
        console.warn(`[content-ai] 9router HTTP ${resp.status}`);
        if (resp.status >= 500 && attempt === 0) continue;
        break;
      }
      }
    } catch (err) {
      console.warn('[content-ai] Generate AI gagal, pakai fallback Playbook:', err instanceof Error ? err.message : String(err));
    }
  }

  const tofuDeck: SlideDeckItem[] = [
    {
      slideNumber: 1,
      role: 'Cover Janji',
      kicker: 'Kamu Pilih Yang Mana?',
      headline: 'CLUSTER NAGOYA VS OSAKA VS TOKYO',
      subheadline: '3 Cluster Boutique Japandi di Sukoharjo, Beda Lokasi, Beda Gaya Hidup',
      visualPrompt: 'Hangat, megah, penuh harapan.',
      shotId: 'FRONT_ROW',
    },
    {
      slideNumber: 2,
      role: 'Pemenuhan 1: Nagoya',
      kicker: 'Cluster Nagoya',
      headline: 'NAGOYA: DEKAT CLUBHOUSE',
      subheadline: '14 Unit Boutique, Mulai Rp650 Jutaan',
      bullets: [
        'Berlokasi di Jl. Tentara Pelajar, satu area dengan clubhouse dan kolam renang.',
        'Pilihan unit paling beragam: Tipe 75 (Gold 3 KT) sampai Tipe 110 (Diamond 4 KT).',
        'Harga masuk resmi Rp650 juta cash atau Rp683 juta lewat KPR.',
      ],
      visualPrompt: 'Santai, keluarga aktif.',
      shotId: 'CLUBHOUSE',
    },
    {
      slideNumber: 3,
      role: 'Pemenuhan 2: Osaka',
      kicker: 'Cluster Osaka',
      headline: 'OSAKA: KORIDOR SUDIRMAN',
      subheadline: '9 Unit Boutique, Mulai Rp840 Jutaan',
      bullets: [
        'Berada di koridor utama Jl. Jenderal Sudirman, Kp. Duabelasan, Sukoharjo.',
        'Pilihan unit dari seri A.01 sampai A.09, termasuk Diamond 4 KT big lot.',
        'Harga mulai Rp840 juta (A.03) hingga flagship A.09 Rp1,15 miliar.',
      ],
      visualPrompt: 'Strategis, tenang, premium.',
      shotId: 'GATE_ENTRANCE',
    },
    {
      slideNumber: 4,
      role: 'Pemenuhan 3: Tokyo',
      kicker: 'Cluster Tokyo',
      headline: 'TOKYO: PALING TERJANGKAU DI KORIDOR',
      subheadline: '7 Unit Boutique, Mulai Rp775 Jutaan',
      bullets: [
        'Hanya 7 unit eksklusif di koridor Jl. Jenderal Sudirman, lingkungan tenang dan homogen.',
        'Tokyo B.03 (Gold 3 KT) mulai Rp775 juta cash, harga masuk terendah di koridor ini.',
        'Tersedia juga Tokyo B.07 (LT 125, Diamond 4 KT) untuk keluarga besar.',
      ],
      visualPrompt: 'Eksklusif, privat.',
      shotId: 'FACADE_CLOSEUP',
    },
    {
      slideNumber: 5,
      role: 'Rangkuman & Soft CTA',
      kicker: 'Simpan & Pilih',
      headline: 'KAMU TIM CLUSTER MANA?',
      subheadline: 'Simpan Postingan Ini, Lalu Komen Pilihanmu',
      bullets: [
        'Nagoya: cocok kalau ingin dekat clubhouse dan pilihan tipe paling lengkap.',
        'Osaka: cocok kalau butuh akses koridor Sudirman dengan pilihan unit besar.',
        'Tokyo: cocok kalau ingin harga masuk lebih ringan di koridor Sudirman.',
      ],
      visualPrompt: 'Hangat, mengajak berdiskusi.',
      shotId: 'STREET_LIFE',
    },
    {
      slideNumber: 6,
      role: 'Poster Marketing Lengkap',
      kicker: 'The Park Townhouse Solusinya!',
      headline: 'HUNIAN JAPANDI EKSKLUSIF SUKOHARJO',
      subheadline: 'Boutique 2 Lantai, Siap Huni Tanpa Repot Renovasi',
      isClosingPoster: true,
      visualPrompt: 'Megah, penutup kuat.',
      shotId: 'FRONT_ROW_CLOSING',
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
      visualPrompt: 'Lega, terang, siap huni.',
      shotId: DENAH_SHOT_ID,
      unitType: focusUnitType,
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
  const { daysInMonth } = getWibClock();
  const startDay = (weekNumber - 1) * 7 + 1;
  const endDay = Math.min(daysInMonth, weekNumber * 7);
  let savedCount = 0;

  for (let day = startDay; day <= endDay; day++) {
    const dayDateStr = formatWibDateForDay(day);
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
          ${s.personaCode || 'P1'}, ${sql.json(s.slideDeck || [])}, 'SCHEDULED', ${dayDateStr}::date, NOW()
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
          report_date = EXCLUDED.report_date,
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
interface SlideContext {
  layout: PosterLayout;
  totalSlides: number;
  unitType: UnitType;
  slideMeta?: SlideDeckItem;
  title: string;
  /** Teks yang HARUS tergambar persis oleh AI pada slide ini (dipakai verifikasi vision). */
  expectedTexts: string[];
}

async function loadSlideContext(seEmail: string, slotId: string, slideIdx: number): Promise<SlideContext> {
  const slotRows = await sql`
    SELECT title, slide_deck, target_media_count
    FROM sales_os.se_content_slots
    WHERE se_email = ${seEmail} AND slot_id = ${slotId}
    LIMIT 1
  `;
  const slotRow = slotRows[0];
  const deck = Array.isArray(slotRow?.slide_deck) ? (slotRow.slide_deck as SlideDeckItem[]) : [];
  const totalSlides = Math.max(Number(slotRow?.target_media_count || deck.length || 6), slideIdx);
  const slideMeta = deck.find((d) => Number(d.slideNumber) === slideIdx) || deck[slideIdx - 1];
  const rawUnit = Number(slideMeta?.unitType);
  const unitType: UnitType = ([75, 95, 110] as number[]).includes(rawUnit) ? (rawUnit as UnitType) : 95;
  const layout = pickPosterLayout({
    slideIdx,
    totalSlides,
    isClosingFlag: Boolean(slideMeta?.isClosingPoster),
    isDenah: slideMeta?.shotId === DENAH_SHOT_ID,
  });
  const expectedTexts = slideMeta
    ? [
        slideMeta.kicker,
        slideMeta.headline,
        slideMeta.subheadline,
        ...(layout === 'content' ? (slideMeta.bullets || []).slice(0, 3) : []),
      ]
        .map((t) => String(t || '').trim())
        .filter(Boolean)
    : [];
  return { layout, totalSlides, unitType, slideMeta, title: String(slotRow?.title || ''), expectedTexts };
}

function pickPosterLayout(p: { slideIdx: number; totalSlides: number; isClosingFlag: boolean; isDenah: boolean }): PosterLayout {
  if (p.isDenah) return 'denah';
  if (p.totalSlides === 1 || p.isClosingFlag || (p.totalSlides >= 6 && p.slideIdx === p.totalSlides)) return 'closing';
  return p.slideIdx === 1 ? 'cover' : 'content';
}

/** Teks digambar AI; server hanya menempel logo resmi dan denah asli (slide DENAH). */
async function composeSlideFromQueue(ctx: SlideContext, slideIdx: number, localFilePath: string): Promise<void> {
  const facts = DENAH_FACTS[ctx.unitType];
  const paths = denahPaths(ctx.unitType);
  await composeBrandedPosterSlide({
    imagePath: localFilePath,
    slideIndex: slideIdx,
    totalSlides: ctx.totalSlides,
    layout: ctx.layout,
    kicker: ctx.slideMeta?.kicker || '',
    headline: ctx.slideMeta?.headline || ctx.title,
    subheadline: ctx.slideMeta?.subheadline || '',
    denah:
      ctx.layout === 'denah'
        ? { lt1: paths.lt1, lt2: paths.lt2, title: facts.title, lt1Text: facts.lt1, lt2Text: facts.lt2 }
        : undefined,
  });
}

/** Konsep slot -> rencana gambar (banner tunggal atau carousel 6 slide). */
async function planSlotImages(p: {
  seEmail: string;
  slotId: string;
  title: string;
  brief: string;
  stage: FunnelStage;
  single: boolean;
  scheduled: boolean;
}): Promise<PlannedImage[]> {
  const text = `${p.title} ${p.brief}`;
  const named = CLUSTER_NAMES.filter((c) => text.toLowerCase().includes(c.toLowerCase()));
  const cluster = (named.length === 1 ? named[0] : 'ALL') as PosterConcept['cluster'];
  const personaRows = await sql`
    SELECT persona_code FROM sales_os.se_content_slots
    WHERE se_email = ${p.seEmail} AND slot_id = ${p.slotId} LIMIT 1
  `.catch(() => [] as any[]);
  const persona = PLAYBOOK_BUYER_PERSONAS[(personaRows[0]?.persona_code || 'P1') as PersonaCode] || PLAYBOOK_BUYER_PERSONAS.P1;
  const concept: PosterConcept = {
    stage: p.stage,
    cluster,
    pillarLabel: p.title.slice(0, 120),
    pillarFocus: p.brief.slice(0, 240),
    audience: persona.archetype,
    motivation: persona.motivasi,
  };
  const recentRows = await sql`
    SELECT render_meta->'signature' AS sig FROM sales_os.media_render_queue
    WHERE render_meta ? 'signature' AND render_meta->'signature' <> 'null'::jsonb
    ORDER BY id DESC LIMIT 12
  `.catch(() => [] as any[]);
  const recent = recentRows.map((r: any) => r.sig as CardSignature).filter((sig) => sig && sig.theme).reverse();
  const usedRows = await sql`
    SELECT LOWER(render_meta->>'headline') AS h FROM sales_os.media_render_queue
    WHERE render_meta ? 'headline' AND created_at > NOW() - INTERVAL '14 days'
    ORDER BY id ASC
  `.catch(() => [] as any[]);
  const used = usedRows.map((r: any) => String(r.h));
  const { year, monthNumber } = getWibClock();
  const seed = `${p.seEmail}:${p.slotId}:${year}-${monthNumber}:${used.length}`;
  // Manual dipicu dari HTTP, jadi anggaran LLM pendek; terjadwal boleh lebih lama.
  const budgetMs = p.scheduled ? 90_000 : 25_000;
  const input = { concept, recent, used, seed, budgetMs };
  if (p.single) return planBanner(input);
  const images = await planCarousel(input, resolveUnitType(text));
  if (p.scheduled) {
    // Caption ikut isi slide. Generate manual tidak menimpa caption yang mungkin sudah disunting SE.
    const caption = enforcePlaybookCompliance(await writeCaption(concept, images, 40_000));
    await sql`
      UPDATE sales_os.se_content_slots SET caption = ${caption}
      WHERE se_email = ${p.seEmail} AND slot_id = ${p.slotId}
    `.catch(() => {});
  }
  return images;
}

/** Tempel logo resmi & denah asli. Mengembalikan pesan masalah (kosong = beres). */
async function finishPoster(imagePath: string, meta: RenderMeta): Promise<string> {
  const unit = meta.unitType || 95;
  const denah = meta.layout === 'denah' ? { ...denahPaths(unit), facts: DENAH_FACTS[unit] } : null;
  const payload = JSON.stringify({
    image_path: imagePath,
    logo_path: BRAND_LOGO_PARK_PATH,
    layout: meta.layout,
    denah_lt1: denah?.lt1,
    denah_lt2: denah?.lt2,
    denah_title: denah?.facts.title,
    denah_lt1_text: denah?.facts.lt1,
    denah_lt2_text: denah?.facts.lt2,
  });
  try {
    await execFileAsync(POSTER_PYTHON, [POSTER_COMPOSER_PY, payload], { timeout: 40000 });
    return '';
  } catch (err) {
    const e = err as { stderr?: string; message?: string };
    return (e.stderr || e.message || 'composer gagal').trim().split('\n').pop() || 'composer gagal';
  }
}

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
  if (HERMES_MEDIA_PAUSED) {
    return {
      ok: false,
      targetCount: 0,
      jobs: [],
      error: 'Generate media Hermes sedang dijeda sementara untuk penghematan kredit.',
    };
  }
  if (!SE_EMAILS.includes(params.seEmail.toLowerCase())) {
    return { ok: false, targetCount: 0, jobs: [], error: 'Generate konten hanya untuk akun Sales Executive.' };
  }
  const fmtLower = params.format.toLowerCase();
  const isVideo = fmtLower.includes('reels') || fmtLower.includes('video');
  const isSinglePoster =
    !isVideo && (fmtLower.includes('single') || fmtLower.includes('poster') || fmtLower.includes('quote'));

  // Video = 3 klip Omni @8 detik + outro 2 logo; Single Poster = 1 poster megah; Carousel = 6 slide (5 cerita + 1 poster closing)
  const targetCount = isVideo ? 3 : isSinglePoster ? 1 : CAROUSEL_SLIDES;
  const basePrompt = sanitizeVisualPrompt(params.visualPrompt || params.brief || params.title);

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
    WHERE se_email = ${params.seEmail} AND slot_id = ${params.slotId} AND status IN ('PENDING', 'LOCAL_PENDING')
  `.catch(() => {});

  const jobs: HermesJobEntry[] = [];
  const priority = params.priority ?? 20;
  const stageNorm = (['TOFU', 'MOFU', 'BOFU'].includes((params.funnelStage || '').toUpperCase())
    ? (params.funnelStage || '').toUpperCase()
    : 'TOFU') as FunnelStage;
  const planned: PlannedImage[] = isVideo
    ? []
    : await planSlotImages({ ...params, stage: stageNorm, single: isSinglePoster, scheduled: priority === SCHEDULED_PRIORITY });
  if (planned.length > 0) {
    const newDeck = planned.map((img, i) => ({
      slideNumber: i + 1,
      kicker: img.kicker,
      headline: img.headline,
      subheadline: img.subheadline,
      visualPrompt: '',
      isClosingPoster: img.meta.layout === 'banner',
    }));
    await sql`
      UPDATE sales_os.se_content_slots SET slide_deck = ${sql.json(newDeck)}
      WHERE se_email = ${params.seEmail} AND slot_id = ${params.slotId}
    `.catch(() => {});
  }

  for (let i = 0; i < targetCount; i++) {
    const slidePrompt = isVideo
      ? `${videoScenes[i % videoScenes.length].visual}. Context: ${basePrompt}. ${BRAND_VISUAL_DNA} Natural warm Indonesian human voiceover speaking clearly in conversational Bahasa Indonesia: "${videoScenes[i % videoScenes.length].voiceover}". Vertical 9:16 real estate video.`
      : planned[i].prompt;
    await sql`
      INSERT INTO sales_os.media_render_queue (
        se_email, slot_id, slide_index, media_type, aspect_ratio, prompt, priority, status, render_meta
      ) VALUES (
        ${params.seEmail},
        ${params.slotId},
        ${i + 1},
        ${isVideo ? 'video' : 'image'},
        ${isVideo ? '9:16' : '3:4'},
        ${slidePrompt},
        ${priority},
        'PENDING',
        ${isVideo ? null : sql.json(planned[i].meta as any)}
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
const SCHEDULED_PRIORITY = 10;
let lastDispatchedSlot = { seEmail: '', slotId: '' };
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

// ---------------------------------------------------------------------------
// Render gambar poster: 9router (merotasi beberapa akun OpenRouter) lalu key langsung.
// Teks digambar AI; hasilnya diverifikasi model vision dan diulang bila ada kata hilang/typo.
// ---------------------------------------------------------------------------
const ROUTER_ROOT = (process.env.AI_ROUTER_URL || process.env.OPENAI_BASE_URL || 'https://9router.giivepro.com/v1')
  .replace(/\/+$/, '')
  .replace(/\/v1$/, '');
const ROUTER_KEY = process.env.AI_ROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
const ROUTER_IMAGE_MODEL = (process.env.ROUTER_IMAGE_MODEL || 'openrouter/recraft/recraft-v4.1-flash-v2:free').trim();
const ROUTER_VISION_MODEL = process.env.AI_ROUTER_MODEL || process.env.OPENAI_MODEL || 'andararejomakmurjosjis';
const POSTER_TEXT_MAX_ATTEMPTS = 3;

async function imageBufferFromResponse(json: {
  data?: Array<{ b64_json?: string; url?: string }>;
}): Promise<Buffer | undefined> {
  const item = json.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) {
    const dl = await fetch(item.url, { signal: AbortSignal.timeout(30000) });
    if (dl.ok) return Buffer.from(await dl.arrayBuffer());
  }
  return undefined;
}

async function requestPosterImage(prompt: string): Promise<{ buffer?: Buffer; error?: string }> {
  let routerError = '';
  if (ROUTER_KEY) {
    try {
      const res = await fetch(`${ROUTER_ROOT}/v1/images/generations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ROUTER_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ROUTER_IMAGE_MODEL,
          prompt,
          aspect_ratio: '3:4',
          size: '3:4',
          response_format: 'b64_json',
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (res.ok) {
        const buffer = await imageBufferFromResponse((await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> });
        if (buffer) return { buffer };
        routerError = '9router tidak mengembalikan gambar';
      } else {
        routerError = `9router (${res.status}): ${(await res.text().catch(() => '')).slice(0, 200)}`;
      }
    } catch (err) {
      routerError = `9router: ${err instanceof Error ? err.message : String(err)}`;
    }
    console.warn('[poster-render]', routerError);
  }
  if (!OPENROUTER_FREE_IMAGE_KEY) return { error: routerError || 'Tidak ada kunci generator gambar' };
  const freeModel = OPENROUTER_FREE_IMAGE_MODEL.endsWith(':free')
    ? OPENROUTER_FREE_IMAGE_MODEL
    : 'recraft/recraft-v4.1-flash-v2:free';
  try {
    const res = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_FREE_IMAGE_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://developerproperti.giivepro.com',
        'X-Title': 'Developer Sales OS',
      },
      body: JSON.stringify({ model: freeModel, prompt, aspect_ratio: '3:4', response_format: 'b64_json' }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) {
      return { error: `OpenRouter (${res.status}): ${(await res.text().catch(() => '')).slice(0, 250)} | ${routerError}` };
    }
    const buffer = await imageBufferFromResponse((await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> });
    return buffer ? { buffer } : { error: 'OpenRouter tidak mengembalikan gambar' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menghubungi OpenRouter' };
  }
}

const tokenize = (t: string): string[] =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

/**
 * OCR via model vision lalu banding kata-per-kata di kode (deterministik):
 * kata yang diharapkan tapi tidak terbaca = hilang/typo; kata terbaca yang tidak diharapkan = teks liar/typo.
 */
async function verifyPosterText(buffer: Buffer, expected: string[]): Promise<{ ok: boolean; problems: string[] }> {
  if (!ROUTER_KEY || expected.length === 0) return { ok: true, problems: [] };
  const head = buffer.subarray(0, 4).toString('latin1');
  const mime = head === 'RIFF' ? 'image/webp' : buffer[0] === 0x89 ? 'image/png' : 'image/jpeg';
  const instruction =
    'Transkripsikan SEMUA teks yang terlihat pada poster ini persis apa adanya, huruf demi huruf (jangan memperbaiki ejaan, jangan menambah, jangan melewatkan kata). ' +
    'Selain itu, lihat bentuk atap rumah: jawab "shed" jika setiap atap miring SATU arah (seperti gigi gergaji), atau "gable" jika ada atap segitiga/pelana simetris atau atap limas. ' +
    'Nilai juga apakah teks poster terbaca jelas terhadap latarnya: "good" atau "poor" (kontras lemah/tertutup objek). ' +
    'Balas HANYA JSON valid tanpa markdown: {"full_text":"baris 1\\nbaris 2","roof":"shed","contrast":"good"}';
  try {
    const res = await fetch(`${ROUTER_ROOT}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ROUTER_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ROUTER_VISION_MODEL,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: instruction },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${buffer.toString('base64')}` } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) return { ok: true, problems: [] };
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const match = (json.choices?.[0]?.message?.content || '').match(/\{[\s\S]*\}/);
    if (!match) return { ok: true, problems: [] };
    const parsedJson = JSON.parse(match[0]) as { full_text?: string; roof?: string; contrast?: string };
    const fullText = String(parsedJson.full_text || '');
    const roofBad = String(parsedJson.roof || '').toLowerCase().includes('gable');
    const expectedTokens = new Set(expected.flatMap(tokenize));
    const seenTokens = new Set(tokenize(fullText));
    const missing = [...expectedTokens].filter((t) => !seenTokens.has(t));
    const extra = [...seenTokens].filter((t) => t.length >= 3 && !expectedTokens.has(t));
    const problems: string[] = [];
    if (roofBad) problems.push('atap pelana segitiga (harus atap miring satu arah)');
    if (String(parsedJson.contrast || '').toLowerCase().includes('poor')) problems.push('kontras teks lemah, teks sulit dibaca');
    if (!fullText.trim()) return { ok: problems.length === 0, problems };
    if (missing.length) problems.push(`kata hilang/salah eja: ${missing.join(', ')}`);
    if (extra.length) problems.push(`kata tambahan/salah eja: ${extra.join(', ')}`);
    return { ok: problems.length === 0, problems };
  } catch {
    return { ok: true, problems: [] };
  }
}

/** Render satu item antrean LOCAL_PENDING: generate, verifikasi teks, retry, tempel logo/denah, simpan. */
async function renderLocalQueueItem(nextItem: Record<string, any>): Promise<void> {
  const seEmail = String(nextItem.se_email);
  const slotId = String(nextItem.slot_id);
  const slideIdx = Number(nextItem.slide_index || 1);
  const seScope = seEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safeSlot = slotId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const localFileName = `${seScope}_${safeSlot}_slide_${slideIdx}.png`;
  const localFilePath = path.join(MEDIA_OUTPUT_DIR, localFileName);
  const basePrompt = String(nextItem.prompt);
  console.log(`[poster-render] ${slotId} slide #${slideIdx} via ${ROUTER_KEY ? '9router' : 'OpenRouter'}...`);
  try {
    const ctx = await loadSlideContext(seEmail, slotId, slideIdx);
    let best: { buffer: Buffer; problems: string[] } | null = null;
    let lastError = '';
    let prompt = basePrompt;
    for (let attempt = 1; attempt <= POSTER_TEXT_MAX_ATTEMPTS; attempt++) {
      const result = await requestPosterImage(prompt);
      if (!result.buffer) {
        lastError = result.error || 'Gagal generate gambar';
        break;
      }
      const check = await verifyPosterText(result.buffer, ctx.expectedTexts);
      if (!best || check.problems.length < best.problems.length) best = { buffer: result.buffer, problems: check.problems };
      if (check.ok) break;
      console.warn(`[poster-render] slide #${slideIdx} percobaan ${attempt}/${POSTER_TEXT_MAX_ATTEMPTS} teks bermasalah: ${check.problems.join(' | ')}`);
      prompt = `${basePrompt}\nCORRECTION: the previous render had errors (${check.problems.join('; ').slice(0, 300)}). Render EVERY quoted word exactly, never skip, merge or misspell a word, add no other text, and make EVERY roof a one-direction shed roof (low left, high right), never a triangular gable, and keep the text high-contrast and easy to read on its background.`;
    }
    if (!best) {
      await sql`
        UPDATE sales_os.media_render_queue
        SET status = 'FAILED', error = ${lastError.slice(0, 400)}, finished_at = NOW()
        WHERE id = ${nextItem.id}
      `;
    } else {
      await fs.writeFile(localFilePath, best.buffer);
      await composeSlideFromQueue(ctx, slideIdx, localFilePath);
      const note = best.problems.length ? `Teks perlu dicek: ${best.problems.join(' | ').slice(0, 300)}` : null;
      await sql`
        UPDATE sales_os.media_render_queue
        SET status = 'DONE', local_url = ${`/api/se/media/${localFileName}`}, error = ${note}, finished_at = NOW()
        WHERE id = ${nextItem.id}
      `;
      console.log(`[poster-render] Saved ${localFileName}${note ? ` (${note})` : ''}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal render poster';
    await sql`
      UPDATE sales_os.media_render_queue
      SET status = 'FAILED', error = ${msg.slice(0, 400)}, finished_at = NOW()
      WHERE id = ${nextItem.id}
    `;
  }
  await syncSlotFromQueue(seEmail, slotId);
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
    if (OPENROUTER_FREE_IMAGE_KEY) {
      const localOtherRows = await sql`
        SELECT DISTINCT q.slot_id,
               COALESCE(s.title, q.slot_id) AS title,
               COALESCE(s.scheduled_time, '') AS scheduled_time
        FROM sales_os.media_render_queue q
        LEFT JOIN sales_os.se_content_slots s
          ON s.se_email = q.se_email AND s.slot_id = q.slot_id
        WHERE q.se_email = ${seEmail}
          AND q.slot_id <> ${slotId}
          AND q.status = 'LOCAL_PENDING'
        LIMIT 1
      `;
      const localAheadRows = await sql`
        SELECT COUNT(*)::int AS cnt
        FROM sales_os.media_render_queue
        WHERE status = 'LOCAL_PENDING'
          AND NOT (se_email = ${seEmail} AND slot_id = ${slotId})
      `;
      return {
        activeOtherSlotForUser: localOtherRows[0]
          ? {
              slotId: String(localOtherRows[0].slot_id),
              title: String(localOtherRows[0].title || localOtherRows[0].slot_id),
              scheduledTime: String(localOtherRows[0].scheduled_time || ''),
            }
          : null,
        itemsAhead: Number(localAheadRows[0]?.cnt || 0),
        estimatedWaitMinutes: 0,
        cooldownSecondsLeft: 0,
      };
    }

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
    SELECT slide_index, media_type, status, hermes_job_id, local_url, error, render_meta->>'layout' AS layout
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

  const anyActive = latestRows.some(
    (r) => r.status === 'PENDING' || r.status === 'PROCESSING' || r.status === 'LOCAL_PENDING'
  );

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

  // Carousel tanpa poster marketing di akhir belum dianggap siap.
  const posterMissing = latestRows.some((r) => r.layout === 'banner' && r.status === 'FAILED');
  const nextStatus = anyActive
    ? 'GENERATING'
    : readyUrls.length > 0 && !posterMissing
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

/** Ulang satu kali (tetap di posisi antreannya), setelah itu FAILED untuk ditinjau. */
async function retryOrFail(item: Record<string, any>, reason: string): Promise<void> {
  const meta = (item.render_meta || {}) as Partial<RenderMeta>;
  const attempt = Number(meta.attempt || 0);
  // Poster marketing wajib ada, jadi diberi satu kesempatan lebih.
  const retry = attempt < (meta.layout === 'banner' ? 2 : 1);
  await sql`
    UPDATE sales_os.media_render_queue
    SET status = ${retry ? 'PENDING' : 'FAILED'},
        hermes_job_id = NULL,
        error = ${reason.slice(0, 400)},
        render_meta = COALESCE(render_meta, '{}'::jsonb) || ${sql.json({ attempt: attempt + 1 })},
        finished_at = ${retry ? null : sql`NOW()`}
    WHERE id = ${item.id}
  `;
  nextDispatchAllowedAtMs = Date.now() + 15_000 + Math.floor(Math.random() * 6000);
  await syncSlotFromQueue(String(item.se_email), String(item.slot_id));
}

/**
 * STRICT 1-AT-A-TIME GLOBAL SEQUENTIAL DISPATCHER + COOLDOWN (12-18s)
 * Ensures only 1 job is ever active in Hermes VNC across all SEs & slots.
 */
export async function pollActiveHermesJobs(): Promise<void> {
  if (HERMES_MEDIA_PAUSED) return;
  if (isQueueTickBusy) return;
  isQueueTickBusy = true;
  try {
    await fs.mkdir(MEDIA_OUTPUT_DIR, { recursive: true });

    if (OPENROUTER_FREE_IMAGE_KEY) {
      const localPending = await sql`
        SELECT * FROM sales_os.media_render_queue
        WHERE status = 'LOCAL_PENDING'
        ORDER BY priority ASC, created_at ASC, id ASC
        LIMIT 1
      `;
      if (localPending.length > 0) {
        await renderLocalQueueItem(localPending[0]);
        return;
      }
      // Dalam mode lokal, jangan ikut menyentuh antrean Hermes/Google Flow live di hades
      return;
    }

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
        // Job hilang dari Hermes (mis. service restart) atau macet terlalu lama: lepas agar antrean tidak menggantung.
        const ageMs = Date.now() - new Date(item.started_at || Date.now()).getTime();
        const limitMs = item.media_type === 'video' ? 12 * 60_000 : 6 * 60_000;
        if (statusRes.status === 404 || ageMs > limitMs) {
          await retryOrFail(item, statusRes.status === 404 ? 'Job hilang dari Hermes' : 'Job macet melewati batas waktu');
          return;
        }
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
          const meta = isVideo ? null : ((item.render_meta || null) as RenderMeta | null);
          const ext = meta ? '.png' : path.extname(remoteFile) || (isVideo ? '.mp4' : '.jpg');
          const localFileName = `${seScope}_${safeSlot}_slide_${item.slide_index}${ext}`;
          const localFilePath = path.join(MEDIA_OUTPUT_DIR, localFileName);

          let localUrl = mediaSourceUrl;
          let note = '';
          const dlRes = await fetch(mediaSourceUrl, {
            headers: { 'X-API-Key': HERMES_API_KEY },
            signal: AbortSignal.timeout(25000),
          });
          if (dlRes.ok) {
            const buf = Buffer.from(await dlRes.arrayBuffer());
            await fs.writeFile(localFilePath, buf);
            if (meta) {
              const check = await inspectPoster(buf, meta.expected);
              const textIssue = check.problems.filter((x) => x.startsWith('kata')).join(' | ');
              note = check.problems.join(' | ').slice(0, 300);
              const composeIssue = await finishPoster(localFilePath, meta);
              const issue = [textIssue, composeIssue].filter(Boolean).join(' | ');
              if (composeIssue || (textIssue && meta.attempt === 0)) {
                console.warn(`[poster-render] ${slotId} slide #${item.slide_index}: ${issue}`);
                await retryOrFail(item, `Perlu ditinjau: ${issue}`);
                return;
              }
            }
            localUrl = `/api/se/media/${localFileName}`;
          } else if (meta) {
            await retryOrFail(item, `Unduhan gagal (${dlRes.status})`);
            return;
          }

          await sql`
            UPDATE sales_os.media_render_queue
            SET status = 'DONE', local_url = ${localUrl}, error = ${note || null}, finished_at = NOW()
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
          if (/RATE_LIMITED|tidak biasa|unusual/i.test(errMsg)) {
            // Peringatan dari Google: hentikan slot ini dan istirahatkan akun, jangan diulang.
            await sql`
              UPDATE sales_os.media_render_queue
              SET status = 'FAILED', error = ${errMsg}, finished_at = NOW()
              WHERE id = ${item.id}
            `;
            await sql`
              UPDATE sales_os.media_render_queue
              SET status = 'CANCELLED', error = ${errMsg}, finished_at = NOW()
              WHERE se_email = ${seEmail} AND slot_id = ${slotId} AND status = 'PENDING'
            `;
            await syncSlotFromQueue(seEmail, slotId);
            lastSlotFinishedAtMs = Date.now();
            nextDispatchAllowedAtMs = Date.now() + 10 * 60_000;
            return;
          }
          await retryOrFail(item, errMsg);
          return;
        }
      } catch {
        /* retry next tick */
      }
      return;
    }

    if (Date.now() < nextDispatchAllowedAtMs) return;

    // Satu slot tuntas dulu (tidak disela), lalu prioritas terjadwal, lalu urutan masuk.
    const nextRows = await sql`
      SELECT * FROM sales_os.media_render_queue
      WHERE status = 'PENDING'
      ORDER BY (se_email = ${lastDispatchedSlot.seEmail} AND slot_id = ${lastDispatchedSlot.slotId}) DESC,
               priority ASC, created_at ASC, id ASC
      LIMIT 1
    `;
    if (nextRows.length === 0) return;

    const nextItem = nextRows[0];
    const nextMeta = nextItem.media_type === 'video' ? null : ((nextItem.render_meta || null) as RenderMeta | null);
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
          lane: Number(nextItem.priority) === SCHEDULED_PRIORITY ? 'scheduled' : 'manual',
          ...(nextMeta ? { model: nextMeta.model, reference: nextMeta.reference } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      });

      if ([409, 423, 429].includes(enqueueRes.status)) {
        // Hermes terkunci/sibuk: tetap antre, jangan dianggap gagal.
        nextDispatchAllowedAtMs = Date.now() + 20_000;
        return;
      }
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
      lastDispatchedSlot = { seEmail: String(nextItem.se_email), slotId: String(nextItem.slot_id) };
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
  if (HERMES_MEDIA_PAUSED) {
    console.log('[content-scheduler] Dijeda sementara (HERMES_MEDIA_PAUSED=true).');
    return;
  }
  if (schedulerStarted) return;
  schedulerStarted = true;

  setInterval(() => {
    void pollActiveHermesJobs();
  }, 4000);

  let tickRunning = false;
  const runDailyScheduleTick = async () => {
    if (tickRunning) return;
    tickRunning = true;
    try {
      const { dateStr, minutesOfDay, dayOfMonth, daysInMonth } = getWibClock();

      const seEmails = SE_EMAILS;

      const daysToEnsure = Array.from(
        new Set([dayOfMonth, Math.min(daysInMonth, dayOfMonth + 1)])
      );

      for (const seEmail of seEmails) {
        for (const targetDay of daysToEnsure) {
          const targetDateStr = formatWibDateForDay(targetDay);
          const existingRows = await sql`
            SELECT slot_id, report_date FROM sales_os.se_content_slots
            WHERE se_email = ${seEmail} AND day_number = ${targetDay}
          `;
          if (existingRows.length < 3) {
            const seName = seEmail.split('@')[0];
            const aiSlots = await generateUniqueDaySlotsWithAi(seEmail, seName, targetDay);
            for (const s of aiSlots) {
              const slotId = `slot-d${targetDay}-s${s.slotOrder}-sales_in_house`;
              await sql`
                INSERT INTO sales_os.se_content_slots (
                  se_email, slot_id, status, posted_url, day_number, slot_order,
                  scheduled_time, funnel_stage, platform, format, title, brief,
                  visual_prompt, caption, hashtags, cta, duration_seconds,
                  persona_code, slide_deck, media_status, report_date, updated_at
                ) VALUES (
                  ${seEmail}, ${slotId}, 'SIAP', '', ${targetDay}, ${s.slotOrder},
                  ${s.scheduledTime}, ${s.funnelStage}, ${s.platform}, ${s.format}, ${s.title}, ${s.brief},
                  ${s.visualPrompt}, ${s.caption}, ${sql.json(s.hashtags)}, ${s.cta}, ${s.durationSeconds},
                  ${s.personaCode || 'P1'}, ${sql.json(s.slideDeck || [])}, 'SCHEDULED', ${targetDateStr}::date, NOW()
                )
                ON CONFLICT (se_email, slot_id) DO UPDATE SET
                  report_date = ${targetDateStr}::date
              `;
            }
          } else {
            await sql`
              UPDATE sales_os.se_content_slots
              SET report_date = ${targetDateStr}::date
              WHERE se_email = ${seEmail}
                AND day_number = ${targetDay}
                AND (report_date IS NULL OR report_date <> ${targetDateStr}::date)
            `.catch(() => {});
          }
        }
      }

      const dueRows = await sql`
        SELECT se_email, slot_id, slot_order, funnel_stage, format, title, brief, visual_prompt, duration_seconds, slide_deck
        FROM sales_os.se_content_slots
        WHERE day_number = ${dayOfMonth}
          AND media_status = 'SCHEDULED'
          AND LOWER(se_email) IN ${sql(SE_EMAILS)}
        ORDER BY slot_order ASC, se_email ASC
      `;
      const rotated = dueRows.map((row, i) => ({ row, k: (i + dayOfMonth) % Math.max(1, dueRows.length) })).sort((a, b) => a.k - b.k).map((x) => x.row);
      for (const row of rotated) {
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
          priority: SCHEDULED_PRIORITY,
        });
        await sql`
          UPDATE sales_os.se_content_slots
          SET media_status = ${enq.ok ? 'GENERATING' : 'FAILED'},
              target_media_count = ${enq.targetCount},
              hermes_job_ids = ${sql.json(enq.jobs)},
              media_error = ${enq.error || null},
              report_date = ${dateStr}::date,
              updated_at = NOW()
          WHERE se_email = ${row.se_email} AND slot_id = ${row.slot_id}
        `;
      }
    } catch (err) {
      console.warn('[content-scheduler]', err instanceof Error ? err.message : String(err));
    } finally {
      tickRunning = false;
    }
  };

  setTimeout(() => {
    void runDailyScheduleTick();
  }, 3000);
  setInterval(() => {
    void runDailyScheduleTick();
  }, 60_000);
}
