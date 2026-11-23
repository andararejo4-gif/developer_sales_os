import React, { useEffect, useState } from 'react';
import { BookOpen, Send, Sparkles, Printer, Search, Calculator, Home } from 'lucide-react';
import { THE_PARK_KB_FACTS } from '../lib/kb/the-park-facts';
import { askProductKnowledge } from '../lib/kb/qa-engine';
import { PRODUCT_QUIZ_QUESTIONS, gradeQuiz } from '../lib/kb/quiz-engine';
import { generateProductCardHtml } from '../lib/kb/product-card';
import { PLAYBOOK_UNIT_CATALOG } from '../lib/kb/playbook-v1-2-knowledge';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';

type KbTab = 'facts' | 'unit_sim' | 'tanya' | 'kuis';
const VALID_KB_TABS: KbTab[] = ['facts', 'unit_sim', 'tanya', 'kuis'];

export const KnowledgeBaseViewer: React.FC<{ syncUrlTab?: boolean }> = ({ syncUrlTab = true }) => {
  const [activeTab, setActiveTab] = useState<KbTab>(() => {
    const urlTab = syncUrlTab ? getQueryParam('tab') : null;
    if (urlTab && VALID_KB_TABS.includes(urlTab as KbTab)) {
      return urlTab as KbTab;
    }
    return loadPersistedState<KbTab>('devos_kb_tab', 'facts');
  });
  const [searchFact, setSearchFact] = useState(() =>
    loadPersistedState<string>('devos_kb_search', '')
  );
  const [selectedCategory, setSelectedCategory] = useState(() =>
    loadPersistedState<string>('devos_kb_category', 'semua')
  );

  // Tanya Produk State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; source?: string; isOutOfScope?: boolean }>>(() =>
    loadPersistedState('devos_kb_chat', [
      {
        sender: 'bot',
        text: 'Halo! Saya asisten Knowledge Base The Park Townhouse Sukoharjo. Tanyakan apa saja seputar tipe unit, harga, luas tanah, jarak fasilitas, atau legalitas.',
      },
    ])
  );
  const [inputQuery, setInputQuery] = useState(() =>
    loadPersistedState<string>('devos_kb_input_query', '')
  );

  // Kuis SE State
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: number]: number }>(() =>
    loadPersistedState<{ [qId: number]: number }>('devos_kb_quiz_answers', {})
  );
  const [quizResult, setQuizResult] = useState<ReturnType<typeof gradeQuiz> | null>(() =>
    loadPersistedState<ReturnType<typeof gradeQuiz> | null>('devos_kb_quiz_result', null)
  );

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
    savePersistedState('devos_kb_chat', chatMessages);
    savePersistedState('devos_kb_input_query', inputQuery);
    savePersistedState('devos_kb_quiz_answers', quizAnswers);
    savePersistedState('devos_kb_quiz_result', quizResult);
  }, [searchFact, selectedCategory, chatMessages, inputQuery, quizAnswers, quizResult]);

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

  const filteredFacts = THE_PARK_KB_FACTS.filter(f => {
    const matchesCategory = selectedCategory === 'semua' || f.category === selectedCategory;
    const matchesSearch = f.key.toLowerCase().includes(searchFact.toLowerCase()) || 
                          f.value.toLowerCase().includes(searchFact.toLowerCase()) ||
                          f.source_citation.toLowerCase().includes(searchFact.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSendQuery = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    setInputQuery('');

    const res = askProductKnowledge(userText, false);

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: userText },
      { sender: 'bot', text: res.answer, source: res.source_citation, isOutOfScope: res.isOutOfScope }
    ]);
  };

  const handleSelectQuizAnswer = (questionId: number, optionIndex: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    const res = gradeQuiz(quizAnswers);
    setQuizResult(res);
  };

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
    <div className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-xs">
      {/* Top Header & Tab Controls */}
      <div className="p-6 border-b border-warmborder bg-sandstone/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-terracotta text-xs font-bold border border-amber-200">
              Fase 1A &middot; Otak Produk
            </span>
            <h3 className="text-lg font-bold text-espresso">Product Knowledge Base (KB v1)</h3>
          </div>
          <p className="text-xs text-warmmuted mt-0.5">
            Sumber Kebenaran Tunggal &middot; Setiap klaim wajib membawa <code>fact_id</code> &middot; Bebas rekayasa data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintProductCard}
            className="px-3 py-1.5 rounded-xl bg-white border border-warmborder text-espresso text-xs font-bold hover:bg-sandstone flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="size-3.5 text-terracotta" />
            <span>Kartu Produk (PDF)</span>
          </button>

          <div className="flex flex-wrap gap-1 p-1 bg-sandstone rounded-xl border border-warmborder text-xs font-bold">
            <button
              onClick={() => setActiveTab('facts')}
              className={`min-h-[44px] md:min-h-0 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'facts' ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Fakta Produk
            </button>
            <button
              onClick={() => setActiveTab('unit_sim')}
              className={`min-h-[44px] md:min-h-0 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'unit_sim' ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Siteplan &amp; Simulasi KPR
            </button>
            <button
              onClick={() => setActiveTab('tanya')}
              className={`min-h-[44px] md:min-h-0 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'tanya' ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Tanya Produk (AI)
            </button>
            <button
              onClick={() => setActiveTab('kuis')}
              className={`min-h-[44px] md:min-h-0 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'kuis' ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Kuis SE (10 Soal)
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1B: SITEPLAN, DENAH & SIMULASI CICILAN KPR */}
      {activeTab === 'unit_sim' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Siteplan & Denah 3 Klaster */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-espresso flex items-center gap-2">
              <Home className="size-4 text-terracotta" />
              <span>Siteplan &amp; Denah Tipe Unit The Park Townhouse (35 Unit Boutique)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {[
                {
                  cluster: 'Cluster Nagoya (Jl. Tentara Pelajar)',
                  badge: 'Gold 3KT · Mulai Rp650 Jt',
                  specs: 'LT 63 m² / LB 75 m² · 2 Lantai Japandi Modern · 3 Kamar Tidur · 2 Kamar Mandi · Garasi Dalam · Lokasi Clubhouse (Kolam Renang, Gym, Mini Golf).',
                },
                {
                  cluster: 'Cluster Osaka (Koridor Jl. Jend. Sudirman)',
                  badge: 'Titanium 3KT · Mulai Rp775 Jt',
                  specs: 'LT 66 m² / LB 80 m² · 2 Lantai · 3 Kamar Tidur · 2 Kamar Mandi · Garasi Dalam + Carport · One-Gate RFID & Smart Door Lock.',
                },
                {
                  cluster: 'Cluster Tokyo (Koridor Jl. Jend. Sudirman)',
                  badge: 'Signature 3KT · Mulai Rp950 Jt',
                  specs: 'LT 72 m² / LB 90 m² · 2 Lantai Premium · 3 Kamar Tidur · 3 Kamar Mandi · Ruang Keluarga Luas + Taman Belakang Privat.',
                },
              ].map((c) => (
                <div key={c.cluster} className="p-4 rounded-2xl bg-sandstone/40 border border-warmborder space-y-2">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-terracotta text-[11px] font-extrabold">
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
              <Calculator className="size-4 text-terracotta" />
              <h4 className="text-sm font-extrabold text-espresso">Simulator Angsuran KPR (Presentasi ke Klien)</h4>
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
              <div>
                <label className="block font-bold text-espresso mb-1">Uang Muka / DP ({simDpPercent}%)</label>
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
                    <option key={t} value={t}>{t} Tahun ({t * 12} Bulan)</option>
                  ))}
                </select>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-espresso text-white">
              <div>
                <span className="text-[11px] text-white/70 block">Plafon Pinjaman KPR</span>
                <strong className="text-base font-extrabold tabular-nums">{formatIdr(simPlafon)}</strong>
              </div>
              <div>
                <span className="text-[11px] text-white/70 block">Estimasi DP ({simDpPercent}%)</span>
                <strong className="text-base font-extrabold tabular-nums">{formatIdr(simDpAmount)}</strong>
              </div>
              <div>
                <span className="text-[11px] text-amber-300 block">Estimasi Angsuran / Bulan</span>
                <strong className="text-xl font-extrabold text-amber-300 tabular-nums">
                  {formatIdr(simMonthlyInstallment)}
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-warmmuted leading-relaxed">
              <strong>Disclaimer:</strong> Hasil simulasi merupakan estimasi indikatif dan bukan komitmen kredit final. Keputusan suku bunga dan persetujuan plafon pembiayaan sepenuhnya merupakan wewenang bank rekanan penyedia KPR.
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: DAFTAR FAKTA PRODUK */}
      {activeTab === 'facts' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFact}
                onChange={e => setSearchFact(e.target.value)}
                placeholder="Cari fakta spesifikasi, harga, cluster, atau legalitas..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-9 px-3 rounded-xl border border-warmborder text-xs bg-sandstone font-medium text-espresso cursor-pointer w-full sm:w-auto"
            >
              {categories.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto border border-warmborder rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-sandstone/60 border-b border-warmborder font-bold text-warmmuted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Fact ID</th>
                  <th className="py-2.5 px-3">Kategori &amp; Kunci</th>
                  <th className="py-2.5 px-4">Nilai Faktual</th>
                  <th className="py-2.5 px-3">Sumber Kutipan</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmborder">
                {filteredFacts.map(fact => (
                  <tr key={fact.fact_id} className="hover:bg-sandstone/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-terracotta text-[11px]">{fact.fact_id}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-espresso block">{fact.key}</span>
                      <span className="text-[10px] text-warmmuted">{fact.category}</span>
                    </td>
                    <td className="py-2.5 px-4 text-espresso/90 leading-relaxed max-w-md">{fact.value}</td>
                    <td className="py-2.5 px-3 text-warmmuted font-medium text-[11px]">{fact.source_citation}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-100 text-olive">
                        {fact.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TANYA PRODUK (Q&A CHAT ENGINE) */}
      {activeTab === 'tanya' && (
        <div className="p-6 space-y-4">
          <div className="p-3 bg-sandstone rounded-xl border border-warmborder text-xs text-warmmuted flex items-start gap-2">
            <Sparkles className="size-4 text-terracotta shrink-0 mt-0.5" />
            <span>
              Chatbot ini dilatih khusus menggunakan <strong>Knowledge Base The Park Townhouse Sukoharjo</strong>. Seluruh jawaban menyertakan kutipan sumber resmi. Pertanyaan di luar data tidak akan ditebak.
            </span>
          </div>

          <div className="h-72 overflow-y-auto p-4 rounded-xl border border-warmborder bg-sandstone/20 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl max-w-lg text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-espresso text-white rounded-tr-none' 
                    : 'bg-white border border-warmborder text-espresso rounded-tl-none shadow-2xs'
                }`}>
                  <p>{msg.text}</p>
                  {msg.source && (
                    <p className="mt-1.5 pt-1.5 border-t border-warmborder/60 text-[10px] text-warmmuted font-semibold flex items-center gap-1">
                      <BookOpen className="size-3 text-terracotta" />
                      <span>Sumber: {msg.source}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendQuery} className="flex gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Ketik pertanyaan (contoh: Berapa harga tipe Diamond? Jarak ke RSUD?)"
              className="flex-1 h-10 px-3.5 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-xl bg-terracotta text-white font-bold text-xs hover:bg-terracotta/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="size-3.5" />
              <span>Tanya</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: KUIS PENGETAHUAN PRODUK SE */}
      {activeTab === 'kuis' && (
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-warmborder">
            <div>
              <h4 className="font-bold text-sm text-espresso">Kuis Onboarding Sales Executive</h4>
              <p className="text-xs text-warmmuted">10 Soal Pilihan Ganda &middot; Standar Kelulusan Minimal 80 Poin</p>
            </div>
            {quizResult && (
              <div className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                quizResult.passed ? 'bg-lime-100 text-olive' : 'bg-rose-100 text-rose-700'
              }`}>
                Skor Anda: {quizResult.score}/100 ({quizResult.passed ? 'LULUS' : 'REMEDIAL'})
              </div>
            )}
          </div>

          <div className="space-y-4">
            {PRODUCT_QUIZ_QUESTIONS.map(q => {
              const selectedOpt = quizAnswers[q.id];
              const resultDetail = quizResult?.results.find(r => r.questionId === q.id);

              return (
                <div key={q.id} className="p-4 rounded-xl border border-warmborder bg-sandstone/20 space-y-2.5 text-xs">
                  <p className="font-bold text-espresso">{q.id}. {q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleSelectQuizAnswer(q.id, idx)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer text-[11px] ${
                          selectedOpt === idx
                            ? 'bg-espresso text-white border-espresso font-bold'
                            : 'bg-white text-espresso border-warmborder hover:bg-sandstone'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                      </button>
                    ))}
                  </div>

                  {resultDetail && (
                    <div className={`p-2 rounded-lg text-[11px] font-semibold mt-2 ${
                      resultDetail.correct ? 'bg-lime-50 text-olive' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {resultDetail.correct ? '✓ Benar' : '✗ Kurang Tepat'} &mdash; {resultDetail.explanation} ({q.source_citation})
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-warmborder flex justify-end">
            <button
              onClick={handleSubmitQuiz}
              className="px-6 py-2.5 rounded-xl bg-terracotta text-white font-bold text-xs hover:bg-terracotta/90 cursor-pointer shadow-xs"
            >
              Kirim Jawaban Kuis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
