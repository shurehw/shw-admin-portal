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
    const customerId = session.user.customerId || session.user.id;
    
    // Get quotes from BigCommerce B2B Bundle
    const quotes = await bundleB2B.getQuotes?.(customerId) || [];
    
    return res.status(200).json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    
    // Return mock data for development
    const mockQuotes = [
      {
        id: '1',
        quoteNumber: 'Q-2024-001',
        status: 'pending',
        items: [
          { productId: 1, name: 'Product 1', quantity: 10, price: 99.99 }
        ],
        subtotal: 999.90,
        tax: 99.99,
        shipping: 25.00,
        total: 1124.89,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
    
    return res.status(200).json(mockQuotes);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;
    const companyId = session.user.companyId;
    
    const quoteData = {
      customerId,
      companyId,
      items: req.body.items,
      notes: req.body.notes,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress,
      validDays: req.body.validDays || 30
    };
    
    // Create quote through BigCommerce B2B Bundle
    const newQuote = await bundleB2B.createQuote(quoteData);
    
    return res.status(201).json(newQuote);
  } catch (error: any) {
    console.error('Error creating quote:', error);
    
    // If BigCommerce API fails, return a mock response for development
    if (process.env.NODE_ENV !== 'production') {
      const mockQuote = {
        id: Date.now().toString(),
        quoteNumber: `Q-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        status: 'pending',
        items: req.body.items,
        subtotal: req.body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        tax: 0,
        shipping: 0,
        total: req.body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: req.body.notes,
        createdAt: new Date().toISOString()
      };
      
      return res.status(201).json(mockQuote);
    }
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to create quote' });
  }
}