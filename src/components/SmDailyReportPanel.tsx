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

interface SmDailyReportResponse {
  ok: boolean;
  startDate: string;
  endDate: string;
  date: string;
  smSummary: {
    name: string;
    email: string;
    role: string;
    ownActivities: Array<{ action: string; entity: string; entity_id?: string; created_at: string }>;
  };
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

export const SmDailyReportPanel: React.FC<{ projectName: string }> = ({ projectName }) => {
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

  const [data, setData] = useState<SmDailyReportResponse | null>(null);
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
        `/api/sm/daily-report?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        {
          credentials: 'include',
          headers: {
            ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
          },
        }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal memuat laporan harian SM & tim SE.');
        return;
      }
      setData(json);
    } catch {
      setError('Tidak dapat terhubung ke server untuk memuat laporan SM.');
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

  const applyPreset = (daysBack: number | 'MONTH') => {
    const [y, m, d] = todayWib.split('-').map(Number);
    if (daysBack === 'MONTH') {
      setStartDate(toIsoDate(y, m - 1, 1));
      setEndDate(todayWib);
    } else {
      const dt = new Date(y, m - 1, d - daysBack);
      setStartDate(toIsoDate(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      setEndDate(todayWib);
    }
    setPickPhase('IDLE');
    setHoverDate(null);
    setPickerOpen(false);
  };

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: Array<{ iso: string | null; day: number | null }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ iso: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ iso: toIsoDate(calYear, calMonth, d), day: d });
    }
    return cells;
  }, [calYear, calMonth]);

  const previewEnd = pickPhase === 'PICKING_END' && hoverDate ? hoverDate : endDate;
  const [rangeMin, rangeMax] = startDate <= previewEnd ? [startDate, previewEnd] : [previewEnd, startDate];

  const periodLabel =
    startDate === endDate
      ? formatShortId(startDate)
      : `${formatShortId(startDate)} – ${formatShortId(endDate)}`;

  const handleExport = (format: 'pdf' | 'excel') => {
    if (!data) return;
    const params = {
      projectName,
      smName: data.smSummary.name,
      smEmail: data.smSummary.email,
      dateLabel: data.date,
      smActivities: data.smSummary.ownActivities,
      teamTotals: data.teamTotals,
      seReports: data.seReports,
    };
    if (format === 'pdf') exportSmDailyReportPdf(params);
    else exportSmDailyReportExcel(params);
  };

  return (
    <section className="bg-white border border-warmborder rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-espresso text-white">
              Laporan Terpadu SM + Tim SE
            </span>
            <h3 className="text-base font-extrabold text-espresso">
              Laporan Harian SM &amp; Seluruh SE Binaan
            </h3>
          </div>
          <p className="text-xs text-warmmuted mt-1">
            Menyatukan aktivitas SM serta seluruh absen, GPS, call, canvassing, konten, dan lead dari setiap SE pada periode terpilih.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="h-9 px-3 rounded-lg border border-warmborder bg-sandstone/60 hover:bg-sandstone text-xs font-bold text-espresso flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Calendar className="size-3.5 text-terracotta shrink-0" />
              <span>{periodLabel}</span>
            </button>

            {pickerOpen && (
              <div className="absolute right-0 mt-2 z-50 w-72 bg-white border border-warmborder rounded-2xl shadow-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalYear((y) => y - 1);
                        setCalMonth(11);
                      } else {
                        setCalMonth((m) => m - 1);
                      }
                    }}
                    className="size-7 rounded-lg hover:bg-sandstone grid place-items-center text-espresso cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-xs font-extrabold text-espresso">
                    {new Date(calYear, calMonth, 1).toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalYear((y) => y + 1);
                        setCalMonth(0);
                      } else {
                        setCalMonth((m) => m + 1);
                      }
                    }}
                    className="size-7 rounded-lg hover:bg-sandstone grid place-items-center text-espresso cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-warmmuted">
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                  {calendarCells.map((cell, idx) => {
                    if (!cell.iso || !cell.day) return <div key={`empty-${idx}`} />;
                    const isEdge = cell.iso === rangeMin || cell.iso === rangeMax;
                    const inBetween = cell.iso > rangeMin && cell.iso < rangeMax;
                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        onClick={() => handleDayClick(cell.iso!)}
                        onMouseEnter={() => {
                          if (pickPhase === 'PICKING_END') setHoverDate(cell.iso);
                        }}
                        className={`h-8 text-xs font-semibold transition-colors cursor-pointer ${
                          isEdge
                            ? 'bg-terracotta text-white rounded-lg font-bold'
                            : inBetween
                            ? 'bg-terracotta/15 text-espresso'
                            : 'hover:bg-sandstone text-espresso rounded-lg'
                        }`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-warmmuted text-center">
                  {pickPhase === 'PICKING_END'
                    ? 'Pilih tanggal akhir periode (atau klik tanggal sama untuk 1 hari).'
                    : 'Klik tanggal mulai, lalu tanggal selesai (seperti pesan tiket/hotel).'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 border-t border-warmborder/60">
                  <button
                    type="button"
                    onClick={() => applyPreset(0)}
                    className="px-2.5 py-1 rounded-md bg-sandstone hover:bg-warmborder text-[10px] font-bold text-espresso cursor-pointer"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(6)}
                    className="px-2.5 py-1 rounded-md bg-sandstone hover:bg-warmborder text-[10px] font-bold text-espresso cursor-pointer"
                  >
                    7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('MONTH')}
                    className="px-2.5 py-1 rounded-md bg-sandstone hover:bg-warmborder text-[10px] font-bold text-espresso cursor-pointer"
                  >
                    Bulan Ini
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void loadReport()}
            className="h-9 px-3 rounded-lg border border-warmborder bg-white hover:bg-sandstone text-espresso text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
          </button>
          <button
            type="button"
            disabled={!data}
            onClick={() => handleExport('pdf')}
            className="h-9 px-3 rounded-lg bg-espresso hover:bg-espresso/90 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="size-3.5" /> Export PDF
          </button>
          <button
            type="button"
            disabled={!data}
            onClick={() => handleExport('excel')}
            className="h-9 px-3 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="size-3.5" /> Export Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder">
              <span className="text-[11px] text-warmmuted block">Absensi SE Hadir</span>
              <span className="text-lg font-extrabold text-espresso mt-0.5 block">
                {data.teamTotals.checkedInCount} / {data.teamTotals.totalSe} SE
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder">
              <span className="text-[11px] text-warmmuted flex items-center gap-1">
                <MapPin className="size-3 text-terracotta" /> Titik GPS &amp; Call SE
              </span>
              <span className="text-lg font-extrabold text-espresso mt-0.5 block">
                {data.teamTotals.totalGpsLogs} GPS · {data.teamTotals.totalCalls} Call
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder">
              <span className="text-[11px] text-warmmuted flex items-center gap-1">
                <Users className="size-3 text-olive" /> Lead &amp; Booking Tim
              </span>
              <span className="text-lg font-extrabold text-olive mt-0.5 block">
                {data.teamTotals.totalLeadsToday} Lead · {data.teamTotals.totalBookingsToday} Booking
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sandstone/50 border border-warmborder">
              <span className="text-[11px] text-warmmuted flex items-center gap-1">
                <PhoneCall className="size-3 text-espresso" /> Aktivitas SM Sendiri
              </span>
              <span className="text-lg font-extrabold text-espresso mt-0.5 block">
                {data.smSummary.ownActivities.length} Aksi Tercatat
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-warmborder rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-sandstone/70 text-espresso border-b border-warmborder">
                  <th className="py-2.5 px-3 font-bold">Sales Executive</th>
                  <th className="py-2.5 px-3 font-bold text-center">Absen</th>
                  <th className="py-2.5 px-3 font-bold">GPS &amp; Lokasi</th>
                  <th className="py-2.5 px-3 font-bold text-center">Call</th>
                  <th className="py-2.5 px-3 font-bold text-center">Canvassing</th>
                  <th className="py-2.5 px-3 font-bold text-center">Konten</th>
                  <th className="py-2.5 px-3 font-bold text-center">Lead</th>
                  <th className="py-2.5 px-3 font-bold text-center">Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmborder/60">
                {data.seReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-warmmuted">
                      Belum ada SE terdaftar di tenant ini.
                    </td>
                  </tr>
                ) : (
                  data.seReports.map((se) => (
                    <tr key={se.seEmail} className="hover:bg-sandstone/30">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-espresso">{se.seName}</div>
                        <div className="text-[10px] text-warmmuted">{se.seEmail}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {se.checkInAt ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            {new Date(se.checkInAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-semibold">Belum</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-espresso">{se.gpsCount} titik</span>
                        {se.latestLocation && (
                          <div className="text-[10px] text-warmmuted truncate max-w-[180px]">
                            {se.latestLocation}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{se.callCount}</td>
                      <td className="py-2.5 px-3 text-center">{se.canvassingContacts}</td>
                      <td className="py-2.5 px-3 text-center">{se.contentPosted}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-olive">{se.leadsToday}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-espresso">{se.bookingsCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
