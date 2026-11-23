import { INITIAL_UNITS, type UnitProperty } from '../../data';

// Master Data Proyek Perusahaan PT Andara Rejo Makmur
// Multi-Project Architecture untuk Seluruh Roles (SE, TL, SM, DM, ADMIN, DIREKSI, IT)

export interface ProjectGeneratedOutputs {
  suratCinta: boolean;
  risetPasar: boolean;
  targetPenjualan: boolean;
  kalenderKonten: boolean;
  playbook: boolean;
  ruteHarian: boolean;
}

export interface CompanyProject {
  id: string;
  nama: string;
  kode: string;
  tipe: 'Mewah' | 'Menengah' | 'Subsidi';
  lokasi: string;
  totalUnit: number;
  unitTersedia: number;
  unitBooking: number;
  unitTerjual: number;
  kisaranHarga: string;
  status: 'aktif' | 'pra_peluncuran' | 'sold_out';
  deskripsi: string;
  koordinatGps?: string;
  radiusKm?: number;
  katalogFile?: string;
  pricelistFile?: string;
  generatedOutputs?: ProjectGeneratedOutputs;
}

export const COMPANY_PROJECTS: CompanyProject[] = [
  {
    id: 'the-park-sukoharjo',
    nama: 'The Park Townhouse Sukoharjo',
    kode: 'TPT',
    tipe: 'Mewah',
    lokasi: 'Mandan, Sukoharjo (Koridor Solo Baru)',
    totalUnit: 30,
    unitTersedia: 18,
    unitBooking: 7,
    unitTerjual: 5,
    kisaranHarga: 'Rp 830 Jt - Rp 1,4 M',
    status: 'aktif',
    deskripsi: 'Hunian butik 2 lantai eksklusif 30 unit dengan SHM pecah, bata merah, dan akses 7 menit ke Solo Baru.',
    koordinatGps: '-7.673872, 110.843978',
    radiusKm: 25,
    katalogFile: 'e-katalog_the_park_townhouse.pdf',
    pricelistFile: 'pricelist_the_park_30_unit.xlsx',
    generatedOutputs: {
      suratCinta: true,
      risetPasar: true,
      targetPenjualan: true,
      kalenderKonten: true,
      playbook: true,
      ruteHarian: true,
    },
  },
  {
    id: 'andara-village',
    nama: 'Andara Village Sukoharjo',
    kode: 'AVS',
    tipe: 'Menengah',
    lokasi: 'Gentan, Baki, Sukoharjo',
    totalUnit: 45,
    unitTersedia: 24,
    unitBooking: 9,
    unitTerjual: 12,
    kisaranHarga: 'Rp 450 Jt - Rp 750 Jt',
    status: 'aktif',
    deskripsi: 'Kompleks perumahan modern minimalis 45 unit keluarga muda dengan fasilitas taman dan one gate system.',
    koordinatGps: '-7.595430, 110.784220',
    radiusKm: 25,
    katalogFile: 'e-katalog_andara_village.pdf',
    pricelistFile: 'pricelist_andara_village_45_unit.xlsx',
    generatedOutputs: {
      suratCinta: false,
      risetPasar: false,
      targetPenjualan: false,
      kalenderKonten: false,
      playbook: false,
      ruteHarian: false,
    },
  },
  {
    id: 'griya-andara-asri',
    nama: 'Griya Andara Asri',
    kode: 'GAA',
    tipe: 'Subsidi',
    lokasi: 'Sukoharjo Kota',
    totalUnit: 60,
    unitTersedia: 60,
    unitBooking: 0,
    unitTerjual: 0,
    kisaranHarga: 'Rp 185 Jt (Skema FLPP/KPR Bersubsidi)',
    status: 'pra_peluncuran',
    deskripsi: 'Perumahan bersubsidi 60 unit tahap pra-peluncuran untuk masyarakat berpenghasilan rendah dengan legalitas terjamin.',
    koordinatGps: '-7.684120, 110.832910',
    radiusKm: 25,
    katalogFile: 'brosur_griya_andara_subsidi.pdf',
    pricelistFile: 'pricelist_skema_flpp_60_unit.xlsx',
    generatedOutputs: {
      suratCinta: false,
      risetPasar: false,
      targetPenjualan: false,
      kalenderKonten: false,
      playbook: false,
      ruteHarian: false,
    },
  },
];

export const DEFAULT_PROJECT_ID = 'the-park-sukoharjo';

export const PROJECT_STORAGE_KEY = 'devos_active_project_id_v1';
export const ALL_PROJECTS_STORAGE_KEY = 'devos_all_projects_v1';

let inMemoryProjects: CompanyProject[] = [...COMPANY_PROJECTS];

export function loadAllProjects(): CompanyProject[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(ALL_PROJECTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryProjects = parsed;
          return parsed;
        }
      }
    }
  } catch {
    /* fallback */
  }
  return inMemoryProjects;
}

export function saveNewProject(data: {
  nama: string;
  kode?: string;
  tipe?: 'Mewah' | 'Menengah' | 'Subsidi';
  lokasi?: string;
  totalUnit?: number;
  kisaranHarga?: string;
  deskripsi?: string;
  koordinatGps?: string;
  radiusKm?: number;
  katalogFile?: string;
  pricelistFile?: string;
  generatedOutputs?: Partial<ProjectGeneratedOutputs>;
}): CompanyProject {
  const current = loadAllProjects();
  const slug = (data.nama || 'proyek-baru')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const id = `${slug}-${Date.now().toString().slice(-4)}`;

  const totalUnit = data.totalUnit && data.totalUnit > 0 ? data.totalUnit : 30;
  const newProject: CompanyProject = {
    id,
    nama: data.nama,
    kode: data.kode?.trim() || data.nama.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase(),
    tipe: data.tipe || 'Menengah',
    lokasi: data.lokasi?.trim() || 'Sukoharjo',
    totalUnit,
    unitTersedia: totalUnit,
    unitBooking: 0,
    unitTerjual: 0,
    kisaranHarga: data.kisaranHarga?.trim() || 'Rp 500 Jt - Rp 800 Jt',
    status: 'aktif',
    deskripsi: data.deskripsi?.trim() || `Proyek hunian ${data.nama} oleh PT Andara Rejo Makmur.`,
    koordinatGps: data.koordinatGps?.trim() || '-7.673872, 110.843978',
    radiusKm: data.radiusKm ?? 25,
    katalogFile: data.katalogFile || `katalog_${slug}.pdf`,
    pricelistFile: data.pricelistFile || `pricelist_${slug}.xlsx`,
    generatedOutputs: {
      suratCinta: true,
      risetPasar: true,
      targetPenjualan: true,
      kalenderKonten: true,
      playbook: true,
      ruteHarian: true,
      ...data.generatedOutputs,
    },
  };

  const updated = [...current, newProject];
  inMemoryProjects = updated;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ALL_PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    /* ignore */
  }

  // Buat default unit untuk proyek baru
  const units: UnitProperty[] = [];
  for (let i = 1; i <= totalUnit; i++) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    units.push({
      id: `${newProject.id}-${i}`,
      cluster: 'Cluster Utama',
      namaUnit: `A.${pad}`,
      tipeUnit: 'Tipe 45/72',
      luasTanah: 72,
      luasBangunan: 45,
      hargaCashKeras: 500000000,
      hargaCash6: 515000000,
      hargaCash12: 535000000,
      hargaCash24: 565000000,
      keterangan: `Unit A.${pad} di ${newProject.nama}`,
      status: 'tersedia',
    });
  }
  saveUnitsForProject(newProject.id, units);

  return newProject;
}

export function getProjectById(projectId?: string | null): CompanyProject {
  const all = loadAllProjects();
  const found = all.find((p) => p.id === projectId);
  return found ?? all[0] ?? COMPANY_PROJECTS[0];
}

let inMemoryProjectId = DEFAULT_PROJECT_ID;

export function loadSavedProjectId(): string {
  try {
    if (typeof localStorage === 'undefined') return inMemoryProjectId;
    const saved = localStorage.getItem(PROJECT_STORAGE_KEY) || inMemoryProjectId;
    const all = loadAllProjects();
    if (saved && all.some((p) => p.id === saved)) {
      return saved;
    }
    return inMemoryProjectId;
  } catch {
    return inMemoryProjectId;
  }
}

export function saveSelectedProjectId(projectId: string): void {
  inMemoryProjectId = projectId;
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
  } catch {
    /* ignore */
  }
}

// Master Unit Generator per Proyek
function generateAndaraVillageUnits(): UnitProperty[] {
  const units: UnitProperty[] = [];
  const clusters = [
    { name: 'Bougenville', code: 'A', tipe: 'Tipe 60/90', lt: 90, lb: 60, basePrice: 650000000, count: 15 },
    { name: 'Cempaka', code: 'B', tipe: 'Tipe 45/72', lt: 72, lb: 45, basePrice: 520000000, count: 15 },
    { name: 'Jasmine', code: 'C', tipe: 'Tipe 36/60', lt: 60, lb: 36, basePrice: 450000000, count: 15 },
  ];

  let idCounter = 1;
  let terjualCount = 0;
  let bookingCount = 0;

  for (const c of clusters) {
    for (let i = 1; i <= c.count; i++) {
      const padNum = i < 10 ? `0${i}` : `${i}`;
      let status: 'tersedia' | 'hold' | 'booking' | 'terjual' = 'tersedia';
      if (terjualCount < 12 && i % 3 === 0) {
        status = 'terjual';
        terjualCount++;
      } else if (bookingCount < 9 && i % 4 === 0) {
        status = 'booking';
        bookingCount++;
      }

      const pCash = c.basePrice + (i * 5000000);
      units.push({
        id: `av-${idCounter++}`,
        cluster: c.name,
        namaUnit: `${c.code}.${padNum}`,
        tipeUnit: c.tipe,
        luasTanah: c.lt,
        luasBangunan: c.lb,
        hargaCashKeras: pCash,
        hargaCash6: Math.round(pCash * 1.03),
        hargaCash12: Math.round(pCash * 1.06),
        hargaCash24: Math.round(pCash * 1.12),
        keterangan: `Unit ${c.name} ${c.code}.${padNum}, One Gate System, Air PDAM & Sumur Bor`,
        status,
      });
    }
  }
  return units;
}

function generateGriyaAndaraUnits(): UnitProperty[] {
  const units: UnitProperty[] = [];
  const blocks = [
    { name: 'Blok A', code: 'A', count: 20 },
    { name: 'Blok B', code: 'B', count: 20 },
    { name: 'Blok C', code: 'C', count: 20 },
  ];

  let idCounter = 1;
  const flppPrice = 185000000;

  for (const b of blocks) {
    for (let i = 1; i <= b.count; i++) {
      const padNum = i < 10 ? `0${i}` : `${i}`;
      units.push({
        id: `gaa-${idCounter++}`,
        cluster: b.name,
        namaUnit: `${b.code}.${padNum}`,
        tipeUnit: 'Subsidi 36/60',
        luasTanah: 60,
        luasBangunan: 36,
        hargaCashKeras: flppPrice,
        hargaCash6: flppPrice,
        hargaCash12: flppPrice,
        hargaCash24: flppPrice,
        keterangan: `Rumah Bersubsidi FLPP Cicilan Rp 1 Jt-an Flat, SHM Pecah, Siap Huni`,
        status: 'tersedia',
      });
    }
  }
  return units;
}

const ANDARA_VILLAGE_INITIAL_UNITS: UnitProperty[] = generateAndaraVillageUnits();
const GRIYA_ANDARA_INITIAL_UNITS: UnitProperty[] = generateGriyaAndaraUnits();

export function getUnitsForProject(projectId: string): UnitProperty[] {
  if (projectId === 'andara-village') {
    return structuredClone(ANDARA_VILLAGE_INITIAL_UNITS);
  }
  if (projectId === 'griya-andara-asri') {
    return structuredClone(GRIYA_ANDARA_INITIAL_UNITS);
  }
  return structuredClone(INITIAL_UNITS);
}

const inMemoryUnitsStore: Record<string, UnitProperty[]> = {};

export function loadUnitsForProject(projectId: string): UnitProperty[] {
  const storageKey = `devos_units_${projectId}`;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    /* fallback */
  }

  if (inMemoryUnitsStore[projectId]) {
    return inMemoryUnitsStore[projectId];
  }

  const initial = getUnitsForProject(projectId);
  inMemoryUnitsStore[projectId] = initial;
  return initial;
}

export function saveUnitsForProject(projectId: string, units: UnitProperty[]): void {
  inMemoryUnitsStore[projectId] = units;
  const storageKey = `devos_units_${projectId}`;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(units));
    }
  } catch {
    /* ignore */
  }
}
