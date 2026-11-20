// Validator Otomatis Guardrail Surat Cinta Hingga 99 Keunggulan (Blueprint v1.2 Bab 05)
// Aturan:
// 1. "Sampai 99 Poin" (maksimal 99). Bila fakta bersumber kurang dari 99, laporkan daftar gap (butuh data: ...), JANGAN isi klaim fiktif.
// 2. Tanpa janji berlebihan / overpromise (pasti untung, pasti naik, jaminan return)
// 3. Tidak menyebut jadwal/perencanaan internal developer
// 4. Tidak ada superlatif mutlak tak berbukti (terbaik se-indonesia, nomor satu di dunia)
// 5. Jarak/waktu tempuh wajib berformat "sekitar"
// 6. Setiap klaim bersumber fakta (fact_id) atau caveat bila ilustrasi

import { LoveLetterPoint } from './points-data';

export interface ValidationIssue {
  pointNumber?: number;
  type: 'error' | 'warning';
  rule: string;
  message: string;
}

export interface DataGap {
  category: string;
  missingCount: number;
  neededDataPrompt: string;
}

export interface ValidationResult {
  isValid: boolean;
  totalPoints: number;
  passedCount: number;
  gapCount: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  gaps: DataGap[];
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
  const gaps: DataGap[] = [];

  // Aturan 1: Maksimal 99 Poin
  if (points.length > 99) {
    errors.push({
      type: 'error',
      rule: 'Batas Maksimum Dokumen',
      message: `Jumlah keunggulan tidak boleh melebihi 99 poin (saat ini ${points.length} poin).`
    });
  }

  // Hitung Gap jika fakta kurang dari 99 (Blueprint v1.2: "sampai 99; fakta kurang = gap, bukan diisi fiktif")
  const gapCount = Math.max(0, 99 - points.length);
  if (gapCount > 0) {
    warnings.push({
      type: 'warning',
      rule: 'Kesenjangan Fakta (Data Gap)',
      message: `Dokumen memiliki ${points.length} poin bersumber. Terdapat gap ${gapCount} keunggulan yang membutuhkan konfirmasi data faktual tambahan.`
    });

    gaps.push({
      category: 'Fasilitas & Spesifikasi Tambahan',
      missingCount: gapCount,
      neededDataPrompt: `Butuh data tambahan: ${gapCount} poin spesifikasi/fasilitas/legalitas dari developer untuk melengkapi hingga 99 keunggulan.`
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

    // Aturan 5: Estimasi jarak/waktu wajib menggunakan kata 'sekitar'
    if (/(menit|km|meter|detik)\b/i.test(combinedText)) {
      if (!/sekitar|estimasi|kurang lebih|jarak tempuh/i.test(combinedText)) {
        warnings.push({
          pointNumber: p.number,
          type: 'warning',
          rule: 'Format Jarak Estimatif',
          message: `Poin #${p.number} menyebut waktu/jarak tanpa kata 'sekitar'. Disarankan menambahkan untuk kepatuhan hukum.`
        });
      }
    }

    if (!pointHasError) {
      passedCount++;
    }
  });

  const isValid = errors.length === 0 && points.length > 0;
  const summary = isValid 
    ? (gapCount === 0 
        ? `Lolos Guardrail Sempurna: Tepat 99 poin tervalidasi bebas dari kata terlarang.`
        : `Lolos Guardrail Bersumber: ${points.length} poin tervalidasi. Teridentifikasi gap ${gapCount} data yang dilaporkan secara transparan.`)
    : `Gagal Validasi: Ditemukan ${errors.length} pelanggaran guardrail.`;

  return {
    isValid,
    totalPoints: points.length,
    passedCount,
    gapCount,
    errors,
    warnings,
    gaps,
    summary
  };
}
