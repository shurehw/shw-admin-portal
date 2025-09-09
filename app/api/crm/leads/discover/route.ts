import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Google Places API integration (requires API key)
async function searchGooglePlaces(query: string, location: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=50000&type=restaurant|cafe|bakery|lodging&key=${apiKey}`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Google Places error:', error);
    return [];
  }
}

// Yelp API integration (requires API key)
async function searchYelp(location: string, categories: string) {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) return [];
  
  try {
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?location=${location}&categories=${categories}&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    const data = await response.json();
    return data.businesses || [];
  } catch (error) {
    console.error('Yelp error:', error);
    return [];
  }
}

// Restaurant & Retail (RAR) data simulation
function generateRARSignals() {
  const signals = [
    { type: 'permit', description: 'Building permit for kitchen renovation', confidence: 0.9 },
    { type: 'hiring', description: 'Hiring executive chef on Indeed', confidence: 0.85 },
    { type: 'ownership_change', description: 'New ownership filing with state', confidence: 0.95 },
    { type: 'pre_open', description: 'Pre-opening liquor license application', confidence: 0.92 },
    { type: 'review_velocity', description: '40% increase in Yelp reviews last 90 days', confidence: 0.8 }
  ];
  
  // Return 1-3 random signals
  const count = Math.floor(Math.random() * 3) + 1;
  return signals.sort(() => Math.random() - 0.5).slice(0, count);
}

// Calculate lead score based on signals and attributes
function calculateLeadScore(data: any) {
  let score = 50; // Base score
  
  // Segment scoring
  const segmentScores: Record<string, number> = {
    'restaurant': 10,
    'hotel': 15,
    'cafe': 8,
    'bakery': 7,
    'catering': 12
  };
  score += segmentScores[data.segment] || 5;
  
  // Location count bonus
  if (data.location_count > 1) score += Math.min(data.location_count * 3, 15);
  
  // Signal scoring
  if (data.signals) {
    const signalScores: Record<string, number> = {
      'pre_open': 12,
      'ownership_change': 9,
      'permit': 6,
      'hiring': 6,
      'review_velocity': 6
    };
    
    data.signals.forEach((signal: any) => {
      score += (signalScores[signal.type] || 3) * (signal.confidence || 0.8);
    });
  }
  
  // Price band adjustment
  const priceBandMultipliers: Record<string, number> = {
    '$$$': 1.2,
    '$$': 1.0,
    '$': 0.9
  };
  score *= priceBandMultipliers[data.price_band] || 1.0;
  
  return Math.min(Math.round(score), 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source = 'discovery', location = 'New York, NY', categories = ['restaurant', 'cafe', 'bakery', 'hotel'] } = body;
    
    const discoveredLeads = [];
    
    // Option 1: Use mock data for demonstration
    const mockBusinesses = [
      { name: "Bella Vista Restaurant", category: "restaurant", subCategory: "Fine Dining", city: "New York", state: "NY" },
      { name: "Corner Café Express", category: "cafe", subCategory: "Coffee Shop", city: "Brooklyn", state: "NY" },
      { name: "Artisan Flour Bakery", category: "bakery", subCategory: "Artisan Bakery", city: "Queens", state: "NY" },
      { name: "The Grand Manhattan Hotel", category: "hotel", subCategory: "Luxury", city: "Manhattan", state: "NY" },
      { name: "Sunset Terrace Dining", category: "restaurant", subCategory: "Casual Dining", city: "Long Island", state: "NY" },
      { name: "Morning Brew Coffee Co", category: "cafe", subCategory: "Coffee Shop", city: "Staten Island", state: "NY" },
      { name: "Fresh Daily Bakehouse", category: "bakery", subCategory: "Commercial Bakery", city: "Bronx", state: "NY" },
      { name: "Harbor View Inn", category: "hotel", subCategory: "Boutique", city: "Manhattan", state: "NY" },
      { name: "The Local Kitchen", category: "restaurant", subCategory: "Fast Casual", city: "Brooklyn", state: "NY" },
      { name: "Elite Corporate Catering", category: "catering", subCategory: "Corporate", city: "Manhattan", state: "NY" }
    ];
    
    // Process each discovered business
    for (const business of mockBusinesses) {
      const signals = generateRARSignals();
      
      const leadData = {
        source: source,
        raw: business,
        suggested_company: {
          name: business.name,
          segment: business.category,
          sub_segment: business.subCategory,
          location_count: Math.floor(Math.random() * 5) + 1,
          price_band: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)]
        },
        suggested_location: {
          city: business.city,
          state: business.state,
          formatted_address: `${Math.floor(Math.random() * 9999)} ${['Main', 'Broadway', 'Park', 'First', 'Second'][Math.floor(Math.random() * 5)]} ${['St', 'Ave', 'Blvd'][Math.floor(Math.random() * 3)]}, ${business.city}, ${business.state}`
        },
        suggested_contacts: [],
        signals: signals,
        score_preview: 0,
        winability_preview: Math.floor(Math.random() * 30) + 70,
        status: 'pending'
      };
      
      // Calculate score
      leadData.score_preview = calculateLeadScore({
        ...leadData.suggested_company,
        signals: signals
      });
      
      discoveredLeads.push(leadData);
    }
    
    // Option 2: Integrate with Google Places (if API key is configured)
    if (process.env.GOOGLE_PLACES_API_KEY) {
      const googleResults = await searchGooglePlaces('restaurants', location);
      // Process Google results...
    }
    
    // Option 3: Integrate with Yelp (if API key is configured)
    if (process.env.YELP_API_KEY) {
      const yelpResults = await searchYelp(location, categories.join(','));
      // Process Yelp results...
    }
    
    // Insert discovered leads into database
    const { data, error } = await supabase
      .from('lead_intake')
      .insert(discoveredLeads)
      .select();
    
    if (error) {
      console.error('Error inserting leads:', error);
      return NextResponse.json({ error: 'Failed to save leads' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      discovered: data?.length || 0,
      leads: data
    });
    
  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json({ error: 'Failed to discover leads' }, { status: 500 });
  }
}

// GET endpoint to trigger discovery
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location') || 'New York, NY';
  
  // Trigger discovery with default parameters
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ location }),
    headers: { 'Content-Type': 'application/json' }
  }));
}