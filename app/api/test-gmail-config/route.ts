import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check all possible environment variables
  const envVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  };

  const config = {
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasApiKey: !!process.env.GOOGLE_PLACES_API_KEY,
    hasMapsKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'Not configured',
    apiKeyPrefix: process.env.GOOGLE_PLACES_API_KEY?.substring(0, 10) || 'Not set',
    redirectUri: process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/gmail/callback`,
    environment: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    availableKeys: Object.keys(envVars).filter(key => !!envVars[key as keyof typeof envVars]),
  };

  return NextResponse.json(config);
}