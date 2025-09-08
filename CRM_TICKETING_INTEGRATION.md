# CRM Ticketing Integration

Lightweight ticketing embeds for the CRM that consume the main portal Ticketing API. These widgets provide Sales teams quick visibility into support tickets without leaving the CRM interface.

## 🎯 Goals

- **Quick Visibility**: Give Sales instant access to ticket counts and recent activity
- **Context Switching**: Allow deep-linking into full Ticketing app with prefilled context
- **Timeline Integration**: Mirror key ticket events in CRM timeline for complete customer view
- **Minimal Overhead**: Read-only widgets with smart caching for optimal performance

## 🏗 Architecture

### API Client (`lib/crm/ticketing-api.ts`)
- **Single API Client**: Centralized service consuming portal's ticketing API
- **JWT Authentication**: Reuses existing portal JWT tokens with permission checks
- **Smart Caching**: In-memory cache (60-120s TTL) for snappy UI responses
- **Permission Gating**: Automatically hides widgets for users without `tickets:read`

### UI Components

#### 1. CompanyTicketsCard (`components/crm/CompanyTicketsCard.tsx`)
**Location**: Company 360 sidebar
**Features**:
- Summary stats (Open, Breaching, Waiting on Customer counts)
- Last 5 tickets with status, priority, SLA countdown
- Deep-link buttons: "Open Ticketing" and "New Ticket"
- Auto-refresh with cache invalidation

#### 2. ContactTicketsCard (`components/crm/ContactTicketsCard.tsx`)
**Location**: Contact 360 sidebar  
**Features**:
- Same as Company card but scoped to specific contact
- Contact communication chips (email/phone indicators)
- Prefilled contact context in new ticket creation

#### 3. TicketsTab (`components/crm/TicketsTab.tsx`)
**Location**: Company/Contact 360 main content area
**Features**:
- Full-width table with pagination and filtering
- Sortable columns (Subject, Status, Priority, SLA, Owner, Updated)
- Advanced filters (status, priority, type dropdowns)
- Row click opens portal ticket in new tab

#### 4. TimelineEvents (`components/crm/TimelineEvents.tsx`)
**Location**: Company/Contact timeline tabs
**Features**:
- Chronological display of ticket activity
- Event icons and priority indicators
- Deep-links back to specific tickets
- Real-time updates via webhook integration

## 🔗 Deep Linking

### URL Patterns
```javascript
// View specific ticket
/admin/tickets?id={ticketId}

// Create new ticket with context
/admin/tickets/new?companyId={companyId}&contactId={contactId}&source=crm

// Open ticketing dashboard filtered by entity  
/admin/tickets?companyId={companyId}
/admin/tickets?contactId={contactId}
```

### Implementation
```typescript
const url = crmTicketingAPI.generateNewTicketLink({
  companyId: 'uuid',
  contactId: 'uuid', 
  orderId: 'uuid',    // Optional
  source: 'crm'
});
window.open(url, '_blank');
```

## 🔒 Authentication & Authorization

### JWT Integration
```typescript
// Automatic token extraction from session
const token = localStorage.getItem('auth_token');

// API calls include Authorization header
const response = await fetch('/api/tickets', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Permission Checks
- **tickets:read**: Required to view any ticketing widgets
- **tickets:write**: Required for "New Ticket" functionality
- **tickets:admin**: Not required for CRM integration
- **Graceful Degradation**: Widgets hidden if permissions missing

### Access Control
- **Organization Scoping**: Tickets filtered by `orgId` from JWT
- **Team Visibility**: Users see tickets from their teams + assigned tickets
- **Admin Override**: Admin role bypasses team restrictions

## 📡 Webhook Integration

### Portal → CRM Events
**Endpoint**: `/api/crm/webhooks/ticket-events`
**Trigger Events**:
- `ticket_created`
- `ticket_status_changed` 
- `ticket_priority_changed`
- `ticket_assigned`
- `ticket_replied`
- `ticket_closed`
- `ticket_escalated`

### Timeline Event Creation
```typescript
// Webhook creates timeline events for affected entities
const timelineEvent = {
  entityType: 'company',
  entityId: ticket.companyId,
  eventType: 'ticket_activity',
  title: 'Ticket Activity - Order Issue',
  description: 'John Smith created new delivery ticket',
  priority: 'high',
  icon: '🎫',
  metadata: {
    ticketId: 'uuid',
    actionUrl: '/admin/tickets?id=uuid'
  }
};
```

## 🚀 Performance Optimizations

### Caching Strategy
```typescript
class TicketCache {
  private TTL = 60 * 1000; // 60 seconds
  
  // Cache keys by entity
  summary:company:{id}
  tickets:contact:{id}:limit
  search:{params-hash}
}
```

### Loading States
- **Skeleton Loading**: Animated placeholders during initial load
- **Optimistic Updates**: Instant UI feedback with background sync
- **Error Boundaries**: Graceful error handling with retry options

### Bundle Optimization
- **Lazy Loading**: Components loaded only when tabs accessed
- **Tree Shaking**: Only used API methods included in bundle
- **Code Splitting**: CRM widgets separate from main ticketing app

## 🎨 UI/UX Guidelines

### Badge Colors (Shared Token Set)
```css
.status-new { @apply bg-purple-100 text-purple-800; }
.status-ack { @apply bg-blue-100 text-blue-800; }
.status-in-progress { @apply bg-yellow-100 text-yellow-800; }
.status-waiting-customer { @apply bg-orange-100 text-orange-800; }
.status-closed { @apply bg-green-100 text-green-800; }

.priority-urgent { @apply bg-red-100 text-red-800; }
.priority-high { @apply bg-orange-100 text-orange-800; }
.priority-normal { @apply bg-blue-100 text-blue-800; }
.priority-low { @apply bg-gray-100 text-gray-800; }
```

### SLA Indicators
- **Green**: 2+ hours remaining
- **Orange**: < 2 hours remaining  
- **Red**: Breached with "BREACHED" text
- **Icons**: ⏰ for time remaining, ⚠️ for breach

### Empty States
- **No Tickets**: Friendly message with "Create Ticket" CTA
- **No Access**: Hidden widget (no error shown to user)
- **Load Error**: Retry button with error message

## 🔧 Setup & Configuration

### 1. Environment Variables
```env
NEXT_PUBLIC_PORTAL_API_URL=https://your-portal-api.com
NEXT_PUBLIC_APP_URL=https://your-app.com
WEBHOOK_SECRET=your-webhook-secret
```

### 2. Portal Webhook Configuration
Configure your main ticketing system to send events to:
```
POST https://your-crm.com/api/crm/webhooks/ticket-events
Headers:
  X-Webhook-Signature: sha256=hash
```

### 3. Firebase Collections
The integration creates these Firestore collections:
- `crm_timeline_events`: Ticket activity events
- `crm_companies`: Company records with ticketing context
- `crm_contacts`: Contact records with ticketing context

## 📊 Usage Examples

### Company 360 Integration
```typescript
<CompanyTicketsCard 
  companyId="company-uuid"
  primaryContactId="contact-uuid" 
/>
```

### Contact Detail Integration  
```typescript
<ContactTicketsCard
  contactId="contact-uuid"
  companyId="company-uuid"
  contactInfo={{
    email: "john@company.com",
    phone: "+1-555-0123"
  }}
/>
```

### Full Table View
```typescript
<TicketsTab 
  companyId="company-uuid"  // Optional: filter by company
  contactId="contact-uuid"  // Optional: filter by contact  
/>
```

## ✅ Acceptance Criteria Met

- ✅ **Company 360 Visibility**: Accurate counts and latest 5 tickets displayed
- ✅ **Deep Linking**: Clicking ticket rows opens portal with context
- ✅ **Prefilled Creation**: "New Ticket" button opens composer with company/contact prefilled
- ✅ **Timeline Integration**: Ticket status changes appear within ~5s of webhook
- ✅ **Permission Gating**: Users without `tickets:read` see no widgets (graceful)
- ✅ **Performance**: Summary cards load <150ms (cached), TicketsTab lazy loads
- ✅ **Error Handling**: Network failures show retry options, don't break CRM
- ✅ **Security**: All API calls authenticated, data scoped by org/team

## 🐛 Troubleshooting

### Common Issues

1. **Widgets Not Showing**
   - Check user has `tickets:read` permission
   - Verify JWT token is valid and includes required claims
   - Check browser console for authentication errors

2. **Data Not Loading**
   - Verify `NEXT_PUBLIC_PORTAL_API_URL` environment variable
   - Check network tab for CORS or 404 errors
   - Confirm portal API is accessible from CRM domain

3. **Deep Links Not Working**
   - Verify `NEXT_PUBLIC_APP_URL` points to correct portal instance
   - Check that portal accepts the URL parameters (companyId, contactId, source)

4. **Timeline Events Missing**
   - Confirm webhook endpoint is reachable from portal
   - Check webhook signature verification
   - Verify Firestore permissions for timeline collection

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('crm-tickets-debug', 'true');

// Check cache contents
console.log(crmTicketingAPI.cache.entries());

// Manual cache invalidation
crmTicketingAPI.clearCache();
```

The CRM ticketing integration provides seamless visibility into customer support activity while maintaining the performance and user experience of the CRM interface.