import { beforeEach, describe, expect, test } from 'bun:test';
import {
  clearExtendedConnectorsCache,
  getExtendedConnectorsHealth,
  invokeExtendedConnector,
} from '../server/r2-r4-connectors';
import {
  createServiceWorkOrder,
  SERVICE_CATALOG_18,
  validateCallMetadataLog,
  validateGpsDutyPing,
} from '../src/lib/operations/mob-ops-services-engine';

describe('85 Item Non-Fitur: INT-I05..I15, MOB-01..09, OPS-01..07 & S01..S18', () => {
  beforeEach(() => {
    clearExtendedConnectorsCache();
  });

  test('INT-I05..I15: healthcheck, replay idempoten, failure handling & domain guardrails', () => {
    expect(getExtendedConnectorsHealth()).toHaveLength(11);

    const i05 = invokeExtendedConnector('I05', { tenantId: 't1', idempotencyKey: 'k1' }, { officialProfessionalAccount: false });
    expect(i05.fallbackLabel).toBe('EXPORT_REMINDER_NO_PERSONAL_BOT');

    const i06 = invokeExtendedConnector('I06', { tenantId: 't1', idempotencyKey: 'k2' }, { housingPolicyChecked: true, budgetApproved: true, dailySpend: 900, serverCap: 500 });
    expect(i06.errorCode).toBe('ADS_POLICY_OR_CAP_BLOCKED');

    const i07 = invokeExtendedConnector('I07', { tenantId: 't1', idempotencyKey: 'k3' }, { slotBusy: true });
    expect(i07.errorCode).toBe('DOUBLE_SLOT_PREVENTED');

    const i08 = invokeExtendedConnector('I08', { tenantId: 't1', idempotencyKey: 'k4' }, { eventStatus: 'DIALED' });
    expect(i08.data?.answered).toBe(false);
    expect(i08.data?.recordingEnabled).toBe(false);

    const i11 = invokeExtendedConnector('I11', { tenantId: 't1', idempotencyKey: 'k5' }, { whitelistedApprovers: 1 });
    expect(i11.errorCode).toBe('TWO_APPROVERS_REQUIRED');

    const i12 = invokeExtendedConnector('I12', { tenantId: 't1', idempotencyKey: 'k6' }, { bypassClosedApi: true });
    expect(i12.errorCode).toBe('CLOSED_API_BYPASS_FORBIDDEN');

    const i14 = invokeExtendedConnector('I14', { tenantId: 't1', idempotencyKey: 'k7' }, { contractSigned: true });
    expect(i14.ok).toBe(true);
    const i14Replay = invokeExtendedConnector('I14', { tenantId: 't1', idempotencyKey: 'k7' }, { contractSigned: true });
    expect(i14Replay.idempotentReplay).toBe(true);

    const i15Timeout = invokeExtendedConnector('I15', { tenantId: 't1', idempotencyKey: 'k8', simulateFailure: 'TIMEOUT' }, {});
    expect(i15Timeout.status).toBe('QUEUED_RETRY');
  });

  test('MOB-01..09: tolak off-duty, tolak silent enable, batas 360 ping/hari, tolak READ_CALL_LOG', () => {
    expect(validateGpsDutyPing({ onDuty: false, dailyPingCount: 0, accuracyMeters: 10, capturedAt: '2026-11-27T09:00:00Z' }).ok).toBe(false);
    expect(validateGpsDutyPing({ onDuty: true, supervisorSilentEnableAttempt: true, dailyPingCount: 0, accuracyMeters: 10, capturedAt: '2026-11-27T09:00:00Z' }).ok).toBe(false);
    expect(validateGpsDutyPing({ onDuty: true, dailyPingCount: 360, accuracyMeters: 10, capturedAt: '2026-11-27T09:00:00Z' }).ok).toBe(false);

    const validPing = validateGpsDutyPing({ onDuty: true, dailyPingCount: 15, accuracyMeters: 12, capturedAt: '2026-11-27T09:00:00Z' });
    expect(validPing.ok).toBe(true);
    if (validPing.ok) {
      expect(validPing.data.reverseGeocodeOnEveryPing).toBe(false);
      expect(validPing.data.retentionPolicy).toEqual({ rawDays: 30, aggregateDays: 90 });
    }

    expect(validateCallMetadataLog({ source: 'MANUAL_LABEL', eventStatus: 'ANSWERED', requiresReadCallLogPermission: true }).ok).toBe(false);
    const clicked = validateCallMetadataLog({ source: 'PBX_OFFICIAL', clickedOnly: true, eventStatus: 'ANSWERED' });
    expect(clicked.ok && clicked.data.answered).toBe(false);
  });

  test('OPS-01..07 & S01..S18: 18 layanan lengkap, handover 0 jam billable & tidak unlock all self-serve', () => {
    expect(SERVICE_CATALOG_18).toHaveLength(18);
    const wo = createServiceWorkOrder({ serviceId: 'S01', projectId: 'the-park-sukoharjo', assignedOperator: 'op@andara.id', bookedHours: 16 });
    expect(wo.ok).toBe(true);
    if (wo.ok) {
      expect(wo.data.unlocksAllSelfServeFeatures).toBe(false);
      expect(wo.data.factualRevisionIncluded).toBe(1);
    }

    const handover = createServiceWorkOrder({ serviceId: 'S18', projectId: 'the-park-sukoharjo', assignedOperator: 'op@andara.id', bookedHours: 10, isHandoverBootstrap: true });
    expect(handover.ok && handover.data.billableHours).toBe(0);
  });
});
