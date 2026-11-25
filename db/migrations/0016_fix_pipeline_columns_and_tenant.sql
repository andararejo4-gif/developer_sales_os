-- Kolom yang dipakai kode (lead pool & screening) tetapi belum ada di database lama,
-- dan penyeragaman tenant_id lead dengan nilai yang dipakai kode ('andara_rejo_makmur').
ALTER TABLE sales_os.pipeline_leads
  ADD COLUMN IF NOT EXISTS lead_quality TEXT NOT NULL DEFAULT 'WARM',
  ADD COLUMN IF NOT EXISTS spam_reason TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_in_pool BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pool_reason TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

UPDATE sales_os.pipeline_leads SET last_activity_at = updated_at WHERE last_activity_at IS NULL;

ALTER TABLE sales_os.pipeline_leads ALTER COLUMN last_activity_at SET DEFAULT NOW();

ALTER TABLE sales_os.company_bank_accounts ADD COLUMN IF NOT EXISTS created_by TEXT;

ALTER TABLE sales_os.pipeline_leads ALTER COLUMN tenant_id SET DEFAULT 'andara_rejo_makmur';

UPDATE sales_os.pipeline_leads SET tenant_id = 'andara_rejo_makmur' WHERE tenant_id = 'pt-andara-rejo-makmur';
