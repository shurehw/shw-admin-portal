-- Check all user profiles
SELECT user_id, email, full_name, role, status 
FROM user_profiles;

-- Check auth users
SELECT id, email 
FROM auth.users 
WHERE email = 'jacob@shurehw.com';

-- If profile doesn't exist, create it with admin role
INSERT INTO user_profiles (user_id, email, full_name, role, status)
SELECT 
  id,
  email,
  'Jacob',
  'admin',
  'active'
FROM auth.users 
WHERE email = 'jacob@shurehw.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';