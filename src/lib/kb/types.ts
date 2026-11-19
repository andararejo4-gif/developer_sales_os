// Types untuk Product Knowledge Base (Fase 1A)

export interface KbFact {
  fact_id: string;
  category: 
    | 'identitas'
    | 'lokasi_akses'
    | 'spesifikasi_bangunan'
    | 'tipe_harga'
    | 'skema_pembayaran_promo'
    | 'fasilitas_kawasan'
    | 'fasilitas_unit'
    | 'legalitas'
    | 'kontak'
    | 'syarat_ketentuan';
  key: string;
  value: string;
  unit?: string;
  source_citation: string; // misal: 'Brosur Hal. 2', 'Pricelist Kolom B'
  status: 'terverifikasi' | 'perlu_dicek' | 'dikoreksi_manual';
  confidence: number;
  boleh_publik: boolean;
  valid_until?: string;
}

export interface LocationHaversineFact {
  place_name: string;
  category: string;
  latitude: number;
  longitude: number;
  straight_distance_km: number;
  travel_time_minutes: number;
  source_label: string;
}

// Rumus Haversine untuk menghitung jarak garis lurus dari 2 titik GPS
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}
