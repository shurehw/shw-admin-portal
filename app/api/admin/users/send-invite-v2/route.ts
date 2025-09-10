import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { invites } = await request.json();
    
    if (!invites || !Array.isArray(invites)) {
      return NextResponse.json({ error: 'Invalid invites data' }, { status: 400 });
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

    // Check if user is admin or manager
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAuthorized = profile && ['admin', 'sales_manager', 'cs_manager', 'production_manager'].includes(profile.role);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Only admins and managers can send invites' }, { status: 403 });
    }

    // Store pending invites for role assignment
    const inviteRecords = invites.map(invite => ({
      email: invite.email.toLowerCase(),
      role: invite.role,
      status: 'pending',
      invited_by: user.id,
    }));

    const { data, error } = await supabase
      .from('pending_invites')
      .upsert(inviteRecords, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error creating invites:', error);
      return NextResponse.json({ error: 'Failed to create invites' }, { status: 500 });
    }

    // Determine which email service to use
    let emailsSent = 0;
    let emailsFailed = 0;
    const emailResults = [];

    // Option 1: Try Supabase Auth invite (for magic link)
    const useSupabaseAuth = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Option 2: Use Resend if available (for Vercel)
    const useResend = process.env.RESEND_API_KEY;
    
    // Option 3: Fallback to SMTP if configured
    const useSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (useSupabaseAuth) {
      // Use Supabase Auth to send invites
      console.log('Using Supabase Auth for invites');
      
      // Create admin client with service role
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

      for (const invite of invites) {
        try {
          // Generate invite link using Supabase Auth
          const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: invite.email,
            options: {
              redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/dashboard`,
            }
          });

          if (!inviteError && inviteData) {
            emailResults.push({ email: invite.email, status: 'sent', method: 'supabase' });
            emailsSent++;
          } else {
            emailResults.push({ email: invite.email, status: 'failed', error: inviteError });
            emailsFailed++;
          }
        } catch (err) {
          emailResults.push({ email: invite.email, status: 'failed', error: err });
          emailsFailed++;
        }
      }
    } else if (useResend) {
      // Use Resend API (best for Vercel)
      console.log('Using Resend for invites');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                     'http://localhost:3000';

      for (const invite of invites) {
        const roleLabel = invite.role.replace('_', ' ').charAt(0).toUpperCase() + 
                         invite.role.replace('_', ' ').slice(1);

        try {
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'SHW Admin Portal <onboarding@resend.dev>',
            to: [invite.email],
            subject: 'Invitation to SHW Admin Portal',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
                  .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Welcome to SHW Admin Portal</h1>
                  </div>
                  <div class="content">
                    <h2>You've been invited!</h2>
                    <p>You've been invited to join the SHW Admin Portal as a <strong>${roleLabel}</strong>.</p>
                    <p>To get started, click the button below and sign in with Google using this email address (${invite.email}).</p>
                    <p style="text-align: center;">
                      <a href="${appUrl}/admin/login" class="button">Accept Invitation & Sign In</a>
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          if (!emailError) {
            emailResults.push({ email: invite.email, status: 'sent', method: 'resend' });
            emailsSent++;
          } else {
            emailResults.push({ email: invite.email, status: 'failed', error: emailError });
            emailsFailed++;
          }
        } catch (err) {
          emailResults.push({ email: invite.email, status: 'failed', error: err });
          emailsFailed++;
        }
      }
    } else if (useSmtp) {
      // Fallback to SMTP (original implementation)
      console.log('Using SMTP for invites');
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      for (const invite of invites) {
        const roleLabel = invite.role.replace('_', ' ').charAt(0).toUpperCase() + 
                         invite.role.replace('_', ' ').slice(1);

        try {
          await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'SHW Admin Portal'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
            to: invite.email,
            subject: 'Invitation to SHW Admin Portal',
            html: `<p>You've been invited as a ${roleLabel}. Sign in at: ${appUrl}/admin/login</p>`,
          });
          
          emailResults.push({ email: invite.email, status: 'sent', method: 'smtp' });
          emailsSent++;
        } catch (err) {
          emailResults.push({ email: invite.email, status: 'failed', error: err });
          emailsFailed++;
        }
      }
    } else {
      // No email service configured - save to database only
      console.log('No email service configured - invites saved to database only');
      
      return NextResponse.json({ 
        success: true, 
        invites: data,
        emailsSent: 0,
        emailsFailed: 0,
        message: `Invites saved. Configure email service to send notifications.`,
        requiresConfig: true
      });
    }

    return NextResponse.json({ 
      success: true, 
      invites: data,
      emailsSent,
      emailsFailed,
      emailResults,
      message: `Successfully processed ${data?.length || 0} invites. Emails sent: ${emailsSent}` 
    });
  } catch (error) {
    console.error('Error in send-invite API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}