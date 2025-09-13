const Airtable = require('airtable');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  airtable: {
    apiKey: 'patJXUirogcy2NeFv.6bfe4d23386f0642c1797bee62a32825a2fed6e2c89ab6b20bec9544f077ae52',
    baseId: 'appKWq1KHqzZeJ3uF', // Purchasing base
    tableName: 'Master Item'
  }
};

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

// Fetch and export products from Airtable
async function exportAirtableProducts() {
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
      function done(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`\n✅ Fetched ${products.length} products from Airtable\n`);
          resolve(products);
        }
      }
    );
  });
}

// Main execution
async function main() {
  console.log('🚀 Starting Airtable Master Item export to JSON\n');
  console.log('=' .repeat(80) + '\n');

  try {
    // Fetch products
    const products = await exportAirtableProducts();
    
    // Save to JSON file
    const filename = `airtable-products-${new Date().toISOString().slice(0, 10)}.json`;
    const filepath = path.join(__dirname, filename);
    
    console.log(`💾 Saving to ${filename}...`);
    fs.writeFileSync(filepath, JSON.stringify(products, null, 2));
    
    console.log(`\n✅ Successfully exported ${products.length} products to ${filename}`);
    
    // Show summary
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    const manufacturers = new Set(products.map(p => p.manufacturer).filter(Boolean));
    
    console.log('\n📊 Export Summary:');
    console.log(`  Total Products: ${products.length}`);
    console.log(`  Categories: ${categories.size}`);
    console.log(`  Manufacturers: ${manufacturers.size}`);
    console.log(`  File Size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n💡 Next steps:');
    console.log('  1. The data is saved in:', filepath);
    console.log('  2. You can now import this JSON into Supabase');
    console.log('  3. Run: node scripts/import-json-to-supabase.js');
    
  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run the export
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}