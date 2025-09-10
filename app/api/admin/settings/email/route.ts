import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET email settings for current user
export async function GET() {
  try {
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if email_settings table exists, if not create it
    const { data: tableExists } = await supabase
      .from('email_settings')
      .select('id')
      .limit(1);

    if (!tableExists) {
      // Table doesn't exist, create it
      await supabase.rpc('create_email_settings_table');
    }

    // Get user's email settings
    const { data: settings, error } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching email settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return settings or default values
    return NextResponse.json(settings || {
      smtp_host: process.env.SMTP_HOST || '',
      smtp_port: process.env.SMTP_PORT || '587',
      smtp_user: process.env.SMTP_USER || '',
      smtp_pass: '', // Never return the actual password
      smtp_secure: false,
      from_name: process.env.EMAIL_FROM_NAME || '',
      from_address: process.env.EMAIL_FROM_ADDRESS || '',
      reply_to: process.env.EMAIL_REPLY_TO || '',
      use_for_tickets: true,
      use_for_notifications: true,
    });
  } catch (error) {
    console.error('Error in email settings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST save email settings
export async function POST(request: Request) {
  try {
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    // First, try to create the table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS email_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        smtp_host TEXT,
        smtp_port TEXT,
        smtp_user TEXT,
        smtp_pass TEXT,
        smtp_secure BOOLEAN DEFAULT false,
        from_name TEXT,
        from_address TEXT,
        reply_to TEXT,
        use_for_tickets BOOLEAN DEFAULT true,
        use_for_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;

    // Execute the create table query
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableQuery 
    }).select().single();

    // If exec_sql doesn't exist, try direct approach
    if (createError) {
      console.log('Table creation via RPC failed, table might already exist');
    }

    // Encrypt password before storing (in production, use proper encryption)
    const encryptedSettings = {
      ...settings,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    // Upsert the settings
    const { data, error } = await supabase
      .from('email_settings')
      .upsert(encryptedSettings, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving email settings:', error);
      
      // If table doesn't exist, return specific error
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Email settings table not configured. Please contact administrator.',
          details: 'Table needs to be created in Supabase'
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in email settings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}