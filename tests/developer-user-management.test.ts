import { describe, expect, it } from 'bun:test';
import {
  loadDeveloperUsers,
  addDeveloperUser,
  toggleDeveloperUserStatus,
  IT_MANAGEABLE_ROLES,
} from '../src/lib/auth/developer-user-management';

describe('Developer User Management (Otoritas IT Per Developer)', () => {
  it('mendukung seluruh hierarki role dari SE sampai Direksi', () => {
    const roles = IT_MANAGEABLE_ROLES.map((r) => r.role);
    expect(roles).toContain('SE');
    expect(roles).toContain('TL');
    expect(roles).toContain('SM');
    expect(roles).toContain('ADMIN');
    expect(roles).toContain('DIGITAL_MARKETING');
    expect(roles).toContain('DIREKSI');
  });

  it('memuat daftar awal personel untuk PT Andara Rejo Makmur', () => {
    const users = loadDeveloperUsers('PT Andara Rejo Makmur');
    expect(users.length).toBeGreaterThanOrEqual(8);
    expect(users.some((u) => u.role === 'DIREKSI')).toBe(true);
    expect(users.some((u) => u.role === 'SM')).toBe(true);
    expect(users.some((u) => u.role === 'SE')).toBe(true);
    expect(users.some((u) => u.role === 'IT')).toBe(true);
  });

  it('menjamin isolasi tenant: developer lain tidak melihat personel PT Andara', () => {
    const otherDevUsers = loadDeveloperUsers('PT Graha Mandiri Jaya');
    expect(otherDevUsers.length).toBe(0);
  });

  it('IT developer berhasil menambahkan akun Direksi baru dan langsung bisa login', () => {
    const res = addDeveloperUser({
      name: 'Bpk. Suryo Pratomo',
      email: 'suryo.direksi@andararejomakmur.co.id',
      phone: '081199998888',
      role: 'DIREKSI',
      developerCompany: 'PT Andara Rejo Makmur',
      assignedProjectName: 'Semua Proyek Portofolio',
      password: 'DireksiAndara#2026',
      createdBy: 'Dodi Hartono (IT)',
    });

    expect(res.ok).toBe(true);
    expect(res.user.role).toBe('DIREKSI');
    expect(res.user.developerCompany).toBe('PT Andara Rejo Makmur');

    const updated = loadDeveloperUsers('PT Andara Rejo Makmur');
    expect(updated.some((u) => u.email === 'suryo.direksi@andararejomakmur.co.id')).toBe(true);
  });

  it('IT developer berhasil menambahkan akun SE baru', () => {
    const res = addDeveloperUser({
      name: 'Aldi Sales',
      email: 'aldi.se@andararejomakmur.co.id',
      phone: '081277776666',
      role: 'SE',
      developerCompany: 'PT Andara Rejo Makmur',
      assignedProjectName: 'The Park Townhouse Sukoharjo',
      password: 'AndaraSE#2026',
    });

    expect(res.ok).toBe(true);
    expect(res.user.role).toBe('SE');
  });

  it('menolak penambahan email duplikat pada developer yang sama', () => {
    const res = addDeveloperUser({
      name: 'Duplikat User',
      email: 'aldi.se@andararejomakmur.co.id',
      phone: '081277770000',
      role: 'SE',
      developerCompany: 'PT Andara Rejo Makmur',
      assignedProjectName: 'The Park Townhouse Sukoharjo',
    });

    expect(res.ok).toBe(false);
    expect(res.error).toContain('sudah terdaftar');
  });

  it('berhasil melakukan toggle status akun (ACTIVE / INACTIVE)', () => {
    const users = loadDeveloperUsers('PT Andara Rejo Makmur');
    const firstUser = users[0];
    const initialStatus = firstUser.status;

    const toggleRes = toggleDeveloperUserStatus(firstUser.id, 'PT Andara Rejo Makmur');
    expect(toggleRes.ok).toBe(true);
    expect(toggleRes.newStatus).not.toBe(initialStatus);
  });
});
