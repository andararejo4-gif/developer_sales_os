import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  MapPin,
  MessageSquareWarning,
  Navigation,
  X,
} from 'lucide-react';

export interface SeQuickStatusData {
  checkedIn?: boolean;
  checkedOut?: boolean;
  checkInTime?: string | null;
  routeDayName?: string;
  routeVisitedCount?: number;
  routeTotalCount?: number;
  slotsUploadedToday?: number;
  slotsTotalToday?: number;
  slotsReadyToPostToday?: number;
  urgentLeadsCount?: number;
  urgentLeadPreviews?: Array<{
    id: string;
    fullName: string;
    phoneWa: string;
    unitInterest: string;
  }>;
  reportSavedAt?: string | null;
}

interface SeDailyRoadmapStripProps {
  quickStatus?: SeQuickStatusData;
  onOpenFieldOps: () => void;
  onOpenUrgentPipeline: () => void;
  onOpenCalendar: () => void;
  onOpenDailyRoute: () => void;
  onOpenExportReport: () => void;
}

export const SeDailyRoadmapStrip: React.FC<SeDailyRoadmapStripProps> = ({
  quickStatus,
  onOpenFieldOps,
  onOpenUrgentPipeline,
  onOpenCalendar,
  onOpenDailyRoute,
  onOpenExportReport,
}) => {
  const checkedIn = Boolean(quickStatus?.checkedIn);
  const urgentCount = Number(quickStatus?.urgentLeadsCount ?? 0);
  const slotsUploaded = Number(quickStatus?.slotsUploadedToday ?? 0);
  const slotsTotal = Number(quickStatus?.slotsTotalToday ?? 3);
  const slotsReady = Number(quickStatus?.slotsReadyToPostToday ?? 0);
  const routeVisited = Number(quickStatus?.routeVisitedCount ?? 0);
  const routeTotal = Number(quickStatus?.routeTotalCount ?? 0);
  const hasSavedReport = Boolean(quickStatus?.reportSavedAt);

  const wibHour = new Date(Date.now() + 7 * 60 * 60 * 1000).getUTCHours();
  const isEndOfDayReminder = wibHour >= 17 && !hasSavedReport;

  return (
    <section className="bg-white border border-warmborder rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-terracotta" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso">
            Roadmap Kerja Harian SE (Urutan Prioritas)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-warmmuted hidden sm:inline">
          Klik langkah untuk langsung menuju halaman terkait
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Step 1: Absen & GPS */}
        <button
          type="button"
          onClick={onOpenFieldOps}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
            checkedIn
              ? 'bg-emerald-50/60 border-emerald-300'
              : 'bg-amber-50/80 border-amber-300 hover:border-terracotta'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`size-5 rounded-full text-[10px] font-black grid place-items-center shrink-0 ${
                  checkedIn ? 'bg-emerald-600 text-white' : 'bg-terracotta text-white'
                }`}
              >
                {checkedIn ? '✓' : '1'}
              </span>
              <span className="text-[11px] font-extrabold text-espresso truncate">
                Absen &amp; GPS
              </span>
            </div>
            <p className="text-[11px] font-bold text-warmmuted mt-1 truncate">
              {checkedIn
                ? quickStatus?.checkedOut
                  ? 'Selesai Tugas ✓'
                  : 'Sudah Check-In ✓'
                : 'Wajib Check-In & GPS'}
            </p>
          </div>
          <Navigation className={`size-4 shrink-0 ${checkedIn ? 'text-emerald-600' : 'text-terracotta'}`} />
        </button>

        {/* Step 2: Follow Up Lead Urgent */}
        <button
          type="button"
          onClick={onOpenUrgentPipeline}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
            urgentCount > 0
              ? 'bg-rose-50 border-rose-500 shadow-xs'
              : 'bg-emerald-50/60 border-emerald-300'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`size-5 rounded-full text-[10px] font-black grid place-items-center shrink-0 ${
                  urgentCount > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white'
                }`}
              >
                {urgentCount > 0 ? '!' : '✓'}
              </span>
              <span className={`text-[11px] font-extrabold truncate ${urgentCount > 0 ? 'text-rose-800' : 'text-espresso'}`}>
                Lead Perlu Ditangani
              </span>
            </div>
            <p className={`text-[11px] font-bold mt-1 truncate ${urgentCount > 0 ? 'text-rose-700' : 'text-warmmuted'}`}>
              {urgentCount > 0 ? `${urgentCount} Lead Belum Dibalas` : 'Semua Terbalas ✓'}
            </p>
          </div>
          <MessageSquareWarning className={`size-4 shrink-0 ${urgentCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
        </button>

        {/* Step 3: Konten & Rute Terjadwal */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
            slotsReady > 0
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-[#FBF9F5] border-warmborder'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-espresso text-white text-[10px] font-black grid place-items-center shrink-0">
                3
              </span>
              <span className="text-[11px] font-extrabold text-espresso truncate">
                Konten &amp; Rute
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={onOpenCalendar}
                className="text-terracotta hover:underline cursor-pointer truncate"
              >
                Konten {slotsUploaded}/{slotsTotal}
                {slotsReady > 0 ? ` (${slotsReady} Siap!)` : ''}
              </button>
              <span className="text-warmborder">·</span>
              <button
                type="button"
                onClick={onOpenDailyRoute}
                className="text-espresso hover:underline cursor-pointer truncate"
              >
                Rute {routeTotal > 0 ? `${routeVisited}/${routeTotal}` : 'Hari Ini'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onOpenCalendar}
              title="Buka Kalender Konten"
              className="p-1.5 rounded-lg bg-white border border-warmborder hover:border-terracotta cursor-pointer"
            >
              <Calendar className="size-3.5 text-terracotta" />
            </button>
            <button
              type="button"
              onClick={onOpenDailyRoute}
              title="Buka Rute Harian"
              className="p-1.5 rounded-lg bg-white border border-warmborder hover:border-terracotta cursor-pointer"
            >
              <MapPin className="size-3.5 text-espresso" />
            </button>
          </div>
        </div>

        {/* Step 4: Export Laporan */}
        <button
          type="button"
          onClick={onOpenExportReport}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
            isEndOfDayReminder
              ? 'bg-amber-50 border-terracotta'
              : hasSavedReport
              ? 'bg-emerald-50/60 border-emerald-300'
              : 'bg-[#FBF9F5] border-warmborder hover:border-terracotta'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`size-5 rounded-full text-[10px] font-black grid place-items-center shrink-0 ${
                  hasSavedReport ? 'bg-emerald-600 text-white' : 'bg-espresso text-white'
                }`}
              >
                {hasSavedReport ? '✓' : '4'}
              </span>
              <span className="text-[11px] font-extrabold text-espresso truncate">
                Export Laporan
              </span>
            </div>
            <p className="text-[11px] font-bold text-warmmuted mt-1 truncate">
              {isEndOfDayReminder
                ? 'Waktunya Export (≤ 18.00)'
                : hasSavedReport
                ? 'Tersimpan · Export PDF/Excel'
                : 'Format PDF / Excel'}
            </p>
          </div>
          <FileSpreadsheet className="size-4 text-terracotta shrink-0" />
        </button>
      </div>
    </section>
  );
};

interface SeGuidedTourModalProps {
  activeView: string;
  quickStatus?: SeQuickStatusData;
  snoozedUntilMs: number;
  h5Reminder?: {
    title: string;
    badge: string;
    summary: string;
    recommendations: string[];
    ctaLabel: string;
    target: 'lapangan' | 'pipeline' | 'kalender' | 'rute' | 'export' | 'profile';
  } | null;
  onDismissH5?: () => void;
  onNavigateH5?: (target: 'lapangan' | 'pipeline' | 'kalender' | 'rute' | 'export' | 'profile') => void;
  onSnooze: () => void;
  onGoToFieldOps: () => void;
  onGoToUrgentPipeline: () => void;
}

export const SeGuidedTourModal: React.FC<SeGuidedTourModalProps> = ({
  activeView,
  quickStatus,
  snoozedUntilMs,
  h5Reminder,
  onDismissH5,
  onNavigateH5,
  onSnooze,
  onGoToFieldOps,
  onGoToUrgentPipeline,
}) => {
  // Prioritas 0: Pengingat H-5 Menit Real-Time (Konten / Export Laporan)
  if (h5Reminder) {
    return (
      <div className="fixed inset-0 z-60 bg-espresso/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-amber-300 w-full sm:max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95">
          <div className="px-5 py-4 bg-espresso text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-9 rounded-xl bg-amber-400 text-espresso grid place-items-center shrink-0">
                <Clock className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Pengingat {h5Reminder.badge}
                </span>
                <h3 className="text-sm font-extrabold truncate">{h5Reminder.title}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismissH5}
              aria-label="Tutup pengingat"
              className="size-9 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-5 space-y-3.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <p className="text-xs font-semibold text-espresso leading-relaxed">
              {h5Reminder.summary}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {h5Reminder.recommendations.slice(0, 2).map((r, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-espresso inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="size-3 text-terracotta shrink-0" />
                  <span>{r}</span>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onNavigateH5?.(h5Reminder.target)}
                className="col-span-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="truncate">{h5Reminder.ctaLabel}</span>
                <ArrowRight className="size-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={onDismissH5}
                className="min-h-[44px] px-3 py-2.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quickStatus) return null;
  if (Date.now() < snoozedUntilMs) return null;

  const needsAttendance = !quickStatus.checkedIn;
  const urgentCount = Number(quickStatus.urgentLeadsCount ?? 0);

  // Prioritas 1 (Pagi): Belum Absen & Aktivasi GPS (ringkas & scannable)
  if (needsAttendance && activeView !== 'lapangan') {
    return (
      <div className="fixed inset-0 z-60 bg-espresso/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-warmborder w-full sm:max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95">
          <div className="px-5 py-4 bg-espresso text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-terracotta text-white grid place-items-center shrink-0">
                <Navigation className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Wajib Pagi · Langkah 1
                </span>
                <h3 className="text-sm font-extrabold">Check-In Absensi &amp; GPS</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onSnooze}
              aria-label="Tutup sementara"
              className="size-9 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-5 space-y-3.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <p className="text-xs font-semibold text-espresso">
              Presensi GPS hari ini belum tercatat. Aktifkan sekarang agar kunjungan masuk ke Laporan Harian.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1.5 rounded-xl bg-sandstone border border-warmborder text-[11px] font-bold text-espresso inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-terracotta" />
                Lampirkan Foto &amp; Check-In
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-sandstone border border-warmborder text-[11px] font-bold text-espresso inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-terracotta" />
                Izinkan Akses GPS
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={onGoToFieldOps}
                className="col-span-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Check-In Sekarang</span>
                <ArrowRight className="size-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={onSnooze}
                className="min-h-[44px] px-3 py-2.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold cursor-pointer"
              >
                Nanti 30m
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prioritas 2 (CRITICAL URGENT): Lead / WA Belum Ditangani
  if (urgentCount > 0 && activeView !== 'pipeline') {
    const previews = quickStatus.urgentLeadPreviews || [];
    return (
      <div className="fixed inset-0 z-60 bg-espresso/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl border-2 border-rose-500 w-full sm:max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95">
          <div className="px-5 py-4 bg-rose-600 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-white/20 text-white grid place-items-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-100">
                  Prioritas Urgent · SLA ≤ 5 Menit
                </span>
                <h3 className="text-sm font-extrabold">
                  {urgentCount} Lead Menunggu Follow Up
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onSnooze}
              aria-label="Tutup sementara"
              className="size-9 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-5 space-y-3.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {previews.length > 0 ? (
              <div className="space-y-1.5">
                {previews.slice(0, 2).map((ld) => (
                  <div
                    key={ld.id}
                    className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-rose-900 truncate">{ld.fullName}</p>
                      <p className="text-[11px] text-rose-700 truncate">{ld.phoneWa}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-extrabold shrink-0">
                      Belum Dibalas
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-espresso">
                Ada {urgentCount} prospek baru yang belum dibalas. Segera tanggapi sebelum SLA lewat.
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={onGoToUrgentPipeline}
                className="col-span-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Follow Up Sekarang</span>
                <ArrowRight className="size-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={onSnooze}
                className="min-h-[44px] px-3 py-2.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1"
              >
                <Clock className="size-3.5" />
                <span>30m</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
