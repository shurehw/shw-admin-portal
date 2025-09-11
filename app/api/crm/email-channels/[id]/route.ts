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
    
    const { data: channel, error } = await supabase
      .from('email_channels')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json(channel);
  } catch (error) {
    console.error('Error fetching channel:', error);
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
    if (body.syncEnabled !== undefined) updateData.sync_enabled = body.syncEnabled;
    if (body.autoCreateTickets !== undefined) updateData.auto_create_tickets = body.autoCreateTickets;
    if (body.autoLogActivities !== undefined) updateData.auto_log_activities = body.autoLogActivities;
    if (body.connectedTo !== undefined) updateData.connected_to = body.connectedTo;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('email_channels')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating channel:', error);
      return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/crm/email-channels/[id]:', error);
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
      .from('email_channels')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting channel:', error);
      return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/email-channels/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}