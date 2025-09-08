import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if test account already exists
    const existingCustomer = await prisma.b2BCustomer.findUnique({
      where: { email: 'test@example.com' }
    });

    if (existingCustomer) {
      // Update the existing account to ensure it's approved
      await prisma.b2BCustomer.update({
        where: { email: 'test@example.com' },
        data: {
          isApproved: true,
          password: await bcrypt.hash('password123', 12)
        }
      });
      return res.status(200).json({ 
        message: 'Test account updated',
        email: 'test@example.com',
        password: 'password123'
      });
    }

    // Create new test account
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const customer = await prisma.b2BCustomer.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        phone: '555-555-5555',
        isApproved: true,
      }
    });

    return res.status(201).json({
      message: 'Test account created successfully',
      email: 'test@example.com',
      password: 'password123'
    });
  } catch (error) {
    console.error('Test account creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}