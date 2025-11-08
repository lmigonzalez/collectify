# Shopify Compliance Webhooks

This directory contains the mandatory compliance webhook handlers required for GDPR and privacy law compliance.

## Webhooks Implemented

### 1. Customer Data Request
**Path:** `/api/webhooks/customers/data-request`
**Topic:** `customers/data_request`

Handles requests for customer data access. When a customer requests their data from a store owner, this webhook is triggered.

**Implementation Status:** ⚠️ Placeholder (requires data collection logic)

### 2. Customer Redact
**Path:** `/api/webhooks/customers/redact`
**Topic:** `customers/redact`

Handles requests to delete customer data. Triggered 10 days to 6 months after a store owner requests customer data deletion.

**Implementation Status:** ⚠️ Placeholder (requires deletion logic if you store customer data)

**Note:** Based on your current Prisma schema, your app doesn't store customer-specific data (only shop-level data). This webhook is still required for compliance but may only need to log the request unless you add customer data storage in the future.

### 3. Shop Redact
**Path:** `/api/webhooks/shop/redact`
**Topic:** `shop/redact`

Handles shop data deletion after app uninstall. Triggered 48 hours after a merchant uninstalls your app.

**Implementation Status:** ✅ Fully implemented

**What it deletes:**
- All `Session` records (access tokens, user info)
- All `Usage` records (usage tracking)
- All `Subscription` records (subscription data)

## Security

All webhooks include HMAC signature verification to ensure requests are authentic and from Shopify.

- Valid requests: HTTP 200
- Invalid HMAC: HTTP 401 Unauthorized

## Testing

See `WEBHOOK_TESTING.md` in the root directory for testing commands.

Quick test:
```bash
shopify app webhook trigger --topic=shop/redact --address=/api/webhooks/shop/redact
```

## Configuration

Webhooks are configured in `shopify.app.toml`:

```toml
[[webhooks.subscriptions]]
compliance_topics = ["customers/data_request"]
uri = "/api/webhooks/customers/data-request"

[[webhooks.subscriptions]]
compliance_topics = ["customers/redact"]
uri = "/api/webhooks/customers/redact"

[[webhooks.subscriptions]]
compliance_topics = ["shop/redact"]
uri = "/api/webhooks/shop/redact"
```

## Next Steps

1. **Deploy your app** - Webhooks need to be accessible via HTTPS
2. **Test each webhook** using the Shopify CLI
3. **Verify registration** in Shopify Partner Dashboard
4. **Monitor logs** to ensure webhooks are processing correctly

## Documentation

- Full implementation guide: `COMPLIANCE_WEBHOOKS.md`
- Testing guide: `WEBHOOK_TESTING.md`
- Official Shopify docs: https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance

## Important

These webhooks are **mandatory** for all apps distributed through the Shopify App Store. Your app will be rejected if they're not properly implemented.

