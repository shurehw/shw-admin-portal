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

  const { id } = req.query;
  const customOrderId = id as string;

  switch (req.method) {
    case 'GET':
      try {
        const customOrder = await prisma.customOrder.findUnique({
          where: { id: customOrderId },
          include: {
            customer: true,
            statusHistory: {
              where: { isCustomerVisible: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!customOrder) {
          return res.status(404).json({ error: 'Custom order not found' });
        }

        // Check if user has access to this order
        if (customOrder.customer.email !== session.user.email) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Parse JSON fields
        const orderWithParsedData = {
          ...customOrder,
          customDetails: customOrder.customDetails ? JSON.parse(customOrder.customDetails) : null,
          designFiles: customOrder.designFiles ? JSON.parse(customOrder.designFiles) : [],
          proofImages: customOrder.proofImages ? JSON.parse(customOrder.proofImages) : [],
          artworkFiles: customOrder.artworkFiles ? JSON.parse(customOrder.artworkFiles) : [],
        };

        return res.status(200).json(orderWithParsedData);
      } catch (error) {
        console.error('Error fetching custom order:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'PUT':
      try {
        const { trackingNumber, carrier, trackingUrl, customerNotes } = req.body;

        // Verify ownership
        const existingOrder = await prisma.customOrder.findUnique({
          where: { id: customOrderId },
          include: { customer: true },
        });

        if (!existingOrder) {
          return res.status(404).json({ error: 'Custom order not found' });
        }

        if (existingOrder.customer.email !== session.user.email) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        // Update custom order (customer can only update notes)
        const updatedOrder = await prisma.customOrder.update({
          where: { id: customOrderId },
          data: {
            customerNotes,
            updatedAt: new Date(),
          },
        });

        return res.status(200).json(updatedOrder);
      } catch (error) {
        console.error('Error updating custom order:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}