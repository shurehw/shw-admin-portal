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
    
    if (!hasPermission(userClaims, 'tickets:admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const statuses = await prisma.ticketStatus.findMany({
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json({ statuses });

  } catch (error: any) {
    console.error('Error fetching ticket statuses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userClaims = verifyToken(request);
    
    if (!hasPermission(userClaims, 'tickets:admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, color, isClosed = false } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get next order index
    const lastStatus = await prisma.ticketStatus.findFirst({
      orderBy: { orderIndex: 'desc' }
    });
    const nextOrderIndex = (lastStatus?.orderIndex || 0) + 1;

    const status = await prisma.ticketStatus.create({
      data: {
        name,
        orderIndex: nextOrderIndex,
        color,
        isClosed
      }
    });

    return NextResponse.json(status, { status: 201 });

  } catch (error: any) {
    console.error('Error creating ticket status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}