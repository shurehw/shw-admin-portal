import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const protocol = request.headers.get('x-forwarded-proto');
  const actualHost = forwardedHost || host;
  
  let redirectUri = '';
  
  if (actualHost === 'admin.shurehw.com' || forwardedHost === 'admin.shurehw.com') {
    redirectUri = 'https://admin.shurehw.com/api/auth/gmail/callback';
  } else if (actualHost?.includes('localhost')) {
    const port = actualHost.split(':')[1] || '3000';
    redirectUri = `http://localhost:${port}/api/auth/gmail/callback`;
  } else {
    const finalProtocol = protocol || 'https';
    redirectUri = `${finalProtocol}://${actualHost}/api/auth/gmail/callback`;
  }
  
  return NextResponse.json({
    host,
    forwardedHost,
    protocol,
    actualHost,
    redirectUri,
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}