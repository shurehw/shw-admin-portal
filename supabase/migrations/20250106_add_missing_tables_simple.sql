-- Add Missing CRM Tables (Simple Version)
-- ========================================
-- This creates the association and utility tables without assuming org_id exists everywhere

-- 1) Association tables (many-to-many relationships)
-- Note: We'll add org_id later once we're sure all tables have it

CREATE TABLE IF NOT EXISTS company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints only if the referenced tables exist
DO $$
BEGIN
  -- Add company_id foreign key if companies table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
    -- Only add constraint if it doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'company_contacts_company_id_fkey' 
      AND table_name = 'company_contacts'
    ) THEN
      ALTER TABLE company_contacts ADD CONSTRAINT company_contacts_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Add contact_id foreign key if contacts table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'company_contacts_contact_id_fkey' 
      AND table_name = 'company_contacts'
    ) THEN
      ALTER TABLE company_contacts ADD CONSTRAINT company_contacts_contact_id_fkey 
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS deal_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  role text,
  is_influencer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  company_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2) Audit log table
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

-- 3) Custom field definitions
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'boolean', 'url', 'email')),
  options jsonb,
  is_required boolean DEFAULT false,
  is_unique boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4) Now add org_id columns to the new tables
DO $$
BEGIN
  -- Add org_id to company_contacts
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'company_contacts' AND column_name = 'org_id') THEN
    ALTER TABLE company_contacts ADD COLUMN org_id uuid;
    -- Set default value
    UPDATE company_contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
  END IF;
  
  -- Add org_id to deal_contacts
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_contacts' AND column_name = 'org_id') THEN
    ALTER TABLE deal_contacts ADD COLUMN org_id uuid;
    UPDATE deal_contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
  END IF;
  
  -- Add org_id to deal_companies
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_companies' AND column_name = 'org_id') THEN
    ALTER TABLE deal_companies ADD COLUMN org_id uuid;
    UPDATE deal_companies SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
  END IF;
  
  -- Add org_id to audit_logs
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'org_id') THEN
    ALTER TABLE audit_logs ADD COLUMN org_id uuid;
    UPDATE audit_logs SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
  END IF;
  
  -- Add org_id to custom_field_definitions
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'custom_field_definitions' AND column_name = 'org_id') THEN
    ALTER TABLE custom_field_definitions ADD COLUMN org_id uuid;
    UPDATE custom_field_definitions SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
  END IF;
END $$;

-- 5) Add unique constraints with org_id
DO $$
BEGIN
  -- Add unique constraint to company_contacts if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'company_contacts_org_company_contact_key' 
    AND table_name = 'company_contacts'
  ) THEN
    ALTER TABLE company_contacts ADD CONSTRAINT company_contacts_org_company_contact_key 
      UNIQUE(org_id, company_id, contact_id);
  END IF;
  
  -- Add unique constraint to custom_field_definitions if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'custom_field_definitions_org_entity_field_key' 
    AND table_name = 'custom_field_definitions'
  ) THEN
    ALTER TABLE custom_field_definitions ADD CONSTRAINT custom_field_definitions_org_entity_field_key 
      UNIQUE(org_id, entity_type, field_name);
  END IF;
END $$;

-- 6) Create basic indexes
CREATE INDEX IF NOT EXISTS idx_company_contacts_company ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_contact ON company_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_deal ON deal_contacts(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_contacts_contact ON deal_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_deal ON deal_companies(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_companies_company ON deal_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity ON custom_field_definitions(entity_type);