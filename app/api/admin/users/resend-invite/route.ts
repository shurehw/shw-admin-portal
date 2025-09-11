import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { inviteId } = await request.json();
    
    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeWpqdmJxbXl5dWh6cG94bHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3OTUzMjksImV4cCI6MjA3MDM3MTMyOX0.yXS4pbap1yVfhidFCN4MZkZE4lbkF5yS9V-nR88V1kc',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value)
            })
          },
        },
      }
    );

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role - allow admins and managers
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAuthorized = profile && ['admin', 'sales_manager', 'cs_manager', 'production_manager'].includes(profile.role);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Only admins and managers can resend invites' }, { status: 403 });
    }

    // Get the invite details
    const actualInviteId = inviteId.replace('invite-', '');
    const { data: invite, error: fetchError } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('id', actualInviteId)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Update the invite's timestamp to mark it as resent
    const { error: updateError } = await supabase
      .from('pending_invites')
      .update({ 
        invited_at: new Date().toISOString(),
        status: 'pending' // Ensure it's still pending
      })
      .eq('id', actualInviteId);

    if (updateError) {
      console.error('Error updating invite:', updateError);
      return NextResponse.json({ error: 'Failed to resend invite' }, { status: 500 });
    }

    // Skip email sending if no SMTP credentials configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email sending skipped - no SMTP credentials configured');
      return NextResponse.json({ 
        success: true,
        message: `Invite marked as resent for ${invite.email} (email sending skipped)`,
        emailSent: false
      });
    }

    // Send the invitation email
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Get the app URL for the invite link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000';

    const roleLabel = invite.role.replace('_', ' ').charAt(0).toUpperCase() + 
                     invite.role.replace('_', ' ').slice(1);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          .reminder { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reminder: Welcome to SHW Admin Portal</h1>
          </div>
          <div class="content">
            <h2>Your invitation is still waiting!</h2>
            
            <div class="reminder">
              <strong>This is a reminder</strong> - You were previously invited to join the SHW Admin Portal.
            </div>
            
            <p>You've been invited to join as a <strong>${roleLabel}</strong>.</p>
            
            <p>To get started, simply click the button below and sign in with your Google account using this email address (${invite.email}).</p>
            
            <p style="text-align: center;">
              <a href="${appUrl}/admin/login" class="button">Accept Invitation & Sign In</a>
            </p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Click the link above to go to the login page</li>
              <li>Sign in with Google using your ${invite.email} email</li>
              <li>Your account will be automatically created with the ${roleLabel} role</li>
              <li>You'll have immediate access to the admin portal</li>
            </ul>
            
            <div class="footer">
              <p><strong>Need help?</strong> Contact your administrator or reply to this email.</p>
              <p>This invitation reminder was sent by an administrator of the SHW Admin Portal.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Reminder: Welcome to SHW Admin Portal!

This is a reminder - You were previously invited to join the SHW Admin Portal as a ${roleLabel}.

To get started, visit: ${appUrl}/admin/login

Sign in with Google using your ${invite.email} email address.

Your account will be automatically created with the ${roleLabel} role, and you'll have immediate access to the admin portal.

Need help? Contact your administrator.
    `;

    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'SHW Admin Portal'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
        to: invite.email,
        subject: 'Reminder: Invitation to SHW Admin Portal',
        text: emailText,
        html: emailHtml,
      });
      console.log(`Invitation reminder sent to ${invite.email}`);
      
      return NextResponse.json({ 
        success: true,
        message: `Invite resent to ${invite.email}`,
        emailSent: true
      });
    } catch (emailError) {
      console.error(`Failed to send reminder email to ${invite.email}:`, emailError);
      return NextResponse.json({ 
        success: false,
        message: `Failed to send email to ${invite.email}. Please check email configuration.`,
        emailSent: false,
        error: emailError
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in resend invite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}