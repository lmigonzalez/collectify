// lib/subscription-utils.ts
// Utility functions for subscription management

import shopify from "./shopify";

interface SubscriptionPlan {
  pricingDetails: {
    price: {
      amount: string;
      currencyCode: string;
    };
    interval: string;
  };
}

interface SubscriptionLineItem {
  id: string;
  plan: SubscriptionPlan;
}

interface Subscription {
  id: string;
  name: string;
  status: string;
  lineItems: SubscriptionLineItem[];
}

interface GraphQLResponse {
  data?: {
    currentAppInstallation: {
      activeSubscriptions: Subscription[];
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
  }>;
}

export interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  isProPlan: boolean;
  isFreePlan: boolean;
  subscription: {
    id: string;
    name: string;
    status: string;
    price: {
      amount: number;
      currencyCode: string;
    };
  } | null;
}

/**
 * Get current subscription information for a shop
 * This works with both manual billing and managed pricing
 */
export async function getSubscriptionInfo(
  shop: string
): Promise<SubscriptionInfo> {
  try {
    // Get session for the shop
    const session = await shopify.config.sessionStorage.loadSession(shop);
    if (!session) {
      return {
        hasActiveSubscription: false,
        isProPlan: false,
        isFreePlan: false,
        subscription: null,
      };
    }

    // Create GraphQL client
    const client = new shopify.clients.Graphql({ session });

    // Query current subscriptions
    const data = (await client.request(`#graphql
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            lineItems {
              id
              plan {
                pricingDetails {
                  ... on AppRecurringPricing {
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }`)) as GraphQLResponse;
    const subscriptions =
      data.data?.currentAppInstallation.activeSubscriptions || [];

    // Find active subscription
    const activeSubscription = subscriptions.find(
      (sub: Subscription) => sub.status === "ACTIVE"
    );

    if (!activeSubscription) {
      return {
        hasActiveSubscription: false,
        isProPlan: false,
        isFreePlan: false,
        subscription: null,
      };
    }

    const price = activeSubscription.lineItems[0]?.plan?.pricingDetails?.price;
    const interval =
      activeSubscription.lineItems[0]?.plan?.pricingDetails?.interval;
    const priceAmount = price ? parseFloat(price.amount) : 0;
    const isProPlan = price && (priceAmount === 10 || priceAmount === 100);
    const isFreePlan = price && priceAmount === 0;

    return {
      hasActiveSubscription: true,
      isProPlan,
      isFreePlan,
      subscription: {
        id: activeSubscription.id,
        name: activeSubscription.name,
        status: activeSubscription.status,
        price: price
          ? { amount: priceAmount, currencyCode: price.currencyCode }
          : { amount: 0, currencyCode: "USD" },
      },
    };
  } catch (error) {
    console.error("Error fetching subscription info:", error);
    return {
      hasActiveSubscription: false,
      isProPlan: false,
      isFreePlan: false,
      subscription: null,
    };
  }
}

/**
 * Check if user has access to a specific feature based on their plan
 */
export function hasFeatureAccess(
  subscriptionInfo: SubscriptionInfo,
  feature: string
): boolean {
  if (!subscriptionInfo.hasActiveSubscription) {
    return false;
  }

  const freeFeatures = [
    "basic_collections",
    "csv_import",
    "csv_export",
    "basic_support",
  ];

  const proFeatures = [
    "unlimited_collections",
    "batch_processing",
    "advanced_analytics",
    "priority_support",
    "api_access",
  ];

  if (subscriptionInfo.isFreePlan) {
    return freeFeatures.includes(feature);
  }

  if (subscriptionInfo.isProPlan) {
    return [...freeFeatures, ...proFeatures].includes(feature);
  }

  return false;
}

/**
 * Get plan limits based on subscription
 */
export function getPlanLimits(subscriptionInfo: SubscriptionInfo) {
  if (!subscriptionInfo.hasActiveSubscription) {
    return {
      maxCollections: 0,
      maxProductsPerCollection: 0,
      canUseAPI: false,
      canBulkOperations: false,
    };
  }

  if (subscriptionInfo.isFreePlan) {
    return {
      maxCollectionsPerMonth: 100,
      maxCollectionsPerBatch: 100,
      canUseAPI: false,
      canBatchProcessing: false,
    };
  }

  if (subscriptionInfo.isProPlan) {
    return {
      maxCollectionsPerMonth: -1, // unlimited
      maxCollectionsPerBatch: 1000,
      canUseAPI: true,
      canBatchProcessing: true,
    };
  }

  return {
    maxCollectionsPerMonth: 0,
    maxCollectionsPerBatch: 0,
    canUseAPI: false,
    canBatchProcessing: false,
  };
}
