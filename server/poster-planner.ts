// =====================================================================
// POSTER PLANNER - merencanakan gambar satu slot (banner tunggal / carousel).
// LLM lebih dulu; bila gagal atau lambat, jatuh ke rancangan deterministik dari bank
// yang sama sehingga konten terjadwal tetap tersedia tepat waktu.
// =====================================================================

import { DENAH_FACTS, isHarshHook, type UnitType } from './visual-bible';
import {
  EXAMPLE_HEADS,
  FIT_HEADS,
  MOFU_COVERS,
  POSTER_HOOKS,
  PROOFS,
  TOFU_STORIES,
  type Lines,
  type Point,
} from './poster-copy';
import {
  BARS,
  EXACT_HOUSES,
  FACTS,
  FOOTERS,
  HERMES_MAX_PROMPT,
  ICONS,
  LAYOUTS,
  LUXURY_LIGHT,
  MASTER_HEAD,
  MASTER_TAIL,
  MATERIALS,
  ORNAMENTS,
  PANELS,
  RIBBONS,
  SKY_SUFFIX,
  THEMES,
  TYPO_RULE,
  BUILDING_BIBLE,
  askWriter,
  checkBrief,
  compileBannerPrompt,
  expectedTexts,
  requestBrief,
  signatureOf,
  type CardSignature,
  type PosterBrief,
  type PosterConcept,
} from './poster-engine';

export const POSTER_MODEL = 'Nano Banana Pro';
/** Aset yang sudah ada di project Google Flow (akun acc1). */
export const POSTER_REFERENCE = 'ref-fasad-potret.jpg';
/** 5 foto konten + 1 poster marketing di akhir. */
export const CAROUSEL_SLIDES = 6;

export interface RenderMeta {
  model: string;
  reference?: string;
  layout: 'banner' | 'cover' | 'content' | 'denah';
  unitType?: UnitType;
  expected: string[];
  signature?: CardSignature;
  /** Judul slide, dicatat agar tidak terulang. */
  headline: string;
  attempt: number;
}

export interface PlannedImage {
  prompt: string;
  kicker: string;
  headline: string;
  subheadline: string;
  meta: RenderMeta;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Urutan deterministik dari daftar, berbeda untuk tiap seed. */
function shuffled<T>(list: T[], seed: string): T[] {
  return list
    .map((v, i) => ({ v, k: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.v);
}

const keyOf = (l: Lines) => `${l[0]} ${l[1]}`.toLowerCase();

/**
 * Pilih judul yang belum dipakai SE mana pun (`used`: lama -> baru, 14 hari).
 * Bila bank habis, pakai yang paling lama tidak muncul.
 */
function chooseLines(list: Lines[], used: string[], seed: string): Lines {
  const order = shuffled(list, seed);
  return order.find((l) => !used.includes(keyOf(l))) || [...order].sort((a, b) => used.lastIndexOf(keyOf(a)) - used.lastIndexOf(keyOf(b)))[0];
}

function storyFor(concept: PosterConcept) {
  const about = `${concept.pillarLabel} ${concept.pillarFocus}`;
  const list = Object.values(TOFU_STORIES);
  return list.find((x) => x.match.test(concept.pillarLabel)) || list.find((x) => x.match.test(about)) || TOFU_STORIES.ARSITEKTUR;
}

const inScope = (scope: string, concept: PosterConcept) => scope === 'ALL' || scope === concept.cluster;

/** Rancangan tanpa LLM: selalu lolos checkBrief; aturan "jangan mirip" dilonggarkan bertahap bila buntu. */
export function fallbackBrief(concept: PosterConcept, recent: CardSignature[], used: string[], seed: string): PosterBrief {
  const pillar = storyFor(concept);
  const factPool = [...new Set([...pillar.facts, ...shuffled(Object.keys(FACTS), `${seed}:f`)])].filter((id) => inScope(FACTS[id].scope, concept));
  const ribbon = inScope(RIBBONS[pillar.ribbon].scope, concept) ? pillar.ribbon : 'JAPANDI_SKH';
  const [hook1, hook2] = chooseLines(POSTER_HOOKS, used, `${seed}:h`);
  const bars = concept.stage === 'BOFU' ? ['PRICE'] : shuffled(BARS.filter((b) => b !== 'PRICE'), `${seed}:b`);
  // Hook bank sudah diperiksa terpisah (dan dijaga `used`), jadi di sini hanya desain card yang diuji.
  const design = recent.map((r) => ({ ...r, hook: '' }));
  for (const keep of [design, design.slice(-1), []]) {
    for (let i = 0; i < 400; i++) {
      const s = `${seed}:${i}`;
      const pick = (list: object, k: string) => shuffled(Object.keys(list), `${s}:${k}`)[0];
      const layout = pick(LAYOUTS, 'l');
      const bar = bars[i % bars.length];
      const facts = factPool.filter((id) => !(bar === 'PLACE' && id.startsWith('LOK_')));
      const brief: PosterBrief = {
        theme: pick(THEMES, 't'),
        hook1: 'Pulang',
        hook2: 'Lalu Tenang',
        ribbon,
        panel: pick(PANELS, 'p'),
        icon: pick(ICONS, 'i'),
        material: pick(MATERIALS, 'm'),
        ornament: pick(ORNAMENTS, 'o'),
        layout,
        factIds: facts.slice(0, LAYOUTS[layout].count),
        bar,
        footer: pick(FOOTERS, 'r'),
      };
      if (checkBrief(brief, concept, keep).length === 0) return { ...brief, hook1, hook2 };
    }
  }
  throw new Error('rancangan cadangan tidak ditemukan');
}

/** Brief dari LLM dengan batas waktu; gagal/lambat = cadangan. */
async function briefFor(concept: PosterConcept, recent: CardSignature[], used: string[], seed: string, budgetMs: number): Promise<PosterBrief> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const brief = await Promise.race([
      requestBrief(concept, recent).then((r) => r.brief),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`LLM melewati ${Math.round(budgetMs / 1000)} detik`)), budgetMs);
      }),
    ]);
    if (!used.includes(keyOf([brief.hook1, brief.hook2]))) return brief;
    const [hook1, hook2] = chooseLines(POSTER_HOOKS, used, `${seed}:h`);
    return { ...brief, hook1, hook2 };
  } catch (err) {
    console.warn('[poster-planner] pakai rancangan cadangan:', err instanceof Error ? err.message : String(err));
    return fallbackBrief(concept, recent, used, seed);
  } finally {
    clearTimeout(timer);
  }
}

function bannerImage(brief: PosterBrief, concept: PosterConcept): PlannedImage {
  return {
    prompt: compileBannerPrompt(brief, concept),
    kicker: '',
    headline: `${brief.hook1} ${brief.hook2}`,
    subheadline: RIBBONS[brief.ribbon].text,
    meta: {
      model: POSTER_MODEL,
      reference: POSTER_REFERENCE,
      layout: 'banner',
      expected: expectedTexts(brief, concept),
      signature: signatureOf(brief),
      headline: `${brief.hook1} ${brief.hook2}`,
      attempt: 0,
    },
  };
}

export interface PlanInput {
  concept: PosterConcept;
  /** Tanda tangan desain terakhir (lama -> baru), semua SE. */
  recent: CardSignature[];
  /** Judul yang sudah dipakai 14 hari terakhir (lama -> baru), semua SE. */
  used: string[];
  seed: string;
  budgetMs: number;
}

export async function planBanner(p: PlanInput): Promise<PlannedImage[]> {
  return [bannerImage(await briefFor(p.concept, p.recent, p.used, p.seed, p.budgetMs), p.concept)];
}

// --------------------------------------------------------------------- carousel

const CLOSE_ROW =
  'The neighbouring identical houses are cropped at both edges of the frame, attached without a gap; the row never looks finished. All roofs rise to the right. Straight verticals.';

/** Semua sudut memakai gambar referensi fasad; interior/clubhouse menunggu foto asli. */
const SHOTS = {
  ROW: `SHOT: frontal street view very close to the row, low eye level, two complete houses. ${CLOSE_ROW}`,
  FACADE: `SHOT: majestic close view of ONE house filling most of the frame, glowing trapezoid window, teak louvers and soffit in rich detail. ${CLOSE_ROW}`,
  CARPORT: `SHOT: low close view of ONE house centred on its carport and garage with a polished car, timber door and warm downlights, upper floor and roof visible above. ${CLOSE_ROW}`,
  ENTRANCE: `SHOT: elegant close view of ONE house entrance: timber door, warm wall lights, garden path and bollards, upper floor and roof visible above. ${CLOSE_ROW}`,
};
type ShotId = keyof typeof SHOTS;

const SWIPE = 'GESER UNTUK SELENGKAPNYA';

function scene(brief: PosterBrief, shot: ShotId): string[] {
  return [
    MASTER_HEAD,
    'Format: Instagram carousel slide, vertical 3:4.',
    EXACT_HOUSES,
    BUILDING_BIBLE,
    SHOTS[shot],
    THEMES[brief.theme].scene + SKY_SUFFIX,
    LUXURY_LIGHT,
    MASTER_TAIL,
  ];
}

function headlineLines(brief: PosterBrief, l1: string, l2: string): string[] {
  return [
    TYPO_RULE,
    `- HEADLINE, two stacked centred lines, by far the strongest element, large bold high-contrast display serif (Playfair Display style, title case), about 78% of the image width: line 1 "${l1}", line 2 slightly larger "${l2}"; ${THEMES[brief.theme].ink}. Under line 2 a fine hand-brushed gold stroke.`,
  ];
}

function panelLine(brief: PosterBrief): string {
  return `- PANEL: floating, inset 6% from left and right, shape: ${PANELS[brief.panel]}. Surface: ${MATERIALS[brief.material]}. Double champagne-gold bevelled metallic frame with glints at the corners, golden halo along the top edge, deep soft shadow behind.`;
}

function foliage(brief: PosterBrief): string {
  return `- FRESH FOLIAGE IN FRONT: ${ORNAMENTS[brief.ornament]}, golden backlight, softly out of focus, sweeping in from both bottom corners, with two satin champagne-gold ribbon curves. Never covering text or icons.`;
}

function finish(lines: string[]): string {
  const prompt = lines.join('\n');
  if (prompt.length > HERMES_MAX_PROMPT) throw new Error(`Prompt slide ${prompt.length} karakter, batas ${HERMES_MAX_PROMPT}`);
  return prompt;
}

function slide(prompt: string[], head: Lines, sub: string, meta: Pick<RenderMeta, 'layout' | 'expected' | 'unitType'>): PlannedImage {
  const headline = `${head[0]} ${head[1]}`;
  return {
    prompt: finish(prompt),
    kicker: '',
    headline,
    subheadline: sub,
    meta: { model: POSTER_MODEL, reference: POSTER_REFERENCE, headline, attempt: 0, ...meta },
  };
}

function coverImage(brief: PosterBrief, head: Lines): PlannedImage {
  const ribbon = RIBBONS[brief.ribbon].text;
  return slide(
    [
      ...scene(brief, 'ROW'),
      'COMPOSITION, from top to bottom: 0-17% ABSOLUTELY EMPTY open sky (no text, no logo, no plaque); 19-38% headline and ribbon; 38-88% the two large majestic houses and the mirror-wet lane; 90-97% one slim footer.',
      ...headlineLines(brief, head[0], head[1]),
      `- RIBBON under the headline: a slim glossy dark-emerald capsule with gold border and one fresh leaf on its end, italic ivory serif: "${ribbon}"`,
      `- FOOTER near the bottom, centred: a slim floating capsule, surface ${MATERIALS[brief.material]}, gold frame, small wide-spaced gold capitals "${SWIPE}" between two tiny gold leaves.`,
      foliage(brief),
    ],
    head,
    ribbon,
    { layout: 'cover', expected: [head[0], head[1], ribbon, SWIPE] }
  );
}

/** Slide isi: satu judul + satu card ringkas 2-3 poin. */
function pointsImage(brief: PosterBrief, head: Lines, points: Point[], shot: ShotId): PlannedImage {
  const features = points.map(([icon, title, sub], i) => `${i + 1}) icon: ${icon}, title "${title}", sub-line "${sub}"`).join('; ');
  return slide(
    [
      ...scene(brief, shot),
      'COMPOSITION, from top to bottom: 0-17% ABSOLUTELY EMPTY calm sky (no text, no logo, no plaque); 19-35% the headline; 35-79% the house; 79-98% one compact card.',
      ...headlineLines(brief, head[0], head[1]),
      'COMPACT CARD (luxurious like a five-star hotel invitation, real depth, never flat):',
      panelLine(brief),
      `- FEATURES: ${points.length} equal columns in one row separated by thin fading vertical gold lines. Every feature uses ${ICONS[brief.icon]}; bold title, thinner sub-line. ${features}. Nothing else on the card.`,
      foliage(brief),
      '- All card text sharp, level, inside the panel with even margins.',
    ],
    head,
    points.map((x) => `${x[1]}: ${x[2]}`).join(' · '),
    { layout: 'content', expected: [head[0], head[1], ...points.flatMap((x) => [x[1], x[2]])] }
  );
}

const factPoints = (ids: string[]): Point[] => ids.map((id) => [FACTS[id].icon, FACTS[id].title, FACTS[id].sub]);

/** Slide denah: AI hanya menggambar suasana & judul; denah ASLI ditempel poster-composer. */
function denahImage(brief: PosterBrief, unitType: UnitType): PlannedImage {
  const head: Lines = ['Denah Asli', `Tipe ${unitType}`];
  return slide(
    [
      ...scene(brief, 'FACADE'),
      'COMPOSITION, from top to bottom: 0-17% ABSOLUTELY EMPTY open sky (no text, no logo, no plaque); 19-35% the headline; the house below, its lower part simple and darker because a floor-plan panel will cover the lower 60%. No card, no panel, no other text.',
      ...headlineLines(brief, head[0], head[1]),
    ],
    head,
    DENAH_FACTS[unitType].title,
    { layout: 'denah', unitType, expected: head }
  );
}

/** TOFU: sampul, 3 tips, contoh nyata. Memberi manfaat dulu, tanpa harga. */
function tofuSlides(p: PlanInput, brief: PosterBrief): PlannedImage[] {
  const story = storyFor(p.concept);
  const cover = chooseLines(story.covers, p.used, `${p.seed}:c`);
  const used = [...p.used, keyOf(cover)];
  const tips = shuffled(story.tips, `${p.seed}:t`).sort((a, b) => used.lastIndexOf(keyOf(a.head)) - used.lastIndexOf(keyOf(b.head))).slice(0, 3);
  const facts = story.facts.filter((id) => inScope(FACTS[id].scope, p.concept)).slice(0, 3);
  const shots: ShotId[] = ['ENTRANCE', 'FACADE', 'CARPORT'];
  return [
    coverImage(brief, cover),
    ...tips.map((tip, i) => pointsImage(brief, tip.head, tip.points, shots[i])),
    pointsImage(brief, chooseLines(EXAMPLE_HEADS, used, `${p.seed}:x`), factPoints(facts), 'ROW'),
  ];
}

/** MOFU: sampul, 2 bukti, denah asli, cocok untuk siapa. */
function mofuSlides(p: PlanInput, brief: PosterBrief, unitType: UnitType): PlannedImage[] {
  const about = `${p.concept.pillarLabel} ${p.concept.pillarFocus}`;
  const usable = Object.entries(PROOFS).filter(([, x]) => inScope(x.scope, p.concept));
  const fresh = ([, x]: (typeof usable)[number]) => x.heads.filter((h) => p.used.includes(keyOf(h))).length;
  const ranked = [
    ...usable.filter(([, x]) => x.match.test(about)),
    ...shuffled(usable.filter(([, x]) => !x.match.test(about)), `${p.seed}:p`).sort((a, b) => fresh(a) - fresh(b)),
  ];
  const proofs = ranked.slice(0, 2);
  const taken = new Set(proofs.flatMap(([, x]) => x.facts));
  const fitFacts = ['KAMAR', 'GARASI', 'KELUARGA', 'TAMAN'].filter((id) => !taken.has(id)).slice(0, 2);
  return [
    coverImage(brief, chooseLines(MOFU_COVERS, p.used, `${p.seed}:c`)),
    ...proofs.map(([id, x], i) => pointsImage(brief, chooseLines(x.heads, p.used, `${p.seed}:${id}`), factPoints(x.facts), i === 1 && x.shot === proofs[0][1].shot ? 'ENTRANCE' : x.shot)),
    denahImage(brief, unitType),
    pointsImage(brief, chooseLines(FIT_HEADS, p.used, `${p.seed}:f`), factPoints(fitFacts), 'CARPORT'),
  ];
}

/** 5 foto konten (cerita TOFU/MOFU) + foto ke-6 WAJIB poster marketing bergaya banner. */
export async function planCarousel(p: PlanInput, unitType: UnitType): Promise<PlannedImage[]> {
  const brief = await briefFor(p.concept, p.recent, p.used, p.seed, p.budgetMs);
  const story = p.concept.stage === 'TOFU' ? tofuSlides(p, brief) : mofuSlides(p, brief, unitType);
  const used = [...p.used, ...story.map((x) => x.headline.toLowerCase())];
  const [hook1, hook2] = used.includes(keyOf([brief.hook1, brief.hook2])) ? chooseLines(POSTER_HOOKS, used, `${p.seed}:z`) : [brief.hook1, brief.hook2];
  const poster: PosterBrief = { ...brief, hook1, hook2, bar: 'PRICE' };
  return [...story, bannerImage(poster, p.concept)];
}

/** Caption mengikuti isi slide. LLM dulu, gagal/melanggar = susunan baku dari judul slide. */
export async function writeCaption(concept: PosterConcept, images: PlannedImage[], budgetMs: number): Promise<string> {
  const body = images.slice(0, -1);
  const list = body.map((x) => `- ${x.headline}${x.subheadline ? ` (${x.subheadline})` : ''}`).join('\n');
  const plain = `${body[0].headline}.\n\n${body
    .slice(1)
    .map((x) => `• ${x.headline}`)
    .join('\n')}\n\nSimpan dulu supaya mudah dicari lagi. Kalau ingin melihat langsung suasananya, kabari kami lewat pesan ya.`;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const raw = await Promise.race([
      askWriter(
        [
          {
            role: 'user',
            content: `Tulis caption Instagram berbahasa Indonesia untuk carousel hunian premium. Pembaca: ${concept.audience}. Isi slide:\n${list}\n\nAturan: 450-800 huruf, baris pertama menarik dan hangat, paragraf pendek dan mengalir seperti bercerita kepada teman (JANGAN menulis kata "slide", penomoran, atau menyalin judul mentah), mengikuti urutan dan isi slide saja (jangan menambah fakta, angka, harga, jarak, atau janji baru), maksimal 3 emoji, akhiri ajakan halus untuk menyimpan atau bertanya. Tanpa hashtag, tanpa mendesak, tanpa menyindir. Balas HANYA JSON {"caption":""}`,
          },
        ],
        0.8
      ),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('caption lambat')), budgetMs);
      }),
    ]);
    const caption = String(raw.caption || '').trim();
    const allowed = new Set(list.match(/\d+/g) || []);
    const newNumber = (caption.match(/\d+/g) || []).some((x) => !allowed.has(x));
    if (caption.length < 200 || caption.length > 1200 || newNumber || /#|slide|\bpasti\b|dijamin|bebas banjir|investasi/i.test(caption) || isHarshHook(caption)) return plain;
    return caption;
  } catch {
    return plain;
  } finally {
    clearTimeout(timer);
  }
}
