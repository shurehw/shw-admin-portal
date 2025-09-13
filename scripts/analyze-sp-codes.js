const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
);

async function analyzeSPCodes() {
  console.log('🔍 Analyzing SP Product Codes for Matching\n');
  console.log('=' .repeat(80) + '\n');
  
  // Get variants with their data
  const { data: variants } = await supabase
    .from('airtable_products_variants')
    .select('airtable_id, name, sos_id, style_code')
    .limit(20);
  
  console.log('📦 Sample Airtable Variants:');
  variants.forEach(v => {
    // Extract SP codes from name using regex
    const spMatch = v.name.match(/\(([^)]+)\)/);
    const codeInParens = spMatch ? spMatch[1] : null;
    const hasSPCode = codeInParens && codeInParens.startsWith('SP');
    
    console.log(`\n  ${v.name}`);
    console.log(`    - SOS ID: ${v.sos_id || 'none'}`);
    console.log(`    - Style Code: ${v.style_code || 'none'}`);
    console.log(`    - Code in parens: ${codeInParens || 'none'}`);
    console.log(`    - Has SP code: ${hasSPCode ? '✅ ' + codeInParens : '❌'}`);
  });
  
  console.log('\n' + '-'.repeat(80) + '\n');
  
  // Get SOS items
  const { data: items } = await supabase
    .from('items')
    .select('id, name, sku, sos_id')
    .limit(20);
  
  console.log('📋 Sample SOS Items:');
  items.forEach(i => {
    // Extract codes from name
    const spMatch = i.name.match(/\(([^)]+)\)/);
    const codeInParens = spMatch ? spMatch[1] : null;
    const hasSPCode = codeInParens && codeInParens.startsWith('SP');
    
    console.log(`\n  ${i.name}`);
    console.log(`    - SKU: ${i.sku || 'none'}`);
    console.log(`    - SOS ID: ${i.sos_id}`);
    console.log(`    - Code in parens: ${codeInParens || 'none'}`);
    console.log(`    - Has SP code: ${hasSPCode ? '✅ ' + codeInParens : '❌'}`);
  });
  
  console.log('\n' + '-'.repeat(80) + '\n');
  
  // Try matching by SP codes
  console.log('🔗 Testing SP Code Matching:\n');
  
  for (const variant of variants.slice(0, 5)) {
    const variantSPMatch = variant.name.match(/\(([^)]+)\)/);
    const variantCode = variantSPMatch ? variantSPMatch[1] : null;
    
    if (variantCode && variantCode.startsWith('SP')) {
      // Try to find matching item by code
      const { data: matchingItems } = await supabase
        .from('items')
        .select('id, name, sku')
        .like('name', `%${variantCode}%`);
      
      console.log(`  Variant: ${variant.name}`);
      console.log(`    Code: ${variantCode}`);
      if (matchingItems && matchingItems.length > 0) {
        console.log(`    ✅ Found ${matchingItems.length} matches:`);
        matchingItems.forEach(item => {
          console.log(`       - ${item.name}`);
        });
      } else {
        console.log(`    ❌ No matches found`);
      }
      console.log('');
    }
  }
  
  // Count how many have SP codes
  const { data: allVariants } = await supabase
    .from('airtable_products_variants')
    .select('name')
    .limit(1000);
  
  let spCodeCount = 0;
  let shurCodeCount = 0;
  let otherCodeCount = 0;
  let noCodeCount = 0;
  
  allVariants.forEach(v => {
    const match = v.name.match(/\(([^)]+)\)/);
    if (match) {
      const code = match[1];
      if (code.startsWith('SP')) spCodeCount++;
      else if (code.startsWith('SHUR')) shurCodeCount++;
      else otherCodeCount++;
    } else {
      noCodeCount++;
    }
  });
  
  console.log('\n📊 Code Statistics (from ' + allVariants.length + ' variants):');
  console.log(`  - With SP codes: ${spCodeCount}`);
  console.log(`  - With SHUR codes: ${shurCodeCount}`);
  console.log(`  - With other codes: ${otherCodeCount}`);
  console.log(`  - No code in parens: ${noCodeCount}`);
}

analyzeSPCodes().then(() => {
  console.log('\n✅ Analysis complete!');
}).catch(error => {
  console.error('Error:', error);
});