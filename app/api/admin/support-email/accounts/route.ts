import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for now (in production, use a database)
let connectedAccounts: any[] = [];

export async function GET() {
  try {
    // Return connected accounts
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
    
    // Add or update account
    const existingIndex = connectedAccounts.findIndex(a => a.email === body.email);
    
    const account = {
      id: body.id || `account_${Date.now()}`,
      email: body.email,
      department: body.department || 'support',
      status: 'connected',
      lastSync: new Date().toISOString(),
      autoCreateTickets: body.autoCreateTickets !== false,
      ...body
    };
    
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