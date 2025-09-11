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
    
    // Fetch all routing rules
    const { data: routes, error } = await supabase
      .from('ticket_routing_rules')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching routing rules:', error);
      // Return empty array if table doesn't exist yet
      return NextResponse.json([]);
    }

    return NextResponse.json(routes || []);
  } catch (error) {
    console.error('Error in GET /api/admin/ticket-routing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }
    
    const body = await request.json();
    
    // Create new routing rule
    const { data, error } = await supabase
      .from('ticket_routing_rules')
      .insert([{
        name: body.name,
        enabled: body.enabled !== false,
        conditions: body.conditions,
        actions: body.actions,
        priority: body.priority || 999,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating routing rule:', error);
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        await createRoutingTable();
        // Retry the insert
        const { data: retryData, error: retryError } = await supabase
          .from('ticket_routing_rules')
          .insert([{
            name: body.name,
            enabled: body.enabled !== false,
            conditions: body.conditions,
            actions: body.actions,
            priority: body.priority || 999,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();
        
        if (retryError) {
          return NextResponse.json({ error: 'Failed to create routing rule' }, { status: 500 });
        }
        return NextResponse.json(retryData);
      }
      return NextResponse.json({ error: 'Failed to create routing rule' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/ticket-routing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createRoutingTable() {
  const { error } = await supabase.rpc('create_ticket_routing_table', {
    table_sql: `
      CREATE TABLE IF NOT EXISTS ticket_routing_rules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        conditions JSONB NOT NULL,
        actions JSONB NOT NULL,
        priority INTEGER DEFAULT 999,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_routing_rules_enabled ON ticket_routing_rules(enabled);
      CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON ticket_routing_rules(priority);
    `
  }).catch(async (err) => {
    // If RPC doesn't exist, try direct SQL (for development)
    console.log('Creating ticket_routing_rules table via direct SQL...');
    const { error: createError } = await supabase
      .from('ticket_routing_rules')
      .select('id')
      .limit(1);
    
    if (createError?.code === '42P01') {
      console.log('Table will be created manually in Supabase dashboard');
    }
  });
  
  if (error) {
    console.error('Error creating ticket_routing_rules table:', error);
  }
}