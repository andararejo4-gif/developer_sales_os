// ============================================================================
// PLAYBOOK & DAILY ROUTE TYPES - DEVELOPER SALES OS
// ============================================================================

export type PlaybookRole = 'SE' | 'TL' | 'SM' | 'DIGITAL_MARKETING' | 'ADMIN';

export interface BantDimension {
  dimension: 'Budget' | 'Authority' | 'Need' | 'Timeline';
  weightPercent: number;
  minScoreToPass: number; // Skala 1 - 10, batas lolos >= 7
  qualificationQuestions: string[];
  indicatorPassing: string;
}

export interface SopStep {
  timeOrFrequency: string; // e.g. "08:00 - 08:30 WIB"
  channel: 'Canvassing' | 'Telepon / Calling' | 'WhatsApp / DM' | 'Posting Medsos' | 'OTT (Open Table Talk)' | 'Iklan Berbayar' | 'Supervisi';
  activityName: string;
  instruction: string;
  targetOutput: string;
  slaMinutes?: number;
}

export interface KpiItem {
  metric: string;
  targetPeriod: 'Harian' | 'Mingguan' | 'Bulanan';
  targetValue: string;
  scoringWeightPercent: number;
  minimumAcceptableValue: string;
}

export interface DailyRouteWaypoint {
  order: number;
  name: string;
  category: 'Perkantoran & RS' | 'Perbankan & Finansial' | 'Pasar & Sentra Niaga' | 'Perumahan Sekitar';
  coordinates: { lat: number; lng: number };
  estimatedDriveMinutes: number;
  canvassingDurationMinutes: number;
  canvassingObjective: string;
  flyersTarget: number;
  leadTarget: number;
}

export interface DailyRouteScheduleItem {
  timeRange: string;
  activity: string;
  location: string;
  notes: string;
}

export interface DailyRoutePlan {
  id: string;
  projectId: string;
  projectName: string;
  dayName: string;
  routeName: string;
  startPoint: { name: string; lat: number; lng: number };
  waypoints: DailyRouteWaypoint[];
  totalDistanceKm: number;
  estimatedHours: number;
  totalLeadTarget: number;
  hourlySchedule: DailyRouteScheduleItem[];
}

export interface PlaybookPlan {
  id: string;
  projectId: string;
  projectName: string;
  role: PlaybookRole;
  version: number;
  title: string;
  aiMode: 'human_only' | 'semi_ai' | 'full_ai';
  monthlyUnitTarget: number;
  reverseFunnelTargets: {
    leads: number;
    prospek: number;
    hot_prospek: number;
    survei: number;
    booking: number;
    closing: number;
  };
  bantCriteria: BantDimension[];
  dailySop: SopStep[];
  weeklySop: SopStep[];
  monthlySop: SopStep[];
  kpiMetrics: KpiItem[];
  generatedAt: string;
  tokensUsed?: number; // Internal admin metric only, never in exports
}
