import { NextApiRequest, NextApiResponse } from 'next';
import bundleB2B from '@/lib/bundleb2b';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const results = {
    email,
    bundleB2B: { attempted: false, success: false, error: null as any },
    localDB: { attempted: false, success: false, error: null as any },
    recommendations: [] as string[]
  };

  // Test 1: Try Bundle B2B authentication
  try {
    results.bundleB2B.attempted = true;
    console.log('Testing Bundle B2B auth for:', email);
    
    const authResult = await bundleB2B.authenticateUser(email, password);
    
    if (authResult && authResult.user) {
      results.bundleB2B.success = true;
      results.bundleB2B.error = null;
      results.recommendations.push('Bundle B2B authentication works! Use this account to login.');
    } else {
      results.bundleB2B.error = 'No user returned from Bundle B2B';
      results.recommendations.push('User not found in Bundle B2B. May need to register with BigCommerce first.');
    }
  } catch (error: any) {
    results.bundleB2B.error = error?.response?.data || error?.message || 'Unknown error';
    console.error('Bundle B2B error:', results.bundleB2B.error);
    
    if (error?.response?.status === 401) {
      results.recommendations.push('Invalid credentials for Bundle B2B. Check password.');
    } else if (error?.response?.status === 404) {
      results.recommendations.push('User not found in Bundle B2B. Register through BigCommerce.');
    } else {
      results.recommendations.push('Bundle B2B connection issue. Check API token and store hash.');
    }
  }

  // Test 2: Try local database
  try {
    results.localDB.attempted = true;
    const customer = await prisma.b2BCustomer.findUnique({
      where: { email }
    });

    if (customer) {
      const isValid = await bcrypt.compare(password, customer.password);
      results.localDB.success = isValid;
      if (isValid) {
        results.recommendations.push('Local database authentication works! This is a fallback account.');
      } else {
        results.localDB.error = 'Invalid password';
        results.recommendations.push('Account exists locally but password is incorrect.');
      }
    } else {
      // Try company user table
      const companyUser = await prisma.companyUser.findUnique({
        where: { email }
      });
      
      if (companyUser) {
        const isValid = await bcrypt.compare(password, companyUser.password);
        results.localDB.success = isValid;
        if (isValid) {
          results.recommendations.push('Company user account works locally!');
        } else {
          results.localDB.error = 'Invalid password for company user';
        }
      } else {
        results.localDB.error = 'User not found in local database';
        results.recommendations.push('No local account exists. Create one or register with BigCommerce.');
      }
    }
  } catch (error: any) {
    results.localDB.error = error?.message || 'Database error';
    results.recommendations.push('Local database connection issue.');
  }

  // Add general recommendations
  if (!results.bundleB2B.success && !results.localDB.success) {
    results.recommendations.push('Try resetting your password using the Forgot Password link.');
    results.recommendations.push('Or create a new account through the registration page.');
  }

  return res.status(200).json(results);
}