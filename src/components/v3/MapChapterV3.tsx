import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import { Compass, Filter, Home, MapPin, Navigation, X } from 'lucide-react';
import {
  CLUSTERS,
  HOME_SVG_PATH,
  POIS,
  PROJECT_CENTROID,
  RADIUS_OPTIONS,
  PoiCategoryIcon,
  getPoiSvgPath,
  haversineMeters,
  type ClusterData,
  type POI,
} from '../InteractiveMap';

gsap.registerPlugin(ScrollTrigger);

function parseKm(approxDistance: string): number {
  const m = approxDistance.match(/([\d.]+)\s*km/i);
  return m ? parseFloat(m[1]) : 5;
}

export interface CategoryFilterOption {
  id: 'all' | POI['category'];
  label: string;
  shortLabel: string;
}

export const CATEGORY_OPTIONS: CategoryFilterOption[] = [
  { id: 'all', label: 'Semua Fasilitas', shortLabel: 'Semua' },
  { id: 'Fasilitas Medis', label: 'Rumah Sakit & Medis', shortLabel: 'Rumah Sakit' },
  { id: 'Pendidikan', label: 'Sekolah & Kampus', shortLabel: 'Sekolah' },
  { id: 'Pusat Belanja', label: 'Pusat Belanja & Pasar', shortLabel: 'Belanja' },
  { id: 'Transportasi', label: 'Transportasi & Stasiun', shortLabel: 'Transport' },
  { id: 'Pemerintahan', label: 'Pemerintahan & Sipil', shortLabel: 'Pemerintahan' },
];

const CATEGORY_STYLES: Record<
  POI['category'],
  { badgeBg: string; badgeText: string; pinBg: string; iconColor: string }
> = {
  'Fasilitas Medis': {
    badgeBg: '#FEE2E2',
    badgeText: '#991B1B',
    pinBg: '#DC2626',
    iconColor: '#FFFFFF',
  },
  Pendidikan: {
    badgeBg: '#DBEAFE',
    badgeText: '#1E40AF',
    pinBg: '#2563EB',
    iconColor: '#FFFFFF',
  },
  Pemerintahan: {
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
    pinBg: '#059669',
    iconColor: '#FFFFFF',
  },
  Transportasi: {
    badgeBg: '#CCFBF1',
    badgeText: '#115E59',
    pinBg: '#0D9488',
    iconColor: '#FFFFFF',
  },
  'Pusat Belanja': {
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    pinBg: '#D97706',
    iconColor: '#FFFFFF',
  },
};

function buildPoiPopupHtml(poi: POI, km: number, inRadius: boolean): string {
  const catStyle = CATEGORY_STYLES[poi.category];
  const svgPath = getPoiSvgPath(poi.category);
  const statusBadge = inRadius
    ? `<span style="font-size:10px;font-family:monospace;font-weight:700;padding:2px 7px;border-radius:999px;background:#EAF4D3;color:#0B3D2E;">Dalam radius</span>`
    : `<span style="font-size:10px;font-family:monospace;font-weight:700;padding:2px 7px;border-radius:999px;background:#F3F4F6;color:#4B5563;border:1px solid #E5E7EB;">Di luar radius</span>`;

  return `
    <div style="font-family:'Plus Jakarta Sans',sans-serif;color:#0B3D2E;padding:2px 0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:30px;height:30px;border-radius:999px;background:${catStyle.pinBg};display:grid;place-items:center;flex-shrink:0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
        </div>
        <div style="min-width:0;flex:1;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-size:9.5px;font-family:monospace;font-weight:800;text-transform:uppercase;color:${catStyle.pinBg};">${poi.category}</span>
            ${statusBadge}
          </div>
          <h4 style="font-size:13.5px;font-weight:800;line-height:1.25;color:#0B3D2E;margin:2px 0 0 0;">${poi.name}</h4>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;color:#0B3D2E;background:#F6FAF7;border:1px solid #CFE1D5;border-radius:8px;padding:4px 8px;margin-bottom:8px;font-family:monospace;display:flex;align-items:center;justify-content:space-between;">
        <span>${poi.approxDistance}</span>
        <span style="color:#2F9E5B;">(${km.toFixed(1)} km)</span>
      </div>
      <p style="font-size:11.5px;line-height:1.45;color:#3B5E50;margin:0 0 8px 0;">
        ${poi.whyInteresting}
      </p>
      <div style="font-size:11px;line-height:1.4;color:#0B3D2E;font-weight:600;border-top:1px solid #E4F1E8;padding-top:7px;background:#F6FAF7;border-radius:6px;padding:6px 8px;">
        <span style="color:#2F9E5B;font-weight:800;">Nilai Jual:</span> ${poi.buyerHighlight.replace(/^Nilai jual:\s*/i, '')}
      </div>
    </div>
  `;
}

function buildClusterPopupHtml(c: ClusterData): string {
  return `
    <div style="font-family:'Plus Jakarta Sans',sans-serif;color:#0B3D2E;padding:2px 0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:30px;height:30px;border-radius:999px;background:#0B3D2E;border:2px solid #C6F432;display:grid;place-items:center;flex-shrink:0;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${HOME_SVG_PATH}</svg>
        </div>
        <div style="min-width:0;flex:1;">
          <span style="font-size:9.5px;font-family:monospace;font-weight:800;text-transform:uppercase;color:#2F9E5B;">${c.type}</span>
          <h4 style="font-size:13.5px;font-weight:800;line-height:1.25;color:#0B3D2E;margin:2px 0 0 0;">${c.name}</h4>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;color:#0B3D2E;background:#F6FAF7;border:1px solid #CFE1D5;border-radius:8px;padding:4px 8px;margin-bottom:8px;font-family:monospace;display:flex;justify-content:space-between;">
        <span>Total: ${c.units}</span>
        <span style="color:#2F9E5B;">Tempo 24 Bln</span>
      </div>
      <p style="font-size:11.5px;line-height:1.45;color:#3B5E50;margin:0 0 6px 0;">
        ${c.sellingPoint}
      </p>
      <div style="font-size:10.5px;color:#0B3D2E;font-weight:700;border-top:1px solid #E4F1E8;padding-top:6px;">
        Legalitas: SHM Pecah &amp; PBG Lengkap
      </div>
    </div>
  `;
}

function getHeadlineCounterText(
  selectedCategory: 'all' | POI['category'],
  inRadiusCount: number,
  outsideCount: number,
  radiusLabel: string
): string {
  if (selectedCategory === 'all') {
    return `${inRadiusCount} dalam radius ${radiusLabel} · ${outsideCount} di luar radius`;
  }
  const categoryNames: Record<POI['category'], string> = {
    'Fasilitas Medis': 'rumah sakit & medis',
    Pendidikan: 'sekolah & kampus',
    'Pusat Belanja': 'pusat belanja & pasar',
    Transportasi: 'titik transportasi',
    Pemerintahan: 'fasilitas publik/sipil',
  };
  return `${inRadiusCount} ${categoryNames[selectedCategory]} dalam radius ${radiusLabel} · ${outsideCount} di luar radius`;
}

export const MapChapterV3: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const poiMarkersRef = useRef<Record<string, L.Marker>>({});
  const hasArrivedRef = useRef<boolean>(false);

  const [selectedRadius, setSelectedRadius] = useState<number>(5000);
  const [activeClusterId, setActiveClusterId] = useState<'all' | ClusterData['id']>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | POI['category']>('all');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterData | null>(null);
  const [wheelUnlocked, setWheelUnlocked] = useState<boolean>(false);

  const originPoint = useMemo<[number, number]>(() => {
    if (activeClusterId === 'all') return PROJECT_CENTROID;
    const found = CLUSTERS.find((c) => c.id === activeClusterId);
    return found ? [found.lat, found.lng] : PROJECT_CENTROID;
  }, [activeClusterId]);

  // Facilities with dynamic distance calculation, sorted with in-radius first, then ascending distance
  const poisWithDistance = useMemo(() => {
    return POIS.map((p) => {
      const meters = haversineMeters(originPoint[0], originPoint[1], p.lat, p.lng);
      const km = parseKm(p.approxDistance);
      return {
        poi: p,
        meters,
        km,
        inRadius: meters <= selectedRadius,
      };
    }).sort((a, b) => {
      // Facilities within radius first!
      if (a.inRadius !== b.inRadius) {
        return a.inRadius ? -1 : 1;
      }
      return a.meters - b.meters;
    });
  }, [originPoint, selectedRadius]);

  // Filtered by active category (Rumah Sakit, Sekolah, dll)
  const filteredPois = useMemo(() => {
    if (selectedCategory === 'all') return poisWithDistance;
    return poisWithDistance.filter((item) => item.poi.category === selectedCategory);
  }, [poisWithDistance, selectedCategory]);

  const inRadiusCount = useMemo(
    () => filteredPois.filter((item) => item.inRadius).length,
    [filteredPois]
  );

  const outsideCount = useMemo(
    () => filteredPois.length - inRadiusCount,
    [filteredPois, inRadiusCount]
  );

  const activeRadiusObj = useMemo(
    () => RADIUS_OPTIONS.find((r) => r.meters === selectedRadius) ?? RADIUS_OPTIONS[3],
    [selectedRadius]
  );

  // 1. Initialize Leaflet Map with OpenStreetMap clean tiles & immediate mobile touch drag
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const map = L.map(mapElRef.current, {
      center: PROJECT_CENTROID,
      zoom: prefersReduced ? 13 : 11,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
      tapHold: true,
      attributionControl: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'v3-positron-tiles',
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    // Desktop click-to-unlock wheel zoom, mouseleave re-locks so page scroll stays effortless
    map.on('click', () => {
      if (window.innerWidth >= 640) {
        map.scrollWheelZoom.enable();
        setWheelUnlocked(true);
      }
    });

    const container = map.getContainer();
    const handleLeave = () => {
      map.scrollWheelZoom.disable();
      setWheelUnlocked(false);
    };
    container.addEventListener('mouseleave', handleLeave);

    // Arrival flyTo choreography once when section scrolls into view
    let trigger: ScrollTrigger | null = null;
    if (!prefersReduced && sectionRef.current) {
      trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 72%',
        once: true,
        onEnter: () => {
          if (!hasArrivedRef.current && mapRef.current) {
            hasArrivedRef.current = true;
            mapRef.current.flyTo(PROJECT_CENTROID, 13, {
              duration: 1.35,
              easeLinearity: 0.25,
            });
          }
        },
      });
    } else {
      hasArrivedRef.current = true;
    }

    return () => {
      trigger?.kill();
      container.removeEventListener('mouseleave', handleLeave);
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // 2. Smooth flyTo when radius or cluster changes (after initial arrival)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasArrivedRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targetZoom = activeClusterId === 'all' ? activeRadiusObj.zoom : Math.max(activeRadiusObj.zoom, 14);
    if (prefersReduced) {
      map.setView(originPoint, targetZoom, { animate: false });
    } else {
      map.flyTo(originPoint, targetZoom, { duration: 0.75 });
    }
  }, [originPoint, activeRadiusObj.zoom, activeClusterId]);

  // 3. Render concentric rings, project beacon, clusters, POIs, and optional dashed route
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerGroupRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    poiMarkersRef.current = {};

    // Concentric subtle reference rings
    RADIUS_OPTIONS.forEach((opt) => {
      if (opt.meters === selectedRadius) return;
      L.circle(originPoint, {
        radius: opt.meters,
        color: '#8BB89C',
        weight: 1,
        opacity: 0.35,
        dashArray: '4 6',
        fill: false,
        interactive: false,
      }).addTo(layer);
    });

    // Active emerald radius ring with subtle chartreuse wash
    L.circle(originPoint, {
      radius: selectedRadius,
      color: '#2F9E5B',
      weight: 2.2,
      opacity: 0.9,
      fillColor: '#C6F432',
      fillOpacity: 0.08,
      interactive: false,
    }).addTo(layer);

    // Project Centroid Beacon (sole pulsing element — crisp medium scale)
    const hubIcon = L.divIcon({
      className: '',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      html: `
        <div style="position:relative;width:44px;height:44px;display:grid;place-items:center;">
          <span class="v3-hub-pulse-ring" style="position:absolute;inset:0;border-radius:999px;background:#C6F432;border:2px solid #2F9E5B;"></span>
          <span style="position:relative;width:30px;height:30px;border-radius:999px;background:#0B3D2E;border:2.5px solid #C6F432;display:grid;place-items:center;box-shadow:0 6px 16px rgba(11,61,46,0.34);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${HOME_SVG_PATH}</svg>
          </span>
        </div>
      `,
    });
    L.marker(PROJECT_CENTROID, { icon: hubIcon, zIndexOffset: 500 }).addTo(layer);

    // Cluster markers (balanced 26px house pin + crisp pill label with cluster type)
    CLUSTERS.forEach((c) => {
      const isFocused = activeClusterId === c.id;
      const offsetY = c.id === 'tokyo' ? 10 : c.id === 'osaka' ? -30 : 6;
      const offsetX = c.id === 'tokyo' ? -134 : 28;
      const pinBg = isFocused ? '#C6F432' : '#0B3D2E';
      const pinStroke = isFocused ? '#0B3D2E' : '#FFFFFF';
      const clusterIcon = L.divIcon({
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
        html: `
          <div style="position:relative;width:26px;height:26px;cursor:pointer;">
            <span style="display:grid;place-items:center;width:26px;height:26px;border-radius:999px;background:${pinBg};border:2px solid #FFFFFF;box-shadow:0 4px 12px rgba(11,61,46,0.28);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${pinStroke}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${HOME_SVG_PATH}</svg>
            </span>
            <div style="position:absolute;left:${offsetX}px;top:${offsetY}px;white-space:nowrap;padding:4px 10px;border-radius:999px;background:${isFocused ? '#0B3D2E' : '#FFFFFF'};color:${isFocused ? '#C6F432' : '#0B3D2E'};border:1.5px solid ${isFocused ? '#0B3D2E' : '#2F9E5B'};font-size:12px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 6px 16px rgba(11,61,46,0.16);display:flex;align-items:center;gap:5px;">
              <span style="width:7px;height:7px;border-radius:999px;background:${isFocused ? '#C6F432' : '#2F9E5B'};"></span>
              <span>${c.shortName}</span>
              <span style="font-size:10px;font-weight:600;opacity:0.75;">${c.type.split(' ')[0]}</span>
            </div>
          </div>
        `,
      });

      const marker = L.marker([c.lat, c.lng], { icon: clusterIcon, zIndexOffset: 400 }).addTo(layer);

      marker.bindPopup(buildClusterPopupHtml(c), {
        offset: [0, -14],
        maxWidth: 270,
        className: 'v3-cluster-popup',
      });

      marker.on('click', () => {
        setSelectedPoi(null);
        setActiveClusterId(c.id);
        setSelectedCluster(c);
      });
    });

    // Dashed route line if user selected a POI
    if (selectedPoi) {
      L.polyline([originPoint, [selectedPoi.lat, selectedPoi.lng]], {
        color: '#0B3D2E',
        weight: 2.5,
        dashArray: '7 7',
        opacity: 0.85,
      }).addTo(layer);
    }

    // Visible POIs: Filtered by active category and in active radius, PLUS explicitly selected facility
    const visiblePoiItems = filteredPois.filter(
      (item) => item.inRadius || item.poi.name === selectedPoi?.name
    );

    // Facility Markers (distinct category pins + tooltip on hover + rich popup on click/tap)
    visiblePoiItems.forEach(({ poi, km, inRadius }) => {
      const isSelected = selectedPoi?.name === poi.name;
      const catStyle = CATEGORY_STYLES[poi.category];

      const poiIcon = L.divIcon({
        className: 'v3-facility-divicon',
        iconSize: [34, 42],
        iconAnchor: [17, 40],
        popupAnchor: [0, -38],
        html: `
          <div style="position:relative;width:34px;height:42px;display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 10px rgba(11,61,46,0.3));transition:transform 0.2s ease;${isSelected ? 'transform:scale(1.18);' : ''}">
            <div style="width:34px;height:34px;border-radius:999px;background:${catStyle.pinBg};border:2.5px solid ${isSelected ? '#C6F432' : '#FFFFFF'};display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,0.22);">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${getPoiSvgPath(poi.category)}</svg>
            </div>
            <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${catStyle.pinBg};margin-top:-1px;"></div>
          </div>
        `,
      });

      const marker = L.marker([poi.lat, poi.lng], {
        icon: poiIcon,
        zIndexOffset: isSelected ? 650 : inRadius ? 350 : 250,
        title: poi.name,
      }).addTo(layer);

      marker.bindTooltip(poi.name, {
        direction: 'top',
        offset: [0, -38],
        className: 'v3-poi-tooltip',
      });

      marker.bindPopup(buildPoiPopupHtml(poi, km, inRadius), {
        offset: [0, -36],
        maxWidth: 280,
        minWidth: 240,
        className: 'v3-poi-popup',
        autoPan: true,
      });

      marker.on('click', () => {
        setSelectedCluster(null);
        setSelectedPoi(poi);
        map.panTo([poi.lat, poi.lng], { animate: true, duration: 0.55 });
      });

      poiMarkersRef.current[poi.name] = marker;

      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 60);
      }
    });
  }, [originPoint, selectedRadius, activeClusterId, selectedPoi, filteredPois]);

  const handleSelectPoiFromList = (poi: POI) => {
    setSelectedCluster(null);
    setSelectedPoi(poi);
    if (mapRef.current) {
      mapRef.current.flyTo([poi.lat, poi.lng], Math.max(activeRadiusObj.zoom, 13), { duration: 0.65 });
    }
    // Open marker popup automatically after flyTo
    setTimeout(() => {
      const m = poiMarkersRef.current[poi.name];
      if (m) {
        m.openPopup();
      }
    }, 280);
  };

  const handleSelectCluster = (clusterId: 'all' | ClusterData['id']) => {
    setActiveClusterId(clusterId);
    setSelectedPoi(null);
    if (clusterId === 'all') {
      setSelectedCluster(null);
    } else {
      const found = CLUSTERS.find((c) => c.id === clusterId) ?? null;
      setSelectedCluster(found);
    }
  };

  // Shared Panel Content (used as floating left panel on desktop, below-map panel on tablet/mobile)
  const renderControlPanel = (compact = false) => (
    <div className={`bg-white border border-[#CFE1D5] rounded-2xl ${compact ? 'p-4 sm:p-5' : 'p-5 shadow-[0_24px_60px_-24px_rgba(11,61,46,0.22)]'} flex flex-col gap-4`}>
      {/* Summary Header: Dynamic counter from active data, category, and radius */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E4F1E8]">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2F9E5B]">
            Analisis Radius Aktif
          </span>
          <p className="font-display-v3 font-extrabold text-base sm:text-lg text-[#0B3D2E] mt-0.5 tabular-nums leading-snug">
            {getHeadlineCounterText(selectedCategory, inRadiusCount, outsideCount, activeRadiusObj.label)}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#C6F432] text-[#0B3D2E] font-mono text-xs font-bold shrink-0">
          {activeRadiusObj.label}
        </span>
      </div>

      {/* Category Filter Pills (Pilihan Rumah Sakit, Sekolah, dll) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-bold uppercase text-[#3B5E50]">
            Pilihan Kategori Fasilitas
          </span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-[10px] font-mono font-bold text-[#2F9E5B] hover:underline cursor-pointer"
            >
              Reset ke Semua
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {CATEGORY_OPTIONS.map((cat) => {
            const active = selectedCategory === cat.id;
            const countInRadius = poisWithDistance.filter(
              (p) => (cat.id === 'all' || p.poi.category === cat.id) && p.inRadius
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (selectedPoi && selectedPoi.category !== cat.id && cat.id !== 'all') {
                    setSelectedPoi(null);
                  }
                }}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between gap-1.5 ${
                  active
                    ? 'bg-[#0B3D2E] text-[#C6F432] border-[#0B3D2E] shadow-xs'
                    : 'bg-[#F6FAF7] text-[#0B3D2E] border-[#CFE1D5] hover:border-[#2F9E5B]'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  {cat.id === 'all' ? (
                    <Compass className="size-3.5 shrink-0 text-[#2F9E5B]" />
                  ) : (
                    <PoiCategoryIcon category={cat.id} className="size-3.5 shrink-0" />
                  )}
                  <span className="truncate">{cat.shortLabel}</span>
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                    active
                      ? 'bg-[#C6F432] text-[#0B3D2E] font-extrabold'
                      : 'bg-white text-[#3B5E50] border border-[#CFE1D5]'
                  }`}
                >
                  {countInRadius}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Radius 3x2 Grid (zero horizontal scroll on any screen) */}
      <div>
        <span className="text-[11px] font-mono font-bold uppercase text-[#3B5E50] block mb-2">
          Radius Pencarian
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {RADIUS_OPTIONS.map((opt) => {
            const active = selectedRadius === opt.meters;
            return (
              <button
                key={opt.meters}
                onClick={() => setSelectedRadius(opt.meters)}
                className={`min-h-[40px] rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  active
                    ? 'bg-[#0B3D2E] text-[#C6F432] border-[#0B3D2E]'
                    : 'bg-[#F6FAF7] text-[#0B3D2E] border-[#CFE1D5] hover:border-[#2F9E5B]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cluster Focus Pills */}
      <div>
        <span className="text-[11px] font-mono font-bold uppercase text-[#3B5E50] block mb-2">
          Fokus Klaster
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleSelectCluster('all')}
            className={`min-h-[40px] px-2.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
              activeClusterId === 'all'
                ? 'bg-[#EAF4D3] text-[#0B3D2E] border-[#0B3D2E]'
                : 'bg-white text-[#3B5E50] border-[#CFE1D5] hover:text-[#0B3D2E]'
            }`}
          >
            Semua (3)
          </button>
          {CLUSTERS.map((c) => {
            const active = activeClusterId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCluster(c.id)}
                className={`min-h-[40px] px-2.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
                  active
                    ? 'bg-[#EAF4D3] text-[#0B3D2E] border-[#0B3D2E]'
                    : 'bg-white text-[#3B5E50] border-[#CFE1D5] hover:text-[#0B3D2E]'
                }`}
              >
                {c.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance-Bar Facility List: In-radius first, labeled accordingly */}
      <div className="pt-1 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-bold uppercase text-[#3B5E50]">
            Daftar Fasilitas ({filteredPois.length})
          </span>
          {!compact && (
            <span className="text-[10px] font-mono text-[#3B5E50]/75">
              Hover &amp; scroll
            </span>
          )}
        </div>
        <div
          data-lenis-prevent
          className={`space-y-2 ${compact ? '' : 'max-h-[220px] overflow-y-auto overscroll-contain no-scrollbar pb-5'}`}
        >
          {filteredPois.map(({ poi, km, inRadius }) => {
            const isSel = selectedPoi?.name === poi.name;
            const barWidth = Math.min(100, Math.max(18, (km / 10) * 100));
            const catStyle = CATEGORY_STYLES[poi.category];
            return (
              <button
                key={poi.name}
                onClick={() => handleSelectPoiFromList(poi)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#EAF4D3] border-[#0B3D2E] shadow-xs'
                    : inRadius
                    ? 'bg-[#F6FAF7] border-[#CFE1D5] hover:border-[#2F9E5B]'
                    : 'bg-white border-[#E4F1E8] opacity-75 hover:opacity-100 hover:border-[#CFE1D5]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-6 rounded-full grid place-items-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: catStyle.pinBg }}
                    >
                      <PoiCategoryIcon category={poi.category} className="size-3.5" />
                    </span>
                    <span className="text-xs font-bold text-[#0B3D2E] truncate">
                      {poi.name}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        inRadius
                          ? 'bg-[#EAF4D3] text-[#0B3D2E]'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}
                    >
                      {inRadius ? 'Dalam radius' : 'Di luar radius'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#2F9E5B] tabular-nums">
                      {km.toFixed(1)} km
                    </span>
                  </div>
                </div>

                {/* Proportional Distance Bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-[#E4F1E8] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isSel ? 'bg-[#0B3D2E]' : inRadius ? 'bg-[#2F9E5B]' : 'bg-[#9FB8A8]'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#3B5E50] mt-1">{poi.approxDistance}</p>
              </button>
            );
          })}
        </div>
        {!compact && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-white to-transparent"
          />
        )}
      </div>
    </div>
  );

  return (
    <section
      id="peta-demo"
      ref={sectionRef}
      className="relative isolate z-0 bg-[#F6FAF7] border-b border-[#CFE1D5] py-14 sm:py-20 scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Chapter Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 sm:mb-6">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-[#2F9E5B] font-bold">
              Bab 04 · Peta Spasial &amp; Radius Riset
            </p>
            <h2 className="font-display-v3 text-v3-chapter font-extrabold text-[#0B3D2E] mt-1.5">
              Peta jadi pusat keputusan lokasi.
            </h2>
            <p className="text-sm sm:text-base text-[#3B5E50] mt-2 leading-relaxed">
              Pilih kategori fasilitas (rumah sakit, sekolah, belanja, dll) dan radius untuk melihat garis jarak dan nilai jual langsung di atas peta The Park Townhouse Sukoharjo.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#CFE1D5] text-xs font-semibold text-[#0B3D2E] self-start">
            <Compass className="size-4 text-[#2F9E5B]" />
            <span>3 Klaster · {POIS.length} Fasilitas Terverifikasi</span>
          </div>
        </div>

        {/* Quick Category Filter Bar above Map */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
          <span className="text-xs font-mono font-bold text-[#3B5E50] uppercase shrink-0 mr-1 flex items-center gap-1">
            <Filter className="size-3.5 text-[#2F9E5B]" />
            Kategori:
          </span>
          {CATEGORY_OPTIONS.map((cat) => {
            const active = selectedCategory === cat.id;
            const countInRadius = poisWithDistance.filter(
              (p) => (cat.id === 'all' || p.poi.category === cat.id) && p.inRadius
            ).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (selectedPoi && selectedPoi.category !== cat.id && cat.id !== 'all') {
                    setSelectedPoi(null);
                  }
                }}
                className={`min-h-[38px] px-3 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                  active
                    ? 'bg-[#0B3D2E] text-[#C6F432] border-[#0B3D2E] shadow-sm'
                    : 'bg-white text-[#3B5E50] border-[#CFE1D5] hover:border-[#2F9E5B] hover:text-[#0B3D2E]'
                }`}
              >
                {cat.id === 'all' ? (
                  <Compass className="size-3.5 text-[#2F9E5B]" />
                ) : (
                  <PoiCategoryIcon category={cat.id} className="size-3.5" />
                )}
                <span>{cat.shortLabel}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-[#C6F432] text-[#0B3D2E] font-black' : 'bg-[#EAF4D3] text-[#0B3D2E]'
                  }`}
                >
                  {countInRadius}
                </span>
              </button>
            );
          })}
        </div>

        {/* Full-Bleed Map Stage with Isolated Stacking Context (isolate z-0) so navbar (z-50) stays on top */}
        <div className="relative isolate z-0 rounded-3xl overflow-hidden border border-[#CFE1D5] bg-white shadow-[0_28px_70px_-30px_rgba(11,61,46,0.22)]">
          {/* Map Canvas — data-lenis-prevent ensures mobile touch drag & pinch-zoom work immediately */}
          <div
            ref={mapElRef}
            data-lenis-prevent
            className="w-full h-[56dvh] min-h-[380px] sm:h-[62dvh] lg:h-[78dvh] lg:min-h-[600px] lg:max-h-[720px] relative z-0 touch-none"
          />

          {/* DESKTOP FLOATING SOLID WHITE CONTROL PANEL (lg:block, z-20 within isolated map wrapper) */}
          <div className="hidden lg:block absolute top-5 left-5 z-20 w-[350px]">
            {renderControlPanel(false)}
          </div>

          {/* DESKTOP SCROLL-ZOOM COMFORT HINT (hidden on mobile, z-20) */}
          <div className="hidden sm:flex absolute bottom-4 right-4 z-20 items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 border border-[#CFE1D5] text-[11px] font-mono font-semibold text-[#0B3D2E] shadow-sm pointer-events-none">
            <span className={`size-2 rounded-full ${wheelUnlocked ? 'bg-[#2F9E5B]' : 'bg-[#9FB8A8]'}`} />
            <span>
              {wheelUnlocked ? 'Zoom scroll aktif · keluar peta untuk scroll halaman' : 'Klik peta untuk zoom dengan scroll'}
            </span>
          </div>

          {/* COMPACT FLOATING DETAIL CARD — POI (z-30 inside isolated map wrapper) */}
          {selectedPoi && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:left-auto sm:right-4 sm:bottom-14 sm:w-[340px] z-30 rounded-xl sm:rounded-2xl bg-white/98 border-2 border-[#0B3D2E] p-2.5 sm:p-4 shadow-[0_16px_40px_-14px_rgba(11,61,46,0.3)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-7 sm:size-8 rounded-full grid place-items-center text-white shrink-0"
                    style={{ backgroundColor: CATEGORY_STYLES[selectedPoi.category].pinBg }}
                  >
                    <PoiCategoryIcon category={selectedPoi.category} className="size-3.5 sm:size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9.5px] sm:text-[10px] font-mono font-bold uppercase text-[#2F9E5B]">
                        {selectedPoi.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C6F432] text-[#0B3D2E] text-[10px] font-mono font-bold">
                        <Navigation className="size-2.5" />
                        <span>{selectedPoi.approxDistance}</span>
                      </span>
                    </div>
                    <h3 className="font-display-v3 font-extrabold text-sm sm:text-base text-[#0B3D2E] leading-tight truncate mt-0.5">
                      {selectedPoi.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPoi(null)}
                  className="min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] rounded-full bg-[#F6FAF7] border border-[#CFE1D5] text-[#0B3D2E] grid place-items-center cursor-pointer shrink-0"
                  aria-label="Tutup detail fasilitas"
                >
                  <X className="size-3.5 sm:size-4" />
                </button>
              </div>

              <p className="text-[11px] sm:text-xs text-[#3B5E50] mt-1.5 sm:mt-2.5 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                {selectedPoi.whyInteresting}
              </p>
              <p className="text-[11px] sm:text-xs font-semibold text-[#0B3D2E] mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-[#E4F1E8] flex items-start gap-1.5 leading-snug">
                <MapPin className="size-3 sm:size-3.5 text-[#2F9E5B] shrink-0 mt-0.5" />
                <span className="line-clamp-2 sm:line-clamp-none">{selectedPoi.buyerHighlight}</span>
              </p>
            </div>
          )}

          {/* COMPACT FLOATING DETAIL CARD — CLUSTER (z-30 inside isolated map wrapper) */}
          {!selectedPoi && selectedCluster && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:left-auto sm:right-4 sm:bottom-14 sm:w-[340px] z-30 rounded-xl sm:rounded-2xl bg-white/98 border-2 border-[#0B3D2E] p-2.5 sm:p-4 shadow-[0_16px_40px_-14px_rgba(11,61,46,0.3)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-7 sm:size-8 rounded-full bg-[#0B3D2E] border border-[#C6F432] grid place-items-center text-[#C6F432] shrink-0">
                    <Home className="size-3.5 sm:size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9.5px] sm:text-[10px] font-mono font-bold uppercase text-[#2F9E5B]">
                        {selectedCluster.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#C6F432] text-[#0B3D2E] text-[10px] font-mono font-bold">
                        {selectedCluster.units}
                      </span>
                    </div>
                    <h3 className="font-display-v3 font-extrabold text-sm sm:text-base text-[#0B3D2E] leading-tight truncate mt-0.5">
                      {selectedCluster.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] rounded-full bg-[#F6FAF7] border border-[#CFE1D5] text-[#0B3D2E] grid place-items-center cursor-pointer shrink-0"
                  aria-label="Tutup detail klaster"
                >
                  <X className="size-3.5 sm:size-4" />
                </button>
              </div>

              <p className="text-[11px] sm:text-xs text-[#3B5E50] mt-1.5 sm:mt-2.5 leading-snug sm:leading-relaxed">
                {selectedCluster.sellingPoint}
              </p>
              <p className="text-[11px] sm:text-xs font-semibold text-[#0B3D2E] mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-[#E4F1E8] flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3 sm:size-3.5 text-[#2F9E5B] shrink-0" />
                  <span>SHM Pecah &amp; PBG Lengkap</span>
                </span>
                <span className="font-mono text-[10px] text-[#2F9E5B]">Tempo 24 Bln</span>
              </p>
            </div>
          )}
        </div>

        {/* MOBILE & TABLET CONTROL PANEL BELOW MAP (lg:hidden) */}
        <div className="lg:hidden mt-4">
          {renderControlPanel(true)}
        </div>
      </div>
    </section>
  );
};
