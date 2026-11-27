-- Migration 0037: Daily manual activities for office/non-lead tasks (SE, SM, and other roles)
CREATE SCHEMA IF NOT EXISTS sales_os;

CREATE TABLE IF NOT EXISTS sales_os.daily_manual_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'Kantor / Administrasi',
  activity_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_manual_activities_lookup
  ON sales_os.daily_manual_activities (tenant_id, user_email, activity_date DESC);
