import { THE_PARK_KB_FACTS } from './the-park-facts';
import { KbFact } from './types';

export interface QAResult {
  question: string;
  answer: string;
  source_citation?: string;
  fact_id?: string;
  foundInKb: boolean;
  isOutOfScope: boolean;
}

export function askProductKnowledge(
  question: string,
  isPublicVisitor = false,
  customFacts: KbFact[] = THE_PARK_KB_FACTS
): QAResult {
  const qLower = question.toLowerCase().trim();
  const availableFacts = isPublicVisitor 
    ? customFacts.filter(f => f.boleh_publik)
    : customFacts;

  // Pertanyaan di luar data produk / melanggar guardrail
  const outOfScopePatterns = [
    { pattern: /kolam\s+renang/i, label: 'fasilitas kolam renang' },
    { pattern: /(kenaikan|proyeksi)\s+harga|investasi\s+5\s+tahun/i, label: 'proyeksi kenaikan harga' },
    { pattern: /ipo|saham\s+developer/i, label: 'rencana internal perusahaan' },
    { pattern: /kontraktor\s+internal|jadwal\s+internal/i, label: 'jadwal/kontraktor internal' },
    { pattern: /laba\s+bersih|profit\s+developer/i, label: 'laba internal developer' },
  ];

  for (const oos of outOfScopePatterns) {
    if (oos.pattern.test(qLower)) {
      return {
        question,
        answer: "Datanya belum ada di brosur/pricelist, perlu dikonfirmasi developer.",
        foundInKb: false,
        isOutOfScope: true
      };
    }
  }

  // 0. Identitas & Nama Proyek & Pengembang
  if (qLower.includes('nama proyek') || qLower.includes('pengembang') || qLower.includes('developer') || qLower.includes('siapa yang bangun')) {
    const factNama = availableFacts.find(f => f.fact_id === 'KB-ID-01');
    const factDev = availableFacts.find(f => f.fact_id === 'KB-ID-02');
    return {
      question,
      answer: `Nama proyek: ${factNama?.value}. Pengembang resmi: ${factDev?.value}.`,
      source_citation: `${factNama?.source_citation}; ${factDev?.source_citation}`,
      fact_id: 'KB-ID-01,KB-ID-02',
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 1. Tipe Diamond & Nagoya
  if (qLower.includes('diamond') || (qLower.includes('nagoya') && (qLower.includes('harga') || qLower.includes('tipe')))) {
    const factTipe = availableFacts.find(f => f.fact_id === 'KB-TIPE-01');
    const factHarga = availableFacts.find(f => f.fact_id === 'KB-TIPE-02');
    return {
      question,
      answer: `Tipe Diamond di Cluster Nagoya: ${factTipe?.value}. Harga: ${factHarga?.value}.`,
      source_citation: `${factTipe?.source_citation} & ${factHarga?.source_citation}`,
      fact_id: 'KB-TIPE-01,KB-TIPE-02',
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 2. Tipe Gold & Osaka
  if (qLower.includes('gold') || (qLower.includes('osaka') && (qLower.includes('harga') || qLower.includes('tipe')))) {
    const factTipe = availableFacts.find(f => f.fact_id === 'KB-TIPE-03');
    const factHarga = availableFacts.find(f => f.fact_id === 'KB-TIPE-04');
    return {
      question,
      answer: `Tipe Gold di Cluster Osaka: ${factTipe?.value}. Harga: ${factHarga?.value}.`,
      source_citation: `${factTipe?.source_citation} & ${factHarga?.source_citation}`,
      fact_id: 'KB-TIPE-03,KB-TIPE-04',
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 3. Tipe Emerald & Tokyo
  if (qLower.includes('emerald') || (qLower.includes('tokyo') && (qLower.includes('harga') || qLower.includes('tipe')))) {
    const factTipe = availableFacts.find(f => f.fact_id === 'KB-TIPE-05');
    const factHarga = availableFacts.find(f => f.fact_id === 'KB-TIPE-06');
    return {
      question,
      answer: `Tipe Emerald di Cluster Tokyo: ${factTipe?.value}. Harga: ${factHarga?.value}.`,
      source_citation: `${factTipe?.source_citation} & ${factHarga?.source_citation}`,
      fact_id: 'KB-TIPE-05,KB-TIPE-06',
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 4. Jarak RSUD
  if (qLower.includes('rsud') || qLower.includes('rumah sakit')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-LOK-05');
    return {
      question,
      answer: `Jarak ke RSUD Ir. Soekarno: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 5. Jarak Alun-alun
  if (qLower.includes('alun-alun') || qLower.includes('alun alun')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-LOK-06');
    return {
      question,
      answer: `Jarak ke Alun-Alun Satya Negara Sukoharjo: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 6. Jarak Mall Solo Baru
  if (qLower.includes('the park mall') || qLower.includes('solo baru') || qLower.includes('mall')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-LOK-07');
    return {
      question,
      answer: `Jarak ke The Park Mall Solo Baru: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 7. Stasiun Sukoharjo
  if (qLower.includes('stasiun')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-LOK-08');
    return {
      question,
      answer: `Jarak ke Stasiun Sukoharjo: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 8. Legalitas SHM
  if (qLower.includes('shm') || qLower.includes('sertifikat')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-LEG-01');
    return {
      question,
      answer: `Status sertifikat: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 9. Izin PBG
  if (qLower.includes('pbg') || qLower.includes('imb') || qLower.includes('izin')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-LEG-02');
    return {
      question,
      answer: `Perizinan gedung: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 10. Skema Bayar & Cash Tempo
  if (qLower.includes('tempo') || qLower.includes('cicil') || qLower.includes('cash keras') || qLower.includes('skema bayar')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-BAYAR-01');
    return {
      question,
      answer: `Pilihan pembayaran: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 11. Bank KPR
  if (qLower.includes('kpr') || qLower.includes('bank')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-BAYAR-02');
    return {
      question,
      answer: `Kerja sama KPR: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 12. Listrik & Utilitas
  if (qLower.includes('listrik') || qLower.includes('daya') || qLower.includes('pln')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-SPEK-05');
    return {
      question,
      answer: `Kelistrikan: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 13. Pondasi & Struktur
  if (qLower.includes('pondasi') || qLower.includes('struktur')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-SPEK-01');
    return {
      question,
      answer: `Spesifikasi pondasi: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 14. Plafon
  if (qLower.includes('plafon') || qLower.includes('ceiling') || qLower.includes('tinggi')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-SPEK-04');
    return {
      question,
      answer: `Ketinggian plafon: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // 15. Keamanan & Gerbang
  if (qLower.includes('keamanan') || qLower.includes('security') || qLower.includes('cctv') || qLower.includes('gerbang')) {
    const fact = availableFacts.find(f => f.fact_id === 'KB-FAS-01');
    return {
      question,
      answer: `Fasilitas keamanan: ${fact?.value}.`,
      source_citation: fact?.source_citation,
      fact_id: fact?.fact_id,
      foundInKb: true,
      isOutOfScope: false
    };
  }

  // Fallback default jika tidak ada kata kunci yang cocok
  return {
    question,
    answer: "Datanya belum ada di brosur/pricelist, perlu dikonfirmasi developer.",
    foundInKb: false,
    isOutOfScope: true
  };
}

// 20 PERTANYAAN UJI PENERIMAAN FASE 1A
export const KB_20_ACCEPTANCE_TESTS = [
  // 15 Pertanyaan Faktual
  { q: "Apa nama proyek dan siapa pengembangnya?", expectedIncludes: "The Park Townhouse Sukoharjo", expectFound: true },
  { q: "Berapa tipe luas tanah dan bangunan untuk cluster Nagoya?", expectedIncludes: "75/90", expectFound: true },
  { q: "Berapa harga cash keras tipe Diamond?", expectedIncludes: "830.000.000", expectFound: true },
  { q: "Berapa harga tipe Gold di cluster Osaka?", expectedIncludes: "670.000.000", expectFound: true },
  { q: "Berapa luas tipe Emerald di cluster Tokyo?", expectedIncludes: "50/60", expectFound: true },
  { q: "Berapa harga termurah tipe Emerald?", expectedIncludes: "580.000.000", expectFound: true },
  { q: "Berapa jarak ke RSUD Ir. Soekarno Sukoharjo?", expectedIncludes: "2.1 km", expectFound: true },
  { q: "Berapa jarak ke Alun-Alun Sukoharjo?", expectedIncludes: "3.2 km", expectFound: true },
  { q: "Berapa waktu tempuh ke The Park Mall Solo Baru?", expectedIncludes: "12 menit", expectFound: true },
  { q: "Apakah stasiun Sukoharjo dekat dari perumahan?", expectedIncludes: "3.8 km", expectFound: true },
  { q: "Bagaimana status sertifikat tanah unit?", expectedIncludes: "Sertifikat Hak Milik (SHM)", expectFound: true },
  { q: "Apakah perizinan PBG sudah ada?", expectedIncludes: "Persetujuan Bangunan Gedung (PBG)", expectFound: true },
  { q: "Apakah bisa bayar cicil cash tempo 24 bulan?", expectedIncludes: "24 Bulan", expectFound: true },
  { q: "Bank mana saja yang bekerja sama untuk KPR?", expectedIncludes: "BTN", expectFound: true },
  { q: "Berapa daya listrik PLN yang dipasang?", expectedIncludes: "2.200 VA", expectFound: true },

  // 5 Pertanyaan Di Luar Data (Wajib dijawab 'Datanya belum ada di brosur/pricelist, perlu dikonfirmasi developer.')
  { q: "Apakah di perumahan ada fasilitas kolam renang olympic?", expectedIncludes: "Datanya belum ada di brosur/pricelist", expectFound: false },
  { q: "Berapa proyeksi kenaikan harga investasi 5 tahun lagi?", expectedIncludes: "Datanya belum ada di brosur/pricelist", expectFound: false },
  { q: "Kapan perusahaan developer ini akan IPO di bursa efek?", expectedIncludes: "Datanya belum ada di brosur/pricelist", expectFound: false },
  { q: "Siapa nama kontraktor internal yang mengerjakan jalan?", expectedIncludes: "Datanya belum ada di brosur/pricelist", expectFound: false },
  { q: "Berapa target laba bersih developer tahun ini?", expectedIncludes: "Datanya belum ada di brosur/pricelist", expectFound: false }
];
