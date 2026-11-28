import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

export type R4AutomationModuleKey =
  | 'F30_BULK_CREATIVE'
  | 'F36_MULTI_WEB'
  | 'F42_PORTFOLIO_BUDGET'
  | 'F54_VOICE_QUALIFIER'
  | 'F60_LIFECYCLE_REACTIVATION';

interface R4AutomationPanelProps {
  selectedModule: R4AutomationModuleKey;
  projectId: string;
  items: any[];
  onReload: () => Promise<void> | void;
  onToast: (msg: string) => void;
}

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

export const R4AutomationPanel: React.FC<R4AutomationPanelProps> = ({
  selectedModule,
  projectId,
  items,
  onReload,
  onToast,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [f30Count, setF30Count] = useState('5');
  const [f36Domain, setF36Domain] = useState('thepark.andara.id');
  const [f42Budget, setF42Budget] = useState('25000000');
  const [f54Lead, setF54Lead] = useState('LEAD-DIAMOND-01');
  const [f60Cohort, setF60Cohort] = useState('Reaktivasi Q4 90D');

  const postAndReload = async (url: string, body: Record<string, any>, label: string) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) setErrorMsg(json.error || 'Gagal memproses permintaan.');
      else {
        onToast(`${label} (${json.aicCharged ?? 0} AIC)`);
        await onReload();
      }
    } catch {
      setErrorMsg('Koneksi gagal saat menghubungi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/workspace-items?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      onToast('Item dihapus.');
      await onReload();
    }
  };

  return (
    <div className="space-y-3">
      <div className="px-3 py-2 rounded-lg bg-white border border-warmborder text-[11px] font-semibold text-espresso flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-terracotta" />
        {selectedModule === 'F30_BULK_CREATIVE' && 'F30 Bulk Personalized Creative API · 500 AIC/100 aset · Bebas PII pembeli & lacak gagal parsial'}
        {selectedModule === 'F36_MULTI_WEB' && 'F36 Multi-Project Web API · 300 AIC · Isolasi domain, staging & rollback per proyek/tenant'}
        {selectedModule === 'F42_PORTFOLIO_BUDGET' && 'F42 Portfolio Budget Allocation · 300 AIC · Menunggu approver manusia, tidak pindah dana otomatis'}
        {selectedModule === 'F54_VOICE_QUALIFIER' && 'F54 Opt-in AI Voice Qualifier · 50 AIC/mnt · Khusus Diamond, opt-in, quiet hours & telko terpisah'}
        {selectedModule === 'F60_LIFECYCLE_REACTIVATION' && 'F60 Lifecycle Reactivation · 150 AIC · Holdout, stop rule & eksklusi silent/opt-out'}
      </div>

      {errorMsg && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {selectedModule === 'F30_BULK_CREATIVE' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const n = Math.min(Math.max(1, Number(f30Count) || 1), 100);
          const batchItems = Array.from({ length: n }, (_, i) => ({ itemId: `ASSET-${i + 1}`, templateCode: 'T-Q4', hasBuyerPii: false }));
          postAndReload('/api/r4/f30/bulk-creative', { projectId, concurrencyLimit: 5, items: batchItems }, 'F30 Batch Creative diproses');
        }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input type="number" value={f30Count} onChange={(e) => setF30Count(e.target.value)} placeholder="Jumlah aset (1-100)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Jalankan Batch (500 AIC)</button>
        </form>
      )}

      {selectedModule === 'F36_MULTI_WEB' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r4/f36/multi-web', { projectId, sites: [{ projectId, domain: f36Domain, simulateFail: false }] }, 'F36 Multi-Web Deploy diproses'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f36Domain} onChange={(e) => setF36Domain(e.target.value)} placeholder="Domain situs proyek" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Deploy Terisolasi (300 AIC)</button>
        </form>
      )}

      {selectedModule === 'F42_PORTFOLIO_BUDGET' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r4/f42/portfolio-budget', { projectId, hasCrossProjectPermission: true, projects: [{ projectId, availableStock: 12, marginPct: 24, currentBudgetIdr: 20000000, proposedBudgetIdr: Number(f42Budget) }] }, 'F42 Simulasi Portofolio dibuat'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input type="number" value={f42Budget} onChange={(e) => setF42Budget(e.target.value)} placeholder="Usulan budget (IDR)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Simulasi Portofolio (300 AIC)</button>
        </form>
      )}

      {selectedModule === 'F54_VOICE_QUALIFIER' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r4/f54/voice-qualifier', { projectId, planCode: 'diamond', leadId: f54Lead, voiceOptIn: true, aiIdentityDisclosed: true, withinQuietHoursAllowed: true, recordingConsent: true, durationMinutes: 1 }, 'F54 AI Voice Qualifier dicatat'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f54Lead} onChange={(e) => setF54Lead(e.target.value)} placeholder="Lead ID (Opt-in Diamond)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Validasi Voice Call (50 AIC)</button>
        </form>
      )}

      {selectedModule === 'F60_LIFECYCLE_REACTIVATION' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r4/f60/lifecycle-reactivation', { projectId, cohortName: f60Cohort, holdoutPct: 10, stopRule: 'Stop jika opt-out > 3%', leads: [{ leadId: 'L1', hasConsent: true, optedOut: false, isSilentLongTerm: false, withinRetentionWindow: true }] }, 'F60 Cohort Reaktivasi dibuat'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f60Cohort} onChange={(e) => setF60Cohort(e.target.value)} placeholder="Nama Cohort Reaktivasi" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Buat Eksperimen Cohort (150 AIC)</button>
        </form>
      )}

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-warmmuted italic py-2">Belum ada data {selectedModule}.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="bg-white border border-warmborder rounded-lg p-2.5 text-xs flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-espresso">{it.title}</span>
                <span className="ml-2 px-1.5 py-0.5 rounded bg-sandstone text-[10px] font-bold">{it.status}</span>
                {it.payload?.aicCharged ? (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px]">{it.payload.aicCharged} AIC</span>
                ) : null}
              </div>
              <button type="button" onClick={() => handleDelete(it.id)} className="text-warmmuted hover:text-red-600 p-1 cursor-pointer">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
