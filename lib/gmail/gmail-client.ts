/**
 * Gmail Integration for Ticketing System
 * Handles both inbound and outbound email processing
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ticketingClient } from '../ticketing/supabase-client';

// Gmail API Configuration
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels'
];

export class GmailTicketingClient {
  private oauth2Client: OAuth2Client;
  private gmail: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://your-app.vercel.app/api/auth/google/callback'
    );

    // Set credentials if we have a refresh token
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Get authorization URL for initial setup
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Watch Gmail inbox for new emails
   */
  async watchInbox() {
    try {
      const response = await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/gmail-tickets`,
          labelIds: ['INBOX']
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error setting up Gmail watch:', error);
      throw error;
    }
  }

  /**
   * Process new email into ticket system
   */
  async processInboundEmail(messageId: string) {
    try {
      // Get the email message
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const headers = message.data.payload.headers;
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

      const from = getHeader('from');
      const subject = getHeader('subject') || 'No Subject';
      const messageIdHeader = getHeader('message-id');
      const inReplyTo = getHeader('in-reply-to');
      const references = getHeader('references');

      // Extract body
      const body = this.extractBody(message.data.payload);

      // Check if this is a reply to existing ticket
      const ticketNumber = this.extractTicketNumber(subject);
      
      if (ticketNumber) {
        // Add message to existing ticket
        const tickets = await ticketingClient.searchTickets(ticketNumber, 1);
        if (tickets.length > 0) {
          await ticketingClient.addTicketMessage({
            ticket_id: tickets[0].id,
            kind: 'public_reply',
            body: body.text || '',
            html_body: body.html,
            author_email: this.extractEmail(from),
            author_name: this.extractName(from),
            author_type: 'customer'
          });

          // Mark email as processed
          await this.labelAsProcessed(messageId);
          return { action: 'reply_added', ticketId: tickets[0].id };
        }
      }

      // Create new ticket
      const ticket = await ticketingClient.createTicket({
        org_id: 'email',
        subject: subject,
        description: body.text || body.html || '',
        priority: this.detectPriority(subject, body.text || ''),
        type: 'email_inquiry'
      });

      // Add the email as first message
      await ticketingClient.addTicketMessage({
        ticket_id: ticket.id,
        kind: 'public_reply',
        body: body.text || '',
        html_body: body.html,
        author_email: this.extractEmail(from),
        author_name: this.extractName(from),
        author_type: 'customer'
      });

      // Send auto-reply with ticket number
      await this.sendAutoReply(from, ticket.ticket_number, subject);

      // Label email as processed
      await this.labelAsProcessed(messageId);

      return { action: 'ticket_created', ticketId: ticket.id };
    } catch (error) {
      console.error('Error processing inbound email:', error);
      throw error;
    }
  }

  /**
   * Send email from ticket
   */
  async sendTicketEmail(
    ticketId: string,
    to: string,
    subject: string,
    body: string,
    isInternal: boolean = false
  ) {
    try {
      const ticket = await ticketingClient.getTicket(ticketId);
      if (!ticket) throw new Error('Ticket not found');

      // Format subject with ticket number
      const formattedSubject = `[#${ticket.ticket_number}] ${subject}`;

      // Create email
      const email = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `From: Support <${process.env.SUPPORT_EMAIL}>`,
        `Subject: ${formattedSubject}`,
        '',
        body
      ].join('\n');

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send via Gmail API
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });

      // Add message to ticket
      await ticketingClient.addTicketMessage({
        ticket_id: ticketId,
        kind: isInternal ? 'internal_note' : 'public_reply',
        body: body,
        html_body: body,
        author_id: 'system',
        author_name: 'Support Team',
        author_type: 'agent'
      });

      return response.data;
    } catch (error) {
      console.error('Error sending ticket email:', error);
      throw error;
    }
  }

  /**
   * Send auto-reply for new tickets
   */
  private async sendAutoReply(to: string, ticketNumber: number, originalSubject: string) {
    const subject = `Re: ${originalSubject} [#${ticketNumber}]`;
    const body = `
      <div style="font-family: Arial, sans-serif;">
        <p>Thank you for contacting our support team.</p>
        <p>Your request has been received and assigned ticket number <strong>#${ticketNumber}</strong>.</p>
        <p>We'll review your request and respond as soon as possible.</p>
        <br>
        <p>Best regards,<br>Support Team</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Please keep this ticket number in the subject line for all future correspondence about this issue.
        </p>
      </div>
    `;

    const email = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `From: Support <${process.env.SUPPORT_EMAIL}>`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
  }

  /**
   * Extract body from Gmail message
   */
  private extractBody(payload: any): { text?: string; html?: string } {
    const result: { text?: string; html?: string } = {};

    const extractFromParts = (parts: any[]): void => {
      parts.forEach(part => {
        if (part.mimeType === 'text/plain' && part.body.data) {
          result.text = Buffer.from(part.body.data, 'base64').toString();
        } else if (part.mimeType === 'text/html' && part.body.data) {
          result.html = Buffer.from(part.body.data, 'base64').toString();
        } else if (part.parts) {
          extractFromParts(part.parts);
        }
      });
    };

    if (payload.parts) {
      extractFromParts(payload.parts);
    } else if (payload.body?.data) {
      result.text = Buffer.from(payload.body.data, 'base64').toString();
    }

    return result;
  }

  /**
   * Extract ticket number from subject
   */
  private extractTicketNumber(subject: string): string | null {
    const match = subject.match(/\[#(\d+)\]/);
    return match ? match[1] : null;
  }

  /**
   * Extract email address from "Name <email>" format
   */
  private extractEmail(from: string): string {
    const match = from.match(/<(.+)>/);
    return match ? match[1] : from;
  }

  /**
   * Extract name from "Name <email>" format
   */
  private extractName(from: string): string {
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim() : '';
  }

  /**
   * Detect priority from email content
   */
  private detectPriority(subject: string, body: string): string {
    const content = `${subject} ${body}`.toLowerCase();
    
    if (content.includes('urgent') || content.includes('asap') || content.includes('emergency')) {
      return 'urgent';
    }
    if (content.includes('important') || content.includes('critical')) {
      return 'high';
    }
    return 'normal';
  }

  /**
   * Label email as processed
   */
  private async labelAsProcessed(messageId: string) {
    // Create label if it doesn't exist
    try {
      await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: 'Ticketing/Processed',
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show'
        }
      });
    } catch (error) {
      // Label might already exist
    }

    // Apply label to message
    const labels = await this.gmail.users.labels.list({ userId: 'me' });
    const processedLabel = labels.data.labels.find((l: any) => l.name === 'Ticketing/Processed');

    if (processedLabel) {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [processedLabel.id],
          removeLabelIds: ['INBOX']
        }
      });
    }
  }
}

// Export singleton instance
export const gmailClient = new GmailTicketingClient();