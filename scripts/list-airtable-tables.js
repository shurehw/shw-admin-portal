const Airtable = require('airtable');

// Configuration
const config = {
  apiKey: 'patJXUirogcy2NeFv.6bfe4d23386f0642c1797bee62a32825a2fed6e2c89ab6b20bec9544f077ae52',
  baseId: 'appKWq1KHqzZeJ3uF' // Purchasing base
};

async function listTables() {
  console.log('🔍 Listing all tables in Purchasing base...\n');
  console.log('Base ID:', config.baseId);
  console.log('\n' + '=' .repeat(80) + '\n');
  
  // Configure Airtable
  Airtable.configure({ apiKey: config.apiKey });
  const base = Airtable.base(config.baseId);
  
  // Common table names to try
  const tablesToTry = [
    'Products',
    'Product',
    'Items', 
    'Master Item',
    'Master Items',
    'Variants',
    'Product Variants',
    'Inventory',
    'SKUs',
    'Catalog',
    'Product Catalog',
    'CRM',
    'Sales Orders',
    'SOS Purchase Order Items',
    'SOS Purchase Orders',
    'Suppliers',
    'Vendor',
    'Vendors'
  ];
  
  console.log('Testing common table names:\n');
  
  const foundTables = [];
  
  for (const tableName of tablesToTry) {
    try {
      const records = await base(tableName).select({
        maxRecords: 1,
        fields: []
      }).firstPage();
      
      console.log(`✅ Found table: "${tableName}" (${records.length} record tested)`);
      foundTables.push(tableName);
    } catch (error) {
      if (!error.message.includes('Could not find table')) {
        console.log(`❓ Error with "${tableName}": ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 Summary:\n');
  console.log(`Found ${foundTables.length} accessible tables:`);
  foundTables.forEach(table => {
    console.log(`  - ${table}`);
  });
  
  // Now let's check what the Master Item's "Products" field references
  console.log('\n' + '=' .repeat(80));
  console.log('\n🔗 Checking Master Item "Products" field references...\n');
  
  try {
    const masterItems = await base('Master Item').select({
      maxRecords: 1,
      filterByFormula: 'NOT({Products} = BLANK())'
    }).firstPage();
    
    if (masterItems.length > 0) {
      const item = masterItems[0];
      console.log('Sample Master Item with Products:');
      console.log(`  Name: ${item.get('Name')}`);
      console.log(`  Products field: ${item.get('Products')}`);
      console.log('\nThe "Products" field contains Airtable record IDs.');
      console.log('These IDs likely reference records in one of the found tables.');
    }
  } catch (error) {
    console.log('Could not analyze Master Item Products field:', error.message);
  }
}

// Run the listing
listTables().then(() => {
  console.log('\n✅ Complete!');
}).catch(error => {
  console.error('Error:', error);
});