import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuration for automated discovery
const DISCOVERY_CONFIG = {
  // Target locations to search
  locations: [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'Miami, FL'
  ],
  
  // Business categories to target
  categories: ['restaurant', 'cafe', 'bakery', 'hotel', 'catering'],
  
  // Data sources to use (based on available API keys)
  sources: {
    apollo: process.env.APOLLO_API_KEY ? true : false,
    yelp: process.env.YELP_API_KEY ? true : false,
    google: process.env.GOOGLE_PLACES_API_KEY ? true : false,
    clearbit: process.env.CLEARBIT_API_KEY ? true : false,
    hunter: process.env.HUNTER_API_KEY ? true : false
  },
  
  // Discovery rules
  rules: {
    minScore: 60,           // Minimum score to add to intake
    maxPerLocation: 20,     // Max leads per location per run
    deduplicationWindow: 7, // Days to check for duplicates
    prioritySignals: [
      'pre_opening',
      'new_ownership',
      'renovation',
      'expansion',
      'recent_funding'
    ]
  }
};

// Main automated discovery function
async function runAutomatedDiscovery() {
  const results = {
    totalDiscovered: 0,
    byLocation: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    errors: [] as string[]
  };
  
  // Rotate through locations
  const locationIndex = new Date().getDay() % DISCOVERY_CONFIG.locations.length;
  const targetLocation = DISCOVERY_CONFIG.locations[locationIndex];
  
  console.log(`Running automated discovery for: ${targetLocation}`);
  
  try {
    // Call multi-source discovery
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/leads/multi-source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: targetLocation,
        categories: DISCOVERY_CONFIG.categories,
        sources: Object.keys(DISCOVERY_CONFIG.sources).filter(s => DISCOVERY_CONFIG.sources[s as keyof typeof DISCOVERY_CONFIG.sources]),
        limit: DISCOVERY_CONFIG.rules.maxPerLocation
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      results.totalDiscovered += data.discovered || 0;
      results.byLocation[targetLocation] = data.discovered || 0;
      
      // Track by source
      if (data.stats) {
        Object.entries(data.stats).forEach(([source, count]) => {
          results.bySource[source] = (results.bySource[source] || 0) + (count as number);
        });
      }
    }
    
    // Also run AI discovery for intelligent pattern matching
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/leads/ai-discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: targetLocation,
        categories: DISCOVERY_CONFIG.categories,
        useAI: true,
        count: 10
      })
    });
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      results.totalDiscovered += aiData.discovered || 0;
      results.bySource['ai'] = (results.bySource['ai'] || 0) + (aiData.discovered || 0);
    }
    
  } catch (error) {
    console.error('Discovery error:', error);
    results.errors.push(`Failed for ${targetLocation}: ${error}`);
  }
  
  // Log discovery run
  await supabase.from('discovery_runs').insert({
    run_date: new Date().toISOString(),
    location: targetLocation,
    discovered_count: results.totalDiscovered,
    sources_used: Object.keys(DISCOVERY_CONFIG.sources).filter(s => DISCOVERY_CONFIG.sources[s as keyof typeof DISCOVERY_CONFIG.sources]),
    status: results.errors.length > 0 ? 'partial' : 'success',
    metadata: results
  });
  
  return results;
}

// Cron job endpoint (can be called by Vercel Cron, GitHub Actions, or external schedulers)
export async function GET(request: NextRequest) {
  try {
    // Check for API key or cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const results = await runAutomatedDiscovery();
    
    return NextResponse.json({
      success: true,
      message: 'Automated discovery completed',
      results: results,
      nextRun: getNextRunTime()
    });
    
  } catch (error) {
    console.error('Auto-discovery error:', error);
    return NextResponse.json({ 
      error: 'Failed to run automated discovery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Manual trigger endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { immediate = false, location, categories } = body;
    
    if (immediate) {
      // Override config for immediate run
      if (location) DISCOVERY_CONFIG.locations = [location];
      if (categories) DISCOVERY_CONFIG.categories = categories;
    }
    
    const results = await runAutomatedDiscovery();
    
    // Schedule next runs if not immediate
    if (!immediate) {
      await scheduleNextRuns();
    }
    
    return NextResponse.json({
      success: true,
      message: immediate ? 'Immediate discovery completed' : 'Discovery scheduled',
      results: results
    });
    
  } catch (error) {
    console.error('Discovery scheduling error:', error);
    return NextResponse.json({ 
      error: 'Failed to schedule discovery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to schedule next discovery runs
async function scheduleNextRuns() {
  // This would integrate with your preferred scheduler:
  // - Vercel Cron
  // - Supabase Edge Functions
  // - AWS Lambda
  // - Google Cloud Scheduler
  
  const schedule = {
    daily: '0 9 * * *',    // 9 AM daily
    weekly: '0 9 * * 1',   // Monday 9 AM
    monthly: '0 9 1 * *'   // 1st of month 9 AM
  };
  
  // Store schedule in database
  await supabase.from('discovery_schedules').upsert({
    id: 'primary',
    schedule: schedule,
    enabled: true,
    last_run: new Date().toISOString(),
    next_run: getNextRunTime()
  });
  
  return schedule;
}

function getNextRunTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow.toISOString();
}

// Webhook endpoint for external triggers (Zapier, Make, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate webhook payload
    if (!body.trigger || !body.source) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }
    
    // Handle different trigger types
    switch (body.trigger) {
      case 'new_territory':
        // Discover leads in new territory
        return POST(new NextRequest(request.url, {
          method: 'POST',
          body: JSON.stringify({
            immediate: true,
            location: body.location,
            categories: body.categories || DISCOVERY_CONFIG.categories
          }),
          headers: { 'Content-Type': 'application/json' }
        }));
        
      case 'competitor_alert':
        // Focus discovery on competitor's customers
        // Would need additional logic to identify competitor locations
        break;
        
      case 'event_based':
        // Trigger discovery based on events (trade shows, conferences, etc.)
        break;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
      trigger: body.trigger
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}