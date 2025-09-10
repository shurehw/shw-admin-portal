import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET - Fetch all requests (filtered by user permissions)
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

    // Execute query
    const { data: requests, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching limbo requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return NextResponse.json(requests || []);
  } catch (error) {
    console.error('Error in GET /api/limbo/requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new request
export async function POST(request: NextRequest) {
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

    // Get user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, department, full_name, email')
      .eq('user_id', user.id)
      .single();

    // Check if user can create requests (sales or CS)
    if (!['admin', 'sales_rep', 'customer_service'].includes(userProfile?.role || '') &&
        !['sales', 'cs', 'customer_service'].includes(userProfile?.department || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    // Prepare request data
    const requestData = {
      type: body.type,
      name_of_item: body.name_of_item,
      brand_specific: body.brand_specific || false,
      brand_name: body.brand_name,
      reference_link: body.reference_link,
      preferred_vendor: body.preferred_vendor,
      stock_double_check: body.stock_double_check || false,
      par_requested: body.par_requested,
      prev_price: body.prev_price,
      case_pack_number: body.case_pack_number,
      previous_case_count: body.previous_case_count,
      products_field: body.products_field,
      special_order_qty: body.special_order_qty,
      quote_field: body.quote_field,
      existing_sku_search: body.existing_sku_search,
      sp_customer_field: body.sp_customer_field,
      creator_id: user.id,
      creator_name: userProfile?.full_name || body.creator_name,
      creator_email: userProfile?.email || user.email,
      sales_rep_name: body.sales_rep_name,
      status: 'pending',
      archived: false
    };

    // Insert request
    const { data: newRequest, error } = await supabase
      .from('limbo_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      console.error('Error creating limbo request:', error);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    // Handle attachments if provided
    if (body.attachments && body.attachments.length > 0) {
      const attachmentRecords = body.attachments.map((url: string, index: number) => ({
        request_id: newRequest.id,
        file_url: url,
        file_name: `attachment_${index + 1}`,
        uploaded_by: user.id
      }));

      await supabase
        .from('limbo_attachments')
        .insert(attachmentRecords);
    }

    return NextResponse.json(newRequest);
  } catch (error) {
    console.error('Error in POST /api/limbo/requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}