import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

export type R3CreativeOpsModuleKey =
  | 'F28_VOICEOVER'
  | 'F29_BRAND_QA'
  | 'F34_LOCAL_SEO'
  | 'F35_CRO_EXPERIMENT'
  | 'F58_REMINDER_RESCHEDULE'
  | 'F59_VIRTUAL_TOUR'
  | 'F70_DISCOUNT_APPROVAL';

interface R3CreativeOpsPanelProps {
  selectedModule: R3CreativeOpsModuleKey;
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

export const R3CreativeOpsPanel: React.FC<R3CreativeOpsPanelProps> = ({
  selectedModule,
  projectId,
  items,
  onReload,
  onToast,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [f28Title, setF28Title] = useState('VO Narasi Show Unit ID');
  const [f29Asset, setF29Asset] = useState('Banner Promo Q4');
  const [f34Profile, setF34Profile] = useState('GBP The Park Sukoharjo');
  const [f35Exp, setF35Exp] = useState('Uji Form Simulasi KPR');
  const [f58Apt, setF58Apt] = useState('APT-001');
  const [f59Host, setF59Host] = useState('Raka SE');
  const [f70Quote, setF70Quote] = useState('Q-001');
  const [f70Price, setF70Price] = useState('960000000');

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
        {selectedModule === 'F28_VOICEOVER' && 'F28 Voiceover & Localization · 50 AIC/mnt · Persetujuan suara & harga terjaga'}
        {selectedModule === 'F29_BRAND_QA' && 'F29 Brand Kit & Creative QA · 100 AIC · Penolakan membuka revisi, bukan auto-publish'}
        {selectedModule === 'F34_LOCAL_SEO' && 'F34 Local SEO & Profile · 200 AIC · Verifikasi kepemilikan, tanpa lokasi/ulasan palsu'}
        {selectedModule === 'F35_CRO_EXPERIMENT' && 'F35 CRO & Accessibility · 150 AIC · 2 varian, stop rule & keyboard/form error teruji'}
        {selectedModule === 'F58_REMINDER_RESCHEDULE' && 'F58 Reminder & No-Show · 20 AIC · Timezone, suppression & anti-banjir saat no-show'}
        {selectedModule === 'F59_VIRTUAL_TOUR' && 'F59 Virtual Tour Coordinator · 50 AIC · Host/lokasi nyata, rekaman tidak diklaim live'}
        {selectedModule === 'F70_DISCOUNT_APPROVAL' && 'F70 Discount & Margin Approval · 20 AIC · Floor price & approval bertingkat server-side'}
      </div>

      {errorMsg && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {selectedModule === 'F28_VOICEOVER' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f28/voiceover', { projectId, title: f28Title, language: 'id-ID', durationMinutes: 1, voiceConsentVerified: true, isUnauthorizedVoiceClone: false, priceTermsVerified: true }, 'F28 Voiceover tersimpan'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f28Title} onChange={(e) => setF28Title(e.target.value)} placeholder="Judul voiceover" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Simpan Voiceover (50 AIC)</button>
        </form>
      )}

      {selectedModule === 'F29_BRAND_QA' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f29/brand-qa', { projectId, assetName: f29Asset, logoOk: true, colorContrastOk: true, safeAreaOk: true, spellingOk: true, priceMatchOk: true }, 'F29 Brand QA selesai'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f29Asset} onChange={(e) => setF29Asset(e.target.value)} placeholder="Nama aset QA" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Jalankan Brand QA (100 AIC)</button>
        </form>
      )}

      {selectedModule === 'F34_LOCAL_SEO' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f34/local-seo', { projectId, profileName: f34Profile, napConsistent: true, schemaValid: true, indexable: true, ownershipVerified: true, isFakeLocationOrReview: false }, 'F34 Audit Local SEO tersimpan'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f34Profile} onChange={(e) => setF34Profile(e.target.value)} placeholder="Nama profil bisnis" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Audit Local SEO (200 AIC)</button>
        </form>
      )}

      {selectedModule === 'F35_CRO_EXPERIMENT' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f35/cro-experiment', { projectId, experimentName: f35Exp, variantA: 'Form 3 Field', variantB: 'Form + Kalkulator KPR', primaryMetric: 'Survey Rate', stopRule: '14 hari / 500 sesi', randomized: true, keyboardAccessible: true, formErrorAccessible: true }, 'F35 Eksperimen CRO dibuat'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f35Exp} onChange={(e) => setF35Exp(e.target.value)} placeholder="Nama eksperimen CRO" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Buat Eksperimen CRO (150 AIC)</button>
        </form>
      )}

      {selectedModule === 'F58_REMINDER_RESCHEDULE' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f58/reminder', { projectId, appointmentId: f58Apt, timezone: 'Asia/Jakarta', hasConsent: true, suppressed: false, noShowCount: 0 }, 'F58 Reminder dijadwalkan'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f58Apt} onChange={(e) => setF58Apt(e.target.value)} placeholder="Appointment ID" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Kirim Reminder Berizin (20 AIC)</button>
        </form>
      )}

      {selectedModule === 'F59_VIRTUAL_TOUR' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f59/virtual-tour', { projectId, hostName: f59Host, locationName: 'Show Unit The Park', agenda: 'Tour unit & legalitas', recordingConsent: true, isPreRecorded: false }, 'F59 Sesi Virtual Tour dibuat'); }} className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f59Host} onChange={(e) => setF59Host(e.target.value)} placeholder="Nama Host Nyata" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><Plus className="size-3.5" /> Jadwalkan Virtual Tour (50 AIC)</button>
        </form>
      )}

      {selectedModule === 'F70_DISCOUNT_APPROVAL' && (
        <form onSubmit={(e) => { e.preventDefault(); postAndReload('/api/r3/f70/discount-approval', { projectId, quoteId: f70Quote, listPriceIdr: 1000000000, floorPriceIdr: 950000000, proposedPriceIdr: Number(f70Price) }, 'F70 Proposal Diskon diajukan'); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder">
          <input value={f70Quote} onChange={(e) => setF70Quote(e.target.value)} placeholder="Quote ID" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={f70Price} onChange={(e) => setF70Price(e.target.value)} placeholder="Harga usulan (floor 950jt)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer"><CheckCircle2 className="size-3.5" /> Ajukan Approval (20 AIC)</button>
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
