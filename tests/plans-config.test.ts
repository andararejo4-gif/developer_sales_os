import { describe, expect, it } from 'bun:test';
import { PLANS_CONFIG, getPlanDisplayPrice, hasPlanFeature } from '../src/lib/plans/plans-config';

describe('Config-Driven Plans & Feature Flags', () => {
  it('semua paket harus memiliki harga null dan menampilkan "Hubungi kami"', () => {
    PLANS_CONFIG.forEach(plan => {
      expect(plan.price).toBeNull();
      expect(getPlanDisplayPrice(plan)).toBe('Hubungi kami');
    });
  });

  it('semua paket (Gold, Platinum, Diamond) harus membuka Surat Cinta 99 Keunggulan gratis', () => {
    ['gold', 'platinum', 'diamond'].forEach(code => {
      expect(hasPlanFeature(code, 'love_letter_99')).toBe(true);
    });
  });

  it('hanya Platinum dan Diamond yang memiliki fitur TL Full AI', () => {
    expect(hasPlanFeature('gold', 'playbook_tl')).toBe(false); // gold manual
    expect(hasPlanFeature('platinum', 'playbook_tl')).toBe(true);
    expect(hasPlanFeature('diamond', 'playbook_tl')).toBe(true);
  });

  it('hanya Diamond yang memiliki fitur SM Semi-AI', () => {
    expect(hasPlanFeature('gold', 'playbook_sm')).toBe(false);
    expect(hasPlanFeature('platinum', 'playbook_sm')).toBe(false);
    expect(hasPlanFeature('diamond', 'playbook_sm')).toBe(true);
  });
});
