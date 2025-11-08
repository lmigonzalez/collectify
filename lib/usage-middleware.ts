import { NextRequest, NextResponse } from "next/server";
import shopify from "./shopify";
import { checkUsageLimit, recordUsage, getUsageStats } from "./subscription";

export interface UsageMiddlewareOptions {
  operation: "import" | "export";
  getRequestedCount: (request: NextRequest) => Promise<number>;
}

/**
 * Middleware to check usage limits before processing requests
 */
export async function withUsageLimit<T = unknown>(
  request: NextRequest,
  options: UsageMiddlewareOptions,
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  try {
    // Extract shop from session (you'll need to implement this based on your auth)
    let shop =
      request.headers.get("x-shopify-shop-domain") ||
      request.nextUrl.searchParams.get("shop");

    if (!shop) {
      const authHeader = request.headers.get("authorization");

      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.replace("Bearer ", "");
          const payload = await shopify.session.decodeSessionToken(token);
          try {
            const destUrl = new URL(payload.dest);
            shop = destUrl.host;
          } catch {
            shop = payload.dest.replace(/^https?:\/\//, "").replace(/\/admin$/, "");
          }
        } catch (error) {
          console.warn("Failed to decode session token for shop lookupp:", error);
        }
      }
    }

    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found in request" } as T,
        { status: 400 }
      );
    }

    // Get requested count from the request
    const requestedCount = await options.getRequestedCount(request);

    // Check usage limits
    const usageCheck = await checkUsageLimit(
      shop,
      options.operation,
      requestedCount
    );

    if (!usageCheck.canProceed) {
      const stats = await getUsageStats(shop);

      return NextResponse.json(
        {
          error: "Usage limit exceeded",
          details: {
            operation: options.operation,
            requested: requestedCount,
            remaining: usageCheck.remaining,
            limit: usageCheck.limit,
            upgradeRequired: usageCheck.upgradeRequired,
            currentPlan: stats.plan,
            currentUsage: stats.current,
            resetDate: stats.resetDate,
          },
          upgradeUrl: usageCheck.upgradeRequired ? "/plan" : undefined,
        } as T,
        { status: 429 } // Too Many Requests
      );
    }

    // Proceed with the original handler
    const response = await handler(request);

    // If the operation was successful, record the usage
    if (response.status >= 200 && response.status < 300) {
      try {
        await recordUsage(shop, options.operation, requestedCount);
      } catch (error) {
        console.error("Failed to record usage:", error);
        // Don't fail the request if usage recording fails
      }
    }

    return response;
  } catch (error) {
    console.error("Usage middleware error:", error);
    return NextResponse.json(
      { error: "Internal server error" } as T,
      { status: 500 }
    );
  }
}

/**
 * Helper to get requested count from CSV import request
 */
export async function getImportCount(request: NextRequest): Promise<number> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) return 0;

    const csvContent = await file.text();
    const lines = csvContent.split("\n").filter((line) => line.trim());

    // Subtract 1 for header row
    return Math.max(0, lines.length - 1);
  } catch (error) {
    console.error("Error parsing import count:", error);
    return 0;
  }
}

/**
 * Helper to get requested count from export request
 */
export async function getExportCount(request: NextRequest): Promise<number> {
  try {
    // For exports, we need to check the actual number of collections
    // This is a simplified version - you might want to make a quick query
    // to get the actual count before processing
    return 1; // Default to 1 for now, actual count will be determined during processing
  } catch (error) {
    console.error("Error parsing export count:", error);
    return 1;
  }
}

/**
 * Create usage-aware response with current stats
 */
export function createUsageResponse(
  data: Record<string, unknown>,
  shop: string,
  operation: "import" | "export",
  requestedCount: number
): NextResponse {
  return NextResponse.json({
    ...data,
    usage: {
      operation,
      requested: requestedCount,
      // You can add more usage info here if needed
    },
  });
}
