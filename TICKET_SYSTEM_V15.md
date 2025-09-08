# Enhanced Ticket System v1.5

## Overview
The ticket system has been upgraded to v1.5 with comprehensive features for SLA tracking, priority management, public/internal messaging, and related entity tracking.

## New Features

### 1. SLA Management
- Automatic SLA assignment based on priority/VIP status
- Real-time countdown timers for first response and resolution
- Visual indicators for breaching/breached SLAs
- Default SLA plans: Standard (2h/24h), Priority (30m/4h), VIP (15m/2h)

### 2. Enhanced Messaging
- **Public Replies**: Customer-facing messages
- **Internal Notes**: Team-only communication
- Message pinning for important updates
- Canned responses/macros for common replies
- Rich text editing with attachments

### 3. Ticket Properties
- Status: new, ack, in_progress, waiting_customer, resolved, closed
- Priority: p1, p2, p3, p4 (with color coding)
- Type: order_issue, rma, damage, billing, custom_print, shipping, quality, other
- Assignee and followers management
- Tags for categorization

### 4. Related Entities
- Link to companies, contacts, orders, invoices, POs
- Vendor tracking for supplier issues
- Brand and location tracking
- Credit memos and RMA tracking

### 5. Audit Trail
- Complete event logging for all changes
- Track status changes, assignments, priority updates
- Automatic timestamp tracking for key events
- Actor identification for accountability

## Database Setup

### Prerequisites
- Supabase project (local or hosted)
- PostgreSQL 15+
- Docker Desktop (for local development)

### Migration
1. Run the migration script:
```bash
cd admin-dashboard
npx supabase db push
```

Or manually apply:
```sql
-- Run the migration file:
supabase/migrations/20250907172738_tickets_v15_upgrade.sql
```

### Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## API Endpoints

### Ticket Operations
- `GET /api/tickets/[ticketId]` - Get ticket details with relations
- `PATCH /api/tickets/[ticketId]` - Update ticket properties

### Message Operations
- `GET /api/tickets/[ticketId]/messages` - Get ticket messages
- `POST /api/tickets/[ticketId]/messages` - Add new message

### Macro Operations
- `GET /api/tickets/macros` - Get canned responses
- `POST /api/tickets/macros` - Create new macro

## Component Usage

### EnhancedTicketDrawer
The main ticket interface component with all v1.5 features:

```tsx
import TicketDrawer from '@/components/ticketing/EnhancedTicketDrawer';

<TicketDrawer
  ticket={selectedTicket}
  onClose={handleClose}
  getPriorityColor={getPriorityColor}
  getStatusColor={getStatusColor}
/>
```

### Key Features:
- **Header**: Status, priority, type badges with SLA countdown
- **Quick Actions**: Assign to me, change status, add followers
- **Information Panel**: Company, contact, related entities
- **Timeline**: Filtered view of messages and events
- **Composer**: Toggle between public/internal, use macros, add attachments

## Testing Checklist

### Basic Operations
- [ ] Create new ticket
- [ ] View ticket details in drawer
- [ ] Update ticket status
- [ ] Change priority
- [ ] Assign ticket

### Messaging
- [ ] Send public reply
- [ ] Add internal note
- [ ] Apply canned response
- [ ] Pin important message

### SLA Features
- [ ] Verify SLA auto-assignment
- [ ] Check countdown timers
- [ ] Test breach notifications
- [ ] Verify first response tracking

### Related Entities
- [ ] Link to company
- [ ] Associate with order
- [ ] Add contact
- [ ] Track vendor

### Audit Trail
- [ ] Verify status change events
- [ ] Check assignment logging
- [ ] Review priority change tracking

## Troubleshooting

### Messages Not Displaying
- Check console for API errors
- Verify Supabase connection
- Ensure RLS policies are configured

### SLA Not Calculating
- Verify SLA plans exist in database
- Check trigger functions are created
- Ensure ticket has priority set

### Drawer Display Issues
- Clear browser cache
- Check z-index conflicts
- Verify Portal mounting

## Future Enhancements
- Email integration for replies
- Automated workflows and triggers
- Advanced reporting and analytics
- Multi-channel support (chat, social)
- AI-powered response suggestions