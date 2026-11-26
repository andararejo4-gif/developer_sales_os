-- Migration 0021: 2FA TOTP (Google Authenticator) & Profile Settings
ALTER TABLE sales_os.app_users
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS totp_last_used_step BIGINT,
  ADD COLUMN IF NOT EXISTS recovery_codes_hash JSONB NOT NULL DEFAULT '[]'::jsonb;
