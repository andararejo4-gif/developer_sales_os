-- Migration 0035: Multi-Tenant Registry, Project Slug Routing & Onboarding Sessions
CREATE SCHEMA IF NOT EXISTS sales_os;

CREATE TABLE IF NOT EXISTS sales_os.tenants (
  tenant_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  plan_code TEXT NOT NULL DEFAULT 'platinum' CHECK (plan_code IN ('gold', 'platinum', 'diamond')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED')),
  owner_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_os.projects_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES sales_os.tenants(tenant_id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  developer_name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  location_label TEXT NOT NULL DEFAULT '',
  cluster_coords JSONB NOT NULL DEFAULT '[]'::jsonb,
  facilities TEXT NOT NULL DEFAULT '',
  love_letter_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_projects_registry_slug ON sales_os.projects_registry (slug);

CREATE TABLE IF NOT EXISTS sales_os.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selected_plan TEXT NOT NULL DEFAULT 'platinum' CHECK (selected_plan IN ('gold', 'platinum', 'diamond')),
  company_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  facilities TEXT NOT NULL DEFAULT '',
  cluster_coords JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_text TEXT NOT NULL DEFAULT '',
  extracted_units JSONB NOT NULL DEFAULT '[]'::jsonb,
  love_letter_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  invoice_no TEXT,
  activated_tenant_id TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'EXTRACTED', 'INVOICED', 'ACTIVATED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO sales_os.tenants (tenant_id, company_name, plan_code, status, owner_email)
VALUES ('andara_rejo_makmur', 'PT Andara Rejo Makmur', 'platinum', 'ACTIVE', 'it@andararejomakmur.co.id')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO sales_os.projects_registry (
  tenant_id, project_id, slug, project_name, developer_name, city, province, location_label
) VALUES (
  'andara_rejo_makmur',
  'the-park-sukoharjo',
  'the-park-sukoharjo',
  'The Park Townhouse Sukoharjo',
  'PT Andara Rejo Makmur',
  'Sukoharjo',
  'Jawa Tengah',
  'Jl. Bhayangkara, Sukoharjo (Belakang Alun-alun)'
)
ON CONFLICT (slug) DO NOTHING;
