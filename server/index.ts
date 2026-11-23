// ============================================================================
// DEVELOPER SALES OS - PRODUCTION API SERVER (PORT 3040)
// PostgreSQL sales_os + 9router AI Engine + WhatsApp Baileys Per-SE Isolation
// ============================================================================

import http from 'node:http';
import { URL } from 'node:url';
import { sql } from './db';
import { analyzeLeadWithAi } from './ai-engine';
import {
  startBaileysForSe,
  disconnectBaileysForSe,
  getWaStatusForSe,
  processInboundWaMessageForSe,
  recordOutboundWaReplyForSe,
  sendOutboundWaMessageForSe,
  normalizePhoneWa,
  resumeActiveWaSessionsOnStartup,
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
      score: totalScorecardPoints,
      maxScore: 100,
      tier: scorecardCategory,
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
      score: totalScorecardPoints,
      maxScore: 100,
      tier: scorecardCategory,
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

  return {
    seEmail,
    seName,
    todayWib: todayStr,
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

      sendJson(res, 200, { ok: true, leads });
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

    sendJson(res, 404, { ok: false, error: `Endpoint tidak ditemukan: ${pathname}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan internal server.';
    sendJson(res, 500, { ok: false, error: message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Developer Sales OS API] Berjalan di http://127.0.0.1:${PORT}`);
  resumeActiveWaSessionsOnStartup().catch(() => {});
});
