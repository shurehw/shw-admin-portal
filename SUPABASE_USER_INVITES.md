# Supabase User Invites Setup (2 Minutes!)

## Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **ifyjjvbqmyyuhzpoxlsl**
3. Click on **Settings** (gear icon) in the sidebar
4. Click on **API** in the settings menu
5. Find **Service role key** section
6. Click the **Reveal** button
7. Copy the entire key (starts with `eyJ...`)

## Step 2: Add to Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: **admin-dashboard**
3. Go to **Settings** tab
4. Click on **Environment Variables**
5. Add new variable:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [Paste the key you copied]
   - Environment: ✅ Production, ✅ Preview, ✅ Development
6. Click **Save**

## Step 3: Redeploy (Optional)

The changes will apply on next deployment. To apply immediately:
1. Go to **Deployments** tab in Vercel
2. Click the three dots on latest deployment
3. Click **Redeploy**

## How It Works

Once configured, when you invite users:
1. Supabase sends a magic link email automatically
2. Email comes from Supabase's email service
3. User clicks link and is authenticated
4. Their role is assigned based on your invite

## Testing

1. Go to Users page in admin portal
2. Click "Invite Users"
3. Send an invite
4. Check:
   - Supabase Dashboard → Authentication → Users (should show invited user)
   - User's email inbox for the invite

## Email Templates (Optional)

Customize the invite emails:
1. Supabase Dashboard → Authentication → Email Templates
2. Select "Invite user" template
3. Edit the template with your branding
4. Save changes

## What This Enables

✅ **Automatic email invites** - No SMTP needed
✅ **Magic link authentication** - Secure, passwordless
✅ **Built-in email service** - Supabase handles delivery
✅ **Email verification** - Confirms email ownership
✅ **Password reset emails** - Also handled by Supabase

## Troubleshooting

**"No email service configured"**
- Make sure SUPABASE_SERVICE_ROLE_KEY is added to Vercel
- Check the key is copied correctly (no spaces)

**Emails not received**
- Check spam folder
- Verify email address is correct
- Check Supabase Dashboard → Authentication → Logs

**"Invalid API key"**
- Make sure you copied the Service Role key, not the Anon key
- The key should be very long (300+ characters)

## Security Note

⚠️ The Service Role key has admin privileges. Never expose it in client-side code or commit it to Git. Only use it in environment variables.

## That's It!

Your user invites will now be sent automatically through Supabase. No SMTP configuration needed!