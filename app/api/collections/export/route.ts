// app/api/collections/export/route.ts
// Export all collections from the store

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";
import { withUsageLimit, getExportCount } from "@/lib/usage-middleware";

interface Collection {
  id: string;
  title: string;
  handle: string;
  descriptionHtml?: string;
  updatedAt: string;
  sortOrder: string;
  templateSuffix?: string;
  image?: {
    url: string;
  };
  seo?: {
    title?: string;
    description?: string;
  };
  ruleSet?: {
    appliedDisjunctively: boolean;
    rules: Array<{
      column: string;
      relation: string;
      condition: string;
    }>;
  };
  productsCount?: {
    count: number;
  };
}

interface ExportResult {
  success: boolean;
  collections: Collection[];
  totalCount: number;
  error?: string;
}

type ExportResponse = 
  | { success: true; collections: Collection[]; totalCount: number }
  | { success: false; collections: Collection[]; totalCount: number; error: string };

interface GraphQLResponse {
  data?: {
    collections?: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: Collection[];
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * GET endpoint to export all collections from the store
 */
export async function GET(request: NextRequest): Promise<NextResponse<ExportResponse>> {
  return withUsageLimit(
    request,
    {
      operation: 'export',
      getRequestedCount: getExportCount
    },
    async (request): Promise<NextResponse<ExportResponse>> => {
      try {
        // Step 1: Authenticate the request
        const { session, admin } = await authenticate(request);

        console.log("🔐 Authenticated for shop:", session.shop);

    // Step 2: Fetch all collections using GraphQL
    const allCollections: Collection[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const response = await admin.graphql(`
        query getCollections($first: Int!, $after: String) {
          collections(first: $first, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              title
              handle
              descriptionHtml
              updatedAt
              sortOrder
              templateSuffix
              image {
                url
              }
              seo {
                title
                description
              }
              ruleSet {
                appliedDisjunctively
                rules {
                  column
                  relation
                  condition
                }
              }
              productsCount {
                count
              }
            }
          }
        }
      `, {
        variables: {
          first: 50, // Fetch 50 collections at a time
          after: cursor
        }
      });

      const data = await response.json() as GraphQLResponse;

      if (data.data?.collections?.nodes) {
        allCollections.push(...data.data.collections.nodes);
        
        hasNextPage = data.data.collections.pageInfo.hasNextPage;
        cursor = data.data.collections.pageInfo.endCursor;
      } else {
        hasNextPage = false;
      }

      // Safety check to prevent infinite loops
      if (allCollections.length > 1000) {
        console.warn("⚠️ Stopping at 1000 collections to prevent timeout");
        break;
      }
    }

        console.log(`📊 Successfully fetched ${allCollections.length} collections`);

        return NextResponse.json({
          success: true,
          collections: allCollections,
          totalCount: allCollections.length
        });

      } catch (error) {
        console.error("❌ Collection export error:", error);

        if (error instanceof Error && error.message === "Authentication failed") {
          return NextResponse.json(
            {
              success: false,
              collections: [],
              totalCount: 0,
              error: "Unauthorized - please authenticate"
            },
            { status: 401 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            collections: [],
            totalCount: 0,
            error: error instanceof Error ? error.message : "Unknown error"
          },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * POST endpoint to export collections with specific filters
 */
export async function POST(request: NextRequest): Promise<NextResponse<ExportResponse>> {
  try {
    // Step 1: Authenticate the request
    const { session, admin } = await authenticate(request);

    console.log("🔐 Authenticated for shop:", session.shop);

    // Step 2: Parse request body for filters
    const body = await request.json();
    const { 
      collectionType, // 'manual' | 'smart' | 'all'
      limit = 1000,
      publishedOnly = false
    } = body;

    // Step 3: Build query based on filters
    let queryString = '';
    if (collectionType === 'manual') {
      queryString = 'collection_type:custom';
    } else if (collectionType === 'smart') {
      queryString = 'collection_type:smart';
    }

    if (publishedOnly) {
      queryString += queryString ? ' AND published_status:published' : 'published_status:published';
    }

    // Step 4: Fetch collections with filters
    const allCollections: Collection[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage && allCollections.length < limit) {
      const response = await admin.graphql(`
        query getCollections($first: Int!, $after: String, $query: String) {
          collections(first: $first, after: $after, query: $query) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              title
              handle
              descriptionHtml
              updatedAt
              sortOrder
              templateSuffix
              image {
                url
              }
              seo {
                title
                description
              }
              ruleSet {
                appliedDisjunctively
                rules {
                  column
                  relation
                  condition
                }
              }
              productsCount {
                count
              }
            }
          }
        }
      `, {
        variables: {
          first: Math.min(50, limit - allCollections.length),
          after: cursor,
          query: queryString || undefined
        }
      });

      const data = await response.json() as GraphQLResponse;

      if (data.data?.collections?.nodes) {
        allCollections.push(...data.data.collections.nodes);
        
        hasNextPage = data.data.collections.pageInfo.hasNextPage;
        cursor = data.data.collections.pageInfo.endCursor;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`📊 Successfully fetched ${allCollections.length} collections with filters`);

    return NextResponse.json({
      success: true,
      collections: allCollections,
      totalCount: allCollections.length
    });

  } catch (error) {
    console.error("❌ Collection export error:", error);

    if (error instanceof Error && error.message === "Authentication failed") {
      return NextResponse.json(
        {
          success: false,
          collections: [],
          totalCount: 0,
          error: "Unauthorized - please authenticate"
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        collections: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}