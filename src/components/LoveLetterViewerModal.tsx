import React, { useEffect, useState } from 'react';
import { X, Search, Download, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { type LoveLetterPoint } from '../lib/love-letter/points-data';
import { getLoveLetterPoints, initProjectLoveLetter } from '../lib/love-letter/love-letter-engine';
import { generateLoveLetterDocx } from '../lib/love-letter/docx-exporter';
import { generateLoveLetterHtml } from '../lib/love-letter/html-exporter';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';

interface ViewerProps {
  isOpen: boolean;
  variant?: 'modal' | 'page';
  projectId?: string;
  projectName?: string;
  onClose: () => void;
}

export const LoveLetterViewerModal: React.FC<ViewerProps> = ({
  isOpen,
  variant = 'modal',
  projectId = 'the-park-sukoharjo',
  projectName = 'The Park Townhouse Sukoharjo',
  onClose,
}) => {
  const [points, setPoints] = useState<LoveLetterPoint[] | null>(() =>
    getLoveLetterPoints(projectId)
  );

  useEffect(() => {
    setPoints(getLoveLetterPoints(projectId));
  }, [projectId]);

  const [searchQuery, setSearchQuery] = useState(() =>
    loadPersistedState<string>(`devos_loveletter_search_${projectId}`, '')
  );
  const [selectedChapter, setSelectedChapter] = useState(() => {
    const urlTab = variant === 'page' ? getQueryParam('tab') : null;
    if (urlTab) return urlTab;
    return loadPersistedState<string>(`devos_loveletter_chapter_${projectId}`, 'Semua');
  });

  useEffect(() => {
    savePersistedState(`devos_loveletter_chapter_${projectId}`, selectedChapter);
    if (variant === 'page') {
      setQueryParam('tab', selectedChapter);
    }
  }, [selectedChapter, variant, projectId]);

  useEffect(() => {
    savePersistedState(`devos_loveletter_search_${projectId}`, searchQuery);
  }, [searchQuery, projectId]);

  const handleInitLoveLetter = () => {
    const newPoints = initProjectLoveLetter(projectId, projectName);
    setPoints(newPoints);
  };

  if (!isOpen && variant === 'modal') return null;

  const chapters = [
    'Semua',
    'Bab I: Lokasi Strategis & Konektivitas Kawasan',
    'Bab II: Konsep Arsitektur & Desain Spasial Jepang Modern',
    'Bab III: Spesifikasi Teknis & Material Konstruksi Pilihan',
    'Bab IV: Sistem Keamanan & Fasilitas Kawasan Private Townhouse',
    'Bab V: Lingkungan, Biofilik & Kualitas Hidup Keluarga',
    'Bab VI: Legalitas, Skema Pembiayaan & Reputasi Pengembang',
  ];

  const filteredPoints = (points || []).filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.narrative.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChapter = selectedChapter === 'Semua' || p.chapter === selectedChapter;
    return matchesSearch && matchesChapter;
  });

  const handleDownloadDocx = async () => {
    if (!points || points.length === 0) return;
    try {
      const blob = await generateLoveLetterDocx(
        projectName,
        "PT Andara Rejo Makmur",
        "Sukoharjo",
        points
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Surat_Cinta_99_Keunggulan_${safeProjectName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Gagal mengunduh DOCX.");
    }
  };

  const handlePrintPdf = () => {
    if (!points || points.length === 0) return;
    const html = generateLoveLetterHtml(
      projectName,
      "PT Andara Rejo Makmur",
      "Sukoharjo",
      points
    );
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
    }
  };

  const outerClass =
    variant === 'page'
      ? 'w-full'
      : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-espresso/70 backdrop-blur-xs overflow-y-auto';
  const cardClass =
    variant === 'page'
      ? 'w-full bg-white border border-warmborder rounded-2xl shadow-xs overflow-hidden flex flex-col'
      : 'w-full max-w-5xl bg-white border border-warmborder rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95';

  return (
    <div className={outerClass}>
      <div className={cardClass}>
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-warmborder bg-sandstone/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="size-6 rounded-md bg-terracotta text-white font-extrabold text-xs grid place-items-center shrink-0">
                  99
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-espresso leading-snug">
                  Surat Cinta 99 Keunggulan
                </h2>
              </div>
              <p className="text-xs text-warmmuted mt-0.5 leading-relaxed">
                {projectName} &middot; Lolos uji guardrail 100%
              </p>
            </div>
            {variant === 'modal' && (
              <button
                onClick={onClose}
                aria-label="Tutup Surat Cinta"
                className="sm:hidden size-10 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadDocx}
              className="flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <Download className="size-3.5 shrink-0" />
              <span>Word (.docx)</span>
            </button>
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-warmborder text-espresso text-xs font-semibold hover:bg-sandstone cursor-pointer whitespace-nowrap"
            >
              <Download className="size-3.5 shrink-0" />
              <span>Cetak / PDF</span>
            </button>
            {variant === 'modal' && (
              <button
                onClick={onClose}
                aria-label="Tutup Surat Cinta"
                className="hidden sm:flex size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso items-center justify-center cursor-pointer"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Konten 99 Keunggulan atau Empty State */}
        {!points || points.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-sandstone/30 border border-dashed border-warmborder space-y-4 m-6">
            <div className="size-16 rounded-2xl bg-white border border-warmborder text-warmmuted grid place-items-center mx-auto shadow-2xs">
              <BookOpen className="size-8 text-warmmuted" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-espresso">Belum ada surat cinta 99 keunggulan</h3>
              <p className="text-xs text-warmmuted mt-1 max-w-md mx-auto leading-relaxed">
                Surat cinta 99 keunggulan kurasi nilai kehidupan belum digenerate untuk <strong>{projectName}</strong>. Masukkan titik koordinat GPS, e-katalog, dan pricelist proyek untuk memicu narasi faktual.
              </p>
            </div>
            <button
              type="button"
              onClick={handleInitLoveLetter}
              className="px-4 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <Sparkles className="size-4" />
              <span>Generate 99 Keunggulan Proyek Ini</span>
            </button>
          </div>
        ) : (
          <>
            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-warmborder bg-white flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="relative w-full sm:flex-1">
                <Search className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari keunggulan (mis: akses, plafon, shm, jepang, kpr)..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                />
              </div>

              <div className="w-full sm:w-auto">
                <select
                  value={selectedChapter}
                  onChange={e => setSelectedChapter(e.target.value)}
                  className="w-full sm:w-64 h-9 px-3 rounded-xl border border-warmborder text-xs font-medium text-espresso bg-sandstone/30 focus:border-terracotta focus:outline-none cursor-pointer"
                >
                  {chapters.map((ch, idx) => (
                    <option key={idx} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 99 Points List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3 bg-sandstone/20">
              {filteredPoints.length === 0 ? (
                <div className="py-12 text-center text-xs text-warmmuted">
                  Tidak ada poin yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredPoints.map((point) => (
                  <article 
                    key={point.number}
                    className="p-4 rounded-xl bg-white border border-warmborder shadow-2xs hover:border-terracotta/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-extrabold text-terracotta font-mono">
                          #{point.number}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-espresso">
                          {point.title}
                        </h3>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sandstone text-warmmuted shrink-0">
                        {point.category}
                      </span>
                    </div>
                    <p className="text-xs text-warmmuted leading-relaxed pl-6">
                      {point.narrative}
                    </p>
                  </article>
                ))
              )}
            </div>
          </>
        )}

        {/* Footer Bar */}
        <div className="p-4 border-t border-warmborder bg-sandstone/50 flex items-center justify-between text-xs text-warmmuted shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-olive" />
            <span>Menampilkan {filteredPoints.length} dari 99 Poin Editorial</span>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={handleDownloadDocx}
              className="px-3 py-1 rounded-lg bg-terracotta text-white text-[11px] font-bold"
            >
              Word
            </button>
            <button
              onClick={handlePrintPdf}
              className="px-3 py-1 rounded-lg bg-white border border-warmborder text-[11px] font-bold"
            >
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
