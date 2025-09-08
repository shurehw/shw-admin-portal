import type { NextApiRequest, NextApiResponse } from 'next';
import bundleB2B from '@/lib/bundleb2b';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = registerSchema.parse(req.body);
    
    // Register the company with BigCommerce B2B Bundle
    const companyData = {
      name: data.companyName,
      email: data.email,
      taxId: data.taxId,
      primaryContact: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password
      },
      address: {
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || 'US'
      }
    };

    try {
      const result = await bundleB2B.registerCompany(companyData);
      
      return res.status(201).json({
        message: 'Registration successful. BigCommerce will send you a confirmation email.',
        company: {
          id: result.company.id,
          name: result.company.name,
          status: result.company.status
        }
      });
    } catch (bcError: any) {
      // If BigCommerce API fails, provide fallback for development
      if (process.env.NODE_ENV !== 'production') {
        const { PrismaClient } = await import('@prisma/client');
        const bcrypt = await import('bcryptjs');
        const prisma = new PrismaClient();
        
        const existingCustomer = await prisma.b2BCustomer.findUnique({
          where: { email: data.email }
        });

        if (existingCustomer) {
          return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const customer = await prisma.b2BCustomer.create({
          data: {
            ...data,
            password: hashedPassword,
            isApproved: true, // Auto-approve in development
          }
        });

        const { password: _, ...customerWithoutPassword } = customer;

        return res.status(201).json({
          message: 'Registration successful (Development Mode). You can now log in.',
          customer: customerWithoutPassword,
          development: true
        });
      }
      
      // In production, return the BigCommerce error
      if (bcError.response?.data?.message) {
        return res.status(bcError.response.status || 400).json({ 
          error: bcError.response.data.message 
        });
      }
      
      throw bcError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}