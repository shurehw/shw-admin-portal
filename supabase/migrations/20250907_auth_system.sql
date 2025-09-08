-- User Profiles and Role Management System

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'sales_rep', 'customer_service', 'production', 'art_team', 'viewer')),
  department text,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create user_teams junction table
CREATE TABLE IF NOT EXISTS user_teams (
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, team_id)
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission)
);

-- Insert default teams
INSERT INTO teams (name, description) VALUES
  ('Sales', 'Sales team members'),
  ('Customer Service', 'Customer service representatives'),
  ('Production', 'Production team members'),
  ('Art Team', 'Art and design team'),
  ('Management', 'Management team')
ON CONFLICT (name) DO NOTHING;

-- Insert default role permissions
INSERT INTO role_permissions (role, permission) VALUES
  -- Admin permissions
  ('admin', 'users:create'),
  ('admin', 'users:read'),
  ('admin', 'users:update'),
  ('admin', 'users:delete'),
  ('admin', 'tickets:create'),
  ('admin', 'tickets:read'),
  ('admin', 'tickets:update'),
  ('admin', 'tickets:delete'),
  ('admin', 'orders:create'),
  ('admin', 'orders:read'),
  ('admin', 'orders:update'),
  ('admin', 'orders:delete'),
  ('admin', 'customers:create'),
  ('admin', 'customers:read'),
  ('admin', 'customers:update'),
  ('admin', 'customers:delete'),
  ('admin', 'quotes:create'),
  ('admin', 'quotes:read'),
  ('admin', 'quotes:update'),
  ('admin', 'quotes:delete'),
  ('admin', 'invoices:create'),
  ('admin', 'invoices:read'),
  ('admin', 'invoices:update'),
  ('admin', 'invoices:delete'),
  ('admin', 'reports:read'),
  ('admin', 'settings:manage'),
  ('admin', 'crm:full_access'),
  
  -- Sales Rep permissions
  ('sales_rep', 'tickets:create'),
  ('sales_rep', 'tickets:read'),
  ('sales_rep', 'tickets:update'),
  ('sales_rep', 'orders:create'),
  ('sales_rep', 'orders:read'),
  ('sales_rep', 'orders:update'),
  ('sales_rep', 'customers:create'),
  ('sales_rep', 'customers:read'),
  ('sales_rep', 'customers:update'),
  ('sales_rep', 'quotes:create'),
  ('sales_rep', 'quotes:read'),
  ('sales_rep', 'quotes:update'),
  ('sales_rep', 'invoices:read'),
  ('sales_rep', 'crm:full_access'),
  
  -- Customer Service permissions
  ('customer_service', 'tickets:create'),
  ('customer_service', 'tickets:read'),
  ('customer_service', 'tickets:update'),
  ('customer_service', 'orders:read'),
  ('customer_service', 'orders:update'),
  ('customer_service', 'customers:read'),
  ('customer_service', 'customers:update'),
  ('customer_service', 'invoices:read'),
  ('customer_service', 'crm:limited_access'),
  
  -- Production permissions
  ('production', 'orders:read'),
  ('production', 'orders:update'),
  ('production', 'art_proofs:create'),
  ('production', 'art_proofs:read'),
  ('production', 'art_proofs:update'),
  
  -- Art Team permissions
  ('art_team', 'art_proofs:create'),
  ('art_team', 'art_proofs:read'),
  ('art_team', 'art_proofs:update'),
  ('art_team', 'orders:read'),
  
  -- Viewer permissions
  ('viewer', 'tickets:read'),
  ('viewer', 'orders:read'),
  ('viewer', 'customers:read'),
  ('viewer', 'quotes:read'),
  ('viewer', 'invoices:read')
ON CONFLICT (role, permission) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_teams_user_id ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_team_id ON user_teams(team_id);

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS TABLE(permission text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT rp.permission
  FROM user_profiles up
  JOIN role_permissions rp ON rp.role = up.role
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check user permission
CREATE OR REPLACE FUNCTION has_permission(p_user_id uuid, p_permission text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN role_permissions rp ON rp.role = up.role
    WHERE up.user_id = p_user_id AND rp.permission = p_permission
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can read their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Teams policies
CREATE POLICY "All authenticated users can read teams" ON teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- User teams policies
CREATE POLICY "Users can see their team memberships" ON user_teams
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage team memberships" ON user_teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Role permissions policies
CREATE POLICY "All authenticated users can read permissions" ON role_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage permissions" ON role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create default admin user (update email/password as needed)
-- This is just a placeholder - you'll need to create the actual user through Supabase Auth
-- INSERT INTO auth.users (id, email) VALUES 
--   ('00000000-0000-0000-0000-000000000000', 'admin@shurehw.com');

-- INSERT INTO user_profiles (user_id, email, full_name, role) VALUES
--   ('00000000-0000-0000-0000-000000000000', 'admin@shurehw.com', 'System Admin', 'admin');