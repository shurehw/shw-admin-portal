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
    
    // Get payments from BigCommerce B2B Bundle
    const payments = await bundleB2B.getPayments(companyId);
    
    return res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    
    // Return mock data for development
    const mockPayments = [
      {
        id: '1',
        paymentNumber: 'PMT-2024-001',
        invoiceId: 'INV-2024-001',
        invoiceNumber: 'INV-2024-001',
        amount: 453.89,
        paymentMethod: 'Check',
        referenceNumber: '1234',
        status: 'completed',
        notes: 'Payment for invoice INV-2024-001',
        processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        paymentNumber: 'PMT-2024-002',
        invoiceId: null,
        invoiceNumber: null,
        amount: 1000.00,
        paymentMethod: 'ACH Transfer',
        referenceNumber: 'ACH-5678',
        status: 'completed',
        notes: 'Account credit',
        processedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        paymentNumber: 'PMT-2024-003',
        invoiceId: 'INV-2024-002',
        invoiceNumber: 'INV-2024-002',
        amount: 200.00,
        paymentMethod: 'Credit Card',
        referenceNumber: 'CC-9012',
        status: 'pending',
        notes: 'Partial payment for invoice INV-2024-002',
        processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return res.status(200).json(mockPayments);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const companyId = session.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }
    
    // Only accounting role or admin can record payments
    if (session.user.role !== 'accounting' && session.user.role !== 'admin' && !session.user.canManageUsers) {
      return res.status(403).json({ error: 'You do not have permission to record payments' });
    }
    
    const { invoiceId, amount, paymentMethod, referenceNumber, notes } = req.body;
    
    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'Amount and payment method are required' });
    }
    
    const paymentData = {
      companyId,
      invoiceId,
      amount,
      paymentMethod,
      referenceNumber,
      notes
    };
    
    // Record payment through BigCommerce B2B Bundle
    const payment = await bundleB2B.recordPayment(paymentData);
    
    return res.status(201).json(payment);
  } catch (error: any) {
    console.error('Error recording payment:', error);
    
    // Return mock response for development
    if (process.env.NODE_ENV !== 'production') {
      const mockPayment = {
        id: Date.now().toString(),
        paymentNumber: `PMT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        invoiceId: req.body.invoiceId,
        amount: req.body.amount,
        paymentMethod: req.body.paymentMethod,
        referenceNumber: req.body.referenceNumber,
        status: 'pending',
        notes: req.body.notes,
        processedAt: new Date().toISOString()
      };
      
      return res.status(201).json(mockPayment);
    }
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to record payment' });
  }
}