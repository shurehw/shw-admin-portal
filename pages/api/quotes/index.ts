import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

// This endpoint handles quotes from both:
// 1. Internal quote requests from B2B portal
// 2. Quotes created in the quote builder app

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (req.method === 'GET') {
    // Fetch quotes for the logged-in customer
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // In production, fetch from database or Supabase
      // For now, return mock data
      const quotes = [
        {
          id: '1',
          quoteNumber: 'Q-2024-001',
          customerName: session.user.companyName,
          customerEmail: session.user.email,
          items: [
            {
              name: 'Custom Printed Napkins',
              quantity: 5000,
              price: 0.25,
              total: 1250.00
            },
            {
              name: 'Branded Glassware',
              quantity: 200,
              price: 12.50,
              total: 2500.00
            }
          ],
          subtotal: 3750.00,
          tax: 300.00,
          shipping: 150.00,
          total: 4200.00,
          status: 'sent',
          validUntil: '2025-02-15',
          createdAt: '2025-01-15',
          notes: 'Rush order - need by end of month',
          createdBy: 'Sales Team',
          pdfUrl: '/api/quotes/1/pdf'
        },
        {
          id: '2',
          quoteNumber: 'Q-2024-002',
          customerName: session.user.companyName,
          customerEmail: session.user.email,
          items: [
            {
              name: 'Hotel Amenity Kit',
              quantity: 1000,
              price: 8.50,
              total: 8500.00
            }
          ],
          subtotal: 8500.00,
          tax: 680.00,
          shipping: 200.00,
          total: 9380.00,
          status: 'accepted',
          validUntil: '2025-02-10',
          createdAt: '2025-01-10',
          acceptedAt: '2025-01-12',
          createdBy: 'Sales Team'
        }
      ];

      return res.status(200).json({ quotes });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  }

  if (req.method === 'POST') {
    // Receive quotes from the quote builder app
    // This endpoint can be called by the quote builder to sync quotes
    
    const { customerEmail, quoteData, source } = req.body;

    // Validate the request
    if (!customerEmail || !quoteData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Store the quote in database
      // In production, save to database
      console.log('Received quote from:', source || 'quote-builder');
      console.log('Customer:', customerEmail);
      console.log('Quote data:', quoteData);

      // Send notification to customer if they have a B2B account
      // You could also send an email notification here

      return res.status(201).json({ 
        success: true, 
        message: 'Quote received and stored',
        quoteId: quoteData.id || 'new-quote-id'
      });
    } catch (error) {
      console.error('Error saving quote:', error);
      return res.status(500).json({ error: 'Failed to save quote' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}