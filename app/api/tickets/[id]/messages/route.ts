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
      where: { id: params.id }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (!canAccessTicket(userClaims, ticket)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const kind = searchParams.get('kind'); // 'public_reply' or 'internal_note'

    const skip = (page - 1) * limit;
    const where: any = { ticketId: params.id };
    
    if (kind) {
      where.kind = kind;
    }

    const [messages, total] = await Promise.all([
      prisma.ticketMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }
      }),
      prisma.ticketMessage.count({ where })
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:write')) {
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

    const body = await request.json();
    const {
      kind = 'internal_note', // 'public_reply' or 'internal_note'
      channel = 'internal',   // 'email', 'sms', 'phone', 'internal', 'system'
      body: messageBody,
      html,
      attachments,
      emailMessageId,
      emailReferences
    } = body;

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: params.id,
        kind,
        channel,
        body: messageBody,
        html,
        attachments,
        createdBy: userClaims.userId,
        emailMessageId,
        emailReferences
      }
    });

    // Update ticket status if this is the first public reply
    if (kind === 'public_reply' && ticket.status === 'new') {
      await prisma.ticket.update({
        where: { id: params.id },
        data: {
          status: 'ack',
          firstResponseAt: new Date(),
          ownerId: userClaims.userId // Auto-assign to responder
        }
      });

      // Log status change event
      await prisma.ticketEvent.create({
        data: {
          ticketId: params.id,
          eventType: 'status_changed',
          data: { from: 'new', to: 'ack', reason: 'first_response' },
          userId: userClaims.userId
        }
      });
    }

    // Log message event
    await prisma.ticketEvent.create({
      data: {
        ticketId: params.id,
        eventType: kind === 'public_reply' ? 'replied' : 'noted',
        data: { channel, messageId: message.id },
        userId: userClaims.userId
      }
    });

    return NextResponse.json(message, { status: 201 });

  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}