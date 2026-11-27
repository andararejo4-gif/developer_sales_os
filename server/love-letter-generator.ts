import type { LoveLetterPoint } from '../src/lib/love-letter/points-data';
import { validateLoveLetter, type ValidationResult } from '../src/lib/love-letter/validator';
import type { OnboardingExtractedUnit } from './tenant-guard';
import { fetchNearbyPoisFromOsm, type RealPoiItem } from './poi-lookup';

export interface GenerateLoveLetterInput {
  developerName: string;
  projectName: string;
  city: string;
  province: string;
  facilities: string;
  clusters: Array<{ name: string; lat: string; lng: string }>;
  verifiedUnits: OnboardingExtractedUnit[];
  extractedText?: string;
  nearbyPois?: RealPoiItem[];
  skipExternalLookup?: boolean;
  useAiEditorial?: boolean;
}

export interface GroundedLoveLetterPoint extends LoveLetterPoint {
  sourceTag: 'POI_OSM' | 'CLUSTER' | 'UNIT_OCR' | 'FACILITY' | 'OCR_PRICELIST' | 'OCR_BROSUR' | 'IDENTITY';
}

export interface LoveLetterGenerationResult {
  points: GroundedLoveLetterPoint[];
  validation: ValidationResult;
  poisUsed: RealPoiItem[];
  gapRecommendations: string[];
  aiEnriched: boolean;
}

const CHAPTERS = [
  'Bab I: Lokasi Strategis & Konektivitas Kawasan',
  'Bab II: Masterplan, Cluster & Tata Lingkungan',
  'Bab III: Pilihan Tipe Hunian & Spesifikasi Ruang',
  'Bab IV: Fasilitas Kawasan & Gaya Hidup Penghuni',
  'Bab V: Transparansi Harga, Skema Bayar & Legalitas',
  'Bab VI: Pengelolaan Kawasan & Nilai Huni Jangka Panjang',
];

function formatRupiahShort(amount: number | null): string {
  if (!amount || amount <= 0) return 'sesuai pricelist resmi';
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2).replace('.', ',')} Miliar`;
  }
  return `Rp ${Math.round(amount / 1_000_000).toLocaleString('id-ID')} Juta`;
}

/**
 * Memecah daftar fasilitas secara cerdas termasuk sub-fasilitas di dalam tanda kurung
 * agar setiap fasilitas nyata menjadi poin keunggulan tersendiri (bukan filler).
 */
function parseIndividualFacilities(raw: string): string[] {
  const expanded = raw.replace(/\(([^)]+)\)/g, ', $1,');
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of expanded.split(/[,;\n]+/)) {
    const clean = part.trim().replace(/^dan\s+/i, '');
    if (clean.length < 3) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}

const INFRA_REGEX = /underground|pompa|banjir|fly\s*over|jembatan|one\s*gate|cctv|keamanan|satpam|tenaga\s*surya|jogging|eco-green|taman\s*rusa/i;
const MANAGEMENT_REGEX = /keamanan|cctv|satpam|estate|pengelolaan|sampah|pemeliharaan|purna\s*jual|polsek/i;

/**
 * Builder faktual deterministik: ZERO filler palsu, setiap poin terikat ke data riil.
 */
export function buildGroundedLoveLetterPoints(
  input: GenerateLoveLetterInput,
  pois: RealPoiItem[] = []
): GroundedLoveLetterPoint[] {
  const project = input.projectName.trim() || 'Proyek Hunian';
  const dev = input.developerName.trim() || 'Pengembang Resmi';
  const city = input.city.trim() || 'Kota Utama';
  const province = input.province.trim() || 'Indonesia';
  const allFacilities = parseIndividualFacilities(input.facilities || '');
  const clusters = (input.clusters || []).filter((c) => c.name.trim());
  const units = (input.verifiedUnits || []).filter((u) => u.unit.trim());
  const ocrText = String(input.extractedText || '');

  const points: GroundedLoveLetterPoint[] = [];
  const seenTitles = new Set<string>();

  const push = (
    chapterIdx: number,
    category: string,
    title: string,
    narrative: string,
    sourceTag: GroundedLoveLetterPoint['sourceTag']
  ) => {
    if (points.length >= 99) return;
    const key = title.toLowerCase().trim();
    if (seenTitles.has(key)) return;
    seenTitles.add(key);
    points.push({
      number: points.length + 1,
      chapter: CHAPTERS[chapterIdx] || CHAPTERS[0],
      category,
      title,
      narrative,
      sourceTag,
    });
  };

  // BAB I: LOKASI & POI NYATA DARI KOORDINAT GPS
  push(
    0,
    'Identitas Lokasi',
    `Lokasi Strategis ${project} di ${city}, ${province}`,
    `${project} dikembangkan oleh ${dev} di wilayah ${city}, ${province}, menghubungkan area hunian dengan koridor aktivitas utama di sekitar kota.`,
    'IDENTITY'
  );
  for (const poi of pois) {
    push(
      0,
      poi.category,
      `Kedekatan Sekitar ${poi.driveMinutes} Menit ke ${poi.name}`,
      `${poi.name} berjarak sekitar ${poi.distanceKm} km (sekitar ${poi.driveMinutes} menit berkendara) dari titik kawasan ${project} di ${city}, memudahkan kebutuhan ${poi.category.toLowerCase()} penghuni.`,
      'POI_OSM'
    );
  }

  // BAB II: MASTERPLAN, CLUSTER & INFRASTRUKTUR KAWASAN
  for (const c of clusters) {
    const hasCoord = c.lat.trim() && c.lng.trim();
    push(
      1,
      'Cluster',
      `Konsep Residensial Tertata di ${c.name}`,
      `${c.name} merupakan bagian dari masterplan ${project} oleh ${dev}${
        hasCoord ? ` yang terpetakan pada koordinat GPS ${c.lat.trim()}, ${c.lng.trim()}` : ''
      }, menghadirkan privasi dan keteraturan blok hunian di ${city}.`,
      'CLUSTER'
    );
  }
  for (const fac of allFacilities.filter((f) => INFRA_REGEX.test(f))) {
    push(
      1,
      'Infrastruktur Kawasan',
      `Infrastruktur ${fac} di ${project}`,
      `${project} dilengkapi ${fac} sebagai standar tata lingkungan kawasan yang rapi dan fungsional bagi seluruh penghuni di ${city}.`,
      'FACILITY'
    );
  }

  // BAB III: PILIHAN TIPE HUNIAN & SPESIFIKASI (dari tabel unit Step 4 + brosur OCR)
  for (const u of units) {
    const priceText = formatRupiahShort(u.keras);
    push(
      2,
      'Tipe Hunian',
      `Tipe ${u.unit} (${u.tipe}) · LB ${u.lb} m² / LT ${u.lt} m²`,
      `Hunian tipe ${u.unit} di ${u.tipe}, ${project} menyediakan luas bangunan ${u.lb} m² di atas lahan ${u.lt} m² dengan harga resmi ${priceText} sesuai pricelist terverifikasi ${dev}.`,
      'UNIT_OCR'
    );
    if (u.kpr) {
      push(
        2,
        'Pembiayaan Unit',
        `Opsi Skema Pembiayaan KPR untuk Tipe ${u.unit}`,
        `Untuk tipe ${u.unit} (${u.tipe}), calon pembeli dapat memanfaatkan fasilitas pembiayaan KPR (estimasi dasar ${formatRupiahShort(
          u.kpr
        )}) selain pembelian tunai sesuai ketentuan bank rekanan.`,
        'UNIT_OCR'
      );
    }
  }

  // BAB IV: FASILITAS KAWASAN & GAYA HIDUP
  for (const fac of allFacilities.filter((f) => !INFRA_REGEX.test(f) && !MANAGEMENT_REGEX.test(f))) {
    push(
      3,
      'Fasilitas Kawasan',
      `Fasilitas ${fac} di Dalam Kawasan ${project}`,
      `Penghuni ${project} dapat menikmati ${fac} langsung di lingkungan kawasan tanpa harus menempuh perjalanan jauh keluar area ${city}.`,
      'FACILITY'
    );
  }

  // BAB V: TRANSPARANSI HARGA, SKEMA BAYAR & LEGALITAS (dari OCR pricelist)
  const pricedUnits = units.filter((u) => u.keras && u.keras > 0).sort((a, b) => (a.keras || 0) - (b.keras || 0));
  if (pricedUnits.length >= 2) {
    const minU = pricedUnits[0];
    const maxU = pricedUnits[pricedUnits.length - 1];
    push(
      4,
      'Rentang Pilihan Harga',
      `Pilihan Segmen Harga Mulai ${formatRupiahShort(minU.keras)} hingga ${formatRupiahShort(maxU.keras)}`,
      `${project} menyediakan variasi tipe dari ${minU.unit} (${formatRupiahShort(minU.keras)}) hingga ${maxU.unit} (${formatRupiahShort(
        maxU.keras
      )}), memberi keleluasaan bagi keluarga memilih hunian sesuai rencana anggaran.`,
      'OCR_PRICELIST'
    );
  }
  if (/ppn|imb|ajb|shgb|shm/i.test(ocrText)) {
    push(
      4,
      'Legalitas & Pajak',
      `Kejelasan Komponen PPN, IMB, dan AJB/SHGB pada Pricelist ${dev}`,
      `Pricelist resmi ${dev} merinci komponen legalitas dan pajak yang sudah termasuk (seperti PPN, IMB, biaya AJB/BN SHGB) secara terbuka sejak tahap penawaran awal.`,
      'OCR_PRICELIST'
    );
  }
  if (/bphtb|kpr/i.test(ocrText)) {
    push(
      4,
      'Transparansi Biaya Tambahan',
      `Informasi Terbuka Terkait BPHTB & Biaya Proses KPR`,
      `Seluruh komponen biaya di luar harga jual seperti BPHTB dan biaya administrasi KPR dijelaskan sejak awal pada dokumen resmi ${dev} agar pembeli dapat menyusun anggaran dengan akurat.`,
      'OCR_PRICELIST'
    );
  }
  if (/1300\s*va|2200\s*va|listrik/i.test(ocrText)) {
    push(
      4,
      'Utilitas Listrik',
      `Standar Daya Listrik Terukur per Cluster di ${project}`,
      `Kapasitas daya listrik tiap cluster (seperti 1300 VA hingga 2200 VA sesuai kategori tipe pada pricelist resmi) telah ditetapkan sejak awal untuk kenyamanan instalasi rumah tangga.`,
      'OCR_PRICELIST'
    );
  }

  // BAB VI: PENGELOLAAN KAWASAN & KEAMANAN
  for (const fac of allFacilities.filter((f) => MANAGEMENT_REGEX.test(f))) {
    push(
      5,
      'Keamanan & Pengelolaan',
      `Sistem ${fac} Terkelola di ${project}`,
      `${dev} menghadirkan ${fac} untuk menjaga ketenangan, ketertiban, dan kualitas lingkungan hunian ${project} di ${city} secara berkelanjutan.`,
      'FACILITY'
    );
  }
  push(
    5,
    'Reputasi Pengembang',
    `Dikembangkan Langsung oleh ${dev}`,
    `Pengembangan ${project} ditangani langsung oleh ${dev} dengan standar dokumentasi pricelist, legalitas, dan informasi unit yang terverifikasi.`,
    'IDENTITY'
  );

  return points.map((p, idx) => ({ ...p, number: idx + 1 }));
}

async function enrichNarrativesWithAi(
  points: GroundedLoveLetterPoint[],
  input: GenerateLoveLetterInput
): Promise<{ points: GroundedLoveLetterPoint[]; enriched: boolean }> {
  const apiKey = process.env.AI_ROUTER_API_KEY;
  if (!apiKey || input.useAiEditorial === false || points.length === 0) {
    return { points, enriched: false };
  }
  const apiUrl = (process.env.AI_ROUTER_URL || 'https://9router.giivepro.com/v1').replace(/\/$/, '');
  const model = process.env.AI_ROUTER_MODEL || 'andararejomakmurjosjis';

  // Perkaya batch pertama (maks 25 poin terpenting) agar cepat (<10 detik) dan tetap editorial
  const sample = points.slice(0, 25);
  const prompt = `Tugas: Perhalus gaya bahasa editorial (hangat, elegan, faktual, kelas properti premium) untuk daftar poin keunggulan proyek "${input.projectName}" (${input.developerName}, ${input.city}).
Aturan keras:
1. JANGAN mengubah angka harga, luas LB/LT, jarak, atau nama tempat/cluster.
2. JANGAN menambahkan klaim spekulatif (dilarang "pasti untung", "pasti naik", "terbaik se-Indonesia").
3. JANGAN menyebut kota/proyek lain di luar "${input.city}" dan "${input.projectName}".
4. Balas HANYA JSON array [{"number":1,"title":"...","narrative":"..."}].

Input:
${JSON.stringify(sample.map((p) => ({ number: p.number, title: p.title, narrative: p.narrative })))}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.3, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    });
    if (!res.ok) return { points, enriched: false };
    const json = (await res.json()) as any;
    const raw = String(json?.choices?.[0]?.message?.content || '');
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return { points, enriched: false };
    const parsed = JSON.parse(match[0]) as Array<{ number: number; title?: string; narrative?: string }>;
    const byNum = new Map(parsed.map((x) => [Number(x.number), x]));
    const updated = points.map((p) => {
      const e = byNum.get(p.number);
      if (!e?.title || !e?.narrative) return p;
      return { ...p, title: String(e.title).trim(), narrative: String(e.narrative).trim() };
    });
    const check = validateLoveLetter(updated);
    if (!check.isValid) return { points, enriched: false };
    return { points: updated, enriched: true };
  } catch {
    return { points, enriched: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function generateGroundedLoveLetter(
  input: GenerateLoveLetterInput
): Promise<LoveLetterGenerationResult> {
  let pois: RealPoiItem[] = Array.isArray(input.nearbyPois) ? input.nearbyPois : [];
  if (pois.length === 0 && !input.skipExternalLookup) {
    const firstValid = (input.clusters || []).find(
      (c) => Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng)) && c.lat.trim() !== '' && c.lng.trim() !== ''
    );
    if (firstValid) {
      pois = await fetchNearbyPoisFromOsm(Number(firstValid.lat), Number(firstValid.lng));
    }
  }

  const rawPoints = buildGroundedLoveLetterPoints(input, pois);
  const { points, enriched } = await enrichNarrativesWithAi(rawPoints, input);
  const validation = validateLoveLetter(points);

  const gapRecommendations: string[] = [];
  if (points.length < 99) {
    if (pois.length < 6) {
      gapRecommendations.push('Pastikan koordinat GPS presisi (Step 3) agar lookup POI fasilitas umum sekitar proyek lebih lengkap.');
    }
    if ((input.verifiedUnits || []).length < 5) {
      gapRecommendations.push('Unggah pricelist lengkap (Step 2) agar setiap tipe unit & skema bayar menjadi poin tersendiri.');
    }
    if (!input.extractedText || input.extractedText.length < 300) {
      gapRecommendations.push('Unggah brosur spesifikasi material bangunan (atap, lantai, sanitair, jalan ROW) untuk memperkaya Bab III.');
    }
    if (parseIndividualFacilities(input.facilities || '').length < 10) {
      gapRecommendations.push('Tambahkan rincian fasilitas kawasan & layanan estate management pada kolom Fasilitas (Step 2).');
    }
  }

  return {
    points,
    validation,
    poisUsed: pois,
    gapRecommendations,
    aiEnriched: enriched,
  };
}
