-- Create table for Airtable Master Items with parent-variant relationships
CREATE TABLE IF NOT EXISTS airtable_master_items (
  id SERIAL PRIMARY KEY,
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  name TEXT,
  st_sku VARCHAR(255),
  auto_number INTEGER,
  b2b_id VARCHAR(255),
  bigcommerce_id VARCHAR(255),
  
  -- Variant relationships
  product_variants TEXT[], -- Array of Airtable record IDs
  variant_count INTEGER DEFAULT 0,
  is_parent BOOLEAN DEFAULT false,
  
  -- Categories and attributes  
  b2b_ids_from_products JSONB,
  category VARCHAR(255),
  subcategory VARCHAR(255),
  special_item JSONB,
  
  -- Images
  photos JSONB,
  images_from_products JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_airtable_master_items_sku ON airtable_master_items(st_sku);
CREATE INDEX idx_airtable_master_items_b2b ON airtable_master_items(b2b_id);
CREATE INDEX idx_airtable_master_items_category ON airtable_master_items(category);
CREATE INDEX idx_airtable_master_items_parent ON airtable_master_items(is_parent);
CREATE INDEX idx_airtable_master_items_variants ON airtable_master_items USING GIN(product_variants);

-- Grant permissions
GRANT ALL ON airtable_master_items TO authenticated;
GRANT ALL ON airtable_master_items TO service_role;
GRANT ALL ON airtable_master_items_id_seq TO authenticated;
GRANT ALL ON airtable_master_items_id_seq TO service_role;

-- Enable RLS
ALTER TABLE airtable_master_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated read" ON airtable_master_items
  FOR SELECT TO authenticated USING (true);
  
CREATE POLICY "Allow service role all" ON airtable_master_items
  FOR ALL TO service_role USING (true);