import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';
import { notifyCustomer } from '@/lib/notifier';

const SECRET = process.env.AFTERSHIP_WEBHOOK_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }
  
  // Verify webhook secret if configured
  if (SECRET && req.headers['x-aftership-secret'] !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body || {};
  const trackingNumber = payload?.tracking_number || payload?.meta?.tracking_number;
  const carrier = payload?.slug || payload?.meta?.slug;
  const orderId = payload?.orderId || payload?.meta?.orderId;

  if (!trackingNumber) {
    return res.status(400).json({ error: 'Missing tracking_number' });
  }

  // Find order by tracking number or order ID
  const order = orderId 
    ? await store.getOrder(orderId)
    : await (async () => {
        const all = await store.listOrders();
        return all.find(o => o.shipment?.trackingNumber === trackingNumber) || null;
      })();

  if (!order) {
    return res.status(200).json({ ok: true, message: 'Order not found' });
  }

  // Extract latest checkpoint
  const checkpoint = payload?.checkpoint || {};
  const description = checkpoint?.message || payload?.message || payload?.tag || 'Tracking update';
  const location = checkpoint?.location || checkpoint?.city;
  
  // Update shipment metadata
  await store.setShipmentMeta(order.orderId, {
    carrier,
    trackingNumber,
    trackingUrl: payload?.link || order.shipment?.trackingUrl
  });
  
  // Add to timeline
  await store.addEvent({
    orderId: order.orderId,
    ts: checkpoint?.checkpoint_time || new Date().toISOString(),
    kind: 'shipping',
    source: 'AFTERSHIP',
    label: description,
    note: location
  });

  // Update status based on tag
  const tag = (payload?.tag || checkpoint?.tag || '').toLowerCase();
  if (tag.includes('delivered')) {
    await store.updateStatus(order.orderId, 'delivered', 'Package delivered');
    await notifyCustomer(order.orderId, 'Your order has been delivered!', ['email', 'sms']);
  } else if (tag.includes('out_for_delivery')) {
    await store.updateStatus(order.orderId, 'out_for_delivery', 'Out for delivery');
    await notifyCustomer(order.orderId, 'Your order is out for delivery', ['email']);
  } else {
    await store.updateStatus(order.orderId, 'shipping', description);
  }

  res.status(200).json({ ok: true });
}