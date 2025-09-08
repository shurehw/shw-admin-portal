-- Data Migration Script
-- This creates a default org and migrates existing data

-- 1) Create default organization (if not exists)
INSERT INTO orgs (id, name, created_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid, 
  'Shure Hardware', 
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2) Create default admin user mapping (replace with your actual user ID)
-- You'll need to get this from your auth.users table
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the first admin user (adjust this query as needed)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO org_users (org_id, user_id, role, permissions)
    VALUES (
      '550e8400-e29b-41d4-a716-446655440000'::uuid,
      v_user_id,
      'admin',
      '{"contacts:read":true,"contacts:write":true,"contacts:delete":true,
        "companies:read":true,"companies:write":true,"companies:delete":true,
        "deals:read":true,"deals:write":true,"deals:delete":true,
        "tasks:read":true,"tasks:write":true,"tasks:delete":true,
        "activities:read":true,"activities:write":true,"activities:delete":true,
        "tickets:read":true,"tickets:write":true,"tickets:delete":true,
        "analytics:read":true,"settings:write":true}'::jsonb
    ) ON CONFLICT (org_id, user_id) DO NOTHING;
  END IF;
END $$;

-- 3) Migrate existing data to have org_id
UPDATE companies 
SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid 
WHERE org_id IS NULL;

UPDATE contacts 
SET org_id = '550e8400-e29b-41d4-a716-446655440000'::uuid,
    lifecycle_stage = COALESCE(lifecycle_stage, 'lead')
WHERE org_id IS NULL;

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

-- 4) Create default pipeline
INSERT INTO pipelines (id, org_id, name, stages, is_default)
VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Sales Pipeline',
  '[
    {"key": "lead", "label": "Lead", "order": 1, "probability": 10},
    {"key": "qualified", "label": "Qualified", "order": 2, "probability": 20},
    {"key": "proposal", "label": "Proposal", "order": 3, "probability": 50},
    {"key": "negotiation", "label": "Negotiation", "order": 4, "probability": 75},
    {"key": "closed-won", "label": "Closed Won", "order": 5, "probability": 100},
    {"key": "closed-lost", "label": "Closed Lost", "order": 6, "probability": 0}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- 5) Initialize activity metrics (optional)
INSERT INTO activity_metrics (org_id, user_id, metric_date, calls_made, emails_sent, meetings_held)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  owner_id,
  CURRENT_DATE,
  0, 0, 0
FROM (
  SELECT DISTINCT owner_id FROM contacts WHERE owner_id IS NOT NULL
  UNION
  SELECT DISTINCT owner_id FROM deals WHERE owner_id IS NOT NULL
) users
ON CONFLICT DO NOTHING;

-- 6) Refresh materialized view
REFRESH MATERIALIZED VIEW IF EXISTS mv_pipeline_performance;