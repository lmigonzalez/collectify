# Testing Compliance Webhooks

## Quick Test Commands

Once your app is deployed and accessible via HTTPS, you can test the webhooks using the Shopify CLI:

### 1. Test Customer Data Request

```bash
shopify app webhook trigger \
  --topic=customers/data_request \
  --address=/api/webhooks/customers/data-request
```

This will send a test payload:
```json
{
  "shop_id": 954889,
  "shop_domain": "test-shop.myshopify.com",
  "orders_requested": [299938, 280263, 220458],
  "customer": {
    "id": 191167,
    "email": "john@example.com",
    "phone": "555-625-1199"
  },
  "data_request": {
    "id": 9999
  }
}
```

**Expected Response:** HTTP 200 with `{ "received": true, "message": "Customer data request acknowledged" }`

### 2. Test Customer Redact

```bash
shopify app webhook trigger \
  --topic=customers/redact \
  --address=/api/webhooks/customers/redact
```

This will send a test payload:
```json
{
  "shop_id": 954889,
  "shop_domain": "test-shop.myshopify.com",
  "customer": {
    "id": 191167,
    "email": "john@example.com",
    "phone": "555-625-1199"
  },
  "orders_to_redact": [299938, 280263, 220458]
}
```

**Expected Response:** HTTP 200 with `{ "received": true, "message": "Customer data redaction acknowledged" }`

### 3. Test Shop Redact

```bash
shopify app webhook trigger \
  --topic=shop/redact \
  --address=/api/webhooks/shop/redact
```

This will send a test payload:
```json
{
  "shop_id": 954889,
  "shop_domain": "test-shop.myshopify.com"
}
```

**Expected Response:** HTTP 200 with:
```json
{
  "received": true,
  "message": "Shop data redaction completed",
  "shop": "test-shop.myshopify.com"
}
```

## What Each Webhook Does

### 📊 Customer Data Request (`customers/data_request`)
**Status:** ⚠️ Placeholder Implementation

**Current Behavior:**
- ✅ Receives webhook
- ✅ Verifies HMAC signature
- ✅ Logs the request
- ⚠️ Does NOT collect/send customer data (you need to implement this)

**What You Need to Implement:**
1. Query your database for all customer-related data
2. Compile into a readable format (JSON, CSV, or PDF)
3. Send to the store owner's email
4. Complete within 30 days

### 🗑️ Customer Redact (`customers/redact`)
**Status:** ⚠️ Placeholder Implementation

**Current Behavior:**
- ✅ Receives webhook
- ✅ Verifies HMAC signature
- ✅ Logs the request
- ⚠️ Does NOT delete customer data (you need to implement this)

**What You Need to Implement:**
1. Delete all customer-related data from your database
2. Remove or anonymize personal information
3. Complete within 30 days

**Note:** Your app currently doesn't store customer-specific data (based on Prisma schema), so this might just be logging for compliance.

### 🏪 Shop Redact (`shop/redact`)
**Status:** ✅ Fully Implemented

**Current Behavior:**
- ✅ Receives webhook
- ✅ Verifies HMAC signature
- ✅ Deletes all Session records for the shop
- ✅ Deletes all Usage records for the shop
- ✅ Deletes all Subscription records for the shop
- ✅ Preserves UsageLimit (global plan definitions)

**Deleted Data:**
- Access tokens and OAuth sessions
- User information (firstName, lastName, email)
- Subscription records
- Usage tracking records

**Preserved Data:**
- UsageLimit (plan definitions - not shop-specific)

## Checking Logs

After triggering a webhook, check your application logs:

```bash
# If using development server
npm run dev

# Look for these log messages:
# 📩 Customer data request received: { shop, customer_id, customer_email, ... }
# 🗑️ Customer redact request received: { shop, customer_id, customer_email, ... }
# 🗑️ Shop redact request received: { shop, shop_id }
```

For shop/redact, you should see:
```
🔄 Starting data deletion for shop: test-shop.myshopify.com
✅ Deleted N sessions
✅ Deleted N usage records
✅ Deleted N subscriptions
✅ Shop data redaction completed for: test-shop.myshopify.com
```

## Verify HMAC Signature

The webhooks verify the HMAC signature to ensure requests are from Shopify:

1. Get the raw request body
2. Calculate HMAC-SHA256 using `SHOPIFY_API_SECRET`
3. Compare with `x-shopify-hmac-sha256` header
4. Return 401 if signatures don't match

**Testing HMAC:**

When using `shopify app webhook trigger`, the CLI automatically includes a valid HMAC signature. To test HMAC verification:

```bash
# This should succeed (valid HMAC from CLI)
shopify app webhook trigger --topic=shop/redact --address=/api/webhooks/shop/redact

# To test invalid HMAC, you'd need to send a manual request
curl -X POST https://your-app.com/api/webhooks/shop/redact \
  -H "Content-Type: application/json" \
  -H "x-shopify-hmac-sha256: invalid-signature" \
  -d '{"shop_id": 123, "shop_domain": "test.myshopify.com"}'
# Expected: 401 Unauthorized
```

## Webhook Registration Status

After installing your app, verify webhooks are registered:

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Apps → Your App → API credentials
3. Scroll to **Webhooks** section
4. Confirm all three compliance webhooks are listed:
   - `customers/data_request` → `/api/webhooks/customers/data-request`
   - `customers/redact` → `/api/webhooks/customers/redact`
   - `shop/redact` → `/api/webhooks/shop/redact`

## Troubleshooting

### Webhook Returns 401

**Cause:** HMAC verification failed

**Solutions:**
1. Check `SHOPIFY_API_SECRET` environment variable
2. Ensure it matches the API secret in Partner Dashboard
3. Verify you're reading the raw body (not parsed JSON) for HMAC calculation

### Webhook Not Found (404)

**Cause:** Route doesn't exist or app not deployed

**Solutions:**
1. Verify files exist in `app/api/webhooks/`
2. Restart your development server
3. Redeploy your app

### Webhook Times Out

**Cause:** Webhook took too long to respond

**Solutions:**
1. Process heavy operations asynchronously
2. Return 200 immediately, then process in background
3. Keep webhook handlers fast (<5 seconds)

### Database Deletion Fails

**Cause:** Foreign key constraints or database error

**Solutions:**
1. Check the order of deletions (delete child records first)
2. Current order: Usage → Subscription (due to foreign key)
3. Check database logs for specific errors

## Production Checklist

Before going live:

- [ ] Webhooks return 200 for valid requests
- [ ] Webhooks return 401 for invalid HMAC
- [ ] HMAC verification is working correctly
- [ ] All database deletions work without errors
- [ ] Logs show successful processing
- [ ] Tested all three webhook topics
- [ ] Webhooks registered in Partner Dashboard
- [ ] App URL is HTTPS with valid SSL certificate

## Environment Variables Required

Make sure these are set:

```bash
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret  # Required for HMAC verification
DATABASE_URL=your_database_url
```

## Real-World Webhook Timing

Remember, these aren't just test webhooks:

- **customers/data_request**: Triggered when a real customer requests their data
- **customers/redact**: Triggered 10 days to 6 months after deletion request (depending on order history)
- **shop/redact**: Triggered 48 hours after merchant uninstalls your app

Your webhook handlers must reliably process these in production!

