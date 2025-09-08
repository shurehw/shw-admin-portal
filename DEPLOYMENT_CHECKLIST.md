# Ticketing System Deployment Checklist

## 🚨 CRITICAL - Must Do Before Deploying

### 1. Database Setup
SQLite doesn't work on Vercel. You need PostgreSQL or MySQL.

#### Option A: Use Vercel Postgres (Easiest)
1. Go to your Vercel project dashboard
2. Click "Storage" tab
3. Create a Postgres database
4. It will automatically add `DATABASE_URL` to your environment

#### Option B: Use Supabase (Free)
1. Create account at https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Add to Vercel environment variables as `DATABASE_URL`

### 2. Update Prisma Schema
```prisma
// In prisma/schema.prisma, change:
datasource db {
  provider = "postgresql"  // Change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Environment Variables in Vercel
Go to: https://vercel.com/jacob-shures-projects/admin-dashboard-1dap2ynou/settings/environment-variables

Add these:
```
DATABASE_URL=postgresql://[your-connection-string]
NEXT_PUBLIC_PORTAL_API_URL=https://admin-dashboard-1dap2ynou-jacob-shures-projects.vercel.app
JWT_SECRET=[generate-random-string]
WEBHOOK_SECRET=[generate-random-string]
```

### 4. Run Database Migrations
```bash
# After setting DATABASE_URL
npx prisma generate
npx prisma db push
```

## 📦 Deployment Commands

### Quick Deploy (if git is set up):
```bash
git add .
git commit -m "Add ticketing system"
git push origin main
```

### First Time Setup:
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link to existing project
vercel link
# Select your existing project when prompted

# 4. Deploy
vercel --prod
```

## ✅ Verify Deployment

After deploying, test these URLs:

1. **Main Ticketing System**
   ```
   https://admin-dashboard-1dap2ynou-jacob-shures-projects.vercel.app/admin/tickets
   ```

2. **API Health Check**
   ```
   https://admin-dashboard-1dap2ynou-jacob-shures-projects.vercel.app/api/tickets
   ```

3. **CRM Integration**
   - Go to any company/contact page
   - Look for ticket widgets in sidebar
   - Check "Support Tickets" tab

## 🐛 Troubleshooting

### "Database connection failed"
- Check DATABASE_URL in Vercel environment variables
- Make sure it's PostgreSQL, not SQLite path

### "Prisma Client not generated"
Run in project root:
```bash
npx prisma generate
npm run build
vercel --prod
```

### "500 Internal Server Error"
Check Vercel Functions logs:
1. Go to Vercel dashboard
2. Click "Functions" tab
3. Check error logs

### Still showing 404
The build might be cached. Force rebuild:
```bash
vercel --force --prod
```

## 🎯 Expected Result

Once deployed, you'll have:
- ✅ Full ticketing system at `/admin/tickets`
- ✅ Ticket widgets in CRM company/contact pages
- ✅ Real-time timeline events
- ✅ API endpoints for ticket operations
- ✅ Settings page for configuration

The ticketing system will be fully integrated with your existing B2B portal!