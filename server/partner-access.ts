import type { RoleKey } from '../src/data';

export type ExternalPartnerRole = 'REFERRAL_PARTNER' | 'SALES_PARTNER';

export function isExternalPartnerRole(role: RoleKey): role is ExternalPartnerRole {
  return role === 'REFERRAL_PARTNER' || role === 'SALES_PARTNER';
}

const PARTNER_COMMON_ROUTES = new Set([
  'GET /api/profile',
  'PATCH /api/profile',
  'POST /api/profile/totp/setup',
  'POST /api/profile/totp/enable',
  'POST /api/profile/totp/disable',
  'GET /api/units',
]);

const SALES_PARTNER_ROUTES = new Set(['GET /api/pipeline/leads', 'POST /api/pipeline/leads']);

/**
 * Mitra eksternal bersifat tolak-secara-default: endpoint baru otomatis tertutup bagi mereka.
 * Kepemilikan baris (hanya lead sendiri) tetap dijaga oleh masing-masing handler.
 */
export function isPartnerRequestAllowed(role: RoleKey, pathname: string, method = 'GET'): boolean {
  if (!isExternalPartnerRole(role)) return true;
  const route = `${method} ${pathname}`;
  if (PARTNER_COMMON_ROUTES.has(route)) return true;
  if (role !== 'SALES_PARTNER') return false;
  return SALES_PARTNER_ROUTES.has(route) || /^PATCH \/api\/pipeline\/leads\/[0-9a-fA-F-]{36}$/.test(route);
}
