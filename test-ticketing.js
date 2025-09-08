#!/usr/bin/env node

/**
 * Simple test script to validate the ticketing system
 * Run with: node test-ticketing.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseSchema() {
  console.log('🧪 Testing database schema...\n');

  try {
    // Test basic table existence and relationships
    const tests = [
      // Test ticket creation with relationships
      async () => {
        console.log('   ✓ Creating test ticket...');
        const ticket = await prisma.ticket.create({
          data: {
            orgId: 'test-org',
            subject: 'Test ticket creation',
            body: 'This is a test ticket to validate the schema',
            type: 'support',
            status: 'new',
            priority: 'normal',
            channel: 'web'
          }
        });
        return ticket.id;
      },

      // Test message creation
      async (ticketId) => {
        console.log('   ✓ Creating test message...');
        const message = await prisma.ticketMessage.create({
          data: {
            ticketId: ticketId,
            kind: 'public_reply',
            channel: 'email',
            body: 'This is a test message',
            createdBy: 'test-user'
          }
        });
        return message.id;
      },

      // Test watcher creation
      async (ticketId) => {
        console.log('   ✓ Creating test watcher...');
        await prisma.ticketWatcher.create({
          data: {
            ticketId: ticketId,
            userId: 'test-user'
          }
        });
      },

      // Test event logging
      async (ticketId) => {
        console.log('   ✓ Creating test event...');
        await prisma.ticketEvent.create({
          data: {
            ticketId: ticketId,
            eventType: 'created',
            data: { test: true },
            userId: 'test-user'
          }
        });
      },

      // Test ticket with all relationships
      async (ticketId) => {
        console.log('   ✓ Fetching ticket with relationships...');
        const ticketWithRelations = await prisma.ticket.findUnique({
          where: { id: ticketId },
          include: {
            messages: true,
            watchers: true,
            _count: {
              select: {
                messages: true,
                watchers: true
              }
            }
          }
        });
        
        if (!ticketWithRelations) {
          throw new Error('Could not fetch ticket with relationships');
        }
        
        if (ticketWithRelations.messages.length === 0) {
          throw new Error('Messages not properly linked');
        }
        
        if (ticketWithRelations.watchers.length === 0) {
          throw new Error('Watchers not properly linked');
        }
        
        console.log(`   ✓ Ticket has ${ticketWithRelations._count.messages} messages and ${ticketWithRelations._count.watchers} watchers`);
      },

      // Clean up test data
      async (ticketId) => {
        console.log('   ✓ Cleaning up test data...');
        await prisma.ticketMessage.deleteMany({ where: { ticketId } });
        await prisma.ticketWatcher.deleteMany({ where: { ticketId } });
        await prisma.ticketEvent.deleteMany({ where: { ticketId } });
        await prisma.ticket.delete({ where: { id: ticketId } });
      }
    ];

    // Run tests sequentially
    let ticketId;
    for (let i = 0; i < tests.length; i++) {
      const result = await tests[i](ticketId);
      if (i === 0) ticketId = result; // Save ticket ID from first test
    }

    console.log('\n✅ Database schema test completed successfully!\n');
    return true;

  } catch (error) {
    console.error('\n❌ Database schema test failed:', error.message);
    return false;
  }
}

async function testSeedData() {
  console.log('🌱 Testing seed data...\n');

  try {
    // Check if seed data exists
    const statusCount = await prisma.ticketStatus.count();
    const typeCount = await prisma.ticketType.count();
    const priorityCount = await prisma.priority.count();
    const slaCount = await prisma.slaPolicy.count();
    const macroCount = await prisma.macro.count();

    console.log(`   ✓ Ticket statuses: ${statusCount}`);
    console.log(`   ✓ Ticket types: ${typeCount}`);
    console.log(`   ✓ Priorities: ${priorityCount}`);
    console.log(`   ✓ SLA policies: ${slaCount}`);
    console.log(`   ✓ Macros: ${macroCount}`);

    if (statusCount === 0 || typeCount === 0 || priorityCount === 0 || slaCount === 0) {
      console.log('\n⚠️  Some seed data is missing. Run: npx tsx prisma/seed-tickets.ts');
      return false;
    }

    console.log('\n✅ Seed data validation completed!\n');
    return true;

  } catch (error) {
    console.error('\n❌ Seed data test failed:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('🌐 Testing API endpoints would require a running server...\n');
  console.log('   To test API endpoints:');
  console.log('   1. Start the development server: npm run dev');
  console.log('   2. Visit http://localhost:3000/admin/tickets');
  console.log('   3. Try creating a ticket and sending messages');
  console.log('   4. Test different views and search functionality\n');
}

async function main() {
  console.log('🎫 B2B Admin Portal - Ticketing System Test\n');
  console.log('==========================================\n');

  const schemaOk = await testDatabaseSchema();
  const seedOk = await testSeedData();
  
  await testAPIEndpoints();

  if (schemaOk && seedOk) {
    console.log('🎉 All tests passed! The ticketing system is ready to use.\n');
    console.log('Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to /admin/tickets in your browser');
    console.log('3. Test the full workflow with the UI\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Test runner failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });