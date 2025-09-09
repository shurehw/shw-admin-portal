-- Drop the existing table and start fresh
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS pending_invites CASCADE;

-- Create the user_profiles table with all columns
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

-- Create basic policy - allow all authenticated users to do everything (for testing)
CREATE POLICY "Allow all for authenticated users" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Create your admin profile
-- CHANGE 'jacob@shurehw.com' to your actual email address
INSERT INTO user_profiles (user_id, email, full_name, role, status)
SELECT 
  id as user_id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Admin') as full_name,
  'admin' as role,
  'active' as status
FROM auth.users 
WHERE email = 'jacob@shurehw.com';

-- Create pending_invites table
CREATE TABLE pending_invites (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);