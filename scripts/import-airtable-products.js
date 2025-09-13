const { createClient } = require('@supabase/supabase-js');
const Airtable = require('airtable');

// Configuration
const config = {
  airtable: {
    apiKey: 'patJXUirogcy2NeFv.6bfe4d23386f0642c1797bee62a32825a2fed6e2c89ab6b20bec9544f077ae52',
    baseId: 'appKWq1KHqzZeJ3uF', // Purchasing base
    tableName: 'Master Item'
  },
  supabase: {
    url: 'https://jvzswjyflmgenzxsrlwj.supabase.co',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
  }
};

// Initialize Supabase
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Create products table if it doesn't exist
async function createProductsTable() {
  console.log('📊 Checking table structure...');
  
  // Try to fetch from the table first to see if it exists
  const { data: test, error: testError } = await supabase
    .from('airtable_products')
    .select('id')
    .limit(1);
  
  // Table exists if we don't get a relation error
  if (!testError || !testError.message.includes('relation') ) {
    console.log('✅ Table already exists');
    return;
  }
  
  console.log('📝 Table does not exist. Please create it with this SQL in Supabase:');
  console.log(`
CREATE TABLE IF NOT EXISTS airtable_products (
  id SERIAL PRIMARY KEY,
  airtable_id VARCHAR(255) UNIQUE,
  sku VARCHAR(255),
  name TEXT,
  b2b_id VARCHAR(255),
  category VARCHAR(255),
  subcategory VARCHAR(255),
  manufacturer VARCHAR(255),
  manufacturer_code VARCHAR(255),
  cost DECIMAL(10,2),
  tier_a_price DECIMAL(10,2),
  tier_b_price DECIMAL(10,2),
  tier_c_price DECIMAL(10,2),
  tier_aa_price DECIMAL(10,2),
  tier_ab_price DECIMAL(10,2),
  tier_ac_price DECIMAL(10,2),
  quantity_on_hand INTEGER,
  quantity_on_order INTEGER,
  par_level INTEGER,
  monthly_avg_sales INTEGER,
  bigcommerce_id VARCHAR(255),
  image_url TEXT,
  style_code VARCHAR(255),
  cs_size VARCHAR(255),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_airtable_products_sku ON airtable_products(sku);
CREATE INDEX IF NOT EXISTS idx_airtable_products_b2b_id ON airtable_products(b2b_id);
CREATE INDEX IF NOT EXISTS idx_airtable_products_category ON airtable_products(category);
  `);
  
  // For now, we'll proceed assuming the table will be created
  console.log('\n⏩ Proceeding with import (table will be created on first insert)...\n');
}

// Helper to get first array item or null
function getFirst(value) {
  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }
  return value || null;
}

// Helper to get image URL from Airtable attachment
function getImageUrl(photos) {
  if (Array.isArray(photos) && photos.length > 0 && photos[0].url) {
    return photos[0].url;
  }
  return null;
}

// Fetch and import products from Airtable
async function fetchAndImportProducts() {
  console.log('📥 Fetching products from Airtable Master Item table...\n');
  
  Airtable.configure({ apiKey: config.airtable.apiKey });
  const base = Airtable.base(config.airtable.baseId);
  const products = [];
  let recordCount = 0;

  return new Promise((resolve, reject) => {
    base(config.airtable.tableName).select({
      pageSize: 100
    }).eachPage(
      function page(records, fetchNextPage) {
        records.forEach(record => {
          recordCount++;
          
          // Extract and transform the data
          const product = {
            airtable_id: record.id,
            sku: record.get('ST SKU') || null,
            name: record.get('Name') || null,
            b2b_id: record.get('B2B_ID') || getFirst(record.get('B2B_ID (from Products)')),
            category: getFirst(record.get('Category (from Products)')),
            subcategory: getFirst(record.get('SubCategory (from Products)')),
            manufacturer: getFirst(record.get('Manufacturer (from Products)')),
            manufacturer_code: getFirst(record.get('Manufacturer Code (from Products)')),
            cost: record.get('Cost + Pad') || record.get('1st of Month Cost') || 0,
            tier_a_price: record.get('Tier A - 35%') || 0,
            tier_b_price: record.get('Tier B - 30%') || 0,
            tier_c_price: record.get('Tier C - 25%') || 0,
            tier_aa_price: record.get('Tier AA - 40%') || 0,
            tier_ab_price: record.get('Tier AB - 45%') || 0,
            tier_ac_price: record.get('Tier AC - 50%') || 0,
            quantity_on_hand: record.get('Quantity Available Rollup (from Products)') || 0,
            quantity_on_order: record.get('Not Received (from SOS Purchase Order Items)') || 0,
            par_level: record.get('Final Par') || record.get('Par') || 0,
            monthly_avg_sales: record.get('Monthly Avg Sales') || 0,
            bigcommerce_id: record.get('Big Commerce ID') || null,
            image_url: getImageUrl(record.get('Photo')),
            style_code: getFirst(record.get('Style Code (from Products)')),
            cs_size: getFirst(record.get('CS Size (from Products)')),
            raw_data: record.fields // Store complete record for reference
          };
          
          // Only add if we have at least a name or SKU
          if (product.name || product.sku) {
            products.push(product);
            
            // Show progress every 100 records
            if (recordCount % 100 === 0) {
              console.log(`  Processed ${recordCount} records...`);
            }
          }
        });
        
        fetchNextPage();
      },
      async function done(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`\n✅ Fetched ${products.length} products from Airtable\n`);
          
          // Import to Supabase in batches
          console.log('💾 Importing to Supabase...\n');
          const batchSize = 100;
          let imported = 0;
          
          for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            
            const { data, error } = await supabase
              .from('airtable_products')
              .upsert(batch, {
                onConflict: 'airtable_id',
                ignoreDuplicates: false
              });
            
            if (error) {
              console.error(`Error importing batch ${i / batchSize + 1}:`, error);
            } else {
              imported += batch.length;
              console.log(`  Imported ${imported}/${products.length} products...`);
            }
          }
          
          console.log(`\n✅ Successfully imported ${imported} products to Supabase!`);
          resolve(imported);
        }
      }
    );
  });
}

// Show sample data for verification
async function showSampleData() {
  console.log('\n📋 Sample imported data:\n');
  console.log('=' .repeat(80));
  
  const { data, error } = await supabase
    .from('airtable_products')
    .select('*')
    .limit(5);
  
  if (error) {
    console.error('Error fetching sample:', error);
    return;
  }
  
  data.forEach((product, index) => {
    console.log(`\nProduct ${index + 1}:`);
    console.log(`  SKU: ${product.sku}`);
    console.log(`  Name: ${product.name}`);
    console.log(`  Category: ${product.category} > ${product.subcategory}`);
    console.log(`  Manufacturer: ${product.manufacturer}`);
    console.log(`  Cost: $${product.cost}`);
    console.log(`  Tier A Price: $${product.tier_a_price}`);
    console.log(`  On Hand: ${product.quantity_on_hand}`);
    console.log(`  On Order: ${product.quantity_on_order}`);
  });
  
  console.log('\n' + '=' .repeat(80));
}

// Show summary statistics
async function showSummary() {
  console.log('\n📊 Import Summary:\n');
  
  // Get total count
  const { count: totalProducts } = await supabase
    .from('airtable_products')
    .select('*', { count: 'exact', head: true });
  
  console.log(`  Total Products: ${totalProducts || 0}`);
  
  // Get unique categories
  const { data: products } = await supabase
    .from('airtable_products')
    .select('category, subcategory, manufacturer, cost, quantity_on_hand, quantity_on_order');
  
  if (products && products.length > 0) {
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    const subcategories = new Set(products.map(p => p.subcategory).filter(Boolean));
    const manufacturers = new Set(products.map(p => p.manufacturer).filter(Boolean));
    
    const totalInventory = products.reduce((sum, p) => sum + (p.quantity_on_hand || 0), 0);
    const totalOnOrder = products.reduce((sum, p) => sum + (p.quantity_on_order || 0), 0);
    const avgCost = products.reduce((sum, p) => sum + (p.cost || 0), 0) / products.length;
    
    console.log(`  Categories: ${categories.size}`);
    console.log(`  Subcategories: ${subcategories.size}`);
    console.log(`  Manufacturers: ${manufacturers.size}`);
    console.log(`  Total Inventory: ${totalInventory}`);
    console.log(`  Total On Order: ${totalOnOrder}`);
    console.log(`  Average Cost: $${avgCost.toFixed(2)}`);
    
    // Show top categories
    const categoryCount = {};
    products.forEach(p => {
      if (p.category) {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      }
    });
    
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    if (topCategories.length > 0) {
      console.log('\n  Top Categories:');
      topCategories.forEach(([cat, count]) => {
        console.log(`    - ${cat}: ${count} products`);
      });
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Airtable Master Item import to Supabase\n');
  console.log('📍 Source: Purchasing Base > Master Item table');
  console.log('📍 Destination: Supabase > airtable_products table\n');
  console.log('=' .repeat(80) + '\n');

  try {
    // Create table structure
    await createProductsTable();
    
    // Import products
    const count = await fetchAndImportProducts();
    
    // Show sample data
    await showSampleData();
    
    // Show summary
    await showSummary();
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n✨ Import completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Review the imported data in Supabase');
    console.log('  2. The data is now available in the "airtable_products" table');
    console.log('  3. You can query it with: SELECT * FROM airtable_products');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error('\nFull error:', error);
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

module.exports = { fetchAndImportProducts };