import { NextResponse } from 'next/server';
import { MinimalCompanyService } from '@/lib/supabase';
import { getDataAccessContext, filterDataByVisibility } from '@/lib/data-access';
import { headers } from 'next/headers';
import { AuthService } from '@/lib/auth';

export async function GET() {
  try {
    // Get auth token from headers
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const token = authorization?.replace('Bearer ', '');
    
    // Get data access context
    const claims = token ? AuthService.decodeToken(token) : null;
    const context = claims ? {
      userId: claims.sub,
      role: claims.roles?.[0] || 'guest',
      isAdmin: claims.roles?.includes('org_admin'),
      isSalesManager: claims.roles?.includes('sales_manager'),
      isAccountManager: claims.roles?.includes('account_manager')
    } : null;
    
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const companies = await MinimalCompanyService.getAll();
    
    // Format the response to match the expected structure
    const formattedCompanies = companies.map(company => ({
      id: company.id,
      name: company.name,
      domain: company.domain || '',
      industry: company.industry || '',
      size: company.location_count?.toString() || '',
      revenue: company.t12m_revenue || 0,
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      country: company.country || '',
      website: company.domain || '',
      lifecycle_stage: company.lifecycle_stage || 'lead',
      owner: company.owner_id || '',
      assigned_to: company.owner_id || '', // Add for visibility filtering
      created_by: company.owner_id || '', // Add for visibility filtering
      created_at: company.created_at,
      employees: company.location_count || 0,
      contacts_count: 0 // Will be calculated from contacts
    }));
    
    // Apply visibility filtering based on role
    const visibleCompanies = filterDataByVisibility(
      formattedCompanies, 
      context, 
      'assigned_to'
    );

    return NextResponse.json(visibleCompanies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const company = await MinimalCompanyService.create({
      name: body.name,
      domain: body.domain,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      country: body.country,
      industry: body.industry,
      lifecycle_stage: body.lifecycle_stage || 'lead',
      t12m_revenue: body.revenue,
      location_count: body.employees,
      owner_id: body.owner_id, // Add owner_id
      props: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}