import { describe, expect, it } from 'bun:test';
import { applyDemoTeaser, validateNoPressureWords } from '../src/lib/demo/teaser-engine';

describe('Bagian 4A: Mode Demo 30 Hari, Cuplikan 25%, & Larangan Desakan', () => {
  const sampleFullData = Array.from({ length: 20 }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `Rincian Strategi Rahasia #${i + 1}`,
    secret_payload: `Sensitif Data Omset Rp ${(i + 1) * 100} Juta`
  }));

  it('Akun Demo: hanya menerima 25% item pertama, sisa 75% TIDAK DIKIRIM ke klien', () => {
    const isDemo = true;
    const teaserPercent = 25;

    const result = applyDemoTeaser(sampleFullData, isDemo, teaserPercent);
    // 25% dari 20 item = 5 item
    expect(result.visible_items.length).toBe(5);
    expect(result.total_original_count).toBe(20);
    expect(result.is_truncated).toBe(true);

    // Verifikasi bahwa item ke-6 s.d. 20 sama sekali TIDAK ada di dalam payload hasil
    const itemIds = result.visible_items.map(item => item.id);
    expect(itemIds.includes('item-6')).toBe(false);
    expect(itemIds.includes('item-20')).toBe(false);
  });

  it('Akun Berbayar (Non-Demo): menerima 100% data penuh tanpa pemotongan', () => {
    const isDemo = false;
    const result = applyDemoTeaser(sampleFullData, isDemo);
    expect(result.visible_items.length).toBe(20);
    expect(result.is_truncated).toBe(false);
  });

  it('Validasi Etis: Template UI dan teks sistem bebas kata-kata desakan palsu / hitung mundur', () => {
    const safeText = "Surat Cinta 99 Keunggulan untuk proyek Anda sudah tersusun. Kenali paket selengkapnya kapan pun Anda siap.";
    const checkSafe = validateNoPressureWords(safeText);
    expect(checkSafe.hasViolation).toBe(false);
    expect(checkSafe.violations.length).toBe(0);

    const pressureText = "Segera beli! Sisa 3 hari lagi sebelum harga naik dan diskon 50% hampir habis!";
    const checkPressure = validateNoPressureWords(pressureText);
    expect(checkPressure.hasViolation).toBe(true);
    expect(checkPressure.violations.length).toBeGreaterThan(0);
  });
});
