import { NextResponse } from 'next/server';
import { MinimalContactService } from '@/lib/supabase';

export async function GET() {
  try {
    const contacts = await MinimalContactService.getAll();
    
    // Format the response to match the expected structure
    const formattedContacts = contacts.map(contact => ({
      id: contact.id,
      email: contact.email,
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      company: contact.company_id || '',
      job_title: contact.job_title || '',
      phone: contact.phone || '',
      mobile: contact.mobile_phone || '',
      lifecycle_stage: contact.lifecycle_stage || 'lead',
      lead_status: contact.lead_status || '',
      owner: contact.owner_id || '',
      created_at: contact.created_at,
      last_contacted: contact.updated_at,
      tags: contact.tags || []
    }));

    return NextResponse.json(formattedContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const contact = await MinimalContactService.create({
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      job_title: body.job_title,
      phone: body.phone,
      mobile_phone: body.mobile,
      lifecycle_stage: body.lifecycle_stage || 'lead',
      lead_status: body.lead_status,
      company_id: body.company_id,
      props: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}