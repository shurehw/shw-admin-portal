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

// Helper to get image URLs from Airtable attachments
function getImageUrls(photos) {
  if (!Array.isArray(photos)) return [];
  return photos.map(photo => ({
    url: photo.url,
    filename: photo.filename,
    thumbnails: photo.thumbnails
  })).filter(p => p.url);
}

// Fetch and export products from Airtable with ONLY selected fields
async function exportAirtableProducts() {
  console.log('📥 Fetching products from Airtable Master Item table...\n');
  console.log('📋 Extracting only essential fields:\n');
  console.log('   - Name, ST SKU, AutoNumber, B2B_ID, BigCommerce ID');
  console.log('   - Products (variants), Category, SubCategory, Special Item');
  console.log('   - Photo, Images\n');
  
  Airtable.configure({ apiKey: config.airtable.apiKey });
  const base = Airtable.base(config.airtable.baseId);
  const products = [];
  let recordCount = 0;
  let parentCount = 0; // Count records that have variants

  return new Promise((resolve, reject) => {
    base(config.airtable.tableName).select({
      pageSize: 100
    }).eachPage(
      function page(records, fetchNextPage) {
        records.forEach(record => {
          recordCount++;
          
          // Extract ONLY the requested fields
          const productVariants = record.get('Products') || [];
          const hasVariants = productVariants.length > 0;
          
          if (hasVariants) parentCount++;
          
          const product = {
            // Core identifiers
            airtable_id: record.id,
            name: record.get('Name') || null,
            st_sku: record.get('ST SKU') || null,
            auto_number: record.get('AutoNumber') || null,
            b2b_id: record.get('B2B_ID') || null,
            bigcommerce_id: record.get('Big Commerce ID') || null,
            
            // Product relationships and variants
            product_variants: productVariants, // This contains the variant record IDs
            variant_count: productVariants.length,
            is_parent: hasVariants,
            
            // Categories from related products
            b2b_ids_from_products: record.get('B2B_ID (from Products)') || [],
            category: getFirst(record.get('Category (from Products)')),
            subcategory: getFirst(record.get('SubCategory (from Products)')),
            special_item: record.get('Special Item (from Products)') || [],
            
            // Images
            photos: getImageUrls(record.get('Photo')),
            images_from_products: getImageUrls(record.get('Images (from Products)'))
          };
          
          // Only add if we have at least a name or SKU
          if (product.name || product.st_sku) {
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
          console.log(`\n✅ Fetched ${products.length} products from Airtable`);
          console.log(`   ${parentCount} products have variants (parent items)`);
          console.log(`   ${products.length - parentCount} products are standalone or variants\n`);
          resolve(products);
        }
      }
    );
  });
}

// Main execution
async function main() {
  console.log('🚀 Starting Streamlined Airtable Export\n');
  console.log('=' .repeat(80) + '\n');

  try {
    // Fetch products
    const products = await exportAirtableProducts();
    
    // Save to JSON file
    const filename = `airtable-products-streamlined-${new Date().toISOString().slice(0, 10)}.json`;
    const filepath = path.join(__dirname, filename);
    
    console.log(`💾 Saving to ${filename}...`);
    fs.writeFileSync(filepath, JSON.stringify(products, null, 2));
    
    console.log(`\n✅ Successfully exported ${products.length} products to ${filename}`);
    
    // Show summary
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    const subcategories = new Set(products.map(p => p.subcategory).filter(Boolean));
    const withPhotos = products.filter(p => p.photos.length > 0).length;
    const withVariants = products.filter(p => p.is_parent).length;
    const totalVariants = products.reduce((sum, p) => sum + p.variant_count, 0);
    
    console.log('\n📊 Export Summary:');
    console.log(`  Total Products: ${products.length}`);
    console.log(`  Parent Products (with variants): ${withVariants}`);
    console.log(`  Total Variant References: ${totalVariants}`);
    console.log(`  Categories: ${categories.size}`);
    console.log(`  Subcategories: ${subcategories.size}`);
    console.log(`  Products with Photos: ${withPhotos}`);
    console.log(`  File Size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Show sample parent-variant relationships
    const parentsWithVariants = products.filter(p => p.is_parent).slice(0, 3);
    if (parentsWithVariants.length > 0) {
      console.log('\n🔗 Sample Parent-Variant Relationships:');
      parentsWithVariants.forEach(parent => {
        console.log(`  ${parent.name || parent.st_sku}: ${parent.variant_count} variants`);
        console.log(`    Variant IDs: ${parent.product_variants.slice(0, 3).join(', ')}${parent.product_variants.length > 3 ? '...' : ''}`);
      });
    }
    
    console.log('\n💡 Next steps:');
    console.log('  1. The streamlined data is saved in:', filepath);
    console.log('  2. Use the "product_variants" field to link parent products to their variants');
    console.log('  3. Each variant ID references another record in this same dataset');
    
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