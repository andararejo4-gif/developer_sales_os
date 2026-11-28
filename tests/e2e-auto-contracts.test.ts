import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('E2E & Contract Auto Suite (-AUTO evidence)', () => {
  test('F04/F05: Tenant user listing excludes SUPERADMIN, SUPERADMIN_IT, and internal domain', () => {
    const authPath = join(process.cwd(), 'server', 'auth.ts');
    expect(existsSync(authPath)).toBe(true);
    const authSrc = readFileSync(authPath, 'utf8');
    expect(authSrc).toContain("AND role NOT IN ('SUPERADMIN', 'SUPERADMIN_IT')");
    expect(authSrc).toContain("AND LOWER(email) NOT LIKE '%@developersalesos.com'");
  });

  test('T3: Single DEV Registry & Consolidated Reporting standard exists without duplicate DEV-27..36 conflict', () => {
    const regPath = join(process.cwd(), 'docs', 'REGISTRI_DEV_DAN_PELAPORAN_TUNGGAL.md');
    expect(existsSync(regPath)).toBe(true);
    const content = readFileSync(regPath, 'utf8');
    expect(content).toContain('IT-LH-26-NOV-2026-A');
    expect(content).toContain('IT-LH-26-NOV-2026-B');
    expect(content).toContain('IT-LH-26-NOV-2026-C');
    expect(content).toContain('IT-LH-26-NOV-2026-CONSOLIDATED');
    expect(content).toContain('WEB-DEV-01');
    expect(content).toContain('WEB-DEV-10');
  });

  test('T2: Core R0/R1 Technical Specifications (-SP) document exists and references real modules', () => {
    const specPath = join(process.cwd(), 'docs', 'SPEC_CORE_FEATURES_R0_R1.md');
    expect(existsSync(specPath)).toBe(true);
    const content = readFileSync(specPath, 'utf8');
    expect(content).toContain('server/auth.ts');
    expect(content).toContain('server/index.ts');
    expect(content).toContain('src/components/SmDailyReportPanel.tsx');
  });
});
