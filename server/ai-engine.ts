// ============================================================================
// SERVER-ONLY AI LEAD & FOLLOW-UP ENGINE (9ROUTER - ANDARAOS PATTERN)
// ============================================================================

import {
  PLAYBOOK_AI_KNOWLEDGE_CONTEXT,
  PLAYBOOK_BUYER_PERSONAS,
  evaluatePlaybookBant,
  type PersonaCode,
} from '../src/lib/kb/playbook-v1-2-knowledge';

export interface UnclearFieldFeedback {
  field: string;
  issue: string;
  example: string;
}

export interface LeadAiEvaluation {
  skor: number; // 0..100
  label: 'SANGAT_PROSPECTIF' | 'PROSPECTIF' | 'PERLU_PEMBINAAN' | 'PERLU_DILENGKAPI';
  clarity_status: 'JELAS' | 'PERLU_DILENGKAPI';
  unclear_parts: UnclearFieldFeedback[];
  ringkas: string;
  poin_kuat: string[];
  poin_lemah: string[];
  perlu_dicek_ulang: string[];
  rekomendasi: string[];
  recommended_persona: PersonaCode;
  recommended_bant: {
    b: number;
    a: number;
    n: number;
    t: number;
    total: number;
    grade: 'A' | 'B' | 'C' | 'D';
  };
  followup_draft_message: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface LeadAnalysisInput {
  fullName: string;
  phoneWa: string;
  domicile: string;
  source: string;
  contentCode?: string;
  stage: string;
  personaCode: PersonaCode;
  personaProfile?: Record<string, string>;
  unitInterest: string;
  paymentScheme: string;
  bantB: number;
  bantA: number;
  bantN: number;
  bantT: number;
  salesNotes: string;
  inboundMessages?: string[];
  seName: string;
}

const FORBIDDEN_CLAIMS = [
  'pasti naik harga',
  'pasti untung',
  'bebas banjir',
  'pasti disetujui kpr',
  'rekening pribadi',
];

function sanitizeFollowupDraft(draft: string, leadName: string, seName: string): string {
  let clean = draft.trim();
  for (const forbidden of FORBIDDEN_CLAIMS) {
    const regex = new RegExp(forbidden, 'gi');
    clean = clean.replace(regex, 'sesuai ketentuan resmi proyek');
  }
  if (!clean) {
    return `Halo Bapak/Ibu ${leadName}, terima kasih sudah menghubungi The Park Townhouse Sukoharjo. Saya ${seName}. Supaya saya kirimkan pilihan unit dan simulasi yang paling pas: rumahnya rencana untuk ditempati sendiri atau keluarga, butuh berapa kamar, dan rencananya cash, bertahap, atau KPR? Saya siap kirimkan denah dan daftar harga resmi yang berlaku hari ini.`;
  }
  return clean;
}

/**
 * Validasi deterministik awal untuk mendeteksi lead yang kurang jelas (Playbook Bab 5.1)
 */
export function detectUnclearLeadParts(input: LeadAnalysisInput): UnclearFieldFeedback[] {
  const issues: UnclearFieldFeedback[] = [];
  const nameTrimmed = (input.fullName || '').trim();
  const domTrimmed = (input.domicile || '').trim();
  const notesTrimmed = (input.salesNotes || '').trim();
  const inboundJoined = (input.inboundMessages || []).join(' ').trim();
  const combinedContext = `${notesTrimmed} ${inboundJoined}`.trim();

  if (
    nameTrimmed.length < 3 ||
    /^(tes|test|asdf|anonim|user|lead|abc|xxx|-)$/i.test(nameTrimmed)
  ) {
    issues.push({
      field: 'Nama Calon Pembeli',
      issue: 'Nama terlalu singkat atau tidak jelas (Playbook §5.1 mewajibkan minimal nama panggilan jelas).',
      example: 'Pak Andi Pratama / Ibu Rina Kusuma',
    });
  }

  if (domTrimmed.length < 3) {
    issues.push({
      field: 'Domisili (Kecamatan / Kota)',
      issue: 'Domisili belum diisi atau kurang spesifik (Playbook §5.1 mewajibkan domisili kecamatan/kota untuk pemetaan Ring 1/2/3).',
      example: 'Jombor, Bendosari, Sukoharjo / Solo Baru, Grogol / Perantau Jakarta',
    });
  }

  const wordCount = combinedContext.split(/\s+/).filter(Boolean).length;
  if (
    wordCount < 4 ||
    /^(info|info harga|cek|tes|test|halo|p|ping|asdf|berapa)$/i.test(combinedContext)
  ) {
    issues.push({
      field: 'Catatan Kebutuhan / Pesan Prospek',
      issue: 'Catatan kebutuhan & kemampuan bayar terlalu minim bagi AI untuk mengukur BANT secara akurat.',
      example:
        'Mencari rumah 3 kamar untuk keluarga muda (2 anak SD), anggaran sekitar Rp650-800 juta dengan KPR, penghasilan gabungan Rp18 juta/bln, rencana survei Sabtu pagi.',
    });
  }

  return issues;
}

function extractJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  const start = cleaned.indexOf('{');
  if (start < 0) throw new Error('AI tidak mengembalikan objek JSON.');

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return JSON.parse(cleaned.slice(start, i + 1)) as Record<string, unknown>;
      }
    }
  }
  throw new Error('JSON dari AI tidak lengkap.');
}

function toStringList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .slice(0, 6)
      .map((x) => String(x ?? '').trim())
      .filter(Boolean);
  }
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
}

export async function analyzeLeadWithAi(input: LeadAnalysisInput): Promise<LeadAiEvaluation> {
  const routerUrl = (process.env.AI_ROUTER_URL || 'https://9router.giivepro.com/v1').replace(/\/+$/, '');
  const apiKey = process.env.AI_ROUTER_API_KEY || '';
  const model = process.env.AI_ROUTER_MODEL || 'andararejomakmurjosjis';

  const deterministicIssues = detectUnclearLeadParts(input);
  const personaRef = PLAYBOOK_BUYER_PERSONAS[input.personaCode] || PLAYBOOK_BUYER_PERSONAS.P1;

  const systemPrompt = [
    'Kamu adalah Analis Senior Properti & Sales Coach AI untuk PT Andara Rejo Makmur (Proyek: The Park Townhouse Sukoharjo).',
    'Tugasmu menilai kelayakan lead Sales Executive (SE), memvalidasi kejelasan data input, menghitung skor BANT (0-3 per huruf, total 0-12), memilih Persona (P1-P6), dan menyusun pesan Follow-Up WhatsApp yang siap dikirim SE.',
    'WAJIB berpedoman 100% pada Sales Playbook v1.2 di bawah ini. Jangan pernah mengarang harga, stok, atau menjanjikan hal yang dilarang.',
    PLAYBOOK_AI_KNOWLEDGE_CONTEXT,
  ].join('\n\n');

  const userPrompt = [
    'Analisis data lead properti berikut (JSON):',
    JSON.stringify(
      {
        nama: input.fullName,
        nomor_wa: input.phoneWa,
        domisili: input.domicile,
        sumber: input.source,
        kode_konten: input.contentCode || '-',
        tahap_pipeline: input.stage,
        persona_dipilih: `${input.personaCode} - ${personaRef.archetype}`,
        detail_persona_input: input.personaProfile || {},
        unit_minat: input.unitInterest,
        skema_pembayaran: input.paymentScheme,
        skor_bant_saat_ini: {
          budget_0_3: input.bantB,
          authority_0_3: input.bantA,
          need_0_3: input.bantN,
          timeline_0_3: input.bantT,
        },
        catatan_sales: input.salesNotes,
        pesan_wa_masuk: input.inboundMessages || [],
        nama_se: input.seName,
        temuan_validasi_awal: deterministicIssues,
      },
      null,
      2
    ),
    '',
    'INSTRUKSI KHUSUS KEJELASAN DATA:',
    'Jika data lead tidak jelas, nama samar, domisili kosong, atau catatan kebutuhan/pesan terlalu singkat/tidak jelas, set "clarity_status": "PERLU_DILENGKAPI" dan isi "unclear_parts" dengan penjelasan bagian mana yang kurang jelas beserta contoh kalimat yang benar.',
    '',
    'Balas HANYA dalam format JSON persis seperti skema ini:',
    '{',
    '  "skor": <integer 0-100>,',
    '  "label": "<SANGAT_PROSPECTIF|PROSPECTIF|PERLU_PEMBINAAN|PERLU_DILENGKAPI>",',
    '  "clarity_status": "<JELAS|PERLU_DILENGKAPI>",',
    '  "unclear_parts": [',
    '    { "field": "<nama bagian>", "issue": "<alasan kurang jelas>", "example": "<contoh kalimat input yang benar>" }',
    '  ],',
    '  "ringkas": "<1-2 kalimat kesimpulan tajam mengenai kualitas lead & langkah kunci SE>",',
    '  "poin_kuat": ["<poin kuat 1>", "<poin kuat 2>"],',
    '  "poin_lemah": ["<poin lemah/risiko 1>"],',
    '  "perlu_dicek_ulang": ["<pertanyaan BANT natural dari Bab 5.3 yang belum terjawab>"],',
    '  "rekomendasi": ["<saran taktis closing & unit/skema dari Playbook>"],',
    '  "recommended_persona": "<P1|P2|P3|P4|P5|P6>",',
    '  "recommended_bant": { "b": <0-3>, "a": <0-3>, "n": <0-3>, "t": <0-3> },',
    '  "followup_draft_message": "<pesan WhatsApp natural, sopan, sesuai persona & fakta Playbook v1.2 untuk dikirim SE ke pembeli>"',
    '}',
  ].join('\n');

  if (apiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35000);
      try {
        const res = await fetch(`${routerUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 2048,
            temperature: 0.15,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const payload = (await res.json()) as Record<string, any>;
          const msgContent = String(payload?.choices?.[0]?.message?.content ?? '');
          const reasoning = String(payload?.choices?.[0]?.message?.reasoning_content ?? '');
          const rawText = msgContent.includes('{') ? msgContent : msgContent.trim() || reasoning;
          const parsed = extractJsonObject(rawText);

          const aiUnclear = Array.isArray(parsed.unclear_parts)
            ? (parsed.unclear_parts as Record<string, unknown>[])
                .map((u) => ({
                  field: String(u?.field ?? 'Data Lead'),
                  issue: String(u?.issue ?? 'Informasi belum spesifik'),
                  example: String(u?.example ?? 'Lengkapi detail kebutuhan, anggaran, dan rencana waktu beli.'),
                }))
                .filter((u) => u.issue)
            : [];

          const mergedUnclear =
            deterministicIssues.length > 0
              ? [
                  ...deterministicIssues,
                  ...aiUnclear.filter(
                    (au) => !deterministicIssues.some((du) => du.field.toLowerCase() === au.field.toLowerCase())
                  ),
                ]
              : aiUnclear;

          const isUnclear =
            mergedUnclear.length > 0 || String(parsed.clarity_status) === 'PERLU_DILENGKAPI';

          const recBantRaw = (parsed.recommended_bant || {}) as Record<string, unknown>;
          const bantEval = evaluatePlaybookBant(
            Number(recBantRaw.b ?? input.bantB),
            Number(recBantRaw.a ?? input.bantA),
            Number(recBantRaw.n ?? input.bantN),
            Number(recBantRaw.t ?? input.bantT)
          );

          const recPersonaRaw = String(parsed.recommended_persona || input.personaCode).toUpperCase();
          const recPersona: PersonaCode =
            recPersonaRaw in PLAYBOOK_BUYER_PERSONAS
              ? (recPersonaRaw as PersonaCode)
              : input.personaCode;

          const rawScore = Number(parsed.skor ?? Math.round((bantEval.total / 12) * 100));
          const finalScore = isUnclear ? Math.min(45, Math.max(15, rawScore)) : Math.max(0, Math.min(100, rawScore));

          return {
            skor: finalScore,
            label: isUnclear
              ? 'PERLU_DILENGKAPI'
              : finalScore >= 80
              ? 'SANGAT_PROSPECTIF'
              : finalScore >= 60
              ? 'PROSPECTIF'
              : 'PERLU_PEMBINAAN',
            clarity_status: isUnclear ? 'PERLU_DILENGKAPI' : 'JELAS',
            unclear_parts: mergedUnclear,
            ringkas: isUnclear
              ? `Lead yang dimasukkan kurang jelas (${mergedUnclear.map((u) => u.field).join(', ')}). Mohon lengkapi data sesuai contoh di bawah agar dapat dihitung sebagai Lead Valid.`
              : String(parsed.ringkas || `Prospek ${recPersona} dengan skor BANT ${bantEval.total}/12 (Grade ${bantEval.grade}).`),
            poin_kuat: toStringList(parsed.poin_kuat),
            poin_lemah: toStringList(parsed.poin_lemah),
            perlu_dicek_ulang: toStringList(parsed.perlu_dicek_ulang),
            rekomendasi: toStringList(parsed.rekomendasi),
            recommended_persona: recPersona,
            recommended_bant: {
              b: bantEval.b,
              a: bantEval.a,
              n: bantEval.n,
              t: bantEval.t,
              total: bantEval.total,
              grade: bantEval.grade,
            },
            followup_draft_message: sanitizeFollowupDraft(
              String(parsed.followup_draft_message || ''),
              input.fullName,
              input.seName
            ),
            model: String(payload?.model ?? model),
            prompt_tokens: Number(payload?.usage?.prompt_tokens ?? 0),
            completion_tokens: Number(payload?.usage?.completion_tokens ?? 0),
          };
        }
      } finally {
        clearTimeout(timer);
      }
    } catch {
      /* fallback ke evaluator berbasis aturan Playbook v1.2 jika jaringan AI timeout */
    }
  }

  // Fallback Evaluator Deterministik Berbasis Playbook v1.2 (tetap patuh 100% pada rubrik PDF)
  const bantEval = evaluatePlaybookBant(input.bantB, input.bantA, input.bantN, input.bantT);
  const isUnclear = deterministicIssues.length > 0;
  const fallbackScore = isUnclear
    ? 30
    : Math.min(100, Math.round((bantEval.total / 12) * 85) + (input.domicile ? 10 : 0) + 5);

  return {
    skor: fallbackScore,
    label: isUnclear
      ? 'PERLU_DILENGKAPI'
      : bantEval.grade === 'A'
      ? 'SANGAT_PROSPECTIF'
      : bantEval.grade === 'B'
      ? 'PROSPECTIF'
      : 'PERLU_PEMBINAAN',
    clarity_status: isUnclear ? 'PERLU_DILENGKAPI' : 'JELAS',
    unclear_parts: deterministicIssues,
    ringkas: isUnclear
      ? `Lead yang dimasukkan kurang jelas pada bagian: ${deterministicIssues.map((d) => d.field).join(', ')}. Mohon lengkapi sesuai contoh agar masuk ke KPI Lead Valid.`
      : `Prospek ${personaRef.code} (${personaRef.archetype}) · Skor BANT ${bantEval.total}/12 (Grade ${bantEval.grade} - ${bantEval.statusLabel}). ${bantEval.seAction}`,
    poin_kuat: isUnclear
      ? ['Kontak nomor WhatsApp sudah tercatat di sistem']
      : [
          `Cocok dengan profil ${personaRef.code}: ${personaRef.archetype}`,
          `Minat pada ${input.unitInterest} dengan skema ${input.paymentScheme}`,
          `Keunggulan pemicu relevan: ${personaRef.keunggulanPemicu}`,
        ],
    poin_lemah: isUnclear
      ? deterministicIssues.map((d) => `${d.field}: ${d.issue}`)
      : [`Kekhawatiran khas ${personaRef.code} yang wajib diantisipasi: ${personaRef.kekhawatiran}`],
    perlu_dicek_ulang: [
      'Supaya saya carikan unit yang pas, kisaran anggaran atau cicilan per bulan yang nyaman di berapa?',
      'Biasanya keputusan rumah diambil bersama pasangan/keluarga. Siapa saja yang ikut menentukan supaya bisa kita ajak berkunjung bersama?',
      'Targetnya ingin menempati kapan? Sudah tahu daftar harga November berlaku sampai 30 November?',
    ],
    rekomendasi: [
      bantEval.seAction,
      `Pendekatan closing ${personaRef.code}: ${personaRef.pendekatanClosing}`,
      `Frekuensi kontak: ${bantEval.contactFrequency}`,
    ],
    recommended_persona: input.personaCode,
    recommended_bant: {
      b: bantEval.b,
      a: bantEval.a,
      n: bantEval.n,
      t: bantEval.t,
      total: bantEval.total,
      grade: bantEval.grade,
    },
    followup_draft_message: sanitizeFollowupDraft(
      `Halo Bapak/Ibu ${input.fullName || ''}, terima kasih sudah menghubungi The Park Townhouse Sukoharjo. Saya ${input.seName}. ${personaRef.openingHook} Untuk ${input.unitInterest} dengan skema ${input.paymentScheme}, saya sudah siapkan denah resmi dan rincian simulasinya. Kira-kira Bapak/Ibu bersama pasangan lebih nyaman berkunjung melihat lokasi di Jombor Sabtu pagi pukul 10.00 atau Minggu siang pukul 13.00 WIB?`,
      input.fullName || 'Bapak/Ibu',
      input.seName
    ),
    model,
    prompt_tokens: 0,
    completion_tokens: 0,
  };
}
