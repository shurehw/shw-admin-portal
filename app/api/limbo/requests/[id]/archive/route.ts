import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value)
            })
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the request
    const { data: request, error: fetchError } = await supabase
      .from('limbo_requests')
      .select('creator_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.creator_id !== user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Archive the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('limbo_requests')
      .update({ 
        archived: true,
        archived_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error archiving request:', updateError);
      return NextResponse.json({ error: 'Failed to archive request' }, { status: 500 });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error in PUT /api/limbo/requests/[id]/archive:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}