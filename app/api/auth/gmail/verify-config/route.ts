import { NextResponse } from 'next/server';

export async function GET() {
  // OAuth credentials from environment variables - trim whitespace
  const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  
  return NextResponse.json({
    hasClientId: !!GOOGLE_CLIENT_ID,
    clientIdLength: GOOGLE_CLIENT_ID.length,
    clientIdFormat: GOOGLE_CLIENT_ID.match(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/) ? 'valid' : 'invalid',
    clientIdFirst20: GOOGLE_CLIENT_ID.substring(0, 20),
    clientIdLast10: GOOGLE_CLIENT_ID.substring(GOOGLE_CLIENT_ID.length - 10),
    hasClientSecret: !!GOOGLE_CLIENT_SECRET,
    clientSecretLength: GOOGLE_CLIENT_SECRET.length,
    clientSecretFirst5: GOOGLE_CLIENT_SECRET.substring(0, 5),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}