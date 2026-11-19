// ============================================================================
// CONTENT CALENDAR TYPES - DEVELOPER SALES OS
// ============================================================================

export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU';

export type ContentTrack = 'OFFICIAL' | 'SALES_IN_HOUSE';

export type ContentPlatform =
  | 'Instagram'
  | 'TikTok'
  | 'Facebook'
  | 'X'
  | 'YouTube Shorts';

export type ContentFormat =
  | 'Reels / Video Pendek'
  | 'Carousel Edukasi'
  | 'Single Image + Visual Quote'
  | 'Video Walkthrough / Room Tour'
  | 'Thread / Teks Analisis'
  | 'Story Interaktif Q&A';

export type PostingStatus = 'DRAFT' | 'SIAP' | 'SUDAH_POSTING';

export interface ContentSlot {
  id: string;
  dayNumber: number; // 1 s.d. 30
  slotOrder: 1 | 2 | 3; // 1: TOFU (Pagi), 2: MOFU (Siang/Sore), 3: BOFU (Malam)
  scheduledTime: string; // e.g. "09:00 WIB"
  funnelStage: FunnelStage;
  track: ContentTrack;
  platform: ContentPlatform;
  format: ContentFormat;
  title: string;
  brief: string;
  caption: string;
  hashtags: string[];
  cta: string;
  sourceFactId: string;
  sourceLoveLetterPoint: number;
  status: PostingStatus;
  postedUrl?: string;
  postedAt?: string;
  notes?: string;
}

export interface ContentCalendarPlan {
  id: string;
  projectId: string;
  projectName: string;
  version: number;
  monthPeriod: string;
  activePlatforms: ContentPlatform[];
  hasSalesTrack: boolean;
  slots: ContentSlot[];
  totalSlots: number;
  postedSlotsCount: number;
  generatedAt: string;
  tokensUsed?: number; // Internal admin metric only, never in exports
}

export interface CalendarFilterOptions {
  viewMode: 'month' | 'week' | 'day';
  selectedTrack: ContentTrack;
  selectedPlatform: 'all' | ContentPlatform;
  selectedFunnel: 'all' | FunnelStage;
  selectedStatus: 'all' | PostingStatus;
  selectedDay?: number;
  selectedWeek?: number; // 1..5
}
