import postgres from 'postgres';

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    /* abaikan bila file .env tidak tersedia */
  }
}

const dbUrl =
  process.env.DATABASE_URL ||
  'postgres://postgres:password@127.0.0.1:5433/sales_os';

export const sql = postgres(dbUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
