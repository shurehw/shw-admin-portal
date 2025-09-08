import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const storeUrl = 'https://store-lsgscaxueg-1572493.mybigcommerce.com';
  
  try {
    // Try to fetch products using the public storefront
    const response = await axios.get(
      `${storeUrl}/api/storefront/products`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      storeUrl,
      productsFound: response.data?.length || 0,
      sampleProduct: response.data?.[0] || null
    });
  } catch (error: any) {
    // Try alternative endpoint
    try {
      const altResponse = await axios.get(
        `${storeUrl}/products.json`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      return res.status(200).json({
        success: true,
        storeUrl,
        endpoint: 'products.json',
        data: altResponse.data
      });
    } catch (altError: any) {
      return res.status(200).json({
        success: false,
        storeUrl,
        error: 'Could not fetch products from storefront',
        details: altError.response?.status || altError.message,
        note: 'You may need to create a Storefront API token in your BigCommerce admin panel'
      });
    }
  }
}