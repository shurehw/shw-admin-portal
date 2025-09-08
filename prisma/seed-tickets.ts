import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTicketingSystem() {
  console.log('🎫 Seeding ticketing system...');

  // Seed default ticket statuses
  const statuses = [
    { name: 'New', orderIndex: 0, isDefault: true, isClosed: false, color: '#8B5CF6' },
    { name: 'Acknowledged', orderIndex: 1, isDefault: false, isClosed: false, color: '#3B82F6' },
    { name: 'In Progress', orderIndex: 2, isDefault: false, isClosed: false, color: '#F59E0B' },
    { name: 'Waiting on Customer', orderIndex: 3, isDefault: false, isClosed: false, color: '#F97316' },
    { name: 'Resolved', orderIndex: 4, isDefault: false, isClosed: true, color: '#10B981' },
    { name: 'Closed', orderIndex: 5, isDefault: false, isClosed: true, color: '#6B7280' }
  ];

  for (const status of statuses) {
    await prisma.ticketStatus.upsert({
      where: { orderIndex: status.orderIndex },
      update: {},
      create: status,
    });
  }

  // Seed default ticket types
  const types = [
    { name: 'Support', description: 'General support requests' },
    { name: 'Delivery', description: 'Delivery and shipping issues', defaultTeam: 'logistics' },
    { name: 'Billing', description: 'Billing and payment questions', defaultTeam: 'billing', defaultPriority: 'high' },
    { name: 'Quality', description: 'Product quality issues', defaultTeam: 'quality' },
    { name: 'Return', description: 'Return and refund requests', defaultTeam: 'returns' },
    { name: 'Other', description: 'Other inquiries' }
  ];

  for (const type of types) {
    await prisma.ticketType.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    });
  }

  // Seed default priorities
  const priorities = [
    { name: 'Low', orderIndex: 0, color: '#6B7280' },
    { name: 'Normal', orderIndex: 1, color: '#3B82F6' },
    { name: 'High', orderIndex: 2, color: '#F59E0B' },
    { name: 'Urgent', orderIndex: 3, color: '#EF4444' }
  ];

  for (const priority of priorities) {
    await prisma.priority.upsert({
      where: { orderIndex: priority.orderIndex },
      update: {},
      create: priority,
    });
  }

  // Seed business hours
  const businessHours = await prisma.businessHours.upsert({
    where: { name: 'Standard Business Hours' },
    update: {},
    create: {
      name: 'Standard Business Hours',
      timezone: 'America/New_York',
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: null,
      sunday: null
    },
  });

  // Seed SLA policies
  const slaPolicies = [
    { name: 'Urgent Priority SLA', priority: 'urgent', firstResponseMinutes: 15, resolveMinutes: 120 },
    { name: 'High Priority SLA', priority: 'high', firstResponseMinutes: 60, resolveMinutes: 480 },
    { name: 'Normal Priority SLA', priority: 'normal', firstResponseMinutes: 240, resolveMinutes: 1440 },
    { name: 'Low Priority SLA', priority: 'low', firstResponseMinutes: 480, resolveMinutes: 2880 }
  ];

  for (const sla of slaPolicies) {
    await prisma.slaPolicy.upsert({
      where: { priority: sla.priority },
      update: {},
      create: {
        ...sla,
        businessHoursId: businessHours.id
      },
    });
  }

  // Seed default macros
  const macros = [
    {
      name: 'Request Photos',
      description: 'Ask customer to provide photos of the issue',
      team: null, // Global macro
      actions: [
        { type: 'set_status', value: 'waiting_customer' },
        { type: 'send_template', template: 'request_photos', body: 'Thank you for contacting us. To better assist you, could you please provide photos of the issue? This will help us understand the problem and provide the best solution.' }
      ],
      createdBy: 'system'
    },
    {
      name: 'Escalate to Manager',
      description: 'Escalate ticket to team manager',
      team: null,
      actions: [
        { type: 'set_priority', value: 'high' },
        { type: 'add_internal_note', body: 'Ticket escalated to management for review.' },
        { type: 'add_watcher', role: 'manager' }
      ],
      createdBy: 'system'
    },
    {
      name: 'Order Status Update',
      description: 'Provide order status update to customer',
      team: 'support',
      actions: [
        { type: 'send_template', template: 'order_status', body: 'Thank you for your inquiry. Let me check the status of your order and get back to you with an update within the next hour.' },
        { type: 'set_status', value: 'in_progress' }
      ],
      createdBy: 'system'
    },
    {
      name: 'Billing Investigation',
      description: 'Start billing investigation process',
      team: 'billing',
      actions: [
        { type: 'set_status', value: 'in_progress' },
        { type: 'set_priority', value: 'high' },
        { type: 'add_internal_note', body: 'Starting billing investigation. Will review account and transaction history.' },
        { type: 'assign_team', value: 'billing' }
      ],
      createdBy: 'system'
    },
    {
      name: 'Return Authorization',
      description: 'Process return authorization',
      team: 'returns',
      actions: [
        { type: 'set_status', value: 'in_progress' },
        { type: 'send_template', template: 'return_process', body: 'We have received your return request. We will review your order details and get back to you with return authorization and instructions within 24 hours.' },
        { type: 'assign_team', value: 'returns' }
      ],
      createdBy: 'system'
    }
  ];

  for (const macro of macros) {
    await prisma.macro.upsert({
      where: { name: macro.name },
      update: {},
      create: macro,
    });
  }

  // Seed email identities for different teams
  const emailIdentities = [
    { team: 'support', fromName: 'Customer Support', fromEmail: 'support@company.com', isDefault: true },
    { team: 'billing', fromName: 'Billing Team', fromEmail: 'billing@company.com', isDefault: false },
    { team: 'returns', fromName: 'Returns Department', fromEmail: 'returns@company.com', isDefault: false },
    { team: 'logistics', fromName: 'Logistics Team', fromEmail: 'logistics@company.com', isDefault: false }
  ];

  for (const identity of emailIdentities) {
    await prisma.emailIdentity.upsert({
      where: { team_fromEmail: { team: identity.team, fromEmail: identity.fromEmail } },
      update: {},
      create: identity,
    });
  }

  // Seed default routing rules
  const routingRules = [
    {
      name: 'Billing Issues to Billing Team',
      conditions: { type: 'billing' },
      actions: [
        { type: 'assign_team', value: 'billing' },
        { type: 'set_priority', value: 'high' }
      ],
      orderIndex: 1,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Delivery Issues to Logistics',
      conditions: { type: 'delivery' },
      actions: [
        { type: 'assign_team', value: 'logistics' },
        { type: 'set_priority', value: 'high' }
      ],
      orderIndex: 2,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Returns to Returns Team',
      conditions: { type: 'return' },
      actions: [
        { type: 'assign_team', value: 'returns' }
      ],
      orderIndex: 3,
      isActive: true,
      createdBy: 'system'
    },
    {
      name: 'Quality Issues to Quality Team',
      conditions: { type: 'quality' },
      actions: [
        { type: 'assign_team', value: 'quality' },
        { type: 'set_priority', value: 'high' }
      ],
      orderIndex: 4,
      isActive: true,
      createdBy: 'system'
    }
  ];

  for (const rule of routingRules) {
    await prisma.routingRule.upsert({
      where: { orderIndex: rule.orderIndex },
      update: {},
      create: rule,
    });
  }

  console.log('✅ Ticketing system seeded successfully!');
}

export default seedTicketingSystem;

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedTicketingSystem()
    .catch((e) => {
      console.error('❌ Error seeding ticketing system:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}