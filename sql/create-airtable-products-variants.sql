-- Create table for Airtable Products (the variant records)
CREATE TABLE IF NOT EXISTS airtable_products_variants (
  id SERIAL PRIMARY KEY,
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  b2b_id VARCHAR(255),
  sos_id VARCHAR(255),
  name TEXT,
  description TEXT,
  sku VARCHAR(255),
  style_code VARCHAR(255),
  category VARCHAR(255),
  subcategory VARCHAR(255),
  manufacturer VARCHAR(255),
  manufacturer_code VARCHAR(255),
  cs_size VARCHAR(255),
  special_item BOOLEAN,
  inventory INTEGER,
  quantity_available INTEGER,
  cost DECIMAL(10,2),
  raw_fields JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_airtable_id ON airtable_products_variants(airtable_id);
CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_b2b_id ON airtable_products_variants(b2b_id);
CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_sos_id ON airtable_products_variants(sos_id);
CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_sku ON airtable_products_variants(sku);
CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_style_code ON airtable_products_variants(style_code);
CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_name ON airtable_products_variants USING GIN(to_tsvector('english', name));

-- Grant permissions
GRANT ALL ON airtable_products_variants TO authenticated;
GRANT ALL ON airtable_products_variants TO service_role;
GRANT ALL ON airtable_products_variants_id_seq TO authenticated;
GRANT ALL ON airtable_products_variants_id_seq TO service_role;

-- Enable RLS
ALTER TABLE airtable_products_variants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated read" ON airtable_products_variants
  FOR SELECT TO authenticated USING (true);
  
CREATE POLICY "Allow service role all" ON airtable_products_variants
  FOR ALL TO service_role USING (true);