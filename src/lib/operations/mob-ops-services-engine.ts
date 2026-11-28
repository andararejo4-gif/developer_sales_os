// ============================================================================
// MOBILE (MOB-01..09), OPS (OPS-01..07) & 18 LAYANAN MANUSIA (S01..S18)
// ============================================================================

// --- MOB-01..09: Mobile, PWA, GPS, Call Metadata & Privacy Guardrails ---
export function validateGpsDutyPing(params: {
  onDuty: boolean;
  supervisorSilentEnableAttempt?: boolean;
  dailyPingCount: number;
  accuracyMeters: number;
  capturedAt: string;
}) {
  if (params.supervisorSilentEnableAttempt) {
    return { ok: false as const, error: 'Supervisor dilarang menyalakan GPS SE secara diam-diam (MOB-04).' };
  }
  if (!params.onDuty) {
    return { ok: false as const, error: 'Titik GPS off-duty ditolak (0 titik off-duty policy, MOB-04).' };
  }
  if (params.dailyPingCount >= 360) {
    return { ok: false as const, error: 'Batas sampling 360 titik/SE-hari tercapai (MOB-05).' };
  }
  return {
    ok: true as const,
    data: {
      accepted: true,
      accuracyMeters: params.accuracyMeters,
      staleLabel: params.accuracyMeters > 100 ? 'LOW_ACCURACY_OR_STALE' : 'ACCURATE',
      reverseGeocodeOnEveryPing: false, // Tidak reverse-geocode tiap ping
      retentionPolicy: { rawDays: 30, aggregateDays: 90 },
      capturedAt: params.capturedAt,
    },
  };
}

export function validateCallMetadataLog(params: {
  source: 'PBX_OFFICIAL' | 'MANUAL_LABEL';
  clickedOnly?: boolean;
  eventStatus: 'DIALED' | 'ANSWERED' | 'MISSED';
  requiresReadCallLogPermission?: boolean;
}) {
  if (params.requiresReadCallLogPermission) {
    return { ok: false as const, error: 'Dilarang meminta izin READ_CALL_LOG perangkat pribadi (MOB-07).' };
  }
  const answered = !params.clickedOnly && params.eventStatus === 'ANSWERED';
  return {
    ok: true as const,
    data: {
      source: params.source,
      answered,
      recordingDefaultOff: true,
    },
  };
}

// --- S01..S18: Katalog 18 Layanan Manusia + Work Order & Acceptance (OPS-01..07) ---
export interface ServiceCatalogSpec {
  id: string;
  name: string;
  scopeLimit: string;
  aicInternal: number;
  hoursInternal: number;
}

export const SERVICE_CATALOG_18: ServiceCatalogSpec[] = [
  { id: 'S01', name: 'Launch enam output', scopeLimit: '1 proyek; <=30 halaman; 6 draf; rute 3 SE/30 hari', aicInternal: 5270, hoursInternal: 24 },
  { id: 'S02', name: 'Audit data & 99 klaim', scopeLimit: '99 klaim; maks 30 halaman sumber', aicInternal: 500, hoursInternal: 8 },
  { id: 'S03', name: 'Aktivasi kanal resmi', scopeLimit: '1 nomor WA + 2 akun profesional + 1 domain', aicInternal: 300, hoursInternal: 10 },
  { id: 'S04', name: 'Migrasi & bersih CRM', scopeLimit: 'Hingga 5.000 kontak; izin ditinjau', aicInternal: 500, hoursInternal: 12 },
  { id: 'S05', name: 'Riset pasar berkala', scopeLimit: '1 proyek; 10 pembanding/30 POI/1 rekomendasi', aicInternal: 1000, hoursInternal: 10 },
  { id: 'S06', name: 'Editorial & factual QA', scopeLimit: '30 aset pilihan; 1 putaran revisi/aset', aicInternal: 600, hoursInternal: 10 },
  { id: 'S07', name: 'Managed ad operations', scopeLimit: '1 ad account; spend <=Rp50jt; 4 review', aicInternal: 1500, hoursInternal: 16 },
  { id: 'S08', name: 'Batch creative production', scopeLimit: '20 poster + 5 video template <=30 dtk', aicInternal: 2250, hoursInternal: 20 },
  { id: 'S09', name: 'Landing page & form sprint', scopeLimit: '1 proyek; 1 landing + form + tracking', aicInternal: 1000, hoursInternal: 12 },
  { id: 'S10', name: 'WhatsApp concierge tuning', scopeLimit: '1 akun; 30 FAQ + 10 skrip sanggahan', aicInternal: 600, hoursInternal: 8 },
  { id: 'S11', name: 'SE script & objection workshop', scopeLimit: '1 tim <=10 SE; 2 jam workshop + 10 latihan', aicInternal: 500, hoursInternal: 6 },
  { id: 'S12', name: 'Field route enablement', scopeLimit: '<=5 SE x 30 hari; <=150 rute + 2 review', aicInternal: 5000, hoursInternal: 6 },
  { id: 'S13', name: 'KPR case coordination', scopeLimit: '10 dossier administratif; <=2 bank/case', aicInternal: 1000, hoursInternal: 10 },
  { id: 'S14', name: 'Booking & closing desk', scopeLimit: '10 case; dokumen template & rekonsiliasi', aicInternal: 1000, hoursInternal: 12 },
  { id: 'S15', name: 'Event & partner digital ops', scopeLimit: '1 event; RSVP <=200; 10 partner', aicInternal: 800, hoursInternal: 8 },
  { id: 'S16', name: 'Portfolio business review', scopeLimit: '<=3 proyek; 1 board pack + rapat 2 jam', aicInternal: 1200, hoursInternal: 6 },
  { id: 'S17', name: 'Privacy & security readiness', scopeLimit: '1 tenant; review akses, retensi & drill', aicInternal: 1500, hoursInternal: 12 },
  { id: 'S18', name: 'Dedicated integration sprint', scopeLimit: '40 jam kerja; 1 konektor, sandbox & runbook', aicInternal: 2000, hoursInternal: 40 },
];

export function createServiceWorkOrder(params: {
  serviceId: string;
  projectId: string;
  assignedOperator: string;
  bookedHours: number;
  isHandoverBootstrap?: boolean;
}) {
  const spec = SERVICE_CATALOG_18.find((s) => s.id === params.serviceId);
  if (!spec) {
    return { ok: false as const, error: `Layanan ${params.serviceId} tidak ditemukan di katalog S01–S18.` };
  }
  if (!params.assignedOperator?.trim()) {
    return { ok: false as const, error: 'Operator PIC wajib ditugaskan (OPS-02).' };
  }
  const billableHours = params.isHandoverBootstrap ? 0 : Math.min(Number(params.bookedHours) || spec.hoursInternal, spec.hoursInternal);
  return {
    ok: true as const,
    data: {
      serviceId: spec.id,
      serviceName: spec.name,
      projectId: params.projectId,
      assignedOperator: params.assignedOperator.trim(),
      scopeLimit: spec.scopeLimit,
      aicPoolAllocated: spec.aicInternal,
      billableHours,
      unlocksAllSelfServeFeatures: false, // Layanan bukan unlock seluruh fitur self-serve
      factualRevisionIncluded: 1,
      status: 'WORK_ORDER_OPEN' as const,
    },
  };
}
