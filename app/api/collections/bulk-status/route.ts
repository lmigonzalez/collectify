// app/api/collections/bulk-status/route.ts
// Check the status of bulk operations

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";

interface BulkOperationStatus {
  id: string;
  status: string;
  errorCode?: string;
  createdAt: string;
  completedAt?: string;
  objectCount?: string;
  fileSize?: string;
  url?: string;
  partialDataUrl?: string;
}

interface BulkStatusResult {
  success: boolean;
  bulkOperation?: BulkOperationStatus;
  message: string;
  error?: string;
}

interface GraphQLResponse {
  data?: {
    node?: BulkOperationStatus;
    currentBulkOperation?: BulkOperationStatus;
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * GET endpoint to check bulk operation status
 */
export async function GET(request: NextRequest): Promise<NextResponse<BulkStatusResult>> {
  try {
    // Step 1: Authenticate the request
    const { session, admin } = await authenticate(request);

    console.log("🔐 Authenticated for shop:", session.shop);

    // Step 2: Get bulk operation ID from query params
    const { searchParams } = new URL(request.url);
    const bulkOperationId = searchParams.get('id');

    if (!bulkOperationId) {
      return NextResponse.json(
        {
          success: false,
          message: "No bulk operation ID provided",
          error: "No bulk operation ID provided"
        },
        { status: 400 }
      );
    }

    // Step 3: Query bulk operation status
    const response = await admin.graphql(`
      query getBulkOperation($id: ID!) {
        node(id: $id) {
          ... on BulkOperation {
            id
            status
            errorCode
            createdAt
            completedAt
            objectCount
            fileSize
            url
            partialDataUrl
          }
        }
      }
    `, {
      variables: {
        id: bulkOperationId
      }
    });

    const data = await response.json() as GraphQLResponse;

    if (data.data?.node) {
      const bulkOperation: BulkOperationStatus = data.data.node;
      
      return NextResponse.json({
        success: true,
        bulkOperation,
        message: `Bulk operation ${bulkOperation.status.toLowerCase()}`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Bulk operation not found",
          error: "Bulk operation not found"
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error("❌ Bulk status check error:", error);

    if (error instanceof Error && error.message === "Authentication failed") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - please authenticate",
          error: "Unauthorized - please authenticate"
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to get current bulk operation status
 */
export async function POST(request: NextRequest): Promise<NextResponse<BulkStatusResult>> {
  try {
    // Step 1: Authenticate the request
    const { session, admin } = await authenticate(request);

    console.log("🔐 Authenticated for shop:", session.shop);

    // Step 2: Query current bulk operation status
    const response = await admin.graphql(`
      query {
        currentBulkOperation(type: MUTATION) {
          id
          status
          errorCode
          createdAt
          completedAt
          objectCount
          fileSize
          url
          partialDataUrl
        }
      }
    `);

    const data = await response.json() as GraphQLResponse;

    if (data.data?.currentBulkOperation) {
      const bulkOperation: BulkOperationStatus = data.data.currentBulkOperation;
      
      return NextResponse.json({
        success: true,
        bulkOperation,
        message: `Current bulk operation ${bulkOperation.status.toLowerCase()}`,
      });
    } else {
      return NextResponse.json(
        {
          success: true,
          message: "No current bulk operation",
        }
      );
    }

  } catch (error) {
    console.error("❌ Current bulk status check error:", error);

    if (error instanceof Error && error.message === "Authentication failed") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - please authenticate",
          error: "Unauthorized - please authenticate"
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
