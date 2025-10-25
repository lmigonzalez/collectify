// app/api/auth/callback/route.ts
// OAuth Step 2: Handle OAuth callback and store token

import { NextRequest, NextResponse } from 'next/server';
import shopify from '@/lib/shopify';

/**
 * This route handles the OAuth callback from Shopify
 * THIS IS WHERE THE TOKEN IS RECEIVED AND STORED
 * 
 * Flow:
 * 1. Shopify redirects here with authorization code
 * 2. We exchange code for access token
 * 3. Token is automatically saved to database via PrismaSessionStorage
 * 4. User is redirected to app
 */
export async function GET(request: NextRequest) {
  try {
    // Complete OAuth process
    // This function:
    // 1. Validates the callback parameters
    // 2. Exchanges authorization code for access token
    // 3. Creates a Session object
    // 4. Calls sessionStorage.storeSession() to save to database
    const callback = await shopify.auth.callback({
      rawRequest: request,
      rawResponse: NextResponse,
    });

    const { session } = callback;

    /**
     * AT THIS POINT:
     * - session.accessToken contains the token
     * - session.shop contains the store domain
     * - The session has been saved to the database
     * 
     * Database Session table now has:
     * {
     *   id: "offline_example.myshopify.com",
     *   shop: "example.myshopify.com",
     *   accessToken: "shpat_abc123...",  ← THE TOKEN
     *   scope: "write_products,read_orders",
     *   isOnline: false,
     *   expires: null,  // offline tokens don't expire
     *   ...
     * }
     */

    console.log('✅ Token saved for shop:', session.shop);

    // Optional: Register webhooks
    try {
      await shopify.webhooks.register({ session });
      console.log('✅ Webhooks registered');
    } catch (webhookError) {
      console.error('Webhook registration failed:', webhookError);
      // Don't fail the whole auth flow if webhooks fail
    }

    // Construct redirect URL to your app
    // Include shop and host parameters for embedded apps
    const host = Buffer.from(`${session.shop}/admin`).toString('base64');
    const redirectUrl = `${process.env.SHOPIFY_APP_URL}?shop=${session.shop}&host=${host}`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Auth callback error:', error);
    
    // Redirect to error page or login
    return NextResponse.redirect(
      `${process.env.SHOPIFY_APP_URL}/auth/error?message=auth_failed`
    );
  }
}

/**
 * WHAT HAPPENS IN THE CALLBACK:
 * 
 * 1. Shopify redirects to:
 *    https://your-app.com/api/auth/callback?
 *      code=AUTHORIZATION_CODE&
 *      hmac=SIGNATURE&
 *      shop=example.myshopify.com&
 *      state=RANDOM_STATE
 * 
 * 2. shopify.auth.callback() does:
 *    - Validates HMAC signature
 *    - Validates state matches
 *    - Makes POST request to Shopify to exchange code for token
 *    - Shopify responds with access token
 *    - Creates Session object with token
 *    - Calls sessionStorage.storeSession(session) → Saves to database
 * 
 * 3. Token is now in database and can be retrieved later
 * 
 * 4. User is redirected to app with session cookie set
 */

/**
 * HOW TO RETRIEVE THE TOKEN LATER:
 * 
 * Method 1 - Using shop domain:
 *   const sessionId = shopify.session.getOfflineId('example.myshopify.com');
 *   const session = await shopify.config.sessionStorage.loadSession(sessionId);
 *   console.log(session.accessToken); // The token!
 * 
 * Method 2 - Using session ID from cookies:
 *   const sessionId = await shopify.session.getCurrentId({ request });
 *   const session = await shopify.config.sessionStorage.loadSession(sessionId);
 *   console.log(session.accessToken); // The token!
 * 
 * Method 3 - Using our helper function:
 *   const { session } = await authenticateAdmin(request);
 *   console.log(session.accessToken); // The token!
 */

