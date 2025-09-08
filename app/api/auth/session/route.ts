import { NextResponse } from 'next/server';

export async function GET() {
  // Return mock session data
  // In production, this would check actual authentication
  return NextResponse.json({
    user: {
      email: 'admin@shurehw.com',
      name: 'Admin User',
      role: 'admin',
      isAdmin: true
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
}