-- Create Association Tables Only
-- ================================
-- This creates just the essential association tables without constraints

-- 1) Company-Contact associations
CREATE TABLE IF NOT EXISTS company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2) Deal-Contact associations  
CREATE TABLE IF NOT EXISTS deal_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  role text,
  is_influencer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3) Deal-Company associations
CREATE TABLE IF NOT EXISTS deal_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  company_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4) Audit logs (simple version)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  changes jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- 5) Custom field definitions (simple version)
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL,
  options jsonb,
  is_required boolean DEFAULT false,
  is_unique boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6) Add org_id columns to all new tables
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE deal_contacts ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE deal_companies ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE custom_field_definitions ADD COLUMN IF NOT EXISTS org_id uuid;

-- 7) Set default org_id for any existing records
UPDATE company_contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE deal_contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE deal_companies SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE audit_logs SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE custom_field_definitions SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;

-- 8) Create basic indexes
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_contact ON company_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_deal ON deal_contacts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_contact ON deal_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_deal ON deal_companies(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_company ON deal_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_field_definitions(entity_type);