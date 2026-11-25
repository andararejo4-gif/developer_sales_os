// ============================================================================
// VISUAL BIBLE — satu-satunya sumber kebenaran visual The Park Townhouse untuk
// prompt gambar (Recraft). Arsitektur WAJIB sama di semua slide; yang berubah
// hanya sudut pandang (SHOT) dan cahaya (LIGHT). Teks TIDAK digambar AI:
// ditempel oleh server/poster-composer.py.
// ============================================================================

import path from 'node:path';

export type UnitType = 75 | 95 | 110;
export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU';

/** Blok baku arsitektur. Jangan diubah per slide / oleh LLM. */
export const BUILDING_BIBLE =
  'ARCHITECTURE: the attached picture is the ONLY architecture reference. Rebuild exactly these Japandi 2-storey townhouses: same roof direction, facade order, windows and materials. ' +
  'ROOFS (top priority): every roof rises the SAME way, low at the LEFT end and high at the RIGHT end, all parallel, also on the cropped neighbours; deep overhang with warm teak soffit and dark charcoal fascia. NEVER mirrored, never two roofs facing each other, no V shape, no symmetric gable. ' +
  'FACADE, identical on every house from left to right: one large trapezoid window following the roof slope, a plain ivory wall panel, one tall narrow vertical window, VERTICAL teak louvers up to the roof, a tall slim wall. Ground floor: carport with a car on the left, timber door, glass window on the right. ' +
  'Ignore the sky, light and the vertical join at the left of the reference. No lettering or number plates on the houses. ';

/** POV baku: kamera menghadap SATU baris unit; baris kedua tidak boleh tampil. */
export const SINGLE_ROW_RULE =
  'CAMERA & POV (strict): standing on the cluster lane very close to the houses, low eye level looking slightly up so they feel tall and majestic, frontal view, 35 mm. Like a window cut out of a much longer terrace row: TWO complete houses, each about 40% of the image width, dominate the picture; at the far LEFT edge the right end of the previous identical house and at the far RIGHT edge the left part of the next identical house are cut off by the frame, attached without a gap. The row NEVER ends: no empty corner, no garden, trees or sky beside the houses. One row only, nothing opposite or behind except sky. Straight verticals.';

export const MASTER_HEAD =
  'An ultra-premium real-estate advertising photograph of The Park Townhouse Sukoharjo, shot by a world-class architectural photographer. Cinematic, prestigious, realistic. PALETTE (fixed): deep emerald #0B5A45, warm ivory #F4EBDD, champagne gold #D8B46A, warm amber light #FFC477, charcoal #292626. NEVER navy, red or crimson.';

export const MASTER_TAIL =
  'PHOTOGRAPHIC QUALITY: high-end architectural photography, photoreal global illumination, detailed realistic materials (ivory stucco, teak, charcoal stone, glass, black aluminium), sharp edges, professional grading; a real photograph. NEGATIVE: no distorted windows, no neon, no lens flare, no cartoon look, no signage, NO people, no animals.';

export const INTERIOR_DNA =
  'Japandi modern living room of the same townhouse: warm teak wood accents, off-white walls, large black-framed glass window with the slanted trapezoid top, soft beige sofa, indoor plants, warm ambient lighting, tidy and spacious.';

/** Tambahan spesifik denah per tipe, hanya untuk memutuskan isi garasi/carport di visual. */
export const UNIT_TYPE_VISUAL: Record<UnitType, string> = {
  75: 'Type 75: compact unit, ONE car inside the garage bay on the left and ONE car on the grass-block carport in front.',
  95: 'Type 95: ONE SUV inside the garage bay on the left plus two motorbikes parked beside it, ONE car on the grass-block carport.',
  110: 'Type 110: WIDE garage bay fitting TWO SUVs side by side inside, ONE more car on the wide grass-block carport.',
};

export interface ShotDef {
  id: string;
  label: string;
  prompt: string;
}

/** Pustaka sudut pandang. LLM hanya memilih ID; tidak boleh menulis visual bebas. Tanpa orang. */
export const SHOT_LIBRARY: Record<string, ShotDef> = {
  WIDE_DIAGONAL: {
    id: 'WIDE_DIAGONAL',
    label: 'Deretan unit dari sudut diagonal rendah menuju matahari',
    prompt:
      'Low-angle diagonal perspective along the ONE single row of 5 identical units, camera on the lane in front of that row, the row receding toward a huge glowing sun on the horizon, open green lawn on the other side of the lane, long sun flare, wet paving mirroring the warm light, small garden lamps glowing.',
  },
  FRONT_ROW: {
    id: 'FRONT_ROW',
    label: 'Tampak depan sejajar 3 unit',
    prompt:
      'Close frontal street view, one car in each carport in different colours, a pink flowering tree between the units, warm interiors visible through the glass.',
  },
  FACADE_CLOSEUP: {
    id: 'FACADE_CLOSEUP',
    label: 'Close-up fasad satu unit, fokus jendela trapesium',
    prompt:
      'Three-quarter close-up of ONE unit facade filling the frame, emphasising the slanted trapezoid window glowing amber, the teak soffit and the white blade wall, wall-washer lights grazing the stucco, pink flowering tree in front.',
  },
  CARPORT_GARAGE: {
    id: 'CARPORT_GARAGE',
    label: 'Carport dan garasi dalam dengan mobil',
    prompt:
      'Eye-level view of the ground floor of ONE unit: grass-block carport with a car, the open recessed garage bay with warm timber wall, front door, unit number plate, warm downlights, glowing 2nd-floor windows above.',
  },
  STREET_LIFE: {
    id: 'STREET_LIFE',
    label: 'Suasana jalan cluster senja',
    prompt:
      'Street-level three-quarter view of the ONE single row of 4 identical units, camera on the lane facing the row, at golden hour, pink flowering trees, low garden bollard lights just turned on, cars parked, a bicycle leaning by a front door, the empty lane mirroring the sunset.',
  },
  BLUE_HOUR: {
    id: 'BLUE_HOUR',
    label: 'Blue hour, jendela menyala hangat',
    prompt:
      'Blue-hour dusk view of the ONE single row of 3 identical units, seen from the lane in front of it, with every window and wall light glowing warm amber against a soft blue-violet sky, glossy wet street reflecting the glow, a few early stars.',
  },
  CLUBHOUSE: {
    id: 'CLUBHOUSE',
    label: 'Taman/clubhouse dengan unit di latar',
    prompt:
      'Resort-style clubhouse garden with a glowing swimming pool and lounge in the foreground, the identical white shed-roof townhouses softly visible in the background, lush tropical planting, golden light.',
  },
  GATE_ENTRANCE: {
    id: 'GATE_ENTRANCE',
    label: 'Gerbang masuk one-gate cluster',
    prompt:
      'Elegant one-gate cluster entrance with a clean stone gate pillar and security post, paved boulevard lined with palms and uplights leading to the identical townhouses in the distance, golden light.',
  },
  INTERIOR_LIVING: {
    id: 'INTERIOR_LIVING',
    label: 'Interior ruang keluarga',
    prompt: INTERIOR_DNA + ' Camera at sofa height looking toward the window with golden light streaming in.',
  },
  FRONT_ROW_CLOSING: {
    id: 'FRONT_ROW_CLOSING',
    label: 'Deretan 4-5 unit megah, penutup',
    prompt:
      'Grand, close, towering frontal hero view, a car in each lit carport, pink flowering trees and bollard lights, magazine-cover impact.',
  },
};

/** Slide denah memakai gambar denah ASLI; background-nya tetap perlu satu shot. */
export const DENAH_BACKGROUND_SHOT = 'FACADE_CLOSEUP';
export const DENAH_SHOT_ID = 'DENAH';

export const VALID_SHOT_IDS = [...Object.keys(SHOT_LIBRARY), DENAH_SHOT_ID];

export const LIGHT_RECIPE: Record<FunnelStage, string> = {
  TOFU:
    'SKY (must be majestic): an epic, awe-inspiring sunset sky with huge layered cumulus clouds of real depth: deep teal-blue at the top, then rose and copper, then blazing molten gold at the horizon. The low sun hides behind the roofs; glowing golden rays fan out between the clouds and every cloud edge is rim-lit gold. Rich, clean, vivid, never grey, pale or muddy.',
  MOFU:
    'SKY & LIGHT: late golden hour melting into early blue hour, layered volumetric clouds in soft peach and blue, bright warm glow from every window, crisp reflections on wet paving, rich but still bright. Trustworthy and inviting.',
  BOFU:
    'SKY (must be majestic): an epic, awe-inspiring sunset sky with huge layered cumulus clouds of real depth: deep teal-blue at the top, then rose and copper, then blazing molten gold at the horizon. The low sun hides behind the roofs; glowing golden rays fan out between the clouds and every cloud edge is rim-lit gold. Rich, clean, vivid, never grey, pale or muddy.',
};

const STYLE_RULE =
  'LUXURY LIGHTING (must feel like a five-star resort at dusk): golden sun rim light along every roof edge and wall; radiant warm amber light pouring from every window with elegant furnished interiors and sheer curtains visible; grazing wall-washers on the ivory walls; glowing teak soffits with hidden LED strips; bright carport downlights on polished cars; lit garden uplights and bollards. Mirror-wet paving reflects all the gold. High dynamic range, bright facades, deep but clean shadows, luxurious contrast. Immaculate tropical planting and pink-flowering trees, never hiding the facades.';

/** Satu aturan warna untuk semua slide: tanpa gradasi; zona atas disiapkan untuk plakat logo dari poster-composer. */
const SKY_RULE =
  'HEADROOM (strict): the top 17% of the image is ABSOLUTELY EMPTY open sky (no text, no logo, no plaque, no leaves in its centre); the official logo is added there later. No artificial gradient, colour overlay or dark band anywhere on the photo.';

export type PosterLayout = 'cover' | 'content' | 'denah' | 'closing';

export interface PosterTextSpec {
  layout: PosterLayout;
  kicker?: string;
  headline: string;
  subheadline?: string;
  bullets?: string[];
  priceLabel?: string;
}

const cleanText = (t: string) => t.replace(/["\u201C\u201D]/g, '').replace(/\s+/g, ' ').trim();

/** Isi card penutup: hanya klaim yang berlaku untuk semua cluster (lihat CLUSTER_FACTS di content-media-worker). */
const CLOSING_FEATURES: Array<{ icon: string; title: string; sub: string }> = [
  { icon: 'a map location pin', title: 'Lokasi Strategis', sub: 'di Sukoharjo' },
  { icon: 'a simple house outline', title: 'Desain Japandi', sub: 'Modern 2 Lantai' },
  { icon: 'a shield with a check mark', title: 'Keamanan 24 Jam', sub: 'One-Gate & CCTV' },
  { icon: 'a smart door lock with a keyhole', title: 'Smart Living', sub: 'Smart Door Lock' },
];

/** Card penutup megah: panel mengambang, medali emas, pil metalik, daun foreground, lengkung emas. */
function buildGrandCardBlock(spec: PosterTextSpec): string[] {
  const columns = CLOSING_FEATURES.map(
    (f, i) =>
      `column ${i + 1}: icon ${f.icon}, bold ivory title "${f.title}", smaller ivory line "${f.sub}"`
  ).join('. ');
  const price = cleanText(spec.priceLabel || 'Rp650 Jutaan');
  return [
    'GRAND BOTTOM CARD (luxurious like a five-star hotel invitation, real depth):',
    '- PANEL: one compact floating panel whose highest point is at 73% of the image height, inset 6% from left and right, top edge a symmetric classical arch with rounded shoulders and a gentle raised crest in the centre. Polished emerald glass, gradient from #0F6B52 glowing at top centre to near-black #04271D at the bottom, faint botanical engraving inside. Double champagne-gold bevelled metallic frame with glints at the corners, golden halo along the top edge, deep soft shadow behind. A small ornate gold laurel emblem (no letters) sits on the crest.',
    `- FOUR equal COLUMNS separated by thin vertical gold lines fading at both ends, each topped by an identical round polished-gold ring medallion with an embossed gold line icon: ${columns}.`,
    `- GOLD BAR below: one wide pill of brushed metallic champagne gold (satin gradient, bevelled edge, highlight sweep) with only two centred elements on one line: dark-emerald "Harga mulai" and a very large bold dark-emerald serif "${price}". Nothing else on it.`,
    '- FOOTER under the bar: small wide-spaced gold capitals "KENALI HUNIANNYA LEBIH DEKAT" between two thin gold lines ending in gold leaves.',
    '- FRESH FOLIAGE IN FRONT: lush glossy fresh-green tropical leaves with dew, golden backlight, softly out of focus like real foreground photography, sweep in from both bottom corners and overlap the lower corners of the panel, with two satin champagne-gold ribbon curves beneath them. They never cover any text, icon or the gold bar.',
    '- All card text is sharp, level, inside the panel with even margins; each quoted string appears exactly once.',
  ];
}

/**
 * Blok tipografi yang digambar langsung oleh model gambar. Teks dikutip persis,
 * dibatasi pendek, dan model dilarang menambah kata lain (tuning anti-typo).
 */
/** Hook harus netral & mengundang: tanpa sindiran, tekanan, atau paksaan beli. */
const HARSH_HOOK =
  /ngontrak|kontrakan|sampai kapan|masih (nge)?kos|nyesel|menyesal|rugi|buruan|segera|jangan (sampai|tunda)|terakhir|kehabisan|amankan|booking|beli sekarang|hari ini|tinggal \d+ unit/i;

export function isHarshHook(text: string): boolean {
  return HARSH_HOOK.test(text);
}

/** Batas panjang prompt di API Hermes (GenerateRequest.prompt). */
const MAX_PROMPT_CHARS = 8000;

/** Pecah hook jadi maksimal 2 baris seimbang agar hurufnya selalu besar. */
function splitHook(headline: string): string[] {
  const words = cleanText(headline).split(' ');
  if (words.length < 2) return words;
  const total = words.join(' ').length;
  let best = 1;
  for (let i = 1; i < words.length; i++) {
    const diff = (n: number) => Math.abs(words.slice(0, n).join(' ').length * 2 - total);
    if (diff(i) < diff(best)) best = i;
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

function buildTypographyBlock(spec: PosterTextSpec): string {
  const hookLines = splitHook(spec.headline);
  const lines: string[] = [
    'HOOK TYPOGRAPHY (same lockup on every slide: strong, graceful, inviting). Perfectly spelled Indonesian, EXACTLY as quoted; the ONLY text in the image is the quoted strings, each once; no project name, no watermark. Centred between 19% and 38% of the height on the sky, never higher and never touching the roofs:',
  ];
  if (spec.kicker) {
    lines.push(`- LEAD-IN: small elegant ivory serif between two short gold lines: "${cleanText(spec.kicker)}"`);
  }
  const weight = 'large bold high-contrast display serif (Playfair Display style, title case), about 80% of the image width, crisp with a soft dark-teal shadow for perfect legibility';
  lines.push(
    hookLines.length === 2
      ? `- HOOK, two stacked lines, by far the strongest element: line 1 pure ivory white "${hookLines[0]}", line 2 even larger in polished champagne-gold gradient "${hookLines[1]}", both ${weight}. Under line 2 a fine hand-brushed gold stroke.`
      : `- HOOK, by far the strongest element, polished champagne-gold gradient "${hookLines[0]}", ${weight}. Under it a fine hand-brushed gold stroke.`
  );
  if (spec.subheadline) {
    lines.push(
      `- RIBBON under the hook: a slim glossy dark-emerald capsule with gold border and one fresh green leaf on its right end, italic ivory serif: "${cleanText(spec.subheadline)}"`
    );
  }
  if (spec.layout === 'content' && spec.bullets?.length) {
    const used = spec.bullets.slice(0, 3);
    const items = used.map((b) => `"${cleanText(b)}"`).join(', ');
    lines.push(
      `- At the bottom, a solid deep-emerald rounded glass panel (#0B5A45, thin champagne-gold border, soft top edge) occupies the bottom 24% of the image and contains ${used.length} short lines, each with a small gold dot bullet, ivory sans-serif text, exactly in this order: ${items}`
    );
  }
  if (spec.layout === 'closing') {
    lines.push(...buildGrandCardBlock(spec));
  }
  return lines.join('\n');
}

/** Urutan shot default (6 slide) bila LLM tidak memberi / memberi shot duplikat. */
const DEFAULT_SHOT_SEQUENCE: Record<FunnelStage, string[]> = {
  TOFU: ['FRONT_ROW', 'WIDE_DIAGONAL', 'FACADE_CLOSEUP', 'CARPORT_GARAGE', 'STREET_LIFE', 'FRONT_ROW_CLOSING'],
  MOFU: ['FACADE_CLOSEUP', 'GATE_ENTRANCE', 'CARPORT_GARAGE', 'CLUBHOUSE', 'BLUE_HOUR', 'FRONT_ROW_CLOSING'],
  BOFU: ['FRONT_ROW_CLOSING', 'BLUE_HOUR', 'FACADE_CLOSEUP', 'STREET_LIFE', 'WIDE_DIAGONAL', 'FRONT_ROW_CLOSING'],
};

/**
 * Pastikan tiap slide punya shot valid dan tidak ada shot yang berulang
 * (kecuali slide penutup boleh memakai FRONT_ROW_CLOSING).
 */
export function resolveShotSequence(
  requested: Array<string | undefined>,
  stage: FunnelStage,
  count: number
): string[] {
  const fallback = DEFAULT_SHOT_SEQUENCE[stage];
  const used = new Set<string>();
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const want = String(requested[i] || '').toUpperCase().trim();
    const isClosing = count >= 6 && i === count - 1;
    let pick = VALID_SHOT_IDS.includes(want) ? want : '';
    if (pick && pick !== DENAH_SHOT_ID && used.has(pick) && !(isClosing && pick === 'FRONT_ROW_CLOSING')) pick = '';
    if (pick === DENAH_SHOT_ID && result.includes(DENAH_SHOT_ID)) pick = '';
    if (!pick) {
      pick = fallback.find((s) => !used.has(s)) || fallback[i % fallback.length];
      if (isClosing) pick = 'FRONT_ROW_CLOSING';
    }
    used.add(pick);
    result.push(pick);
  }
  return result;
}

export function resolveUnitType(label: string): UnitType {
  const l = label.toUpperCase();
  if (/\b110\b|4\s?KT|DIAMOND|A\.0[689]|B\.07|BIG LOT/.test(l)) return 110;
  if (/\b95\b|A\.0[47]|OSAKA|TOKYO/.test(l)) return 95;
  if (/\b75\b|B\.0[234]|GOLD 3KT/.test(l)) return 75;
  return 95;
}

export function buildPosterPrompt(params: {
  shotId: string;
  stage: FunnelStage;
  unitType: UnitType;
  text: PosterTextSpec;
}): string {
  const shotId = params.shotId === DENAH_SHOT_ID ? DENAH_BACKGROUND_SHOT : params.shotId;
  const shot = SHOT_LIBRARY[shotId] || SHOT_LIBRARY.FRONT_ROW;
  const isInterior = shot.id === 'INTERIOR_LIVING';
  const hasBullets = params.text.layout === 'content' && !!params.text.bullets?.length;
  const composition =
    params.text.layout === 'denah'
      ? 'COMPOSITION: vertical 3:4. Hook zone on top; the building sits in the middle band (it will be partly covered by a floor-plan panel below, so keep the lower 55% simple and darker).'
      : params.text.layout === 'closing'
        ? 'COMPOSITION: vertical 3:4. Empty sky 0-17%, hook and ribbon 19-38% on sky, the two large houses from 37% (roof peaks) to 74%, compact grand card only in the bottom 26%, its arch overlapping the driveways.'
        : `COMPOSITION: vertical 3:4. Empty sky 0-17%, hook 19-38%, the large close houses fill everything below.${hasBullets ? ' Keep the bottom 26% calm for the text panel.' : ''}`;
  const prompt = [
    MASTER_HEAD,
    'Format: Instagram poster, vertical 3:4.',
    isInterior ? '' : BUILDING_BIBLE,
    isInterior || params.text.layout === 'closing' ? '' : UNIT_TYPE_VISUAL[params.unitType],
    isInterior || shot.id === 'CLUBHOUSE' ? '' : SINGLE_ROW_RULE,
    `SHOT: ${shot.prompt}`,
    LIGHT_RECIPE[params.stage],
    STYLE_RULE,
    SKY_RULE,
    composition,
    MASTER_TAIL,
    buildTypographyBlock(params.text),
  ]
    .filter(Boolean)
    .join('\n');
  if (prompt.length > MAX_PROMPT_CHARS) throw new Error(`Prompt poster ${prompt.length} karakter, batas ${MAX_PROMPT_CHARS}`);
  return prompt;
}

export function denahPaths(unitType: UnitType): { lt1: string; lt2: string } {
  const dir = path.resolve(process.cwd(), 'public', 'brand', 'denah');
  return {
    lt1: path.join(dir, `denah-${unitType}-lt1.png`),
    lt2: path.join(dir, `denah-${unitType}-lt2.png`),
  };
}

/** Fakta denah resmi (sumber: data_train/RENDER DENAH) untuk bullet slide denah. */
export const DENAH_FACTS: Record<UnitType, { title: string; lt1: string; lt2: string }> = {
  75: {
    title: 'Tipe 75 · 3 KT / 2 KM',
    lt1: 'Lantai 1: carport + garasi dalam 1 mobil, dapur, 1 KM, 1 KT',
    lt2: 'Lantai 2: ruang keluarga, 2 KT, 1 KM',
  },
  95: {
    title: 'Tipe 95 · 3 KT',
    lt1: 'Lantai 1: carport + garasi dalam 1 mobil & 2 motor, ruang tamu, dapur, 1 KT',
    lt2: 'Lantai 2: ruang keluarga lega, 2 KT, 1 KM',
  },
  110: {
    title: 'Tipe 110 · 4 KT / 3 KM',
    lt1: 'Lantai 1: garasi dalam muat 2 SUV + carport, dapur, 2 KM, 1 KT',
    lt2: 'Lantai 2: ruang keluarga luas + lounge deck kayu, 3 KT, 1 KM',
  },
};
