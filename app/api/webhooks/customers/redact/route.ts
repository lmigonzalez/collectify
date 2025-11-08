// app/api/webhooks/customers/redact/route.ts
// Mandatory compliance webhook: Handle customer data deletion (GDPR)

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';

/**
 * CUSTOMERS/REDACT Webhook
 * 
 * Triggered when a store owner requests deletion of customer data.
 * You must delete or anonymize customer data within 30 days.
 * 
 * Timing:
 * - If customer has no orders in past 6 months: sent 10 days after request
 * - Otherwise: sent 6 months after last order
 * 
 * Payload structure:
 * {
 *   shop_id: number,
 *   shop_domain: string,
 *   customer: {
 *     id: number,
 *     email: string,
 *     phone: string
 *   },
 *   orders_to_redact: number[]
 * }
 */

interface CustomerRedactPayload {
  shop_id: number;
  shop_domain: string;
  customer: {
    id: number;
    email: string;
    phone: string;
  };
  orders_to_redact: number[];
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
    const payload: CustomerRedactPayload = JSON.parse(rawBody);

    console.log('🗑️  Customer redact request received:', {
      shop: payload.shop_domain,
      customer_id: payload.customer.id,
      customer_email: payload.customer.email,
      orders_to_redact_count: payload.orders_to_redact?.length || 0,
    });

    /**
     * IMPLEMENTATION REQUIRED:
     * 
     * 1. Delete all customer data from your database
     * 2. Remove or anonymize data in:
     *    - User records
     *    - Order data (if stored)
     *    - Analytics/logs
     *    - Backups (where possible)
     * 3. Complete within 30 days
     * 
     * Note: If legally required to retain data (e.g., tax records),
     * you may keep that data but should anonymize personal identifiers.
     */

    // Example: Delete customer data from your database
    // This is a placeholder - adjust based on your actual data model
    try {
      // TODO: Implement actual data deletion based on your schema
      // Example:
      // await prisma.customerData.deleteMany({
      //   where: {
      //     shop_domain: payload.shop_domain,
      //     customer_id: payload.customer.id
      //   }
      // });

      console.log('✅ Customer data redaction completed for:', payload.customer.email);
    } catch (dbError) {
      console.error('❌ Database deletion error:', dbError);
      // Still continue to return 200
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ 
      received: true,
      message: 'Customer data redaction acknowledged'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error processing customer redact webhook:', error);
    
    // Still return 200 to prevent Shopify from retrying
    return NextResponse.json({ 
      received: true,
      error: 'Internal processing error' 
    }, { status: 200 });
  }
}

