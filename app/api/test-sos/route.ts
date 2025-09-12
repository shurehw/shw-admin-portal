import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// SOS Backup Supabase credentials
const sosSupabaseUrl = 'https://jvzswjyflmgenzxsrlwj.supabase.co';
const sosSupabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w';

export async function GET() {
  try {
    const sosSupabase = createClient(sosSupabaseUrl, sosSupabaseServiceKey);
    
    // Test connection to item table
    const { data: items, error: itemError, count } = await sosSupabase
      .from('item')
      .select('*', { count: 'exact', head: false })
      .limit(5);
    
    // Also check what columns exist
    const { data: sampleItem } = await sosSupabase
      .from('item')
      .select('*')
      .limit(1)
      .single();
    
    return NextResponse.json({
      connection: 'success',
      itemTable: {
        error: itemError?.message || null,
        count: count || 0,
        sample: items || [],
        columns: sampleItem ? Object.keys(sampleItem) : []
      },
      debug: {
        url: sosSupabaseUrl,
        hasKey: !!sosSupabaseServiceKey,
        keyLength: sosSupabaseServiceKey.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      connection: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}