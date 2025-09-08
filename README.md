# B2B Admin Dashboard

## Overview
This is the administrative portal for B2B operations, completely separated from the customer-facing portal for better security, performance, and maintainability.

## Features
- Customer Management
- Quote Generation & Management
- Production Tools (Quote Builder, Art Proofs)
- Order Management
- BigCommerce Integration
- Admin Authentication

## Tech Stack
- Next.js 15.4.6 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- NextAuth.js for Authentication
- BigCommerce API Integration

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (for Prisma)

### Installation
```bash
npm install
```

### Environment Variables
Copy `.env.local.example` to `.env.local` and update with your credentials:
```
# BigCommerce API
BIGCOMMERCE_STORE_HASH=your_store_hash
BIGCOMMERCE_ACCESS_TOKEN=your_access_token
BIGCOMMERCE_CLIENT_ID=your_client_id
BIGCOMMERCE_CLIENT_SECRET=your_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3004
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=your_database_url
```

### Development
```bash
npm run dev
```
The admin portal will be available at http://localhost:3004

### Production Build
```bash
npm run build
npm run start
```

## Default Credentials
For development/demo:
- Admin: `admin@shurehw.com` / `admin123`
- Sales: `sales@shurehw.com` / `sales123`
- Customer Service: `cs@shurehw.com` / `cs123`

## Project Structure
```
admin-dashboard/
├── app/              # Next.js App Router pages
│   └── admin/        # Admin pages
├── components/       # React components
├── lib/             # Utility functions
├── pages/api/       # API routes
├── prisma/          # Database schema
├── public/          # Static assets
└── types/           # TypeScript type definitions
```

## Related Projects
- Customer Portal: `b2b-customer-portal/`
- Legacy Quote Builder: `quote-builder/`
- Firebase Functions: `firebase-functions/`

## Security Notes
- This portal is for internal use only
- Implement proper authentication in production
- Keep API keys and secrets secure
- Regular security audits recommended