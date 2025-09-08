-- Complete Association Tables Creation
-- ====================================

-- 1) Complete the company_contacts table (already exists from test)
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS contact_id uuid;
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- 2) Deal-Contact associations  
CREATE TABLE IF NOT EXISTS deal_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  deal_id uuid,
  contact_id uuid,
  role text,
  is_influencer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3) Deal-Company associations
CREATE TABLE IF NOT EXISTS deal_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  deal_id uuid,
  company_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 4) Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  user_id uuid,
  entity_type text,
  entity_id uuid,
  action text,
  changes jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- 5) Custom field definitions
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  entity_type text,
  field_name text,
  field_label text,
  field_type text,
  options jsonb,
  is_required boolean DEFAULT false,
  is_unique boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6) Set default org_id for any existing records
UPDATE company_contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE deal_contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE deal_companies SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE audit_logs SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE custom_field_definitions SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;

-- 7) Create basic indexes
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_contact ON company_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_org ON company_contacts(org_id);

CREATE INDEX IF NOT EXISTS idx_deal_contacts_deal ON deal_contacts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_contact ON deal_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_org ON deal_contacts(org_id);

CREATE INDEX IF NOT EXISTS idx_deal_companies_deal ON deal_companies(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_company ON deal_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_org ON deal_companies(org_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_field_definitions(entity_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_org ON custom_field_definitions(org_id);

-- 8) Success message
SELECT 'All association tables created successfully' as status;