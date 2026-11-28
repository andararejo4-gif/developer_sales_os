-- Migration 0038: Enable PostgreSQL Row-Level Security (RLS) and tenant isolation policies
-- Uses current_setting('app.current_tenant_id', true) so scoped transactions enforce strict tenant isolation
-- while existing unscoped system/migration queries continue to operate cleanly when setting is unset/empty.

CREATE SCHEMA IF NOT EXISTS sales_os;

DO $$
DECLARE
  tbl TEXT;
  target_tables TEXT[] := ARRAY[
    'pipeline_leads',
    'daily_manual_activities',
    'project_units',
    'bank_applications',
    'vault_documents',
    'company_bank_accounts',
    'tenant_workspace_items',
    'appointments',
    'aic_ledger_entries',
    'ai_observability_events',
    'source_documents',
    'evidence_facts'
  ];
BEGIN
  FOREACH tbl IN ARRAY target_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'sales_os' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE sales_os.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON sales_os.%I', tbl);
      EXECUTE format(
        'CREATE POLICY tenant_isolation_policy ON sales_os.%I USING (COALESCE(NULLIF(current_setting(''app.current_tenant_id'', true), ''''), tenant_id) = tenant_id) WITH CHECK (COALESCE(NULLIF(current_setting(''app.current_tenant_id'', true), ''''), tenant_id) = tenant_id)',
        tbl
      );
    END IF;
  END LOOP;
END $$;
