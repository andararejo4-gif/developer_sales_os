import { sql } from './db';

export interface CrudPermission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface FeatureDefinition {
  key: string;
  label: string;
  category: string;
}

export const PLATFORM_FEATURES: FeatureDefinition[] = [
  { key: 'pipeline', label: 'Lead & Pipeline WA AI', category: 'Sales & CRM' },
  { key: 'crm', label: 'CRM Kanban & List', category: 'Sales & CRM' },
  { key: 'vault', label: 'Dokumen Vault KPR', category: 'KPR & Legal' },
  { key: 'kpr_bank', label: 'Pengajuan KPR Bank', category: 'KPR & Legal' },
  { key: 'units', label: 'Inventori Unit & Harga', category: 'Properti' },
  { key: 'content_calendar', label: 'Kalender Konten 30 Hari', category: 'Marketing' },
  { key: 'daily_route', label: 'Rute Harian Canvassing', category: 'Lapangan' },
  { key: 'field_ops', label: 'Absen, GPS & Call Log', category: 'Lapangan' },
  { key: 'referral', label: 'Program Referral & Mitra', category: 'Kemitraan' },
  { key: 'garansi', label: 'Keluhan & Garansi DLP', category: 'Purna Jual' },
  { key: 'kb', label: 'Knowledge Base Produk', category: 'Referensi' },
  { key: 'surat_cinta', label: 'Surat Cinta 99 Keunggulan', category: 'Referensi' },
  { key: 'playbook', label: 'Playbook Sales', category: 'Referensi' },
  { key: 'target_penjualan', label: 'Target & Sold Out Velocity', category: 'Manajemen' },
  { key: 'komisi', label: 'Aturan Komisi & Override', category: 'Manajemen' },
  { key: 'ad_campaigns', label: 'Kampanye Iklan & CPL', category: 'Marketing' },
];

export const FULL_CRUD: CrudPermission = {
  create: true,
  read: true,
  update: true,
  delete: true,
};

export async function ensurePermissionTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.feature_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      scope_type TEXT NOT NULL CHECK (scope_type IN ('USER', 'ROLE')),
      target_user_id UUID REFERENCES sales_os.app_users(id) ON DELETE CASCADE,
      target_role TEXT,
      feature_key TEXT NOT NULL,
      can_create BOOLEAN NOT NULL DEFAULT TRUE,
      can_read BOOLEAN NOT NULL DEFAULT TRUE,
      can_update BOOLEAN NOT NULL DEFAULT TRUE,
      can_delete BOOLEAN NOT NULL DEFAULT TRUE,
      updated_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_permissions_unique
      ON sales_os.feature_permissions (
        tenant_id,
        scope_type,
        COALESCE(target_user_id::text, ''),
        COALESCE(target_role, ''),
        feature_key
      )
  `;
}

export async function getEffectivePermissionsForUser(
  tenantId: string,
  userId: string | undefined,
  role: string
): Promise<Record<string, CrudPermission>> {
  const result: Record<string, CrudPermission> = {};
  for (const feat of PLATFORM_FEATURES) {
    result[feat.key] = { ...FULL_CRUD };
  }

  // 1. Terapkan Global Role defaults jika ada
  const roleRows = await sql`
    SELECT feature_key, can_create, can_read, can_update, can_delete
    FROM sales_os.feature_permissions
    WHERE tenant_id = ${tenantId}
      AND scope_type = 'ROLE'
      AND target_role = ${role}
  `;
  for (const r of roleRows) {
    result[String(r.feature_key)] = {
      create: Boolean(r.can_create),
      read: Boolean(r.can_read),
      update: Boolean(r.can_update),
      delete: Boolean(r.can_delete),
    };
  }

  // 2. Override dengan setting khusus Per-User jika ada
  if (userId) {
    const userRows = await sql`
      SELECT feature_key, can_create, can_read, can_update, can_delete
      FROM sales_os.feature_permissions
      WHERE tenant_id = ${tenantId}
        AND scope_type = 'USER'
        AND target_user_id = ${userId}::uuid
    `;
    for (const r of userRows) {
      result[String(r.feature_key)] = {
        create: Boolean(r.can_create),
        read: Boolean(r.can_read),
        update: Boolean(r.can_update),
        delete: Boolean(r.can_delete),
      };
    }
  }

  return result;
}

export async function getScopePermissionMatrix(
  tenantId: string,
  scopeType: 'USER' | 'ROLE',
  targetUserId?: string,
  targetRole?: string
) {
  const rows =
    scopeType === 'USER' && targetUserId
      ? await sql`
          SELECT feature_key, can_create, can_read, can_update, can_delete
          FROM sales_os.feature_permissions
          WHERE tenant_id = ${tenantId}
            AND scope_type = 'USER'
            AND target_user_id = ${targetUserId}::uuid
        `
      : await sql`
          SELECT feature_key, can_create, can_read, can_update, can_delete
          FROM sales_os.feature_permissions
          WHERE tenant_id = ${tenantId}
            AND scope_type = 'ROLE'
            AND target_role = ${targetRole || 'SE'}
        `;

  const map: Record<string, CrudPermission> = {};
  for (const feat of PLATFORM_FEATURES) {
    map[feat.key] = { ...FULL_CRUD };
  }
  for (const r of rows) {
    map[String(r.feature_key)] = {
      create: Boolean(r.can_create),
      read: Boolean(r.can_read),
      update: Boolean(r.can_update),
      delete: Boolean(r.can_delete),
    };
  }
  return map;
}

export async function saveScopePermissions(params: {
  tenantId: string;
  scopeType: 'USER' | 'ROLE';
  targetUserId?: string;
  targetRole?: string;
  permissions: Record<string, CrudPermission>;
  updatedBy: string;
}) {
  const { tenantId, scopeType, targetUserId, targetRole, permissions, updatedBy } = params;
  for (const [featureKey, perm] of Object.entries(permissions)) {
    const canCreate = Boolean(perm.create);
    const canRead = Boolean(perm.read);
    const canUpdate = Boolean(perm.update);
    const canDelete = Boolean(perm.delete);

    if (scopeType === 'USER' && targetUserId) {
      await sql`
        DELETE FROM sales_os.feature_permissions
        WHERE tenant_id = ${tenantId}
          AND scope_type = 'USER'
          AND target_user_id = ${targetUserId}::uuid
          AND feature_key = ${featureKey}
      `;
      await sql`
        INSERT INTO sales_os.feature_permissions (
          tenant_id, scope_type, target_user_id, target_role, feature_key,
          can_create, can_read, can_update, can_delete, updated_by
        ) VALUES (
          ${tenantId}, 'USER', ${targetUserId}::uuid, NULL, ${featureKey},
          ${canCreate}, ${canRead}, ${canUpdate}, ${canDelete}, ${updatedBy}
        )
      `;
    } else if (scopeType === 'ROLE' && targetRole) {
      await sql`
        DELETE FROM sales_os.feature_permissions
        WHERE tenant_id = ${tenantId}
          AND scope_type = 'ROLE'
          AND target_role = ${targetRole}
          AND feature_key = ${featureKey}
      `;
      await sql`
        INSERT INTO sales_os.feature_permissions (
          tenant_id, scope_type, target_user_id, target_role, feature_key,
          can_create, can_read, can_update, can_delete, updated_by
        ) VALUES (
          ${tenantId}, 'ROLE', NULL, ${targetRole}, ${featureKey},
          ${canCreate}, ${canRead}, ${canUpdate}, ${canDelete}, ${updatedBy}
        )
      `;
    }
  }
}
