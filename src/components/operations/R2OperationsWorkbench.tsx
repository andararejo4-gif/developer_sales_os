import React, { useCallback, useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  MapPin,
  Download,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';
import { CoupledModulesPanel } from './CoupledModulesPanel';

interface R2OperationsWorkbenchProps {
  role: string;
  projectId: string;
  projectName: string;
}

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

export const R2OperationsWorkbench: React.FC<R2OperationsWorkbenchProps> = ({
  role,
  projectId,
  projectName,
}) => {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Dummy Payment Gateway (IT: AIC_TOPUP, ADMIN: BOOKING_FEE)
  const [invoices, setInvoices] = useState<any[]>([]);
  const [aicBalance, setAicBalance] = useState<number | null>(null);
  const [topupAic, setTopupAic] = useState(1000);
  const [bookingUnit, setBookingUnit] = useState('Nagoya A-01');
  const [bookingBuyer, setBookingBuyer] = useState('');
  const [bookingAmount, setBookingAmount] = useState(5000000);

  // 2. Admin: Truth Conflicts (F05/F06)
  const [conflicts, setConflicts] = useState<any[]>([]);

  // 3. SM: Duplicate Leads (F44) + Claims (F14) + Comparison Pack (F18)
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [newClaimText, setNewClaimText] = useState('');
  const [comparisonPreview, setComparisonPreview] = useState<string | null>(null);

  // 4. SE / Admin: POI & Risk (F11)
  const [poiItems, setPoiItems] = useState<any[]>([]);
  const [newPoiTitle, setNewPoiTitle] = useState('');
  const [newPoiDistance, setNewPoiDistance] = useState(1200);

  const isIt = role === 'SUPERADMIN_IT' || role === 'SUPERADMIN' || role === 'IT';
  const isAdmin = role === 'ADMIN';
  const isSm = role === 'SM';
  const isSe = role === 'SE';

  const loadData = useCallback(async () => {
    const headers = getAuthHeaders();
    try {
      if (isIt || isAdmin) {
        const type = isIt ? 'AIC_TOPUP' : 'BOOKING_FEE';
        const res = await fetch(`/api/payments/invoices?type=${type}`, { credentials: 'include', headers });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.invoices)) setInvoices(json.invoices);
        }
      }
      if (isIt) {
        const wRes = await fetch('/api/aic/wallet', { credentials: 'include', headers });
        if (wRes.ok) {
          const wJson = await wRes.json();
          setAicBalance(Number(wJson.data?.wallet?.balance_aic ?? 0));
        }
      }
      if (isAdmin) {
        const cRes = await fetch('/api/truth/conflicts', { credentials: 'include', headers });
        if (cRes.ok) {
          const cJson = await cRes.json();
          if (Array.isArray(cJson.conflicts)) setConflicts(cJson.conflicts);
        }
      }
      if (isSm) {
        const [dRes, clRes] = await Promise.all([
          fetch('/api/leads/duplicates', { credentials: 'include', headers }),
          fetch(`/api/claims/ledger?projectId=${encodeURIComponent(projectId)}`, { credentials: 'include', headers }),
        ]);
        if (dRes.ok) {
          const dJson = await dRes.json();
          if (Array.isArray(dJson.duplicates)) setDuplicates(dJson.duplicates);
        }
        if (clRes.ok) {
          const clJson = await clRes.json();
          if (Array.isArray(clJson.claims)) setClaims(clJson.claims);
        }
      }
      if (isSe || isSm || isAdmin) {
        const pRes = await fetch(`/api/projects/poi-risk?projectId=${encodeURIComponent(projectId)}`, {
          credentials: 'include',
          headers,
        });
        if (pRes.ok) {
          const pJson = await pRes.json();
          if (Array.isArray(pJson.items)) setPoiItems(pJson.items);
        }
      }
    } catch {
      /* abaikan error jaringan sementara */
    }
  }, [isAdmin, isIt, isSe, isSm, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateDummyInvoice = async (invoiceType: 'AIC_TOPUP' | 'BOOKING_FEE') => {
    const body =
      invoiceType === 'AIC_TOPUP'
        ? {
            projectId,
            invoiceType,
            referenceCode: `AIC-${topupAic}`,
            description: `Top-up Simulasi ${topupAic} AIC`,
            amountIdr: topupAic * 250,
            aicAmount: topupAic,
          }
        : {
            projectId,
            invoiceType,
            referenceCode: `BOOK-${bookingUnit}`,
            description: `Booking Fee ${bookingUnit} (${bookingBuyer || 'Pembeli'})`,
            amountIdr: bookingAmount,
            unitCode: bookingUnit,
            customerName: bookingBuyer || 'Calon Pembeli',
          };
    const res = await fetch('/api/payments/invoices', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      showToast(`Invoice dummy ${json.invoice.invoice_no} dibuat (PENDING).`);
      await loadData();
    } else {
      showToast(json.error || 'Gagal membuat invoice dummy.');
    }
  };

  const handleCheckMidtransStatus = async (invoiceNo: string) => {
    const res = await fetch('/api/payments/check-status', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ invoiceNo }),
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      showToast(
        json.pending
          ? `Status Midtrans ${invoiceNo}: masih PENDING.`
          : `Status Midtrans ${invoiceNo} tersinkron: ${json.invoice?.status || 'PAID'}!`
      );
      await loadData();
    } else {
      showToast(json.error || 'Gagal mengecek status Midtrans.');
    }
  };

  const handleSimulatePaid = async (invoiceNo: string) => {
    const res = await fetch('/api/payments/dummy-settle', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ invoiceNo, targetStatus: 'PAID' }),
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      showToast(`Simulasi bayar lunas ${invoiceNo} berhasil!`);
      await loadData();
    } else {
      showToast(json.error || 'Gagal memproses simulasi bayar.');
    }
  };

  const handleResolveConflict = async (conflictId: string) => {
    const res = await fetch('/api/truth/conflicts/resolve', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ conflictId, resolution: 'ACCEPTED_LATEST' }),
    });
    if (res.ok) {
      showToast('Konflik data diselesaikan.');
      await loadData();
    }
  };

  const handlePropagateStale = async () => {
    const res = await fetch('/api/truth/propagate-stale', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ projectId, reason: 'Pembaruan harga/fakta resmi dari panel Admin' }),
    });
    if (res.ok) showToast('Notifikasi perubahan harga/fakta dikirim ke materi & tim.');
  };

  const handleMergeDuplicate = async (primaryId: string, duplicateId: string) => {
    const res = await fetch('/api/leads/merge', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({ primaryId, duplicateId }),
    });
    if (res.ok) {
      showToast('Lead ganda berhasil digabungkan.');
      await loadData();
    }
  };

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimText.trim()) return;
    const res = await fetch('/api/claims/ledger', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        projectId,
        claimText: newClaimText.trim(),
        proofGrade: 'A',
        sourceCitation: 'Fakta Resmi Proyek',
      }),
    });
    if (res.ok) {
      setNewClaimText('');
      showToast('Klaim terverifikasi ditambahkan.');
      await loadData();
    }
  };

  const handleExportComparison = async () => {
    const res = await fetch('/api/exports/comparison-pack', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        projectId,
        projectName,
        buyerName: 'Calon Pembeli',
        unitOptions: [
          { unitCode: 'Nagoya A-01', priceCashIdr: 650000000, priceKprIdr: 683000000, ltSqm: 72, lbSqm: 60 },
          { unitCode: 'Osaka B-02', priceCashIdr: 775000000, priceKprIdr: 815000000, ltSqm: 84, lbSqm: 75 },
        ],
      }),
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      setComparisonPreview(json.markdown || JSON.stringify(json, null, 2));
      showToast('Paket perbandingan pembeli siap.');
    }
  };

  const handleAddPoi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoiTitle.trim()) return;
    const res = await fetch('/api/projects/poi-risk', {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        projectId,
        category: 'AKSES',
        title: newPoiTitle.trim(),
        distanceMeters: newPoiDistance,
        riskLevel: 'LOW',
        sourceCitation: 'Survei Lapangan Resmi',
      }),
    });
    if (res.ok) {
      setNewPoiTitle('');
      showToast('Titik POI / akses ditambahkan.');
      await loadData();
    }
  };

  if (!isIt && !isAdmin && !isSm && !isSe) return null;

  return (
    <section className="bg-white border border-warmborder rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-warmborder/60 pb-3">
        <div>
          <h3 className="text-sm font-bold text-espresso flex items-center gap-2">
            <ShieldCheck className="size-4 text-olive" />
            <span>Panel Operasional Terpadu ({role}) · {projectName}</span>
          </h3>
          <p className="text-[11px] text-warmmuted">
            {isIt && 'Dummy Payment Gateway Top-up AIC (INT-I12 / F67)'}
            {isAdmin && 'Dummy Payment Gateway Booking Fee (F65/F77) & Inbox Konflik Harga/Dokumen (F05/F06)'}
            {isSm && 'Deduplikasi Lead Ganda (F44), Claim Ledger (F14), & Paket Perbandingan (F18)'}
            {isSe && 'Data POI, Akses & Risiko Kawasan (F11) untuk Presentasi Pembeli'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="h-8 px-2.5 rounded-lg border border-warmborder text-xs font-medium text-espresso hover:bg-sandstone/60 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="size-3.5" /> Muat Ulang
        </button>
      </div>

      {toast && (
        <div className="px-3 py-2 rounded-lg bg-olive/10 border border-olive/30 text-xs font-medium text-olive">
          {toast}
        </div>
      )}

      {/* IT & ADMIN: DUMMY PAYMENT GATEWAY */}
      {(isIt || isAdmin) && (
        <div className="space-y-3 bg-sandstone/30 border border-warmborder rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-espresso flex items-center gap-1.5">
              <CreditCard className="size-4 text-terracotta" />
              {isIt ? 'Top-up Saldo AIC (Midtrans Sandbox)' : 'Tagihan Booking Fee (Midtrans Sandbox)'}
            </h4>
            {isIt && aicBalance !== null && (
              <span className="px-2.5 py-1 rounded-full bg-olive/10 text-olive text-xs font-bold">
                Saldo AIC Aktif: {aicBalance.toLocaleString('id-ID')} AIC
              </span>
            )}
          </div>

          {isIt ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="number"
                min={100}
                step={100}
                value={topupAic}
                onChange={(e) => setTopupAic(Number(e.target.value) || 500)}
                className="h-9 w-36 px-3 rounded-lg border border-warmborder bg-white font-mono"
              />
              <span className="text-warmmuted">AIC (Rp {(topupAic * 250).toLocaleString('id-ID')})</span>
              <button
                type="button"
                onClick={() => handleCreateDummyInvoice('AIC_TOPUP')}
                className="h-9 px-3 rounded-lg bg-espresso text-white font-semibold cursor-pointer"
              >
                + Buat Invoice Dummy AIC
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                value={bookingUnit}
                onChange={(e) => setBookingUnit(e.target.value)}
                placeholder="Kode Unit (misal Nagoya A-01)"
                className="h-9 px-3 rounded-lg border border-warmborder bg-white"
              />
              <input
                type="text"
                value={bookingBuyer}
                onChange={(e) => setBookingBuyer(e.target.value)}
                placeholder="Nama Pembeli"
                className="h-9 px-3 rounded-lg border border-warmborder bg-white"
              />
              <input
                type="number"
                value={bookingAmount}
                onChange={(e) => setBookingAmount(Number(e.target.value) || 5000000)}
                className="h-9 px-3 rounded-lg border border-warmborder bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => handleCreateDummyInvoice('BOOKING_FEE')}
                className="h-9 px-3 rounded-lg bg-espresso text-white font-semibold cursor-pointer"
              >
                + Buat Invoice Booking
              </button>
            </div>
          )}

          {invoices.length > 0 && (
            <div className="space-y-1.5 pt-2">
              {invoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-warmborder text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-espresso">{inv.invoice_no}</span>
                    <span className="mx-2 text-warmmuted">·</span>
                    <span>{inv.description}</span>
                    <span className="mx-2 text-warmmuted">·</span>
                    <span className="font-semibold">Rp {Number(inv.amount_idr).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-olive/10 text-olive'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {inv.status}
                    </span>
                    {inv.status === 'PENDING' && String(inv.checkout_url || '').startsWith('https://') && (
                      <>
                        <a
                          href={`/checkout/${encodeURIComponent(inv.invoice_no)}`}
                          className="px-2.5 py-1 rounded bg-espresso text-white text-[11px] font-semibold"
                        >
                          Halaman Checkout
                        </a>
                        <a
                          href={inv.checkout_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-terracotta text-white text-[11px] font-semibold"
                        >
                          Bayar via Midtrans
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCheckMidtransStatus(inv.invoice_no)}
                          className="px-2.5 py-1 rounded bg-olive text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Cek Status
                        </button>
                      </>
                    )}
                    {inv.status === 'PENDING' && !String(inv.checkout_url || '').startsWith('https://') && (
                      <button
                        type="button"
                        onClick={() => handleSimulatePaid(inv.invoice_no)}
                        className="px-2.5 py-1 rounded bg-olive text-white text-[11px] font-semibold cursor-pointer"
                      >
                        Simulasi Bayar Lunas
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN: CONFLICT INBOX & CHANGE PROPAGATION */}
      {isAdmin && (
        <div className="space-y-2 border border-warmborder rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-espresso flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-600" />
              Inbox Konflik Dokumen & Perubahan Harga ({conflicts.length})
            </h4>
            <button
              type="button"
              onClick={handlePropagateStale}
              className="h-8 px-3 rounded-lg bg-sandstone hover:bg-warmborder text-espresso text-xs font-semibold cursor-pointer"
            >
              Kirim Notifikasi Perubahan Harga
            </button>
          </div>
          {conflicts.length === 0 ? (
            <p className="text-xs text-warmmuted">Tidak ada konflik dokumen aktif.</p>
          ) : (
            conflicts.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-sandstone/40">
                <span>{c.field_key || c.summary || 'Perbedaan data dokumen'}</span>
                <button
                  type="button"
                  onClick={() => handleResolveConflict(c.id)}
                  className="px-2.5 py-1 rounded bg-olive text-white text-[11px] font-semibold cursor-pointer"
                >
                  Selesaikan
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* SM: DEDUPLIKASI LEAD + CLAIM LEDGER + COMPARISON PACK */}
      {isSm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-warmborder rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-espresso flex items-center gap-1.5">
              <Users className="size-4 text-terracotta" />
              Lead Ganda Terdeteksi ({duplicates.length} grup)
            </h4>
            {duplicates.length === 0 ? (
              <p className="text-xs text-warmmuted">Tidak ada duplikat nomor WhatsApp aktif.</p>
            ) : (
              duplicates.slice(0, 4).map((g) => (
                <div key={g.phoneKey} className="p-2.5 rounded-lg bg-sandstone/40 text-xs flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{g.leads[0]?.full_name} ({g.phoneKey})</div>
                    <div className="text-[11px] text-warmmuted">{g.leads.length} entri lead duplikat</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMergeDuplicate(g.leads[0].id, g.leads[1].id)}
                    className="px-2.5 py-1 rounded bg-espresso text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Gabungkan
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border border-warmborder rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-espresso flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-olive" />
                Claim Ledger ({claims.length}) &amp; Paket Perbandingan
              </h4>
              <button
                type="button"
                onClick={handleExportComparison}
                className="h-7 px-2.5 rounded-lg bg-olive text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="size-3" /> Paket Pembeli
              </button>
            </div>
            <form onSubmit={handleAddClaim} className="flex gap-2">
              <input
                type="text"
                value={newClaimText}
                onChange={(e) => setNewClaimText(e.target.value)}
                placeholder="Tambah klaim terverifikasi (misal SHM Pecah Per Unit)"
                className="flex-1 h-8 px-2.5 rounded-lg border border-warmborder text-xs"
              />
              <button type="submit" className="h-8 px-3 rounded-lg bg-espresso text-white text-xs font-semibold cursor-pointer">
                Simpan
              </button>
            </form>
            {comparisonPreview && (
              <pre className="p-2 rounded bg-sandstone/50 text-[10px] max-h-28 overflow-auto whitespace-pre-wrap">
                {comparisonPreview}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* SE / SM / ADMIN: DATA POI, AKSES & RISIKO KAWASAN (F11) */}
      {(isSe || isSm || isAdmin) && (
        <div className="border border-warmborder rounded-xl p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-espresso flex items-center gap-1.5">
              <MapPin className="size-4 text-olive" />
              Data POI, Akses &amp; Risiko Kawasan ({poiItems.length})
            </h4>
            {(isSm || isAdmin) && (
              <form onSubmit={handleAddPoi} className="flex flex-wrap items-center gap-1.5 text-xs">
                <input
                  type="text"
                  value={newPoiTitle}
                  onChange={(e) => setNewPoiTitle(e.target.value)}
                  placeholder="Nama POI (misal RSUD Ir. Soekarno)"
                  className="h-7 px-2.5 rounded border border-warmborder"
                />
                <input
                  type="number"
                  value={newPoiDistance}
                  onChange={(e) => setNewPoiDistance(Number(e.target.value) || 500)}
                  className="h-7 w-20 px-2 rounded border border-warmborder font-mono"
                />
                <span className="text-[11px] text-warmmuted">m</span>
                <button type="submit" className="h-7 px-2.5 rounded bg-espresso text-white font-semibold flex items-center gap-1 cursor-pointer">
                  <Plus className="size-3" /> Tambah
                </button>
              </form>
            )}
          </div>
          {poiItems.length === 0 ? (
            <p className="text-xs text-warmmuted">Belum ada catatan POI kawasan di database untuk proyek ini.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {poiItems.slice(0, 6).map((p) => (
                <div key={p.id} className="p-2.5 rounded-lg bg-sandstone/40 border border-warmborder text-xs">
                  <div className="font-semibold text-espresso">{p.title}</div>
                  <div className="text-[11px] text-warmmuted">
                    {p.category} · {(Number(p.distance_meters || 0) / 1000).toFixed(1)} km · Risiko: {p.risk_level || 'LOW'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CoupledModulesPanel role={role} projectId={projectId} />
    </section>
  );
};
