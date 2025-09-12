import { NextRequest, NextResponse } from 'next/server';

// Simple alerts endpoint - returns empty for now
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Return empty alerts array for now
    return NextResponse.json({
      success: true,
      data: [],
      status: status || 'all'
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts', data: [] },
      { status: 200 } // Return 200 to avoid breaking the UI
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Mock alert creation
    return NextResponse.json({
      success: true,
      new_alerts: 0,
      message: 'Alert check completed'
    });
  } catch (error) {
    console.error('Error creating alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create alerts' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    return NextResponse.json({
      success: true,
      message: 'Alert acknowledged',
      id
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}