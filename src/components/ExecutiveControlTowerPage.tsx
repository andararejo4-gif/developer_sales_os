import React, { useState } from 'react';
import {
  TrendingUp,
  Building2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Download,
} from 'lucide-react';
import type { PortfolioForecastItem } from '../lib/foundations/r3-r4-contracts';

interface ExecutiveControlTowerPageProps {
  userRole?: string;
}

export const ExecutiveControlTowerPage: React.FC<ExecutiveControlTowerPageProps> = () => {
  const [projects] = useState<PortfolioForecastItem[]>([
    {
      projectId: 'the-park-sukoharjo',
      projectName: 'The Park Townhouse Sukoharjo',
      totalUnits: 45,
      soldUnits: 28,
      targetClosingMonth: 4,
      projectedRevenueMonth: 2800000000,
      cancellationRiskPercent: 3.5,
      clusterHealth: 'EXCELLENT',
    },
    {
      projectId: 'griya-melati-asri',
      projectName: 'Griya Melati Asri Sukoharjo',
      totalUnits: 60,
      soldUnits: 42,
      targetClosingMonth: 6,
      projectedRevenueMonth: 3400000000,
      cancellationRiskPercent: 5.0,
      clusterHealth: 'STABLE',
    },
    {
      projectId: 'grand-residence-solo',
      projectName: 'Grand Solo Residence (Fase 2)',
      totalUnits: 80,
      soldUnits: 31,
      targetClosingMonth: 5,
      projectedRevenueMonth: 2900000000,
      cancellationRiskPercent: 8.2,
      clusterHealth: 'NEEDS_ATTENTION',
    },
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const totalPortfolioUnits = projects.reduce((acc, p) => acc + p.totalUnits, 0);
  const totalPortfolioSold = projects.reduce((acc, p) => acc + p.soldUnits, 0);
  const totalProjectedRevenue = projects.reduce((acc, p) => acc + p.projectedRevenueMonth, 0);
  const overallAbsorption = ((totalPortfolioSold / totalPortfolioUnits) * 100).toFixed(1);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Quiet Chrome Header */}
      <div className="bg-white border border-warmborder rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="size-10 sm:size-11 rounded-xl bg-sandstone border border-warmborder text-espresso flex items-center justify-center shrink-0">
              <TrendingUp className="size-5 text-terracotta" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-espresso">
                  Control Tower Eksekutif Portofolio
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sandstone text-espresso/80 border border-warmborder">
                  Fondasi R4 &middot; F90 &amp; F88
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5">
                Konsolidasi Seluruh Proyek &middot; Cashflow Real-Time &middot; Mitigasi Pembatalan Konsumen
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => showToastMsg('Mengekspor laporan konsolidasi eksekutif ke PDF resmi...')}
              className="h-9 px-3.5 rounded-lg border border-warmborder bg-white hover:bg-sandstone text-espresso text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="size-3.5 text-warmmuted" />
              <span>Ekspor Ringkasan</span>
            </button>
          </div>
        </div>

        {/* Quiet Info Bar */}
        <div className="pt-3 border-t border-warmborder/60 text-xs text-warmmuted flex items-start gap-2">
          <ShieldCheck className="size-4 text-olive shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-espresso">Fondasi Sinkronisasi Multi-Tenant &amp; ERP:</strong> Siap disambungkan ke database PostgreSQL pusat dan webhook ERP akuntansi pengembang saat integrasi server skala penuh diaktifkan.
          </p>
        </div>
      </div>

      {/* 4 Quiet Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Unit Portofolio</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {totalPortfolioUnits} <span className="text-xs font-normal text-warmmuted">Kavling</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Tingkat Penyerapan Pasar</span>
          <span className="text-xl font-bold text-olive mt-1 block tabular-nums">
            {overallAbsorption}% <span className="text-xs font-normal text-warmmuted">({totalPortfolioSold} Terjual)</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Proyeksi Pendapatan Bulan Ini</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            Rp {(totalProjectedRevenue / 1000000000).toFixed(2)} <span className="text-xs font-normal text-warmmuted">Miliar</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Rata-rata Risiko Batal</span>
          <span className="text-xl font-bold text-terracotta mt-1 block tabular-nums">
            5.5% <span className="text-xs font-normal text-olive font-medium">(Terkendali)</span>
          </span>
        </div>
      </div>

      {/* Tabel Health & Forecast Portofolio */}
      <div className="bg-white border border-warmborder rounded-xl overflow-hidden">
        <div className="p-4 border-b border-warmborder flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-espresso flex items-center gap-2">
            <Building2 className="size-3.5 text-terracotta" /> Kinerja Penyerapan Kavling Antar-Proyek
          </h2>
          <span className="text-[11px] text-warmmuted">Update otomatis dari Pipeline SE &amp; Booking</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sandstone/60 border-b border-warmborder text-[11px] font-semibold text-warmmuted">
              <tr>
                <th className="py-2.5 px-4">Nama Proyek Perumahan</th>
                <th className="py-2.5 px-4">Penyerapan Kavling</th>
                <th className="py-2.5 px-4">Proyeksi Cashflow</th>
                <th className="py-2.5 px-4">Risiko Batal &amp; Penyelamatan</th>
                <th className="py-2.5 px-4 text-right">Status Klaster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {projects.map((proj) => {
                const absorption = ((proj.soldUnits / proj.totalUnits) * 100).toFixed(0);
                return (
                  <tr key={proj.projectId} className="hover:bg-sandstone/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-espresso">{proj.projectName}</div>
                      <div className="text-[11px] text-warmmuted mt-0.5">ID: {proj.projectId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-espresso">
                        {proj.soldUnits} / {proj.totalUnits} Unit ({absorption}%)
                      </div>
                      <div className="w-36 h-1.5 bg-sandstone rounded-full overflow-hidden mt-1.5 border border-warmborder/40">
                        <div
                          className="h-full bg-olive rounded-full"
                          style={{ width: `${absorption}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-espresso tabular-nums">
                        Rp {(proj.projectedRevenueMonth / 1000000000).toFixed(2)} Miliar
                      </div>
                      <div className="text-[10px] text-warmmuted mt-0.5">
                        Target closing: {proj.targetClosingMonth} unit/bulan
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-espresso tabular-nums">
                          {proj.cancellationRiskPercent}%
                        </span>
                        {proj.cancellationRiskPercent > 6 ? (
                          <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-0.5">
                            <AlertTriangle className="size-3 text-amber-600" /> Perlu Rescue
                          </span>
                        ) : (
                          <span className="text-[10px] text-olive font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="size-3 text-olive" /> Aman
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-warmmuted mt-0.5">
                        Mitigasi KPR alternatif
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          proj.clusterHealth === 'EXCELLENT'
                            ? 'bg-olive/10 text-olive'
                            : proj.clusterHealth === 'STABLE'
                            ? 'bg-sandstone text-espresso/80'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {proj.clusterHealth === 'EXCELLENT'
                          ? 'Sangat Baik'
                          : proj.clusterHealth === 'STABLE'
                          ? 'Stabil'
                          : 'Perhatian'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-espresso text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-white/10 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};
