import { describe, expect, it } from 'bun:test';
import { THE_PARK_99_POINTS } from '../src/lib/love-letter/points-data';
import { validateLoveLetter } from '../src/lib/love-letter/validator';

describe('Surat Cinta Hingga 99 Keunggulan Validator (Blueprint v1.2)', () => {
  it('harus memvalidasi 99 poin sempurna untuk The Park Townhouse Sukoharjo', () => {
    expect(THE_PARK_99_POINTS.length).toBe(99);
    const result = validateLoveLetter(THE_PARK_99_POINTS);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.passedCount).toBe(99);
    expect(result.gapCount).toBe(0);
  });

  it('harus menerima dokumen bersumber dengan jumlah kurang dari 99 (misal 50 poin) dan melaporkan gap data', () => {
    const partialPoints = THE_PARK_99_POINTS.slice(0, 50);
    const result = validateLoveLetter(partialPoints);
    // Berdasarkan Blueprint v1.2: "sampai 99; fakta kurang = gap, bukan diisi fiktif"
    expect(result.isValid).toBe(true);
    expect(result.passedCount).toBe(50);
    expect(result.gapCount).toBe(49);
    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.gaps[0].neededDataPrompt).toContain('Butuh data tambahan: 49 poin');
  });

  it('harus menolak dokumen jika melebihi 99 poin', () => {
    const overflowPoints = [...THE_PARK_99_POINTS, {
      number: 100,
      chapter: 'Bab VI: Ekstra',
      category: 'Tambahan',
      title: 'Poin ekstra ke-100',
      narrative: 'Ini adalah poin ke seratus yang melebihi batas maksimum 99 poin.'
    }];
    const result = validateLoveLetter(overflowPoints);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'Batas Maksimum Dokumen')).toBe(true);
  });

  it('harus mendeteksi frasa overpromise terlarang (pasti untung / bebas risiko)', () => {
    const cloned = structuredClone(THE_PARK_99_POINTS);
    cloned[0].narrative += ' Dijamin pasti untung berlipat ganda!';
    const result = validateLoveLetter(cloned);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.message.includes('melanggar guardrail'))).toBe(true);
  });

  it('harus mendeteksi klaim superlatif tak berbukti (terbaik se-indonesia)', () => {
    const cloned = structuredClone(THE_PARK_99_POINTS);
    cloned[5].title = 'Rumah sakit terbaik se-indonesia';
    const result = validateLoveLetter(cloned);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule.includes('superlatif'))).toBe(true);
  });
});
