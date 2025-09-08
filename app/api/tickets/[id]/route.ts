import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  return decoded;
}

function hasPermission(userClaims: any, permission: string): boolean {
  return userClaims.permissions?.includes(permission) || 
         userClaims.roles?.includes('admin');
}

function canAccessTicket(userClaims: any, ticket: any): boolean {
  if (userClaims.roles?.includes('admin')) return true;
  if (ticket.orgId !== userClaims.orgId) return false;
  if (ticket.ownerId === userClaims.userId) return true;
  if (ticket.team && userClaims.teams?.includes(ticket.team)) return true;
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: { id: true, companyName: true, email: true, phone: true }
        },
        order: {
          select: { id: true, orderNumber: true, status: true, total: true }
        },
        quote: {
          select: { id: true, quoteNumber: true, status: true, total: true }
        },
        customOrder: {
          select: { id: true, orderId: true, productName: true, status: true }
        },
        slaPolicy: {
          select: { name: true, firstResponseMinutes: true, resolveMinutes: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: { id: true }
            }
          }
        },
        watchers: true
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!canAccessTicket(userClaims, ticket)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(ticket);

  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id }
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!canAccessTicket(userClaims, existingTicket)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      status,
      priority,
      ownerId,
      team,
      subject,
      type
    } = body;

    const updateData: any = {};
    const changes: any = {};

    // Track changes for event logging
    if (status !== undefined && status !== existingTicket.status) {
      updateData.status = status;
      changes.status = { from: existingTicket.status, to: status };
      
      // Set response time if moving from 'new' to 'ack'
      if (existingTicket.status === 'new' && status === 'ack') {
        updateData.firstResponseAt = new Date();
        changes.firstResponseAt = new Date();
      }
      
      // Set closed time if closing
      if (status === 'closed') {
        updateData.closedAt = new Date();
        changes.closedAt = new Date();
      }
    }

    if (priority !== undefined && priority !== existingTicket.priority) {
      updateData.priority = priority;
      changes.priority = { from: existingTicket.priority, to: priority };
      
      // Update SLA if priority changes
      const slaPolicy = await prisma.slaPolicy.findFirst({
        where: { priority }
      });
      
      if (slaPolicy) {
        updateData.slaId = slaPolicy.id;
        updateData.slaDue = new Date(Date.now() + slaPolicy.firstResponseMinutes * 60 * 1000);
        changes.sla = { policyId: slaPolicy.id };
      }
    }

    if (ownerId !== undefined && ownerId !== existingTicket.ownerId) {
      updateData.ownerId = ownerId;
      changes.ownerId = { from: existingTicket.ownerId, to: ownerId };
    }

    if (team !== undefined && team !== existingTicket.team) {
      updateData.team = team;
      changes.team = { from: existingTicket.team, to: team };
    }

    if (subject !== undefined && subject !== existingTicket.subject) {
      updateData.subject = subject;
      changes.subject = { from: existingTicket.subject, to: subject };
    }

    if (type !== undefined && type !== existingTicket.type) {
      updateData.type = type;
      changes.type = { from: existingTicket.type, to: type };
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: {
          select: { id: true, companyName: true, email: true }
        },
        order: {
          select: { id: true, orderNumber: true }
        },
        quote: {
          select: { id: true, quoteNumber: true }
        },
        customOrder: {
          select: { id: true, orderId: true, productName: true }
        },
        slaPolicy: {
          select: { name: true, firstResponseMinutes: true, resolveMinutes: true }
        }
      }
    });

    // Log events for significant changes
    for (const [field, change] of Object.entries(changes)) {
      await prisma.ticketEvent.create({
        data: {
          ticketId: params.id,
          eventType: `${field}_changed`,
          data: change,
          userId: userClaims.userId
        }
      });
    }

    return NextResponse.json(updatedTicket);

  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!canAccessTicket(userClaims, ticket)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete related records first
    await prisma.ticketMessage.deleteMany({
      where: { ticketId: params.id }
    });

    await prisma.ticketWatcher.deleteMany({
      where: { ticketId: params.id }
    });

    await prisma.ticketEvent.deleteMany({
      where: { ticketId: params.id }
    });

    await prisma.ticket.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}