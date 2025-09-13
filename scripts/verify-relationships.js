const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const config = {
  url: 'https://jvzswjyflmgenzxsrlwj.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
};

// Initialize Supabase
const supabase = createClient(config.url, config.serviceKey);

async function verifyRelationships() {
  console.log('🔍 Verifying Parent-Variant Relationships in Supabase\n');
  console.log('=' .repeat(80) + '\n');
  
  // 1. Get overall statistics
  const { count: totalCount } = await supabase
    .from('airtable_master_items')
    .select('*', { count: 'exact', head: true });
  
  const { count: parentCount } = await supabase
    .from('airtable_master_items')
    .select('*', { count: 'exact', head: true })
    .eq('is_parent', true);
  
  const { count: hasVariantsCount } = await supabase
    .from('airtable_master_items')
    .select('*', { count: 'exact', head: true })
    .gt('variant_count', 0);
  
  console.log('📊 Overall Statistics:');
  console.log(`  Total Records: ${totalCount}`);
  console.log(`  Parent Products (is_parent=true): ${parentCount}`);
  console.log(`  Products with Variants (variant_count>0): ${hasVariantsCount}`);
  console.log('');
  
  // 2. Get sample parent products with their variant IDs
  const { data: parents, error: parentError } = await supabase
    .from('airtable_master_items')
    .select('airtable_id, name, st_sku, product_variants, variant_count')
    .eq('is_parent', true)
    .gt('variant_count', 0)
    .order('variant_count', { ascending: false })
    .limit(5);
  
  if (parentError) {
    console.error('Error fetching parents:', parentError);
    return;
  }
  
  console.log('🔗 Top 5 Parent Products and Their Variants:\n');
  
  for (const parent of parents) {
    console.log(`📦 ${parent.name || parent.st_sku}`);
    console.log(`   Airtable ID: ${parent.airtable_id}`);
    console.log(`   Variant Count: ${parent.variant_count}`);
    console.log(`   Variant IDs: ${parent.product_variants ? parent.product_variants.slice(0, 3).join(', ') : 'none'}${parent.product_variants && parent.product_variants.length > 3 ? '...' : ''}`);
    
    // Try to fetch the actual variant records
    if (parent.product_variants && parent.product_variants.length > 0) {
      const { data: variants, error: variantError } = await supabase
        .from('airtable_master_items')
        .select('airtable_id, name, st_sku')
        .in('airtable_id', parent.product_variants.slice(0, 3));
      
      if (!variantError && variants && variants.length > 0) {
        console.log('   ✅ Found Variant Records:');
        variants.forEach(v => {
          console.log(`      - ${v.name || v.st_sku} (${v.airtable_id})`);
        });
      } else {
        console.log('   ⚠️  Variants not found in database (may need to import variant records)');
      }
    }
    console.log('');
  }
  
  // 3. Check for orphaned variant IDs
  console.log('🔍 Checking Variant ID Validity:\n');
  
  // Get all unique variant IDs referenced
  const { data: allParents } = await supabase
    .from('airtable_master_items')
    .select('product_variants')
    .not('product_variants', 'is', null)
    .gt('variant_count', 0);
  
  const allVariantIds = new Set();
  allParents.forEach(p => {
    if (p.product_variants) {
      p.product_variants.forEach(id => allVariantIds.add(id));
    }
  });
  
  console.log(`  Total Unique Variant IDs Referenced: ${allVariantIds.size}`);
  
  // Check how many of these IDs exist in the database
  const variantIdArray = Array.from(allVariantIds);
  const { count: foundVariants } = await supabase
    .from('airtable_master_items')
    .select('*', { count: 'exact', head: true })
    .in('airtable_id', variantIdArray);
  
  console.log(`  Variant IDs Found in Database: ${foundVariants || 0}`);
  console.log(`  Missing Variant Records: ${allVariantIds.size - (foundVariants || 0)}`);
  
  if (foundVariants && foundVariants > 0) {
    console.log('\n✅ Parent-Variant Relationships are WORKING!');
    console.log('   The variant IDs in product_variants field correctly reference other records.');
  } else {
    console.log('\n⚠️  Variant records may not be in the database.');
    console.log('   This could mean:');
    console.log('   1. Variants are in a different Airtable table');
    console.log('   2. Need to import additional data');
    console.log('   3. The Products field references a different table');
  }
  
  // 4. Show a complete example
  console.log('\n' + '=' .repeat(80));
  console.log('\n📋 Example Query to Get a Product and Its Variants:\n');
  
  const { data: exampleParent } = await supabase
    .from('airtable_master_items')
    .select('*')
    .eq('is_parent', true)
    .gt('variant_count', 0)
    .limit(1)
    .single();
  
  if (exampleParent) {
    console.log(`Parent: ${exampleParent.name || exampleParent.st_sku}`);
    console.log('\nSQL to get its variants:');
    console.log(`
SELECT * FROM airtable_master_items 
WHERE airtable_id = ANY(ARRAY[${exampleParent.product_variants ? exampleParent.product_variants.map(id => `'${id}'`).join(',') : ''}])
    `);
  }
}

// Run verification
verifyRelationships().then(() => {
  console.log('\n✅ Verification Complete!');
}).catch(error => {
  console.error('Error:', error);
});