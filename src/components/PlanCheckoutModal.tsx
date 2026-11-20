import React, { useState } from 'react';
import { X, ShieldCheck, FileText, ArrowRight, ArrowLeft, Printer, Copy, Check, Calendar, Building2 } from 'lucide-react';
import { PLANS_CONFIG } from '../lib/plans/plans-config';

interface PlanCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanCode?: 'gold' | 'platinum' | 'diamond';
  onProceedToOnboarding?: () => void;
}

export const PlanCheckoutModal: React.FC<PlanCheckoutModalProps> = ({
  isOpen,
  onClose,
  initialPlanCode = 'platinum',
  onProceedToOnboarding,
}) => {
  const [selectedCode, setSelectedCode] = useState<'gold' | 'platinum' | 'diamond'>(initialPlanCode);
  const [step, setStep] = useState<'checkout' | 'invoice'>('checkout');
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPlan = PLANS_CONFIG.find((p) => p.code === selectedCode) || PLANS_CONFIG[1];

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('88301290348123');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // 3-Month Period Dates calculation
  const today = new Date(2026, 10, 20); // 20 Nov 2026
  const periodEnd = new Date(2027, 1, 18); // 18 Feb 2027
  const invoiceDateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const periodEndStr = periodEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-espresso/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white border border-warmborder rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-warmborder bg-sandstone/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-terracotta/10 text-terracotta">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-espresso text-base sm:text-lg">
                {step === 'checkout' ? 'Upgrade & Checkout Paket' : 'Invoice Resmi Pembayaran'}
              </h3>
              <p className="text-xs text-warmmuted">
                {step === 'checkout'
                  ? 'Konfirmasi paket lisensi Developer Sales OS'
                  : 'Faktur tagihan langganan multi-tenant'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-warmmuted hover:text-espresso hover:bg-sandstone flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Tutup"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {step === 'checkout' ? (
            <>
              {/* Plan Switcher Pills */}
              <div>
                <label className="text-xs font-bold text-warmmuted uppercase tracking-wider block mb-2">
                  Pilih Paket Lisensi:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {PLANS_CONFIG.map((plan) => {
                    const isSelected = plan.code === selectedCode;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedCode(plan.code)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B3D2E] text-white border-[#0B3D2E] shadow-sm'
                            : 'bg-sandstone/50 text-espresso border-warmborder hover:bg-sandstone'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm">{plan.name}</span>
                          {plan.badge && (
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-[#C6F432] text-[#0B3D2E]' : 'bg-warmborder text-espresso'
                              }`}
                            >
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono mt-1 opacity-90">
                          Rp {plan.price.toLocaleString('id-ID')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subscription Period & Capacity Highlight Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-sandstone/60 border border-warmborder space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-warmborder">
                  <div>
                    <span className="text-[11px] font-mono text-terracotta uppercase font-bold tracking-wider">
                      Paket Terpilih
                    </span>
                    <h4 className="text-xl font-extrabold text-espresso">
                      Paket {currentPlan.name} ({currentPlan.feature_count} Fitur)
                    </h4>
                  </div>
                  {/* Highlighted Subscription Period */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <Calendar className="size-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider block text-emerald-800">
                        Periode Lisensi
                      </span>
                      <strong className="text-xs sm:text-sm font-extrabold">
                        Masa langganan: 3 bulan
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Key Capacity Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-warmborder">
                    <span className="text-warmmuted block text-[11px]">Masa Aktif</span>
                    <strong className="text-espresso font-extrabold text-sm">3 Bulan</strong>
                    <span className="text-[10px] text-warmmuted block mt-0.5">90 Hari Kalender</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-warmborder">
                    <span className="text-warmmuted block text-[11px]">Total Saldo AIC</span>
                    <strong className="text-amber-600 font-extrabold text-sm">
                      {currentPlan.aic_total_quota.toLocaleString('id-ID')} AIC
                    </strong>
                    <span className="text-[10px] text-warmmuted block mt-0.5">Tanpa reset bulanan</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-warmborder">
                    <span className="text-warmmuted block text-[11px]">Jam Pendampingan</span>
                    <strong className="text-emerald-700 font-extrabold text-sm">
                      {currentPlan.human_ops_hours} Jam
                    </strong>
                    <span className="text-[10px] text-warmmuted block mt-0.5">Ops Manusia</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-warmborder">
                    <span className="text-warmmuted block text-[11px]">Kapasitas Tim</span>
                    <strong className="text-espresso font-extrabold text-sm">
                      {currentPlan.max_sales_users} User SE
                    </strong>
                    <span className="text-[10px] text-warmmuted block mt-0.5">{currentPlan.max_active_projects} Proyek Aktif</span>
                  </div>
                </div>
              </div>

              {/* Cost Summary Breakdown */}
              <div className="rounded-xl bg-white border border-warmborder p-4 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-warmmuted">
                  <span>Biaya Lisensi Paket {currentPlan.name} (Masa langganan: 3 bulan)</span>
                  <span className="font-mono font-bold text-espresso">
                    Rp {currentPlan.price.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-warmmuted">
                  <span>Biaya Setup &amp; Pemasangan Awal (S01/S03)</span>
                  <span className="font-mono text-emerald-700 font-bold">Rp 0 (Bebas Biaya)</span>
                </div>
                <div className="flex justify-between text-warmmuted">
                  <span>Pajak &amp; Biaya Layanan Tambahan</span>
                  <span className="font-mono text-warmmuted">Termasuk</span>
                </div>
                <div className="pt-3 border-t border-warmborder flex justify-between items-baseline">
                  <div>
                    <span className="font-extrabold text-espresso text-base">Total Tagihan</span>
                    <span className="block text-[11px] text-warmmuted">
                      Periode langganan 3 bulan kalender penuh
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-espresso">
                      Rp {currentPlan.price.toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[10px] font-mono text-warmmuted uppercase font-bold">
                      (Status Usulan)
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="flex items-center gap-2 text-xs text-warmmuted bg-lime-50/60 border border-lime-200 p-3 rounded-lg">
                <ShieldCheck className="size-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Jaminan Transparansi:</strong> Tidak ada biaya tersembunyi. Saldo AIC dan jam pendampingan berlaku penuh selama masa langganan 3 bulan tanpa hangus.
                </span>
              </div>
            </>
          ) : (
            /* STEP INVOICE RESMI */
            <div className="bg-sandstone/30 border border-warmborder rounded-xl p-5 sm:p-7 space-y-6">
              {/* Invoice Head */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-warmborder">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="size-5 text-terracotta" />
                    <span className="font-black text-base tracking-wider text-espresso">
                      DEVELOPER SALES OS
                    </span>
                  </div>
                  <p className="text-xs text-warmmuted mt-1">
                    Platform Sistem Operasi Penjualan Properti Multi-Tenant
                  </p>
                  <p className="text-xs text-warmmuted">domain: developerproperti.giivepro.com</p>
                </div>
                <div className="sm:text-right">
                  <div className="inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-xs font-bold uppercase mb-1">
                    Menunggu Pembayaran
                  </div>
                  <p className="text-xs font-mono text-espresso font-bold">
                    No. Invoice: INV/DSOS/2026/XI/4821
                  </p>
                  <p className="text-xs text-warmmuted">Tanggal: {invoiceDateStr}</p>
                </div>
              </div>

              {/* Bill To & Subscription Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-white border border-warmborder">
                  <span className="text-warmmuted font-bold block mb-1">DITAGIHKAN KEPADA:</span>
                  <strong className="text-espresso block text-sm">PT Andara Rejo Makmur</strong>
                  <span className="text-warmmuted">Proyek: The Park Townhouse Sukoharjo</span>
                  <span className="text-warmmuted block">Sukoharjo, Jawa Tengah</span>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-warmborder">
                  <span className="text-warmmuted font-bold block mb-1">DETAIL PERIODE LAYANAN:</span>
                  <div className="flex items-center gap-1.5 text-espresso font-extrabold text-sm">
                    <Calendar className="size-4 text-terracotta" />
                    <span>Periode: 3 Bulan Kalender</span>
                  </div>
                  <span className="text-warmmuted block mt-1">
                    Masa Langganan: <strong>3 Bulan</strong> ({invoiceDateStr} s.d. {periodEndStr})
                  </span>
                  <span className="text-emerald-700 font-bold block text-[11px] mt-0.5">
                    ✓ Kuota AIC &amp; Jam Ops berlaku 90 hari tanpa reset bulanan
                  </span>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="bg-white rounded-lg border border-warmborder overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-sandstone/70 border-b border-warmborder font-bold text-espresso">
                      <th className="py-2.5 px-3">Deskripsi Item</th>
                      <th className="py-2.5 px-3 w-32 text-center">Periode</th>
                      <th className="py-2.5 px-3 w-36 text-right">Jumlah (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warmborder">
                    <tr>
                      <td className="py-3 px-3">
                        <strong className="text-espresso block">
                          Lisensi Software Developer Sales OS — Paket {currentPlan.name}
                        </strong>
                        <span className="text-warmmuted text-[11px]">
                          Mencakup {currentPlan.feature_count} fitur, {currentPlan.max_active_projects} proyek, {currentPlan.max_sales_users} pengguna sales, dan {currentPlan.max_field_personnel} personel GPS/absensi.
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-800">
                        3 Bulan Kalender
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-espresso">
                        Rp {currentPlan.price.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3">
                        <strong className="text-espresso block">
                          Total Saldo AIC ({currentPlan.aic_total_quota.toLocaleString('id-ID')} AIC) &amp; {currentPlan.human_ops_hours} Jam Pendampingan
                        </strong>
                        <span className="text-warmmuted text-[11px]">
                          Wallet kredit eksekusi AI dan pendampingan manusia 90 hari tanpa reset.
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-warmmuted">
                        3 Bulan
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                        Rp 0 (Termasuk)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3">
                        <strong className="text-espresso block">
                          Biaya Setup &amp; Onboarding Awal
                        </strong>
                        <span className="text-warmmuted text-[11px]">
                          Model langganan tanpa biaya setup awal.
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-warmmuted">
                        -
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                        Rp 0 (Bebas Biaya)
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-espresso bg-sandstone/30 font-bold">
                      <td colSpan={2} className="py-3 px-3 text-right text-espresso font-extrabold text-sm">
                        TOTAL TAGIHAN (Masa Langganan: 3 Bulan):
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-base font-black text-espresso">
                        Rp {currentPlan.price.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Details */}
              <div className="p-4 rounded-xl bg-white border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-warmmuted font-bold block mb-1">REKENING TRANSFER BANK RESMI:</span>
                  <div className="flex items-center gap-2 font-mono text-sm font-extrabold text-espresso">
                    <span>Bank BCA (Virtual Account):</span>
                    <span className="bg-sandstone px-2 py-0.5 rounded border border-warmborder">88301290348123</span>
                  </div>
                  <span className="text-warmmuted text-[11px] block mt-1">
                    a.n. PT GIIVE PRO DIGITAL INDONESIA
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="px-3 py-2 rounded-lg bg-sandstone hover:bg-warmborder text-espresso font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  {copiedAccount ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
                  <span>{copiedAccount ? 'Tersalin!' : 'Salin Nomor VA'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-warmborder bg-sandstone/50 flex items-center justify-between shrink-0">
          {step === 'checkout' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-warmmuted hover:text-espresso cursor-pointer"
              >
                Batal
              </button>
              <div className="flex items-center gap-2">
                {onProceedToOnboarding && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onProceedToOnboarding();
                    }}
                    className="px-4 py-2.5 rounded-xl border border-warmborder bg-white text-espresso text-xs font-bold hover:bg-sandstone cursor-pointer transition-colors"
                  >
                    Daftar Demo Gratis
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep('invoice')}
                  className="px-5 py-2.5 rounded-xl bg-[#0B3D2E] text-[#C6F432] text-xs font-extrabold hover:bg-[#135440] flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <span>Lanjut ke Invoice Tagihan</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-espresso hover:bg-sandstone flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Ubah Paket</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl border border-warmborder bg-white text-espresso text-xs font-bold hover:bg-sandstone flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="size-3.5" />
                  <span>Cetak / Unduh Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer shadow-xs"
                >
                  Selesai
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
