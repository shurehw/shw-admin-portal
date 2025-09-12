import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// SOS Backup Supabase credentials
const sosSupabaseUrl = 'https://jvzswjyflmgenzxsrlwj.supabase.co';
const sosSupabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w';

const sosSupabase = createClient(sosSupabaseUrl, sosSupabaseServiceKey);

export async function POST() {
  try {
    // Call the import function in Supabase
    const { data, error } = await sosSupabase
      .rpc('import_sos_items_to_staging');

    if (error) {
      console.error('Error importing from SOS:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: data || 0,
      message: `Successfully imported ${data || 0} products to staging`
    });

  } catch (error) {
    console.error('Error in import-sos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import products from SOS' },
      { status: 500 }
    );
  }
}