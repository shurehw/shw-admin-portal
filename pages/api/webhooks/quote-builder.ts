import { NextApiRequest, NextApiResponse } from 'next';

// Webhook endpoint for receiving quotes from the external quote builder
// The quote builder app can POST quotes here when they're created or updated

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In production, verify webhook signature or API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.QUOTE_BUILDER_API_KEY && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  try {
    const {
      quoteId,
      quoteNumber,
      customerEmail,
      customerName,
      companyName,
      items,
      subtotal,
      tax,
      shipping,
      total,
      validUntil,
      notes,
      status,
      createdBy,
      pdfUrl,
      approvalUrl,
      paymentUrl
    } = req.body;

    // Validate required fields
    if (!customerEmail || !quoteNumber || !items) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['customerEmail', 'quoteNumber', 'items']
      });
    }

    // Store the quote in your database
    // In production, you would:
    // 1. Check if customer exists in B2B portal by email
    // 2. Link quote to their account if they exist
    // 3. Store quote details in database
    // 4. Send notification to customer

    console.log('Received quote from quote builder:');
    console.log('Quote Number:', quoteNumber);
    console.log('Customer:', customerEmail, '-', companyName);
    console.log('Total:', total);
    console.log('Status:', status);

    // Mock database save
    const savedQuote = {
      id: quoteId || `q-${Date.now()}`,
      quoteNumber,
      customerEmail,
      customerName,
      companyName,
      items,
      subtotal,
      tax,
      shipping,
      total,
      validUntil,
      notes,
      status: status || 'sent',
      createdBy: createdBy || 'Quote Builder App',
      createdAt: new Date().toISOString(),
      externalPdfUrl: pdfUrl,
      approvalUrl,
      paymentUrl,
      source: 'quote-builder'
    };

    // Send email notification to customer if they have a B2B account
    // await sendQuoteNotification(customerEmail, savedQuote);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Quote received and processed',
      quoteId: savedQuote.id,
      customerHasAccount: true, // Check if customer exists in B2B portal
      actions: {
        viewInPortal: `/quotes/${savedQuote.id}`,
        notificationSent: true
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Failed to process quote',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Configuration to handle larger payloads from quote builder
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};