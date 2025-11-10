import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";

// GraphQL query to get the current active subscription
const ACTIVE_SUBSCRIPTION_QUERY = `#graphql
  query GetActiveSubscription {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        test
        trialDays
        currentPeriodEnd
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
  trialDays: number;
  currentPeriodEnd: string | null;
  createdAt: string;
};

type ActiveSubscriptionResponse = {
  currentAppInstallation: {
    activeSubscriptions: AppSubscription[];
  };
};

type GraphQLResponse = {
  data?: ActiveSubscriptionResponse;
  errors?: Array<{
    message: string;
  }>;
};

/**
 * GET /api/subscriptions/status
 * 
 * Returns the current active subscription for the authenticated shop.
 * This is used to determine which plan the merchant selected in Shopify's
 * managed pricing page.
 */
export async function GET(request: NextRequest) {
  try {
    const { admin, session } = await authenticate(request);

    // Query Shopify for the active subscription
    const response = await admin.graphql<ActiveSubscriptionResponse>(
      ACTIVE_SUBSCRIPTION_QUERY
    );

    const payload = (await response.json()) as GraphQLResponse;

    if (payload.errors?.length) {
      console.error("GraphQL errors fetching subscription:", payload.errors);
      return NextResponse.json(
        { error: "Failed to fetch subscription", details: payload.errors },
        { status: 502 }
      );
    }

    const activeSubscriptions = 
      payload.data?.currentAppInstallation.activeSubscriptions || [];

    // If no active subscription, user is on free plan
    if (activeSubscriptions.length === 0) {
      return NextResponse.json({
        hasActiveSubscription: false,
        plan: "free",
        subscription: null,
        shop: session.shop
      });
    }

    // Get the most recent active subscription
    const subscription = activeSubscriptions[0];

    // Extract plan name from subscription name
    // Shopify's managed pricing uses the plan display name you set
    // Common convention: "Free Plan", "Pro Plan", "Premium", etc.
    const planName = extractPlanName(subscription.name);

    return NextResponse.json({
      hasActiveSubscription: true,
      plan: planName,
      subscription: {
        id: subscription.id,
        name: subscription.name,
        status: subscription.status,
        test: subscription.test,
        trialDays: subscription.trialDays,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt
      },
      shop: session.shop
    });

  } catch (error) {
    console.error("Error retrieving subscription status:", error);
    
    if (error instanceof Error && error.message === "Authentication failed") {
      return NextResponse.json(
        { error: "Unauthorized - please authenticate" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to extract a normalized plan name from the subscription name
 * You can customize this based on your plan naming convention
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
