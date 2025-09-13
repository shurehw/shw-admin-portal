const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const config = {
  url: 'https://jvzswjyflmgenzxsrlwj.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
};

// Initialize Supabase
const supabase = createClient(config.url, config.serviceKey);

async function linkVariantsToItems() {
  console.log('🔗 Linking Airtable Parent-Variant Relationships with Existing Items\n');
  console.log('=' .repeat(80) + '\n');
  
  // 1. Check what tables we have
  console.log('📊 Checking available tables...\n');
  
  // Try different table names that might contain the items/products
  const tablesToCheck = ['items', 'products', 'sos_items', 'inventory_items'];
  let itemsTable = null;
  
  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log(`✅ Found table: ${table}`);
      itemsTable = table;
      
      // Get count
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      console.log(`   Records: ${count}`);
      
      // Get sample fields
      const { data: sample } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (sample && sample.length > 0) {
        console.log(`   Sample fields: ${Object.keys(sample[0]).slice(0, 10).join(', ')}...\n`);
      }
    }
  }
  
  if (!itemsTable) {
    console.log('❌ Could not find items/products table. Checking for other possibilities...\n');
    
    // Try to get from SOS backup if available
    const { data: sosData, error: sosError } = await supabase
      .from('sos_backup')
      .select('item_code, description')
      .limit(5);
    
    if (!sosError && sosData) {
      console.log('✅ Found sos_backup table with item data');
      itemsTable = 'sos_backup';
    }
  }
  
  if (!itemsTable) {
    console.log('Please specify which table contains your items/products data.');
    return;
  }
  
  // 2. Get parents with variants from airtable_master_items
  console.log('🔍 Analyzing Parent-Variant Relationships...\n');
  
  const { data: parents } = await supabase
    .from('airtable_master_items')
    .select('airtable_id, name, st_sku, b2b_id, product_variants, variant_count')
    .eq('is_parent', true)
    .gt('variant_count', 0)
    .limit(10);
  
  console.log(`Found ${parents ? parents.length : 0} parent products to analyze\n`);
  
  // 3. Try to match variants
  console.log('🔄 Attempting to match variants with items...\n');
  
  let matchedCount = 0;
  let unmatchedCount = 0;
  
  for (const parent of parents || []) {
    console.log(`\n📦 Parent: ${parent.name || parent.st_sku}`);
    console.log(`   B2B ID: ${parent.b2b_id}`);
    console.log(`   Expected Variants: ${parent.variant_count}`);
    
    if (parent.b2b_id) {
      // Try to find items that might be variants based on naming pattern
      // Often variants have similar names or SKUs with size/color differences
      
      // First, try exact B2B ID match
      const { data: exactMatch } = await supabase
        .from(itemsTable)
        .select('*')
        .eq('item_code', parent.b2b_id)
        .limit(1);
      
      if (exactMatch && exactMatch.length > 0) {
        console.log(`   ✅ Found parent item in ${itemsTable}: ${exactMatch[0].description || exactMatch[0].item_name}`);
        matchedCount++;
      }
      
      // Try to find variants with similar naming
      if (parent.name) {
        // Extract base name (before size/color indicators)
        const baseName = parent.name.split(' - ')[0];
        
        const { data: similarItems } = await supabase
          .from(itemsTable)
          .select('item_code, description')
          .ilike('description', `${baseName}%`)
          .limit(5);
        
        if (similarItems && similarItems.length > 0) {
          console.log(`   📋 Similar items found (potential variants):`);
          similarItems.forEach(item => {
            console.log(`      - ${item.item_code}: ${item.description}`);
          });
        }
      }
    } else {
      unmatchedCount++;
      console.log(`   ⚠️  No B2B ID to match with`);
    }
  }
  
  // 4. Summary
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 Matching Summary:\n');
  console.log(`  Parents with B2B IDs that matched: ${matchedCount}`);
  console.log(`  Parents without matches: ${unmatchedCount}`);
  
  // 5. Suggest creating a junction table
  console.log('\n💡 Recommendation:\n');
  console.log('To properly link parent-variant relationships, create a junction table:');
  console.log(`
CREATE TABLE parent_variant_relationships (
  id SERIAL PRIMARY KEY,
  parent_airtable_id VARCHAR(255),
  parent_b2b_id VARCHAR(255),
  parent_name TEXT,
  variant_item_code VARCHAR(255),
  variant_description TEXT,
  variant_airtable_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (parent_airtable_id) REFERENCES airtable_master_items(airtable_id),
  UNIQUE(parent_airtable_id, variant_item_code)
);
  `);
  
  console.log('\nThis would allow you to:');
  console.log('  1. Link Airtable parent records to actual item variants');
  console.log('  2. Query variants for any parent product');
  console.log('  3. Maintain relationships even as data updates');
}

// Run the linking process
linkVariantsToItems().then(() => {
  console.log('\n✅ Analysis Complete!');
}).catch(error => {
  console.error('Error:', error);
});