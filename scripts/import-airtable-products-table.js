const Airtable = require('airtable');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  airtable: {
    apiKey: 'patJXUirogcy2NeFv.6bfe4d23386f0642c1797bee62a32825a2fed6e2c89ab6b20bec9544f077ae52',
    baseId: 'appKWq1KHqzZeJ3uF', // Purchasing base
    tableName: 'Products' // The Products table that contains the variants
  },
  supabase: {
    url: 'https://jvzswjyflmgenzxsrlwj.supabase.co',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
  }
};

// Initialize Supabase
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// First, let's check what columns are in the Products table
async function checkProductsSchema() {
  console.log('🔍 Checking Airtable Products table schema...\n');
  
  Airtable.configure({ apiKey: config.airtable.apiKey });
  const base = Airtable.base(config.airtable.baseId);
  
  try {
    const records = await base('Products').select({
      maxRecords: 3
    }).firstPage();
    
    if (records.length === 0) {
      console.log('No records found in Products table.');
      return null;
    }
    
    console.log(`Found ${records.length} sample records\n`);
    
    // Get all unique field names
    const allFields = new Set();
    const sampleValues = {};
    
    records.forEach(record => {
      Object.keys(record.fields).forEach(field => {
        allFields.add(field);
        if (!sampleValues[field]) {
          sampleValues[field] = record.get(field);
        }
      });
    });
    
    const sortedFields = Array.from(allFields).sort();
    
    console.log('📊 Available columns in Products table:\n');
    sortedFields.forEach((field, index) => {
      const sample = sampleValues[field];
      let sampleStr = '';
      if (sample !== undefined && sample !== null) {
        if (Array.isArray(sample)) {
          sampleStr = `[Array with ${sample.length} items]`;
        } else if (typeof sample === 'object') {
          sampleStr = '[Object]';
        } else if (typeof sample === 'string' && sample.length > 50) {
          sampleStr = `"${sample.substring(0, 50)}..."`;
        } else {
          sampleStr = `"${sample}"`;
        }
      }
      console.log(`  ${index + 1}. ${field}: ${sampleStr}`);
    });
    
    return sortedFields;
  } catch (error) {
    console.error('Error fetching Products table:', error.message);
    return null;
  }
}

// Import Products table
async function importProductsTable() {
  console.log('\n📥 Fetching all records from Airtable Products table...\n');
  
  Airtable.configure({ apiKey: config.airtable.apiKey });
  const base = Airtable.base(config.airtable.baseId);
  const products = [];
  let recordCount = 0;

  return new Promise((resolve, reject) => {
    base('Products').select({
      pageSize: 100
    }).eachPage(
      function page(records, fetchNextPage) {
        records.forEach(record => {
          recordCount++;
          
          // Capture all fields but focus on key ones
          const product = {
            airtable_id: record.id,
            // Common fields we expect
            b2b_id: record.get('B2B_ID') || record.get('b2b_id') || null,
            name: record.get('Name') || record.get('Product Name') || record.get('Description') || null,
            sku: record.get('SKU') || record.get('Item Code') || record.get('Product Code') || null,
            category: record.get('Category') || null,
            subcategory: record.get('SubCategory') || record.get('Sub Category') || null,
            manufacturer: record.get('Manufacturer') || record.get('Vendor') || null,
            manufacturer_code: record.get('Manufacturer Code') || record.get('Vendor Code') || null,
            cs_size: record.get('CS Size') || record.get('Case Size') || null,
            style_code: record.get('Style Code') || null,
            special_item: record.get('Special Item') || null,
            inventory: record.get('Inventory') || record.get('Quantity Available') || null,
            // Store all fields as raw data
            raw_fields: record.fields
          };
          
          products.push(product);
          
          if (recordCount % 100 === 0) {
            console.log(`  Processed ${recordCount} products...`);
          }
        });
        
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`\n✅ Fetched ${products.length} products from Airtable Products table\n`);
          resolve(products);
        }
      }
    );
  });
}

// Save to JSON and import to Supabase
async function saveAndImport(products) {
  // Save to JSON first
  const filename = `airtable-products-table-${new Date().toISOString().slice(0, 10)}.json`;
  const filepath = path.join(__dirname, filename);
  
  console.log(`💾 Saving to ${filename}...`);
  fs.writeFileSync(filepath, JSON.stringify(products, null, 2));
  console.log(`✅ Saved ${products.length} products to JSON\n`);
  
  // Create table in Supabase
  console.log('📊 Creating airtable_products_variants table in Supabase...\n');
  
  const createTableSQL = `
CREATE TABLE IF NOT EXISTS airtable_products_variants (
  id SERIAL PRIMARY KEY,
  airtable_id VARCHAR(255) UNIQUE NOT NULL,
  b2b_id VARCHAR(255),
  name TEXT,
  sku VARCHAR(255),
  category VARCHAR(255),
  subcategory VARCHAR(255),
  manufacturer VARCHAR(255),
  manufacturer_code VARCHAR(255),
  cs_size VARCHAR(255),
  style_code VARCHAR(255),
  special_item BOOLEAN,
  inventory INTEGER,
  raw_fields JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_airtable_id ON airtable_products_variants(airtable_id);
CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_b2b_id ON airtable_products_variants(b2b_id);
CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_sku ON airtable_products_variants(sku);
CREATE INDEX IF NOT EXISTS idx_airtable_products_variants_name ON airtable_products_variants USING GIN(to_tsvector('english', name));
  `;
  
  console.log('Please run this SQL in Supabase if table doesn\'t exist:');
  console.log(createTableSQL);
  console.log('\nAttempting to import to Supabase...\n');
  
  // Import in batches
  const batchSize = 100;
  let imported = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('airtable_products_variants')
      .upsert(batch, {
        onConflict: 'airtable_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error(`Error importing batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      if (i === 0) {
        console.log('\n⚠️  Table may not exist. Please create it first using the SQL above.');
        return;
      }
    } else {
      imported += batch.length;
      console.log(`  ✅ Imported ${imported}/${products.length} products...`);
    }
  }
  
  console.log(`\n✅ Successfully imported ${imported} products!`);
}

// Main execution
async function main() {
  console.log('🚀 Starting Airtable Products Table Import\n');
  console.log('=' .repeat(80) + '\n');
  
  try {
    // First check the schema
    const fields = await checkProductsSchema();
    
    if (!fields) {
      console.log('Could not fetch Products table schema. Please check table name.');
      return;
    }
    
    console.log('\n' + '=' .repeat(80) + '\n');
    
    // Import the products
    const products = await importProductsTable();
    
    // Save and import
    await saveAndImport(products);
    
    // Now we can create the mapping
    console.log('\n' + '=' .repeat(80));
    console.log('\n🔗 Next Step: Create mapping between Airtable variants and SOS items\n');
    console.log('The variant records are now available in airtable_products_variants table.');
    console.log('We can now match these with your SOS items using name/SKU matching.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}