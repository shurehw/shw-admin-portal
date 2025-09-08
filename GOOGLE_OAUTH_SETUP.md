# Google OAuth Setup Guide for Gmail & Calendar Integration

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `B2B-CRM-Integration`
4. Click "Create"

## Step 2: Enable Required APIs

1. In your project, go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Gmail API**
   - **Google Calendar API**
   - **Google People API** (for contact info)

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type (or Internal for G Suite)
3. Fill in the required information:
   - **App name**: B2B CRM
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **Authorized domains**: Add your domain (e.g., `your-domain.vercel.app`)

4. Add Scopes:
   - Click "ADD OR REMOVE SCOPES"
   - Select these scopes:
     ```
     https://www.googleapis.com/auth/gmail.modify
     https://www.googleapis.com/auth/gmail.send
     https://www.googleapis.com/auth/gmail.readonly
     https://www.googleapis.com/auth/calendar
     https://www.googleapis.com/auth/calendar.events
     https://www.googleapis.com/auth/userinfo.email
     https://www.googleapis.com/auth/userinfo.profile
     ```

5. Add test users (if in testing mode)

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: B2B CRM OAuth
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://admin-dashboard-96kp1w9up-jacob-shures-projects.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     https://admin-dashboard-96kp1w9up-jacob-shures-projects.vercel.app/api/auth/callback/google
     ```

5. Click "CREATE"
6. Save the **Client ID** and **Client Secret**

## Step 5: Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here

# For production, also set in Vercel
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

## Step 6: Add to Vercel Environment Variables

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - `GOOGLE_CLIENT_ID` (all environments)
   - `GOOGLE_CLIENT_SECRET` (all environments)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (all environments)

## Important URLs for Your Setup

Based on your deployment:
- **Production URL**: `https://admin-dashboard-96kp1w9up-jacob-shures-projects.vercel.app`
- **OAuth Callback**: `https://admin-dashboard-96kp1w9up-jacob-shures-projects.vercel.app/api/auth/callback/google`

## Testing the Integration

1. Navigate to CRM → Settings → Email & Calendar Integration
2. Click "Connect Email Account"
3. Select Gmail
4. You'll be redirected to Google's OAuth consent
5. Grant permissions
6. You'll be redirected back to the CRM with your account connected

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch"**
   - Ensure the callback URL in Google Console matches exactly
   - Check for trailing slashes
   - Verify HTTP vs HTTPS

2. **"Access blocked: This app's request is invalid"**
   - Add your domain to authorized domains
   - Ensure all required scopes are added

3. **"This app isn't verified"** (during testing)
   - This is normal for development
   - Click "Advanced" → "Go to [App Name] (unsafe)" for testing
   - Submit for verification when ready for production

## API Quotas

Gmail API Default Quotas:
- 250 quota units per user per second
- 1,000,000,000 quota units per day

Calendar API Default Quotas:
- 1,000,000 queries per day
- 500 queries per 100 seconds per user

## Security Best Practices

1. **Never commit credentials to git**
2. **Use environment variables for all secrets**
3. **Implement token refresh logic**
4. **Store refresh tokens securely (encrypted in database)**
5. **Implement proper error handling for expired tokens**
6. **Use HTTPS for all callbacks**

## Next Steps

After setup, the integration will:
1. Fetch and sync emails automatically
2. Track email opens (with tracking pixel)
3. Sync calendar events bidirectionally
4. Create CRM activities from calendar events
5. Allow sending emails from within CRM

---

Need help? Check the [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2/web-server)