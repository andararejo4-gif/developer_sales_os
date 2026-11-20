import React, { useState } from 'react';
import { PLANS_CONFIG, getPlanDisplayPrice } from '../lib/plans/plans-config';
import { Check, Minus, Sparkles, ArrowRight } from 'lucide-react';

interface PricingTableProps {
  onOpenWizard: () => void;
}

export const PricingTable: React.FC<PricingTableProps> = ({ onOpenWizard }) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');

  // Matrix Feature Comparison List
  const comparisonRows = [
    { name: 'Surat Cinta 99 Keunggulan', gold: 'Gratis Semua', plat: 'Gratis Semua', diam: 'Gratis Semua' },
    { name: 'Riset Pasar Radius 500m - 25km', gold: 'Tingkat Dasar', plat: 'Lengkap', diam: 'Lengkap + Berkala' },
    { name: 'Target Penjualan s.d. Sold Out', gold: true, plat: true, diam: true },
    { name: 'Website Landing Page Per Proyek', gold: 'Template Standar', plat: 'Kustom Section', diam: 'Kustom Penuh + Domain' },
    { name: 'Kalender Konten Akun Official', gold: '1 Bulan', plat: '1 Bulan + Hashtag', diam: 'Jadwal + Pengingat' },
    { name: 'Kalender Konten Sales In-House', gold: false, plat: 'Add-on', diam: 'Termasuk' },
    { name: 'Playbook Sales Executive & Rute', gold: true, plat: true, diam: true },
    { name: 'Absensi Harian SE (Check-In/Out)', gold: true, plat: true, diam: true },
    { name: 'Tracking GPS SE / Sales In-House', gold: true, plat: true, diam: true },
    { name: 'Log Panggilan Telepon & Audit SLA', gold: true, plat: true, diam: true },
    { name: 'Panduan / Guide per Aktivitas SE dengan AI', gold: false, plat: 'Aktif (AI Coach)', diam: 'Aktif (AI Coach Pro)' },
    { name: 'Peran AI: Team Leader (TL)', gold: 'Dokumen Manual', plat: 'TL Full AI', diam: 'TL Full AI' },
    { name: 'Peran AI: Sales Manager (SM)', gold: 'Dokumen Manual', plat: 'Dokumen Manual', diam: 'SM Semi-AI (Manusia Setuju)' },
    { name: 'CRM & Pipeline Penjualan', gold: 'Dasar', plat: 'Penuh + KPI Harian', diam: 'Penuh + Dasbor Eksekutif' },
    { name: 'Batas Proyek Aktif', gold: '1 Proyek', plat: '3 Proyek', diam: 'Tak Terbatas' },
    { name: 'Batas Akun Sales In-House', gold: '5 User', plat: '20 User', diam: 'Tak Terbatas' },
    { name: 'Tingkat Layanan Dukungan', gold: 'Email', plat: 'Prioritas', diam: 'Pendamping Khusus' },
  ];

  return (
    <section id="paket-harga" className="py-16 md:py-24 bg-sandstone/60 border-b border-warmborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-terracotta text-xs font-bold border border-amber-200">
            Paket &amp; Feature Flag Dinamis
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-espresso mt-2 tracking-tight">
            Pilih Kapasitas Mesin Penjualan Proyek Anda
          </h2>
          <p className="text-xs sm:text-sm text-warmmuted mt-2">
            Semua paket otomatis membuka Surat Cinta 99 Keunggulan gratis. Fitur dikontrol secara fleksibel dari panel admin tanpa deploy ulang.
          </p>

          {/* Toggle View Cards vs Matrix */}
          <div className="mt-6 inline-flex p-1 bg-white rounded-xl border border-warmborder shadow-2xs">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cards' ? 'bg-espresso text-white shadow-xs' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Tampilan Paket
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'matrix' ? 'bg-espresso text-white shadow-xs' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Tabel Matriks Lengkap
            </button>
          </div>
        </div>

        {activeTab === 'cards' ? (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS_CONFIG.map((plan) => {
              const isPopular = plan.badge === 'Paling Populer';
              const isEnterprise = plan.badge === 'Enterprise';

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 md:p-8 flex flex-col justify-between transition-all bg-white border ${
                    isPopular
                      ? 'border-terracotta shadow-md ring-2 ring-terracotta/20 relative'
                      : isEnterprise
                      ? 'border-warmborder shadow-xs'
                      : 'border-warmborder shadow-xs'
                  }`}
                >
                  <div>
                    {plan.badge && (
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-3 ${
                        isPopular ? 'bg-amber-100 text-terracotta' : 'bg-sandstone text-espresso'
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                    <h3 className="text-xl font-extrabold text-espresso">{plan.name}</h3>
                    <p className="text-xs text-warmmuted mt-1 min-h-[34px] leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="mt-5 pb-5 border-b border-warmborder">
                      <span className="text-2xl font-extrabold text-espresso">
                        {getPlanDisplayPrice(plan)}
                      </span>
                      <p className="text-[11px] text-warmmuted mt-0.5">
                        Konsultasi kustomisasi sesuai skala unit developer
                      </p>
                    </div>

                    {/* Highlights */}
                    <div className="mt-5 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-espresso">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>Maks. {plan.max_active_projects >= 999 ? 'Tak Terbatas' : `${plan.max_active_projects} Proyek Aktif`}</span>
                      </div>
                      <div className="flex items-center gap-2 font-semibold text-espresso">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>Maks. {plan.max_sales_users >= 999 ? 'Tak Terbatas' : `${plan.max_sales_users} User Sales`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-espresso">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>Surat Cinta 99 Keunggulan (Gratis)</span>
                      </div>
                      <div className="flex items-center gap-2 text-espresso">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>Target Penjualan s.d. Sold Out</span>
                      </div>
                      <div className="flex items-center gap-2 text-espresso">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>
                          {plan.code === 'gold' ? 'Playbook Manual' : 'Playbook + TL Full AI'}
                        </span>
                      </div>
                      {plan.code === 'diamond' && (
                        <div className="flex items-center gap-2 text-terracotta font-bold">
                          <Sparkles className="size-4 text-terracotta shrink-0" />
                          <span>SM Semi-AI (Manusia Menyetujui)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-warmborder">
                    <button
                      onClick={onOpenWizard}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isPopular
                          ? 'bg-terracotta text-white hover:bg-terracotta/90 shadow-xs'
                          : 'bg-sandstone text-espresso hover:bg-espresso hover:text-white'
                      }`}
                    >
                      <span>Mulai dengan {plan.name}</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Matrix View */
          <div className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-warmborder bg-sandstone/60 font-bold text-espresso">
                    <th className="py-4 px-6 text-sm">Fitur / Layanan</th>
                    <th className="py-4 px-4 w-1/4">Gold</th>
                    <th className="py-4 px-4 w-1/4 bg-amber-50/50 text-terracotta">Platinum (Populer)</th>
                    <th className="py-4 px-4 w-1/4">Diamond (Enterprise)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmborder">
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-sandstone/30">
                      <td className="py-3 px-6 font-semibold text-espresso">{row.name}</td>
                      <td className="py-3 px-4 text-warmmuted">
                        {typeof row.gold === 'boolean' ? (
                          row.gold ? <Check className="size-4 text-olive" /> : <Minus className="size-4 text-warmmuted/40" />
                        ) : (
                          <span>{row.gold}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 bg-amber-50/30 font-semibold text-espresso">
                        {typeof row.plat === 'boolean' ? (
                          row.plat ? <Check className="size-4 text-olive" /> : <Minus className="size-4 text-warmmuted/40" />
                        ) : (
                          <span className={row.plat.includes('AI') ? 'text-terracotta font-bold' : ''}>{row.plat}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-espresso">
                        {typeof row.diam === 'boolean' ? (
                          row.diam ? <Check className="size-4 text-olive" /> : <Minus className="size-4 text-warmmuted/40" />
                        ) : (
                          <span className={row.diam.includes('AI') ? 'text-olive font-bold' : ''}>{row.diam}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-sandstone/40">
                    <td className="py-4 px-6 font-bold text-espresso">Harga Paket</td>
                    <td className="py-4 px-4 font-bold text-espresso">Hubungi Kami</td>
                    <td className="py-4 px-4 font-bold text-terracotta bg-amber-50/50">Hubungi Kami</td>
                    <td className="py-4 px-4 font-bold text-espresso">Hubungi Kami</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
