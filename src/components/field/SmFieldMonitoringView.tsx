import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  Navigation,
  UserCheck,
  X,
} from 'lucide-react';
import type { SeAttendanceRecord, SeGpsTrackPoint } from '../../lib/field-ops/types';

export interface DbFieldLogRow {
  id: string;
  se_email: string;
  se_name: string;
  log_type: 'CHECK_IN' | 'CHECK_OUT' | 'GPS' | 'CALL' | string;
  title: string;
  location_label: string;
  lat: number | null;
  lng: number | null;
  photo_data_url?: string | null;
  notes?: string;
  created_at: string;
}

type AttendancePeriod = 'harian' | 'mingguan' | 'bulanan';

interface SmFieldMonitoringViewProps {
  mode: 'absen' | 'gps';
  projectName: string;
  baseCoords: { lat: number; lng: number };
  dbFieldLogs: DbFieldLogRow[];
  seMembers?: Array<{ email: string; name: string }>;
  isLoading?: boolean;
  fallbackAttendance?: SeAttendanceRecord[];
  fallbackGpsLogs?: SeGpsTrackPoint[];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}

function toWibDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

function fmtWibTime(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }) + ' WIB';
}

export const SmFieldMonitoringView: React.FC<SmFieldMonitoringViewProps> = ({
  mode,
  projectName,
  baseCoords,
  dbFieldLogs,
  seMembers = [],
  isLoading = false,
}) => {
  const [period, setPeriod] = useState<AttendancePeriod>('harian');
  const [selectedSeEmail, setSelectedSeEmail] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  );
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const todayKey = useMemo(
    () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
    []
  );

  // Daftar SE terdaftar HANYA dari akun SE nyata di DB tenant + akun SE yang tercatat di DB logs (tanpa data dummy)
  const registeredSes = useMemo(() => {
    const map = new Map<string, { email: string; name: string; seId: string; zone: string }>();
    for (const member of seMembers) {
      const email = String(member.email || '').trim().toLowerCase();
      if (!email) continue;
      map.set(email, {
        email,
        name: member.name || email.split('@')[0],
        seId: 'SE',
        zone: 'Lapangan',
      });
    }
    for (const log of dbFieldLogs) {
      const email = String(log.se_email || '').trim().toLowerCase();
      if (email && !map.has(email)) {
        map.set(email, {
          email,
          name: log.se_name || email.split('@')[0],
          seId: 'SE',
          zone: 'Lapangan',
        });
      }
    }
    return Array.from(map.values());
  }, [seMembers, dbFieldLogs]);

  // Filter logs berdasarkan periode Harian / Mingguan / Bulanan
  const periodStartKey = useMemo(() => {
    const now = new Date();
    if (period === 'harian') return todayKey;
    if (period === 'mingguan') {
      const d = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    }
    return `${todayKey.slice(0, 7)}-01`;
  }, [period, todayKey]);

  const attendanceSummaryPerSe = useMemo(() => {
    return registeredSes.map((se) => {
      const seLogs = dbFieldLogs.filter(
        (l) =>
          String(l.se_email || '').toLowerCase() === se.email &&
          (l.log_type === 'CHECK_IN' || l.log_type === 'CHECK_OUT') &&
          toWibDateKey(l.created_at) >= periodStartKey
      );
      const checkIns = seLogs.filter((l) => l.log_type === 'CHECK_IN');
      const checkOuts = seLogs.filter((l) => l.log_type === 'CHECK_OUT');
      const todayIn = checkIns.filter((l) => toWibDateKey(l.created_at) === todayKey).slice(-1)[0];
      const todayOut = checkOuts.filter((l) => toWibDateKey(l.created_at) === todayKey)[0];

      const firstInLabel = todayIn
        ? fmtWibTime(todayIn.created_at)
        : checkIns[checkIns.length - 1]
        ? fmtWibTime(checkIns[checkIns.length - 1].created_at)
        : '-';
      const lastOutLabel = todayOut
        ? fmtWibTime(todayOut.created_at)
        : checkOuts[0]
        ? fmtWibTime(checkOuts[0].created_at)
        : 'Belum';

      const uniquePresentDays = new Set(checkIns.map((c) => toWibDateKey(c.created_at))).size;
      const statusLabel = todayIn
        ? todayOut
          ? 'Selesai Tugas'
          : 'Hadir / Bertugas'
        : uniquePresentDays > 0 && period !== 'harian'
        ? `${uniquePresentDays} Hari Hadir`
        : 'Belum Absen';

      return {
        ...se,
        firstInLabel,
        lastOutLabel,
        statusLabel,
        uniquePresentDays,
        totalLogsCount: seLogs.length,
        photosCount: seLogs.filter((l) => Boolean(l.photo_data_url)).length,
        latestCoords:
          todayIn?.lat != null && todayIn?.lng != null
            ? `${Number(todayIn.lat).toFixed(5)}, ${Number(todayIn.lng).toFixed(5)}`
            : '-',
        logs: seLogs,
      };
    });
  }, [registeredSes, dbFieldLogs, periodStartKey, todayKey, period]);

  const handleExportAttendanceExcel = () => {
    const rowsHtml = attendanceSummaryPerSe
      .map(
        (row, idx) => `
        <tr>
          <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #d1d5db;padding:6px;">${row.name}</td>
          <td style="border:1px solid #d1d5db;padding:6px;">${row.email}</td>
          <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${row.firstInLabel}</td>
          <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${row.lastOutLabel}</td>
          <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${row.latestCoords}</td>
          <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${row.statusLabel}</td>
        </tr>`
      )
      .join('');

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body>
      <h3>Rekap Absensi Tim SE (${period.toUpperCase()}) - ${projectName}</h3>
      <p>Tanggal Export: ${todayKey}</p>
      <table style="border-collapse:collapse;font-family:Arial;font-size:12px;">
        <thead><tr style="background:#2C1E16;color:#fff;">
          <th style="border:1px solid #2C1E16;padding:6px;">No</th>
          <th style="border:1px solid #2C1E16;padding:6px;">Nama SE</th>
          <th style="border:1px solid #2C1E16;padding:6px;">Email</th>
          <th style="border:1px solid #2C1E16;padding:6px;">Jam Masuk</th>
          <th style="border:1px solid #2C1E16;padding:6px;">Jam Keluar</th>
          <th style="border:1px solid #2C1E16;padding:6px;">Koordinat Terakhir</th>
          <th style="border:1px solid #2C1E16;padding:6px;">Status</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table></body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-absensi-se-${period}-${todayKey}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===========================================================================
  // MODE 1: ABSENSI (SM)
  // ===========================================================================
  if (mode === 'absen') {
    const selectedSeDetail = selectedSeEmail
      ? attendanceSummaryPerSe.find((s) => s.email === selectedSeEmail)
      : null;

    if (selectedSeDetail) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-warmborder">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedSeEmail(null)}
                className="min-h-[40px] px-3 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                <span>Kembali ke Daftar SE</span>
              </button>
              <div>
                <h3 className="text-sm font-extrabold text-espresso">
                  Detail Absensi: {selectedSeDetail.name}
                </h3>
                <p className="text-[11px] text-warmmuted">
                  Periode {period.toUpperCase()} · {selectedSeDetail.email}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-lime-100 text-olive text-xs font-extrabold">
              {selectedSeDetail.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-warmborder">
              <p className="text-[11px] font-bold uppercase text-warmmuted">Jam Masuk (In)</p>
              <p className="text-lg font-extrabold text-olive mt-1">{selectedSeDetail.firstInLabel}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-warmborder">
              <p className="text-[11px] font-bold uppercase text-warmmuted">Jam Keluar (Out)</p>
              <p className="text-lg font-extrabold text-espresso mt-1">{selectedSeDetail.lastOutLabel}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-warmborder">
              <p className="text-[11px] font-bold uppercase text-warmmuted">Koordinat Terakhir</p>
              <p className="text-sm font-mono font-bold text-terracotta mt-1.5">{selectedSeDetail.latestCoords}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-warmborder overflow-hidden">
            <div className="px-4 py-3 bg-sandstone/70 border-b border-warmborder text-xs font-extrabold text-espresso">
              Riwayat Check-In &amp; Check-Out ({selectedSeDetail.logs.length} Catatan)
            </div>
            {selectedSeDetail.logs.length === 0 ? (
              <p className="p-6 text-center text-xs text-warmmuted">
                Belum ada riwayat absensi database pada periode {period} ini.
              </p>
            ) : (
              <div className="divide-y divide-warmborder">
                {selectedSeDetail.logs.map((log) => (
                  <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      {log.photo_data_url ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(log.photo_data_url || null)}
                          className="shrink-0 cursor-pointer"
                        >
                          <img
                            src={log.photo_data_url}
                            alt="Bukti Absen"
                            loading="lazy"
                            className="size-12 rounded-xl object-cover border border-warmborder"
                          />
                        </button>
                      ) : (
                        <div className="size-10 rounded-xl bg-sandstone text-espresso grid place-items-center shrink-0">
                          <Clock className="size-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              log.log_type === 'CHECK_IN' ? 'bg-lime-100 text-olive' : 'bg-espresso text-white'
                            }`}
                          >
                            {log.log_type === 'CHECK_IN' ? 'MASUK (IN)' : 'PULANG (OUT)'}
                          </span>
                          <span className="font-extrabold text-espresso">
                            {toWibDateKey(log.created_at)} · {fmtWibTime(log.created_at)}
                          </span>
                        </div>
                        <p className="text-warmmuted mt-1">{log.location_label || log.notes || '-'}</p>
                      </div>
                    </div>
                    {log.lat != null && log.lng != null && (
                      <span className="font-mono text-[11px] text-warmmuted shrink-0">
                        {Number(log.lat).toFixed(5)}, {Number(log.lng).toFixed(5)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {previewPhotoUrl && (
            <div
              onClick={() => setPreviewPhotoUrl(null)}
              className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4"
            >
              <img src={previewPhotoUrl} alt="Preview Foto" className="max-w-full max-h-[85vh] rounded-2xl" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Header Filter Periode & Export */}
        <div className="p-4 rounded-2xl bg-white border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2">
              <UserCheck className="size-4 text-olive" />
              <span>Daftar Absensi Tim SE ({attendanceSummaryPerSe.length} Personel)</span>
            </h3>
            <p className="text-xs text-warmmuted mt-0.5">
              Klik salah satu nama SE untuk melihat detail jam In/Out &amp; bukti foto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-sandstone p-1 border border-warmborder">
              {(['harian', 'mingguan', 'bulanan'] as AttendancePeriod[]).map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setPeriod(pr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer transition-colors ${
                    period === pr ? 'bg-espresso text-white' : 'text-warmmuted hover:text-espresso'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleExportAttendanceExcel}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="size-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* List SE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {isLoading && attendanceSummaryPerSe.length === 0
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`absen-skel-${idx}`}
                  className="p-4 rounded-2xl bg-white border border-warmborder space-y-3 animate-pulse"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-32 rounded-md bg-sandstone" />
                      <div className="h-3 w-44 rounded-md bg-sandstone/70" />
                    </div>
                    <div className="h-5 w-20 rounded-full bg-sandstone" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-sandstone/50">
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-14 rounded bg-warmborder/70" />
                      <div className="h-4 w-16 rounded bg-warmborder" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-14 rounded bg-warmborder/70" />
                      <div className="h-4 w-16 rounded bg-warmborder" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-warmborder/60">
                    <div className="h-3 w-20 rounded bg-sandstone" />
                    <div className="h-3 w-20 rounded bg-sandstone" />
                  </div>
                </div>
              ))
            : attendanceSummaryPerSe.map((se) => (
            <button
              key={se.email}
              type="button"
              onClick={() => setSelectedSeEmail(se.email)}
              className="p-4 rounded-2xl bg-white border border-warmborder hover:border-terracotta text-left space-y-3 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-espresso truncate">{se.name}</p>
                  <p className="text-[11px] text-warmmuted truncate">{se.email}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                    se.statusLabel === 'Belum Absen'
                      ? 'bg-amber-100 text-terracotta'
                      : 'bg-lime-100 text-olive'
                  }`}
                >
                  {se.statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-sandstone/60 text-xs">
                <div>
                  <span className="text-[10px] text-warmmuted block">Jam Masuk</span>
                  <strong className="text-olive">{se.firstInLabel}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-warmmuted block">Jam Pulang</span>
                  <strong className="text-espresso">{se.lastOutLabel}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-warmmuted pt-1 border-t border-warmborder/60">
                <span>{se.photosCount} Foto Bukti</span>
                <span className="font-bold text-terracotta">Lihat Detail &rarr;</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // MODE 2: GPS TRACKING (SM) — Default HANYA List SE + Posisi Terakhir (Tanpa Radar)
  // ===========================================================================
  const gpsSummaryPerSe = useMemo(() => {
    return registeredSes.map((se) => {
      const seLogs = dbFieldLogs.filter(
        (l) =>
          String(l.se_email || '').toLowerCase() === se.email &&
          (l.log_type === 'GPS' || l.log_type === 'CHECK_IN' || l.log_type === 'CHECK_OUT')
      );
      const latestDb = seLogs[0];

      const lat = latestDb?.lat ?? null;
      const lng = latestDb?.lng ?? null;
      const distKm =
        lat != null && lng != null
          ? haversineKm(baseCoords.lat, baseCoords.lng, Number(lat), Number(lng))
          : null;

      const todayLogs = seLogs.filter((l) => toWibDateKey(l.created_at) === selectedDate);
      const photoLogs = seLogs.filter((l) => Boolean(l.photo_data_url));

      return {
        ...se,
        lastLocation: latestDb?.location_label || 'Belum ada posisi tercatat',
        lastTime: latestDb ? fmtWibTime(latestDb.created_at) : '-',
        lastCoords: lat != null && lng != null ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : '-',
        distKm,
        todayPointsCount: todayLogs.length,
        photosCount: photoLogs.length,
        allLogs: seLogs,
        todayTimeline: [...todayLogs].reverse(), // urut dari pagi ke sore
        photoLogs,
      };
    });
  }, [registeredSes, dbFieldLogs, baseCoords, selectedDate]);

  const selectedGpsSe = selectedSeEmail
    ? gpsSummaryPerSe.find((s) => s.email === selectedSeEmail)
    : null;

  if (selectedGpsSe) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-white border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedSeEmail(null)}
              className="min-h-[40px] px-3 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Kembali ke Daftar SE</span>
            </button>
            <div>
              <h3 className="text-sm font-extrabold text-espresso">
                Detail Perjalanan &amp; Foto Lapangan: {selectedGpsSe.name}
              </h3>
              <p className="text-[11px] text-warmmuted">
                Posisi terakhir: {selectedGpsSe.lastLocation} ({selectedGpsSe.lastCoords})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-warmmuted">Tanggal:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 px-3 rounded-xl border border-warmborder text-xs font-bold bg-sandstone text-espresso"
            />
          </div>
        </div>

        {/* Timeline Per Jam */}
        <div className="bg-white rounded-2xl border border-warmborder p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-espresso flex items-center gap-2">
              <Navigation className="size-4 text-terracotta" />
              <span>Timeline Koordinat Harian ({selectedDate})</span>
            </h4>
            <span className="text-xs font-bold text-olive">
              {selectedGpsSe.todayTimeline.length} Titik Tercatat
            </span>
          </div>

          {selectedGpsSe.todayTimeline.length === 0 ? (
            <p className="py-6 text-center text-xs text-warmmuted">
              Belum ada jejak koordinat GPS yang direkam pada tanggal {selectedDate}.
            </p>
          ) : (
            <div className="space-y-3 border-l-2 border-terracotta/30 pl-4 ml-2">
              {selectedGpsSe.todayTimeline.map((pt) => {
                const dist =
                  pt.lat != null && pt.lng != null
                    ? haversineKm(baseCoords.lat, baseCoords.lng, Number(pt.lat), Number(pt.lng))
                    : null;
                return (
                  <div
                    key={pt.id}
                    className="relative p-3.5 rounded-2xl bg-[#FBF9F5] border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <span className="size-3 rounded-full bg-terracotta absolute -left-[23px] top-5 ring-4 ring-white" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-espresso text-white text-[11px] font-extrabold tabular-nums">
                          {fmtWibTime(pt.created_at)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-terracotta text-[10px] font-extrabold">
                          {pt.log_type}
                        </span>
                        <span className="text-xs font-extrabold text-espresso truncate">
                          {pt.location_label || pt.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-warmmuted">
                        Koordinat:{' '}
                        <code className="font-mono text-espresso font-bold">
                          {pt.lat != null && pt.lng != null
                            ? `${Number(pt.lat).toFixed(5)}, ${Number(pt.lng).toFixed(5)}`
                            : '-'}
                        </code>
                        {dist != null && ` · ${dist} km dari gerbang proyek`}
                      </p>
                      {pt.notes && <p className="text-[11px] text-warmmuted">{pt.notes}</p>}
                    </div>

                    {pt.photo_data_url && (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(pt.photo_data_url || null)}
                        className="shrink-0 cursor-pointer self-start sm:self-center"
                      >
                        <img
                          src={pt.photo_data_url}
                          alt="Foto Kunjungan"
                          className="size-16 rounded-xl object-cover border border-warmborder hover:opacity-90"
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Galeri Laporan Foto dari SE */}
        <div className="bg-white rounded-2xl border border-warmborder p-4 sm:p-5 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-espresso flex items-center gap-2">
            <Camera className="size-4 text-olive" />
            <span>Laporan Foto Lapangan dari {selectedGpsSe.name} ({selectedGpsSe.photoLogs.length})</span>
          </h4>
          {selectedGpsSe.photoLogs.length === 0 ? (
            <p className="py-4 text-center text-xs text-warmmuted">
              Belum ada laporan foto yang diunggah oleh SE ini.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {selectedGpsSe.photoLogs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => setPreviewPhotoUrl(log.photo_data_url || null)}
                  className="rounded-2xl border border-warmborder overflow-hidden bg-[#FBF9F5] text-left cursor-pointer hover:border-terracotta transition-colors"
                >
                  <img
                    src={log.photo_data_url || ''}
                    alt={log.location_label || 'Foto'}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2.5 space-y-0.5">
                    <p className="text-[11px] font-extrabold text-espresso truncate">
                      {log.location_label || log.title}
                    </p>
                    <p className="text-[10px] text-warmmuted">
                      {toWibDateKey(log.created_at)} · {fmtWibTime(log.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {previewPhotoUrl && (
          <div
            onClick={() => setPreviewPhotoUrl(null)}
            className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4"
          >
            <div className="relative max-w-2xl w-full flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="self-end size-9 rounded-full bg-white text-espresso grid place-items-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
              <img src={previewPhotoUrl} alt="Preview Foto" className="max-w-full max-h-[80vh] rounded-2xl" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default GPS View untuk SM: HANYA List SE + Posisi Terakhir
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2">
            <MapPin className="size-4 text-terracotta" />
            <span>Daftar Personel SE &amp; Posisi Terakhir ({gpsSummaryPerSe.length} SE)</span>
          </h3>
          <p className="text-xs text-warmmuted mt-0.5">
            Klik salah satu SE untuk melihat timeline koordinat harian per jam &amp; laporan foto kunjungan.
          </p>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-sandstone border border-warmborder text-espresso self-start sm:self-auto">
          Tanggal: {selectedDate}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading && gpsSummaryPerSe.length === 0
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`gps-skel-${idx}`}
                className="p-4 rounded-2xl bg-white border border-warmborder space-y-3 animate-pulse"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 rounded-md bg-sandstone" />
                    <div className="h-3 w-24 rounded-md bg-sandstone/70" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-sandstone" />
                </div>
                <div className="p-3 rounded-xl bg-sandstone/40 border border-warmborder space-y-2">
                  <div className="h-3.5 w-44 rounded bg-warmborder/80" />
                  <div className="h-3 w-36 rounded bg-warmborder/60" />
                  <div className="h-2.5 w-28 rounded bg-warmborder/50" />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-warmborder/60">
                  <div className="h-3 w-24 rounded bg-sandstone" />
                  <div className="h-3 w-24 rounded bg-sandstone" />
                </div>
              </div>
            ))
          : gpsSummaryPerSe.map((se) => (
          <button
            key={se.email}
            type="button"
            onClick={() => setSelectedSeEmail(se.email)}
            className="p-4 rounded-2xl bg-white border border-warmborder hover:border-terracotta text-left space-y-3 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-espresso truncate">{se.name}</p>
                <p className="text-[11px] text-warmmuted truncate">{se.zone}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-terracotta border border-amber-200 text-[10px] font-extrabold shrink-0">
                {se.todayPointsCount} Titik
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FBF9F5] border border-warmborder space-y-1 text-xs">
              <p className="font-bold text-espresso truncate flex items-center gap-1.5">
                <MapPin className="size-3.5 text-terracotta shrink-0" />
                <span className="truncate">{se.lastLocation}</span>
              </p>
              <p className="text-[11px] text-warmmuted">
                Jam: <strong className="text-espresso">{se.lastTime}</strong>
                {se.distKm != null ? ` · ${se.distKm} km dari gerbang` : ''}
              </p>
              <p className="text-[10px] font-mono text-warmmuted">{se.lastCoords}</p>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-warmborder/60">
              <span className="text-warmmuted flex items-center gap-1">
                <Camera className="size-3.5 text-olive" />
                {se.photosCount} Laporan Foto
              </span>
              <span className="font-bold text-terracotta flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Buka Timeline &rarr;
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
