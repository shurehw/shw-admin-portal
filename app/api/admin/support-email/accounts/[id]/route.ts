import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase if credentials are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Shared storage with the main accounts route
let connectedAccounts: any[] = [];

// Export the shared storage so main route can access it
export function getAccounts() {
  return connectedAccounts;
}

export function setAccounts(accounts: any[]) {
  connectedAccounts = accounts;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id;
    
    // Try to delete from Supabase first
    if (supabase) {
      // First try to find by email (for backwards compatibility)
      const { data: emailCheck } = await supabase
        .from('email_channels')
        .select('id')
        .eq('email', accountId)
        .single();
      
      const idToDelete = emailCheck?.id || accountId;
      
      const { error } = await supabase
        .from('email_channels')
        .delete()
        .or(`id.eq.${idToDelete},email.eq.${accountId}`);
      
      if (!error) {
        return NextResponse.json({ 
          success: true,
          message: 'Account disconnected successfully' 
        });
      }
      
      console.log('Supabase delete error:', error);
    }
    
    // Fallback to in-memory storage
    const initialLength = connectedAccounts.length;
    connectedAccounts = connectedAccounts.filter(a => 
      a.id !== accountId && a.email !== accountId
    );
    
    if (connectedAccounts.length === initialLength) {
      return NextResponse.json({ 
        error: 'Account not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Account disconnected successfully' 
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ 
      error: 'Failed to delete account' 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id;
    const body = await request.json();
    
    // Find and update the account
    const accountIndex = connectedAccounts.findIndex(a => a.id === accountId);
    
    if (accountIndex === -1) {
      return NextResponse.json({ 
        error: 'Account not found' 
      }, { status: 404 });
    }
    
    // Update the account with new properties
    connectedAccounts[accountIndex] = {
      ...connectedAccounts[accountIndex],
      ...body,
      lastModified: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      success: true,
      account: connectedAccounts[accountIndex]
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ 
      error: 'Failed to update account' 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle sync operation
  if (request.nextUrl.pathname.endsWith('/sync')) {
    try {
      const accountId = params.id;
      const account = connectedAccounts.find(a => a.id === accountId);
      
      if (!account) {
        return NextResponse.json({ 
          error: 'Account not found' 
        }, { status: 404 });
      }
      
      // Update last sync time
      account.lastSync = new Date().toISOString();
      
      // In a real implementation, this would trigger actual email sync
      return NextResponse.json({ 
        success: true,
        message: 'Sync initiated',
        lastSync: account.lastSync
      });
    } catch (error) {
      console.error('Error syncing account:', error);
      return NextResponse.json({ 
        error: 'Failed to sync account' 
      }, { status: 500 });
    }
  }
  
  return NextResponse.json({ 
    error: 'Invalid operation' 
  }, { status: 400 });
}