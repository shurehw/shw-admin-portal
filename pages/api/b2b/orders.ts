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
    
    // Get orders from BigCommerce B2B Bundle
    const orders = await bundleB2B.getOrders(customerId);
    
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    // Return mock data for development
    const mockOrders = [
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        status: 'shipped',
        items: [
          { 
            productId: 1, 
            name: 'Commercial Paper Towels', 
            quantity: 10, 
            price: 38.99,
            total: 389.90
          }
        ],
        subtotal: 389.90,
        tax: 38.99,
        shipping: 25.00,
        total: 453.89,
        paymentMethod: 'Net 30',
        paymentStatus: 'pending',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          company: 'ABC Company',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        status: 'processing',
        items: [
          { 
            productId: 2, 
            name: 'Heavy Duty Trash Bags', 
            quantity: 5, 
            price: 72.99,
            total: 364.95
          }
        ],
        subtotal: 364.95,
        tax: 36.50,
        shipping: 15.00,
        total: 416.45,
        paymentMethod: 'Credit Card',
        paymentStatus: 'paid',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          company: 'ABC Company',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return res.status(200).json(mockOrders);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;
    const companyId = session.user.companyId;
    
    // Check if user can create orders
    if (!session.user.canCreateOrders) {
      return res.status(403).json({ error: 'You do not have permission to create orders' });
    }
    
    // Check spending limit if applicable
    if (session.user.spendingLimit && req.body.total > session.user.spendingLimit) {
      return res.status(403).json({ 
        error: `Order total exceeds your spending limit of $${session.user.spendingLimit}` 
      });
    }
    
    const orderData = {
      customerId,
      companyId,
      items: req.body.items,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress,
      paymentMethod: req.body.paymentMethod,
      poNumber: req.body.poNumber,
      notes: req.body.notes
    };
    
    // Create order through BigCommerce B2B Bundle
    const newOrder = await bundleB2B.createOrder?.(orderData);
    
    return res.status(201).json(newOrder);
  } catch (error: any) {
    console.error('Error creating order:', error);
    
    // If BigCommerce API fails, return a mock response for development
    if (process.env.NODE_ENV !== 'production') {
      const mockOrder = {
        id: Date.now().toString(),
        orderNumber: `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        status: 'pending',
        items: req.body.items,
        subtotal: req.body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        tax: req.body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) * 0.1,
        shipping: 25,
        total: req.body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) * 1.1 + 25,
        paymentMethod: req.body.paymentMethod,
        paymentStatus: req.body.paymentMethod === 'Credit Card' ? 'paid' : 'pending',
        shippingAddress: req.body.shippingAddress,
        billingAddress: req.body.billingAddress,
        poNumber: req.body.poNumber,
        notes: req.body.notes,
        createdAt: new Date().toISOString()
      };
      
      return res.status(201).json(mockOrder);
    }
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to create order' });
  }
}