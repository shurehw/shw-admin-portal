-- Fix Core Tables - Ensure all required columns exist
-- ====================================================

-- First, let's make sure all the core tables exist with proper structure
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
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

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  title text,
  company_id uuid,
  lifecycle_stage text DEFAULT 'lead',
  owner_id uuid,
  deleted_at timestamptz,
  custom jsonb DEFAULT '{}'::jsonb,
  search_vector tsvector,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  name text NOT NULL,
  amount numeric(15,2),
  stage text DEFAULT 'lead',
  pipeline_id uuid,
  probability integer DEFAULT 0,
  expected_close_date date,
  close_date date,
  contact_id uuid,
  company_id uuid,
  description text,
  owner_id uuid,
  deleted_at timestamptz,
  custom jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  title text NOT NULL,
  description text,
  due_date date,
  priority text DEFAULT 'normal',
  status text DEFAULT 'open',
  contact_id uuid,
  company_id uuid,
  deal_id uuid,
  assigned_to uuid,
  owner_id uuid,
  deleted_at timestamptz,
  custom jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  type text NOT NULL,
  subject text,
  description text,
  contact_id uuid,
  company_id uuid,
  deal_id uuid,
  direction text,
  via text,
  external_id text,
  thread_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  owner_id uuid,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  subject text NOT NULL,
  description text,
  status text DEFAULT 'new',
  priority text DEFAULT 'normal',
  company_id uuid,
  contact_id uuid,
  assigned_to uuid,
  sla_due timestamptz,
  owner_id uuid,
  deleted_at timestamptz,
  custom jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  name text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Now ensure all columns exist (add them if missing)
DO $$ 
BEGIN
  -- Companies
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'org_id') THEN
    ALTER TABLE companies ADD COLUMN org_id uuid;
  END IF;
  
  -- Contacts  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'org_id') THEN
    ALTER TABLE contacts ADD COLUMN org_id uuid;
  END IF;
  
  -- Deals
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'org_id') THEN
    ALTER TABLE deals ADD COLUMN org_id uuid;
  END IF;
  
  -- Tasks
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'org_id') THEN
    ALTER TABLE tasks ADD COLUMN org_id uuid;
  END IF;
  
  -- Activities
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'org_id') THEN
    ALTER TABLE activities ADD COLUMN org_id uuid;
  END IF;
  
  -- Tickets
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'org_id') THEN
    ALTER TABLE tickets ADD COLUMN org_id uuid;
  END IF;
  
  -- Pipelines
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pipelines' AND column_name = 'org_id') THEN
    ALTER TABLE pipelines ADD COLUMN org_id uuid;
  END IF;
END $$;

-- Update any existing records to have the default org_id
UPDATE companies SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE deals SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE tasks SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE activities SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE tickets SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE pipelines SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_companies_org_id ON companies(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deals_org_id ON deals(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_org_id ON activities(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(org_id) WHERE deleted_at IS NULL;