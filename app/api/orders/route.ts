import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mock orders data
const mockOrders = [
  {
    id: '1',
    orderId: 'ORD-2024-001',
    productName: 'Custom Hotel Keycards - Marriott',
    sku: 'KC-MAR-001',
    quantity: 5000,
    status: 'in_production',
    orderDate: '2024-01-15',
    shipment: {
      trackingNumber: '1Z999AA10123456784',
      carrier: 'UPS',
      estimatedDelivery: '2024-01-25'
    },
    customer: {
      name: 'Marriott International',
      contact: 'John Smith'
    }
  },
  {
    id: '2',
    orderId: 'ORD-2024-002',
    productName: 'RFID Wristbands - Caesars',
    sku: 'WB-CAE-002',
    quantity: 10000,
    status: 'shipping',
    orderDate: '2024-01-14',
    shipment: {
      trackingNumber: '776620912734',
      carrier: 'FedEx',
      estimatedDelivery: '2024-01-22'
    },
    customer: {
      name: 'Caesars Entertainment',
      contact: 'Sarah Johnson'
    }
  },
  {
    id: '3',
    orderId: 'ORD-2024-003',
    productName: 'Custom Playing Cards - Bellagio',
    sku: 'PC-BEL-003',
    quantity: 2000,
    status: 'quality_check',
    orderDate: '2024-01-13',
    customer: {
      name: 'Bellagio Hotel & Casino',
      contact: 'Mike Chen'
    }
  },
  {
    id: '4',
    orderId: 'ORD-2024-004',
    productName: 'Hotel Door Hangers - Hilton',
    sku: 'DH-HIL-004',
    quantity: 15000,
    status: 'sampling',
    orderDate: '2024-01-16',
    customer: {
      name: 'Hilton Hotels',
      contact: 'Emily Davis'
    }
  },
  {
    id: '5',
    orderId: 'ORD-2024-005',
    productName: 'Loyalty Program Cards - MGM',
    sku: 'LP-MGM-005',
    quantity: 7500,
    status: 'out_for_delivery',
    orderDate: '2024-01-12',
    localDelivery: {
      driverName: 'Robert Wilson',
      driverPhone: '555-0123',
      vehicleId: 'VAN-42',
      eta: '2024-01-18 14:00'
    },
    customer: {
      name: 'MGM Resorts',
      contact: 'Lisa Martinez'
    }
  },
  {
    id: '6',
    orderId: 'ORD-2024-006',
    productName: 'Custom Poker Chips - Wynn',
    sku: 'PC-WYN-006',
    quantity: 5000,
    status: 'confirmed',
    orderDate: '2024-01-17',
    customer: {
      name: 'Wynn Las Vegas',
      contact: 'David Thompson'
    }
  },
  {
    id: '7',
    orderId: 'ORD-2024-007',
    productName: 'VIP Access Cards - Venetian',
    sku: 'VAC-VEN-007',
    quantity: 1000,
    status: 'finishing',
    orderDate: '2024-01-11',
    customer: {
      name: 'The Venetian Resort',
      contact: 'Jennifer White'
    }
  },
  {
    id: '8',
    orderId: 'ORD-2024-008',
    productName: 'Event Badges - Convention Center',
    sku: 'EB-LVC-008',
    quantity: 20000,
    status: 'pending',
    orderDate: '2024-01-18',
    customer: {
      name: 'Las Vegas Convention Center',
      contact: 'Mark Anderson'
    }
  }
];

export async function GET() {
  // In a real application, fetch from database
  return NextResponse.json(mockOrders);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // In a real application, update the database
  console.log('Updating order:', body);
  
  return NextResponse.json({ success: true, message: 'Order updated successfully' });
}