# Email Configuration for User Invitations

## Setup Instructions

The user invitation system is now configured to send actual email invitations. To enable email sending, you need to configure SMTP settings in your `.env.local` file.

### Gmail Configuration (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Scroll down and click on "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Update `.env.local`**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM_NAME=SHW Admin Portal
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

### Production Email Service (SendGrid, Mailgun, etc.)

For production, consider using a dedicated email service:

#### SendGrid Example:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM_NAME=SHW Admin Portal
EMAIL_FROM_ADDRESS=noreply@shurehw.com
```

#### Office 365 Example:
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@shurehw.com
SMTP_PASS=your-password
EMAIL_FROM_NAME=SHW Admin Portal
EMAIL_FROM_ADDRESS=your-email@shurehw.com
```

## Features Implemented

### 1. Send Invitations
- Sends HTML-formatted invitation emails
- Includes role information and clear instructions
- Provides direct link to login page
- Tracks email sending status

### 2. Resend Invitations
- Sends reminder emails with updated timestamp
- Same format as original invitation
- Clearly marked as a reminder

### 3. Email Content
- Professional HTML template with SHW branding
- Mobile-responsive design
- Clear call-to-action button
- Step-by-step instructions for new users
- Fallback plain text version

## Testing

1. Configure your SMTP settings in `.env.local`
2. Restart your development server
3. Go to the Users page and click "Invite Users"
4. Enter an email address and select a role
5. Click "Send Invites"
6. Check the recipient's inbox for the invitation email

## Troubleshooting

### Common Issues:

1. **"Failed to send email" error**:
   - Verify SMTP credentials are correct
   - Check if app password is being used (for Gmail)
   - Ensure firewall/antivirus isn't blocking SMTP ports

2. **Emails going to spam**:
   - Use a verified sender domain
   - Set up SPF/DKIM records for your domain
   - Use a reputable email service for production

3. **Connection timeout**:
   - Check if SMTP_PORT is correct (usually 587 for TLS)
   - Verify SMTP_HOST is accessible from your network

## Environment Variables

Add these to your Vercel environment variables for production:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM_NAME`
- `EMAIL_FROM_ADDRESS`
- `NEXT_PUBLIC_APP_URL` (your production URL, e.g., https://admin.shurehw.com)

## Security Notes

- Never commit SMTP credentials to version control
- Use environment variables for all sensitive data
- Consider using a dedicated email service for production
- Implement rate limiting to prevent abuse
- Monitor email bounce rates and delivery status