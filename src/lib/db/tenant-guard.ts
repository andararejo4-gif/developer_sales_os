// Helper Isolasi Data Multi-Tenant (Tenant Guard)
// Memastikan semua query dan pembacaan data dibatasi ketat oleh tenant_id pengguna

export interface UserSessionContext {
  userId: string;
  tenantId: string | null; // NULL jika SUPERADMIN
  role: string;
}

export interface BusinessEntity {
  id: string;
  tenant_id: string;
  [key: string]: any;
}

export class TenantAccessError extends Error {
  constructor(message = "Akses ditolak: Percobaan akses lintas tenant (Cross-Tenant Violation)") {
    super(message);
    this.name = "TenantAccessError";
  }
}

/**
 * Memastikan query membaca hanya data milik tenant pengguna yang sedang login.
 * Jika pengguna bukan SUPERADMIN dan mencoba membaca tenant lain, lempar TenantAccessError.
 */
export function filterByTenant<T extends BusinessEntity>(
  items: T[],
  context: UserSessionContext,
  targetTenantId?: string
): T[] {
  // SUPERADMIN dapat membaca semua data atau memfilter spesifik
  if (context.role === 'SUPERADMIN' && context.tenantId === null) {
    if (targetTenantId) {
      return items.filter(item => item.tenant_id === targetTenantId);
    }
    return items;
  }

  // Jika bukan Superadmin, wajib memiliki tenantId yang valid
  if (!context.tenantId) {
    throw new TenantAccessError("User tidak memiliki tenant_id yang valid.");
  }

  // Jika targetTenantId dispesifikasikan dan berbeda dengan milik user -> tolak langsung!
  if (targetTenantId && targetTenantId !== context.tenantId) {
    throw new TenantAccessError(`User Tenant '${context.tenantId}' dilarang mengakses data Tenant '${targetTenantId}'`);
  }

  return items.filter(item => item.tenant_id === context.tenantId);
}

/**
 * Validasi akses single record untuk operasi get/update/delete
 */
export function verifyTenantOwnership<T extends BusinessEntity>(
  entity: T,
  context: UserSessionContext
): boolean {
  if (context.role === 'SUPERADMIN' && context.tenantId === null) {
    return true;
  }

  if (!context.tenantId || entity.tenant_id !== context.tenantId) {
    throw new TenantAccessError("Dilarang memodifikasi atau membaca entitas milik tenant lain.");
  }

  return true;
}
