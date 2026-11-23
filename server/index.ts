// ============================================================================
// DEVELOPER SALES OS - PRODUCTION API SERVER (PORT 3040)
// PostgreSQL sales_os + 9router AI Engine + WhatsApp Baileys Per-SE Isolation
// ============================================================================

import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { sql } from './db';
import { analyzeLeadWithAi } from './ai-engine';
import {
  MEDIA_OUTPUT_DIR,
  generateUniqueDaySlotsWithAi,
  generateWeekSlotsForSe,
  enqueueSlotMediaViaHermes,
  getHermesHealth,
  getWibClock,
  formatWibDateForDay,
  getBusyWindowInfo,
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

const PORT = Number(process.env.API_PORT || 3040);

function getAuthenticatedUser(req: http.IncomingMessage): {
  email: string;
  name: string;
  role: RoleKey;
} {
  const headerEmail = String(req.headers['x-user-email'] || '').trim().toLowerCase();
  const headerRole = String(req.headers['x-user-role'] || 'SE').trim().toUpperCase() as RoleKey;

  const matchedRole = (Object.keys(USERS_BY_ROLE) as RoleKey[]).find(
    (r) => USERS_BY_ROLE[r].email.toLowerCase() === headerEmail
  );

  const role: RoleKey = matchedRole || (headerRole in USERS_BY_ROLE ? headerRole : 'SE');
  const profile = USERS_BY_ROLE[role];
  return {
    email: headerEmail || profile.email.toLowerCase(),
    name: profile.name,
    role,
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

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization, X-User-Email, X-User-Role',
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

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const user = getAuthenticatedUser(req);

  try {
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

    // 2. DASHBOARD SE REAL DATA
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

    // 4. GET PIPELINE LEADS (Terisolasi ketat untuk SE yang login; TL/SM/DIREKSI dapat melihat tim)
    if (pathname === '/api/pipeline/leads' && req.method === 'GET') {
      const isWideRole = ['TL', 'SM', 'DIREKSI', 'ADMIN', 'IT'].includes(user.role);
      const leads = isWideRole
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
            WHERE l.owner_se_email = ${user.email}
            ORDER BY l.created_at DESC
          `;

      const enrichedLeads = leads.map((l: any) => ({
        ...l,
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

      // Jalankan Analisis AI (9router + Playbook v1.2 Dual-Track)
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
          owner_se_email, owner_se_name, full_name, phone_wa, domicile, source, content_code,
          stage, validity_status, persona_code, persona_profile,
          bant_b, bant_a, bant_n, bant_t, bant_total, grade,
          cluster_interest, unit_interest, unit_price_idr, payment_scheme,
          written_offer_sent, booking_fee_paid, dp_or_sp3k_verified, appointment_at, visited_at,
          sales_notes, next_action, lead_origin, last_customer_message, last_sales_message, interaction_count
        ) VALUES (
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
          ${1}
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

      // Jika data dilengkapi atau diminta reanalyze, jalankan AI lagi
      let validityStatus = String(prev.validity_status);
      let latestAnalysis = null;

      if (body.reanalyze || prev.validity_status === 'PERLU_DILENGKAPI' || body.salesNotes !== undefined || body.fullName !== undefined || body.domicile !== undefined) {
        const nextSource = String(body.source ?? prev.source);
        const resolvedOrigin =
          prev.lead_origin === 'WA_BAILEYS' || /whatsapp inbound|baileys/i.test(nextSource)
            ? 'WA_BAILEYS'
            : 'MANUAL';

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
          seName: String(prev.owner_se_name || user.name),
        });

        validityStatus =
          aiResult.clarity_status === 'PERLU_DILENGKAPI' ? 'PERLU_DILENGKAPI' : 'VALID';

        const insertedAnalysis = await sql`
          INSERT INTO sales_os.lead_ai_analyses (
            lead_id, owner_se_email, skor, label, clarity_status, unclear_parts, ringkas,
            poin_kuat, poin_lemah, perlu_dicek_ulang, rekomendasi, recommended_persona,
            recommended_bant, followup_draft_message, model, prompt_tokens, completion_tokens
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
        WHERE id = ${leadId}
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

      sendJson(res, 200, {
        ok: true,
        lead: { ...updatedRows[0], latest_analysis: latestAnalysis },
      });
      return;
    }

    // 7. DELETE LEAD
    if (patchMatch && req.method === 'DELETE') {
      const leadId = patchMatch[1];
      await sql`
        DELETE FROM sales_os.pipeline_leads
        WHERE id = ${leadId} AND owner_se_email = ${user.email}
      `;
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
      const busyWindow = getBusyWindowInfo(minutesOfDay);
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
      const { minutesOfDay } = getWibClock();
      const busyWindow = getBusyWindowInfo(minutesOfDay);
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

    sendJson(res, 404, { ok: false, error: `Endpoint tidak ditemukan: ${pathname}` });
  } catch (err: unknown) {
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
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Developer Sales OS API] Berjalan di http://127.0.0.1:${PORT}`);
  ensureSeOpsTables()
    .then(() => {
      startContentMediaScheduler();
    })
    .catch((err) => {
      console.error('[DB] Gagal memastikan tabel SE Ops:', err);
    });
  resumeActiveWaSessionsOnStartup().catch(() => {});
});
