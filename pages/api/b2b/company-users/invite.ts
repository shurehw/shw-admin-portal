import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import bundleB2B from '@/lib/bundleb2b';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const companyId = session.user.companyId || session.user.bigcommerceId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }

    // Check if current user can manage users
    if (!session.user.canManageUsers && session.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to invite users' });
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

    const inviteData = {
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

    // BigCommerce B2B Bundle handles sending the invitation email
    const result = await bundleB2B.inviteCompanyUser(companyId.toString(), inviteData);
    
    // The B2B Bundle API should handle the email sending
    return res.status(201).json({ 
      user: {
        id: result.id || Date.now().toString(),
        email: inviteData.email,
        firstName: inviteData.firstName,
        lastName: inviteData.lastName,
        role: inviteData.role
      },
      message: 'Invitation sent successfully. The user will receive an email with instructions to set up their account.'
    });
  } catch (error: any) {
    console.error('Error inviting user:', error);
    
    // If the BigCommerce API isn't available, provide a fallback response
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(201).json({
        user: {
          id: Date.now().toString(),
          email: req.body.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          role: req.body.role
        },
        message: 'Demo mode: In production, BigCommerce B2B Bundle will send an invitation email to the user.',
        demo: true
      });
    }
    
    // If it's a specific API error, pass it through
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to invite user' });
  }
}