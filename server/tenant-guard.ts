import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sql } from './db';
import { hashPassword } from './auth';
import { runPythonExtractor } from './truth-engine';
import { paymentGateway, getActivePaymentGateway } from './payment-gateway';
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

/** Buat invoice Midtrans Sandbox untuk onboarding tanpa membuat akun/tenant sebelum status PAID. */
export async function createOnboardingCheckout(params: {
  sessionId: string;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
  clusterCoords: Array<{ namaCluster: string; koordinat: string }>;
  verifiedUnits: OnboardingExtractedUnit[];
  loveLetterPoints?: unknown[];
}) {
  const cleanEmail = params.ownerEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, error: 'Email Admin/IT tim wajib valid.' };
  }
  if (!params.ownerPassword || params.ownerPassword.trim().length < 6) {
    return { ok: false, error: 'Password Admin/IT tim minimal 6 karakter.' };
  }

  const sessRows = await sql`
    SELECT * FROM sales_os.onboarding_sessions WHERE id = ${params.sessionId}::uuid LIMIT 1
  `;
  if (sessRows.length === 0) {
    return { ok: false, error: 'Sesi onboarding tidak ditemukan.' };
  }
  const sess = sessRows[0];

  if (sess.status === 'ACTIVATED' && sess.activated_tenant_id && sess.invoice_no) {
    return {
      ok: true,
      alreadyActivated: true,
      invoiceNo: String(sess.invoice_no),
      checkoutPath: `/checkout/${encodeURIComponent(String(sess.invoice_no))}`,
    };
  }

  // Jika sudah ada invoice PENDING sebelumnya untuk sesi ini, pakai ulang agar tidak duplikat
  if (sess.status === 'INVOICED' && sess.invoice_no) {
    const existingInv = await sql`
      SELECT * FROM sales_os.payment_invoices WHERE invoice_no = ${String(sess.invoice_no)} LIMIT 1
    `;
    if (existingInv.length > 0 && existingInv[0].status === 'PENDING') {
      return {
        ok: true,
        invoice: existingInv[0],
        invoiceNo: String(existingInv[0].invoice_no),
        checkoutPath: `/checkout/${encodeURIComponent(String(existingInv[0].invoice_no))}`,
      };
    }
  }

  const planCode = (sess.selected_plan || 'platinum') as OnboardingPlanCode;
  const planMeta = PLAN_CATALOG_CONFIG[planCode] || PLAN_CATALOG_CONFIG.platinum;
  const pendingTenantId = generateUniqueTenantId(String(sess.company_name));
  const projectId = String(sess.slug);
  const passwordHash = hashPassword(params.ownerPassword.trim());

  const gateway = getActivePaymentGateway();
  const invoice = await gateway.createInvoice({
    tenantId: pendingTenantId,
    projectId,
    invoiceType: 'AIC_TOPUP',
    referenceCode: `PLAN-${planCode.toUpperCase()}`,
    description: `Paket ${planMeta.label} (${sess.company_name})`,
    amountIdr: planMeta.priceIdr,
    aicAmount: planMeta.initialAic,
    customerName: params.ownerName.trim() || 'Admin IT Tim',
    createdBy: cleanEmail,
  });

  const pendingPayload = {
    pendingTenantId,
    ownerEmail: cleanEmail,
    ownerName: params.ownerName.trim() || 'Admin IT Tim',
    passwordHash,
    clusterCoords: params.clusterCoords || [],
    verifiedUnits: params.verifiedUnits || [],
    loveLetterPoints: params.loveLetterPoints || [],
  };

  await sql`
    UPDATE sales_os.onboarding_sessions
    SET status = 'INVOICED',
        invoice_no = ${String(invoice.invoice_no)},
        cluster_coords = ${JSON.stringify(params.clusterCoords || [])}::jsonb,
        extracted_units = ${JSON.stringify(params.verifiedUnits || [])}::jsonb,
        love_letter_points = ${JSON.stringify(params.loveLetterPoints || [])}::jsonb,
        pending_owner_payload = ${JSON.stringify(pendingPayload)}::jsonb,
        updated_at = NOW()
    WHERE id = ${params.sessionId}::uuid
  `;

  return {
    ok: true,
    invoice,
    invoiceNo: String(invoice.invoice_no),
    checkoutPath: `/checkout/${encodeURIComponent(String(invoice.invoice_no))}`,
  };
}

/** Aktifkan tenant, Surat Cinta, dan akun login HANYA setelah invoice berstatus PAID. */
export async function finalizeOnboardingAfterPayment(invoiceNo: string) {
  const invRows = await sql`
    SELECT * FROM sales_os.payment_invoices WHERE invoice_no = ${invoiceNo} LIMIT 1
  `;
  if (invRows.length === 0) {
    return { ok: false, paid: false, error: 'Invoice tidak ditemukan.' };
  }
  const inv = invRows[0];
  if (inv.status !== 'PAID') {
    return { ok: false, paid: false, status: String(inv.status), error: 'Pembayaran belum lunas.' };
  }

  const sessRows = await sql`
    SELECT * FROM sales_os.onboarding_sessions WHERE invoice_no = ${invoiceNo} LIMIT 1
  `;
  if (sessRows.length === 0) {
    return { ok: true, paid: true, isOnboarding: false };
  }
  const sess = sessRows[0];
  if (sess.status === 'ACTIVATED' && sess.activated_tenant_id) {
    const regRows = await sql`
      SELECT love_letter_points FROM sales_os.projects_registry
      WHERE tenant_id = ${String(sess.activated_tenant_id)} LIMIT 1
    `;
    return {
      ok: true,
      paid: true,
      isOnboarding: true,
      alreadyActivated: true,
      tenantId: String(sess.activated_tenant_id),
      projectId: String(sess.slug),
      slug: String(sess.slug),
      planCode: String(sess.selected_plan || 'platinum'),
      invoiceNo,
      initialAic: Number(inv.aic_amount || 0),
      loveLetterPoints: regRows[0]?.love_letter_points || sess.love_letter_points || [],
      ownerEmail: sess.pending_owner_payload?.ownerEmail || String(inv.created_by || ''),
    };
  }

  const pending = (sess.pending_owner_payload || {}) as {
    pendingTenantId?: string;
    ownerEmail?: string;
    ownerName?: string;
    passwordHash?: string;
    clusterCoords?: Array<{ namaCluster: string; koordinat: string }>;
    verifiedUnits?: OnboardingExtractedUnit[];
    loveLetterPoints?: unknown[];
  };

  const planCode = (sess.selected_plan || 'platinum') as OnboardingPlanCode;
  const planMeta = PLAN_CATALOG_CONFIG[planCode] || PLAN_CATALOG_CONFIG.platinum;
  const tenantId = pending.pendingTenantId || String(inv.tenant_id) || generateUniqueTenantId(String(sess.company_name));
  const projectId = String(sess.slug);
  const cleanEmail = String(pending.ownerEmail || inv.created_by || '').trim().toLowerCase();
  const ownerName = String(pending.ownerName || inv.customer_name || 'Admin IT Tim').trim();
  const passwordHash = pending.passwordHash || hashPassword('Andara2026!');
  const loveLetterPoints = pending.loveLetterPoints || sess.love_letter_points || [];
  const clusterCoords = pending.clusterCoords || sess.cluster_coords || [];
  const verifiedUnits = (pending.verifiedUnits || sess.extracted_units || []) as OnboardingExtractedUnit[];

  await sql`
    INSERT INTO sales_os.tenants (tenant_id, company_name, plan_code, status, owner_email)
    VALUES (${tenantId}, ${sess.company_name}, ${planCode}, 'ACTIVE', ${cleanEmail})
    ON CONFLICT (tenant_id) DO NOTHING
  `;
  await sql`
    INSERT INTO sales_os.projects_registry (
      tenant_id, project_id, slug, project_name, developer_name, city, province, location_label, cluster_coords, love_letter_points
    ) VALUES (
      ${tenantId}, ${projectId}, ${sess.slug}, ${sess.project_name}, ${sess.company_name},
      ${sess.city || ''}, ${sess.province || ''}, ${`${sess.city || ''}, ${sess.province || ''}`},
      ${JSON.stringify(clusterCoords)}::jsonb,
      ${JSON.stringify(loveLetterPoints)}::jsonb
    )
    ON CONFLICT (slug) DO NOTHING
  `;

  // Pastikan kuota AIC awal masuk ke wallet & lot jika belum dicatat oleh settleInvoice
  await grantTopupLotAtomic({
    tenantId,
    billableEventId: `pg_topup_${invoiceNo}`,
    lotCode: `PG-${invoiceNo}`,
    amountAic: planMeta.initialAic,
    expiresAt: new Date(Date.now() + 90 * 86400_000).toISOString(),
    actorEmail: cleanEmail,
    actorRole: 'SYSTEM',
  }).catch(() => {});

  await sql`
    INSERT INTO sales_os.app_users (email, name, role, tenant_id, project_id, password_hash, is_active)
    VALUES (${cleanEmail}, ${ownerName}, 'IT', ${tenantId}, ${projectId}, ${passwordHash}, true)
    ON CONFLICT (email) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      project_id = EXCLUDED.project_id,
      password_hash = EXCLUDED.password_hash,
      role = 'IT',
      is_active = true
  `;

  for (const u of verifiedUnits) {
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

  await fs.mkdir(getIsolatedStorageDir(tenantId, projectId), { recursive: true });

  await sql`
    UPDATE sales_os.onboarding_sessions
    SET status = 'ACTIVATED',
        activated_tenant_id = ${tenantId},
        updated_at = NOW()
    WHERE id = ${sess.id}::uuid
  `;

  return {
    ok: true,
    paid: true,
    isOnboarding: true,
    alreadyActivated: false,
    tenantId,
    projectId,
    slug: String(sess.slug),
    planCode,
    invoiceNo,
    initialAic: planMeta.initialAic,
    loveLetterPoints,
    ownerEmail: cleanEmail,
  };
}
