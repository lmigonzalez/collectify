import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/authenticate";

const APP_SUBSCRIPTIONS_QUERY = `#graphql
  query AppSubscriptionStatuses($first: Int!, $after: String) {
    currentAppInstallation {
      allSubscriptions(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            status
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
  }
`;

type AppSubscriptionNode = {
  id: string;
  status: string;
};

type AppSubscriptionsResponse = {
  currentAppInstallation: {
    allSubscriptions: {
      edges: Array<{
        cursor: string;
        node: AppSubscriptionNode;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
      };
    };
  };
};

type GraphQLResponse = {
  data?: AppSubscriptionsResponse;
  errors?: Array<{
    message: string;
  }>;
};

export async function GET(request: NextRequest) {
  try {
    const { admin } = await authenticate(request);

    const searchParams = request.nextUrl.searchParams;
    const firstParam = searchParams.get("first");
    const after = searchParams.get("after");

    const firstRaw = firstParam ? Number(firstParam) : 20;
    const first = Number.isFinite(firstRaw)
      ? Math.min(Math.max(firstRaw, 1), 250)
      : 20;

    const response = await admin.graphql<AppSubscriptionsResponse>(
      APP_SUBSCRIPTIONS_QUERY,
      {
        variables: {
          first,
          after: after ?? null,
        },
      }
    );

    const payload = (await response.json()) as GraphQLResponse;

    if (payload.errors?.length) {
      console.error("GraphQL errors fetching subscriptions:", payload.errors);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions", details: payload.errors },
        { status: 502 }
      );
    }

    const connection = payload.data?.currentAppInstallation.allSubscriptions;

    if (!connection) {
      return NextResponse.json(
        { error: "No subscription data returned from Shopify" },
        { status: 404 }
      );
    }

    const subscriptions = connection.edges.map((edge) => edge.node);

    return NextResponse.json({
      subscriptions: connection.edges.map((edge) => edge.node),
      statuses: subscriptions.map(({ id, status }) => ({ id, status })),
      edges: connection.edges,
      pageInfo: connection.pageInfo,
      requested: {
        first,
        after: after ?? null,
      },
    });
  } catch (error) {
    console.error("Error retrieving subscription history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
