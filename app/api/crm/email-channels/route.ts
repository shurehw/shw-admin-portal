import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json([]);
    }
    
    // Fetch all email channels
    const { data: channels, error } = await supabase
      .from('email_channels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email channels:', error);
      // Return empty array if table doesn't exist yet
      return NextResponse.json([]);
    }

    return NextResponse.json(channels || []);
  } catch (error) {
    console.error('Error in GET /api/crm/email-channels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }
    
    const body = await request.json();
    
    // Create new email channel
    const { data, error } = await supabase
      .from('email_channels')
      .insert([{
        email: body.email,
        provider: body.provider,
        status: 'pending',
        department: body.department,
        sync_enabled: body.syncEnabled || true,
        auto_create_tickets: body.autoCreateTickets || false,
        auto_log_activities: body.autoLogActivities || true,
        user_id: body.userId,
        user_name: body.userName,
        connected_to: body.connectedTo || 'Support Pipeline',
        oauth_tokens: body.oauthTokens || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating email channel:', error);
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        await createEmailChannelsTable();
        // Retry the insert
        const { data: retryData, error: retryError } = await supabase
          .from('email_channels')
          .insert([{
            email: body.email,
            provider: body.provider,
            status: 'pending',
            department: body.department,
            sync_enabled: body.syncEnabled || true,
            auto_create_tickets: body.autoCreateTickets || false,
            auto_log_activities: body.autoLogActivities || true,
            user_id: body.userId,
            user_name: body.userName,
            connected_to: body.connectedTo || 'Support Pipeline',
            oauth_tokens: body.oauthTokens || null,
          }])
          .select()
          .single();
        
        if (retryError) {
          return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
        }
        return NextResponse.json(retryData);
      }
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/crm/email-channels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createEmailChannelsTable() {
  const { error } = await supabase.rpc('create_email_channels_table', {
    table_sql: `
      CREATE TABLE IF NOT EXISTS email_channels (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'disconnected',
        connected_to VARCHAR(255),
        department VARCHAR(50),
        last_sync TIMESTAMP,
        sync_enabled BOOLEAN DEFAULT true,
        auto_create_tickets BOOLEAN DEFAULT false,
        auto_log_activities BOOLEAN DEFAULT true,
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        oauth_tokens JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_email_channels_email ON email_channels(email);
      CREATE INDEX IF NOT EXISTS idx_email_channels_status ON email_channels(status);
    `
  }).catch(async (err) => {
    // If RPC doesn't exist, try direct SQL (for development)
    console.log('Creating email_channels table via direct SQL...');
    const { error: createError } = await supabase
      .from('email_channels')
      .select('id')
      .limit(1);
    
    if (createError?.code === '42P01') {
      console.log('Table will be created manually in Supabase dashboard');
    }
  });
  
  if (error) {
    console.error('Error creating email_channels table:', error);
  }
}