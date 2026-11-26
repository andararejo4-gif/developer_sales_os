/**
 * Manajemen Pengguna Khusus IT Developer (Role IT Per Developer)
 * Otoritas: Menambahkan & mengelola akun tim dari SE sampai Direksi,
 * dibatasi secara ketat hanya untuk developer/perusahaan yang dipegangnya (Tenant Isolation).
 */

import type { RoleKey } from '../../data';
import { loadPersistedState, savePersistedState } from '../navigation/router';
import { registerDeveloperAccount } from './dummy-accounts';

export interface DeveloperTeamUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleKey;
  roleLabel: string;
  developerCompany: string;
  assignedProjectName: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  createdBy: string;
}

export const IT_MANAGEABLE_ROLES: {
  role: RoleKey;
  label: string;
  badgeColor: string;
  description: string;
}[] = [
  {
    role: 'SE',
    label: 'Sales Executive (SE)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Tenaga penjualan lapangan, input lead, booking, dan absensi',
  },
  {
    role: 'TL',
    label: 'Team Leader (TL)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Supervisor tim sales, evaluasi harian, dan pembagian prospek',
  },
  {
    role: 'SM',
    label: 'Sales Manager (SM)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Pengendali strategi penjualan, supervisi tim SE, dan skenario target',
  },
  {
    role: 'ADMIN',
    label: 'Admin Sales & Operasional',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Verifikasi booking, pemberkasan KPR, dan rekening resmi',
  },
  {
    role: 'DIGITAL_MARKETING',
    label: 'Digital Marketer',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300',
    description: 'Pengelola kampanye iklan Meta/Google Ads & integrasi CPL',
  },
  {
    role: 'DIREKSI',
    label: 'Direksi / Owner Developer',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Pemilik developer, pemantau laporan portofolio eksekutif',
  },
];

export const INITIAL_ANDARA_USERS: DeveloperTeamUser[] = [
  {
    id: 'usr-bs-01',
    name: 'Bambang Soedirjo',
    email: 'direksi@andararejomakmur.co.id',
    phone: '081122334401',
    role: 'DIREKSI',
    roleLabel: 'Direksi / Owner Developer Properti',
    developerCompany: 'PT Andara Rejo Makmur',
    assignedProjectName: 'Semua Proyek Portofolio',
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00Z',
    createdBy: 'Sistem Inisialisasi',
  },
  {
    id: 'usr-fk-02',
    name: 'Ferry Kurniawan',
    email: 'sm@andararejomakmur.co.id',
    phone: '081122334402',
    role: 'SM',
    roleLabel: 'Sales Manager (Semi-AI)',
    developerCompany: 'PT Andara Rejo Makmur',
    assignedProjectName: 'The Park Townhouse Sukoharjo',
    status: 'ACTIVE',
    createdAt: '2026-01-12T08:00:00Z',
    createdBy: 'Bambang Soedirjo (Direksi)',
  },
  {
    id: 'usr-sr-03',
    name: 'Siti Rahma',
    email: 'admin.sales@andararejomakmur.co.id',
    phone: '081122334421',
    role: 'ADMIN',
    roleLabel: 'Admin Sales & Transaksi',
    developerCompany: 'PT Andara Rejo Makmur',
    assignedProjectName: 'The Park Townhouse Sukoharjo',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00Z',
    createdBy: 'Ferry Kurniawan (SM)',
  },
  {
    id: 'usr-dh-04',
    name: 'Dodi Hartono',
    email: 'it@andararejomakmur.co.id',
    phone: '081122334431',
    role: 'IT',
    roleLabel: 'IT & System Developer',
    developerCompany: 'PT Andara Rejo Makmur',
    assignedProjectName: 'Platform Integrasi Properti',
    status: 'ACTIVE',
    createdAt: '2026-01-08T08:00:00Z',
    createdBy: 'Bambang Soedirjo (Direksi)',
  },
  {
    id: 'usr-ap-05',
    name: 'Agus Prasetyo',
    email: 'marketer@andararejomakmur.co.id',
    phone: '081122334441',
    role: 'DIGITAL_MARKETING',
    roleLabel: 'Digital Marketer',
    developerCompany: 'PT Andara Rejo Makmur',
    assignedProjectName: 'The Park Townhouse Sukoharjo',
    status: 'ACTIVE',
    createdAt: '2026-02-01T08:00:00Z',
    createdBy: 'Ferry Kurniawan (SM)',
  },
  {
    id: 'usr-rp-06',
    name: 'Raka Pratama',
    email: 'raka@andararejomakmur.co.id',
    phone: '081122334411',
    role: 'SE',
    roleLabel: 'Sales Executive Mewah',
    developerCompany: 'PT Andara Rejo Makmur',
    assignedProjectName: 'The Park Townhouse Sukoharjo',
    status: 'ACTIVE',
    createdAt: '2026-02-05T08:00:00Z',
    createdBy: 'Dodi Hartono (IT)',
  },
  {
    id: 'usr-dl-07',
    name: 'Dian Lestari',
    email: 'dian@andararejomakmur.co.id',
    phone: '081122334412',
    role: 'SE',
    roleLabel: 'Sales Executive FLPP',
    developerCompany: 'PT Andara Rejo Makmur',
    assignedProjectName: 'Griya Andara Asri Sukoharjo',
    status: 'ACTIVE',
    createdAt: '2026-02-10T08:00:00Z',
    createdBy: 'Dodi Hartono (IT)',
  },
  {
    id: 'usr-bs-08',
    name: 'Budi Santoso',
    email: 'budi@andararejomakmur.co.id',
    phone: '081122334413',
    role: 'SE',
    roleLabel: 'Sales Executive Menengah',
    developerCompany: 'PT Andara Rejo Makmur',
    assignedProjectName: 'Andara Village Boyolali',
    status: 'ACTIVE',
    createdAt: '2026-02-15T08:00:00Z',
    createdBy: 'Dodi Hartono (IT)',
  },
];

const DEV_USERS_KEY_PREFIX = 'devos_tenant_users_v1';

let inMemoryTenantUsers: Record<string, DeveloperTeamUser[]> = {};

function getStorageKey(companyName: string): string {
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${DEV_USERS_KEY_PREFIX}_${slug}`;
}

export function loadDeveloperUsers(companyName = 'PT Andara Rejo Makmur'): DeveloperTeamUser[] {
  const normCompany = companyName.trim() || 'PT Andara Rejo Makmur';
  if (inMemoryTenantUsers[normCompany]) {
    return inMemoryTenantUsers[normCompany];
  }

  const fallback =
    normCompany.toLowerCase().includes('andara') ? INITIAL_ANDARA_USERS : [];

  const key = getStorageKey(normCompany);
  const persisted = loadPersistedState<DeveloperTeamUser[] | null>(key, null);
  if (persisted && Array.isArray(persisted) && persisted.length > 0) {
    inMemoryTenantUsers[normCompany] = persisted;
    return persisted;
  }

  inMemoryTenantUsers[normCompany] = fallback;
  return fallback;
}

export function saveDeveloperUsers(companyName: string, users: DeveloperTeamUser[]): void {
  const normCompany = companyName.trim() || 'PT Andara Rejo Makmur';
  inMemoryTenantUsers[normCompany] = users;
  const key = getStorageKey(normCompany);
  savePersistedState(key, users);
}

export interface AddDeveloperUserParams {
  name: string;
  email: string;
  phone: string;
  role: RoleKey;
  developerCompany: string;
  assignedProjectName: string;
  password?: string;
  createdBy?: string;
}

export function addDeveloperUser(params: AddDeveloperUserParams): {
  ok: boolean;
  user: DeveloperTeamUser;
  error?: string;
} {
  const normName = params.name.trim();
  const normEmail = params.email.trim().toLowerCase();
  const normPhone = params.phone.trim();
  const company = params.developerCompany.trim() || 'PT Andara Rejo Makmur';

  if (!normName || !normEmail) {
    return { ok: false, user: {} as DeveloperTeamUser, error: 'Nama dan email pengguna wajib diisi.' };
  }

  const existingUsers = loadDeveloperUsers(company);
  if (existingUsers.some((u) => u.email.toLowerCase() === normEmail)) {
    return { ok: false, user: {} as DeveloperTeamUser, error: 'Email ini sudah terdaftar di developer ini.' };
  }

  const roleMeta = IT_MANAGEABLE_ROLES.find((r) => r.role === params.role);
  const roleLabel = roleMeta ? roleMeta.label : `Role ${params.role}`;

  const newUser: DeveloperTeamUser = {
    id: `usr-${Date.now()}`,
    name: normName,
    email: normEmail,
    phone: normPhone || '081200000000',
    role: params.role,
    roleLabel,
    developerCompany: company,
    assignedProjectName: params.assignedProjectName || 'Semua Proyek',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    createdBy: params.createdBy || 'IT Developer',
  };

  const updatedList = [newUser, ...existingUsers];
  saveDeveloperUsers(company, updatedList);

  // Daftarkan ke sistem autentikasi aplikasi agar akun baru langsung bisa login
  registerDeveloperAccount({
    companyName: company,
    name: normName,
    email: normEmail,
    password: params.password || `Andara${params.role}#2026`,
    phone: normPhone,
    role: params.role,
  });

  return { ok: true, user: newUser };
}

export function toggleDeveloperUserStatus(
  userId: string,
  companyName = 'PT Andara Rejo Makmur'
): { ok: boolean; newStatus?: 'ACTIVE' | 'INACTIVE'; error?: string } {
  const users = loadDeveloperUsers(companyName);
  let targetUserStatus: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  const updated = users.map((u) => {
    if (u.id === userId) {
      targetUserStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      return { ...u, status: targetUserStatus };
    }
    return u;
  });

  saveDeveloperUsers(companyName, updated);
  return { ok: true, newStatus: targetUserStatus };
}
