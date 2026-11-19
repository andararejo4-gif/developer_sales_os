// Project Membership & Access Isolation Guard (Fase 1 & Bagian 3)
// Mengatur hak akses proyek, persetujuan penugasan, dan isolasi data per proyek

export interface ProjectMember {
  id: string;
  tenant_id: string;
  project_id: string;
  user_id: string;
  role_di_proyek: string;
  atasan_id?: string;
  bisa_menyetujui_penugasan: boolean;
  is_active: boolean;
}

export interface ProjectAssignmentRequest {
  id: string;
  tenant_id: string;
  project_id: string;
  user_id: string;
  requested_role: string;
  requested_by_user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  approved_by_user_id?: string;
  decision_notes?: string;
  created_at: string;
  decided_at?: string;
}

export class ProjectAccessError extends Error {
  constructor(message = "Akses Ditolak: Anda tidak ditugaskan pada proyek ini.") {
    super(message);
    this.name = "ProjectAccessError";
  }
}

/**
 * Cek apakah seorang pengguna memiliki akses ke proyek tertentu
 */
export function canUserAccessProject(
  userRole: string,
  userId: string,
  targetProjectId: string,
  userMemberships: ProjectMember[]
): boolean {
  // DEVELOPER_OWNER dan DIREKSI memiliki akses otomatis ke seluruh proyek tenant
  if (userRole === 'DEVELOPER_OWNER' || userRole === 'DIREKSI' || userRole === 'SUPERADMIN') {
    return true;
  }

  // Role tingkat proyek wajib memiliki record aktif di project_members
  return userMemberships.some(
    m => m.user_id === userId && m.project_id === targetProjectId && m.is_active
  );
}

/**
 * Memfilter daftar data bisnis (lead, unit, laporan) agar hanya proyek yang boleh diakses pengguna
 */
export function filterByProjectScope<T extends { project_id: string }>(
  items: T[],
  userRole: string,
  userId: string,
  currentSelectedProjectId: string,
  userMemberships: ProjectMember[]
): T[] {
  // Jika role level proyek, verifikasi izin penugasan proyek
  if (userRole !== 'DEVELOPER_OWNER' && userRole !== 'DIREKSI' && userRole !== 'SUPERADMIN') {
    const isAssigned = userMemberships.some(
      m => m.user_id === userId && m.project_id === currentSelectedProjectId && m.is_active
    );
    if (!isAssigned) {
      throw new ProjectAccessError(
        `User ${userId} tidak ditugaskan pada proyek ${currentSelectedProjectId}. Isolasi data ditegakkan.`
      );
    }
  }

  // Seluruh halaman bekerja dalam konteks satu proyek terpilih
  return items.filter(item => item.project_id === currentSelectedProjectId);
}

/**
 * Validasi wewenang persetujuan penugasan proyek tambahan
 * Hanya SM / role dengan `bisa_menyetujui_penugasan = true` atau Owner yang boleh menyetujui
 */
export function canApproveAssignment(
  approverRole: string,
  approverUserId: string,
  projectId: string,
  memberships: ProjectMember[]
): boolean {
  if (approverRole === 'DEVELOPER_OWNER' || approverRole === 'SUPERADMIN') {
    return true;
  }

  // Cari apakah approver memiliki wewenang penugasan di proyek tersebut
  const member = memberships.find(
    m => m.user_id === approverUserId && m.project_id === projectId && m.is_active
  );

  return member ? member.bisa_menyetujui_penugasan : false;
}

/**
 * Menghitung Target vs Aktual Pendapatan Direksi (Lintas Proyek)
 * Aturan: Aktual Pendapatan HANYA dihitung dari unit berstatus 'terjual' (Akad/Closing).
 * Status 'booking' dihitung terpisah sebagai pipeline, TIDAK dihitung pendapatan.
 */
export interface DireksiRevenueSummary {
  project_id: string;
  project_name: string;
  target_pendapatan: number;
  aktual_pendapatan: number; // Akad/Closing
  pipeline_booking_nilai: number; // Booking
  unit_akad_count: number;
  unit_booking_count: number;
  persentase_capaian: number;
}

export function computeDireksiRevenue(
  projects: { id: string; name: string; target_omset: number }[],
  units: { project_id: string; price_cash_hard: number; status: 'tersedia' | 'booking' | 'terjual' | 'hold' }[]
): {
  per_project: DireksiRevenueSummary[];
  total_target: number;
  total_aktual: number;
  total_pipeline_booking: number;
  total_persentase: number;
  total_unit_akad: number;
  total_unit_booking: number;
} {
  let totalTarget = 0;
  let totalAktual = 0;
  let totalPipelineBooking = 0;
  let totalUnitAkad = 0;
  let totalUnitBooking = 0;

  const perProject = projects.map(p => {
    const projectUnits = units.filter(u => u.project_id === p.id);
    const akadUnits = projectUnits.filter(u => u.status === 'terjual');
    const bookingUnits = projectUnits.filter(u => u.status === 'booking');

    const aktual = akadUnits.reduce((sum, u) => sum + (u.price_cash_hard || 0), 0);
    const pipelineBooking = bookingUnits.reduce((sum, u) => sum + (u.price_cash_hard || 0), 0);

    totalTarget += p.target_omset;
    totalAktual += aktual;
    totalPipelineBooking += pipelineBooking;
    totalUnitAkad += akadUnits.length;
    totalUnitBooking += bookingUnits.length;

    const pct = p.target_omset > 0 ? parseFloat(((aktual / p.target_omset) * 100).toFixed(1)) : 0;

    return {
      project_id: p.id,
      project_name: p.name,
      target_pendapatan: p.target_omset,
      aktual_pendapatan: aktual,
      pipeline_booking_nilai: pipelineBooking,
      unit_akad_count: akadUnits.length,
      unit_booking_count: bookingUnits.length,
      persentase_capaian: pct
    };
  });

  const totalPct = totalTarget > 0 ? parseFloat(((totalAktual / totalTarget) * 100).toFixed(1)) : 0;

  return {
    per_project: perProject,
    total_target: totalTarget,
    total_aktual: totalAktual,
    total_pipeline_booking: totalPipelineBooking,
    total_persentase: totalPct,
    total_unit_akad: totalUnitAkad,
    total_unit_booking: totalUnitBooking,
  };
}
