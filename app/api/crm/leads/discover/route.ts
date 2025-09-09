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
    console.log('Discovery request body:', body);
    const { source = 'mock', location = 'New York, NY', categories = ['restaurant', 'cafe', 'bakery', 'hotel'], preview = false } = body;
    
    // Check if this is a preview request
    const isPreview = preview || request.nextUrl.searchParams.get('preview') === 'true';
    
    const discoveredLeads = [];
    
    // Parse location to get city and state
    const [cityName, stateName] = location.split(',').map(s => s.trim());
    
    // Generate location-specific mock businesses
    const mockBusinesses = generateLocationSpecificBusinesses(cityName, stateName, categories);
    
    // Process each discovered business
    for (const business of mockBusinesses) {
      const signals = generateRARSignals();
      
      // Store signals in raw data instead of as a separate field
      const enrichedBusiness = {
        ...business,
        discovery_signals: signals
      };
      
      const leadData = {
        source: source,
        raw: enrichedBusiness,
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
    
    // If preview mode, return leads without saving
    if (isPreview) {
      console.log('Preview mode: returning', discoveredLeads.length, 'leads without saving');
      return NextResponse.json({
        success: true,
        discovered: discoveredLeads.length,
        leads: discoveredLeads,
        preview: true,
        message: `Found ${discoveredLeads.length} potential leads (preview mode)`
      });
    }
    
    // Insert discovered leads into database
    console.log('Attempting to insert', discoveredLeads.length, 'leads with source:', source);
    const { data, error } = await supabase
      .from('lead_intake')
      .insert(discoveredLeads)
      .select();
    
    if (error) {
      console.error('Error inserting leads:', error);
      return NextResponse.json({ 
        error: 'Failed to save leads',
        details: error.message,
        attempted: discoveredLeads.length 
      }, { status: 500 });
    }
    
    console.log('Successfully inserted', data?.length, 'leads');
    
    return NextResponse.json({
      success: true,
      discovered: data?.length || 0,
      leads: data,
      message: `Successfully discovered ${data?.length || 0} leads from ${source}`
    });
    
  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json({ error: 'Failed to discover leads' }, { status: 500 });
  }
}

// Generate location-specific businesses
function generateLocationSpecificBusinesses(city: string, state: string, categories: string[]) {
  const businessTemplates = {
    restaurant: [
      { prefix: "Bella Vista", type: "Restaurant", subCategory: "Fine Dining" },
      { prefix: "Sunset Terrace", type: "Dining", subCategory: "Casual Dining" },
      { prefix: "The Local", type: "Kitchen", subCategory: "Fast Casual" },
      { prefix: "Golden Gate", type: "Grill", subCategory: "American" },
      { prefix: "Blue Moon", type: "Bistro", subCategory: "French" }
    ],
    cafe: [
      { prefix: "Corner", type: "Café Express", subCategory: "Coffee Shop" },
      { prefix: "Morning Brew", type: "Coffee Co", subCategory: "Coffee Shop" },
      { prefix: "Daily Grind", type: "Espresso Bar", subCategory: "Espresso Bar" },
      { prefix: "Sunrise", type: "Coffee House", subCategory: "Coffee Shop" }
    ],
    bakery: [
      { prefix: "Artisan Flour", type: "Bakery", subCategory: "Artisan Bakery" },
      { prefix: "Fresh Daily", type: "Bakehouse", subCategory: "Commercial Bakery" },
      { prefix: "Sweet Dreams", type: "Patisserie", subCategory: "French Bakery" }
    ],
    hotel: [
      { prefix: "The Grand", type: "Hotel", subCategory: "Luxury" },
      { prefix: "Harbor View", type: "Inn", subCategory: "Boutique" },
      { prefix: "Plaza", type: "Suites", subCategory: "Business" },
      { prefix: "Comfort", type: "Lodge", subCategory: "Mid-scale" }
    ],
    catering: [
      { prefix: "Elite Corporate", type: "Catering", subCategory: "Corporate" },
      { prefix: "Event Masters", type: "Catering Co", subCategory: "Events" }
    ]
  };
  
  // Location-specific neighborhoods based on city
  const neighborhoods: Record<string, string[]> = {
    'Los Angeles': ['Beverly Hills', 'Santa Monica', 'Hollywood', 'Venice', 'Downtown LA', 'Pasadena', 'Culver City', 'West Hollywood'],
    'Chicago': ['The Loop', 'Lincoln Park', 'Wicker Park', 'River North', 'Gold Coast', 'Lakeview'],
    'Houston': ['Downtown', 'The Heights', 'Montrose', 'River Oaks', 'Midtown', 'Galleria'],
    'Phoenix': ['Downtown', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Glendale'],
    'Philadelphia': ['Center City', 'Old City', 'Rittenhouse', 'Fishtown', 'Manayunk'],
    'San Antonio': ['Downtown', 'Pearl District', 'Alamo Heights', 'Stone Oak', 'The Rim'],
    'San Diego': ['Gaslamp Quarter', 'La Jolla', 'Pacific Beach', 'North Park', 'Little Italy'],
    'Dallas': ['Downtown', 'Uptown', 'Deep Ellum', 'Bishop Arts', 'Knox-Henderson'],
    'Miami': ['South Beach', 'Brickell', 'Wynwood', 'Coral Gables', 'Coconut Grove'],
    'Atlanta': ['Midtown', 'Buckhead', 'Virginia-Highland', 'Decatur', 'West Midtown'],
    'Boston': ['Back Bay', 'Beacon Hill', 'North End', 'Seaport', 'Cambridge'],
    'Seattle': ['Capitol Hill', 'Fremont', 'Ballard', 'Queen Anne', 'Georgetown'],
    'Denver': ['LoDo', 'RiNo', 'Cherry Creek', 'Highland', 'Capitol Hill'],
    'Portland': ['Pearl District', 'Hawthorne', 'Alberta', 'Sellwood', 'Northwest']
  };
  
  const cityNeighborhoods = neighborhoods[city] || [city];
  const businesses = [];
  
  // Generate businesses for selected categories
  categories.forEach(category => {
    const templates = businessTemplates[category as keyof typeof businessTemplates] || [];
    const numBusinesses = Math.min(templates.length, Math.floor(Math.random() * 3) + 2);
    
    for (let i = 0; i < numBusinesses; i++) {
      const template = templates[i % templates.length];
      const neighborhood = cityNeighborhoods[Math.floor(Math.random() * cityNeighborhoods.length)];
      
      businesses.push({
        name: `${template.prefix} ${template.type}`,
        category: category,
        subCategory: template.subCategory,
        city: neighborhood === city ? city : neighborhood,
        state: state
      });
    }
  });
  
  return businesses;
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