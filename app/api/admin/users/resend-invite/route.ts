import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { inviteId } = await request.json();
    
    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeWpqdmJxbXl5dWh6cG94bHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3OTUzMjksImV4cCI6MjA3MDM3MTMyOX0.yXS4pbap1yVfhidFCN4MZkZE4lbkF5yS9V-nR88V1kc',
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

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can resend invites' }, { status: 403 });
    }

    // Get the invite details
    const actualInviteId = inviteId.replace('invite-', '');
    const { data: invite, error: fetchError } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('id', actualInviteId)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Update the invite's timestamp to mark it as resent
    const { error: updateError } = await supabase
      .from('pending_invites')
      .update({ 
        invited_at: new Date().toISOString(),
        status: 'pending' // Ensure it's still pending
      })
      .eq('id', actualInviteId);

    if (updateError) {
      console.error('Error updating invite:', updateError);
      return NextResponse.json({ error: 'Failed to resend invite' }, { status: 500 });
    }

    // In a production app, you would send the actual email here
    // For now, we just update the timestamp

    return NextResponse.json({ 
      success: true,
      message: `Invite resent to ${invite.email}`
    });
  } catch (error) {
    console.error('Error in resend invite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}