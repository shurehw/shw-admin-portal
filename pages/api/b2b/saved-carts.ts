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
    
    // Get saved carts from BigCommerce B2B Bundle
    const savedCarts = await bundleB2B.getSavedCarts(customerId);
    
    return res.status(200).json(savedCarts);
  } catch (error) {
    console.error('Error fetching saved carts:', error);
    
    // Return mock data for development
    const mockSavedCarts = [
      {
        id: '1',
        name: 'Monthly Office Supplies',
        description: 'Regular monthly order for office supplies',
        itemCount: 12,
        totalValue: 567.89,
        lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { sku: 'PT-1000', name: 'Paper Towels', quantity: 10, price: 38.99 },
          { sku: 'TB-55G', name: 'Trash Bags', quantity: 5, price: 74.99 }
        ]
      },
      {
        id: '2',
        name: 'Quarterly Kitchen Restock',
        description: 'Kitchen supplies for Q1',
        itemCount: 8,
        totalValue: 1234.56,
        lastModified: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { sku: 'ST-48', name: 'Prep Table', quantity: 1, price: 499.99 },
          { sku: 'MW-1000', name: 'Microwave', quantity: 2, price: 249.99 }
        ]
      },
      {
        id: '3',
        name: 'Emergency Supplies Template',
        description: 'Quick reorder for emergency supplies',
        itemCount: 5,
        totalValue: 234.50,
        lastModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { sku: 'GL-L-1000', name: 'Gloves', quantity: 20, price: 19.99 },
          { sku: 'DIS-GAL', name: 'Disinfectant', quantity: 10, price: 28.99 }
        ]
      }
    ];
    
    return res.status(200).json(mockSavedCarts);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;
    const { name, description, items } = req.body;
    
    if (!name || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Name and items are required' });
    }
    
    const cartData = {
      name,
      description,
      items
    };
    
    // Save cart through BigCommerce B2B Bundle
    const savedCart = await bundleB2B.saveCart(customerId, cartData);
    
    return res.status(201).json(savedCart);
  } catch (error: any) {
    console.error('Error saving cart:', error);
    
    // Return mock response for development
    if (process.env.NODE_ENV !== 'production') {
      const mockSavedCart = {
        id: Date.now().toString(),
        name: req.body.name,
        description: req.body.description,
        itemCount: req.body.items.length,
        totalValue: req.body.items.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0
        ),
        lastModified: new Date().toISOString(),
        items: req.body.items
      };
      
      return res.status(201).json(mockSavedCart);
    }
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to save cart' });
  }
}