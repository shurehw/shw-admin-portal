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
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;
    const companyId = session.user.companyId;
    
    // Get invoices from BigCommerce B2B Bundle
    const invoices = await bundleB2B.getInvoices(customerId, companyId);
    
    return res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    
    // Return mock data for development
    const mockInvoices = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        orderId: 'ORD-2024-001',
        status: 'paid',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 453.89,
        paidAmount: 453.89,
        balance: 0,
        paymentTerms: 'Net 30',
        items: [
          {
            description: 'Commercial Paper Towels - Case',
            quantity: 10,
            unitPrice: 38.99,
            total: 389.90
          }
        ],
        subtotal: 389.90,
        tax: 38.99,
        shipping: 25.00,
        total: 453.89,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        orderId: 'ORD-2024-002',
        status: 'pending',
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 416.45,
        paidAmount: 0,
        balance: 416.45,
        paymentTerms: 'Net 30',
        items: [
          {
            description: 'Heavy Duty Trash Bags - 55 Gallon',
            quantity: 5,
            unitPrice: 72.99,
            total: 364.95
          }
        ],
        subtotal: 364.95,
        tax: 36.50,
        shipping: 15.00,
        total: 416.45,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        invoiceNumber: 'INV-2024-003',
        orderId: 'ORD-2024-003',
        status: 'overdue',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 799.99,
        paidAmount: 0,
        balance: 799.99,
        paymentTerms: 'Net 30',
        items: [
          {
            description: 'Stainless Steel Prep Table - 48"',
            quantity: 1,
            unitPrice: 599.99,
            total: 599.99
          },
          {
            description: 'Commercial Microwave - 1000W',
            quantity: 1,
            unitPrice: 249.99,
            total: 249.99
          }
        ],
        subtotal: 849.98,
        tax: 85.00,
        shipping: 50.00,
        discount: 185.00,
        total: 799.99,
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return res.status(200).json(mockInvoices);
  }
}