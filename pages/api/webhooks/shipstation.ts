import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';
import { notifyCustomer } from '@/lib/notifier';

// ShipStation Webhook Handler
// Docs: https://help.shipstation.com/hc/en-us/articles/360025856192-Webhooks

const SHIPSTATION_KEY = process.env.SHIPSTATION_WEBHOOK_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // Verify ShipStation webhook key if configured
  if (SHIPSTATION_KEY && req.headers['x-ss-webhook-key'] !== SHIPSTATION_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { resource_type, resource_url, action } = req.body;

  // ShipStation sends a notification with a URL to fetch the actual data
  if (!resource_url) {
    return res.status(400).json({ error: 'Missing resource_url' });
  }

  try {
    // Fetch the actual shipment data from ShipStation
    const shipmentRes = await fetch(resource_url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`).toString('base64')}`
      }
    });

    if (!shipmentRes.ok) {
      throw new Error(`Failed to fetch shipment data: ${shipmentRes.status}`);
    }

    const shipmentData = await shipmentRes.json();

    // Extract relevant information
    const orderId = shipmentData.orderNumber || shipmentData.orderKey;
    const trackingNumber = shipmentData.trackingNumber;
    const carrier = shipmentData.carrierCode || shipmentData.carrier;
    const shipDate = shipmentData.shipDate;
    const items = shipmentData.shipmentItems || [];

    if (!orderId) {
      return res.status(200).json({ ok: true, message: 'No order ID found' });
    }

    // Find our order
    const order = await store.getOrder(orderId);
    if (!order) {
      console.log(`Order ${orderId} not found in our system`);
      return res.status(200).json({ ok: true, message: 'Order not found' });
    }

    // Handle different ShipStation events
    switch (action) {
      case 'SHIP_NOTIFY':
        // Order has been shipped
        await store.setShipmentMeta(order.orderId, {
          carrier,
          trackingNumber,
          trackingUrl: getTrackingUrl(carrier, trackingNumber)
        });

        await store.addEvent({
          orderId: order.orderId,
          ts: shipDate || new Date().toISOString(),
          kind: 'shipping',
          source: 'SHIPSTATION',
          label: 'Order Shipped',
          note: `Shipped via ${carrier} - Tracking: ${trackingNumber}`,
          status: 'shipping'
        });

        await store.updateStatus(order.orderId, 'shipping', 'Order has been shipped');
        await notifyCustomer(order.orderId, `Your order has been shipped! Track it with: ${trackingNumber}`, ['email', 'sms']);
        break;

      case 'ITEM_SHIP_NOTIFY':
        // Partial shipment
        const itemNames = items.map((i: any) => i.name).join(', ');
        await store.addEvent({
          orderId: order.orderId,
          ts: new Date().toISOString(),
          kind: 'shipping',
          source: 'SHIPSTATION',
          label: 'Partial Shipment',
          note: `Items shipped: ${itemNames}`
        });
        break;

      case 'ORDER_NOTIFY':
        // New order imported to ShipStation
        await store.addEvent({
          orderId: order.orderId,
          ts: new Date().toISOString(),
          kind: 'status',
          source: 'SHIPSTATION',
          label: 'Order Received by Fulfillment',
          note: 'Order imported to ShipStation for processing'
        });
        break;
    }

    res.status(200).json({ ok: true, processed: action });
  } catch (error: any) {
    console.error('ShipStation webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}

function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierUrls: Record<string, string> = {
    'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'dhl': `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`,
    'ontrac': `https://www.ontrac.com/tracking/?number=${trackingNumber}`,
    'lasership': `https://www.lasership.com/track/${trackingNumber}`,
    'canada_post': `https://www.canadapost.ca/track-reperage/en#/search?searchFor=${trackingNumber}`,
  };

  const lowerCarrier = carrier.toLowerCase();
  return carrierUrls[lowerCarrier] || `https://www.google.com/search?q=${trackingNumber}`;
}