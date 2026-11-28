import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

export interface PaymentInvoiceRecord {
  id?: string;
  tenant_id?: string;
  project_id?: string;
  invoice_no: string;
  provider?: string;
  invoice_type: 'PLAN_SUBSCRIPTION' | 'AIC_TOPUP' | 'BOOKING_FEE' | string;
  reference_code: string;
  description: string;
  amount_idr: number | string;
  aic_amount?: number | string;
  unit_code?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED' | string;
  checkout_url?: string;
  paid_at?: string | null;
  created_by?: string;
  created_at?: string;
}

interface PlanOption {
  code: 'gold' | 'platinum' | 'diamond';
  label: string;
  priceIdr: number;
  initialAic: number;
  tagline: string;
}

const DEFAULT_PLANS: PlanOption[] = [
  {
    code: 'gold',
    label: 'Gold',
    priceIdr: 4_900_000,
    initialAic: 2500,
    tagline: '63 fitur inti · 1 proyek · 5 pengguna sales · 2.500 AIC / 3 bulan',
  },
  {
    code: 'platinum',
    label: 'Platinum',
    priceIdr: 9_900_000,
    initialAic: 5000,
    tagline: '88 fitur + Virtual TL · 3 proyek · 20 pengguna · 5.000 AIC / 3 bulan',
  },
  {
    code: 'diamond',
    label: 'Diamond',
    priceIdr: 19_900_000,
    initialAic: 12000,
    tagline: '100 fitur Enterprise + Voice AI · 5+ proyek · 12.000 AIC / 3 bulan',
  },
];

function formatIdr(value: number | string): string {
  return `Rp ${Math.round(Number(value || 0)).toLocaleString('id-ID')}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isPlanInvoice(inv: PaymentInvoiceRecord): boolean {
  return inv.invoice_type === 'PLAN_SUBSCRIPTION' || String(inv.reference_code || '').startsWith('PLAN-');
}

function getInvoiceTypeLabel(inv: PaymentInvoiceRecord): string {
  if (isPlanInvoice(inv)) return 'Paket Developer';
  if (inv.invoice_type === 'BOOKING_FEE') return 'Booking Fee Unit';
  return 'Top-up Saldo AIC';
}

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

export const InvoiceDetailModal: React.FC<{
  invoice: PaymentInvoiceRecord | null;
  companyName?: string;
  onClose: () => void;
}> = ({ invoice, companyName = 'Developer Sales OS', onClose }) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'PAID';
  const aicAmount = Number(invoice.aic_amount || 0);

  return (
    <div className="fixed inset-0 z-70 bg-espresso/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-warmborder rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-auto">
        <div className="p-5 bg-espresso text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-200 font-bold">Invoice Resmi Transaksi</p>
            <h3 className="text-lg font-extrabold font-mono mt-0.5">{invoice.invoice_no}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup invoice"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-warmborder pb-3">
            <div>
              <p className="text-warmmuted">Ditagihkan Kepada</p>
              <p className="font-bold text-espresso text-sm">{invoice.customer_name || companyName}</p>
              <p className="text-[11px] text-warmmuted">{invoice.created_by || '-'}</p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="rounded-xl bg-sandstone/60 border border-warmborder p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-warmmuted">Jenis Transaksi</span>
              <span className="font-bold text-espresso">{getInvoiceTypeLabel(invoice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-warmmuted">Kode Referensi</span>
              <span className="font-mono font-semibold text-espresso">{invoice.reference_code}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-warmmuted shrink-0">Keterangan</span>
              <span className="font-semibold text-espresso text-right">{invoice.description}</span>
            </div>
            {aicAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-warmmuted">Kuota AIC Didapat</span>
                <span className="font-bold text-olive">{aicAmount.toLocaleString('id-ID')} AIC</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-warmmuted">Tanggal Dibuat</span>
              <span className="text-espresso">{formatDateTime(invoice.created_at)}</span>
            </div>
            {invoice.paid_at && (
              <div className="flex items-center justify-between">
                <span className="text-warmmuted">Tanggal Lunas</span>
                <span className="text-espresso">{formatDateTime(invoice.paid_at)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <span className="font-bold text-espresso">Total Pembayaran</span>
            <span className="text-lg font-extrabold text-terracotta">{formatIdr(invoice.amount_idr)}</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border border-warmborder bg-sandstone hover:bg-warmborder text-espresso font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="size-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-white font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TransactionsInvoicesPageProps {
  projectId: string;
  projectName: string;
  userRole: string;
}

export const TransactionsInvoicesPage: React.FC<TransactionsInvoicesPageProps> = ({
  projectId,
  projectName,
  userRole,
}) => {
  const [loading, setLoading] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
  const [settlingNo, setSettlingNo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Developer Sales OS');
  const [activePlanCode, setActivePlanCode] = useState<string>('platinum');
  const [invoices, setInvoices] = useState<PaymentInvoiceRecord[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'PLAN' | 'AIC' | 'BOOKING'>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoiceRecord | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const canBuyPlan = ['ADMIN', 'DIREKSI', 'IT', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(userRole);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/summary', { headers: getAuthHeaders() });
      const json = await res.json();
      if (res.ok && json.ok) {
        setCompanyName(String(json.tenant?.companyName || 'Developer Sales OS'));
        setActivePlanCode(String(json.tenant?.planCode || 'platinum').toLowerCase());
        setInvoices(Array.isArray(json.invoices) ? json.invoices : []);
      } else {
        setFeedback({ type: 'err', text: json.error || 'Gagal memuat riwayat transaksi.' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'Gagal terhubung ke server transaksi.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const handleSubscribePlan = async (planCode: 'gold' | 'platinum' | 'diamond') => {
    setSubmittingPlan(planCode);
    setFeedback(null);
    try {
      const res = await fetch('/api/billing/subscribe-plan', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          planCode,
          projectId,
          autoSettle: true,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok && json.invoice) {
        setActivePlanCode(String(json.planCode || planCode));
        setInvoices((prev) => [json.invoice, ...prev.filter((i) => i.invoice_no !== json.invoice.invoice_no)]);
        setSelectedInvoice(json.invoice);
        setFeedback({
          type: 'ok',
          text: `Pembelian paket ${json.planLabel} berhasil. Invoice ${json.invoice.invoice_no} diterbitkan (PAID).`,
        });
      } else {
        setFeedback({ type: 'err', text: json.error || 'Gagal memproses pembelian paket.' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'Gagal menghubungi server billing.' });
    } finally {
      setSubmittingPlan(null);
    }
  };

  const handleDummySettle = async (invoiceNo: string) => {
    setSettlingNo(invoiceNo);
    setFeedback(null);
    try {
      const res = await fetch('/api/payments/dummy-settle', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ invoiceNo, targetStatus: 'PAID' }),
      });
      const json = await res.json();
      if (res.ok && json.ok && json.invoice) {
        setInvoices((prev) => prev.map((inv) => (inv.invoice_no === invoiceNo ? json.invoice : inv)));
        setSelectedInvoice(json.invoice);
        setFeedback({ type: 'ok', text: `Invoice ${invoiceNo} berhasil ditandai PAID.` });
        void fetchSummary();
      } else {
        setFeedback({ type: 'err', text: json.error || 'Gagal menyelesaikan pembayaran invoice.' });
      }
    } catch {
      setFeedback({ type: 'err', text: 'Gagal menghubungi server pembayaran.' });
    } finally {
      setSettlingNo(null);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterType === 'PLAN') return isPlanInvoice(inv);
      if (filterType === 'AIC') return inv.invoice_type === 'AIC_TOPUP' && !isPlanInvoice(inv);
      if (filterType === 'BOOKING') return inv.invoice_type === 'BOOKING_FEE';
      return true;
    });
  }, [invoices, filterType]);

  const paidInvoices = useMemo(() => invoices.filter((i) => i.status === 'PAID'), [invoices]);
  const totalPaidIdr = useMemo(
    () => paidInvoices.reduce((sum, i) => sum + Number(i.amount_idr || 0), 0),
    [paidInvoices]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-terracotta text-[11px] font-bold">
            <CreditCard className="size-3.5" />
            <span>Transaksi &amp; Invoice Developer · {userRole}</span>
          </div>
          <h2 className="text-xl font-extrabold text-espresso mt-1.5">
            Riwayat Transaksi, Pembelian Paket &amp; Invoice
          </h2>
          <p className="text-xs text-warmmuted mt-0.5">
            {companyName} · Proyek aktif: <strong className="text-espresso">{projectName}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSummary()}
          className="px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-espresso flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer opacity-70 hover:opacity-100">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Ringkasan Paket & Tagihan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Paket Developer Aktif</p>
          <p className="text-2xl font-extrabold text-espresso mt-1 uppercase">{activePlanCode}</p>
          <p className="text-[11px] text-olive font-semibold mt-1 flex items-center gap-1">
            <ShieldCheck className="size-3.5" />
            <span>Langganan 3 Bulan · Terisolasi per Tenant</span>
          </p>
        </div>
        <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Total Invoice Tercatat</p>
          <p className="text-2xl font-extrabold text-espresso mt-1">{invoices.length} Invoice</p>
          <p className="text-[11px] text-warmmuted mt-1">{paidInvoices.length} transaksi berstatus PAID</p>
        </div>
        <div className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-warmmuted uppercase font-bold tracking-wider">Total Transaksi Lunas</p>
          <p className="text-2xl font-extrabold text-terracotta mt-1">{formatIdr(totalPaidIdr)}</p>
          <p className="text-[11px] text-warmmuted mt-1">Paket, Top-up AIC &amp; Booking Fee</p>
        </div>
      </div>

      {/* Beli / Upgrade Paket Developer */}
      {canBuyPlan && (
        <section className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-espresso flex items-center gap-1.5">
                <Sparkles className="size-4 text-terracotta" />
                <span>Beli atau Upgrade Paket Developer (Langsung Terbit Invoice)</span>
              </h3>
              <p className="text-xs text-warmmuted mt-0.5">
                Setelah pembelian diproses, invoice resmi langsung diterbitkan dan kuota AIC otomatis ditambahkan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_PLANS.map((plan) => {
              const isCurrent = activePlanCode === plan.code;
              const isBusy = submittingPlan === plan.code;
              return (
                <div
                  key={plan.code}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 ${
                    isCurrent ? 'border-olive bg-olive/5' : 'border-warmborder bg-sandstone/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-espresso">Paket {plan.label}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-olive text-white text-[10px] font-bold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-extrabold text-terracotta mt-1.5">{formatIdr(plan.priceIdr)}</p>
                    <p className="text-[11px] text-warmmuted mt-1">{plan.tagline}</p>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleSubscribePlan(plan.code)}
                    className={`w-full h-9 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-60 ${
                      isCurrent
                        ? 'bg-espresso hover:bg-espresso/90 text-white'
                        : 'bg-terracotta hover:bg-terracotta/90 text-white'
                    }`}
                  >
                    {isBusy
                      ? 'Menerbitkan Invoice...'
                      : isCurrent
                      ? `Perpanjang Paket ${plan.label}`
                      : `Beli Paket ${plan.label}`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tabel Riwayat Invoice */}
      <section className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-warmborder flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-espresso">Daftar Invoice &amp; Bukti Pembayaran</h3>
            <p className="text-xs text-warmmuted mt-0.5">
              Klik "Lihat Invoice" untuk melihat rincian resmi atau mencetak PDF.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'ALL', label: 'Semua' },
                { id: 'PLAN', label: 'Paket Developer' },
                { id: 'AIC', label: 'Top-up AIC' },
                { id: 'BOOKING', label: 'Booking Fee' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  filterType === tab.id
                    ? 'bg-espresso text-white'
                    : 'bg-sandstone text-warmmuted hover:text-espresso'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-warmmuted">
                    Memuat riwayat transaksi &amp; invoice...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-warmmuted">
                    Belum ada transaksi pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.invoice_no} className="hover:bg-sandstone/30">
                    <td className="py-3 px-4 font-mono font-bold text-espresso">{inv.invoice_no}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-sandstone text-espresso font-semibold text-[11px]">
                        {getInvoiceTypeLabel(inv)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-espresso">
                      <div className="font-semibold">{inv.description || inv.reference_code}</div>
                      {Number(inv.aic_amount || 0) > 0 && (
                        <div className="text-[11px] text-olive font-semibold">
                          +{Number(inv.aic_amount).toLocaleString('id-ID')} AIC
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-espresso">{formatIdr(inv.amount_idr)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status === 'PAID' ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-warmmuted">{formatDateTime(inv.paid_at || inv.created_at)}</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {inv.status === 'PENDING' && canBuyPlan && (
                        <button
                          type="button"
                          disabled={settlingNo === inv.invoice_no}
                          onClick={() => void handleDummySettle(inv.invoice_no)}
                          className="px-2.5 py-1.5 rounded-lg bg-olive hover:bg-olive/90 text-white font-bold cursor-pointer disabled:opacity-60"
                        >
                          {settlingNo === inv.invoice_no ? 'Proses...' : 'Bayar Lunas'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1.5 rounded-lg bg-sandstone hover:bg-warmborder text-espresso font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="size-3" />
                        <span>Lihat Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <InvoiceDetailModal
        invoice={selectedInvoice}
        companyName={companyName}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
