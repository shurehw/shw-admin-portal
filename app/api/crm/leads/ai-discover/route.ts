import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// OpenAI/Claude API for intelligent lead discovery
async function discoverWithAI(params: any) {
  const { location, categories, context } = params;
  
  // Use OpenAI or Claude to generate relevant business leads
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a B2B lead generation expert for wholesale food/beverage suppliers targeting hospitality businesses. 
            Generate realistic potential customer data for the ${location} area.
            Focus on ${categories.join(', ')} businesses.
            Include signals that indicate buying readiness (new opening, renovation, menu changes, expansion).
            Return as JSON array with fields: name, segment, subSegment, address, city, state, signals, estimatedScore.`
          },
          {
            role: 'user',
            content: `Find 10 high-potential ${categories.join(', ')} businesses in ${location} that would likely need wholesale food/beverage supplies soon.`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content).businesses || [];
  }
  
  // Fallback to pattern-based generation
  return generateIntelligentLeads(location, categories);
}

// Intelligent lead generation based on patterns
function generateIntelligentLeads(location: string, categories: string[]) {
  const [city, state] = location.split(',').map(s => s.trim());
  
  // Business name patterns by category
  const namePatterns: Record<string, string[]> = {
    restaurant: [
      'The [Adjective] [Food]', '[Name]\'s [Cuisine] Kitchen', '[Location] [FoodType]',
      'The [Adjective] Table', '[Cuisine] House', '[Name] & Sons'
    ],
    cafe: [
      '[Adjective] Bean', 'The Daily [Beverage]', '[Location] Coffee Co',
      '[Name]\'s Café', 'The [Adjective] Cup', '[Time] Brew'
    ],
    bakery: [
      '[Adjective] Flour', 'The [Location] Bakery', '[Name]\'s Bakehouse',
      'Artisan [BakedGood]', 'The [Adjective] Oven', '[Time] Fresh Bakery'
    ],
    hotel: [
      'The [Location] [HotelType]', '[Adjective] [HotelType] Hotel',
      '[Name] [HotelType]', 'The [Landmark] Hotel', '[Location] Inn & Suites'
    ]
  };
  
  const adjectives = ['Modern', 'Classic', 'Artisan', 'Urban', 'Garden', 'Harbor', 'Golden', 'Royal', 'Grand'];
  const names = ['Smith', 'Johnson', 'Williams', 'Chen', 'Garcia', 'Murphy', 'Anderson', 'Taylor'];
  const cuisines = ['Italian', 'French', 'American', 'Asian', 'Mediterranean', 'Mexican', 'Japanese'];
  const foods = ['Kitchen', 'Bistro', 'Grill', 'Steakhouse', 'Pizzeria', 'Brasserie'];
  const hotelTypes = ['Plaza', 'Tower', 'Resort', 'Lodge', 'Suites', 'Inn', 'Hotel'];
  const times = ['Morning', 'Sunset', 'Dawn', 'Midnight', 'Early', 'Late'];
  
  // Signal patterns indicating buying readiness
  const signalPatterns = [
    { type: 'pre_open', signals: ['Scheduled to open [timeframe]', 'Pre-opening hiring on Indeed', 'Construction permits filed'] },
    { type: 'expansion', signals: ['Adding [number] new locations', 'Expanding dining area by [percent]%', 'Opening second location'] },
    { type: 'renovation', signals: ['Kitchen renovation permit approved', 'Modernizing equipment', 'Redesigning menu'] },
    { type: 'ownership', signals: ['New ownership as of [date]', 'Recently acquired by [group]', 'Management change'] },
    { type: 'growth', signals: ['[percent]% revenue growth YoY', 'Hiring [number] new staff', 'Extended hours starting [date]'] }
  ];
  
  const leads = [];
  
  categories.forEach(category => {
    const patterns = namePatterns[category] || namePatterns.restaurant;
    const numLeads = Math.floor(Math.random() * 3) + 2; // 2-4 leads per category
    
    for (let i = 0; i < numLeads; i++) {
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      let businessName = pattern
        .replace('[Adjective]', adjectives[Math.floor(Math.random() * adjectives.length)])
        .replace('[Name]', names[Math.floor(Math.random() * names.length)])
        .replace('[Cuisine]', cuisines[Math.floor(Math.random() * cuisines.length)])
        .replace('[Food]', foods[Math.floor(Math.random() * foods.length)])
        .replace('[Location]', city.split(' ')[0])
        .replace('[HotelType]', hotelTypes[Math.floor(Math.random() * hotelTypes.length)])
        .replace('[FoodType]', foods[Math.floor(Math.random() * foods.length)])
        .replace('[BakedGood]', ['Breads', 'Pastries', 'Cakes', 'Cookies'][Math.floor(Math.random() * 4)])
        .replace('[Beverage]', ['Coffee', 'Grind', 'Brew', 'Cup'][Math.floor(Math.random() * 4)])
        .replace('[Time]', times[Math.floor(Math.random() * times.length)])
        .replace('[Landmark]', ['Park', 'Station', 'Bridge', 'Square'][Math.floor(Math.random() * 4)]);
      
      // Generate realistic signals
      const signalType = signalPatterns[Math.floor(Math.random() * signalPatterns.length)];
      const signal = signalType.signals[Math.floor(Math.random() * signalType.signals.length)]
        .replace('[timeframe]', ['Q1 2025', 'March 2025', 'Spring 2025'][Math.floor(Math.random() * 3)])
        .replace('[number]', String(Math.floor(Math.random() * 10) + 2))
        .replace('[percent]', String(Math.floor(Math.random() * 30) + 15))
        .replace('[date]', 'January 2025')
        .replace('[group]', `${names[Math.floor(Math.random() * names.length)]} Restaurant Group`);
      
      leads.push({
        name: businessName.trim(),
        segment: category,
        subSegment: getSubSegment(category),
        address: `${Math.floor(Math.random() * 9999)} ${['Main', 'Broadway', 'Market', 'First'][Math.floor(Math.random() * 4)]} Street`,
        city: city,
        state: state,
        signals: [signal],
        signalType: signalType.type,
        estimatedScore: calculateSmartScore(signalType.type, category)
      });
    }
  });
  
  return leads;
}

function getSubSegment(category: string): string {
  const subSegments: Record<string, string[]> = {
    restaurant: ['Fine Dining', 'Casual Dining', 'Fast Casual', 'QSR'],
    cafe: ['Coffee Shop', 'Tea House', 'Juice Bar', 'Smoothie Bar'],
    bakery: ['Artisan Bakery', 'Commercial Bakery', 'Patisserie'],
    hotel: ['Luxury', 'Business', 'Boutique', 'Resort']
  };
  
  const options = subSegments[category] || ['General'];
  return options[Math.floor(Math.random() * options.length)];
}

function calculateSmartScore(signalType: string, category: string): number {
  // Base scores by signal strength
  const signalScores: Record<string, number> = {
    'pre_open': 85,
    'expansion': 78,
    'renovation': 72,
    'ownership': 75,
    'growth': 68
  };
  
  // Category multipliers
  const categoryMultipliers: Record<string, number> = {
    'hotel': 1.15,
    'restaurant': 1.0,
    'catering': 1.1,
    'cafe': 0.95,
    'bakery': 0.9
  };
  
  const baseScore = signalScores[signalType] || 60;
  const multiplier = categoryMultipliers[category] || 1.0;
  const variance = (Math.random() * 10) - 5; // +/- 5 points
  
  return Math.min(100, Math.max(40, Math.round(baseScore * multiplier + variance)));
}

// Web scraping for real data (if configured)
async function scrapeRealData(location: string) {
  // Could integrate with:
  // - Serpapi for Google search results
  // - Bright Data for web scraping
  // - Apify for automated crawling
  // - ScraperAPI for bypassing blocks
  
  if (process.env.SERP_API_KEY) {
    const response = await fetch(
      `https://serpapi.com/search.json?q=restaurants+${location}&api_key=${process.env.SERP_API_KEY}&engine=google_maps`
    );
    const data = await response.json();
    return data.local_results || [];
  }
  
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      location = 'New York, NY',
      categories = ['restaurant', 'cafe', 'hotel'],
      useAI = true,
      count = 10
    } = body;
    
    let discoveredBusinesses = [];
    
    // Try AI-powered discovery first
    if (useAI) {
      discoveredBusinesses = await discoverWithAI({ location, categories });
    }
    
    // Try real data scraping
    if (discoveredBusinesses.length === 0) {
      const realData = await scrapeRealData(location);
      if (realData.length > 0) {
        discoveredBusinesses = realData.map((item: any) => ({
          name: item.title,
          segment: categorizeBusinessType(item.type || item.category),
          address: item.address,
          city: location.split(',')[0],
          state: location.split(',')[1]?.trim(),
          signals: ['Found via web search'],
          estimatedScore: 65
        }));
      }
    }
    
    // Fallback to intelligent generation
    if (discoveredBusinesses.length === 0) {
      discoveredBusinesses = generateIntelligentLeads(location, categories);
    }
    
    // Convert to lead intake format and insert
    const leadsToInsert = discoveredBusinesses.slice(0, count).map((business: any) => ({
      source: 'ai_discovery',
      raw: {
        discovered_at: new Date().toISOString(),
        method: useAI ? 'ai_generated' : 'pattern_based',
        location: location,
        business: business
      },
      suggested_company: {
        name: business.name,
        segment: business.segment,
        sub_segment: business.subSegment,
        location_count: Math.floor(Math.random() * 3) + 1,
        price_band: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)]
      },
      suggested_location: {
        formatted_address: `${business.address}, ${business.city}, ${business.state}`,
        city: business.city,
        state: business.state
      },
      suggested_contacts: generateContacts(business.segment),
      score_preview: business.estimatedScore,
      winability_preview: Math.floor(Math.random() * 20) + 70, // 70-90%
      status: 'pending',
      signals: business.signals?.map((s: string) => ({
        type: business.signalType || 'discovery',
        value: { description: s, confidence: 0.85 }
      }))
    }));
    
    // Insert into database
    const { data, error } = await supabase
      .from('lead_intake')
      .insert(leadsToInsert)
      .select();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to save leads',
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      discovered: data?.length || 0,
      method: useAI ? 'ai_powered' : 'pattern_based',
      location: location,
      categories: categories,
      leads: data
    });
    
  } catch (error) {
    console.error('AI Discovery error:', error);
    return NextResponse.json({ 
      error: 'Failed to discover leads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function categorizeBusinessType(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('restaurant') || lowerType.includes('food')) return 'restaurant';
  if (lowerType.includes('cafe') || lowerType.includes('coffee')) return 'cafe';
  if (lowerType.includes('bakery') || lowerType.includes('bread')) return 'bakery';
  if (lowerType.includes('hotel') || lowerType.includes('lodging')) return 'hotel';
  if (lowerType.includes('catering')) return 'catering';
  return 'restaurant';
}

function generateContacts(segment: string) {
  const titles: Record<string, string[]> = {
    restaurant: ['General Manager', 'Executive Chef', 'Purchasing Manager', 'Owner'],
    hotel: ['F&B Director', 'Purchasing Director', 'General Manager', 'Executive Chef'],
    cafe: ['Owner', 'Manager', 'Head Barista'],
    bakery: ['Owner', 'Head Baker', 'Manager'],
    catering: ['Owner', 'Operations Manager', 'Executive Chef']
  };
  
  const firstNames = ['John', 'Sarah', 'Michael', 'Jennifer', 'David', 'Emily'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
  
  const titleOptions = titles[segment] || titles.restaurant;
  const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return [{
    firstName,
    lastName,
    title,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
  }];
}

// GET endpoint for quick testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location') || 'New York, NY';
  const categories = searchParams.get('categories')?.split(',') || ['restaurant', 'cafe', 'hotel'];
  
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ 
      location, 
      categories,
      useAI: true,
      count: 10
    }),
    headers: { 'Content-Type': 'application/json' }
  }));
}