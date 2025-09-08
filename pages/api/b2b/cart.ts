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
    case 'PUT':
      return handlePut(req, res, session);
    case 'DELETE':
      return handleDelete(req, res, session);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;
    
    // Get cart from BigCommerce B2B Bundle
    const cart = await bundleB2B.getCart(customerId);
    
    return res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    
    // Return empty cart for development
    return res.status(200).json({
      id: session.user.id,
      customerId: session.user.customerId,
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items array' });
    }
    
    // Add items to cart through BigCommerce B2B Bundle
    const updatedCart = await bundleB2B.addToCart(customerId, items);
    
    return res.status(200).json(updatedCart);
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    
    // If BigCommerce API fails, return a mock response for development
    if (process.env.NODE_ENV !== 'production') {
      const mockCart = {
        id: session.user.id,
        customerId: session.user.customerId,
        items: req.body.items,
        subtotal: req.body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
        tax: 0,
        shipping: 0,
        total: req.body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      };
      
      return res.status(200).json(mockCart);
    }
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to add items to cart' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;
    const { itemId, quantity } = req.body;
    
    if (!itemId || quantity === undefined) {
      return res.status(400).json({ error: 'Item ID and quantity are required' });
    }
    
    // Update cart item through BigCommerce B2B Bundle
    const updatedCart = await bundleB2B.updateCartItem?.(customerId, itemId, quantity);
    
    return res.status(200).json(updatedCart);
  } catch (error: any) {
    console.error('Error updating cart:', error);
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to update cart' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const customerId = session.user.customerId || session.user.id;
    const { itemId } = req.query;
    
    if (itemId) {
      // Remove specific item from cart
      await bundleB2B.removeFromCart?.(customerId, itemId as string);
    } else {
      // Clear entire cart
      await bundleB2B.clearCart?.(customerId);
    }
    
    return res.status(200).json({ message: 'Cart updated successfully' });
  } catch (error: any) {
    console.error('Error deleting from cart:', error);
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to update cart' });
  }
}