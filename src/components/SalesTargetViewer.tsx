// ============================================================================
// SALES TARGET VIEWER COMPONENT - DEVELOPER SALES OS
// Interactive Target Planning, Scenarios, and Reverse-Funnel Engine
// ============================================================================

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Download,
  Layers,
  X,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import {
  calculateSalesTargetPlan,
  formatRupiah,
} from '../lib/sales-target/calculator';
import { generateSalesTargetDocx } from '../lib/exporters/sales-target-docx';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';
import type {
  SalesTargetPlan,
  ScenarioType,
} from '../lib/sales-target/types';

const VALID_SCENARIOS: ScenarioType[] = ['konservatif', 'realistis', 'optimis'];

interface SalesTargetViewerProps {
  projectId?: string;
  projectName?: string;
  totalUnits?: number;
  avgPriceIdr?: number;
  seHeadcount?: number;
  isDemoMode?: boolean;
  variant?: 'modal' | 'page';
  onClose?: () => void;
}

export function SalesTargetViewer({
  projectId = 'proj-the-park-01',
  projectName = 'The Park Townhouse Sukoharjo',
  totalUnits = 30,
  avgPriceIdr = 900000000,
  seHeadcount = 3,
  isDemoMode = false,
  variant = 'modal',
  onClose,
}: SalesTargetViewerProps) {
  const [scenario, setScenario] = useState<ScenarioType>(() => {
    const urlTab = variant === 'page' ? getQueryParam('tab') : null;
    if (urlTab && VALID_SCENARIOS.includes(urlTab as ScenarioType)) {
      return urlTab as ScenarioType;
    }
    return loadPersistedState<ScenarioType>(`devos_target_scenario_${projectId}`, 'realistis');
  });
  const [unitsInput, setUnitsInput] = useState<number>(() =>
    loadPersistedState<number>(`devos_target_units_${projectId}`, totalUnits)
  );
  const [priceInput, setPriceInput] = useState<number>(() =>
    loadPersistedState<number>(`devos_target_price_${projectId}`, avgPriceIdr)
  );
  const [seCountInput, setSeCountInput] = useState<number>(() =>
    loadPersistedState<number>(`devos_target_se_${projectId}`, seHeadcount)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    savePersistedState(`devos_target_scenario_${projectId}`, scenario);
    if (variant === 'page') {
      setQueryParam('tab', scenario);
    }
  }, [scenario, projectId, variant]);

  useEffect(() => {
    savePersistedState(`devos_target_units_${projectId}`, unitsInput);
    savePersistedState(`devos_target_price_${projectId}`, priceInput);
    savePersistedState(`devos_target_se_${projectId}`, seCountInput);
  }, [unitsInput, priceInput, seCountInput, projectId]);

  // Recalculate plan based on user inputs
  const fullPlan: SalesTargetPlan = calculateSalesTargetPlan(
    {
      projectId,
      projectName,
      totalUnits: unitsInput,
      avgPriceIdr: priceInput,
      seHeadcount: seCountInput,
    },
    scenario
  );

  // Apply 25% server-side teaser if in demo mode
  const displayedPlan: SalesTargetPlan = isDemoMode
    ? {
        ...fullPlan,
        monthlySchedules: fullPlan.monthlySchedules.slice(0, Math.max(1, Math.round(fullPlan.monthlySchedules.length * 0.25))),
        seAllocations: fullPlan.seAllocations.slice(0, 1),
      }
    : fullPlan;

  const activeScenarioDetail = fullPlan.scenarios[scenario];

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      const blob = await generateSalesTargetDocx(fullPlan);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Target_Penjualan_${projectName.replace(/\s+/g, '_')}_${scenario}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMessage('Dokumen DOCX Target Penjualan berhasil diunduh (Bersih dari token)');
    } catch {
      setToastMessage('Gagal mengunduh dokumen DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const outerClass =
    variant === 'page'
      ? 'w-full'
      : 'fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200';
  const cardClass =
    variant === 'page'
      ? 'bg-white rounded-2xl border border-warmborder w-full flex flex-col overflow-hidden shadow-xs'
      : 'bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden';

  return (
    <div className={outerClass}>
      <div className={cardClass}>
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 bg-sandstone/60 border-b border-warmborder flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="size-10 sm:size-11 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm shrink-0">
              <TrendingUp className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-espresso tracking-tight leading-snug">
                  Target Penjualan Menuju Sold Out 100%
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-terracotta/10 text-terracotta border border-terracotta/20 shrink-0">
                  {fullPlan.totalUnits} Unit
                </span>
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    Mode Cuplikan 25% (Demo)
                  </span>
                )}
              </div>
              <p className="text-xs text-warmmuted mt-0.5 leading-relaxed">
                {fullPlan.projectName} · Total Nilai Proyek: {formatRupiah(fullPlan.totalProjectRevenueIdr)}
              </p>
            </div>
            {variant === 'modal' && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup Target Penjualan"
                className="sm:hidden size-10 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-terracotta text-white hover:bg-terracotta/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="size-3.5 shrink-0" />
              <span>{isExporting ? 'Mengekspor...' : 'Ekspor DOCX'}</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold bg-sandstone hover:bg-warmborder text-espresso items-center gap-1 transition-colors cursor-pointer hidden md:flex whitespace-nowrap"
            >
              <ExternalLink className="size-3.5" />
              <span>Cetak PDF</span>
            </button>

            {variant === 'modal' && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup Target Penjualan"
                className="hidden sm:flex size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso items-center justify-center transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5] space-y-6">
          {/* Top Banner: Sold Out Countdown & Skenario Switcher */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['konservatif', 'realistis', 'optimis'] as ScenarioType[]).map((scKey) => {
              const sc = fullPlan.scenarios[scKey];
              const isSelected = scenario === scKey;
              return (
                <button
                  key={scKey}
                  onClick={() => setScenario(scKey)}
                  className={`p-4 rounded-3xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-terracotta shadow-lg shadow-terracotta/5 ring-2 ring-terracotta/20'
                      : 'bg-white/80 border-warmborder hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-terracotta' : 'text-warmmuted'}`}>
                        {sc.label.split('(')[0]}
                      </span>
                      {isSelected && (
                        <span className="size-2 rounded-full bg-terracotta animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-espresso">{sc.monthsToSoldOut}</span>
                      <span className="text-xs font-extrabold text-espresso">Bulan</span>
                      <span className="text-xs text-warmmuted ml-1">menuju sold out</span>
                    </div>
                    <p className="text-xs font-medium text-warmmuted mt-1">
                      Laju Penjualan: <strong className="text-espresso">{sc.velocityUnitsPerMonth} unit/bulan</strong>
                    </p>
                  </div>
                  <p className="text-[11px] text-warmmuted mt-3 pt-2 border-t border-warmborder/60">
                    {sc.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Interactive Parameter Controls */}
          <div className="bg-white p-5 rounded-3xl border border-warmborder shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-warmmuted mb-3 flex items-center gap-2">
              <Layers className="size-4 text-terracotta" />
              Sesuaikan Parameter Proyek (Simulasi Fleksibel)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-espresso block mb-1">Total Unit Proyek</label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={unitsInput}
                  onChange={(e) => setUnitsInput(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl border border-warmborder text-xs font-bold text-espresso bg-sandstone/30 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-espresso block mb-1">Rata-rata Harga per Unit (Rp)</label>
                <input
                  type="number"
                  step="50000000"
                  min="100000000"
                  value={priceInput}
                  onChange={(e) => setPriceInput(Math.max(100000000, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl border border-warmborder text-xs font-bold text-espresso bg-sandstone/30 focus:outline-none focus:border-terracotta"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-espresso block mb-1">Headcount Sales Executive (SE)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={seCountInput}
                  onChange={(e) => setSeCountInput(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl border border-warmborder text-xs font-bold text-espresso bg-sandstone/30 focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>
          </div>

          {/* Sold Out Curve & Milestone Visualization */}
          <div className="bg-white p-6 rounded-3xl border border-warmborder shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-espresso">
                  Kurva Proyeksi Penjualan Kumulatif (Menuju 100% Sold Out)
                </h3>
                <p className="text-xs text-warmmuted">
                  Berdasarkan skenario {activeScenarioDetail.label} ({activeScenarioDetail.velocityUnitsPerMonth} unit/bulan)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-terracotta">
                  <span className="size-2.5 rounded-full bg-terracotta" />
                  Target Kumulatif (Unit)
                </span>
                <span className="flex items-center gap-1.5 font-bold text-olive">
                  <span className="size-2.5 rounded-full bg-olive" />
                  Target Omset (IDR)
                </span>
              </div>
            </div>

            {/* SVG Trajectory Chart */}
            <div className="h-44 w-full bg-sandstone/30 rounded-2xl p-4 border border-warmborder/60 relative flex items-end justify-between gap-1 overflow-x-auto">
              {displayedPlan.monthlySchedules.map((row) => {
                const heightPct = Math.min(100, row.percentSoldOut);
                return (
                  <div key={row.monthIndex} className="flex-1 flex flex-col items-center h-full justify-end min-w-[36px] group">
                    <div className="text-[10px] font-bold text-warmmuted group-hover:text-espresso mb-1">
                      {row.percentSoldOut}%
                    </div>
                    <div
                      className="w-full max-w-[28px] bg-terracotta rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-sm"
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                    <div className="text-[10px] font-extrabold text-espresso mt-1 whitespace-nowrap">
                      B{row.monthIndex}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reverse Funnel SE Activity Table */}
          <div className="bg-white rounded-3xl border border-warmborder shadow-sm overflow-hidden">
            <div className="p-5 border-b border-warmborder flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-espresso">
                  Jadwal Bulanan & Kebutuhan Aktivitas Reverse-Funnel
                </h3>
                <p className="text-xs text-warmmuted">
                  Berapa leads, kontak, dan survei yang wajib dihasilkan tim sales agar closing tercapai
                </p>
              </div>
              {isDemoMode && (
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  Cuplikan 25% (Hanya {displayedPlan.monthlySchedules.length} Bulan Pertama)
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sandstone/50 border-b border-warmborder text-[11px] font-extrabold text-espresso uppercase tracking-wider">
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-3">Target Unit</th>
                    <th className="py-3 px-3">Kumulatif</th>
                    <th className="py-3 px-3">Sisa Unit</th>
                    <th className="py-3 px-4">Target Omset</th>
                    <th className="py-3 px-3 bg-amber-50/50 text-terracotta">Booking (1.5x)</th>
                    <th className="py-3 px-3 bg-amber-50/50 text-terracotta">Survei (6x)</th>
                    <th className="py-3 px-3 bg-amber-50/50 text-terracotta">Kontak (40x)</th>
                    <th className="py-3 px-3 bg-amber-50/50 text-terracotta">Leads (120x)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmborder">
                  {displayedPlan.monthlySchedules.map((row) => (
                    <tr key={row.monthIndex} className="hover:bg-sandstone/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-espresso">{row.monthLabel}</td>
                      <td className="py-3 px-3 font-extrabold text-terracotta">{row.targetUnits} Unit</td>
                      <td className="py-3 px-3 font-medium text-espresso">
                        {row.cumulativeSoldUnits} Unit ({row.percentSoldOut}%)
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-warmmuted">{row.remainingUnits}</td>
                      <td className="py-3 px-4 font-mono font-bold text-olive">
                        {formatRupiah(row.monthlyRevenueIdr)}
                      </td>
                      <td className="py-3 px-3 bg-amber-50/30 font-bold text-espresso">
                        {row.reverseFunnel.requiredBookings}
                      </td>
                      <td className="py-3 px-3 bg-amber-50/30 font-bold text-espresso">
                        {row.reverseFunnel.requiredSiteVisits}
                      </td>
                      <td className="py-3 px-3 bg-amber-50/30 font-medium text-warmmuted">
                        {row.reverseFunnel.requiredContacts}
                      </td>
                      <td className="py-3 px-3 bg-amber-50/30 font-medium text-warmmuted">
                        {row.reverseFunnel.requiredLeads}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isDemoMode && (
              <div className="p-4 bg-amber-50/60 border-t border-amber-200 flex items-center justify-between text-xs">
                <span className="text-amber-900 font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-700" />
                  Sisa bulan hingga sold out 100% dipotong di mode demo.
                </span>
                <span className="font-bold text-terracotta">Buka di Paket Lengkap &rarr;</span>
              </div>
            )}
          </div>

          {/* Allocation per SE */}
          <div className="bg-white p-6 rounded-3xl border border-warmborder shadow-sm">
            <h3 className="text-sm font-extrabold text-espresso mb-1">
              Alokasi Target Otomatis per Sales Executive ({displayedPlan.seHeadcount} SE)
            </h3>
            <p className="text-xs text-warmmuted mb-4">
              Dihitung otomatis membagi target kecepatan bulanan ({activeScenarioDetail.velocityUnitsPerMonth} unit) secara merata.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayedPlan.seAllocations.map((alloc) => (
                <div key={alloc.seIndex} className="p-4 rounded-2xl bg-sandstone/40 border border-warmborder">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-terracotta">{alloc.seName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-warmborder text-espresso">
                      In-House
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-warmmuted">Target Bulanan:</span>
                      <strong className="text-espresso">{alloc.monthlyUnitTarget} Unit / bln</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warmmuted">Target Omset:</span>
                      <strong className="text-olive">{formatRupiah(alloc.monthlyRevenueTargetIdr)}</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-warmborder/60">
                      <span className="text-warmmuted">Survei Mingguan:</span>
                      <strong className="text-espresso">≥ {alloc.weeklySiteVisitTarget} Survei</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warmmuted">Kontak Harian:</span>
                      <strong className="text-espresso">≥ {alloc.dailyContactTarget} Prospek</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-espresso text-white text-xs font-medium flex items-center justify-between animate-in slide-in-from-bottom-2 shrink-0">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-amber-400 font-bold hover:underline">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
