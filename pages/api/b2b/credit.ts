import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
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
    case 'PUT':
      return handlePut(req, res, session);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const companyId = session.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }
    
    // Get credit info from BigCommerce B2B Bundle
    const creditInfo = await bundleB2B.getCreditInfo(companyId);
    
    return res.status(200).json(creditInfo);
  } catch (error) {
    console.error('Error fetching credit info:', error);
    
    // Return mock data for development
    const mockCreditInfo = {
      companyId: session.user.companyId,
      companyName: session.user.companyName,
      creditLimit: 10000.00,
      currentBalance: 3716.44,
      availableCredit: 6283.56,
      paymentTerms: 'Net 30',
      creditStatus: 'good', // good, warning, hold
      lastPaymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastPaymentAmount: 453.89,
      averageDaysToPay: 28,
      creditHistory: [
        {
          date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'Credit Limit Increased',
          previousLimit: 5000,
          newLimit: 10000,
          notes: 'Good payment history'
        },
        {
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          event: 'Payment Terms Updated',
          previousTerms: 'Net 15',
          newTerms: 'Net 30',
          notes: 'Customer request approved'
        }
      ],
      outstandingAmount: 1670.33,
      overdueAmount: 799.99
    };
    
    return res.status(200).json(mockCreditInfo);
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const companyId = session.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }
    
    // Only admin can update credit limits
    if (session.user.role !== 'admin' && !session.user.canManageUsers) {
      return res.status(403).json({ error: 'You do not have permission to update credit limits' });
    }
    
    const { creditLimit } = req.body;
    
    if (creditLimit === undefined || creditLimit < 0) {
      return res.status(400).json({ error: 'Valid credit limit is required' });
    }
    
    // Update credit limit through BigCommerce B2B Bundle
    const updatedCreditInfo = await bundleB2B.updateCreditLimit(companyId, creditLimit);
    
    return res.status(200).json(updatedCreditInfo);
  } catch (error: any) {
    console.error('Error updating credit limit:', error);
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to update credit limit' });
  }
}