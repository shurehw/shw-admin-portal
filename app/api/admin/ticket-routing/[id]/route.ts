import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }
    
    const { data: route, error } = await supabase
      .from('ticket_routing_rules')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Routing rule not found' }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error('Error fetching routing rule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }
    
    const body = await request.json();
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Update specific fields if provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.enabled !== undefined) updateData.enabled = body.enabled;
    if (body.conditions !== undefined) updateData.conditions = body.conditions;
    if (body.actions !== undefined) updateData.actions = body.actions;
    if (body.priority !== undefined) updateData.priority = body.priority;

    const { data, error } = await supabase
      .from('ticket_routing_rules')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating routing rule:', error);
      return NextResponse.json({ error: 'Failed to update routing rule' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/admin/ticket-routing/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }
    
    const { error } = await supabase
      .from('ticket_routing_rules')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting routing rule:', error);
      return NextResponse.json({ error: 'Failed to delete routing rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/ticket-routing/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}