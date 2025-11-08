// app/api/webhooks/customers/data-request/route.ts
// Mandatory compliance webhook: Handle customer data requests (GDPR)

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * CUSTOMERS/DATA_REQUEST Webhook
 * 
 * Triggered when a customer requests their data from a store owner.
 * You must provide the customer data to the store owner within 30 days.
 * 
 * Payload structure:
 * {
 *   shop_id: number,
 *   shop_domain: string,
 *   orders_requested: number[],
 *   customer: {
 *     id: number,
 *     email: string,
 *     phone: string
 *   },
 *   data_request: {
 *     id: number
 *   }
 * }
 */

interface CustomerDataRequestPayload {
  shop_id: number;
  shop_domain: string;
  orders_requested: number[];
  customer: {
    id: number;
    email: string;
    phone: string;
  };
  data_request: {
    id: number;
  };
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
    const payload: CustomerDataRequestPayload = JSON.parse(rawBody);

    console.log('📩 Customer data request received:', {
      shop: payload.shop_domain,
      customer_id: payload.customer.id,
      customer_email: payload.customer.email,
      data_request_id: payload.data_request.id,
      orders_count: payload.orders_requested?.length || 0,
    });

    /**
     * IMPLEMENTATION REQUIRED:
     * 
     * 1. Query your database for all data related to this customer
     * 2. Include data from orders if your app stores order information
     * 3. Compile the data into a readable format (JSON, CSV, or PDF)
     * 4. Send the data directly to the store owner
     * 5. Complete this within 30 days of receiving the request
     * 
     * Example implementation:
     * 
     * const customerData = await prisma.yourTable.findMany({
     *   where: {
     *     shop_domain: payload.shop_domain,
     *     customer_id: payload.customer.id
     *   }
     * });
     * 
     * // Send email to store owner with customer data
     * await sendEmail({
     *   to: storeOwnerEmail,
     *   subject: `Customer Data Request - ${payload.customer.email}`,
     *   body: JSON.stringify(customerData, null, 2)
     * });
     */

    // For now, log the request
    // TODO: Implement actual data collection and delivery
    console.log('⚠️  Action required: Provide customer data to store owner');
    console.log('   Customer:', payload.customer.email);
    console.log('   Shop:', payload.shop_domain);
    console.log('   Requested orders:', payload.orders_requested);

    // Return 200 to acknowledge receipt
    return NextResponse.json({ 
      received: true,
      message: 'Customer data request acknowledged'
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error processing customer data request webhook:', error);
    
    // Still return 200 to prevent Shopify from retrying
    return NextResponse.json({ 
      received: true,
      error: 'Internal processing error' 
    }, { status: 200 });
  }
}

