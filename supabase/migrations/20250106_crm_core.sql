-- CRM Core Tables with Multi-tenant Support
-- =============================================

-- 1) Enable necessary extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm; -- for similarity search

-- 2) Organizations table
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) Organization users (maps auth users to orgs)
create table if not exists org_users (
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  permissions jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (org_id, user_id)
);

-- 4) Add multi-tenant columns to existing tables
DO $$ 
BEGIN
  -- Companies
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
    ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS org_id uuid,
      ADD COLUMN IF NOT EXISTS owner_id uuid,
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
      ADD COLUMN IF NOT EXISTS custom jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS search_vector tsvector;
  END IF;

  -- Contacts
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts') THEN
    ALTER TABLE contacts 
      ADD COLUMN IF NOT EXISTS org_id uuid,
      ADD COLUMN IF NOT EXISTS owner_id uuid,
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
      ADD COLUMN IF NOT EXISTS custom jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS lifecycle_stage text DEFAULT 'lead',
      ADD COLUMN IF NOT EXISTS search_vector tsvector;
  END IF;

  -- Deals
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deals') THEN
    ALTER TABLE deals 
      ADD COLUMN IF NOT EXISTS org_id uuid,
      ADD COLUMN IF NOT EXISTS owner_id uuid,
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
      ADD COLUMN IF NOT EXISTS custom jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS expected_close_date date,
      ADD COLUMN IF NOT EXISTS pipeline_id uuid;
  END IF;

  -- Tasks
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
    ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS org_id uuid,
      ADD COLUMN IF NOT EXISTS owner_id uuid,
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
      ADD COLUMN IF NOT EXISTS custom jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Activities
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities') THEN
    ALTER TABLE activities 
      ADD COLUMN IF NOT EXISTS org_id uuid,
      ADD COLUMN IF NOT EXISTS owner_id uuid,
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
      ADD COLUMN IF NOT EXISTS direction text,
      ADD COLUMN IF NOT EXISTS via text,
      ADD COLUMN IF NOT EXISTS external_id text,
      ADD COLUMN IF NOT EXISTS thread_id text,
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Tickets
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
    ALTER TABLE tickets 
      ADD COLUMN IF NOT EXISTS org_id uuid,
      ADD COLUMN IF NOT EXISTS owner_id uuid,
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
      ADD COLUMN IF NOT EXISTS custom jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 5) Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  stages jsonb not null default '[]'::jsonb,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6) Association tables (many-to-many relationships)
CREATE TABLE IF NOT EXISTS company_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  company_id uuid not null references companies(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  role text,
  is_primary boolean default false,
  created_at timestamptz default now(),
  unique(org_id, company_id, contact_id)
);

CREATE TABLE IF NOT EXISTS deal_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  deal_id uuid not null references deals(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  role text,
  is_influencer boolean default false,
  created_at timestamptz default now(),
  unique(org_id, deal_id, contact_id)
);

CREATE TABLE IF NOT EXISTS deal_companies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  deal_id uuid not null references deals(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz default now(),
  unique(org_id, deal_id, company_id)
);

-- 7) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_org_id ON companies(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_org_id ON deals(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_org_id ON activities(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(org_id) WHERE deleted_at IS NULL;

-- Custom field GIN indexes
CREATE INDEX IF NOT EXISTS idx_companies_custom ON companies USING gin(custom);
CREATE INDEX IF NOT EXISTS idx_contacts_custom ON contacts USING gin(custom);
CREATE INDEX IF NOT EXISTS idx_deals_custom ON deals USING gin(custom);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING gin(search_vector);

-- Lifecycle stage index
CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle ON contacts(org_id, lifecycle_stage) WHERE deleted_at IS NULL;

-- Deal pipeline indexes
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON deals(org_id, pipeline_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(org_id, expected_close_date) WHERE deleted_at IS NULL;

-- Activity thread index
CREATE INDEX IF NOT EXISTS idx_activities_thread ON activities(org_id, thread_id) WHERE thread_id IS NOT NULL;

-- 8) Update search vectors (triggers)
CREATE OR REPLACE FUNCTION update_contact_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', 
    coalesce(NEW.first_name, '') || ' ' || 
    coalesce(NEW.last_name, '') || ' ' || 
    coalesce(NEW.email, '') || ' ' ||
    coalesce(NEW.phone, '') || ' ' ||
    coalesce(NEW.title, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_company_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', 
    coalesce(NEW.name, '') || ' ' || 
    coalesce(NEW.domain, '') || ' ' ||
    coalesce(NEW.industry, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_contact_search ON contacts;
CREATE TRIGGER trigger_update_contact_search 
  BEFORE INSERT OR UPDATE ON contacts 
  FOR EACH ROW EXECUTE FUNCTION update_contact_search_vector();

DROP TRIGGER IF EXISTS trigger_update_company_search ON companies;
CREATE TRIGGER trigger_update_company_search 
  BEFORE INSERT OR UPDATE ON companies 
  FOR EACH ROW EXECUTE FUNCTION update_company_search_vector();

-- 9) Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  changes jsonb,
  metadata jsonb,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(org_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(org_id, created_at DESC);

-- 10) Custom fields metadata
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  entity_type text not null,
  field_name text not null,
  field_label text not null,
  field_type text not null, -- text, number, date, select, multiselect, boolean
  options jsonb, -- for select/multiselect
  is_required boolean default false,
  is_unique boolean default false,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, entity_type, field_name)
);

-- 11) Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON orgs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_users_updated_at BEFORE UPDATE ON org_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_field_definitions_updated_at BEFORE UPDATE ON custom_field_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();