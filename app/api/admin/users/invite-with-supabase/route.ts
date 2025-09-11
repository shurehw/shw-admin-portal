import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { invites } = await request.json();
    
    if (!invites || !Array.isArray(invites)) {
      return NextResponse.json({ error: 'Invalid invites data' }, { status: 400 });
    }

    const cookieStore = await cookies();
    
    // Create a server client for checking current user
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

    // Create admin client for sending invites - ensure we have the service key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.SUPABASE_SERVICE_KEY || 
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeWpqdmJxbXl5dWh6cG94bHNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc5NTMyOSwiZXhwIjoyMDcwMzcxMzI5fQ.IIRm2nN0YdT6uosrGk5pypgW50rOhHxqOiWO0aN4r_U';
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co',
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const results = [];
    const errors = [];

    // Send invites using Supabase Auth
    for (const invite of invites) {
      try {
        // First, add to pending_invites table for role tracking
        const { error: dbError } = await supabaseAdmin
          .from('pending_invites')
          .upsert({
            email: invite.email.toLowerCase(),
            role: invite.role,
            status: 'pending',
            invited_at: new Date().toISOString()
          }, { 
            onConflict: 'email',
            ignoreDuplicates: false 
          });

        if (dbError) {
          console.error(`Error adding invite to database for ${invite.email}:`, dbError);
        }

        // Send the actual invite through Supabase Auth
        console.log(`Attempting to invite ${invite.email} with role ${invite.role}`);
        
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          invite.email,
          {
            data: { 
              role: invite.role,
              invited_by: user.email
            },
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin-dashboard-1lzwhyzh5-shureprint.vercel.app'}/admin/login`
          }
        );

        if (error) {
          console.error(`Error inviting ${invite.email}:`, error);
          console.error('Full error details:', JSON.stringify(error, null, 2));
          errors.push({ email: invite.email, error: error.message || 'Unknown error' });
        } else {
          console.log(`Successfully invited ${invite.email}`, data);
          results.push({ email: invite.email, success: true, data });
        }
      } catch (error) {
        console.error(`Error processing invite for ${invite.email}:`, error);
        errors.push({ email: invite.email, error: 'Failed to send invite' });
      }
    }

    return NextResponse.json({ 
      success: errors.length === 0, 
      invited: results,
      errors: errors,
      message: `Successfully invited ${results.length} users${errors.length > 0 ? `, ${errors.length} failed` : ''}` 
    });
  } catch (error) {
    console.error('Error in Supabase invite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}