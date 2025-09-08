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

    const slaPolicies = await prisma.slaPolicy.findMany({
      include: {
        businessHours: {
          select: { id: true, name: true }
        }
      },
      orderBy: { priority: 'asc' }
    });

    return NextResponse.json({ slaPolicies });

  } catch (error: any) {
    console.error('Error fetching SLA policies:', error);
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
    const { 
      name, 
      priority, 
      firstResponseMinutes, 
      resolveMinutes, 
      businessHoursId 
    } = body;

    if (!name || !priority || !firstResponseMinutes || !resolveMinutes) {
      return NextResponse.json({ 
        error: 'Name, priority, firstResponseMinutes, and resolveMinutes are required' 
      }, { status: 400 });
    }

    const slaPolicy = await prisma.slaPolicy.create({
      data: {
        name,
        priority,
        firstResponseMinutes,
        resolveMinutes,
        businessHoursId
      },
      include: {
        businessHours: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(slaPolicy, { status: 201 });

  } catch (error: any) {
    console.error('Error creating SLA policy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}