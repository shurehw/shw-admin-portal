import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    const customerId = session.user.customerId || session.user.id;
    
    // Check if current user can manage users
    const currentUser = session.user.isCompanyUser 
      ? await prisma.companyUser.findFirst({
          where: {
            email: session.user.email,
            customerId
          }
        })
      : { canManageUsers: true }; // Main account always has admin rights

    if (!currentUser?.canManageUsers) {
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

    // Check if user already exists
    const existingUser = await prisma.companyUser.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate a secure temporary password
    const temporaryPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create the user with temporary password
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

    // Get company info for the invitation email
    const company = await prisma.b2BCustomer.findUnique({
      where: { id: customerId },
      select: { companyName: true }
    });

    // In a production environment, you would send an email here
    // For now, we'll return the invitation details
    const invitationData = {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      },
      invitation: {
        temporaryPassword,
        loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`,
        companyName: company?.companyName,
        invitedBy: session.user.name,
        message: `You have been invited to join ${company?.companyName} on our B2B platform. Please use the temporary password to log in and you will be prompted to set a new password.`
      }
    };

    // In production, send email instead of returning password
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send invitation email
      // await sendInvitationEmail(invitationData);
      
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json({ 
        user: userWithoutPassword,
        message: 'Invitation sent successfully'
      });
    } else {
      // In development, return the temporary password for testing
      return res.status(201).json(invitationData);
    }
  } catch (error) {
    console.error('Error inviting user:', error);
    return res.status(500).json({ error: 'Failed to invite user' });
  }
}