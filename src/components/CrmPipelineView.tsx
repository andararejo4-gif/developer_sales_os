// ============================================================================
// CRM PIPELINE VIEW COMPONENT - DEVELOPER SALES OS
// Project-Isolated Kanban Pipeline, BANT Matrix, & Date-Driven Follow-Up Checklist
// ============================================================================

import { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Clock,
  MessageCircle,
  Calendar,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  getProjectLeads,
  moveLeadStage,
  addProjectLead,
  getFollowUpChecklist,
} from '../lib/crm/crm-store';
import { formatRupiah } from '../lib/sales-target/calculator';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';
import type { ProjectLead, LeadStage } from '../lib/crm/types';

type CrmViewTab = 'kanban' | 'checklist';
const VALID_CRM_TABS: CrmViewTab[] = ['kanban', 'checklist'];

interface CrmPipelineViewProps {
  projectId?: string;
  projectName?: string;
  userRole?: string;
  variant?: 'modal' | 'page';
  onClose?: () => void;
}

export const STAGE_CONFIG: { key: LeadStage; label: string; colorCls: string }[] = [
  { key: 'LEAD_BARU', label: '1. Lead Baru', colorCls: 'bg-sandstone text-espresso' },
  { key: 'TERKUALIFIKASI', label: '2. Terkualifikasi', colorCls: 'bg-blue-50 text-blue-900 border-blue-200' },
  { key: 'PROSPEK', label: '3. Prospek', colorCls: 'bg-amber-50 text-amber-900 border-amber-200' },
  { key: 'HOT_PROSPEK', label: '4. Hot Prospek (BANT ≥ 7)', colorCls: 'bg-orange-50 text-terracotta border-orange-200' },
  { key: 'BOOKING', label: '5. Booking (SPK)', colorCls: 'bg-purple-50 text-purple-900 border-purple-200' },
  { key: 'AKAD_CLOSING', label: '6. Akad / Closing', colorCls: 'bg-lime-100 text-olive border-lime-300' },
  { key: 'BATAL_HILANG', label: 'Batal / Hilang', colorCls: 'bg-rose-50 text-rose-800 border-rose-200' },
];

export function CrmPipelineView({
  projectId = 'proj-the-park-01',
  projectName = 'The Park Townhouse Sukoharjo',
  variant = 'modal',
  onClose,
}: CrmPipelineViewProps) {
  const [leads, setLeads] = useState<ProjectLead[]>(() =>
    loadPersistedState<ProjectLead[]>(`devos_crm_leads_${projectId}`, getProjectLeads(projectId))
  );
  const [viewMode, setViewMode] = useState<CrmViewTab>(() => {
    const urlTab = variant === 'page' ? getQueryParam('tab') : null;
    if (urlTab && VALID_CRM_TABS.includes(urlTab as CrmViewTab)) {
      return urlTab as CrmViewTab;
    }
    return loadPersistedState<CrmViewTab>(`devos_crm_tab_${projectId}`, 'kanban');
  });
  const [selectedLead, setSelectedLead] = useState<ProjectLead | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dataSourceMode, setDataSourceMode] = useState<'db' | 'local'>('local');

  useEffect(() => {
    let active = true;
    fetch(`/api/pipeline/leads?projectId=${encodeURIComponent(projectId)}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active || !json?.ok || !Array.isArray(json.leads)) return;
        const mapped: ProjectLead[] = json.leads.map((row: any) => ({
          id: String(row.id),
          projectId: String(row.project_id || projectId),
          fullName: String(row.full_name || '-'),
          phoneWhatsapp: String(row.phone_wa || ''),
          source: String(row.source || 'WhatsApp Inbound'),
          stage: (row.stage || 'LEAD_BARU') as LeadStage,
          unitOfInterest: String(row.unit_interest || '-'),
          assignedSeName: String(row.owner_se_name || row.owner_se_email || 'SE'),
          nextActionPlan: String(row.next_action || ''),
          notes: String(row.sales_notes || ''),
          createdAt: String(row.created_at || new Date().toISOString()),
          updatedAt: String(row.updated_at || new Date().toISOString()),
          bant: {
            budget: Number(row.bant_b || 0),
            authority: Number(row.bant_a || 0),
            need: Number(row.bant_n || 0),
            timeline: Number(row.bant_t || 0),
            totalScore: Number(row.bant_total || 0),
          },
        }));
        if (mapped.length > 0) {
          setLeads(mapped);
        }
        setDataSourceMode('db');
      })
      .catch(() => {
        // Fallback ke cache lokal bila belum login / offline
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  useEffect(() => {
    savePersistedState(`devos_crm_tab_${projectId}`, viewMode);
    if (variant === 'page') {
      setQueryParam('tab', viewMode);
    }
  }, [viewMode, projectId, variant]);

  useEffect(() => {
    savePersistedState(`devos_crm_leads_${projectId}`, leads);
  }, [leads, projectId]);

  const followUpChecklist = getFollowUpChecklist(projectId);

  const handleStageMove = (leadId: string, nextStage: LeadStage) => {
    const updated = moveLeadStage(leadId, nextStage);
    if (updated) {
      setLeads(getProjectLeads(projectId));
      setToastMessage(`Status prospek diperbarui ke ${nextStage}`);
    }
  };

  const handleAddLeadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const created = addProjectLead({
      projectId,
      fullName: fd.get('fullName') as string,
      phoneWhatsapp: fd.get('phone') as string,
      source: fd.get('source') as string,
      unitOfInterest: fd.get('unit') as string,
      assignedSeName: fd.get('se') as string,
      nextActionPlan: fd.get('action') as string,
      notes: fd.get('notes') as string,
      bant: {
        budget: Number(fd.get('b') || 7),
        authority: Number(fd.get('a') || 7),
        need: Number(fd.get('n') || 7),
        timeline: Number(fd.get('t') || 7),
        totalScore: Number((
          Number(fd.get('b') || 7) * 0.3 +
          Number(fd.get('a') || 7) * 0.25 +
          Number(fd.get('n') || 7) * 0.25 +
          Number(fd.get('t') || 7) * 0.2
        ).toFixed(1)),
      },
    });

    setLeads(getProjectLeads(projectId));
    setShowAddLeadModal(false);
    setToastMessage(`Lead baru "${created.fullName}" berhasil ditambahkan.`);
  };

  const outerClass =
    variant === 'page'
      ? 'w-full'
      : 'fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200';
  const cardClass =
    variant === 'page'
      ? 'bg-white rounded-2xl border border-warmborder w-full flex flex-col overflow-hidden shadow-xs'
      : 'bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden';

  return (
    <div className={outerClass}>
      <div className={cardClass}>
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 bg-sandstone/60 border-b border-warmborder flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="size-10 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm shrink-0">
              <Users className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-espresso tracking-tight leading-snug">
                  CRM &amp; Pipeline Penjualan
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-terracotta/10 text-terracotta border border-terracotta/20 shrink-0">
                  {leads.length} Leads
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dataSourceMode === 'db' ? 'bg-lime-100 text-olive' : 'bg-amber-100 text-terracotta'}`}>
                  {dataSourceMode === 'db' ? 'Sinkron DB' : 'Cache Lokal'}
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5 leading-relaxed">
                {projectName} &middot; Corong Penjualan, BANT &ge; 7, &amp; Tindak Lanjut
              </p>
            </div>
            {variant === 'modal' && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup CRM"
                className="sm:hidden size-10 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddLeadModal(true)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-terracotta text-white hover:bg-terracotta/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Plus className="size-3.5 shrink-0" />
              <span>Input Lead Baru</span>
            </button>

            {variant === 'modal' && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup CRM"
                className="hidden sm:flex size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso items-center justify-center transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-warmborder flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap p-1 bg-sandstone rounded-xl border border-warmborder gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-espresso shadow-sm' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Papan Kanban Pipeline (7 Tahap)
            </button>
            <button
              onClick={() => setViewMode('checklist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'checklist' ? 'bg-white text-espresso shadow-sm' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              <Calendar className="size-3.5 text-terracotta" />
              <span>Checklist Tindak Lanjut Tanggal ({followUpChecklist.length})</span>
            </button>
          </div>

          <span className="text-xs text-warmmuted font-medium hidden sm:inline">
            Semua lead terisolasi di proyek: <strong>{projectName}</strong>
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5]">
          {/* VIEW 1: KANBAN BOARD */}
          {viewMode === 'kanban' && (
            <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[480px]">
              {STAGE_CONFIG.map((stage) => {
                const stageLeads = leads.filter((l) => l.stage === stage.key);
                return (
                  <div
                    key={stage.key}
                    className="w-72 shrink-0 bg-sandstone/30 rounded-3xl p-3.5 border border-warmborder/80 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-warmborder/50">
                      <span className="text-xs font-black text-espresso">{stage.label}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-white text-warmmuted border border-warmborder">
                        {stageLeads.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[520px]">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="p-3.5 rounded-2xl bg-white border border-warmborder hover:border-terracotta/70 shadow-sm transition-all cursor-pointer space-y-2"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-terracotta uppercase">
                              {lead.source}
                            </span>
                            <h4 className="text-xs font-extrabold text-espresso leading-snug mt-0.5">
                              {lead.labelTag}
                            </h4>
                            <p className="text-[11px] text-warmmuted mt-0.5">{lead.unitOfInterest}</p>
                          </div>

                          {/* BANT Badge */}
                          <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-warmborder/40">
                            <span
                              className={`px-1.5 py-0.2 rounded font-black ${
                                lead.bant.totalScore >= 7
                                  ? 'bg-lime-100 text-olive'
                                  : 'bg-sandstone text-warmmuted'
                              }`}
                            >
                              BANT: {lead.bant.totalScore}/10
                            </span>
                            <span className="font-mono font-bold text-espresso">
                              {formatRupiah(lead.estimatedValueIdr)}
                            </span>
                          </div>

                          {/* Next Action */}
                          <div className="text-[10px] bg-sandstone/50 p-2 rounded-xl text-warmmuted flex items-start gap-1">
                            <Clock className="size-3 text-terracotta shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{lead.nextActionPlan}</span>
                          </div>

                          {/* Stage Transition Buttons */}
                          <div className="pt-2 flex justify-between gap-1">
                            {stage.key !== 'AKAD_CLOSING' && stage.key !== 'BATAL_HILANG' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentIdx = STAGE_CONFIG.findIndex((s) => s.key === stage.key);
                                  if (currentIdx !== -1 && currentIdx < STAGE_CONFIG.length - 2) {
                                    handleStageMove(lead.id, STAGE_CONFIG[currentIdx + 1].key);
                                  }
                                }}
                                className="w-full py-1 rounded-lg bg-sandstone hover:bg-terracotta hover:text-white text-[10px] font-bold text-espresso transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>Maju Tahap</span>
                                <ArrowRight className="size-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="py-8 text-center text-xs text-warmmuted/60 italic">
                          Belum ada lead
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: FOLLOW-UP CHECKLIST BASED ON DATE */}
          {viewMode === 'checklist' && (
            <div className="bg-white rounded-3xl border border-warmborder shadow-sm p-6 space-y-4">
              <div className="border-b border-warmborder pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-espresso">
                    Checklist Tindak Lanjut Harian (Berdasarkan Tanggal Tindak Lanjut)
                  </h3>
                  <p className="text-xs text-warmmuted">
                    Diurutkan dari jadwal hari ini &amp; skor BANT tertinggi (Bukan berdasarkan tanggal input lead)
                  </p>
                </div>
                <span className="text-xs font-bold text-terracotta bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                  {followUpChecklist.length} Tindak Lanjut Perlu Dilakukan
                </span>
              </div>

              <div className="divide-y divide-warmborder">
                {followUpChecklist.map((lead) => (
                  <div
                    key={lead.id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-sandstone/20 transition-colors rounded-xl px-2"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-xs text-espresso whitespace-nowrap shrink-0">{lead.labelTag}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-terracotta whitespace-nowrap shrink-0">
                          {lead.stage}
                        </span>
                        <span className="text-[10px] font-bold text-olive bg-lime-50 px-1.5 py-0.5 rounded border border-lime-200 whitespace-nowrap shrink-0">
                          BANT: {lead.bant.totalScore}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-espresso flex items-center gap-1.5">
                        <Clock className="size-3.5 text-terracotta" />
                        Rencana Aksi: {lead.nextActionPlan}
                      </p>
                      <p className="text-[11px] text-warmmuted">
                        Target Jadwal: <strong>{lead.nextFollowUpDate}</strong> &middot; Unit: {lead.unitOfInterest}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${lead.phoneWhatsapp.replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-olive text-white text-xs font-bold hover:bg-olive/90 flex items-center gap-1 transition-colors"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>Chat WA</span>
                      </a>
                      <button
                        onClick={() => handleStageMove(lead.id, 'HOT_PROSPEK')}
                        className="px-3 py-1.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer"
                      >
                        Tandai Hot Prospek
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Detail Lead */}
        {selectedLead && (
          <div className="fixed inset-0 z-60 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-warmborder max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-warmborder pb-3">
                <div>
                  <span className="text-[10px] font-bold text-terracotta uppercase">{selectedLead.source}</span>
                  <h3 className="text-base font-extrabold text-espresso mt-0.5">{selectedLead.fullName}</h3>
                </div>
                <button onClick={() => setSelectedLead(null)} className="text-warmmuted hover:text-espresso">
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-sandstone/50 rounded-2xl border border-warmborder">
                  <div>
                    <span className="text-[10px] text-warmmuted block">No. WhatsApp:</span>
                    <strong className="text-espresso">{selectedLead.phoneWhatsapp}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-warmmuted block">Unit Diminati:</span>
                    <strong className="text-espresso">{selectedLead.unitOfInterest}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-warmmuted block">Sales Executive:</span>
                    <strong className="text-terracotta">{selectedLead.assignedSeName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-warmmuted block">Team Leader:</span>
                    <strong className="text-espresso">{selectedLead.assignedTlName}</strong>
                  </div>
                </div>

                {/* BANT Breakdown */}
                <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                  <span className="text-xs font-extrabold text-espresso block mb-2">
                    Skor BANT: {selectedLead.bant.totalScore} / 10
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-white rounded-xl border border-amber-100">
                      <span className="text-[10px] text-warmmuted block">Budget</span>
                      <strong className="text-xs text-espresso">{selectedLead.bant.budget}/10</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-amber-100">
                      <span className="text-[10px] text-warmmuted block">Authority</span>
                      <strong className="text-xs text-espresso">{selectedLead.bant.authority}/10</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-amber-100">
                      <span className="text-[10px] text-warmmuted block">Need</span>
                      <strong className="text-xs text-espresso">{selectedLead.bant.need}/10</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-amber-100">
                      <span className="text-[10px] text-warmmuted block">Timeline</span>
                      <strong className="text-xs text-espresso">{selectedLead.bant.timeline}/10</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-espresso block mb-0.5">Catatan Prospek:</span>
                  <p className="p-3 rounded-2xl bg-sandstone/30 border border-warmborder text-warmmuted">
                    {selectedLead.notes}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-warmborder flex justify-end gap-2">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 rounded-xl bg-sandstone text-espresso text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah Lead Baru */}
        {showAddLeadModal && (
          <div className="fixed inset-0 z-60 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-warmborder max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-warmborder pb-3">
                <h3 className="text-base font-extrabold text-espresso">Input Lead Baru</h3>
                <button onClick={() => setShowAddLeadModal(false)} className="text-warmmuted hover:text-espresso">
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleAddLeadSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-espresso block mb-1">Nama Lengkap Prospek *</label>
                  <input
                    required
                    name="fullName"
                    placeholder="Contoh: dr. Setiawan Kusuma"
                    className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">Nomor WhatsApp *</label>
                  <input
                    required
                    name="phone"
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-espresso block mb-1">Sumber Lead</label>
                    <select name="source" className="w-full px-3 py-2 rounded-xl border border-warmborder bg-sandstone">
                      <option value="Website Landing Page">Website Landing Page</option>
                      <option value="Instagram Ads">Instagram Ads</option>
                      <option value="TikTok Walkthrough">TikTok Walkthrough</option>
                      <option value="Kanvasing SE">Kanvasing SE</option>
                      <option value="Walk-in Showroom">Walk-in Showroom</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-espresso block mb-1">Unit Diminati</label>
                    <select name="unit" className="w-full px-3 py-2 rounded-xl border border-warmborder bg-sandstone">
                      <option value="Nagoya Deluxe 2 Lantai">Nagoya Deluxe</option>
                      <option value="Osaka Premiere 2 Lantai">Osaka Premiere</option>
                      <option value="Tokyo Executive Hook 2 Lantai">Tokyo Executive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">Sales Executive Ditugaskan</label>
                  <select name="se" className="w-full px-3 py-2 rounded-xl border border-warmborder bg-sandstone">
                    <option value="SE 001 Budi Santoso">SE 001 Budi Santoso</option>
                    <option value="SE 002 Denny Pratama">SE 002 Denny Pratama</option>
                    <option value="SE 003 Maya Anggraini">SE 003 Maya Anggraini</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">Rencana Aksi Tindak Lanjut</label>
                  <input
                    name="action"
                    defaultValue="First Contact SLA ≤ 5 Menit via WA"
                    className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLeadModal(false)}
                    className="px-4 py-2 rounded-xl bg-sandstone font-semibold text-espresso"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 font-bold text-white shadow-sm"
                  >
                    Simpan Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-espresso text-white text-xs font-medium flex items-center justify-between shrink-0">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-amber-400 font-bold hover:underline">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
