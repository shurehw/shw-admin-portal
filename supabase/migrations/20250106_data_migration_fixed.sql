-- Data Migration Script (Fixed)
-- ==============================

-- 1) Create default organization (if not exists)
INSERT INTO orgs (id, name, created_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid, 
  'Shure Hardware', 
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2) Migrate existing data to have org_id
UPDATE companies 
SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
WHERE org_id IS NULL;

UPDATE contacts 
SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE org_id IS NULL;

-- Set default lifecycle_stage for contacts that don't have one
UPDATE contacts 
SET lifecycle_stage = 'lead'
WHERE lifecycle_stage IS NULL;

UPDATE deals 
SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
WHERE org_id IS NULL;

UPDATE tasks 
SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
WHERE org_id IS NULL;

UPDATE activities 
SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
WHERE org_id IS NULL;

UPDATE tickets 
SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
WHERE org_id IS NULL;

UPDATE pipelines 
SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
WHERE org_id IS NULL;

-- 3) Create a default sales pipeline if none exists
INSERT INTO pipelines (org_id, name, stages, is_default, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Sales Pipeline',
  '[
    {"name": "Lead", "probability": 10},
    {"name": "Qualified", "probability": 20},
    {"name": "Proposal", "probability": 50},
    {"name": "Negotiation", "probability": 75},
    {"name": "Closed Won", "probability": 100},
    {"name": "Closed Lost", "probability": 0}
  ]'::jsonb,
  true,
  now()
) ON CONFLICT DO NOTHING;

-- 4) Create some sample data if tables are empty
DO $$
DECLARE
  sample_company_id uuid;
  sample_contact_id uuid;
  sample_deal_id uuid;
BEGIN
  -- Create sample company if companies table is empty
  IF NOT EXISTS (SELECT 1 FROM companies LIMIT 1) THEN
    INSERT INTO companies (org_id, name, industry, size, website, description)
    VALUES (
      '550e8400-e29b-41d4-a716-446655440000'::uuid,
      'Acme Corporation',
      'Technology',
      '50-200',
      'https://acme.com',
      'Sample technology company for testing'
    ) RETURNING id INTO sample_company_id;
    
    -- Create sample contact
    INSERT INTO contacts (org_id, email, first_name, last_name, title, company_id, lifecycle_stage)
    VALUES (
      '550e8400-e29b-41d4-a716-446655440000'::uuid,
      'john.doe@acme.com',
      'John',
      'Doe',
      'CEO',
      sample_company_id,
      'lead'
    ) RETURNING id INTO sample_contact_id;
    
    -- Create sample deal
    INSERT INTO deals (org_id, name, amount, stage, probability, contact_id, company_id, description)
    VALUES (
      '550e8400-e29b-41d4-a716-446655440000'::uuid,
      'Acme Hardware Solution',
      50000.00,
      'qualified',
      20,
      sample_contact_id,
      sample_company_id,
      'Enterprise hardware solution for Acme Corporation'
    );
  END IF;
END $$;

-- 5) Success message
SELECT 
  (SELECT COUNT(*) FROM companies) as companies_count,
  (SELECT COUNT(*) FROM contacts) as contacts_count,
  (SELECT COUNT(*) FROM deals) as deals_count,
  (SELECT COUNT(*) FROM pipelines) as pipelines_count,
  'Data migration completed successfully' as status;