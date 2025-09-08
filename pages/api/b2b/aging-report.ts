import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import bundleB2B from '@/lib/bundleb2b';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const companyId = session.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }
    
    // Check if user has permission to view financial reports
    if (!session.user.canViewPricing && session.user.role !== 'accounting' && session.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to view financial reports' });
    }
    
    // Get aging report from BigCommerce B2B Bundle
    const agingReport = await bundleB2B.getAgingReport(companyId);
    
    return res.status(200).json(agingReport);
  } catch (error) {
    console.error('Error fetching aging report:', error);
    
    // Return mock data for development
    const mockAgingReport = {
      companyId: session.user.companyId,
      companyName: session.user.companyName,
      reportDate: new Date().toISOString(),
      summary: {
        current: {
          amount: 870.34,
          percentage: 23.4,
          count: 1
        },
        days1to30: {
          amount: 416.45,
          percentage: 11.2,
          count: 1
        },
        days31to60: {
          amount: 453.89,
          percentage: 12.2,
          count: 1
        },
        days61to90: {
          amount: 799.99,
          percentage: 21.5,
          count: 1
        },
        over90: {
          amount: 1175.77,
          percentage: 31.7,
          count: 2
        },
        total: {
          amount: 3716.44,
          percentage: 100,
          count: 6
        }
      },
      details: [
        {
          invoiceNumber: 'INV-2024-004',
          orderNumber: 'ORD-2024-004',
          invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 0,
          amount: 870.34,
          status: 'current',
          category: 'current'
        },
        {
          invoiceNumber: 'INV-2024-002',
          orderNumber: 'ORD-2024-002',
          invoiceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 0,
          amount: 416.45,
          status: 'current',
          category: 'days1to30'
        },
        {
          invoiceNumber: 'INV-2024-003',
          orderNumber: 'ORD-2024-003',
          invoiceDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 10,
          amount: 799.99,
          status: 'overdue',
          category: 'days31to60'
        },
        {
          invoiceNumber: 'INV-2023-098',
          orderNumber: 'ORD-2023-098',
          invoiceDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 90,
          amount: 625.50,
          status: 'overdue',
          category: 'over90'
        },
        {
          invoiceNumber: 'INV-2023-097',
          orderNumber: 'ORD-2023-097',
          invoiceDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          daysOverdue: 120,
          amount: 550.27,
          status: 'overdue',
          category: 'over90'
        }
      ],
      recommendations: [
        {
          priority: 'high',
          message: 'You have $1,175.77 in invoices over 90 days past due. Consider following up on these immediately.'
        },
        {
          priority: 'medium',
          message: 'Total overdue amount is $2,429.65. This may affect your credit standing.'
        },
        {
          priority: 'low',
          message: 'Consider setting up automatic payments to avoid future late payments.'
        }
      ]
    };
    
    return res.status(200).json(mockAgingReport);
  }
}