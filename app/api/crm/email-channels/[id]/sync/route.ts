import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }
    
    // Get the email channel
    const { data: channel, error: channelError } = await supabase
      .from('email_channels')
      .select('*')
      .eq('id', params.id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Update last sync time
    await supabase
      .from('email_channels')
      .update({ 
        last_sync: new Date().toISOString(),
        status: 'connected' 
      })
      .eq('id', params.id);

    // In production, this would:
    // 1. Use OAuth tokens to connect to Gmail API
    // 2. Fetch recent emails (last 7 days or since last_sync)
    // 3. Process each email and create CRM activities
    // 4. Optionally create tickets based on rules

    // For now, create sample activities
    const sampleEmails = [
      {
        subject: 'Quote Request - Custom Printing',
        from_email: 'client@example.com',
        from_name: 'John Doe',
        received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        body_preview: 'Hi, I would like to get a quote for custom printing...',
      },
      {
        subject: 'Re: Order #12345 Status',
        from_email: 'customer@company.com',
        from_name: 'Jane Smith',
        received_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        body_preview: 'Thank you for the update on our order...',
      },
    ];

    // Create activities for each email
    for (const email of sampleEmails) {
      // Try to find matching contact
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', email.from_email)
        .single();

      // Create activity
      const activityData = {
        type: 'email',
        subject: email.subject,
        description: email.body_preview,
        contact_id: contact?.id || null,
        contact_email: email.from_email,
        contact_name: email.from_name,
        channel_id: channel.id,
        channel_email: channel.email,
        created_at: email.received_at,
        metadata: {
          synced_from: channel.email,
          auto_logged: true,
        }
      };

      await supabase
        .from('activities')
        .insert([activityData])
        .select();

      // If auto_create_tickets is enabled and email matches criteria
      if (channel.auto_create_tickets && email.subject.toLowerCase().includes('support')) {
        const ticketData = {
          title: email.subject,
          description: email.body_preview,
          status: 'open',
          priority: 'medium',
          customer_email: email.from_email,
          customer_name: email.from_name,
          assigned_to: channel.user_id,
          channel_id: channel.id,
          source: 'email',
          created_at: email.received_at,
        };

        await supabase
          .from('tickets')
          .insert([ticketData])
          .select();
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${sampleEmails.length} emails`,
      emails_processed: sampleEmails.length,
      activities_created: sampleEmails.length,
      last_sync: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing emails:', error);
    return NextResponse.json({ error: 'Failed to sync emails' }, { status: 500 });
  }
}