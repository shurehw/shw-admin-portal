import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Google Places API Integration for SoCal
async function searchGooglePlaces(params: any) {
  const { location, radius = 10000, type, keyword } = params;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    console.log('Google Places API key not configured');
    return [];
  }
  
  try {
    // First, get coordinates for the location
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();
    
    if (!geocodeData.results?.[0]) {
      console.error('Could not geocode location:', location);
      return [];
    }
    
    const { lat, lng } = geocodeData.results[0].geometry.location;
    
    // Search for places
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${lat},${lng}` +
      `&radius=${radius}` +
      `&type=${type}` +
      (keyword ? `&keyword=${encodeURIComponent(keyword)}` : '') +
      `&key=${apiKey}`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.results) {
      console.error('No results from Google Places');
      return [];
    }
    
    // Get detailed information for top results
    const detailedResults = [];
    for (const place of searchData.results.slice(0, 20)) {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${place.place_id}` +
        `&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,price_level,types,opening_hours,business_status` +
        `&key=${apiKey}`;
      
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      
      if (detailsData.result) {
        detailedResults.push({
          ...place,
          details: detailsData.result
        });
      }
    }
    
    return detailedResults;
  } catch (error) {
    console.error('Google Places API error:', error);
    return [];
  }
}

// Analyze business for lead quality
function analyzeBusinessQuality(place: any) {
  let score = 60; // Base score
  const signals = [];
  
  // Rating analysis
  if (place.rating) {
    if (place.rating >= 4.5) {
      score += 10;
      signals.push(`High rating: ${place.rating}★`);
    } else if (place.rating >= 4.0) {
      score += 5;
    }
  }
  
  // Review volume (indicates business activity)
  if (place.user_ratings_total) {
    if (place.user_ratings_total > 500) {
      score += 10;
      signals.push(`High traffic: ${place.user_ratings_total} reviews`);
    } else if (place.user_ratings_total > 100) {
      score += 5;
    } else if (place.user_ratings_total < 20) {
      signals.push('New business - low review count');
      score += 8; // New businesses are good opportunities
    }
  }
  
  // Price level (higher price = likely higher order values)
  if (place.price_level) {
    score += place.price_level * 5;
    const priceMap = ['', '$', '$$', '$$$', '$$$$'];
    signals.push(`Price level: ${priceMap[place.price_level]}`);
  }
  
  // Business status
  if (place.business_status === 'OPERATIONAL') {
    score += 5;
  }
  
  // Check for signals in the name
  const nameSignals = ['new', 'opening', 'grand', 'coming soon'];
  const nameLower = place.name?.toLowerCase() || '';
  if (nameSignals.some(signal => nameLower.includes(signal))) {
    score += 15;
    signals.push('Possible new opening');
  }
  
  // Type-based scoring
  const highValueTypes = ['restaurant', 'bar', 'night_club', 'lodging', 'cafe'];
  const hasHighValueType = place.types?.some((t: string) => highValueTypes.includes(t));
  if (hasHighValueType) {
    score += 5;
  }
  
  return { score: Math.min(100, score), signals };
}

// Convert Google Places data to lead format
function convertToLead(place: any) {
  const { score, signals } = analyzeBusinessQuality(place);
  
  // Extract address components
  const addressParts = place.details?.formatted_address?.split(',') || [];
  const city = addressParts[1]?.trim() || '';
  const stateZip = addressParts[2]?.trim() || '';
  const state = stateZip.split(' ')[0] || 'CA';
  
  // Determine segment based on types
  let segment = 'restaurant';
  if (place.types?.includes('cafe')) segment = 'cafe';
  else if (place.types?.includes('bakery')) segment = 'bakery';
  else if (place.types?.includes('lodging')) segment = 'hotel';
  else if (place.types?.includes('bar')) segment = 'bar';
  
  return {
    source: 'google_places',
    raw: place,
    suggested_company: {
      name: place.name,
      segment: segment,
      google_place_id: place.place_id,
      website: place.details?.website,
      phone: place.details?.formatted_phone_number,
      rating: place.rating,
      review_count: place.user_ratings_total,
      price_band: ['', '$', '$$', '$$$', '$$$$'][place.price_level || 0] || '$$',
      location_count: 1
    },
    suggested_location: {
      formatted_address: place.details?.formatted_address || place.vicinity,
      city: city,
      state: state,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng
    },
    suggested_contacts: [], // Google doesn't provide contact info
    score_preview: score,
    winability_preview: calculateWinability(place),
    status: 'pending',
    signals: signals.map(s => ({
      type: 'google_signal',
      value: { description: s, confidence: 0.85 }
    }))
  };
}

function calculateWinability(place: any) {
  let winability = 70;
  
  // No website = higher opportunity
  if (!place.details?.website) winability += 10;
  
  // Lower ratings might mean they need help
  if (place.rating && place.rating < 4.0) winability += 5;
  
  // New businesses are easier to win
  if (place.user_ratings_total && place.user_ratings_total < 50) winability += 10;
  
  return Math.min(95, winability);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      locations = [
        'Beverly Hills, CA',
        'Newport Beach, CA',
        'Santa Monica, CA',
        'Irvine, CA',
        'Manhattan Beach, CA'
      ],
      radius = 5000, // meters
      categories = ['restaurant', 'cafe', 'bakery', 'bar'],
      limit = 50
    } = body;
    
    console.log('Starting Google Places discovery for SoCal');
    
    const allPlaces = [];
    
    // Search each location and category combination
    for (const location of locations.slice(0, 3)) { // Limit to 3 locations per run to avoid rate limits
      for (const category of categories) {
        console.log(`Searching ${category} in ${location}`);
        
        // Map our categories to Google Places types
        const typeMap: Record<string, string> = {
          'restaurant': 'restaurant',
          'cafe': 'cafe',
          'bakery': 'bakery',
          'bar': 'bar',
          'hotel': 'lodging'
        };
        
        const places = await searchGooglePlaces({
          location,
          radius,
          type: typeMap[category] || 'restaurant',
          keyword: category === 'restaurant' ? 'restaurant dining' : undefined
        });
        
        allPlaces.push(...places);
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Remove duplicates based on place_id
    const uniquePlaces = Array.from(
      new Map(allPlaces.map(p => [p.place_id, p])).values()
    );
    
    // Convert to leads and sort by score
    const leads = uniquePlaces
      .map(convertToLead)
      .sort((a, b) => b.score_preview - a.score_preview)
      .slice(0, limit);
    
    // Check for existing places to avoid duplicates
    const placeIds = leads.map(l => l.suggested_company.google_place_id);
    const { data: existing } = await supabase
      .from('lead_intake')
      .select('suggested_company')
      .in('suggested_company->>google_place_id', placeIds);
    
    const existingPlaceIds = new Set(
      existing?.map(e => e.suggested_company?.google_place_id) || []
    );
    
    // Filter out duplicates
    const newLeads = leads.filter(
      l => !existingPlaceIds.has(l.suggested_company.google_place_id)
    );
    
    if (newLeads.length > 0) {
      // Insert new leads
      const { data, error } = await supabase
        .from('lead_intake')
        .insert(newLeads)
        .select();
      
      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ 
          error: 'Failed to save Google Places leads',
          details: error.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        source: 'Google Places',
        discovered: uniquePlaces.length,
        new_leads: data?.length || 0,
        duplicates_skipped: leads.length - newLeads.length,
        locations_searched: locations.slice(0, 3),
        top_leads: data?.slice(0, 5).map((l: any) => ({
          name: l.suggested_company.name,
          score: l.score_preview,
          location: l.suggested_location.city
        }))
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No new unique leads found',
        discovered: uniquePlaces.length,
        duplicates_skipped: leads.length
      });
    }
    
  } catch (error) {
    console.error('Google Places discovery error:', error);
    return NextResponse.json({ 
      error: 'Failed to discover leads via Google Places',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({
      locations: ['Newport Beach, CA', 'Irvine, CA'],
      categories: ['restaurant', 'cafe'],
      limit: 20
    }),
    headers: { 'Content-Type': 'application/json' }
  }));
}