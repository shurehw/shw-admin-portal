import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getSession } from 'next-auth/react';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { firstName, lastName, phone, company } = req.body;

  try {
    // Update customer in BigCommerce
    const response = await axios.put(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers`,
      [{
        id: session.user.bigcommerceId,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        company: company
      }],
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json({ 
      message: 'Profile updated successfully',
      customer: response.data.data[0]
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}