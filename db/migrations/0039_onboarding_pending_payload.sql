-- Migration 0039: Store pending owner activation payload on onboarding_sessions until payment is PAID
ALTER TABLE sales_os.onboarding_sessions
  ADD COLUMN IF NOT EXISTS pending_owner_payload JSONB;
