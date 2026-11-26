// ============================================================================
// DEVELOPER SALES OS - 48 AGENT REGISTRY & SYNTHETIC EVAL HARNESS
// Covers Checklist: AG-A01..A48, AI-02, AI-03, AI-06, DAT-12, QA-02
// ============================================================================

export type AgentGate = 'G0' | 'G1' | 'G2' | 'G3';
export type AgentCategory = 'SHARED_CONTROL' | 'GROWTH_BRAND' | 'SALES_FIELD' | 'FINANCE_OPS_EXEC';

export interface AgentContract {
  id: string; // A01..A48
  name: string;
  category: AgentCategory;
  requiredGate: AgentGate;
  aicRate: number;
  requiresHumanApproval: boolean;
  allowedTools: string[];
}

const SHARED_CONTROLS: AgentContract[] = [
  { id: 'A01', name: 'Truth & Evidence Grounding Guard', category: 'SHARED_CONTROL', requiredGate: 'G0', aicRate: 0, requiresHumanApproval: false, allowedTools: ['kb.search', 'truth.verify'] },
  { id: 'A02', name: 'Readiness Gate Enforcer (G0-G3)', category: 'SHARED_CONTROL', requiredGate: 'G0', aicRate: 0, requiresHumanApproval: false, allowedTools: ['gate.check'] },
  { id: 'A03', name: 'AIC FinOps Reserve & Receipt Guard', category: 'SHARED_CONTROL', requiredGate: 'G0', aicRate: 0, requiresHumanApproval: false, allowedTools: ['aic.preview', 'aic.reserve', 'aic.settle'] },
  { id: 'A04', name: 'PII Masking & Consent Guard', category: 'SHARED_CONTROL', requiredGate: 'G0', aicRate: 0, requiresHumanApproval: false, allowedTools: ['sec.mask', 'consent.check'] },
  { id: 'A05', name: 'Prompt Injection & Output Schema Guard', category: 'SHARED_CONTROL', requiredGate: 'G0', aicRate: 0, requiresHumanApproval: false, allowedTools: ['ai.sanitize', 'ai.validate_json'] },
  { id: 'A06', name: 'Human Escalation & SLA Router', category: 'SHARED_CONTROL', requiredGate: 'G0', aicRate: 0, requiresHumanApproval: true, allowedTools: ['escalation.create'] },
  { id: 'A07', name: 'Tenant & Role Isolation Verifier', category: 'SHARED_CONTROL', requiredGate: 'G0', aicRate: 0, requiresHumanApproval: false, allowedTools: ['auth.assert_scope'] },
  { id: 'A08', name: 'Audit & Telemetry Emitter', category: 'SHARED_CONTROL', requiredGate: 'G0', aicRate: 0, requiresHumanApproval: false, allowedTools: ['audit.write'] },
];

const SPECIALIST_NAMES: Array<{ name: string; category: AgentCategory; gate: AgentGate; aic: number; human: boolean }> = [
  { name: 'Ingestion & OCR Document Extractor', category: 'GROWTH_BRAND', gate: 'G0', aic: 25, human: false },
  { name: 'Document Truth Conflict Detector', category: 'GROWTH_BRAND', gate: 'G0', aic: 15, human: true },
  { name: 'POI & Radius Market Researcher (500m-25km)', category: 'GROWTH_BRAND', gate: 'G0', aic: 500, human: false },
  { name: 'Competitor Benchmarking Analyst', category: 'GROWTH_BRAND', gate: 'G0', aic: 150, human: false },
  { name: '99 Keunggulan Love-Letter Architect', category: 'GROWTH_BRAND', gate: 'G0', aic: 400, human: false },
  { name: 'Buyer Persona & Segmenter', category: 'GROWTH_BRAND', gate: 'G0', aic: 100, human: false },
  { name: 'Brand Kit & Tone-of-Voice Builder', category: 'GROWTH_BRAND', gate: 'G0', aic: 80, human: false },
  { name: '30-Day Official Content Calendar Planner', category: 'GROWTH_BRAND', gate: 'G1', aic: 450, human: true },
  { name: 'In-House Sales Personal Content Planner', category: 'GROWTH_BRAND', gate: 'G1', aic: 150, human: false },
  { name: 'Visual Poster & Carousel Prompt Composer', category: 'GROWTH_BRAND', gate: 'G1', aic: 75, human: true },
  { name: 'Landing Page Section & Copy Generator', category: 'GROWTH_BRAND', gate: 'G1', aic: 300, human: true },
  { name: 'SEO & Local Schema Optimizer', category: 'GROWTH_BRAND', gate: 'G1', aic: 50, human: false },
  { name: 'Meta/TikTok/IG Ad Creative Variant Writer', category: 'GROWTH_BRAND', gate: 'G2', aic: 75, human: true },
  { name: 'Campaign Budget & CPL Guard', category: 'GROWTH_BRAND', gate: 'G2', aic: 20, human: true },
  { name: 'Creator & Affiliate Brief Generator', category: 'GROWTH_BRAND', gate: 'G1', aic: 50, human: true },
  { name: 'Creator Submission Compliance Checker', category: 'GROWTH_BRAND', gate: 'G1', aic: 15, human: true },
  { name: 'AI Sales Concierge (WhatsApp Inbound)', category: 'SALES_FIELD', gate: 'G2', aic: 1, human: false },
  { name: 'Lead Qualification & Scoring Agent', category: 'SALES_FIELD', gate: 'G2', aic: 2, human: false },
  { name: '4-Pillar Soft-Selling Follow-Up Composer', category: 'SALES_FIELD', gate: 'G2', aic: 3, human: false },
  { name: 'Objection Handling Coach', category: 'SALES_FIELD', gate: 'G0', aic: 5, human: false },
  { name: 'SE Daily Canvassing Route Planner', category: 'SALES_FIELD', gate: 'G0', aic: 30, human: false },
  { name: 'SE Activity AI Guide (F100)', category: 'SALES_FIELD', gate: 'G0', aic: 5, human: false },
  { name: 'SE Field Call & Visit Summarizer', category: 'SALES_FIELD', gate: 'G0', aic: 5, human: false },
  { name: 'Team Leader Daily Briefing & Coaching Agent', category: 'SALES_FIELD', gate: 'G0', aic: 40, human: false },
  { name: 'Sales Manager Semi-AI Pipeline Advisor', category: 'SALES_FIELD', gate: 'G0', aic: 60, human: true },
  { name: 'Playbook SE/TL/SM Generator', category: 'SALES_FIELD', gate: 'G0', aic: 400, human: false },
  { name: 'Site Visit Scheduler & Reminder Agent', category: 'SALES_FIELD', gate: 'G2', aic: 2, human: false },
  { name: 'Referral & Partner Attribution Assistant', category: 'SALES_FIELD', gate: 'G1', aic: 5, human: true },
  { name: 'Stale Lead Revival & Nurture Sequencer', category: 'SALES_FIELD', gate: 'G2', aic: 5, human: true },
  { name: 'Voice Call Intent Classifier', category: 'SALES_FIELD', gate: 'G2', aic: 5, human: false },
  { name: 'Unit Hold & Double-Booking Lock Guard', category: 'FINANCE_OPS_EXEC', gate: 'G3', aic: 0, human: false },
  { name: 'Deterministic CK/CT/KPR Quote Builder', category: 'FINANCE_OPS_EXEC', gate: 'G3', aic: 10, human: false },
  { name: 'KPR Bank Readiness & SLIK Pre-Screener', category: 'FINANCE_OPS_EXEC', gate: 'G3', aic: 15, human: true },
  { name: 'SPR & Booking Document Assembler', category: 'FINANCE_OPS_EXEC', gate: 'G3', aic: 10, human: true },
  { name: 'Bank Whitelist & Transfer Verification Guard', category: 'FINANCE_OPS_EXEC', gate: 'G3', aic: 0, human: true },
  { name: 'Commission & Affiliate Payout Calculator', category: 'FINANCE_OPS_EXEC', gate: 'G3', aic: 0, human: true },
  { name: 'DLP Warranty & Complaint Triage Agent', category: 'FINANCE_OPS_EXEC', gate: 'G1', aic: 5, human: true },
  { name: 'Direksi Control Tower Anomaly Reporter', category: 'FINANCE_OPS_EXEC', gate: 'G0', aic: 20, human: false },
  { name: 'Monthly Unit-Stock Sales Target Allocator', category: 'FINANCE_OPS_EXEC', gate: 'G0', aic: 15, human: true },
  { name: 'COGS & FinOps Margin Telemetry Reporter', category: 'FINANCE_OPS_EXEC', gate: 'G0', aic: 0, human: false },
];

export const AGENT_REGISTRY_48: AgentContract[] = [
  ...SHARED_CONTROLS,
  ...SPECIALIST_NAMES.map((spec, idx) => ({
    id: `A${String(idx + 9).padStart(2, '0')}`,
    name: spec.name,
    category: spec.category,
    requiredGate: spec.gate,
    aicRate: spec.aic,
    requiresHumanApproval: spec.human,
    allowedTools: ['kb.search', 'audit.write'],
  })),
];

export function verifyAgentRegistryIntegrity(): { total: number; uniqueIds: number; valid: boolean } {
  const ids = new Set(AGENT_REGISTRY_48.map((a) => a.id));
  return {
    total: AGENT_REGISTRY_48.length,
    uniqueIds: ids.size,
    valid: AGENT_REGISTRY_48.length === 48 && ids.size === 48,
  };
}
