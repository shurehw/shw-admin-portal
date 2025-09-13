const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const config = {
  url: 'https://jvzswjyflmgenzxsrlwj.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
};

// Initialize Supabase
const supabase = createClient(config.url, config.serviceKey);

async function checkTables() {
  console.log('🔍 Checking Supabase Tables Data\n');
  console.log('=' .repeat(80) + '\n');
  
  // Check airtable_master_items (parent products)
  console.log('📊 Table: airtable_master_items (Parent Products)');
  const { count: masterCount, error: masterError } = await supabase
    .from('airtable_master_items')
    .select('*', { count: 'exact', head: true });
  
  if (masterError) {
    console.log(`  ❌ Error: ${masterError.message}`);
  } else {
    console.log(`  ✅ Total records: ${masterCount}`);
    
    // Get sample
    const { data: masterSample } = await supabase
      .from('airtable_master_items')
      .select('airtable_id, name, is_parent, variant_count')
      .limit(3);
    
    if (masterSample && masterSample.length > 0) {
      console.log('  Sample records:');
      masterSample.forEach(item => {
        console.log(`    - ${item.name} (Parent: ${item.is_parent}, Variants: ${item.variant_count})`);
      });
    }
  }
  
  console.log('\n' + '-'.repeat(80) + '\n');
  
  // Check airtable_products_variants
  console.log('📊 Table: airtable_products_variants (Variant Products)');
  const { count: variantsCount, error: variantsError } = await supabase
    .from('airtable_products_variants')
    .select('*', { count: 'exact', head: true });
  
  if (variantsError) {
    console.log(`  ❌ Error: ${variantsError.message}`);
  } else {
    console.log(`  ✅ Total records: ${variantsCount}`);
    
    // Get sample
    const { data: variantsSample } = await supabase
      .from('airtable_products_variants')
      .select('airtable_id, name, sos_id, b2b_id')
      .limit(3);
    
    if (variantsSample && variantsSample.length > 0) {
      console.log('  Sample records:');
      variantsSample.forEach(item => {
        console.log(`    - ${item.name} (SOS: ${item.sos_id}, B2B: ${item.b2b_id})`);
      });
    }
  }
  
  console.log('\n' + '-'.repeat(80) + '\n');
  
  // Check items table
  console.log('📊 Table: items (SOS Items)');
  const { count: itemsCount, error: itemsError } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true });
  
  if (itemsError) {
    console.log(`  ❌ Error: ${itemsError.message}`);
  } else {
    console.log(`  ✅ Total records: ${itemsCount}`);
    
    // Get sample
    const { data: itemsSample } = await supabase
      .from('items')
      .select('id, name, sos_id')
      .limit(3);
    
    if (itemsSample && itemsSample.length > 0) {
      console.log('  Sample records:');
      itemsSample.forEach(item => {
        console.log(`    - ${item.name} (SOS ID: ${item.sos_id})`);
      });
    }
  }
  
  console.log('\n' + '=' .repeat(80) + '\n');
  
  // Check if we can find parents with variants
  console.log('🔗 Checking Parent-Variant Relationships:');
  
  const { data: parentsWithVariants } = await supabase
    .from('airtable_master_items')
    .select('airtable_id, name, product_variants')
    .eq('is_parent', true)
    .gt('variant_count', 0)
    .limit(1);
  
  if (parentsWithVariants && parentsWithVariants.length > 0) {
    const parent = parentsWithVariants[0];
    console.log(`\n  Parent: ${parent.name}`);
    console.log(`  Variant IDs: ${parent.product_variants ? parent.product_variants.slice(0, 3).join(', ') : 'none'}`);
    
    if (parent.product_variants && parent.product_variants.length > 0) {
      const { data: variants } = await supabase
        .from('airtable_products_variants')
        .select('airtable_id, name')
        .in('airtable_id', parent.product_variants.slice(0, 3));
      
      if (variants && variants.length > 0) {
        console.log('  ✅ Found matching variants:');
        variants.forEach(v => console.log(`     - ${v.name}`));
      } else {
        console.log('  ❌ No matching variants found in airtable_products_variants');
      }
    }
  } else {
    console.log('  ❌ No parent products with variants found');
  }
  
  console.log('\n' + '=' .repeat(80) + '\n');
  
  // Check if the view exists
  console.log('📋 Checking if view exists: v_parent_variant_sos_mapping');
  
  const { data: viewData, error: viewError } = await supabase
    .from('v_parent_variant_sos_mapping')
    .select('*')
    .limit(1);
  
  if (viewError) {
    console.log(`  ❌ View not found or error: ${viewError.message}`);
    console.log('\n  💡 Create the view with this SQL in Supabase:');
    console.log(`
CREATE OR REPLACE VIEW v_parent_variant_sos_mapping AS
SELECT 
  p.airtable_id as parent_airtable_id,
  p.name as parent_name,
  p.st_sku as parent_sku,
  p.b2b_id as parent_b2b_id,
  p.category as parent_category,
  p.subcategory as parent_subcategory,
  p.variant_count,
  v.airtable_id as variant_airtable_id,
  v.name as variant_name,
  v.sos_id as variant_sos_id,
  v.b2b_id as variant_b2b_id,
  v.style_code as variant_style_code,
  i.id as sos_item_uuid,
  i.name as sos_item_name,
  i.sku as sos_item_sku
FROM airtable_master_items p
CROSS JOIN LATERAL unnest(p.product_variants) as variant_id
LEFT JOIN airtable_products_variants v ON v.airtable_id = variant_id
LEFT JOIN items i ON i.sos_id::text = v.sos_id
WHERE p.is_parent = true;
    `);
  } else {
    console.log('  ✅ View exists');
    if (viewData && viewData.length > 0) {
      console.log(`  Sample: ${viewData[0].parent_name} -> ${viewData[0].variant_name}`);
    }
  }
}

// Run the check
checkTables().then(() => {
  console.log('✅ Check complete!');
}).catch(error => {
  console.error('Error:', error);
});