-- CRM Base Tables Creation
-- ========================
-- This migration creates all the base tables needed for the CRM

-- 1) Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for similarity search

-- 2) Organizations table
CREATE TABLE IF NOT EXISTS orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Organization users (maps auth users to orgs)
CREATE TABLE IF NOT EXISTS org_users (
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- 4) Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  domain text,
  industry text,
  size text,
  website text,
  description text,
  owner_id uuid,
  deleted_at timestamptz,
  custom jsonb DEFAULT '{}'::jsonb,
  search_vector tsvector,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5) Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  title text,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  lifecycle_stage text DEFAULT 'lead',
  owner_id uuid,
  deleted_at timestamptz,
  custom jsonb DEFAULT '{}'::jsonb,
  search_vector tsvector,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6) Pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7) Deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric(15,2),
  stage text DEFAULT 'lead',
  pipeline_id uuid REFERENCES pipelines(id) ON DELETE SET NULL,
  probability integer DEFAULT 0,
  expected_close_date date,
  close_date date,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  description text,
  owner_id uuid,
  deleted_at timestamptz,
  custom jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8) Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  assigned_to uuid,
  owner_id uuid,
  deleted_at timestamptz,
  custom jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9) Activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('call', 'email_in', 'email_out', 'meeting', 'note', 'sms_in', 'sms_out', 'task')),
  subject text,
  description text,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  direction text CHECK (direction IN ('in', 'out')),
  via text,
  external_id text,
  thread_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  owner_id uuid,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10) Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  subject text NOT NULL,
  description text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'open', 'pending', 'solved', 'closed')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to uuid,
  sla_due timestamptz,
  owner_id uuid,
  deleted_at timestamptz,
  custom jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11) Association tables (many-to-many relationships)
CREATE TABLE IF NOT EXISTS company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, company_id, contact_id)
);

CREATE TABLE IF NOT EXISTS deal_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role text,
  is_influencer boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, deal_id, contact_id)
);

CREATE TABLE IF NOT EXISTS deal_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, deal_id, company_id)
);

-- 12) Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  changes jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- 13) Custom field definitions
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  entity_type text NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'boolean', 'url', 'email')),
  options jsonb,
  is_required boolean DEFAULT false,
  is_unique boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, entity_type, field_name)
);

-- 14) Create indexes for performance
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

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(org_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(org_id, created_at DESC);

-- 15) Update search vectors (triggers)
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

-- 16) Add updated_at triggers
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
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_field_definitions_updated_at BEFORE UPDATE ON custom_field_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();