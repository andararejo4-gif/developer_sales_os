import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Radio,
  AlertCircle,
  Check,
} from 'lucide-react';
import osmPoisData from '../../data/osm_poi.json';
import {
  PROJECT_BASE_COORDS,
  calculateDistanceKm,
} from '../../lib/field-ops/field-ops-store';
import type { DailyRouteWaypoint } from '../../lib/playbook/types';

interface OsmPoiItem {
  name: string;
  categoryLabel?: string;
  category?: string;
  lat: number;
  lng: number;
}

export interface LiveGpsState {
  lat: number;
  lng: number;
  accuracy: number;
  streetAddress: string;
  areaSummary: string;
  nearestPoiLabel: string;
  distanceToProjectKm: number;
  updatedAt: string;
}

export interface RadarWaypoint extends DailyRouteWaypoint {
  visited?: boolean;
}

export interface TeamMemberLiveMarker {
  id: string;
  name: string;
  email: string;
  seId: string;
  role: string;
  zone: string;
  lat: number;
  lng: number;
  distanceFromProjectKm: number;
  locationLabel: string;
  lastUpdated: string;
  isOnline: boolean;
  statusLabel: string;
  avatarText?: string;
  photoUrl?: string | null;
}

interface GpsLiveRadarMapProps {
  routeWaypoints?: RadarWaypoint[];
  onLocationResolved?: (info: LiveGpsState) => void;
  onUseLocationForCheckin?: (info: LiveGpsState, matchedWaypoint?: RadarWaypoint) => void;
  isTracking?: boolean;
  onToggleTracking?: (active: boolean) => void;
  liveGpsState?: LiveGpsState | null;
  teamLiveMarkers?: TeamMemberLiveMarker[];
  focusedCoordinates?: { lat: number; lng: number } | null;
  currentUserRole?: string;
  currentUserName?: string;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

export const GpsLiveRadarMap: React.FC<GpsLiveRadarMapProps> = ({
  routeWaypoints = [],
  onLocationResolved,
  onUseLocationForCheckin,
  isTracking: isTrackingProp,
  onToggleTracking,
  liveGpsState,
  teamLiveMarkers = [],
  focusedCoordinates,
  currentUserRole = 'SE',
  currentUserName,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const seMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const teamLayerRef = useRef<L.LayerGroup | null>(null);
  const lastGeocodeCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const [internalIsTracking, setInternalIsTracking] = useState(false);
  const isTracking = isTrackingProp !== undefined ? isTrackingProp : internalIsTracking;

  const [isLocatingOnce, setIsLocatingOnce] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [liveGps, setLiveGps] = useState<LiveGpsState | null>(liveGpsState || null);
  const [followMe, setFollowMe] = useState(true);

  const pois = useMemo(() => (osmPoisData as OsmPoiItem[]).filter((p) => p.lat && p.lng && p.name), []);

  // Hitung 3 POI terdekat & titik rute terdekat dari koordinat saat ini
  const nearbyContext = useMemo(() => {
    const refLat = liveGps?.lat ?? PROJECT_BASE_COORDS.lat;
    const refLng = liveGps?.lng ?? PROJECT_BASE_COORDS.lng;

    const nearestPois = pois
      .map((p) => ({
        ...p,
        distKm: calculateDistanceKm(refLat, refLng, p.lat, p.lng),
      }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 3);

    const nearestWaypoints = routeWaypoints
      .map((wp) => ({
        wp,
        distKm: calculateDistanceKm(refLat, refLng, wp.coordinates.lat, wp.coordinates.lng),
      }))
      .sort((a, b) => a.distKm - b.distKm);

    const distToProjectKm = calculateDistanceKm(
      refLat,
      refLng,
      PROJECT_BASE_COORDS.lat,
      PROJECT_BASE_COORDS.lng
    );

    return {
      nearestPois,
      nearestWaypoints,
      matchedWaypoint:
        nearestWaypoints[0] && nearestWaypoints[0].distKm <= 0.25 ? nearestWaypoints[0].wp : undefined,
      distToProjectKm,
    };
  }, [liveGps?.lat, liveGps?.lng, pois, routeWaypoints]);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [PROJECT_BASE_COORDS.lat, PROJECT_BASE_COORDS.lng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Pin Proyek Utama
    const projectIcon = L.divIcon({
      className: 'custom-project-pin',
      html: `<div style="background:#0B3D2E;color:#C6F432;border:2px solid #fff;border-radius:9999px;padding:4px 8px;font-size:10px;font-weight:800;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.28);">The Park (Proyek)</div>`,
      iconSize: [120, 26],
      iconAnchor: [60, 13],
    });
    L.marker([PROJECT_BASE_COORDS.lat, PROJECT_BASE_COORDS.lng], { icon: projectIcon })
      .addTo(map)
      .bindPopup(`<b>${PROJECT_BASE_COORDS.label}</b><br/>Titik Pusat Proyek`);

    routeLayerRef.current = L.layerGroup().addTo(map);
    teamLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      seMarkerRef.current = null;
      accuracyCircleRef.current = null;
      routeLayerRef.current = null;
      teamLayerRef.current = null;
    };
  }, []);

  // Update live marker ketika liveGpsState dari parent berubah
  useEffect(() => {
    if (liveGpsState) {
      setLiveGps(liveGpsState);
      updateRadarMarker(liveGpsState.lat, liveGpsState.lng, liveGpsState.accuracy);
    }
  }, [liveGpsState]);

  // Efek fokus peta ke titik koordinat tertentu saat tombol "Fokus di Peta" ditekan
  useEffect(() => {
    if (!focusedCoordinates || !mapRef.current) return;
    mapRef.current.setView([focusedCoordinates.lat, focusedCoordinates.lng], 16, { animate: true });
  }, [focusedCoordinates]);

  // Render multi-marker live SE untuk Manager (SM / Admin)
  useEffect(() => {
    const layer = teamLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!teamLiveMarkers || teamLiveMarkers.length === 0) return;

    teamLiveMarkers.forEach((member) => {
      const isOnline = member.isOnline;
      const dotColor = isOnline ? '#16A34A' : '#64748B';
      const haloColor = isOnline ? 'rgba(22,163,74,0.3)' : 'transparent';
      const initials =
        member.avatarText ||
        member.name
          .split(' ')
          .slice(0, 2)
          .map((n) => n[0])
          .join('')
          .toUpperCase();

      const memberIcon = L.divIcon({
        className: 'team-live-marker',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
            <div style="position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;">
              ${
                isOnline
                  ? `<span style="position:absolute;width:38px;height:38px;border-radius:9999px;background:${haloColor};animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></span>`
                  : ''
              }
              <div style="position:relative;width:32px;height:32px;border-radius:9999px;background:#2C1E16;color:#FFFFFF;border:2.5px solid ${dotColor};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,0.35);">
                ${initials}
              </div>
              <span style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:9999px;background:${dotColor};border:2px solid #fff;"></span>
            </div>
            <div style="background:rgba(44,30,22,0.92);color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:6px;margin-top:2px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.2);">
              ${member.name.split(' ')[0]} (${member.role || 'SE'})
            </div>
          </div>
        `,
        iconSize: [60, 56],
        iconAnchor: [30, 24],
      });

      L.marker([member.lat, member.lng], { icon: memberIcon, zIndexOffset: isOnline ? 900 : 500 })
        .addTo(layer)
        .bindPopup(`
          <div style="font-family:sans-serif;padding:4px 2px;min-width:180px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="font-size:12px;font-weight:800;color:#2C1E16;">${member.name}</span>
              <span style="background:${isOnline ? '#DCFCE7' : '#F1F5F9'};color:${
                isOnline ? '#15803D' : '#475569'
              };font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;">${member.statusLabel}</span>
            </div>
            <div style="font-size:11px;color:#64748B;line-height:1.4;">
              <b>Zona:</b> ${member.zone}<br/>
              <b>Lokasi:</b> ${member.locationLabel}<br/>
              <b>Jarak ke Proyek:</b> ${member.distanceFromProjectKm.toFixed(2)} km<br/>
              <b>Update Terakhir:</b> ${member.lastUpdated}
            </div>
          </div>
        `);
    });
  }, [teamLiveMarkers]);

  // Render pin titik rute canvassing hari ini di peta radar
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    routeWaypoints.forEach((wp, idx) => {
      const bg = wp.visited ? '#16A34A' : '#D97706';
      const icon = L.divIcon({
        className: 'custom-route-pin',
        html: `<div style="background:${bg};color:#fff;border:2px solid #fff;border-radius:9999px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${idx + 1}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([wp.coordinates.lat, wp.coordinates.lng], { icon })
        .addTo(layer)
        .bindPopup(
          `<b>#${idx + 1} ${wp.name}</b><br/>${wp.category} (${wp.canvassingDurationMinutes} mnt)<br/>Status: ${
            wp.visited ? 'Sudah Dikunjungi' : 'Belum Dikunjungi'
          }`
        );
    });
  }, [routeWaypoints]);

  // Reverse Geocoding (OpenStreetMap Nominatim) dengan throttling perpindahan >= 60 meter
  const resolveStreetInfo = async (lat: number, lng: number, accuracy: number) => {
    const distToProjectKm = calculateDistanceKm(
      lat,
      lng,
      PROJECT_BASE_COORDS.lat,
      PROJECT_BASE_COORDS.lng
    );
    const nearestPoi = pois
      .map((p) => ({ p, dist: calculateDistanceKm(lat, lng, p.lat, p.lng) }))
      .sort((a, b) => a.dist - b.dist)[0];

    const nearestPoiLabel = nearestPoi
      ? `${formatDistance(nearestPoi.dist)} dari ${nearestPoi.p.name}`
      : `${formatDistance(distToProjectKm)} dari Proyek`;

    const last = lastGeocodeCoordsRef.current;
    const movedKm = last ? calculateDistanceKm(last.lat, last.lng, lat, lng) : 999;

    let streetAddress = liveGps?.streetAddress || 'Mendeteksi nama jalan...';
    let areaSummary = liveGps?.areaSummary || '';

    if (movedKm >= 0.06 || !liveGps?.streetAddress) {
      lastGeocodeCoordsRef.current = { lat, lng };
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data?.address || {};
          const road = addr.road || addr.pedestrian || addr.neighbourhood || addr.hamlet || '';
          const sub = addr.village || addr.suburb || addr.city_district || '';
          const city = addr.county || addr.city || addr.town || '';
          const parts = [road, sub, city].filter(Boolean);
          streetAddress =
            parts.length > 0
              ? parts.join(', ')
              : data?.display_name?.split(',').slice(0, 3).join(',') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          areaSummary = [sub, city].filter(Boolean).join(', ');
        }
      } catch {
        streetAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)} (${nearestPoiLabel})`;
      }
    }

    const nextState: LiveGpsState = {
      lat,
      lng,
      accuracy: Math.round(accuracy),
      streetAddress,
      areaSummary,
      nearestPoiLabel,
      distanceToProjectKm: distToProjectKm,
      updatedAt: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };

    setLiveGps(nextState);
    if (onLocationResolved) onLocationResolved(nextState);
  };

  // Update marker radar SE di peta Leaflet
  const updateRadarMarker = (lat: number, lng: number, accuracy: number) => {
    const map = mapRef.current;
    if (!map) return;

    const radarIcon = L.divIcon({
      className: 'se-live-radar-icon',
      html: `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <span style="position:absolute;width:44px;height:44px;border-radius:9999px;background:rgba(37,99,235,0.22);animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <span style="position:relative;width:16px;height:16px;border-radius:9999px;background:#2563EB;border:3px solid #FFFFFF;box-shadow:0 2px 8px rgba(37,99,235,0.6);"></span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!seMarkerRef.current) {
      seMarkerRef.current = L.marker([lat, lng], { icon: radarIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<b>${currentUserName || 'Posisi Anda Sekarang'} (${currentUserRole})</b><br/>Update radar live`);
    } else {
      seMarkerRef.current.setLatLng([lat, lng]);
    }

    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle([lat, lng], {
        radius: Math.min(accuracy, 300),
        color: '#2563EB',
        fillColor: '#3B82F6',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng([lat, lng]);
      accuracyCircleRef.current.setRadius(Math.min(accuracy, 300));
    }

    if (followMe) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15), { animate: true });
    }
  };

  const handleToggleTracking = () => {
    if (onToggleTracking) {
      onToggleTracking(!isTracking);
    } else {
      setInternalIsTracking(!internalIsTracking);
    }
  };

  // Live watchPosition lokal (hanya jika parent tidak menyediakan liveGpsState)
  useEffect(() => {
    if (!isTracking || liveGpsState) return;
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS / Geolocation.');
      if (onToggleTracking) onToggleTracking(false);
      else setInternalIsTracking(false);
      return;
    }

    setGpsError(null);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        updateRadarMarker(latitude, longitude, accuracy);
        void resolveStreetInfo(latitude, longitude, accuracy);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? 'Izin lokasi ditolak browser. Aktifkan izin lokasi (Location) di pengaturan browser Anda.'
            : 'Gagal membaca sinyal GPS. Pastikan GPS perangkat aktif atau coba di area terbuka.'
        );
        if (onToggleTracking) onToggleTracking(false);
        else setInternalIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking, followMe, liveGpsState, onToggleTracking]);

  const handleLocateOnce = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS / Geolocation.');
      return;
    }
    setIsLocatingOnce(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        updateRadarMarker(latitude, longitude, accuracy);
        void resolveStreetInfo(latitude, longitude, accuracy);
        setIsLocatingOnce(false);
      },
      () => {
        setGpsError('Tidak dapat mengambil lokasi saat ini. Pastikan izin lokasi browser aktif.');
        setIsLocatingOnce(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCenterToMe = () => {
    if (!mapRef.current || !liveGps) return;
    setFollowMe(true);
    mapRef.current.setView([liveGps.lat, liveGps.lng], 16, { animate: true });
  };

  return (
    <div className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm">
      {/* Header Kontrol Radar */}
      <div className="p-3.5 sm:p-4 bg-espresso text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
              isTracking ? 'bg-blue-500 animate-pulse' : 'bg-white/15'
            }`}
          >
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold">Radar Lokasi Live (GPS)</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isTracking
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {isTracking ? 'LIVE TRACKING' : 'STANDBY'}
              </span>
            </div>
            <p className="text-[11px] text-white/70">
              {teamLiveMarkers.length > 0
                ? `Memantau ${teamLiveMarkers.filter((m) => m.isOnline).length}/${teamLiveMarkers.length} tim SE aktif di lapangan · Update live WIB.`
                : 'Deteksi posisi real-time, nama jalan, landmark terdekat & target rute harian.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLocateOnce}
            disabled={isLocatingOnce}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white cursor-pointer"
          >
            {isLocatingOnce ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crosshair className="w-3.5 h-3.5" />
            )}
            Cek Titik Sekarang
          </button>
          <button
            type="button"
            onClick={handleToggleTracking}
            className={`min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              isTracking
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-terracotta hover:bg-amber-600 text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            {isTracking ? 'Matikan Radar' : 'Aktifkan Radar Lokasi'}
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Peta Leaflet */}
      <div className="relative">
        <div ref={mapContainerRef} className="w-full h-[260px] sm:h-[320px] z-0" />
        {liveGps && (
          <button
            type="button"
            onClick={handleCenterToMe}
            className="absolute bottom-3 right-3 z-[400] min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-warmborder shadow-md text-xs font-bold text-espresso hover:bg-sandstone cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-600" />
            Pusatkan ke Saya
          </button>
        )}
      </div>

      {/* Info Jalan & Dekat Apa */}
      <div className="p-3.5 sm:p-4 space-y-3 bg-sandstone/40 border-t border-warmborder">
        {liveGps ? (
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                  Posisi Anda Saat Ini (Update {liveGps.updatedAt} WIB)
                </p>
                <p className="text-sm font-bold text-espresso mt-0.5">{liveGps.streetAddress}</p>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Dekat dengan: {liveGps.nearestPoiLabel} · {formatDistance(liveGps.distanceToProjectKm)} dari Proyek
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono bg-white border border-warmborder px-2.5 py-1 rounded-lg text-espresso">
                  {liveGps.lat.toFixed(5)}, {liveGps.lng.toFixed(5)} (±{liveGps.accuracy} m)
                </span>
                <a
                  href={`https://www.google.com/maps?q=${liveGps.lat},${liveGps.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-warmborder text-xs font-semibold text-terracotta hover:bg-amber-50"
                >
                  <ExternalLink className="w-3 h-3" />
                  Google Maps
                </a>
              </div>
            </div>

            {/* Landmark / POI Terdekat & Target Rute */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-white border border-warmborder rounded-xl p-2.5">
                <p className="text-[11px] font-bold text-espresso mb-1.5">Landmark Terdekat di Sekitar Anda</p>
                <div className="space-y-1">
                  {nearbyContext.nearestPois.map((poi, idx) => (
                    <div key={`${poi.name}-${idx}`} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-espresso truncate">{poi.name}</span>
                      <span className="text-[11px] font-semibold text-warmmuted shrink-0">
                        {formatDistance(poi.distKm)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-warmborder rounded-xl p-2.5">
                <p className="text-[11px] font-bold text-espresso mb-1.5">
                  Target Rute Canvassing Terdekat
                </p>
                {nearbyContext.nearestWaypoints.length > 0 ? (
                  <div className="space-y-1">
                    {nearbyContext.nearestWaypoints.slice(0, 3).map(({ wp, distKm }) => (
                      <div key={`${wp.order}-${wp.name}`} className="flex items-center justify-between text-xs gap-2">
                        <span className="text-espresso truncate inline-flex items-center gap-1">
                          {wp.visited ? (
                            <Check className="size-3 text-emerald-600 shrink-0" />
                          ) : (
                            <MapPin className="size-3 text-terracotta shrink-0" />
                          )}
                          <span>{wp.name}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-terracotta shrink-0">
                          {formatDistance(distKm)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-warmmuted">Belum ada titik rute hari ini.</p>
                )}
              </div>
            </div>

            {onUseLocationForCheckin && (
              <button
                type="button"
                onClick={() => onUseLocationForCheckin(liveGps, nearbyContext.matchedWaypoint)}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                <MapPin className="w-4 h-4" />
                {nearbyContext.matchedWaypoint
                  ? `Gunakan Lokasi Ini untuk Check-in (${nearbyContext.matchedWaypoint.name})`
                  : 'Gunakan Lokasi Live Ini untuk Form Check-in Lapangan'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-warmmuted">
            Klik <strong>Aktifkan Radar Lokasi</strong> atau <strong>Cek Titik Sekarang</strong> untuk mendeteksi
            koordinat live, nama jalan, serta titik landmark &amp; rute canvassing terdekat di sekitar Anda.
          </p>
        )}
      </div>
    </div>
  );
};
