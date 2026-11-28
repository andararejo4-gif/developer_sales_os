#!/usr/bin/env bun
/**
 * Load Test Runner (QA-05)
 * Contoh:
 *   bun run scripts/load-test.ts --base-url=http://127.0.0.1:3040 --concurrency=25 --duration=15
 *   LOAD_TEST_EMAIL=admin.sales@andararejomakmur.co.id LOAD_TEST_PASSWORD=... bun run scripts/load-test.ts
 */

interface CliOptions {
  baseUrl: string;
  concurrency: number;
  durationSec: number;
  maxErrorPct: number;
  maxP95Ms: number;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const getArg = (name: string, fallback: string) => {
    const found = args.find((a) => a.startsWith(`--${name}=`));
    return found ? found.slice(name.length + 3) : fallback;
  };
  return {
    baseUrl: getArg('base-url', 'http://127.0.0.1:3040').replace(/\/+$/, ''),
    concurrency: Math.max(1, Number(getArg('concurrency', '20'))),
    durationSec: Math.max(3, Number(getArg('duration', '15'))),
    maxErrorPct: Math.max(0, Number(getArg('max-error-pct', '1'))),
    maxP95Ms: Math.max(50, Number(getArg('max-p95-ms', '1000'))),
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

async function resolveOptionalToken(baseUrl: string): Promise<string | null> {
  if (process.env.LOAD_TEST_TOKEN) return process.env.LOAD_TEST_TOKEN.trim();
  const email = process.env.LOAD_TEST_EMAIL?.trim();
  const password = process.env.LOAD_TEST_PASSWORD?.trim();
  if (!email || !password) return null;

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (res.ok && json.ok && json.token) return String(json.token);
  throw new Error(`Login gagal untuk LOAD_TEST_EMAIL (${res.status}): ${json.error || 'unknown'}`);
}

async function main() {
  const opts = parseArgs();
  const token = await resolveOptionalToken(opts.baseUrl);

  const targets: Array<{ name: string; path: string; auth?: boolean }> = [
    { name: 'public_site', path: '/api/public/site/the-park-sukoharjo' },
    { name: 'public_live', path: '/api/public/live/the-park-sukoharjo' },
  ];

  if (token) {
    targets.push(
      { name: 'connectors_health', path: '/api/connectors/health', auth: true },
      { name: 'dashboard_summary', path: '/api/dashboard/summary', auth: true },
      { name: 'billing_summary', path: '/api/billing/summary', auth: true },
      { name: 'leads_list', path: '/api/leads', auth: true }
    );
  }

  console.log('=== DEVELOPER SALES OS · LOAD TEST (QA-05) ===');
  console.log(`Target     : ${opts.baseUrl}`);
  console.log(`Concurrency: ${opts.concurrency} workers`);
  console.log(`Durasi     : ${opts.durationSec} detik`);
  console.log(`Auth       : ${token ? 'AKTIF (Bearer token)' : 'Publik saja (set LOAD_TEST_EMAIL & LOAD_TEST_PASSWORD untuk endpoint privat)'}`);
  console.log(`Ambang NFR : Error <= ${opts.maxErrorPct}% | p95 <= ${opts.maxP95Ms} ms\n`);

  const latencies: number[] = [];
  const statusCounts: Record<string, number> = {};
  let total = 0;
  let errors = 0;

  const deadline = Date.now() + opts.durationSec * 1000;
  const startedAt = Date.now();

  const workers = Array.from({ length: opts.concurrency }, (_, workerIdx) =>
    (async () => {
      let step = workerIdx;
      while (Date.now() < deadline) {
        const target = targets[step % targets.length];
        step++;
        const t0 = performance.now();
        try {
          const res = await fetch(`${opts.baseUrl}${target.path}`, {
            headers: target.auth && token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          await res.arrayBuffer();
          const dt = performance.now() - t0;
          latencies.push(dt);
          total++;
          const key = String(res.status);
          statusCounts[key] = (statusCounts[key] || 0) + 1;
          if (!res.ok) errors++;
        } catch {
          const dt = performance.now() - t0;
          latencies.push(dt);
          total++;
          errors++;
          statusCounts.NETWORK_ERR = (statusCounts.NETWORK_ERR || 0) + 1;
        }
      }
    })()
  );

  await Promise.all(workers);

  const elapsedSec = Math.max(0.001, (Date.now() - startedAt) / 1000);
  const sorted = [...latencies].sort((a, b) => a - b);
  const errorPct = total > 0 ? (errors / total) * 100 : 100;
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const maxMs = sorted[sorted.length - 1] || 0;
  const rps = total / elapsedSec;

  console.log('--- HASIL LOAD TEST ---');
  console.log(`Total Request : ${total}`);
  console.log(`Throughput    : ${rps.toFixed(1)} req/s`);
  console.log(`Error Count   : ${errors} (${errorPct.toFixed(2)}%)`);
  console.log(`Latency p50   : ${p50.toFixed(1)} ms`);
  console.log(`Latency p95   : ${p95.toFixed(1)} ms`);
  console.log(`Latency p99   : ${p99.toFixed(1)} ms`);
  console.log(`Latency Max   : ${maxMs.toFixed(1)} ms`);
  console.log(`HTTP Status   : ${JSON.stringify(statusCounts)}`);

  const pass = errorPct <= opts.maxErrorPct && p95 <= opts.maxP95Ms && total > 0;
  console.log(`\nStatus NFR    : ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error('[load-test] Error:', err);
  process.exit(1);
});
