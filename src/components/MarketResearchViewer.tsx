// ============================================================================
// MARKET RESEARCH VIEWER COMPONENT - DEVELOPER SALES OS
// Warm Terracotta & Sandstone Design with Data-Driven SVG Infographics
// ============================================================================

import { useEffect, useState } from 'react';
import {
  Users,
  Compass,
  Building,
  PieChart,
  Download,
  RefreshCw,
  X,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  DEFAULT_THE_PARK_RESEARCH_REPORT,
} from '../lib/market-research/the-park-market-research';
import {
  getMarketResearchReport,
  regenerateMarketResearch,
} from '../lib/market-research/market-research-engine';
import { generateMarketResearchDocx } from '../lib/exporters/market-research-docx';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';
import type { MarketResearchReport, TargetPersona, RadiusDistanceMeters } from '../lib/market-research/types';

type ResearchTab = 'personas' | 'facilities' | 'competitors' | 'market_share';
const VALID_RESEARCH_TABS: ResearchTab[] = ['personas', 'facilities', 'competitors', 'market_share'];

interface MarketResearchViewerProps {
  projectId?: string;
  projectName?: string;
  userRole?: string;
  isDemoMode?: boolean;
  variant?: 'modal' | 'page';
  onClose?: () => void;
}

export function MarketResearchViewer({
  projectId = 'proj-the-park-01',
  projectName = 'The Park Townhouse Sukoharjo',
  userRole = 'DIREKSI',
  isDemoMode = false,
  variant = 'modal',
  onClose,
}: MarketResearchViewerProps) {
  const [report, setReport] = useState<MarketResearchReport>(() =>
    getMarketResearchReport({ projectId, isDemoMode })
  );
  const [activeTab, setActiveTab] = useState<ResearchTab>(() => {
    const urlTab = variant === 'page' ? getQueryParam('tab') : null;
    if (urlTab && VALID_RESEARCH_TABS.includes(urlTab as ResearchTab)) {
      return urlTab as ResearchTab;
    }
    return loadPersistedState<ResearchTab>(`devos_research_tab_${projectId}`, 'personas');
  });
  const [selectedPersona, setSelectedPersona] = useState<TargetPersona>(report.personas[0] || DEFAULT_THE_PARK_RESEARCH_REPORT.personas[0]);
  const [selectedRadiusRing, setSelectedRadiusRing] = useState<number | 'all'>(() =>
    loadPersistedState<number | 'all'>(`devos_research_radius_${projectId}`, 'all')
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    savePersistedState(`devos_research_tab_${projectId}`, activeTab);
    if (variant === 'page') {
      setQueryParam('tab', activeTab);
    }
  }, [activeTab, projectId, variant]);

  useEffect(() => {
    savePersistedState(`devos_research_radius_${projectId}`, selectedRadiusRing);
  }, [selectedRadiusRing, projectId]);

  const canRegenerate = ['DEVELOPER_OWNER', 'DIREKSI', 'SALES_MANAGER', 'SM'].includes(userRole);

  const handleRegenerate = () => {
    if (!canRegenerate) {
      setToastMessage('Akses ditolak: Hanya Direksi atau Sales Manager yang dapat memperbarui riset.');
      return;
    }
    setIsRegenerating(true);
    setTimeout(() => {
      try {
        const updated = regenerateMarketResearch(projectId, projectName, userRole);
        setReport(updated);
        setSelectedPersona(updated.personas[0]);
        setToastMessage(`Riset Pasar berhasil diperbarui ke Versi ${updated.version}!`);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setToastMessage(err.message);
        } else {
          setToastMessage('Gagal memperbarui riset.');
        }
      } finally {
        setIsRegenerating(false);
      }
    }, 600);
  };

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      const blob = await generateMarketResearchDocx(report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Riset_Pasar_${projectName.replace(/\s+/g, '_')}_v${report.version}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMessage('Dokumen DOCX Riset Pasar berhasil diunduh (Bersih dari token)');
    } catch {
      setToastMessage('Gagal mengunduh DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const filteredFacilities = selectedRadiusRing === 'all'
    ? report.facilities
    : report.facilities.filter((f) => f.radiusRing <= (selectedRadiusRing as RadiusDistanceMeters));

  const filteredCompetitors = selectedRadiusRing === 'all'
    ? report.competitors
    : report.competitors.filter((c) => c.radiusRing <= (selectedRadiusRing as RadiusDistanceMeters));

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
        {/* Header (Mobile-first stacking agar judul & tombol tidak berjejalan) */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 bg-sandstone/60 border-b border-warmborder flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="size-10 sm:size-11 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm shrink-0">
              <Compass className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-espresso tracking-tight leading-snug">
                  Riset Pasar &amp; Analisis Kompetisi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-terracotta/10 text-terracotta border border-terracotta/20 shrink-0">
                  v{report.version}
                </span>
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    Mode Cuplikan 25% (Demo)
                  </span>
                )}
              </div>
              <p className="text-xs text-warmmuted mt-0.5 leading-relaxed">
                {report.projectName} · Radius 500m s.d 25km Sukoharjo &amp; Solo Raya
              </p>
            </div>
            {variant === 'modal' && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup Riset Pasar"
                className="sm:hidden size-10 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canRegenerate && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-warmborder text-espresso hover:bg-sandstone flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`size-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Meriset Ulang...' : 'Regenerate'}</span>
              </button>
            )}

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
                aria-label="Tutup Riset Pasar"
                className="hidden sm:flex size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso items-center justify-center transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-warmborder px-4 sm:px-6 bg-white gap-1 sm:gap-2 overflow-x-auto no-scrollbar snap-x shrink-0">
          <button
            onClick={() => setActiveTab('personas')}
            className={`min-h-[44px] py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start ${
              activeTab === 'personas'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-warmmuted hover:text-espresso'
            }`}
          >
            <Users className="size-4 shrink-0" />
            <span>5 Persona Target ({report.personas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`min-h-[44px] py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start ${
              activeTab === 'facilities'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-warmmuted hover:text-espresso'
            }`}
          >
            <Compass className="size-4 shrink-0" />
            <span>Fasilitas Publik ({report.facilities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('competitors')}
            className={`min-h-[44px] py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start ${
              activeTab === 'competitors'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-warmmuted hover:text-espresso'
            }`}
          >
            <Building className="size-4 shrink-0" />
            <span>Kompetitor ({report.competitors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('market_share')}
            className={`min-h-[44px] py-3 px-3.5 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start ${
              activeTab === 'market_share'
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-warmmuted hover:text-espresso'
            }`}
          >
            <PieChart className="size-4 shrink-0" />
            <span>Pangsa Pasar (SVG)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5]">
          {/* TAB 1: PERSONAS */}
          {activeTab === 'personas' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Persona List Selector */}
              <div className="lg:col-span-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-warmmuted mb-3">
                  Pilih Profil Persona ({report.personas.length} Terdefinisi)
                </p>
                {report.personas.map((persona, index) => {
                  const isSelected = selectedPersona.id === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersona(persona)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-white border-terracotta shadow-md shadow-terracotta/5'
                          : 'bg-white/70 border-warmborder hover:bg-white hover:border-warmmuted/50'
                      }`}
                    >
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-terracotta text-white' : 'bg-sandstone text-espresso'
                        }`}
                      >
                        P{index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-espresso leading-snug truncate">
                          {persona.name}
                        </p>
                        <p className="text-[11px] text-warmmuted truncate mt-0.5">
                          {persona.demographics.ageRange} · {persona.demographics.monthlyIncome}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {isDemoMode && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mt-4">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="size-4 text-amber-700" />
                      Cuplikan Demo 25%
                    </p>
                    <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                      Akun demo menampilkan 1 dari 5 persona target lengkap. Tingkatkan ke paket berbayar untuk membuka seluruh profil persona dan ekspor tak terbatas.
                    </p>
                  </div>
                )}
              </div>

              {/* Persona Details Drawer */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-warmborder shadow-sm space-y-6">
                <div className="border-b border-warmborder pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-terracotta uppercase tracking-wider">
                    <span>{selectedPersona.code}</span>
                    <span>·</span>
                    <span>{selectedPersona.subtitle}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-espresso mt-1">
                    {selectedPersona.name}
                  </h3>
                </div>

                {/* Demographics Card */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-sandstone/50 border border-warmborder">
                  <div>
                    <span className="text-[11px] text-warmmuted block">Usia & Status</span>
                    <span className="text-xs font-bold text-espresso">{selectedPersona.demographics.ageRange}</span>
                    <span className="text-[11px] text-warmmuted block mt-0.5">{selectedPersona.demographics.householdType}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-warmmuted block">Estimasi Penghasilan</span>
                    <span className="text-xs font-bold text-olive">{selectedPersona.demographics.monthlyIncome}</span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-[11px] text-warmmuted block">Domisili Saat Ini</span>
                    <span className="text-xs font-medium text-espresso">{selectedPersona.demographics.currentResidence}</span>
                  </div>
                  <div className="col-span-2 md:col-span-3 pt-2 border-t border-warmborder/60">
                    <span className="text-[11px] text-warmmuted block mb-1">Profesi Khas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPersona.demographics.profession.map((prof, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-white border border-warmborder text-[11px] text-espresso font-medium">
                          {prof}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Needs & Pain Points */}
                <div>
                  <h4 className="text-xs font-extrabold text-espresso uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-terracotta" />
                    Kebutuhan Utama & Masalah yang Dihadapi (Needs & Pains)
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedPersona.needsAndPains.map((item, idx) => (
                      <li key={idx} className="text-xs text-espresso flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                        <CheckCircle className="size-3.5 text-terracotta shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Objections & Solutions */}
                <div>
                  <h4 className="text-xs font-extrabold text-espresso uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500" />
                    Keberatan Umum & Keraguan Konsumen (Common Objections)
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedPersona.commonObjections.map((item, idx) => (
                      <li key={idx} className="text-xs text-espresso italic bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Preferred Channels & Buying Triggers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-warmborder">
                    <h5 className="text-xs font-bold text-espresso mb-2">Kanal Penjualan Paling Efektif</h5>
                    <ul className="space-y-1 text-xs text-warmmuted">
                      {selectedPersona.preferredChannels.map((c, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-terracotta" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-warmborder">
                    <h5 className="text-xs font-bold text-espresso mb-2">Pemicu Keputusan Beli (Triggers)</h5>
                    <ul className="space-y-1 text-xs text-warmmuted">
                      {selectedPersona.buyingTriggers.map((t, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-olive" />
                          <span className="text-espresso font-medium">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Citation of KB Facts */}
                <div className="pt-2 border-t border-warmborder flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-warmmuted flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-olive" />
                    Terverifikasi Fakta Knowledge Base:
                  </span>
                  {selectedPersona.relevantFactIds.map((fid) => (
                    <span key={fid} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sandstone text-espresso border border-warmborder">
                      {fid}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACILITIES */}
          {activeTab === 'facilities' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-warmborder">
                <span className="text-xs font-bold text-espresso">Filter Cincin Radius dari Lokasi Proyek:</span>
                <div className="flex flex-wrap gap-1">
                  {(['all', 500, 1000, 2000, 3000, 5000, 10000, 15000, 20000, 25000] as (number | 'all')[]).map((r) => (
                    <button
                      key={String(r)}
                      onClick={() => setSelectedRadiusRing(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedRadiusRing === r
                          ? 'bg-terracotta text-white shadow-sm'
                          : 'bg-sandstone text-warmmuted hover:text-espresso'
                      }`}
                    >
                      {r === 'all' ? 'Semua Ring' : r >= 1000 ? `${r / 1000} km` : `${r} m`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFacilities.map((fac) => (
                  <div key={fac.id} className="bg-white rounded-2xl p-4 border border-warmborder shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-terracotta border border-amber-200">
                          Ring {fac.radiusRing >= 1000 ? `${fac.radiusRing / 1000} km` : `${fac.radiusRing} m`}
                        </span>
                        <span className="text-xs font-bold text-olive">± {fac.driveTimeMinutes} mnt</span>
                      </div>
                      <h4 className="text-xs font-bold text-espresso leading-snug">{fac.name}</h4>
                      <p className="text-[11px] text-warmmuted mt-1">{fac.category}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-warmborder/60 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-espresso">Jarak: {fac.distanceKmFormatted}</span>
                      <span className="text-warmmuted text-[10px] italic truncate max-w-[150px]">{fac.citation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMPETITORS */}
          {activeTab === 'competitors' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCompetitors.map((comp) => (
                  <div key={comp.id} className="bg-white rounded-3xl p-5 border border-warmborder shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-terracotta uppercase tracking-wider">
                          Radius {comp.distanceKm} km · {comp.developer}
                        </span>
                        {comp.isDemoVerified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-100 text-olive">
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            DEMO
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-espresso mt-1">{comp.name}</h4>
                      <p className="text-xs font-bold text-olive mt-0.5">{comp.priceRange}</p>

                      <div className="mt-4 space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-sandstone/50 border border-warmborder">
                          <span className="font-bold text-espresso block mb-0.5">Kelebihan Kompetitor:</span>
                          <span className="text-warmmuted">{comp.strengths.join(', ')}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                          <span className="font-bold text-rose-800 block mb-0.5">Kelemahan Kompetitor:</span>
                          <span className="text-rose-700">{comp.weaknesses.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-terracotta/30">
                      <span className="text-[11px] font-extrabold text-terracotta uppercase tracking-wider block">
                        Keunggulan Menang The Park Townhouse:
                      </span>
                      <p className="text-xs font-bold text-espresso mt-1 leading-snug">
                        {comp.theParkAdvantage}
                      </p>
                      <span className="text-[10px] font-mono font-bold text-warmmuted mt-1 block">
                        Sitasi: {comp.advantageFactId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MARKET SHARE & DATA-DRIVEN SVG */}
          {activeTab === 'market_share' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* SVG Donut Chart */}
              <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-warmborder shadow-sm flex flex-col items-center justify-center">
                <h4 className="text-xs font-extrabold text-espresso uppercase tracking-wider mb-4">
                  Estimasi Pangsa Pasar Unit Baru Sukoharjo
                </h4>

                {/* SVG Visual */}
                <div className="relative my-2">
                  <svg viewBox="0 0 220 220" className="w-56 h-56 -rotate-90">
                    {(() => {
                      const radius = 80;
                      const strokeWidth = 32;
                      const circ = 2 * Math.PI * radius;
                      let acc = 0;
                      return report.marketShare.slices.map((slice, i) => {
                        const dash = `${(slice.sharePercent / 100) * circ} ${circ}`;
                        const offset = -((acc / 100) * circ);
                        acc += slice.sharePercent;
                        return (
                          <circle
                            key={i}
                            cx="110"
                            cy="110"
                            r={radius}
                            fill="transparent"
                            stroke={slice.colorHex}
                            strokeWidth={strokeWidth}
                            strokeDasharray={dash}
                            strokeDashoffset={offset}
                            className="transition-all hover:opacity-80"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-espresso">{report.marketShare.slices[0]?.sharePercent}%</span>
                    <span className="text-[10px] font-bold text-warmmuted uppercase">The Park</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="w-full space-y-2 mt-4">
                  {report.marketShare.slices.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-sandstone/40 border border-warmborder/50">
                      <div className="flex items-center gap-2">
                        <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: s.colorHex }} />
                        <span className={`font-semibold ${s.isOurProject ? 'text-terracotta font-bold' : 'text-espresso'}`}>
                          {s.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-warmmuted text-[11px]">{s.unitsAvailable} Unit</span>
                        <span className="font-extrabold text-espresso w-12 text-right">{s.sharePercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Benchmark Bar Chart */}
              <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-warmborder shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-espresso uppercase tracking-wider mb-2">
                    Perbandingan Harga per m² (Benchmark)
                  </h4>
                  <p className="text-xs text-warmmuted mb-4">
                    The Park Townhouse menempati posisi paling kompetitif untuk townhouse 2 lantai berkualitas.
                  </p>

                  <div className="space-y-3">
                    {report.marketShare.priceBenchmarks.map((bm, i) => {
                      const maxPrice = 13000000;
                      const pct = Math.round((bm.pricePerM2 / maxPrice) * 100);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-bold ${bm.isOurProject ? 'text-terracotta' : 'text-espresso'}`}>
                              {bm.propertyName} {bm.isOurProject && '★'}
                            </span>
                            <span className="font-mono font-bold text-espresso">
                              Rp {(bm.pricePerM2 / 1000000).toFixed(1)} Jt/m²
                            </span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-sandstone overflow-hidden border border-warmborder/50">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                bm.isOurProject ? 'bg-terracotta' : 'bg-espresso/60'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-terracotta/20 text-xs text-espresso leading-relaxed">
                  <span className="font-bold text-terracotta block mb-1">Kesimpulan Posisi Pasar:</span>
                  {report.marketShare.competitiveEdgeSummary}
                </div>
              </div>
            </div>
          )}
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
