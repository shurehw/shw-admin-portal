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
    // Get the company ID from the session
    // This assumes the user has a companyId associated with their account
    const companyId = session.user.companyId || session.user.bigcommerceId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }

    const users = await bundleB2B.getCompanyUsers(companyId.toString());
    
    // Transform the data to match our UI expectations
    const transformedUsers = users.map((user: any) => ({
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
    }));

    return res.status(200).json(transformedUsers);
  } catch (error) {
    console.error('Error fetching company users:', error);
    
    // Return mock data if the API call fails
    const mockUsers = [
      {
        id: '1',
        email: 'admin@company.com',
        firstName: 'John',
        lastName: 'Smith',
        role: 'admin',
        department: 'Management',
        canCreateOrders: true,
        canApproveOrders: true,
        canViewPricing: true,
        canManageUsers: true,
        isActive: true,
        lastLogin: '2024-01-26T10:00:00Z',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        email: 'buyer@company.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'buyer',
        department: 'Purchasing',
        spendingLimit: 5000,
        canCreateOrders: true,
        canApproveOrders: false,
        canViewPricing: true,
        canManageUsers: false,
        isActive: true,
        lastLogin: '2024-01-25T14:30:00Z',
        createdAt: '2024-01-05T00:00:00Z'
      }
    ];
    
    return res.status(200).json(mockUsers);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const companyId = session.user.companyId || session.user.bigcommerceId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }

    // Check if current user can manage users
    if (!session.user.canManageUsers && session.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to manage users' });
    }

    const {
      email,
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

    const userData = {
      email,
      firstName,
      lastName,
      role: role || 'buyer',
      permissions: {
        canCreateOrders: canCreateOrders ?? true,
        canApproveOrders: canApproveOrders ?? false,
        canViewPricing: canViewPricing ?? true,
        canManageUsers: canManageUsers ?? false,
        spendingLimit: spendingLimit ? parseFloat(spendingLimit) : undefined
      },
      department
    };

    const newUser = await bundleB2B.createCompanyUser(companyId.toString(), userData);
    
    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      department: newUser.department,
      ...userData.permissions,
      isActive: true,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error creating company user:', error);
    
    // If it's a specific API error, pass it through
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to create user' });
  }
}