import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase if credentials are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// OAuth credentials from environment variables - trim whitespace
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

// Helper function to build redirect URI
function getRedirectUri(request: NextRequest): string {
  // For production, always use the canonical domain
  const host = request.headers.get('host');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const actualHost = forwardedHost || host;
  
  if (actualHost === 'admin.shurehw.com' || forwardedHost === 'admin.shurehw.com') {
    return 'https://admin.shurehw.com/api/auth/gmail/callback';
  }
  
  // For local development
  if (actualHost?.includes('localhost')) {
    const port = actualHost.split(':')[1] || '3000';
    return `http://localhost:${port}/api/auth/gmail/callback`;
  }
  
  // For Vercel preview deployments
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  return `${protocol}://${actualHost}/api/auth/gmail/callback`;
}

// Helper function to build error redirect
function buildErrorRedirect(request: NextRequest, error: string, details?: string): string {
  const host = request.headers.get('host') || 'admin.shurehw.com';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const params = new URLSearchParams({ error });
  if (details) params.append('details', details);
  return `${protocol}://${host}/admin/settings/support-email?${params}`;
}

// Helper function to build success redirect
function buildSuccessRedirect(request: NextRequest, email: string, isSupport: boolean): string {
  const host = request.headers.get('host') || 'admin.shurehw.com';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const path = isSupport 
    ? '/admin/settings/support-email'
    : '/crm/settings/email-channels';
  return `${protocol}://${host}${path}?success=connected&email=${encodeURIComponent(email)}`;
}

export async function GET(request: NextRequest) {
  console.log('Gmail OAuth callback started');
  
  try {
    // 1. Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth denial
    if (error) {
      console.error('OAuth was denied by user:', error);
      return NextResponse.redirect(buildErrorRedirect(request, 'oauth_denied', 'You denied the authorization request'));
    }

    // Validate required parameters
    if (!code) {
      console.error('Missing authorization code');
      return NextResponse.redirect(buildErrorRedirect(request, 'missing_code', 'Authorization code is missing'));
    }

    if (!state) {
      console.error('Missing state parameter');
      return NextResponse.redirect(buildErrorRedirect(request, 'missing_state', 'State parameter is missing'));
    }

    // 2. Decode and validate state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      console.log('State data decoded:', { userId: stateData.userId, department: stateData.department });
    } catch (err) {
      console.error('Failed to decode state:', err);
      return NextResponse.redirect(buildErrorRedirect(request, 'invalid_state', 'Invalid state parameter'));
    }

    // 3. Exchange authorization code for tokens
    console.log('Exchanging authorization code for tokens...');
    const redirectUri = getRedirectUri(request);
    
    // Log the exact values being used
    console.log('Token exchange parameters:', {
      clientIdLength: GOOGLE_CLIENT_ID.length,
      clientIdFirst20: GOOGLE_CLIENT_ID.substring(0, 20),
      clientSecretLength: GOOGLE_CLIENT_SECRET.length,
      clientSecretFirst5: GOOGLE_CLIENT_SECRET.substring(0, 5),
      redirectUri,
      codeLength: code.length,
      codeFirst10: code.substring(0, 10)
    });
    
    let tokenResponse;
    try {
      tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });
    } catch (fetchError) {
      console.error('Network error during token exchange:', fetchError);
      return NextResponse.redirect(buildErrorRedirect(request, 'network_error', 'Failed to connect to Google'));
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      
      // Parse error for better message
      try {
        const errorData = JSON.parse(errorText);
        const errorMessage = errorData.error_description || errorData.error || 'Token exchange failed';
        return NextResponse.redirect(buildErrorRedirect(request, 'token_exchange_failed', errorMessage));
      } catch {
        return NextResponse.redirect(buildErrorRedirect(request, 'token_exchange_failed', `HTTP ${tokenResponse.status}`));
      }
    }

    let tokens;
    try {
      tokens = await tokenResponse.json();
      console.log('Tokens received successfully');
    } catch (parseError) {
      console.error('Failed to parse token response:', parseError);
      return NextResponse.redirect(buildErrorRedirect(request, 'invalid_token_response', 'Invalid response from Google'));
    }

    // 4. Get user information
    console.log('Fetching user information...');
    let userInfoResponse;
    try {
      userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });
    } catch (fetchError) {
      console.error('Network error fetching user info:', fetchError);
      return NextResponse.redirect(buildErrorRedirect(request, 'user_info_network_error', 'Failed to get user information'));
    }

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', userInfoResponse.status);
      return NextResponse.redirect(buildErrorRedirect(request, 'user_info_failed', `HTTP ${userInfoResponse.status}`));
    }

    let userInfo;
    try {
      userInfo = await userInfoResponse.json();
      console.log('User info received:', userInfo.email);
    } catch (parseError) {
      console.error('Failed to parse user info:', parseError);
      return NextResponse.redirect(buildErrorRedirect(request, 'invalid_user_info', 'Invalid user information response'));
    }

    // 5. Store the connection (with graceful fallback)
    const isSupport = stateData.type === 'support' || stateData.department === 'support';
    
    // Try to store in database if available
    if (supabase) {
      try {
        console.log('Attempting to store in database...');
        
        // Check if table exists first
        const { error: tableError } = await supabase
          .from('email_channels')
          .select('id')
          .limit(1);
        
        if (!tableError) {
          // Table exists, store the data
          const channelData = {
            email: userInfo.email,
            provider: 'gmail',
            status: 'connected',
            department: stateData.department || 'support',
            sync_enabled: true,
            auto_create_tickets: isSupport,
            user_id: stateData.userId || userInfo.id,
            oauth_tokens: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expiry_date: Date.now() + (tokens.expires_in * 1000),
            },
            last_sync: new Date().toISOString(),
          };

          const { error: upsertError } = await supabase
            .from('email_channels')
            .upsert(channelData, { 
              onConflict: 'email',
              ignoreDuplicates: false 
            });
          
          if (upsertError) {
            console.warn('Database upsert failed:', upsertError);
          } else {
            console.log('Successfully stored in database');
          }
        } else {
          console.log('Email channels table not found, skipping database storage');
        }
      } catch (dbError) {
        console.warn('Database operation failed, continuing anyway:', dbError);
      }
    }

    // Also store in our simple API endpoint
    if (isSupport) {
      try {
        const host = request.headers.get('host') || 'admin.shurehw.com';
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        
        const saveResponse = await fetch(`${protocol}://${host}/api/admin/support-email/accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userInfo.email,
            department: stateData.department || 'support',
            status: 'connected',
            autoCreateTickets: true,
          }),
        });
        
        if (!saveResponse.ok) {
          console.warn('Failed to save to accounts endpoint:', saveResponse.status);
        }
      } catch (saveError) {
        console.warn('Failed to save account locally:', saveError);
      }
    }

    // 6. Redirect to success page
    console.log('OAuth flow completed successfully, redirecting...');
    return NextResponse.redirect(buildSuccessRedirect(request, userInfo.email, isSupport));

  } catch (unexpectedError) {
    // Catch-all for any unexpected errors
    console.error('Unexpected error in Gmail OAuth callback:', unexpectedError);
    const errorMessage = unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error';
    return NextResponse.redirect(buildErrorRedirect(request, 'unexpected_error', errorMessage));
  }
}