import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";

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
  createdAt: string;
  currentPeriodEnd: string;
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

export async function GET(request: NextRequest) {
  try {
    const { admin } = await authenticate(request);

    // Query current app subscriptions
    const response = await admin.graphql(
      `#graphql
        query {
          currentAppInstallation {
            activeSubscriptions {
              id
              name
              status
              createdAt
              currentPeriodEnd
              lineItems {
                id
                plan {
                  pricingDetails {
                    ... on AppRecurringPricing {
                      price {
                        amount
                        currencyCode
                      }
                      interval
                    }
                  }
                }
              }
            }
          }
        }`
    );

    const data = await response.json() as GraphQLResponse;

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: "Failed to fetch subscription", details: data.errors },
        { status: 500 }
      );
    }

    const subscriptions = data.data?.currentAppInstallation.activeSubscriptions || [];
    
    // Find the active subscription
    const activeSubscription = subscriptions.find(
      (sub: Subscription) => sub.status === "ACTIVE"
    );

    return NextResponse.json({
      hasActiveSubscription: !!activeSubscription,
      subscription: activeSubscription || null,
      allSubscriptions: subscriptions
    });

  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
