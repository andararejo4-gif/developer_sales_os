import { describe, expect, test } from 'bun:test';
import { executeFinal15Feature, FINAL_15_META } from '../src/lib/operations/final-15-features-engine';
import { STANDARD_AIC_RATES } from '../src/lib/aic/meter-engine';

describe('15 Fitur Terakhir (F72, F73, F76-F78, F81-F84, F87-F89, F94-F96)', () => {
  test('Tarif AIC 15 fitur sesuai katalog', () => {
    for (const [fid, meta] of Object.entries(FINAL_15_META)) {
      expect(STANDARD_AIC_RATES[fid]).toBe(meta.aic);
    }
  });

  test('F72, F73, F76, F77, F78 guardrails & happy paths', () => {
    expect(executeFinal15Feature('F72', { sellableStock: 5, proposedUnits: 8 }).ok).toBe(false);
    expect(executeFinal15Feature('F72', { sellableStock: 10, proposedUnits: 5 }).ok).toBe(true);
    expect(executeFinal15Feature('F73', { employmentType: 'WIRAUSAHA' }).ok).toBe(true);
    expect(executeFinal15Feature('F76', { counselApprovedTemplate: false }).ok).toBe(false);
    expect(executeFinal15Feature('F77', { webhookSignatureVerified: true, whitelistedAccountApprovers: 1 }).ok).toBe(false);
    expect(executeFinal15Feature('F77', { webhookSignatureVerified: true, whitelistedAccountApprovers: 2 }).ok).toBe(true);
    expect(executeFinal15Feature('F78', { evidenceRef: '' }).ok).toBe(false);
    expect(executeFinal15Feature('F78', { evidenceRef: 'SP3K-01' }).ok).toBe(true);
  });

  test('F81, F82, F83, F84, F87, F88, F89, F94, F95, F96 guardrails & happy paths', () => {
    expect(executeFinal15Feature('F81', { partnerCode: 'P1', isDispute: true }).ok).toBe(true);
    expect(executeFinal15Feature('F82', { harvestsEmployeeOrPatientDb: true, slotPermitVerified: true }).ok).toBe(false);
    expect(executeFinal15Feature('F82', { harvestsEmployeeOrPatientDb: false, slotPermitVerified: true }).ok).toBe(true);
    expect(executeFinal15Feature('F83', { eventName: 'Open House' }).ok).toBe(true);
    expect(executeFinal15Feature('F84', { netSalesIdr: 500000000, costIdr: 10000000 }).ok).toBe(true);
    expect(executeFinal15Feature('F87', { holdoutLiftPct: 7 }).ok).toBe(true);

    const lowData = executeFinal15Feature('F88', { historyMonths: 1 });
    expect(lowData.ok && lowData.data.mode).toBe('ASSUMPTION_SCENARIO_ONLY');

    expect(executeFinal15Feature('F89', { fakeTestimonial: true, statusConfirmedByCustomerOrAdmin: true }).ok).toBe(false);
    expect(executeFinal15Feature('F89', { fakeTestimonial: false, statusConfirmedByCustomerOrAdmin: true }).ok).toBe(true);
    expect(executeFinal15Feature('F94', { bypassClosedApi: true }).ok).toBe(false);
    expect(executeFinal15Feature('F94', { tokenRevoked: true }).ok).toBe(false);
    expect(executeFinal15Feature('F95', { testSetPassed: false }).ok).toBe(false);
    expect(executeFinal15Feature('F95', { testSetPassed: true, riskyChange: true }).ok).toBe(true);
    expect(executeFinal15Feature('F96', { contractualDueDiligenceSigned: false }).ok).toBe(false);
    expect(executeFinal15Feature('F96', { contractualDueDiligenceSigned: true }).ok).toBe(true);
  });
});
