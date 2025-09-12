import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// SOS Backup Supabase credentials
const sosSupabaseUrl = 'https://jvzswjyflmgenzxsrlwj.supabase.co';
const sosSupabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w';

export async function GET() {
  try {
    const sosSupabase = createClient(sosSupabaseUrl, sosSupabaseServiceKey);
    
    // Try different table names
    const { data: items, error: itemError, count } = await sosSupabase
      .from('items')  // Try 'items' instead of 'item'
      .select('*', { count: 'exact', head: false })
      .limit(5);
    
    // Also try 'item' table
    const { data: item, error: itemSingularError } = await sosSupabase
      .from('item')
      .select('*')
      .limit(5);
    
    // Try 'products' table
    const { data: products, error: productsError } = await sosSupabase
      .from('products')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      connection: 'success',
      tables: {
        items: {
          error: itemError?.message || null,
          count: count || 0,
          sample: items || [],
          columns: items?.[0] ? Object.keys(items[0]) : []
        },
        item: {
          error: itemSingularError?.message || null,
          sample: item || [],
          columns: item?.[0] ? Object.keys(item[0]) : []
        },
        products: {
          error: productsError?.message || null,
          sample: products || [],
          columns: products?.[0] ? Object.keys(products[0]) : []
        }
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