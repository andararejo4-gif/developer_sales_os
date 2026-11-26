import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Download, FileSpreadsheet, MapPin, PhoneCall, RefreshCw, Users } from 'lucide-react';
import { loadAuthSession } from '../lib/auth/dummy-accounts';
import {
  exportSmDailyReportExcel,
  exportSmDailyReportPdf,
  type SmTeamSeReportRow,
} from '../lib/exporters/daily-report-exporter';

interface SmDailyReportResponse {
  ok: boolean;
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

export const SmDailyReportPanel: React.FC<{ projectName: string }> = ({ projectName }) => {
  const [dateStr, setDateStr] = useState(() =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  );
  const [data, setData] = useState<SmDailyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = loadAuthSession();
      const res = await fetch(`/api/sm/daily-report?date=${encodeURIComponent(dateStr)}`, {
        credentials: 'include',
        headers: {
          ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
        },
      });
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
  }, [dateStr]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

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
            Menyatukan aktivitas SM hari ini serta seluruh absen, GPS, call, canvassing, konten, dan lead dari setiap SE di bawahnya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone/50 text-xs font-semibold text-espresso">
            <Calendar className="size-3.5 text-terracotta" />
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none"
            />
          </label>
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
