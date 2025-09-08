-- Simple Tables Only - No problematic columns
-- ===========================================

-- 1) Complete the company_contacts table (already exists from test)
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS contact_id uuid;
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- 2) Deal-Contact associations  
CREATE TABLE IF NOT EXISTS deal_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  deal_id uuid,
  contact_id uuid,
  role text,
  is_influencer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3) Deal-Company associations
CREATE TABLE IF NOT EXISTS deal_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
  deal_id uuid,
  company_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 4) Skip audit_logs and custom_field_definitions for now - they seem to have trigger issues
-- We'll add them later after RLS is set up

-- 5) Update existing company_contacts records
UPDATE company_contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;

-- 6) Create basic indexes
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_contact ON company_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_deal ON deal_contacts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_contact ON deal_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_deal ON deal_companies(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_company ON deal_companies(company_id);

-- 7) Success message
SELECT 'Essential association tables created successfully' as status;