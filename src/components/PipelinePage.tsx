// ============================================================================
// PIPELINE & AI LEAD ENGINE PAGE - DEVELOPER SALES OS
// 10 Tahap Resmi Playbook v1.2, Rubrik BANT 0-12 (Grade A-D) + Opsi Lainnya,
// Persona 7 Dimensi + Opsi Lainnya (Tanpa Nama Tokoh), Collapsible Lead List,
// WhatsApp Bubble Message Preview, & Integrasi WA Baileys Terisolasi Per SE
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Users,
  Plus,
  Smartphone,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Edit3,
  Trash2,
  X,
  UserCheck,
  Search,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCheck,
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
  lead_origin?: 'MANUAL' | 'WA_BAILEYS';
  last_customer_message?: string;
  last_sales_message?: string;
  interaction_count?: number;
  lost_reason?: string | null;
  response_time_seconds?: number | null;
  is_ai_analyzing?: boolean;
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
    prompt_tokens?: number;
    completion_tokens?: number;
    created_at?: string;
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
    customLabel: code === 'LAINNYA' ? '' : p.archetype,
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
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);
  const [reanalyzingLeadId, setReanalyzingLeadId] = useState<string | null>(null);
  const [skeletonLeadIds, setSkeletonLeadIds] = useState<Record<string, boolean>>({});
  const prevLeadMsgMapRef = useRef<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  // Daftar ID lead yang sedang dibuka detailnya (default kosong = semua tertutup / list ringkas)
  const [expandedLeadIds, setExpandedLeadIds] = useState<Record<string, boolean>>(() =>
    loadPersistedState<Record<string, boolean>>(`devos_pl_expanded_${user.email}`, {})
  );
  // Status buka/tutup ("Lihat selengkapnya") untuk pesan panjang di gelembung WA (default semua singkat)
  const [expandedMessageKeys, setExpandedMessageKeys] = useState<Record<string, boolean>>({});

  const toggleMessageExpand = (key: string) => {
    setExpandedMessageKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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

  // Sumber Lead + Custom
  const [formSourceSelect, setFormSourceSelect] = useState(() =>
    loadPersistedState(`devos_pl_src_sel_${user.email}`, LEAD_SOURCES[1])
  );
  const [formSourceCustom, setFormSourceCustom] = useState(() =>
    loadPersistedState(`devos_pl_src_cus_${user.email}`, '')
  );

  const [formCode, setFormCode] = useState(() =>
    loadPersistedState(`devos_pl_code_${user.email}`, 'ADS-META-CTWA-01')
  );
  const [formStage, setFormStage] = useState<PipelineStageCode>(() =>
    loadPersistedState<PipelineStageCode>(`devos_pl_stage_${user.email}`, 'NEW')
  );

  // Unit & Cluster Minat + Custom
  const [formUnitSelect, setFormUnitSelect] = useState(() =>
    loadPersistedState(`devos_pl_unit_sel_${user.email}`, PLAYBOOK_UNIT_CATALOG[0].label)
  );
  const [formUnitCustom, setFormUnitCustom] = useState(() =>
    loadPersistedState(`devos_pl_unit_cus_${user.email}`, '')
  );

  // Skema Pembayaran + Custom
  const [formPaymentSelect, setFormPaymentSelect] = useState(() =>
    loadPersistedState(`devos_pl_pay_sel_${user.email}`, 'KPR')
  );
  const [formPaymentCustom, setFormPaymentCustom] = useState(() =>
    loadPersistedState(`devos_pl_pay_cus_${user.email}`, '')
  );

  // Persona + Custom
  const [formPersonaCode, setFormPersonaCode] = useState<PersonaCode>(() =>
    loadPersistedState<PersonaCode>(`devos_pl_pcode_${user.email}`, 'P1')
  );
  const [formPersonaProfile, setFormPersonaProfile] = useState<Record<string, string>>(() =>
    loadPersistedState<Record<string, string>>(
      `devos_pl_pprof_${user.email}`,
      createDefaultPersonaForm('P1')
    )
  );

  // Kualifikasi Skor BANT (0-3) + Opsi Lainnya per dimensi
  const [formBantBSelect, setFormBantBSelect] = useState<string>(() =>
    loadPersistedState<string>(`devos_pl_bb_sel_${user.email}`, '2')
  );
  const [formBantBCustomText, setFormBantBCustomText] = useState<string>(() =>
    loadPersistedState<string>(`devos_pl_bb_cus_${user.email}`, '')
  );
  const [formBantBCustomScore, setFormBantBCustomScore] = useState<number>(() =>
    loadPersistedState<number>(`devos_pl_bb_sc_${user.email}`, 2)
  );

  const [formBantASelect, setFormBantASelect] = useState<string>(() =>
    loadPersistedState<string>(`devos_pl_ba_sel_${user.email}`, '2')
  );
  const [formBantACustomText, setFormBantACustomText] = useState<string>(() =>
    loadPersistedState<string>(`devos_pl_ba_cus_${user.email}`, '')
  );
  const [formBantACustomScore, setFormBantACustomScore] = useState<number>(() =>
    loadPersistedState<number>(`devos_pl_ba_sc_${user.email}`, 2)
  );

  const [formBantNSelect, setFormBantNSelect] = useState<string>(() =>
    loadPersistedState<string>(`devos_pl_bn_sel_${user.email}`, '2')
  );
  const [formBantNCustomText, setFormBantNCustomText] = useState<string>(() =>
    loadPersistedState<string>(`devos_pl_bn_cus_${user.email}`, '')
  );
  const [formBantNCustomScore, setFormBantNCustomScore] = useState<number>(() =>
    loadPersistedState<number>(`devos_pl_bn_sc_${user.email}`, 2)
  );

  const [formBantTSelect, setFormBantTSelect] = useState<string>(() =>
    loadPersistedState<string>(`devos_pl_bt_sel_${user.email}`, '1')
  );
  const [formBantTCustomText, setFormBantTCustomText] = useState<string>(() =>
    loadPersistedState<string>(`devos_pl_bt_cus_${user.email}`, '')
  );
  const [formBantTCustomScore, setFormBantTCustomScore] = useState<number>(() =>
    loadPersistedState<number>(`devos_pl_bt_sc_${user.email}`, 1)
  );

  const [formNotes, setFormNotes] = useState(() =>
    loadPersistedState(`devos_pl_notes_${user.email}`, '')
  );

  // Form Ingest Pesan WA Masuk
  const [showWaIngestModal, setShowWaIngestModal] = useState(false);
  const [waSenderName, setWaSenderName] = useState('');
  const [waSenderPhone, setWaSenderPhone] = useState('');
  const [waMessageText, setWaMessageText] = useState('');

  // Editable draft pesan follow-up per lead
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>(() =>
    loadPersistedState<Record<string, string>>(`devos_pl_drafts_${user.email}`, {})
  );

  const effectiveBantB = formBantBSelect === 'LAINNYA' ? formBantBCustomScore : Number(formBantBSelect);
  const effectiveBantA = formBantASelect === 'LAINNYA' ? formBantACustomScore : Number(formBantASelect);
  const effectiveBantN = formBantNSelect === 'LAINNYA' ? formBantNCustomScore : Number(formBantNSelect);
  const effectiveBantT = formBantTSelect === 'LAINNYA' ? formBantTCustomScore : Number(formBantTSelect);

  useEffect(() => {
    setQueryParam('tab', activeFilter);
    savePersistedState(`devos_pipeline_filter_${user.email}`, activeFilter);
  }, [activeFilter, user.email]);

  useEffect(() => {
    savePersistedState(`devos_pl_expanded_${user.email}`, expandedLeadIds);
    savePersistedState(`devos_pipeline_search_${user.email}`, searchQuery);
    savePersistedState(`devos_pipeline_form_open_${user.email}`, isLeadFormOpen);
    savePersistedState(`devos_pipeline_edit_id_${user.email}`, editingLeadId);
    savePersistedState(`devos_pipeline_persona_open_${user.email}`, showPersonaDrawer);
    savePersistedState(`devos_pl_name_${user.email}`, formName);
    savePersistedState(`devos_pl_phone_${user.email}`, formPhone);
    savePersistedState(`devos_pl_dom_${user.email}`, formDomicile);
    savePersistedState(`devos_pl_src_sel_${user.email}`, formSourceSelect);
    savePersistedState(`devos_pl_src_cus_${user.email}`, formSourceCustom);
    savePersistedState(`devos_pl_code_${user.email}`, formCode);
    savePersistedState(`devos_pl_stage_${user.email}`, formStage);
    savePersistedState(`devos_pl_unit_sel_${user.email}`, formUnitSelect);
    savePersistedState(`devos_pl_unit_cus_${user.email}`, formUnitCustom);
    savePersistedState(`devos_pl_pay_sel_${user.email}`, formPaymentSelect);
    savePersistedState(`devos_pl_pay_cus_${user.email}`, formPaymentCustom);
    savePersistedState(`devos_pl_pcode_${user.email}`, formPersonaCode);
    savePersistedState(`devos_pl_pprof_${user.email}`, formPersonaProfile);
    savePersistedState(`devos_pl_bb_sel_${user.email}`, formBantBSelect);
    savePersistedState(`devos_pl_bb_cus_${user.email}`, formBantBCustomText);
    savePersistedState(`devos_pl_bb_sc_${user.email}`, formBantBCustomScore);
    savePersistedState(`devos_pl_ba_sel_${user.email}`, formBantASelect);
    savePersistedState(`devos_pl_ba_cus_${user.email}`, formBantACustomText);
    savePersistedState(`devos_pl_ba_sc_${user.email}`, formBantACustomScore);
    savePersistedState(`devos_pl_bn_sel_${user.email}`, formBantNSelect);
    savePersistedState(`devos_pl_bn_cus_${user.email}`, formBantNCustomText);
    savePersistedState(`devos_pl_bn_sc_${user.email}`, formBantNCustomScore);
    savePersistedState(`devos_pl_bt_sel_${user.email}`, formBantTSelect);
    savePersistedState(`devos_pl_bt_cus_${user.email}`, formBantTCustomText);
    savePersistedState(`devos_pl_bt_sc_${user.email}`, formBantTCustomScore);
    savePersistedState(`devos_pl_notes_${user.email}`, formNotes);
    savePersistedState(`devos_pl_drafts_${user.email}`, customDrafts);
  }, [
    user.email,
    expandedLeadIds,
    searchQuery,
    isLeadFormOpen,
    editingLeadId,
    showPersonaDrawer,
    formName,
    formPhone,
    formDomicile,
    formSourceSelect,
    formSourceCustom,
    formCode,
    formStage,
    formUnitSelect,
    formUnitCustom,
    formPaymentSelect,
    formPaymentCustom,
    formPersonaCode,
    formPersonaProfile,
    formBantBSelect,
    formBantBCustomText,
    formBantBCustomScore,
    formBantASelect,
    formBantACustomText,
    formBantACustomScore,
    formBantNSelect,
    formBantNCustomText,
    formBantNCustomScore,
    formBantTSelect,
    formBantTCustomText,
    formBantTCustomScore,
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

  const applyIncomingLeadsWithSkeletonCheck = useCallback((fetchedLeads: PipelineLeadRecord[], isInitial = false) => {
    setLeads(fetchedLeads);
    const prevMap = prevLeadMsgMapRef.current;
    const newlyChangedIds: string[] = [];

    for (const l of fetchedLeads) {
      const currentCustMsg = (l.last_customer_message || '').trim();
      const prevCustMsg = prevMap[l.id];

      if (!isInitial && currentCustMsg && prevCustMsg !== undefined && currentCustMsg !== prevCustMsg) {
        newlyChangedIds.push(l.id);
      } else if (!isInitial && prevCustMsg === undefined && l.lead_origin === 'WA_BAILEYS') {
        newlyChangedIds.push(l.id);
      }
      prevMap[l.id] = currentCustMsg;
    }

    if (newlyChangedIds.length > 0) {
      setExpandedLeadIds((prev) => {
        const next = { ...prev };
        for (const id of newlyChangedIds) next[id] = true;
        return next;
      });
      setCustomDrafts((prev) => {
        const next = { ...prev };
        for (const id of newlyChangedIds) delete next[id];
        return next;
      });
      setExpandedMessageKeys((prev) => {
        const next = { ...prev };
        for (const id of newlyChangedIds) {
          delete next[`draft_${id}`];
          delete next[`cust_${id}`];
        }
        return next;
      });
      setSkeletonLeadIds((prev) => {
        const next = { ...prev };
        for (const id of newlyChangedIds) next[id] = true;
        return next;
      });

      setTimeout(() => {
        setSkeletonLeadIds((prev) => {
          const next = { ...prev };
          for (const id of newlyChangedIds) delete next[id];
          return next;
        });
      }, 2200);
    }
  }, []);

  const fetchPipelineAndWa = useCallback(async (isInitial = false) => {
    try {
      const [leadsRes, waRes] = await Promise.all([
        fetch('/api/pipeline/leads', { headers: apiHeaders }),
        fetch('/api/wa/status', { headers: apiHeaders }),
      ]);
      if (leadsRes.ok) {
        const lJson = await leadsRes.json();
        applyIncomingLeadsWithSkeletonCheck(lJson.leads || [], isInitial);
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
  }, [apiHeaders, applyIncomingLeadsWithSkeletonCheck]);

  useEffect(() => {
    fetchPipelineAndWa(true);
  }, [fetchPipelineAndWa]);

  // Auto-polling real-time saat menunggu scan QR / sedang sinkronisasi maupun saat WA sudah terhubung
  useEffect(() => {
    const status = waStatus?.status;
    const anyAnalyzing = leads.some((l) => l.is_ai_analyzing);
    if ((!status || status === 'DISCONNECTED') && !anyAnalyzing) return;

    const intervalMs = anyAnalyzing ? 1500 : 2500;
    const timer = setInterval(async () => {
      try {
        const [waRes, leadsRes] = await Promise.all([
          fetch('/api/wa/status', { headers: apiHeaders }),
          fetch('/api/pipeline/leads', { headers: apiHeaders }),
        ]);

        let fetchedLeads: PipelineLeadRecord[] = [];
        if (leadsRes.ok) {
          const lJson = await leadsRes.json();
          const rows: PipelineLeadRecord[] = lJson.leads || [];
          fetchedLeads = rows;
          applyIncomingLeadsWithSkeletonCheck(rows, false);
        }

        if (!waRes.ok) return;
        const wJson = await waRes.json();
        const nextWa: WaStatusData | null = wJson.data || null;
        if (!nextWa) return;

        const prevStatus = waStatus?.status;
        const prevInbound = waStatus?.metrics?.totalInboundMessages ?? 0;
        setWaStatus(nextWa);

        if (prevStatus !== 'CONNECTED' && nextWa.status === 'CONNECTED') {
          showToast(
            `WhatsApp SE berhasil terhubung (${nextWa.phoneNumber || 'Aktif'})! Pesan masuk akan otomatis ditangkap & dianalisis AI.`
          );
          if (onDataChanged) onDataChanged();
        } else if (prevStatus === 'CONNECTED' && nextWa.status === 'DISCONNECTED') {
          showToast('Peringatan: Koneksi WhatsApp SE terdiskonek! Silakan hubungkan kembali.');
          if (onDataChanged) onDataChanged();
        } else if (
          nextWa.status === 'CONNECTED' &&
          nextWa.metrics.totalInboundMessages > prevInbound
        ) {
          if (onDataChanged) onDataChanged();
          const anyStillAnalyzing = fetchedLeads?.some((l) => l.is_ai_analyzing);
          showToast(
            anyStillAnalyzing
              ? 'Pesan WhatsApp baru masuk! AI sedang menganalisis & menyusun rekomendasi balasan...'
              : 'Pesan WhatsApp baru diterima! AI telah memperbarui analisis & rekomendasi balasan.'
          );
        }
      } catch {
        /* ignore transient polling error */
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [waStatus, leads, apiHeaders, onDataChanged, applyIncomingLeadsWithSkeletonCheck]);

  const toggleLeadDetail = (leadId: string) => {
    setExpandedLeadIds((prev) => ({
      ...prev,
      [leadId]: !prev[leadId],
    }));
  };

  const handleSelectPersonaPreset = (code: PersonaCode) => {
    setFormPersonaCode(code);
    setFormPersonaProfile(createDefaultPersonaForm(code));
  };

  const resetForm = () => {
    setEditingLeadId(null);
    setFormName('');
    setFormPhone('');
    setFormDomicile('');
    setFormSourceSelect(LEAD_SOURCES[1]);
    setFormSourceCustom('');
    setFormCode('ADS-META-CTWA-01');
    setFormStage('NEW');
    setFormUnitSelect(PLAYBOOK_UNIT_CATALOG[0].label);
    setFormUnitCustom('');
    setFormPaymentSelect('KPR');
    setFormPaymentCustom('');
    setFormPersonaCode('P1');
    setFormPersonaProfile(createDefaultPersonaForm('P1'));
    setFormBantBSelect('2');
    setFormBantBCustomText('');
    setFormBantBCustomScore(2);
    setFormBantASelect('2');
    setFormBantACustomText('');
    setFormBantACustomScore(2);
    setFormBantNSelect('2');
    setFormBantNCustomText('');
    setFormBantNCustomScore(2);
    setFormBantTSelect('1');
    setFormBantTCustomText('');
    setFormBantTCustomScore(1);
    setFormNotes('');
    setShowPersonaDrawer(false);
  };

  const openEditLead = (lead: PipelineLeadRecord) => {
    setEditingLeadId(lead.id);
    setFormName(lead.full_name);
    setFormPhone(lead.phone_wa);
    setFormDomicile(lead.domicile);

    if (LEAD_SOURCES.includes(lead.source)) {
      setFormSourceSelect(lead.source);
      setFormSourceCustom('');
    } else {
      setFormSourceSelect('LAINNYA');
      setFormSourceCustom(lead.source);
    }

    setFormCode(lead.content_code);
    setFormStage(lead.stage);

    if (PLAYBOOK_UNIT_CATALOG.some((u) => u.label === lead.unit_interest)) {
      setFormUnitSelect(lead.unit_interest);
      setFormUnitCustom('');
    } else {
      setFormUnitSelect('LAINNYA');
      setFormUnitCustom(lead.unit_interest);
    }

    if (PAYMENT_SCHEMES.some((p) => p.code === lead.payment_scheme)) {
      setFormPaymentSelect(lead.payment_scheme);
      setFormPaymentCustom('');
    } else {
      setFormPaymentSelect('LAINNYA');
      setFormPaymentCustom(lead.payment_scheme);
    }

    const pCode = (lead.persona_code in PLAYBOOK_BUYER_PERSONAS ? lead.persona_code : 'LAINNYA') as PersonaCode;
    setFormPersonaCode(pCode);
    setFormPersonaProfile(
      Object.keys(lead.persona_profile || {}).length > 0
        ? lead.persona_profile
        : createDefaultPersonaForm(pCode)
    );

    setFormBantBSelect(String(lead.bant_b));
    setFormBantASelect(String(lead.bant_a));
    setFormBantNSelect(String(lead.bant_n));
    setFormBantTSelect(String(lead.bant_t));
    setFormNotes(lead.sales_notes);
    setIsLeadFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedSource =
      formSourceSelect === 'LAINNYA' ? formSourceCustom.trim() : formSourceSelect;
    const resolvedUnit =
      formUnitSelect === 'LAINNYA' ? formUnitCustom.trim() : formUnitSelect;
    const resolvedPayment =
      formPaymentSelect === 'LAINNYA' ? formPaymentCustom.trim() : formPaymentSelect;

    if (!resolvedSource) {
      showToast('Mohon isi sumber lead pada kolom Lainnya.');
      return;
    }
    if (!resolvedUnit) {
      showToast('Mohon isi unit & cluster minat pada kolom Lainnya.');
      return;
    }
    if (!resolvedPayment) {
      showToast('Mohon isi skema pembayaran pada kolom Lainnya.');
      return;
    }

    const customBantNotes: string[] = [];
    if (formBantBSelect === 'LAINNYA' && formBantBCustomText.trim()) {
      customBantNotes.push(`Budget: ${formBantBCustomText.trim()}`);
    }
    if (formBantASelect === 'LAINNYA' && formBantACustomText.trim()) {
      customBantNotes.push(`Authority: ${formBantACustomText.trim()}`);
    }
    if (formBantNSelect === 'LAINNYA' && formBantNCustomText.trim()) {
      customBantNotes.push(`Need: ${formBantNCustomText.trim()}`);
    }
    if (formBantTSelect === 'LAINNYA' && formBantTCustomText.trim()) {
      customBantNotes.push(`Timeline: ${formBantTCustomText.trim()}`);
    }

    const enrichedNotes =
      customBantNotes.length > 0
        ? `${formNotes.trim()}\n[Keterangan BANT Tambahan: ${customBantNotes.join(' | ')}]`.trim()
        : formNotes.trim();

    setSubmitting(true);
    try {
      const payload = {
        fullName: formName,
        phoneWa: formPhone,
        domicile: formDomicile,
        source: resolvedSource,
        contentCode: formCode,
        stage: formStage,
        unitInterest: resolvedUnit,
        paymentScheme: resolvedPayment,
        personaCode: formPersonaCode,
        personaProfile: formPersonaProfile,
        bantB: effectiveBantB,
        bantA: effectiveBantA,
        bantN: effectiveBantN,
        bantT: effectiveBantT,
        salesNotes: enrichedNotes,
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
        setExpandedLeadIds((prev) => ({ ...prev, [savedLead.id]: true }));
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
        `Pilih atau tuliskan alasan kalah (Playbook §13.4):\n${STANDARD_LOST_REASONS.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
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
    setReanalyzingLeadId(lead.id);
    setExpandedLeadIds((prev) => ({ ...prev, [lead.id]: true }));
    try {
      const res = await fetch(`/api/pipeline/leads/${lead.id}`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify({ reanalyze: true }),
      });
      if (res.ok) {
        setCustomDrafts((prev) => {
          if (!(lead.id in prev)) return prev;
          const copy = { ...prev };
          delete copy[lead.id];
          return copy;
        });
        await fetchPipelineAndWa();
        if (onDataChanged) onDataChanged();
        showToast(`Analisis AI & rekomendasi untuk ${lead.full_name} berhasil diperbarui!`);
      }
    } finally {
      setSubmitting(false);
      setReanalyzingLeadId(null);
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

  const handleConnectWa = async (forceFresh = false) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/wa/connect', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ forceFresh }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setWaStatus(data.data);
        if (data.data?.status === 'CONNECTED') {
          showToast(`WhatsApp SE sudah terhubung (${data.data.phoneNumber || 'Aktif'})!`);
          if (onDataChanged) onDataChanged();
        } else {
          showToast('Sesi Baileys disiapkan untuk akun Anda. Silakan pindai QR WhatsApp.');
        }
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
        if (onDataChanged) onDataChanged();
        showToast('Koneksi WhatsApp SE berhasil didiskonek (diputuskan).');
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
    const draft = (
      customDrafts[lead.id] ??
      lead.latest_analysis?.followup_draft_message ??
      `Selamat sore ${lead.full_name}, saya ${user.name} dari The Park Townhouse Sukoharjo.`
    ).trim();

    if (!draft) {
      showToast('Isi pesan follow-up tidak boleh kosong.');
      return;
    }

    // Wajib menggunakan nomor WhatsApp SE yang terhubung. Jika belum terhubung, arahkan ke integrasi QR dulu.
    if (!waStatus || waStatus.status !== 'CONNECTED') {
      showToast(
        'Nomor WhatsApp Anda belum terhubung! Silakan scan QR pada panel Integrasi WhatsApp terlebih dahulu.'
      );
      document
        .getElementById('wa-integration-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!waStatus || waStatus.status === 'DISCONNECTED') {
        handleConnectWa(false);
      }
      return;
    }

    setSendingLeadId(lead.id);
    try {
      const res = await fetch('/api/wa/send-message', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ contactPhone: lead.phone_wa, messageText: draft }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.code === 'WA_NOT_CONNECTED') {
          showToast(
            'Sesi WhatsApp belum terhubung. Silakan scan QR pada panel Integrasi WhatsApp di atas.'
          );
          document
            .getElementById('wa-integration-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          handleConnectWa(false);
          return;
        }
        showToast(data.error || 'Gagal mengirim pesan WhatsApp otomatis');
        return;
      }

      await fetchPipelineAndWa();
      if (onDataChanged) onDataChanged();
      showToast(
        `Pesan berhasil terkirim otomatis dari WA (${data.senderPhone || waStatus.phoneNumber}) ke ${lead.full_name}!`
      );
    } catch {
      showToast('Terjadi kesalahan jaringan saat mengirim pesan WhatsApp.');
    } finally {
      setSendingLeadId(null);
    }
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

  const previewBant = evaluatePlaybookBant(
    effectiveBantB,
    effectiveBantA,
    effectiveBantN,
    effectiveBantT
  );

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
              if (!waStatus || waStatus.status === 'DISCONNECTED') {
                handleConnectWa(false);
              }
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer border transition-colors ${
              waStatus?.status === 'CONNECTED'
                ? 'bg-lime-100 hover:bg-lime-200 text-olive border-lime-300'
                : waStatus?.status === 'QR_READY' || waStatus?.status === 'CONNECTING'
                ? 'bg-amber-50 hover:bg-amber-100 text-terracotta border-amber-300'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`size-2.5 rounded-full shrink-0 ${
                waStatus?.status === 'CONNECTED'
                  ? 'bg-olive animate-pulse'
                  : waStatus?.status === 'QR_READY' || waStatus?.status === 'CONNECTING'
                  ? 'bg-terracotta animate-ping'
                  : 'bg-rose-600 animate-pulse'
              }`}
            />
            <QrCode className="size-4 shrink-0" />
            <span>
              {waStatus?.status === 'CONNECTED'
                ? `WA Terhubung (${waStatus.phoneNumber})`
                : waStatus?.status === 'QR_READY'
                ? 'WA Menunggu Scan QR'
                : waStatus?.status === 'CONNECTING'
                ? 'WA Menyambungkan...'
                : 'WA Terdiskonek · Hubungkan (QR)'}
            </span>
          </button>

          {waStatus && waStatus.status !== 'DISCONNECTED' && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleDisconnectWa}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <X className="size-4 shrink-0" />
              <span>Diskonek WA</span>
            </button>
          )}

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
      <section
        id="wa-integration-section"
        className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-4 transition-colors ${
          waStatus?.status === 'CONNECTED'
            ? 'border-lime-300'
            : waStatus?.status === 'QR_READY' || waStatus?.status === 'CONNECTING'
            ? 'border-amber-300'
            : 'border-rose-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                waStatus?.status === 'CONNECTED'
                  ? 'bg-lime-100 text-olive'
                  : waStatus?.status === 'QR_READY' || waStatus?.status === 'CONNECTING'
                  ? 'bg-amber-100 text-terracotta'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <Smartphone className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-espresso">
                  Integrasi WhatsApp Khusus SE (Baileys Engine)
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 border ${
                    waStatus?.status === 'CONNECTED'
                      ? 'bg-lime-100 text-olive border-lime-300'
                      : waStatus?.status === 'QR_READY' || waStatus?.status === 'CONNECTING'
                      ? 'bg-amber-100 text-terracotta border-amber-300'
                      : 'bg-rose-100 text-rose-700 border-rose-300'
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      waStatus?.status === 'CONNECTED'
                        ? 'bg-olive animate-pulse'
                        : waStatus?.status === 'QR_READY' || waStatus?.status === 'CONNECTING'
                        ? 'bg-terracotta animate-ping'
                        : 'bg-rose-600 animate-pulse'
                    }`}
                  />
                  <span>
                    {waStatus?.status === 'CONNECTED'
                      ? `Terhubung (${waStatus.phoneNumber})`
                      : waStatus?.status === 'QR_READY'
                      ? 'Menunggu Scan QR (Auto-Detect Aktif)'
                      : waStatus?.status === 'CONNECTING'
                      ? 'Sedang Menyambungkan ke WhatsApp...'
                      : `Terdiskonek${waStatus?.phoneNumber ? ` (Terakhir: ${waStatus.phoneNumber})` : ' / Belum Terhubung'}`}
                  </span>
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
                className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <X className="size-4 shrink-0" />
                <span>Diskonek / Putuskan WA</span>
              </button>
            ) : (
              <>
                {(waStatus?.status === 'QR_READY' || waStatus?.status === 'CONNECTING') && (
                  <>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleConnectWa(true)}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-espresso border border-warmborder text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`size-3.5 ${submitting ? 'animate-spin' : ''}`} />
                      <span>Buat QR Baru</span>
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleDisconnectWa}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="size-3.5 shrink-0" />
                      <span>Diskonek / Batalkan</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleConnectWa(false)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-espresso text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="size-4 text-amber-400" />
                  <span>
                    {submitting
                      ? 'Menyiapkan QR...'
                      : waStatus?.status === 'QR_READY'
                      ? 'Cek Status Scan'
                      : 'Hubungkan WA SE (QR)'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Indikator Peringatan jika WhatsApp sedang Terdiskonek */}
        {(!waStatus || waStatus.status === 'DISCONNECTED') && (
          <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-rose-900">
                  Indikator Status: WhatsApp SE Sedang Terdiskonek (Terputus)
                </p>
                <p className="text-rose-700 mt-0.5">
                  Pesan masuk dari calon pembeli tidak dapat ditangkap otomatis oleh AI selama status Terdiskonek
                  {waStatus?.phoneNumber ? ` (nomor sebelumnya: ${waStatus.phoneNumber})` : ''}. Klik{' '}
                  <strong>Hubungkan WA SE (QR)</strong> untuk menautkan kembali.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleConnectWa(true)}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold shrink-0 cursor-pointer"
            >
              Tampilkan QR Sekarang
            </button>
          </div>
        )}

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
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-terracotta animate-ping" />
                <p className="font-extrabold text-espresso text-sm">
                  Pindai QR dengan Nomor WhatsApp Khusus SE ({user.name})
                </p>
              </div>
              <p className="text-warmmuted">
                1. Buka WhatsApp di HP kerja Anda &rarr; <strong>Perangkat Tertaut</strong> &rarr; <strong>Tautkan Perangkat</strong>.
              </p>
              <p className="text-warmmuted">
                2. Setelah di-scan, tunggu 5–15 detik — halaman ini otomatis mendeteksi status <strong>Terhubung</strong> tanpa perlu klik ulang.
              </p>
              <p className="text-warmmuted">
                3. Setiap pesan masuk dari calon pembeli akan otomatis ditangkap &amp; dianalisis AI menjadi Lead di bawah ini.
              </p>
              <p className="text-terracotta font-semibold">
                Isolasi Aktif: Nomor yang tertaut hanya berlaku untuk akun {user.email}.
              </p>
            </div>
          </div>
        )}

        {/* Indikator ketika sedang sinkronisasi setelah scan QR */}
        {waStatus?.status === 'CONNECTING' && !waStatus?.qrDataUrl && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center gap-3 text-xs text-espresso">
            <RefreshCw className="size-5 text-terracotta animate-spin shrink-0" />
            <div>
              <p className="font-extrabold">Sedang Menyambungkan &amp; Sinkronisasi Sesi WhatsApp...</p>
              <p className="text-warmmuted mt-0.5">
                Mohon tunggu beberapa detik, halaman ini akan otomatis berubah menjadi Terhubung begitu sinkronisasi selesai.
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

      {/* Form Input / Edit Lead + Persona 7 Dimensi + Opsi Lainnya */}
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
              {/* Dropdown Sumber Lead + Pilihan Lainnya */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-espresso">Sumber Lead</label>
                <select
                  value={formSourceSelect}
                  onChange={(e) => setFormSourceSelect(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs bg-white"
                >
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="LAINNYA">Lainnya (Isi Sendiri...)</option>
                </select>
                {formSourceSelect === 'LAINNYA' && (
                  <input
                    required
                    value={formSourceCustom}
                    onChange={(e) => setFormSourceCustom(e.target.value)}
                    placeholder="Masukkan sumber lead..."
                    className="w-full min-h-[40px] px-3 rounded-xl border border-terracotta bg-amber-50/40 text-xs focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1.5">Kode Konten / Iklan</label>
                <input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="TP1122C / ADS-META-01"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs"
                />
              </div>

              {/* Dropdown Unit & Cluster Minat + Pilihan Lainnya */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-espresso">Unit &amp; Cluster Minat</label>
                <select
                  value={formUnitSelect}
                  onChange={(e) => setFormUnitSelect(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs bg-white"
                >
                  {PLAYBOOK_UNIT_CATALOG.map((u) => (
                    <option key={u.label} value={u.label}>
                      {u.label} — Rp{(u.priceCashIdr / 1000000).toFixed(0)} Jt
                    </option>
                  ))}
                  <option value="LAINNYA">Lainnya (Isi Sendiri...)</option>
                </select>
                {formUnitSelect === 'LAINNYA' && (
                  <input
                    required
                    value={formUnitCustom}
                    onChange={(e) => setFormUnitCustom(e.target.value)}
                    placeholder="Masukkan unit / cluster minat..."
                    className="w-full min-h-[40px] px-3 rounded-xl border border-terracotta bg-amber-50/40 text-xs focus:outline-none"
                  />
                )}
              </div>

              {/* Dropdown Skema Pembayaran + Pilihan Lainnya */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-espresso">Skema Pembayaran</label>
                <select
                  value={formPaymentSelect}
                  onChange={(e) => setFormPaymentSelect(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder text-xs bg-white"
                >
                  {PAYMENT_SCHEMES.map((p) => (
                    <option key={p.code} value={p.code}>{p.label}</option>
                  ))}
                  <option value="LAINNYA">Lainnya (Isi Sendiri...)</option>
                </select>
                {formPaymentSelect === 'LAINNYA' && (
                  <input
                    required
                    value={formPaymentCustom}
                    onChange={(e) => setFormPaymentCustom(e.target.value)}
                    placeholder="Masukkan skema pembayaran..."
                    className="w-full min-h-[40px] px-3 rounded-xl border border-terracotta bg-amber-50/40 text-xs focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Rubrik BANT 0-3 per huruf (Total 12) + Opsi Lainnya di Setiap Dropdown */}
            <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-espresso">
                  Kualifikasi Skor BANT (0–3 per dimensi, Total 0–12 · Playbook §5.2)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-warmborder text-xs font-extrabold text-terracotta">
                  Total: {previewBant.total}/12 · Grade {previewBant.grade} ({previewBant.statusLabel})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* B - Budget */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-espresso">B — Budget (0–3)</label>
                  <select
                    value={formBantBSelect}
                    onChange={(e) => setFormBantBSelect(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-warmborder bg-white"
                  >
                    <option value="0">0: Belum tahu / &lt; Rp500 jt</option>
                    <option value="1">1: Rp500–649 jt / Gaji &lt; Rp15 jt</option>
                    <option value="2">2: Sesuai unit, DP belum siap penuh</option>
                    <option value="3">3: Dana/DP siap, gaji memenuhi KPR</option>
                    <option value="LAINNYA">Lainnya (Isi Sendiri...)</option>
                  </select>
                  {formBantBSelect === 'LAINNYA' && (
                    <div className="p-2.5 rounded-xl bg-white border border-terracotta space-y-1.5">
                      <input
                        required
                        value={formBantBCustomText}
                        onChange={(e) => setFormBantBCustomText(e.target.value)}
                        placeholder="Tuliskan kondisi budget pembeli..."
                        className="w-full min-h-[36px] px-2.5 rounded-lg border border-warmborder text-xs"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-warmmuted">Skor Budget (0–3):</span>
                        <select
                          value={formBantBCustomScore}
                          onChange={(e) => setFormBantBCustomScore(Number(e.target.value))}
                          className="h-7 px-2 rounded border border-warmborder text-xs font-bold"
                        >
                          {[0, 1, 2, 3].map((n) => (
                            <option key={n} value={n}>{n} Poin</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* A - Authority */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-espresso">A — Authority (0–3)</label>
                  <select
                    value={formBantASelect}
                    onChange={(e) => setFormBantASelect(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-warmborder bg-white"
                  >
                    <option value="0">0: Tidak diketahui</option>
                    <option value="1">1: Pencari info (anak/kerabat)</option>
                    <option value="2">2: Pengambil keputusan, pasangan belum ikut</option>
                    <option value="3">3: Suami-istri/orang tua terlibat penuh</option>
                    <option value="LAINNYA">Lainnya (Isi Sendiri...)</option>
                  </select>
                  {formBantASelect === 'LAINNYA' && (
                    <div className="p-2.5 rounded-xl bg-white border border-terracotta space-y-1.5">
                      <input
                        required
                        value={formBantACustomText}
                        onChange={(e) => setFormBantACustomText(e.target.value)}
                        placeholder="Tuliskan pengambil keputusan..."
                        className="w-full min-h-[36px] px-2.5 rounded-lg border border-warmborder text-xs"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-warmmuted">Skor Authority (0–3):</span>
                        <select
                          value={formBantACustomScore}
                          onChange={(e) => setFormBantACustomScore(Number(e.target.value))}
                          className="h-7 px-2 rounded border border-warmborder text-xs font-bold"
                        >
                          {[0, 1, 2, 3].map((n) => (
                            <option key={n} value={n}>{n} Poin</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* N - Need */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-espresso">N — Need (0–3)</label>
                  <select
                    value={formBantNSelect}
                    onChange={(e) => setFormBantNSelect(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-warmborder bg-white"
                  >
                    <option value="0">0: Belum jelas</option>
                    <option value="1">1: Baru lihat-lihat</option>
                    <option value="2">2: Kebutuhan kamar/lokasi jelas</option>
                    <option value="3">3: Spesifik &amp; cocok nomor unit tertentu</option>
                    <option value="LAINNYA">Lainnya (Isi Sendiri...)</option>
                  </select>
                  {formBantNSelect === 'LAINNYA' && (
                    <div className="p-2.5 rounded-xl bg-white border border-terracotta space-y-1.5">
                      <input
                        required
                        value={formBantNCustomText}
                        onChange={(e) => setFormBantNCustomText(e.target.value)}
                        placeholder="Tuliskan kebutuhan spesifik pembeli..."
                        className="w-full min-h-[36px] px-2.5 rounded-lg border border-warmborder text-xs"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-warmmuted">Skor Need (0–3):</span>
                        <select
                          value={formBantNCustomScore}
                          onChange={(e) => setFormBantNCustomScore(Number(e.target.value))}
                          className="h-7 px-2 rounded border border-warmborder text-xs font-bold"
                        >
                          {[0, 1, 2, 3].map((n) => (
                            <option key={n} value={n}>{n} Poin</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* T - Timeline */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-espresso">T — Timeline (0–3)</label>
                  <select
                    value={formBantTSelect}
                    onChange={(e) => setFormBantTSelect(e.target.value)}
                    className="w-full min-h-[42px] px-2.5 rounded-xl border border-warmborder bg-white"
                  >
                    <option value="0">0: &gt; 12 bulan / tidak tahu</option>
                    <option value="1">1: 6–12 bulan</option>
                    <option value="2">2: 1–6 bulan</option>
                    <option value="3">3: &le; 30 hari / ada pemicu mendesak</option>
                    <option value="LAINNYA">Lainnya (Isi Sendiri...)</option>
                  </select>
                  {formBantTSelect === 'LAINNYA' && (
                    <div className="p-2.5 rounded-xl bg-white border border-terracotta space-y-1.5">
                      <input
                        required
                        value={formBantTCustomText}
                        onChange={(e) => setFormBantTCustomText(e.target.value)}
                        placeholder="Tuliskan target waktu beli..."
                        className="w-full min-h-[36px] px-2.5 rounded-lg border border-warmborder text-xs"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-warmmuted">Skor Timeline (0–3):</span>
                        <select
                          value={formBantTCustomScore}
                          onChange={(e) => setFormBantTCustomScore(Number(e.target.value))}
                          className="h-7 px-2 rounded border border-warmborder text-xs font-bold"
                        >
                          {[0, 1, 2, 3].map((n) => (
                            <option key={n} value={n}>{n} Poin</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Masukkan Persona Pembeli (Tanpa Nama Tokoh + Ada Pilihan Lainnya) */}
            <div className="border border-warmborder rounded-2xl overflow-hidden">
              <div className="p-3.5 bg-sandstone/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-terracotta" />
                  <span className="text-xs font-extrabold text-espresso">
                    Template Persona: {formPersonaCode} ·{' '}
                    {formPersonaCode === 'LAINNYA'
                      ? formPersonaProfile.customLabel || 'Lainnya (Kustom)'
                      : PLAYBOOK_BUYER_PERSONAS[formPersonaCode].archetype}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPersonaDrawer((prev) => !prev)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-espresso text-white text-xs font-bold cursor-pointer"
                >
                  {showPersonaDrawer ? 'Tutup Detail Persona' : 'Masukkan Persona Pembeli'}
                </button>
              </div>

              {showPersonaDrawer && (
                <div className="p-4 bg-white space-y-4 border-t border-warmborder">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-warmmuted mb-2">
                      Pilih Template Persona Pembeli:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(Object.keys(PLAYBOOK_BUYER_PERSONAS) as PersonaCode[]).map((pKey) => {
                        const pObj = PLAYBOOK_BUYER_PERSONAS[pKey];
                        const isSel = formPersonaCode === pKey;
                        return (
                          <button
                            key={pKey}
                            type="button"
                            onClick={() => handleSelectPersonaPreset(pKey)}
                            className={`p-3 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                              isSel
                                ? 'bg-amber-50 border-terracotta text-espresso font-bold'
                                : 'bg-sandstone/40 border-warmborder text-warmmuted hover:text-espresso'
                            }`}
                          >
                            <span className="font-extrabold text-terracotta">{pKey}</span> · {pObj.archetype}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {formPersonaCode === 'LAINNYA' && (
                    <div>
                      <label className="block text-xs font-bold text-espresso mb-1">
                        Nama / Kategori Persona Pembeli Kustom *
                      </label>
                      <input
                        required
                        value={formPersonaProfile.customLabel || ''}
                        onChange={(e) =>
                          setFormPersonaProfile((prev) => ({
                            ...prev,
                            customLabel: e.target.value,
                          }))
                        }
                        placeholder="Contoh: Pasangan Ekspatriat / Pengusaha Kuliner Solo Baru"
                        className="w-full min-h-[42px] px-3 rounded-xl border border-terracotta bg-amber-50/30 text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Tabel 8 Dimensi Persona sesuai Gambar Playbook */}
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
                          placeholder={`Isi ${dim.label.toLowerCase()}...`}
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
                Catatan Kebutuhan, Anggaran &amp; Konteks Prospek * (Digunakan AI untuk Analisa &amp; Draf Pesan)
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

      {/* Daftar Lead (Default Tertutup / List Ringkas, Buka saat Klik Detail) */}
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
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const analysis = lead.latest_analysis;
            const personaInfo =
              PLAYBOOK_BUYER_PERSONAS[lead.persona_code] || PLAYBOOK_BUYER_PERSONAS.P1;
            const personaDisplayLabel =
              lead.persona_code === 'LAINNYA'
                ? lead.persona_profile?.customLabel || 'Persona Lainnya'
                : `${lead.persona_code} · ${personaInfo.archetype}`;
            const stageInfo =
              PLAYBOOK_PIPELINE_STAGES.find((s) => s.code === lead.stage) ||
              PLAYBOOK_PIPELINE_STAGES[0];
            const isUnclear =
              lead.validity_status === 'PERLU_DILENGKAPI' ||
              analysis?.clarity_status === 'PERLU_DILENGKAPI';
            const isExpanded = Boolean(expandedLeadIds[lead.id]);
            const isWaInboundLead =
              lead.lead_origin === 'WA_BAILEYS' ||
              /whatsapp inbound|baileys/i.test(lead.source || '');
            const analysisCreatedMs = analysis?.created_at
              ? new Date(analysis.created_at).getTime()
              : 0;
            const leadUpdatedMs = lead.updated_at ? new Date(lead.updated_at).getTime() : 0;
            const hasNewUnsentAiDraft =
              analysisCreatedMs > 0 &&
              leadUpdatedMs > 0 &&
              analysisCreatedMs >= leadUpdatedMs - 1500 &&
              (lead.last_sales_message || '').trim() !==
                (analysis?.followup_draft_message || '').trim();
            const isAiWorking = Boolean(
              lead.is_ai_analyzing ||
                reanalyzingLeadId === lead.id ||
                skeletonLeadIds[lead.id]
            );
            const isFollowUpAlreadySent =
              !isAiWorking &&
              Boolean(lead.last_sales_message && lead.last_sales_message.trim()) &&
              !hasNewUnsentAiDraft;
            const draftMsg =
              customDrafts[lead.id] ??
              analysis?.followup_draft_message ??
              `Selamat sore ${lead.full_name}, saya ${user.name} dari The Park Townhouse Sukoharjo.`;
            const isCustMsgLong =
              Boolean(lead.last_customer_message) &&
              ((lead.last_customer_message || '').length > 140 ||
                (lead.last_customer_message || '').split('\n').length > 3);
            const isCustMsgExpanded = Boolean(expandedMessageKeys[`cust_${lead.id}`]);
            const isDraftMsgLong = draftMsg.length > 165 || draftMsg.split('\n').length > 3;
            const isDraftMsgExpanded = Boolean(expandedMessageKeys[`draft_${lead.id}`]);
            const isSentMsgLong =
              Boolean(lead.last_sales_message) &&
              ((lead.last_sales_message || '').length > 165 ||
                (lead.last_sales_message || '').split('\n').length > 3);
            const isSentMsgExpanded = Boolean(expandedMessageKeys[`sent_${lead.id}`]);

            const initials = lead.full_name
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() || '')
              .join('');

            return (
              <article
                key={lead.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all ${
                  isUnclear ? 'border-rose-300 ring-1 ring-rose-200' : 'border-warmborder'
                }`}
              >
                {/* Baris Ringkas Lead (Selalu Tampil) */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div
                    onClick={() => toggleLeadDetail(lead.id)}
                    className="space-y-1 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-espresso">{lead.full_name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-terracotta border border-amber-200">
                        BANT {lead.bant_total}/12 · Grade {lead.grade}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sandstone text-espresso border border-warmborder">
                        {personaDisplayLabel}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isWaInboundLead
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50/60 text-espresso border border-warmborder'
                        }`}
                      >
                        {isWaInboundLead ? 'WA Inbound AI' : 'Lead Manual (Pasca-Temu)'}
                      </span>
                      {analysis && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isUnclear ? 'bg-rose-100 text-rose-700' : 'bg-lime-100 text-olive'
                          }`}
                        >
                          Skor AI: {analysis.skor}/100 ({analysis.label})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-warmmuted truncate">
                      WA: <strong className="text-espresso">{lead.phone_wa}</strong> · Domisili:{' '}
                      <strong className="text-espresso">{lead.domicile || '-'}</strong> · Sumber:{' '}
                      {lead.source} · Minat:{' '}
                      <strong className="text-terracotta">{lead.unit_interest}</strong> ({lead.payment_scheme})
                    </p>
                  </div>

                  {/* Kontrol Cepat & Tombol Buka/Tutup Detail */}
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
                      onClick={() => toggleLeadDetail(lead.id)}
                      aria-expanded={isExpanded}
                      className={`min-h-[42px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isExpanded
                          ? 'bg-espresso text-white'
                          : 'bg-amber-50 hover:bg-amber-100 text-terracotta border border-amber-200'
                      }`}
                    >
                      <span>{isExpanded ? 'Tutup Detail' : 'Detail'}</span>
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>

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

                {/* Panel Detail Lead (Hanya Muncul Saat User Klik Tombol Detail) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-warmborder space-y-4">
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

                    {/* Checkbox Bukti Operasional CRM */}
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

                    {/* Grid Kiri: Analisis AI · Grid Kanan: Preview Tampilan Chat WhatsApp */}
                    {(analysis || isAiWorking) && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-7 space-y-2.5 text-xs">
                          {isAiWorking ? (
                            /* ANIMASI SKELETON TEMPAT 1: HASIL ANALISIS AI, POIN KUAT, SARAN TAKTIS & PERTANYAAN BANT */
                            <div className="space-y-2.5" aria-busy="true" aria-live="polite">
                              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-extrabold text-terracotta flex items-center gap-2">
                                    <Sparkles className="size-4 animate-spin text-terracotta" />
                                    <span>AI Sedang Menganalisis Pesan Terbaru {lead.full_name}...</span>
                                  </p>
                                  <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-terracotta text-[10px] font-extrabold animate-pulse">
                                    Menganalisis BANT &amp; Persona
                                  </span>
                                </div>
                                <div className="space-y-2 animate-pulse pt-0.5">
                                  <div className="h-3 bg-amber-200/80 rounded-full w-11/12" />
                                  <div className="h-3 bg-amber-200/70 rounded-full w-4/5" />
                                  <div className="h-3 bg-amber-200/60 rounded-full w-3/5" />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder space-y-2 animate-pulse">
                                  <p className="font-bold text-olive">Poin Kuat Prospek:</p>
                                  <div className="h-2.5 bg-warmborder rounded-full w-11/12" />
                                  <div className="h-2.5 bg-warmborder rounded-full w-5/6" />
                                  <div className="h-2.5 bg-warmborder rounded-full w-4/6" />
                                  <div className="h-2.5 bg-warmborder rounded-full w-3/4" />
                                </div>

                                <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder space-y-2 animate-pulse">
                                  <p className="font-bold text-terracotta">Saran Taktis AI (Playbook):</p>
                                  <div className="h-2.5 bg-warmborder rounded-full w-full" />
                                  <div className="h-2.5 bg-warmborder rounded-full w-10/12" />
                                  <div className="h-2.5 bg-warmborder rounded-full w-4/5" />
                                  <div className="h-2.5 bg-warmborder rounded-full w-3/5" />
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-white border border-warmborder space-y-2 animate-pulse">
                                <p className="font-bold text-espresso">
                                  Pertanyaan BANT Natural Berikutnya (Bab 5.3):
                                </p>
                                <div className="h-2.5 bg-sandstone rounded-full w-11/12" />
                                <div className="h-2.5 bg-sandstone rounded-full w-4/5" />
                                <div className="h-2.5 bg-sandstone rounded-full w-3/4" />
                              </div>
                            </div>
                          ) : (
                            analysis && (
                              <>
                                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                                  <p className="font-extrabold text-terracotta flex items-center gap-1.5">
                                    <Sparkles className="size-3.5" />
                                    <span>Hasil Analisis AI</span>
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
                              </>
                            )
                          )}
                        </div>

                        {/* Sisi Kanan: Preview Tampilan Pesan WhatsApp */}
                        <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-warmborder flex flex-col justify-between bg-[#ECE5DD]">
                          {/* Top Bar WhatsApp */}
                          <div className="px-3.5 py-2.5 bg-[#075E54] text-white flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-8 rounded-full bg-white/20 text-white font-extrabold text-xs grid place-items-center shrink-0">
                                {initials || 'WA'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate leading-tight">
                                  {lead.full_name}
                                </p>
                                <p className="text-[10px] text-white/80 truncate">
                                  +{lead.phone_wa} ·{' '}
                                  {isAiWorking
                                    ? 'AI Sedang Menyusun Balasan...'
                                    : isFollowUpAlreadySent
                                    ? 'Pesan Terkirim'
                                    : 'Pratinjau Pesan WA'}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold shrink-0">
                              {isAiWorking
                                ? 'Menyusun...'
                                : isFollowUpAlreadySent
                                ? 'Terkirim ✓✓'
                                : 'Draf AI'}
                            </span>
                          </div>

                          {/* Area Gelembung Pesan (Turn-by-Turn Percakapan Sungguhan) */}
                          <div className="p-3.5 flex-1 flex flex-col justify-end space-y-2.5">
                            <div className="self-center px-2.5 py-0.5 rounded-lg bg-[#E1F3FB] text-[#54656F] text-[10px] font-semibold shadow-2xs text-center">
                              {isAiWorking
                                ? `Pesan baru dari ${lead.full_name} diterima · AI sedang menyusun balasan`
                                : isFollowUpAlreadySent
                                ? `Pesan telah dikirim ke ${lead.full_name} · Menunggu balasan berikutnya`
                                : isWaInboundLead
                                ? 'Mode Balasan Chat WA · Klik Lihat selengkapnya untuk edit sebelum kirim'
                                : 'Mode Follow-Up Pasca-Temu · Klik Lihat selengkapnya untuk edit sebelum kirim'}
                            </div>

                            {lead.last_customer_message && (
                              <div className="mr-6 rounded-2xl rounded-tl-xs bg-white p-2.5 shadow-2xs border border-black/5 text-xs text-[#111B21]">
                                <p className="text-[10px] font-bold text-[#075E54] mb-0.5">
                                  {lead.full_name}:
                                </p>
                                <p className="leading-snug whitespace-pre-line">
                                  {isCustMsgLong && !isCustMsgExpanded
                                    ? `${lead.last_customer_message.slice(0, 140).trim()}...`
                                    : lead.last_customer_message}
                                </p>
                                {isCustMsgLong && (
                                  <button
                                    type="button"
                                    onClick={() => toggleMessageExpand(`cust_${lead.id}`)}
                                    className="mt-1 text-[11px] font-extrabold text-[#075E54] hover:underline cursor-pointer"
                                  >
                                    {isCustMsgExpanded ? 'Tampilkan lebih singkat' : 'Lihat selengkapnya'}
                                  </button>
                                )}
                              </div>
                            )}

                            {isAiWorking ? (
                              /* ANIMASI SKELETON TEMPAT 2: GELEMBUNG HIJAU REKOMENDASI BALASAN AI */
                              <div
                                className="relative ml-3 rounded-2xl rounded-tr-xs bg-[#DCF8C6] p-3 shadow-xs border border-[#c7eab0] space-y-2.5"
                                aria-busy="true"
                                aria-live="polite"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-extrabold text-[#075E54] flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 animate-spin text-[#075E54]" />
                                    <span>AI sedang mengetik rekomendasi balasan ({user.name.split(' ')[0]})...</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-[#075E54] animate-bounce" />
                                    <span className="size-1.5 rounded-full bg-[#075E54] animate-bounce [animation-delay:150ms]" />
                                    <span className="size-1.5 rounded-full bg-[#075E54] animate-bounce [animation-delay:300ms]" />
                                  </span>
                                </div>

                                <div className="space-y-2 animate-pulse py-1">
                                  <div className="h-2.5 bg-[#b5e496] rounded-full w-11/12" />
                                  <div className="h-2.5 bg-[#b5e496] rounded-full w-full" />
                                  <div className="h-2.5 bg-[#b5e496] rounded-full w-4/5" />
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#c7eab0]/70 text-[10px] text-[#075E54] font-semibold">
                                  <span>Menyesuaikan pesan dengan konteks terbaru...</span>
                                  <span>Playbook v1.2</span>
                                </div>
                              </div>
                            ) : isFollowUpAlreadySent ? (
                              /* Jika pesan sudah dikirim, sembunyikan kotak draf rekomendasi & tampilkan gelembung chat terkirim secara ringkas */
                              <div className="ml-6 rounded-2xl rounded-tr-xs bg-[#DCF8C6] p-3 shadow-xs border border-[#c7eab0] text-xs text-[#111B21] space-y-1.5">
                                <p className="text-[10px] font-bold text-[#075E54]">
                                  Anda ({user.name.split(' ')[0]}):
                                </p>
                                <p className="leading-relaxed whitespace-pre-line">
                                  {isSentMsgLong && !isSentMsgExpanded
                                    ? `${(lead.last_sales_message || '').slice(0, 165).trim()}...`
                                    : lead.last_sales_message}
                                </p>
                                <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-[#667781]">
                                  {isSentMsgLong ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleMessageExpand(`sent_${lead.id}`)}
                                      className="text-[11px] font-extrabold text-[#075E54] hover:underline cursor-pointer"
                                    >
                                      {isSentMsgExpanded ? 'Tampilkan lebih singkat' : 'Lihat selengkapnya'}
                                    </button>
                                  ) : (
                                    <span />
                                  )}
                                  <span className="inline-flex items-center gap-1">
                                    <span>Terkirim via WhatsApp</span>
                                    <CheckCheck className="size-3.5 text-[#53BDEB]" />
                                  </span>
                                </div>
                              </div>
                            ) : (
                              /* Jika belum dikirim (atau prospek baru saja membalas & AI memberi saran baru), tampilkan rekomendasi AI singkat default + tombol Lihat selengkapnya */
                              <div className="relative ml-3 rounded-2xl rounded-tr-xs bg-[#DCF8C6] p-3 shadow-xs border border-[#c7eab0] space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold text-[#075E54]">
                                    Rekomendasi Balasan AI ({user.name.split(' ')[0]}):
                                  </span>
                                  {isDraftMsgLong && (
                                    <button
                                      type="button"
                                      onClick={() => toggleMessageExpand(`draft_${lead.id}`)}
                                      className="text-[11px] font-extrabold text-[#075E54] hover:underline cursor-pointer"
                                    >
                                      {isDraftMsgExpanded ? 'Tampilkan lebih singkat' : 'Lihat selengkapnya & Edit'}
                                    </button>
                                  )}
                                </div>

                                {!isDraftMsgLong || isDraftMsgExpanded ? (
                                  <textarea
                                    rows={isDraftMsgExpanded ? 7 : 3}
                                    value={draftMsg}
                                    aria-label="Edit draf pesan WhatsApp"
                                    onChange={(e) =>
                                      setCustomDrafts((prev) => ({
                                        ...prev,
                                        [lead.id]: e.target.value,
                                      }))
                                    }
                                    className="w-full bg-transparent text-xs text-[#111B21] leading-relaxed focus:outline-none resize-y"
                                  />
                                ) : (
                                  <div
                                    onClick={() => toggleMessageExpand(`draft_${lead.id}`)}
                                    className="text-xs text-[#111B21] leading-relaxed whitespace-pre-line cursor-pointer"
                                    title="Klik untuk melihat selengkapnya dan mengedit pesan"
                                  >
                                    {`${draftMsg.slice(0, 165).trim()}...`}
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#c7eab0]/70 text-[10px] text-[#667781]">
                                  <span>Playbook v1.2</span>
                                  <span className="inline-flex items-center gap-1">
                                    <span>Siap dikirim oleh {user.name.split(' ')[0]}</span>
                                    <CheckCheck className="size-3.5 text-[#53BDEB]" />
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bottom Composer Bar WhatsApp */}
                          <div className="p-2.5 bg-[#F0F2F5] border-t border-black/10 flex flex-col gap-1.5">
                            {isAiWorking ? (
                              <div className="min-h-[44px] px-4 rounded-full bg-[#128C7E]/70 text-white text-xs font-extrabold flex items-center justify-center gap-2 animate-pulse">
                                <Sparkles className="size-4 animate-spin shrink-0" />
                                <span>AI Sedang Menyusun Rekomendasi Balasan...</span>
                              </div>
                            ) : isFollowUpAlreadySent ? (
                              <div className="min-h-[40px] px-3.5 py-2 rounded-full bg-white border border-black/10 text-[11px] font-bold text-[#075E54] flex items-center justify-center gap-2 text-center">
                                <CheckCheck className="size-4 text-[#53BDEB] shrink-0" />
                                <span>
                                  Pesan Terkirim · Rekomendasi baru akan muncul otomatis saat {lead.full_name} membalas
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={sendingLeadId === lead.id}
                                onClick={() => handleFollowUpWa(lead)}
                                className={`w-full min-h-[44px] px-4 rounded-full text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors disabled:opacity-60 ${
                                  waStatus?.status === 'CONNECTED'
                                    ? 'bg-[#128C7E] hover:bg-[#075E54]'
                                    : 'bg-terracotta hover:bg-terracotta/90'
                                }`}
                              >
                                <Send className="size-4 shrink-0" />
                                <span>
                                  {sendingLeadId === lead.id
                                    ? 'Mengirim Pesan WhatsApp Otomatis...'
                                    : waStatus?.status === 'CONNECTED'
                                    ? `Follow Up · Kirim Otomatis via WA (${waStatus.phoneNumber})`
                                    : 'Follow Up · Hubungkan WA Dulu untuk Kirim Otomatis'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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
                  placeholder="Contoh: Ibu Sari (RSUD Ir. Soekarno)"
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
