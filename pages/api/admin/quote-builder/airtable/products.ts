import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user has production/admin access
  const allowedRoles = ['admin', 'production', 'art_team'];
  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden - Production access required' });
  }

  // Mock Airtable products data
  const mockProducts = [
    {
      id: 'rec1',
      name: 'Custom T-Shirts',
      sku: 'TS-001',
      category: 'Apparel',
      baseCost: 8.50,
      description: 'High-quality custom printed t-shirts',
      image: 'https://via.placeholder.com/150',
      minQuantity: 25,
      volumePricing: [
        { quantity: 25, price: 12.00 },
        { quantity: 50, price: 10.50 },
        { quantity: 100, price: 9.00 },
        { quantity: 250, price: 8.00 },
        { quantity: 500, price: 7.00 }
      ]
    },
    {
      id: 'rec2',
      name: 'Business Cards',
      sku: 'BC-001',
      category: 'Print',
      baseCost: 0.08,
      description: 'Premium business cards with various finishes',
      image: 'https://via.placeholder.com/150',
      minQuantity: 100,
      volumePricing: [
        { quantity: 100, price: 0.25 },
        { quantity: 250, price: 0.20 },
        { quantity: 500, price: 0.15 },
        { quantity: 1000, price: 0.10 }
      ]
    },
    {
      id: 'rec3',
      name: 'Embroidered Caps',
      sku: 'CAP-001',
      category: 'Apparel',
      baseCost: 12.00,
      description: 'Custom embroidered baseball caps',
      image: 'https://via.placeholder.com/150',
      minQuantity: 12,
      volumePricing: [
        { quantity: 12, price: 25.00 },
        { quantity: 24, price: 22.00 },
        { quantity: 48, price: 20.00 },
        { quantity: 100, price: 18.00 }
      ]
    },
    {
      id: 'rec4',
      name: 'Vinyl Banners',
      sku: 'BAN-001',
      category: 'Signage',
      baseCost: 45.00,
      description: 'Weather-resistant vinyl banners for events',
      image: 'https://via.placeholder.com/150',
      minQuantity: 1,
      volumePricing: [
        { quantity: 1, price: 150.00 },
        { quantity: 5, price: 130.00 },
        { quantity: 10, price: 115.00 }
      ]
    },
    {
      id: 'rec5',
      name: 'Letterheads',
      sku: 'LH-001',
      category: 'Print',
      baseCost: 0.15,
      description: 'Professional letterheads on premium paper',
      image: 'https://via.placeholder.com/150',
      minQuantity: 100,
      volumePricing: [
        { quantity: 100, price: 0.35 },
        { quantity: 250, price: 0.30 },
        { quantity: 500, price: 0.25 },
        { quantity: 1000, price: 0.20 }
      ]
    },
    {
      id: 'rec6',
      name: 'Trade Show Display',
      sku: 'TSD-001',
      category: 'Displays',
      baseCost: 850.00,
      description: 'Complete trade show booth setup with graphics',
      image: 'https://via.placeholder.com/150',
      minQuantity: 1,
      volumePricing: [
        { quantity: 1, price: 2500.00 },
        { quantity: 2, price: 2200.00 },
        { quantity: 3, price: 2000.00 }
      ]
    },
    {
      id: 'rec7',
      name: 'Promotional Pens',
      sku: 'PEN-001',
      category: 'Promotional',
      baseCost: 0.35,
      description: 'Custom branded pens with logo',
      image: 'https://via.placeholder.com/150',
      minQuantity: 100,
      volumePricing: [
        { quantity: 100, price: 1.20 },
        { quantity: 250, price: 0.95 },
        { quantity: 500, price: 0.75 },
        { quantity: 1000, price: 0.60 }
      ]
    },
    {
      id: 'rec8',
      name: 'Custom Mugs',
      sku: 'MUG-001',
      category: 'Promotional',
      baseCost: 3.50,
      description: 'Ceramic mugs with full-color printing',
      image: 'https://via.placeholder.com/150',
      minQuantity: 24,
      volumePricing: [
        { quantity: 24, price: 8.00 },
        { quantity: 48, price: 7.00 },
        { quantity: 100, price: 6.00 },
        { quantity: 250, price: 5.00 }
      ]
    },
    {
      id: 'rec9',
      name: 'Flyers',
      sku: 'FLY-001',
      category: 'Print',
      baseCost: 0.05,
      description: 'Full-color flyers in various sizes',
      image: 'https://via.placeholder.com/150',
      minQuantity: 100,
      volumePricing: [
        { quantity: 100, price: 0.20 },
        { quantity: 500, price: 0.12 },
        { quantity: 1000, price: 0.08 },
        { quantity: 5000, price: 0.06 }
      ]
    },
    {
      id: 'rec10',
      name: 'Window Decals',
      sku: 'WD-001',
      category: 'Signage',
      baseCost: 8.00,
      description: 'Custom die-cut vinyl window decals',
      image: 'https://via.placeholder.com/150',
      minQuantity: 10,
      volumePricing: [
        { quantity: 10, price: 15.00 },
        { quantity: 25, price: 12.00 },
        { quantity: 50, price: 10.00 },
        { quantity: 100, price: 8.50 }
      ]
    }
  ];

  res.status(200).json(mockProducts);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};