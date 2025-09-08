import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check environment variables
  const config = {
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      BIGCOMMERCE_B2B_TOKEN: process.env.BIGCOMMERCE_B2B_TOKEN ? 'SET' : 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET'
    },
    test: {
      message: 'Auth endpoint is reachable',
      timestamp: new Date().toISOString()
    }
  };

  // Test database connection
  let dbTest = 'Not tested';
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const customerCount = await prisma.b2BCustomer.count();
    const companyUserCount = await prisma.companyUser.count();
    dbTest = `Connected: ${customerCount} customers, ${companyUserCount} company users`;
    await prisma.$disconnect();
  } catch (error: any) {
    dbTest = `Error: ${error.message}`;
  }

  config.test['database'] = dbTest;

  return res.status(200).json(config);
}