// ============================================================================
// DAILY REPORT EXPORTER (PDF & EXCEL) — DEVELOPER SALES OS
// ============================================================================

export interface ExportableReportItem {
  id: number;
  cat: string;
  item: string;
  target: string;
  realisasi: string;
  catatan: string;
  statusLabel: string;
}

export interface DailyReportExportParams {
  projectName: string;
  seName: string;
  seEmail: string;
  dateLabel: string;
  scorecardTotal: number;
  scorecardCategory: string;
  items: ExportableReportItem[];
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportDailyReportExcel(params: DailyReportExportParams): void {
  const rowsHtml = params.items
    .map(
      (r, idx) => `
      <tr>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;">${escapeHtml(r.cat.toUpperCase())}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;">${escapeHtml(r.item)}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:center;">${escapeHtml(r.target)}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:center;font-weight:bold;">${escapeHtml(r.realisasi)}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;">${escapeHtml(r.catatan)}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:center;">${escapeHtml(r.statusLabel)}</td>
      </tr>`
    )
    .join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8" /></head>
<body>
  <h2 style="font-family:Arial,sans-serif;margin-bottom:4px;">LAPORAN HARIAN SALES EXECUTIVE (13 ITEM PLAYBOOK)</h2>
  <p style="font-family:Arial,sans-serif;font-size:12px;margin:2px 0;"><strong>Proyek:</strong> ${escapeHtml(params.projectName)}</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;margin:2px 0;"><strong>Sales Executive:</strong> ${escapeHtml(params.seName)} (${escapeHtml(params.seEmail)})</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;margin:2px 0 12px;"><strong>Tanggal:</strong> ${escapeHtml(params.dateLabel)} | <strong>Scorecard Bulanan:</strong> ${params.scorecardTotal} Poin (${escapeHtml(params.scorecardCategory)})</p>
  <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;width:100%;">
    <thead>
      <tr style="background:#2C1E16;color:#FFFFFF;">
        <th style="border:1px solid #2C1E16;padding:8px;">No</th>
        <th style="border:1px solid #2C1E16;padding:8px;">Kategori</th>
        <th style="border:1px solid #2C1E16;padding:8px;">Item Laporan</th>
        <th style="border:1px solid #2C1E16;padding:8px;">Target</th>
        <th style="border:1px solid #2C1E16;padding:8px;">Realisasi</th>
        <th style="border:1px solid #2C1E16;padding:8px;">Catatan / Progres</th>
        <th style="border:1px solid #2C1E16;padding:8px;">Status</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeDate = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `laporan-harian-se-${safeDate}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDailyReportPdf(params: DailyReportExportParams): void {
  const totalItems = params.items.length || 1;
  const hitCount = params.items.filter((r) => r.statusLabel === 'Tercapai').length;
  const nearCount = params.items.filter((r) => r.statusLabel === 'Mendekati').length;
  const activeCount = params.items.filter((r) => r.statusLabel === 'Berjalan').length;
  const hambatanItem = params.items.find((r) => r.id === 13);
  const hitPct = Math.round((hitCount / totalItems) * 100);
  const progressPct = Math.min(100, Math.round(((hitCount + nearCount + activeCount) / totalItems) * 100));
  const scorecardPct = Math.min(100, Math.max(0, Math.round(params.scorecardTotal)));

  const statusBadge = (label: string) => {
    const l = label.toLowerCase();
    if (l === 'tercapai') return `<span class="badge badge-green">${escapeHtml(label)}</span>`;
    if (l === 'mendekati') return `<span class="badge badge-blue">${escapeHtml(label)}</span>`;
    if (l === 'berjalan') return `<span class="badge badge-amber">${escapeHtml(label)}</span>`;
    return `<span class="badge badge-slate">${escapeHtml(label)}</span>`;
  };

  const rowsHtml = params.items
    .map(
      (r, idx) => `
      <tr>
        <td style="text-align:center;font-weight:700;">${idx + 1}</td>
        <td>${escapeHtml(r.item)}</td>
        <td style="text-align:center;">${escapeHtml(r.target)}</td>
        <td style="text-align:center;font-weight:700;color:#112236;">${escapeHtml(r.realisasi)}</td>
        <td>${escapeHtml(r.catatan || '-')}</td>
        <td style="text-align:center;">${statusBadge(r.statusLabel)}</td>
      </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Laporan Harian SE - ${escapeHtml(params.seName)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1E293B; background: #FFFFFF; margin: 0; padding: 0; font-size: 9pt; line-height: 1.42; }
    .hero-banner { background: #112236; color: #FFFFFF; border-top: 4px solid #C58B2B; padding: 14px 18px 11px 18px; border-radius: 3px 3px 0 0; }
    .hero-kicker { font-size: 7pt; letter-spacing: 1px; font-weight: 700; color: #E2B86B; text-transform: uppercase; margin-bottom: 3px; }
    .hero-title { font-size: 16pt; font-weight: 800; margin: 0 0 3px 0; color: #FFFFFF; }
    .hero-sub { font-size: 8.3pt; color: #CBD5E1; margin: 0; }
    .meta-strip { background: #1B2E45; color: #FFFFFF; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 9px 18px; border-bottom: 3px solid #C58B2B; margin-bottom: 12px; }
    .meta-label { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.6px; color: #94A3B8; font-weight: 700; }
    .meta-val { font-size: 8.2pt; font-weight: 700; color: #FFFFFF; margin-top: 2px; word-break: break-word; }
    .sec-header { display: flex; align-items: center; gap: 7px; border-bottom: 2px solid #E2E8F0; padding-bottom: 4px; margin: 12px 0 8px 0; page-break-after: avoid; }
    .sec-num { color: #C58B2B; font-weight: 800; font-size: 10pt; }
    .sec-sep { color: #94A3B8; font-weight: 700; }
    .sec-title { color: #112236; font-weight: 800; font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.3px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
    .kpi-card { background: #FFFFFF; border: 1px solid #CBD5E1; border-top: 3px solid #112236; border-radius: 3px; padding: 7px 9px; }
    .kpi-card.gold { border-top-color: #C58B2B; }
    .kpi-card.blue { border-top-color: #1D6FE8; }
    .kpi-card.green { border-top-color: #0F8B5D; }
    .kpi-label { font-size: 6.4pt; font-weight: 700; color: #64748B; text-transform: uppercase; }
    .kpi-val { font-size: 13pt; font-weight: 800; color: #112236; margin: 2px 0; }
    .kpi-sub { font-size: 7pt; color: #475569; }
    .viz-panel { background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 3px; padding: 9px 12px; margin-bottom: 10px; page-break-inside: avoid; }
    .viz-title { font-size: 8.2pt; font-weight: 700; color: #112236; margin: 0 0 7px 0; }
    .bar-row { display: grid; grid-template-columns: 145px 1fr 78px; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 7.6pt; }
    .bar-row:last-child { margin-bottom: 0; }
    .bar-label { color: #334155; font-weight: 600; }
    .bar-track { height: 12px; background: #FDE8E8; border-radius: 2px; overflow: hidden; }
    .bar-track.neutral { background: #E2E8F0; }
    .bar-fill { height: 100%; background: #112236; }
    .bar-fill.gold { background: #C58B2B; }
    .bar-fill.green { background: #0F8B5D; }
    .bar-fill.blue { background: #1D6FE8; }
    .bar-val { font-weight: 700; color: #1E293B; text-align: right; }
    table { width: 100%; border-collapse: collapse; font-size: 7.9pt; margin-bottom: 10px; }
    thead th { background: #112236; color: #FFFFFF; padding: 6px 7px; text-align: left; border: 1px solid #112236; font-weight: 700; }
    tbody td { border: 1px solid #CBD5E1; padding: 5.5px 7px; vertical-align: top; color: #1E293B; }
    tbody tr:nth-child(even) td { background: #F8FAFC; }
    .badge { display: inline-block; padding: 1.5px 6px; border-radius: 3px; font-size: 6.8pt; font-weight: 700; text-transform: uppercase; }
    .badge-green { background: #DCFCE7; color: #166534; }
    .badge-blue { background: #DBEAFE; color: #1E40AF; }
    .badge-amber { background: #FEF3C7; color: #92400E; }
    .badge-slate { background: #F1F5F9; color: #475569; }
    .callout-amber { background: #FFFBEB; border: 1px solid #F59E0B; border-left: 4px solid #D97706; border-radius: 3px; padding: 8px 10px; margin-bottom: 10px; font-size: 8pt; page-break-inside: avoid; }
    .callout-amber strong { color: #92400E; }
    .signoff-box { border: 1px solid #94A3B8; border-radius: 3px; page-break-inside: avoid; }
    .signoff-head { background: #F1F5F9; border-bottom: 1px solid #CBD5E1; padding: 5px 10px; font-size: 7pt; font-weight: 700; color: #112236; text-transform: uppercase; }
    .signoff-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .signoff-col { padding: 8px 12px; text-align: center; font-size: 7.6pt; color: #475569; }
    .signoff-col:first-child { border-right: 1px solid #CBD5E1; }
    .signoff-space { height: 32px; }
    .signoff-name { border-top: 1px solid #1E293B; display: inline-block; min-width: 150px; padding-top: 3px; font-weight: 700; color: #112236; }
    .footer-note { margin-top: 8px; border-top: 1px solid #CBD5E1; padding-top: 4px; display: flex; justify-content: space-between; font-size: 7pt; color: #64748B; }
  </style>
</head>
<body>
  <div class="hero-banner">
    <div class="hero-kicker">ANDARA GROUP • DIVISI SALES &amp; MARKETING &nbsp;|&nbsp; LAPORAN RESMI HARIAN SE</div>
    <h1 class="hero-title">LAPORAN HARIAN SALES EXECUTIVE</h1>
    <p class="hero-sub">${escapeHtml(params.projectName)} · Evaluasi Aktivitas Pemasaran, Prospek, Konten &amp; Target Closing</p>
  </div>
  <div class="meta-strip">
    <div><div class="meta-label">HARI / TANGGAL</div><div class="meta-val">${escapeHtml(params.dateLabel)}</div></div>
    <div><div class="meta-label">PROYEK AKTIF</div><div class="meta-val">${escapeHtml(params.projectName)}</div></div>
    <div><div class="meta-label">SALES EXECUTIVE</div><div class="meta-val">${escapeHtml(params.seName)}</div></div>
    <div><div class="meta-label">SCORECARD BULANAN</div><div class="meta-val">${params.scorecardTotal} Poin</div></div>
  </div>

  <div class="sec-header">
    <span class="sec-num">01</span><span class="sec-sep">|</span>
    <span class="sec-title">RINGKASAN EKSEKUTIF &amp; VISUALISASI CAPAIAN HARIAN</span>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">TARGET TERCAPAI</div>
      <div class="kpi-val">${hitCount} / ${totalItems}</div>
      <div class="kpi-sub">Capaian penuh ${hitPct}% item</div>
    </div>
    <div class="kpi-card gold">
      <div class="kpi-label">AKTIF / BERJALAN</div>
      <div class="kpi-val">${nearCount + activeCount} Item</div>
      <div class="kpi-sub">${nearCount} mendekati • ${activeCount} berjalan</div>
    </div>
    <div class="kpi-card blue">
      <div class="kpi-label">SCORECARD BULANAN</div>
      <div class="kpi-val">${params.scorecardTotal} Poin</div>
      <div class="kpi-sub">${escapeHtml(params.scorecardCategory)}</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">EMAIL AKUN SE</div>
      <div class="kpi-val" style="font-size:9.5pt;margin:5px 0;">${escapeHtml(params.seEmail)}</div>
      <div class="kpi-sub">Tersinkron ke Developer Sales OS</div>
    </div>
  </div>

  <div class="viz-panel">
    <div class="viz-title">Visualisasi Progres Aktivitas &amp; Scorecard Harian</div>
    <div class="bar-row">
      <div class="bar-label">Item Tercapai Penuh</div>
      <div class="bar-track"><div class="bar-fill green" style="width:${hitPct}%;"></div></div>
      <div class="bar-val">${hitPct}% (${hitCount}/${totalItems})</div>
    </div>
    <div class="bar-row">
      <div class="bar-label">Aktivitas Berjalan</div>
      <div class="bar-track"><div class="bar-fill gold" style="width:${progressPct}%;"></div></div>
      <div class="bar-val">${progressPct}% aktif</div>
    </div>
    <div class="bar-row">
      <div class="bar-label">Scorecard Bulanan</div>
      <div class="bar-track neutral"><div class="bar-fill blue" style="width:${scorecardPct}%;"></div></div>
      <div class="bar-val">${params.scorecardTotal} / 100 Poin</div>
    </div>
  </div>

  <div class="sec-header">
    <span class="sec-num">02</span><span class="sec-sep">|</span>
    <span class="sec-title">RINCIAN REALISASI 13 ITEM PLAYBOOK HARIAN</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px;text-align:center;">No</th>
        <th>Item Laporan (Playbook §13.1)</th>
        <th style="width:68px;text-align:center;">Target</th>
        <th style="width:82px;text-align:center;">Realisasi</th>
        <th>Catatan / Progres</th>
        <th style="width:74px;text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="callout-amber">
    <strong>Catatan Hambatan &amp; Dukungan TL / SM:</strong> ${escapeHtml(hambatanItem?.catatan || 'Tidak ada hambatan khusus yang dicatat.')}
  </div>

  <div class="signoff-box">
    <div class="signoff-head">LEMBAR PENGESAHAN &amp; PERTANGGUNGJAWABAN LAPORAN • ${escapeHtml(params.dateLabel)}</div>
    <div class="signoff-grid">
      <div class="signoff-col">
        <div>Dilaporkan oleh,</div>
        <div><strong>Sales Executive</strong></div>
        <div class="signoff-space"></div>
        <div class="signoff-name">${escapeHtml(params.seName)}</div>
      </div>
      <div class="signoff-col">
        <div>Dievaluasi &amp; Diketahui oleh,</div>
        <div><strong>Team Leader / Sales Manager</strong></div>
        <div class="signoff-space"></div>
        <div class="signoff-name">Team Leader / Sales Manager</div>
      </div>
    </div>
  </div>

  <div class="footer-note">
    <span>Dokumen Resmi Operasional • ${escapeHtml(params.projectName)}</span>
    <span>Developer Sales OS · PT Andara Rejo Makmur</span>
  </div>

  <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=720');
  if (!win) {
    window.print();
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export interface SmSeDetailPayload {
  fieldLogs: Array<{
    logType: string;
    title: string;
    locationLabel: string;
    lat: number | null;
    lng: number | null;
    photoDataUrl?: string | null;
    createdAt: string;
  }>;
  leads: Array<{
    fullName: string;
    unitInterest: string;
    source: string;
    stage: string;
    bantTotal: number;
    createdAt: string;
  }>;
  dailyNotes: Array<{
    reportDate: string;
    dialCount: number;
    connectedCallCount: number;
    canvassingContacts: number;
    canvassingBrochures: number;
    canvassingLeads: number;
    postedReels: number;
    postedWaStatus: number;
    postedStories: number;
    hambatan: string;
  }>;
  manualActivities?: Array<{
    id: string;
    activityDate: string;
    category: string;
    note: string;
    createdAt: string;
  }>;
}

export interface SmTeamSeReportRow {
  seName: string;
  seEmail: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  gpsCount: number;
  latestLocation: string;
  callCount: number;
  canvassingContacts: number;
  contentPosted: number;
  leadsToday: number;
  bookingsCount: number;
  hambatanBantuan: string;
  details?: SmSeDetailPayload;
}

export interface SmDailyReportExportParams {
  reportMode?: 'sm' | 'se';
  projectName: string;
  smName: string;
  smEmail: string;
  dateLabel: string;
  smActivities: Array<{ action: string; entity: string; created_at: string }>;
  smManualActivities?: Array<{
    id: string;
    activityDate: string;
    category: string;
    note: string;
    createdAt: string;
  }>;
  teamTotals: {
    totalSe: number;
    checkedInCount: number;
    totalGpsLogs: number;
    totalCalls: number;
    totalCanvassing: number;
    totalContentPosted: number;
    totalLeadsToday: number;
    totalBookingsToday: number;
  };
  seReports: SmTeamSeReportRow[];
}

export function exportSmDailyReportExcel(params: SmDailyReportExportParams): void {
  const seRowsHtml = params.seReports
    .map(
      (r, idx) => `
      <tr>
        <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(r.seName)} (${escapeHtml(r.seEmail)})</td>
        <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Belum'}</td>
        <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${r.gpsCount} (${escapeHtml(r.latestLocation || '-')})</td>
        <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${r.callCount}</td>
        <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${r.canvassingContacts}</td>
        <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${r.contentPosted}</td>
        <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${r.leadsToday}</td>
        <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${r.bookingsCount}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(r.hambatanBantuan || '-')}</td>
      </tr>`
    )
    .join('');

  const seDetailRowsHtml = params.seReports
    .flatMap((r) => {
      const logs = (r.details?.fieldLogs || []).map(
        (l) => {
          const coordText = l.lat != null && l.lng != null ? `${Number(l.lat).toFixed(5)}, ${Number(l.lng).toFixed(5)}` : '-';
          return `
      <tr>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(r.seName)}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${new Date(l.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(l.logType)}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(l.title || '-')}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(l.locationLabel || '-')} (Koordinat: ${escapeHtml(coordText)})${l.photoDataUrl ? ' [Ada Bukti Foto]' : ''}</td>
      </tr>`;
        }
      );
      const leads = (r.details?.leads || []).map(
        (ld) => `
      <tr>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(r.seName)}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${ld.createdAt ? new Date(ld.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">LEAD (${escapeHtml(ld.stage)})</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(ld.fullName)} — ${escapeHtml(ld.unitInterest)} (BANT ${ld.bantTotal})</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(ld.source)}</td>
      </tr>`
      );
      const manuals = (r.details?.manualActivities || []).map(
        (m) => `
      <tr>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(r.seName)}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(m.activityDate)}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">KANTOR (${escapeHtml(m.category)})</td>
        <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(m.note)}</td>
        <td style="border:1px solid #d1d5db;padding:6px;">Aktivitas Manual Kantor</td>
      </tr>`
      );
      return [...logs, ...leads, ...manuals];
    })
    .join('');

  const isSeOnly = params.reportMode === 'se';
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body>
    <h2>${isSeOnly ? 'LAPORAN HARIAN SALES EXECUTIVE (DETAIL AKTIVITAS)' : 'LAPORAN HARIAN SALES MANAGER & TIM SE'} — ${escapeHtml(params.projectName)}</h2>
    <p><strong>${isSeOnly ? 'Sales Executive' : 'Sales Manager'}:</strong> ${escapeHtml(params.smName)} (${escapeHtml(params.smEmail)}) | <strong>Tanggal:</strong> ${escapeHtml(params.dateLabel)}</p>
    <p>${isSeOnly ? '' : `<strong>Aktivitas SM Hari Ini:</strong> ${params.smActivities.length} aksi tercatat | <strong>Total SE:</strong> ${params.teamTotals.totalSe} | `}<strong>Absen Hadir:</strong> ${params.teamTotals.checkedInCount} | <strong>GPS:</strong> ${params.teamTotals.totalGpsLogs} | <strong>Call:</strong> ${params.teamTotals.totalCalls} | <strong>Leads:</strong> ${params.teamTotals.totalLeadsToday} | <strong>Booking:</strong> ${params.teamTotals.totalBookingsToday}</p>
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
      <thead><tr style="background:#112236;color:#FFFFFF;">
        <th style="border:1px solid #112236;padding:6px;">No</th>
        <th style="border:1px solid #112236;padding:6px;">Nama SE</th>
        <th style="border:1px solid #112236;padding:6px;">Absen Masuk</th>
        <th style="border:1px solid #112236;padding:6px;">GPS & Lokasi</th>
        <th style="border:1px solid #112236;padding:6px;">Call</th>
        <th style="border:1px solid #112236;padding:6px;">Canvassing</th>
        <th style="border:1px solid #112236;padding:6px;">Konten</th>
        <th style="border:1px solid #112236;padding:6px;">Lead Baru</th>
        <th style="border:1px solid #112236;padding:6px;">Booking</th>
        <th style="border:1px solid #112236;padding:6px;">Hambatan</th>
      </tr></thead>
      <tbody>${seRowsHtml}</tbody>
    </table>
    <h3 style="margin-top:16px;">RINCIAN AKTIVITAS DETAIL PER SE (ABSEN, GPS, CALL &amp; LEAD)</h3>
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
      <thead><tr style="background:#1E293B;color:#FFFFFF;">
        <th style="border:1px solid #1E293B;padding:6px;">Nama SE</th>
        <th style="border:1px solid #1E293B;padding:6px;">Waktu (WIB)</th>
        <th style="border:1px solid #1E293B;padding:6px;">Jenis</th>
        <th style="border:1px solid #1E293B;padding:6px;">Aktivitas / Prospek</th>
        <th style="border:1px solid #1E293B;padding:6px;">Lokasi / Sumber</th>
      </tr></thead>
      <tbody>${seDetailRowsHtml || '<tr><td colspan="5" style="border:1px solid #d1d5db;padding:6px;text-align:center;">Belum ada rincian aktivitas SE pada periode ini.</td></tr>'}</tbody>
    </table>
  </body></html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${isSeOnly ? 'laporan-harian-se-detail' : 'laporan-harian-sm'}-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSmDailyReportPdf(params: SmDailyReportExportParams): void {
  const isSeOnly = params.reportMode === 'se';
  const seRowsHtml = params.seReports
    .map(
      (r, idx) => `
      <tr>
        <td style="text-align:center;font-weight:700;">${idx + 1}</td>
        <td><strong>${escapeHtml(r.seName)}</strong><br/><span style="font-size:7pt;color:#64748B;">${escapeHtml(r.seEmail)}</span></td>
        <td style="text-align:center;">${r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '<span style="color:#B91C1C;">Belum</span>'}</td>
        <td><strong>${r.gpsCount} titik</strong><br/><span style="font-size:7pt;color:#475569;">${escapeHtml(r.latestLocation || '-')}</span></td>
        <td style="text-align:center;font-weight:700;">${r.callCount}</td>
        <td style="text-align:center;">${r.canvassingContacts}</td>
        <td style="text-align:center;">${r.contentPosted}</td>
        <td style="text-align:center;font-weight:700;color:#0F8B5D;">${r.leadsToday}</td>
        <td style="text-align:center;font-weight:700;color:#112236;">${r.bookingsCount}</td>
      </tr>`
    )
    .join('');

  const smRowsHtml =
    params.smActivities.length === 0
      ? '<tr><td colspan="3" style="text-align:center;color:#64748B;">Belum ada aksi audit SM tercatat pada tanggal ini.</td></tr>'
      : params.smActivities
          .slice(0, 12)
          .map(
            (a) => `
        <tr>
          <td>${new Date(a.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</td>
          <td><strong>${escapeHtml(a.action)}</strong></td>
          <td>${escapeHtml(a.entity)}</td>
        </tr>`
          )
          .join('');

  const perSeDetailBlocksHtml = params.seReports
    .map((r) => {
      const notes = r.details?.dailyNotes || [];
      const logs = r.details?.fieldLogs || [];
      const leads = r.details?.leads || [];

      const notesHtml =
        notes.length === 0
          ? '<tr><td colspan="5" style="text-align:center;color:#64748B;">Belum ada catatan harian tertulis.</td></tr>'
          : notes
              .map(
                (n) => `
          <tr>
            <td>${escapeHtml(n.reportDate || '-')}</td>
            <td style="text-align:center;">${n.dialCount} dial / ${n.connectedCallCount} tersambung</td>
            <td style="text-align:center;">${n.canvassingContacts} kontak / ${n.canvassingBrochures} brosur / ${n.canvassingLeads} lead</td>
            <td style="text-align:center;">${n.postedReels} reels / ${n.postedWaStatus} WA / ${n.postedStories} story</td>
            <td>${escapeHtml(n.hambatan || '-')}</td>
          </tr>`
              )
              .join('');

      const logsHtml =
        logs.length === 0
          ? '<tr><td colspan="5" style="text-align:center;color:#64748B;">Belum ada log lapangan (absen/GPS/call).</td></tr>'
          : logs
              .slice(0, 25)
              .map((l) => {
                const coordStr =
                  l.lat != null && l.lng != null
                    ? `${Number(l.lat).toFixed(5)}, ${Number(l.lng).toFixed(5)}`
                    : '-';
                const locDisplay = l.locationLabel
                  ? `${escapeHtml(l.locationLabel)}<br/><span style="font-size:6.8pt;color:#475569;font-family:Consolas,monospace;">Koordinat: ${escapeHtml(coordStr)}</span>`
                  : `<span style="font-family:Consolas,monospace;">${escapeHtml(coordStr)}</span>`;
                const photoCell = l.photoDataUrl
                  ? `<img src="${l.photoDataUrl}" alt="Bukti" style="width:52px;height:52px;object-fit:cover;border-radius:4px;border:1px solid #CBD5E1;display:block;" />`
                  : '<span style="color:#94A3B8;font-size:7pt;">-</span>';
                return `
          <tr>
            <td>${new Date(l.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB</td>
            <td style="font-weight:700;">${escapeHtml(l.logType)}</td>
            <td>${escapeHtml(l.title || '-')}</td>
            <td>${locDisplay}</td>
            <td style="text-align:center;">${photoCell}</td>
          </tr>`;
              })
              .join('');

      const leadsHtml =
        leads.length === 0
          ? '<tr><td colspan="5" style="text-align:center;color:#64748B;">Belum ada prospek/lead pada periode ini.</td></tr>'
          : leads
              .slice(0, 20)
              .map(
                (ld) => `
          <tr>
            <td><strong>${escapeHtml(ld.fullName)}</strong></td>
            <td>${escapeHtml(ld.unitInterest)}</td>
            <td>${escapeHtml(ld.source)}</td>
            <td style="text-align:center;font-weight:700;">${escapeHtml(ld.stage)}</td>
            <td style="text-align:center;">${ld.bantTotal}</td>
          </tr>`
              )
              .join('');

      const manuals = r.details?.manualActivities || [];
      const manualsHtml =
        manuals.length === 0
          ? '<tr><td colspan="3" style="text-align:center;color:#64748B;">Belum ada catatan aktivitas kantor / non-lead.</td></tr>'
          : manuals
              .map(
                (m) => `
          <tr>
            <td style="width:90px;">${escapeHtml(m.activityDate)}</td>
            <td style="width:140px;font-weight:700;">${escapeHtml(m.category)}</td>
            <td>${escapeHtml(m.note)}</td>
          </tr>`
              )
              .join('');

      return `
      <div style="border:1px solid #CBD5E1;border-radius:3px;padding:8px 10px;margin-bottom:10px;page-break-inside:avoid;">
        <div style="font-weight:800;color:#112236;font-size:8.6pt;margin-bottom:6px;border-bottom:1px solid #E2E8F0;padding-bottom:4px;">
          ${escapeHtml(r.seName)} <span style="font-weight:400;color:#64748B;font-size:7.6pt;">(${escapeHtml(r.seEmail)}) — ${logs.length} log lapangan · ${leads.length} lead · ${notes.length} catatan harian · ${manuals.length} aktivitas kantor</span>
        </div>
        <div style="font-size:7.4pt;font-weight:700;color:#475569;margin:4px 0;">A. Catatan Harian Playbook (Call, Canvassing, Konten &amp; Hambatan)</div>
        <table>
          <thead><tr><th>Tanggal</th><th>Telepon</th><th>Canvassing</th><th>Konten</th><th>Hambatan</th></tr></thead>
          <tbody>${notesHtml}</tbody>
        </table>
        <div style="font-size:7.4pt;font-weight:700;color:#475569;margin:4px 0;">B. Rincian Log Lapangan (Absen, GPS, Call, Koordinat &amp; Bukti Foto)${logs.length > 25 ? ` — menampilkan 25 dari ${logs.length} log` : ''}</div>
        <table>
          <thead><tr><th style="width:105px;">Waktu</th><th style="width:68px;">Tipe</th><th>Aktivitas</th><th>Lokasi &amp; Titik Koordinat</th><th style="width:64px;text-align:center;">Foto</th></tr></thead>
          <tbody>${logsHtml}</tbody>
        </table>
        <div style="font-size:7.4pt;font-weight:700;color:#475569;margin:4px 0;">C. Daftar Prospek / Lead Ditangani</div>
        <table>
          <thead><tr><th>Nama Prospek</th><th>Unit Minat</th><th>Sumber</th><th>Stage</th><th>BANT</th></tr></thead>
          <tbody>${leadsHtml}</tbody>
        </table>
        <div style="font-size:7.4pt;font-weight:700;color:#475569;margin:4px 0;">D. Catatan Aktivitas Harian Kantor / Non-Lead</div>
        <table>
          <thead><tr><th>Tanggal</th><th>Kategori</th><th>Uraian Kegiatan</th></tr></thead>
          <tbody>${manualsHtml}</tbody>
        </table>
      </div>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Laporan Harian SM & Tim SE - ${escapeHtml(params.smName)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1E293B; background: #FFFFFF; margin: 0; padding: 0; font-size: 8.8pt; line-height: 1.4; }
    .hero-banner { background: #112236; color: #FFFFFF; border-top: 4px solid #C58B2B; padding: 14px 18px 11px 18px; }
    .hero-kicker { font-size: 7pt; letter-spacing: 1px; font-weight: 700; color: #E2B86B; text-transform: uppercase; margin-bottom: 3px; }
    .hero-title { font-size: 15.5pt; font-weight: 800; margin: 0 0 3px 0; color: #FFFFFF; }
    .hero-sub { font-size: 8.2pt; color: #CBD5E1; margin: 0; }
    .meta-strip { background: #1B2E45; color: #FFFFFF; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 9px 18px; border-bottom: 3px solid #C58B2B; margin-bottom: 12px; }
    .meta-label { font-size: 6.4pt; text-transform: uppercase; color: #94A3B8; font-weight: 700; }
    .meta-val { font-size: 8pt; font-weight: 700; color: #FFFFFF; margin-top: 2px; }
    .sec-header { display: flex; align-items: center; gap: 7px; border-bottom: 2px solid #E2E8F0; padding-bottom: 4px; margin: 12px 0 8px 0; }
    .sec-num { color: #C58B2B; font-weight: 800; font-size: 10pt; }
    .sec-title { color: #112236; font-weight: 800; font-size: 9.2pt; text-transform: uppercase; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
    .kpi-card { background: #FFFFFF; border: 1px solid #CBD5E1; border-top: 3px solid #112236; border-radius: 3px; padding: 7px 9px; }
    .kpi-card.gold { border-top-color: #C58B2B; }
    .kpi-card.blue { border-top-color: #1D6FE8; }
    .kpi-card.green { border-top-color: #0F8B5D; }
    .kpi-label { font-size: 6.4pt; font-weight: 700; color: #64748B; text-transform: uppercase; }
    .kpi-val { font-size: 13pt; font-weight: 800; color: #112236; margin: 2px 0; }
    .kpi-sub { font-size: 7pt; color: #475569; }
    table { width: 100%; border-collapse: collapse; font-size: 7.7pt; margin-bottom: 10px; }
    thead th { background: #112236; color: #FFFFFF; padding: 6px; text-align: left; border: 1px solid #112236; }
    tbody td { border: 1px solid #CBD5E1; padding: 5px 6px; vertical-align: top; }
    tbody tr:nth-child(even) td { background: #F8FAFC; }
    .signoff-box { border: 1px solid #94A3B8; border-radius: 3px; page-break-inside: avoid; margin-top: 10px; }
    .signoff-head { background: #F1F5F9; border-bottom: 1px solid #CBD5E1; padding: 5px 10px; font-size: 7pt; font-weight: 700; color: #112236; }
    .signoff-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .signoff-col { padding: 8px 12px; text-align: center; font-size: 7.5pt; color: #475569; }
    .signoff-col:first-child { border-right: 1px solid #CBD5E1; }
    .signoff-space { height: 30px; }
    .signoff-name { border-top: 1px solid #1E293B; display: inline-block; min-width: 150px; padding-top: 3px; font-weight: 700; color: #112236; }
  </style>
</head>
<body>
  <div class="hero-banner">
    <div class="hero-kicker">ANDARA GROUP • DIVISI SALES &amp; MARKETING &nbsp;|&nbsp; ${isSeOnly ? 'LAPORAN HARIAN SALES EXECUTIVE' : 'LAPORAN RESMI DIREKSI'}</div>
    <h1 class="hero-title">${isSeOnly ? 'LAPORAN HARIAN SALES EXECUTIVE (DETAIL AKTIVITAS)' : 'LAPORAN HARIAN SALES MANAGER &amp; TIM SE'}</h1>
    <p class="hero-sub">${escapeHtml(params.projectName)} · ${isSeOnly ? 'Absensi, GPS, Titik Koordinat, Bukti Foto, Call, Canvassing, Konten &amp; Pipeline SE' : 'Agregasi Aktivitas SM, Absensi, GPS, Call, Canvassing, Konten &amp; Pipeline SE'}</p>
  </div>
  <div class="meta-strip">
    <div><div class="meta-label">TANGGAL LAPORAN</div><div class="meta-val">${escapeHtml(params.dateLabel)}</div></div>
    <div><div class="meta-label">${isSeOnly ? 'SALES EXECUTIVE' : 'SALES MANAGER'}</div><div class="meta-val">${escapeHtml(params.smName)}</div></div>
    <div><div class="meta-label">${isSeOnly ? 'ABSENSI &amp; GPS' : 'TIM SE AKTIF'}</div><div class="meta-val">${isSeOnly ? `${params.teamTotals.totalGpsLogs} GPS • ${params.teamTotals.totalCalls} Call` : `${params.teamTotals.checkedInCount} / ${params.teamTotals.totalSe} Hadir`}</div></div>
    <div><div class="meta-label">${isSeOnly ? 'LEAD &amp; BOOKING' : 'LEAD &amp; BOOKING TIM'}</div><div class="meta-val">${params.teamTotals.totalLeadsToday} Lead • ${params.teamTotals.totalBookingsToday} Booking</div></div>
  </div>
  <div class="sec-header"><span class="sec-num">01</span><span class="sec-title">${isSeOnly ? 'RINGKASAN KINERJA HARIAN SE' : 'RINGKASAN KINERJA TIM (SM + SELURUH SE)'}</span></div>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">ABSENSI SE</div><div class="kpi-val">${params.teamTotals.checkedInCount} / ${params.teamTotals.totalSe}</div><div class="kpi-sub">Check-In tervalidasi</div></div>
    <div class="kpi-card gold"><div class="kpi-label">TITIK GPS &amp; CALL</div><div class="kpi-val">${params.teamTotals.totalGpsLogs} / ${params.teamTotals.totalCalls}</div><div class="kpi-sub">${params.teamTotals.totalGpsLogs} GPS • ${params.teamTotals.totalCalls} Call</div></div>
    <div class="kpi-card blue"><div class="kpi-label">CANVASSING &amp; KONTEN</div><div class="kpi-val">${params.teamTotals.totalCanvassing} / ${params.teamTotals.totalContentPosted}</div><div class="kpi-sub">Kontak lapangan &amp; posting</div></div>
    <div class="kpi-card green"><div class="kpi-label">${isSeOnly ? 'LEAD &amp; BOOKING' : 'AKTIVITAS SM'}</div><div class="kpi-val">${isSeOnly ? `${params.teamTotals.totalLeadsToday} / ${params.teamTotals.totalBookingsToday}` : `${params.smActivities.length} Aksi`}</div><div class="kpi-sub">${isSeOnly ? 'Prospek &amp; booking tercatat' : 'Supervisi, approval &amp; kontrol'}</div></div>
  </div>
  <div class="sec-header"><span class="sec-num">02</span><span class="sec-title">${isSeOnly ? 'REKAPITULASI CAPAIAN SALES EXECUTIVE' : 'REKAPITULASI AKTIVITAS SELURUH SE DI BAWAH SM'}</span></div>
  <table>
    <thead><tr><th>No</th><th>Sales Executive</th><th>Absen</th><th>GPS &amp; Lokasi</th><th>Call</th><th>Canv.</th><th>Konten</th><th>Lead</th><th>Booking</th></tr></thead>
    <tbody>${seRowsHtml}</tbody>
  </table>
  <div class="sec-header"><span class="sec-num">03</span><span class="sec-title">${isSeOnly ? 'RINCIAN AKTIVITAS, FOTO &amp; TITIK KOORDINAT' : 'RINCIAN AKTIVITAS DETAIL PER SALES EXECUTIVE'}</span></div>
  ${perSeDetailBlocksHtml || '<p style="font-size:8pt;color:#64748B;">Belum ada data detail SE pada periode ini.</p>'}
  ${
    isSeOnly
      ? ''
      : `<div class="sec-header"><span class="sec-num">04</span><span class="sec-title">LOG AKTIVITAS &amp; CATATAN HARIAN SALES MANAGER (${escapeHtml(params.smName)})</span></div>
  <table>
    <thead><tr><th style="width:90px;">Waktu</th><th style="width:180px;">Aksi / Kategori</th><th>Modul / Uraian Kegiatan</th></tr></thead>
    <tbody>${
      (params.smManualActivities || [])
        .map(
          (m) => `
        <tr>
          <td>${escapeHtml(m.activityDate)}</td>
          <td><strong>${escapeHtml(m.category)}</strong></td>
          <td>${escapeHtml(m.note)}</td>
        </tr>`
        )
        .join('') + (params.smActivities.length > 0 ? smRowsHtml : params.smManualActivities?.length ? '' : smRowsHtml)
    }</tbody>
  </table>`
  }
  <div class="signoff-box">
    <div class="signoff-head">${isSeOnly ? 'LEMBAR PENGESAHAN LAPORAN HARIAN SALES EXECUTIVE' : 'LEMBAR PENGESAHAN LAPORAN HARIAN SM &amp; TIM SE'} • ${escapeHtml(params.dateLabel)}</div>
    <div class="signoff-grid">
      <div class="signoff-col"><div>Disusun oleh,</div><div><strong>${isSeOnly ? 'Sales Executive' : 'Sales Manager'}</strong></div><div class="signoff-space"></div><div class="signoff-name">${escapeHtml(params.smName)}</div></div>
      <div class="signoff-col"><div>${isSeOnly ? 'Diketahui oleh,' : 'Diterima &amp; Disahkan oleh,'}</div><div><strong>${isSeOnly ? 'Sales Manager' : 'Direksi Andara Group'}</strong></div><div class="signoff-space"></div><div class="signoff-name">${isSeOnly ? 'Sales Manager' : 'Direksi'}</div></div>
    </div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=720');
  if (!win) { window.print(); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
