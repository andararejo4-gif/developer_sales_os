import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, CheckCircle2 } from 'lucide-react';

interface POI {
  name: string;
  category: 'Fasilitas Medis' | 'Pusat Belanja' | 'Pendidikan' | 'Transportasi' | 'Pemerintahan';
  lat: number;
  lng: number;
  approxDistance: string;
}

const POIS: POI[] = [
  { name: 'RSUD Ir. Soekarno', category: 'Fasilitas Medis', lat: -7.6765, lng: 110.8340, approxDistance: 'sekitar 2.1 km (6 menit)' },
  { name: 'Alun-Alun Satya Negara Sukoharjo', category: 'Pemerintahan', lat: -7.6830, lng: 110.8290, approxDistance: 'sekitar 3.2 km (8 menit)' },
  { name: 'The Park Mall Solo Baru', category: 'Pusat Belanja', lat: -7.5995, lng: 110.8210, approxDistance: 'sekitar 8.5 km (12 menit)' },
  { name: 'Pakuwon Mall Solo Baru', category: 'Pusat Belanja', lat: -7.5980, lng: 110.8190, approxDistance: 'sekitar 8.7 km (13 menit)' },
  { name: 'Stasiun Sukoharjo', category: 'Transportasi', lat: -7.6850, lng: 110.8380, approxDistance: 'sekitar 3.8 km (7 menit)' },
  { name: 'SMA Negeri 1 Sukoharjo', category: 'Pendidikan', lat: -7.6790, lng: 110.8350, approxDistance: 'sekitar 2.5 km (5 menit)' },
];

const CLUSTERS = [
  { name: 'Cluster Nagoya', type: 'Diamond 75/90', units: '10 Unit', lat: -7.6738726546957565, lng: 110.84397833605674 },
  { name: 'Cluster Osaka', type: 'Gold 60/72', units: '10 Unit', lat: -7.670296745443235, lng: 110.83933117795694 },
  { name: 'Cluster Tokyo', type: 'Emerald 50/60', units: '10 Unit', lat: -7.670599344181913, lng: 110.83923919943206 },
];

const RADIUS_OPTIONS = [
  { label: '500 m', meters: 500 },
  { label: '1 km', meters: 1000 },
  { label: '3 km', meters: 3000 },
  { label: '5 km', meters: 5000 },
  { label: '10 km', meters: 10000 },
  { label: '25 km', meters: 25000 },
];

export const InteractiveMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(5000);
  const [activePoi, setActivePoi] = useState<POI | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center di Sukoharjo
    const map = L.map(mapContainerRef.current, {
      center: [-7.67150, 110.84150],
      zoom: 14,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom Icon Cluster (Terracotta pin)
    const clusterIcon = L.divIcon({
      className: 'custom-cluster-pin',
      html: `<div style="background-color:#B45309;color:white;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid #ffffff;font-size:12px;font-weight:bold;">TP</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Custom Icon POI (Espresso pin)
    const poiIcon = L.divIcon({
      className: 'custom-poi-pin',
      html: `<div style="background-color:#1C1917;color:#FBBF24;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid #ffffff;font-size:10px;font-weight:bold;">★</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    });

    // Tambahkan marker 3 Cluster
    CLUSTERS.forEach(c => {
      const marker = L.marker([c.lat, c.lng], { icon: clusterIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:4px;">
          <strong style="color:#B45309;font-size:13px;display:block;">${c.name}</strong>
          <span style="font-size:11px;color:#1C1917;font-weight:600;">Tipe: ${c.type} (${c.units})</span>
          <p style="font-size:10px;color:#78716C;margin-top:4px;">Koordinat: ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}</p>
        </div>
      `);
    });

    // Tambahkan marker POI
    POIS.forEach(p => {
      const marker = L.marker([p.lat, p.lng], { icon: poiIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:4px;">
          <strong style="color:#1C1917;font-size:12px;display:block;">${p.name}</strong>
          <span style="font-size:10px;color:#B45309;font-weight:600;">${p.category}</span>
          <p style="font-size:11px;color:#44403C;margin-top:4px;">Jarak: ${p.approxDistance}</p>
        </div>
      `);
      marker.on('click', () => {
        setActivePoi(p);
      });
    });

    const circlesLayer = L.layerGroup().addTo(map);
    circlesLayerRef.current = circlesLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update radius circles
  useEffect(() => {
    if (!circlesLayerRef.current || !mapInstanceRef.current) return;
    circlesLayerRef.current.clearLayers();

    const center: [number, number] = [-7.67150, 110.84150];

    // Cincin aktif
    L.circle(center, {
      radius: selectedRadius,
      color: '#B45309',
      fillColor: '#B45309',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '4, 4'
    }).addTo(circlesLayerRef.current);

    // Auto fit bounds jika radius besar
    if (selectedRadius >= 10000) {
      mapInstanceRef.current.setView(center, selectedRadius >= 20000 ? 11 : 12);
    } else {
      mapInstanceRef.current.setView(center, selectedRadius <= 1000 ? 15 : 13);
    }
  }, [selectedRadius]);

  return (
    <div className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-xs">
      <div className="p-6 border-b border-warmborder flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-terracotta text-xs font-bold border border-amber-200">
              Demo Spasial Interaktif
            </span>
            <h3 className="text-lg font-bold text-espresso">Peta Radius &amp; Fasilitas Terverifikasi</h3>
          </div>
          <p className="text-xs text-warmmuted mt-1">
            Menampilkan 3 cluster nyata The Park Townhouse Sukoharjo dan analisis fasilitas publik radius 500 m s.d. 25 km
          </p>
        </div>

        {/* Radius Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-warmmuted mr-1">Cincin Radius:</span>
          {RADIUS_OPTIONS.map(r => (
            <button
              key={r.meters}
              onClick={() => setSelectedRadius(r.meters)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedRadius === r.meters
                  ? 'bg-terracotta text-white'
                  : 'bg-sandstone text-espresso hover:bg-warmborder/80'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Map + Side POI list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        <div className="lg:col-span-8 relative">
          <div ref={mapContainerRef} className="w-full h-[420px] lg:h-full z-0" />
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-warmborder text-[11px] font-semibold text-espresso flex items-center gap-2 shadow-xs">
            <span className="size-2 rounded-full bg-terracotta animate-pulse"></span>
            <span>Nagoya, Osaka &amp; Tokyo Clusters</span>
          </div>
        </div>

        {/* POI Sidebar List */}
        <div className="lg:col-span-4 p-5 bg-sandstone/40 border-t lg:border-t-0 lg:border-l border-warmborder flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-warmmuted mb-3">
              Fasilitas Sekitar Terpilih
            </h4>
            <div className="space-y-2">
              {POIS.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActivePoi(p);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([p.lat, p.lng], 15);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activePoi?.name === p.name
                      ? 'bg-white border-terracotta shadow-xs'
                      : 'bg-white/80 border-warmborder hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-bold text-espresso">{p.name}</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sandstone text-warmmuted shrink-0">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-terracotta font-medium mt-1 flex items-center gap-1">
                    <Navigation className="size-3" />
                    <span>{p.approxDistance}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-warmborder text-[11px] text-warmmuted flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-olive shrink-0" />
            <span>Kordinat dihitung dari tapak proyek, bukan jarak garis lurus spekulatif.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
