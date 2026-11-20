// ============================================================================
// DEVELOPER SALES OS - UNIT BOOKING & TRANSACTIONAL LOCK (Blueprint v1.2 Bab 08)
// Pencegahan Double-Booking Dijamin Lock Transaksi di Database Level
// Status Unit: available -> hold -> booked -> sold
// ============================================================================

export type UnitStatus = 'tersedia' | 'hold' | 'booking' | 'terjual';

export interface UnitInventoryItem {
  id: string;
  projectId: string;
  unitNumber: string;
  cluster: string;
  type: string;
  priceIdr: number;
  status: UnitStatus;
  lockedByLeadId?: string;
  lockedAt?: string;
}

// In-memory mutex simulator for unit testing concurrent requests
const unitMutexes = new Map<string, boolean>();

// In-memory unit registry for transactional simulation
export const MOCK_UNITS_STORE = new Map<string, UnitInventoryItem>();

export function initializeMockUnits(units: UnitInventoryItem[]) {
  MOCK_UNITS_STORE.clear();
  for (const u of units) {
    MOCK_UNITS_STORE.set(u.id, { ...u });
  }
}

export interface BookingResult {
  success: boolean;
  message: string;
  unit?: UnitInventoryItem;
  bookingCode?: string;
  error?: 'ALREADY_BOOKED' | 'ALREADY_LOCKED' | 'INVALID_STATUS' | 'CONCURRENCY_CONFLICT';
}

/**
 * Transaksi pemesanan unit dengan garansi isolasi locking (SELECT ... FOR UPDATE)
 * Jika dua request datang bersamaan untuk unit yang sama, hanya satu yang berhasil mengunci.
 */
export async function bookUnitWithTransactionLock(
  unitId: string,
  leadId: string,
  buyerName: string,
  bookingFeeIdr: number
): Promise<BookingResult> {
  // Simulasi row-level lock (DB Transaction Lock)
  if (unitMutexes.get(unitId)) {
    return {
      success: false,
      message: `Konflik Transaksi: Unit #${unitId} sedang dalam proses transaksi lain. Mohon coba beberapa detik lagi.`,
      error: 'CONCURRENCY_CONFLICT'
    };
  }

  // Pasang lock transaksional
  unitMutexes.set(unitId, true);

  try {
    // Simulasi delay I/O database (10-30ms)
    await new Promise(resolve => setTimeout(resolve, 20));

    const unit = MOCK_UNITS_STORE.get(unitId);
    if (!unit) {
      return {
        success: false,
        message: `Unit dengan ID ${unitId} tidak ditemukan.`,
        error: 'INVALID_STATUS'
      };
    }

    if (unit.status !== 'tersedia') {
      return {
        success: false,
        message: `Unit kavling ${unit.unitNumber} (${unit.cluster}) tidak lagi berstatus 'tersedia' (Status saat ini: ${unit.status}).`,
        error: unit.status === 'booking' || unit.status === 'terjual' ? 'ALREADY_BOOKED' : 'ALREADY_LOCKED'
      };
    }

    // Transisi status menjadi 'booking'
    const updatedUnit: UnitInventoryItem = {
      ...unit,
      status: 'booking',
      lockedByLeadId: leadId,
      lockedAt: new Date().toISOString()
    };

    MOCK_UNITS_STORE.set(unitId, updatedUnit);

    const bookingCode = `BK-${unit.unitNumber}-${Date.now().toString().slice(-4)}`;

    return {
      success: true,
      message: `Unit ${unit.unitNumber} berhasil dibooking untuk ${buyerName}. Tanda jadi Rp ${bookingFeeIdr.toLocaleString('id-ID')} tercatat.`,
      unit: updatedUnit,
      bookingCode
    };
  } finally {
    // Lepas lock transaksional setelah commit
    unitMutexes.delete(unitId);
  }
}
