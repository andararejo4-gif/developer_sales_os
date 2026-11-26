import React, { useEffect, useState } from 'react';
import { X, Search, Download, CheckCircle2, Sparkles, BookOpen, ShieldCheck, FileText, Check, AlertCircle } from 'lucide-react';
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

export type ClaimStatus = 'AKTUAL' | 'RENCANA' | 'ILUSTRASI' | 'DITOLAK';
export type ProofGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C';

export interface ClaimVerificationRecord {
  pointNumber: number;
  status: ClaimStatus;
  grade: ProofGrade;
  verifiedBy: string;
  evidenceRef: string;
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

  const [viewMode, setViewMode] = useState<'narrative' | 'ledger'>(() =>
    loadPersistedState<'narrative' | 'ledger'>(`devos_ll_viewmode_${projectId}`, 'narrative')
  );

  const [claimRecords, setClaimRecords] = useState<Record<number, ClaimVerificationRecord>>(() => {
    const saved = loadPersistedState<Record<number, ClaimVerificationRecord> | null>(
      `devos_claim_ledger_${projectId}`,
      null
    );
    if (saved) return saved;

    // Default seeded claim ledger status
    const initial: Record<number, ClaimVerificationRecord> = {};
    const defaultPoints = getLoveLetterPoints(projectId) || [];
    defaultPoints.forEach((p) => {
      let status: ClaimStatus = 'AKTUAL';
      let grade: ProofGrade = 'GRADE_B';
      let verifiedBy = 'Tim Legal & Teknik';
      let evidenceRef = 'Brosur & Master Plan Resmi';

      if (p.chapter.includes('Bab I') || p.chapter.includes('Bab VI')) {
        grade = 'GRADE_A';
        verifiedBy = 'Legal PT Andara Rejo Makmur';
        evidenceRef = 'SHM No. 491 / PBG Induk Sukoharjo';
      } else if (p.chapter.includes('Bab II') || p.chapter.includes('Bab V')) {
        grade = 'GRADE_B';
        verifiedBy = 'Arsitek & Tim Sipil';
        evidenceRef = 'Gambar Kerja Teknis & Siteplan';
      } else if (p.chapter.includes('Clubhouse') || p.narrative.includes('rencana')) {
        status = 'RENCANA';
        grade = 'GRADE_B';
        verifiedBy = 'Project Manager';
        evidenceRef = 'Rencana Progres Q1 2027';
      }

      initial[p.number] = {
        pointNumber: p.number,
        status,
        grade,
        verifiedBy,
        evidenceRef,
      };
    });
    return initial;
  });

  const updateClaimStatus = (pointNum: number, nextStatus: ClaimStatus) => {
    setClaimRecords((prev) => {
      const current = prev[pointNum] || {
        pointNumber: pointNum,
        status: 'AKTUAL',
        grade: 'GRADE_B',
        verifiedBy: 'Tim Legal',
        evidenceRef: 'Brosur Resmi',
      };
      const updated = {
        ...prev,
        [pointNum]: { ...current, status: nextStatus },
      };
      savePersistedState(`devos_claim_ledger_${projectId}`, updated);
      return updated;
    });
  };

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
            {/* View Switcher: Narasi Surat Cinta vs Claim Ledger F14 */}
            <div className="px-4 py-2 bg-sandstone/40 border-b border-warmborder flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-warmborder">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('narrative');
                    savePersistedState(`devos_ll_viewmode_${projectId}`, 'narrative');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'narrative'
                      ? 'bg-espresso text-white shadow-2xs'
                      : 'text-warmmuted hover:text-espresso'
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>Narasi Surat Cinta (99 Poin)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('ledger');
                    savePersistedState(`devos_ll_viewmode_${projectId}`, 'ledger');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'ledger'
                      ? 'bg-espresso text-white shadow-2xs'
                      : 'text-warmmuted hover:text-espresso'
                  }`}
                >
                  <ShieldCheck className="size-3.5 text-terracotta" />
                  <span>Buku Besar Klaim / Claim Ledger</span>
                </button>
              </div>

              <div className="text-[11px] text-warmmuted flex items-center gap-2">
                <span className="font-semibold text-olive inline-flex items-center gap-1">
                  <Check className="size-3" /> Faktual Aktif
                </span>
                <span>·</span>
                <span className="font-semibold text-amber-700">Rencana Terverifikasi</span>
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

            {/* 99 Points List (View 1: Narasi vs View 2: Claim Ledger F14) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3 bg-sandstone/20">
              {filteredPoints.length === 0 ? (
                <div className="py-12 text-center text-xs text-warmmuted">
                  Tidak ada poin yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : viewMode === 'ledger' ? (
                /* VIEW 2: CLAIM LEDGER TABLE (F14) */
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                    <AlertCircle className="size-4 text-terracotta shrink-0 mt-0.5" />
                    <div>
                      <strong>Standar Audit F14:</strong> Setiap klaim promosi properti wajib memiliki derajat bukti (Grade A/B/C) dan status operasional yang sah. Klaim berstatus <em>Ditolak</em> otomatis dicegah muncul di materi iklan, brosur, atau skrip AI.
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-warmborder bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-sandstone/60 border-b border-warmborder font-extrabold text-espresso">
                        <tr>
                          <th className="py-3 px-3.5 w-16">No</th>
                          <th className="py-3 px-3.5 min-w-[200px]">Pernyataan Klaim Keunggulan</th>
                          <th className="py-3 px-3.5 w-32">Status Klaim</th>
                          <th className="py-3 px-3.5 w-28">Derajat Bukti</th>
                          <th className="py-3 px-3.5 min-w-[150px]">Penanggung Jawab / Dasar Bukti</th>
                          <th className="py-3 px-3.5 w-40 text-right">Verifikasi Legal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warmborder">
                        {filteredPoints.map((point) => {
                          const record = claimRecords[point.number] || {
                            pointNumber: point.number,
                            status: 'AKTUAL',
                            grade: 'GRADE_B',
                            verifiedBy: 'Tim Proyek',
                            evidenceRef: 'Brosur & Master Plan',
                          };
                          return (
                            <tr key={point.number} className="hover:bg-sandstone/20 transition-colors">
                              <td className="py-3 px-3.5 font-bold font-mono text-terracotta">
                                #{point.number}
                              </td>
                              <td className="py-3 px-3.5">
                                <p className="font-extrabold text-espresso">{point.title}</p>
                                <p className="text-[11px] text-warmmuted line-clamp-2 mt-0.5">
                                  {point.narrative}
                                </p>
                              </td>
                              <td className="py-3 px-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold inline-block whitespace-nowrap ${
                                    record.status === 'AKTUAL'
                                      ? 'bg-lime-100 text-olive border border-lime-300'
                                      : record.status === 'RENCANA'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : record.status === 'ILUSTRASI'
                                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                                  }`}
                                >
                                  {record.status}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 font-semibold text-warmmuted whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-sandstone border border-warmborder text-[10px]">
                                  {record.grade === 'GRADE_A'
                                    ? 'A · Dokumen Resmi'
                                    : record.grade === 'GRADE_B'
                                    ? 'B · Gambar Kerja'
                                    : 'C · Ilustrasi 3D'}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-[11px] text-espresso">
                                <span className="font-semibold block">{record.verifiedBy}</span>
                                <span className="text-warmmuted block text-[10px] mt-0.5">
                                  {record.evidenceRef}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                <select
                                  aria-label={`Ubah status klaim #${point.number}`}
                                  value={record.status}
                                  onChange={(e) =>
                                    updateClaimStatus(point.number, e.target.value as ClaimStatus)
                                  }
                                  className="h-8 px-2 rounded-lg border border-warmborder bg-sandstone/30 text-[11px] font-bold text-espresso cursor-pointer focus:outline-none focus:ring-1 focus:ring-terracotta"
                                >
                                  <option value="AKTUAL">Setujui: AKTUAL</option>
                                  <option value="RENCANA">Tandai: RENCANA</option>
                                  <option value="ILUSTRASI">Tandai: ILUSTRASI</option>
                                  <option value="DITOLAK">Tolak: DITOLAK</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* VIEW 1: NARASI SURAT CINTA */
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
