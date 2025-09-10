import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await request.json();
    const testEmail = config.test_email || user.email;

    if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
      return NextResponse.json({ 
        error: 'Missing SMTP configuration. Please fill in all required fields.' 
      }, { status: 400 });
    }

    // Create transporter with user's configuration
    const transporter = nodemailer.createTransporter({
      host: config.smtp_host,
      port: parseInt(config.smtp_port || '587'),
      secure: config.smtp_port === '465', // true for 465, false for other ports
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
      },
    });

    // Prepare test email
    const fromAddress = config.from_address || config.smtp_user;
    const fromName = config.from_name || 'SHW Admin Portal';

    const testEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .success { background: #10b981; color: white; padding: 10px; border-radius: 4px; text-align: center; margin: 20px 0; }
          .details { background: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Configuration Test</h1>
          </div>
          <div class="content">
            <div class="success">
              ✅ Your email configuration is working correctly!
            </div>
            
            <p>This is a test email from your SHW Admin Portal to verify that your SMTP settings are configured properly.</p>
            
            <div class="details">
              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>SMTP Host:</strong> ${config.smtp_host}</li>
                <li><strong>SMTP Port:</strong> ${config.smtp_port}</li>
                <li><strong>From Address:</strong> ${fromAddress}</li>
                <li><strong>From Name:</strong> ${fromName}</li>
                <li><strong>Sent To:</strong> ${testEmail}</li>
                <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <p>You can now use these settings to send:</p>
            <ul>
              <li>User invitation emails</li>
              <li>Ticket notifications</li>
              <li>System alerts</li>
              <li>Customer communications</li>
            </ul>
            
            <div class="footer">
              <p>This test email was sent from the Email Settings page in your Admin Portal.</p>
              <p>If you received this email, your configuration is working properly!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const testEmailText = `
Email Configuration Test - SHW Admin Portal

✅ Your email configuration is working correctly!

This is a test email to verify that your SMTP settings are configured properly.

Configuration Details:
- SMTP Host: ${config.smtp_host}
- SMTP Port: ${config.smtp_port}
- From Address: ${fromAddress}
- From Name: ${fromName}
- Sent To: ${testEmail}
- Timestamp: ${new Date().toLocaleString()}

You can now use these settings to send user invitations, ticket notifications, and other system emails.

If you received this email, your configuration is working properly!
    `;

    try {
      // Send test email
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: testEmail,
        subject: '✅ Email Configuration Test - SHW Admin Portal',
        text: testEmailText,
        html: testEmailHtml,
        replyTo: config.reply_to || fromAddress,
      });

      console.log('Test email sent successfully:', info.messageId);

      return NextResponse.json({ 
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        messageId: info.messageId
      });
    } catch (emailError: any) {
      console.error('Failed to send test email:', emailError);
      
      // Provide helpful error messages
      let errorMessage = 'Failed to send test email. ';
      
      if (emailError.code === 'EAUTH') {
        errorMessage += 'Authentication failed. Please check your username and password. For Gmail, make sure you\'re using an App Password.';
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage += 'Could not connect to SMTP server. Please check your host and port settings.';
      } else if (emailError.code === 'ESOCKET') {
        errorMessage += 'Network error. Please check your internet connection and firewall settings.';
      } else if (emailError.message?.includes('Invalid login')) {
        errorMessage += 'Invalid credentials. For Gmail, use an App Password instead of your regular password.';
      } else {
        errorMessage += emailError.message || 'Please check your configuration and try again.';
      }
      
      return NextResponse.json({ 
        success: false,
        error: errorMessage,
        details: emailError.message
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in email test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}