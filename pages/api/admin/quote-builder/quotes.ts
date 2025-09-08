import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user has production/admin access
  const allowedRoles = ['admin', 'production', 'art_team'];
  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden - Production access required' });
  }

  if (req.method === 'GET') {
    // Mock quotes data
    const mockQuotes = [
      {
        id: '1',
        quote_number: 'Q-2024-001',
        customer_name: 'ABC Company',
        customer_email: 'contact@abc.com',
        total: 3047.50,
        status: 'sent',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        valid_until: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { name: 'Custom T-Shirts', quantity: 100, price: 15, total: 1500 },
          { name: 'Embroidered Caps', quantity: 50, price: 25, total: 1250 }
        ]
      },
      {
        id: '2',
        quote_number: 'Q-2024-002',
        customer_name: 'XYZ Corp',
        customer_email: 'procurement@xyz.com',
        total: 260.25,
        status: 'accepted',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { name: 'Business Cards', quantity: 1000, price: 0.10, total: 100 },
          { name: 'Letterheads', quantity: 500, price: 0.25, total: 125 }
        ]
      }
    ];

    res.status(200).json(mockQuotes);
  } else if (req.method === 'POST') {
    // Handle quote creation
    const newQuote = {
      id: Date.now().toString(),
      quote_number: `Q-2024-${Date.now().toString().slice(-3)}`,
      ...req.body,
      created_at: new Date().toISOString(),
      status: 'draft'
    };

    res.status(201).json(newQuote);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};