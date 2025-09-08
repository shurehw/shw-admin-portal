import { NextRequest, NextResponse } from 'next/server';
// RAR Scraper functionality temporarily disabled for performance
// import { RARScraper } from '@/lib/rar-scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, daysBack = 7, autoSync = false } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Mock response for demo - RAR scraper disabled for performance
    const mockVenues = Math.floor(Math.random() * 20) + 5; // Random 5-25 venues
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      venuesFound: mockVenues,
      message: `Successfully found ${mockVenues} new venues from RAR (demo mode)`
    });

  } catch (error) {
    console.error('RAR sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync with RAR. Please check your credentials and try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Mock status response for demo
    const status = {
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      totalVenues: 234,
      newVenuesThisWeek: 18,
      isRunning: false,
      autoSyncEnabled: false
    };
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}