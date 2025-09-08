import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getSession } from 'next-auth/react';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const customerId = session.user.bigcommerceId;
  const baseUrl = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/wishlists`;

  try {
    switch (req.method) {
      case 'GET':
        // Get customer's wishlists
        const getResponse = await axios.get(
          `${baseUrl}?customer_id=${customerId}`,
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN,
              'Accept': 'application/json'
            }
          }
        );
        return res.status(200).json(getResponse.data);

      case 'POST':
        // Create a new wishlist
        const { name, items, is_public } = req.body;
        const createResponse = await axios.post(
          baseUrl,
          {
            customer_id: customerId,
            name: name || 'My Wishlist',
            items: items || [],
            is_public: is_public || false
          },
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );
        return res.status(201).json(createResponse.data);

      case 'PUT':
        // Add item to wishlist
        const { wishlist_id, product_id, variant_id } = req.body;
        const addResponse = await axios.post(
          `${baseUrl}/${wishlist_id}/items`,
          {
            product_id,
            variant_id
          },
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );
        return res.status(200).json(addResponse.data);

      case 'DELETE':
        // Remove item from wishlist
        const { wishlistId, itemId } = req.query;
        await axios.delete(
          `${baseUrl}/${wishlistId}/items/${itemId}`,
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN
            }
          }
        );
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Wishlist error:', error);
    return res.status(500).json({ error: 'Wishlist operation failed' });
  }
}