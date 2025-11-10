import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

/**
 * Webhook handler for APP_SUBSCRIPTIONS_UPDATE
 * 
 * This webhook fires when:
 * - A merchant subscribes to a plan
 * - A subscription is updated
 * - A subscription is cancelled
 * 
 * Payload structure from Shopify:
 * {
 *   "app_subscription": {
 *     "admin_graphql_api_id": "gid://shopify/AppSubscription/12345",
 *     "name": "Pro Plan",
 *     "status": "ACTIVE",
 *     "admin_graphql_api_shop_id": "gid://shopify/Shop/67890",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z",
 *     "currency": "USD",
 *     "capped_amount": null
 *   }
 * }
 */

type AppSubscriptionWebhook = {
  app_subscription: {
    admin_graphql_api_id: string;
    name: string;
    status: "ACTIVE" | "CANCELLED" | "DECLINED" | "EXPIRED" | "FROZEN" | "PENDING";
    admin_graphql_api_shop_id: string;
    created_at: string;
    updated_at: string;
    currency?: string;
    capped_amount?: number | null;
  };
};

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Shopify
    const hmac = request.headers.get("x-shopify-hmac-sha256");
    const shop = request.headers.get("x-shopify-shop-domain");
    
    if (!hmac || !shop) {
      console.error("Missing required webhook headers");
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 401 }
      );
    }

    // Get the raw body for HMAC verification
    const rawBody = await request.text();
    
    // Verify HMAC
    const isValid = verifyWebhookHmac(rawBody, hmac);
    if (!isValid) {
      console.error("Invalid webhook HMAC");
      return NextResponse.json(
        { error: "Invalid HMAC" },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload: AppSubscriptionWebhook = JSON.parse(rawBody);
    const { app_subscription } = payload;

    console.log("📬 Received subscription update webhook:", {
      shop,
      subscriptionId: app_subscription.admin_graphql_api_id,
      name: app_subscription.name,
      status: app_subscription.status
    });

    // Extract plan name from subscription name
    const planName = extractPlanName(app_subscription.name);
    
    // Determine the plan type for your database
    const plan = planName === "pro" ? "premium" : "free";
    
    // Determine subscription status
    const status = app_subscription.status === "ACTIVE" ? "active" : "cancelled";

    // Update or create subscription in your database
    await prisma.subscription.upsert({
      where: { shop },
      update: {
        plan,
        status,
        shopifySubscriptionId: app_subscription.admin_graphql_api_id,
        updatedAt: new Date()
      },
      create: {
        shop,
        plan,
        status,
        shopifySubscriptionId: app_subscription.admin_graphql_api_id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    console.log("✅ Successfully synced subscription to database:", {
      shop,
      plan,
      status
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Error processing subscription webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Verify the webhook HMAC signature
 */
function verifyWebhookHmac(rawBody: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  
  if (!secret) {
    console.error("SHOPIFY_API_SECRET not configured");
    return false;
  }

  const hash = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  return hash === hmacHeader;
}

/**
 * Helper function to extract a normalized plan name from the subscription name
 * Customize this based on your plan naming convention in Partner Dashboard
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

