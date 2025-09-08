-- Create Basic Association Tables
-- ================================

-- 1) Company-Contact associations
CREATE TABLE IF NOT EXISTS company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  company_id uuid,
  contact_id uuid,
  role text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

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

-- Set default org_id for any records
UPDATE company_contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE deal_contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE deal_companies SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE audit_logs SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE custom_field_definitions SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;