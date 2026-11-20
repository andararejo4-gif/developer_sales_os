// ============================================================================
// DEVELOPER SALES OS - GERBANG KESIAPAN G0 - G3 (Blueprint v1.2 Bab 05)
// Menjaga agar sistem tidak pernah mengirim pesan/iklan eksternal tanpa mandat
// ============================================================================

export interface GateStatus {
  gate: 'G0' | 'G1' | 'G2' | 'G3';
  code: string;
  name: string;
  isPassed: boolean;
  canExecuteExternal: boolean;
  requirements: string[];
  blockers: string[];
  statusLabel: 'DRAFT_SIMULASI' | 'PUBLISH_ALLOWED' | 'ACQUISITION_ACTIVE' | 'TRANSACTION_READY';
}

export interface ProjectGatesState {
  projectId: string;
  g0_draft_ready: boolean;
  g1_publish_ready: boolean;
  g2_demand_ready: boolean;
  g3_transaction_ready: boolean;
  metadata?: Record<string, any>;
}

export function evaluateProjectGates(state: ProjectGatesState): Record<'G0' | 'G1' | 'G2' | 'G3', GateStatus> {
  return {
    G0: {
      gate: 'G0',
      code: 'G0_DRAFT',
      name: 'G0 · Draft-ready',
      isPassed: state.g0_draft_ready,
      canExecuteExternal: false,
      requirements: ['Akun tenant terdaftar', 'Bahan brosur/pricelist/koordinat terunggah', 'Enam draf keluaran tergenerate'],
      blockers: state.g0_draft_ready ? [] : ['Belum mengunggah minimal 3 bahan proyek'],
      statusLabel: 'DRAFT_SIMULASI'
    },
    G1: {
      gate: 'G1',
      code: 'G1_PUBLISH',
      name: 'G1 · Publish-ready',
      isPassed: state.g1_publish_ready,
      canExecuteExternal: true,
      requirements: ['Identitas bisnis terverifikasi', 'Otorisasi proyek & PIC approval', 'Brand kit & legal readiness', 'Domain/DNS siap'],
      blockers: state.g1_publish_ready ? [] : ['Menunggu PIC approval untuk rilis publikasi website/konten'],
      statusLabel: 'PUBLISH_ALLOWED'
    },
    G2: {
      gate: 'G2',
      code: 'G2_DEMAND',
      name: 'G2 · Demand-ready',
      isPassed: state.g2_demand_ready,
      canExecuteExternal: true,
      requirements: ['Akun iklan & metode bayar terhubung', 'Anggaran terverifikasi', 'WhatsApp resmi (BSP/Cloud API) & template opt-in', 'Privacy notice aktif'],
      blockers: state.g2_demand_ready ? [] : ['Menunggu koneksi WhatsApp resmi dan akun iklan berizin'],
      statusLabel: 'ACQUISITION_ACTIVE'
    },
    G3: {
      gate: 'G3',
      code: 'G3_TRANSACTION',
      name: 'G3 · Transaction-ready',
      isPassed: state.g3_transaction_ready,
      canExecuteExternal: true,
      requirements: ['Stok unit real-time/ERP tersinkron', 'Rekening bank developer masuk whitelist', 'Ketentuan booking & refund disahkan legal', 'Consent formulir pembeli aktif'],
      blockers: state.g3_transaction_ready ? [] : ['Rekening bank belum di-whitelist oleh 2 pihak berwenang'],
      statusLabel: 'TRANSACTION_READY'
    }
  };
}

/**
 * Validasi apakah suatu aksi operasional diizinkan oleh gerbang yang aktif
 */
export function assertActionAllowedByGate(
  requiredGate: 'G0' | 'G1' | 'G2' | 'G3',
  state: ProjectGatesState
): { allowed: boolean; reason?: string } {
  if (requiredGate === 'G0' && !state.g0_draft_ready) {
    return { allowed: false, reason: 'Gerbang G0 belum terpenuhi: proyek masih membutuhkan data input dasar.' };
  }
  if (requiredGate === 'G1' && !state.g1_publish_ready) {
    return { allowed: false, reason: 'Gerbang G1 belum aktif: rilis website atau konten membutuhkan persetujuan PIC resmi.' };
  }
  if (requiredGate === 'G2' && !state.g2_demand_ready) {
    return { allowed: false, reason: 'Gerbang G2 belum aktif: iklan berbayar atau pesan blast WhatsApp diblokir demi keamanan anggaran.' };
  }
  if (requiredGate === 'G3' && !state.g3_transaction_ready) {
    return { allowed: false, reason: 'Gerbang G3 belum aktif: transaksi booking dan pengiriman nomor rekening membutuhkan otorisasi finance & legal.' };
  }
  return { allowed: true };
}
