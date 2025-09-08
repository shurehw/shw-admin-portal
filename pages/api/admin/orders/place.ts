import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  
  // Check if user is admin/staff
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  const {
    customerId,
    customerName,
    customerEmail,
    placedBy,
    placedByName,
    items,
    shippingAddressId,
    poNumber,
    rushOrder,
    orderNotes,
    subtotal,
    tax,
    shipping,
    total,
    paymentTerms
  } = req.body;

  // Validate required fields
  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Generate order ID
    const orderId = `ORD-${Date.now()}`;
    
    // Create order object
    const order = {
      id: orderId,
      orderNumber: orderId.replace('ORD-', '#'),
      customerId,
      customerName,
      customerEmail,
      placedBy: {
        email: placedBy,
        name: placedByName,
        role: session.user.role,
        timestamp: new Date().toISOString()
      },
      items,
      shippingAddressId,
      poNumber,
      rushOrder,
      orderNotes,
      subtotal,
      tax,
      shipping,
      total,
      paymentTerms,
      status: 'pending',
      createdAt: new Date().toISOString(),
      isAdminOrder: true, // Flag to indicate this was placed by admin
      adminNotes: `Order placed on behalf of customer by ${placedByName}`
    };

    // In production:
    // 1. Save order to database
    // 2. Update customer's current balance
    // 3. Send to BigCommerce/fulfillment system
    // 4. Send confirmation email to customer
    // 5. Create audit log entry
    // 6. Update inventory

    // Log the action
    console.log(`Admin order placed:`, {
      orderId,
      customer: customerName,
      placedBy: placedByName,
      total,
      itemCount: items.length
    });

    // Send confirmation email to customer
    await sendOrderConfirmation(customerEmail, order);
    
    // Send notification to admin who placed the order
    await notifyAdmin(placedBy, order);

    // Create activity log
    await createActivityLog({
      type: 'order_placed_for_customer',
      adminId: session.user.id,
      adminName: placedByName,
      customerId,
      customerName,
      orderId,
      orderTotal: total,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      orderId,
      orderNumber: order.orderNumber,
      message: `Order ${order.orderNumber} placed successfully for ${customerName}`
    });

  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ 
      error: 'Failed to place order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function sendOrderConfirmation(email: string, order: any) {
  // Send order confirmation to customer
  const emailContent = `
    Dear ${order.customerName},
    
    An order has been placed on your behalf by our team.
    
    Order Details:
    Order Number: ${order.orderNumber}
    Total: $${order.total.toFixed(2)}
    Payment Terms: ${order.paymentTerms}
    ${order.poNumber ? `PO Number: ${order.poNumber}` : ''}
    
    Items:
    ${order.items.map((item: any) => 
      `- ${item.name} (${item.sku}) x ${item.quantity} = $${item.total.toFixed(2)}`
    ).join('\n')}
    
    ${order.orderNotes ? `Special Instructions: ${order.orderNotes}` : ''}
    
    This order was placed by ${order.placedBy.name} from our team.
    
    You can track this order in your B2B portal or contact us if you have any questions.
    
    Thank you for your business!
  `;
  
  console.log(`Order confirmation sent to ${email}:`, emailContent);
  // In production, send actual email
}

async function notifyAdmin(adminEmail: string, order: any) {
  // Notify the admin who placed the order
  const notification = `
    Order ${order.orderNumber} successfully placed for ${order.customerName}.
    Total: $${order.total.toFixed(2)}
    Items: ${order.items.length}
  `;
  
  console.log(`Admin notification sent to ${adminEmail}:`, notification);
  // In production, send actual notification
}

async function createActivityLog(activity: any) {
  // Create audit trail
  console.log('Activity logged:', activity);
  // In production, save to database
}