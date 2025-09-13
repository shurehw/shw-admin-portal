const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
);

async function checkSOSMatching() {
  console.log('🔍 Analyzing SOS ID Matching\n');
  console.log('=' .repeat(80) + '\n');
  
  // Get all variants
  const { data: variants, error: variantsError } = await supabase
    .from('airtable_products_variants')
    .select('airtable_id, name, sos_id, b2b_id')
    .limit(10000);
  
  if (variantsError) {
    console.error('Error fetching variants:', variantsError);
    return;
  }
  
  // Get all SOS items
  const { data: sosItems, error: sosError } = await supabase
    .from('items')
    .select('id, name, sos_id')
    .limit(10000);
  
  if (sosError) {
    console.error('Error fetching SOS items:', sosError);
    return;
  }
  
  // Create a map of SOS IDs
  const sosMap = new Map();
  sosItems.forEach(item => {
    sosMap.set(String(item.sos_id), item);
  });
  
  // Analyze matching
  let hasSOSId = 0;
  let hasMatchingItem = 0;
  let noSOSId = 0;
  let invalidSOSId = 0;
  let noMatchFound = 0;
  const unmatchedSOSIds = new Set();
  
  variants.forEach(variant => {
    if (!variant.sos_id || variant.sos_id === '' || variant.sos_id === null) {
      noSOSId++;
    } else if (variant.sos_id === '-1' || variant.sos_id === '0') {
      invalidSOSId++;
    } else {
      hasSOSId++;
      const sosIdStr = String(variant.sos_id);
      if (sosMap.has(sosIdStr)) {
        hasMatchingItem++;
      } else {
        noMatchFound++;
        if (unmatchedSOSIds.size < 10) {
          unmatchedSOSIds.add(variant.sos_id);
        }
      }
    }
  });
  
  console.log('📊 Variant Analysis (Total: ' + variants.length + ')');
  console.log('  ✅ Has valid SOS ID: ' + hasSOSId);
  console.log('  ✅ Has matching SOS item: ' + hasMatchingItem);
  console.log('  ❌ No SOS ID: ' + noSOSId);
  console.log('  ❌ Invalid SOS ID (-1 or 0): ' + invalidSOSId);
  console.log('  ⚠️  Has SOS ID but no match: ' + noMatchFound);
  
  console.log('\n📈 Matching Rate: ' + ((hasMatchingItem / hasSOSId * 100).toFixed(1)) + '% of variants with SOS IDs have matching items');
  
  if (unmatchedSOSIds.size > 0) {
    console.log('\n🔍 Sample unmatched SOS IDs:');
    Array.from(unmatchedSOSIds).forEach(id => {
      console.log('  - SOS ID: ' + id);
    });
  }
  
  // Check for duplicate SOS IDs in variants
  const sosIdCounts = {};
  variants.forEach(v => {
    if (v.sos_id && v.sos_id !== '-1' && v.sos_id !== '0') {
      sosIdCounts[v.sos_id] = (sosIdCounts[v.sos_id] || 0) + 1;
    }
  });
  
  const duplicates = Object.entries(sosIdCounts).filter(([id, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log('\n⚠️  Duplicate SOS IDs (multiple variants with same SOS ID):');
    duplicates.slice(0, 5).forEach(([id, count]) => {
      console.log(`  - SOS ID ${id}: ${count} variants`);
    });
  }
  
  console.log('\n' + '=' .repeat(80));
}

checkSOSMatching().then(() => {
  console.log('\n✅ Analysis complete!');
}).catch(error => {
  console.error('Error:', error);
});