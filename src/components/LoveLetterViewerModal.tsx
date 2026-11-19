import React, { useState } from 'react';
import { X, Search, Download, CheckCircle2 } from 'lucide-react';
import { THE_PARK_99_POINTS } from '../lib/love-letter/points-data';
import { generateLoveLetterDocx } from '../lib/love-letter/docx-exporter';
import { generateLoveLetterHtml } from '../lib/love-letter/html-exporter';

interface ViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoveLetterViewerModal: React.FC<ViewerProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('Semua');

  if (!isOpen) return null;

  const chapters = [
    'Semua',
    'Bab I: Lokasi Strategis & Konektivitas Kawasan',
    'Bab II: Konsep Arsitektur & Desain Spasial Jepang Modern',
    'Bab III: Spesifikasi Teknis & Material Konstruksi Pilihan',
    'Bab IV: Sistem Keamanan & Fasilitas Kawasan Private Townhouse',
    'Bab V: Lingkungan, Biofilik & Kualitas Hidup Keluarga',
    'Bab VI: Legalitas, Skema Pembiayaan & Reputasi Pengembang',
  ];

  const filteredPoints = THE_PARK_99_POINTS.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.narrative.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChapter = selectedChapter === 'Semua' || p.chapter === selectedChapter;
    return matchesSearch && matchesChapter;
  });

  const handleDownloadDocx = async () => {
    try {
      const blob = await generateLoveLetterDocx(
        "The Park Townhouse Sukoharjo",
        "PT Andara Rejo Makmur",
        "Sukoharjo",
        THE_PARK_99_POINTS
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Surat_Cinta_99_Keunggulan_The_Park_Townhouse.docx`;
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
    const html = generateLoveLetterHtml(
      "The Park Townhouse Sukoharjo",
      "PT Andara Rejo Makmur",
      "Sukoharjo",
      THE_PARK_99_POINTS
    );
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-espresso/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-warmborder rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="p-5 border-b border-warmborder bg-sandstone/50 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-md bg-terracotta text-white font-extrabold text-xs grid place-items-center">
                99
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-espresso">
                Surat Cinta 99 Keunggulan: The Park Townhouse Sukoharjo
              </h2>
            </div>
            <p className="text-xs text-warmmuted mt-0.5">
              PT Andara Rejo Makmur &middot; Narasi editorial berkelas &middot; Lolos uji guardrail 100%
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDocx}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer shadow-2xs"
            >
              <Download className="size-3.5" />
              <span>Word (.docx)</span>
            </button>
            <button
              onClick={handlePrintPdf}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-warmborder text-espresso text-xs font-semibold hover:bg-sandstone cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-warmmuted hover:text-espresso hover:bg-sandstone cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

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
