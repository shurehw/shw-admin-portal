# Google Services Setup Guide

This guide covers setting up both Gmail SMTP for emails and Google OAuth for authentication.

## Part 1: Gmail SMTP Configuration (For Sending Emails)

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification" 
3. Follow the prompts to enable it

### Step 2: Generate App Password
1. After enabling 2FA, go back to Security settings
2. Click on "2-Step Verification"
3. Scroll down and click on "App passwords"
4. Select "Mail" from the dropdown
5. Click "Generate"
6. Copy the 16-character password (no spaces)

### Step 3: Update .env.local
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM_NAME=SHW Admin Portal
EMAIL_FROM_ADDRESS=your-email@gmail.com
```

## Part 2: Google OAuth Setup (For Sign-In)

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name it "SHW Admin Portal" 
4. Click "Create"

### Step 2: Enable Google+ API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (or Internal if using Google Workspace)
3. Fill in the required fields:
   - App name: SHW Admin Portal
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
4. Add your domain to "Authorized domains" if you have one
5. Click "Save and Continue"
6. On Scopes page, click "Add or Remove Scopes"
7. Select:
   - .../auth/userinfo.email
   - .../auth/userinfo.profile
8. Click "Update" → "Save and Continue"
9. Add test users if in development
10. Click "Save and Continue"

### Step 4: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Name: "SHW Admin Portal Web Client"
5. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3006
   https://admin.shurehw.com
   https://admin-dashboard-*.vercel.app
   ```
6. Add Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3001/api/auth/callback/google
   http://localhost:3006/api/auth/callback/google
   https://admin.shurehw.com/api/auth/callback/google
   https://admin-dashboard-*.vercel.app/api/auth/callback/google
   ```
7. Click "Create"
8. Copy the Client ID and Client Secret

### Step 5: Update .env.local
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-random-32-char-string-here
```

To generate NEXTAUTH_SECRET, run:
```bash
openssl rand -base64 32
```

### Step 6: Update Vercel Environment Variables
Add all these environment variables to your Vercel project:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable for Production environment:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `EMAIL_FROM_NAME`
   - `EMAIL_FROM_ADDRESS`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL` (set to your production URL)
   - `NEXTAUTH_SECRET`

## Part 3: User Email Configuration

For users to configure their own email settings for tickets and logging, we'll add a settings page.

### Features to Add:
1. Email configuration page at `/admin/settings/email`
2. Store user-specific SMTP settings in database
3. Test email functionality
4. Use user's email for ticket replies if configured

## Troubleshooting

### Gmail SMTP Issues:
- **Authentication failed**: Make sure you're using the app password, not your regular password
- **Less secure apps**: Not needed with app passwords
- **Connection timeout**: Check firewall settings

### Google OAuth Issues:
- **Redirect URI mismatch**: Make sure the URL exactly matches what's in Google Console
- **Access blocked**: Check OAuth consent screen is published (or you're a test user)
- **Invalid client**: Verify Client ID and Secret are correct

### Common Errors:
1. **"Google OAuth is not configured"**: Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
2. **"Sign in with Google failed"**: Check redirect URIs match exactly
3. **"Email not sent"**: Verify SMTP credentials and app password

## Security Notes
- Never commit credentials to git
- Use environment variables for all secrets
- Rotate app passwords periodically
- Monitor failed login attempts
- Use rate limiting on email endpoints