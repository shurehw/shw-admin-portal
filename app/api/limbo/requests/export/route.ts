import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Define CSV headers
  const headers = [
    'ID',
    'Type',
    'Item Name',
    'Brand Specific',
    'Brand Name',
    'Reference Link',
    'Preferred Vendor',
    'Stock Double Check',
    'Par Requested',
    'Previous Price',
    'Case Pack Number',
    'Previous Case Count',
    'SP Customer',
    'Sales Rep',
    'Status',
    'Archived',
    'Creator Name',
    'Creator Email',
    'Created At',
    'Updated At'
  ];

  // Create CSV rows
  const rows = data.map(item => [
    item.id || '',
    item.type || '',
    item.name_of_item || '',
    item.brand_specific ? 'Yes' : 'No',
    item.brand_name || '',
    item.reference_link || '',
    item.preferred_vendor || '',
    item.stock_double_check ? 'Yes' : 'No',
    item.par_requested || '',
    item.prev_price || '',
    item.case_pack_number || '',
    item.previous_case_count || '',
    item.sp_customer_field || '',
    item.sales_rep_name || '',
    item.status || '',
    item.archived ? 'Yes' : 'No',
    item.creator_name || '',
    item.creator_email || '',
    item.created_at ? new Date(item.created_at).toLocaleString() : '',
    item.updated_at ? new Date(item.updated_at).toLocaleString() : ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape cells containing commas or quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  return csvContent;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value)
            })
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, department')
      .eq('user_id', user.id)
      .single();

    // Build query based on user permissions
    let query = supabase.from('limbo_requests').select('*');

    // If not admin or CS, only show user's own requests
    if (userProfile?.role !== 'admin' && 
        userProfile?.department !== 'cs' && 
        userProfile?.department !== 'customer_service') {
      query = query.eq('creator_id', user.id);
    }

    // Get filters from query params
    const searchParams = request.nextUrl.searchParams;
    const filterType = searchParams.get('type');
    const filterStatus = searchParams.get('status');

    if (filterType && filterType !== 'all') {
      query = query.eq('type', filterType);
    }

    if (filterStatus === 'active') {
      query = query.eq('archived', false);
    } else if (filterStatus === 'archived') {
      query = query.eq('archived', true);
    }

    // Execute query
    const { data: requests, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching limbo requests for export:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    // Convert to CSV
    const csv = convertToCSV(requests || []);

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="limbo-requests-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error in GET /api/limbo/requests/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}