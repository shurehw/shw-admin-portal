-- Prepare Existing Tables for Multi-tenant Support
-- ==================================================
-- This migration updates existing tables to add multi-tenant columns

-- 1) Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) Create Organizations table first
CREATE TABLE IF NOT EXISTS orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Create Organization users table
CREATE TABLE IF NOT EXISTS org_users (
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- 4) Add org_id and other columns to existing tables if they exist
DO $$ 
BEGIN
  -- Update companies table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
    -- Add columns only if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'org_id') THEN
      ALTER TABLE companies ADD COLUMN org_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'owner_id') THEN
      ALTER TABLE companies ADD COLUMN owner_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'deleted_at') THEN
      ALTER TABLE companies ADD COLUMN deleted_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'custom') THEN
      ALTER TABLE companies ADD COLUMN custom jsonb DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'search_vector') THEN
      ALTER TABLE companies ADD COLUMN search_vector tsvector;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'website') THEN
      ALTER TABLE companies ADD COLUMN website text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'description') THEN
      ALTER TABLE companies ADD COLUMN description text;
    END IF;
  ELSE
    -- Create companies table if it doesn't exist
    CREATE TABLE companies (
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
  END IF;

  -- Update contacts table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'org_id') THEN
      ALTER TABLE contacts ADD COLUMN org_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'owner_id') THEN
      ALTER TABLE contacts ADD COLUMN owner_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'deleted_at') THEN
      ALTER TABLE contacts ADD COLUMN deleted_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'custom') THEN
      ALTER TABLE contacts ADD COLUMN custom jsonb DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lifecycle_stage') THEN
      ALTER TABLE contacts ADD COLUMN lifecycle_stage text DEFAULT 'lead';
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'search_vector') THEN
      ALTER TABLE contacts ADD COLUMN search_vector tsvector;
    END IF;
  ELSE
    -- Create contacts table if it doesn't exist
    CREATE TABLE contacts (
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
  END IF;

  -- Update deals table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deals') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'org_id') THEN
      ALTER TABLE deals ADD COLUMN org_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'owner_id') THEN
      ALTER TABLE deals ADD COLUMN owner_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'deleted_at') THEN
      ALTER TABLE deals ADD COLUMN deleted_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'custom') THEN
      ALTER TABLE deals ADD COLUMN custom jsonb DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'expected_close_date') THEN
      ALTER TABLE deals ADD COLUMN expected_close_date date;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'pipeline_id') THEN
      ALTER TABLE deals ADD COLUMN pipeline_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'description') THEN
      ALTER TABLE deals ADD COLUMN description text;
    END IF;
  ELSE
    -- Create deals table if it doesn't exist
    CREATE TABLE deals (
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
  END IF;

  -- Update tasks table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'org_id') THEN
      ALTER TABLE tasks ADD COLUMN org_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'owner_id') THEN
      ALTER TABLE tasks ADD COLUMN owner_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'deleted_at') THEN
      ALTER TABLE tasks ADD COLUMN deleted_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'custom') THEN
      ALTER TABLE tasks ADD COLUMN custom jsonb DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'deal_id') THEN
      ALTER TABLE tasks ADD COLUMN deal_id uuid;
    END IF;
  ELSE
    -- Create tasks table if it doesn't exist
    CREATE TABLE tasks (
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
  END IF;

  -- Update activities table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activities') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'org_id') THEN
      ALTER TABLE activities ADD COLUMN org_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'owner_id') THEN
      ALTER TABLE activities ADD COLUMN owner_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'deleted_at') THEN
      ALTER TABLE activities ADD COLUMN deleted_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'direction') THEN
      ALTER TABLE activities ADD COLUMN direction text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'via') THEN
      ALTER TABLE activities ADD COLUMN via text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'external_id') THEN
      ALTER TABLE activities ADD COLUMN external_id text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'thread_id') THEN
      ALTER TABLE activities ADD COLUMN thread_id text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'metadata') THEN
      ALTER TABLE activities ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
  ELSE
    -- Create activities table if it doesn't exist
    CREATE TABLE activities (
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
  END IF;

  -- Update tickets table if it exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'org_id') THEN
      ALTER TABLE tickets ADD COLUMN org_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'owner_id') THEN
      ALTER TABLE tickets ADD COLUMN owner_id uuid;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'deleted_at') THEN
      ALTER TABLE tickets ADD COLUMN deleted_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'custom') THEN
      ALTER TABLE tickets ADD COLUMN custom jsonb DEFAULT '{}'::jsonb;
    END IF;
  ELSE
    -- Create tickets table if it doesn't exist
    CREATE TABLE tickets (
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
  END IF;
END $$;

-- 5) Create pipelines table if it doesn't exist
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  name text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6) Now populate org_id with default value for existing records
UPDATE companies SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE contacts SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE deals SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE tasks SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE activities SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;
UPDATE tickets SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid WHERE org_id IS NULL;

-- 7) Create the default organization
INSERT INTO orgs (id, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Shure Hardware')
ON CONFLICT (id) DO NOTHING;