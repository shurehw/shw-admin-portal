# Authentication & User Management Setup Guide

## Overview
The admin portal uses a multi-layered authentication system with role-based access control (RBAC). The system supports both Supabase authentication and JWT-based portal authentication.

## Quick Start

### 1. Database Setup
Run the migration to set up user tables and permissions:
```bash
# Apply the auth system migration
npx supabase db push
# Or manually run: supabase/migrations/20250907_auth_system.sql
```

### 2. Create Admin User
```sql
-- In Supabase SQL editor, create your first admin user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@shurehw.com', crypt('YourSecurePassword123!', gen_salt('bf')), now());

-- Get the user ID from the result, then create the profile
INSERT INTO user_profiles (user_id, email, full_name, role)
VALUES ('USER_ID_FROM_ABOVE', 'admin@shurehw.com', 'System Admin', 'admin');
```

### 3. Access User Management
Navigate to: `/admin/users` to manage users through the UI

## User Roles & Permissions

### Available Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **admin** | Full system access | All permissions including user management, settings, reports |
| **sales_rep** | Sales team members | CRM access, quotes, orders, customer management |
| **customer_service** | Support team | Tickets, customer view, order updates |
| **production** | Production team | Order fulfillment, art proofs |
| **art_team** | Design team | Art proof creation and management |
| **viewer** | Read-only access | View-only permissions across the system |

### Permission Matrix

```
admin:
  - users:* (all user operations)
  - tickets:* (all ticket operations)
  - orders:* (all order operations)
  - customers:* (all customer operations)
  - quotes:* (all quote operations)
  - invoices:* (all invoice operations)
  - reports:read
  - settings:manage
  - crm:full_access

sales_rep:
  - tickets:create, read, update
  - orders:create, read, update
  - customers:create, read, update
  - quotes:create, read, update
  - invoices:read
  - crm:full_access

customer_service:
  - tickets:create, read, update
  - orders:read, update
  - customers:read, update
  - invoices:read
  - crm:limited_access

production:
  - orders:read, update
  - art_proofs:create, read, update

art_team:
  - art_proofs:create, read, update
  - orders:read

viewer:
  - *:read (read-only access to all resources)
```

## Authentication Flow

### 1. Login Process
```javascript
// Using Supabase auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### 2. Session Management
- Sessions are stored in Supabase
- JWT tokens are used for API authentication
- Sessions expire after 8 hours by default
- Refresh tokens valid for 24 hours

### 3. Protected Routes
All `/admin/*` routes are protected and require authentication.

## User Management Features

### Through UI (/admin/users)
- **Add New Users**: Click "Add User" button
- **Edit Users**: Click edit icon next to user
- **Change Roles**: Select new role from dropdown
- **Reset Password**: Send password reset email
- **Activate/Deactivate**: Toggle user status
- **Manage Permissions**: Granular permission control

### Through API
```javascript
// Create new user
const { user, error } = await signUp(
  'john@example.com',
  'SecurePassword123!',
  'John Smith',
  'sales_rep'
);

// Update user role
const { user, error } = await updateUserRole(userId, 'admin');

// Toggle user status
const { user, error } = await toggleUserStatus(userId, false);
```

## Security Best Practices

### Password Requirements
- Minimum 6 characters (configurable)
- Recommended: 8+ characters with mixed case, numbers, symbols
- Password reset via email verification

### Role Assignment
- Only admins can assign/change roles
- Default role for new users: `viewer`
- Critical operations require `admin` role

### Session Security
- Automatic logout after inactivity
- Secure session storage
- HTTPS-only cookies in production

## Testing Authentication

### Development Mode
For local development, use mock authentication:
```javascript
// In development, this creates a mock admin user
import { mockAuthForDevelopment } from '@/lib/auth';
mockAuthForDevelopment();
```

### Test Accounts
Create test accounts for each role:
```
admin@test.com - Admin role
sales@test.com - Sales Rep role
support@test.com - Customer Service role
production@test.com - Production role
art@test.com - Art Team role
viewer@test.com - Viewer role
```

## Troubleshooting

### Common Issues

1. **"User not found" error**
   - Ensure user exists in both `auth.users` and `user_profiles` tables
   - Check email is confirmed in Supabase

2. **"Permission denied" error**
   - Verify user role has required permissions
   - Check RLS policies in Supabase

3. **Session expired**
   - Users need to log in again after 8 hours
   - Implement refresh token rotation for seamless experience

4. **Cannot create users**
   - Only admins can create new users
   - Check Supabase auth settings allow signups

### Debug Commands
```sql
-- Check user profiles
SELECT * FROM user_profiles;

-- Check user permissions
SELECT * FROM get_user_permissions('USER_ID');

-- Check role permissions
SELECT * FROM role_permissions WHERE role = 'admin';

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

## Environment Variables
Ensure these are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/reset-password` - Password reset

### User Management
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PATCH /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `POST /api/users/:id/reset-password` - Send reset email

## Next Steps

1. **Set up Supabase Auth**
   - Enable email authentication in Supabase dashboard
   - Configure email templates
   - Set up password policies

2. **Configure Email Service**
   - Set up SMTP for password resets
   - Customize email templates
   - Test email delivery

3. **Implement SSO (Optional)**
   - Configure OAuth providers (Google, Microsoft)
   - Set up SAML for enterprise SSO
   - Map external roles to internal roles

4. **Add Audit Logging**
   - Track all authentication events
   - Monitor permission changes
   - Set up alerts for suspicious activity

## Support
For issues or questions about authentication:
1. Check this documentation
2. Review Supabase Auth docs
3. Contact system administrator