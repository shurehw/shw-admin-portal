import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  
  // Check if user has production/admin access
  const allowedRoles = ['admin', 'production', 'art_team'];
  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden - Production access required' });
  }

  const {
    customerId,
    customerName,
    customerEmail,
    items,
    notes,
    validUntil,
    subtotal,
    tax,
    shipping,
    total
  } = req.body;

  // Validate required fields
  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Generate quote ID
    const quoteId = `QT-${Date.now()}`;
    
    // Create quote object
    const quote = {
      id: quoteId,
      quoteNumber: quoteId.replace('QT-', '#'),
      customerId,
      customerName,
      customerEmail,
      createdBy: {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        timestamp: new Date().toISOString()
      },
      items,
      notes,
      validUntil,
      subtotal,
      tax,
      shipping,
      total,
      status: 'sent',
      createdAt: new Date().toISOString()
    };

    // In production, you would:
    // 1. Save to database
    // 2. Send email to customer
    // 3. Create PDF
    // 4. Store in document management system

    console.log('Quote created:', quote);

    // Simulate sending email
    if (customerEmail) {
      console.log(`Quote email sent to ${customerEmail}`);
    }

    return res.status(201).json({
      success: true,
      quoteId,
      quoteNumber: quote.quoteNumber,
      message: `Quote ${quote.quoteNumber} created and sent to ${customerName}`
    });

  } catch (error) {
    console.error('Error creating quote:', error);
    return res.status(500).json({ 
      error: 'Failed to create quote',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}