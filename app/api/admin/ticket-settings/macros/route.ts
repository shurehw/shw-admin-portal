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
    const team = searchParams.get('team');

    const where: any = {
      OR: [
        { team: null }, // Global macros
        { team: team || { in: userClaims.teams || [] } } // Team-specific macros
      ]
    };

    const macros = await prisma.macro.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ macros });

  } catch (error: any) {
    console.error('Error fetching macros:', error);
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
    const { name, description, team, actions } = body;

    if (!name || !actions || !Array.isArray(actions)) {
      return NextResponse.json({ 
        error: 'Name and actions array are required' 
      }, { status: 400 });
    }

    // Validate actions structure
    for (const action of actions) {
      if (!action.type) {
        return NextResponse.json({ 
          error: 'Each action must have a type' 
        }, { status: 400 });
      }
    }

    const macro = await prisma.macro.create({
      data: {
        name,
        description,
        team: team || null,
        actions,
        createdBy: userClaims.userId
      }
    });

    return NextResponse.json(macro, { status: 201 });

  } catch (error: any) {
    console.error('Error creating macro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}