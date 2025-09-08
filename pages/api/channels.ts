import { NextApiRequest, NextApiResponse } from 'next';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH || 'lsgscaxueg';
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN || 'sfo47kc8jzqe2rlizafi7kvlvv34o0t';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all channels
    const response = await fetch(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/channels`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch channels:', errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch channels', 
        details: errorText 
      });
    }

    const data = await response.json();
    
    // Find the Headless Shure Hospitality channel
    const shureChannel = data.data?.find((channel: any) => 
      channel.name?.toLowerCase().includes('shure') || 
      channel.name?.toLowerCase().includes('headless')
    );

    return res.status(200).json({ 
      channels: data.data,
      shureChannel: shureChannel || null,
      shureChannelId: shureChannel?.id || null
    });
  } catch (error: any) {
    console.error('Error fetching channels:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch channels', 
      details: error.message 
    });
  }
}