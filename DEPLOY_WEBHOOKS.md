# Deploy and Activate Compliance Webhooks

## Current Status

✅ Webhook handlers are implemented
✅ Configuration is updated in `shopify.app.toml`
⏳ Webhooks need to be registered with Shopify

## Steps to Activate Webhooks

### Option 1: Development Environment (Recommended for Testing)

```bash
# Stop any running dev server
# Press Ctrl+C if your app is running

# Start the development server
# This will automatically register webhooks
npm run dev

# OR if using Shopify CLI directly
shopify app dev
```

When the dev server starts, it will:
1. Create a tunnel to your local app
2. Update the app URL in Shopify
3. Automatically register all webhooks from `shopify.app.toml`

**Look for this in the output:**
```
✓ Webhooks registered
  • customers/data_request → /api/webhooks/customers/data-request
  • customers/redact → /api/webhooks/customers/redact
  • shop/redact → /api/webhooks/shop/redact
```

### Option 2: Production Deployment

```bash
# Deploy your app to production
shopify app deploy

# Follow the prompts
# This will create an app version and register webhooks
```

After deployment:
1. Webhooks are automatically registered
2. Changes take effect immediately
3. You can verify in Partner Dashboard

### Option 3: Manual Webhook Registration (If Needed)

If webhooks don't auto-register, you can trigger registration manually by having a merchant reinstall the app or by using the OAuth callback.

## Verify Webhooks Are Registered

### Method 1: Check Shopify Partner Dashboard

1. Go to https://partners.shopify.com
2. Navigate to: **Apps** → **Your App** → **API credentials**
3. Scroll to **Webhooks** section
4. You should see:
   - `customers/data_request` → `/api/webhooks/customers/data-request`
   - `customers/redact` → `/api/webhooks/customers/redact`
   - `shop/redact` → `/api/webhooks/shop/redact`

### Method 2: Check Webhook Status via API

The webhooks are registered during the OAuth callback process. You can check the logs in your auth callback route.

Look for this log message:
```
✅ Webhooks registered
```

in `/app/api/auth/callback/route.ts` (line 55)

### Method 3: Test Webhook Delivery

```bash
# Test if webhooks are accessible
shopify app webhook trigger \
  --topic=shop/redact \
  --address=/api/webhooks/shop/redact

# If successful, you'll see HTTP 200 response
```

## Common Issues and Solutions

### Issue: "Webhooks not registered" Error

**Solution 1: Restart Dev Server**
```bash
# Stop current server (Ctrl+C)
# Clear any caches
rm -rf .next

# Restart
npm run dev
```

**Solution 2: Reinstall App**
1. Uninstall the app from your test store
2. Reinstall it
3. Webhooks will be registered during OAuth callback

**Solution 3: Verify OAuth Callback**

Check that this code in `/app/api/auth/callback/route.ts` is running:

```typescript
try {
  await shopify.webhooks.register({ session });
  console.log('✅ Webhooks registered');
} catch (webhookError) {
  console.error('Webhook registration failed:', webhookError);
}
```

### Issue: "Invalid webhook URL" Error

**Cause:** App URL is localhost or not HTTPS

**Solution:** Use the Shopify dev tunnel
```bash
# Make sure you're using shopify app dev, not npm run dev
shopify app dev

# This creates an HTTPS tunnel automatically
```

### Issue: Webhooks Return 401

**Cause:** HMAC verification failing

**Solution:** Check environment variables
```bash
# Verify SHOPIFY_API_SECRET is set
echo $SHOPIFY_API_SECRET

# Should match your Partner Dashboard API secret key
```

### Issue: Webhooks Not Appearing in Partner Dashboard

**Cause:** Need to deploy changes

**Solution:** Deploy the app
```bash
shopify app deploy
```

## What Happens During Registration?

When you start your dev server or deploy:

1. **Shopify CLI reads `shopify.app.toml`**
   - Finds the three `[[webhooks.subscriptions]]` entries
   - Sees they're `compliance_topics`

2. **Registers webhooks with Shopify**
   - Sends the webhook configuration to Shopify API
   - Shopify stores: "This app should receive these webhooks"

3. **During OAuth callback** (when merchant installs)
   - `shopify.webhooks.register({ session })` is called
   - Subscribes the specific shop to the webhooks
   - Creates webhook subscriptions for that shop

## Immediate Steps to Fix the Error

```bash
# 1. Stop your current dev server (if running)
# Press Ctrl+C

# 2. Clear Next.js cache
rm -rf .next

# 3. Start the development server
npm run dev

# 4. Look for "Webhooks registered" in the output

# 5. If testing, reinstall the app in your test store
# Go to: https://[your-store].myshopify.com/admin/apps
# Uninstall and reinstall your app
```

## Expected Output

When successful, you should see:

```
npm run dev

> collectify@0.1.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2s
✓ Compiled /api/auth/callback
✓ Webhooks registered
```

And in your OAuth callback logs:
```
✅ Token saved for shop: your-store.myshopify.com
✅ Webhooks registered
```

## Test the Webhooks

After registration, test each webhook:

```bash
# 1. Test shop redact (fully implemented)
shopify app webhook trigger \
  --topic=shop/redact \
  --address=/api/webhooks/shop/redact

# Expected: HTTP 200, logs show data deletion

# 2. Test customer data request
shopify app webhook trigger \
  --topic=customers/data_request \
  --address=/api/webhooks/customers/data-request

# Expected: HTTP 200

# 3. Test customer redact
shopify app webhook trigger \
  --topic=customers/redact \
  --address=/api/webhooks/customers/redact

# Expected: HTTP 200
```

## Verification Checklist

- [ ] `shopify.app.toml` has all three webhook subscriptions
- [ ] Webhook handler files exist in `/app/api/webhooks/`
- [ ] Dev server started successfully
- [ ] "Webhooks registered" message appears in logs
- [ ] Webhooks visible in Shopify Partner Dashboard
- [ ] Test webhooks return HTTP 200
- [ ] HMAC verification works (test with invalid signature returns 401)

## Still Having Issues?

If you're still seeing the error after following these steps:

1. **Check the exact error message** - Share the full error text
2. **Check your app URL** - Must be HTTPS and publicly accessible
3. **Check Partner Dashboard** - Verify webhooks are listed
4. **Check deployment status** - May need to deploy with `shopify app deploy`

## Production Deployment

When ready for production:

```bash
# 1. Deploy your app
shopify app deploy

# 2. Release the version
# Follow the CLI prompts to release

# 3. Verify in Partner Dashboard
# Check that webhooks are active

# 4. Submit for app review
# The webhooks will be verified during review
```

Your app is now compliant with Shopify's mandatory webhook requirements! 🎉

