import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SLAStatus {
  ticketId: string;
  type: 'first_response' | 'resolution';
  dueDate: Date;
  timeRemaining: number; // in minutes
  isBreached: boolean;
  breachTime?: number; // minutes overdue if breached
}

export interface BusinessHours {
  timezone: string;
  schedule: {
    [key: string]: { start: string; end: string } | null;
  };
}

/**
 * Calculate business minutes between two dates
 */
function calculateBusinessMinutes(start: Date, end: Date, businessHours?: BusinessHours): number {
  if (!businessHours) {
    // If no business hours defined, treat all time as business time
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  // This is a simplified implementation
  // In production, you'd want a more sophisticated business hours calculator
  // that accounts for holidays, different timezones, etc.
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let businessMinutes = 0;
  let current = new Date(start);

  while (current < end) {
    const dayName = days[current.getDay()];
    const daySchedule = businessHours.schedule[dayName];

    if (daySchedule) {
      const [startHour, startMin] = daySchedule.start.split(':').map(Number);
      const [endHour, endMin] = daySchedule.end.split(':').map(Number);
      
      const dayStart = new Date(current);
      dayStart.setHours(startHour, startMin, 0, 0);
      
      const dayEnd = new Date(current);
      dayEnd.setHours(endHour, endMin, 0, 0);
      
      const periodStart = current > dayStart ? current : dayStart;
      const periodEnd = end < dayEnd ? end : dayEnd;
      
      if (periodStart < periodEnd) {
        businessMinutes += Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60));
      }
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return businessMinutes;
}

/**
 * Get SLA status for all active tickets
 */
export async function getAllSLAStatus(): Promise<SLAStatus[]> {
  const tickets = await prisma.ticket.findMany({
    where: {
      status: {
        not: 'closed'
      },
      slaId: {
        not: null
      }
    },
    include: {
      slaPolicy: {
        include: {
          businessHours: true
        }
      }
    }
  });

  const now = new Date();
  const slaStatuses: SLAStatus[] = [];

  for (const ticket of tickets) {
    if (!ticket.slaPolicy) continue;

    const businessHours = ticket.slaPolicy.businessHours ? {
      timezone: ticket.slaPolicy.businessHours.timezone,
      schedule: {
        sunday: ticket.slaPolicy.businessHours.sunday as any,
        monday: ticket.slaPolicy.businessHours.monday as any,
        tuesday: ticket.slaPolicy.businessHours.tuesday as any,
        wednesday: ticket.slaPolicy.businessHours.wednesday as any,
        thursday: ticket.slaPolicy.businessHours.thursday as any,
        friday: ticket.slaPolicy.businessHours.friday as any,
        saturday: ticket.slaPolicy.businessHours.saturday as any,
      }
    } : undefined;

    // Check first response SLA
    if (!ticket.firstResponseAt) {
      const responseDue = new Date(ticket.createdAt.getTime() + ticket.slaPolicy.firstResponseMinutes * 60 * 1000);
      const timeRemaining = Math.floor((responseDue.getTime() - now.getTime()) / (1000 * 60));
      const isBreached = now > responseDue;

      slaStatuses.push({
        ticketId: ticket.id,
        type: 'first_response',
        dueDate: responseDue,
        timeRemaining,
        isBreached,
        breachTime: isBreached ? Math.abs(timeRemaining) : undefined
      });
    }

    // Check resolution SLA
    if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
      const resolutionDue = new Date(ticket.createdAt.getTime() + ticket.slaPolicy.resolveMinutes * 60 * 1000);
      const timeRemaining = Math.floor((resolutionDue.getTime() - now.getTime()) / (1000 * 60));
      const isBreached = now > resolutionDue;

      slaStatuses.push({
        ticketId: ticket.id,
        type: 'resolution',
        dueDate: resolutionDue,
        timeRemaining,
        isBreached,
        breachTime: isBreached ? Math.abs(timeRemaining) : undefined
      });
    }
  }

  return slaStatuses;
}

/**
 * Get tickets that are breaching SLA soon (within specified minutes)
 */
export async function getBreachingTickets(withinMinutes: number = 120): Promise<any[]> {
  const slaStatuses = await getAllSLAStatus();
  const breachingTickets = slaStatuses.filter(sla => 
    sla.timeRemaining <= withinMinutes && sla.timeRemaining > 0
  );

  // Get full ticket details for breaching tickets
  const ticketIds = breachingTickets.map(sla => sla.ticketId);
  
  if (ticketIds.length === 0) return [];

  const tickets = await prisma.ticket.findMany({
    where: {
      id: {
        in: ticketIds
      }
    },
    include: {
      company: {
        select: { companyName: true, email: true }
      },
      slaPolicy: true
    }
  });

  return tickets.map(ticket => {
    const slaStatus = breachingTickets.find(sla => sla.ticketId === ticket.id);
    return {
      ...ticket,
      slaStatus
    };
  });
}

/**
 * Get tickets that have already breached SLA
 */
export async function getBreachedTickets(): Promise<any[]> {
  const slaStatuses = await getAllSLAStatus();
  const breachedTickets = slaStatuses.filter(sla => sla.isBreached);

  const ticketIds = breachedTickets.map(sla => sla.ticketId);
  
  if (ticketIds.length === 0) return [];

  const tickets = await prisma.ticket.findMany({
    where: {
      id: {
        in: ticketIds
      }
    },
    include: {
      company: {
        select: { companyName: true, email: true }
      },
      slaPolicy: true
    }
  });

  return tickets.map(ticket => {
    const slaStatus = breachedTickets.find(sla => sla.ticketId === ticket.id);
    return {
      ...ticket,
      slaStatus
    };
  });
}

/**
 * Update SLA due dates when priority changes
 */
export async function updateSLAForPriorityChange(ticketId: string, newPriority: string): Promise<void> {
  const slaPolicy = await prisma.slaPolicy.findFirst({
    where: { priority: newPriority }
  });

  if (!slaPolicy) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId }
  });

  if (!ticket) return;

  const newSlaDue = ticket.firstResponseAt ? 
    new Date(ticket.createdAt.getTime() + slaPolicy.resolveMinutes * 60 * 1000) :
    new Date(ticket.createdAt.getTime() + slaPolicy.firstResponseMinutes * 60 * 1000);

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      slaId: slaPolicy.id,
      slaDue: newSlaDue
    }
  });
}

/**
 * Check and send SLA breach notifications
 */
export async function checkAndNotifyBreaches(): Promise<void> {
  const breachingTickets = await getBreachingTickets(30); // 30 minutes warning
  const breachedTickets = await getBreachedTickets();

  // Send notifications for tickets breaching soon
  for (const ticket of breachingTickets) {
    await sendSLANotification(ticket, 'warning');
  }

  // Send notifications for tickets that have breached
  for (const ticket of breachedTickets) {
    // Only send breach notification once (check if we've already notified)
    const existingEvent = await prisma.ticketEvent.findFirst({
      where: {
        ticketId: ticket.id,
        eventType: 'sla_breached'
      }
    });

    if (!existingEvent) {
      await sendSLANotification(ticket, 'breach');
      
      // Log the breach event
      await prisma.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          eventType: 'sla_breached',
          data: {
            type: ticket.slaStatus.type,
            breachTime: ticket.slaStatus.breachTime,
            dueDate: ticket.slaStatus.dueDate
          },
          userId: null
        }
      });
    }
  }
}

/**
 * Send SLA notification (Slack, email, etc.)
 */
async function sendSLANotification(ticket: any, type: 'warning' | 'breach'): Promise<void> {
  try {
    // Send Slack notification
    const eventType = type === 'breach' ? 'ticket_breaching' : 'ticket_escalated';
    
    await fetch('/api/tickets/integrations/slack/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        ticket,
        message: type === 'breach' ? 
          'SLA has been breached!' : 
          `SLA will breach in ${ticket.slaStatus.timeRemaining} minutes`
      }),
    });

    // Could also send email notifications to managers here
    
  } catch (error) {
    console.error('Failed to send SLA notification:', error);
  }
}