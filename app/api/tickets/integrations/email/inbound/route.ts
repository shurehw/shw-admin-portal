import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import logger from '@/lib/logger';

const prisma = new PrismaClient();

interface InboundEmail {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  references?: string[];
  inReplyTo?: string;
  attachments?: any[];
  timestamp: string;
}

function parseTicketNumberFromSubject(subject: string): string | null {
  const match = subject.match(/\[#(TKT-\d+)\]/);
  return match ? match[1] : null;
}

function findTicketByEmailThread(references: string[], inReplyTo?: string): Promise<any> {
  const emailIds = [...(references || []), ...(inReplyTo ? [inReplyTo] : [])];
  
  if (emailIds.length === 0) {
    return Promise.resolve(null);
  }

  return prisma.ticketMessage.findFirst({
    where: {
      emailMessageId: {
        in: emailIds
      }
    },
    include: {
      ticket: true
    }
  });
}

async function getOrCreateCustomer(fromEmail: string): Promise<any> {
  // Try to find existing customer by email
  let customer = await prisma.b2BCustomer.findUnique({
    where: { email: fromEmail }
  });

  if (!customer) {
    // Try to find by company user email
    const companyUser = await prisma.companyUser.findUnique({
      where: { email: fromEmail },
      include: { customer: true }
    });

    if (companyUser) {
      customer = companyUser.customer;
    }
  }

  return customer;
}

function extractDomainFromEmail(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

function isFromAllowedDomain(email: string): boolean {
  const allowedDomains = [
    'marriott.com',
    'hilton.com',
    'ihg.com',
    'hyatt.com',
    'wyndham.com'
    // Add more allowed domains as needed
  ];
  
  const domain = extractDomainFromEmail(email);
  return allowedDomains.includes(domain);
}

function determineTicketType(subject: string, body: string): string {
  const content = `${subject} ${body}`.toLowerCase();
  
  if (content.includes('bill') || content.includes('invoice') || content.includes('payment')) {
    return 'billing';
  }
  
  if (content.includes('deliver') || content.includes('ship') || content.includes('tracking')) {
    return 'delivery';
  }
  
  if (content.includes('return') || content.includes('refund') || content.includes('exchange')) {
    return 'return';
  }
  
  if (content.includes('quality') || content.includes('defect') || content.includes('damage')) {
    return 'quality';
  }
  
  return 'support';
}

function determinePriority(subject: string, body: string): string {
  const content = `${subject} ${body}`.toLowerCase();
  
  if (content.includes('urgent') || content.includes('asap') || content.includes('emergency')) {
    return 'urgent';
  }
  
  if (content.includes('important') || content.includes('priority') || content.includes('rush')) {
    return 'high';
  }
  
  return 'normal';
}

async function applyRoutingRules(ticketData: any): Promise<any> {
  const rules = await prisma.routingRule.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' }
  });

  let updates: any = {};

  for (const rule of rules) {
    const conditions = rule.conditions as any;
    let matches = true;

    // Check if ticket matches rule conditions
    if (conditions.type && ticketData.type !== conditions.type) {
      matches = false;
    }

    if (conditions.priority && ticketData.priority !== conditions.priority) {
      matches = false;
    }

    if (conditions.domain) {
      const domain = extractDomainFromEmail(ticketData.fromEmail || '');
      if (domain !== conditions.domain) {
        matches = false;
      }
    }

    if (matches) {
      const actions = rule.actions as any[];
      
      for (const action of actions) {
        switch (action.type) {
          case 'assign_team':
            updates.team = action.value;
            break;
          case 'set_priority':
            updates.priority = action.value;
            break;
          case 'assign_user':
            updates.ownerId = action.value;
            break;
        }
      }
      
      break; // Apply only the first matching rule
    }
  }

  return { ...ticketData, ...updates };
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature and body
    const signature = request.headers.get('x-webhook-signature');
    const body = await request.text();
    
    // Verify webhook signature if secret is configured
    if (process.env.EMAIL_WEBHOOK_SECRET) {
      if (!signature) {
        logger.error('Missing webhook signature');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.EMAIL_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      
      // Compare signatures in a timing-safe manner
      const providedSignature = signature.replace('sha256=', '');
      if (!crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature)
      )) {
        logger.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      logger.warn('EMAIL_WEBHOOK_SECRET not configured - skipping signature verification');
    }
    
    const emailData: InboundEmail = JSON.parse(body);
    
    // Check if email is from an allowed domain
    if (!isFromAllowedDomain(emailData.from)) {
      logger.info(`Ignoring email from non-allowed domain: ${emailData.from}`);
      return NextResponse.json({ success: true, action: 'ignored' });
    }

    // Try to find existing ticket
    let ticket = null;
    
    // Method 1: Check for ticket number in subject
    const ticketNumber = parseTicketNumberFromSubject(emailData.subject);
    if (ticketNumber) {
      ticket = await prisma.ticket.findFirst({
        where: { 
          OR: [
            { id: ticketNumber },
            { subject: { contains: ticketNumber } }
          ]
        }
      });
    }
    
    // Method 2: Check email references for existing thread
    if (!ticket) {
      const messageWithTicket = await findTicketByEmailThread(
        emailData.references || [], 
        emailData.inReplyTo
      );
      
      if (messageWithTicket) {
        ticket = messageWithTicket.ticket;
      }
    }

    if (ticket) {
      // Reply to existing ticket
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          kind: 'public_reply',
          channel: 'email',
          body: emailData.body,
          html: emailData.html,
          attachments: emailData.attachments || [],
          createdBy: emailData.from,
          emailMessageId: emailData.messageId,
          emailReferences: emailData.references || []
        }
      });

      // Update ticket status if it was closed
      if (ticket.status === 'closed' || ticket.status === 'resolved') {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { 
            status: 'ack',
            updatedAt: new Date()
          }
        });

        // Log reopen event
        await prisma.ticketEvent.create({
          data: {
            ticketId: ticket.id,
            eventType: 'reopened',
            data: { reason: 'customer_reply', channel: 'email' },
            userId: null
          }
        });
      }

      // Log message event
      await prisma.ticketEvent.create({
        data: {
          ticketId: ticket.id,
          eventType: 'customer_replied',
          data: { 
            channel: 'email', 
            messageId: emailData.messageId,
            from: emailData.from
          },
          userId: null
        }
      });

      return NextResponse.json({ 
        success: true, 
        action: 'reply_added', 
        ticketId: ticket.id 
      });
      
    } else {
      // Create new ticket
      const customer = await getOrCreateCustomer(emailData.from);
      const ticketType = determineTicketType(emailData.subject, emailData.body);
      const priority = determinePriority(emailData.subject, emailData.body);

      // Get SLA policy for the priority
      const slaPolicy = await prisma.slaPolicy.findFirst({
        where: { priority }
      });

      let ticketData: any = {
        orgId: customer?.id || 'default', // You might want to determine this differently
        subject: emailData.subject,
        body: emailData.body,
        type: ticketType,
        status: 'new',
        priority: priority,
        channel: 'email',
        companyId: customer?.id,
        slaId: slaPolicy?.id,
        slaDue: slaPolicy ? new Date(Date.now() + slaPolicy.firstResponseMinutes * 60 * 1000) : null,
        messageThreadId: emailData.messageId,
        fromEmail: emailData.from
      };

      // Apply routing rules
      ticketData = await applyRoutingRules(ticketData);

      // Remove non-database fields
      const { fromEmail, ...createData } = ticketData;

      const newTicket = await prisma.ticket.create({
        data: createData
      });

      // Create initial message
      await prisma.ticketMessage.create({
        data: {
          ticketId: newTicket.id,
          kind: 'public_reply',
          channel: 'email',
          body: emailData.body,
          html: emailData.html,
          attachments: emailData.attachments || [],
          createdBy: emailData.from,
          emailMessageId: emailData.messageId,
          emailReferences: emailData.references || []
        }
      });

      // Log creation event
      await prisma.ticketEvent.create({
        data: {
          ticketId: newTicket.id,
          eventType: 'created',
          data: { 
            channel: 'email',
            priority: priority,
            type: ticketType,
            from: emailData.from,
            messageId: emailData.messageId
          },
          userId: null
        }
      });

      return NextResponse.json({ 
        success: true, 
        action: 'ticket_created', 
        ticketId: newTicket.id 
      });
    }

  } catch (error: any) {
    logger.error('Error processing inbound email:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}