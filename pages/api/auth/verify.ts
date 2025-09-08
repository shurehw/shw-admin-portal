import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    return res.status(200).json({
      authenticated: !!session,
      session: session || null,
      timestamp: new Date().toISOString(),
      environment: {
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    return res.status(200).json({
      authenticated: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}