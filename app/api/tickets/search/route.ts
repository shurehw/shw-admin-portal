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

export async function GET(request: NextRequest) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // 'tickets', 'companies', 'orders', 'all'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        tickets: [],
        companies: [],
        orders: [],
        total: 0
      });
    }

    const results: any = {
      tickets: [],
      companies: [],
      orders: [],
      total: 0
    };

    // Build access filter for user
    const userAccessFilter = userClaims.roles?.includes('admin') ? 
      { orgId: userClaims.orgId } :
      {
        orgId: userClaims.orgId,
        OR: [
          { ownerId: userClaims.userId },
          { team: { in: userClaims.teams || [] } },
          { watchers: { some: { userId: userClaims.userId } } }
        ]
      };

    // Search tickets
    if (type === 'tickets' || type === 'all') {
      // Check if query looks like a ticket ID
      const ticketIdMatch = query.match(/^(TKT-)?(\d+)$/i);
      let ticketSearchWhere: any = {
        ...userAccessFilter,
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
          { 
            company: { 
              companyName: { contains: query, mode: 'insensitive' } 
            } 
          },
          {
            messages: {
              some: {
                body: { contains: query, mode: 'insensitive' }
              }
            }
          }
        ]
      };

      // If it looks like a ticket ID, also search by ID
      if (ticketIdMatch) {
        const ticketId = ticketIdMatch[2];
        ticketSearchWhere.OR.push({ id: { contains: ticketId } });
      }

      const tickets = await prisma.ticket.findMany({
        where: ticketSearchWhere,
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
          _count: {
            select: { messages: true, watchers: true }
          }
        },
        take: limit,
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      results.tickets = tickets;
    }

    // Search companies
    if (type === 'companies' || type === 'all') {
      const companies = await prisma.b2BCustomer.findMany({
        where: {
          OR: [
            { companyName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          companyName: true,
          email: true,
          firstName: true,
          lastName: true,
          isApproved: true,
          _count: {
            select: { tickets: true, orders: true }
          }
        },
        take: limit,
        orderBy: { companyName: 'asc' }
      });

      results.companies = companies;
    }

    // Search orders
    if (type === 'orders' || type === 'all') {
      // Check if query looks like an order number
      const orderNumberMatch = query.match(/^(ORD-|#)?(.+)$/i);
      
      let orderSearchWhere: any = {
        OR: [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { 
            customer: { 
              companyName: { contains: query, mode: 'insensitive' } 
            } 
          }
        ]
      };

      // If it looks like an order number, prioritize exact matches
      if (orderNumberMatch) {
        const orderNum = orderNumberMatch[2];
        orderSearchWhere.OR.unshift({ orderNumber: orderNum });
      }

      const orders = await prisma.order.findMany({
        where: orderSearchWhere,
        include: {
          customer: {
            select: { id: true, companyName: true, email: true }
          },
          _count: {
            select: { tickets: true }
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      results.orders = orders;
    }

    // Calculate total results
    results.total = results.tickets.length + results.companies.length + results.orders.length;

    // If searching for specific ticket ID and found exact match, prioritize it
    if (type === 'tickets' && results.tickets.length > 0) {
      const exactIdMatch = results.tickets.find((t: any) => 
        t.id.endsWith(query) || t.subject.includes(`[#TKT-${query}]`)
      );
      
      if (exactIdMatch) {
        results.tickets = [exactIdMatch, ...results.tickets.filter((t: any) => t.id !== exactIdMatch.id)];
      }
    }

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Error searching:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Advanced search endpoint
export async function POST(request: NextRequest) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      query,
      filters = {},
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 25
    } = body;

    const skip = (page - 1) * limit;

    // Build where clause
    let where: any = {
      orgId: userClaims.orgId
    };

    // Apply user access restrictions
    if (!userClaims.roles?.includes('admin')) {
      where.OR = [
        { ownerId: userClaims.userId },
        { team: { in: userClaims.teams || [] } },
        { watchers: { some: { userId: userClaims.userId } } }
      ];
    }

    // Apply text search if provided
    if (query && query.trim()) {
      const searchConditions = [
        { subject: { contains: query, mode: 'insensitive' } },
        { body: { contains: query, mode: 'insensitive' } },
        { 
          company: { 
            companyName: { contains: query, mode: 'insensitive' } 
          } 
        },
        {
          messages: {
            some: {
              body: { contains: query, mode: 'insensitive' }
            }
          }
        }
      ];

      // Check if query looks like ticket ID
      const ticketIdMatch = query.match(/^(TKT-)?(\d+)$/i);
      if (ticketIdMatch) {
        searchConditions.push({ id: { contains: ticketIdMatch[2] } });
      }

      where.AND = where.AND || [];
      where.AND.push({ OR: searchConditions });
    }

    // Apply filters
    if (filters.status) {
      where.status = Array.isArray(filters.status) ? 
        { in: filters.status } : filters.status;
    }

    if (filters.priority) {
      where.priority = Array.isArray(filters.priority) ? 
        { in: filters.priority } : filters.priority;
    }

    if (filters.type) {
      where.type = Array.isArray(filters.type) ? 
        { in: filters.type } : filters.type;
    }

    if (filters.team) {
      where.team = filters.team;
    }

    if (filters.assignedTo) {
      where.ownerId = filters.assignedTo === 'unassigned' ? null : filters.assignedTo;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.hasOrder) {
      where.orderId = filters.hasOrder ? { not: null } : null;
    }

    if (filters.createdAfter) {
      where.createdAt = { gte: new Date(filters.createdAfter) };
    }

    if (filters.createdBefore) {
      where.AND = where.AND || [];
      where.AND.push({ 
        createdAt: { lte: new Date(filters.createdBefore) }
      });
    }

    if (filters.slaBreach) {
      where.slaDue = { lt: new Date() };
    }

    if (filters.tags && filters.tags.length > 0) {
      // Assuming tags are stored in a separate table
      where.tags = {
        some: {
          name: { in: filters.tags }
        }
      };
    }

    // Execute search
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: {
            select: { id: true, companyName: true, email: true }
          },
          order: {
            select: { id: true, orderNumber: true, total: true }
          },
          quote: {
            select: { id: true, quoteNumber: true, total: true }
          },
          customOrder: {
            select: { id: true, orderId: true, productName: true, status: true }
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
      },
      filters: filters,
      query: query
    });

  } catch (error: any) {
    console.error('Error in advanced search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}