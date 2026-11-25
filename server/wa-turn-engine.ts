// =====================================================================
// WA TURN ENGINE - kapan diam, singkat, menjawab, menjelaskan, bertanya balik, atau menyerahkan ke SE.
// 1. Pembaca (LLM) hanya MEMBACA maksud pesan & persona dari beberapa giliran terakhir.
// 2. Kode memetakan maksud -> mode (konsisten, bisa diuji).
// 3. Penulis (LLM) menulis sesuai mode + Playbook v1.2.
// 4. Pemeriksa (kode) menolak klaim terlarang, harga karangan, terlalu panjang, atau mengulang.
// =====================================================================

import {
  PLAYBOOK_AI_KNOWLEDGE_CONTEXT,
  PLAYBOOK_BUYER_PERSONAS,
  PLAYBOOK_UNIT_CATALOG,
  type PersonaCode,
} from '../src/lib/kb/playbook-v1-2-knowledge';

export interface ChatTurn {
  from: 'customer' | 'sales';
  text: string;
  at: string;
}

export type ReplyMode = 'DIAM' | 'SINGKAT' | 'JAWAB' | 'JELASKAN' | 'TANYA_BALIK' | 'SERAHKAN';

/** Maksud pesan terakhir customer -> mode balasan. Ubah kebijakan cukup di sini. */
export const INTENT_MODE = {
  SAPAAN: 'JAWAB',
  TANYA_SPESIFIK: 'JAWAB',
  TANYA_LUAS: 'JELASKAN',
  TERIMA_TAWARAN: 'JELASKAN',
  MENJAWAB_SALES: 'JAWAB',
  KEBERATAN: 'JELASKAN',
  CEMAS: 'JELASKAN',
  JADWAL: 'SINGKAT',
  TUNDA_DISKUSI: 'SINGKAT',
  APRESIASI: 'SINGKAT',
  TOLAK: 'SINGKAT',
  SALAH_SASARAN: 'SINGKAT',
  PENUTUP: 'DIAM',
  OPT_OUT: 'DIAM',
  NEGO: 'SERAHKAN',
  KOMPLAIN: 'SERAHKAN',
  TRANSAKSI: 'SERAHKAN',
  AGEN: 'SERAHKAN',
  TIDAK_JELAS: 'TANYA_BALIK',
} as const satisfies Record<string, ReplyMode>;
export type Intent = keyof typeof INTENT_MODE;

export interface TurnContext {
  turns: ChatTurn[];
  salutation: string;
  seName: string;
  stage: string;
  persona: PersonaCode;
  unitInterest: string;
  paymentScheme: string;
  isSuppressed?: boolean;
  now?: Date;
}

export interface TurnReading {
  intent: Intent;
  confidence: number;
  /** Tawaran/pertanyaan sales yang sedang dijawab customer, kosong bila tidak ada. */
  pending: string;
  ask: string;
  explained: string[];
  persona: PersonaCode;
  personaSignals: string[];
}

export interface TurnReply {
  kind: 'BALAS' | 'FOLLOW_UP';
  mode: ReplyMode;
  reason: string;
  draft: string;
  persona: PersonaCode | null;
  reading: TurnReading | null;
  issues: string[];
}

const ROUTER_URL = (process.env.AI_ROUTER_URL || 'https://9router.giivepro.com/v1').replace(/\/+$/, '');
const ROUTER_KEY = process.env.AI_ROUTER_API_KEY || '';
const ROUTER_MODEL = process.env.AI_ROUTER_MODEL || 'andararejomakmurjosjis';
const READER_MODELS = [process.env.WA_READER_MODEL || 'cbai/glm-5.2', 'cbai/glm-5.3-flash', ROUTER_MODEL];
const WRITER_MODELS = [process.env.WA_WRITER_MODEL || 'cbai/glm-5.2', 'cbai/glm-5.3-flash', ROUTER_MODEL];

async function askJson(models: string[], content: string, temperature: number): Promise<Record<string, any>> {
  const errors: string[] = [];
  for (const model of models) {
    try {
      const res = await fetch(`${ROUTER_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ROUTER_KEY}` },
        body: JSON.stringify({ model, stream: false, temperature, tools: [], tool_choice: 'none', messages: [{ role: 'user', content }] }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`${model} (${res.status})`);
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const match = (json.choices?.[0]?.message?.content || '').match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`${model} tanpa JSON`);
      return JSON.parse(match[0]);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  throw new Error(`LLM WA gagal: ${errors.join('; ')}`);
}

const transcript = (turns: ChatTurn[]) => turns.map((t) => `${t.from === 'sales' ? 'SALES' : 'CUSTOMER'}: ${t.text.replace(/\s+/g, ' ').slice(0, 500)}`).join('\n');

/** Pesan customer berturut-turut setelah pesan sales terakhir (satu "giliran" bisa beberapa bubble). */
export function currentCustomerBurst(turns: ChatTurn[]): ChatTurn[] {
  const burst: ChatTurn[] = [];
  for (let i = turns.length - 1; i >= 0 && turns[i].from === 'customer'; i--) burst.unshift(turns[i]);
  return burst;
}

const onlyEmoji = (t: string) => t.trim().length > 0 && !/[\p{L}\p{N}]/u.test(t);

const readerPrompt = (ctx: TurnContext) => `Kamu analis percakapan WhatsApp sales rumah. Tugasmu HANYA membaca maksud giliran terakhir CUSTOMER dalam konteks pesan SALES sebelumnya. Jangan menulis balasan.

PERCAKAPAN (lama ke baru):
${transcript(ctx.turns)}

TAHAP: ${ctx.stage}

PILIH SATU intent:
- SAPAAN: hanya menyapa / minta info umum tanpa arah.
- TANYA_SPESIFIK: satu pertanyaan yang jawabannya pendek (harga, lokasi, jam, luas, masih ada?). Tetap TANYA_SPESIFIK walau tanpa tanda tanya.
- TANYA_LUAS: minta penjelasan, perbandingan, simulasi, rincian, atau beberapa pertanyaan sekaligus.
- TERIMA_TAWARAN: menyetujui tawaran SALES untuk dijelaskan/dikirimi sesuatu ("iya boleh", "mau", "silakan", emoji setuju) padahal belum diberikan.
- MENJAWAB_SALES: menjawab pertanyaan SALES tentang kebutuhan, dana, keluarga, waktu ("KPR aja", "buat anak saya").
- KEBERATAN: mahal, jauh, kecil, inden, bandingkan proyek lain, tunggu harga turun, pajak banyak.
- CEMAS: takut KPR ditolak, takut penipuan, ragu developer, cemas keamanan, tangga untuk orang tua, IPL/biaya tersembunyi.
- JADWAL: memilih/mengubah/membatalkan jadwal survei, telepon, atau video call.
- TUNDA_DISKUSI: mau pikir-pikir, diskusi dengan pasangan/keluarga, nanti dikabari.
- APRESIASI: terima kasih/pujian yang wajar dibalas singkat.
- PENUTUP: percakapan sudah selesai, balasan tidak menambah apa pun ("siap", "ok", "oke sampai ketemu", emoji) dan SALES tidak sedang menunggu jawaban.
- TOLAK: sudah beli di tempat lain / tidak jadi / tidak berminat, dengan sopan.
- OPT_OUT: minta tidak dihubungi lagi.
- SALAH_SASARAN: mencari kontrakan, rumah subsidi, atau produk yang tidak dijual.
- NEGO: minta diskon, potongan, hadiah, termin khusus, tahan unit tanpa booking.
- KOMPLAIN: marah, kecewa, merasa tidak dilayani.
- TRANSAKSI: kirim bukti transfer, minta nomor rekening, siap booking sekarang, urusan refund/kontrak/sertifikat yang butuh keputusan resmi.
- AGEN: agen/broker/pesaing.
- TIDAK_JELAS: tidak bisa dipastikan walau dengan konteks.

Aturan penting:
- "iya/boleh/mau/oke/👍" setelah SALES MENAWARKAN penjelasan/kiriman = TERIMA_TAWARAN. Setelah SALES bertanya kebutuhan/pilihan = MENJAWAB_SALES. Setelah SALES mengonfirmasi jadwal atau menutup obrolan = PENUTUP.
- Bila ada pertanyaan DAN basa-basi, yang menentukan adalah pertanyaannya. Bila ada permintaan diskon/transfer/komplain, itu yang menentukan.
- Beberapa bubble CUSTOMER terakhir dibaca sebagai satu giliran.
- persona: P1 keluarga muda (cicilan, DP, anak, kontrak), P2 pengusaha (cash, toko, legalitas, garasi 2), P3 nakes/akademisi (shift, RS, kampus, gelar), P4 perantau (luar kota/negeri, video call, takut tipu), P5 pra-pensiun (tangga, IPL, rumah lama, cucu), P6 ortu untuk anak/investor (untuk anak, disewakan). Pilih hanya dari yang CUSTOMER sendiri katakan; tanpa bukti isi "LAINNYA". personaSignals = kutipan pendek bukti dari CUSTOMER.

Balas HANYA JSON: {"intent":"","confidence":0.0,"pending":"tawaran/pertanyaan SALES yang sedang dijawab atau kosong","ask":"inti yang diminta CUSTOMER, maks 15 kata","explained":["topik yang SUDAH dijelaskan SALES"],"persona":"P1|P2|P3|P4|P5|P6|LAINNYA","personaSignals":["kutipan"]}`;

export async function readTurn(ctx: TurnContext): Promise<TurnReading> {
  const raw = await askJson(READER_MODELS, readerPrompt(ctx), 0);
  const intent = String(raw.intent || '').toUpperCase() as Intent;
  const persona = String(raw.persona || '').toUpperCase() as PersonaCode;
  const customerText = ctx.turns.filter((t) => t.from === 'customer').map((t) => t.text.toLowerCase()).join(' ');
  return {
    intent: intent in INTENT_MODE ? intent : 'TIDAK_JELAS',
    confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)),
    pending: String(raw.pending || '').slice(0, 160),
    ask: String(raw.ask || '').slice(0, 160),
    explained: (Array.isArray(raw.explained) ? raw.explained : []).map((x) => String(x).slice(0, 60)).slice(0, 8),
    persona: persona in PLAYBOOK_BUYER_PERSONAS ? persona : 'LAINNYA',
    // Bukti harus benar-benar ucapan customer (bukan karangan model).
    personaSignals: [...new Set<string>((Array.isArray(raw.personaSignals) ? raw.personaSignals : []).map((x) => String(x).toLowerCase().trim()))].filter(
      (x) => x.length >= 3 && x.split(/\s+/).some((w) => w.length >= 3 && customerText.includes(w))
    ),
  };
}

/** Batas waktu menulis ulang; Playbook meminta balasan <= 5 menit, draf ditargetkan jauh lebih cepat. */
const WRITE_BUDGET_MS = 20_000;
const MIN_CONFIDENCE = 0.5;
const MIN_PERSONA_SIGNALS = 2;

export function decideMode(r: TurnReading, turns: ChatTurn[]): { mode: ReplyMode; reason: string } {
  if (r.confidence < MIN_CONFIDENCE) return { mode: 'TANYA_BALIK', reason: 'Maksud pesan belum pasti, tanyakan satu hal dulu.' };
  // Ucapan terima kasih kedua berturut-turut tidak perlu dibalas lagi.
  const lastSales = [...turns].reverse().find((t) => t.from === 'sales');
  if (r.intent === 'APRESIASI' && lastSales && lastSales.text.length < 120 && /(terima kasih kembali|sama-sama|dengan senang hati)/i.test(lastSales.text))
    return { mode: 'DIAM', reason: 'Percakapan sudah saling menutup.' };
  const why: Record<Intent, string> = {
    SAPAAN: 'Baru menyapa: perkenalan singkat dan satu pertanyaan kebutuhan.',
    TANYA_SPESIFIK: 'Satu pertanyaan jelas: jawab intinya.',
    TANYA_LUAS: 'Meminta penjelasan/perbandingan: jelaskan yang diminta saja.',
    TERIMA_TAWARAN: 'Menerima tawaran sales: berikan yang ditawarkan.',
    MENJAWAB_SALES: 'Menjawab pertanyaan sales: tanggapi lalu lanjut satu langkah.',
    KEBERATAN: 'Ada keberatan: akui, jelaskan fakta yang relevan (Bab 10).',
    CEMAS: 'Ada kekhawatiran: tenangkan dengan fakta, tanpa janji.',
    JADWAL: 'Urusan jadwal: konfirmasi singkat.',
    TUNDA_DISKUSI: 'Sedang menimbang: hormati, jangan menekan.',
    APRESIASI: 'Ucapan terima kasih/pujian: balas hangat singkat.',
    TOLAK: 'Tidak jadi: tutup dengan sopan.',
    SALAH_SASARAN: 'Mencari produk lain: luruskan dengan sopan.',
    PENUTUP: 'Obrolan sudah selesai, balasan tidak menambah apa pun.',
    OPT_OUT: 'Meminta tidak dihubungi lagi (UU PDP).',
    NEGO: 'Permintaan di luar kewenangan AI: SE ajukan ke SM (§7.8).',
    KOMPLAIN: 'Keluhan: SE perlu menangani langsung.',
    TRANSAKSI: 'Menyangkut pembayaran/dokumen resmi: SE menangani langsung.',
    AGEN: 'Kemungkinan agen/pesaing: SE yang memutuskan.',
    TIDAK_JELAS: 'Maksud belum jelas: tanyakan satu hal.',
  };
  return { mode: INTENT_MODE[r.intent], reason: why[r.intent] };
}

// --------------------------------------------------------------------- penulis

/** Batas karakter per mode; P2/P3 lebih ringkas, P4/P5 boleh lebih menenangkan. */
export function maxChars(mode: ReplyMode, persona: PersonaCode): number {
  const base: Record<ReplyMode, number> = { DIAM: 0, SINGKAT: 200, TANYA_BALIK: 220, SERAHKAN: 240, JAWAB: 380, JELASKAN: 600 };
  if (mode !== 'JELASKAN') return base[mode];
  return persona === 'P2' || persona === 'P3' ? 480 : persona === 'P4' || persona === 'P5' ? 700 : base.JELASKAN;
}

const MODE_RULE: Record<Exclude<ReplyMode, 'DIAM'>, string> = {
  SINGKAT: '1-2 kalimat pendek seperti chat biasa. Tanpa info produk, tanpa bullet. Untuk JADWAL: ulangi hari & jam. Untuk TOLAK: doakan/ucapkan terima kasih, jangan membujuk.',
  TANYA_BALIK: '1 kalimat tanggapan + 1 pertanyaan paling penting. Tanpa info produk.',
  SERAHKAN: '1-2 kalimat: tanggapi dengan tulus dan bilang dicek/diajukan dulu ke yang berwenang. JANGAN memberi keputusan, angka, diskon, janji, atau nomor rekening. Untuk KOMPLAIN: minta maaf dulu tanpa membela diri.',
  JAWAB: '1-3 kalimat. Jawab intinya di kalimat pertama. Tanpa bullet. Boleh 1 pertanyaan lanjutan.',
  JELASKAN: '2-3 paragraf pendek atau maks 3 bullet (•). Hanya yang diminta/ditawarkan/dikhawatirkan. Jangan mengulang topik yang sudah dijelaskan. Maks 2 pilihan unit.',
};

const PERSONA_RULE: Record<PersonaCode, string> = {
  P1: 'Keluarga muda: hangat, angka sederhana, libatkan pasangan. Takut KPR ditolak = jelaskan pra-cek dua bank.',
  P2: 'Pengusaha: langsung ke inti & angka, tanpa basa-basi, tanpa emoji. Legalitas & pilihan skema.',
  P3: 'Nakes/akademisi: rapi, hormati waktu, sekali kirim tuntas, jadwal fleksibel malam/akhir pekan.',
  P4: 'Perantau: menenangkan, tawarkan video call & keluarga yang dikuasakan, rekening perusahaan, progres bertanggal.',
  P5: 'Pra-pensiun: sabar dan halus, tidak mendesak, libatkan anak, jelaskan biaya & kamar lantai 1.',
  P6: 'Orang tua/investor: objektif, fungsi & kualitas. DILARANG menjanjikan kenaikan harga atau hasil sewa.',
  LAINNYA: 'Persona belum diketahui: netral, sopan, ramah. Jangan menebak pekerjaan, keluarga, atau kemampuan finansial.',
};

/** Jawaban keberatan resmi Playbook Bab 10 (diringkas). */
const OBJECTIONS = `KEBERATAN RESMI (Bab 10), pakai yang relevan saja dan ubah jadi bahasa sendiri:
- Mahal/sama dengan Solo Baru: di sana banyak rumah second Rp700 juta-1,1 miliar; di sini bangunan baru, garasi dalam, one-gate RFID, clubhouse. Tawarkan perbandingan total.
- LT 63 kecil: LB 75 dua lantai memuat 3 kamar; LT lebih luas ada di Nagoya A, Osaka/Tokyo. Tanya butuh ruang dalam atau halaman.
- Inden: pembayaran ke rekening perusahaan, PPJB notaris, progres foto bertanggal tiap bulan.
- Tunggu harga turun: daftar harga per periode, Desember lebih tinggi dari November; harga November berlaku sampai 30 November; tidak bisa menjanjikan harga ke depan.
- Diskusi keluarga: hormati, ajak datang bersama.
- Takut KPR ditolak: bisa pra-cek ke dua bank; ketentuan booking bila KPR tidak disetujui ada di formulir pemesanan.
- Pajak banyak: ada PPN, BPHTB, notaris; tawarkan rincian tertulis.
- Jauh dari Solo: di pusat kota Sukoharjo dekat pemerintahan, sekolah, pasar, Gelora Merdeka; ajak coba rute.
- IPL/clubhouse: tanpa membership terpisah; IPL & layanan berbayar tertentu mengikuti pengelola; kirim rincian resmi.
- Developer aman?: rekening PT Andara Rejo Makmur, dokumen bisa ditinjau bersama notaris/PPAT, PPJB tertulis, DLP 100 hari.
- 2 lantai untuk orang tua: lantai 1 bisa difungsikan untuk kamar orang tua SESUAI DENAH (ada 1 kamar di lantai 1); penyesuaian dikonsultasikan sesuai ketentuan teknis.
- Bandingkan proyek lain: tawarkan tabel 6 kriteria, jangan menjelekkan pesaing.`;

function followUpPlan(ctx: TurnContext, days: number): { reason: string; goal: string } {
  const visited = ['VISITED', 'HOT_NEGOTIATION'].includes(ctx.stage.toUpperCase());
  if (days < 1) return { reason: 'Pesan terakhir dari sales masih hari ini (maks 1 pesan per hari).', goal: '' };
  if (days <= 2) return { reason: 'Hari 1', goal: visited ? 'Tanyakan tanggapan keluarga setelah kunjungan.' : 'Tanyakan apakah materi sudah diterima, tawarkan 2 pilihan jadwal.' };
  if (days <= 4) return { reason: 'Hari 3', goal: visited ? 'Beri satu info tambahan yang relevan (spesifikasi/legal/progres).' : 'Beri satu info yang relevan dengan kebutuhannya, undang melihat.' };
  if (days <= 6) return { reason: 'Hari 5', goal: visited ? 'Undang kunjungan ulang bersama pasangan/orang tua.' : 'Minta izin menelepon 2 menit.' };
  if (days <= 10) return { reason: 'Hari 7', goal: 'Sampaikan update resmi yang berlaku secara ringan, tanpa menekan.' };
  if (days <= 25) return { reason: 'Hari 14', goal: 'Tanyakan keputusan dengan sopan, beri jalan keluar yang nyaman.' };
  return { reason: 'Hari 30+', goal: 'Sapa ringan, kabar perkembangan, tanpa menagih keputusan.' };
}

/** Unit dari CRM sering nilai bawaan; hanya dipakai bila memang muncul di percakapan. */
function mentionedUnit(ctx: TurnContext): string {
  const code = (ctx.unitInterest.match(/[AB]\.0\d/) || [])[0];
  const text = ctx.turns.map((t) => t.text).join(' ');
  return code && text.includes(code) ? ctx.unitInterest : '';
}

function writerPrompt(ctx: TurnContext, mode: Exclude<ReplyMode, 'DIAM'>, persona: PersonaCode, reading: TurnReading | null, goal: string): string {
  const limit = maxChars(mode, persona);
  const first = !ctx.turns.some((t) => t.from === 'sales');
  const today = (ctx.now || new Date()).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return `Kamu ${ctx.seName}, sales The Park Townhouse Sukoharjo, sedang mengetik balasan WhatsApp. Tulis seperti manusia: natural, sopan, tidak seperti brosur atau robot.

PERCAKAPAN (lama ke baru):
${transcript(ctx.turns)}

HARI INI: ${today}, pukul ${(ctx.now || new Date()).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB. TAHAP: ${ctx.stage}. UNIT YANG SUDAH DIBAHAS: ${mentionedUnit(ctx) || 'belum ada (jangan menyebut unit seolah customer sudah melihat/meminatinya)'}.
${reading ? `YANG DIMINTA CUSTOMER: ${reading.ask || '-'}\nSEDANG MENJAWAB: ${reading.pending || '-'}\nSUDAH PERNAH DIJELASKAN (jangan diulang): ${reading.explained.join('; ') || '-'}` : `TUJUAN FOLLOW-UP (customer belum membalas): ${goal}`}

MODE: ${mode}. ${MODE_RULE[mode]}
${reading ? '' : 'Follow-up: 1-2 kalimat ringan, tanpa perkenalan ulang, tanpa menyebut fakta/harga baru, tanpa ajakan kunjungan bila TUJUAN tidak memintanya.\n'}BATAS: maksimal ${limit} karakter, maksimal SATU tanda tanya, maksimal satu ajakan.
PERSONA: ${PERSONA_RULE[persona]}
SAPAAN: "${ctx.salutation}" maksimal sekali. ${first ? `Ini balasan pertama: sebut nama ${ctx.seName} singkat.` : 'JANGAN perkenalan ulang, jangan "terima kasih sudah menghubungi".'}
Jangan menulis "wkwk/haha". Maksimal 1 emoji, boleh tanpa emoji.
Bila customer menerima tawaran, LANGSUNG berikan isinya di pesan ini, jangan menawarkan lagi.
HANYA sampaikan fakta yang ada di pengetahuan di bawah. DILARANG mengarang suasana (ramai, terang, sepi), cara kerja bank, perkiraan selisih, layanan (antar jemput, gratis), atau kondisi unit. Bila tidak ada, katakan akan dicek. Angka HANYA dari pengetahuan ini atau dari ucapan customer. Ditanya hasil sewa/kenaikan harga: jelaskan dengan sopan bahwa tidak bisa memberi proyeksi, lalu kembali ke fungsi rumah.
Soal KPR/kelayakan: jangan menyimpulkan customer lolos atau peluangnya besar; sebut syarat resmi dan tawarkan pra-cek. Soal booking/refund: arahkan ke ketentuan di formulir pemesanan. Jangan mengangkat kekhawatiran yang tidak disebut customer.
Jangan menyalin gaya brosur; pilih 1-2 fakta yang paling menjawab, bukan semuanya. Jangan memakai kata 'kemarin' kecuali benar kemarin.
Jadwal kunjungan: tawarkan dua pilihan hanya bila memang perlu. Jangan memakai urgensi stok ("tinggal sekian").

${mode === 'JELASKAN' || mode === 'JAWAB' || !reading ? `${PLAYBOOK_AI_KNOWLEDGE_CONTEXT}\n\n${OBJECTIONS}` : ''}

Balas HANYA JSON: {"pesan":""}`;
}

// --------------------------------------------------------------------- pemeriksa

const FORBIDDEN = /pasti (naik|untung|disetujui|lolos|laku)|dijamin|bebas banjir|tinggal \d+ unit|sisa \d+ unit|(?<!(?:bukan|tidak|jangan|hindari)(?:\s+\S+){0,3}\s+)rekening pribadi|jemput|penyewa|disewakan|aset jangka|passive income|balik modal|capital gain|return sewa/i;

/** Pernyataan berisiko hukum/kredit yang hanya boleh disampaikan SE dari dokumen resmi. */
const RISKY =
  /(booking|uang|dana|dp)[^.?!]{0,40}(dikembalikan|kembali|refund)|peluang[^.?!]{0,25}(approval|disetujui|lolos|besar)|(sudah|masih) (masuk|memenuhi) (kriteria|kategori|syarat)|(tidak|nggak|gak|ga) perlu (khawatir|takut|cemas)|selisihnya[^.?!]{0,25}(jauh|dekat|beda|sama)|approval|(pas|cocok) (sekali|banget)|jadi aman|dijamin aman|bi checking[^.?!]{0,30}(aman|bisa)|lebih (murah|untung) dari/i;

/** Nilai rupiah (juta) yang disebut dalam teks. */
export function moneyInMillions(text: string): number[] {
  const out: number[] = [];
  const num = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));
  const re = /(\d+(?:[.,]\d+)*)(?:\s*(?:-|–|sampai|s\.?d\.?|hingga)\s*(?:Rp\s*)?(\d+(?:[.,]\d+)*))?\s*(juta|jt|miliar|milyar|M)\b/gi;
  for (const m of text.matchAll(re)) {
    const unit = /^m/i.test(m[3]) ? 1000 : 1;
    for (const g of [m[1], m[2]]) if (g) out.push(Math.round(num(g) * unit * 1000) / 1000);
  }
  for (const m of text.matchAll(/Rp\s?(\d{1,3}(?:\.\d{3}){2,})/g)) out.push(Number(m[1].replace(/\./g, '')) / 1_000_000);
  return out;
}

const OFFICIAL_MONEY = new Set<number>([
  ...moneyInMillions(PLAYBOOK_AI_KNOWLEDGE_CONTEXT),
  ...PLAYBOOK_UNIT_CATALOG.flatMap((u) => [u.priceCashIdr / 1e6, u.priceKprIdr / 1e6]),
  5, 15, 18, 5.1, 5.9, 700, 1100, 699,
]);
// Daftar harga di konteks memakai bentuk "(775 jt)" dan "Rp700-899 jt"; DP 10% & selisihnya dihitung dari harga resmi.
for (const u of PLAYBOOK_UNIT_CATALOG) {
  OFFICIAL_MONEY.add(Math.round(u.priceKprIdr / 1e5) / 100);
  OFFICIAL_MONEY.add(Math.round(u.priceKprIdr / 1e7) / 10);
  OFFICIAL_MONEY.add(u.priceKprIdr / 1e7);
}

const wordsOf = (t: string) => new Set(t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 3));
export function similarity(a: string, b: string): number {
  const x = wordsOf(a);
  const y = wordsOf(b);
  if (x.size === 0 || y.size === 0) return 0;
  const inter = [...x].filter((w) => y.has(w)).length;
  return inter / (x.size + y.size - inter);
}

export function checkDraft(draft: string, mode: ReplyMode, persona: PersonaCode, ctx: TurnContext): string[] {
  const issues: string[] = [];
  const limit = maxChars(mode, persona);
  if (!draft.trim()) return ['pesan kosong'];
  if (draft.length > limit * 1.1) issues.push(`terlalu panjang (${draft.length}/${limit})`);
  if ((draft.match(/\?/g) || []).length > 1) issues.push('lebih dari satu pertanyaan');
  if (FORBIDDEN.test(draft)) issues.push('klaim terlarang (§7.11)');
  const risky = draft.match(RISKY);
  if (risky) issues.push(`pernyataan berisiko "${risky[0]}", jangan dijanjikan/disimpulkan`);
  if (/^(mbak|bu|ibu)\b/i.test(ctx.salutation) && /\b(Mas|Pak|Bapak)(?=[?.!,]|$)/.test(draft)) issues.push('sapaan tidak konsisten');
  if (/^(mas|pak|bapak)\b/i.test(ctx.salutation) && !/bapak\/ibu/i.test(ctx.salutation) && /\b(Mbak|Bu|Ibu)(?=[?.!,]|$)/.test(draft)) issues.push('sapaan tidak konsisten');
  const said1 = ctx.turns.filter((t) => t.from === 'customer').map((t) => t.text).join(' ');
  if (/ditolak|tidak disetujui/i.test(draft) && !/tolak|setuju|lolos|checking|slik|takut|batal|gagal/i.test(said1)) issues.push('mengangkat kekhawatiran KPR yang tidak disebut customer');
  if (mode === 'SERAHKAN' && /\b(besok|hari ini|nanti (siang|sore|malam)|lusa|minggu ini|secepatnya hari)\b/i.test(draft)) issues.push('jangan menjanjikan waktu');
  const hour = Number((ctx.now || new Date()).toLocaleString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }));
  const greet = draft.match(/selamat (pagi|siang|sore|malam)/i)?.[1].toLowerCase();
  const fits = { pagi: hour >= 4 && hour < 11, siang: hour >= 10 && hour < 15, sore: hour >= 14 && hour < 19, malam: hour >= 18 || hour < 4 } as Record<string, boolean>;
  if (greet && !fits[greet]) issues.push(`salam "${greet}" tidak sesuai jam`);
  if (/\b\d{9,}\b/.test(draft.replace(/[.\s-]/g, (c) => (c === ' ' ? ' ' : '')))) issues.push('memuat nomor panjang (rekening/telepon)');
  const bullets = (draft.match(/^\s*[•\-*]/gm) || []).length;
  if (mode !== 'JELASKAN' && bullets > 0) issues.push('tidak boleh memakai bullet');
  if (bullets > 3) issues.push('bullet lebih dari 3');
  const said = new Set([...moneyInMillions(ctx.turns.map((t) => t.text).join(' ')), ...OFFICIAL_MONEY]);
  const unknown = moneyInMillions(draft).filter((v) => ![...said].some((o) => Math.abs(o - v) <= Math.max(0.02, o * 0.002)));
  if (unknown.length) issues.push(`angka tidak resmi: ${unknown.join(', ')} juta`);
  if ((mode === 'SINGKAT' || mode === 'SERAHKAN' || mode === 'TANYA_BALIK') && moneyInMillions(draft).length) issues.push('mode ini tidak boleh menyebut harga');
  const prev = ctx.turns.filter((t) => t.from === 'sales').slice(-4);
  if (draft.length > 80 && prev.some((t) => similarity(t.text, draft) > 0.55)) issues.push('mengulang pesan sales sebelumnya');
  if (prev.length && /salam kenal|perkenalkan|terima kasih sudah menghubungi|saya \w+ dari The Park/i.test(draft)) issues.push('perkenalan ulang');
  if (/marketing gallery[^.?!]{0,40}tentara pelajar/i.test(draft)) issues.push('alamat Marketing Gallery salah (RT 1/RW 5, Kp. Duabelasan, Jombor)');
  if (/\b(kak|bunda|gan|sis|bosku)\b/i.test(draft)) issues.push('sapaan tidak sesuai');
  if (/wkwk|haha|hehe/i.test(draft)) issues.push('ekspresi tidak profesional');
  return issues;
}

/** Pemeriksa fakta: klaim tentang proyek/proses/layanan yang tidak punya dasar di pengetahuan atau percakapan. */
async function unsupportedClaims(draft: string, ctx: TurnContext): Promise<string[]> {
  const raw = await askJson(
    READER_MODELS,
    `Kamu auditor fakta yang sangat teliti. Pecah DRAF sales menjadi klaim-klaim faktual (proyek, harga, unit, fasilitas, suasana, bank/KPR, legal, refund, layanan, riwayat customer). Untuk TIAP klaim beri jenis: "FAKTA" = pernyataan tentang produk, harga, spesifikasi, fasilitas, suasana, jarak, bank, hukum, refund, atau kondisi/riwayat customer; "TINDAKAN" = apa yang akan/bisa/tidak bisa dilakukan sales, ajakan, saran berdiskusi, tawaran mengirim/menghitung/video call/mengajak keluarga, atau pernyataan bahwa sesuatu belum bisa dipastikan. Lalu salin kutipan PERSIS dari PENGETAHUAN atau PERCAKAPAN yang membuktikannya; bila tidak ada, isi "TIDAK ADA". Jangan memasukkan sapaan, empati, pertanyaan, atau ajakan (bertemu, menelepon, mengirim materi, membantu cek).

PENGETAHUAN:
${PLAYBOOK_AI_KNOWLEDGE_CONTEXT}
${OBJECTIONS}

NAMA CUSTOMER: ${ctx.salutation}. NAMA SALES: ${ctx.seName}.
PERCAKAPAN:
${transcript(ctx.turns)}

DRAF:
${draft}

Balas HANYA JSON {"claims":[{"klaim":"","jenis":"FAKTA|TINDAKAN","dasar":""}]}.`,
    0
  );
  if (!Array.isArray(raw.claims)) return ['auditor fakta tidak menjawab'];
  // Kutipan dasar dicocokkan ke sumber asli, jadi auditor tidak bisa mengarang dasar.
  const source = wordsOf(`${PLAYBOOK_AI_KNOWLEDGE_CONTEXT} ${OBJECTIONS} ${transcript(ctx.turns)}`);
  return (raw.claims as Array<{ klaim?: unknown; jenis?: unknown; dasar?: unknown }>)
    .filter((c) => {
      if (/tindakan/i.test(String(c?.jenis || ''))) return false;
      const quote = [...wordsOf(String(c?.dasar || ''))];
      return /tidak ada/i.test(String(c?.dasar || 'tidak ada')) || quote.length === 0 || quote.filter((w) => source.has(w)).length / quote.length < 0.75;
    })
    .map((c) => String(c?.klaim || '').slice(0, 120))
    .filter(Boolean);
}

/** Cadangan tanpa LLM: aman, pendek, tidak menyebut fakta produk. */
export function safeFallback(mode: ReplyMode, intent: Intent | null, ctx: TurnContext): string {
  const s = ctx.salutation;
  if (mode === 'DIAM') return '';
  if (intent === 'KOMPLAIN') return `Mohon maaf atas ketidaknyamanannya ${s}. Saya cek dulu dan segera saya kabari ya.`;
  if (mode === 'SERAHKAN') return `Baik ${s}, ini saya cek dan ajukan dulu supaya jawabannya pasti. Nanti saya kabari ya.`;
  if (intent === 'JADWAL') return `Siap ${s}, jadwalnya saya catat ya. Nanti saya konfirmasi lagi sebelum hari-H.`;
  if (intent === 'TUNDA_DISKUSI') return `Tentu ${s}, silakan didiskusikan dulu dengan tenang. Kalau ada yang mau ditanyakan, kabari saya ya.`;
  if (intent === 'TOLAK') return `Baik ${s}, terima kasih sudah mengabari. Semoga betah di rumah barunya ya.`;
  if (mode === 'SINGKAT') return `Siap ${s}, terima kasih. Kabari saya kalau ada yang ingin ditanyakan ya.`;
  if (intent === 'KEBERATAN' || intent === 'CEMAS')
    return `Saya paham ${s}, wajar kalau itu jadi pertimbangan. Saya siapkan penjelasan tertulisnya dulu supaya jelas dan akurat ya.`;
  if (intent === 'TERIMA_TAWARAN') return `Baik ${s}, saya siapkan dulu dan segera saya kirim ke sini ya.`;
  if (intent === 'SAPAAN') return `Halo ${s}, saya ${ctx.seName} dari The Park Townhouse Sukoharjo. Boleh tahu rumahnya nanti untuk ditempati sendiri atau keluarga?`;
  return `Baik ${s}, saya cek dulu supaya jawabannya tepat ya. Bagian mana yang paling ingin diketahui?`;
}

/** Titik masuk: menentukan balas/diam/follow-up dan menulis draf untuk SE. */
export async function composeTurnReply(ctx: TurnContext): Promise<TurnReply> {
  const now = ctx.now || new Date();
  const last = ctx.turns[ctx.turns.length - 1];
  const base = { persona: null, reading: null, issues: [] as string[] };
  if (ctx.isSuppressed) return { ...base, kind: 'BALAS', mode: 'DIAM', reason: 'Kontak meminta tidak dihubungi (UU PDP).', draft: '' };
  if (!last) throw new Error('riwayat percakapan kosong');

  let kind: TurnReply['kind'] = 'BALAS';
  let mode: ReplyMode;
  let reason: string;
  let goal = '';
  let reading: TurnReading | null = null;
  let persona: PersonaCode = ctx.persona;

  if (last.from === 'sales') {
    kind = 'FOLLOW_UP';
    const days = Math.floor((now.getTime() - new Date(last.at).getTime()) / 86_400_000);
    const plan = followUpPlan(ctx, days);
    reason = plan.goal ? `Follow-up ${plan.reason}: ${plan.goal}` : plan.reason;
    goal = plan.goal;
    mode = plan.goal ? 'JAWAB' : 'DIAM';
  } else {
    const burst = currentCustomerBurst(ctx.turns);
    const prevSales = [...ctx.turns].reverse().find((t) => t.from === 'sales');
    if (burst.every((t) => onlyEmoji(t.text)) && !(prevSales && prevSales.text.includes('?'))) {
      return { ...base, kind, mode: 'DIAM', reason: 'Hanya emoji dan tidak ada yang ditunggu.', draft: '' };
    }
    reading = await readTurn(ctx);
    ({ mode, reason } = decideMode(reading, ctx.turns));
    if (reading.persona !== 'LAINNYA' && reading.personaSignals.length >= MIN_PERSONA_SIGNALS) persona = reading.persona;
  }
  const confirmed = persona !== ctx.persona ? persona : null;
  if (mode === 'DIAM') return { kind, mode, reason, draft: '', persona: confirmed, reading, issues: [] };

  const prompt = writerPrompt(ctx, mode, persona, reading, goal);
  let draft = '';
  let issues: string[] = [];
  let feedback = '';
  const startedAt = Date.now();
  for (let i = 0; i < 3 && Date.now() - startedAt < WRITE_BUDGET_MS; i++) {
    const raw = await askJson(WRITER_MODELS, prompt + feedback, 0.5).catch(() => ({}) as Record<string, any>);
    draft = String(raw.pesan || '').trim();
    issues = checkDraft(draft, mode, persona, ctx);
    if (issues.length === 0 && (mode === 'JAWAB' || mode === 'JELASKAN')) {
      // Gagal-aman: bila auditor tidak menjawab, draf tidak dianggap bersih.
      const claims = await unsupportedClaims(draft, ctx).catch(() => ['auditor fakta tidak menjawab']);
      issues = claims.map((c) => `tanpa dasar: ${c}`);
    }
    if (issues.length === 0) break;
    feedback = `\n\nDITOLAK: ${issues.join('; ')}. Draf sebelumnya: "${draft}". Tulis ulang, patuhi semua batas.`;
  }
  if (issues.length)
    draft = reading
      ? safeFallback(mode, reading.intent, ctx)
      : `Halo ${ctx.salutation}, semoga sehat selalu. Kalau ada yang ingin ditanyakan soal rumahnya, kabari saya kapan saja ya.`;
  return { kind, mode, reason, draft, persona: confirmed, reading, issues };
}
