// ============================================================================
// DAILY ROUTE VIEWER - DEVELOPER SALES OS
// GPS-Guided Canvassing Route for Sales Executive (Printable & Mobile-First)
// ============================================================================

import { useEffect, useState } from 'react';
import {
  MapPin,
  Clock,
  Printer,
  X,
  Navigation,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Camera,
  LocateFixed,
  AlertTriangle,
} from 'lucide-react';
import { generateDailyRoutePlan } from '../lib/playbook/route-generator';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';
import type { DailyRoutePlan, DailyRouteWaypoint } from '../lib/playbook/types';

const VALID_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

interface CustomWaypoint extends DailyRouteWaypoint {
  isCustom?: boolean;
  visited?: boolean;
  photoProofUrl?: string;
  targetLat?: number;
  targetLng?: number;
  validatedLat?: number;
  validatedLng?: number;
  validationDistanceM?: number;
  validationStatus?: 'TERVALIDASI' | 'PERLU_DILENGKAPI' | 'TANPA_GPS';
  validationMessage?: string;
  gpsSkipReason?: string;
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

interface DailyRouteViewerProps {
  projectId?: string;
  projectName?: string;
  userEmail?: string;
  userRole?: string;
  variant?: 'modal' | 'page';
  onClose?: () => void;
}

export function DailyRouteViewer({
  projectId = 'proj-the-park-01',
  projectName = 'The Park Townhouse Sukoharjo',
  userEmail = 'raka@andararejomakmur.co.id',
  userRole = 'SE',
  variant = 'modal',
  onClose,
}: DailyRouteViewerProps) {
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const urlTab = variant === 'page' ? getQueryParam('tab') : null;
    if (urlTab && VALID_DAYS.includes(urlTab)) return urlTab;
    return loadPersistedState<string>(`devos_route_day_${projectId}`, 'Senin');
  });

  const baseRoute: DailyRoutePlan = generateDailyRoutePlan(selectedDay);
  const [waypoints, setWaypoints] = useState<CustomWaypoint[]>(() =>
    loadPersistedState<CustomWaypoint[]>(
      `devos_route_wp_${projectId}_${selectedDay}`,
      baseRoute.waypoints
    )
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<number | null>(null);
  const [wpName, setWpName] = useState('');
  const [wpCategory, setWpCategory] = useState<DailyRouteWaypoint['category']>('Perkantoran & RS');
  const [wpObjective, setWpObjective] = useState('');
  const [wpDriveMin, setWpDriveMin] = useState(10);
  const [wpDurationMin, setWpDurationMin] = useState(60);
  const [wpFlyers, setWpFlyers] = useState(15);
  const [wpLeads, setWpLeads] = useState(3);
  const [validatingOrder, setValidatingOrder] = useState<number | null>(null);
  const [skipFormOrder, setSkipFormOrder] = useState<number | null>(null);
  const [skipReasonInput, setSkipReasonInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // F62: Rain, absence & route replanning states
  const [isRainMode, setIsRainMode] = useState<boolean>(() =>
    loadPersistedState<boolean>(`devos_route_rain_${projectId}`, false)
  );
  const [substituteSe, setSubstituteSe] = useState<string | null>(() =>
    loadPersistedState<string | null>(`devos_route_sub_${projectId}`, null)
  );

  const toggleRainMode = () => {
    const next = !isRainMode;
    setIsRainMode(next);
    savePersistedState(`devos_route_rain_${projectId}`, next);
    if (next) {
      showToast('Mode Cuaca Buruk Aktif: Titik rute dialihkan ke lokasi indoor/mall terdekat.');
    } else {
      showToast('Kembali ke rute normal lapangan.');
    }
  };

  const handleSetSubstitute = (name: string | null) => {
    setSubstituteSe(name);
    savePersistedState(`devos_route_sub_${projectId}`, name);
    if (name) {
      showToast(`Rute hari ${selectedDay} berhasil ditugaskan ke ${name}`);
    } else {
      showToast('Penugasan rute dikembalikan ke SE awal.');
    }
  };

  const indoorSubstitutes: Record<string, string> = {
    'Alun-Alun Satya Negara Sukoharjo': 'The Park Mall Solo Baru (Lobby Atrium Indoor)',
    'Gelora Merdeka Sukoharjo': 'Pakuwon Mall Solo Baru (Ground Floor Customer Walk)',
    'Taman Pakujoyo Gayam': 'RS Indriati Solo Baru (Kantin Dokter & Ruang Tunggu)',
    'CFD Jl. Veteran Sukoharjo': 'Bank BSI KC Solo Baru (Customer Lounge)',
  };

  const effectiveWaypoints: CustomWaypoint[] = isRainMode
    ? waypoints.map((w) => ({
        ...w,
        name: indoorSubstitutes[w.name] || `${w.name} (Zona Indoor / Beratap)`,
        category: (indoorSubstitutes[w.name] ? 'Pusat Belanja & Mal' : w.category) as DailyRouteWaypoint['category'],
        canvassingObjective: `Replan Hujan: Sapa pengunjung di area beratap/indoor tanpa basah kuyup. ${w.canvassingObjective}`,
      }))
    : waypoints;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    savePersistedState(`devos_route_day_${projectId}`, selectedDay);
    if (variant === 'page') {
      setQueryParam('tab', selectedDay);
    }
    const localSaved = loadPersistedState<CustomWaypoint[] | null>(
      `devos_route_wp_${projectId}_${selectedDay}`,
      null
    );
    setWaypoints(localSaved || generateDailyRoutePlan(selectedDay).waypoints);

    fetch(`/api/se/routes?day=${encodeURIComponent(selectedDay)}`, {
      headers: { 'X-User-Email': userEmail, 'X-User-Role': userRole },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.ok && Array.isArray(json.waypoints) && json.waypoints.length > 0) {
          setWaypoints(json.waypoints);
          savePersistedState(`devos_route_wp_${projectId}_${selectedDay}`, json.waypoints);
        }
      })
      .catch(() => {});
  }, [selectedDay, projectId, variant, userEmail, userRole]);

  const persistWaypoints = async (next: CustomWaypoint[]) => {
    const reordered = next.map((w, idx) => ({ ...w, order: idx + 1 }));
    setWaypoints(reordered);
    savePersistedState(`devos_route_wp_${projectId}_${selectedDay}`, reordered);
    try {
      await fetch('/api/se/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
        },
        body: JSON.stringify({ dayName: selectedDay, waypoints: reordered }),
      });
    } catch {
      /* fallback ke localStorage */
    }
  };

  const resetFormFields = () => {
    setEditingOrder(null);
    setWpName('');
    setWpCategory('Perkantoran & RS');
    setWpObjective('');
    setWpDriveMin(10);
    setWpDurationMin(60);
    setWpFlyers(15);
    setWpLeads(3);
  };

  const handleSaveWaypoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpName.trim()) return;
    if (editingOrder !== null) {
      const updated = waypoints.map((w) =>
        w.order === editingOrder
          ? {
              ...w,
              name: wpName.trim(),
              category: wpCategory,
              canvassingObjective: wpObjective.trim() || 'Kunjungan & penyebaran brosur prospek.',
              estimatedDriveMinutes: Number(wpDriveMin),
              canvassingDurationMinutes: Number(wpDurationMin),
              flyersTarget: Number(wpFlyers),
              leadTarget: Number(wpLeads),
              isCustom: true,
            }
          : w
      );
      await persistWaypoints(updated);
      showToast('Titik kunjungan berhasil diperbarui ke database!');
    } else {
      const created: CustomWaypoint = {
        order: waypoints.length + 1,
        name: wpName.trim(),
        category: wpCategory,
        coordinates: baseRoute.startPoint,
        estimatedDriveMinutes: Number(wpDriveMin),
        canvassingDurationMinutes: Number(wpDurationMin),
        canvassingObjective: wpObjective.trim() || 'Kunjungan mandiri & pengumpulan kontak prospek.',
        flyersTarget: Number(wpFlyers),
        leadTarget: Number(wpLeads),
        isCustom: true,
        visited: false,
      };
      await persistWaypoints([...waypoints, created]);
      showToast('Titik kunjungan baru ditambahkan ke rute harian!');
    }
    resetFormFields();
    setShowAddForm(false);
  };

  const handleEditWaypoint = (wp: CustomWaypoint) => {
    setEditingOrder(wp.order);
    setWpName(wp.name);
    setWpCategory(wp.category);
    setWpObjective(wp.canvassingObjective);
    setWpDriveMin(wp.estimatedDriveMinutes);
    setWpDurationMin(wp.canvassingDurationMinutes);
    setWpFlyers(wp.flyersTarget);
    setWpLeads(wp.leadTarget);
    setShowAddForm(true);
  };

  const handleDeleteWaypoint = async (orderNum: number) => {
    const filtered = waypoints.filter((w) => w.order !== orderNum);
    await persistWaypoints(filtered);
    showToast('Titik kunjungan dihapus dari rute.');
  };

  const handleResetDefaultRoute = async () => {
    await persistWaypoints(generateDailyRoutePlan(selectedDay).waypoints);
    showToast(`Rute ${selectedDay} dikembalikan ke rekomendasi sistem.`);
  };

  const route = baseRoute;
  const totalLeadTarget = waypoints.reduce((acc, w) => acc + Number(w.leadTarget || 0), 0);
  const visitedCount = waypoints.filter((w) => w.visited).length;

  const days = VALID_DAYS;

  const outerClass =
    variant === 'page'
      ? 'w-full'
      : 'fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200';
  const cardClass =
    variant === 'page'
      ? 'bg-white rounded-2xl border border-warmborder w-full flex flex-col overflow-hidden shadow-xs'
      : 'bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden';

  return (
    <div className={outerClass}>
      <div className={cardClass}>
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 bg-sandstone/60 border-b border-warmborder flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="size-10 sm:size-11 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm shrink-0">
              <Navigation className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-espresso tracking-tight leading-snug">
                  Rute Harian &amp; Kanvasing SE
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-terracotta/10 text-terracotta border border-terracotta/20 shrink-0">
                  {selectedDay}
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5 leading-relaxed">
                {projectName} · Titik Awal: {route.startPoint.name}
              </p>
            </div>
            {variant === 'modal' && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup Rute Harian"
                className="sm:hidden size-10 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-terracotta text-white hover:bg-terracotta/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Printer className="size-3.5 shrink-0" />
              <span>Cetak Lembar Rute</span>
            </button>

            {variant === 'modal' && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup Rute Harian"
                className="hidden sm:flex size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso items-center justify-center transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Day Selector Bar */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <span className="text-xs font-bold text-warmmuted shrink-0">Pilih Hari Kanvasing:</span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar snap-x">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDay === day
                    ? 'bg-espresso text-white shadow-sm'
                    : 'bg-sandstone text-warmmuted hover:text-espresso'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* F62: Kontrol Cuaca Buruk & SE Pengganti (Rain, absence & route replanning) */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-warmborder flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleRainMode}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isRainMode
                  ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                  : 'bg-sandstone/60 text-espresso hover:bg-warmborder border-warmborder'
              }`}
            >
              <span>{isRainMode ? '🌧️ Mode Hujan Aktif (Indoor)' : '🌦️ Replan Hujan (Indoor · F62)'}</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-warmmuted text-[11px] font-bold">SE Bertugas:</span>
              <select
                aria-label="Pilih SE yang bertugas"
                value={substituteSe || ''}
                onChange={(e) => handleSetSubstitute(e.target.value ? e.target.value : null)}
                className="h-8 px-2 rounded-lg border border-warmborder bg-sandstone/30 text-xs font-bold text-espresso cursor-pointer focus:outline-none"
              >
                <option value="">Raka Pratama (SE Utama)</option>
                <option value="Budi Santoso">Budi Santoso (SE Piket / Pengganti)</option>
                <option value="Siti Rahma">Siti Rahma (SE Cadangan)</option>
              </select>
            </div>
          </div>

          {isRainMode && (
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              SOP §11.2: Rute dialihkan ke lokasi beratap / indoor mall untuk keselamatan sales &amp; brosur.
            </span>
          )}
        </div>

        {/* Route Summary Metrics Banner */}
        <div className="px-4 sm:px-6 py-3 bg-sandstone/30 border-b border-warmborder grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 text-left sm:text-center shrink-0">
          <div className="flex sm:block items-center justify-between">
            <span className="text-[10px] font-bold text-warmmuted uppercase">Total Titik Kunjungan</span>
            <p className="text-sm font-extrabold text-espresso">
              {waypoints.length} Titik ({visitedCount} Selesai)
            </p>
          </div>
          <div className="flex sm:block items-center justify-between">
            <span className="text-[10px] font-bold text-warmmuted uppercase">Estimasi Waktu Lapangan</span>
            <p className="text-sm font-extrabold text-espresso">{route.estimatedHours} Jam</p>
          </div>
          <div className="flex sm:block items-center justify-between">
            <span className="text-[10px] font-bold text-warmmuted uppercase">Target Lead Baru</span>
            <p className="text-sm font-extrabold text-terracotta">{totalLeadTarget} Kontak Prospek</p>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#FBF9F5] space-y-5">
          {/* Waypoints Flow + Manual Input Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2">
                <MapPin className="size-4 text-terracotta shrink-0" />
                <span>Titik Kunjungan Lapangan Terurut ({waypoints.length} Titik)</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaultRoute}
                  className="min-h-[44px] px-3 rounded-xl bg-white border border-warmborder text-warmmuted hover:text-espresso text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Rekomendasi AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetFormFields();
                    setShowAddForm((prev) => !prev);
                  }}
                  className="min-h-[44px] px-3.5 rounded-xl bg-espresso text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-4 text-amber-400" />
                  <span>Tambah Titik Manual</span>
                </button>
              </div>
            </div>

            {showAddForm && (
              <form
                onSubmit={handleSaveWaypoint}
                className="p-4 rounded-2xl bg-white border-2 border-terracotta/40 space-y-3"
              >
                <h4 className="text-xs font-extrabold text-terracotta uppercase">
                  {editingOrder !== null ? `Edit Titik Kunjungan #${editingOrder}` : 'Tambah Titik Kunjungan Mandiri'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-espresso mb-1">Nama Lokasi / Area Target *</label>
                    <input
                      required
                      value={wpName}
                      onChange={(e) => setWpName(e.target.value)}
                      placeholder="Contoh: Sentra Ruko Jl. Slamet Riyadi / Klinik Pratama"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-espresso mb-1">Kategori Area</label>
                    <select
                      value={wpCategory}
                      onChange={(e) => setWpCategory(e.target.value as DailyRouteWaypoint['category'])}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder bg-white"
                    >
                      <option value="Perkantoran & RS">Perkantoran &amp; RS</option>
                      <option value="Perbankan & Finansial">Perbankan &amp; Finansial</option>
                      <option value="Pasar & Sentra Niaga">Pasar &amp; Sentra Niaga</option>
                      <option value="Perumahan Sekitar">Perumahan Sekitar</option>
                    </select>
                  </div>
                </div>
                <div className="text-xs">
                  <label className="block font-bold text-espresso mb-1">Tujuan &amp; Target Aktivitas</label>
                  <input
                    value={wpObjective}
                    onChange={(e) => setWpObjective(e.target.value)}
                    placeholder="Contoh: Temui pemilik toko & bagikan brosur promo cash bertahap..."
                    className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-warmmuted mb-1">Tempuh (Mnt)</label>
                    <input
                      type="number"
                      min={1}
                      value={wpDriveMin}
                      onChange={(e) => setWpDriveMin(Number(e.target.value))}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-warmmuted mb-1">Durasi (Mnt)</label>
                    <input
                      type="number"
                      min={5}
                      value={wpDurationMin}
                      onChange={(e) => setWpDurationMin(Number(e.target.value))}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-warmmuted mb-1">Target Flyer</label>
                    <input
                      type="number"
                      min={0}
                      value={wpFlyers}
                      onChange={(e) => setWpFlyers(Number(e.target.value))}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-warmmuted mb-1">Target Lead</label>
                    <input
                      type="number"
                      min={0}
                      value={wpLeads}
                      onChange={(e) => setWpLeads(Number(e.target.value))}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      resetFormFields();
                      setShowAddForm(false);
                    }}
                    className="min-h-[44px] px-4 rounded-xl bg-sandstone text-espresso text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 rounded-xl bg-terracotta text-white text-xs font-bold cursor-pointer"
                  >
                    Simpan Titik Rute
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {effectiveWaypoints.map((wp) => (
                <div
                  key={`${wp.order}-${wp.name}`}
                  className={`p-4 rounded-2xl bg-white border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                    wp.visited ? 'border-olive/50 bg-lime-50/20' : 'border-warmborder'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                        wp.visited ? 'bg-olive text-white' : 'bg-terracotta text-white'
                      }`}
                    >
                      {wp.order}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sandstone text-warmmuted whitespace-nowrap shrink-0">
                          {wp.category}
                        </span>
                        {wp.isCustom && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-terracotta border border-amber-200 whitespace-nowrap shrink-0">
                            Rute Mandiri SE
                          </span>
                        )}
                        <span className="text-xs font-bold text-olive whitespace-nowrap shrink-0">
                          ± {wp.estimatedDriveMinutes} mnt
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-espresso mt-1 break-words">
                        {wp.name}
                      </h4>
                      <p className="text-xs text-warmmuted mt-0.5 break-words">
                        {wp.canvassingObjective}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
                    <div className="grid grid-cols-3 gap-2 text-xs bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                      <div>
                        <span className="text-[10px] text-warmmuted block">Durasi</span>
                        <strong className="text-espresso">{wp.canvassingDurationMinutes}m</strong>
                      </div>
                      <div className="border-l border-amber-200 pl-2">
                        <span className="text-[10px] text-warmmuted block">Flyer</span>
                        <strong className="text-espresso">{wp.flyersTarget}</strong>
                      </div>
                      <div className="border-l border-amber-200 pl-2">
                        <span className="text-[10px] text-warmmuted block">Target</span>
                        <strong className="text-terracotta">{wp.leadTarget} Lead</strong>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <label className="min-h-[40px] px-3 py-1.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso border border-warmborder text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                          <Camera className="size-3.5 text-terracotta" />
                          <span>{wp.photoProofUrl ? 'Foto ✓' : 'Bukti Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  const next = waypoints.map((w) =>
                                    w.order === wp.order ? { ...w, photoProofUrl: reader.result as string } : w
                                  );
                                  persistWaypoints(next);
                                  showToast(`Bukti foto titik #${wp.order} terlampir.`);
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          disabled={validatingOrder === wp.order}
                          onClick={() => {
                            if (!navigator.geolocation) {
                              showToast('Browser tidak mendukung GPS. Gunakan tombol Tidak Input GPS.');
                              return;
                            }
                            setValidatingOrder(wp.order);
                            navigator.geolocation.getCurrentPosition(
                              async (pos) => {
                                const lat = pos.coords.latitude;
                                const lng = pos.coords.longitude;
                                const hasTarget = wp.targetLat != null && wp.targetLng != null;
                                const refLat = hasTarget ? Number(wp.targetLat) : -7.6145;
                                const refLng = hasTarget ? Number(wp.targetLng) : 110.8182;
                                const distM = distanceMeters(lat, lng, refLat, refLng);
                                const radiusLimitM = hasTarget ? 500 : 15000;
                                const locMatched = distM <= radiusLimitM;
                                const hasPhoto = Boolean(wp.photoProofUrl);

                                const nextStatus: CustomWaypoint['validationStatus'] =
                                  locMatched && hasPhoto ? 'TERVALIDASI' : 'PERLU_DILENGKAPI';
                                const msg = !hasPhoto
                                  ? `Lokasi GPS terekam (${lat.toFixed(5)}, ${lng.toFixed(5)}), namun bukti foto wajib diunggah.`
                                  : !locMatched
                                  ? `Lokasi belum sesuai target (jarak ${(distM / 1000).toFixed(2)} km) — perlu dilengkapi.`
                                  : `Lokasi & bukti foto tervalidasi (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

                                const next = waypoints.map((w) =>
                                  w.order === wp.order
                                    ? {
                                        ...w,
                                        visited: locMatched && hasPhoto,
                                        validatedLat: lat,
                                        validatedLng: lng,
                                        validationDistanceM: distM,
                                        validationStatus: nextStatus,
                                        validationMessage: msg,
                                      }
                                    : w
                                );
                                persistWaypoints(next);
                                try {
                                  await fetch('/api/se/field-logs', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'X-User-Email': userEmail,
                                      'X-User-Role': userRole,
                                    },
                                    body: JSON.stringify({
                                      logType: 'GPS',
                                      title: `Validasi Rute: ${wp.name}`,
                                      locationLabel: wp.name,
                                      lat,
                                      lng,
                                      photoDataUrl: wp.photoProofUrl || null,
                                      notes: msg,
                                    }),
                                  });
                                } catch {
                                  /* ignore */
                                }
                                setValidatingOrder(null);
                                showToast(msg);
                              },
                              () => {
                                setValidatingOrder(null);
                                showToast('Gagal melacak GPS. Pastikan izin lokasi aktif atau isi Tidak Input GPS.');
                              },
                              { enableHighAccuracy: true, timeout: 10000 }
                            );
                          }}
                          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                            wp.validationStatus === 'TERVALIDASI'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-terracotta hover:bg-terracotta/90 text-white'
                          }`}
                        >
                          <LocateFixed className="size-3.5" />
                          <span>
                            {validatingOrder === wp.order
                              ? 'Melacak...'
                              : wp.validationStatus === 'TERVALIDASI'
                              ? 'Tervalidasi ✓'
                              : 'Validasi Lokasi'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSkipFormOrder(skipFormOrder === wp.order ? null : wp.order);
                            setSkipReasonInput(wp.gpsSkipReason || '');
                          }}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold cursor-pointer"
                        >
                          Tidak Input GPS
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditWaypoint(wp)}
                          aria-label="Edit Titik"
                          className="min-h-[40px] min-w-[40px] rounded-xl bg-sandstone hover:bg-warmborder text-espresso grid place-items-center cursor-pointer"
                        >
                          <Edit3 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWaypoint(wp.order)}
                          aria-label="Hapus Titik"
                          className="min-h-[40px] min-w-[40px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 grid place-items-center cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {/* Status Validasi / Preview Foto / Form Alasan Tidak Input GPS */}
                      {(wp.validationStatus || wp.photoProofUrl || skipFormOrder === wp.order) && (
                        <div className="w-full space-y-2 text-xs">
                          {wp.validationStatus === 'PERLU_DILENGKAPI' && (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-semibold">
                              <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                              <span>Perlu Dilengkapi: {wp.validationMessage}</span>
                            </div>
                          )}
                          {wp.validationStatus === 'TANPA_GPS' && wp.gpsSkipReason && (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
                              Tidak Input GPS — Alasan: {wp.gpsSkipReason}
                            </div>
                          )}
                          {wp.photoProofUrl && (
                            <div className="flex items-center gap-2">
                              <img
                                src={wp.photoProofUrl}
                                alt={`Bukti ${wp.name}`}
                                className="size-12 rounded-xl object-cover border border-warmborder"
                              />
                              <span className="text-[11px] font-bold text-olive">Bukti foto terlampir ✓</span>
                            </div>
                          )}
                          {skipFormOrder === wp.order && (
                            <div className="p-3 rounded-xl bg-sandstone/70 border border-warmborder flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={skipReasonInput}
                                onChange={(e) => setSkipReasonInput(e.target.value)}
                                placeholder="Alasan tidak input GPS (mis. sinyal lemah di basement/gedung)..."
                                className="flex-1 min-h-[38px] px-3 rounded-lg border border-warmborder bg-white text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!skipReasonInput.trim()) {
                                    showToast('Wajib isi alasan tidak input GPS.');
                                    return;
                                  }
                                  const next = waypoints.map((w) =>
                                    w.order === wp.order
                                      ? {
                                          ...w,
                                          validationStatus: 'TANPA_GPS' as const,
                                          gpsSkipReason: skipReasonInput.trim(),
                                        }
                                      : w
                                  );
                                  persistWaypoints(next);
                                  setSkipFormOrder(null);
                                  showToast('Alasan tidak input GPS tersimpan.');
                                }}
                                className="min-h-[38px] px-3.5 rounded-lg bg-espresso text-white text-xs font-bold cursor-pointer"
                              >
                                Simpan Alasan
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {toast && (
            <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-espresso text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">
              {toast}
            </div>
          )}

          {/* Hourly Timeline */}
          <div className="bg-white p-5 rounded-3xl border border-warmborder shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2">
              <Clock className="size-4 text-terracotta" />
              Jadwal Rundown Aktivitas Per Jam (08:00 - 17:30 WIB)
            </h3>

            <div className="space-y-2.5">
              {route.hourlySchedule.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-sandstone/30 border border-warmborder/60 text-xs"
                >
                  <span className="font-mono font-bold text-terracotta shrink-0 w-28">
                    {item.timeRange}
                  </span>
                  <div className="flex-1">
                    <p className="font-extrabold text-espresso">{item.activity}</p>
                    <p className="text-warmmuted text-[11px] mt-0.5">
                      Lokasi: {item.location} &middot; <span className="italic">{item.notes}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
