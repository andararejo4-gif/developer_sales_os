// ============================================================================
// PIPELINE & AI LEAD ENGINE PAGE - DEVELOPER SALES OS
// 10 Tahap Resmi Playbook v1.2, Rubrik BANT 0-12 (Grade A-D), Persona 7 Dimensi,
// Umpan Balik Kejelasan Lead AI, & Integrasi WhatsApp Baileys Terisolasi Per SE
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Smartphone,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Edit3,
  Trash2,
  X,
  UserCheck,
  Search,
  Send,
} from 'lucide-react';
import {
  PLAYBOOK_PIPELINE_STAGES,
  PLAYBOOK_BUYER_PERSONAS,
  PLAYBOOK_UNIT_CATALOG,
  STANDARD_LOST_REASONS,
  evaluatePlaybookBant,
  type PersonaCode,
  type PipelineStageCode,
} from '../lib/kb/playbook-v1-2-knowledge';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';
import type { RoleKey, UserProfile } from '../data';

export interface PipelineLeadRecord {
  id: string;
  owner_se_email: string;
  owner_se_name: string;
  full_name: string;
  phone_wa: string;
  domicile: string;
  source: string;
  content_code: string;
  stage: PipelineStageCode;
  validity_status: 'VALID' | 'PERLU_DILENGKAPI' | 'TIDAK_VALID';
  persona_code: PersonaCode;
  persona_profile: Record<string, string>;
  bant_b: number;
  bant_a: number;
  bant_n: number;
  bant_t: number;
  bant_total: number;
  grade: 'A' | 'B' | 'C' | 'D';
  cluster_interest: string;
  unit_interest: string;
  unit_price_idr: number;
  payment_scheme: string;
  written_offer_sent: boolean;
  booking_fee_paid: boolean;
  dp_or_sp3k_verified: boolean;
  sales_notes: string;
  next_action: string;
  lost_reason?: string | null;
  response_time_seconds?: number | null;
  created_at: string;
  updated_at: string;
  latest_analysis?: {
    skor: number;
    label: string;
    clarity_status: 'JELAS' | 'PERLU_DILENGKAPI';
    unclear_parts: { field: string; issue: string; example: string }[];
    ringkas: string;
    poin_kuat: string[];
    poin_lemah: string[];
    perlu_dicek_ulang: string[];
    rekomendasi: string[];
    recommended_persona: PersonaCode;
    recommended_bant: { b: number; a: number; n: number; t: number; total: number; grade: string };
    followup_draft_message: string;
    model: string;
  } | null;
}

interface WaStatusData {
  seEmail: string;
  seName: string;
  status: 'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED';
  qrDataUrl: string | null;
  phoneNumber: string | null;
  lastConnectedAt: string | null;
  metrics: {
    totalInboundMessages: number;
    totalOutboundMessages: number;
    totalContacts: number;
    avgResponseSeconds: number | null;
    slaMetCount: number;
    repliedContactsCount: number;
    slaCompliancePercent: number;
  };
}

interface PipelinePageProps {
  user: UserProfile;
  role: RoleKey;
  onDataChanged?: () => void;
}

const LEAD_SOURCES = [
  'WhatsApp Inbound (Baileys)',
  'Iklan Meta CTWA (FB/IG)',
  'Iklan TikTok / Reels',
  'Google Search / GBP',
  'Canvassing Zona A–E',
  'OTT (CFD / Gelora Merdeka / Mal)',
  'Referral Pembeli / Warga',
  'Walk-in Marketing Gallery',
];

const PAYMENT_SCHEMES = [
  { code: 'KPR', label: 'KPR Bank Partner (DP 10% · 15-20 Th)' },
  { code: 'CASH_KERAS', label: 'Cash Keras (Harga Spesial Nov 2026)' },
  { code: 'CASH_TEMPO_12', label: 'Cash Tempo 12 Bulan (CT12)' },
  { code: 'CASH_TEMPO_24', label: 'Cash Tempo 24 Bulan (CT24)' },
];

function createDefaultPersonaForm(code: PersonaCode): Record<string, string> {
  const p = PLAYBOOK_BUYER_PERSONAS[code] || PLAYBOOK_BUYER_PERSONAS.P1;
  return {
    profil: p.profil,
    kondisiSaatIni: p.kondisiSaatIni,
    motivasi: p.motivasi,
    kekhawatiran: p.kekhawatiran,
    unitDanSkema: p.unitDanSkema,
    kanal: p.kanal,
    keunggulanPemicu: p.keunggulanPemicu,
    pendekatanClosing: p.pendekatanClosing,
  };
}

export const PipelinePage: React.FC<PipelinePageProps> = ({ user, role, onDataChanged }) => {
  const [leads, setLeads] = useState<PipelineLeadRecord[]>([]);
  const [waStatus, setWaStatus] = useState<WaStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Filter & Search (Disinkronkan ke URL ?tab=... dan localStorage)
  const [activeFilter, setActiveFilter] = useState<string>(() => {
    return getQueryParam('tab') || loadPersistedState<string>(`devos_pipeline_filter_${user.email}`, 'ALL');
  });
  const [searchQuery, setSearchQuery] = useState<string>(() =>
    loadPersistedState<string>(`devos_pipeline_search_${user.email}`, '')
  );

  // Form Tambah / Edit Lead (Disimpan di localStorage agar tidak hilang saat reload)
  const [isLeadFormOpen, setIsLeadFormOpen] = useState<boolean>(() =>
    loadPersistedState<boolean>(`devos_pipeline_form_open_${user.email}`, false)
  );
  const [editingLeadId, setEditingLeadId] = useState<string | null>(() =>
    loadPersistedState<string | null>(`devos_pipeline_edit_id_${user.email}`, null)
  );
  const [showPersonaDrawer, setShowPersonaDrawer] = useState<boolean>(() =>
    loadPersistedState<boolean>(`devos_pipeline_persona_open_${user.email}`, false)
  );

  const [formName, setFormName] = useState(() =>
    loadPersistedState(`devos_pl_name_${user.email}`, '')
  );
  const [formPhone, setFormPhone] = useState(() =>
    loadPersistedState(`devos_pl_phone_${user.email}`, '')
  );
  const [formDomicile, setFormDomicile] = useState(() =>
    loadPersistedState(`devos_pl_dom_${user.email}`, '')
  );
  const [formSource, setFormSource] = useState(() =>
    loadPersistedState(`devos_pl_src_${user.email}`, LEAD_SOURCES[1])
  );
  const [formCode, setFormCode] = useState(() =>
    loadPersistedState(`devos_pl_code_${user.email}`, 'ADS-META-CTWA-01')
  );
  const [formStage, setFormStage] = useState<PipelineStageCode>(() =>
    loadPersistedState<PipelineStageCode>(`devos_pl_stage_${user.email}`, 'NEW')
  );
  const [formUnit, setFormUnit] = useState(() =>
    loadPersistedState(`devos_pl_unit_${user.email}`, PLAYBOOK_UNIT_CATALOG[0].label)
  );
  const [formPayment, setFormPayment] = useState(() =>
    loadPersistedState(`devos_pl_pay_${user.email}`, 'KPR')
  );
  const [formPersonaCode, setFormPersonaCode] = useState<PersonaCode>(() =>
    loadPersistedState<PersonaCode>(`devos_pl_pcode_${user.email}`, 'P1')
  );
  const [formPersonaProfile, setFormPersonaProfile] = useState<Record<string, string>>(() =>
    loadPersistedState<Record<string, string>>(
      `devos_pl_pprof_${user.email}`,
      createDefaultPersonaForm('P1')
    )
  );
  const [formBantB, setFormBantB] = useState<number>(() =>
    loadPersistedState<number>(`devos_pl_bb_${user.email}`, 2)
  );
  const [formBantA, setFormBantA] = useState<number>(() =>
    loadPersistedState<number>(`devos_pl_ba_${user.email}`, 2)
  );
  const [formBantN, setFormBantN] = useState<number>(() =>
    loadPersistedState<number>(`devos_pl_bn_${user.email}`, 2)
  );
  const [formBantT, setFormBantT] = useState<number>(() =>
    loadPersistedState<number>(`devos_pl_bt_${user.email}`, 1)
  );
  const [formNotes, setFormNotes] = useState(() =>
    loadPersistedState(`devos_pl_notes_${user.email}`, '')
  );

  // Form Ingest Pesan WA Masuk (untuk pengujian / sinkronisasi pesan masuk ke nomor WA SE)
  const [showWaIngestModal, setShowWaIngestModal] = useState(false);
  const [waSenderName, setWaSenderName] = useState('');
  const [waSenderPhone, setWaSenderPhone] = useState('');
  const [waMessageText, setWaMessageText] = useState('');

  // Editable draft pesan follow-up per lead
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>(() =>
    loadPersistedState<Record<string, string>>(`devos_pl_drafts_${user.email}`, {})
  );

  useEffect(() => {
    setQueryParam('tab', activeFilter);
    savePersistedState(`devos_pipeline_filter_${user.email}`, activeFilter);
  }, [activeFilter, user.email]);

  useEffect(() => {
    savePersistedState(`devos_pipeline_search_${user.email}`, searchQuery);
    savePersistedState(`devos_pipeline_form_open_${user.email}`, isLeadFormOpen);
    savePersistedState(`devos_pipeline_edit_id_${user.email}`, editingLeadId);
    savePersistedState(`devos_pipeline_persona_open_${user.email}`, showPersonaDrawer);
    savePersistedState(`devos_pl_name_${user.email}`, formName);
    savePersistedState(`devos_pl_phone_${user.email}`, formPhone);
    savePersistedState(`devos_pl_dom_${user.email}`, formDomicile);
    savePersistedState(`devos_pl_src_${user.email}`, formSource);
    savePersistedState(`devos_pl_code_${user.email}`, formCode);
    savePersistedState(`devos_pl_stage_${user.email}`, formStage);
    savePersistedState(`devos_pl_unit_${user.email}`, formUnit);
    savePersistedState(`devos_pl_pay_${user.email}`, formPayment);
    savePersistedState(`devos_pl_pcode_${user.email}`, formPersonaCode);
    savePersistedState(`devos_pl_pprof_${user.email}`, formPersonaProfile);
    savePersistedState(`devos_pl_bb_${user.email}`, formBantB);
    savePersistedState(`devos_pl_ba_${user.email}`, formBantA);
    savePersistedState(`devos_pl_bn_${user.email}`, formBantN);
    savePersistedState(`devos_pl_bt_${user.email}`, formBantT);
    savePersistedState(`devos_pl_notes_${user.email}`, formNotes);
    savePersistedState(`devos_pl_drafts_${user.email}`, customDrafts);
  }, [
    user.email,
    searchQuery,
    isLeadFormOpen,
    editingLeadId,
    showPersonaDrawer,
    formName,
    formPhone,
    formDomicile,
    formSource,
    formCode,
    formStage,
    formUnit,
    formPayment,
    formPersonaCode,
    formPersonaProfile,
    formBantB,
    formBantA,
    formBantN,
    formBantT,
    formNotes,
    customDrafts,
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const apiHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      'X-User-Email': user.email,
      'X-User-Role': role,
    }),
    [user.email, role]
  );

  const fetchPipelineAndWa = useCallback(async () => {
    try {
      const [leadsRes, waRes] = await Promise.all([
        fetch('/api/pipeline/leads', { headers: apiHeaders }),
        fetch('/api/wa/status', { headers: apiHeaders }),
      ]);
      if (leadsRes.ok) {
        const lJson = await leadsRes.json();
        setLeads(lJson.leads || []);
      }
      if (waRes.ok) {
        const wJson = await waRes.json();
        setWaStatus(wJson.data || null);
      }
    } catch {
      /* ignore transient fetch error */
    } finally {
      setLoading(false);
    }
  }, [apiHeaders]);

  useEffect(() => {
    fetchPipelineAndWa();
  }, [fetchPipelineAndWa]);

  const handleSelectPersonaPreset = (code: PersonaCode) => {
    setFormPersonaCode(code);
    setFormPersonaProfile(createDefaultPersonaForm(code));
  };

  const resetForm = () => {
    setEditingLeadId(null);
    setFormName('');
    setFormPhone('');
    setFormDomicile('');
    setFormSource(LEAD_SOURCES[1]);
    setFormCode('ADS-META-CTWA-01');
    setFormStage('NEW');
    setFormUnit(PLAYBOOK_UNIT_CATALOG[0].label);
    setFormPayment('KPR');
    setFormPersonaCode('P1');
    setFormPersonaProfile(createDefaultPersonaForm('P1'));
    setFormBantB(2);
    setFormBantA(2);
    setFormBantN(2);
    setFormBantT(1);
    setFormNotes('');
    setShowPersonaDrawer(false);
  };

  const openEditLead = (lead: PipelineLeadRecord) => {
    setEditingLeadId(lead.id);
    setFormName(lead.full_name);
    setFormPhone(lead.phone_wa);
    setFormDomicile(lead.domicile);
    setFormSource(lead.source);
    setFormCode(lead.content_code);
    setFormStage(lead.stage);
    setFormUnit(lead.unit_interest);
    setFormPayment(lead.payment_scheme);
    setFormPersonaCode(lead.persona_code);
    setFormPersonaProfile(
      Object.keys(lead.persona_profile || {}).length > 0
        ? lead.persona_profile
        : createDefaultPersonaForm(lead.persona_code)
    );
    setFormBantB(lead.bant_b);
    setFormBantA(lead.bant_a);
    setFormBantN(lead.bant_n);
    setFormBantT(lead.bant_t);
    setFormNotes(lead.sales_notes);
    setIsLeadFormOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        fullName: formName,
        phoneWa: formPhone,
        domicile: formDomicile,
        source: formSource,
        contentCode: formCode,
        stage: formStage,
        unitInterest: formUnit,
        paymentScheme: formPayment,
        personaCode: formPersonaCode,
        personaProfile: formPersonaProfile,
        bantB: formBantB,
        bantA: formBantA,
        bantN: formBantN,
        bantT: formBantT,
        salesNotes: formNotes,
        reanalyze: true,
      };

      const url = editingLeadId
        ? `/api/pipeline/leads/${editingLeadId}`
        : '/api/pipeline/leads';
      const method = editingLeadId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: apiHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(data.error || 'Gagal menyimpan lead');
        return;
      }

      await fetchPipelineAndWa();
      if (onDataChanged) onDataChanged();
      const savedLead = data.lead as PipelineLeadRecord;
      if (savedLead.validity_status === 'PERLU_DILENGKAPI') {
        showToast('Lead tersimpan dengan catatan AI: Mohon lengkapi bagian yang kurang jelas.');
      } else {
        showToast('Lead berhasil disimpan & dianalisis oleh AI!');
      }
      resetForm();
      setIsLeadFormOpen(false);
    } catch {
      showToast('Terjadi kesalahan jaringan saat menyimpan lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStageChange = async (lead: PipelineLeadRecord, nextStage: PipelineStageCode) => {
    let lostReason: string | undefined;
    if (nextStage === 'CLOSED_LOST') {
      const chosen = window.prompt(
        `Pilih alasan kalah standar (Playbook §13.4):\n${STANDARD_LOST_REASONS.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
        STANDARD_LOST_REASONS[0]
      );
      if (!chosen) return;
      lostReason = chosen;
    }

    try {
      const res = await fetch(`/api/pipeline/leads/${lead.id}`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify({ stage: nextStage, lostReason }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        await fetchPipelineAndWa();
        if (onDataChanged) onDataChanged();
        showToast(`Tahap ${lead.full_name} diperbarui ke ${nextStage}`);
      } else {
        showToast(data.error || 'Gagal mengubah tahap');
      }
    } catch {
      showToast('Gagal mengubah tahap pipeline');
    }
  };

  const handleToggleEvidence = async (
    lead: PipelineLeadRecord,
    field: 'writtenOfferSent' | 'bookingFeePaid' | 'dpOrSp3kVerified',
    value: boolean
  ) => {
    try {
      const res = await fetch(`/api/pipeline/leads/${lead.id}`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        await fetchPipelineAndWa();
        if (onDataChanged) onDataChanged();
        showToast('Bukti transaksi berhasil diperbarui');
      }
    } catch {
      showToast('Gagal memperbarui bukti transaksi');
    }
  };

  const handleReanalyzeLead = async (lead: PipelineLeadRecord) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pipeline/leads/${lead.id}`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify({ reanalyze: true }),
      });
      if (res.ok) {
        await fetchPipelineAndWa();
        if (onDataChanged) onDataChanged();
        showToast(`Analisis AI untuk ${lead.full_name} berhasil diperbarui!`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const res = await fetch(`/api/pipeline/leads/${leadId}`, {
      method: 'DELETE',
      headers: apiHeaders,
    });
    if (res.ok) {
      await fetchPipelineAndWa();
      if (onDataChanged) onDataChanged();
      showToast('Lead dihapus dari pipeline');
    }
  };

  const handleConnectWa = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/wa/connect', {
        method: 'POST',
        headers: apiHeaders,
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setWaStatus(data.data);
        showToast('Sesi Baileys disiapkan untuk akun Anda. Silakan pindai QR WhatsApp.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnectWa = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/wa/disconnect', {
        method: 'POST',
        headers: apiHeaders,
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setWaStatus(data.data);
        showToast('Sesi WhatsApp berhasil diputuskan');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleIngestWaMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waSenderPhone.trim() || !waMessageText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/wa/ingest-inbound', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          contactName: waSenderName.trim(),
          contactPhone: waSenderPhone.trim(),
          messageText: waMessageText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setWaSenderName('');
        setWaSenderPhone('');
        setWaMessageText('');
        setShowWaIngestModal(false);
        await fetchPipelineAndWa();
        if (onDataChanged) onDataChanged();
        showToast('Pesan WA masuk berhasil diolah AI menjadi Lead di Pipeline!');
      } else {
        showToast(data.error || 'Gagal memproses pesan WA masuk');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFollowUpWa = async (lead: PipelineLeadRecord) => {
    const draft =
      customDrafts[lead.id] ??
      lead.latest_analysis?.followup_draft_message ??
      `Halo Bapak/Ibu ${lead.full_name}, terima kasih sudah menghubungi The Park Townhouse Sukoharjo. Saya ${user.name}.`;

    await fetch('/api/wa/record-reply', {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ contactPhone: lead.phone_wa }),
    }).catch(() => {});

    fetchPipelineAndWa();
    if (onDataChanged) onDataChanged();

    const cleanPhone = lead.phone_wa.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(draft)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (activeFilter === 'PERLU_DILENGKAPI' && l.validity_status !== 'PERLU_DILENGKAPI') return false;
      else if (activeFilter === 'GRADE_A' && l.grade !== 'A') return false;
      else if (activeFilter === 'GRADE_B' && l.grade !== 'B') return false;
      else if (
        activeFilter !== 'ALL' &&
        activeFilter !== 'PERLU_DILENGKAPI' &&
        activeFilter !== 'GRADE_A' &&
        activeFilter !== 'GRADE_B' &&
        l.stage !== activeFilter
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          l.full_name.toLowerCase().includes(q) ||
          l.phone_wa.toLowerCase().includes(q) ||
          l.domicile.toLowerCase().includes(q) ||
          l.unit_interest.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [leads, activeFilter, searchQuery]);

  const validCount = leads.filter((l) => l.validity_status === 'VALID').length;
  const unclearCount = leads.filter((l) => l.validity_status === 'PERLU_DILENGKAPI').length;
  const qualifiedCount = leads.filter((l) => l.validity_status === 'VALID' && l.bant_total >= 7).length;
  const hotCount = leads.filter((l) => l.validity_status === 'VALID' && (l.grade === 'A' || l.stage === 'HOT_NEGOTIATION')).length;

  const previewBant = evaluatePlaybookBant(formBantB, formBantA, formBantN, formBantT);

  return (
    <div className="space-y-5">
      {/* Header Halaman Pipeline */}
      <div className="bg-white border border-warmborder rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="size-11 rounded-2xl bg-terracotta text-white flex items-center justify-center shrink-0">
            <Users className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-espresso">
                Pipeline &amp; AI Lead Analyzer
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-terracotta border border-amber-200">
                Playbook v1.2 · BANT 0–12
              </span>
            </div>
            <p className="text-xs text-warmmuted mt-0.5">
              Akun SE: <strong className="text-espresso">{user.name}</strong> ({user.email}) · Data &amp; WhatsApp terisolasi per akun
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              document.getElementById('wa-integration-section')?.scrollIntoView({ behavior: 'smooth' });
              if (waStatus?.status !== 'CONNECTED') {
                handleConnectWa();
              }
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-lime-100 hover:bg-lime-200 text-olive border border-lime-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="size-4 shrink-0" />
            <span>
              {waStatus?.status === 'CONNECTED'
                ? `WA Terhubung (${waStatus.phoneNumber})`
                : 'Integrasi WhatsApp (QR)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowWaIngestModal(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-espresso border border-warmborder text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="size-4 text-olive shrink-0" />
            <span>Proses Pesan WA Masuk</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsLeadFormOpen(true);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="size-4 shrink-0" />
            <span>Input Lead Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Indikator Real Pipeline SE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-warmborder rounded-2xl p-4">
          <p className="text-xs text-warmmuted">Lead Valid Tercatat</p>
          <p className="text-2xl font-extrabold text-espresso tabular-nums mt-1">
            {validCount} <span className="text-xs font-normal text-warmmuted">/ 8 Harian</span>
          </p>
        </div>
        <div className="bg-white border border-warmborder rounded-2xl p-4">
          <p className="text-xs text-warmmuted">Prospek (BANT ≥ 7/12)</p>
          <p className="text-2xl font-extrabold text-espresso tabular-nums mt-1">
            {qualifiedCount} <span className="text-xs font-normal text-warmmuted">Grade A/B</span>
          </p>
        </div>
        <div className="bg-white border border-warmborder rounded-2xl p-4">
          <p className="text-xs text-warmmuted">Hot Prospek (BANT ≥ 10)</p>
          <p className="text-2xl font-extrabold text-terracotta tabular-nums mt-1">
            {hotCount} <span className="text-xs font-normal text-warmmuted">Grade A</span>
          </p>
        </div>
        <div className="bg-white border border-warmborder rounded-2xl p-4">
          <p className="text-xs text-warmmuted">Perlu Dilengkapi (AI)</p>
          <p className={`text-2xl font-extrabold tabular-nums mt-1 ${unclearCount > 0 ? 'text-rose-700' : 'text-olive'}`}>
            {unclearCount} <span className="text-xs font-normal text-warmmuted">Lead</span>
          </p>
        </div>
      </div>

      {/* Panel Integrasi WhatsApp Baileys (Isolasi 1 Nomor = 1 Akun SE, Tanpa Menampilkan Chat Mentah) */}
      <section id="wa-integration-section" className="bg-white border border-warmborder rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-lime-100 text-olive flex items-center justify-center shrink-0">
              <Smartphone className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-espresso">
                  Integrasi WhatsApp Khusus SE (Baileys Engine)
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    waStatus?.status === 'CONNECTED'
                      ? 'bg-lime-100 text-olive'
                      : waStatus?.status === 'QR_READY'
                      ? 'bg-amber-100 text-terracotta'
                      : 'bg-sandstone text-warmmuted'
                  }`}
                >
                  {waStatus?.status === 'CONNECTED'
                    ? `Terhubung (${waStatus.phoneNumber})`
                    : waStatus?.status === 'QR_READY'
                    ? 'Menunggu Scan QR'
                    : 'Belum Terhubung'}
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5">
                Privasi terjaga: Sistem tidak menampilkan isi obrolan pribadi Anda, hanya menghitung pesan masuk, kecepatan balas (SLA ≤ 5 menit), dan mengolah prospek baru dengan AI.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {waStatus?.status === 'CONNECTED' ? (
              <button
                type="button"
                disabled={submitting}
                onClick={handleDisconnectWa}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
              >
                Putuskan Nomor WA
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleConnectWa}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-espresso text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="size-4 text-amber-400" />
                <span>{submitting ? 'Menyiapkan QR...' : 'Hubungkan WA SE (QR)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tampilan QR Code Baileys jika sedang pairing */}
        {waStatus?.qrDataUrl && waStatus.status !== 'CONNECTED' && (
          <div className="p-4 rounded-2xl bg-sandstone/60 border border-warmborder flex flex-col sm:flex-row items-center gap-4">
            <img
              src={waStatus.qrDataUrl}
              alt="QR WhatsApp Baileys SE"
              width={180}
              height={180}
              className="rounded-xl border border-warmborder bg-white p-2"
            />
            <div className="space-y-1.5 text-xs">
              <p className="font-extrabold text-espresso text-sm">
                Pindai QR dengan Nomor WhatsApp Khusus SE ({user.name})
              </p>
              <p className="text-warmmuted">
                1. Buka WhatsApp di HP kerja Anda &rarr; Perangkat Tertaut &rarr; Tautkan Perangkat.
              </p>
              <p className="text-warmmuted">
                2. Setiap pesan masuk dari calon pembeli akan otomatis dianalisis AI menjadi Lead di bawah ini.
              </p>
              <p className="text-terracotta font-semibold">
                Isolasi Aktif: Nomor yang tertaut hanya berlaku untuk akun {user.email}.
              </p>
            </div>
          </div>
        )}

        {/* 2 Metrik Wajib WA SE: Pesan Masuk & Kecepatan Balas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-warmborder">
          <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-warmmuted">Pesan Masuk ke WA SE</p>
              <p className="text-lg font-extrabold text-espresso tabular-nums">
                {waStatus?.metrics.totalInboundMessages ?? 0} Pesan
              </p>
            </div>
            <span className="text-xs font-bold text-terracotta">
              {waStatus?.metrics.totalContacts ?? 0} Kontak
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-warmmuted">Rata-Rata Kecepatan Balas</p>
              <p className="text-lg font-extrabold text-espresso tabular-nums">
                {waStatus?.metrics.avgResponseSeconds !== null && waStatus?.metrics.avgResponseSeconds !== undefined
                  ? `${Math.floor(waStatus.metrics.avgResponseSeconds / 60)}m ${waStatus.metrics.avgResponseSeconds % 60}d`
                  : 'Belum ada data'}
              </p>
            </div>
            <Clock className="size-5 text-terracotta shrink-0" />
          </div>

          <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-warmmuted">Kepatuhan SLA Balas ≤ 5 Menit</p>
              <p className="text-lg font-extrabold text-olive tabular-nums">
                {waStatus?.metrics.slaCompliancePercent ?? 100}% Patuh
              </p>
            </div>
            <CheckCircle2 className="size-5 text-olive shrink-0" />
          </div>
        </div>
      </section>

      {/* Form Input / Edit Lead + Persona 7 Dimensi */}
      {isLeadFormOpen && (
        <section className="bg-white border-2 border-terracotta/40 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-warmborder pb-3">
            <div>
              <h3 className="text-base font-extrabold text-espresso">
                {editingLeadId ? 'Edit & Lengkapi Data Lead' : 'Input Lead Baru (Otomatis Dianalisis AI)'}
              </h3>
              <p className="text-xs text-warmmuted">
                Isian Anda tersimpan otomatis di browser agar tidak hilang bila halaman ter-reload.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLeadFormOpen(false)}
              className="size-10 rounded-xl bg-sandstone text-espresso flex items-center justify-center cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSaveLead} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1">
                  Nama Calon Pembeli *
                </label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Pak Andi Pratama"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">
                  Domisili (Kecamatan / Kota) *
                </label>
                <input
                  required
                  value={formDomicile}
                  onChange={(e) => setFormDomicile(e.target.value)}
                  placeholder="Contoh: Jombor, Bendosari, Sukoharjo"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Sumber Lead</label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs bg-white"
                >
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Kode Konten / Iklan</label>
                <input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="TP1122C / ADS-META-01"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Unit &amp; Cluster Minat</label>
                <select
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs bg-white"
                >
                  {PLAYBOOK_UNIT_CATALOG.map((u) => (
                    <option key={u.label} value={u.label}>
                      {u.label} — Rp{(u.priceCashIdr / 1000000).toFixed(0)} Jt
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Skema Pembayaran</label>
                <select
                  value={formPayment}
                  onChange={(e) => setFormPayment(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs bg-white"
                >
                  {PAYMENT_SCHEMES.map((p) => (
                    <option key={p.code} value={p.code}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rubrik BANT 0-3 per huruf (Total 12) sesuai Playbook Bab 5.2 */}
            <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-espresso">
                  Kualifikasi Skor BANT (0–3 per dimensi, Total 0–12 · Playbook §5.2)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-warmborder text-xs font-extrabold text-terracotta">
                  Total: {previewBant.total}/12 · Grade {previewBant.grade} ({previewBant.statusLabel})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-espresso mb-1">B — Budget (0–3)</label>
                  <select
                    value={formBantB}
                    onChange={(e) => setFormBantB(Number(e.target.value))}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-warmborder bg-white"
                  >
                    <option value={0}>0: Belum tahu / &lt; Rp500 jt</option>
                    <option value={1}>1: Rp500–649 jt / Gaji &lt; Rp15 jt</option>
                    <option value={2}>2: Sesuai unit, DP belum siap penuh</option>
                    <option value={3}>3: Dana/DP siap, gaji memenuhi KPR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-espresso mb-1">A — Authority (0–3)</label>
                  <select
                    value={formBantA}
                    onChange={(e) => setFormBantA(Number(e.target.value))}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-warmborder bg-white"
                  >
                    <option value={0}>0: Tidak diketahui</option>
                    <option value={1}>1: Pencari info (anak/kerabat)</option>
                    <option value={2}>2: Pengambil keputusan, pasangan belum ikut</option>
                    <option value={3}>3: Suami-istri/orang tua terlibat penuh</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-espresso mb-1">N — Need (0–3)</label>
                  <select
                    value={formBantN}
                    onChange={(e) => setFormBantN(Number(e.target.value))}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-warmborder bg-white"
                  >
                    <option value={0}>0: Belum jelas</option>
                    <option value={1}>1: Baru lihat-lihat</option>
                    <option value={2}>2: Kebutuhan kamar/lokasi jelas</option>
                    <option value={3}>3: Spesifik &amp; cocok nomor unit tertentu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-espresso mb-1">T — Timeline (0–3)</label>
                  <select
                    value={formBantT}
                    onChange={(e) => setFormBantT(Number(e.target.value))}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-warmborder bg-white"
                  >
                    <option value={0}>0: &gt; 12 bulan / tidak tahu</option>
                    <option value={1}>1: 6–12 bulan</option>
                    <option value={2}>2: 1–6 bulan</option>
                    <option value={3}>3: &le; 30 hari / ada pemicu mendesak</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tombol Masukkan Persona Pembeli (Sesuai Struktur Tabel Playbook Hal. 9-11) */}
            <div className="border border-warmborder rounded-2xl overflow-hidden">
              <div className="p-3.5 bg-sandstone/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-terracotta" />
                  <span className="text-xs font-extrabold text-espresso">
                    Persona Pembeli: {formPersonaCode} — {PLAYBOOK_BUYER_PERSONAS[formPersonaCode].name} ({PLAYBOOK_BUYER_PERSONAS[formPersonaCode].archetype})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPersonaDrawer((prev) => !prev)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-espresso text-white text-xs font-bold cursor-pointer"
                >
                  {showPersonaDrawer ? 'Tutup Detail Persona' : 'Masukkan Persona Pembeli (P1–P6)'}
                </button>
              </div>

              {showPersonaDrawer && (
                <div className="p-4 bg-white space-y-4 border-t border-warmborder">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-warmmuted mb-2">
                      Pilih Template Persona Resmi Playbook v1.2 (P1–P6):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(Object.keys(PLAYBOOK_BUYER_PERSONAS) as PersonaCode[]).map((pKey) => {
                        const pObj = PLAYBOOK_BUYER_PERSONAS[pKey];
                        const isSel = formPersonaCode === pKey;
                        return (
                          <button
                            key={pKey}
                            type="button"
                            onClick={() => handleSelectPersonaPreset(pKey)}
                            className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                              isSel
                                ? 'bg-amber-50 border-terracotta text-espresso font-bold'
                                : 'bg-sandstone/40 border-warmborder text-warmmuted hover:text-espresso'
                            }`}
                          >
                            <span className="font-extrabold text-terracotta">{pKey}</span> · {pObj.archetype}
                            <span className="block text-[11px] text-warmmuted truncate mt-0.5">
                              "{pObj.name}"
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tabel 8 Dimensi Persona sesuai Gambar Playbook yang Dikirim User */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {[
                      { key: 'profil', label: 'Profil (Usia, Pekerjaan, Penghasilan Gabungan)' },
                      { key: 'kondisiSaatIni', label: 'Kondisi Saat Ini (Status Tempat Tinggal)' },
                      { key: 'motivasi', label: 'Motivasi Utama Membeli' },
                      { key: 'kekhawatiran', label: 'Kekhawatiran / Keberatan Utama' },
                      { key: 'unitDanSkema', label: 'Unit & Skema yang Cocok' },
                      { key: 'kanal', label: 'Kanal Masuk' },
                      { key: 'keunggulanPemicu', label: 'Keunggulan Pemicu (#99 Poin)' },
                      { key: 'pendekatanClosing', label: 'Pendekatan Closing SE' },
                    ].map((dim) => (
                      <div key={dim.key}>
                        <label className="block font-bold text-espresso mb-1">{dim.label}</label>
                        <textarea
                          rows={2}
                          value={formPersonaProfile[dim.key] || ''}
                          onChange={(e) =>
                            setFormPersonaProfile((prev) => ({
                              ...prev,
                              [dim.key]: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-espresso mb-1">
                Catatan Kebutuhan, Anggaran &amp;Konteks Prospek * (Digunakan AI untuk Analisa &amp; Draf Pesan)
              </label>
              <textarea
                required
                rows={3}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Contoh: Pasangan keluarga muda ASN & swasta (penghasilan gabungan Rp18 jt/bln), saat ini mengontrak di Sukoharjo. Mencari rumah 3 kamar tipe Gold, tertarik Nagoya B.02 Rp650 jt dengan KPR, berencana survei Sabtu pagi bersama istri."
                className="w-full p-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsLeadFormOpen(false);
                }}
                className="min-h-[44px] px-4 rounded-xl bg-sandstone text-espresso text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-5 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                <span>{submitting ? 'Menganalisis dengan AI...' : 'Simpan & Analisis dengan AI'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Tahap & Pencarian */}
      <div className="bg-white border border-warmborder rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama prospek, nomor WA, domisili, atau unit..."
              className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
            />
          </div>
          <span className="text-xs font-bold text-warmmuted shrink-0">
            Menampilkan {filteredLeads.length} dari {leads.length} prospek
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar snap-x pb-1">
          {[
            { id: 'ALL', label: `Semua (${leads.length})` },
            { id: 'PERLU_DILENGKAPI', label: `Perlu Dilengkapi (${unclearCount})` },
            { id: 'GRADE_A', label: `Hot Grade A (${hotCount})` },
            { id: 'GRADE_B', label: `Warm Grade B (${qualifiedCount})` },
            ...PLAYBOOK_PIPELINE_STAGES.map((st) => ({
              id: st.code,
              label: `${st.shortLabel} (${leads.filter((l) => l.stage === st.code).length})`,
            })),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 snap-start transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-espresso text-white'
                  : 'bg-sandstone text-warmmuted hover:text-espresso'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar Lead & Analisis AI */}
      {loading ? (
        <div className="bg-white border border-warmborder rounded-2xl p-8 text-center text-xs text-warmmuted">
          Memuat data pipeline real dari database sales_os...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white border border-warmborder rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-extrabold text-espresso">
            Belum ada data prospek pada filter ini
          </p>
          <p className="text-xs text-warmmuted max-w-md mx-auto">
            Tambahkan lead baru secara manual dengan tombol Input Lead Baru atau hubungkan WhatsApp SE agar pesan masuk otomatis diolah oleh AI.
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsLeadFormOpen(true);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Input Lead Pertama Anda</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const analysis = lead.latest_analysis;
            const personaInfo =
              PLAYBOOK_BUYER_PERSONAS[lead.persona_code] || PLAYBOOK_BUYER_PERSONAS.P1;
            const stageInfo =
              PLAYBOOK_PIPELINE_STAGES.find((s) => s.code === lead.stage) ||
              PLAYBOOK_PIPELINE_STAGES[0];
            const isUnclear =
              lead.validity_status === 'PERLU_DILENGKAPI' ||
              analysis?.clarity_status === 'PERLU_DILENGKAPI';
            const draftMsg =
              customDrafts[lead.id] ??
              analysis?.followup_draft_message ??
              `Halo Bapak/Ibu ${lead.full_name}, terima kasih sudah menghubungi The Park Townhouse Sukoharjo. Saya ${user.name}.`;

            return (
              <article
                key={lead.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-4 ${
                  isUnclear ? 'border-rose-300 ring-1 ring-rose-200' : 'border-warmborder'
                }`}
              >
                {/* Banner Feedback AI jika Lead Kurang Jelas */}
                {isUnclear && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs sm:text-sm">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>
                          Lead yang dimasukkan kurang jelas — mohon masukkan lead yang lebih jelas
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditLead(lead)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="size-3.5" />
                        <span>Lengkapi Lead Sekarang</span>
                      </button>
                    </div>
                    <p className="text-xs text-rose-700">
                      Lead ini berstatus <strong>Perlu Dilengkapi</strong> dan belum dihitung ke dalam KPI Lead Valid Harian sampai bagian berikut diperjelas:
                    </p>
                    <div className="space-y-2">
                      {(analysis?.unclear_parts || []).map((u, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white border border-rose-200 text-xs space-y-1"
                        >
                          <p className="font-bold text-espresso">
                            Bagian Kurang Jelas: <span className="text-rose-700">{u.field}</span> — {u.issue}
                          </p>
                          <p className="text-warmmuted">
                            <strong className="text-olive">Contoh kalimat yang benar:</strong> "{u.example}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Baris Atas: Identitas Prospek, Badge Grade/BANT/Persona, & Dropdown Ubah Tahap */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-warmborder pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-espresso">{lead.full_name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-terracotta border border-amber-200">
                        BANT {lead.bant_total}/12 · Grade {lead.grade}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sandstone text-espresso border border-warmborder">
                        {lead.persona_code} · {personaInfo.archetype}
                      </span>
                      {analysis && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-100 text-olive">
                          Skor AI: {analysis.skor}/100 ({analysis.label})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-warmmuted">
                      WA: <strong className="text-espresso">{lead.phone_wa}</strong> · Domisili:{' '}
                      <strong className="text-espresso">{lead.domicile || '-'}</strong> · Sumber:{' '}
                      {lead.source} ({lead.content_code || '-'}) · Minat:{' '}
                      <strong className="text-terracotta">{lead.unit_interest}</strong> ({lead.payment_scheme})
                    </p>
                  </div>

                  {/* Kontrol Ubah Tahap Pipeline & Edit */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      aria-label="Ubah Tahap Pipeline"
                      value={lead.stage}
                      onChange={(e) =>
                        handleQuickStageChange(lead, e.target.value as PipelineStageCode)
                      }
                      className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold cursor-pointer ${stageInfo.colorClass}`}
                    >
                      {PLAYBOOK_PIPELINE_STAGES.map((st) => (
                        <option key={st.code} value={st.code}>
                          Tahap: {st.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => openEditLead(lead)}
                      className="min-h-[42px] px-3 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleReanalyzeLead(lead)}
                      className="min-h-[42px] px-3 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      title="Analisis Ulang dengan AI"
                    >
                      <RefreshCw className={`size-3.5 ${submitting ? 'animate-spin' : ''}`} />
                      <span>AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteLead(lead.id)}
                      className="min-h-[42px] px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center cursor-pointer"
                      title="Hapus Lead"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Checkbox Bukti Operasional CRM (Playbook §4.1 - Otomatis Mengisi Dashboard SE) */}
                <div className="flex flex-wrap items-center gap-4 text-xs bg-sandstone/40 px-3.5 py-2.5 rounded-xl border border-warmborder">
                  <span className="font-bold text-warmmuted">Bukti Tahap CRM:</span>
                  <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-espresso">
                    <input
                      type="checkbox"
                      checked={lead.written_offer_sent}
                      onChange={(e) =>
                        handleToggleEvidence(lead, 'writtenOfferSent', e.target.checked)
                      }
                      className="size-4 accent-terracotta"
                    />
                    <span>Penawaran Tertulis Terkirim</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-espresso">
                    <input
                      type="checkbox"
                      checked={lead.booking_fee_paid}
                      onChange={(e) =>
                        handleToggleEvidence(lead, 'bookingFeePaid', e.target.checked)
                      }
                      className="size-4 accent-terracotta"
                    />
                    <span>Booking Fee Rp5 Jt Masuk</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-espresso">
                    <input
                      type="checkbox"
                      checked={lead.dp_or_sp3k_verified}
                      onChange={(e) =>
                        handleToggleEvidence(lead, 'dpOrSp3kVerified', e.target.checked)
                      }
                      className="size-4 accent-terracotta"
                    />
                    <span>Net Sales (DP Lunas / SP3K)</span>
                  </label>
                </div>

                {/* Hasil Analisis AI & Rekomendasi Follow-Up */}
                {analysis && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                    <div className="lg:col-span-7 space-y-2.5 text-xs">
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                        <p className="font-extrabold text-terracotta flex items-center gap-1.5">
                          <Sparkles className="size-3.5" />
                          <span>Hasil Analisis AI ({analysis.model})</span>
                        </p>
                        <p className="text-espresso leading-relaxed">{analysis.ringkas}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {analysis.poin_kuat?.length > 0 && (
                          <div className="p-3 rounded-xl bg-sandstone/40 border border-warmborder">
                            <p className="font-bold text-olive mb-1">Poin Kuat Prospek:</p>
                            <ul className="list-disc list-inside space-y-1 text-espresso">
                              {analysis.poin_kuat.map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.rekomendasi?.length > 0 && (
                          <div className="p-3 rounded-xl bg-sandstone/40 border border-warmborder">
                            <p className="font-bold text-terracotta mb-1">Saran Taktis AI (Playbook):</p>
                            <ul className="list-disc list-inside space-y-1 text-espresso">
                              {analysis.rekomendasi.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {analysis.perlu_dicek_ulang?.length > 0 && (
                        <div className="p-3 rounded-xl bg-white border border-warmborder">
                          <p className="font-bold text-espresso mb-1">
                            Pertanyaan BANT Natural Berikutnya (Bab 5.3):
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-warmmuted">
                            {analysis.perlu_dicek_ulang.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Kotak Draf Pesan Balasan AI & Tombol Follow Up ke WhatsApp */}
                    <div className="lg:col-span-5 p-4 rounded-2xl bg-sandstone/60 border border-warmborder flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-espresso">
                            Pesan Follow-Up Rekomendasi AI
                          </span>
                          <span className="text-[11px] text-warmmuted">Siap kirim via WA</span>
                        </div>
                        <textarea
                          rows={5}
                          value={draftMsg}
                          onChange={(e) =>
                            setCustomDrafts((prev) => ({
                              ...prev,
                              [lead.id]: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-xl border border-warmborder bg-white text-xs text-espresso leading-relaxed focus:border-terracotta focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFollowUpWa(lead)}
                        className="w-full min-h-[46px] px-4 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Send className="size-4" />
                        <span>Follow Up via WhatsApp ({lead.phone_wa})</span>
                        <ExternalLink className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Proses Pesan WA Masuk ke Nomor WA SE */}
      {showWaIngestModal && (
        <div className="fixed inset-0 z-50 bg-espresso/70 flex items-center justify-center p-4">
          <div className="bg-white border border-warmborder rounded-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-warmborder pb-3">
              <div>
                <h3 className="text-base font-extrabold text-espresso">
                  Proses Pesan WhatsApp Masuk ke Nomor SE
                </h3>
                <p className="text-xs text-warmmuted">
                  Pesan akan diolah AI menjadi Lead milik {user.name} ({user.email}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWaIngestModal(false)}
                className="size-9 rounded-xl bg-sandstone text-espresso flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleIngestWaMessage} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-espresso mb-1">Nama Pengirim WA</label>
                <input
                  required
                  value={waSenderName}
                  onChange={(e) => setWaSenderName(e.target.value)}
                  placeholder="Contoh: dr. Sari (RSUD Ir. Soekarno)"
                  className="w-full min-h-[42px] px-3 rounded-xl border border-warmborder"
                />
              </div>
              <div>
                <label className="block font-bold text-espresso mb-1">Nomor WA Pengirim</label>
                <input
                  required
                  value={waSenderPhone}
                  onChange={(e) => setWaSenderPhone(e.target.value)}
                  placeholder="Contoh: 081329001122"
                  className="w-full min-h-[42px] px-3 rounded-xl border border-warmborder"
                />
              </div>
              <div>
                <label className="block font-bold text-espresso mb-1">Isi Pesan Masuk dari Calon Pembeli</label>
                <textarea
                  required
                  rows={3}
                  value={waMessageText}
                  onChange={(e) => setWaMessageText(e.target.value)}
                  placeholder="Contoh: Malam mas, saya lihat iklan The Park Townhouse di Jombor. Saya kerja di RSUD Sukoharjo, cari tipe 3-4 kamar dekat rumah sakit yang one-gate aman, rencana KPR atau cash tempo. Bisa minta pricelist dan jadwal lihat lokasi akhir pekan ini?"
                  className="w-full p-3 rounded-xl border border-warmborder"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWaIngestModal(false)}
                  className="min-h-[42px] px-4 rounded-xl bg-sandstone text-espresso font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[42px] px-4 rounded-xl bg-terracotta text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  <span>{submitting ? 'Memproses AI...' : 'Olah Pesan dengan AI'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-espresso text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};
