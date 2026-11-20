// ============================================================================
// FIELD OPS & AI ACTIVITY GUIDE TYPES - DEVELOPER SALES OS
// Absensi SE, Tracking GPS SE, Log Panggilan, & Panduan Aktivitas AI (Platinum/Diamond)
// ============================================================================

export type AttendanceStatus = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'CUTI';

export interface SeAttendanceRecord {
  id: string;
  projectId: string;
  seName: string;
  date: string;
  checkInAt: string | null;
  checkInLat?: number;
  checkInLng?: number;
  checkOutAt: string | null;
  checkOutLat?: number;
  checkOutLng?: number;
  status: AttendanceStatus;
  notes?: string;
}

export type GpsActivityType =
  | 'CHECK_IN'
  | 'CANVASSING'
  | 'SURVEY_LOKASI'
  | 'MEETING_KLIEN'
  | 'KANTOR_PEMASARAN'
  | 'CHECK_OUT';

export interface SeGpsTrackPoint {
  id: string;
  projectId: string;
  seName: string;
  recordedAt: string;
  lat: number;
  lng: number;
  activityType: GpsActivityType;
  locationLabel: string;
  distanceFromProjectKm: number;
}

export type CallOutcome =
  | 'TERJAWAB_TERTARIK'
  | 'JANJI_SURVEI'
  | 'FOLLOW_UP_LAGI'
  | 'TIDAK_ANGKAT'
  | 'NOMOR_TIDAK_AKTIF';

export interface SeCallLog {
  id: string;
  projectId: string;
  seName: string;
  leadName: string;
  phoneNumber: string;
  direction: 'OUTBOUND' | 'INBOUND';
  durationSeconds: number;
  outcome: CallOutcome;
  summaryNotes: string;
  calledAt: string;
}

export type SeActivityCategory =
  | 'COLD_CALL_SLA_5_MENIT'
  | 'KANVASING_B2B_RS_BANK'
  | 'PENDAMPINGAN_SURVEI_LOKASI'
  | 'FOLLOW_UP_PROSPEK_DINGIN'
  | 'NEGOSIASI_CASH_KPR';

export interface AiObjectionHandler {
  objection: string;
  aiResponse: string;
}

export interface AiActivityGuide {
  activityType: SeActivityCategory;
  title: string;
  planRequired: 'platinum' | 'diamond';
  goal: string;
  openingScript: string;
  executionSteps: string[];
  objectionHandlers: AiObjectionHandler[];
  closingChecklist: string;
}
