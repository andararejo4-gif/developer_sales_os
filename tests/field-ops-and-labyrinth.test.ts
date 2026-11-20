// ============================================================================
// TESTS: FIELD OPS (ABSEN, GPS, CALL LOG, AI GUIDE) & LABYRINTH ROUTES
// ============================================================================

import { describe, expect, it } from 'bun:test';
import { hasPlanFeature } from '../src/lib/plans/plans-config';
import {
  resetFieldOpsStore,
  checkInAttendance,
  checkOutAttendance,
  getAttendanceRecords,
  recordGpsPoint,
  getGpsTrackLogs,
  addCallLog,
  getCallLogs,
  getAiActivityGuide,
} from '../src/lib/field-ops/field-ops-store';
import { getBreadcrumbs } from '../src/lib/labyrinth/labyrinth-routes';

describe('Feature Flags Baru: Absen, GPS Tracking, Call Log & AI Activity Guide', () => {
  it('mengaktifkan Absen, GPS Tracking, dan Log Panggilan untuk SEMUA paket (Gold, Platinum, Diamond)', () => {
    for (const plan of ['gold', 'platinum', 'diamond'] as const) {
      expect(hasPlanFeature(plan, 'se_attendance')).toBe(true);
      expect(hasPlanFeature(plan, 'se_gps_tracking')).toBe(true);
      expect(hasPlanFeature(plan, 'se_call_log')).toBe(true);
    }
  });

  it('mengaktifkan AI Panduan Aktivitas SE HANYA untuk Platinum dan Diamond (nonaktif di Gold)', () => {
    expect(hasPlanFeature('gold', 'se_ai_activity_guide')).toBe(false);
    expect(hasPlanFeature('platinum', 'se_ai_activity_guide')).toBe(true);
    expect(hasPlanFeature('diamond', 'se_ai_activity_guide')).toBe(true);
  });
});

describe('Field Ops Store: Absensi, GPS, Log Panggilan & AI Guide', () => {
  it('mencatat absensi check-in dan check-out dengan koordinat GPS', () => {
    resetFieldOpsStore();
    const record = checkInAttendance({
      projectId: 'proj-the-park-01',
      seName: 'SE 004 Rina',
      lat: -7.67387,
      lng: 110.84398,
    });
    expect(record.checkInAt).toBeDefined();
    expect(record.status).toBe('HADIR');

    const checkedOut = checkOutAttendance('proj-the-park-01', 'SE 004 Rina', -7.67387, 110.84398);
    expect(checkedOut?.checkOutAt).toBeDefined();
    expect(getAttendanceRecords('proj-the-park-01').some((r) => r.seName === 'SE 004 Rina')).toBe(true);
  });

  it('merekam jejak GPS dan menghitung jarak km dari gerbang proyek', () => {
    resetFieldOpsStore();
    const point = recordGpsPoint({
      projectId: 'proj-the-park-01',
      seName: 'SE 001 Budi Santoso',
      lat: -7.625,
      lng: 110.812,
      activityType: 'CANVASSING',
      locationLabel: 'RS Indriati Solo Baru',
    });
    expect(point.distanceFromProjectKm).toBeGreaterThan(4);
    expect(point.distanceFromProjectKm).toBeLessThan(10);
    expect(getGpsTrackLogs('proj-the-park-01').length).toBeGreaterThanOrEqual(4);
  });

  it('mencatat log panggilan telepon SE ke prospek', () => {
    resetFieldOpsStore();
    const call = addCallLog({
      projectId: 'proj-the-park-01',
      seName: 'SE 001 Budi Santoso',
      leadName: 'dr. Aditya',
      phoneNumber: '081200009999',
      direction: 'OUTBOUND',
      durationSeconds: 240,
      outcome: 'JANJI_SURVEI',
      summaryNotes: 'Survei Sabtu pukul 10.00 WIB',
    });
    expect(call.id).toBeDefined();
    expect(getCallLogs('proj-the-park-01')[0].leadName).toBe('dr. Aditya');
  });

  it('membuka AI Activity Guide lengkap pada Platinum/Diamond dan mengunci pada Gold', () => {
    const goldRes = getAiActivityGuide('COLD_CALL_SLA_5_MENIT', 'gold');
    expect(goldRes.isUnlocked).toBe(false);
    expect(goldRes.guide.objectionHandlers.length).toBe(0);

    const platRes = getAiActivityGuide('COLD_CALL_SLA_5_MENIT', 'platinum');
    expect(platRes.isUnlocked).toBe(true);
    expect(platRes.guide.executionSteps.length).toBeGreaterThan(2);
    expect(platRes.guide.objectionHandlers.length).toBeGreaterThan(0);

    const diamRes = getAiActivityGuide('NEGOSIASI_CASH_KPR', 'diamond');
    expect(diamRes.isUnlocked).toBe(true);
    expect(diamRes.guide.openingScript.length).toBeGreaterThan(20);
  });
});

describe('Arsitektur Kedalaman Labirin Website (L0 -> L1 -> L2)', () => {
  it('membangun jejak breadcrumb hirarkis L0 -> L1 -> L2 secara akurat', () => {
    const trail = getBreadcrumbs('l2-field-ops');
    expect(trail.length).toBe(3);
    expect(trail[0].id).toBe('l0-beranda');
    expect(trail[0].level).toBe('L0');
    expect(trail[1].id).toBe('l1-ekosistem');
    expect(trail[1].level).toBe('L1');
    expect(trail[2].id).toBe('l2-field-ops');
    expect(trail[2].level).toBe('L2');

    const advisorTrail = getBreadcrumbs('l2-plan-advisor');
    expect(advisorTrail.map((t) => t.level)).toEqual(['L0', 'L1', 'L2']);
    expect(advisorTrail[1].id).toBe('l1-paket');
  });
});
