import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';
import { FINAL_15_META, type Final15FeatureId } from '../../lib/operations/final-15-features-engine';

interface Final15FeaturesPanelProps {
  featureId: Final15FeatureId;
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

const DEFAULT_INPUTS: Record<Final15FeatureId, Record<string, any>> = {
  F72: { sellableStock: 12, proposedUnits: 6 },
  F73: { employmentType: 'KARYAWAN' },
  F76: { counselApprovedTemplate: true, milestone: 'PPJB' },
  F77: { webhookSignatureVerified: true, whitelistedAccountApprovers: 2, paymentRef: 'PAY-2026-01' },
  F78: { blockerType: 'SP3K_EXPIRE', evidenceRef: 'DOC-SP3K-01' },
  F81: { partnerCode: 'AC-RN27', version: 1, evidenceRef: 'CONTRACT-V1' },
  F82: { institutionName: 'RS Indriati Solo Baru', slotPermitVerified: true, harvestsEmployeeOrPatientDb: false },
  F83: { eventName: 'Open House The Park Weekend' },
  F84: { partnerCode: 'KOL-SOLO-01', netSalesIdr: 850000000, costIdr: 15000000, attributionWindowDays: 30 },
  F87: { periodLabel: 'Q4 2026', holdoutLiftPct: 9.2 },
  F88: { historyMonths: 6, sellableStock: 12 },
  F89: { unitCode: 'A-01', statusConfirmedByCustomerOrAdmin: true, fakeTestimonial: false },
  F94: { erpName: 'Accurate Online', bypassClosedApi: false, tokenRevoked: false },
  F95: { promptVersion: 'v1.4', testSetPassed: true, riskyChange: false, rollbackTarget: 'v1.3' },
  F96: { idpProvider: 'Microsoft Entra ID', contractualDueDiligenceSigned: true, region: 'ap-southeast-3' },
};

export const Final15FeaturesPanel: React.FC<Final15FeaturesPanelProps> = ({
  featureId,
  projectId,
  items,
  onReload,
  onToast,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noteVal, setNoteVal] = useState('');
  const meta = FINAL_15_META[featureId];

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/features/execute', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          featureId,
          projectId,
          input: { ...DEFAULT_INPUTS[featureId], ...(noteVal.trim() ? { customNote: noteVal.trim() } : {}) },
        }),
      });
      const json = await res.json();
      if (!res.ok) setErrorMsg(json.error || `Gagal menjalankan ${featureId}.`);
      else {
        setNoteVal('');
        onToast(`${meta.label} tersimpan (${json.aicCharged ?? meta.aic} AIC)`);
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
        <span>{meta.label} · Tarif {meta.aic} AIC · Guardrail kontrak & audit aktif</span>
      </div>

      {errorMsg && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleRun} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
        <input value={noteVal} onChange={(e) => setNoteVal(e.target.value)} placeholder={`Catatan / parameter ${featureId} (opsional)`} className="h-8 px-2.5 rounded-lg border border-warmborder md:col-span-2" />
        <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer">
          <CheckCircle2 className="size-3.5" /> Jalankan {featureId} ({meta.aic} AIC)
        </button>
      </form>

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-warmmuted italic py-2">Belum ada data {meta.moduleKey}.</p>
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
