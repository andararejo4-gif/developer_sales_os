// ============================================================================
// SERVER-ONLY AI LEAD & FOLLOW-UP ENGINE (9ROUTER - ANDARAOS PATTERN)
// Dual-Track Follow-Up Engine:
// 1. MANUAL LEAD (Walk-in, Canvassing, OTT, Referral, Digital Manual):
//    Post-interaction follow-up (dilarang gaya bot "Terima kasih sudah menghubungi"),
//    mengikuti Cadence Playbook §7.7, Persona §3, & Trial Close §7.6.
// 2. WA INBOUND AI LEAD (Baileys Otomatis):
//    Menganalisis pesan terakhir customer vs pesan terakhir sales (2-arah).
//    - First Contact: Speed-to-Lead §7.2 + 1 pertanyaan BANT natural §5.3.
//    - Ongoing Turn: Lanjutkan diskusi tanpa salam pembuka ulang + Objection Handling Bab 10.
// ============================================================================

import {
  PLAYBOOK_AI_KNOWLEDGE_CONTEXT,
  PLAYBOOK_BUYER_PERSONAS,
  PLAYBOOK_UNIT_CATALOG,
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
  extracted_domicile?: string;
  extracted_unit_interest?: string;
  extracted_payment_scheme?: string;
  recommended_stage?: string;
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
  leadOrigin?: 'MANUAL' | 'WA_BAILEYS';
  lastCustomerMessage?: string;
  lastSalesMessage?: string;
  interactionCount?: number;
  seName: string;
  isReanalyze?: boolean;
  previousAnalysis?: {
    ringkas?: string;
    rekomendasi?: string[];
    followup_draft_message?: string;
  };
}

const FORBIDDEN_CLAIMS = [
  'pasti naik harga',
  'pasti untung',
  'bebas banjir',
  'pasti disetujui kpr',
  'rekening pribadi',
];

/**
 * Mengubah nama mentah (mis. "Dr. Pak Andi Januar S.Pdi Phd", "dr. Sari", "H. Bambang")
 * menjadi sapaan Bahasa Indonesia yang sopan, natural, dan tidak dobel ("Bapak/Ibu Dr. Pak...").
 */
export function buildNaturalSalutation(rawName: string, personaCode?: PersonaCode): {
  salutation: string;
  shortCall: string;
} {
  const cleaned = (rawName || '').trim();
  if (!cleaned || /^prospek\s+wa/i.test(cleaned)) {
    return { salutation: 'Bapak/Ibu', shortCall: 'Bapak/Ibu' };
  }

  const lower = cleaned.toLowerCase();
  const isDoctor =
    /\b(dr\.?|drg\.?|dokter|prof\.?|phd|ph\.d)\b/i.test(cleaned) ||
    (personaCode === 'P3' && /\bdr\b/i.test(lower));
  const isIbu = /\b(ibu|bu|mbak|ny\.?|nyonya|hj\.?|hajjah|sari|rina|yuni|endang)\b/i.test(cleaned);
  const isPak = /\b(bapak|pak|mas|bp\.?|bpk\.?|h\.?|haji)\b/i.test(cleaned);
  const isHaji = /(?:^|\s)(?:h\.|haji)(?:\s|$)/i.test(cleaned);
  const isHajjah = /(?:^|\s)(?:hj\.|hajjah)(?:\s|$)/i.test(cleaned);

  // Bersihkan gelar depan & belakang serta kata sapaan agar dapat nama panggilan inti
  const tokens = cleaned
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter((tok) => {
      const t = tok.replace(/\./g, '').toLowerCase();
      if (!t) return false;
      if (
        [
          'dr',
          'drg',
          'dokter',
          'prof',
          'ir',
          'h',
          'hj',
          'haji',
          'hajjah',
          'pak',
          'bapak',
          'bp',
          'bpk',
          'ibu',
          'bu',
          'mas',
          'mbak',
          'ny',
          'tn',
          'spdi',
          'mpd',
          'mpdi',
          'phd',
          'sh',
          'mh',
          'se',
          'mm',
          'msi',
          'st',
          'mt',
          'skep',
          'ners',
          'apt',
          'skm',
          'spd',
          'kom',
          'skom',
          'mkom',
        ].includes(t)
      ) {
        return false;
      }
      if (/^s\.[a-z]+/i.test(tok) || /^m\.[a-z]+/i.test(tok) || /^sp\.[a-z]+/i.test(tok)) {
        return false;
      }
      return true;
    });

  const firstName = tokens[0] || cleaned.split(/\s+/)[0] || 'Bapak/Ibu';

  if (isDoctor) {
    return {
      salutation: `Dokter ${firstName}`,
      shortCall: `Dokter ${firstName}`,
    };
  }
  if (isHajjah) {
    return {
      salutation: `Ibu Hj. ${firstName}`,
      shortCall: `Ibu ${firstName}`,
    };
  }
  if (isHaji) {
    return {
      salutation: `Pak H. ${firstName}`,
      shortCall: `Pak ${firstName}`,
    };
  }
  if (isIbu) {
    const prefix = /\bmbak\b/i.test(cleaned) ? 'Mbak' : 'Ibu';
    return {
      salutation: `${prefix} ${firstName}`,
      shortCall: `${prefix} ${firstName}`,
    };
  }
  if (isPak) {
    const prefix = /\bmas\b/i.test(cleaned) ? 'Mas' : 'Pak';
    return {
      salutation: `${prefix} ${firstName}`,
      shortCall: `${prefix} ${firstName}`,
    };
  }

  return {
    salutation: `Bapak/Ibu ${firstName}`,
    shortCall: `Bapak/Ibu ${firstName}`,
  };
}

/**
 * Mengubah kode enum skema pembayaran menjadi bahasa percakapan manusia.
 */
export function formatHumanPaymentScheme(rawScheme: string): string {
  const code = (rawScheme || '').trim().toUpperCase();
  if (code === 'CASH_KERAS') return 'cash keras';
  if (code === 'CASH_TEMPO_12') return 'cash bertahap 12 bulan (CT12)';
  if (code === 'CASH_TEMPO_24') return 'cash bertahap 24 bulan (CT24)';
  if (code === 'KPR') return 'KPR Bank Partner';
  return (rawScheme || 'KPR').trim();
}

export type FollowupReplyMode = 'RINGKAS' | 'FOKUS_JAWAB' | 'LENGKAP_TERSTRUKTUR';

const PERSONA_VOICE_GUIDE: Record<
  PersonaCode,
  { tone: string; styleRule: string; avoid: string }
> = {
  P1: {
    tone: 'Hangat, ramah, membumi, dan akrab (gaya ngobrol WA profesional yang santai tapi tetap sopan).',
    styleRule: 'Fokus pada kenyamanan keluarga, kepraktisan cicilan, dan suasana aman untuk anak. Gunakan kalimat mengalir dan ringan.',
    avoid: 'Jangan terlalu kaku seperti surat resmi bank, dan jangan pakai slang berlebihan seperti "wkwkw" atau "haha".',
  },
  P2: {
    tone: 'Lugas, respek, to-the-point, dan berwibawa.',
    styleRule: 'Langsung ke inti angka, nilai unit, legalitas, dan efisiensi waktu. Kalimat singkat, padat, tanpa basa-basi panjang.',
    avoid: 'Hindari basa-basi berlebihan, emoji berlebihan, atau bahasa terlalu santai.',
  },
  P3: {
    tone: 'Rapi, sopan, terstruktur, dan menghormati profesi/gelar.',
    styleRule: 'Hormati waktu mereka yang padat; sampaikan poin faktual dan fleksibilitas jadwal secara ringkas dan jelas.',
    avoid: 'Jangan bertele-tele, jangan mengulang hal yang sudah dijelaskan sebelumnya.',
  },
  P4: {
    tone: 'Hangat, menenangkan, dan membangun rasa aman serta kepercayaan.',
    styleRule: 'Tekankan transparansi (video call lokasi, update progres, rekening resmi PT) dengan bahasa yang empatik dan mudah dipahami.',
    avoid: 'Jangan terkesan memaksa atau terburu-buru.',
  },
  P5: {
    tone: 'Sabar, penuh hormat, tenang, dan sangat sopan.',
    styleRule: 'Gunakan tutur kata halus dan tidak mendesak; hargai pertimbangan kenyamanan dan ketenangan lingkungan.',
    avoid: 'Hindari gaya jualan agresif (hard-selling) atau kalimat tergesa-gesa.',
  },
  P6: {
    tone: 'Elegan, objektif, lugas, dan meyakinkan.',
    styleRule: 'Soroti kualitas lingkungan, kemudahan perawatan aset, dan keamanan transaksi atas nama PT.',
    avoid: 'Dilarang menjanjikan kenaikan harga/imbal hasil pasti atau memakai bahasa terlalu kasual.',
  },
  LAINNYA: {
    tone: 'Ramah, sopan, natural seperti sales profesional di WhatsApp.',
    styleRule: 'Sesuaikan panjang dan gaya kalimat dengan nada pesan terakhir prospek.',
    avoid: 'Hindari gaya template robot atau terjemahan kaku.',
  },
};

/**
 * Mengklasifikasikan panjang & kedalaman balasan WA yang tepat berdasarkan konteks & pesan terakhir customer.
 */
export function classifyFollowupReplyMode(
  trackType: 'MANUAL_POST_INTERACTION' | 'WA_FIRST_RESPONSE' | 'WA_ONGOING_CONVERSATION',
  lastCustomerMessage: string
): { mode: FollowupReplyMode; reason: string } {
  const msg = (lastCustomerMessage || '').trim();
  const lower = msg.toLowerCase();

  if (trackType === 'MANUAL_POST_INTERACTION') {
    return {
      mode: 'LENGKAP_TERSTRUKTUR',
      reason: 'Follow-up perdana pasca-pertemuan langsung butuh rangkuman personal yang hangat.',
    };
  }

  const asksFullDetail =
    /\b(fasilitas|spesifikasi|spek|detail lengkap|jelaskan|bedanya|beda cluster|perbedaan|apa saja|fitur|lingkungan|keunggulan)\b/i.test(
      lower
    );

  if (trackType === 'WA_FIRST_RESPONSE') {
    if (msg.length <= 35 && !asksFullDetail && !/\b(harga|cicilan|kpr|unit|lokasi|alamat|type|tipe)\b/i.test(lower)) {
      return {
        mode: 'FOKUS_JAWAB',
        reason: 'Pesan pertama sangat singkat (sapaan/halo); balas hangat & ringkas tanpa brosur panjang.',
      };
    }
    return {
      mode: 'LENGKAP_TERSTRUKTUR',
      reason: 'Respon pertama WA atas pertanyaan prospek perlu info inti yang jelas & terstruktur.',
    };
  }

  // WA_ONGOING_CONVERSATION
  if (asksFullDetail) {
    return {
      mode: 'LENGKAP_TERSTRUKTUR',
      reason: 'Prospek secara eksplisit menanyakan rincian fasilitas/spesifikasi/perbandingan.',
    };
  }

  const hasQuestionOrSpecificRequest =
    msg.includes('?') ||
    /\b(berapa|gimana|bagaimana|kapan|dimana|di mana|apa |apakah|bisa |boleh |minta|kirim|simulasi|cicilan|angsuran|dp |syarat|lokasi|alamat|shareloc|denah|harga|diskon|promo|rekening|caranya|unit mana|masih ada|ready)\b/i.test(
      lower
    );

  if (!hasQuestionOrSpecificRequest && msg.length <= 120) {
    return {
      mode: 'RINGKAS',
      reason: 'Pesan lanjutan prospek berupa respons/konfirmasi/apresiasi singkat tanpa pertanyaan baru.',
    };
  }

  return {
    mode: 'FOKUS_JAWAB',
    reason: 'Pesan lanjutan prospek berisi pertanyaan spesifik, usulan jadwal, atau pertimbangan tertentu.',
  };
}

/**
 * Menentukan panduan konteks interaksi berdasarkan asal lead (Manual vs WA Inbound) & tahap pipeline.
 */
export function buildFollowupContextGuidance(input: LeadAnalysisInput): {
  trackType: 'MANUAL_POST_INTERACTION' | 'WA_FIRST_RESPONSE' | 'WA_ONGOING_CONVERSATION';
  trackLabel: string;
  replyMode: FollowupReplyMode;
  guidanceText: string;
} {
  const isWaOrigin =
    input.leadOrigin === 'WA_BAILEYS' ||
    /whatsapp inbound|baileys/i.test(input.source || '') ||
    (input.inboundMessages && input.inboundMessages.length > 0);

  const lastCust = (
    input.lastCustomerMessage ||
    (input.inboundMessages && input.inboundMessages[input.inboundMessages.length - 1]) ||
    ''
  ).trim();
  const lastSales = (input.lastSalesMessage || '').trim();
  const stage = (input.stage || 'NEW').toUpperCase();
  const recentNotesTail = (input.salesNotes || '').slice(-550);

  let stageSpecificDirective = '';
  if (stage === 'APPOINTMENT') {
    stageSpecificDirective =
      'Prospek berada di Tahap 4 (JANJI KUNJUNGAN / APPOINTMENT). Pastikan koordinasi kunjungan ke Jombor berjalan mulus tanpa membanjiri ulang info brosur.';
  } else if (stage === 'VISITED') {
    stageSpecificDirective =
      'Prospek berada di Tahap 5 (SUDAH SURVEI LOKASI / VISITED). Fokus pada impresi pasca-survei dan tindak lanjut penawaran/keputusan.';
  } else if (stage === 'HOT_NEGOTIATION') {
    stageSpecificDirective =
      'Prospek berada di Tahap 6 (NEGOSIASI AKTIF / HOT NEGOTIATION). Fokus pada kejelasan skema bayar dan penguncian unit.';
  } else if (stage === 'BOOKING' || stage === 'DP_KPR_PROCESS' || stage === 'PPJB_AKAD') {
    stageSpecificDirective =
      `Prospek berada di Tahap ${stage}. Fokus pada pendampingan proses administrasi/DP/KPR/PPJB secara rapi dan menenangkan.`;
  } else if (stage === 'QUALIFIED') {
    stageSpecificDirective =
      'Prospek berada di Tahap 3 (QUALIFIED / BANT >= 7). Fokus mengarahkan ke jadwal survei lokasi yang konkret.';
  }

  if (isWaOrigin) {
    if ((input.interactionCount || 1) > 1 || stage !== 'NEW') {
      const { mode, reason } = classifyFollowupReplyMode('WA_ONGOING_CONVERSATION', lastCust);
      const lengthRule =
        mode === 'RINGKAS'
          ? '  - MODE BALASAN: RINGKAS (WAJIB 1–2 kalimat pendek saja, ±60–220 karakter). TANPA bullet point, TANPA mengulang spesifikasi proyek/harga/clubhouse, TANPA menagih Booking Fee. Cukup balas hangat sesuai nada pesan customer.'
          : mode === 'FOKUS_JAWAB'
          ? '  - MODE BALASAN: FOKUS_JAWAB (1–2 paragraf singkat, maks 2–4 kalimat total). TANPA daftar bullet brosur berulang. Jawab tepat ke inti pesan/pertanyaan customer, lalu tutup dengan 1 kalimat lanjut yang natural.'
          : '  - MODE BALASAN: LENGKAP_TERSTRUKTUR (2–3 paragraf rapi, boleh bullet • maks 3–4 poin relevan sesuai yang ditanyakan customer).';

      return {
        trackType: 'WA_ONGOING_CONVERSATION',
        trackLabel: `Balasan Lanjutan Percakapan WA · Tahap ${stage} (${mode})`,
        replyMode: mode,
        guidanceText: [
          'JALUR B2 - PERCAKAPAN WHATSAPP LANJUTAN / PESAN BARU DARI PROSPEK YANG SAMA:',
          `- Tahap Pipeline Saat Ini: ${stage}. ${stageSpecificDirective}`,
          `- Alasan Mode Balasan (${mode}): ${reason}`,
          `- Riwayat konteks terbaru (ekor percakapan): "${recentNotesTail}"`,
          lastSales
            ? `- Pesan terakhir dari Sales (${input.seName}): "${lastSales.slice(-300)}"`
            : '- Status: Prospek mengirim pesan tambahan/lanjutan.',
          `- Pesan TERBARU dari Customer yang WAJIB DITANGGAPI SEKARANG: "${lastCust || recentNotesTail}"`,
          '- ATURAN WAJIB:',
          lengthRule,
          '  1. Analisis internal (`ringkas`, `poin_kuat`, `poin_lemah`, `rekomendasi`, `perlu_dicek_ulang`) tetap tajam & taktis untuk SE, sedangkan `followup_draft_message` wajib proporsional mengikuti MODE BALASAN di atas.',
          '  2. DILARANG mengulang salam perkenalan kaku atau mengulang spesifikasi unit/brosur jika customer tidak menanyakannya.',
          '  3. Sebut sapaan/nama prospek maksimal 1x di awal pesan; jangan mengulang "Bapak/Ibu" di setiap kalimat.',
        ].join('\n'),
      };
    }

    const { mode, reason } = classifyFollowupReplyMode('WA_FIRST_RESPONSE', lastCust);
    const firstTurnRule =
      mode === 'FOKUS_JAWAB'
        ? '  - MODE BALASAN: FOKUS_JAWAB (2–3 kalimat singkat & ramah, tanpa bullet panjang). Sapa hangat, perkenalkan diri + The Park Townhouse Sukoharjo, lalu tanya kebutuhan hunian/unit yang dicari.'
        : '  - MODE BALASAN: LENGKAP_TERSTRUKTUR (2–3 paragraf singkat, boleh 2–3 bullet • keunggulan yang paling relevan). Jawab langsung inti pertanyaan customer + sisipkan 1 pertanyaan BANT natural.';

    return {
      trackType: 'WA_FIRST_RESPONSE',
      trackLabel: `Respon Pertama WhatsApp Inbound (${mode})`,
      replyMode: mode,
      guidanceText: [
        'JALUR B1 - PESAN MASUK WHATSAPP PERTAMA DARI CALON PEMBELI (SPEED-TO-LEAD §7.2):',
        `- Isi pesan masuk dari Customer: "${lastCust || recentNotesTail}"`,
        `- Alasan Mode Balasan (${mode}): ${reason}`,
        '- ATURAN WAJIB:',
        firstTurnRule,
        '  1. Sapa customer dengan hangat dan sebut nama SE + The Park Townhouse Sukoharjo.',
        '  2. Jawab LANGSUNG inti pertanyaan customer tanpa bertele-tele.',
      ].join('\n'),
    };
  }

  // JALUR A: LEAD MANUAL (Sudah pernah bertemu / berinteraksi sebelumnya)
  const srcLower = (input.source || '').toLowerCase();
  let meetingContext = 'diskusi dan pertemuan kita sebelumnya';
  if (srcLower.includes('walk-in') || srcLower.includes('gallery')) {
    meetingContext = 'kunjungan dan diskusi langsung saat mampir ke Marketing Gallery kami di Jombor, Bendosari hari ini';
  } else if (srcLower.includes('canvassing')) {
    meetingContext = 'pertemuan dan obrolan singkat kita saat kegiatan kunjungan lapangan (canvassing) tadi';
  } else if (srcLower.includes('ott') || srcLower.includes('cfd') || srcLower.includes('mal') || srcLower.includes('gelora')) {
    meetingContext = 'obrolan hangat kita di booth pameran / Open Table Talk The Park Townhouse tadi';
  } else if (srcLower.includes('referral')) {
    meetingContext = 'referensi dan rekomendasi hangat dari rekan/kerabat mengenai kebutuhan hunian di Sukoharjo';
  }

  let cadenceRule =
    'Cadence Hari 0/1 Pasca-Pertemuan (Playbook §7.7): Ucapkan terima kasih atas waktu pertemuan/obrolan, rangkum kebutuhan spesifik mereka dari catatan sales, rekomendasikan unit & keunggulan pemicu sesuai Persona, dan ajak kunjungan kembali (bersama pasangan/keluarga bila Authority < 2).';

  if (stage === 'APPOINTMENT') {
    cadenceRule =
      'Cadence Penguncian Janji Survei Lokasi (Tahap 4 Appointment - Playbook §7.4): Konfirmasi hari & jam kunjungan ke Jombor, pastikan pengambil keputusan (pasangan/keluarga) ikut hadir, dan sampaikan bahwa simulasi resmi serta unit prioritas sudah disiapkan.';
  } else if (stage === 'VISITED') {
    cadenceRule =
      'Cadence Pasca-Survei Lokasi (Playbook §7.5 & §7.7): Ucapkan terima kasih sudah melihat langsung lokasi & unit di Jombor, rangkum impresi unit yang disukai, tawarkan pengiriman simulasi tertulis resmi, dan dorong langkah penguncian unit.';
  } else if (stage === 'HOT_NEGOTIATION') {
    cadenceRule =
      'Cadence Negosiasi & Penawaran Tertulis (Playbook §7.6 & §7.7 Hari 5-7): Tindak lanjuti simulasi pembayaran tertulis, atasi keberatan harga/skema (Bab 10), ingatkan keterbatasan unit (hanya 35 unit & kenaikan bertahap Rp50 juta/bulan sesuai §2.5), dan arahkan ke Booking Fee Rp5 juta.';
  } else if (stage === 'BOOKING' || stage === 'DP_KPR_PROCESS' || stage === 'PPJB_AKAD') {
    cadenceRule =
      'Cadence Pasca-Booking / Proses Pemberkasan: Ucapkan apresiasi atas kepercayaan memilih unit di The Park Townhouse, pandu kelengkapan berkas KPR / jadwal pembayaran DP / jadwal PPJB dengan ramah dan rapi.';
  } else if (stage === 'NURTURE') {
    cadenceRule =
      'Cadence Pembinaan / Nurture (Playbook §7.7): Kirim update progres pembangunan kawasan / clubhouse atau penawaran skema pembayaran terbaru tanpa terkesan mendesak, dan tanyakan perkembangan rencana hunian mereka.';
  }

  return {
    trackType: 'MANUAL_POST_INTERACTION',
    trackLabel: `Follow-Up Pasca-Interaksi (${input.source}) · Tahap ${stage}`,
    replyMode: 'LENGKAP_TERSTRUKTUR',
    guidanceText: [
      'JALUR A - LEAD INPUT MANUAL SE (PROSPEK SUDAH PERNAH BERTEMU / BERDISKUSI DENGAN SALES):',
      `- Konteks pertemuan awal: ${meetingContext} (Sumber: ${input.source}).`,
      `- Strategi Cadence Playbook §7.7: ${cadenceRule}`,
      '- ATURAN MUTLAK JALUR A:',
      '  1. DILARANG KERAS menulis kalimat seperti chatbot CS: "Terima kasih sudah menghubungi The Park Townhouse Sukoharjo".',
      '  2. Buka dengan sapaan personal yang menghormati gelar/profesi prospek (maksimal 1x di awal pesan), lalu sebutkan apresiasi atas pertemuan/diskusi tadi.',
      '  3. Hubungkan langsung catatan kebutuhan di lapangan dengan solusi konkret unit yang diminati (maks 2–3 paragraf rapi atau 3 poin singkat agar tetap nyaman dibaca di HP).',
      '  4. Jika skor Authority < 2, ajak prospek datang kembali bersama pasangan/keluarga pada akhir pekan.',
    ].join('\n'),
  };
}

/**
 * Menyusun pesan follow-up fallback yang tetap 100% natural, manusiawi, dan kontekstual
 * (membedakan Manual Post-Interaction vs WA First Response vs WA Ongoing Turn).
 */
export function buildContextualFallbackFollowup(input: LeadAnalysisInput): string {
  const { salutation, shortCall } = buildNaturalSalutation(input.fullName, input.personaCode);
  const humanScheme = formatHumanPaymentScheme(input.paymentScheme);
  const personaRef = PLAYBOOK_BUYER_PERSONAS[input.personaCode] || PLAYBOOK_BUYER_PERSONAS.P1;
  const matchedUnit = PLAYBOOK_UNIT_CATALOG.find((u) => input.unitInterest.includes(u.unitCode));
  const priceText = matchedUnit
    ? `Rp${Math.round(matchedUnit.priceCashIdr / 1_000_000)} juta`
    : 'mulai Rp650 juta';

  const guidance = buildFollowupContextGuidance(input);
  const stage = (input.stage || 'NEW').toUpperCase();
  const lastCust = (input.lastCustomerMessage || '').trim();
  const prevDraft = (input.previousAnalysis?.followup_draft_message || '').trim();

  if (guidance.trackType === 'WA_ONGOING_CONVERSATION') {
    if (guidance.replyMode === 'RINGKAS') {
      if (stage === 'APPOINTMENT') {
        return `Sama-sama ${salutation}, senang dengarnya 🙏 Sampai ketemu di lokasi Jombor ya, nanti saya siapkan unit ${input.unitInterest} untuk dicek langsung.`;
      }
      if (/\b(booking|ambil|jadi|cocok|lanjut)\b/i.test(lastCust)) {
        return `Siap ${salutation}, senang sekali dengarnya 🙏 Nanti saya siapkan unit prioritas ${input.unitInterest} agar bisa langsung dicek dan diamankan di lokasi.`;
      }
      return `Siap ${salutation}, terima kasih kembali 🙏 Kalau nanti ada yang ingin ditanyakan atau disesuaikan jadwalnya, kabari saya saja ya.`;
    }

    if (guidance.replyMode === 'FOKUS_JAWAB') {
      if (/\b(jam|hari|minggu|sabtu|senin|selasa|rabu|kamis|jumat|survei|kunjung|mampir)\b/i.test(lastCust)) {
        return [
          `Bisa sekali ${salutation}, jadwalnya sudah saya catat 🙏`,
          '',
          `Nanti sekalian saya siapkan simulasi ${humanScheme} untuk ${input.unitInterest} (${priceText}) supaya saat ketemu langsung enak lihat hitungannya.`,
        ].join('\n');
      }
      return [
        `Siap ${salutation}, untuk ${input.unitInterest} saat ini menggunakan skema ${humanScheme} (${priceText}).`,
        '',
        `Ada bagian spesifik yang ingin ${shortCall} pastikan dulu, atau mau langsung saya siapkan simulasinya untuk dicek bersama?`,
      ].join('\n');
    }

    return [
      `Baik ${salutation}, berikut rincian singkat untuk ${input.unitInterest} (${priceText}, skema ${humanScheme}):`,
      `• Tata ruang 2 lantai Japandi Modern dengan garasi dalam`,
      `• Keamanan one-gate RFID + CCTV 24 jam`,
      `• Akses clubhouse (kolam renang, gym, mini golf) tanpa biaya membership`,
      '',
      `Kira-kira bagian mana yang paling ingin ${shortCall} bahas lebih lanjut?`,
    ].join('\n');
  }

  if (guidance.trackType === 'WA_FIRST_RESPONSE') {
    if (guidance.replyMode === 'FOKUS_JAWAB') {
      return `Halo ${salutation}, salam kenal. Saya ${input.seName} dari The Park Townhouse Sukoharjo (Jombor, Bendosari). Ada rencana cari rumah di kisaran tipe atau skema pembayaran seperti apa ya?`;
    }
    return [
      `Halo ${salutation}, salam kenal. Saya ${input.seName} dari The Park Townhouse Sukoharjo (Jombor, Bendosari).`,
      '',
      `Menjawab pertanyaan ${shortCall}, untuk ${input.unitInterest} harga resminya ${priceText} (tersedia skema ${humanScheme}). Unitnya sudah 2 lantai Japandi Modern dengan garasi dalam, keamanan one-gate RFID + CCTV 24 jam, dan akses clubhouse tanpa iuran membership.`,
      '',
      `Rencananya untuk hunian keluarga sendiri atau investasi ya? Kalau berkenan, akhir pekan ini bisa mampir melihat lokasinya langsung.`,
    ].join('\n');
  }

  // MANUAL POST-INTERACTION
  const srcLower = (input.source || '').toLowerCase();
  const meetingPhrase =
    srcLower.includes('walk-in') || srcLower.includes('gallery')
      ? 'meluangkan waktu mampir ke Marketing Gallery kami di Jombor, Bendosari hari ini'
      : srcLower.includes('canvassing')
      ? 'meluangkan waktu berbincang saat kunjungan kami tadi'
      : srcLower.includes('ott') || srcLower.includes('mal') || srcLower.includes('cfd')
      ? 'mampir dan berdiskusi di booth The Park Townhouse tadi'
      : 'berdiskusi bersama saya mengenai rencana hunian di The Park Townhouse Sukoharjo';

  const inviteSpouseNote =
    input.bantA < 2
      ? `Karena keputusan rumah biasanya jauh lebih mantap bila dilihat bersama pasangan/keluarga, bagaimana jika akhir pekan ini (Sabtu atau Minggu) ${shortCall} mengajak keluarga untuk melihat langsung lokasi unit dan area clubhouse-nya?`
      : `Bagaimana jika akhir pekan ini (Sabtu atau Minggu) kita jadwalkan melihat langsung fisik lokasi unit beserta simulasi lengkap skema ${humanScheme}-nya, ${shortCall}?`;

  return [
    `Selamat sore, ${salutation} 🙏`,
    '',
    `Saya ${input.seName} dari The Park Townhouse Sukoharjo — terima kasih banyak sudah ${meetingPhrase}. Senang sekali bisa mendengar langsung rencana hunian ${shortCall}.`,
    '',
    `Dari obrolan kita tadi, menurut saya ${input.unitInterest} (skema ${humanScheme}, harga ${priceText}) sangat pas untuk kebutuhan ${shortCall}:`,
    `• Konsep 2 lantai Japandi Modern dengan garasi dalam yang rapi dan nyaman`,
    `• Keamanan one-gate system RFID & CCTV 24 jam (${personaRef.openingHook.toLowerCase()})`,
    `• Akses penuh fasilitas clubhouse: kolam renang, gym, dan mini golf tanpa biaya membership`,
    '',
    inviteSpouseNote,
    '',
    `Silakan kabari waktu yang paling nyaman untuk ${shortCall}, nanti saya siapkan semuanya. Terima kasih banyak dan salam sehat selalu.`,
    '',
    `Salam hangat,`,
    `${input.seName}`,
    `Sales Executive — The Park Townhouse Sukoharjo`,
  ].join('\n');
}

function sanitizeFollowupDraft(draft: string, input: LeadAnalysisInput): string {
  let clean = draft.trim();
  for (const forbidden of FORBIDDEN_CLAIMS) {
    const regex = new RegExp(forbidden, 'gi');
    clean = clean.replace(regex, 'sesuai ketentuan resmi proyek');
  }
  // Bersihkan kebocoran kode enum mentah & ekspresi slang canggung bila AI tidak sengaja menulisnya
  clean = clean
    .replace(/\bCASH_KERAS\b/g, 'cash keras')
    .replace(/\bCASH_TEMPO_12\b/g, 'cash bertahap 12 bulan')
    .replace(/\bCASH_TEMPO_24\b/g, 'cash bertahap 24 bulan')
    .replace(/\b(wkwk+w*|h+a+h+a+)\b[!,.?\s]*/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (!clean) {
    return buildContextualFallbackFollowup(input);
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
  const combinedContext = `${notesTrimmed} ${inboundJoined} ${input.lastCustomerMessage || ''}`.trim();

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

/**
 * Rantai model prioritas di 9router:
 * 1. `andararejomakmurjosjis`: Router combo utama yang otomatis failover ke provider aktif.
 * 2. `nous/upstage/solar-mini4:free`: Cepat, mendukung non-streaming JSON bersih.
 * 3. `openrouter/google/gemma-4-31b-it:free`: Fallback kualitas Bahasa Indonesia baik.
 * 4. `cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast`: Fallback cepat Cloudflare Workers AI.
 */
const PREFERRED_ANDARA_MODELS = [
  'andararejomakmurjosjis',
  'nous/upstage/solar-mini4:free',
  'openrouter/google/gemma-4-31b-it:free',
  'cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast',
];

function parseRouterCompletionBody(rawBody: string, fallbackModel: string): {
  msgContent: string;
  reasoning: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
} {
  const trimmed = rawBody.trim();
  if (!trimmed.startsWith('data:')) {
    const payload = JSON.parse(trimmed) as Record<string, any>;
    return {
      msgContent: String(payload?.choices?.[0]?.message?.content ?? ''),
      reasoning: String(payload?.choices?.[0]?.message?.reasoning_content ?? ''),
      model: String(payload?.model ?? fallbackModel),
      promptTokens: Number(payload?.usage?.prompt_tokens ?? 0),
      completionTokens: Number(payload?.usage?.completion_tokens ?? 0),
    };
  }

  let msgContent = '';
  let reasoning = '';
  let model = fallbackModel;
  let promptTokens = 0;
  let completionTokens = 0;

  for (const line of trimmed.split(/\r?\n/)) {
    const cleanLine = line.trim();
    if (!cleanLine.startsWith('data:')) continue;
    const jsonPart = cleanLine.slice(5).trim();
    if (!jsonPart || jsonPart === '[DONE]') continue;
    try {
      const chunk = JSON.parse(jsonPart) as Record<string, any>;
      if (chunk.model) model = String(chunk.model);
      if (chunk.usage) {
        promptTokens = Number(chunk.usage.prompt_tokens ?? promptTokens);
        completionTokens = Number(chunk.usage.completion_tokens ?? completionTokens);
      }
      const delta = chunk?.choices?.[0]?.delta;
      if (delta?.content) msgContent += String(delta.content);
      if (delta?.reasoning_content) reasoning += String(delta.reasoning_content);
      const msg = chunk?.choices?.[0]?.message;
      if (msg?.content) msgContent = String(msg.content);
      if (msg?.reasoning_content) reasoning = String(msg.reasoning_content);
    } catch {
      /* abaikan chunk parsial */
    }
  }

  return { msgContent, reasoning, model, promptTokens, completionTokens };
}

export async function analyzeLeadWithAi(input: LeadAnalysisInput): Promise<LeadAiEvaluation> {
  const routerUrl = (process.env.AI_ROUTER_URL || 'https://9router.giivepro.com/v1').replace(/\/+$/, '');
  const apiKey = process.env.AI_ROUTER_API_KEY || '';
  const configuredModel = process.env.AI_ROUTER_MODEL || 'andararejomakmurjosjis';

  const deterministicIssues = detectUnclearLeadParts(input);
  const personaRef = PLAYBOOK_BUYER_PERSONAS[input.personaCode] || PLAYBOOK_BUYER_PERSONAS.P1;
  const personaVoice = PERSONA_VOICE_GUIDE[input.personaCode] || PERSONA_VOICE_GUIDE.LAINNYA;
  const { salutation, shortCall } = buildNaturalSalutation(input.fullName, input.personaCode);
  const humanScheme = formatHumanPaymentScheme(input.paymentScheme);
  const followupGuidance = buildFollowupContextGuidance(input);
  const matchedUnit = PLAYBOOK_UNIT_CATALOG.find(
    (u) => u.label === input.unitInterest || (input.unitInterest || '').includes(u.label.split(' (')[0])
  );

  // Pangkas detail persona agar hemat token (cukup field yang tidak kosong, maks 180 karakter per field)
  const compactPersona: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.personaProfile || {})) {
    const t = String(v || '').trim();
    if (t) compactPersona[k] = t.slice(0, 180);
  }

  const systemPrompt = [
    'Kamu adalah Analis Senior Properti & Copywriter Sales WhatsApp Terbaik untuk PT Andara Rejo Makmur (Proyek: The Park Townhouse Sukoharjo, Jombor, Bendosari).',
    'Fakta Proyek (Playbook v1.2): 35 unit boutique 2 lantai Japandi Modern, garasi dalam, one-gate RFID + CCTV 4K 24 jam + smart door lock, clubhouse di Cluster Nagoya (kolam renang, gym, cafe, mini golf 9 hole, game station) TANPA biaya membership. Cluster Nagoya (Jl. Tentara Pelajar, mulai Rp650 jt), Osaka & Tokyo (Koridor Jl. Jenderal Sudirman, Rp775 jt - Rp1,15 M). Skema: Cash Keras, Cash Tempo 12/24 bln, KPR DP 10%. Booking fee resmi Rp5 juta ke rekening PT Andara Rejo Makmur. Dilarang klaim "pasti naik harga/untung/bebas banjir/pasti KPR".',
    'ATURAN EFISIENSI: Jangan bertele-tele di internal reasoning; langsung hasilkan objek JSON final yang ringkas, akurat, dan pesan `followup_draft_message` Bahasa Indonesia yang sangat hangat, manusiawi, persuasif, dan TIDAK KAKU SEPERTI BOT.',
  ].join('\n');

  const prevRingkas = (input.previousAnalysis?.ringkas || '').trim();
  const prevRekomendasi = (input.previousAnalysis?.rekomendasi || []).slice(0, 3);
  const prevDraft = (input.previousAnalysis?.followup_draft_message || '').trim();

  const antiRepetitionBlock =
    prevRingkas || prevDraft
      ? [
          '',
          'KONTEKS ANALISIS & DRAF SEBELUMNYA (WAJIB DIPERBARUI & DILARANG DIULANG):',
          prevRingkas ? `- Ringkasan Analisis Sebelumnya: "${prevRingkas.slice(0, 260)}"` : '',
          prevRekomendasi.length > 0
            ? `- Rekomendasi Taktis Sebelumnya: ${JSON.stringify(prevRekomendasi)}`
            : '',
          prevDraft ? `- Draf Pesan WA Sebelumnya: "${prevDraft.slice(0, 320)}"` : '',
          input.isReanalyze
            ? '- INSTRUKSI ANALISIS ULANG (RE-ANALYZE): User meminta ANALISIS BARU & REKOMENDASI FOLLOW-UP BARU yang berbeda dari sebelumnya. Gunakan sudut pandang taktis yang segar (mis. kombinasi simulasi finansial, nilai investasi & eksklusivitas 35 unit, fasilitas clubhouse bebas iuran, atau trial close penguncian unit), ubah susunan poin_kuat / rekomendasi / perlu_dicek_ulang, dan tulis `followup_draft_message` dengan pembuka serta angle persuasi yang SAMA SEKALI BERBEDA dari Draf Pesan WA Sebelumnya!'
            : '- INSTRUKSI PROGRES PERCAKAPAN / TAHAP BARU: Jangan mengulang ringkasan analisis atau kalimat draf sebelumnya. Fokuskan 100% analisis (`ringkas`, `poin_kuat`, `rekomendasi`, `perlu_dicek_ulang`) dan `followup_draft_message` pada pesan terbaru customer / perubahan tahap pipeline saat ini!',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

  const userPrompt = [
    'Data Lead Properti:',
    JSON.stringify({
      nama_input: input.fullName,
      sapaan_wajib: salutation,
      panggilan: shortCall,
      domisili: input.domicile,
      asal_lead: input.leadOrigin || 'MANUAL',
      sumber: input.source,
      tahap: input.stage,
      persona: `${input.personaCode} (${personaRef.archetype})`,
      profil_persona: compactPersona,
      unit_minat: input.unitInterest,
      harga_acuan_unit: matchedUnit
        ? `Cash Rp${Math.round(matchedUnit.priceCashIdr / 1e6)} jt / KPR Rp${Math.round(matchedUnit.priceKprIdr / 1e6)} jt`
        : 'Mulai Rp650 jt - Rp1,15 M',
      skema_bayar: humanScheme,
      bant_0_3: { b: input.bantB, a: input.bantA, n: input.bantN, t: input.bantT },
      catatan_sales_terbaru: (input.salesNotes || '').slice(-650),
      chat_wa: {
        pesan_terakhir_customer: (
          input.lastCustomerMessage ||
          (input.inboundMessages || []).slice(-1)[0] ||
          ''
        ).slice(-400),
        pesan_terakhir_sales: (input.lastSalesMessage || '').slice(-320),
        interaksi_ke: input.interactionCount || 1,
      },
      nama_se: input.seName,
      mode_analisis_ulang: Boolean(input.isReanalyze),
      isu_validasi: deterministicIssues,
    }),
    antiRepetitionBlock,
    '',
    'INSTRUKSI PESAN WHATSAPP (`followup_draft_message`):',
    followupGuidance.guidanceText,
    `- Gaya Bahasa Persona (${input.personaCode} - ${personaRef.archetype}):`,
    `  * Nada: ${personaVoice.tone}`,
    `  * Fokus kalimat: ${personaVoice.styleRule}`,
    `  * Hindari: ${personaVoice.avoid}`,
    `- Sapa dengan "${salutation}" maksimal 1x di awal pesan (JANGAN tulis "Bapak/Ibu ${input.fullName}", JANGAN ulang "Bapak/Ibu" di setiap kalimat, JANGAN tulis enum "CASH_KERAS").`,
    `- Skema pembayaran ditulis "${humanScheme}".`,
    `- DILARANG keras memakai ekspresi canggung/bot seperti "wkwk", "haha", "tanda positif yang sangat kami nikmati", atau kalimat terjemahan kaku.`,
    followupGuidance.replyMode === 'RINGKAS'
      ? '- KEPADATAN WAJIB (MODE RINGKAS): Tulis HANYA 1–2 kalimat pendek (±60–220 karakter) layaknya balasan chat WhatsApp manusia nyata. JANGAN buat paragraf panjang atau bullet point!'
      : followupGuidance.replyMode === 'FOKUS_JAWAB'
      ? '- KEPADATAN WAJIB (MODE FOKUS_JAWAB): Tulis 1–2 paragraf singkat (maks 2–4 kalimat total), tanpa bullet brosur berulang. Jawab langsung intinya saja.'
      : '- KEPADATAN WAJIB (MODE LENGKAP_TERSTRUKTUR): Tulis maksimal 2–3 paragraf singkat yang nyaman dibaca di layar HP (boleh bullet • maksimal 3–4 poin relevan saja).',
    '',
    'Jika data tidak jelas (nama samar, domisili kosong, catatan <4 kata), set "clarity_status": "PERLU_DILENGKAPI" dan isi "unclear_parts".',
    'Jika dari pesan terbaru customer terdeteksi informasi baru tentang domisili, unit minat (Cluster Nagoya/Osaka/Tokyo), atau skema bayar (KPR/CASH_KERAS/CASH_TEMPO_12/CASH_TEMPO_24), sertakan di key opsional extracted_domicile, extracted_unit_interest, extracted_payment_scheme.',
    'Balas HANYA objek JSON valid dengan key: skor (0-100), label (SANGAT_PROSPECTIF|PROSPECTIF|PERLU_PEMBINAAN|PERLU_DILENGKAPI), clarity_status (JELAS|PERLU_DILENGKAPI), unclear_parts ([{field,issue,example}]), ringkas (1-2 kalimat), poin_kuat ([2-3 string]), poin_lemah ([1-2 string]), perlu_dicek_ulang ([2-3 pertanyaan BANT natural]), rekomendasi ([2-3 saran taktis]), recommended_persona (P1..P6), recommended_bant ({b,a,n,t}), extracted_domicile (string opsional), extracted_unit_interest (string opsional), extracted_payment_scheme (string opsional), followup_draft_message (string pesan WA lengkap).',
  ].join('\n');

  const modelChain = Array.from(
    new Set([configuredModel, ...PREFERRED_ANDARA_MODELS].filter(Boolean))
  );

  if (apiKey) {
    for (const candidateModel of modelChain) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      try {
        const res = await fetch(`${routerUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: candidateModel,
            stream: false,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 4096,
            temperature: input.isReanalyze ? 0.65 : 0.35,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          console.warn(`[AI Engine] Model ${candidateModel} returned HTTP ${res.status}`);
          continue;
        }

        const rawBody = await res.text();
        const {
          msgContent,
          reasoning,
          model: resolvedModel,
          promptTokens,
          completionTokens,
        } = parseRouterCompletionBody(rawBody, candidateModel);
        const rawText = msgContent.includes('{') ? msgContent : msgContent.trim() || reasoning;
        const parsed = extractJsonObject(rawText);

        const aiUnclear = Array.isArray(parsed.unclear_parts)
          ? (parsed.unclear_parts as Record<string, unknown>[])
              .map((u) => ({
                field: String(u?.field ?? 'Data Lead'),
                issue: String(u?.issue ?? 'Informasi belum spesifik'),
                example: String(
                  u?.example ?? 'Lengkapi detail kebutuhan, anggaran, dan rencana waktu beli.'
                ),
              }))
              .filter((u) => u.issue)
          : [];

        const mergedUnclear =
          deterministicIssues.length > 0
            ? [
                ...deterministicIssues,
                ...aiUnclear.filter(
                  (au) =>
                    !deterministicIssues.some(
                      (du) => du.field.toLowerCase() === au.field.toLowerCase()
                    )
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
        const finalScore = isUnclear
          ? Math.min(45, Math.max(15, rawScore))
          : Math.max(0, Math.min(100, rawScore));

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
            : String(
                parsed.ringkas ||
                  `Prospek ${recPersona} dengan skor BANT ${bantEval.total}/12 (Grade ${bantEval.grade}).`
              ),
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
          extracted_domicile:
            typeof parsed.extracted_domicile === 'string' && parsed.extracted_domicile.trim()
              ? parsed.extracted_domicile.trim()
              : undefined,
          extracted_unit_interest:
            typeof parsed.extracted_unit_interest === 'string' && parsed.extracted_unit_interest.trim()
              ? parsed.extracted_unit_interest.trim()
              : undefined,
          extracted_payment_scheme:
            typeof parsed.extracted_payment_scheme === 'string' && parsed.extracted_payment_scheme.trim()
              ? parsed.extracted_payment_scheme.trim()
              : undefined,
          followup_draft_message: sanitizeFollowupDraft(
            String(parsed.followup_draft_message || ''),
            input
          ),
          model: resolvedModel,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
        };
      } catch (err) {
        console.warn(
          `[AI Engine] Model ${candidateModel} failed:`,
          err instanceof Error ? err.message : String(err)
        );
      } finally {
        clearTimeout(timer);
      }
    }
  }

  // Fallback Evaluator Deterministik Berbasis Playbook v1.2 (tetap natural & kontekstual)
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
          `Minat pada ${input.unitInterest} dengan skema ${humanScheme}`,
          `Keunggulan pemicu relevan: ${personaRef.keunggulanPemicu}`,
        ],
    poin_lemah: isUnclear
      ? deterministicIssues.map((d) => `${d.field}: ${d.issue}`)
      : [`Kekhawatiran khas ${personaRef.code} yang wajib diantisipasi: ${personaRef.kekhawatiran}`],
    perlu_dicek_ulang: [
      'Supaya saya carikan unit yang pas, kisaran anggaran atau skema pembayaran yang paling nyaman bagaimana?',
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
    followup_draft_message: sanitizeFollowupDraft('', input),
    model: configuredModel,
    prompt_tokens: 0,
    completion_tokens: 0,
  };
}
