import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
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

async function getEmailTransporter() {
  // Configure based on your email provider (SMTP, SendGrid, etc.)
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function getEmailIdentity(team?: string): Promise<any> {
  const identity = await prisma.emailIdentity.findFirst({
    where: team ? { team, isDefault: true } : { isDefault: true },
  });

  return identity || {
    fromName: 'Customer Support',
    fromEmail: process.env.DEFAULT_FROM_EMAIL || 'support@company.com',
    signature: '\n\nBest regards,\nCustomer Support Team'
  };
}

function generateTicketEmailId(ticketId: string): string {
  return `ticket-${ticketId}@${process.env.EMAIL_DOMAIN || 'company.com'}`;
}

function generateMessageId(ticketId: string, messageId: string): string {
  return `<ticket-${ticketId}-${messageId}@${process.env.EMAIL_DOMAIN || 'company.com'}>`;
}

export async function POST(request: NextRequest) {
  try {
    const userClaims = verifyToken(request);
    
    const body = await request.json();
    const {
      ticketId,
      to,
      subject,
      body: messageBody,
      html,
      kind = 'public_reply', // 'public_reply' or 'internal_note'
      team
    } = body;

    if (!ticketId || !messageBody) {
      return NextResponse.json({ 
        error: 'ticketId and body are required' 
      }, { status: 400 });
    }

    // Get ticket details
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        company: {
          select: { email: true, companyName: true }
        },
        messages: {
          where: { emailMessageId: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ 
        error: 'Ticket not found' 
      }, { status: 404 });
    }

    // Only send emails for public replies
    if (kind !== 'public_reply') {
      // Just create the internal note
      const message = await prisma.ticketMessage.create({
        data: {
          ticketId,
          kind,
          channel: 'internal',
          body: messageBody,
          html,
          createdBy: userClaims.userId
        }
      });

      return NextResponse.json({ 
        success: true, 
        messageId: message.id,
        emailSent: false
      });
    }

    // Determine recipient
    const recipient = to || ticket.company?.email;
    if (!recipient) {
      return NextResponse.json({ 
        error: 'No recipient email address available' 
      }, { status: 400 });
    }

    // Get email identity for the team
    const emailIdentity = await getEmailIdentity(team || ticket.team || undefined);
    
    // Generate email headers for threading
    const ticketEmailId = generateTicketEmailId(ticketId);
    const messageId = generateMessageId(ticketId, Date.now().toString());
    
    // Build email references for proper threading
    const references = [];
    if (ticket.messageThreadId) {
      references.push(ticket.messageThreadId);
    }
    
    // Add previous message IDs from the thread
    for (const msg of ticket.messages) {
      if (msg.emailMessageId) {
        references.push(msg.emailMessageId);
      }
    }

    // Format subject with ticket number
    const emailSubject = ticket.subject.includes(`[#TKT-${ticketId}]`) ? 
      ticket.subject : 
      `[#TKT-${ticketId}] ${ticket.subject}`;

    // Create email body with signature
    const fullBody = messageBody + (emailIdentity.signature || '');
    const fullHtml = html ? 
      html + `<br><br>${emailIdentity.signature?.replace(/\n/g, '<br>') || ''}` : 
      fullBody.replace(/\n/g, '<br>');

    // Get email transporter
    const transporter = await getEmailTransporter();

    // Send email
    const emailResult = await transporter.sendMail({
      from: `${emailIdentity.fromName} <${emailIdentity.fromEmail}>`,
      to: recipient,
      subject: emailSubject,
      text: fullBody,
      html: fullHtml,
      messageId: messageId,
      references: references.join(' '),
      inReplyTo: references[references.length - 1] || ticketEmailId,
      headers: {
        'X-Ticket-ID': ticketId,
        'X-Priority': ticket.priority === 'urgent' ? '1' : 
                     ticket.priority === 'high' ? '2' : '3'
      }
    });

    // Save message to database
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        kind: 'public_reply',
        channel: 'email',
        body: messageBody,
        html,
        createdBy: userClaims.userId,
        emailMessageId: messageId,
        emailReferences: references
      }
    });

    // Update ticket status if it was new
    if (ticket.status === 'new') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'ack',
          firstResponseAt: new Date(),
          ownerId: userClaims.userId,
          updatedAt: new Date()
        }
      });

      // Log status change event
      await prisma.ticketEvent.create({
        data: {
          ticketId,
          eventType: 'status_changed',
          data: { from: 'new', to: 'ack', reason: 'first_response' },
          userId: userClaims.userId
        }
      });
    }

    // Log email sent event
    await prisma.ticketEvent.create({
      data: {
        ticketId,
        eventType: 'email_sent',
        data: {
          messageId: messageId,
          to: recipient,
          subject: emailSubject,
          providerMessageId: emailResult.messageId
        },
        userId: userClaims.userId
      }
    });

    return NextResponse.json({
      success: true,
      messageId: message.id,
      emailSent: true,
      emailMessageId: messageId,
      providerMessageId: emailResult.messageId
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // If email fails but we want to save the message anyway
    if (error.message?.includes('email') && body.ticketId && body.body) {
      try {
        const message = await prisma.ticketMessage.create({
          data: {
            ticketId: body.ticketId,
            kind: body.kind || 'public_reply',
            channel: 'internal', // Mark as internal since email failed
            body: body.body,
            html: body.html,
            createdBy: userClaims.userId
          }
        });

        return NextResponse.json({
          success: true,
          messageId: message.id,
          emailSent: false,
          error: 'Email delivery failed but message was saved'
        });
      } catch (dbError) {
        console.error('Error saving message after email failure:', dbError);
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}