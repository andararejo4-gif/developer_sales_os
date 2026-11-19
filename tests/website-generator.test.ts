// ============================================================================
// TESTS: PROJECT WEBSITE GENERATOR & INSTALLMENT SIMULATOR (FASE 5)
// ============================================================================

import { describe, expect, it } from 'bun:test';
import {
  calculateMortgageInstallment,
  generateStandaloneHtml,
  THE_PARK_DEFAULT_WEBSITE_CONFIG,
} from '../src/lib/website-generator/the-park-landing-data';
import { assertNoTokenLeakage } from '../src/lib/exporters/clean-export-guard';

describe('Fase 5: Mortgage Annuity Installment Simulator', () => {
  it('calculates monthly installment accurately based on loan principal, DP, and tenor', () => {
    // Rp 850.000.000, DP 10% (Rp 85.000.000), Pinjaman: Rp 765.000.000, 4.75% / thn, 15 thn
    const result = calculateMortgageInstallment({
      propertyPriceIdr: 850000000,
      dpPercent: 10,
      interestRateAnnualPercent: 4.75,
      tenorYears: 15,
    });

    expect(result.propertyPriceIdr).toBe(850000000);
    expect(result.dpAmountIdr).toBe(85000000);
    expect(result.loanPrincipalIdr).toBe(765000000);
    expect(result.tenorYears).toBe(15);
    // Expected monthly installment is around 5.9M - 6.0M IDR
    expect(result.monthlyInstallmentIdr).toBeGreaterThan(5800000);
    expect(result.monthlyInstallmentIdr).toBeLessThan(6200000);
  });

  it('handles 0% interest rate without divide-by-zero errors', () => {
    const result = calculateMortgageInstallment({
      propertyPriceIdr: 120000000,
      dpPercent: 0,
      interestRateAnnualPercent: 0,
      tenorYears: 10,
    });
    expect(result.loanPrincipalIdr).toBe(120000000);
    expect(result.monthlyInstallmentIdr).toBe(1000000); // 120jt / 120 bln = 1jt
  });
});

describe('Fase 5: Project Landing Page & Standalone HTML Generation', () => {
  it('has comprehensive configuration for The Park Townhouse Sukoharjo', () => {
    const cfg = THE_PARK_DEFAULT_WEBSITE_CONFIG;
    expect(cfg.projectName).toBe('The Park Townhouse Sukoharjo');
    expect(cfg.subdomain).toBe('thepark');
    expect(cfg.units.length).toBeGreaterThanOrEqual(2);
    expect(cfg.faqs.length).toBeGreaterThanOrEqual(4);
    expect(cfg.siteTitle).toContain('The Park Townhouse');
    expect(cfg.heroHeadline).toContain('Ketenangan Hidup');
  });

  it('generates self-contained, clean HTML with simulator and non-binding notice', () => {
    const html = generateStandaloneHtml(THE_PARK_DEFAULT_WEBSITE_CONFIG);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('thepark.developerproperti.giivepro.com');
    expect(html).toContain('Simulasi Angsuran');
    expect(html).toContain('bukan komitmen kredit final');
    expect(html).toContain('99 Keunggulan');

    // Token leakage guardrail check
    expect(() => assertNoTokenLeakage(html)).not.toThrow();
  });
});
