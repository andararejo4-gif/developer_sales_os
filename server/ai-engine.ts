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

/**
 * Menentukan panduan konteks interaksi berdasarkan asal lead (Manual vs WA Inbound) & tahap pipeline.
 */
export function buildFollowupContextGuidance(input: LeadAnalysisInput): {
  trackType: 'MANUAL_POST_INTERACTION' | 'WA_FIRST_RESPONSE' | 'WA_ONGOING_CONVERSATION';
  trackLabel: string;
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
      'Prospek berada di Tahap 4 (JANJI KUNJUNGAN / APPOINTMENT). Fokuskan analisis & pesan pada penguncian kepastian hadir survei lokasi di Jombor, persiapan unit & simulasi pembayaran yang akan ditunjukkan saat survei, serta kesiapan Booking Fee Rp5 juta bila cocok di lokasi.';
  } else if (stage === 'VISITED') {
    stageSpecificDirective =
      'Prospek berada di Tahap 5 (SUDAH SURVEI LOKASI / VISITED). Fokuskan analisis & pesan pada tindak lanjut impresi pasca-survei, pengiriman penawaran tertulis resmi, dan dorongan mengunci unit sebelum diambil pembeli lain.';
  } else if (stage === 'HOT_NEGOTIATION') {
    stageSpecificDirective =
      'Prospek berada di Tahap 6 (NEGOSIASI AKTIF / HOT NEGOTIATION). Fokuskan analisis & pesan pada penyelesaian negosiasi skema bayar, urgensi keterbatasan unit (hanya 35 unit & kenaikan bertahap Rp50 juta/bulan sesuai Playbook §2.5), dan penutupan Booking Fee Rp5 juta ke rekening resmi PT Andara Rejo Makmur.';
  } else if (stage === 'BOOKING' || stage === 'DP_KPR_PROCESS' || stage === 'PPJB_AKAD') {
    stageSpecificDirective =
      `Prospek berada di Tahap ${stage}. Fokuskan analisis & pesan pada pengawalan kelengkapan dokumen, jadwal pembayaran DP / proses SP3K KPR / jadwal PPJB & Akad secara rapi dan meyakinkan.`;
  } else if (stage === 'QUALIFIED') {
    stageSpecificDirective =
      'Prospek berada di Tahap 3 (QUALIFIED / BANT >= 7). Fokuskan analisis & pesan untuk mengonversi minat menjadi jadwal survei lokasi (Appointment) pada hari & jam yang spesifik.';
  }

  if (isWaOrigin) {
    if ((input.interactionCount || 1) > 1 || stage !== 'NEW') {
      return {
        trackType: 'WA_ONGOING_CONVERSATION',
        trackLabel: `Balasan Lanjutan Percakapan WA · Tahap ${stage}`,
        guidanceText: [
          'JALUR B2 - PERCAKAPAN WHATSAPP LANJUTAN / PESAN BARU DARI PROSPEK YANG SAMA:',
          `- Tahap Pipeline Saat Ini: ${stage}. ${stageSpecificDirective}`,
          `- Riwayat konteks terbaru (ekor percakapan): "${recentNotesTail}"`,
          lastSales
            ? `- Pesan terakhir dari Sales (${input.seName}): "${lastSales.slice(-300)}"`
            : '- Status: Prospek mengirim pesan tambahan/lanjutan.',
          `- Pesan TERBARU dari Customer yang WAJIB DITANGGAPI SEKARANG: "${lastCust || recentNotesTail}"`,
          '- ATURAN WAJIB:',
          '  1. Analisis ulang profil BANT, Persona, Poin Kuat, Poin Lemah, dan Rekomendasi Taktis berdasarkan kalimat TERBARU customer ini dan tahap pipeline saat ini.',
          '  2. DILARANG mengulang salam perkenalan kaku atau mengulang bahasan lama yang sudah selesai (seperti mengulang candaan kopi/jadwal lama jika customer sudah membahas topik baru seperti niat booking pasca-survei).',
          '  3. Tangkap sinyal buying intent di pesan terbaru customer: jika customer menyatakan niat booking/ambil unit setelah survei, apresiasi antusiasmenya, pastikan unit prioritasnya disiapkan untuk dicek saat survei, dan informasikan prosedur Booking Fee resmi Rp5 juta (rekening PT Andara Rejo Makmur) agar saat survei bisa langsung dikunci.',
          '  4. Tutup dengan 1 kalimat pengunci langkah konkret berikutnya sesuai tahap pipeline.',
        ].join('\n'),
      };
    }

    return {
      trackType: 'WA_FIRST_RESPONSE',
      trackLabel: 'Respon Pertama WhatsApp Inbound (Speed-to-Lead Playbook §7.2)',
      guidanceText: [
        'JALUR B1 - PESAN MASUK WHATSAPP PERTAMA DARI CALON PEMBELI (SPEED-TO-LEAD §7.2):',
        `- Isi pesan masuk dari Customer: "${lastCust || recentNotesTail}"`,
        '- ATURAN WAJIB:',
        '  1. Sapa customer dengan hangat dan sebut nama SE + The Park Townhouse Sukoharjo.',
        '  2. Jawab LANGSUNG inti pertanyaan customer (jika tanya harga, sebut rentang resmi mulai Rp650 juta / unit yang relevan, jangan menyembunyikan informasi).',
        '  3. Berikan 2-3 keunggulan utama proyek yang paling relevan dengan pesan mereka (mis. 2 lantai Japandi Modern, garasi dalam, one-gate RFID + CCTV 24 jam, clubhouse kolam renang/gym/mini golf tanpa biaya membership).',
        '  4. Sisipkan 1-2 pertanyaan kualifikasi BANT secara natural (Playbook §5.3: rencana hunian keluarga/investasi, preferensi skema KPR/cash bertahap/cash keras, dan ajakan jadwal melihat lokasi/show unit).',
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
      'Cadence Penguncian Janji Survei Lokasi (Tahap 4 Appointment - Playbook §7.4): Konfirmasi hari & jam kunjungan ke Jombor, pastikan pengambil keputusan (pasangan/keluarga) ikut hadir, dan sampaikan bahwa simulasi resmi serta unit prioritas sudah disiapkan untuk ditinjau langsung.';
  } else if (stage === 'VISITED') {
    cadenceRule =
      'Cadence Pasca-Survei Lokasi (Playbook §7.5 & §7.7): Ucapkan terima kasih sudah melihat langsung lokasi & unit di Jombor, rangkum impresi unit yang disukai, tawarkan pengiriman simulasi tertulis resmi, dan dorong langkah penguncian unit.';
  } else if (stage === 'HOT_NEGOTIATION') {
    cadenceRule =
      'Cadence Negosiasi & Penawaran Tertulis (Playbook §7.6 & §7.7 Hari 5-7): Tindak lanjuti simulasi pembayaran tertulis, atasi keberatan harga/skema (Bab 10), ingatkan ketersediaan unit terbatas (hanya 35 unit di seluruh proyek & kenaikan harga bertahap Rp50 juta/bulan sesuai §2.5), dan arahkan ke Booking Fee Rp5 juta.';
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
    guidanceText: [
      'JALUR A - LEAD INPUT MANUAL SE (PROSPEK SUDAH PERNAH BERTEMU / BERDISKUSI DENGAN SALES):',
      `- Konteks pertemuan awal: ${meetingContext} (Sumber: ${input.source}).`,
      `- Strategi Cadence Playbook §7.7: ${cadenceRule}`,
      '- ATURAN MUTLAK JALUR A:',
      '  1. DILARANG KERAS menulis kalimat seperti chatbot CS: "Terima kasih sudah menghubungi The Park Townhouse Sukoharjo". Prospek ini TIDAK sedang mengirim chat pertama ke bot, melainkan sales yang melakukan FOLLOW-UP hangat setelah bertemu/berbicara!',
      '  2. Buka dengan sapaan personal yang menghormati gelar/profesi prospek (mis. "Selamat sore, Dokter Andi" atau "Selamat siang, Pak Hendra"), lalu sebutkan apresiasi atas pertemuan/diskusi tadi.',
      '  3. Hubungkan langsung catatan kebutuhan di lapangan (salesNotes & dimensi Persona) dengan solusi konkret unit yang diminati (harga resmi, konsep 2 lantai Japandi Modern, garasi dalam, one-gate RFID + CCTV 24 jam, clubhouse kolam renang/gym/mini golf tanpa iuran membership).',
      '  4. Jika skor Authority < 2 (mis. datang sendiri atau harus diskusi pasangan/orang tua), WAJIB ajak prospek datang kembali bersama istri/suami/keluarga pada akhir pekan (Sabtu/Minggu) untuk melihat langsung lokasi dan clubhouse.',
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
    if (/\b(booking|ambil| jadi|cocok|lanjut)\b/i.test(lastCust)) {
      return [
        `Alhamdulillah, senang sekali mendengarnya ${salutation} 🙏 Terima kasih banyak atas kepercayaannya pada The Park Townhouse Sukoharjo.`,
        '',
        `Untuk kunjungan survei lokasi nanti, saya sudah blokirkan waktu khusus dan menyiapkan unit prioritas ${input.unitInterest} (${priceText}, skema ${humanScheme}) beserta dokumen simulasi resminya agar ${shortCall} bisa mengecek fisik bangunan 2 lantai Japandi Modern, garasi dalam, dan fasilitas clubhouse secara langsung.`,
        '',
        `Jika setelah melihat unit di lokasi ${shortCall} sudah mantap, penguncian unit (Booking Fee resmi Rp5 juta) nantinya dilakukan langsung ke rekening resmi PT Andara Rejo Makmur agar unit tersebut otomatis terkunci atas nama ${shortCall}. Sampai bertemu di lokasi Jombor ya, ${shortCall}!`,
      ].join('\n');
    }

    if (stage === 'APPOINTMENT' && !prevDraft.includes('agenda kunjungan')) {
      return [
        `Siap ${salutation}, agenda kunjungan survei ke The Park Townhouse Sukoharjo (Jombor, Bendosari) sudah saya kunci untuk ${shortCall} 🙏`,
        '',
        `Nanti di lokasi kita akan langsung meninjau fisik ${input.unitInterest} (${priceText}, skema ${humanScheme}), mengecek kualitas bangunan 2 lantai Japandi Modern, sistem keamanan one-gate RFID + CCTV 4K 24 jam, serta area clubhouse (kolam renang, gym, mini golf) tanpa biaya membership.`,
        '',
        `Apakah nanti ${shortCall} hadir bersama pasangan/keluarga supaya sekalian saya siapkan simulasi angka dan opsi unit pembandingnya di meja diskusi?`,
      ].join('\n');
    }

    return [
      `Baik ${salutation}, menyambung pesan sebelumnya mengenai ${input.unitInterest} dengan skema ${humanScheme} (${priceText}).`,
      '',
      `Untuk memastikan semua pertimbangan ${shortCall} sekeluarga terjawab tuntas — mulai dari tata ruang 2 lantai Japandi Modern, garasi dalam, keamanan one-gate RFID & CCTV 24 jam, hingga akses clubhouse (kolam renang, gym, mini golf) tanpa biaya membership — saya sudah siapkan rincian simulasi resminya.`,
      '',
      `Kira-kira bagian mana yang paling ingin ${shortCall} sesuaikan lebih dulu: simulasi pembayarannya, atau kita jadwalkan melihat langsung unitnya di Jombor akhir pekan ini?`,
    ].join('\n');
  }

  if (guidance.trackType === 'WA_FIRST_RESPONSE') {
    return [
      `Halo ${salutation}, salam kenal. Saya ${input.seName} dari The Park Townhouse Sukoharjo (Jombor, Bendosari).`,
      '',
      `Menjawab pertanyaan ${shortCall}: untuk ${input.unitInterest} saat ini ditawarkan dengan harga resmi ${priceText} (tersedia skema ${humanScheme}). Setiap unit sudah mengusung desain 2 lantai Japandi Modern dengan garasi dalam, sistem keamanan one-gate RFID + CCTV 24 jam, serta fasilitas clubhouse (kolam renang, gym, mini golf) tanpa biaya membership bulanan.`,
      '',
      `Supaya saya kirimkan denah dan simulasi angka yang paling pas: rencananya rumah ini untuk dihuni sendiri bersama keluarga atau investasi, ${shortCall}? Dan bila berkenan, apakah akhir pekan ini ada waktu luang untuk mampir melihat lokasinya langsung?`,
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
  // Bersihkan kebocoran kode enum mentah bila AI tidak sengaja menulisnya
  clean = clean
    .replace(/\bCASH_KERAS\b/g, 'cash keras')
    .replace(/\bCASH_TEMPO_12\b/g, 'cash bertahap 12 bulan')
    .replace(/\bCASH_TEMPO_24\b/g, 'cash bertahap 24 bulan');

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
    `- Sapa dengan "${salutation}" (JANGAN tulis "Bapak/Ibu ${input.fullName}" atau enum "CASH_KERAS").`,
    `- Skema pembayaran ditulis "${humanScheme}". Format 3-4 paragraf WhatsApp rapi (boleh bullet • untuk 3-4 keunggulan utama unit).`,
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
