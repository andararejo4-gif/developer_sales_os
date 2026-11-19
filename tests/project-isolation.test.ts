import { describe, expect, it } from 'bun:test';
import { 
  canUserAccessProject, 
  filterByProjectScope, 
  canApproveAssignment, 
  computeDireksiRevenue,
  ProjectAccessError, 
  ProjectMember 
} from '../src/lib/membership/project-guard';

describe('Project-Level Access Isolation & Multi-Project Governance', () => {
  const sampleMemberships: ProjectMember[] = [
    {
      id: 'mem-1',
      tenant_id: 'tenant-andara',
      project_id: 'proj-the-park',
      user_id: 'user-se-raka',
      role_di_proyek: 'SALES_EXECUTIVE',
      bisa_menyetujui_penugasan: false,
      is_active: true
    },
    {
      id: 'mem-2',
      tenant_id: 'tenant-andara',
      project_id: 'proj-the-park',
      user_id: 'user-sm-ferry',
      role_di_proyek: 'SALES_MANAGER',
      bisa_menyetujui_penugasan: true, // SM berwenang menyetujui penugasan
      is_active: true
    }
  ];

  const sampleLeads = [
    { id: 'lead-01', project_id: 'proj-the-park', name: 'Pak Hendra (The Park)' },
    { id: 'lead-02', project_id: 'proj-the-park', name: 'Ibu Melisa (The Park)' },
    { id: 'lead-03', project_id: 'proj-andara-regency', name: 'Pak Surya (Proyek Lain)' }
  ];

  it('SE Proyek A hanya dapat mengakses lead Proyek A dan dilarang melihat Proyek B', () => {
    // Akses ke proyek sendiri: sukses
    const allowed = filterByProjectScope(
      sampleLeads,
      'SALES_EXECUTIVE',
      'user-se-raka',
      'proj-the-park',
      sampleMemberships
    );
    expect(allowed.length).toBe(2);
    expect(allowed.every(l => l.project_id === 'proj-the-park')).toBe(true);

    // Percobaan akses ke proyek kedua tanpa penugasan: wajib dilempar ProjectAccessError
    expect(() => {
      filterByProjectScope(
        sampleLeads,
        'SALES_EXECUTIVE',
        'user-se-raka',
        'proj-andara-regency',
        sampleMemberships
      );
    }).toThrow(ProjectAccessError);
  });

  it('Penugasan proyek tambahan memerlukan persetujuan dari SM / Owner yang berwenang', () => {
    // SM Ferry memiliki wewenang approval
    expect(canApproveAssignment('SALES_MANAGER', 'user-sm-ferry', 'proj-the-park', sampleMemberships)).toBe(true);

    // SE Raka tidak memiliki wewenang approval
    expect(canApproveAssignment('SALES_EXECUTIVE', 'user-se-raka', 'proj-the-park', sampleMemberships)).toBe(false);

    // DEVELOPER_OWNER selalu berwenang
    expect(canApproveAssignment('DEVELOPER_OWNER', 'user-owner', 'proj-the-park', sampleMemberships)).toBe(true);
  });

  it('DIREKSI dan DEVELOPER_OWNER melihat SEMUA proyek tanpa perlu penugasan', () => {
    expect(canUserAccessProject('DIREKSI', 'user-dir-bambang', 'proj-the-park', sampleMemberships)).toBe(true);
    expect(canUserAccessProject('DIREKSI', 'user-dir-bambang', 'proj-andara-regency', sampleMemberships)).toBe(true);
    expect(canUserAccessProject('DEVELOPER_OWNER', 'user-owner', 'proj-andara-regency', sampleMemberships)).toBe(true);
  });

  it('Dasbor Direksi: Aktual Pendapatan HANYA dari Akad/Closing, Booking dihitung sebagai pipeline', () => {
    const projects = [
      { id: 'p1', name: 'The Park', target_omset: 10000000000 }
    ];
    const units = [
      { project_id: 'p1', price_cash_hard: 1000000000, status: 'terjual' as const }, // Akad: 1 Milyar
      { project_id: 'p1', price_cash_hard: 800000000, status: 'booking' as const },  // Booking: 800 Juta
      { project_id: 'p1', price_cash_hard: 700000000, status: 'tersedia' as const }
    ];

    const rev = computeDireksiRevenue(projects, units);
    expect(rev.total_target).toBe(10000000000);
    expect(rev.total_aktual).toBe(1000000000); // Tepat 1 Milyar (hanya status terjual)
    expect(rev.total_pipeline_booking).toBe(800000000); // 800 Juta terpisah
    expect(rev.total_persentase).toBe(10.0);
  });
});
