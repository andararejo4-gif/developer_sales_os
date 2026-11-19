import { describe, expect, it } from 'bun:test';
import { THE_PARK_99_POINTS } from '../src/lib/love-letter/points-data';
import { validateLoveLetter } from '../src/lib/love-letter/validator';

describe('Surat Cinta 99 Keunggulan Validator', () => {
  it('harus memvalidasi tepat 99 poin untuk The Park Townhouse Sukoharjo', () => {
    expect(THE_PARK_99_POINTS.length).toBe(99);
  });

  it('harus lolos 100% dari seluruh guardrail dan kata terlarang', () => {
    const result = validateLoveLetter(THE_PARK_99_POINTS);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.passedCount).toBe(99);
  });

  it('harus menolak dokumen jika jumlah poin kurang dari 99', () => {
    const invalidPoints = THE_PARK_99_POINTS.slice(0, 50);
    const result = validateLoveLetter(invalidPoints);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'Aturan Panjang Dokumen')).toBe(true);
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
