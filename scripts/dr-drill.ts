#!/usr/bin/env bun
/**
 * Disaster Recovery Drill (INF-12 & REL-02)
 * Non-destruktif:
 * 1. Mengecek konektivitas PostgreSQL & menghitung baris tabel inti `sales_os`.
 * 2. Menjalankan backup `pg_dump --schema=sales_os` ke `backups/dr-drill-<timestamp>.sql` (jika `pg_dump` tersedia).
 * 3. Menguji simulasi restore ke schema sementara `dr_drill_verify` lalu menghapus schema sementara tersebut.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sql } from '../server/db';

const execFileAsync = promisify(execFile);

const CORE_TABLES = [
  'tenants',
  'app_users',
  'projects_registry',
  'project_units',
  'pipeline_leads',
  'payment_invoices',
  'aic_ledger_entries',
  'business_audit_log',
];

async function hasBinary(bin: string): Promise<boolean> {
  try {
    await execFileAsync(bin, ['--version'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const startedAt = Date.now();
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgres://postgres:password@127.0.0.1:5433/sales_os';

  console.log('=== DEVELOPER SALES OS · DR DRILL (INF-12 / REL-02) ===');
  console.log(`Timestamp : ${new Date().toISOString()}`);

  // 1. Verifikasi konektivitas & snapshot jumlah baris tabel inti
  const tableCounts: Record<string, number> = {};
  for (const tbl of CORE_TABLES) {
    try {
      const rows = await sql.unsafe(`SELECT COUNT(*)::int AS cnt FROM sales_os.${tbl}`);
      tableCounts[tbl] = Number(rows[0]?.cnt || 0);
    } catch {
      tableCounts[tbl] = -1;
    }
  }
  console.log('Snapshot tabel inti sales_os:', JSON.stringify(tableCounts));

  const pgDumpAvailable = await hasBinary('pg_dump');
  const psqlAvailable = await hasBinary('psql');

  const backupDir = path.resolve(process.cwd(), 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpPath = path.join(backupDir, `dr-drill-${stamp}.sql`);

  if (!pgDumpAvailable) {
    console.log('\n[PERINGATAN] Binary `pg_dump` tidak ditemukan di PATH.');
    console.log('Mode fallback: mencatat snapshot verifikasi konektivitas & skema saja (belum backup SQL penuh).');
    await sql.end({ timeout: 2 });
    process.exit(2);
  }

  // 2. Backup schema sales_os
  const tDump0 = Date.now();
  await execFileAsync(
    'pg_dump',
    ['--dbname', dbUrl, '--schema=sales_os', '--no-owner', '--no-privileges', '-f', dumpPath],
    { timeout: 120_000 }
  );
  const dumpStat = await fs.stat(dumpPath);
  const dumpSec = ((Date.now() - tDump0) / 1000).toFixed(2);
  console.log(`Backup selesai : ${dumpPath} (${dumpStat.size} bytes dalam ${dumpSec}s)`);

  // 3. Uji restore non-destruktif ke schema sementara `dr_drill_verify` jika psql tersedia
  if (psqlAvailable) {
    const tRestore0 = Date.now();
    const rawSql = await fs.readFile(dumpPath, 'utf8');
    const sandboxSql = rawSql
      .replace(/CREATE SCHEMA sales_os;/g, 'CREATE SCHEMA dr_drill_verify;')
      .replace(/sales_os\./g, 'dr_drill_verify.');
    const sandboxPath = path.join(backupDir, `dr-drill-sandbox-${stamp}.sql`);
    await fs.writeFile(sandboxPath, sandboxSql, 'utf8');

    try {
      await sql.unsafe('DROP SCHEMA IF EXISTS dr_drill_verify CASCADE;');
      await execFileAsync('psql', ['--dbname', dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', sandboxPath], {
        timeout: 120_000,
      });
      const restoredCounts = await sql.unsafe('SELECT COUNT(*)::int AS cnt FROM dr_drill_verify.tenants');
      const restoreSec = ((Date.now() - tRestore0) / 1000).toFixed(2);
      console.log(
        `Restore sandbox PASS (${restoreSec}s) · dr_drill_verify.tenants = ${restoredCounts[0]?.cnt ?? 0}`
      );
    } finally {
      await sql.unsafe('DROP SCHEMA IF EXISTS dr_drill_verify CASCADE;').catch(() => {});
      await fs.unlink(sandboxPath).catch(() => {});
    }
  } else {
    console.log('[INFO] `psql` tidak ditemukan di PATH; langkah restore sandbox dilewati.');
  }

  const totalSec = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(`\nDR Drill selesai dalam ${totalSec}s. Simpan output & file ${path.basename(dumpPath)} sebagai bukti INF-12/REL-02.`);
  await sql.end({ timeout: 2 });
}

main().catch(async (err) => {
  console.error('[dr-drill] Error:', err);
  await sql.end({ timeout: 2 }).catch(() => {});
  process.exit(1);
});
