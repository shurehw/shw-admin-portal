import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res, session);
    case 'POST':
      return handlePost(req, res, session);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;

    const users = await prisma.companyUser.findMany({
      where: {
        customerId: customerId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        spendingLimit: true,
        canCreateOrders: true,
        canApproveOrders: true,
        canViewPricing: true,
        canManageUsers: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching company users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;
    
    const currentUser = await prisma.companyUser.findFirst({
      where: {
        email: session.user.email,
        customerId: customerId
      }
    });

    if (!currentUser?.canManageUsers) {
      return res.status(403).json({ error: 'You do not have permission to manage users' });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      department,
      spendingLimit,
      canCreateOrders,
      canApproveOrders,
      canViewPricing,
      canManageUsers
    } = req.body;

    const existingUser = await prisma.companyUser.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.companyUser.create({
      data: {
        customerId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'buyer',
        department,
        spendingLimit: spendingLimit ? parseFloat(spendingLimit) : null,
        canCreateOrders: canCreateOrders ?? true,
        canApproveOrders: canApproveOrders ?? false,
        canViewPricing: canViewPricing ?? true,
        canManageUsers: canManageUsers ?? false,
        isActive: true
      }
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating company user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
}