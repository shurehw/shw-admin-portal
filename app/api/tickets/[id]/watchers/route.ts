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

    const watchers = await prisma.ticketWatcher.findMany({
      where: { ticketId: params.id }
    });

    return NextResponse.json({ watchers });

  } catch (error: any) {
    console.error('Error fetching watchers:', error);
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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    const watcher = await prisma.ticketWatcher.create({
      data: {
        ticketId: params.id,
        userId
      }
    });

    // Log event
    await prisma.ticketEvent.create({
      data: {
        ticketId: params.id,
        eventType: 'watcher_added',
        data: { watcherUserId: userId },
        userId: userClaims.userId
      }
    });

    return NextResponse.json(watcher, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User is already watching this ticket' }, { status: 409 });
    }
    console.error('Error adding watcher:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    await prisma.ticketWatcher.delete({
      where: {
        ticketId_userId: {
          ticketId: params.id,
          userId
        }
      }
    });

    // Log event
    await prisma.ticketEvent.create({
      data: {
        ticketId: params.id,
        eventType: 'watcher_removed',
        data: { watcherUserId: userId },
        userId: userClaims.userId
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error removing watcher:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}