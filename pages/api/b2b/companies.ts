import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = process.env.BIGCOMMERCE_ACCESS_TOKEN;
  
  if (!token) {
    return res.status(500).json({ error: 'Missing B2B token' });
  }

  try {
    // Test B2B Companies endpoint
    const response = await axios.get(
      'https://api-b2b.bigcommerce.com/api/v3/io/companies',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      endpoint: 'B2B Companies',
      data: response.data
    });
  } catch (error: any) {
    // If companies fails, try users endpoint
    try {
      const usersResponse = await axios.get(
        'https://api-b2b.bigcommerce.com/api/v3/io/users',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      return res.status(200).json({
        success: true,
        endpoint: 'B2B Users',
        data: usersResponse.data
      });
    } catch (usersError: any) {
      return res.status(200).json({
        success: false,
        error: 'B2B API Error',
        status: error.response?.status,
        message: error.response?.data || error.message,
        note: 'The B2B token may need different permissions or the B2B features may not be fully enabled'
      });
    }
  }
}