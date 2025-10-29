import prisma from './db';

export type Plan = 'free' | 'premium';

export interface PlanLimits {
  monthlyLimit: number;
  perOperationLimit: number;
  price: number; // in cents
  features: string[];
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    monthlyLimit: 100,
    perOperationLimit: 50,
    price: 0,
    features: [
      'Basic CSV import/export',
      '100 collections per month',
      'Email support'
    ]
  },
  premium: {
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
};

export interface UsageCheck {
  canProceed: boolean;
  remaining: number;
  limit: number;
  upgradeRequired: boolean;
}

/**
 * Get or create subscription for a shop
 */
export async function getOrCreateSubscription(shop: string): Promise<{
  id: string;
  plan: Plan;
  status: string;
}> {
  let subscription = await prisma.subscription.findUnique({
    where: { shop }
  });

  if (!subscription) {
    // Create free subscription by default
    subscription = await prisma.subscription.create({
      data: {
        shop,
        plan: 'free',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });
  }

  return {
    id: subscription.id,
    plan: subscription.plan as Plan,
    status: subscription.status
  };
}

/**
 * Get current month usage for a shop
 */
export async function getCurrentUsage(shop: string): Promise<{
  collectionsImported: number;
  collectionsExported: number;
  total: number;
}> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const usage = await prisma.usage.findUnique({
    where: {
      shop_month_year: {
        shop,
        month,
        year
      }
    }
  });

  if (!usage) {
    return {
      collectionsImported: 0,
      collectionsExported: 0,
      total: 0
    };
  }

  return {
    collectionsImported: usage.collectionsImported,
    collectionsExported: usage.collectionsExported,
    total: usage.collectionsImported + usage.collectionsExported
  };
}

/**
 * Check if shop can perform operation within limitss
 */
export async function checkUsageLimit(
  shop: string,
  operation: 'import' | 'export',
  requestedCount: number
): Promise<UsageCheck> {
  const subscription = await getOrCreateSubscription(shop);
  const currentUsage = await getCurrentUsage(shop);
  const limits = PLAN_LIMITS[subscription.plan];

  // Check per-operation limit
  if (requestedCount > limits.perOperationLimit) {
    return {
      canProceed: false,
      remaining: limits.perOperationLimit,
      limit: limits.perOperationLimit,
      upgradeRequired: subscription.plan === 'free'
    };
  }

  // Check monthly limit
  const projectedTotal = currentUsage.total + requestedCount;
  if (projectedTotal > limits.monthlyLimit) {
    return {
      canProceed: false,
      remaining: Math.max(0, limits.monthlyLimit - currentUsage.total),
      limit: limits.monthlyLimit,
      upgradeRequired: subscription.plan === 'free'
    };
  }

  return {
    canProceed: true,
    remaining: limits.monthlyLimit - projectedTotal,
    limit: limits.monthlyLimit,
    upgradeRequired: false
  };
}

/**
 * Record usage for a shop
 */
export async function recordUsage(
  shop: string,
  operation: 'import' | 'export',
  count: number
): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const subscription = await getOrCreateSubscription(shop);

  await prisma.usage.upsert({
    where: {
      shop_month_year: {
        shop,
        month,
        year
      }
    },
    update: {
      collectionsImported: operation === 'import' 
        ? { increment: count }
        : undefined,
      collectionsExported: operation === 'export'
        ? { increment: count }
        : undefined,
      updatedAt: new Date()
    },
    create: {
      shop,
      subscriptionId: subscription.id,
      month,
      year,
      collectionsImported: operation === 'import' ? count : 0,
      collectionsExported: operation === 'export' ? count : 0
    }
  });
}

/**
 * Get usage statistics for a shop
 */
export async function getUsageStats(shop: string): Promise<{
  current: {
    collectionsImported: number;
    collectionsExported: number;
    total: number;
  };
  limits: PlanLimits;
  plan: Plan;
  status: string;
  resetDate: Date;
}> {
  const subscription = await getOrCreateSubscription(shop);
  const currentUsage = await getCurrentUsage(shop);
  const limits = PLAN_LIMITS[subscription.plan];

  // Calculate reset date (next month)
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    current: currentUsage,
    limits,
    plan: subscription.plan,
    status: subscription.status,
    resetDate
  };
}

/**
 * Upgrade shop to premium plan
 */
export async function upgradeToPremium(shop: string): Promise<void> {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await prisma.subscription.upsert({
    where: { shop },
    update: {
      plan: 'premium',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      updatedAt: new Date()
    },
    create: {
      shop,
      plan: 'premium',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth
    }
  });
}

/**
 * Downgrade shop to free plan
 */
export async function downgradeToFree(shop: string): Promise<void> {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await prisma.subscription.update({
    where: { shop },
    data: {
      plan: 'free',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      updatedAt: new Date()
    }
  });
}
