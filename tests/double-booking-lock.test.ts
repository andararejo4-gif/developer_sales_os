import { describe, it, expect, beforeEach } from 'bun:test';
import {
  initializeMockUnits,
  bookUnitWithTransactionLock,
  UnitInventoryItem,
  MOCK_UNITS_STORE
} from '../src/lib/crm/booking-lock';

describe('Blueprint v1.2 Transactional Booking Lock (Double Booking Prevention)', () => {
  beforeEach(() => {
    const testUnits: UnitInventoryItem[] = [
      {
        id: 'unit-nagoya-01',
        projectId: 'proj-01',
        unitNumber: 'A-01',
        cluster: 'Nagoya Deluxe',
        type: 'Type 60/80',
        priceIdr: 850000000,
        status: 'tersedia'
      },
      {
        id: 'unit-tokyo-02',
        projectId: 'proj-01',
        unitNumber: 'B-02',
        cluster: 'Tokyo Executive',
        type: 'Type 75/95',
        priceIdr: 1150000000,
        status: 'tersedia'
      }
    ];
    initializeMockUnits(testUnits);
  });

  it('harus berhasil membooking unit berstatus tersedia', async () => {
    const result = await bookUnitWithTransactionLock('unit-nagoya-01', 'lead-01', 'dr. Hendra Kusuma', 10000000);
    expect(result.success).toBe(true);
    expect(result.bookingCode).toBeDefined();
    expect(result.unit?.status).toBe('booking');
  });

  it('harus mencegah double booking jika dua pembeli membooking unit yang sama secara paralel', async () => {
    // Jalankan dua request bersamaan (concurrent)
    const [res1, res2] = await Promise.all([
      bookUnitWithTransactionLock('unit-tokyo-02', 'lead-buyer-A', 'Budi Santoso', 10000000),
      bookUnitWithTransactionLock('unit-tokyo-02', 'lead-buyer-B', 'Agus Setiawan', 10000000)
    ]);

    // Tepat SATU harus berhasil, dan tepat SATU harus gagal
    const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
    expect(successCount).toBe(1);

    const failureRes = res1.success ? res2 : res1;
    expect(failureRes.success).toBe(false);
    expect(['CONCURRENCY_CONFLICT', 'ALREADY_BOOKED', 'ALREADY_LOCKED']).toContain(failureRes.error!);

    // Pastikan status unit di store tetap konsisten berstatus 'booking'
    const finalUnit = MOCK_UNITS_STORE.get('unit-tokyo-02');
    expect(finalUnit?.status).toBe('booking');
  });

  it('harus menolak booking pada unit yang sudah berstatus terjual', async () => {
    // Set status manual menjadi terjual
    const unit = MOCK_UNITS_STORE.get('unit-nagoya-01')!;
    unit.status = 'terjual';
    MOCK_UNITS_STORE.set('unit-nagoya-01', unit);

    const result = await bookUnitWithTransactionLock('unit-nagoya-01', 'lead-99', 'Pembeli Terlambat', 10000000);
    expect(result.success).toBe(false);
    expect(result.error).toBe('ALREADY_BOOKED');
  });
});
