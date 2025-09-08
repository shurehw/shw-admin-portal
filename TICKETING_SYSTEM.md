# B2B Admin Portal - Ticketing System

A comprehensive customer support ticketing system integrated into the B2B admin portal for CS agents and leads.

## 🎯 Goals

- **Fast triage + resolution with SLAs**: Automatic SLA tracking with breach alerts
- **Order-centric**: Direct links to orders/shipments/quotes for context
- **Clean threading**: Email/SMS integration with proper message threading
- **Internal vs public**: Separate internal notes from customer-facing replies

## 🔐 Authorization

The system uses JWT-based authentication with the following claims:
- `roles[]`: User roles (admin, customer_service, etc.)
- `teams[]`: Team memberships for scoped access
- `permissions[]`: Granular permissions (tickets:read, tickets:write, tickets:admin)
- `orgId`: Organization scope for multi-tenant support

### Required Permissions
- `tickets:read`: View tickets within scope
- `tickets:write`: Create/update tickets and messages
- `tickets:admin`: Manage system settings, delete tickets

## 📊 Data Model

### Core Tables
- **tickets**: Main ticket records with SLA tracking
- **ticket_messages**: Threaded messages (public replies vs internal notes)
- **ticket_watchers**: Users following ticket updates
- **ticket_events**: Audit trail of all ticket changes

### Configuration Tables
- **ticket_statuses**: Customizable status workflow
- **ticket_types**: Issue categories with routing rules
- **priorities**: Priority levels with color coding
- **sla_policies**: Response/resolution time targets by priority
- **business_hours**: Working hours for SLA calculations
- **macros**: Reusable action templates
- **email_identities**: Team-specific "from" addresses
- **routing_rules**: Automatic assignment logic

## 🚀 API Endpoints

### Core Operations
- `GET /api/tickets` - List tickets with filtering/pagination
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/[id]` - Get ticket details with messages
- `PATCH /api/tickets/[id]` - Update ticket status/assignment
- `DELETE /api/tickets/[id]` - Delete ticket (admin only)

### Messages & Communication
- `GET /api/tickets/[id]/messages` - Get ticket message thread
- `POST /api/tickets/[id]/messages` - Add reply or internal note
- `POST /api/tickets/integrations/email/outbound` - Send email reply

### Views & Search
- `GET /api/tickets/views` - Get saved views and built-in queues
- `PUT /api/tickets/views` - Execute view with filters
- `GET /api/tickets/search?q=query` - Quick search across tickets/companies/orders
- `POST /api/tickets/search` - Advanced search with filters

### Admin Settings
- `GET /api/admin/ticket-settings/statuses` - Manage ticket statuses
- `GET /api/admin/ticket-settings/sla-policies` - Manage SLA policies  
- `GET /api/admin/ticket-settings/macros` - Manage quick action macros

### Integrations
- `POST /api/tickets/integrations/email/inbound` - Webhook for incoming emails
- `POST /api/tickets/integrations/slack/notify` - Send Slack notifications

## 💻 UI Components

### Agent Workspace (`/admin/tickets`)
- **Left Sidebar**: Saved views/queues (My Open, Unassigned, Breaching <2h, etc.)
- **Center**: List or Board view of tickets with SLA indicators
- **Right**: Ticket drawer with timeline and message composer

### Built-in Views
- **My Open Tickets**: Assigned to current user, status: new/ack/in_progress
- **Unassigned**: No owner, status: new/ack  
- **Breaching <2h**: SLA due within 2 hours
- **Waiting on Customer**: Customer action required
- **Returns**: Return/refund requests
- **Delivery Issues**: Shipping problems
- **Billing Issues**: Payment/invoice questions

### Ticket Drawer Features
- **Header**: Status, priority, SLA countdown with breach alerts
- **Info Panel**: Company, contact, related orders/quotes, watchers
- **Timeline**: Chronological message thread with public/internal distinction
- **Composer**: Reply types (public email vs internal note) with templates

## 📧 Email Integration

### Inbound Email Processing
The system can receive emails via webhook (`/api/tickets/integrations/email/inbound`):

1. **Threading Logic**:
   - Check subject for `[#TKT-12345]` pattern
   - Match email references/in-reply-to headers
   - Create new ticket if no match found

2. **Auto-routing**:
   - Domain allowlist for security
   - Content analysis for type detection (billing, delivery, etc.)
   - Priority detection from keywords (urgent, asap, etc.)
   - Routing rules application

### Outbound Email
- Team-specific "from" identities with signatures
- Proper email threading with References headers
- HTML and plain text support
- Attachment handling

## 🔔 Notifications & SLA Monitoring

### SLA Tracking
- First response time tracking
- Resolution time monitoring  
- Business hours calculation
- Automatic priority-based SLA assignment

### Alert System
- Slack notifications for breaches and escalations
- Email alerts to managers for critical issues
- Real-time UI indicators for approaching deadlines

### Monitoring Script
Use `lib/ticketing/sla-monitor.ts` for periodic SLA checks:
```typescript
import { checkAndNotifyBreaches } from '@/lib/ticketing/sla-monitor';

// Run every 15 minutes
setInterval(checkAndNotifyBreaches, 15 * 60 * 1000);
```

## 🛠 Setup & Configuration

### 1. Database Migration
```bash
npx prisma db push
npx tsx prisma/seed-tickets.ts
```

### 2. Environment Variables
```env
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-app-password
DEFAULT_FROM_EMAIL=support@company.com
EMAIL_DOMAIN=company.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 3. Email Webhook Setup
Configure your email provider (SendGrid, Postmark, etc.) to POST to:
```
https://your-domain.com/api/tickets/integrations/email/inbound
```

### 4. Default Data
The seed script creates:
- 6 default statuses (New → Closed workflow)
- 4 priority levels with SLA policies
- Sample macros for common actions
- Team email identities
- Basic routing rules

## 📊 Performance Features

### Optimizations
- Database indexes on frequently queried fields
- Pagination for large result sets
- Efficient filtering with Prisma query optimization
- Optimistic UI updates for status changes

### Targets
- <200ms server response time for queue queries
- Support for 5-10k active tickets
- Infinite scroll with virtual windowing for large lists

## 🔒 Security

### Access Control
- Multi-tenant organization scoping
- Team-based access restrictions
- Permission-based action authorization
- JWT token validation on all endpoints

### Data Protection
- Encrypted integration configurations
- SQL injection prevention via Prisma
- Input validation and sanitization
- CORS configuration for API access

## 📈 Analytics & Reporting

### Metrics Available
- Ticket volume by type/priority/team
- SLA performance tracking
- Response time averages
- Resolution rates
- Customer satisfaction scores

### Export Options
- CSV export for external analysis
- Integration with BI tools via API
- Webhook events for real-time data sync

## 🧪 Testing Workflow

### End-to-End Test Scenarios

1. **New Ticket Creation**:
   - Email arrives at support@company.com
   - System creates ticket TKT-001
   - Ticket appears in "Unassigned" queue
   - SLA timer starts

2. **Agent Response**:
   - Agent opens ticket from queue
   - Status auto-changes to "Acknowledged"
   - Agent sends public reply via email
   - Customer receives email with threading

3. **SLA Monitoring**:
   - Ticket approaching SLA breach shows warning
   - Slack alert sent to team channel
   - Manager receives escalation notification

4. **Resolution**:
   - Agent marks ticket as "Resolved"
   - Customer receives resolution email
   - Ticket closed_at timestamp recorded
   - Analytics updated

### Manual Testing Steps

1. **Access the ticketing system**: Navigate to `/admin/tickets`
2. **Create a ticket**: Click "+" button and fill form
3. **Test views**: Switch between List/Board views and different queues
4. **Open ticket drawer**: Click on a ticket to view details
5. **Add messages**: Test both public replies and internal notes
6. **Test search**: Use global search for tickets, companies, orders
7. **Admin settings**: Visit `/admin/tickets/settings` to configure system

## 🔄 Future Enhancements

### Planned Features
- Mobile app for agents
- Customer self-service portal
- AI-powered response suggestions
- Advanced reporting dashboard
- Integration with phone systems
- Custom field support
- Automated workflows
- Knowledge base integration

### Integration Roadmap
- Zapier/webhook automation
- CRM system sync
- E-commerce platform integration
- Social media monitoring
- Live chat widget
- Video call scheduling

---

## 🎉 Acceptance Criteria ✅

- ✅ New email creates ticket in "Unassigned" queue with SLA timer
- ✅ Agent replies send properly threaded emails with correct "from" identity  
- ✅ "Breaching <2h" view updates live with SLA countdown
- ✅ Slack alerts fire for SLA breaches and escalations
- ✅ "Request photos" macro sets status and inserts template
- ✅ Order linking auto-fills company/contact, deep links work
- ✅ Ticket closure sets closed_at timestamp
- ✅ Analytics integration ready for Ops dashboard

The system is production-ready with comprehensive feature coverage, security, performance optimization, and extensive customization options.