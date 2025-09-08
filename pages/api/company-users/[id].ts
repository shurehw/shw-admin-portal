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
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  switch (method) {
    case 'GET':
      return handleGet(req, res, session, id);
    case 'PUT':
      return handlePut(req, res, session, id);
    case 'DELETE':
      return handleDelete(req, res, session, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, session: any, id: string) {
  try {
    const customerId = session.user.customerId || session.user.id;

    const user = await prisma.companyUser.findFirst({
      where: {
        id,
        customerId
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
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, session: any, id: string) {
  try {
    const customerId = session.user.customerId || session.user.id;
    
    const currentUser = await prisma.companyUser.findFirst({
      where: {
        email: session.user.email,
        customerId
      }
    });

    if (!currentUser?.canManageUsers) {
      return res.status(403).json({ error: 'You do not have permission to manage users' });
    }

    const targetUser = await prisma.companyUser.findFirst({
      where: {
        id,
        customerId
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      firstName,
      lastName,
      role,
      department,
      spendingLimit,
      canCreateOrders,
      canApproveOrders,
      canViewPricing,
      canManageUsers,
      password
    } = req.body;

    const updateData: any = {
      firstName,
      lastName,
      role,
      department,
      spendingLimit: spendingLimit ? parseFloat(spendingLimit) : null,
      canCreateOrders,
      canApproveOrders,
      canViewPricing,
      canManageUsers
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.companyUser.update({
      where: { id },
      data: updateData,
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
      }
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, session: any, id: string) {
  try {
    const customerId = session.user.customerId || session.user.id;
    
    const currentUser = await prisma.companyUser.findFirst({
      where: {
        email: session.user.email,
        customerId
      }
    });

    if (!currentUser?.canManageUsers) {
      return res.status(403).json({ error: 'You do not have permission to manage users' });
    }

    const targetUser = await prisma.companyUser.findFirst({
      where: {
        id,
        customerId
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'admin' && targetUser.id === currentUser.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    await prisma.companyUser.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}