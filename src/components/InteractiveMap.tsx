import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  CheckCircle2,
  Layers,
  Cross,
  GraduationCap,
  Landmark,
  TrainFront,
  ShoppingBag,
  Home,
} from 'lucide-react';

type PoiCategory =
  | 'Fasilitas Medis'
  | 'Pusat Belanja'
  | 'Pendidikan'
  | 'Transportasi'
  | 'Pemerintahan';

export interface POI {
  name: string;
  category: PoiCategory;
  lat: number;
  lng: number;
  approxDistance: string;
  whyInteresting: string;
  buyerHighlight: string;
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

export const POIS: POI[] = [
  // 1. Fasilitas Medis / Rumah Sakit
  {
    name: 'RS Nirmala Suri Sukoharjo',
    category: 'Fasilitas Medis',
    lat: -7.6620,
    lng: 110.8385,
    approxDistance: '~1.2 km · 3 mnt berkendara',
    whyInteresting:
      'Rumah sakit swasta terkemuka di jalur utama Solo-Sukoharjo dengan IGD 24 jam dan dokter spesialis lengkap.',
    buyerHighlight: 'Nilai jual: Penanganan medis darurat sangat cepat di bawah 5 menit dari rumah.',
  },
  {
    name: 'RSUD Ir. Soekarno',
    category: 'Fasilitas Medis',
    lat: -7.6765,
    lng: 110.8340,
    approxDistance: '~2.1 km · 6 mnt berkendara',
    whyInteresting:
      'Rumah sakit rujukan utama Kabupaten Sukoharjo dengan layanan IGD 24 jam dan poli spesialis lengkap.',
    buyerHighlight: 'Nilai jual: Keamanan medis keluarga & potensi tinggi target sewa dokter/tenaga medis.',
  },
  {
    name: 'RS Indriati Solo Baru',
    category: 'Fasilitas Medis',
    lat: -7.6105,
    lng: 110.8240,
    approxDistance: '~7.2 km · 11 mnt berkendara',
    whyInteresting:
      'Rumah sakit swasta tipe B modern bertaraf internasional di koridor Solo Baru dengan pusat penanganan komprehensif.',
    buyerHighlight: 'Nilai jual: Akses layanan spesialis rujukan tinggi tanpa harus ke luar kota.',
  },

  // 2. Pendidikan / Sekolah & Kampus
  {
    name: 'SD Negeri Gayam 1 Sukoharjo',
    category: 'Pendidikan',
    lat: -7.6740,
    lng: 110.8412,
    approxDistance: '~0.5 km · 2 mnt berkendara',
    whyInteresting:
      'Sekolah dasar negeri terdekat dengan lingkungan ramah anak, aman dijangkau jalan kaki atau sepeda.',
    buyerHighlight: 'Nilai jual: Anak sekolah tanpa repot antar-jemput jauh, hemat waktu harian keluarga.',
  },
  {
    name: 'SMA Negeri 1 Sukoharjo',
    category: 'Pendidikan',
    lat: -7.6790,
    lng: 110.8350,
    approxDistance: '~2.5 km · 5 mnt berkendara',
    whyInteresting:
      'Sekolah menengah negeri unggulan di pusat kota Sukoharjo dengan akses jalan utama yang lancar.',
    buyerHighlight: 'Nilai jual: Antar-jemput sekolah di bawah 5 menit tanpa macet panjang.',
  },
  {
    name: 'SMP Negeri 1 Sukoharjo',
    category: 'Pendidikan',
    lat: -7.6815,
    lng: 110.8360,
    approxDistance: '~2.8 km · 6 mnt berkendara',
    whyInteresting:
      'Sekolah menengah pertama favorit pusat kota dengan fasilitas laboratorium dan ekstrakurikuler berprestasi.',
    buyerHighlight: 'Nilai jual: Jalur zonasi sekolah negeri favorit sangat menguntungkan penghuni klaster.',
  },
  {
    name: 'Universitas Muhammadiyah Surakarta (UMS)',
    category: 'Pendidikan',
    lat: -7.5580,
    lng: 110.7720,
    approxDistance: '~15.2 km · 22 mnt berkendara',
    whyInteresting:
      'Kampus swasta terkemuka Solo Raya dengan 35.000+ mahasiswa dan fakultas kedokteran & teknik unggulan.',
    buyerHighlight: 'Nilai jual: Akses pendidikan tinggi terakreditasi Unggul & potensi capital gain sewa kos.',
  },

  // 3. Pemerintahan & Sipil
  {
    name: 'Alun-Alun Satya Negara',
    category: 'Pemerintahan',
    lat: -7.6830,
    lng: 110.8290,
    approxDistance: '~3.2 km · 8 mnt berkendara',
    whyInteresting:
      'Pusat ruang terbuka publik, area olahraga pagi, kuliner malam, sekaligus kompleks Pemkab Sukoharjo.',
    buyerHighlight: 'Nilai jual: Dekat pusat layanan sipil daerah & ruang rekreasi keluarga akhir pekan.',
  },
  {
    name: 'Kantor Bupati Sukoharjo',
    category: 'Pemerintahan',
    lat: -7.6820,
    lng: 110.8275,
    approxDistance: '~3.3 km · 8 mnt berkendara',
    whyInteresting:
      'Gedung pusat pemerintahan kabupaten dan pusat pelayanan perizinan terpadu (Mall Pelayanan Publik).',
    buyerHighlight: 'Nilai jual: Kemudahan pengurusan administrasi kependudukan dan perizinan legalitas.',
  },

  // 4. Transportasi
  {
    name: 'Stasiun Sukoharjo',
    category: 'Transportasi',
    lat: -7.6850,
    lng: 110.8380,
    approxDistance: '~3.8 km · 7 mnt berkendara',
    whyInteresting:
      'Akses kereta api komuter Batara Kresna yang menghubungkan langsung Sukoharjo – Solo Kota – Wonogiri.',
    buyerHighlight: 'Nilai jual: Mobilitas komuter bebas macet menuju pusat bisnis Kota Solo.',
  },
  {
    name: 'Terminal Bus Sukoharjo',
    category: 'Transportasi',
    lat: -7.6910,
    lng: 110.8360,
    approxDistance: '~4.5 km · 9 mnt berkendara',
    whyInteresting:
      'Terminal bus terpadu Sukoharjo yang melayani rute AKAP lintas Jawa dan angkutan kota antarkecamatan.',
    buyerHighlight: 'Nilai jual: Kemudahan bepergian luar kota dengan armada bus antarprovinsi.',
  },
  {
    name: 'Stasiun Solobalapan',
    category: 'Transportasi',
    lat: -7.5580,
    lng: 110.8215,
    approxDistance: '~13.2 km · 20 mnt berkendara',
    whyInteresting:
      'Hub utama kereta api eksekutif antarkota & KRL Commuter Line Solo-Yogyakarta dengan jadwal per jam.',
    buyerHighlight: 'Nilai jual: Mobilitas kilat ke Yogyakarta (45 menit) & kereta cepat antarkota ke Jakarta/Surabaya.',
  },

  // 5. Pusat Belanja & Pasar
  {
    name: 'Pasar Ir. Soekarno Sukoharjo',
    category: 'Pusat Belanja',
    lat: -7.6845,
    lng: 110.8320,
    approxDistance: '~3.4 km · 7 mnt berkendara',
    whyInteresting:
      'Pasar induk tradisional modern Sukoharjo untuk belanja harian segar, sayur mayur, dan sembako murah.',
    buyerHighlight: 'Nilai jual: Biaya hidup dapur keluarga hemat dan bahan pangan segar setiap subuh.',
  },
  {
    name: 'The Park Mall Solo Baru',
    category: 'Pusat Belanja',
    lat: -7.5995,
    lng: 110.8210,
    approxDistance: '~8.5 km · 12 mnt berkendara',
    whyInteresting:
      'Pusat belanja modern terbesar di Solo Baru dengan supermarket, bioskop, dan tenant F&B nasional.',
    buyerHighlight: 'Nilai jual: Menunjang gaya hidup modern & mendongkrak daya tarik sewa hunian.',
  },
  {
    name: 'Pakuwon Mall Solo Baru',
    category: 'Pusat Belanja',
    lat: -7.5980,
    lng: 110.8190,
    approxDistance: '~8.7 km · 13 mnt berkendara',
    whyInteresting:
      'Kawasan komersial terpadu di koridor utama Solo Baru yang terhubung dengan hotel dan sentra bisnis.',
    buyerHighlight: 'Nilai jual: Berada di koridor pertumbuhan nilai tanah tertinggi selatan Solo.',
  },
];

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

export function PoiCategoryIcon({ category, className = 'size-4' }: { category: PoiCategory; className?: string }) {
  switch (category) {
    case 'Fasilitas Medis':
      return <Cross className={className} />;
    case 'Pendidikan':
      return <GraduationCap className={className} />;
    case 'Pemerintahan':
      return <Landmark className={className} />;
    case 'Transportasi':
      return <TrainFront className={className} />;
    case 'Pusat Belanja':
      return <ShoppingBag className={className} />;
  }
}

export function getPoiSvgPath(category: PoiCategory): string {
  switch (category) {
    case 'Fasilitas Medis':
      return '<path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/>';
    case 'Pendidikan':
      return '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>';
    case 'Pemerintahan':
      return '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>';
    case 'Transportasi':
      return '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>';
    case 'Pusat Belanja':
      return '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>';
  }
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
  return `
    <div style="width:250px;max-width:74vw;padding:12px 14px;font-family:'Plus Jakarta Sans',sans-serif;color:#1c1917;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:28px;height:28px;border-radius:6px;background:#b45309;color:#ffffff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgInner}</svg>
        </div>
        <div style="min-width:0;">
          <div style="font-size:10px;font-family:monospace;font-weight:700;text-transform:uppercase;color:#b45309;letter-spacing:0.04em;">${poi.category}</div>
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

function buildClusterPopupHtml(cluster: ClusterData): string {
  return `
    <div style="width:230px;max-width:70vw;padding:12px 14px;font-family:'Plus Jakarta Sans',sans-serif;color:#1c1917;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <div style="width:26px;height:26px;border-radius:6px;background:#b45309;color:#ffffff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${HOME_SVG_PATH}</svg>
        </div>
        <div>
          <div style="font-size:10px;font-family:monospace;font-weight:700;text-transform:uppercase;color:#b45309;">${cluster.type} · ${cluster.units}</div>
          <div style="font-size:13px;font-weight:800;color:#1c1917;">${cluster.name}</div>
        </div>
      </div>
      <p style="font-size:12px;line-height:1.45;color:#57534e;margin:0;">
        ${cluster.sellingPoint}
      </p>
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

  const [selectedRadius, setSelectedRadius] = useState<number>(5000);
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

  // Render Cluster Markers with Architectural Home Icon
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = clusterLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const isWideZoom = selectedRadius >= 10000 && activeClusterId === 'all';

    if (isWideZoom) {
      const hubIcon = L.divIcon({
        className: 'custom-hub-pin',
        html: `
          <div style="transform:translate(-50%,-50%);background:#1c1917;color:#f5f2eb;border:2px solid #b45309;border-radius:6px;padding:5px 10px;white-space:nowrap;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 2px 8px rgba(28,25,23,0.25);display:flex;align-items:center;gap:6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${HOME_SVG_PATH}</svg>
            <span style="font-size:11px;font-weight:800;">The Park Townhouse</span>
            <span style="font-size:10px;opacity:0.8;font-family:monospace;">30 Unit</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker(PROJECT_CENTROID, { icon: hubIcon }).addTo(layer);
      marker.bindPopup(
        `
        <div style="width:220px;padding:12px 14px;font-family:'Plus Jakarta Sans',sans-serif;">
          <strong style="color:#1c1917;font-size:13px;display:block;">The Park Townhouse Sukoharjo</strong>
          <span style="font-size:11px;color:#57534e;display:block;margin-top:4px;">3 Klaster: Nagoya (10), Osaka (10), Tokyo (10)</span>
        </div>
        `,
        { maxWidth: 260 }
      );
      return;
    }

    CLUSTERS.forEach((c) => {
      const isActive = activeClusterId === c.id;
      const icon = L.divIcon({
        className: 'custom-cluster-callout',
        html: buildClusterMarkerHtml(c, isActive),
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([c.lat, c.lng], {
        icon,
        zIndexOffset: isActive ? 900 : 500,
      }).addTo(layer);

      marker.bindPopup(buildClusterPopupHtml(c), {
        maxWidth: 260,
        offset: [0, -8],
      });

      marker.on('click', () => {
        setActiveClusterId(c.id);
      });
    });
  }, [activeClusterId, selectedRadius]);

  // Render Category-Specific POI Icon Pins with Anchored Selling-Point Card
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

  // Render Radius Circle & Measurement Polyline
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
        dashArray: '4, 6',
        opacity: 0.9,
      }).addTo(overlay);
    }
  }, [originPoint, selectedRadius, activePoi]);

  const handleSelectCluster = (clusterId: 'all' | ClusterData['id']) => {
    setActiveClusterId(clusterId);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (clusterId === 'all') {
      const bounds = L.latLngBounds(CLUSTERS.map((c) => [c.lat, c.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
      return;
    }

    const target = CLUSTERS.find((c) => c.id === clusterId);
    if (target) {
      map.flyTo([target.lat, target.lng], 17, { duration: 0.6 });
    }
  };

  const handleSelectRadius = (meters: number, zoom: number) => {
    setSelectedRadius(meters);
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(originPoint, zoom, { duration: 0.5 });
  };

  const handleSelectPoi = (poi: POI) => {
    setActivePoi(poi);
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = L.latLngBounds([originPoint, [poi.lat, poi.lng]]);
    map.fitBounds(bounds, { padding: [64, 64], maxZoom: 15 });
    const marker = poiMarkersRef.current[poi.name];
    if (marker) {
      setTimeout(() => marker.openPopup(), 250);
    }
  };

  return (
    <div className="bg-surface border border-warmborder rounded-lg overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-warmborder space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-terracotta font-semibold">
              Demo Spasial Interaktif
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-espresso mt-1">
              Peta 3 Klaster &amp; Analisis Radius Fasilitas
            </h3>
            <p className="text-xs sm:text-sm text-warmmuted mt-1">
              Klik ikon fasilitas atau klaster langsung di peta untuk memunculkan kartu jarak dan nilai jual di samping titik lokasi.
            </p>
          </div>

          {/* Radius Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono uppercase text-warmmuted mr-1">Radius:</span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.meters}
                type="button"
                onClick={() => handleSelectRadius(r.meters, r.zoom)}
                className={`min-h-[44px] px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
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

        {/* Cluster Switcher Bar */}
        <div className="pt-3 border-t border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-warmmuted">
            <Layers className="size-3.5 text-terracotta shrink-0" />
            <span>Fokus Klaster:</span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSelectCluster('all')}
              className={`min-h-[44px] px-3.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeClusterId === 'all'
                  ? 'bg-espresso text-sandstone border-espresso'
                  : 'bg-surface text-espresso border-warmborder hover:border-espresso/40'
              }`}
            >
              <Home className="size-3.5" />
              <span>Semua (3 Klaster)</span>
            </button>

            {CLUSTERS.map((c) => {
              const isSelected = activeClusterId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCluster(c.id)}
                  className={`min-h-[44px] px-3.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer flex items-center justify-between sm:justify-center gap-2 ${
                    isSelected
                      ? 'bg-terracotta text-white border-terracotta'
                      : 'bg-sandstone/50 text-espresso border-warmborder hover:border-espresso/40'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Home className="size-3.5 shrink-0" />
                    <span>{c.shortName}</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? 'text-white/85' : 'text-warmmuted'
                    }`}
                  >
                    {c.type.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map + Side POI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 relative min-w-0 flex flex-col">
          <div ref={mapContainerRef} className="w-full h-[360px] sm:h-[420px] lg:h-[500px] z-0" />

          {/* Active Cluster / Radius Spec Strip */}
          <div className="border-t border-warmborder bg-sandstone/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs mt-auto">
            <div className="font-semibold text-espresso">
              {activeCluster ? (
                <span>
                  {activeCluster.name} · <span className="text-terracotta">{activeCluster.type}</span> ({activeCluster.units})
                </span>
              ) : (
                <span>The Park Townhouse · 3 Klaster (Nagoya, Osaka, Tokyo)</span>
              )}
            </div>
            <span className="font-mono text-warmmuted">
              {inRadiusCount} dalam radius {(selectedRadius / 1000).toFixed(selectedRadius < 1000 ? 1 : 0)} km · {outsideCount} di luar radius
            </span>
          </div>
        </div>

        {/* POI Sidebar List */}
        <div className="lg:col-span-4 p-4 sm:p-5 bg-sandstone/30 border-t lg:border-t-0 lg:border-l border-warmborder flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-warmmuted">
                Fasilitas Sekitar
              </h4>
              <span className="text-[11px] font-mono text-olive font-semibold">
                {inRadiusCount} Masuk Radius
              </span>
            </div>

            <div className="space-y-2">
              {poisWithRadius.map((p, idx) => {
                const isSelected = activePoi?.name === p.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPoi(p)}
                    className={`w-full min-h-[44px] text-left p-3 rounded-md border transition-colors cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-surface border-terracotta border-2'
                        : p.inRadius
                        ? 'bg-surface border-warmborder hover:border-espresso/40'
                        : 'bg-surface/50 border-warmborder/60 opacity-65 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`size-8 rounded-md grid place-items-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-terracotta text-white'
                          : p.inRadius
                          ? 'bg-espresso text-sandstone'
                          : 'bg-sandstone text-warmmuted'
                      }`}
                    >
                      <PoiCategoryIcon category={p.category} className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs sm:text-sm font-bold text-espresso leading-snug">
                          {p.name}
                        </p>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                            p.inRadius
                              ? 'bg-olive/10 text-olive font-semibold'
                              : 'bg-sandstone text-warmmuted'
                          }`}
                        >
                          {p.inRadius ? 'Dalam radius' : 'Di luar radius'}
                        </span>
                      </div>
                      <p className="text-xs text-terracotta font-medium mt-1 flex items-center gap-1.5">
                        <Navigation className="size-3 shrink-0" />
                        <span>{p.approxDistance}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-warmborder text-xs text-warmmuted flex items-start gap-2">
            <CheckCircle2 className="size-4 text-olive shrink-0 mt-0.5" />
            <span>
              Klik ikon di peta atau daftar di atas untuk memunculkan kartu penjelasan tepat di samping titik lokasi.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
