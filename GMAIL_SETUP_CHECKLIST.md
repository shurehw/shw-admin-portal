# Gmail & Calendar Integration Setup Checklist

## Quick Setup Steps

### 1. Google Cloud Console Setup
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project named "B2B-CRM-Integration"
- [ ] Enable Gmail API
- [ ] Enable Google Calendar API
- [ ] Enable Google People API

### 2. OAuth Consent Screen
- [ ] Go to "APIs & Services" → "OAuth consent screen"
- [ ] Choose "External" type
- [ ] Fill in app information:
  - App name: B2B CRM
  - Support email: your-email@gmail.com
  - Authorized domain: `jacob-shures-projects.vercel.app`
- [ ] Add scopes (click "ADD OR REMOVE SCOPES"):
  - Gmail: modify, send, readonly
  - Calendar: full access
  - User info: email, profile

### 3. Create OAuth Credentials
- [ ] Go to "Credentials" → "CREATE CREDENTIALS" → "OAuth client ID"
- [ ] Choose "Web application"
- [ ] Add Authorized JavaScript origins:
  ```
  https://admin-dashboard-izp1zd8ft-jacob-shures-projects.vercel.app
  http://localhost:3000
  ```
- [ ] Add Authorized redirect URIs:
  ```
  https://admin-dashboard-izp1zd8ft-jacob-shures-projects.vercel.app/api/auth/callback/google
  http://localhost:3000/api/auth/callback/google
  ```
- [ ] Save and copy:
  - Client ID: ___________________________
  - Client Secret: ___________________________

### 4. Set Environment Variables in Vercel
- [ ] Go to [Vercel Dashboard](https://vercel.com/jacob-shures-projects/admin-dashboard/settings/environment-variables)
- [ ] Add these variables:
  ```
  GOOGLE_CLIENT_ID=<your-client-id>
  GOOGLE_CLIENT_SECRET=<your-client-secret>
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>
  ```

### 5. Firebase Admin SDK Setup (Optional - for server-side)
- [ ] Go to Firebase Console → Project Settings → Service Accounts
- [ ] Generate new private key
- [ ] Add to Vercel:
  ```
  FIREBASE_PROJECT_ID=shw-order-portal
  FIREBASE_CLIENT_EMAIL=<from-json-file>
  FIREBASE_PRIVATE_KEY=<from-json-file>
  ```

### 6. Test the Integration
- [ ] Go to CRM → Settings → Email & Calendar Integration
- [ ] Click "Connect Email Account"
- [ ] Select Gmail
- [ ] Authorize the app
- [ ] Verify account appears as connected

## Important URLs

- **Production App**: https://admin-dashboard-izp1zd8ft-jacob-shures-projects.vercel.app
- **OAuth Callback**: https://admin-dashboard-izp1zd8ft-jacob-shures-projects.vercel.app/api/auth/callback/google
- **Settings Page**: https://admin-dashboard-izp1zd8ft-jacob-shures-projects.vercel.app/crm/settings/email-integration

## Troubleshooting

### "Redirect URI mismatch" Error
- Make sure the callback URL matches EXACTLY (including https://)
- No trailing slashes
- Check for correct domain

### "This app isn't verified" Warning
- Normal for development
- Click "Advanced" → "Go to B2B CRM (unsafe)"
- For production, submit for Google verification

### Environment Variables Not Working
- Redeploy after adding environment variables in Vercel
- Use `NEXT_PUBLIC_` prefix for client-side variables

## Features Once Connected

✅ Email sync and logging
✅ Email tracking (opens/clicks)
✅ Send emails from CRM
✅ Calendar event sync
✅ Create activities from calendar events
✅ Schedule meetings from deals/contacts

## Need Help?

1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure APIs are enabled in Google Cloud
4. Check Vercel function logs for server errors