#!/usr/bin/env bun
/**
 * Seed Data Lengkap & Idempotent untuk Database PostgreSQL Lokal (`sales_os`)
 * Mengisi tabel-tabel operasional lintas role agar tidak kosong saat login.
 */

import { sql } from '../server/db';

const TENANT_ID = 'andara_rejo_makmur';
const PROJECT_ID = 'the-park-sukoharjo';

async function countRows(table: string, whereSql = ''): Promise<number> {
  const rows = await sql.unsafe(`SELECT COUNT(*)::int AS cnt FROM sales_os.${table} ${whereSql}`);
  return Number(rows[0]?.cnt || 0);
}

async function main() {
  console.log('=== SEED LOCAL DB (sales_os) ===');
  const summary: Record<string, number> = {};

  // 1. Kampanye Iklan (DIGITAL_MARKETING)
  if ((await countRows('ad_campaigns', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.ad_campaigns (tenant_id, project_id, platform, campaign_name, spend_idr, leads_count, qualified_count, status)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, 'Meta Ads', 'The Park Sukoharjo · Keluarga Muda P1', 12500000, 74, 52, 'AKTIF'),
        (${TENANT_ID}, ${PROJECT_ID}, 'TikTok Ads', 'Tur Rumah Japandi 2 Lantai Nagoya', 8400000, 61, 39, 'AKTIF'),
        (${TENANT_ID}, ${PROJECT_ID}, 'Google Search', 'Rumah 2 Lantai Dekat The Park Solo Baru', 6200000, 38, 29, 'AKTIF')
    `;
  }
  summary.ad_campaigns = await countRows('ad_campaigns', `WHERE tenant_id = '${TENANT_ID}'`);

  // 2. Jadwal Live & Appointment (SE, SM, Website /live)
  if ((await countRows('appointments', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.appointments (tenant_id, project_id, se_email, lead_id, customer_name, customer_phone, scheduled_start, scheduled_end, status, notes, created_by)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, 'se@andararejomakmur.co.id', NULL, 'Live Tur Virtual Show Unit Nagoya B.02', '628123450001', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours', 'SCHEDULED', 'Siaran live interaktif & Q&A KPR', 'sm@andararejomakmur.co.id'),
        (${TENANT_ID}, ${PROJECT_ID}, 'raka@andararejomakmur.co.id', NULL, 'Survei Lokasi Cluster Osaka A.03', '628123450002', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 'SCHEDULED', 'Kunjungan keluarga muda P1', 'raka@andararejomakmur.co.id')
    `;
  }
  summary.appointments = await countRows('appointments', `WHERE tenant_id = '${TENANT_ID}'`);

  // 3. Pengajuan KPR Multi-Bank (ADMIN, SM, SE)
  if ((await countRows('bank_applications', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.bank_applications (tenant_id, project_id, lead_id, owner_se_email, applicant_name, applicant_phone, unit_code, cluster, target_bank, plafond_amount, status, status_notes, source_mode)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, NULL, 'raka@andararejomakmur.co.id', 'Alexander III', '6281122334455', 'Nagoya B.02', 'Nagoya', 'Bank BTN Syariah', 580000000, 'APPRAISAL', 'Menunggu jadwal appraisal NJOP', 'SEED_LOCAL'),
        (${TENANT_ID}, ${PROJECT_ID}, NULL, 'se@andararejomakmur.co.id', 'Budi Santoso', '6281199887766', 'Tokyo B.03', 'Tokyo', 'Bank Mandiri', 660000000, 'SLIK_CHECK', 'Berkas SLIK OJK bersih', 'SEED_LOCAL')
    `;
  }
  summary.bank_applications = await countRows('bank_applications', `WHERE tenant_id = '${TENANT_ID}'`);

  // 4. Vault Dokumen KPR (SE -> ADMIN)
  if ((await countRows('vault_documents', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.vault_documents (tenant_id, project_id, lead_id, owner_se_email, lead_name, unit_interest, doc_type, file_name, file_size, status, access_granted_banks)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, NULL, 'raka@andararejomakmur.co.id', 'Alexander III', 'Nagoya B.02', 'KTP_NPWP', 'ktp-npwp-alexander.pdf', '1.2 MB', 'TERVERIFIKASI', '["Bank BTN Syariah"]'::jsonb),
        (${TENANT_ID}, ${PROJECT_ID}, NULL, 'se@andararejomakmur.co.id', 'Budi Santoso', 'Tokyo B.03', 'REKENING_KORAN', 'rek-koran-3bln-budi.pdf', '2.1 MB', 'PERLU_REVIEW', '["Bank Mandiri"]'::jsonb)
    `;
  }
  summary.vault_documents = await countRows('vault_documents', `WHERE tenant_id = '${TENANT_ID}'`);

  // 5. Keluhan & Garansi BAST (ADMIN, SM, SE)
  if ((await countRows('complaint_tickets', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.complaint_tickets (tenant_id, project_id, ticket_no, unit_block, resident_name, resident_phone, category, description, dlp_expiry_date, status, technician_assigned, created_by)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, 'CMP-2026-001', 'Nagoya B.01', 'Hendra Wijaya', '6281234567890', 'FISIK_ATAP_BOCOR', 'Rembesan ringan di area dak kanopi belakang saat hujan deras.', '2027-06-30', 'DIPROSES_TEKNISI', 'Tim Sipil Lapangan', 'admin.sales@andararejomakmur.co.id'),
        (${TENANT_ID}, ${PROJECT_ID}, 'CMP-2026-002', 'Osaka A.02', 'Dewi Lestari', '6281398765432', 'LISTRIK_AIR', 'Pengecekan tekanan pompa air lantai 2.', '2027-08-15', 'TIKET_BARU', NULL, 'se@andararejomakmur.co.id')
    `;
  }
  summary.complaint_tickets = await countRows('complaint_tickets', `WHERE tenant_id = '${TENANT_ID}'`);

  // 6. Kreator, Karya F104, Ledger Kantong A/B & SmartLinks /c/:code
  if ((await countRows('creator_profiles', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.creator_profiles (tenant_id, project_id, creator_code, full_name, role_type, platform, social_handle, phone_wa, monthly_cap_idr)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, 'AC-NANDA', 'Nanda Clipper Properti', 'AFILIATOR_CLIPPER', 'TikTok', '@nandaproperti.solo', '6285611223344', 3000000),
        (${TENANT_ID}, ${PROJECT_ID}, 'AL-RINA', 'Rina Live Host', 'AFILIATOR_LIVE', 'TikTok', '@rinahost.solobaru', '6285744556677', 4000000)
    `;
  }
  if ((await countRows('creator_content_metrics', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.creator_content_metrics (tenant_id, project_id, creator_code, content_code, content_type, content_url, raw_views, verified_views, session_minutes, audit_status, audit_notes, gross_amount_idr, capped_amount_idr, verified_by, verified_at)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, 'AC-NANDA', 'tpth-clip-01', 'KLIP', 'https://tiktok.com/@nandaproperti.solo/video/1', 28500, 28500, 0, 'VERIFIED', 'Lolos audit 7 hari (F104)', 250000, 250000, 'sm@andararejomakmur.co.id', NOW()),
        (${TENANT_ID}, ${PROJECT_ID}, 'AL-RINA', 'tpth-live-01', 'LIVE', 'https://tiktok.com/@rinahost.solobaru/live/1', 4200, 4200, 120, 'UNDER_REVIEW', 'Menunggu audit 7 hari (F104)', 0, 0, NULL, NULL)
    `;
  }
  if ((await countRows('creator_ledger_entries', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.creator_ledger_entries (tenant_id, project_id, creator_code, pocket, entry_type, reference_id, description, gross_amount_idr, tax_pph_idr, net_amount_idr, status)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, 'AC-NANDA', 'A', 'CPM', 'tpth-clip-01', 'Verifikasi KLIP (tpth-clip-01)', 250000, 6250, 243750, 'ACCRUED')
    `;
  }
  if ((await countRows('smart_links', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.smart_links (tenant_id, project_id, short_code, partner_role, creator_code, content_code, persona_code, target_url, click_count, created_by)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, 'nanda-keluarga', 'AFILIATOR_CLIPPER', 'AC-NANDA', 'tpth-clip-01', 'keluarga', '/site/the-park-sukoharjo?p=keluarga&k=AC-NANDA&c=tpth-clip-01', 18, 'sm@andararejomakmur.co.id'),
        (${TENANT_ID}, ${PROJECT_ID}, 'rina-live', 'AFILIATOR_LIVE', 'AL-RINA', 'tpth-live-01', 'profesional', '/site/the-park-sukoharjo?p=profesional&k=AL-RINA&c=tpth-live-01', 11, 'sm@andararejomakmur.co.id')
    `;
  }
  summary.creator_profiles = await countRows('creator_profiles', `WHERE tenant_id = '${TENANT_ID}'`);
  summary.smart_links = await countRows('smart_links', `WHERE tenant_id = '${TENANT_ID}'`);

  // 7. Transaksi & Invoice (ADMIN & DIREKSI)
  const planInvCount = await countRows('payment_invoices', `WHERE tenant_id = '${TENANT_ID}' AND invoice_type = 'PLAN_SUBSCRIPTION'`);
  if (planInvCount === 0) {
    await sql`
      INSERT INTO sales_os.payment_invoices (tenant_id, project_id, invoice_no, provider, invoice_type, reference_code, description, amount_idr, aic_amount, customer_name, status, checkout_url, paid_at, created_by)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, 'INV-PLAN-SEED-001', 'SANDBOX_DUMMY_PG', 'PLAN_SUBSCRIPTION', 'PLAN-PLATINUM', 'Aktivasi Paket Platinum · 3 Bulan (PT Andara Rejo Makmur)', 9900000, 5000, 'PT Andara Rejo Makmur', 'PAID', '/api/payments/sandbox-checkout/INV-PLAN-SEED-001', NOW() - INTERVAL '3 days', 'direksi@andararejomakmur.co.id'),
        (${TENANT_ID}, ${PROJECT_ID}, 'INV-BKG-SEED-001', 'SANDBOX_DUMMY_PG', 'BOOKING_FEE', 'BOOKING-NAGOYA-B02', 'Booking Fee Unit Nagoya B.02 (Alexander III)', 5000000, 0, 'Alexander III', 'PENDING', '/api/payments/sandbox-checkout/INV-BKG-SEED-001', NULL, 'admin.sales@andararejomakmur.co.id')
      ON CONFLICT (invoice_no) DO NOTHING
    `;
  }
  summary.payment_invoices = await countRows('payment_invoices', `WHERE tenant_id = '${TENANT_ID}'`);

  // 8. Eskalasi Diskon (SM -> DIREKSI)
  if ((await countRows('escalation_requests', `WHERE tenant_id = '${TENANT_ID}'`)) === 0) {
    await sql`
      INSERT INTO sales_os.escalation_requests (tenant_id, project_id, jenis, pembeli, unit, proyek, nilai, rekomendasi_ai, requested_by)
      VALUES
        (${TENANT_ID}, ${PROJECT_ID}, 'DISKON_MARGIN', 'Budi Santoso', 'Tokyo B.03', 'The Park Townhouse Sukoharjo', 'Rp 15.000.000 (Cash Tempo 18x)', 'Margin tetap aman di atas floor price; pembeli siap DP 30% minggu ini.', 'sm@andararejomakmur.co.id')
    `;
  }
  summary.escalation_requests = await countRows('escalation_requests', `WHERE tenant_id = '${TENANT_ID}'`);

  // 9. Absensi Lapangan SE Hari Ini (agar halaman Absen di DB tidak kosong)
  const todayLogs = await countRows('se_field_logs', `WHERE created_at::date = CURRENT_DATE`);
  if (todayLogs === 0) {
    await sql`
      INSERT INTO sales_os.se_field_logs (se_email, se_name, log_type, title, location_label, lat, lng, notes, payload)
      VALUES
        ('raka@andararejomakmur.co.id', 'Raka Pratama', 'CHECK_IN', 'Absen Masuk Lapangan', 'Cluster Nagoya · The Park Sukoharjo', -7.67387, 110.84398, 'Briefing pagi & persiapan show unit', '{"source":"seed_local_db"}'::jsonb),
        ('se@andararejomakmur.co.id', 'Sinta Permata', 'CHECK_IN', 'Absen Masuk Lapangan', 'Koridor Jl. Jenderal Sudirman, Sukoharjo', -7.67030, 110.83933, 'Canvasing area perkantoran Solo Baru', '{"source":"seed_local_db"}'::jsonb)
    `;
  }
  summary.se_field_logs_today = await countRows('se_field_logs', `WHERE created_at::date = CURRENT_DATE`);

  console.log('Seed selesai:', JSON.stringify(summary, null, 2));
  await sql.end({ timeout: 2 });
}

main().catch(async (err) => {
  console.error('[seed-local-db] Error:', err);
  await sql.end({ timeout: 2 }).catch(() => {});
  process.exit(1);
});
