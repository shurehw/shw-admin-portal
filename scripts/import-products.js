const { createClient } = require('@supabase/supabase-js');
const Airtable = require('airtable');

// Configuration - UPDATE THESE VALUES
const config = {
  airtable: {
    apiKey: 'YOUR_AIRTABLE_API_KEY', // Replace with your API key
    baseId: 'YOUR_BASE_ID', // Replace with your base ID (starts with app...)
    tableName: 'Parent Mappings', // Your table name
    viewName: 'Grid view' // Your view name
  },
  supabase: {
    url: 'https://jvzswjyflmgenzxsrlwj.supabase.co',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
  }
};

// Initialize Supabase
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Step 1: Fetch parent mappings from Airtable
async function fetchAirtableMappings() {
  console.log('📊 Fetching parent mappings from Airtable...');
  
  Airtable.configure({ apiKey: config.airtable.apiKey });
  const base = Airtable.base(config.airtable.baseId);
  const mappings = [];

  return new Promise((resolve, reject) => {
    base(config.airtable.tableName).select({
      view: config.airtable.viewName,
      pageSize: 100
    }).eachPage(
      function page(records, fetchNextPage) {
        records.forEach(record => {
          const mapping = {
            parent_sku: record.get('Parent SKU') || record.get('parent_sku') || record.get('Parent_SKU'),
            parent_name: record.get('Parent Name') || record.get('parent_name') || record.get('Parent Product'),
            variant_sku: record.get('Variant SKU') || record.get('variant_sku') || record.get('SKU') || record.get('Child SKU'),
            variant_name: record.get('Variant Name') || record.get('variant_name') || record.get('Product Name'),
            size_option: record.get('Size') || record.get('size') || record.get('Size Option'),
            color_option: record.get('Color') || record.get('color') || record.get('Color Option'),
            pack_option: record.get('Pack') || record.get('pack') || record.get('Pack Size'),
            category: record.get('Category') || record.get('category') || record.get('Product Category'),
            brand: record.get('Brand') || record.get('brand') || record.get('Brand Name')
          };

          if (mapping.parent_sku && mapping.variant_sku) {
            mappings.push(mapping);
          }
        });
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ Found ${mappings.length} parent mappings`);
          resolve(mappings);
        }
      }
    );
  });
}

// Step 2: Import mappings to Supabase
async function importMappingsToSupabase(mappings) {
  console.log('💾 Importing mappings to database...');
  
  const { data, error } = await supabase.rpc('import_parent_mappings', {
    p_mappings: mappings
  });

  if (error) {
    throw new Error(`Failed to import mappings: ${error.message}`);
  }

  console.log(`✅ Imported ${data || mappings.length} mappings to database`);
  return data;
}

// Step 3: Import SOS products to staging
async function importSOSProducts() {
  console.log('📦 Importing products from SOS database...');
  
  const { data, error } = await supabase.rpc('import_sos_items_to_staging');

  if (error) {
    throw new Error(`Failed to import SOS products: ${error.message}`);
  }

  console.log(`✅ Imported ${data || 0} products from SOS to staging`);
  return data;
}

// Step 4: Process staging data with mappings
async function processStaging() {
  console.log('⚙️ Processing staging data into parent/variant structure...');
  
  const batchName = `import_${new Date().toISOString().slice(0, 10)}`;
  const { data, error } = await supabase.rpc('apply_staging_to_products_with_mappings', {
    p_batch_name: batchName
  });

  if (error) {
    throw new Error(`Failed to process staging: ${error.message}`);
  }

  const results = data?.[0] || {};
  console.log('\n📊 Processing Results:');
  console.log(`  ✅ Parent products created: ${results.parents_created || 0}`);
  console.log(`  ✅ Variants created: ${results.variants_created || 0}`);
  console.log(`  ✅ Crosswalk entries: ${results.crosswalk_entries || 0}`);
  if (results.errors > 0) {
    console.log(`  ⚠️ Errors: ${results.errors}`);
  }

  return results;
}

// Main execution
async function main() {
  console.log('🚀 Starting product import and mapping process...\n');

  try {
    // Check if Airtable credentials are configured
    if (config.airtable.apiKey === 'YOUR_AIRTABLE_API_KEY' || 
        config.airtable.baseId === 'YOUR_BASE_ID') {
      console.log('⚠️ Please update the Airtable configuration in this script:');
      console.log('  - apiKey: Your Airtable API key');
      console.log('  - baseId: Your Airtable base ID (from URL)');
      console.log('\nSkipping Airtable import. Proceeding with auto-detection only.\n');
      
      // Still import SOS and process without mappings
      await importSOSProducts();
      await processStaging();
    } else {
      // Full process with Airtable mappings
      const mappings = await fetchAirtableMappings();
      
      if (mappings.length > 0) {
        await importMappingsToSupabase(mappings);
        console.log('');
      }
      
      await importSOSProducts();
      console.log('');
      
      await processStaging();
    }

    console.log('\n✨ Import process completed successfully!');
    
    // Show some sample queries you can run
    console.log('\n📋 You can now query your data:');
    console.log('  - Parent products: SELECT * FROM parent_products;');
    console.log('  - Product variants: SELECT * FROM product_variants;');
    console.log('  - Crosswalk: SELECT * FROM sos_variant_crosswalk;');
    console.log('  - Mapping status: SELECT * FROM v_parent_mapping_status;');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main().then(() => {
    console.log('\n👍 Done!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}