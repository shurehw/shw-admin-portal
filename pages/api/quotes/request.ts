import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    productDescription,
    quantity,
    frequency,
    urgency,
    targetPrice,
    specialRequirements,
    preferredDeliveryDate,
    contactMethod
  } = req.body;

  // Validate required fields
  if (!productDescription || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create quote request
    const quoteRequest = {
      id: `QR-${Date.now()}`,
      customerEmail: session.user.email,
      customerName: session.user.name,
      companyName: session.user.companyName,
      productDescription,
      quantity,
      frequency,
      urgency,
      targetPrice,
      specialRequirements,
      preferredDeliveryDate,
      contactMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestType: 'customer_request'
    };

    // In production:
    // 1. Save to database
    // 2. Send notification to sales team
    // 3. Create task in CRM/Trello
    // 4. Send confirmation email to customer

    // For now, log the request
    console.log('Quote request received:', quoteRequest);

    // Send notification to sales team (email, Slack, etc.)
    await notifySalesTeam(quoteRequest);

    // Send confirmation to customer
    await sendConfirmationEmail(session.user.email, quoteRequest);

    return res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      requestId: quoteRequest.id,
      estimatedResponseTime: urgency === 'urgent' ? '24 hours' : '48-72 hours'
    });

  } catch (error) {
    console.error('Error processing quote request:', error);
    return res.status(500).json({ error: 'Failed to submit quote request' });
  }
}

async function notifySalesTeam(quoteRequest: any) {
  // Send to sales team via preferred method
  // Could be email, Slack, SMS, or create a task in your CRM
  
  const message = `
    New Quote Request from ${quoteRequest.companyName}
    
    Customer: ${quoteRequest.customerName}
    Email: ${quoteRequest.customerEmail}
    
    Products: ${quoteRequest.productDescription}
    Quantity: ${quoteRequest.quantity}
    Frequency: ${quoteRequest.frequency}
    Urgency: ${quoteRequest.urgency}
    Target Budget: ${quoteRequest.targetPrice || 'Not specified'}
    
    Special Requirements: ${quoteRequest.specialRequirements || 'None'}
    Preferred Delivery: ${quoteRequest.preferredDeliveryDate || 'Not specified'}
    
    Contact Method: ${quoteRequest.contactMethod}
    
    Request ID: ${quoteRequest.id}
  `;

  console.log('Sales team notified:', message);
  
  // In production, send actual notification
  // await sendEmailToSales(message);
  // await postToSlack(message);
  // await createTrelloCard(quoteRequest);
}

async function sendConfirmationEmail(email: string, quoteRequest: any) {
  // Send confirmation email to customer
  const message = `
    Thank you for your quote request!
    
    We've received your request for:
    ${quoteRequest.productDescription}
    
    Quantity: ${quoteRequest.quantity}
    
    Our sales team will review your request and provide a detailed quote within ${
      quoteRequest.urgency === 'urgent' ? '24 hours' : '48-72 hours'
    }.
    
    Your request ID is: ${quoteRequest.id}
    
    You can track this and all your quotes in your B2B portal.
  `;

  console.log(`Confirmation sent to ${email}:`, message);
  
  // In production, send actual email
  // await sendEmail(email, 'Quote Request Received', message);
}