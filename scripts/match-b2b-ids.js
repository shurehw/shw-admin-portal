const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const config = {
  url: 'https://jvzswjyflmgenzxsrlwj.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
};

// Initialize Supabase
const supabase = createClient(config.url, config.serviceKey);

async function matchB2BIds() {
  console.log('🔍 Matching B2B IDs Between Airtable and Items Table\n');
  console.log('=' .repeat(80) + '\n');
  
  // 1. Get some B2B IDs from Airtable to test matching
  const { data: airtableItems } = await supabase
    .from('airtable_master_items')
    .select('b2b_id, name, st_sku')
    .not('b2b_id', 'is', null)
    .limit(10);
  
  console.log('📋 Sample B2B IDs from Airtable:\n');
  airtableItems.forEach(item => {
    console.log(`  B2B ID: ${item.b2b_id} - ${item.name || item.st_sku}`);
  });
  
  // 2. Try to find these in items table
  console.log('\n🔄 Searching for matches in items table...\n');
  
  for (const airtableItem of airtableItems) {
    // Try different matching strategies
    
    // Try exact match on sos_id
    let match = await supabase
      .from('items')
      .select('id, sos_id, name, description, sku')
      .eq('sos_id', airtableItem.b2b_id)
      .limit(1);
    
    if (match.data && match.data.length > 0) {
      console.log(`✅ MATCH on sos_id: ${airtableItem.b2b_id} -> ${match.data[0].name}`);
      continue;
    }
    
    // Try ID as string
    match = await supabase
      .from('items')
      .select('id, sos_id, name, description, sku')
      .eq('id', parseInt(airtableItem.b2b_id))
      .limit(1);
    
    if (match.data && match.data.length > 0) {
      console.log(`✅ MATCH on id: ${airtableItem.b2b_id} -> ${match.data[0].name}`);
      continue;
    }
    
    // Try SKU match
    if (airtableItem.st_sku) {
      match = await supabase
        .from('items')
        .select('id, sos_id, name, description, sku')
        .eq('sku', airtableItem.st_sku)
        .limit(1);
      
      if (match.data && match.data.length > 0) {
        console.log(`✅ MATCH on sku: ${airtableItem.st_sku} -> ${match.data[0].name}`);
        continue;
      }
    }
    
    // Try name similarity
    if (airtableItem.name) {
      const searchName = airtableItem.name.split(' - ')[0].substring(0, 20);
      match = await supabase
        .from('items')
        .select('id, sos_id, name, description, sku')
        .ilike('name', `${searchName}%`)
        .limit(1);
      
      if (match.data && match.data.length > 0) {
        console.log(`✅ MATCH on name: "${searchName}" -> ${match.data[0].name}`);
        continue;
      }
    }
    
    console.log(`❌ NO MATCH: ${airtableItem.b2b_id} - ${airtableItem.name}`);
  }
  
  // 3. Check overall statistics
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 Overall Statistics:\n');
  
  // Get unique B2B IDs from Airtable
  const { data: allB2BIds } = await supabase
    .from('airtable_master_items')
    .select('b2b_id')
    .not('b2b_id', 'is', null);
  
  const uniqueB2BIds = new Set(allB2BIds.map(item => item.b2b_id));
  console.log(`  Unique B2B IDs in Airtable: ${uniqueB2BIds.size}`);
  
  // Check how many can be found in items
  let foundCount = 0;
  const b2bIdArray = Array.from(uniqueB2BIds).slice(0, 100); // Check first 100
  
  for (const b2bId of b2bIdArray) {
    const { data } = await supabase
      .from('items')
      .select('id')
      .or(`sos_id.eq.${b2bId},id.eq.${parseInt(b2bId)}`)
      .limit(1);
    
    if (data && data.length > 0) {
      foundCount++;
    }
  }
  
  console.log(`  Matched in first 100: ${foundCount}/100`);
  console.log(`  Match rate: ${(foundCount/100*100).toFixed(1)}%`);
  
  // 4. Show sample items table records
  console.log('\n📋 Sample records from items table:\n');
  const { data: sampleItems } = await supabase
    .from('items')
    .select('id, sos_id, name, sku')
    .limit(5);
  
  sampleItems.forEach(item => {
    console.log(`  ID: ${item.id}, SOS_ID: ${item.sos_id}, SKU: ${item.sku}, Name: ${item.name}`);
  });
  
  console.log('\n💡 Findings:');
  console.log('  - B2B_ID from Airtable might correspond to different fields in items table');
  console.log('  - May need to use name/SKU matching for better results');
  console.log('  - Consider importing the Airtable "Products" table directly for exact matches');
}

// Run the matching
matchB2BIds().then(() => {
  console.log('\n✅ Analysis Complete!');
}).catch(error => {
  console.error('Error:', error);
});