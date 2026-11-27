import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Plus, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

interface M02StrategyPanelProps {
  selectedModule: 'F08_STP_POSITIONING' | 'F09_SWOT_ACTION' | 'F10_COMPETITOR_WATCH';
  role: string;
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

export const M02StrategyPanel: React.FC<M02StrategyPanelProps> = ({
  selectedModule,
  role,
  projectId,
  items,
  onReload,
  onToast,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // F08 STP State
  const [stpTitle, setStpTitle] = useState('');
  const [stpSegmentName, setStpSegmentName] = useState('Keluarga Muda Solo Raya');
  const [stpNeed, setStpNeed] = useState('Rumah 2 lantai dekat pusat kota & akses tol');
  const [stpGeo, setStpGeo] = useState('Sukoharjo - Surakarta (radius 10 km)');
  const [stpTargets, setStpTargets] = useState('Profesional & pengusaha muda usia 28-40 th');
  const [stpExclusion, setStpExclusion] = useState('Investor jangka sangat pendek / subsidi (di luar segmen harga)');
  const [stpPositioning, setStpPositioning] = useState('Townhouse modern produktif 5 menit ke The Park Mall dengan cicilan terukur');

  // F09 7P/SWOT/Action State
  const [swotTitle, setSwotTitle] = useState('');
  const [sevenPProduct, setSevenPProduct] = useState('Cluster townhouse 2 lantai LT 72/LB 85 + smart lock');
  const [sevenPPrice, setSevenPPrice] = useState('Mulai Rp890 Juta, DP fleksibel KPR');
  const [sevenPPlace, setSevenPPlace] = useState('Koridor Solo Baru - Sukoharjo');
  const [sevenPPromo, setSevenPPromo] = useState('Open house akhir pekan + free biaya BPHTB');
  const [factsText, setFactsText] = useState('Pricelist aktif Rp890jt-1,2M; jarak 5 menit ke RS Indriati & The Park');
  const [assumptionsText, setAssumptionsText] = useState('Asumsi minat KPR 15 tahun dominan pada segmen gaji gabungan >= Rp20jt');
  const [actionText, setActionText] = useState('Uji landing page & WA concierge promo KPR 30 hari');
  const [actionPic, setActionPic] = useState('Digital Marketing & SM');
  const [actionMetric, setActionMetric] = useState('>= 25 survei lokasi tervalidasi');

  // F10 Competitor Watch State
  const [compTitle, setCompTitle] = useState('Cluster Pembanding Solo Baru');
  const [compUrl, setCompUrl] = useState('https://contoh-listing.id/cluster-solo-baru');
  const [compLt, setCompLt] = useState('84');
  const [compLb, setCompLb] = useState('90');
  const [compPrice, setCompPrice] = useState('950000000');
  const [compPriceType, setCompPriceType] = useState<'ASKING' | 'TRANSACTION'>('ASKING');
  const [compStage, setCompStage] = useState('Indent / Pembangunan 60%');
  const [compDate, setCompDate] = useState(new Date().toISOString().slice(0, 10));
  const [compHttpStatus, setCompHttpStatus] = useState('200');

  const canReviewStp = ['DIREKSI', 'SM', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(role);

  const handleSubmitF08 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/m02/stp', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          title: stpTitle.trim() || `Analisis STP · ${stpSegmentName}`,
          segments: [{ name: stpSegmentName, needProfile: stpNeed, geography: stpGeo, serviceable: true }],
          priorityTargets: stpTargets.split(';').map((s) => s.trim()).filter(Boolean),
          exclusionRationale: stpExclusion.split(';').map((s) => s.trim()).filter(Boolean),
          positioningStatement: stpPositioning,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Gagal menyimpan STP (F08).');
      } else {
        setStpTitle('');
        onToast(`F08 STP tersimpan (${json.aicCharged ?? 120} AIC) · status DRAFT menunggu review manusia`);
        await onReload();
      }
    } catch {
      setErrorMsg('Koneksi gagal saat menyimpan STP (F08).');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewStp = async (id: string, reviewStatus: 'REVIEWED' | 'APPROVED') => {
    setErrorMsg(null);
    const res = await fetch('/api/m02/stp/review', {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, reviewStatus }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMsg(json.error || 'Gagal memperbarui status review STP.');
      return;
    }
    onToast(`STP ditandai ${reviewStatus}.`);
    await onReload();
  };

  const handleSubmitF09 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/m02/swot-action', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          title: swotTitle.trim() || 'Strategi 7P & Eksperimen 30 Hari',
          sevenP: {
            product: sevenPProduct,
            price: sevenPPrice,
            place: sevenPPlace,
            promotion: sevenPPromo,
            people: 'SE tersertifikasi produk & SM pendamping',
            process: 'Survey terukur + booking fee transparan',
            physicalEvidence: 'Rumah contoh & brosur berversi resmi',
          },
          swot: {
            strengths: ['Lokasi prime & spesifikasi bangunan jelas'],
            weaknesses: ['Kapasitas unit terbatas pada tahap awal'],
            opportunities: ['Permintaan hunian keluarga muda di koridor Solo Baru'],
            threats: ['Perang diskon DP rendah kompetitor sekitar'],
          },
          tows: {
            so: ['Fokus iklan ke pekerja & pebisnis lokal radius 10 km'],
            wo: ['Gunakan waiting list transparan per batch'],
            st: ['Tonjolkan bukti legalitas & biaya total bukan sekadar DP murah'],
            wt: ['Audit materi promosi rutin agar klaim tetap akurat'],
          },
          facts: factsText.split(';').map((s) => s.trim()).filter(Boolean),
          assumptions: assumptionsText.split(';').map((s) => s.trim()).filter(Boolean),
          actionPlan: [
            {
              hypothesis: 'Penawaran total biaya transparan menaikkan konversi survei',
              action: actionText,
              pic: actionPic,
              metric: actionMetric,
              period: '30 hari',
              status: 'PLANNED',
            },
          ],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Gagal menyimpan strategi 7P/SWOT (F09).');
      } else {
        setSwotTitle('');
        onToast(`F09 7P/SWOT/Action Plan tersimpan (${json.aicCharged ?? 150} AIC)`);
        await onReload();
      }
    } catch {
      setErrorMsg('Koneksi gagal saat menyimpan F09.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitF10 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/m02/competitor-watch', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          title: `Watch: ${compTitle}`,
          listings: [
            {
              title: compTitle,
              sourceUrl: compUrl,
              ltM2: Number(compLt) || 0,
              lbM2: Number(compLb) || 0,
              priceIdr: Number(compPrice) || 0,
              priceType: compPriceType,
              buildStage: compStage,
              listedAt: compDate,
              httpStatus: Number(compHttpStatus) || 200,
            },
          ],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Gagal menjalankan Competitor Watch (F10).');
      } else {
        const qCount = json.watchResult?.quarantinedListings?.length ?? 0;
        onToast(`F10 tersimpan (${json.aicCharged ?? 150} AIC) · Karantina: ${qCount}`);
        await onReload();
      }
    } catch {
      setErrorMsg('Koneksi gagal saat menyimpan F10.');
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
      onToast('Item M02 dihapus.');
      await onReload();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-warmborder text-[11px]">
        <span className="font-semibold text-espresso flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-terracotta" />
          {selectedModule === 'F08_STP_POSITIONING' && 'F08 STP & Positioning · Spesialis A14/A15 · 120 AIC / analisis (rekomendasi, bukan keputusan otomatis)'}
          {selectedModule === 'F09_SWOT_ACTION' && 'F09 7P, SWOT & Action Plan · Spesialis A12/A15 · 150 AIC / strategi (fakta, asumsi & PIC terpisah)'}
          {selectedModule === 'F10_COMPETITOR_WATCH' && 'F10 Competitor & Listing Watch · Spesialis A11/A13 · 150 AIC / 10 listing (harga minta ≠ transaksi)'}
        </span>
        <span className="text-warmmuted">Project: {projectId}</span>
      </div>

      {errorMsg && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {selectedModule === 'F08_STP_POSITIONING' && (
        <form onSubmit={handleSubmitF08} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={stpTitle} onChange={(e) => setStpTitle(e.target.value)} placeholder="Judul analisis STP (opsional)" className="h-8 px-2.5 rounded-lg border border-warmborder" />
          <input value={stpSegmentName} onChange={(e) => setStpSegmentName(e.target.value)} placeholder="Nama segmen" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={stpNeed} onChange={(e) => setStpNeed(e.target.value)} placeholder="Profil kebutuhan segmen" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={stpGeo} onChange={(e) => setStpGeo(e.target.value)} placeholder="Geografi target" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={stpTargets} onChange={(e) => setStpTargets(e.target.value)} placeholder="Target prioritas (pisahkan ;)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={stpExclusion} onChange={(e) => setStpExclusion(e.target.value)} placeholder="Exclusion rationale (pisahkan ;)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={stpPositioning} onChange={(e) => setStpPositioning(e.target.value)} placeholder="Positioning statement" className="h-8 px-2.5 rounded-lg border border-warmborder md:col-span-2" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer md:col-span-2 disabled:opacity-60">
            <Plus className="size-3.5" /> {submitting ? 'Menyimpan...' : 'Simpan Analisis STP (120 AIC)'}
          </button>
        </form>
      )}

      {selectedModule === 'F09_SWOT_ACTION' && (
        <form onSubmit={handleSubmitF09} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={swotTitle} onChange={(e) => setSwotTitle(e.target.value)} placeholder="Judul strategi 7P/SWOT" className="h-8 px-2.5 rounded-lg border border-warmborder md:col-span-2" />
          <input value={sevenPProduct} onChange={(e) => setSevenPProduct(e.target.value)} placeholder="7P - Product" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={sevenPPrice} onChange={(e) => setSevenPPrice(e.target.value)} placeholder="7P - Price" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={sevenPPlace} onChange={(e) => setSevenPPlace(e.target.value)} placeholder="7P - Place" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={sevenPPromo} onChange={(e) => setSevenPPromo(e.target.value)} placeholder="7P - Promotion" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={factsText} onChange={(e) => setFactsText(e.target.value)} placeholder="Fakta terverifikasi (pisahkan ;)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={assumptionsText} onChange={(e) => setAssumptionsText(e.target.value)} placeholder="Asumsi / interpretasi (pisahkan ;)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={actionText} onChange={(e) => setActionText(e.target.value)} placeholder="Aksi eksperimen 30 hari" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <div className="grid grid-cols-2 gap-2">
            <input value={actionPic} onChange={(e) => setActionPic(e.target.value)} placeholder="PIC" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
            <input value={actionMetric} onChange={(e) => setActionMetric(e.target.value)} placeholder="Ukuran / KPI" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          </div>
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer md:col-span-2 disabled:opacity-60">
            <Plus className="size-3.5" /> {submitting ? 'Menyimpan...' : 'Simpan 7P, SWOT & Action Plan (150 AIC)'}
          </button>
        </form>
      )}

      {selectedModule === 'F10_COMPETITOR_WATCH' && (
        <form onSubmit={handleSubmitF10} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={compTitle} onChange={(e) => setCompTitle(e.target.value)} placeholder="Nama listing kompetitor" className="h-8 px-2.5 rounded-lg border border-warmborder md:col-span-2" required />
          <input value={compUrl} onChange={(e) => setCompUrl(e.target.value)} placeholder="URL sumber (https://...)" className="h-8 px-2.5 rounded-lg border border-warmborder md:col-span-2" required />
          <input type="number" value={compLt} onChange={(e) => setCompLt(e.target.value)} placeholder="LT (m2)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={compLb} onChange={(e) => setCompLb(e.target.value)} placeholder="LB (m2)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={compPrice} onChange={(e) => setCompPrice(e.target.value)} placeholder="Harga (IDR)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <select value={compPriceType} onChange={(e) => setCompPriceType(e.target.value as 'ASKING' | 'TRANSACTION')} className="h-8 px-2.5 rounded-lg border border-warmborder bg-white">
            <option value="ASKING">Harga Minta (ASKING)</option>
            <option value="TRANSACTION">Harga Transaksi</option>
          </select>
          <input value={compStage} onChange={(e) => setCompStage(e.target.value)} placeholder="Tahap bangun" className="h-8 px-2.5 rounded-lg border border-warmborder" />
          <input type="date" value={compDate} onChange={(e) => setCompDate(e.target.value)} className="h-8 px-2.5 rounded-lg border border-warmborder" />
          <input type="number" value={compHttpStatus} onChange={(e) => setCompHttpStatus(e.target.value)} placeholder="HTTP status (200/404)" className="h-8 px-2.5 rounded-lg border border-warmborder" />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60">
            <Plus className="size-3.5" /> {submitting ? 'Memeriksa...' : 'Simpan & Cek Karantina'}
          </button>
        </form>
      )}

      {/* Daftar Item Terstruktur */}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-warmmuted italic py-2">Belum ada data {selectedModule} untuk proyek ini.</p>
        ) : (
          items.map((it) => {
            const p = it.payload || {};
            return (
              <div key={it.id} className="bg-white border border-warmborder rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-espresso flex flex-wrap items-center gap-1.5">
                      <span>{it.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-sandstone text-[10px] font-semibold">{it.status}</span>
                      {p.aicCharged ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px]">{p.aicCharged} AIC</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedModule === 'F08_STP_POSITIONING' && canReviewStp && it.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleReviewStp(it.id, 'APPROVED')}
                        className="px-2 py-0.5 rounded bg-olive/10 text-olive font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="size-3" /> Setujui Review
                      </button>
                    )}
                    <button type="button" onClick={() => handleDelete(it.id)} className="text-warmmuted hover:text-red-600 p-1 cursor-pointer">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {selectedModule === 'F08_STP_POSITIONING' && p.positioningStatement && (
                  <div className="text-[11px] text-warmmuted space-y-0.5">
                    <div><strong className="text-espresso">Positioning:</strong> {p.positioningStatement}</div>
                    {Array.isArray(p.exclusionRationale) && p.exclusionRationale.length > 0 && (
                      <div><strong className="text-espresso">Exclusion:</strong> {p.exclusionRationale.join('; ')}</div>
                    )}
                  </div>
                )}

                {selectedModule === 'F09_SWOT_ACTION' && Array.isArray(p.actionPlan) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded bg-emerald-50/60 border border-emerald-200">
                      <div className="font-bold text-emerald-900">Fakta</div>
                      <div className="text-emerald-800">{(p.facts || []).join('; ')}</div>
                    </div>
                    <div className="p-2 rounded bg-amber-50/60 border border-amber-200">
                      <div className="font-bold text-amber-900">Asumsi</div>
                      <div className="text-amber-800">{(p.assumptions || []).join('; ')}</div>
                    </div>
                    <div className="p-2 rounded bg-sky-50/60 border border-sky-200">
                      <div className="font-bold text-sky-900">Action Plan 30 Hari</div>
                      {p.actionPlan.map((a: any, idx: number) => (
                        <div key={idx} className="text-sky-900">
                          {a.action} · <strong>PIC:</strong> {a.pic} ({a.metric})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedModule === 'F10_COMPETITOR_WATCH' && (
                  <div className="space-y-1 pt-1 text-[11px]">
                    {(p.activeListings || []).map((l: any, idx: number) => (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded bg-emerald-50/50 border border-emerald-200">
                        <span>
                          <strong>{l.title}</strong> · LT {l.ltM2} / LB {l.lbM2} · Rp{Number(l.priceIdr || 0).toLocaleString('id-ID')} ·{' '}
                          <span className="font-semibold text-amber-800">{l.priceClaimLabel}</span> · {l.buildStage} ({l.listedAt})
                        </span>
                        <a href={l.sourceUrl} target="_blank" rel="noreferrer" className="text-terracotta flex items-center gap-0.5 underline">
                          Sumber <ExternalLink className="size-3" />
                        </a>
                      </div>
                    ))}
                    {(p.quarantinedListings || []).map((l: any, idx: number) => (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded bg-red-50 border border-red-200 text-red-800">
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="size-3.5" />
                          <strong>KARANTINA [{l.quarantineReason}]:</strong> {l.title} · LT {l.ltM2}/LB {l.lbM2}
                        </span>
                        <span>{l.sourceUrl}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
