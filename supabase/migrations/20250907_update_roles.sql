-- Remove art_team role and update production permissions

-- First, migrate any existing art_team users to production role
UPDATE user_profiles SET role = 'production' WHERE role = 'art_team';

-- Remove art_team permissions
DELETE FROM role_permissions WHERE role = 'art_team';

-- Update role constraint to remove art_team
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('admin', 'sales_rep', 'customer_service', 'production', 'viewer'));

-- Add quote permissions to production role
INSERT INTO role_permissions (role, permission) VALUES
  ('production', 'quotes:read'),
  ('production', 'quotes:update')
ON CONFLICT (role, permission) DO NOTHING;

-- Remove art_team from teams table
DELETE FROM teams WHERE name = 'Art Team';