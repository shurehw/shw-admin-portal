import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    // Try to fetch from items table
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .limit(5);
    
    // Also try products table as alternative
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      supabaseUrl,
      hasKey: !!supabaseKey,
      keyLength: supabaseKey.length,
      tables: tables?.map(t => t.table_name) || [],
      items: {
        data: items || [],
        error: itemsError?.message || null,
        count: items?.length || 0
      },
      products: {
        data: products || [],
        error: productsError?.message || null,
        count: products?.length || 0
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}