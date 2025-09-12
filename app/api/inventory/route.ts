import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// SOS Backup Supabase credentials
const sosSupabaseUrl = 'https://jvzswjyflmgenzxsrlwj.supabase.co';
const sosSupabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w';

const sosSupabase = createClient(sosSupabaseUrl, sosSupabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const lowStockOnly = searchParams.get('low_stock_only') === 'true';

    // Fetch from SOS backup items table
    let query = sosSupabase
      .from('items')  // Try 'items' table
      .select('*')
      .order('name', { ascending: true })
      .limit(parseInt(limit));

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching from SOS Supabase:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedProducts = (products || []).map((item: any) => ({
      id: item.id,
      name: item.name || 'Unnamed Product',
      sku: item.sku || `SKU-${item.id}`,
      price: parseFloat(item.price) || 0,
      sale_price: item.sale_price ? parseFloat(item.sale_price) : null,
      inventory_level: parseInt(item.stock) || parseInt(item.inventory_level) || 0,
      inventory_warning_level: parseInt(item.inventory_warning_level) || 10,
      is_low_stock: (parseInt(item.stock) || 0) < 50,
      is_out_of_stock: (parseInt(item.stock) || 0) === 0,
      backorder_enabled: item.backorder_enabled || false,
      category: item.category || 'Uncategorized',
      brand: item.brand || 'ShurePrint',
      is_visible: item.is_visible !== false,
      is_featured: item.is_featured || false,
      image_url: item.image_url || item.image || '/placeholder-product.jpg',
      description: item.description || '',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    }));

    // Filter for low stock if requested
    const finalProducts = lowStockOnly 
      ? transformedProducts.filter((p: any) => p.is_low_stock || p.is_out_of_stock)
      : transformedProducts;

    return NextResponse.json({
      success: true,
      data: finalProducts,
      source: 'sos_backup',
      total: finalProducts.length
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}


// POST endpoint for creating/updating inventory items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await sosSupabase
      .from('items')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory item:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error in POST /api/inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}