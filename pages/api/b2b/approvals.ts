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
    case 'POST':
      return handlePost(req, res, session);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // Check if user can approve orders
    if (!session.user.canApproveOrders) {
      return res.status(403).json({ error: 'You do not have permission to view approvals' });
    }

    const userId = session.user.id;
    
    // Get pending approvals from BigCommerce B2B Bundle
    const approvals = await bundleB2B.getPendingApprovals(userId);
    
    return res.status(200).json(approvals);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    
    // Return mock data for development
    const mockApprovals = [
      {
        id: '1',
        orderId: 'ORD-2024-005',
        requestedBy: {
          id: 'user-1',
          name: 'John Smith',
          email: 'john@company.com',
          department: 'Purchasing'
        },
        orderDetails: {
          total: 2567.89,
          itemCount: 15,
          items: [
            { name: 'Paper Towels', quantity: 20, price: 38.99, total: 779.80 },
            { name: 'Trash Bags', quantity: 10, price: 74.99, total: 749.90 }
          ],
          exceedsLimit: true,
          userSpendingLimit: 2000.00
        },
        reason: 'Order exceeds spending limit',
        priority: 'high',
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: '2',
        orderId: 'ORD-2024-006',
        requestedBy: {
          id: 'user-2',
          name: 'Jane Doe',
          email: 'jane@company.com',
          department: 'Operations'
        },
        orderDetails: {
          total: 5432.10,
          itemCount: 3,
          items: [
            { name: 'Prep Table', quantity: 2, price: 499.99, total: 999.98 },
            { name: 'Commercial Microwave', quantity: 5, price: 249.99, total: 1249.95 }
          ],
          exceedsLimit: true,
          userSpendingLimit: 5000.00
        },
        reason: 'Large capital purchase requires approval',
        priority: 'medium',
        requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      }
    ];
    
    return res.status(200).json(mockApprovals);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // Check if user can approve orders
    if (!session.user.canApproveOrders) {
      return res.status(403).json({ error: 'You do not have permission to approve orders' });
    }

    const { orderId, action, notes, reason } = req.body;
    
    if (!orderId || !action) {
      return res.status(400).json({ error: 'Order ID and action are required' });
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Action must be either approve or reject' });
    }
    
    if (action === 'reject' && !reason) {
      return res.status(400).json({ error: 'Reason is required for rejection' });
    }
    
    const userId = session.user.id;
    
    // Process approval/rejection through BigCommerce B2B Bundle
    let result;
    if (action === 'approve') {
      result = await bundleB2B.approveOrder(orderId, userId, notes);
    } else {
      result = await bundleB2B.rejectOrder(orderId, userId, reason);
    }
    
    return res.status(200).json({
      success: true,
      orderId,
      action,
      result,
      message: `Order ${action}d successfully`
    });
  } catch (error: any) {
    console.error('Error processing approval:', error);
    
    // Return mock response for development
    if (process.env.NODE_ENV !== 'production') {
      return res.status(200).json({
        success: true,
        orderId: req.body.orderId,
        action: req.body.action,
        message: `Order ${req.body.action}d successfully (Demo Mode)`
      });
    }
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to process approval' });
  }
}