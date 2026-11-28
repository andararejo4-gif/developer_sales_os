import React, { useCallback, useEffect, useState } from 'react';
import { Layers, Plus, Trash2, CheckCircle2, Calendar, Briefcase, Shield } from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';
import { M02StrategyPanel } from './M02StrategyPanel';
import { R2ContentSalesKitPanel, type R2ContentModuleKey } from './R2ContentSalesKitPanel';
import { R2CrmFieldPanel, type R2CrmFieldModuleKey } from './R2CrmFieldPanel';
import { R3AdsCoachingPanel, type R3AdsModuleKey } from './R3AdsCoachingPanel';
import { R3CreativeOpsPanel, type R3CreativeOpsModuleKey } from './R3CreativeOpsPanel';
import { R4AutomationPanel, type R4AutomationModuleKey } from './R4AutomationPanel';
import { Final15FeaturesPanel } from './Final15FeaturesPanel';
import { FINAL_15_META, type Final15FeatureId } from '../../lib/operations/final-15-features-engine';

interface CoupledModulesPanelProps {
  role: string;
  projectId: string;
}

type TabKey = 'RISET_MATERI' | 'QUOTE_DISKON' | 'IKLAN_QA' | 'R4_OTOMASI' | 'FINANCE_ENTERPRISE' | 'HOLD_LEGAL' | 'COBROKE_DISPUTE' | 'EVENT_B2B' | 'SERTIFIKASI_AUDIT';

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

const MODULE_OPTIONS: Record<TabKey, Array<{ key: string; label: string }>> = {
  RISET_MATERI: [
    { key: 'F10_COMPETITOR_WATCH', label: 'F10 Kompetitor Watch' },
    { key: 'F08_STP_POSITIONING', label: 'F08 STP & Positioning' },
    { key: 'F09_SWOT_ACTION', label: 'F09 SWOT & Action Plan' },
    { key: 'F16_OBJECTION_KIT', label: 'F16 Objection Kit' },
    { key: 'F17_UNIT_MATCH', label: 'F17 Unit Match' },
    { key: 'F22_CONTENT_APPROVAL', label: 'F22 Approval Konten' },
    { key: 'F23_CONTENT_ATTRIBUTION', label: 'F23 Atribusi Konten' },
    { key: 'F24_ASSET_RIGHTS', label: 'F24 Masa Berlaku Aset' },
    { key: 'F26_VIDEO_TEMPLATE', label: 'F26 Video Template' },
    { key: 'F28_VOICEOVER', label: 'F28 Voiceover' },
    { key: 'F29_BRAND_QA', label: 'F29 Brand QA' },
    { key: 'F34_LOCAL_SEO', label: 'F34 Local SEO' },
    { key: 'F35_CRO_EXPERIMENT', label: 'F35 CRO Experiment' },
  ],
  QUOTE_DISKON: [
    { key: 'F37_ACQUISITION_PLAN', label: 'F37 Akuisisi & Budget' },
    { key: 'F44_DEDUP_MERGE', label: 'F44 Dedup & Merge' },
    { key: 'F45_BANT_QUALIFICATION', label: 'F45 BANT Lead' },
    { key: 'F46_ROUND_ROBIN_RULE', label: 'F46 Aturan Round-Robin' },
    { key: 'F70_DISCOUNT_APPROVAL', label: 'F70 Diskon & Margin' },
  ],
  IKLAN_QA: [
    { key: 'F38_AD_LAUNCHER', label: 'F38 Ad Launcher' },
    { key: 'F39_BID_OPTIMIZER', label: 'F39 Bid & Pacing' },
    { key: 'F40_SEARCH_DEMAND', label: 'F40 Search Demand' },
    { key: 'F41_RETARGETING_SUPPRESSION', label: 'F41 Retargeting' },
    { key: 'F53_QA_COACHING', label: 'F53 QA Coaching' },
  ],
  R4_OTOMASI: [
    { key: 'F30_BULK_CREATIVE', label: 'F30 Bulk Creative' },
    { key: 'F36_MULTI_WEB', label: 'F36 Multi-Web' },
    { key: 'F42_PORTFOLIO_BUDGET', label: 'F42 Portofolio Budget' },
    { key: 'F54_VOICE_QUALIFIER', label: 'F54 Voice Qualifier' },
    { key: 'F60_LIFECYCLE_REACTIVATION', label: 'F60 Reaktivasi' },
  ],
  FINANCE_ENTERPRISE: [
    { key: 'F72_PORTFOLIO_INVENTORY', label: 'F72 Inventory' },
    { key: 'F77_PAYMENT_RECON', label: 'F77 Payment Recon' },
    { key: 'F78_CLOSING_RESCUE', label: 'F78 Closing Rescue' },
    { key: 'F84_PARTNER_PERF', label: 'F84 Partner Perf' },
    { key: 'F87_INCREMENTALITY', label: 'F87 Incrementality' },
    { key: 'F88_REVENUE_FORECAST', label: 'F88 Forecast' },
    { key: 'F89_BAST_DLP_REFERRAL', label: 'F89 BAST/DLP' },
    { key: 'F94_ERP_CONNECTORS', label: 'F94 ERP Sync' },
    { key: 'F95_AGENT_EVAL', label: 'F95 Agent Eval' },
    { key: 'F96_ENTERPRISE_SSO', label: 'F96 SSO/BYOK' },
  ],
  HOLD_LEGAL: [
    { key: 'F71_BOOKING_HOLD', label: 'F71 Booking Hold Unit' },
    { key: 'F73_KPR_CHECKLIST', label: 'F73 Checklist KPR' },
    { key: 'F76_LEGAL_MILESTONE', label: 'F76 Legal PPJB/AJB/SHM' },
  ],
  COBROKE_DISPUTE: [{ key: 'F81_COMMISSION_DISPUTE', label: 'F81 Sengketa Komisi' }],
  EVENT_B2B: [
    { key: 'F58_REMINDER_RESCHEDULE', label: 'F58 Reminder & No-Show' },
    { key: 'F59_VIRTUAL_TOUR', label: 'F59 Virtual Tour' },
    { key: 'F82_B2B_INSTITUTION', label: 'F82 Target Instansi B2B' },
    { key: 'F83_OPEN_HOUSE_EVENT', label: 'F83 Acara Open House' },
  ],
  SERTIFIKASI_AUDIT: [
    { key: 'F63_FIELD_EVIDENCE', label: 'F63 Check-in Lapangan' },
    { key: 'F65_SE_CERTIFICATION', label: 'F65 Sertifikasi Produk SE' },
  ],
};

export const CoupledModulesPanel: React.FC<CoupledModulesPanelProps> = ({ role, projectId }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('RISET_MATERI');
  const [selectedModule, setSelectedModule] = useState<string>('F10_COMPETITOR_WATCH');
  const [items, setItems] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [refInput, setRefInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Event RSVP state (Rantai 5)
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');

  // Co-Broke form state (Rantai 4)
  const [brokerName, setBrokerName] = useState('');
  const [brokerUnit, setBrokerUnit] = useState('Nagoya A-01');
  const [dealValue, setDealValue] = useState(650000000);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSelectedModule(MODULE_OPTIONS[tab][0].key);
  };

  const loadTabData = useCallback(async () => {
    const headers = getAuthHeaders();
    try {
      const res = await fetch(
        `/api/workspace-items?projectId=${encodeURIComponent(projectId)}&moduleKey=${encodeURIComponent(selectedModule)}`,
        { credentials: 'include', headers }
      );
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.items)) setItems(json.items);
      }
      if (activeTab === 'COBROKE_DISPUTE') {
        const dRes = await fetch(`/api/cobroke/deals?projectId=${encodeURIComponent(projectId)}`, {
          credentials: 'include',
          headers,
        });
        if (dRes.ok) {
          const dJson = await dRes.json();
          if (Array.isArray(dJson.deals)) setDeals(dJson.deals);
        }
      }
      if (activeTab === 'SERTIFIKASI_AUDIT' && ['SUPERADMIN', 'SUPERADMIN_IT', 'DIREKSI', 'ADMIN'].includes(role)) {
        const aRes = await fetch('/api/audit/events?limit=15', { credentials: 'include', headers });
        if (aRes.ok) {
          const aJson = await aRes.json();
          if (Array.isArray(aJson.events)) setAuditEvents(aJson.events);
        }
      }
    } catch {
      /* abaikan error jaringan sementara */
    }
  }, [activeTab, projectId, role, selectedModule]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;
    if (selectedModule === 'F81_COMMISSION_DISPUTE' && refInput.trim()) {
      const res = await fetch('/api/couplings/dispute', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          creatorOrBrokerCode: refInput.trim(),
          reason: noteInput.trim() || titleInput.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        showToast(`Dispute dicatat & ${json.heldLedgerCount} entri ledger ditahan (ON_HOLD).`);
      }
    } else {
      const defaultStatus =
        selectedModule === 'F65_SE_CERTIFICATION'
          ? 'CERTIFIED'
          : selectedModule === 'F22_CONTENT_APPROVAL'
          ? 'APPROVED'
          : 'ACTIVE';
      const res = await fetch('/api/workspace-items', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          moduleKey: selectedModule,
          title: titleInput.trim(),
          status: defaultStatus,
          refId: refInput.trim() || null,
          payload: { note: noteInput.trim() },
        }),
      });
      if (res.ok) showToast('Data tersimpan ke database.');
    }
    setTitleInput('');
    setRefInput('');
    setNoteInput('');
    await loadTabData();
  };

  const handleDeleteItem = async (id: string) => {
    const res = await fetch(`/api/workspace-items?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      showToast('Item dihapus.');
      await loadTabData();
    }
  };

  const handleToggleStatus = async (item: any, nextStatus: string) => {
    const res = await fetch('/api/workspace-items', {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id: item.id, status: nextStatus }),
    });
    if (res.ok) {
      showToast(`Status diperbarui ke ${nextStatus}.`);
      await loadTabData();
    }
  };

  const handleCreateCobroke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerName.trim()) return;
    const res = await fetch('/api/cobroke/deals', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        projectId,
        unitCode: brokerUnit,
        brokerName: brokerName.trim(),
        dealValueIdr: dealValue,
      }),
    });
    if (res.ok) {
      setBrokerName('');
      showToast('Deal Co-Broke tersimpan.');
      await loadTabData();
    }
  };

  const handleQuickEventRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim() || !rsvpPhone.trim()) return;
    const res = await fetch('/api/couplings/event-rsvp', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        projectId,
        eventTitle: items[0]?.title || 'Open House Proyek',
        guestName: rsvpName.trim(),
        guestPhone: rsvpPhone.trim(),
      }),
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      setRsvpName('');
      setRsvpPhone('');
      showToast(`RSVP masuk ke Pipeline & di-assign otomatis ke ${json.assignedSe}.`);
    }
  };

  return (
    <div className="border-t border-warmborder pt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-espresso flex items-center gap-1.5">
          <Layers className="size-4 text-olive" />
          <span>6 Rantai Modul Terhubung (CRUD + Sinkronisasi Lintas Fitur)</span>
        </h4>
        <div className="flex flex-wrap gap-1">
          {[
            { k: 'RISET_MATERI', label: 'Riset & Materi' },
            { k: 'QUOTE_DISKON', label: 'Round-Robin & Quote' },
            { k: 'IKLAN_QA', label: 'Iklan & QA' },
            { k: 'R4_OTOMASI', label: 'R4 Otomasi' },
            { k: 'FINANCE_ENTERPRISE', label: 'Finance & Ent.' },
            { k: 'HOLD_LEGAL', label: 'Hold, KPR & Legal' },
            { k: 'COBROKE_DISPUTE', label: 'Co-Broke & Dispute' },
            { k: 'EVENT_B2B', label: 'Event & B2B' },
            { k: 'SERTIFIKASI_AUDIT', label: 'Sertifikasi SE & Audit' },
          ].map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => handleTabChange(t.k as TabKey)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                activeTab === t.k ? 'bg-espresso text-white' : 'bg-sandstone/70 text-espresso hover:bg-warmborder'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="px-3 py-2 rounded-lg bg-olive/10 border border-olive/30 text-xs font-medium text-olive">
          {toast}
        </div>
      )}

      {/* Selector Sub-Modul & Form Tambah */}
      <div className="bg-sandstone/30 border border-warmborder rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {MODULE_OPTIONS[activeTab].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedModule(m.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer border ${
                selectedModule === m.key
                  ? 'bg-white border-terracotta text-terracotta'
                  : 'bg-transparent border-warmborder text-warmmuted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {['F08_STP_POSITIONING', 'F09_SWOT_ACTION', 'F10_COMPETITOR_WATCH'].includes(selectedModule) ? (
          <M02StrategyPanel
            selectedModule={selectedModule as 'F08_STP_POSITIONING' | 'F09_SWOT_ACTION' | 'F10_COMPETITOR_WATCH'}
            role={role}
            projectId={projectId}
            items={items}
            onReload={loadTabData}
            onToast={showToast}
          />
        ) : ['F16_OBJECTION_KIT', 'F17_UNIT_MATCH', 'F22_CONTENT_APPROVAL', 'F23_CONTENT_ATTRIBUTION', 'F24_ASSET_RIGHTS', 'F26_VIDEO_TEMPLATE'].includes(selectedModule) ? (
          <R2ContentSalesKitPanel
            selectedModule={selectedModule as R2ContentModuleKey}
            projectId={projectId}
            items={items}
            onReload={loadTabData}
            onToast={showToast}
          />
        ) : ['F37_ACQUISITION_PLAN', 'F44_DEDUP_MERGE', 'F45_BANT_QUALIFICATION', 'F46_ROUND_ROBIN_RULE', 'F63_FIELD_EVIDENCE', 'F65_SE_CERTIFICATION', 'F71_BOOKING_HOLD'].includes(selectedModule) ? (
          <R2CrmFieldPanel
            selectedModule={selectedModule as R2CrmFieldModuleKey}
            projectId={projectId}
            items={items}
            onReload={loadTabData}
            onToast={showToast}
          />
        ) : ['F38_AD_LAUNCHER', 'F39_BID_OPTIMIZER', 'F40_SEARCH_DEMAND', 'F41_RETARGETING_SUPPRESSION', 'F53_QA_COACHING'].includes(selectedModule) ? (
          <R3AdsCoachingPanel
            selectedModule={selectedModule as R3AdsModuleKey}
            projectId={projectId}
            items={items}
            onReload={loadTabData}
            onToast={showToast}
          />
        ) : ['F28_VOICEOVER', 'F29_BRAND_QA', 'F34_LOCAL_SEO', 'F35_CRO_EXPERIMENT', 'F58_REMINDER_RESCHEDULE', 'F59_VIRTUAL_TOUR', 'F70_DISCOUNT_APPROVAL'].includes(selectedModule) ? (
          <R3CreativeOpsPanel
            selectedModule={selectedModule as R3CreativeOpsModuleKey}
            projectId={projectId}
            items={items}
            onReload={loadTabData}
            onToast={showToast}
          />
        ) : ['F30_BULK_CREATIVE', 'F36_MULTI_WEB', 'F42_PORTFOLIO_BUDGET', 'F54_VOICE_QUALIFIER', 'F60_LIFECYCLE_REACTIVATION'].includes(selectedModule) ? (
          <R4AutomationPanel
            selectedModule={selectedModule as R4AutomationModuleKey}
            projectId={projectId}
            items={items}
            onReload={loadTabData}
            onToast={showToast}
          />
        ) : (Object.entries(FINAL_15_META).find(([, m]) => m.moduleKey === selectedModule)) ? (
          <Final15FeaturesPanel
            featureId={Object.entries(FINAL_15_META).find(([, m]) => m.moduleKey === selectedModule)![0] as Final15FeatureId}
            projectId={projectId}
            items={items}
            onReload={loadTabData}
            onToast={showToast}
          />
        ) : (
        <>
        <form onSubmit={handleCreateItem} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Judul / Nama item..."
            className="h-8 px-2.5 rounded-lg border border-warmborder bg-white"
            required
          />
          <input
            type="text"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder={
              selectedModule === 'F65_SE_CERTIFICATION'
                ? 'Email SE (misal raka@...)'
                : selectedModule === 'F81_COMMISSION_DISPUTE'
                ? 'Kode Kreator (misal AC-RN27)'
                : 'Kode Unit / Ref (opsional)'
            }
            className="h-8 px-2.5 rounded-lg border border-warmborder bg-white"
          />
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Catatan / detail..."
            className="h-8 px-2.5 rounded-lg border border-warmborder bg-white"
          />
          <button
            type="submit"
            className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="size-3.5" /> Simpan
          </button>
        </form>

        {/* Daftar Item */}
        <div className="space-y-1.5">
          {items.length === 0 ? (
            <p className="text-[11px] text-warmmuted">Belum ada data pada sub-modul ini.</p>
          ) : (
            items.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-warmborder text-xs"
              >
                <div>
                  <span className="font-semibold text-espresso">{item.title}</span>
                  {item.ref_id && <span className="ml-2 font-mono text-[10px] text-warmmuted">[{item.ref_id}]</span>}
                  {item.payload?.note && <span className="ml-2 text-[11px] text-warmmuted">· {item.payload.note}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'NEEDS_REVIEW' || item.status === 'OPEN'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-olive/10 text-olive'
                    }`}
                  >
                    {item.status}
                  </span>
                  {item.status === 'NEEDS_REVIEW' && (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item, 'ACTIVE')}
                      className="px-2 py-0.5 rounded bg-olive text-white text-[10px] font-semibold cursor-pointer"
                    >
                      Set Aktif
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-warmmuted hover:text-rose-600 cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </>
        )}
      </div>

      {/* Sub-panel khusus Rantai 4 (Co-Broke F80) */}
      {activeTab === 'COBROKE_DISPUTE' && (
        <div className="border border-warmborder rounded-xl p-3.5 space-y-2 text-xs">
          <div className="font-bold text-espresso flex items-center gap-1.5">
            <Briefcase className="size-3.5 text-olive" /> Workspace Broker &amp; Co-Broke (F80 · {deals.length} deal)
          </div>
          <form onSubmit={handleCreateCobroke} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={brokerName}
              onChange={(e) => setBrokerName(e.target.value)}
              placeholder="Nama Broker / Kantor Agen"
              className="h-8 px-2.5 rounded-lg border border-warmborder"
              required
            />
            <input
              type="text"
              value={brokerUnit}
              onChange={(e) => setBrokerUnit(e.target.value)}
              placeholder="Kode Unit"
              className="h-8 px-2.5 rounded-lg border border-warmborder"
            />
            <input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(Number(e.target.value) || 650000000)}
              className="h-8 px-2.5 rounded-lg border border-warmborder font-mono"
            />
            <button type="submit" className="h-8 px-3 rounded-lg bg-olive text-white font-semibold cursor-pointer">
              + Catat Deal Co-Broke
            </button>
          </form>
        </div>
      )}

      {/* Sub-panel khusus Rantai 5 (RSVP Event -> Pipeline Round-Robin) */}
      {activeTab === 'EVENT_B2B' && (
        <form onSubmit={handleQuickEventRsvp} className="border border-warmborder rounded-xl p-3.5 space-y-2 text-xs">
          <div className="font-bold text-espresso flex items-center gap-1.5">
            <Calendar className="size-3.5 text-terracotta" /> Check-In / RSVP Open House → Masuk Pipeline &amp; Round-Robin
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={rsvpName}
              onChange={(e) => setRsvpName(e.target.value)}
              placeholder="Nama Tamu / Peserta"
              className="h-8 px-2.5 rounded-lg border border-warmborder"
              required
            />
            <input
              type="text"
              value={rsvpPhone}
              onChange={(e) => setRsvpPhone(e.target.value)}
              placeholder="No. WhatsApp (0812...)"
              className="h-8 px-2.5 rounded-lg border border-warmborder"
              required
            />
            <button type="submit" className="h-8 px-3 rounded-lg bg-terracotta text-white font-semibold cursor-pointer">
              Check-In ke Pipeline SE
            </button>
          </div>
        </form>
      )}

      {/* Sub-panel khusus Rantai 6 (Audit Log F93) */}
      {activeTab === 'SERTIFIKASI_AUDIT' && auditEvents.length > 0 && (
        <div className="border border-warmborder rounded-xl p-3.5 space-y-1.5 text-xs">
          <div className="font-bold text-espresso flex items-center gap-1.5">
            <Shield className="size-3.5 text-olive" /> Jejak Audit Bisnis Terisolasi Tenant ({auditEvents.length})
          </div>
          {auditEvents.slice(0, 4).map((ev, i) => (
            <div key={i} className="text-[11px] text-warmmuted flex items-center justify-between">
              <span className="truncate">
                <CheckCircle2 className="size-3 inline mr-1 text-olive" />
                {ev.action} · {ev.resource_type} ({ev.actor_email})
              </span>
              <span className="font-mono text-[10px] shrink-0">{String(ev.created_at || '').slice(0, 16)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
