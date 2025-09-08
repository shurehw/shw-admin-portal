import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userEmail = session.user.email;

  switch (req.method) {
    case 'GET':
      try {
        // Get customer by email
        const customer = await prisma.b2BCustomer.findUnique({
          where: { email: userEmail },
        });

        if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
        }

        // Get all custom orders for this customer
        const customOrders = await prisma.customOrder.findMany({
          where: { customerId: customer.id },
          include: {
            statusHistory: {
              where: { isCustomerVisible: true },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        // Parse JSON fields
        const ordersWithParsedData = customOrders.map(order => ({
          ...order,
          customDetails: order.customDetails ? JSON.parse(order.customDetails) : null,
          designFiles: order.designFiles ? JSON.parse(order.designFiles) : [],
          proofImages: order.proofImages ? JSON.parse(order.proofImages) : [],
          artworkFiles: order.artworkFiles ? JSON.parse(order.artworkFiles) : [],
        }));

        return res.status(200).json(ordersWithParsedData);
      } catch (error) {
        console.error('Error fetching custom orders:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'POST':
      try {
        const { 
          orderId, 
          productName, 
          sku, 
          quantity, 
          customDetails, 
          specialInstructions,
          estimatedDelivery 
        } = req.body;

        // Get customer by email
        const customer = await prisma.b2BCustomer.findUnique({
          where: { email: userEmail },
        });

        if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
        }

        // Create custom order
        const customOrder = await prisma.customOrder.create({
          data: {
            orderId,
            customerId: customer.id,
            productName,
            sku,
            quantity,
            customDetails: customDetails ? JSON.stringify(customDetails) : null,
            specialInstructions,
            estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
            status: 'pending',
            currentStage: 'Order received, awaiting confirmation',
          },
        });

        // Create initial status history
        await prisma.customOrderStatusHistory.create({
          data: {
            customOrderId: customOrder.id,
            previousStatus: '',
            newStatus: 'pending',
            notes: 'Custom order created',
            isCustomerVisible: true,
          },
        });

        return res.status(201).json(customOrder);
      } catch (error) {
        console.error('Error creating custom order:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}