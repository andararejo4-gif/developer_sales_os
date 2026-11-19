// ============================================================================
// TESTS: PLAYBOOK SALES (SE/TL/SM) & DAILY CANVASSING ROUTES (FASE 4)
// ============================================================================

import { describe, expect, it } from 'bun:test';
import {
  getPlaybook,
  evaluateBantScore,
  calculateReverseFunnelActivity,
} from '../src/lib/playbook/playbook-generator';
import { generateDailyRoutePlan } from '../src/lib/playbook/route-generator';
import { generatePlaybookDocx } from '../src/lib/exporters/playbook-docx';
import { assertNoTokenLeakage } from '../src/lib/exporters/clean-export-guard';

describe('Fase 4: Playbook Sales Reverse-Funnel Math & BANT', () => {
  it('calculates realistic reverse-funnel daily activities for 1 closing/month', () => {
    const math = calculateReverseFunnelActivity(1);
    expect(math.monthlyTargetUnits).toBe(1);
    expect(math.bookingRequired).toBeGreaterThanOrEqual(1);
    expect(math.surveyVisitRequired).toBeGreaterThanOrEqual(4);
    expect(math.hotProspectsRequired).toBeGreaterThanOrEqual(2);
    expect(math.leadsRequired).toBeGreaterThanOrEqual(20);
    expect(math.dailyCallsRequired).toBeGreaterThan(0);
    expect(math.dailyWalkInCanvassingRequired).toBeGreaterThan(0);
  });

  it('evaluates BANT qualification with threshold >= 7', () => {
    // Budget: 9, Authority: 8, Need: 9, Timeline: 8 -> Total = 8.6 (Qualified)
    const hotResult = evaluateBantScore(9, 8, 9, 8);
    expect(hotResult.totalScore).toBeGreaterThanOrEqual(7);
    expect(hotResult.isQualified).toBe(true);
    expect(hotResult.recommendation).toBe('HOT_PROSPEK');

    // Budget: 4, Authority: 5, Need: 4, Timeline: 4 -> Total = 4.3 (Not qualified)
    const coldResult = evaluateBantScore(4, 5, 4, 4);
    expect(coldResult.totalScore).toBeLessThan(7);
    expect(coldResult.isQualified).toBe(false);
    expect(coldResult.recommendation).toBe('NURTURING');

    // Exact threshold 7 -> Qualified
    const thresholdResult = evaluateBantScore(7, 7, 7, 7);
    expect(thresholdResult.totalScore).toBe(7.0);
    expect(thresholdResult.isQualified).toBe(true);
  });

  it('generates role-tailored playbooks for SE, TL, and SM', () => {
    const sePlaybook = getPlaybook('The Park Townhouse Sukoharjo', 'SE');
    expect(sePlaybook.role).toBe('SE');
    expect(sePlaybook.title).toContain('Sales Executive');
    expect(sePlaybook.dailySop.length).toBeGreaterThan(0);
    expect(sePlaybook.kpiMetrics.length).toBeGreaterThan(0);

    const tlPlaybook = getPlaybook('The Park Townhouse Sukoharjo', 'TL');
    expect(tlPlaybook.role).toBe('TL');
    expect(tlPlaybook.title).toContain('Team Leader');
    expect(tlPlaybook.dailySop.some((s) => s.instruction.includes('SLA') || s.activityName.includes('Audit'))).toBe(true);

    const smPlaybook = getPlaybook('The Park Townhouse Sukoharjo', 'SM');
    expect(smPlaybook.role).toBe('SM');
    expect(smPlaybook.title).toContain('Sales Manager');
    expect(smPlaybook.kpiMetrics.some((k) => k.metric.toLowerCase().includes('closing') || k.metric.toLowerCase().includes('target'))).toBe(true);
  });

  it('guarantees clean DOCX playbook export without any AI token or cost leakage', async () => {
    const sePlaybook = getPlaybook('The Park Townhouse Sukoharjo', 'SE');
    const docxBlob = await generatePlaybookDocx(sePlaybook);
    expect(docxBlob).toBeDefined();
    expect(docxBlob.size).toBeGreaterThan(1000);

    // Verify token leakage guardrail
    const testInspectionText = JSON.stringify(sePlaybook);
    expect(() => assertNoTokenLeakage(testInspectionText)).not.toThrow();
  });
});

describe('Fase 4: Daily GPS-Guided Canvassing Routes', () => {
  it('generates daily canvassing schedule anchored at project GPS coordinates', () => {
    const routePlan = generateDailyRoutePlan('Senin', 'proj-the-park-01');
    expect(routePlan.projectName).toBe('The Park Townhouse Sukoharjo');
    expect(routePlan.dayName).toBe('Senin');
    expect(routePlan.startPoint.lat).toBeCloseTo(-7.673872, 4);
    expect(routePlan.startPoint.lng).toBeCloseTo(110.843978, 4);
    expect(routePlan.waypoints.length).toBeGreaterThanOrEqual(3);
    expect(routePlan.hourlySchedule.length).toBeGreaterThan(3);
    expect(routePlan.totalDistanceKm).toBeGreaterThan(0);
  });
});
