import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";

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

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: "Failed to fetch subscription", details: data.errors },
        { status: 500 }
      );
    }

    const subscriptions = data.data.currentAppInstallation.activeSubscriptions;
    
    // Find the active subscription
    const activeSubscription = subscriptions.find(
      (sub: any) => sub.status === "ACTIVE"
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
