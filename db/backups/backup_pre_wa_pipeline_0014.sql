-- ============================================================================
-- BACKUP PRE MIGRATION 0014: PRODUCTION PIPELINE, WA BAILEYS & AI LEAD ENGINE
-- Sesuai aturan AGENTS.md Bagian 5.2 (Backup wajib sebelum menambah tabel/migrasi)
-- ============================================================================
-- Snapshot penanda skema sebelum penambahan tabel 0014_production_pipeline_wa_ai.sql
SELECT NOW() AS backup_timestamp, 'pre_0014_production_pipeline_wa_ai' AS backup_tag;
