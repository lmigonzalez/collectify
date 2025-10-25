// app/api/products/create/route.ts
// Example of a protected API route that uses the stored token

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";
import type {
  CreateProductMutation,
  CreateProductMutationVariables,
  GetProductsQuery,
  GetProductsQueryVariables,
} from "@/types/graphql";

/**
 * This is a protected API route
 * It requires authentication and uses the stored token to call Shopify API
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate the request
    // This retrieves the session (which contains the access token) from database
    const { session, admin } = await authenticate(request);

    console.log("🔐 Authenticated for shop:", session.shop);
    console.log(
      "🔑 Using token:",
      session.accessToken?.substring(0, 20) + "..."
    );

    // Step 2: Get request body
    const body = await request.json();
    const { title, description } = body;

    // Step 3: Make GraphQL query to Shopify API with types
    // The admin.graphql() function automatically includes the access token
    const response = await admin.graphql<CreateProductMutation>(
      `#graphql
        mutation createProduct($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              handle
              status
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          input: {
            title: title || "New Product",
            descriptionHtml: description || "<p>Product description</p>",
          },
        } as CreateProductMutationVariables,
      }
    );

    // Step 4: Parse response - now with full type safety! ✨
    const data = await response.json();

    // Check for errors
    if (data.data?.productCreate?.userErrors?.length > 0) {
      return NextResponse.json(
        {
          error: "GraphQL errors",
          details: data.data.productCreate.userErrors,
        },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      product: data.data.productCreate.product,
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Example GET route - Fetch products
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/products/create - Starting authentication");
    const { session, admin } = await authenticate(request);
    console.log("✅ Authentication successful for shop:", session.shop);

    // Query products with type safety ✨
    const response = await admin.graphql<GetProductsQuery>(
      `#graphql
        query getProducts($first: Int!) {
          products(first: $first) {
            edges {
              node {
                id
                title
                handle
                status
                totalInventory
                variants(first: 5) {
                  edges {
                    node {
                      id
                      price
                      inventoryQuantity
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
        }
      `,
      {
        variables: {
          first: 10,
        } as GetProductsQueryVariables,
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      products: data.data.products.edges.map((edge: any) => edge.node),
      pageInfo: data.data.products.pageInfo,
    });
  } catch (error) {
    console.error("❌ API error:", error);
    console.error("❌ Error details:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * HOW THE TOKEN IS USED:
 *
 * 1. Request comes to /api/products/create
 * 2. authenticate(request) is called
 * 3. It extracts shop from JWT token or session cookie
 * 4. Loads session from database using shop
 * 5. Session contains accessToken: "shpat_abc123..."
 * 6. Creates GraphQL client with session
 * 7. admin.graphql() makes request to Shopify API with headers:
 *    {
 *      'X-Shopify-Access-Token': session.accessToken,
 *      'Content-Type': 'application/json'
 *    }
 * 8. Shopify validates token and processes request
 * 9. Response is returned to client
 *
 * THE TOKEN NEVER LEAVES THE SERVER - it's stored in database and used server-side only
 */

/**
 * CALLING THIS API FROM THE FRONTEND:
 *
 * For embedded apps:
 *
 * const shopify = useAppBridge();
 * const token = await shopify.idToken();
 *
 * const response = await fetch('/api/products/create', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     title: 'Amazing Product',
 *     description: '<p>This is amazing!</p>',
 *   }),
 * });
 *
 * const data = await response.json();
 * console.log(data.product);
 */
