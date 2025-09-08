import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id') || '00000000-0000-0000-0000-000000000000';

    const { data: macros, error } = await supabase
      .from('ticket_macros')
      .select('*')
      .eq('org_id', orgId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json(macros || []);
  } catch (error) {
    console.error('Error fetching macros:', error);
    return NextResponse.json({ error: 'Failed to fetch macros' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data: macro, error } = await supabase
      .from('ticket_macros')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(macro);
  } catch (error) {
    console.error('Error creating macro:', error);
    return NextResponse.json({ error: 'Failed to create macro' }, { status: 500 });
  }
}