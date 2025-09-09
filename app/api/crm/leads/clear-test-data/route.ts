import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Delete test/mock data from lead_intake
    const { error: deleteError } = await supabase
      .from('lead_intake')
      .delete()
      .or('source.eq.mock,source.eq.google_places_discovery,source.eq.yelp_discovery,source.eq.rar_signal,source.eq.restaurant_activity_report');

    if (deleteError) {
      console.error('Error deleting test data:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to clear test data',
        details: deleteError.message 
      }, { status: 500 });
    }

    // Get count of remaining leads
    const { count } = await supabase
      .from('lead_intake')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ 
      success: true,
      message: 'Test data cleared successfully',
      remaining_leads: count || 0
    });
  } catch (error) {
    console.error('Error clearing test data:', error);
    return NextResponse.json({ 
      error: 'Failed to clear test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Get current lead count
  const { count } = await supabase
    .from('lead_intake')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({ 
    total_leads: count || 0,
    message: 'Use POST to clear test data'
  });
}