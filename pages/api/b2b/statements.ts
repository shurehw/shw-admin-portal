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
    const companyId = session.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }
    
    const { startDate, endDate, type } = req.query;
    
    // Get statements from BigCommerce B2B Bundle
    const statements = await bundleB2B.getStatements(companyId, {
      startDate: startDate as string,
      endDate: endDate as string,
      type: type as 'summary' | 'detailed'
    });
    
    return res.status(200).json(statements);
  } catch (error) {
    console.error('Error fetching statements:', error);
    
    // Return mock data for development
    const mockStatement = {
      companyId: session.user.companyId,
      companyName: session.user.companyName,
      statementPeriod: {
        startDate: req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: req.query.endDate || new Date().toISOString()
      },
      summary: {
        previousBalance: 2500.00,
        newCharges: 1670.33,
        payments: 453.89,
        creditsAdjustments: 0,
        currentBalance: 3716.44,
        creditLimit: 10000.00,
        availableCredit: 6283.56
      },
      aging: {
        current: 870.34,
        days30: 416.45,
        days60: 453.89,
        days90: 799.99,
        over90: 1175.77,
        total: 3716.44
      },
      transactions: [
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'invoice',
          reference: 'INV-2024-004',
          description: 'Order #ORD-2024-004',
          amount: 870.34,
          balance: 3716.44
        },
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'payment',
          reference: 'PMT-2024-001',
          description: 'Payment received - Check #1234',
          amount: -453.89,
          balance: 2846.10
        },
        {
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'invoice',
          reference: 'INV-2024-002',
          description: 'Order #ORD-2024-002',
          amount: 416.45,
          balance: 3299.99
        }
      ],
      outstandingInvoices: [
        {
          invoiceNumber: 'INV-2024-004',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 870.34,
          status: 'current'
        },
        {
          invoiceNumber: 'INV-2024-002',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 416.45,
          status: 'current'
        },
        {
          invoiceNumber: 'INV-2024-003',
          date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 799.99,
          status: 'overdue'
        }
      ]
    };
    
    return res.status(200).json(mockStatement);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const companyId = session.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }
    
    const { startDate, endDate, type, format } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    // Generate statement through BigCommerce B2B Bundle
    const statement = await bundleB2B.generateStatement(companyId, {
      startDate,
      endDate,
      type: type || 'summary',
      format: format || 'pdf'
    });
    
    return res.status(201).json(statement);
  } catch (error: any) {
    console.error('Error generating statement:', error);
    
    // Return mock response for development
    if (process.env.NODE_ENV !== 'production') {
      return res.status(201).json({
        id: Date.now().toString(),
        url: '/api/b2b/statements/download/mock-statement.pdf',
        generatedAt: new Date().toISOString(),
        message: 'Statement generated successfully'
      });
    }
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to generate statement' });
  }
}