-- Drop existing table if it exists (to start fresh)
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'sales_rep', 'customer_service', 'production', 'art_team', 'viewer')),
  department TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to view all profiles (temporary for testing)
CREATE POLICY "Authenticated users can view all profiles" ON user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert profiles
CREATE POLICY "Authenticated users can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update profiles
CREATE POLICY "Authenticated users can update profiles" ON user_profiles
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create index for faster lookups
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Create your admin profile
-- Replace 'your-email@shurehw.com' with your actual email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get your user ID from auth.users
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'jacob@shurehw.com'  -- CHANGE THIS TO YOUR EMAIL
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Insert or update your profile as admin
    INSERT INTO user_profiles (user_id, email, full_name, role, status)
    VALUES (v_user_id, 'jacob@shurehw.com', 'Jacob', 'admin', 'active')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin', status = 'active';
    
    RAISE NOTICE 'Admin profile created/updated for jacob@shurehw.com';
  ELSE
    RAISE NOTICE 'User not found. Make sure to update the email in this script.';
  END IF;
END$$;

-- Create a function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'viewer',  -- Default role for new users
    'active'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Create pending_invites table for invite system
CREATE TABLE IF NOT EXISTS pending_invites (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
);

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON pending_invites TO authenticated;