// ============================================================================
// FIELD OPS & AI ACTIVITY GUIDE MODAL - DEVELOPER SALES OS
// Absensi SE, GPS Tracking SE, Log Panggilan, & AI Guide (Platinum / Diamond)
// ============================================================================

import { useEffect, useState } from 'react';
import {
  MapPin,
  PhoneCall,
  Clock,
  Sparkles,
  CheckCircle2,
  Navigation,
  Lock,
  Plus,
  X,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  getAttendanceRecords,
  checkInAttendance,
  checkOutAttendance,
  getGpsTrackLogs,
  recordGpsPoint,
  getCallLogs,
  addCallLog,
  getAiActivityGuide,
  ALL_SE_ACTIVITY_CATEGORIES,
  PROJECT_BASE_COORDS,
} from '../lib/field-ops/field-ops-store';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';
import type { SeActivityCategory, CallOutcome, GpsActivityType } from '../lib/field-ops/types';

type FieldOpsTab = 'absen' | 'gps' | 'call' | 'ai_guide';
const VALID_FIELD_TABS: FieldOpsTab[] = ['absen', 'gps', 'call', 'ai_guide'];

interface FieldOpsModalProps {
  projectName?: string;
  currentSeName?: string;
  initialTab?: FieldOpsTab;
  planCode?: 'gold' | 'platinum' | 'diamond';
  variant?: 'modal' | 'page';
  onClose?: () => void;
  onUpgradeRequest?: () => void;
}

export function FieldOpsModal({
  projectName = 'The Park Townhouse Sukoharjo',
  currentSeName = 'SE 001 Budi Santoso',
  initialTab = 'absen',
  planCode = 'platinum',
  variant = 'modal',
  onClose,
  onUpgradeRequest,
}: FieldOpsModalProps) {
  const [activeTab, setActiveTab] = useState<FieldOpsTab>(() => {
    const urlTab = variant === 'page' ? getQueryParam('tab') : null;
    if (urlTab && VALID_FIELD_TABS.includes(urlTab as FieldOpsTab)) {
      return urlTab as FieldOpsTab;
    }
    return loadPersistedState<FieldOpsTab>('devos_field_ops_tab', initialTab);
  });
  const [simulatedPlan, setSimulatedPlan] = useState<'gold' | 'platinum' | 'diamond'>(planCode);

  const [attendanceList, setAttendanceList] = useState(() =>
    loadPersistedState('devos_field_attendance', getAttendanceRecords('proj-the-park-01'))
  );
  const [gpsLogs, setGpsLogs] = useState(() =>
    loadPersistedState('devos_field_gps_logs', getGpsTrackLogs('proj-the-park-01'))
  );
  const [callLogs, setCallLogs] = useState(() =>
    loadPersistedState('devos_field_call_logs', getCallLogs('proj-the-park-01'))
  );

  const [selectedActivity, setSelectedActivity] = useState<SeActivityCategory>('COLD_CALL_SLA_5_MENIT');
  const [toast, setToast] = useState<string | null>(null);

  // Add Call Form
  const [showCallForm, setShowCallForm] = useState(() =>
    loadPersistedState<boolean>('devos_field_show_call_form', false)
  );
  const [callLeadName, setCallLeadName] = useState(() =>
    loadPersistedState<string>('devos_field_call_lead', '')
  );
  const [callPhone, setCallPhone] = useState(() =>
    loadPersistedState<string>('devos_field_call_phone', '')
  );
  const [callDuration, setCallDuration] = useState(() =>
    loadPersistedState<number>('devos_field_call_dur', 120)
  );
  const [callOutcome, setCallOutcome] = useState<CallOutcome>(() =>
    loadPersistedState<CallOutcome>('devos_field_call_outcome', 'TERJAWAB_TERTARIK')
  );
  const [callNotes, setCallNotes] = useState(() =>
    loadPersistedState<string>('devos_field_call_notes', '')
  );

  // Add GPS Check-in Form
  const [gpsLocationLabel, setGpsLocationLabel] = useState(() =>
    loadPersistedState<string>('devos_field_gps_label', 'Kawasan Bisnis Solo Baru (Ruko Ir. Soekarno)')
  );
  const [gpsActivityType, setGpsActivityType] = useState<GpsActivityType>(() =>
    loadPersistedState<GpsActivityType>('devos_field_gps_type', 'CANVASSING')
  );

  useEffect(() => {
    savePersistedState('devos_field_ops_tab', activeTab);
    if (variant === 'page') {
      setQueryParam('tab', activeTab);
    }
  }, [activeTab, variant]);

  useEffect(() => {
    savePersistedState('devos_field_attendance', attendanceList);
    savePersistedState('devos_field_gps_logs', gpsLogs);
    savePersistedState('devos_field_call_logs', callLogs);
    savePersistedState('devos_field_show_call_form', showCallForm);
    savePersistedState('devos_field_call_lead', callLeadName);
    savePersistedState('devos_field_call_phone', callPhone);
    savePersistedState('devos_field_call_dur', callDuration);
    savePersistedState('devos_field_call_outcome', callOutcome);
    savePersistedState('devos_field_call_notes', callNotes);
    savePersistedState('devos_field_gps_label', gpsLocationLabel);
    savePersistedState('devos_field_gps_type', gpsActivityType);
  }, [
    attendanceList,
    gpsLogs,
    callLogs,
    showCallForm,
    callLeadName,
    callPhone,
    callDuration,
    callOutcome,
    callNotes,
    gpsLocationLabel,
    gpsActivityType,
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleCheckIn = () => {
    checkInAttendance({
      projectId: 'proj-the-park-01',
      seName: currentSeName,
      lat: PROJECT_BASE_COORDS.lat,
      lng: PROJECT_BASE_COORDS.lng,
      notes: 'Check-in harian terverifikasi GPS',
    });
    setAttendanceList([...getAttendanceRecords('proj-the-park-01')]);
    showToast(`${currentSeName} berhasil Check-In dengan koordinat GPS!`);
  };

  const handleCheckOut = () => {
    checkOutAttendance('proj-the-park-01', currentSeName, PROJECT_BASE_COORDS.lat, PROJECT_BASE_COORDS.lng);
    setAttendanceList([...getAttendanceRecords('proj-the-park-01')]);
    showToast(`${currentSeName} berhasil Check-Out hari ini.`);
  };

  const handleRecordGps = () => {
    recordGpsPoint({
      projectId: 'proj-the-park-01',
      seName: currentSeName,
      lat: -7.6145,
      lng: 110.8182,
      activityType: gpsActivityType,
      locationLabel: gpsLocationLabel,
    });
    setGpsLogs([...getGpsTrackLogs('proj-the-park-01')]);
    showToast('Titik koordinat GPS aktivitas lapangan berhasil direkam!');
  };

  const handleSaveCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callLeadName || !callPhone) return;
    addCallLog({
      projectId: 'proj-the-park-01',
      seName: currentSeName,
      leadName: callLeadName,
      phoneNumber: callPhone,
      direction: 'OUTBOUND',
      durationSeconds: Number(callDuration),
      outcome: callOutcome,
      summaryNotes: callNotes || 'Catatan panggilan tersimpan ke log CRM.',
    });
    setCallLogs([...getCallLogs('proj-the-park-01')]);
    setShowCallForm(false);
    setCallLeadName('');
    setCallPhone('');
    setCallNotes('');
    showToast('Log panggilan berhasil dicatat!');
  };

  const aiGuideResult = getAiActivityGuide(selectedActivity, simulatedPlan);

  const outerClass =
    variant === 'page'
      ? 'w-full'
      : 'fixed inset-0 z-50 overflow-y-auto bg-espresso/75 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200';
  const cardClass =
    variant === 'page'
      ? 'bg-sandstone rounded-2xl border border-warmborder w-full flex flex-col overflow-hidden shadow-xs'
      : 'bg-sandstone rounded-3xl shadow-2xl border border-warmborder w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden';

  return (
    <div className={outerClass}>
      <div className={cardClass}>
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 bg-white border-b border-warmborder flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-terracotta text-white grid place-items-center font-extrabold shadow-xs shrink-0">
              <Navigation className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-espresso leading-snug">
                Operasional Lapangan SE &amp; AI Guide
              </h2>
              <p className="text-xs text-warmmuted mt-0.5 leading-relaxed">
                {projectName} · Absensi, Tracking GPS, Log Panggilan &amp; Panduan AI
              </p>
            </div>
          </div>

          {variant === 'modal' && onClose && (
            <button
              onClick={onClose}
              aria-label="Tutup Operasional Lapangan"
              className="size-10 rounded-xl bg-sandstone hover:bg-warmborder text-espresso grid place-items-center transition-colors cursor-pointer shrink-0"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-warmborder">
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x">
            {[
              { id: 'absen', label: 'Absensi Harian SE', icon: UserCheck, badge: 'Semua Paket' },
              { id: 'gps', label: 'Tracking GPS SE', icon: MapPin, badge: 'Semua Paket' },
              { id: 'call', label: 'Log Panggilan', icon: PhoneCall, badge: 'Semua Paket' },
              { id: 'ai_guide', label: 'AI Panduan Aktivitas SE', icon: Sparkles, badge: 'Platinum & Diamond' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-espresso text-white shadow-xs'
                      : 'bg-sandstone text-warmmuted hover:text-espresso'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                      tab.id === 'ai_guide'
                        ? 'bg-amber-400 text-espresso'
                        : isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-warmmuted'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ABSENSI HARIAN SE */}
          {activeTab === 'absen' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-white border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-olive">
                    Presensi Terkunci Koordinat GPS
                  </span>
                  <h3 className="text-base font-extrabold text-espresso mt-0.5">
                    Absensi Hari Ini ({currentSeName})
                  </h3>
                  <p className="text-xs text-warmmuted mt-0.5">
                    Setiap absen masuk &amp; pulang mencatat titik koordinat lokasi SE untuk validasi kehadiran.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleCheckIn}
                    className="px-4 py-2.5 rounded-xl bg-olive text-white text-xs font-bold hover:bg-olive/90 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="size-4" /> Check-In GPS
                  </button>
                  <button
                    onClick={handleCheckOut}
                    className="px-4 py-2.5 rounded-xl bg-espresso text-white text-xs font-bold hover:bg-espresso/90 cursor-pointer flex items-center gap-1.5"
                  >
                    <Clock className="size-4" /> Check-Out
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-warmborder overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-extrabold uppercase text-warmmuted">
                      <th className="py-3 px-4">Nama Sales Executive</th>
                      <th className="py-3 px-4">Jam Masuk</th>
                      <th className="py-3 px-4">Jam Pulang</th>
                      <th className="py-3 px-4">Koordinat Check-In</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warmborder text-xs">
                    {attendanceList.map((att) => (
                      <tr key={att.id} className="hover:bg-sandstone/30">
                        <td className="py-3 px-4 font-bold text-espresso">{att.seName}</td>
                        <td className="py-3 px-4 font-semibold text-olive">{att.checkInAt || '-'}</td>
                        <td className="py-3 px-4 text-warmmuted">{att.checkOutAt || 'Belum Check-Out'}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-warmmuted">
                          {att.checkInLat ? `${att.checkInLat.toFixed(5)}, ${att.checkInLng?.toFixed(5)}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              att.status === 'HADIR'
                                ? 'bg-lime-100 text-olive'
                                : 'bg-amber-100 text-terracotta'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-warmmuted">{att.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TRACKING GPS SE */}
          {activeTab === 'gps' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-white border border-warmborder space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta">
                      Live Field Tracking (Semua Paket)
                    </span>
                    <h3 className="text-base font-extrabold text-espresso">
                      Jejak Pergerakan &amp; Kanvasing SE Lapangan
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={gpsActivityType}
                      onChange={(e) => setGpsActivityType(e.target.value as GpsActivityType)}
                      className="h-9 px-3 rounded-xl border border-warmborder text-xs font-bold bg-sandstone text-espresso"
                    >
                      <option value="CANVASSING">Kanvasing Lapangan</option>
                      <option value="SURVEY_LOKASI">Survei Lokasi Klien</option>
                      <option value="MEETING_KLIEN">Meeting Klien / Bank</option>
                    </select>
                    <input
                      type="text"
                      value={gpsLocationLabel}
                      onChange={(e) => setGpsLocationLabel(e.target.value)}
                      className="h-9 px-3 rounded-xl border border-warmborder text-xs w-60"
                      placeholder="Nama lokasi kunjungan..."
                    />
                    <button
                      onClick={handleRecordGps}
                      className="h-9 px-4 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer flex items-center gap-1.5"
                    >
                      <MapPin className="size-3.5" /> Rekam Titik GPS
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {gpsLogs.map((pt) => (
                  <div
                    key={pt.id}
                    className="p-4 rounded-2xl bg-white border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl bg-amber-50 text-terracotta border border-amber-200 grid place-items-center shrink-0">
                        <MapPin className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-espresso">{pt.locationLabel}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sandstone font-bold text-espresso">
                            {pt.activityType}
                          </span>
                        </div>
                        <p className="text-[11px] text-warmmuted mt-0.5">
                          {pt.seName} · Pukul <strong className="text-espresso">{pt.recordedAt}</strong> · Koordinat:{' '}
                          <span className="font-mono">
                            {pt.lat.toFixed(5)}, {pt.lng.toFixed(5)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-olive">
                        {pt.distanceFromProjectKm} km
                      </span>
                      <p className="text-[10px] text-warmmuted">dari gerbang proyek</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LOG PANGGILAN */}
          {activeTab === 'call' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-white border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta">
                    Call Audit Trail (Semua Paket)
                  </span>
                  <h3 className="text-base font-extrabold text-espresso">
                    Log Panggilan Telepon ke Prospek
                  </h3>
                  <p className="text-xs text-warmmuted mt-0.5">
                    Memastikan setiap lead baru benar-benar dihubungi sesuai SLA ≤ 5 menit.
                  </p>
                </div>
                <button
                  onClick={() => setShowCallForm(!showCallForm)}
                  className="px-4 py-2.5 rounded-xl bg-espresso text-white text-xs font-bold hover:bg-espresso/90 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="size-4" /> Catat Log Panggilan
                </button>
              </div>

              {showCallForm && (
                <form
                  onSubmit={handleSaveCall}
                  className="p-5 rounded-2xl bg-white border border-terracotta/40 space-y-4"
                >
                  <h4 className="text-xs font-extrabold uppercase text-terracotta">Input Log Panggilan Baru</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-warmmuted mb-1">Nama Prospek</label>
                      <input
                        required
                        value={callLeadName}
                        onChange={(e) => setCallLeadName(e.target.value)}
                        placeholder="misal: Bpk. Hendra"
                        className="w-full h-9 px-3 rounded-xl border border-warmborder"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-warmmuted mb-1">Nomor Telepon / WA</label>
                      <input
                        required
                        value={callPhone}
                        onChange={(e) => setCallPhone(e.target.value)}
                        placeholder="0812..."
                        className="w-full h-9 px-3 rounded-xl border border-warmborder"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-warmmuted mb-1">Durasi (Detik)</label>
                      <input
                        type="number"
                        value={callDuration}
                        onChange={(e) => setCallDuration(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-xl border border-warmborder"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-warmmuted mb-1">Hasil Panggilan</label>
                      <select
                        value={callOutcome}
                        onChange={(e) => setCallOutcome(e.target.value as CallOutcome)}
                        className="w-full h-9 px-3 rounded-xl border border-warmborder bg-sandstone font-bold"
                      >
                        <option value="TERJAWAB_TERTARIK">Terjawab - Tertarik</option>
                        <option value="JANJI_SURVEI">Janji Survei Lokasi</option>
                        <option value="FOLLOW_UP_LAGI">Minta Follow-Up Lagi</option>
                        <option value="TIDAK_ANGKAT">Tidak Diangkat</option>
                        <option value="NOMOR_TIDAK_AKTIF">Nomor Tidak Aktif</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-xs">
                    <label className="block font-bold text-warmmuted mb-1">Ringkasan Pembicaraan</label>
                    <input
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder="Ringkasan poin penting pembicaraan..."
                      className="w-full h-9 px-3 rounded-xl border border-warmborder"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCallForm(false)}
                      className="px-4 py-2 rounded-xl bg-sandstone text-xs font-bold text-warmmuted cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-bold cursor-pointer"
                    >
                      Simpan Log Panggilan
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-warmborder overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-extrabold uppercase text-warmmuted">
                      <th className="py-3 px-4">Waktu &amp; SE</th>
                      <th className="py-3 px-4">Prospek</th>
                      <th className="py-3 px-4">Durasi</th>
                      <th className="py-3 px-4">Hasil</th>
                      <th className="py-3 px-4">Ringkasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warmborder text-xs">
                    {callLogs.map((c) => (
                      <tr key={c.id} className="hover:bg-sandstone/30">
                        <td className="py-3 px-4">
                          <span className="font-bold text-espresso block">{c.calledAt}</span>
                          <span className="text-[11px] text-warmmuted">{c.seName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-espresso block">{c.leadName}</span>
                          <span className="text-[11px] font-mono text-warmmuted">{c.phoneNumber}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-espresso">
                          {Math.floor(c.durationSeconds / 60)}m {c.durationSeconds % 60}d
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              c.outcome === 'JANJI_SURVEI' || c.outcome === 'TERJAWAB_TERTARIK'
                                ? 'bg-lime-100 text-olive'
                                : c.outcome === 'TIDAK_ANGKAT'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-terracotta'
                            }`}
                          >
                            {c.outcome.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-warmmuted max-w-xs">{c.summaryNotes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AI PANDUAN AKTIVITAS SE (KHUSUS PLATINUM & DIAMOND) */}
          {activeTab === 'ai_guide' && (
            <div className="space-y-5">
              {/* Plan Simulator Header */}
              <div className="p-4 rounded-2xl bg-espresso text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="size-5 text-amber-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-extrabold">
                      Panduan / Guide per Aktivitas SE dengan AI
                    </h3>
                    <p className="text-[11px] text-stone-300">
                      Fitur eksklusif paket <strong>Platinum</strong> &amp; <strong>Diamond</strong>: mendampingi SE di setiap aktivitas dengan skrip &amp; penanganan keberatan berbasis Knowledge Base proyek.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl shrink-0">
                  {(['gold', 'platinum', 'diamond'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSimulatedPlan(p)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase cursor-pointer transition-all ${
                        simulatedPlan === p ? 'bg-amber-400 text-espresso' : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Selector */}
              <div className="flex flex-wrap gap-2">
                {ALL_SE_ACTIVITY_CATEGORIES.map((act) => (
                  <button
                    key={act.key}
                    onClick={() => setSelectedActivity(act.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selectedActivity === act.key
                        ? 'bg-terracotta text-white shadow-xs'
                        : 'bg-white border border-warmborder text-espresso hover:bg-sandstone'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              {/* AI Guide Content */}
              {!aiGuideResult.isUnlocked ? (
                <div className="p-8 rounded-3xl bg-white border border-warmborder text-center space-y-4">
                  <div className="size-12 rounded-2xl bg-amber-50 border border-amber-200 text-terracotta grid place-items-center mx-auto">
                    <Lock className="size-6" />
                  </div>
                  <h4 className="text-lg font-extrabold text-espresso">
                    AI Activity Guide Aktif di Paket Platinum &amp; Diamond
                  </h4>
                  <p className="text-xs text-warmmuted max-w-md mx-auto leading-relaxed">
                    Pada paket <strong>Gold</strong>, SE tetap mendapatkan fitur Absensi, GPS Tracking, Log Panggilan, dan Playbook manual. Untuk pendampingan skrip AI otomatis per aktivitas, tingkatkan ke paket Platinum atau Diamond.
                  </p>
                  <div className="p-4 rounded-2xl bg-sandstone/70 border border-warmborder text-left max-w-xl mx-auto">
                    <span className="text-[10px] font-extrabold uppercase text-terracotta">
                      Cuplikan Tujuan Aktivitas:
                    </span>
                    <p className="text-xs font-semibold text-espresso mt-1">{aiGuideResult.guide.goal}</p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => setSimulatedPlan('platinum')}
                      className="px-4 py-2.5 rounded-xl bg-espresso text-white text-xs font-bold cursor-pointer hover:bg-espresso/90"
                    >
                      Lihat Preview Mode Platinum
                    </button>
                    {onUpgradeRequest && (
                      <button
                        onClick={onUpgradeRequest}
                        className="px-4 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold cursor-pointer hover:bg-terracotta/90"
                      >
                        Konsultasi Upgrade Paket
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white border border-warmborder space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-lime-100 text-olive uppercase">
                        AI Coach Aktif · Paket {simulatedPlan.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-semibold text-warmmuted flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-olive" /> Terverifikasi KB The Park
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-espresso">{aiGuideResult.guide.title}</h4>
                    <p className="text-xs text-warmmuted">{aiGuideResult.guide.goal}</p>

                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                      <span className="text-[10px] font-extrabold uppercase text-terracotta">
                        Skrip Pembuka Rekomendasi AI:
                      </span>
                      <p className="text-xs font-semibold text-espresso mt-1 leading-relaxed italic">
                        {aiGuideResult.guide.openingScript}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-warmborder space-y-3">
                      <h5 className="text-xs font-extrabold uppercase tracking-wider text-espresso">
                        Langkah Eksekusi Berurutan
                      </h5>
                      <ol className="space-y-2 text-xs text-espresso">
                        {aiGuideResult.guide.executionSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="size-5 rounded-full bg-sandstone text-terracotta font-extrabold text-[10px] grid place-items-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="pt-2 border-t border-warmborder text-[11px] font-bold text-olive">
                        ✓ Checklist Penutup: {aiGuideResult.guide.closingChecklist}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-warmborder space-y-3">
                      <h5 className="text-xs font-extrabold uppercase tracking-wider text-espresso">
                        Penanganan Keberatan (Objection Handling)
                      </h5>
                      <div className="space-y-3">
                        {aiGuideResult.guide.objectionHandlers.map((obj, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-sandstone/60 border border-warmborder space-y-1.5">
                            <p className="text-[11px] font-bold text-rose-700">Keberatan: {obj.objection}</p>
                            <p className="text-xs text-espresso leading-relaxed">
                              <strong className="text-olive">Respon AI:</strong> {obj.aiResponse}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-espresso text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
