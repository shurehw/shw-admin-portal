import { NextRequest, NextResponse } from 'next/server';
import { ticketingClient } from '@/lib/ticketing/supabase-client';
import jwt from 'jsonwebtoken';

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

export async function GET(request: NextRequest) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const team = searchParams.get('team');
    const ownerId = searchParams.get('ownerId');
    const search = searchParams.get('search');
    const orderBy = searchParams.get('orderBy') || 'createdAt';
    const orderDir = searchParams.get('orderDir') || 'desc';

    const skip = (page - 1) * limit;

    const where: any = {
      orgId: userClaims.orgId,
    };

    // Apply filters based on user permissions and teams
    if (!userClaims.roles?.includes('admin')) {
      where.OR = [
        { ownerId: userClaims.userId },
        { team: { in: userClaims.teams || [] } }
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (team) where.team = team;
    if (ownerId) where.ownerId = ownerId;
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { company: { companyName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: orderDir },
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
          },
          _count: {
            select: { messages: true, watchers: true }
          }
        }
      }),
      prisma.ticket.count({ where })
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:write')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      subject,
      body: ticketBody,
      type = 'support',
      priority = 'normal',
      channel = 'web',
      companyId,
      contactId,
      orderId,
      quoteId,
      customOrderId,
      team
    } = body;

    if (!subject || !ticketBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    // Get SLA policy for priority
    const slaPolicy = await prisma.slaPolicy.findFirst({
      where: { priority }
    });

    const slaDue = slaPolicy ? 
      new Date(Date.now() + slaPolicy.firstResponseMinutes * 60 * 1000) : 
      null;

    const ticket = await prisma.ticket.create({
      data: {
        orgId: userClaims.orgId,
        subject,
        body: ticketBody,
        type,
        status: 'new',
        priority,
        channel,
        companyId,
        contactId,
        orderId,
        quoteId,
        customOrderId,
        team,
        slaId: slaPolicy?.id,
        slaDue
      },
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
        }
      }
    });

    // Create initial system message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        kind: 'internal_note',
        channel: 'system',
        body: `Ticket created via ${channel}`,
        createdBy: userClaims.userId
      }
    });

    // Log event
    await prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        eventType: 'created',
        data: { channel, priority, type },
        userId: userClaims.userId
      }
    });

    return NextResponse.json(ticket, { status: 201 });

  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}