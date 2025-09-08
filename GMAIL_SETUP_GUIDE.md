# Gmail Integration Setup Guide

## 📧 Gmail Integration for Ticketing System

Your ticketing system now has full Gmail integration capabilities! Here's how to set it up:

## 🚀 Quick Setup Steps

### Step 1: Enable Gmail API in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Gmail API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

### Step 2: Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URI:
   ```
   https://admin-dashboard-7yiu7vrr8-jacob-shures-projects.vercel.app/api/auth/google/callback
   ```
5. Save and download credentials

### Step 3: Set Up Pub/Sub for Real-time Email

1. Enable **Cloud Pub/Sub API** in Google Cloud Console
2. Create a topic:
   ```
   Name: gmail-tickets
   ```
3. Create a subscription:
   ```
   Name: gmail-tickets-sub
   Endpoint: https://admin-dashboard-7yiu7vrr8-jacob-shures-projects.vercel.app/api/gmail/webhook
   ```

### Step 4: Add Environment Variables to Vercel

Go to your [Vercel Environment Variables](https://vercel.com/jacob-shures-projects/admin-dashboard/settings/environment-variables) and add:

```env
# Gmail OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://admin-dashboard-7yiu7vrr8-jacob-shures-projects.vercel.app/api/auth/google/callback
GOOGLE_REFRESH_TOKEN=(will be set after authorization)

# Google Cloud Project
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Support Email
SUPPORT_EMAIL=support@yourcompany.com
```

### Step 5: Authorize Gmail Access

1. Create this temporary authorization page in your app:

```typescript
// app/admin/gmail-setup/page.tsx
'use client';

import { useState } from 'react';

export default function GmailSetup() {
  const [authUrl, setAuthUrl] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  const getAuthUrl = async () => {
    const response = await fetch('/api/gmail/auth');
    const { url } = await response.json();
    setAuthUrl(url);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Gmail Integration Setup</h1>
      
      <div className="space-y-4">
        <button
          onClick={getAuthUrl}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Get Authorization URL
        </button>
        
        {authUrl && (
          <div>
            <p>Click to authorize:</p>
            <a href={authUrl} className="text-blue-600 underline">
              {authUrl}
            </a>
          </div>
        )}
        
        {refreshToken && (
          <div className="bg-green-100 p-4 rounded">
            <p>Success! Add this to your environment variables:</p>
            <code>GOOGLE_REFRESH_TOKEN={refreshToken}</code>
          </div>
        )}
      </div>
    </div>
  );
}
```

2. Visit `/admin/gmail-setup` and authorize
3. Copy the refresh token to Vercel environment variables

### Step 6: Set Up Email Watch

Run this once after authorization to start watching inbox:

```javascript
// In browser console or API test
fetch('/api/gmail/watch', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

## 📥 How Inbound Email Works

1. **Customer sends email** to your support address
2. **Gmail receives** the email
3. **Pub/Sub notifies** your webhook endpoint
4. **System processes** the email:
   - If new conversation → Creates ticket
   - If reply (has ticket #) → Adds to existing ticket
5. **Auto-reply sent** with ticket number
6. **Email labeled** as processed

## 📤 How Outbound Email Works

1. **Agent replies** in ticket interface
2. **System sends** via Gmail API
3. **Email includes** ticket number in subject
4. **Message saved** to ticket history
5. **Customer receives** formatted email

## 🎯 Features Included

### Automatic Features:
- ✅ **Ticket Creation** from emails
- ✅ **Thread Detection** - replies go to correct ticket
- ✅ **Priority Detection** - scans for urgent keywords
- ✅ **Auto-Reply** with ticket number
- ✅ **Email Threading** with Message-ID headers
- ✅ **Rich HTML** email support
- ✅ **Attachment** handling (stored as links)

### Manual Features:
- ✅ **Send replies** from ticket interface
- ✅ **Internal notes** (not sent to customer)
- ✅ **CC/BCC** support
- ✅ **Templates** for common responses

## 🧪 Testing the Integration

### Test Inbound:
1. Send an email to your support address
2. Check `/admin/tickets` - should see new ticket
3. Reply to the auto-reply email
4. Check ticket - should see the reply

### Test Outbound:
```javascript
// Send test email from ticket
fetch('/api/tickets/[ticket-id]/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'customer@example.com',
    subject: 'Update on your request',
    body: 'Your issue has been resolved.'
  })
}).then(r => r.json()).then(console.log);
```

## 🔧 Troubleshooting

### Emails not creating tickets:
1. Check Pub/Sub subscription is active
2. Verify webhook endpoint is accessible
3. Check Gmail API quotas
4. Look at Vercel function logs

### Auto-reply not sending:
1. Verify SUPPORT_EMAIL is set
2. Check Gmail send permissions
3. Verify OAuth token is valid

### Threading not working:
1. Ensure ticket number is in subject
2. Check Message-ID headers are preserved
3. Verify references header is set

## 📋 Configuration Options

### Customize Auto-Reply Template:
Edit `gmailClient.sendAutoReply()` in `lib/gmail/gmail-client.ts`

### Change Ticket Number Format:
Edit `extractTicketNumber()` regex pattern

### Add Email Filters:
- Skip certain senders
- Auto-assign based on subject
- Set priority based on sender domain

## 🎉 You're Done!

Your Gmail integration is ready. Emails sent to your support address will automatically create tickets, and agents can reply directly from the ticketing interface!

## Important Security Notes:
- Keep OAuth credentials secure
- Rotate refresh tokens periodically
- Monitor API usage to prevent abuse
- Set up rate limiting on webhook endpoint