const Airtable = require('airtable');

// Configuration - UPDATE THESE VALUES
const config = {
  apiKey: 'patJXUirogcy2NeFv.6bfe4d23386f0642c1797bee62a32825a2fed6e2c89ab6b20bec9544f077ae52', // Your Airtable PAT
  baseId: 'appKWq1KHqzZeJ3uF', // First Purchasing base
  tableName: 'Master Item' // The table name
};

async function checkAirtableSchema() {
  console.log('🔍 Checking Airtable schema...\n');
  
  // Configure Airtable
  Airtable.configure({ apiKey: config.apiKey });
  const base = Airtable.base(config.baseId);
  
  try {
    // Fetch a few records to see the structure
    const records = await base(config.tableName).select({
      maxRecords: 3,
      view: "Grid view"
    }).firstPage();
    
    if (records.length === 0) {
      console.log('No records found in the table.');
      return;
    }
    
    console.log(`Found ${records.length} sample records\n`);
    console.log('📊 Available columns in "${config.tableName}" table:\n');
    console.log('=' .repeat(50));
    
    // Get all unique field names from the records
    const allFields = new Set();
    const fieldTypes = {};
    const sampleValues = {};
    
    records.forEach(record => {
      Object.keys(record.fields).forEach(field => {
        allFields.add(field);
        
        // Track sample values and types
        if (!sampleValues[field]) {
          const value = record.get(field);
          sampleValues[field] = value;
          
          // Determine field type
          if (value === null || value === undefined) {
            fieldTypes[field] = 'empty';
          } else if (Array.isArray(value)) {
            fieldTypes[field] = 'array';
          } else if (typeof value === 'object') {
            fieldTypes[field] = 'object';
          } else {
            fieldTypes[field] = typeof value;
          }
        }
      });
    });
    
    // Display fields with sample data
    const sortedFields = Array.from(allFields).sort();
    
    sortedFields.forEach((field, index) => {
      console.log(`${index + 1}. "${field}"`);
      console.log(`   Type: ${fieldTypes[field]}`);
      
      // Show sample value
      const sample = sampleValues[field];
      if (sample !== undefined && sample !== null) {
        if (Array.isArray(sample)) {
          console.log(`   Sample: [Array with ${sample.length} items]`);
          if (sample.length > 0 && typeof sample[0] === 'string') {
            console.log(`   First item: "${sample[0]}"`);
          }
        } else if (typeof sample === 'object') {
          console.log(`   Sample: [Object]`);
        } else if (typeof sample === 'string' && sample.length > 50) {
          console.log(`   Sample: "${sample.substring(0, 50)}..."`);
        } else {
          console.log(`   Sample: "${sample}"`);
        }
      }
      console.log('');
    });
    
    console.log('=' .repeat(50));
    console.log(`\nTotal fields found: ${sortedFields.length}`);
    
    // Show first complete record as JSON for reference
    console.log('\n📋 First complete record (JSON format):');
    console.log('-'.repeat(50));
    console.log(JSON.stringify(records[0].fields, null, 2));
    
  } catch (error) {
    console.error('❌ Error fetching from Airtable:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Check your API key is correct');
    console.error('2. Check your Base ID is correct');
    console.error('3. Check the table name is "Master Item" (case sensitive)');
    console.error('4. Ensure you have access to this base');
  }
}

// Check if credentials are configured
if (config.apiKey === 'YOUR_AIRTABLE_API_KEY' || config.baseId === 'YOUR_BASE_ID') {
  console.log('⚠️  Please update the configuration in this script:');
  console.log('');
  console.log('1. Get your API key from: https://airtable.com/account');
  console.log('2. Get your Base ID from the URL when viewing your base');
  console.log('   Example: https://airtable.com/appXXXXXXXXXXXXXX/...');
  console.log('   The Base ID is the part starting with "app"');
  console.log('');
  console.log('Edit this file and replace:');
  console.log('  - YOUR_AIRTABLE_API_KEY with your actual API key');
  console.log('  - YOUR_BASE_ID with your Purchasing base ID');
  process.exit(1);
}

// Run the check
checkAirtableSchema().then(() => {
  console.log('\n✅ Schema check complete!');
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});