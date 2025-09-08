import { NextRequest, NextResponse } from 'next/server';

interface SlackNotification {
  eventType: 'ticket_created' | 'ticket_breaching' | 'ticket_closed' | 'ticket_escalated';
  ticket: any;
  user?: string;
  message?: string;
}

async function sendSlackMessage(webhookUrl: string, payload: any) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }

  return response.json();
}

function formatSlackMessage(notification: SlackNotification): any {
  const { eventType, ticket, user, message } = notification;
  
  const priorityEmoji = {
    urgent: '🚨',
    high: '⚠️',
    normal: '📋',
    low: '📝'
  };

  const statusEmoji = {
    new: '🆕',
    ack: '👀',
    in_progress: '🔄',
    waiting_customer: '⏳',
    closed: '✅',
    resolved: '✅'
  };

  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/tickets?id=${ticket.id}`;
  
  let color = '#36a64f'; // default green
  let title = '';
  let text = '';

  switch (eventType) {
    case 'ticket_created':
      color = '#3498db'; // blue
      title = '🎫 New Ticket Created';
      text = `*${ticket.subject}*\n${ticket.company?.companyName || 'Unknown Company'}`;
      break;
      
    case 'ticket_breaching':
      color = '#e74c3c'; // red
      title = '🚨 SLA Breach Alert';
      text = `*${ticket.subject}*\nTicket is breaching SLA and needs immediate attention!`;
      break;
      
    case 'ticket_closed':
      color = '#27ae60'; // green
      title = '✅ Ticket Resolved';
      text = `*${ticket.subject}*\nTicket has been successfully resolved by ${user || 'agent'}.`;
      break;
      
    case 'ticket_escalated':
      color = '#f39c12'; // orange
      title = '⚠️ Ticket Escalated';
      text = `*${ticket.subject}*\nTicket has been escalated for management review.`;
      break;
  }

  return {
    attachments: [
      {
        color: color,
        title: title,
        text: text,
        fields: [
          {
            title: 'Ticket ID',
            value: `TKT-${ticket.id}`,
            short: true
          },
          {
            title: 'Priority',
            value: `${priorityEmoji[ticket.priority]} ${ticket.priority.toUpperCase()}`,
            short: true
          },
          {
            title: 'Status',
            value: `${statusEmoji[ticket.status]} ${ticket.status.replace('_', ' ').toUpperCase()}`,
            short: true
          },
          {
            title: 'Type',
            value: ticket.type.toUpperCase(),
            short: true
          },
          {
            title: 'Company',
            value: ticket.company?.companyName || 'N/A',
            short: true
          },
          {
            title: 'Assigned To',
            value: ticket.ownerId || 'Unassigned',
            short: true
          }
        ],
        actions: [
          {
            type: 'button',
            text: 'View Ticket',
            url: ticketUrl,
            style: 'primary'
          }
        ],
        footer: 'Ticket System',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SlackNotification;
    
    // Get Slack webhook URL from environment or database
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('Slack webhook URL not configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Slack webhook URL not configured' 
      });
    }

    // Format message for Slack
    const slackPayload = formatSlackMessage(body);
    
    // Send to Slack
    await sendSlackMessage(webhookUrl, slackPayload);
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Error sending Slack notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Utility function to trigger Slack notifications (can be called from other parts of the app)
export async function triggerSlackNotification(notification: SlackNotification) {
  try {
    const response = await fetch('/api/tickets/integrations/slack/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to trigger Slack notification:', error);
    return false;
  }
}