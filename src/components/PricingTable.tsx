import React, { useState } from 'react';
import { PLANS_CONFIG, getPlanDisplayPrice } from '../lib/plans/plans-config';
import { Check, Minus } from 'lucide-react';

interface PricingTableProps {
  onOpenWizard: () => void;
}

export const PricingTable: React.FC<PricingTableProps> = ({ onOpenWizard }) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');

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
    <section id="paket-harga" className="py-12 sm:py-16 lg:py-20 bg-sandstone border-b border-warmborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + View Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-terracotta font-semibold">
              Skala &amp; Kapasitas
            </p>
            <h2 className="text-section-display font-extrabold text-espresso mt-2">
              Pilih kapasitas mesin penjualan proyek Anda.
            </h2>
            <p className="text-sm sm:text-base text-warmmuted mt-2 leading-relaxed">
              Seluruh paket membuka Surat Cinta 99 Keunggulan gratis di awal. Fitur dikontrol dinamis sesuai skala tim developer.
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
                      <h3 className="text-xl font-extrabold text-espresso">{plan.name}</h3>
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
                      <span className="text-2xl font-extrabold text-espresso">
                        {getPlanDisplayPrice(plan)}
                      </span>
                      <p className="text-xs text-warmmuted mt-1">
                        Penyesuaian sesuai jumlah klaster &amp; unit
                      </p>
                    </div>

                    <ul className="mt-5 space-y-2.5 text-sm">
                      <li className="flex items-center gap-2.5 font-medium text-espresso">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>
                          Maks. {plan.max_active_projects >= 999 ? 'Tak Terbatas' : `${plan.max_active_projects} Proyek Aktif`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5 font-medium text-espresso">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>
                          Maks. {plan.max_sales_users >= 999 ? 'Tak Terbatas' : `${plan.max_sales_users} User Sales`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2.5 text-espresso/90">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>Surat Cinta 99 Keunggulan (Gratis)</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-espresso/90">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>Target Penjualan s.d. Sold Out</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-espresso/90">
                        <Check className="size-4 text-olive shrink-0" />
                        <span>{plan.code === 'gold' ? 'Playbook Manual' : 'Playbook + TL Full AI'}</span>
                      </li>
                      {plan.code === 'diamond' && (
                        <li className="flex items-center gap-2.5 text-terracotta font-semibold">
                          <Check className="size-4 text-terracotta shrink-0" />
                          <span>SM Semi-AI (Persetujuan Manusia)</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-7 pt-5 border-t border-warmborder">
                    <button
                      onClick={onOpenWizard}
                      className={`w-full min-h-[48px] px-4 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                        isPopular
                          ? 'bg-terracotta text-white hover:bg-terracotta/90'
                          : 'bg-sandstone text-espresso hover:bg-espresso hover:text-sandstone border border-warmborder'
                      }`}
                    >
                      Mulai dengan {plan.name}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface border border-warmborder rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-warmborder bg-sandstone/60 font-bold text-espresso">
                    <th className="py-3.5 px-4 sm:px-6">Fitur / Layanan</th>
                    <th className="py-3.5 px-4 w-1/5">Gold</th>
                    <th className="py-3.5 px-4 w-1/5 text-terracotta">Platinum</th>
                    <th className="py-3.5 px-4 w-1/5">Diamond</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmborder">
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-sandstone/30">
                      <td className="py-3 px-4 sm:px-6 font-medium text-espresso">{row.name}</td>
                      <td className="py-3 px-4 text-warmmuted">
                        {typeof row.gold === 'boolean' ? (
                          row.gold ? <Check className="size-4 text-olive" /> : <Minus className="size-4 text-warmmuted/40" />
                        ) : (
                          <span>{row.gold}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-espresso">
                        {typeof row.plat === 'boolean' ? (
                          row.plat ? <Check className="size-4 text-olive" /> : <Minus className="size-4 text-warmmuted/40" />
                        ) : (
                          <span className={row.plat.includes('AI') ? 'text-terracotta' : ''}>{row.plat}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-espresso">
                        {typeof row.diam === 'boolean' ? (
                          row.diam ? <Check className="size-4 text-olive" /> : <Minus className="size-4 text-warmmuted/40" />
                        ) : (
                          <span className={row.diam.includes('AI') ? 'text-olive' : ''}>{row.diam}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
