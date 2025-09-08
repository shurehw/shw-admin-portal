import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface UserClaims {
  userId: string;
  email: string;
  orgId: string;
  roles: string[];
  teams: string[];
  permissions: string[];
  name?: string;
}

export function verifyTicketingToken(request: NextRequest): UserClaims {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.substring(7);
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Validate required claims
    if (!decoded.userId || !decoded.orgId) {
      throw new Error('Invalid token: missing required claims');
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      orgId: decoded.orgId,
      roles: decoded.roles || [],
      teams: decoded.teams || [],
      permissions: decoded.permissions || [],
      name: decoded.name
    };
  } catch (error: any) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

export function hasTicketingPermission(userClaims: UserClaims, permission: string): boolean {
  // Admin role has all permissions
  if (userClaims.roles?.includes('admin')) {
    return true;
  }
  
  // Check specific permission
  return userClaims.permissions?.includes(permission) || false;
}

export function canAccessTicket(userClaims: UserClaims, ticket: any): boolean {
  // Admin can access all tickets
  if (userClaims.roles?.includes('admin')) {
    return true;
  }
  
  // Must be same org
  if (ticket.orgId !== userClaims.orgId) {
    return false;
  }
  
  // Owner can always access
  if (ticket.ownerId === userClaims.userId) {
    return true;
  }
  
  // Team members can access team tickets
  if (ticket.team && userClaims.teams?.includes(ticket.team)) {
    return true;
  }
  
  // Watchers can access
  if (ticket.watchers?.some((w: any) => w.userId === userClaims.userId)) {
    return true;
  }
  
  return false;
}

export function filterTicketsForUser(userClaims: UserClaims): any {
  // Admin can see all tickets in their org
  if (userClaims.roles?.includes('admin')) {
    return {
      orgId: userClaims.orgId
    };
  }
  
  // Regular users can see tickets they own, are assigned to their teams, or are watching
  return {
    orgId: userClaims.orgId,
    OR: [
      { ownerId: userClaims.userId },
      { team: { in: userClaims.teams || [] } },
      { watchers: { some: { userId: userClaims.userId } } }
    ]
  };
}

export function canManageTicketSettings(userClaims: UserClaims): boolean {
  return hasTicketingPermission(userClaims, 'tickets:admin');
}

export function canCreateTickets(userClaims: UserClaims): boolean {
  return hasTicketingPermission(userClaims, 'tickets:write') ||
         hasTicketingPermission(userClaims, 'tickets:create');
}

export function canUpdateTickets(userClaims: UserClaims): boolean {
  return hasTicketingPermission(userClaims, 'tickets:write') ||
         hasTicketingPermission(userClaims, 'tickets:update');
}

export function canDeleteTickets(userClaims: UserClaims): boolean {
  return hasTicketingPermission(userClaims, 'tickets:admin');
}

export function getDefaultTeamForUser(userClaims: UserClaims): string | null {
  // Return first team if user has teams
  return userClaims.teams?.[0] || null;
}

export function getSLADueDate(firstResponseMinutes: number, businessHoursId?: string): Date {
  // For now, simple calculation - could be enhanced with business hours logic
  return new Date(Date.now() + firstResponseMinutes * 60 * 1000);
}

// Ticket routing logic
export function getDefaultAssignmentForTicket(ticket: any, userClaims: UserClaims): {
  team?: string;
  ownerId?: string;
} {
  const result: { team?: string; ownerId?: string } = {};
  
  // Auto-assign to team based on ticket type or company
  if (ticket.type === 'billing') {
    result.team = 'billing';
  } else if (ticket.type === 'delivery') {
    result.team = 'logistics';
  } else if (ticket.type === 'quality' || ticket.type === 'return') {
    result.team = 'quality';
  } else {
    result.team = 'support';
  }
  
  // If ticket is created by a team member, auto-assign to them
  if (userClaims.teams?.includes(result.team)) {
    result.ownerId = userClaims.userId;
  }
  
  return result;
}