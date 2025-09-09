import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Southern California Focus Areas
const SOCAL_LOCATIONS = {
  // Los Angeles County
  losAngeles: [
    'Los Angeles, CA',
    'Beverly Hills, CA',
    'Santa Monica, CA',
    'West Hollywood, CA',
    'Culver City, CA',
    'Manhattan Beach, CA',
    'Hermosa Beach, CA',
    'Redondo Beach, CA',
    'Marina del Rey, CA',
    'Venice, CA',
    'Brentwood, CA',
    'Century City, CA',
    'Downtown LA, CA',
    'Hollywood, CA',
    'Silver Lake, CA',
    'Los Feliz, CA',
    'Pasadena, CA',
    'Glendale, CA',
    'Burbank, CA',
    'Studio City, CA',
    'Sherman Oaks, CA',
    'Encino, CA',
    'Woodland Hills, CA',
    'Calabasas, CA',
    'Malibu, CA',
    'Long Beach, CA',
    'Torrance, CA',
    'El Segundo, CA'
  ],
  
  // Orange County
  orangeCounty: [
    'Newport Beach, CA',
    'Irvine, CA',
    'Costa Mesa, CA',
    'Huntington Beach, CA',
    'Laguna Beach, CA',
    'Dana Point, CA',
    'San Clemente, CA',
    'Anaheim, CA',
    'Orange, CA',
    'Santa Ana, CA',
    'Fullerton, CA',
    'Tustin, CA',
    'Mission Viejo, CA',
    'Lake Forest, CA',
    'Laguna Niguel, CA',
    'Aliso Viejo, CA',
    'Rancho Santa Margarita, CA',
    'Yorba Linda, CA',
    'Brea, CA',
    'La Habra, CA',
    'Seal Beach, CA',
    'Garden Grove, CA',
    'Westminster, CA',
    'Fountain Valley, CA'
  ],
  
  // Surrounding Areas
  surrounding: [
    'Ventura, CA',
    'Oxnard, CA',
    'Thousand Oaks, CA',
    'Camarillo, CA',
    'Simi Valley, CA',
    'San Fernando Valley, CA',
    'Riverside, CA',
    'Corona, CA',
    'Temecula, CA',
    'Murrieta, CA',
    'San Bernardino, CA',
    'Rancho Cucamonga, CA',
    'Ontario, CA',
    'Pomona, CA',
    'Claremont, CA'
  ]
};

// High-value restaurant concepts popular in SoCal
const SOCAL_CONCEPTS = {
  trending: [
    'Plant-based/Vegan',
    'Farm-to-Table',
    'Craft Cocktail Bar',
    'Rooftop Dining',
    'Beach Club',
    'Wine Bar',
    'Omakase/Sushi Bar',
    'Mediterranean',
    'Modern Mexican',
    'Korean BBQ',
    'Ramen Bar',
    'Açaí Bowl/Smoothie',
    'Specialty Coffee',
    'Artisan Bakery',
    'Ghost Kitchen'
  ],
  
  highValue: [
    'Steakhouse',
    'Seafood',
    'Italian Fine Dining',
    'French Bistro',
    'Japanese',
    'Upscale Mexican',
    'Contemporary American',
    'Boutique Hotel Restaurant'
  ]
};

// Discover leads in Southern California
async function discoverSoCalLeads(params: any) {
  const { area = 'all', category = 'all', source = 'multi' } = params;
  
  // Select locations based on area
  let targetLocations: string[] = [];
  if (area === 'la' || area === 'all') {
    targetLocations.push(...SOCAL_LOCATIONS.losAngeles);
  }
  if (area === 'oc' || area === 'all') {
    targetLocations.push(...SOCAL_LOCATIONS.orangeCounty);
  }
  if (area === 'surrounding' || area === 'all') {
    targetLocations.push(...SOCAL_LOCATIONS.surrounding);
  }
  
  // Shuffle and select subset for this run
  targetLocations = targetLocations
    .sort(() => Math.random() - 0.5)
    .slice(0, 5); // Process 5 locations per run
  
  const discoveredLeads = [];
  
  for (const location of targetLocations) {
    // Call appropriate discovery APIs
    if (source === 'rar' || source === 'multi') {
      const rarLeads = await fetchRARData(location);
      discoveredLeads.push(...rarLeads);
    }
    
    if (source === 'apollo' || source === 'multi') {
      const apolloLeads = await fetchApolloData(location, category);
      discoveredLeads.push(...apolloLeads);
    }
    
    if (source === 'yelp' || source === 'multi') {
      const yelpLeads = await fetchYelpData(location, category);
      discoveredLeads.push(...yelpLeads);
    }
    
    // Generate SoCal-specific synthetic leads
    const syntheticLeads = generateSoCalLeads(location, category);
    discoveredLeads.push(...syntheticLeads);
  }
  
  return discoveredLeads;
}

// Fetch RAR data for SoCal
async function fetchRARData(location: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/leads/rar-integration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.leads || [];
    }
  } catch (error) {
    console.error('RAR fetch error:', error);
  }
  return [];
}

// Fetch Apollo data for SoCal
async function fetchApolloData(location: string, category: string) {
  if (!process.env.APOLLO_API_KEY) return [];
  
  try {
    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.APOLLO_API_KEY
      },
      body: JSON.stringify({
        api_key: process.env.APOLLO_API_KEY,
        q_organization_locations: [location],
        q_organization_industry_tag_ids: ['restaurants', 'hospitality', 'food_and_beverages'],
        person_titles: ['owner', 'general manager', 'executive chef', 'purchasing manager'],
        per_page: 10
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.people || [];
    }
  } catch (error) {
    console.error('Apollo fetch error:', error);
  }
  return [];
}

// Fetch Yelp data for SoCal
async function fetchYelpData(location: string, category: string) {
  if (!process.env.YELP_API_KEY) return [];
  
  try {
    const categories = category === 'all' ? 
      'restaurants,cafes,bakeries,bars,newamerican,seafood,steakhouses' :
      category;
    
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?location=${encodeURIComponent(location)}&categories=${categories}&limit=20&sort_by=review_count`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.YELP_API_KEY}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.businesses || [];
    }
  } catch (error) {
    console.error('Yelp fetch error:', error);
  }
  return [];
}

// Generate synthetic SoCal-specific leads
function generateSoCalLeads(location: string, category: string) {
  const leads = [];
  const concepts = [...SOCAL_CONCEPTS.trending, ...SOCAL_CONCEPTS.highValue];
  
  // Location-specific patterns
  const locationPatterns: Record<string, any> = {
    'Beverly Hills': { pricePoint: '$$$', concepts: ['Steakhouse', 'Italian Fine Dining', 'Rooftop'] },
    'Newport Beach': { pricePoint: '$$$', concepts: ['Seafood', 'Beach Club', 'Wine Bar'] },
    'Santa Monica': { pricePoint: '$$', concepts: ['Plant-based', 'Beach Cafe', 'Farm-to-Table'] },
    'Downtown LA': { pricePoint: '$$', concepts: ['Rooftop', 'Craft Cocktail', 'Ghost Kitchen'] },
    'Huntington Beach': { pricePoint: '$$', concepts: ['Beach Club', 'Seafood', 'Sports Bar'] },
    'Pasadena': { pricePoint: '$$', concepts: ['Wine Bar', 'Mediterranean', 'Brunch Spot'] },
    'Irvine': { pricePoint: '$$', concepts: ['Korean BBQ', 'Ramen', 'Corporate Catering'] },
    'Manhattan Beach': { pricePoint: '$$$', concepts: ['Seafood', 'Contemporary American', 'Wine Bar'] }
  };
  
  // Extract city name for pattern matching
  const cityName = location.split(',')[0].trim();
  const pattern = Object.keys(locationPatterns).find(key => cityName.includes(key));
  const locationProfile = pattern ? locationPatterns[pattern] : { pricePoint: '$$', concepts: concepts };
  
  // Generate 3-5 leads per location
  const numLeads = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < numLeads; i++) {
    const concept = locationProfile.concepts[Math.floor(Math.random() * locationProfile.concepts.length)];
    const businessName = generateBusinessName(concept, cityName);
    
    const lead = {
      source: 'socal_discovery',
      name: businessName,
      segment: categorizeSegment(concept),
      location: location,
      concept: concept,
      pricePoint: locationProfile.pricePoint,
      signals: generateSoCalSignals(concept, cityName),
      score: calculateSoCalScore(concept, locationProfile.pricePoint, location)
    };
    
    leads.push(lead);
  }
  
  return leads;
}

// Generate realistic business names for SoCal
function generateBusinessName(concept: string, city: string) {
  const prefixes = ['The', 'La', 'El', 'Casa', 'Coastal', 'Pacific', 'Golden', 'Sunset', 'Ocean'];
  const suffixes = ['Kitchen', 'Table', 'House', 'Club', 'Lounge', 'Bistro', 'Collective', 'Social'];
  
  const conceptNames: Record<string, string[]> = {
    'Steakhouse': ['Prime Cut', 'Char House', 'The Grill', 'Wagyu House'],
    'Seafood': ['Catch', 'The Dock', 'Ocean Prime', 'Fish Market'],
    'Plant-based': ['Verdant', 'Plant Power', 'Green Table', 'Harvest'],
    'Beach Club': ['Shore Club', 'Sunset Beach', 'The Deck', 'Coastline'],
    'Wine Bar': ['Vine', 'The Cellar', 'Grape & Glass', 'Uncorked'],
    'Korean BBQ': ['Seoul Kitchen', 'K-Town BBQ', 'Gogi House', 'Ban Chan'],
    'Ramen': ['Noodle Bar', 'Ramen Ya', 'Tonkotsu House', 'Slurp Shop'],
    'Coffee': ['Brew Lab', 'Bean There', 'Daily Grind', 'Roasters']
  };
  
  const names = conceptNames[concept] || suffixes;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  
  // Add location identifier sometimes
  if (Math.random() > 0.5) {
    const locationIdentifiers = [city, 'SoCal', 'Coast', 'Beach', 'Pacific'];
    const identifier = locationIdentifiers[Math.floor(Math.random() * locationIdentifiers.length)];
    return `${identifier} ${name}`;
  }
  
  return Math.random() > 0.5 ? `${prefix} ${name}` : name;
}

// Generate SoCal-specific signals
function generateSoCalSignals(concept: string, city: string) {
  const signals = [];
  
  const signalTemplates = [
    'New {concept} concept opening {timeframe}',
    'Taking over former {previous} location',
    '{celebrity} chef opening new venture',
    'Expansion from {otherCity} location',
    'Liquor license approved for {address}',
    'Building permit filed for {size} sq ft space',
    'Hiring {position} - posted on Indeed',
    'Featured in {publication} as upcoming opening'
  ];
  
  const template = signalTemplates[Math.floor(Math.random() * signalTemplates.length)];
  
  const signal = template
    .replace('{concept}', concept)
    .replace('{timeframe}', ['Q1 2025', 'Spring 2025', 'March 2025'][Math.floor(Math.random() * 3)])
    .replace('{previous}', ['Starbucks', 'CPK', 'Cheesecake Factory'][Math.floor(Math.random() * 3)])
    .replace('{celebrity}', ['Celebrity', 'Michelin-starred', 'James Beard nominated'][Math.floor(Math.random() * 3)])
    .replace('{otherCity}', ['Las Vegas', 'San Francisco', 'San Diego'][Math.floor(Math.random() * 3)])
    .replace('{address}', `${Math.floor(Math.random() * 9999)} Main St`)
    .replace('{size}', String(Math.floor(Math.random() * 5000) + 2000))
    .replace('{position}', ['Executive Chef', 'GM', 'Sommelier'][Math.floor(Math.random() * 3)])
    .replace('{publication}', ['Eater LA', 'LA Times', 'OC Register'][Math.floor(Math.random() * 3)]);
  
  signals.push(signal);
  
  // Add area-specific signals
  if (city.includes('Beach')) {
    signals.push('Beachfront location with patio seating');
  }
  if (city.includes('Beverly') || city.includes('Newport')) {
    signals.push('High-end clientele area');
  }
  
  return signals;
}

// Calculate score with SoCal market factors
function calculateSoCalScore(concept: string, pricePoint: string, location: string) {
  let score = 70; // Base score
  
  // Concept scoring
  const highValueConcepts = ['Steakhouse', 'Seafood', 'Italian Fine Dining', 'Omakase'];
  const trendingConcepts = ['Plant-based', 'Korean BBQ', 'Rooftop', 'Ghost Kitchen'];
  
  if (highValueConcepts.some(c => concept.includes(c))) score += 15;
  if (trendingConcepts.some(c => concept.includes(c))) score += 10;
  
  // Price point scoring
  if (pricePoint === '$$$') score += 10;
  else if (pricePoint === '$$') score += 5;
  
  // Location scoring
  const premiumLocations = ['Beverly Hills', 'Newport Beach', 'Manhattan Beach', 'Malibu'];
  const growthLocations = ['Downtown LA', 'Irvine', 'Costa Mesa', 'Pasadena'];
  
  if (premiumLocations.some(l => location.includes(l))) score += 10;
  if (growthLocations.some(l => location.includes(l))) score += 8;
  
  return Math.min(100, score + Math.floor(Math.random() * 10));
}

function categorizeSegment(concept: string): string {
  if (concept.includes('Steakhouse') || concept.includes('Fine Dining')) return 'restaurant';
  if (concept.includes('Coffee') || concept.includes('Cafe')) return 'cafe';
  if (concept.includes('Bakery')) return 'bakery';
  if (concept.includes('Hotel')) return 'hotel';
  if (concept.includes('Bar') || concept.includes('Lounge')) return 'bar';
  if (concept.includes('Catering')) return 'catering';
  return 'restaurant';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      area = 'all', // 'la', 'oc', 'surrounding', or 'all'
      category = 'all',
      source = 'multi',
      limit = 20
    } = body;
    
    console.log(`Starting SoCal discovery for area: ${area}`);
    
    // Discover leads
    const discoveredLeads = await discoverSoCalLeads({ area, category, source });
    
    // Convert to intake format
    const leadsToInsert = discoveredLeads.slice(0, limit).map((lead: any) => {
      // Prepare signals for raw data
      const discoverySignals = lead.signals?.map((s: string) => ({
        type: 'socal_signal',
        value: { description: s, confidence: 0.9 }
      })) || [];

      // Enrich raw data with discovery_signals
      const enrichedLead = {
        ...lead,
        discovery_signals: discoverySignals
      };

      return {
        source: 'socal_focused_discovery',
        raw: enrichedLead,
        suggested_company: {
          name: lead.name || lead.businessName,
          segment: lead.segment || 'restaurant',
          concept: lead.concept,
          price_band: lead.pricePoint || '$$',
          location_count: 1
        },
        suggested_location: {
          city: lead.location?.split(',')[0] || lead.city,
          state: 'CA',
          formatted_address: lead.address || lead.location
        },
        suggested_contacts: lead.contacts || [],
        score_preview: lead.score || 75,
        winability_preview: Math.floor(Math.random() * 20) + 75,
        status: 'pending'
      };
    });
    
    // Insert into database
    const { data, error } = await supabase
      .from('lead_intake')
      .insert(leadsToInsert)
      .select();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to save SoCal leads',
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'SoCal lead discovery completed',
      area: area,
      discovered: data?.length || 0,
      leads: data,
      coverage: {
        losAngeles: discoveredLeads.filter((l: any) => 
          SOCAL_LOCATIONS.losAngeles.some(loc => l.location?.includes(loc.split(',')[0]))
        ).length,
        orangeCounty: discoveredLeads.filter((l: any) => 
          SOCAL_LOCATIONS.orangeCounty.some(loc => l.location?.includes(loc.split(',')[0]))
        ).length,
        surrounding: discoveredLeads.filter((l: any) => 
          SOCAL_LOCATIONS.surrounding.some(loc => l.location?.includes(loc.split(',')[0]))
        ).length
      }
    });
    
  } catch (error) {
    console.error('SoCal discovery error:', error);
    return NextResponse.json({ 
      error: 'Failed to discover SoCal leads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for quick testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const area = searchParams.get('area') || 'all';
  
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ 
      area,
      category: 'all',
      source: 'multi',
      limit: 20
    }),
    headers: { 'Content-Type': 'application/json' }
  }));
}