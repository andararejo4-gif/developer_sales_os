import React from 'react';
import { computeDireksiRevenue } from '../lib/membership/project-guard';

interface DireksiMultiProjectViewProps {
  isDemoAccount?: boolean;
}

export const DireksiMultiProjectView: React.FC<DireksiMultiProjectViewProps> = ({ isDemoAccount = false }) => {
  // Proyek nyata The Park Townhouse & Proyek Kedua Demo
  const projects = [
    { id: 'proj-01', name: 'The Park Townhouse Sukoharjo', target_omset: 24500000000 },
    { id: 'proj-02', name: 'Andara Garden Regency (Tahap 2)', target_omset: 18000000000 },
  ];

  // 30 Unit The Park + sampel unit Tahap 2
  const units = [
    // The Park Units
    { project_id: 'proj-01', price_cash_hard: 850000000, status: 'terjual' as const },
    { project_id: 'proj-01', price_cash_hard: 830000000, status: 'terjual' as const },
    { project_id: 'proj-01', price_cash_hard: 830000000, status: 'terjual' as const },
    { project_id: 'proj-01', price_cash_hard: 680000000, status: 'booking' as const },
    { project_id: 'proj-01', price_cash_hard: 670000000, status: 'booking' as const },
    { project_id: 'proj-01', price_cash_hard: 580000000, status: 'tersedia' as const },

    // Andara Garden Regency Units
    { project_id: 'proj-02', price_cash_hard: 600000000, status: 'terjual' as const },
    { project_id: 'proj-02', price_cash_hard: 600000000, status: 'terjual' as const },
    { project_id: 'proj-02', price_cash_hard: 600000000, status: 'booking' as const },
  ];

  const revenueSummary = computeDireksiRevenue(projects, units);

  const rupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-espresso text-white flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-terracotta text-white uppercase tracking-wider">
            Dasbor Lintas Proyek Direksi &amp; Owner
          </span>
          <h2 className="text-lg font-bold mt-1">Konsolidasi Portofolio Penjualan Developer</h2>
          <p className="text-xs text-stone-300">
            Aktual Pendapatan murni dihitung dari unit berstatus Akad / Closing. Booking dicatat sebagai pipeline berjalan.
          </p>
        </div>
        {isDemoAccount && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-terracotta">
            Mode Cuplikan Demo (25%)
          </span>
        )}
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-warmborder shadow-2xs">
          <span className="text-xs font-bold text-warmmuted uppercase tracking-wider">Total Target Omset</span>
          <p className="text-2xl font-extrabold text-espresso mt-1">{rupiah(revenueSummary.total_target)}</p>
          <span className="text-[11px] text-warmmuted mt-1 block">Gabungan 2 Proyek Aktif</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-warmborder shadow-2xs">
          <span className="text-xs font-bold text-olive uppercase tracking-wider">Aktual Realisasi (Akad)</span>
          <p className="text-2xl font-extrabold text-olive mt-1">{rupiah(revenueSummary.total_aktual)}</p>
          <span className="text-[11px] text-olive font-semibold mt-1 block">
            {revenueSummary.total_persentase}% Tercapai (5 Unit Akad)
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-warmborder shadow-2xs">
          <span className="text-xs font-bold text-terracotta uppercase tracking-wider">Pipeline Berjalan (Booking)</span>
          <p className="text-2xl font-extrabold text-terracotta mt-1">{rupiah(revenueSummary.total_pipeline_booking)}</p>
          <span className="text-[11px] text-warmmuted mt-1 block">
            3 Unit Proses Dokumen KPR &amp; SLIK
          </span>
        </div>
      </div>

      {/* Table Per-Project Breakdown */}
      <div className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-warmborder flex items-center justify-between">
          <h3 className="text-sm font-bold text-espresso">Rincian Performa Target vs Aktual per Proyek</h3>
          <span className="text-xs font-semibold text-warmmuted">Periode Berjalan 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sandstone/60 border-b border-warmborder font-bold text-warmmuted uppercase text-[10px]">
                <th className="py-3 px-4">Nama Proyek</th>
                <th className="py-3 px-3">Target Omset</th>
                <th className="py-3 px-3">Aktual Pendapatan (Akad)</th>
                <th className="py-3 px-3">Pipeline Booking</th>
                <th className="py-3 px-3">Capaian (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {revenueSummary.per_project.map(p => (
                <tr key={p.project_id} className="hover:bg-sandstone/30">
                  <td className="py-3 px-4 font-bold text-espresso">{p.project_name}</td>
                  <td className="py-3 px-3 font-medium">{rupiah(p.target_pendapatan)}</td>
                  <td className="py-3 px-3 font-bold text-olive">{rupiah(p.aktual_pendapatan)} ({p.unit_akad_count} Unit)</td>
                  <td className="py-3 px-3 text-terracotta font-semibold">{rupiah(p.pipeline_booking_nilai)} ({p.unit_booking_count} Unit)</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-terracotta border border-amber-200">
                      {p.persentase_capaian}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
