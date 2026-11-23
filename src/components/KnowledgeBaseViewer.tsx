import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Printer,
  Search,
  Calculator,
  Home,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { THE_PARK_KB_FACTS } from '../lib/kb/the-park-facts';
import type { KbFact } from '../lib/kb/types';
import { generateProductCardHtml } from '../lib/kb/product-card';
import { PLAYBOOK_UNIT_CATALOG } from '../lib/kb/playbook-v1-2-knowledge';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';

type KbTab = 'facts' | 'unit_sim';
const VALID_KB_TABS: KbTab[] = ['facts', 'unit_sim'];

export const KnowledgeBaseViewer: React.FC<{
  syncUrlTab?: boolean;
  projectId?: string;
  projectName?: string;
}> = ({
  syncUrlTab = true,
  projectId = 'the-park-sukoharjo',
  projectName = 'The Park Townhouse Sukoharjo',
}) => {
  const isThePark = projectId === 'the-park-sukoharjo' || projectId === 'proj-the-park-01';

  const [activeTab, setActiveTab] = useState<KbTab>(() => {
    const urlTab = syncUrlTab ? getQueryParam('tab') : null;
    if (urlTab && VALID_KB_TABS.includes(urlTab as KbTab)) {
      return urlTab as KbTab;
    }
    return loadPersistedState<KbTab>(`devos_kb_tab_${projectId}`, 'facts');
  });
  const [searchFact, setSearchFact] = useState(() =>
    loadPersistedState<string>(`devos_kb_search_${projectId}`, '')
  );
  const [selectedCategory, setSelectedCategory] = useState(() =>
    loadPersistedState<string>(`devos_kb_category_${projectId}`, 'semua')
  );

  // Facts store per project (hanya The Park yang memiliki fakta kurasi awal)
  const [facts, setFacts] = useState<KbFact[]>(() => {
    return loadPersistedState<KbFact[]>(
      `devos_kb_facts_${projectId}`,
      isThePark ? THE_PARK_KB_FACTS : []
    );
  });

  useEffect(() => {
    const loaded = loadPersistedState<KbFact[]>(
      `devos_kb_facts_${projectId}`,
      isThePark ? THE_PARK_KB_FACTS : []
    );
    setFacts(loaded);
  }, [projectId, isThePark]);

  const handleInitKb = () => {
    // Inisialisasi KB dasar untuk proyek baru
    const initialFacts = THE_PARK_KB_FACTS.map((f) => ({
      ...f,
      value: f.value.replace(/The Park Townhouse Sukoharjo|The Park Townhouse/g, projectName),
      source_citation: `Dokumen Resmi ${projectName}`,
    }));
    setFacts(initialFacts);
    savePersistedState(`devos_kb_facts_${projectId}`, initialFacts);
  };

  const [expandedFactId, setExpandedFactId] = useState<string | null>(null);

  // Simulasi KPR & Siteplan State
  const [simUnitIdx, setSimUnitIdx] = useState(0);
  const [simDpPercent, setSimDpPercent] = useState(10);
  const [simTenorYears, setSimTenorYears] = useState(15);
  const [simInterestRate, setSimInterestRate] = useState(6.5);

  const selectedSimUnit = PLAYBOOK_UNIT_CATALOG[simUnitIdx] || PLAYBOOK_UNIT_CATALOG[0];
  const simPrice = selectedSimUnit.priceKprIdr;
  const simDpAmount = Math.round((simPrice * simDpPercent) / 100);
  const simPlafon = Math.max(0, simPrice - simDpAmount);
  const monthlyRate = simInterestRate / 100 / 12;
  const totalMonths = simTenorYears * 12;
  const simMonthlyInstallment =
    monthlyRate > 0
      ? Math.round(
          (simPlafon * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        )
      : Math.round(simPlafon / Math.max(1, totalMonths));
  const formatIdr = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    savePersistedState('devos_kb_tab', activeTab);
    if (syncUrlTab) {
      setQueryParam('tab', activeTab);
    }
  }, [activeTab, syncUrlTab]);

  useEffect(() => {
    savePersistedState('devos_kb_search', searchFact);
    savePersistedState('devos_kb_category', selectedCategory);
  }, [searchFact, selectedCategory]);

  const categories = [
    { key: 'semua', label: 'Semua Kategori' },
    { key: 'identitas', label: 'Identitas Proyek' },
    { key: 'lokasi_akses', label: 'Lokasi & Akses' },
    { key: 'tipe_harga', label: 'Tipe & Harga' },
    { key: 'spesifikasi_bangunan', label: 'Spesifikasi Teknis' },
    { key: 'skema_pembayaran_promo', label: 'Skema Bayar' },
    { key: 'legalitas', label: 'Legalitas' },
    { key: 'fasilitas_kawasan', label: 'Fasilitas Kawasan' },
  ];

  const filteredFacts = facts.filter(f => {
    const matchesCategory = selectedCategory === 'semua' || f.category === selectedCategory;
    const matchesSearch = f.key.toLowerCase().includes(searchFact.toLowerCase()) || 
                          f.value.toLowerCase().includes(searchFact.toLowerCase()) ||
                          f.source_citation.toLowerCase().includes(searchFact.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatFactKey = (rawKey: string) =>
    rawKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const categoryLabelMap: Record<string, string> = Object.fromEntries(
    categories.map((c) => [c.key, c.label])
  );

  const handlePrintProductCard = () => {
    const html = generateProductCardHtml();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
    }
  };

  return (
    <div className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-xs mb-20 md:mb-0">
      {/* Top Header & Horizontal 2-Tab Controls (Mobile-First) */}
      <div className="p-4 sm:p-6 border-b border-warmborder bg-sandstone/30 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-terracotta text-[10px] sm:text-xs font-bold border border-amber-200 whitespace-nowrap">
                KB v1 · Fakta Terverifikasi
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-espresso mt-1 leading-snug">
              Knowledge Base Produk
            </h3>
            <p className="hidden sm:block text-xs text-warmmuted mt-0.5">
              Sumber Kebenaran Tunggal · Setiap klaim wajib membawa <code>fact_id</code> · Bebas rekayasa data
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrintProductCard}
            className="min-h-[44px] sm:min-h-[38px] px-3 sm:px-3.5 py-2 rounded-xl bg-white border border-warmborder text-espresso text-xs font-bold hover:bg-sandstone inline-flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
          >
            <Printer className="size-3.5 text-terracotta shrink-0" />
            <span className="sm:hidden">PDF</span>
            <span className="hidden sm:inline">Kartu Produk (PDF)</span>
          </button>
        </div>

        {/* Tab Horizontal Sejajar (Selalu Horizontal, Anti-Vertikal) */}
        <div className="grid grid-cols-2 sm:inline-flex gap-1.5 p-1 bg-sandstone rounded-xl border border-warmborder text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('facts')}
            className={`min-h-[44px] sm:min-h-[38px] px-3 sm:px-4 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'facts'
                ? 'bg-espresso text-white shadow-xs'
                : 'text-warmmuted hover:text-espresso'
            }`}
          >
            <BookOpen className="size-3.5 shrink-0" />
            <span>Fakta Produk</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unit_sim')}
            className={`min-h-[44px] sm:min-h-[38px] px-3 sm:px-4 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'unit_sim'
                ? 'bg-espresso text-white shadow-xs'
                : 'text-warmmuted hover:text-espresso'
            }`}
          >
            <Calculator className="size-3.5 shrink-0" />
            <span>Siteplan &amp; KPR</span>
          </button>
        </div>
      </div>

      {/* TAB 2: SITEPLAN, DENAH & SIMULASI CICILAN KPR */}
      {activeTab === 'unit_sim' && (
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Siteplan & Denah 3 Klaster */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-espresso flex items-center gap-2">
              <Home className="size-4 text-terracotta shrink-0" />
              <span>Siteplan &amp; Denah Tipe Unit (35 Unit Boutique)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {[
                {
                  cluster: 'Cluster Nagoya (Jl. Tentara Pelajar)',
                  badge: 'Gold 3KT · Mulai Rp650 Jt',
                  specs: 'LT 63 m² / LB 75 m² · 2 Lantai Japandi Modern · 3 KT · 2 KM · Garasi Dalam · Lokasi Clubhouse (Kolam Renang, Gym, Mini Golf).',
                },
                {
                  cluster: 'Cluster Osaka (Koridor Jl. Jend. Sudirman)',
                  badge: 'Titanium 3KT · Mulai Rp775 Jt',
                  specs: 'LT 66 m² / LB 80 m² · 2 Lantai · 3 KT · 2 KM · Garasi Dalam + Carport · One-Gate RFID & Smart Door Lock.',
                },
                {
                  cluster: 'Cluster Tokyo (Koridor Jl. Jend. Sudirman)',
                  badge: 'Signature 3KT · Mulai Rp950 Jt',
                  specs: 'LT 72 m² / LB 90 m² · 2 Lantai Premium · 3 KT · 3 KM · Ruang Keluarga Luas + Taman Belakang Privat.',
                },
              ].map((c) => (
                <div key={c.cluster} className="p-3.5 sm:p-4 rounded-2xl bg-sandstone/40 border border-warmborder space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 text-terracotta text-[11px] font-extrabold">
                    {c.badge}
                  </span>
                  <p className="font-extrabold text-espresso">{c.cluster}</p>
                  <p className="text-warmmuted leading-relaxed">{c.specs}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Simulasi Cicilan KPR Interaktif */}
          <div className="p-4 sm:p-5 rounded-2xl bg-sandstone/50 border border-warmborder space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-terracotta shrink-0" />
              <h4 className="text-sm font-extrabold text-espresso">Simulator Angsuran KPR</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-espresso mb-1">Pilih Tipe Unit</label>
                <select
                  value={simUnitIdx}
                  onChange={(e) => setSimUnitIdx(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder bg-white font-semibold"
                >
                  {PLAYBOOK_UNIT_CATALOG.map((u, idx) => (
                    <option key={u.label} value={idx}>
                      {u.label} ({formatIdr(u.priceKprIdr)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:contents gap-2.5">
                <div>
                  <label className="block font-bold text-espresso mb-1">Uang Muka ({simDpPercent}%)</label>
                  <select
                    value={simDpPercent}
                    onChange={(e) => setSimDpPercent(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder bg-white font-semibold"
                  >
                    {[10, 15, 20, 30].map((d) => (
                      <option key={d} value={d}>{d}% ({formatIdr(Math.round((simPrice * d) / 100))})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-espresso mb-1">Tenor Cicilan</label>
                  <select
                    value={simTenorYears}
                    onChange={(e) => setSimTenorYears(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder bg-white font-semibold"
                  >
                    {[5, 10, 15, 20].map((t) => (
                      <option key={t} value={t}>{t} Thn ({t * 12} Bln)</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-espresso mb-1">Estimasi Bunga (% / th)</label>
                <input
                  type="number"
                  step="0.25"
                  min={0}
                  max={15}
                  value={simInterestRate}
                  onChange={(e) => setSimInterestRate(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder bg-white font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-espresso text-white">
              <div className="col-span-2 sm:col-span-1 sm:order-3 pb-2.5 sm:pb-0 border-b sm:border-b-0 border-white/15">
                <span className="text-[11px] text-amber-300 block font-semibold">Estimasi Angsuran / Bulan</span>
                <strong className="text-xl sm:text-2xl font-extrabold text-amber-300 tabular-nums">
                  {formatIdr(simMonthlyInstallment)}
                </strong>
              </div>
              <div className="sm:order-1">
                <span className="text-[11px] text-white/70 block">Plafon Pinjaman KPR</span>
                <strong className="text-sm sm:text-base font-extrabold tabular-nums">{formatIdr(simPlafon)}</strong>
              </div>
              <div className="sm:order-2">
                <span className="text-[11px] text-white/70 block">Estimasi DP ({simDpPercent}%)</span>
                <strong className="text-sm sm:text-base font-extrabold tabular-nums">{formatIdr(simDpAmount)}</strong>
              </div>
            </div>

            <p className="text-[11px] text-warmmuted leading-relaxed">
              <strong>Disclaimer:</strong> Hasil simulasi merupakan estimasi indikatif dan bukan komitmen kredit final. Keputusan suku bunga dan persetujuan plafon pembiayaan sepenuhnya merupakan wewenang bank rekanan penyedia KPR.
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: DAFTAR FAKTA PRODUK (LIST IDENTITAS -> KLIK UNTUK DETAIL, NOL SCROLL HORIZONTAL) */}
      {activeTab === 'facts' && (
        <div className="p-4 sm:p-6 space-y-4">
          {facts.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-sandstone/30 border border-dashed border-warmborder space-y-4 my-2">
              <div className="size-14 rounded-2xl bg-white border border-warmborder text-warmmuted grid place-items-center mx-auto shadow-2xs">
                <BookOpen className="size-7 text-warmmuted" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-espresso">Belum ada knowledge base</h3>
                <p className="text-xs text-warmmuted mt-1 max-w-md mx-auto leading-relaxed">
                  Fakta spesifikasi, cluster, harga, fasilitas kawasan, dan legalitas belum dikurasi untuk <strong>{projectName}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleInitKb}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer shadow-xs inline-flex items-center gap-2"
              >
                <Sparkles className="size-4" />
                <span>Buat Knowledge Base Proyek Ini</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFact}
                    onChange={e => setSearchFact(e.target.value)}
                    placeholder="Cari fakta spesifikasi, harga, cluster, atau legalitas..."
                    className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="min-h-[44px] px-3 rounded-xl border border-warmborder text-xs bg-sandstone font-semibold text-espresso cursor-pointer w-full sm:w-auto"
                >
                  {categories.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="border border-warmborder rounded-2xl overflow-hidden divide-y divide-warmborder bg-white">
                <div className="px-3.5 sm:px-4 py-2.5 bg-sandstone/60 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-warmmuted">
                  <span>Identitas Fakta ({filteredFacts.length})</span>
                  <span>Ketuk untuk Detail</span>
                </div>
                {filteredFacts.map(fact => {
                  const isOpen = expandedFactId === fact.fact_id;
                  return (
                    <div key={fact.fact_id} className="transition-colors">
                      <button
                        type="button"
                        onClick={() => setExpandedFactId(isOpen ? null : fact.fact_id)}
                        aria-expanded={isOpen}
                        className={`w-full min-h-[52px] px-3.5 sm:px-4 py-3 text-left flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isOpen ? 'bg-amber-50/60' : 'hover:bg-sandstone/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 font-mono font-extrabold text-terracotta text-[10px] sm:text-[11px] shrink-0">
                            {fact.fact_id}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-extrabold text-espresso truncate">
                              {formatFactKey(fact.key)}
                            </p>
                            <span className="text-[10px] sm:text-[11px] font-semibold text-warmmuted block truncate">
                              {categoryLabelMap[fact.category] || fact.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-100 text-olive">
                            <CheckCircle2 className="size-3" />
                            {fact.status}
                          </span>
                          <ChevronDown
                            className={`size-4 text-warmmuted transition-transform duration-150 ${
                              isOpen ? 'rotate-180 text-terracotta' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-3.5 sm:px-4 pb-4 pt-1 bg-amber-50/40 border-t border-warmborder/60 space-y-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-white border border-warmborder">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-warmmuted mb-1">
                              Nilai Faktual Resmi
                            </p>
                            <p className="text-espresso leading-relaxed font-medium">
                              {fact.value}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="text-warmmuted font-medium">
                              Sumber: <strong className="text-espresso">{fact.source_citation}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-100 text-olive">
                              <CheckCircle2 className="size-3" />
                              {fact.status}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
