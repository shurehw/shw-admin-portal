import { NextApiRequest, NextApiResponse } from 'next';

// API endpoint for the quote builder to search for B2B portal customers
// This allows sales team to find and select which customer to send quotes/art proofs to

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify API key from quote builder
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.QUOTE_BUILDER_API_KEY && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const { search, email, companyName } = req.query;

  try {
    // In production, search your database for customers
    // For now, return mock customer data
    const mockCustomers = [
      {
        id: 'cust_001',
        email: 'purchasing@marriott.com',
        companyName: 'Marriott International',
        contactName: 'John Smith',
        hasPortalAccount: true,
        creditLimit: 50000,
        paymentTerms: 'NET 30',
        shippingAddresses: [
          {
            id: 'addr_001',
            name: 'Main Warehouse',
            address: '123 Hotel Way, Miami, FL 33166',
            isDefault: true
          }
        ]
      },
      {
        id: 'cust_002',
        email: 'orders@hilton.com',
        companyName: 'Hilton Hotels',
        contactName: 'Sarah Johnson',
        hasPortalAccount: true,
        creditLimit: 75000,
        paymentTerms: 'NET 45',
        shippingAddresses: [
          {
            id: 'addr_002',
            name: 'Distribution Center',
            address: '456 Resort Blvd, Orlando, FL 32801',
            isDefault: true
          }
        ]
      },
      {
        id: 'cust_003',
        email: 'procurement@caesars.com',
        companyName: 'Caesars Entertainment',
        contactName: 'Mike Davis',
        hasPortalAccount: true,
        creditLimit: 100000,
        paymentTerms: 'NET 30',
        shippingAddresses: [
          {
            id: 'addr_003',
            name: 'Las Vegas Warehouse',
            address: '789 Casino Dr, Las Vegas, NV 89109',
            isDefault: true
          }
        ]
      },
      {
        id: 'cust_004',
        email: 'newcustomer@restaurant.com',
        companyName: 'Local Restaurant Group',
        contactName: 'Alice Brown',
        hasPortalAccount: false, // No portal account yet
        creditLimit: 0,
        paymentTerms: 'PREPAID',
        shippingAddresses: []
      }
    ];

    // Filter based on search parameters
    let results = mockCustomers;

    if (search) {
      const searchLower = String(search).toLowerCase();
      results = results.filter(c => 
        c.companyName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.contactName.toLowerCase().includes(searchLower)
      );
    }

    if (email) {
      results = results.filter(c => c.email === email);
    }

    if (companyName) {
      results = results.filter(c => 
        c.companyName.toLowerCase().includes(String(companyName).toLowerCase())
      );
    }

    return res.status(200).json({
      customers: results,
      total: results.length,
      hasMore: false // For pagination in future
    });

  } catch (error) {
    console.error('Customer search error:', error);
    return res.status(500).json({ error: 'Failed to search customers' });
  }
}