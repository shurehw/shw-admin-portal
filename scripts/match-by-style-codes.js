const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
);

async function matchByStyleCodes() {
  console.log('🔍 Matching Variants to SOS Items using Style Codes\n');
  console.log('=' .repeat(80) + '\n');
  
  // Get all variants with style codes
  const { data: variants } = await supabase
    .from('airtable_products_variants')
    .select('airtable_id, name, style_code, sos_id')
    .not('style_code', 'is', null)
    .limit(15000);
  
  console.log(`📦 Found ${variants.length} variants with style codes\n`);
  
  // Get all items
  const { data: items } = await supabase
    .from('items')
    .select('id, name, sku, sos_id')
    .limit(10000);
  
  console.log(`📋 Found ${items.length} SOS items\n`);
  
  // Create a map of items by SKU and by code in name
  const itemsBySKU = new Map();
  const itemsByCode = new Map();
  
  items.forEach(item => {
    // Map by SKU
    if (item.sku) {
      itemsBySKU.set(item.sku.toUpperCase(), item);
    }
    
    // Extract code from name (in parentheses)
    const match = item.name.match(/\(([^)]+)\)/);
    if (match) {
      const code = match[1].toUpperCase();
      itemsByCode.set(code, item);
    }
  });
  
  console.log(`📊 Created maps: ${itemsBySKU.size} by SKU, ${itemsByCode.size} by code\n`);
  
  // Try to match variants
  let matchedBySKU = 0;
  let matchedByCode = 0;
  let matchedBySOS = 0;
  let noMatch = 0;
  let spCodeMatches = 0;
  let shurCodeMatches = 0;
  
  const updates = [];
  
  for (const variant of variants) {
    const styleCode = variant.style_code.toUpperCase();
    let matched = false;
    let matchedItem = null;
    
    // First try SKU match
    if (itemsBySKU.has(styleCode)) {
      matchedBySKU++;
      matched = true;
      matchedItem = itemsBySKU.get(styleCode);
      if (styleCode.startsWith('SP')) spCodeMatches++;
      else if (styleCode.startsWith('SHUR')) shurCodeMatches++;
    }
    // Then try code in parentheses match
    else if (itemsByCode.has(styleCode)) {
      matchedByCode++;
      matched = true;
      matchedItem = itemsByCode.get(styleCode);
      if (styleCode.startsWith('SP')) spCodeMatches++;
      else if (styleCode.startsWith('SHUR')) shurCodeMatches++;
    }
    // Check if already has correct SOS ID
    else if (variant.sos_id && variant.sos_id !== '-1' && variant.sos_id !== '0') {
      const existingMatch = items.find(i => String(i.sos_id) === String(variant.sos_id));
      if (existingMatch) {
        matchedBySOS++;
        matched = true;
      }
    }
    
    if (!matched) {
      noMatch++;
    }
    
    // If we found a new match, prepare update
    if (matchedItem && String(variant.sos_id) !== String(matchedItem.sos_id)) {
      updates.push({
        airtable_id: variant.airtable_id,
        old_sos_id: variant.sos_id,
        new_sos_id: matchedItem.sos_id,
        variant_name: variant.name,
        item_name: matchedItem.name
      });
    }
  }
  
  console.log('📈 Matching Results:');
  console.log(`  ✅ Matched by SKU: ${matchedBySKU}`);
  console.log(`  ✅ Matched by code in name: ${matchedByCode}`);
  console.log(`  ✅ Already has correct SOS ID: ${matchedBySOS}`);
  console.log(`  ❌ No match found: ${noMatch}`);
  console.log(`\n  📊 By code type:`);
  console.log(`     - SP codes matched: ${spCodeMatches}`);
  console.log(`     - SHUR codes matched: ${shurCodeMatches}`);
  
  const totalMatched = matchedBySKU + matchedByCode + matchedBySOS;
  const matchRate = ((totalMatched / variants.length) * 100).toFixed(1);
  console.log(`\n  🎯 Total match rate: ${matchRate}% (${totalMatched}/${variants.length})`);
  
  if (updates.length > 0) {
    console.log(`\n💡 Found ${updates.length} variants that need SOS ID updates`);
    console.log('\nSample updates needed:');
    updates.slice(0, 5).forEach(u => {
      console.log(`  - ${u.variant_name}`);
      console.log(`    Current SOS: ${u.old_sos_id} → New SOS: ${u.new_sos_id}`);
      console.log(`    Matches: ${u.item_name}`);
    });
    
    // Ask if should update
    console.log('\n📝 To update these variants with correct SOS IDs, run:');
    console.log('   node scripts/update-sos-ids.js');
    
    // Save updates to file for next script
    const fs = require('fs');
    fs.writeFileSync('scripts/sos-updates.json', JSON.stringify(updates, null, 2));
    console.log(`\n✅ Saved ${updates.length} updates to scripts/sos-updates.json`);
  }
}

matchByStyleCodes().then(() => {
  console.log('\n✅ Analysis complete!');
}).catch(error => {
  console.error('Error:', error);
});