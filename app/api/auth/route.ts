// app/api/auth/route.ts
// OAuth Step 1: Initiate OAuth flow

import { NextRequest, NextResponse } from 'next/server';
import shopify from '@/lib/shopify';

/**
 * This route initiates the OAuth flow
 * 
 * Flow:
 * 1. User visits your app
 * 2. App redirects to this route with ?shop=storename.myshopify.com
 * 3. This route redirects to Shopify's OAuth page
 * 4. User approves permissions
 * 5. Shopify redirects to callback route with authorization code
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json(
      { error: 'Missing shop parameter' }, 
      { status: 400 }
    );
  }

  try {
    // Sanitize shop domain to prevent injection attacks
    const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
    
    if (!sanitizedShop) {
      return NextResponse.json(
        { error: 'Invalid shop domain' }, 
        { status: 400 }
      );
    }

    // Begin OAuth process
    // This creates a redirect URL to Shopify's OAuth page
    const authRoute = await shopify.auth.begin({
      shop: sanitizedShop,
      callbackPath: '/api/auth/callback', // Where Shopify redirects after approval
      isOnline: false, // Use offline tokens for long-lived access
      rawRequest: request,
      rawResponse: NextResponse,
    });

    // Redirect user to Shopify OAuth page
    return NextResponse.redirect(authRoute);
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authentication' }, 
      { status: 500 }
    );
  }
}

/**
 * WHAT HAPPENS:
 * 
 * 1. User visits: https://your-app.com/api/auth?shop=example.myshopify.com
 * 2. This route redirects to:
 *    https://example.myshopify.com/admin/oauth/authorize?
 *      client_id=YOUR_API_KEY&
 *      scope=write_products,read_orders&
 *      redirect_uri=https://your-app.com/api/auth/callback&
 *      state=RANDOM_STATE
 * 
 * 3. User sees permission request page
 * 4. User clicks "Install app" or "Approve"
 * 5. Shopify redirects to callback with authorization code
 */

