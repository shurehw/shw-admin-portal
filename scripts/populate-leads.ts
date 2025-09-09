import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Sample hospitality leads data
const sampleLeads = [
  {
    companyName: "The Modern Kitchen",
    segment: "restaurant",
    subSegment: "Fine Dining",
    city: "New York",
    state: "NY",
    score: 85,
    signals: ["New location opening", "High Yelp rating growth"]
  },
  {
    companyName: "Blue Wave Café",
    segment: "cafe",
    subSegment: "Coffee Shop",
    city: "Los Angeles",
    state: "CA",
    score: 72,
    signals: ["Recent remodel permit", "Expanding hours"]
  },
  {
    companyName: "Artisan Bread Co",
    segment: "bakery",
    subSegment: "Artisan Bakery",
    city: "Chicago",
    state: "IL",
    score: 68,
    signals: ["New ownership", "Adding catering services"]
  },
  {
    companyName: "Grand Plaza Hotel",
    segment: "hotel",
    subSegment: "Luxury",
    city: "Miami",
    state: "FL",
    score: 90,
    signals: ["Major renovation", "New F&B director hired"]
  },
  {
    companyName: "Sunset Grill",
    segment: "restaurant",
    subSegment: "Casual Dining",
    city: "San Diego",
    state: "CA",
    score: 65,
    signals: ["Multiple locations", "Positive review trend"]
  },
  {
    companyName: "Fresh Start Juice Bar",
    segment: "cafe",
    subSegment: "Juice Bar",
    city: "Austin",
    state: "TX",
    score: 58,
    signals: ["Health permit A rating", "Instagram growth"]
  },
  {
    companyName: "Harbor View Restaurant Group",
    segment: "restaurant",
    subSegment: "QSR",
    city: "Seattle",
    state: "WA",
    score: 78,
    signals: ["Multi-unit operator", "Franchise expansion"]
  },
  {
    companyName: "The Daily Grind",
    segment: "cafe",
    subSegment: "Coffee Shop",
    city: "Portland",
    state: "OR",
    score: 61,
    signals: ["Local chain", "New POS system"]
  },
  {
    companyName: "Elite Events Catering",
    segment: "catering",
    subSegment: "Corporate",
    city: "Boston",
    state: "MA",
    score: 74,
    signals: ["Venue partnership", "Growing corporate accounts"]
  },
  {
    companyName: "Mountain Lodge Resort",
    segment: "hotel",
    subSegment: "Resort",
    city: "Denver",
    state: "CO",
    score: 82,
    signals: ["Seasonal surge coming", "Conference bookings up"]
  }
];

async function populateLeads() {
  console.log('Starting to populate leads...');
  
  const leadsToInsert = sampleLeads.map(lead => ({
    source: 'automated_discovery',
    raw: lead,
    suggested_company: {
      name: lead.companyName,
      segment: lead.segment,
      sub_segment: lead.subSegment,
      location_count: Math.floor(Math.random() * 5) + 1,
      price_band: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)]
    },
    suggested_location: {
      city: lead.city,
      state: lead.state,
      formatted_address: `${Math.floor(Math.random() * 9999)} Main St, ${lead.city}, ${lead.state}`
    },
    suggested_contacts: [
      {
        firstName: ['John', 'Sarah', 'Michael', 'Jennifer'][Math.floor(Math.random() * 4)],
        lastName: ['Smith', 'Johnson', 'Davis', 'Wilson'][Math.floor(Math.random() * 4)],
        title: ['Owner', 'General Manager', 'Purchasing Manager', 'Executive Chef'][Math.floor(Math.random() * 4)],
        email: `contact@${lead.companyName.toLowerCase().replace(/\s+/g, '')}.com`
      }
    ],
    score_preview: lead.score,
    winability_preview: Math.floor(Math.random() * 30) + 70,
    status: 'pending',
    signals: lead.signals.map(signal => ({
      type: signal.includes('permit') ? 'permit' : 
            signal.includes('hiring') || signal.includes('hired') ? 'hiring' :
            signal.includes('review') || signal.includes('rating') ? 'review_velocity' :
            signal.includes('remodel') || signal.includes('renovation') ? 'rar_remodel' :
            signal.includes('opening') || signal.includes('expansion') ? 'rar_pre_open' :
            'other',
      value: { description: signal, confidence: 0.85 }
    }))
  }));

  const { data, error } = await supabase
    .from('lead_intake')
    .insert(leadsToInsert)
    .select();

  if (error) {
    console.error('Error inserting leads:', error);
    return;
  }

  console.log(`Successfully added ${data.length} leads to intake queue`);
  return data;
}

// Run if called directly
if (require.main === module) {
  populateLeads()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

export { populateLeads };