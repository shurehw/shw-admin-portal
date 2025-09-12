import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase if credentials are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// In-memory storage as fallback
let connectedAccounts: any[] = [];

export async function GET() {
  try {
    // Try to get from Supabase first
    if (supabase) {
      const { data, error } = await supabase
        .from('email_channels')
        .select('*')
        .eq('department', 'support')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        // Transform data to match our interface
        const accounts = data.map(channel => ({
          id: channel.id,
          email: channel.email,
          department: channel.department,
          status: channel.status || 'connected',
          lastSync: channel.last_sync,
          autoCreateTickets: channel.auto_create_tickets !== false,
        }));
        
        return NextResponse.json({ 
          accounts,
          success: true 
        });
      }
    }
    
    // Fallback to in-memory storage
    return NextResponse.json({ 
      accounts: connectedAccounts,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ 
      accounts: [],
      error: 'Failed to fetch accounts' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const account = {
      id: body.id || `account_${Date.now()}`,
      email: body.email,
      department: body.department || 'support',
      status: 'connected',
      lastSync: new Date().toISOString(),
      autoCreateTickets: body.autoCreateTickets !== false,
      ...body
    };
    
    // Try to save to Supabase first
    if (supabase) {
      const { data, error } = await supabase
        .from('email_channels')
        .upsert({
          email: account.email,
          department: account.department,
          status: account.status,
          auto_create_tickets: account.autoCreateTickets,
          last_sync: account.lastSync,
        }, {
          onConflict: 'email'
        })
        .select()
        .single();
      
      if (!error && data) {
        return NextResponse.json({ 
          success: true,
          account: {
            ...account,
            id: data.id
          }
        });
      }
    }
    
    // Fallback to in-memory storage
    const existingIndex = connectedAccounts.findIndex(a => a.email === body.email);
    
    if (existingIndex >= 0) {
      connectedAccounts[existingIndex] = account;
    } else {
      connectedAccounts.push(account);
    }
    
    return NextResponse.json({ 
      success: true,
      account 
    });
  } catch (error) {
    console.error('Error saving account:', error);
    return NextResponse.json({ 
      error: 'Failed to save account' 
    }, { status: 500 });
  }
}