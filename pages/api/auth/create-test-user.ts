import { NextApiRequest, NextApiResponse } from 'next';
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

  try {
    // Create a test user in the local database
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    const testUser = await prisma.b2BCustomer.create({
      data: {
        email: 'test@shureprint.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Shureprint Test Company',
        phone: '555-0100',
        creditLimit: 10000,
        paymentTerms: 'NET30',
        isApproved: true
      }
    });

    await prisma.$disconnect();

    return res.status(200).json({
      message: 'Test user created successfully',
      credentials: {
        email: 'test@shureprint.com',
        password: 'testpass123'
      },
      user: {
        id: testUser.id,
        email: testUser.email,
        name: `${testUser.firstName} ${testUser.lastName}`,
        company: testUser.companyName
      }
    });
  } catch (error: any) {
    console.error('Error creating test user:', error);
    
    // If user already exists, just return the credentials
    if (error.code === 'P2002') {
      return res.status(200).json({
        message: 'Test user already exists',
        credentials: {
          email: 'test@shureprint.com',
          password: 'testpass123'
        }
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create test user',
      details: error.message 
    });
  }
}