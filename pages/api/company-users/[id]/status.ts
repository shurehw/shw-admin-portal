import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const { isActive } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'Invalid status value' });
  }

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

    if (targetUser.id === currentUser.id && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updatedUser = await prisma.companyUser.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
}