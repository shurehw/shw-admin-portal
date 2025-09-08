import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';
import { fetchStopStatus } from '@/lib/optimoroute-adapter';
import { notifyCustomer } from '@/lib/notifier';

// Complete tracking sync that checks ShipStation, AfterShip, and OptimoRoute
// Can be called via cron job or manually to update all active orders

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const results = {
    shipstation: { checked: 0, updated: 0, errors: [] as string[] },
    aftership: { checked: 0, updated: 0, errors: [] as string[] },
    optimoroute: { checked: 0, updated: 0, errors: [] as string[] },
  };

  try {
    // Get all active orders
    const allOrders = await store.listOrders();
    const activeOrders = allOrders.filter(o => 
      o.status !== 'delivered' && o.status !== 'canceled'
    );

    // Process each order based on transport mode
    for (const order of activeOrders) {
      
      // 1. CHECK SHIPSTATION (for third-party shipments)
      if (order.transportMode === 'third_party' && !order.shipment?.trackingNumber) {
        results.shipstation.checked++;
        try {
          const shipmentData = await checkShipStation(order.orderId);
          if (shipmentData) {
            await store.setShipmentMeta(order.orderId, {
              carrier: shipmentData.carrier,
              trackingNumber: shipmentData.trackingNumber,
              trackingUrl: shipmentData.trackingUrl
            });
            
            await store.addEvent({
              orderId: order.orderId,
              ts: new Date().toISOString(),
              kind: 'shipping',
              source: 'SHIPSTATION',
              label: 'Tracking Number Assigned',
              note: `${shipmentData.carrier}: ${shipmentData.trackingNumber}`,
              link: shipmentData.trackingUrl
            });
            
            results.shipstation.updated++;
          }
        } catch (error: any) {
          results.shipstation.errors.push(`${order.orderId}: ${error.message}`);
        }
      }

      // 2. CHECK AFTERSHIP (for orders with tracking numbers)
      if (order.shipment?.trackingNumber) {
        results.aftership.checked++;
        try {
          const trackingData = await checkAfterShip(order.shipment.trackingNumber);
          if (trackingData) {
            // Update with latest tracking info
            const latestEvent = trackingData.checkpoints?.[0];
            if (latestEvent) {
              await store.addEvent({
                orderId: order.orderId,
                ts: latestEvent.checkpoint_time || new Date().toISOString(),
                kind: 'shipping',
                source: 'AFTERSHIP',
                label: latestEvent.message || 'Tracking Update',
                note: latestEvent.location || undefined
              });

              // Check if delivered
              if (trackingData.tag === 'Delivered') {
                await store.updateStatus(order.orderId, 'delivered', 'Package delivered');
                await notifyCustomer(order.orderId, 'Your order has been delivered!', ['email', 'sms']);
              } else if (trackingData.tag === 'OutForDelivery') {
                await store.updateStatus(order.orderId, 'out_for_delivery', 'Out for delivery');
              }
              
              results.aftership.updated++;
            }
          }
        } catch (error: any) {
          results.aftership.errors.push(`${order.orderId}: ${error.message}`);
        }
      }

      // 3. CHECK OPTIMOROUTE (for in-house deliveries)
      if (order.transportMode === 'in_house') {
        results.optimoroute.checked++;
        try {
          const routeData = await fetchStopStatus(order.orderId);
          if (routeData) {
            await store.setLocalMeta(order.orderId, {
              eta: routeData.eta,
              mapLink: routeData.trackingUrl,
              lastLocation: routeData.lastLocation,
              driverName: routeData.driver?.name,
              driverPhone: routeData.driver?.phone,
              vehicleId: routeData.vehicle?.id
            });

            // Update status based on OptimoRoute status
            const statusMap: Record<string, any> = {
              'dispatched': 'dispatch_scheduled',
              'out_for_delivery': 'out_for_delivery',
              'completed': 'delivered'
            };

            if (statusMap[routeData.status]) {
              await store.updateStatus(order.orderId, statusMap[routeData.status], 
                `Status: ${routeData.status}`);
              
              await store.addEvent({
                orderId: order.orderId,
                ts: new Date().toISOString(),
                kind: 'local_delivery',
                source: 'OPTIMO',
                label: `Route Update: ${routeData.status}`,
                eta: routeData.eta,
                link: routeData.trackingUrl
              });
            }
            
            results.optimoroute.updated++;
          }
        } catch (error: any) {
          results.optimoroute.errors.push(`${order.orderId}: ${error.message}`);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tracking sync completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      results
    });
  }
}

// ShipStation Check
async function checkShipStation(orderId: string): Promise<any> {
  const apiKey = process.env.SHIPSTATION_API_KEY;
  const apiSecret = process.env.SHIPSTATION_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('ShipStation credentials not configured');
  }

  const response = await fetch(
    `https://ssapi.shipstation.com/shipments?orderNumber=${orderId}`,
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`ShipStation API error: ${response.status}`);
  }

  const data = await response.json();
  const shipment = data.shipments?.[0];
  
  if (!shipment) return null;

  return {
    carrier: shipment.carrierCode,
    trackingNumber: shipment.trackingNumber,
    trackingUrl: shipment.voided ? null : getTrackingUrl(shipment.carrierCode, shipment.trackingNumber),
    shipDate: shipment.shipDate,
    status: shipment.voided ? 'voided' : 'shipped'
  };
}

// AfterShip Check
async function checkAfterShip(trackingNumber: string): Promise<any> {
  const apiKey = process.env.AFTERSHIP_API_KEY;
  
  if (!apiKey) {
    throw new Error('AfterShip API key not configured');
  }

  const response = await fetch(
    `https://api.aftership.com/v4/trackings/${trackingNumber}`,
    {
      headers: {
        'aftership-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    // If tracking not found, that's okay
    if (response.status === 404) return null;
    throw new Error(`AfterShip API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data?.tracking || null;
}

function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierUrls: Record<string, string> = {
    'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'dhl': `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`,
  };

  return carrierUrls[carrier.toLowerCase()] || 
    `https://www.google.com/search?q=${trackingNumber}`;
}