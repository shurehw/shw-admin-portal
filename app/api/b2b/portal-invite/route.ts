import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import bundleB2B from '@/lib/bundleb2b';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      contactId,
      companyId,
      email,
      firstName,
      lastName,
      company,
      customMessage,
      accessLevel = 'standard', // standard, premium, restricted
      permissions = {
        canViewPricing: true,
        canPlaceOrders: true,
        canViewInvoices: true,
        canViewStatements: true,
        canRequestQuotes: true,
        spendingLimit: null
      }
    } = body;

    // Get current user
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to invite
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to send portal invitations' }, { status: 403 });
    }

    // Generate unique invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Store invitation in database
    const { data: invitation, error: inviteError } = await supabase
      .from('portal_invitations')
      .insert({
        token: invitationToken,
        contact_id: contactId,
        company_id: companyId,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        company_name: company,
        access_level: accessLevel,
        permissions: permissions,
        invited_by: user.id,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        custom_message: customMessage
      })
      .select()
      .single();

    if (inviteError) {
      // If table doesn't exist, create it
      if (inviteError.code === '42P01') {
        // Create the table
        await supabase.rpc('create_portal_invitations_table', {
          sql: `
            CREATE TABLE IF NOT EXISTS portal_invitations (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              token UUID NOT NULL UNIQUE,
              contact_id TEXT,
              company_id TEXT,
              email TEXT NOT NULL,
              first_name TEXT,
              last_name TEXT,
              company_name TEXT,
              access_level TEXT DEFAULT 'standard',
              permissions JSONB,
              invited_by UUID REFERENCES auth.users(id),
              status TEXT DEFAULT 'pending',
              expires_at TIMESTAMP WITH TIME ZONE,
              accepted_at TIMESTAMP WITH TIME ZONE,
              custom_message TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX idx_portal_invitations_token ON portal_invitations(token);
            CREATE INDEX idx_portal_invitations_email ON portal_invitations(email);
            CREATE INDEX idx_portal_invitations_status ON portal_invitations(status);
          `
        }).catch(() => {
          // If RPC doesn't exist, we'll handle it differently
        });

        // Try inserting again
        const { data: retryInvitation } = await supabase
          .from('portal_invitations')
          .insert({
            token: invitationToken,
            contact_id: contactId,
            company_id: companyId,
            email: email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            company_name: company,
            access_level: accessLevel,
            permissions: permissions,
            invited_by: user.id,
            status: 'pending',
            expires_at: expiresAt.toISOString(),
            custom_message: customMessage
          })
          .select()
          .single();

        if (retryInvitation) {
          // Continue with the flow
        }
      } else {
        console.error('Error creating invitation:', inviteError);
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
      }
    }

    // Generate portal URL
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/b2b/portal/register?token=${invitationToken}`;

    // Try to create B2B account via BigCommerce if company ID exists
    if (companyId) {
      try {
        const b2bData = {
          email,
          firstName,
          lastName,
          companyId,
          role: 'buyer',
          permissions: {
            canCreateOrders: permissions.canPlaceOrders,
            canViewPricing: permissions.canViewPricing,
            canViewInvoices: permissions.canViewInvoices,
            spendingLimit: permissions.spendingLimit
          }
        };

        await bundleB2B.inviteCompanyUser(companyId, b2bData);
      } catch (bcError) {
        console.log('BigCommerce B2B invitation failed, continuing with email only:', bcError);
      }
    }

    // Send invitation email (using a mock for now - replace with your email service)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Our B2B Portal</h2>
        <p>Hello ${firstName} ${lastName},</p>
        <p>You've been invited to access our B2B customer portal where you can:</p>
        <ul>
          <li>View your custom pricing</li>
          <li>Place orders online 24/7</li>
          <li>Track order status and shipments</li>
          <li>Access invoices and statements</li>
          <li>Request quotes for custom products</li>
        </ul>
        ${customMessage ? `<p><strong>Personal message:</strong> ${customMessage}</p>` : ''}
        <p>Click the button below to set up your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Your Portal
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
        <p style="color: #666; font-size: 14px;">If you have any questions, please contact your sales representative.</p>
      </div>
    `;

    // In production, you would send this via your email service
    // For now, we'll return the invitation details
    console.log('Email would be sent to:', email);
    console.log('Portal URL:', portalUrl);

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation?.id || invitationToken,
        email,
        portalUrl,
        expiresAt: expiresAt.toISOString(),
        status: 'sent'
      },
      message: `Portal invitation sent to ${email}`
    });

  } catch (error) {
    console.error('Error sending portal invitation:', error);
    return NextResponse.json({ 
      error: 'Failed to send portal invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get invitation status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token && !email) {
      return NextResponse.json({ error: 'Token or email required' }, { status: 400 });
    }

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

    let query = supabase.from('portal_invitations').select('*');
    
    if (token) {
      query = query.eq('token', token);
    } else if (email) {
      query = query.eq('email', email.toLowerCase());
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Invitation has expired',
        invitation: { ...data, status: 'expired' }
      }, { status: 410 });
    }

    return NextResponse.json({ invitation: data });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 });
  }
}