// Validator Otomatis Guardrail Surat Cinta 99 Keunggulan
// Menguji kepatuhan terhadap 5 aturan konten:
// 1. Tepat 99 poin
// 2. Tanpa janji berlebihan / overpromise (pasti untung, pasti naik, jaminan return)
// 3. Tidak menyebut jadwal/perencanaan internal developer
// 4. Tidak ada superlatif mutlak tak berbukti (terbaik se-indonesia, nomor satu di dunia)
// 5. Jarak/waktu tempuh wajib berformat "sekitar"

import { LoveLetterPoint } from './points-data';

export interface ValidationIssue {
  pointNumber?: number;
  type: 'error' | 'warning';
  rule: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  totalPoints: number;
  passedCount: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: string;
}

// Pola kata/frasa terlarang (Forbidden Patterns)
const FORBIDDEN_WORDS = [
  { pattern: /\bpasti\s+(untung|naik|cuan|kaya)\b/i, rule: "Dilarang menjanjikan keuntungan/kenaikan harga mutlak" },
  { pattern: /\b(jaminan|garansi)\s+(investasi|return|roi|keuntungan)\b/i, rule: "Dilarang memberi jaminan investasi palsu" },
  { pattern: /\bbebas\s+risiko\b/i, rule: "Dilarang mengklaim bebas risiko" },
  { pattern: /\bterbaik\s+se-(indonesia|dunia|asia|jawa)\b/i, rule: "Dilarang superlatif tanpa bukti objektif" },
  { pattern: /\bnomor\s+(satu|1)\s+di\s+(indonesia|dunia)\b/i, rule: "Dilarang klaim peringkat nomor satu tanpa audit resmi" },
  { pattern: /\b(jadwal|rencana)\s+internal\s+developer\b/i, rule: "Dilarang memaparkan jadwal/rencana internal pengembang" },
  { pattern: /\bpasti\s+laku\b/i, rule: "Dilarang spekulasi pasar mutlak" },
];

export function validateLoveLetter(points: LoveLetterPoint[]): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Aturan 1: Tepat 99 Poin
  if (points.length !== 99) {
    errors.push({
      type: 'error',
      rule: 'Aturan Panjang Dokumen',
      message: `Jumlah poin harus tepat 99 poin, saat ini terhitung ${points.length} poin.`
    });
  }

  // Periksa per poin
  let passedCount = 0;

  points.forEach((p, idx) => {
    let pointHasError = false;
    const combinedText = `${p.title} ${p.narrative}`.toLowerCase();

    // Cek nomor urut
    if (p.number !== idx + 1) {
      errors.push({
        pointNumber: p.number,
        type: 'error',
        rule: 'Penomoran Urut',
        message: `Poin ke-${idx + 1} memiliki nomor ${p.number}.`
      });
      pointHasError = true;
    }

    // Cek kelengkapan
    if (!p.title || p.title.trim().length < 5) {
      errors.push({
        pointNumber: p.number,
        type: 'error',
        rule: 'Kelengkapan Judul',
        message: `Poin #${p.number} tidak memiliki judul yang memadai.`
      });
      pointHasError = true;
    }

    if (!p.narrative || p.narrative.trim().length < 20) {
      errors.push({
        pointNumber: p.number,
        type: 'error',
        rule: 'Kelengkapan Narasi',
        message: `Poin #${p.number} narasi editorial terlalu pendek (minimal 20 karakter).`
      });
      pointHasError = true;
    }

    // Aturan 2, 3, 4: Cek kata terlarang
    for (const fw of FORBIDDEN_WORDS) {
      if (fw.pattern.test(combinedText)) {
        errors.push({
          pointNumber: p.number,
          type: 'error',
          rule: fw.rule,
          message: `Poin #${p.number} melanggar guardrail: ditemukan kata terlarang (${fw.rule}).`
        });
        pointHasError = true;
      }
    }

    // Aturan 5: Jarak / Waktu Tempuh harus berformat "sekitar"
    // Misal jika ada kata "menit" atau "km", harus didahului "sekitar"
    const distanceRegex = /(\d+\s*(?:menit|km|kilometer|meter))/i;
    if (distanceRegex.test(combinedText)) {
      if (!combinedText.includes('sekitar') && !combinedText.includes('radius')) {
        warnings.push({
          pointNumber: p.number,
          type: 'warning',
          rule: 'Format Jarak Faktual',
          message: `Poin #${p.number} menyebutkan estimasi waktu/jarak tanpa kata 'sekitar'. Disarankan menggunakan 'sekitar ...'`
        });
      }
    }

    if (!pointHasError) {
      passedCount++;
    }
  });

  const isValid = errors.length === 0 && points.length === 99;

  return {
    isValid,
    totalPoints: points.length,
    passedCount,
    errors,
    warnings,
    summary: isValid
      ? `Lolos Validasi 100%! Tepat 99 poin editorial, bebas klaim berlebihan dan mematuhi seluruh guardrail.`
      : `Gagal Validasi: Ditemukan ${errors.length} pelanggaran aturan guardrail.`
  };
}
