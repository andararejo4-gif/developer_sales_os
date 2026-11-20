import { describe, expect, it } from 'bun:test';
import { PLANS_CONFIG, getPlanDisplayPrice, hasPlanFeature } from '../src/lib/plans/plans-config';

describe('Config-Driven Plans & Feature Flags (Blueprint v1.2)', () => {
  it('semua paket harus memiliki harga usulan 3 bulan kalender yang dapat diubah di database', () => {
    const gold = PLANS_CONFIG.find(p => p.code === 'gold')!;
    const plat = PLANS_CONFIG.find(p => p.code === 'platinum')!;
    const diam = PLANS_CONFIG.find(p => p.code === 'diamond')!;

    expect(gold.price).toBe(4900000);
    expect(gold.price_status).toBe('usulan');
    expect(gold.billing_period).toBe('3_bulan_kalender');

    expect(plat.price).toBe(12900000);
    expect(plat.price_status).toBe('usulan');

    expect(diam.price).toBe(39900000);
    expect(diam.price_status).toBe('usulan');
    expect(diam.max_active_projects).toBe(10);
    expect(diam.max_sales_users).toBe(75);

    expect(getPlanDisplayPrice(gold)).toBe('Rp 4.900.000');
    expect(getPlanDisplayPrice(gold)).not.toContain('/ 3 Bulan');
    expect(getPlanDisplayPrice(plat)).toBe('Rp 12.900.000');
    expect(getPlanDisplayPrice(plat)).not.toContain('/ 3 Bulan');
    expect(getPlanDisplayPrice(diam)).toBe('Rp 39.900.000');
    expect(getPlanDisplayPrice(diam)).not.toContain('/ 3 Bulan');
  });

  it('semua paket harus memiliki billing_period 3_bulan_kalender', () => {
    PLANS_CONFIG.forEach(plan => {
      expect(plan.billing_period).toBe('3_bulan_kalender');
    });
  });

  it('semua paket (Gold, Platinum, Diamond) harus membuka Surat Cinta 99 Keunggulan gratis', () => {
    ['gold', 'platinum', 'diamond'].forEach(code => {
      expect(hasPlanFeature(code as any, 'love_letter_99')).toBe(true);
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
