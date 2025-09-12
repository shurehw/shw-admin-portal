import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// SOS Backup Supabase credentials
const sosSupabaseUrl = 'https://jvzswjyflmgenzxsrlwj.supabase.co';
const sosSupabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w';

const sosSupabase = createClient(sosSupabaseUrl, sosSupabaseServiceKey);

export async function POST() {
  try {
    // Call the processing function in Supabase (uses mappings if available)
    const { data, error } = await sosSupabase
      .rpc('apply_staging_to_products_with_mappings', {
        p_batch_name: `import_${new Date().toISOString().slice(0, 10)}`
      });

    if (error) {
      console.error('Error processing staging:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Parse the results
    const results = data?.[0] || {};

    return NextResponse.json({
      success: true,
      results: {
        parents_created: results.parents_created || 0,
        variants_created: results.variants_created || 0,
        crosswalk_entries: results.crosswalk_entries || 0,
        errors: results.errors || 0
      },
      message: 'Successfully processed staging data into parent/variant structure'
    });

  } catch (error) {
    console.error('Error in process-staging:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process staging data' },
      { status: 500 }
    );
  }
}