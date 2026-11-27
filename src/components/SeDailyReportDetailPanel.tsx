import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  MapPin,
  PhoneCall,
  RefreshCw,
  Users,
} from 'lucide-react';
import { loadAuthSession } from '../lib/auth/dummy-accounts';
import {
  exportSmDailyReportExcel,
  exportSmDailyReportPdf,
  type SmTeamSeReportRow,
} from '../lib/exporters/daily-report-exporter';
import { ManualDailyActivityBox } from './ManualDailyActivityBox';

interface SeDailyReportResponse {
  ok: boolean;
  startDate: string;
  endDate: string;
  date: string;
  teamTotals: {
    totalSe: number;
    checkedInCount: number;
    totalGpsLogs: number;
    totalCalls: number;
    totalCanvassing: number;
    totalContentPosted: number;
    totalLeadsToday: number;
    totalBookingsToday: number;
  };
  seReports: SmTeamSeReportRow[];
}

function toIsoDate(y: number, mZero: number, d: number): string {
  return `${y}-${String(mZero + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatShortId(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const SeDailyReportDetailPanel: React.FC<{ projectName: string }> = ({ projectName }) => {
  const todayWib = useMemo(
    () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
    []
  );
  const [startDate, setStartDate] = useState(todayWib);
  const [endDate, setEndDate] = useState(todayWib);
  const [pickPhase, setPickPhase] = useState<'IDLE' | 'PICKING_END'>('IDLE');
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [calYear, setCalYear] = useState(() => Number(todayWib.slice(0, 4)));
  const [calMonth, setCalMonth] = useState(() => Number(todayWib.slice(5, 7)) - 1);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<SeDailyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
        setPickPhase('IDLE');
        setHoverDate(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = loadAuthSession();
      const res = await fetch(
        `/api/se/daily-report?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        {
          credentials: 'include',
          headers: {
            ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
          },
        }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal memuat detail laporan harian SE.');
        return;
      }
      setData(json);
    } catch {
      setError('Tidak dapat terhubung ke server untuk memuat detail laporan SE.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const handleDayClick = (iso: string) => {
    if (pickPhase === 'IDLE') {
      setStartDate(iso);
      setEndDate(iso);
      setPickPhase('PICKING_END');
    } else {
      if (iso < startDate) {
        setEndDate(startDate);
        setStartDate(iso);
      } else {
        setEndDate(iso);
      }
      setPickPhase('IDLE');
      setHoverDate(null);
      setPickerOpen(false);
    }
  };

  const applyPreset = (daysBack: number) => {
    const end = new Date(`${todayWib}T00:00:00`);
    const start = new Date(end.getTime() - daysBack * 86400000);
    setStartDate(toIsoDate(start.getFullYear(), start.getMonth(), start.getDate()));
    setEndDate(todayWib);
    setPickPhase('IDLE');
    setHoverDate(null);
    setPickerOpen(false);
  };

  const calendarDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: Array<{ iso: string; day: number } | null> = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push({ iso: toIsoDate(calYear, calMonth, d), day: d });
    return cells;
  }, [calYear, calMonth]);

  const shiftMonth = (delta: number) => {
    const dt = new Date(calYear, calMonth + delta, 1);
    setCalYear(dt.getFullYear());
    setCalMonth(dt.getMonth());
  };

  const myReport = data?.seReports?.[0] || null;
  const logs = myReport?.details?.fieldLogs || [];
  const leads = myReport?.details?.leads || [];
  const notes = myReport?.details?.dailyNotes || [];

  const handleExport = (mode: 'pdf' | 'excel') => {
    if (!data || !myReport) return;
    const payload = {
      reportMode: 'se' as const,
      projectName,
      smName: myReport.seName,
      smEmail: myReport.seEmail,
      dateLabel: data.date,
      smActivities: [],
      teamTotals: data.teamTotals,
      seReports: data.seReports,
    };
    if (mode === 'pdf') exportSmDailyReportPdf(payload);
    else exportSmDailyReportExcel(payload);
  };

  const rangePreviewEnd =
    pickPhase === 'PICKING_END' && hoverDate ? (hoverDate >= startDate ? hoverDate : startDate) : endDate;
  const rangePreviewStart =
    pickPhase === 'PICKING_END' && hoverDate && hoverDate < startDate ? hoverDate : startDate;

  return (
    <section className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-espresso text-white text-[11px] font-bold">
            Riwayat &amp; Detail Aktivitas SE
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-espresso mt-1.5">
            Rincian Laporan Harian Saya (Absen, GPS, Call, Canvassing &amp; Lead)
          </h2>
          <p className="text-xs text-warmmuted">
            Pilih rentang tanggal untuk meninjau dan mengekspor seluruh catatan aktivitas lapangan Anda dari database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="h-9 px-3 rounded-lg border border-warmborder bg-white hover:bg-sandstone/40 text-xs font-semibold text-espresso flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Calendar className="size-3.5 text-terracotta" />
              <span>
                {startDate === endDate
                  ? formatShortId(startDate)
                  : `${formatShortId(startDate)} – ${formatShortId(endDate)}`}
              </span>
            </button>

            {pickerOpen && (
              <div className="absolute right-0 mt-2 z-40 w-[300px] bg-white border border-warmborder rounded-2xl shadow-xl p-3 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset(0)}
                    className="px-2 py-1 rounded-md bg-sandstone hover:bg-warmborder text-[11px] font-semibold text-espresso cursor-pointer"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(6)}
                    className="px-2 py-1 rounded-md bg-sandstone hover:bg-warmborder text-[11px] font-semibold text-espresso cursor-pointer"
                  >
                    7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(29)}
                    className="px-2 py-1 rounded-md bg-sandstone hover:bg-warmborder text-[11px] font-semibold text-espresso cursor-pointer"
                  >
                    30 Hari
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="p-1 rounded-md hover:bg-sandstone text-espresso cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-xs font-bold text-espresso">
                    {new Date(calYear, calMonth, 1).toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="p-1 rounded-md hover:bg-sandstone text-espresso cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-warmmuted">
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarDays.map((cell, idx) => {
                    if (!cell) return <div key={`e-${idx}`} />;
                    const isStart = cell.iso === rangePreviewStart;
                    const isEnd = cell.iso === rangePreviewEnd;
                    const inRange = cell.iso > rangePreviewStart && cell.iso < rangePreviewEnd;
                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        onClick={() => handleDayClick(cell.iso)}
                        onMouseEnter={() => pickPhase === 'PICKING_END' && setHoverDate(cell.iso)}
                        className={`h-8 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          isStart || isEnd
                            ? 'bg-espresso text-white font-bold'
                            : inRange
                              ? 'bg-amber-100 text-espresso'
                              : 'hover:bg-sandstone text-espresso'
                        }`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void loadReport()}
            className="h-9 px-3 rounded-lg border border-warmborder bg-sandstone hover:bg-warmborder text-xs font-semibold text-espresso flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
          </button>
          <button
            type="button"
            disabled={!myReport}
            onClick={() => handleExport('pdf')}
            className="h-9 px-3 rounded-lg bg-espresso hover:bg-espresso/90 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="size-3.5" /> Export PDF Detail
          </button>
          <button
            type="button"
            disabled={!myReport}
            onClick={() => handleExport('excel')}
            className="h-9 px-3 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="size-3.5" /> Export Excel Detail
          </button>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {myReport && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder">
              <span className="text-[11px] text-warmmuted block">Absen Masuk</span>
              <span className="text-lg font-extrabold text-espresso mt-0.5 block">
                {myReport.checkInAt
                  ? `${new Date(myReport.checkInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                  : 'Belum'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder">
              <span className="text-[11px] text-warmmuted flex items-center gap-1">
                <MapPin className="size-3 text-terracotta" /> Titik GPS &amp; Call
              </span>
              <span className="text-lg font-extrabold text-espresso mt-0.5 block">
                {myReport.gpsCount} GPS · {myReport.callCount} Call
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder">
              <span className="text-[11px] text-warmmuted flex items-center gap-1">
                <PhoneCall className="size-3 text-espresso" /> Canvassing &amp; Konten
              </span>
              <span className="text-lg font-extrabold text-espresso mt-0.5 block">
                {myReport.canvassingContacts} Canv · {myReport.contentPosted} Konten
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder">
              <span className="text-[11px] text-warmmuted flex items-center gap-1">
                <Users className="size-3 text-olive" /> Lead &amp; Booking
              </span>
              <span className="text-lg font-extrabold text-olive mt-0.5 block">
                {myReport.leadsToday} Lead · {myReport.bookingsCount} Booking
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
            <div className="bg-sandstone/25 rounded-xl border border-warmborder p-3">
              <div className="font-bold text-espresso mb-2">Catatan Harian Playbook ({notes.length})</div>
              {notes.length === 0 ? (
                <p className="text-warmmuted">Belum ada catatan harian pada periode ini.</p>
              ) : (
                <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {notes.map((n, idx) => (
                    <li key={idx} className="bg-white rounded-lg border border-warmborder/60 p-2">
                      <div className="font-bold text-espresso">{n.reportDate}</div>
                      <div className="text-[11px] text-warmmuted">
                        Call: {n.dialCount} ({n.connectedCallCount} sambung) · Canv: {n.canvassingContacts} kontak / {n.canvassingBrochures} brosur / {n.canvassingLeads} lead
                      </div>
                      <div className="text-[11px] text-warmmuted">
                        Konten: {n.postedReels} reels · {n.postedWaStatus} WA · {n.postedStories} story
                      </div>
                      {n.hambatan && <div className="text-[11px] text-rose-700 mt-0.5">Hambatan: {n.hambatan}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-sandstone/25 rounded-xl border border-warmborder p-3">
              <div className="font-bold text-espresso mb-2">Log Lapangan Absen, GPS &amp; Call ({logs.length})</div>
              {logs.length === 0 ? (
                <p className="text-warmmuted">Belum ada log lapangan pada periode ini.</p>
              ) : (
                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {logs.map((l, idx) => (
                    <li key={idx} className="bg-white rounded-lg border border-warmborder/60 p-2 flex items-start gap-2.5">
                      {l.photoDataUrl && (
                        <a href={l.photoDataUrl} target="_blank" rel="noreferrer" className="shrink-0" title="Klik untuk lihat foto ukuran penuh">
                          <img
                            src={l.photoDataUrl}
                            alt="Bukti Lapangan"
                            className="size-12 rounded-lg object-cover border border-warmborder"
                          />
                        </a>
                      )}
                      <div className="min-w-0 flex-1">
                        <div>
                          <span className="font-bold text-terracotta">[{l.logType}]</span>{' '}
                          <span className="text-[11px] text-warmmuted">
                            {new Date(l.createdAt).toLocaleString('id-ID', {
                              timeZone: 'Asia/Jakarta',
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="font-semibold text-espresso text-[11px]">{l.title || '-'}</div>
                        {l.locationLabel && <div className="text-[10px] text-warmmuted">{l.locationLabel}</div>}
                        {l.lat != null && l.lng != null && (
                          <div className="text-[10px] font-mono text-olive">
                            Koordinat: {Number(l.lat).toFixed(5)}, {Number(l.lng).toFixed(5)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-sandstone/25 rounded-xl border border-warmborder p-3">
              <div className="font-bold text-espresso mb-2">Prospek / Lead Ditangani ({leads.length})</div>
              {leads.length === 0 ? (
                <p className="text-warmmuted">Belum ada prospek pada periode ini.</p>
              ) : (
                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {leads.map((ld, idx) => (
                    <li key={idx} className="bg-white rounded-lg border border-warmborder/60 p-2">
                      <div className="font-bold text-espresso">
                        {ld.fullName} <span className="text-olive">({ld.stage})</span>
                      </div>
                      <div className="text-[11px] text-warmmuted">
                        {ld.unitInterest} · {ld.source} · BANT {ld.bantTotal}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <ManualDailyActivityBox
            title="Catatan Aktivitas Harian Saya (Kantor / Non-Lead)"
            defaultDate={todayWib}
            items={myReport?.details?.manualActivities || []}
            onSaved={() => void loadReport()}
          />
        </>
      )}
    </section>
  );
};
