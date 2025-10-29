const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedUsageLimits() {
  console.log('🌱 Seeding usage limits...');

  try {
    // Create usage limits for each plan
    await prisma.usageLimit.upsert({
      where: { plan: 'free' },
      update: {},
      create: {
        plan: 'free',
        monthlyLimit: 100,
        perOperationLimit: 50,
        price: 0,
        features: [
          'Basic CSV import/export',
          '100 collections per month',
          'Email support'
        ]
      }
    });

    await prisma.usageLimit.upsert({
      where: { plan: 'premium' },
      update: {},
      create: {
        plan: 'premium',
        monthlyLimit: 1000,
        perOperationLimit: 1000,
        price: 999, // $9.99 in cents
        features: [
          'Unlimited collections per month',
          'Bulk operations',
          'Advanced filtering',
          'Priority support',
          'API access'
        ]
      }
    });

    console.log('✅ Usage limits seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding usage limits:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedUsageLimits()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
