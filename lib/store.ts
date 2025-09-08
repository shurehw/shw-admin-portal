import type { CustomOrder, OrderStatus, TimelineEvent } from '@/types/orders';

// In-memory store (swap to Airtable/DB later)
let ORDERS: CustomOrder[] = [
  {
    id: '1',
    orderId: 'ORD-2025-001',
    productName: 'Custom Branded Napkins',
    sku: 'NAP-CUSTOM-001',
    quantity: 5000,
    customDetails: { color: 'Navy Blue', logo: 'Company Logo', material: 'Premium Paper' },
    specialInstructions: 'Gold foil stamping on logo',
    status: 'in_production',
    currentStage: 'Printing in progress - 60% complete',
    estimatedCompletion: 7,
    orderDate: '2025-01-08T10:00:00Z',
    estimatedDelivery: '2025-01-30T10:00:00Z',
    artworkStatus: 'approved',
    lastUpdate: 'Production on schedule, quality samples approved',
    statusHistory: [
      { createdAt: '2025-01-09T10:00:00Z', newStatus: 'confirmed', notes: 'Artwork approved' },
      { createdAt: '2025-01-12T10:00:00Z', newStatus: 'sampling', notes: 'Lab dip approved' },
      { createdAt: '2025-01-15T10:00:00Z', newStatus: 'in_production', notes: 'Materials received' },
    ],
    transportMode: 'third_party',
    shipment: { events: [] },
  },
  {
    id: '2',
    orderId: 'ORD-2025-002',
    productName: 'Custom Menu Covers',
    sku: 'MENU-CUSTOM-002',
    quantity: 200,
    status: 'out_for_delivery',
    currentStage: 'Local truck out for delivery',
    orderDate: '2025-01-05T10:00:00Z',
    estimatedDelivery: '2025-01-18T10:00:00Z',
    lastUpdate: 'Truck dispatched from warehouse',
    statusHistory: [
      { createdAt: '2025-01-06T10:00:00Z', newStatus: 'confirmed', notes: 'Order confirmed' },
      { createdAt: '2025-01-14T10:00:00Z', newStatus: 'finishing', notes: 'Edge stitching complete' },
      { createdAt: '2025-01-16T08:00:00Z', newStatus: 'dispatch_scheduled', notes: 'Route 14, Van #7' },
      { createdAt: '2025-01-17T09:30:00Z', newStatus: 'out_for_delivery', notes: 'ETA 1:15 PM' },
    ],
    transportMode: 'in_house',
    localDelivery: {
      driverName: 'Marco P', 
      driverPhone: '+1-310-555-0142', 
      vehicleId: 'Van-7',
      eta: '2025-01-17T13:15:00-07:00', 
      lastLocation: { lat: 34.05, lng: -118.25, at: '2025-01-17T11:40:00-07:00' }
    },
  },
  {
    id: '3',
    orderId: 'ORD-2025-003',
    productName: 'Embroidered Chef Aprons',
    sku: 'APRON-CUSTOM-003',
    quantity: 50,
    status: 'quality_check',
    currentStage: 'Final inspection in progress',
    estimatedCompletion: 2,
    orderDate: '2025-01-10T10:00:00Z',
    estimatedDelivery: '2025-01-25T10:00:00Z',
    artworkStatus: 'approved',
    lastUpdate: 'Products completed, undergoing quality inspection',
    statusHistory: [
      { createdAt: '2025-01-11T10:00:00Z', newStatus: 'confirmed', notes: 'Design approved' },
      { createdAt: '2025-01-14T10:00:00Z', newStatus: 'in_production', notes: 'Embroidery started' },
      { createdAt: '2025-01-16T10:00:00Z', newStatus: 'finishing', notes: 'Final touches applied' },
      { createdAt: '2025-01-17T10:00:00Z', newStatus: 'quality_check', notes: 'QC inspection started' },
    ],
    transportMode: 'third_party',
  },
  {
    id: '4',
    orderId: 'ORD-2025-004',
    productName: 'Premium Silverware Set (Dropship)',
    sku: 'SILVER-DS-001',
    quantity: 24,
    status: 'shipping',
    currentStage: 'Shipped directly from supplier warehouse',
    orderDate: '2025-01-15T10:00:00Z',
    estimatedDelivery: '2025-01-20T10:00:00Z',
    lastUpdate: 'Tracking number received from supplier',
    statusHistory: [
      { createdAt: '2025-01-15T14:00:00Z', newStatus: 'confirmed', notes: 'Order forwarded to supplier' },
      { createdAt: '2025-01-16T10:00:00Z', newStatus: 'shipping', notes: 'Shipped from supplier warehouse' },
    ],
    transportMode: 'third_party',
    shipment: {
      carrier: 'FedEx',
      trackingNumber: '774489991234567',
      trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=774489991234567',
      events: [
        { ts: '2025-01-16T10:00:00Z', code: 'PICKED_UP', description: 'Package picked up', location: 'Dallas, TX' },
        { ts: '2025-01-17T08:00:00Z', code: 'IN_TRANSIT', description: 'In transit', location: 'Phoenix, AZ' },
      ]
    },
    customDetails: {
      supplier: 'Liberty Tabletop',
      dropship: 'Yes',
      origin: 'Dallas, TX'
    },
    specialInstructions: 'Dropship order - Ship directly to customer from supplier warehouse',
  },
];

let EVENTS: TimelineEvent[] = [
  // Seed timeline events for existing orders
  {
    id: 'e1',
    orderId: 'ORD-2025-001',
    ts: '2025-01-09T10:00:00Z',
    kind: 'production',
    source: 'INTERNAL',
    label: 'Order Confirmed',
    note: 'Artwork approved, moving to sampling',
    status: 'confirmed',
  },
  {
    id: 'e2',
    orderId: 'ORD-2025-001',
    ts: '2025-01-12T10:00:00Z',
    kind: 'production',
    source: 'INTERNAL',
    label: 'Sampling Complete',
    note: 'Lab dip approved by customer',
    status: 'sampling',
  },
  {
    id: 'e3',
    orderId: 'ORD-2025-001',
    ts: '2025-01-15T10:00:00Z',
    kind: 'production',
    source: 'INTERNAL',
    label: 'Production Started',
    note: 'Materials received, printing commenced',
    status: 'in_production',
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const store = {
  listOrders: async () => ORDERS,
  
  getOrder: async (idOrOrderId: string) =>
    ORDERS.find(o => o.id === idOrOrderId || o.orderId === idOrOrderId) || null,

  upsertOrder: async (order: CustomOrder) => {
    const i = ORDERS.findIndex(o => o.id === order.id);
    if (i >= 0) { 
      ORDERS[i] = { ...ORDERS[i], ...order }; 
      return ORDERS[i]; 
    }
    ORDERS.unshift(order); 
    return order;
  },

  updateStatus: async (orderId: string, status: OrderStatus, notes?: string) => {
    const o = await store.getOrder(orderId);
    if (!o) return null;
    o.status = status;
    o.lastUpdate = notes || `Status updated to ${status}`;
    o.statusHistory = o.statusHistory || [];
    o.statusHistory.push({ 
      createdAt: new Date().toISOString(), 
      newStatus: status, 
      notes 
    });
    return o;
  },

  // Shipping/meta helpers
  setShipmentMeta: async (orderId: string, meta: Partial<CustomOrder['shipment']>) => {
    const o = await store.getOrder(orderId);
    if (!o) return null;
    o.transportMode = o.transportMode || 'third_party';
    o.shipment = { ...(o.shipment || {}), ...meta };
    return o;
  },
  
  setLocalMeta: async (orderId: string, meta: Partial<CustomOrder['localDelivery']>) => {
    const o = await store.getOrder(orderId);
    if (!o) return null;
    o.transportMode = 'in_house';
    o.localDelivery = { ...(o.localDelivery || {}), ...meta };
    return o;
  },

  // Timeline
  addEvent: async (e: Omit<TimelineEvent,'id'>) => {
    const ev: TimelineEvent = { id: uid(), ...e };
    EVENTS.push(ev);
    return ev;
  },
  
  listEvents: async (orderId: string) =>
    EVENTS.filter(e => e.orderId === orderId).sort((a,b) => a.ts.localeCompare(b.ts)),
};