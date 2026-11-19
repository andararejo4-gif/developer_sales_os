// ============================================================================
// CONTENT CALENDAR VIEWER - DEVELOPER SALES OS
// Full 30-Day Multi-Platform Social Media Calendar (TOFU, MOFU, BOFU)
// ============================================================================

import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  X,
  Filter,
  CheckCircle2,
  Clock,
  Copy,
  AlertCircle,
  Link2,
} from 'lucide-react';
import {
  getContentCalendar,
  updateSlotPosting,
  generateContentCalendarSlots,
} from '../lib/content-calendar/calendar-generator';
import { generateContentCalendarDocx } from '../lib/exporters/content-calendar-docx';
import type {
  ContentCalendarPlan,
  ContentSlot,
  ContentTrack,
  FunnelStage,
  ContentPlatform,
  PostingStatus,
} from '../lib/content-calendar/types';

interface ContentCalendarViewerProps {
  projectId?: string;
  projectName?: string;
  isDemoMode?: boolean;
  onClose?: () => void;
}

export function ContentCalendarViewer({
  projectId = 'proj-the-park-01',
  projectName = 'The Park Townhouse Sukoharjo',
  isDemoMode = false,
  onClose,
}: ContentCalendarViewerProps) {
  const [calendar, setCalendar] = useState<ContentCalendarPlan>(() =>
    getContentCalendar(projectId, 1, isDemoMode)
  );

  const [track, setTrack] = useState<ContentTrack>('OFFICIAL');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedFunnel, setSelectedFunnel] = useState<'all' | FunnelStage>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | ContentPlatform>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | PostingStatus>('all');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [activeSlotModal, setActiveSlotModal] = useState<ContentSlot | null>(null);

  // Link input state for the active slot
  const [linkInput, setLinkInput] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Switch Track (Official vs Sales In-House)
  const handleTrackChange = (newTrack: ContentTrack) => {
    setTrack(newTrack);
    const slots = generateContentCalendarSlots(newTrack);
    setCalendar((prev) => ({
      ...prev,
      slots: isDemoMode ? slots.filter((s) => s.dayNumber <= 8) : slots,
    }));
  };

  // Filter slots
  const filteredSlots = calendar.slots.filter((slot) => {
    if (selectedFunnel !== 'all' && slot.funnelStage !== selectedFunnel) return false;
    if (selectedPlatform !== 'all' && slot.platform !== selectedPlatform) return false;
    if (selectedStatus !== 'all' && slot.status !== selectedStatus) return false;
    return true;
  });

  // Week slices (Day 1..7, 8..14, 15..21, 22..28, 29..30)
  const weekStartDay = (selectedWeek - 1) * 7 + 1;
  const weekEndDay = Math.min(30, selectedWeek * 7);
  const weekSlots = filteredSlots.filter(
    (s) => s.dayNumber >= weekStartDay && s.dayNumber <= weekEndDay
  );

  // Day slots for Day view
  const daySlots = filteredSlots.filter((s) => s.dayNumber === selectedDay);

  // Save live posting URL
  const handleSavePostedUrl = (slotId: string) => {
    if (!linkInput.trim()) return;
    const updated = updateSlotPosting(projectId, slotId, linkInput.trim(), 'SUDAH_POSTING');
    if (updated) {
      setCalendar((prev) => ({
        ...prev,
        slots: prev.slots.map((s) => (s.id === slotId ? { ...s, postedUrl: linkInput, status: 'SUDAH_POSTING' } : s)),
        postedSlotsCount: prev.postedSlotsCount + 1,
      }));
      setActiveSlotModal(null);
      setLinkInput('');
      setToastMessage('Tautan posting berhasil disimpan & status diperbarui ke "Sudah Posting"!');
    }
  };

  // Copy Caption to Clipboard
  const handleCopyCaption = (caption: string, hashtags: string[], cta: string) => {
    const fullText = `${caption}\n\n${cta}\n\n${hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setToastMessage('Draf caption, CTA, dan hashtag disalin ke clipboard!');
  };

  // Export DOCX
  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      const blob = await generateContentCalendarDocx(calendar);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kalender_Konten_30Hari_${projectName.replace(/\s+/g, '_')}_${track}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMessage('Dokumen DOCX Kalender Konten berhasil diunduh (Bersih dari token)');
    } catch {
      setToastMessage('Gagal mengunduh dokumen DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-sandstone/60 border-b border-warmborder flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm">
              <CalendarIcon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-extrabold text-espresso tracking-tight">
                  Kalender Konten Media Sosial
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-terracotta/10 text-terracotta border border-terracotta/20">
                  30 Hari · 3 Slot/Hari
                </span>
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Mode Cuplikan 25% (Demo)
                  </span>
                )}
              </div>
              <p className="text-xs text-warmmuted">
                {projectName} · {calendar.slots.length} Slot Terjadwal ({calendar.postedSlotsCount} Sudah Diposting)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-terracotta text-white hover:bg-terracotta/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="size-3.5" />
              <span>{isExporting ? 'Mengekspor...' : 'Ekspor DOCX'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-sandstone hover:bg-warmborder text-espresso flex items-center gap-1 transition-colors cursor-pointer hidden md:flex"
            >
              <ExternalLink className="size-3.5" />
              <span>Cetak PDF</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Dual Track Switcher & View Switcher */}
        <div className="px-6 py-3 bg-white border-b border-warmborder flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Dual Track */}
          <div className="flex items-center gap-1.5 p-1 bg-sandstone rounded-2xl border border-warmborder">
            <button
              onClick={() => handleTrackChange('OFFICIAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                track === 'OFFICIAL'
                  ? 'bg-espresso text-white shadow-sm'
                  : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Akun Official Proyek
            </button>
            <button
              onClick={() => handleTrackChange('SALES_IN_HOUSE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                track === 'SALES_IN_HOUSE'
                  ? 'bg-espresso text-white shadow-sm'
                  : 'text-warmmuted hover:text-espresso'
              }`}
            >
              Akun Sales In-House (POV)
            </button>
          </div>

          {/* View Mode: Month, Week, Day */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-warmmuted mr-1">Tampilan:</span>
            <div className="flex p-1 bg-sandstone rounded-xl border border-warmborder">
              {(['month', 'week', 'day'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    viewMode === m
                      ? 'bg-white text-espresso shadow-sm'
                      : 'text-warmmuted hover:text-espresso'
                  }`}
                >
                  {m === 'month' ? 'Bulan' : m === 'week' ? 'Minggu' : 'Hari'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-2.5 bg-sandstone/30 border-b border-warmborder flex flex-wrap items-center gap-3 text-xs shrink-0">
          <span className="text-warmmuted font-bold flex items-center gap-1">
            <Filter className="size-3.5 text-terracotta" />
            Filter:
          </span>

          {/* Funnel Filter */}
          <div className="flex gap-1">
            {(['all', 'TOFU', 'MOFU', 'BOFU'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFunnel(f)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedFunnel === f
                    ? 'bg-terracotta text-white'
                    : 'bg-white border border-warmborder text-warmmuted hover:text-espresso'
                }`}
              >
                {f === 'all' ? 'Semua Funnel' : f}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex gap-1">
            {(['all', 'Instagram', 'TikTok', 'Facebook', 'X', 'YouTube Shorts'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedPlatform === p
                    ? 'bg-espresso text-white'
                    : 'bg-white border border-warmborder text-warmmuted hover:text-espresso'
                }`}
              >
                {p === 'all' ? 'Semua Platform' : p}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 ml-auto">
            {(['all', 'SIAP', 'SUDAH_POSTING'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedStatus === s
                    ? 'bg-olive text-white'
                    : 'bg-white border border-warmborder text-warmmuted hover:text-espresso'
                }`}
              >
                {s === 'all' ? 'Semua Status' : s === 'SIAP' ? 'Siap' : 'Sudah Posting'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5] space-y-6">
          {/* VIEW 1: MONTH GRID (30 Days) */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: isDemoMode ? 8 : 30 }).map((_, idx) => {
                const dayNum = idx + 1;
                const daySlots = filteredSlots.filter((s) => s.dayNumber === dayNum);
                const hasPosted = daySlots.some((s) => s.status === 'SUDAH_POSTING');

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      setSelectedDay(dayNum);
                      setViewMode('day');
                    }}
                    className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between hover:border-terracotta hover:shadow-md ${
                      hasPosted ? 'border-lime-300' : 'border-warmborder'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-warmborder/60">
                        <span className="text-xs font-black text-espresso">Hari {dayNum}</span>
                        {hasPosted ? (
                          <span className="text-[10px] font-bold text-olive flex items-center gap-0.5">
                            <CheckCircle2 className="size-3" />
                            Live
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-warmmuted">3 Slot</span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {daySlots.slice(0, 3).map((slot) => (
                          <div
                            key={slot.id}
                            className={`p-2 rounded-xl text-[11px] leading-tight flex flex-col gap-0.5 ${
                              slot.funnelStage === 'TOFU'
                                ? 'bg-amber-50/60 text-amber-900 border border-amber-200/60'
                                : slot.funnelStage === 'MOFU'
                                ? 'bg-blue-50/60 text-blue-900 border border-blue-200/60'
                                : 'bg-emerald-50/60 text-emerald-900 border border-emerald-200/60'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-[10px]">
                              <span>{slot.funnelStage} · {slot.scheduledTime}</span>
                              <span className="truncate max-w-[65px] font-semibold">{slot.platform}</span>
                            </div>
                            <p className="font-bold truncate text-espresso">{slot.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className="mt-3 text-[10px] font-bold text-terracotta text-right hover:underline">
                      Lihat Rincian &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: WEEK VIEW (Kanban 7 Days) */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              {/* Week Selector */}
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-warmborder">
                <span className="text-xs font-bold text-espresso">Pilih Minggu:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWeek(w)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedWeek === w
                          ? 'bg-terracotta text-white'
                          : 'bg-sandstone text-warmmuted hover:text-espresso'
                      }`}
                    >
                      Minggu {w} (Hari {(w - 1) * 7 + 1}–{Math.min(30, w * 7)})
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Columns in Week */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {Array.from({ length: weekEndDay - weekStartDay + 1 }).map((_, idx) => {
                  const dayNum = weekStartDay + idx;
                  const dayItems = weekSlots.filter((s) => s.dayNumber === dayNum);

                  return (
                    <div key={dayNum} className="bg-sandstone/30 rounded-2xl p-2.5 border border-warmborder flex flex-col gap-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-espresso">H-{dayNum}</span>
                        <span className="text-[10px] text-warmmuted font-bold">{dayItems.length} Slot</span>
                      </div>

                      <div className="space-y-2">
                        {dayItems.map((slot) => (
                          <div
                            key={slot.id}
                            onClick={() => setActiveSlotModal(slot)}
                            className="bg-white p-2.5 rounded-xl border border-warmborder hover:border-terracotta shadow-sm cursor-pointer space-y-1.5 transition-all"
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className={`px-1.5 py-0.2 rounded ${
                                slot.funnelStage === 'TOFU'
                                  ? 'bg-amber-100 text-amber-900'
                                  : slot.funnelStage === 'MOFU'
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}>
                                {slot.funnelStage}
                              </span>
                              <span className="text-warmmuted">{slot.scheduledTime}</span>
                            </div>
                            <p className="text-xs font-extrabold text-espresso leading-snug line-clamp-2">
                              {slot.title}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-warmmuted pt-1 border-t border-warmborder/40">
                              <span>{slot.platform}</span>
                              {slot.status === 'SUDAH_POSTING' && (
                                <CheckCircle2 className="size-3 text-olive" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: DAY VIEW (3 Detailed Cards for Morning, Afternoon, Evening) */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              {/* Day Navigator */}
              <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-warmborder">
                <span className="text-xs font-extrabold text-espresso">
                  Pilih Hari (1 s.d. {isDemoMode ? '8' : '30'}):
                </span>
                <div className="flex items-center gap-1 overflow-x-auto max-w-xl py-1">
                  {Array.from({ length: isDemoMode ? 8 : 30 }).map((_, idx) => {
                    const d = idx + 1;
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDay(d)}
                        className={`size-7 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          selectedDay === d
                            ? 'bg-terracotta text-white'
                            : 'bg-sandstone text-espresso hover:bg-warmborder'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Slot Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="bg-white rounded-3xl p-5 border border-warmborder shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Badge Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            slot.funnelStage === 'TOFU'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : slot.funnelStage === 'MOFU'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {slot.funnelStage} · {slot.scheduledTime}
                        </span>
                        <span className="text-xs font-bold text-warmmuted">
                          {slot.platform}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-espresso mt-3 leading-snug">
                        {slot.title}
                      </h3>
                      <p className="text-xs font-medium text-warmmuted mt-1 italic">
                        {slot.format}
                      </p>

                      {/* Brief */}
                      <div className="mt-3 p-3 rounded-2xl bg-sandstone/50 border border-warmborder text-xs">
                        <span className="font-bold text-espresso block mb-0.5">Brief Eksekusi Visual:</span>
                        <p className="text-warmmuted leading-relaxed">{slot.brief}</p>
                      </div>

                      {/* Caption Box */}
                      <div className="mt-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-terracotta">Draf Caption Siap Pakai:</span>
                          <button
                            onClick={() => handleCopyCaption(slot.caption, slot.hashtags, slot.cta)}
                            className="text-[11px] font-bold text-terracotta hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="size-3" />
                            Salin
                          </button>
                        </div>
                        <p className="text-espresso leading-relaxed line-clamp-4">{slot.caption}</p>
                      </div>

                      {/* Source Link */}
                      <div className="mt-3 text-[10px] text-warmmuted font-mono space-y-0.5">
                        <p>KB Fact: <strong className="text-espresso">{slot.sourceFactId}</strong></p>
                        <p>Surat Cinta: <strong className="text-espresso">Poin #{slot.sourceLoveLetterPoint}</strong></p>
                      </div>
                    </div>

                    {/* Bottom Action: Tempel Tautan Hasil Posting */}
                    <div className="pt-3 border-t border-warmborder flex items-center justify-between">
                      {slot.postedUrl ? (
                        <a
                          href={slot.postedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-olive flex items-center gap-1 hover:underline truncate max-w-[180px]"
                        >
                          <CheckCircle2 className="size-3.5 shrink-0" />
                          <span className="truncate">{slot.postedUrl}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] font-semibold text-warmmuted flex items-center gap-1">
                          <Clock className="size-3" />
                          Belum diposting
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setActiveSlotModal(slot);
                          setLinkInput(slot.postedUrl || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Link2 className="size-3.5 text-terracotta" />
                        <span>{slot.postedUrl ? 'Ubah Link' : 'Tempel Link'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode Demo Banner */}
          {isDemoMode && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-700 shrink-0" />
                Mode Demo menampilkan 8 hari pertama dari total 30 hari kalender konten penuh.
              </span>
              <span className="font-bold text-terracotta">Tingkatkan Paket untuk 30 Hari &rarr;</span>
            </div>
          )}
        </div>

        {/* Modal Detail & Tempel Link */}
        {activeSlotModal && (
          <div className="fixed inset-0 z-60 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-warmborder max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-warmborder pb-3">
                <div>
                  <span className="text-[11px] font-extrabold text-terracotta uppercase">
                    Hari {activeSlotModal.dayNumber} · {activeSlotModal.funnelStage} ({activeSlotModal.scheduledTime})
                  </span>
                  <h3 className="text-base font-extrabold text-espresso mt-0.5">
                    {activeSlotModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSlotModal(null)}
                  className="size-8 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Caption Full */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-sandstone/50 rounded-2xl border border-warmborder">
                  <span className="font-bold text-espresso block mb-1">Draf Caption Lengkap:</span>
                  <p className="text-espresso leading-relaxed whitespace-pre-line">{activeSlotModal.caption}</p>
                  <p className="text-terracotta font-semibold mt-2">{activeSlotModal.cta}</p>
                  <p className="text-warmmuted text-[11px] mt-1">{activeSlotModal.hashtags.join(' ')}</p>
                </div>

                {/* Form Tempel Link */}
                <div className="pt-2">
                  <label className="font-bold text-espresso block mb-1">
                    Tempel Tautan Hasil Posting (Live URL Instagram / TikTok / FB):
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/p/..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-warmborder text-xs font-medium text-espresso focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-warmborder flex items-center justify-between">
                <button
                  onClick={() => handleCopyCaption(activeSlotModal.caption, activeSlotModal.hashtags, activeSlotModal.cta)}
                  className="px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="size-3.5 text-terracotta" />
                  <span>Salin Caption</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSlotModal(null)}
                    className="px-4 py-2 rounded-xl bg-sandstone text-warmmuted text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleSavePostedUrl(activeSlotModal.id)}
                    className="px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 shadow-sm cursor-pointer"
                  >
                    Simpan Tautan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-espresso text-white text-xs font-medium flex items-center justify-between shrink-0">
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
