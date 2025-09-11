import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Test the Supabase Admin client
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.SUPABASE_SERVICE_KEY || 
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeWpqdmJxbXl5dWh6cG94bHNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc5NTMyOSwiZXhwIjoyMDcwMzcxMzI5fQ.IIRm2nN0YdT6uosrGk5pypgW50rOhHxqOiWO0aN4r_U';
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co';
    
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Service key present:', serviceKey ? 'Yes' : 'No');
    console.log('Service key length:', serviceKey?.length);
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test listing users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json({ 
        error: 'Failed to list users',
        details: listError,
        supabaseUrl,
        serviceKeyPresent: !!serviceKey
      }, { status: 500 });
    }

    // Test sending an invite to a test email
    const testEmail = 'test-invite-' + Date.now() + '@shurehw.com';
    console.log('Attempting to send test invite to:', testEmail);
    
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      testEmail,
      {
        data: { 
          role: 'viewer',
          test: true
        },
        redirectTo: `https://admin-dashboard-1lzwhyzh5-shureprint.vercel.app/admin/login`
      }
    );

    if (inviteError) {
      console.error('Error sending test invite:', inviteError);
      return NextResponse.json({ 
        error: 'Failed to send test invite',
        details: inviteError,
        userCount: users?.length || 0,
        supabaseUrl,
        serviceKeyPresent: !!serviceKey
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Supabase Auth is working',
      userCount: users?.length || 0,
      testInviteSent: testEmail,
      inviteData,
      supabaseUrl,
      serviceKeyPresent: !!serviceKey
    });

  } catch (error: any) {
    console.error('Test invite error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || error,
      stack: error.stack
    }, { status: 500 });
  }
}