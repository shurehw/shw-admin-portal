# Simple Email Setup (No SMTP Required!)

## Overview
This app now supports multiple email services without needing SMTP configuration:
1. **Supabase Auth** - For user invites (built-in)
2. **Resend/Vercel** - For all notifications (API-based)
3. **SMTP** - Optional fallback

## Option 1: Supabase Auth (Recommended for User Invites)

### What It Does:
- Sends magic link invites automatically
- Handles password resets
- No configuration needed!

### Setup:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Customize the templates if desired
3. That's it! Invites will be sent automatically

### To Enable:
Add to Vercel environment variables:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find your service role key:
- Supabase Dashboard → Settings → API → Service Role Key

## Option 2: Resend (Recommended for Vercel)

### What It Does:
- Sends all system notifications
- No SMTP needed - uses API
- Better deliverability than personal email
- Free tier: 100 emails/day

### Setup:
1. Sign up at https://resend.com (free)
2. Get your API key
3. Add domain (optional) or use their domain

### To Enable:
Add to Vercel environment variables:
```
RESEND_API_KEY=re_YOUR_API_KEY
RESEND_FROM_EMAIL=notifications@yourdomain.com
```

Or use Resend's domain:
```
RESEND_FROM_EMAIL=SHW Admin <onboarding@resend.dev>
```

## Option 3: Both (Best Setup)

Use both for complete coverage:
```
# For user authentication
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For notifications
RESEND_API_KEY=re_YOUR_API_KEY
RESEND_FROM_EMAIL=notifications@shurehw.com
```

## How the System Works

The invite system automatically detects available services:

1. **Checks for Supabase Service Role** → Uses Supabase Auth
2. **Checks for Resend API Key** → Uses Resend
3. **Checks for SMTP Config** → Uses SMTP
4. **None configured** → Saves to database only

## Testing Your Setup

### Test Supabase Auth:
1. Go to Users page
2. Click "Invite Users"
3. Send an invite
4. Check Supabase Dashboard → Authentication → Users

### Test Resend:
1. After adding RESEND_API_KEY
2. Send an invite
3. Check Resend Dashboard for sent emails

## Advantages of This Approach

✅ **No SMTP credentials needed**
✅ **No app passwords**
✅ **Better deliverability**
✅ **Easier setup**
✅ **Free tiers available**
✅ **Built-in analytics**

## Quick Start (5 Minutes)

### For Immediate Setup:
1. Go to https://resend.com
2. Sign up (free)
3. Copy API key
4. Add to Vercel:
   ```
   RESEND_API_KEY=re_YOUR_KEY
   ```
5. Deploy
6. Done! Emails will work immediately

### For Production:
1. Add your domain to Resend
2. Set up DNS records (SPF, DKIM)
3. Use your domain email:
   ```
   RESEND_FROM_EMAIL=noreply@shurehw.com
   ```

## Troubleshooting

**"No email service configured"**
- Add either SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY

**"Failed to send invite"**
- Check API key is correct
- Verify Resend account is active

**Emails not received**
- Check spam folder
- Verify email address is correct
- Check Resend/Supabase dashboard for logs

## Environment Variables Summary

```env
# Option 1: Supabase Only
SUPABASE_SERVICE_ROLE_KEY=your-key

# Option 2: Resend Only
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@shurehw.com

# Option 3: Both (Recommended)
SUPABASE_SERVICE_ROLE_KEY=your-key
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@shurehw.com

# Optional: Fallback to SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## No Configuration Needed!

The app will work without any email configuration - invites will be saved to the database and users can still sign in with Google OAuth when they visit the login page.