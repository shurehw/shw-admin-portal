import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items(
          *,
          item:items(*)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Quote not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: quote
    });

  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      status
    } = body;

    // Update the quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .update({
        customer_id,
        customer_name,
        customer_email,
        title,
        description,
        notes,
        status
      })
      .eq('id', params.id)
      .select()
      .single();

    if (quoteError) {
      throw quoteError;
    }

    // Update quote items if provided
    if (items) {
      // Delete existing items
      await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', params.id);

      // Add new items
      if (items.length > 0) {
        const quoteItems = items.map((item: any) => ({
          quote_id: params.id,
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
          throw itemsError;
        }

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: any) => 
          sum + (item.selling_price * item.quantity), 0
        );

        // Update quote with totals
        await supabase
          .from('quotes')
          .update({ subtotal, total: subtotal })
          .eq('id', params.id);
      } else {
        // No items, set totals to 0
        await supabase
          .from('quotes')
          .update({ subtotal: 0, total: 0 })
          .eq('id', params.id);
      }
    }

    // Fetch updated quote with items
    const { data: updatedQuote, error: fetchError } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items(
          *,
          item:items(*)
        )
      `)
      .eq('id', params.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: updatedQuote
    });

  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quote' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete quote items first (foreign key constraint)
    await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', params.id);

    // Delete the quote
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}