import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Cross,
  GraduationCap,
  Landmark,
  TrainFront,
  ShoppingBag,
  Coins,
  Trees,
  Utensils,
  Church,
} from 'lucide-react';
import osmPoisData from '../data/osm_poi.json';

export type PoiCategoryKey =
  | 'pendidikan'
  | 'tempat_ibadah'
  | 'kesehatan'
  | 'belanja'
  | 'transportasi'
  | 'layanan_publik'
  | 'keuangan'
  | 'rekreasi'
  | 'kuliner';

export interface POI {
  id?: string;
  osmId?: string;
  name: string;
  category: string;
  categoryKey?: PoiCategoryKey;
  categoryLabel?: string;
  subType?: string;
  lat: number;
  lng: number;
  approxDistance: string;
  whyInteresting: string;
  buyerHighlight: string;
  isStrategic?: boolean;
  strategicType?: string;
  strategicTier?: string;
  in1km?: boolean;
  osmTags?: Record<string, string>;
}

export interface ClusterData {
  id: 'nagoya' | 'osaka' | 'tokyo';
  name: string;
  shortName: string;
  type: string;
  units: string;
  sellingPoint: string;
  lat: number;
  lng: number;
  calloutDir: 'top-right' | 'bottom-left' | 'bottom-right';
}

export const POIS: POI[] = (osmPoisData as any[]).map((p) => ({
  id: p.id,
  osmId: p.osmId,
  name: p.name,
  category: p.categoryLabel || p.category,
  categoryKey: p.category as PoiCategoryKey,
  categoryLabel: p.categoryLabel,
  subType: p.subType,
  lat: p.lat,
  lng: p.lng,
  approxDistance:
    p.approxDistance.includes('berkendara') || p.approxDistance.includes('jalan kaki')
      ? p.approxDistance
      : `${p.approxDistance} berkendara`,
  whyInteresting: p.whyInteresting,
  buyerHighlight: p.buyerHighlight,
  isStrategic: p.isStrategic ?? true,
  strategicType: p.strategicType,
  strategicTier: p.strategicTier,
  osmTags: p.osmTags,
  in1km: p.in1km,
}));

export const CLUSTERS: ClusterData[] = [
  {
    id: 'nagoya',
    name: 'Cluster Nagoya',
    shortName: 'Nagoya',
    type: 'Diamond 75/90',
    units: '10 Unit',
    sellingPoint: 'Tipe terbesar dengan inner courtyard privat & high ceiling 3.8 m.',
    lat: -7.6738726546957565,
    lng: 110.84397833605674,
    calloutDir: 'bottom-right',
  },
  {
    id: 'osaka',
    name: 'Cluster Osaka',
    shortName: 'Osaka',
    type: 'Gold 60/72',
    units: '10 Unit',
    sellingPoint: 'Layout efisien untuk keluarga muda dengan akses one-gate system.',
    lat: -7.670296745443235,
    lng: 110.83933117795694,
    calloutDir: 'top-right',
  },
  {
    id: 'tokyo',
    name: 'Cluster Tokyo',
    shortName: 'Tokyo',
    type: 'Emerald 50/60',
    units: '10 Unit',
    sellingPoint: 'Unit entry-level bernuansa Jepang, cocok untuk hunian pertama & investasi.',
    lat: -7.670599344181913,
    lng: 110.83923919943206,
    calloutDir: 'bottom-left',
  },
];

export const PROJECT_CENTROID: [number, number] = [-7.67159, 110.84085];

export const RADIUS_OPTIONS = [
  { label: '500 m', meters: 500, zoom: 16 },
  { label: '1 km', meters: 1000, zoom: 15 },
  { label: '3 km', meters: 3000, zoom: 13 },
  { label: '5 km', meters: 5000, zoom: 13 },
  { label: '10 km', meters: 10000, zoom: 12 },
  { label: '25 km', meters: 25000, zoom: 11 },
];

export function PoiCategoryIcon({ category, className = 'size-4' }: { category: string; className?: string }) {
  const norm = (category || '').toLowerCase();
  if (norm.includes('medis') || norm.includes('sehat')) {
    return <Cross className={className} />;
  }
  if (norm.includes('didik') || norm.includes('sekolah') || norm.includes('kampus')) {
    return <GraduationCap className={className} />;
  }
  if (norm.includes('ibadah') || norm.includes('masjid') || norm.includes('gereja')) {
    return <Church className={className} />;
  }
  if (norm.includes('belanja') || norm.includes('pasar') || norm.includes('mall')) {
    return <ShoppingBag className={className} />;
  }
  if (norm.includes('transport') || norm.includes('stasiun') || norm.includes('terminal')) {
    return <TrainFront className={className} />;
  }
  if (norm.includes('uang') || norm.includes('bank') || norm.includes('atm')) {
    return <Coins className={className} />;
  }
  if (norm.includes('kreasi') || norm.includes('taman') || norm.includes('wisata')) {
    return <Trees className={className} />;
  }
  if (norm.includes('kuliner') || norm.includes('makan') || norm.includes('resto')) {
    return <Utensils className={className} />;
  }
  return <Landmark className={className} />;
}

export function getPoiSvgPath(category: string): string {
  const norm = (category || '').toLowerCase();
  if (norm.includes('medis') || norm.includes('sehat')) {
    return '<path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/>';
  }
  if (norm.includes('didik') || norm.includes('sekolah') || norm.includes('kampus')) {
    return '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>';
  }
  if (norm.includes('ibadah') || norm.includes('masjid') || norm.includes('gereja')) {
    return '<path d="M12 2v6m-3-3h6m-3 3a4 4 0 0 0-4 4v10h8V12a4 4 0 0 0-4-4zm-4 14H4v-6a4 4 0 0 1 4-4h1m7 14h4v-6a4 4 0 0 0-4-4h-1"/>';
  }
  if (norm.includes('belanja') || norm.includes('pasar') || norm.includes('mall')) {
    return '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>';
  }
  if (norm.includes('transport') || norm.includes('stasiun') || norm.includes('terminal')) {
    return '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>';
  }
  if (norm.includes('uang') || norm.includes('bank') || norm.includes('atm')) {
    return '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h2v4H7z"/>';
  }
  if (norm.includes('kreasi') || norm.includes('taman') || norm.includes('wisata')) {
    return '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7l-2.6-3.7a1 1 0 0 0-1.6 0L11 7.3a1 1 0 0 0 .8 1.7H12l-3 3.3a1 1 0 0 0 .7 1.7H12l-3 3.3a1 1 0 0 0 .7 1.7H12Z"/>';
  }
  if (norm.includes('kuliner') || norm.includes('makan') || norm.includes('resto')) {
    return '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M5 2v10a2 2 0 0 0 2 2h1v8"/><path d="M9 2v6"/>';
  }
  return '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>';
}

export const HOME_SVG_PATH =
  '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>';

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildClusterMarkerHtml(cluster: ClusterData, isActive: boolean): string {
  const bg = isActive ? '#b45309' : '#1c1917';
  const border = isActive ? '#b45309' : '#e2dbce';

  let labelPositionStyle = '';
  let leaderLine = '';

  if (cluster.calloutDir === 'top-right') {
    labelPositionStyle = 'left: 20px; bottom: 20px;';
    leaderLine =
      '<div style="position:absolute;left:12px;bottom:12px;width:10px;height:10px;border-left:1.5px solid #1c1917;border-top:1.5px solid #1c1917;opacity:0.55;pointer-events:none;"></div>';
  } else if (cluster.calloutDir === 'bottom-left') {
    labelPositionStyle = 'right: 20px; top: 20px;';
    leaderLine =
      '<div style="position:absolute;right:12px;top:12px;width:10px;height:10px;border-right:1.5px solid #1c1917;border-bottom:1.5px solid #1c1917;opacity:0.55;pointer-events:none;"></div>';
  } else {
    labelPositionStyle = 'left: 20px; top: 20px;';
    leaderLine =
      '<div style="position:absolute;left:12px;top:12px;width:10px;height:10px;border-left:1.5px solid #1c1917;border-bottom:1.5px solid #1c1917;opacity:0.55;pointer-events:none;"></div>';
  }

  return `
    <div style="position:relative;width:24px;height:24px;font-family:'Plus Jakarta Sans',sans-serif;">
      <div style="width:24px;height:24px;border-radius:6px;background:#b45309;color:#ffffff;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(28,25,23,0.35);display:flex;align-items:center;justify-content:center;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${HOME_SVG_PATH}</svg>
      </div>
      ${leaderLine}
      <div style="position:absolute;${labelPositionStyle}background:${bg};color:#f5f2eb;border:1px solid ${border};border-radius:6px;padding:4px 8px;white-space:nowrap;box-shadow:0 2px 6px rgba(28,25,23,0.18);display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;font-weight:700;letter-spacing:-0.01em;">${cluster.shortName}</span>
        <span style="font-size:10px;opacity:0.8;font-family:monospace;">${cluster.type.split(' ')[0]}</span>
      </div>
    </div>
  `;
}

function buildPoiPopupHtml(poi: POI): string {
  const svgInner = getPoiSvgPath(poi.category);
  const strategicBadge = poi.strategicType
    ? `<span style="font-size:9.5px;font-family:monospace;font-weight:700;padding:2px 6px;border-radius:999px;background:#1c1917;color:#facc15;margin-left:4px;">★ ${poi.strategicType.replace(/_/g, ' ')}</span>`
    : '';
  return `
    <div style="width:260px;max-width:76vw;padding:12px 14px;font-family:'Plus Jakarta Sans',sans-serif;color:#1c1917;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:28px;height:28px;border-radius:6px;background:#b45309;color:#ffffff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgInner}</svg>
        </div>
        <div style="min-width:0;">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
            <span style="font-size:10px;font-family:monospace;font-weight:700;text-transform:uppercase;color:#b45309;letter-spacing:0.04em;">${poi.category}</span>
            ${strategicBadge}
          </div>
          <div style="font-size:13px;font-weight:800;line-height:1.25;color:#1c1917;">${poi.name}</div>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;color:#1c1917;background:#f5f2eb;border:1px solid #e2dbce;border-radius:4px;padding:4px 8px;margin-bottom:8px;font-family:monospace;">
        Jarak: ${poi.approxDistance}
      </div>
      <p style="font-size:12px;line-height:1.45;color:#57534e;margin:0 0 8px 0;">
        ${poi.whyInteresting}
      </p>
      <div style="font-size:11.5px;line-height:1.4;color:#3f6212;font-weight:600;border-top:1px solid #e2dbce;padding-top:7px;">
        ${poi.buyerHighlight}
      </div>
    </div>
  `;
}

export const InteractiveMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterLayerRef = useRef<L.LayerGroup | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const poiMarkersRef = useRef<Record<string, L.Marker>>({});

  const [selectedRadius] = useState<number>(5000);
  const [activeClusterId, setActiveClusterId] = useState<'all' | ClusterData['id']>('all');
  const [activePoi, setActivePoi] = useState<POI | null>(null);

  const activeCluster = useMemo(
    () => CLUSTERS.find((c) => c.id === activeClusterId) ?? null,
    [activeClusterId]
  );

  const originPoint: [number, number] = useMemo(
    () => (activeCluster ? [activeCluster.lat, activeCluster.lng] : PROJECT_CENTROID),
    [activeCluster]
  );

  const poisWithRadius = useMemo(() => {
    return POIS.map((p) => {
      const distMeters = haversineMeters(originPoint[0], originPoint[1], p.lat, p.lng);
      return {
        ...p,
        distMeters,
        inRadius: distMeters <= selectedRadius,
      };
    }).sort((a, b) => {
      if (a.inRadius !== b.inRadius) return a.inRadius ? -1 : 1;
      return a.distMeters - b.distMeters;
    });
  }, [originPoint, selectedRadius]);

  const inRadiusCount = poisWithRadius.filter((p) => p.inRadius).length;
  const outsideCount = POIS.length - inRadiusCount;

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: PROJECT_CENTROID,
      zoom: 14,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      className: 'editorial-map-tiles',
    }).addTo(map);

    overlayLayerRef.current = L.layerGroup().addTo(map);
    clusterLayerRef.current = L.layerGroup().addTo(map);
    poiLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Cluster Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = clusterLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    CLUSTERS.forEach((c) => {
      const isFocused = activeClusterId === c.id;
      const markerHtml = buildClusterMarkerHtml(c, isFocused);

      const customIcon = L.divIcon({
        className: 'cluster-marker-div',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([c.lat, c.lng], { icon: customIcon }).addTo(layer);
      marker.on('click', () => {
        setActiveClusterId(c.id);
        setActivePoi(null);
      });
    });
  }, [activeClusterId]);

  // Render POI Pins
  useEffect(() => {
    const layer = poiLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    poiMarkersRef.current = {};

    poisWithRadius.forEach((p) => {
      const isSelected = activePoi?.name === p.name;
      const bg = isSelected ? '#b45309' : p.inRadius ? '#1c1917' : '#78716c';
      const opacity = isSelected || p.inRadius ? '1' : '0.65';
      const svgInner = getPoiSvgPath(p.category);

      const poiIcon = L.divIcon({
        className: 'custom-poi-icon-pin',
        html: `
          <div style="opacity:${opacity};width:30px;height:30px;border-radius:6px;background:${bg};color:#ffffff;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(28,25,23,0.28);display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgInner}</svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([p.lat, p.lng], {
        icon: poiIcon,
        zIndexOffset: isSelected ? 850 : 300,
      }).addTo(layer);

      marker.bindPopup(buildPoiPopupHtml(p), {
        maxWidth: 270,
        autoPan: true,
        autoPanPadding: [24, 24],
        offset: [0, -10],
      });

      marker.on('click', () => {
        setActivePoi(p);
      });

      poiMarkersRef.current[p.name] = marker;
    });

    if (activePoi && poiMarkersRef.current[activePoi.name]) {
      poiMarkersRef.current[activePoi.name].openPopup();
    }
  }, [poisWithRadius, activePoi]);

  // Render Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlay = overlayLayerRef.current;
    if (!map || !overlay) return;

    overlay.clearLayers();

    L.circle(originPoint, {
      radius: selectedRadius,
      color: '#b45309',
      fillColor: '#b45309',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '5, 5',
    }).addTo(overlay);

    if (activePoi) {
      L.polyline([originPoint, [activePoi.lat, activePoi.lng]], {
        color: '#b45309',
        weight: 2,
        dashArray: '4, 4',
        opacity: 0.8,
      }).addTo(overlay);
    }
  }, [originPoint, selectedRadius, activePoi]);

  return (
    <div className="rounded-2xl border border-warmborder bg-surface shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-warmborder bg-sandstone/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-terracotta">
            Peta Fasilitas Terverifikasi (OpenStreetMap)
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-espresso mt-0.5">
            The Park Townhouse Sukoharjo
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-warmmuted">
            {inRadiusCount} di dalam radius {(selectedRadius / 1000).toFixed(selectedRadius < 1000 ? 1 : 0)} km, {outsideCount} di luar radius
          </span>
        </div>
      </div>
      <div ref={mapContainerRef} className="w-full h-[450px]" />
    </div>
  );
};
