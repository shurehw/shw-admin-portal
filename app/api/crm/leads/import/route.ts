import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const leads = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const lead: any = {};
      
      headers.forEach((header, index) => {
        lead[header] = values[index] || '';
      });
      
      // Map CSV fields to lead intake format
      const intakeLead = {
        source: 'csv_import',
        raw: lead,
        suggested_company: {
          name: lead.company_name || lead.Company || lead.business_name || '',
          legal_name: lead.legal_name || '',
          brand_name: lead.brand_name || lead.dba || '',
          segment: lead.segment || lead.type || 'restaurant',
          sub_segment: lead.sub_segment || lead.category || '',
          website: lead.website || lead.url || '',
          phone: lead.phone || lead.phone_number || '',
          location_count: parseInt(lead.locations) || 1
        },
        suggested_location: {
          formatted_address: lead.address || '',
          city: lead.city || '',
          state: lead.state || '',
          postal_code: lead.zip || lead.postal_code || ''
        },
        suggested_contacts: [],
        score_preview: Math.floor(Math.random() * 60) + 40,
        winability_preview: Math.floor(Math.random() * 50) + 50,
        status: 'pending'
      };
      
      // Add contact if provided
      if (lead.contact_name || lead.contact_email) {
        const nameParts = (lead.contact_name || '').split(' ');
        intakeLead.suggested_contacts.push({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: lead.contact_email || lead.email || '',
          phone: lead.contact_phone || '',
          title: lead.contact_title || lead.title || ''
        });
      }
      
      leads.push(intakeLead);
    }
    
    // Batch insert leads
    const { data, error } = await supabase
      .from('lead_intake')
      .insert(leads)
      .select();
    
    if (error) {
      console.error('Import error:', error);
      return NextResponse.json({ 
        error: 'Failed to import leads', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      imported: data?.length || 0,
      total: leads.length,
      errors: errors
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to process CSV' }, { status: 500 });
  }
}