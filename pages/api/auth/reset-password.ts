import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // BigCommerce handles the actual password reset through their own system
  // When users click the link in the email from BigCommerce, they'll be taken
  // to BigCommerce's password reset page, not ours
  
  // This endpoint is kept for backwards compatibility but isn't used
  // with the BigCommerce GraphQL integration
  
  return res.status(200).json({ 
    message: 'Please use the link in your email to reset your password.',
    info: 'Password resets are handled directly by BigCommerce.'
  });
}