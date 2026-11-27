// ============================================================================
// DEVELOPER SALES OS - PRODUCTION API SERVER (PORT 3040)
// PostgreSQL sales_os + 9router AI Engine + WhatsApp Baileys Per-SE Isolation
// ============================================================================

import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { URL } from 'node:url';
import { sql } from './db';
import {
  appendAuditLog,
  getAicLedgerForTenant,
  getAuditLogsForTenant,
  grantTopupLotAtomic,
  refundAicAtomic,
  reserveAicAtomic,
  settleAicAtomic,
} from './aic-ledger';
import { paymentGateway, type PaymentInvoiceType } from './payment-gateway';
import { generateGroundedLoveLetter } from './love-letter-generator';
import {
  activateOnboardingWithDummyPayment,
  CrossTenantViolationError,
  resolveStrictTenantId,
  resolveTenantByProjectSlug,
  runOnboardingExtraction,
  type OnboardingPlanCode,
} from './tenant-guard';
import {
  createDisputeAndHoldCommission,
  createWorkspaceItem,
  deleteWorkspaceItem,
  listWorkspaceItems,
  pickNextRoundRobinSe,
  propagateTruthChangeToWorkspaceAssets,
  registerEventRsvpToLead,
  spawnLegalMilestoneOnAkad,
  updateWorkspaceItem,
} from './workspace-couplings';
import {
  answerFaqGrounded,
  approveServerRequest,
  createApprovalRequest,
  enqueueDurableOutbox,
  propagateStaleAssets,
} from './security-ops';
import {
  calculatePlanProrationAndInvoice,
  createAppointmentAtomic,
  dispatchRegisteredAgent,
  processOfflineSyncBatch,
} from './runtime-governance';
import {
  buildComparisonExportPack,
  createClaimLedgerEntry,
  createCobrokeDeal,
  deleteWithLegalHoldGuard,
  searchScopedKnowledgeIndex,
  upsertProjectPoiRisk,
} from './r2-domain-services';
import {
  calculateKantongAAmount,
  calculatePph21Estimate,
  type ContentSubmissionType,
} from '../src/lib/creator/creator-desk-store';
import {
  authenticateRequest,
  BASIC_ORG_ROLES,
  buildClearSessionCookieHeader,
  buildSessionCookieHeader,
  createTenantUser,
  deleteTenantUser,
  disableUserTotp,
  enableUserTotp,
  ensureAuthTablesAndSeeds,
  getUserProfile,
  listTenantUsers,
  registerUserAccount,
  revokeSession,
  setupUserTotp,
  startLogin,
  updateTenantUser,
  updateTenantUserStatus,
  updateUserProfile,
  verifyMfaAndCreateSession,
} from './auth';
import {
  ensurePermissionTables,
  getEffectivePermissionsForUser,
  getScopePermissionMatrix,
  PLATFORM_FEATURES,
  saveScopePermissions,
} from './permissions';
import { isExternalPartnerRole, isPartnerRequestAllowed } from './partner-access';
import {
  createUnitQuote,
  ensureUnitInventoryTablesAndSeeds,
  listUnits,
  transitionUnitStatus,
  type PaymentScheme,
  type UnitStatus,
} from './units-quotes';
import {
  ensureTruthTables,
  getCentralAiKnowledge,
  ingestSourceDocument,
  rebuildCentralKnowledgeFromDocs,
  saveCentralAiKnowledge,
} from './truth-engine';
import {
  ensureNurtureTablesAndSeeds,
  executeNurtureJobSend,
  getNurtureJobsForLead,
  getRecentLeadTurnsForNurture,
  listCadenceTemplates,
  regenerateAllNurtureDraftsForLead,
  regenerateNurtureJobDraft,
  rescheduleAnchorForLead,
  scheduleNurtureForLead,
  startNurtureScheduler,
  updateCadenceTemplate,
  updateNurtureJob,
  type NurtureTone,
} from './wa-nurture';
import { analyzeLeadWithAi } from './ai-engine';
import { getTurns, getTurnsForLeads } from './wa-conversation';
import { isOptOutMessage } from './wa-consent';
import {
  MEDIA_OUTPUT_DIR,
  generateUniqueDaySlotsWithAi,
  generateWeekSlotsForSe,
  enqueueSlotMediaViaHermes,
  getHermesHealth,
  getWibClock,
  formatWibDateForDay,
  SE_EMAILS,
  getManualLock,
  getQueuePositionInfo,
  isSlotDueNowWib,
  startContentMediaScheduler,
} from './content-media-worker';
import {
  ACCOUNTS_PER_KEY_LIMIT,
  ZERNIO_PLATFORMS,
  fetchZernioAccountsForProfile,
  fetchZernioPostUrl,
  getOrCreateZernioProfile,
  getZernioConnectUrl,
  getZernioKeys,
  mapCalendarPlatformToZernio,
  publishSlotViaZernio,
  type ZernioPlatform,
} from './zernio-client';
import {
  startBaileysForSe,
  disconnectBaileysForSe,
  getWaStatusForSe,
  processInboundWaMessageForSe,
  recordOutboundWaReplyForSe,
  sendOutboundWaMessageForSe,
  normalizePhoneWa,
  resumeActiveWaSessionsOnStartup,
  isLeadCurrentlyAnalyzing,
} from './wa-baileys';
import {
  evaluatePlaybookBant,
  PLAYBOOK_UNIT_CATALOG,
  type PersonaCode,
  type PipelineStageCode,
} from '../src/lib/kb/playbook-v1-2-knowledge';
import { USERS_BY_ROLE, type RoleKey } from '../src/data';
import { screenLeadQuality } from '../src/lib/leads/dev26-screening';

const PORT = Number(process.env.API_PORT || 3040);

async function recordAuditLog(params: {
  tenantId?: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CLAIM' | 'REASSIGN';
  targetEntity: 'LEAD' | 'BANK_ACCOUNT' | 'UNIT' | 'ATTENDANCE' | 'SYSTEM';
  targetId: string;
  summary: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const tenantId = params.tenantId || 'andara_rejo_makmur';
    await sql`
      INSERT INTO sales_os.activity_audit_logs (
        tenant_id, actor_email, actor_name, actor_role, action, target_entity, target_id, summary, details
      ) VALUES (
        ${tenantId},
        ${params.actorEmail},
        ${params.actorName},
        ${params.actorRole},
        ${params.action},
        ${params.targetEntity},
        ${params.targetId},
        ${params.summary},
        ${sql.json((params.details || {}) as any)}
      )
    `;
  } catch (err) {
    console.warn('[AuditLog] Gagal merekam aktivitas:', err);
  }
}

async function getVerifiedCompanyBankAccounts(tenantId: string = 'andara_rejo_makmur'): Promise<Array<{ bankName: string; accountNumber: string; accountHolder: string }>> {
  try {
    const rows = await sql`
      SELECT bank_name, account_number, account_holder
      FROM sales_os.company_bank_accounts
      WHERE is_active = true AND tenant_id = ${tenantId}
      ORDER BY is_primary DESC, created_at ASC
    `;
    if (rows.length > 0) {
      return rows.map((r: any) => ({
        bankName: String(r.bank_name),
        accountNumber: String(r.account_number),
        accountHolder: String(r.account_holder),
      }));
    }
  } catch {
    // fallback
  }
  return [{ bankName: 'BCA', accountNumber: '0158829100', accountHolder: 'PT Andara Rejo Makmur' }];
}

// ============================================================================
// KEPATUHAN UU PDP NO. 27/2022 & WA PRIVACY SUPPRESSION (Temuan T3 / F92)
// ============================================================================
function isOptOutKeyword(text: string): boolean {
  return isOptOutMessage(text);
}

function cleanPhoneWa(phone: string): string {
  let cleaned = String(phone || '').replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
  return cleaned;
}

async function isPhoneSuppressed(phone: string): Promise<boolean> {
  const cleaned = cleanPhoneWa(phone);
  if (!cleaned) return false;
  try {
    const rows = await sql`
      SELECT id FROM sales_os.wa_suppression_list
      WHERE phone_number = ${cleaned} OR phone_number = ${phone}
      LIMIT 1
    `;
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function addPhoneToSuppression(params: {
  phoneNumber: string;
  leadId?: string;
  leadName?: string;
  reason?: string;
  notes?: string;
}): Promise<void> {
  const cleaned = cleanPhoneWa(params.phoneNumber);
  if (!cleaned) return;
  try {
    await sql`
      INSERT INTO sales_os.wa_suppression_list (
        phone_number, lead_id, lead_name, reason, notes, opted_out_at
      ) VALUES (
        ${cleaned}, ${params.leadId || null}, ${params.leadName || null},
        ${params.reason || 'USER_OPT_OUT'}, ${params.notes || 'Dicatat otomatis oleh sistem'}, NOW()
      )
      ON CONFLICT (phone_number) DO UPDATE SET
        reason = EXCLUDED.reason,
        notes = EXCLUDED.notes,
        opted_out_at = NOW()
    `;
  } catch (err) {
    console.warn('[Suppression] Gagal menambahkan nomor ke daftar:', err);
  }
}

async function removePhoneFromSuppression(phoneNumber: string): Promise<void> {
  const cleaned = cleanPhoneWa(phoneNumber);
  try {
    await sql`DELETE FROM sales_os.wa_suppression_list WHERE phone_number = ${cleaned} OR phone_number = ${phoneNumber}`;
  } catch (err) {
    console.warn('[Suppression] Gagal menghapus nomor:', err);
  }
}

// ============================================================================
// MESIN FINOPS AIC METERING & BUDGET CAPPING (Temuan T7 / F93 / Bab 11)
// ============================================================================
async function getTenantAicWallet(tenantId: string = 'andara_rejo_makmur'): Promise<{
  tenantId: string;
  planCode: string;
  totalAicGranted: number;
  balanceAic: number;
  reservedAic: number;
  validUntil: string;
  isThrottled: boolean;
}> {
  try {
    const rows = await sql`
      SELECT * FROM sales_os.tenant_aic_wallets
      WHERE tenant_id = ${tenantId}
      LIMIT 1
    `;
    if (rows.length > 0) {
      const r = rows[0] as any;
      return {
        tenantId: String(r.tenant_id),
        planCode: String(r.plan_code),
        totalAicGranted: Number(r.total_aic_granted),
        balanceAic: Number(r.balance_aic),
        reservedAic: Number(r.reserved_aic || 0),
        validUntil: new Date(r.valid_until).toISOString(),
        isThrottled: Boolean(r.is_throttled || r.balance_aic <= 0),
      };
    }
  } catch (err) {
    console.warn('[AIC] Gagal membaca wallet tenant:', err);
  }
  return {
    tenantId,
    planCode: 'platinum',
    totalAicGranted: 5000,
    balanceAic: 5000,
    reservedAic: 0,
    validUntil: new Date(Date.now() + 90 * 86400000).toISOString(),
    isThrottled: false,
  };
}

async function deductAicFromWallet(params: {
  tenantId?: string;
  featureId: string;
  featureName: string;
  amountAic: number;
  tokensUsed?: number;
  referenceId?: string;
}): Promise<{ balanceAfter: number; isThrottled: boolean }> {
  const tenantId = params.tenantId || 'andara_rejo_makmur';
  const wallet = await getTenantAicWallet(tenantId);

  if (wallet.isThrottled || wallet.balanceAic < params.amountAic) {
    throw new Error(
      `INSUFFICIENT_AIC: Saldo AI Credit (${wallet.balanceAic} AIC) tidak mencukupi untuk fitur ${params.featureId} (butuh ${params.amountAic} AIC). Silakan top-up paket.`
    );
  }

  const balanceAfter = Math.max(0, wallet.balanceAic - params.amountAic);
  const isThrottled = balanceAfter <= 0;

  try {
    await sql`
      UPDATE sales_os.tenant_aic_wallets
      SET balance_aic = ${balanceAfter},
          is_throttled = ${isThrottled},
          updated_at = NOW()
      WHERE tenant_id = ${tenantId}
    `;

    await sql`
      INSERT INTO sales_os.aic_transactions (
        tenant_id, feature_id, feature_name, amount_aic, tokens_used, balance_after, action_type, reference_id
      ) VALUES (
        ${tenantId}, ${params.featureId}, ${params.featureName}, ${params.amountAic},
        ${params.tokensUsed || 0}, ${balanceAfter}, 'DEDUCT', ${params.referenceId || null}
      )
    `;
  } catch (err) {
    console.warn('[AIC] Gagal mencatat mutasi AIC:', err);
  }

  return { balanceAfter, isThrottled };
}

async function topUpTenantAic(params: {
  tenantId?: string;
  amountAic: number;
  adminEmail: string;
  notes?: string;
}): Promise<number> {
  const tenantId = params.tenantId || 'andara_rejo_makmur';
  const wallet = await getTenantAicWallet(tenantId);
  const newBalance = wallet.balanceAic + params.amountAic;
  const newTotal = wallet.totalAicGranted + params.amountAic;

  await sql`
    UPDATE sales_os.tenant_aic_wallets
    SET balance_aic = ${newBalance},
        total_aic_granted = ${newTotal},
        is_throttled = false,
        updated_at = NOW()
    WHERE tenant_id = ${tenantId}
  `;

  await sql`
    INSERT INTO sales_os.aic_transactions (
      tenant_id, feature_id, feature_name, amount_aic, balance_after, action_type, reference_id
    ) VALUES (
      ${tenantId}, 'TOPUP', ${'Top-Up AI Credit (' + (params.notes || 'Admin') + ')'},
      ${params.amountAic}, ${newBalance}, 'TOPUP', ${params.adminEmail}
    )
  `;

  return newBalance;
}

function getAuthenticatedUser(req: http.IncomingMessage): {
  email: string;
  name: string;
  role: RoleKey;
  tenantId: string;
} {
  const headerEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
  const headerRole = String(req.headers['x-user-role'] || 'SE').trim().toUpperCase() as RoleKey;
  const headerTenant = String(req.headers['x-tenant-id'] || 'andara_rejo_makmur').trim().toLowerCase();

  const matchedRole = (Object.keys(USERS_BY_ROLE) as RoleKey[]).find(
    (r) => USERS_BY_ROLE[r].email.toLowerCase() === headerEmail
  );

  const role: RoleKey = matchedRole || (headerRole in USERS_BY_ROLE ? headerRole : 'SE');
  const profile = USERS_BY_ROLE[role];
  return {
    email: headerEmail || profile.email.toLowerCase(),
    name: profile.name,
    role,
    tenantId: headerTenant || 'andara_rejo_makmur',
  };
}

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, any>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, any>;
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  payload: unknown,
  extraHeaders: Record<string, string | string[]> = {}
): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization, X-User-Email, X-User-Role',
    ...extraHeaders,
  });
  res.end(body);
}

function toWibDateStr(d: Date | string = new Date()): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dateObj.getTime())) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(dateObj);
}

/**
 * Menghitung 100% indikator Dashboard SE, Scorecard Bulanan (§6.4), & 13 Item Laporan Harian (§13.1)
 * secara real & otomatis dari database PostgreSQL sales_os.
 */
async function buildRealSeDashboardData(seEmail: string, seName: string) {
  const leads = await sql`
    SELECT * FROM sales_os.pipeline_leads
    WHERE owner_se_email = ${seEmail}
    ORDER BY created_at DESC
  `;

  const waStatus = await getWaStatusForSe(seEmail, seName);

  const todayStr = toWibDateStr(new Date());
  const weekAgoDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const weekStartStr = toWibDateStr(weekAgoDate);
  const monthPrefix = todayStr.slice(0, 7);

  const dailyRows = await sql`
    SELECT * FROM sales_os.se_daily_notes
    WHERE se_email = ${seEmail} AND report_date = ${todayStr}::date
    LIMIT 1
  `;
  const recentDailyRows = await sql`
    SELECT * FROM sales_os.se_daily_notes
    WHERE se_email = ${seEmail} AND report_date >= (${todayStr}::date - INTERVAL '30 days')
    ORDER BY report_date DESC
  `;

  const daily = dailyRows[0] || recentDailyRows[0] || {
    dial_count: 0,
    connected_call_count: 0,
    canvassing_contacts: 0,
    canvassing_brochures: 0,
    canvassing_leads: 0,
    posted_reels: 0,
    posted_wa_status: 0,
    posted_stories: 0,
    hambatan_bantuan: '',
    item_notes: {},
  };

  const validLeads = leads.filter((l) => l.validity_status === 'VALID');
  const activeValidLeads = validLeads.filter((l) => String(l.stage) !== 'CLOSED_LOST');
  const needsCompletionLeads = leads.filter((l) => l.validity_status === 'PERLU_DILENGKAPI');

  const getLeadWibDate = (l: any) => toWibDateStr(String(l.created_at));
  const getLeadUpdatedWibDate = (l: any) => toWibDateStr(String(l.updated_at || l.created_at));

  const leadsTodayValid = validLeads.filter(
    (l) => getLeadWibDate(l) === todayStr || getLeadUpdatedWibDate(l) === todayStr
  );
  const leadsCreatedTodayValid = validLeads.filter((l) => getLeadWibDate(l) === todayStr);
  const leadsWeekValid = validLeads.filter((l) => getLeadWibDate(l) >= weekStartStr);
  const leadsMonthValid = validLeads.filter((l) => getLeadWibDate(l).startsWith(monthPrefix));

  const isQualifiedLead = (l: any) =>
    Number(l.bant_total) >= 7 ||
    ['QUALIFIED', 'APPOINTMENT', 'VISITED', 'HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(
      String(l.stage)
    );

  const qualifiedProspects = validLeads.filter(isQualifiedLead);
  const qualifiedToday = leadsTodayValid.filter(isQualifiedLead);
  const qualifiedWeek = leadsWeekValid.filter(isQualifiedLead);
  const qualifiedMonth = leadsMonthValid.filter(isQualifiedLead);

  const appointments = validLeads.filter(
    (l) =>
      Boolean(l.appointment_at) ||
      ['APPOINTMENT', 'VISITED', 'HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(
        String(l.stage)
      )
  );

  const visits = validLeads.filter(
    (l) =>
      Boolean(l.visited_at) ||
      ['VISITED', 'HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(String(l.stage))
  );

  const writtenOffers = validLeads.filter(
    (l) =>
      Boolean(l.written_offer_sent) ||
      ['HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(String(l.stage))
  );

  const hotProspects = validLeads.filter(
    (l) =>
      String(l.grade) === 'A' ||
      ['HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(String(l.stage))
  );

  const warmProspects = validLeads.filter(
    (l) =>
      !hotProspects.some((h) => h.id === l.id) &&
      (String(l.grade) === 'B' || Number(l.bant_total) >= 7)
  );

  const bookings = validLeads.filter(
    (l) =>
      Boolean(l.booking_fee_paid) ||
      ['BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(String(l.stage))
  );

  const netSales = validLeads.filter(
    (l) => Boolean(l.dp_or_sp3k_verified) || String(l.stage) === 'PPJB_AKAD'
  );

  const netSalesRevenueIdr = netSales.reduce(
    (sum, l) => sum + Number(l.unit_price_idr || 650000000),
    0
  );

  const activePipelineValueIdr = activeValidLeads.reduce(
    (sum, l) => sum + Number(l.unit_price_idr || 650000000),
    0
  );

  const referrals = validLeads.filter((l) =>
    String(l.source || '').toLowerCase().includes('referral')
  );

  const canvassingPipelineLeads = validLeads.filter((l) =>
    /canvassing|kanvasing|ott/i.test(String(l.source || ''))
  );
  const effectiveCanvassingLeads = Math.max(
    Number(daily.canvassing_leads || 0),
    canvassingPipelineLeads.length
  );

  const totalPostingToday =
    Number(daily.posted_reels || 0) +
    Number(daily.posted_wa_status || 0) +
    Number(daily.posted_stories || 0);

  const pipelineWaOutboundCount = leads.filter(
    (l) => Boolean(l.last_sales_message) || Number(l.interaction_count || 0) > 1
  ).length;
  const pipelineWaInboundCount = leads.filter(
    (l) => String(l.lead_origin) === 'WA_BAILEYS' || Boolean(l.last_customer_message)
  ).length;

  const effectiveWaInbound = Math.max(
    waStatus.metrics.totalInboundMessages,
    pipelineWaInboundCount
  );
  const effectiveWaOutbound = Math.max(
    waStatus.metrics.totalOutboundMessages,
    pipelineWaOutboundCount
  );
  const totalWaChats = Math.max(
    effectiveWaInbound + effectiveWaOutbound,
    validLeads.length
  );

  // Scorecard Bulanan Resmi 7 Komponen (Playbook §6.4 Hal. 17)
  const capPct = (val: number, target: number, maxPct = 150) =>
    target > 0 ? Math.min(maxPct, Math.round((val / target) * 100)) : 0;

  const bookingPct = capPct(bookings.length, 2, 150);
  const bookingPoints = Number(((bookingPct / 100) * 35).toFixed(1));

  const netSalesPct = capPct(netSales.length, 1, 150);
  const netSalesPoints = Number(((netSalesPct / 100) * 20).toFixed(1));

  const visitPct = capPct(visits.length, 15, 150);
  const visitPoints = Number(((visitPct / 100) * 15).toFixed(1));

  const prospectPct = capPct(qualifiedProspects.length, 50, 150);
  const prospectPoints = Number(((prospectPct / 100) * 10).toFixed(1));

  // Kepatuhan aktivitas harian (rata-rata progres 5 aktivitas inti)
  const actCompliancePct = Math.min(
    100,
    Math.round(
      (Math.min(1, validLeads.length / 8) * 25 +
        Math.min(1, totalWaChats / 10) * 25 +
        Math.min(1, Number(daily.dial_count || 0) / 30) * 20 +
        Math.min(1, Number(daily.canvassing_contacts || 0) / 30) * 15 +
        Math.min(1, totalPostingToday / 9) * 15)
    )
  );
  const actPoints = Number(((actCompliancePct / 100) * 10).toFixed(1));

  const crmQualityPct =
    leads.length > 0
      ? Math.round(
          ((validLeads.length / leads.length) * 0.5 +
            (waStatus.metrics.slaCompliancePercent / 100) * 0.5) *
            100
        )
      : 100;
  const crmPoints = Number(((crmQualityPct / 100) * 5).toFixed(1));

  const referralPct = capPct(referrals.length, 12, 100);
  const referralPoints = Number(((referralPct / 100) * 5).toFixed(1));

  const totalScorecardPoints = Number(
    (
      bookingPoints +
      netSalesPoints +
      visitPoints +
      prospectPoints +
      actPoints +
      crmPoints +
      referralPoints
    ).toFixed(1)
  );

  const scorecardCategory =
    totalScorecardPoints >= 120
      ? 'Bintang (≥ 120 · Bonus Prestasi & Prioritas Lead Premium)'
      : totalScorecardPoints >= 100
      ? 'Tercapai (100–119 · Insentif Penuh)'
      : totalScorecardPoints >= 80
      ? 'Mendekati (80–99 · Coaching Mingguan)'
      : totalScorecardPoints >= 60
      ? 'Di Bawah Target (60–79 · Pendampingan SM)'
      : 'Tahap Awal / Perlu Akselerasi (< 60 Poin)';

  const scorecardRows = [
    {
      komponen: 'Booking (Closing Awal Rp5 Juta)',
      bobot: '35%',
      target: '2 unit',
      capaian: `${bookings.length} unit (${bookingPct}%)`,
      poin: bookingPoints.toFixed(1),
      note: 'Maks. 150% · Sumber: Pipeline tahap Booking',
    },
    {
      komponen: 'Net Sales (DP Lunas / SP3K Akad)',
      bobot: '20%',
      target: '1 unit',
      capaian: `${netSales.length} unit (${netSalesPct}%)`,
      poin: netSalesPoints.toFixed(1),
      note: 'Sumber: Pipeline tahap PPJB/Akad',
    },
    {
      komponen: 'Kunjungan Lokasi / Video-Call Tour',
      bobot: '15%',
      target: '15 kunjungan',
      capaian: `${visits.length} (${visitPct}%)`,
      poin: visitPoints.toFixed(1),
      note: 'Sumber: Pipeline tahap Visited',
    },
    {
      komponen: 'Prospek Terkualifikasi (BANT ≥ 7/12)',
      bobot: '10%',
      target: '50 prospek',
      capaian: `${qualifiedProspects.length} (${prospectPct}%)`,
      poin: prospectPoints.toFixed(1),
      note:
        qualifiedProspects.length > 0
          ? `Tercatat: ${qualifiedProspects.map((q) => `${q.full_name} (BANT ${q.bant_total})`).slice(0, 2).join(', ')}`
          : 'Sumber: Lead Valid dengan BANT ≥ 7',
    },
    {
      komponen: 'Kepatuhan Aktivitas (Call, Chat, Canvassing, Posting)',
      bobot: '10%',
      target: '≥ 90% patuh',
      capaian: `${actCompliancePct}% indeks`,
      poin: actPoints.toFixed(1),
      note: 'Dihitung otomatis dari aktivitas harian SE',
    },
    {
      komponen: 'Kualitas CRM & Waktu Respons WA ≤ 5 Menit',
      bobot: '5%',
      target: '100% & ≤ 5 mnt',
      capaian: `${crmQualityPct}% (SLA ${waStatus.metrics.slaCompliancePercent}%)`,
      poin: crmPoints.toFixed(1),
      note:
        waStatus.metrics.avgResponseSeconds !== null
          ? `Rata-rata balas WA: ${waStatus.metrics.avgResponseSeconds} dtk`
          : `${validLeads.length}/${leads.length || 1} lead lengkap & tervalidasi AI`,
    },
    {
      komponen: 'Referral Diperoleh & Kepuasan Pelanggan',
      bobot: '5%',
      target: '12 nama',
      capaian: `${referrals.length} nama (${referralPct}%)`,
      poin: referralPoints.toFixed(1),
      note: 'Sumber: Lead dengan kanal Referral',
    },
  ];

  const itemNotes = (daily.item_notes || {}) as Record<string, string>;
  const latestValidLeadSummary =
    validLeads.length > 0
      ? validLeads
          .slice(0, 2)
          .map((l) => `${l.full_name} (${l.source}${l.content_code ? ' · ' + l.content_code : ''})`)
          .join(', ')
      : 'Belum ada lead di pipeline';

  // 13 Item Laporan Harian SE Resmi (Playbook §13.1 Hal. 30) - Otomatis Terisi dari Pipeline & Aktivitas
  const dailyReportItems = [
    {
      id: 1,
      cat: 'prospek',
      item: '1. Lead baru valid (sumber + kode konten)',
      target: '8 lead',
      targetNum: 8,
      realisasi:
        leadsTodayValid.length > 0
          ? `${leadsTodayValid.length} lead`
          : `${validLeads.length} di pipeline (${leadsCreatedTodayValid.length} baru hari ini)`,
      catatan:
        itemNotes['1'] ||
        (needsCompletionLeads.length > 0
          ? `${validLeads.length} valid (${latestValidLeadSummary}), ${needsCompletionLeads.length} perlu dilengkapi`
          : `Tercatat: ${latestValidLeadSummary}`),
    },
    {
      id: 2,
      cat: 'outreach',
      item: '2. Dial / percakapan telepon tersambung',
      target: '30 / 12',
      targetNum: 30,
      realisasi: `${Number(daily.dial_count || 0)} / ${Number(daily.connected_call_count || 0)}`,
      catatan: itemNotes['2'] || 'Klik tombol + untuk mencatat panggilan telepon hari ini',
    },
    {
      id: 3,
      cat: 'outreach',
      item: '3. Chat WA personal / follow-up (Baileys)',
      target: '50 / 20',
      targetNum: 50,
      realisasi: `${totalWaChats} / ${effectiveWaOutbound}`,
      catatan:
        itemNotes['3'] ||
        `Lead aktif: ${validLeads.length} · Masuk: ${effectiveWaInbound} · Follow-Up: ${effectiveWaOutbound} · SLA ≤5m: ${waStatus.metrics.slaCompliancePercent}%`,
    },
    {
      id: 4,
      cat: 'outreach',
      item: '4. Canvassing: kontak / brosur / lead berizin',
      target: '30 / 50 / 5',
      targetNum: 30,
      realisasi: `${Number(daily.canvassing_contacts || 0)} / ${Number(daily.canvassing_brochures || 0)} / ${effectiveCanvassingLeads}`,
      catatan:
        itemNotes['4'] ||
        (canvassingPipelineLeads.length > 0
          ? `${canvassingPipelineLeads.length} lead canvassing tercatat di Pipeline`
          : 'Zona A–E sesuai jadwal hari kerja'),
    },
    {
      id: 5,
      cat: 'outreach',
      item: '5. Posting pribadi: Reel / WA Status / Story',
      target: '1 / 5 / 3',
      targetNum: 9,
      realisasi: `${Number(daily.posted_reels || 0)} / ${Number(daily.posted_wa_status || 0)} / ${Number(daily.posted_stories || 0)}`,
      catatan: itemNotes['5'] || `Total ${totalPostingToday}/9 konten terpublikasi`,
    },
    {
      id: 6,
      cat: 'prospek',
      item: '6. Prospek baru terkualifikasi (BANT ≥ 7/12)',
      target: '2 prospek',
      targetNum: 2,
      realisasi: String(qualifiedProspects.length),
      catatan:
        itemNotes['6'] ||
        (qualifiedProspects.length > 0
          ? qualifiedProspects
              .slice(0, 2)
              .map((q) => `${q.full_name} (BANT ${q.bant_total}/12 · Grade ${q.grade})`)
              .join(', ')
          : 'Belum ada prospek BANT ≥ 7 di Pipeline'),
    },
    {
      id: 7,
      cat: 'prospek',
      item: '7. Appointment dibuat (janji tanggal & jam pasti)',
      target: '1 janji',
      targetNum: 1,
      realisasi: String(appointments.length),
      catatan:
        itemNotes['7'] ||
        (appointments.length > 0
          ? appointments.map((a) => `${a.full_name} (${a.unit_interest})`).slice(0, 2).join(', ')
          : 'Tercatat otomatis saat tahap lead diubah ke Appointment'),
    },
    {
      id: 8,
      cat: 'prospek',
      item: '8. Kunjungan lokasi / video-call tour hari ini',
      target: '1 kunjungan',
      targetNum: 1,
      realisasi: String(visits.length),
      catatan:
        itemNotes['8'] ||
        (visits.length > 0
          ? visits.map((v) => `${v.full_name} (${v.unit_interest})`).slice(0, 2).join(', ')
          : 'Tercatat otomatis saat tahap lead diubah ke Visited'),
    },
    {
      id: 9,
      cat: 'closing',
      item: '9. Penawaran / simulasi tertulis terkirim',
      target: '2 penawaran',
      targetNum: 2,
      realisasi: String(writtenOffers.length),
      catatan:
        itemNotes['9'] ||
        (writtenOffers.length > 0
          ? writtenOffers.map((w) => `${w.full_name} (${w.payment_scheme})`).slice(0, 2).join(', ')
          : 'Tercatat otomatis saat tombol Penawaran Tertulis dicentang di Pipeline'),
    },
    {
      id: 10,
      cat: 'closing',
      item: '10. Hot prospek (BANT ≥ 10/12 · Grade A)',
      target: '2 hot',
      targetNum: 2,
      realisasi: String(hotProspects.length),
      catatan:
        itemNotes['10'] ||
        (hotProspects.length > 0
          ? hotProspects.map((h) => `${h.full_name} (${h.unit_interest})`).slice(0, 2).join(', ')
          : warmProspects.length > 0
          ? `${warmProspects.length} Prospek Grade B siap dinaikkan ke Grade A (${warmProspects[0].full_name})`
          : 'Belum ada hot prospek Grade A'),
    },
    {
      id: 11,
      cat: 'closing',
      item: '11. Booking (Rp5 jt) / proses dokumen KPR',
      target: '1 booking',
      targetNum: 1,
      realisasi: String(bookings.length),
      catatan:
        itemNotes['11'] ||
        (bookings.length > 0
          ? `${bookings.length} unit booking (${bookings.map((b) => b.full_name).slice(0, 2).join(', ')}), ${netSales.length} Net Sales`
          : 'Belum ada booking terverifikasi'),
    },
    {
      id: 12,
      cat: 'prospek',
      item: '12. Nama referral diperoleh',
      target: '1 nama',
      targetNum: 1,
      realisasi: String(referrals.length),
      catatan:
        itemNotes['12'] ||
        (referrals.length > 0
          ? referrals.map((r) => r.full_name).slice(0, 3).join(', ')
          : 'Tercatat otomatis untuk lead dengan sumber Referral'),
    },
    {
      id: 13,
      cat: 'closing',
      item: '13. Hambatan & bantuan yang dibutuhkan dari TL/SM',
      target: 'Catatan',
      targetNum: null,
      realisasi: daily.hambatan_bantuan || itemNotes['13'] ? 'Terisi' : '-',
      catatan: daily.hambatan_bantuan || itemNotes['13'] || '',
    },
  ];

  // Hitung Skor KPI Harian & Mingguan secara terpisah agar switch Harian / Minggu / Bulan akurat
  const dailyTrackableItems = dailyReportItems.filter((item) => item.targetNum !== null && item.targetNum > 0);
  const dailyProgressSum = dailyTrackableItems.reduce((sum, item) => {
    const val = Number(item.realisasi) || 0;
    const tgt = Number(item.targetNum) || 1;
    return sum + Math.min(1, val / tgt);
  }, 0);
  const dailyKpiScore =
    dailyTrackableItems.length > 0
      ? Number(((dailyProgressSum / dailyTrackableItems.length) * 100).toFixed(1))
      : 0;
  const dailyTier =
    dailyKpiScore >= 85
      ? 'Target Harian Tercapai'
      : dailyKpiScore >= 50
      ? 'Progres Harian Baik'
      : dailyKpiScore > 0
      ? 'Perlu Akselerasi Hari Ini'
      : 'Belum Ada Aktivitas Hari Ini';

  const weeklyLeadRatio = Math.min(1, leadsWeekValid.length / 48);
  const weeklyQualRatio = Math.min(1, qualifiedWeek.length / 12);
  const weeklyVisitRatio = Math.min(1, visits.length / 4);
  const weeklyBookingRatio = Math.min(1, bookings.length / 1);
  const weeklyKpiScore = Number(
    (
      weeklyLeadRatio * 35 +
      weeklyQualRatio * 25 +
      weeklyVisitRatio * 20 +
      weeklyBookingRatio * 20
    ).toFixed(1)
  );
  const weeklyTier =
    weeklyKpiScore >= 85
      ? 'Target Mingguan Tercapai'
      : weeklyKpiScore >= 50
      ? 'Progres Mingguan Baik'
      : weeklyKpiScore > 0
      ? 'Tahap Awal Minggu Ini'
      : 'Belum Ada Aktivitas Minggu Ini';

  // Ringkasan per Periode (Harian, Minggu, Bulan) agar tombol switch di Kartu KPI berfungsi real
  const periods = {
    harian: {
      title: 'Skor KPI Harian',
      leadCardTitle: 'Lead Aktif & Baru Hari Ini',
      leadsCount: leadsTodayValid.length,
      leadsTarget: 8,
      leadsSubtext: `Total Pipeline Aktif: ${validLeads.length} Lead Valid${
        needsCompletionLeads.length > 0 ? ` · ${needsCompletionLeads.length} Perlu Dilengkapi` : ''
      }`,
      qualifiedCount: qualifiedProspects.length,
      hotCount: hotProspects.length,
      warmCount: warmProspects.length,
      bookingsCount: bookings.length,
      score: dailyKpiScore,
      maxScore: 100,
      tier: dailyTier,
      meta: `${leadsTodayValid.length} Baru Hari Ini (${validLeads.length} Aktif) · ${qualifiedProspects.length} Prospek BANT ≥ 7 · ${bookings.length} Booking`,
    },
    minggu: {
      title: 'Skor KPI Mingguan (7 Hari)',
      leadCardTitle: 'Lead Valid Minggu Ini',
      leadsCount: leadsWeekValid.length,
      leadsTarget: 48,
      leadsSubtext: `7 Hari Terakhir (WIB) · Total Aktif: ${validLeads.length} Lead Valid`,
      qualifiedCount: qualifiedWeek.length,
      hotCount: hotProspects.length,
      warmCount: warmProspects.length,
      bookingsCount: bookings.length,
      score: weeklyKpiScore,
      maxScore: 100,
      tier: weeklyTier,
      meta: `${leadsWeekValid.length} Lead Minggu Ini · ${qualifiedWeek.length} Prospek BANT ≥ 7 · ${bookings.length} Booking`,
    },
    bulan: {
      title: 'Skor KPI Bulanan',
      leadCardTitle: 'Lead Valid Bulan Ini',
      leadsCount: leadsMonthValid.length,
      leadsTarget: 200,
      leadsSubtext: `Bulan ${monthPrefix} · Total Aktif: ${validLeads.length} Lead Valid`,
      qualifiedCount: qualifiedMonth.length,
      hotCount: hotProspects.length,
      warmCount: warmProspects.length,
      bookingsCount: bookings.length,
      score: totalScorecardPoints,
      maxScore: 100,
      tier: scorecardCategory,
      meta: `${leadsMonthValid.length} Lead Bulan Ini · ${qualifiedMonth.length} Prospek BANT ≥ 7 · ${bookings.length} Booking`,
    },
  };

  // Quick Status Harian SE (Absensi, Rute Canvassing, Slot Konten Hari Ini)
  const dayNamesId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const wibNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const todayDayName = dayNamesId[wibNow.getUTCDay()] || 'Senin';

  const [todayFieldRows, todayRouteRows, todaySlotRows] = await Promise.all([
    sql`
      SELECT log_type, created_at
      FROM sales_os.se_field_logs
      WHERE se_email = ${seEmail}
        AND (created_at AT TIME ZONE 'Asia/Jakarta')::date = ${todayStr}::date
      ORDER BY created_at DESC
    `.catch(() => [] as any[]),
    sql`
      SELECT waypoints
      FROM sales_os.se_custom_routes
      WHERE se_email = ${seEmail} AND day_name = ${todayDayName}
      LIMIT 1
    `.catch(() => [] as any[]),
    sql`
      SELECT status, day_number, media_status
      FROM sales_os.se_content_slots
      WHERE se_email = ${seEmail}
        AND (report_date = ${todayStr}::date OR day_number = ${getWibClock().dayOfMonth})
    `.catch(() => [] as any[]),
  ]);

  const checkInRow = todayFieldRows.find((r: any) => r.log_type === 'CHECK_IN');
  const checkOutRow = todayFieldRows.find((r: any) => r.log_type === 'CHECK_OUT');
  const routeWps: any[] = Array.isArray(todayRouteRows[0]?.waypoints) ? todayRouteRows[0].waypoints : [];
  const routeVisitedCount = routeWps.filter((w) => Boolean(w?.visited)).length;
  const slotsUploadedToday = todaySlotRows.filter((s: any) => s.status === 'SUDAH_POSTING').length;
  const slotsReadyToPostToday = todaySlotRows.filter(
    (s: any) => s.media_status === 'READY' && s.status !== 'SUDAH_POSTING'
  ).length;

  const urgentLeads = validLeads.filter((l: any) => {
    const isWa =
      l.lead_origin === 'WA_BAILEYS' || /whatsapp inbound|baileys/i.test(String(l.source || ''));
    const noReplyYet = !String(l.last_sales_message || '').trim();
    return (isWa && noReplyYet) || (l.stage === 'NEW' && noReplyYet);
  });

  return {
    seEmail,
    seName,
    todayWib: todayStr,
    quickStatus: {
      checkedIn: Boolean(checkInRow),
      checkedOut: Boolean(checkOutRow),
      checkInTime: checkInRow?.created_at || null,
      routeDayName: todayDayName,
      routeVisitedCount,
      routeTotalCount: routeWps.length,
      slotsUploadedToday,
      slotsTotalToday: Math.max(3, todaySlotRows.length > 0 ? Math.min(3, todaySlotRows.length) : 3),
      slotsReadyToPostToday,
      urgentLeadsCount: urgentLeads.length,
      urgentLeadPreviews: urgentLeads.slice(0, 3).map((l: any) => ({
        id: String(l.id),
        fullName: String(l.full_name || 'Prospek'),
        phoneWa: String(l.phone_wa || ''),
        unitInterest: String(l.unit_interest || ''),
      })),
      reportSavedAt: daily.updated_at || null,
    },
    periods,
    metrics: {
      leadsTodayValidCount: leadsTodayValid.length,
      leadsCreatedTodayValidCount: leadsCreatedTodayValid.length,
      leadsWeekValidCount: leadsWeekValid.length,
      leadsMonthValidCount: leadsMonthValid.length,
      totalValidLeadsCount: validLeads.length,
      needsCompletionLeadsCount: needsCompletionLeads.length,
      qualifiedProspectsCount: qualifiedProspects.length,
      warmProspectsCount: warmProspects.length,
      appointmentsCount: appointments.length,
      visitsCount: visits.length,
      writtenOffersCount: writtenOffers.length,
      hotProspectsCount: hotProspects.length,
      bookingsCount: bookings.length,
      netSalesCount: netSales.length,
      netSalesRevenueIdr,
      activePipelineValueIdr,
      monthlyTargetRevenueIdr: 1700000000, // Target 2 unit/SE (~Rp1,7 Miliar)
      referralsCount: referrals.length,
      canvassingLeadsCount: effectiveCanvassingLeads,
      totalPostingToday,
      targetPostingToday: 9,
      waInboundMessages: effectiveWaInbound,
      waOutboundMessages: effectiveWaOutbound,
      totalWaInteractions: totalWaChats,
      waAvgResponseSeconds: waStatus.metrics.avgResponseSeconds,
      waSlaCompliancePercent: waStatus.metrics.slaCompliancePercent,
      waConnectionStatus: waStatus.status,
      waConnectedPhone: waStatus.phoneNumber,
    },
    scorecard: {
      totalPoints: totalScorecardPoints,
      category: scorecardCategory,
      rows: scorecardRows,
    },
    dailyReportItems,
    dailyActivityCounters: {
      dialCount: Number(daily.dial_count || 0),
      connectedCallCount: Number(daily.connected_call_count || 0),
      canvassingContacts: Number(daily.canvassing_contacts || 0),
      canvassingBrochures: Number(daily.canvassing_brochures || 0),
      canvassingLeads: effectiveCanvassingLeads,
      postedReels: Number(daily.posted_reels || 0),
      postedWaStatus: Number(daily.posted_wa_status || 0),
      postedStories: Number(daily.posted_stories || 0),
      hambatanBantuan: String(daily.hambatan_bantuan || ''),
    },
  };
}

// In-memory store ringan untuk Live Location SE (ala WA Live Location)
const liveSeLocationsMap = new Map<
  string,
  {
    seEmail: string;
    seName: string;
    role: string;
    lat: number;
    lng: number;
    accuracy?: number;
    locationLabel: string;
    updatedAt: string;
    timestamp: number;
  }
>();

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  try {
    // 0. AUTHENTICATION ENDPOINTS (Server-side session + TOTP 2FA, F91)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const resAuth = await startLogin(String(body.email || ''), String(body.password || ''), {
        userAgent: String(req.headers['user-agent'] || ''),
        ipAddress: String(req.socket?.remoteAddress || ''),
      });
      if (!resAuth.ok) {
        sendJson(res, 401, { ok: false, error: resAuth.error });
        return;
      }
      if (!resAuth.requiresMfa) {
        sendJson(
          res,
          200,
          {
            ok: true,
            requiresMfa: false,
            token: resAuth.token,
            expiresAt: resAuth.expiresAt,
            session: {
              role: resAuth.user.role,
              email: resAuth.user.email,
              name: resAuth.user.name,
              tenantId: resAuth.user.tenantId,
              projectId: resAuth.user.projectId,
              totpEnabled: Boolean(resAuth.user.totpEnabled),
              token: resAuth.token,
              loggedInAt: new Date().toISOString(),
              mfaVerified: false,
            },
          },
          { 'Set-Cookie': buildSessionCookieHeader(resAuth.token) }
        );
        return;
      }
      sendJson(res, 200, {
        ok: true,
        requiresMfa: true,
        mfaType: resAuth.mfaType,
        challengeId: resAuth.challengeId,
        email: resAuth.email,
        role: resAuth.role,
        name: resAuth.name,
      });
      return;
    }

    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const resReg = await registerUserAccount(
        {
          companyName: String(body.companyName || ''),
          name: String(body.name || ''),
          email: String(body.email || ''),
          phone: String(body.phone || ''),
          password: String(body.password || ''),
        },
        {
          userAgent: String(req.headers['user-agent'] || ''),
          ipAddress: String(req.socket?.remoteAddress || ''),
        }
      );
      if (!resReg.ok) {
        sendJson(res, 400, { ok: false, error: resReg.error });
        return;
      }
      sendJson(
        res,
        201,
        {
          ok: true,
          requiresMfa: false,
          token: resReg.token,
          expiresAt: resReg.expiresAt,
          session: {
            role: resReg.user.role,
            email: resReg.user.email,
            name: resReg.user.name,
            tenantId: resReg.user.tenantId,
            projectId: resReg.user.projectId,
            totpEnabled: false,
            token: resReg.token,
            loggedInAt: new Date().toISOString(),
            mfaVerified: false,
          },
        },
        { 'Set-Cookie': buildSessionCookieHeader(resReg.token) }
      );
      return;
    }

    if (pathname === '/api/auth/verify-mfa' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const resMfa = await verifyMfaAndCreateSession(
        String(body.challengeId || ''),
        String(body.code || ''),
        {
          userAgent: String(req.headers['user-agent'] || ''),
          ipAddress: String(req.socket?.remoteAddress || ''),
        }
      );
      if (!resMfa.ok) {
        sendJson(res, 401, { ok: false, error: resMfa.error });
        return;
      }
      sendJson(
        res,
        200,
        {
          ok: true,
          token: resMfa.token,
          expiresAt: resMfa.expiresAt,
          session: {
            role: resMfa.user.role,
            email: resMfa.user.email,
            name: resMfa.user.name,
            tenantId: resMfa.user.tenantId,
            projectId: resMfa.user.projectId,
            totpEnabled: true,
            token: resMfa.token,
            loggedInAt: new Date().toISOString(),
            mfaVerified: true,
            mfaMethod: 'AUTHENTICATOR_APP',
          },
        },
        { 'Set-Cookie': buildSessionCookieHeader(resMfa.token) }
      );
      return;
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      await revokeSession(req);
      sendJson(
        res,
        200,
        { ok: true },
        { 'Set-Cookie': buildClearSessionCookieHeader() }
      );
      return;
    }

    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const authed = await authenticateRequest(req);
      if (!authed) {
        sendJson(res, 401, { ok: false, error: 'Sesi tidak valid atau telah berakhir.' });
        return;
      }
      const permissions = await getEffectivePermissionsForUser(
        authed.tenantId,
        authed.userId,
        authed.role
      );
      sendJson(res, 200, { ok: true, user: authed, permissions });
      return;
    }

    // 1. HEALTH CHECK
    if (pathname === '/api/health' && req.method === 'GET') {
      const dbCheck = await sql`SELECT NOW() AS now`;
      sendJson(res, 200, {
        ok: true,
        dbConnected: dbCheck.length > 0,
        aiConfigured: Boolean(process.env.AI_ROUTER_API_KEY),
        model: process.env.AI_ROUTER_MODEL || 'andararejomakmurjosjis',
      });
      return;
    }

    // PUBLIC ROUTES (tidak butuh login dashboard)
    const isPublicRoute =
      pathname.startsWith('/api/public/') ||
      pathname.startsWith('/api/onboarding/') ||
      pathname.startsWith('/c/') ||
      pathname.startsWith('/api/se/media/') ||
      pathname === '/api/se/social/callback';

    let user: {
      userId?: string;
      email: string;
      name: string;
      role: RoleKey;
      tenantId: string;
      projectId?: string;
    };

    if (isPublicRoute) {
      user = {
        email: 'public@andararejomakmur.co.id',
        name: 'Public Visitor',
        role: 'SE',
        tenantId: 'andara_rejo_makmur',
        projectId: 'the-park-sukoharjo',
      };
    } else {
      const authedUser = await authenticateRequest(req);
      if (!authedUser) {
        sendJson(res, 401, { ok: false, error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
        return;
      }
      user = authedUser;
      if (!isPartnerRequestAllowed(user.role, pathname, req.method)) {
        sendJson(res, 403, { ok: false, error: 'Akses ditolak untuk akun mitra eksternal.' });
        return;
      }
    }

    // 2. DASHBOARD SE REAL DATA
    if (pathname === '/api/tenant/projects' && req.method === 'GET') {
      const rows = await sql`
        SELECT p.*,
          COALESCE((SELECT COUNT(*)::int FROM sales_os.project_units u WHERE u.tenant_id = p.tenant_id AND u.project_id = p.project_id), 0) AS unit_count,
          COALESCE((SELECT COUNT(*)::int FROM sales_os.project_units u WHERE u.tenant_id = p.tenant_id AND u.project_id = p.project_id AND u.status = 'sold'), 0) AS sold_count
        FROM sales_os.projects_registry p
        WHERE p.tenant_id = ${user.tenantId}
        ORDER BY p.created_at DESC
      `;
      sendJson(res, 200, { ok: true, tenantId: user.tenantId, projects: rows });
      return;
    }

    if (pathname === '/api/se/dashboard' && req.method === 'GET') {
      const data = await buildRealSeDashboardData(user.email, user.name);
      sendJson(res, 200, { ok: true, data });
      return;
    }

    // 3. UPDATE LOG AKTIVITAS HARIAN & CATATAN LAPORAN SE
    if (pathname === '/api/se/daily-activity' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const todayStr = toWibDateStr(new Date());
      const existing = await sql`
        SELECT * FROM sales_os.se_daily_notes
        WHERE se_email = ${user.email} AND report_date = ${todayStr}::date
        LIMIT 1
      `;
      const prev = existing[0] || {};
      const nextNotes = {
        ...(prev.item_notes || {}),
        ...(body.itemNotes || {}),
      };

      await sql`
        INSERT INTO sales_os.se_daily_notes (
          se_email, report_date, dial_count, connected_call_count,
          canvassing_contacts, canvassing_brochures, canvassing_leads,
          posted_reels, posted_wa_status, posted_stories, hambatan_bantuan, item_notes, updated_at
        ) VALUES (
          ${user.email},
          ${todayStr}::date,
          ${Number(body.dialCount ?? prev.dial_count ?? 0)},
          ${Number(body.connectedCallCount ?? prev.connected_call_count ?? 0)},
          ${Number(body.canvassingContacts ?? prev.canvassing_contacts ?? 0)},
          ${Number(body.canvassingBrochures ?? prev.canvassing_brochures ?? 0)},
          ${Number(body.canvassingLeads ?? prev.canvassing_leads ?? 0)},
          ${Number(body.postedReels ?? prev.posted_reels ?? 0)},
          ${Number(body.postedWaStatus ?? prev.posted_wa_status ?? 0)},
          ${Number(body.postedStories ?? prev.posted_stories ?? 0)},
          ${String(body.hambatanBantuan ?? prev.hambatan_bantuan ?? '')},
          ${sql.json(nextNotes)},
          NOW()
        )
        ON CONFLICT (se_email, report_date) DO UPDATE SET
          dial_count = EXCLUDED.dial_count,
          connected_call_count = EXCLUDED.connected_call_count,
          canvassing_contacts = EXCLUDED.canvassing_contacts,
          canvassing_brochures = EXCLUDED.canvassing_brochures,
          canvassing_leads = EXCLUDED.canvassing_leads,
          posted_reels = EXCLUDED.posted_reels,
          posted_wa_status = EXCLUDED.posted_wa_status,
          posted_stories = EXCLUDED.posted_stories,
          hambatan_bantuan = EXCLUDED.hambatan_bantuan,
          item_notes = EXCLUDED.item_notes,
          updated_at = NOW()
      `;

      const data = await buildRealSeDashboardData(user.email, user.name);
      sendJson(res, 200, { ok: true, data });
      return;
    }

    // ==========================================
    // COMPANY BANK ACCOUNTS (SM & ADMIN CRUD)
    // ==========================================
    if (pathname === '/api/company/bank-accounts' && req.method === 'GET') {
      const isSuperadminAll = user.role === 'SUPERADMIN_IT' && !req.headers['x-tenant-id'];
      const rows = isSuperadminAll
        ? await sql`
            SELECT * FROM sales_os.company_bank_accounts
            ORDER BY is_primary DESC, created_at ASC
          `
        : await sql`
            SELECT * FROM sales_os.company_bank_accounts
            WHERE tenant_id = ${user.tenantId}
            ORDER BY is_primary DESC, created_at ASC
          `;
      sendJson(res, 200, { ok: true, data: rows });
      return;
    }

    if (pathname === '/api/company/bank-accounts' && req.method === 'POST') {
      if (!['SM', 'ADMIN', 'DIREKSI', 'IT', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya role SM dan Admin yang berhak menambah rekening perusahaan.' });
        return;
      }
      const body = await readJsonBody(req);
      const bankName = String(body.bankName || '').trim();
      const accountNumber = String(body.accountNumber || '').trim();
      const accountHolder = String(body.accountHolder || '').trim();
      const projectId = String(body.projectId || '').trim();
      const isPrimary = Boolean(body.isPrimary);
      const notes = String(body.notes || '').trim();

      if (!bankName || !accountNumber || !accountHolder) {
        sendJson(res, 400, { ok: false, error: 'Nama Bank, Nomor Rekening, dan Atas Nama Rekening wajib diisi.' });
        return;
      }

      if (isPrimary) {
        await sql`UPDATE sales_os.company_bank_accounts SET is_primary = false WHERE project_id = ${projectId} AND tenant_id = ${user.tenantId}`;
      }

      const inserted = await sql`
        INSERT INTO sales_os.company_bank_accounts (
          tenant_id, project_id, bank_name, account_number, account_holder, is_primary, is_active, notes, created_by
        ) VALUES (
          ${user.tenantId}, ${projectId}, ${bankName}, ${accountNumber}, ${accountHolder}, ${isPrimary}, true, ${notes}, ${user.email}
        )
        RETURNING *
      `;

      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'CREATE',
        targetEntity: 'BANK_ACCOUNT',
        targetId: String(inserted[0].id),
        summary: `${user.name} (${user.role}) menambahkan rekening ${bankName} (${accountNumber}) a.n ${accountHolder}`,
        details: inserted[0],
      });

      sendJson(res, 201, { ok: true, data: inserted[0] });
      return;
    }

    if (pathname === '/api/company/bank-accounts' && req.method === 'PUT') {
      if (!['SM', 'ADMIN', 'DIREKSI', 'IT', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya role SM dan Admin yang berhak mengubah rekening perusahaan.' });
        return;
      }
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID rekening wajib disertakan.' });
        return;
      }
      const bankName = String(body.bankName || '').trim();
      const accountNumber = String(body.accountNumber || '').trim();
      const accountHolder = String(body.accountHolder || '').trim();
      const isPrimary = Boolean(body.isPrimary);
      const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
      const notes = String(body.notes || '').trim();

      if (isPrimary) {
        await sql`UPDATE sales_os.company_bank_accounts SET is_primary = false WHERE id != ${id} AND tenant_id = ${user.tenantId}`;
      }

      const updated = await sql`
        UPDATE sales_os.company_bank_accounts
        SET bank_name = COALESCE(NULLIF(${bankName}, ''), bank_name),
            account_number = COALESCE(NULLIF(${accountNumber}, ''), account_number),
            account_holder = COALESCE(NULLIF(${accountHolder}, ''), account_holder),
            is_primary = ${isPrimary},
            is_active = ${isActive},
            notes = ${notes},
            updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${user.tenantId}
        RETURNING *
      `;

      if (updated.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Rekening tidak ditemukan atau bukan milik tenant Anda.' });
        return;
      }

      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'UPDATE',
        targetEntity: 'BANK_ACCOUNT',
        targetId: id,
        summary: `${user.name} (${user.role}) memperbarui rekening ${updated[0].bank_name} (${updated[0].account_number})`,
        details: updated[0],
      });

      sendJson(res, 200, { ok: true, data: updated[0] });
      return;
    }

    if (pathname === '/api/company/bank-accounts' && req.method === 'DELETE') {
      if (!['SM', 'ADMIN', 'DIREKSI', 'IT', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya role SM dan Admin yang berhak menghapus rekening perusahaan.' });
        return;
      }
      const id = parsedUrl.searchParams.get('id') || (await readJsonBody(req)).id;
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID rekening wajib disertakan.' });
        return;
      }
      const deleted = await sql`
        DELETE FROM sales_os.company_bank_accounts
        WHERE id = ${id} AND tenant_id = ${user.tenantId}
        RETURNING *
      `;
      if (deleted.length > 0) {
        await recordAuditLog({
          tenantId: user.tenantId,
          actorEmail: user.email,
          actorName: user.name,
          actorRole: user.role,
          action: 'DELETE',
          targetEntity: 'BANK_ACCOUNT',
          targetId: String(id),
          summary: `${user.name} (${user.role}) menghapus rekening ${deleted[0].bank_name} (${deleted[0].account_number})`,
          details: deleted[0],
        });
      }
      sendJson(res, 200, { ok: true, message: 'Rekening berhasil dihapus.' });
      return;
    }

    // ==========================================
    // AUDIT LOGS AKTIVITAS CRUD PERUSAHAAN
    // ==========================================
    if (pathname === '/api/company/audit-logs' && req.method === 'GET') {
      const entity = parsedUrl.searchParams.get('entity');
      const action = parsedUrl.searchParams.get('action');
      const actorRole = parsedUrl.searchParams.get('actorRole');
      const actorEmail = parsedUrl.searchParams.get('actorEmail');
      const limit = Math.min(Number(parsedUrl.searchParams.get('limit') || 100), 200);
      const isSuperadminAll = user.role === 'SUPERADMIN_IT' && !req.headers['x-tenant-id'];

      const logs = await sql`
        SELECT
          a.*,
          COALESCE(u.name, a.actor_name) AS resolved_actor_name,
          COALESCE(u.role, a.actor_role) AS resolved_actor_role,
          u.project_id AS actor_project_id
        FROM sales_os.activity_audit_logs a
        LEFT JOIN sales_os.app_users u
          ON LOWER(u.email) = LOWER(a.actor_email)
         AND u.tenant_id = a.tenant_id
        WHERE 1=1
          ${isSuperadminAll ? sql`` : sql`AND a.tenant_id = ${user.tenantId}`}
          ${entity ? sql`AND a.target_entity = ${entity}` : sql``}
          ${action ? sql`AND a.action = ${action}` : sql``}
          ${actorRole ? sql`AND UPPER(COALESCE(u.role, a.actor_role)) = ${actorRole.toUpperCase()}` : sql``}
          ${actorEmail ? sql`AND LOWER(a.actor_email) = ${actorEmail.toLowerCase()}` : sql``}
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `;

      const teamMembers = await sql`
        SELECT id, name, email, role, project_id, is_active
        FROM sales_os.app_users
        WHERE tenant_id = ${user.tenantId}
          AND role NOT IN ('SUPERADMIN', 'SUPERADMIN_IT')
        ORDER BY role ASC, name ASC
      `;

      sendJson(res, 200, { ok: true, data: logs, teamMembers });
      return;
    }

    if (pathname === '/api/company/audit-logs' && req.method === 'POST') {
      const body = await readJsonBody(req);
      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: body.action || 'UPDATE',
        targetEntity: body.targetEntity || 'SYSTEM',
        targetId: body.targetId || 'general',
        summary: body.summary || `${user.name} melakukan pembaruan sistem`,
        details: body.details,
      });
      sendJson(res, 201, { ok: true });
      return;
    }

    // ==========================================
    // WHATSAPP SUPPRESSION LIST (UU PDP No. 27/2022 / T3)
    // ==========================================
    if (pathname === '/api/wa/suppression-list' && req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM sales_os.wa_suppression_list
        WHERE tenant_id = ${user.tenantId}
        ORDER BY opted_out_at DESC
        LIMIT 100
      `;
      sendJson(res, 200, { ok: true, data: rows });
      return;
    }

    if (pathname === '/api/wa/suppression-list' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const action = String(body.action || 'ADD').toUpperCase();
      const phoneNumber = cleanPhoneWa(String(body.phoneNumber || ''));

      if (!phoneNumber) {
        sendJson(res, 400, { ok: false, error: 'phoneNumber wajib disertakan.' });
        return;
      }

      if (action === 'REMOVE') {
        await removePhoneFromSuppression(phoneNumber);
        await recordAuditLog({
          tenantId: user.tenantId,
          actorEmail: user.email,
          actorName: user.name,
          actorRole: user.role,
          action: 'DELETE',
          targetEntity: 'LEAD',
          targetId: phoneNumber,
          summary: `${user.name} menghapus nomor ${phoneNumber} dari WA Suppression List`,
        });
        sendJson(res, 200, { ok: true, message: 'Nomor dihapus dari suppression list' });
        return;
      }

      await addPhoneToSuppression({
        phoneNumber,
        leadName: body.leadName,
        reason: body.reason || 'MANUAL_ADMIN_ADD',
        notes: body.notes || `Ditambahkan oleh ${user.name}`,
      });

      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'CREATE',
        targetEntity: 'LEAD',
        targetId: phoneNumber,
        summary: `${user.name} menambahkan nomor ${phoneNumber} ke WA Suppression List (UU PDP)`,
      });

      sendJson(res, 201, { ok: true, message: 'Nomor berhasil masuk suppression list' });
      return;
    }

    // ==========================================
    // AIC FINOPS METERING & WALLET (T7 / F93 / Bab 11)
    // ==========================================
    if (pathname === '/api/aic/wallet' && req.method === 'GET') {
      const tenantId = resolveStrictTenantId({
        sessionTenantId: user.tenantId,
        actorRole: user.role,
        requestedTenantId: parsedUrl.searchParams.get('tenantId'),
      });
      const wallet = await getTenantAicWallet(tenantId);
      const recentTx = await sql`
        SELECT * FROM sales_os.aic_transactions
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
        LIMIT 20
      `;
      sendJson(res, 200, { ok: true, data: { wallet, transactions: recentTx } });
      return;
    }

    if (pathname === '/api/aic/top-up' && req.method === 'POST') {
      if (user.role !== 'SUPERADMIN_IT' && user.role !== 'DIREKSI' && user.role !== 'SM') {
        sendJson(res, 403, { ok: false, error: 'Hanya Admin/SM/Direksi yang dapat melakukan top-up AIC.' });
        return;
      }
      const body = await readJsonBody(req);
      const amount = Number(body.amountAic || 1000);
      const notes = String(body.notes || 'Top-up Kuota AI');
      const targetTenantId = resolveStrictTenantId({
        sessionTenantId: user.tenantId,
        actorRole: user.role,
        requestedTenantId: body.tenantId ? String(body.tenantId) : null,
      });
      const newBalance = await topUpTenantAic({
        tenantId: targetTenantId,
        amountAic: amount,
        adminEmail: user.email,
        notes,
      });

      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'UPDATE',
        targetEntity: 'SYSTEM',
        targetId: 'tenant_aic_wallets',
        summary: `${user.name} melakukan Top-Up ${amount} AIC (Saldo Baru: ${newBalance} AIC)`,
      });

      sendJson(res, 200, { ok: true, balanceAic: newBalance });
      return;
    }

    // ==========================================
    // SE ACTIVITY COPILOT LOG (M17 F100)
    // ==========================================
    if (pathname === '/api/se/activity-guide/log' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const activityKey = String(body.activityKey || 'site_visit');
      const activityLabel = String(body.activityLabel || 'Site Visit');
      const notes = String(body.notes || '');
      const locationLabel = String(body.locationLabel || 'Lokasi Proyek');
      const completedSteps = Array.isArray(body.completedSteps) ? body.completedSteps : [];

      // Debet 5 AIC tarif F100
      const aicResult = await deductAicFromWallet({
        tenantId: 'andara_rejo_makmur',
        featureId: 'F100',
        featureName: `AI Activity Copilot: ${activityLabel}`,
        amountAic: 5,
      });

      await sql`
        INSERT INTO sales_os.se_field_logs (
          se_email, se_name, log_type, title, location_label, outcome, notes, payload
        ) VALUES (
          ${user.email}, ${user.name}, 'AI_ACTIVITY_GUIDE',
          ${'Eksekusi Copilot: ' + activityLabel},
          ${locationLabel},
          'SUCCESS',
          ${notes || ('Menyelesaikan panduan aktivitas SE: ' + activityLabel)},
          ${sql.json({ completedSteps, activityKey, aicDebited: 5, balanceAfter: aicResult.balanceAfter })}
        )
      `;

      sendJson(res, 201, {
        ok: true,
        message: `Aktivitas ${activityLabel} berhasil dicatat (5 AIC didebet).`,
        balanceAic: aicResult.balanceAfter,
      });
      return;
    }

    // ==========================================
    // LEAD POOL: CLAIM, REASSIGN, RELEASE
    // ==========================================
    if (pathname === '/api/pipeline/leads/claim' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const leadId = String(body.leadId || '');
      if (!leadId) {
        sendJson(res, 400, { ok: false, error: 'leadId wajib disertakan.' });
        return;
      }
      const existing = await sql`
        SELECT * FROM sales_os.pipeline_leads WHERE id = ${leadId} AND tenant_id = ${user.tenantId} LIMIT 1
      `;
      if (existing.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Lead tidak ditemukan atau bukan milik tenant Anda.' });
        return;
      }
      const lead = existing[0];
      const prevOwner = lead.owner_se_name || lead.owner_se_email;

      const updated = await sql`
        UPDATE sales_os.pipeline_leads
        SET owner_se_email = ${user.email},
            owner_se_name = ${user.name},
            is_in_pool = false,
            pool_reason = '',
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = ${leadId} AND tenant_id = ${user.tenantId}
        RETURNING *
      `;

      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'CLAIM',
        targetEntity: 'LEAD',
        targetId: leadId,
        summary: `SE ${user.name} mengklaim lead "${lead.full_name}" dari Lead Pool (sebelumnya: ${prevOwner})`,
        details: { prevOwner, newOwner: user.name, lead: updated[0] },
      });

      sendJson(res, 200, { ok: true, lead: updated[0] });
      return;
    }

    if (pathname === '/api/pipeline/leads/reassign' && req.method === 'POST') {
      if (!['TL', 'SM', 'ADMIN', 'DIREKSI', 'IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya SM, TL, dan Admin yang berhak menugaskan lead.' });
        return;
      }
      const body = await readJsonBody(req);
      const leadId = String(body.leadId || '');
      const targetSeEmail = String(body.targetSeEmail || '').trim().toLowerCase();
      const targetSeName = String(body.targetSeName || '').trim();

      if (!leadId || !targetSeEmail || !targetSeName) {
        sendJson(res, 400, { ok: false, error: 'leadId, targetSeEmail, dan targetSeName wajib diisi.' });
        return;
      }

      const existing = await sql`SELECT * FROM sales_os.pipeline_leads WHERE id = ${leadId} AND tenant_id = ${user.tenantId} LIMIT 1`;
      if (existing.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Lead tidak ditemukan atau bukan milik tenant Anda.' });
        return;
      }
      const lead = existing[0];

      const updated = await sql`
        UPDATE sales_os.pipeline_leads
        SET owner_se_email = ${targetSeEmail},
            owner_se_name = ${targetSeName},
            is_in_pool = false,
            pool_reason = '',
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = ${leadId} AND tenant_id = ${user.tenantId}
        RETURNING *
      `;

      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'REASSIGN',
        targetEntity: 'LEAD',
        targetId: leadId,
        summary: `${user.name} (${user.role}) menugaskan lead "${lead.full_name}" ke ${targetSeName} (${targetSeEmail})`,
        details: { prevOwner: lead.owner_se_name, targetSeName, targetSeEmail },
      });

      sendJson(res, 200, { ok: true, lead: updated[0] });
      return;
    }

    if (pathname === '/api/pipeline/leads/release-to-pool' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const leadId = String(body.leadId || '');
      const reason = String(body.reason || 'Dilepas ke pool umum / tidak ada respons > 24 jam').trim();

      const existing = await sql`SELECT * FROM sales_os.pipeline_leads WHERE id = ${leadId} AND tenant_id = ${user.tenantId} LIMIT 1`;
      if (existing.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Lead tidak ditemukan atau bukan milik tenant Anda.' });
        return;
      }
      const lead = existing[0];

      const updated = await sql`
        UPDATE sales_os.pipeline_leads
        SET is_in_pool = true,
            pool_reason = ${reason},
            updated_at = NOW()
        WHERE id = ${leadId} AND tenant_id = ${user.tenantId}
        RETURNING *
      `;

      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'UPDATE',
        targetEntity: 'LEAD',
        targetId: leadId,
        summary: `${user.name} (${user.role}) mengembalikan lead "${lead.full_name}" ke Lead Pool (${reason})`,
        details: { reason, previousOwner: lead.owner_se_name },
      });

      sendJson(res, 200, { ok: true, lead: updated[0] });
      return;
    }

    // 4. GET PIPELINE LEADS (Terisolasi ketat untuk SE yang login & per Tenant; TL/SM/DIREKSI dapat melihat tim di tenantnya)
    if (pathname === '/api/pipeline/leads' && req.method === 'GET') {
      const isWideRole = ['TL', 'SM', 'DIREKSI', 'ADMIN', 'IT'].includes(user.role);
      const isSuperadminAll = user.role === 'SUPERADMIN_IT' && !req.headers['x-tenant-id'];
      const leads = isSuperadminAll
        ? await sql`
            SELECT l.*,
              (
                SELECT row_to_json(a)
                FROM sales_os.lead_ai_analyses a
                WHERE a.lead_id = l.id
                ORDER BY a.created_at DESC
                LIMIT 1
              ) AS latest_analysis
            FROM sales_os.pipeline_leads l
            ORDER BY l.created_at DESC
          `
        : isWideRole
        ? await sql`
            SELECT l.*,
              (
                SELECT row_to_json(a)
                FROM sales_os.lead_ai_analyses a
                WHERE a.lead_id = l.id
                ORDER BY a.created_at DESC
                LIMIT 1
              ) AS latest_analysis
            FROM sales_os.pipeline_leads l
            WHERE l.tenant_id = ${user.tenantId}
            ORDER BY l.created_at DESC
          `
        : await sql`
            SELECT l.*,
              (
                SELECT row_to_json(a)
                FROM sales_os.lead_ai_analyses a
                WHERE a.lead_id = l.id
                ORDER BY a.created_at DESC
                LIMIT 1
              ) AS latest_analysis
            FROM sales_os.pipeline_leads l
            WHERE l.tenant_id = ${user.tenantId}
              AND (l.owner_se_email = ${user.email} OR (l.is_in_pool = true AND ${!isExternalPartnerRole(user.role)}::boolean))
            ORDER BY l.created_at DESC
          `;

      // Riwayat chat baru dibuka bila login sudah diverifikasi server (API masih memercayai header klien).
      const turnsByLead =
        process.env.WA_HISTORY_API === 'on' ? await getTurnsForLeads(leads as any[]).catch(() => new Map()) : new Map();
      const enrichedLeads = leads.map((l: any) => ({
        ...l,
        chat_turns: turnsByLead.get(`${String(l.owner_se_email).toLowerCase()}|${l.phone_wa}`) || [],
        is_ai_analyzing: isLeadCurrentlyAnalyzing(String(l.id)),
      }));

      sendJson(res, 200, { ok: true, leads: enrichedLeads });
      return;
    }

    // 5. CREATE NEW LEAD + PERSONA + AI ANALYSIS
    if (pathname === '/api/pipeline/leads' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const fullName = String(body.fullName || '').trim();
      const phoneWa = normalizePhoneWa(String(body.phoneWa || ''));
      if (!phoneWa) {
        sendJson(res, 400, { ok: false, error: 'Nomor WhatsApp wajib diisi dengan format yang benar.' });
        return;
      }

      const domicile = String(body.domicile || '').trim();
      const source = String(body.source || 'Input Manual SE').trim();
      const contentCode = String(body.contentCode || '').trim();
      const stage = (body.stage || 'NEW') as PipelineStageCode;
      const personaCode = (body.personaCode || 'P1') as PersonaCode;
      const personaProfile = (body.personaProfile || {}) as Record<string, string>;
      const unitInterest = String(body.unitInterest || PLAYBOOK_UNIT_CATALOG[0].label);
      const matchedUnit = PLAYBOOK_UNIT_CATALOG.find((u) => u.label === unitInterest);
      const unitPriceIdr = Number(body.unitPriceIdr || matchedUnit?.priceCashIdr || 650000000);
      const clusterInterest = matchedUnit?.cluster || String(body.clusterInterest || 'Nagoya');
      const paymentScheme = String(body.paymentScheme || 'KPR');
      const salesNotes = String(body.salesNotes || '').trim();
      const nextAction = String(body.nextAction || '').trim();

      const bantEval = evaluatePlaybookBant(
        Number(body.bantB ?? 1),
        Number(body.bantA ?? 1),
        Number(body.bantN ?? 2),
        Number(body.bantT ?? 1)
      );

      const leadOrigin =
        /whatsapp inbound|baileys/i.test(source) || body.leadOrigin === 'WA_BAILEYS'
          ? 'WA_BAILEYS'
          : 'MANUAL';
      const lastCustomerMessage = String(body.lastCustomerMessage || '').trim();
      const lastSalesMessage = String(body.lastSalesMessage || '').trim();

      // Screening Kualitas Lead & Anti-Spam (DEV-26 / Blueprint F45)
      const screening = screenLeadQuality({
        fullName,
        phoneWa,
        source,
        messageText: lastCustomerMessage,
        domicile,
      });
      const leadQuality = screening.quality;
      const spamReason = screening.isSpam ? screening.reason : '';
      const isInPool = Boolean(body.isInPool) || false;
      const poolReason = String(body.poolReason || (isInPool ? 'Lead Baru Siap Diambil Alih' : '')).trim();

      // Kepatuhan UU PDP (Temuan T3 / F92): Deteksi Opt-Out pada pesan masuk & suppression list
      const customerOptedOut = isOptOutKeyword(lastCustomerMessage);
      const isSuppressed = (await isPhoneSuppressed(phoneWa)) || customerOptedOut;
      const waConsent = customerOptedOut ? 'REVOKED' : isSuppressed ? 'REVOKED' : 'PENDING';

      if (customerOptedOut) {
        await addPhoneToSuppression({
          phoneNumber: phoneWa,
          leadName: fullName,
          reason: 'USER_OPT_OUT',
          notes: 'Konsumen mengirimkan kata kunci opt-out (STOP) pada pesan awal',
        });
      }

      // FinOps AIC Metering (Temuan T7 / F93): Verifikasi Saldo & Hard Budget Capping
      const wallet = await getTenantAicWallet(user.tenantId);
      if (wallet.isThrottled || wallet.balanceAic < 2) {
        sendJson(res, 402, {
          ok: false,
          error: 'INSUFFICIENT_AIC',
          message: 'Saldo AI Credit (AIC) telah habis. Layanan analisis generatif AI dihentikan sementara hingga top-up dilakukan.',
        });
        return;
      }

      // Jalankan Analisis AI (9router + Playbook v1.2 Dual-Track)
      const verifiedBanks = await getVerifiedCompanyBankAccounts(user.tenantId);
      const aiResult = await analyzeLeadWithAi({
        fullName,
        phoneWa,
        domicile,
        source,
        contentCode,
        stage,
        personaCode,
        personaProfile,
        unitInterest,
        paymentScheme,
        bantB: bantEval.b,
        bantA: bantEval.a,
        bantN: bantEval.n,
        bantT: bantEval.t,
        salesNotes,
        leadOrigin,
        lastCustomerMessage,
        lastSalesMessage,
        interactionCount: 1,
        seName: user.name,
        companyBankAccounts: verifiedBanks,
        isSuppressed,
        waConsent,
      });

      // Potong 2 AIC untuk analisis lead F45
      await deductAicFromWallet({
        tenantId: user.tenantId,
        featureId: 'F45',
        featureName: `Analisis AI Lead: ${fullName}`,
        amountAic: 2,
        tokensUsed: (aiResult.prompt_tokens || 0) + (aiResult.completion_tokens || 0),
      });

      const validityStatus =
        aiResult.clarity_status === 'PERLU_DILENGKAPI' ? 'PERLU_DILENGKAPI' : 'VALID';

      const finalBant = evaluatePlaybookBant(
        Number(body.bantB ?? aiResult.recommended_bant.b),
        Number(body.bantA ?? aiResult.recommended_bant.a),
        Number(body.bantN ?? aiResult.recommended_bant.n),
        Number(body.bantT ?? aiResult.recommended_bant.t)
      );

      const initialWrittenOffer =
        body.writtenOfferSent !== undefined
          ? Boolean(body.writtenOfferSent)
          : ['HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(stage);
      const initialBookingPaid =
        body.bookingFeePaid !== undefined
          ? Boolean(body.bookingFeePaid)
          : ['BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(stage);
      const initialDpVerified =
        body.dpOrSp3kVerified !== undefined
          ? Boolean(body.dpOrSp3kVerified)
          : stage === 'PPJB_AKAD';
      const initialAppointmentAt =
        ['APPOINTMENT', 'VISITED', 'HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(stage)
          ? new Date().toISOString()
          : null;
      const initialVisitedAt =
        ['VISITED', 'HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(stage)
          ? new Date().toISOString()
          : null;

      const upserted = await sql`
        INSERT INTO sales_os.pipeline_leads (
          tenant_id, owner_se_email, owner_se_name, full_name, phone_wa, domicile, source, content_code,
          stage, validity_status, persona_code, persona_profile,
          bant_b, bant_a, bant_n, bant_t, bant_total, grade,
          cluster_interest, unit_interest, unit_price_idr, payment_scheme,
          written_offer_sent, booking_fee_paid, dp_or_sp3k_verified, appointment_at, visited_at,
          sales_notes, next_action, lead_origin, last_customer_message, last_sales_message, interaction_count,
          lead_quality, spam_reason, is_in_pool, pool_reason, last_activity_at
        ) VALUES (
          ${user.tenantId},
          ${user.email},
          ${user.name},
          ${fullName || `Prospek ${phoneWa.slice(-4)}`},
          ${phoneWa},
          ${domicile},
          ${source},
          ${contentCode},
          ${stage},
          ${validityStatus},
          ${personaCode},
          ${sql.json(personaProfile)},
          ${finalBant.b},
          ${finalBant.a},
          ${finalBant.n},
          ${finalBant.t},
          ${finalBant.total},
          ${finalBant.grade},
          ${clusterInterest},
          ${unitInterest},
          ${unitPriceIdr},
          ${paymentScheme},
          ${initialWrittenOffer},
          ${initialBookingPaid},
          ${initialDpVerified},
          ${initialAppointmentAt},
          ${initialVisitedAt},
          ${salesNotes},
          ${nextAction || aiResult.rekomendasi[0] || finalBant.seAction},
          ${leadOrigin},
          ${lastCustomerMessage},
          ${lastSalesMessage},
          ${1},
          ${leadQuality},
          ${spamReason},
          ${isInPool},
          ${poolReason},
          NOW()
        )
        ON CONFLICT (tenant_id, owner_se_email, phone_wa) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          domicile = EXCLUDED.domicile,
          source = EXCLUDED.source,
          content_code = EXCLUDED.content_code,
          stage = EXCLUDED.stage,
          validity_status = EXCLUDED.validity_status,
          persona_code = EXCLUDED.persona_code,
          persona_profile = EXCLUDED.persona_profile,
          bant_b = EXCLUDED.bant_b,
          bant_a = EXCLUDED.bant_a,
          bant_n = EXCLUDED.bant_n,
          bant_t = EXCLUDED.bant_t,
          bant_total = EXCLUDED.bant_total,
          grade = EXCLUDED.grade,
          cluster_interest = EXCLUDED.cluster_interest,
          unit_interest = EXCLUDED.unit_interest,
          unit_price_idr = EXCLUDED.unit_price_idr,
          payment_scheme = EXCLUDED.payment_scheme,
          written_offer_sent = COALESCE(sales_os.pipeline_leads.written_offer_sent, FALSE) OR EXCLUDED.written_offer_sent,
          booking_fee_paid = COALESCE(sales_os.pipeline_leads.booking_fee_paid, FALSE) OR EXCLUDED.booking_fee_paid,
          dp_or_sp3k_verified = COALESCE(sales_os.pipeline_leads.dp_or_sp3k_verified, FALSE) OR EXCLUDED.dp_or_sp3k_verified,
          appointment_at = COALESCE(sales_os.pipeline_leads.appointment_at, EXCLUDED.appointment_at),
          visited_at = COALESCE(sales_os.pipeline_leads.visited_at, EXCLUDED.visited_at),
          sales_notes = EXCLUDED.sales_notes,
          next_action = EXCLUDED.next_action,
          lead_origin = EXCLUDED.lead_origin,
          lead_quality = EXCLUDED.lead_quality,
          spam_reason = EXCLUDED.spam_reason,
          is_in_pool = EXCLUDED.is_in_pool,
          pool_reason = EXCLUDED.pool_reason,
          last_activity_at = NOW(),
          updated_at = NOW()
        RETURNING *
      `;

      const leadRow = upserted[0];

      const analysisRow = await sql`
        INSERT INTO sales_os.lead_ai_analyses (
          lead_id, owner_se_email, skor, label, clarity_status, unclear_parts, ringkas,
          poin_kuat, poin_lemah, perlu_dicek_ulang, rekomendasi, recommended_persona,
          recommended_bant, followup_draft_message, model, prompt_tokens, completion_tokens
        ) VALUES (
          ${leadRow.id},
          ${user.email},
          ${aiResult.skor},
          ${aiResult.label},
          ${aiResult.clarity_status},
          ${sql.json(aiResult.unclear_parts as any)},
          ${aiResult.ringkas},
          ${sql.json(aiResult.poin_kuat as any)},
          ${sql.json(aiResult.poin_lemah as any)},
          ${sql.json(aiResult.perlu_dicek_ulang as any)},
          ${sql.json(aiResult.rekomendasi as any)},
          ${aiResult.recommended_persona},
          ${sql.json(aiResult.recommended_bant as any)},
          ${aiResult.followup_draft_message},
          ${aiResult.model},
          ${aiResult.prompt_tokens},
          ${aiResult.completion_tokens}
        )
        RETURNING *
      `;

      await recordAuditLog({
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'CREATE',
        targetEntity: 'LEAD',
        targetId: String(leadRow.id),
        summary: `${user.name} (${user.role}) membuat lead baru "${leadRow.full_name}" (${leadRow.phone_wa}) - Kualitas: ${leadQuality}`,
        details: { lead: leadRow, screening },
      });

      sendJson(res, 201, {
        ok: true,
        lead: { ...leadRow, latest_analysis: analysisRow[0] },
      });
      return;
    }

    // 6. UPDATE LEAD (Tahap Pipeline, BANT, Persona, Catatan, Penawaran, Booking, Alasan Kalah)
    const patchMatch = pathname.match(/^\/api\/pipeline\/leads\/([0-9a-fA-F-]+)$/);
    if (patchMatch && req.method === 'PATCH') {
      const leadId = patchMatch[1];
      const body = await readJsonBody(req);

      const existingRows = await sql`
        SELECT * FROM sales_os.pipeline_leads WHERE id = ${leadId} LIMIT 1
      `;
      if (existingRows.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Data lead tidak ditemukan.' });
        return;
      }
      const prev = existingRows[0];
      if (prev.tenant_id && prev.tenant_id !== user.tenantId && user.role !== 'SUPERADMIN_IT') {
        sendJson(res, 403, { ok: false, error: 'Akses ditolak: Lead ini milik tenant lain.' });
        return;
      }
      if (prev.owner_se_email !== user.email && !['TL', 'SM', 'DIREKSI'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Akses ditolak: Lead ini milik SE lain.' });
        return;
      }

      const nextStage = String(body.stage ?? prev.stage) as PipelineStageCode;
      const nextLostReason = body.lostReason !== undefined ? String(body.lostReason) : prev.lost_reason;

      if (nextStage === 'CLOSED_LOST' && !nextLostReason) {
        sendJson(res, 400, {
          ok: false,
          error: 'Tahap Closed-Lost wajib memilih alasan kalah standar (Playbook §13.4).',
        });
        return;
      }

      const nextBant = evaluatePlaybookBant(
        Number(body.bantB ?? prev.bant_b),
        Number(body.bantA ?? prev.bant_a),
        Number(body.bantN ?? prev.bant_n),
        Number(body.bantT ?? prev.bant_t)
      );

      const nextUnitInterest = String(body.unitInterest ?? prev.unit_interest);
      const matchedUnit = PLAYBOOK_UNIT_CATALOG.find((u) => u.label === nextUnitInterest);
      const nextUnitPrice = Number(body.unitPriceIdr ?? matchedUnit?.priceCashIdr ?? prev.unit_price_idr);
      const nextCluster = matchedUnit?.cluster || String(body.clusterInterest ?? prev.cluster_interest);

      const nextFullName = String(body.fullName ?? prev.full_name).trim();
      const nextDomicile = String(body.domicile ?? prev.domicile).trim();
      const nextNotes = String(body.salesNotes ?? prev.sales_notes).trim();
      const nextPersona = (body.personaCode ?? prev.persona_code) as PersonaCode;
      const nextPersonaProfile = body.personaProfile ?? prev.persona_profile ?? {};
      const nextPaymentScheme = String(body.paymentScheme ?? prev.payment_scheme);

      const writtenOfferSent =
        body.writtenOfferSent !== undefined
          ? Boolean(body.writtenOfferSent)
          : ['HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(nextStage)
          ? true
          : Boolean(prev.written_offer_sent);

      const bookingFeePaid =
        body.bookingFeePaid !== undefined
          ? Boolean(body.bookingFeePaid)
          : ['BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(nextStage)
          ? true
          : Boolean(prev.booking_fee_paid);

      const dpVerified =
        body.dpOrSp3kVerified !== undefined
          ? Boolean(body.dpOrSp3kVerified)
          : nextStage === 'PPJB_AKAD'
          ? true
          : Boolean(prev.dp_or_sp3k_verified);

      const appointmentAt =
        nextStage === 'APPOINTMENT' && !prev.appointment_at
          ? new Date().toISOString()
          : prev.appointment_at;

      const visitedAt =
        ['VISITED', 'HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(nextStage) &&
        !prev.visited_at
          ? new Date().toISOString()
          : prev.visited_at;

      // Jika data dilengkapi, tahap/unit/skema/BANT berubah, atau diminta reanalyze, jalankan AI lagi
      let validityStatus = String(prev.validity_status);
      let latestAnalysis = null;

      const stageChanged = body.stage !== undefined && nextStage !== String(prev.stage);
      const unitOrSchemeChanged =
        (body.unitInterest !== undefined && nextUnitInterest !== String(prev.unit_interest)) ||
        (body.paymentScheme !== undefined && nextPaymentScheme !== String(prev.payment_scheme));
      const personaOrBantChanged =
        (body.personaCode !== undefined && nextPersona !== String(prev.persona_code)) ||
        nextBant.total !== Number(prev.bant_total);

      if (
        body.reanalyze ||
        prev.validity_status === 'PERLU_DILENGKAPI' ||
        stageChanged ||
        unitOrSchemeChanged ||
        personaOrBantChanged ||
        body.salesNotes !== undefined ||
        body.fullName !== undefined ||
        body.domicile !== undefined
      ) {
        const nextSource = String(body.source ?? prev.source);
        const resolvedOrigin =
          prev.lead_origin === 'WA_BAILEYS' || /whatsapp inbound|baileys/i.test(nextSource)
            ? 'WA_BAILEYS'
            : 'MANUAL';

        const prevAnalysisRows = await sql`
          SELECT ringkas, rekomendasi, followup_draft_message
          FROM sales_os.lead_ai_analyses
          WHERE lead_id = ${leadId}
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const prevAnalysis = prevAnalysisRows[0]
          ? {
              ringkas: String(prevAnalysisRows[0].ringkas || ''),
              rekomendasi: Array.isArray(prevAnalysisRows[0].rekomendasi)
                ? (prevAnalysisRows[0].rekomendasi as string[])
                : [],
              followup_draft_message: String(prevAnalysisRows[0].followup_draft_message || ''),
            }
          : undefined;

        // Kepatuhan UU PDP (Temuan T3 / F92): Deteksi Opt-Out pada update/chat baru
        const incomingOptOut = isOptOutKeyword(String(body.lastCustomerMessage || ''));
        const isSuppressed = (await isPhoneSuppressed(String(prev.phone_wa))) || incomingOptOut;
        const nextWaConsent = incomingOptOut ? 'REVOKED' : isSuppressed ? 'REVOKED' : (prev.wa_consent || 'PENDING');

        if (incomingOptOut) {
          await addPhoneToSuppression({
            phoneNumber: String(prev.phone_wa),
            leadId: String(prev.id),
            leadName: nextFullName,
            reason: 'USER_OPT_OUT',
            notes: 'Konsumen mengirimkan kata kunci opt-out (STOP/Berhenti)',
          });
        }

        // FinOps AIC Metering (Temuan T7 / F93): Verifikasi Saldo & Hard Budget Capping
        const wallet = await getTenantAicWallet(user.tenantId);
        if (wallet.isThrottled || wallet.balanceAic < 2) {
          sendJson(res, 402, {
            ok: false,
            error: 'INSUFFICIENT_AIC',
            message: 'Saldo AI Credit (AIC) telah habis. Layanan analisis generatif AI dihentikan sementara hingga top-up dilakukan.',
          });
          return;
        }

        const verifiedBanks = await getVerifiedCompanyBankAccounts(user.tenantId);
        const aiResult = await analyzeLeadWithAi({
          fullName: nextFullName,
          phoneWa: String(prev.phone_wa),
          domicile: nextDomicile,
          source: nextSource,
          contentCode: String(body.contentCode ?? prev.content_code),
          stage: nextStage,
          personaCode: nextPersona,
          personaProfile: nextPersonaProfile,
          unitInterest: nextUnitInterest,
          paymentScheme: nextPaymentScheme,
          bantB: nextBant.b,
          bantA: nextBant.a,
          bantN: nextBant.n,
          bantT: nextBant.t,
          salesNotes: nextNotes,
          leadOrigin: resolvedOrigin,
          lastCustomerMessage: String(body.lastCustomerMessage ?? prev.last_customer_message ?? ''),
          lastSalesMessage: String(body.lastSalesMessage ?? prev.last_sales_message ?? ''),
          interactionCount: Number(prev.interaction_count || 1),
          turns: await getTurns(String(prev.owner_se_email).toLowerCase(), String(prev.phone_wa)).catch(() => []),
          seName: String(prev.owner_se_name || user.name),
          isReanalyze: Boolean(body.reanalyze),
          previousAnalysis: prevAnalysis,
          companyBankAccounts: verifiedBanks,
          isSuppressed,
          waConsent: nextWaConsent,
        });

        // Potong 2 AIC untuk analisis ulang / update F45
        await deductAicFromWallet({
          tenantId: user.tenantId,
          featureId: 'F45',
          featureName: `Re-Analisis AI Lead: ${nextFullName}`,
          amountAic: 2,
          tokensUsed: (aiResult.prompt_tokens || 0) + (aiResult.completion_tokens || 0),
        });

        validityStatus =
          aiResult.clarity_status === 'PERLU_DILENGKAPI' ? 'PERLU_DILENGKAPI' : 'VALID';

        const insertedAnalysis = await sql`
          INSERT INTO sales_os.lead_ai_analyses (
            lead_id, owner_se_email, skor, label, clarity_status, unclear_parts, ringkas,
            poin_kuat, poin_lemah, perlu_dicek_ulang, rekomendasi, recommended_persona,
            recommended_bant, followup_draft_message, reply_mode, reply_reason, model, prompt_tokens, completion_tokens
          ) VALUES (
            ${leadId},
            ${prev.owner_se_email},
            ${aiResult.skor},
            ${aiResult.label},
            ${aiResult.clarity_status},
            ${sql.json(aiResult.unclear_parts as any)},
            ${aiResult.ringkas},
            ${sql.json(aiResult.poin_kuat as any)},
            ${sql.json(aiResult.poin_lemah as any)},
            ${sql.json(aiResult.perlu_dicek_ulang as any)},
            ${sql.json(aiResult.rekomendasi as any)},
            ${aiResult.recommended_persona},
            ${sql.json(aiResult.recommended_bant as any)},
            ${aiResult.followup_draft_message},
            ${aiResult.reply_mode || null},
            ${aiResult.reply_reason || null},
            ${aiResult.model},
            ${aiResult.prompt_tokens},
            ${aiResult.completion_tokens}
          )
          RETURNING *
        `;
        latestAnalysis = insertedAnalysis[0];
      }

      const nextLastSalesMessage = body.reanalyze
        ? ''
        : String(body.lastSalesMessage ?? prev.last_sales_message ?? '');

      const updatedRows = await sql`
        UPDATE sales_os.pipeline_leads
        SET full_name = ${nextFullName},
            domicile = ${nextDomicile},
            source = ${String(body.source ?? prev.source)},
            content_code = ${String(body.contentCode ?? prev.content_code)},
            stage = ${nextStage},
            validity_status = ${validityStatus},
            persona_code = ${nextPersona},
            persona_profile = ${sql.json(nextPersonaProfile)},
            bant_b = ${nextBant.b},
            bant_a = ${nextBant.a},
            bant_n = ${nextBant.n},
            bant_t = ${nextBant.t},
            bant_total = ${nextBant.total},
            grade = ${nextBant.grade},
            cluster_interest = ${nextCluster},
            unit_interest = ${nextUnitInterest},
            unit_price_idr = ${nextUnitPrice},
            payment_scheme = ${nextPaymentScheme},
            written_offer_sent = ${writtenOfferSent},
            booking_fee_paid = ${bookingFeePaid},
            dp_or_sp3k_verified = ${dpVerified},
            appointment_at = ${appointmentAt},
            visited_at = ${visitedAt},
            sales_notes = ${nextNotes},
            next_action = ${String(body.nextAction ?? prev.next_action)},
            last_sales_message = ${nextLastSalesMessage},
            lost_reason = ${nextLostReason || null},
            updated_at = NOW()
        WHERE id = ${leadId} AND tenant_id = ${user.tenantId}
        RETURNING *
      `;

      if (!latestAnalysis) {
        const lastRows = await sql`
          SELECT * FROM sales_os.lead_ai_analyses
          WHERE lead_id = ${leadId}
          ORDER BY created_at DESC
          LIMIT 1
        `;
        latestAnalysis = lastRows[0] || null;
      }

      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'UPDATE',
        targetEntity: 'LEAD',
        targetId: leadId,
        summary: `${user.name} (${user.role}) memperbarui data lead "${nextFullName}" (Tahap: ${nextStage}, BANT: ${nextBant.total}/12)`,
        details: { stage: nextStage, bantTotal: nextBant.total, lostReason: nextLostReason },
      });

      // Otomasi Kantong B Kreator saat lead beratribusi creator_code naik tahap (idempoten per lead + entry_type)
      const leadCreatorCode = String(updatedRows[0]?.creator_code || prev.creator_code || '').trim().toUpperCase();
      if (stageChanged && leadCreatorCode) {
        const pocketBMap: Record<string, { entryType: string; grossIdr: number; label: string }> = {
          QUALIFIED: { entryType: 'QL_BONUS', grossIdr: 50000, label: 'Bonus Lead Terkualifikasi (QL)' },
          VISITED: { entryType: 'VISIT_BONUS', grossIdr: 150000, label: 'Bonus Kunjungan Lokasi (Visit)' },
          PPJB_AKAD: { entryType: 'SOURCE_FEE', grossIdr: 1500000, label: 'Fee Sumber Penjualan (Akad)' },
        };
        const rule = pocketBMap[nextStage];
        if (rule) {
          try {
            const dup = await sql`
              SELECT id FROM sales_os.creator_ledger_entries
              WHERE tenant_id = ${user.tenantId} AND reference_id = ${leadId} AND entry_type = ${rule.entryType}
              LIMIT 1
            `;
            if (dup.length === 0) {
              const { taxIdr, netIdr } = calculatePph21Estimate(rule.grossIdr);
              await sql`
                INSERT INTO sales_os.creator_ledger_entries (
                  tenant_id, project_id, creator_code, pocket, entry_type,
                  reference_id, description, gross_amount_idr, tax_pph_idr, net_amount_idr, status
                ) VALUES (
                  ${user.tenantId}, ${String(prev.project_id || 'the-park-sukoharjo')}, ${leadCreatorCode}, 'B', ${rule.entryType},
                  ${leadId}, ${`${rule.label} · ${leadCreatorCode}`},
                  ${rule.grossIdr}, ${taxIdr}, ${netIdr}, ${nextStage === 'PPJB_AKAD' ? 'ACCRUED' : 'PENDING'}
                )
              `;
            }
          } catch (err) {
            console.warn('[Creator Kantong B] skip insert:', err);
          }
        }
      }

      sendJson(res, 200, {
        ok: true,
        lead: { ...updatedRows[0], latest_analysis: latestAnalysis },
      });
      return;
    }

    // 7. DELETE LEAD
    if (patchMatch && req.method === 'DELETE') {
      const leadId = patchMatch[1];
      const isManagerOrAdmin = ['TL', 'SM', 'ADMIN', 'DIREKSI', 'IT'].includes(user.role);
      const deletedRows = isManagerOrAdmin
        ? await sql`DELETE FROM sales_os.pipeline_leads WHERE id = ${leadId} AND tenant_id = ${user.tenantId} RETURNING *`
        : await sql`DELETE FROM sales_os.pipeline_leads WHERE id = ${leadId} AND owner_se_email = ${user.email} AND tenant_id = ${user.tenantId} RETURNING *`;

      if (deletedRows.length > 0) {
        await recordAuditLog({
          tenantId: user.tenantId,
          actorEmail: user.email,
          actorName: user.name,
          actorRole: user.role,
          action: 'DELETE',
          targetEntity: 'LEAD',
          targetId: leadId,
          summary: `${user.name} (${user.role}) menghapus data lead "${deletedRows[0].full_name}" (${deletedRows[0].phone_wa})`,
          details: deletedRows[0],
        });
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    // 8. WHATSAPP BAILEYS ENDPOINTS (Terisolasi ketat per akun SE yang login)
    if (pathname === '/api/wa/status' && req.method === 'GET') {
      const status = await getWaStatusForSe(user.email, user.name);
      sendJson(res, 200, { ok: true, data: status });
      return;
    }

    if (pathname === '/api/wa/connect' && req.method === 'POST') {
      const body = await readJsonBody(req).catch(() => ({}));
      const conn = await startBaileysForSe(user.email, user.name, Boolean(body.forceFresh));
      const status = await getWaStatusForSe(user.email, user.name);
      sendJson(res, 200, { ok: true, connection: conn, data: status });
      return;
    }

    if (pathname === '/api/wa/disconnect' && req.method === 'POST') {
      await disconnectBaileysForSe(user.email);
      const status = await getWaStatusForSe(user.email, user.name);
      sendJson(res, 200, { ok: true, data: status });
      return;
    }

    // Webhook / Ingest Pesan Masuk ke Nomor WA SE (untuk integrasi Baileys & pengujian pesan masuk)
    if (pathname === '/api/wa/ingest-inbound' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const messages = Array.isArray(body.messages)
        ? body.messages
        : [
            {
              contactPhone: body.contactPhone,
              contactName: body.contactName,
              messageText: body.messageText,
            },
          ];

      const results = [];
      for (const item of messages) {
        if (!item?.contactPhone || !item?.messageText) continue;
        const r = await processInboundWaMessageForSe({
          seEmail: user.email,
          seName: user.name,
          contactPhone: String(item.contactPhone),
          contactName: String(item.contactName || ''),
          messageText: String(item.messageText),
        });
        results.push(r);
      }

      const status = await getWaStatusForSe(user.email, user.name);
      sendJson(res, 200, { ok: true, processedCount: results.length, results, waStatus: status });
      return;
    }

    // Kirim Pesan Follow-Up Otomatis Langsung melalui Nomor WA SE yang Terhubung (Baileys)
    if (pathname === '/api/wa/send-message' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const sendRes = await sendOutboundWaMessageForSe({
        seEmail: user.email,
        seName: user.name,
        contactPhone: String(body.contactPhone || ''),
        messageText: String(body.messageText || ''),
      });
      if (!sendRes.sent) {
        const statusCode = sendRes.code === 'WA_NOT_CONNECTED' ? 409 : 400;
        sendJson(res, statusCode, { ok: false, ...sendRes });
        return;
      }
      sendJson(res, 200, { ok: true, ...sendRes });
      return;
    }

    // Catat Follow-Up / Balasan SE (ketika tombol Follow Up via WA ditekan)
    if (pathname === '/api/wa/record-reply' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const replyRes = await recordOutboundWaReplyForSe({
        seEmail: user.email,
        contactPhone: String(body.contactPhone || ''),
        messageText: String(body.messageText || ''),
      });
      sendJson(res, 200, { ok: true, ...replyRes });
      return;
    }

    // 9. FIELD OPS (ABSEN, GPS + FOTO, LOG PANGGILAN) -> REAL POSTGRESQL sales_os
    // Endpoint ringan in-memory untuk Live Location SE (ala WA Live Location, tanpa mengotori counter canvassing)
    if (pathname === '/api/se/live-location' && req.method === 'GET') {
      const locations = Array.from(liveSeLocationsMap.values());
      sendJson(res, 200, { ok: true, locations });
      return;
    }

    if (pathname === '/api/se/live-location' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        sendJson(res, 400, { ok: false, error: 'Koordinat lat/lng tidak valid.' });
        return;
      }
      const entry = {
        seEmail: user.email.toLowerCase(),
        seName: user.name,
        role: user.role,
        lat,
        lng,
        accuracy: body.accuracy !== undefined ? Number(body.accuracy) : undefined,
        locationLabel: String(body.locationLabel || ''),
        updatedAt: new Date().toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        timestamp: Date.now(),
      };
      liveSeLocationsMap.set(entry.seEmail, entry);
      sendJson(res, 200, { ok: true, location: entry });
      return;
    }

    if (pathname === '/api/se/field-logs' && req.method === 'GET') {
      const isManagerRole = user.role !== 'SE';
      const filterEmail = String(parsedUrl.searchParams.get('seEmail') || '').trim().toLowerCase();
      const rows = isManagerRole
        ? filterEmail
          ? await sql`
              SELECT * FROM sales_os.se_field_logs
              WHERE se_email = ${filterEmail}
              ORDER BY created_at DESC
              LIMIT 400
            `
          : await sql`
              SELECT * FROM sales_os.se_field_logs
              ORDER BY created_at DESC
              LIMIT 400
            `
        : await sql`
            SELECT * FROM sales_os.se_field_logs
            WHERE se_email = ${user.email}
            ORDER BY created_at DESC
            LIMIT 100
          `;
      sendJson(res, 200, { ok: true, logs: rows });
      return;
    }

    if (pathname === '/api/se/field-logs' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const logType = String(body.logType || 'GPS').toUpperCase();
      const payload = (body.payload || {}) as Record<string, any>;
      const todayStr = toWibDateStr(new Date());

      const inserted = await sql`
        INSERT INTO sales_os.se_field_logs (
          se_email, se_name, log_type, title, location_label,
          lat, lng, photo_data_url, duration_seconds, outcome, notes, payload
        ) VALUES (
          ${user.email},
          ${user.name},
          ${logType},
          ${String(body.title || logType)},
          ${String(body.locationLabel || '')},
          ${body.lat !== undefined ? Number(body.lat) : null},
          ${body.lng !== undefined ? Number(body.lng) : null},
          ${body.photoDataUrl ? String(body.photoDataUrl) : null},
          ${body.durationSeconds !== undefined ? Number(body.durationSeconds) : null},
          ${body.outcome ? String(body.outcome) : null},
          ${String(body.notes || '')},
          ${sql.json(payload)}
        )
        RETURNING *
      `;

      // Sinkronkan otomatis ke counter Laporan Harian SE (Item 2 Telepon / Item 4 Canvassing)
      if (logType === 'CALL' || logType === 'GPS') {
        const existing = await sql`
          SELECT * FROM sales_os.se_daily_notes
          WHERE se_email = ${user.email} AND report_date = ${todayStr}::date
          LIMIT 1
        `;
        const prev = existing[0] || {};
        const isConnectedCall =
          logType === 'CALL' &&
          !['TIDAK_ANGKAT', 'NOMOR_TIDAK_AKTIF'].includes(String(body.outcome || ''));

        const nextDial = Number(prev.dial_count || 0) + (logType === 'CALL' ? 1 : 0);
        const nextConnected =
          Number(prev.connected_call_count || 0) + (isConnectedCall ? 1 : 0);
        const nextCanvassing =
          Number(prev.canvassing_contacts || 0) + (logType === 'GPS' ? 1 : 0);

        await sql`
          INSERT INTO sales_os.se_daily_notes (
            se_email, report_date, dial_count, connected_call_count,
            canvassing_contacts, updated_at
          ) VALUES (
            ${user.email},
            ${todayStr}::date,
            ${nextDial},
            ${nextConnected},
            ${nextCanvassing},
            NOW()
          )
          ON CONFLICT (se_email, report_date) DO UPDATE SET
            dial_count = EXCLUDED.dial_count,
            connected_call_count = EXCLUDED.connected_call_count,
            canvassing_contacts = EXCLUDED.canvassing_contacts,
            updated_at = NOW()
        `;
      }

      sendJson(res, 201, { ok: true, log: inserted[0] });
      return;
    }

    // 10. RUTE HARIAN CANVASSING KUSTOM SE -> REAL POSTGRESQL sales_os
    if (pathname === '/api/se/routes' && req.method === 'GET') {
      const dayName = parsedUrl.searchParams.get('day') || 'Senin';
      const rows = await sql`
        SELECT waypoints, updated_at FROM sales_os.se_custom_routes
        WHERE se_email = ${user.email} AND day_name = ${dayName}
        LIMIT 1
      `;
      sendJson(res, 200, {
        ok: true,
        dayName,
        waypoints: rows[0]?.waypoints ?? null,
      });
      return;
    }

    if (pathname === '/api/se/routes' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const dayName = String(body.dayName || 'Senin');
      const waypoints = Array.isArray(body.waypoints) ? body.waypoints : [];
      await sql`
        INSERT INTO sales_os.se_custom_routes (se_email, day_name, waypoints, updated_at)
        VALUES (${user.email}, ${dayName}, ${sql.json(waypoints)}, NOW())
        ON CONFLICT (se_email, day_name) DO UPDATE SET
          waypoints = EXCLUDED.waypoints,
          updated_at = NOW()
      `;
      sendJson(res, 200, { ok: true, dayName, waypoints });
      return;
    }

    // 11. KALENDER KONTEN POSTING SYNC -> REAL POSTGRESQL sales_os
    if (pathname === '/api/se/content-posting' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const platform = String(body.platform || '').toLowerCase();
      const todayStr = toWibDateStr(new Date());

      const existing = await sql`
        SELECT * FROM sales_os.se_daily_notes
        WHERE se_email = ${user.email} AND report_date = ${todayStr}::date
        LIMIT 1
      `;
      const prev = existing[0] || {};
      const addReel = platform.includes('tiktok') || platform.includes('reels') ? 1 : 0;
      const addWa = platform.includes('whatsapp') || platform.includes('wa') ? 1 : 0;
      const addStory = !addReel && !addWa ? 1 : 0;

      await sql`
        INSERT INTO sales_os.se_daily_notes (
          se_email, report_date, posted_reels, posted_wa_status, posted_stories, updated_at
        ) VALUES (
          ${user.email},
          ${todayStr}::date,
          ${Number(prev.posted_reels || 0) + addReel},
          ${Number(prev.posted_wa_status || 0) + addWa},
          ${Number(prev.posted_stories || 0) + addStory},
          NOW()
        )
        ON CONFLICT (se_email, report_date) DO UPDATE SET
          posted_reels = EXCLUDED.posted_reels,
          posted_wa_status = EXCLUDED.posted_wa_status,
          posted_stories = EXCLUDED.posted_stories,
          updated_at = NOW()
      `;

      sendJson(res, 200, { ok: true });
      return;
    }

    // 12. KALENDER KONTEN UNIK PER SE + HERMES MEDIA WORKER -> REAL POSTGRESQL sales_os
    if (pathname.startsWith('/api/se/media/') && req.method === 'GET') {
      const fileName = path.basename(pathname.replace('/api/se/media/', ''));
      const filePath = path.join(MEDIA_OUTPUT_DIR, fileName);
      if (!fsSync.existsSync(filePath)) {
        sendJson(res, 404, { ok: false, error: 'File media tidak ditemukan.' });
        return;
      }
      const stat = await fs.stat(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const contentType =
        ext === '.mp4' ? 'video/mp4' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
      const range = req.headers.range;
      if (range && ext === '.mp4') {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        });
        fsSync.createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        });
        fsSync.createReadStream(filePath).pipe(res);
      }
      return;
    }

    if (pathname === '/api/se/content-slots' && req.method === 'GET') {
      const rows = await sql`
        SELECT slot_id, status, posted_url, day_number, slot_order, scheduled_time,
               funnel_stage, platform, format, title, brief, visual_prompt, caption,
               hashtags, cta, duration_seconds, persona_code, slide_deck,
               media_status, media_urls, media_error,
               target_media_count, hermes_job_ids, generated_at, updated_at
        FROM sales_os.se_content_slots
        WHERE se_email = ${user.email}
      `;
      sendJson(res, 200, { ok: true, slots: rows });
      return;
    }

    if (pathname === '/api/se/content-slots/generate-week' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const weekNumber = Math.max(1, Math.min(5, Number(body.weekNumber || 1)));
      const savedCount = await generateWeekSlotsForSe(user.email, user.name, weekNumber);
      const rows = await sql`
        SELECT slot_id, status, posted_url, day_number, slot_order, scheduled_time,
               funnel_stage, platform, format, title, brief, visual_prompt, caption,
               hashtags, cta, duration_seconds, persona_code, slide_deck,
               media_status, media_urls, media_error,
               target_media_count, hermes_job_ids, generated_at, updated_at
        FROM sales_os.se_content_slots
        WHERE se_email = ${user.email}
        ORDER BY day_number ASC, slot_order ASC
      `;
      sendJson(res, 200, { ok: true, weekNumber, savedCount, slots: rows });
      return;
    }

    if (pathname === '/api/se/content-slots/status' && req.method === 'GET') {
      const slotId = parsedUrl.searchParams.get('slotId') || '';
      const { minutesOfDay } = getWibClock();
      const busyWindow = await getManualLock(minutesOfDay);
      const [rows, hermesHealth, queueCountRows, queueInfo] = await Promise.all([
        slotId
          ? sql`
              SELECT slot_id, status, posted_url, day_number, slot_order, scheduled_time,
                     funnel_stage, platform, format, title, brief, visual_prompt, caption,
                     hashtags, cta, duration_seconds, persona_code, slide_deck,
                     media_status, media_urls, media_error,
                     target_media_count, hermes_job_ids, generated_at, updated_at
              FROM sales_os.se_content_slots
              WHERE se_email = ${user.email} AND slot_id = ${slotId}
              LIMIT 1
            `
          : Promise.resolve([]),
        getHermesHealth(),
        sql`
          SELECT COUNT(*)::int AS cnt
          FROM sales_os.media_render_queue
          WHERE status IN ('PENDING', 'PROCESSING')
        `.catch(() => [{ cnt: 0 }]),
        getQueuePositionInfo(user.email, slotId),
      ]);

      // Jika sudah auto-publish via Zernio tapi posted_url masih kosong/link profil, sinkronkan permalink spesifik
      const slotRow = rows[0] || null;
      if (slotRow && slotRow.status === 'SUDAH_POSTING') {
        const curUrl = String(slotRow.posted_url || '').trim();
        let needsPostUrlSync = !curUrl;
        if (curUrl) {
          try {
            const parsed = new URL(curUrl);
            needsPostUrlSync = parsed.pathname.split('/').filter(Boolean).length <= 1 && !parsed.search;
          } catch {
            needsPostUrlSync = true;
          }
        }
        if (needsPostUrlSync) {
          const logRows = await sql`
            SELECT payload FROM sales_os.se_field_logs
            WHERE se_email = ${user.email}
              AND log_type = 'CONTENT_POSTING'
              AND payload->>'slotId' = ${slotId}
              AND payload->>'postId' IS NOT NULL
            ORDER BY id DESC
            LIMIT 1
          `.catch(() => []);
          const p = logRows[0]?.payload as any;
          if (p?.postId && p?.platform) {
            const resolvedUrl = await fetchZernioPostUrl(
              Number(p.keyIndex || 0),
              String(p.postId),
              mapCalendarPlatformToZernio(String(p.platform))
            );
            if (resolvedUrl) {
              slotRow.posted_url = resolvedUrl;
              await sql`
                UPDATE sales_os.se_content_slots
                SET posted_url = ${resolvedUrl}, updated_at = NOW()
                WHERE se_email = ${user.email} AND slot_id = ${slotId}
              `.catch(() => {});
            }
          }
        }
      }

      sendJson(res, 200, {
        ok: true,
        slot: slotRow,
        hermesHealth,
        busyWindow,
        globalQueuePending: Number(queueCountRows[0]?.cnt || 0),
        queueInfo,
      });
      return;
    }

    if (pathname === '/api/se/content-slots/init-day' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { minutesOfDay, dayOfMonth, daysInMonth } = getWibClock();
      const dayNumber = Math.max(1, Math.min(daysInMonth, Number(body.dayNumber || dayOfMonth)));
      const targetDateStr = formatWibDateForDay(dayNumber);

      const existing = await sql`
        SELECT * FROM sales_os.se_content_slots
        WHERE se_email = ${user.email} AND day_number = ${dayNumber}
        ORDER BY slot_order ASC
      `;

      if (existing.length >= 3 && existing[0]?.visual_prompt) {
        sendJson(res, 200, { ok: true, slots: existing, source: 'cache' });
        return;
      }

      const aiSlots = await generateUniqueDaySlotsWithAi(user.email, user.name, dayNumber);
      for (const s of aiSlots) {
        const slotId = `slot-d${dayNumber}-s${s.slotOrder}-sales_in_house`;
        await sql`
          INSERT INTO sales_os.se_content_slots (
            se_email, slot_id, status, posted_url, day_number, slot_order,
            scheduled_time, funnel_stage, platform, format, title, brief,
            visual_prompt, caption, hashtags, cta, duration_seconds,
            persona_code, slide_deck, media_status, report_date, updated_at
          ) VALUES (
            ${user.email}, ${slotId}, 'SIAP', '', ${dayNumber}, ${s.slotOrder},
            ${s.scheduledTime}, ${s.funnelStage}, ${s.platform}, ${s.format},
            ${s.title}, ${s.brief}, ${s.visualPrompt}, ${s.caption},
            ${sql.json(s.hashtags)}, ${s.cta}, ${s.durationSeconds},
            ${s.personaCode || 'P1'}, ${sql.json(s.slideDeck || [])}, 'SCHEDULED', ${targetDateStr}::date, NOW()
          )
          ON CONFLICT (se_email, slot_id) DO UPDATE SET
            day_number = EXCLUDED.day_number,
            slot_order = EXCLUDED.slot_order,
            scheduled_time = EXCLUDED.scheduled_time,
            funnel_stage = EXCLUDED.funnel_stage,
            platform = EXCLUDED.platform,
            format = EXCLUDED.format,
            title = EXCLUDED.title,
            brief = EXCLUDED.brief,
            visual_prompt = EXCLUDED.visual_prompt,
            caption = EXCLUDED.caption,
            hashtags = EXCLUDED.hashtags,
            cta = EXCLUDED.cta,
            duration_seconds = EXCLUDED.duration_seconds,
            persona_code = EXCLUDED.persona_code,
            slide_deck = EXCLUDED.slide_deck,
            report_date = EXCLUDED.report_date,
            updated_at = NOW()
        `;
      }

      // Trigger hanya slot yang jamnya sudah jatuh tempo hari ini (jika dayNumber === dayOfMonth / tanggal hari ini)
      const savedRows = await sql`
        SELECT * FROM sales_os.se_content_slots
        WHERE se_email = ${user.email} AND day_number = ${dayNumber}
        ORDER BY slot_order ASC
      `;

      // Non-blocking: jika ada 1 slot yang due sekarang di tanggal aktif hari ini, enqueue ke Hermes tanpa memblokir UI
      const dueSlot = savedRows.find(
        (r) => r.media_status === 'SCHEDULED' && isSlotDueNowWib(Number(r.slot_order), minutesOfDay)
      );
      if (dueSlot && dayNumber === dayOfMonth) {
        void (async () => {
          try {
            const enq = await enqueueSlotMediaViaHermes({
              seEmail: user.email,
              slotId: String(dueSlot.slot_id),
              format: String(dueSlot.format),
              funnelStage: String(dueSlot.funnel_stage || 'TOFU'),
              title: String(dueSlot.title),
              brief: String(dueSlot.brief),
              visualPrompt: String(dueSlot.visual_prompt),
              durationSeconds: Number(dueSlot.duration_seconds || 15),
              slideDeck: Array.isArray(dueSlot.slide_deck) ? dueSlot.slide_deck : undefined,
            });
            await sql`
              UPDATE sales_os.se_content_slots
              SET media_status = ${enq.ok ? 'GENERATING' : 'FAILED'},
                  target_media_count = ${enq.targetCount},
                  hermes_job_ids = ${sql.json(enq.jobs)},
                  media_error = ${enq.error || null},
                  updated_at = NOW()
              WHERE se_email = ${user.email} AND slot_id = ${dueSlot.slot_id}
            `;
          } catch {
            /* ignore */
          }
        })();
      }

      sendJson(res, 200, { ok: true, slots: savedRows, source: 'ai' });
      return;
    }

    if (pathname === '/api/se/content-slots/generate-media' && req.method === 'POST') {
      if (!SE_EMAILS.includes(user.email)) {
        sendJson(res, 403, { ok: false, error: 'Generate konten hanya untuk akun Sales Executive.' });
        return;
      }
      const { minutesOfDay } = getWibClock();
      const busyWindow = await getManualLock(minutesOfDay);
      if (busyWindow.busy) {
        sendJson(res, 423, {
          ok: false,
          busyWindow,
          error: busyWindow.reason,
        });
        return;
      }

      const body = await readJsonBody(req);
      const slotId = String(body.slotId || '');
      if (!slotId) {
        sendJson(res, 400, { ok: false, error: 'slotId wajib diisi.' });
        return;
      }

      // Guard 1: 1 SE hanya boleh menjalankan 1 kalender konten dalam satu waktu (fokus selesai dulu)
      const queueBefore = await getQueuePositionInfo(user.email, slotId);
      if (queueBefore.activeOtherSlotForUser) {
        const active = queueBefore.activeOtherSlotForUser;
        sendJson(res, 409, {
          ok: false,
          code: 'USER_ALREADY_GENERATING',
          activeSlot: active,
          queueInfo: queueBefore,
          error: `Anda masih memiliki proses generate yang sedang berjalan pada "${active.title}"${active.scheduledTime ? ` (${active.scheduledTime})` : ''}. Fokus selesaikan generate tersebut terlebih dahulu sebelum memulai kalender konten lain.`,
        });
        return;
      }

      // Guard 2: Cegah klik ganda / interupsi pada slot yang sama saat masih antri/berjalan
      const sameSlotActive = await sql`
        SELECT COUNT(*)::int AS cnt
        FROM sales_os.media_render_queue
        WHERE se_email = ${user.email} AND slot_id = ${slotId} AND status IN ('PENDING', 'PROCESSING')
      `;
      if (Number(sameSlotActive[0]?.cnt || 0) > 0) {
        sendJson(res, 409, {
          ok: false,
          code: 'SLOT_ALREADY_IN_QUEUE',
          queueInfo: queueBefore,
          error: 'Proses generate untuk slot ini sedang berjalan / dalam antrean FIFO. Mohon tunggu hingga selesai.',
        });
        return;
      }

      const existing = await sql`
        SELECT * FROM sales_os.se_content_slots
        WHERE se_email = ${user.email} AND slot_id = ${slotId}
        LIMIT 1
      `;
      const row = existing[0];
      const format = String(body.format || row?.format || 'Carousel Edukasi');
      const title = String(body.title || row?.title || 'Konten The Park Townhouse');
      const brief = String(body.brief || row?.brief || '');
      const visualPrompt = String(body.visualPrompt || row?.visual_prompt || brief);
      const durationSeconds = Number(body.durationSeconds ?? row?.duration_seconds ?? 15);

      const enq = await enqueueSlotMediaViaHermes({
        seEmail: user.email,
        slotId,
        format,
        funnelStage: String(body.funnelStage || row?.funnel_stage || 'TOFU'),
        title,
        brief,
        visualPrompt,
        durationSeconds,
        slideDeck: Array.isArray(body.slideDeck)
          ? body.slideDeck
          : Array.isArray(row?.slide_deck)
          ? row.slide_deck
          : undefined,
      });

      const queueAfter = await getQueuePositionInfo(user.email, slotId);

      const updated = await sql`
        INSERT INTO sales_os.se_content_slots (
          se_email, slot_id, format, title, brief, visual_prompt, duration_seconds,
          media_status, target_media_count, hermes_job_ids, media_urls, media_error, updated_at
        ) VALUES (
          ${user.email}, ${slotId}, ${format}, ${title}, ${brief}, ${visualPrompt}, ${durationSeconds},
          ${enq.ok ? 'GENERATING' : 'FAILED'}, ${enq.targetCount}, ${sql.json(enq.jobs)}, '[]'::jsonb, ${enq.error || null}, NOW()
        )
        ON CONFLICT (se_email, slot_id) DO UPDATE SET
          format = EXCLUDED.format,
          title = EXCLUDED.title,
          brief = EXCLUDED.brief,
          visual_prompt = EXCLUDED.visual_prompt,
          duration_seconds = EXCLUDED.duration_seconds,
          media_status = EXCLUDED.media_status,
          target_media_count = EXCLUDED.target_media_count,
          hermes_job_ids = EXCLUDED.hermes_job_ids,
          media_urls = '[]'::jsonb,
          media_error = EXCLUDED.media_error,
          updated_at = NOW()
        RETURNING *
      `;

      sendJson(res, enq.ok ? 200 : 500, {
        ok: enq.ok,
        slot: updated[0],
        queueInfo: queueAfter,
        queuedBehindOthers: queueAfter.itemsAhead > 0,
        error: enq.error,
      });
      return;
    }

    if (pathname === '/api/se/content-slots/regenerate-brief' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const slotId = String(body.slotId || '');
      if (!slotId) {
        sendJson(res, 400, { ok: false, error: 'slotId wajib diisi.' });
        return;
      }
      const existing = await sql`
        SELECT day_number, slot_order FROM sales_os.se_content_slots
        WHERE se_email = ${user.email} AND slot_id = ${slotId}
        LIMIT 1
      `;
      const dayNum = Number(existing[0]?.day_number || 1);
      const slotOrder = Number(existing[0]?.slot_order || 1);
      const aiSlots = await generateUniqueDaySlotsWithAi(user.email, user.name, dayNum);
      const picked = aiSlots.find((s) => s.slotOrder === slotOrder) || aiSlots[0];
      const updated = await sql`
        UPDATE sales_os.se_content_slots
        SET title = ${picked.title},
            brief = ${picked.brief},
            visual_prompt = ${picked.visualPrompt},
            caption = ${picked.caption},
            hashtags = ${sql.json(picked.hashtags)},
            cta = ${picked.cta},
            slide_deck = ${sql.json(picked.slideDeck || [])},
            updated_at = NOW()
        WHERE se_email = ${user.email} AND slot_id = ${slotId}
        RETURNING *
      `;
      sendJson(res, 200, { ok: true, slot: updated[0], generated: picked });
      return;
    }

    if (pathname === '/api/se/content-slots' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const slotId = String(body.slotId || '');
      const status = String(body.status || 'SUDAH_POSTING');
      const postedUrl = String(body.postedUrl || '');
      if (!slotId) {
        sendJson(res, 400, { ok: false, error: 'slotId wajib diisi.' });
        return;
      }
      await sql`
        INSERT INTO sales_os.se_content_slots (se_email, slot_id, status, posted_url, updated_at)
        VALUES (${user.email}, ${slotId}, ${status}, ${postedUrl}, NOW())
        ON CONFLICT (se_email, slot_id) DO UPDATE SET
          status = EXCLUDED.status,
          posted_url = EXCLUDED.posted_url,
          updated_at = NOW()
      `;
      sendJson(res, 200, { ok: true, slotId, status, postedUrl });
      return;
    }

    // =========================================================================
    // ZERNIO SOCIAL MEDIA INTEGRATION (4 Akun / SE via 2 API Key Pool)
    // =========================================================================
    if (pathname === '/api/se/social/accounts' && req.method === 'GET') {
      const keys = getZernioKeys();
      const rows = await sql`
        SELECT platform, zernio_key_index, zernio_profile_id, zernio_account_id, account_username, status, connected_at
        FROM sales_os.se_social_accounts
        WHERE se_email = ${user.email} AND status = 'CONNECTED'
        ORDER BY connected_at ASC
      `;
      sendJson(res, 200, {
        ok: true,
        accounts: rows,
        maxAccounts: keys.length * ACCOUNTS_PER_KEY_LIMIT,
        configuredKeysCount: keys.length,
        platforms: ZERNIO_PLATFORMS,
      });
      return;
    }

    if (pathname === '/api/se/social/connect' && req.method === 'GET') {
      const platformParam = String(parsedUrl.searchParams.get('platform') || '').toLowerCase() as ZernioPlatform;
      if (
        !['instagram', 'tiktok', 'facebook', 'youtube', 'twitter', 'threads', 'linkedin', 'pinterest'].includes(
          platformParam
        )
      ) {
        sendJson(res, 400, { ok: false, error: 'Platform social media tidak valid.' });
        return;
      }
      const keys = getZernioKeys();
      if (keys.length === 0) {
        sendJson(res, 500, { ok: false, error: 'ZERNIO_API_KEY belum dikonfigurasi di server.' });
        return;
      }

      const existingRows = await sql`
        SELECT platform, zernio_key_index, zernio_profile_id
        FROM sales_os.se_social_accounts
        WHERE se_email = ${user.email} AND status = 'CONNECTED'
      `;
      const existingSamePlatform = existingRows.find((r: any) => r.platform === platformParam);

      let chosenKeyIndex = 0;
      if (existingSamePlatform) {
        chosenKeyIndex = Number(existingSamePlatform.zernio_key_index || 0);
      } else {
        if (existingRows.length >= keys.length * ACCOUNTS_PER_KEY_LIMIT) {
          sendJson(res, 400, {
            ok: false,
            error: `Batas maksimal ${keys.length * ACCOUNTS_PER_KEY_LIMIT} akun sosmed terhubung sudah tercapai. Putuskan salah satu akun terlebih dahulu.`,
          });
          return;
        }
        // Pilih API key yang slotnya (< 2 akun) masih tersedia
        let foundIndex = -1;
        for (let i = 0; i < keys.length; i++) {
          const usedOnKey = existingRows.filter((r: any) => Number(r.zernio_key_index) === i).length;
          if (usedOnKey < ACCOUNTS_PER_KEY_LIMIT) {
            foundIndex = i;
            break;
          }
        }
        if (foundIndex === -1) {
          sendJson(res, 400, { ok: false, error: 'Semua slot API Key Zernio penuh.' });
          return;
        }
        chosenKeyIndex = foundIndex;
      }

      const profileId =
        existingSamePlatform?.zernio_profile_id ||
        (await getOrCreateZernioProfile(chosenKeyIndex, user.email, user.name));

      const hostHeader = String(req.headers.host || 'localhost:3040');
      const proto = String(req.headers['x-forwarded-proto'] || (hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1') ? 'http' : 'https'));
      const originBase = (process.env.PUBLIC_APP_URL && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1'))
        ? process.env.PUBLIC_APP_URL.replace(/\/+$/, '')
        : `${proto}://${hostHeader}`;

      const callbackUrl = new URL(`${originBase}/api/se/social/callback`);
      callbackUrl.searchParams.set('seEmail', user.email);
      callbackUrl.searchParams.set('platform', platformParam);
      callbackUrl.searchParams.set('keyIndex', String(chosenKeyIndex));
      callbackUrl.searchParams.set('profileId', profileId);

      const authUrl = await getZernioConnectUrl({
        keyIndex: chosenKeyIndex,
        profileId,
        platform: platformParam,
        redirectUrl: callbackUrl.toString(),
      });

      sendJson(res, 200, { ok: true, authUrl, platform: platformParam, keyIndex: chosenKeyIndex });
      return;
    }

    if (pathname === '/api/se/social/callback' && req.method === 'GET') {
      const seEmail = String(parsedUrl.searchParams.get('seEmail') || '').trim().toLowerCase();
      const platformParam = String(parsedUrl.searchParams.get('platform') || '').toLowerCase();
      const keyIndex = Number(parsedUrl.searchParams.get('keyIndex') || 0);
      const profileId = String(parsedUrl.searchParams.get('profileId') || '');
      let accountId = String(
        parsedUrl.searchParams.get('accountId') ||
          parsedUrl.searchParams.get('account_id') ||
          parsedUrl.searchParams.get('id') ||
          ''
      );
      let username = String(
        parsedUrl.searchParams.get('username') ||
          parsedUrl.searchParams.get('account_username') ||
          parsedUrl.searchParams.get('name') ||
          ''
      );

      if ((!accountId || !username) && profileId) {
        const remoteAccounts = await fetchZernioAccountsForProfile(keyIndex, profileId);
        const match =
          remoteAccounts.find((a) => String(a.platform).toLowerCase() === platformParam) ||
          remoteAccounts[remoteAccounts.length - 1];
        if (match) {
          if (!accountId) accountId = String(match._id);
          if (!username) username = String(match.username || match.displayName || platformParam);
        }
      }

      if (seEmail && platformParam && accountId) {
        await sql`
          INSERT INTO sales_os.se_social_accounts (
            se_email, platform, zernio_key_index, zernio_profile_id, zernio_account_id,
            account_username, status, connected_at, updated_at
          ) VALUES (
            ${seEmail}, ${platformParam}, ${keyIndex}, ${profileId}, ${accountId},
            ${username || platformParam}, 'CONNECTED', NOW(), NOW()
          )
          ON CONFLICT (se_email, platform) DO UPDATE SET
            zernio_key_index = EXCLUDED.zernio_key_index,
            zernio_profile_id = EXCLUDED.zernio_profile_id,
            zernio_account_id = EXCLUDED.zernio_account_id,
            account_username = EXCLUDED.account_username,
            status = 'CONNECTED',
            updated_at = NOW()
        `;
      }

      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>Akun Sosmed Terhubung</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#FBF9F5;color:#2C1E16;">
  <div style="background:#fff;border:1px solid #E8DFD1;border-radius:20px;padding:28px;max-width:420px;text-align:center;">
    <h2 style="margin:0 0 8px;">${accountId ? 'Akun Berhasil Terhubung!' : 'Koneksi Diproses'}</h2>
    <p style="font-size:14px;color:#6E5D52;margin:0 0 18px;">
      Platform <strong>${platformParam.toUpperCase()}</strong> ${username ? `(@${username})` : ''} siap dipakai untuk posting 1-klik.
    </p>
    <button onclick="window.close(); window.location.href='/kalender';" style="background:#C2593F;color:#fff;border:none;border-radius:12px;padding:10px 18px;font-weight:700;cursor:pointer;">
      Kembali ke Kalender Konten
    </button>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'ZERNIO_CONNECTED', platform: ${JSON.stringify(platformParam)}, username: ${JSON.stringify(username)} }, '*');
        setTimeout(() => window.close(), 900);
      } else {
        setTimeout(() => { window.location.href = '/kalender?social_connected=${encodeURIComponent(platformParam)}'; }, 1200);
      }
    } catch (e) {}
  </script>
</body></html>`);
      return;
    }

    if (pathname === '/api/se/social/accounts' && req.method === 'DELETE') {
      const platformParam = String(parsedUrl.searchParams.get('platform') || '').toLowerCase();
      if (!platformParam) {
        sendJson(res, 400, { ok: false, error: 'Parameter platform wajib diisi.' });
        return;
      }
      await sql`
        DELETE FROM sales_os.se_social_accounts
        WHERE se_email = ${user.email} AND platform = ${platformParam}
      `;
      sendJson(res, 200, { ok: true, platform: platformParam });
      return;
    }

    if (pathname === '/api/se/content-slots/publish' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const slotId = String(body.slotId || '');
      if (!slotId) {
        sendJson(res, 400, { ok: false, error: 'slotId wajib diisi.' });
        return;
      }

      const slotRows = await sql`
        SELECT * FROM sales_os.se_content_slots
        WHERE se_email = ${user.email} AND slot_id = ${slotId}
        LIMIT 1
      `;
      const row = slotRows[0];
      if (!row) {
        sendJson(res, 404, { ok: false, error: 'Slot konten tidak ditemukan di database.' });
        return;
      }

      const mediaUrls: string[] = Array.isArray(row.media_urls) ? row.media_urls : [];
      if (mediaUrls.length === 0) {
        sendJson(res, 400, { ok: false, error: 'Media konten belum siap. Generate media terlebih dahulu.' });
        return;
      }

      const targetPlatform = mapCalendarPlatformToZernio(String(body.platform || row.platform || 'Instagram'));
      const accRows = await sql`
        SELECT * FROM sales_os.se_social_accounts
        WHERE se_email = ${user.email} AND platform = ${targetPlatform} AND status = 'CONNECTED'
        LIMIT 1
      `;
      const acc = accRows[0];
      if (!acc) {
        sendJson(res, 400, {
          ok: false,
          code: 'SOCIAL_NOT_CONNECTED',
          platform: targetPlatform,
          error: `Akun ${targetPlatform.toUpperCase()} belum terhubung. Hubungkan akun Anda di menu "Akun Sosmed Terhubung".`,
        });
        return;
      }

      const hashtagsArr: string[] = Array.isArray(row.hashtags) ? row.hashtags : [];
      const fullContent = [
        String(row.caption || row.title || ''),
        String(row.cta || ''),
        hashtagsArr.join(' '),
      ]
        .filter((s) => s.trim().length > 0)
        .join('\n\n');

      const isVideo =
        String(row.format || '').toLowerCase().includes('reels') ||
        String(row.format || '').toLowerCase().includes('video') ||
        mediaUrls.some((u) => /\.mp4(\?|$)/i.test(u));

      const hostHeader = String(req.headers.host || 'developerproperti.giivepro.com');
      const proto = String(req.headers['x-forwarded-proto'] || 'https');
      const pubResult = await publishSlotViaZernio({
        keyIndex: Number(acc.zernio_key_index || 0),
        accountId: String(acc.zernio_account_id),
        platform: targetPlatform,
        content: fullContent,
        mediaUrls,
        isVideo,
        requestOrigin: `${proto}://${hostHeader}`,
      });

      const finalPostUrl = pubResult.postUrl || '';

      await sql`
        UPDATE sales_os.se_content_slots
        SET status = 'SUDAH_POSTING',
            posted_url = ${finalPostUrl},
            updated_at = NOW()
        WHERE se_email = ${user.email} AND slot_id = ${slotId}
      `;

      const todayStr = toWibDateStr(new Date());
      const postingCat = isVideo ? 'REEL' : 'STORY';
      await sql`
        INSERT INTO sales_os.se_field_logs (
          se_email, se_name, log_type, title, location_label, notes, payload
        ) VALUES (
          ${user.email}, ${user.name}, 'CONTENT_POSTING',
          ${`Auto-Publish ${targetPlatform.toUpperCase()} (${slotId})`},
          ${finalPostUrl || `post:${pubResult.postId}`},
          ${`Diposting via Zernio ke @${acc.account_username || targetPlatform}`},
          ${sql.json({ slotId, platform: targetPlatform, postId: pubResult.postId, keyIndex: Number(acc.zernio_key_index || 0), postUrl: finalPostUrl, postingCat, reportDate: todayStr })}
        )
      `.catch(() => {});

      sendJson(res, 200, {
        ok: true,
        slotId,
        platform: targetPlatform,
        username: acc.account_username,
        postId: pubResult.postId,
        postUrl: finalPostUrl,
        status: pubResult.status,
      });
      return;
    }

    // 14. UNIT INVENTORY STATE MACHINE & QUOTES (F67, F68, F69)
    if (pathname === '/api/units' && req.method === 'GET') {
      const projectId = parsedUrl.searchParams.get('projectId') || undefined;
      const units = await listUnits(user.tenantId, projectId);
      sendJson(res, 200, { ok: true, data: units });
      return;
    }

    if (pathname === '/api/units/transition' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const unitId = String(body.unitId || '').trim();
      const toStatus = String(body.toStatus || '').trim() as UnitStatus;
      if (!unitId || !toStatus) {
        sendJson(res, 400, { ok: false, error: 'unitId dan toStatus wajib diisi.' });
        return;
      }
      const result = await transitionUnitStatus({
        unitId,
        tenantId: user.tenantId,
        toStatus,
        actorEmail: user.email,
        actorRole: user.role,
        leadId: body.leadId ? String(body.leadId) : undefined,
        reason: body.reason ? String(body.reason) : undefined,
        holdHours: body.holdHours ? Number(body.holdHours) : undefined,
      });
      if (!result.ok) {
        sendJson(res, result.statusCode, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 200, { ok: true, unit: result.unit });
      return;
    }

    if (pathname === '/api/quotes' && req.method === 'GET') {
      const quotes = await sql`
        SELECT q.*, u.unit_code, u.cluster
        FROM sales_os.unit_quotes q
        JOIN sales_os.project_units u ON u.id = q.unit_id
        WHERE q.tenant_id = ${user.tenantId}
        ORDER BY q.created_at DESC
        LIMIT 50
      `;
      sendJson(res, 200, { ok: true, data: quotes });
      return;
    }

    if (pathname === '/api/quotes' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const unitId = String(body.unitId || '').trim();
      const scheme = String(body.scheme || 'KPR').trim().toUpperCase() as PaymentScheme;
      if (!unitId || !['CK', 'CT12', 'CT24', 'KPR'].includes(scheme)) {
        sendJson(res, 400, { ok: false, error: 'unitId dan scheme (CK/CT12/CT24/KPR) wajib valid.' });
        return;
      }
      const result = await createUnitQuote({
        tenantId: user.tenantId,
        unitId,
        leadId: body.leadId ? String(body.leadId) : undefined,
        scheme,
        dpPercent: body.dpPercent !== undefined ? Number(body.dpPercent) : undefined,
        tenorYears: body.tenorYears !== undefined ? Number(body.tenorYears) : undefined,
        interestRateAnnual: body.interestRateAnnual !== undefined ? Number(body.interestRateAnnual) : undefined,
        createdBy: user.email,
      });
      if (!result.ok) {
        sendJson(res, 404, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 201, { ok: true, quote: result.quote, unit: result.unit });
      return;
    }

    // 15. PUBLIC WEBSITE LIVE FEED & LEAD CAPTURE (F31, F32, F33) + SHORTLINK REDIRECTOR (/c/:code)
    if (pathname.startsWith('/c/') && req.method === 'GET') {
      const shortCode = decodeURIComponent(pathname.replace('/c/', '')).trim();
      if (!shortCode) {
        res.writeHead(302, { Location: '/site/the-park-sukoharjo' });
        res.end();
        return;
      }
      try {
        const rows = await sql`
          SELECT * FROM sales_os.smart_links
          WHERE short_code = ${shortCode}
          LIMIT 1
        `;
        if (rows.length > 0) {
          const link = rows[0];
          const ua = String(req.headers['user-agent'] || '');
          const uaHash = ua ? crypto.createHash('sha256').update(ua).digest('hex').slice(0, 16) : null;
          const referrer = String(req.headers.referer || req.headers.referrer || '').slice(0, 255) || null;
          await sql`
            INSERT INTO sales_os.link_touches (
              tenant_id, project_id, short_code, creator_code, content_code, touch_type, referrer, user_agent_hash
            ) VALUES (
              ${link.tenant_id}, ${link.project_id}, ${shortCode}, ${link.creator_code},
              ${link.content_code || null}, 'CLICK', ${referrer}, ${uaHash}
            )
          `;
          await sql`
            UPDATE sales_os.smart_links
            SET click_count = click_count + 1
            WHERE id = ${link.id}
          `;
          res.writeHead(302, { Location: String(link.target_url || '/site/the-park-sukoharjo') });
          res.end();
          return;
        }
      } catch (err) {
        console.warn('[SmartLink /c/:code] error:', err);
      }
      res.writeHead(302, { Location: `/site/the-park-sukoharjo?c=${encodeURIComponent(shortCode)}` });
      res.end();
      return;
    }

    // ONBOARDING OCR + AI + DUMMY PAYMENT GATEWAY (MULTI-TENANT ISOLATION)
    if (pathname === '/api/onboarding/extract' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const selectedPlan = (['gold', 'platinum', 'diamond'].includes(String(body.selectedPlan || '').toLowerCase())
        ? String(body.selectedPlan).toLowerCase()
        : 'platinum') as OnboardingPlanCode;
      const companyName = String(body.companyName || '').trim();
      const projectName = String(body.projectName || '').trim();
      if (!companyName || !projectName) {
        sendJson(res, 400, { ok: false, error: 'Nama Developer/PT dan Nama Proyek wajib diisi.' });
        return;
      }
      const result = await runOnboardingExtraction({
        selectedPlan,
        companyName,
        projectName,
        city: String(body.city || '').trim(),
        province: String(body.province || '').trim(),
        facilities: String(body.facilities || '').trim(),
        files: Array.isArray(body.files) ? body.files : [],
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (pathname === '/api/onboarding/activate' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const sessionId = String(body.sessionId || '').trim();
      const ownerEmail = String(body.ownerEmail || '').trim();
      if (!sessionId || !ownerEmail) {
        sendJson(res, 400, { ok: false, error: 'sessionId dan ownerEmail wajib diisi.' });
        return;
      }
      const result = await activateOnboardingWithDummyPayment({
        sessionId,
        ownerEmail,
        ownerName: String(body.ownerName || 'Admin IT Tim'),
        ownerPassword: String(body.ownerPassword || 'Andara2026!'),
        clusterCoords: Array.isArray(body.clusterCoords) ? body.clusterCoords : [],
        verifiedUnits: Array.isArray(body.verifiedUnits) ? body.verifiedUnits : [],
        loveLetterPoints: Array.isArray(body.loveLetterPoints) ? body.loveLetterPoints : [],
      });
      sendJson(res, result.ok ? 200 : 400, result);
      return;
    }

    if (pathname === '/api/onboarding/generate-love-letter' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await generateGroundedLoveLetter({
        developerName: String(body.developerName || 'Pengembang Resmi'),
        projectName: String(body.projectName || 'Proyek Hunian'),
        city: String(body.city || 'Indonesia'),
        province: String(body.province || ''),
        facilities: String(body.facilities || ''),
        clusters: Array.isArray(body.clusters) ? body.clusters : [],
        verifiedUnits: Array.isArray(body.verifiedUnits) ? body.verifiedUnits : [],
        extractedText: String(body.extractedText || ''),
        useAiEditorial: body.useAiEditorial !== false,
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (pathname.startsWith('/api/public/live/') && req.method === 'GET') {
      const slug = decodeURIComponent(pathname.replace('/api/public/live/', '')).trim().toLowerCase() || 'the-park-sukoharjo';
      const resolved = await resolveTenantByProjectSlug(slug);
      let sessions: any[] = [];
      if (resolved) {
        try {
          sessions = await sql`
            SELECT id, title, starts_at, ends_at, location_label, status, notes
            FROM sales_os.appointments
            WHERE tenant_id = ${resolved.tenantId}
              AND project_id = ${resolved.projectId}
              AND (title ILIKE '%live%' OR location_label ILIKE '%live%' OR notes ILIKE '%live%')
            ORDER BY starts_at ASC
            LIMIT 20
          `;
        } catch {
          sessions = [];
        }
      }
      sendJson(res, 200, { ok: true, slug, sessions });
      return;
    }

    if (pathname.startsWith('/api/public/site/') && req.method === 'GET') {
      const slug = decodeURIComponent(pathname.replace('/api/public/site/', '')).trim().toLowerCase() || 'the-park-sukoharjo';
      const resolved = await resolveTenantByProjectSlug(slug);
      if (!resolved) {
        sendJson(res, 404, { ok: false, error: 'Proyek publik tidak ditemukan.' });
        return;
      }
      const units = await listUnits(resolved.tenantId, resolved.projectId);
      const visibleUnits = units.filter((u: Record<string, any>) => u.status !== 'sold');
      sendJson(res, 200, {
        ok: true,
        site: {
          slug: resolved.slug,
          projectId: resolved.projectId,
          projectName: resolved.projectName,
          developer: resolved.developerName,
          location: resolved.locationLabel || 'Indonesia',
          updatedAt: new Date().toISOString(),
          feedHealthy: true,
        },
        units: visibleUnits.map((u: Record<string, any>) => ({
          id: u.id,
          unitCode: u.unit_code,
          cluster: u.cluster,
          unitType: u.unit_type,
          ltSqm: Number(u.lt_sqm),
          lbSqm: Number(u.lb_sqm),
          priceCash: Number(u.price_cash),
          priceKpr: Number(u.price_kpr),
          status: u.status,
        })),
      });
      return;
    }

    if (pathname === '/api/public/leads' && req.method === 'POST') {
      const body = await readJsonBody(req);
      // Anti-bot honeypot check
      if (body.website_hp && String(body.website_hp).trim() !== '') {
        sendJson(res, 400, { ok: false, error: 'Permintaan ditolak oleh filter anti-bot.' });
        return;
      }
      const name = String(body.name || '').trim();
      const phoneRaw = String(body.phone || '').trim();
      const consentAccepted = Boolean(body.consentAccepted);
      if (!name || !phoneRaw) {
        sendJson(res, 400, { ok: false, error: 'Nama lengkap dan nomor WhatsApp wajib diisi.' });
        return;
      }
      if (!consentAccepted) {
        sendJson(res, 400, { ok: false, error: 'Persetujuan kontak (consent) wajib dicentang.' });
        return;
      }

      const phoneWa = normalizePhoneWa(phoneRaw);
      if (phoneWa.length < 10) {
        sendJson(res, 400, { ok: false, error: 'Format nomor WhatsApp tidak valid.' });
        return;
      }

      const slug = String(body.slug || 'the-park-sukoharjo').trim().toLowerCase();
      const resolved = await resolveTenantByProjectSlug(slug);
      if (!resolved) {
        sendJson(res, 404, { ok: false, error: 'Proyek tujuan tidak ditemukan.' });
        return;
      }
      const targetTenantId = resolved.tenantId;
      const seRef = String(body.seRef || '').trim().toLowerCase();
      const assignedSe =
        seRef && SE_EMAILS.includes(seRef)
          ? seRef
          : await pickNextRoundRobinSe({
              tenantId: targetTenantId,
              projectId: resolved.projectId,
              fallbackEmails: SE_EMAILS,
            });
      const creatorCode = String(body.creatorCode || '').trim().toUpperCase().slice(0, 32);
      const contentCode = String(body.contentCode || '').trim().slice(0, 64);
      const personaCode = String(body.personaCode || '').trim().slice(0, 40);
      const utmSource = creatorCode
        ? `Kreator ${creatorCode}`
        : String(body.utmSource || 'Website Publik').trim().slice(0, 120);
      const unitInterest = String(body.unitCode || 'Unit Proyek').trim().slice(0, 80);

      // Deduplikasi nomor WA HANYA di dalam tenant aktif (tidak bocor lintas tenant!)
      const existing = await sql`
        SELECT id, full_name, owner_se_email FROM sales_os.pipeline_leads
        WHERE tenant_id = ${targetTenantId} AND phone_wa = ${phoneWa}
        LIMIT 1
      `;

      if (existing.length > 0) {
        sendJson(res, 200, {
          ok: true,
          deduplicated: true,
          leadId: existing[0].id,
          message: 'Terima kasih! Data Anda sudah terdaftar dan tim konsultan kami akan segera menghubungi Anda.',
        });
        return;
      }

      const ownerSeName = assignedSe.split('@')[0] || 'Sales Executive';
      const inserted = await sql`
        INSERT INTO sales_os.pipeline_leads (
          tenant_id, owner_se_email, owner_se_name, full_name, phone_wa, source, stage,
          unit_interest, sales_notes, wa_consent, wa_consent_updated_at, lead_quality, last_activity_at,
          creator_code, content_code, persona_code
        ) VALUES (
          ${targetTenantId}, ${assignedSe}, ${ownerSeName}, ${name}, ${phoneWa}, ${utmSource}, 'NEW',
          ${unitInterest}, ${'Form Website Publik (Consent v1.0)'}, 'OPT_IN', NOW(), 'WARM', NOW(),
          ${creatorCode || null}, ${contentCode || ''}, ${personaCode || 'P1'}
        )
        RETURNING id
      `;

      sendJson(res, 201, {
        ok: true,
        deduplicated: false,
        leadId: inserted[0].id,
        message: 'Terima kasih! Konsultan resmi kami akan segera menghubungi Anda via WhatsApp.',
      });
      return;
    }

    // 16. DOCUMENT TRUTH, EXTRACTOR & CONFLICT INBOX (F01, F02, F04, F05, F06)
    if (pathname === '/api/truth/upload' && req.method === 'POST') {
      if (!['ADMIN', 'SM', 'DIREKSI', 'IT', 'SUPERADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Admin/SM/Direksi/IT yang dapat mengunggah dokumen kebenaran proyek.' });
        return;
      }
      const body = await readJsonBody(req);
      const filename = String(body.filename || '').trim();
      const contentBase64 = String(body.contentBase64 || '').trim();
      if (!filename || !contentBase64) {
        sendJson(res, 400, { ok: false, error: 'filename dan contentBase64 wajib diisi.' });
        return;
      }
      const cleanB64 = contentBase64.includes(',') ? contentBase64.split(',')[1] : contentBase64;
      const fileBuffer = Buffer.from(cleanB64, 'base64');
      if (fileBuffer.length === 0 || fileBuffer.length > 20 * 1024 * 1024) {
        sendJson(res, 400, { ok: false, error: 'Ukuran file harus > 0 dan maksimal 20 MB.' });
        return;
      }
      const result = await ingestSourceDocument({
        tenantId: user.tenantId,
        projectId: String(body.projectId || user.projectId || 'the-park-sukoharjo'),
        docType: String(body.docType || 'pricelist'),
        filename,
        fileBuffer,
        uploadedBy: user.email,
      });
      if (!result.ok) {
        sendJson(res, 422, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 201, result);
      return;
    }

    if (pathname === '/api/truth/documents' && req.method === 'GET') {
      const docs = await sql`
        SELECT id, project_id, doc_type, filename, file_hash, version, effective_at, status, uploaded_by, created_at
        FROM sales_os.source_documents
        WHERE tenant_id = ${user.tenantId}
        ORDER BY created_at DESC
        LIMIT 50
      `;
      sendJson(res, 200, { ok: true, data: docs });
      return;
    }

    if (pathname === '/api/truth/conflicts' && req.method === 'GET') {
      const conflicts = await sql`
        SELECT * FROM sales_os.truth_conflicts
        WHERE tenant_id = ${user.tenantId}
        ORDER BY CASE WHEN status = 'open' THEN 0 ELSE 1 END, created_at DESC
        LIMIT 50
      `;
      sendJson(res, 200, { ok: true, data: conflicts });
      return;
    }

    if (pathname === '/api/truth/conflicts/resolve' && req.method === 'POST') {
      if (!['ADMIN', 'SM', 'DIREKSI', 'SUPERADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Admin/SM/Direksi yang dapat memutuskan konflik fakta.' });
        return;
      }
      const body = await readJsonBody(req);
      const conflictId = String(body.conflictId || '').trim();
      const action = String(body.action || 'accept').trim();
      if (!conflictId) {
        sendJson(res, 400, { ok: false, error: 'conflictId wajib diisi.' });
        return;
      }
      const rows = await sql`
        SELECT * FROM sales_os.truth_conflicts
        WHERE id = ${conflictId}::uuid AND tenant_id = ${user.tenantId} AND status = 'open'
        LIMIT 1
      `;
      if (rows.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Konflik tidak ditemukan atau sudah diselesaikan.' });
        return;
      }
      const c = rows[0];
      if (action === 'accept' && c.unit_code && c.fact_key === 'price_cash') {
        await sql`
          UPDATE sales_os.project_units
          SET price_cash = ${Number(c.new_value)}, version = version + 1, updated_by = ${user.email}, updated_at = NOW()
          WHERE tenant_id = ${user.tenantId} AND project_id = ${c.project_id} AND unit_code = ${c.unit_code}
        `;
      }
      await sql`
        UPDATE sales_os.truth_conflicts
        SET status = ${action === 'accept' ? 'accepted' : 'rejected'},
            resolved_by = ${user.email},
            resolution_note = ${String(body.note || '')},
            resolved_at = NOW()
        WHERE id = ${conflictId}::uuid
      `;
      sendJson(res, 200, { ok: true, conflictId, resolution: action });
      return;
    }

    // 17. AI NURTURE CADENCE (F55: Jadwal fleksibel, AI draft, edit penuh SE, Baileys)
    if (pathname === '/api/nurture/templates' && req.method === 'GET') {
      const templates = await listCadenceTemplates(user.tenantId);
      sendJson(res, 200, { ok: true, data: templates });
      return;
    }

    if (pathname === '/api/nurture/templates' && req.method === 'PUT') {
      const body = await readJsonBody(req);
      const stepCode = String(body.stepCode || '').trim();
      if (!stepCode) {
        sendJson(res, 400, { ok: false, error: 'stepCode wajib diisi.' });
        return;
      }
      const updated = await updateCadenceTemplate({
        tenantId: user.tenantId,
        stepCode,
        delayHours: body.delayHours !== undefined ? Number(body.delayHours) : undefined,
        stepLabel: body.stepLabel !== undefined ? String(body.stepLabel) : undefined,
        stepGoal: body.stepGoal !== undefined ? String(body.stepGoal) : undefined,
        autoSend: body.autoSend !== undefined ? Boolean(body.autoSend) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        updatedBy: user.email,
      });
      if (!updated) {
        sendJson(res, 404, { ok: false, error: 'Template cadence tidak ditemukan.' });
        return;
      }
      sendJson(res, 200, { ok: true, template: updated });
      return;
    }

    if (pathname === '/api/nurture/jobs' && req.method === 'GET') {
      const leadId = String(parsedUrl.searchParams.get('leadId') || '').trim();
      if (!leadId) {
        sendJson(res, 400, { ok: false, error: 'leadId wajib diisi.' });
        return;
      }
      let jobs = await getNurtureJobsForLead(leadId, user.tenantId);
      if (jobs.length === 0) {
        jobs = await scheduleNurtureForLead({ leadId, tenantId: user.tenantId, generateInitialDrafts: false });
      }
      const recentTurns = await getRecentLeadTurnsForNurture(leadId, 3);
      sendJson(res, 200, { ok: true, data: jobs, recentTurns });
      return;
    }

    if (pathname === '/api/nurture/jobs/generate' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const jobId = String(body.jobId || '').trim();
      if (!jobId) {
        sendJson(res, 400, { ok: false, error: 'jobId wajib diisi.' });
        return;
      }
      const tone = body.tone ? (String(body.tone) as NurtureTone) : undefined;
      const result = await regenerateNurtureJobDraft(jobId, user.tenantId, Boolean(body.force ?? true), tone);
      if (!result.ok) {
        sendJson(res, 400, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 200, { ok: true, job: result.job });
      return;
    }

    if (pathname === '/api/nurture/jobs/regenerate-all' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const leadId = String(body.leadId || '').trim();
      if (!leadId) {
        sendJson(res, 400, { ok: false, error: 'leadId wajib diisi.' });
        return;
      }
      const tone = body.tone ? (String(body.tone) as NurtureTone) : undefined;
      const result = await regenerateAllNurtureDraftsForLead(leadId, user.tenantId, tone);
      if (!result.ok) {
        sendJson(res, 400, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 200, { ok: true, data: result.data });
      return;
    }

    if (pathname === '/api/nurture/jobs/update' && req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const jobId = String(body.jobId || '').trim();
      if (!jobId) {
        sendJson(res, 400, { ok: false, error: 'jobId wajib diisi.' });
        return;
      }
      const result = await updateNurtureJob({
        jobId,
        tenantId: user.tenantId,
        draftMessage: body.draftMessage !== undefined ? String(body.draftMessage) : undefined,
        scheduledAt: body.scheduledAt !== undefined ? String(body.scheduledAt) : undefined,
        status: body.status,
      });
      if (!result.ok) {
        sendJson(res, 400, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 200, { ok: true, job: result.job });
      return;
    }

    if (pathname === '/api/nurture/jobs/send-now' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const jobId = String(body.jobId || '').trim();
      if (!jobId) {
        sendJson(res, 400, { ok: false, error: 'jobId wajib diisi.' });
        return;
      }
      const result = await executeNurtureJobSend(jobId, user.tenantId, user.name);
      if (!result.ok) {
        sendJson(res, 409, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/nurture/jobs/reschedule-anchor' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const leadId = String(body.leadId || '').trim();
      const anchorAt = String(body.anchorAt || '').trim();
      if (!leadId || !anchorAt) {
        sendJson(res, 400, { ok: false, error: 'leadId dan anchorAt wajib diisi.' });
        return;
      }
      const result = await rescheduleAnchorForLead({ leadId, tenantId: user.tenantId, anchorAt });
      if (!result.ok) {
        sendJson(res, 400, { ok: false, error: result.error });
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    // 18. PROFIL PENGGUNA & KONFIGURASI 2FA TOTP
    if (pathname === '/api/profile' && req.method === 'GET') {
      if (!user.userId) {
        sendJson(res, 401, { ok: false, error: 'Sesi pengguna tidak valid.' });
        return;
      }
      const profile = await getUserProfile(user.userId);
      sendJson(res, 200, { ok: true, data: profile });
      return;
    }

    if (pathname === '/api/profile' && req.method === 'PATCH') {
      if (!user.userId) {
        sendJson(res, 401, { ok: false, error: 'Sesi pengguna tidak valid.' });
        return;
      }
      const body = await readJsonBody(req);
      const updated = await updateUserProfile(user.userId, {
        name: body.name ? String(body.name) : undefined,
        phone: body.phone !== undefined ? String(body.phone) : undefined,
      });
      sendJson(res, 200, { ok: true, data: updated });
      return;
    }

    if (pathname === '/api/profile/totp/setup' && req.method === 'POST') {
      if (!user.userId) {
        sendJson(res, 401, { ok: false, error: 'Sesi pengguna tidak valid.' });
        return;
      }
      const setup = await setupUserTotp(user.userId);
      if (!setup.ok) {
        sendJson(res, 400, setup);
        return;
      }
      sendJson(res, 200, setup);
      return;
    }

    if (pathname === '/api/profile/totp/enable' && req.method === 'POST') {
      if (!user.userId) {
        sendJson(res, 401, { ok: false, error: 'Sesi pengguna tidak valid.' });
        return;
      }
      const body = await readJsonBody(req);
      const result = await enableUserTotp(user.userId, String(body.code || ''));
      if (!result.ok) {
        sendJson(res, 400, result);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/profile/totp/disable' && req.method === 'POST') {
      if (!user.userId) {
        sendJson(res, 401, { ok: false, error: 'Sesi pengguna tidak valid.' });
        return;
      }
      const body = await readJsonBody(req);
      const result = await disableUserTotp(user.userId, String(body.codeOrPassword || ''));
      if (!result.ok) {
        sendJson(res, 400, result);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    // ORG USERS MANAGEMENT (ADMIN & SM)
    if (pathname === '/api/org/users' && req.method === 'GET') {
      if (!['ADMIN', 'SM', 'DIREKSI', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Admin dan Sales Manager yang dapat melihat daftar user tim.' });
        return;
      }
      const users = await listTenantUsers(user.tenantId);
      sendJson(res, 200, { ok: true, users, allowedRoles: BASIC_ORG_ROLES });
      return;
    }

    if (pathname === '/api/org/users' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await createTenantUser(user, {
        name: String(body.name || ''),
        email: String(body.email || ''),
        phone: body.phone ? String(body.phone) : undefined,
        role: String(body.role || ''),
        password: String(body.password || ''),
        projectId: body.projectId ? String(body.projectId) : undefined,
      });
      if (!result.ok) {
        sendJson(res, 400, result);
        return;
      }
      sendJson(res, 201, result);
      return;
    }

    if (pathname === '/api/org/users' && req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const targetUserId = String(body.userId || body.id || '').trim();
      if (!targetUserId) {
        sendJson(res, 400, { ok: false, error: 'userId wajib diisi.' });
        return;
      }
      const result = await updateTenantUser(user, targetUserId, {
        name: body.name !== undefined ? String(body.name) : undefined,
        email: body.email !== undefined ? String(body.email) : undefined,
        phone: body.phone !== undefined ? (body.phone ? String(body.phone) : null) : undefined,
        role: body.role !== undefined ? String(body.role) : undefined,
        projectId: body.projectId !== undefined ? String(body.projectId) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        password: body.password !== undefined ? String(body.password) : undefined,
      });
      if (!result.ok) {
        sendJson(res, 400, result);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/org/users' && req.method === 'DELETE') {
      const targetUserId = String(parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('userId') || '').trim();
      if (!targetUserId) {
        sendJson(res, 400, { ok: false, error: 'ID user wajib diisi.' });
        return;
      }
      const result = await deleteTenantUser(user, targetUserId);
      if (!result.ok) {
        sendJson(res, 400, result);
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    // DOKUMEN VAULT KPR (REAL DB)
    if (pathname === '/api/vault/documents' && req.method === 'GET') {
      const projectIdParam = String(parsedUrl.searchParams.get('projectId') || '').trim();
      const isWideRole = ['TL', 'SM', 'DIREKSI', 'ADMIN', 'IT', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role);
      const rows = isWideRole
        ? await sql`
            SELECT d.*, l.full_name AS lead_full_name, l.phone_wa AS lead_phone_wa
            FROM sales_os.vault_documents d
            LEFT JOIN sales_os.pipeline_leads l ON l.id = d.lead_id
            WHERE d.tenant_id = ${user.tenantId}
              ${projectIdParam ? sql`AND d.project_id = ${projectIdParam}` : sql``}
            ORDER BY d.created_at DESC
          `
        : await sql`
            SELECT d.*, l.full_name AS lead_full_name, l.phone_wa AS lead_phone_wa
            FROM sales_os.vault_documents d
            LEFT JOIN sales_os.pipeline_leads l ON l.id = d.lead_id
            WHERE d.tenant_id = ${user.tenantId}
              ${projectIdParam ? sql`AND d.project_id = ${projectIdParam}` : sql``}
              AND (d.owner_se_email = ${user.email} OR l.owner_se_email = ${user.email})
            ORDER BY d.created_at DESC
          `;
      sendJson(res, 200, { ok: true, documents: rows });
      return;
    }

    if (pathname === '/api/vault/documents' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo').trim();
      const leadIdRaw = body.leadId ? String(body.leadId).trim() : '';
      let leadName = String(body.leadName || '').trim();
      let unitInterest = String(body.unitInterest || '').trim();
      let ownerSeEmail = user.email;
      let resolvedLeadId: string | null = null;

      if (leadIdRaw) {
        const leadRows = await sql`
          SELECT id, full_name, unit_interest, owner_se_email
          FROM sales_os.pipeline_leads
          WHERE id = ${leadIdRaw}::uuid AND tenant_id = ${user.tenantId}
          LIMIT 1
        `;
        if (leadRows.length === 0) {
          sendJson(res, 404, { ok: false, error: 'Lead tidak ditemukan pada proyek/tenant ini.' });
          return;
        }
        resolvedLeadId = String(leadRows[0].id);
        leadName = String(leadRows[0].full_name);
        if (!unitInterest) unitInterest = String(leadRows[0].unit_interest || '');
        ownerSeEmail = String(leadRows[0].owner_se_email || user.email);
      }

      if (!leadName) {
        sendJson(res, 400, { ok: false, error: 'Nama lead / debitur wajib dipilih atau diisi.' });
        return;
      }

      const itemsRaw = Array.isArray(body.documents) && body.documents.length > 0
        ? body.documents
        : [
            {
              docType: body.docType,
              fileName: body.fileName,
              fileSize: body.fileSize,
              accessGrantedBanks: body.accessGrantedBanks,
            },
          ];

      const inserted: any[] = [];
      for (const item of itemsRaw) {
        const docType = String(item.docType || 'KTP').trim().toUpperCase();
        const fileName = String(item.fileName || '').trim();
        if (!fileName) continue;
        const fileSize = String(item.fileSize || '1.0 MB').trim();
        const banks = Array.isArray(item.accessGrantedBanks) ? item.accessGrantedBanks : [];
        const rows = await sql`
          INSERT INTO sales_os.vault_documents (
            tenant_id, project_id, lead_id, owner_se_email, lead_name, unit_interest,
            doc_type, file_name, file_size, status, access_granted_banks
          ) VALUES (
            ${user.tenantId}, ${projectId}, ${resolvedLeadId}::uuid, ${ownerSeEmail}, ${leadName},
            ${unitInterest}, ${docType}, ${fileName}, ${fileSize}, 'PERLU_REVIEW', ${JSON.stringify(banks)}::jsonb
          )
          RETURNING *
        `;
        if (rows[0]) inserted.push(rows[0]);
      }

      if (inserted.length === 0) {
        sendJson(res, 400, { ok: false, error: 'Minimal 1 berkas dokumen valid wajib diunggah.' });
        return;
      }
      sendJson(res, 201, { ok: true, documents: inserted });
      return;
    }

    if (pathname === '/api/vault/documents' && req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID dokumen wajib diisi.' });
        return;
      }
      const nextStatus = body.status ? String(body.status).trim().toUpperCase() : null;
      if (nextStatus && !['TERVERIFIKASI', 'PERLU_REVIEW', 'DITOLAK', 'EXPIRED'].includes(nextStatus)) {
        sendJson(res, 400, { ok: false, error: 'Status dokumen tidak valid.' });
        return;
      }
      if (nextStatus && !['SM', 'ADMIN', 'TL', 'DIREKSI', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya SM, Admin, TL, atau Direksi yang dapat menyetujui/menolak dokumen.' });
        return;
      }
      const banks = Array.isArray(body.accessGrantedBanks) ? body.accessGrantedBanks : null;
      const reviewNotes = body.reviewNotes !== undefined ? String(body.reviewNotes) : null;
      const docType = body.docType ? String(body.docType).trim().toUpperCase() : null;
      const fileName = body.fileName ? String(body.fileName).trim() : null;
      const fileSize = body.fileSize ? String(body.fileSize).trim() : null;
      const unitInterest = body.unitInterest !== undefined ? String(body.unitInterest).trim() : null;
      const leadName = body.leadName ? String(body.leadName).trim() : null;
      const isWideRole = ['SM', 'ADMIN', 'TL', 'DIREKSI', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role);

      const updated = isWideRole
        ? await sql`
            UPDATE sales_os.vault_documents
            SET
              status = COALESCE(${nextStatus}, status),
              reviewed_by = CASE WHEN ${nextStatus} IS NOT NULL THEN ${user.name} ELSE reviewed_by END,
              review_notes = COALESCE(${reviewNotes}, review_notes),
              access_granted_banks = COALESCE(${banks ? JSON.stringify(banks) : null}::jsonb, access_granted_banks),
              doc_type = COALESCE(${docType}, doc_type),
              file_name = COALESCE(${fileName}, file_name),
              file_size = COALESCE(${fileSize}, file_size),
              unit_interest = COALESCE(${unitInterest}, unit_interest),
              lead_name = COALESCE(${leadName}, lead_name),
              updated_at = NOW()
            WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId}
            RETURNING *
          `
        : await sql`
            UPDATE sales_os.vault_documents
            SET
              access_granted_banks = COALESCE(${banks ? JSON.stringify(banks) : null}::jsonb, access_granted_banks),
              doc_type = COALESCE(${docType}, doc_type),
              file_name = COALESCE(${fileName}, file_name),
              file_size = COALESCE(${fileSize}, file_size),
              unit_interest = COALESCE(${unitInterest}, unit_interest),
              lead_name = COALESCE(${leadName}, lead_name),
              updated_at = NOW()
            WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId} AND owner_se_email = ${user.email}
            RETURNING *
          `;
      if (updated.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Dokumen tidak ditemukan atau tidak memiliki akses ubah.' });
        return;
      }
      sendJson(res, 200, { ok: true, document: updated[0] });
      return;
    }

    if (pathname === '/api/vault/documents' && req.method === 'DELETE') {
      const id = String(parsedUrl.searchParams.get('id') || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID dokumen wajib diisi.' });
        return;
      }
      const isWideRole = ['SM', 'ADMIN', 'DIREKSI', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role);
      const deleted = isWideRole
        ? await sql`DELETE FROM sales_os.vault_documents WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId} RETURNING id`
        : await sql`
            DELETE FROM sales_os.vault_documents d
            WHERE d.id = ${id}::uuid
              AND d.tenant_id = ${user.tenantId}
              AND (
                d.owner_se_email = ${user.email}
                OR EXISTS (
                  SELECT 1 FROM sales_os.pipeline_leads l
                  WHERE l.id = d.lead_id AND l.owner_se_email = ${user.email}
                )
              )
            RETURNING d.id
          `;
      if (deleted.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Dokumen tidak ditemukan atau tidak memiliki akses hapus.' });
        return;
      }
      sendJson(res, 200, { ok: true, id });
      return;
    }

    // PENGAJUAN KPR BANK (REAL DB + AUTO-SYNC LEAD KPR)
    if (pathname === '/api/kpr/applications' && req.method === 'GET') {
      const projectIdParam = String(parsedUrl.searchParams.get('projectId') || '').trim();
      const isWideRole = ['TL', 'SM', 'DIREKSI', 'ADMIN', 'IT', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role);

      const kprLeads = isWideRole
        ? await sql`
            SELECT l.id, l.project_id, l.owner_se_email, l.full_name, l.phone_wa, l.unit_interest, l.cluster_interest, l.unit_price_idr
            FROM sales_os.pipeline_leads l
            WHERE l.tenant_id = ${user.tenantId}
              AND (UPPER(COALESCE(l.payment_scheme, '')) LIKE '%KPR%' OR l.stage = 'DP_KPR_PROCESS')
              AND NOT EXISTS (
                SELECT 1 FROM sales_os.bank_applications b
                WHERE b.lead_id = l.id AND b.tenant_id = l.tenant_id
              )
          `
        : await sql`
            SELECT l.id, l.project_id, l.owner_se_email, l.full_name, l.phone_wa, l.unit_interest, l.cluster_interest, l.unit_price_idr
            FROM sales_os.pipeline_leads l
            WHERE l.tenant_id = ${user.tenantId}
              AND l.owner_se_email = ${user.email}
              AND (UPPER(COALESCE(l.payment_scheme, '')) LIKE '%KPR%' OR l.stage = 'DP_KPR_PROCESS')
              AND NOT EXISTS (
                SELECT 1 FROM sales_os.bank_applications b
                WHERE b.lead_id = l.id AND b.tenant_id = l.tenant_id
              )
          `;

      for (const lead of kprLeads) {
        const estPlafond = Math.round(Number(lead.unit_price_idr || 650000000) * 0.8);
        await sql`
          INSERT INTO sales_os.bank_applications (
            tenant_id, project_id, lead_id, owner_se_email, applicant_name, applicant_phone,
            unit_code, cluster, target_bank, plafond_amount, status, status_notes, source_mode
          ) VALUES (
            ${user.tenantId},
            ${projectIdParam || String(lead.project_id || user.projectId || 'the-park-sukoharjo')},
            ${lead.id}::uuid,
            ${String(lead.owner_se_email)},
            ${String(lead.full_name)},
            ${String(lead.phone_wa || '')},
            ${String(lead.unit_interest || 'Unit KPR')},
            ${String(lead.cluster_interest || '')},
            'Bank BSI',
            ${estPlafond},
            'SUBMITTED_TO_BANK',
            'Otomatis masuk dari Lead kategori KPR. Silakan sesuaikan bank tujuan, plafond & progres berkas.',
            'LEAD_AUTO'
          )
        `;
      }

      const rows = isWideRole
        ? await sql`
            SELECT * FROM sales_os.bank_applications
            WHERE tenant_id = ${user.tenantId}
              ${projectIdParam ? sql`AND project_id = ${projectIdParam}` : sql``}
            ORDER BY created_at DESC
          `
        : await sql`
            SELECT * FROM sales_os.bank_applications
            WHERE tenant_id = ${user.tenantId}
              ${projectIdParam ? sql`AND project_id = ${projectIdParam}` : sql``}
              AND owner_se_email = ${user.email}
            ORDER BY created_at DESC
          `;
      sendJson(res, 200, { ok: true, applications: rows });
      return;
    }

    if (pathname === '/api/kpr/applications' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo').trim();
      const leadIdRaw = body.leadId ? String(body.leadId).trim() : '';
      let resolvedLeadId: string | null = null;
      let applicantName = String(body.applicantName || '').trim();
      let applicantPhone = String(body.applicantPhone || '').trim();
      let unitCode = String(body.unitCode || '').trim();
      let cluster = String(body.cluster || '').trim();
      let ownerSeEmail = user.email;
      let sourceMode = 'MANUAL';

      if (leadIdRaw) {
        const leadRows = await sql`
          SELECT id, full_name, phone_wa, unit_interest, cluster_interest, owner_se_email
          FROM sales_os.pipeline_leads
          WHERE id = ${leadIdRaw}::uuid AND tenant_id = ${user.tenantId}
          LIMIT 1
        `;
        if (leadRows.length === 0) {
          sendJson(res, 404, { ok: false, error: 'Lead tidak ditemukan.' });
          return;
        }
        resolvedLeadId = String(leadRows[0].id);
        applicantName = applicantName || String(leadRows[0].full_name);
        applicantPhone = applicantPhone || String(leadRows[0].phone_wa || '');
        unitCode = unitCode || String(leadRows[0].unit_interest || '');
        cluster = cluster || String(leadRows[0].cluster_interest || '');
        ownerSeEmail = String(leadRows[0].owner_se_email || user.email);
        sourceMode = 'LEAD_SELECTED';
      }

      if (!applicantName || !unitCode) {
        sendJson(res, 400, { ok: false, error: 'Nama pemohon dan unit wajib diisi.' });
        return;
      }

      const targetBank = String(body.targetBank || 'Bank BSI').trim();
      const plafondAmount = Math.max(0, Number(body.plafondAmount || 0));
      const statusNotes = String(body.statusNotes || 'Pengajuan KPR baru ditambahkan.').trim();
      const assignedAnalyst = body.assignedAnalyst ? String(body.assignedAnalyst).trim() : null;
      if (!cluster) {
        cluster = unitCode.toLowerCase().includes('nagoya')
          ? 'Nagoya'
          : unitCode.toLowerCase().includes('osaka')
          ? 'Osaka'
          : unitCode.toLowerCase().includes('tokyo')
          ? 'Tokyo'
          : 'Umum';
      }

      const inserted = await sql`
        INSERT INTO sales_os.bank_applications (
          tenant_id, project_id, lead_id, owner_se_email, applicant_name, applicant_phone,
          unit_code, cluster, target_bank, plafond_amount, status, status_notes, assigned_analyst, source_mode
        ) VALUES (
          ${user.tenantId}, ${projectId}, ${resolvedLeadId}::uuid, ${ownerSeEmail}, ${applicantName},
          ${applicantPhone}, ${unitCode}, ${cluster}, ${targetBank}, ${plafondAmount},
          'SUBMITTED_TO_BANK', ${statusNotes}, ${assignedAnalyst}, ${sourceMode}
        )
        RETURNING *
      `;
      sendJson(res, 201, { ok: true, application: inserted[0] });
      return;
    }

    if (pathname === '/api/kpr/applications' && req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID pengajuan KPR wajib diisi.' });
        return;
      }
      const nextStatus = body.status ? String(body.status).trim() : null;
      const targetBank = body.targetBank ? String(body.targetBank).trim() : null;
      const plafondAmount = body.plafondAmount !== undefined ? Number(body.plafondAmount) : null;
      const statusNotes = body.statusNotes !== undefined ? String(body.statusNotes) : null;
      const assignedAnalyst = body.assignedAnalyst !== undefined ? String(body.assignedAnalyst) : null;
      const applicantName = body.applicantName ? String(body.applicantName).trim() : null;
      const applicantPhone = body.applicantPhone !== undefined ? String(body.applicantPhone).trim() : null;
      const unitCode = body.unitCode ? String(body.unitCode).trim() : null;
      const cluster = body.cluster ? String(body.cluster).trim() : null;
      const isWideRole = ['TL', 'SM', 'DIREKSI', 'ADMIN', 'IT', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role);

      const updated = isWideRole
        ? await sql`
            UPDATE sales_os.bank_applications
            SET
              status = COALESCE(${nextStatus}, status),
              target_bank = COALESCE(${targetBank}, target_bank),
              plafond_amount = COALESCE(${plafondAmount}, plafond_amount),
              status_notes = COALESCE(${statusNotes}, status_notes),
              assigned_analyst = COALESCE(${assignedAnalyst}, assigned_analyst),
              applicant_name = COALESCE(${applicantName}, applicant_name),
              applicant_phone = COALESCE(${applicantPhone}, applicant_phone),
              unit_code = COALESCE(${unitCode}, unit_code),
              cluster = COALESCE(${cluster}, cluster),
              sp3k_expiry_date = CASE WHEN ${nextStatus} = 'SP3K_TERBIT' AND sp3k_expiry_date IS NULL THEN (CURRENT_DATE + INTERVAL '30 days')::date ELSE sp3k_expiry_date END,
              updated_at = NOW()
            WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId}
            RETURNING *
          `
        : await sql`
            UPDATE sales_os.bank_applications
            SET
              status = COALESCE(${nextStatus}, status),
              target_bank = COALESCE(${targetBank}, target_bank),
              plafond_amount = COALESCE(${plafondAmount}, plafond_amount),
              status_notes = COALESCE(${statusNotes}, status_notes),
              assigned_analyst = COALESCE(${assignedAnalyst}, assigned_analyst),
              applicant_name = COALESCE(${applicantName}, applicant_name),
              applicant_phone = COALESCE(${applicantPhone}, applicant_phone),
              unit_code = COALESCE(${unitCode}, unit_code),
              cluster = COALESCE(${cluster}, cluster),
              sp3k_expiry_date = CASE WHEN ${nextStatus} = 'SP3K_TERBIT' AND sp3k_expiry_date IS NULL THEN (CURRENT_DATE + INTERVAL '30 days')::date ELSE sp3k_expiry_date END,
              updated_at = NOW()
            WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId} AND owner_se_email = ${user.email}
            RETURNING *
          `;
      if (updated.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Pengajuan KPR tidak ditemukan atau tidak memiliki akses ubah.' });
        return;
      }
      if (String(updated[0].status) === 'AKAD_KREDIT') {
        await spawnLegalMilestoneOnAkad({
          tenantId: user.tenantId,
          projectId: String(updated[0].project_id || 'the-park-sukoharjo'),
          kprAppId: String(updated[0].id),
          applicantName: String(updated[0].applicant_name || 'Pembeli'),
          unitCode: String(updated[0].unit_code || 'Unit'),
          actorEmail: user.email,
        }).catch(() => {});
      }
      sendJson(res, 200, { ok: true, application: updated[0] });
      return;
    }

    if (pathname === '/api/kpr/applications' && req.method === 'DELETE') {
      const id = String(parsedUrl.searchParams.get('id') || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID pengajuan KPR wajib diisi.' });
        return;
      }
      const isWideRole = ['TL', 'SM', 'DIREKSI', 'ADMIN', 'IT', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role);
      const deleted = isWideRole
        ? await sql`DELETE FROM sales_os.bank_applications WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId} RETURNING id`
        : await sql`DELETE FROM sales_os.bank_applications WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId} AND owner_se_email = ${user.email} RETURNING id`;
      if (deleted.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Pengajuan KPR tidak ditemukan atau tidak memiliki akses hapus.' });
        return;
      }
      sendJson(res, 200, { ok: true, id });
      return;
    }

    // PERMISSIONS (USER & ROLE MATRIX)
    if (pathname === '/api/permissions/me' && req.method === 'GET') {
      const permissions = await getEffectivePermissionsForUser(
        user.tenantId,
        user.userId,
        user.role
      );
      sendJson(res, 200, { ok: true, permissions, features: PLATFORM_FEATURES });
      return;
    }

    if (pathname === '/api/superadmin/permissions' && req.method === 'GET') {
      if (!['SUPERADMIN_IT', 'SUPERADMIN', 'ADMIN', 'SM'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Akses ditolak untuk manajemen permission.' });
        return;
      }
      const scopeType = (parsedUrl.searchParams.get('scopeType') || 'USER').toUpperCase() as 'USER' | 'ROLE';
      const targetUserId = parsedUrl.searchParams.get('targetUserId') || undefined;
      const targetRole = parsedUrl.searchParams.get('targetRole') || undefined;
      const users = await listTenantUsers(user.tenantId);
      const matrix = await getScopePermissionMatrix(user.tenantId, scopeType, targetUserId, targetRole);
      sendJson(res, 200, {
        ok: true,
        features: PLATFORM_FEATURES,
        allowedRoles: BASIC_ORG_ROLES,
        users,
        matrix,
      });
      return;
    }

    if (pathname === '/api/superadmin/permissions' && req.method === 'PUT') {
      if (!['SUPERADMIN_IT', 'SUPERADMIN', 'ADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Superadmin IT / Superadmin / Admin yang dapat menyimpan permission.' });
        return;
      }
      const body = await readJsonBody(req);
      const scopeType = String(body.scopeType || 'USER').toUpperCase() === 'ROLE' ? 'ROLE' : 'USER';
      const targetUserId = body.targetUserId ? String(body.targetUserId) : undefined;
      const targetRole = body.targetRole ? String(body.targetRole) : undefined;
      const permissions = (body.permissions || {}) as Record<string, any>;
      await saveScopePermissions({
        tenantId: user.tenantId,
        scopeType,
        targetUserId,
        targetRole,
        permissions,
        updatedBy: user.email,
      });
      sendJson(res, 200, { ok: true });
      return;
    }

    // DASHBOARD SUMMARY AGREGASI NYATA
    if (pathname === '/api/dashboard/summary' && req.method === 'GET') {
      const projectIdParam = String(parsedUrl.searchParams.get('projectId') || '').trim();
      const [usersRows, leadsRows, unitsRows, kprRows, vaultRows, fieldRows, escRows, auditRows, campaignRows] =
        await Promise.all([
          sql`SELECT id, name, email, role, is_active FROM sales_os.app_users WHERE tenant_id = ${user.tenantId}`,
          sql`SELECT id, owner_se_email, owner_se_name, full_name, phone_wa, stage, grade, unit_interest, unit_price_idr, payment_scheme, lead_quality, spam_reason, is_in_pool, response_time_seconds, created_at, updated_at FROM sales_os.pipeline_leads WHERE tenant_id = ${user.tenantId} ORDER BY created_at DESC`,
          sql`SELECT id, unit_code, cluster, status, price_idr FROM sales_os.project_units WHERE tenant_id = ${user.tenantId} ${projectIdParam ? sql`AND project_id = ${projectIdParam}` : sql``}`,
          sql`SELECT id, applicant_name, unit_code, target_bank, plafond_amount, status, created_at FROM sales_os.bank_applications WHERE tenant_id = ${user.tenantId}`,
          sql`SELECT id, lead_name, doc_type, status FROM sales_os.vault_documents WHERE tenant_id = ${user.tenantId}`,
          sql`SELECT id, se_email, se_name, log_type, location_label, created_at FROM sales_os.se_field_logs ORDER BY created_at DESC LIMIT 200`,
          sql`SELECT * FROM sales_os.escalation_requests WHERE tenant_id = ${user.tenantId} ORDER BY created_at DESC`,
          sql`SELECT id, actor_name, actor_role, summary, action_type, created_at FROM sales_os.activity_audit_logs WHERE tenant_id = ${user.tenantId} ORDER BY created_at DESC LIMIT 30`,
          sql`SELECT * FROM sales_os.ad_campaigns WHERE tenant_id = ${user.tenantId} ORDER BY created_at DESC`,
        ]);

      const seUsers = usersRows.filter((u: any) => u.role === 'SE' && u.is_active);
      const seTeamPerformance = seUsers.map((se: any) => {
        const email = String(se.email).toLowerCase();
        const myLeads = leadsRows.filter((l: any) => String(l.owner_se_email).toLowerCase() === email);
        const myVisits = myLeads.filter((l: any) => ['VISITED', 'HOT_NEGOTIATION', 'BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(l.stage)).length;
        const myBookings = myLeads.filter((l: any) => ['BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(l.stage)).length;
        const myNet = myLeads.filter((l: any) => l.stage === 'PPJB_AKAD').length;
        const respTimes = myLeads.map((l: any) => Number(l.response_time_seconds || 0)).filter((n: number) => n > 0);
        const avgRespMin = respTimes.length > 0 ? Math.round(respTimes.reduce((a: number, b: number) => a + b, 0) / respTimes.length / 60) : 3;
        const myLogs = fieldRows.filter((f: any) => String(f.se_email).toLowerCase() === email);
        const latestZone = myLogs[0]?.location_label || 'Lapangan / Kantor';
        const score = Math.min(100, 40 + myLeads.length * 4 + myVisits * 6 + myBookings * 12);
        return {
          seId: String(se.id),
          nama: String(se.name),
          email,
          zonaHariIni: String(latestZone),
          leadBulanIni: myLeads.length,
          prospekBulanIni: myLeads.filter((l: any) => l.grade === 'A' || l.grade === 'B').length,
          kunjunganBulanIni: myVisits,
          bookingBulanIni: myBookings,
          netSalesBulanIni: myNet,
          rataResponsMenit: avgRespMin,
          laporanHariIni: myLogs.length > 0 ? 'tepat_waktu' : 'belum_kirim',
          scorecardPoin: score,
          scorecardKategori: score >= 85 ? 'Sangat Baik' : score >= 70 ? 'Baik' : 'Perlu Ditingkatkan',
        };
      });

      const liveSlaLeads = leadsRows.slice(0, 12).map((l: any) => {
        const respSec = Number(l.response_time_seconds || 180);
        return {
          id: String(l.id),
          namaLead: String(l.full_name),
          seNama: String(l.owner_se_name || l.owner_se_email),
          durasiMenit: Math.max(1, Math.round(respSec / 60)),
          statusSla: l.is_in_pool ? 'dialihkan_pool' : respSec > 300 ? 'warning_sla' : 'aman',
          tahap: String(l.stage),
        };
      });

      const bookingLeads = leadsRows.filter((l: any) => ['BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(l.stage));
      const bookingTransactions = bookingLeads.map((l: any) => ({
        id: String(l.id).slice(0, 8).toUpperCase(),
        pembeli: String(l.full_name),
        seName: String(l.owner_se_name || l.owner_se_email),
        unit: String(l.unit_interest || '-'),
        skema: String(l.payment_scheme || 'KPR'),
        statusAdminH1: l.stage === 'PPJB_AKAD' || l.stage === 'DP_KPR_PROCESS' ? 'Terkonfirmasi' : 'Menunggu Verifikasi',
        statusKprH7: `${vaultRows.filter((v: any) => String(v.lead_name).toLowerCase() === String(l.full_name).toLowerCase()).length} Berkas Vault`,
      }));

      const leadFeedbacks = leadsRows
        .filter((l: any) => l.lead_quality || l.spam_reason)
        .slice(0, 12)
        .map((l: any) => ({
          id: String(l.id),
          leadName: String(l.full_name),
          seName: String(l.owner_se_name || l.owner_se_email),
          quality: String(l.lead_quality || 'WARM'),
          reason: String(l.spam_reason || l.unit_interest || 'Kualitas sesuai target'),
        }));

      sendJson(res, 200, {
        ok: true,
        seTeamPerformance,
        liveSlaLeads,
        bookingTransactions,
        escalations: escRows,
        auditLogs: auditRows,
        campaigns: campaignRows,
        leadFeedbacks,
        counts: {
          totalUnits: unitsRows.length,
          availableUnits: unitsRows.filter((u: any) => u.status === 'tersedia').length,
          bookingUnits: unitsRows.filter((u: any) => u.status === 'booking').length,
          soldUnits: unitsRows.filter((u: any) => u.status === 'terjual').length,
          totalLeads: leadsRows.length,
          kprApplications: kprRows.length,
          vaultPending: vaultRows.filter((v: any) => v.status === 'PERLU_REVIEW').length,
        },
      });
      return;
    }

    // ESCALATIONS (SE/SM -> DIREKSI)
    if (pathname === '/api/escalations' && req.method === 'GET') {
      const rows = await sql`
        SELECT * FROM sales_os.escalation_requests
        WHERE tenant_id = ${user.tenantId}
        ORDER BY created_at DESC
      `;
      sendJson(res, 200, { ok: true, escalations: rows });
      return;
    }

    if (pathname === '/api/escalations' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const jenis = String(body.jenis || 'Diskon Khusus').trim();
      const pembeli = String(body.pembeli || '').trim();
      const unit = String(body.unit || '').trim();
      const proyek = String(body.proyek || 'The Park Townhouse Sukoharjo').trim();
      const nilai = String(body.nilai || '').trim();
      if (!pembeli || !unit || !nilai) {
        sendJson(res, 400, { ok: false, error: 'Pembeli, unit, dan nilai eskalasi wajib diisi.' });
        return;
      }
      const inserted = await sql`
        INSERT INTO sales_os.escalation_requests (
          tenant_id, project_id, jenis, pembeli, unit, proyek, nilai, rekomendasi_ai, requested_by
        ) VALUES (
          ${user.tenantId}, ${String(body.projectId || user.projectId || 'the-park-sukoharjo')},
          ${jenis}, ${pembeli}, ${unit}, ${proyek}, ${nilai},
          ${String(body.rekomendasiAi || 'Menunggu evaluasi margin oleh Direksi.')},
          ${user.email}
        )
        RETURNING *
      `;
      sendJson(res, 201, { ok: true, escalation: inserted[0] });
      return;
    }

    if (pathname === '/api/escalations' && req.method === 'PATCH') {
      if (!['DIREKSI', 'SM', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Direksi / SM yang dapat memutuskan eskalasi.' });
        return;
      }
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      const status = String(body.status || '').trim();
      if (!id || !['Disetujui', 'Ditolak'].includes(status)) {
        sendJson(res, 400, { ok: false, error: 'ID dan status valid (Disetujui/Ditolak) wajib diisi.' });
        return;
      }
      const updated = await sql`
        UPDATE sales_os.escalation_requests
        SET status = ${status}, decided_by = ${user.name}, decided_at = NOW()
        WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId}
        RETURNING *
      `;
      if (updated.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Eskalasi tidak ditemukan.' });
        return;
      }
      sendJson(res, 200, { ok: true, escalation: updated[0] });
      return;
    }

    // REFERRAL PROGRAM & PARTNER SCHEME CONFIG
    if (pathname === '/api/referrals' && req.method === 'GET') {
      const projectIdParam = String(parsedUrl.searchParams.get('projectId') || '').trim();
      const rows = await sql`
        SELECT * FROM sales_os.referral_leads
        WHERE tenant_id = ${user.tenantId}
          ${projectIdParam ? sql`AND project_id = ${projectIdParam}` : sql``}
        ORDER BY created_at DESC
      `;
      sendJson(res, 200, { ok: true, referrals: rows });
      return;
    }

    if (pathname === '/api/referrals' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo').trim();
      const advocateName = String(body.advocateName || user.name).trim();
      const referredFriendName = String(body.referredFriendName || '').trim();
      const referredFriendPhone = String(body.referredFriendPhone || '').trim();
      if (!referredFriendName) {
        sendJson(res, 400, { ok: false, error: 'Nama teman/prospek referral wajib diisi.' });
        return;
      }

      let linkedLeadId: string | null = null;
      if (referredFriendPhone) {
        const normalizedPhone = normalizePhoneWa(referredFriendPhone);
        if (normalizedPhone) {
          const existingLead = await sql`
            SELECT id FROM sales_os.pipeline_leads
            WHERE tenant_id = ${user.tenantId} AND phone_wa = ${normalizedPhone}
            LIMIT 1
          `;
          if (existingLead[0]) {
            linkedLeadId = String(existingLead[0].id);
          } else {
            const newLead = await sql`
              INSERT INTO sales_os.pipeline_leads (
                tenant_id, project_id, owner_se_email, owner_se_name, full_name, phone_wa,
                source, stage, unit_interest, lead_origin
              ) VALUES (
                ${user.tenantId}, ${projectId}, ${user.email}, ${user.name},
                ${referredFriendName}, ${normalizedPhone},
                ${`Referral: ${advocateName}`}, 'NEW', ${String(body.unitInterest || 'Unit Pilihan')}, 'REFERRAL'
              )
              RETURNING id
            `;
            if (newLead[0]) linkedLeadId = String(newLead[0].id);
          }
        }
      }

      const inserted = await sql`
        INSERT INTO sales_os.referral_leads (
          tenant_id, project_id, lead_id, advocate_name, advocate_phone, advocate_type,
          referred_friend_name, referred_friend_phone, unit_interest, reward_amount, partner_role
        ) VALUES (
          ${user.tenantId}, ${projectId}, ${linkedLeadId}::uuid, ${advocateName},
          ${String(body.advocatePhone || '')}, ${String(body.advocateType || 'KONSUMEN_PEMILIK')},
          ${referredFriendName}, ${referredFriendPhone}, ${String(body.unitInterest || '')},
          ${Number(body.rewardAmount || 5000000)}, ${String(body.partnerRole || 'REFERRAL_PARTNER')}
        )
        RETURNING *
      `;
      sendJson(res, 201, { ok: true, referral: inserted[0] });
      return;
    }

    if (pathname === '/api/referrals' && req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID referral wajib diisi.' });
        return;
      }
      const nextStatus = body.status ? String(body.status) : null;
      const nextRewardStatus = body.rewardStatus ? String(body.rewardStatus) : null;
      const advocateName = body.advocateName ? String(body.advocateName).trim() : null;
      const advocatePhone = body.advocatePhone !== undefined ? String(body.advocatePhone).trim() : null;
      const advocateType = body.advocateType ? String(body.advocateType).trim() : null;
      const referredFriendName = body.referredFriendName ? String(body.referredFriendName).trim() : null;
      const referredFriendPhone = body.referredFriendPhone !== undefined ? String(body.referredFriendPhone).trim() : null;
      const unitInterest = body.unitInterest !== undefined ? String(body.unitInterest).trim() : null;
      const rewardAmount = body.rewardAmount !== undefined ? Number(body.rewardAmount) : null;
      const partnerRole = body.partnerRole ? String(body.partnerRole).trim() : null;
      const updated = await sql`
        UPDATE sales_os.referral_leads
        SET
          status = COALESCE(${nextStatus}, status),
          reward_status = COALESCE(${nextRewardStatus}, reward_status),
          advocate_name = COALESCE(${advocateName}, advocate_name),
          advocate_phone = COALESCE(${advocatePhone}, advocate_phone),
          advocate_type = COALESCE(${advocateType}, advocate_type),
          referred_friend_name = COALESCE(${referredFriendName}, referred_friend_name),
          referred_friend_phone = COALESCE(${referredFriendPhone}, referred_friend_phone),
          unit_interest = COALESCE(${unitInterest}, unit_interest),
          reward_amount = COALESCE(${rewardAmount}, reward_amount),
          partner_role = COALESCE(${partnerRole}, partner_role),
          updated_at = NOW()
        WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId}
        RETURNING *
      `;
      if (updated.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Referral tidak ditemukan.' });
        return;
      }
      sendJson(res, 200, { ok: true, referral: updated[0] });
      return;
    }

    if (pathname === '/api/referrals' && req.method === 'DELETE') {
      const id = String(parsedUrl.searchParams.get('id') || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID referral wajib diisi.' });
        return;
      }
      const deleted = await sql`
        DELETE FROM sales_os.referral_leads
        WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId}
        RETURNING id
      `;
      if (deleted.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Referral tidak ditemukan.' });
        return;
      }
      sendJson(res, 200, { ok: true, id });
      return;
    }

    if (pathname === '/api/billing/aic/ledger' && req.method === 'GET') {
      const limit = Number(parsedUrl.searchParams.get('limit') || 50);
      const data = await getAicLedgerForTenant(user.tenantId, limit);
      sendJson(res, 200, { ok: true, ...data });
      return;
    }

    if (pathname === '/api/billing/aic/reserve' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await reserveAicAtomic({
        tenantId: user.tenantId,
        billableEventId: String(body.billableEventId || ''),
        featureId: String(body.featureId || 'GENERAL'),
        amountAic: Number(body.amountAic || 0),
        actorEmail: user.email,
        actorRole: user.role,
        reason: typeof body.reason === 'string' ? body.reason : undefined,
      });
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/billing/aic/settle' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await settleAicAtomic({
        tenantId: user.tenantId,
        billableEventId: String(body.billableEventId || ''),
        actorEmail: user.email,
      });
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/billing/aic/refund' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await refundAicAtomic({
        tenantId: user.tenantId,
        billableEventId: String(body.billableEventId || ''),
        actorEmail: user.email,
        reason: typeof body.reason === 'string' ? body.reason : undefined,
      });
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/billing/aic/topup' && req.method === 'POST') {
      if (user.role !== 'SUPERADMIN' && user.role !== 'SUPERADMIN_IT' && user.role !== 'DIREKSI') {
        sendJson(res, 403, { ok: false, error: 'Hanya Direksi/Superadmin yang berhak top-up AIC.' });
        return;
      }
      const body = await readJsonBody(req);
      const expiresAt = body.expiresAt
        ? String(body.expiresAt)
        : new Date(Date.now() + 90 * 86400000).toISOString();
      const result = await grantTopupLotAtomic({
        tenantId: user.tenantId,
        billableEventId: String(body.billableEventId || `topup_${Date.now()}`),
        lotCode: String(body.lotCode || 'TOPUP_90D'),
        amountAic: Number(body.amountAic || 0),
        expiresAt,
        actorEmail: user.email,
        actorRole: user.role,
      });
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/audit/events' && req.method === 'GET') {
      if (user.role !== 'SUPERADMIN' && user.role !== 'SUPERADMIN_IT' && user.role !== 'DIREKSI' && user.role !== 'ADMIN') {
        sendJson(res, 403, { ok: false, error: 'Akses audit log dibatasi untuk Admin/Direksi/Superadmin.' });
        return;
      }
      const limit = Number(parsedUrl.searchParams.get('limit') || 50);
      const events = await getAuditLogsForTenant(user.tenantId, limit);
      sendJson(res, 200, { ok: true, events });
      return;
    }

    if (pathname === '/api/approvals' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const approval = await createApprovalRequest({
        tenantId: user.tenantId,
        approvalType: String(body.approvalType || 'GENERAL'),
        resourceType: String(body.resourceType || 'RESOURCE'),
        resourceId: String(body.resourceId || ''),
        payload: (body.payload && typeof body.payload === 'object' ? body.payload : {}) as Record<string, unknown>,
        requestedBy: user.email,
        requiresDual: Boolean(body.requiresDual),
        ttlHours: body.ttlHours !== undefined ? Number(body.ttlHours) : undefined,
      });
      sendJson(res, 201, { ok: true, approval });
      return;
    }

    if (pathname === '/api/approvals/approve' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await approveServerRequest({
        tenantId: user.tenantId,
        approvalId: String(body.approvalId || ''),
        approverEmail: user.email,
        approverRole: String(user.role || 'USER'),
      });
      sendJson(res, result.ok ? 200 : 400, result);
      return;
    }

    if (pathname === '/api/outbox/enqueue' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await enqueueDurableOutbox({
        tenantId: user.tenantId,
        idempotencyKey: String(body.idempotencyKey || ''),
        jobType: String(body.jobType || 'GENERIC'),
        payload: (body.payload && typeof body.payload === 'object' ? body.payload : {}) as Record<string, unknown>,
        maxAttempts: body.maxAttempts !== undefined ? Number(body.maxAttempts) : undefined,
      });
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/truth/propagate-stale' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || 'the-park-sukoharjo');
      const reason = String(body.reason || 'Pembaruan data proyek');
      const result = await propagateStaleAssets({
        tenantId: user.tenantId,
        projectId,
        triggerSource: String(body.triggerSource || 'MANUAL'),
        reason,
        actorEmail: user.email,
        assetTypes: Array.isArray(body.assetTypes) ? body.assetTypes.map(String) : undefined,
      });
      const flaggedWorkspace = await propagateTruthChangeToWorkspaceAssets({
        tenantId: user.tenantId,
        projectId,
        reason,
        actorEmail: user.email,
      });
      sendJson(res, 200, { ok: true, ...result, flaggedWorkspaceCount: flaggedWorkspace.length });
      return;
    }

    if (pathname === '/api/faq/grounded' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await answerFaqGrounded({
        question: String(body.question || ''),
        projectId: body.projectId ? String(body.projectId) : undefined,
      });
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/appointments' && req.method === 'GET') {
      const seEmail = parsedUrl.searchParams.get('seEmail');
      const rows = seEmail
        ? await sql`
            SELECT * FROM sales_os.appointments
            WHERE tenant_id = ${user.tenantId} AND LOWER(se_email) = LOWER(${seEmail})
            ORDER BY scheduled_start ASC
            LIMIT 100
          `
        : await sql`
            SELECT * FROM sales_os.appointments
            WHERE tenant_id = ${user.tenantId}
            ORDER BY scheduled_start ASC
            LIMIT 100
          `;
      sendJson(res, 200, { ok: true, appointments: rows });
      return;
    }

    if (pathname === '/api/appointments' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await createAppointmentAtomic({
        tenantId: user.tenantId,
        projectId: String(body.projectId || 'the-park-sukoharjo'),
        seEmail: String(body.seEmail || user.email),
        leadId: body.leadId ? String(body.leadId) : undefined,
        customerName: String(body.customerName || ''),
        customerPhone: body.customerPhone ? String(body.customerPhone) : undefined,
        scheduledStartIso: String(body.scheduledStartIso || ''),
        scheduledEndIso: String(body.scheduledEndIso || ''),
        notes: body.notes ? String(body.notes) : undefined,
        createdBy: user.email,
      });
      sendJson(res, result.ok ? 201 : 409, result);
      return;
    }

    if (pathname === '/api/offline-sync/push' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const items = Array.isArray(body.items) ? body.items : [];
      const result = await processOfflineSyncBatch({
        tenantId: user.tenantId,
        deviceId: String(body.deviceId || 'web-client'),
        actorEmail: user.email,
        items,
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (pathname === '/api/agents/dispatch' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await dispatchRegisteredAgent({
        tenantId: user.tenantId,
        agentId: String(body.agentId || ''),
        actorEmail: user.email,
        inputText: String(body.inputText || ''),
        externalUrl: body.externalUrl ? String(body.externalUrl) : undefined,
        outputJson: body.outputJson,
        requiredJsonKeys: Array.isArray(body.requiredJsonKeys) ? body.requiredJsonKeys.map(String) : undefined,
        allowedJsonKeys: Array.isArray(body.allowedJsonKeys) ? body.allowedJsonKeys.map(String) : undefined,
      });
      sendJson(res, result.ok ? 200 : 400, result);
      return;
    }

    if (pathname === '/api/billing/prorate-preview' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = calculatePlanProrationAndInvoice({
        currentMonthlyIdr: Number(body.currentMonthlyIdr || 0),
        targetMonthlyIdr: Number(body.targetMonthlyIdr || 0),
        daysRemaining: Number(body.daysRemaining || 0),
        totalCycleDays: Number(body.totalCycleDays || 30),
        remainingAic: Number(body.remainingAic || 0),
        monthlyAicQuota: Number(body.monthlyAicQuota || 0),
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (pathname === '/api/projects/poi-risk' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || 'the-park-sukoharjo');
      const rows = await sql`
        SELECT * FROM sales_os.project_poi_risks
        WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId}
        ORDER BY distance_meters ASC, created_at DESC
        LIMIT 100
      `;
      sendJson(res, 200, { ok: true, items: rows });
      return;
    }

    if (pathname === '/api/projects/poi-risk' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const row = await upsertProjectPoiRisk({
        tenantId: user.tenantId,
        projectId: String(body.projectId || 'the-park-sukoharjo'),
        category: String(body.category || 'AKSES'),
        title: String(body.title || ''),
        distanceMeters: Number(body.distanceMeters || 0),
        riskLevel: body.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | undefined,
        sourceCitation: body.sourceCitation ? String(body.sourceCitation) : undefined,
      });
      sendJson(res, 201, { ok: true, poiRisk: row });
      return;
    }

    if (pathname === '/api/claims/ledger' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || 'the-park-sukoharjo');
      const rows = await sql`
        SELECT * FROM sales_os.claim_ledger_entries
        WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId}
        ORDER BY created_at DESC
        LIMIT 100
      `;
      sendJson(res, 200, { ok: true, claims: rows });
      return;
    }

    if (pathname === '/api/claims/ledger' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const row = await createClaimLedgerEntry({
        tenantId: user.tenantId,
        projectId: String(body.projectId || 'the-park-sukoharjo'),
        claimText: String(body.claimText || ''),
        proofGrade: (body.proofGrade || 'B') as 'A' | 'B' | 'C' | 'D',
        sourceCitation: String(body.sourceCitation || 'Dokumen Proyek'),
        verifiedBy: user.email,
      });
      sendJson(res, 201, { ok: true, claim: row });
      return;
    }

    if (pathname === '/api/exports/comparison-pack' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const pack = buildComparisonExportPack({
        projectId: String(body.projectId || 'the-park-sukoharjo'),
        projectName: String(body.projectName || 'The Park Townhouse Sukoharjo'),
        buyerName: String(body.buyerName || 'Calon Pembeli'),
        unitOptions: Array.isArray(body.unitOptions) ? body.unitOptions : [],
      });
      sendJson(res, 200, { ok: true, ...pack });
      return;
    }

    if (pathname === '/api/cobroke/deals' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || 'the-park-sukoharjo');
      const rows = await sql`
        SELECT * FROM sales_os.cobroke_deals
        WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId}
        ORDER BY created_at DESC
        LIMIT 100
      `;
      sendJson(res, 200, { ok: true, deals: rows });
      return;
    }

    if (pathname === '/api/cobroke/deals' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const deal = await createCobrokeDeal({
        tenantId: user.tenantId,
        projectId: String(body.projectId || 'the-park-sukoharjo'),
        unitCode: String(body.unitCode || ''),
        brokerName: String(body.brokerName || ''),
        brokerPhone: body.brokerPhone ? String(body.brokerPhone) : undefined,
        dealValueIdr: Number(body.dealValueIdr || 0),
        commissionPercent: body.commissionPercent !== undefined ? Number(body.commissionPercent) : undefined,
        cobrokeSplitPercent: body.cobrokeSplitPercent !== undefined ? Number(body.cobrokeSplitPercent) : undefined,
        createdBy: user.email,
      });
      sendJson(res, 201, { ok: true, deal });
      return;
    }

    if (pathname === '/api/legal-holds/delete' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await deleteWithLegalHoldGuard({
        tenantId: user.tenantId,
        resourceType: String(body.resourceType || ''),
        resourceId: String(body.resourceId || ''),
        actorEmail: user.email,
      });
      sendJson(res, result.deleted ? 200 : 409, result);
      return;
    }

    if (pathname === '/api/knowledge/scoped-search' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || 'the-park-sukoharjo');
      const query = String(parsedUrl.searchParams.get('q') || '');
      const result = searchScopedKnowledgeIndex({ tenantId: user.tenantId, projectId, query });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (pathname === '/api/sm/daily-report' && req.method === 'GET') {
      if (!['SM', 'TL', 'ADMIN', 'DIREKSI', 'IT', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya role manajemen yang dapat mengakses Laporan Harian SM & Tim SE.' });
        return;
      }
      const todayWib = toWibDateStr(new Date());
      const rawStart = String(parsedUrl.searchParams.get('startDate') || parsedUrl.searchParams.get('date') || todayWib).slice(0, 10);
      const rawEnd = String(parsedUrl.searchParams.get('endDate') || rawStart).slice(0, 10);
      const [startDate, endDate] = rawStart <= rawEnd ? [rawStart, rawEnd] : [rawEnd, rawStart];

      const [seUsers, dailyNotes, fieldLogs, leadsInRange, smAuditLogs] = await Promise.all([
        sql`
          SELECT email, name, project_id, phone
          FROM sales_os.app_users
          WHERE tenant_id = ${user.tenantId}
            AND role = 'SE'
            AND is_active = TRUE
          ORDER BY name ASC
        `,
        sql`
          SELECT * FROM sales_os.se_daily_notes
          WHERE report_date >= ${startDate}::date
            AND report_date <= ${endDate}::date
        `,
        sql`
          SELECT se_email, se_name, log_type, title, location_label, lat, lng, created_at
          FROM sales_os.se_field_logs
          WHERE (created_at AT TIME ZONE 'Asia/Jakarta')::date >= ${startDate}::date
            AND (created_at AT TIME ZONE 'Asia/Jakarta')::date <= ${endDate}::date
          ORDER BY created_at ASC
        `,
        sql`
          SELECT owner_se_email, stage, bant_total, booking_fee_paid, last_activity_at, created_at
          FROM sales_os.pipeline_leads
          WHERE tenant_id = ${user.tenantId}
            AND COALESCE(validity_status, 'VALID') = 'VALID'
            AND (
              ((created_at AT TIME ZONE 'Asia/Jakarta')::date >= ${startDate}::date AND (created_at AT TIME ZONE 'Asia/Jakarta')::date <= ${endDate}::date)
              OR ((last_activity_at AT TIME ZONE 'Asia/Jakarta')::date >= ${startDate}::date AND (last_activity_at AT TIME ZONE 'Asia/Jakarta')::date <= ${endDate}::date)
            )
        `,
        sql`
          SELECT action, target_entity AS entity, target_id AS entity_id, summary, details, created_at
          FROM sales_os.activity_audit_logs
          WHERE tenant_id = ${user.tenantId}
            AND LOWER(actor_email) = LOWER(${user.email})
            AND (created_at AT TIME ZONE 'Asia/Jakarta')::date >= ${startDate}::date
            AND (created_at AT TIME ZONE 'Asia/Jakarta')::date <= ${endDate}::date
          ORDER BY created_at DESC
          LIMIT 100
        `,
      ]);

      const notesByEmail = new Map<string, any>();
      for (const n of dailyNotes) {
        const email = String(n.se_email || '').toLowerCase();
        const prev = notesByEmail.get(email) || {
          dial_count: 0,
          connected_call_count: 0,
          canvassing_contacts: 0,
          canvassing_brochures: 0,
          canvassing_leads: 0,
          posted_reels: 0,
          posted_wa_status: 0,
          posted_stories: 0,
          hambatan_list: [] as string[],
        };
        prev.dial_count += Number(n.dial_count || 0);
        prev.connected_call_count += Number(n.connected_call_count || 0);
        prev.canvassing_contacts += Number(n.canvassing_contacts || 0);
        prev.canvassing_brochures += Number(n.canvassing_brochures || 0);
        prev.canvassing_leads += Number(n.canvassing_leads || 0);
        prev.posted_reels += Number(n.posted_reels || 0);
        prev.posted_wa_status += Number(n.posted_wa_status || 0);
        prev.posted_stories += Number(n.posted_stories || 0);
        if (n.hambatan_bantuan && String(n.hambatan_bantuan).trim()) {
          prev.hambatan_list.push(String(n.hambatan_bantuan).trim());
        }
        notesByEmail.set(email, prev);
      }

      const seReports = seUsers.map((se: any) => {
        const email = String(se.email || '').toLowerCase();
        const note = notesByEmail.get(email) || { hambatan_list: [] };
        const myLogs = fieldLogs.filter((l: any) => String(l.se_email || '').toLowerCase() === email);
        const checkIn = myLogs.find((l: any) => l.log_type === 'CHECK_IN');
        const checkOut = [...myLogs].reverse().find((l: any) => l.log_type === 'CHECK_OUT');
        const gpsLogs = myLogs.filter((l: any) => l.log_type === 'GPS' || l.log_type === 'CHECK_IN');
        const callLogs = myLogs.filter((l: any) => l.log_type === 'CALL');
        const latestGps = gpsLogs[gpsLogs.length - 1];

        const myLeads = leadsInRange.filter((l: any) => String(l.owner_se_email || '').toLowerCase() === email);
        const newLeadsCount = myLeads.filter((l: any) => {
          if (!l.created_at) return false;
          const d = toWibDateStr(new Date(l.created_at));
          return d >= startDate && d <= endDate;
        }).length;
        const qualifiedCount = myLeads.filter((l: any) => Number(l.bant_total || 0) >= 7).length;
        const visitsCount = myLeads.filter((l: any) => String(l.stage || '').toUpperCase() === 'VISITED').length;
        const bookingsCount = myLeads.filter(
          (l: any) =>
            Boolean(l.booking_fee_paid) ||
            ['BOOKING', 'DP_KPR_PROCESS', 'PPJB_AKAD'].includes(String(l.stage || '').toUpperCase())
        ).length;

        const dialCount = Number(note.dial_count || 0) + callLogs.length;
        const connectedCallCount = Number(note.connected_call_count || 0);
        const canvassingContacts = Number(note.canvassing_contacts || 0);
        const contentPosted =
          Number(note.posted_reels || 0) +
          Number(note.posted_wa_status || 0) +
          Number(note.posted_stories || 0);

        return {
          seName: String(se.name || se.email),
          seEmail: email,
          projectId: String(se.project_id || ''),
          checkInAt: checkIn ? String(checkIn.created_at) : null,
          checkOutAt: checkOut ? String(checkOut.created_at) : null,
          gpsCount: gpsLogs.length,
          latestLocation: latestGps ? String(latestGps.location_label || '') : '',
          callCount: dialCount,
          connectedCallCount,
          canvassingContacts,
          canvassingBrochures: Number(note.canvassing_brochures || 0),
          canvassingLeads: Number(note.canvassing_leads || 0),
          contentPosted,
          leadsToday: newLeadsCount,
          qualifiedCount,
          visitsCount,
          bookingsCount,
          hambatanBantuan: Array.isArray(note.hambatan_list) ? note.hambatan_list.join(' | ') : '',
        };
      });

      const smOwnLogs = fieldLogs.filter((l: any) => String(l.se_email || '').toLowerCase() === user.email.toLowerCase());
      const teamTotals = {
        totalSe: seReports.length,
        checkedInCount: seReports.filter((r: any) => Boolean(r.checkInAt)).length,
        totalGpsLogs: seReports.reduce((acc: number, r: any) => acc + r.gpsCount, 0),
        totalCalls: seReports.reduce((acc: number, r: any) => acc + r.callCount, 0),
        totalCanvassing: seReports.reduce((acc: number, r: any) => acc + r.canvassingContacts, 0),
        totalContentPosted: seReports.reduce((acc: number, r: any) => acc + r.contentPosted, 0),
        totalLeadsToday: seReports.reduce((acc: number, r: any) => acc + r.leadsToday, 0),
        totalBookingsToday: seReports.reduce((acc: number, r: any) => acc + r.bookingsCount, 0),
      };

      sendJson(res, 200, {
        ok: true,
        startDate,
        endDate,
        date: startDate === endDate ? startDate : `${startDate} s.d. ${endDate}`,
        smSummary: {
          name: user.name,
          email: user.email,
          role: user.role,
          ownActivities: smAuditLogs,
          ownFieldLogs: smOwnLogs,
        },
        teamTotals,
        seReports,
      });
      return;
    }

    if (pathname === '/api/state' && req.method === 'GET') {
      const requestedTenant = String(parsedUrl.searchParams.get('tenantId') || '').trim();
      const tenantId =
        (user.role === 'SUPERADMIN' || user.role === 'SUPERADMIN_IT') && requestedTenant
          ? requestedTenant
          : user.tenantId;
      const projectId = String(parsedUrl.searchParams.get('projectId') || '__global__').trim() || '__global__';
      const stateKey = String(parsedUrl.searchParams.get('key') || '').trim();
      if (stateKey) {
        const rows = await sql`
          SELECT state_key, payload, updated_at
          FROM sales_os.app_state_kv
          WHERE tenant_id = ${tenantId} AND project_id = ${projectId} AND state_key = ${stateKey}
          LIMIT 1
        `;
        sendJson(res, 200, {
          ok: true,
          key: stateKey,
          projectId,
          payload: rows[0]?.payload ?? null,
          updatedAt: rows[0]?.updated_at ?? null,
        });
        return;
      }
      const rows = await sql`
        SELECT state_key, payload, updated_at
        FROM sales_os.app_state_kv
        WHERE tenant_id = ${tenantId} AND project_id = ${projectId}
        ORDER BY state_key ASC
      `;
      const items: Record<string, unknown> = {};
      for (const row of rows) {
        items[String(row.state_key)] = row.payload;
      }
      sendJson(res, 200, { ok: true, projectId, items });
      return;
    }

    if (pathname === '/api/state' && req.method === 'PUT') {
      const body = await readJsonBody(req);
      const requestedTenant = String(body.tenantId || '').trim();
      const tenantId =
        (user.role === 'SUPERADMIN' || user.role === 'SUPERADMIN_IT') && requestedTenant
          ? requestedTenant
          : user.tenantId;
      const projectId = String(body.projectId || '__global__').trim() || '__global__';
      const stateKey = String(body.key || '').trim();
      if (!stateKey) {
        sendJson(res, 400, { ok: false, error: 'key wajib diisi.' });
        return;
      }
      const payloadJson = JSON.stringify(body.payload ?? null);
      await sql`
        INSERT INTO sales_os.app_state_kv (tenant_id, project_id, state_key, payload, updated_by, updated_at)
        VALUES (${tenantId}, ${projectId}, ${stateKey}, ${payloadJson}::jsonb, ${user.email}, NOW())
        ON CONFLICT (tenant_id, project_id, state_key) DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      `;
      sendJson(res, 200, { ok: true, key: stateKey, projectId });
      return;
    }

    if (pathname === '/api/partner-config' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || user.projectId || 'the-park-sukoharjo');
      const rows = await sql`
        SELECT config_json FROM sales_os.partner_scheme_configs
        WHERE project_id = ${projectId} AND tenant_id = ${user.tenantId}
        LIMIT 1
      `;
      sendJson(res, 200, { ok: true, config: rows[0]?.config_json || null });
      return;
    }

    if (pathname === '/api/partner-config' && req.method === 'PUT') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo');
      await sql`
        INSERT INTO sales_os.partner_scheme_configs (project_id, tenant_id, config_json, updated_by, updated_at)
        VALUES (${projectId}, ${user.tenantId}, ${JSON.stringify(body.config || {})}::jsonb, ${user.email}, NOW())
        ON CONFLICT (project_id) DO UPDATE SET
          config_json = EXCLUDED.config_json,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      `;
      sendJson(res, 200, { ok: true });
      return;
    }

    // CREATOR DESK (AFILIATOR CLIPPER, LIVE, KOL + F104 + LEDGER KANTONG A/B)
    if (pathname === '/api/creators' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || user.projectId || 'the-park-sukoharjo');
      const rows = await sql`
        SELECT * FROM sales_os.creator_profiles
        WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId}
        ORDER BY created_at DESC
      `;
      sendJson(res, 200, { ok: true, creators: rows });
      return;
    }

    if (pathname === '/api/creators' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo');
      const fullName = String(body.fullName || '').trim();
      const roleType = String(body.roleType || 'AFILIATOR_CLIPPER').toUpperCase();
      const prefix = roleType === 'AFILIATOR_LIVE' ? 'AL' : roleType === 'AFILIATOR_KOL' ? 'AK' : 'AC';
      const creatorCode = String(body.creatorCode || `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`)
        .trim()
        .toUpperCase();
      if (!fullName) {
        sendJson(res, 400, { ok: false, error: 'Nama kreator wajib diisi.' });
        return;
      }
      const inserted = await sql`
        INSERT INTO sales_os.creator_profiles (
          tenant_id, project_id, creator_code, full_name, role_type,
          platform, social_handle, phone_wa, monthly_cap_idr
        ) VALUES (
          ${user.tenantId}, ${projectId}, ${creatorCode}, ${fullName}, ${roleType},
          ${String(body.platform || 'TikTok')}, ${String(body.socialHandle || '')},
          ${String(body.phoneWa || '')}, ${Number(body.monthlyCapIdr || 3000000)}
        )
        RETURNING *
      `;
      sendJson(res, 201, { ok: true, creator: inserted[0] });
      return;
    }

    if (pathname === '/api/creator-submissions' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || user.projectId || 'the-park-sukoharjo');
      const rows = await sql`
        SELECT * FROM sales_os.creator_content_metrics
        WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId}
        ORDER BY created_at DESC
        LIMIT 200
      `;
      sendJson(res, 200, { ok: true, submissions: rows });
      return;
    }

    if (pathname === '/api/creator-submissions' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo');
      const creatorCode = String(body.creatorCode || '').trim().toUpperCase();
      const contentCode = String(body.contentCode || `tpth-${Date.now().toString(36)}`).trim();
      const contentType = String(body.contentType || 'KLIP').toUpperCase() as ContentSubmissionType;
      const contentUrl = String(body.contentUrl || '').trim();
      if (!creatorCode || !contentUrl) {
        sendJson(res, 400, { ok: false, error: 'Kode kreator dan URL karya wajib diisi.' });
        return;
      }
      const inserted = await sql`
        INSERT INTO sales_os.creator_content_metrics (
          tenant_id, project_id, creator_code, content_code, content_type,
          platform, content_url, raw_views, verified_views, session_minutes, flat_fee_idr, audit_status
        ) VALUES (
          ${user.tenantId}, ${projectId}, ${creatorCode}, ${contentCode}, ${contentType},
          ${String(body.platform || 'TikTok')}, ${contentUrl},
          ${Number(body.rawViews || 0)}, ${Number(body.verifiedViews || 0)},
          ${Number(body.sessionMinutes || 0)}, ${Number(body.flatFeeIdr || 0)}, 'UNDER_REVIEW'
        )
        RETURNING *
      `;
      sendJson(res, 201, { ok: true, submission: inserted[0] });
      return;
    }

    if (pathname === '/api/creator-submissions' && req.method === 'PATCH') {
      if (!['SM', 'ADMIN', 'DIREKSI', 'IT', 'DIGITAL_MARKETING', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya SM/Admin/Marketing/Direksi yang dapat memverifikasi karya.' });
        return;
      }
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      const action = String(body.action || 'VERIFY').toUpperCase();
      const existingRows = await sql`
        SELECT * FROM sales_os.creator_content_metrics
        WHERE id = ${id} AND tenant_id = ${user.tenantId}
        LIMIT 1
      `;
      if (existingRows.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Pengajuan karya tidak ditemukan.' });
        return;
      }
      const row = existingRows[0];
      if (action === 'REJECT') {
        const updated = await sql`
          UPDATE sales_os.creator_content_metrics
          SET audit_status = 'REJECTED',
              audit_notes = ${String(body.auditNotes || 'Ditolak saat audit')},
              verified_by = ${user.email},
              verified_at = NOW(),
              updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
        sendJson(res, 200, { ok: true, submission: updated[0] });
        return;
      }

      const verifiedViews = body.verifiedViews !== undefined ? Number(body.verifiedViews) : Number(row.verified_views || row.raw_views || 0);
      const sessionMinutes = body.sessionMinutes !== undefined ? Number(body.sessionMinutes) : Number(row.session_minutes || 0);
      const flatFeeIdr = body.flatFeeIdr !== undefined ? Number(body.flatFeeIdr) : Number(row.flat_fee_idr || 0);
      const calc = calculateKantongAAmount({
        contentType: row.content_type as ContentSubmissionType,
        verifiedViews,
        sessionMinutes,
        flatFeeIdr,
      });
      const updated = await sql`
        UPDATE sales_os.creator_content_metrics
        SET verified_views = ${verifiedViews},
            session_minutes = ${sessionMinutes},
            flat_fee_idr = ${flatFeeIdr},
            audit_status = 'VERIFIED',
            audit_notes = ${String(body.auditNotes || calc.note)},
            gross_amount_idr = ${calc.grossIdr},
            capped_amount_idr = ${calc.cappedIdr},
            verified_by = ${user.email},
            verified_at = NOW(),
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      if (calc.cappedIdr > 0) {
        const { taxIdr, netIdr } = calculatePph21Estimate(calc.cappedIdr);
        await sql`
          INSERT INTO sales_os.creator_ledger_entries (
            tenant_id, project_id, creator_code, pocket, entry_type,
            reference_id, description, gross_amount_idr, tax_pph_idr, net_amount_idr, status
          ) VALUES (
            ${user.tenantId}, ${row.project_id}, ${row.creator_code}, 'A', ${calc.entryType},
            ${row.content_code}, ${`Verifikasi ${row.content_type} (${row.content_code})`},
            ${calc.cappedIdr}, ${taxIdr}, ${netIdr}, 'ACCRUED'
          )
        `;
      }
      sendJson(res, 200, { ok: true, submission: updated[0] });
      return;
    }

    if (pathname === '/api/creator-ledger' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || user.projectId || 'the-park-sukoharjo');
      const rows = await sql`
        SELECT * FROM sales_os.creator_ledger_entries
        WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId}
        ORDER BY created_at DESC
        LIMIT 300
      `;
      sendJson(res, 200, { ok: true, entries: rows });
      return;
    }

    if (pathname === '/api/creator-ledger' && req.method === 'PATCH') {
      if (!['SM', 'ADMIN', 'DIREKSI', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Admin/SM/Direksi yang dapat mengubah status ledger.' });
        return;
      }
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      const status = String(body.status || '').toUpperCase();
      const allowed = ['ESTIMATE', 'PENDING', 'ACCRUED', 'ON_HOLD', 'APPROVED', 'PAID', 'REVERSED'];
      if (!allowed.includes(status)) {
        sendJson(res, 400, { ok: false, error: 'Status ledger tidak valid.' });
        return;
      }
      const updated = await sql`
        UPDATE sales_os.creator_ledger_entries
        SET status = ${status},
            approved_by = ${['APPROVED', 'PAID'].includes(status) ? user.email : null},
            paid_at = ${status === 'PAID' ? sql`NOW()` : sql`paid_at`},
            updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${user.tenantId}
        RETURNING *
      `;
      sendJson(res, 200, { ok: true, entry: updated[0] || null });
      return;
    }

    // SMART LINKS (/c/:code) & TOUCH ATTRIBUTION (Tabel 20, 21, E8)
    if (pathname === '/api/smart-links' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || user.projectId || 'the-park-sukoharjo');
      const rows = await sql`
        SELECT * FROM sales_os.smart_links
        WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId}
        ORDER BY created_at DESC
        LIMIT 100
      `;
      sendJson(res, 200, { ok: true, links: rows });
      return;
    }

    if (pathname === '/api/smart-links' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo').trim();
      const creatorCode = String(body.creatorCode || 'ANDARA-MITRA').trim().toUpperCase().slice(0, 32);
      const contentCode = String(body.contentCode || '').trim().slice(0, 64);
      const personaCode = String(body.personaCode || 'keluarga').trim().slice(0, 40);
      const partnerRole = String(body.partnerRole || 'CREATOR').trim().toUpperCase().slice(0, 32);
      const rawShortCode = String(body.shortCode || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
      const shortCode = rawShortCode || `${creatorCode.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`;
      const defaultTarget = `/site/${encodeURIComponent(projectId)}?p=${encodeURIComponent(personaCode)}&k=${encodeURIComponent(creatorCode)}${contentCode ? `&c=${encodeURIComponent(contentCode)}` : ''}`;
      const targetUrl = String(body.targetUrl || defaultTarget).trim();

      if (!/^(\/|https?:\/\/)/i.test(targetUrl)) {
        sendJson(res, 400, { ok: false, error: 'URL tujuan harus diawali /, http://, atau https://' });
        return;
      }

      const inserted = await sql`
        INSERT INTO sales_os.smart_links (
          tenant_id, project_id, short_code, partner_role, creator_code, content_code, persona_code, target_url, created_by
        ) VALUES (
          ${user.tenantId}, ${projectId}, ${shortCode}, ${partnerRole}, ${creatorCode},
          ${contentCode || null}, ${personaCode || null}, ${targetUrl}, ${user.email}
        )
        ON CONFLICT (short_code) DO UPDATE SET
          target_url = EXCLUDED.target_url,
          content_code = EXCLUDED.content_code,
          persona_code = EXCLUDED.persona_code
        RETURNING *
      `;
      sendJson(res, 201, { ok: true, link: inserted[0] });
      return;
    }

    // DUMMY PAYMENT GATEWAY (INT-I12, F65, F67, F77)
    if (pathname === '/api/payments/invoices' && req.method === 'GET') {
      const invoiceType = String(parsedUrl.searchParams.get('type') || '').trim().toUpperCase();
      const rows = invoiceType
        ? await sql`
            SELECT * FROM sales_os.payment_invoices
            WHERE tenant_id = ${user.tenantId} AND invoice_type = ${invoiceType}
            ORDER BY created_at DESC
            LIMIT 50
          `
        : await sql`
            SELECT * FROM sales_os.payment_invoices
            WHERE tenant_id = ${user.tenantId}
            ORDER BY created_at DESC
            LIMIT 50
          `;
      sendJson(res, 200, { ok: true, invoices: rows });
      return;
    }

    if (pathname === '/api/payments/invoices' && req.method === 'POST') {
      if (!['SUPERADMIN_IT', 'SUPERADMIN', 'DIREKSI', 'SM', 'ADMIN', 'SE'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Role tidak diizinkan membuat invoice pembayaran.' });
        return;
      }
      const body = await readJsonBody(req);
      const invoiceType = (String(body.invoiceType || 'AIC_TOPUP').toUpperCase() === 'BOOKING_FEE'
        ? 'BOOKING_FEE'
        : 'AIC_TOPUP') as PaymentInvoiceType;
      const amountIdr = Number(body.amountIdr || 0);
      if (!Number.isFinite(amountIdr) || amountIdr < 1000) {
        sendJson(res, 400, { ok: false, error: 'Nominal invoice minimal Rp 1.000.' });
        return;
      }
      const inv = await paymentGateway.createInvoice({
        tenantId: user.tenantId,
        projectId: String(body.projectId || user.projectId || 'the-park-sukoharjo'),
        invoiceType,
        referenceCode: String(body.referenceCode || (invoiceType === 'AIC_TOPUP' ? 'AIC-TOPUP' : 'BOOKING-UNIT')),
        description: String(body.description || (invoiceType === 'AIC_TOPUP' ? 'Top-up Saldo AIC' : 'Booking Fee Unit')),
        amountIdr,
        aicAmount: Number(body.aicAmount || 0),
        unitCode: body.unitCode ? String(body.unitCode) : undefined,
        customerName: body.customerName ? String(body.customerName) : undefined,
        customerPhone: body.customerPhone ? String(body.customerPhone) : undefined,
        createdBy: user.email,
      });
      sendJson(res, 201, { ok: true, invoice: inv });
      return;
    }

    if (pathname === '/api/payments/dummy-settle' && req.method === 'POST') {
      if (!['SUPERADMIN_IT', 'SUPERADMIN', 'DIREKSI', 'SM', 'ADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya IT/Admin/SM/Direksi yang dapat mensimulasikan settlement.' });
        return;
      }
      const body = await readJsonBody(req);
      const invoiceNo = String(body.invoiceNo || '').trim();
      const targetStatus = String(body.targetStatus || 'PAID').toUpperCase() as 'PAID' | 'EXPIRED' | 'REFUNDED';
      if (!invoiceNo || !['PAID', 'EXPIRED', 'REFUNDED'].includes(targetStatus)) {
        sendJson(res, 400, { ok: false, error: 'invoiceNo dan targetStatus (PAID/EXPIRED/REFUNDED) wajib valid.' });
        return;
      }
      const settled = await paymentGateway.settleInvoice({
        tenantId: user.tenantId,
        invoiceNo,
        targetStatus,
        actorEmail: user.email,
      });
      sendJson(res, settled.ok ? 200 : 400, settled);
      return;
    }

    // F44: DEDUPLIKASI & MERGE LEAD GANDA (SM / ADMIN)
    if (pathname === '/api/leads/duplicates' && req.method === 'GET') {
      const rows = await sql`
        SELECT id, full_name, phone_wa, owner_se_name, owner_se_email, stage, unit_interest, created_at
        FROM sales_os.pipeline_leads
        WHERE tenant_id = ${user.tenantId} AND COALESCE(phone_wa, '') <> ''
        ORDER BY created_at DESC
        LIMIT 300
      `;
      const groups: Record<string, any[]> = {};
      for (const r of rows) {
        const norm = String(r.phone_wa).replace(/\D/g, '').replace(/^0/, '62');
        if (!norm) continue;
        groups[norm] = groups[norm] || [];
        groups[norm].push(r);
      }
      const duplicates = Object.entries(groups)
        .filter(([, list]) => list.length > 1)
        .map(([phoneKey, leads]) => ({ phoneKey, leads }));
      sendJson(res, 200, { ok: true, duplicates });
      return;
    }

    if (pathname === '/api/leads/merge' && req.method === 'POST') {
      if (!['SM', 'ADMIN', 'DIREKSI', 'IT', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya SM/Admin yang dapat menggabungkan lead ganda.' });
        return;
      }
      const body = await readJsonBody(req);
      const primaryId = String(body.primaryId || '').trim();
      const duplicateId = String(body.duplicateId || '').trim();
      if (!primaryId || !duplicateId || primaryId === duplicateId) {
        sendJson(res, 400, { ok: false, error: 'primaryId dan duplicateId harus berbeda dan valid.' });
        return;
      }
      await sql`
        UPDATE sales_os.pipeline_leads
        SET notes = COALESCE(notes, '') || ${` [Merged duplicate ${duplicateId} by ${user.email}]`},
            updated_at = NOW()
        WHERE id = ${primaryId} AND tenant_id = ${user.tenantId}
      `;
      await sql`
        DELETE FROM sales_os.pipeline_leads
        WHERE id = ${duplicateId} AND tenant_id = ${user.tenantId}
      `;
      await recordAuditLog({
        tenantId: user.tenantId,
        actorEmail: user.email,
        actorName: user.name,
        actorRole: user.role,
        action: 'UPDATE',
        targetEntity: 'LEAD',
        targetId: primaryId,
        summary: `${user.name} menggabungkan lead ganda ${duplicateId} ke ${primaryId}`,
      });
      sendJson(res, 200, { ok: true, primaryId, mergedOutId: duplicateId });
      return;
    }

    // GENERIC WORKSPACE CRUD (F08-F10, F16, F22/F24, F46, F58, F65, F71, F73, F76, F81-F83) + RANTAI GANDENGAN
    if (pathname === '/api/workspace-items' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || 'the-park-sukoharjo');
      const moduleKey = String(parsedUrl.searchParams.get('moduleKey') || '').trim();
      if (!moduleKey) {
        sendJson(res, 400, { ok: false, error: 'moduleKey wajib diisi.' });
        return;
      }
      const items = await listWorkspaceItems({ tenantId: user.tenantId, projectId, moduleKey });
      sendJson(res, 200, { ok: true, items });
      return;
    }

    if (pathname === '/api/workspace-items' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || 'the-park-sukoharjo');
      const moduleKey = String(body.moduleKey || '').trim();
      const title = String(body.title || '').trim();
      if (!moduleKey || !title) {
        sendJson(res, 400, { ok: false, error: 'moduleKey dan title wajib diisi.' });
        return;
      }
      const item = await createWorkspaceItem({
        tenantId: user.tenantId,
        projectId,
        moduleKey,
        title,
        status: body.status ? String(body.status) : undefined,
        refId: body.refId ? String(body.refId) : null,
        payload: body.payload && typeof body.payload === 'object' ? body.payload : {},
        createdBy: user.email,
      });
      sendJson(res, 201, { ok: true, item });
      return;
    }

    if (pathname === '/api/workspace-items' && req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'id wajib diisi.' });
        return;
      }
      const item = await updateWorkspaceItem({
        tenantId: user.tenantId,
        id,
        title: body.title !== undefined ? String(body.title) : undefined,
        status: body.status !== undefined ? String(body.status) : undefined,
        payload: body.payload && typeof body.payload === 'object' ? body.payload : undefined,
      });
      if (!item) {
        sendJson(res, 404, { ok: false, error: 'Item tidak ditemukan atau beda tenant.' });
        return;
      }
      sendJson(res, 200, { ok: true, item });
      return;
    }

    if (pathname === '/api/workspace-items' && req.method === 'DELETE') {
      const id = String(parsedUrl.searchParams.get('id') || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'id wajib diisi.' });
        return;
      }
      const deleted = await deleteWorkspaceItem({ tenantId: user.tenantId, id });
      sendJson(res, deleted ? 200 : 404, { ok: deleted });
      return;
    }

    if (pathname === '/api/couplings/dispute' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const creatorOrBrokerCode = String(body.creatorOrBrokerCode || '').trim().toUpperCase();
      const reason = String(body.reason || 'Klaim sengketa komisi').trim();
      if (!creatorOrBrokerCode) {
        sendJson(res, 400, { ok: false, error: 'creatorOrBrokerCode wajib diisi.' });
        return;
      }
      const resDispute = await createDisputeAndHoldCommission({
        tenantId: user.tenantId,
        projectId: String(body.projectId || 'the-park-sukoharjo'),
        creatorOrBrokerCode,
        reason,
        actorEmail: user.email,
      });
      sendJson(res, 201, { ok: true, ...resDispute });
      return;
    }

    if (pathname === '/api/couplings/event-rsvp' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const guestName = String(body.guestName || '').trim();
      const guestPhone = String(body.guestPhone || '').trim();
      if (!guestName || !guestPhone) {
        sendJson(res, 400, { ok: false, error: 'Nama & WhatsApp peserta wajib diisi.' });
        return;
      }
      const assignedSe = await pickNextRoundRobinSe({
        tenantId: user.tenantId,
        projectId: String(body.projectId || 'the-park-sukoharjo'),
        fallbackEmails: SE_EMAILS,
      });
      const rsvp = await registerEventRsvpToLead({
        tenantId: user.tenantId,
        projectId: String(body.projectId || 'the-park-sukoharjo'),
        eventId: String(body.eventId || 'open-house'),
        eventTitle: String(body.eventTitle || 'Open House Proyek'),
        guestName,
        guestPhone,
        assignedSe,
      });
      sendJson(res, 201, { ok: true, assignedSe, ...rsvp });
      return;
    }

    // KELUHAN & GARANSI DLP
    if (pathname === '/api/complaints' && req.method === 'GET') {
      const projectIdParam = String(parsedUrl.searchParams.get('projectId') || '').trim();
      const rows = await sql`
        SELECT * FROM sales_os.complaint_tickets
        WHERE tenant_id = ${user.tenantId}
          ${projectIdParam ? sql`AND project_id = ${projectIdParam}` : sql``}
        ORDER BY reported_at DESC
      `;
      sendJson(res, 200, { ok: true, tickets: rows });
      return;
    }

    if (pathname === '/api/complaints' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo').trim();
      const unitBlock = String(body.unitBlock || '').trim();
      const residentName = String(body.residentName || '').trim();
      const description = String(body.description || '').trim();
      if (!unitBlock || !residentName || !description) {
        sendJson(res, 400, { ok: false, error: 'Blok unit, nama penghuni, dan deskripsi keluhan wajib diisi.' });
        return;
      }
      const ticketNo = `DLP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      const inserted = await sql`
        INSERT INTO sales_os.complaint_tickets (
          tenant_id, project_id, ticket_no, unit_block, resident_name, resident_phone,
          category, description, dlp_expiry_date, sla_target_hours, technician_assigned, created_by
        ) VALUES (
          ${user.tenantId}, ${projectId}, ${ticketNo}, ${unitBlock}, ${residentName},
          ${String(body.residentPhone || '')}, ${String(body.category || 'KEBOCORAN_ATAP')},
          ${description}, ${String(body.dlpExpiryDate || 'Masa DLP Aktif')},
          ${Number(body.slaTargetHours || 24)}, ${body.technicianAssigned ? String(body.technicianAssigned) : null},
          ${user.email}
        )
        RETURNING *
      `;
      sendJson(res, 201, { ok: true, ticket: inserted[0] });
      return;
    }

    if (pathname === '/api/complaints' && req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const id = String(body.id || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID tiket wajib diisi.' });
        return;
      }
      const nextStatus = body.status ? String(body.status) : null;
      const tech = body.technicianAssigned !== undefined ? String(body.technicianAssigned) : null;
      const unitBlock = body.unitBlock ? String(body.unitBlock).trim() : null;
      const residentName = body.residentName ? String(body.residentName).trim() : null;
      const residentPhone = body.residentPhone !== undefined ? String(body.residentPhone).trim() : null;
      const category = body.category ? String(body.category).trim() : null;
      const description = body.description ? String(body.description).trim() : null;
      const dlpExpiryDate = body.dlpExpiryDate ? String(body.dlpExpiryDate).trim() : null;
      const slaTargetHours = body.slaTargetHours !== undefined ? Number(body.slaTargetHours) : null;
      const updated = await sql`
        UPDATE sales_os.complaint_tickets
        SET
          status = COALESCE(${nextStatus}, status),
          technician_assigned = COALESCE(${tech}, technician_assigned),
          unit_block = COALESCE(${unitBlock}, unit_block),
          resident_name = COALESCE(${residentName}, resident_name),
          resident_phone = COALESCE(${residentPhone}, resident_phone),
          category = COALESCE(${category}, category),
          description = COALESCE(${description}, description),
          dlp_expiry_date = COALESCE(${dlpExpiryDate}, dlp_expiry_date),
          sla_target_hours = COALESCE(${slaTargetHours}, sla_target_hours),
          updated_at = NOW()
        WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId}
        RETURNING *
      `;
      if (updated.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Tiket tidak ditemukan.' });
        return;
      }
      sendJson(res, 200, { ok: true, ticket: updated[0] });
      return;
    }

    if (pathname === '/api/complaints' && req.method === 'DELETE') {
      const id = String(parsedUrl.searchParams.get('id') || '').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID tiket wajib diisi.' });
        return;
      }
      const deleted = await sql`
        DELETE FROM sales_os.complaint_tickets
        WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId}
        RETURNING id
      `;
      if (deleted.length === 0) {
        sendJson(res, 404, { ok: false, error: 'Tiket tidak ditemukan.' });
        return;
      }
      sendJson(res, 200, { ok: true, id });
      return;
    }

    // DIGITAL MARKETING CAMPAIGNS
    if (pathname === '/api/marketing/campaigns' && req.method === 'GET') {
      const projectIdParam = String(parsedUrl.searchParams.get('projectId') || '').trim();
      const rows = await sql`
        SELECT * FROM sales_os.ad_campaigns
        WHERE tenant_id = ${user.tenantId}
          ${projectIdParam ? sql`AND project_id = ${projectIdParam}` : sql``}
        ORDER BY created_at DESC
      `;
      sendJson(res, 200, { ok: true, campaigns: rows });
      return;
    }

    if (pathname === '/api/marketing/campaigns' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo').trim();
      const campaignName = String(body.campaignName || '').trim();
      if (!campaignName) {
        sendJson(res, 400, { ok: false, error: 'Nama kampanye wajib diisi.' });
        return;
      }
      const inserted = await sql`
        INSERT INTO sales_os.ad_campaigns (
          tenant_id, project_id, platform, campaign_name, spend_idr, leads_count, qualified_count, status
        ) VALUES (
          ${user.tenantId}, ${projectId}, ${String(body.platform || 'Meta Ads')},
          ${campaignName}, ${Number(body.spendIdr || 0)}, ${Number(body.leadsCount || 0)},
          ${Number(body.qualifiedCount || 0)}, ${String(body.status || 'AKTIF')}
        )
        RETURNING *
      `;
      sendJson(res, 201, { ok: true, campaign: inserted[0] });
      return;
    }

    // PROJECT MODULE SETTINGS
    if (pathname === '/api/project-settings' && req.method === 'GET') {
      const projectId = String(parsedUrl.searchParams.get('projectId') || user.projectId || 'the-park-sukoharjo');
      const moduleKey = String(parsedUrl.searchParams.get('moduleKey') || '').trim();
      if (!moduleKey) {
        sendJson(res, 400, { ok: false, error: 'moduleKey wajib diisi.' });
        return;
      }
      const rows = await sql`
        SELECT payload, updated_at FROM sales_os.project_module_configs
        WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId} AND module_key = ${moduleKey}
        LIMIT 1
      `;
      sendJson(res, 200, { ok: true, payload: rows[0]?.payload || null, updatedAt: rows[0]?.updated_at || null });
      return;
    }

    if (pathname === '/api/project-settings' && req.method === 'PUT') {
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo');
      const moduleKey = String(body.moduleKey || '').trim();
      if (!moduleKey) {
        sendJson(res, 400, { ok: false, error: 'moduleKey wajib diisi.' });
        return;
      }
      await sql`
        INSERT INTO sales_os.project_module_configs (tenant_id, project_id, module_key, payload, updated_by, updated_at)
        VALUES (${user.tenantId}, ${projectId}, ${moduleKey}, ${JSON.stringify(body.payload || {})}::jsonb, ${user.email}, NOW())
        ON CONFLICT (tenant_id, project_id, module_key) DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      `;
      sendJson(res, 200, { ok: true });
      return;
    }

    // IT PLAN OVERRIDE (GOLD / PLATINUM / DIAMOND) - DB ASLI
    if (pathname === '/api/it/plan-overrides' && req.method === 'GET') {
      const rows =
        user.role === 'SUPERADMIN_IT' || user.role === 'SUPERADMIN'
          ? await sql`SELECT * FROM sales_os.developer_plan_overrides ORDER BY updated_at DESC`
          : await sql`
              SELECT * FROM sales_os.developer_plan_overrides
              WHERE tenant_id = ${user.tenantId}
              ORDER BY updated_at DESC
            `;
      sendJson(res, 200, { ok: true, overrides: rows });
      return;
    }

    if (pathname === '/api/it/plan-overrides' && req.method === 'PUT') {
      if (!['SUPERADMIN_IT', 'SUPERADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Tim IT Internal (SUPERADMIN_IT) / Superadmin yang dapat mengubah override paket.' });
        return;
      }
      const body = await readJsonBody(req);
      const developerId = String(body.developerId || '').trim();
      const overriddenPlan = String(body.overriddenPlan || '').trim();
      if (!developerId || !['Gold', 'Platinum', 'Diamond'].includes(overriddenPlan)) {
        sendJson(res, 400, { ok: false, error: 'developerId dan overriddenPlan (Gold/Platinum/Diamond) wajib valid.' });
        return;
      }
      const companyName = String(body.companyName || '').trim();
      const originalPlan = String(body.originalPlan || 'Platinum').trim();
      const reason = String(body.reason || 'Override paket oleh IT').trim();
      const validUntil = String(body.validUntil || '30 Hari').trim();
      const tenantId = String(body.tenantId || user.tenantId || 'andara_rejo_makmur').trim();
      const overriddenBy = String(body.overriddenBy || `${user.name} (${user.role})`).trim();

      const saved = await sql`
        INSERT INTO sales_os.developer_plan_overrides (
          developer_id, tenant_id, company_name, original_plan, overridden_plan,
          overridden_by, reason, valid_until, overridden_at, updated_at
        ) VALUES (
          ${developerId}, ${tenantId}, ${companyName}, ${originalPlan}, ${overriddenPlan},
          ${overriddenBy}, ${reason}, ${validUntil}, NOW(), NOW()
        )
        ON CONFLICT (developer_id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          original_plan = EXCLUDED.original_plan,
          overridden_plan = EXCLUDED.overridden_plan,
          overridden_by = EXCLUDED.overridden_by,
          reason = EXCLUDED.reason,
          valid_until = EXCLUDED.valid_until,
          overridden_at = NOW(),
          updated_at = NOW()
        RETURNING *
      `;
      sendJson(res, 200, { ok: true, override: saved[0] });
      return;
    }

    if (pathname === '/api/it/plan-overrides' && req.method === 'DELETE') {
      if (!['SUPERADMIN_IT', 'SUPERADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Tim IT Internal (SUPERADMIN_IT) / Superadmin yang dapat mereset override paket.' });
        return;
      }
      const developerId = String(parsedUrl.searchParams.get('developerId') || '').trim();
      if (!developerId) {
        sendJson(res, 400, { ok: false, error: 'developerId wajib diisi.' });
        return;
      }
      await sql`DELETE FROM sales_os.developer_plan_overrides WHERE developer_id = ${developerId}`;
      sendJson(res, 200, { ok: true, developerId });
      return;
    }

    // IT KNOWLEDGE AI TERPUSAT (1 SUMBER DATA + OCR LOKAL)
    if (pathname === '/api/it/knowledge-ai' && req.method === 'GET') {
      if (!['IT', 'SUPERADMIN_IT', 'SUPERADMIN', 'ADMIN', 'SM', 'DIREKSI'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Akses Knowledge AI hanya untuk Divisi IT & Manajemen.' });
        return;
      }
      const projectId = String(parsedUrl.searchParams.get('projectId') || user.projectId || 'the-park-sukoharjo').trim();
      const [central, docs, conflicts] = await Promise.all([
        getCentralAiKnowledge(user.tenantId, projectId),
        sql`
          SELECT id, project_id, doc_type, filename, version, status, extracted_markdown, uploaded_by, created_at
          FROM sales_os.source_documents
          WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId}
          ORDER BY created_at DESC
          LIMIT 50
        `,
        sql`
          SELECT * FROM sales_os.truth_conflicts
          WHERE tenant_id = ${user.tenantId} AND project_id = ${projectId}
          ORDER BY CASE WHEN status = 'open' THEN 0 ELSE 1 END, created_at DESC
          LIMIT 30
        `,
      ]);
      sendJson(res, 200, { ok: true, central, documents: docs, conflicts });
      return;
    }

    if (pathname === '/api/it/knowledge-ai/upload' && req.method === 'POST') {
      if (!['IT', 'SUPERADMIN_IT', 'SUPERADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Divisi IT yang dapat mengunggah & melatih Knowledge AI.' });
        return;
      }
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo').trim();
      const filename = String(body.filename || '').trim();
      const contentBase64 = String(body.contentBase64 || '').trim();
      if (!filename || !contentBase64) {
        sendJson(res, 400, { ok: false, error: 'filename dan contentBase64 wajib diisi.' });
        return;
      }
      const cleanB64 = contentBase64.includes(',') ? contentBase64.split(',')[1] : contentBase64;
      const fileBuffer = Buffer.from(cleanB64, 'base64');
      if (fileBuffer.length === 0 || fileBuffer.length > 20 * 1024 * 1024) {
        sendJson(res, 400, { ok: false, error: 'Ukuran file harus > 0 dan maksimal 20 MB.' });
        return;
      }
      const result = await ingestSourceDocument({
        tenantId: user.tenantId,
        projectId,
        docType: String(body.docType || 'brosur_pdf'),
        filename,
        fileBuffer,
        uploadedBy: user.email,
      });
      if (!result.ok) {
        sendJson(res, 422, { ok: false, error: result.error });
        return;
      }
      const central = await rebuildCentralKnowledgeFromDocs(user.tenantId, projectId, user.email);
      sendJson(res, 201, { ...result, central });
      return;
    }

    if (pathname === '/api/it/knowledge-ai' && req.method === 'PUT') {
      if (!['IT', 'SUPERADMIN_IT', 'SUPERADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Divisi IT yang dapat memperbarui Master Knowledge AI.' });
        return;
      }
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo').trim();
      const masterMarkdown = String(body.masterMarkdown || '');
      const title = body.title ? String(body.title) : undefined;
      const saved = await saveCentralAiKnowledge({
        tenantId: user.tenantId,
        projectId,
        title,
        masterMarkdown,
        updatedBy: user.email,
      });
      sendJson(res, 200, { ok: true, central: saved });
      return;
    }

    if (pathname === '/api/it/knowledge-ai/rebuild' && req.method === 'POST') {
      if (!['IT', 'SUPERADMIN_IT', 'SUPERADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Divisi IT yang dapat merebuild Master Knowledge AI.' });
        return;
      }
      const body = await readJsonBody(req);
      const projectId = String(body.projectId || user.projectId || 'the-park-sukoharjo').trim();
      const central = await rebuildCentralKnowledgeFromDocs(user.tenantId, projectId, user.email);
      sendJson(res, 200, { ok: true, central });
      return;
    }

    if (pathname === '/api/it/knowledge-ai/document' && req.method === 'DELETE') {
      if (!['IT', 'SUPERADMIN_IT', 'SUPERADMIN'].includes(user.role)) {
        sendJson(res, 403, { ok: false, error: 'Hanya Divisi IT yang dapat menghapus dokumen Knowledge AI.' });
        return;
      }
      const id = String(parsedUrl.searchParams.get('id') || '').trim();
      const projectId = String(parsedUrl.searchParams.get('projectId') || user.projectId || 'the-park-sukoharjo').trim();
      if (!id) {
        sendJson(res, 400, { ok: false, error: 'ID dokumen wajib diisi.' });
        return;
      }
      await sql`
        DELETE FROM sales_os.source_documents
        WHERE id = ${id}::uuid AND tenant_id = ${user.tenantId}
      `;
      const central = await rebuildCentralKnowledgeFromDocs(user.tenantId, projectId, user.email);
      sendJson(res, 200, { ok: true, central });
      return;
    }

    sendJson(res, 404, { ok: false, error: `Endpoint tidak ditemukan: ${pathname}` });
  } catch (err: unknown) {
    if (err instanceof CrossTenantViolationError) {
      sendJson(res, 403, { ok: false, error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan internal server.';
    sendJson(res, 500, { ok: false, error: message });
  }
});

async function ensureSeOpsTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.se_field_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      se_email TEXT NOT NULL,
      se_name TEXT NOT NULL,
      log_type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      location_label TEXT NOT NULL DEFAULT '',
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      photo_data_url TEXT,
      duration_seconds INTEGER,
      outcome TEXT,
      notes TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.se_custom_routes (
      se_email TEXT NOT NULL,
      day_name TEXT NOT NULL,
      waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (se_email, day_name)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.se_content_slots (
      se_email TEXT NOT NULL,
      slot_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SIAP_POSTING',
      posted_url TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (se_email, slot_id)
    )
  `;
  await sql`
    ALTER TABLE sales_os.se_content_slots
      ADD COLUMN IF NOT EXISTS day_number INTEGER,
      ADD COLUMN IF NOT EXISTS slot_order INTEGER,
      ADD COLUMN IF NOT EXISTS scheduled_time TEXT,
      ADD COLUMN IF NOT EXISTS funnel_stage TEXT,
      ADD COLUMN IF NOT EXISTS platform TEXT,
      ADD COLUMN IF NOT EXISTS format TEXT,
      ADD COLUMN IF NOT EXISTS title TEXT,
      ADD COLUMN IF NOT EXISTS brief TEXT,
      ADD COLUMN IF NOT EXISTS visual_prompt TEXT,
      ADD COLUMN IF NOT EXISTS caption TEXT,
      ADD COLUMN IF NOT EXISTS hashtags JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS cta TEXT,
      ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS media_status TEXT DEFAULT 'SCHEDULED',
      ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS media_error TEXT,
      ADD COLUMN IF NOT EXISTS target_media_count INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS hermes_job_ids JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS persona_code TEXT,
      ADD COLUMN IF NOT EXISTS slide_deck JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS report_date DATE,
      ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.se_social_accounts (
      id SERIAL PRIMARY KEY,
      se_email TEXT NOT NULL,
      platform TEXT NOT NULL,
      zernio_key_index INTEGER NOT NULL DEFAULT 0,
      zernio_profile_id TEXT,
      zernio_account_id TEXT NOT NULL,
      account_username TEXT,
      status TEXT NOT NULL DEFAULT 'CONNECTED',
      connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (se_email, platform)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.media_render_queue (
      id SERIAL PRIMARY KEY,
      se_email TEXT NOT NULL,
      slot_id TEXT NOT NULL,
      slide_index INTEGER NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'image',
      aspect_ratio TEXT NOT NULL DEFAULT '3:4',
      prompt TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 20,
      status TEXT NOT NULL DEFAULT 'PENDING',
      hermes_job_id TEXT,
      local_url TEXT,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      finished_at TIMESTAMPTZ
    )
  `;
  await sql`
    ALTER TABLE sales_os.media_render_queue
      ADD COLUMN IF NOT EXISTS render_meta JSONB
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.wa_conversation_turns (
      id BIGSERIAL PRIMARY KEY,
      se_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('customer', 'sales')),
      encrypted_text TEXT NOT NULL,
      draft_similarity REAL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_wa_turns_contact ON sales_os.wa_conversation_turns (se_email, contact_phone, sent_at DESC)`;
  await sql`
    ALTER TABLE sales_os.lead_ai_analyses
      ADD COLUMN IF NOT EXISTS reply_mode TEXT,
      ADD COLUMN IF NOT EXISTS reply_reason TEXT
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.activity_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_email TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_entity TEXT NOT NULL,
      target_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.company_bank_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_holder TEXT NOT NULL,
      branch TEXT NOT NULL DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_primary BOOLEAN NOT NULL DEFAULT false,
      project_id TEXT NOT NULL DEFAULT 'all',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.wa_suppression_list (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone_number TEXT NOT NULL UNIQUE,
      lead_id TEXT,
      lead_name TEXT,
      reason TEXT NOT NULL DEFAULT 'USER_OPT_OUT',
      opted_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notes TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.tenant_aic_wallets (
      tenant_id TEXT PRIMARY KEY,
      plan_code TEXT NOT NULL DEFAULT 'platinum',
      total_aic_granted INTEGER NOT NULL DEFAULT 5000,
      balance_aic INTEGER NOT NULL DEFAULT 5000,
      reserved_aic INTEGER NOT NULL DEFAULT 0,
      valid_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 months'),
      is_throttled BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO sales_os.tenant_aic_wallets (tenant_id, plan_code, total_aic_granted, balance_aic)
    VALUES ('andara_rejo_makmur', 'platinum', 5000, 5000)
    ON CONFLICT (tenant_id) DO NOTHING
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.aic_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      feature_id TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      amount_aic INTEGER NOT NULL,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      balance_after INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      reference_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE sales_os.activity_audit_logs
      ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur'
  `;
  await sql`
    ALTER TABLE sales_os.company_bank_accounts
      ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur'
  `;
  await sql`
    ALTER TABLE sales_os.wa_suppression_list
      ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur'
  `;
  await ensureAuthTablesAndSeeds();
  await ensureUnitInventoryTablesAndSeeds();
  await ensureTruthTables();
  await ensureNurtureTablesAndSeeds();
  await sql`
    ALTER TABLE sales_os.pipeline_leads
      ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
      ADD COLUMN IF NOT EXISTS wa_consent TEXT NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS wa_consent_updated_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS lead_quality TEXT NOT NULL DEFAULT 'WARM',
      ADD COLUMN IF NOT EXISTS spam_reason TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS is_in_pool BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS pool_reason TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW()
  `;
  await ensurePermissionTables();
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.payment_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
      invoice_no TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL DEFAULT 'SANDBOX_DUMMY_PG',
      invoice_type TEXT NOT NULL CHECK (invoice_type IN ('AIC_TOPUP', 'BOOKING_FEE')),
      reference_code TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      amount_idr BIGINT NOT NULL CHECK (amount_idr > 0),
      aic_amount INTEGER NOT NULL DEFAULT 0,
      unit_code TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'EXPIRED', 'REFUNDED')),
      checkout_url TEXT NOT NULL,
      paid_at TIMESTAMPTZ,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.smart_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      short_code TEXT NOT NULL UNIQUE,
      partner_role TEXT NOT NULL DEFAULT 'CREATOR',
      creator_code TEXT NOT NULL,
      content_code TEXT,
      persona_code TEXT,
      target_url TEXT NOT NULL,
      click_count INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.link_touches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      short_code TEXT NOT NULL,
      creator_code TEXT NOT NULL,
      content_code TEXT,
      touch_type TEXT NOT NULL DEFAULT 'CLICK',
      referrer TEXT,
      user_agent_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.developer_plan_overrides (
      developer_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
      company_name TEXT NOT NULL DEFAULT '',
      original_plan TEXT NOT NULL DEFAULT 'Platinum',
      overridden_plan TEXT NOT NULL CHECK (overridden_plan IN ('Gold', 'Platinum', 'Diamond')),
      overridden_by TEXT NOT NULL DEFAULT 'Tim IT Internal (SUPERADMIN_IT)',
      reason TEXT NOT NULL DEFAULT '',
      valid_until TEXT NOT NULL DEFAULT '30 Hari',
      overridden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.vault_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      lead_id UUID REFERENCES sales_os.pipeline_leads(id) ON DELETE SET NULL,
      owner_se_email TEXT NOT NULL,
      lead_name TEXT NOT NULL,
      unit_interest TEXT NOT NULL DEFAULT '',
      doc_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size TEXT NOT NULL DEFAULT '1.0 MB',
      status TEXT NOT NULL DEFAULT 'PERLU_REVIEW',
      reviewed_by TEXT,
      review_notes TEXT,
      access_granted_banks JSONB NOT NULL DEFAULT '[]'::jsonb,
      expires_at DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days')::date,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.bank_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      lead_id UUID REFERENCES sales_os.pipeline_leads(id) ON DELETE SET NULL,
      owner_se_email TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      applicant_phone TEXT NOT NULL DEFAULT '',
      unit_code TEXT NOT NULL,
      cluster TEXT NOT NULL DEFAULT '',
      target_bank TEXT NOT NULL DEFAULT 'Bank BSI',
      plafond_amount BIGINT NOT NULL DEFAULT 0,
      submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
      status TEXT NOT NULL DEFAULT 'SUBMITTED_TO_BANK',
      status_notes TEXT NOT NULL DEFAULT '',
      assigned_analyst TEXT,
      sp3k_expiry_date DATE,
      source_mode TEXT NOT NULL DEFAULT 'LEAD_SELECTED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.escalation_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      lead_id UUID REFERENCES sales_os.pipeline_leads(id) ON DELETE SET NULL,
      jenis TEXT NOT NULL,
      pembeli TEXT NOT NULL,
      unit TEXT NOT NULL,
      proyek TEXT NOT NULL,
      nilai TEXT NOT NULL,
      rekomendasi_ai TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Menunggu Review',
      requested_by TEXT NOT NULL,
      decided_by TEXT,
      decided_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.referral_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      lead_id UUID REFERENCES sales_os.pipeline_leads(id) ON DELETE SET NULL,
      advocate_name TEXT NOT NULL,
      advocate_phone TEXT NOT NULL DEFAULT '',
      advocate_type TEXT NOT NULL DEFAULT 'KONSUMEN_PEMILIK',
      referred_friend_name TEXT NOT NULL,
      referred_friend_phone TEXT NOT NULL DEFAULT '',
      unit_interest TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'TERDAFTAR',
      reward_amount BIGINT NOT NULL DEFAULT 5000000,
      reward_status TEXT NOT NULL DEFAULT 'PENDING_AKAD',
      partner_role TEXT NOT NULL DEFAULT 'REFERRAL_PARTNER',
      lead_response_minutes INTEGER,
      sla_breach BOOLEAN NOT NULL DEFAULT FALSE,
      registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.partner_scheme_configs (
      project_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      config_json JSONB NOT NULL,
      updated_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.complaint_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      ticket_no TEXT NOT NULL,
      unit_block TEXT NOT NULL,
      resident_name TEXT NOT NULL,
      resident_phone TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      dlp_expiry_date TEXT NOT NULL DEFAULT '',
      sla_target_hours INTEGER NOT NULL DEFAULT 24,
      status TEXT NOT NULL DEFAULT 'TIKET_BARU',
      technician_assigned TEXT,
      created_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.ad_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      campaign_name TEXT NOT NULL,
      spend_idr BIGINT NOT NULL DEFAULT 0,
      leads_count INTEGER NOT NULL DEFAULT 0,
      qualified_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'AKTIF',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.project_module_configs (
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      module_key TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (tenant_id, project_id, module_key)
    )
  `;
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Developer Sales OS API] Berjalan di http://127.0.0.1:${PORT}`);
  ensureSeOpsTables()
    .then(() => {
      startContentMediaScheduler();
      startNurtureScheduler();
    })
    .catch((err) => {
      console.error('[DB] Gagal memastikan tabel SE Ops:', err);
    });
  resumeActiveWaSessionsOnStartup().catch(() => {});
});
