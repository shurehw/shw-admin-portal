import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Apollo.io Integration
async function searchApollo(params: any) {
  const { location, categories, limit = 25 } = params;
  
  if (!process.env.APOLLO_API_KEY) return [];
  
  try {
    // Search for organizations
    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.APOLLO_API_KEY
      },
      body: JSON.stringify({
        api_key: process.env.APOLLO_API_KEY,
        q_organization_domains: [],
        page: 1,
        per_page: limit,
        organization_locations: [location],
        organization_industry_tag_ids: getApolloIndustryIds(categories),
        organization_num_employees_ranges: [
          { min: 1, max: 50 },    // Small businesses
          { min: 51, max: 200 },   // Medium businesses
          { min: 201, max: 500 }   // Larger operations
        ],
        person_titles: [
          'owner', 'general manager', 'purchasing manager',
          'executive chef', 'food and beverage director',
          'operations manager', 'ceo', 'founder'
        ]
      })
    });
    
    const data = await response.json();
    
    return data.people?.map((person: any) => ({
      source: 'apollo',
      company: {
        name: person.organization?.name,
        website: person.organization?.website_url,
        phone: person.organization?.phone,
        employeeCount: person.organization?.estimated_num_employees,
        industry: person.organization?.industry,
        founded: person.organization?.founded_year
      },
      contact: {
        firstName: person.first_name,
        lastName: person.last_name,
        title: person.title,
        email: person.email,
        phone: person.phone_numbers?.[0]?.sanitized_number,
        linkedIn: person.linkedin_url
      },
      location: {
        city: person.organization?.city,
        state: person.organization?.state,
        country: person.organization?.country
      },
      signals: extractApolloSignals(person.organization)
    })) || [];
  } catch (error) {
    console.error('Apollo API error:', error);
    return [];
  }
}

// Hunter.io Email Finder
async function searchHunter(domain: string) {
  if (!process.env.HUNTER_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`
    );
    const data = await response.json();
    
    return {
      emails: data.data?.emails || [],
      pattern: data.data?.pattern,
      organization: data.data?.organization
    };
  } catch (error) {
    console.error('Hunter.io error:', error);
    return null;
  }
}

// Clearbit Company Enrichment
async function enrichWithClearbit(domain: string) {
  if (!process.env.CLEARBIT_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: data.name,
        legalName: data.legalName,
        description: data.description,
        category: data.category?.industry,
        employeeCount: data.metrics?.employees,
        raised: data.metrics?.raised,
        techStack: data.tech,
        tags: data.tags
      };
    }
  } catch (error) {
    console.error('Clearbit error:', error);
  }
  return null;
}

// LinkedIn Sales Navigator (via RapidAPI)
async function searchLinkedIn(params: any) {
  if (!process.env.RAPIDAPI_KEY) return [];
  
  try {
    const response = await fetch(
      'https://linkedin-profiles-and-company-data.p.rapidapi.com/search-companies',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'linkedin-profiles-and-company-data.p.rapidapi.com'
        },
        body: JSON.stringify({
          keywords: params.categories.join(' OR '),
          location: params.location,
          company_sizes: ['B', 'C', 'D'], // 11-50, 51-200, 201-500
          industries: ['Restaurants', 'Hospitality', 'Food & Beverages']
        })
      }
    );
    
    const data = await response.json();
    return data.companies || [];
  } catch (error) {
    console.error('LinkedIn error:', error);
    return [];
  }
}

// Yelp Fusion API
async function searchYelp(location: string, categories: string[]) {
  if (!process.env.YELP_API_KEY) return [];
  
  const yelpCategories = {
    restaurant: 'restaurants',
    cafe: 'coffee,cafes',
    bakery: 'bakeries',
    hotel: 'hotels',
    catering: 'catering'
  };
  
  try {
    const categoryString = categories
      .map(c => yelpCategories[c as keyof typeof yelpCategories])
      .filter(Boolean)
      .join(',');
    
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?location=${encodeURIComponent(location)}&categories=${categoryString}&limit=50&sort_by=review_count`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.YELP_API_KEY}`
        }
      }
    );
    
    const data = await response.json();
    
    return data.businesses?.map((biz: any) => ({
      source: 'yelp',
      name: biz.name,
      phone: biz.phone,
      address: biz.location?.display_address?.join(', '),
      city: biz.location?.city,
      state: biz.location?.state,
      rating: biz.rating,
      reviewCount: biz.review_count,
      priceRange: biz.price,
      categories: biz.categories?.map((c: any) => c.title),
      url: biz.url,
      coordinates: biz.coordinates
    })) || [];
  } catch (error) {
    console.error('Yelp error:', error);
    return [];
  }
}

// Facebook/Instagram Business Pages (via RapidAPI)
async function searchSocialMedia(location: string, category: string) {
  if (!process.env.RAPIDAPI_KEY) return [];
  
  try {
    const response = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=${category}${location.replace(/[, ]/g, '')}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
        }
      }
    );
    
    const data = await response.json();
    return data.data?.posts || [];
  } catch (error) {
    console.error('Social media error:', error);
    return [];
  }
}

// Government Data Sources
async function searchGovernmentData(location: string) {
  const sources = [];
  
  // USA: data.gov Business Licenses
  try {
    const response = await fetch(
      `https://data.cityofnewyork.us/resource/p94q-8hxh.json?$where=business_name IS NOT NULL&$limit=100`
    );
    const data = await response.json();
    sources.push(...data.map((item: any) => ({
      source: 'gov_license',
      name: item.business_name,
      type: item.industry,
      address: item.business_address,
      licenseStatus: item.license_status,
      licenseType: item.license_type
    })));
  } catch (error) {
    console.error('Government data error:', error);
  }
  
  return sources;
}

// Extract buying signals from various data points
function extractApolloSignals(org: any) {
  const signals = [];
  
  if (org?.technologies) {
    const relevantTech = ['toast', 'square', 'shopify', 'doordash', 'uber eats'];
    const hasTech = org.technologies.some((t: string) => 
      relevantTech.some(rt => t.toLowerCase().includes(rt))
    );
    if (hasTech) signals.push('Uses modern POS/delivery systems');
  }
  
  if (org?.funding_events?.length > 0) {
    const recentFunding = org.funding_events[0];
    if (new Date(recentFunding.date).getFullYear() >= 2023) {
      signals.push(`Recent funding: ${recentFunding.amount}`);
    }
  }
  
  if (org?.employee_growth_rate > 10) {
    signals.push(`${org.employee_growth_rate}% employee growth`);
  }
  
  if (org?.keywords?.includes('expanding') || org?.keywords?.includes('opening')) {
    signals.push('Expansion signals in company description');
  }
  
  return signals;
}

function getApolloIndustryIds(categories: string[]) {
  const industryMap: Record<string, string[]> = {
    restaurant: ['restaurants', 'food_and_beverages', 'hospitality'],
    cafe: ['coffee_shops', 'food_and_beverages'],
    bakery: ['bakeries', 'food_production'],
    hotel: ['hotels', 'hospitality', 'accommodation'],
    catering: ['catering', 'event_services', 'food_service']
  };
  
  return categories.flatMap(c => industryMap[c] || []);
}

// Calculate lead score based on multiple data points
function calculateLeadScore(leadData: any) {
  let score = 50; // Base score
  
  // Apollo data quality
  if (leadData.apollo) {
    if (leadData.apollo.contact?.email) score += 10;
    if (leadData.apollo.company?.employeeCount > 10) score += 5;
    if (leadData.apollo.company?.employeeCount > 50) score += 5;
    if (leadData.apollo.signals?.length > 0) score += leadData.apollo.signals.length * 3;
  }
  
  // Yelp ratings
  if (leadData.yelp) {
    if (leadData.yelp.rating >= 4) score += 5;
    if (leadData.yelp.reviewCount > 100) score += 5;
    if (leadData.yelp.reviewCount > 500) score += 5;
  }
  
  // Clearbit enrichment
  if (leadData.clearbit) {
    if (leadData.clearbit.raised) score += 8;
    if (leadData.clearbit.techStack?.length > 5) score += 5;
  }
  
  // Multiple data sources confirmed
  const sourceCount = [leadData.apollo, leadData.yelp, leadData.clearbit, leadData.hunter]
    .filter(Boolean).length;
  score += sourceCount * 5;
  
  return Math.min(100, score);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      location = 'New York, NY',
      categories = ['restaurant', 'cafe', 'hotel'],
      sources = ['apollo', 'yelp', 'clearbit'],
      limit = 20
    } = body;
    
    console.log('Starting multi-source discovery for:', location, categories);
    
    // Parallel data fetching from all sources
    const [apolloData, yelpData, govData] = await Promise.all([
      sources.includes('apollo') ? searchApollo({ location, categories, limit }) : [],
      sources.includes('yelp') ? searchYelp(location, categories) : [],
      sources.includes('government') ? searchGovernmentData(location) : []
    ]);
    
    // Merge and deduplicate data
    const mergedLeads = new Map();
    
    // Process Apollo data
    apolloData.forEach((lead: any) => {
      const key = lead.company?.name?.toLowerCase() || '';
      if (key) {
        mergedLeads.set(key, {
          ...mergedLeads.get(key),
          apollo: lead,
          name: lead.company.name
        });
      }
    });
    
    // Process Yelp data
    yelpData.forEach((lead: any) => {
      const key = lead.name?.toLowerCase() || '';
      if (key) {
        const existing = mergedLeads.get(key) || {};
        mergedLeads.set(key, {
          ...existing,
          yelp: lead,
          name: lead.name
        });
      }
    });
    
    // Enrich with additional data sources
    const enrichedLeads = [];
    for (const [key, leadData] of mergedLeads.entries()) {
      // Try to get domain for enrichment
      const domain = leadData.apollo?.company?.website || 
                    leadData.clearbit?.domain;
      
      if (domain && sources.includes('clearbit')) {
        leadData.clearbit = await enrichWithClearbit(domain);
      }
      
      if (domain && sources.includes('hunter')) {
        leadData.hunter = await searchHunter(domain);
      }
      
      // Calculate comprehensive score
      leadData.score = calculateLeadScore(leadData);
      enrichedLeads.push(leadData);
    }
    
    // Sort by score
    enrichedLeads.sort((a, b) => b.score - a.score);
    
    // Convert to lead intake format
    const leadsToInsert = enrichedLeads.slice(0, limit).map((lead: any) => {
      // Prepare signals for raw data
      const discoverySignals = [
        ...(lead.apollo?.signals || []),
        ...(lead.yelp?.rating ? [`Yelp: ${lead.yelp.rating}★ (${lead.yelp.reviewCount} reviews)`] : []),
        ...(lead.clearbit?.raised ? [`Raised: ${lead.clearbit.raised}`] : [])
      ].map(signal => ({
        type: 'multi_source',
        value: { description: signal, confidence: 0.9 }
      }));

      // Enrich raw data with discovery_signals
      const enrichedRawData = {
        ...lead,
        discovery_signals: discoverySignals
      };

      return {
        source: 'multi_source_discovery',
        raw: enrichedRawData,
        suggested_company: {
          name: lead.name,
          legal_name: lead.clearbit?.legalName || lead.apollo?.company?.name,
          website: lead.apollo?.company?.website || lead.clearbit?.domain,
          phone: lead.apollo?.company?.phone || lead.yelp?.phone,
          segment: categorizeBusinessType(
            lead.apollo?.company?.industry || 
            lead.yelp?.categories?.[0] || 
            lead.clearbit?.category
          ),
          employee_count: lead.apollo?.company?.employeeCount || lead.clearbit?.employeeCount,
          location_count: 1,
          tech_stack: lead.clearbit?.techStack,
          price_band: lead.yelp?.priceRange || '$$'
        },
        suggested_location: {
          formatted_address: lead.yelp?.address || lead.apollo?.location?.address,
          city: lead.apollo?.location?.city || lead.yelp?.city,
          state: lead.apollo?.location?.state || lead.yelp?.state
        },
        suggested_contacts: [
          ...(lead.apollo?.contact ? [{
            firstName: lead.apollo.contact.firstName,
            lastName: lead.apollo.contact.lastName,
            title: lead.apollo.contact.title,
            email: lead.apollo.contact.email,
            phone: lead.apollo.contact.phone,
            linkedIn: lead.apollo.contact.linkedIn
          }] : []),
          ...(lead.hunter?.emails?.slice(0, 2).map((email: any) => ({
            email: email.value,
            firstName: email.first_name,
            lastName: email.last_name,
            title: email.position
          })) || [])
        ],
        score_preview: lead.score,
        winability_preview: Math.floor(Math.random() * 20) + 70,
        status: 'pending',
        data_sources: Object.keys(lead).filter(k => k !== 'name' && k !== 'score')
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
        error: 'Failed to save leads',
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      discovered: data?.length || 0,
      sources_used: sources,
      location: location,
      categories: categories,
      leads: data,
      stats: {
        apollo: apolloData.length,
        yelp: yelpData.length,
        government: govData.length,
        enriched: enrichedLeads.filter(l => l.clearbit || l.hunter).length
      }
    });
    
  } catch (error) {
    console.error('Multi-source discovery error:', error);
    return NextResponse.json({ 
      error: 'Failed to discover leads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function categorizeBusinessType(type: string): string {
  if (!type) return 'restaurant';
  const lowerType = type.toLowerCase();
  if (lowerType.includes('restaurant') || lowerType.includes('dining')) return 'restaurant';
  if (lowerType.includes('cafe') || lowerType.includes('coffee')) return 'cafe';
  if (lowerType.includes('bakery') || lowerType.includes('bread')) return 'bakery';
  if (lowerType.includes('hotel') || lowerType.includes('lodging')) return 'hotel';
  if (lowerType.includes('catering')) return 'catering';
  return 'restaurant';
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ 
      location: 'New York, NY',
      categories: ['restaurant', 'cafe', 'hotel'],
      sources: ['apollo', 'yelp'],
      limit: 10
    }),
    headers: { 'Content-Type': 'application/json' }
  }));
}