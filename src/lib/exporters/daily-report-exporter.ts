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
  const rowsHtml = params.items
    .map(
      (r, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${escapeHtml(r.item)}</td>
        <td style="text-align:center;">${escapeHtml(r.target)}</td>
        <td style="text-align:center;font-weight:700;">${escapeHtml(r.realisasi)}</td>
        <td>${escapeHtml(r.catatan || '-')}</td>
        <td style="text-align:center;font-weight:700;">${escapeHtml(r.statusLabel)}</td>
      </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Laporan Harian SE - ${escapeHtml(params.seName)}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #2C1E16; margin: 28px; }
    .header { border-bottom: 2px solid #C2593F; padding-bottom: 12px; margin-bottom: 16px; display:flex; justify-content:space-between; align-items:flex-end; }
    .title { font-size: 18px; font-weight: 800; margin: 0; }
    .sub { font-size: 12px; color: #6E5D52; margin: 4px 0 0; }
    .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; background: #FBF9F5; border: 1px solid #E8DFD1; border-radius: 10px; padding: 12px; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    th { background: #2C1E16; color: #fff; padding: 8px 6px; text-align: left; }
    td { border-bottom: 1px solid #E8DFD1; padding: 7px 6px; vertical-align: top; }
    tr:nth-child(even) td { background: #FBF9F5; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">LAPORAN HARIAN SALES EXECUTIVE</h1>
      <p class="sub">${escapeHtml(params.projectName)} · PT Andara Rejo Makmur</p>
    </div>
    <div style="text-align:right;font-size:12px;">
      <strong>${escapeHtml(params.dateLabel)}</strong>
    </div>
  </div>
  <div class="meta">
    <div><strong>Nama SE:</strong> ${escapeHtml(params.seName)}</div>
    <div><strong>Email Akun:</strong> ${escapeHtml(params.seEmail)}</div>
    <div><strong>Scorecard Bulanan:</strong> ${params.scorecardTotal} Poin</div>
    <div><strong>Kategori:</strong> ${escapeHtml(params.scorecardCategory)}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:32px;text-align:center;">No</th>
        <th>Item Laporan (Playbook §13.1)</th>
        <th style="width:72px;text-align:center;">Target</th>
        <th style="width:90px;text-align:center;">Realisasi</th>
        <th>Catatan / Progres</th>
        <th style="width:80px;text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
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
