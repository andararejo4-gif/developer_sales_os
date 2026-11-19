// ============================================================================
// CRM & PIPELINE TYPES - DEVELOPER SALES OS
// ============================================================================

export type LeadStage =
  | 'LEAD_BARU'
  | 'TERKUALIFIKASI'
  | 'PROSPEK'
  | 'HOT_PROSPEK'
  | 'BOOKING'
  | 'AKAD_CLOSING'
  | 'BATAL_HILANG';

export interface LeadBant {
  budget: number; // 1..10
  authority: number;
  need: number;
  timeline: number;
  totalScore: number;
}

export interface ProjectLead {
  id: string;
  projectId: string;
  fullName: string;
  phoneWhatsapp: string;
  email?: string;
  source: string;
  stage: LeadStage;
  bant: LeadBant;
  unitOfInterest: string;
  estimatedValueIdr: number;
  assignedSeName: string;
  assignedTlName: string;
  nextFollowUpDate: string; // YYYY-MM-DD
  nextActionPlan: string;
  notes: string;
  labelTag: string; // e.g. "Nama Lead (SE 001 Budi - TL 001 Siti)"
  createdAt: string;
  updatedAt: string;
}

export interface CommissionStructure {
  companySharePercent: number;
  smSharePercent: number;
  tlSharePercent: number;
  seSharePercent: number;
  affiliatorSharePercent: number;
}
