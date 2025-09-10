# Supabase Google OAuth Setup Guide

## Overview
This app uses Supabase Authentication with Google OAuth. Here's how to set it up properly.

## Step 1: Gmail SMTP Configuration (For Sending Emails)

### 1.1 Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification" 
3. Follow the prompts to enable it

### 1.2 Generate App Password
1. After enabling 2FA, go back to Security settings
2. Click on "2-Step Verification"
3. Scroll down and click on "App passwords"
4. Select "Mail" from the dropdown
5. Click "Generate"
6. Copy the 16-character password (no spaces)

### 1.3 Update .env.local
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM_NAME=SHW Admin Portal
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

## Step 2: Supabase Google OAuth Setup

### 2.1 Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project (or create one if needed)
3. Go to Authentication → Providers

### 2.2 Enable Google Provider
1. Find "Google" in the list of providers
2. Toggle it ON
3. You'll see fields for:
   - Client ID (currently empty)
   - Client Secret (currently empty)
   - Authorized Client IDs (optional)

### 2.3 Get Your Callback URL
1. Copy the Callback URL shown (it will look like):
   ```
   https://ifyjjvbqmyyuhzpoxlsl.supabase.co/auth/v1/callback
   ```
2. Save this URL - you'll need it for Google Console

## Step 3: Google Cloud Console Setup

### 3.1 Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name it "SHW Admin Portal" 
4. Click "Create"

### 3.2 Enable Required APIs
1. Go to "APIs & Services" → "Library"
2. Search and enable:
   - Google+ API
   - Google Identity Toolkit API

### 3.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (or Internal if using Google Workspace)
3. Fill in:
   - App name: SHW Admin Portal
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
4. Add Authorized domains:
   - shurehw.com
   - shureprint.com
   - supabase.co (for the callback)
5. Add scopes:
   - .../auth/userinfo.email
   - .../auth/userinfo.profile
   - openid
6. Add test users if needed
7. Save and continue

### 3.4 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Name: "SHW Admin Portal Supabase"
5. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3006
   https://admin.shurehw.com
   https://ifyjjvbqmyyuhzpoxlsl.supabase.co
   ```
6. Add Authorized redirect URIs:
   ```
   https://ifyjjvbqmyyuhzpoxlsl.supabase.co/auth/v1/callback
   ```
   (Use the callback URL from Supabase dashboard)
7. Click "Create"
8. Copy the Client ID and Client Secret

## Step 4: Configure Supabase

### 4.1 Add Google Credentials to Supabase
1. Go back to Supabase Dashboard
2. Go to Authentication → Providers → Google
3. Paste your:
   - Client ID
   - Client Secret
4. Click "Save"

### 4.2 Configure Redirect URLs
1. Go to Authentication → URL Configuration
2. Add Site URL:
   ```
   http://localhost:3000
   ```
3. Add Redirect URLs:
   ```
   http://localhost:3000/**
   http://localhost:3001/**
   http://localhost:3006/**
   https://admin.shurehw.com/**
   ```
4. Save changes

### 4.3 Update Email Templates (Optional)
1. Go to Authentication → Email Templates
2. Customize the invite and confirmation emails
3. Use your company branding

## Step 5: Update Environment Variables

### 5.1 Local Development (.env.local)
```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://ifyjjvbqmyyuhzpoxlsl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# SMTP for sending emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM_NAME=SHW Admin Portal
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

### 5.2 Production (Vercel)
Add these environment variables in Vercel:
- All SMTP variables above
- `NEXT_PUBLIC_APP_URL=https://admin.shurehw.com`

## Step 6: Test the Setup

### 6.1 Test Google Sign-In
1. Go to http://localhost:3000/admin/login
2. Click "Sign in with Google"
3. You should be redirected to Google
4. After signing in, you should return to the dashboard

### 6.2 Test Email Invitations
1. Go to Users page
2. Click "Invite Users"
3. Enter an email and send
4. Check if the email is received

## Troubleshooting

### Google Sign-In Issues

**"Google OAuth is not configured"**
- This means Google provider is not enabled in Supabase
- Check Authentication → Providers → Google is ON

**"Redirect URI mismatch"**
- The callback URL in Google Console must exactly match Supabase's callback URL
- Check for trailing slashes or https/http differences

**"Access blocked: This app's request is invalid"**
- OAuth consent screen might need to be published
- Or add yourself as a test user

### Email Issues

**"Failed to send email"**
- Check SMTP credentials are correct
- Ensure you're using App Password, not regular password
- Check if "Less secure app access" is needed (shouldn't be with app passwords)

**Emails going to spam**
- Use a proper FROM address
- Consider using a transactional email service for production
- Add SPF/DKIM records if using custom domain

## Production Considerations

1. **Use a Professional Email Service**
   - SendGrid, Mailgun, or AWS SES for better deliverability
   - Gmail SMTP has rate limits (500 emails/day)

2. **Custom Domain Email**
   - Use noreply@shurehw.com instead of Gmail
   - Set up proper DNS records (SPF, DKIM, DMARC)

3. **Rate Limiting**
   - Implement rate limiting on invite endpoints
   - Prevent email abuse

4. **Monitoring**
   - Track email delivery rates
   - Monitor failed authentications
   - Set up alerts for OAuth issues