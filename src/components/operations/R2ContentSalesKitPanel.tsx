import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Film, Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

export type R2ContentModuleKey =
  | 'F16_OBJECTION_KIT'
  | 'F17_UNIT_MATCH'
  | 'F22_CONTENT_APPROVAL'
  | 'F23_CONTENT_ATTRIBUTION'
  | 'F24_ASSET_RIGHTS'
  | 'F26_VIDEO_TEMPLATE';

interface R2ContentSalesKitPanelProps {
  selectedModule: R2ContentModuleKey;
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

export const R2ContentSalesKitPanel: React.FC<R2ContentSalesKitPanelProps> = ({
  selectedModule,
  projectId,
  items,
  onReload,
  onToast,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // F16 state
  const [f16Title, setF16Title] = useState('Kit Keberatan Harga & KPR Q4');
  const [f16Pitch30, setF16Pitch30] = useState('Townhouse 5 menit dari The Park Solo Baru, cicilan mulai Rp5jt-an.');
  const [f16Question, setF16Question] = useState('Kenapa lebih mahal dari rumah pinggiran?');
  const [f16Answer, setF16Answer] = useState('Lokasi 5 menit ke pusat kota + SHM & IMB lengkap.');
  const [f16Source, setF16Source] = useState('Pricelist Resmi v2.1 & Brosur U01');
  const [f16Topic, setF16Topic] = useState<'GENERAL' | 'DISKON_KHUSUS' | 'LEGALITAS'>('GENERAL');

  // F17 state
  const [f17Need, setF17Need] = useState('Keluarga 2 anak, dekat mall');
  const [f17Budget, setF17Budget] = useState('1200000000');
  const [f17Beds, setF17Beds] = useState('3');

  // F22 state
  const [f22Title, setF22Title] = useState('Reels Show Unit Akhir Pekan');
  const [f22Channel, setF22Channel] = useState('Instagram Official');
  const [f22Approved, setF22Approved] = useState(true);
  const [f22ApiAvail, setF22ApiAvail] = useState(true);

  // F23 state
  const [f23Period, setF23Period] = useState('30');
  const [f23Utm, setF23Utm] = useState('IG_REELS_THEPARK');

  // F24 state
  const [f24Asset, setF24Asset] = useState('Video Drone Cluster Q4');
  const [f24License, setF24License] = useState(true);
  const [f24Consent, setF24Consent] = useState(true);
  const [f24Label, setF24Label] = useState(true);
  const [f24Revoked, setF24Revoked] = useState(false);

  // F26 state
  const [f26Title, setF26Title] = useState('Template Tur Lokasi 25 Detik');
  const [f26Dur, setF26Dur] = useState('25');
  const [f26PriceLbl, setF26PriceLbl] = useState('Mulai Rp890 Juta (Syarat Berlaku)');
  const [f26Licensed, setF26Licensed] = useState(true);
  const [f26Subs, setF26Subs] = useState(true);

  const postAndReload = async (url: string, body: Record<string, any>, successLabel: string) => {
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
      if (!res.ok) {
        setErrorMsg(json.error || 'Permintaan gagal.');
      } else {
        onToast(`${successLabel} (${json.aicCharged ?? 0} AIC)`);
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
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-warmborder text-[11px]">
        <span className="font-semibold text-espresso flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-terracotta" />
          {selectedModule === 'F16_OBJECTION_KIT' && 'F16 Pitch & Objection Kit · 120 AIC · Diskon/legalitas & klaim tanpa bukti eskalasi ke manusia'}
          {selectedModule === 'F17_UNIT_MATCH' && 'F17 Persona-to-Unit Match · 40 AIC · Read-only maks 2 unit aktif tanpa PII pembeli'}
          {selectedModule === 'F22_CONTENT_APPROVAL' && 'F22 Approval & Publish Queue · 30 AIC · Anti double-post & fallback export berlabel'}
          {selectedModule === 'F23_CONTENT_ATTRIBUTION' && 'F23 Content Attribution · 120 AIC · Korelasi bukan klaim kausal closing'}
          {selectedModule === 'F24_ASSET_RIGHTS' && 'F24 Asset Rights & Retirement · 80 AIC · Blokir aset tanpa lisensi/izin/label'}
          {selectedModule === 'F26_VIDEO_TEMPLATE' && 'F26 Video Template & Subtitle · 150 AIC · <= 30 detik, footage berizin, anti tur palsu'}
        </span>
      </div>

      {errorMsg && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {selectedModule === 'F16_OBJECTION_KIT' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            postAndReload(
              '/api/r2/f16/pitch-kit',
              {
                projectId,
                title: f16Title,
                pitch30s: f16Pitch30,
                pitch60s: `${f16Pitch30} Legalitas SHM & IMB lengkap.`,
                pitch180s: `${f16Pitch30} Cocok untuk keluarga muda maupun pekerja profesional di Solo Raya.`,
                objections: [{ question: f16Question, answer: f16Answer, sourceRef: f16Source, topic: f16Topic }],
              },
              'F16 Pitch & Objection Kit tersimpan'
            );
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder"
        >
          <input value={f16Title} onChange={(e) => setF16Title(e.target.value)} placeholder="Judul Kit" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <select value={f16Topic} onChange={(e) => setF16Topic(e.target.value as any)} className="h-8 px-2.5 rounded-lg border border-warmborder bg-white">
            <option value="GENERAL">Topik Umum (Berbasis Bukti)</option>
            <option value="DISKON_KHUSUS">Diskon Khusus (Wajib Eskalasi SM)</option>
            <option value="LEGALITAS">Legalitas (Wajib Eskalasi Legal)</option>
          </select>
          <input value={f16Pitch30} onChange={(e) => setF16Pitch30(e.target.value)} placeholder="Pitch 30 detik" className="h-8 px-2.5 rounded-lg border border-warmborder md:col-span-2" required />
          <input value={f16Question} onChange={(e) => setF16Question(e.target.value)} placeholder="Keberatan pembeli" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={f16Source} onChange={(e) => setF16Source(e.target.value)} placeholder="Sumber bukti (kosong = eskalasi manusia)" className="h-8 px-2.5 rounded-lg border border-warmborder" />
          <input value={f16Answer} onChange={(e) => setF16Answer(e.target.value)} placeholder="Jawaban terverifikasi" className="h-8 px-2.5 rounded-lg border border-warmborder md:col-span-2" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer md:col-span-2">
            <Plus className="size-3.5" /> Simpan Kit (120 AIC)
          </button>
        </form>
      )}

      {selectedModule === 'F17_UNIT_MATCH' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            postAndReload(
              '/api/r2/f17/unit-match',
              { projectId, statedNeed: f17Need, budgetMaxIdr: Number(f17Budget) || 1200000000, minBedrooms: Number(f17Beds) || 2 },
              'F17 Pencocokan Unit selesai'
            );
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder"
        >
          <input value={f17Need} onChange={(e) => setF17Need(e.target.value)} placeholder="Kebutuhan dinyatakan" className="h-8 px-2.5 rounded-lg border border-warmborder md:col-span-2" required />
          <input type="number" value={f17Budget} onChange={(e) => setF17Budget(e.target.value)} placeholder="Budget maks (IDR)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={f17Beds} onChange={(e) => setF17Beds(e.target.value)} placeholder="Min. kamar" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer md:col-span-4">
            <CheckCircle2 className="size-3.5" /> Cocokkan Maks 2 Unit Aktif (40 AIC)
          </button>
        </form>
      )}

      {selectedModule === 'F22_CONTENT_APPROVAL' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            postAndReload(
              '/api/r2/f22/publish-queue',
              { projectId, title: f22Title, channel: f22Channel, approvedByHuman: f22Approved, apiAvailable: f22ApiAvail },
              'F22 Publish Queue diproses'
            );
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder"
        >
          <input value={f22Title} onChange={(e) => setF22Title(e.target.value)} placeholder="Judul konten" className="h-8 px-2.5 rounded-lg border border-warmborder md:col-span-2" required />
          <input value={f22Channel} onChange={(e) => setF22Channel(e.target.value)} placeholder="Kanal resmi" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <div className="flex items-center gap-3 px-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={f22Approved} onChange={(e) => setF22Approved(e.target.checked)} /> Approved
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={f22ApiAvail} onChange={(e) => setF22ApiAvail(e.target.checked)} /> API Resmi
            </label>
          </div>
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer md:col-span-4">
            <Plus className="size-3.5" /> Masukkan Antrean Publish (30 AIC)
          </button>
        </form>
      )}

      {selectedModule === 'F23_CONTENT_ATTRIBUTION' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            postAndReload(
              '/api/r2/f23/attribution',
              {
                projectId,
                periodDays: Number(f23Period) || 30,
                touches: [
                  { codeOrUtm: f23Utm, leadId: 'L-101', hasOpportunity: true },
                  { codeOrUtm: f23Utm, leadId: 'L-102', hasOpportunity: false },
                ],
              },
              'F23 Laporan Atribusi dibuat'
            );
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder"
        >
          <input value={f23Utm} onChange={(e) => setF23Utm(e.target.value)} placeholder="Kode / UTM / QR" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={f23Period} onChange={(e) => setF23Period(e.target.value)} placeholder="Periode (hari)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer">
            <Plus className="size-3.5" /> Hitung Atribusi (120 AIC)
          </button>
        </form>
      )}

      {selectedModule === 'F24_ASSET_RIGHTS' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            postAndReload(
              '/api/r2/f24/asset-rights',
              { projectId, assetName: f24Asset, hasLicense: f24License, hasModelConsent: f24Consent, hasBrandLabel: f24Label, revoked: f24Revoked },
              'F24 Pemeriksaan Hak Aset selesai'
            );
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder"
        >
          <input value={f24Asset} onChange={(e) => setF24Asset(e.target.value)} placeholder="Nama aset visual/video" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <div className="flex flex-wrap items-center gap-3 px-2 md:col-span-2">
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={f24License} onChange={(e) => setF24License(e.target.checked)} /> Lisensi</label>
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={f24Consent} onChange={(e) => setF24Consent(e.target.checked)} /> Izin Model</label>
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={f24Label} onChange={(e) => setF24Label(e.target.checked)} /> Label Brand</label>
            <label className="flex items-center gap-1 cursor-pointer text-red-700"><input type="checkbox" checked={f24Revoked} onChange={(e) => setF24Revoked(e.target.checked)} /> Dicabut/Retire</label>
          </div>
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer md:col-span-3">
            <ShieldCheck className="size-3.5" /> Evaluasi Hak Pakai Aset (80 AIC)
          </button>
        </form>
      )}

      {selectedModule === 'F26_VIDEO_TEMPLATE' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            postAndReload(
              '/api/r2/f26/video-template',
              {
                projectId,
                title: f26Title,
                durationSeconds: Number(f26Dur) || 25,
                licensedFootage: f26Licensed,
                subtitlesVerified: f26Subs,
                isFakeRealTour: false,
                subtitlePriceLabel: f26PriceLbl,
              },
              'F26 Video Template tersimpan'
            );
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-warmborder"
        >
          <input value={f26Title} onChange={(e) => setF26Title(e.target.value)} placeholder="Judul video template" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input type="number" value={f26Dur} onChange={(e) => setF26Dur(e.target.value)} placeholder="Durasi (<=30 dtk)" className="h-8 px-2.5 rounded-lg border border-warmborder" required />
          <input value={f26PriceLbl} onChange={(e) => setF26PriceLbl(e.target.value)} placeholder="Label harga subtitle" className="h-8 px-2.5 rounded-lg border border-warmborder" />
          <div className="flex items-center gap-3 px-2 md:col-span-2">
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={f26Licensed} onChange={(e) => setF26Licensed(e.target.checked)} /> Footage Berizin</label>
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={f26Subs} onChange={(e) => setF26Subs(e.target.checked)} /> Subtitle & Angka Terverifikasi</label>
          </div>
          <button disabled={submitting} type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white font-semibold flex items-center justify-center gap-1 cursor-pointer">
            <Film className="size-3.5" /> Validasi Template (150 AIC)
          </button>
        </form>
      )}

      {/* Daftar Item */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-warmmuted italic py-2">Belum ada data {selectedModule}.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="bg-white border border-warmborder rounded-lg p-2.5 text-xs flex items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-espresso flex flex-wrap items-center gap-1.5">
                  <span>{it.title}</span>
                  <span className="px-1.5 py-0.5 rounded bg-sandstone text-[10px] font-bold">{it.status}</span>
                  {it.payload?.aicCharged ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px]">{it.payload.aicCharged} AIC</span>
                  ) : null}
                </div>
                {it.payload?.correlationNote && (
                  <div className="text-[10px] text-warmmuted">{it.payload.denominatorLabel} · {it.payload.correlationNote}</div>
                )}
                {it.payload?.deliveryMode && (
                  <div className="text-[10px] text-warmmuted">Mode: {it.payload.deliveryMode}</div>
                )}
                {it.payload?.auditReason && (
                  <div className="text-[10px] text-warmmuted">Audit: {it.payload.auditReason}</div>
                )}
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
