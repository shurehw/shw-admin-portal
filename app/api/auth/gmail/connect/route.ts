import { NextRequest, NextResponse } from 'next/server';

// Gmail OAuth configuration from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Determine the redirect URI based on the request URL
function getRedirectUri(request: NextRequest) {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  return `${protocol}://${host}/api/auth/gmail/callback`;
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
    console.log('Using Client ID:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', state);

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