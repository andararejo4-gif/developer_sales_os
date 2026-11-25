// =====================================================================
// POSTER ENGINE (banner) - DEVELOPER SALES OS
// LLM = art director: hanya MEMILIH dari daftar & menulis teks pendek.
// Arsitektur, POV, palet, harga, dan isi card dikunci kode (bukan LLM).
// =====================================================================

import { BUILDING_BIBLE, MASTER_HEAD, MASTER_TAIL, SINGLE_ROW_RULE, isHarshHook } from './visual-bible';

export { BUILDING_BIBLE, MASTER_HEAD, MASTER_TAIL };

export type Cluster = 'Nagoya' | 'Osaka' | 'Tokyo' | 'ALL';

/** Konsep slot dari kalender; menjadi satu-satunya masukan art director. */
export interface PosterConcept {
  stage: 'TOFU' | 'MOFU' | 'BOFU';
  cluster: Cluster;
  pillarLabel: string;
  pillarFocus: string;
  audience: string;
  motivation: string;
}

export interface PosterBrief {
  theme: string;
  hook1: string;
  hook2: string;
  /** ID dari RIBBONS */
  ribbon: string;
  panel: string;
  icon: string;
  material: string;
  ornament: string;
  layout: string;
  factIds: string[];
  bar: string;
  /** ID dari FOOTERS */
  footer: string;
  reason?: string;
}

export type CardSignature = Pick<PosterBrief, 'theme' | 'panel' | 'icon' | 'material' | 'ornament' | 'layout'> & { hook: string };

interface Theme {
  label: string;
  scene: string;
  ink: string;
  /** Kata waktu yang hanya boleh dipakai hook pada tema ini. */
  words: string[];
}

const GOLD_ON_DARK =
  'line 1 pure ivory white, line 2 bright polished champagne-gold gradient (#FFF0C2 to #D8A94E) with a fine bevel, both with a soft dark shadow';
/** Hanya tema & bahan yang hasilnya sudah dilihat dan disetujui; tema lain ditambah setelah diuji. */
export const THEMES: Record<string, Theme> = {
  SENJA_MEGAH: {
    label: 'Senja megah, awan dramatis',
    scene:
      'SKY: epic sunset with huge layered cumulus clouds, deep teal-blue at the top, rose and copper in the middle, blazing molten gold at the horizon; visible golden sun rays fan out between the clouds, every cloud edge rim-lit gold.',
    ink: GOLD_ON_DARK,
    words: ['senja', 'sore'],
  },
  BLUE_HOUR: {
    label: 'Blue hour elegan, jendela menyala',
    scene:
      'SKY: luxurious blue hour, deep sapphire-teal sky with sculpted clouds and a glowing amber-rose band on the horizon, a few first stars; every house radiates like a lantern.',
    ink: GOLD_ON_DARK,
    words: ['malam', 'petang'],
  },
  MALAM_HANGAT: {
    label: 'Malam hangat berbintang',
    scene:
      'SKY: majestic clear night, deep midnight-teal with soft moonlit clouds and fine stars, warm horizon glow; the houses are brilliantly and evenly lit in gold, never dark or gloomy.',
    ink: GOLD_ON_DARK,
    words: ['malam', 'bintang'],
  },
};
const TIME_WORDS = [...new Set([...Object.values(THEMES).flatMap((t) => t.words), 'pagi', 'mentari', 'fajar', 'sarapan', 'hujan'])];

export const PANELS: Record<string, string> = {
  ARCH_CREST: 'classical arch top edge with rounded shoulders and a gentle raised crest',
  SCALLOPED: 'elegant scalloped ticket corners and a straight top edge',
  OGEE: 'a flowing double-curved ogee top edge like a palace doorway',
  STEPPED_DECO: 'stepped art-deco shoulders rising to a flat centre',
  SOFT_WAVE: 'one graceful asymmetric wave as the top edge',
  SHIELD: 'bevelled octagonal corners with a small pointed centre like a heraldic plate',
  CATHEDRAL: 'three joined soft arches, the middle one tallest',
  SLANTED: 'a clean top edge slanting gently up to the right, echoing the roofs, with rounded corners',
};
export const ICONS: Record<string, string> = {
  GOLD_RING: 'a round polished-gold ring medallion with dark-emerald centre and embossed gold line icon',
  SOLID_COIN: 'a solid brushed-gold coin with an engraved dark-emerald icon',
  HEXAGON: 'a bevelled gold hexagon frame with a gold line icon',
  ARCH_NICHE: 'a small gold arched niche with a glowing gold icon inside',
  LAUREL: 'a gold line icon encircled by a fine gold laurel wreath',
};
export const MATERIALS: Record<string, string> = {
  EMERALD_GLASS: 'polished emerald glass, gradient #0F6B52 to near-black #04271D, ivory text',
  EMERALD_MARBLE: 'dark emerald marble with fine gold veins, ivory text',
  EMERALD_VELVET: 'rich emerald velvet-satin with embossed botanical pattern, ivory text',
};
export const ORNAMENTS: Record<string, string> = {
  MONSTERA: 'glossy fresh-green monstera and banana leaves with dew',
  FERN_PALM: 'airy sunlit palm fronds and ferns with dew',
  FRANGIPANI: 'fresh green leaves with a few white-yellow frangipani flowers',
  OLIVE_BAMBOO: 'delicate fresh olive sprigs and bamboo leaves',
};
export const LAYOUTS: Record<string, { count: number; text: string }> = {
  FOUR_COLUMNS: { count: 4, text: 'four equal columns in one row separated by thin fading vertical gold lines, icon above title above sub-line' },
  THREE_COLUMNS: { count: 3, text: 'three wide equal columns in one row separated by thin fading vertical gold lines, larger icons above title above sub-line' },
  TWO_BY_TWO: { count: 4, text: 'a neat two-by-two grid, each cell with the icon on the left and title plus sub-line on the right, thin gold cross divider' },
  CENTER_HERO: { count: 3, text: 'one larger hero feature in the centre on a raised gold-framed tile, one feature on each side' },
};

/** Bank fakta: hanya klaim dari Playbook v1.2 / CLUSTER_FACTS. LLM memilih ID, tidak menulis klaim. */
export const FACTS: Record<string, { scope: Cluster; icon: string; title: string; sub: string }> = {
  JAPANDI: { scope: 'ALL', icon: 'modern house', title: 'Desain Japandi', sub: 'Modern 2 Lantai' },
  GARASI: { scope: 'ALL', icon: 'car in a garage', title: 'Garasi Dalam', sub: 'Plus Carport' },
  KAMAR: { scope: 'ALL', icon: 'bed', title: '3 atau 4 Kamar', sub: 'Gold & Diamond' },
  KELUARGA: { scope: 'ALL', icon: 'sofa', title: 'Ruang Keluarga', sub: 'di Lantai Dua' },
  TAMAN: { scope: 'ALL', icon: 'leafy tree', title: 'Taman Belakang', sub: 'di Setiap Tipe' },
  ONEGATE: { scope: 'ALL', icon: 'gate barrier', title: 'One-Gate RFID', sub: 'Akses Terjaga' },
  SATPAM: { scope: 'ALL', icon: 'shield with check mark', title: 'Keamanan 24 Jam', sub: 'Satpam Berjaga' },
  CCTV: { scope: 'ALL', icon: 'security camera', title: 'CCTV 4K', sub: 'Rekaman 30 Hari' },
  DOORLOCK: { scope: 'ALL', icon: 'smart door lock', title: 'Smart Door Lock', sub: 'PIN & Sidik Jari' },
  CONCIERGE: { scope: 'ALL', icon: 'service bell', title: 'Concierge 24/7', sub: 'Siap Membantu' },
  EV: { scope: 'ALL', icon: 'plug with leaf', title: 'EV Ready', sub: 'Siap Mobil Listrik' },
  CLUBHOUSE: { scope: 'Nagoya', icon: 'pool ladder and waves', title: 'Clubhouse', sub: 'Kolam & Gym' },
  LOK_NAGOYA: { scope: 'Nagoya', icon: 'map pin', title: 'Cluster Nagoya', sub: 'Jl. Tentara Pelajar' },
  LOK_OSAKA: { scope: 'Osaka', icon: 'map pin', title: 'Cluster Osaka', sub: 'Koridor Sudirman' },
  LOK_TOKYO: { scope: 'Tokyo', icon: 'map pin', title: 'Cluster Tokyo', sub: 'Koridor Sudirman' },
};

/** Pita & footer: teks resmi, LLM hanya memilih ID. */
export const RIBBONS: Record<string, { scope: Cluster; text: string }> = {
  JAPANDI_SKH: { scope: 'ALL', text: 'Hunian Japandi di Sukoharjo' },
  DUA_LANTAI: { scope: 'ALL', text: 'Townhouse Japandi Dua Lantai' },
  GARASI: { scope: 'ALL', text: 'Japandi dengan Garasi Dalam' },
  KEAMANAN: { scope: 'ALL', text: 'Satu Gerbang, Satu Rasa Aman' },
  KELUARGA: { scope: 'ALL', text: 'Ruang Nyaman untuk Keluarga' },
  SMART: { scope: 'ALL', text: 'Smart Living untuk Keluarga' },
  NAGOYA: { scope: 'Nagoya', text: 'Cluster Nagoya di Sukoharjo' },
  CLUBHOUSE: { scope: 'Nagoya', text: 'Cluster dengan Clubhouse' },
  OSAKA: { scope: 'Osaka', text: 'Cluster Osaka di Sukoharjo' },
  TOKYO: { scope: 'Tokyo', text: 'Cluster Tokyo di Sukoharjo' },
};
export const FOOTERS: Record<string, string> = {
  KENALI: 'KENALI HUNIANNYA LEBIH DEKAT',
  RASAKAN: 'RASAKAN SUASANANYA LANGSUNG',
  SINGGAH: 'MARI SINGGAH DAN MELIHATNYA',
  JELAJAH: 'JELAJAHI SETIAP RUANGNYA',
  BERBINCANG: 'MARI BERBINCANG TENTANG RUMAH',
  TEMUKAN: 'TEMUKAN RUANG UNTUK PULANG',
};

const PRICE_FROM: Record<Cluster, string> = {
  ALL: 'Rp650 Jutaan',
  Nagoya: 'Rp650 Jutaan',
  Osaka: 'Rp840 Jutaan',
  Tokyo: 'Rp775 Jutaan',
};

/** Isi bar emas; teks dari kode, bukan LLM. */
export function barText(bar: string, cluster: Cluster): { small: string; big: string } | null {
  if (bar === 'PRICE') return { small: 'Harga mulai', big: PRICE_FROM[cluster] };
  if (bar === 'TYPES') return { small: 'Pilihan tipe', big: '75 · 95 · 110' };
  if (bar === 'PLACE') return { small: cluster === 'ALL' ? 'Hunian di' : 'Cluster', big: cluster === 'ALL' ? 'Sukoharjo' : cluster };
  return null;
}

const HOOK_LINE_MAX = 21;
/** Hook harus terbaca sebagai kalimat, bukan dua potongan frasa. */
const CONNECTORS = /\b(yang|di|ke|untuk|tempat|saat|lalu|bersama|dari|selalu|dan|ada|setelah|sebelum|menuju)\b/i;
const CLICHE = /\b(memeluk|berbisik|bernyanyi|bernapas|merembes|jiwa|napas|nadi|berlabuh|pelukan)\b/i;
export const BARS = ['PRICE', 'TYPES', 'PLACE'];
/** Asosiasi pengulangan: elemen card tidak boleh sama dengan N poster terakhir. */
const RECENT_WINDOW = 3;
export const HERMES_MAX_PROMPT = 8000;

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean);
const clean = (t: unknown) => String(t ?? '').replace(/["“”]/g, '').replace(/\s+/g, ' ').trim();

export function normalizeBrief(raw: Record<string, unknown>): PosterBrief {
  return {
    theme: clean(raw.theme).toUpperCase(),
    hook1: clean(raw.hook1),
    hook2: clean(raw.hook2),
    ribbon: clean(raw.ribbon).toUpperCase(),
    panel: clean(raw.panel).toUpperCase(),
    icon: clean(raw.icon).toUpperCase(),
    material: clean(raw.material).toUpperCase(),
    ornament: clean(raw.ornament).toUpperCase(),
    layout: clean(raw.layout).toUpperCase(),
    factIds: Array.isArray(raw.factIds) ? raw.factIds.map((f) => clean(f).toUpperCase()) : [],
    bar: clean(raw.bar).toUpperCase(),
    footer: clean(raw.footer).toUpperCase(),
    reason: clean(raw.reason),
  };
}

/** Pemeriksa isi: mengembalikan daftar masalah (kosong = lolos). */
export function checkBrief(b: PosterBrief, concept: PosterConcept, recent: CardSignature[]): string[] {
  const issues: string[] = [];
  const inList = (name: string, value: string, list: object) => {
    if (!(value in list)) issues.push(`${name} "${value}" tidak ada di daftar`);
  };
  inList('theme', b.theme, THEMES);
  inList('panel', b.panel, PANELS);
  inList('icon', b.icon, ICONS);
  inList('material', b.material, MATERIALS);
  inList('ornament', b.ornament, ORNAMENTS);
  inList('layout', b.layout, LAYOUTS);
  inList('ribbon', b.ribbon, RIBBONS);
  inList('footer', b.footer, FOOTERS);
  const ribbon = RIBBONS[b.ribbon];
  if (ribbon && ribbon.scope !== 'ALL' && ribbon.scope !== concept.cluster) issues.push(`pita ${b.ribbon} hanya untuk cluster ${ribbon.scope}`);
  if (!BARS.includes(b.bar)) issues.push(`bar "${b.bar}" tidak ada di daftar`);
  if (concept.stage === 'TOFU' && b.bar === 'PRICE') issues.push('TOFU tidak boleh menampilkan harga, pilih bar TYPES atau PLACE');
  if (concept.stage === 'BOFU' && b.bar !== 'PRICE') issues.push('BOFU wajib bar PRICE');

  const len = (name: string, t: string, maxChars: number, maxWords: number) => {
    if (!t) issues.push(`${name} kosong`);
    else if (t.length > maxChars || words(t).length > maxWords) issues.push(`${name} terlalu panjang (maks ${maxChars} huruf, ${maxWords} kata): "${t}"`);
  };
  len('hook1', b.hook1, HOOK_LINE_MAX, 3);
  len('hook2', b.hook2, HOOK_LINE_MAX, 3);
  const all = `${b.hook1} ${b.hook2}`;
  if (!CONNECTORS.test(all)) issues.push('hook harus menjadi kalimat utuh dengan kata penghubung (di, ke, yang, untuk, tempat, saat, lalu, ...)');
  if (CLICHE.test(all)) issues.push('hook memakai personifikasi/puisi klise; pakai momen nyata sehari-hari');
  if (isHarshHook(all)) issues.push('teks menekan/menyindir; pakai nada netral yang mengundang');
  if (/\d|rp|persen|%|gratis|diskon|promo|termurah|terbaik|nomor satu|no\.? ?1|pasti|dijamin|investasi|aman|paling aman|anti maling/i.test(all))
    issues.push('hook tidak boleh memuat angka, harga, promo, atau klaim superlatif');
  if (/the park|andara/i.test(all)) issues.push('jangan menulis nama proyek/developer, logo sudah ada');
  if (words(`${b.hook1} ${b.hook2}`).some((w) => /^[A-Z]{4,}$/.test(w))) issues.push('hook jangan huruf kapital semua');
  const theme = THEMES[b.theme];
  if (theme) {
    const bad = TIME_WORDS.filter((w) => !theme.words.includes(w) && new RegExp(`\\b${w}\\b`, 'i').test(all));
    if (bad.length) issues.push(`kata "${bad.join(', ')}" tidak cocok dengan tema ${b.theme}`);
  }

  const layout = LAYOUTS[b.layout];
  if (layout && b.factIds.length !== layout.count) issues.push(`layout ${b.layout} butuh tepat ${layout.count} factIds`);
  if (new Set(b.factIds).size !== b.factIds.length) issues.push('factIds tidak boleh kembar');
  for (const id of b.factIds) {
    const f = FACTS[id];
    if (!f) issues.push(`fakta "${id}" tidak ada`);
    else if (f.scope !== 'ALL' && f.scope !== concept.cluster) issues.push(`fakta ${id} hanya untuk cluster ${f.scope}`);
  }
  const placeFact = b.factIds.some((id) => id.startsWith('LOK_'));
  if (placeFact && b.bar === 'PLACE') issues.push('lokasi sudah ada di bar, ganti fakta LOK_');

  const last = recent.slice(-RECENT_WINDOW);
  for (const key of ['panel', 'material', 'layout', 'icon', 'ornament'] as const) {
    const used = last.map((r) => r[key]);
    const limit = key === 'panel' ? used : used.slice(-2);
    if (limit.includes(b[key])) issues.push(`${key} ${b[key]} baru dipakai, pilih yang lain`);
  }
  if (last.slice(-2).some((r) => r.theme === b.theme)) issues.push(`tema ${b.theme} baru dipakai, pilih yang lain`);
  const hook = `${b.hook1} ${b.hook2}`.toLowerCase();
  if (recent.some((r) => r.hook === hook)) issues.push('hook sudah pernah dipakai');
  return issues;
}

export function signatureOf(b: PosterBrief): CardSignature {
  const { theme, panel, icon, material, ornament, layout } = b;
  return { theme, panel, icon, material, ornament, layout, hook: `${b.hook1} ${b.hook2}`.toLowerCase() };
}

const ROUTER_URL = (process.env.AI_ROUTER_URL || 'https://9router.giivepro.com/v1').replace(/\/+$/, '');
const ROUTER_KEY = process.env.AI_ROUTER_API_KEY || '';
const ROUTER_MODEL = process.env.AI_ROUTER_MODEL || 'andararejomakmurjosjis';
/** Combo utama kerap 504 untuk brief panjang; glm flash lebih stabil, combo jadi cadangan. */
const BRIEF_MODELS = [process.env.POSTER_BRIEF_MODEL || 'cbai/glm-5.3-flash', ROUTER_MODEL];
/** Penulis hook: kualitas bahasa Indonesia terbaik di 9router saat diuji 2026-11-24. */
const HOOK_MODELS = [process.env.POSTER_HOOK_MODEL || 'cbai/glm-5.2', ...BRIEF_MODELS];
const VISION_MODELS = [process.env.POSTER_VISION_MODEL || 'gemini/gemini-3.5-flash-lite', ROUTER_MODEL];

async function askModel(model: string, messages: unknown[], temperature: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${ROUTER_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ROUTER_KEY}` },
    body: JSON.stringify({ model, stream: false, temperature, tools: [], tool_choice: 'none', messages }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`${model} (${res.status})`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const match = (json.choices?.[0]?.message?.content || '').match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`${model} tidak membalas JSON`);
  return JSON.parse(match[0]) as Record<string, unknown>;
}

export const askWriter = (messages: unknown[], temperature: number) => askRouter(HOOK_MODELS, messages, temperature);

async function askRouter(models: string[], messages: unknown[], temperature: number): Promise<Record<string, unknown>> {
  const errors: string[] = [];
  for (const model of models) {
    try {
      return await askModel(model, messages, temperature);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  throw new Error(`LLM gagal: ${errors.join('; ')}`);
}

function directorPrompt(concept: PosterConcept, recent: CardSignature[]): string {
  const last = recent.slice(-RECENT_WINDOW);
  const free = (key: 'panel' | 'material' | 'layout' | 'icon' | 'ornament' | 'theme', list: object, window: number) =>
    Object.keys(list).filter((k) => !last.slice(-window).some((r) => r[key] === k)).join(' | ');
  const facts = Object.entries(FACTS)
    .filter(([, f]) => f.scope === 'ALL' || f.scope === concept.cluster)
    .map(([id, f]) => `${id}: ${f.title}, ${f.sub}`)
    .join('\n');
  return `Kamu art director banner properti premium The Park Townhouse Sukoharjo. Rancang tema dan card SATU banner sesuai konsep. Kamu HANYA memilih dari daftar (hook ditulis orang lain).

KONSEP
- Tahap: ${concept.stage} | Cluster: ${concept.cluster === 'ALL' ? 'semua cluster' : concept.cluster}
- Tema konten: ${concept.pillarLabel} (${concept.pillarFocus})
- Pembaca: ${concept.audience}
- Yang mereka inginkan: ${concept.motivation}

PILIHAN (tulis ID persis)
theme: ${free('theme', THEMES, 2)} (${Object.entries(THEMES).map(([k, t]) => `${k}=${t.label}, kata waktu: ${t.words.join('/')}`).join('; ')})
panel: ${free('panel', PANELS, 3)}
icon: ${free('icon', ICONS, 2)}
material: ${free('material', MATERIALS, 2)}
ornament: ${free('ornament', ORNAMENTS, 2)}
layout: ${free('layout', LAYOUTS, 2)} (jumlah fakta: ${Object.entries(LAYOUTS).map(([k, l]) => `${k}=${l.count}`).join(', ')})
bar: ${concept.stage === 'BOFU' ? 'PRICE' : concept.stage === 'TOFU' ? 'TYPES | PLACE' : BARS.join(' | ')}
ribbon (paling nyambung dengan tema konten): ${Object.entries(RIBBONS).filter(([, r]) => r.scope === 'ALL' || r.scope === concept.cluster).map(([k, r]) => `${k}=${r.text}`).join('; ')}
footer: ${Object.entries(FOOTERS).map(([k, f]) => `${k}=${f}`).join('; ')}
factIds (pilih yang paling mendukung tema konten, tidak kembar):
${facts}
Balas HANYA JSON: {"theme":"","panel":"","icon":"","material":"","ornament":"","layout":"","factIds":[""],"bar":"","ribbon":"","footer":"","reason":"alasan singkat"}`;
}

function hookPrompt(concept: PosterConcept, design: PosterBrief, recent: CardSignature[]): string {
  const theme = THEMES[design.theme];
  const banned = TIME_WORDS.filter((w) => !theme.words.includes(w));
  return `Buat 10 hook banner hunian premium untuk ${concept.audience}. Tema: ${concept.pillarLabel}. Suasana gambar: ${theme.label}.
Tiap hook 2 baris (maks 3 kata dan ${HOOK_LINE_MAX} huruf per baris) yang bila disambung jadi satu kalimat/frasa utuh, alami, hangat, elegan, netral, menyentuh momen hidup nyata sehari-hari (sarapan, anak berlari, obrolan sore, pulang kerja, istirahat) yang bersentuhan dengan tema. WAJIB memakai kata penghubung (di, ke, yang, untuk, tempat, saat, lalu, bersama, selalu) supaya terbaca sebagai satu kalimat. Bahasa sederhana dan jelas, bukan puisi; dilarang benda bertingkah seperti manusia. Tanpa tanda baca.
Contoh gaya (jangan ditiru kalimatnya): "Dapur Teduh / Tempat Cerita Tumbuh", "Tempat Pulang / yang Selalu Dirindu", "Ruang untuk Tawa / yang Tak Terburu".
Tanpa mendesak, tanpa menyindir, tanpa angka, tanpa klaim, tanpa istilah teknis/produk, tanpa kata: ${banned.join(', ')}, terbaik, pasti, investasi, status, aset.
${recent.length ? `Jangan mirip: ${recent.map((r) => r.hook).join(' | ')}.` : ''}
Balas HANYA JSON {"hooks":["baris1 / baris2"]}`;
}

const LOWER_WORDS = new Set(['di', 'ke', 'dari', 'yang', 'dan', 'untuk', 'pada', 'dengan', 'bagi']);
/** Gaya Kalimat Judul; kata sambung tetap kecil, juga di awal baris kedua. */
const titleCase = (t: string, secondLine: boolean) =>
  words(t)
      .map((w, i) => ((i > 0 || secondLine) && LOWER_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');

const HOOK_MIN_SCORE = 8;

/** Editor bahasa (LLM terpisah dari penulis): nilai tiap calon, kembalikan indeks terbaik atau alasan penolakan. */
async function pickHook(
  concept: PosterConcept,
  options: PosterBrief[]
): Promise<{ best?: PosterBrief; scores: Array<{ hook: string; score: number; note: string }> }> {
  const list = options.map((o, i) => `${i}. "${o.hook1} / ${o.hook2}" `).join('\n');
  const r = await askRouter(
    HOOK_MODELS,
    [
      {
        role: 'user',
        content: `Kamu editor bahasa Indonesia senior untuk iklan hunian premium, sangat kritis. Nilai tiap calon hook banner 1-10. Pembaca: ${concept.audience}. Tema: ${concept.pillarLabel}.
Nilai tinggi HANYA bila: (1) dua baris membentuk kalimat/frasa utuh yang alami, mudah dipahami sekali baca, dan benar tata bahasanya, (2) hangat, elegan, membuat pembaca tersentuh dan ingin tahu, (3) nyambung dengan tema, (4) tidak menekan, tidak klise, tidak memuji produk. Janggal, tidak utuh, kata kerja tanpa imbuhan yang benar (mis. "Senja Sambut ke Rumah"), atau membingungkan = ok false. Gabungkan dua baris jadi satu kalimat lalu tanyakan: apakah orang Indonesia berpendidikan akan mengucapkannya?
${list}
Balas HANYA JSON: {"scores":[{"i":0,"ok":true,"score":0,"note":"alasan 6 kata"}]}`,
      },
    ],
    0.2
  );
  const scores = (Array.isArray(r.scores) ? r.scores : [])
    .map((x: any) => ({ i: Number(x?.i), score: x?.ok === true ? Number(x?.score) : Math.min(5, Number(x?.score)), note: clean(x?.note) }))
    .filter((x) => options[x.i] && Number.isFinite(x.score))
    .sort((a, b) => b.score - a.score);
  return {
    best: scores[0] && scores[0].score >= HOOK_MIN_SCORE ? options[scores[0].i] : undefined,
    scores: scores.map((x) => ({ hook: `${options[x.i].hook1} / ${options[x.i].hook2}`, score: x.score, note: x.note })),
  };
}

export interface BriefAttempt {
  step: 'design' | 'hook';
  issues: string[];
  scores: Array<{ hook: string; score: number; note: string }>;
}

/** Hook contoh yang sah, dipakai saat memeriksa rancangan sebelum hook ditulis. */
const PLACEHOLDER_HOOK = { hook1: 'Pulang', hook2: 'Lalu Tenang' };

/** Rancang (tema + card), lalu tulis hook sesuai tema, lalu dinilai editor. Gagal = error (poster ditahan). */
export async function requestBrief(
  concept: PosterConcept,
  recent: CardSignature[]
): Promise<{ brief: PosterBrief; attempts: BriefAttempt[] }> {
  const attempts: BriefAttempt[] = [];
  const fail = () => new Error(`Brief ditolak 3 kali: ${attempts[attempts.length - 1].issues.join(' | ')}`);

  let design: PosterBrief | null = null;
  let feedback = '';
  for (let i = 0; i < 3 && !design; i++) {
    const raw = await askRouter(BRIEF_MODELS, [{ role: 'user', content: directorPrompt(concept, recent) + feedback }], 0.9);
    const candidate = normalizeBrief({ ...raw, ...PLACEHOLDER_HOOK });
    const issues = checkBrief(candidate, concept, recent);
    attempts.push({ step: 'design', issues, scores: [] });
    if (issues.length === 0) design = candidate;
    feedback = ` REVISI WAJIB, jawaban sebelumnya ditolak: ${issues.join(' | ')}`;
  }
  if (!design) throw fail();

  feedback = '';
  for (let i = 0; i < 3; i++) {
    const raw = await askRouter(HOOK_MODELS, [{ role: 'user', content: hookPrompt(concept, design, recent) + feedback }], 0.9);
    const checked = (Array.isArray(raw.hooks) ? raw.hooks : []).map((h) => {
      const [l1 = '', l2 = ''] = String(h).split('/').map((t, n) => titleCase(clean(t).replace(/[.,!?;:]/g, ''), n === 1));
      const o: PosterBrief = { ...design, hook1: l1, hook2: l2 };
      return { o, issues: checkBrief(o, concept, recent) };
    });
    const valid = checked.filter((c) => c.issues.length === 0).map((c) => c.o);
    const picked = valid.length ? await pickHook(concept, valid) : { best: undefined, scores: [] };
    const issues = picked.best ? [] : valid.length ? ['tidak ada hook bernilai cukup'] : [...new Set(checked.flatMap((c) => c.issues)), 'hooks kosong'];
    attempts.push({ step: 'hook', issues, scores: picked.scores });
    if (picked.best) return { brief: picked.best, attempts };
    feedback = ` REVISI WAJIB: ${issues.join(' | ')}. ${picked.scores.map((x) => `${x.hook} (${x.score}: ${x.note})`).join('; ')}`;
  }
  throw fail();
}

/** Semua teks yang boleh muncul di gambar (untuk prompt & pemeriksa). */
export function expectedTexts(b: PosterBrief, concept: PosterConcept): string[] {
  const bar = barText(b.bar, concept.cluster);
  return [
    b.hook1, b.hook2, RIBBONS[b.ribbon].text,
    ...b.factIds.flatMap((id) => [FACTS[id].title, FACTS[id].sub]),
    ...(bar ? [bar.small, bar.big] : []),
    FOOTERS[b.footer],
  ];
}

export const EXACT_HOUSES =
  'Place the EXACT houses of the attached picture into this new scene: keep their geometry, roofs, windows, louvers, panels and ground floor unchanged; only relight them and extend the row. Also keep its layout: empty sky above, houses in the middle, paving below. Do not redesign, simplify or mirror anything. Ignore its blurred paving and the vertical join at the left.';
export const LUXURY_LIGHT =
  'LUXURY LIGHTING (five-star resort feeling): golden rim light along every roof edge; radiant warm amber light from every window with elegant interiors and sheer curtains visible; grazing wall-washers on the ivory walls; glowing teak soffits with hidden LED strips; bright carport downlights on polished cars; lit garden uplights and bollards; mirror-wet paving reflecting all the light. High dynamic range, bright facades, luxurious contrast. Immaculate tropical planting that never hides the facades.';
export const TYPO_RULE =
  'TYPOGRAPHY: perfectly spelled Indonesian, EXACTLY as quoted; the ONLY text in the image is the quoted strings, each once; no brand name, no watermark. The first text line starts at 19% of the height, never higher; nothing touches the roofs.';
export const SKY_SUFFIX =
  ' The sky must be majestic, rich, clean and vivid, never grey, pale or muddy. No artificial gradient, colour overlay or dark band.';

export function compileBannerPrompt(b: PosterBrief, concept: PosterConcept): string {
  const theme = THEMES[b.theme];
  const bar = barText(b.bar, concept.cluster);
  const features = b.factIds
    .map((id, i) => `${i + 1}) icon: ${FACTS[id].icon}, title "${FACTS[id].title}", sub-line "${FACTS[id].sub}"`)
    .join('; ');
  const prompt = [
    MASTER_HEAD,
    'Format: Instagram poster, vertical 3:4.',
    EXACT_HOUSES,
    BUILDING_BIBLE,
    SINGLE_ROW_RULE,
    theme.scene + SKY_SUFFIX,
    LUXURY_LIGHT,
    'COMPOSITION, from top to bottom: 0-17% ABSOLUTELY EMPTY open sky as headroom (no text, no logo, no plaque, no leaves in its centre); 19-38% the hook and ribbon; 38-73% the two large houses; 73-100% the card, its top overlapping the driveways.',
    MASTER_TAIL,
    TYPO_RULE,
    `- HOOK, two stacked centred lines, by far the strongest element, large bold high-contrast display serif (Playfair Display style, title case), about 80% of the image width: line 1 "${b.hook1}", line 2 slightly larger "${b.hook2}"; ${theme.ink}. Under line 2 a fine hand-brushed gold stroke.`,
    `- RIBBON under the hook: a slim glossy dark-emerald capsule with gold border and one fresh leaf on its end, italic ivory serif: "${RIBBONS[b.ribbon].text}"`,
    'GRAND BOTTOM CARD (luxurious like a five-star hotel invitation, real depth, never flat):',
    `- PANEL: floating, inset 5% from left and right, shape: ${PANELS[b.panel]}. Surface: ${MATERIALS[b.material]}. Double champagne-gold bevelled metallic frame with glints at the corners, golden halo along the top edge, deep soft shadow behind.`,
    `- FEATURES: ${LAYOUTS[b.layout].text}. Every feature uses ${ICONS[b.icon]}; bold title, thinner sub-line. ${features}.`,
    bar
      ? `- GOLD BAR under the features: a wide bevelled pill of brushed metallic champagne gold with bright highlight sweep, centred inside the panel with margins on both sides: small dark-emerald "${bar.small}" and large bold dark-emerald serif "${bar.big}". Nothing else on it.`
      : '',
    `- FOOTER: small wide-spaced gold capitals "${FOOTERS[b.footer]}" between two thin gold lines ending in small leaves.`,
    `- FRESH FOLIAGE IN FRONT: ${ORNAMENTS[b.ornament]}, golden backlight, softly out of focus, sweeping in from both bottom corners over the lower corners of the panel, with two satin champagne-gold ribbon curves. Never covering text, icons or the bar.`,
    '- All card text sharp, level, inside the panel with even margins.',
  ]
    .filter(Boolean)
    .join('\n');
  if (prompt.length > HERMES_MAX_PROMPT) throw new Error(`Prompt banner ${prompt.length} karakter, batas ${HERMES_MAX_PROMPT}`);
  return prompt;
}

const tokens = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);

/**
 * Pemeriksa gambar. Gagal-aman: bila vision tidak menjawab, hasil TIDAK dianggap lolos.
 */
export async function inspectPoster(buffer: Buffer, expected: string[]): Promise<{ ok: boolean; problems: string[]; raw?: unknown }> {
  const mime = buffer[0] === 0x89 ? 'image/png' : 'image/jpeg';
  const ask =
    'Periksa poster ini secara ketat. Balas HANYA JSON: {"full_text":"transkrip SEMUA teks apa adanya, jangan perbaiki ejaan","peaks":["posisi titik TERTINGGI garis atap depan tiap rumah UTUH dari kiri ke kanan: left|middle|right"],"complete_houses":0,"left_edge":"house|empty (apakah tepi kiri gambar di ketinggian rumah berisi rumah terpotong)","right_edge":"house|empty","hook_readable":true,"card_intact":true,"people":false,"broken_parts":"sebutkan cacat bentuk atau kosong"}';
  let r: Record<string, unknown>;
  try {
    r = await askRouter(
      VISION_MODELS,
      [{ role: 'user', content: [{ type: 'text', text: ask }, { type: 'image_url', image_url: { url: `data:${mime};base64,${buffer.toString('base64')}` } }] }],
      0
    );
  } catch (err) {
    return { ok: false, problems: [`pemeriksa gambar tidak menjawab: ${err instanceof Error ? err.message : String(err)}`] };
  }
  const problems: string[] = [];
  const seen = new Set(tokens(String(r.full_text || '')));
  const want = new Set(expected.flatMap(tokens));
  const missing = [...want].filter((t) => !seen.has(t));
  const extra = [...seen].filter((t) => t.length >= 3 && !want.has(t));
  if (missing.length) problems.push(`kata hilang/salah eja: ${missing.join(', ')}`);
  if (extra.length) problems.push(`kata liar/salah eja: ${extra.join(', ')}`);
  // Vision kadang tertukar kiri/kanan pada fasad bersudut, jadi yang diuji keseragaman, bukan arah mutlak.
  const peaks = (Array.isArray(r.peaks) ? r.peaks : []).map(String);
  if (peaks.length < 2) problems.push('arah atap tidak terbaca');
  else if (peaks.includes('middle')) problems.push('atap pelana');
  else if (new Set(peaks).size > 1) problems.push(`atap berlawanan: ${peaks.join(',')}`);
  if (r.left_edge === 'empty' || r.right_edge === 'empty') problems.push('baris rumah habis di tepi');
  if (r.hook_readable === false) problems.push('hook sulit dibaca');
  if (r.card_intact === false) problems.push('card tidak utuh');
  if (r.people === true) problems.push('ada orang');
  return { ok: problems.length === 0, problems, raw: r };
}
