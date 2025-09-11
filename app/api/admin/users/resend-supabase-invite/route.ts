import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
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

    const isAuthorized = profile && ['admin', 'sales_manager', 'cs_manager', 'production_manager'].includes(profile.role);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Only admins and managers can resend invites' }, { status: 403 });
    }

    // Get the invite details from pending_invites
    const { data: invite, error: fetchError } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Create admin client for sending invites
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeWpqdmJxbXl5dWh6cG94bHNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc5NTMyOSwiZXhwIjoyMDcwMzcxMzI5fQ.IIRm2nN0YdT6uosrGk5pypgW50rOhHxqOiWO0aN4r_U',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update the invite's timestamp
    await supabase
      .from('pending_invites')
      .update({ 
        invited_at: new Date().toISOString(),
        status: 'pending'
      })
      .eq('email', email.toLowerCase());

    // Resend the invite through Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { 
          role: invite.role,
          invited_by: user.email,
          resent: true
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin-dashboard-1lzwhyzh5-shureprint.vercel.app'}/admin/login`
      }
    );

    if (error) {
      console.error(`Error resending invite to ${email}:`, error);
      return NextResponse.json({ 
        error: `Failed to resend invite: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    console.log(`Invitation resent to ${email} via Supabase Auth`);
    
    return NextResponse.json({ 
      success: true,
      message: `Invite resent to ${email}`,
      emailSent: true,
      data
    });

  } catch (error) {
    console.error('Error in resend Supabase invite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}