import { NextRequest, NextResponse } from 'next/server';

// Gmail OAuth configuration from environment variables - trim any whitespace
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

// Determine the redirect URI based on the request URL
function getRedirectUri(request: NextRequest) {
  const host = request.headers.get('host');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const actualHost = forwardedHost || host;
  
  console.log('Debug - Host:', host, 'Forwarded Host:', forwardedHost, 'Using:', actualHost);
  
  // For production, always use the canonical domain
  if (actualHost === 'admin.shurehw.com' || forwardedHost === 'admin.shurehw.com') {
    return 'https://admin.shurehw.com/api/auth/gmail/callback';
  }
  
  // Handle different environments
  if (actualHost?.includes('localhost')) {
    const port = actualHost.split(':')[1] || '3000';
    return `http://localhost:${port}/api/auth/gmail/callback`;
  } else if (actualHost?.includes('vercel.app')) {
    return `https://${actualHost}/api/auth/gmail/callback`;
  }
  
  // Default fallback
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  return `${protocol}://${actualHost}/api/auth/gmail/callback`;
}

// Gmail OAuth scopes for email access
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export async function GET(request: NextRequest) {
  try {
    // Check if we have Google OAuth credentials
    console.log('Client ID length:', GOOGLE_CLIENT_ID.length);
    console.log('Client ID (first 20 chars):', GOOGLE_CLIENT_ID.substring(0, 20));
    console.log('Client ID (last 10 chars):', GOOGLE_CLIENT_ID.substring(GOOGLE_CLIENT_ID.length - 10));
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Missing Google OAuth credentials');
      return NextResponse.redirect(
        `/crm/settings/email-channels?error=config_missing`
      );
    }
    
    // Validate client ID format
    if (!GOOGLE_CLIENT_ID.match(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/)) {
      console.error('Invalid Google Client ID format:', GOOGLE_CLIENT_ID);
      return NextResponse.redirect(
        `/crm/settings/email-channels?error=invalid_client_id`
      );
    }

    // Get user info from query params (passed from frontend)
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const department = searchParams.get('department') || 'support';
    const type = searchParams.get('type') || 'support';
    
    console.log('Gmail OAuth connect initiated:', { userId, department, type });

    // Create state parameter to pass user info through OAuth flow
    const state = Buffer.from(JSON.stringify({
      userId,
      department,
      type,
      timestamp: Date.now(),
    })).toString('base64');

    // Build Google OAuth authorization URL
    const redirectUri = getRedirectUri(request);
    console.log('Using redirect URI:', redirectUri);
    console.log('Using Client ID:', GOOGLE_CLIENT_ID);
    
    // For test users, we can use Gmail scopes
    const isTestMode = true; // Since you're added as a test user
    const scopes = isTestMode ? [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ') : [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ].join(' ');
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', state);

    console.log('Full OAuth URL:', authUrl.toString());
    console.log('Redirecting to Google OAuth...');
    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('Error initiating Gmail OAuth:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate Gmail connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}