const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
);

async function debugMismatch() {
  console.log('🔍 Debugging SOS ID Mismatch\n');
  console.log('=' .repeat(80) + '\n');
  
  // Get sample variants with SOS IDs
  const { data: variants } = await supabase
    .from('airtable_products_variants')
    .select('name, sos_id')
    .not('sos_id', 'is', null)
    .neq('sos_id', '-1')
    .neq('sos_id', '0')
    .limit(10);
  
  console.log('📦 Sample Airtable Variants with SOS IDs:');
  variants.forEach(v => {
    console.log(`  - ${v.name}`);
    console.log(`    SOS ID: "${v.sos_id}" (type: ${typeof v.sos_id})`);
  });
  
  console.log('\n' + '-'.repeat(80) + '\n');
  
  // Get sample SOS items
  const { data: items } = await supabase
    .from('items')
    .select('name, sos_id')
    .limit(10);
  
  console.log('📋 Sample SOS Items:');
  items.forEach(i => {
    console.log(`  - ${i.name}`);
    console.log(`    SOS ID: "${i.sos_id}" (type: ${typeof i.sos_id})`);
  });
  
  console.log('\n' + '-'.repeat(80) + '\n');
  
  // Check if any variant SOS IDs exist in items
  console.log('🔗 Checking if variant SOS IDs exist in items table:');
  
  for (const variant of variants.slice(0, 5)) {
    // Try different matching approaches
    const { data: exactMatch } = await supabase
      .from('items')
      .select('name, sos_id')
      .eq('sos_id', variant.sos_id)
      .single();
    
    const { data: stringMatch } = await supabase
      .from('items')
      .select('name, sos_id')
      .eq('sos_id', String(variant.sos_id))
      .single();
    
    const { data: numberMatch } = await supabase
      .from('items')
      .select('name, sos_id')
      .eq('sos_id', parseInt(variant.sos_id))
      .single();
    
    console.log(`\n  Variant: ${variant.name} (SOS ID: ${variant.sos_id})`);
    console.log(`    - Exact match: ${exactMatch ? '✅ Found: ' + exactMatch.name : '❌ Not found'}`);
    console.log(`    - String match: ${stringMatch ? '✅ Found: ' + stringMatch.name : '❌ Not found'}`);
    console.log(`    - Number match: ${numberMatch ? '✅ Found: ' + numberMatch.name : '❌ Not found'}`);
  }
  
  console.log('\n' + '=' .repeat(80) + '\n');
  
  // Check SOS ID ranges
  const { data: itemsRange } = await supabase
    .from('items')
    .select('sos_id')
    .order('sos_id', { ascending: true });
  
  const { data: variantsRange } = await supabase
    .from('airtable_products_variants')
    .select('sos_id')
    .not('sos_id', 'is', null)
    .neq('sos_id', '-1')
    .neq('sos_id', '0')
    .order('sos_id', { ascending: true });
  
  const itemSOSIds = itemsRange.map(i => parseInt(i.sos_id)).filter(id => !isNaN(id));
  const variantSOSIds = variantsRange.map(v => parseInt(v.sos_id)).filter(id => !isNaN(id));
  
  console.log('📊 SOS ID Ranges:');
  console.log(`  Items table:`);
  console.log(`    - Min: ${Math.min(...itemSOSIds)}`);
  console.log(`    - Max: ${Math.max(...itemSOSIds)}`);
  console.log(`    - Count: ${itemSOSIds.length}`);
  
  console.log(`\n  Variants table:`);
  console.log(`    - Min: ${Math.min(...variantSOSIds)}`);
  console.log(`    - Max: ${Math.max(...variantSOSIds)}`);
  console.log(`    - Count: ${variantSOSIds.length}`);
  
  // Find overlapping IDs
  const itemSet = new Set(itemSOSIds);
  const overlapping = variantSOSIds.filter(id => itemSet.has(id));
  
  console.log(`\n  🔗 Overlapping SOS IDs: ${overlapping.length}`);
  if (overlapping.length > 0) {
    console.log(`     Sample overlapping IDs: ${overlapping.slice(0, 10).join(', ')}`);
  }
}

debugMismatch().then(() => {
  console.log('\n✅ Debug complete!');
}).catch(error => {
  console.error('Error:', error);
});