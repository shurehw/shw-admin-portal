import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';

// SOS Backup Supabase credentials
const sosSupabaseUrl = 'https://jvzswjyflmgenzxsrlwj.supabase.co';
const sosSupabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w';

const sosSupabase = createClient(sosSupabaseUrl, sosSupabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      apiKey, 
      baseId, 
      tableName = 'Parent Mappings',
      viewName = 'Grid view'
    } = body;

    if (!apiKey || !baseId) {
      return NextResponse.json(
        { success: false, error: 'Airtable API key and Base ID are required' },
        { status: 400 }
      );
    }

    // Configure Airtable
    Airtable.configure({
      apiKey: apiKey
    });

    const base = Airtable.base(baseId);
    const mappings: any[] = [];

    // Fetch records from Airtable
    await new Promise((resolve, reject) => {
      base(tableName).select({
        view: viewName,
        pageSize: 100
      }).eachPage(
        function page(records, fetchNextPage) {
          records.forEach(record => {
            // Map Airtable fields to our structure
            // Adjust these field names based on your Airtable column names
            const mapping = {
              parent_sku: record.get('Parent SKU') || record.get('parent_sku') || record.get('Parent_SKU'),
              parent_name: record.get('Parent Name') || record.get('parent_name') || record.get('Parent_Name') || record.get('Parent Product'),
              variant_sku: record.get('Variant SKU') || record.get('variant_sku') || record.get('SKU') || record.get('Child SKU'),
              variant_name: record.get('Variant Name') || record.get('variant_name') || record.get('Product Name'),
              size_option: record.get('Size') || record.get('size') || record.get('Size Option'),
              color_option: record.get('Color') || record.get('color') || record.get('Color Option'),
              pack_option: record.get('Pack') || record.get('pack') || record.get('Pack Size'),
              category: record.get('Category') || record.get('category') || record.get('Product Category'),
              brand: record.get('Brand') || record.get('brand') || record.get('Brand Name')
            };

            // Only add if we have minimum required fields
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
            resolve(mappings);
          }
        }
      );
    });

    if (mappings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid mappings found in Airtable' },
        { status: 400 }
      );
    }

    // Import mappings to database
    const { data, error } = await sosSupabase
      .rpc('import_parent_mappings', {
        p_mappings: mappings
      });

    if (error) {
      console.error('Error importing mappings from Airtable:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: data || mappings.length,
      message: `Successfully imported ${data || mappings.length} parent mappings from Airtable`,
      details: {
        totalRecords: mappings.length,
        sampleMapping: mappings[0] // Show first mapping for verification
      }
    });

  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch from Airtable'
      },
      { status: 500 }
    );
  }
}