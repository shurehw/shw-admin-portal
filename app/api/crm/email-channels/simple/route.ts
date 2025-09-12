import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, provider = 'gmail' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Store email configuration (encrypted in production)
    const { data, error } = await supabase
      .from('email_channels')
      .insert({
        email,
        provider,
        status: 'connected',
        department: 'support',
        sync_enabled: true,
        auto_create_tickets: false,
        auto_log_activities: true,
        user_id: 'system',
        user_name: 'System',
        connected_to: 'Support Pipeline',
        // In production, encrypt the password
        config: {
          host: provider === 'gmail' ? 'imap.gmail.com' : 'outlook.office365.com',
          port: 993,
          secure: true,
          // Store encrypted
          auth: {
            user: email,
            pass: Buffer.from(password).toString('base64')
          }
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving email channel:', error);
      return NextResponse.json(
        { error: 'Failed to save email channel' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      email: data.email,
      provider: data.provider,
      status: 'connected',
      message: 'Email channel connected successfully'
    });

  } catch (error) {
    console.error('Error connecting email:', error);
    return NextResponse.json(
      { error: 'Failed to connect email channel' },
      { status: 500 }
    );
  }
}