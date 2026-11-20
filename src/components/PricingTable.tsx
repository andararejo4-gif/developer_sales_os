import React, { useState } from 'react';
import { PLANS_CONFIG, TOPUP_PACKAGES_CONFIG, PACKAGE_EXCLUSIONS_NOTICE, getPlanDisplayPrice } from '../lib/plans/plans-config';
import { Check, Minus, Zap, Users, FolderGit2, HardDrive, Phone, Sparkles, AlertCircle } from 'lucide-react';
import { PlanCheckoutModal } from './PlanCheckoutModal';

interface PricingTableProps {
  onOpenWizard: () => void;
}

export const PricingTable: React.FC<PricingTableProps> = ({ onOpenWizard }) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix' | 'topups'>('cards');
  const [checkoutPlan, setCheckoutPlan] = useState<'gold' | 'platinum' | 'diamond' | null>(null);

  const comparisonRows = [
    { name: 'Masa langganan: 3 bulan', gold: '3 bulan', plat: '3 bulan', diam: '3 bulan' },
    { name: 'Jumlah Fitur Software Kumulatif', gold: '63 Fitur', plat: '88 Fitur', diam: '100 Fitur' },
    { name: 'Total Saldo AIC (1 Periode)', gold: '20.000 AIC', plat: '70.000 AIC', diam: '240.000 AIC' },
    { name: 'Jam Ops Manusia Pendamping', gold: '2 Jam', plat: '6 Jam', diam: '16 Jam' },
    { name: 'Batas Proyek Aktif', gold: '1 Proyek', plat: '3 Proyek', diam: '10 Proyek' },
    { name: 'Batas Pengguna Tim Sales', gold: '5 Pengguna', plat: '20 Pengguna', diam: '75 Pengguna' },
    { name: 'Kapasitas Kontak Tersimpan', gold: '10.000 Kontak', plat: '50.000 Kontak', diam: '200.000 Kontak' },
    { name: 'Kapasitas Penyimpanan Berkas', gold: '10 GB', plat: '50 GB', diam: '200 GB' },
    { name: 'Pageviews Website / 30 Hari', gold: '20.000 views', plat: '100.000 views', diam: '500.000 views' },
    { name: 'Nomor WhatsApp Resmi Terhubung', gold: '1 Nomor', plat: '3 Nomor', diam: '10 Nomor' },
    { name: 'Absensi, GPS Tugas & Log Call (F97-F99)', gold: '5 Personel', plat: '20 Personel', diam: '75 Personel' },
    { name: 'AI Guide per Aktivitas SE (F100)', gold: false, plat: '5 AIC / kartu', diam: '5 AIC / kartu' },
    { name: 'Surat Cinta 99 Keunggulan (F13)', gold: 'Gratis Semua', plat: 'Gratis Semua', diam: 'Gratis Semua' },
    { name: 'Riset Pasar Radius 500m - 25km', gold: 'Tingkat Dasar', plat: 'Lengkap', diam: 'Lengkap + Berkala' },
    { name: 'Target Penjualan Berbasis Stok', gold: true, plat: true, diam: true },
    { name: 'Website Landing Page Proyek', gold: 'Template Standar', plat: 'Kustom Section', diam: 'Kustom Penuh + Domain' },
    { name: 'Kalender Konten Akun Official', gold: '1 Bulan', plat: '1 Bulan + Hashtag', diam: 'Jadwal + Pengingat' },
    { name: 'Kalender Konten Sales In-House', gold: false, plat: 'Termasuk', diam: 'Termasuk' },
    { name: 'Supervisi Otonom Team Leader (TL)', gold: 'Dokumen Manual', plat: 'TL Full AI', diam: 'TL Full AI' },
    { name: 'Sales Manager (SM) Semi-AI', gold: 'Dokumen Manual', plat: 'Dokumen Manual', diam: 'SM Semi-AI (Manusia Setuju)' },
    { name: 'Target Waktu Triage Dukungan', gold: '<= 8 Jam Kerja', plat: '<= 4 Jam Kerja', diam: '<= 1 Jam Kerja + PIC' },
  ];

  const handleScrollToMatrix = () => {
    setActiveTab('matrix');
    setTimeout(() => {
      const el = document.getElementById('row-masa-langganan-matrix');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-terracotta/10');
        setTimeout(() => el.classList.remove('bg-terracotta/10'), 2000);
      }
    }, 100);
  };

  return (
    <section id="paket-harga" className="py-12 sm:py-16 lg:py-20 bg-sandstone border-b border-warmborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + View Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-terracotta/10 text-terracotta font-mono text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="size-3.5" />
              <span>Lisensi 3 Bulan Kalender · Status Usulan</span>
            </div>
            <h2 className="text-section-display font-extrabold text-espresso mt-2">
              Pilih kapasitas mesin penjualan proyek Anda.
            </h2>
            <p className="text-sm sm:text-base text-warmmuted mt-2 leading-relaxed">
              Langganan per organisasi developer dengan satu saldo total AIC dan jam pendampingan selama 3 bulan. Tanpa biaya setup awal, tanpa reset bulanan.
            </p>
          </div>

          <div className="inline-flex self-start p-1 bg-surface rounded-md border border-warmborder">
            <button
              onClick={() => setActiveTab('cards')}
              className={`min-h-[44px] px-4 rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'cards' ? 'bg-espresso text-sandstone' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Ringkasan Paket
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`min-h-[44px] px-4 rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'matrix' ? 'bg-espresso text-sandstone' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Matriks Fitur
            </button>
            <button
              onClick={() => setActiveTab('topups')}
              className={`min-h-[44px] px-4 rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'topups' ? 'bg-espresso text-sandstone' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Top-Up &amp; Pass
            </button>
          </div>
        </div>

        {activeTab === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {PLANS_CONFIG.map((plan) => {
              const isPopular = plan.badge === 'Paling Populer';

              return (
                <div
                  key={plan.id}
                  className={`rounded-lg p-6 sm:p-7 flex flex-col justify-between bg-surface border ${
                    isPopular ? 'border-terracotta border-2' : 'border-warmborder'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 min-h-[24px]">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-espresso">{plan.name}</h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sandstone text-espresso/80 font-bold border border-warmborder">
                          {plan.feature_count} Fitur
                        </span>
                      </div>
                      {plan.badge && (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase ${
                            isPopular
                              ? 'bg-terracotta text-white'
                              : 'bg-sandstone text-espresso border border-warmborder'
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-warmmuted mt-2 leading-relaxed min-h-[44px]">
                      {plan.description}
                    </p>

                    <div className="mt-5 pb-5 border-b border-warmborder">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-espresso">
                          {getPlanDisplayPrice(plan)}
                        </span>
                        <span className="text-xs text-warmmuted font-mono font-bold uppercase">(Usulan)</span>
                      </div>
                      <p className="text-xs text-warmmuted mt-1">
                        Satu saldo total 3 bulan tanpa reset bulanan.
                      </p>
                    </div>

                    <ul className="mt-5 space-y-2.5 text-sm">
                      <li className="flex items-center gap-2.5 font-medium text-espresso">
                        <FolderGit2 className="size-4 text-terracotta shrink-0" />
                        <span>Maks. {plan.max_active_projects} Proyek Aktif</span>
                      </li>
                      <li className="flex items-center gap-2.5 font-medium text-espresso">
                        <Users className="size-4 text-terracotta shrink-0" />
                        <span>Maks. {plan.max_sales_users} Pengguna Tim Sales</span>
                      </li>
                      <li className="flex items-center gap-2.5 font-medium text-espresso">
                        <Zap className="size-4 text-amber-500 shrink-0" />
                        <span>{plan.aic_total_quota.toLocaleString('id-ID')} Total Saldo AIC</span>
                      </li>
                      <li className="flex items-center gap-2.5 font-medium text-espresso">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>{plan.human_ops_hours} Jam Pendampingan Manusia</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-espresso/90">
                        <Phone className="size-4 text-warmmuted shrink-0" />
                        <span>{plan.max_wa_numbers} Nomor WhatsApp Terhubung</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-espresso/90">
                        <HardDrive className="size-4 text-warmmuted shrink-0" />
                        <span>{plan.max_contacts.toLocaleString('id-ID')} Kontak · {plan.max_storage_gb} GB Storage</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-espresso/90">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>Absensi, GPS &amp; Call Log ({plan.max_field_personnel} Personel)</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-espresso/90">
                        {plan.ai_activity_guide_enabled ? (
                          <Check className="size-4 text-terracotta shrink-0" />
                        ) : (
                          <Minus className="size-4 text-warmmuted/40 shrink-0" />
                        )}
                        <span className={plan.ai_activity_guide_enabled ? 'font-semibold text-terracotta' : 'text-warmmuted'}>
                          {plan.ai_activity_guide_enabled ? 'AI Guide per Aktivitas SE (5 AIC)' : 'AI Guide SE (Khusus Plat/Diam)'}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-7 pt-5 border-t border-warmborder">
                    <button
                      onClick={() => setCheckoutPlan(plan.code)}
                      className={`w-full min-h-[48px] px-4 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                        isPopular
                          ? 'bg-terracotta text-white hover:bg-terracotta/90'
                          : 'bg-sandstone text-espresso hover:bg-espresso hover:text-sandstone border border-warmborder'
                      }`}
                    >
                      Mulai dengan {plan.name}
                    </button>
                    <button
                      type="button"
                      onClick={handleScrollToMatrix}
                      className="mt-2.5 text-xs text-warmmuted hover:text-espresso underline cursor-pointer w-full text-center block transition-colors"
                    >
                      Lihat rincian paket &darr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'matrix' ? (
          <div className="bg-surface border border-warmborder rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-warmborder bg-sandstone/60 font-bold text-espresso">
                    <th className="py-3.5 px-4 sm:px-6">Fitur &amp; Kapasitas (Blueprint v1.2)</th>
                    <th className="py-3.5 px-4 w-1/5">Gold (63 Fitur)</th>
                    <th className="py-3.5 px-4 w-1/5 text-terracotta">Platinum (88 Fitur)</th>
                    <th className="py-3.5 px-4 w-1/5">Diamond (100 Fitur)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmborder">
                  {comparisonRows.map((row, idx) => (
                    <tr
                      key={idx}
                      id={idx === 0 ? 'row-masa-langganan-matrix' : undefined}
                      className={`hover:bg-sandstone/30 transition-colors ${
                        idx === 0 ? 'bg-sandstone/50 font-bold border-l-4 border-l-terracotta' : ''
                      }`}
                    >
                      <td className="py-3 px-4 sm:px-6 font-medium text-espresso flex items-center gap-2">
                        <span>{row.name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-mono text-terracotta uppercase font-bold px-1.5 py-0.5 rounded bg-terracotta/10">
                            Lisensi Pokok
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-warmmuted">
                        {typeof row.gold === 'boolean' ? (
                          row.gold ? <Check className="size-4 text-olive" /> : <Minus className="size-4 text-warmmuted/40" />
                        ) : (
                          <span className={idx === 0 ? 'font-bold text-espresso' : ''}>{row.gold}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-espresso">
                        {typeof row.plat === 'boolean' ? (
                          row.plat ? <Check className="size-4 text-olive" /> : <Minus className="size-4 text-warmmuted/40" />
                        ) : (
                          <span className={row.plat.includes('AI') ? 'text-terracotta' : idx === 0 ? 'font-bold text-terracotta' : ''}>
                            {row.plat}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-espresso">
                        {typeof row.diam === 'boolean' ? (
                          row.diam ? <Check className="size-4 text-olive" /> : <Minus className="size-4 text-warmmuted/40" />
                        ) : (
                          <span className={row.diam.includes('AI') ? 'text-olive' : idx === 0 ? 'font-bold text-olive' : ''}>
                            {row.diam}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Tab Top-ups & Capacity Passes */
          <div className="bg-surface border border-warmborder rounded-lg p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-espresso">Katalog Top-Up &amp; Capacity Pass (90 Hari &amp; 30 Hari)</h3>
              <p className="text-sm text-warmmuted mt-1">
                Top-up kredit AI, jam manusia, atau kuota kapasitas tanpa memperpanjang masa aktif lisensi pokok.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOPUP_PACKAGES_CONFIG.map((tp) => (
                <div key={tp.id} className="p-4 rounded-lg bg-sandstone/40 border border-warmborder flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-terracotta px-1.5 py-0.5 rounded bg-terracotta/10">
                      {tp.category}
                    </span>
                    <h4 className="font-bold text-espresso text-sm mt-2">{tp.name}</h4>
                    <p className="text-xs text-warmmuted mt-1 leading-relaxed">{tp.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-warmborder/60">
                    <div className="text-base font-extrabold text-espresso">
                      Rp {tp.price.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[10px] font-mono text-warmmuted">Masa berlaku {tp.validity_days} hari</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exclusions Notice */}
        <div className="mt-10 p-5 rounded-lg bg-surface border border-warmborder text-xs text-warmmuted">
          <div className="flex items-center gap-2 font-bold text-espresso mb-2">
            <AlertCircle className="size-4 text-terracotta" />
            <span>Biaya di Luar Paket Langganan Software (Transparansi Finansial)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {PACKAGE_EXCLUSIONS_NOTICE.map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-terracotta font-mono">•</span>
                <span>{ex}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PlanCheckoutModal
        isOpen={!!checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        initialPlanCode={checkoutPlan || 'platinum'}
        onProceedToOnboarding={onOpenWizard}
      />
    </section>
  );
};
