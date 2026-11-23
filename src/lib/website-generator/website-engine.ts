import { THE_PARK_DEFAULT_WEBSITE_CONFIG } from './the-park-landing-data';
import type { ProjectWebsiteConfig, WebsiteUnitType } from './types';
import { loadPersistedState, savePersistedState } from '../navigation/router';
import type { CompanyProject } from '../projects/projects-data';

export function getProjectWebsiteConfig(projectId: string): ProjectWebsiteConfig | null {
  const isPark = projectId === 'the-park-sukoharjo' || projectId === 'proj-the-park-01';
  if (isPark) return THE_PARK_DEFAULT_WEBSITE_CONFIG;

  return loadPersistedState<ProjectWebsiteConfig | null>(`devos_website_config_${projectId}`, null);
}

export function initProjectWebsiteConfig(
  projectId: string,
  projectName: string,
  project?: CompanyProject
): ProjectWebsiteConfig {
  const cleanSubdomain = (project?.kode || projectName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const isSubsidi = project?.tipe === 'Subsidi';
  const isMenengah = project?.tipe === 'Menengah';

  const defaultUnits: WebsiteUnitType[] = isSubsidi
    ? [
        {
          cluster: 'Blok Anggrek',
          name: 'Tipe 36/60 Subsidi FLPP',
          typeCode: 'Tipe 36/60',
          buildingAreaM2: 36,
          landAreaM2: 60,
          bedrooms: 2,
          bathrooms: 1,
          carports: 1,
          startingPriceIdr: 185000000,
          keyFeatures: ['Rangka Atap Baja Ringan', 'Kusen Aluminium', 'Listrik 1300 VA', 'Air Sumur Bor Bersih'],
        },
      ]
    : isMenengah
    ? [
        {
          cluster: 'Cluster Asri',
          name: 'Tipe 45/72 Harmoni',
          typeCode: 'Tipe 45/72',
          buildingAreaM2: 45,
          landAreaM2: 72,
          bedrooms: 2,
          bathrooms: 1,
          carports: 1,
          startingPriceIdr: 450000000,
          keyFeatures: ['Bata Merah Plester Aci', 'Taman Depan & Belakang', 'SHM Pecah Siap AJB', 'One Gate System'],
        },
        {
          cluster: 'Cluster Sakura',
          name: 'Tipe 60/90 Family',
          typeCode: 'Tipe 60/90',
          buildingAreaM2: 60,
          landAreaM2: 90,
          bedrooms: 3,
          bathrooms: 2,
          carports: 2,
          startingPriceIdr: 650000000,
          keyFeatures: ['Plafon 3.5m Sejuk', 'Ruang Keluarga Lapang', 'Carport 2 Mobil', 'Security 24 Jam CCTV'],
        },
      ]
    : [
        {
          cluster: 'Cluster Utama',
          name: `${projectName} Premium`,
          typeCode: 'Tipe 75/90',
          buildingAreaM2: 75,
          landAreaM2: 90,
          bedrooms: 3,
          bathrooms: 2,
          carports: 2,
          startingPriceIdr: 850000000,
          keyFeatures: ['Bata Merah Plester Aci', 'Plafon 3.8m Sejuk', 'SHM Pecah Siap Balik Nama', 'Carport 2 Mobil'],
        },
      ];

  const heroHeadline = isSubsidi
    ? `Hunian Subsidi Terjangkau & Nyaman di ${projectName}`
    : isMenengah
    ? `Ketenangan Hidup Modern Bernuansa Hijau di ${projectName}`
    : `Kenyamanan & Eksklusivitas Hidup Modern di ${projectName}`;

  const heroSubheadline =
    project?.deskripsi ||
    `Hunian berkualitas dengan sertifikat SHM sudah pecah per kavling, legalitas aman, dan akses strategis di kawasan ${project?.lokasi || 'Sukoharjo'}.`;

  const config: ProjectWebsiteConfig = {
    projectId,
    projectName,
    subdomain: cleanSubdomain,
    siteTitle: `${projectName} — ${project?.tipe || 'Hunian'} Pilihan`,
    heroHeadline,
    heroSubheadline,
    units: defaultUnits,
    simulationDefaults: {
      defaultDpPercent: isSubsidi ? 5 : 10,
      interestRatePercent: isSubsidi ? 5.0 : 4.75,
      availableTenors: [5, 10, 15, 20],
      disclaimer:
        '*Perhitungan simulasi ini bersifat estimasi matematis dan bukan merupakan penawaran pembiayaan yang mengikat. Syarat dan suku bunga aktual ditentukan oleh bank penyalur KPR.',
    },
    faqs: [
      {
        question: `Bagaimana status legalitas tanah dan izin bangunan di ${projectName}?`,
        answer: `Seluruh unit ${projectName} telah memiliki Sertifikat Hak Milik (SHM) yang sudah pecah per kavling masing-masing dan Persetujuan Bangunan Gedung (PBG) resmi. Anda dapat langsung memproses Akta Jual Beli (AJB) di hadapan PPAT.`,
      },
      {
        question: `Berapa jarak riil dari komplek menuju pusat fasilitas terdekat?`,
        answer: `${projectName} terletak strategis di ${project?.lokasi || 'Sukoharjo'}, dekat dengan fasilitas pendidikan, pusat perbelanjaan, dan layanan kesehatan umum.`,
      },
      {
        question: `Apakah ada fasilitas cicilan langsung ke pengembang tanpa KPR bank?`,
        answer: `Ya, kami menyediakan opsi Cash Bertahap langsung ke developer, di samping skema pelunasan Cash Keras berdiskon dan KPR bank rekanan.`,
      },
    ],
    whatsappNumber: '6281234567890',
    whatsappMessage: `Halo Tim Pemasaran ${projectName}, saya tertarik dengan informasi unit dan ingin berkonsultasi mengenai simulasi cicilan serta survei lokasi.`,
    publishedUrl: `https://${cleanSubdomain}.developerproperti.glivepro.com`,
  };

  savePersistedState(`devos_website_config_${projectId}`, config);
  return config;
}
