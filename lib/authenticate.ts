// lib/authenticate.ts
// Helper functions to authenticate requests and get shop sessions

import { NextRequest } from "next/server";
import shopify from "./shopify";
import { Session, RequestedTokenType } from "@shopify/shopify-api";

// Type for the admin GraphQL client
type AdminClient = {
  graphql: <T = any>(
    query: string,
    options?: { variables?: any }
  ) => Promise<{
    json: () => Promise<{ data: T }>;
  }>;
};

type AuthResult = {
  session: Session;
  admin: AdminClient;
};

/**
 * METHOD 1: Authenticate using session cookies (non-embedded apps)
 * Use this for regular web apps or API routes accessed directly
 */
export async function authenticateAdmin(
  request: NextRequest
): Promise<AuthResult> {
  try {
    // Get session ID from request cookies
    const sessionId = await shopify.session.getCurrentId({
      isOnline: false, // Use offline sessions for long-lived tokens
      rawRequest: request,
    });

    if (!sessionId) {
      throw new Error("No session found");
    }

    // Load the full session from database
    // THIS RETRIEVES THE ACCESS TOKEN
    const session = await shopify.config.sessionStorage.loadSession(sessionId);

    if (!session || !session.accessToken) {
      throw new Error("Invalid session - no access token");
    }

    // Create a GraphQL client with the session
    const client = new shopify.clients.Graphql({ session });

    return {
      session,
      admin: {
        // Wrapper function to make GraphQL queries with type support
        graphql: async <T = any>(
          query: string,
          options?: { variables?: any }
        ) => {
          // v12+ API: use request method instead of query
          const response = await client.request(query, {
            variables: options?.variables,
          });

          // Return a Response-like object for compatibility
          return {
            json: async () => response as { data: T },
          };
        },
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);
    throw new Error("Authentication failed");
  }
}

/**
 * METHOD 2: Get session from JWT token (embedded apps)
 *
 * For embedded apps, the frontend uses App Bridge to get a session token (JWT)
 * This JWT contains the shop domain and is signed by Shopify
 *
 * Flow:
 * 1. Frontend calls shopify.idToken() to get JWT
 * 2. JWT sent in Authorization header to API route
 * 3. Backend decodes JWT to get shop domain
 * 4. Backend loads session from database using shop
 * 5. Use the access token from session to call Shopify API
 */
export async function getSessionFromToken(
  request: NextRequest
): Promise<Session | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Decode and verify the JWT token from App Bridge
    const payload = await shopify.session.decodeSessionToken(token);

    // Extract shop domain from JWT
    const shop = payload.dest.replace("https://", "");

    // Create session ID for offline token
    const sessionId = shopify.session.getOfflineId(shop);

    // Load session from database - THIS GETS THE ACCESS TOKEN
    const session = await shopify.config.sessionStorage.loadSession(sessionId);

    return session || null;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

/**
 * METHOD 3: Authenticate embedded app requests
 * Uses token exchange to get/create session automatically
 */
export async function authenticate(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error(
      "Missing Authorization header - App Bridge not configured correctly"
    );
  }

  const sessionToken = authHeader.replace("Bearer ", "");

  try {
    // Decode session token to get shop
    const payload = await shopify.session.decodeSessionToken(sessionToken);
    const shop = payload.dest.replace("https://", "");

    // Try to load existing session
    const sessionId = shopify.session.getOfflineId(shop);
    let session = await shopify.config.sessionStorage.loadSession(sessionId);

    // If no session exists, use token exchange to create one
    if (!session) {
      console.log("🔄 No session found, using token exchange for shop:", shop);

      try {
        const { session: newSession } = await shopify.auth.tokenExchange({
          shop,
          sessionToken,
          requestedTokenType: RequestedTokenType.OfflineAccessToken,
        });

        console.log("✅ Token exchange successful, received session:", {
          shop: newSession.shop,
          hasAccessToken: !!newSession.accessToken,
          scope: newSession.scope,
        });

        // Store the session in database
        await shopify.config.sessionStorage.storeSession(newSession);
        console.log("✅ Session saved to database for shop:", shop);

        session = newSession;
      } catch (tokenExchangeError) {
        console.error("❌ Token exchange failed:", tokenExchangeError);
        throw new Error(
          `Token exchange failed: ${
            tokenExchangeError instanceof Error
              ? tokenExchangeError.message
              : "Unknown error"
          }. Make sure the app is approved on the store.`
        );
      }
    }

    if (!session.accessToken) {
      throw new Error("Session has no access token");
    }

    // Create GraphQL client
    const client = new shopify.clients.Graphql({ session });

    return {
      session,
      admin: {
        graphql: async <T = any>(
          query: string,
          options?: { variables?: any }
        ) => {
          // v12+ API: pass query and variables in data object
          const response = await client.request(query, {
            variables: options?.variables,
          });

          // Return a Response-like object for compatibility
          return {
            json: async () => response as { data: T },
          };
        },
      },
    };
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    throw new Error("Authentication failed");
  }
}

/**
 * IMPORTANT NOTES:
 *
 * 1. OFFLINE vs ONLINE tokens:
 *    - Offline: Long-lived, survive user logout, for background tasks
 *    - Online: Short-lived, tied to user session, expire when user logs out
 *
 * 2. ACCESS TOKEN LOCATION:
 *    - Stored in database Session table
 *    - Retrieved via shopify.config.sessionStorage.loadSession()
 *    - Used by GraphQL client automatically when you pass the session
 *
 * 3. SECURITY:
 *    - JWT tokens from App Bridge are signed by Shopify
 *    - shopify.session.decodeSessionToken() verifies signature
 *    - Always validate tokens before using them
 */
