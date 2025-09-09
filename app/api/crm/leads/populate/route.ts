import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET endpoint to quickly populate with sample data
export async function GET() {
  try {
    // Sample NYC restaurant/hospitality leads
    const sampleLeads = [
      {
        source: 'google_places_discovery',
        raw: { discovered_at: new Date().toISOString() },
        suggested_company: {
          name: "Joe's Pizza Broadway",
          legal_name: "Joe's Pizza LLC",
          brand_name: "Joe's Pizza",
          segment: "restaurant",
          sub_segment: "QSR",
          website: "joespizzanyc.com",
          phone: "(212) 555-0100",
          location_count: 3,
          price_band: "$$"
        },
        suggested_location: {
          formatted_address: "1435 Broadway, New York, NY 10018",
          city: "New York",
          state: "NY",
          postal_code: "10018"
        },
        suggested_contacts: [{
          firstName: "Tony",
          lastName: "Russo",
          title: "General Manager",
          email: "tony@joespizza.com",
          phone: "(212) 555-0101"
        }],
        score_preview: 78,
        winability_preview: 82,
        status: 'pending'
      },
      {
        source: 'yelp_discovery',
        raw: { discovered_at: new Date().toISOString() },
        suggested_company: {
          name: "Blue Bottle Coffee Chelsea",
          brand_name: "Blue Bottle Coffee",
          segment: "cafe",
          sub_segment: "Coffee Shop",
          website: "bluebottlecoffee.com",
          phone: "(212) 555-0200",
          location_count: 8,
          price_band: "$$$"
        },
        suggested_location: {
          formatted_address: "450 W 15th St, New York, NY 10014",
          city: "New York",
          state: "NY",
          postal_code: "10014"
        },
        suggested_contacts: [],
        score_preview: 85,
        winability_preview: 75,
        status: 'pending'
      },
      {
        source: 'rar_signal',
        raw: { signal: "new_permit", discovered_at: new Date().toISOString() },
        suggested_company: {
          name: "The Smith Restaurant",
          segment: "restaurant",
          sub_segment: "Casual Dining",
          website: "thesmithrestaurant.com",
          phone: "(212) 555-0300",
          location_count: 4,
          price_band: "$$"
        },
        suggested_location: {
          formatted_address: "956 2nd Ave, New York, NY 10022",
          city: "New York",
          state: "NY",
          postal_code: "10022"
        },
        suggested_contacts: [{
          firstName: "Sarah",
          lastName: "Mitchell",
          title: "Purchasing Director",
          email: "sarah@thesmithnyc.com"
        }],
        score_preview: 72,
        winability_preview: 88,
        status: 'pending'
      },
      {
        source: 'google_places_discovery',
        raw: { discovered_at: new Date().toISOString() },
        suggested_company: {
          name: "Levain Bakery",
          segment: "bakery",
          sub_segment: "Artisan Bakery",
          website: "levainbakery.com",
          phone: "(212) 555-0400",
          location_count: 6,
          price_band: "$$"
        },
        suggested_location: {
          formatted_address: "167 W 74th St, New York, NY 10023",
          city: "New York",
          state: "NY",
          postal_code: "10023"
        },
        suggested_contacts: [],
        score_preview: 69,
        winability_preview: 71,
        status: 'pending'
      },
      {
        source: 'rar_signal',
        raw: { signal: "ownership_change", discovered_at: new Date().toISOString() },
        suggested_company: {
          name: "The Jane Hotel",
          segment: "hotel",
          sub_segment: "Boutique",
          website: "thejanenyc.com",
          phone: "(212) 555-0500",
          location_count: 1,
          price_band: "$$"
        },
        suggested_location: {
          formatted_address: "113 Jane St, New York, NY 10014",
          city: "New York",
          state: "NY",
          postal_code: "10014"
        },
        suggested_contacts: [{
          firstName: "Michael",
          lastName: "Chen",
          title: "F&B Director",
          email: "mchen@thejanenyc.com",
          phone: "(212) 555-0501"
        }],
        score_preview: 91,
        winability_preview: 85,
        status: 'pending'
      },
      {
        source: 'google_places_discovery',
        raw: { discovered_at: new Date().toISOString() },
        suggested_company: {
          name: "Shake Shack Madison Square",
          brand_name: "Shake Shack",
          segment: "restaurant",
          sub_segment: "Fast Casual",
          website: "shakeshack.com",
          phone: "(212) 555-0600",
          location_count: 15,
          price_band: "$$"
        },
        suggested_location: {
          formatted_address: "Madison Square Park, New York, NY 10010",
          city: "New York",
          state: "NY",
          postal_code: "10010"
        },
        suggested_contacts: [],
        score_preview: 81,
        winability_preview: 68,
        status: 'pending'
      },
      {
        source: 'yelp_discovery',
        raw: { discovered_at: new Date().toISOString() },
        suggested_company: {
          name: "Gramercy Tavern",
          segment: "restaurant",
          sub_segment: "Fine Dining",
          website: "gramercytavern.com",
          phone: "(212) 555-0700",
          location_count: 1,
          price_band: "$$$"
        },
        suggested_location: {
          formatted_address: "42 E 20th St, New York, NY 10003",
          city: "New York",
          state: "NY",
          postal_code: "10003"
        },
        suggested_contacts: [{
          firstName: "James",
          lastName: "Williams",
          title: "Executive Chef",
          email: "jwilliams@gramercytavern.com"
        }],
        score_preview: 88,
        winability_preview: 92,
        status: 'pending'
      },
      {
        source: 'rar_signal',
        raw: { signal: "pre_opening", discovered_at: new Date().toISOString() },
        suggested_company: {
          name: "Sweetgreen Bryant Park",
          brand_name: "Sweetgreen",
          segment: "restaurant",
          sub_segment: "Fast Casual",
          website: "sweetgreen.com",
          phone: "(212) 555-0800",
          location_count: 12,
          price_band: "$$"
        },
        suggested_location: {
          formatted_address: "1095 6th Ave, New York, NY 10036",
          city: "New York",
          state: "NY",
          postal_code: "10036"
        },
        suggested_contacts: [],
        score_preview: 75,
        winability_preview: 79,
        status: 'pending'
      }
    ];

    // Insert into database
    const { data, error } = await supabase
      .from('lead_intake')
      .insert(sampleLeads)
      .select();

    if (error) {
      console.error('Error populating leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${data.length} sample leads`,
      count: data.length,
      leads: data
    });

  } catch (error) {
    console.error('Population error:', error);
    return NextResponse.json({ error: 'Failed to populate leads' }, { status: 500 });
  }
}