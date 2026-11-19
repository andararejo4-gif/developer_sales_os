// ============================================================================
// EXPORT TOKEN EXCLUSION TEST SUITE - DEVELOPER SALES OS (FASE 2)
// ============================================================================

import { describe, expect, test } from 'bun:test';
import { DEFAULT_THE_PARK_RESEARCH_REPORT } from '../src/lib/market-research/the-park-market-research';
import { THE_PARK_DEFAULT_TARGET_PLAN } from '../src/lib/sales-target/calculator';
import {
  assertNoTokenLeakage,
  FORBIDDEN_EXPORT_TERMS,
} from '../src/lib/exporters/clean-export-guard';

describe('Fase 2: Strict Token Exclusion in Exports', () => {
  test('assertNoTokenLeakage melempar error bila teks mengandung metadata internal AI atau token', () => {
    expect(() => {
      assertNoTokenLeakage('Laporan ini menghabiskan 1500 tokens_used dalam generasi');
    }).toThrow('Pelanggaran Aturan Fase 2');

    expect(() => {
      assertNoTokenLeakage('Model yang digunakan adalah gemini-1.5-pro');
    }).toThrow('Pelanggaran Aturan Fase 2');

    expect(() => {
      assertNoTokenLeakage('Catatan biaya token: $0.002');
    }).toThrow('Pelanggaran Aturan Fase 2');
  });

  test('Laporan Riset Pasar bersih 100% dari istilah token internal', () => {
    const rawResearchText = JSON.stringify({
      personas: DEFAULT_THE_PARK_RESEARCH_REPORT.personas,
      facilities: DEFAULT_THE_PARK_RESEARCH_REPORT.facilities,
      competitors: DEFAULT_THE_PARK_RESEARCH_REPORT.competitors,
      marketShare: DEFAULT_THE_PARK_RESEARCH_REPORT.marketShare,
    });

    // Harus lolos tanpa error
    expect(() => {
      assertNoTokenLeakage(rawResearchText, 'Riset Pasar The Park');
    }).not.toThrow();

    FORBIDDEN_EXPORT_TERMS.forEach((term) => {
      expect(rawResearchText.toLowerCase().includes(term)).toBe(false);
    });
  });

  test('Rencana Target Penjualan bersih 100% dari istilah token internal', () => {
    const rawTargetText = JSON.stringify({
      scenarios: THE_PARK_DEFAULT_TARGET_PLAN.scenarios,
      monthlySchedules: THE_PARK_DEFAULT_TARGET_PLAN.monthlySchedules,
      seAllocations: THE_PARK_DEFAULT_TARGET_PLAN.seAllocations,
    });

    // Harus lolos tanpa error
    expect(() => {
      assertNoTokenLeakage(rawTargetText, 'Target Penjualan The Park');
    }).not.toThrow();

    FORBIDDEN_EXPORT_TERMS.forEach((term) => {
      expect(rawTargetText.toLowerCase().includes(term)).toBe(false);
    });
  });
});
