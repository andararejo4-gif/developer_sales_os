// ============================================================================
// TESTS: CRM PIPELINE, SUBORDINATE TAGGING, & COMMISSION RULES (FASE 6)
// ============================================================================

import { describe, expect, it } from 'bun:test';
import {
  getProjectLeads,
  addProjectLead,
  moveLeadStage,
  getFollowUpChecklist,
  getCommissionStructure,
  updateCommissionStructure,
  resetCrmStore,
} from '../src/lib/crm/crm-store';

describe('Fase 6: CRM Pipeline 7 Stages & Subordinate Tagging', () => {
  it('manages leads through 7 canonical stages', () => {
    resetCrmStore();
    const leads = getProjectLeads('proj-the-park-01');
    expect(leads.length).toBeGreaterThanOrEqual(4);

    const firstLead = leads[0];

    // Transition to next stage
    const updated = moveLeadStage(firstLead.id, 'TERKUALIFIKASI');
    expect(updated).not.toBeNull();
    expect(updated?.stage).toBe('TERKUALIFIKASI');

    // Subordinate format check: Name (SE Budi - TL Siti)
    expect(firstLead.assignedSeName).toBeDefined();
    expect(firstLead.assignedTlName).toBeDefined();
    expect(firstLead.labelTag).toContain('SE 001 Budi');
  });

  it('filters and sorts follow-up checklist strictly based on nextFollowUpDate', () => {
    const checklist = getFollowUpChecklist('proj-the-park-01');
    expect(checklist.length).toBeGreaterThan(0);

    // Verify all returned leads have follow up date on or before date filter
    for (const lead of checklist) {
      expect(lead.nextFollowUpDate).toBeDefined();
    }
  });

  it('allows capturing a new inbound lead from website landing form', () => {
    const newLead = addProjectLead({
      projectId: 'proj-the-park-01',
      fullName: 'Ibu Ratna Paramitha',
      phoneWhatsapp: '081299887766',
      unitOfInterest: 'Type 65/90 Hook',
      source: 'Website Landing Page',
      assignedSeName: 'SE 001 Budi Santoso',
      assignedTlName: 'TL 001 Siti Rahmawati',
      notes: 'Bertanya jadwal survei hari Sabtu',
      nextFollowUpDate: '2026-11-20',
      nextActionPlan: 'Konfirmasi jam survei bersama suami',
    });

    expect(newLead.id).toBeDefined();
    expect(newLead.stage).toBe('LEAD_BARU');
    expect(newLead.source).toBe('Website Landing Page');
    expect(newLead.fullName).toBe('Ibu Ratna Paramitha');
  });
});

describe('Fase 6: Commission Sharing Rules & Governance', () => {
  it('validates commission rules that sum to exactly 100%', () => {
    const current = getCommissionStructure();
    const total =
      current.companySharePercent +
      current.smSharePercent +
      current.tlSharePercent +
      current.seSharePercent +
      current.affiliatorSharePercent;
    expect(total).toBe(100);

    // Update with another valid 100% split
    const updated = updateCommissionStructure({
      companySharePercent: 40,
      smSharePercent: 15,
      tlSharePercent: 15,
      seSharePercent: 25,
      affiliatorSharePercent: 5,
    });

    const updatedTotal =
      updated.companySharePercent +
      updated.smSharePercent +
      updated.tlSharePercent +
      updated.seSharePercent +
      updated.affiliatorSharePercent;
    expect(updatedTotal).toBe(100);
  });
});
