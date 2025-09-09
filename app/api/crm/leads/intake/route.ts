import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch lead intake queue
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';

    const query = supabase
      .from('lead_intake')
      .select(`
        *,
        company:companies(id, name, segment, sub_segment),
        assigned_to:auth.users!assigned_to(email)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching lead intake:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// POST - Add new lead to intake queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Calculate initial scores
    const scorePreview = Math.floor(Math.random() * 60) + 40; // 40-100
    const winabilityPreview = Math.floor(Math.random() * 50) + 50; // 50-100

    const { data, error } = await supabase
      .from('lead_intake')
      .insert({
        source: body.source || 'manual',
        raw: body,
        suggested_company: {
          name: body.companyName,
          legal_name: body.legalName,
          brand_name: body.brandName,
          segment: body.segment,
          sub_segment: body.subSegment,
          website: body.website,
          phone: body.phone,
          location_count: body.locationCount || 1
        },
        suggested_location: body.location ? {
          formatted_address: body.location.address,
          city: body.location.city,
          state: body.location.state,
          postal_code: body.location.postalCode
        } : null,
        suggested_contacts: body.contacts || [],
        score_preview: scorePreview,
        winability_preview: winabilityPreview,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating lead intake:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

// PATCH - Update lead intake status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, reason_code, notes, assigned_to, company_id } = body;

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (reason_code) updateData.reason_code = reason_code;
    if (notes) updateData.notes = notes;
    if (assigned_to) {
      updateData.assigned_to = assigned_to;
      updateData.assignment_date = new Date().toISOString();
    }
    if (company_id) updateData.company_id = company_id;

    const { data, error } = await supabase
      .from('lead_intake')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If approved, create company and location records
    if (status === 'approved' && body.createCompany) {
      const companyData = data.suggested_company as any;
      
      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          legal_name: companyData.legal_name,
          brand_name: companyData.brand_name,
          segment: companyData.segment,
          sub_segment: companyData.sub_segment,
          website: companyData.website,
          phone: companyData.phone,
          location_count: companyData.location_count,
          source_tags: [data.source]
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create location if provided
      if (data.suggested_location) {
        const locationData = data.suggested_location as any;
        
        const { error: locationError } = await supabase
          .from('locations')
          .insert({
            company_id: company.id,
            formatted_address: locationData.formatted_address,
            city: locationData.city,
            state: locationData.state,
            postal_code: locationData.postal_code
          });

        if (locationError) throw locationError;
      }

      // Create company score record
      const { error: scoreError } = await supabase
        .from('company_scores')
        .insert({
          company_id: company.id,
          total: data.score_preview,
          winability: data.winability_preview,
          priority_band: data.score_preview >= 70 ? 'P0' : 
                        data.score_preview >= 55 ? 'P1' : 
                        data.score_preview >= 40 ? 'P2' : 'P3'
        });

      if (scoreError) throw scoreError;

      // Update intake with company_id
      await supabase
        .from('lead_intake')
        .update({ company_id: company.id })
        .eq('id', id);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating lead intake:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}