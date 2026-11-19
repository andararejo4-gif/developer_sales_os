import { describe, expect, it } from 'bun:test';
import { filterByTenant, verifyTenantOwnership, TenantAccessError, UserSessionContext } from '../src/lib/db/tenant-guard';

describe('Multi-Tenant Data Isolation Test', () => {
  const userTenantA: UserSessionContext = {
    userId: 'user-001',
    tenantId: 'tenant-a-andara',
    role: 'SALES_EXECUTIVE'
  };

  const userTenantB: UserSessionContext = {
    userId: 'user-002',
    tenantId: 'tenant-b-ciputra',
    role: 'DEVELOPER_OWNER'
  };

  const superAdminUser: UserSessionContext = {
    userId: 'super-001',
    tenantId: null,
    role: 'SUPERADMIN'
  };

  const sampleProjects = [
    { id: 'proj-01', tenant_id: 'tenant-a-andara', name: 'The Park Townhouse Sukoharjo' },
    { id: 'proj-02', tenant_id: 'tenant-a-andara', name: 'Grand Andara Residence' },
    { id: 'proj-03', tenant_id: 'tenant-b-ciputra', name: 'Citra Garden City Solo' }
  ];

  it('User Tenant A hanya boleh melihat proyek miliknya (2 proyek)', () => {
    const results = filterByTenant(sampleProjects, userTenantA);
    expect(results.length).toBe(2);
    expect(results.every(p => p.tenant_id === 'tenant-a-andara')).toBe(true);
    expect(results.some(p => p.name === 'Citra Garden City Solo')).toBe(false);
  });

  it('User Tenant B hanya boleh melihat proyek miliknya (1 proyek)', () => {
    const results = filterByTenant(sampleProjects, userTenantB);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Citra Garden City Solo');
  });

  it('User Tenant A harus dilempar TenantAccessError saat mencoba menembus data Tenant B', () => {
    expect(() => {
      filterByTenant(sampleProjects, userTenantA, 'tenant-b-ciputra');
    }).toThrow(TenantAccessError);
  });

  it('verifyTenantOwnership harus melempar error saat user A mencoba memodifikasi entitas milik B', () => {
    const projectB = sampleProjects[2];
    expect(() => {
      verifyTenantOwnership(projectB, userTenantA);
    }).toThrow(TenantAccessError);
  });

  it('SUPERADMIN diizinkan melihat semua proyek atau memfilter spesifik', () => {
    const allProjects = filterByTenant(sampleProjects, superAdminUser);
    expect(allProjects.length).toBe(3);

    const filteredForB = filterByTenant(sampleProjects, superAdminUser, 'tenant-b-ciputra');
    expect(filteredForB.length).toBe(1);
  });
});
