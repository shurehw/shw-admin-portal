const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const config = {
  url: 'https://jvzswjyflmgenzxsrlwj.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
};

// Initialize Supabase
const supabase = createClient(config.url, config.serviceKey);

// Check if table exists
async function checkTableExists() {
  const { data, error } = await supabase
    .from('airtable_master_items')
    .select('id')
    .limit(1);
  
  if (error && error.message.includes('relation')) {
    return false;
  }
  return true;
}

// Import products to Supabase
async function importToSupabase() {
  console.log('🚀 Starting import to Supabase\n');
  console.log('=' .repeat(80) + '\n');
  
  // Load the JSON file
  const filename = 'airtable-products-streamlined-2025-09-12.json';
  const filepath = path.join(__dirname, filename);
  
  if (!fs.existsSync(filepath)) {
    console.error(`❌ File not found: ${filename}`);
    console.error('Please run: node scripts/export-airtable-streamlined.js first');
    process.exit(1);
  }
  
  console.log(`📂 Loading data from ${filename}...`);
  const products = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  console.log(`✅ Loaded ${products.length} products\n`);
  
  // Check if table exists
  console.log('🔍 Checking if table exists in Supabase...');
  const tableExists = await checkTableExists();
  
  if (!tableExists) {
    console.log('📝 Table does not exist. Creating table first...\n');
    console.log('Please run this SQL in Supabase dashboard:\n');
    console.log('=' .repeat(80));
    console.log(`
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

-- Create indexes
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
    `);
    console.log('=' .repeat(80));
    console.log('\n⚠️  Please create the table first, then run this script again.\n');
    
    // Try to create anyway (might work if table was just created)
    console.log('Attempting import anyway in case table was just created...\n');
  }
  
  // Import in batches
  console.log('💾 Importing to Supabase...\n');
  const batchSize = 100;
  let imported = 0;
  let errors = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    // Transform data for Supabase
    const transformedBatch = batch.map(p => ({
      airtable_id: p.airtable_id,
      name: p.name,
      st_sku: p.st_sku,
      auto_number: p.auto_number,
      b2b_id: p.b2b_id ? String(p.b2b_id) : null,
      bigcommerce_id: p.bigcommerce_id,
      product_variants: p.product_variants || [],
      variant_count: p.variant_count || 0,
      is_parent: p.is_parent || false,
      b2b_ids_from_products: p.b2b_ids_from_products || [],
      category: p.category,
      subcategory: p.subcategory,
      special_item: p.special_item || [],
      photos: p.photos || [],
      images_from_products: p.images_from_products || []
    }));
    
    const { data, error } = await supabase
      .from('airtable_master_items')
      .upsert(transformedBatch, {
        onConflict: 'airtable_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error(`❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      errors++;
      
      // If first batch fails, table probably doesn't exist
      if (i === 0) {
        console.error('\n⚠️  Table does not exist. Please create it using the SQL above.');
        return { imported: 0, errors: products.length };
      }
    } else {
      imported += batch.length;
      console.log(`  ✅ Imported ${imported}/${products.length} products...`);
    }
  }
  
  return { imported, errors };
}

// Show summary after import
async function showSummary() {
  console.log('\n📊 Verifying imported data...\n');
  
  // Get count
  const { count } = await supabase
    .from('airtable_master_items')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total records in database: ${count || 0}`);
  
  // Get parent products
  const { data: parents, error: parentError } = await supabase
    .from('airtable_master_items')
    .select('name, st_sku, variant_count')
    .eq('is_parent', true)
    .gt('variant_count', 0)
    .order('variant_count', { ascending: false })
    .limit(5);
  
  if (!parentError && parents && parents.length > 0) {
    console.log('\n  Top parent products by variant count:');
    parents.forEach(p => {
      console.log(`    - ${p.name || p.st_sku}: ${p.variant_count} variants`);
    });
  }
  
  // Get categories
  const { data: categories, error: catError } = await supabase
    .from('airtable_master_items')
    .select('category')
    .not('category', 'is', null)
    .limit(1000);
  
  if (!catError && categories) {
    const uniqueCategories = new Set(categories.map(c => c.category));
    console.log(`\n  Categories found: ${uniqueCategories.size}`);
  }
}

// Main execution
async function main() {
  try {
    const result = await importToSupabase();
    
    if (result.imported > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log(`\n✨ Import completed!`);
      console.log(`   ✅ Successfully imported: ${result.imported} products`);
      if (result.errors > 0) {
        console.log(`   ⚠️  Errors encountered: ${result.errors} batches`);
      }
      
      await showSummary();
      
      console.log('\n💡 Next steps:');
      console.log('  1. Check the data in Supabase: airtable_master_items table');
      console.log('  2. Parent-variant relationships are stored in product_variants field');
      console.log('  3. Use is_parent=true to find all parent products');
      console.log('  4. Query example: SELECT * FROM airtable_master_items WHERE is_parent = true');
    } else {
      console.log('\n⚠️  No products were imported. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
}