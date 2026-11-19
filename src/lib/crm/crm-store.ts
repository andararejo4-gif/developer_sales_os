// ============================================================================
// CRM & PIPELINE STORE - DEVELOPER SALES OS
// Project-Isolated Leads, Follow-Up Checklist by Date, & Commission Rules
// ============================================================================

import type { ProjectLead, LeadStage, CommissionStructure } from './types';

const todayIso = new Date().toISOString().split('T')[0];
const tomorrowIso = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const INITIAL_THE_PARK_LEADS: ProjectLead[] = [
  {
    id: 'lead-01',
    projectId: 'proj-the-park-01',
    fullName: 'dr. Hendra Kusuma, Sp.A',
    phoneWhatsapp: '081234567891',
    email: 'dr.hendra@gmail.com',
    source: 'Website Landing Page (thepark)',
    stage: 'HOT_PROSPEK',
    bant: {
      budget: 9,
      authority: 9,
      need: 10,
      timeline: 8,
      totalScore: 9.1,
    },
    unitOfInterest: 'Nagoya Deluxe 2 Lantai',
    estimatedValueIdr: 850000000,
    assignedSeName: 'SE 001 Budi Santoso',
    assignedTlName: 'TL 001 Siti Rahmawati',
    nextFollowUpDate: todayIso,
    nextActionPlan: 'Jadwalkan Survei Lokasi Show Unit Hari Ini (Sore)',
    notes: 'Dokter spesialis RS Indriati; butuh rumah 2 lantai siap huni dekat tempat dinas.',
    labelTag: 'dr. Hendra Kusuma (SE 001 Budi - TL 001 Siti)',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lead-02',
    projectId: 'proj-the-park-01',
    fullName: 'H. Sukamto (Toko Tekstil Klewer)',
    phoneWhatsapp: '081234567892',
    source: 'Kanvasing SE Mandan',
    stage: 'BOOKING',
    bant: {
      budget: 10,
      authority: 9,
      need: 8,
      timeline: 9,
      totalScore: 9.1,
    },
    unitOfInterest: 'Tokyo Executive Hook 2 Lantai',
    estimatedValueIdr: 1150000000,
    assignedSeName: 'SE 002 Denny Pratama',
    assignedTlName: 'TL 001 Siti Rahmawati',
    nextFollowUpDate: tomorrowIso,
    nextActionPlan: 'Konfirmasi Pengikatan Berkas SPK & Notaris PPAT',
    notes: 'Opsi Cash Bertahap 12 bulan; DP Rp 300 Juta sudah siap ditransfer.',
    labelTag: 'H. Sukamto (SE 002 Denny - TL 001 Siti)',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lead-03',
    projectId: 'proj-the-park-01',
    fullName: 'Rina Wulandari, S.E.',
    phoneWhatsapp: '081234567893',
    email: 'rina.wulandari@bank.co.id',
    source: 'Instagram Reels Ad',
    stage: 'TERKUALIFIKASI',
    bant: {
      budget: 8,
      authority: 7,
      need: 8,
      timeline: 7,
      totalScore: 7.6,
    },
    unitOfInterest: 'Osaka Premiere 2 Lantai',
    estimatedValueIdr: 950000000,
    assignedSeName: 'SE 001 Budi Santoso',
    assignedTlName: 'TL 001 Siti Rahmawati',
    nextFollowUpDate: todayIso,
    nextActionPlan: 'Kirimkan Tabel Simulasi KPR BTN Syariah via WhatsApp',
    notes: 'Keluarga muda profesional; membutuhkan plafon cicilan Rp 6 jutaan.',
    labelTag: 'Rina Wulandari (SE 001 Budi - TL 001 Siti)',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lead-04',
    projectId: 'proj-the-park-01',
    fullName: 'Ir. Bambang Triyono',
    phoneWhatsapp: '081234567894',
    source: 'TikTok House Tour',
    stage: 'LEAD_BARU',
    bant: {
      budget: 7,
      authority: 7,
      need: 7,
      timeline: 6,
      totalScore: 6.8,
    },
    unitOfInterest: 'Nagoya Deluxe 2 Lantai',
    estimatedValueIdr: 850000000,
    assignedSeName: 'SE 003 Maya Anggraini',
    assignedTlName: 'TL 001 Siti Rahmawati',
    nextFollowUpDate: todayIso,
    nextActionPlan: 'SLA Respon Cepat ≤ 5 Menit: Kirim Sapaan Personal & E-Brochure',
    notes: 'Baru saja submit form di landing page website.',
    labelTag: 'Ir. Bambang Triyono (SE 003 Maya - TL 001 Siti)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let leadsDatabase = [...INITIAL_THE_PARK_LEADS];

export function getProjectLeads(projectId: string = 'proj-the-park-01'): ProjectLead[] {
  return leadsDatabase.filter((l) => l.projectId === projectId);
}

export function moveLeadStage(leadId: string, newStage: LeadStage): ProjectLead | null {
  const target = leadsDatabase.find((l) => l.id === leadId);
  if (!target) return null;
  target.stage = newStage;
  target.updatedAt = new Date().toISOString();
  return { ...target };
}

export function addProjectLead(newLead: Partial<ProjectLead>): ProjectLead {
  const id = `lead-${Date.now()}`;
  const se = newLead.assignedSeName || 'SE 001 Budi Santoso';
  const tl = newLead.assignedTlName || 'TL 001 Siti Rahmawati';
  const seShort = se.split(' ')[0] + ' ' + se.split(' ')[1] + ' ' + (se.split(' ')[2] || '');
  const tlShort = tl.split(' ')[0] + ' ' + tl.split(' ')[1] + ' ' + (tl.split(' ')[2] || '');

  const bant = newLead.bant || { budget: 7, authority: 7, need: 7, timeline: 7, totalScore: 7.0 };

  const created: ProjectLead = {
    id,
    projectId: newLead.projectId || 'proj-the-park-01',
    fullName: newLead.fullName || 'Lead Baru',
    phoneWhatsapp: newLead.phoneWhatsapp || '081234567890',
    email: newLead.email,
    source: newLead.source || 'Website Landing Page',
    stage: newLead.stage || 'LEAD_BARU',
    bant,
    unitOfInterest: newLead.unitOfInterest || 'Nagoya Deluxe 2 Lantai',
    estimatedValueIdr: newLead.estimatedValueIdr || 850000000,
    assignedSeName: se,
    assignedTlName: tl,
    nextFollowUpDate: newLead.nextFollowUpDate || todayIso,
    nextActionPlan: newLead.nextActionPlan || 'First Contact WhatsApp SOP ≤ 5 Menit',
    notes: newLead.notes || 'Lead otomatis dari website',
    labelTag: `${newLead.fullName} (${seShort} - ${tlShort})`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  leadsDatabase.unshift(created);
  return created;
}

export function getFollowUpChecklist(projectId: string = 'proj-the-park-01', dateStr: string = todayIso): ProjectLead[] {
  return leadsDatabase
    .filter((l) => l.projectId === projectId && l.nextFollowUpDate <= dateStr && l.stage !== 'AKAD_CLOSING' && l.stage !== 'BATAL_HILANG')
    .sort((a, b) => (b.bant.totalScore || 0) - (a.bant.totalScore || 0));
}

let defaultCommission: CommissionStructure = {
  companySharePercent: 60,
  smSharePercent: 10,
  tlSharePercent: 10,
  seSharePercent: 15,
  affiliatorSharePercent: 5,
};

export function resetCrmStore(): void {
  leadsDatabase = structuredClone(INITIAL_THE_PARK_LEADS);
}

export function getCommissionStructure(): CommissionStructure {
  return { ...defaultCommission };
}

export function updateCommissionStructure(newStructure: CommissionStructure): CommissionStructure {
  defaultCommission = { ...newStructure };
  return { ...defaultCommission };
}
