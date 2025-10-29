// lib/subscription-middleware.ts
// Middleware to protect routes based on subscription status

import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionInfo, hasFeatureAccess } from "./subscription-utils";

export interface SubscriptionMiddlewareOptions {
  requiredFeature?: string;
  redirectTo?: string;
  allowFreePlan?: boolean;
}

/**
 * Middleware to check subscription status and protect routes
 */
export async function subscriptionMiddleware(
  request: NextRequest,
  options: SubscriptionMiddlewareOptions = {}
) {
  const { requiredFeature, redirectTo = "/plan", allowFreePlan = true } = options;

  try {
    // Extract shop domain from request
    const shop = request.headers.get("x-shopify-shop-domain");
    if (!shop) {
      return NextResponse.json(
        { error: "Shop domain not found" },
        { status: 400 }
      );
    }

    // Get subscription info
    const subscriptionInfo = await getSubscriptionInfo(shop);

    // Check if user has active subscription
    if (!subscriptionInfo.hasActiveSubscription) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // If specific feature is required, check access
    if (requiredFeature) {
      const hasAccess = hasFeatureAccess(subscriptionInfo, requiredFeature);
      if (!hasAccess) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }

    // If free plan is not allowed and user is on free plan
    if (!allowFreePlan && subscriptionInfo.isFreePlan) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // Add subscription info to request headers for use in API routes
    const response = NextResponse.next();
    response.headers.set("x-subscription-info", JSON.stringify(subscriptionInfo));
    
    return response;
  } catch (error) {
    console.error("Subscription middleware error:", error);
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
}

/**
 * Helper function to extract subscription info from request headers
 */
export function getSubscriptionInfoFromRequest(request: NextRequest) {
  const subscriptionInfoHeader = request.headers.get("x-subscription-info");
  if (subscriptionInfoHeader) {
    try {
      return JSON.parse(subscriptionInfoHeader);
    } catch (error) {
      console.error("Error parsing subscription info:", error);
    }
  }
  return null;
}
