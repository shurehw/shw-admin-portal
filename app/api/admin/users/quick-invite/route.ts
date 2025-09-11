import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, role = 'viewer' } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
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

    // First, add to pending_invites table for role tracking
    const { error: dbError } = await supabaseAdmin
      .from('pending_invites')
      .upsert({
        email: email.toLowerCase(),
        role: role,
        status: 'pending',
        invited_at: new Date().toISOString()
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      });

    if (dbError) {
      console.error(`Error adding invite to database for ${email}:`, dbError);
    }

    // Send the actual invite through Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { 
          role: role,
          invited_by: 'admin'
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin-dashboard-mixki9gk6-shureprint.vercel.app'}/admin/login`
      }
    );

    if (error) {
      console.error(`Error inviting ${email}:`, error);
      return NextResponse.json({ 
        error: `Failed to send invite: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Invite sent to ${email}`,
      data
    });

  } catch (error) {
    console.error('Error in quick invite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET method to check if an email has been invited
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

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

  // Check pending invites
  const { data: invite } = await supabaseAdmin
    .from('pending_invites')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  // Check if user exists in auth
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  const userExists = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

  return NextResponse.json({
    email,
    hasPendingInvite: !!invite,
    inviteDetails: invite,
    existsInAuth: !!userExists,
    authUser: userExists ? { id: userExists.id, email: userExists.email, created_at: userExists.created_at } : null
  });
}