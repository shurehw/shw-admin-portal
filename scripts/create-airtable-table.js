const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const config = {
  url: 'https://jvzswjyflmgenzxsrlwj.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
};

// Initialize Supabase
const supabase = createClient(config.url, config.serviceKey);

async function createTable() {
  console.log('🔨 Creating airtable_products table in Supabase...\n');
  
  // Unfortunately, Supabase JS client doesn't support DDL directly
  // You'll need to run this SQL in the Supabase dashboard
  
  const sql = `
-- Create table for Airtable products import
CREATE TABLE IF NOT EXISTS airtable_products (
  id SERIAL PRIMARY KEY,
  airtable_id VARCHAR(255) UNIQUE,
  sku VARCHAR(255),
  name TEXT,
  b2b_id VARCHAR(255),
  category VARCHAR(255),
  subcategory VARCHAR(255),
  manufacturer VARCHAR(255),
  manufacturer_code VARCHAR(255),
  cost DECIMAL(10,2),
  tier_a_price DECIMAL(10,2),
  tier_b_price DECIMAL(10,2),
  tier_c_price DECIMAL(10,2),
  tier_aa_price DECIMAL(10,2),
  tier_ab_price DECIMAL(10,2),
  tier_ac_price DECIMAL(10,2),
  quantity_on_hand INTEGER,
  quantity_on_order INTEGER,
  par_level INTEGER,
  monthly_avg_sales INTEGER,
  bigcommerce_id VARCHAR(255),
  image_url TEXT,
  style_code VARCHAR(255),
  cs_size VARCHAR(255),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_airtable_products_sku ON airtable_products(sku);
CREATE INDEX IF NOT EXISTS idx_airtable_products_b2b_id ON airtable_products(b2b_id);
CREATE INDEX IF NOT EXISTS idx_airtable_products_category ON airtable_products(category);
CREATE INDEX IF NOT EXISTS idx_airtable_products_manufacturer ON airtable_products(manufacturer);
CREATE INDEX IF NOT EXISTS idx_airtable_products_name ON airtable_products USING GIN(to_tsvector('english', name));

-- Grant permissions
GRANT ALL ON airtable_products TO authenticated;
GRANT ALL ON airtable_products TO service_role;
GRANT ALL ON airtable_products_id_seq TO authenticated;
GRANT ALL ON airtable_products_id_seq TO service_role;

-- Enable RLS
ALTER TABLE airtable_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users to read all
CREATE POLICY "Allow authenticated read access" ON airtable_products
  FOR SELECT
  TO authenticated
  USING (true);

-- Create RLS policy for service role to do everything
CREATE POLICY "Allow service role full access" ON airtable_products
  FOR ALL
  TO service_role
  USING (true);
  `;
  
  console.log('📋 Please run this SQL in your Supabase dashboard:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/jvzswjyflmgenzxsrlwj/sql');
  console.log('2. Paste the following SQL and click "Run":\n');
  console.log('=' .repeat(80));
  console.log(sql);
  console.log('=' .repeat(80));
  console.log('\n✅ After running the SQL, you can run the import script again.');
  
  // Try to check if table exists
  const { data, error } = await supabase
    .from('airtable_products')
    .select('id')
    .limit(1);
  
  if (!error || !error.message.includes('relation')) {
    console.log('\n✨ Great news! The table already exists in Supabase!');
    console.log('You can now run: node scripts/import-airtable-products.js');
  } else {
    console.log('\n⚠️  Table does not exist yet. Please create it using the SQL above.');
  }
}

createTable().catch(console.error);