import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Admin endpoint for managing custom orders
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  // Check if user is admin (you may want to implement proper admin check)
  if (!session || !session.user || !session.user.email?.includes('@shurehw.com')) {
    return res.status(401).json({ error: 'Unauthorized - Admin access required' });
  }

  const { id } = req.query;
  const customOrderId = id as string;

  switch (req.method) {
    case 'PUT':
      try {
        const { 
          status,
          currentStage,
          estimatedDelivery,
          trackingNumber,
          carrier,
          trackingUrl,
          productionNotes,
          qualityCheckNotes,
          artworkStatus,
          internalNotes,
          lastUpdate,
          estimatedCompletion,
          manufacturer,
          confirmedDate,
          productionStart,
          productionEnd,
          shippedDate,
        } = req.body;

        // Get existing order to track status changes
        const existingOrder = await prisma.customOrder.findUnique({
          where: { id: customOrderId },
        });

        if (!existingOrder) {
          return res.status(404).json({ error: 'Custom order not found' });
        }

        // Update custom order
        const updatedOrder = await prisma.customOrder.update({
          where: { id: customOrderId },
          data: {
            status: status || existingOrder.status,
            currentStage,
            estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
            trackingNumber,
            carrier,
            trackingUrl,
            productionNotes,
            qualityCheckNotes,
            artworkStatus,
            internalNotes,
            lastUpdate,
            estimatedCompletion,
            manufacturer,
            confirmedDate: confirmedDate ? new Date(confirmedDate) : undefined,
            productionStart: productionStart ? new Date(productionStart) : undefined,
            productionEnd: productionEnd ? new Date(productionEnd) : undefined,
            shippedDate: shippedDate ? new Date(shippedDate) : undefined,
            updatedAt: new Date(),
          },
        });

        // Create status history if status changed
        if (status && status !== existingOrder.status) {
          await prisma.customOrderStatusHistory.create({
            data: {
              customOrderId,
              previousStatus: existingOrder.status,
              newStatus: status,
              notes: lastUpdate || `Status updated to ${status}`,
              updatedBy: session.user.email,
              isCustomerVisible: true,
              milestoneType: getMilestoneType(status),
            },
          });

          // Send notification (implement based on your notification system)
          // await sendStatusUpdateNotification(updatedOrder, status);
        }

        return res.status(200).json(updatedOrder);
      } catch (error) {
        console.error('Error updating custom order:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'POST':
      // Handle file uploads (artwork, proofs, etc.)
      try {
        const { type, files } = req.body;

        const existingOrder = await prisma.customOrder.findUnique({
          where: { id: customOrderId },
        });

        if (!existingOrder) {
          return res.status(404).json({ error: 'Custom order not found' });
        }

        let updateData: any = {};

        switch (type) {
          case 'design':
            const existingDesignFiles = existingOrder.designFiles 
              ? JSON.parse(existingOrder.designFiles) 
              : [];
            updateData.designFiles = JSON.stringify([...existingDesignFiles, ...files]);
            break;
          case 'proof':
            const existingProofImages = existingOrder.proofImages 
              ? JSON.parse(existingOrder.proofImages) 
              : [];
            updateData.proofImages = JSON.stringify([...existingProofImages, ...files]);
            break;
          case 'artwork':
            const existingArtworkFiles = existingOrder.artworkFiles 
              ? JSON.parse(existingOrder.artworkFiles) 
              : [];
            updateData.artworkFiles = JSON.stringify([...existingArtworkFiles, ...files]);
            break;
        }

        const updatedOrder = await prisma.customOrder.update({
          where: { id: customOrderId },
          data: updateData,
        });

        // Add to status history
        await prisma.customOrderStatusHistory.create({
          data: {
            customOrderId,
            previousStatus: existingOrder.status,
            newStatus: existingOrder.status,
            notes: `${type} files uploaded`,
            updatedBy: session.user.email,
            isCustomerVisible: true,
            attachments: JSON.stringify(files),
          },
        });

        return res.status(200).json(updatedOrder);
      } catch (error) {
        console.error('Error uploading files:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['PUT', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function getMilestoneType(status: string): string | null {
  const milestoneMap: { [key: string]: string } = {
    'confirmed': 'order_confirmed',
    'in_production': 'production_started',
    'quality_check': 'quality_check_initiated',
    'shipping': 'order_shipped',
    'delivered': 'order_delivered',
  };
  
  return milestoneMap[status] || null;
}