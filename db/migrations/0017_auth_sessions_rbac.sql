-- Migration 0017: Server-side Auth, Sessions & RBAC (F91)
CREATE TABLE IF NOT EXISTS sales_os.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
  project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
  phone TEXT,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_tenant_role
  ON sales_os.app_users (tenant_id, role);

CREATE TABLE IF NOT EXISTS sales_os.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sales_os.app_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token_active
  ON sales_os.user_sessions (token_hash)
  WHERE revoked_at IS NULL;
