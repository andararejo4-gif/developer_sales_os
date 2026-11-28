import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

export type R2CrmFieldModuleKey =
  | 'F37_ACQUISITION_PLAN'
  | 'F44_DEDUP_MERGE'
  | 'F45_BANT_QUALIFICATION'
  | 'F46_ROUND_ROBIN_RULE'
  | 'F63_FIELD_EVIDENCE'
  | 'F65_SE_CERTIFICATION'
  | 'F71_BOOKING_HOLD';

interface R2CrmFieldPanelProps {
  selectedModule: R2CrmFieldModuleKey;
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

export const R2CrmFieldPanel: React.FC<R2CrmFieldPanelProps> = ({
  selectedModule,
  projectId,
  items,
  onReload,
  onToast,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [f37Stock, setF37Stock] = useState('12');
  const [f37Spend, setF37Spend] = useState('15000000');
  const [f44Phone1, setF44Phone1] = useState('08123456789');
  const [f44Phone2, setF44Phone2] = useState('+628123456789');
  const [f45LeadId, setF45LeadId] = useState('LEAD-001');
  const [f45Budget, setF45Budget] = useState('Siap DP 20% KPR');
  const [f46LeadId, setF46LeadId] = useState('LEAD-001');
  const [f46SeEmail, setF46SeEmail] = useState('raka@andara.id');
  const [f63EventId, setF63EventId] = useState('EVT-OFFLINE-01');
  const [f63Loc, setF63Loc] = useState('The Park Solo Baru');
  const [f65SeEmail, setF65SeEmail] = useState('raka@andara.id');
  const [f65Score, setF65Score] = useState('90');
  const [f71Unit, setF71Unit] = useState('A-01');
  const [f71WebhookId, setF71WebhookId] = useState('WH-BOOK-001');
  const [f71GatewayOk, setF71GatewayOk] = useState(true);

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
        {selectedModule === 'F37_ACQUISITION_PLAN' && 'F37 Acquisition Plan & Budget Simulator · 200 AIC · Menyertakan skenario nol tambahan penjualan'}
        {selectedModule === 'F44_DEDUP_MERGE' && 'F44 Deduplication & Identity Merge · 40 AIC · Reversible & opportunity terpisah'}
        {selectedModule === 'F45_BANT_QUALIFICATION' && 'F45 BANT & Fit Qualification · 2 AIC · Bukti/unknown, tanpa atribut sensitif'}
        {selectedModule === 'F46_ROUND_ROBIN_RULE' && 'F46 Ownership, Round-Robin & SLA · 20 AIC · Cek shift, libur, kapasitas & histori utuh'}
        {selectedModule === 'F63_FIELD_EVIDENCE' && 'F63 Check-in & Field Evidence · 40 AIC / 20 check-in · Terpisah dari absensi, meter ringkasan'}
        {selectedModule === 'F65_SE_CERTIFICATION' && 'F65 Role-play & Product Certification · 50 AIC · <=10 menit teks, keputusan HR oleh manusia'}
        {selectedModule === 'F71_BOOKING_HOLD' && 'F71 Booking Hold & Confirmation · 30 AIC · Screenshot saja ditolak, webhook idempoten'}
      </div>

      {errorMsg && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {selectedModule === 'F37_ACQUISITION_PLAN' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r2/f37/acquisition-plan', { projectId, availableStock: Number(f37Stock), channels: [{ channel: 'Meta Ads', spendIdr: Number(f37Spend), capacityLeads: 80, cplEstimateIdr: 150000 }] }, 'F37 Rencana Akuisisi dibuat'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input type="number" value={f37Stock} onChange={(e) => setF37Stock(e.target.value)} placeholder="Stok unit tersedia" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={f37Spend} onChange={(e) => setF37Spend(e.target.value)} placeholder="Budget 30 hari (IDR)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Simulasi 30 Hari (200 AIC)</button>
        </form>
      )}

      {selectedModule === 'F44_DEDUP_MERGE' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r2/f44/dedup-merge', { projectId, records: [{ id: 'C1', name: 'Budi', phone: f44Phone1, opportunityId: 'OPP-1' }, { id: 'C2', name: 'Budi', phone: f44Phone2, opportunityId: 'OPP-2' }] }, 'F44 Dedup & Merge selesai'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f44Phone1} onChange={(e) => setF44Phone1(e.target.value)} placeholder="Nomor 1" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={f44Phone2} onChange={(e) => setF44Phone2(e.target.value)} placeholder="Nomor 2" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Normalisasi & Merge (40 AIC)</button>
        </form>
      )}

      {selectedModule === 'F45_BANT_QUALIFICATION' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r2/f45/bant', { projectId, leadId: f45LeadId, budget: { answer: f45Budget, evidence: 'Chat WA' }, authority: { answer: 'Pemutus utama', evidence: 'Chat WA' }, need: { answer: '3 kamar', evidence: 'Form' }, timeline: { answer: '1-3 bulan', evidence: 'Survey' } }, 'F45 BANT tersimpan'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f45LeadId} onChange={(e) => setF45LeadId(e.target.value)} placeholder="Lead ID" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={f45Budget} onChange={(e) => setF45Budget(e.target.value)} placeholder="Bukti Budget" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Nilai BANT (2 AIC)</button>
        </form>
      )}

      {selectedModule === 'F46_ROUND_ROBIN_RULE' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r2/f46/round-robin', { projectId, leadId: f46LeadId, previousOwners: [], candidates: [{ email: f46SeEmail, onShift: true, onLeave: false, activeLeads: 3, maxCapacity: 20 }], slaTimeoutMinutes: 30 }, 'F46 Round-Robin tersimpan'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f46LeadId} onChange={(e) => setF46LeadId(e.target.value)} placeholder="Lead ID" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={f46SeEmail} onChange={(e) => setF46SeEmail(e.target.value)} placeholder="Email SE on-shift" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Assign Round-Robin (20 AIC)</button>
        </form>
      )}

      {selectedModule === 'F63_FIELD_EVIDENCE' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r2/f63/checkin-summary', { projectId, events: [{ offlineEventId: f63EventId, seEmail: 'raka@andara.id', locationLabel: f63Loc, hasEvidence: true, recordKind: 'FIELD_ACTIVITY' }] }, 'F63 Ringkasan Check-in tersimpan'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f63EventId} onChange={(e) => setF63EventId(e.target.value)} placeholder="Offline Event ID unik" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={f63Loc} onChange={(e) => setF63Loc(e.target.value)} placeholder="Lokasi check-in aktivitas" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Ringkas Check-in (40 AIC)</button>
        </form>
      )}

      {selectedModule === 'F65_SE_CERTIFICATION' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r2/f65/roleplay-cert', { projectId, seEmail: f65SeEmail, durationMinutes: 8, factAccuracyScore: Number(f65Score), ethicsCompliance: true, newPriceVersionDetected: false }, 'F65 Sertifikasi Role-play tersimpan'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f65SeEmail} onChange={(e) => setF65SeEmail(e.target.value)} placeholder="Email SE" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={f65Score} onChange={(e) => setF65Score(e.target.value)} placeholder="Skor Fakta (0-100)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Nilai Role-play (50 AIC)</button>
        </form>
      )}

      {selectedModule === 'F71_BOOKING_HOLD' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r2/f71/booking-hold', { projectId, unitCode: f71Unit, holdFormSigned: true, termsAccepted: true, paymentVerifiedByGateway: f71GatewayOk, screenshotOnly: !f71GatewayOk, webhookEventId: f71WebhookId }, 'F71 Booking Hold terkonfirmasi'); }} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f71Unit} onChange={(e) => setF71Unit(e.target.value)} placeholder="Kode Unit" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={f71WebhookId} onChange={(e) => setF71WebhookId(e.target.value)} placeholder="Webhook Event ID" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <label className="flex items-center gap-1.5 px-2 cursor-pointer"><input type="checkbox" checked={f71GatewayOk} onChange={(e) => setF71GatewayOk(e.target.checked)} /> Dana Verified Gateway</label>
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Konfirmasi Hold (30 AIC)</button>
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
