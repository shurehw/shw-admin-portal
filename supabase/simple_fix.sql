-- Step 1: Create the user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- Step 2: Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create basic policy - allow all authenticated users to do everything (for testing)
CREATE POLICY "Allow all for authenticated users" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Create your admin profile manually
-- CHANGE 'jacob@shurehw.com' to your actual email address
INSERT INTO user_profiles (user_id, email, full_name, role, status)
SELECT 
  id as user_id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Admin') as full_name,
  'admin' as role,
  'active' as status
FROM auth.users 
WHERE email = 'jacob@shurehw.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', status = 'active';

-- Step 5: Create pending_invites table
CREATE TABLE IF NOT EXISTS pending_invites (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);