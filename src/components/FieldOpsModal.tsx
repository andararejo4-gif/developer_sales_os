// ============================================================================
// FIELD OPS & AI ACTIVITY GUIDE MODAL - DEVELOPER SALES OS
// Absensi SE, GPS Tracking SE, Log Panggilan, & AI Guide (Platinum / Diamond)
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
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
  Camera,
  Radio,
  Crosshair,
  Copy,
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
  parseCoordinates,
  calculateDistanceKm,
} from '../lib/field-ops/field-ops-store';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';
import type { CompanyProject } from '../lib/projects/projects-data';
import type { RoleKey, UserProfile } from '../data';
import { SE_TEAM_DATA } from '../data';
import type { SeActivityCategory, CallOutcome, GpsActivityType } from '../lib/field-ops/types';
import {
  GpsLiveRadarMap,
  type LiveGpsState,
  type RadarWaypoint,
  type TeamMemberLiveMarker,
} from './field/GpsLiveRadarMap';
import { SmFieldMonitoringView } from './field/SmFieldMonitoringView';
import { generateDailyRoutePlan } from '../lib/playbook/route-generator';

type FieldOpsTab = 'absen' | 'gps' | 'call' | 'ai_guide';
const VALID_FIELD_TABS: FieldOpsTab[] = ['absen', 'gps', 'call', 'ai_guide'];

interface FieldOpsModalProps {
  projectId?: string;
  project?: CompanyProject;
  projectName?: string;
  currentSeName?: string;
  userEmail?: string;
  userRole?: RoleKey;
  userProfile?: UserProfile;
  hideAiGuide?: boolean;
  initialTab?: FieldOpsTab;
  planCode?: 'gold' | 'platinum' | 'diamond';
  variant?: 'modal' | 'page';
  onClose?: () => void;
  onDataChanged?: () => void;
  onUpgradeRequest?: () => void;
}

export function FieldOpsModal({
  projectId = 'proj-the-park-01',
  project,
  projectName: rawProjectName,
  currentSeName,
  userEmail = 'raka@andararejomakmur.co.id',
  userRole = 'SM',
  userProfile,
  hideAiGuide = false,
  initialTab = 'absen',
  planCode = 'platinum',
  variant = 'modal',
  onClose,
  onDataChanged,
  onUpgradeRequest,
}: FieldOpsModalProps) {
  const activeProjectId = project?.id || projectId;
  const effectiveProjectName = project?.nama || rawProjectName || 'The Park Townhouse Sukoharjo';
  const effectiveCoords = parseCoordinates(project?.koordinatGps);

  // Identify current logged in person
  const activeUserName = userProfile?.name || currentSeName || 'Ferry Kurniawan';
  const isManager = userRole === 'SM' || userRole === 'TL' || userRole === 'DIREKSI' || userRole === 'ADMIN';

  // For SM/TL: allow selecting which SE to inspect or default to all SEs
  const [selectedSeFilter, setSelectedSeFilter] = useState<string>('SEMUA');

  const [activeTab, setActiveTab] = useState<FieldOpsTab>(() => {
    const urlTab = variant === 'page' ? getQueryParam('tab') : null;
    if (urlTab && VALID_FIELD_TABS.includes(urlTab as FieldOpsTab)) {
      return urlTab as FieldOpsTab;
    }
    return loadPersistedState<FieldOpsTab>('devos_field_ops_tab', initialTab);
  });
  const [simulatedPlan, setSimulatedPlan] = useState<'gold' | 'platinum' | 'diamond'>(planCode);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSavingCopilotLog, setIsSavingCopilotLog] = useState(false);

  const userScope = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const [attendanceList, setAttendanceList] = useState(() =>
    userRole === 'SE'
      ? loadPersistedState(`devos_field_attendance_${userScope}`, [])
      : loadPersistedState(
          `devos_field_attendance_${activeProjectId}`,
          getAttendanceRecords(activeProjectId, effectiveCoords, effectiveProjectName)
        )
  );
  const [gpsLogs, setGpsLogs] = useState(() =>
    userRole === 'SE'
      ? loadPersistedState(`devos_field_gps_logs_${userScope}`, [])
      : loadPersistedState(
          `devos_field_gps_logs_${activeProjectId}`,
          getGpsTrackLogs(activeProjectId, effectiveCoords, effectiveProjectName)
        )
  );
  const [callLogs, setCallLogs] = useState(() =>
    userRole === 'SE'
      ? loadPersistedState(`devos_field_call_logs_${userScope}`, [])
      : loadPersistedState(
          `devos_field_call_logs_${activeProjectId}`,
          getCallLogs(activeProjectId, effectiveProjectName)
        )
  );

  // Sync state when activeProjectId changes (hanya untuk non-SE; SE tetap terisolasi per userScope)
  useEffect(() => {
    if (userRole === 'SE') return;
    setAttendanceList(
      loadPersistedState(
        `devos_field_attendance_${activeProjectId}`,
        getAttendanceRecords(activeProjectId, effectiveCoords, effectiveProjectName)
      )
    );
    setGpsLogs(
      loadPersistedState(
        `devos_field_gps_logs_${activeProjectId}`,
        getGpsTrackLogs(activeProjectId, effectiveCoords, effectiveProjectName)
      )
    );
    setCallLogs(
      loadPersistedState(
        `devos_field_call_logs_${activeProjectId}`,
        getCallLogs(activeProjectId, effectiveProjectName)
      )
    );
  }, [activeProjectId, effectiveProjectName, project?.koordinatGps]);

  const [selectedActivity, setSelectedActivity] = useState<SeActivityCategory>('COLD_CALL_SLA_5_MENIT');
  const [toast, setToast] = useState<string | null>(null);

  // Add Call Form
  const [showCallForm, setShowCallForm] = useState(() =>
    loadPersistedState<boolean>(`devos_field_show_call_form_${activeProjectId}`, false)
  );
  const [callLeadName, setCallLeadName] = useState(() =>
    loadPersistedState<string>(`devos_field_call_lead_${activeProjectId}`, '')
  );
  const [callPhone, setCallPhone] = useState(() =>
    loadPersistedState<string>(`devos_field_call_phone_${activeProjectId}`, '')
  );
  const [callDuration, setCallDuration] = useState(() =>
    loadPersistedState<number>(`devos_field_call_dur_${activeProjectId}`, 120)
  );
  const [callOutcome, setCallOutcome] = useState<CallOutcome>(() =>
    loadPersistedState<CallOutcome>(`devos_field_call_outcome_${activeProjectId}`, 'TERJAWAB_TERTARIK')
  );
  const [callNotes, setCallNotes] = useState(() =>
    loadPersistedState<string>(`devos_field_call_notes_${activeProjectId}`, '')
  );

  // Add GPS Check-in Form + Bukti Foto Lapangan + Live Radar Context
  const [gpsLocationLabel, setGpsLocationLabel] = useState(() =>
    loadPersistedState<string>(
      `devos_field_gps_label_${activeProjectId}`,
      `Kawasan Bisnis & Sekitar ${effectiveProjectName}`
    )
  );
  const [gpsActivityType, setGpsActivityType] = useState<GpsActivityType>(() =>
    loadPersistedState<GpsActivityType>(`devos_field_gps_type_${activeProjectId}`, 'CANVASSING')
  );
  const [photoProofUrl, setPhotoProofUrl] = useState<string | null>(null);
  const [liveGpsInfo, setLiveGpsInfo] = useState<LiveGpsState | null>(null);
  const [matchedWaypoint, setMatchedWaypoint] = useState<RadarWaypoint | null>(null);
  const [todayWaypoints, setTodayWaypoints] = useState<RadarWaypoint[]>([]);

  // Radar tracking persisten antar-tab/halaman & titik fokus peta
  const [isRadarTracking, setIsRadarTracking] = useState<boolean>(() =>
    loadPersistedState<boolean>(`devos_radar_tracking_${userScope}`, false)
  );
  const [focusedMapCoords, setFocusedMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    savePersistedState(`devos_radar_tracking_${userScope}`, isRadarTracking);
  }, [isRadarTracking, userScope]);

  // Persistent Geolocation Watcher di level modal/halaman
  useEffect(() => {
    if (!isRadarTracking) return;
    if (!navigator.geolocation) return;

    let lastSyncTime = 0;
    let lastSyncLat = 0;
    let lastSyncLng = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const distKm = calculateDistanceKm(latitude, longitude, effectiveCoords.lat, effectiveCoords.lng);
        const nextGps: LiveGpsState = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          streetAddress: liveGpsInfo?.streetAddress || `Koordinat ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          areaSummary: liveGpsInfo?.areaSummary || effectiveProjectName,
          nearestPoiLabel: liveGpsInfo?.nearestPoiLabel || `${distKm.toFixed(2)} km dari Proyek`,
          distanceToProjectKm: distKm,
          updatedAt: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };
        setLiveGpsInfo(nextGps);

        // Auto-sync heartbeat posisi SE ke backend (per 45 detik atau jika berpindah > 40 meter)
        const now = Date.now();
        const movedDist = lastSyncLat ? calculateDistanceKm(lastSyncLat, lastSyncLng, latitude, longitude) : 999;
        if (userRole === 'SE' && (now - lastSyncTime > 45000 || movedDist >= 0.04)) {
          lastSyncTime = now;
          lastSyncLat = latitude;
          lastSyncLng = longitude;
          persistFieldLogToDb({
            logType: 'GPS',
            title: `Live Radar GPS (${activeUserName})`,
            locationLabel: nextGps.streetAddress || `Area ${effectiveProjectName}`,
            lat: latitude,
            lng: longitude,
            notes: `Auto-sync radar live SE (${Math.round(accuracy)}m akurasi)`,
          });
        }
      },
      (err) => {
        console.warn('FieldOpsModal geolocation watch error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isRadarTracking, userRole, activeUserName, effectiveCoords.lat, effectiveCoords.lng, effectiveProjectName]);

  const [dbFieldLogs, setDbFieldLogs] = useState<any[]>([]);

  const fetchDbFieldLogs = async () => {
    try {
      const res = await fetch('/api/se/field-logs', {
        headers: { 'X-User-Email': userEmail, 'X-User-Role': userRole },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.logs)) {
          setDbFieldLogs(json.logs);
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchDbFieldLogs();
  }, [userEmail, userRole]);

  // Daftar Live Marker SE untuk role Manager (SM / Admin)
  const teamLiveMarkers: TeamMemberLiveMarker[] = useMemo(() => {
    if (!isManager) return [];
    const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    return SE_TEAM_DATA.map((se) => {
      const firstToken = se.nama.toLowerCase().replace(/[^a-z0-9]+/g, '.');
      const seEmail = `${firstToken}@andararejomakmur.co.id`;

      const seDbLogs = dbFieldLogs.filter(
        (l) => l.se_email?.toLowerCase() === seEmail || l.se_name?.includes(se.nama)
      );
      const latestDb = seDbLogs[0];
      const fallbackPoint = gpsLogs.find((p) => p.seName.includes(se.nama) || p.seName.includes(se.seId));

      const lat = latestDb?.lat ?? fallbackPoint?.lat ?? (effectiveCoords.lat + (Math.random() * 0.01 - 0.005));
      const lng = latestDb?.lng ?? fallbackPoint?.lng ?? (effectiveCoords.lng + (Math.random() * 0.01 - 0.005));
      const distKm = calculateDistanceKm(effectiveCoords.lat, effectiveCoords.lng, Number(lat), Number(lng));

      const hasLogToday = seDbLogs.some((l) => l.created_at && l.created_at.startsWith(todayWib));
      const isOnline = hasLogToday || Boolean(latestDb);

      return {
        id: se.seId,
        name: se.nama,
        email: seEmail,
        seId: se.seId,
        role: 'SE',
        zone: se.zonaHariIni,
        lat: Number(lat),
        lng: Number(lng),
        distanceFromProjectKm: distKm,
        locationLabel: latestDb?.location_label || fallbackPoint?.locationLabel || `Wilayah ${se.zonaHariIni}`,
        lastUpdated: latestDb
          ? new Date(latestDb.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
          : fallbackPoint?.recordedAt || 'Hari Ini',
        isOnline,
        statusLabel: isOnline ? 'Aktif di Lapangan' : 'Standby',
        avatarText: se.nama
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      };
    });
  }, [isManager, dbFieldLogs, gpsLogs, effectiveCoords.lat, effectiveCoords.lng]);

  // Status presensi mandiri hari ini untuk user aktif (SE, SM, Admin)
  const myTodayAttendance = useMemo(() => {
    const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const myDbLogs = dbFieldLogs.filter(
      (l) =>
        (l.se_email?.toLowerCase() === userEmail.toLowerCase() || l.se_name === activeUserName) &&
        (!l.created_at || l.created_at.startsWith(todayWib))
    );
    const myCheckIn = myDbLogs.find((l) => l.log_type === 'CHECK_IN');
    const myCheckOut = myDbLogs.find((l) => l.log_type === 'CHECK_OUT');

    const myAttRecord = attendanceList.find(
      (a) => a.seName === activeUserName || a.seName.includes(activeUserName)
    );

    const isCheckedIn = Boolean(myCheckIn || myAttRecord?.checkInAt);
    const isCheckedOut = Boolean(myCheckOut || myAttRecord?.checkOutAt);
    const checkInTime = myCheckIn
      ? new Date(myCheckIn.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      : myAttRecord?.checkInAt || null;
    const checkOutTime = myCheckOut
      ? new Date(myCheckOut.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      : myAttRecord?.checkOutAt || null;

    return {
      isCheckedIn,
      isCheckedOut,
      checkInTime,
      checkOutTime,
      status: isCheckedIn ? (isCheckedOut ? 'SELESAI_TUGAS' : 'HADIR') : 'BELUM_ABSEN',
    };
  }, [dbFieldLogs, attendanceList, userEmail, activeUserName]);

  const todayDayName = (() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const name = days[new Date().getDay()];
    return name === 'Minggu' ? 'Senin' : name;
  })();

  useEffect(() => {
    let active = true;
    fetch(`/api/se/routes?day=${encodeURIComponent(todayDayName)}`, {
      headers: {
        'X-User-Email': userEmail,
        'X-User-Role': userRole,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.ok && Array.isArray(data.waypoints) && data.waypoints.length > 0) {
          setTodayWaypoints(data.waypoints);
        } else {
          const fallback = generateDailyRoutePlan('proj-the-park-01', 'The Park Townhouse Sukoharjo');
          setTodayWaypoints(fallback.waypoints);
        }
      })
      .catch(() => {
        if (active) {
          setTodayWaypoints(
            generateDailyRoutePlan('proj-the-park-01', 'The Park Townhouse Sukoharjo').waypoints
          );
        }
      });
    return () => {
      active = false;
    };
  }, [todayDayName, userEmail, userRole]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoProofUrl(reader.result);
        showToast('Bukti foto kunjungan siap dilampirkan.');
      }
    };
    reader.readAsDataURL(file);
  };

  const persistFieldLogToDb = async (payload: Record<string, any>) => {
    try {
      await fetch('/api/se/field-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
        },
        body: JSON.stringify(payload),
      });
      await fetchDbFieldLogs();
      if (onDataChanged) onDataChanged();
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    savePersistedState('devos_field_ops_tab', activeTab);
    if (variant === 'page') {
      setQueryParam('tab', activeTab);
    }
  }, [activeTab, variant]);

  useEffect(() => {
    savePersistedState(
      userRole === 'SE' ? `devos_field_attendance_${userScope}` : `devos_field_attendance_${activeProjectId}`,
      attendanceList
    );
    savePersistedState(
      userRole === 'SE' ? `devos_field_gps_logs_${userScope}` : `devos_field_gps_logs_${activeProjectId}`,
      gpsLogs
    );
    savePersistedState(
      userRole === 'SE' ? `devos_field_call_logs_${userScope}` : `devos_field_call_logs_${activeProjectId}`,
      callLogs
    );
    savePersistedState(`devos_field_show_call_form_${activeProjectId}`, showCallForm);
    savePersistedState(`devos_field_call_lead_${activeProjectId}`, callLeadName);
    savePersistedState(`devos_field_call_phone_${activeProjectId}`, callPhone);
    savePersistedState(`devos_field_call_dur_${activeProjectId}`, callDuration);
    savePersistedState(`devos_field_call_outcome_${activeProjectId}`, callOutcome);
    savePersistedState(`devos_field_call_notes_${activeProjectId}`, callNotes);
    savePersistedState(`devos_field_gps_label_${activeProjectId}`, gpsLocationLabel);
    savePersistedState(`devos_field_gps_type_${activeProjectId}`, gpsActivityType);
  }, [
    activeProjectId,
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
      projectId: activeProjectId,
      seName: activeUserName,
      lat: liveGpsInfo?.lat ?? effectiveCoords.lat,
      lng: liveGpsInfo?.lng ?? effectiveCoords.lng,
      notes: photoProofUrl
        ? 'Check-in harian terverifikasi GPS + Bukti Foto'
        : isManager
        ? `Supervisi lapangan ${userProfile?.roleLabel || userRole} di ${effectiveProjectName}`
        : `Check-in harian terverifikasi GPS (${effectiveProjectName})`,
    });
    const nextAtt = getAttendanceRecords(activeProjectId, effectiveCoords, effectiveProjectName);
    setAttendanceList(
      userRole === 'SE' ? nextAtt.filter((a) => a.seName === activeUserName) : [...nextAtt]
    );
    persistFieldLogToDb({
      logType: 'CHECK_IN',
      title: `Check-In Harian (${activeUserName})`,
      locationLabel: `Gerbang ${effectiveProjectName} / Lapangan`,
      lat: liveGpsInfo?.lat ?? effectiveCoords.lat,
      lng: liveGpsInfo?.lng ?? effectiveCoords.lng,
      photoDataUrl: photoProofUrl,
      notes: 'Check-in harian terverifikasi GPS',
    });
    setPhotoProofUrl(null);
    showToast(`${activeUserName} berhasil Check-In GPS & tersimpan ke database!`);
  };

  const handleCheckOut = () => {
    checkOutAttendance(activeProjectId, activeUserName, effectiveCoords.lat, effectiveCoords.lng);
    const nextAtt = getAttendanceRecords(activeProjectId, effectiveCoords, effectiveProjectName);
    setAttendanceList(
      userRole === 'SE' ? nextAtt.filter((a) => a.seName === activeUserName) : [...nextAtt]
    );
    persistFieldLogToDb({
      logType: 'CHECK_OUT',
      title: `Check-Out Harian (${activeUserName})`,
      locationLabel: `Gerbang ${effectiveProjectName}`,
      lat: effectiveCoords.lat,
      lng: effectiveCoords.lng,
      notes: 'Check-out harian selesai tugas',
    });
    showToast(`${activeUserName} berhasil Check-Out hari ini.`);
  };

  const handleRecordGps = async () => {
    const lat = liveGpsInfo?.lat ?? effectiveCoords.lat;
    const lng = liveGpsInfo?.lng ?? effectiveCoords.lng;
    recordGpsPoint({
      projectId: activeProjectId,
      seName: activeUserName,
      lat,
      lng,
      activityType: gpsActivityType,
      locationLabel: gpsLocationLabel || `Titik Kanvasing ${effectiveProjectName}`,
      baseCoords: effectiveCoords,
    });
    const nextGps = getGpsTrackLogs(activeProjectId, effectiveCoords, effectiveProjectName);
    setGpsLogs(
      userRole === 'SE' ? nextGps.filter((g) => g.seName === activeUserName) : [...nextGps]
    );
    await persistFieldLogToDb({
      logType: 'GPS',
      title: gpsActivityType,
      locationLabel: gpsLocationLabel,
      lat,
      lng,
      photoDataUrl: photoProofUrl,
      notes: `Aktivitas ${gpsActivityType} di ${gpsLocationLabel}`,
    });

    // Sinkronkan otomatis ke Rute Harian Canvassing jika check-in cocok dengan titik rute
    if (matchedWaypoint && !matchedWaypoint.visited) {
      const nextWps = todayWaypoints.map((w) =>
        w.order === matchedWaypoint.order && w.name === matchedWaypoint.name
          ? { ...w, visited: true }
          : w
      );
      setTodayWaypoints(nextWps);
      setMatchedWaypoint(null);
      try {
        await fetch('/api/se/routes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
            'X-User-Role': userRole,
          },
          body: JSON.stringify({ dayName: todayDayName, waypoints: nextWps }),
        });
      } catch {
        /* ignore */
      }
    }

    setPhotoProofUrl(null);
    showToast('Titik koordinat GPS, bukti kunjungan & status rute tersimpan ke database!');
  };

  const handleSaveCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callLeadName || !callPhone) return;
    addCallLog({
      projectId: activeProjectId,
      seName: activeUserName,
      leadName: callLeadName,
      phoneNumber: callPhone,
      direction: 'OUTBOUND',
      durationSeconds: Number(callDuration),
      outcome: callOutcome,
      summaryNotes: callNotes || `Catatan panggilan tersimpan ke log CRM ${effectiveProjectName}.`,
    });
    const nextCalls = getCallLogs(activeProjectId, effectiveProjectName);
    setCallLogs(
      userRole === 'SE' ? nextCalls.filter((c) => c.seName === activeUserName) : [...nextCalls]
    );
    persistFieldLogToDb({
      logType: 'CALL',
      title: `${callLeadName} (${callPhone})`,
      locationLabel: callPhone,
      durationSeconds: Number(callDuration),
      outcome: callOutcome,
      notes: callNotes || 'Catatan panggilan tersimpan ke log CRM.',
    });
    setShowCallForm(false);
    setCallLeadName('');
    setCallPhone('');
    setCallNotes('');
    showToast('Log panggilan tersimpan ke database & otomatis menambah Laporan Harian!');
  };

  const aiGuideResult = getAiActivityGuide(selectedActivity, simulatedPlan, effectiveProjectName);

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
                {effectiveProjectName} · Absensi, Tracking GPS, Log Panggilan &amp; Panduan AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsRadarTracking((prev) => !prev)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer border ${
                isRadarTracking
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                  : 'bg-sandstone text-stone-600 border-warmborder hover:bg-stone-200/60'
              }`}
              title="Aktifkan / Matikan Radar GPS Latar Belakang"
            >
              <span
                className={`size-2.5 rounded-full ${
                  isRadarTracking ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                }`}
              />
              <span className="hidden sm:inline">Radar GPS:</span>
              <span className="font-extrabold">{isRadarTracking ? 'LIVE' : 'STANDBY'}</span>
            </button>

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
        </div>

        {/* Navigation Tabs (Mobile-First Compact Grid / Strip) */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-warmborder">
          <div className={`grid gap-1.5 sm:flex sm:gap-2 ${hideAiGuide ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {[
              { id: 'absen', label: 'Absensi', desktopLabel: 'Absensi Harian', icon: UserCheck, badge: 'GPS' },
              { id: 'gps', label: 'GPS & Foto', desktopLabel: 'Tracking GPS & Foto', icon: MapPin, badge: 'Lapangan' },
              { id: 'call', label: 'Log Call', desktopLabel: 'Log Panggilan', icon: PhoneCall, badge: 'Call' },
              ...(!hideAiGuide
                ? [{ id: 'ai_guide', label: 'AI Guide', desktopLabel: 'AI Panduan Aktivitas SE', icon: Sparkles, badge: 'Platinum' }]
                : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`min-h-[44px] px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-espresso text-white shadow-xs'
                      : 'bg-sandstone text-warmmuted hover:text-espresso'
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="sm:hidden truncate">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.desktopLabel}</span>
                  <span
                    className={`hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
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
        <div className="p-3.5 sm:p-6 pb-24 md:pb-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
          {/* TAB 1: ABSENSI HARIAN (PRESENSI MANDIRI SEMUA ROLE + MONITORING TIM SM/ADMIN) */}
          {activeTab === 'absen' && (
            <div className="space-y-4 sm:space-y-5">
              {/* KARTU PRESENSI MANDIRI (SE, SM, ADMIN, DIREKSI) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-warmborder flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4 shadow-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-olive">
                      Presensi Mandiri {userProfile?.roleLabel || userRole}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        myTodayAttendance.status === 'HADIR'
                          ? 'bg-emerald-100 text-emerald-800'
                          : myTodayAttendance.status === 'SELESAI_TUGAS'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {myTodayAttendance.status === 'HADIR'
                        ? '✓ Sudah Check-In'
                        : myTodayAttendance.status === 'SELESAI_TUGAS'
                        ? '✓ Selesai Tugas'
                        : 'Belum Absen'}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-espresso mt-0.5 truncate">
                    Presensi Hari Ini: {activeUserName}
                  </h3>
                  <p className="text-xs text-warmmuted mt-0.5">
                    {myTodayAttendance.checkInTime ? `Masuk: ${myTodayAttendance.checkInTime}` : 'Belum Check-In'} ·{' '}
                    {myTodayAttendance.checkOutTime ? `Pulang: ${myTodayAttendance.checkOutTime}` : 'Belum Check-Out'}
                    {liveGpsInfo ? ` · GPS: ${liveGpsInfo.streetAddress}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto shrink-0">
                  <label className="min-h-[40px] px-3 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-espresso border border-warmborder text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                    <Camera className="size-4 text-terracotta shrink-0" />
                    <span>{photoProofUrl ? 'Foto Terlampir ✓' : 'Lampirkan Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleCheckIn}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-olive text-white text-xs font-bold hover:bg-olive/90 cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
                  >
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Check-In GPS ({userRole})</span>
                  </button>
                  <button
                    onClick={handleCheckOut}
                    className="min-h-[44px] px-2 sm:px-4 py-2 rounded-xl bg-espresso text-white text-[11px] sm:text-xs font-bold hover:bg-espresso/90 cursor-pointer inline-flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap"
                  >
                    <Clock className="size-3.5 sm:size-4 shrink-0" />
                    <span>Check-Out</span>
                  </button>
                </div>
              </div>

              {photoProofUrl && (
                <div className="p-3 rounded-2xl bg-white border border-warmborder flex items-center gap-3">
                  <img
                    src={photoProofUrl}
                    alt="Pratinjau Bukti Foto Kunjungan"
                    className="size-16 rounded-xl object-cover border border-warmborder shrink-0"
                  />
                  <div className="text-xs min-w-0 flex-1">
                    <p className="font-bold text-espresso">Bukti Foto Lapangan Siap Dikirim</p>
                    <p className="text-warmmuted">
                      Akan tersimpan bersama koordinat GPS saat Anda menekan Check-In atau Rekam Titik GPS.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoProofUrl(null)}
                    className="min-h-[44px] px-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              )}

              {/* JIKA MANAGER (SM / ADMIN): TAMPILKAN QUICK RADAR SE + REKAP ABSENSI TIM SE */}
              {isManager && (
                <>
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-espresso to-[#3F2B20] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Radio className="size-5 text-amber-300 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-extrabold text-white">
                            Radar Lapangan Live Tim SE
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-400/30">
                            {teamLiveMarkers.filter((m) => m.isOnline).length}/{teamLiveMarkers.length} SE Aktif
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-300 mt-0.5">
                          Pantau posisi koordinat live seluruh SE binaan di peta radar dan pergerakan kanvasing mereka.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('gps')}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-espresso text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
                    >
                      <MapPin className="size-3.5" />
                      <span>Buka Peta Radar Live SE</span>
                    </button>
                  </div>

                  <SmFieldMonitoringView
                    mode="absen"
                    projectName={effectiveProjectName}
                    baseCoords={effectiveCoords}
                    dbFieldLogs={dbFieldLogs}
                    fallbackAttendance={attendanceList}
                    fallbackGpsLogs={gpsLogs}
                  />
                </>
              )}

              {/* JIKA BUKAN MANAGER (SE): TAMPILKAN RINGKASAN & RIWAYAT ABSENSI PRIBADI */}
              {!isManager && (
                <>

              {/* Ringkasan Absensi Masuk & Keluar Hari Ini (Per Akun SE dari DB) */}
              {(() => {
                const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
                const todayCheckIns = dbFieldLogs.filter(
                  (l) => l.log_type === 'CHECK_IN' && l.created_at?.slice(0, 10) === todayKey
                );
                const todayCheckOuts = dbFieldLogs.filter(
                  (l) => l.log_type === 'CHECK_OUT' && l.created_at?.slice(0, 10) === todayKey
                );
                const firstIn = todayCheckIns[todayCheckIns.length - 1];
                const lastOut = todayCheckOuts[0];
                const fmtTime = (iso?: string) =>
                  iso
                    ? new Date(iso).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) + ' WIB'
                    : 'Belum';
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white border border-warmborder">
                      <p className="text-[11px] font-bold text-warmmuted uppercase">Jam Masuk Hari Ini</p>
                      <p className="text-lg font-extrabold text-olive mt-0.5">{fmtTime(firstIn?.created_at)}</p>
                      <p className="text-[11px] text-warmmuted truncate">{firstIn?.location_label || 'Belum check-in'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-warmborder">
                      <p className="text-[11px] font-bold text-warmmuted uppercase">Jam Keluar Hari Ini</p>
                      <p className="text-lg font-extrabold text-espresso mt-0.5">{fmtTime(lastOut?.created_at)}</p>
                      <p className="text-[11px] text-warmmuted truncate">{lastOut?.location_label || 'Belum check-out'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-warmborder">
                      <p className="text-[11px] font-bold text-warmmuted uppercase">Status Kehadiran Akun</p>
                      <p className="text-lg font-extrabold text-terracotta mt-0.5">
                        {firstIn ? (lastOut ? 'Selesai Tugas' : 'Sedang Bertugas') : 'Belum Absen'}
                      </p>
                      <p className="text-[11px] text-warmmuted truncate">Akun: {userEmail}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Filter SE untuk SM/TL */}
              {isManager && (
                <div className="p-3.5 rounded-xl bg-sandstone border border-warmborder flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-espresso flex items-center gap-1.5">
                    <UserCheck className="size-4 text-olive" /> Filter Personel:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['SEMUA', ...Array.from(new Set(attendanceList.map((a) => a.seName)))].map((name) => (
                      <button
                        key={name}
                        onClick={() => setSelectedSeFilter(name)}
                        className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                          selectedSeFilter === name
                            ? 'bg-espresso text-white shadow-xs'
                            : 'bg-white text-warmmuted hover:text-espresso border border-warmborder'
                        }`}
                      >
                        {name === 'SEMUA' ? 'Semua Tim' : name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Reflow Cards (< md) */}
              <div className="md:hidden space-y-2.5">
                {attendanceList
                  .filter((att) => selectedSeFilter === 'SEMUA' || att.seName === selectedSeFilter)
                  .map((att) => (
                  <div key={att.id} className="p-4 rounded-2xl bg-white border border-warmborder space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-espresso">{att.seName}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          att.status === 'HADIR' ? 'bg-lime-100 text-olive' : 'bg-amber-100 text-terracotta'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-sandstone/40 p-2.5 rounded-xl">
                      <div>
                        <span className="text-warmmuted block">Masuk:</span>
                        <strong className="text-olive">{att.checkInAt || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-warmmuted block">Pulang:</span>
                        <strong className="text-espresso">{att.checkOutAt || 'Belum'}</strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-warmmuted">{att.notes}</p>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block bg-white rounded-2xl border border-warmborder overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-extrabold uppercase text-warmmuted">
                      <th className="py-3 px-4">Nama Personel / SE</th>
                      <th className="py-3 px-4">Jam Masuk</th>
                      <th className="py-3 px-4">Jam Pulang</th>
                      <th className="py-3 px-4">Koordinat Check-In</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warmborder text-xs">
                    {attendanceList
                      .filter((att) => selectedSeFilter === 'SEMUA' || att.seName === selectedSeFilter)
                      .map((att) => (
                        <tr key={att.id} className="hover:bg-sandstone/30">
                          <td className="py-3 px-4 font-bold text-espresso">
                            {att.seName}
                            {att.seName === activeUserName && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-terracotta/10 text-terracotta font-extrabold">
                                Akun Anda ({userRole})
                              </span>
                            )}
                          </td>
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
            </>
          )}
        </div>
      )}

          {/* TAB 2: TRACKING GPS SE & LIVE RADAR SM */}
          {activeTab === 'gps' && isManager && (
            <div className="space-y-5">
              {/* Live Radar Multi-Marker Tim SE untuk SM / Admin */}
              <GpsLiveRadarMap
                routeWaypoints={todayWaypoints}
                isTracking={isRadarTracking}
                onToggleTracking={(val) => setIsRadarTracking(val)}
                liveGpsState={liveGpsInfo}
                teamLiveMarkers={teamLiveMarkers}
                focusedCoordinates={focusedMapCoords}
                currentUserRole={userRole}
                currentUserName={activeUserName}
                onLocationResolved={(info) => setLiveGpsInfo(info)}
              />

              {/* SM LIVE RADAR DASHBOARD CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-espresso text-white space-y-4 shadow-sm border border-espresso/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-terracotta text-white grid place-items-center font-bold">
                      <MapPin className="size-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                        Live Radar GPS Tim SE Binaan
                        <span className="size-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      </h4>
                      <p className="text-[11px] text-stone-300">
                        Posisi real-time tim SE di bawah naungan {activeUserName} ({userProfile?.roleLabel || userRole}) · {effectiveProjectName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-stone-200 font-semibold self-start sm:self-auto">
                    Titik Gerbang Proyek: <code className="text-amber-300">{effectiveCoords.lat.toFixed(5)}, {effectiveCoords.lng.toFixed(5)}</code>
                  </span>
                </div>

                {/* Grid Status Live SE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {teamLiveMarkers.map((se) => {
                    const distance = `${se.distanceFromProjectKm.toFixed(2)} km`;
                    const locName = se.locationLabel || `Gerbang ${effectiveProjectName}`;
                    const lastTime = se.lastUpdated || 'Baru Saja';

                    return (
                      <div key={se.id} className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className={`size-2 rounded-full ${se.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-stone-400'}`} />
                            {se.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-stone-200">
                            {se.zone}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-300 space-y-0.5">
                          <p className="font-semibold text-amber-300 truncate">{locName}</p>
                          <p className="text-[10px] text-stone-400">
                            Jarak: <strong className="text-white">{distance}</strong> dari gerbang · Jam: {lastTime}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFocusedMapCoords({ lat: se.lat, lng: se.lng });
                            showToast(`Peta radar difokuskan ke posisi ${se.name}`);
                          }}
                          className="w-full min-h-[32px] py-1 px-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Crosshair className="size-3 text-amber-300" />
                          <span>Fokus di Peta Radar</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Riwayat Timeline & Foto Lapangan */}
              <SmFieldMonitoringView
                mode="gps"
                projectName={effectiveProjectName}
                baseCoords={effectiveCoords}
                dbFieldLogs={dbFieldLogs}
                fallbackAttendance={attendanceList}
                fallbackGpsLogs={gpsLogs}
              />
            </div>
          )}

          {activeTab === 'gps' && !isManager && (
            <div className="space-y-5">
              {/* Live Radar GPS ala ShopeeFood + Nama Jalan & Landmark Terdekat */}
              <GpsLiveRadarMap
                routeWaypoints={todayWaypoints}
                isTracking={isRadarTracking}
                onToggleTracking={(val) => setIsRadarTracking(val)}
                liveGpsState={liveGpsInfo}
                currentUserRole={userRole}
                currentUserName={activeUserName}
                onLocationResolved={(info) => setLiveGpsInfo(info)}
                onUseLocationForCheckin={(info, matchedWp) => {
                  const label = matchedWp
                    ? `${matchedWp.name} — ${info.streetAddress}`
                    : `${info.streetAddress} (${info.nearestPoiLabel})`;
                  setGpsLocationLabel(label);
                  setLiveGpsInfo(info);
                  setMatchedWaypoint(matchedWp || null);
                  showToast('Lokasi live diterapkan ke form Check-in GPS!');
                }}
              />

              <div className="p-5 rounded-2xl bg-white border border-warmborder space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta">
                      Live Field Tracking (Semua Paket)
                    </span>
                    <h3 className="text-base font-extrabold text-espresso">
                      Jejak Pergerakan &amp; Kanvasing Lapangan
                    </h3>
                    <p className="text-xs text-warmmuted mt-0.5">
                      Input atau rekam titik pergerakan lapangan SE / Manajer di sekeliling radius {effectiveProjectName}.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                      value={gpsActivityType}
                      onChange={(e) => setGpsActivityType(e.target.value as GpsActivityType)}
                      className="min-h-[44px] md:min-h-[36px] px-3 rounded-xl border border-warmborder text-xs font-bold bg-sandstone text-espresso w-full sm:w-auto"
                    >
                      <option value="CANVASSING">Kanvasing Lapangan</option>
                      <option value="SURVEY_LOKASI">Survei Lokasi Klien</option>
                      <option value="MEETING_KLIEN">Meeting Klien / Bank</option>
                      <option value="CHECK_IN">Supervisi Gerbang/Kantor</option>
                    </select>
                    <input
                      type="text"
                      value={gpsLocationLabel}
                      onChange={(e) => setGpsLocationLabel(e.target.value)}
                      className="min-h-[44px] md:min-h-[36px] px-3 rounded-xl border border-warmborder text-xs w-full sm:w-60"
                      placeholder="Nama lokasi kunjungan..."
                    />
                    <label className="min-h-[44px] md:min-h-[36px] px-3 rounded-xl bg-sandstone hover:bg-warmborder text-espresso border border-warmborder text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Camera className="size-3.5 text-terracotta" />
                      <span>{photoProofUrl ? 'Foto ✓' : 'Bukti Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleRecordGps}
                      className="min-h-[44px] md:min-h-[36px] px-4 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center"
                    >
                      <MapPin className="size-3.5" /> Rekam Titik GPS
                    </button>
                  </div>
                </div>
              </div>

              {/* Riwayat Tersimpan di Database sales_os (dengan Bukti Foto) */}
              {dbFieldLogs.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-extrabold text-olive uppercase tracking-wider">
                    Tersimpan Real di Database ({dbFieldLogs.length} Catatan)
                  </p>
                  {dbFieldLogs
                    .filter((l) => l.log_type === 'GPS' || l.log_type === 'CHECK_IN')
                    .slice(0, 5)
                    .map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-white border border-lime-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {log.photo_data_url ? (
                            <img
                              src={log.photo_data_url}
                              alt="Bukti Kunjungan"
                              className="size-12 rounded-xl object-cover border border-warmborder shrink-0"
                            />
                          ) : (
                            <div className="size-10 rounded-xl bg-lime-100 text-olive grid place-items-center shrink-0">
                              <MapPin className="size-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-espresso truncate">{log.location_label || log.title}</p>
                            <p className="text-[11px] text-warmmuted">
                              {log.log_type} · {new Date(log.created_at).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-lime-100 text-olive text-[10px] font-extrabold self-start sm:self-center shrink-0">
                          Tercatat DB ✓
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Filter GPS Logs */}
              {isManager && (
                <div className="p-3.5 rounded-xl bg-sandstone border border-warmborder flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-espresso flex items-center gap-1.5">
                    <MapPin className="size-4 text-terracotta" /> Filter Riwayat Jejak:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['SEMUA', ...Array.from(new Set(gpsLogs.map((p) => p.seName)))].map((name) => (
                      <button
                        key={name}
                        onClick={() => setSelectedSeFilter(name)}
                        className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                          selectedSeFilter === name
                            ? 'bg-espresso text-white shadow-xs'
                            : 'bg-white text-warmmuted hover:text-espresso border border-warmborder'
                        }`}
                      >
                        {name === 'SEMUA' ? 'Semua Personel' : name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {gpsLogs
                  .filter((pt) => selectedSeFilter === 'SEMUA' || pt.seName === selectedSeFilter)
                  .map((pt) => (
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
                            {pt.seName === activeUserName && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-terracotta/10 text-terracotta font-extrabold">
                                Anda ({userRole})
                              </span>
                            )}
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

              {/* Mobile Call Log Cards (< md) */}
              <div className="md:hidden space-y-2.5">
                {callLogs.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white border border-warmborder space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-espresso">{c.leadName}</p>
                        <p className="text-[11px] font-mono text-warmmuted">{c.phoneNumber}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                          c.outcome === 'JANJI_SURVEI' || c.outcome === 'TERJAWAB_TERTARIK'
                            ? 'bg-lime-100 text-olive'
                            : c.outcome === 'TIDAK_ANGKAT'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-terracotta'
                        }`}
                      >
                        {c.outcome.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-warmmuted bg-sandstone/40 px-3 py-1.5 rounded-xl">
                      <span>{c.calledAt} · {c.seName}</span>
                      <strong className="text-espresso">
                        {Math.floor(c.durationSeconds / 60)}m {c.durationSeconds % 60}d
                      </strong>
                    </div>
                    <p className="text-[11px] text-warmmuted">{c.summaryNotes}</p>
                  </div>
                ))}
              </div>

              {/* Desktop Call Log Table (>= md) */}
              <div className="hidden md:block bg-white rounded-2xl border border-warmborder overflow-hidden">
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
                  <div className="p-5 rounded-2xl bg-white border border-warmborder space-y-3 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-lime-100 text-olive uppercase">
                          AI Coach Aktif · Paket {simulatedPlan.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Biaya: 5 AI Credit / sesi
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-warmmuted flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-olive" /> Terverifikasi KB {effectiveProjectName}
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-espresso">{aiGuideResult.guide.title}</h4>
                    <p className="text-xs text-warmmuted">{aiGuideResult.guide.goal}</p>

                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-terracotta">
                          Skrip Pembuka Rekomendasi AI:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(aiGuideResult.guide.openingScript);
                              setToast('Skrip pembuka berhasil disalin ke clipboard');
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-espresso text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          <Copy className="size-3" />
                          <span>Salin Skrip</span>
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-espresso mt-1 leading-relaxed italic">
                        "{aiGuideResult.guide.openingScript}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-warmborder space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-extrabold uppercase tracking-wider text-espresso">
                          Langkah Eksekusi Berurutan
                        </h5>
                        <span className="text-[10px] text-warmmuted font-semibold">
                          Klik langkah untuk mencentang
                        </span>
                      </div>
                      <ol className="space-y-2 text-xs text-espresso">
                        {aiGuideResult.guide.executionSteps.map((step, i) => {
                          const isDone = completedSteps.includes(i);
                          return (
                            <li
                              key={i}
                              onClick={() => {
                                setCompletedSteps((prev) =>
                                  prev.includes(i) ? prev.filter((idx) => idx !== i) : [...prev, i]
                                );
                              }}
                              className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                                isDone
                                  ? 'bg-emerald-50/90 text-emerald-950 border border-emerald-200'
                                  : 'hover:bg-sandstone'
                              }`}
                            >
                              <span
                                className={`size-5 rounded-full font-extrabold text-[10px] grid place-items-center shrink-0 ${
                                  isDone ? 'bg-emerald-600 text-white' : 'bg-sandstone text-terracotta'
                                }`}
                              >
                                {isDone ? '✓' : i + 1}
                              </span>
                              <span className={`leading-relaxed ${isDone ? 'line-through text-warmmuted' : ''}`}>
                                {step}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                      <div className="pt-2 border-t border-warmborder text-[11px] font-bold text-olive">
                        ✓ Checklist Penutup: {aiGuideResult.guide.closingChecklist}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-warmborder space-y-3 shadow-xs flex flex-col justify-between">
                      <div className="space-y-3">
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

                      {/* Action Footer: Catat Aktivitas Lapangan & Debet 5 AIC */}
                      <div className="pt-4 border-t border-warmborder space-y-2">
                        <div className="flex items-center justify-between text-xs text-warmmuted">
                          <span>
                            Progress: <strong>{completedSteps.length}</strong> / {aiGuideResult.guide.executionSteps.length} langkah
                          </span>
                          <span className="font-semibold text-espresso">AI Pendamping Sales Siap</span>
                        </div>
                        <button
                          type="button"
                          disabled={isSavingCopilotLog}
                          onClick={async () => {
                            setIsSavingCopilotLog(true);
                            try {
                              const res = await fetch('/api/se/activity-guide/log', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'x-user-email': userEmail,
                                  'x-user-role': userRole,
                                },
                                body: JSON.stringify({
                                  activityKey: selectedActivity,
                                  activityLabel: ALL_SE_ACTIVITY_CATEGORIES.find((a) => a.key === selectedActivity)?.label || selectedActivity,
                                  completedSteps,
                                  notes: `Menyelesaikan ${completedSteps.length}/${aiGuideResult.guide.executionSteps.length} langkah panduan AI Copilot`,
                                  locationLabel: effectiveProjectName,
                                }),
                              });
                              const data = await res.json();
                              if (data.ok) {
                                setToast(`Log aktivitas tersimpan ke Field Ops! 5 AIC berhasil didebet.`);
                                setCompletedSteps([]);
                              } else {
                                setToast(data.message || data.error || 'Aktivitas terekam');
                              }
                            } catch {
                              setToast('Aktivitas diselesaikan dan dicatat secara lokal.');
                            } finally {
                              setIsSavingCopilotLog(false);
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white font-extrabold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-colors"
                        >
                          <CheckCircle2 className="size-4" />
                          <span>
                            {isSavingCopilotLog ? 'Menyimpan Log...' : 'Selesaikan Aktivitas & Simpan Log (5 AIC)'}
                          </span>
                        </button>
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
