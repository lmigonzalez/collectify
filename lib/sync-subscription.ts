import { Session } from "@shopify/shopify-api";
import prisma from "./db";

/**
 * Query Shopify's GraphQL API for the current active subscription
 */
const ACTIVE_SUBSCRIPTION_QUERY = `#graphql
  query GetActiveSubscription {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        test
        createdAt
      }
    }
  }
`;

type AppSubscription = {
  id: string;
  name: string;
  status: string;
  test: boolean;
  createdAt: string;
};

type ActiveSubscriptionResponse = {
  data?: {
    currentAppInstallation?: {
      activeSubscriptions?: AppSubscription[] | null;
    } | null;
  };
};

type AdminGraphqlClient = {
  graphql<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<{
    json(): Promise<T>;
  }>;
};

/**
 * Sync the subscription from Shopify to the local database
 * 
 * This function:
 * 1. Queries Shopify for the active subscription
 * 2. Extracts the plan name from the subscription
 * 3. Updates the local database with the plan information
 * 
 * Call this function periodically or after critical operations to ensure
 * your local database is in sync with Shopify's managed pricing.
 * 
 * @param shop - The shop domain (e.g., 'example.myshopify.com')
 * @param adminApiClient - The Shopify Admin API client
 * @returns The synced subscription data
 */
export async function syncSubscriptionFromShopify(
  shop: string,
  adminApiClient: AdminGraphqlClient
): Promise<{
  plan: "free" | "premium";
  status: string;
  hasActiveSubscription: boolean;
  shopifySubscriptionId: string | null;
}> {
  try {
    // Query Shopify for active subscriptions
    const response =
      await adminApiClient.graphql<ActiveSubscriptionResponse>(
        ACTIVE_SUBSCRIPTION_QUERY
      );
    const payload = await response.json();

    const activeSubscriptions =
      payload.data?.currentAppInstallation?.activeSubscriptions || [];

    // If no active subscription, user is on free plan
    if (activeSubscriptions.length === 0) {
      await prisma.subscription.upsert({
        where: { shop },
        update: {
          plan: "free",
          status: "active",
          shopifySubscriptionId: null,
          updatedAt: new Date(),
        },
        create: {
          shop,
          plan: "free",
          status: "active",
          shopifySubscriptionId: null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        plan: "free",
        status: "active",
        hasActiveSubscription: false,
        shopifySubscriptionId: null,
      };
    }

    // Get the most recent active subscription
    const subscription = activeSubscriptions[0];
    const planName = extractPlanName(subscription.name);
    const plan = planName === "pro" ? "premium" : "free";
    const status = subscription.status === "ACTIVE" ? "active" : "cancelled";

    // Update the database
    await prisma.subscription.upsert({
      where: { shop },
      update: {
        plan,
        status,
        shopifySubscriptionId: subscription.id,
        updatedAt: new Date(),
      },
      create: {
        shop,
        plan,
        status,
        shopifySubscriptionId: subscription.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log("✅ Synced subscription from Shopify:", {
      shop,
      plan,
      status,
      subscriptionName: subscription.name,
    });

    return {
      plan: plan as "free" | "premium",
      status,
      hasActiveSubscription: true,
      shopifySubscriptionId: subscription.id,
    };
  } catch (error) {
    console.error("❌ Error syncing subscription from Shopify:", error);
    throw error;
  }
}

/**
 * Helper function to extract a normalized plan name from the subscription name
 * 
 * Customize this based on your plan naming convention in the Partner Dashboard.
 * For example, if your plans are named:
 * - "Free Plan" → returns "free"
 * - "Pro Plan" → returns "pro"
 * - "Premium" → returns "pro"
 */
function extractPlanName(subscriptionName: string): string {
  const lowerName = subscriptionName.toLowerCase();

  // Check for "pro" or "premium" keywords
  if (lowerName.includes("pro") || lowerName.includes("premium")) {
    return "pro";
  }

  // Default to free
  return "free";
}

