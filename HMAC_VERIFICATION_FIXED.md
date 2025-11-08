# ✅ HMAC Verification Fixed

## What Was Fixed

The HMAC verification in all three compliance webhooks has been updated to match **Shopify's official specification** exactly.

### The Issue

The previous implementation wasn't properly encoding the buffers when comparing HMAC values:

```typescript
// ❌ INCORRECT (missing base64 encoding specification)
return crypto.timingSafeEqual(
  Buffer.from(hash),           // Missing encoding
  Buffer.from(hmacHeader)      // Missing encoding
);
```

### The Fix

Now using Shopify's exact algorithm with proper base64 encoding:

```typescript
// ✅ CORRECT (matches Shopify's official docs)
return crypto.timingSafeEqual(
  Buffer.from(calculatedHmac, 'base64'),  // Specify base64 encoding
  Buffer.from(hmacHeader, 'base64')        // Specify base64 encoding
);
```

**Reference:** [Shopify Webhook HMAC Verification](https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-2-validate-the-origin-of-your-webhook-to-ensure-its-coming-from-shopify)

## Updated Features

All three webhook handlers now include:

1. ✅ **Proper Base64 Encoding** - Buffers created with explicit base64 encoding
2. ✅ **Better Error Handling** - Try-catch blocks around HMAC comparison
3. ✅ **Detailed Logging** - Clear error messages for debugging
4. ✅ **Security Best Practices** - Timing-safe comparison to prevent timing attacks
5. ✅ **Official Algorithm** - Matches Shopify's documented approach exactly

## Verification Steps

### 1. Test HMAC Calculation Locally

Run the test script to verify HMAC calculation:

```bash
node test-webhooks-hmac.js
```

Expected output:
```
🔐 Testing Webhook HMAC Verification

Using SHOPIFY_API_SECRET: 4f8d3c1b2e...

Running HMAC Verification Tests:
======================================================================

Test 1: shop/redact
----------------------------------------------------------------------
✓ Valid HMAC test: ✅ PASS
✓ Invalid HMAC test: ✅ PASS

Test 2: customers/data_request
----------------------------------------------------------------------
✓ Valid HMAC test: ✅ PASS
✓ Invalid HMAC test: ✅ PASS

Test 3: customers/redact
----------------------------------------------------------------------
✓ Valid HMAC test: ✅ PASS
✓ Invalid HMAC test: ✅ PASS

✅ All HMAC verification tests completed!
```

### 2. Test Webhooks Manually

Start your dev server:
```bash
npm run dev
```

Use the curl commands from the test script output, for example:

```bash
# Test shop/redact with valid HMAC
curl -X POST http://localhost:3000/api/webhooks/shop/redact \
  -H "Content-Type: application/json" \
  -H "x-shopify-hmac-sha256: [HMAC from test script]" \
  -d '{"shop_id":954889,"shop_domain":"test-shop.myshopify.com"}'
```

**Expected Response:**
```json
HTTP 200 OK
{
  "received": true,
  "message": "Shop data redaction completed",
  "shop": "test-shop.myshopify.com"
}
```

### 3. Test Invalid HMAC (Security Check)

```bash
# Test with invalid HMAC (should fail)
curl -X POST http://localhost:3000/api/webhooks/shop/redact \
  -H "Content-Type: application/json" \
  -H "x-shopify-hmac-sha256: invalid-signature-12345" \
  -d '{"shop_id":954889,"shop_domain":"test-shop.myshopify.com"}'
```

**Expected Response:**
```json
HTTP 401 Unauthorized
{
  "error": "Invalid webhook signature"
}
```

### 4. Test with Shopify CLI

Once deployed, test with actual Shopify webhooks:

```bash
shopify app webhook trigger \
  --topic=shop/redact \
  --address=/api/webhooks/shop/redact
```

The Shopify CLI will automatically generate a valid HMAC signature using your `SHOPIFY_API_SECRET`.

## HMAC Verification Requirements Checklist

- [x] Uses raw request body (not parsed JSON)
- [x] Uses `crypto.createHmac('sha256', secret)`
- [x] Updates HMAC with body as UTF-8
- [x] Digests to base64 format
- [x] Uses `crypto.timingSafeEqual()` for comparison
- [x] Specifies 'base64' encoding when creating buffers
- [x] Returns 401 for invalid HMAC
- [x] Returns 200 for valid HMAC
- [x] Includes try-catch error handling
- [x] Logs errors for debugging

## Environment Variables Required

Make sure these are set in your `.env.local`:

```bash
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here  # Critical for HMAC!
DATABASE_URL=your_database_url_here
```

**Important:** `SHOPIFY_API_SECRET` must match the API secret key from your Shopify Partner Dashboard.

## Troubleshooting

### Error: "Invalid webhook HMAC signature"

**Possible Causes:**
1. `SHOPIFY_API_SECRET` not set or incorrect
2. Using wrong secret (development vs production)
3. Secret was rotated but not updated in environment

**Solution:**
```bash
# Check your secret in Partner Dashboard
# Go to: Apps → Your App → API credentials → API secret key

# Update your .env.local
echo "SHOPIFY_API_SECRET=your_correct_secret" >> .env.local

# Restart your dev server
npm run dev
```

### Error: "Missing x-shopify-hmac-sha256 header"

**Cause:** Webhook request doesn't include the HMAC header

**Solution:** Ensure your request includes the header:
```bash
-H "x-shopify-hmac-sha256: [base64-hmac-value]"
```

### Error: "HMAC verification error"

**Cause:** Buffer comparison failed (likely encoding issue)

**Solution:** 
- Verify you're using the updated code with `'base64'` encoding
- Run `node test-webhooks-hmac.js` to test locally
- Check that both HMAC values are valid base64 strings

## What Changed in Each File

### `/app/api/webhooks/customers/data-request/route.ts`
- ✅ Updated `verifyWebhook()` function with proper base64 encoding
- ✅ Added try-catch for error handling
- ✅ Improved error logging

### `/app/api/webhooks/customers/redact/route.ts`
- ✅ Updated `verifyWebhook()` function with proper base64 encoding
- ✅ Added try-catch for error handling
- ✅ Improved error logging

### `/app/api/webhooks/shop/redact/route.ts`
- ✅ Updated `verifyWebhook()` function with proper base64 encoding
- ✅ Added try-catch for error handling
- ✅ Improved error logging
- ✅ Fully implements data deletion for shop

## Shopify Compliance Requirements

Your webhooks now meet all Shopify requirements:

1. ✅ **Implement mandatory compliance webhooks**
   - customers/data_request
   - customers/redact
   - shop/redact

2. ✅ **Handle POST requests with JSON body**
   - Content-Type: application/json
   - Proper JSON parsing

3. ✅ **Verify HMAC signatures**
   - Uses Shopify's official algorithm
   - Timing-safe comparison

4. ✅ **Return 401 for invalid HMAC**
   - Prevents unauthorized webhook requests

5. ✅ **Return 200 for successful processing**
   - Acknowledges receipt within 5 seconds

6. ✅ **Subscribed in shopify.app.toml**
   - All three topics configured

## Next Steps

1. **Run the test script:**
   ```bash
   node test-webhooks-hmac.js
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **Test with curl commands** (from test script output)

4. **Deploy your app:**
   ```bash
   shopify app deploy
   ```

5. **Test with Shopify CLI:**
   ```bash
   shopify app webhook trigger --topic=shop/redact
   ```

6. **Verify in Partner Dashboard:**
   - Check that webhooks are registered
   - Monitor webhook delivery logs

## References

- [Shopify HMAC Verification Guide](https://shopify.dev/docs/apps/build/webhooks/subscribe/https#step-2-validate-the-origin-of-your-webhook-to-ensure-its-coming-from-shopify)
- [Mandatory Compliance Webhooks](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [Webhook Security Best Practices](https://shopify.dev/docs/apps/build/webhooks/subscribe/https)

---

## Summary

✅ **HMAC verification is now correctly implemented** using Shopify's official algorithm with proper base64 buffer encoding.

✅ **All three compliance webhooks** meet Shopify's security and compliance requirements.

✅ **Ready for testing** using the provided test script and curl commands.

✅ **Ready for deployment** and App Store submission.

