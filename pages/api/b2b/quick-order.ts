import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import bundleB2B from '@/lib/bundleb2b';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if user can create orders
    if (!session.user.canCreateOrders) {
      return res.status(403).json({ error: 'You do not have permission to create orders' });
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Validate each item has SKU and quantity
    for (const item of items) {
      if (!item.sku || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          error: `Invalid item: ${item.sku || 'missing SKU'}` 
        });
      }
    }

    // Process quick order through BigCommerce B2B Bundle
    const result = await bundleB2B.quickOrder(items);

    return res.status(200).json({
      success: true,
      cartId: result.cartId,
      items: result.items,
      summary: result.summary,
      message: 'Items added to cart successfully'
    });
  } catch (error: any) {
    console.error('Error processing quick order:', error);

    // Return mock response for development
    if (process.env.NODE_ENV !== 'production') {
      const mockResult = {
        success: true,
        cartId: Date.now().toString(),
        items: req.body.items.map((item: any) => ({
          sku: item.sku,
          quantity: item.quantity,
          name: `Product ${item.sku}`,
          price: Math.random() * 100,
          total: Math.random() * 100 * item.quantity,
          status: 'added'
        })),
        summary: {
          itemCount: req.body.items.length,
          totalQuantity: req.body.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
          subtotal: Math.random() * 1000,
          estimatedTax: Math.random() * 100,
          estimatedTotal: Math.random() * 1100
        },
        message: 'Items added to cart successfully (Demo Mode)'
      };

      return res.status(200).json(mockResult);
    }

    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }

    return res.status(500).json({ error: 'Failed to process quick order' });
  }
}