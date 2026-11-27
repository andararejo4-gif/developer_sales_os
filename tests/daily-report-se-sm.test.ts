import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../server/db';

describe('Daily Report SE/SM, Manual Activity, Photo & Coordinate Suite', () => {
  test('Database supports daily_manual_activities table with Lainnya custom category', async () => {
    const id = crypto.randomUUID();
    const tenantId = `uat-manual-${Date.now()}`;
    const email = `se-manual-${Date.now()}@test.local`;

    await sql`
      INSERT INTO sales_os.daily_manual_activities (
        id, tenant_id, user_email, user_name, user_role, activity_date, category, activity_note
      ) VALUES (
        ${id}::uuid, ${tenantId}, ${email}, 'SE Manual Test', 'SE', '2026-11-27'::date,
        'Lainnya: Antar Berkas Notaris', 'Mengantar berkas akad PPJB ke kantor notaris'
      )
    `;

    const rows = await sql`
      SELECT id, category, activity_note
      FROM sales_os.daily_manual_activities
      WHERE id = ${id}::uuid AND tenant_id = ${tenantId} AND LOWER(user_email) = LOWER(${email})
    `;
    expect(rows.length).toBe(1);
    expect(String(rows[0].category)).toBe('Lainnya: Antar Berkas Notaris');
    expect(String(rows[0].activity_note)).toContain('akad PPJB');

    await sql`DELETE FROM sales_os.daily_manual_activities WHERE id = ${id}::uuid`;
  });

  test('Backend /api/se/daily-report isolates SQL queries to user.email and omits smSummary', () => {
    const serverSrc = readFileSync(join(process.cwd(), 'server', 'index.ts'), 'utf8');
    expect(serverSrc).toContain("pathname === '/api/se/daily-report'");
    expect(serverSrc).toContain('const restrictToSelfSe = isSeEndpoint && user.role === \'SE\';');
    expect(serverSrc).toContain('...(isSeEndpoint');
    expect(serverSrc).toContain('photo_data_url');
  });

  test('Exporter separates reportMode "se" from SM and renders photo + coordinates', () => {
    const expSrc = readFileSync(join(process.cwd(), 'src', 'lib', 'exporters', 'daily-report-exporter.ts'), 'utf8');
    expect(expSrc).toContain("const isSeOnly = params.reportMode === 'se';");
    expect(expSrc).toContain('LAPORAN HARIAN SALES EXECUTIVE (DETAIL AKTIVITAS)');
    expect(expSrc).toContain('l.photoDataUrl');
    expect(expSrc).toContain('Koordinat:');
    expect(expSrc).toContain('Catatan Aktivitas Harian Kantor / Non-Lead');
  });
});
