import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BIGCOMMERCE_ACCESS_TOKEN;
  const storeHash = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;

  const results = {
    tokenPresent: !!token,
    storeHash: storeHash,
    b2bApiTest: false,
    standardApiTest: false,
    data: null,
    error: null
  };

  if (!token) {
    return res.status(200).json({
      ...results,
      error: 'Missing access token'
    });
  }

  // Test B2B API
  try {
    const b2bResponse = await axios.get(
      'https://api-b2b.bigcommerce.com/api/v3/io/companies',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    results.b2bApiTest = true;
    results.data = {
      b2b: {
        status: 'Connected to B2B API',
        companies: b2bResponse.data?.data?.length || 0
      }
    };
  } catch (b2bError: any) {
    console.log('B2B API Error:', b2bError.response?.status, b2bError.response?.data);
  }

  // Also test standard API with the token
  try {
    const standardResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?limit=1`,
      {
        headers: {
          'X-Auth-Token': token,
          'Accept': 'application/json'
        }
      }
    );
    
    results.standardApiTest = true;
    results.data = {
      ...results.data,
      standard: {
        status: 'Connected to Standard API',
        productsFound: standardResponse.data?.data?.length || 0
      }
    };
  } catch (standardError: any) {
    console.log('Standard API Error:', standardError.response?.status, standardError.response?.data);
    
    // Try with Bearer token instead
    try {
      const bearerResponse = await axios.get(
        `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      results.standardApiTest = true;
      results.data = {
        ...results.data,
        standard: {
          status: 'Connected to Standard API (Bearer)',
          productsFound: bearerResponse.data?.data?.length || 0
        }
      };
    } catch (bearerError: any) {
      results.error = `Standard API failed with both X-Auth-Token and Bearer: ${bearerError.response?.status || bearerError.message}`;
    }
  }

  if (!results.b2bApiTest && !results.standardApiTest) {
    results.error = results.error || 'Could not connect to any BigCommerce API';
  }

  return res.status(200).json(results);
}