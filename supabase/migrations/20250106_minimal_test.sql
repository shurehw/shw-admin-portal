-- Minimal Test - Just create one table
-- ====================================

-- Test creating just one simple table
CREATE TABLE IF NOT EXISTS company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- Add a simple column
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS org_id uuid;

-- Check if table exists
SELECT 'company_contacts table created successfully' as status;