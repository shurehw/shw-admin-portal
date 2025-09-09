-- Update Jacob's role to admin
UPDATE user_profiles 
SET role = 'admin'
WHERE email = 'jacob@shurehw.com';

-- Verify the update
SELECT * FROM user_profiles WHERE email = 'jacob@shurehw.com';