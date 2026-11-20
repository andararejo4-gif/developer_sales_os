import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import {
  Compass,
  Filter,
  Home,
  Info,
  MapPin,
  Navigation,
  X,
} from 'lucide-react';
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
  type PoiCategoryKey,
} from '../InteractiveMap';

gsap.registerPlugin(ScrollTrigger);

function parseKm(approxDistance: string): number {
  const m = approxDistance.match(/([\d.]+)\s*km/i);
  return m ? parseFloat(m[1]) : 5;
}

export interface CategoryFilterOption {
  id: string;
  label: string;
  key: PoiCategoryKey | 'all';
}

export const NINE_CATEGORIES: CategoryFilterOption[] = [
  { id: 'all', label: 'Semua', key: 'all' },
  { id: 'pendidikan', label: 'Pendidikan', key: 'pendidikan' },
  { id: 'tempat_ibadah', label: 'Tempat Ibadah', key: 'tempat_ibadah' },
  { id: 'kesehatan', label: 'Kesehatan', key: 'kesehatan' },
  { id: 'belanja', label: 'Belanja', key: 'belanja' },
  { id: 'transportasi', label: 'Transportasi', key: 'transportasi' },
  { id: 'layanan_publik', label: 'Layanan Publik', key: 'layanan_publik' },
  { id: 'keuangan', label: 'Keuangan', key: 'keuangan' },
  { id: 'rekreasi', label: 'Rekreasi', key: 'rekreasi' },
  { id: 'kuliner', label: 'Kuliner', key: 'kuliner' },
];

export const CATEGORY_COLORS: Record<string, { pinBg: string; border: string }> = {
  pendidikan: { pinBg: '#2563EB', border: '#1D4ED8' },
  tempat_ibadah: { pinBg: '#7C3AED', border: '#6D28D9' },
  kesehatan: { pinBg: '#DC2626', border: '#B91C1C' },
  belanja: { pinBg: '#D97706', border: '#B45309' },
  transportasi: { pinBg: '#0D9488', border: '#0F766E' },
  layanan_publik: { pinBg: '#059669', border: '#047857' },
  keuangan: { pinBg: '#4F46E5', border: '#4338CA' },
  rekreasi: { pinBg: '#16A34A', border: '#15803D' },
  kuliner: { pinBg: '#EA580C', border: '#C2410C' },
};

function getCategoryTheme(catKey?: string) {
  const k = (catKey || '').toLowerCase();
  return CATEGORY_COLORS[k] || { pinBg: '#0B3D2E', border: '#042219' };
}

interface ClusterGroup {
  id: string;
  center: [number, number];
  items: Array<{ poi: POI; km: number; inRadius: boolean }>;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterData | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [spiderfiedClusterId, setSpiderfiedClusterId] = useState<string | null>(null);
  const [wheelUnlocked, setWheelUnlocked] = useState<boolean>(false);
  const [showOtherFacilities, setShowOtherFacilities] = useState<boolean>(false);

  const originPoint = useMemo<[number, number]>(() => {
    if (activeClusterId === 'all') return PROJECT_CENTROID;
    const found = CLUSTERS.find((c) => c.id === activeClusterId);
    return found ? [found.lat, found.lng] : PROJECT_CENTROID;
  }, [activeClusterId]);

  // Facilities with dynamic distance calculation, sorted with in-radius first, then ascending distance
  // Policy B: Homepage default hanya menampilkan fasilitas unggulan (15-25 pin pada 5 km, maks 5 per kategori)
  // Tombol "Tampilkan fasilitas lainnya" default MATI; bila dinyalakan menampilkan sisanya.
  const poisWithDistance = useMemo(() => {
    const mapped = POIS.map((p) => {
      const meters = haversineMeters(originPoint[0], originPoint[1], p.lat, p.lng);
      const km = parseKm(p.approxDistance);
      return {
        poi: p,
        meters,
        km,
        inRadius: meters <= selectedRadius,
      };
    });

    let eligible = mapped;
    if (!showOtherFacilities) {
      eligible = mapped.filter((item) => item.poi.unggulan === true);
    }

    // Maksimal 5 pin per kategori pada radius aktif untuk fasilitas unggulan
    const categoryCounts: Record<string, number> = {};
    const sortedByDist = [...eligible].sort((a, b) => a.meters - b.meters);
    const capped = sortedByDist.filter((item) => {
      if (showOtherFacilities) return true;
      const catKey = (item.poi.categoryKey || item.poi.category).toLowerCase();
      const currentCount = categoryCounts[catKey] || 0;
      if (item.inRadius && currentCount >= 5) {
        return false;
      }
      if (item.inRadius) {
        categoryCounts[catKey] = currentCount + 1;
      }
      return true;
    });

    return capped.sort((a, b) => {
      if (a.inRadius !== b.inRadius) {
        return a.inRadius ? -1 : 1;
      }
      return a.meters - b.meters;
    });
  }, [originPoint, selectedRadius, showOtherFacilities]);

  // Filtered by active category (9 categories + 'all')
  const filteredPois = useMemo(() => {
    if (selectedCategory === 'all') return poisWithDistance;
    return poisWithDistance.filter(
      (item) => (item.poi.categoryKey || item.poi.category.toLowerCase()) === selectedCategory.toLowerCase()
    );
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

  const activeCategoryObj = useMemo(
    () => NINE_CATEGORIES.find((c) => c.id === selectedCategory) ?? NINE_CATEGORIES[0],
    [selectedCategory]
  );

  // 1. Initialize Leaflet Map
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

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Close spiderfy and detail cards when clicking empty map area
    map.on('click', () => {
      setSpiderfiedClusterId(null);
      setSelectedPoi(null);
      setSelectedCluster(null);
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

    // Initial flyTo on arrival
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

  // Handle Escape key to dismiss selected facility or cluster detail card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPoi(null);
        setSelectedCluster(null);
        setSpiderfiedClusterId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Smooth flyTo when radius or cluster changes
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

  // 3. Render Concentric Rings, Beacon, Clusters, POIs, Clustering & Spiderfy
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

    // Active emerald radius ring
    L.circle(originPoint, {
      radius: selectedRadius,
      color: '#2F9E5B',
      weight: 2.2,
      opacity: 0.9,
      fillColor: '#C6F432',
      fillOpacity: 0.08,
      interactive: false,
    }).addTo(layer);

    // Project Centroid Beacon
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

    // Cluster markers (Nagoya, Osaka, Tokyo)
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

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
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

    // =========================================================================
    // SPATIAL CLUSTERING & SPIDERFY ALGORITHM
    // Pins closer than 36px at current zoom are grouped into a cluster badge.
    // Clicking zooms or spiderfies without overlapping labels.
    // =========================================================================
    const CLUSTER_DISTANCE_PX = 36;
    const clusters: ClusterGroup[] = [];
    const assignedIndices = new Set<number>();

    for (let i = 0; i < visiblePoiItems.length; i++) {
      if (assignedIndices.has(i)) continue;
      const itemA = visiblePoiItems[i];
      const pA = map.latLngToLayerPoint([itemA.poi.lat, itemA.poi.lng]);
      const group: Array<{ poi: POI; km: number; inRadius: boolean }> = [itemA];
      assignedIndices.add(i);

      for (let j = i + 1; j < visiblePoiItems.length; j++) {
        if (assignedIndices.has(j)) continue;
        const itemB = visiblePoiItems[j];
        const pB = map.latLngToLayerPoint([itemB.poi.lat, itemB.poi.lng]);
        if (pA.distanceTo(pB) <= CLUSTER_DISTANCE_PX) {
          group.push(itemB);
          assignedIndices.add(j);
        }
      }

      const avgLat = group.reduce((acc, curr) => acc + curr.poi.lat, 0) / group.length;
      const avgLng = group.reduce((acc, curr) => acc + curr.poi.lng, 0) / group.length;
      clusters.push({
        id: `clust-${i}-${group[0].poi.name}`,
        center: [avgLat, avgLng],
        items: group,
      });
    }

    // Render Clusters and Individual Pins
    clusters.forEach((cg) => {
      const isSpiderfied = spiderfiedClusterId === cg.id;

      // Group of 2+ items that is NOT spiderfied
      if (cg.items.length > 1 && !isSpiderfied) {
        const clusterHtml = `
          <div class="v3-marker-cluster-badge" style="width:36px;height:36px;font-size:13px;">
            <span>${cg.items.length}</span>
            <span class="v3-marker-cluster-pulse"></span>
          </div>
        `;
        const clusterIcon = L.divIcon({
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          html: clusterHtml,
        });

        const clusterMarker = L.marker(cg.center, {
          icon: clusterIcon,
          zIndexOffset: 550,
          title: `${cg.items.length} fasilitas di area ini`,
        }).addTo(layer);

        clusterMarker.bindTooltip(`${cg.items.length} fasilitas berdekatan (Klik untuk perbesar/urai)`, {
          direction: 'top',
          offset: [0, -18],
          className: 'v3-poi-tooltip',
        });

        clusterMarker.on('click', () => {
          if (currentZoom < 15) {
            map.flyTo(cg.center, Math.min(18, currentZoom + 2), { duration: 0.5 });
          } else {
            setSpiderfiedClusterId(cg.id);
          }
        });
        return;
      }

      // If Spiderfied: Draw connecting spider lines from center to expanded pins
      if (cg.items.length > 1 && isSpiderfied) {
        L.circleMarker(cg.center, {
          radius: 4,
          color: '#0B3D2E',
          fillColor: '#C6F432',
          fillOpacity: 1,
          weight: 2,
        }).addTo(layer);
      }

      // Render Individual Pins (or spiderfied child pins)
      cg.items.forEach(({ poi, inRadius }, idx) => {
        const isSelected = selectedPoi?.name === poi.name;
        const catColor = getCategoryTheme(poi.categoryKey || poi.category);

        let pinPos: [number, number] = [poi.lat, poi.lng];

        // Position spiderfied child pins in radial circle (spiderfy)
        if (cg.items.length > 1 && isSpiderfied) {
          const angle = (idx * 2 * Math.PI) / cg.items.length;
          const spiderOffsetDeg = 0.00045; // ~40m offset
          pinPos = [
            cg.center[0] + Math.sin(angle) * spiderOffsetDeg,
            cg.center[1] + Math.cos(angle) * spiderOffsetDeg * 1.25,
          ];

          // Leader line from cluster center to spider pin
          L.polyline([cg.center, pinPos], {
            color: '#2F9E5B',
            weight: 1.5,
            dashArray: '3 3',
            opacity: 0.75,
          }).addTo(layer);
        }

        // Show automatic name pill on zoom >= 15 or when spiderfied, only for pin unggulan
        const showAutoLabel = (currentZoom >= 15 || isSpiderfied || isSelected) && (poi.unggulan ?? true);

        const poiIcon = L.divIcon({
          className: 'v3-facility-divicon',
          iconSize: [38, showAutoLabel ? 68 : 46],
          iconAnchor: [19, 42],
          html: `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 12px rgba(11,61,46,0.32));transition:transform 0.22s ease;${isSelected ? 'transform:scale(1.22);z-index:999;' : ''}">
              ${isSelected ? '<span class="v3-pin-active-ring"></span>' : ''}
              <div style="width:34px;height:34px;border-radius:999px;background:${catColor.pinBg};border:${isSelected ? '3px solid #C6F432' : '2.5px solid #FFFFFF'};display:grid;place-items:center;box-shadow:${isSelected ? '0 0 0 2.5px #0B3D2E, 0 4px 14px rgba(0,0,0,0.35)' : '0 3px 10px rgba(0,0,0,0.22)'};">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${getPoiSvgPath(poi.category)}</svg>
              </div>
              <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${isSelected ? '#0B3D2E' : catColor.pinBg};margin-top:-1px;"></div>
              ${
                showAutoLabel
                  ? `<div class="v3-marker-name-pill" style="margin-top:3px;font-size:10px;padding:2px 7px;border-color:${isSelected ? '#0B3D2E' : catColor.pinBg};font-weight:${isSelected ? '800' : '700'};background:${isSelected ? '#0B3D2E' : '#FFFFFF'};color:${isSelected ? '#C6F432' : '#0B3D2E'};">${poi.name}</div>`
                  : ''
              }
            </div>
          `,
        });

        const marker = L.marker(pinPos, {
          icon: poiIcon,
          zIndexOffset: isSelected ? 800 : inRadius ? 450 : 250,
          title: poi.name,
        }).addTo(layer);

        // Name displayed on hover/focus via single-line Leaflet Tooltip only
        marker.bindTooltip(poi.name, {
          direction: 'top',
          offset: [0, -38],
          className: 'v3-poi-tooltip',
        });

        // Click marker: ONLY update state to open the bottom-right detail card, NO Leaflet popup
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedCluster(null);
          setSelectedPoi(poi);
          map.panTo(pinPos, { animate: true, duration: 0.55 });
        });

        poiMarkersRef.current[poi.name] = marker;
      });
    });
  }, [originPoint, selectedRadius, activeClusterId, selectedPoi, filteredPois, currentZoom, spiderfiedClusterId]);

  const handleSelectPoiFromList = (poi: POI) => {
    setSelectedCluster(null);
    setSelectedPoi(poi);
    if (mapRef.current) {
      mapRef.current.flyTo([poi.lat, poi.lng], Math.max(activeRadiusObj.zoom, 14), { duration: 0.65 });
    }
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

  // Shared Panel Content
  const renderControlPanel = (compact = false) => (
    <div
      className={`bg-white border border-[#CFE1D5] rounded-2xl flex flex-col h-full max-h-full overflow-hidden ${
        compact ? 'p-4 sm:p-5' : 'p-4 sm:p-5 shadow-[0_24px_60px_-24px_rgba(11,61,46,0.22)]'
      }`}
    >
      {/* Summary Header: N di dalam radius, M di luar radius */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E4F1E8] shrink-0">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2F9E5B]">
            Analisis Radius Aktif
          </span>
          <p className="font-display-v3 font-extrabold text-sm sm:text-base text-[#0B3D2E] mt-0.5 tabular-nums leading-snug">
            {inRadiusCount} di dalam radius, {outsideCount} di luar radius
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#C6F432] text-[#0B3D2E] font-mono text-xs font-bold shrink-0">
          {activeRadiusObj.label}
        </span>
      </div>

      {/* Scrollable Body: Batasi tinggi panel agar tidak melebihi tinggi peta (isi digulir di dalam panel) */}
      <div
        data-lenis-prevent
        className="flex-1 overflow-y-auto overscroll-contain pr-1 space-y-4 no-scrollbar min-h-0 pt-3"
      >
        {/* Chip Kategori 2 Kolom dengan Nama Penuh */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase text-[#3B5E50]">
              Kategori Fasilitas (9 Pilihan)
            </span>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-[10px] font-mono font-bold text-[#2F9E5B] hover:underline cursor-pointer"
              >
                Reset Semua
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {NINE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              const countInRadius = poisWithDistance.filter(
                (p) =>
                  (cat.id === 'all' ||
                    (p.poi.categoryKey || p.poi.category.toLowerCase()) === cat.id.toLowerCase()) &&
                  p.inRadius
              ).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSpiderfiedClusterId(null);
                    if (
                      selectedPoi &&
                      cat.id !== 'all' &&
                      (selectedPoi.categoryKey || selectedPoi.category.toLowerCase()) !== cat.id.toLowerCase()
                    ) {
                      setSelectedPoi(null);
                    }
                  }}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between gap-1.5 ${
                    active
                      ? 'bg-[#0B3D2E] text-[#C6F432] border-[#0B3D2E] shadow-xs'
                      : 'bg-[#F6FAF7] text-[#0B3D2E] border-[#CFE1D5] hover:border-[#2F9E5B]'
                  }`}
                  title={cat.label}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {cat.id === 'all' ? (
                      <Compass className="size-3.5 shrink-0 text-[#2F9E5B]" />
                    ) : (
                      <PoiCategoryIcon category={cat.label} className="size-3.5 shrink-0" />
                    )}
                    <span className="truncate">{cat.label}</span>
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

        {/* Radius 3x2 Grid */}
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
                  onClick={() => {
                    setSelectedRadius(opt.meters);
                    setSpiderfiedClusterId(null);
                  }}
                  className={`min-h-[38px] rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
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

          {/* Tombol Tampilkan Fasilitas Lainnya */}
          <div className="mt-2">
            <button
              onClick={() => setShowOtherFacilities((v) => !v)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between ${
                showOtherFacilities
                  ? 'bg-[#EAF4D3] text-[#0B3D2E] border-[#0B3D2E]'
                  : 'bg-white text-[#3B5E50] border-[#CFE1D5] hover:text-[#0B3D2E] hover:border-[#2F9E5B]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Filter className="size-3.5 text-[#2F9E5B]" />
                <span>{showOtherFacilities ? 'Fasilitas Lainnya: Tampil' : 'Tampilkan fasilitas lainnya'}</span>
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  showOtherFacilities
                    ? 'bg-[#0B3D2E] text-[#C6F432]'
                    : 'bg-[#F6FAF7] text-[#3B5E50] border border-[#CFE1D5]'
                }`}
              >
                {showOtherFacilities ? 'Semua' : 'Unggulan'}
              </span>
            </button>
          </div>
        </div>

        {/* Fokus Klaster */}
        <div>
          <span className="text-[11px] font-mono font-bold uppercase text-[#3B5E50] block mb-2">
            Fokus Klaster The Park
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleSelectCluster('all')}
              className={`min-h-[38px] px-2.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
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
                  className={`min-h-[38px] px-2.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
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

        {/* Daftar Fasilitas */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase text-[#3B5E50]">
              Daftar Fasilitas ({filteredPois.length})
            </span>
            <span className="text-[10px] font-mono text-[#3B5E50]/75">
              Zoom: {currentZoom}x
            </span>
          </div>

          {/* Pesan informatif jika kategori kosong pada radius aktif */}
          {inRadiusCount === 0 && (
            <div className="p-3.5 mb-2 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="size-4 text-amber-700 shrink-0" />
                <span>Belum ada fasilitas unggulan {activeCategoryObj.label} dalam radius ini</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Fasilitas unggulan kategori ini berada di radius yang lebih luas atau aktifkan &quot;Tampilkan fasilitas lainnya&quot; untuk melihat sarana feeder/pendukung sekitar.
              </p>
            </div>
          )}

          {/* Daftar: Nama sampai 2 baris (line-clamp-2) & lencana jarak/status di baris terpisah */}
          <div className="space-y-2">
            {filteredPois.map(({ poi, km, inRadius }) => {
              const isSel = selectedPoi?.name === poi.name;
              const barWidth = Math.min(100, Math.max(16, (km / 12) * 100));
              const catColor = getCategoryTheme(poi.categoryKey || poi.category);

              return (
                <button
                  key={poi.name}
                  onClick={() => handleSelectPoiFromList(poi)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#EAF4D3] border-[#0B3D2E] shadow-xs'
                      : inRadius
                      ? 'bg-[#F6FAF7] border-[#CFE1D5] hover:border-[#2F9E5B]'
                      : 'bg-white border-[#E4F1E8] opacity-75 hover:opacity-100 hover:border-[#CFE1D5]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="size-7 rounded-full grid place-items-center text-white shrink-0 shadow-xs mt-0.5"
                      style={{ backgroundColor: catColor.pinBg }}
                    >
                      <PoiCategoryIcon category={poi.category} className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* Nama fasilitas sampai 2 baris */}
                      <h4 className="text-xs sm:text-[13px] font-bold text-[#0B3D2E] leading-snug line-clamp-2">
                        {poi.name}
                      </h4>

                      {/* Lencana jarak, status, dan jenis strategis di baris terpisah */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {poi.strategicType && (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#0B3D2E] text-[#C6F432]">
                            ★ {poi.strategicType.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span
                          className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            inRadius
                              ? 'bg-[#EAF4D3] text-[#0B3D2E]'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {inRadius ? 'Dalam radius' : 'Di luar radius'}
                        </span>
                        <span className="text-[10.5px] font-mono font-bold text-[#2F9E5B] tabular-nums">
                          {km.toFixed(1)} km
                        </span>
                        <span className="text-[10px] text-[#3B5E50] font-medium truncate">
                          · {poi.approxDistance.split('·')[1]?.trim() || poi.approxDistance}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Proportional Distance Bar */}
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#E4F1E8] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSel ? 'bg-[#0B3D2E]' : inRadius ? 'bg-[#2F9E5B]' : 'bg-[#9FB8A8]'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section
      id="peta-demo"
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-[#F6FAF7] border-b border-[#CFE1D5] py-10 sm:py-16 scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Chapter Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 sm:mb-6">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-[#2F9E5B] font-bold">
              Bab 04 · Peta Spasial &amp; Fasilitas Unggulan
            </p>
            <h2 className="font-display-v3 text-v3-chapter font-extrabold text-[#0B3D2E] mt-1.5">
              Peta fasilitas unggulan sekitar hunian.
            </h2>
            <p className="text-sm sm:text-base text-[#3B5E50] mt-2 leading-relaxed">
              Menampilkan fasilitas unggulan di sekitar perumahan; daftar lengkap tersedia di Riset Pasar.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#CFE1D5] text-xs font-semibold text-[#0B3D2E]">
              <Compass className="size-4 text-[#2F9E5B]" />
              <span>3 Klaster · {poisWithDistance.length} Fasilitas {showOtherFacilities ? 'Lengkap' : 'Unggulan'}</span>
            </div>
            <button
              onClick={() => setShowOtherFacilities((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                showOtherFacilities
                  ? 'bg-[#0B3D2E] text-[#C6F432] border-[#0B3D2E]'
                  : 'bg-white text-[#0B3D2E] border-[#CFE1D5] hover:border-[#2F9E5B]'
              }`}
              title="Tampilkan fasilitas sekunder / lainnya"
            >
              <Filter className="size-3.5 text-[#2F9E5B]" />
              <span>{showOtherFacilities ? 'Fasilitas Lainnya: Aktif' : 'Tampilkan fasilitas lainnya'}</span>
            </button>
          </div>
        </div>

        {/* Quick Category Filter Bar (Horizontal scrollable bar dengan nama penuh) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
          <span className="text-xs font-mono font-bold text-[#3B5E50] uppercase shrink-0 mr-1 flex items-center gap-1">
            <Filter className="size-3.5 text-[#2F9E5B]" />
            Kategori:
          </span>
          {NINE_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            const countInRadius = poisWithDistance.filter(
              (p) =>
                (cat.id === 'all' ||
                  (p.poi.categoryKey || p.poi.category.toLowerCase()) === cat.id.toLowerCase()) &&
                p.inRadius
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSpiderfiedClusterId(null);
                  if (
                    selectedPoi &&
                    cat.id !== 'all' &&
                    (selectedPoi.categoryKey || selectedPoi.category.toLowerCase()) !== cat.id.toLowerCase()
                  ) {
                    setSelectedPoi(null);
                  }
                }}
                className={`min-h-[38px] px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                  active
                    ? 'bg-[#0B3D2E] text-[#C6F432] border-[#0B3D2E] shadow-sm'
                    : 'bg-white text-[#3B5E50] border-[#CFE1D5] hover:border-[#2F9E5B] hover:text-[#0B3D2E]'
                }`}
              >
                {cat.id === 'all' ? (
                  <Compass className="size-3.5 text-[#2F9E5B]" />
                ) : (
                  <PoiCategoryIcon category={cat.label} className="size-3.5" />
                )}
                <span>{cat.label}</span>
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

        {/* Full-Bleed Map Stage: position: relative; isolation: isolate; overflow: hidden; */}
        <div className="relative isolate overflow-hidden rounded-3xl border border-[#CFE1D5] bg-white shadow-[0_28px_70px_-30px_rgba(11,61,46,0.22)]">
          {/* Map Canvas */}
          <div
            ref={mapElRef}
            data-lenis-prevent
            className="w-full h-[58dvh] min-h-[420px] sm:h-[64dvh] lg:h-[80dvh] lg:min-h-[640px] lg:max-h-[760px] relative z-0 touch-none"
          />

          {/* DESKTOP FLOATING CONTROL PANEL: Batasi tinggi panel agar tidak melebihi tinggi peta (isi digulir di dalam panel) */}
          <div className="hidden lg:flex flex-col absolute top-4 left-4 bottom-4 z-20 w-[360px] max-h-[calc(100%-2rem)]">
            {renderControlPanel(false)}
          </div>

          {/* DESKTOP SCROLL-ZOOM COMFORT HINT (Hanya tampil jika tidak ada kartu detail aktif) */}
          {!selectedPoi && !selectedCluster && (
            <div className="hidden sm:flex absolute bottom-4 right-4 z-20 items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 border border-[#CFE1D5] text-[11px] font-mono font-semibold text-[#0B3D2E] shadow-sm pointer-events-none">
              <span className={`size-2 rounded-full ${wheelUnlocked ? 'bg-[#2F9E5B]' : 'bg-[#9FB8A8]'}`} />
              <span>
                {wheelUnlocked
                  ? 'Zoom scroll aktif · keluar peta untuk scroll halaman'
                  : 'Klik peta untuk zoom dengan scroll'}
              </span>
            </div>
          )}

          {/* COMPACT FLOATING DETAIL CARD — POI (Pojok kanan bawah peta) */}
          {selectedPoi && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[360px] z-30 rounded-2xl bg-white/98 backdrop-blur-md border-2 border-[#0B3D2E] p-3.5 sm:p-4 shadow-[0_20px_50px_-16px_rgba(11,61,46,0.35)]"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="size-8 sm:size-9 rounded-full grid place-items-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: getCategoryTheme(selectedPoi.categoryKey || selectedPoi.category).pinBg }}
                  >
                    <PoiCategoryIcon category={selectedPoi.category} className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#2F9E5B]">
                        {selectedPoi.categoryLabel || selectedPoi.category}
                      </span>
                      {selectedPoi.strategicType && (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#0B3D2E] text-[#C6F432]">
                          ★ {selectedPoi.strategicType.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C6F432] text-[#0B3D2E] text-[10px] font-mono font-bold">
                        <Navigation className="size-2.5" />
                        <span>{selectedPoi.approxDistance}</span>
                      </span>
                    </div>
                    <h3 className="font-display-v3 font-extrabold text-sm sm:text-base text-[#0B3D2E] leading-tight truncate mt-0.5" title={selectedPoi.name}>
                      {selectedPoi.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPoi(null)}
                  className="size-8 rounded-full bg-[#F6FAF7] border border-[#CFE1D5] hover:bg-[#EAF4D3] hover:border-[#0B3D2E] text-[#0B3D2E] grid place-items-center cursor-pointer shrink-0 transition-colors"
                  aria-label="Tutup detail fasilitas (Esc)"
                  title="Tutup (Esc)"
                >
                  <X className="size-4" />
                </button>
              </div>

              <p className="text-xs text-[#3B5E50] mt-2.5 leading-relaxed">
                {selectedPoi.whyInteresting}
              </p>
              <div className="text-xs font-semibold text-[#0B3D2E] mt-2.5 pt-2 border-t border-[#E4F1E8] flex items-start gap-1.5 leading-snug">
                <MapPin className="size-3.5 text-[#2F9E5B] shrink-0 mt-0.5" />
                <span>{selectedPoi.buyerHighlight}</span>
              </div>
            </div>
          )}

          {/* COMPACT FLOATING DETAIL CARD — CLUSTER (Pojok kanan bawah peta) */}
          {!selectedPoi && selectedCluster && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[360px] z-30 rounded-2xl bg-white/98 backdrop-blur-md border-2 border-[#0B3D2E] p-3.5 sm:p-4 shadow-[0_20px_50px_-16px_rgba(11,61,46,0.35)]"
            >
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
