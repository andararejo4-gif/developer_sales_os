import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sql } from './db';
import { hashPassword } from './auth';
import { runPythonExtractor } from './truth-engine';
import { paymentGateway } from './payment-gateway';
import { grantTopupLotAtomic } from './aic-ledger';
import type { RoleKey } from '../src/data';

export class CrossTenantViolationError extends Error {
  readonly statusCode = 403;
  constructor(message = 'Pelanggaran isolasi tenant: akses lintas kelompok/perusahaan ditolak.') {
    super(message);
    this.name = 'CrossTenantViolationError';
  }
}

export const PLAN_CATALOG_CONFIG = {
  gold: { label: 'Gold', priceIdr: 4_900_000, initialAic: 2500 },
  platinum: { label: 'Platinum', priceIdr: 9_900_000, initialAic: 5000 },
  diamond: { label: 'Diamond', priceIdr: 19_900_000, initialAic: 12000 },
} as const;

export type OnboardingPlanCode = keyof typeof PLAN_CATALOG_CONFIG;

/**
 * Mengunci tenant_id murni dari sesi server yang terautentikasi.
 * Role operasional tidak pernah diizinkan menimpa tenantId via header/query/body.
 */
export function resolveStrictTenantId(params: {
  sessionTenantId: string;
  actorRole: RoleKey | string;
  requestedTenantId?: string | null;
}): string {
  const sessionTenant = String(params.sessionTenantId || '').trim().toLowerCase();
  if (!sessionTenant) {
    throw new CrossTenantViolationError('Sesi tidak memiliki tenant_id yang valid.');
  }
  const requested = String(params.requestedTenantId || '').trim().toLowerCase();
  const isPlatformAdmin = params.actorRole === 'SUPERADMIN' || params.actorRole === 'SUPERADMIN_IT';

  if (requested && requested !== sessionTenant) {
    if (!isPlatformAdmin) {
      throw new CrossTenantViolationError(
        `Akses lintas tenant ditolak: akun ${sessionTenant} tidak dapat mengakses data ${requested}.`
      );
    }
    return requested;
  }
  return sessionTenant;
}

export function generateUniqueTenantId(companyName: string): string {
  const base = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || 'tenant';
  const suffix = crypto.randomBytes(2).toString('hex');
  return `tnt_${base}_${suffix}`;
}

export function generateUniqueSlug(projectName: string): string {
  const base = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'proyek';
  const suffix = crypto.randomBytes(2).toString('hex');
  return `${base}-${suffix}`;
}

/**
 * Membangun path penyimpanan terisolasi per tenant_id & project_id dan menolak path traversal (../).
 */
export function getIsolatedStorageDir(tenantId: string, projectId: string): string {
  const safeTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeProject = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeTenant || !safeProject || tenantId.includes('..') || projectId.includes('..')) {
    throw new CrossTenantViolationError('Identifier tenant/project tidak valid untuk direktori storage.');
  }
  const root = path.resolve(process.cwd(), 'storage');
  const target = path.resolve(root, safeTenant, safeProject);
  if (!target.startsWith(root + path.sep)) {
    throw new CrossTenantViolationError('Path traversal terdeteksi pada storage tenant.');
  }
  return target;
}

export async function resolveTenantByProjectSlug(slug: string): Promise<{
  tenantId: string;
  projectId: string;
  slug: string;
  projectName: string;
  developerName: string;
  locationLabel: string;
} | null> {
  const cleanSlug = String(slug || '').trim().toLowerCase();
  if (!cleanSlug) return null;
  const rows = await sql`
    SELECT tenant_id, project_id, slug, project_name, developer_name, location_label
    FROM sales_os.projects_registry
    WHERE slug = ${cleanSlug}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    tenantId: String(r.tenant_id),
    projectId: String(r.project_id),
    slug: String(r.slug),
    projectName: String(r.project_name),
    developerName: String(r.developer_name),
    locationLabel: String(r.location_label || ''),
  };
}

export interface OnboardingExtractedUnit {
  unit: string;
  tipe: string;
  lt: number;
  lb: number;
  keras: number | null;
  tempo24: number | null;
  kpr: number | null;
  status: 'terverifikasi' | 'perlu dicek';
}

function parsePricesFromText(text: string): number[] {
  return [...text.matchAll(/(\d{9,11}|\d{1,3}(?:[.,]\d{3}){2,3}|\d{2,4}\s*(?:jt|juta|miliar|m\b))/gi)]
    .map((x) => {
      const raw = x[1].toLowerCase().trim();
      if (raw.includes('jt') || raw.includes('juta')) {
        return Math.round(parseFloat(raw) * 1_000_000);
      }
      if (raw.includes('miliar') || raw.endsWith('m')) {
        return Math.round(parseFloat(raw) * 1_000_000_000);
      }
      return Number(raw.replace(/[.,]/g, ''));
    })
    .filter((n) => Number.isFinite(n) && n >= 100_000_000 && n <= 50_000_000_000);
}

export function parseUnitsFromExtractedText(rawText: string): OnboardingExtractedUnit[] {
  const units: OnboardingExtractedUnit[] = [];
  const seen = new Set<string>();
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let currentCluster = 'Unit Terdeteksi OCR';

  const isHeaderOrNoise = (s: string) =>
    /^(no|tipe\s*rumah|lb|lt|m2|harga\s*jual|keterangan|pt\.|cluster\s+)/i.test(s) ||
    /^\d+$/.test(s) ||
    /^[-–—]+$/.test(s);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^cluster\s+/i.test(line)) {
      currentCluster = line.replace(/\s+/g, ' ').trim();
      continue;
    }

    // Mode 1: Baris tunggal dengan kode unit (misal "Unit A.01 Harga Cash 650000000")
    const codeMatch = line.match(/\b([A-Z]{1,3}[.-]?\d{1,3})\b/);
    const linePrices = parsePricesFromText(line);
    if (codeMatch && !/^m2$/i.test(codeMatch[1])) {
      const keras = linePrices[0] ?? null;
      const kpr = linePrices[1] ?? (keras ? Math.round(keras * 1.05) : null);
      const tempo24 = linePrices[2] ?? (keras ? Math.round(keras * 1.12) : null);
      if (!seen.has(codeMatch[1])) {
        seen.add(codeMatch[1]);
        units.push({
          unit: codeMatch[1],
          tipe: currentCluster,
          lt: 72,
          lb: 60,
          keras,
          tempo24,
          kpr,
          status: keras ? 'terverifikasi' : 'perlu dicek',
        });
      }
      if (units.length >= 40) break;
      continue;
    }

    // Mode 2: Multi-line RapidOCR (harga di baris sendiri, nama tipe & LB/LT di 1-5 baris sebelumnya)
    if (linePrices.length > 0) {
      const keras = linePrices[0];
      const windowLines = lines.slice(Math.max(0, i - 5), i);
      let unitName = '';
      const smallNums: number[] = [];

      for (const prev of windowLines) {
        if (/^\d{2,4}$/.test(prev)) {
          const n = Number(prev);
          if (n >= 15 && n <= 2000) smallNums.push(n);
        } else if (!isHeaderOrNoise(prev) && parsePricesFromText(prev).length === 0 && /[a-zA-Z]{3,}/.test(prev)) {
          unitName = prev.replace(/[-–—]+$/g, '').trim();
        }
      }

      if (unitName) {
        const key = `${unitName}::${keras}`;
        if (!seen.has(key)) {
          seen.add(key);
          const lb = smallNums[0] ?? 60;
          const lt = smallNums[1] ?? smallNums[0] ?? 72;
          units.push({
            unit: unitName,
            tipe: currentCluster,
            lt,
            lb,
            keras,
            tempo24: Math.round(keras * 1.12),
            kpr: Math.round(keras * 1.05),
            status: 'terverifikasi',
          });
        }
      }
      if (units.length >= 40) break;
    }
  }
  return units;
}

export async function runOnboardingExtraction(params: {
  selectedPlan: OnboardingPlanCode;
  companyName: string;
  projectName: string;
  city: string;
  province: string;
  facilities: string;
  files: Array<{ filename: string; contentBase64: string }>;
}) {
  const slug = generateUniqueSlug(params.projectName);
  const tmpDir = path.join(process.cwd(), 'tmp_uploads', 'onboarding');
  await fs.mkdir(tmpDir, { recursive: true });

  const extractedChunks: string[] = [];
  for (const file of params.files) {
    if (!file.contentBase64) continue;
    const safeName = `${Date.now()}_${file.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(tmpDir, safeName);
    const buf = Buffer.from(file.contentBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');
    await fs.writeFile(filePath, buf);
    try {
      const ext = path.extname(safeName).toLowerCase();
      if (['.txt', '.csv', '.md'].includes(ext)) {
        extractedChunks.push(buf.toString('utf8'));
      } else {
        const res = await runPythonExtractor(filePath);
        if (res.ok && Array.isArray(res.pages)) {
          extractedChunks.push(res.pages.map((p) => `[${file.filename} Hal ${p.page}/${p.method}]\n${p.markdown}`).join('\n\n'));
        }
      }
    } finally {
      await fs.unlink(filePath).catch(() => {});
    }
  }

  const combinedText = extractedChunks.join('\n\n').slice(0, 20000);
  const units = parseUnitsFromExtractedText(combinedText);
  const finalUnits: OnboardingExtractedUnit[] =
    units.length > 0
      ? units
      : [
          {
            unit: 'A.01',
            tipe: 'Tipe Utama (Perlu Cek Harga)',
            lt: 72,
            lb: 60,
            keras: null,
            tempo24: null,
            kpr: null,
            status: 'perlu dicek',
          },
        ];

  const rows = await sql`
    INSERT INTO sales_os.onboarding_sessions (
      selected_plan, company_name, project_name, slug, city, province, facilities,
      extracted_text, extracted_units, status
    ) VALUES (
      ${params.selectedPlan}, ${params.companyName}, ${params.projectName}, ${slug},
      ${params.city}, ${params.province}, ${params.facilities},
      ${combinedText}, ${JSON.stringify(finalUnits)}::jsonb, 'EXTRACTED'
    )
    RETURNING *
  `;

  return {
    session: rows[0],
    extractedTextPreview: combinedText.slice(0, 1200),
    extractedUnits: finalUnits,
  };
}

export async function activateOnboardingWithDummyPayment(params: {
  sessionId: string;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
  clusterCoords: Array<{ namaCluster: string; koordinat: string }>;
  verifiedUnits: OnboardingExtractedUnit[];
  loveLetterPoints?: unknown[];
}) {
  const sessRows = await sql`
    SELECT * FROM sales_os.onboarding_sessions WHERE id = ${params.sessionId}::uuid LIMIT 1
  `;
  if (sessRows.length === 0) {
    return { ok: false, error: 'Sesi onboarding tidak ditemukan.' };
  }
  const sess = sessRows[0];
  if (sess.status === 'ACTIVATED' && sess.activated_tenant_id) {
    return {
      ok: true,
      alreadyActivated: true,
      tenantId: String(sess.activated_tenant_id),
      slug: String(sess.slug),
      invoiceNo: String(sess.invoice_no || ''),
    };
  }

  const planCode = (sess.selected_plan || 'platinum') as OnboardingPlanCode;
  const planMeta = PLAN_CATALOG_CONFIG[planCode] || PLAN_CATALOG_CONFIG.platinum;
  const tenantId = generateUniqueTenantId(String(sess.company_name));
  const projectId = String(sess.slug);
  const cleanEmail = params.ownerEmail.trim().toLowerCase();

  // 1. Buat Tenant & Registry Proyek Terisolasi
  await sql`
    INSERT INTO sales_os.tenants (tenant_id, company_name, plan_code, status, owner_email)
    VALUES (${tenantId}, ${sess.company_name}, ${planCode}, 'ACTIVE', ${cleanEmail})
  `;
  await sql`
    INSERT INTO sales_os.projects_registry (
      tenant_id, project_id, slug, project_name, developer_name, city, province, location_label, cluster_coords, love_letter_points
    ) VALUES (
      ${tenantId}, ${projectId}, ${sess.slug}, ${sess.project_name}, ${sess.company_name},
      ${sess.city || ''}, ${sess.province || ''}, ${`${sess.city || ''}, ${sess.province || ''}`},
      ${JSON.stringify(params.clusterCoords || [])}::jsonb,
      ${JSON.stringify(params.loveLetterPoints || [])}::jsonb
    )
  `;

  // 2. Buat Invoice Dummy Payment Gateway & Settlement HMAC-Verified
  const invoice = await paymentGateway.createInvoice({
    tenantId,
    projectId,
    invoiceType: 'AIC_TOPUP',
    referenceCode: `PLAN-${planCode.toUpperCase()}`,
    description: `Aktivasi Paket ${planMeta.label} (${sess.company_name})`,
    amountIdr: planMeta.priceIdr,
    aicAmount: planMeta.initialAic,
    customerName: params.ownerName,
    createdBy: cleanEmail,
  });

  await paymentGateway.settleInvoice({
    tenantId,
    invoiceNo: String(invoice.invoice_no),
    targetStatus: 'PAID',
    actorEmail: cleanEmail,
  });

  await grantTopupLotAtomic({
    tenantId,
    billableEventId: `onboard_${invoice.invoice_no}`,
    lotCode: `ONBOARD-${planCode.toUpperCase()}`,
    amountAic: planMeta.initialAic,
    expiresAt: new Date(Date.now() + 90 * 86400_000).toISOString(),
    actorEmail: cleanEmail,
    actorRole: 'IT',
  }).catch(() => {});

  // 3. Buat Akun IT/Admin Pertama Tim Terikat ke tenant_id Baru
  const passwordHash = hashPassword(params.ownerPassword || 'Andara2026!');
  await sql`
    INSERT INTO sales_os.app_users (email, name, role, tenant_id, project_id, password_hash, is_active)
    VALUES (${cleanEmail}, ${params.ownerName || 'Admin IT Tim'}, 'IT', ${tenantId}, ${projectId}, ${passwordHash}, true)
    ON CONFLICT (email) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      project_id = EXCLUDED.project_id,
      role = 'IT'
  `;

  // 4. Simpan Unit Terverifikasi ke project_units Terisolasi Tenant Baru
  for (const u of params.verifiedUnits) {
    await sql`
      INSERT INTO sales_os.project_units (
        tenant_id, project_id, unit_code, cluster, unit_type, lt_sqm, lb_sqm,
        price_cash, price_kpr, status
      ) VALUES (
        ${tenantId}, ${projectId}, ${u.unit}, ${u.tipe || 'Utama'}, ${u.tipe || 'Standard'},
        ${Number(u.lt || 72)}, ${Number(u.lb || 60)},
        ${Number(u.keras || 650_000_000)}, ${Number(u.kpr || 683_000_000)}, 'available'
      )
      ON CONFLICT DO NOTHING
    `;
  }

  // 5. Pastikan direktori storage terisolasi siap
  await fs.mkdir(getIsolatedStorageDir(tenantId, projectId), { recursive: true });

  await sql`
    UPDATE sales_os.onboarding_sessions
    SET status = 'ACTIVATED',
        activated_tenant_id = ${tenantId},
        invoice_no = ${String(invoice.invoice_no)},
        cluster_coords = ${JSON.stringify(params.clusterCoords || [])}::jsonb,
        extracted_units = ${JSON.stringify(params.verifiedUnits)}::jsonb,
        updated_at = NOW()
    WHERE id = ${params.sessionId}::uuid
  `;

  return {
    ok: true,
    alreadyActivated: false,
    tenantId,
    projectId,
    slug: String(sess.slug),
    planCode,
    invoiceNo: String(invoice.invoice_no),
    initialAic: planMeta.initialAic,
  };
}
