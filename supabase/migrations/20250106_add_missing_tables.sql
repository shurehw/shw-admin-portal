-- Add Missing CRM Tables
-- ======================
-- This creates the association and utility tables that were missing

-- 1) Association tables (many-to-many relationships)
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

-- 2) Audit log table
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

-- 3) Custom field definitions
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

-- 4) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_contacts_org ON company_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_contact ON company_contacts(contact_id);

CREATE INDEX IF NOT EXISTS idx_deal_contacts_org ON deal_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_deal ON deal_contacts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_contact ON deal_contacts(contact_id);

CREATE INDEX IF NOT EXISTS idx_deal_companies_org ON deal_companies(org_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_deal ON deal_companies(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_company ON deal_companies(company_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(org_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(org_id, created_at DESC);

-- Custom field definitions index
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_field_definitions(org_id, entity_type);

-- 5) Add updated_at trigger for custom field definitions
CREATE TRIGGER update_custom_field_definitions_updated_at 
  BEFORE UPDATE ON custom_field_definitions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();