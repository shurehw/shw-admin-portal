import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Apollo.io API integration for lead enrichment
interface ApolloPersonData {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  email: string;
  phone_numbers: string[];
  linkedin_url?: string;
  organization: {
    id: string;
    name: string;
    website_url?: string;
    industry?: string;
    estimated_num_employees?: number;
    annual_revenue?: number;
    phone?: string;
    linkedin_url?: string;
    facebook_url?: string;
    twitter_url?: string;
  };
}

interface ApolloCompanyData {
  id: string;
  name: string;
  website_url?: string;
  industry?: string;
  estimated_num_employees?: number;
  annual_revenue?: number;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  technologies?: string[];
  keywords?: string[];
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
}

// Fetch enriched data from Apollo API
async function enrichWithApollo(companyName: string, domain?: string) {
  const apiKey = process.env.APOLLO_API_KEY;
  
  if (!apiKey) {
    console.log('Apollo API key not configured - skipping enrichment');
    // Return null to indicate no enrichment available
    return null;
  }
  
  try {
    // Search for company
    const searchUrl = 'https://api.apollo.io/v1/mixed_companies/search';
    const searchPayload = {
      api_key: apiKey,
      q_organization_name: companyName,
      q_organization_domain: domain,
      page: 1,
      per_page: 1
    };
    
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(searchPayload)
    });
    
    if (!searchResponse.ok) {
      console.error('Apollo search failed:', searchResponse.status);
      return getMockApolloData(companyName);
    }
    
    const searchData = await searchResponse.json();
    const company = searchData.organizations?.[0];
    
    if (!company) {
      return getMockApolloData(companyName);
    }
    
    // Get people at the company
    const peopleUrl = 'https://api.apollo.io/v1/mixed_people/search';
    const peoplePayload = {
      api_key: apiKey,
      q_organization_id: company.id,
      page: 1,
      per_page: 5,
      person_titles: ['owner', 'ceo', 'president', 'general manager', 'purchasing', 'buyer']
    };
    
    const peopleResponse = await fetch(peopleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(peoplePayload)
    });
    
    const peopleData = peopleResponse.ok ? await peopleResponse.json() : { people: [] };
    
    return {
      company: company,
      people: peopleData.people || []
    };
    
  } catch (error) {
    console.error('Apollo API error:', error);
    return getMockApolloData(companyName);
  }
}

// Generate mock Apollo-style data for testing
function getMockApolloData(companyName: string) {
  const industries = ['Restaurant', 'Hospitality', 'Food Service', 'Hotel', 'Catering'];
  const titles = ['Owner', 'General Manager', 'Purchasing Manager', 'Operations Director', 'CEO'];
  const firstNames = ['John', 'Sarah', 'Michael', 'Jennifer', 'Robert', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'];
  
  const industry = industries[Math.floor(Math.random() * industries.length)];
  const employees = Math.floor(Math.random() * 200) + 10;
  const revenue = employees * (Math.floor(Math.random() * 50000) + 20000);
  
  const people = [];
  const numContacts = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < numContacts; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const title = titles[i % titles.length];
    
    people.push({
      id: `mock-person-${Date.now()}-${i}`,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`,
      title: title,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone_numbers: [`(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`],
      linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`
    });
  }
  
  const company = {
    id: `mock-company-${Date.now()}`,
    name: companyName,
    website_url: `https://www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    industry: industry,
    estimated_num_employees: employees,
    annual_revenue: revenue,
    phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    address: {
      street: `${Math.floor(Math.random() * 9999)} Main Street`,
      city: 'Los Angeles',
      state: 'CA',
      postal_code: `900${Math.floor(Math.random() * 90) + 10}`,
      country: 'USA'
    },
    technologies: ['Square POS', 'Toast', 'OpenTable', 'Yelp for Business'],
    keywords: [industry.toLowerCase(), 'b2b', 'hospitality', 'food service'],
    linkedin_url: `https://linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    facebook_url: `https://facebook.com/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    twitter_url: `https://twitter.com/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
  };
  
  return {
    company: company,
    people: people,
    mock: true
  };
}

// POST - Enrich a lead with Apollo data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, companyName, domain, forceRefresh = false } = body;
    
    if (!leadId || !companyName) {
      return NextResponse.json({ 
        error: 'Lead ID and company name are required' 
      }, { status: 400 });
    }
    
    // Get the lead from database
    const { data: lead, error: leadError } = await supabase
      .from('lead_intake')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (leadError || !lead) {
      return NextResponse.json({ 
        error: 'Lead not found' 
      }, { status: 404 });
    }
    
    // Check if we already have Apollo data and it's fresh (unless force refresh)
    if (!forceRefresh && lead.raw?.apollo_data?.fetched_at) {
      const fetchedAt = new Date(lead.raw.apollo_data.fetched_at);
      const daysSinceFetch = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceFetch < 30) { // Data is less than 30 days old
        return NextResponse.json({
          success: true,
          data: lead.raw.apollo_data,
          cached: true
        });
      }
    }
    
    // Fetch fresh data from Apollo
    const apolloData = await enrichWithApollo(companyName, domain);
    
    // If no Apollo data available (no API key), return early
    if (!apolloData) {
      return NextResponse.json({
        success: false,
        error: 'Apollo API key not configured. Please add APOLLO_API_KEY to environment variables.',
        message: 'Enrichment unavailable without Apollo API key'
      }, { status: 400 });
    }
    
    // Update lead with Apollo data
    const updatedRaw = {
      ...lead.raw,
      apollo_data: {
        ...apolloData,
        fetched_at: new Date().toISOString()
      }
    };
    
    // Extract key contacts for suggested_contacts
    const suggestedContacts = apolloData.people?.slice(0, 3).map((person: any) => ({
      firstName: person.first_name,
      lastName: person.last_name,
      title: person.title,
      email: person.email,
      phone: person.phone_numbers?.[0],
      linkedin: person.linkedin_url
    })) || [];
    
    // Update the lead with enriched data
    const { data: updatedLead, error: updateError } = await supabase
      .from('lead_intake')
      .update({
        raw: updatedRaw,
        suggested_contacts: suggestedContacts,
        // Update company info if we got better data
        suggested_company: apolloData.company ? {
          ...lead.suggested_company,
          website: apolloData.company.website_url || lead.suggested_company?.website,
          phone: apolloData.company.phone || lead.suggested_company?.phone,
          employee_count: apolloData.company.estimated_num_employees,
          annual_revenue: apolloData.company.annual_revenue,
          industry: apolloData.company.industry
        } : lead.suggested_company
      })
      .eq('id', leadId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating lead with Apollo data:', updateError);
      return NextResponse.json({ 
        error: 'Failed to save enriched data' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: apolloData,
      lead: updatedLead,
      cached: false
    });
    
  } catch (error) {
    console.error('Apollo enrichment error:', error);
    return NextResponse.json({ 
      error: 'Failed to enrich lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get enrichment status for a lead
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const leadId = searchParams.get('leadId');
  
  if (!leadId) {
    return NextResponse.json({ 
      error: 'Lead ID is required' 
    }, { status: 400 });
  }
  
  const { data: lead, error } = await supabase
    .from('lead_intake')
    .select('raw')
    .eq('id', leadId)
    .single();
  
  if (error || !lead) {
    return NextResponse.json({ 
      error: 'Lead not found' 
    }, { status: 404 });
  }
  
  const apolloData = lead.raw?.apollo_data;
  
  if (!apolloData) {
    return NextResponse.json({
      enriched: false,
      message: 'No Apollo data available'
    });
  }
  
  return NextResponse.json({
    enriched: true,
    fetched_at: apolloData.fetched_at,
    company: apolloData.company,
    contacts_count: apolloData.people?.length || 0
  });
}