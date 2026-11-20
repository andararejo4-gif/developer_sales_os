import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import { Compass, Home, MapPin, Navigation, X } from 'lucide-react';
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

export const MapChapterV3: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const hasArrivedRef = useRef<boolean>(false);

  const [selectedRadius, setSelectedRadius] = useState<number>(5000);
  const [activeClusterId, setActiveClusterId] = useState<'all' | ClusterData['id']>('all');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterData | null>(null);
  const [wheelUnlocked, setWheelUnlocked] = useState<boolean>(false);

  const originPoint = useMemo<[number, number]>(() => {
    if (activeClusterId === 'all') return PROJECT_CENTROID;
    const found = CLUSTERS.find((c) => c.id === activeClusterId);
    return found ? [found.lat, found.lng] : PROJECT_CENTROID;
  }, [activeClusterId]);

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
    }).sort((a, b) => a.meters - b.meters);
  }, [originPoint, selectedRadius]);

  const inRadiusCount = useMemo(
    () => poisWithDistance.filter((item) => item.inRadius).length,
    [poisWithDistance]
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

  // 4. Render concentric rings, project beacon, clusters, POIs, and optional dashed route
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerGroupRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

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
        html: `
          <div style="position:relative;width:26px;height:26px;">
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

    const shortPoiName = (name: string) => {
      if (name.includes('RSUD')) return 'RSUD';
      if (name.includes('SMA')) return 'SMAN 1';
      if (name.includes('Alun-Alun')) return 'Alun-Alun';
      if (name.includes('Stasiun')) return 'Stasiun';
      if (name.includes('The Park Mall')) return 'The Park Mall';
      if (name.includes('Pakuwon')) return 'Pakuwon Mall';
      return name;
    };

    // POI Markers (balanced 40px circular icon + crisp micro label underneath)
    poisWithDistance.forEach(({ poi, inRadius }) => {
      const isSelected = selectedPoi?.name === poi.name;
      const bg = isSelected ? '#C6F432' : inRadius ? '#FFFFFF' : '#F6FAF7';
      const border = isSelected ? '#0B3D2E' : inRadius ? '#0B3D2E' : '#9FB8A8';
      const opacity = isSelected || inRadius ? 1 : 0.62;
      const labelBg = isSelected ? '#0B3D2E' : '#FFFFFF';
      const labelColor = isSelected ? '#C6F432' : '#0B3D2E';

      const poiIcon = L.divIcon({
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        html: `
          <div style="position:relative;width:40px;height:40px;opacity:${opacity};display:flex;flex-direction:column;align-items:center;">
            <div style="width:40px;height:40px;border-radius:999px;background:${bg};border:2.2px solid ${border};display:grid;place-items:center;box-shadow:0 6px 18px rgba(11,61,46,0.2);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B3D2E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${getPoiSvgPath(poi.category)}</svg>
            </div>
            <span style="margin-top:3px;white-space:nowrap;padding:2px 7px;border-radius:999px;background:${labelBg};color:${labelColor};border:1px solid ${border};font-size:10.5px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 3px 8px rgba(11,61,46,0.12);">
              ${shortPoiName(poi.name)}
            </span>
          </div>
        `,
      });

      const marker = L.marker([poi.lat, poi.lng], {
        icon: poiIcon,
        zIndexOffset: isSelected ? 600 : 300,
      }).addTo(layer);

      marker.on('click', () => {
        setSelectedCluster(null);
        setSelectedPoi(poi);
        map.panTo([poi.lat, poi.lng], { animate: true, duration: 0.55 });
      });
    });
  }, [originPoint, selectedRadius, activeClusterId, selectedPoi, poisWithDistance]);

  const handleSelectPoiFromList = (poi: POI) => {
    setSelectedCluster(null);
    setSelectedPoi(poi);
    if (mapRef.current) {
      mapRef.current.flyTo([poi.lat, poi.lng], Math.max(activeRadiusObj.zoom, 13), { duration: 0.65 });
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

  // Shared Panel Content (used as floating left panel on desktop, below-map panel on tablet/mobile)
  const renderControlPanel = (compact = false) => (
    <div className={`bg-white border border-[#CFE1D5] rounded-2xl ${compact ? 'p-4 sm:p-5' : 'p-5 shadow-[0_24px_60px_-24px_rgba(11,61,46,0.22)]'} flex flex-col gap-4`}>
      {/* Summary Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E4F1E8]">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2F9E5B]">
            Analisis Radius Aktif
          </span>
          <p className="font-display-v3 font-extrabold text-lg text-[#0B3D2E] mt-0.5 tabular-nums">
            {inRadiusCount} dari {POIS.length} fasilitas
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#C6F432] text-[#0B3D2E] font-mono text-xs font-bold shrink-0">
          {activeRadiusObj.label}
        </span>
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

      {/* Distance-Bar Facility List (scrollbar hidden, wheel-scrolls smoothly on hover via data-lenis-prevent) */}
      <div className="pt-1 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-bold uppercase text-[#3B5E50]">
            Perbandingan Jarak Fasilitas
          </span>
          {!compact && (
            <span className="text-[10px] font-mono text-[#3B5E50]/75">
              Hover &amp; scroll
            </span>
          )}
        </div>
        <div
          data-lenis-prevent
          className={`space-y-2 ${compact ? '' : 'max-h-[228px] overflow-y-auto overscroll-contain no-scrollbar pb-5'}`}
        >
          {poisWithDistance.map(({ poi, km, inRadius }) => {
            const isSel = selectedPoi?.name === poi.name;
            const barWidth = Math.min(100, Math.max(18, (km / 10) * 100));
            return (
              <button
                key={poi.name}
                onClick={() => handleSelectPoiFromList(poi)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#EAF4D3] border-[#0B3D2E]'
                    : inRadius
                    ? 'bg-[#F6FAF7] border-[#CFE1D5] hover:border-[#2F9E5B]'
                    : 'bg-white border-[#E4F1E8] opacity-65 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="size-6 rounded-full bg-white border border-[#CFE1D5] grid place-items-center text-[#0B3D2E] shrink-0">
                      <PoiCategoryIcon category={poi.category} className="size-3.5" />
                    </span>
                    <span className="text-xs font-bold text-[#0B3D2E] truncate">
                      {poi.name}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#2F9E5B] shrink-0 tabular-nums">
                    {km.toFixed(1)} km
                  </span>
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
      className="bg-[#F6FAF7] border-b border-[#CFE1D5] py-14 sm:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Chapter Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-[#2F9E5B] font-bold">
              Bab 04 · Peta Spasial &amp; Radius Riset
            </p>
            <h2 className="font-display-v3 text-v3-chapter font-extrabold text-[#0B3D2E] mt-1.5">
              Peta jadi pusat keputusan lokasi.
            </h2>
            <p className="text-sm sm:text-base text-[#3B5E50] mt-2 leading-relaxed">
              Pilih fasilitas untuk melihat garis jarak dan nilai jual langsung di atas peta The Park Townhouse Sukoharjo.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#CFE1D5] text-xs font-semibold text-[#0B3D2E] self-start">
            <Compass className="size-4 text-[#2F9E5B]" />
            <span>3 Klaster · 6 Fasilitas Terverifikasi</span>
          </div>
        </div>

        {/* Full-Bleed Map Stage */}
        <div className="relative rounded-3xl overflow-hidden border border-[#CFE1D5] bg-white shadow-[0_28px_70px_-30px_rgba(11,61,46,0.22)]">
          {/* Map Canvas — data-lenis-prevent ensures mobile touch drag & pinch-zoom work immediately */}
          <div
            ref={mapElRef}
            data-lenis-prevent
            className="w-full h-[56dvh] min-h-[380px] sm:h-[62dvh] lg:h-[78dvh] lg:min-h-[600px] lg:max-h-[720px] z-10 touch-none"
          />

          {/* DESKTOP FLOATING SOLID WHITE CONTROL PANEL (lg:block) */}
          <div className="hidden lg:block absolute top-5 left-5 z-[450] w-[336px]">
            {renderControlPanel(false)}
          </div>

          {/* DESKTOP SCROLL-ZOOM COMFORT HINT (hidden on mobile) */}
          <div className="hidden sm:flex absolute bottom-4 right-4 z-[450] items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 border border-[#CFE1D5] text-[11px] font-mono font-semibold text-[#0B3D2E] shadow-sm pointer-events-none">
            <span className={`size-2 rounded-full ${wheelUnlocked ? 'bg-[#2F9E5B]' : 'bg-[#9FB8A8]'}`} />
            <span>
              {wheelUnlocked ? 'Zoom scroll aktif · keluar peta untuk scroll halaman' : 'Klik peta untuk zoom dengan scroll'}
            </span>
          </div>

          {/* COMPACT FLOATING DETAIL CARD — POI (Extra-compact on mobile so map stays visible) */}
          {selectedPoi && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:left-auto sm:right-4 sm:bottom-14 sm:w-[340px] z-[460] rounded-xl sm:rounded-2xl bg-white/98 border-2 border-[#0B3D2E] p-2.5 sm:p-4 shadow-[0_16px_40px_-14px_rgba(11,61,46,0.3)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-7 sm:size-8 rounded-full bg-[#EAF4D3] border border-[#2F9E5B] grid place-items-center text-[#0B3D2E] shrink-0">
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

          {/* COMPACT FLOATING DETAIL CARD — CLUSTER (Appears when Cluster Nagoya / Osaka / Tokyo is clicked) */}
          {!selectedPoi && selectedCluster && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:left-auto sm:right-4 sm:bottom-14 sm:w-[340px] z-[460] rounded-xl sm:rounded-2xl bg-white/98 border-2 border-[#0B3D2E] p-2.5 sm:p-4 shadow-[0_16px_40px_-14px_rgba(11,61,46,0.3)]">
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
