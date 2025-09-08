import { NextRequest, NextResponse } from 'next/server';
import { gmailClient } from '@/lib/gmail/gmail-client';

/**
 * Gmail Push Notification Webhook
 * Receives notifications when new emails arrive
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Decode the Pub/Sub message
    const message = JSON.parse(
      Buffer.from(body.message.data, 'base64').toString()
    );
    
    console.log('Gmail webhook received:', message);
    
    // Process the email history
    if (message.historyId) {
      // Get recent messages
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${message.historyId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`
          }
        }
      );
      
      const history = await response.json();
      
      // Process each new message
      for (const item of history.history || []) {
        if (item.messagesAdded) {
          for (const added of item.messagesAdded) {
            await gmailClient.processInboundEmail(added.message.id);
          }
        }
      }
    }
    
    return NextResponse.json({ status: 'processed' });
  } catch (error: any) {
    console.error('Gmail webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook is working
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Gmail webhook endpoint ready',
    timestamp: new Date().toISOString()
  });
}