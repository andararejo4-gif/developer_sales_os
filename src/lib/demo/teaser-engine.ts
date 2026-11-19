// Mesin Pemotongan Cuplikan Demo (Bagian 4A)
// ATURAN KERAS: Data yang diburamkan TIDAK BOLEH dikirim ke browser.
// Pemotongan dilakukan di tingkat data layer (mengganti item > 25% dengan placeholder aman).

export interface TeaserResult<T> {
  visible_items: T[];
  total_original_count: number;
  teaser_percent: number;
  is_truncated: boolean;
  lock_notice: string;
}

/**
 * Memotong array data menjadi hanya 25% teratas (default) untuk akun demo.
 * Sisanya diganti dengan placeholder tanpa menyertakan data sensitif ke browser.
 */
export function applyDemoTeaser<T>(
  items: T[],
  isDemoAccount: boolean,
  teaserPercent = 25,
  lockMessage = "Buka data lengkap dengan paket Gold / Platinum / Diamond"
): TeaserResult<T> {
  if (!isDemoAccount) {
    return {
      visible_items: items,
      total_original_count: items.length,
      teaser_percent: 100,
      is_truncated: false,
      lock_notice: ""
    };
  }

  const visibleCount = Math.max(1, Math.ceil((items.length * teaserPercent) / 100));
  const truncatedList = items.slice(0, visibleCount);

  return {
    visible_items: truncatedList,
    total_original_count: items.length,
    teaser_percent: teaserPercent,
    is_truncated: items.length > visibleCount,
    lock_notice: lockMessage
  };
}

/**
 * Memverifikasi ketiadaan kata-kata terlarang / desakan / countdown fiktif
 * Dilarang: 'sisa x hari', 'hitung mundur', 'segera habis', 'diskon terbatas'
 */
const FORBIDDEN_PRESSURE_PATTERNS = [
  /sisa\s+\d+\s+hari/i,
  /hitung\s+mundur/i,
  /segera\s+(habis|berakhir|klaim)/i,
  /kesempatan\s+terakhir/i,
  /diskon\s+\d+%/i,
  /harga\s+coret/i,
  /stok\s+terbatas/i,
  /hampir\s+habis/i
];

export function validateNoPressureWords(text: string): { hasViolation: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const pattern of FORBIDDEN_PRESSURE_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(`Teks melanggar aturan etis: ditemukan kata desakan/urgensi palsu (${pattern})`);
    }
  }
  return {
    hasViolation: violations.length > 0,
    violations
  };
}
