import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check environment variables
  const envCheck = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✓ Set' : '✗ Missing',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✓ Set' : '✗ Missing',
    BIGCOMMERCE_ACCESS_TOKEN: process.env.BIGCOMMERCE_ACCESS_TOKEN ? '✓ Set' : '✗ Missing',
    NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH: process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH ? '✓ Set' : '✗ Missing',
    NODE_ENV: process.env.NODE_ENV,
  };

  // Test database connection
  let dbStatus = 'Not tested';
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    const customerCount = await prisma.b2BCustomer.count();
    const companyUserCount = await prisma.companyUser.count();
    dbStatus = `✓ Connected (${customerCount} customers, ${companyUserCount} company users)`;
    await prisma.$disconnect();
  } catch (error: any) {
    dbStatus = `✗ Error: ${error.message}`;
  }

  // Test Bundle B2B connection
  let bundleStatus = 'Not tested';
  try {
    const bundleB2B = (await import('@/lib/bundleb2b')).default;
    // Just check if the module loads
    bundleStatus = '✓ Module loaded';
  } catch (error: any) {
    bundleStatus = `✗ Error: ${error.message}`;
  }

  return res.status(200).json({
    status: 'Auth Debug Info',
    environment: envCheck,
    database: dbStatus,
    bundleB2B: bundleStatus,
    timestamp: new Date().toISOString(),
  });
}