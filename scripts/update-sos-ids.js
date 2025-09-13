const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
);

async function updateSOSIds() {
  console.log('📝 Updating SOS IDs based on style code matches\n');
  console.log('=' .repeat(80) + '\n');
  
  // Read the updates file
  const updates = JSON.parse(fs.readFileSync('scripts/sos-updates.json', 'utf8'));
  
  console.log(`Found ${updates.length} variants to update\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const update of updates) {
    try {
      const { error } = await supabase
        .from('airtable_products_variants')
        .update({ sos_id: String(update.new_sos_id) })
        .eq('airtable_id', update.airtable_id);
      
      if (error) throw error;
      
      console.log(`✅ Updated: ${update.variant_name}`);
      console.log(`   SOS ID: ${update.old_sos_id} → ${update.new_sos_id}`);
      successCount++;
    } catch (error) {
      console.log(`❌ Failed: ${update.variant_name}`);
      console.log(`   Error: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log(`\n📊 Results:`);
  console.log(`  ✅ Successfully updated: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
}

updateSOSIds().then(() => {
  console.log('\n✅ Update complete!');
}).catch(error => {
  console.error('Error:', error);
});