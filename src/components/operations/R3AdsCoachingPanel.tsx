import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

export type R3AdsModuleKey =
  | 'F38_AD_LAUNCHER'
  | 'F39_BID_OPTIMIZER'
  | 'F40_SEARCH_DEMAND'
  | 'F41_RETARGETING_SUPPRESSION'
  | 'F53_QA_COACHING';

interface R3AdsCoachingPanelProps {
  selectedModule: R3AdsModuleKey;
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

export const R3AdsCoachingPanel: React.FC<R3AdsCoachingPanelProps> = ({
  selectedModule,
  projectId,
  items,
  onReload,
  onToast,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [f38Name, setF38Name] = useState('Kampanye Resmi The Park Q4');
  const [f38Spend, setF38Spend] = useState('250000');
  const [f39Delta, setF39Delta] = useState('15');
  const [f40Cluster, setF40Cluster] = useState('Rumah Modern Solo Baru');
  const [f40Url, setF40Url] = useState('https://developerproperti.giivepro.com/the-park');
  const [f41Audience, setF41Audience] = useState('Warm Visitors 30D');
  const [f53Se, setF53Se] = useState('raka@andara.id');
  const [f53Score, setF53Score] = useState('86');

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
        {selectedModule === 'F38_AD_LAUNCHER' && 'F38 Official Ad Campaign Launcher · 200 AIC · Akun resmi, budget approved & cap server-side'}
        {selectedModule === 'F39_BID_OPTIMIZER' && 'F39 Bid & Pacing Optimizer · 30 AIC · Berbasis CPQL/visit/kapasitas & hold di luar koridor'}
        {selectedModule === 'F40_SEARCH_DEMAND' && 'F40 Search Demand & Intent · 150 AIC · Keyword, negative keyword, LP, pixel & housing policy'}
        {selectedModule === 'F41_RETARGETING_SUPPRESSION' && 'F41 Retargeting & Suppression · 80 AIC · Opt-out & closing dikeluarkan sebelum refresh'}
        {selectedModule === 'F53_QA_COACHING' && 'F53 Quality Scoring & Coaching · 100 AIC · Transkrip termasking + adjudikasi manusia'}
      </div>

      {errorMsg && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {selectedModule === 'F38_AD_LAUNCHER' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f38/ad-launch', { projectId, campaignName: f38Name, officialAccountVerified: true, budgetApproved: true, dailySpendIdr: Number(f38Spend), serverCapDailyIdr: 500000, tokenActive: true, adSetsCount: 3 }, 'F38 Kampanye diluncurkan'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f38Name} onChange={(e) => setF38Name(e.target.value)} placeholder="Nama kampanye resmi" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={f38Spend} onChange={(e) => setF38Spend(e.target.value)} placeholder="Spend harian (IDR)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Luncurkan Resmi (200 AIC)</button>
        </form>
      )}

      {selectedModule === 'F39_BID_OPTIMIZER' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f39/bid-optimizer', { projectId, accountId: 'META-OFFICIAL-01', cpqlIdr: 125000, siteVisitCount: 12, seCapacityRemaining: 6, proposedDeltaPct: Number(f39Delta) }, 'F39 Evaluasi Pacing selesai'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input type="number" value={f39Delta} onChange={(e) => setF39Delta(e.target.value)} placeholder="Perubahan bid/budget (%)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Evaluasi Pacing (30 AIC)</button>
        </form>
      )}

      {selectedModule === 'F40_SEARCH_DEMAND' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f40/search-demand', { projectId, clusterName: f40Cluster, keywords: ['rumah solo baru', 'townhouse the park'], negativeKeywords: ['kost', 'kontrakan'], landingPageUrl: f40Url, trackingPixelId: 'GTM-ANDARA01', housingPolicyCompliant: true }, 'F40 Search Cluster tersimpan'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f40Cluster} onChange={(e) => setF40Cluster(e.target.value)} placeholder="Nama cluster keyword" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={f40Url} onChange={(e) => setF40Url(e.target.value)} placeholder="URL Landing Page" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Sinkronkan Search (150 AIC)</button>
        </form>
      )}

      {selectedModule === 'F41_RETARGETING_SUPPRESSION' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f41/retargeting-suppression', { projectId, audienceName: f41Audience, authorizedAudienceOnly: true, leads: [{ leadId: 'L1', optedOut: false, isClosedWon: false, hasMarketingConsent: true }, { leadId: 'L2', optedOut: true, isClosedWon: false, hasMarketingConsent: true }] }, 'F41 Suppression & Refresh selesai'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f41Audience} onChange={(e) => setF41Audience(e.target.value)} placeholder="Nama Audience" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Refresh + Suppression (80 AIC)</button>
        </form>
      )}

      {selectedModule === 'F53_QA_COACHING' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f53/qa-coaching', { projectId, seEmail: f53Se, sampleTranscripts: ['Customer 081234567890 menanyakan jadwal survey'], aiScore: Number(f53Score), coachingNotes: 'Follow-up cepat & sopan.' }, 'F53 Audit QA Coaching tersimpan'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f53Se} onChange={(e) => setF53Se(e.target.value)} placeholder="Email SE" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={f53Score} onChange={(e) => setF53Score(e.target.value)} placeholder="Skor QA (0-100)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Simpan Audit QA (100 AIC)</button>
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
