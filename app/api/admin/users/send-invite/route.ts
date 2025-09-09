import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { invites } = await request.json();
    
    if (!invites || !Array.isArray(invites)) {
      return NextResponse.json({ error: 'Invalid invites data' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only admins can send invites' }, { status: 403 });
    }

    // Insert pending invites
    const inviteRecords = invites.map(invite => ({
      email: invite.email.toLowerCase(),
      role: invite.role,
      status: 'pending'
    }));

    const { data, error } = await supabase
      .from('pending_invites')
      .upsert(inviteRecords, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error creating invites:', error);
      return NextResponse.json({ error: 'Failed to create invites' }, { status: 500 });
    }

    // Note: In a production app, you would send actual email invites here
    // For now, we just save them to the database

    return NextResponse.json({ 
      success: true, 
      invites: data,
      message: `Successfully invited ${data?.length || 0} users` 
    });
  } catch (error) {
    console.error('Error in send-invite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}