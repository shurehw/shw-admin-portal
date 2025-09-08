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

// Built-in views that every user has access to
const DEFAULT_VIEWS = [
  {
    id: 'my_open',
    name: 'My Open Tickets',
    filters: { status: ['new', 'ack', 'in_progress'], assignedToMe: true },
    isBuiltIn: true
  },
  {
    id: 'unassigned',
    name: 'Unassigned',
    filters: { ownerId: null, status: ['new', 'ack'] },
    isBuiltIn: true
  },
  {
    id: 'breaching_2h',
    name: 'Breaching <2h',
    filters: { 
      status: ['new', 'ack', 'in_progress'],
      slaDue: { lte: new Date(Date.now() + 2 * 60 * 60 * 1000) }
    },
    isBuiltIn: true
  },
  {
    id: 'waiting_customer',
    name: 'Waiting on Customer',
    filters: { status: 'waiting_customer' },
    isBuiltIn: true
  },
  {
    id: 'returns',
    name: 'Returns',
    filters: { type: 'return' },
    isBuiltIn: true
  },
  {
    id: 'delivery_issues',
    name: 'Delivery Issues',
    filters: { type: 'delivery' },
    isBuiltIn: true
  },
  {
    id: 'billing_issues',
    name: 'Billing Issues',
    filters: { type: 'billing' },
    isBuiltIn: true
  }
];

export async function GET(request: NextRequest) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get custom saved views
    const customViews = await prisma.savedView.findMany({
      where: {
        OR: [
          { userId: userClaims.userId }, // Personal views
          { team: { in: userClaims.teams || [] }, isPublic: true }, // Team views
          { team: null, isPublic: true } // Global public views
        ]
      },
      orderBy: { name: 'asc' }
    });

    // Combine default views with custom views
    const allViews = [
      ...DEFAULT_VIEWS,
      ...customViews.map(view => ({
        id: view.id,
        name: view.name,
        filters: view.filters,
        team: view.team,
        userId: view.userId,
        isPublic: view.isPublic,
        isBuiltIn: false,
        createdBy: view.createdBy,
        createdAt: view.createdAt
      }))
    ];

    return NextResponse.json({ views: allViews });

  } catch (error: any) {
    console.error('Error fetching views:', error);
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
    const { name, filters, team, isPublic = false } = body;

    if (!name || !filters) {
      return NextResponse.json({ error: 'Name and filters are required' }, { status: 400 });
    }

    const view = await prisma.savedView.create({
      data: {
        name,
        filters,
        team: team || null,
        userId: isPublic ? null : userClaims.userId,
        isPublic,
        createdBy: userClaims.userId
      }
    });

    return NextResponse.json(view, { status: 201 });

  } catch (error: any) {
    console.error('Error creating view:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get tickets for a specific view
export async function PUT(request: NextRequest) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { viewId, page = 1, limit = 25 } = body;

    let filters: any = {};

    // Get view filters
    if (viewId.startsWith('builtin_') || DEFAULT_VIEWS.find(v => v.id === viewId)) {
      const defaultView = DEFAULT_VIEWS.find(v => v.id === viewId);
      if (defaultView) {
        filters = { ...defaultView.filters };
      }
    } else {
      const savedView = await prisma.savedView.findUnique({
        where: { id: viewId }
      });
      
      if (!savedView) {
        return NextResponse.json({ error: 'View not found' }, { status: 404 });
      }
      
      filters = savedView.filters as any;
    }

    // Build where clause
    const where: any = {
      orgId: userClaims.orgId,
    };

    // Apply user access restrictions
    if (!userClaims.roles?.includes('admin')) {
      where.OR = [
        { ownerId: userClaims.userId },
        { team: { in: userClaims.teams || [] } }
      ];
    }

    // Apply view filters
    if (filters.status) {
      where.status = Array.isArray(filters.status) ? 
        { in: filters.status } : 
        filters.status;
    }

    if (filters.priority) {
      where.priority = Array.isArray(filters.priority) ? 
        { in: filters.priority } : 
        filters.priority;
    }

    if (filters.type) {
      where.type = Array.isArray(filters.type) ? 
        { in: filters.type } : 
        filters.type;
    }

    if (filters.team) {
      where.team = filters.team;
    }

    if (filters.ownerId === null) {
      where.ownerId = null;
    } else if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.assignedToMe) {
      where.ownerId = userClaims.userId;
    }

    if (filters.slaDue) {
      where.slaDue = filters.slaDue;
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
    console.error('Error fetching view tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}