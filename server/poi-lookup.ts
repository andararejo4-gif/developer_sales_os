export interface RealPoiItem {
  name: string;
  category: 'Kesehatan' | 'Pendidikan' | 'Perbelanjaan' | 'Transportasi' | 'Ibadah' | 'Ruang Terbuka';
  distanceKm: number;
  driveMinutes: number;
}

const poiCache = new Map<string, { ts: number; items: RealPoiItem[] }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function estimateDriveMinutes(distanceKm: number): number {
  // Faktor jalan 1.35x dengan kecepatan rata-rata perkotaan 30 km/jam
  return Math.max(2, Math.round(((distanceKm * 1.35) / 30) * 60));
}

function classifyOsmTags(tags: Record<string, string>): RealPoiItem['category'] | null {
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'Kesehatan';
  if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'college') return 'Pendidikan';
  if (tags.shop === 'mall' || tags.shop === 'supermarket' || tags.amenity === 'marketplace') return 'Perbelanjaan';
  if (tags.railway === 'station' || tags.aeroway === 'aerodrome' || tags.highway === 'motorway_junction') {
    return 'Transportasi';
  }
  if (tags.amenity === 'place_of_worship') return 'Ibadah';
  if (tags.leisure === 'park') return 'Ruang Terbuka';
  return null;
}

export async function fetchNearbyPoisFromOsm(
  lat: number,
  lng: number,
  radiusMeters = 4500
): Promise<RealPoiItem[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusMeters}`;
  const cached = poiCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.items;
  }

  const query = `[out:json][timeout:6];
(
  nwr["amenity"~"hospital|clinic|school|university|college|marketplace|place_of_worship"]["name"](around:${radiusMeters},${lat},${lng});
  nwr["shop"~"mall|supermarket"]["name"](around:${radiusMeters},${lat},${lng});
  nwr["railway"="station"]["name"](around:${radiusMeters},${lat},${lng});
  nwr["aeroway"="aerodrome"]["name"](around:${Math.max(radiusMeters, 8000)},${lat},${lng});
  nwr["highway"="motorway_junction"]["name"](around:${Math.max(radiusMeters, 7000)},${lat},${lng});
  nwr["leisure"="park"]["name"](around:${Math.min(radiusMeters, 3000)},${lat},${lng});
);
out center 40;`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { elements?: any[] };
    const elements = Array.isArray(json.elements) ? json.elements : [];

    const seen = new Set<string>();
    const results: RealPoiItem[] = [];
    for (const el of elements) {
      const tags = el.tags || {};
      const name = String(tags.name || '').trim();
      if (!name || name.length < 3) continue;
      const category = classifyOsmTags(tags);
      if (!category) continue;

      const elLat = Number(el.lat ?? el.center?.lat);
      const elLng = Number(el.lon ?? el.center?.lon);
      if (!Number.isFinite(elLat) || !Number.isFinite(elLng)) continue;

      const key = `${category}::${name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const distanceKm = haversineDistanceKm(lat, lng, elLat, elLng);
      results.push({
        name,
        category,
        distanceKm,
        driveMinutes: estimateDriveMinutes(distanceKm),
      });
    }

    // Batasi per kategori agar seimbang (maks 4 per kategori, total maks 18 POI)
    results.sort((a, b) => a.distanceKm - b.distanceKm);
    const perCat: Record<string, number> = {};
    const balanced: RealPoiItem[] = [];
    for (const item of results) {
      const count = perCat[item.category] || 0;
      if (count >= 4) continue;
      perCat[item.category] = count + 1;
      balanced.push(item);
      if (balanced.length >= 18) break;
    }

    poiCache.set(cacheKey, { ts: Date.now(), items: balanced });
    return balanced;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
