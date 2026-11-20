// ============================================================================
// DEVELOPER SALES OS - TRUTH LAYER & CLAIM LEDGER (Blueprint v1.2 Bab 05 & M01)
// Menjaga kebenaran produk: setiap klaim diikat pada fact_id, sumber, dan status.
// Unknown tetap unknown, memicu pertanyaan ke PIC, bukan halusinasi.
// ============================================================================

export type ClaimStatus = 'terverifikasi' | 'perlu_dicek' | 'unknown';
export type ClaimCategory = 'aktual' | 'rencana' | 'ilustrasi';

export interface ClaimItem {
  id: string;
  tenant_id: string;
  project_id: string;
  fact_id: string; // KB-001, SPEC-012, LOC-003, dsb.
  klaim_teks: string;
  sumber_dokumen?: string;
  halaman?: string;
  status: ClaimStatus;
  kategori: ClaimCategory;
  versi: number;
  disclaimer_wajib?: string;
  created_at: string;
}

export interface ClaimValidationReport {
  isReleaseReady: boolean;
  totalClaims: number;
  verifiedCount: number;
  needsCheckCount: number;
  unknownCount: number;
  unverifiedClaims: ClaimItem[];
  blockerReasons: string[];
}

/**
 * Validasi apakah rangkaian klaim layak dipublikasikan ke kanal eksternal (Gerbang G1+)
 * Klaim dengan status 'unknown' atau 'perlu_dicek' pada aspek kritis (harga, rekening, legalitas)
 * memblokir rilis eksternal dan mewajibkan eskalasi ke PIC.
 */
export function validateClaimsForRelease(claims: ClaimItem[]): ClaimValidationReport {
  const verified = claims.filter(c => c.status === 'terverifikasi');
  const needsCheck = claims.filter(c => c.status === 'perlu_dicek');
  const unknown = claims.filter(c => c.status === 'unknown');

  const blockers: string[] = [];

  // Aspek kritis: harga, rekening, legalitas, stok
  const criticalPatterns = /harga|cicilan|rekening|bank|shm|pbg|izin|stok|unit/i;

  for (const c of claims) {
    if (c.status !== 'terverifikasi') {
      if (criticalPatterns.test(c.klaim_teks)) {
        blockers.push(`Klaim kritis tidak terverifikasi: "${c.klaim_teks.slice(0, 60)}..." (Status: ${c.status})`);
      }
    }
  }

  return {
    isReleaseReady: blockers.length === 0 && unknown.length === 0,
    totalClaims: claims.length,
    verifiedCount: verified.length,
    needsCheckCount: needsCheck.length,
    unknownCount: unknown.length,
    unverifiedClaims: [...needsCheck, ...unknown],
    blockerReasons: blockers
  };
}

/**
 * Normalisasi caveat untuk ilustrasi dan render 3D
 */
export function getRequiredDisclaimer(category: ClaimCategory): string | undefined {
  if (category === 'ilustrasi') {
    return 'Gambar dan visualisasi merupakan ilustrasi arsitektural (artist impression); spesifikasi teknis mengacu pada dokumen kontrak resmi.';
  }
  if (category === 'rencana') {
    return 'Fasilitas dalam tahap rencana pengembangan; realisasi waktu bergantung pada tahapan pembangunan kawasan pengembang.';
  }
  return undefined;
}
