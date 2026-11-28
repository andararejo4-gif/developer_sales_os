import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { LoveLetterPoint } from '../lib/love-letter/points-data';
import { generateLoveLetterDocx } from '../lib/love-letter/docx-exporter';
import { generateLoveLetterHtml } from '../lib/love-letter/html-exporter';
import { loginWithServer } from '../lib/auth/dummy-accounts';

interface CheckoutInvoice {
  invoice_no: string;
  provider: string;
  invoice_type: string;
  reference_code: string;
  description: string;
  amount_idr: number;
  aic_amount: number;
  unit_code: string | null;
  customer_name: string | null;
  created_by: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED';
  checkout_url: string | null;
  paid_at: string | null;
  created_at: string;
  project_id: string;
}

interface CheckoutOnboarding {
  sessionId: string;
  selectedPlan: string;
  companyName: string;
  projectName: string;
  slug: string;
  city: string;
  province: string;
  status: string;
  activatedTenantId: string | null;
  pointsCount: number;
  loveLetterPoints: Array<LoveLetterPoint & { sourceTag?: string }>;
}

interface PaymentCheckoutPageProps {
  invoiceNo: string;
  onEnterDashboard?: (role?: string) => void;
}

const DRAFT_STORAGE_KEY = 'dsos_onboarding_draft_v1';

export const PaymentCheckoutPage: React.FC<PaymentCheckoutPageProps> = ({
  invoiceNo,
  onEnterDashboard,
}) => {
  const [invoice, setInvoice] = useState<CheckoutInvoice | null>(null);
  const [onboarding, setOnboarding] = useState<CheckoutOnboarding | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [entering, setEntering] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCheckout = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/checkout/${encodeURIComponent(invoiceNo)}`);
      const json = await res.json();
      if (res.ok && json.ok) {
        setInvoice(json.invoice);
        setOnboarding(json.onboarding || null);
        setErrorMsg(null);
      } else {
        setErrorMsg(json.error || 'Invoice tidak ditemukan.');
      }
    } catch {
      setErrorMsg('Gagal memuat detail pembayaran.');
    } finally {
      setLoading(false);
    }
  }, [invoiceNo]);

  useEffect(() => {
    loadCheckout();
  }, [loadCheckout]);

  const handleSyncPayment = async () => {
    setSyncing(true);
    setStatusMessage(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/payments/checkout/${encodeURIComponent(invoiceNo)}/sync`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        await loadCheckout();
        if (json.invoice?.status === 'PAID') {
          setStatusMessage('Pembayaran lunas terverifikasi Midtrans! Akses login & Surat Cinta sudah terbuka.');
        } else {
          setStatusMessage(`Status Midtrans saat ini: ${json.midtransStatus || 'PENDING'}. Selesaikan pembayaran lalu klik cek lagi.`);
        }
      } else {
        setErrorMsg(json.error || 'Gagal mengecek status pembayaran ke Midtrans.');
      }
    } catch {
      setErrorMsg('Gagal menghubungi server untuk verifikasi status pembayaran.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!onboarding || invoice?.status !== 'PAID') return;
    const blob = await generateLoveLetterDocx(
      onboarding.projectName,
      onboarding.companyName,
      onboarding.city || 'Indonesia',
      onboarding.loveLetterPoints
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Surat_Cinta_99_Keunggulan_${onboarding.projectName.replace(/\s+/g, '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!onboarding || invoice?.status !== 'PAID') return;
    const html = generateLoveLetterHtml(
      onboarding.projectName,
      onboarding.companyName,
      onboarding.city || 'Indonesia',
      onboarding.loveLetterPoints
    );
    const win = window.open('', '_blank', 'width=1024,height=768');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
    }
  };

  const handleEnterApp = async () => {
    setEntering(true);
    try {
      if (onboarding) {
        const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (rawDraft) {
          try {
            const parsed = JSON.parse(rawDraft);
            const email = parsed?.formData?.ownerEmail || invoice?.created_by;
            const password = parsed?.formData?.ownerPassword;
            if (email && password) {
              await loginWithServer(String(email), String(password));
            }
          } catch {
            // fallback ke login manual di dashboard
          }
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
      if (onEnterDashboard) {
        onEnterDashboard('IT');
      }
      window.history.pushState({}, '', '/dashboard');
      window.location.href = '/dashboard';
    } finally {
      setEntering(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111814] text-white flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm font-medium">
          <RefreshCw className="size-4 animate-spin text-amber-400" />
          <span>Memuat halaman pembayaran...</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-sandstone flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-warmborder rounded-2xl p-6 text-center space-y-4">
          <h1 className="text-lg font-bold text-espresso">Invoice Tidak Ditemukan</h1>
          <p className="text-xs text-warmmuted">{errorMsg || `Nomor invoice ${invoiceNo} tidak tersedia.`}</p>
          <button
            type="button"
            onClick={handleBack}
            className="h-10 px-5 rounded-xl bg-espresso text-white text-xs font-bold cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'PAID';
  const isMidtransUrl = String(invoice.checkout_url || '').startsWith('https://');
  const amountFmt = `Rp ${Number(invoice.amount_idr || 0).toLocaleString('id-ID')}`;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* KOLOM KIRI: Ringkasan Tagihan (Tema Gelap) */}
      <div className="lg:col-span-5 bg-[#111814] text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/75 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Kembali</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-extrabold">
                DS
              </span>
              <span className="text-sm font-bold tracking-tight">Developer Sales OS</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-amber-300">
              <span>{invoice.provider.replace(/_/g, ' ')}</span>
              <span>·</span>
              <span className="font-mono">{invoice.invoice_no}</span>
            </div>
            <p className="text-sm text-white/75 pt-2">{invoice.description}</p>
            <div className="text-4xl font-extrabold tracking-tight">{amountFmt}</div>
            <p className="text-xs text-white/60">
              {onboarding
                ? `Paket ${onboarding.selectedPlan.toUpperCase()} · Masa aktif 3 bulan · ${Number(invoice.aic_amount || 0).toLocaleString('id-ID')} AIC`
                : invoice.invoice_type === 'AIC_TOPUP'
                ? `Top-up Kuota AI Credit (${Number(invoice.aic_amount || 0).toLocaleString('id-ID')} AIC)`
                : `Booking Fee Unit ${invoice.unit_code || ''}`}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-white">{invoice.description}</div>
                <div className="text-[11px] text-white/60 mt-0.5">
                  Ref: {invoice.reference_code}
                  {Number(invoice.aic_amount || 0) > 0 && ` · +${Number(invoice.aic_amount).toLocaleString('id-ID')} AIC`}
                </div>
              </div>
              <span className="font-semibold shrink-0">{amountFmt}</span>
            </div>

            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-white/75">
              <span>Subtotal</span>
              <span>{amountFmt}</span>
            </div>
            <div className="flex items-center justify-between text-white/75">
              <span>Biaya Layanan / Pajak</span>
              <span>Rp 0</span>
            </div>
            <div className="border-t border-white/15 pt-3 flex items-center justify-between text-sm font-bold text-white">
              <span>Total Tagihan</span>
              <span>{amountFmt}</span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex items-center justify-between text-[11px] text-white/55 border-t border-white/10 mt-8">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            Enkripsi Midtrans SHA-512
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold ${
              isPaid
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {invoice.status}
          </span>
        </div>
      </div>

      {/* KOLOM KANAN: Detail Kontak & Pembayaran */}
      <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex items-center justify-center bg-[#FAFAFA]">
        <div className="max-w-lg w-full space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}
          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              {statusMessage}
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-warmmuted">Informasi Kontak</h2>
            <div className="bg-white border border-warmborder rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-warmmuted">Email Akun</span>
                <span className="font-semibold text-espresso">{invoice.created_by}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-warmmuted">Nama PIC</span>
                <span className="font-semibold text-espresso">{invoice.customer_name || 'Admin IT Tim'}</span>
              </div>
              {onboarding && (
                <div className="flex items-center justify-between">
                  <span className="text-warmmuted">Developer / Proyek</span>
                  <span className="font-semibold text-espresso">
                    {onboarding.companyName} · {onboarding.projectName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method / Status */}
          {isPaid ? (
            <div className="bg-white border border-emerald-300 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-extrabold text-espresso">Pembayaran Lunas &amp; Terverifikasi!</h3>
                  <p className="text-xs text-warmmuted mt-0.5">
                    {onboarding
                      ? 'Workspace terisolasi, akses login Admin/IT, dan Surat Cinta 99 Keunggulan Anda sudah aktif.'
                      : 'Transaksi Anda sudah selesai dan saldo/status unit telah diperbarui.'}
                  </p>
                </div>
              </div>

              {onboarding && (
                <>
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1 text-espresso">
                    <div>
                      Tenant ID: <span className="font-mono font-bold">{onboarding.activatedTenantId}</span>
                    </div>
                    <div>
                      Website Publik: <span className="font-mono">/site/{onboarding.slug}</span>
                    </div>
                    <div>
                      Surat Cinta Terverifikasi: <strong>{onboarding.pointsCount} Poin Faktual</strong>
                    </div>
                  </div>

                  {onboarding.loveLetterPoints.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleDownloadDocx}
                        className="h-10 px-4 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="size-4" />
                        <span>Unduh Word (.docx)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="h-10 px-4 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="size-4" />
                        <span>Cetak / Simpan PDF</span>
                      </button>
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                disabled={entering}
                onClick={handleEnterApp}
                className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                {entering ? 'Membuka Dashboard...' : 'Masuk ke Dashboard Sekarang'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-warmmuted">
                  Metode Pembayaran (Midtrans Sandbox)
                </h2>
                <div className="bg-white border border-warmborder rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-espresso">
                      <CreditCard className="size-4 text-emerald-700" />
                      <span>Virtual Account, QRIS, E-Wallet &amp; Kartu</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sandstone text-espresso">
                      MIDTRANS
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-warmmuted">
                    {['BCA VA', 'BNI VA', 'BRI VA', 'Mandiri', 'QRIS', 'GoPay', 'Visa/Mastercard'].map((m) => (
                      <span key={m} className="px-2 py-1 rounded-md bg-sandstone/70 border border-warmborder">
                        {m}
                      </span>
                    ))}
                  </div>

                  {onboarding && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-[11px] text-amber-950">
                      <Lock className="size-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Surat Cinta ({onboarding.pointsCount} poin faktual) dan akses login dashboard terkunci sampai pembayaran berstatus <strong>PAID</strong>.
                      </span>
                    </div>
                  )}

                  {isMidtransUrl ? (
                    <a
                      href={invoice.checkout_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <span>Bayar Sekarang via Midtrans ({amountFmt})</span>
                      <ExternalLink className="size-4" />
                    </a>
                  ) : (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      URL Midtrans belum tersedia untuk invoice ini. Hubungi admin atau buat ulang invoice.
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={syncing}
                    onClick={handleSyncPayment}
                    className="w-full h-10 rounded-xl border border-warmborder bg-sandstone/40 hover:bg-sandstone text-espresso text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Memeriksa ke Midtrans...' : 'Saya Sudah Bayar — Cek Status Otomatis'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-warmmuted flex items-center gap-1.5 px-1">
                <Sparkles className="size-3.5 text-terracotta shrink-0" />
                <span>Setelah bayar di Midtrans Simulator, klik tombol Cek Status atau tunggu webhook otomatis.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
