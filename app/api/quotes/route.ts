import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const status = searchParams.get('status');

    let query = supabase
      .from('quotes')
      .select(`
        *,
        quote_items(
          *,
          item:items(*)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data: quotes, error } = await query;

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quotes || []
    });

  } catch (error) {
    console.error('Error in GET /api/quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      customer_name,
      customer_email,
      title,
      description,
      items,
      notes,
      status = 'draft'
    } = body;

    // Create the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert([{
        customer_id,
        customer_name,
        customer_email,
        title,
        description,
        notes,
        status,
        subtotal: 0, // Will be calculated after items are added
        total: 0
      }])
      .select()
      .single();

    if (quoteError) {
      throw quoteError;
    }

    // Add quote items if provided
    if (items && items.length > 0) {
      const quoteItems = items.map((item: any) => ({
        quote_id: quote.id,
        item_id: item.item_id,
        quantity: item.quantity,
        cost_price: item.cost_price,
        cost_with_pad: item.cost_with_pad,
        markup_percentage: item.markup_percentage,
        selling_price: item.selling_price,
        previous_supplier: item.previous_supplier,
        previous_price: item.previous_price,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) {
        // Clean up the quote if items failed
        await supabase.from('quotes').delete().eq('id', quote.id);
        throw itemsError;
      }

      // Calculate totals
      const subtotal = items.reduce((sum: number, item: any) => 
        sum + (item.selling_price * item.quantity), 0
      );

      // Update quote with totals
      const { data: updatedQuote, error: updateError } = await supabase
        .from('quotes')
        .update({ subtotal, total: subtotal })
        .eq('id', quote.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        data: updatedQuote
      });
    }

    return NextResponse.json({
      success: true,
      data: quote
    });

  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}