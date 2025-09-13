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

async function importProducts() {
  console.log('🚀 Importing Airtable Products to Supabase\n');
  console.log('=' .repeat(80) + '\n');
  
  // Load the JSON file
  const filename = 'airtable-products-table-2025-09-12.json';
  const filepath = path.join(__dirname, filename);
  
  if (!fs.existsSync(filepath)) {
    console.error(`❌ File not found: ${filename}`);
    return;
  }
  
  console.log(`📂 Loading data from ${filename}...`);
  const products = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  console.log(`✅ Loaded ${products.length} products\n`);
  
  // Import in batches
  console.log('💾 Importing to airtable_products_variants table...\n');
  const batchSize = 100;
  let imported = 0;
  let errors = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    // Transform data for Supabase with proper field mapping
    const transformedBatch = batch.map(p => ({
      airtable_id: p.airtable_id,
      b2b_id: p.raw_fields?.['B2B_ID'] || p.b2b_id || null,
      sos_id: p.raw_fields?.['SOS_ID'] || null,
      name: p.raw_fields?.['Name'] || p.name || null,
      description: p.raw_fields?.['Description'] || null,
      sku: p.raw_fields?.['SKU'] || p.sku || null,
      style_code: p.raw_fields?.['Style Code'] || p.style_code || null,
      category: p.raw_fields?.['Category 1'] || p.category || null,
      cs_size: p.raw_fields?.['CS Size'] || p.cs_size || null,
      quantity_available: parseInt(p.raw_fields?.['Quantity Available']) || 0,
      cost: parseFloat(p.raw_fields?.['Cost']) || null,
      raw_fields: p.raw_fields
    }));
    
    const { data, error } = await supabase
      .from('airtable_products_variants')
      .upsert(transformedBatch, {
        onConflict: 'airtable_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error(`❌ Error importing batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      errors++;
    } else {
      imported += batch.length;
      console.log(`  ✅ Imported ${imported}/${products.length} products...`);
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log(`\n✨ Import completed!`);
  console.log(`   ✅ Successfully imported: ${imported} products`);
  if (errors > 0) {
    console.log(`   ⚠️  Errors encountered: ${errors} batches`);
  }
  
  return imported;
}

async function verifyRelationships() {
  console.log('\n🔍 Verifying Parent-Variant Relationships...\n');
  
  // Check how many variants we can now match
  const { data: parentRecords } = await supabase
    .from('airtable_master_items')
    .select('airtable_id, name, product_variants, variant_count')
    .eq('is_parent', true)
    .gt('variant_count', 0)
    .limit(5);
  
  if (parentRecords && parentRecords.length > 0) {
    console.log('📦 Sample Parent-Variant Matches:\n');
    
    for (const parent of parentRecords) {
      console.log(`Parent: ${parent.name}`);
      console.log(`  Expected variants: ${parent.variant_count}`);
      
      if (parent.product_variants && parent.product_variants.length > 0) {
        // Check if we can find these variants
        const { data: variants } = await supabase
          .from('airtable_products_variants')
          .select('airtable_id, name, sos_id, b2b_id')
          .in('airtable_id', parent.product_variants.slice(0, 3));
        
        if (variants && variants.length > 0) {
          console.log(`  ✅ Found ${variants.length} variants:`);
          variants.forEach(v => {
            console.log(`     - ${v.name} (SOS_ID: ${v.sos_id}, B2B_ID: ${v.b2b_id})`);
          });
        } else {
          console.log(`  ❌ No variants found`);
        }
      }
      console.log('');
    }
  }
  
  // Check overall statistics
  console.log('📊 Overall Statistics:\n');
  
  const { count: totalVariants } = await supabase
    .from('airtable_products_variants')
    .select('*', { count: 'exact', head: true });
  
  const { count: variantsWithSOS } = await supabase
    .from('airtable_products_variants')
    .select('*', { count: 'exact', head: true })
    .not('sos_id', 'is', null);
  
  const { count: variantsWithB2B } = await supabase
    .from('airtable_products_variants')
    .select('*', { count: 'exact', head: true })
    .not('b2b_id', 'is', null);
  
  console.log(`  Total variant records: ${totalVariants}`);
  console.log(`  Variants with SOS_ID: ${variantsWithSOS}`);
  console.log(`  Variants with B2B_ID: ${variantsWithB2B}`);
}

async function createMappingView() {
  console.log('\n🔨 Creating Parent-Variant-SOS Mapping View...\n');
  
  const viewSQL = `
-- Create a view that links parents, variants, and SOS items
CREATE OR REPLACE VIEW v_parent_variant_sos_mapping AS
SELECT 
  -- Parent info
  p.airtable_id as parent_airtable_id,
  p.name as parent_name,
  p.st_sku as parent_sku,
  p.b2b_id as parent_b2b_id,
  p.category as parent_category,
  p.subcategory as parent_subcategory,
  p.variant_count,
  
  -- Variant info from Airtable Products
  v.airtable_id as variant_airtable_id,
  v.name as variant_name,
  v.sos_id as variant_sos_id,
  v.b2b_id as variant_b2b_id,
  v.style_code as variant_style_code,
  v.quantity_available as variant_qty,
  
  -- SOS Item info (if matched)
  i.id as sos_item_uuid,
  i.name as sos_item_name,
  i.sku as sos_item_sku,
  i.description as sos_item_description
  
FROM airtable_master_items p
CROSS JOIN LATERAL unnest(p.product_variants) as variant_id
LEFT JOIN airtable_products_variants v ON v.airtable_id = variant_id
LEFT JOIN items i ON i.sos_id::text = v.sos_id OR i.id::text = v.b2b_id
WHERE p.is_parent = true;

-- Grant permissions
GRANT SELECT ON v_parent_variant_sos_mapping TO authenticated;
GRANT SELECT ON v_parent_variant_sos_mapping TO service_role;
  `;
  
  console.log('Run this SQL in Supabase to create the mapping view:');
  console.log(viewSQL);
  
  return viewSQL;
}

// Main execution
async function main() {
  try {
    // Import products
    const imported = await importProducts();
    
    if (imported > 0) {
      // Verify relationships
      await verifyRelationships();
      
      // Create mapping view
      await createMappingView();
      
      console.log('\n' + '=' .repeat(80));
      console.log('\n✅ Complete! Parent-Variant relationships are now available.');
      console.log('\n💡 Next steps:');
      console.log('  1. Run the SQL above to create the mapping view');
      console.log('  2. Query the view: SELECT * FROM v_parent_variant_sos_mapping');
      console.log('  3. This gives you parent products → variants → SOS items');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run the import
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}