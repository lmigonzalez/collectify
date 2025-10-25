// app/api/products/route.ts
// API route to fetch products from Shopify

import { NextRequest, NextResponse } from "next/server";
import { authenticate, authenticateAdmin } from "@/lib/authenticate";
import type {
  GetProductsQuery,
  GetProductsQueryVariables,
} from "@/types/graphql";

/**
 * GET /api/products
 * Fetches products from the Shopify store
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/products - Starting authentication");

    // Step 1: Authenticate the request (prefer embedded token, fallback to cookie session)
    let session, admin;
    try {
      ({ session, admin } = await authenticate(request));
      console.log("✅ Authentication (token) successful for shop:", session.shop);
    } catch (tokenAuthError) {
      console.warn("⚠️ Token auth failed, attempting cookie session auth:", tokenAuthError);
      ({ session, admin } = await authenticateAdmin(request));
      console.log("✅ Authentication (cookie) successful for shop:", session.shop);
    }

    // Step 2: Get query parameters
    const { searchParams } = new URL(request.url);
    const first = parseInt(searchParams.get("first") || "50");
    const query = searchParams.get("query") || "";
    const after = searchParams.get("after");
    const before = searchParams.get("before");

    console.log(`📦 Fetching ${first} products${query ? ` with query: "${query}"` : ""}${after ? ` after cursor: ${after}` : ""}${before ? ` before cursor: ${before}` : ""}`);

    // Step 3: Query products with type safety and pagination
    const response = await admin.graphql<GetProductsQuery>(
      `#graphql
        query getProducts($first: Int!, $query: String, $after: String, $before: String) {
          products(first: $first, query: $query, after: $after, before: $before) {
            edges {
              node {
                id
                title
                handle
                status
                totalInventory
                createdAt
                updatedAt
                vendor
                productType
                tags
                variants(first: 5) {
                  edges {
                    node {
                      id
                      title
                      price
                      inventoryQuantity
                      sku
                    }
                  }
                }
                images(first: 1) {
                  edges {
                    node {
                      id
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `,
      {
        variables: {
          first,
          query: query || undefined,
          after: after || undefined,
          before: before || undefined,
        } as GetProductsQueryVariables,
      }
    );

    const data = await response.json();

    // Check for GraphQL errors
    if (data.errors) {
      console.error("❌ GraphQL errors:", data.errors);
      return NextResponse.json(
        { 
          error: "GraphQL errors", 
          details: data.errors 
        },
        { status: 400 }
      );
    }

    const products = data.data.products.edges.map((edge: any) => edge.node);
    
    console.log(`✅ Successfully fetched ${products.length} products`);

    return NextResponse.json({
      success: true,
      products,
      pageInfo: data.data.products.pageInfo,
      count: products.length,
      debug: {
        shop: session.shop,
        query: query || "none",
        first: first,
        hasNextPage: data.data.products.pageInfo.hasNextPage,
      }
    });

  } catch (error) {
    console.error("❌ API error:", error);
    
    if (error instanceof Error && error.message === "Authentication failed") {
      return NextResponse.json(
        { error: "Unauthorized - please authenticate" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to fetch products", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Creates a new product (if needed in the future)
 */
export async function POST(request: NextRequest) {
  try {
    const { session, admin } = await authenticate(request);
    const body = await request.json();
    
    // This could be used for creating products if needed
    // For now, we'll just return a not implemented response
    return NextResponse.json(
      { error: "Product creation not implemented in this endpoint" },
      { status: 501 }
    );
    
  } catch (error) {
    console.error("❌ API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
