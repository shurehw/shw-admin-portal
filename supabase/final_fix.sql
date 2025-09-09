-- Clean start - drop existing tables
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS pending_invites CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'viewer',
  department TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (for testing)
CREATE POLICY "Allow all for authenticated users" ON user_profiles
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create pending_invites table
CREATE TABLE pending_invites (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- Insert your admin profile
-- CHANGE THIS EMAIL TO YOUR ACTUAL EMAIL
INSERT INTO user_profiles (user_id, email, full_name, role, status)
SELECT 
  id,
  email,
  'Jacob',
  'admin',
  'active'
FROM auth.users 
WHERE email = 'jacob@shurehw.com'
LIMIT 1;