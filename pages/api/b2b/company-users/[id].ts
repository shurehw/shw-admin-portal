import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import bundleB2B from '@/lib/bundleb2b';

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

  const companyId = session.user.companyId || session.user.bigcommerceId;
  
  if (!companyId) {
    return res.status(400).json({ error: 'No company ID found for user' });
  }

  switch (method) {
    case 'GET':
      return handleGet(req, res, companyId.toString(), id);
    case 'PUT':
      return handlePut(req, res, session, companyId.toString(), id);
    case 'DELETE':
      return handleDelete(req, res, session, companyId.toString(), id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, companyId: string, userId: string) {
  try {
    const user = await bundleB2B.getCompanyUser(companyId, userId);
    
    const transformedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || user.first_name,
      lastName: user.lastName || user.last_name,
      role: user.role || 'buyer',
      department: user.department,
      spendingLimit: user.permissions?.spendingLimit,
      canCreateOrders: user.permissions?.canCreateOrders ?? true,
      canApproveOrders: user.permissions?.canApproveOrders ?? false,
      canViewPricing: user.permissions?.canViewPricing ?? true,
      canManageUsers: user.permissions?.canManageUsers ?? false,
      isActive: user.status === 'active',
      lastLogin: user.lastLogin || user.last_login,
      createdAt: user.createdAt || user.created_at
    };

    return res.status(200).json(transformedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, session: any, companyId: string, userId: string) {
  try {
    // Check if current user can manage users
    if (!session.user.canManageUsers && session.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to manage users' });
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
      isActive
    } = req.body;

    const updateData: any = {
      firstName,
      lastName,
      role,
      department,
      status: isActive !== undefined ? (isActive ? 'active' : 'inactive') : undefined,
      permissions: {
        canCreateOrders,
        canApproveOrders,
        canViewPricing,
        canManageUsers,
        spendingLimit: spendingLimit ? parseFloat(spendingLimit) : undefined
      }
    };

    const updatedUser = await bundleB2B.updateCompanyUser(companyId, userId, updateData);

    return res.status(200).json({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      department: updatedUser.department,
      ...updateData.permissions,
      isActive: updatedUser.status === 'active',
      lastLogin: updatedUser.lastLogin,
      createdAt: updatedUser.createdAt
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, session: any, companyId: string, userId: string) {
  try {
    // Check if current user can manage users
    if (!session.user.canManageUsers && session.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to manage users' });
    }

    // Don't allow users to delete themselves
    if (userId === session.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await bundleB2B.deleteCompanyUser(companyId, userId);

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}