import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-client';
import { collection, addDoc } from 'firebase/firestore';
import crypto from 'crypto';

interface TicketWebhookPayload {
  eventType: string;
  ticketId: string;
  timestamp: string;
  data: {
    ticket?: {
      id: string;
      subject: string;
      status: string;
      priority: string;
      type: string;
      companyId?: string;
      contactId?: string;
    };
    changes?: {
      [key: string]: {
        from: any;
        to: any;
      };
    };
    user?: {
      id: string;
      name: string;
    };
    message?: string;
  };
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!process.env.WEBHOOK_SECRET) {
    console.warn('WEBHOOK_SECRET not configured, skipping signature verification');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
    
  return `sha256=${expectedSignature}` === signature;
}

function formatEventMessage(eventType: string, payload: TicketWebhookPayload): string {
  const { data } = payload;
  const ticket = data.ticket;
  const user = data.user?.name || 'System';

  switch (eventType) {
    case 'ticket_created':
      return `${user} created a new ${ticket?.type || 'support'} ticket: "${ticket?.subject}"`;
      
    case 'ticket_status_changed':
      if (data.changes?.status) {
        const { from, to } = data.changes.status;
        return `${user} changed ticket status from "${from}" to "${to}"`;
      }
      return `${user} updated ticket status`;
      
    case 'ticket_priority_changed':
      if (data.changes?.priority) {
        const { from, to } = data.changes.priority;
        return `${user} changed ticket priority from "${from}" to "${to}"`;
      }
      return `${user} updated ticket priority`;
      
    case 'ticket_assigned':
      if (data.changes?.ownerId) {
        const { to } = data.changes.ownerId;
        return `${user} assigned ticket to ${to}`;
      }
      return `${user} assigned ticket`;
      
    case 'ticket_replied':
      return `${user} replied to ticket`;
      
    case 'ticket_noted':
      return `${user} added an internal note to ticket`;
      
    case 'ticket_closed':
      return `${user} closed ticket`;
      
    case 'ticket_reopened':
      return `${user} reopened ticket`;
      
    case 'ticket_escalated':
      return `${user} escalated ticket to management`;
      
    default:
      return `${user} performed action on ticket`;
  }
}

function getEventPriority(eventType: string): 'low' | 'medium' | 'high' {
  const highPriorityEvents = ['ticket_created', 'ticket_escalated', 'ticket_closed'];
  const mediumPriorityEvents = ['ticket_status_changed', 'ticket_assigned', 'ticket_replied'];
  
  if (highPriorityEvents.includes(eventType)) return 'high';
  if (mediumPriorityEvents.includes(eventType)) return 'medium';
  return 'low';
}

function getEventIcon(eventType: string): string {
  const iconMap: Record<string, string> = {
    'ticket_created': '🎫',
    'ticket_status_changed': '🔄',
    'ticket_priority_changed': '⚡',
    'ticket_assigned': '👤',
    'ticket_replied': '💬',
    'ticket_noted': '📝',
    'ticket_closed': '✅',
    'ticket_reopened': '🔓',
    'ticket_escalated': '⚠️',
    'ticket_breaching': '🚨'
  };
  
  return iconMap[eventType] || '📋';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');

    // Verify webhook signature
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload: TicketWebhookPayload = JSON.parse(body);
    const { eventType, ticketId, timestamp, data } = payload;

    console.log(`Received ticket webhook: ${eventType} for ticket ${ticketId}`);

    // Create timeline events for relevant entities
    const timelineEvents: any[] = [];

    // Company timeline event
    if (data.ticket?.companyId) {
      timelineEvents.push({
        entityType: 'company',
        entityId: data.ticket.companyId,
        eventType: 'ticket_activity',
        title: `Ticket Activity - ${data.ticket.subject}`,
        description: formatEventMessage(eventType, payload),
        priority: getEventPriority(eventType),
        icon: getEventIcon(eventType),
        metadata: {
          ticketId,
          ticketSubject: data.ticket.subject,
          ticketStatus: data.ticket.status,
          ticketPriority: data.ticket.priority,
          originalEventType: eventType,
          changes: data.changes,
          actionUrl: `/admin/tickets?id=${ticketId}`
        },
        timestamp: new Date(timestamp),
        createdAt: new Date(),
        createdBy: data.user?.id || 'system'
      });
    }

    // Contact timeline event
    if (data.ticket?.contactId) {
      timelineEvents.push({
        entityType: 'contact',
        entityId: data.ticket.contactId,
        eventType: 'ticket_activity',
        title: `Ticket Activity - ${data.ticket.subject}`,
        description: formatEventMessage(eventType, payload),
        priority: getEventPriority(eventType),
        icon: getEventIcon(eventType),
        metadata: {
          ticketId,
          ticketSubject: data.ticket.subject,
          ticketStatus: data.ticket.status,
          ticketPriority: data.ticket.priority,
          originalEventType: eventType,
          changes: data.changes,
          actionUrl: `/admin/tickets?id=${ticketId}`
        },
        timestamp: new Date(timestamp),
        createdAt: new Date(),
        createdBy: data.user?.id || 'system'
      });
    }

    // Save timeline events to Firestore
    for (const event of timelineEvents) {
      try {
        await addDoc(collection(db, 'crm_timeline_events'), event);
        console.log(`Created timeline event for ${event.entityType}:${event.entityId}`);
      } catch (error) {
        console.error('Error saving timeline event:', error);
      }
    }

    // Invalidate CRM caches for the affected entities
    // This would trigger a cache refresh for the ticketing widgets
    if (data.ticket?.companyId) {
      // In a real implementation, you might use Redis or another cache invalidation mechanism
      console.log(`Invalidating cache for company: ${data.ticket.companyId}`);
    }
    
    if (data.ticket?.contactId) {
      console.log(`Invalidating cache for contact: ${data.ticket.contactId}`);
    }

    return NextResponse.json({ 
      success: true, 
      eventsCreated: timelineEvents.length 
    });

  } catch (error: any) {
    console.error('Error processing ticket webhook:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'crm-ticket-webhook',
    timestamp: new Date().toISOString()
  });
}