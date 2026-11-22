import React, { useEffect, useState } from 'react';
import { BookOpen, Send, Sparkles, Printer, Search } from 'lucide-react';
import { THE_PARK_KB_FACTS } from '../lib/kb/the-park-facts';
import { askProductKnowledge } from '../lib/kb/qa-engine';
import { PRODUCT_QUIZ_QUESTIONS, gradeQuiz } from '../lib/kb/quiz-engine';
import { generateProductCardHtml } from '../lib/kb/product-card';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';

type KbTab = 'facts' | 'tanya' | 'kuis';
const VALID_KB_TABS: KbTab[] = ['facts', 'tanya', 'kuis'];

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

          <div className="inline-flex p-1 bg-sandstone rounded-xl border border-warmborder text-xs font-bold">
            <button
              onClick={() => setActiveTab('facts')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'facts' ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Fakta Produk
            </button>
            <button
              onClick={() => setActiveTab('tanya')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'tanya' ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Tanya Produk (AI)
            </button>
            <button
              onClick={() => setActiveTab('kuis')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'kuis' ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Kuis SE (10 Soal)
            </button>
          </div>
        </div>
      </div>

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
