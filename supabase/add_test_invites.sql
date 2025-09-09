-- Add some test pending invites
INSERT INTO pending_invites (email, role, status)
VALUES 
  ('john.doe@shurehw.com', 'sales_rep', 'pending'),
  ('jane.smith@shurehw.com', 'customer_service', 'pending'),
  ('mike.wilson@shurehw.com', 'production', 'pending')
ON CONFLICT (email) DO NOTHING;

-- Check the invites
SELECT * FROM pending_invites WHERE status = 'pending';