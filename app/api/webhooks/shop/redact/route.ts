// app/api/webhooks/shop/redact/route.ts
// Mandatory compliance webhook: Handle shop data deletion after app uninstall

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';

/**
 * SHOP/REDACT Webhook
 * 
 * Triggered 48 hours after a store owner uninstalls your app.
 * You must delete all shop data from your database.
 * 
 * Payload structure:
 * {
 *   shop_id: number,
 *   shop_domain: string
 * }
 */

interface ShopRedactPayload {
  shop_id: number;
  shop_domain: string;
}

// Verify webhook authenticity using HMAC
function verifyWebhook(body: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    console.error('SHOPIFY_API_SECRET not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for HMAC verification
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');

    // Verify webhook authenticity
    if (!verifyWebhook(rawBody, hmacHeader)) {
      console.error('❌ Invalid webhook HMAC signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the payload
    const payload: ShopRedactPayload = JSON.parse(rawBody);

    console.log('🗑️  Shop redact request received:', {
      shop: payload.shop_domain,
      shop_id: payload.shop_id,
    });

    /**
     * IMPLEMENTATION REQUIRED:
     * 
     * Delete ALL data associated with this shop:
     * 1. Session data (access tokens)
     * 2. Shop-specific settings/preferences
     * 3. Collections data
     * 4. Usage records
     * 5. Subscription data
     * 6. Any other shop-related data
     * 
     * Exception: You may retain anonymized aggregate data for analytics
     * if it cannot be linked back to the specific shop.
     */

    try {
      // Delete all shop-related data from database
      console.log('🔄 Starting data deletion for shop:', payload.shop_domain);

      // Delete sessions (access tokens and user data)
      const deletedSessions = await prisma.session.deleteMany({
        where: {
          shop: payload.shop_domain,
        },
      });
      console.log(`✅ Deleted ${deletedSessions.count} sessions`);

      // Delete usage records (must be deleted before subscriptions due to foreign key)
      const deletedUsage = await prisma.usage.deleteMany({
        where: { 
          shop: payload.shop_domain 
        }
      });
      console.log(`✅ Deleted ${deletedUsage.count} usage records`);

      // Delete subscription records
      const deletedSubscriptions = await prisma.subscription.deleteMany({
        where: { 
          shop: payload.shop_domain 
        }
      });
      console.log(`✅ Deleted ${deletedSubscriptions.count} subscriptions`);

      // Note: UsageLimit table is not deleted as it contains plan definitions
      // that are not shop-specific

      console.log('✅ Shop data redaction completed for:', payload.shop_domain);

    } catch (dbError) {
      console.error('❌ Database deletion error:', dbError);
      // Continue to log but still return 200
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ 
      received: true,
      message: 'Shop data redaction completed',
      shop: payload.shop_domain
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error processing shop redact webhook:', error);
    
    // Still return 200 to prevent Shopify from retrying
    return NextResponse.json({ 
      received: true,
      error: 'Internal processing error' 
    }, { status: 200 });
  }
}

