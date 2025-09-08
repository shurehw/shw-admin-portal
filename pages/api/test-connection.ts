import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    envVarsPresent: {
      storeHash: !!process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH,
      accessToken: !!process.env.BIGCOMMERCE_ACCESS_TOKEN,
      clientId: !!process.env.BIGCOMMERCE_CLIENT_ID,
      clientSecret: !!process.env.BIGCOMMERCE_CLIENT_SECRET,
      storefrontToken: !!process.env.NEXT_PUBLIC_BIGCOMMERCE_STOREFRONT_API_TOKEN,
    },
    apiConnection: false,
    storeInfo: null,
    error: null
  };

  // Check if we have the minimum required credentials
  if (!process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH || !process.env.BIGCOMMERCE_ACCESS_TOKEN) {
    return res.status(200).json({
      ...results,
      error: 'Missing required environment variables. Please update .env.local with your BigCommerce credentials.'
    });
  }

  // Try to connect to BigCommerce API
  try {
    const response = await axios.get(
      `https://api.bigcommerce.com/stores/${process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH}/v2/store`,
      {
        headers: {
          'X-Auth-Token': process.env.BIGCOMMERCE_ACCESS_TOKEN,
          'Accept': 'application/json'
        }
      }
    );

    results.apiConnection = true;
    results.storeInfo = {
      name: response.data.name,
      domain: response.data.domain,
      secure_url: response.data.secure_url,
      status: 'Connected successfully!'
    };
  } catch (error: any) {
    results.error = error.response?.data?.title || error.message || 'Failed to connect to BigCommerce API';
    
    if (error.response?.status === 401) {
      results.error = 'Invalid access token. Please check your BIGCOMMERCE_ACCESS_TOKEN in .env.local';
    } else if (error.response?.status === 404) {
      results.error = 'Store not found. Please check your NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH in .env.local';
    }
  }

  return res.status(200).json(results);
}